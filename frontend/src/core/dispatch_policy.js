/* 看护调度：策略模块。纯计算，不依赖游戏，不读时钟，不改任何状态。
   上游：适配层 dispatch.js 按下面的快照格式交进来。下游：返回下面的分配格式，适配层负责执行。
   这个文件在浏览器里挂 CY.dispatchPolicy，在 Node 里 require 即用，所以测试，仿真，后端，AI 都可以单独拿它用。
   核心计算都在这里：看护人选择的代价函数，疲劳分档，需求拆分，睡眠底线，疲劳增量，出手效果折扣。符号和公式写在下面各函数的注释里，默认参数在 DEFAULTS。

   快照 S：
     t            游戏分钟
     night        是否夜间
     feeding      'formula' 或 'breast'
     meal_due     家里是否该做一顿饭
     duty         { 婴幼儿id: 现任看护人id }
     people[]     { id, stage, role, dep, watch, cries, cry_at, night_help, lead, asleep, bedridden, away, room, lactating, fatigue, needs{需求:压力}, urgency, hands, roll }
                  stage 是 infant toddler child teen adult elder 之一；dep 是需要被照顾的人；lead 是玩家扮演的主角；
                  watch 是醒着时需要有人盯着，由阶段或疾病决定；dep 是会被派去做事的人；cries 是需求重了会哭，cry_at 是哭的阈值，来自类别数据，有 cries 就必须给；night_help 是夜里要人帮，比如夜尿多；
                  role 是角色卡的身份，决定夜里听见的程度；roll 是适配层给每个人每一步掷好的 0 到 1 的数，策略本身不掷骰子，所以仍是纯函数；
                  fatigue 和 needs 都是压力，0 是正常，1 是到顶；hands 为真是手上的活还没做完；urgency 是紧迫度乘最高需求。
   分配 P：
     watch        { 婴幼儿id: 看护人id 或 null }，null 是没有人可派
     wake sleep   要叫醒的人 id，要去睡的人 id
     tasks[]      { cg: 看护人id, target: 被照顾人id, need: 需求 }，一人一步最多一件
     cook         做饭的人 id 或 null
     unmet        没有人可盯的人 id
     unheard      有声音或有需要，但睡着的人都没听见的人 id
     depleted     被派了但疲劳已到底线的看护人 id */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) { root.CY = root.CY || {}; root.CY.dispatchPolicy = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /* 参数。游戏里由 templates/system.yaml 的 dispatch 覆盖；没有数据来源的参数都是假设，用到时要做敏感性分析 */
  const DEFAULTS = {
    step_minutes: 5,
    watch_stages: ['infant', 'toddler'],   /* 醒着时必须有人盯着的阶段，适配层据此给快照里的人标 watch，疾病也可以标 */
    act_at: 0.45,        /* 被照看的人某项需求压力超过它，才派人动手 */
    sleep_at: 0.72,      /* 看护人疲劳压力到这里，有人接手就去睡 */
    floor: 0.95,         /* 疲劳压力到这里不再优先派他，除非没有别人 */
    nap_minutes: 120,
    watch_extra: 0.03,   /* 盯着一个人，每游戏小时额外加的疲劳压力，和手上的活是两条独立的通道 */
    hands_extra: 0.04,   /* 手上的活，每游戏小时额外加的疲劳压力 */
    efficiency: 0.7,     /* 家人出手的效果，玩家自己动手是 1 */
    depl_loss: 0.5,      /* 看护人疲劳从 sleep_at 一路涨到 1，出手效果最多再打掉这么多 */
    elder_mult: 1.3,     /* 老人看护同样的时间更累 */
    meal_at: 0.6,        /* 醒着的人饿到这里，家里需要有人做一顿饭 */
    meal_gap: 180,       /* 两顿饭之间至少隔这么多游戏分钟 */
    cook_minutes: 45,    /* 做一顿饭占手上的活这么久 */
    lactating: ['mom', 'wife', 'young_woman'],   /* 母乳喂养时，只有这些人能喂婴儿 */
    /* 夜里睡着的人听不听得见：睡觉压制大部分的需求响应，但哭声不好压，没声音的需求几乎听不见。
       hear 是睡着的人听见一声哭后，这一步醒来的几率，按角色卡身份，妈妈最高，爸爸次之，老人再次；全是假设，没有数据来源 */
    hear: { mom: 0.7, wife: 0.7, young_woman: 0.7, dad: 0.4, husband: 0.4, young_man: 0.4, default: 0.35 },
    hear_quiet: 0.3,     /* 没有哭，只是需求高了，比如湿了，吐奶，听不见，只能看状态，声音的强度只有哭的这么多 */
    hear_help: 0.5,      /* 夜里要人帮的人，比如夜尿多的老人想上厕所，叫人的声音强度 */
    primary_bonus: 0.2,  /* 几个人都听见了，听得越灵的越优先，代价减去 hear 乘它，也就是妈妈先起来，除非明显更累 */
    hear_suppress: 0.6,  /* 疲劳从 sleep_at 涨到 floor，睡着的人听见的几率最多再打掉这么多；到了 floor 就听不见了，由别人来判断 */
    wake_cost: 0.3, busy_cost: 0.3, load_cost: 0.5, stick: 0.15, room_bonus: 0.1,
    skip_actions: ['doctor', 'vet', 'listen', 'stayclose', 'album', 'hand', 'chat', 'walkout', 'game'],
  };
  const config = over => Object.assign({}, DEFAULTS, over || {});
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  /* ---------- 精力模型：疲劳怎么涨，出手效果怎么折 ---------- */
  /* 看护人有效疲劳 F = 疲劳压力 × (老人 ? elder_mult : 1) */
  const effFatigue = (C, q) => q.fatigue * (q.stage === 'elder' ? C.elder_mult : 1);
  /* 疲劳档：0 精力够，1 过了 sleep_at，2 过了 floor */
  const tier = (C, q) => { const f = effFatigue(C, q); return f < C.sleep_at ? 0 : f < C.floor ? 1 : 2; };
  /* 疲劳增量，两条通道各算各的再相加：盯人 watch_extra × 小时，手上的活 hands_extra × 小时 */
  const watchFatigue = (C, minutes) => C.watch_extra * minutes / 60;
  const handsFatigue = (C, minutes) => C.hands_extra * minutes / 60;
  /* 出手效果 = efficiency × (1 − depl_loss × clamp((疲劳压力 − sleep_at) / (1 − sleep_at))) */
  const efficiency = (C, fatigue) => C.efficiency * (1 - C.depl_loss * clamp((fatigue - C.sleep_at) / (1 - C.sleep_at)));
  /* ---------- 夜里的响应：睡着的人听不听得见 ----------
     一个需求发出的信号强度：会哭的人需求压力到 cry_at 是 1；夜里要人帮的人的那项需求是 hear_help；其余需求到了 act_at 是 hear_quiet；没到是 0。
     睡着的人这一步听见的几率 = 角色的 hear × 信号强度 × (1 − hear_suppress × clamp((F − sleep_at) / (floor − sleep_at)))，F 到了 floor 是 0。
     听见与否用适配层给的 roll 判断：roll 小于几率就听见。醒着的人一定听得见。 */
  const topNeed = d => Math.max(0, ...Object.values(d.needs));
  const signalOf = (C, d) => {
    if (d.cries && topNeed(d) >= d.cry_at) return 1;   /* 哭的阈值是类别数据，不在这里另写一份 */
    let sg = 0;
    for (const k in d.needs) { const v = d.needs[k]; if (v >= C.act_at) sg = Math.max(sg, d.night_help && k === 'toilet' ? C.hear_help : C.hear_quiet); }
    return sg;
  };
  const hearLevel = (C, q) => { const L = C.hear || {}; return L[q.role] !== undefined ? L[q.role] : (L.default === undefined ? 0.35 : L.default); };
  const hearProb = (C, q, sig) => {
    const f = effFatigue(C, q); if (f >= C.floor) return 0;
    return hearLevel(C, q) * sig * (1 - C.hear_suppress * clamp((f - C.sleep_at) / (C.floor - C.sleep_at)));
  };
  const hears = (C, q, sig) => !q.asleep || (sig > 0 && q.roll !== undefined && q.roll < hearProb(C, q, sig));
  const model = { effFatigue, tier, watchFatigue, handsFatigue, efficiency, signalOf, hearProb, hears };

  /* ---------- 本地规则决策：快照进，分配出 ---------- */
  const plan = (S, Cin) => {
    const C = Cin || config();
    const ix = q => S.people.indexOf(q);
    const cg = S.people.filter(q => ['adult', 'elder'].includes(q.stage) && !q.lead && !q.away && !q.bedridden && !q.watch);
    const fat = q => effFatigue(C, q), tr = q => tier(C, q);
    const load = {}, watch = {}, wake = [], sleep = [], tasks = [], unmet = [], unheard = [], depleted = [];
    /* 派人的代价 = F + 叫醒代价 + 已盯人数 × load_cost + 手忙代价 − 同房间奖励 − 现任粘性 − primary_bonus × 听见的灵敏度，越小越优先 */
    const cost = (q, d) => fat(q) + (q.asleep ? C.wake_cost : 0) + (load[q.id] || 0) * C.load_cost + (q.hands ? C.busy_cost : 0) + (q.room === d.room ? -C.room_bonus : 0) - (S.duty[d.id] === q.id ? C.stick : 0) - C.primary_bonus * hearLevel(C, q);
    const deps = S.people.filter(q => q.watch && !q.away && !q.asleep).sort((a, b) => b.urgency - a.urgency);
    for (const d of deps) {
      /* 现任看护人还在岗，精力够，就不换：换班只在他累了或走不开的时候，不为小差别来回倒手 */
      const cur = cg.find(q => q.id === S.duty[d.id]);
      if (cur && !cur.asleep && tr(cur) === 0) { watch[d.id] = cur.id; load[cur.id] = (load[cur.id] || 0) + 1; continue; }
      /* 候选：醒着的，加上睡着但听见的。睡着的人听不听得见看信号强度，听不见的不叫，也就是妈妈过度疲劳听不见时，轮到别人判断 */
      const sig = signalOf(C, d), cand = cg.filter(q => hears(C, q, sig));
      /* 先比疲劳档，档低的优先，同档比代价，再相同按人员顺序，保证同一份快照永远同一个结果 */
      const pick = cand.sort((a, b) => tr(a) - tr(b) || cost(a, d) - cost(b, d) || ix(a) - ix(b))[0];
      if (!pick) { unmet.push(d.id); if (sig > 0 && cg.some(q => q.asleep)) unheard.push(d.id); watch[d.id] = null; continue; }
      if (tr(pick) === 2) depleted.push(pick.id);
      watch[d.id] = pick.id; load[pick.id] = (load[pick.id] || 0) + 1;
      if (pick.asleep) wake.push(pick.id);
    }
    /* 睡眠底线：没被派去盯人，手也空，F 到了 sleep_at，就去睡 */
    for (const q of cg) if (!q.asleep && !load[q.id] && !q.hands && fat(q) >= C.sleep_at) sleep.push(q.id);
    /* 需求拆分：被照顾的人每项压力不低于 act_at 的需求各派一个人，先给盯着他的人，手忙就给别的手空的人，一人一步一件。
       睡着的人只有夜里要人帮的才派，而且只派那一项。母乳时婴儿的饥饿只有 lactating 的人能喂 */
    const used = {};
    for (const d of S.people.filter(q => q.dep && !q.away && (!q.asleep || q.night_help)).sort((a, b) => b.urgency - a.urgency)) {
      const ks = Object.keys(d.needs).filter(k => d.needs[k] >= C.act_at && (!d.asleep || k === 'toilet')).sort((a, b) => d.needs[b] - d.needs[a]);
      for (const k of ks) {
        const breast = S.feeding === 'breast' && d.stage === 'infant' && k === 'hunger';
        const call = breast || d.asleep;   /* 这两种要把可能睡着的人叫来，其余只派醒着的 */
        const sig = d.asleep ? C.hear_help : signalOf(C, d);
        const free = (breast ? cg.filter(q => q.lactating) : cg).filter(q => q.id !== d.id && !q.hands && !used[q.id] && (call ? hears(C, q, sig) : !q.asleep && !sleep.includes(q.id)));
        if (!free.length) { if (call && sig > 0 && cg.some(q => q.asleep && !q.hands)) unheard.push(d.id); if (breast) continue; break; }
        free.sort((a, b) => (watch[d.id] === b.id ? 1 : 0) - (watch[d.id] === a.id ? 1 : 0) || (call ? fat(a) - fat(b) : cost(a, d) - cost(b, d)) || ix(a) - ix(b));
        const pk = free[0]; if (pk.asleep && !wake.includes(pk.id)) wake.push(pk.id);
        used[pk.id] = true; tasks.push({ cg: pk.id, target: d.id, need: k });
      }
    }
    /* 家里的一顿饭：占手上的活，和盯人是两条独立通道，同一个人又盯又做两条都耗 */
    let cook = null;
    if (S.meal_due) {
      const free = cg.filter(q => !q.hands && !used[q.id] && !q.asleep && !sleep.includes(q.id));
      free.sort((a, b) => cost(a, a) - cost(b, b) || ix(a) - ix(b));
      if (free.length) { cook = free[0].id; used[cook] = true; }
    }
    return { watch, wake, sleep, tasks, cook, unmet, unheard, depleted };
  };

  /* ---------- 硬约束核对：外部决策（后端，AI）进来必须过这一关，不合规整份丢掉，回到本地规则 ---------- */
  const validate = (raw, S, Cin) => {
    const C = Cin || config();
    const cg = new Set(S.people.filter(q => ['adult', 'elder'].includes(q.stage) && !q.lead && !q.away && !q.bedridden && !q.watch).map(q => q.id));
    const byId = {}; for (const q of S.people) byId[q.id] = q;
    let ok = !!raw && typeof raw === 'object' && raw.watch && Array.isArray(raw.tasks) && Array.isArray(raw.wake) && Array.isArray(raw.sleep);
    if (ok) {
      for (const d in raw.watch) { const w = raw.watch[d]; if (!byId[d] || !byId[d].watch || (w !== null && !cg.has(w))) ok = false; }
      const used = new Set();
      for (const k of raw.tasks) { if (!cg.has(k.cg) || !byId[k.target] || !byId[k.target].dep || used.has(k.cg)) ok = false; used.add(k.cg); }
      for (const id of raw.wake.concat(raw.sleep)) if (!cg.has(id)) ok = false;
    }
    if (!ok) return { plan: plan(S, C), rejected: true };
    return { plan: Object.assign({ unmet: [], unheard: [], depleted: [], cook: null }, raw), rejected: false };
  };

  return { DEFAULTS, config, plan, validate, model };
});
