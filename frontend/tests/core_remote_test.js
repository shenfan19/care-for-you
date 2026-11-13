/* 远程后端说核心接口：握手里的 core，手柄按来源合并，读数按概念对到需求，并被游戏校验。用假的 fetch，不需要真实后端。
   用法：node tests/core_remote_test.js */
const { ctx, CY, G } = require('./harness');
let bad = 0;
const check = (n, c, x) => { if (!c) bad++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };
(async () => {
  CY.i18n.set('zh-CN'); await G.load();
  for (const [arch, name, cond] of [['paternal_grandpa', '爷爷', ['diabetes']], ['mom', '妈妈']]) await G.createPerson({ arch, name, conditions: cond });
  await G.load(); G.world.intro_done = true;
  const R = CY.coreRemote;
  check('握手：只留合法的读数和手柄，mode 不对的丢掉', (() => { const c = R.helloCore({ v: 1, readouts: ['energy_deficit', 7, 'fatigue'], handles: { medication_dose: { mode: 'total' }, activity_load: { mode: 'bogus' } } }); return c && c.readouts.length === 2 && c.handles.medication_dose.mode === 'total' && !('activity_load' in c.handles); })());
  check('握手：版本不对不算声明', R.helloCore({ v: 2, readouts: [] }) === null && R.helloCore(null) === null);
  const core = R.helloCore({ v: 1, readouts: ['energy_deficit', 'glycemic_level'], handles: { medication_dose: { mode: 'total' } } });
  const h = R.handlesFor([{ id: 'medicine', source: 'player' }, { id: 'selfmed', source: 'dispatch' }, { id: 'nothing', source: 'player' }], core);
  check('手柄：动作按映射写入，total 求和，没映射的动作不发', h.length === 1 && h[0].concept === 'medication_dose' && h[0].mode === 'total' && h[0].value === 2);
  check('手柄：后端没声明的手柄不发', R.handlesFor([{ id: 'medicine', source: 'player' }], R.helloCore({ v: 1, readouts: [], handles: {} })).length === 0);
  const pe = G.activePeople()[0], k = Object.keys(pe.state.needs).includes('hunger') ? 'hunger' : Object.keys(pe.state.needs)[0];
  const rd = R.fromReadouts({ [pe.id]: { energy_deficit: 0.25, bogus_concept: 0.5, glycemic_level: 'x', fatigue: 9 }, ghost: { fatigue: 0.5 } }, R.helloCore({ v: 1, readouts: ['energy_deficit', 'glycemic_level', 'fatigue'], handles: {} }));
  const hung = rd.directives.find(d => d.need === 'hunger');
  check('读数：对到需求，水平是 1 减读数，未知概念和不存在的角色丢掉', (!pe.state.needs.hunger || (hung && hung.value === 0.75)) && !rd.directives.some(d => d.person === 'ghost') && rd.directives.every(d => ['hunger', 'rest'].includes(d.need)));
  /* 整条路：假的远程后端声明 core，请求里带手柄，回读数 */
  ctx.AbortController = AbortController; let lastReq = null;
  G.cfg.play.backend_provider = 'http'; G.cfg.play.backend_url = 'http://example.invalid/';
  ctx.fetch = async (url, opt) => {
    const body = JSON.parse(opt.body);
    if (body.kind === 'hello') return { ok: true, json: async () => ({ v: 1, name: 'fake-core', handles: { events: false, strategies: false, lines: false }, core: { v: 1, readouts: ['energy_deficit'], handles: { medication_dose: { mode: 'total' } } } }) };
    lastReq = body; return { ok: true, json: async () => ({ v: 1, directives: [], readouts: { [pe.id]: { energy_deficit: 0.4, fatigue: 2 } } }) };
  };
  CY.backend.caps = null; CY.backend.ensureHello(); await new Promise(r => setTimeout(r, 5));
  check('路由记下了握手里的 core', !!(CY.backend.caps && CY.backend.caps.core && CY.backend.caps.core.handles.medication_dose));
  G.pulse(pe.id, 'medicine', 'player');
  const list = await CY.backend.drive(CY.backend.build('tick', { minutes: 5 }));
  G.applyDirectives(list);
  const mine = lastReq.people.find(p => p.id === pe.id);
  check('请求里带了合并后的手柄', mine && Array.isArray(mine.handles) && mine.handles[0].concept === 'medication_dose' && mine.handles[0].value === 1 && mine.actions[0].source === 'player');
  check('回来的读数生效，并且这个需求算后端在管', !pe.state.needs.hunger || (Math.abs(G.level(pe, 'hunger') - 0.6) < 1e-9 && CY.backend.isDriven(pe.id, 'hunger')));
  check('没在握手里声明的读数被丢弃：fatigue 没声明，休息不被这个后端管', !CY.backend.isDriven(pe.id, 'rest'));
  console.log(bad ? `失败 ${bad} 项` : '全部通过'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
