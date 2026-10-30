/* 时钟：游戏里的几点，经历了多少时间，昼夜。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store;
  const t = (k, v) => CY.t(k, v);
  const { emit, clamp, pick } = G._h;
  /* ---------- 时间显示：经历了多少时间，以及现在是几点 ---------- */
  G.daySource = () => {
    const s = ini.get(G.cfg, 'time', 'daynight');
    if (s === 'system' || s === 'game') return s;
    return G.speed() > 1 ? 'game' : 'system';
  };
  /* 当天已过的分钟数，0 到 1439 */
  G.dayMinutes = () => {
    if (G.daySource() === 'system') { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
    return (Math.floor(G.world.game_minutes) + (typeof G.world.clock_shift === 'number' ? G.world.clock_shift : 480)) % 1440;
  };
  G.isNight = () => { const h = G.dayMinutes() / 60; return h >= 22 || h < 6; };
  G.clock = () => {
    const el = Math.floor(G.world.game_minutes), dm = G.dayMinutes(), pad = n => String(n).padStart(2, '0');
    return { d: Math.floor(el / 1440), h: Math.floor((el % 1440) / 60), m: el % 60, hh: pad(Math.floor(dm / 60)), mm: pad(dm % 60), src: G.daySource(), night: G.isNight(), minutes: dm };
  };

})(globalThis.CY = globalThis.CY || {});
