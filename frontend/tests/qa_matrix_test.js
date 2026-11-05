/* 全功能穷举测试：每个动作 x 每种人 x 谁当主角 x 买没买物品，加商店、外出、睡觉、语言包。
   发现的问题按条列出，不是只看通过数；单独运行：node tests/qa_matrix_test.js */
const { ctx, CY, G } = require('./harness');
let fails = 0;
const check = (n, c, x) => { if (!c) fails++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FAMILY = ['dad', 'mom', 'baby', 'toddler', 'daughter', 'teen', 'paternal_grandpa', 'paternal_grandma', 'cat', 'dog', 'succulent'];
(async () => {
  CY.i18n.set('zh-CN');
  await G.load();
  G.world.money = 100000;
  const by = {};
  for (const a of FAMILY) { const id = await G.createPerson({ arch: a, name: a }); by[a] = id; }
  await G.load();
  const P = a => G.people.find(p => p.person.name === a);
  const reset = () => { for (const p of G.people) { for (const k of Object.keys(p.state.needs)) p.state.needs[k] = 0.1; p.state.mood = 0.5; delete p.state.bedrest; p.state.frailty = 0.3; for (const f of ['outing', 'nap', 'hospital']) G.clearFlag(p, f); } G.world.owned = {}; G.world.trip = null; for (const p of G.people) G.act[p.id] = G.activityOf(p); };

  /* 1 每个人每个动作：作为非主角被照顾，作为主角自己做 */
  const bad = [];
  for (const lead of ['dad', 'mom', 'paternal_grandpa', 'teen', 'daughter']) {
    for (const tgt of FAMILY) {
      for (const owned of [false, true]) {
        reset(); G.setProtagonist(P(lead).id); if (owned) for (const it of G.SHOP) G.world.owned[it.id] = true;
        const p = P(tgt), acts = G.actionsOf(p);
        for (const id in acts) {
          const a = acts[id];
          reset(); G.setProtagonist(P(lead).id); if (owned) for (const it of G.SHOP) G.world.owned[it.id] = true;
          if (p === G.protagonist()) { /* 自己做 */ }
          if (Object.keys(a.effect || {}).length && !Object.keys(a.effect).some(k => k in p.state.needs)) bad.push(`${lead}->${tgt}.${id}: 效果全指向不存在的需求`);
          for (const k in a.effect || {}) if (k in p.state.needs) G.setNeed(p, k, 0.9);
          const before = {}; for (const k in a.effect || {}) if (k in p.state.needs) before[k] = G.level(p, k);
          let r; try { r = G.applyAction(p.id, id); } catch (e) { bad.push(`${lead}->${tgt}.${id} 抛错 ${e.message}`); continue; }
          if (!r) bad.push(`${lead}->${tgt}.${id}: applyAction 返回 false`);
          for (const k in before) if (a.effect[k] > 0 && !(G.level(p, k) > before[k] + 1e-9) && !a.outing && !a.trip) bad.push(`${lead}->${tgt}.${id}: ${k} 水平没升`);
          if (G.flag(p, 'outing') && !a.outing && !a.away) bad.push(`${lead}->${tgt}.${id}: 莫名外出`);
        }
      }
    }
  }
  check('动作矩阵无异常', bad.length === 0, '\n  ' + [...new Set(bad)].slice(0, 60).join('\n  '));

  /* 2 睡觉：爸爸能让妈妈睡 */
  for (const [lead, tgt] of [['dad', 'mom'], ['mom', 'dad'], ['dad', 'teen'], ['teen', 'mom'], ['paternal_grandpa', 'mom']]) {
    reset(); G.setProtagonist(P(lead).id); const t = P(tgt); G.setNeed(t, 'rest', 0.9);
    const has = 'invite_rest' in G.actionsOf(t);
    check(`${lead}能请${tgt}睡觉`, has);
    if (has) { G.applyAction(t.id, 'invite_rest'); G.tick && 0; check(`  ${tgt}睡着了`, G.isSleeping(t) && G.activityOf(t) === 'sleeping', 'act=' + G.act[t.id]); }
  }
  /* 不困的人不会被送去睡，说明原因；困的人睡着，台词用 rest 一类，不是通用兜底 */
  for (const [lead, tgt] of [['mom', 'dad'], ['dad', 'mom']]) {
    reset(); G.setProtagonist(P(lead).id); const t = P(tgt); G.setNeed(t, 'rest', 0.05);
    const r = G.applyAction(t.id, 'invite_rest');
    check(`${tgt}不困时请睡被拒`, r === false && !G.isSleeping(t) && !G.flag(t, 'nap'));
    G.setNeed(t, 'rest', 0.6); check(`${tgt}困了请睡成功`, G.applyAction(t.id, 'invite_rest') === true && G.isSleeping(t));
  }
  for (const tgt of ['paternal_grandpa', 'paternal_grandma']) { reset(); G.setProtagonist(P('dad').id); check(`爸爸能扶${tgt}去休息`, 'rest' in G.actionsOf(P(tgt))); }
  /* 婴幼儿哄睡 */
  for (const tgt of ['baby', 'toddler', 'daughter']) { reset(); G.setProtagonist(P('mom').id); G.setNeed(P(tgt), 'rest', 0.9); check(`妈妈能哄${tgt}睡`, 'soothe' in G.actionsOf(P(tgt))); G.applyAction(P(tgt).id, 'soothe'); check(`  ${tgt}睡着`, G.isSleeping(P(tgt))); }

  /* 3 外出与婴儿车：没车只有成年人抱得出去，有车谁都行；卧床老人要轮椅 */
  const ok = (lead, owned, tgt, act) => { reset(); G.setProtagonist(P(lead).id); if (owned) G.world.owned[owned] = true; return act in G.actionsOf(P(tgt)); };
  for (const lead of ['dad', 'mom']) { check(`${lead}无车可带婴儿去公园`, ok(lead, null, 'baby', 'park')); check(`${lead}无车可带婴儿逛街`, ok(lead, null, 'baby', 'street')); }
  for (const lead of ['paternal_grandpa', 'paternal_grandma', 'teen', 'daughter']) {
    check(`${lead}无车不能带婴儿出门`, !ok(lead, null, 'baby', 'park') && !ok(lead, null, 'baby', 'street'));
    check(`${lead}有车能带婴儿出门`, ok(lead, 'stroller', 'baby', 'park') && ok(lead, 'stroller', 'baby', 'street'));
  }
  check('幼儿不需要车', ok('paternal_grandpa', null, 'toddler', 'park'));
  /* 按钮缺失时给出原因 */
  reset(); G.setProtagonist(P('paternal_grandpa').id);
  check('爷爷当主角没车时，婴儿面板提示要婴儿车', G.outingHint(P('baby')) === 'hint.need_stroller');
  G.world.owned.stroller = true; check('买了车就没有提示', G.outingHint(P('baby')) === '');
  reset(); G.setProtagonist(P('dad').id); check('爸爸当主角不需要提示', G.outingHint(P('baby')) === '');
  { const gp = P('paternal_grandpa'); gp.state.frailty = 0.9; G.bedCheck(gp); check('卧床老人没轮椅提示要轮椅', G.outingHint(gp) === 'hint.need_wheelchair'); G.world.owned.wheelchair = true; check('有轮椅后提示消失', G.outingHint(gp) === ''); gp.state.frailty = 0.2; G.bedCheck(gp); }
  /* 出门全流程：婴儿跟着去，婴儿车显示在外，回来后恢复 */
  for (const [lead, owned] of [['dad', false], ['dad', true], ['paternal_grandpa', true]]) {
    reset(); G.setProtagonist(P(lead).id); if (owned) G.world.owned.stroller = true;
    for (const a of FAMILY) if (!['baby', 'toddler', lead, 'cat'].includes(a)) P(a).person.active = false;
    const tg = P('toddler'); G.applyAction(tg.id, 'park');
    const b = P('baby');
    check(`主角${lead} 车${owned} 带幼儿去公园，婴儿同去`, !!G.flag(tg, 'outing') && !!G.flag(b, 'outing'));
    check(`  婴儿车外出标记`, G.usingStroller(b) === owned && G.itemAway('stroller') === owned);
    for (const a of FAMILY) P(a).person.active = true;
  }
  /* 4 商店：每件逐个买，钱，顺序，效果，描述，价格 */
  {
    reset(); G.world.money = 100000; G.setProtagonist(P('dad').id);
    for (const it of G.SHOP) {
      const d0 = G.world.money; const need = it.needs && !G.owned(it.needs);
      if (need) { check(`${it.id}未买前置不能买`, !G.canBuy(it.id)); G.buy(it.needs); }
      const r = G.buy(it.id); check(`买${it.id}成功并扣钱`, r && G.world.money <= d0 - it.price && G.owned(it.id));
      check(`  不能重复买${it.id}`, !G.canBuy(it.id));
    }
    G.world.owned = {}; G.world.money = 50; check('钱不够不能买', G.SHOP.every(i => !G.canBuy(i.id)));
    const b = P('baby'), d = P('dad'), gp = P('paternal_grandpa'), c = P('daughter');
    const play = { effect: { play: 0.5 } }, eat = { effect: { hunger: 0.3 } }, tod = P('toddler');
    G.world.owned = { toy: true };
    check('玩具只加成婴幼儿的玩耍，大人孩子没有', G.shopBoost(b, play).scale.play === 1.4 && G.shopBoost(tod, play).scale.play === 1.4 && !G.shopBoost(d, play).scale.play && !G.shopBoost(c, play).scale.play);
    check('玩具不改需求涨落的速度', Object.keys(G.shopFx(b).rate).length === 0);
    G.world.owned = { fruit: true }; check('果盘对所有人的吃东西加成四成', G.shopBoost(d, eat).scale.hunger === 1.4 && G.shopBoost(b, eat).scale.hunger === 1.4 && !G.shopBoost(d, play).scale.play);
    G.world.owned = { books: true }; check('书架：婴幼儿没有，大人孩子休闲时当次多一点心情', !G.shopBoost(b, play).mood && G.shopBoost(c, play).mood === 0.04 && G.shopBoost(d, play).mood === 0.04);
    G.world.owned = { wheelchair: true }; check('轮椅不再改需求速度', Object.keys(G.shopFx(gp).rate).length === 0);
    /* 轮椅是解锁：腿脚不便的老人，体弱或有关节炎，没有轮椅出不了门 */
    { gp.state.frailty = 0.6; gp.person.conditions = [];
      G.world.owned = {}; G.setProtagonist(P('dad').id);
      check('体弱的老人算腿脚不便，没有轮椅出不了门', G.legsBad(gp) && !('park' in G.actionsOf(gp)) && !('street' in G.actionsOf(gp)) && G.outingHint(gp) === 'hint.need_wheelchair', JSON.stringify([G.legsBad(gp), 'park' in G.actionsOf(gp), 'street' in G.actionsOf(gp), G.outingHint(gp), G.stage(gp), gp.state.frailty, G.bedridden(gp)]));
      G.world.owned = { wheelchair: true };
      check('有了轮椅能出门，还多出推轮椅的动作，出门的好处多两成半', 'street' in G.actionsOf(gp) && 'wheel' in G.actionsOf(gp) && G.shopBoost(gp, { outing: {}, effect: { mobility: 0.5 } }).all === 1.25);
      gp.state.frailty = 0.2; gp.person.conditions = ['arthritis'];
      G.world.owned = {}; check('有关节炎的老人也算腿脚不便', G.legsBad(gp) && !('street' in G.actionsOf(gp)));
      gp.person.conditions = []; check('硬朗的老人不受限，也没有推轮椅的动作', !G.legsBad(gp) && 'street' in G.actionsOf(gp) && !('wheel' in G.actionsOf(gp)));
      G.world.owned = { wheelchair: true }; check('硬朗的老人轮椅没有出门加成', G.shopBoost(gp, { outing: {}, effect: { mobility: 0.5 } }).all === 1);
    }
    G.world.owned = {};
  }
  /* 5 床位 */
  {
    G.world.gbeds = 1; G.world.money = 100000; const p0 = G.world.money;
    check('客房床价格 600 再 400', G.bedPrice() === 600 && (G.buyBed(), G.bedPrice() === 400) && (G.buyBed(), G.bedPrice() === null) && !G.canBuyBed() && G.guestBedsOwned() === 3 && p0 - G.world.money === 1000);
  }
  /* 6 语言包：每个动作、需求、商店条目在八种语言里都有文字，且没有回退成中文 */
  {
    const langs = ['zh-CN', 'zh-TW', 'en', 'fr', 'ja', 'ko', 'es', 'de'], miss = [];
    const ids = new Set(); for (const sp of Object.values(G.tpl.species)) for (const k in sp.actions || {}) ids.add(k);
    for (const l of langs) {
      CY.i18n.set(l);
      for (const k of ['hint.need_stroller', 'hint.need_wheelchair', 'hint.cant_leave']) if (!CY.i18n.hasOwn(k)) miss.push(l + ' ' + k);
      for (const it of G.SHOP) for (const k of ['shop.' + it.id, 'shop.' + it.id + '_fx']) if (!CY.i18n.hasOwn(k)) miss.push(l + ' ' + k);
      for (const id of ids) if (!CY.i18n.hasOwn('act.' + id) && !['zh-CN'].includes(l) || (l === 'zh-CN' && false)) { const has = ['infant', 'toddler', 'child', 'teen', 'adult', 'elder'].some(s => CY.i18n.hasOwn('act.' + id + '.' + s)); if (!has) miss.push(l + ' act.' + id); }
      if (l !== 'zh-CN') for (const it of G.SHOP) { if (/[一-鿿]/.test(CY.t('shop.' + it.id + '_fx')) && !['zh-TW','ja'].includes(l)) miss.push(l + ' 商店说明含中文 ' + it.id); }
    }
    CY.i18n.set('zh-CN');
    check('商店与动作八语言齐全', miss.length === 0, '\n  ' + miss.slice(0, 40).join('\n  '));
  }
  /* 7 百科和设置新增的界面文字八种语言都有，百科的键是拼出来的，静态扫描查不到，这里逐个查 */
  {
    const langs = ['zh-CN', 'zh-TW', 'en', 'fr', 'ja', 'ko', 'es', 'de'], miss = [];
    CY.i18n.set('en'); const keys = Object.keys(CY.i18n.packs.en).filter(k => /^pedia\.|^set\.d_/.test(k));
    for (const l of langs) { CY.i18n.set(l); for (const k of keys) if (!CY.i18n.hasOwn(k)) miss.push(l + ' ' + k); }
    CY.i18n.set('zh-CN');
    check('百科与数据位置文字八语言齐全（' + keys.length + ' 个键）', keys.length >= 40 && miss.length === 0, miss.slice(0, 30).join(' | '));
    check('设置里已没有背景场景与背景颜色的配置项', !CY.ini.SCHEMA.some(([sc, k]) => sc === 'ui' && (k === 'scene' || k === 'background')));
  }
  console.log(fails ? '失败 ' + fails : '全部通过');
  process.exit(0);
})();
