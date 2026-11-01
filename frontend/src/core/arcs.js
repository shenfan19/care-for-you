/* 病程：一种病带着一小段故事，按阶段往前走。
   疾病模板里写 arc 列表，每个阶段有 id，after_days（距上一阶段至少过几个游戏日），min_care（这段时间里至少照顾几次这个病的需求），effect（心情，虚弱度的变化）。
   进度存在每个人的 story.yaml 的 arcs 里：{ 病名: { stage, day, cares, done } }，走到下一阶段就立即存档，读档后从原处接着走，不会重复触发。
   条件不够时阶段就停着等，没有惩罚，没有倒退；世界暂停期间游戏日不走，所以离开多久都不会跳阶段。
   阶段的文字在语言包里，键是 arc.病名.阶段 id。 */
(function (CY) {
  const G = CY.game;
  const { emit, clamp } = G._h;
  const today = () => Math.floor(G.world.game_minutes / 1440);

  G.arcOf = c => ((G.tpl.conditions[c] || {}).arc) || [];
  G.arcState = (p, c) => ((p.story.arcs || {})[c]) || null;
  /* 这个人当前得的病里，有故事的，取得到或建出进度 */
  G.arcEnsure = (p, c) => {
    p.story.arcs = p.story.arcs || {};
    if (!p.story.arcs[c]) p.story.arcs[c] = { stage: 0, day: today(), cares: 0, done: false };
    return p.story.arcs[c];
  };
  /* 照顾了这个病的需求，算这一阶段的一次照顾 */
  G.arcCare = (p, a) => {
    for (const c of p.person.conditions || []) {
      if (!G.arcOf(c).length) continue;
      const needs = (G.tpl.conditions[c] || {}).needs || {};
      if (Object.keys(a.effect || {}).some(k => k in needs && a.effect[k] < 0)) G.arcEnsure(p, c).cares++;
    }
  };
  G.arcTick = () => {
    let moved = false;
    for (const p of G.activePeople()) {
      if (!G.isHuman(p) || G.isSleeping(p) || G.flag(p, 'hospital') || G.flag(p, 'outing')) continue;
      for (const c of p.person.conditions || []) {
        const arc = G.arcOf(c); if (!arc.length) continue;
        const st = G.arcEnsure(p, c);
        if (st.done) continue;
        const next = arc[st.stage];
        if (!next) { st.done = true; moved = true; continue; }
        if (today() - st.day < (next.after_days || 0) || st.cares < (next.min_care || 0)) continue;
        st.stage++; st.day = today(); st.cares = 0; if (st.stage >= arc.length) st.done = true;
        const e = next.effect || {};
        if (e.mood) p.state.mood = clamp(p.state.mood + e.mood);
        if (e.frailty) { const was = p.state.frailty; p.state.frailty = clamp(p.state.frailty + e.frailty); G.frailCross(p, was); }
        const key = 'arc.' + c + '.' + next.id;
        G.logK(p.id, 'arc', key, { name: p.person.name });
        G.toastFor(p, G.fmt(CY.t(key, { name: p.person.name }), p), 'soft');
        moved = true;
      }
    }
    if (moved) { G.save(true); emit(); }
  };
})(globalThis.CY = globalThis.CY || {});
