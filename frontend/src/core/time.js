/* 时间：前台一天只玩午后到午夜这一段，默认现实五分钟，到午夜结算，夜里和上午由引擎替玩家走完，第二天从午后接着玩。
   没有倍速可选，流速由一天的长度推出来：游戏分钟除以现实分钟。离开超过三小时，回来时按每三小时折一天追算，最多三天。
   动作靠长按，不随流速变。内部测试和仿真仍可用 time.speed 或网址 ?dev= 覆盖流速。
   游戏里几点由 world.clock_shift 加游戏分钟算出，和陪伴天数、各种倒计时分开存，所以改几点不会弄乱任何计时。
   新档开局对齐系统时间；之后切倍速不动时钟，想对回系统时间或自己设几点，在设置里。 */
(function (CY) {
  const G = CY.game;
  G.timeMode = () => 'real';
  G.SPEEDS = [1, 6, 24, 60];   /* 旧的四档，界面已不用，只留给测试 */
  /* 一天的前台时段：14:00 到 24:00，现实 minutes 分钟走完 */
  G.DAY = { enabled: true, start: 840, end: 1440, minutes: 5, away_hours_per_day: 3, away_max_days: 3, chunk: 30 };
  G.dayRealMinutes = () => { const v = parseFloat((G.cfg.time || {}).day_minutes); return isFinite(v) && v > 0 ? v : G.DAY.minutes; };
  /* 内部测试开关：网址带 ?dev=360 时倍速固定为 360，长按时间为 0。不进设置，对外版本没有这个入口 */
  G.DEV = (() => { try { const m = /[?&]dev=(\d+)/.exec(globalThis.location && location.search || ''); return m ? Math.max(1, +m[1]) : 0; } catch (e) { return 0; } })();
  G.speed = () => { if (G.DEV) return G.DEV; const raw = (G.cfg.time || {}).speed; if (raw === undefined || raw === '') return (G.DAY.end - G.DAY.start) / G.dayRealMinutes(); const v = parseFloat(raw); return isFinite(v) ? Math.min(360, Math.max(1, v)) : 1; };
  /* 游戏日历：新存档从现实当天开始，每过一个游戏日加一天；第几天，星期，节日都按它算 */
  G.gameDate = () => {
    if (!G.world.start_date) { const d = new Date(); G.world.start_date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    const [y, m, dd] = G.world.start_date.split('-').map(Number);
    const n = Math.floor((Math.floor(G.world.game_minutes) + (typeof G.world.clock_shift === 'number' ? G.world.clock_shift : 480)) / 1440);
    const d = new Date(y, m - 1, dd + n), pad = x => String(x).padStart(2, '0');
    return { n: n + 1, month: d.getMonth() + 1, day: d.getDate(), weekday: d.getDay(), iso: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), day_index: Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000) };
  };
  /* 配速：钟面走得比原来的 24 倍快时，需求按现实秒的节奏涨，不跟着钟面涨，所以一天压成五分钟也不会被淹没。1 表示不折算 */
  G.PACE_BASE = 24;
  /* 现实几秒折成几个游戏分钟。外出，小睡这类要让玩家看得见的事，时长按现实秒写，不然一天压成五分钟以后，出去一趟几秒钟就回来了 */
  G.realMin = sec => sec * G.speed() / 60;
  G.outingMinutes = o => (o.seconds ? G.realMin(o.seconds) : o.minutes);
  G.pace = () => (G.DAY.enabled ? Math.min(1, G.PACE_BASE / G.speed()) : 1);
  G.speedLabel = () => '×' + Math.round(G.speed());
  /* 让游戏里现在是几点几分，0 到 1439 */
  G.setClock = minutes => { G.world.clock_shift = ((((Math.round(minutes) - Math.floor(G.world.game_minutes)) % 1440) + 1440) % 1440); };
  /* 对齐到系统时钟 */
  G.alignClock = () => { const d = new Date(); G.setClock(d.getHours() * 60 + d.getMinutes()); };
  G.setSpeed = async v => {
    G.cfg.time = G.cfg.time || {}; G.cfg.time.speed = String(v);
    await G.saveCfg(); G.save(true);
  };
  /* 日终：午夜过后，替玩家把夜里和上午走完，停在第二天午后；离线模式，需求涨得慢，不弹窗不说话。
     钩子 G.dayEndHooks 在跳过之前被调用，参数是刚结束的游戏日序号和是否离线追算，结算页挂在这里 */
  G.dayEndHooks = [];
  G.dayStartHooks = [];   /* 跳到次日午后之后调用，访客到来挂在这里 */
  G.skipToAfternoon = () => {
    let gap = (G.DAY.start - G.dayMinutes() + 1440) % 1440;
    while (gap > 0) { const c = Math.min(G.DAY.chunk, gap); G.advance(c, true); gap -= c; }
  };
  G.dayRoll = () => {
    if (!G.DAY.enabled) return false;
    const n = G.gameDate().n;
    if (G._dayN === undefined) { G._dayN = n; return false; }
    if (n === G._dayN) return false;
    G._closing = G._dayN;   /* 日终钩子里记下的事算在刚结束的这一天 */
    for (const h of G.dayEndHooks) h({ day: G._dayN, offline: false });
    G._closing = null;
    G.skipToAfternoon();
    G._dayN = G.gameDate().n;
    for (const h of G.dayStartHooks) h({ day: G._dayN, offline: false });
    return true;
  };
  /* 离开期间追算：每三小时折一天，最多三天。先走完当天，再整天整天地走 */
  G.catchUp = away => {
    const D = G.DAY, days = Math.min(D.away_max_days, Math.floor(away / (D.away_hours_per_day * 3600e3)));
    if (days < 1) return 0;
    const n0 = G.gameDate().n;
    for (let i = 0; i < days; i++) {
      let left = i === 0 ? (1440 - G.dayMinutes() + 1440) % 1440 || 1440 : 1440;
      while (left > 0) { const c = Math.min(D.chunk, left); G.advance(c, true); left -= c; }
      G._closing = n0 + i;
      for (const h of G.dayEndHooks) h({ day: n0 + i, offline: true });
      G._closing = null;
      G.skipToAfternoon();
      for (const h of G.dayStartHooks) h({ day: n0 + i + 1, offline: true });
    }
    G._dayN = G.gameDate().n;
    return days;
  };
  G.nextSpeed = () => { const i = G.SPEEDS.indexOf(G.speed()); return G.SPEEDS[(i + 1) % G.SPEEDS.length]; };
  G.playMode = () => 'reality';
  G.isPaused = () => false;
  G.inputMode = () => 'hold';
  /* 长按要多少秒：由动作花掉的游戏分钟算出来，不是线性的，开方后压缩。一分钟的小事一秒多，一个小时的大事五秒多，封顶六秒。 */
  G.holdFor = min => Math.round(Math.min(6, Math.max(1, 0.6 + 0.65 * Math.sqrt(min))) * 2) / 2;
})(globalThis.CY = globalThis.CY || {});
