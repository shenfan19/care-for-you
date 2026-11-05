/* 可选功能的总开关。每个可选功能一个名字，在 templates/system.yaml 的 modules 里写 true 或 false，关掉就等于没有这个功能，原有机制照旧。
   模块之间不互相依赖，别的地方只问 G.module(名字)，不直接读配置。
   dispatch 看护调度；shop 商店（包括用品和送客人的礼物）；ledger 贡献统计，默认关，只在开发者模式里看。
   商店关掉时：用品的解锁要求不再卡人，也就是婴儿车和轮椅这类规则当作没有，不会因为买不到而永远做不了事；用品的加成，装饰，礼物都不生效。 */
(function (CY) {
  const G = CY.game;
  const DEF = { dispatch: true, shop: true, ledger: false };
  G.MODULES = Object.keys(DEF);
  G.module = name => { const m = (G.tpl && G.tpl.system && G.tpl.system.modules) || {}; return name in m ? (m[name] === true || m[name] === 'true') : !!DEF[name]; };
  /* 只改这一次运行里的值，要长久生效改 templates/system.yaml */
  G.setModule = (name, on) => { const sys = G.tpl.system = G.tpl.system || {}; sys.modules = Object.assign({}, sys.modules, { [name]: !!on }); };
  /* 商店相关的两个问法：有没有这件东西（加成，外观），解锁条件满不满足（做得了某件事）。商店关了，前者一律没有，后者一律满足 */
  G.hasItem = id => G.module('shop') && G.owned(id);
  G.unlocked = id => !G.module('shop') || G.owned(id);
})(globalThis.CY = globalThis.CY || {});
