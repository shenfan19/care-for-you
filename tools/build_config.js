/* 把 frontend/config/templates 下的 YAML 打包成浏览器里用的脚本 frontend/src/data/templates_packed.js。
   规则的数都写在 YAML 里，改了以后部署前运行：
     node tools/build_config.js
   只检查不写文件：node tools/build_config.js --check，打包的脚本和 YAML 对不上，或者 YAML 不合法，退出码为 1。
   部署前一步运行：node tools/predeploy.js，它先打包两种数据（卡片和配置），再跑检查，哪一步不通过就不让部署。
   为什么要打包：网页从本地文件夹直接打开时读不了别的文件，脚本里的数据才读得到，所以 YAML 是源头，脚本是它的拷贝，不手改脚本。 */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'frontend');
const jsyaml = require(path.join(root, 'vendor', 'js-yaml.min.js'));
const base = path.join(root, 'config', 'templates'), out = path.join(root, 'src', 'data', 'templates_packed.js');
const fail = m => { console.error('错误：' + m); process.exit(1); };

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.yaml') ? [path.join(d, e.name)] : []));
const files = walk(base).sort();
const map = {};
for (const f of files) {
  const rel = 'templates/' + path.relative(base, f).split(path.sep).join('/'), text = fs.readFileSync(f, 'utf8');
  let doc; try { doc = jsyaml.load(text); } catch (e) { fail(`${rel} 不是合法的 YAML：${e.message}`); }
  if (!doc || typeof doc !== 'object') fail(`${rel} 是空的`);
  if (typeof doc.version !== 'number') fail(`${rel} 缺少数字 version，改了内容要把它加一，旧存档才会更新`);
  map[rel] = text;
}
const js = `/* 由 tools/build_config.js 生成，不要手改。源头是 frontend/config/templates 下的 YAML，改了 YAML 以后重新运行 node tools/build_config.js */
(function (CY) {
  CY.templatesPacked = ${JSON.stringify(map, null, 1)};
})(globalThis.CY = globalThis.CY || {});
`;
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (cur !== js) { console.error('templates_packed.js 和 YAML 对不上，运行 node tools/build_config.js'); process.exit(1); }
  console.log('配置打包：一致，共 ' + files.length + ' 个 YAML');
} else { fs.writeFileSync(out, js, 'utf8'); console.log('已打包 ' + files.length + ' 个 YAML 到 templates_packed.js'); }
