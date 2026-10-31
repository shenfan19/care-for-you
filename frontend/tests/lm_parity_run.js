/* lm_parity.py 的 JS 一侧：用 harness 载入页面脚本，直接读 backend_lm_ai 的 YAML 文件建库，跑同一个场景，输出指令流。 */
const { ctx, CY, fs, path, root } = require('./harness');
const people = JSON.parse(process.argv[2]), TICKS = +process.argv[3], TMIN = +process.argv[4];
const dir = path.join(root, '..', 'backend_lm_ai');
const docs = fs.readdirSync(path.join(dir, 'models')).filter(f => f.endsWith('.yaml')).sort().map(f => [f, ctx.jsyaml.load(fs.readFileSync(path.join(dir, 'models', f), 'utf8'))]);
const lib = new CY.lm.Library(docs, ctx.jsyaml.load(fs.readFileSync(path.join(dir, 'classes.yaml'), 'utf8')));
const eng = new CY.lm.Engine(lib);
const snaps = {};
for (const [id, sp, st, age, needs, conds] of people) { snaps[id] = { id, species: sp, stage: st, age, needs: Object.fromEntries(needs.map(n => [n, 0.2])), mood: 0.7, frailty: 0.1, sleeping: false, conditions: conds, flags: {} }; }
const log = [];
for (let i = 0; i < TICKS; i++) {
  const hour = (i * TMIN / 60) % 24;
  for (const s of Object.values(snaps)) s.sleeping = hour < 7;
  const res = eng.drive({ minutes: TMIN, people: Object.values(snaps).map(s => JSON.parse(JSON.stringify(s))), world: { hour } });
  for (const d of res.directives) { const s = snaps[d.person]; if (d.op === 'need') s.needs[d.need] = Math.min(1, Math.max(0, s.needs[d.need] + d.delta)); else s[d.op] = Math.min(1, Math.max(0, s[d.op] + d.delta)); }
  log.push(res.directives.map(d => [d.person, d.need || d.op, d.delta]).sort((a, b) => (a[0] + a[1] < b[0] + b[1] ? -1 : a[0] + a[1] > b[0] + b[1] ? 1 : 0)));
}
process.stdout.write(JSON.stringify(log));
process.exit(0);
