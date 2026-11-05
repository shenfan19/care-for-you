/* 看护调度仿真：没有玩家，全家自己过几天，量每个人睡了多少，谁被需求压了多久，宝宝有没有人管。
   用法：node tests/care_sim.js [天数=3] [家庭=trio|duo|duo_gma|duo_gma_gpa|single3|single3_gma|forget|nocturia|five|family] [种子=1]，环境变量 CARE_FEED=breast 母乳喂养，默认配方奶
   步长：每步现实 5 秒，流速 60，所以一步是 5 个游戏分钟，精度低于一小时。
   输出每人每天的指标，CARE_SIM_JSON=1 时最后多输出一行 JSON，给结构设计迭代做对比。 */
const { ctx, CY, G } = require('./harness');
const days = +process.argv[2] || 3, kind = process.argv[3] || 'trio', seed = +process.argv[4] || 1;
{ let a = seed >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const FAMILIES = {
  duo: [['mom', '妈妈'], ['baby', '宝宝']],
  trio: [['mom', '妈妈'], ['dad', '爸爸'], ['baby', '宝宝']],
  duo_gma: [['mom', '妈妈'], ['baby', '宝宝'], ['paternal_grandma', '奶奶']],
  duo_gma_gpa: [['mom', '妈妈'], ['baby', '宝宝'], ['paternal_grandma', '奶奶'], ['paternal_grandpa', '爷爷']],
  single3: [['mom', '妈妈'], ['baby', '宝宝'], ['toddler_2', '二岁'], ['daughter', '女儿']],
  single3_gma: [['mom', '妈妈'], ['baby', '宝宝'], ['toddler_2', '二岁'], ['daughter', '女儿'], ['paternal_grandma', '奶奶']],
  forget: [['mom', '妈妈'], ['dad', '爸爸'], ['paternal_grandpa', '爷爷', ['forgetful']]],
  nocturia: [['mom', '妈妈'], ['dad', '爸爸'], ['paternal_grandpa', '爷爷', ['nocturia']]],
  five: [['paternal_grandpa', '爷爷'], ['mom', '妈妈'], ['dad', '爸爸'], ['toddler_2', '二岁'], ['baby', '宝宝']],
  family: [['paternal_grandpa', '爷爷'], ['paternal_grandma', '奶奶'], ['mom', '妈妈'], ['dad', '爸爸'], ['toddler_2', '二岁'], ['baby', '宝宝'], ['daughter', '女儿']],
};
(async () => {
  let fake = Date.UTC(2026, 9, 28, 0, 0, 0);
  const Real = Date;
  ctx.Date = class extends Real { static now() { return fake; } constructor(...a) { if (a.length) super(...a); else super(fake); } };
  CY.i18n.set('zh-CN');
  await G.load();
  G.cfg.interrupt.frequency = 'off';
  for (const [arch, name, conditions] of FAMILIES[kind]) await G.createPerson({ arch, name, conditions });
  await G.load();
  G.world.intro_done = true; G.cfg.play.backend_provider = 'builtin'; G.cfg.play.condition_models = 'false';
  G.world.protagonist = null; CY.world.enforce = false;
  G.world.feeding = process.env.CARE_FEED === 'breast' ? 'breast' : 'formula';   /* 没有玩家，也没有主角 */
  G.cfg.time.speed = '60'; G.cfg.time.daynight = 'game';
  G.setClock(480); G._dayN = undefined; G.DAY.enabled = true;
  G.lastTick = fake; G.nextAt = fake + 4000;
  const names = G.people.filter(p => G.isHuman(p)).map(p => p.person.name);
  const M = {}; for (const n of names) M[n] = { sleepMin: 0, awakeMin: 0, urgentMin: 0, maxRun: 0, run: 0, moodSum: 0, n: 0 };
  let babyUnattended = 0, babyUrgent = 0, babyMin = 0, napMin = 0;
  const stepMin = 5, steps = Math.round(days * 1440 / stepMin);
  const f0 = {}; for (const p of G.people) f0[p.person.name] = p.state.frailty;
  for (let i = 0; i < steps; i++) {
    fake += 5000; G.tick();
    for (const p of G.people.filter(q => G.isHuman(q))) {
      const m = M[p.person.name], sl = G.isSleeping(p);
      m.n++; m.moodSum += p.state.mood;
      if (sl) { m.sleepMin += stepMin; m.run = 0; } else { m.awakeMin += stepMin; m.run += stepMin; if (m.run > m.maxRun) m.maxRun = m.run; }
      if (G.maxNeed(p) > 0.8) m.urgentMin += stepMin;
      if (['infant', 'toddler'].includes(G.stage(p)) && !sl) {
        babyMin += stepMin;
        if (G.maxNeed(p) > 0.8) babyUrgent += stepMin;
        const l = CY.world.locationOf(p);
        const near = G.people.some(q => q !== p && G.isHuman(q) && !G.isSleeping(q) && ['teen', 'adult', 'elder'].includes(G.stage(q)) && (() => { const k = CY.world.locationOf(q); return k.place === l.place && k.room === l.room; })());
        if (!near) babyUnattended += stepMin;
      }
    }
  }
  const out = { kind, days, seed, people: {}, baby: { awake_h: babyMin / 60, urgent_h: babyUrgent / 60, unattended_h: babyUnattended / 60 } };
  console.log(`家庭 ${kind}，${days} 天，无玩家，步长 ${stepMin} 游戏分钟`);
  for (const n of names) {
    const m = M[n], p = G.people.find(q => q.person.name === n);
    out.people[n] = { sleep_h_per_day: m.sleepMin / 60 / days, max_awake_h: m.maxRun / 60, urgent_h_per_day: m.urgentMin / 60 / days, mood: m.moodSum / m.n, frailty_delta: p.state.frailty - f0[n] };
    const o = out.people[n];
    console.log(`- ${n}：每天睡 ${o.sleep_h_per_day.toFixed(1)} 小时，最长连续清醒 ${o.max_awake_h.toFixed(1)} 小时，每天需求压到八成以上 ${o.urgent_h_per_day.toFixed(1)} 小时，平均心情 ${o.mood.toFixed(2)}，虚弱度变化 ${o.frailty_delta.toFixed(3)}`);
  }
  console.log(`- 宝宝醒着 ${out.baby.awake_h.toFixed(1)} 小时，其中需求压到八成以上 ${out.baby.urgent_h.toFixed(1)} 小时，身边没有清醒大人 ${out.baby.unattended_h.toFixed(1)} 小时`);
  let careN = 0; for (const p of G.people) for (const m of Object.values(G.journal[p.id] || {})) for (const e of m) if (e.type === 'care') careN++;
  out.requests = G.agentState.seq; out.care_events = careN; out.dispatch = G.dispatch.stat;
  for (const n of names) { const p = G.people.find(q => q.person.name === n); out.people[n].wakes_per_night = ((G.dispatch.stat.wakeBy || {})[p.id] || 0) / days; }
  console.log('- 被叫醒次数每天：' + names.map(n => n + ' ' + out.people[n].wakes_per_night.toFixed(1)).join('，') + `；做饭 ${G.dispatch.stat.meals || 0} 顿，换班 ${G.dispatch.stat.handoffs || 0} 次，睡着没听见 ${G.dispatch.stat.unheard || 0} 步`);
  console.log(`- 后台发出的请求 ${out.requests} 个，家人之间的照顾记录 ${careN} 条`);
  if (process.env.CARE_SIM_JSON) console.log('JSON ' + JSON.stringify(out));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
