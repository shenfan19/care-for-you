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
    park: { w: 10, h: 6, rooms: { lawn: { gx: 0, gy: 0, w: 10, h: 6 } } },
    street: { w: 10, h: 6, rooms: { road: { gx: 0, gy: 0, w: 10, h: 6 } } },
  };
  W.PLACE_LIST = ['home', 'park', 'street', 'hospital', 'office'];
  W.project = (place, gx, gy) => {
    const P = W.PLACES[place], ox = W.VW / 2 + (P.h - P.w) * W.TW / 4;
    return { x: ox + (gx - gy) * W.TW / 2, y: 120 + (gx + gy) * W.TH / 2 };
  };
  /* 各房间里站人的位置，用房间宽高的比例表示。sleep 是床位，cradle 是婴儿床，player 是操纵对象的位置，书房和办公室里是坐在桌前椅子的位置 */
  const SLOTS = {
    bedroom: { stand: [[.55, .74], [.3, .82], [.82, .7]], sleep: [[.3, .38], [.42, .55]], cradle: [[.8, .33]], player: [.18, .9] },
    elder: { stand: [[.5, .74], [.25, .84], [.75, .84]], sleep: [[.25, .4], [.75, .4]], cradle: [[.5, .5]], player: [.5, .92] },
    toilet: { stand: [[.5, .62], [.5, .8], [.5, .45]], sleep: [[.5, .5]], cradle: [[.5, .5]], player: [.5, .9] },
    study: { stand: [[.5, .8], [.2, .88], [.82, .88]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.2, .88], seat: [[.52, .42], [.76, .46]] },
    living: { mat: [[.5, .56]], stand: [[.78, .62], [.22, .66], [.5, .9], [.14, .88], [.86, .88], [.5, .36]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.9, .9] },
    kitchen: { stand: [[.5, .84], [.22, .7], [.8, .74], [.5, .52]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.1, .9] },
    yard: { stand: [[.5, .66], [.26, .8], [.74, .8], [.5, .9], [.3, .45], [.7, .45]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.9, .9] },
    ward: { stand: [[.5, .78], [.3, .72], [.7, .72], [.15, .6], [.85, .6]], sleep: [[.17, .27], [.37, .27], [.57, .27], [.77, .27]], cradle: [[.5, .5]], player: [.5, .93] },
    desk: { stand: [[.5, .7], [.3, .8], [.7, .8]], sleep: [[.5, .5]], cradle: [[.5, .5]], player: [.28, .45] },
    lawn: { stand: [[.5, .7], [.3, .76], [.7, .76], [.5, .5], [.2, .55], [.8, .55]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.9, .9] },
    road: { stand: [[.5, .56], [.3, .6], [.7, .6], [.4, .4], [.6, .4], [.2, .45]], sleep: [[.5, .6]], cradle: [[.5, .6]], player: [.9, .9] },
  };
  /* 床位：每个住家的人有自己的床。老人睡老人房，其余睡卧室，各有床位上限；睡不下的先去另一间，还不够睡客厅沙发。
     婴儿睡婴儿床，不占床位。顺序按角色编号，位置固定，不会因为谁醒了而挪动 */
  W.BED_CAP = { bedroom: 3, elder: 3 };
  W.BED_MIN = { bedroom: 2, elder: 2 };
  W.bedPlan = () => {
    const plan = { bedroom: [], elder: [], living: [] };
    const sleepers = G.activePeople().filter(p => G.isHuman(p) && G.stage(p) !== 'infant').sort((a, b) => (a.id < b.id ? -1 : 1));
    const put = (p, order) => { for (const r of order) if (r === 'living' || plan[r].length < W.BED_CAP[r]) { plan[r].push(p.id); return; } };
    for (const p of sleepers) if (G.stage(p) === 'elder') put(p, ['elder', 'bedroom', 'living']);
    for (const p of sleepers) if (G.stage(p) !== 'elder') put(p, ['bedroom', 'elder', 'living']);
    return plan;
  };
  /* 画床用：这个房间要几张床 */
  W.bedCount = room => Math.max(W.BED_MIN[room] || 0, (W.bedPlan()[room] || []).length);
  W.bedKey = () => W.bedCount('bedroom') + ',' + W.bedCount('elder');
  W.bedOf = p => { const plan = W.bedPlan(); for (const r in plan) { const i = plan[r].indexOf(p.id); if (i >= 0) return { room: r, i }; } return null; };
  W.slotPoint = (place, room, kind, i) => {
    if (kind === 'sleep' && W.BED_CAP[room]) { const r0 = W.PLACES[place].rooms[room], w = r0.w; return { gx: r0.gx + ((0.1 + i * 0.95 + 0.43) / w) * w, gy: r0.gy + 0.42 * r0.h }; }
    const r = W.PLACES[place].rooms[room], list = SLOTS[room][kind] || SLOTS[room].stand;
    const s = Array.isArray(list[0]) ? list[i % list.length] : list;
    const lap = Math.floor(i / list.length);
    return { gx: r.gx + (s[0] + lap * 0.06) * r.w, gy: r.gy + (s[1] - lap * 0.06) * r.h };
  };
  W.playerAnchor = (place, room) => W.slotPoint(place, room, 'player', 0);
  W.WORK = { place: 'home', room: 'study' };
  /* 谁办公：默认只有爸爸妈妈在家办公，家里没有爸爸妈妈时才轮到别的成年人。操纵对象不特别：选了谁，谁也只是照常过日子 */
  const isParent = p => ['dad', 'mom'].includes(p.person.archetype || p.person.card);
  W.worker = p => !!p && G.isHuman(p) && G.stage(p) === 'adult' && (isParent(p) || !G.activePeople().some(q => G.isHuman(q) && isParent(q)));
  W.hasWorker = () => G.activePeople().some(W.worker);
  /* 日程：一天的默认去处，只给一个倾向，需求会盖过它。上班的人白天在书房办公，中午和傍晚去厨房，晚上在客厅看电视，夜里回卧室。
     老人早晚在院子，上午在客厅，中午和傍晚去厨房。其他人没有固定日程，按各自喜好和需求走 */
  const inH = (hr, a, b) => hr >= a && hr < b;
  W.routineRoom = (p, hr) => {
    if (!p || !G.isHuman(p)) return null;
    if (hr === undefined) hr = G.dayMinutes() / 60;
    const st = G.stage(p);
    if (hr >= 22 || hr < 7) return st === 'elder' ? 'elder' : 'bedroom';
    if (inH(hr, 19, 22)) return W.immobile(p) ? null : 'living';
    if (W.worker(p)) return inH(hr, 7, 8.5) || inH(hr, 12, 13) || inH(hr, 18, 19) ? 'kitchen' : inH(hr, 9, 12) || inH(hr, 13, 18) ? 'study' : null;
    if (st === 'elder') return inH(hr, 8, 10) || inH(hr, 15, 17.5) ? 'yard' : inH(hr, 10, 12) ? 'living' : inH(hr, 12, 13) || inH(hr, 18, 19) ? 'kitchen' : null;
    return null;
  };
  W.ROUTINE_W = 7;
  /* 主角空闲时回到的地方：照日程走，没有日程就是客厅 */
  W.workRoom = () => { const l = G.protagonist(); return (l && W.routineRoom(l)) || 'living'; };
  /* 宝宝还不会走，只待在垫子和婴儿床上 */
  W.immobile = p => !!p && G.isHuman(p) && (G.stage(p) === 'infant' || (G.stage(p) === 'toddler' && G.age(p) < 2.5));
  W.driven = p => !!p && p === G.protagonist();
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
  const block = () => Math.floor(G.dayMinutes() / 20);
  const pickBy = (id, list) => list[hashOf(id + ':' + block()) % list.length];
  const onMat = q => G.isHuman(q) && ['infant', 'toddler'].includes(G.stage(q)) && !G.isSleeping(q) && !G.flag(q, 'hospital') && !G.flag(q, 'outing') && (q.state.needs.rest || 0) <= 0.55;
  /* ---------- 每个角色自己挑去哪个房间：像一个个小行动者 ----------
     喜好来自角色卡的 prefs，需求会把人往对应的房间推：饿了去厨房，困了去卧室，想有人陪就去书桌边，宝宝哭了大人往宝宝那边去。
     每个人在一个房间停一阵再换，现实里几十秒到几分钟，慢慢地走。鼠标悬停或点选一个人，他就停住，等你操作完才继续。 */
  const WANDER_PETS = ['cat', 'dog', 'rabbit', 'guineapig', 'ferret', 'hedgehog', 'duck', 'chicken'];
  W.PREFS = CY.seed.PREFS;   /* 各类角色在各房间的喜好权重，角色卡的 prefs 优先 */
  W.agents = {};          /* 运行时的状态，不存档：每人当前的房间和下次再挑的时刻 */
  W.frozen = new Set();   /* 被悬停或点选的人，停着不动 */
  const prefsOf = p => (p.person.prefs && p.person.prefs.rooms) || W.PREFS[G.classKey(p)] || W.PREFS.adult;
  const restlessOf = p => { const r = p.person.prefs && p.person.prefs.restless; return typeof r === 'number' ? r : 0.6; };
  const dwellMs = p => (180 + Math.random() * 420) / (0.4 + restlessOf(p)) * 1000;
  /* 一个房间对这个人此刻有多大吸引力 */
  W.scoreRoom = (p, room) => {
    const n = p.state.needs, hr = G.dayMinutes() / 60, st = G.classKey(p), human = G.isHuman(p);
    let w = (prefsOf(p)[room] || 0);
    const hi = k => Math.max(0, (n[k] || 0) - 0.45) * 2;
    if (room === 'kitchen') w += (hi('hunger') + hi('thirst')) * 5 + (human && st === 'adult' && ((hr >= 7 && hr < 8) || (hr >= 17.5 && hr < 19)) ? 2.5 : 0) + (human && W.isMealTime() ? 3 : 0);
    if (room === 'toilet') w += hi('toilet') * 6 + hi('hygiene') * 2;
    if (room === (st === 'elder' ? 'elder' : 'bedroom')) w += hi('rest') * 4 + (hr >= 20.5 || hr < 6.5 ? 2 : 0);
    if (room === 'living') w += hi('company') * 2 + hi('play') * 1.5;
    if (room === 'study') w += hi('company') * 2.5;
    /* 爸爸妈妈白天在书桌前办公，爷爷奶奶白天遛弯，下午晒晒太阳 */
    if (room === W.routineRoom(p, hr)) w += W.ROUTINE_W;
    if (human && st === 'elder' && room === 'yard' && ((hr >= 8 && hr < 10.5) || (hr >= 15 && hr < 17.5))) w += 2;
    if (room === 'yard') w += hi('play') * 2 + hi('mobility') * 2 + (hr >= 9 && hr < 17 ? 0.6 : -0.6);
    /* 心情低落的人想独处，躲回自己的房间；心情好的人愿意待在客厅 */
    if (human && p.state.mood < 0.35) { if (room === (st === 'elder' ? 'elder' : 'bedroom')) w += 2; if (room === 'living') w *= 0.6; }
    else if (human && p.state.mood > 0.75 && room === 'living') w += 0.8;
    /* 看得见谁在叫：宝宝或幼儿很需要人，大人和老人往那个孩子在的房间去 */
    if (human && ['adult', 'elder', 'teen'].includes(st)) {
      for (const q of G.activePeople()) {
        if (q === p || !G.isHuman(q) || !['infant', 'toddler'].includes(G.stage(q)) || G.isSleeping(q)) continue;
        if (G.maxNeed(q) > 0.65 && ['living', 'bedroom'].includes(room) && room === W.roomOfNow(q)) w += 3 * (G.maxNeed(q) - 0.5);
        else if (onMat(q) && room === 'living' && st !== 'teen') w += 1.2;
      }
    }
    /* 宠物爱撒欢，也爱凑到醒着的宝宝身边 */
    if (!human) {
      if (room === 'yard') w += 1.5;
      for (const q of G.activePeople()) if (W.immobile(q) && !G.isSleeping(q) && W.locationOf(q).room === room) w += 2.5;
    }
    /* 房间里人多就不想挤，大家自然分散开 */
    if (human && !(W.worker(p) && room === 'study')) w /= 1 + 0.8 * G.activePeople().filter(q => q !== p && G.isHuman(q) && W.roomOfNow(q) === room).length;
    return w;
  };
  W.chooseRoom = (p, cur) => {
    const human = G.isHuman(p), rooms = ['living', 'kitchen', 'yard', 'study', 'toilet', human && G.stage(p) === 'elder' ? 'elder' : 'bedroom'].concat(human && G.stage(p) !== 'elder' ? [] : []);
    const ws = rooms.map(r => Math.max(0, W.scoreRoom(p, r) * (r === cur ? 0.5 : 1))), sum = ws.reduce((a, b) => a + b, 0);
    if (sum <= 0) return 'living';
    let x = Math.random() * sum;
    for (let i = 0; i < rooms.length; i++) { x -= ws[i]; if (x <= 0) return rooms[i]; }
    return rooms[0];
  };
  const agentRoom = p => {
    const now = Date.now();
    let A = W.agents[p.id];
    if (!A) A = W.agents[p.id] = { room: W.chooseRoom(p, null), next: now + dwellMs(p) * Math.random() };
    else if (now >= A.next && !W.frozen.has(p.id)) { A.room = W.chooseRoom(p, A.room); A.next = now + dwellMs(p); A.errand = null; }
    else if (W.frozen.has(p.id)) A.next = Math.max(A.next, now + 3000);
    return A.room;
  };
  /* 中午和傍晚是饭点 */
  W.isMealTime = () => { const hr = G.dayMinutes() / 60; return (hr >= 12 && hr < 13) || (hr >= 18 && hr < 19); };
  W.roomOfNow = q => (W.agents[q.id] ? W.agents[q.id].room : 'living');
  /* 叫一个人走到某个房间去，比如大人去照顾哭的孩子。被悬停或点选的人不动 */
  W.goTo = (p, room, minutes, errand) => {
    if (W.frozen.has(p.id) || W.driven(p)) return false;
    const A = W.agents[p.id] || (W.agents[p.id] = { room, next: 0 });
    A.room = room; A.next = Date.now() + (minutes ? minutes * 60000 : 40000); A.errand = errand || null;
    return true;
  };
  /* 这个人正在为什么事走动，比如去帮忙 */
  W.errandOf = p => (W.agents[p.id] && W.agents[p.id].errand) || null;
  W.freeze = (id, on) => { if (on) W.frozen.add(id); else W.frozen.delete(id); };

  W.locationOf = p => {
    if (W.driven(p)) { const pl = W.player(); return { place: pl.place, room: pl.room, mode: 'stand' }; }
    const fp = flagPlace(p);
    if (fp) return { place: fp.place, room: fp.room, mode: fp.mode || 'stand' };
    if (!G.isHuman(p)) {
      const sp = p.species.id, n = p.state.needs;
      /* 猫想蹭人，狗想出去玩，它们就跑到书桌边来 */
      if (!G.isSleeping(p) && ((sp === 'cat' && (n.company || 0) > 0.5) || (sp === 'dog' && ((n.play || 0) > 0.5 || (n.company || 0) > 0.6)))) return { place: 'home', room: 'study', mode: 'stand' };
      if (WANDER_PETS.includes(sp) && !G.isSleeping(p)) return { place: 'home', room: agentRoom(p), mode: 'stand' };
      return { place: 'home', room: PET_ROOM[sp] || 'living', mode: 'stand' };
    }
    const st = G.stage(p), sleeping = G.isSleeping(p);
    if (sleeping) { if (st === 'infant') return { place: 'home', room: 'bedroom', mode: 'cradle' }; const b = W.bedOf(p); return { place: 'home', room: b ? b.room : st === 'elder' ? 'elder' : 'bedroom', mode: 'sleep' }; }
    /* 宝宝困了在婴儿床，醒着就在玩具垫上，自己不会走 */
    if (st === 'infant') return (p.state.needs.rest || 0) > 0.55 ? { place: 'home', room: 'bedroom', mode: 'cradle' } : { place: 'home', room: 'living', mode: 'mat' };
    if (st === 'toddler' && G.age(p) < 2.5) return (p.state.needs.rest || 0) > 0.55 ? { place: 'home', room: 'bedroom', mode: 'stand' } : { place: 'home', room: 'living', mode: 'mat' };
    const room = agentRoom(p);
    return { place: 'home', room, mode: W.worker(p) && room === 'study' ? 'work' : 'stand' };
  };
  /* 此刻是不是坐在电脑前办公 */
  W.isWorking = p => {
    if (!p || G.isSleeping(p) || W.frozen.has(p.id)) return false;
    const l = W.worker(p) && W.locationOf(p);
    return !!l && l.place === 'home' && l.mode === 'work';
  };

  /* 一个地点里所有人的位置：按房间分配站位 */
  W.layout = place => {
    const byRoom = {};
    for (const p of G.activePeople()) {
      if (W.driven(p)) continue;
      const loc = W.locationOf(p);
      if (loc.place !== place) continue;
      (byRoom[loc.room] = byRoom[loc.room] || []).push({ p, mode: loc.mode });
    }
    const out = [];
    const lead = G.protagonist();
    if (W.driven(lead) && W.player().place === place) { const pl = W.player(); out.push({ id: lead.id, place, room: pl.room, kind: 'stand', gx: pl.gx, gy: pl.gy }); }
    for (const room in byRoom) {
      byRoom[room].sort((a, b) => (a.p.id < b.p.id ? -1 : 1));
      let ns = 0, nb = 0, nw = 0;
      for (const { p, mode } of byRoom[room]) {
        const kind = mode === 'cradle' ? 'cradle' : mode === 'sleep' ? 'sleep' : mode === 'mat' ? 'mat' : mode === 'work' ? 'seat' : 'stand';
        const i = kind === 'stand' ? ns++ : kind === 'sleep' ? ((W.bedOf(p) || { i: nb++ }).i) : kind === 'seat' ? nw++ : 0;
        out.push({ id: p.id, place, room, kind, ...W.slotPoint(place, room, kind, i) });
      }
    }
    return out;
  };
  /* 哪些地点有人。没有人的地点不出现 */
  W.othersPlaces = () => { const set = new Set(G.activePeople().filter(p => !W.driven(p)).map(p => W.locationOf(p).place)); return W.PLACE_LIST.filter(pl => set.has(pl)); };
  W.occupiedPlaces = () => { const set = new Set(W.othersPlaces()); if (W.driven(G.protagonist())) set.add(W.player().place); return W.PLACE_LIST.filter(pl => set.has(pl)); };

  /* ---------- 主角 ---------- */
  W.player = () => {
    if (!G.world.player) { const a = W.playerAnchor(W.WORK.place, W.workRoom()); G.world.player = { place: 'home', room: W.workRoom(), gx: a.gx, gy: a.gy }; }
    return G.world.player;
  };
  W.holding = false;      /* 正在长按 */
  W.IDLE_MS = 4000;       /* 动作停下后，原地停几秒再自动回去 */
  W.lastActive = Date.now();
  /* 坐在电脑前：家里的书房和办公室的工位，椅子在桌子前面，人朝着桌子，也就是背对着我们 */
  W.atWork = () => { const pl = W.player(); return !W.holding && ((pl.place === 'home' && pl.room === 'study') || (pl.place === 'office' && pl.room === 'desk')); };
  W.atDesk = () => { const pl = W.player(); return pl.place === 'home' && pl.room === 'study' && !W.holding; };
  W.where = () => ({ place: W.player().place, room: W.player().room });
  W.setPlayer = to => { const pl = W.player(); pl.place = to.place; pl.room = to.room; pl.gx = to.gx; pl.gy = to.gy; W.lastActive = Date.now(); };
  W.moveTo = (place, room) => { const a = W.playerAnchor(place, room); W.setPlayer({ place, room, gx: a.gx, gy: a.gy }); };
  W.visual = () => { const pl = W.player(); return { place: pl.place, gx: pl.gx, gy: pl.gy }; };

  /* 要照顾这个人：在别的地点就先去那里，同一个地点就直接出现在他旁边 */
  W.presenceNeed = p => {
    if (p === G.protagonist()) return null;
    const of = G.flag(p, 'outing');
    if (of) return { offsite: true, outing: true, place: of.place };
    const loc = W.locationOf(p), pl = W.player();
    if (pl.place !== loc.place) return { offsite: true, place: loc.place };
    return null;
  };
  W.blink = p => { const loc = W.locationOf(p); W.moveTo(loc.place, loc.room); };
  W.guard = (pid, fn) => {
    if (!W.enforce) return fn();
    const p = G.get(pid), need = p && W.presenceNeed(p);
    if (need && need.offsite) { G.toastFor(p, t(need.outing ? 'toast.outing' : 'toast.offsite', { name: p.person.name, place: t('loc.' + need.place) }), 'soft'); return false; }
    if (p) W.blink(p);
    return fn();
  };

  /* 去另一个地点：界面里长按够了时间，所以这里直接到 */
  W.travel = place => {
    const pl = W.player();
    if (pl.place === place) return false;
    W.moveTo(place, place === 'home' ? W.workRoom() : place === 'office' ? 'desk' : 'ward');
    G.logK('you', 'event', place === 'home' ? 'me.back' : 'me.go', { place: G.ref('loc.' + place, place) });
    return true;
  };

  /* 每秒：主角所在的地点没有人了就回家；动作停下几秒后，勾了自动回岗位就回到工作的位置 */
  W.tick = () => {
    if (!W.enforce) return;
    const pl = W.player();
    if (W.holding) { W.lastActive = Date.now(); return; }
    if (!W.othersPlaces().includes(pl.place) && G.activePeople().length) { W.moveTo(W.WORK.place, W.workRoom()); return; }
    if (!ini.bool(G.cfg, 'play', 'auto_return') || Date.now() - W.lastActive < W.IDLE_MS) return;
    if (pl.place !== W.WORK.place || pl.room !== W.workRoom()) { W.moveTo(W.WORK.place, W.workRoom()); }
  };

  G.worldTick = W.tick;
  G.worldGuard = W.guard;
  G.worldNeed = W.presenceNeed;
  G.worldBlink = W.blink;
})(globalThis.CY = globalThis.CY || {});
