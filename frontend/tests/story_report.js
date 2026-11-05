/* 把所有故事场景跑一遍，汇总成一份给人审核的文档。
   用法：node tests/story_report.js [输出路径]，默认写到 tests/temp_story_report.md（temp_ 开头的文件不进版本库）。
   每个场景是一个单独的进程，随机数种子和假时钟固定，结果可复现。有任何一条校验不通过，退出码为 1。 */
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const outPath = process.argv[2] || path.join(__dirname, 'temp_story_report.md');
const run = (...a) => execFileSync(process.execPath, [path.join(__dirname, 'story_run.js'), ...a], { encoding: 'utf8', maxBuffer: 1 << 24 });
const list = JSON.parse(run('list').trim().split('\n').pop());
const results = [];
for (const s of list) {
  process.stdout.write(s.id + ' ... ');
  let r;
  try { const txt = run(s.id); r = JSON.parse(txt.split('\n').filter(l => l.startsWith('STORY ')).pop().slice(6)); } catch (e) { r = { id: s.id, title: s.title, claim: s.claim, steps: [], log: [], checks: [], notes: [], error: String(e.message).slice(0, 400) }; }
  const bad = r.checks.filter(c => !c.ok).length + (r.error ? 1 : 0);
  console.log(bad ? '有 ' + bad + ' 条不通过' : '通过');
  results.push(r);
}
const total = results.reduce((a, r) => a + r.checks.length, 0), fail = results.reduce((a, r) => a + r.checks.filter(c => !c.ok).length + (r.error ? 1 : 0), 0);
const md = [];
md.push('# 故事校验记录', '');
md.push('每个场景是一段能讲出来的家里的事。游戏真的跑一遍，下面的"游戏里写出的记录"是游戏自己写的原文，"校验"是自动核对的结果。随机数种子和钟点固定，同样的代码每次结果一样。', '');
md.push(`共 ${results.length} 个场景，${total} 条校验，${fail ? fail + ' 条不通过' : '全部通过'}。`, '');
md.push('## 总览', '', '| 场景 | 你的要求 | 结果 |', '| --- | --- | --- |');
results.forEach((r, i) => md.push(`| ${i + 1} ${r.title} | ${r.claim} | ${r.error ? '出错' : r.checks.every(c => c.ok) ? '通过' : '有不通过'} |`));
md.push('');
results.forEach((r, i) => {
  md.push(`## ${i + 1} ${r.title}`, '', `- 要求：${r.claim}`);
  if (r.error) md.push(`- 出错：${r.error}`);
  if (r.steps.length) { md.push('- 过程：'); r.steps.forEach(s => md.push(`  - ${s}`)); }
  if (r.log.length) { md.push('', '游戏里写出的记录：', '', '```'); r.log.forEach(l => md.push(l)); md.push('```'); }
  md.push('', '校验：');
  r.checks.forEach(c => md.push(`- ${c.ok ? '通过' : '不通过'}：${c.name}${c.detail ? '（' + c.detail + '）' : ''}`));
  if (r.notes.length) { md.push('', '需要你审的：'); r.notes.forEach(n => md.push(`- ${n}`)); }
  md.push('');
});
fs.writeFileSync(outPath, md.join('\n'), 'utf8');
console.log(`已写 ${outPath}：${results.length} 个场景，${total} 条校验，${fail} 条不通过`);
process.exit(fail ? 1 : 0);
