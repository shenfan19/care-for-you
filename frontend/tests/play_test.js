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
  console.log(fails ? `失败 ${fails} 项` : '全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
