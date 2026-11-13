/* 需求与心情的涨落：游戏自己的老算法对共享核心，同一户人家，同一个随机种子，每个游戏分钟推进一次，需求和心情逐步比较。
   推进一游戏分钟等于核心的内部步长，这时两边一致到浮点误差。用法：node tests/needs_core_test.js */
const { spawnSync } = require('child_process');
const path = require('path');
const TOL = 1e-9, DAYS = 2;
if (process.argv[2] === 'trace') {
  const { ctx, CY, G } = require('./harness');
  let a = 12345 >>> 0; ctx.Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ (t + Math.imul(t ^ (t >>> 7), 61 | t)); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  Math.random = ctx.Math.random;
  (async () => {
    let fake = Date.UTC(2026, 9, 28, 0, 0, 0) + 8 * 3600e3; const Real = Date;
    ctx.Date = class extends Real { static now() { return fake; } constructor(...x) { if (x.length) super(...x); else super(fake); } };
    CY.i18n.set('zh-CN'); await G.load();
    for (const [arch, name, cond] of [['paternal_grandpa', '爷爷', ['diabetes']], ['mom', '妈妈'], ['baby', '宝宝'], ['cat', '团子'], ['flower', '小花']]) await G.createPerson({ arch, name, conditions: cond });
    await G.load(); G.world.intro_done = true; G.cfg.play.backend_provider = 'builtin'; G.cfg.play.condition_models = 'false';
    const lead = G.people.find(p => G.canLead(p)); if (lead) G.setProtagonist(lead.id);
    G.cfg.time.speed = '1'; G.cfg.time.daynight = 'system'; G.DAY.enabled = false; G.lastTick = fake;
    const out = [];
    for (let i = 0; i < DAYS * 1440; i++) {
      fake += 60000; G.advance(1, false);
      if (i % 5 === 0) out.push(G.people.map(p => [p.state.mood, ...Object.keys(p.state.needs).sort().map(k => p.state.needs[k])]));
    }
    process.stdout.write('TRACE' + JSON.stringify({ usedCore: !!(CY.coreNeeds && CY.coreNeeds.ready()), n: out.length, trace: out }));
  })().catch(e => { console.error(e); process.exit(1); });
} else {
  const run = legacy => { const r = spawnSync(process.execPath, [__filename, 'trace'], { env: Object.assign({}, process.env, legacy ? { CARE_LEGACY_INTEGRATOR: '1' } : {}), encoding: 'utf8', maxBuffer: 1 << 28 }); const i = r.stdout.indexOf('TRACE'); if (i < 0) throw new Error(r.stderr || 'no trace'); return JSON.parse(r.stdout.slice(i + 5)); };
  const A = run(true), B = run(false);
  let mx = 0, at = '';
  A.trace.forEach((row, i) => row.forEach((p, j) => p.forEach((x, k) => { const d = Math.abs(x - B.trace[i][j][k]); if (d > mx) { mx = d; at = `step ${i} person ${j} var ${k}`; } })));
  const ok = mx <= TOL && !A.usedCore && B.usedCore && A.n === B.n;
  console.log((ok ? '通过 ' : '失败 ') + '需求与心情的涨落，共享核心与游戏自己的算法一致  最大差 ' + mx.toExponential(1) + ' ' + at + ` 采样 ${A.n} 次`);
  console.log(ok ? '全部通过' : '失败 1 项'); process.exit(ok ? 0 : 1);
}
