/* 远程后端的传输：把协议里的请求用 POST 发到设置里的地址，收一份 JSON。
   默认不用。用的话只发快照，名字要在设置里打开才带。失败时由路由退回内置后端，不会卡住游戏。 */
(function (CY) {
  const H = CY.backendHttp = { name: 'http' };
  H.post = async (req) => {
    const ini = CY.ini, G = CY.game, url = ini.get(G.cfg, 'play', 'backend_url');
    if (!url) throw new Error('no_url');
    const ms = ini.num(G.cfg, 'play', 'backend_timeout') || 4000, ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req), signal: ctl.signal });
      if (!r.ok) throw new Error('http_' + r.status);
      const j = await r.json();
      if (!j || j.v !== 1) throw new Error('bad_version');
      return j;
    } finally { clearTimeout(timer); }
  };
  /* 握手：问一下对面是谁，哪些事它管。老后端不认识 hello，回一个没有 handles 的普通回应，路由按“全都管”处理 */
  H.hello = () => H.post({ v: 1, kind: 'hello', client: { name: 'care-for-you', version: (CY.meta || {}).version || '' } });
  H.drive = req => H.post(req);
  H.line = req => H.post(req);
  H.plan = req => H.post(req);
})(globalThis.CY = globalThis.CY || {});
