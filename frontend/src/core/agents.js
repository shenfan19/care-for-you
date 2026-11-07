/* 前台的响应层：收后台发来的状态表和策略，每个角色按自己的状态决定响应不响应，响应了就走过去、动手。
   后台只管产生：谁向谁发了什么请求，谁有什么位置愿望。前台管：这个请求合不合个人卡，对方此刻愿不愿意，怎么走，怎么做。
   主角闲置时参与家人之间的照护，玩家接手后停止相关请求。
   几率和权重在 templates/system.yaml，这是内部总体设置，不是玩家的 settings.ini。 */
(function (CY) {
  const G = CY.game;
  const t = (k, v) => CY.t(k, v);
  const { clamp, applyEffects } = G._h;
  const NO_AUTO = new Set(['doctor', 'vet', 'listen', 'stayclose', 'album', 'remind', 'hand', 'chat', 'walkout', 'game']);

  G.wants = {};                 /* 位置愿望，运行时的，不存档：{ 人: { id, action, until } } */
  const S = { inbox: [], declined: [], planT: null, lastMin: null, seq: 0 };   /* planT 第一次用时从配置里取 */
  G.agentState = S;
  const cfg = () => G.S('agents');
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- 个人卡的判断，前台再核一遍，不全信后台 ---------- */
  const eligibleTo = p => p && p.person.active !== false && !G.playerControls(p) && !G.isSleeping(p) && !G.flag(p, 'hospital') && !G.flag(p, 'outing') && !G.flag(p, 'offduty');
  /* 别人能为这个人的某个需求做的动作：能降低这个需求的，不是特殊动作 */
  const careAction = (p, need) => {
    let best = null, gain = 0;
    for (const a of Object.values(G.allActionsOf(p))) {
      if (a.selfonly || NO_AUTO.has(a.id) || a.away || a.outing) continue;
      const e = a.effect && a.effect[need];
      if (!(e > 0)) continue;
      let g = 0; for (const k in a.effect) if (a.effect[k] > 0) g += G.need(p, k) * a.effect[k];
      g += Math.random() * cfg().pick_noise;
      if (g > gain) { gain = g; best = a; }
    }
    return best;
  };
  const goAction = (p, id) => { const a = G.actionsOf(p)[id]; return a && a.outing ? a : null; };
  const GO_ALONE = ['teen', 'adult', 'elder'];
  const valid = e => {
    const from = G.get(e.from), to = G.get(e.to);
    if (!from || !to || G.playerControls(from) || G.playerControls(to)) return false;
    if (e.kind === 'care') return from.person.active !== false && !G.flag(from, 'hospital') && !G.flag(from, 'outing') && to !== from && G.canHelp(to) && !!careAction(from, e.need);
    if (from === G.protagonist() || to === G.protagonist()) return false;  /* 主角的自理沿用原流程，外出由玩家决定 */
    if (e.kind === 'self') return to === from && !!G.selfActFor(from, e.need);
    if (e.kind === 'go' && e.to === e.from && G.needsEscort(from)) return false;   /* 要人陪的人不会自己出门 */
    if (e.kind === 'go' && G.legsBad(from) && !G.unlocked('wheelchair')) return false;
    if (e.kind === 'go') return !!goAction(from, e.action) && (to === from ? G.isHuman(from) && GO_ALONE.includes(G.stage(from)) : G.canHelp(to));
    return false;
  };

  /* ---------- 接收后台的状态表和策略 ---------- */
  function receive(plan) {
    const W = cfg().want, now = Date.now();
    for (const r of plan.states) {
      const p = G.get(r.person); if (!p) continue;
      for (const k in r.needs || {}) if (k in p.state.needs) p.state.needs[k] = r.needs[k];
      if (r.mood !== undefined) p.state.mood = r.mood;
      if (r.frailty !== undefined) p.state.frailty = r.frailty;
      if (r.want && p !== G.protagonist() && !G.wants[p.id] && goAction(p, r.want.action) && eligibleTo(p)) {
        G.wants[p.id] = { id: r.want.id, action: r.want.action, until: now + W.ttl_seconds * 1000 };
        G.toastFor(p, goAction(p, r.want.action).label + '…', 'soft');
        G.pop(p.id, 'ask', goAction(p, r.want.action).icon || '🚶');
      }
    }
    const max = cfg().request.max_open;
    for (const s of plan.strategies) {
      if (S.inbox.length >= max) break;
      const e = Object.assign({ id: ++S.seq, born: now, phase: 'sent', wait: rnd(...cfg().request.wait_seconds), tries: 0 }, s);
      if (valid(e)) { S.inbox.push(e); if (e.kind !== 'go') G.pop(e.from, 'ask', ((G.needsOf(G.get(e.from)) || {})[e.need] || {}).icon || '💬'); }
    }
  }

  /* ---------- 对方此刻愿不愿意：看自己的状态 ---------- */
  /* 帮忙概率表：帮手是谁（卡片或年龄阶段），被帮的是谁（宝宝，宠物，其他），帮手身体好不好，查 system.yaml 里的表；表里没有的组合用 base */
  const targetKind = p => (!G.isHuman(p) ? 'pet' : ['infant', 'toddler'].includes(G.stage(p)) ? 'baby' : 'other');
  G.helpRow = (helper, target) => {
    const tk = targetKind(target), arch = helper.person.archetype || helper.person.card || '', st = G.stage(helper);
    return (cfg().respond.table).find(r => r.target === tk && ((r.helper.arch && r.helper.arch.includes(arch)) || (r.helper.stage && r.helper.stage.includes(st)))) || null;
  };
  G.helpWell = p => { const R = cfg().respond; return p.state.frailty < R.well_frailty && G.maxNeed(p) <= 1 - R.well_level; };
  function respondChance(e) {
    const R = cfg().respond, to = G.get(e.to);
    if (!eligibleTo(to)) return 0;
    if (e.kind === 'self') return R.self;
    if (e.kind === 'go' && e.to === e.from) return cfg().want.respond_alone;
    if (G.maxNeed(to) > 1 - R.own_level_block) return 0;
    const row = e.kind === 'care' && G.get(e.from) ? G.helpRow(to, G.get(e.from)) : null;
    const mw = row ? R.mood_weight_table : R.mood_weight;
    const base = row ? (G.helpWell(to) ? row.well : row.poor) : R.base;
    return clamp(base * (1 - mw / 2 + mw * to.state.mood), 0, 1);
  }
  G.respondChance = respondChance;
  const cooldown = e => S.declined.push({ from: e.from, to: e.to, key: e.need || e.action, until: Date.now() + cfg().respond.decline_cooldown_seconds * 1000 });
  /* 走过去：不在同一个房间就先走到对方那里 */
  function approach(e) {
    const R = cfg().respond, W = CY.world, to = G.get(e.to), from = G.get(e.from);
    if (e.to === e.from || !W) { e.wait = R.near_seconds; return; }
    const tl = W.locationOf(from), hl = W.locationOf(to);
    if (tl.place === hl.place && tl.room !== hl.room && W.goTo(to, tl.room, cfg().walk_minutes, 'help')) e.wait = R.walk_seconds; else e.wait = R.near_seconds;
  }

  /* ---------- 动手 ---------- */
  const doCare = e => {
    const from = G.get(e.from), to = G.get(e.to);
    if (G.need(from, e.need) < cfg().care_min_level) return true;
    const a = careAction(from, e.need); if (!a) return true;
    applyEffects(from, a, ((to.person.help && to.person.help.efficiency) || cfg().respond.efficiency));
    G.bus.emit('care', { kind: 'family', actor: to.id, target: from.id, action: a.id });
    from.state.mood = clamp(from.state.mood + cfg().care_mood);
    const txt = t('log.assist', { who: to.person.name, name: from.person.name, label: a.label });
    G.logK(from.id, 'care', 'log.assist', { who: to.person.name, name: from.person.name, label: G.refAct(a, from) }); G.toastFor(from, txt, 'soft'); G.playFx(from.id, a.id);
    return true;
  };
  const doSelf = e => {
    const p = G.get(e.from), a = G.selfActFor(p, e.need);
    if (a && G.need(p, e.need) > cfg().self_min_level) G.selfAct(p, a, e.need, false);
    return true;
  };
  const doGo = e => {
    const from = G.get(e.from), to = G.get(e.to), a = goAction(from, e.action), W = CY.world;
    delete G.wants[from.id];
    if (!a || !eligibleTo(from)) return true;
    if (to !== from) {
      if (!eligibleTo(to) || !W || W.locationOf(to).place !== W.locationOf(from).place) return true;
      G.setFlag(to, 'outing', { minutes: G.outingMinutes(a.outing), place: a.outing.place, room: a.outing.room, mode: 'stand' });
    }
    applyEffects(from, a, 1);
    if (to !== from) G.bus.emit('care', { kind: 'family', actor: to.id, target: from.id, action: a.id });
    from.state.mood = clamp(from.state.mood + (a.mood === undefined ? cfg().go_mood_default : a.mood));
    if (to !== from) { const txt = t('log.assist', { who: to.person.name, name: from.person.name, label: a.label }); G.logK(from.id, 'care', 'log.assist', { who: to.person.name, name: from.person.name, label: G.refAct(a, from) }); G.toastFor(from, txt, 'soft'); }   /* 先记谁带谁出门，再记出门这件事 */
    G.startOuting(from, a); G.pop(from.id, 'done', '✓');
    return true;
  };

  /* ---------- 每秒 ---------- */
  G.agentTick = function (dt) {
    const now = Date.now(), P = G.S('plan');
    for (const id in G.wants) if (G.wants[id].until < now || !G.get(id) || G.flag(G.get(id), 'outing')) delete G.wants[id];
    S.declined = S.declined.filter(x => x.until > now);
    /* 向后台要一次状态和策略 */
    if (S.planT === null) S.planT = cfg().first_plan_seconds;
    S.planT -= dt;
    if (S.planT <= 0 && CY.backend) {
      S.planT = P.interval_seconds;
      const gm = G.world.game_minutes, minutes = S.lastMin === null ? 0 : Math.max(0, gm - S.lastMin);
      S.lastMin = gm;
      const res = CY.backend.plan(CY.backend.buildPlan({ minutes, pending: S.inbox.map(e => ({ from: e.from, to: e.to, key: e.need || e.action })), declined: S.declined.map(x => ({ from: x.from, to: x.to, key: x.key })) }));
      if (res && typeof res.then === 'function') res.then(receive); else if (res) receive(res);
    }
    /* 已发出的请求：等一会儿，掷一次响应，响应了就走过去，到了动手 */
    const ttl = cfg().respond.ttl_seconds * 1000;
    S.inbox = S.inbox.filter(e => {
      if (now - e.born > ttl || !valid(e)) return false;
      e.wait -= dt; if (e.wait > 0) return true;
      if (e.phase === 'sent') {
        if (Math.random() >= respondChance(e)) { cooldown(e); return false; }
        e.phase = 'going'; approach(e); return true;
      }
      /* 到了：还不在一起就再走一次，隔着地点就算了 */
      const W = CY.world, to = G.get(e.to), from = G.get(e.from);
      if (!eligibleTo(to)) return false;
      if (e.to !== e.from && W) {
        const tl = W.locationOf(from), hl = W.locationOf(to);
        if (tl.place !== hl.place) return false;
        if (tl.room !== hl.room && e.tries++ < 1) { approach(e); return true; }
      }
      if (e.kind === 'care') doCare(e); else if (e.kind === 'self') doSelf(e); else doGo(e);
      return false;
    });
  };
  G.assistTick = G.agentTick;
})(globalThis.CY = globalThis.CY || {});
