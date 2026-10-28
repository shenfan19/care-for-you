/* 后端协议，第一版。游戏本体只做两件事：把现在的状态打包发给后端，把后端回的指令一条条执行。
   谁在说话，发生什么事，都是后端决定的，游戏本体不再写死某个人或某件事。

   请求 request，都是明文 JSON：
     { v: 1, kind: 'drive', trigger: 'tick' | 'action', minutes, world, people: [person], expired: [{ person, name }], person, action }
     { v: 1, kind: 'line', person, group, key, situation, world }
   回应 response：
     drive → { v: 1, directives: [directive] }
     line  → { v: 1, text: '一句话' }，没有就回 text: null

   person 是一个角色此刻的快照：id, name（设置里允许才带）, species, stage, age, mood, frailty, needs, conditions,
   traits, voice, flags, sleeping, location, care_total, counters。
   flag 是带时限的标记，比如在医院，夜里起夜，受了伤。带 place 的标记会让这个人出现在那个地点。

   directive 是后端要游戏做的事，op 只能是下面这些，别的一律丢弃，数值会被压回范围：
     flag_set { person, name, minutes, value?, place?, room?, mode? }   flag_clear { person, name }
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
      id: p.id, name: opts.names ? p.person.name : '', species: p.species.id, stage: G.classKey(p), age: G.isHuman(p) ? +G.age(p).toFixed(2) : null, age_band: G.ageBand(p),
      mood: +p.state.mood.toFixed(2), frailty: +p.state.frailty.toFixed(2), needs: Object.fromEntries(Object.entries(p.state.needs).map(([k, v]) => [k, +v.toFixed(2)])),
      conditions: (p.person.conditions || []).slice(), traits: (p.person.traits || []).slice(), voice: p.person.voice, flags,
      sleeping: G.isSleeping(p), protagonist: G.protagonist() === p, location: { place: loc.place, room: loc.room }, care_total: p.story.care_total || 0, counters: Object.assign({}, p.story.counters), seen: Object.assign({}, p.story.seen),
    };
  };
  P.world = () => {
    const G = CY.game, ini = CY.ini, c = G.clock(), pl = CY.world ? CY.world.player() : {}, d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const date = { month: d.getMonth() + 1, day: d.getDate(), weekday: d.getDay(), iso: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), day_index: Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000) };
    return { v: P.V, date, money: Math.floor(G.world.money || 0), working: G.isWorkTime(), at_desk: !CY.world || CY.world.atDesk(), nanny: G.nannyInfo ? G.nannyInfo() : null, days_together: Math.floor(G.world.game_minutes / 1440), game_minutes: Math.floor(G.world.game_minutes), day_minutes: G.dayMinutes(), hour: +(G.dayMinutes() / 60).toFixed(2), night: c.night, mode: G.timeMode(),
      player: { place: pl.place, room: pl.room }, protagonist: G.protagonist() ? G.protagonist().id : null, params: {} };
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
