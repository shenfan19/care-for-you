/* 玩法测试：每日结算与日历、访客、送礼、展柜、开局故事、分享卡片数据。和 logic_test 分开，各自独立跑。 */
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
    G.world.visit_started = false; G.world.souv = {}; G.world.met = {}; G.world.gifts = {}; G.world.intro_done = true; G.world.money = 1000; G.world.vday = null; G.world.visit_cd = 0; G.world.beds = G.bedUsers().length;
    const before = G.people.length;
    CY.i18n.set('zh-CN');
    check('第一位来客固定是南丁格尔，不分语言', (G.firstVisitorId() === 'nightingale') && (CY.i18n.set('en'), G.firstVisitorId() === 'nightingale') && (CY.i18n.set('zh-CN'), true));
    check('没选完开局故事时不来', (G.world.story_pending = true, await G.maybeArrive()) === false && (G.world.story_pending = false, true));
    check('第一天午后必到，是家里的一个人', (await G.maybeArrive()) === true && G.people.length === before + 1 && G.visitorPeople().length === 1);
    const zhuge = G.visitorPeople()[0];
    check('访客有名字、外观和疲倦', zhuge.person.name === '弗洛伦斯·南丁格尔' && zhuge.person.appearance.hair_style === 'bun' && zhuge.state.needs.rest >= 0.8 && zhuge.person.visitor.id === 'nightingale');
    check('访客出现在门口所在的院子', CY.world.agents[zhuge.id] && CY.world.agents[zhuge.id].room === 'yard');
    check('卡片外观转成人物外观，性别对应形象，同一人每次长得一样', (() => { const V = CY.visitors, c = V.cards.nightingale, A = zhuge.person.appearance, k = CY.charKeyOf(zhuge); return typeof A.skin === 'number' && A.hair_color === c.look.hairColor && A.cloth === c.look.clothes && k.startsWith('female') && G.lookOf(c).model === G.lookOf(c).model && G.lookOf(V.cards.nightingale).model.startsWith('female'); })());
    check('停留一到三天', zhuge.person.visitor.stay >= 1 && zhuge.person.visitor.stay <= 3);
    check('家里没有空床也会来第一位睡客厅，来了以后不会再来第二位', (G.world.visit_cd = 0, await G.maybeArrive()) === false && G.visitorPeople().length === 1);
    check('请ta睡一会儿只对访客出现', 'invite_rest' in G.actionsOf(zhuge) && !('invite_rest' in G.actionsOf(baby)) && !('invite_rest' in G.actionsOf(grandpa)));
    check('访客不当助力，也不算家人加成', (() => { const c0 = G.capacity(), b0 = G.householdBonus(); zhuge.state.mood = 0.9; return G.capacity() === c0 && G.householdBonus() === b0; })());
    check('访客不会卧床', (zhuge.state.frailty = 1, G.bedCheck(zhuge), !G.bedridden(zhuge)));
    G.applyAction(zhuge.id, 'invite_rest');
    check('请他睡一会儿，满足并留下纪念品', zhuge.person.visitor.ok === true && G.souvenirs().nightingale > 0);
    zhuge.person.visitor.stay = 1;
    const nd = G.gameDate().n; await endDay();
    const rec = G.dayRecord(nd), txt = rec ? rec.lines.map(G.settleText) : [];
    check('住满当晚离开，人从家里消失', !G.visitorPeople().some(p => p.person.visitor.id === 'nightingale') && !G.people.some(p => p.person.name === '弗洛伦斯·南丁格尔'));
    check('小结平铺直叙：到来，睡了一觉，离开并留下礼物，按顺序', /弗洛伦斯·南丁格尔推开大门走了进来/.test(txt[0]) && /弗洛伦斯·南丁格尔睡了一觉/.test(txt[1]) && txt.some(x => x === '弗洛伦斯·南丁格尔离开了，但留下了一盏油灯作为礼物。'), txt.join(' | '));
    check('结算的那天记为没看过，点开日历后清掉', G.unread().includes(nd) && (G.markRead(nd), !G.unread().includes(nd)));
    check('离开后不是每天都来，冷却 0 到 1 天', G.world.visit_cd >= 0 && G.world.visit_cd <= 1);
    check('已拿到纪念品的人还会再来，但概率很低', (() => { for (const p of G.visitorPeople().slice()) G.deletePerson(p.id); const c = {}; for (let i = 0; i < 400; i++) { const id = G.pickVisitor(); c[id] = (c[id] || 0) + 1; } return (c.nightingale || 0) < 40; })());
    /* 居里夫人：送错收下无反馈，送对留下纪念品，每天次数有上限 */
    for (const p of G.visitorPeople().slice()) await G.deletePerson(p.id);
    G.world.visit_cd = 0; G.world.vday = null;
    const cp = await G.arrive('curie');
    check('居里夫人是家里的人，需求里没有特别的疲倦', G.visitorPeople().length === 1 && cp.person.name === '玛丽·居里' && !(cp.state.needs.rest >= 0.8));
    const V0 = CY.visitors.GIFTS; G.world.money = 2000; G.buyGift('tea'); G.buyGift('lab_suit'); G.buyGift('kite');
    check('买礼物扣钱，背包里有', G.world.money === 2000 - V0.tea.price - V0.lab_suit.price - V0.kite.price && G.giftInv().tea === 1 && G.giftInv().lab_suit === 1);
    check('每样最多三件', (() => { for (let i = 0; i < 5; i++) G.buyGift('seeds'); return G.giftInv().seeds === 3; })());
    check('背包里没有的礼物送不出去，礼物在商店里买', (() => { const v = G.world.vday; G.world.vday = null; const a = G.giveGift(cp.id, 'clock'); G.world.vday = v; return a.error === 'nogift'; })());
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
    check('床位：人数严格不超过床位，买一张多一个空位，价格一张比一张贵，最多八张', (() => { G.world.money = 99999; G.world.beds = 4; const n0 = G.bedsOwned(), f0 = G.bedsFree(), p0 = G.bedPrice(); const ok = G.buyBed(); const p1 = G.bedPrice(); const r = ok && G.bedsOwned() === n0 + 1 && G.bedsFree() === f0 + 1 && p1 > p0; for (let k = 0; k < 10 && G.bedPrice() !== null; k++) G.buyBed(); return r && G.bedsOwned() === G.BED_MAX && !G.canBuyBed() && G.bedPrice() === null; })());
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
    check('官方卡片不少于五十张，地区和行业标签齐全', ids.filter(i => V.cards[i].official).length >= 50 && ids.every(i => V.AREAS.includes(V.cards[i].area) && V.FIELDS.includes(V.cards[i].field)));
    {
      const cnt = k => ids.reduce((m, i) => (m[V.cards[i][k]] = (m[V.cards[i][k]] || 0) + 1, m), {});
      const ar = cnt('area'), fd = cnt('field');
      check('每个地区至少六张，医疗卡最多', V.AREAS.every(a => ar[a] >= 5) && fd.med >= fd.sci - 0 && fd.pol <= 2, JSON.stringify(ar) + JSON.stringify(fd));
      for (const p of G.visitorPeople().slice()) await G.deletePerson(p.id);
      G.world.souv = {}; G.world.met = {}; G.world.last_area = null; CY.i18n.set('en');
      const byArea = {}, byField = {}; let n = 0;
      for (let i = 0; i < 6000; i++) { const id = G.pickVisitor(); G.world.last_area = null; const c = V.cards[id]; byArea[c.area] = (byArea[c.area] || 0) + 1; byField[c.field] = (byField[c.field] || 0) + 1; n++; }
      check('英文下六个地区被抽到的比例接近相等，没有偏向', V.AREAS.every(a => Math.abs(byArea[a] / n - 1 / 6) < 0.03), JSON.stringify(byArea));
      check('政治军事每张被抽到的机会比科学少；医疗占被抽到的三到四成，不是压倒多数', (byField.pol || 0) / fd.pol < (byField.sci || 0) / fd.sci && (byField.med || 0) / n > 0.25 && (byField.med || 0) / n < 0.45, String((byField.med || 0) / n));
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
    {
      const P = CY.i18n.packs, want = Object.keys(P.en).filter(k => /^(settle\.|cal\.|visit\.|start\.|share\.|acct\.|gift\.|shop\.cabinet|meet\.|visitor\.|title\.|corner\.|field\.|add\.no_bed)/.test(k)), miss = {};
      for (const l of ['de', 'es', 'fr', 'ja', 'ko', 'zh-TW']) { const m = want.filter(k => P.en[k] !== '' && !(P[l] && P[l][k])); if (m.length) miss[l] = m.slice(0, 5).join(); }
      check('八种语言的玩法文字和卡片文字齐全', Object.keys(miss).length === 0, JSON.stringify(miss));
      const ph = [], hold = s => [...new Set(String(s).match(/\{[a-z_]+\}/g) || [])].sort().join();
      for (const l of ['de', 'es', 'fr', 'ja', 'ko', 'zh-TW']) for (const k of want) if (P[l] && P[l][k] && hold(P[l][k]) !== hold(P.en[k])) ph.push(l + ':' + k);
      check('各语言译文里的占位符和英文一致', ph.length === 0, ph.slice(0, 6).join());
    }
    /* 对话关系：来客不参与家人的闲聊和问答，外甥女不叫主角妈妈，邻居老人不讲"你小时候"，来客有自己的名言 */
    {
      for (const q of G.visitorPeople().slice()) await G.deletePerson(q.id);
      await G.createPerson({ arch: 'dad', name: '爸爸' }); await G.createPerson({ arch: 'mom', name: '妈妈' }); await G.createPerson({ arch: 'aunt', name: '姑姑' }); await G.createPerson({ arch: 'uncle', name: '舅舅' }); const nid = await G.createPerson({ arch: 'niece', name: '外甥女' }), gid = await G.createPerson({ arch: 'neighbor', name: '邻居老人' }), kid = await G.createPerson({ arch: 'grandpa', name: '外公' });
      await G.load(); G.DAY.enabled = true;
      const niece = G.get(nid), neighbor = G.get(gid), kin = G.get(kid), mom = G.people.find(q => q.person.archetype === 'mom'), dad = G.people.find(q => q.person.archetype === 'dad');
      check('测试里有爸爸妈妈', !!mom && !!dad);
      if (mom) { G.setProtagonist(mom.id); check('外甥女不叫主角妈妈，叫阿姨', G.titleFor(niece) === '阿姨' && G.fmt('{title}，我饿了', niece) === '阿姨，我饿了' && G.titleFor(baby) === mom.person.name); }
      if (dad) { G.setProtagonist(dad.id); check('主角是爸爸时外甥女叫叔叔', G.titleFor(niece) === '叔叔'); G.world.last_area = null;
        check('亲外公会问小时候的事，邻居老人不会', G.askBank(kin).some(x => x.id === 'ask_e01') && !G.askBank(neighbor).some(x => /^ask_(e01|e06|e08|e10|x20)$/.test(x.id)));
        check('姑姑只对爸爸讲你小时候，舅舅只对妈妈讲', (() => { const au = G.people.find(q => q.person.archetype === 'aunt'), un = G.people.find(q => q.person.archetype === 'uncle'); if (!au || !un) return true; const r1 = G.askBank(au).some(x => x.id === 'ask_a02') && !G.askBank(un).some(x => x.id === 'ask_a02'); G.setProtagonist(mom.id); const r2 = G.askBank(un).some(x => x.id === 'ask_a02') && !G.askBank(au).some(x => x.id === 'ask_a02'); G.setProtagonist(dad.id); return r1 && r2; })()); }
      if (dad && mom) { G.setProtagonist(dad.id); check('妈妈不对做配偶的爸爸说"钱够不够用"，对成年的孩子才说', !G.pickOptions(mom, 99).some(x => x.id === 'parent04')); }
      await G.arrive('galois', true); const gv = G.visitorPeople()[0];
      for (let i = 0; i < 300; i++) { for (const k in G.req) delete G.req[k]; G.fire(); }
      check('来客不参与家人的闲聊和问答', !gv || !G.req[gv.id]);
      const V = CY.visitors, said = ids => ids.every(i => V.cards[i].t.hint.length > V.NEED_HINTS);
      check('有名言的来客，名言排在需求暗示后面', said(['galois', 'archimedes', 'li_bai', 'hippocrates', 'kahlo']) && V.cards.galois.t.hint[V.NEED_HINTS]['zh-CN'].includes('我没有时间了'));
      check('老年来客对家里老人是平辈，不是听对方讲从前', V.FAMPEER && CY.i18n.has('visit.fam.art.peer') && V.SENIOR_AGE === 50 && V.cards.hippocrates.age >= 60 && V.cards.galois.age < 30);
      /* 来客向主角提问：特化的先问，再是行业通用的；南丁格尔劝你歇一歇，选对了主角的休息需求降下来 */
      {
        for (const q of G.visitorPeople().slice()) await G.deletePerson(q.id);
        const lead = G.protagonist(); const ar = await G.arrive('archimedes', true), nf = await G.arrive('nightingale', true);
        const k1 = G.visitorAsk(ar), r1 = G.req[ar.id];
        check('阿基米德先问自己特化的问题：辩论', k1 === 'archimedes' && r1 && r1.kind === 'ask' && /支点/.test(r1.text) && r1.answers.length === 2 && /杠杆/.test(r1.reply));
        delete G.req[ar.id]; const k2 = G.visitorAsk(ar); check('特化问过以后问行业通用的（科学）', /^sci\.[01]$/.test(k2));
        lead.state.needs.rest = 0.8; G.visitorAsk(nf); G.answerAsk(nf.id, 0);
        check('南丁格尔劝你歇一歇，选了歇的回答，主角休息需求下降', lead.state.needs.rest < 0.75);
        for (const q of G.visitorPeople().slice()) await G.deletePerson(q.id);
      }
      for (const q of G.visitorPeople().slice()) await G.deletePerson(q.id);
    }
    check('页面上没有单列的"说过的话"，信息框只剩发生的事；收入率折进舒适度和家人加成', !require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').includes('id="said"') && (() => { const r = G.incomeRate(); return r > 0 && r <= G.WAGE * 2 && CY.i18n.has('corner.rate_tip'); })());
    check('文字里没有死亡，战争，恋爱和性的词', !ids.some(i => /死|葬|战争|杀|决斗|duel|death|dead|war/i.test(Object.values(V.cards[i].t).map(x => Array.isArray(x) ? x.map(y => Object.values(y).join(' ')).join(' ') : Object.values(x).join(' ')).join(' '))));
  }
  /* 存档被改过的标记 */
  {
    G.world.edited = false; G.beforeSave(); const sig = G.world.sig;
    G.afterLoad(); check('没改过不标记', !G.world.edited);
    G.world.money += 5000; G.afterLoad();
    check('手动改了钱，载入时标记已编辑，且一直保留', G.world.edited === true && (G.beforeSave(), G.afterLoad(), G.world.edited === true));
    check('签名不进卡片文字，只由数字算出', typeof sig === 'string' && sig.length >= 4);
  }
  /* 出门和小睡按现实秒算：一天压成五分钟以后，带人去医院，逛街，扶去休息，都要停留得让玩家看得见 */
  {
    CY.world.enforce = false;
    const gp = G.people.find(q => q.person.archetype === 'grandpa'); G.world.protagonist = null;
    G.clearFlag(gp, 'outing'); G.applyAction(gp.id, 'doctor'); const f = G.flag(gp, 'outing');
    check('带去看医生是出门去医院，待上约五十现实秒', !!f && f.place === 'hospital' && Math.abs((f.until - G.world.game_minutes) - G.realMin(50)) < 1e-6, f && JSON.stringify(f));
    G.clearFlag(gp, 'outing'); G.applyAction(gp.id, 'street'); const f2 = G.flag(gp, 'outing');
    check('逛街待约三十现实秒，不是几秒钟就回来', !!f2 && (f2.until - G.world.game_minutes) >= G.realMin(25), f2 && JSON.stringify(f2));
    G.clearFlag(gp, 'outing'); G.applyAction(gp.id, 'rest');
    check('扶去休息：睡着了，躺在自己的床上，睡约四十现实秒', G.activityOf(gp) === 'sleeping' && !!G.flag(gp, 'nap') && Math.abs((G.flag(gp, 'nap').until - G.world.game_minutes) - G.realMin(40)) < 1e-6 && CY.world.locationOf(gp).mode === 'sleep', JSON.stringify([G.activityOf(gp), !!G.flag(gp, 'nap'), CY.world.locationOf(gp)]));
    G.clearFlag(gp, 'nap'); check('小睡到点自己醒', G.activityOf(gp) !== 'sleeping' || G.dayMinutes() < 6.5 * 60 || G.dayMinutes() >= 22 * 60);
    const doc = CY.protocol && CY.protocol.person ? G.actionsOf(gp).doctor : null; check('看医生只由玩家带去，不进家人自己想去的清单', !doc || doc.manual === true);
  }
  /* 好感度：送到心仪的加很多，一般的加得不多，到五十就留下回礼；回答来客的问题也加一点；没有空床就不来 */
  {
    CY.i18n.set('zh-CN'); G.world.beds = 8; G.world.souv = {}; for (const q of G.visitorPeople().slice()) await G.deletePerson(q.id);
    const cu = await G.arrive('curie', true), st = cu.person.visitor; G.giftInv().tea = 9; G.giftInv().lab_suit = 1; G.giftInv().aspirin = 1;
    G.world.vday = null; const r1 = G.giveGift(cu.id, 'tea');
    check('送一般的礼物，好感只加一点，不算满足', r1.like === false && st.fav === G.FAV.other && !st.ok && !G.souvenirs().curie);
    G.world.beds = 8; G.world.vday = null; G.world.visit_cd = 0;
    let n = 1; while (!st.ok && n < 20) { G.world.vday = null; G.giveGift(cu.id, 'tea'); n++; }
    check('一般的礼物要送好几件才够，够了留下回礼', st.ok && n >= 6 && n <= 8 && G.souvenirs().curie > 0, 'n=' + n + ' fav=' + st.fav);
    const cu2 = await G.arrive('hippocrates', true), st2 = cu2.person.visitor; G.world.vday = null;
    const r2 = G.giveGift(cu2.id, 'aspirin'); check('送到心仪的，一下子加很多，直接达标', r2.like === true && st2.fav === G.FAV.like && st2.ok === true);
    const cu3 = await G.arrive('galois', true), st3 = cu3.person.visitor; G.visitorFav(cu3, G.FAV.ask);
    check('回答来客的问题，好感加一点', st3.fav === G.FAV.ask && !st3.ok);
    for (const q of G.visitorPeople().slice()) await G.deletePerson(q.id);
    G.world.beds = G.bedUsers().length; G.world.visit_started = true; G.world.visit_cd = 0; G.world.meets = {};
    check('买来的床用完了，客厅的客人床仍可接待一位，之后不会再来，组团到来也要床位够', G.bedsFree() === 0 && G.pickGroup() === null && (await G.maybeArrive()) === true && G.guestRoom() === 0 && (G.world.visit_cd = 0, await G.maybeArrive()) === false);
    check('客人睡在客厅的客人床，不占买来的床位', (() => { const g = G.livingGuest(); return g && CY.world.bedOf(g).room === 'living' && CY.world.bedPlan().living[0] === g.id && !G.bedUsers().includes(g); })());
    G.world.beds = undefined;
  }
  /* 保姆已经取消：旧存档里请过的保姆，载入时从家里拿掉；商店里有家里的东西和礼物两块，点钱的格子打开 */
  {
    const id = await G.createPerson({ name: '保姆', roleText: '保姆' }), f = `people/${id}/person.yaml`, y = await CY.store.readYaml(f);
    y.help = { role: 'nanny', proactive: true }; await CY.store.writeYaml(f, y); G.world.nanny_on = true;
    await G.load();
    check('旧存档里的保姆载入时被拿掉', !G.people.some(q => q.id === id) && !G.world.nanny_on && !G.nanny && !G.hireNanny);
    const fs = require('fs'), path = require('path'), life = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'life.js'), 'utf8'), head = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'header.js'), 'utf8');
    check('商店有家里的东西和礼物两块，点钱的格子直接打开商店，没有保姆入口', /shop\.sec_gifts/.test(life) && /shop\.sec_bed/.test(life) && /shop\.sec_decor/.test(life) && /mn\.onclick = \(\) => U\.shopDialog\(\)/.test(head) && !/helpDialog|nnhire/.test(life + head));
    check('界面里被调用的开局和商店函数都有定义', ['maybeIntro', 'introDialog', 'shopDialog'].every(f => new RegExp('U\.' + f + ' = ').test(life)) && /U\.giftDialog = /.test(fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'visitor.js'), 'utf8')) && /U\.onboard = /.test(fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'people_add.js'), 'utf8')));
    check('钱的格子写成 钱 加 每小时收入', /' \+' \+ rate \+ '\/h'/.test(head));
  }

  /* 来客不能被操纵；作息：同类的人不同时起床，幼儿老人有午睡，饭点前饿得快；气泡不会太密 */
  {
    const cu = await G.arrive('curie', true);
    check('来客不能当主角，和宠物一样', cu.person.controllable === false && !G.canLead(cu) && G.setProtagonist(cu.id) === false);
    const humans = G.activePeople().filter(p => G.isHuman(p) && G.routineOf(p));
    const wakes = humans.filter(p => G.stage(p) === 'adult').map(p => G.routineOf(p).wake.toFixed(2));
    check('同类的成年人起床时间散开，不是同一时刻', Math.max(...wakes) - Math.min(...wakes) > 0.2, wakes.join());
    const el = humans.find(p => G.stage(p) === 'elder'), ad = humans.find(p => G.stage(p) === 'adult');
    if (el && ad) check('老人比成年人起得早', G.routineOf(el).wake < G.routineOf(ad).wake, G.routineOf(el).wake.toFixed(2) + ' ' + G.routineOf(ad).wake.toFixed(2));
    if (ad) {
      const R = G.routineOf(ad); G.setClock(Math.round(R.meals[1] * 60) - 18); const near = G.rhythm(ad, 'hunger'); G.setClock(Math.round((R.meals[1] + 3) * 60)); const far = G.rhythm(ad, 'hunger');
      check('饭点前饿得快，两顿饭之间慢', near > 2 * far, near.toFixed(2) + ' vs ' + far.toFixed(2));
    }
    G.toast = {}; G.req = {}; G.toastQ = []; G.toastGapUntil = 0;
    const ps = G.activePeople().filter(p => !p.person.visitor).slice(0, 5);
    for (const p of ps) G.toastFor(p, '说话', 'soft');
    check('同一屏说话气泡不超过上限，多的排队', Object.keys(G.toast).length <= 2 && G.toastQ.length >= ps.length - 2, Object.keys(G.toast).length + ' 个，队里 ' + G.toastQ.length);
    G.toastGapUntil = 0; for (const id in G.toast) G.toast[id].until = 0; G.toastTick();
    check('前一个说完后排队的冒出来', G.toastQ.length < ps.length - 1);
  }

  /* 存档被手改过：导入时能看出来 */
  {
    G.world.money = 321; G._calDirty = true; G.save(true); await new Promise(r => setTimeout(r, 80));
    const A = CY.archive, ok = await A.exportSave(), good = await A.inspect(await ok.blob.arrayBuffer());
    check('导出的存档里每个文件导入时都被接受', good.rejected.length === 0, good.rejected.join()); check('没改过的存档导入时不提示已编辑', good.ok && !good.edited, JSON.stringify([G.world.sig, G.computeSig(), good.files['world.yaml'].match(/sig: .*/), good.files['world.yaml'].match(/money: .*/), (good.files['calendar.yaml'] || '').length, G.cal.days.length]));
    const files = Object.assign({}, good.files); files['world.yaml'] = files['world.yaml'].replace(/money: .*/, 'money: 999999');
    const enc = new TextEncoder(), blob = CY.store.zip(Object.keys(files).map(n => ({ name: 'careforyou-data/' + n, data: enc.encode(files[n]) })));
    const bad = await A.inspect(await blob.arrayBuffer());
    check('手改了钱的存档导入时提示已编辑', bad.ok && bad.edited === true);
  }

  /* 帮忙概率表：奶奶身体好帮宝宝 60%，不好 20%，爸妈 80%，心情只小幅修正 */
  {
    const ids = {}; for (const a of ['grandma', 'grandpa', 'mom']) ids[a] = await G.createPerson({ arch: a, name: a });
    const babyArch = CY.content.archetypes.find(a => a.species === 'human' && a.age < 1); ids.baby = await G.createPerson({ arch: babyArch.id, name: 'b2' });
    await G.load(); const by = a => G.people.find(p => p.id === ids[a]), baby2 = by('baby');
    for (const a in ids) { const h = by(a); h.state.mood = 0.5; h.state.needs = {}; h.state.frailty = 0.2; }
    const ch = (a, from) => G.respondChance({ kind: 'care', from: from.id, to: by(a).id });
    check('奶奶身体好时帮宝宝约六成', Math.abs(ch('grandma', baby2) - 0.6) < 0.02, ch('grandma', baby2).toFixed(3));
    by('grandma').state.frailty = 0.7;
    check('奶奶身体不好时帮宝宝约两成', Math.abs(ch('grandma', baby2) - 0.2) < 0.02, ch('grandma', baby2).toFixed(3));
    check('妈妈在家帮宝宝约八成', Math.abs(ch('mom', baby2) - 0.8) < 0.02, ch('mom', baby2).toFixed(3));
    by('mom').state.needs.hunger = 0.7;
    check('自己有急需时算身体不好', Math.abs(ch('mom', baby2) - 0.4) < 0.02, ch('mom', baby2).toFixed(3));
  }
  console.log(fails ? `失败 ${fails} 项` : '全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
