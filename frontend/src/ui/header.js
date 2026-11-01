/* 顶栏：明暗，背景色调，语言，时钟，快进，通用弹窗。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  /* ---------- 外观：明暗、背景色调、语言 ---------- */
  U.applyTheme = function () {
    let th = ini.get(G.cfg, 'ui', 'theme');
    if (th !== 'light' && th !== 'dark') th = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const bg = ini.get(G.cfg, 'ui', 'background');
    CY.figure = CY.figureOf(ini.get(G.cfg, 'ui', 'figure'));
    for (const d of [document, U.pipDoc]) if (d) { d.documentElement.dataset.theme = th; d.documentElement.dataset.bg = bg; }
  };
  /* 顶栏已经没有语言和明暗的快捷控件，都在设置里 */
  U.renderControls = function () {};
  U.syncTheme = U.applyTheme;
  /* 标题和一句话：中文界面叫"照顾你"，其他语言是 Care for You；一句话每次打开随机一句，换语言不换句 */
  U.renderBrand = function () {
    const name = t('brand.name'), bt = $('brandTxt');
    if (bt) bt.innerHTML = name === 'Care for You' ? 'Care <em>for</em> You' : esc(name);
    const tg = $('tagline'); if (tg) { if (U.tagN === undefined) U.tagN = Math.floor(Math.random() * 6); tg.textContent = t('tag.' + (U.tagN + 1)); }
  };
  U.applyLang = async function () {
    I.set(I.detect(ini.get(G.cfg, 'ui', 'language')));
    await G.reloadContent();
    I.applyDom(document);
    document.title = t('app.title');
    U.renderBrand();
    for (const [id, k] of [['shareBtn', 'hdr.share'], ['gearBtn', 'hdr.settings'], ['aboutBtn', 'hdr.about']]) $(id).setAttribute('aria-label', t(k));
    for (const k of ['feed', 'said', 'roomBar']) delete $(k).dataset.sig;
    if (U.room) { U.renderRoom(true); }
    U.renderClock(); U.renderBar(); U.renderFeed(true); U.renderSaid(true);
  };
  async function saveCfg() { await store.write('settings.ini', ini.stringify(G.cfg)); }

  /* ---------- 通用弹窗 ---------- */
  U.dialog = function (html, wide) {
    const m = $('modal');
    m.innerHTML = `<div class="box ${wide ? 'wide' : ''}">${html}</div>`;
    m.style.display = 'grid';
    m.onclick = e => { if (e.target === m) U.closeDialog(); };
    return m.firstChild;
  };
  U.closeDialog = function () { const m = $('modal'); m.style.display = 'none'; m.innerHTML = ''; };

  /* ---------- 顶栏：经历了多少时间，现在是几点 ---------- */
  /* 顶栏不再显示时间，信息越少越好 */
  /* 房间的两个角：左上角是现在几点，右上角是钱，点开可以请保姆 */
  U.renderClock = function () {
    const root = U.room; if (!root) return;
    const tm = root.querySelector('#cornerTime'), mn = root.querySelector('#cornerMoney');
    if (!tm || !mn) return;
    const c = G.clock();
    const gd = G.gameDate();
    tm.textContent = t('corner.day', { m: Math.floor((gd.n - 1) / 30) + 1, d: (gd.n - 1) % 30 + 1 }) + ' · ' + c.hh + ':' + c.mm + ' · ' + G.speedLabel();
    tm.title = t('corner.speed_tip', { speed: G.speedLabel() });
    tm.style.cursor = 'pointer';
    tm.onclick = e => { e.stopPropagation(); U.timePopover(tm); };
    mn.textContent = '💰 ' + Math.floor(G.world.money || 0); mn.title = t('corner.money_tip');
    const fm = root.querySelector('#cornerFamily'), lead = G.protagonist();
    if (fm) { const show = lead && CY.world && CY.world.worker(lead); fm.style.display = show ? '' : 'none'; if (show) { const e = Math.round(G.efficiency() * 100); fm.textContent = '🏠 ' + e + '%'; fm.title = t('corner.eff_tip', { n: e }); } }
    mn.onclick = () => U.helpDialog();
    for (const [id, k, fn] of [['cornerPeople', 'hdr.people_tip', () => U.peopleDialog()]]) {
      const b = root.querySelector('#' + id); if (b) { b.title = t(k); b.setAttribute('aria-label', t(k)); b.onclick = fn; }
    }
    const ms = root.querySelector('#cornerMusic');
    if (ms) {
      const on = CY.sound ? CY.sound.musicVol() > 0 : true;
      ms.textContent = on ? '🎵' : '🔇'; ms.classList.toggle('off', !on);
      ms.title = t('corner.music_tip');
      ms.onclick = e => { e.stopPropagation(); U.soundPopover(ms); };
    }
  };

  /* ---------- 角落按钮的小下拉：点一下弹出，点别处收起。不是点击就切换，免得不小心改了看不到 ---------- */
  U.closePopover = function () { const p = document.getElementById('cornerPop'); if (p) p.remove(); document.removeEventListener('click', U.popOutside, true); };
  U.popOutside = e => { const p = document.getElementById('cornerPop'); if (p && !p.contains(e.target)) U.closePopover(); };
  U.popover = function (anchor, html, wire) {
    const open = document.getElementById('cornerPop'), same = open && open.dataset.for === anchor.id;
    U.closePopover(); if (same) return;
    const box = document.createElement('div'); box.id = 'cornerPop'; box.className = 'cpop'; box.dataset.for = anchor.id; box.innerHTML = html;
    const host = anchor.closest('.cornerbox') || document.body; host.appendChild(box);
    const hb = host.getBoundingClientRect(), ab = anchor.getBoundingClientRect();
    box.style.right = Math.max(0, hb.right - ab.right) + 'px'; box.style.top = (ab.bottom - hb.top + 6) + 'px';
    if (window.innerWidth <= 640) { box.style.top = 'auto'; box.style.bottom = (hb.bottom - ab.top + 6) + 'px'; }
    wire(box); setTimeout(() => document.addEventListener('click', U.popOutside, true), 0);
  };
  /* 声音：总静音，音乐，音效 */
  U.soundPopover = function (anchor) {
    const mute = ini.bool(G.cfg, 'audio', 'mute'), val = k => { const v = parseFloat(ini.get(G.cfg, 'audio', k)); return isNaN(v) ? 50 : v; };
    U.popover(anchor, `<label class="prow2"><input type="checkbox" id="pmute" ${mute ? 'checked' : ''}> ${esc(t('pop.mute'))}</label>
      <label class="prow2">${esc(t('pop.music'))}<input type="range" id="pmusic" min="0" max="100" value="${val('music_volume')}"></label>
      <label class="prow2">${esc(t('pop.sfx'))}<input type="range" id="psfx" min="0" max="100" value="${val('sfx_volume')}"></label>`, box => {
      const save = async () => { G.cfg.audio = G.cfg.audio || {}; G.cfg.audio.mute = box.querySelector('#pmute').checked ? 'true' : 'false'; G.cfg.audio.music_volume = box.querySelector('#pmusic').value; G.cfg.audio.sfx_volume = box.querySelector('#psfx').value; await G.saveCfg(); if (CY.sound) CY.sound.apply(); U.renderClock(); };
      box.querySelectorAll('input').forEach(i => { i.oninput = save; i.onchange = save; });
    });
  };
  /* 时间：现在几点，时间倍率，工作起止 */
  U.timePopover = function (anchor) {
    const c = G.clock(), wh = (ini.get(G.cfg, 'economy', 'work_hours') || '09:00-18:00').split('-'), cur = G.speed();
    U.popover(anchor, `<label class="prow2">${esc(t('pop.clock'))}<input type="time" id="pclock" value="${c.hh}:${c.mm}"></label>
      <div class="prow2">${esc(t('pop.speed'))}<span class="seg">${G.SPEEDS.map(s => `<button data-s="${s}" class="${s === cur ? 'on' : ''}">×${s}</button>`).join('')}</span></div>
      <label class="prow2">${esc(t('pop.work'))}<span><input type="time" id="pwf" value="${wh[0]}"> – <input type="time" id="pwt" value="${wh[1]}"></span></label>`, box => {
      box.querySelector('#pclock').onchange = e => { const m = /^(dd):(dd)$/.exec(e.target.value); if (m) { G.setClock(+m[1] * 60 + +m[2]); G.save(true); U.renderClock(); } };
      box.querySelectorAll('[data-s]').forEach(b => b.onclick = async () => { await G.setSpeed(+b.dataset.s); box.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('on', x === b)); U.renderClock(); });
      const wsave = async () => { const f = box.querySelector('#pwf').value, to = box.querySelector('#pwt').value; if (f && to && f < to) { G.cfg.economy = G.cfg.economy || {}; G.cfg.economy.work_hours = f + '-' + to; await G.saveCfg(); } };
      box.querySelector('#pwf').onchange = wsave; box.querySelector('#pwt').onchange = wsave;
    });
  };

  /* 房间下方的条不要了：添加，编辑，归档，删除，叫回离开的人，都在顶栏的角色里 */
  U.renderBar = function () {
    const bar = $('roomBar'); bar.style.display = 'none';
  };

})(globalThis.CY = globalThis.CY || {});
