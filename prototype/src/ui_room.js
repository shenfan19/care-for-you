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
    water: sp => sp === 'human'
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
    talk: () => `<g class="dots"><circle class="p dot" cx="72" cy="30" r="2.6" fill="#8a8378"/><circle class="p dot" style="animation-delay:.2s" cx="80" cy="30" r="2.6" fill="#8a8378"/><circle class="p dot" style="animation-delay:.4s" cx="88" cy="30" r="2.6" fill="#8a8378"/></g>`,
  };
  U.fxMarkup = (act, species) => `<svg viewBox="0 0 100 130">${(FX[act] || FX.pet)(species)}</svg>`;
  U.fxDuration = 3200;

  /* ---------- 构建 ---------- */
  U.buildRoom = function (root) {
    U.room = root;
    root.innerHTML = '<div class="stage" id="stage"></div><svg id="hold" viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/><circle class="fg" cx="32" cy="32" r="26"/></svg>';
    root.addEventListener('pointerdown', e => { if (!e.target.closest('#ringLayer') && !e.target.closest('.cx')) U.closeRing(); });
    document.addEventListener('pointerdown', e => { if (!root.contains(e.target) && !e.target.closest('#ringLayer')) U.closeRing(); });
    U.renderRoom(true);
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
    U.renderTint();
    const people = G.activePeople();
    for (const c of [...stage.querySelectorAll('.cx')]) if (!people.some(p => p.id === c.dataset.id)) c.remove();
    $r('#roomEmpty') && $r('#roomEmpty').remove();
    if (!people.length) { const d = doc().createElement('div'); d.id = 'roomEmpty'; d.className = 'mute'; d.textContent = t('room.empty'); stage.appendChild(d); }
    for (const p of people) {
      let c = stage.querySelector(`.cx[data-id="${p.id}"]`);
      if (!c) {
        c = doc().createElement('div'); c.className = 'cx'; c.dataset.id = p.id;
        c.innerHTML = '<div class="body"></div><div class="fx"></div><div class="badges"></div><div class="nm"></div><div class="slot"></div>';
        c.onclick = e => { if (e.target.closest('.bubble') || e.target.closest('.away')) return; U.sel = p.id; U.openRing(p.id); };
        stage.appendChild(c);
      }
      const look = JSON.stringify(p.person.appearance) + (p.person.age_stage || '') + Math.round(p.state.mood * 3);
      if (force || c.dataset.av !== look) { c.querySelector('.body').innerHTML = CY.avatar(p); c.dataset.av = look; }
      c.classList.toggle('frail', p.state.frailty >= 0.7);
      c.classList.toggle('sel', U.sel === p.id);
      const nmSig = p.person.name + Math.round(p.state.mood * 20) + Math.round(p.state.frailty * 20) + p.story.care_total + CY.i18n.lang;
      if (c.dataset.nm !== nmSig) {
        c.dataset.nm = nmSig;
        const pct = v => Math.round(v * 100);
        c.querySelector('.nm').innerHTML = `<b>${esc(p.person.name)}</b><span class="away" title="${esc(t('room.away', { name: p.person.name }))}">×</span>
          <div class="bar mood" title="${esc(t('room.bar', { mood: pct(p.state.mood), frail: pct(p.state.frailty) }))}"><i style="width:${pct(p.state.mood)}%"></i></div>`;
        c.querySelector('.away').onclick = e => { e.stopPropagation(); G.setActive(p.id, false); };
      }
      /* 动作动画 */
      const fx = G.fx[p.id];
      if (fx && Date.now() - fx.t < U.fxDuration) {
        if (c.dataset.fxt !== String(fx.t)) { c.dataset.fxt = String(fx.t); c.dataset.fx = fx.act; c.querySelector('.fx').innerHTML = U.fxMarkup(fx.act, p.species.id); }
      } else if (c.dataset.fx) { delete c.dataset.fx; delete c.dataset.fxt; c.querySelector('.fx').innerHTML = ''; }
      /* 徽标 */
      const defs = G.needsOf(p), b = [];
      for (const k in defs) if (p.state.needs[k] > 0.6) b.push(`<span class="${p.state.needs[k] > 0.85 ? 'urgent' : ''}" title="${esc(G.needLabel(k, defs[k]))}">${defs[k].icon || '•'}</span>`);
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
          else if (req.kind === 'pick') btn = req.options.map((o, i) => `<button class="opt" data-a="pk${i}">${esc(G.fmt(o.text, p))}</button>`).join('') + `<div class="row2"><button data-a="reroll">${esc(t('pick.reroll'))}</button><button data-a="later">${esc(t('btn.later'))}</button></div>`;
          else if (req.kind === 'nudge') btn = `<button data-a="yes">${esc(t('nudge.yes'))}</button><button data-a="no">${esc(t('nudge.no'))}</button>`;
          else btn = `<button data-a="later">${esc(t('btn.later'))}</button>`;
          slot.innerHTML = `<div class="bubble ${req.kind}"><div>${esc(req.text)}</div><div class="btns">${btn}</div>${req.deadline ? '<div class="cd"></div>' : ''}</div>`;
          slot.querySelectorAll('button').forEach(bt => bt.onclick = e => {
            e.stopPropagation();
            const a = bt.dataset.a;
            if (a === 'later') G.dismiss(p.id);
            else if (a === 'send') { const v = slot.querySelector('.own input').value; if (v.trim()) G.answerAsk(p.id, null, v); }
            else if (a.startsWith('an')) G.answerAsk(p.id, +a.slice(2));
            else if (a === 'reroll') G.rerollPick(p.id);
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
  };

  /* ---------- 环形菜单与长按 ---------- */
  U.closeRing = function () { if (!U.room) return; const r = $r('#ringLayer'); if (r) r.remove(); };
  U.openRing = function (pid) {
    U.closeRing();
    const p = G.get(pid), acts = Object.values(G.actionsOf(p));
    const cx = $r(`.cx[data-id="${pid}"]`).getBoundingClientRect();
    const layer = doc().createElement('div');
    layer.id = 'ringLayer'; layer.className = 'ring';
    layer.style.left = (cx.left + cx.width / 2) + 'px'; layer.style.top = (cx.top + 40) + 'px';
    const n = acts.length, Rx = 34 * n + 30, Ry = 64, span = 68;
    const btns = [];
    acts.forEach((a, i) => {
      const ang = (n === 1 ? 0 : -span + 2 * span * i / (n - 1)) * Math.PI / 180;
      const b = doc().createElement('button');
      b.dataset.x = Math.sin(ang) * Rx; b.dataset.y = -Math.cos(ang) * Ry - 14;
      const sec = G.holdSeconds(a);
      b.innerHTML = esc(a.label) + (ini.bool(G.cfg, 'interaction', 'click_instead_of_hold') ? '' : `<small>${t('unit.sec', { n: sec % 1 ? sec.toFixed(1) : sec })}</small>`);
      if (ini.bool(G.cfg, 'interaction', 'click_instead_of_hold')) b.onclick = () => { G.perform(pid, a.id); U.closeRing(); };
      else {
        b.onpointerdown = e => { e.preventDefault(); b.setPointerCapture(e.pointerId); U.startHold(pid, a, e.clientX, e.clientY); };
        b.onpointerup = b.onpointercancel = () => U.endHold(false);
      }
      layer.appendChild(b); btns.push(b);
    });
    U.room.appendChild(layer);
    /* 按钮不超出窗口 */
    const vw = win().innerWidth, ox = cx.left + cx.width / 2;
    let lo = 1e9, hi = -1e9;
    for (const b of btns) { const w = b.offsetWidth, x = +b.dataset.x; lo = Math.min(lo, x - w / 2); hi = Math.max(hi, x + w / 2); }
    let shift = 0;
    if (ox + hi > vw - 6) shift = vw - 6 - (ox + hi);
    if (ox + lo + shift < 6) shift = 6 - (ox + lo);
    for (const b of btns) { b.style.left = (+b.dataset.x + shift) + 'px'; b.style.top = b.dataset.y + 'px'; }
  };

  let hold = null;
  U.startHold = function (pid, a, x, y) {
    U.endHold(false);
    const h = $r('#hold');
    h.style.display = 'block'; h.style.left = x + 'px'; h.style.top = y + 'px';
    const fg = h.querySelector('.fg'), C = 2 * Math.PI * 26;
    fg.style.strokeDasharray = C; fg.style.strokeDashoffset = C;
    hold = { pid, a, start: performance.now(), dur: G.holdSeconds(a) * 1000, C, fg, win: win() };
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
    const h = hold; hold = null;
    h.win.cancelAnimationFrame(h.raf);
    const el = $r('#hold'); if (el) el.style.display = 'none';
    if (done) { G.perform(h.pid, h.a.id); U.closeRing(); }
  };

  /* ---------- 浮出小窗（文档画中画） ---------- */
  U.floating = false;
  U.floatToggle = async function () {
    if (U.pip) { U.pip.close(); return; }
    if (!('documentPictureInPicture' in window)) { alert(t('float.unsupported')); return; }
    const w = await documentPictureInPicture.requestWindow({ width: 480, height: 460 });
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
    U.floating = true; U.closeRing();
    U.onFloatChange && U.onFloatChange();
    setTimeout(() => U.renderRoom(true), 50);
  };
  U.moveRoomBack = function () {
    U.pipDoc = null;
    document.getElementById('roomSlot').appendChild(U.room);
    U.floating = false; U.closeRing();
    U.onFloatChange && U.onFloatChange();
    U.renderRoom(true);
  };
})(globalThis.CY = globalThis.CY || {});
