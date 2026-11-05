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
     people[]     { id, stage, dep, lead, asleep, bedridden, away, room, lactating, fatigue, needs{需求:压力}, urgency, hands }
                  stage 是 infant toddler child teen adult elder 之一；dep 是需要被照顾的人；lead 是玩家扮演的主角；
                  fatigue 和 needs 都是压力，0 是正常，1 是到顶；hands 为真是手上的活还没做完；urgency 是紧迫度乘最高需求。
   分配 P：
     watch        { 婴幼儿id: 看护人id 或 null }，null 是没有人可派
     wake sleep   要叫醒的人 id，要去睡的人 id
     tasks[]      { cg: 看护人id, target: 被照顾人id, need: 需求 }，一人一步最多一件
     cook         做饭的人 id 或 null
     unmet        没有人可盯的婴幼儿 id
     depleted     被派了但疲劳已到底线的看护人 id */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) { root.CY = root.CY || {}; root.CY.dispatchPolicy = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /* 参数。游戏里由 templates/system.yaml 的 dispatch 覆盖；没有数据来源的参数都是假设，用到时要做敏感性分析 */
  const DEFAULTS = {
    enabled: true, step_minutes: 5,
    watch_stages: ['infant', 'toddler'],   /* 醒着时必须有人盯着的阶段 */
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
    wake_cost: 0.3, busy_cost: 0.3, load_cost: 0.5, stick: 0.15, room_bonus: 0.1,
    skip_actions: ['doctor', 'vet', 'listen', 'stayclose', 'album', 'remind', 'hand', 'chat', 'walkout', 'game'],
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
  const model = { effFatigue, tier, watchFatigue, handsFatigue, efficiency };

  /* ---------- 本地规则决策：快照进，分配出 ---------- */
  const plan = (S, Cin) => {
    const C = Cin || config();
    const ix = q => S.people.indexOf(q);
    const cg = S.people.filter(q => ['adult', 'elder'].includes(q.stage) && !q.lead && !q.away && !q.bedridden);
    const fat = q => effFatigue(C, q), tr = q => tier(C, q);
    const load = {}, watch = {}, wake = [], sleep = [], tasks = [], unmet = [], depleted = [];
    /* 派人的代价 = F + 叫醒代价 + 已盯人数 × load_cost + 手忙代价 − 同房间奖励 − 现任粘性，越小越优先 */
    const cost = (q, d) => fat(q) + (q.asleep ? C.wake_cost : 0) + (load[q.id] || 0) * C.load_cost + (q.hands ? C.busy_cost : 0) + (q.room === d.room ? -C.room_bonus : 0) - (S.duty[d.id] === q.id ? C.stick : 0);
    const deps = S.people.filter(q => C.watch_stages.includes(q.stage) && !q.away && !q.asleep).sort((a, b) => b.urgency - a.urgency);
    for (const d of deps) {
      /* 现任看护人还在岗，精力够，就不换：换班只在他累了或走不开的时候，不为小差别来回倒手 */
      const cur = cg.find(q => q.id === S.duty[d.id]);
      if (cur && !cur.asleep && tr(cur) === 0) { watch[d.id] = cur.id; load[cur.id] = (load[cur.id] || 0) + 1; continue; }
      /* 先比疲劳档，档低的优先，同档比代价，再相同按人员顺序，保证同一份快照永远同一个结果 */
      const pick = cg.slice().sort((a, b) => tr(a) - tr(b) || cost(a, d) - cost(b, d) || ix(a) - ix(b))[0];
      if (!pick) { unmet.push(d.id); watch[d.id] = null; continue; }
      if (tr(pick) === 2) depleted.push(pick.id);
      watch[d.id] = pick.id; load[pick.id] = (load[pick.id] || 0) + 1;
      if (pick.asleep) wake.push(pick.id);
    }
    /* 睡眠底线：没被派去盯人，手也空，F 到了 sleep_at，就去睡 */
    for (const q of cg) if (!q.asleep && !load[q.id] && !q.hands && fat(q) >= C.sleep_at) sleep.push(q.id);
    /* 需求拆分：被照顾的人每项压力不低于 act_at 的需求各派一个人，先给盯着他的人，手忙就给别的手空的人，一人一步一件 */
    const used = {};
    for (const d of S.people.filter(q => q.dep && !q.away && !q.asleep).sort((a, b) => b.urgency - a.urgency)) {
      const ks = Object.keys(d.needs).filter(k => d.needs[k] >= C.act_at).sort((a, b) => d.needs[b] - d.needs[a]);
      for (const k of ks) {
        /* 母乳：婴儿的饥饿只有 lactating 的人能喂，睡着也叫醒 */
        const breast = S.feeding === 'breast' && d.stage === 'infant' && k === 'hunger';
        const free = breast ? cg.filter(q => q.lactating && !q.hands && !used[q.id]) : cg.filter(q => !q.hands && !used[q.id] && !q.asleep && !sleep.includes(q.id));
        if (breast) {
          if (!free.length) continue;
          const pk = free.slice().sort((a, b) => fat(a) - fat(b) || ix(a) - ix(b))[0];
          if (pk.asleep && !wake.includes(pk.id)) wake.push(pk.id);
          used[pk.id] = true; tasks.push({ cg: pk.id, target: d.id, need: k }); continue;
        }
        if (!free.length) break;
        free.sort((a, b) => (watch[d.id] === b.id ? 1 : 0) - (watch[d.id] === a.id ? 1 : 0) || cost(a, d) - cost(b, d) || ix(a) - ix(b));
        used[free[0].id] = true; tasks.push({ cg: free[0].id, target: d.id, need: k });
      }
    }
    /* 家里的一顿饭：占手上的活，和盯人是两条独立通道，同一个人又盯又做两条都耗 */
    let cook = null;
    if (S.meal_due) {
      const free = cg.filter(q => !q.hands && !used[q.id] && !q.asleep && !sleep.includes(q.id));
      free.sort((a, b) => cost(a, a) - cost(b, b) || ix(a) - ix(b));
      if (free.length) { cook = free[0].id; used[cook] = true; }
    }
    return { watch, wake, sleep, tasks, cook, unmet, depleted };
  };

  /* ---------- 硬约束核对：外部决策（后端，AI）进来必须过这一关，不合规整份丢掉，回到本地规则 ---------- */
  const validate = (raw, S, Cin) => {
    const C = Cin || config();
    const cg = new Set(S.people.filter(q => ['adult', 'elder'].includes(q.stage) && !q.lead && !q.away && !q.bedridden).map(q => q.id));
    const byId = {}; for (const q of S.people) byId[q.id] = q;
    let ok = !!raw && typeof raw === 'object' && raw.watch && Array.isArray(raw.tasks) && Array.isArray(raw.wake) && Array.isArray(raw.sleep);
    if (ok) {
      for (const d in raw.watch) { const w = raw.watch[d]; if (!byId[d] || !C.watch_stages.includes(byId[d].stage) || (w !== null && !cg.has(w))) ok = false; }
      const used = new Set();
      for (const k of raw.tasks) { if (!cg.has(k.cg) || !byId[k.target] || !byId[k.target].dep || used.has(k.cg)) ok = false; used.add(k.cg); }
      for (const id of raw.wake.concat(raw.sleep)) if (!cg.has(id)) ok = false;
    }
    if (!ok) return { plan: plan(S, C), rejected: true };
    return { plan: Object.assign({ unmet: [], depleted: [], cook: null }, raw), rejected: false };
  };

  return { DEFAULTS, config, plan, validate, model };
});
