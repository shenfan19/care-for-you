/* 适配层：把 Care 的一个疾病模型转成共享核心读得懂的两份东西，扁平 LM 模型和 bridge 描述。
   核心不认识游戏，所以模型里读到的游戏环境量，比如 asleep，speed_*，mood_now，n_*，hour，在这里都变成输入变量，由适配层每一步用手柄写入；
   模型自己的需求驱动变量给出 n_ 辅助量和读数。模型文件本身不改。
   返回 null 表示这个模型不适合交给核心，仍由 lm.js 里的旧积分器负责：带 fixed_step_minutes 或 step_scale，或者读了核心给不了的量。
   这个文件只依赖模型文档和人物参数，不依赖积分状态，以后可以整块拿掉重写。 */
(function (CY) {
  const ENV_KNOWN = new Set(['asleep', 'awake', 'age', 'health', 'inpatient', 'is_human', 'is_animal', 'is_plant', 'mood_now', 'mood_offset', 'frailty_vuln']);
  const ENV_PREFIX = /^(n_|speed_|has_)/;
  const SPECIAL = new Set(['mood', 'frailty']);
  const NUM = x => String(Number(x));

  /* m 是 lm.js 的 Model，person 提供这个人物的参数和驱动，stepMinutes 是核心的内部步长 */
  function convert(m, person, stepMinutes) {
    const doc = m.doc, care = (doc && doc.care) || {};
    if (!doc || !m.condition) return null;
    if (care.fixed_step_minutes || care.step_scale) return null;
    const variables = {}, handles = {}, modes = {}, envNames = [];
    const declared = new Set();
    const pv = k => (person.params[k] !== undefined ? person.params[k] : undefined);
    for (const [k, v] of Object.entries(doc.variables || {})) {
      declared.add(k);
      if (v.type === 'input') variables[k] = { type: 'input', value: Number(v.value !== undefined ? v.value : 0) };
      else if (v.type === 'parameter') variables[k] = { type: 'parameter', value: pv(k) !== undefined ? pv(k) : Number(v.value !== undefined ? v.value : 0) };
      else variables[k] = { type: 'state', value: Number(v.value !== undefined ? v.value : 0), bounds: v.bounds };
    }
    for (const k of Object.keys(doc.parameters || {})) { declared.add(k); variables[k] = { type: 'parameter', value: pv(k) !== undefined ? pv(k) : Number(doc.parameters[k]) }; }
    const auxDoc = doc.auxiliary || {}, auxNames = new Set(Object.keys(auxDoc));
    /* 模型自己的需求驱动：n_ 是压力，等于 1 减水平，心情和虚弱度的 n_ 就是水平本身。只对这个人物真的有这个驱动的情形成立 */
    const aux = {};
    const ownN = {};
    for (const n in m.drives) {
      const dr = person.drives[n]; if (!dr || dr.model !== m.name) continue;
      const level = `min(1, max(0, (${dr.state} - ${NUM(dr.lo)}) / (${NUM(dr.hi)} - ${NUM(dr.lo)})))`;
      aux['n_' + n] = SPECIAL.has(n) ? level : `1 - ${level}`; ownN['n_' + n] = true;
    }
    Object.assign(aux, auxDoc);
    /* 表达式里读到、模型没有声明的名字 */
    const exprs = [...m.aux.map(a => a[1]), ...m.eqs.map(x => x[2]), ...m.eqs.map(x => x[3]).filter(Boolean)];
    const free = new Set(); for (const e of exprs) for (const n of e.names) if (!declared.has(n) && !auxNames.has(n) && !(n in ownN) && n !== 'step') free.add(n);
    for (const n of free) {
      if (n === 'hour') { variables.hour = { type: 'input', value: 0 }; handles.care_env_hour = ['hour']; envNames.push('hour'); }
      else if (pv(n) !== undefined) variables[n] = { type: 'parameter', value: pv(n) };
      else if (ENV_KNOWN.has(n) || ENV_PREFIX.test(n)) { variables[n] = { type: 'input', value: n.startsWith('speed_') ? 1 : 0 }; handles['care_env_' + n] = [n]; envNames.push(n); }
      else return null;
    }
    const inputs = [];
    for (const k in m.inputs) { inputs.push(k); handles['care_in_' + k] = [k]; }
    for (const c in handles) modes[c] = 'level';
    const equations = {};
    for (const [k, e] of Object.entries(doc.equations || {})) {
      equations[k] = { step_unit: e.step_unit || 'hour', priority: Number(e.priority || 0), dynamics: e.dynamics };
      if (typeof e.condition === 'string') equations[k].condition = e.condition;
    }
    const readouts = {};
    for (const n in m.drives) { const dr = m.drives[n]; if (person.drives[n] === dr) readouts[n] = { sources: [{ var: dr.state, lo: dr.lo, hi: dr.hi }] }; }
    const model = { metadata: { name: m.name, lm_format_version: '1.0' }, variables, auxiliary: aux, equations, simulation: { step_size: { value: stepMinutes, unit: 'minute' } } };
    const bridge = { bridge_version: 1, system: m.name, step_minutes: stepMinutes, handles, modes, readouts };
    return { model, bridge, envNames, inputs, states: Object.keys(m.vars) };
  }
  CY.coreConvert = { convert };
})(globalThis.CY = globalThis.CY || {});
