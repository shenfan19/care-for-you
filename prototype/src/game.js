/* 游戏逻辑，不碰界面。数据都来自 store 里的明文文件。 */
(function (CY) {
  const { ini, store } = CY;
  const G = CY.game = {
    cfg: {}, people: [], world: { game_minutes: 0 }, req: {}, toast: {}, journal: {}, sayings: {}, tpl: { species: {}, conditions: {}, voices: {}, sayLib: [], nudges: [], skills: {}, persona: null },
    listeners: [], timer: null, nextAt: 0, lastTick: Date.now(), dirty: new Set(),
  };
  /* 打扰间隔，单位是游戏分钟，所以真实时间下是真实分钟，压缩时间下会按比例变短。test 档单位是现实秒。 */
  const GAP = { often: [20, 60], normal: [60, 180], rare: [240, 600] };
  const GAP_TEST = [15, 40];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const monthKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const DEFAULT_VOICE = { cat: 'cat', dog: 'dog', snake: 'snake' };

  G.on = fn => G.listeners.push(fn);
  const emit = () => G.listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  G.emit = emit;

  /* ---------- 载入 ---------- */
  G.load = async function () {
    if (!(await store.list()).includes('settings.ini')) {
      const seed = CY.seed.files();
      for (const p in seed) await store.write(p, seed[p]);
    }
    G.cfg = ini.parse((await store.read('settings.ini')) || '');
    G.world = Object.assign({ game_minutes: 0, last_seen: '' }, await store.readYaml('world.yaml'));
    const files = await store.list();
    G.tpl = { species: {}, conditions: {}, voices: {}, sayLib: [], nudges: [], skills: {}, persona: null };
    for (const p of files) {
      const m = p.match(/^templates\/(species|conditions|voices)\/([^/]+)\.yaml$/);
      if (m) { const t = await store.readYaml(p); if (t) G.tpl[m[1]][t.id || m[2]] = t; }
      const sk = p.match(/^templates\/ai\/skills\/([^/]+)\.yaml$/);
      if (sk) { const t = await store.readYaml(p); if (t) G.tpl.skills[t.id || sk[1]] = t; }
    }
    G.tpl.sayLib = ((await store.readYaml('templates/library/sayings.yaml')) || {}).items || [];
    G.tpl.nudges = ((await store.readYaml('templates/library/nudges.yaml')) || {}).items || [];
    G.tpl.persona = await store.readYaml('templates/ai/persona.yaml');
    G.people = []; G.journal = {}; G.sayings = {};
    const ids = [...new Set(files.map(p => (p.match(/^people\/([^/]+)\//) || [])[1]).filter(Boolean))].sort();
    for (const id of ids) {
      const person = await store.readYaml(`people/${id}/person.yaml`);
      if (!person) continue;
      person.id = id;
      const species = G.tpl.species[person.species];
      if (!species) { console.warn('找不到物种模板', person.species); continue; }
      const state = Object.assign({ version: 1, needs: {}, mood: 0.6, frailty: 0.1, last_seen: '' }, await store.readYaml(`people/${id}/state.yaml`));
      state.learn = Object.assign({ needy: (person.personality && person.personality.talkative) || 0.5, resp: 0, n_resp: 0, kinds: {} }, state.learn);
      const story = Object.assign({ version: 1, care_total: 0, cares_back_total: 0, revealed: false, nudge_done: 0 }, await store.readYaml(`people/${id}/story.yaml`));
      const voiceId = person.voice || DEFAULT_VOICE[person.species] || 'sibling';
      const p = { id, person, species, state, story, voice: G.tpl.voices[voiceId] || {} };
      for (const k of Object.keys(G.needsOf(p))) if (typeof state.needs[k] !== 'number') state.needs[k] = 0.1 + Math.random() * 0.2;
      G.people.push(p);
      const sy = await store.readYaml(`people/${id}/sayings.yaml`);
      G.sayings[id] = (sy && sy.items) || [];
      G.journal[id] = {};
      for (const f of files.filter(f => f.startsWith(`people/${id}/journal/`))) {
        const j = await store.readYaml(f);
        G.journal[id][f.split('/').pop().replace('.yaml', '')] = (j && j.entries) || [];
      }
    }
    G.req = {}; G.toast = {};
  };

  /* ---------- 创建与停用角色 ---------- */
  G.createPerson = async function (spec) {
    const arch = CY.content.archOf(spec.arch) || {};
    const id = 'c' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
    const species = spec.species || arch.species || 'human';
    const person = {
      version: 1, id, active: true, name: spec.name || arch.role || '朋友', role: spec.role || arch.role || '',
      archetype: spec.arch || '', voice: spec.voice || arch.voice || DEFAULT_VOICE[species] || 'sibling', pronoun: spec.pronoun || arch.pronoun || (species === 'human' ? '他' : '它'),
      kind: species === 'human' ? 'human' : 'animal', species, age_stage: spec.age_stage || arch.age_stage || 'adult',
      appearance: spec.look || arch.look || {}, personality: { talkative: 0.5, temper: '', catchphrases: [] },
      conditions: spec.conditions || [], lines: {},
    };
    await store.writeYaml(`people/${id}/person.yaml`, person);
    return id;
  };
  G.setActive = async function (pid, on) {
    const p = G.get(pid); if (!p) return;
    p.person.active = on;
    await store.writeYaml(`people/${pid}/person.yaml`, p.person);
    emit();
  };

  /* ---------- 查询 ---------- */
  G.activePeople = () => G.people.filter(p => p.person.active !== false);
  G.get = id => G.people.find(p => p.id === id);
  G.stage = p => p.person.age_stage || 'adult';
  G.needsOf = p => {
    const out = {};
    const add = (defs) => { for (const k in defs || {}) { const d = defs[k]; if (!d.stages || d.stages.includes(G.stage(p))) out[k] = d; } };
    add(p.species.needs);
    for (const c of p.person.conditions || []) add((G.tpl.conditions[c] || {}).needs);
    return out;
  };
  G.actionsOf = p => {
    const out = {};
    const add = (defs) => {
      for (const k in defs || {}) {
        const d = defs[k];
        if (d.stages && !d.stages.includes(G.stage(p))) continue;
        const lab = typeof d.label === 'object' ? (d.label[G.stage(p)] || d.label.default) : d.label;
        out[k] = Object.assign({}, d, { label: lab, id: k });
      }
    };
    add(p.species.actions);
    for (const c of p.person.conditions || []) add((G.tpl.conditions[c] || {}).actions);
    return out;
  };
  G.maxNeed = p => Math.max(0, ...Object.values(p.state.needs));
  G.topNeed = p => { const d = G.needsOf(p); return Object.keys(d).sort((a, b) => p.state.needs[b] - p.state.needs[a])[0]; };
  G.holdSeconds = a => a.hold * ini.num(G.cfg, 'interaction', 'hold_scale');
  G.fmt = (s, p) => String(s).replace(/\{title\}/g, ini.get(G.cfg, 'player', 'title')).replace(/\{name\}/g, p ? p.person.name : ini.get(G.cfg, 'player', 'name'))
    .replace(/\{ta\}/g, p ? (p.person.pronoun || (p.species.id === 'human' ? '他' : '它')) : '他');
  G.clock = () => {
    const m = Math.floor(G.world.game_minutes) + 8 * 60;
    return { day: Math.floor(m / 1440) + 1, hh: String(Math.floor((m % 1440) / 60)).padStart(2, '0'), mm: String(m % 60).padStart(2, '0') };
  };
  /* 台词来源：角色自己写的优先，其次声线模板。 */
  G.lines = (p, group, key) => {
    const mine = (p.person.lines || {})[group], base = p.voice[group];
    const pickFrom = src => (key === undefined || key === null) ? src : (src && !Array.isArray(src) && typeof src === 'object' ? src[key] : undefined);
    const a = pickFrom(mine), b = pickFrom(base);
    if (Array.isArray(a) && a.length) return a;
    if (typeof a === 'string') return [a];
    if (Array.isArray(b) && b.length) return b;
    if (typeof b === 'string') return [b];
    return [];
  };
  const line = (p, group, key, fallback) => {
    const arr = G.lines(p, group, key);
    return G.fmt(pick(arr.length ? arr : [fallback]), p);
  };
  G.speechPool = p => ((p.person.personality && p.person.personality.catchphrases) || []).concat((G.sayings[p.id] || []).filter(s => s.by === 'char' && s.lib).map(s => s.text));

  /* ---------- 写文件 ---------- */
  let saveTimer = null;
  G.save = function (now) {
    clearTimeout(saveTimer);
    const run = () => {
      G.world.last_seen = new Date().toISOString();
      store.writeYaml('world.yaml', G.world);
      for (const p of G.people) {
        p.state.last_seen = G.world.last_seen;
        store.writeYaml(`people/${p.id}/state.yaml`, p.state);
        store.writeYaml(`people/${p.id}/story.yaml`, p.story);
      }
      for (const k of G.dirty) {
        const [kind, id, mk] = k.split('|');
        if (kind === 'j') store.writeYaml(`people/${id}/journal/${mk}.yaml`, { version: 1, entries: G.journal[id][mk] });
        else store.writeYaml(`people/${id}/sayings.yaml`, { version: 1, items: G.sayings[id] });
      }
      G.dirty.clear();
    };
    if (now) run(); else saveTimer = setTimeout(run, 400);
  };
  G.log = function (pid, type, text) {
    const d = new Date(), mk = monthKey(d);
    const arr = ((G.journal[pid] = G.journal[pid] || {})[mk] = G.journal[pid][mk] || []);
    arr.push({ t: d.toISOString(), day: G.clock().day, type, text });
    G.dirty.add(`j|${pid}|${mk}`);
    G.save();
  };
  /* lib 是说话库里的编号，没有就不记。正文总是一起记下来。 */
  G.say = function (pid, by, text, lib) {
    const item = { t: new Date().toISOString(), by, text };
    if (lib) item.lib = lib;
    (G.sayings[pid] = G.sayings[pid] || []).push(item);
    G.dirty.add(`s|${pid}`);
  };

  /* ---------- 学习每个角色的节奏 ---------- */
  const learnOn = () => ini.bool(G.cfg, 'interaction', 'learn');
  function learn(p, kind, responded, latency) {
    if (!learnOn()) return;
    const L = p.state.learn, K = (L.kinds[kind] = L.kinds[kind] || { y: 0, n: 0 });
    if (responded) {
      K.y++; L.n_resp++;
      L.resp = L.n_resp === 1 ? latency : L.resp * 0.8 + latency * 0.2;
      L.needy = clamp(L.needy + (latency < 10 ? 0.03 : 0.01), 0.1, 0.95);
    } else {
      K.n++;
      L.needy = clamp(L.needy - 0.03, 0.1, 0.95);
    }
  }
  const kindWeight = (p, kind, base) => {
    const K = p.state.learn.kinds[kind];
    if (!K || !learnOn()) return base;
    return base * clamp(1 + 0.15 * (K.y - K.n), 0.3, 2.5);
  };
  const weighted = (items, w) => {
    const ws = items.map(w), sum = ws.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };
  const needyW = p => (learnOn() ? 0.4 + p.state.learn.needy : 1);

  /* ---------- 时间 ---------- */
  function gameMinutes(realSeconds) {
    const mode = ini.get(G.cfg, 'time', 'mode');
    if (mode === 'paused') return 0;
    if (mode === 'real') return realSeconds / 60;
    return realSeconds / 60 * ini.num(G.cfg, 'time', 'compress_ratio');
  }
  /* 一个游戏分钟对应多少现实秒 */
  G.secPerGameMin = () => {
    const mode = ini.get(G.cfg, 'time', 'mode');
    if (mode === 'paused') return Infinity;
    return mode === 'real' ? 60 : 60 / ini.num(G.cfg, 'time', 'compress_ratio');
  };
  function advance(gmin, offline) {
    if (gmin <= 0) return;
    const hours = gmin / 60;
    const boost = ini.get(G.cfg, 'interrupt', 'frequency') === 'test' && !offline ? 30 : 1;
    G.world.game_minutes += gmin;
    for (const p of G.activePeople()) {
      const defs = G.needsOf(p), s = p.state;
      for (const k in defs) s.needs[k] = clamp((s.needs[k] || 0) + defs[k].rate * hours * boost, 0, offline ? 0.7 : 1);
      const target = 1 - 0.7 * G.maxNeed(p);
      s.mood = clamp(s.mood + (target - s.mood) * Math.min(1, hours * 0.5));
      if (!offline) {
        const was = s.frailty;
        if (G.maxNeed(p) > 0.9) s.frailty = clamp(s.frailty + 0.02 * hours * boost);
        else if (G.maxNeed(p) < 0.4) s.frailty = clamp(s.frailty - 0.01 * hours);
        if (was < 0.7 && s.frailty >= 0.7) { G.log(p.id, 'frail', `${p.person.name}很虚弱了，需要有人陪着`); G.toastFor(p, G.fmt('{ta}今天特别没力气。', p), 'soft'); }
        if (was >= 0.5 && s.frailty < 0.5) G.log(p.id, 'recovered', `${p.person.name}慢慢缓过来了`);
      }
    }
  }

  /* ---------- 打断 ---------- */
  G.inQuiet = () => {
    const q = ini.get(G.cfg, 'interrupt', 'quiet_hours');
    const m = q.match(/^(\d\d):(\d\d)-(\d\d):(\d\d)$/);
    if (!m) return false;
    const d = new Date(), cur = d.getHours() * 60 + d.getMinutes();
    const a = +m[1] * 60 + +m[2], b = +m[3] * 60 + +m[4];
    return a <= b ? cur >= a && cur < b : cur >= a || cur < b;
  };
  G.nextGapSeconds = () => {
    const f = ini.get(G.cfg, 'interrupt', 'frequency');
    if (f === 'test') return GAP_TEST[0] + Math.random() * (GAP_TEST[1] - GAP_TEST[0]);
    const [lo, hi] = GAP[f] || GAP.normal;
    return (lo + Math.random() * (hi - lo)) * G.secPerGameMin();
  };
  function scheduleNext() {
    const s = G.nextGapSeconds();
    G.nextAt = isFinite(s) ? Date.now() + s * 1000 : Date.now() + 5000;
  }
  G.toastFor = (p, text, kind) => { G.toast[p.id] = { text, kind: kind || 'soft', until: Date.now() + (kind === 'reveal' ? 16000 : 9000) }; };

  /* AI 可用时替换一句台词；任何失败都回退成库里的句子 */
  function speakWithAI(p, situation, fallback, kind) {
    const full = { persona: { name: p.person.name, role: p.person.role, voice: p.person.voice, temper: (p.person.personality || {}).temper, catchphrases: (p.person.personality || {}).catchphrases },
      state: { mood: +p.state.mood.toFixed(2), frailty: +p.state.frailty.toFixed(2), top_need: G.topNeed(p) }, situation };
    G.toastFor(p, fallback, kind);
    if (!CY.ai || !CY.ai.enabled(G.cfg)) return;
    CY.ai.run('speak', full, G.tpl).then(r => {
      if (!r) return;
      const cur = G.toast[p.id];
      if (cur && cur.text === fallback) { G.toastFor(p, r.text, kind); G.say(p.id, 'char', r.text); emit(); }
    });
  }

  const mkReq = (o) => {
    const countdown = ini.get(G.cfg, 'interrupt', 'mode') !== 'keep';
    return Object.assign({ since: Date.now(), deadline: countdown ? Date.now() + ini.num(G.cfg, 'interrupt', 'countdown_seconds') * 1000 : 0 }, o);
  };

  /* 候选的“说过的话”：同声线、还没选过的 */
  G.pickOptions = (p, n = 3) => {
    const taken = new Set((G.sayings[p.id] || []).map(s => s.lib).filter(Boolean));
    const v = p.person.voice || DEFAULT_VOICE[p.person.species] || 'sibling';
    const pool = G.tpl.sayLib.filter(x => x.voice === v && !taken.has(x.id));
    const out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return out;
  };

  function fire() {
    if (G.inQuiet()) return;
    const free = G.activePeople().filter(p => !G.req[p.id]);
    if (!free.length) return;
    const needy = free.filter(p => G.maxNeed(p) > 0.55);
    if (needy.length && Math.random() < 0.65) {
      const p = weighted(needy, needyW), defs = G.needsOf(p), need = G.topNeed(p);
      const text = line(p, 'request', need, `${p.person.name}需要${defs[need].label}`);
      G.req[p.id] = mkReq({ pid: p.id, kind: 'need', need, text });
      G.say(p.id, 'char', text);
      return;
    }
    const p = weighted(free, needyW);
    const s = p.story;
    const pCB = s.care_total >= 3 ? Math.min(0.3, 0.05 + 0.01 * s.care_total) : 0;
    if (!s.revealed && s.cares_back_total >= 3 && s.care_total >= 12) {
      s.revealed = true;
      const t = line(p, 'reveal', null, G.fmt('{ta}一直在看着你。', p));
      G.toastFor(p, t, 'reveal'); G.say(p.id, 'char', t); G.log(p.id, 'reveal', t);
      return;
    }
    if (Math.random() < pCB) {
      const t = line(p, 'cares_back', null, `${p.person.name}看了你一眼。`);
      s.cares_back_total++;
      G.toastFor(p, t, 'gift'); G.log(p.id, 'cares_back', t);
      return;
    }
    const cond = (p.person.conditions || []).map(c => G.tpl.conditions[c]).find(c => c && c.events && c.events.dinner);
    const asks = G.lines(p, 'ask');
    const picks = ini.bool(G.cfg, 'interaction', 'picks') ? G.pickOptions(p) : [];
    const nudgeOk = ini.bool(G.cfg, 'interaction', 'nudges') && p.person.kind === 'human' && G.tpl.nudges.length;
    const kinds = [
      ['choice', cond ? 0.15 : 0], ['ask', asks.length ? 0.25 : 0], ['pick', picks.length ? 0.2 : 0], ['nudge', nudgeOk ? 0.07 : 0],
      ['glance', 0.2], ['speech', 0.15],
    ].map(([k, w]) => [k, kindWeight(p, k, w)]).filter(x => x[1] > 0);
    const kind = weighted(kinds, x => x[1])[0];

    if (kind === 'choice') {
      const ev = cond.events.dinner;
      G.req[p.id] = mkReq({ pid: p.id, kind: 'choice', text: G.fmt(ev.say, p), choices: ev.choices });
      G.say(p.id, 'char', G.fmt(ev.say, p));
    } else if (kind === 'ask') {
      const q = pick(asks);
      G.req[p.id] = mkReq({ pid: p.id, kind: 'ask', text: G.fmt(q.say, p), prompt: G.fmt(q.prompt || '你怎么回答：', p) });
      G.say(p.id, 'char', G.fmt(q.say, p));
    } else if (kind === 'pick') {
      const human = p.person.kind === 'human';
      G.req[p.id] = mkReq({ pid: p.id, kind: 'pick', text: human ? `你想想，${p.person.name}平时会对你说哪句话？` : `你想想，${p.person.name}平时是怎么表示的？`, options: picks, deadline: 0 });
    } else if (kind === 'nudge') {
      const n = pick(G.tpl.nudges);
      G.req[p.id] = mkReq({ pid: p.id, kind: 'nudge', nudge: n.id, text: p.person.kind === 'human' ? `${p.person.name}看着你：${n.text}` : `${p.person.name}盯着你，你忽然想起：${n.text}` });
    } else if (kind === 'glance') {
      const t = line(p, 'glance', null, `${p.person.name}看了你一眼。`);
      speakWithAI(p, '角色安静地看了你一眼，没有要求什么', t, 'soft'); G.log(p.id, 'glance', t);
    } else {
      const pool = G.speechPool(p);
      const c = G.fmt(pick(pool.length ? pool : ['……']), p);
      speakWithAI(p, '角色随口说了一句', c, 'speech'); G.say(p.id, 'char', c);
    }
  }
  G.fire = fire;

  function expire(req) {
    const p = G.get(req.pid), mode = ini.get(G.cfg, 'interrupt', 'mode');
    delete G.req[req.pid];
    learn(p, req.kind, false);
    if (req.kind === 'pick' || req.kind === 'nudge') return;
    if (mode === 'countdown_dismiss') { G.log(p.id, 'missed', `${p.person.name}叫了你一声，后来没事了`); G.toastFor(p, '没事了。', 'soft'); return; }
    if (req.kind === 'need') {
      p.state.needs[req.need] = clamp(p.state.needs[req.need] - 0.3);
      G.log(p.id, 'missed', `你没赶上，${p.person.name}自己处理了：${req.text}`);
      G.toastFor(p, '我自己来吧。', 'soft');
    } else if (req.kind === 'choice') {
      const c = req.choices.find(x => x.liked) || req.choices[0];
      applyChoice(p, c, true);
    } else {
      G.log(p.id, 'missed', `你没回应：${req.text}`);
      G.toastFor(p, '……没事。', 'soft');
    }
  }

  /* ---------- 玩家动作 ---------- */
  G.perform = function (pid, actionId) {
    const p = G.get(pid), a = G.actionsOf(p)[actionId];
    if (!a) return;
    const s = p.state;
    for (const k in a.effect || {}) if (k in s.needs) s.needs[k] = clamp(s.needs[k] + a.effect[k]);
    s.mood = clamp(s.mood + (a.mood === undefined ? 0.08 : a.mood));
    if (a.frailty) s.frailty = clamp(s.frailty + a.frailty);
    p.story.care_total++;
    const req = G.req[pid];
    if (req && req.kind === 'need') {
      if (s.needs[req.need] < 0.4) { delete G.req[pid]; learn(p, 'need', true, (Date.now() - req.since) / 1000); }
    }
    const t = line(p, 'thanks', actionId, line(p, 'thanks', 'default', '嗯。'));
    G.toastFor(p, t, 'speech'); G.say(pid, 'char', t);
    G.log(pid, 'care', `${a.label}。${t}`);
    G.save(); emit();
  };
  G.answer = function (pid, text) {
    const p = G.get(pid), req = G.req[pid];
    if (!req || req.kind !== 'ask') return;
    delete G.req[pid];
    if (text && text.trim()) {
      G.say(pid, 'you', text.trim());
      G.log(pid, 'talk', `${req.text} 你说：${text.trim()}`);
      p.story.care_total++; p.state.mood = clamp(p.state.mood + 0.1);
      G.toastFor(p, line(p, 'thanks', 'default', '嗯。'), 'speech');
      learn(p, 'ask', true, (Date.now() - req.since) / 1000);
    } else {
      G.log(p.id, 'missed', `你没回应：${req.text}`);
      G.toastFor(p, '……没事。', 'soft');
      learn(p, 'ask', false);
    }
    G.save(); emit();
  };
  function applyChoice(p, c, auto) {
    p.state.mood = clamp(p.state.mood + (c.mood || 0));
    p.state.frailty = clamp(p.state.frailty + (c.frailty || 0));
    const reply = G.fmt(c.reply, p);
    G.toastFor(p, reply, 'speech'); G.say(p.id, 'char', reply);
    G.log(p.id, 'event', (auto ? `你没来得及选，${p.person.name}自己定了：` : `晚饭选了${c.label}：`) + reply);
    if (!auto) p.story.care_total++;
  }
  G.choose = function (pid, i) {
    const req = G.req[pid];
    if (!req || req.kind !== 'choice') return;
    delete G.req[pid];
    const p = G.get(pid);
    learn(p, 'choice', true, (Date.now() - req.since) / 1000);
    applyChoice(p, req.choices[i], false);
    G.save(); emit();
  };
  /* 玩家从候选里选了一句：库编号和原文一起记下来，之后角色也会偶尔说这句 */
  G.pickSaying = function (pid, i) {
    const req = G.req[pid];
    if (!req || req.kind !== 'pick') return;
    const p = G.get(pid), o = req.options[i];
    delete G.req[pid];
    const text = G.fmt(o.text, p);
    G.say(pid, 'char', text, o.id);
    G.log(pid, 'picked', `你记起${p.person.name}会说：${text}`);
    G.toastFor(p, text, 'speech');
    learn(p, 'pick', true, (Date.now() - req.since) / 1000);
    G.save(); emit();
  };
  G.rerollPick = function (pid) {
    const req = G.req[pid];
    if (!req || req.kind !== 'pick') return;
    const opts = G.pickOptions(G.get(pid));
    if (opts.length) req.options = opts;
    emit();
  };
  G.answerNudge = function (pid, yes) {
    const req = G.req[pid];
    if (!req || req.kind !== 'nudge') return;
    const p = G.get(pid);
    delete G.req[pid];
    if (yes) {
      p.story.nudge_done++;
      G.log(pid, 'nudge', `${p.person.name}提醒你：${(G.tpl.nudges.find(n => n.id === req.nudge) || {}).text || ''} 你说好，去了。`);
      G.toastFor(p, G.fmt('去吧，我在这儿。', p), 'soft');
    } else G.toastFor(p, '好，晚点也行。', 'soft');
    learn(p, 'nudge', !!yes, (Date.now() - req.since) / 1000);
    G.save(); emit();
  };
  G.dismiss = function (pid) {
    const r = G.req[pid]; if (!r) return;
    delete G.req[pid];
    learn(G.get(pid), r.kind, false);
    if (r.kind !== 'pick' && r.kind !== 'nudge') G.log(pid, 'missed', `你先放下了：${r.text}`);
    emit();
  };

  /* ---------- 心跳 ---------- */
  G.tick = function () {
    const now = Date.now(), dt = Math.min((now - G.lastTick) / 1000, 5);
    G.lastTick = now;
    advance(gameMinutes(dt), false);
    for (const id in G.req) if (G.req[id].deadline && now > G.req[id].deadline) expire(G.req[id]);
    for (const id in G.toast) if (now > G.toast[id].until) delete G.toast[id];
    if (now >= G.nextAt) { if (G.activePeople().length) fire(); scheduleNext(); }
    emit();
  };
  G.start = function () {
    const last = Date.parse(G.world.last_seen);
    if (last) {
      const cap = ini.num(G.cfg, 'time', 'offline_cap_hours') * 60;
      advance(Math.min(cap, gameMinutes((Date.now() - last) / 1000)), true);
    }
    G.lastTick = Date.now();
    scheduleNext();
    G.nextAt = Date.now() + 4000;
    clearInterval(G.timer);
    G.timer = setInterval(G.tick, 1000);
    clearInterval(G.saveIv);
    G.saveIv = setInterval(() => G.save(true), 15000);
  };
  G.stop = function () { clearInterval(G.timer); };
})(globalThis.CY = globalThis.CY || {});
