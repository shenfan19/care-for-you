/* 经济：钱，物品，工作时段，保姆。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store;
  const t = (k, v) => CY.t(k, v);
  const { emit, clamp, pick } = G._h;
  /* ---------- 经济：钱，物品，工作，保姆 ---------- */
  /* 收入的数字，每游戏小时。工资跟着工作的地方：在家，办公室，出差。现在只有在家，其余等细化 */
  G.WAGE = { home: 40, office: 60, trip: 90 };
  G.workMode = () => 'home';
  G.wage = () => G.WAGE[G.workMode()];
  G.PENSION = 4;             /* 老人主角的退休金，固定，不多，不用到书桌前 */
  G.NANNY_DAILY = 120;       /* 保姆日薪 */
  G.item = k => (G.tpl.items.items || {})[k] || (k === 'money' ? { label: CY.tOr('item.money', '钱'), icon: '💰', price: 1 } : { label: k, icon: '•', price: 10 });
  G.workWindow = () => {
    const m = ini.get(G.cfg, 'economy', 'work_hours').match(/^(\d\d):(\d\d)-(\d\d):(\d\d)$/);
    return m ? [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]] : [540, 1080];
  };
  G.isWorkTime = () => { const [a, b] = G.workWindow(), d = G.dayMinutes(); return d >= a && d < b; };
  G.buy = (k, n = 1) => {
    const it = G.item(k), cost = it.price * n;
    if (G.world.money < cost) return false;
    G.world.money -= cost; G.world.inv[k] = (G.world.inv[k] || 0) + n; G.save(); emit(); return true;
  };
  /* 动作缺什么物品或钱 */
  G.lacking = a => {
    for (const k in a.uses || {}) if ((G.world.inv[k] || 0) < a.uses[k]) return k;
    if (a.cost && a.cost.money && G.world.money < a.cost.money) return 'money';
    return null;
  };

})(globalThis.CY = globalThis.CY || {});
