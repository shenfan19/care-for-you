/* 贡献统计：谁照顾了谁，谁盯着孩子多久，谁夜里被叫醒，谁做了饭，谁的需求没有被顾上。按游戏日记，每天一份，留最近多少天和多重算没被顾上，在 templates/engine.yaml 的 ledger 里。
   这是一个可选模块，总开关是 templates/system.yaml 的 modules.ledger，默认关，只在开发者模式里看。关着的时候，听到事件什么也不记，也不占存档。
   本模块只听 G.bus，不被任何别的系统调用，别的系统也不知道它在不在；拆掉它，删掉这个文件和清单里的一行即可。

   听的事件：
     care     { kind: player 玩家做的 | family 家人照顾家人 | self 自己照顾自己 | social 家人之间的聊天玩耍, actor, target, action }
              玩家做的，actor 是玩家扮演的角色，没有主角时是 null，记成 you
     watch    { actor, target, minutes }  盯着一个婴幼儿的时间，由看护调度发出
     wake     { actor, night }            被叫醒去看护
     cook     { actor, minutes }          做了一顿饭
     advance  { gmin, offline }           时间走过，据此统计有人需求压到八成以上的时间
   数据：G.world.ledger = { days: { 第几天: { acts, watch, wakes, cooks, neglect, names } } }
   统计要较真：每一次出手都经过同一个入口，所以和发生的事里的记录条数一一对应，tests/ledger_test.js 核对这一条。
   访客不算家里人，不进统计。 */
(function (CY) {
  const G = CY.game;
  const L = G.ledger = {};
  const on = () => G.module('ledger');
  const store = () => (G.world.ledger = G.world.ledger || { days: {} });
  const today = () => {
    const n = G.gameDate().n, s = store();
    return s.days[n] || (s.days[n] = { acts: {}, watch: {}, wakes: {}, cooks: {}, neglect: {}, names: {} });
  };
  const fam = id => { const p = G.get(id); return !!p && !p.person.visitor; };
  const remember = (d, id) => { const p = G.get(id); if (p) d.names[id] = p.person.name; };
  const trim = () => { const s = store(), ks = Object.keys(s.days).map(Number).sort((a, b) => a - b); while (ks.length > G.E('ledger').keep_days) delete s.days[ks.shift()]; };

  G.bus.on('care', e => {
    if (!on() || !e.target || !fam(e.target) || (e.actor && !fam(e.actor))) return;
    const d = today(), a = e.actor || 'you', key = a + '>' + e.target;
    const c = d.acts[key] = d.acts[key] || { n: 0, by: {}, kinds: {} };
    c.n++; c.by[e.action] = (c.by[e.action] || 0) + 1; c.kinds[e.kind] = (c.kinds[e.kind] || 0) + 1;
    remember(d, e.target); if (e.actor) remember(d, e.actor);
    trim();
  });
  G.bus.on('watch', e => {
    if (!on() || !fam(e.actor) || !fam(e.target)) return;
    const d = today(), key = e.actor + '>' + e.target;
    d.watch[key] = (d.watch[key] || 0) + e.minutes; remember(d, e.actor); remember(d, e.target);
  });
  G.bus.on('wake', e => { if (!on() || !fam(e.actor)) return; const d = today(); d.wakes[e.actor] = (d.wakes[e.actor] || 0) + 1; remember(d, e.actor); });
  G.bus.on('cook', e => { if (!on() || !fam(e.actor)) return; const d = today(); d.cooks[e.actor] = (d.cooks[e.actor] || 0) + 1; remember(d, e.actor); });
  /* 谁的哪一项需求压到八成以上，压了多少游戏分钟。离线推进不算：离线的需求涨得慢，也没有人能照顾 */
  G.bus.on('advance', e => {
    if (!on() || e.offline) return;
    const d = today();
    for (const p of G.activePeople()) {
      if (p.person.visitor || !G.isHuman(p)) continue;
      for (const k in p.state.needs) if (G.need(p, k) >= G.E('ledger').urgent_level) { const o = d.neglect[p.id] = d.neglect[p.id] || {}; o[k] = (o[k] || 0) + e.gmin; remember(d, p.id); }
    }
  });

  /* ---------- 读 ---------- */
  L.enabled = on;
  L.days = () => Object.keys(store().days).map(Number).sort((a, b) => a - b);
  /* 把几天合起来：from 到 to 含两端，缺省是全部 */
  L.sum = (from, to) => {
    const out = { acts: {}, watch: {}, wakes: {}, cooks: {}, neglect: {}, names: {}, days: 0 };
    for (const n of L.days()) {
      if ((from !== undefined && n < from) || (to !== undefined && n > to)) continue;
      const d = store().days[n]; out.days++;
      Object.assign(out.names, d.names);
      for (const k in d.acts) { const c = out.acts[k] = out.acts[k] || { n: 0, by: {}, kinds: {} }; c.n += d.acts[k].n; for (const x in d.acts[k].by) c.by[x] = (c.by[x] || 0) + d.acts[k].by[x]; for (const x in d.acts[k].kinds) c.kinds[x] = (c.kinds[x] || 0) + d.acts[k].kinds[x]; }
      for (const f of ['watch', 'wakes', 'cooks']) for (const k in d[f]) out[f][k] = (out[f][k] || 0) + d[f][k];
      for (const k in d.neglect) { const o = out.neglect[k] = out.neglect[k] || {}; for (const x in d.neglect[k]) o[x] = (o[x] || 0) + d.neglect[k][x]; }
    }
    return out;
  };
  L.nameOf = (sum, id) => (id === 'you' ? 'you' : (G.get(id) && G.get(id).person.name) || sum.names[id] || id);
  /* 二维表：行是出手的人，列是被照顾的人，格子是次数 */
  L.matrix = sum => {
    const actors = [], targets = [], cell = {};
    for (const k in sum.acts) { const [a, t] = k.split('>'); if (!actors.includes(a)) actors.push(a); if (!targets.includes(t)) targets.push(t); cell[k] = sum.acts[k]; }
    const give = {}, got = {};
    for (const k in cell) { const [a, t] = k.split('>'); give[a] = (give[a] || 0) + cell[k].n; got[t] = (got[t] || 0) + cell[k].n; }
    return { actors, targets, cell, give, got };
  };
  /* 总数：用来核对和发生的事里的记录条数一致 */
  L.total = (sum, kind) => { let n = 0; for (const k in sum.acts) n += kind ? (sum.acts[k].kinds[kind] || 0) : sum.acts[k].n; return n; };
})(globalThis.CY = globalThis.CY || {});
