/* 规则代码里不允许写死常数：游戏规则的数都写进 frontend/config 下的 YAML，由 tools/build_config.js 在部署前打包成脚本。
   本工具扫描规则代码里的数字字面量，列出还没迁到配置里的，并且做"只减不增"的检查。
   用法：
     node tools/lint_constants.js            每个文件还剩几个
     node tools/lint_constants.js --list     列出每一处，带行号
     node tools/lint_constants.js --check    和 tools/constants_baseline.json 比，任何文件的数量变多就退出码 1
     node tools/lint_constants.js --update   把现在的数量写成新的基线（迁走一些之后用）
     node tools/lint_constants.js --all [--list]   范围之外的目录（画面，界面，后端，AI，种子）也数一数，加 --list 列出每一处
   允许的数字：0，1，2，以及单位换算和进制 10，12（半天的小时数，一年的月数），16，24，36，60，100，1000，1440，3600，60000，86400，3600000，86400000，数组下标，它们是换算和下标，不是规则；其余都算常数。
   不扫描的文件：store，archive，i18n，curves，meta，ini，这几个是存储，语言，作图的技术限制，不是游戏规则。 */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'frontend', 'src', 'core');
const SKIP = new Set(['store.js', 'archive.js', 'i18n.js', 'curves.js', 'meta.js', 'ini.js']);
const OK = new Set(['0', '1', '2', '10', '24', '60', '100', '1000', '1440', '3600', '60000', '86400', '3600000', '86400000', '16', '36', '12']);
const baselineFile = path.join(__dirname, 'constants_baseline.json');

/* 把注释，字符串，模板字符串，正则去掉，换成同长度的空格，保留行号 */
const strip = src => {
  let out = '', i = 0; const n = src.length;
  const blank = s => s.replace(/[^\n]/g, ' ');
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '*') { const j = src.indexOf('*/', i + 2); const e = j < 0 ? n : j + 2; out += blank(src.slice(i, e)); i = e; continue; }
    if (c === '/' && d === '/') { const j = src.indexOf('\n', i); const e = j < 0 ? n : j; out += blank(src.slice(i, e)); i = e; continue; }
    if (c === '\'' || c === '"') { let j = i + 1; while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1; out += blank(src.slice(i, j + 1)); i = j + 1; continue; }
    if (c === '`') {
      let j = i + 1, depth = 0, buf = '`';
      while (j < n && !(src[j] === '`' && depth === 0)) {
        if (src[j] === '\\') { buf += ' '.repeat(2); j += 2; continue; }
        if (src[j] === '$' && src[j + 1] === '{') { depth++; buf += '  '; j += 2; continue; }
        if (src[j] === '}' && depth > 0) { depth--; buf += ' '; j++; continue; }
        buf += depth > 0 ? src[j] : (src[j] === '\n' ? '\n' : ' '); j++;
      }
      out += buf + ' '; i = j + 1; continue;
    }
    if (c === '/') {
      const prev = out.replace(/\s+$/, '').slice(-1);
      if (prev === '' || /[(,=:[!&|?{};+\-*%<>~^]/.test(prev) || /\b(return|typeof|case|in|of)\s*$/.test(out.slice(-8))) {
        let j = i + 1, cls = false; while (j < n && (src[j] !== '/' || cls) && src[j] !== '\n') { if (src[j] === '\\') j++; else if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; j++; }
        j++; while (j < n && /[a-z]/.test(src[j])) j++;
        out += blank(src.slice(i, j)); i = j; continue;
      }
    }
    out += c; i++;
  }
  return out;
};

const scan = file => {
  const src = fs.readFileSync(file, 'utf8'), clean = strip(src), lines = clean.split('\n'), orig = src.split('\n'), hits = [];
  lines.forEach((l, k) => {
    l = l.replace(/\[\s*\d+\s*\]/g, '[]');   /* m[3] 这类下标不是常数 */
    l = l.replace(/\d+(\.\d+)?e[-+]?\d+/gi, ' ');   /* 1e-6 这类写法是极小量，不算规则常数 */
    const re = /(?<![\w.$])(\d+\.\d+|\d+)(?![\w.])/g; let m;
    while ((m = re.exec(l))) { const v = m[1]; if (OK.has(v)) continue; hits.push({ line: k + 1, v, text: orig[k].trim().slice(0, 120) }); }
  });
  return hits;
};

if (process.argv[2] === '--all') {
  /* 范围之外的目录也数一数，只报数量：画面，界面，后端，AI，种子里的代码部分。这些还没迁，后续按同样的办法迁 */
  const base = path.join(__dirname, '..', 'frontend', 'src'); let all = 0;
  for (const d of ['world', 'ui', 'backend', 'ai', 'data']) {
    const dir = path.join(base, d); if (!fs.existsSync(dir)) continue;
    let sub = 0; const per = [];
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js') && !/packed|^content|^lm_seed|^references|^visitors|^houses|^cards/.test(x)).sort()) { const hits = scan(path.join(dir, f)), n = hits.length; sub += n; if (n) per.push(f + ' ' + n); if (process.argv[3] === '--list') for (const h of hits) console.log(`  ${d}/${f}:${h.line}  ${h.v}  ${h.text}`); }
    console.log(d.padEnd(8), String(sub).padStart(5), per.join('，')); all += sub;
  }
  console.log('范围之外合计', all); process.exit(0);
}
const files = fs.readdirSync(root).filter(f => f.endsWith('.js') && !SKIP.has(f)).sort();
const result = {}; let total = 0;
for (const f of files) { const h = scan(path.join(root, f)); result[f] = h; total += h.length; }
const mode = process.argv[2] || '';
if (mode === '--list') { for (const f of files) for (const h of result[f]) console.log(`${f}:${h.line}  ${h.v}  ${h.text}`); console.log('合计 ' + total); }
else if (mode === '--update') { const o = {}; for (const f of files) o[f] = result[f].length; fs.writeFileSync(baselineFile, JSON.stringify(o, null, 1) + '\n'); console.log('基线已更新，合计 ' + total); }
else if (mode === '--check') {
  const base = fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, 'utf8')) : {};
  let bad = 0;
  for (const f of files) { const b = base[f] === undefined ? 0 : base[f]; if (result[f].length > b) { bad++; console.error(`${f}：常数从 ${b} 个变成 ${result[f].length} 个，新增的要写进配置文件`); for (const h of result[f].slice(0, 8)) console.error(`  ${h.line}  ${h.v}  ${h.text}`); } }
  console.log(bad ? '常数检查：不通过' : '常数检查：通过，规则代码里还剩 ' + total + ' 个常数');
  process.exit(bad ? 1 : 0);
} else { for (const f of files) console.log(f.padEnd(20), result[f].length); console.log('合计'.padEnd(20), total); }
