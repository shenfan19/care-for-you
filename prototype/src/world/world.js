/* 世界：地点和房间的格子布局，谁此刻在哪个房间，主角在哪里，去另一个地点的路程。
   这里不碰界面，也不决定发生什么事：事件由后端决定，这里只读角色身上带地点的标记，比如在医院，决定他出现在哪里。
   没有走路：要照顾一个人，主角直接出现在他旁边；去另一个地点要花时间，现实速度里长按，快进里排进任务栈。 */
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
  /* 各房间里站人的位置，用房间宽高的比例表示。sleep 是床位，cradle 是婴儿床，player 是主角的位置 */
  const SLOTS = {
    bedroom: { stand: [[.55, .74], [.3, .82], [.82, .7]], sleep: [[.3, .38], [.42, .55]], cradle: [[.8, .33]], player: [.18, .9] },
    elder: { stand: [[.5, .74], [.25, .84], [.75, .84]], sleep: [[.25, .4], [.75, .4]], cradle: [[.5, .5]], player: [.5, .92] },
    toilet: { stand: [[.5, .62], [.5, .8], [.5, .45]], sleep: [[.5, .5]], cradle: [[.5, .5]], player: [.5, .9] },
    study: { stand: [[.5, .8], [.2, .88], [.82, .88]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.5, .5] },
    living: { stand: [[.5, .68], [.28, .8], [.74, .8], [.5, .9], [.85, .55], [.15, .55]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.9, .9] },
    kitchen: { stand: [[.5, .84], [.22, .7], [.8, .74], [.5, .52]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.1, .9] },
    yard: { stand: [[.5, .66], [.26, .8], [.74, .8], [.5, .9], [.3, .45], [.7, .45]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.9, .9] },
    ward: { stand: [[.5, .78], [.3, .72], [.7, .72], [.15, .6], [.85, .6]], sleep: [[.17, .27], [.37, .27], [.57, .27], [.77, .27]], cradle: [[.5, .5]], player: [.5, .93] },
    desk: { stand: [[.5, .7], [.3, .8], [.7, .8]], sleep: [[.5, .5]], cradle: [[.5, .5]], player: [.5, .55] },
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
  /* 去另一个地点要长按多久：和动作一样，路程的分钟开方压缩，再长一点 */
  W.travelHold = (a, b) => Math.round(Math.min(8, G.holdFor(W.travelMin(a, b)) * 1.3));

  /* ---------- 谁此刻在哪个房间 ---------- */
  const PET_ROOM = { cat: 'living', dog: 'living', rabbit: 'living', hamster: 'bedroom', guineapig: 'living', bird: 'living', fish: 'living', turtle: 'kitchen', snake: 'study', gecko: 'study', succulent: 'living', cactus: 'study', flower: 'yard', tree: 'yard' };
  const hashOf = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  /* 带地点的标记优先：后端说他在医院，他就在医院 */
  const flagPlace = p => { for (const n in p.state.flags || {}) { const f = G.flag(p, n); if (f && f.place) return f; } return null; };
  W.locationOf = p => {
    const hr = G.dayMinutes() / 60, fp = flagPlace(p);
    if (fp) return { place: fp.place, room: fp.room, mode: fp.mode || 'stand' };
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

  /* 一个地点里所有人的位置：按房间分配站位 */
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
  /* 哪些地点有人。没有人的地点不出现 */
  W.occupiedPlaces = () => { const set = new Set(G.activePeople().map(p => W.locationOf(p).place)); return W.PLACE_LIST.filter(pl => set.has(pl)); };

  /* ---------- 主角 ---------- */
  W.player = () => {
    if (!G.world.player) { const a = W.playerAnchor(W.WORK.place, W.WORK.room); G.world.player = { place: 'home', room: 'study', gx: a.gx, gy: a.gy }; }
    return G.world.player;
  };
  W.holding = false;      /* 正在长按 */
  W.IDLE_MS = 4000;       /* 动作停下后，原地停几秒再自动回去 */
  W.lastActive = Date.now();
  W.where = () => ({ place: W.player().place, room: W.player().room });
  W.setPlayer = to => { const pl = W.player(); pl.place = to.place; pl.room = to.room; pl.gx = to.gx; pl.gy = to.gy; W.lastActive = Date.now(); };
  W.moveTo = (place, room) => { const a = W.playerAnchor(place, room); W.setPlayer({ place, room, gx: a.gx, gy: a.gy }); };
  W.visual = () => { const pl = W.player(); return { place: pl.place, gx: pl.gx, gy: pl.gy }; };

  /* 要照顾这个人：在别的地点就先去那里，同一个地点就直接出现在他旁边 */
  W.presenceNeed = p => {
    const loc = W.locationOf(p), pl = W.player();
    if (pl.place !== loc.place) return { offsite: true, place: loc.place };
    return null;
  };
  W.blink = p => { const loc = W.locationOf(p); W.moveTo(loc.place, loc.room); };
  W.guard = (pid, fn) => {
    if (!W.enforce) return fn();
    const p = G.get(pid), need = p && W.presenceNeed(p);
    if (need && need.offsite) { G.toastFor(p, t('toast.offsite', { name: p.person.name, place: t('loc.' + need.place) }), 'soft'); return false; }
    if (p) W.blink(p);
    return fn();
  };

  /* 去另一个地点：界面里长按够了时间，所以这里直接到 */
  W.travel = place => {
    const pl = W.player();
    if (pl.place === place) return false;
    W.moveTo(place, place === 'home' ? W.WORK.room : place === 'office' ? 'desk' : 'ward');
    return true;
  };

  /* 每秒：主角所在的地点没有人了就回家；动作停下几秒后，勾了自动回岗位就回到工作的位置 */
  W.tick = () => {
    if (!W.enforce) return;
    const pl = W.player();
    if (W.holding) { W.lastActive = Date.now(); return; }
    if (!W.occupiedPlaces().includes(pl.place) && G.activePeople().length) { W.moveTo(W.WORK.place, W.WORK.room); return; }
    if (!ini.bool(G.cfg, 'play', 'auto_return') || Date.now() - W.lastActive < W.IDLE_MS) return;
    if (pl.place !== W.WORK.place || pl.room !== W.WORK.room) { W.moveTo(W.WORK.place, W.WORK.room); }
  };

  G.worldTick = W.tick;
  G.worldGuard = W.guard;
  G.worldNeed = W.presenceNeed;
  G.worldBlink = W.blink;
})(globalThis.CY = globalThis.CY || {});
