/* 家里的分工：主角，外出，分担的家人。
   分担的家人：妈妈这类成人，自动分担照顾，没有工资，也不赚钱。 */
(function (CY) {
  const G = CY.game, ini = CY.ini;
  const t = (k, v) => CY.t(k, v);
  const { emit, clamp } = G._h;

  /* ---------- 主角：可选。没有主角时，玩家是一个看不见的成年人，在书桌前工作。
     选了一个人做主角，玩家的手就是他的手：他站在玩家所在的位置，不睡觉，不被打扰，也能照顾自己。
     老人主角的圈转得慢些。 ---------- */
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

  /* ---------- 外出：带着人出门 ---------- */
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

  /* ---------- 自动照顾 ---------- */
  const NO_AUTO = new Set(['doctor', 'vet', 'listen', 'stayclose', 'album', 'remind', 'hand', 'chat', 'walkout', 'game']);
  const eligible = (p, ex, thr) => p !== ex && !G.flag(p, 'hospital') && !G.flag(p, 'outing') && !G.isSleeping(p) && G.maxNeed(p) > (thr || 0.55) && (G.isHuman(p) || p.person.kind !== 'human');
  /* 挑一个动作：能降低他当前最急需求的，用得起物品的，不是特殊的 */
  const bestAction = p => {
    let best = null, gain = 0;
    for (const a of Object.values(G.actionsOf(p))) {
      if (a.selfonly || NO_AUTO.has(a.id) || a.away || a.outing) continue;
      let g = 0; for (const k in a.effect || {}) if (a.effect[k] < 0) g += (p.state.needs[k] || 0) * -a.effect[k];
      g += Math.random() * 0.05;
      if (g > gain) { gain = g; best = a; }
    }
    return gain > 0.1 ? best : null;
  };
  const doAssist = (who, p, a, eff) => {
    G._h.applyEffects(p, a, eff);
    p.state.mood = clamp(p.state.mood + 0.03);
    const txt = t('log.assist', { who, name: p.person.name, label: a.label });
    G.log(p.id, 'care', txt); G.toastFor(p, txt, 'soft'); G.playFx(p.id, a.id);
  };
  const timers = {};
  G.helpers = () => G.activePeople().filter(p => p.person.helper && G.isHuman(p) && !['infant', 'toddler'].includes(G.stage(p)) && p !== G.protagonist() && !G.flag(p, 'hospital') && !G.flag(p, 'outing') && G.maxNeed(p) < 0.8);
  /* 分担的家人：隔一阵看看谁最需要，不在同一个房间就先走过去，到了再动手 */
  G.assistTick = dt => {
    const W = CY.world;
    for (const h of G.helpers()) {
      const hp = h.person.help || {}, iv = hp.interval || [90, 160];
      timers[h.id] = (timers[h.id] === undefined ? 20 + Math.random() * 20 : timers[h.id]) - dt;
      if (timers[h.id] > 0) continue;
      const pool = G.activePeople().filter(p => eligible(p, h, hp.threshold || 0.65)).sort((a, b) => G.urgency(b) - G.urgency(a));
      if (!pool.length) { timers[h.id] = 15; continue; }
      const p = pool[0], tl = W.locationOf(p), hl = W.locationOf(h);
      if (tl.place === hl.place && tl.room !== hl.room) { timers[h.id] = W.goTo(h, tl.room) ? 12 : 8; continue; }
      timers[h.id] = iv[0] + Math.random() * (iv[1] - iv[0]);
      const a = bestAction(p);
      if (a) doAssist(h.person.name, p, a, hp.efficiency || 0.5);
    }
  };
})(globalThis.CY = globalThis.CY || {});
