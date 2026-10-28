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
    for (const d of [document, U.pipDoc]) if (d) { d.documentElement.dataset.theme = th; d.documentElement.dataset.bg = bg; }
    const style = ini.get(G.cfg, 'ui', 'avatar_style') === 'detailed' ? 'detailed' : 'simple';
    if (CY.avatarStyle !== style) { CY.avatarStyle = style; if (U.room) U.renderRoom(true); }
    const tb = $('themeBtn');
    if (tb) { const m = ini.get(G.cfg, 'ui', 'theme'); tb.textContent = m === 'light' ? '☀' : m === 'dark' ? '☾' : '◐'; tb.title = t('hdr.theme_tip', { mode: t('theme.' + (m === 'light' || m === 'dark' ? m : 'auto')) }); }
  };
  /* 顶栏上的快捷控件：明暗、语言、压缩比例 */
  U.cycleTheme = async function () {
    const order = ['auto', 'light', 'dark'], cur = ini.get(G.cfg, 'ui', 'theme');
    G.cfg.ui = G.cfg.ui || {}; G.cfg.ui.theme = order[(order.indexOf(cur) + 1) % 3] || 'auto';
    await saveCfg(); U.applyTheme();
  };
  U.renderControls = function () {
    const ls = $('langSel'), names = I.names;
    const langs = Object.keys(I.packs);
    const sig = langs.join() + I.lang;
    if (ls.dataset.sig !== sig) { ls.dataset.sig = sig; ls.innerHTML = langs.map(l => `<option value="${l}" ${l === I.lang ? 'selected' : ''}>${esc(names[l] || l)}</option>`).join(''); }
  };
  U.syncTheme = U.applyTheme;
  U.applyLang = async function () {
    I.set(I.detect(ini.get(G.cfg, 'ui', 'language')));
    await G.reloadContent();
    I.applyDom(document);
    document.title = t('app.title');
    $('verTxt').textContent = t('app.proto', { v: CY.meta.version }); $('footTxt').textContent = t('foot.text');
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
  U.renderClock = function () {
    const c = G.clock();
    const el = c.d > 0 ? t('clock.dh', { d: c.d, h: c.h }) : c.h > 0 ? t('clock.hm', { h: c.h, m: c.m }) : t('clock.m', { m: c.m });
    $('elapsed').textContent = t('clock.elapsed', { t: el });
    $('elapsed').title = t('clock.elapsed_tip');
    const now = $('nowClock');
    now.textContent = (c.night ? '🌙 ' : '☀ ') + c.hh + ':' + c.mm;
    now.title = t(c.src === 'game' ? 'clock.tip_game' : 'clock.tip_system');
  };

  /* 房间下方的条不要了：添加，编辑，归档，删除，叫回离开的人，都在顶栏的角色里 */
  U.renderBar = function () {
    const bar = $('roomBar'); bar.style.display = 'none';
    $('floatNote').style.display = U.floating ? 'block' : 'none';
    $('roomSlot').style.display = U.floating ? 'none' : 'block';
  };

})(globalThis.CY = globalThis.CY || {});
