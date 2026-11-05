/* 配置的测试：规则的数都在 YAML 里，代码读不到的键就报错，配置放对了地方。
   单独运行：node tests/config_test.js。部署前检查 tools/predeploy.js 会跑它。 */
const fs = require('fs'), path = require('path');
const { CY, G } = require('./harness');
const jsyaml = require('../vendor/js-yaml.min.js');
const Pol = require('../src/core/dispatch_policy.js');
let fails = 0;
const check = (n, c, x) => { if (!c) fails++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };
const read = f => fs.readFileSync(path.join(__dirname, '..', 'config', 'templates', f), 'utf8');
(async () => {
  CY.i18n.set('zh-CN');
  await G.load();
  const sys = jsyaml.load(read('system.yaml')), eng = jsyaml.load(read('engine.yaml'));

  /* 配置放对了地方：modules 和 dispatch 在最外层，不在 agents 下面（曾经缩进错过，写了等于没写） */
  check('system.yaml：modules 和 dispatch 在最外层', sys.modules && sys.dispatch && !(sys.agents && (sys.agents.modules || sys.agents.dispatch)), Object.keys(sys).join());
  check('模块开关读的是 YAML：调度开，商店开，统计开', G.module('dispatch') && G.module('shop') && G.module('ledger'));
  check('engine.yaml 的各节都在', ['economy', 'shop', 'visitors', 'time', 'clock', 'ledger', 'household', 'needs', 'social', 'hash', 'settle', 'directives', 'game'].every(k => eng[k] !== undefined));

  /* 读不到的键直接报错，没有默认值 */
  const boom = f => { try { f(); return null; } catch (e) { return String(e.message); } };
  check('缺一节配置，报"缺少配置 engine.某节"', /缺少配置 engine\.nothing/.test(boom(() => G.E('nothing')) || ''));
  const saved = G.tpl.engine.economy.wage; delete G.tpl.engine.economy.wage;
  check('缺一个键，报出完整的路径', /缺少配置 engine\.economy\.wage/.test(boom(() => G.WAGE) || ''));
  G.tpl.engine.economy.wage = saved;
  check('键齐了就读得到', G.WAGE === eng.economy.wage);
  check('调度的参数缺一个就报错，策略模块没有默认值', /缺少配置 dispatch\.step_minutes/.test(boom(() => Pol.config({})) || '') && Object.keys(Pol.config(sys.dispatch)).length >= Pol.REQUIRED.length);

  /* 迁到配置里的值，行为没变：这几个是迁移前代码里写的数 */
  check('迁移前后的值一致：工资，退休金比例，起始的钱，商品价格', G.WAGE === 26 && G.PENSION_RATIO === 0.3 && G.START_MONEY === 200 && G.SHOP.find(i => i.id === 'toy').price === 80 && G.SHOP.find(i => i.id === 'wheelchair').outing_scale === 1.25);
  check('迁移前后的值一致：来客的节奏，好感，床位', G.DOOR.arrive_from === 8 && G.FAV.ok === 30 && G.FAMILY_BEDS === 6 && G.BED_PRICE[1] === 600);
  check('迁移前后的值一致：打断间隔，需求的涨落', G.E('game').interrupt_gap_minutes.normal[1] === 180 && G.E('game').need_dynamics.frailty_up === 0.02 && G.E('game').mood_bands.great === 0.75);

  /* 种子文件里带着 engine.yaml，和 YAML 文件逐字一致 */
  check('内置种子里的 engine.yaml 和 config 下的文件逐字一致', CY.seed.files()['templates/engine.yaml'] === read('engine.yaml'));
  check('内置种子里的 system.yaml 和 config 下的文件逐字一致', CY.seed.files()['templates/system.yaml'] === read('system.yaml'));
  check('每个模板 YAML 都有数字 version', (function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).every(e => (e.isDirectory() ? walk(path.join(d, e.name)) : !e.name.endsWith('.yaml') || typeof jsyaml.load(fs.readFileSync(path.join(d, e.name), 'utf8')).version === 'number')); })(path.join(__dirname, '..', 'config', 'templates')));
  console.log(fails ? '失败 ' + fails : '全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
