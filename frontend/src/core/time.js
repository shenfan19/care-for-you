/* 时间有两种：普通模式游戏时间和现实时间一比一，游戏里的时刻跟着系统时钟，适合开在工作旁边安静地挂着；
   加速模式（新档默认，120 倍）把游戏时间加快，可选 30，60，120 倍，只用来很快地体验照顾家人的节奏，想安静挂机的在设置里切到普通模式。
   钱永远按现实时间算：加速模式下游戏小时走得快，但每个游戏小时的收入按倍率折回去，所以加速不多赚一分钱；专注的爬升按游戏时间，仍是 20 个游戏分钟。
   关掉页面游戏就停在那里，没有离线推进，也没有暂停；下次打开，普通模式把时刻对齐到系统时钟（天数只增不减）。动作靠长按，不随流速变。
   内部测试和仿真仍可用 time.speed 或网址 ?dev= 覆盖流速。游戏里几点由 world.clock_shift 加游戏分钟算出，和陪伴天数、各种倒计时分开存，所以改几点不会弄乱任何计时。 */
(function (CY) {
  const G = CY.game;
  G.timeMode = () => 'real';
  G.SPEEDS = [1, 6, 24, 60];   /* 旧的四档，界面已不用，只留给测试 */
  /* 第一天的时段：14:00 到 24:00，现实 minutes 分钟走完，流速由它定下 */
  G.DAY = { enabled: true, start: 840, end: 1440, minutes: 5 };
  G.STD_SPEED = 60;   /* 标准模式：现实 1 秒是游戏 1 分钟，现实 24 分钟是游戏一天 */
  G.FAST_SPEEDS = [2, 4, 6];   /* 加速模式是标准的几倍 */
  G.timeModeSetting = () => ((G.cfg.time || {}).mode === 'fast' ? 'fast' : 'standard');   /* 新档默认标准；加速在日历菜单里选，切换时明确告知赚钱不加快 */
  G.fastSpeed = () => { const v = parseFloat((G.cfg.time || {}).fast_speed); return G.FAST_SPEEDS.includes(v) ? v : 2; };
  G.dayRealMinutes = () => { const v = parseFloat((G.cfg.time || {}).day_minutes); return isFinite(v) && v > 0 ? v : G.DAY.minutes; };
  /* 内部测试开关：网址带 ?dev=360 时倍速固定为 360，长按时间为 0。不进设置，对外版本没有这个入口 */
  G.DEV = (() => { try { const m = /[?&]dev=(\d+)/.exec(globalThis.location && location.search || ''); return m ? Math.max(1, +m[1]) : 0; } catch (e) { return 0; } })();
  /* 开发者模式：网址带 ?devtools，或者带 ?dev= 的内部测试入口，界面上多出开发面板和状态曲线，普通玩家看不到 */
  Object.defineProperty(G, 'DEVTOOLS', { get: () => { try { return G.DEV > 0 || /[?&]devtools/.test(globalThis.location && location.search || ''); } catch (e) { return false; } } });
  G.speed = () => { if (G.DEV) return G.DEV; const raw = (G.cfg.time || {}).speed; if (raw !== undefined && raw !== '') { const v = parseFloat(raw); return isFinite(v) ? Math.min(360, Math.max(1, v)) : 1; } return G.STD_SPEED * (G.timeModeSetting() === 'fast' ? G.fastSpeed() : 1); };
  G.isFast = () => G.speed() > G.STD_SPEED;
  /* 钱按标准模式算：标准下一个游戏小时就是一个计价小时；加速 N 倍就除以 N，每现实秒赚的和标准一样 */
  G.econHours = gmin => gmin / 60 / Math.max(1, G.speed() / G.STD_SPEED);
  /* 新档从早上八点开始，不再跟系统时钟 */
  G.startMinute = () => (G.DEV ? G.DAY.start : 480);
  /* 游戏日历：新存档从现实当天开始，每过一个游戏日加一天；第几天，星期，节日都按它算 */
  G.gameDate = () => {
    if (!G.world.start_date) { const d = new Date(); G.world.start_date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    const [y, m, dd] = G.world.start_date.split('-').map(Number);
    const n = Math.floor((Math.floor(G.world.game_minutes) + (typeof G.world.clock_shift === 'number' ? G.world.clock_shift : 480)) / 1440);
    const d = new Date(y, m - 1, dd + n), pad = x => String(x).padStart(2, '0');
    return { n: n + 1, month: d.getMonth() + 1, day: d.getDate(), weekday: d.getDay(), iso: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), day_index: Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000) };
  };
  /* 配速：默认流速下是 1，需求跟着钟面走，每个人什么时候饿、渴、困贴近真实的间隔；只有测试把流速调得更快时才按比例压低。1 表示不折算 */
  G.PACE_BASE = 120;
  /* 现实几秒折成几个游戏分钟。外出，小睡这类要让玩家看得见的事，时长按现实秒写，不然一天压成五分钟以后，出去一趟几秒钟就回来了 */
  G.realMin = sec => sec * G.speed() / 60;
  G.outingMinutes = o => (o.seconds ? G.realMin(o.seconds) : o.minutes);
  G.pace = () => (G.DAY.enabled ? Math.min(1, G.PACE_BASE / G.speed()) : 1);
  G.speedLabel = () => '×' + Math.round(G.speed());
  /* 让游戏里现在是几点几分，0 到 1439 */
  G.setClock = minutes => { G.world.clock_shift = ((((Math.round(minutes) - Math.floor(G.world.game_minutes)) % 1440) + 1440) % 1440); };
  G.setSpeed = async v => {
    G.cfg.time = G.cfg.time || {}; G.cfg.time.speed = String(v);
    await G.saveCfg(); G.save(true);
  };
  /* 选模式：standard 或 fast（加 fast 的倍数） */
  G.setTimeMode = async (mode, fastSpeed) => {
    G.cfg.time = G.cfg.time || {}; G.cfg.time.mode = mode === 'fast' ? 'fast' : 'standard'; delete G.cfg.time.speed;
    if (fastSpeed && G.FAST_SPEEDS.includes(+fastSpeed)) G.cfg.time.fast_speed = String(fastSpeed);
    await G.saveCfg(); G.save(true);
  };
  /* 日终：午夜过后，替玩家把夜里和上午走完，停在第二天午后；离线模式，需求涨得慢，不弹窗不说话。
     钩子 G.dayEndHooks 在午夜翻日时被调用，参数是刚结束的游戏日序号，结算页挂在这里 */
  G.dayEndHooks = [];
  G.dayStartHooks = [];   /* 日终钩子之后调用 */
  G.dayRoll = () => {
    if (!G.DAY.enabled) return false;
    const n = G.gameDate().n;
    if (G._dayN === undefined) { G._dayN = n; return false; }
    if (n === G._dayN) return false;
    G._closing = G._dayN;   /* 日终钩子里记下的事算在刚结束的这一天 */
    for (const h of G.dayEndHooks) h({ day: G._dayN, offline: false });
    G._closing = null;
    G._dayN = G.gameDate().n;
    for (const h of G.dayStartHooks) h({ day: G._dayN, offline: false });
    return true;
  };
  G.nextSpeed = () => { const i = G.SPEEDS.indexOf(G.speed()); return G.SPEEDS[(i + 1) % G.SPEEDS.length]; };
  G.playMode = () => 'reality';
  G.isPaused = () => false;
  G.inputMode = () => 'hold';
  /* 长按要多少秒：由动作花掉的游戏分钟算出来，不是线性的，开方后压缩。一分钟的小事一秒多，一个小时的大事五秒多，封顶六秒。 */
  G.holdFor = min => Math.round(Math.min(6, Math.max(1, 0.6 + 0.65 * Math.sqrt(min))) * 2) / 2;
})(globalThis.CY = globalThis.CY || {});
