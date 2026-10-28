/* 仿真评估：一家人在虚拟时钟里过几天，玩家按一个简单的注意力策略去照顾，输出这家人的状态指标。
   用法：node tests/sim_eval.js [天数=3] [玩家每多少秒看一眼=90] [家庭=family|solo|zoo]
   看什么：急需占比（需求超过八成的人的时间占比），婴儿哭闹时长，每小时被打扰次数，大人帮忙次数，换房间的次数，住院次数。 */
const { ctx, CY, G } = require('./harness');
const days = +process.argv[2] || 3, look = +process.argv[3] || 90, kind = process.argv[4] || 'family';

const FAMILIES = {
  family: [['grandpa', '爷爷', ['diabetes']], ['grandma', '奶奶', ['arthritis']], ['mom', '妈妈'], ['dad', '爸爸'], ['toddler2', '二岁'], ['baby', '宝宝'], ['daughter', '女儿'], ['cat', '团子'], ['dog', '豆豆']],
  solo: [['grandpa', '爷爷', ['nocturia']]],
  zoo: [['cat', '团子'], ['dog', '豆豆'], ['rabbit', '糯米'], ['hamster', '仓鼠'], ['flower', '小花']],
};

(async () => {
  CY.i18n.set('zh-CN');
  await G.load();
  G.cfg.interrupt.frequency = 'normal';
  for (const [arch, name, cond] of FAMILIES[kind]) await G.createPerson({ arch, name, conditions: cond });
  await G.load();
  G.world.intro_done = true;
  CY.world.enforce = false;

  /* 虚拟时钟：Date 被换成可控的，从早上八点开始 */
  let fake = Date.UTC(2026, 9, 28, 0, 0, 0) + 8 * 3600e3;
  const Real = Date;
  ctx.Date = class extends Real { static now() { return fake; } constructor(...a) { if (a.length) super(...a); else super(fake); } };
  G.cfg.time.daynight = 'system';
  G.lastTick = fake;

  const stat = { ticks: 0, urgentTicks: 0, sleepSkip: 0, cryTicks: 0, awakePersonTicks: 0, reqs: 0, asks: 0, acts: 0, roomMoves: 0, hospital: 0, assists: 0, falls: 0 };
  const lastRoom = {}, seenReq = new Set(), needSum = {}, needN = {};
  let busyUntil = 0, lastLook = fake;

  const bestAction = p => {
    let best = null, gain = 0;
    for (const a of Object.values(G.actionsOf(p))) {
      if (a.away || a.outing) continue;
      let g = 0; for (const k in a.effect || {}) if (a.effect[k] < 0) g += (p.state.needs[k] || 0) * -a.effect[k];
      if (g > gain) { gain = g; best = a; }
    }
    return gain > 0.15 ? best : null;
  };

  const steps = Math.round(days * 86400 / 5);
  for (let i = 0; i < steps; i++) {
    fake += 5000;
    G.tick();
    stat.ticks++;
    const people = G.activePeople();
    for (const p of people) {
      if (G.isSleeping(p)) continue;
      stat.awakePersonTicks++;
      const mx = G.maxNeed(p);
      (needSum[p.person.name] = needSum[p.person.name] || 0); needSum[p.person.name] += mx; needN[p.person.name] = (needN[p.person.name] || 0) + 1;
      if (mx > 0.8) stat.urgentTicks++;
      if (G.crying[p.id]) stat.cryTicks++;
      const r = CY.world.locationOf(p);
      const key = r.place + '/' + r.room;
      if (lastRoom[p.id] && lastRoom[p.id] !== key) stat.roomMoves++;
      lastRoom[p.id] = key;
    }
    for (const id in G.req) { const r = G.req[id]; const k = id + r.since; if (!seenReq.has(k)) { seenReq.add(k); stat.reqs++; if (r.kind === 'ask') stat.asks++; } }
    /* 玩家：每隔 look 秒看一眼，挑最急的人做他最缓解的动作，做的时候手被占住 */
    if (fake >= busyUntil && fake - lastLook >= look * 1000) {
      lastLook = fake;
      const cands = people.filter(p => !G.flag(p, 'outing') && !G.flag(p, 'hospital')).sort((a, b) => G.urgency(b) - G.urgency(a));
      const p = cands[0];
      if (p && G.urgency(p) > 0.45) {
        const a = bestAction(p);
        if (a && G.perform(p.id, a.id)) { stat.acts++; busyUntil = fake + G.holdSeconds(a) * 1000; }
      }
    }
  }
  const hours = days * 24;
  let hosp = 0, assists = 0, falls = 0, social = 0;
  for (const p of G.people) for (const m of Object.values(G.journal[p.id] || {})) for (const e of m) { if (e.type === 'care' && /帮|分担/.test(e.text) === false) {} if (/住院|医院/.test(e.text) && e.type === 'event') hosp++; if (e.type === 'self') falls += /跌倒|摔/.test(e.text) ? 1 : 0; if (e.type === 'care' && /帮你|自己动手|帮着/.test(e.text)) assists++; if (e.type === 'event' && /聊了|玩了一会儿|摸了摸|played with|stroked/.test(e.text)) social++; }
  const pct = x => (100 * x).toFixed(1) + '%';
  console.log(`家庭 ${kind}，${days} 天，玩家每 ${look} 秒看一眼`);
  console.log(`- 急需占比：${pct(stat.urgentTicks / Math.max(1, stat.awakePersonTicks))}`);
  console.log(`- 宝宝哭闹：${(stat.cryTicks * 5 / 3600).toFixed(1)} 小时`);
  console.log(`- 每小时被打扰：${(stat.reqs / hours).toFixed(1)} 次，其中问答 ${(stat.asks / hours).toFixed(1)} 次`);
  console.log(`- 玩家动作：每小时 ${(stat.acts / hours).toFixed(1)} 次`);
  console.log(`- 每人每小时换房间：${(stat.roomMoves / Math.max(1, G.people.length) / hours).toFixed(1)} 次`);
  console.log(`- 家人之间的互动：每人每小时 ${(social / Math.max(1, G.people.length) / hours).toFixed(2)} 次`);
  console.log(`- 住院记录：${hosp} 次`);
  console.log('- 各人的平均最高需求：' + Object.keys(needSum).map(n => n + ' ' + (needSum[n] / needN[n]).toFixed(2)).join('，'));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
