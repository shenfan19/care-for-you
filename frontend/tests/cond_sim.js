/* 疾病模型的无头仿真：不经过游戏，只加载 lm.js 和 data/lm 里的模型，按每天的作息给动作，打印读数。
   用法：node tests/cond_sim.js diabetes [天数] [mild|moderate|advanced] [care|neglect]
   care 是按时吃药，隔一阵测一次；neglect 是什么都不做。模型改动后用它看数值是不是合理。 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');

function loadLm(dir) {
  const ctx = vm.createContext({ console, Math, JSON, Promise, globalThis: null });
  ctx.globalThis = ctx;
  vm.runInContext(fs.readFileSync(path.join(root, 'vendor/js-yaml.min.js'), 'utf8'), ctx);
  for (const f of ['core_convert.js', 'core_assign.js', 'core_sources.js', 'lm.js']) vm.runInContext(fs.readFileSync(path.join(root, 'src/backend', f), 'utf8'), ctx);
  const CY = ctx.CY, y = ctx.jsyaml;
  if (!process.env.CARE_LEGACY_INTEGRATOR) CY.LMCore = require(path.join(root, 'src/backend/core_runtime/index.js')).LMCore;
  const base = dir || path.join(root, 'src/data/lm');
  const docs = fs.readdirSync(base).filter(f => f.endsWith('.yaml') && f !== 'classes.yaml').sort().map(f => [f, y.load(fs.readFileSync(path.join(base, f), 'utf8'))]);
  const ad = path.join(base, 'adapter'), adapters = {};
  if (fs.existsSync(ad)) for (const f of fs.readdirSync(ad).filter(f => f.endsWith('.yaml'))) adapters[f] = y.load(fs.readFileSync(path.join(ad, f), 'utf8'));
  CY.lm.build(CY.lm.mergeAdapters(docs, adapters), y.load(fs.readFileSync(path.join(base, 'classes.yaml'), 'utf8')), y.load(fs.readFileSync(path.join(base, 'adapter_config.yaml'), 'utf8')));
  return CY.lm;
}

/* 一个模拟的角色，需求按固定速率涨，动作把需求清零，同时记一个脉冲 */
function person(conds, extra) {
  return Object.assign({ id: 'p1', species: 'human', stage: 'elder', age: 70, mood: 0.7, frailty: 0.2, needs: { hunger: 0.8, thirst: 0.8, company: 0.8, medicine: 0.7, sugar: 0.8, bp: 0.8, joint: 0.8, lowmood: 0.8 },
    conditions: conds, cond_set: {}, flags: {}, sleeping: false, rate_mult: {}, pulses: [] }, extra || {});
}

/* 跑若干天。policy(dayMinute, dayIndex, snap) 返回这一刻要做的动作编号列表 */
function run(lm, snap, days, policy, stepMin = 2) {
  const eng = lm.engineCond, out = [];
  let t = 0; const total = days * 1440;
  while (t < total) {
    const dayMin = t % 1440, hour = dayMin / 60;
    snap.sleeping = hour < 6.5 || hour >= 22.5;
    snap.pulses = policy ? policy(dayMin, Math.floor(t / 1440), snap) : [];
    for (const a of snap.pulses) for (const n of ACTION_NEED[a] || []) snap.needs[n] = 1;
    const req = { minutes: stepMin, world: { hour: (t + stepMin) % 1440 / 60, date: { weekday: Math.floor(t / 1440) % 7 } }, people: [snap] };
    const r = eng.drive(req);
    for (const d of r.directives) {
      if (d.op === 'need') snap.needs[d.need] = Math.min(1, Math.max(0, snap.needs[d.need] + d.delta));
      else if (d.op === 'mood') snap.mood = Math.min(1, Math.max(0, snap.mood + d.delta));
      else if (d.op === 'frailty') snap.frailty = Math.min(1, Math.max(0, snap.frailty + d.delta));
    }
    /* 内置后端对心情和虚弱度的规则：心情向 1 减 0.7 倍最高需求松弛，虚弱度在需求很满时涨，很低时降 */
    const hrs = stepMin / 60, mx = Math.max(...Object.keys(snap.needs).map(k => 1 - snap.needs[k]));
    snap.mood = Math.min(1, Math.max(0, snap.mood + (Math.min(1, Math.max(0, 1 - 0.7 * mx)) - snap.mood) * Math.min(1, hrs * 0.5)));
    if (mx > 0.9) snap.frailty = Math.min(1, snap.frailty + 0.02 * hrs); else if (mx < 0.4) snap.frailty = Math.max(0, snap.frailty - 0.01 * hrs);
    t += stepMin;
    out.push({ t, snap: JSON.parse(JSON.stringify(snap)), ro: lm.readouts(snap.id) });
  }
  return out;
}
const ACTION_NEED = { sugar: ['sugar'], selfsugar: ['sugar'], bp: ['bp'], selfbp: ['bp'], heat: ['joint'], selfheat: ['joint'], massage: ['joint'], listen: ['lowmood'], walkout: ['lowmood'] };

/* 作息：早晚各一次药，白天测一次，需求超过 0.6 时做对应动作 */
const carePolicy = (dm, day, snap) => {
  const acts = [], at = h => Math.abs(dm - h * 60) < 1;
  if (at(8)) acts.push('medicine');
  if (at(10)) { acts.push('sugar', 'bp'); }
  if (snap.needs.joint < 0.4 && dm > 7 * 60 && dm < 21 * 60) acts.push('heat');
  if (snap.needs.lowmood < 0.4 && dm > 9 * 60 && dm < 20 * 60) acts.push('listen');
  return acts;
};

module.exports = { loadLm, person, run, carePolicy };

if (require.main === module) {
  const [cond = 'diabetes', days = 7, sev = 'moderate', mode = 'care'] = process.argv.slice(2);
  const lm = loadLm(), snap = person([cond], { cond_set: { [cond]: { severity: sev } } });
  const res = run(lm, snap, Number(days), mode === 'care' ? carePolicy : null, 2);
  const every = 60;
  const lines = [];
  for (let i = 0; i < res.length; i += every / 2 * 3) {
    const r = res[i], day = Math.floor(r.t / 1440), hh = Math.floor(r.t % 1440 / 60);
    if (hh % 3) continue;
    lines.push(`d${day} ${String(hh).padStart(2, '0')}h  ` + r.ro.map(x => `${x.id}=${x.live !== null ? x.live.toFixed(x.decimals || 0) : '-'}${x.value === null ? '(未测)' : ''}`).join(' ') + `  needs=` + Object.entries(r.snap.needs).filter(([k]) => ({ diabetes: ['sugar', 'medicine'], hypertension: ['bp', 'medicine'], arthritis: ['joint'], depress: ['lowmood'] }[cond] || []).includes(k)).map(([k, v]) => k + ':' + v.toFixed(2)).join(' ') + `  mood=${r.snap.mood.toFixed(2)} frail=${r.snap.frailty.toFixed(3)}`);
  }
  console.log(lines.join('\n'));
}
