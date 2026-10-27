/* 游戏逻辑，不碰界面。数据都来自 store 里的明文文件。文字都通过 CY.t 取，所以换语言不用改这里。 */
(function (CY) {
  const { ini, store } = CY;
  const t = (k, v) => CY.t(k, v);
  const G = CY.game = {
    cfg: {}, people: [], world: { game_minutes: 0 }, req: {}, toast: {}, fx: {}, journal: {}, sayings: {},
    tpl: { species: {}, conditions: {}, voices: {}, sayLib: [], nudges: [], asks: [], skills: {}, persona: null },
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
    /* 新版本新增的模板文件，旧数据里没有的就补上 */
    const seed = CY.seed.files();
    for (const p in seed) if (/^templates\//.test(p) && !files.includes(p)) { await store.write(p, seed[p]); files.push(p); }
    G.tpl = { species: {}, conditions: {}, voices: {}, sayLib: [], nudges: [], asks: [], skills: {}, persona: null };
    for (const p of files) {
      const m = p.match(/^templates\/(species|conditions|voices)\/([^/]+)\.yaml$/);
      if (m) { const x = await store.readYaml(p); if (x) G.tpl[m[1]][x.id || m[2]] = x; }
      const sk = p.match(/^templates\/ai\/skills\/([^/]+)\.yaml$/);
      if (sk) { const x = await store.readYaml(p); if (x) G.tpl.skills[x.id || sk[1]] = x; }
    }
    G.tpl.sayLib = ((await store.readYaml('templates/library/sayings.yaml')) || {}).items || [];
    G.tpl.nudges = ((await store.readYaml('templates/library/nudges.yaml')) || {}).items || [];
    G.tpl.asks = ((await store.readYaml('templates/library/asks.yaml')) || {}).items || [];
    G.tpl.persona = await store.readYaml('templates/ai/persona.yaml');
    G.people = []; G.journal = {}; G.sayings = {};
    const ids = [...new Set(files.map(p => (p.match(/^people\/([^/]+)\//) || [])[1]).filter(Boolean))].sort();
    for (const id of ids) {
      const person = await store.readYaml(`people/${id}/person.yaml`);
      if (!person) continue;
      person.id = id;
      const species = G.tpl.species[person.species];
      if (!species) { console.warn('找不到物种模板', person.species); continue; }
      const state = Object.assign({ version: 1, needs: {}, mood: 0.6, frailty: 0.1, last_seen: '', asked: [] }, await store.readYaml(`people/${id}/state.yaml`));
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
    G.req = {}; G.toast = {}; G.fx = {};
  };

  /* ---------- 创建与停用角色 ---------- */
  G.createPerson = async function (spec) {
    const arch = CY.content.archOf(spec.arch) || {};
    const id = 'c' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
    const species = spec.species || arch.species || 'human';
    const person = {
      version: 1, id, active: true, name: spec.name || spec.roleText || arch.role || '', role: spec.roleText || arch.role || '',
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
  G.pronoun = p => (p ? (p.person.pronoun || (p.species.id === 'human' ? '他' : '它')) : '他');
  G.needsOf = p => {
    const out = {};
    const add = (defs) => { for (const k in defs || {}) { const d = defs[k]; if (!d.stages || d.stages.includes(G.stage(p))) out[k] = d; } };
    add(p.species.needs);
    for (const c of p.person.conditions || []) add((G.tpl.conditions[c] || {}).needs);
    return out;
  };
  /* 需求和动作的显示名：当前语言包有就用，没有就用模板里的写法 */
  G.needLabel = (k, d) => CY.tOr('need.' + k, d.label);
  G.actionsOf = p => {
    const out = {};
    const add = (defs) => {
      for (const k in defs || {}) {
        const d = defs[k];
        if (d.stages && !d.stages.includes(G.stage(p))) continue;
        const own = typeof d.label === 'object' ? (d.label[G.stage(p)] || d.label.default) : d.label;
        const lab = CY.tOr('act.' + k + '.' + G.stage(p), CY.tOr('act.' + k, own));
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
    .replace(/\{ta\}/g, G.pronoun(p));

  /* ---------- 时间显示：经历了多少时间，以及现在是几点 ---------- */
  G.daySource = () => {
    const s = ini.get(G.cfg, 'time', 'daynight');
    if (s === 'system' || s === 'game') return s;
    return ini.get(G.cfg, 'time', 'mode') === 'compressed' ? 'game' : 'system';
  };
  /* 当天已过的分钟数，0 到 1439 */
  G.dayMinutes = () => {
    if (G.daySource() === 'system') { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
    return (Math.floor(G.world.game_minutes) + 8 * 60) % 1440;
  };
  G.isNight = () => { const h = G.dayMinutes() / 60; return h >= 22 || h < 6; };
  G.clock = () => {
    const el = Math.floor(G.world.game_minutes), dm = G.dayMinutes(), now = new Date(), pad = n => String(n).padStart(2, '0');
    return {
      d: Math.floor(el / 1440), h: Math.floor((el % 1440) / 60), m: el % 60,
      hh: pad(Math.floor(dm / 60)), mm: pad(dm % 60), src: G.daySource(), night: G.isNight(), minutes: dm,
      realHh: pad(now.getHours()), realMm: pad(now.getMinutes()),
    };
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
      G.world.schema = CY.meta ? CY.meta.schema : 2;
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
    arr.push({ t: d.toISOString(), day: G.clock().d + 1, type, text });
    G.dirty.add(`j|${pid}|${mk}`);
    G.save();
  };
  /* lib 是库里的编号，ans 是预设回答的序号或 custom。正文总是一起记下来。 */
  G.say = function (pid, by, text, lib, ans) {
    const item = { t: new Date().toISOString(), by, text };
    if (lib) item.lib = lib;
    if (ans !== undefined) item.ans = ans;
    (G.sayings[pid] = G.sayings[pid] || []).push(item);
    G.dirty.add(`s|${pid}`);
  };
  G.playFx = (pid, act) => { G.fx[pid] = { act, t: Date.now() }; };

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

  /* ---------- 时间推进 ---------- */
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
    const night = G.isNight();
    G.world.game_minutes += gmin;
    for (const p of G.activePeople()) {
      const defs = G.needsOf(p), s = p.state;
      for (const k in defs) s.needs[k] = clamp((s.needs[k] || 0) + defs[k].rate * hours * boost * (k === 'rest' && night ? 2 : 1), 0, offline ? 0.7 : 1);
      const target = 1 - 0.7 * G.maxNeed(p);
      s.mood = clamp(s.mood + (target - s.mood) * Math.min(1, hours * 0.5));
      if (!offline) {
        const was = s.frailty;
        if (G.maxNeed(p) > 0.9) s.frailty = clamp(s.frailty + 0.02 * hours * boost);
        else if (G.maxNeed(p) < 0.4) s.frailty = clamp(s.frailty - 0.01 * hours);
        if (was < 0.7 && s.frailty >= 0.7) { G.log(p.id, 'frail', t('log.frail', { name: p.person.name })); G.toastFor(p, G.fmt(t('toast.weak'), p), 'soft'); }
        if (was >= 0.5 && s.frailty < 0.5) G.log(p.id, 'recovered', t('log.recovered', { name: p.person.name }));
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

  /* 问答库按声线、年龄阶段、称呼筛选，最近问过的不重复；角色自己 lines.ask 里写的也算 */
  G.askBank = p => {
    const v = p.person.voice || DEFAULT_VOICE[p.person.species] || 'sibling', st = G.stage(p), pr = G.pronoun(p);
    const sens = ini.bool(G.cfg, 'interaction', 'sensitive_topics');
    const recent = new Set(p.state.asked || []);
    const fits = (q, arr, val) => !arr || arr.includes(val);
    let pool = G.tpl.asks.filter(q => fits(q, q.voice, v) && fits(q, q.stage, st) && fits(q, q.pronoun, pr) && (sens || !q.sensitive));
    const mine = ((p.person.lines || {}).ask || []).filter(q => q && q.say).map((q, i) => ({ id: `own${i}`, say: q.say, answers: q.answers || [] }));
    pool = pool.concat(mine);
    const fresh = pool.filter(q => !recent.has(q.id));
    return fresh.length ? fresh : pool;
  };
  const GENERIC_ANSWERS = ['ans.generic1', 'ans.generic2', 'ans.generic3'];

  const eveningOk = () => ini.get(G.cfg, 'interrupt', 'frequency') === 'test' || (G.dayMinutes() >= 16 * 60 && G.dayMinutes() < 21 * 60);

  function fire() {
    if (G.inQuiet()) return;
    const free = G.activePeople().filter(p => !G.req[p.id]);
    if (!free.length) return;
    const needy = free.filter(p => G.maxNeed(p) > 0.55);
    if (needy.length && Math.random() < 0.65) {
      const p = weighted(needy, needyW), defs = G.needsOf(p), need = G.topNeed(p);
      const text = line(p, 'request', need, t('req.need_fallback', { name: p.person.name, need: G.needLabel(need, defs[need]) }));
      G.req[p.id] = mkReq({ pid: p.id, kind: 'need', need, text });
      G.say(p.id, 'char', text);
      return;
    }
    const p = weighted(free, needyW);
    const s = p.story;
    const pCB = s.care_total >= 3 ? Math.min(0.3, 0.05 + 0.01 * s.care_total) : 0;
    if (!s.revealed && s.cares_back_total >= 3 && s.care_total >= 12) {
      s.revealed = true;
      const tx = line(p, 'reveal', null, G.fmt(t('line.reveal_fallback'), p));
      G.toastFor(p, tx, 'reveal'); G.say(p.id, 'char', tx); G.log(p.id, 'reveal', tx);
      return;
    }
    if (Math.random() < pCB) {
      const tx = line(p, 'cares_back', null, t('line.glance_fallback', { name: p.person.name }));
      s.cares_back_total++;
      G.toastFor(p, tx, 'gift'); G.log(p.id, 'cares_back', tx);
      return;
    }
    const cond = (p.person.conditions || []).map(c => G.tpl.conditions[c]).find(c => c && c.events && c.events.dinner);
    const asks = G.askBank(p);
    const picks = ini.bool(G.cfg, 'interaction', 'picks') ? G.pickOptions(p) : [];
    const nudgeOk = ini.bool(G.cfg, 'interaction', 'nudges') && p.person.kind === 'human' && G.tpl.nudges.length;
    const kinds = [
      ['choice', cond && eveningOk() ? 0.15 : 0], ['ask', asks.length ? 0.3 : 0], ['pick', picks.length ? 0.2 : 0], ['nudge', nudgeOk ? 0.07 : 0],
      ['glance', 0.2], ['speech', 0.15],
    ].map(([k, w]) => [k, kindWeight(p, k, w)]).filter(x => x[1] > 0);
    const kind = weighted(kinds, x => x[1])[0];

    if (kind === 'choice') {
      const ev = cond.events.dinner;
      G.req[p.id] = mkReq({ pid: p.id, kind: 'choice', text: G.fmt(ev.say, p), choices: ev.choices });
      G.say(p.id, 'char', G.fmt(ev.say, p));
    } else if (kind === 'ask') {
      const q = pick(asks);
      const answers = (q.answers && q.answers.length ? q.answers : GENERIC_ANSWERS.map(k => t(k))).map(a => G.fmt(a, p));
      p.state.asked = (p.state.asked || []).concat(q.id).slice(-8);
      /* 问答题一律有倒计时，到时没答就当作没赶上 */
      G.req[p.id] = mkReq({ pid: p.id, kind: 'ask', askId: q.id, text: G.fmt(q.say, p), answers, deadline: Date.now() + ini.num(G.cfg, 'interrupt', 'answer_seconds') * 1000 });
      G.say(p.id, 'char', G.fmt(q.say, p));
    } else if (kind === 'pick') {
      G.req[p.id] = mkReq({ pid: p.id, kind: 'pick', text: t(p.person.kind === 'human' ? 'req.pick_human' : 'req.pick_animal', { name: p.person.name }), options: picks, deadline: 0 });
    } else if (kind === 'nudge') {
      const n = pick(G.tpl.nudges);
      G.req[p.id] = mkReq({ pid: p.id, kind: 'nudge', nudge: n.id, text: t(p.person.kind === 'human' ? 'req.nudge_human' : 'req.nudge_animal', { name: p.person.name, text: n.text }) });
    } else if (kind === 'glance') {
      const tx = line(p, 'glance', null, t('line.glance_fallback', { name: p.person.name }));
      speakWithAI(p, 'The character quietly looks at you without asking for anything', tx, 'soft'); G.log(p.id, 'glance', tx);
    } else {
      const pool = G.speechPool(p);
      const c = G.fmt(pick(pool.length ? pool : ['……']), p);
      speakWithAI(p, 'The character says something offhand', c, 'speech'); G.say(p.id, 'char', c);
    }
  }
  G.fire = fire;

  function expire(req) {
    const p = G.get(req.pid), mode = ini.get(G.cfg, 'interrupt', 'mode');
    delete G.req[req.pid];
    learn(p, req.kind, false);
    if (req.kind === 'pick' || req.kind === 'nudge') return;
    if (mode === 'countdown_dismiss') { G.log(p.id, 'missed', t('log.called_gone', { name: p.person.name })); G.toastFor(p, t('toast.nevermind'), 'soft'); return; }
    if (req.kind === 'need') {
      p.state.needs[req.need] = clamp(p.state.needs[req.need] - 0.3);
      G.log(p.id, 'missed', t('log.missed_need', { name: p.person.name, text: req.text }));
      G.toastFor(p, t('toast.self'), 'soft');
    } else if (req.kind === 'choice') {
      const c = req.choices.find(x => x.liked) || req.choices[0];
      applyChoice(p, c, true);
    } else {
      G.log(p.id, 'missed', t('log.missed_generic', { text: req.text }));
      G.toastFor(p, t('toast.nevermind2'), 'soft');
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
    const tx = line(p, 'thanks', actionId, line(p, 'thanks', 'default', t('line.ok')));
    G.toastFor(p, tx, 'speech'); G.say(pid, 'char', tx);
    G.log(pid, 'care', t('log.care', { label: a.label, line: tx }));
    G.playFx(pid, actionId);
    G.save(); emit();
  };
  /* 回答问答题：idx 是预设回答的序号，custom 是玩家自己写的 */
  G.answerAsk = function (pid, idx, custom) {
    const p = G.get(pid), req = G.req[pid];
    if (!req || req.kind !== 'ask') return;
    const text = custom !== undefined && custom !== null ? String(custom).trim() : req.answers[idx];
    if (!text) return;
    delete G.req[pid];
    G.say(pid, 'you', text, req.askId, custom !== undefined && custom !== null ? 'custom' : idx);
    G.log(pid, 'talk', t('log.talk', { q: req.text, a: text }));
    p.story.care_total++; p.state.mood = clamp(p.state.mood + 0.1);
    G.toastFor(p, line(p, 'thanks', 'default', t('line.ok')), 'speech');
    learn(p, 'ask', true, (Date.now() - req.since) / 1000);
    G.playFx(pid, 'talk');
    G.save(); emit();
  };
  function applyChoice(p, c, auto) {
    p.state.mood = clamp(p.state.mood + (c.mood || 0));
    p.state.frailty = clamp(p.state.frailty + (c.frailty || 0));
    const reply = G.fmt(c.reply, p);
    G.toastFor(p, reply, 'speech'); G.say(p.id, 'char', reply);
    G.log(p.id, 'event', t(auto ? 'log.dinner_auto' : 'log.dinner', { name: p.person.name, label: c.label, reply }));
    if (!auto) p.story.care_total++;
  }
  G.choose = function (pid, i) {
    const req = G.req[pid];
    if (!req || req.kind !== 'choice') return;
    delete G.req[pid];
    const p = G.get(pid);
    learn(p, 'choice', true, (Date.now() - req.since) / 1000);
    applyChoice(p, req.choices[i], false);
    G.playFx(pid, 'feed');
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
    G.log(pid, 'picked', t('log.picked', { name: p.person.name, text }));
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
      G.log(pid, 'nudge', t('log.nudge', { name: p.person.name, text: (G.tpl.nudges.find(n => n.id === req.nudge) || {}).text || '' }));
      G.toastFor(p, t('toast.go'), 'soft');
    } else G.toastFor(p, t('toast.later'), 'soft');
    learn(p, 'nudge', !!yes, (Date.now() - req.since) / 1000);
    G.save(); emit();
  };
  G.dismiss = function (pid) {
    const r = G.req[pid]; if (!r) return;
    delete G.req[pid];
    learn(G.get(pid), r.kind, false);
    if (r.kind !== 'pick' && r.kind !== 'nudge') G.log(pid, 'missed', t('log.put_down', { text: r.text }));
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
