/* 看护调度：适配层。把游戏的状态翻译成策略模块要的快照，把策略模块给的分配翻译成游戏里的动作。
   策略模块是 dispatch_policy.js，纯计算，不依赖游戏；本文件是它和游戏之间唯一的接口，别处不直接碰策略模块。

   上游，只读这些：
     G.activePeople G.isHuman G.stage G.classOf G.need G.urgency G.isSleeping G.bedridden G.flag G.protagonist G.isNight
     G.world.game_minutes G.world.feeding CY.world.locationOf G.tpl.system.dispatch（参数）
   下游，只写这些：
     G.setFlag(人, 'awake' 或 'nap')、G.clearFlag、G.act[人]（重算）
     G.setNeed(看护人, 'rest')（疲劳增量）、applyEffects（被照顾人的需求）、被照顾人的 mood
     CY.world.goTo（看护人走到婴儿房间）、G.shareMeal（做饭）、G.logK（发生的事）
   引擎里和本模块有关的触点，一共三处，拆掉本模块时一并去掉：
     game.js 的 tick 里调用 G.dispatchTick；game.js 的 activityOf 认 'awake' 标记；seed.js 里 system.yaml 的 dispatch 参数块。
   运行时状态 D.state（现任看护人，手上的活到几点，上一顿饭）和统计 D.stat 都只在内存里，不存档。
   总开关是 modules.dispatch，在 templates/system.yaml 里。
   事件：每次出手，盯人，叫醒，做饭都往 G.bus 发一条，统计模块自己听，本模块不知道谁在听。
   可换实现：D.policy 设成函数（快照，参数）返回分配，就替换本地规则，D.validate 会先核硬约束。
   步长按游戏分钟，不依赖真实时间。 */
(function (CY) {
  const G = CY.game, P = CY.dispatchPolicy;
  const { clamp, applyEffects } = G._h;
  const D = G.dispatch = { policy: null, state: { duty: {}, hands: {}, last: null }, stat: {} };
  const cfg = () => P.config(G.tpl && G.tpl.system && G.tpl.system.dispatch);
  D.cfg = cfg; D.plan = P.plan;
  D.validate = (raw, S, C) => { const r = P.validate(raw, S, C); if (r.rejected) D.stat.rejected = (D.stat.rejected || 0) + 1; return r.plan; };

  /* ---------- 上游：游戏状态到快照 ---------- */
  D.snapshot = () => {
    const C = cfg(), lead = G.protagonist(), now = G.world.game_minutes, W = CY.world;
    const eaters = G.activePeople().filter(q => G.isHuman(q) && !['infant', 'toddler'].includes(G.stage(q)) && !G.isSleeping(q) && q !== lead);
    const mealT = D.state.mealT === undefined ? -1e9 : D.state.mealT;
    return {
      t: now, night: !!G.isNight(), duty: Object.assign({}, D.state.duty), feeding: G.world.feeding || 'formula',
      meal_due: now - mealT >= C.meal_gap && eaters.some(q => G.need(q, 'hunger') >= C.meal_at),
      people: G.activePeople().filter(p => G.isHuman(p)).map(p => {
        const loc = W ? W.locationOf(p) : { place: 'home', room: 'living' };
        const needs = {}; for (const k in p.state.needs) needs[k] = G.need(p, k);
        return {
          id: p.id, stage: G.stage(p), lactating: C.lactating.includes(p.person.archetype || p.person.card || ''), dep: !!G.classOf(p).needs_caregiver,
          lead: p === lead, asleep: G.isSleeping(p), bedridden: !!G.bedridden(p),
          away: !!(G.flag(p, 'hospital') || G.flag(p, 'outing') || loc.place !== 'home'), room: loc.room,
          fatigue: needs.rest === undefined ? 0 : needs.rest, needs, urgency: G.urgency(p), hands: (D.state.hands[p.id] || 0) > now,
        };
      }),
    };
  };

  /* ---------- 下游：分配到游戏动作 ---------- */
  /* 挑一个能缓解这项需求的照顾动作：效果里有这项，收益是各项效果乘当前压力之和，最大的赢 */
  const careActionFor = (target, need, C) => {
    let best = null, gain = 0;
    for (const a of Object.values(G.actionsOf(target))) {
      if (a.selfonly || C.skip_actions.includes(a.id) || a.away || a.outing) continue;
      if (a.gate && G.need(target, a.gate.need) < a.gate.min) continue;
      const e = a.effect && a.effect[need]; if (!(e > 0)) continue;
      let g = 0; for (const k in a.effect) if (a.effect[k] > 0) g += G.need(target, k) * a.effect[k];
      if (g > gain) { gain = g; best = a; }
    }
    return best;
  };
  D.apply = (plan, C) => {
    C = C || cfg();
    const now = G.world.game_minutes, W = CY.world, st = D.state, step = C.step_minutes, S = D.stat;
    const get = id => G.get(id), ok = q => q && q.person.active !== false && !G.flag(q, 'hospital') && !G.flag(q, 'outing');
    const tire = (q, x) => G.setNeed(q, 'rest', G.need(q, 'rest') + x);
    for (const id of plan.wake) {
      const q = get(id); if (!ok(q) || q === G.protagonist()) continue;
      G.clearFlag(q, 'nap'); G.setFlag(q, 'awake', { minutes: step * 3 }); G.act[q.id] = G.activityOf(q);
      S.wakes = (S.wakes || 0) + 1; S.wakeBy = S.wakeBy || {}; S.wakeBy[id] = (S.wakeBy[id] || 0) + 1;
      G.bus.emit('wake', { actor: id, night: !!G.isNight() });
    }
    for (const id in plan.watch) {
      const dep = get(id), who = plan.watch[id] && get(plan.watch[id]);
      if (!dep) continue;
      if (!ok(who) || who === G.protagonist()) { delete st.duty[id]; S.unmetMin = (S.unmetMin || 0) + step; continue; }
      if (st.duty[id] && st.duty[id] !== who.id) S.handoffs = (S.handoffs || 0) + 1;
      st.duty[id] = who.id;
      G.setFlag(who, 'awake', { minutes: step * 3 });
      const lw = W && W.locationOf(who), ld = W && W.locationOf(dep);
      if (W && lw.room !== ld.room && lw.place === ld.place) W.goTo(who, ld.room, 0.7, 'help');
      tire(who, P.model.watchFatigue(C, step));
      S.watchMin = (S.watchMin || 0) + step;
      G.bus.emit('watch', { actor: who.id, target: dep.id, minutes: step });
    }
    for (const id in st.duty) { const dep = get(id); if (!dep || G.isSleeping(dep) || !(id in plan.watch)) delete st.duty[id]; }
    for (const id of plan.sleep) {
      const q = get(id); if (!ok(q) || q === G.protagonist() || G.isSleeping(q)) continue;
      G.clearFlag(q, 'awake'); G.setFlag(q, 'nap', { minutes: C.nap_minutes }); G.act[q.id] = G.activityOf(q); S.sleeps = (S.sleeps || 0) + 1;
    }
    for (const k of plan.tasks) {
      const who = get(k.cg), dep = get(k.target); if (!ok(who) || !dep || G.need(dep, k.need) < C.act_at) continue;
      const a = careActionFor(dep, k.need, C); if (!a) continue;
      applyEffects(dep, a, P.model.efficiency(C, G.need(who, 'rest')));
      dep.state.mood = clamp(dep.state.mood + 0.03);
      if (a.nap && G.isHuman(dep)) G.setFlag(dep, 'nap', { minutes: G.realMin(a.nap) });
      G.act[dep.id] = G.activityOf(dep);
      const mins = Math.max(step, a.min || step); st.hands[who.id] = now + mins;
      tire(who, P.model.handsFatigue(C, mins));
      G.logK(dep.id, 'care', 'log.assist', { who: who.person.name, name: dep.person.name, label: G.refAct(a, dep) });   /* who 是出手的人，name 是被照顾的人，和 agents.js 一致 */
      G.bus.emit('care', { kind: 'family', actor: who.id, target: dep.id, action: a.id });
      S.tasks = (S.tasks || 0) + 1; S.byAct = S.byAct || {}; S.byAct[a.id] = (S.byAct[a.id] || 0) + 1;
    }
    if (plan.cook) {
      const who = get(plan.cook), meal = G.tpl.species.human.actions && G.tpl.species.human.actions.meal;
      if (ok(who) && meal) {
        G.shareMeal(who, meal, C.efficiency); st.mealT = now; st.hands[who.id] = now + C.cook_minutes;
        tire(who, P.model.handsFatigue(C, C.cook_minutes));
        S.meals = (S.meals || 0) + 1;
        G.bus.emit('cook', { actor: who.id, minutes: C.cook_minutes });
      }
    }
    S.depletedSteps = (S.depletedSteps || 0) + plan.depleted.length;
  };

  D.tick = function () {
    const C = cfg(); if (!G.module('dispatch') || !G.activePeople().length) return;
    const now = G.world.game_minutes;
    if (D.state.last === null) { D.state.last = now; return; }
    if (now - D.state.last < C.step_minutes - 1e-6) return;
    D.state.last = now;
    const S = D.snapshot(), plan = D.policy ? D.validate(D.policy(S, C), S, C) : P.plan(S, C);
    D.apply(plan, C);
  };
  G.dispatchTick = D.tick;
})(globalThis.CY = globalThis.CY || {});
