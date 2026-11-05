/* 部署前运行：node tools/predeploy.js
   先把卡片和配置的 YAML 重新打包成脚本，再检查：打包的脚本和 YAML 一致，规则代码里没有新增常数，调度，统计，配置的测试通过。
   任何一步不通过就以非零状态退出，不让部署。
   为什么：网页从本地文件夹直接打开时读不了别的文件，数据只能是脚本；YAML 是源头，脚本是它的拷贝。 */
const { execFileSync } = require('child_process'), path = require('path');
const run = (label, args) => { process.stdout.write(label + '：'); try { const out = execFileSync(process.execPath, args, { cwd: path.join(__dirname, '..'), encoding: 'utf8' }); console.log(out.trim().split('\n').pop()); } catch (e) { console.error('不通过\n' + (e.stdout || '') + (e.stderr || '')); process.exit(1); } };
run('打包卡片', ['tools/build_cards.js']);
run('打包配置', ['tools/build_config.js']);
run('配置与脚本一致', ['tools/build_config.js', '--check']);
run('规则代码里没有新增常数', ['tools/lint_constants.js', '--check']);
run('配置测试', ['frontend/tests/config_test.js']);
console.log('部署前检查全部通过');
