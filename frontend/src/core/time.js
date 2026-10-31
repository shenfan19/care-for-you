/* 时间：只有一条，没有暂停，没有任务队列，世界只在页面开着的时候走，离开期间不推算，回来从离开的那一刻接着走。
   流速 time.speed 是游戏时钟的倍数，四档 1、6、24、60，默认 24，现实一小时过游戏里一整天；动作靠长按，不随倍速变。
   游戏里几点由 world.clock_shift 加游戏分钟算出，和陪伴天数、各种倒计时分开存，所以改几点不会弄乱任何计时。
   新档开局对齐系统时间；之后切倍速不动时钟，想对回系统时间或自己设几点，在设置里。 */
(function (CY) {
  const G = CY.game;
  G.timeMode = () => 'real';
  G.SPEEDS = [1, 6, 24, 60];
  /* 内部测试开关：网址带 ?dev=360 时倍速固定为 360，长按时间为 0。不进设置，对外版本没有这个入口 */
  G.DEV = (() => { try { const m = /[?&]dev=(\d+)/.exec(globalThis.location && location.search || ''); return m ? Math.max(1, +m[1]) : 0; } catch (e) { return 0; } })();
  G.speed = () => { if (G.DEV) return G.DEV; const raw = (G.cfg.time || {}).speed; if (raw === undefined || raw === '') return 24; const v = parseFloat(raw); return isFinite(v) ? Math.min(360, Math.max(1, v)) : 1; };
  /* 游戏日历：新存档从现实当天开始，每过一个游戏日加一天；第几天，星期，节日都按它算 */
  G.gameDate = () => {
    if (!G.world.start_date) { const d = new Date(); G.world.start_date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    const [y, m, dd] = G.world.start_date.split('-').map(Number);
    const n = Math.floor((Math.floor(G.world.game_minutes) + (typeof G.world.clock_shift === 'number' ? G.world.clock_shift : 480)) / 1440);
    const d = new Date(y, m - 1, dd + n), pad = x => String(x).padStart(2, '0');
    return { n: n + 1, month: d.getMonth() + 1, day: d.getDate(), weekday: d.getDay(), iso: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), day_index: Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000) };
  };
  G.speedLabel = () => '×' + G.speed();
  /* 让游戏里现在是几点几分，0 到 1439 */
  G.setClock = minutes => { G.world.clock_shift = ((((Math.round(minutes) - Math.floor(G.world.game_minutes)) % 1440) + 1440) % 1440); };
  /* 对齐到系统时钟 */
  G.alignClock = () => { const d = new Date(); G.setClock(d.getHours() * 60 + d.getMinutes()); };
  G.setSpeed = async v => {
    G.cfg.time = G.cfg.time || {}; G.cfg.time.speed = String(v);
    await G.saveCfg(); G.save(true);
  };
  G.nextSpeed = () => { const i = G.SPEEDS.indexOf(G.speed()); return G.SPEEDS[(i + 1) % G.SPEEDS.length]; };
  G.playMode = () => 'reality';
  G.isPaused = () => false;
  G.inputMode = () => 'hold';
  /* 长按要多少秒：由动作花掉的游戏分钟算出来，不是线性的，开方后压缩。一分钟的小事一秒多，一个小时的大事五秒多，封顶六秒。 */
  G.holdFor = min => Math.round(Math.min(6, Math.max(1, 0.6 + 0.65 * Math.sqrt(min))) * 2) / 2;
})(globalThis.CY = globalThis.CY || {});
