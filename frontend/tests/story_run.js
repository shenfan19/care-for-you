/* 故事场景校验：每个场景是一段能讲出来的家里的事，跑起来，记下游戏里真实写出的记录，再用断言核对。
   用法：node tests/story_run.js 场景编号，输出一行 JSON；汇总成文档用 node tests/story_report.js 输出路径。
   每个场景单独起一个进程，状态互不影响；随机数种子和假时钟固定，同一个场景每次结果一样。 */
const path = require('path');
const { execFileSync } = require('child_process');
const { ctx, CY, G } = require('./harness');
const Pol = require('../src/core/dispatch_policy.js');
const id = process.argv[2];
{ let a = 20261105; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let fake = Date.UTC(2026, 10, 5, 0, 0, 0);
const Real = Date; ctx.Date = class extends Real { static now() { return fake; } constructor(...a) { if (a.length) super(...a); else super(fake); } };

const out = { id, steps: [], log: [], checks: [], notes: [] };
const hhmm = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(m % 60)).padStart(2, '0');
const R = {
  P: n => G.people.find(p => p.person.name === n),
  step: s => out.steps.push(s),
  note: s => out.notes.push(s),
  check: (name, ok, detail) => out.checks.push({ name, ok: !!ok, detail: detail === undefined ? '' : String(detail) }),
  t: k => CY.t(k),
  has: (p, a) => a in G.actionsOf(p),
  lv: (p, k) => (1 - G.need(p, k)).toFixed(2),   /* 给人看的：水平，1 是满，0 是空；游戏里规则用的是压力 */
  mark: () => G._logSeq || 0,
  /* 把这段时间里新写的记录收进来，按写入先后，带游戏里的钟点 */
  collect(mark, types) {
    const all = [];
    for (const p of G.people) for (const mk of Object.values(G.journal[p.id] || {})) for (const e of mk) if ((e.seq || 0) > mark && (types || ['care', 'self', 'event', 'cry', 'frail', 'recovered']).includes(e.type)) all.push(e);
    all.sort((a, b) => a.seq - b.seq);
    for (const e of all) out.log.push(`${e.cm !== undefined ? hhmm(e.cm) : '--:--'} ${G.entryText(e)}`);
  },
  run(n) { for (let i = 0; i < n; i++) { fake += 5000; G.tick(); } },   /* 一步是现实 5 秒，游戏 5 分钟 */
  clock: () => hhmm(G.dayMinutes()),
  async boot(list, opt = {}) {
    CY.i18n.set('zh-CN');
    await G.load();
    G.cfg.interrupt.frequency = 'off';
    for (const [arch, name, conditions] of list) await G.createPerson({ arch, name, conditions });
    await G.load();
    G.world.intro_done = true; G.cfg.play.backend_provider = 'builtin'; G.cfg.play.condition_models = 'false';
    G.world.protagonist = null; CY.world.enforce = false;
    if (opt.feeding) G.world.feeding = opt.feeding;
    G.cfg.time.speed = '60'; G.cfg.time.daynight = 'game';
    G.setClock(opt.clock === undefined ? 480 : opt.clock); G._dayN = undefined; G.DAY.enabled = true;
    G.lastTick = fake; G.nextAt = fake + 4000;
    if (opt.ledger) G.setModule('ledger', true);
    R.run(1);
  },
};

const SC = {};

/* ---- 1 婴儿车 ---- */
SC.stroller = { title: '婴儿车：有了它，爷爷才能推宝宝去公园', claim: '没有婴儿车，只有爸爸妈妈这一辈能抱着婴儿出门；有了婴儿车，爷爷奶奶也能推着去。', async run() {
  await R.boot([['paternal_grandpa', '爷爷'], ['mom', '妈妈'], ['baby', '宝宝']]);
  const gp = R.P('爷爷'), mom = R.P('妈妈'), baby = R.P('宝宝');
  G.world.owned = {}; G.world.money = 1000;
  R.step('爷爷是主角，家里没有婴儿车'); G.setProtagonist(gp.id);
  R.check('爷爷想带宝宝去公园或街上，没有这两个动作', !R.has(baby, 'park') && !R.has(baby, 'street'));
  R.check('面板底部有一行原因：婴儿要婴儿车', G.outingHint(baby) === 'hint.need_stroller', R.t(G.outingHint(baby)));
  R.step('换妈妈当主角，还是没有婴儿车'); G.setProtagonist(mom.id);
  R.check('妈妈能抱着宝宝去公园和街上', R.has(baby, 'park') && R.has(baby, 'street'));
  R.step('买一辆婴儿车，换回爷爷当主角'); R.check('钱够，买了扣 400', G.buy('stroller') && G.world.money === 600); G.setProtagonist(gp.id);
  R.check('现在爷爷也能带宝宝去公园了', R.has(baby, 'park'));
  R.step('爷爷带宝宝去公园'); const m = R.mark(); G.perform(baby.id, 'park');
  R.check('宝宝出门了，坐着婴儿车', !!G.flag(baby, 'outing') && G.usingStroller(baby));
  R.check('家里的婴儿车跟着出门了', G.itemAway('stroller'));
  R.run(12);
  R.check('回来之后宝宝在家，婴儿车也回来了', !G.flag(baby, 'outing') && !G.itemAway('stroller'));
  R.collect(m);
} };

/* ---- 2 轮椅 ---- */
SC.wheelchair = { title: '轮椅：腿脚不便的老人有了轮椅才能出门', claim: '体弱或有关节炎的老人，没有轮椅出不了门；有了轮椅才能出去，出门的好处多两成半；卧床的老人也要轮椅。', async run() {
  await R.boot([['dad', '爸爸'], ['paternal_grandpa', '爷爷']]);
  const dad = R.P('爸爸'), gp = R.P('爷爷');
  G.world.owned = {}; G.world.money = 1000; G.setProtagonist(dad.id);
  gp.state.frailty = 0.6; gp.person.conditions = []; G.bedCheck(gp);
  R.step('爷爷虚弱度 0.6，算腿脚不便，家里没有轮椅');
  R.check('爷爷不能去公园，也不能去街上', !R.has(gp, 'park') && !R.has(gp, 'street'));
  R.check('面板有原因提示：要轮椅', G.outingHint(gp) === 'hint.need_wheelchair', R.t(G.outingHint(gp)));
  R.step('买轮椅'); R.check('钱够，买了扣 600', G.buy('wheelchair') && G.world.money === 400);
  R.check('爷爷能去公园和街上了，还多出"推轮椅出去走走"', R.has(gp, 'park') && R.has(gp, 'street') && R.has(gp, 'wheel'));
  const parkDef = G.actionsOf(gp).park;
  R.check('坐轮椅出门的好处乘 1.25', G.shopBoost(gp, parkDef).all === 1.25, G.shopBoost(gp, parkDef).all);
  R.step('爸爸带爷爷去公园'); const m = R.mark(); gp.state.needs.mobility = 0.2; G.perform(gp.id, 'park');
  R.check('爷爷出门了，用着轮椅', !!G.flag(gp, 'outing') && G.usingWheelchair(gp));
  R.run(12);
  R.check('回来之后轮椅也回来了', !G.flag(gp, 'outing') && !G.itemAway('wheelchair'));
  R.collect(m);
  R.step('爷爷更虚弱，躺倒了（虚弱度 0.9）'); gp.state.frailty = 0.9; G.bedCheck(gp);
  R.check('卧床后不能去公园，只剩"推轮椅出去走走"', G.bedridden(gp) && !R.has(gp, 'park') && R.has(gp, 'wheel'));
  R.step('没有轮椅的话'); G.world.owned = {};
  R.check('卧床的爷爷没有轮椅出不了门', !R.has(gp, 'wheel') && G.outingHint(gp) === 'hint.need_wheelchair');
  R.note('卧床老人用轮椅的完整行动设计还没做，目前只有"推轮椅出去走走"这一个动作。');
} };

/* ---- 3 半夜妈妈太累了叫不醒，奶奶来 ---- */
SC.night_mom_exhausted = { title: '半夜妈妈太累了叫不醒，奶奶先来', claim: '半夜宝宝哭，妈妈最先响应；妈妈累到极点听不见，就轮到奶奶判断响应。妈妈睡着以后精力慢慢恢复，才会醒。', async run() {
  await R.boot([['mom', '妈妈'], ['paternal_grandma', '奶奶'], ['baby', '宝宝']], { clock: 120 });
  const mom = R.P('妈妈'), gma = R.P('奶奶'), baby = R.P('宝宝');
  G.setNeed(mom, 'rest', 0.97); G.setNeed(gma, 'rest', 0.2);
  G.setFlag(baby, 'awake', { minutes: 600 }); G.setNeed(baby, 'hunger', 0.95); G.setNeed(baby, 'rest', 0.3);
  R.run(1);
  R.step(`凌晨 ${R.clock()}，妈妈累到极点（精力 ${R.lv(mom, 'rest')}），奶奶精力还好（${R.lv(gma, 'rest')}），宝宝饿了在哭`);
  R.check('妈妈睡着了，累到极点也睡得着', G.isSleeping(mom));
  R.check('奶奶睡着了', G.isSleeping(gma));
  R.check('宝宝在哭', !!G.crying[baby.id]);
  const m = R.mark(); let momAt = -1, gmaAt = -1; const lvMom = [];
  for (let i = 0; i < 36; i++) { R.run(1); if (momAt < 0 && !G.isSleeping(mom)) momAt = i + 1; if (gmaAt < 0 && !G.isSleeping(gma)) gmaAt = i + 1; if (i % 6 === 5) lvMom.push(`${R.clock()} 妈妈精力 ${R.lv(mom, 'rest')}`); }
  R.step('妈妈睡着时精力在恢复：' + lvMom.join('；'));
  R.check('奶奶先被叫醒，先来照顾宝宝', gmaAt > 0 && (momAt < 0 || gmaAt < momAt), `奶奶第 ${gmaAt} 步，妈妈第 ${momAt} 步`);
  R.check('妈妈在奶奶之后才醒，是精力恢复了一些', momAt < 0 || momAt > gmaAt, momAt > 0 ? `妈妈第 ${momAt} 步，约 ${momAt * 5} 分钟后` : '三小时都没醒');
  R.check('奶奶照顾了宝宝', Object.values(G.journal[baby.id] || {}).flat().some(e => e.k === 'log.assist' && e.seq > m && e.a.who === '奶奶'));
  R.check('宝宝不再哭了', !G.crying[baby.id], '饱足 ' + R.lv(baby, 'hunger'));
  R.collect(m);
  R.note('听见的几率是假设：妈妈 0.7，爷爷奶奶 0.35，哭声信号强度 1，疲劳过线后线性降低，到 0.95 听不见。');
  R.note('调试发现并改过：原来听不见的零点和"不再优先派她"共用同一个 0.95，太靠近满格，累到极点的妈妈只有几分钟叫不醒。现在单独设了 deaf_at，默认 0.85，睡着时疲倦每小时恢复 0.12，所以累到 0.97 的人约一小时内叫不醒。这个数是假设，请你审；如果要累垮的人睡得更沉更久，需要再加一个深睡的变量。');
} };

/* ---- 4 谁都太累了，没人听见 ---- */
SC.night_nobody_hears = { title: '半夜妈妈和奶奶都累垮了，一开始谁也没听见', claim: '两个人都累到听不见时，一开始没有人被叫醒，宝宝先哭一阵；游戏里没有失败，累得最轻的人精力恢复一点就会醒来照顾。', async run() {
  await R.boot([['mom', '妈妈'], ['paternal_grandma', '奶奶'], ['baby', '宝宝']], { clock: 120 });
  const mom = R.P('妈妈'), gma = R.P('奶奶'), baby = R.P('宝宝');
  G.setNeed(mom, 'rest', 0.98); G.setNeed(gma, 'rest', 0.9);
  G.setFlag(baby, 'awake', { minutes: 1200 }); G.setNeed(baby, 'hunger', 0.95);
  R.run(1);
  R.step(`凌晨 ${R.clock()}，妈妈精力 ${R.lv(mom, 'rest')}，奶奶 ${R.lv(gma, 'rest')}（老人累得更厉害，按 1.3 倍算），宝宝在哭`);
  const m = R.mark(); let firstAt = -1, crySteps = 0;
  for (let i = 0; i < 36; i++) { R.run(1); if (firstAt < 0 && (!G.isSleeping(mom) || !G.isSleeping(gma))) firstAt = i + 1; if (G.crying[baby.id]) crySteps++; }
  R.step(`三个小时过去，到 ${R.clock()}`);
  R.check('一开始没有人被叫醒，看护调度记下了"睡着没听见"', (G.dispatch.stat.unheard || 0) > 0 && firstAt > 1, `第一个醒来是第 ${firstAt} 步，没听见 ${G.dispatch.stat.unheard || 0} 步`);
  R.check('宝宝哭了一阵', crySteps >= 3, `哭了 ${crySteps} / 36 步`);
  R.check('后来有人醒来照顾了宝宝', Object.values(G.journal[baby.id] || {}).flat().some(e => e.k === 'log.assist' && e.seq > m), '宝宝饱足 ' + R.lv(baby, 'hunger'));
  R.collect(m);
  R.note(`第一次有人醒来在 ${firstAt * 5} 分钟后，累垮的人叫不醒的时间由 deaf_at 和睡着时精力的恢复速度决定，见上一个场景的说明。`);
} };

/* ---- 5 妈妈状态好，先起来 ---- */
SC.night_mom_first = { title: '半夜妈妈精力还好，她先起来', claim: '妈妈精力好时，最先响应宝宝的哭；奶奶睡着不被叫醒。', async run() {
  await R.boot([['mom', '妈妈'], ['paternal_grandma', '奶奶'], ['baby', '宝宝']], { clock: 120 });
  const mom = R.P('妈妈'), gma = R.P('奶奶'), baby = R.P('宝宝');
  G.setNeed(mom, 'rest', 0.3); G.setNeed(gma, 'rest', 0.2);
  G.setFlag(baby, 'awake', { minutes: 600 }); G.setNeed(baby, 'hunger', 0.95);
  R.run(1); const m = R.mark();
  R.step(`凌晨 ${R.clock()}，妈妈精力 ${R.lv(mom, 'rest')}，奶奶 ${R.lv(gma, 'rest')}，宝宝在哭`);
  let momAt = -1, gmaAt = -1;
  for (let i = 0; i < 24; i++) { R.run(1); if (momAt < 0 && !G.isSleeping(mom)) momAt = i + 1; if (gmaAt < 0 && !G.isSleeping(gma)) gmaAt = i + 1; }
  R.check('妈妈被叫醒了', momAt > 0, momAt > 0 ? `第 ${momAt} 步` : '没醒');
  R.check('妈妈比奶奶先醒，或奶奶始终没醒', momAt > 0 && (gmaAt < 0 || momAt <= gmaAt), `妈妈 ${momAt}，奶奶 ${gmaAt}`);
  R.collect(m);
  R.note('这是一个种子下的一次结果；听见是掷骰子，妈妈 0.7 对奶奶 0.35，两个人都听见时妈妈优先。');
} };

/* ---- 6 夜尿多 ---- */
SC.nocturia = { title: '夜尿多的爷爷半夜想上厕所，爸爸起来扶他', claim: '夜尿多的老人夜里想上厕所，声音不大，叫醒听见的人去扶，只派厕所这一件事。', async run() {
  await R.boot([['dad', '爸爸'], ['paternal_grandpa', '爷爷', ['nocturia']]], { clock: 180 });
  const dad = R.P('爸爸'), gp = R.P('爷爷');
  G.setNeed(dad, 'rest', 0.3); G.setNeed(gp, 'toilet', 0.7);
  R.run(1); R.step(`凌晨 ${R.clock()}，爷爷想上厕所（${R.lv(gp, 'toilet')}），爸爸睡着`);
  const m = R.mark(); let dadAt = -1;
  for (let i = 0; i < 24; i++) { R.run(1); if (dadAt < 0 && !G.isSleeping(dad)) dadAt = i + 1; }
  R.check('爸爸被叫醒了', dadAt > 0, dadAt > 0 ? `第 ${dadAt} 步` : '没醒');
  R.check('爷爷被扶去了厕所', (G.dispatch.stat.byAct || {}).lead > 0 || Object.values(G.journal[gp.id] || {}).flat().some(e => e.k === 'log.assist' && e.seq > m));
  R.check('爷爷的厕所需求缓解了', G.need(gp, 'toilet') < 0.5, '现在 ' + R.lv(gp, 'toilet'));
  R.collect(m);
  R.note('夜尿多的叫人信号强度 0.5，爸爸听见几率 0.4，所以一次听见约需要几步，是假设。');
} };

/* ---- 7 母乳夜奶 ---- */
SC.breast_night = { title: '母乳喂养：夜里只有妈妈能喂奶', claim: '母乳时宝宝夜里饿了，只有妈妈能喂，睡着也叫醒；奶奶不能替。', async run() {
  await R.boot([['mom', '妈妈'], ['paternal_grandma', '奶奶'], ['baby', '宝宝']], { clock: 120, feeding: 'breast' });
  const mom = R.P('妈妈'), gma = R.P('奶奶'), baby = R.P('宝宝');
  G.setNeed(mom, 'rest', 0.3); G.setNeed(gma, 'rest', 0.1);
  G.setFlag(baby, 'awake', { minutes: 600 }); G.setNeed(baby, 'hunger', 0.95); G.setNeed(baby, 'rest', 0.2);
  R.run(1); R.step(`凌晨 ${R.clock()}，母乳喂养，宝宝饿了在哭`); const m = R.mark();
  R.run(24);
  const fed = Object.values(G.journal[baby.id] || {}).flat().filter(e => e.k === 'log.assist' && e.seq > m && /喂/.test(G.entryText(e)));
  R.check('夜里喂奶的人只有妈妈', fed.length > 0 && fed.every(e => e.a.who === '妈妈'), fed.map(e => e.a.who).join('、'));
  R.check('宝宝吃上了，不再哭', !G.crying[baby.id], '饱足 ' + R.lv(baby, 'hunger'));
  R.collect(m);
  R.note('妈妈听见的几率 0.7，所以哭几步后才被叫醒；奶奶即使醒着也不能替喂。');
} };

/* ---- 8 不困的人请不去睡 ---- */
SC.invite_rest = { title: '爸爸不困，请他睡一会儿被拒绝；困了就能睡', claim: '对方这件事上还不需要就不做，说明原因；需要时才去睡，台词不是通用的"不用管我"。', async run() {
  await R.boot([['mom', '妈妈'], ['dad', '爸爸']], { clock: 840 });
  const mom = R.P('妈妈'), dad = R.P('爸爸'); G.setProtagonist(mom.id);
  G.setNeed(dad, 'rest', 0.05); R.step('妈妈当主角，爸爸精力很好（' + R.lv(dad, 'rest') + '），请他睡一会儿');
  const r1 = G.perform(dad.id, 'invite_rest');
  R.check('被拒绝，没有去睡', r1 === false && !G.isSleeping(dad));
  R.check('原因的文字：不困，不想睡', /不困/.test(CY.t('refuse.not_tired', { name: '爸爸' })), CY.t('refuse.not_tired', { name: '爸爸' }));
  G.setNeed(dad, 'rest', 0.7); R.step('爸爸累了（' + R.lv(dad, 'rest') + '），再请他睡一会儿');
  const r2 = G.perform(dad.id, 'invite_rest');
  R.check('这次去睡了', r2 === true && G.isSleeping(dad));
  const pool = G.lines(dad, 'thanks', 'rest');
  R.check('回话从"休息"的台词里挑，不是兜底的"不用管我"', pool.length > 0 && pool.every(x => !/不用管我/.test(x)), pool.join(' / '));
} };

/* ---- 9 做饭的记录顺序 ---- */
SC.cooking = { title: '自己做饭：先写"自己做了顿饭"，再写"一顿饭做好了"', claim: '同一件事的两条记录，原因在前，结果在后。', async run() {
  await R.boot([['paternal_grandma', '奶奶'], ['mom', '妈妈']], { clock: 660 });
  const gma = R.P('奶奶'); G.setNeed(gma, 'hunger', 0.8);
  const act = Object.values(G.allActionsOf(gma)).find(a => a.id === 'cook'); const m = R.mark();
  R.step('奶奶饿了，自己做一顿饭'); G.selfAct(gma, act, 'hunger', false);
  const es = Object.values(G.journal[gma.id]).flat().filter(e => e.seq > m).sort((a, b) => a.seq - b.seq);
  R.check('先记做了什么，再记结果', es.length >= 2 && es[0].type === 'self' && es[1].k === 'log.meal_all', es.map(e => e.k || e.type).join(' → '));
  R.collect(m);
} };

/* ---- 10 商店关掉 ---- */
SC.shop_off = { title: '商店模块关掉：婴儿车的要求不再卡人', claim: '总配置里把商店关掉，解锁要求当作满足，用品不再有加成，买不了东西。', async run() {
  await R.boot([['paternal_grandpa', '爷爷'], ['baby', '宝宝']]);
  const gp = R.P('爷爷'), baby = R.P('宝宝'); G.world.owned = { toy: true }; G.world.money = 1000; G.setProtagonist(gp.id);
  R.check('商店开着、没有婴儿车：爷爷不能带宝宝去公园', !R.has(baby, 'park'));
  R.check('商店开着、有玩具：玩耍加成 1.4', G.shopBoost(baby, { effect: { play: 0.5 } }).scale.play === 1.4);
  G.setModule('shop', false); R.step('总配置里把商店关掉');
  R.check('爷爷能带宝宝去公园了（婴儿车的要求不再卡人）', R.has(baby, 'park'));
  R.check('玩具没有加成了', !G.shopBoost(baby, { effect: { play: 0.5 } }).scale.play);
  R.check('买不了东西', !G.canBuy('toy') && !G.canBuyBed() && G.buyGift('tea') === false);
  G.setModule('shop', true);
} };

/* ---- 11 加成：玩具，果盘，书架 ---- */
SC.boosts = { title: '玩具，果盘，书架：只加当次的效果，不改需求涨落', claim: '玩具让婴幼儿玩得更满足，果盘让吃得更饱，书架让休闲时心情多一点；买了东西，需求涨落的速度一点不变。', async run() {
  await R.boot([['mom', '妈妈'], ['baby', '宝宝']]);
  const mom = R.P('妈妈'), baby = R.P('宝宝'); G.setProtagonist(mom.id);
  const delta = (p, need, act) => { G.setNeed(p, need, 0.9); const b = G.need(p, need); G._h.applyEffects(p, G.actionsOf(p)[act], 0.4); return +(b - G.need(p, need)).toFixed(3); };   /* 作用量缩到 0.4，不然一次就满格，看不出多少 */
  G.world.owned = {};
  const d0 = delta(baby, 'play', 'play'), f0 = delta(baby, 'hunger', 'feed');
  G.world.owned = { toy: true, fruit: true };
  const d1 = delta(baby, 'play', 'play'), f1 = delta(baby, 'hunger', 'feed');
  R.step(`没有玩具，玩耍缓解 ${d0}；有玩具 ${d1}`); R.check('玩具：玩耍多四成', Math.abs(d1 / d0 - 1.4) < 0.02, (d1 / d0).toFixed(3));
  R.step(`没有果盘，喂一次缓解饥饿 ${f0}；有果盘 ${f1}`); R.check('果盘：吃得更饱多四成', Math.abs(f1 / f0 - 1.4) < 0.02, (f1 / f0).toFixed(3));
  G.world.owned = { toy: true, fruit: true, books: true, wheelchair: true, stroller: true };
  R.check('买了这些东西，需求涨落的速度一点没变', Object.keys(G.shopFx(baby).rate).length === 0 && G.shopFx(baby).rest_sleep === 1);
} };

/* ---- 12 疾病并入调度 ---- */
SC.forgetful = { title: '记性变差的爷爷醒着时有人盯着', claim: '记性变差的老人进盯人通道，有人耐心再说一遍。', async run() {
  await R.boot([['mom', '妈妈'], ['dad', '爸爸'], ['paternal_grandpa', '爷爷', ['forgetful']]], { clock: 600 });
  const gp = R.P('爷爷'); G.setNeed(gp, 'reorient', 0.7); const m = R.mark();
  R.step(`上午 ${R.clock()}，爷爷又问了一遍（需求 ${R.lv(gp, 'reorient')}）`); R.run(36);
  R.check('三个小时里有人盯着爷爷', (G.dispatch.stat.watchMin || 0) > 0, (G.dispatch.stat.watchMin || 0) + ' 分钟');
  R.check('有人"耐心再说一遍"', (G.dispatch.stat.byAct || {}).remind > 0, JSON.stringify(G.dispatch.stat.byAct));
  R.collect(m, ['care', 'event']);
} };

SC.parkinson = { title: '帕金森的爷爷不会自己一个人出门', claim: '要人陪的老人，不会自己出去；健康的老人会。', async run() {
  await R.boot([['paternal_grandpa', '爷爷', ['parkinson']], ['paternal_grandma', '奶奶'], ['mom', '妈妈']], { clock: 540 });
  const gp = R.P('爷爷'), gma = R.P('奶奶'); const m = R.mark();
  R.check('爷爷被标为要人陪', G.needsEscort(gp));
  let gpOut = 0, gpSolo = 0, gmaOut = 0, gmaSolo = 0;
  const adultsOut = (me) => G.people.some(q => q !== me && G.isHuman(q) && ['adult', 'elder'].includes(G.stage(q)) && !!G.flag(q, 'outing'));
  for (let i = 0; i < 576; i++) { R.run(1); for (const [p, k] of [[gp, 'gp'], [gma, 'gma']]) if (G.flag(p, 'outing')) { if (k === 'gp') { gpOut++; if (!adultsOut(p)) gpSolo++; } else { gmaOut++; if (!adultsOut(p)) gmaSolo++; } } }
  R.step('过了两个游戏日，每五分钟看一次谁在外面，外面有没有别的成人陪着');
  R.check('爷爷出门的时候身边总有别人陪着', gpSolo === 0, `爷爷在外面 ${gpOut} 步，其中没人陪 ${gpSolo} 步`);
  R.note(`奶奶在外面 ${gmaOut} 步，其中没人陪 ${gmaSolo} 步（健康的老人可以自己出门，是否出去看几率）。`);
  R.collect(m, ['event']);
} };

/* ---- 13 孤立带孩子的耗竭，三天对照 ---- */
SC.isolation = { title: '一个人带孩子和有人分担：三天对照', claim: '妈妈一个人带宝宝，睡得少，累得多；加上奶奶，加上爷爷，情况好转。孤立的家庭耗竭是条件依赖的后果，不是必然。', async run() {
  const sim = k => JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'care_sim.js'), '3', k, '1'], { env: Object.assign({}, process.env, { CARE_SIM_JSON: '1' }), encoding: 'utf8' }).split('\n').filter(l => l.startsWith('JSON ')).pop().slice(5));
  const rows = [['duo', '妈妈和宝宝'], ['duo_gma', '加奶奶'], ['duo_gma_gpa', '加奶奶和爷爷'], ['trio', '爸爸妈妈和宝宝'], ['single3', '单亲带三个孩子'], ['single3_gma', '单亲带三个孩子加奶奶']];
  const res = {}; for (const [k, n] of rows) { res[k] = sim(k); const m = res[k].people['妈妈']; out.steps.push(`${n}：妈妈每天睡 ${m.sleep_h_per_day.toFixed(1)} 小时，需求压到八成以上 ${m.urgent_h_per_day.toFixed(1)} 小时，虚弱度变化 ${m.frailty_delta >= 0 ? '+' : ''}${m.frailty_delta.toFixed(2)}；宝宝需求压到八成以上 ${res[k].baby.urgent_h.toFixed(1)} 小时`); }
  const mom = k => res[k].people['妈妈'];
  R.check('有人分担，妈妈睡得多得多', mom('duo_gma').sleep_h_per_day > mom('duo').sleep_h_per_day + 2);
  R.check('一个人带，妈妈的虚弱度三天明显上升', mom('duo').frailty_delta > 0.2);
  R.check('单亲带三个孩子，宝宝需求严重的时间长；加一位祖辈后大幅减少', res.single3.baby.urgent_h > 10 && res.single3_gma.baby.urgent_h < 3);
  R.note('三天，无玩家，一个种子；完整表见技术子文档 S12。');
} };

/* ---- 14 贡献统计 ---- */
SC.ledger = { title: '贡献统计：谁照顾了谁，次数和记录一一对上', claim: '统计的次数等于发生的事里的记录条数，夜奶，做饭，盯孩子都记在出手的人名下。', async run() {
  await R.boot([['mom', '妈妈'], ['paternal_grandma', '奶奶'], ['baby', '宝宝']], { ledger: true });
  const m = R.mark(), jr = () => Object.values(G.journal).flatMap(j => Object.values(j).flat());
  const a0 = jr().filter(e => e.k === 'log.assist').length; R.run(288); R.step('跑了一个游戏日');
  const sum = G.ledger.sum(), a1 = jr().filter(e => e.k === 'log.assist').length - a0, mx = G.ledger.matrix(sum);
  R.check('家人照顾的次数等于记录条数', G.ledger.total(sum, 'family') === a1, G.ledger.total(sum, 'family') + ' 对 ' + a1);
  for (const a of mx.actors) out.steps.push(`${a === 'you' ? '你' : G.ledger.nameOf(sum, a)} 照顾了别人 ${mx.give[a]} 次`);
  out.steps.push('盯着孩子的分钟数：' + Object.entries(sum.watch).map(([k, v]) => G.ledger.nameOf(sum, k.split('>')[0]) + ' ' + v).join('，'));
  out.steps.push('被叫醒次数：' + (Object.entries(sum.wakes).map(([k, v]) => G.ledger.nameOf(sum, k) + ' ' + v).join('，') || '没有'));
  R.collect(m, ['care']);
  out.log = out.log.slice(0, 14);
} };

/* ---- 听见的几率表（纯计算，给审核参数用） ---- */
SC.hear_table = { title: '听见的几率表：谁在什么疲劳下听不听得见', claim: '睡着压制大部分需求响应，哭声不好压，没声音的需求几乎听不见；妈妈最先，爷爷奶奶次之。', async run() {
  await R.boot([['mom', '妈妈']]);
  const C = G.S('dispatch'), M = Pol.model;
  const row = (role, f, sig, stage) => M.hearProb(C, { role, fatigue: f, stage: stage || 'adult' }, sig);
  const lines = [['妈妈，精力好', 'mom', 0.3, 'adult'], ['妈妈，累过线', 'mom', 0.84, 'adult'], ['妈妈，累到极点', 'mom', 0.97, 'adult'], ['爸爸，精力好', 'dad', 0.3, 'adult'], ['奶奶，精力好', 'paternal_grandma', 0.2, 'elder'], ['奶奶，累', 'paternal_grandma', 0.6, 'elder']];
  for (const [n, r, f, st] of lines) out.steps.push(`${n}：哭声 ${row(r, f, 1, st).toFixed(2)}，没哭只是需求高 ${row(r, f, C.hear_quiet, st).toFixed(2)}，夜里要人帮 ${row(r, f, C.hear_help, st).toFixed(2)}`);
  R.check('妈妈精力好听见哭声的几率 0.70', Math.abs(row('mom', 0.3, 1) - 0.7) < 1e-9);
  R.check('妈妈累到极点听不见', row('mom', 0.97, 1) === 0);
  R.check('奶奶的几率低于妈妈', row('paternal_grandma', 0.2, 1, 'elder') < row('mom', 0.3, 1));
  R.note('这些数是假设，没有数据来源；改它们在 templates/system.yaml 的 dispatch.hear 一带。');
} };


/* ---- 外出时孩子的去留 ---- */
SC.outing_baby = { title: '带老人出门，宝宝是留下还是一起走', claim: '家里还有别的大人在，宝宝留下；没人看护了，宝宝跟着一起出门；带不走又没人看护，就出不了门。', async run() {
  await R.boot([['mom', '妈妈'], ['dad', '爸爸'], ['paternal_grandma', '奶奶'], ['paternal_grandpa', '爷爷'], ['baby', '宝宝']]);
  const mom = R.P('妈妈'), dad = R.P('爸爸'), gma = R.P('奶奶'), gpa = R.P('爷爷'), baby = R.P('宝宝');
  G.world.owned = {}; G.setProtagonist(mom.id);
  R.step('妈妈是主角，爸爸在家，妈妈带奶奶去公园'); const m = R.mark(); G.perform(gma.id, 'park');
  R.check('奶奶出门了', !!G.flag(gma, 'outing'));
  R.check('宝宝留在家里，有爸爸看着', !G.flag(baby, 'outing') && !G.flag(dad, 'outing'));
  R.run(12);
  R.step('爸爸和奶奶都不在家了（爸爸住院，奶奶还没回来的话也算），家里没有别的大人；妈妈带爷爷去公园'); G.setFlag(dad, 'hospital', { minutes: 600 }); G.setFlag(gma, 'hospital', { minutes: 600 });
  G.perform(gpa.id, 'park');
  R.check('爷爷出门了', !!G.flag(gpa, 'outing'));
  R.check('宝宝跟着一起出门（妈妈抱着，没有婴儿车也行）', !!G.flag(baby, 'outing'));
  R.run(12);
  R.step('妈妈也住院了，奶奶当主角，想带爷爷去公园，没有婴儿车'); G.setFlag(mom, 'hospital', { minutes: 600 }); G.setProtagonist(gma.id);
  R.check('出不了门：宝宝带不走（老人抱不稳），又不能单独留下', !R.has(gpa, 'park'));
  R.check('面板上写了原因：家里有带不走又不能单独留下的人', G.outingHint(gpa) === 'hint.cant_leave', R.t(G.outingHint(gpa)));
  R.collect(m, ['event', 'care']);
} };

/* ---- 睡着压制普通需求 ---- */
SC.sleep_suppress = { title: '半夜妈妈自己有点饿，不会为这个醒来', claim: '睡着压制大部分的需求响应：普通的需求不会叫醒人，孩子安静不哭时也不叫醒人。', async run() {
  await R.boot([['mom', '妈妈'], ['baby', '宝宝']], { clock: 120 });
  const mom = R.P('妈妈'), baby = R.P('宝宝');
  G.setNeed(mom, 'rest', 0.3); G.setNeed(mom, 'hunger', 0.6);
  G.setFlag(baby, 'awake', { minutes: 600 }); for (const k of Object.keys(baby.state.needs)) G.setNeed(baby, k, 0.03);
  R.run(1); const m = R.mark();
  R.step(`凌晨 ${R.clock()}，妈妈睡着，自己有点饿（饱足 ${R.lv(mom, 'hunger')}），宝宝醒着但什么也不缺，安安静静`);
  let awake = 0; for (let i = 0; i < 18; i++) { R.run(1); if (!G.isSleeping(mom)) awake++; }
  R.check('一个半小时里妈妈一直睡着', awake === 0, '醒着的步数 ' + awake);
  R.check('没有任何人被叫醒', !(G.dispatch.stat.wakes > 0), 'wakes ' + (G.dispatch.stat.wakes || 0));
  R.collect(m);
} };

SC.ids = Object.keys(SC);
(async () => {
  if (id === 'list') { console.log(JSON.stringify(SC.ids.map(k => ({ id: k, title: SC[k].title, claim: SC[k].claim })))); process.exit(0); }
  const s = SC[id]; if (!s) { console.error('没有这个场景 ' + id); process.exit(2); }
  out.title = s.title; out.claim = s.claim;
  try { await s.run(); } catch (e) { out.error = String(e && e.stack || e).slice(0, 600); }
  console.log('STORY ' + JSON.stringify(out));
  process.exit(0);
})();
