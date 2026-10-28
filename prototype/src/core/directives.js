/* 带时限的标记，后端的指令怎么执行，向后端要指令。游戏本体的这一块只负责执行，决定发生什么的是后端。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store;
  const t = (k, v) => CY.t(k, v);
  const { emit, clamp, pick } = G._h;
  /* ---------- 带时限的标记，和后端的往来 ---------- */
  G.flag = (p, n) => { const f = (p.state.flags || {})[n]; return f && (f.until === undefined || f.until > G.world.game_minutes) ? f : null; };
  G.setFlag = (p, n, o = {}) => {
    p.state.flags = p.state.flags || {};
    const f = {};
    if (o.minutes) f.until = G.world.game_minutes + o.minutes;
    for (const k of ['value', 'place', 'room', 'mode']) if (o[k] !== undefined) f[k] = o[k];
    p.state.flags[n] = f;
  };
  G.clearFlag = (p, n) => { if (p.state.flags) delete p.state.flags[n]; };
  const initNeeds = p => { for (const k of Object.keys(G.needsOf(p))) if (typeof p.state.needs[k] !== 'number') p.state.needs[k] = 0.1 + Math.random() * 0.2; };
  /* 台词：向后端要一句。late 是远程后端晚回来时换上去的回调 */
  G.sayLine = (p, group, key, situation, late) => {
    if (!CY.backend) return null;
    const req = { v: 1, kind: 'line', person: CY.protocol.person(p, { names: CY.backend.names() }), group, key, situation: situation || {}, world: CY.protocol.world() };
    const tx = CY.backend.line(req, late);
    return tx ? G.fmt(tx, p) : null;
  };
  /* 执行后端的指令。collect 为真时，第一句 speech 不弹出来，而是返回给调用的人当作这次动作的回话 */
  G.applyDirectives = function (list, opts = {}) {
    let said = null;
    for (const d of list) {
      const p = G.get(d.person); if (!p) continue;
      const s = p.state;
      switch (d.op) {
        case 'flag_set': G.setFlag(p, d.name, d); break;
        case 'flag_clear': G.clearFlag(p, d.name); break;
        case 'need': if (d.need in s.needs) s.needs[d.need] = clamp(s.needs[d.need] + d.delta); break;
        case 'mood': s.mood = clamp(s.mood + d.delta); break;
        case 'frailty': s.frailty = clamp(s.frailty + d.delta); break;
        case 'condition_add':
          if (!(p.person.conditions || []).includes(d.id)) { p.person.conditions = (p.person.conditions || []).concat(d.id); store.writeYaml(`people/${p.id}/person.yaml`, p.person); initNeeds(p); }
          break;
        case 'condition_remove': p.person.conditions = (p.person.conditions || []).filter(x => x !== d.id); store.writeYaml(`people/${p.id}/person.yaml`, p.person); break;
        case 'counter': p.story.counters = p.story.counters || {}; p.story.counters[d.name] = (p.story.counters[d.name] || 0) + d.delta; break;
        case 'log': G.log(p.id, d.type, d.text || t(d.key, Object.assign({ name: p.person.name }, d.args))); break;
        case 'say': {
          const text = d.text ? G.fmt(d.text, p) : d.tkey ? t(d.tkey, { name: p.person.name }) : G.sayLine(p, d.group, d.key);
          if (!text) break;
          if (opts.collect && d.kind === 'speech' && said === null) said = text; else G.toastFor(p, text, d.kind);
          break;
        }
      }
    }
    G.save(); emit();
    return said;
  };
  /* 向后端要指令。内置后端立刻返回并执行，返回 { said }；远程后端返回 Promise，回来再执行 */
  G.drive = function (trigger, extra = {}) {
    if (!CY.backend) return null;
    const now = G.world.game_minutes, expired = [];
    if (trigger === 'tick') for (const p of G.people) for (const n in p.state.flags || {}) { const f = p.state.flags[n]; if (f.until !== undefined && f.until <= now) expired.push({ person: p.id, name: n }); }
    const req = CY.backend.build(trigger, Object.assign({}, extra, { expired }));
    const finish = list => {
      const said = G.applyDirectives(list, { collect: extra.collect });
      for (const e of expired) { const p = G.get(e.person); const f = p && p.state.flags && p.state.flags[e.name]; if (f && f.until !== undefined && f.until <= now) delete p.state.flags[e.name]; }
      return { said };
    };
    const r = CY.backend.drive(req);
    return Array.isArray(r) ? finish(r) : (r.then(finish), null);
  };
  /* 时间推进里的调用：远程后端不要每秒请求，攒几秒一次 */
  let driveAcc = 0, driveLast = 0;
  G.driveTick = gmin => {
    driveAcc += gmin;
    const http = ini.get(G.cfg, 'play', 'backend_provider') === 'http';
    if (http && Date.now() - driveLast < 5000) return;
    driveLast = Date.now();
    const m = driveAcc; driveAcc = 0;
    G.drive('tick', { minutes: m });
  };

})(globalThis.CY = globalThis.CY || {});
