/* 适配层：需求与心情的涨落交给共享 LM 核心。模型在 data/lm/rates/needs_rates.yaml，是通用的 LM 格式，没有游戏的数。
   速率、上限、斜率这些随角色和时段变的量，由游戏层算好，经这里用手柄写进核心；需求和心情的当前值由游戏赋值进核心，因为游戏里动作、
   自己动手、事件都会直接改它们，这是游戏赋值模块允许的一类。核心没有载入时 ready 为 false，游戏用自己的老算法。 */
(function (CY) {
  const HERE = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : null;
  const N = CY.coreNeeds = { names: new Set(), units: {}, flat: null, cfg: null, error: null };
  /* 浏览器里动态载入共享核心，测试环境由 harness 提前放好 */
  N.boot = async () => { if (!CY.LMCore && HERE) CY.LMCore = (await import(new URL('core_runtime/index.js', HERE).href)).LMCore; };
  if (HERE) N.boot().catch(e => { N.error = String(e && e.message || e); });
  N.ready = () => {
    if (!CY.LMCore || N.error) return false;
    if (N.flat) return true;
    try {
      const T = CY.game.T(), doc = jsyaml.load(T['templates/lm/rates/needs_rates.yaml']), cfg = jsyaml.load(T['templates/lm/adapter_config.yaml']);
      const handles = {}, modes = {}, inputs = [], states = [];
      for (const [k, v] of Object.entries(doc.variables)) {
        if (v.type === 'input') { inputs.push(k); handles['care_in_' + k] = [k]; modes['care_in_' + k] = 'level'; } else states.push(k);
      }
      for (const k of states) if (k.startsWith('p_')) N.names.add(k.slice(2));
      const step = cfg.needs_step_minutes;
      doc.simulation = { step_size: { value: step, unit: 'minute' } };
      N.flat = { model: doc, bridge: { bridge_version: 1, system: doc.metadata.name, step_minutes: step, handles, modes, readouts: {} }, inputs, states };
      return true;
    } catch (e) { N.error = String(e && e.message || e); return false; }
  };
  N.has = k => N.names.has(k);
  const unit = pid => {
    let u = N.units[pid];
    if (!u) { u = N.units[pid] = { core: new CY.LMCore({ model: N.flat.model, bridge: N.flat.bridge }) }; u.core.init({ v: 1, kind: 'init', subjects: [{ id: pid, preset: null }] }); }
    return u.core;
  };
  /* v: { needs: 压力表，rates，caps，mood，mood_on，slope，relax，shift，other_max }。返回推进后的 { needs, mood } */
  N.advance = (pid, minutes, v) => {
    const core = unit(pid), cur = core.variables(pid), diff = {};
    for (const k of N.names) { const x = v.needs[k] === undefined ? 0 : v.needs[k]; if (cur['p_' + k] !== x) diff['p_' + k] = x; }
    if (cur.mood_v !== v.mood) diff.mood_v = v.mood;
    if (Object.keys(diff).length) CY.coreAssign.set(core, pid, diff, 'game');
    const put = { mood_on: v.mood_on, mood_slope: v.slope, mood_relax: v.relax, mood_shift: v.shift, other_max: v.other_max };
    for (const k of N.names) { put['rate_' + k] = v.rates[k] || 0; put['cap_' + k] = v.caps[k] === undefined ? 1 : v.caps[k]; }
    core.step({ v: 1, kind: 'step', minutes, subjects: [{ id: pid, handles: N.flat.inputs.map(k => ({ concept: 'care_in_' + k, mode: 'level', value: put[k] })) }] });
    const now = core.variables(pid), needs = {};
    for (const k of Object.keys(v.needs)) if (N.names.has(k)) needs[k] = now['p_' + k];
    return { needs, mood: now.mood_v };
  };
  N.forget = pid => { delete N.units[pid]; };
})(globalThis.CY = globalThis.CY || {});
