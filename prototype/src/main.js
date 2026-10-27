/* 启动：先确定数据放在哪里，再载入、开始心跳、画界面。 */
(function (CY) {
  const { game: G, store, ui: U, ini } = CY;
  const $ = id => document.getElementById(id);

  async function run() {
    $('gate').style.display = 'none';
    $('app').style.display = 'block';
    await G.load();
    const q = new URLSearchParams(location.search);
    if (q.get('freq')) G.cfg.interrupt.frequency = q.get('freq');
    if (q.get('quiet') !== null) G.cfg.interrupt.quiet_hours = q.get('quiet');
    G.start();
    U.buildRoom($('room'));
    U.onFloatChange = () => U.renderBar();
    U.renderBar(); U.renderFeed(true); U.renderSaid(true); U.renderClock();
    let lastFeed = 0;
    G.on(() => {
      U.renderRoom(false);
      U.renderClock();
      U.renderBar();
      if (Date.now() - lastFeed > 1500) { lastFeed = Date.now(); U.renderFeed(false); U.renderSaid(false); }
    });
    $('timeMode').onchange = async e => {
      G.cfg.time = G.cfg.time || {}; G.cfg.time.mode = e.target.value;
      await store.write('settings.ini', ini.stringify(G.cfg));
    };
    $('floatBtn').onclick = () => U.floatToggle();
    $('unfloatBtn').onclick = () => U.floatToggle();
    $('dlBtn').onclick = () => U.download();
    $('gearBtn').onclick = () => U.settingsDialog();
    document.addEventListener('visibilitychange', () => { if (document.hidden) G.save(true); });
    window.addEventListener('pagehide', () => G.save(true));
    if (!G.people.length && q.get('onboard') !== '0') U.onboard();
  }

  async function boot() {
    let state;
    try { state = await store.init(); } catch (e) { $('gate').style.display = 'block'; $('gate').innerHTML = '<h1>打不开存储</h1><p class="mute">' + e.message + '</p>'; return; }
    if (state === 'need-permission') {
      const g = $('gate'); g.style.display = 'block';
      g.innerHTML = `<h1>Care for You</h1><p>上次你选了数据文件夹 <b>${store.pendingHandle.name}</b>。浏览器需要你再确认一次访问权限。</p>
        <div class="row"><button id="g1" class="primary">继续使用这个文件夹</button><button id="g2">改用浏览器内部存储</button></div>`;
      $('g1').onclick = async () => { try { await store.restoreFolder(); run(); } catch (e) { alert(e.message); } };
      $('g2').onclick = async () => { await store.useBrowserStorage(); run(); };
      return;
    }
    run();
  }
  boot();
})(globalThis.CY);
