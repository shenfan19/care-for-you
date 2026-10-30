/* 后端路由：设置里选内置还是远程。内置是同步的，立刻返回；远程是异步的，回来再执行。
   远程出错就退回内置，只提示一次。

   远程后端先握手（hello），声明自己管哪几样：events 是随机事件，strategies 是谁向谁求助和位置愿望，lines 是台词。
   声明了 false 的，游戏交给内置后端，两边的指令合在一起执行；没有声明的（老后端）一律当成“都管”。
   远程后端每次回 drive 时还带 drives：它这次替哪些角色算了哪些变量，游戏本体对这些变量就不再自己涨。 */
(function (CY) {
  const B = CY.backend = { failed: false, caps: null, driven: {}, pending: 0 };
  const provider = () => CY.ini.get(CY.game.cfg, 'play', 'backend_provider');
  const useHttp = () => provider() === 'http';
  B.names = () => CY.ini.bool(CY.game.cfg, 'play', 'backend_send_names');

  /* ---------- 握手 ---------- */
  const hs = { url: null, t: 0, busy: false };
  B.ensureHello = () => {
    if (!useHttp()) { B.caps = null; B.driven = {}; return; }
    const u = CY.ini.get(CY.game.cfg, 'play', 'backend_url');
    if (B.caps && B.caps.url === u) return;
    if (hs.busy || (hs.url === u && Date.now() - hs.t < 30000)) return;
    Object.assign(hs, { busy: true, url: u, t: Date.now() });
    B.pending++;
    CY.backendHttp.hello().then(r => {
      B.caps = { url: u, name: String(r.name || '').slice(0, 48), version: String(r.version || '').slice(0, 24), handles: Object.assign({ events: true, strategies: true, lines: true }, r.handles && typeof r.handles === 'object' ? r.handles : {}) };
      B.failed = false;
    }, e => { B.caps = null; fail(e); }).then(() => { hs.busy = false; B.pending--; });
  };
  B.handles = k => (B.caps ? B.caps.handles[k] !== false : false);
  B.isDriven = (pid, name) => !!(useHttp() && B.driven[pid] && B.driven[pid].includes(name));
  B.noteDrives = d => {
    B.driven = {};
    if (d && typeof d === 'object') for (const id in d) if (Array.isArray(d[id])) B.driven[id] = d[id].filter(x => typeof x === 'string').slice(0, 40);
  };

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
  const fail = (e) => {
    if (!B.failed) { B.failed = true; CY.game.backendError && CY.game.backendError(e); }
  };
  const track = pr => { B.pending++; return pr.then(v => { B.pending--; return v; }, e => { B.pending--; throw e; }); };

  /* 返回 { states, strategies }（内置）或 Promise（远程，出错退回内置） */
  B.plan = req => {
    const P = CY.protocol, local = () => P.sanitizePlan(CY.backendLocal.plan(req));
    B.ensureHello();
    if (!useHttp() || !B.caps || B.caps.handles.strategies === false) return local();
    return track(CY.backendHttp.plan(req)).then(r => { B.failed = false; return P.sanitizePlan(r); }, e => { fail(e); return local(); });
  };

  /* 返回数组（内置）或 Promise（远程）。指令都经过检查。远程不管事件时，内置的事件指令排在前面，远程的积分指令排在后面 */
  B.drive = req => {
    const P = CY.protocol, local = () => P.sanitize(CY.backendLocal.drive(req).directives);
    B.ensureHello();
    if (!useHttp()) return local();
    if (!B.caps) return local();
    const compose = B.caps.handles.events === false;
    if (compose && req.trigger === 'action') return local();
    const base = compose ? local() : [];
    return track(CY.backendHttp.drive(req)).then(r => { B.failed = false; B.noteDrives(r.drives); return base.concat(P.sanitize(r.directives)); }, e => { fail(e); B.driven = {}; return compose ? base : local(); });
  };

  /* 台词：先返回内置的，远程的回来了再通过 late 换上 */
  B.line = (req, late) => {
    const local = CY.backendLocal.line(req).text;
    B.ensureHello();
    if (useHttp() && late && B.caps && B.caps.handles.lines !== false) CY.backendHttp.line(req).then(r => { if (r && typeof r.text === 'string' && r.text) late(r.text.slice(0, 240)); }, fail);
    return local;
  };
})(globalThis.CY = globalThis.CY || {});
