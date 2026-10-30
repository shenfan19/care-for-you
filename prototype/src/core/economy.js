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
    else if (G.isWorkTime() && (offline || !W || !W.enforce || W.hasWorker())) G.world.money += G.WAGE * hours;
    const n = G.nanny();
    if (!n) return;
    if (!G.nannyOn()) { return; }
    const d = today();
    if (G.world.nanny_paid_day !== d && G.world.nanny_rest_day !== d) {
      if (G.world.money >= G.NANNY_DAILY) { G.world.money -= G.NANNY_DAILY; G.world.nanny_paid_day = d; if (!offline) G.logK('you', 'event', 'log.nanny_paid', { n: G.NANNY_DAILY }); }
      else { G.world.nanny_rest_day = d; if (!offline) G.logK('you', 'event', 'log.nanny_rest', {}); }
    }
    setDuty(n, G.world.nanny_paid_day === d && G.isWorkTime());
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
    G.economyTick(0, true); G.save(true); emit();
    return true;
  };
  G.dismissNanny = async () => {
    const n = G.nanny(); G.world.nanny_on = false;
    if (n) { G.clearFlag(n, 'offduty'); await G.setActive(n.id, false); }
    G.logK('you', 'event', 'log.nanny_end', {}); G.save(true); emit();
  };
})(globalThis.CY = globalThis.CY || {});
