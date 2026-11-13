/* 适配层：远程后端说核心接口。握手里声明了 core 的后端，游戏在每次推进的请求里带上按来源合并过的手柄写入，
   它回的读数按概念对到需求，再由游戏照旧校验：不认识的概念丢掉，数值截到 0 到 1，不存在的角色丢掉。
   没声明 core 的老后端完全不受影响，还是原来的指令与 drives。对应关系在 data/lm/concepts.yaml。 */
(function (CY) {
  const R = CY.coreRemote = { cfg: null };
  const load = () => { if (!R.cfg) { const T = CY.game.T(); R.cfg = Object.assign({}, jsyaml.load(T['templates/lm/concepts.yaml']), { source_priority: jsyaml.load(T['templates/lm/adapter_config.yaml']).source_priority }); } return R.cfg; };
  const clamp01 = x => Math.min(1, Math.max(0, x));
  /* 握手里的 core：读数概念和手柄概念，只留名字是字符串的，手柄的 mode 只能是 level 或 total */
  R.helloCore = raw => {
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return null;
    const readouts = (Array.isArray(raw.readouts) ? raw.readouts : []).filter(c => typeof c === 'string').slice(0, 64), handles = {};
    for (const c in raw.handles && typeof raw.handles === 'object' ? raw.handles : {}) { const m = raw.handles[c] && raw.handles[c].mode; if (m === 'level' || m === 'total') handles[String(c).slice(0, 48)] = { mode: m }; }
    return { readouts, handles };
  };
  /* 一个角色这一次推进里做过的动作 [{ id, source }]，写成手柄：同一个概念 level 取优先级最高的来源，total 求和 */
  R.handlesFor = (actions, core) => {
    const cfg = load(), by = {};
    for (const a of actions || []) for (const w of cfg.actions[a.id] || []) { const hd = core && core.handles[w.concept]; if (core && (!hd || hd.mode !== w.mode)) continue; (by[w.concept] = by[w.concept] || { mode: w.mode, list: [] }).list.push({ mode: w.mode, value: w.value, source: a.source }); }
    return Object.keys(by).map(concept => {
      const m = CY.coreSources.merge(by[concept].list, cfg.source_priority), mode = by[concept].mode;
      return { concept, mode, value: mode === 'total' ? m.total : m.level, source: mode === 'total' ? 'player' : m.source };
    });
  };
  /* 回来的读数 { 角色编号: { 概念: 值 } } 变成需求指令，并给出这个后端替这些角色管着哪些需求。后端只能回它握手里声明过的概念 */
  R.fromReadouts = (readouts, core) => {
    const cfg = load(), G = CY.game, directives = [], drives = {}, byConcept = {};
    for (const n in cfg.needs) byConcept[cfg.needs[n]] = n;
    for (const pid in readouts && typeof readouts === 'object' ? readouts : {}) {
      const p = G.get(pid), r = readouts[pid]; if (!p || !r || typeof r !== 'object') continue;
      for (const c in r) {
        const need = byConcept[c]; if (!need || (core && !core.readouts.includes(c)) || !(need in p.state.needs) || typeof r[c] !== 'number' || !isFinite(r[c])) continue;
        directives.push({ op: 'need_set', person: pid, need, value: 1 - clamp01(r[c]) });
        (drives[pid] = drives[pid] || []).push(need);
      }
    }
    return { directives, drives };
  };
})(globalThis.CY = globalThis.CY || {});
