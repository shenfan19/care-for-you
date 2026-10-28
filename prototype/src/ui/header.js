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
  };
  /* 顶栏已经没有语言和明暗的快捷控件，都在设置里 */
  U.renderControls = function () {};
  U.syncTheme = U.applyTheme;
  U.applyLang = async function () {
    I.set(I.detect(ini.get(G.cfg, 'ui', 'language')));
    await G.reloadContent();
    I.applyDom(document);
    document.title = t('app.title');
    for (const [id, k] of [['peopleBtn', 'hdr.people'], ['floatBtn', 'hdr.float'], ['dlBtn', 'hdr.save'], ['shareBtn', 'hdr.share'], ['gearBtn', 'hdr.settings'], ['aboutBtn', 'hdr.about']]) $(id).setAttribute('aria-label', t(k));
    $('footTxt').textContent = t('foot.text');
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
  U.renderClock = function () {};

  /* 房间下方的条不要了：添加，编辑，归档，删除，叫回离开的人，都在顶栏的角色里 */
  U.renderBar = function () {
    const bar = $('roomBar'); bar.style.display = 'none';
    $('floatNote').style.display = U.floating ? 'block' : 'none';
    $('roomSlot').style.display = U.floating ? 'none' : 'block';
  };

})(globalThis.CY = globalThis.CY || {});
