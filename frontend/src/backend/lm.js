/* 浏览器里跑的数值积分后端：把每个角色的需求，心情，虚弱度当作 LM 风格模型的状态变量，在页面里直接积分，不需要任何服务进程。
   模型文件是数据文件夹 templates/lm 下的明文 YAML：models 里一个文件一个模型，classes.yaml 是类的派生。
   写法和 backend_lm_ai 的 Python 版一致，方程是 Python 语法的表达式字符串，这里用一个小的解析器求值，不用 eval。
   设置里 backend_provider 选 lm 就用它。它只管积分，事件，台词，谁向谁求助仍由内置后端管。 */
(function (CY) {
  const LM = CY.lm = { ready: false, error: null, lib: null, engine: null, loading: false };
  const MAX_SUBSTEP_H = 0.25, MAX_SUBSTEPS = 240, RESYNC_EPS = 0.004;   /* 快照里的数保留四位小数，比这大的差就是游戏自己动了它 */
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
    constructor(name, spec, model) {
      this.name = name; this.model = model; this.state = spec.state; this.lo = Number(spec.lo !== undefined ? spec.lo : 0); this.hi = Number(spec.hi !== undefined ? spec.hi : 1);
      this.kinds = spec.kinds || ['human', 'animal', 'plant'];
      if (this.lo === this.hi) throw new Error(`${model}: drive ${name} 的 lo 和 hi 不能相等`);
    }
    value(x) { return Math.min(1, Math.max(0, (x - this.lo) / (this.hi - this.lo))); }
    invert(v) { return this.lo + Math.min(1, Math.max(0, v)) * (this.hi - this.lo); }
  }
  class Model {
    constructor(d, file) {
      const md = d.metadata || {}; this.name = md.name || file.replace(/\.yaml$/, '');
      this.params = {}; for (const k in d.parameters || {}) this.params[k] = Number(d.parameters[k]);
      this.vars = {};
      for (const k in d.variables || {}) { const v = d.variables[k], b = v.bounds || [-1e9, 1e9]; this.vars[k] = { value: Number(v.value !== undefined ? v.value : 0), lo: Number(b[0]), hi: Number(b[1]) }; }
      this.aux = Object.entries(d.auxiliary || {}).map(([k, e]) => [k, compile(e, `${this.name}.auxiliary.${k}`)]);
      this.eqs = [];
      for (const k in d.equations || {}) {
        const e = d.equations[k];
        if ((e.step_unit || 'hour') !== 'hour') throw new Error(`${this.name}.${k}: 只支持 step_unit: hour`);
        for (const v in e.dynamics || {}) {
          if (!(v in this.vars)) throw new Error(`${this.name}.${k}: 方程写的是没声明的状态 ${v}`);
          this.eqs.push([Number(e.priority || 0), v, compile(e.dynamics[v], `${this.name}.${k}.${v}`)]);
        }
      }
      this.drives = {}; for (const k in d.drives || {}) this.drives[k] = new Drive(k, d.drives[k], this.name);
      for (const dr of Object.values(this.drives)) if (!(dr.state in this.vars)) throw new Error(`${this.name}: drive ${dr.name} 指向没声明的状态 ${dr.state}`);
    }
  }
  class Library {
    constructor(modelDocs, classes) {
      this.models = modelDocs.map(([file, d]) => new Model(d, file));
      this.classes = classes;
      const seen = {};
      for (const m of this.models) for (const k of [...Object.keys(m.params), ...Object.keys(m.vars), ...m.aux.map(a => a[0])]) { if (k in seen) throw new Error(`名字 ${k} 在 ${seen[k]} 和 ${m.name} 里重复`); seen[k] = m.name; }
      this.names = new Set([...Object.keys(seen), 'step', 'hour', 'asleep', 'awake', 'age', 'health', 'inpatient', 'is_human', 'is_animal', 'is_plant', 'mood_now', 'need_max']);
      this.eqs = this.models.flatMap(m => m.eqs.map(([p, v, e]) => [p, m, v, e])).sort((a, b) => b[0] - a[0]);
      this.aux = this.models.flatMap(m => m.aux.map(([k, e]) => [m.name, k, e]));
      this.driveByName = {};
      for (const m of this.models) for (const n in m.drives) (this.driveByName[n] = this.driveByName[n] || []).push(m.drives[n]);
      for (const m of this.models) for (const e of [...m.aux.map(a => a[1]), ...m.eqs.map(x => x[2])]) for (const n of e.names) if (!this.names.has(n) && !/^(n_|speed_|has_)/.test(n)) throw new Error(`${m.name}: 表达式 ${e.src} 里的 ${n} 没有定义`);
    }
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
  const signature = snap => [snap.species, snap.stage, [...(snap.conditions || [])].sort().join(',')].join('|');
  class Person {
    constructor(lib, snap) {
      this.lib = lib; this.id = snap.id; [this.kind, this.params, this.chain] = lib.derive(snap); this.sig = signature(snap);
      this.state = {}; for (const m of lib.models) for (const k in m.vars) this.state[k] = m.vars[k].value;
      this.drives = {};
      for (const n in lib.driveByName) for (const dr of lib.driveByName[n]) if (n === 'mood' || n === 'frailty' || (dr.kinds.includes(this.kind) && n in (snap.needs || {}))) { this.drives[n] = dr; break; }
      this.active = new Set(lib.models.filter(m => !Object.keys(m.drives).length || Object.keys(m.drives).some(n => n in this.drives)).map(m => m.name));
      this.emitted = {}; this.first = true; this.ageH = 0;
    }
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
    step(snap, minutes, world) {
      this.sync(snap);
      const dt = Math.max(0, Number(minutes) || 0) / 60;
      if (dt > 0) {
        const n = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(dt / MAX_SUBSTEP_H))), h = dt / n;
        const hour0 = pymod((world && world.hour !== undefined ? Number(world.hour) : 12) - dt, 24), env = this.baseEnv(snap);
        for (let i = 0; i < n; i++) { env.step = h; env.hour = pymod(hour0 + i * h, 24); this.substep(env); }
        this.ageH += dt;
      }
      const out = [];
      for (const n in this.drives) { const v = this.gameValue(n, snap); if (v === undefined || v === null) continue; out.push([n, this.drives[n].value(this.state[this.drives[n].state])]); }
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
      for (const k in needs) { env['n_' + k] = Number(needs[k]); env['speed_' + k] = Number(mult[k] !== undefined ? mult[k] : 1); }
      for (const k in mult) if (!('speed_' + k in env)) env['speed_' + k] = Number(mult[k]);
      for (const c of snap.conditions || []) env['has_' + c] = 1;
      for (const [, k] of this.lib.aux) if (!(k in env)) env[k] = 0;
      env._other_max = Math.max(0, ...Object.keys(needs).filter(k => !(k in this.drives)).map(k => Number(needs[k])));
      return env;
    }
    substep(env) {
      Object.assign(env, this.state);
      for (const n in this.drives) env['n_' + n] = this.drives[n].value(this.state[this.drives[n].state]);
      env.need_max = Math.max(env._other_max, ...Object.keys(this.drives).filter(n => n !== 'mood' && n !== 'frailty').map(n => env['n_' + n]));
      for (const [mn, k, e] of this.lib.aux) if (this.active.has(mn)) env[k] = e.fn(env);
      for (const [, m, v, e] of this.lib.eqs) {
        if (!this.active.has(m.name)) continue;
        let x = e.fn(env); if (!Number.isFinite(x)) x = this.state[v];
        const vv = m.vars[v]; x = Math.min(vv.hi, Math.max(vv.lo, x));
        this.state[v] = x; env[v] = x;
      }
    }
  }

  /* ---------- 引擎：按角色编号保存积分状态，处理一次 tick ---------- */
  class Engine {
    constructor(lib) { this.lib = lib; this.people = {}; }
    person(snap) { let p = this.people[snap.id]; if (!p || p.sig !== signature(snap)) p = this.people[snap.id] = new Person(this.lib, snap); return p; }
    drive(req) {
      const minutes = Number(req.minutes || 0), world = req.world || {}, out = [], declared = {};
      for (const snap of req.people || []) {
        if (!snap.id) continue;
        const p = this.person(snap), names = [];
        for (const [n, v] of p.step(snap, minutes, world)) {
          const cur = p.gameValue(n, snap), delta = Math.round((v - cur) * 1e5) / 1e5;
          names.push(n); p.emitted[n] = Math.min(1, Math.max(0, cur + delta));
          if (Math.abs(delta) < 1e-5) continue;
          out.push(n === 'mood' || n === 'frailty' ? { op: n, person: snap.id, delta } : { op: 'need', person: snap.id, need: n, delta });
        }
        declared[snap.id] = names;
      }
      const alive = new Set((req.people || []).map(s => s.id));
      for (const id of Object.keys(this.people)) if (!alive.has(id)) delete this.people[id];
      return { directives: out, drives: declared };
    }
  }
  LM.Library = Library; LM.Engine = Engine; LM.compile = compile;

  /* 从数据文件夹读模型：templates/lm/models/*.yaml 和 templates/lm/classes.yaml。改了文件，重新载入页面生效 */
  LM.load = async function () {
    if (LM.ready || LM.loading) return LM.ready;
    LM.loading = true;
    try {
      const store = CY.store, files = (await store.list()).filter(p => /^templates\/lm\/models\/[^/]+\.yaml$/.test(p)).sort();
      const docs = [];
      for (const p of files) docs.push([p.split('/').pop(), await store.readYaml(p)]);
      const classes = await store.readYaml('templates/lm/classes.yaml');
      if (!docs.length || !classes) throw new Error('数据文件夹里没有 templates/lm，点设置里的补回缺失的初始文件');
      LM.lib = new Library(docs, classes); LM.engine = new Engine(LM.lib); LM.ready = true; LM.error = null;
    } catch (e) { LM.error = String(e && e.message || e); }
    LM.loading = false;
    return LM.ready;
  };
  LM.hello = () => ({ v: 1, name: 'care-lm-in-browser', version: '0.1.0', handles: { events: false, strategies: false, lines: false } });
  LM.drive = req => {
    if (!LM.ready) { LM.load(); return { directives: [], drives: {} }; }
    return LM.engine.drive(req);
  };
})(globalThis.CY = globalThis.CY || {});
