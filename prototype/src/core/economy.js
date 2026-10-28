/* 经济：钱，物品，工作时段，保姆。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store;
  const t = (k, v) => CY.t(k, v);
  const { emit, clamp, pick } = G._h;
  /* ---------- 经济：钱，物品，工作，保姆 ---------- */
  G.economyOn = () => ini.bool(G.cfg, 'play', 'economy');
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
  G.hasNanny = p => !!(G.world.nanny || {})[p.id];
  G.setNanny = (pid, on) => { G.world.nanny = G.world.nanny || {}; if (on) G.world.nanny[pid] = true; else delete G.world.nanny[pid]; G.save(); emit(); };
  G.nannyCostPerHour = () => ini.num(G.cfg, 'economy', 'nanny_wage');
  /* 动作缺什么物品或钱，完整体验才检查 */
  G.lacking = a => {
    if (!G.economyOn()) return null;
    for (const k in a.uses || {}) if ((G.world.inv[k] || 0) < a.uses[k]) return k;
    if (a.cost && a.cost.money && G.world.money < a.cost.money) return 'money';
    return null;
  };

})(globalThis.CY = globalThis.CY || {});
