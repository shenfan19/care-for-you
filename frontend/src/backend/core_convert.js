/* 适配层：把 Care 的一个疾病模型转成共享核心读得懂的两份东西，扁平 LM 模型和 bridge 描述。
   核心不认识游戏，所以模型里读到的游戏环境量，比如 asleep，speed_*，mood_now，n_*，hour，在这里都变成输入变量，由适配层每一步用手柄写入；
   模型自己的需求驱动变量给出 n_ 辅助量和读数。模型文件本身不改。
   返回 null 表示这组模型不适合交给核心，仍由 lm.js 里的旧积分器负责：带 fixed_step_minutes 或 step_scale，或者读了核心给不了的量。
   这个文件只依赖模型文档和人物参数，不依赖积分状态，以后可以整块拿掉重写。 */
(function (CY) {
  const ENV_KNOWN = new Set(['asleep', 'awake', 'age', 'health', 'inpatient', 'is_human', 'is_animal', 'is_plant', 'mood_now', 'mood_offset', 'frailty_vuln']);
  const ENV_PREFIX = /^(n_|speed_|has_)/;
  const SPECIAL = new Set(['mood', 'frailty']);
  const NUM = x => String(Number(x));

  /* ms 是 lm.js 的 Model 列表，person 提供这个人物的参数和驱动，stepMinutes 是核心的内部步长。
     列表里的模型合成一个扁平模型，它们互相按名字读变量，等价于引擎的 imports。只有一个模型时就是单个疾病模型 */
  function convert(ms, person, stepMinutes) {
    const variables = {}, handles = {}, modes = {}, envNames = [], declared = new Set(), auxDoc = {}, equations = {}, inputs = [], states = [];
    const pv = k => (person.params[k] !== undefined ? person.params[k] : undefined);
    const owned = new Set(ms.map(m => m.name));
    for (const m of ms) {
      const doc = m.doc, care = (doc && doc.care) || {};
      if (!doc) return null;
      if (care.fixed_step_minutes || care.step_scale) return null;
      for (const [k, v] of Object.entries(doc.variables || {})) {
        declared.add(k);
        if (v.type === 'input') variables[k] = { type: 'input', value: Number(v.value !== undefined ? v.value : 0) };
        else if (v.type === 'parameter') variables[k] = { type: 'parameter', value: pv(k) !== undefined ? pv(k) : Number(v.value !== undefined ? v.value : 0) };
        else variables[k] = { type: 'state', value: Number(v.value !== undefined ? v.value : 0), bounds: v.bounds };
      }
      for (const k of Object.keys(doc.parameters || {})) { declared.add(k); variables[k] = { type: 'parameter', value: pv(k) !== undefined ? pv(k) : Number(doc.parameters[k]) }; }
      Object.assign(auxDoc, doc.auxiliary || {});
      for (const [k, e] of Object.entries(doc.equations || {})) {
        equations[m.name + '.' + k] = { step_unit: e.step_unit || 'hour', priority: Number(e.priority || 0), dynamics: e.dynamics };
        if (typeof e.condition === 'string') equations[m.name + '.' + k].condition = e.condition;
      }
      for (const k in m.inputs) { inputs.push(k); handles['care_in_' + k] = [k]; }
      states.push(...Object.keys(m.vars));
    }
    const auxNames = new Set(Object.keys(auxDoc));
    /* 这个人物的需求驱动，本组模型管的和别的核心或旧积分器管的 */
    const own = [], foreign = [];
    for (const n in person.drives) (owned.has(person.drives[n].model) ? own : foreign).push(n);
    /* n_ 是压力，等于 1 减水平，心情和虚弱度的 n_ 就是水平本身 */
    const aux = {}, ownN = new Set();
    for (const n of own) {
      const dr = person.drives[n], level = `min(1, max(0, (${dr.state} - ${NUM(dr.lo)}) / (${NUM(dr.hi)} - ${NUM(dr.lo)})))`;
      aux['n_' + n] = SPECIAL.has(n) ? level : `1 - ${level}`; ownN.add('n_' + n);
    }
    const exprs = ms.flatMap(m => [...m.aux.map(a => a[1]), ...m.eqs.map(x => x[2]), ...m.eqs.map(x => x[3]).filter(Boolean)]);
    const free = new Set(); for (const e of exprs) for (const n of e.names) if (!declared.has(n) && !auxNames.has(n) && !ownN.has(n) && n !== 'step') free.add(n);
    /* need_max：所有需求压力的最大值，别的核心管的需求压力由适配层写进来，不在驱动里的需求压力是 _other_max */
    if (free.delete('need_max')) {
      const terms = ['_other_max'];
      free.add('_other_max');
      for (const n of own) if (!SPECIAL.has(n)) terms.push('n_' + n);
      for (const n of foreign) if (!SPECIAL.has(n)) { terms.push('n_' + n); free.add('n_' + n); }
      aux.need_max = `max(0, ${terms.join(', ')})`;
    }
    Object.assign(aux, auxDoc);
    for (const n of free) {
      if (n === 'hour') { variables.hour = { type: 'input', value: 0 }; handles.care_env_hour = ['hour']; envNames.push('hour'); }
      else if (pv(n) !== undefined) variables[n] = { type: 'parameter', value: pv(n) };
      else if (n === '_other_max' || ENV_KNOWN.has(n) || ENV_PREFIX.test(n)) { variables[n] = { type: 'input', value: n.startsWith('speed_') ? 1 : 0 }; handles['care_env_' + n] = [n]; envNames.push(n); }
      else {
        /* 这个人物没有启用的模型里的变量，在积分器里是不变的初值：状态取当前值，辅助量取 0。别的核心管的变量读不到，这组模型就留给旧积分器 */
        const holder = person.lib.models.find(m => !owned.has(m.name) && (n in m.vars || n in m.inputs || m.aux.some(a => a[0] === n)));
        if (!holder || person.active.has(holder.name)) return null;
        variables[n] = { type: 'parameter', value: n in holder.vars ? person.state[n] : n in holder.inputs ? holder.inputs[n].value : 0 };
      }
    }
    for (const c in handles) modes[c] = 'level';
    const readouts = {};
    for (const n of own) { const dr = person.drives[n]; readouts[n] = { sources: [{ var: dr.state, lo: dr.lo, hi: dr.hi }] }; }
    const name = ms.map(m => m.name).join('+');
    const model = { metadata: { name, lm_format_version: '1.0' }, variables, auxiliary: aux, equations, simulation: { step_size: { value: stepMinutes, unit: 'minute' } } };
    const bridge = { bridge_version: 1, system: name, step_minutes: stepMinutes, handles, modes, readouts };
    return { model, bridge, envNames, inputs, states };
  }
  CY.coreConvert = { convert };
})(globalThis.CY = globalThis.CY || {});
