/* 可选功能的总开关。每个可选功能一个名字，在 templates/system.yaml 的 modules 里写 true 或 false，关掉就等于没有这个功能，原有机制照旧。
   模块之间不互相依赖，别的地方只问 G.module(名字)，不直接读配置。
   dispatch 看护调度；shop 商店（包括用品和送客人的礼物）；ledger 贡献统计，默认关，只在开发者模式里看。
   开关的值写在 templates/system.yaml 的 modules 里，代码里没有默认值。
   商店关掉时：用品的解锁要求不再卡人，也就是婴儿车和轮椅这类规则当作没有，不会因为买不到而永远做不了事；用品的加成，装饰，礼物都不生效。 */
(function (CY) {
  const G = CY.game;
  G.module = name => { const m = G.S('modules'); return m[name] === true || m[name] === 'true'; };   /* 开关都写在 templates/system.yaml 的 modules 里，没写的名字直接报错 */
  /* 只改这一次运行里的值，要长久生效改 templates/system.yaml */
  G.setModule = (name, on) => { const sys = G.tpl.system = G.tpl.system || {}; sys.modules = Object.assign({}, sys.modules, { [name]: !!on }); };
  /* 商店相关的两个问法：有没有这件东西（加成，外观），解锁条件满不满足（做得了某件事）。商店关了，前者一律没有，后者一律满足 */
  /* 规则配置：templates/engine.yaml 的某一节。读不到的键直接报错，代码里不给默认值；规则的数都在 YAML 里，改数不改代码 */
  const memo = new WeakMap();   /* 同一个对象只包一次，热循环里反复取配置不再分配 */
  const strict = (o, path) => {
    if (memo.has(o)) return memo.get(o);
    const p = new Proxy(o, { get(t, k) { if (typeof k === 'symbol' || k === 'toJSON' || k === 'then') return t[k]; if (!(k in t)) throw new Error('缺少配置 ' + path + '.' + String(k)); const v = t[k]; return v && typeof v === 'object' && !Array.isArray(v) ? strict(v, path + '.' + String(k)) : v; } });
    memo.set(o, p); return p;
  };
  const caches = { engine: { src: null, secs: {} }, system: { src: null, secs: {} } };
  const section = (file, name) => {
    const doc = G.tpl && G.tpl[file], c = caches[file];
    if (c.src !== doc) { c.src = doc; c.secs = {}; }
    if (!doc || doc[name] === undefined) throw new Error('缺少配置 ' + file + '.' + name);
    const v = doc[name];
    if (!(v && typeof v === 'object' && !Array.isArray(v))) return v;
    const hit = c.secs[name];
    if (hit && hit.raw === v) return hit.proxy;   /* 节被换掉了，比如 setModule，就重新包 */
    return (c.secs[name] = { raw: v, proxy: strict(v, file + '.' + name) }).proxy;
  };
  /* 按动态的键查一张表，比如按阶段，按语言，按领域：表里没有这个键是正常的，返回 undefined，不报错 */
  G.opt = (map, key) => (key in map ? map[key] : undefined);
  G.E = name => section('engine', name);   /* templates/engine.yaml 的一节 */
  G.S = name => section('system', name);   /* templates/system.yaml 的一节 */
  /* 一个读配置的全局名，第一次用时才读，因为配置在游戏载入时才读进来；需要保存运行状态的对象用 G.constOnce */
  G.constGet = (name, fn) => Object.defineProperty(G, name, { get: fn, configurable: true });
  G.constOnce = (name, fn) => { let v, src; Object.defineProperty(G, name, { get: () => { const eng = G.tpl && G.tpl.engine; if (src !== eng) { src = eng; v = fn(); } return v; }, configurable: true }); };
  G.hasItem = id => G.module('shop') && G.owned(id);
  G.unlocked = id => !G.module('shop') || G.owned(id);
})(globalThis.CY = globalThis.CY || {});
