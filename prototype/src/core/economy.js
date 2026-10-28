/* 工作时段：每天几点到几点是工作时间，主角在书桌前。 */
(function (CY) {
  const G = CY.game, ini = CY.ini;
  G.workWindow = () => {
    const m = ini.get(G.cfg, 'economy', 'work_hours').match(/^(\d\d):(\d\d)-(\d\d):(\d\d)$/);
    return m ? [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]] : [540, 1080];
  };
  G.isWorkTime = () => { const [a, b] = G.workWindow(), d = G.dayMinutes(); return d >= a && d < b; };
})(globalThis.CY = globalThis.CY || {});
