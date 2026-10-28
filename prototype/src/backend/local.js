/* 内置后端：最简单的一个。事件的规则在数据文件夹的 templates/events/rules.yaml，台词在 templates/content 的 YAML 里，
   都是明文，改了就生效。它只认协议里的请求，回协议里的指令，和远程后端用同一套接口。 */
(function (CY) {
  const pickOne = a => a[Math.floor(Math.random() * a.length)];
  const L = CY.backendLocal = { name: 'builtin' };

  /* 规则的触发条件 */
  const matches = (when, ps, w) => {
    if (!when) return true;
    if (when.sleeping !== undefined && !!ps.sleeping !== when.sleeping) return false;
    if (when.any_condition && !when.any_condition.some(c => ps.conditions.includes(c))) return false;
    if (when.all_conditions && !when.all_conditions.every(c => ps.conditions.includes(c))) return false;
    if (when.stage && !when.stage.includes(ps.stage)) return false;
    if (when.species && !when.species.includes(ps.species)) return false;
    if (when.hour_from !== undefined) {
      const a = when.hour_from, b = when.hour_to === undefined ? 24 : when.hour_to;
      if (!(a <= b ? w.hour >= a && w.hour < b : w.hour >= a || w.hour < b)) return false;
    }
    if (when.flag && !when.flag.every(f => ps.flags[f])) return false;
    if (when.no_flag && when.no_flag.some(f => ps.flags[f])) return false;
    if (when.care_total_in && !when.care_total_in.includes(ps.care_total)) return false;
    if (when.min_frailty !== undefined && ps.frailty < when.min_frailty) return false;
    return true;
  };
  const fill = (v, vars) => (typeof v === 'string' ? v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x, vars)])) : v);
  const expand = (items, ps, vars) => (items || []).map(it => Object.assign({ person: ps.id }, fill(it, vars)));

  /* 一条规则跑一遍：先做 do，再按概率走 then 里的某个结果 */
  const run = (r, ps, w, vars) => {
    const out = expand(r.do, ps, vars);
    if (r.then) {
      let c = r.then.chance === undefined ? 1 : r.then.chance;
      for (const s of r.then.scale || []) {
        if (s.frailty !== undefined) c *= 1 + ps.frailty * s.frailty;
        else if (s.age_over !== undefined) { if (ps.age !== null && ps.age > s.age_over) c *= s.mult; }
        else if (s.flag !== undefined) { if (ps.flags[s.flag]) c *= s.mult; }
        else if (s.param !== undefined) c *= (w.params && w.params[s.param] !== undefined ? w.params[s.param] : 1);
      }
      if (Math.random() < Math.min(1, c) && (r.then.outcomes || []).length) {
        const outs = r.then.outcomes, total = outs.reduce((a, o) => a + (o.weight || 1), 0);
        let x = Math.random() * total, chosen = outs[outs.length - 1];
        for (const o of outs) { x -= o.weight || 1; if (x <= 0) { chosen = o; break; } }
        out.push(...expand(chosen.do, ps, vars));
      }
    }
    return out;
  };

  L.drive = req => {
    const rules = (CY.game.tpl && CY.game.tpl.rules) || [], out = [], w = req.world || {};
    if (req.trigger === 'tick') {
      const hours = (req.minutes || 0) / 60;
      for (const ps of req.people || []) {
        const vars = { care_total: ps.care_total, name: ps.name };
        for (const e of (req.expired || []).filter(x => x.person === ps.id)) for (const r of rules) if (r.trigger === 'end' && r.flag === e.name && matches(r.when, ps, w)) out.push(...run(r, ps, w, vars));
        for (const r of rules) if (r.trigger === 'tick' && matches(r.when, ps, w) && Math.random() < Math.min(1, (r.rate_per_hour || 0) * hours)) out.push(...run(r, ps, w, vars));
      }
    } else if (req.trigger === 'action' && req.person) {
      const ps = req.person, vars = { care_total: ps.care_total, name: ps.name, action: req.action ? req.action.id : '' };
      for (const r of rules) {
        if (r.trigger !== 'action' || !matches(r.when, ps, w)) continue;
        if (Math.random() >= (r.chance === undefined ? 1 : r.chance)) continue;
        out.push(...run(r, ps, w, vars));
        if (r.stop) break;
      }
    }
    return { v: 1, directives: out };
  };

  /* 台词：角色自己写的，疾病里写的，声线里写的，按这个顺序找。ambient 不给 key 时按房间，时段，旧事自己挑一个 */
  L.line = req => {
    const G = CY.game, p = G.get(req.person && req.person.id);
    if (!p) return { v: 1, text: null };
    let key = req.key;
    const s = req.situation || {};
    if (req.group === 'ambient' && !key) {
      const hn = (req.person.counters || {}).hospital_n || 0;
      key = !s.asleep && hn > 0 && Math.random() < 0.18 ? 'memory_hospital' : !s.asleep && s.room && s.room !== 'ward' && Math.random() < 0.55 ? s.room : s.band;
    }
    let arr = G.lines(p, req.group, key);
    if (!arr.length && req.group === 'ambient' && s.band) arr = G.lines(p, req.group, s.band);
    return { v: 1, text: arr.length ? pickOne(arr) : null };
  };
})(globalThis.CY = globalThis.CY || {});
