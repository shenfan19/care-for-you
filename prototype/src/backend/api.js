/* 对外的接口：读每个人的需求和状态，写指令。给你自己的 ODE 或者别的聊天 AI 用。
   在页面里：CY.api.state() 读，CY.api.apply(指令列表) 写，CY.api.onTick(fn) 每秒收一次状态。
   在页面外：设置里打开 api_bridge 后，页面响应 postMessage，例如放进 iframe 或者浏览器扩展里：
     { type: 'care.getState', id, names } 回 { type: 'care.state', id, state }
     { type: 'care.apply', id, directives } 回 { type: 'care.applied', id, applied }
   指令和后端协议里的一样，都会被检查。需求完全由外面给，就把设置 needs_source 改成 backend，再用 need_set 指令写。 */
(function (CY) {
  const G = CY.game, A = CY.api = {};
  A.state = (opts = {}) => ({ v: 1, world: CY.protocol.world(), people: G.people.filter(p => p.person.active !== false).map(p => CY.protocol.person(p, { names: !!opts.names })) });
  A.apply = list => { const clean = CY.protocol.sanitize(list); G.applyDirectives(clean); return clean.length; };
  /* 角色卡：每类典型角色的全部设定，和数据文件夹 templates/cards 里的一样 */
  A.cards = () => JSON.parse(JSON.stringify(G.tpl.cards || {}));
  A.onTick = fn => G.on(() => fn(A.state()));
  if (typeof addEventListener === 'function') {
    addEventListener('message', e => {
      if (!CY.ini.bool(G.cfg, 'play', 'api_bridge')) return;
      const d = e.data;
      if (!d || typeof d !== 'object' || !e.source) return;
      const to = e.origin && e.origin !== 'null' ? e.origin : '*';
      if (d.type === 'care.getState') e.source.postMessage({ type: 'care.state', id: d.id, state: A.state({ names: !!d.names }) }, to);
      else if (d.type === 'care.apply') e.source.postMessage({ type: 'care.applied', id: d.id, applied: A.apply(d.directives) }, to);
    });
  }
})(globalThis.CY = globalThis.CY || {});
