/* 世界：地点和房间的格子布局，谁此刻在哪个房间，主角的位置和走路，去医院和办公室的路程，
   夜里起夜与跌倒，住院与出院。这里不碰界面，界面只读这里算出来的位置。
   走路和路程要花时间：现实模式里是真实的几秒到十几秒，故事模式里是游戏里的分钟，排进任务栈。 */
(function (CY) {
  const G = CY.game, ini = CY.ini;
  const t = (k, v) => CY.t(k, v);
  const W = CY.world = { enforce: false };

  /* ---------- 格子布局：一格是一块斜视的菱形地砖 ---------- */
  W.TW = 72; W.TH = 36; W.VW = 800; W.VH = 520;
  W.PLACES = {
    home: { w: 12, h: 8, rooms: {
      bedroom: { gx: 0, gy: 0, w: 4, h: 4 }, elder: { gx: 4, gy: 0, w: 3, h: 4 }, toilet: { gx: 7, gy: 0, w: 2, h: 4 }, study: { gx: 9, gy: 0, w: 3, h: 4 },
      living: { gx: 0, gy: 4, w: 4, h: 4 }, kitchen: { gx: 4, gy: 4, w: 4, h: 4 }, yard: { gx: 8, gy: 4, w: 4, h: 4 },
    } },
    hospital: { w: 10, h: 6, rooms: { ward: { gx: 0, gy: 0, w: 10, h: 6 } } },
    office: { w: 8, h: 6, rooms: { desk: { gx: 0, gy: 0, w: 8, h: 6 } } },
  };
  W.PLACE_LIST = ['home', 'office', 'hospital'];
  W.project = (place, gx, gy) => {
    const P = W.PLACES[place], ox = W.VW / 2 + (P.h - P.w) * W.TW / 4;
    return { x: ox + (gx - gy) * W.TW / 2, y: 120 + (gx + gy) * W.TH / 2 };
  };
  /* 各房间里站人的位置，用房间宽高的比例表示。sleep 是床位，cradle 是婴儿床，work 是主角工作的位置 */
  const SLOTS = {
    bedroom: { stand: [[.55, .74], [.3, .82], [.82, .7]], sleep: [[.3, .38], [.42, .55]], cradle: [[.8, .33]], player: [.18, .9] },
    elder: { stand: [[.5, .74], [.25, .84], [.75, .84]], sleep: [[.25, .4], [.75, .4]], cradle: [[.5, .5]], player: [.5, .92] },
    toilet: { stand: [[.5, .62], [.5, .8], [.5, .45]], sleep: [[.5, .5]], cradle: [[.5, .5]], player: [.5, .9] },
    study: { stand: [[.5, .8], [.2, .88], [.82, .88]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.5, .5], work: [.5, .5] },
    living: { stand: [[.5, .68], [.28, .8], [.74, .8], [.5, .9], [.85, .55], [.15, .55]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.9, .9] },
    kitchen: { stand: [[.5, .84], [.22, .7], [.8, .74], [.5, .52]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.1, .9] },
    yard: { stand: [[.5, .66], [.26, .8], [.74, .8], [.5, .9], [.3, .45], [.7, .45]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.9, .9] },
    ward: { stand: [[.5, .78], [.3, .72], [.7, .72], [.15, .6], [.85, .6]], sleep: [[.17, .27], [.37, .27], [.57, .27], [.77, .27]], cradle: [[.5, .5]], player: [.5, .93] },
    desk: { stand: [[.5, .7], [.3, .8], [.7, .8]], sleep: [[.5, .5]], cradle: [[.5, .5]], player: [.5, .55], work: [.5, .55] },
  };
  W.slotPoint = (place, room, kind, i) => {
    const r = W.PLACES[place].rooms[room], list = SLOTS[room][kind] || SLOTS[room].stand;
    const s = Array.isArray(list[0]) ? list[i % list.length] : list;
    const lap = Math.floor(i / list.length);
    return { gx: r.gx + (s[0] + lap * 0.06) * r.w, gy: r.gy + (s[1] - lap * 0.06) * r.h };
  };
  W.playerAnchor = (place, room) => W.slotPoint(place, room, 'player', 0);
  W.WORK = { place: 'home', room: 'study' };
  /* 地点之间的路程，单位是游戏分钟 */
  W.TRAVEL_MIN = { 'home-hospital': 30, 'home-office': 25, 'hospital-office': 45 };
  W.travelMin = (a, b) => W.TRAVEL_MIN[a + '-' + b] || W.TRAVEL_MIN[b + '-' + a] || 30;
  W.travelHold = (a, b) => Math.min(10, Math.max(3, Math.round(W.travelMin(a, b) / 3)));
  W.TILE_MIN = 0.5;       /* 故事模式里，走过一格花的游戏分钟 */
  W.TILE_SEC = 0.9;       /* 现实模式里，走过一格花的现实秒 */
  W.dist = (a, b) => Math.abs(a.gx - b.gx) + Math.abs(a.gy - b.gy);

  /* ---------- 谁此刻在哪个房间 ---------- */
  const PET_ROOM = { cat: 'living', dog: 'living', rabbit: 'living', hamster: 'bedroom', guineapig: 'living', bird: 'living', fish: 'living', turtle: 'kitchen', snake: 'study', gecko: 'study', succulent: 'living', cactus: 'study', flower: 'yard', tree: 'yard' };
  const hashOf = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  W.locationOf = p => {
    const s = p.state, now = G.world.game_minutes, hr = G.dayMinutes() / 60;
    if (s.hospital) return { place: 'hospital', room: 'ward', mode: 'sleep' };
    if (s.wc_until && now < s.wc_until) return { place: 'home', room: 'toilet', mode: 'stand' };
    if (!G.isHuman(p)) {
      const sp = p.species.id;
      if (sp === 'dog' && !G.isSleeping(p) && hr >= 9 && hr < 17 && hashOf(p.id) % 2) return { place: 'home', room: 'yard', mode: 'stand' };
      if (sp === 'cat') return { place: 'home', room: hr >= 12 && hr < 16 ? 'bedroom' : hr >= 17 && hr < 19 ? 'kitchen' : hr >= 9 && hr < 12 && hashOf(p.id) % 2 ? 'yard' : 'living', mode: 'stand' };
      return { place: 'home', room: PET_ROOM[sp] || 'living', mode: 'stand' };
    }
    const st = G.stage(p), sleeping = G.isSleeping(p);
    if (sleeping) return { place: 'home', room: st === 'elder' ? 'elder' : 'bedroom', mode: st === 'infant' ? 'cradle' : 'sleep' };
    if (st === 'infant') return { place: 'home', room: 'bedroom', mode: 'cradle' };
    if (st === 'teen') return { place: 'home', room: hr >= 17 && hr < 19 ? 'study' : 'bedroom', mode: 'stand' };
    if (st === 'child' || st === 'toddler') {
      const room = hr < 9 ? 'kitchen' : hr >= 14 && hr < 17 && hashOf(p.id) % 2 ? 'yard' : hr >= 12 && hr < 14 ? 'kitchen' : hr >= 17 && hr < 19 && st === 'child' ? 'study' : hr >= 19 ? 'bedroom' : 'living';
      return { place: 'home', room, mode: 'stand' };
    }
    if (st === 'elder') {
      const h = hr + (hashOf(p.id) % 2) * 0.5;
      const room = h >= 7 && h < 9 ? 'kitchen' : h >= 9 && h < 11 ? 'yard' : h >= 11 && h < 12.5 ? 'kitchen' : 'living';
      return { place: 'home', room, mode: 'stand' };
    }
    if (st === 'adult' && ((hr >= 7 && hr < 8) || (hr >= 17.5 && hr < 19))) return { place: 'home', room: 'kitchen', mode: 'stand' };
    return { place: 'home', room: 'living', mode: 'stand' };
  };

  /* 一个地点里所有人的位置：按房间分配站位。主角走路时位置另算 */
  W.layout = place => {
    const byRoom = {};
    for (const p of G.activePeople()) {
      const loc = W.locationOf(p);
      if (loc.place !== place) continue;
      (byRoom[loc.room] = byRoom[loc.room] || []).push({ p, mode: loc.mode });
    }
    const out = [];
    for (const room in byRoom) {
      let ns = 0, nb = 0;
      for (const { p, mode } of byRoom[room]) {
        const kind = mode === 'cradle' ? 'cradle' : mode === 'sleep' ? 'sleep' : 'stand';
        const i = kind === 'stand' ? ns++ : kind === 'sleep' ? nb++ : 0;
        out.push({ id: p.id, place, room, kind, ...W.slotPoint(place, room, kind, i) });
      }
    }
    return out;
  };

  /* ---------- 主角：位置，走路，路上 ---------- */
  W.player = () => {
    if (!G.world.player) { const a = W.playerAnchor(W.WORK.place, W.WORK.room); G.world.player = { place: 'home', room: 'study', gx: a.gx, gy: a.gy }; }
    return G.world.player;
  };
  W.walk = null;       /* 现实模式里正在走的路 */
  W.walkId = 0;
  W.pending = [];      /* 走到了才做的事 */
  W.lastActive = Date.now();
  const taskWalk = () => { const x = G.runningTask(); return x && x.kind && G.timeMode() === 'compressed' ? x : null; };

  /* 此刻看得见的位置。moving 给界面用，界面把位置过渡到终点，过渡时间就是剩下的路程时间 */
  W.visual = () => {
    const pl = W.player(), tw = taskWalk();
    if (tw && tw.kind === 'travel') return { transit: true, place: pl.place, gx: pl.gx, gy: pl.gy, id: 't' + tw.id };
    if (tw && tw.kind === 'walk') {
      const ms = Math.max(0, tw.left) * G.secPerGameMin() * 1000;
      return { place: tw.from.place, gx: tw.from.gx, gy: tw.from.gy, moving: { gx: tw.to.gx, gy: tw.to.gy, ms }, id: 't' + tw.id };
    }
    if (W.walk) return { place: W.walk.from.place, gx: W.walk.from.gx, gy: W.walk.from.gy, moving: { gx: W.walk.to.gx, gy: W.walk.to.gy, ms: Math.max(0, W.walk.start + W.walk.dur - Date.now()) }, id: 'w' + W.walkId };
    return { place: pl.place, gx: pl.gx, gy: pl.gy, id: 'p' };
  };
  W.where = () => {
    const tw = taskWalk();
    if (tw && tw.kind === 'travel') return { transit: true, place: W.player().place };
    return { place: W.player().place, room: W.player().room };
  };

  function setPlayer(to) { const pl = W.player(); pl.place = to.place; pl.room = to.room; pl.gx = to.gx; pl.gy = to.gy; W.lastActive = Date.now(); }

  /* 现实模式：走过去，到了做 then */
  W.beginWalk = (to, then) => {
    const pl = W.player();
    if (then) W.pending.push(then);
    if (W.walk && W.walk.to.room === to.room && W.walk.to.place === to.place) return;
    const from = { place: pl.place, gx: pl.gx, gy: pl.gy };
    const dur = Math.max(500, W.dist(from, to) * W.TILE_SEC * 1000);
    W.walkId++;
    W.walk = { from, to, start: Date.now(), dur };
  };
  const arrive = () => {
    if (!W.walk) return;
    setPlayer(W.walk.to); W.walk = null;
    const fns = W.pending; W.pending = [];
    fns.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  };

  /* 这个人和主角不在一个房间：返回要走的路，不在一个地点返回 offsite */
  W.presenceNeed = p => {
    const loc = W.locationOf(p), pl = W.player();
    if (pl.place !== loc.place) return { offsite: true, place: loc.place };
    const at = W.where();
    if (at.room === loc.room && !W.walk) return null;
    const a = W.playerAnchor(loc.place, loc.room);
    return { place: loc.place, room: loc.room, gx: a.gx, gy: a.gy };
  };
  const roomName = r => t('loc.' + r);
  W.walkTask = (need) => {
    const pl = W.player(), from = { place: pl.place, gx: pl.gx, gy: pl.gy }, to = { place: need.place, room: need.room, gx: need.gx, gy: need.gy };
    const min = Math.max(0.5, W.dist(from, to) * W.TILE_MIN);
    return { id: ++W.walkId, kind: 'walk', pid: null, act: 'walk', label: t('walk.to', { room: roomName(need.room) }), total: min, left: min, from, to };
  };
  W.travelTask = (place) => {
    const pl = W.player(), a = W.playerAnchor(place, place === 'home' ? W.WORK.room : place === 'office' ? 'desk' : 'ward');
    const min = W.travelMin(pl.place, place);
    return { id: ++W.walkId, kind: 'travel', pid: null, act: 'travel', label: t('walk.travel', { place: t('loc.' + place) }), total: min, left: min, to: { place, room: place === 'home' ? W.WORK.room : place === 'office' ? 'desk' : 'ward', gx: a.gx, gy: a.gy } };
  };
  W.finishSpecial = task => { setPlayer(task.to); };

  /* 去另一个地点。现实模式里界面已经让玩家长按了足够的时间，所以直接到；故事模式排进任务栈 */
  W.travel = place => {
    const pl = W.player();
    if (pl.place === place) return false;
    const room = place === 'home' ? W.WORK.room : place === 'office' ? 'desk' : 'ward', a = W.playerAnchor(place, room);
    if (G.timeMode() === 'compressed') {
      const ts = G.tasks();
      if (ts.length >= 4) { return false; }
      ts.push(W.travelTask(place)); G.save();
    } else if (G.timeMode() === 'real') setPlayer({ place, room, gx: a.gx, gy: a.gy });
    else return false;
    return true;
  };

  /* 做一件需要主角在场的事。现实模式：先走过去，到了再做 */
  W.guard = (pid, fn) => {
    if (!W.enforce) return fn();
    const p = G.get(pid), need = p && W.presenceNeed(p);
    if (!need) return fn();
    if (need.offsite) { G.toastFor(p, t('toast.offsite', { name: p.person.name, place: t('loc.' + need.place) }), 'soft'); return false; }
    G.toastFor(p, t('toast.walking'), 'soft');
    W.beginWalk(need, fn);
    return true;
  };
  W.approach = pid => {
    if (!W.enforce || G.timeMode() !== 'real') return;
    const p = G.get(pid), need = p && W.presenceNeed(p);
    if (need && !need.offsite) W.beginWalk(need);
  };

  /* ---------- 夜里起夜，跌倒，住院 ----------
     下面的数字是占位，等 Life Matters 的夜尿与跌倒模型接进来替换。接口是 CY.models.nocturia：
     tripsPerNight(p) 返回一晚起夜次数，fallProb(p, ctx) 返回一次起夜跌倒的概率，stayDays(p) 返回住院天数。 */
  CY.models = CY.models || {};
  CY.models.nocturia = {
    tripsPerNight: p => ((p.person.conditions || []).includes('nocturia') ? 2.5 : 0),
    fallProb: (p, ctx) => 0.012 * (1 + 2 * p.state.frailty) * (ctx.light ? 0.5 : 1) * (G.age(p) > 80 ? 1.3 : 1),
    seriousShare: () => 0.35,
    stayDays: () => 3,
  };
  const model = () => CY.models.nocturia;
  const scale = () => { const v = parseFloat(ini.get(G.cfg, 'play', 'fall_scale')); return isNaN(v) ? 1 : v; };

  W.hospitalize = (p, days) => {
    const s = p.state;
    s.hospital = { since: G.world.game_minutes, until: G.world.game_minutes + days * 1440 };
    delete s.wc_until;
    if (!(p.person.conditions || []).includes('fracture') && G.tpl.conditions.fracture) { p.person.conditions = (p.person.conditions || []).concat('fracture'); CY.store.writeYaml(`people/${p.id}/person.yaml`, p.person); }
  };
  W.discharge = p => {
    delete p.state.hospital; delete p.state.hurt;
    p.story.hospital_n = (p.story.hospital_n || 0) + 1;
    G.log(p.id, 'recovered', t('log.discharge', { name: p.person.name }));
    const ls = G.lines(p, 'events', 'discharge');
    G.toastFor(p, ls.length ? G.fmt(ls[Math.floor(Math.random() * ls.length)], p) : t('log.discharge', { name: p.person.name }), 'soft');
  };
  const finishTrip = p => {
    const s = p.state;
    if ('toilet' in s.needs) s.needs.toilet = Math.max(0, s.needs.toilet - 0.9);
    const prob = model().fallProb(p, { light: (s.nightlight_until || 0) > G.world.game_minutes }) * scale();
    if (Math.random() >= prob) return;
    if (Math.random() < model().seriousShare(p)) {
      W.hospitalize(p, model().stayDays(p));
      s.hurt = 'serious';
      G.log(p.id, 'event', t('log.fall_serious', { name: p.person.name }));
      G.toastFor(p, t('log.fall_serious', { name: p.person.name }), 'cry');
    } else {
      s.hurt = 'minor'; s.frailty = Math.min(1, s.frailty + 0.15); s.mood = Math.max(0, s.mood - 0.15);
      G.log(p.id, 'event', t('log.fall_minor', { name: p.person.name }));
      G.toastFor(p, t('log.fall_minor', { name: p.person.name }), 'soft');
    }
  };
  /* 每次时间推进后调用 */
  W.advance = gmin => {
    const now = G.world.game_minutes, hours = gmin / 60;
    for (const p of G.people) {
      const s = p.state;
      if (s.hospital && now >= s.hospital.until) W.discharge(p);
      if (s.wc_until && now >= s.wc_until) { delete s.wc_until; finishTrip(p); }
      if (p.person.active === false || s.hospital || s.wc_until || !G.isSleeping(p)) continue;
      const trips = model().tripsPerNight(p);
      if (trips > 0 && Math.random() < trips / 8 * hours) {
        s.wc_until = now + 6;
        G.log(p.id, 'self', t('log.night_wc', { name: p.person.name }));
      }
    }
  };

  /* 每秒：现实模式走路到了就收尾，空闲久了按设置自动回岗位 */
  W.tick = () => {
    if (W.walk && (Date.now() >= W.walk.start + W.walk.dur || G.timeMode() !== 'real')) arrive();
    if (!W.enforce) return;
    const busy = W.walk || G.tasks().length || G.isPaused();
    if (busy) { W.lastActive = Date.now(); return; }
    if (!ini.bool(G.cfg, 'play', 'auto_return') || Date.now() - W.lastActive < 6000) return;
    const pl = W.player();
    if (pl.place !== W.WORK.place) { W.travel(W.WORK.place); W.lastActive = Date.now(); }
    else if (pl.room !== W.WORK.room) {
      const a = W.playerAnchor(W.WORK.place, W.WORK.room), to = { place: W.WORK.place, room: W.WORK.room, gx: a.gx, gy: a.gy };
      if (G.timeMode() === 'compressed') { G.tasks().push(W.walkTask(to)); G.save(); } else W.beginWalk(to);
      W.lastActive = Date.now();
    }
  };

  /* 接进 game.js 的钩子 */
  G.worldAdvance = W.advance;
  G.worldTick = W.tick;
  G.finishSpecial = W.finishSpecial;
  G.worldGuard = W.guard;
  G.worldNeed = W.presenceNeed;
  G.worldWalkTask = W.walkTask;
})(globalThis.CY = globalThis.CY || {});
