/* 把 frontend/src/data/cards 和 frontend/src/data/visitors 里一卡一个文件的 YAML 打包成浏览器里用的两个脚本：
   frontend/src/data/cards_packed.js 和 frontend/src/data/visitors_packed.js。改了任何卡片 YAML 以后重新运行：
   node tools/build_cards.js
   只检查不写文件：node tools/build_cards.js --check，有差别或文件缺失时退出码为 1。 */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'frontend');
const jsyaml = require(path.join(root, 'vendor', 'js-yaml.min.js'));
const dataDir = path.join(root, 'src', 'data');

const fail = m => { console.error('错误：' + m); process.exit(1); };
const load = dir => {
  const d = path.join(dataDir, dir), out = [];
  for (const f of fs.readdirSync(d).filter(n => n.endsWith('.yaml')).sort()) {
    let x;
    try { x = jsyaml.load(fs.readFileSync(path.join(d, f), 'utf8')); } catch (e) { fail(`${dir}/${f} 不是合法的 YAML：${e.message}`); }
    if (!x || typeof x !== 'object') fail(`${dir}/${f} 是空的`);
    if (x.id !== f.replace(/\.yaml$/, '')) fail(`${dir}/${f} 里的 id 是 ${x.id}，必须和文件名一致`);
    if (typeof x.order !== 'number') fail(`${dir}/${f} 缺少数字 order`);
    out.push(x);
  }
  const seen = new Set();
  for (const x of out) { if (seen.has(x.order)) fail(`${dir} 里 order ${x.order} 重复`); seen.add(x.order); }
  return out.sort((a, b) => a.order - b.order);
};

/* 角色卡：原型字段进 C.archetypes，health、help、prefs、dialogue.lines 是覆盖项，进 C.cardExtra */
const cards = load('cards'), archetypes = [], extra = {}, names = {};
const NEED = ['id', 'group', 'label', 'species', 'voice', 'pronoun', 'look'];
for (const c of cards) {
  for (const k of NEED) if (c[k] === undefined) fail(`cards/${c.id}.yaml 缺少 ${k}`);
  const a = {}, lab = typeof c.label === 'string' ? { 'zh-CN': c.label } : c.label;
  if (!lab || !lab['zh-CN'] || !lab.en) fail(`cards/${c.id}.yaml 的 label 至少要有 zh-CN 和 en`);
  if (!['he', 'she', 'it'].includes(c.pronoun)) fail(`cards/${c.id}.yaml 的 pronoun 必须是 he，she 或 it`);
  for (const l in lab) (names[l] = names[l] || {})['arch.' + c.id] = lab[l];
  for (const k of Object.keys(c)) {
    if (['order', 'health', 'help', 'prefs', 'dialogue'].includes(k)) continue;
    a[k === 'label' ? 'role' : k] = k === 'label' ? lab['zh-CN'] : c[k];
  }
  archetypes.push(a);
  const e = {};
  for (const k of ['health', 'help', 'prefs']) if (c[k]) e[k] = c[k];
  if (c.dialogue && c.dialogue.lines) e.lines = c.dialogue.lines;
  if (Object.keys(e).length) extra[c.id] = e;
}
const cardsJs = '/* 角色原型，各语言的角色名（键 arch.<id>），各类角色的覆盖项，由 tools/build_cards.js 从 cards 文件夹的 YAML 生成，不要手改。 */\n(function (CY) {\n  const C = CY.content;\n  C.archetypes.push(\n'
  + archetypes.map(a => '    ' + JSON.stringify(a) + ',\n').join('')
  + '  );\n' + Object.keys(names).map(l => `  CY.i18n.register(${JSON.stringify(l)}, ${JSON.stringify(names[l])});\n`).join('') + '  C.cardExtra = {\n' + Object.keys(extra).map(k => `    ${JSON.stringify(k)}: ${JSON.stringify(extra[k])},\n`).join('') + '  };\n})(globalThis.CY = globalThis.CY || {});\n';

/* 来客卡：去掉 order，其余原样交给 V.add */
const visitors = load('visitors');
for (const v of visitors) for (const k of ['t', 'look', 'souvenir']) if (!v[k]) fail(`visitors/${v.id}.yaml 缺少 ${k}`);
const visitorsJs = '/* 官方来客卡，由 tools/build_cards.js 从 visitors 文件夹的 YAML 生成，不要手改。 */\n(function (CY) {\n  const V = CY.visitors;\n'
  + visitors.map(v => { const { order, ...rest } = v; return '  V.add(' + JSON.stringify(rest) + ');\n'; }).join('')
  + '})(globalThis.CY = globalThis.CY || {});\n';

const targets = [[path.join(dataDir, 'cards_packed.js'), cardsJs], [path.join(dataDir, 'visitors_packed.js'), visitorsJs]];
if (process.argv.includes('--check')) {
  let bad = 0;
  for (const [f, s] of targets) { if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== s) { console.error('过期或缺失：' + path.relative(root, f)); bad++; } }
  process.exit(bad ? 1 : 0);
}
for (const [f, s] of targets) fs.writeFileSync(f, s, { encoding: 'utf8' });
console.log(`${archetypes.length} 张角色卡，${visitors.length} 张来客卡`);
