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
    for (const [id, k] of [['aboutBtn', 'hdr.about']]) $(id).setAttribute('aria-label', t(k));
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
    tm.onclick = async () => { await G.setSpeed(G.nextSpeed()); U.renderClock(); };
    mn.textContent = '💰 ' + Math.floor(G.world.money || 0); mn.title = t('corner.money_tip');
    mn.onclick = () => U.helpDialog();
    const au = root.querySelector('#cornerAuto'), fc = root.querySelector('#cornerFocus');
    if (au) { au.classList.toggle('on', !!G.world.auto); au.title = t(G.world.auto ? 'auto.tip_on' : 'auto.tip_off'); au.setAttribute('aria-pressed', !!G.world.auto); au.onclick = () => { G.setAuto(!G.world.auto); U.renderClock(); }; }
    if (fc) {
      const f = G.world.focus, fp = G.focusPerson();
      fc.textContent = '🎯' + (f ? ' ' + (f.kind === 'work' ? t('focus.work') : fp ? fp.person.name : '') : ''); fc.classList.toggle('on', !!f); fc.title = t('focus.title');
      fc.onclick = () => U.focusDialog();
    }
    for (const [id, k, fn] of [['cornerPeople', 'hdr.people_tip', () => U.peopleDialog()], ['cornerShare', 'hdr.share', () => U.shareDialog()], ['cornerGear', 'hdr.settings', () => U.settingsDialog()]]) {
      const b = root.querySelector('#' + id); if (b) { b.title = t(k); b.setAttribute('aria-label', t(k)); b.onclick = fn; }
    }
    const ms = root.querySelector('#cornerMusic');
    if (ms) {
      const on = CY.ini.bool(G.cfg, 'audio', 'music');
      ms.textContent = on ? '🎵' : '🔇'; ms.classList.toggle('off', !on);
      ms.title = t('corner.music_tip');
      ms.onclick = async () => {
        G.cfg.audio = G.cfg.audio || {}; G.cfg.audio.music = on ? 'false' : 'true';
        await G.saveCfg(); if (CY.sound) CY.sound.apply(); U.renderClock();
      };
    }
  };

  /* 专注：主角长期做一件事 */
  U.focusDialog = function () {
    const lead = G.protagonist(), f = G.world.focus;
    const people = G.activePeople().filter(p => p !== lead && !(p.person.help && p.person.help.role === 'nanny'));
    const btn = (id, label, on) => `<button class="${on ? 'primary' : ''}" data-f="${id}" style="display:block;width:100%;text-align:left;margin:4px 0">${esc(label)}</button>`;
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('focus.title'))}</h2><div class="mute" style="margin-bottom:8px">${esc(t('focus.note'))}</div>
      ${btn('work', t('focus.work_long'), f && f.kind === 'work')}
      ${people.map(p => btn('p:' + p.id, t('focus.person', { name: p.person.name }), f && f.kind === 'person' && f.pid === p.id)).join('')}
      <button disabled style="display:block;width:100%;text-align:left;margin:4px 0;opacity:.55">${esc(t('focus.house'))}</button>
      <div class="row" style="justify-content:space-between;margin-top:12px"><button data-f="none">${esc(t('focus.none'))}</button><button id="fcclose">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
      const v = b.dataset.f;
      G.setFocus(v === 'none' ? null : v === 'work' ? { kind: 'work' } : { kind: 'person', pid: v.slice(2) });
      U.closeDialog(); U.renderClock();
    });
    dlg.querySelector('#fcclose').onclick = U.closeDialog;
  };

  /* 房间下方的条不要了：添加，编辑，归档，删除，叫回离开的人，都在顶栏的角色里 */
  U.renderBar = function () {
    const bar = $('roomBar'); bar.style.display = 'none';
  };

})(globalThis.CY = globalThis.CY || {});
