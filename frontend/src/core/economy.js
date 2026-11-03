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
  G.START_MONEY = 200;     /* 开局背景会改写起始金额，见 G.BACKGROUNDS */
  const today = () => Math.floor(G.world.game_minutes / 1440);

  /* 收益效率由负荷决定，不看心情平均：负荷是每个人没被照顾到的程度（1 减心情）乘依赖度，加总后除以主角能顾及的容量。
     依赖度按年龄阶段，卧床加倍，动物低，花草几乎为零，所以堆花草堆不出效率；每多一个依赖者负荷就多一份，人多自然更累。
     成年家人和在岗的保姆是助力，抬高容量，所以一个人带孩子最累，有人分担就轻松，不是人越少越好。效率不低于四成，不会越穷越没法挣。
     家人的满意度另算：每个心情不低的家人给收入加一点，线性叠加，有封顶，花草和动物不算 */
  G.MOOD = { eff_min: 0.4 };
  G.LOAD = {
    weight: { infant: 1, toddler: 0.8, child: 0.4, teen: 0.15, adult: 0.1, elder: 0.4 }, bedridden: 2, animal: 0.15, plant: 0.03, self: 0.3,
    capacity: 1, helper: 0.3, nanny_helper: 0.5, helper_mood: 0.5, bonus_each: 0.08, bonus_cap: 0.6, bonus_mood: 0.6,
  };
  const isNanny = p => !!(p.person.help && p.person.help.role === 'nanny');
  const loadWeight = (p, lead) => {
    const L = G.LOAD;
    if (p === lead) return L.self;
    if (p.person.kind === 'plant') return L.plant;
    if (p.person.kind !== 'human') return L.animal;
    return (L.weight[G.stage(p)] || 0.1) * (G.bedridden(p) ? L.bedridden : 1);
  };
  G.burden = () => { const lead = G.protagonist(); return G.activePeople().filter(p => !isNanny(p)).reduce((a, p) => a + loadWeight(p, lead) * (1 - p.state.mood), 0); };
  G.capacity = () => {
    const L = G.LOAD, lead = G.protagonist();
    let c = L.capacity;
    for (const p of G.activePeople()) {
      if (p === lead || G.flag(p, 'hospital')) continue;
      if (isNanny(p)) { if (G.nannyState() === 'here') c += L.nanny_helper; continue; }
      if (p.person.kind === 'human' && !p.person.visitor && ['teen', 'adult'].includes(G.stage(p)) && !G.bedridden(p) && p.state.mood >= L.helper_mood) c += L.helper;
    }
    return c;
  };
  G.householdBonus = () => {
    const L = G.LOAD, lead = G.protagonist();
    if (!lead) return 1;
    const n = G.activePeople().filter(p => p !== lead && !isNanny(p) && p.person.kind === 'human' && !p.person.visitor && p.state.mood >= L.bonus_mood).length;
    return 1 + Math.min(L.bonus_cap, L.bonus_each * n);
  };
  G.efficiency = () => {
    if (!G.protagonist()) return 1;
    const share = Math.min(1, G.burden() / G.capacity());
    return G.MOOD.eff_min + (1 - G.MOOD.eff_min) * (1 - share);
  };
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
    else if (G.isWorkTime() && (offline || !W || !W.enforce || (lead && W.worker(lead) ? W.atWork() : W.hasWorker()))) G.world.money += G.WAGE * hours * G.efficiency() * G.householdBonus();
    if (G.tripTick) G.tripTick();
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
  /* 商店：买了就一直有，没有损耗，没有订阅。价格按前台一天五分钟、一个游戏日实际收入约 250 重标：
     玩具不到半天，好床一天半，婴儿车一天半，轮椅两天半，装饰按档位一天一档，大房子八天左右。decor 是装饰的档位，买一档加一档 */
  G.SHOP = [
    { id: 'toy', price: 80, icon: '🧸', fx: { rate: { play: 0.75 }, stages: ['infant', 'toddler'] } },
    { id: 'fruit', price: 200, icon: '🍎', fx: { rate: { hunger: 0.9 } } },
    { id: 'bed', price: 350, icon: '🛏', fx: { rest_sleep: 1.3 } },
    { id: 'bed2', price: 700, icon: '🛏', needs: 'bed', fx: { rest_sleep: 1.15 } },
    { id: 'books', price: 400, icon: '📚', fx: { rate: { play: 0.85 }, mood: 0.01, stages: ['child', 'teen', 'adult', 'elder'] } },
    { id: 'stroller', price: 400, icon: '👶' }, { id: 'wheelchair', price: 600, icon: '♿', fx: { rate: { mobility: 0.7 }, stages: ['elder'] } },
    { id: 'decor1', price: 160, icon: '🪴', fx: { mood: 0.02 } }, { id: 'decor2', price: 350, icon: '🪴', needs: 'decor1', fx: { mood: 0.02 } }, { id: 'decor3', price: 550, icon: '🪴', needs: 'decor2', fx: { mood: 0.02 } },
    { id: 'house2', price: 2000, icon: '🏠', fx: { mood: 0.03 } },
  ];
  /* 舒适度修正：买到的东西各带一份 fx，这里按人汇总。rate 是需求涨速倍数，rest_sleep 是睡觉时休息恢复倍数，mood 是心情目标加成，stages 限定哪些年龄阶段受益。
     后台计算只读这一处，不再各写各的 owned 判断；加新商品只在 SHOP 里加一行 fx */
  G.shopFx = p => {
    const o = { rate: {}, rest_sleep: 1, mood: 0 }, st = G.stage(p);
    for (const it of G.SHOP) {
      if (!it.fx || !G.owned(it.id) || (it.fx.stages && !it.fx.stages.includes(st))) continue;
      for (const k in it.fx.rate || {}) o.rate[k] = (o.rate[k] || 1) * it.fx.rate[k];
      o.rest_sleep *= it.fx.rest_sleep || 1; o.mood += it.fx.mood || 0;
    }
    return o;
  };
  G.owned = id => !!(G.world.owned && G.world.owned[id]);
  G.canBuy = id => { const it = G.SHOP.find(x => x.id === id); return !!it && !G.owned(id) && G.world.money >= it.price && (!it.needs || G.owned(it.needs)); };
  G.buy = id => {
    if (!G.canBuy(id)) return false;
    const it = G.SHOP.find(x => x.id === id);
    G.world.money -= it.price; G.world.owned = Object.assign({}, G.world.owned, { [id]: true });
    G.logK('you', 'event', 'log.bought', { item: G.ref('shop.' + id, id) }); G.save(true); emit(); return true;
  };
  /* 买菜：主角去超市，一趟花 cost，带回 meals 份食材，路上 minutes 游戏分钟。做饭时用掉一份，吃得更饱，桌上摆出饭菜 */
  G.groceries = () => G.world.groceries || 0;
  G.startTrip = a => {
    const tr = a.trip, W = CY.world;
    if (G.world.trip || (G.world.money || 0) < tr.cost) return false;
    G.world.money -= tr.cost;
    G.world.trip = { place: tr.place, until: G.world.game_minutes + tr.minutes, meals: tr.meals };
    if (W && W.moveTo && W.PLACES[tr.place]) W.moveTo(tr.place, tr.room);
    G.logK('you', 'event', 'me.go', { place: G.ref('loc.' + tr.place, tr.place) });
    return true;
  };
  G.tripTick = () => {
    const tr = G.world.trip; if (!tr || G.world.game_minutes < tr.until) return;
    const W = CY.world;
    G.world.groceries = (G.world.groceries || 0) + tr.meals; delete G.world.trip;
    if (W && W.moveTo) W.moveTo(W.WORK.place, W.workRoom());
    G.logK('you', 'event', 'log.groceries', { n: tr.meals });
  };
  G.GROCERY_BONUS = { hunger: -0.15, mood: 0.02, table_minutes: 90 };
  G.useGroceries = (p, a) => {
    if (!G.groceries()) return false;
    G.world.groceries--; G.world.fed_until = G.world.game_minutes + G.GROCERY_BONUS.table_minutes;
    for (const q of G.activePeople()) {
      if (!G.isHuman(q) || ['infant', 'toddler'].includes(G.stage(q)) || G.isSleeping(q) || G.flag(q, 'hospital') || G.flag(q, 'outing') || (CY.world && CY.world.locationOf(q).place !== 'home')) continue;
      if (q !== p && 'hunger' in q.state.needs) q.state.needs.hunger = Math.max(0, q.state.needs.hunger + G.GROCERY_BONUS.hunger);
      if (q === p && 'hunger' in q.state.needs) q.state.needs.hunger = Math.max(0, q.state.needs.hunger + G.GROCERY_BONUS.hunger);
      q.state.mood = Math.min(1, q.state.mood + G.GROCERY_BONUS.mood);
    }
    return true;
  };
  G.tableFood = () => (G.world.fed_until || 0) > G.world.game_minutes;
  /* 用品出门：婴儿出门时用着婴儿车，卧床的人出门时坐着轮椅；用着的时候家里那件就不在了，画面上人物带着它 */
  G.usingStroller = p => G.owned('stroller') && G.stage(p) === 'infant' && !!G.flag(p, 'outing');
  G.usingWheelchair = p => G.owned('wheelchair') && G.bedridden(p) && !!G.flag(p, 'outing');
  G.itemAway = id => G.activePeople().some(p => id === 'stroller' ? G.usingStroller(p) : id === 'wheelchair' ? G.usingWheelchair(p) : false);
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
