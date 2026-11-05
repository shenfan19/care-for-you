/* 工作时段和钱。钱只有两件事：在工作时段坐在书桌前赚，拿去买家里的东西和送客人的礼物。
   没有欠账，没有惩罚，攒钱慢，慢慢买。 */
(function (CY) {
  const G = CY.game, ini = CY.ini;
  const t = (k, v) => CY.t(k, v);
  const { emit } = G._h;
  G.workWindow = () => {
    const m = ini.get(G.cfg, 'economy', 'work_hours').match(/^(\d\d):(\d\d)-(\d\d):(\d\d)$/);
    return m ? [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]] : G.E('economy').work_hours_default;
  };
  G.isWorkTime = () => { const [a, b] = G.workWindow(), d = G.dayMinutes(); return d >= a && d < b; };

  /* 工资，退休金，起始的钱，效率下限，负荷，专注，商品，床位，买菜加成：都在 templates/engine.yaml 的 economy 和 shop 里 */
  G.constGet('WAGE', () => G.E('economy').wage);
  G.constGet('PENSION', () => G.E('economy').pension);
  G.constGet('START_MONEY', () => G.E('economy').start_money);
  const today = () => Math.floor(G.world.game_minutes / 1440);

  /* 收益效率由负荷决定，不看心情平均：负荷是每个人没被照顾到的程度（1 减心情）乘依赖度，加总后除以主角能顾及的容量。
     依赖度按年龄阶段，卧床加倍，动物低，花草几乎为零，所以堆花草堆不出效率；每多一个依赖者负荷就多一份，人多自然更累。
     成年家人是助力，抬高容量，所以一个人带孩子最累，有人分担就轻松，不是人越少越好。效率不低于四成，不会越穷越没法挣。
     家人的满意度另算：每个心情不低的家人给收入加一点，线性叠加，有封顶，花草和动物不算 */
  G.constGet('MOOD', () => ({ eff_min: G.E('economy').mood_eff_min }));
  G.constGet('LOAD', () => G.E('economy').load);
  const loadWeight = (p, lead) => {
    const L = G.LOAD;
    if (p === lead) return L.self;
    if (p.person.kind === 'plant') return L.plant;
    if (p.person.kind !== 'human') return L.animal;
    return (G.opt(L.weight, G.stage(p)) || L.weight_default) * (G.bedridden(p) ? L.bedridden : 1);
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
  G.constGet('FOCUS', () => G.E('economy').focus);
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
  G.constGet('SHOP', () => G.E('shop').items);
  /* 床位：家里三间卧室，夫妻、孩子、老人各两张，一共六张，是家人的床，不用买，家人最多六位，婴儿睡婴儿床不占床位。
     客房一开始就有一张床，只给穿越者睡，最多三张，另外两张在商店买。家人和客人的床分开，家人住满了也有床留给第一位客人，不然就永远没有客人来 */
  G.constGet('FAMILY_BEDS', () => G.E('economy').beds.family); G.constGet('GUEST_BED_MAX', () => G.E('economy').beds.guest_max); G.constGet('BED_PRICE', () => G.E('economy').beds.price);
  G.sleepers = () => G.activePeople().filter(p => G.isHuman(p) && G.stage(p) !== 'infant');
  G.bedUsers = () => G.sleepers().filter(p => !p.person.visitor);
  G.guestBedsOwned = () => Math.min(G.GUEST_BED_MAX, Math.max(1, G.world.gbeds || 1));
  G.bedsFree = () => G.FAMILY_BEDS - G.bedUsers().length;
  G.guestRoom = () => G.guestBedsOwned() - G.sleepers().filter(p => p.person.visitor).length;   /* 客房还能接待几位客人 */
  G.bedPrice = () => (G.guestBedsOwned() >= G.GUEST_BED_MAX ? null : G.opt(G.BED_PRICE, G.guestBedsOwned()) || G.E('economy').beds.price_default);
  G.canBuyBed = () => { const pr = G.bedPrice(); return G.module('shop') && pr !== null && G.world.money >= pr; };
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
      if (!it.fx || !G.hasItem(it.id) || (it.fx.stages && !it.fx.stages.includes(st))) continue;
      for (const k in it.fx.rate || {}) o.rate[k] = (o.rate[k] || 1) * it.fx.rate[k];
      o.rest_sleep *= it.fx.rest_sleep || 1; o.mood += it.fx.mood || 0;
    }
    return o;
  };
  /* 商品分两种。解锁型：婴儿车，轮椅，有了才做得了某些事，不改变需求涨落的速度。加成型：玩具，果盘，书架，做某个动作的当次效果更多，一次性的，
     需求该涨还是涨，不因为买了东西变慢。boost 写在商品上：need 是动作要缓解的需求，scale 是这一项效果的倍数，mood 是当次额外的心情，stages 限定受益的阶段 */
  G.shopBoost = (p, a) => {
    const o = { scale: {}, all: 1, mood: 0 }, st = G.stage(p);
    for (const it of G.SHOP) {
      const b = it.boost;
      if (!b || !G.hasItem(it.id) || (b.stages && !b.stages.includes(st)) || !(a.effect && a.effect[b.need] > 0)) continue;
      o.scale[b.need] = (o.scale[b.need] || 1) * (b.scale || 1); o.mood += b.mood || 0;
    }
    if (a.outing && G.hasItem('wheelchair') && G.needsChair(p)) o.all = G.SHOP.find(x => x.id === 'wheelchair').outing_scale;   /* 轮椅出门的好处多一些 */
    return o;
  };
  /* 轮椅：腿脚不便的人没有轮椅出不了门，也没法自己去想去的地方；有了就能出去，出门的好处按商品上的 outing_scale 多一些。卧床的人也要用轮椅出门，卧床老人更完整的行动设计还没做。
     谁算腿脚不便是数据：类别里写了 legs_frailty（老人 0.5）的，虚弱度到这里；或者得了标了 legs_bad 的病（关节炎） */
  G.legsBad = p => { const cl = p && G.isHuman(p) ? G.classOf(p) : null; return !!cl && cl.legs_frailty !== undefined && !G.bedridden(p) && !p.person.visitor && (p.state.frailty >= cl.legs_frailty || (p.person.conditions || []).some(c => (G.tpl.conditions[c] || {}).legs_bad)); };
  G.needsChair = p => G.bedridden(p) || G.legsBad(p);
  G.owned = id => !!(G.world.owned && G.world.owned[id]);
  G.canBuy = id => { const it = G.SHOP.find(x => x.id === id); return G.module('shop') && !!it && !G.owned(id) && G.world.money >= it.price && (!it.needs || G.owned(it.needs)); };
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
  G.constGet('GROCERY_BONUS', () => G.E('economy').grocery_bonus);
  G.useGroceries = (p, a) => {
    if (!G.groceries()) return false;
    G.world.groceries--; G.world.fed_until = G.world.game_minutes + G.GROCERY_BONUS.table_minutes;
    for (const q of G.activePeople()) {
      if (!G.isHuman(q) || ['infant', 'toddler'].includes(G.stage(q)) || G.isSleeping(q) || G.flag(q, 'hospital') || G.flag(q, 'outing') || (CY.world && CY.world.locationOf(q).place !== 'home')) continue;
      if (q !== p && 'hunger' in q.state.needs) q.state.needs.hunger = Math.min(1, q.state.needs.hunger + G.GROCERY_BONUS.hunger);
      if (q === p && 'hunger' in q.state.needs) G.setNeed(q, 'hunger', Math.max(0, G.need(q, 'hunger') + G.GROCERY_BONUS.hunger));
      q.state.mood = Math.min(1, q.state.mood + G.GROCERY_BONUS.mood);
    }
    return true;
  };
  G.tableFood = () => (G.world.fed_until || 0) > G.world.game_minutes;
  /* 用品出门：婴儿出门时用着婴儿车，卧床的人出门时坐着轮椅；用着的时候家里那件就不在了，画面上人物带着它 */
  G.usingStroller = p => G.hasItem('stroller') && G.stage(p) === 'infant' && !!G.flag(p, 'outing');
  G.usingWheelchair = p => G.hasItem('wheelchair') && G.needsChair(p) && !!G.flag(p, 'outing');
  G.itemAway = id => G.activePeople().some(p => id === 'stroller' ? G.usingStroller(p) : id === 'wheelchair' ? G.usingWheelchair(p) : false);
  G.decorLevel = () => (G.hasItem('decor1') ? 1 : 0) + (G.hasItem('decor2') ? 1 : 0) + (G.hasItem('decor3') ? 1 : 0);
})(globalThis.CY = globalThis.CY || {});
