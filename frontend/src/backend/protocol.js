/* 后端协议，第一版。游戏本体只做两件事：把现在的状态打包发给后端，把后端回的指令一条条执行。
   谁在说话，发生什么事，都是后端决定的，游戏本体不再写死某个人或某件事。

   完整的接口说明（传输、指令表、快照字段、分工规则）在仓库根目录 README_backend_protocol.md，下面是速查。

   请求 request，都是明文 JSON：
     { v: 1, kind: 'hello', client: { name, version } }   握手。回 { v: 1, name, version, handles: { events, strategies, lines } }，handles 里写 false 的由内置后端接手，没写当作 true
     { v: 1, kind: 'drive', trigger: 'tick' | 'action', minutes, world, people: [person], expired: [{ person, name }], person, action }
     { v: 1, kind: 'line', person, group, key, situation, world }
     { v: 1, kind: 'plan', world, people: [person], minutes }
   回应 response：
     drive → { v: 1, directives: [directive], drives?: { 角色编号: [它替这个角色算的变量名：需求名、mood、frailty] } }，声明过的变量游戏本体不再自己推进
     line  → { v: 1, text: '一句话' }，没有就回 text: null
     plan  → { v: 1, states: [{ person, needs?, mood?, frailty?, want?: { id, action } }], strategies: [{ from, to, kind: 'care' | 'self' | 'go', need?, action? }] }

   person 是一个角色此刻的快照：id, name（设置里允许才带）, species, stage, age, mood, frailty, needs, conditions,
   traits, voice, flags, sleeping, location, care_total, counters, rate_mult（每个需求的个性化速率倍数）, mood_offset, frailty_mult。
   flag 是带时限的标记，比如在医院，夜里起夜，受了伤。带 place 的标记会让这个人出现在那个地点。

   directive 是后端要游戏做的事，op 只能是下面这些，别的一律丢弃，数值会被压回范围：
     flag_set { person, name, minutes, value?, place?, room?, mode? }   flag_clear { person, name }   move { person, room, minutes? }（让这个人走到家里的某个房间，停留一阵）
     need { person, need, delta }   need_set { person, need, value }   mood_set frailty_set { person, value }   mood { person, delta }   frailty { person, delta }
     condition_add { person, id }   condition_remove { person, id }   counter { person, name, delta }   seen { person, name }（记下今天已经说过，每天只触发一次的规则用）
     log { person, type, text | key, args? }    say { person, text | tkey | group+key, kind? }    （tkey 是界面文字的键，group+key 是台词库里的位置） */
(function (CY) {
  const P = CY.protocol = { V: 1 };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  const num = v => (typeof v === 'number' && isFinite(v) ? v : 0);

  P.LOG_TYPES = ['care', 'talk', 'missed', 'cares_back', 'glance', 'event', 'frail', 'recovered', 'reveal', 'picked', 'nudge', 'cry', 'self'];
  P.SAY_KINDS = ['soft', 'speech', 'cry', 'reveal', 'self'];

  /* 一个角色的快照 */
  P.person = (p, opts = {}) => {
    const G = CY.game, W = CY.world, now = G.world.game_minutes, flags = {};
    for (const n in p.state.flags || {}) { const f = p.state.flags[n]; if (f.until === undefined || f.until > now) flags[n] = Object.assign({}, f); }
    const loc = W ? W.locationOf(p) : { place: 'home', room: 'living' };
    return {
      id: p.id, card: p.person.card || p.person.archetype || '', health: +(1 - p.state.frailty).toFixed(4), name: opts.names ? p.person.name : '', species: p.species.id, stage: G.classKey(p), age: G.isHuman(p) ? +G.age(p).toFixed(2) : null, age_band: G.ageBand(p),
      mood: +p.state.mood.toFixed(4), frailty: +p.state.frailty.toFixed(4), needs: Object.fromEntries(Object.entries(p.state.needs).map(([k, v]) => [k, +v.toFixed(4)])),
      conditions: (p.person.conditions || []).slice(), traits: (p.person.traits || []).slice(), voice: p.person.voice, flags,
      rate_mult: P.rateMult(p), mood_offset: +G.traitMods(p).mood_offset.toFixed(3), frailty_mult: +G.traitMods(p).frailty.toFixed(3),
      sleeping: G.isSleeping(p), protagonist: G.protagonist() === p, abilities: P.abilities(p), want: G.wants && G.wants[p.id] ? Object.assign({}, G.wants[p.id]) : null, location: { place: loc.place, room: loc.room }, care_total: p.story.care_total || 0, counters: Object.assign({}, p.story.counters), seen: Object.assign({}, p.story.seen),
    };
  };
  /* 这个角色每个需求的个性化速率倍数：性格的倍数乘角色卡的 need_rate。基础速率不发，由后端的类按年龄阶段和物种自己定 */
  P.rateMult = p => {
    const m = CY.game.traitMods(p).rate, nr = p.person.need_rate || {}, out = {};
    for (const k in p.state.needs) out[k] = +((m[k] || 1) * (nr[k] || 1)).toFixed(3);
    return out;
  };
  P.world = () => {
    const G = CY.game, ini = CY.ini, c = G.clock(), pl = CY.world ? CY.world.player() : {};
    const gd = G.gameDate(), date = { month: gd.month, day: gd.day, weekday: gd.weekday, iso: gd.iso, day_index: gd.day_index };
    return { v: P.V, date, working: G.isWorkTime(), at_desk: !CY.world || CY.world.atDesk(), days_together: Math.floor(G.world.game_minutes / 1440), game_minutes: Math.floor(G.world.game_minutes), day_minutes: G.dayMinutes(), hour: +(G.dayMinutes() / 60).toFixed(2), night: c.night, mode: G.timeMode(),
      player: { place: pl.place, room: pl.room }, protagonist: G.protagonist() ? G.protagonist().id : null, params: {} };
  };


  /* 个人卡的判断，随快照发给后台：后台挑接收者、挑动作时只看这些，不用去读游戏内部。
     help 是这个人能不能帮别人，role 为 nanny 或 helper；care_needs 是别人能替他做的需求，self_needs 是他自己能做的需求；go_actions 是他能去的外出动作 */
  P.abilities = p => {
    const G = CY.game, acts = Object.values(G.actionsOf(p)), care = new Set(), self = new Set(), go = [];
    for (const a of acts) {
      if (a.outing) { go.push(a.id); continue; }
      if (a.selfonly || a.away) continue;
      for (const k in a.effect || {}) if (a.effect[k] < 0) care.add(k);
    }
    for (const k of Object.keys(p.state.needs)) if (G.selfActFor(p, k)) self.add(k);
    const can = G.canHelp ? G.canHelp(p) : false;
    return { help: can ? { role: (p.person.help && p.person.help.role) || 'helper', efficiency: (p.person.help && p.person.help.efficiency) || 0 } : null, care_needs: [...care], self_needs: [...self], go_actions: go };
  };

  /* 后台回的状态表和策略：状态表每行是一个人，可以给需求，心情，虚弱的新值，也可以给一个位置愿望；策略是 from 向 to 发的一个请求 */
  P.sanitizePlan = plan => {
    const G = CY.game, out = { states: [], strategies: [] };
    for (const r of Array.isArray(plan && plan.states) ? plan.states : []) {
      if (!r || !G.get(r.person)) continue;
      const o = { person: r.person };
      if (r.needs && typeof r.needs === 'object') { o.needs = {}; for (const k in r.needs) if (typeof r.needs[k] === 'number') o.needs[str(k, 24)] = clamp(r.needs[k], 0, 1); }
      if (typeof r.mood === 'number') o.mood = clamp(r.mood, 0, 1);
      if (typeof r.frailty === 'number') o.frailty = clamp(r.frailty, 0, 1);
      if (r.want && typeof r.want === 'object' && typeof r.want.action === 'string') o.want = { id: str(r.want.id, 32), action: str(r.want.action, 24) };
      out.states.push(o);
    }
    for (const s of Array.isArray(plan && plan.strategies) ? plan.strategies : []) {
      if (!s || !G.get(s.from) || !G.get(s.to) || !['care', 'self', 'go'].includes(s.kind)) continue;
      const o = { from: s.from, to: s.to, kind: s.kind, need: str(s.need, 24), action: str(s.action, 24) };
      if (s.kind === 'care' || s.kind === 'self') { if (!o.need) continue; } else if (!o.action) continue;
      out.strategies.push(o);
    }
    return out;
  };

  /* 检查后端回的指令，不认识的丢掉，数值压回范围 */
  P.sanitize = (list) => {
    const G = CY.game, W = CY.world, out = [];
    for (const d of Array.isArray(list) ? list : []) {
      if (!d || typeof d !== 'object' || !G.get(d.person)) continue;
      const o = { op: d.op, person: d.person };
      switch (d.op) {
        case 'flag_set':
          o.name = str(d.name, 24); if (!o.name) continue;
          o.minutes = clamp(num(d.minutes), 0, 43200);
          if (d.value !== undefined) o.value = str(String(d.value), 24);
          if (d.place) { if (!(W && W.PLACES[d.place])) continue; o.place = d.place; o.room = W.PLACES[d.place].rooms[d.room] ? d.room : Object.keys(W.PLACES[d.place].rooms)[0]; o.mode = ['stand', 'sleep', 'cradle'].includes(d.mode) ? d.mode : 'stand'; }
          break;
        case 'move': if (!(W && W.PLACES.home.rooms[d.room])) continue; o.room = d.room; o.minutes = clamp(num(d.minutes) || 1, 0.2, 30); break;
        case 'flag_clear': o.name = str(d.name, 24); if (!o.name) continue; break;
        case 'need_set': o.need = str(d.need, 24); o.value = clamp(num(d.value), 0, 1); break;
        case 'mood_set': case 'frailty_set': o.value = clamp(num(d.value), 0, 1); break;
        case 'need': o.need = str(d.need, 24); o.delta = clamp(num(d.delta), -1, 1); break;
        case 'mood': case 'frailty': o.delta = clamp(num(d.delta), -1, 1); break;
        case 'condition_add': case 'condition_remove': o.id = str(d.id, 32); if (!G.tpl.conditions[o.id]) continue; break;
        case 'seen': o.name = str(d.name, 48); if (!o.name) continue; break;
        case 'counter': o.name = str(d.name, 24); if (!o.name) continue; o.delta = clamp(Math.round(num(d.delta)), -100, 100); break;
        case 'log':
          o.type = P.LOG_TYPES.includes(d.type) ? d.type : 'event';
          if (typeof d.text === 'string') o.text = d.text.slice(0, 240); else if (typeof d.key === 'string') { o.key = d.key.slice(0, 48); o.args = d.args && typeof d.args === 'object' ? d.args : {}; } else continue;
          break;
        case 'say':
          o.kind = P.SAY_KINDS.includes(d.kind) ? d.kind : 'soft';
          if (typeof d.text === 'string') o.text = d.text.slice(0, 240); else if (typeof d.tkey === 'string') o.tkey = d.tkey.slice(0, 48); else if (typeof d.group === 'string' && typeof d.key === 'string') { o.group = d.group.slice(0, 24); o.key = d.key.slice(0, 48); } else continue;
          break;
        default: continue;
      }
      out.push(o);
    }
    return out;
  };
})(globalThis.CY = globalThis.CY || {});
