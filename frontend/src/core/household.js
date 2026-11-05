/* 家里的分工：主角，外出，谁能帮别人，人和人之间的互动。
   分担的家人：妈妈这类成人，响应后台发来的请求，没有工资，也不赚钱。 */
(function (CY) {
  const G = CY.game, ini = CY.ini;
  const t = (k, v) => CY.t(k, v);
  const { emit, clamp } = G._h;

  /* ---------- 操纵对象：玩家操纵的那个角色，内部叫 protagonist。没有时，玩家是一个看不见的成年人。
     选了一个人做操纵对象，玩家的手就是他的手：他站在玩家所在的位置，不睡觉，不被打扰，也能照顾自己。
     老人做操纵对象，圈转得慢些。 ---------- */
  const LEAD_STAGES = ['child', 'teen', 'adult', 'elder'];
  G.canLead = p => !!p && G.isHuman(p) && p.person.controllable !== false && !p.person.away && LEAD_STAGES.includes(G.stage(p));   /* 白天要离家的人不当主角，主角是留在家里的那位 */
  /* ---------- 白天离家 ----------
     人物卡上写了 away（work 上班，school 上学）的人，到点出门，去办公室或学校，到点回来。出门走的是和外出一样的标记 outing，
     所以在外面的时候不能叫他做事，他也不向家里发请求。家里有需要看护的人（婴儿、幼儿、孩子）而没有一位留在家里的青少年、大人或老人时，谁也不出门 */
  const awayCfg = () => (G.tpl && G.tpl.system && G.tpl.system.away) || {};
  const hash = (id, salt) => { let h = 2166136261; for (const ch of String(id) + salt) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h / 4294967296; };
  G.homeCaregiver = () => G.activePeople().some(q => G.isHuman(q) && ['teen', 'adult', 'elder'].includes(G.stage(q)) && !q.person.away);
  G.needsCaregiver = () => G.activePeople().some(q => G.isHuman(q) && !q.person.away && G.classOf(q).needs_caregiver);
  G.awayWindow = p => { const c = awayCfg(), w = c[p.person.away]; if (!w) return null; const sp = c.spread || 0; return { from: w.from + (hash(p.id, 'af') * 2 - 1) * sp, to: w.to + (hash(p.id, 'at') * 2 - 1) * sp, w }; };
  G.isAway = p => { const f = G.flag(p, 'outing'); return !!(f && f.away); };
  G.awayMult = p => (G.isAway(p) ? (awayCfg().need_mult || 1) : 1);
  G.awayTick = offline => {
    if (!awayCfg().work) return;
    const hr = G.dayMinutes() / 60, ok = G.homeCaregiver() || !G.needsCaregiver();
    for (const p of G.activePeople()) {
      if (!p.person.away || !G.isHuman(p)) continue;
      if (G.isAway(p)) { p._away_on = true; continue; }
      if (p._away_on) { p._away_on = false; if (!offline) G.logK(p.id, 'event', 'log.away_back', { name: p.person.name }); }
      const w = G.awayWindow(p);
      if (!w || !ok || p === G.protagonist() || G.flag(p, 'hospital') || G.isSleeping(p) || hr < w.from || hr >= w.to) continue;
      G.setFlag(p, 'outing', { minutes: (w.to - hr) * 60, place: w.w.place, room: w.w.room, mode: 'stand', away: p.person.away });
      p._away_on = true;
      if (!offline) G.logK(p.id, 'event', 'log.away_' + p.person.away, { name: p.person.name });
    }
  };
  /* 上班的人在外面挣的钱，每游戏小时是在家办公时薪的一个倍数；别处没人打断，专注满额，家庭效率和家人加成照乘 */
  G.awayIncome = hours => G.activePeople().reduce((a, p) => { const f = G.flag(p, 'outing'); return a + (f && f.away === 'work' ? G.WAGE * (awayCfg().wage || 0) * hours * G.efficiency() * G.householdBonus() : 0); }, 0);
  /* 默认的操纵对象：爸爸，妈妈，第一个成年人，再是别的能当主角的人。只有家里没有一个人能当主角时才没有，比如只剩宠物和花草 */
  G.defaultLead = () => {
    const arch = p => p.person.archetype || p.person.card, live = G.activePeople().filter(G.canLead);
    return live.find(p => arch(p) === 'dad') || live.find(p => arch(p) === 'mom') || live.find(p => G.stage(p) === 'adult') || live[0] || null;
  };
  G.protagonist = () => { const p = G.world.protagonist && G.get(G.world.protagonist); return p && p.person.active !== false && G.canLead(p) ? p : null; };
  /* 记事件用的角色：事件必须挂在一个真角色身上，没有一个叫"你"的角色。挂在操纵对象身上，没有操纵对象就挂在第一个人身上 */
  G.youId = () => { const p = G.protagonist() || G.activePeople().find(G.isHuman) || G.people[0]; return p ? p.id : 'you'; };
  G.setProtagonist = id => {
    const p = id ? G.get(id) : null;
    if (id && !G.canLead(p)) return false;
    G.world.protagonist = id || null;
    if (p) { p.person.active = true; G.clearFlag(p, 'hospital'); G.clearFlag(p, 'outing'); }
    G.save(); emit(); return true;
  };

  /* 操纵对象是玩家从菜单里选的家里一个真角色，不另造一个“我”，也不允许没有：没有或当前这位不能用了就按默认顺序换一位：爸爸，妈妈，第一个成年人，再是别的能当主角的人。
     早先版本自动建过一个“我”，这里顺手删掉。返回是不是换了人，界面据此重画 */
  G.ensurePlayer = async () => {
    const old = G.people.find(p => (p.person.archetype || p.person.card) === 'me');
    if (old) { if (G.world.protagonist === old.id) G.world.protagonist = null; await G.deletePerson(old.id); await G.load(); }
    if (!G.activePeople().length) return false;
    if (G.protagonist()) return false;
    const pick = G.defaultLead();
    if (!pick) return false;
    G.setProtagonist(pick.id);
    return true;
  };

  /* ---------- 外出：带着人出门 ---------- */
  /* 看护：类别表里 needs_caregiver 为真的人（婴儿，幼儿，小孩）不能单独留在家里。
     成人或老人醒着或睡着都算在家看护，前提是在家，没住院，没外出，不卧床，也不是主角（主角会陪着出门）。
     一次带人出门时，家里还有别人看护，需要看护的人就留下；没有人看护了，他们就跟着一起出门，这是规则推出来的，不是特例 */
  const dependent = q => G.isHuman(q) && !!G.classOf(q).needs_caregiver;
  const homeAndFree = q => !G.flag(q, 'hospital') && !G.flag(q, 'outing') && (!CY.world || CY.world.locationOf(q).place === 'home');
  G.caregiversAt = except => G.activePeople().filter(q => G.isHuman(q) && !dependent(q) && ['adult', 'elder'].includes(G.stage(q)) && q !== G.protagonist() && !except.includes(q) && !G.bedridden(q) && homeAndFree(q));
  /* 婴儿出门：有婴儿车，谁都能推；没有婴儿车只能抱着，抱得动的是成年人（爸爸妈妈这一辈），老人和少年抱不稳。带出门的是主角，没有主角时玩家是一位看不见的成年人 */
  G.canCarry = stage => { if (stage !== 'infant') return true; const lead = G.protagonist(); return !lead || G.stage(lead) === 'adult'; };
  G.canJoinOuting = q => !G.isSleeping(q) && !(G.stage(q) === 'infant' && !G.unlocked('stroller') && !G.canCarry('infant')) && !(G.needsChair(q) && !G.unlocked('wheelchair'));
  /* 出门后被留在家里无人看护的人：没人看护了，又带不走的（睡着，没有婴儿车），出门就被拦下 */
  G.outingBlocked = p => {
    if (G.caregiversAt([p]).length) return false;
    return G.activePeople().some(q => q !== p && dependent(q) && homeAndFree(q) && !G.canJoinOuting(q));
  };
  G.startOuting = (p, a) => {
    const o = a.outing, group = [p];
    if (o.group && !G.caregiversAt([p]).length) for (const q of G.activePeople()) {
      if (q.id === p.id || q === G.protagonist() || !dependent(q) || !homeAndFree(q) || !G.canJoinOuting(q)) continue;
      group.push(q);
    }
    const place = G.ref('loc.' + o.place, o.place), names = group.slice(1).map(m => m.person.name).join(t('list.sep'));
    for (const m of group) {
      G.setFlag(m, 'outing', { minutes: G.outingMinutes(o), place: o.place, room: o.room, mode: 'stand' });
      /* 事件按谁带谁写：带人的是"A 带 B 去哪"，被带的是"B 跟 A 去哪" */
      /* 用着婴儿车或轮椅的人，事件写他是被推着出门的 */
      if (G.usingStroller(m)) G.logK(m.id, 'event', 'log.outing_stroller', { name: m.person.name, place });
      else if (G.usingWheelchair(m)) G.logK(m.id, 'event', 'log.outing_wheelchair', { name: m.person.name, place });
      else if (group.length === 1) G.logK(m.id, 'event', 'log.outing_start', { name: m.person.name, place });
      else if (m === p) G.logK(m.id, 'event', 'log.outing_lead', { name: m.person.name, others: names, place });
      else G.logK(m.id, 'event', 'log.outing_follow', { name: m.person.name, lead: p.person.name, place });
      if (m !== p) m.state.mood = clamp(m.state.mood + 0.05 + (G.hasItem('stroller') && ['infant', 'toddler'].includes(G.stage(m)) ? 0.04 : 0));
    }
  };

  /* ---------- 谁能帮别人：卡里写了 help.proactive 的成人，没做主角，不是婴幼儿。帮不帮、帮谁由 agents.js 按后台的策略决定 ---------- */
  /* 疾病数据里标了 needs_escort 的人，比如帕金森，不会自己一个人出门，要有人陪 */
  G.needsEscort = p => !!p && (p.person.conditions || []).some(c => (G.tpl.conditions[c] || {}).needs_escort);
  G.canHelp = p => !!p.person.helper && G.isHuman(p) && !['infant', 'toddler'].includes(G.stage(p)) && p !== G.protagonist();
  G.helpers = () => G.activePeople().filter(p => G.canHelp(p) && !G.flag(p, 'hospital') && !G.flag(p, 'outing') && !G.flag(p, 'offduty') && G.maxNeed(p) < 0.8);

  /* ---------- 人和人之间：在同一个房间的两个人，偶尔自己聊几句、玩一会儿、逗逗宠物，需求会降一点，发生的事里留一句 ---------- */
  const socialCd = {}, SMALL = ['infant', 'toddler', 'child'];
  let socialT = 20;
  const lower = (p, k, v) => { if (k in p.state.needs) p.state.needs[k] = clamp(p.state.needs[k] + v); };   /* 名字沿用，意思是这一项需求缓解了 v，也就是水平升 v */
  G.socialTick = dt => {
    socialT -= dt; if (socialT > 0) return;
    socialT = 20 + Math.random() * 20;
    const W = CY.world, lead = G.protagonist(), now = Date.now(), byRoom = {};
    for (const p of G.activePeople()) {
      if (p === lead || p.person.kind === 'plant' || G.isSleeping(p) || G.flag(p, 'hospital') || G.flag(p, 'outing')) continue;
      const l = W.locationOf(p); (byRoom[l.place + '/' + l.room] = byRoom[l.place + '/' + l.room] || []).push(p);
    }
    /* 饭点厨房里有三个以上的人，就一起吃一顿：不是婴幼儿的人饿和渴降下去，每个饭点一次 */
    const kit = byRoom['home/kitchen'] || [], eaters = kit.filter(p => G.isHuman(p) && !['infant', 'toddler'].includes(G.stage(p)));
    if (W.isMealTime() && eaters.length >= 3 && (socialCd.meal || 0) < now) {
      socialCd.meal = now + 3 * 3600 * 1000;
      for (const q of eaters) { lower(q, 'hunger', 0.35); lower(q, 'thirst', 0.2); q.state.mood = clamp(q.state.mood + 0.03); }
      G.logK(eaters[0].id, 'event', 'social.meal', { n: eaters.length });
    }
    for (const room in byRoom) {
      const L = byRoom[room]; if (L.length < 2) continue;
      const a = L[Math.floor(Math.random() * L.length)], rest = L.filter(x => x !== a), b = rest[Math.floor(Math.random() * rest.length)];
      const ha = G.isHuman(a), hb = G.isHuman(b);
      if (!ha && !hb && (a.person.species === b.person.species)) continue;
      const key = [a.id, b.id].sort().join();
      if ((socialCd[key] || 0) > now) continue;
      const want = Math.max(G.need(a, 'company'), G.need(b, 'company'), G.need(a, 'play'), G.need(b, 'play'));
      if (Math.random() > (0.05 + 0.45 * want) * (!ha && !hb ? 0.5 : 1)) continue;
      let kind, who, tgt;
      if (ha && hb) {
        const sa = SMALL.includes(G.stage(a)), sb = SMALL.includes(G.stage(b));
        if (sa !== sb) { kind = 'play'; who = sa ? b : a; tgt = sa ? a : b; } else { kind = 'chat'; who = a; tgt = b; }
      } else if (!ha && !hb) { kind = 'pets'; who = a; tgt = b; }
      else { kind = 'pet'; who = ha ? a : b; tgt = ha ? b : a; }
      if (kind === 'chat') { lower(a, 'company', 0.2); lower(b, 'company', 0.2); }
      else if (kind === 'play') { lower(tgt, 'play', 0.25); lower(tgt, 'company', 0.2); lower(who, 'company', 0.1); }
      else if (kind === 'pets') { lower(a, 'play', 0.2); lower(b, 'play', 0.2); }
      else { lower(tgt, 'company', 0.2); lower(tgt, 'play', 0.15); }
      for (const q of [a, b]) q.state.mood = clamp(q.state.mood + 0.02);
      socialCd[key] = now + 90 * 60 * 1000;
      G.bus.emit('care', { kind: 'social', actor: who.id, target: tgt.id, action: kind });
      G.logK(tgt.id, 'event', 'social.' + kind, { a: who.person.name, b: tgt.person.name });
    }
  };

})(globalThis.CY = globalThis.CY || {});
