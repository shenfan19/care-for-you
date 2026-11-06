/* 日历与每日分享共用的结算文本：中文开局后换语言，称呼也必须翻译。 */
const assert = require('node:assert/strict');
const { CY, G } = require('./harness');

(async () => {
  CY.i18n.set('zh-CN');
  await G.load();
  const grandmaId = await G.createPerson({ arch: 'paternal_grandma', name: '奶奶', name_auto: 'paternal_grandma' });
  const babyId = await G.createPerson({ arch: 'baby', name: '宝宝', name_auto: 'baby' });
  const customId = await G.createPerson({ arch: 'mom', name: '小梅' });
  await G.load();
  G.world.today = null;
  const care = id => G.logK(id, 'care', 'log.care', { label: G.ref('act.water', '递水') });
  care(grandmaId); care(babyId);
  G.logK(babyId, 'cry', 'log.cry', {});
  const day = G.gameDate().n;
  const oldLines = [
    { k: 'settle.fam_water', a: { name: '奶奶' } },
    { k: 'settle.cry.0', a: { name: '宝宝' } },
    { k: 'visit.fam.med.elder', a: { guest: G.ref('visitor.nightingale.name', '南丁格尔'), who: '奶奶' } },
  ];
  assert(oldLines.every(line => CY.i18n.has(line.k)));
  const chinese = oldLines.map(G.settleText);

  CY.i18n.set('en'); await G.refreshAutoNames();
  care(grandmaId);
  assert.equal(G.world.today.care[grandmaId], 2, '同一天切语言后仍按同一角色计数');
  const fresh = G.closeDay({ day, offline: false });
  for (const lines of [oldLines, fresh.lines]) {
    const english = lines.map(G.settleText).join(' ');
    assert(!/奶奶|宝宝|南丁格尔/.test(english), english);
    assert(english.includes('Grandma') && english.includes('Baby'), english);
  }
  assert.deepEqual(oldLines.map(line => line.a.name || line.a.who), ['奶奶', '宝宝', '奶奶'], '显示旧日历不改写原始内容');

  const custom = { k: 'settle.self.0', a: { name: G.settleNameRef(G.get(customId)) } };
  assert(G.settleText(custom).includes('小梅'), '自定义名字保持原文');
  // 保存到日历后，即使角色改名或删除，引用仍有完整的翻译键和原文后备。
  const saved = JSON.parse(JSON.stringify(fresh));
  await CY.store.writeYaml(G.wpath('calendar.yaml'), { version: 1, days: [saved] });
  await G.loadCalendar();
  await G.updatePerson(grandmaId, { name: '阿婆' });
  const historical = G.cal.days[0].lines.map(G.settleText).join(' ');
  assert(historical.includes('Grandma') && !historical.includes('阿婆'));
  const customSnapshot = G.settleNameRef(G.get(grandmaId));
  const people = G.people;
  G.people = [];
  assert(G.cal.days[0].lines.map(G.settleText).join(' ').includes('Grandma'));
  assert(G.settleText({ k: 'settle.self.0', a: { name: customSnapshot } }).includes('阿婆'));
  G.people = people;
  CY.i18n.set('zh-CN');
  assert(G.cal.days[0].lines.map(G.settleText).join(' ').includes('奶奶'));

  // 没有身份依据或恰好与自动称呼相同的玩家姓名，不能擅自翻译。
  const literal = { k: 'settle.self.0', a: { name: '奶奶' } };
  assert(G.settleText(literal).includes('奶奶'));
  await G.updatePerson(customId, { name: '宝宝' });
  CY.i18n.set('en');
  assert(G.settleText({ k: 'settle.self.0', a: { name: '宝宝' } }).includes('宝宝'));
  // 还未结算的旧格式事实，也通过相同的称呼恢复逻辑生成句子。
  const legacyFacts = { n: day, care: {}, fam: {}, cry: {}, self: { 宝宝: 1 }, recovered: [], frail: [], bought: [], notes: [] };
  await G.updatePerson(customId, { name: '小梅' });
  assert(G.composeDay(legacyFacts, false).map(G.settleText).join(' ').includes('Baby'));
  CY.i18n.set('zh-CN');
  // 未改名的旧称呼切回中文保持原文；自定义改名不会反向污染历史。
  assert.equal(G.settleText(oldLines[1]), chinese[1]);
  console.log('通过：中英切换、已有日历、新结算、同日累计、访客互动、存取、改名与删除、自定义姓名保护');
})().catch(error => { console.error(error); process.exitCode = 1; });
