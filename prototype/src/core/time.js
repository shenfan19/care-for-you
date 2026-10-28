/* 时间：现实，游戏自己的时间，快进，任务栈。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store;
  const t = (k, v) => CY.t(k, v);
  const { emit, clamp, pick } = G._h;
  /* ---------- 模式：现实模式与故事模式，以及暂停 ---------- */
  G.timeMode = () => ini.get(G.cfg, 'time', 'mode');
  /* 现实模式：时间跟现实走，长按占用现实时间。故事模式：时间压缩，点击花掉游戏时间。暂停时记着暂停前的模式 */
  G.playMode = () => (G.timeMode() === 'compressed' ? 'story' : 'reality');
  G.isPaused = () => false;
  /* 时间：real 与现实同步，free 是游戏自己的时间一倍速，compressed 是快进到一个时刻。快进到了就变成 free，不再追着现实。
     一倍速时长按，快进时点击。没有暂停：世界只在页面开着的时候走，不需要停。 */
  const dayTarget = { morning: 420, noon: 720, evening: 1080, night: 1320 };
  const syncShift = () => { const d = new Date(), sys = d.getHours() * 60 + d.getMinutes(); G.world.clock_shift = (((sys - Math.floor(G.world.game_minutes)) % 1440) + 1440) % 1440; };
  G.fastForward = async function (spec) {
    const cur = G.dayMinutes();
    const delta = spec.plus ? spec.plus : (((dayTarget[spec.to] - cur + 1440) % 1440) || 1440);
    if (G.timeMode() === 'real') syncShift();
    G.world.ff_target = G.world.game_minutes + delta;
    G.cfg.time = G.cfg.time || {}; G.cfg.time.mode = 'compressed';
    await G.saveCfg(); G.save(); emit();
  };
  G.stopFastForward = async function () { delete G.world.ff_target; G.cfg.time.mode = 'free'; await G.saveCfg(); G.save(); emit(); };
  G.backToReal = async function () { delete G.world.ff_target; G.cfg.time.mode = 'real'; await G.saveCfg(); G.save(); emit(); };
  G.ffClock = () => { const dm = (Math.floor(G.world.ff_target || 0) + (typeof G.world.clock_shift === 'number' ? G.world.clock_shift : 480)) % 1440; return String(Math.floor(dm / 60)).padStart(2, '0') + ':' + String(dm % 60).padStart(2, '0'); };
  G.setPlayMode = async function (m) {
    G.cfg.time = G.cfg.time || {}; G.cfg.play = G.cfg.play || {};
    if (m === 'paused') { G.cfg.play.last_mode = G.playMode(); G.cfg.time.mode = 'paused'; }
    else { G.cfg.time.mode = m === 'story' ? 'compressed' : 'real'; G.cfg.play.last_mode = m; }
    await G.saveCfg(); emit();
  };
  G.inputMode = () => (G.playMode() === 'story' ? 'click' : 'hold');
  /* 故事模式里一次只能做一件事，后开始的会把先开始的压到下面暂停，做完再接着做。现实模式下故事里的事暂停 */
  G.tasks = () => (G.world.tasks || (G.world.tasks = []));
  G.isBusy = () => G.timeMode() === 'compressed' && G.tasks().length > 0;
  G.runningTask = () => { const ts = G.tasks(); return ts[ts.length - 1] || null; };

})(globalThis.CY = globalThis.CY || {});
