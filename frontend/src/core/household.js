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
  G.canLead = p => !!p && G.isHuman(p) && LEAD_STAGES.includes(G.stage(p));
  G.protagonist = () => { const p = G.world.protagonist && G.get(G.world.protagonist); return p && p.person.active !== false && G.canLead(p) ? p : null; };
  G.setProtagonist = id => {
    const p = id ? G.get(id) : null;
    if (id && !G.canLead(p)) return false;
    G.world.protagonist = id || null;
    if (p) { p.person.active = true; G.clearFlag(p, 'hospital'); G.clearFlag(p, 'outing'); }
    G.save(); emit(); return true;
  };

  /* 操纵对象是玩家从菜单里选的家里一个真角色，不另造一个“我”。第一次有人住进来而还没有选，默认选爸爸，没有爸爸选妈妈，再没有就选第一个成年人，只选一次，以后玩家取消了不会再自己选上。
     早先版本自动建过一个“我”，这里顺手删掉 */
  G.ensurePlayer = async () => {
    const old = G.people.find(p => (p.person.archetype || p.person.card) === 'me');
    if (old) { if (G.world.protagonist === old.id) G.world.protagonist = null; await G.deletePerson(old.id); await G.load(); G.world.player_char = false; }
    if (G.world.player_char || !G.activePeople().length) return false;
    G.world.player_char = true;
    if (G.protagonist()) { G.save(); return false; }
    const arch = p => p.person.archetype || p.person.card, live = G.activePeople().filter(G.canLead);
    const pick = live.find(p => arch(p) === 'dad') || live.find(p => arch(p) === 'mom') || live.find(p => G.stage(p) === 'adult') || live[0];
    if (!pick) { G.save(); return false; }
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
  G.canJoinOuting = q => !G.isSleeping(q) && !(G.stage(q) === 'infant' && !G.owned('stroller')) && !(G.bedridden(q) && !G.owned('wheelchair'));
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
      if (m !== p) m.state.mood = clamp(m.state.mood + 0.05 + (G.owned('stroller') && ['infant', 'toddler'].includes(G.stage(m)) ? 0.04 : 0));
    }
  };

  /* ---------- 谁能帮别人：卡里写了 help.proactive 的成人，没做主角，不是婴幼儿。帮不帮、帮谁由 agents.js 按后台的策略决定 ---------- */
  G.canHelp = p => !!p.person.helper && G.isHuman(p) && !['infant', 'toddler'].includes(G.stage(p)) && p !== G.protagonist();
  G.helpers = () => G.activePeople().filter(p => G.canHelp(p) && !G.flag(p, 'hospital') && !G.flag(p, 'outing') && !G.flag(p, 'offduty') && G.maxNeed(p) < 0.8);

  /* ---------- 人和人之间：在同一个房间的两个人，偶尔自己聊几句、玩一会儿、逗逗宠物，需求会降一点，发生的事里留一句 ---------- */
  const socialCd = {}, SMALL = ['infant', 'toddler', 'child'];
  let socialT = 20;
  const lower = (p, k, v) => { if (k in p.state.needs) p.state.needs[k] = clamp(p.state.needs[k] - v); };
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
      const want = Math.max(a.state.needs.company || 0, b.state.needs.company || 0, a.state.needs.play || 0, b.state.needs.play || 0);
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
      G.logK(tgt.id, 'event', 'social.' + kind, { a: who.person.name, b: tgt.person.name });
    }
  };

})(globalThis.CY = globalThis.CY || {});
