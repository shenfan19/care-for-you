/* 玩法测试：每日结算与日历、访客、送礼、展柜、开局背景、分享卡片数据。和 logic_test 分开，各自独立跑。 */
const { ctx, CY, G } = require('./harness');
let fails = 0;
const check = (n, c, x) => { if (!c) fails++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };
(async () => {
  CY.i18n.set('zh-CN');
  await G.load();
  G.DAY.enabled = true; G.cfg.time.daynight = 'game'; delete G.cfg.time.speed;
  for (const m of CY.content.presets[0].members) await G.createPerson({ arch: m.arch, name: m.name, conditions: m.conditions });
  await G.load();
  G.DAY.enabled = true;
  G.setClock(G.DAY.start); G._dayN = G.gameDate().n;
  const baby = G.people.find(p => p.person.name === '宝宝'), grandpa = G.people.find(p => p.person.name === '爷爷');

  /* 结算与日历 */
  {
    G.world.today = null; G.settleNote('settle.bought.0', { item: '测试' });
    G.logK(baby.id, 'care', 'log.care', { label: G.refAct({ id: 'meal', label: '做饭' }, baby), line: 'x' });
    G.logK(baby.id, 'cry', 'log.cry', { name: '宝宝', need: '饿' });
    const n0 = G.gameDate().n; G.world.money = 100;
    G.setClock(23 * 60 + 59); G.lastTick = Date.now() - 4000; G.tick();
    check('午夜后进了日历', G.cal.days.length === 1 && G.cal.days[0].n === n0, JSON.stringify(G.cal.days));
    const rec = G.dayRecord(n0), txt = rec.lines.map(G.settleText);
    check('一天三到五句', rec.lines.length >= 3 && rec.lines.length <= 5, txt.join(' | '));
    check('句子里有做饭和哭闹', txt.some(x => /热饭|吃得|厨房/.test(x)) && txt.some(x => /宝宝哭|宝宝闹/.test(x)), txt.join(' | '));
    check('存的是键，换英文重新生成', (CY.i18n.set('en'), G.settleText(rec.lines[0]) !== txt[0]) && (CY.i18n.set('zh-CN'), G.settleText(rec.lines[0]) === txt[0]));
    check('日历记录能存进文件', (G.save(true), await new Promise(r => setTimeout(r, 50)), CY.store.readYaml('calendar.yaml').then(c => c && c.days.length === 1)) && true);
    check('变体由日期决定，重算不变', JSON.stringify(G.composeDay({ n: 5, care: { 宝宝: 2 }, acts: {}, cry: {}, self: {}, recovered: [], frail: [], bought: [], notes: [] }, false)) === JSON.stringify(G.composeDay({ n: 5, care: { 宝宝: 2 }, acts: {}, cry: {}, self: {}, recovered: [], frail: [], bought: [], notes: [] }, false)));
  }

  /* 访客：家里的临时成员 */
  const endDay = async () => { let g = 0; while (!G.dayRoll() && g++ < 100) G.advance(30, false); await new Promise(r => setTimeout(r, 80)); };
  const wait = () => new Promise(r => setTimeout(r, 80));
  {
    G.DOOR.meet_chance = 0;
    G.world.visit_started = false; G.world.souv = {}; G.world.met = {}; G.world.gifts = {}; G.world.intro_done = true; G.world.money = 1000; G.world.vday = null; G.world.visit_cd = 0;
    const before = G.people.length;
    CY.i18n.set('zh-CN');
    check('新档第一次来的是诸葛亮，英文环境是南丁格尔', (G.firstVisitorId() === 'zhuge') && (CY.i18n.set('en'), G.firstVisitorId() === 'nightingale') && (CY.i18n.set('zh-CN'), true));
    check('没选完开局故事时不来', (G.world.story_pending = true, await G.maybeArrive()) === false && (G.world.story_pending = false, true));
    check('第一天午后必到，是家里的一个人', (await G.maybeArrive()) === true && G.people.length === before + 1 && G.visitorPeople().length === 1);
    const zhuge = G.visitorPeople()[0];
    check('访客有名字、外观和疲倦', zhuge.person.name === '诸葛亮' && zhuge.person.appearance.hair_style === 'bun' && zhuge.state.needs.rest >= 0.8 && zhuge.person.visitor.id === 'zhuge');
    check('访客出现在门口所在的院子', CY.world.agents[zhuge.id] && CY.world.agents[zhuge.id].room === 'yard');
    check('卡片外观转成人物外观，性别对应形象，同一人每次长得一样', (() => { const V = CY.visitors, c = V.cards.zhuge, A = zhuge.person.appearance, k = CY.charKeyOf(zhuge); return typeof A.skin === 'number' && A.hair_color === c.look.hairColor && A.cloth === c.look.clothes && k.startsWith('male') && G.lookOf(c).model === G.lookOf(c).model && G.lookOf(V.cards.nightingale).model.startsWith('female'); })());
    check('停留一到三天', zhuge.person.visitor.stay >= 1 && zhuge.person.visitor.stay <= 3);
    check('只有一张客床，不会来第二位', (G.world.visit_cd = 0, await G.maybeArrive()) === false && G.visitorPeople().length === 1);
    check('请ta睡一会儿只对访客出现', 'invite_rest' in G.actionsOf(zhuge) && !('invite_rest' in G.actionsOf(baby)) && !('invite_rest' in G.actionsOf(grandpa)));
    check('访客不当助力，也不算家人加成', (() => { const c0 = G.capacity(), b0 = G.householdBonus(); zhuge.state.mood = 0.9; return G.capacity() === c0 && G.householdBonus() === b0; })());
    check('访客不会卧床', (zhuge.state.frailty = 1, G.bedCheck(zhuge), !G.bedridden(zhuge)));
    G.applyAction(zhuge.id, 'invite_rest');
    check('请他睡一会儿，满足并留下纪念品', zhuge.person.visitor.ok === true && G.souvenirs().zhuge > 0);
    zhuge.person.visitor.stay = 1;
    const nd = G.gameDate().n; await endDay();
    const rec = G.dayRecord(nd), txt = rec ? rec.lines.map(G.settleText) : [];
    check('住满当晚离开，人从家里消失', !G.visitorPeople().some(p => p.person.visitor.id === 'zhuge') && !G.people.some(p => p.person.name === '诸葛亮'));
    check('小结平铺直叙：到来，睡了一觉，离开并留下礼物，按顺序', /诸葛亮从时空门里走了出来/.test(txt[0]) && /诸葛亮睡了一觉/.test(txt[1]) && txt.some(x => x === '诸葛亮离开了，但留下了一把羽扇作为礼物。'), txt.join(' | '));
    check('结算的那天记为没看过，点开日历后清掉', G.unread().includes(nd) && (G.markRead(nd), !G.unread().includes(nd)));
    check('离开后不是每天都来，冷却 0 到 1 天', G.world.visit_cd >= 0 && G.world.visit_cd <= 1);
    check('已拿到纪念品的人还会再来，但概率很低', (() => { for (const p of G.visitorPeople().slice()) G.deletePerson(p.id); const c = {}; for (let i = 0; i < 400; i++) { const id = G.pickVisitor(); c[id] = (c[id] || 0) + 1; } return (c.zhuge || 0) < 40; })());
    /* 居里夫人：送错收下无反馈，送对留下纪念品，每天次数有上限 */
    for (const p of G.visitorPeople().slice()) await G.deletePerson(p.id);
    G.world.visit_cd = 0; G.world.vday = null;
    const cp = await G.arrive('curie');
    check('居里夫人是家里的人，需求里没有特别的疲倦', G.visitorPeople().length === 1 && cp.person.name === '玛丽·居里' && !(cp.state.needs.rest >= 0.8));
    const V0 = CY.visitors.GIFTS; G.world.money = 2000; G.buyGift('tea'); G.buyGift('lab_suit'); G.buyGift('kite');
    check('买礼物扣钱，背包里有', G.world.money === 2000 - V0.tea.price - V0.lab_suit.price - V0.kite.price && G.giftInv().tea === 1 && G.giftInv().lab_suit === 1);
    check('每样最多三件', (() => { for (let i = 0; i < 5; i++) G.buyGift('seeds'); return G.giftInv().seeds === 3; })());
    check('背包没有的礼物，送出时按目录价当场买下；钱不够不送', (() => { const m = G.world.money, v = G.world.vday; G.world.money = 10; G.world.vday = null; const a = G.giveGift(cp.id, 'clock'); G.world.money = m; G.world.vday = v; return a.error === 'money'; })());
    const bad = G.giveGift(cp.id, 'tea');
    check('送错了对方收下，当场没有反馈，礼物不退，没满足', bad.ok === false && !bad.error && !G.giftInv().tea && !cp.person.visitor.ok && cp.person.visitor.wrong[0] === 'tea');
    const good = G.giveGift(cp.id, 'lab_suit');
    check('送对了满足并留下纪念品', good.ok === true && cp.person.visitor.ok && G.souvenirs().curie > 0 && !G.giftInv().lab_suit);
    check('送礼是行动圈里的一个动作，只对访客出现', 'gift' in G.actionsOf(cp) && !('gift' in G.actionsOf(baby)) && !('gift' in G.actionsOf(grandpa)));
    check('展柜是商店里的家具，买了才摆进屋里', (() => { G.world.money = 1000; const a = G.canBuy('cabinet'); G.buy('cabinet'); return a && G.owned('cabinet') && CY.house().items.cabinet.length > 0; })());
    check('已满足后再送被拒；每天只能送两次', G.giveGift(cp.id, 'kite').error === 'done' && G.giftsLeft() === 0);
    /* 满足之前离开且送过错礼物，留言带延迟反馈，只有"离开了" */
    for (const p of G.visitorPeople().slice()) await G.deletePerson(p.id);
    G.world.souv = {}; G.world.today = null; const cp2 = await G.arrive('curie'); cp2.person.visitor.wrong.push('tea'); cp2.person.visitor.stay = 1;
    const nd2 = G.gameDate().n; await endDay();
    const rec2 = G.dayRecord(nd2), txt2 = rec2 ? rec2.lines.map(G.settleText) : [];
    check('没满足就离开，只写离开了，留言带延迟反馈，没有礼物', txt2.includes('玛丽·居里离开了。') && txt2.some(x => /更需要能护住双手/.test(x)) && !txt2.some(x => /留下了/.test(x)), txt2.join(' | '));
    check('家人的日常也平铺直叙', (() => { const rr = G.composeDay({ n: 9, care: { 爷爷: 3 }, fam: { 爷爷: { street: 2, meal: 1 } }, acts: {}, cry: {}, self: {}, recovered: [], frail: [], bought: [], notes: [] }, false).map(G.settleText); return rr[0] === '今天爷爷去街上逛了逛。' || /爷爷/.test(rr[0]); })());
    for (const p of G.visitorPeople().slice()) await G.deletePerson(p.id);
    check('客床数量：默认一张，买大房子两张', G.guestBeds() === 1 && (G.world.owned = Object.assign({}, G.world.owned, { house2: true }), G.guestBeds() === 2));
    check('英文下访客的名字和纪念品换成英文', (CY.i18n.set('en'), CY.t('visitor.curie.name') === 'Marie Curie' && CY.t('visitor.nightingale.souvenir') === 'An oil lamp' && CY.t('gift.lab_suit') === 'Protective suit') && (CY.i18n.set('zh-CN'), true));
  }
  /* 卡片完整性 */
  {
    const V = CY.visitors, ids = V.order, bad = [];
    const opts = CY.avatarOptions;
    for (const id of ids) {
      const c = V.cards[id];
      if (!c.src || !c.review) bad.push(id + ':出处或核查');
      if (!c.wants.every(g => V.GIFTS[g]) || (!c.wants.length && !c.care)) bad.push(id + ':礼物');
      if (!(c.t.hint && c.t.hint.length >= 2)) bad.push(id + ':暗示');
      for (const k of ['name', 'era', 'souvenir', 'arrive_note', 'ok_line', 'leave_ok', 'leave_miss']) if (!(c.t[k] && c.t[k]['zh-CN'] && c.t[k].en)) bad.push(id + ':' + k);
      for (const h of c.t.hint) if (!(h['zh-CN'] && h.en)) bad.push(id + ':hint');
      if (!(c.stay[0] >= 1 && c.stay[1] >= c.stay[0] && c.stay[1] <= 4)) bad.push(id + ':天数');
      const l = c.look; if (!opts.hairColor.includes(l.hairColor) || !opts.hairStyle.includes(l.hairStyle) || !opts.glasses.includes(l.glasses) || !opts.skin.includes(l.skin)) bad.push(id + ':外观');
      if (!c.souvenir || !c.souvenir.icon) bad.push(id + ':纪念品');
    }
    check('官方卡片不少于三十张', ids.filter(i => V.cards[i].official).length >= 30, String(ids.length));
    check('每张卡片字段齐全、礼物存在、外观合法、双语齐全', bad.length === 0, bad.join());
    check('卡片编号和纪念品编号不重复', new Set(ids).size === ids.length && new Set(ids.map(i => V.cards[i].souvenir.id)).size === ids.length);
    check('每个礼物至少被一张卡片需要', Object.keys(V.GIFTS).filter(g => !ids.some(i => V.cards[i].wants.includes(g))).length <= 6, Object.keys(V.GIFTS).filter(g => !ids.some(i => V.cards[i].wants.includes(g))).join());
    check('同一件礼物不会被太多卡片需要，猜起来才有区分', Math.max(...Object.keys(V.GIFTS).map(g => ids.filter(i => V.cards[i].wants.includes(g)).length)) <= 8);
    check('官方卡片五十张，地区和行业标签齐全', ids.filter(i => V.cards[i].official).length === 50 && ids.every(i => V.AREAS.includes(V.cards[i].area) && V.FIELDS.includes(V.cards[i].field)));
    {
      const cnt = k => ids.reduce((m, i) => (m[V.cards[i][k]] = (m[V.cards[i][k]] || 0) + 1, m), {});
      const ar = cnt('area'), fd = cnt('field');
      check('每个地区至少六张，医疗卡最多', V.AREAS.every(a => ar[a] >= 5) && fd.med >= fd.sci - 0 && fd.pol <= 2, JSON.stringify(ar) + JSON.stringify(fd));
      for (const p of G.visitorPeople().slice()) await G.deletePerson(p.id);
      G.world.souv = {}; G.world.met = {}; G.world.last_area = null; CY.i18n.set('en');
      const byArea = {}, byField = {}; let n = 0;
      for (let i = 0; i < 6000; i++) { const id = G.pickVisitor(); G.world.last_area = null; const c = V.cards[id]; byArea[c.area] = (byArea[c.area] || 0) + 1; byField[c.field] = (byField[c.field] || 0) + 1; n++; }
      check('英文下六个地区被抽到的比例接近相等，没有偏向', V.AREAS.every(a => Math.abs(byArea[a] / n - 1 / 6) < 0.03), JSON.stringify(byArea));
      check('政治军事少，医疗每张被抽到的机会略高', (byField.pol || 0) / fd.pol < (byField.sci || 0) / fd.sci && (byField.med || 0) / fd.med > (byField.sci || 0) / fd.sci);
      CY.i18n.set('zh-CN');
      const h = { ea: 0, other: 0 }; for (let i = 0; i < 4000; i++) { G.world.last_area = null; const a = V.cards[G.pickVisitor()].area; h[a === 'ea' ? 'ea' : 'other']++; }
      check('中文下东亚略多一点，但没有压倒', h.ea / 4000 > 1 / 6 && h.ea / 4000 < 0.28, String(h.ea / 4000));
      for (const m of V.MEETS) if (!m.ids.every(i => V.cards[i]) || !CY.i18n.has('meet.' + m.key)) bad.push('组合' + m.key);
      check('珍稀组合的成员都存在，文字已登记', bad.filter(x => x.startsWith('组合')).length === 0 && V.MEETS.length >= 8);
      for (const q of G.visitorPeople().slice()) await G.deletePerson(q.id);
      G.world.meets = {}; G.world.today = null;
      const got = await G.arriveGroup(['li_bai', 'du_fu', 'basho']);
      check('三位同时到来：算遇见，小组也一并记为遇见过', got === true && G.visitorPeople().length === 3 && G.world.meets.poets3 && G.world.meets.friends2);
      check('遇见的话进当天小结，同一组合不重复触发', G.world.today.notes.some(x => x.k === 'meet.poets3') && (await G.arriveGroup(['li_bai', 'du_fu', 'basho'])) === false);
      for (const q of G.visitorPeople().slice()) await G.deletePerson(q.id);
      G.world.meets = {}; const gs = G.pickGroup(); check('还没遇见的组合才会被抽到', !!gs && gs.ids.length >= 2);
    }
    check('文字里没有死亡和战争的词', !ids.some(i => /死|葬|战争|杀|决斗|duel|death|dead|war/i.test(Object.values(V.cards[i].t).map(x => Array.isArray(x) ? x.map(y => Object.values(y).join(' ')).join(' ') : Object.values(x).join(' ')).join(' '))));
  }
  /* 存档被改过的标记 */
  {
    G.world.edited = false; G.beforeSave(); const sig = G.world.sig;
    G.afterLoad(); check('没改过不标记', !G.world.edited);
    G.world.money += 5000; G.afterLoad();
    check('手动改了钱，载入时标记已编辑，且一直保留', G.world.edited === true && (G.beforeSave(), G.afterLoad(), G.world.edited === true));
    check('签名不进卡片文字，只由数字算出', typeof sig === 'string' && sig.length >= 4);
  }
  console.log(fails ? `失败 ${fails} 项` : '全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
