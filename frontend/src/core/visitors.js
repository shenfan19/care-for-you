/* 访客：时空门是基础建筑，客床数量决定同时能住几位，满床不来新的。
   每位访客住的天数由卡片决定，不一定满足需求才离开，没满足的以后可以再来。
   送礼只有匹配才成功，送错了对方收下，当场没有反馈，离开时的留言里带一句。 */
(function (CY) {
  const G = CY.game, V = CY.visitors, store = CY.store;
  const t = (k, v) => CY.t(k, v);

  G.DOOR = { act_per_day: 2, gift_max: 3, cooldown_max: 1, arrive_chance: 0.8 };
  G.guestBeds = () => 1 + (G.owned && G.owned('house2') ? 1 : 0);
  G.visits = () => (G.world.visits = G.world.visits || []);
  G.souvenirs = () => (G.world.souv = G.world.souv || {});
  G.giftInv = () => (G.world.gifts = G.world.gifts || {});
  G.visitorCard = id => V.cards[id] || null;
  const day = () => G.gameDate().n;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const ref = id => G.ref(`visitor.${id}.name`, (V.cards[id] && V.cards[id].t.name['zh-CN']) || id);
  G.visitHooks = [];
  const fire = (type, data) => { for (const h of G.visitHooks) h(type, data); };

  /* 今天还能互动几次：送礼和照料共用 */
  G.visitActsLeft = () => { const d = G.world.vday; return G.DOOR.act_per_day - (d && d.n === day() ? d.c : 0); };
  const useAct = () => { const d = G.world.vday; G.world.vday = d && d.n === day() ? { n: d.n, c: d.c + 1 } : { n: day(), c: 1 }; };

  /* 挑一位：没拿到纪念品的优先，没离开过的也比重复的多 */
  G.pickVisitor = () => {
    const here = new Set(G.visits().map(v => v.id)), souv = G.souvenirs(), met = G.world.met || {};
    const pool = V.order.filter(id => !here.has(id)).map(id => ({ id, w: souv[id] ? 0.15 : met[id] ? 2 : 3 }));
    const sum = pool.reduce((a, b) => a + b.w, 0);
    if (!sum) return null;
    let r = Math.random() * sum;
    for (const p of pool) { r -= p.w; if (r <= 0) return p.id; }
    return pool[pool.length - 1].id;
  };
  G.firstVisitorId = () => V.FIRST[CY.i18n.lang] || V.FIRST.default;

  G.arrive = id => {
    const c = V.cards[id]; if (!c) return null;
    const st = { id, since: day(), stay: rint(c.stay[0], c.stay[1]), day_in: 0, ok: false, wrong: [], talk: 0 };
    G.visits().push(st);
    G.world.met = Object.assign({}, G.world.met, { [id]: ((G.world.met || {})[id] || 0) + 1 });
    G.settleNote(`visitor.${id}.arrive_note`, {});
    G.logK('you', 'event', 'visit.log_arrive', { name: ref(id) });
    fire('arrive', st);
    return st;
  };

  /* 到来：新档第一次必到，之后每天午后看有没有空床，离开后隔最多一天 */
  G.maybeArrive = () => {
    if (!G.activePeople().length || !G.world.intro_done) return false;
    if (!G.world.visit_started) { G.world.visit_started = true; return !!G.arrive(G.firstVisitorId()); }
    if (G.visits().length >= G.guestBeds()) return false;
    if ((G.world.visit_cd || 0) > 0) { G.world.visit_cd--; return false; }
    if (Math.random() > G.DOOR.arrive_chance) return false;
    const id = G.pickVisitor();
    return id ? !!G.arrive(id) : false;
  };
  G.on(() => { if (!G.world.visit_started) G.maybeArrive(); });
  G.dayStartHooks.push(() => { G.maybeArrive(); });

  const satisfy = (st, how) => {
    const c = V.cards[st.id];
    st.ok = true;
    G.souvenirs()[st.id] = day();
    G.settleNote(`visitor.${st.id}.ok_line`, {});
    fire('ok', st);
    G.save();
  };

  /* 不用礼物的照料，卡片的 care 字段：rest 睡一觉 */
  G.visitCare = idx => {
    const st = G.visits()[idx]; if (!st) return { error: 'none' };
    const c = V.cards[st.id];
    if (!c.care || st.ok) return { error: 'nocare' };
    if (G.visitActsLeft() <= 0) return { error: 'limit' };
    useAct(); satisfy(st, 'care');
    return { ok: true, line: `visitor.${st.id}.ok_line` };
  };

  /* 说话：循环读卡片里的暗示，不占互动次数 */
  G.visitTalk = idx => {
    const st = G.visits()[idx]; if (!st) return null;
    const c = V.cards[st.id], n = (c.t.hint || []).length;
    if (!n) return null;
    const key = `visitor.${st.id}.hint.${st.talk % n}`; st.talk++;
    return key;
  };

  G.buyGift = id => {
    const g = V.GIFTS[id]; if (!g) return false;
    const inv = G.giftInv();
    if ((G.world.money || 0) < g.price || (inv[id] || 0) >= G.DOOR.gift_max) return false;
    G.world.money -= g.price; inv[id] = (inv[id] || 0) + 1; G.save(true);
    return true;
  };

  /* 送礼：匹配才成功；送错了收下，当场不说什么，礼物不退 */
  G.giveGift = (idx, giftId) => {
    const st = G.visits()[idx], inv = G.giftInv(); if (!st) return { error: 'none' };
    if (st.ok) return { error: 'done' };
    if (!(inv[giftId] > 0)) return { error: 'nogift' };
    if (G.visitActsLeft() <= 0) return { error: 'limit' };
    const c = V.cards[st.id];
    inv[giftId]--; if (!inv[giftId]) delete inv[giftId];
    useAct();
    if (c.wants.includes(giftId)) { satisfy(st, 'gift'); return { ok: true, line: `visitor.${st.id}.ok_line` }; }
    st.wrong.push(giftId); G.save();
    return { ok: false };
  };

  const leave = st => {
    const c = V.cards[st.id];
    G.settleNote(`visitor.${st.id}.${st.ok ? 'leave_ok' : 'leave_miss'}`, {});
    if (!st.ok && st.wrong.length && c.t.wrong_late && c.t.wrong_late['zh-CN']) G.settleNote(`visitor.${st.id}.wrong_late`, {});
    G.world.visits = G.visits().filter(x => x !== st);
    G.world.visit_cd = rint(0, G.DOOR.cooldown_max);
    fire('leave', st);
  };
  /* 日终：先于结算页的收口，访客在天数满的那天晚上离开，留言进当天的小结 */
  G.dayEndHooks.unshift(info => {
    for (const st of G.visits().slice()) { st.day_in++; if (st.day_in >= st.stay) leave(st); }
  });
  G.daysLeft = st => Math.max(0, st.stay - st.day_in);

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
