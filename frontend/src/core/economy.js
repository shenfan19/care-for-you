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

  /* 心情和收益：主角的心情决定工作效率，最低四成，心情满了是十成。工作和家里有人没人管会拉低心情，照顾别人，被照顾，照顾自己会抬高 */
  G.MOOD = { eff_min: 0.4, work_drag: 0.15, stress_each: 0.06, stress_cap: 0.12, stress_need: 0.8, act_gain: 0.03, cares_back_gain: 0.04 };
  G.efficiency = () => { const l = G.protagonist(); return l ? G.MOOD.eff_min + (1 - G.MOOD.eff_min) * l.state.mood : 1; };
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
    if (offline) return;
    /* 不用互动的礼貌：到了打个招呼，下午放一杯茶，下班留一句话。只进日志，不弹窗，不要回应 */
    if (here && G.world.nanny_hi_day !== d) { G.world.nanny_hi_day = d; G.logK('you', 'event', 'log.nanny_arrive', {}); }
    if (here && G.world.nanny_tea_day !== d && G.dayMinutes() >= 14 * 60) { G.world.nanny_tea_day = d; G.logK('you', 'event', 'log.nanny_tea', {}); }
    if (!work && G.world.nanny_paid_day === d && G.world.nanny_bye_day !== d) { G.world.nanny_bye_day = d; G.logK('you', 'event', 'log.nanny_leave', {}); }
  };
  /* 保姆现在的状态：here 在岗，wait 还没到上班时间或已下班，rest 今天钱不够休息，off 没请 */
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
