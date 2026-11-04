/* 工作时段和钱。钱只有两件事：在工作时段坐在书桌前赚，拿去买家里的东西和送客人的礼物。
   没有欠账，没有惩罚，攒钱慢，慢慢买。 */
(function (CY) {
  const G = CY.game, ini = CY.ini;
  const t = (k, v) => CY.t(k, v);
  const { emit } = G._h;
  G.workWindow = () => {
    const m = ini.get(G.cfg, 'economy', 'work_hours').match(/^(\d\d):(\d\d)-(\d\d):(\d\d)$/);
    return m ? [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]] : [540, 1080];
  };
  G.isWorkTime = () => { const [a, b] = G.workWindow(), d = G.dayMinutes(); return d >= a && d < b; };

  G.WAGE = 52;              /* 工作时段在书桌前，每标准游戏小时。标准模式现实 24 分钟一天，其中工作 9 分钟；挂机约一小时买第一张床，三小时多买第二张，挂机十分钟够买一件礼物 */
  G.PENSION = 5;            /* 老人主角的退休金，每标准游戏小时，固定，不用到书桌前 */
  G.START_MONEY = 200;
  const today = () => Math.floor(G.world.game_minutes / 1440);

  /* 收益效率由负荷决定，不看心情平均：负荷是每个人没被照顾到的程度（1 减心情）乘依赖度，加总后除以主角能顾及的容量。
     依赖度按年龄阶段，卧床加倍，动物低，花草几乎为零，所以堆花草堆不出效率；每多一个依赖者负荷就多一份，人多自然更累。
     成年家人是助力，抬高容量，所以一个人带孩子最累，有人分担就轻松，不是人越少越好。效率不低于四成，不会越穷越没法挣。
     家人的满意度另算：每个心情不低的家人给收入加一点，线性叠加，有封顶，花草和动物不算 */
  G.MOOD = { eff_min: 0.4 };
  G.LOAD = {
    weight: { infant: 1, toddler: 0.8, child: 0.4, teen: 0.15, adult: 0.1, elder: 0.4 }, bedridden: 2, animal: 0.15, plant: 0.03, self: 0.3,
    capacity: 1, helper: 0.3, helper_mood: 0.5, bonus_each: 0.08, bonus_cap: 0.6, bonus_mood: 0.6,
  };
  const loadWeight = (p, lead) => {
    const L = G.LOAD;
    if (p === lead) return L.self;
    if (p.person.kind === 'plant') return L.plant;
    if (p.person.kind !== 'human') return L.animal;
    return (L.weight[G.stage(p)] || 0.1) * (G.bedridden(p) ? L.bedridden : 1);
  };
  G.burden = () => { const lead = G.protagonist(); return G.activePeople().reduce((a, p) => a + loadWeight(p, lead) * (1 - p.state.mood), 0); };
  G.capacity = () => {
    const L = G.LOAD, lead = G.protagonist();
    let c = L.capacity;
    for (const p of G.activePeople()) {
      if (p === lead || G.flag(p, 'hospital')) continue;
      if (p.person.kind === 'human' && !p.person.visitor && ['teen', 'adult'].includes(G.stage(p)) && !G.bedridden(p) && p.state.mood >= L.helper_mood) c += L.helper;
    }
    return c;
  };
  G.householdBonus = () => {
    const L = G.LOAD, lead = G.protagonist();
    if (!lead) return 1;
    const n = G.activePeople().filter(p => p !== lead && p.person.kind === 'human' && !p.person.visitor && p.state.mood >= L.bonus_mood).length;
    return 1 + Math.min(L.bonus_cap, L.bonus_each * n);
  };
  G.efficiency = () => {
    if (!G.protagonist()) return 1;
    const share = Math.min(1, G.burden() / G.capacity());
    return G.MOOD.eff_min + (1 - G.MOOD.eff_min) * (1 - share);
  };
  /* 上班时每游戏小时进账多少：舒适度（效率）和家人加成都折进来，界面上显示在百分比后面。老人主角按固定退休金 */
  /* 工作专注：进入工作不是立刻满额，坐下后从 floor 线性爬到 1，用 minutes 个游戏分钟；离开工作（离开书桌，外出办事，被叫去照顾人）立刻掉回 floor，而且离开期间仍按 floor 计收入，不是零。收入速率 = 工资 乘 专注 乘 家庭效率 乘 家人加成。
     配偶不在家（出差，去公司）是别处没人打断的工作，专注按满额，家庭效率和加成照乘。参数出处见 CY.references 里的 focus。 */
  G.FOCUS = { floor: 0.2, minutes: 60 };
  G.focus = () => (typeof G.world.focus === 'number' ? G.world.focus : G.FOCUS.floor);
  /* 走过 gmin 分钟，working 为真就爬升，否则掉回 floor；返回这段时间的平均专注，离线大步长也按线性积分，不会少算也不会多算 */
  G.focusStep = (gmin, working) => {
    const F = G.FOCUS, f0 = G.focus();
    if (!working) { G.world.focus = F.floor; return F.floor; }
    const r = (1 - F.floor) / F.minutes, tf = (1 - f0) / r;
    if (gmin <= tf) { G.world.focus = f0 + r * gmin; return f0 + r * gmin / 2; }
    G.world.focus = 1;
    return (tf * (f0 + 1) / 2 + (gmin - tf)) / gmin;
  };
  /* 主角自己的工作：非老人，在工作时段，在书桌前；离线时算在岗；没有世界或不强制就位时只看时段 */
  G.leadWorking = offline => { const W = CY.world, lead = G.protagonist(); return (!lead || G.stage(lead) !== 'elder') && G.isWorkTime() && (offline || !W || !W.enforce || (!!lead && W.worker(lead) && W.atWork())); };
  G.incomeRate = () => {
    const lead = G.protagonist(); if (lead && G.stage(lead) === 'elder') return G.PENSION;
    const W = CY.world, own = lead && W && W.worker(lead) && G.isWorkTime();
    return G.WAGE * (own ? G.focus() : 1) * G.efficiency() * G.householdBonus();
  };
  /* 每次时间推进：赚钱 */
  G.economyTick = (gmin, offline) => {
    const hours = G.econHours(gmin), W = CY.world, lead = G.protagonist();   /* 钱按现实时间：加速模式下每个游戏小时折回去 */
    if (typeof G.world.money !== 'number') G.world.money = G.START_MONEY;
    if (lead && G.stage(lead) === 'elder') { G.world.money += G.PENSION * hours; G.focusStep(gmin, false); }
    else {
      const lw = G.leadWorking(offline), k = G.focusStep(gmin, lw);
      const away = !lw && G.isWorkTime() && !!lead && G.stage(lead) !== 'elder' && (!W || W.worker(lead));   /* 工作时段里人不在岗：按 floor 算，不是零 */
      if (lw || away) G.world.money += G.WAGE * hours * k * G.efficiency() * G.householdBonus();
      else if (G.isWorkTime() && W && W.enforce && !(lead && W.worker(lead)) && W.hasWorker()) G.world.money += G.WAGE * hours * G.efficiency() * G.householdBonus();   /* 别人在家办公，没人打断，专注满额 */
    }
    if (G.awayIncome) G.world.money += G.awayIncome(hours);
    if (G.tripTick) G.tripTick();
  };
  /* 商店：买了就一直有，没有损耗，没有订阅。价格按前台一天五分钟，一个游戏日收入约 100 到 150 重标。
     cat 是分类：daily 日用品有一点数值效果；decor 装饰纯粹是观感，没有任何数值效果。decor 一档一档买。
     床位另算，不在这张表里，见 G.bedsOwned：床位决定家里最多住几个人，家人和穿越者都占床位。 */
  G.SHOP = [
    { id: 'toy', cat: 'daily', price: 80, icon: '🧸', fx: { rate: { play: 0.75 }, stages: ['infant', 'toddler'] } },
    { id: 'fruit', cat: 'daily', price: 200, icon: '🍎', fx: { rate: { hunger: 0.9 } } },
    { id: 'books', cat: 'daily', price: 400, icon: '📚', fx: { rate: { play: 0.85 }, mood: 0.01, stages: ['child', 'teen', 'adult', 'elder'] } },
    { id: 'stroller', cat: 'daily', price: 400, icon: '👶' },
    { id: 'wheelchair', cat: 'daily', price: 600, icon: '♿', fx: { rate: { mobility: 0.7 }, stages: ['elder'] } },
    { id: 'cabinet', cat: 'decor', price: 300, icon: '🏺' },
    { id: 'decor1', cat: 'decor', price: 160, icon: '🪴' }, { id: 'decor2', cat: 'decor', price: 350, icon: '🛋', needs: 'decor1' }, { id: 'decor3', cat: 'decor', price: 550, icon: '📻', needs: 'decor2' },
  ];
  /* 床位：家里三间卧室，夫妻、孩子、老人各两张，一共六张，是家人的床，不用买，家人最多六位，婴儿睡婴儿床不占床位。
     客房一开始就有一张床，只给穿越者睡，最多三张，另外两张在商店买。家人和客人的床分开，家人住满了也有床留给第一位客人，不然就永远没有客人来 */
  G.FAMILY_BEDS = 6; G.GUEST_BED_MAX = 3; G.BED_PRICE = { 1: 600, 2: 400 };
  G.sleepers = () => G.activePeople().filter(p => G.isHuman(p) && G.stage(p) !== 'infant');
  G.bedUsers = () => G.sleepers().filter(p => !p.person.visitor);
  G.guestBedsOwned = () => Math.min(G.GUEST_BED_MAX, Math.max(1, G.world.gbeds || 1));
  G.bedsFree = () => G.FAMILY_BEDS - G.bedUsers().length;
  G.guestRoom = () => G.guestBedsOwned() - G.sleepers().filter(p => p.person.visitor).length;   /* 客房还能接待几位客人 */
  G.bedPrice = () => (G.guestBedsOwned() >= G.GUEST_BED_MAX ? null : G.BED_PRICE[G.guestBedsOwned()] || 600);
  G.canBuyBed = () => { const pr = G.bedPrice(); return pr !== null && G.world.money >= pr; };
  G.buyBed = () => {
    if (!G.canBuyBed()) return false;
    G.guestWatch && G.guestWatch();
    G.world.money -= G.bedPrice(); G.world.gbeds = G.guestBedsOwned() + 1; G.guestWatch && G.guestWatch();
    G.logK(G.youId(), 'event', 'log.bought', { item: G.ref('shop.bed_slot', '床位') }); G.save(true); emit(); return true;
  };
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
    G.logK(G.youId(), 'event', 'log.bought', { item: G.ref('shop.' + id, id) }); G.save(true); emit(); return true;
  };
  /* 买菜：主角去超市，一趟花 cost，带回 meals 份食材，路上 minutes 游戏分钟。做饭时用掉一份，吃得更饱，桌上摆出饭菜 */
  G.groceries = () => G.world.groceries || 0;
  G.startTrip = a => {
    const tr = a.trip, W = CY.world;
    if (G.world.trip || (G.world.money || 0) < tr.cost) return false;
    G.world.money -= tr.cost;
    G.world.trip = { place: tr.place, until: G.world.game_minutes + tr.minutes, meals: tr.meals };
    if (W && W.moveTo && W.PLACES[tr.place]) W.moveTo(tr.place, tr.room);
    G.logK(G.youId(), 'event', 'me.go', { place: G.ref('loc.' + tr.place, tr.place) });
    return true;
  };
  G.tripTick = () => {
    const tr = G.world.trip; if (!tr || G.world.game_minutes < tr.until) return;
    const W = CY.world;
    G.world.groceries = (G.world.groceries || 0) + tr.meals; delete G.world.trip;
    if (W && W.moveTo) W.moveTo(W.WORK.place, W.workRoom());
    G.logK(G.youId(), 'event', 'log.groceries', { n: tr.meals });
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
})(globalThis.CY = globalThis.CY || {});
