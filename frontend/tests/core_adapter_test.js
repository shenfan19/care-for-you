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
  const p = now.engineCond.people.p1, viaCore = Object.entries(p.cores).filter(([, v]) => v).map(([k]) => k);
  ok(`${conds.join('+')} 共享核心与旧积分器一致`, mx <= TOL && viaCore.length === conds.length, `最大差 ${mx.toExponential(1)}，走核心的模型 ${viaCore.length}`);
}
const oldP = old.engineCond.people.p1;
ok('旧积分器对照确实没走核心', Object.values(oldP.cores).every(v => !v));
console.log(bad ? `失败 ${bad} 项` : '全部通过');
process.exit(bad ? 1 : 0);
