/* 仿真评估：一家人在虚拟时钟里过几天，玩家按一个简单的注意力策略去照顾，输出这家人的状态指标。
   用法：node tests/sim_eval.js [天数=3] [玩家每多少秒看一眼=90] [家庭=family|solo|zoo]
   看什么：急需占比（需求超过八成的人的时间占比），婴儿哭闹时长，每小时被打扰次数，大人帮忙次数，换房间的次数，住院次数。
   环境变量：
     CARE_BACKEND_URL  设了就把后端换成这个地址的远程后端（设置 backend_provider=http），并统计每次请求的耗时和字节数
     CARE_SEED         随机种子，同一个种子下不同后端的对比才公平
     CARE_SPEED        时间倍速，real 或 1、6、24、60，默认 real
     CARE_SIM_JSON     设为 1 时最后多输出一行 JSON 汇总，给 backend_compare.py 读 */
const { ctx, CY, G } = require('./harness');
const days = +process.argv[2] || 3, look = +process.argv[3] || 90, kind = process.argv[4] || 'family', leadName = process.argv[5] || '';

const URL = process.env.CARE_BACKEND_URL || '';
if (process.env.CARE_SEED) { let a = (+process.env.CARE_SEED) >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const net = { calls: 0, bytesOut: 0, bytesIn: 0, ms: [], byKind: {} };
const sleep0 = () => new Promise(r => setImmediate(r));

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
  if (URL) {
    G.cfg.play.backend_provider = 'http'; G.cfg.play.backend_url = URL; G.cfg.play.backend_timeout = '8000';
    ctx.fetch = async (url, opt) => {
      const t0 = process.hrtime.bigint(), kind = JSON.parse(opt.body).kind;
      const r = await fetch(url, opt), txt = await r.text();
      net.calls++; net.bytesOut += Buffer.byteLength(opt.body); net.bytesIn += Buffer.byteLength(txt); net.ms.push(Number(process.hrtime.bigint() - t0) / 1e6);
      net.byKind[kind] = (net.byKind[kind] || 0) + 1;
      return { ok: r.ok, status: r.status, json: async () => JSON.parse(txt) };
    };
  } else G.cfg.play.backend_provider = 'builtin';
  if (leadName) { const L = G.people.find(p => p.person.name === leadName); if (L) G.setProtagonist(L.id); }
  CY.world.enforce = false;

  /* 虚拟时钟：Date 被换成可控的，从早上八点开始 */
  let fake = Date.UTC(2026, 9, 28, 0, 0, 0) + 8 * 3600e3;
  const Real = Date;
  ctx.Date = class extends Real { static now() { return fake; } constructor(...a) { if (a.length) super(...a); else super(fake); } };
  /* 倍速：默认 1，保持以前的对比基线；CARE_SPEED 设成别的倍数，昼夜改用游戏时钟，days 仍是现实里的天数 */
  G.cfg.time.speed = process.env.CARE_SPEED || 'real';
  G.cfg.time.daynight = G.isRealTime() ? 'system' : 'game';
  if (!G.isRealTime()) G.alignClock();
  G.lastTick = fake; G.nextAt = fake + 4000;

  const stat = { crowdSum: 0, crowdN: 0, ticks: 0, urgentTicks: 0, sleepSkip: 0, cryTicks: 0, awakePersonTicks: 0, reqs: 0, asks: 0, acts: 0, roomMoves: 0, hospital: 0, assists: 0, falls: 0 };
  const reqBy = {}, lastRoom = {}, seenReq = new Set(), needSum = {}, needN = {};
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
    if (URL) while (CY.backend.pending > 0) await sleep0();
    if (process.env.CARE_TRACE && i % 360 === 0) { const q = G.people.find(x => x.person.name === process.env.CARE_TRACE); if (q) console.log('TRACE', (i * 5 / 3600).toFixed(1) + 'h', G.isSleeping(q) ? 'sleep' : 'awake', 'mood', q.state.mood.toFixed(2), 'fr', q.state.frailty.toFixed(2), Object.entries(q.state.needs).map(([k, v]) => k + ' ' + v.toFixed(2)).join(' ')); }
    stat.ticks++;
    const people = G.activePeople();
    for (const p of people) {
      if (G.isSleeping(p)) continue;
      stat.awakePersonTicks++;
      const mx = G.maxNeed(p);
      (needSum[p.person.name] = needSum[p.person.name] || 0); needSum[p.person.name] += mx; needN[p.person.name] = (needN[p.person.name] || 0) + 1;
      if (mx > 0.8) stat.urgentTicks++;
      if (G.needy(p)) stat.needyTicks = (stat.needyTicks || 0) + 1;
      stat.moodSum = (stat.moodSum || 0) + p.state.mood; stat.frailSum = (stat.frailSum || 0) + p.state.frailty; stat.needMeanSum = (stat.needMeanSum || 0) + (Object.values(p.state.needs).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(p.state.needs).length));
      if (G.crying[p.id]) stat.cryTicks++;
      const r = CY.world.locationOf(p);
      const key = r.place + '/' + r.room;
      if (lastRoom[p.id] && lastRoom[p.id] !== key) stat.roomMoves++;
      lastRoom[p.id] = key;
    }
    if (i % 12 === 0) { const occ = {}; for (const p of people) if (!G.isSleeping(p) && p.person.kind !== 'plant') { const l = CY.world.locationOf(p); const k = l.place + '/' + l.room; occ[k] = (occ[k] || 0) + 1; } stat.crowdSum += Math.max(0, ...Object.values(occ)); stat.crowdN++; }
    for (const id in G.req) { const r = G.req[id]; const k = id + r.since; if (!seenReq.has(k)) { seenReq.add(k); stat.reqs++; if (r.kind === 'ask') stat.asks++; const kk = r.kind + ':' + (r.need || '') + '@' + ((G.get(id) || { person: {} }).person.name || id); reqBy[kk] = (reqBy[kk] || 0) + 1; } }
    /* 玩家：每隔 look 秒看一眼，挑最急的人做他最缓解的动作，做的时候手被占住 */
    if (fake >= busyUntil && fake - lastLook >= look * 1000) {
      lastLook = fake;
      const cands = people.filter(p => !G.flag(p, 'outing') && !G.flag(p, 'hospital')).sort((a, b) => G.urgency(b) - G.urgency(a));
      const p = cands[0];
      if (p && G.maxNeed(p) > 0.5) {
        const a = bestAction(p);
        if (a && G.perform(p.id, a.id)) { stat.acts++; busyUntil = fake + G.holdSeconds(a) * 1000; }
      }
    }
  }
  /* 不变量：数值都在范围内，没有 NaN，每个人都有位置 */
  const bad = [];
  for (const p of G.people) {
    for (const [k, v] of Object.entries(p.state.needs)) if (!(v >= 0 && v <= 1)) bad.push(p.person.name + '.' + k + '=' + v);
    if (!(p.state.mood >= 0 && p.state.mood <= 1)) bad.push(p.person.name + '.mood=' + p.state.mood);
    if (!(p.state.frailty >= 0 && p.state.frailty <= 1)) bad.push(p.person.name + '.frailty=' + p.state.frailty);
    const l = CY.world.locationOf(p); if (!l || !l.room) bad.push(p.person.name + ' 没有位置');
  }
  const hours = days * 24;
  let hosp = 0, assists = 0, falls = 0, social = 0;
  for (const p of G.people) for (const m of Object.values(G.journal[p.id] || {})) for (const e of m) { if (e.type === 'care' && /帮|分担/.test(e.text) === false) {} if (/住院|医院/.test(e.text) && e.type === 'event') hosp++; if (e.type === 'self') falls += /跌倒|摔/.test(e.text) ? 1 : 0; if (e.type === 'care' && /帮你|自己动手|帮着/.test(e.text)) assists++; if (e.type === 'event' && /聊了|玩了一会儿|摸了摸|追着玩|played with|stroked/.test(e.text)) social++; }
  const pct = x => (100 * x).toFixed(1) + '%';
  console.log(`家庭 ${kind}，${days} 天，玩家每 ${look} 秒看一眼`);
  console.log(`- 急需占比：${pct(stat.urgentTicks / Math.max(1, stat.awakePersonTicks))}，需要被叫人的占比（会叫的角色需求超过一半）：${pct((stat.needyTicks || 0) / Math.max(1, stat.awakePersonTicks))}`);
  console.log(`- 宝宝哭闹：${(stat.cryTicks * 5 / 3600).toFixed(1)} 小时`);
  console.log(`- 每小时被打扰：${(stat.reqs / hours).toFixed(1)} 次，其中问答 ${(stat.asks / hours).toFixed(1)} 次`);
  console.log(`- 玩家动作：每小时 ${(stat.acts / hours).toFixed(1)} 次`);
  console.log(`- 每人每小时换房间：${(stat.roomMoves / Math.max(1, G.people.length) / hours).toFixed(1)} 次`);
  console.log(`- 最挤的房间平均有 ${(stat.crowdSum / Math.max(1, stat.crowdN)).toFixed(1)} 个醒着的人`);
  console.log(`- 家人之间的互动：每人每小时 ${(social / Math.max(1, G.people.length) / hours).toFixed(2)} 次`);
  console.log(`- 住院记录：${hosp} 次`);
  const types = {}; for (const p of G.people) for (const m of Object.values(G.journal[p.id] || {})) for (const e of m) types[e.type] = (types[e.type] || 0) + 1;
  console.log('- 发生的事按类型：' + Object.entries(types).map(([k, v]) => k + ' ' + v).join('，'));
  if (process.env.CARE_SIM_REQS) console.log('- 打扰明细：' + Object.entries(reqBy).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => k + ' ' + v).join('，'));
  console.log('- 不变量：' + (bad.length ? '失败 ' + bad.slice(0, 6).join('，') : '通过'));
  console.log('- 各人的平均最高需求：' + Object.keys(needSum).map(n => n + ' ' + (needSum[n] / needN[n]).toFixed(2)).join('，'));
  const n = Math.max(1, stat.awakePersonTicks);
  console.log(`- 清醒时平均心情 ${(stat.moodSum / n).toFixed(3)}，平均虚弱度 ${(stat.frailSum / n).toFixed(3)}，平均需求 ${(stat.needMeanSum / n).toFixed(3)}`);
  const sorted = net.ms.slice().sort((a, b) => a - b), q = f => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(f * sorted.length))] : 0;
  if (URL) console.log(`- 远程请求 ${net.calls} 次（${Object.entries(net.byKind).map(([k, v]) => k + ' ' + v).join('，')}），往返耗时中位 ${q(0.5).toFixed(2)} ms，p95 ${q(0.95).toFixed(2)} ms，最大 ${q(1).toFixed(2)} ms，发出 ${(net.bytesOut / 1024).toFixed(0)} KB，收到 ${(net.bytesIn / 1024).toFixed(0)} KB`);
  if (process.env.CARE_SIM_JSON) console.log('JSON ' + JSON.stringify({ kind, days, look, urgent: stat.urgentTicks / Math.max(1, stat.awakePersonTicks), cry_h: stat.cryTicks * 5 / 3600, reqs_per_h: stat.reqs / hours, acts_per_h: stat.acts / hours, mood: stat.moodSum / n, frailty: stat.frailSum / n, need_mean: stat.needMeanSum / n, bad: bad.length, net: URL ? { calls: net.calls, p50: q(0.5), p95: q(0.95), max: q(1), kb_out: net.bytesOut / 1024, kb_in: net.bytesIn / 1024 } : null }));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
