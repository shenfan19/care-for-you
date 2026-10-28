/* 启动：先确定数据放在哪里，再载入、开始心跳、画界面。 */
(function (CY) {
  const { game: G, store, ui: U, ini } = CY;
  const $ = id => document.getElementById(id);
  const t = (k, v) => CY.t(k, v);

  async function run() {
    $('gate').style.display = 'none';
    $('app').style.display = 'block';
    await G.load();
    const q = new URLSearchParams(location.search);
    if (q.get('freq')) G.cfg.interrupt.frequency = q.get('freq');
    if (q.get('quiet') !== null) G.cfg.interrupt.quiet_hours = q.get('quiet');
    if (q.get('lang')) { G.cfg.ui.language = q.get('lang'); await G.saveCfg(); CY.i18n.set(CY.i18n.detect(q.get('lang'))); await G.reloadContent(); }
    G.start();
    CY.i18n.set(CY.i18n.detect(ini.get(G.cfg, 'ui', 'language')));
    CY.i18n.applyDom(document);
    document.title = t('app.title');
    $('verTxt').textContent = t('app.proto', { v: CY.meta.version });
    $('footTxt').textContent = t('foot.text');
    U.applyTheme();
    if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => U.applyTheme());
    U.buildRoom($('room'));
    U.onFloatChange = () => U.renderBar();
    U.renderBar(); U.renderFeed(true); U.renderSaid(true); U.renderClock(); U.renderControls(); U.renderLife();
    let lastFeed = 0;
    G.on(() => {
      U.renderRoom(false);
      U.renderClock();
      U.renderBar();
      U.renderLife();
      if (Date.now() - lastFeed > 1500) { lastFeed = Date.now(); U.renderFeed(false); U.renderSaid(false); }
    });
    document.querySelectorAll('#modeSeg button').forEach(b => { b.onclick = () => U.switchMode(b.dataset.m); });
    $('themeBtn').onclick = () => U.cycleTheme();
    $('langSel').onchange = async e => { G.cfg.ui = G.cfg.ui || {}; G.cfg.ui.language = e.target.value; await store.write('settings.ini', ini.stringify(G.cfg)); U.applyLang(); U.renderControls(); };
    $('ratioSel').onchange = async e => { G.cfg.time = G.cfg.time || {}; G.cfg.time.compress_ratio = e.target.value; await store.write('settings.ini', ini.stringify(G.cfg)); U.renderControls(); };
    $('floatBtn').onclick = () => U.floatToggle();
    $('unfloatBtn').onclick = () => U.floatToggle();
    CY.world.enforce = true;
    $('dlBtn').onclick = () => U.saveDialog();
    $('shareBtn').onclick = () => U.shareDialog();
    $('gearBtn').onclick = () => U.settingsDialog();
    $('aboutBtn').onclick = () => U.aboutDialog();
    $('footAbout').onclick = e => { e.preventDefault(); U.aboutDialog(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) G.save(true); });
    window.addEventListener('pagehide', () => G.save(true));
    if (!G.people.length && q.get('onboard') !== '0') U.onboard();
    else if (G.people.length && !G.world.intro_done && q.get('onboard') !== '0') U.introDialog();
  }

  async function boot() {
    let state;
    /* 语言包要在存储之前能用，所以先按浏览器语言设一次 */
    CY.i18n.set(CY.i18n.detect('auto'));
    try { state = await store.init(); } catch (e) { $('gate').style.display = 'block'; $('gate').innerHTML = '<h1>' + t('gate.fail') + '</h1><p class="mute">' + e.message + '</p>'; return; }
    if (state === 'need-permission') {
      const g = $('gate'); g.style.display = 'block';
      g.innerHTML = `<h1>Care for You</h1><p>${t('gate.perm', { name: store.pendingHandle.name })}</p>
        <div class="row"><button id="g1" class="primary">${t('gate.continue')}</button><button id="g2">${t('gate.browser')}</button></div>`;
      $('g1').onclick = async () => { try { await store.restoreFolder(); run(); } catch (e) { alert(e.message); } };
      $('g2').onclick = async () => { await store.useBrowserStorage(); run(); };
      return;
    }
    run();
  }
  boot();
})(globalThis.CY);
