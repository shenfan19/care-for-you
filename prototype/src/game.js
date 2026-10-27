/* 游戏逻辑，不碰界面。数据都来自 store 里的明文文件。文字都通过 CY.t 取，所以换语言不用改这里。
   核心是照顾的代价：长按占用你现实里的时间，点击占用游戏里的时间，完整体验里工作赚钱，照顾要用物品。 */
(function (CY) {
  const { ini, store } = CY;
  const t = (k, v) => CY.t(k, v);
  const G = CY.game = {
    cfg: {}, people: [], world: { game_minutes: 0 }, req: {}, toast: {}, fx: {}, crying: {}, journal: {}, sayings: {},
    tpl: { species: {}, conditions: {}, voices: {}, sayLib: [], nudges: [], asks: [], skills: {}, persona: null, classes: {}, items: { items: {}, start: {}, for_need: {} } },
    listeners: [], timer: null, nextAt: 0, lastTick: Date.now(), dirty: new Set(),
  };
  /* 打扰间隔，单位是游戏分钟，所以真实时间下是真实分钟，压缩时间下会按比例变短。test 档单位是现实秒。 */
  const GAP = { often: [20, 60], normal: [60, 180], rare: [240, 600] };
  const GAP_TEST = [15, 40];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const monthKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const DEFAULT_VOICE = { cat: 'cat', dog: 'dog', snake: 'snake', rabbit: 'rabbit', hamster: 'hamster', bird: 'bird', fish: 'fish', turtle: 'turtle', succulent: 'plant', flower: 'plant', tree: 'plant' };
  const CHILDLIKE = ['child', 'infant', 'toddler', 'teen'];

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
    /* 新增的模板文件补上；内置模板的版本比文件里新，就用新的覆盖，旧的留在 _backup 里 */
    const seed = CY.seed.files();
    for (const p in seed) {
      if (!/^templates\//.test(p)) continue;
      if (!files.includes(p)) { await store.write(p, seed[p]); files.push(p); continue; }
      if (/^templates\/(species|conditions)\/|^templates\/(classes|economy\/items)\.yaml$/.test(p)) {
        try { const cur = jsyaml.load(await store.read(p)) || {}, nv = (jsyaml.load(seed[p]) || {}).version || 1; if ((cur.version || 1) < nv) await store.write(p, seed[p]); } catch (e) { await store.write(p, seed[p]); }
      }
    }
    G.tpl = { species: {}, conditions: {}, voices: {}, sayLib: [], nudges: [], asks: [], skills: {}, persona: null, classes: {}, items: { items: {}, start: {}, for_need: {} } };
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
    G.tpl.classes = ((await store.readYaml('templates/classes.yaml')) || {}).classes || {};
    G.tpl.items = Object.assign({ items: {}, start: {}, for_need: {} }, await store.readYaml('templates/economy/items.yaml'));
    const st = G.tpl.items.start || {};
    if (typeof G.world.money !== 'number') G.world.money = st.money || 0;
    if (!G.world.inv) G.world.inv = Object.assign({}, st.inv || {});
    if (!G.world.nanny) G.world.nanny = {};
    G.people = []; G.journal = {}; G.sayings = {};
    const ids = [...new Set(files.map(p => (p.match(/^people\/([^/]+)\//) || [])[1]).filter(Boolean))].sort();
    for (const id of ids) {
      const person = await store.readYaml(`people/${id}/person.yaml`);
      if (!person) continue;
      person.id = id;
      const species = G.tpl.species[person.species];
      if (!species) { console.warn('找不到物种模板', person.species); continue; }
      if (person.kind === 'human' && typeof person.age !== 'number') person.age = CY.content.AGE_OF_STAGE[person.age_stage] || 35;
      const state = Object.assign({ version: 1, needs: {}, mood: 0.6, frailty: 0.1, last_seen: '', asked: [], heal: {} }, await store.readYaml(`people/${id}/state.yaml`));
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
    G.req = {}; G.toast = {}; G.fx = {}; G.crying = {};
  };

  /* ---------- 创建与停用角色 ---------- */
  G.createPerson = async function (spec) {
    const arch = CY.content.archOf(spec.arch) || {};
    const id = 'c' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
    const species = spec.species || arch.species || 'human';
    const human = species === 'human';
    const age = human ? (typeof spec.age === 'number' ? spec.age : typeof arch.age === 'number' ? arch.age : 35) : undefined;
    let voice = spec.voice || arch.voice || DEFAULT_VOICE[species] || 'sibling';
    if (human && CHILDLIKE.includes(voice)) voice = CY.content.STAGE_VOICE[CY.content.stageOf(age)] || voice;
    const person = {
      version: 2, id, active: true, name: spec.name || spec.roleText || arch.role || '', role: spec.roleText || arch.role || '',
      archetype: spec.arch || '', voice, pronoun: spec.pronoun || arch.pronoun || (human ? '他' : '它'),
      kind: human ? 'human' : species === 'succulent' || species === 'flower' || species === 'tree' ? 'plant' : 'animal', species,
      appearance: spec.look || arch.look || {}, personality: { talkative: 0.5, temper: '', catchphrases: [] },
      conditions: spec.conditions || [], lines: {},
    };
    if (human) person.age = age;
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
  G.isHuman = p => p.species.id === 'human';
  G.age = p => (typeof p.person.age === 'number' ? p.person.age : 35);
  G.stage = p => (G.isHuman(p) ? CY.content.stageOf(G.age(p)) : 'adult');
  G.classKey = p => (G.isHuman(p) ? G.stage(p) : p.species.id);
  G.classOf = p => Object.assign({ urgency: 1, self_care: 0.3 }, G.tpl.classes[G.classKey(p)]);
  G.pronoun = p => (p ? (p.person.pronoun || (G.isHuman(p) ? '他' : '它')) : '他');
  const rateOf = (d, stage) => (typeof d.rate === 'number' ? d.rate : (d.rate && (d.rate[stage] !== undefined ? d.rate[stage] : d.rate.default)) || 0.05);
  G.needsOf = p => {
    const out = {};
    const add = (defs) => { for (const k in defs || {}) { const d = defs[k]; if (!d.stages || d.stages.includes(G.stage(p))) out[k] = Object.assign({}, d, { rateNow: rateOf(d, G.stage(p)) }); } };
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
        out[k] = Object.assign({}, d, { label: lab, id: k, min: d.min !== undefined ? d.min : Math.max(3, d.hold * 3) });
      }
    };
    add(p.species.actions);
    for (const c of p.person.conditions || []) add((G.tpl.conditions[c] || {}).actions);
    return out;
  };
  G.maxNeed = p => Math.max(0, ...Object.values(p.state.needs));
  G.topNeed = p => { const d = G.needsOf(p); return Object.keys(d).sort((a, b) => p.state.needs[b] - p.state.needs[a])[0]; };
  /* 紧迫程度：最急的需求乘以类别的紧迫系数。不让玩家手动排优先级，由类别和需求自然决定谁最急 */
  G.urgency = p => G.maxNeed(p) * G.classOf(p).urgency;
  G.holdSeconds = a => a.hold * ini.num(G.cfg, 'interaction', 'hold_scale');
  G.fmt = (s, p) => String(s).replace(/\{title\}/g, ini.get(G.cfg, 'player', 'title')).replace(/\{name\}/g, p ? p.person.name : ini.get(G.cfg, 'player', 'name'))
    .replace(/\{ta\}/g, G.pronoun(p));
  G.inputMode = () => (ini.get(G.cfg, 'interaction', 'input') === 'click' ? 'click' : 'hold');

  /* ---------- 经济：钱，物品，工作，保姆 ---------- */
  G.economyOn = () => ini.bool(G.cfg, 'play', 'economy');
  G.item = k => (G.tpl.items.items || {})[k] || { label: k, icon: '•', price: 10 };
  G.workWindow = () => {
    const m = ini.get(G.cfg, 'economy', 'work_hours').match(/^(\d\d):(\d\d)-(\d\d):(\d\d)$/);
    return m ? [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]] : [540, 1080];
  };
  G.isWorkTime = () => { const [a, b] = G.workWindow(), d = G.dayMinutes(); return d >= a && d < b; };
  G.buy = (k, n = 1) => {
    const it = G.item(k), cost = it.price * n;
    if (G.world.money < cost) return false;
    G.world.money -= cost; G.world.inv[k] = (G.world.inv[k] || 0) + n; G.save(); emit(); return true;
  };
  G.hasNanny = p => !!(G.world.nanny || {})[p.id];
  G.setNanny = (pid, on) => { G.world.nanny = G.world.nanny || {}; if (on) G.world.nanny[pid] = true; else delete G.world.nanny[pid]; G.save(); emit(); };
  G.nannyCostPerHour = () => ini.num(G.cfg, 'economy', 'nanny_wage');
  /* 动作缺什么物品，完整体验才检查 */
  G.lacking = a => {
    if (!G.economyOn()) return null;
    for (const k in a.uses || {}) if ((G.world.inv[k] || 0) < a.uses[k]) return k;
    return null;
  };

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
  /* 台词来源：角色自己写的优先，其次疾病里写的，最后是声线模板。 */
  G.lines = (p, group, key) => {
    const pickFrom = src => (key === undefined || key === null) ? src : (src && !Array.isArray(src) && typeof src === 'object' ? src[key] : undefined);
    const srcs = [(p.person.lines || {})[group]];
    for (const c of p.person.conditions || []) srcs.push((((G.tpl.conditions[c] || {}).lines) || {})[group]);
    srcs.push(p.voice[group]);
    for (const s of srcs) {
      const v = pickFrom(s);
      if (Array.isArray(v) && v.length) return v;
      if (typeof v === 'string') return [v];
    }
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
      G.world.schema = CY.meta ? CY.meta.schema : 3;
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
  const foodOf = p => p.species.food || 'food';
  const itemForNeed = (p, k) => (k === 'hunger' ? foodOf(p) : (G.tpl.items.for_need || {})[k]);

  function advance(gmin, offline) {
    if (gmin <= 0) return;
    const hours = gmin / 60;
    const boost = ini.get(G.cfg, 'interrupt', 'frequency') === 'test' && !offline ? 30 : 1;
    const night = G.isNight(), working = G.economyOn() && G.isWorkTime();
    G.world.game_minutes += gmin;
    /* 工作收入：工作时段里，没有被点击动作占着手，就在赚钱 */
    if (!offline && G.economyOn() && working && !G.world.busy) G.world.money += ini.num(G.cfg, 'economy', 'wage') * hours;
    for (const p of G.activePeople()) {
      const defs = G.needsOf(p), s = p.state, nanny = G.economyOn() && working && G.hasNanny(p);
      if (nanny && !offline) G.world.money -= G.nannyCostPerHour() * hours;
      for (const k in defs) s.needs[k] = clamp((s.needs[k] || 0) + defs[k].rateNow * hours * boost * (k === 'rest' && night ? 2 : 1) * (nanny ? 0.4 : 1), 0, offline ? 0.7 : 1);
      let target = 1 - 0.7 * G.maxNeed(p);
      if (nanny) target = Math.min(target, 0.55);
      s.mood = clamp(s.mood + (target - s.mood) * Math.min(1, hours * 0.5));
      if (offline) continue;
      /* 没人管的时候，有的会自己解决：老人自己吃饭睡觉，孩子不行 */
      const sc = G.classOf(p).self_care;
      if (sc > 0) for (const k in defs) {
        if (s.needs[k] > 0.7 && Math.random() < sc * hours * 1.2 * boost) {
          const item = itemForNeed(p, k);
          if (G.economyOn() && item && (G.world.inv[item] || 0) < 1) continue;
          if (G.economyOn() && item) G.world.inv[item]--;
          s.needs[k] = clamp(s.needs[k] - 0.5);
          if (!s._selfAt || Date.now() - s._selfAt > 30000) { s._selfAt = Date.now(); G.log(p.id, 'self', t('log.self', { name: p.person.name, need: G.needLabel(k, defs[k]) })); }
        }
      }
      const was = s.frailty;
      if (G.maxNeed(p) > 0.9) s.frailty = clamp(s.frailty + 0.02 * hours * boost);
      else if (G.maxNeed(p) < 0.4) s.frailty = clamp(s.frailty - 0.01 * hours);
      if (was < 0.7 && s.frailty >= 0.7) { G.log(p.id, 'frail', t('log.frail', { name: p.person.name })); G.toastFor(p, G.fmt(t('toast.weak'), p), 'soft'); }
      if (was >= 0.5 && s.frailty < 0.5) G.log(p.id, 'recovered', t('log.recovered', { name: p.person.name }));
    }
    /* 请了保姆但钱花光了，保姆先走 */
    if (G.world.money < 0) { G.world.money = 0; if (Object.keys(G.world.nanny || {}).length) { G.world.nanny = {}; for (const p of G.activePeople()) G.log(p.id, 'event', t('log.nanny_left')); } }
    /* 点击动作做完了 */
    const b = G.world.busy;
    if (b && G.world.game_minutes >= b.end) { G.world.busy = null; finishAction(b); }
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
  G.toastFor = (p, text, kind) => { G.toast[p.id] = { text, kind: kind || 'soft', until: Date.now() + (kind === 'reveal' ? 16000 : kind === 'cry' ? 6500 : 9000) }; };

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
    if (p.person.kind !== 'human' || st === 'infant') return [];
    const sens = ini.bool(G.cfg, 'interaction', 'sensitive_topics');
    const recent = new Set(p.state.asked || []);
    const fits = (arr, val) => !arr || arr.includes(val);
    let pool = G.tpl.asks.filter(q => fits(q.voice, v) && fits(q.stage, st) && fits(q.pronoun, pr) && (sens || !q.sensitive));
    const mine = ((p.person.lines || {}).ask || []).filter(q => q && q.say).map((q, i) => ({ id: `own${i}`, say: q.say, answers: q.answers || [] }));
    pool = pool.concat(mine);
    const fresh = pool.filter(q => !recent.has(q.id));
    return fresh.length ? fresh : pool;
  };
  const GENERIC_ANSWERS = ['ans.generic1', 'ans.generic2', 'ans.generic3'];

  const eveningOk = () => ini.get(G.cfg, 'interrupt', 'frequency') === 'test' || (G.dayMinutes() >= 16 * 60 && G.dayMinutes() < 21 * 60);
  /* 当前能触发的疾病事件，例如糖尿病的晚饭选择 */
  const eventsOf = p => {
    const out = [];
    for (const c of p.person.conditions || []) {
      const evs = (G.tpl.conditions[c] || {}).events || {};
      for (const k in evs) if (!evs[k].evening || eveningOk()) out.push(Object.assign({ key: k, cond: c }, evs[k]));
    }
    return out;
  };

  function fire() {
    if (G.inQuiet()) return;
    const workNanny = p => G.economyOn() && G.isWorkTime() && G.hasNanny(p);
    const free = G.activePeople().filter(p => !G.req[p.id]);
    if (!free.length) return;
    const needy = free.filter(p => G.maxNeed(p) > 0.55 && !workNanny(p) && p.person.kind !== 'plant' || (p.person.kind === 'plant' && G.maxNeed(p) > 0.7 && !workNanny(p)));
    if (needy.length && Math.random() < 0.65) {
      const p = weighted(needy, q => G.urgency(q) * needyW(q) + 0.01), defs = G.needsOf(p), need = G.topNeed(p);
      const text = line(p, 'request', need, t('req.need_fallback', { name: p.person.name, need: G.needLabel(need, defs[need]) }));
      G.req[p.id] = mkReq({ pid: p.id, kind: 'need', need, text });
      G.say(p.id, 'char', text);
      return;
    }
    const talkers = free.filter(p => p.person.kind !== 'plant');
    if (!talkers.length) return;
    const p = weighted(talkers, needyW);
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
    const evs = eventsOf(p);
    const asks = G.askBank(p);
    const picks = ini.bool(G.cfg, 'interaction', 'picks') && p.person.kind !== 'plant' ? G.pickOptions(p) : [];
    const nudgeOk = ini.bool(G.cfg, 'interaction', 'nudges') && p.person.kind === 'human' && G.stage(p) !== 'infant' && G.tpl.nudges.length;
    const kinds = [
      ['choice', evs.length ? 0.15 : 0], ['ask', asks.length ? 0.3 : 0], ['pick', picks.length ? 0.2 : 0], ['nudge', nudgeOk ? 0.07 : 0],
      ['glance', 0.2], ['speech', 0.15],
    ].map(([k, w]) => [k, kindWeight(p, k, w)]).filter(x => x[1] > 0);
    const kind = weighted(kinds, x => x[1])[0];

    if (kind === 'choice') {
      const ev = pick(evs);
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
      /* 没赶上的时候，能自理的自己处理一部分，婴儿没法自理，需求照旧 */
      const relief = 0.3 * (G.classOf(p).self_care > 0 ? 1 : 0);
      p.state.needs[req.need] = clamp(p.state.needs[req.need] - relief);
      G.log(p.id, 'missed', t(relief ? 'log.missed_need' : 'log.missed_need_helpless', { name: p.person.name, text: req.text }));
      G.toastFor(p, t(relief ? 'toast.self' : 'toast.nobody'), 'soft');
    } else if (req.kind === 'choice') {
      const c = req.choices.find(x => x.liked) || req.choices[0];
      applyChoice(p, c, true);
    } else {
      G.log(p.id, 'missed', t('log.missed_generic', { text: req.text }));
      G.toastFor(p, t('toast.nevermind2'), 'soft');
    }
  }

  /* ---------- 玩家动作：长按立刻生效，点击要花掉游戏里的时间 ---------- */
  function applyAction(pid, actionId) {
    const p = G.get(pid), a = p && G.actionsOf(p)[actionId];
    if (!a) return false;
    const lack = G.lacking(a);
    if (lack) { G.toastFor(p, t('toast.no_item', { item: G.item(lack).label }), 'soft'); emit(); return false; }
    const s = p.state;
    const scale = a.bonus_item && G.economyOn() && !(G.world.inv[a.bonus_item] > 0) ? 0.5 : 1;
    if (G.economyOn()) for (const k in a.uses || {}) G.world.inv[k] -= a.uses[k];
    for (const k in a.effect || {}) if (k in s.needs) s.needs[k] = clamp(s.needs[k] + a.effect[k] * scale);
    s.mood = clamp(s.mood + (a.mood === undefined ? 0.08 : a.mood));
    if (a.frailty) s.frailty = clamp(s.frailty + a.frailty);
    p.story.care_total++;
    /* 急性的病好起来：照顾够了次数就痊愈 */
    for (const c of [...(p.person.conditions || [])]) {
      const ha = (G.tpl.conditions[c] || {}).heal_after;
      if (ha && a.effect && ha.need in a.effect) {
        s.heal = s.heal || {}; s.heal[c] = (s.heal[c] || 0) + 1;
        if (s.heal[c] >= ha.count) {
          p.person.conditions = p.person.conditions.filter(x => x !== c); delete s.heal[c];
          store.writeYaml(`people/${p.id}/person.yaml`, p.person);
          G.log(p.id, 'recovered', t('log.healed', { name: p.person.name, cond: CY.tOr('cond.' + c, (G.tpl.conditions[c] || {}).label || c) }));
        }
      }
    }
    const req = G.req[pid];
    if (req && req.kind === 'need') {
      if (s.needs[req.need] < 0.4) { delete G.req[pid]; learn(p, 'need', true, (Date.now() - req.since) / 1000); }
    }
    const tx = line(p, 'thanks', actionId, line(p, 'thanks', 'default', t('line.ok')));
    G.toastFor(p, tx, 'speech'); G.say(pid, 'char', tx);
    G.log(pid, 'care', t('log.care', { label: a.label, line: tx }));
    G.playFx(pid, actionId);
    G.save(); emit();
    return true;
  }
  G.applyAction = applyAction;
  G.perform = function (pid, actionId) { return applyAction(pid, actionId); };
  /* 点击模式：开始做一件事，要花掉 min 个游戏分钟，期间不赚钱，也做不了别的 */
  G.startAction = function (pid, actionId) {
    const p = G.get(pid), a = p && G.actionsOf(p)[actionId];
    if (!a) return false;
    if (G.world.busy) { G.toastFor(p, t('toast.busy', { what: G.world.busy.label }), 'soft'); emit(); return false; }
    const lack = G.lacking(a);
    if (lack) { G.toastFor(p, t('toast.no_item', { item: G.item(lack).label }), 'soft'); emit(); return false; }
    const gm = G.world.game_minutes;
    G.world.busy = { pid, act: actionId, label: a.label, start: gm, end: gm + a.min };
    G.toastFor(p, t('toast.started', { what: a.label, min: a.min }), 'soft');
    G.save(); emit();
    return true;
  };
  function finishAction(b) { if (G.get(b.pid)) applyAction(b.pid, b.act); }
  G.cancelAction = () => { G.world.busy = null; emit(); };
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
    /* 婴幼儿需求严重时会一直哭闹，直到有人管 */
    const was = G.crying; G.crying = {};
    for (const p of G.activePeople()) {
      if (!G.classOf(p).cries || G.maxNeed(p) <= 0.8) continue;
      G.crying[p.id] = true;
      if (!was[p.id]) G.log(p.id, 'cry', t('log.cry', { name: p.person.name, need: G.needLabel(G.topNeed(p), G.needsOf(p)[G.topNeed(p)]) }));
      if (!G.toast[p.id] || G.toast[p.id].kind !== 'cry') if (!G.req[p.id] || G.req[p.id].kind !== 'ask') G.toastFor(p, line(p, 'cry', null, t('line.cry')), 'cry');
    }
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
