/* 浏览器里跑的数值积分后端：把每个角色的需求，心情，虚弱度当作 LM 风格模型的状态变量，在页面里直接积分，不需要任何服务进程。
   模型文件是数据文件夹 templates/lm 下的明文 YAML：models 里一个文件一个模型，classes.yaml 是类的派生。
   方程是 Python 语法的表达式字符串，和 Life Matters 引擎的写法一致，这里用一个小的解析器求值，不用 eval。
   设置里 backend_provider 选 lm 就用它。它只管积分，事件，台词，谁向谁求助仍由内置后端管。
   疾病模型：模型文件的 metadata.condition 写疾病编号，只对得这个病的角色启用；方程可以带 condition 条件，step_unit 支持 minute，hour，day，
   这样 Life Matters 的疾病模型转换后几乎原样可跑。care 段是游戏侧的扩展：pulses 动作和选择带来的输入，schedule 每天固定时刻的输入，
   presets 病情轻重，readouts 界面上观察的读数，effects 对心情和虚弱度的缓慢作用，step_scale 让慢过程在游戏里按倍数加快。
   variables 里 type 为 parameter 的当作参数。
   设置里 play.condition_models 为 true 时，即使后端选的是 builtin，也只为带疾病模型的角色积分疾病部分，其余仍由内置后端管。 */
(function (CY) {
  const HERE = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : null;   /* 动态 import 的相对路径要从这个脚本算 */
  const LM = CY.lm = { ready: false, error: null, lib: null, engine: null, loading: false };
  const MAX_SUBSTEP_H = 0.25, MAX_SUBSTEPS = 720, RESYNC_EPS = 0.004, CORE_STEP_MIN = 5;   /* 快照里的数保留四位小数，比这大的差就是游戏自己动了它 */
  const FUNCS = { min: Math.min, max: Math.max, abs: Math.abs, exp: Math.exp, log: Math.log, sqrt: Math.sqrt, pow: Math.pow, floor: Math.floor, tanh: Math.tanh, sin: Math.sin, cos: Math.cos };
  const pymod = (a, b) => a - b * Math.floor(a / b);

  /* ---------- 表达式：词法，递归下降，编译成闭包 ---------- */
  const TOKEN = /\s*(?:(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+)|([A-Za-z_]\w*)|(\*\*|<=|>=|==|!=|[-+*/%(),<>]))/y;
  function tokenize(src, where) {
    const out = []; TOKEN.lastIndex = 0; const s = String(src).trim();
    while (TOKEN.lastIndex < s.length) {
      const at = TOKEN.lastIndex, m = TOKEN.exec(s);
      if (!m) throw new Error(`${where}: 表达式里有不认识的字符，位置 ${at}: ${s}`);
      out.push(m[1] !== undefined ? { t: 'num', v: parseFloat(m[1]) } : m[2] !== undefined ? { t: 'name', v: m[2] } : { t: 'op', v: m[3] });
    }
    return out;
  }
  function compile(src, where) {
    const toks = tokenize(src, where), names = new Set(); let i = 0;
    const peek = () => toks[i], isOp = v => toks[i] && toks[i].t === 'op' && toks[i].v === v, isKw = v => toks[i] && toks[i].t === 'name' && toks[i].v === v;
    const fail = m => { throw new Error(`${where}: ${m}: ${src}`); };
    const look = (env, k) => { const v = env[k]; if (v !== undefined) return v; if (k.startsWith('speed_')) return 1; if (k.startsWith('n_') || k.startsWith('has_')) return 0; throw new Error(`${where}: 没有变量 ${k}`); };
    function expr() {
      const a = orTest();
      if (isKw('if')) { i++; const c = orTest(); if (!isKw('else')) fail('三元式缺 else'); i++; const b = expr(); return env => (c(env) ? a(env) : b(env)); }
      return a;
    }
    function orTest() { let a = andTest(); while (isKw('or')) { i++; const l = a, r = andTest(); a = env => { const x = l(env); return x ? x : r(env); }; } return a; }
    function andTest() { let a = notTest(); while (isKw('and')) { i++; const l = a, r = notTest(); a = env => { const x = l(env); return x ? r(env) : x; }; } return a; }
    function notTest() { if (isKw('not')) { i++; const a = notTest(); return env => (a(env) ? 0 : 1); } return comparison(); }
    function comparison() {
      let a = arith(); const parts = [];
      while (peek() && peek().t === 'op' && ['<', '<=', '>', '>=', '==', '!='].includes(peek().v)) { const op = toks[i++].v; parts.push([op, arith()]); }
      if (!parts.length) return a;
      const cmp = { '<': (x, y) => x < y, '<=': (x, y) => x <= y, '>': (x, y) => x > y, '>=': (x, y) => x >= y, '==': (x, y) => x === y, '!=': (x, y) => x !== y };
      return env => { let l = a(env); for (const [op, rf] of parts) { const r = rf(env); if (!cmp[op](l, r)) return 0; l = r; } return 1; };
    }
    function arith() { let a = term(); while (isOp('+') || isOp('-')) { const op = toks[i++].v, l = a, r = term(); a = op === '+' ? env => l(env) + r(env) : env => l(env) - r(env); } return a; }
    function term() {
      let a = factor();
      while (isOp('*') || isOp('/') || isOp('%')) { const op = toks[i++].v, l = a, r = factor(); a = op === '*' ? env => l(env) * r(env) : op === '/' ? env => l(env) / r(env) : env => pymod(l(env), r(env)); }
      return a;
    }
    function factor() {
      if (isOp('-')) { i++; const a = factor(); return env => -a(env); }
      if (isOp('+')) { i++; return factor(); }
      return power();
    }
    function power() { const a = atom(); if (isOp('**')) { i++; const b = factor(); return env => Math.pow(a(env), b(env)); } return a; }
    function atom() {
      const t = toks[i++]; if (!t) fail('表达式不完整');
      if (t.t === 'num') return () => t.v;
      if (t.t === 'op' && t.v === '(') { const e = expr(); if (!isOp(')')) fail('缺右括号'); i++; return e; }
      if (t.t === 'name') {
        if (t.v === 'True') return () => 1;
        if (t.v === 'False') return () => 0;
        if (isOp('(')) {
          if (!FUNCS[t.v]) fail('不允许调用 ' + t.v);
          i++; const args = []; if (!isOp(')')) { args.push(expr()); while (isOp(',')) { i++; args.push(expr()); } }
          if (!isOp(')')) fail('缺右括号'); i++;
          const f = FUNCS[t.v]; return env => f(...args.map(a => a(env)));
        }
        names.add(t.v); const k = t.v; return env => look(env, k);
      }
      return fail('多余的 ' + t.v);
    }
    const fn = expr(); if (i < toks.length) fail('表达式没有结束');
    return { fn, names, src: String(src) };
  }

  /* ---------- 模型和类库 ---------- */
  class Drive {
    constructor(name, spec, model, condition) {
      this.name = name; this.model = model; this.condition = condition || null; this.state = spec.state; this.lo = Number(spec.lo !== undefined ? spec.lo : 0); this.hi = Number(spec.hi !== undefined ? spec.hi : 1);
      this.kinds = spec.kinds || ['human', 'animal', 'plant'];
      if (this.lo === this.hi) throw new Error(`${model}: drive ${name} 的 lo 和 hi 不能相等`);
    }
    value(x) { return Math.min(1, Math.max(0, (x - this.lo) / (this.hi - this.lo))); }
    invert(v) { return this.lo + Math.min(1, Math.max(0, v)) * (this.hi - this.lo); }
  }
  const UNIT_PER_HOUR = { second: 3600, minute: 60, hour: 1, day: 1 / 24 };
  class Model {
    constructor(d, file) {
      const md = d.metadata || {}; this.name = md.name || file.replace(/\.yaml$/, ''); this.condition = md.condition || null; this.doc = d;
      this.params = {}; for (const k in d.parameters || {}) this.params[k] = Number(d.parameters[k]);
      this.vars = {}; this.inputs = {};
      for (const k in d.variables || {}) {
        const v = d.variables[k], b = v.bounds || [-1e9, 1e9];
        if (v.type === 'input') this.inputs[k] = { value: Number(v.value !== undefined ? v.value : 0) };
        else if (v.type === 'parameter') this.params[k] = Number(v.value !== undefined ? v.value : 0);
        else this.vars[k] = { value: Number(v.value !== undefined ? v.value : 0), lo: Number(b[0]), hi: Number(b[1]) };
      }
      this.aux = Object.entries(d.auxiliary || {}).map(([k, e]) => [k, compile(e, `${this.name}.auxiliary.${k}`)]);
      this.eqs = []; this.unit = null;
      const stepScale = (d.care || {}).step_scale || {};   /* 慢过程在游戏里按这个倍数加快，写在 care.step_scale，键是方程名 */
      for (const k in d.equations || {}) {
        const e = d.equations[k], unit = e.step_unit || 'hour';
        if (!(unit in UNIT_PER_HOUR)) throw new Error(`${this.name}.${k}: step_unit 只支持 second，minute，hour，day`);
        if (!this.unit) this.unit = unit;
        const cond = typeof e.condition === 'string' ? compile(e.condition, `${this.name}.${k}.condition`) : null;
        for (const v in e.dynamics || {}) {
          if (!(v in this.vars)) throw new Error(`${this.name}.${k}: 方程写的是没声明的状态 ${v}`);
          this.eqs.push([Number(e.priority || 0), v, compile(e.dynamics[v], `${this.name}.${k}.${v}`), cond, UNIT_PER_HOUR[unit] * Number(stepScale[k] || 1)]);
        }
      }
      this.unit = this.unit || 'hour';
      this.drives = {}; for (const k in d.drives || {}) this.drives[k] = new Drive(k, d.drives[k], this.name, this.condition);
      for (const dr of Object.values(this.drives)) if (!(dr.state in this.vars)) throw new Error(`${this.name}: drive ${dr.name} 指向没声明的状态 ${dr.state}`);
      /* care 段：游戏侧扩展 */
      const care = d.care || {}, want = (v, k) => { if (!(k in this.vars) && !(k in this.inputs)) throw new Error(`${this.name}: care 里的 ${v} 指向没声明的变量 ${k}`); };
      this.maxStepH = care.max_step_minutes ? Number(care.max_step_minutes) / 60 : MAX_SUBSTEP_H;
      /* fixed_step_minutes：模型按自己固定的步长走，和 Life Matters 里的仿真步长一致。输入量在每一步里按步数均分，这是 LM 转换来的模型的写法 */
      this.fixedStepH = care.fixed_step_minutes ? Number(care.fixed_step_minutes) / 60 : null;
      this.pulses = {};
      for (const key in care.pulses || {}) this.pulses[key] = (care.pulses[key] || []).map(x => {
        if (x.add !== undefined) { if (!(x.var in this.vars)) throw new Error(`${this.name}: pulse ${key} 的 add 要指向状态变量 ${x.var}`); return { var: x.var, add: Number(x.add) }; }
        want('pulse ' + key, x.var);
        return { var: x.var, total: Number(x.total), minutes: Math.max(1, Number(x.minutes || 1)), level: x.delivery === 'level' };
      });
      this.schedule = (care.schedule || []).map(x => { want('schedule', x.var); return { var: x.var, hour: Number(x.hour), hours: Math.max(1 / 60, Number(x.minutes || 1) / 60), value: Number(x.value), level: x.delivery === 'level', days: Array.isArray(x.days) ? x.days.map(Number) : null }; });
      this.presets = care.presets || {}; this.defaultPreset = care.default_preset || Object.keys(this.presets)[0] || null;
      this.readouts = (care.readouts || []).map(r => Object.assign({}, r, { reveal_by: r.reveal_by ? [].concat(r.reveal_by) : [], fn: compile(r.value, `${this.name}.readout.${r.id}`) }));
      this.effects = {}; for (const k in care.effects || {}) { if (k !== 'mood' && k !== 'frailty') throw new Error(`${this.name}: effects 只能是 mood 或 frailty`); this.effects[k] = compile(care.effects[k], `${this.name}.effects.${k}`); }
      this.story = care.story || null;
    }
  }
  class Library {
    constructor(modelDocs, classes) {
      /* metadata.supersedes：这个模型取代哪些模型，比如从 LM 转换来的疾病模型取代手写的同病模型 */
      const gone = new Set(); for (const [, d] of modelDocs) for (const n of [].concat((d.metadata || {}).supersedes || [])) gone.add(n);
      this.models = modelDocs.filter(([file, d]) => !gone.has((d.metadata || {}).name || file.replace(/\.yaml$/, ''))).map(([file, d]) => new Model(d, file));
      this.classes = classes;
      const seen = {};
      for (const m of this.models) for (const k of [...Object.keys(m.params), ...Object.keys(m.vars), ...Object.keys(m.inputs), ...m.aux.map(a => a[0])]) { if (k in seen) throw new Error(`名字 ${k} 在 ${seen[k]} 和 ${m.name} 里重复`); seen[k] = m.name; }
      this.names = new Set([...Object.keys(seen), 'step', 'hour', 'asleep', 'awake', 'age', 'health', 'inpatient', 'is_human', 'is_animal', 'is_plant', 'mood_now', 'need_max']);
      this.eqs = this.models.flatMap(m => m.eqs.map(([p, v, e, c, u]) => [p, m, v, e, c, u])).sort((a, b) => b[0] - a[0]);
      this.aux = this.models.flatMap(m => m.aux.map(([k, e]) => [m.name, k, e]));
      this.driveByName = {};
      for (const m of this.models) for (const n in m.drives) (this.driveByName[n] = this.driveByName[n] || []).push(m.drives[n]);
      const exprs = m => [...m.aux.map(a => a[1]), ...m.eqs.map(x => x[2]), ...m.eqs.map(x => x[3]).filter(Boolean), ...m.readouts.map(r => r.fn), ...Object.values(m.effects)];
      for (const m of this.models) for (const e of exprs(m)) for (const n of e.names) if (!this.names.has(n) && !/^(n_|speed_|has_)/.test(n)) throw new Error(`${m.name}: 表达式 ${e.src} 里的 ${n} 没有定义`);
      this.condModels = this.models.filter(m => m.condition);
    }
    modelsOfCondition(c) { return this.models.filter(m => m.condition === c); }
    hasModelFor(conds) { return (conds || []).some(c => this.condModels.some(m => m.condition === c)); }
    kindOf(species) { return ((this.classes.kinds || {})[species]) || 'animal'; }
    chain(species, stage) {
      const kind = this.kindOf(species), out = ['organism', kind];
      out.push(kind === 'human' ? 'human_' + stage : species);
      return [kind, out.filter(c => c in this.classes.classes)];
    }
    derive(snap) {
      const [kind, chain] = this.chain(snap.species || 'human', snap.stage || 'adult'), params = {};
      for (const m of this.models) Object.assign(params, m.params);
      for (const c of chain) Object.assign(params, (this.classes.classes[c] || {}).params || {});
      const conds = this.classes.conditions || {};
      for (const c of snap.conditions || []) Object.assign(params, (conds[c] || {}).params || {});
      return [kind, params, chain];
    }
  }

  /* ---------- 一个角色的积分状态 ---------- */
  const signature = (snap, mode) => [mode, snap.species, snap.stage, [...(snap.conditions || [])].sort().join(','), JSON.stringify(snap.cond_set || {})].join('|');
  const HISTORY_EVERY_H = 1 / 6, HISTORY_KEEP = 288;
  /* 区间 [a, a+la) 和 [b, b+lb) 的重叠长度，包括跨午夜的情形 */
  const overlap = (a, la, b, lb) => { let best = 0; for (const k of [-24, 0, 24]) best = Math.max(best, Math.min(a + la, b + k + lb) - Math.max(a, b + k)); return Math.max(0, best); };
  /* 重叠比例：贴着 0 或 1 的当作 0 或 1，积分钟上累积的浮点误差不该让一餐饭少算一点，也不该让阈值判断翻转 */
  const snap01 = f => (Math.abs(f - 1) < 1e-9 ? 1 : f < 1e-9 ? 0 : f);
  class Person {
    constructor(lib, snap, mode) {
      this.lib = lib; this.id = snap.id; this.mode = mode; [this.kind, this.params, this.chain] = lib.derive(snap); this.sig = signature(snap, mode);
      const conds = new Set(snap.conditions || []);
      this.eligible = lib.models.filter(m => (m.condition ? conds.has(m.condition) : mode !== 'conditions'));
      const ok = new Set(this.eligible.map(m => m.name));
      this.state = {}; for (const m of lib.models) for (const k in m.vars) this.state[k] = m.vars[k].value;
      /* 病情轻重：cond_set 里按疾病编号给 severity，对应模型 care.presets 里的一档，参数和初始状态覆盖默认 */
      this.preset = {};
      for (const m of this.eligible) {
        if (!m.condition || !m.defaultPreset) continue;
        const want = ((snap.cond_set || {})[m.condition] || {}).severity, key = want in m.presets ? want : m.defaultPreset, pr = m.presets[key] || {};
        this.preset[m.condition] = key;
        Object.assign(this.params, pr.params || {});
        for (const k in pr.state || {}) if (k in m.vars) this.state[k] = Number(pr.state[k]);
      }
      this.drives = {};
      for (const n in lib.driveByName) for (const dr of lib.driveByName[n]) if (ok.has(dr.model) && (n === 'mood' || n === 'frailty' || (dr.kinds.includes(this.kind) && n in (snap.needs || {})))) { this.drives[n] = dr; break; }
      this.active = new Set(this.eligible.filter(m => m.condition || !Object.keys(m.drives).length || Object.keys(m.drives).some(n => n in this.drives)).map(m => m.name));
      this.emitted = {}; this.first = true; this.ageH = 0; this.clockH = 0;
      this.cores = {}; this.windows = []; this.natClock = {}; this.history = {}; this.measured = {}; this.lastHistH = -1; this.lastEnv = null; this.revealNow = new Set();
    }
    activeModels() { return this.eligible.filter(m => this.active.has(m.name)); }
    gameValue(name, snap) { return name === 'mood' ? (snap.mood !== undefined ? snap.mood : 0.5) : name === 'frailty' ? (snap.frailty !== undefined ? snap.frailty : 0) : (snap.needs || {})[name]; }
    libVar(name) { for (const m of this.lib.models) if (name in m.vars) return m.vars[name]; throw new Error(name); }
    sync(snap) {
      for (const n in this.drives) {
        const dr = this.drives[n], v = this.gameValue(n, snap); if (v === undefined || v === null) continue;
        if (this.first || Math.abs(v - (n in this.emitted ? this.emitted[n] : v)) > RESYNC_EPS) { const b = this.libVar(dr.state); this.state[dr.state] = Math.min(b.hi, Math.max(b.lo, dr.invert(v))); }
        this.emitted[n] = v;
      }
      if (this.first) this.state.frailty_base = snap.frailty !== undefined ? snap.frailty : 0;
      this.first = false;
    }
    /* 动作和选择带来的输入：快照里的 pulses 是自上次积分以来做过的动作编号 */
    takePulses(snap) {
      for (const key of snap.pulses || []) {
        for (const m of this.activeModels()) {
          for (const x of m.pulses[key] || []) {
            if (x.add !== undefined) { const b = m.vars[x.var]; this.state[x.var] = Math.min(b.hi, Math.max(b.lo, this.state[x.var] + x.add)); continue; }
            const hrs = x.minutes / 60, per = x.level ? x.total : x.total / (m.fixedStepH ? Math.max(1, hrs / m.fixedStepH) : hrs * UNIT_PER_HOUR[m.unit]);
            this.windows.push({ m, var: x.var, per: x.level ? per - (m.inputs[x.var] ? m.inputs[x.var].value : 0) : per, from: this.clockH, until: this.clockH + hrs });
          }
          for (const r of m.readouts) if (r.reveal_by.includes(key)) this.revealNow.add(r.id);
        }
      }
    }
    step(snap, minutes, world) {
      this.sync(snap);
      const dt = Math.max(0, Number(minutes) || 0) / 60;
      this.takePulses(snap);
      this.hourNow = world && world.hour !== undefined ? Number(world.hour) : 12;
      if (dt > 0) {
        const all = this.activeModels(), viaCore = all.filter(m => this.coreOf(m)), rest = all.filter(m => !viaCore.includes(m));
        const act = rest.filter(m => !m.fixedStepH), nat = rest.filter(m => m.fixedStepH);
        const maxH = Math.min(MAX_SUBSTEP_H, ...act.map(m => m.maxStepH));
        const n = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(dt / maxH))), h = dt / n;
        const hour0 = pymod(this.hourNow - dt, 24), env = this.baseEnv(snap), clock0 = this.clockH;
        const wd = world && world.date && world.date.weekday !== undefined ? Number(world.date.weekday) : null;
        for (let i = 0; i < n; i++) { this.substep(env, h, pymod(hour0 + i * h, 24), wd, act, this.clockH); this.clockH += h; }
        /* 固定步长的模型各自走自己的钟，追到这一刻为止，剩下不足一步的留到下一次 */
        for (const m of nat) {
          const F = m.fixedStepH; if (!(m.name in this.natClock)) this.natClock[m.name] = clock0;
          let guard = 0;
          while (this.natClock[m.name] + F <= this.clockH + 1e-9 && guard++ < MAX_SUBSTEPS * 4) {
            this.substep(env, F, pymod(hour0 + (this.natClock[m.name] - clock0), 24), wd, [m], this.natClock[m.name]);
            this.natClock[m.name] += F;
          }
        }
        this.stepCores(viaCore, env, dt, hour0, wd, clock0);
        this.ageH += dt;
        const keep = Math.max(0, ...nat.map(m => m.fixedStepH)) + 0.01;
        this.windows = this.windows.filter(w => w.until + keep > this.clockH);
      }
      const evalEnv = this.evaluate(snap);
      const effects = {};
      if (dt > 0) for (const m of this.activeModels()) for (const k in m.effects) { const r = m.effects[k].fn(evalEnv); if (Number.isFinite(r)) effects[k] = (effects[k] || 0) + r * dt; }
      this.record(evalEnv);
      const out = [];
      for (const n in this.drives) { const v = this.gameValue(n, snap); if (v === undefined || v === null) continue; out.push([n, this.drives[n].value(this.state[this.drives[n].state])]); }
      return { drives: out, effects };
    }
    /* 交给共享核心的模型：转换一次，每个人每个模型一个核心实例。没有核心类或转换不了就返回 null，仍用旧积分器 */
    coreOf(m) {
      if (m.name in this.cores) return this.cores[m.name];
      let cs = null;
      if (CY.LMCore && CY.coreConvert) {
        const conv = CY.coreConvert.convert(m, this, CORE_STEP_MIN);
        if (conv) cs = { conv, core: new CY.LMCore({ model: conv.model, bridge: conv.bridge }), pend: 0, made: false };
      }
      return (this.cores[m.name] = cs);
    }
    /* 一次调用里，核心按固定步长走：每一步由适配层算出模型输入的水平和环境量，用手柄写进去，再把状态读回来。游戏侧改过的状态先赋值进核心 */
    stepCores(models, env, dt, hour0, wd, clock0) {
      for (const m of models) {
        const cs = this.cores[m.name], core = cs.core;
        if (!cs.made) { core.init({ v: 1, kind: 'init', subjects: [{ id: this.id, preset: null, overrides: Object.fromEntries(cs.conv.states.map(k => [k, this.state[k]])) }] }); cs.made = true; }
        const cur = core.variables(this.id), diff = {};
        for (const k of cs.conv.states) if (cur[k] !== this.state[k]) diff[k] = this.state[k];
        if (Object.keys(diff).length) CY.coreAssign.set(core, this.id, diff, 'game');
        const stepH = CORE_STEP_MIN / 60, avail = cs.pend + dt * 60, n = Math.floor(avail / CORE_STEP_MIN + 1e-9);
        cs.pend = Math.max(0, avail - n * CORE_STEP_MIN);
        for (let j = 0; j < n; j++) {
          const hourJ = pymod(hour0 - (avail - dt * 60) / 60 + j * stepH, 24), tAbs = clock0 - (avail - dt * 60) / 60 + j * stepH, scratch = { hour: hourJ };
          this.inputs(scratch, stepH, wd, [m], tAbs);
          const handles = [];
          for (const k of cs.conv.inputs) handles.push({ concept: 'care_in_' + k, mode: 'level', value: scratch[k] });
          for (const k of cs.conv.envNames) {
            let v = k === 'hour' ? hourJ : env[k];
            if (v === undefined) v = k.startsWith('speed_') ? 1 : 0;
            handles.push({ concept: 'care_env_' + k, mode: 'level', value: v });
          }
          core.step({ v: 1, kind: 'step', minutes: CORE_STEP_MIN, subjects: [{ id: this.id, handles }] });
        }
        const now = core.variables(this.id);
        for (const k of cs.conv.states) this.state[k] = now[k];
      }
    }
    /* 现在这一刻的完整变量环境，读数和效果都用它 */
    evaluate(snap) {
      const env = this.baseEnv(snap); env.step = 0; env.hour = this.hourNow;
      Object.assign(env, this.state);
      for (const m of this.activeModels()) for (const k in m.inputs) env[k] = m.inputs[k].value;
      for (const n in this.drives) env['n_' + n] = n === 'mood' || n === 'frailty' ? this.drives[n].value(this.state[this.drives[n].state]) : 1 - this.drives[n].value(this.state[this.drives[n].state]);   /* 模型方程里的 n_ 是需求压力，游戏里是水平 */
      env.need_max = Math.max(env._other_max, ...Object.keys(this.drives).filter(n => n !== 'mood' && n !== 'frailty').map(n => env['n_' + n]), 0);
      for (const [mn, k, e] of this.lib.aux) if (this.active.has(mn)) env[k] = e.fn(env);
      this.lastEnv = env; return env;
    }
    record(env) {
      const due = this.clockH - this.lastHistH >= HISTORY_EVERY_H || this.lastHistH < 0;
      for (const m of this.activeModels()) for (const r of m.readouts) {
        const v = r.fn.fn(env); if (!Number.isFinite(v)) continue;
        if (this.revealNow.has(r.id)) this.measured[r.id] = { v, t: this.clockH };
        if (due) { const h = this.history[r.id] = this.history[r.id] || []; h.push([this.clockH, v]); if (h.length > HISTORY_KEEP) h.shift(); }
      }
      this.revealNow.clear();
      if (due) this.lastHistH = this.clockH;
    }
    /* 界面上观察的读数：reveal_by 的读数要照顾做过一次才显示，显示的是那一刻的值 */
    readouts() {
      const out = [];
      for (const m of this.activeModels()) for (const r of m.readouts) {
        const hist = this.history[r.id] || [], live = hist.length ? hist[hist.length - 1][1] : null, meas = this.measured[r.id] || null;
        const shown = r.reveal_by.length ? (meas ? meas.v : null) : live;
        let band = null;
        if (shown !== null) { for (const b of r.bands || []) if (b.upto === undefined || shown <= b.upto) { band = b; break; } }
        out.push({ cond: m.condition, id: r.id, label: r.label || r.id, label_en: r.label_en || null, unit: r.unit || '', scale: r.scale || null, decimals: r.decimals !== undefined ? r.decimals : 0, reveal_by: r.reveal_by, value: shown, live, measured: meas, tone: band ? band.tone : null, word: band ? band.word : null, word_en: band ? band.word_en || null : null,
          history: hist.slice(-144).map(x => x[1]), trend: hist.length > 6 ? Math.sign(hist[hist.length - 1][1] - hist[hist.length - 7][1]) : 0 });
      }
      return out;
    }
    baseEnv(snap) {
      const env = Object.assign({}, this.params), flags = snap.flags || {}, needs = snap.needs || {}, mult = snap.rate_mult || {};
      Object.assign(env, {
        asleep: snap.sleeping ? 1 : 0, awake: snap.sleeping ? 0 : 1, age: snap.age !== undefined && snap.age !== null ? Number(snap.age) : 30, health: 1 - Number(snap.frailty || 0),
        inpatient: flags.hospital ? 1 : 0, is_human: this.kind === 'human' ? 1 : 0, is_animal: this.kind === 'animal' ? 1 : 0, is_plant: this.kind === 'plant' ? 1 : 0, mood_now: Number(snap.mood !== undefined ? snap.mood : 0.5),
      });
      env.mood_offset = (this.params.mood_offset || 0) + Number(snap.mood_offset || 0);
      env.frailty_vuln = (this.params.frailty_vuln !== undefined ? this.params.frailty_vuln : 1) * Number(snap.frailty_mult !== undefined ? snap.frailty_mult : 1);
      for (const k in needs) { env['n_' + k] = 1 - Number(needs[k]); env['speed_' + k] = Number(mult[k] !== undefined ? mult[k] : 1); }
      for (const k in mult) if (!('speed_' + k in env)) env['speed_' + k] = Number(mult[k]);
      for (const c of snap.conditions || []) env['has_' + c] = 1;
      for (const [, k] of this.lib.aux) if (!(k in env)) env[k] = 0;
      env._other_max = Math.max(0, ...Object.keys(needs).filter(k => !(k in this.drives)).map(k => 1 - Number(needs[k])));
      return env;
    }
    /* 模型输入量：默认值，加上每天固定时刻的日程和动作带来的窗口，按这一小步和窗口的重叠比例给 */
    inputs(env, h, wd, act, tAbs) {
      for (const m of act) {
        for (const k in m.inputs) env[k] = m.inputs[k].value;
        for (const s of m.schedule) {
          if (s.days && wd !== null && !s.days.includes(wd)) continue;
          const f = snap01(overlap(env.hour, h, s.hour, s.hours) / h); if (f <= 0) continue;
          /* level 的输入在窗口里取这个值，代替默认值；总量的输入在默认值之上加 */
          const per = s.level ? s.value - (m.inputs[s.var] ? m.inputs[s.var].value : 0) : s.value / (m.fixedStepH ? Math.max(1, s.hours / m.fixedStepH) : s.hours * UNIT_PER_HOUR[m.unit]);
          env[s.var] += per * f;
        }
      }
      for (const w of this.windows) {
        if (!act.includes(w.m)) continue;
        const f = snap01(Math.max(0, Math.min(tAbs + h, w.until) - Math.max(tAbs, w.from)) / h); if (f > 0) env[w.var] += w.per * f;
      }
    }
    /* 积分一小步：act 是这一步要走的模型，hour 是这一步开始时的钟点，tAbs 是这一步在积分钟上的起点 */
    substep(env, h, hour, wd, act, tAbs) {
      Object.assign(env, this.state);
      env.hour = hour; env.step = h;
      this.inputs(env, h, wd, act, tAbs);
      for (const n in this.drives) env['n_' + n] = n === 'mood' || n === 'frailty' ? this.drives[n].value(this.state[this.drives[n].state]) : 1 - this.drives[n].value(this.state[this.drives[n].state]);   /* 模型方程里的 n_ 是需求压力，游戏里是水平 */
      env.need_max = Math.max(env._other_max, ...Object.keys(this.drives).filter(n => n !== 'mood' && n !== 'frailty').map(n => env['n_' + n]), 0);
      for (const [mn, k, e] of this.lib.aux) if (act.some(m => m.name === mn)) env[k] = e.fn(env);
      for (const [, m, v, e, cond, scale] of this.lib.eqs) {
        if (!act.includes(m)) continue;
        env.step = h * scale;
        if (cond && !cond.fn(env)) continue;
        let x = e.fn(env); if (!Number.isFinite(x)) x = this.state[v];
        const vv = m.vars[v]; x = Math.min(vv.hi, Math.max(vv.lo, x));
        this.state[v] = x; env[v] = x;
      }
      env.step = h;
    }
  }

  /* ---------- 引擎：按角色编号保存积分状态，处理一次 tick。mode 为 conditions 时只管带疾病模型的角色的疾病部分 ---------- */
  class Engine {
    constructor(lib, mode) { this.lib = lib; this.mode = mode || 'full'; this.people = {}; }
    person(snap) { let p = this.people[snap.id]; if (!p || p.sig !== signature(snap, this.mode)) p = this.people[snap.id] = new Person(this.lib, snap, this.mode); return p; }
    drive(req) {
      const minutes = Number(req.minutes || 0), world = req.world || {}, out = [], declared = {};
      for (const snap of req.people || []) {
        if (!snap.id) continue;
        if (this.mode === 'conditions' && !this.lib.hasModelFor(snap.conditions)) { delete this.people[snap.id]; continue; }
        const p = this.person(snap), names = [], r = p.step(snap, minutes, world);
        for (const [n, v] of r.drives) {
          const cur = p.gameValue(n, snap), delta = Math.round((v - cur) * 1e5) / 1e5;
          names.push(n); p.emitted[n] = Math.min(1, Math.max(0, cur + delta));
          if (Math.abs(delta) < 1e-5) continue;
          out.push(n === 'mood' || n === 'frailty' ? { op: n, person: snap.id, delta } : { op: 'need', person: snap.id, need: n, delta });
        }
        for (const k in r.effects) { const d = Math.round(r.effects[k] * 1e5) / 1e5; if (Math.abs(d) >= 1e-5) out.push({ op: k, person: snap.id, delta: d }); }
        declared[snap.id] = names;
      }
      const alive = new Set((req.people || []).map(s => s.id));
      for (const id of Object.keys(this.people)) if (!alive.has(id)) delete this.people[id];
      return { directives: out, drives: declared };
    }
  }
  LM.Library = Library; LM.Engine = Engine; LM.compile = compile; LM.Person = Person;

  /* 读模型：内置的在程序自带的 templates/lm，玩家导入的在存档的 custom/lm/models */
  LM.build = (docs, classes) => { LM.lib = new Library(docs, classes); LM.engine = new Engine(LM.lib, 'full'); LM.engineCond = new Engine(LM.lib, 'conditions'); LM.ready = true; LM.error = null; return LM.lib; };
  LM.load = async function () {
    if (LM.ready || LM.loading) return LM.ready;
    LM.loading = true;
    try {
      /* 共享核心是 ES 模块，动态载入；测试环境由 harness 提前放好 CY.LMCore */
      if (!CY.LMCore && HERE) CY.LMCore = (await import(new URL('core_runtime/index.js', HERE).href)).LMCore;
      const store = CY.store, T = CY.game.T(), docs = [];
      for (const p of Object.keys(T).filter(p => /^templates\/lm\/models\/[^/]+\.yaml$/.test(p)).sort()) docs.push([p.split('/').pop(), jsyaml.load(T[p])]);
      /* 玩家导入的疾病包在存档的 custom/lm/models 下 */
      for (const p of (await store.list()).filter(p => /^custom\/lm\/models\/[^/]+\.yaml$/.test(p)).sort()) docs.push([p.split('/').pop(), await store.readYaml(p)]);
      const classes = T['templates/lm/classes.yaml'] ? jsyaml.load(T['templates/lm/classes.yaml']) : null;
      if (!docs.length || !classes) throw new Error('内置的疾病模型没有载入');
      LM.build(docs, classes);
    } catch (e) { LM.error = String(e && e.message || e); }
    LM.loading = false;
    return LM.ready;
  };
  LM.hello = () => ({ v: 1, name: 'care-lm-in-browser', version: '0.2.0', handles: { events: false, strategies: false, lines: false } });
  LM.drive = req => {
    if (!LM.ready) { LM.load(); return { directives: [], drives: {} }; }
    return LM.engine.drive(req);
  };
  /* 只积分疾病部分：给选 builtin 的玩家用，没有疾病模型的角色完全不碰 */
  LM.driveConditions = req => {
    if (!LM.ready) { LM.load(); return { directives: [], drives: {} }; }
    return LM.engineCond.drive(req);
  };
  LM.wants = req => !!(LM.ready && LM.lib.condModels.length && (req.people || []).some(s => LM.lib.hasModelFor(s.conditions)));
  /* 界面观察用：这个角色现在的读数，两种模式谁积分的取谁的 */
  LM.readouts = pid => {
    for (const e of [LM.engineCond, LM.engine]) { const p = e && e.people[pid]; if (p) return p.readouts(); }
    return [];
  };
  LM.storyOf = cond => { const m = LM.ready && LM.lib.modelsOfCondition(cond)[0]; return m ? { story: m.story, presets: Object.keys(m.presets), default: m.defaultPreset } : null; };
})(globalThis.CY = globalThis.CY || {});
