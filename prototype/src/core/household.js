/* 家里的分工：外出，耽误的工作，保姆，分担的家人。
   玩家在书桌前工作赚钱。带人出去要离开书桌，耽误的工作按时薪扣钱。
   保姆：雇 N 天，每天付一次工资，付够效率最高，欠得多效率往下掉，欠够两天就走。她自动处理零碎的照顾。
   分担的家人：妈妈这类成人在家办公，自动赚一份钱，也自动分担照顾，不用付工资。 */
(function (CY) {
  const G = CY.game, ini = CY.ini;
  const t = (k, v) => CY.t(k, v);
  const { emit, clamp } = G._h;

  const wage = () => G.wage();
  const daily = () => G.NANNY_DAILY;
  const dayIndex = () => CY.protocol.world().date.day_index;
  G.NANNY_FULL = 0.8;        /* 保姆满效率是玩家自己做的八成 */
  G.HELPER_EFF = 0.5;        /* 分担的家人是五成 */

  /* ---------- 主角：可选。没有主角时，玩家是一个看不见的成年人，在书桌前工作。
     选了一个人做主角，玩家的手就是他的手：他站在玩家所在的位置，不睡觉，不被打扰，也能照顾自己。
     成年主角靠工作赚钱；老人主角领固定的退休金，圈转得慢些；少年和孩子没有收入，靠家里工作的大人。 ---------- */
  const LEAD_STAGES = ['child', 'teen', 'adult', 'elder'];
  G.canLead = p => !!p && G.isHuman(p) && LEAD_STAGES.includes(G.stage(p));
  G.protagonist = () => { const p = G.world.protagonist && G.get(G.world.protagonist); return p && p.person.active !== false && G.canLead(p) ? p : null; };
  G.setProtagonist = id => {
    const p = id ? G.get(id) : null;
    if (id && !G.canLead(p)) return false;
    G.world.protagonist = id || null;
    if (p) { p.person.active = true; G.clearFlag(p, 'hospital'); G.clearFlag(p, 'outing'); }
    G.save(); emit(); return true;
  };

  /* ---------- 外出：离开书桌的代价，和带着人出门 ---------- */
  G.awayCost = (p, a) => {
    if (!G.isWorkTime()) return;
    const lost = Math.min(G.world.money, Math.round(wage() * a.min / 60));
    if (lost <= 0) return;
    G.world.money -= lost;
    G.log('you', 'event', t('me.away', { label: a.label, min: a.min, lost }));
  };
  const GROUP_STAGES = ['infant', 'toddler', 'child', 'elder'];
  G.startOuting = (p, a) => {
    const o = a.outing, W = CY.world, group = [p];
    if (o.group) for (const q of G.activePeople()) {
      if (q.id === p.id || q === G.protagonist() || !G.isHuman(q) || !GROUP_STAGES.includes(G.stage(q))) continue;
      if (G.isSleeping(q) || G.flag(q, 'hospital') || G.flag(q, 'outing') || W.locationOf(q).place !== 'home') continue;
      group.push(q);
    }
    for (const m of group) {
      G.setFlag(m, 'outing', { minutes: o.minutes, place: o.place, room: o.room, mode: 'stand' });
      G.log(m.id, 'event', t('log.outing_start', { name: m.person.name, place: t('loc.' + o.place) }));
      if (m !== p) m.state.mood = clamp(m.state.mood + 0.05);
    }
  };

  /* ---------- 保姆 ---------- */
  const N = () => G.world.nanny;
  G.nannyActive = () => !!N() && N().days_left > 0;
  G.nannyEff = () => {
    if (!G.nannyActive()) return 0;
    const n = N(), w = daily(), mult = n.owed <= 0 ? 1 : Math.max(0.2, 1 - 0.8 * n.owed / (2 * w));
    return G.NANNY_FULL * mult;
  };
  G.nannyInfo = () => { const n = N() || {}; return { active: G.nannyActive(), days_left: n.days_left || 0, owed: Math.round(n.owed || 0), paid_today: n.paid_today || 0, efficiency: +G.nannyEff().toFixed(2), daily: daily() }; };
  G.hireNanny = days => {
    if (G.nannyActive()) return false;
    G.world.nanny = { days_left: days, owed: daily(), paid_today: 0, day: dayIndex() };
    G.log('you', 'event', t('log.nanny_hired', { n: days }));
    G.save(); emit(); return true;
  };
  /* 每天只能付一次，frac 是日薪的几倍，付多了算预付，最多预付一天 */
  G.payNanny = frac => {
    const n = N();
    if (!G.nannyActive() || n.paid_today > 0) return false;
    const amount = Math.round(daily() * frac);
    if (G.world.money < amount) return false;
    G.world.money -= amount; n.owed = Math.max(-daily(), n.owed - amount); n.paid_today = amount;
    G.save(); emit(); return true;
  };
  G.dismissNanny = () => { if (!N()) return; N().days_left = 0; G.save(); emit(); };
  /* 过了一天：合同少一天，工资记账，欠两天就走 */
  const nannyDay = () => {
    const n = N(); if (!n || n.days_left <= 0) return;
    const di = dayIndex();
    if (n.day === di) return;
    const passed = Math.min(3, di - (n.day < 0 ? di : n.day));
    n.day = di;
    for (let i = 0; i < passed; i++) {
      n.days_left--; n.paid_today = 0;
      if (n.days_left <= 0) { G.log('you', 'event', t('log.nanny_end')); return; }
      n.owed += daily();
      if (n.owed >= 2 * daily()) { n.days_left = 0; G.log('you', 'event', t('log.nanny_left')); return; }
    }
  };

  /* ---------- 自动照顾 ---------- */
  const NO_AUTO = new Set(['doctor', 'vet', 'listen', 'stayclose', 'album', 'remind', 'hand', 'chat', 'walkout', 'game']);
  const eligible = (p, ex) => p !== ex && !G.flag(p, 'hospital') && !G.flag(p, 'outing') && G.maxNeed(p) > 0.55 && (G.isHuman(p) || p.person.kind !== 'human');
  /* 挑一个动作：能降低他当前最急需求的，用得起物品的，不是特殊的 */
  const bestAction = p => {
    let best = null, gain = 0;
    for (const a of Object.values(G.actionsOf(p))) {
      if (a.selfonly || NO_AUTO.has(a.id) || a.away || a.outing || G.lacking(a)) continue;
      let g = 0; for (const k in a.effect || {}) if (a.effect[k] < 0) g += (p.state.needs[k] || 0) * -a.effect[k];
      g += Math.random() * 0.05;
      if (g > gain) { gain = g; best = a; }
    }
    return gain > 0.1 ? best : null;
  };
  const doAssist = (who, p, a, eff) => {
    G._h.consume(a);
    G._h.applyEffects(p, a, eff);
    p.state.mood = clamp(p.state.mood + 0.03);
    const txt = t('log.assist', { who, name: p.person.name, label: a.label });
    G.log(p.id, 'care', txt); G.toastFor(p, txt, 'soft'); G.playFx(p.id, a.id);
  };
  const timers = { nanny: 0 };
  G.helpers = () => G.activePeople().filter(p => p.person.helper && G.isHuman(p) && G.stage(p) === 'adult' && p !== G.protagonist() && !G.flag(p, 'hospital') && !G.flag(p, 'outing') && G.maxNeed(p) < 0.8);
  G.helperIncome = () => G.helpers().length * wage() * 0.5;
  G.assistTick = dt => {
    nannyDay();
    /* 保姆 */
    if (G.nannyActive()) {
      timers.nanny -= dt;
      if (timers.nanny <= 0) {
        const speed = N().owed < 0 ? 1.3 : 1;
        timers.nanny = (24 + Math.random() * 22) / speed;
        const pool = G.activePeople().filter(p => eligible(p, null));
        if (pool.length) {
          const p = pool[Math.floor(Math.random() * pool.length)], a = bestAction(p);
          if (a) doAssist(t('assist.nanny'), p, a, G.nannyEff());
        }
      }
    }
    /* 分担的家人，每人自己的节奏 */
    for (const h of G.helpers()) {
      timers[h.id] = (timers[h.id] === undefined ? 20 + Math.random() * 20 : timers[h.id]) - dt;
      if (timers[h.id] > 0) continue;
      timers[h.id] = 40 + Math.random() * 30;
      const pool = G.activePeople().filter(p => eligible(p, h));
      if (!pool.length) continue;
      const p = pool[Math.floor(Math.random() * pool.length)], a = bestAction(p);
      if (a) doAssist(h.person.name, p, a, G.HELPER_EFF);
    }
  };
})(globalThis.CY = globalThis.CY || {});
