/* 可选模块的测试：总开关，贡献统计的完整性，以及记录里"谁照顾了谁"没有写反。
   统计要较真，所以核对的是：统计里的次数和发生的事里的记录条数一一对应，盯人，叫醒，做饭的数和看护调度自己的计数一致。
   单独运行：node tests/ledger_test.js */
const { ctx, CY, G } = require('./harness');
let fails = 0;
const check = (n, c, x) => { if (!c) fails++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };
{ let a = 11; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
(async () => {
  let fake = Date.UTC(2026, 9, 28, 0, 0, 0);
  const Real = Date; ctx.Date = class extends Real { static now() { return fake; } constructor(...a) { if (a.length) super(...a); else super(fake); } };
  CY.i18n.set('zh-CN');
  await G.load();
  G.cfg.interrupt.frequency = 'off';
  for (const [arch, name] of [['mom', '妈妈'], ['paternal_grandma', '奶奶'], ['paternal_grandpa', '爷爷'], ['baby', '宝宝'], ['toddler_2', '二岁']]) await G.createPerson({ arch, name });
  await G.load();
  G.world.intro_done = true; G.cfg.play.backend_provider = 'builtin'; G.cfg.play.condition_models = 'false';
  G.world.protagonist = null; CY.world.enforce = false;
  G.cfg.time.speed = '60'; G.cfg.time.daynight = 'game'; G.setClock(480); G._dayN = undefined; G.DAY.enabled = true;
  G.lastTick = fake; G.nextAt = fake + 4000;
  const run = steps => { for (let i = 0; i < steps; i++) { fake += 5000; G.tick(); } };
  const P = n => G.people.find(p => p.person.name === n);

  /* 总开关：默认值，运行时改 */
  check('默认：调度开，商店开，统计关', G.module('dispatch') && G.module('shop') && !G.module('ledger'));
  G.setModule('ledger', true); check('运行时能开统计', G.module('ledger')); G.setModule('ledger', false);

  /* 统计关着，什么也不记 */
  run(60);
  check('统计关着不记任何东西，也不占存档', !G.world.ledger || G.ledger.days().length === 0);

  /* 打开，跑一整天 */
  const jr = () => Object.values(G.journal).flatMap(j => Object.values(j).flat());
  const assist0 = jr().filter(e => e.k === 'log.assist').length, self0 = jr().filter(e => e.type === 'self').length;   /* 统计开启之前已经发生的，不该算 */
  G.setModule('ledger', true);
  const d0 = Object.assign({}, G.dispatch.stat);
  run(288);
  const sum = G.ledger.sum(), journal = jr();
  const assists = journal.filter(e => e.k === 'log.assist').length - assist0;
  check('一天里有家人互相照顾的记录', assists > 5, 'log.assist ' + assists);
  check('完整：统计里家人照顾的次数，等于发生的事里 log.assist 的条数', G.ledger.total(sum, 'family') === assists, G.ledger.total(sum, 'family') + ' vs ' + assists);
  const selfLogs = journal.filter(e => e.type === 'self').length - self0;
  check('完整：自己照顾自己的次数，等于发生的事里 self 的条数', G.ledger.total(sum, 'self') === selfLogs, G.ledger.total(sum, 'self') + ' vs ' + selfLogs);
  const sumVals = o => Object.values(o).reduce((a, b) => a + b, 0), st = G.dispatch.stat;
  check('盯人的分钟数，叫醒，做饭，和看护调度自己的计数一致', sumVals(sum.watch) === (st.watchMin || 0) - (d0.watchMin || 0) && sumVals(sum.wakes) === (st.wakes || 0) - (d0.wakes || 0) && sumVals(sum.cooks) === (st.meals || 0) - (d0.meals || 0), JSON.stringify([sumVals(sum.watch), sumVals(sum.wakes), sumVals(sum.cooks)]));
  const m = G.ledger.matrix(sum), give = sumVals(m.give), got = sumVals(m.got);
  check('二维表：出手的总数等于被照顾的总数等于总次数', give === got && got === G.ledger.total(sum), give + ' ' + got + ' ' + G.ledger.total(sum));
  check('每个出手的人和被照顾的人都有名字', m.actors.concat(m.targets).every(id => id === 'you' || !!G.ledger.nameOf(sum, id)));
  const babyNeglect = sum.neglect[P('宝宝').id];
  check('"没被顾上的时间"能统计，并且一天里宝宝没有长时间压到八成以上', !babyNeglect || sumVals(babyNeglect) < 120, JSON.stringify(babyNeglect || {}));

  /* 玩家做的：设主角，做三个动作，统计里 player 的次数等于 log.care 的条数 */
  G.setProtagonist(P('妈妈').id);
  const careBefore = Object.values(G.journal).flatMap(j => Object.values(j).flat()).filter(e => e.k === 'log.care' && e.type === 'care').length, pBefore = G.ledger.total(G.ledger.sum(), 'player');
  const baby = P('宝宝');
  for (const a of ['feed', 'diaper', 'hug']) { G.setNeed(baby, a === 'feed' ? 'hunger' : a === 'diaper' ? 'diaper' : 'company', 0.9); if (baby.species.actions[a] || G.actionsOf(baby)[a]) G.perform(baby.id, a); }
  const careAfter = Object.values(G.journal).flatMap(j => Object.values(j).flat()).filter(e => e.k === 'log.care' && e.type === 'care').length, pAfter = G.ledger.total(G.ledger.sum(), 'player');
  check('完整：玩家做的动作，统计的次数等于发生的事里 log.care 的条数', pAfter - pBefore === careAfter - careBefore && careAfter - careBefore >= 2, (pAfter - pBefore) + ' vs ' + (careAfter - careBefore));
  check('玩家做的记在玩家扮演的角色名下', Object.keys(G.ledger.sum().acts).some(k => k.startsWith(P('妈妈').id + '>')));
  G.world.protagonist = null;

  /* 记录里的"谁照顾了谁"没有写反：被照顾的人的记录里，who 是出手的人，name 是自己 */
  let wrong = 0, seen = 0;
  for (const p of G.people) for (const mk of Object.values(G.journal[p.id] || {})) for (const e of mk) if (e.k === 'log.assist') { seen++; if (e.a.name !== p.person.name || e.a.who === p.person.name) wrong++; }
  check('log.assist 里 who 是出手的人，name 是被照顾的人，没有写反（宝宝替我照顾了爷爷这类）', seen > 0 && wrong === 0, seen + ' 条，错 ' + wrong);
  const ex = journal.find(e => e.k === 'log.assist');
  check('记录的文字：出手的人替你照顾了被照顾的人', ex && /^.+替你照顾了.+：/.test(G.entryText(ex)) && G.entryText(ex).startsWith(ex.a.who + '替你照顾了' + ex.a.name), ex && G.entryText(ex));

  /* 访客不进统计 */
  G.bus.emit('care', { kind: 'family', actor: P('妈妈').id, target: 'no-such-id', action: 'meal' });
  check('不存在的人不进统计', !Object.keys(G.ledger.sum().acts).some(k => k.endsWith('>no-such-id')));

  /* 调度关掉：没有任何分配 */
  G.setModule('dispatch', false);
  const t0 = JSON.stringify(G.dispatch.stat); run(60);
  check('调度模块关掉后，看护调度什么也不做', JSON.stringify(G.dispatch.stat) === t0);
  G.setModule('dispatch', true);

  /* 商店关掉：解锁要求不卡人，加成和礼物不生效，买不了 */
  G.world.owned = {}; G.world.money = 5000;
  const lead = P('爷爷'); G.setProtagonist(lead.id);
  check('商店开着，没有婴儿车，爷爷抱不动婴儿，没有去公园', !G.actionsOf(baby).park && !G.canBuy('toy') === false);
  G.setModule('shop', false);
  check('商店关掉：婴儿车的要求当作满足，爷爷能带婴儿去公园', !!G.actionsOf(baby).park);
  check('商店关掉：买不了东西，也买不了床和礼物', !G.canBuy('toy') && !G.canBuyBed() && G.buyGift('tea') === false);
  G.world.owned = { toy: true, fruit: true, books: true, stroller: true, wheelchair: true };
  check('商店关掉：已有的用品没有加成', Object.keys(G.shopBoost(baby, { effect: { play: 0.5 } }).scale).length === 0 && G.shopBoost(baby, { effect: { play: 0.5 } }).mood === 0 && !G.usingStroller(baby) && G.decorLevel() === 0);
  G.setModule('shop', true);
  check('商店再打开，用品又有加成', G.shopBoost(baby, { effect: { play: 0.5 } }).scale.play === 1.4);
  G.world.owned = {}; G.world.protagonist = null;

  console.log(fails ? '失败 ' + fails : '全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
