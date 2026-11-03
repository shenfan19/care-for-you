/* 访客：从时空门里走出来的人，在家里住一两天，和家里人一样有需求，用同样的动作照顾。
   每位访客是一个临时的家庭成员：基于朋友或邻居的模板，再按卡片给外观、年龄和起始的疲倦。离开时这个人从家里消失，只留下记录里的一句话和一件纪念品。
   客床数量决定同时能住几位，满床不来新的。送礼是单独的按钮：只有送到对方真正需要的东西才算数，送错了对方收下，当场没有反馈。 */
(function (CY) {
  const G = CY.game, V = CY.visitors, store = CY.store;
  const t = (k, v) => CY.t(k, v);

  G.DOOR = { gifts_per_day: 2, gift_max: 3, stay_min: 1, stay_max: 3, cooldown_max: 1, arrive_chance: 0.8, hint_gap: [40, 70], door_room: 'yard', meet_chance: 0.06, fam_gap: [90, 150], ask_gap: [70, 130] };
  /* 选人的倾向：每个地区总权重相等，卡多的地区不会多来；医疗略加，政治军事减；界面语言所在的地区略加；上一位同地区的略减，免得连着来 */
  G.PICK = { field: { med: 1.3, pol: 0.5 }, home: 1.5, repeat: 0.5, home_of: { 'zh-CN': ['ea'], 'zh-TW': ['ea'], ja: ['ea'], ko: ['ea'], de: ['eu'], fr: ['eu'], es: ['eu', 'am'] } };
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
    const nf = {}; for (const id of V.order) { const f = V.cards[id].field; nf[f] = (nf[f] || 0) + 1; }
    /* 行业也向均匀靠拢：卡多的行业每张权重降一点，卡少的升一点，开方并限在 0.6 到 1.5，不完全拉平 */
    const soft = f => Math.min(1.5, Math.max(0.6, Math.sqrt(V.order.length / V.FIELDS.length / (nf[f] || 1))));
    /* 行业因子算完，再让每个地区的因子总和相等：地区之间始终均分，行业只在地区内部分配 */
    const fw = id => { const f = V.cards[id].field; return soft(f) * (G.PICK.field[f] || 1); }, asum = {};
    for (const id of V.order) { const a = V.cards[id].area; asum[a] = (asum[a] || 0) + fw(id); }
    const home = G.PICK.home_of[CY.i18n.lang] || [], last = G.world.last_area;
    const pool = V.order.filter(id => !here.has(id)).map(id => {
      const c = V.cards[id], base = souv[id] ? 0.15 : met[id] ? 2 : 3;
      return { id, w: base * fw(id) / asum[c.area] * (home.includes(c.area) ? G.PICK.home : 1) * (c.area === last ? G.PICK.repeat : 1) };
    });
    const sum = pool.reduce((a, b) => a + b.w, 0);
    if (!sum) return null;
    let r = Math.random() * sum;
    for (const p of pool) { r -= p.w; if (r <= 0) return p.id; }
    return pool[pool.length - 1].id;
  };
  G.firstVisitorId = () => V.FIRST[CY.i18n.lang] || V.FIRST.default;

  /* 卡片外观转成人物外观：肤色按色表取编号，发色发型衣服换成人物用的字段名；形象从同性别的六个里按卡片编号固定挑一个，同一个人每次来都长一样。卡片里写了 model 就用它 */
  const hashId = x => { let h = 0; for (const ch of String(x)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  G.lookOf = c => {
    const O = CY.avatarOptions || {}, l = c.look || {}, sk = (O.skin || []).indexOf(l.skin), keys = CY.charKeys || [];
    const pool = keys.filter(k => k.startsWith(c.pronoun === '她' ? 'female' : 'male'));
    const model = keys.includes(l.model) ? l.model : pool.length ? pool[hashId(c.id) % pool.length] : undefined;
    return { skin: sk < 0 ? 2 : sk, hair_color: l.hairColor, hair_style: l.hairStyle, glasses: l.glasses, cloth: l.clothes, model };
  };

  /* 到来：建一个人，放在门口，之后和家里人一样自己走动 */
  G.arrive = async (id, quiet) => {
    const c = V.cards[id]; if (!c) return null;
    const pid = await G.createPerson({ arch: c.age >= 60 ? 'neighbor' : 'friend', name: t(`visitor.${id}.name`), age: c.age, pronoun: c.pronoun, look: G.lookOf(c) });
    const p = await G.loadOnePerson(pid, []);
    if (!p) return null;
    p.person.visitor = { id, since: day(), stay: rint(G.DOOR.stay_min, G.DOOR.stay_max), day_in: 0, ok: false, wrong: [], talk: 0 };
    if (c.tired) p.state.needs.rest = c.tired;
    p.state.mood = 0.55;
    await saveVisitor(p);
    if (CY.world && CY.world.agents) CY.world.agents[pid] = { room: G.DOOR.door_room, next: Date.now() + 15000 };
    G.world.met = Object.assign({}, G.world.met, { [id]: ((G.world.met || {})[id] || 0) + 1 });
    G.world.last_area = c.area;
    G.settleNote('settle.visit_arrive', { name: nameRef(id) });
    G.logK('you', 'event', 'visit.log_arrive', { name: nameRef(id) });
    fire('arrive', p);
    if (!quiet) checkMeet();
    G.save();
    return p;
  };

  /* 珍稀组合：几位同时在家，且这一组还没遇见过，就记一句只属于他们的话。大组先看，触发后包含在里面的小组也算遇见过 */
  const checkMeet = () => {
    const here = new Set(G.visitorPeople().map(p => p.person.visitor.id)), seen = G.world.meets = G.world.meets || {};
    for (const m of V.MEETS.slice().sort((a, b) => b.ids.length - a.ids.length)) {
      if (seen[m.key] || !m.ids.every(i => here.has(i))) continue;
      for (const o of V.MEETS) if (o.ids.every(i => m.ids.includes(i))) seen[o.key] = day();
      G.settleNote('meet.' + m.key, {});
      G.logK('you', 'event', 'meet.' + m.key, {});
      fire('meet', m);
      return true;
    }
    return false;
  };
  /* 组团到来：不看客床，因为是结伴来的；平时很少发生，还没遇见过的组合优先 */
  G.arriveGroup = async ids => { for (const id of ids) if (!G.visitorPeople().some(p => p.person.visitor.id === id)) await G.arrive(id, true); return checkMeet(); };
  G.pickGroup = () => {
    const seen = G.world.meets || {}, pool = V.MEETS.filter(m => !seen[m.key]);
    if (!pool.length) return null;
    const w = m => (m.ids.length === 3 ? 0.5 : 1);
    let r = Math.random() * pool.reduce((a, m) => a + w(m), 0);
    for (const m of pool) { r -= w(m); if (r <= 0) return m; }
    return pool[pool.length - 1];
  };

  /* 新档第一次必到，之后每天午后看有没有空床，离开后隔最多一天 */
  G.maybeArrive = async () => {
    if (!G.activePeople().length || !G.world.intro_done || G.world.story_pending) return false;
    if (!G.world.visit_started) { G.world.visit_started = true; return !!(await G.arrive(G.firstVisitorId())); }
    if (!G.visitorPeople().length && Math.random() < G.DOOR.meet_chance) { const m = G.pickGroup(); if (m) return G.arriveGroup(m.ids); }
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
    if (!(inv[giftId] > 0)) return { error: 'nogift' };
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
      /* 没满足时轮流说需求暗示和自己的话，满足以后只剩自己的话 */
      const from = st.ok ? V.NEED_HINTS : 0, pool = n > from ? n - from : 0;
      if (!pool || G.isSleeping(p) || G.toast[p.id]) continue;
      if (nextHint[p.id] === undefined) nextHint[p.id] = now + 8000;
      if (now < nextHint[p.id]) continue;
      nextHint[p.id] = now + 1000 * rint(G.DOOR.hint_gap[0], G.DOOR.hint_gap[1]);
      const text = t(`visitor.${st.id}.hint.${from + (st.talk % pool)}`); st.talk++;
      if (G.toastFor) G.toastFor(p, text, 'soft');
    }
  });

  /* 来客和主角的对话：隔一阵向主角提一个问题，两个回答，回答完来客接一句。每个人在类型卡（行业）的通用问题之上，有自己特化的一条，
     例如阿基米德要辩论，南丁格尔劝你歇一歇。每位来客一次停留最多问三个，特化的先问。问题就是一个普通的问答气泡，没回答会收起，不算数 */
  G.visitorAsk = p => {
    const st = p.person.visitor, c = V.cards[st.id], lead = G.protagonist(); if (!c || !lead || G.req[p.id]) return null;
    const used = st.asked = st.asked || [], spec = V.ASKS[st.id];
    let key, base, rest;
    if (spec && !used.includes(st.id)) { key = st.id; base = `visitor.${st.id}.ask`; rest = spec.rest; }
    else { const g = [0, 1].map(n => `${c.field}.${n}`).filter(k => !used.includes(k)); if (!g.length) return null; key = g[Math.floor(Math.random() * g.length)]; base = `visit.ask.${key}`; }
    used.push(key);
    G.req[p.id] = G.mkReq({ pid: p.id, kind: 'ask', askId: 'visit:' + key, text: t(base + '.say'), answers: [t(base + '.a0'), t(base + '.a1')], reply: t(base + '.reply'), rest });
    saveVisitor(p);
    return key;
  };
  const nextAsk = {};
  G.on(() => {
    const now = Date.now();
    for (const p of G.visitorPeople()) {
      if (G.isSleeping(p) || G.req[p.id] || !G.protagonist()) continue;
      if (nextAsk[p.id] === undefined) nextAsk[p.id] = now + 1000 * rint(G.DOOR.ask_gap[0], G.DOOR.ask_gap[1]);
      if (now < nextAsk[p.id]) continue;
      nextAsk[p.id] = now + 1000 * rint(G.DOOR.ask_gap[0], G.DOOR.ask_gap[1]);
      G.visitorAsk(p);
    }
  });

  /* 来客和家人的小互动：隔一阵挑一位家人，按来客的行业和对方的年龄段取一句，冒成气泡并记进当天小结；每位来客一天最多一次 */
  const GROUP = { infant: 'little', toddler: 'little', child: 'child', teen: 'child', adult: 'adult', elder: 'elder' };
  const nextFam = {};
  G.on(() => {
    const now = Date.now();
    for (const p of G.visitorPeople()) {
      const st = p.person.visitor, c = V.cards[st.id];
      if (!c || G.isSleeping(p)) continue;
      if (nextFam[p.id] === undefined) nextFam[p.id] = now + 1000 * rint(G.DOOR.fam_gap[0], G.DOOR.fam_gap[1]);
      if (now < nextFam[p.id]) continue;
      nextFam[p.id] = now + 1000 * rint(G.DOOR.fam_gap[0], G.DOOR.fam_gap[1]);
      if (st.fam_day === day()) continue;
      const kin = G.activePeople().filter(q => !q.person.visitor && G.isHuman(q) && GROUP[G.stage(q)]);
      if (!kin.length) continue;
      const q = kin[Math.floor(Math.random() * kin.length)], grp = GROUP[G.stage(q)], key = `visit.fam.${c.field}.${grp === 'elder' && c.age >= V.SENIOR_AGE ? 'peer' : grp}`;
      st.fam_day = day();
      G.settleNote(key, { guest: nameRef(st.id), who: q.person.name });
      if (G.toastFor) G.toastFor(p, t(key, { guest: p.person.name, who: q.person.name }), 'soft');
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
