/* 访客：从时空门里走出来的人，在家里住一两天，和家里人一样有需求，用同样的动作照顾。
   每位访客是一个临时的家庭成员：基于朋友或邻居的模板，再按卡片给外观、年龄和起始的疲倦。离开时这个人从家里消失，只留下记录里的一句话和一件纪念品。
   客床数量决定同时能住几位，满床不来新的。送礼是单独的按钮：只有送到对方真正需要的东西才算数，送错了对方收下，当场没有反馈。 */
(function (CY) {
  const G = CY.game, V = CY.visitors, store = CY.store;
  const t = (k, v) => CY.t(k, v);

  /* 开局背景：机制相同，只改起始金额；不点名任何具体原因 */
  G.BACKGROUNDS = { layoff: { money: 300 }, return: { money: 200 }, house: { money: 500 } };
  G.chooseBackground = id => {
    const b = G.BACKGROUNDS[id]; if (!b) return false;
    G.world.background = id; G.world.money = b.money; G.world.intro_done = true; G.world.story_pending = true; G.save(true);
    return true;
  };

  G.DOOR = { gifts_per_day: 2, gift_max: 3, stay_min: 1, stay_max: 3, cooldown_max: 1, arrive_chance: 0.8, hint_gap: [40, 70], door_room: 'yard' };
  G.guestBeds = () => 1 + (G.owned && G.owned('house2') ? 1 : 0);
  G.visitorPeople = () => G.activePeople().filter(p => p.person.visitor);
  G.souvenirs = () => (G.world.souv = G.world.souv || {});
  G.giftInv = () => (G.world.gifts = G.world.gifts || {});
  G.visitorCard = p => V.cards[p.person.visitor.id];
  const day = () => G.gameDate().n;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const nameRef = id => G.ref(`visitor.${id}.name`, (V.cards[id] && V.cards[id].t.name['zh-CN']) || id);
  const giftRef = id => G.ref(`gift.${id}`, V.GIFTS[id].name['zh-CN']);
  const souvRef = id => G.ref(`visitor.${id}.souvenir`, V.cards[id].t.souvenir['zh-CN']);
  G.visitHooks = [];
  const fire = (type, data) => { for (const h of G.visitHooks) h(type, data); };
  const saveVisitor = p => store.writeYaml(`people/${p.id}/person.yaml`, p.person);

  G.giftsLeft = () => { const d = G.world.vday; return G.DOOR.gifts_per_day - (d && d.n === day() ? d.c : 0); };
  const useGift = () => { const d = G.world.vday; G.world.vday = d && d.n === day() ? { n: d.n, c: d.c + 1 } : { n: day(), c: 1 }; };

  /* 挑一位：没拿到纪念品的优先，来过但没满足的次之，已拿到的很少再来 */
  G.pickVisitor = () => {
    const here = new Set(G.visitorPeople().map(p => p.person.visitor.id)), souv = G.souvenirs(), met = G.world.met || {};
    const pool = V.order.filter(id => !here.has(id)).map(id => ({ id, w: souv[id] ? 0.15 : met[id] ? 2 : 3 }));
    const sum = pool.reduce((a, b) => a + b.w, 0);
    if (!sum) return null;
    let r = Math.random() * sum;
    for (const p of pool) { r -= p.w; if (r <= 0) return p.id; }
    return pool[pool.length - 1].id;
  };
  G.firstVisitorId = () => V.FIRST[CY.i18n.lang] || V.FIRST.default;

  /* 到来：建一个人，放在门口，之后和家里人一样自己走动 */
  G.arrive = async id => {
    const c = V.cards[id]; if (!c) return null;
    const pid = await G.createPerson({ arch: c.age >= 60 ? 'neighbor' : 'friend', name: t(`visitor.${id}.name`), age: c.age, pronoun: c.pronoun, look: c.look });
    const p = await G.loadOnePerson(pid, []);
    if (!p) return null;
    p.person.visitor = { id, since: day(), stay: rint(G.DOOR.stay_min, G.DOOR.stay_max), day_in: 0, ok: false, wrong: [], talk: 0 };
    if (c.tired) p.state.needs.rest = c.tired;
    p.state.mood = 0.55;
    await saveVisitor(p);
    if (CY.world && CY.world.agents) CY.world.agents[pid] = { room: G.DOOR.door_room, next: Date.now() + 15000 };
    G.world.met = Object.assign({}, G.world.met, { [id]: ((G.world.met || {})[id] || 0) + 1 });
    G.settleNote('settle.visit_arrive', { name: nameRef(id) });
    G.logK('you', 'event', 'visit.log_arrive', { name: nameRef(id) });
    fire('arrive', p);
    G.save();
    return p;
  };

  /* 新档第一次必到，之后每天午后看有没有空床，离开后隔最多一天 */
  G.maybeArrive = async () => {
    if (!G.activePeople().length || !G.world.intro_done || G.world.story_pending) return false;
    if (!G.world.visit_started) { G.world.visit_started = true; return !!(await G.arrive(G.firstVisitorId())); }
    if (G.visitorPeople().length >= G.guestBeds()) return false;
    if ((G.world.visit_cd || 0) > 0) { G.world.visit_cd--; return false; }
    if (Math.random() > G.DOOR.arrive_chance) return false;
    const id = G.pickVisitor();
    return id ? !!(await G.arrive(id)) : false;
  };
  G.on(() => { if (!G.world.visit_started) G.maybeArrive(); });
  G.dayStartHooks.push(() => { G.maybeArrive(); });

  const satisfy = p => {
    const st = p.person.visitor;
    if (st.ok) return;
    st.ok = true;
    G.souvenirs()[st.id] = day();
    saveVisitor(p); fire('ok', p); G.save();
  };

  /* 照料：卡片的 care 是动作编号，对访客做了这个动作就算满足 */
  const log0 = G.log;
  G.log = function (pid, type, text, meta) {
    const r = log0.apply(this, arguments);
    try {
      const p = G.get(pid);
      if (type === 'care' && p && p.person.visitor && meta && meta.k === 'log.care') {
        const c = V.cards[p.person.visitor.id], id = G.actIdOf(meta);
        if (c && c.care && id === c.care) satisfy(p);
      }
    } catch (e) { /* 不能影响游戏 */ }
    return r;
  };

  /* 买礼物，进背包 */
  G.buyGift = id => {
    const g = V.GIFTS[id]; if (!g) return false;
    const inv = G.giftInv();
    if ((G.world.money || 0) < g.price || (inv[id] || 0) >= G.DOOR.gift_max) return false;
    G.world.money -= g.price; inv[id] = (inv[id] || 0) + 1; G.save(true);
    return true;
  };

  /* 送礼：匹配才成功；送错了收下，当场不说什么，礼物不退 */
  G.giveGift = (pid, giftId) => {
    const p = G.get(pid), inv = G.giftInv();
    if (!p || !p.person.visitor) return { error: 'none' };
    const st = p.person.visitor, c = V.cards[st.id];
    if (st.ok) return { error: 'done' };
    const g = V.GIFTS[giftId];
    if (!g) return { error: 'nogift' };
    if (G.giftsLeft() <= 0) return { error: 'limit' };
    /* 背包里没有就当场按目录价买下送出 */
    if (!(inv[giftId] > 0)) { if ((G.world.money || 0) < g.price) return { error: 'money' }; G.world.money -= g.price; inv[giftId] = 1; }
    inv[giftId]--; if (!inv[giftId]) delete inv[giftId];
    useGift();
    if (c.wants.includes(giftId)) {
      G.settleNote('settle.visit_gift', { name: nameRef(st.id), gift: giftRef(giftId) });
      satisfy(p);
      G.logK('you', 'event', 'visit.log_gift', { name: nameRef(st.id), gift: giftRef(giftId) });
      return { ok: true, line: `visitor.${st.id}.ok_line` };
    }
    st.wrong.push(giftId); saveVisitor(p); G.save();
    return { ok: false };
  };

  /* 离开：留言进当天的小结，人从家里消失；满足了才有纪念品 */
  const leave = p => {
    const st = p.person.visitor, c = V.cards[st.id];
    G.settleNote(st.ok ? 'settle.visit_leave_ok' : 'settle.visit_leave_miss', { name: nameRef(st.id), item: souvRef(st.id) });
    if (!st.ok && st.wrong.length && c.t.wrong_late && c.t.wrong_late['zh-CN']) G.settleNote(`visitor.${st.id}.wrong_late`, {});
    G.world.visit_cd = rint(0, G.DOOR.cooldown_max);
    fire('leave', p);
    G.deletePerson(p.id);
  };
  /* 日终：先于结算页的收口。住满了就走，没住满的第二天接着住 */
  G.dayEndHooks.unshift(() => {
    for (const p of G.visitorPeople().slice()) { const st = p.person.visitor; st.day_in++; if (st.day_in >= st.stay) leave(p); else saveVisitor(p); }
  });

  /* 访客自己说的话：隔一阵冒一句暗示，没满足时才说；说话不占任何次数 */
  const nextHint = {};
  G.on(() => {
    const now = Date.now();
    for (const p of G.visitorPeople()) {
      const st = p.person.visitor, c = V.cards[st.id], n = c && c.t.hint ? c.t.hint.length : 0;
      if (st.ok || !n || G.isSleeping(p) || G.toast[p.id]) continue;
      if (nextHint[p.id] === undefined) nextHint[p.id] = now + 8000;
      if (now < nextHint[p.id]) continue;
      nextHint[p.id] = now + 1000 * rint(G.DOOR.hint_gap[0], G.DOOR.hint_gap[1]);
      const text = t(`visitor.${st.id}.hint.${st.talk % n}`); st.talk++;
      if (G.toastFor) G.toastFor(p, text, 'soft');
    }
  });

  /* 玩家自己放进数据文件夹的卡片：templates/visitors/*.yaml，标记非官方；文字按语言写成对象 */
  G.loadVisitorPacks = async () => {
    for (const p of (await store.list()).filter(f => /^templates\/visitors\/[^/]+\.yaml$/.test(f))) {
      try {
        const x = await store.readYaml(p), list = x && (x.cards || (x.id ? [x] : []));
        for (const c of list || []) { if (c && c.id && c.t && !V.cards[c.id]) V.add(Object.assign({}, c, { official: false })); }
      } catch (e) { /* 坏卡片不影响游戏 */ }
    }
  };
})(globalThis.CY = globalThis.CY || {});
