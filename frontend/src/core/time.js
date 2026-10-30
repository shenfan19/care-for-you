/* 时间：只有一条，没有暂停，没有任务队列，世界只在页面开着的时候走。
   流速是一个倍数 time.speed：1 是现实速度，默认 24，现实一小时过游戏里一整天。动作靠长按，不随倍速变。
   倍速大于 1 时昼夜用游戏内时钟；从 1 切到加快时，游戏时钟对齐到此刻的系统时间，不跳变。 */
(function (CY) {
  const G = CY.game;
  G.timeMode = () => 'real';
  G.SPEEDS = [1, 6, 24, 60];
  G.speed = () => { const v = parseFloat(CY.ini.get(G.cfg, 'time', 'speed')); return isFinite(v) ? Math.min(240, Math.max(1, v)) : 1; };
  /* 把游戏时钟对齐到系统时钟，之后用游戏内时钟走 */
  G.alignClock = () => { const d = new Date(), sys = d.getHours() * 60 + d.getMinutes(); G.world.clock_shift = (((sys - Math.floor(G.world.game_minutes)) % 1440) + 1440) % 1440; };
  G.setSpeed = async v => {
    const was = G.speed();
    G.cfg.time = G.cfg.time || {}; G.cfg.time.speed = String(v);
    if (was === 1 && G.speed() > 1) G.alignClock();
    await G.saveCfg(); G.save(true);
  };
  G.nextSpeed = () => { const s = G.speed(), i = G.SPEEDS.indexOf(s); return G.SPEEDS[(i + 1) % G.SPEEDS.length]; };
  G.playMode = () => 'reality';
  G.isPaused = () => false;
  G.inputMode = () => 'hold';
  /* 长按要多少秒：由动作花掉的游戏分钟算出来，不是线性的，开方后压缩。一分钟的小事一秒多，一个小时的大事五秒多，封顶六秒。 */
  G.holdFor = min => Math.round(Math.min(6, Math.max(1, 0.6 + 0.65 * Math.sqrt(min))) * 2) / 2;
})(globalThis.CY = globalThis.CY || {});
