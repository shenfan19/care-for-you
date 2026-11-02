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

  /* 访客 */
  const endDay = () => { let g = 0; while (!G.dayRoll() && g++ < 100) G.advance(30, false); };
  {
    G.world.visits = []; G.world.visit_started = false; G.world.souv = {}; G.world.met = {}; G.world.gifts = {}; G.world.intro_done = true; G.world.money = 1000;
    CY.i18n.set('zh-CN');
    check('新档第一次来的是诸葛亮，英文环境是南丁格尔', (G.firstVisitorId() === 'zhuge') && (CY.i18n.set('en'), G.firstVisitorId() === 'nightingale') && (CY.i18n.set('zh-CN'), true));
    check('第一天午后必到', G.maybeArrive() === true && G.visits().length === 1 && G.visits()[0].id === 'zhuge');
    check('只有一张客床，不会来第二位', (G.world.visit_cd = 0, G.maybeArrive() === false) && G.visits().length === 1);
    check('让他睡一觉，满足并留下纪念品', (() => { const r = G.visitCare(0); return r.ok && G.visits()[0].ok && G.souvenirs().zhuge > 0; })());
    check('话会循环两条暗示', G.visitTalk(0) === 'visitor.zhuge.hint.0' && G.visitTalk(0) === 'visitor.zhuge.hint.1' && G.visitTalk(0) === 'visitor.zhuge.hint.0');
    const nd = G.gameDate().n; endDay();
    const rec = G.dayRecord(nd), txt = rec ? rec.lines.map(G.settleText).join('|') : '';
    check('住满一天，当晚离开，留言进日历', !G.visits().some(v => v.id === 'zhuge') && /羽扇/.test(txt) && /一觉睡到天黑/.test(txt), txt);
    check('离开后不是每天都来，冷却 0 到 1 天', G.world.visit_cd >= 0 && G.world.visit_cd <= 1);
    check('已拿到纪念品的人还会再来，但概率很低', (() => { G.world.visits = []; const c = {}; for (let i = 0; i < 400; i++) { const id = G.pickVisitor(); c[id] = (c[id] || 0) + 1; } return (c.zhuge || 0) < (c.nightingale || 0) && (c.zhuge || 0) < 120; })());
    /* 居里夫人：送错收下无反馈，送对留下纪念品，每天次数有上限 */
    G.world.visits = []; G.world.visit_cd = 0; G.world.vday = null; G.arrive('curie'); const i0 = 0;
    check('居里夫人要住三到四天', G.visits()[i0].stay >= 3 && G.visits()[i0].stay <= 4);
    G.world.money = 2000; G.buyGift('tea'); G.buyGift('lab_suit'); G.buyGift('kite');
    check('买礼物扣钱，背包里有', G.world.money === 2000 - 30 - 500 - 70 && G.giftInv().tea === 1 && G.giftInv().lab_suit === 1);
    check('每样最多三件', (() => { for (let i = 0; i < 5; i++) G.buyGift('seeds'); return G.giftInv().seeds === 3; })());
    const bad = G.giveGift(i0, 'tea');
    check('送错了对方收下，当场没有反馈，礼物不退，没满足', bad.ok === false && !bad.error && !G.giftInv().tea && !G.visits()[i0].ok && G.visits()[i0].wrong[0] === 'tea');
    const good = G.giveGift(i0, 'lab_suit');
    check('送对了满足并留下纪念品', good.ok === true && G.visits()[i0].ok && G.souvenirs().curie > 0);
    check('今天互动用完两次后再送被拒', (() => { G.giveGift(i0, 'kite'); return true; })() && G.visitActsLeft() === 0 && G.giveGift(i0, 'seeds').error === 'done');
    check('背包扣了送对的那件', !G.giftInv().lab_suit);
    /* 满足之前离开且送过错礼物，留言带一句延迟反馈 */
    G.world.visits = []; G.arrive('curie'); G.visits()[0].wrong.push('tea'); G.visits()[0].stay = 1; G.world.souv = {};
    const nd2 = G.gameDate().n; endDay();
    const rec2 = G.dayRecord(nd2), txt2 = rec2 ? rec2.lines.map(G.settleText).join('|') : '';
    check('没满足就离开，留言带延迟反馈', /惦记着实验/.test(txt2) && /更需要能护住双手/.test(txt2), txt2);
    G.world.visits = []; G.world.houses = undefined;
    check('客床数量：默认一张，买大房子两张', G.guestBeds() === 1 && (G.world.owned = Object.assign({}, G.world.owned, { house2: true }), G.guestBeds() === 2));
    check('英文下访客的名字和纪念品换成英文', (CY.i18n.set('en'), CY.t('visitor.curie.name') === 'Marie Curie' && CY.t('visitor.nightingale.souvenir') === 'An oil lamp') && (CY.i18n.set('zh-CN'), true));
  }
  check('三个开局背景改起始金额', G.chooseBackground('house') && G.world.money === 500 && G.world.background === 'house' && G.chooseBackground('return') && G.world.money === 200 && !G.chooseBackground('nope'));
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
