/* 工作时段和钱。钱只有两件事：在工作时段坐在书桌前赚，拿去请保姆。
   没有欠账，没有惩罚：钱不够的那天保姆休息，下一天钱够了再来。 */
(function (CY) {
  const G = CY.game, ini = CY.ini;
  const t = (k, v) => CY.t(k, v);
  const { emit } = G._h;
  G.workWindow = () => {
    const m = ini.get(G.cfg, 'economy', 'work_hours').match(/^(\d\d):(\d\d)-(\d\d):(\d\d)$/);
    return m ? [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]] : [540, 1080];
  };
  G.isWorkTime = () => { const [a, b] = G.workWindow(), d = G.dayMinutes(); return d >= a && d < b; };

  G.WAGE = 40;             /* 工作时段在书桌前，每游戏小时 */
  G.PENSION = 4;           /* 老人主角的退休金，每游戏小时，固定，不用到书桌前 */
  G.NANNY_DAILY = 120;     /* 保姆每天 */
  G.START_MONEY = 200;
  const today = () => Math.floor(G.world.game_minutes / 1440);

  /* 收益效率：每个人头像下的状态条就是各自的心情，全家的平均就是上班的人的工作效率，包括你自己，不算保姆。
     平均低于四成按四成算，不会越穷越没法挣，也不会一落千丈 */
  G.MOOD = { eff_min: 0.4 };
  G.familyState = () => { const xs = G.activePeople().filter(p => !(p.person.help && p.person.help.role === 'nanny')); return xs.length ? xs.reduce((a, p) => a + p.state.mood, 0) / xs.length : 1; };
  G.efficiency = () => (G.protagonist() ? Math.min(1, Math.max(G.MOOD.eff_min, G.familyState())) : 1);
  G.nanny = () => G.people.find(p => p.person.help && p.person.help.role === 'nanny') || null;
  G.nannyOn = () => !!G.world.nanny_on;
  const setDuty = (n, on) => {
    const off = !!G.flag(n, 'offduty');
    if (on && off) G.clearFlag(n, 'offduty');
    else if (!on && !off) G.setFlag(n, 'offduty', { place: 'street', room: 'road', mode: 'stand' });
  };

  /* 每次时间推进：赚钱，保姆按天付工资，保姆上下班 */
  G.economyTick = (gmin, offline) => {
    const hours = gmin / 60, W = CY.world, lead = G.protagonist();
    if (typeof G.world.money !== 'number') G.world.money = G.START_MONEY;
    if (lead && G.stage(lead) === 'elder') G.world.money += G.PENSION * hours;
    else if (G.isWorkTime() && (offline || !W || !W.enforce || (lead && W.worker(lead) ? W.atWork() : W.hasWorker()))) G.world.money += G.WAGE * hours * G.efficiency();
    const n = G.nanny();
    if (!n) return;
    if (!G.nannyOn()) { return; }
    const d = today(), work = G.isWorkTime();
    if (work && G.world.nanny_paid_day !== d && G.world.nanny_rest_day !== d) {
      if (G.world.money >= G.NANNY_DAILY) { G.world.money -= G.NANNY_DAILY; G.world.nanny_paid_day = d; if (!offline) G.logK('you', 'event', 'log.nanny_paid', { n: G.NANNY_DAILY }); }
      else { G.world.nanny_rest_day = d; if (!offline) G.logK('you', 'event', 'log.nanny_rest', {}); }
    }
    const here = G.world.nanny_paid_day === d && work;
    setDuty(n, here);
    /* 保姆的心情：在岗每小时降 0.003，慢，不在岗每小时回 0.02；奖金只会加。心情决定她帮忙的效果，最低八成 */
    n.state.mood = Math.min(1, Math.max(0, n.state.mood + (here ? -G.NANNY_MOOD.drain : G.NANNY_MOOD.recover) * hours));
    if (offline) return;
    /* 不用互动的礼貌：到了打个招呼，下午放一杯茶，下班留一句话。只进日志，不弹窗，不要回应 */
    if (here && G.world.nanny_hi_day !== d) { G.world.nanny_hi_day = d; G.logK('you', 'event', 'log.nanny_arrive', {}); }
    if (here && G.world.nanny_tea_day !== d && G.dayMinutes() >= 14 * 60) { G.world.nanny_tea_day = d; G.logK('you', 'event', 'log.nanny_tea', {}); }
    if (!work && G.world.nanny_paid_day === d && G.world.nanny_bye_day !== d) { G.world.nanny_bye_day = d; G.logK('you', 'event', 'log.nanny_leave', {}); }
  };
  /* 保姆现在的状态：here 在岗，wait 还没到上班时间或已下班，rest 今天钱不够休息，off 没请 */
  /* 商店：买了就一直有，没有损耗，没有订阅。价格按每游戏小时 40 的收入和一天约 150 到 200 的实际收入定，
     玩具半天，好床两天，婴儿车两天，轮椅三天，装饰按档位一天一档。decor 是装饰的档位，买一档加一档 */
  G.SHOP = [
    { id: 'toy', price: 60, icon: '🧸' }, { id: 'bed', price: 250, icon: '🛏' }, { id: 'stroller', price: 300, icon: '👶' }, { id: 'wheelchair', price: 450, icon: '♿' },
    { id: 'decor1', price: 120, icon: '🪴' }, { id: 'decor2', price: 250, icon: '🪴', needs: 'decor1' }, { id: 'decor3', price: 400, icon: '🪴', needs: 'decor2' },
    { id: 'house2', price: 1500, icon: '🏠' },
  ];
  G.owned = id => !!(G.world.owned && G.world.owned[id]);
  G.canBuy = id => { const it = G.SHOP.find(x => x.id === id); return !!it && !G.owned(id) && G.world.money >= it.price && (!it.needs || G.owned(it.needs)); };
  G.buy = id => {
    if (!G.canBuy(id)) return false;
    const it = G.SHOP.find(x => x.id === id);
    G.world.money -= it.price; G.world.owned = Object.assign({}, G.world.owned, { [id]: true });
    G.logK('you', 'event', 'log.bought', { item: G.ref('shop.' + id, id) }); G.save(true); emit(); return true;
  };
  G.decorLevel = () => (G.owned('decor1') ? 1 : 0) + (G.owned('decor2') ? 1 : 0) + (G.owned('decor3') ? 1 : 0);
  G.NANNY_MOOD = { drain: 0.003, recover: 0.02, tip_cost: 40, tip_gain: 0.15, eff_floor: 0.8 };
  G.nannyEfficiency = () => { const n = G.nanny(); return n ? G.NANNY_MOOD.eff_floor + (1 - G.NANNY_MOOD.eff_floor) * n.state.mood : 1; };
  /* 奖金：每天一次，她在岗时才能给，只有加分，没有批评，克扣，加班这类操作 */
  G.canTip = () => G.nannyState() === 'here' && G.world.nanny_tip_day !== today() && G.world.money >= G.NANNY_MOOD.tip_cost;
  G.tipNanny = () => {
    const n = G.nanny(); if (!n || !G.canTip()) return false;
    G.world.money -= G.NANNY_MOOD.tip_cost; G.world.nanny_tip_day = today(); n.state.mood = Math.min(1, n.state.mood + G.NANNY_MOOD.tip_gain);
    G.logK('you', 'event', 'log.nanny_tip', {}); G.save(true); emit(); return true;
  };
  G.nannyState = () => {
    if (!G.nannyOn()) return 'off';
    const d = today();
    if (G.isWorkTime() && G.world.nanny_paid_day === d) return 'here';
    if (G.world.nanny_rest_day === d) return 'rest';
    return 'wait';
  };

  G.hireNanny = async () => {
    if (G.nannyOn()) return false;
    let n = G.nanny();
    G.world.nanny_on = true; G.world.nanny_paid_day = undefined; G.world.nanny_rest_day = undefined;
    if (!n) {
      await G.createPerson({ arch: 'nanny', name: t('nanny.name'), roleText: t('nanny.name') });
      const keep = { money: G.world.money, nanny_on: true };
      await G.load(); Object.assign(G.world, keep); n = G.nanny();
    } else await G.setActive(n.id, true);
    G.logK('you', 'event', 'log.nanny_hired', {});
    G.economyTick(0, true);
    if (G.nannyState() === 'wait') G.logK('you', 'event', 'log.nanny_wait', { from: ini.get(G.cfg, 'economy', 'work_hours').split('-')[0] });
    G.save(true); emit();
    return true;
  };
  G.dismissNanny = async () => {
    const n = G.nanny(); G.world.nanny_on = false;
    if (n) { G.clearFlag(n, 'offduty'); await G.setActive(n.id, false); }
    G.logK('you', 'event', 'log.nanny_end', {}); G.save(true); emit();
  };
})(globalThis.CY = globalThis.CY || {});
