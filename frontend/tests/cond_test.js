/* 疾病模型测试：引擎对 LM 格式的扩展（condition 条件，minute 与 day 单位，日程窗口，脉冲，预设，读数，效果），
   四个手写疾病模型的数值，以及它们接进游戏之后的通路（动作变成脉冲，快照带病情设置，读数能在状态窗口读到）。
   用法：node tests/cond_test.js */
const { loadLm, person, run, carePolicy } = require('./cond_sim');
let fails = 0;
const check = (n, c, x) => { if (!c) fails++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

function synthetic(extraYaml) {
  const vm = require('vm'), fs = require('fs'), path = require('path');
  const ctx = vm.createContext({ console, Math, JSON, Promise });
  ctx.globalThis = ctx;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../vendor/js-yaml.min.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/backend/lm.js'), 'utf8'), ctx);
  const y = ctx.jsyaml, CY = ctx.CY;
  CY.lm.build([['t.yaml', y.load(extraYaml)]], { version: 1, kinds: { human: 'human' }, classes: { organism: { params: {} }, human: { params: {} }, human_adult: { params: {} } }, conditions: {} });
  return CY.lm;
}

/* ---------- 引擎对 LM 格式的支持 ---------- */
{
  /* minute 单位：x 每步加输入，输入是 60 g 在 30 分钟里给完，总量应是 60 */
  const lm = synthetic(`
metadata: { name: t, condition: tc }
variables:
  x: { value: 0, type: state, bounds: [0, 1000] }
  y: { value: 0, type: state, bounds: [0, 1000] }
  din: { value: 0, type: input }
equations:
  e1: { step_unit: minute, priority: 2, dynamics: { x: "x + din * step" } }
  e2: { step_unit: minute, priority: 1, condition: "x > 30", dynamics: { y: "y + step" } }
care:
  max_step_minutes: 1
  schedule: [ { var: din, hour: 8, minutes: 30, value: 60 } ]
`);
  const snap = person(['tc']); snap.needs = {};
  const res = run(lm, snap, 1, null, 3);
  const last = lm.engineCond.people.p1.state;
  check('日程里的总量在窗口内给完，minute 单位下累计等于 value', near(last.x, 60, 0.5), 'x=' + last.x.toFixed(2));
  check('方程的 condition 为假时不执行', last.y > 0 && last.y < 24 * 60 - 1, 'y=' + last.y.toFixed(1));
  const lm2 = synthetic(`
metadata: { name: t, condition: tc }
variables:
  d: { value: 0, type: state, bounds: [0, 1000] }
equations:
  e1: { step_unit: day, dynamics: { d: "d + step" } }
`);
  const s2 = person(['tc']); s2.needs = {}; run(lm2, s2, 2, null, 10);
  check('day 单位的步长是以天计', near(lm2.engineCond.people.p1.state.d, 2, 0.01), 'd=' + lm2.engineCond.people.p1.state.d.toFixed(3));
  /* 脉冲 add 与窗口 */
  const lm3 = synthetic(`
metadata: { name: t, condition: tc }
variables:
  a: { value: 0, type: state, bounds: [0, 10] }
  w: { value: 0, type: state, bounds: [0, 1000] }
  win: { value: 0, type: input }
equations:
  e1: { step_unit: hour, dynamics: { w: "w + win * step" } }
care:
  pulses:
    go: [ { var: a, add: 2.5 }, { var: win, total: 8, minutes: 60 } ]
`);
  const s3 = person(['tc']); s3.needs = {};
  run(lm3, s3, 1, (dm) => (dm === 600 ? ['go'] : []), 2);
  const st3 = lm3.engineCond.people.p1.state;
  check('脉冲 add 直接加到状态上', near(st3.a, 2.5, 1e-9));
  check('脉冲窗口把 total 在 minutes 内给完', near(st3.w, 8, 0.2), 'w=' + st3.w.toFixed(2));
  const lm4 = synthetic(`
metadata: { name: t, condition: tc }
parameters: { k: 1.0 }
variables:
  v: { value: 0, type: state, bounds: [0, 100] }
equations:
  e1: { step_unit: hour, dynamics: { v: "v + step * k" } }
care:
  default_preset: slow
  presets: { slow: { params: { k: 0.5 } }, fast: { params: { k: 2.0 }, state: { v: 10 } } }
`);
  const s4 = person(['tc'], { cond_set: { tc: { severity: 'fast' } } }); s4.needs = {}; run(lm4, s4, 1, null, 10);
  const v1 = lm4.engineCond.people.p1.state.v;
  const s5 = person(['tc'], { id: 'p2' }); s5.needs = {}; run(lm4, s5, 1, null, 10);
  check('预设覆盖参数和初始状态，没选就用默认档', near(v1, 10 + 48, 0.01) && near(lm4.engineCond.people.p2.state.v, 12, 0.01), v1 + ' ' + lm4.engineCond.people.p2.state.v);
}

/* ---------- 四个手写疾病模型 ---------- */
const lm = loadLm();
check('四个疾病模型都已载入', ['diabetes', 'hypertension', 'arthritis', 'depress'].every(c => lm.lib.modelsOfCondition(c).length === 1));
check('每个疾病模型都有三档预设、读数和故事', lm.lib.condModels.every(m => Object.keys(m.presets).length === 3 && m.readouts.length >= 1 && m.story && m.story.intro && m.story.intro_en));
check('不带病的人完全不被疾病引擎碰', (() => { const s = person([]); const r = lm.engineCond.drive({ minutes: 5, world: { hour: 9 }, people: [s] }); return !r.directives.length && !Object.keys(r.drives).length; })());

{
  const a = run(lm, person(['diabetes']), 2, carePolicy, 2).pop().ro[0].live;
  lm.engineCond.people = {};
  const b = run(lm, person(['diabetes']), 2, carePolicy, 2).pop().ro[0].live;
  check('同样的开局同样的作息，结果一致', a === b, a.toFixed(3) + ' ' + b.toFixed(3));
}
{
  lm.engineCond.people = {};
  const res = run(lm, person(['diabetes']), 3, carePolicy, 2);
  const g = res.map(r => r.ro[0].live), day3 = g.slice(-720);
  const fasting = Math.min(...day3), peak = Math.max(...day3);
  check('糖尿病中等档：空腹在 100 到 160，餐后峰值比空腹高 30 以上', fasting > 100 && fasting < 160 && peak > fasting + 30, `空腹 ${fasting.toFixed(0)} 峰值 ${peak.toFixed(0)}`);
  check('糖尿病：没测过之前读数不显示，测过之后显示', res[100].ro[0].value === null && res.slice(-1)[0].ro[0].value !== null);
  const avg = k => { lm.engineCond.people = {}; return run(lm, person(['diabetes'], { cond_set: { diabetes: { severity: k } } }), 7, null, 4).pop().ro[1].live; };
  const mild = avg('mild'), adv = avg('advanced');
  check('糖尿病：病情档越重，三天平均越高', mild < adv - 15, `轻 ${mild.toFixed(0)} 重 ${adv.toFixed(0)}`);
  lm.engineCond.people = {};
  const careAvg = run(lm, person(['diabetes']), 7, carePolicy, 4).pop().ro[1].live;
  lm.engineCond.people = {};
  const neglectAvg = run(lm, person(['diabetes']), 7, null, 4).pop().ro[1].live;
  check('糖尿病：按时吃药测糖比什么都不做，平均血糖更低', careAvg < neglectAvg - 10, `照顾 ${careAvg.toFixed(0)} 不管 ${neglectAvg.toFixed(0)}`);
  lm.engineCond.people = {};
  const withPill = run(lm, person(['diabetes']), 1, (dm) => (dm === 360 ? ['medicine'] : []), 2);
  lm.engineCond.people = {};
  const noPill = run(lm, person(['diabetes']), 1, null, 2);
  check('吃药当天上午的血糖比没吃的低', withPill[420].ro[0].live < noPill[420].ro[0].live - 3, `吃药 ${withPill[420].ro[0].live.toFixed(0)} 没吃 ${noPill[420].ro[0].live.toFixed(0)}`);
  lm.engineCond.people = {};
  const heavy = run(lm, person(['diabetes']), 1, (dm) => (dm === 1020 ? ['carb_heavy'] : []), 2);
  lm.engineCond.people = {};
  const light = run(lm, person(['diabetes']), 1, (dm) => (dm === 1020 ? ['carb_low'] : []), 2);
  const at = (r, h) => r[Math.round(h * 30)].ro[0].live;
  check('晚饭选重口味（红烧肉）比选清淡（杂粮粥）餐后血糖高', at(heavy, 19.3) > at(light, 19.3) + 25, `红烧肉 ${at(heavy, 19.3).toFixed(0)} 杂粮粥 ${at(light, 19.3).toFixed(0)}`);
  check('血糖始终在合理范围', g.every(v => v >= 70 && v <= 400));
}
{
  lm.engineCond.people = {};
  const base = run(lm, person(['hypertension']), 2, null, 4).pop().ro[0].live;
  lm.engineCond.people = {};
  const salty = run(lm, person(['hypertension']), 2, (dm, d) => (dm === 1080 && d === 1 ? ['salt_high'] : []), 4).pop().ro[0].live;
  const res = run(lm, person(['hypertension'], { id: 'p3' }), 2, carePolicy, 4);
  check('高血压：量过血压才显示读数', res[5].ro.find(r => r.id === 'bp').value === null && res.pop().ro.find(r => r.id === 'bp').value !== null);
  check('高血压：重口味后的血压偏高', salty > base, `重口 ${salty.toFixed(1)} 平常 ${base.toFixed(1)}`);
}
{
  lm.engineCond.people = {};
  const noHeat = run(lm, person(['arthritis']), 2, null, 4);
  lm.engineCond.people = {};
  const heat = run(lm, person(['arthritis']), 2, (dm) => (dm === 600 || dm === 660 ? ['heat'] : []), 4);
  const painAfter = r => r[Math.round(11 * 15)].snap.needs.joint;
  check('关节炎：热敷之后疼痛的需求涨得更慢', painAfter(heat) < painAfter(noHeat) - 0.05, `热敷 ${painAfter(heat).toFixed(2)} 不理 ${painAfter(noHeat).toFixed(2)}`);
  check('关节炎：发作程度每天有固定节奏，周期内会变', new Set(noHeat.map(r => Math.round(r.ro[0].live * 10))).size > 3);
}
{
  lm.engineCond.people = {};
  const lonely = run(lm, person(['depress']), 2, null, 4).pop();
  lm.engineCond.people = {};
  const held = run(lm, person(['depress']), 2, (dm) => (dm === 600 || dm === 840 || dm === 1080 ? ['listen'] : []), 4).pop();
  check('情绪低落：有人陪着听，低落的程度比不管时低', held.ro[0].live > lonely.ro[0].live, `陪 ${held.ro[0].live.toFixed(2)} 不管 ${lonely.ro[0].live.toFixed(2)}`);
}
{
  /* 不同步长结果一致：2 分钟一步对 30 分钟一步 */
  const at = step => { lm.engineCond.people = {}; return run(lm, person(['diabetes']), 2, carePolicy, step).pop().ro[1].live; };
  check('步长不影响结果：2 分钟一步和 30 分钟一步的三天平均相差不到 3%', near(at(2), at(30), at(2) * 0.03), at(2).toFixed(1) + ' ' + at(30).toFixed(1));
}
{
  /* 同时有糖尿病和高血压：共用的药需求不冲突，两个模型都在算 */
  lm.engineCond.people = {};
  const both = run(lm, person(['diabetes', 'hypertension']), 3, carePolicy, 4).pop();
  check('糖尿病加高血压：两个模型的读数都在', both.ro.some(r => r.cond === 'diabetes') && both.ro.some(r => r.cond === 'hypertension'));
}

/* ---------- 从 LM 转换来的疾病包：Care 的引擎和转换插件的参考评估器逐点对照 ----------
   fixtures/lm_pack 由 Life Matters 仓库的 plugins/care_export 生成：
   python backend.py recipes/diabetes.yaml recipes/hypertension_gout.yaml --models <models> --out <本目录>
   expected.json 是同一个插件的 simulate 在同样的开局和同样的动作下的结果。 */
{
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const fx = path.join(__dirname, 'fixtures/lm_pack'), exp = JSON.parse(fs.readFileSync(path.join(fx, 'expected.json'), 'utf8'));
  const ctx = vm.createContext({ console, Math, JSON, Promise }); ctx.globalThis = ctx;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../vendor/js-yaml.min.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/backend/lm.js'), 'utf8'), ctx);
  const y = ctx.jsyaml, CY = ctx.CY, base = path.join(__dirname, '../src/data/lm');
  const docs = fs.readdirSync(base).filter(f => /^cond_.*\.yaml$/.test(f)).map(f => [f, y.load(fs.readFileSync(path.join(base, f), 'utf8'))]);
  for (const f of fs.readdirSync(path.join(fx, 'templates/lm/models'))) docs.push([f, y.load(fs.readFileSync(path.join(fx, 'templates/lm/models', f), 'utf8'))]);
  const classes = { version: 1, kinds: { human: 'human' }, classes: { organism: { params: {} }, human: { params: {} }, human_elder: { params: {} } }, conditions: {} };
  CY.lm.build(docs, classes);
  check('转换来的模型取代同病的手写模型', CY.lm.lib.modelsOfCondition('diabetes').map(m => m.name).join() === 'cond_diabetes_lm', CY.lm.lib.modelsOfCondition('diabetes').map(m => m.name).join());
  check('转换来的新疾病可以载入', CY.lm.lib.modelsOfCondition('htn_gout').length === 1);
  for (const cid of Object.keys(exp)) {
    const e = exp[cid], m = CY.lm.lib.modelsOfCondition(cid)[0];
    const snap = { id: 'q-' + cid, species: 'human', stage: 'elder', age: 70, mood: 0.7, frailty: 0.2, needs: { hunger: 0.2, medicine: 0.3, sugar: 0.2, bp: 0.2, lab: 0.2 }, conditions: [cid], cond_set: {}, flags: {}, sleeping: false, rate_mult: {}, pulses: [] };
    const eng = CY.lm.engineCond, rows = [];
    for (let h = 0; h < e.hours; h++) {
      snap.pulses = e.pulses.some(p => Math.floor(p[0]) === h) ? e.pulses.filter(p => Math.floor(p[0]) === h).map(p => p[1]) : [];
      eng.drive({ minutes: 60, world: { hour: (h + 1) % 24, date: { weekday: Math.floor(h / 24) % 7 + 1 } }, people: [snap] });
      if ((h + 1) % 12 === 0) rows.push(Object.assign({}, eng.people[snap.id].state));
    }
    let worst = 0, where = '';
    rows.forEach((st, i) => { for (const k in e.series) { if (k.includes('_need_')) continue; const a = st[k], b = e.series[k][i]; const rel = Math.abs(a - b) / (Math.abs(b) + 1e-6); if (rel > worst) { worst = rel; where = `${k}@${(i + 1) * 12}h ${a} vs ${b}`; } } });
    check(`${cid}：Care 引擎和转换插件的评估器在 ${e.hours} 小时内逐点一致`, rows.length === e.t.length && worst < 1e-6, `最大相对差 ${worst.toExponential(2)} ${where}`);
  }
  const eng2 = CY.lm.engineCond, snapH = { id: 'h1', species: 'human', stage: 'elder', age: 70, mood: 0.7, frailty: 0.2, needs: { hunger: 0.2, medicine: 0.3, bp: 0.2, lab: 0.2 }, conditions: ['htn_gout'], cond_set: { htn_gout: { severity: 'advanced' } }, flags: {}, sleeping: false, rate_mult: {}, pulses: ['bp', 'labtest'] };
  eng2.drive({ minutes: 60, world: { hour: 9 }, people: [snapH] });
  const ro = CY.lm.readouts('h1');
  check('转换来的模型有读数，测过之后才显示', ro.length === 2 && ro.every(r => r.value === null || r.reveal_by.length), JSON.stringify(ro.map(r => [r.id, r.value])));
}

/* ---------- 接进游戏 ---------- */
(async () => {
  const { ctx, CY, G } = require('./harness');
  CY.i18n.set('zh-CN'); await G.load();
  await G.createPerson({ arch: 'paternal_grandpa', name: '爷爷', conditions: ['diabetes'], cond_set: { diabetes: { severity: 'advanced' } } });
  await G.createPerson({ arch: 'mom', name: '妈妈' });
  await G.load(); await CY.lm.load();
  const gp = G.people.find(p => p.person.name === '爷爷'), mom = G.people.find(p => p.person.name === '妈妈');
  check('病情设置存进角色文件并随快照发出', gp.person.cond_set.diabetes.severity === 'advanced' && CY.protocol.person(gp).cond_set.diabetes.severity === 'advanced');
  check('疾病模型默认开着，有病的人才被积分', CY.ini.bool(G.cfg, 'play', 'condition_models'));
  let req = CY.backend.build('tick', { minutes: 5 });
  CY.backend.drive(req);
  check('带模型的病会声明替这个人算 sugar 需求', CY.backend.isDriven(gp.id, 'sugar') && !CY.backend.isDriven(mom.id, 'sugar') && !CY.backend.isDriven(gp.id, 'hunger'));
  check('读数在状态窗口可取', CY.lm.readouts(gp.id).length >= 2 && CY.lm.readouts(mom.id).length === 0);
  G.perform(gp.id, 'sugar');
  req = CY.backend.build('tick', { minutes: 1 });
  const snapGp = req.people.find(s => s.id === gp.id);
  check('做过的动作变成脉冲带进下一次快照，取一次就清空', snapGp.pulses.includes('sugar') && CY.backend.build('tick', { minutes: 1 }).people.find(s => s.id === gp.id).pulses.length === 0);
  CY.backend.drive(req);
  const rd = CY.lm.readouts(gp.id).find(r => r.id === 'glucose');
  check('测过血糖后读数出现', rd && rd.value !== null && rd.word, rd && rd.value !== null ? rd.value.toFixed(0) + ' ' + rd.word : '');
  /* 疾病包 zip 能从导入对话框的路径导入：只有模板，认作 pack，写进模板，游戏载入后有新疾病和取代关系 */
  const zbuf = require('fs').readFileSync(require('path').join(__dirname, 'fixtures/lm_pack/careforyou-disease-pack.zip'));
  const info = await CY.archive.inspect(zbuf.buffer.slice(zbuf.byteOffset, zbuf.byteOffset + zbuf.byteLength));
  check('疾病包 zip 被认作 pack，列出疾病', info.ok && info.kind === 'pack' && info.conditions.includes('htn_gout') && info.conditions.includes('diabetes'), JSON.stringify(info.conditions));
  await CY.archive.apply(info, 'merge');
  CY.lm.ready = false; await G.load(); await CY.lm.load();
  check('导入后游戏有新疾病，转换来的糖尿病模型取代手写的', !!G.tpl.conditions.htn_gout && CY.lm.lib.modelsOfCondition('diabetes').map(m => m.name).join() === 'cond_diabetes_lm');
  G.cfg.play.condition_models = 'false';
  CY.backend.drive(CY.backend.build('tick', { minutes: 5 }));
  check('关掉设置后游戏退回概率表，不再声明', !CY.backend.isDriven(gp.id, 'sugar'));
  console.log(fails ? `\n${fails} 项失败` : '\n全部通过');
  process.exit(fails ? 1 : 0);
})();
