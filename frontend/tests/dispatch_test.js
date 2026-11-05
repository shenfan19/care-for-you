/* 看护调度层的不变量测试：决策是纯函数，用合成快照测规则；再跑 care_sim 做整户仿真对照。
   单独运行：node tests/dispatch_test.js。I1 到 I9 是调度层的不变量编号。 */
const { execFileSync } = require('child_process');
const path = require('path');
/* 策略部分不依赖游戏：直接 require 策略模块，不载入游戏，证明它能单独用。整户仿真部分另起进程跑 care_sim.js。 */
const Pol = require('../src/core/dispatch_policy.js');
let fails = 0;
const check = (n, c, x) => { if (!c) fails++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };
const jsyaml = require('../vendor/js-yaml.min.js'), fs = require('fs');
const C = Pol.config(jsyaml.load(fs.readFileSync(path.join(__dirname, '..', 'config', 'templates', 'system.yaml'), 'utf8')).dispatch);   /* 参数的唯一来源是 YAML，策略模块没有默认值 */
const D = { plan: Pol.plan, validate: (raw, S, c) => Pol.validate(raw, S, c).plan, snapshot: true, apply: true, policy: null };
const person = (id, stage, o = {}) => Object.assign({ id, stage, role: '', roll: 0, watch: ['infant', 'toddler'].includes(stage), cries: ['infant', 'toddler', 'child'].includes(stage), cry_at: 0.8, night_help: false, dep: ['infant', 'toddler', 'child'].includes(stage), lead: false, asleep: false, bedridden: false, away: false, room: 'living', fatigue: 0.2, needs: { rest: 0.2 }, urgency: 0.3, hands: false }, o);
const snap = (people, duty) => ({ t: 0, night: false, duty: duty || {}, people });
const baby = o => person('baby', 'infant', Object.assign({ urgency: 1.5, needs: { rest: 0.3, hunger: 0.6 } }, o));
const sim = (kind, days, seed) => JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'care_sim.js'), String(days), kind, String(seed)], { env: Object.assign({}, process.env, { CARE_SIM_JSON: '1' }), encoding: 'utf8' }).split('\n').filter(l => l.startsWith('JSON ')).pop().slice(5));

(async () => {
  /* I1 醒着的婴儿有且只有一个看护人，且是疲劳最低的那位 */
  let p = D.plan(snap([person('mom', 'adult', { fatigue: 0.3 }), person('dad', 'adult', { fatigue: 0.1 }), baby()]), C);
  check('I1 婴儿有人看护', p.watch.baby === 'dad' && p.unmet.length === 0, JSON.stringify(p.watch));
  /* I1 没有大人时记为无人看护 */
  p = D.plan(snap([baby(), person('kid', 'teen')]), C);
  check('I1 没有大人时记入 unmet', p.unmet.includes('baby') && p.watch.baby === null);
  /* 主角由玩家管，不被派；外出的人不被派；卧床的不被派 */
  p = D.plan(snap([person('mom', 'adult', { lead: true }), person('dad', 'adult', { away: true }), person('gpa', 'elder', { bedridden: true }), baby()]), C);
  check('主角，外出，卧床的人都不被派', p.watch.baby === null && p.tasks.length === 0);
  /* I2 看护人疲劳过线且有人接手：换班，疲劳的去睡 */
  p = D.plan(snap([person('mom', 'adult', { fatigue: 0.85 }), person('gma', 'elder', { fatigue: 0.2 }), baby()], { baby: 'mom' }), C);
  check('I2 疲劳的看护人交班', p.watch.baby === 'gma' && p.sleep.includes('mom'), JSON.stringify(p));
  /* 睡着的人被派去盯人时先叫醒 */
  p = D.plan(snap([person('mom', 'adult', { asleep: true, fatigue: 0.2 }), baby()]), C);
  check('唯一的大人睡着时被叫醒去看护', p.watch.baby === 'mom' && p.wake.includes('mom'));
  /* 有清醒的大人时不叫醒睡着的人 */
  p = D.plan(snap([person('mom', 'adult', { asleep: true, fatigue: 0.2 }), person('dad', 'adult', { fatigue: 0.3 }), baby()]), C);
  check('有清醒大人时不叫醒睡着的', p.watch.baby === 'dad' && p.wake.length === 0);
  /* I3 独自一人，疲劳到顶，不放弃：仍被派，标为耗竭，不能去睡 */
  p = D.plan(snap([person('mom', 'adult', { fatigue: 0.98 }), baby()]), C);
  check('I3 孤立看护人耗竭仍在岗', p.watch.baby === 'mom' && p.depleted.includes('mom') && !p.sleep.includes('mom'));
  /* 分工：喂奶和哄睡同时需要，两位大人各得一件，不压在一个人身上 */
  p = D.plan(snap([person('gma', 'elder', { fatigue: 0.2 }), person('gpa', 'elder', { fatigue: 0.25 }), baby({ needs: { rest: 0.8, hunger: 0.7 } })]), C);
  check('同时需求拆给两位大人', p.tasks.length === 2 && new Set(p.tasks.map(k => k.cg)).size === 2, JSON.stringify(p.tasks));
  /* 只有一位大人时，一次只派一件 */
  p = D.plan(snap([person('mom', 'adult'), baby({ needs: { rest: 0.8, hunger: 0.7 } })]), C);
  check('一位大人一步只做一件事', p.tasks.length === 1);
  /* 手忙的人先不派，转给手空的 */
  p = D.plan(snap([person('mom', 'adult', { hands: true }), person('dad', 'adult', { fatigue: 0.3 }), baby({ needs: { rest: 0.3, hunger: 0.7 } })]), C);
  check('手忙的人不被派任务', p.tasks.every(k => k.cg === 'dad'));
  /* 不需要照看的阶段不派盯人：成人，少年；睡着的婴儿也不用 */
  p = D.plan(snap([person('mom', 'adult'), person('kid', 'teen'), baby({ asleep: true })]), C);
  check('睡着的婴儿不需要看护人', Object.keys(p.watch).length === 0);
  /* I4 做饭和照看是两条独立的通道：只有一位大人时一人担两条，有两位时分开担 */
  p = D.plan(Object.assign(snap([person('gma', 'elder', { fatigue: 0.2 }), baby({ needs: { rest: 0.3, hunger: 0.2 } })]), { meal_due: true }), C);
  check('I4 一位大人既盯着宝宝又做饭，两条通道同时占', p.watch.baby === 'gma' && p.cook === 'gma');
  p = D.plan(Object.assign(snap([person('gma', 'elder', { fatigue: 0.2 }), person('gpa', 'elder', { fatigue: 0.2 }), baby({ needs: { rest: 0.3, hunger: 0.2 } })]), { meal_due: true }), C);
  check('I4 两位大人时盯人和做饭分给两个人', p.watch.baby && p.cook && p.watch.baby !== p.cook, JSON.stringify([p.watch, p.cook]));
  /* I5 母乳喂养：婴儿饿了只有妈妈能喂，睡着也叫醒；配方奶谁都能冲 */
  const milk = o => snap([person('mom', 'adult', Object.assign({ lactating: true, asleep: true }, o)), person('gma', 'elder', { fatigue: 0.1 }), baby({ needs: { rest: 0.2, hunger: 0.8 } })]);
  p = D.plan(Object.assign(milk(), { feeding: 'breast' }), C);
  check('I5 母乳喂养饿了只派妈妈，并叫醒她', p.tasks.length === 1 && p.tasks[0].cg === 'mom' && p.wake.includes('mom'), JSON.stringify(p));
  p = D.plan(Object.assign(milk(), { feeding: 'formula' }), C);
  check('I5 配方奶谁都能冲，派醒着的奶奶，不叫醒妈妈', p.tasks.length === 1 && p.tasks[0].cg === 'gma' && !p.wake.includes('mom'), JSON.stringify(p));
  /* 夜里的响应：睡觉压制大部分的需求响应，哭声不好压，没声音的需求几乎听不见；妈妈最先响应，爷爷奶奶次之，妈妈过度疲劳听不见就轮到别人判断。
     听见与否用适配层给的 roll 判断，策略本身是纯函数 */
  {
    const cry = baby({ needs: { rest: 0.3, hunger: 0.9 } }), quiet = baby({ needs: { rest: 0.3, diaper: 0.6 } }), calm = baby({ needs: { rest: 0.3, hunger: 0.2 } });
    const mom = o => person('mom', 'adult', Object.assign({ role: 'mom', asleep: true, fatigue: 0.3, roll: 0.2 }, o));
    const gma = o => person('gma', 'elder', Object.assign({ role: 'paternal_grandma', asleep: true, fatigue: 0.2, roll: 0.2 }, o));
    let q = D.plan(snap([mom(), gma(), cry]), C);
    check('夜里孩子哭，妈妈睡着但听见了（几率 0.7，roll 0.2），叫醒妈妈', q.watch.baby === 'mom' && q.wake.includes('mom') && !q.wake.includes('gma'), JSON.stringify(q.watch));
    q = D.plan(snap([mom({ roll: 0.9 }), gma(), cry]), C);
    check('妈妈没听见（roll 0.9），奶奶听见了（几率 0.35，roll 0.2），次级人物响应', q.watch.baby === 'gma' && q.wake.includes('gma') && !q.wake.includes('mom'), JSON.stringify(q.watch));
    q = D.plan(snap([mom({ roll: 0.9 }), gma({ roll: 0.9 }), cry]), C);
    check('都没听见：没人响应，记入 unheard，没人被叫醒', q.watch.baby === null && q.unheard.includes('baby') && q.wake.length === 0, JSON.stringify(q));
    q = D.plan(snap([mom({ fatigue: 0.98, roll: 0 }), gma(), cry]), C);
    check('妈妈过度疲劳，叫不醒（几率 0），由奶奶判断响应', q.watch.baby === 'gma' && !q.wake.includes('mom'), JSON.stringify(q.watch));
    q = D.plan(snap([mom({ fatigue: 0.98, roll: 0 }), cry]), C);
    check('只有过度疲劳的妈妈，叫不醒，孩子没人响应', q.watch.baby === null && q.unheard.includes('baby'));
    q = D.plan(snap([mom({ roll: 0.15 }), quiet]), C);
    check('没有哭，只是湿了，信号只有 0.3：几率 0.21，roll 0.15 听见了', q.watch.baby === 'mom');
    q = D.plan(snap([mom({ roll: 0.3 }), quiet]), C);
    check('没有哭的需求，roll 0.3 听不见：只能看状态，睡着的妈妈不会被叫醒', q.watch.baby === null && q.wake.length === 0);
    q = D.plan(snap([mom({ roll: 0 }), calm]), C);
    check('孩子醒着但什么需求也没有，不叫醒任何人', q.watch.baby === null && q.wake.length === 0);
    q = D.plan(snap([person('mom', 'adult', { role: 'mom', fatigue: 0.3 }), person('dad', 'adult', { role: 'dad', asleep: true, roll: 0 }), cry]), C);
    check('有醒着的妈妈，不叫醒睡着的爸爸', q.watch.baby === 'mom' && q.wake.length === 0);
    const M2 = Pol.model, near2 = (a, b) => Math.abs(a - b) < 1e-9;
    check('公式 听见的几率：妈妈哭声 0.7，没哭 0.21，疲劳过线线性降，到 floor 是 0', near2(M2.hearProb(C, { role: 'mom', fatigue: 0.3, stage: 'adult' }, 1), 0.7) && near2(M2.hearProb(C, { role: 'mom', fatigue: 0.3, stage: 'adult' }, 0.3), 0.21) && near2(M2.hearProb(C, { role: 'mom', fatigue: (C.sleep_at + C.floor) / 2, stage: 'adult' }, 1), 0.7 * (1 - 0.6 * 0.5)) && M2.hearProb(C, { role: 'mom', fatigue: 0.96, stage: 'adult' }, 1) === 0);
    check('公式 爸爸 0.4，老人默认 0.35，信号强度：哭 1，要人帮 0.5，没哭 0.3，没到线 0', near2(M2.hearProb(C, { role: 'dad', fatigue: 0.2, stage: 'adult' }, 1), 0.4) && near2(M2.hearProb(C, { role: 'paternal_grandpa', fatigue: 0.2, stage: 'adult' }, 1), 0.35) && M2.signalOf(C, { cries: true, cry_at: 0.8, needs: { hunger: 0.9 } }) === 1 && M2.signalOf(C, { needs: { toilet: 0.6 }, night_help: true }) === 0.5 && M2.signalOf(C, { cries: true, cry_at: 0.8, needs: { diaper: 0.6 } }) === 0.3 && M2.signalOf(C, { cries: true, cry_at: 0.8, needs: { diaper: 0.2 } }) === 0);
    /* 疾病并进调度：记性变差的老人要人盯着；夜尿多的老人夜里要人帮，叫醒听见的人 */
    const forget = person('gpa', 'elder', { watch: true, dep: true, needs: { reorient: 0.7, rest: 0.2 }, urgency: 0.5 });
    q = D.plan(snap([person('mom', 'adult', { role: 'mom' }), forget]), C);
    check('记性变差的老人醒着，进盯人通道，不会被当成看护人', q.watch.gpa === 'mom' && !q.tasks.some(k => k.cg === 'gpa'));
    const noct = person('gpa', 'elder', { dep: true, asleep: true, night_help: true, needs: { toilet: 0.7, rest: 0.2 }, urgency: 0.4 });
    q = D.plan(snap([person('dad', 'adult', { role: 'dad', asleep: true, roll: 0.1 }), noct]), C);
    check('夜尿多的老人夜里想上厕所，叫醒听见的人去扶（几率 0.4×0.5，roll 0.1），只派厕所这一项', q.tasks.length === 1 && q.tasks[0].need === 'toilet' && q.wake.includes('dad'), JSON.stringify(q));
    q = D.plan(snap([person('dad', 'adult', { role: 'dad', asleep: true, roll: 0.5 }), noct]), C);
    check('夜尿多的老人叫人的声音不大，没听见就没有人被叫醒', q.tasks.length === 0 && q.wake.length === 0 && q.unheard.includes('gpa'));
    q = D.plan(snap([person('dad', 'adult', { role: 'dad', fatigue: 0.2 }), person('gpa', 'elder', { dep: true, night_help: true, needs: { toilet: 0.7 }, urgency: 0.4 })]), C);
    check('不会给自己派活：夜尿多的老人是被照顾的人，不是照顾自己的人', q.tasks.every(k => k.cg !== 'gpa'));
  }
  /* I8 同一份快照两次决策完全一样 */
  const S0 = snap([person('mom', 'adult', { fatigue: 0.5 }), person('dad', 'adult', { fatigue: 0.5 }), baby()]);
  check('I8 决策是纯函数', JSON.stringify(D.plan(S0, C)) === JSON.stringify(D.plan(S0, C)));
  /* I9 换实现：外部决策合规才落地，这里只验证接口存在 */
  /* I9 外部决策不合规整份丢掉，用本地规则 */
  const S9 = snap([person('mom', 'adult', { lead: true }), person('dad', 'adult', { fatigue: 0.2 }), baby()]);
  check('I9 外部决策派了主角被丢掉，回到本地规则', D.validate({ watch: { baby: 'mom' }, tasks: [], wake: [], sleep: [] }, S9, C).watch.baby === 'dad');
  check('I9 外部决策结构残缺被丢掉', D.validate({ foo: 1 }, S9, C).watch.baby === 'dad');
  check('I9 合规的外部决策原样通过', D.validate({ watch: { baby: 'dad' }, tasks: [{ cg: 'dad', target: 'baby', need: 'hunger' }], wake: [], sleep: [] }, S9, C).tasks.length === 1);
  check('I9 外部决策让一个人一步做两件事被丢掉', D.validate({ watch: { baby: 'dad' }, tasks: [{ cg: 'dad', target: 'baby', need: 'hunger' }, { cg: 'dad', target: 'baby', need: 'rest' }], wake: [], sleep: [] }, S9, C).tasks.length <= 1);
  check('I9 策略模块对外只有 config plan validate model REQUIRED，没有默认参数', ['config', 'plan', 'validate', 'model', 'REQUIRED'].every(k => k in Pol));
  const wired = execFileSync(process.execPath, ['-e', "const { CY, G } = require('./tests/harness'); const D = G.dispatch; console.log(['snapshot', 'apply', 'tick', 'plan', 'validate'].every(k => typeof D[k] === 'function') && 'policy' in D && typeof G.dispatchTick === 'function')"], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim().split(String.fromCharCode(10)).pop();
  check('I9 适配层接口齐全：snapshot apply tick plan validate policy', wired === 'true');
  /* 精力模型的公式，单独核对 */
  const M = Pol.model, near = (a, b) => Math.abs(a - b) < 1e-9;
  check('公式 疲劳增量按小时线性，盯人 0.03，手上 0.04', near(M.watchFatigue(C, 60), 0.03) && near(M.handsFatigue(C, 30), 0.02) && near(M.watchFatigue(C, 5) * 12, 0.03));
  check('公式 两条通道相加：同一个人又盯又做的增量等于两项之和', near(M.watchFatigue(C, 60) + M.handsFatigue(C, 60), 0.07));
  check('公式 出手效果：疲劳不过线是 0.7，到顶打掉一半是 0.35，中间线性', near(M.efficiency(C, 0.5), 0.7) && near(M.efficiency(C, C.sleep_at), 0.7) && near(M.efficiency(C, 1), 0.35) && near(M.efficiency(C, (C.sleep_at + 1) / 2), 0.525));
  check('公式 老人有效疲劳 ×1.3，疲劳分档边界', near(M.effFatigue(C, { fatigue: 0.5, stage: 'elder' }), 0.65) && M.tier(C, { fatigue: 0.71, stage: 'adult' }) === 0 && M.tier(C, { fatigue: 0.72, stage: 'adult' }) === 1 && M.tier(C, { fatigue: 0.95, stage: 'adult' }) === 2);

  /* 整户仿真，种子相同结果相同 */
  const a = sim('trio', 2, 7), b = sim('trio', 2, 7);
  check('I8 同种子整户仿真结果一致', JSON.stringify(a) === JSON.stringify(b));
  check('I1 三人家庭宝宝严重需求不超过两小时，身边没有醒着的大人不超过四小时，夜里父母睡着没听见，孩子安静地醒着算在里面', a.baby.urgent_h < 2 && a.baby.unattended_h < 4, JSON.stringify(a.baby));
  const duo = sim('duo', 3, 1), trio = sim('trio', 3, 1);
  const mom = o => o.people['妈妈'];
  check('I2 有替班时妈妈睡得比独自一人多', mom(trio).sleep_h_per_day > mom(duo).sleep_h_per_day + 1.5, `${mom(trio).sleep_h_per_day.toFixed(1)} vs ${mom(duo).sleep_h_per_day.toFixed(1)}`);
  check('I3 孤立的妈妈虚弱度上升，有替班的不上升', mom(duo).frailty_delta > 0.2 && mom(trio).frailty_delta <= 0.05, `${mom(duo).frailty_delta.toFixed(2)} vs ${mom(trio).frailty_delta.toFixed(2)}`);
  check('I3 孤立的妈妈清醒更久，需求压力更大', mom(duo).urgent_h_per_day > mom(trio).urgent_h_per_day + 5);
  const gf = sim('duo_gma', 3, 1), saved = process.env.CARE_FEED;
  process.env.CARE_FEED = 'breast'; const gb = sim('duo_gma', 3, 1); if (saved === undefined) delete process.env.CARE_FEED; else process.env.CARE_FEED = saved;
  check('I5 母乳喂养下妈妈夜里被叫醒更多', mom(gb).wakes_per_night > mom(gf).wakes_per_night, `${mom(gb).wakes_per_night.toFixed(1)} vs ${mom(gf).wakes_per_night.toFixed(1)}`);
  const s3 = sim('single3', 3, 1), s3g = sim('single3_gma', 3, 1);
  check('I3 单亲带三个孩子，加一位祖辈，妈妈睡得多得多，孩子需求压力小得多', mom(s3g).sleep_h_per_day > mom(s3).sleep_h_per_day + 3 && s3g.baby.urgent_h < s3.baby.urgent_h / 5, `${mom(s3g).sleep_h_per_day.toFixed(1)} vs ${mom(s3).sleep_h_per_day.toFixed(1)}`);
  /* 疾病并进调度：记性变差的老人有人盯着，还有人耐心再说一遍；夜尿多的老人夜里有人扶去厕所 */
  const fg = sim('forget', 3, 1), nc = sim('nocturia', 3, 1);
  check('整户：记性变差的爷爷醒着的时候有人盯着，也有人"耐心再说一遍"', (fg.dispatch.watchMin || 0) > 600 && (fg.dispatch.byAct.remind || 0) > 0, JSON.stringify([fg.dispatch.watchMin, fg.dispatch.byAct.remind]));
  check('整户：夜尿多的爷爷有人扶去厕所', (nc.dispatch.byAct.lead || 0) > 0, JSON.stringify(nc.dispatch.byAct));
  const five = sim('five', 3, 1);
  check('I1 五人家庭婴儿与二岁孩子严重需求都很少', five.baby.urgent_h < 2 && five.people['二岁'].urgent_h_per_day < 2, JSON.stringify(five.baby));
  console.log(fails ? '失败 ' + fails : '全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
