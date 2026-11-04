/* 角色所在的“房间”：气泡与徽标，点击出环形菜单，长按动作，动作动画，昼夜色调。
   整个房间是一个根元素 #room，可以整体搬进浮出的小窗，所以这里从不用全局 document，
   一律通过房间根元素取得它当前所在的文档。重绘只在内容变化时发生，避免长按过程中元素被替换。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  U.sel = null;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  U.esc = esc;
  const doc = () => U.room.ownerDocument;
  const win = () => doc().defaultView;
  const $r = sel => U.room.querySelector(sel);

  /* ---------- 动作动画：原创的小道具，画在角色上面一层 ---------- */
  const heart = (x, y, d, c = '#e8707e') => `<g transform="translate(${x} ${y})"><path class="p rise" style="animation-delay:${d}s" d="M0 3 C-6 -3 -2 -8 0 -4 C2 -8 6 -3 0 3Z" fill="${c}"/></g>`;
  const bowl = (c, inner) => `<g><ellipse cx="50" cy="121" rx="17" ry="5" fill="${c}"/><path d="M33 119 Q50 133 67 119Z" fill="${c}"/>${inner}</g>`;
  const FX = {
    pet: () => heart(34, 40, 0) + heart(50, 30, 0.35) + heart(66, 42, 0.7),
    hand: () => `<g transform="translate(50 84)"><path class="p pulse" d="M0 14 C-22 -6 -10 -22 0 -10 C10 -22 22 -6 0 14Z" fill="#e8707e"/></g>`,
    water: sp => ['succulent', 'flower', 'tree'].includes(sp)
      ? [38, 50, 62].map((x, i) => `<g transform="translate(${x} 40)"><path class="p rise" style="animation-delay:${i * 0.25}s;animation-name:fall" d="M0 -5 q-4 6 0 9 q4 -3 0 -9Z" fill="#7ec0ee"/></g>`).join('')
      : sp === 'human'
      ? `<g class="p cup"><rect x="0" y="0" width="13" height="15" rx="2.5" fill="#cfe9f5" stroke="#6aa6c4" stroke-width="1.6"/><rect x="1.5" y="6" width="10" height="7" rx="1.5" fill="#7fc3e6" opacity=".8"/><path d="M13 4 q6 1 0 8" fill="none" stroke="#6aa6c4" stroke-width="1.6"/></g>`
      : bowl('#9fc4d8', `<ellipse class="p ripple" cx="50" cy="119" rx="10" ry="2.5" fill="none" stroke="#e6f6ff" stroke-width="1.5"/>`),
    feed: sp => sp === 'human'
      ? `<g class="p spoon"><path d="M0 0 L16 -14" stroke="#b0a79a" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="18" cy="-16" rx="4.5" ry="3" fill="#b0a79a"/><ellipse cx="18" cy="-17" rx="3" ry="1.8" fill="#e9b872"/></g>`
      : bowl('#c58f62', `<circle cx="42" cy="118" r="2.2" fill="#8a5a3a"/><circle cx="50" cy="116.5" r="2.2" fill="#8a5a3a"/><circle cx="58" cy="118" r="2.2" fill="#8a5a3a"/>`),
    play: () => `<g class="p ball"><circle r="7" fill="#e86a5a"/><path d="M-7 0 H7" stroke="#fff" stroke-width="1.6"/><path d="M0 -7 V7" stroke="#fff" stroke-width="1.6" opacity=".5"/></g>`,
    soothe: () => ['Z', 'Z', 'z'].map((z, i) => `<text class="p zz" style="animation-delay:${i * 0.5}s" x="${64 + i * 6}" y="${34 - i * 4}" font-size="${14 - i * 2}" font-weight="700" fill="#8fa3c8">${z}</text>`).join(''),
    rest: () => FX.soothe(),
    medicine: () => `<g class="p pill"><rect x="-8" y="-4" width="16" height="8" rx="4" fill="#fff" stroke="#d8d4cc"/><path d="M0 -4 H4 A4 4 0 0 1 4 4 H0Z" fill="#e8707e"/></g><path class="p spark" d="M30 40 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" fill="#f4d36a"/>`,
    warm: () => `<circle class="p glow" cx="50" cy="70" r="22" fill="#ffb55a" opacity=".35"/><circle class="p glow" style="animation-delay:.6s" cx="50" cy="70" r="22" fill="none" stroke="#ffb55a" stroke-width="2"/>`,
    walk: () => [22, 50, 78].map((x, i) => `<g transform="translate(${x} 124)"><g class="p paw" style="animation-delay:${i * 0.4}s"><circle cx="0" cy="0" r="3.4" fill="#8a7d6b"/><circle cx="-5" cy="-5" r="1.7" fill="#8a7d6b"/><circle cx="0" cy="-7" r="1.7" fill="#8a7d6b"/><circle cx="5" cy="-5" r="1.7" fill="#8a7d6b"/></g></g>`).join(''),
    sun: () => `<g class="p glow" style="animation-iteration-count:infinite"><circle cx="18" cy="20" r="9" fill="#ffd25a"/></g>` + [0, 1, 2, 3, 4].map(i => `<path class="p fade" style="animation-delay:${i * 0.2}s" d="M${24 + i * 4} ${30 + i * 4} L${34 + i * 6} ${46 + i * 7}" stroke="#ffd25a" stroke-width="2" stroke-linecap="round"/>`).join(''),
    fertilize: () => [32, 50, 68].map((x, i) => `<g transform="translate(${x} 90)"><path class="p spark" style="animation-delay:${i * 0.3}s" d="M0 -5 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" fill="#9ccf6a"/></g>`).join(''),
    clean: () => [34, 50, 66].map((x, i) => `<g transform="translate(${x} 100)"><circle class="p rise" style="animation-delay:${i * 0.35}s" r="${4 - i * 0.6}" fill="none" stroke="#9cc9de" stroke-width="1.6"/></g>`).join(''),
    talk: () => `<g class="dots"><circle class="p dot" cx="72" cy="30" r="2.6" fill="#8a8378"/><circle class="p dot" style="animation-delay:.2s" cx="80" cy="30" r="2.6" fill="#8a8378"/><circle class="p dot" style="animation-delay:.4s" cx="88" cy="30" r="2.6" fill="#8a8378"/></g>`,
  };
  U.fxMarkup = (act, species) => `<svg viewBox="0 0 100 130">${(FX[act] || FX.pet)(species)}</svg>`;
  U.fxDuration = 3200;
  /* 游戏分钟显示成几分钟或几小时 */
  U.fmtMinutes = m => (m >= 60 ? t('unit.hour', { n: +(m / 60).toFixed(1) }) : t('unit.min', { n: Math.round(m) }));

  /* ---------- 构建 ---------- */
  U.buildRoom = function (root) {
    U.room = root;
    root.innerHTML = '<div class="scenewrap"><div class="scene" id="scene"></div></div><div class="stagewrap"><div class="stage" id="stage"></div></div><div class="placenav" id="placeNav"></div><button class="navarrow l" id="navL" aria-label="‹">‹</button><button class="navarrow r" id="navR" aria-label="›">›</button><div class="roster" id="roster"></div><div class="cornerbox"><button class="corner" id="cornerTime"></button><button class="corner" id="cornerFamily" style="display:none;cursor:default"></button><button class="corner" id="cornerMoney"></button><button class="corner" id="cornerMusic"></button><button class="corner" id="cornerPeople">👥</button></div><div class="dlgcard" id="dlgCard"></div><svg id="hold" viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/><circle class="fg" cx="32" cy="32" r="26"/></svg>';
    root.addEventListener('pointerdown', e => { if (!e.target.closest('#ringLayer') && !e.target.closest('.cx')) U.closeRing(); });
    document.addEventListener('pointerdown', e => { if (!root.contains(e.target) && !e.target.closest('#ringLayer')) U.closeRing(); });
    /* 左右滑动换地点 */
    let sx = null;
    root.addEventListener('pointerdown', e => { sx = e.target.closest('.cx') || e.target.closest('#ringLayer') || e.target.closest('#placeNav') || e.target.closest('.navarrow') ? null : e.clientX; });
    root.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 70) U.cyclePlace(dx < 0 ? 1 : -1); });
    /* 鼠标悬停：移到谁身上，谁的菜单就弹出，不用点 */
    root.addEventListener('pointermove', onHover);
    U.renderRoom(true);
  };

  /* ---------- 悬停弹出，重叠的人怎么选 ----------
     命中区只算身体，不算名字和气泡；指针落在几个人的命中区里，选离身体中心最近的那个，一样近的取站得靠前的。
     停够 0.12 秒才弹，扫过的不算；菜单已经开着时，换人要停 0.35 秒，指针在菜单圈里不会换；指针离开人和菜单圈 0.4 秒后收起。
     只有悬停弹出的菜单会自动收起，点开的和名单里点开的不会。 */
  const HIT = { l: 0.18, r: 0.82, t: 0.12, b: 0.97 };
  U.pickAt = function (x, y) {
    let best = null, bd = 1e9, bz = -1e9;
    for (const c of U.room.querySelectorAll('.stage .cx[data-id]')) {
      if (c.style.display === 'none') continue;
      const b = c.querySelector('.body').getBoundingClientRect(); if (!b.width) continue;
      const l = b.left + b.width * HIT.l, r = b.left + b.width * HIT.r, tp = b.top + b.height * HIT.t, bt = b.top + b.height * HIT.b;
      if (x < l || x > r || y < tp || y > bt) continue;
      const d = Math.hypot(x - (l + r) / 2, (y - (tp + (bt - tp) * 0.45)) * 0.8), z = +(c.style.getPropertyValue('--z') || 0);
      if (d < bd - 4 || (Math.abs(d - bd) <= 4 && z > bz)) { best = c; bd = d; bz = z; }
    }
    return best;
  };
  let hoverT = null, closeT = null;
  const setHov = id => { for (const c of U.room.querySelectorAll('.cx.hov')) if (c.dataset.id !== id) c.classList.remove('hov'); const c = id && $r(`.cx[data-id="${id}"]`); if (c) c.classList.add('hov'); };
  function onHover(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (U.holdPid || e.buttons) return;
    if (e.target.closest('.bubble, #dlgCard, #placeNav, #roster, .cornerbox')) { clearTimeout(hoverT); hoverT = null; setHov(null); return; }
    const ring = $r('#ringLayer'), g = ring && U.ringGeom;
    const overRing = ring && (e.target.closest('#ringLayer') || (g && e.clientX >= g.l - 12 && e.clientX <= g.r + 12 && e.clientY >= g.t - 12 && e.clientY <= g.b + 12));
    const hit = overRing && e.target.closest('#ringLayer') ? null : U.pickAt(e.clientX, e.clientY), id = hit ? hit.dataset.id : null;
    setHov(id);
    if (id && ring && U.sel === id) { clearTimeout(hoverT); hoverT = null; clearTimeout(closeT); closeT = null; return; }
    if (id) {
      clearTimeout(closeT); closeT = null;
      /* 悬停只高亮并让他停住，操作圈要单击才弹出，免得遮挡 */
      U.hoverId = id; U.syncFreeze();
      return;
    }
    if (hoverT) { clearTimeout(hoverT.t); hoverT = null; }
    if (ring && U.ringByHover && !overRing && !closeT) closeT = setTimeout(() => { closeT = null; if (!U.holdPid && U.ringByHover) { U.closeRing(); U.hoverId = null; U.syncFreeze(); } }, 400);
    else if (overRing) { clearTimeout(closeT); closeT = null; }
    if (!ring && !id && U.hoverId) { U.hoverId = null; U.syncFreeze(); }
  }

  /* 页面：家，办公室，医院是斜视的房子，最后一页是全家总览，原来的大头像加状态 */
  U.viewPlace = 'home';
  /* 家的全局图在最前面，后面是每个房间自己的一页，只画这一页的房间，别的地方接在后面。viewPlace 是 home 或 home:区域 或别的地方 */
  U.basePlace = () => String(U.viewPlace).split(':')[0];
  U.viewZone = () => (String(U.viewPlace).includes(':') ? String(U.viewPlace).split(':')[1] : null);
  U.zoneDef = id => U.ZONES.find(z => z.id === id);
  U.houseView = () => (ini.get(G.cfg, 'ui', 'house_view') === 'house' ? 'house' : 'rooms');
  U.PAGES = () => {
    if (!G.activePeople().length) return [];
    const out = [], rooms = U.houseView() === 'rooms';
    for (const p of CY.world.occupiedPlaces()) {
      if (p !== 'home') { out.push(p); continue; }
      if (rooms) for (const z of U.ZONES) out.push('home:' + z.id); else out.push('home');
    }
    return out;
  };
  /* 换到另一页，d 是方向：1 新页从右边滑进来，-1 从左边。旧页的画面复制一份滑出去；镜头不做过渡，免得斜着飞过去 */
  U.goPage = function (page, d) {
    const room = U.room, motion = d && room.classList.contains('iso') && !(win().matchMedia && win().matchMedia('(prefers-reduced-motion: reduce)').matches);
    const ghosts = [];
    if ($r('#ringLayer') && U.closeRing) U.closeRing();   /* 操作圈属于上一页的人，换页先收起，名单跳转会在新页重新打开 */
    if (motion) for (const w of room.querySelectorAll('.scenewrap:not(.ghost), .stagewrap:not(.ghost)')) {
      const g = w.cloneNode(true); g.classList.add('ghost'); g.querySelectorAll('[id]').forEach(n => n.removeAttribute('id')); room.insertBefore(g, w.nextSibling); ghosts.push(g);
    }
    U.camJump = true; U.viewPlace = page; U.renderRoom(true); U.camJump = false;
    if (!motion) return;
    const mv = (el, from, to, done) => { if (!el.animate) { if (done) done(); return; } const an = el.animate([{ transform: `translateX(${from}%)` }, { transform: `translateX(${to}%)` }], { duration: 360, easing: 'ease-in-out' }); if (done) an.onfinish = done; };
    for (const g of ghosts) mv(g, 0, -d * 100, () => g.remove());
    for (const w of room.querySelectorAll('.scenewrap:not(.ghost), .stagewrap:not(.ghost)')) mv(w, d * 100, 0);
    win().setTimeout(() => ghosts.forEach(g => g.remove()), 700);
  };
  U.cyclePlace = function (d) { const L = U.PAGES(); if (L.length < 2) return; const i = L.indexOf(U.viewPlace); U.goPage(L[(i + d + L.length) % L.length], d); };
  /* 一页的名字，家里的区域页用里面的房间名 */
  U.pageName = pg => { const z = String(pg).includes(':') ? U.zoneDef(String(pg).split(':')[1]) : null; return z ? z.rooms.map(r => t('loc.' + r)).join(' · ') : pg ? t('loc.' + pg) : ''; };
  /* 这个人现在在哪一页 */
  U.pageOf = p => {
    const W = CY.world, loc = W.driven(p) ? W.player() : W.locationOf(p);
    if (loc.place !== 'home' || U.houseView() !== 'rooms') return loc.place;
    const z = U.ZONES.find(q => q.rooms.includes(loc.room));
    return z ? 'home:' + z.id : 'home';
  };
  U.calling = p => !!(G.req[p.id] || G.needy(p) || G.crying[p.id]);
  U.renderScene = function () {
    const el = $r('#scene'); if (!el) return;
    const pages = U.PAGES();
    if (pages.length && !pages.includes(U.viewPlace)) U.viewPlace = pages[0];
    const h = G.dayMinutes() / 60, fam = U.viewPlace === 'family' || !pages.length;
    U.room.classList.toggle('iso', !fam);
    if (!fam) U.room.style.aspectRatio = CY.world.vw(U.basePlace()) + ' / ' + CY.world.vh(U.basePlace());   /* 画面比例随房子大小变，小人按百分比摆才对得上 */
    else U.room.style.aspectRatio = '';
    let sig, html;
    if (fam) {
      const id = CY.scenes.resolve(ini.get(G.cfg, 'ui', 'scene'), h);
      sig = 'f|' + (id || 'none') + '|' + CY.scenes.phase(h); html = () => (id ? CY.scenes.svg(id, h) : '');
      U.room.classList.toggle('hasscene', !!id);
    } else { sig = U.viewPlace + '|' + Math.floor(h * 2) + '|' + CY.i18n.lang + '|' + CY.world.bedKey() + '|' + (CY.game.tableFood() ? 'f' : '') + (CY.game.itemAway('stroller') ? 's' : '') + (CY.game.itemAway('wheelchair') ? 'w' : '') + '|' + (CY.game.world.owned ? Object.keys(CY.game.world.owned).join() : ''); html = () => CY.iso.svg(U.basePlace(), h, U.viewZone() ? U.zoneDef(U.viewZone()).rooms : null); U.room.classList.add('hasscene'); }
    if (el.dataset.sig !== sig) { el.dataset.sig = sig; el.innerHTML = html(); }
  };

  /* 摆放：按格子位置直接站过去 */
  const paint = (el, place, gx, gy) => {
    const q = CY.world.project(place, gx, gy);
    el.style.left = (q.x / CY.world.vw(place) * 100) + '%'; el.style.top = (q.y / CY.world.vh(place) * 100) + '%'; el.style.setProperty('--z', Math.round(q.y));
  };
  /* 斜视里走的方向对应四个朝向：格子 x 增大朝右下 se，y 增大朝左下 sw，x 减小朝左上 nw，y 减小朝右上 ne */
  const dirOf = (dx, dy) => CY.world.dirOf(dx, dy);
  U.moveFig = function (el, place, gx, gy) {
    if (el._frozen) return;
    const cur = el._pos;
    if (cur && cur.place === place && Math.abs(cur.gx - gx) + Math.abs(cur.gy - gy) < 0.01) return;
    el._pos = { place, gx, gy }; paint(el, place, gx, gy);
    /* 走的时候朝着走的方向，身体轻轻起伏，到了就停 */
    if (cur && cur.place === place) {
      el._dir = dirOf(gx - cur.gx, gy - cur.gy);
      el.classList.add('walking'); clearTimeout(el._wt);
      el._wt = setTimeout(() => { el.classList.remove('walking'); el._dir = null; if (U.renderRoom) U.renderRoom(false); }, el.classList.contains('lead') || el.classList.contains('player') ? 1300 : 7200);
    }
  };

  /* 悬停或点选的人停在原地，包括正在慢慢走的：把当前位置固定下来，放开后再接着往目标走 */
  const freezeEl = (el, on) => {
    if (on && !el._frozen) { el.classList.remove('walking'); const cs = win().getComputedStyle(el); el.style.transition = 'none'; el.style.left = cs.left; el.style.top = cs.top; el._frozen = true; }
    else if (!on && el._frozen) { el._frozen = false; el._pos = null; el.style.transition = ''; }
  };
  U.hoverId = null;
  U.frozenIds = () => { const s = new Set(); if (U.hoverId) s.add(U.hoverId); if ($r('#ringLayer') && U.sel) s.add(U.sel); if (U.holdPid) s.add(U.holdPid); for (const id in G.req) s.add(id); return s; };
  U.syncFreeze = () => {
    const ids = U.frozenIds(), W = CY.world;
    for (const id of [...W.frozen]) if (!ids.has(id)) W.freeze(id, false);
    for (const id of ids) W.freeze(id, true);
    for (const c of U.room.querySelectorAll('.cx[data-id]')) freezeEl(c, ids.has(c.dataset.id));
  };

  /* 昼夜色调：夜里偏蓝，黄昏偏橙，清晨淡淡的暖色 */
  /* 动态的快慢跟着时间倍率走：倍率越高，叶子摇得越快，蝴蝶飞得越快，人走得也越快；--tempo 是 1 对应默认倍率 24 */
  U.tempo = () => Math.min(2.2, Math.max(0.4, Math.pow(G.speed() / 24, 0.35)));
  U.renderTint = function () {
    const h = G.dayMinutes() / 60;
    U.room.style.setProperty('--tempo', U.tempo().toFixed(2)); 
    let tint = 'transparent';
    if (h >= 22 || h < 5) tint = 'rgba(30,40,90,.38)';
    else if (h < 7) tint = 'rgba(255,190,120,.14)';
    else if (h >= 18 && h < 20) tint = 'rgba(255,150,80,.12)';
    else if (h >= 20 && h < 22) tint = 'rgba(60,60,130,.22)';
    if (U.room.dataset.tint !== tint) { U.room.dataset.tint = tint; U.room.style.setProperty('--tint', tint); }
  };

  /* ---------- 每秒刷新 ---------- */
  U.renderRoom = function (force) {
    const stage = $r('#stage');
    if (!stage) return;
    U.renderTint(); U.renderScene();
    const pages = U.PAGES(), fam = U.viewPlace === 'family' || !pages.length;
    const zr = U.viewZone() ? U.zoneDef(U.viewZone()).rooms : null;
    const all = G.activePeople(), laid = fam ? null : new Map(CY.world.layout(U.basePlace()).filter(l => !zr || zr.includes(l.room)).map(l => [l.id, l])), people = fam ? all : all.filter(p => laid.has(p.id));
    const topP = people.slice().sort((a, b) => G.urgency(b) - G.urgency(a))[0], topId = topP && G.urgency(topP) > 0.7 ? topP.id : null;
    for (const c of [...stage.querySelectorAll('.cx')]) if (!people.some(p => p.id === c.dataset.id)) c.remove();
    $r('#roomEmpty') && $r('#roomEmpty').remove();
    if (!all.length) { const d = doc().createElement('div'); d.id = 'roomEmpty'; d.className = 'mute'; d.textContent = t('room.empty'); stage.appendChild(d); }
    /* 对话卡一次只开一张：沿用手上这张，没有了才换最新的请求；其余请求收成头顶的小标，点了才换过去 */
    const cands = people.filter(p => G.req[p.id] && !G.req[p.id].folded);
    if (!cands.some(p => p.id === U.cardPid)) U.cardPid = (cands.sort((a, b) => G.req[b.id].since - G.req[a.id].since)[0] || {}).id || null;
    for (const p of people) {
      let c = stage.querySelector(`.cx[data-id="${p.id}"]`);
      if (!c) {
        c = doc().createElement('div'); c.className = 'cx'; c.dataset.id = p.id;
        c.innerHTML = '<div class="body"></div><div class="fx"></div><div class="pops"></div><div class="tears"><svg viewBox="0 0 100 130"><path class="drop" d="M34 58 q-4 7 0 10 q4 -3 0 -10Z"/><path class="drop d2" d="M66 58 q-4 7 0 10 q4 -3 0 -10Z"/></svg></div><div class="badges"></div><div class="nm"></div><div class="slot"></div>';
        /* 单击弹出操作圈，鼠标移上去只高亮。重叠的人由 pickAt 按指针离谁近选 */
        c.onclick = e => { if (e.target.closest('.bubble')) return; if ($r('#ringLayer') && U.sel === p.id) return; U.sel = p.id; U.ringByHover = false; U.openRing(p.id); };
        c.style.transition = 'none';
        stage.appendChild(c);
        win().requestAnimationFrame(() => { if (!c._frozen) c.style.transition = ''; });
      }
      c.classList.toggle('lead', p === G.protagonist());
      if (fam) { c.style.left = ''; c.style.top = ''; c.style.removeProperty('--z'); c._pos = null; }
      else {
        const lp = laid.get(p.id);
        U.moveFig(c, U.basePlace(), lp.gx, lp.gy);
      }
      const W0 = CY.world, working = !fam && (W0.isWorking(p) || (W0.driven(p) && W0.atWork() && laid.get(p.id).room === 'study'));
      /* 站着不动的人按朝向规则看向某处，走的时候朝着走的方向 */
      const face = fam || c._dir || working || G.isSleeping(p) ? '' : W0.facing(p, [...laid.values()]);
      const dir = fam ? '' : c._dir || (working ? 'ne' : face);
      c.classList.toggle('working', working && !c._dir);
      const look = JSON.stringify(p.person.appearance) + (p.person.age_stage || '') + Math.round(p.state.mood * 3) + (G.isSleeping(p) ? 'z' : '') + (fam ? 'F' : 'M') + dir;
      if (force || c.dataset.av !== look) { c.querySelector('.body').innerHTML = CY.avatar(p, dir, G.isSleeping(p) && c._dir ? 'awake' : working && !c._dir ? 'sit' : face ? 'stand' : ''); c.dataset.av = look; const ims = [...c.querySelectorAll('.body image')].map(im => parseFloat(im.getAttribute('y'))).filter(v => !isNaN(v)); c.style.setProperty('--hd', ims.length ? Math.max(0, Math.min(...ims) / 130).toFixed(3) : 0); }
      c.classList.toggle('frail', p.state.frailty >= 0.7);
      c.classList.toggle('crying', !!G.crying[p.id]);
      c.classList.toggle('sleeping', G.isSleeping(p) && !c._dir);
      c.classList.toggle('top', topId === p.id);
      c.classList.toggle('needy', G.needy(p));
      c.classList.toggle('sel', U.sel === p.id);
      const nmSig = (p === G.protagonist() ? '★' : '') + p.person.name + Math.round(p.state.mood * 20) + Math.round(p.state.frailty * 20) + p.story.care_total + CY.i18n.lang + G.isSleeping(p) + (p.person.conditions || []).length;
      if (c.dataset.nm !== nmSig) {
        c.dataset.nm = nmSig;
        const pct = v => Math.round(v * 100);
        c.querySelector('.nm').innerHTML = `<b>${p === G.protagonist() ? '★ ' : ''}${esc(p.person.name)}</b>
          <div class="bar mood" title="${esc(t('room.bar', { mood: pct(p.state.mood), frail: pct(p.state.frailty) }))}"><i style="width:${pct(p.state.mood)}%"></i></div>`;
      }
      /* 动作动画 */
      const fx = G.fx[p.id];
      if (fx && Date.now() - fx.t < U.fxDuration) {
        if (c.dataset.fxt !== String(fx.t)) { c.dataset.fxt = String(fx.t); c.dataset.fx = fx.act; c.querySelector('.fx').innerHTML = U.fxMarkup(fx.act, p.species.id); }
      } else if (c.dataset.fx) { delete c.dataset.fx; delete c.dataset.fxt; c.querySelector('.fx').innerHTML = ''; }
      /* 头顶只留一个槽：打勾是短暂插队，其余按轻重只显示最要紧的一件，其他的在操作面板里看 */
      {
        if (c._popN === undefined) c._popN = 0;
        for (const e of G.pops) if (e.pid === p.id && e.n > c._popN) { c._popN = e.n; if (e.kind === 'done' && Date.now() - e.t < 3000) c._doneUntil = Date.now() + 1300; }
      }
      const defs = G.needsOf(p), lit = Object.keys(defs).filter(k => G.need(p, k) > U.NEED_LIT).sort((a, b) => G.need(p, b) - G.need(p, a));
      const req = G.req[p.id], toast = G.toast[p.id], hid = !!req && (req.folded || U.cardPid !== p.id);
      const done = c._doneUntil > Date.now();
      let lane = '';
      if (done) lane = '<span class="done">✓</span>';
      else if (!req) {
        const one = (ic, tt, urgent, n) => `<span class="${urgent ? 'urgent' : ''}" title="${esc(tt)}">${ic}${n ? '<i class="n">+' + n + '</i>' : ''}</span>`;
        if (G.flag(p, 'hurt')) lane = one('❗', t('log.fall_minor', { name: p.person.name }), true);
        else if (G.crying[p.id]) lane = one('😭', lit.map(k => G.needLabel(k, defs[k])).join(' '), true);
        else if (G.flag(p, 'hospital')) lane = one('🏥', t('loc.hospital'));
        else if (CY.world.errandOf(p) === 'help') lane = one('🤝', t('badge.help'));
        else if (lit.length) lane = one(defs[lit[0]].icon || '•', lit.map(k => G.needLabel(k, defs[k])).join(' '), G.need(p, lit[0]) > 0.85, lit.length - 1);
        else if (G.isSleeping(p)) lane = one('💤', t('act.sleeping'));
      }
      if (c.dataset.bd !== lane) { c.querySelector('.badges').innerHTML = lane; c.dataset.bd = lane; }
      c.classList.toggle('donenow', done);
      /* 身体上一次只演一种持续的动画：做动作 > 哭 > 有事找人 > 虚弱 */
      c.dataset.st = (fx && Date.now() - fx.t < U.fxDuration) ? 'act' : G.crying[p.id] ? 'cry' : (req || G.needy(p)) ? 'need' : p.state.frailty >= 0.7 ? 'frail' : '';
      /* 头顶槽：有请求就是一个小标，点了在底部的对话卡里展开；闲聊是一个小气泡；哭闹不弹气泡，只有身体和头顶的图标；揭示和送礼走对话卡 */
      const big = !!toast && (toast.kind === 'reveal' || toast.kind === 'gift');
      const icon = req ? (req.kind === 'need' ? (defs[req.need] || {}).icon || '💬' : '💬') : '';
      const sig = req ? 'c' + icon + (hid ? '' : 'o') + CY.i18n.lang : toast && toast.kind !== 'cry' && !(big && !U.cardPid) ? 't' + toast.kind + toast.text : '';
      c.classList.toggle('talk', !!sig);
      const slot = c.querySelector('.slot');
      if (c.dataset.sig !== sig) {
        c.dataset.sig = sig;
        if (!sig) slot.innerHTML = '';
        else if (req) {
          slot.innerHTML = '<div class="bubble chip' + (hid ? '' : ' on') + '" role="button" tabindex="0">' + esc(icon) + '</div>';
          const open = e => { e.stopPropagation(); req.folded = false; req.pinned = true; if (req.kind !== 'need') req.deadline = 0; U.cardPid = p.id; c.dataset.sig = ''; U.renderRoom(true); };
          const ch = slot.querySelector('.chip'); ch.onclick = open; ch.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') open(e); };
        } else slot.innerHTML = `<div class="bubble ${toast.kind}" title="${esc(toast.text)}">${esc(toast.text)}</div>`;
      }
    }
    U.updateCam(fam ? null : laid, people);
    U.renderCard(people);
    U.fitBubbles(U.room);
    U.syncFreeze(); U.renderPlayer(); U.renderNav(); U.renderRoster();
  };

  /* 对话气泡不出框，不互相压：每次画完量一下。超出左右就往里挪，尖角仍指着说话的人；顶上放不下就压低一点；两个气泡重叠，后面的往上让 */
  U.fitBubbles = function (root) {
    const rr = root.getBoundingClientRect(), bs = [...root.querySelectorAll('.cx .bubble')];
    for (const b of bs) { b.style.marginLeft = ''; b.style.transform = ''; b.style.setProperty('--dx', '0px'); }
    const top = rr.top + 44;
    for (const b of bs) {
      const r = b.getBoundingClientRect();
      let dx = 0, dy = 0;
      if (r.left < rr.left + 6) dx = rr.left + 6 - r.left; else if (r.right > rr.right - 6) dx = rr.right - 6 - r.right;
      if (r.top < top) dy = top - r.top;
      if (dx) { b.style.marginLeft = dx + 'px'; b.style.setProperty('--dx', dx + 'px'); }
      if (dy) b.style.transform = 'translateX(-50%) translateY(' + dy + 'px)';
    }
    const seen = [];
    for (const b of bs) {
      let r = b.getBoundingClientRect();
      for (const o of seen) {
        const q = o.getBoundingClientRect();
        if (r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top) {
          const up = r.bottom - q.top + 4;
          const cur = /translateY\((-?[\d.]+)px\)/.exec(b.style.transform);
          b.style.transform = 'translateX(-50%) translateY(' + ((cur ? +cur[1] : 0) - up) + 'px)';
          r = b.getBoundingClientRect();
        }
      }
      seen.push(b);
    }
    for (const b of bs) {
      const r = b.getBoundingClientRect();
      if (r.top < top) { const cur = /translateY\((-?[\d.]+)px\)/.exec(b.style.transform); b.style.transform = 'translateX(-50%) translateY(' + ((cur ? +cur[1] : 0) + top - r.top) + 'px)'; }
    }
  };

  /* ---------- 主角，地点导航，角上的名单 ---------- */
  /* 玩家没有自己的小人：操纵对象是家里一个真角色，画面上就是他，所以这里只清理旧版本留下的"你" */
  U.renderPlayer = function () { const old = $r('#stage').querySelector('.cx.player'); if (old) old.remove(); };
  /* ---------- 房间镜头 ----------
     家是一整张图，镜头每次框住一个区域，自动跟着操纵对象走；点房间条可以去别处看，操纵对象换了区域就跟回来。
     别的区域里有人在叫，房间条上那个区域亮一个点。其余的地方不是平铺的，镜头只是裁剪和放大，数据和位置都不变。 */
  U.ZONES = [
    { id: 'living', icon: '🛋️', rooms: ['living', 'kitchen'] },
    { id: 'sleep', icon: '🛏️', rooms: ['bedroom', 'kids', 'elder'] },
    { id: 'work', icon: '💻', rooms: ['study', 'toilet'] },
    { id: 'yard', icon: '🌳', rooms: ['yard'] },
    { id: 'guest', icon: '🛌', rooms: ['guest'] },
  ];
  U.CAM_ZMAX = 2.2;
  U.camZone = null;
  /* 一个区域在画面里的取景：用房间的菱形外框，高度算上墙，放大倍数不超过上限 */
  U.camFrame = id => {
    const W = CY.world, P = W.PLACES.home, z = U.ZONES.find(q => q.id === id), VW = W.vw('home'), VH = W.vh('home');
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const rn of z.rooms) {
      const r = P.rooms[rn]; if (!r) continue;
      for (const [gx, gy] of [[r.gx, r.gy], [r.gx + r.w, r.gy], [r.gx, r.gy + r.h], [r.gx + r.w, r.gy + r.h]]) { const q = W.project('home', gx, gy); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y - 80); y1 = Math.max(y1, q.y + 24); }
    }
    if (x0 > x1) return { s: 1, x: 0, y: 0 };
    x0 -= 24; x1 += 24;
    const s = Math.max(1, Math.min(U.CAM_ZMAX, VW / (x1 - x0), VH / (y1 - y0))), w = VW / s, h = VH / s;
    const left = Math.max(0, Math.min(VW - w, (x0 + x1) / 2 - w / 2)), top = Math.max(0, Math.min(VH - h, (y0 + y1) / 2 - h / 2));
    return { s, x: left / VW, y: top / VH };
  };
  U.updateCam = function (laid, people) {
    U._laid = laid;
    const sc = $r('#scene'), st = $r('#stage'); if (!sc || !st) return;
    const z = laid ? U.viewZone() : null;
    const f = z ? U.camFrame(z) : { s: 1, x: 0, y: 0 };
    U.camZone = z;
    const sig = f.s.toFixed(3) + ',' + f.x.toFixed(4) + ',' + f.y.toFixed(4);
    if (U.room.dataset.cam === sig) return;
    const first = U.room.dataset.cam === undefined || U.camJump;
    U.room.dataset.cam = sig;
    const tf = f.s === 1 && !f.x && !f.y ? '' : `scale(${f.s.toFixed(4)}) translate(${(-f.x * 100).toFixed(3)}%, ${(-f.y * 100).toFixed(3)}%)`;
    for (const el of [sc, st]) { el.style.transition = first ? 'none' : ''; el.style.transform = tf; }
    U.room.style.setProperty('--zoom', f.s.toFixed(3));
  };
  U.renderNav = function () {
    const nav = $r('#placeNav'); if (!nav) return;
    const W = CY.world, at = W.where(), pages = U.PAGES(), fam = U.viewPlace === 'family';
    nav.style.display = pages.length ? '' : 'none';
    for (const id of ['#navL', '#navR']) { const b = $r(id); if (b) { b.style.display = pages.length > 1 ? '' : 'none'; b.onclick = e => { e.stopPropagation(); U.cyclePlace(id === '#navL' ? -1 : 1); }; } }
    {
      const n = pages.length, i = pages.indexOf(U.viewPlace), dirCall = { '-1': false, 1: false };
      if (n > 1 && i >= 0) for (const p of G.activePeople()) {
        if (!U.calling(p)) continue;
        const j = pages.indexOf(U.pageOf(p)); if (j < 0 || j === i) continue;
        const fwd = (j - i + n) % n; dirCall[fwd <= n - fwd ? 1 : -1] = true;
      }
      for (const [id, d] of [['#navL', -1], ['#navR', 1]]) { const b = $r(id); if (b) b.classList.toggle('call', !!dirCall[d]); }
    }
    const here = t('nav.here', { place: t('loc.' + at.place) + (at.room ? ' · ' + t('loc.' + at.room) : '') });
    const away = !fam && at.place !== U.viewPlace && ['hospital', 'office', 'school'].includes(U.viewPlace);   /* 家里的区域页不算出门，viewPlace 带冒号 */
    const min = away ? W.travelMin(at.place, U.viewPlace) : 0;
    const zs = '';
    const sig = [U.viewPlace, here, away, min, pages.join(), CY.i18n.lang, zs].join('|');
    if (nav.dataset.sig === sig) return;
    nav.dataset.sig = sig;
    const pn = U.pageName(U.viewPlace);
    nav.innerHTML = `<b>${esc(pn)}</b>` + (fam ? '' : `<span class="here">${esc(here)}</span>`) +
      (away ? `<button class="travel" id="travelBtn">${esc(t('nav.travel_hold', { place: pn, n: W.travelHold(at.place, U.viewPlace) }))}</button>` : '');
    nav.querySelectorAll('[data-d]').forEach(b => b.onclick = e => { e.stopPropagation(); U.cyclePlace(+b.dataset.d); });
    const tb = nav.querySelector('#travelBtn');
    if (!tb) return;
    tb.onpointerdown = e => {
      e.preventDefault(); tb.setPointerCapture(e.pointerId);
      const dur = W.travelHold(at.place, U.viewPlace) * 1000, t0 = performance.now(); let raf;
      const stop = ok => { win().cancelAnimationFrame(raf); tb.style.setProperty('--k', 0); tb.onpointerup = tb.onpointercancel = null; if (ok) { W.travel(U.viewPlace); U.renderRoom(true); } };
      const step = () => { const k = Math.min(1, (performance.now() - t0) / dur); tb.style.setProperty('--k', k); if (k >= 1) stop(true); else raf = win().requestAnimationFrame(step); };
      tb.onpointerup = tb.onpointercancel = () => stop(false); raf = win().requestAnimationFrame(step);
    };
  };
  /* 角上缩小的名单：原来的头像和状态，点一下出菜单 */
  U.renderRoster = function () {
    const box = $r('#roster'); if (!box) return;
    const people = G.activePeople(), fam = U.viewPlace === 'family' || !U.PAGES().length;
    box.style.display = fam || !people.length ? 'none' : '';
    if (fam) return;
    const sig = U.viewPlace + '|' + people.map(p => [U.pageOf(p), p.id, p.person.name, Math.round(p.state.mood * 10), Math.round(G.maxNeed(p) * 10), !!G.req[p.id], G.needy(p), G.topNeed(p), G.isSleeping(p), !!G.flag(p, 'hospital'), !!G.flag(p, 'hurt')].join(':')).join('|') + CY.i18n.lang;
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    box.innerHTML = people.map(p => {
      const defs = G.needsOf(p), tn = G.topNeed(p), urgent = G.need(p, tn) > U.NEED_LIT;
      const pg = U.pageOf(p), away = pg !== U.viewPlace;
      return `<div class="rcard ${G.req[p.id] || G.needy(p) ? 'calling' : ''} ${away ? 'away' : ''} ${U.sel === p.id ? 'sel' : ''}" data-id="${p.id}" title="${esc(p.person.name + (away ? ' → ' + U.pageName(pg) : ''))}"><div class="av">${CY.avatar(p)}</div>
        <div class="rn">${esc(p.person.name)}${G.isSleeping(p) ? ' 💤' : ''}${G.flag(p, 'hospital') ? ' 🏥' : ''}${G.flag(p, 'hurt') ? ' ❗' : ''}</div>
        <div class="bar mood"><i style="width:${Math.round(p.state.mood * 100)}%"></i></div>${urgent ? `<span class="rb ${G.need(p, tn) > 0.85 ? 'urgent' : ''}" title="${esc(G.needLabel(tn, defs[tn]))}">${(defs[tn] || {}).icon || '•'}</span>` : ''}${away ? `<span class="rl">→ ${esc(U.pageName(pg))}</span>` : ''}<span class="ri" data-i="${p.id}">ⓘ</span></div>`;
    }).join('');
    box.querySelectorAll('.rcard').forEach(el => el.onclick = e => {
      e.stopPropagation();
      if (e.target.closest('.ri')) { U.statusDialog(el.dataset.id); return; }
      const pid = el.dataset.id, pp = G.get(pid), pg = pp && U.pageOf(pp);
      if (pg && pg !== U.viewPlace) {   /* 人在别的页：先过去，再在那里打开操作圈 */
        const L = U.PAGES(), i = L.indexOf(U.viewPlace), j = L.indexOf(pg), n = L.length, fwd = (j - i + n) % n;
        U.sel = pid; U.ringByHover = false; U.goPage(pg, fwd <= n - fwd ? 1 : -1); U.openRing(pid); return;
      }
      U.sel = pid; U.ringByHover = false; U.openRing(pid, el);
    });
  };

  /* ---------- 环形菜单与长按 ---------- */
  /* 每个动作一个图标，围成一圈。悬停在中间显示名字和要按多久。有需求的动作是彩色，其余是灰色，灰色的也能点。 */
  const ACT_ICON = {
    park: '🌳', street: '🏪', pet: '🤚', hug: '🤗', water: '💧', feed: '🍼', meal: '🍲', diaper: '🚼', bath: '🛁', play: '🧸', read: '📖', soothe: '🌙', homework: '📚', game: '🎮', chat: '💬', rest: '🛋', walk: '🚶', hand: '🤝', doctor: '🩺',
    groom: '✨', vet: '🏥', clean: '🧹', train: '🎓', teach: '🗣', warm: '🔥', veggie: '🥬', mist: '💦', sun: '☀', fertilize: '🌱', prune: '✂', repot: '🪴',
    medicine: '💊', sugar: '🩸', bp: '🫀', heat: '♨', massage: '💆', fever: '🌡', cool: '🧊', inhaler: '💨', air: '🌬', remind: '☝', album: '📷',
    restsit: '💺', steady: '✋', listen: '👂', walkout: '🌳', lead: '🚽', nightlight: '💡', ointment: '🧴', trimnails: '💅', painkill: '🩹', support: '🤲', rehab: '🏃',
    gift: '🎁', invite_rest: '😴', stayclose: '🤍', warmdrink: '☕', antihist: '🤧', airclean: '🫧',
  };
  U.actIcon = (p, a) => {
    if (ACT_ICON[a.id]) return ACT_ICON[a.id];
    const defs = G.needsOf(p);
    for (const k in a.effect || {}) if (defs[k] && defs[k].icon) return defs[k].icon;
    return '•';
  };
  /* 这个动作能不能解决角色现在的某个需求 */
  /* 头顶的需求图标和环里亮起的行动用同一个门槛，也是宝宝和宠物开始催人的线 */
  U.NEED_LIT = 0.5;   /* 需求压力超过这个值，也就是水平低于 1 减它，就亮起来 */
  U.actUrgent = (p, a) => Object.keys(a.effect || {}).some(k => a.effect[k] > 0 && G.need(p, k) > U.NEED_LIT);
  const ringOff = () => { if (U.room) { U.room.classList.remove('ring-open'); U.room.querySelectorAll('.cx.ring-on').forEach(c => c.classList.remove('ring-on')); } };
  /* 操作结束，选中的状态跟着清掉：画面上的名字和左下的卡片都回到默认，选中只存在于操作面板开着的时候 */
  U.closeRing = function () { if (!U.room) return; const r = $r('#ringLayer'); if (r) r.remove(); U.ringByHover = false; U.sel = null; ringOff(); U.room.querySelectorAll('.sel').forEach(c => c.classList.remove('sel')); };
  /* 操作面板：贴在角色旁边，人本身完全露出来。名字和状态在上，现在的需求在中间，动作图标按急不急排，更多里是编辑、详情、让他离开。
     面板开着时场景里其他人的头顶标记和闲聊都收起，只剩底部的对话卡。窄屏变成贴底的抽屉。 */
  U.openRing = function (pid, anchor) {
    U.closeRing();
    const p = G.get(pid), acts = Object.values(G.actionsOf(p));
    const fig = $r(`.cx[data-id="${pid}"]`);
    if (fig) fig.classList.add('ring-on');
    U.room.classList.add('ring-open');
    const cx = (anchor || fig || U.room).getBoundingClientRect();
    const vw = win().innerWidth, vh = win().innerHeight, narrow = vw < 640, W = narrow ? vw - 16 : 244;
    const layer = doc().createElement('div');
    layer.id = 'ringLayer'; layer.className = 'opanel' + (narrow ? ' sheet' : '');
    layer.style.width = W + 'px';
    const defs = G.needsOf(p), lit = Object.keys(defs).filter(k => G.need(p, k) > U.NEED_LIT).sort((a, b) => G.need(p, b) - G.need(p, a));
    const conds = (p.person.conditions || []).map(k => CY.tOr('cond.' + k, (G.tpl.conditions[k] || {}).label || k)).join(' ');
    const head = doc().createElement('div'); head.className = 'ophead';
    head.innerHTML = `<b>${p === G.protagonist() ? '★ ' : ''}${esc(p.person.name)}</b>${G.isSleeping(p) ? '<span title="' + esc(t('act.sleeping')) + '">💤</span>' : ''}${conds ? '<span title="' + esc(conds) + '">🩺</span>' : ''}<button class="hb" data-a="info">${esc(t('btn.status'))}</button>${p.person.visitor ? '' : `<button class="hb" data-a="edit">${esc(t('btn.edit'))}</button>`}<button class="x" aria-label="×">×</button>`;
    head.querySelector('[data-a=info]').onclick = () => { U.closeRing(); U.renderRoom(true); U.statusDialog(pid); };
    const eb = head.querySelector('[data-a=edit]'); if (eb) eb.onclick = () => { U.closeRing(); U.renderRoom(true); U.addDialog(null, () => {}, pid); };
    head.querySelector('.x').onclick = () => { U.closeRing(); U.renderRoom(true); };
    layer.appendChild(head);
    if (lit.length) {
      const nd = doc().createElement('div'); nd.className = 'opneeds';
      nd.innerHTML = lit.map(k => `<span class="${G.need(p, k) > 0.85 ? 'urgent' : ''}">${defs[k].icon || '•'} ${esc(G.needLabel(k, defs[k]))}</span>`).join('');
      layer.appendChild(nd);
    }
    const label = doc().createElement('div'); label.className = 'oplabel'; label.innerHTML = '&nbsp;';
    const home = () => { label.innerHTML = '&nbsp;'; };
    layer.appendChild(label);
    const grid = doc().createElement('div'); grid.className = 'opgrid';
    acts.map(a => ({ a, urgent: U.actUrgent(p, a) })).sort((x, y) => (y.urgent ? 1 : 0) - (x.urgent ? 1 : 0)).forEach(({ a, urgent }) => {
      const sec = G.holdSeconds(a), cost = t('unit.sec', { n: sec % 1 ? sec.toFixed(1) : sec });
      const text = a.label + ' · ' + cost;
      const b = doc().createElement('button');
      b.className = 'ico ' + (urgent ? 'urgent' : 'calm');
      b.title = text; b.setAttribute('aria-label', text);
      b.innerHTML = `<span class="e">${U.actIcon(p, a)}</span>`;
      const show = () => { label.innerHTML = `<b>${esc(a.label)}</b><small>${esc(cost)}</small>`; };
      b.onpointerenter = show; b.onfocus = show; b.onpointerleave = home; b.onblur = home;
      b.onpointerdown = e => { e.preventDefault(); show(); b.setPointerCapture(e.pointerId); const r = b.getBoundingClientRect(); U.startHold(pid, a, r.left + r.width / 2, r.top + r.height / 2); };
      b.onpointerup = b.onpointercancel = () => U.endHold(false);
      grid.appendChild(b);
    });
    layer.appendChild(grid);
    layer.style.left = '0px'; layer.style.top = '0px';
    U.room.appendChild(layer);
    /* 先量一下容器的原点和面板的高度，再摆：右边放得下放右边，否则放左边；窄屏贴底 */
    const o = layer.getBoundingClientRect(), H = layer.offsetHeight;
    let x = cx.right + 10, y = cx.top - 10;
    if (x + W > vw - 8) x = cx.left - 10 - W;
    x = Math.min(vw - W - 8, Math.max(8, x));
    y = Math.min(vh - H - 8, Math.max(8, y));
    if (narrow) { x = 8; y = vh - H - 8; }
    layer.style.left = (x - o.left) + 'px'; layer.style.top = (y - o.top) + 'px';
    U.ringGeom = { l: x, t: y, r: x + W, b: y + H };
  };

  /* 对话卡：固定在房间底部，一次一张。请求在这里回答，揭示和送礼的话也在这里；场景里只留头顶的小标 */
  U.renderCard = function (people) {
    const host = $r('#dlgCard'); if (!host) return;
    const rp = U.cardPid && people.find(q => q.id === U.cardPid), req = rp && G.req[rp.id];
    let p = null, kind = '', sig = '';
    if (rp && req && !req.folded) { p = rp; kind = 'req'; sig = 'q' + p.id + req.kind + req.text + (req.options ? req.options.map(o => o.id).join() : '') + CY.i18n.lang; }
    else {
      const q = people.find(x => G.toast[x.id] && (G.toast[x.id].kind === 'reveal' || G.toast[x.id].kind === 'gift'));
      if (q) { p = q; kind = 'say'; sig = 'x' + q.id + G.toast[q.id].text; }
    }
    if (host.dataset.sig !== sig) {
      host.dataset.sig = sig;
      if (!p) host.innerHTML = '';
      else if (kind === 'say') {
        const to = G.toast[p.id];
        host.innerHTML = `<div class="bubble card ${to.kind}"><b>${esc(p.person.name)}</b><div>${esc(to.text)}</div><div class="btns"><button data-a="x" aria-label="×">×</button></div></div>`;
        host.querySelector('button').onclick = e => { e.stopPropagation(); delete G.toast[p.id]; U.renderRoom(true); };
      } else {
        let btn = '';
        if (req.kind === 'ask') btn = req.answers.map((a, i) => `<button class="opt" data-a="an${i}">${esc(a)}</button>`).join('') +
          `<div class="own"><input maxlength="120" placeholder="${esc(t('ask.own'))}"><button data-a="send" class="primary">${esc(t('ask.send'))}</button></div>`;
        else if (req.kind === 'choice') btn = req.choices.map((ch, i) => `<button data-a="ch${i}">${esc(ch.label)}</button>`).join('');
        else if (req.kind === 'pick') btn = req.options.map((o, i) => `<button class="opt" data-a="pk${i}">${esc(G.fmt(o.text, p))}</button>`).join('') + `<div class="row2"><button data-a="later">${esc(t('pick.reroll'))}</button></div>`;
        else if (req.kind === 'nudge') btn = `<button data-a="yes">${esc(t('nudge.yes'))}</button><button data-a="no">${esc(t('nudge.no'))}</button>`;
        else btn = `<button data-a="later">${esc(t('btn.later'))}</button>`;
        host.innerHTML = `<div class="bubble card ${req.kind}"><b>${esc(p.person.name)}</b><div>${esc(req.text)}</div><div class="btns">${btn}</div>${req.deadline ? '<div class="cd"></div>' : ''}</div>`;
        host.querySelectorAll('button').forEach(bt => bt.onclick = e => {
          e.stopPropagation();
          const a = bt.dataset.a;
          if (a === 'later') G.dismiss(p.id);
          else if (a === 'send') { const v = host.querySelector('.own input').value; if (v.trim()) G.answerAsk(p.id, null, v); }
          else if (a.startsWith('an')) G.answerAsk(p.id, +a.slice(2));
          else if (a === 'yes') G.answerNudge(p.id, true);
          else if (a === 'no') G.answerNudge(p.id, false);
          else if (a.startsWith('ch')) G.choose(p.id, +a.slice(2));
          else if (a.startsWith('pk')) G.pickSaying(p.id, +a.slice(2));
        });
        const inp = host.querySelector('.own input');
        if (inp) inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter' && inp.value.trim()) G.answerAsk(p.id, null, inp.value); };
      }
    }
    if (kind === 'req' && req.deadline) {
      const cd = host.querySelector('.cd');
      if (cd) cd.style.width = Math.max(0, (req.deadline - Date.now()) / (req.deadline - req.since) * 100) + '%';
    }
  };

  /* 长按：按住这么多秒，动作才做完。要照顾的人在别的地点，先去那里。同一个地点，主角直接出现在他旁边。
     中途松手就没做，主角留在原地几秒，勾了自动回岗位再回去。 */
  let hold = null;
  U.startHold = function (pid, a, x, y) {
    U.endHold(false);
    const W = CY.world, p = G.get(pid), need = W.enforce && p ? W.presenceNeed(p) : null;
    if (need && need.offsite) { G.toastFor(p, t(need.outing ? 'toast.outing' : 'toast.offsite', { name: p.person.name, place: t('loc.' + need.place) }), 'soft'); U.closeRing(); return; }
    W.holding = true;
    const h = $r('#hold');
    h.style.display = 'block'; h.style.left = x + 'px'; h.style.top = y + 'px';
    const fg = h.querySelector('.fg'), C = 2 * Math.PI * 26;
    fg.style.strokeDasharray = C; fg.style.strokeDashoffset = C;
    U.holdPid = pid;
    hold = { pid, a, start: performance.now(), dur: Math.max(1, G.holdSeconds(a) * 1000), C, fg, win: win() };
    const step = () => {
      if (!hold) return;
      const k = Math.min(1, (performance.now() - hold.start) / hold.dur);
      hold.fg.style.strokeDashoffset = hold.C * (1 - k);
      if (k >= 1) U.endHold(true); else hold.raf = hold.win.requestAnimationFrame(step);
    };
    hold.raf = hold.win.requestAnimationFrame(step);
  };
  U.endHold = function (done) {
    if (!hold) return;
    const h = hold; hold = null; U.holdPid = null;
    h.win.cancelAnimationFrame(h.raf);
    CY.world.holding = false; CY.world.lastActive = Date.now();
    const el = $r('#hold'); if (el) el.style.display = 'none';
    if (done) {
      U.closeRing();
      /* 送礼不是一次照料：长按做完后弹出礼物选择窗，选了才送 */
      if (h.a.id === 'gift') { U.renderRoom(true); U.giftDialog(h.pid); return; }
      G.perform(h.pid, h.a.id);
    }
    U.renderRoom(true);
  };

})(globalThis.CY = globalThis.CY || {});
