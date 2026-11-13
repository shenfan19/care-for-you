/* 适配层与共享核心的一致性：同一串动作，疾病模型分别走旧积分器和共享核心，每一步的需求、心情、虚弱度、读数必须一致。
   游戏推进一次 5 分钟，等于核心的内部步长，这时两边逐位一致。别的调用长度核心按固定步长累积，不在这里比。
   用法：node tests/core_adapter_test.js */
const sim = require('./cond_sim.js');
const STEP = 5, DAYS = 3, TOL = 1e-9;
const mk = legacy => { if (legacy) process.env.CARE_LEGACY_INTEGRATOR = '1'; else delete process.env.CARE_LEGACY_INTEGRATOR; return sim.loadLm(); };
const old = mk(true), now = mk(false);
let bad = 0;
const ok = (name, pass, extra) => { console.log((pass ? '通过 ' : '失败 ') + name + (extra ? '  ' + extra : '')); if (!pass) bad++; };
const cases = [['diabetes'], ['hypertension'], ['arthritis'], ['depress'], ['diabetes', 'hypertension', 'arthritis']];
for (const conds of cases) {
  const mkSnap = () => sim.person(conds, { cond_set: { [conds[0]]: { severity: 'moderate' } } });
  const a = sim.run(old, mkSnap(), DAYS, sim.carePolicy, STEP), b = sim.run(now, mkSnap(), DAYS, sim.carePolicy, STEP);
  let mx = 0;
  a.forEach((x, i) => {
    const y = b[i], d = (p, q) => { mx = Math.max(mx, Math.abs(p - q)); };
    for (const k in x.snap.needs) d(x.snap.needs[k], y.snap.needs[k]);
    d(x.snap.mood, y.snap.mood); d(x.snap.frailty, y.snap.frailty);
    x.ro.forEach((r, j) => { if (r.value !== null) d(r.value, y.ro[j].value); });
  });
  const p = now.engineCond.people.p1, viaCore = p.coreUnits().flatMap(u => u.models);
  ok(`${conds.join('+')} 共享核心与旧积分器一致`, mx <= TOL && viaCore.length === conds.length, `最大差 ${mx.toExponential(1)}，走核心的模型 ${viaCore.length}`);
}
/* 全模型模式：疾病模型加手写的身体，能量，水分，睡眠，社交，家务模型，各类角色，逐步一致 */
{
  const needs = { hunger: 0.8, thirst: 0.8, company: 0.8, medicine: 0.7, sugar: 0.8, bp: 0.8, joint: 0.8, lowmood: 0.8, rest: 0.8, play: 0.8, hygiene: 0.8, mobility: 0.8 };
  const people = [['老年糖尿病人', { stage: 'elder', needs }, ['diabetes']], ['成年人', { stage: 'adult', needs }, []], ['婴儿', { stage: 'infant', needs: { hunger: 0.8, thirst: 0.8, diaper: 0.8, rest: 0.8, company: 0.8 } }, []],
    ['猫', { species: 'cat', stage: 'adult', needs: { hunger: 0.8, thirst: 0.8, play: 0.8, litter: 0.8 } }, []], ['花', { species: 'flower', stage: 'adult', needs: { water: 0.8, sun: 0.8 } }, []]];
  for (const [name, extra, conds] of people) {
    const mkSnap = () => sim.person(conds, JSON.parse(JSON.stringify(extra)));
    const a = sim.run(old, mkSnap(), DAYS, sim.carePolicy, STEP, true), b = sim.run(now, mkSnap(), DAYS, sim.carePolicy, STEP, true);
    let mx = 0; a.forEach((x, i) => { const y = b[i], d = (p, q) => { mx = Math.max(mx, Math.abs(p - q)); }; for (const k in x.snap.needs) d(x.snap.needs[k], y.snap.needs[k]); d(x.snap.mood, y.snap.mood); d(x.snap.frailty, y.snap.frailty); });
    const units = now.engine.people.p1.coreUnits();
    ok(`全模型 ${name} 共享核心与旧积分器一致`, mx <= TOL && units.length > 0, `最大差 ${mx.toExponential(1)}，核心单元 ${units.length}`);
  }
}
/* 输入来源合并：level 取优先级最高的来源，total 求和，来源不在配置里就报错 */
{
  const fs = require('fs'), vm = require('vm'), path = require('path'), c = vm.createContext({});
  c.globalThis = c; vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/backend/core_sources.js'), 'utf8'), c);
  const M = c.CY.coreSources.merge, P = ['player', 'dispatch', 'event', 'preset'];
  const r = M([{ mode: 'level', value: 3, source: 'event' }, { mode: 'level', value: 5, source: 'player' }, { mode: 'level', value: 1, source: 'preset' }, { mode: 'total', value: 2, source: 'dispatch' }, { mode: 'total', value: 4, source: 'player' }], P);
  ok('合并：level 取玩家，total 求和', r.level === 5 && r.source === 'player' && r.total === 6);
  ok('合并：没有 level 写入时为 null', M([{ mode: 'total', value: 1, source: 'event' }], P).level === null);
  let threw = false; try { M([{ mode: 'level', value: 1, source: 'ghost' }], P); } catch (e) { threw = true; }
  ok('合并：来源不在优先级配置里就报错', threw);
  const p = now.engineCond.people.p1, m = p.lib.models.find(x => x.name === 'cond_diabetes');
  const base = p.coreInputs(m, 3, 5 / 60, 0, p.clockH).dm_carbs;
  p.windows.push({ m, var: 'dm_carbs', level: true, source: 'dispatch', per: 10, from: p.clockH - 1, until: p.clockH + 1 }, { m, var: 'dm_carbs', level: true, source: 'player', per: 30, from: p.clockH - 1, until: p.clockH + 1 }, { m, var: 'dm_carbs', level: false, source: 'event', per: 2, from: p.clockH - 1, until: p.clockH + 1 });
  ok('两个来源同时写一个 level 输入，玩家的赢，total 另外加', Math.abs(p.coreInputs(m, 3, 5 / 60, 0, p.clockH).dm_carbs - (base + 30 + 2)) < 1e-12);
  p.windows.length = 0;
}
const oldP = old.engineCond.people.p1;
ok('旧积分器对照确实没走核心', oldP.coreUnits().length === 0);
console.log(bad ? `失败 ${bad} 项` : '全部通过');
process.exit(bad ? 1 : 0);
