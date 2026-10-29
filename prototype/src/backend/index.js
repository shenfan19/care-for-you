/* 后端路由：设置里选内置还是远程。内置是同步的，立刻返回；远程是异步的，回来再执行。
   远程出错就退回内置，只提示一次。 */
(function (CY) {
  const B = CY.backend = { failed: false };
  const provider = () => CY.ini.get(CY.game.cfg, 'play', 'backend_provider');
  const useHttp = () => provider() === 'http';
  B.names = () => CY.ini.bool(CY.game.cfg, 'play', 'backend_send_names');

  B.build = (trigger, extra = {}) => {
    const G = CY.game, P = CY.protocol, names = B.names();
    const req = { v: P.V, kind: 'drive', trigger, world: P.world(), minutes: extra.minutes || 0 };
    if (trigger === 'tick') {
      req.people = G.people.filter(p => p.person.active !== false).map(p => P.person(p, { names }));
      req.expired = extra.expired || [];
    } else { req.person = P.person(extra.person, { names }); req.action = extra.action; }
    return req;
  };

  /* 状态和策略：前台定期要一次。pending 是还在路上的请求，declined 是刚被拒绝的，后台据此不重复发 */
  B.buildPlan = (extra = {}) => {
    const G = CY.game, P = CY.protocol, names = B.names();
    return { v: P.V, kind: 'plan', world: P.world(), minutes: extra.minutes || 0, people: G.people.filter(p => p.person.active !== false).map(p => P.person(p, { names })), pending: extra.pending || [], declined: extra.declined || [] };
  };
  /* 返回 { states, strategies }（内置）或 Promise（远程，出错退回内置） */
  B.plan = req => {
    const P = CY.protocol;
    if (!useHttp()) return P.sanitizePlan(CY.backendLocal.plan(req));
    return CY.backendHttp.plan(req).then(r => { B.failed = false; return P.sanitizePlan(r); }, e => { fail(e); return P.sanitizePlan(CY.backendLocal.plan(req)); });
  };

  const fail = (e) => {
    if (!B.failed) { B.failed = true; CY.game.backendError && CY.game.backendError(e); }
  };
  /* 返回数组（内置）或 Promise（远程）。指令都经过检查 */
  B.drive = req => {
    const P = CY.protocol;
    if (!useHttp()) return P.sanitize(CY.backendLocal.drive(req).directives);
    return CY.backendHttp.drive(req).then(r => { B.failed = false; return P.sanitize(r.directives); }, e => { fail(e); return P.sanitize(CY.backendLocal.drive(req).directives); });
  };
  /* 台词：先返回内置的，远程的回来了再通过 late 换上 */
  B.line = (req, late) => {
    const local = CY.backendLocal.line(req).text;
    if (useHttp() && late) CY.backendHttp.line(req).then(r => { if (r && typeof r.text === 'string' && r.text) late(r.text.slice(0, 240)); }, fail);
    return local;
  };
})(globalThis.CY = globalThis.CY || {});
