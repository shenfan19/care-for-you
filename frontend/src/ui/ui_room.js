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
    root.innerHTML = '<div class="scene" id="scene"></div><div class="stage" id="stage"></div><div class="placenav" id="placeNav"></div><div class="roster" id="roster"></div><div class="corner cl" id="cornerTime"></div><div class="cornerbox"><button class="corner" id="cornerMusic"></button><button class="corner" id="cornerMoney"></button></div><svg id="hold" viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/><circle class="fg" cx="32" cy="32" r="26"/></svg>';
    root.addEventListener('pointerdown', e => { if (!e.target.closest('#ringLayer') && !e.target.closest('.cx')) U.closeRing(); });
    document.addEventListener('pointerdown', e => { if (!root.contains(e.target) && !e.target.closest('#ringLayer')) U.closeRing(); });
    /* 左右滑动换地点 */
    let sx = null;
    root.addEventListener('pointerdown', e => { sx = e.target.closest('.cx') || e.target.closest('#ringLayer') || e.target.closest('#placeNav') ? null : e.clientX; });
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
    if (e.target.closest('.bubble, .away, .info, .edit, #placeNav, #roster, .cornerbox')) { clearTimeout(hoverT); hoverT = null; setHov(null); return; }
    const ring = $r('#ringLayer'), g = ring && U.ringGeom;
    const overRing = ring && (e.target.closest('#ringLayer') || (g && Math.hypot(e.clientX - g.x, e.clientY - g.y) <= g.r));
    const hit = overRing && e.target.closest('#ringLayer') ? null : U.pickAt(e.clientX, e.clientY), id = hit ? hit.dataset.id : null;
    setHov(id);
    if (id && ring && U.sel === id) { clearTimeout(hoverT); hoverT = null; clearTimeout(closeT); closeT = null; return; }
    if (id) {
      clearTimeout(closeT); closeT = null;
      if (hoverT && hoverT.id === id) return;
      clearTimeout(hoverT && hoverT.t);
      hoverT = { id, t: setTimeout(() => { hoverT = null; if (U.holdPid) return; U.hoverId = id; U.sel = id; U.openRing(id); U.ringByHover = true; }, ring ? 350 : 120) };
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
  U.PAGES = () => { const L = CY.world.occupiedPlaces(); return G.activePeople().length ? L.concat('family') : []; };
  U.cyclePlace = function (d) { const L = U.PAGES(); if (L.length < 2) return; const i = L.indexOf(U.viewPlace); U.viewPlace = L[(i + d + L.length) % L.length]; U.renderRoom(true); };
  U.renderScene = function () {
    const el = $r('#scene'); if (!el) return;
    const pages = U.PAGES();
    if (pages.length && !pages.includes(U.viewPlace)) U.viewPlace = pages[0];
    const h = G.dayMinutes() / 60, fam = U.viewPlace === 'family' || !pages.length;
    U.room.classList.toggle('iso', !fam);
    let sig, html;
    if (fam) {
      const id = CY.scenes.resolve(ini.get(G.cfg, 'ui', 'scene'), h);
      sig = 'f|' + (id || 'none') + '|' + CY.scenes.phase(h); html = () => (id ? CY.scenes.svg(id, h) : '');
      U.room.classList.toggle('hasscene', !!id);
    } else { sig = U.viewPlace + '|' + Math.floor(h * 2) + '|' + CY.i18n.lang; html = () => CY.iso.svg(U.viewPlace, h); U.room.classList.add('hasscene'); }
    if (el.dataset.sig !== sig) { el.dataset.sig = sig; el.innerHTML = html(); }
  };

  /* 摆放：按格子位置直接站过去 */
  const paint = (el, place, gx, gy) => {
    const q = CY.world.project(place, gx, gy);
    el.style.left = (q.x / CY.world.VW * 100) + '%'; el.style.top = (q.y / CY.world.VH * 100) + '%'; el.style.setProperty('--z', Math.round(q.y));
  };
  /* 斜视里走的方向对应四个朝向：格子 x 增大朝右下 se，y 增大朝左下 sw，x 减小朝左上 nw，y 减小朝右上 ne */
  const dirOf = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'se' : 'nw') : (dy > 0 ? 'sw' : 'ne'));
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
  U.renderTint = function () {
    const h = G.dayMinutes() / 60;
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
    const all = G.activePeople(), laid = fam ? null : new Map(CY.world.layout(U.viewPlace).map(l => [l.id, l])), people = fam ? all : all.filter(p => laid.has(p.id));
    const topP = people.slice().sort((a, b) => G.urgency(b) - G.urgency(a))[0], topId = topP && G.urgency(topP) > 0.7 ? topP.id : null;
    for (const c of [...stage.querySelectorAll('.cx')]) if (!people.some(p => p.id === c.dataset.id)) c.remove();
    $r('#roomEmpty') && $r('#roomEmpty').remove();
    if (!all.length) { const d = doc().createElement('div'); d.id = 'roomEmpty'; d.className = 'mute'; d.textContent = t('room.empty'); stage.appendChild(d); }
    for (const p of people) {
      let c = stage.querySelector(`.cx[data-id="${p.id}"]`);
      if (!c) {
        c = doc().createElement('div'); c.className = 'cx'; c.dataset.id = p.id;
        c.innerHTML = '<div class="body"></div><div class="fx"></div><div class="pops"></div><div class="tears"><svg viewBox="0 0 100 130"><path class="drop" d="M34 58 q-4 7 0 10 q4 -3 0 -10Z"/><path class="drop d2" d="M66 58 q-4 7 0 10 q4 -3 0 -10Z"/></svg></div><div class="badges"></div><div class="nm"></div><div class="slot"></div>';
        /* 鼠标移上去就弹出菜单，不用点；触屏没有移上去，还是点一下。重叠的人由 pickAt 按指针离谁近选 */
        c.onclick = e => { if (e.target.closest('.bubble') || e.target.closest('.away') || e.target.closest('.info') || e.target.closest('.edit')) return; if ($r('#ringLayer') && U.sel === p.id) return; U.sel = p.id; U.ringByHover = false; U.openRing(p.id); };
        c.style.transition = 'none';
        stage.appendChild(c);
        win().requestAnimationFrame(() => { if (!c._frozen) c.style.transition = ''; });
      }
      c.classList.toggle('lead', p === G.protagonist());
      if (fam) { c.style.left = ''; c.style.top = ''; c.style.removeProperty('--z'); c._pos = null; }
      else {
        const lp = laid.get(p.id);
        U.moveFig(c, U.viewPlace, lp.gx, lp.gy);
      }
      const working = !fam && CY.world.isWorking(p);
      const dir = fam ? '' : c._dir || (working ? 'ne' : '');
      c.classList.toggle('working', working && !c._dir);
      const look = JSON.stringify(p.person.appearance) + (p.person.age_stage || '') + Math.round(p.state.mood * 3) + (G.isSleeping(p) ? 'z' : '') + (fam ? 'F' : 'M') + dir;
      if (force || c.dataset.av !== look) { c.querySelector('.body').innerHTML = CY.avatar(p, dir); c.dataset.av = look; }
      c.classList.toggle('frail', p.state.frailty >= 0.7);
      c.classList.toggle('crying', !!G.crying[p.id]);
      c.classList.toggle('sleeping', G.isSleeping(p));
      c.classList.toggle('top', topId === p.id);
      c.classList.toggle('needy', G.needy(p));
      c.classList.toggle('sel', U.sel === p.id);
      const nmSig = (p === G.protagonist() ? '★' : '') + p.person.name + Math.round(p.state.mood * 20) + Math.round(p.state.frailty * 20) + p.story.care_total + CY.i18n.lang + G.isSleeping(p) + (p.person.conditions || []).length;
      if (c.dataset.nm !== nmSig) {
        c.dataset.nm = nmSig;
        const pct = v => Math.round(v * 100);
        c.querySelector('.nm').innerHTML = `<b>${p === G.protagonist() ? '★ ' : ''}${esc(p.person.name)}</b>${G.isSleeping(p) ? '<span class="zzz" title="' + esc(t('act.sleeping')) + '">💤</span>' : ''}${(p.person.conditions || []).length ? '<span class="sick" title="' + esc((p.person.conditions || []).map(k => CY.tOr('cond.' + k, (G.tpl.conditions[k] || {}).label || k)).join(' ')) + '">🩺</span>' : ''}<span class="edit" title="${esc(t('room.edit', { name: p.person.name }))}">✎</span><span class="info" title="${esc(t('room.info', { name: p.person.name }))}">ⓘ</span><span class="away" title="${esc(t('room.away', { name: p.person.name }))}">×</span>
          <div class="bar mood" title="${esc(t('room.bar', { mood: pct(p.state.mood), frail: pct(p.state.frailty) }))}"><i style="width:${pct(p.state.mood)}%"></i></div>`;
        c.querySelector('.away').onclick = e => { e.stopPropagation(); G.setActive(p.id, false); };
        c.querySelector('.info').onclick = e => { e.stopPropagation(); U.statusDialog(p.id); };
        c.querySelector('.edit').onclick = e => { e.stopPropagation(); U.addDialog(null, () => {}, p.id); };
      }
      /* 动作动画 */
      const fx = G.fx[p.id];
      if (fx && Date.now() - fx.t < U.fxDuration) {
        if (c.dataset.fxt !== String(fx.t)) { c.dataset.fxt = String(fx.t); c.dataset.fx = fx.act; c.querySelector('.fx').innerHTML = U.fxMarkup(fx.act, p.species.id); }
      } else if (c.dataset.fx) { delete c.dataset.fx; delete c.dataset.fxt; c.querySelector('.fx').innerHTML = ''; }
      /* 头上弹出的事件：有人开口、完成打勾、发生了事情 */
      {
        const pops = c.querySelector('.pops'), nowT = Date.now();
        if (c._popN === undefined) c._popN = 0;
        for (const e of G.pops) if (e.pid === p.id && e.n > c._popN) {
          c._popN = e.n;
          if (nowT - e.t > 3000) continue;
          const k = pops.children.length, sp = doc().createElement('span');
          sp.className = 'pop ' + e.kind; sp.textContent = e.icon;
          sp.style.marginLeft = ((k % 2 ? 1 : -1) * Math.ceil(k / 2) * 26) + 'px';
          pops.appendChild(sp); setTimeout(() => sp.remove(), 4200);
        }
      }
      /* 徽标 */
      const defs = G.needsOf(p), b = [];
      for (const k in defs) if (p.state.needs[k] > U.NEED_LIT) b.push(`<span class="${p.state.needs[k] > 0.85 ? 'urgent' : ''}" title="${esc(G.needLabel(k, defs[k]))}">${defs[k].icon || '•'}</span>`);
      if (CY.world.errandOf(p) === 'help') b.unshift('<span title="' + esc(t('badge.help')) + '">🤝</span>');
      if (G.flag(p, 'hospital')) b.unshift('<span title="' + esc(t('loc.hospital')) + '">🏥</span>');
      if (G.flag(p, 'hurt')) b.unshift('<span class="urgent" title="' + esc(t('log.fall_minor', { name: p.person.name })) + '">❗</span>');
      const bs = b.join('');
      if (c.dataset.bd !== bs) { c.querySelector('.badges').innerHTML = bs; c.dataset.bd = bs; }
      /* 气泡 */
      const req = G.req[p.id], toast = G.toast[p.id];
      c.classList.toggle('calling', !!req && (req.kind === 'need' || req.kind === 'ask'));
      const sig = req ? 'r' + req.kind + req.text + (req.options ? req.options.map(o => o.id).join() : '') + CY.i18n.lang : toast ? 't' + toast.text : '';
      c.classList.toggle('talk', !!sig);
      const slot = c.querySelector('.slot');
      if (c.dataset.sig !== sig) {
        c.dataset.sig = sig;
        if (!sig) slot.innerHTML = '';
        else if (req) {
          let btn = '';
          if (req.kind === 'ask') btn = req.answers.map((a, i) => `<button class="opt" data-a="an${i}">${esc(a)}</button>`).join('') +
            `<div class="own"><input maxlength="120" placeholder="${esc(t('ask.own'))}"><button data-a="send" class="primary">${esc(t('ask.send'))}</button></div>`;
          else if (req.kind === 'choice') btn = req.choices.map((ch, i) => `<button data-a="ch${i}">${esc(ch.label)}</button>`).join('');
          else if (req.kind === 'pick') btn = req.options.map((o, i) => `<button class="opt" data-a="pk${i}">${esc(G.fmt(o.text, p))}</button>`).join('') + `<div class="row2"><button data-a="later">${esc(t('pick.reroll'))}</button></div>`;
          else if (req.kind === 'nudge') btn = `<button data-a="yes">${esc(t('nudge.yes'))}</button><button data-a="no">${esc(t('nudge.no'))}</button>`;
          else btn = `<button data-a="later">${esc(t('btn.later'))}</button>`;
          slot.innerHTML = `<div class="bubble ${req.kind}"><div>${esc(req.text)}</div><div class="btns">${btn}</div>${req.deadline ? '<div class="cd"></div>' : ''}</div>`;
          slot.querySelectorAll('button').forEach(bt => bt.onclick = e => {
            e.stopPropagation();
            const a = bt.dataset.a;
            if (a === 'later') G.dismiss(p.id);
            else if (a === 'send') { const v = slot.querySelector('.own input').value; if (v.trim()) G.answerAsk(p.id, null, v); }
            else if (a.startsWith('an')) G.answerAsk(p.id, +a.slice(2));
            else if (a === 'yes') G.answerNudge(p.id, true);
            else if (a === 'no') G.answerNudge(p.id, false);
            else if (a.startsWith('ch')) G.choose(p.id, +a.slice(2));
            else if (a.startsWith('pk')) G.pickSaying(p.id, +a.slice(2));
          });
          const inp = slot.querySelector('.own input');
          if (inp) inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter' && inp.value.trim()) G.answerAsk(p.id, null, inp.value); };
        } else slot.innerHTML = `<div class="bubble ${toast.kind}">${esc(toast.text)}</div>`;
      }
      if (req && req.deadline) {
        const cd = slot.querySelector('.cd');
        if (cd) cd.style.width = Math.max(0, (req.deadline - Date.now()) / (req.deadline - req.since) * 100) + '%';
      }
    }
    U.syncFreeze(); U.renderPlayer(); U.renderNav(); U.renderRoster();
  };

  /* ---------- 主角，地点导航，角上的名单 ---------- */
  const PLAYER = { id: 'player', species: { id: 'human' }, state: { mood: 0.7 }, person: { age: 35, appearance: { skin: 1, hair_style: 'short', hair_color: 'black', glasses: 'round', beard: false, cloth: '#4f6d8f' } } };
  U.renderPlayer = function () {
    const stage = $r('#stage'), W = CY.world, v = W.visual();
    let c = stage.querySelector('.cx.player');
    if (!c) {
      c = doc().createElement('div'); c.className = 'cx player'; c.innerHTML = '<div class="body"></div><div class="nm"><b></b></div>';
      c.querySelector('.body').innerHTML = CY.avatar(PLAYER); stage.appendChild(c);
    }
    c.querySelector('b').textContent = t('player.name');
    const pages = U.PAGES(), show = !G.protagonist() && v.place === U.viewPlace && U.viewPlace !== 'family' && pages.length > 0 && !v.traveling;
    c.style.display = show ? '' : 'none';
    if (show) U.moveFig(c, v.place, v.gx, v.gy);
    const working = show && W.atWork(), dir = c._dir || (working ? 'ne' : '');
    c.classList.toggle('working', working && !c._dir);
    if (c.dataset.dir !== dir) { c.dataset.dir = dir; c.querySelector('.body').innerHTML = CY.avatar(PLAYER, dir); }
  };
  U.renderNav = function () {
    const nav = $r('#placeNav'); if (!nav) return;
    const W = CY.world, at = W.where(), pages = U.PAGES(), fam = U.viewPlace === 'family';
    nav.style.display = pages.length ? '' : 'none';
    const here = t('nav.here', { place: t('loc.' + at.place) + (at.room ? ' · ' + t('loc.' + at.room) : '') });
    const away = !fam && at.place !== U.viewPlace && ['hospital', 'office'].includes(U.viewPlace);
    const min = away ? W.travelMin(at.place, U.viewPlace) : 0;
    const sig = [U.viewPlace, here, away, min, pages.join(), CY.i18n.lang].join('|');
    if (nav.dataset.sig === sig) return;
    nav.dataset.sig = sig;
    const pn = U.viewPlace ? t('loc.' + U.viewPlace) : '';
    nav.innerHTML = (pages.length > 1 ? `<button data-d="-1">◀</button>` : '') + `<b>${esc(pn)}</b>` + (pages.length > 1 ? `<button data-d="1">▶</button>` : '') + (fam ? '' : `<span class="here">${esc(here)}</span>`) +
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
    const sig = people.map(p => [p.id, p.person.name, Math.round(p.state.mood * 10), Math.round(G.maxNeed(p) * 10), !!G.req[p.id], G.needy(p), G.topNeed(p), G.isSleeping(p), !!G.flag(p, 'hospital'), !!G.flag(p, 'hurt')].join(':')).join('|') + CY.i18n.lang;
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    box.innerHTML = people.map(p => {
      const defs = G.needsOf(p), tn = G.topNeed(p), urgent = p.state.needs[tn] > U.NEED_LIT;
      return `<div class="rcard ${G.req[p.id] || G.needy(p) ? 'calling' : ''} ${U.sel === p.id ? 'sel' : ''}" data-id="${p.id}" title="${esc(p.person.name)}"><div class="av">${CY.avatar(p)}</div>
        <div class="rn">${esc(p.person.name)}${G.isSleeping(p) ? ' 💤' : ''}${G.flag(p, 'hospital') ? ' 🏥' : ''}${G.flag(p, 'hurt') ? ' ❗' : ''}</div>
        <div class="bar mood"><i style="width:${Math.round(p.state.mood * 100)}%"></i></div>${urgent ? `<span class="rb ${p.state.needs[tn] > 0.85 ? 'urgent' : ''}" title="${esc(G.needLabel(tn, defs[tn]))}">${(defs[tn] || {}).icon || '•'}</span>` : ''}<span class="ri" data-i="${p.id}">ⓘ</span></div>`;
    }).join('');
    box.querySelectorAll('.rcard').forEach(el => el.onclick = e => {
      e.stopPropagation();
      if (e.target.closest('.ri')) { U.statusDialog(el.dataset.id); return; }
      U.sel = el.dataset.id; U.ringByHover = false; U.openRing(el.dataset.id, el);
    });
  };

  /* ---------- 环形菜单与长按 ---------- */
  /* 每个动作一个图标，围成一圈。悬停在中间显示名字和要按多久。有需求的动作是彩色，其余是灰色，灰色的也能点。 */
  const ACT_ICON = {
    park: '🌳', street: '🏪', pet: '🤚', hug: '🤗', water: '💧', feed: '🍼', meal: '🍲', diaper: '🚼', bath: '🛁', play: '🧸', read: '📖', soothe: '🌙', homework: '📚', game: '🎮', chat: '💬', rest: '🛋', walk: '🚶', hand: '🤝', doctor: '🩺',
    groom: '✨', vet: '🏥', clean: '🧹', train: '🎓', teach: '🗣', warm: '🔥', veggie: '🥬', mist: '💦', sun: '☀', fertilize: '🌱', prune: '✂', repot: '🪴',
    medicine: '💊', sugar: '🩸', bp: '🫀', heat: '♨', massage: '💆', fever: '🌡', cool: '🧊', inhaler: '💨', air: '🌬', remind: '☝', album: '📷',
    restsit: '💺', steady: '✋', listen: '👂', walkout: '🌳', lead: '🚽', nightlight: '💡', ointment: '🧴', trimnails: '💅', painkill: '🩹', support: '🤲', rehab: '🏃',
    stayclose: '🤍', warmdrink: '☕', antihist: '🤧', airclean: '🫧',
  };
  U.actIcon = (p, a) => {
    if (ACT_ICON[a.id]) return ACT_ICON[a.id];
    const defs = G.needsOf(p);
    for (const k in a.effect || {}) if (defs[k] && defs[k].icon) return defs[k].icon;
    return '•';
  };
  /* 这个动作能不能解决角色现在的某个需求 */
  /* 头顶的需求图标和环里亮起的行动用同一个门槛，也是宝宝和宠物开始催人的线 */
  U.NEED_LIT = 0.5;
  U.actUrgent = (p, a) => Object.keys(a.effect || {}).some(k => a.effect[k] < 0 && (p.state.needs[k] || 0) > U.NEED_LIT);
  const ringOff = () => { if (U.room) U.room.querySelectorAll('.cx.ring-on').forEach(c => c.classList.remove('ring-on')); };
  U.closeRing = function () { if (!U.room) return; const r = $r('#ringLayer'); if (r) r.remove(); U.ringByHover = false; ringOff(); };
  U.openRing = function (pid, anchor) {
    U.closeRing();
    const p = G.get(pid), acts = Object.values(G.actionsOf(p));
    const fig = $r(`.cx[data-id="${pid}"]`);
    if (fig) fig.classList.add('ring-on');
    const cx = (anchor || fig || U.room).getBoundingClientRect();
    const n = acts.length, R = Math.max(58, Math.round(n * 6.6 + 14)), half = 18 + 4;
    const vw = win().innerWidth, vh = win().innerHeight;
    /* 圈心在角色中间，圈整个落在窗口里 */
    let ox = cx.left + cx.width / 2, oy = cx.top + cx.height * 0.45;
    ox = Math.min(vw - R - half - 4, Math.max(R + half + 4, ox)); oy = Math.min(vh - R - half - 4, Math.max(R + half + 4, oy));
    const layer = doc().createElement('div');
    layer.id = 'ringLayer'; layer.className = 'ring';
    layer.style.left = ox + 'px'; layer.style.top = oy + 'px';
    U.ringGeom = { x: ox, y: oy, r: R + half + 14 };
    const label = doc().createElement('div'); label.className = 'ringlabel';
    const home = () => { label.innerHTML = `<b>${esc(p.person.name)}</b>`; };
    home(); layer.appendChild(label);
    acts.forEach((a, i) => {
      const ang = (-90 + 360 * i / n) * Math.PI / 180;
      const sec = G.holdSeconds(a), cost = t('unit.sec', { n: sec % 1 ? sec.toFixed(1) : sec }), urgent = U.actUrgent(p, a);
      const text = a.label + ' · ' + cost;
      const b = doc().createElement('button');
      b.className = 'ico ' + (urgent ? 'urgent' : 'calm');
      b.style.left = (R * Math.cos(ang)) + 'px'; b.style.top = (R * Math.sin(ang)) + 'px';
      b.title = text; b.setAttribute('aria-label', text);
      b.innerHTML = `<span class="e">${U.actIcon(p, a)}</span>`;
      const show = () => { label.innerHTML = `<b>${esc(a.label)}</b><small>${esc(cost)}</small>`; };
      b.onpointerenter = show; b.onfocus = show; b.onpointerleave = home; b.onblur = home;
      b.onpointerdown = e => { e.preventDefault(); show(); b.setPointerCapture(e.pointerId); const r = b.getBoundingClientRect(); U.startHold(pid, a, r.left + r.width / 2, r.top + r.height / 2); };
      b.onpointerup = b.onpointercancel = () => U.endHold(false);
      layer.appendChild(b);
    });
    U.room.appendChild(layer);
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
    if (done) { G.perform(h.pid, h.a.id); U.closeRing(); }
    U.renderRoom(true);
  };

  /* ---------- 浮出小窗（文档画中画） ---------- */
  U.floating = false;
  U.floatToggle = async function () {
    if (U.pip) { U.pip.close(); return; }
    if (!('documentPictureInPicture' in window)) { alert(t('float.unsupported')); return; }
    const w = await documentPictureInPicture.requestWindow({ width: 380, height: 340 });
    U.moveRoomTo(w.document, w);
    U.pip = w;
    w.addEventListener('pagehide', () => { U.pip = null; U.moveRoomBack(); });
  };
  /* 把房间搬进另一个文档。样式用同样的 link 引用，主题属性一起带过去。 */
  U.moveRoomTo = function (d, w) {
    for (const l of document.querySelectorAll('link[rel=stylesheet]')) { const n = d.createElement('link'); n.rel = 'stylesheet'; n.href = l.href; d.head.appendChild(n); }
    d.body.className = 'pip';
    U.pipDoc = d; U.syncTheme && U.syncTheme();
    d.body.appendChild(U.room);
    U.prevView = U.viewPlace; U.viewPlace = 'family';
    U.floating = true; U.closeRing();
    U.onFloatChange && U.onFloatChange();
    setTimeout(() => U.renderRoom(true), 50);
  };
  U.moveRoomBack = function () {
    U.pipDoc = null;
    document.getElementById('roomSlot').appendChild(U.room);
    if (U.prevView) { U.viewPlace = U.prevView; U.prevView = null; }
    U.floating = false; U.closeRing();
    U.onFloatChange && U.onFloatChange();
    U.renderRoom(true);
  };
})(globalThis.CY = globalThis.CY || {});
