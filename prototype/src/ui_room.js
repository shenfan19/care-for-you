/* 角色所在的“房间”：气泡与徽标，点击出环形菜单，长按动作。
   整个房间是一个根元素 #room，可以整体搬进浮出的小窗，所以这里从不用全局 document，
   一律通过房间根元素取得它当前所在的文档。重绘只在内容变化时发生，避免长按过程中元素被替换。 */
(function (CY) {
  const G = CY.game, ini = CY.ini;
  const U = CY.ui = CY.ui || {};
  U.sel = null;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  U.esc = esc;
  const room = () => U.room;
  const doc = () => U.room.ownerDocument;
  const win = () => doc().defaultView;
  const $r = sel => U.room.querySelector(sel);

  /* ---------- 房间内的文字输入对话框 ---------- */
  U.askText = function (prompt, initial) {
    return new Promise(res => {
      const m = $r('#roomModal');
      m.innerHTML = `<div class="box"><div style="margin-bottom:8px">${esc(prompt)}</div><textarea id="mt" style="min-height:110px"></textarea>
        <div class="row" style="margin:10px 0 0;justify-content:flex-end"><button id="mc">先不说</button><button id="mo" class="primary">说完了</button></div></div>`;
      m.style.display = 'grid';
      const t = m.querySelector('#mt'); t.value = initial || ''; t.focus();
      const done = v => { m.style.display = 'none'; m.innerHTML = ''; res(v); };
      m.querySelector('#mo').onclick = () => done(t.value);
      m.querySelector('#mc').onclick = () => done(null);
    });
  };

  /* ---------- 构建 ---------- */
  U.buildRoom = function (root) {
    U.room = root;
    root.innerHTML = '<div class="stage" id="stage"></div><svg id="hold" viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/><circle class="fg" cx="32" cy="32" r="26"/></svg><div id="roomModal" class="modal"></div>';
    root.addEventListener('pointerdown', e => { if (!e.target.closest('#ringLayer') && !e.target.closest('.cx')) U.closeRing(); });
    document.addEventListener('pointerdown', e => { if (!root.contains(e.target) && !e.target.closest('#ringLayer')) U.closeRing(); });
    U.renderRoom(true);
  };

  /* ---------- 每秒刷新 ---------- */
  U.renderRoom = function (force) {
    const stage = $r('#stage');
    if (!stage) return;
    const people = G.activePeople();
    for (const c of [...stage.querySelectorAll('.cx')]) if (!people.some(p => p.id === c.dataset.id)) c.remove();
    $r('#roomEmpty') && $r('#roomEmpty').remove();
    if (!people.length) { const d = doc().createElement('div'); d.id = 'roomEmpty'; d.className = 'mute'; d.textContent = '这里还没有人。'; stage.appendChild(d); }
    for (const p of people) {
      let c = stage.querySelector(`.cx[data-id="${p.id}"]`);
      if (!c) {
        c = doc().createElement('div'); c.className = 'cx'; c.dataset.id = p.id;
        c.innerHTML = '<div class="badges"></div><div class="body"></div><div class="nm"></div><div class="slot"></div>';
        c.onclick = e => { if (e.target.closest('.bubble') || e.target.closest('.away')) return; U.sel = p.id; U.openRing(p.id); };
        stage.appendChild(c);
      }
      const look = JSON.stringify(p.person.appearance) + (p.person.age_stage || '') + Math.round(p.state.mood * 3);
      if (force || c.dataset.av !== look) { c.querySelector('.body').innerHTML = CY.avatar(p); c.dataset.av = look; }
      c.classList.toggle('frail', p.state.frailty >= 0.7);
      c.classList.toggle('sel', U.sel === p.id);
      const nmSig = p.person.name + Math.round(p.state.mood * 20) + Math.round(p.state.frailty * 20) + p.story.care_total;
      if (c.dataset.nm !== nmSig) {
        c.dataset.nm = nmSig;
        const pct = v => Math.round(v * 100);
        c.querySelector('.nm').innerHTML = `<b>${esc(p.person.name)}</b><span class="away" title="让${esc(p.person.name)}先离开桌面">×</span>
          <div class="bar mood" title="心情 ${pct(p.state.mood)}%　虚弱 ${pct(p.state.frailty)}%"><i style="width:${pct(p.state.mood)}%"></i></div>`;
        c.querySelector('.away').onclick = e => { e.stopPropagation(); G.setActive(p.id, false); };
      }
      /* 徽标 */
      const defs = G.needsOf(p), b = [];
      for (const k in defs) if (p.state.needs[k] > 0.6) b.push(`<span class="${p.state.needs[k] > 0.85 ? 'urgent' : ''}" title="${esc(defs[k].label)}">${defs[k].icon || '•'}</span>`);
      const bs = b.join('');
      if (c.dataset.bd !== bs) { c.querySelector('.badges').innerHTML = bs; c.dataset.bd = bs; }
      /* 气泡 */
      const req = G.req[p.id], toast = G.toast[p.id];
      const sig = req ? 'r' + req.kind + req.text + (req.options ? req.options.map(o => o.id).join() : '') : toast ? 't' + toast.text : '';
      const slot = c.querySelector('.slot');
      if (c.dataset.sig !== sig) {
        c.dataset.sig = sig;
        if (!sig) slot.innerHTML = '';
        else if (req) {
          let btn = '';
          if (req.kind === 'ask') btn = '<button data-a="ans">回答</button><button data-a="later">待会儿</button>';
          else if (req.kind === 'choice') btn = req.choices.map((ch, i) => `<button data-a="ch${i}">${esc(ch.label)}</button>`).join('');
          else if (req.kind === 'pick') btn = req.options.map((o, i) => `<button class="opt" data-a="pk${i}">${esc(G.fmt(o.text, p))}</button>`).join('') + '<div class="row2"><button data-a="reroll">都不像</button><button data-a="later">待会儿</button></div>';
          else if (req.kind === 'nudge') btn = '<button data-a="yes">好，我去</button><button data-a="no">晚点</button>';
          else btn = '<button data-a="later">待会儿</button>';
          slot.innerHTML = `<div class="bubble ${req.kind}"><div>${esc(req.text)}</div><div class="btns">${btn}</div>${req.deadline ? '<div class="cd"></div>' : ''}</div>`;
          slot.querySelectorAll('button').forEach(bt => bt.onclick = async e => {
            e.stopPropagation();
            const a = bt.dataset.a;
            if (a === 'later') G.dismiss(p.id);
            else if (a === 'ans') { const r = G.req[p.id]; const t = await U.askText(r.prompt); G.answer(p.id, t); }
            else if (a === 'reroll') G.rerollPick(p.id);
            else if (a === 'yes') G.answerNudge(p.id, true);
            else if (a === 'no') G.answerNudge(p.id, false);
            else if (a.startsWith('ch')) G.choose(p.id, +a.slice(2));
            else if (a.startsWith('pk')) G.pickSaying(p.id, +a.slice(2));
          });
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
      b.innerHTML = esc(a.label) + (ini.bool(G.cfg, 'interaction', 'click_instead_of_hold') ? '' : `<small>${sec % 1 ? sec.toFixed(1) : sec}秒</small>`);
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
    if (!('documentPictureInPicture' in window)) { alert('这个浏览器不支持文档画中画，请用桌面版 Chrome 或 Edge。'); return; }
    const w = await documentPictureInPicture.requestWindow({ width: 480, height: 460 });
    U.moveRoomTo(w.document, w);
    U.pip = w;
    w.addEventListener('pagehide', () => { U.pip = null; U.moveRoomBack(); });
  };
  /* 把房间搬进另一个文档。样式用同样的 link 引用，颜色变量随之带过去。 */
  U.moveRoomTo = function (d, w) {
    for (const l of document.querySelectorAll('link[rel=stylesheet]')) { const n = d.createElement('link'); n.rel = 'stylesheet'; n.href = l.href; d.head.appendChild(n); }
    d.body.className = 'pip';
    d.body.appendChild(U.room);
    U.floating = true; U.closeRing();
    U.onFloatChange && U.onFloatChange();
    setTimeout(() => U.renderRoom(true), 50);
  };
  U.moveRoomBack = function () {
    document.getElementById('roomSlot').appendChild(U.room);
    U.floating = false; U.closeRing();
    U.onFloatChange && U.onFloatChange();
    U.renderRoom(true);
  };
})(globalThis.CY = globalThis.CY || {});
