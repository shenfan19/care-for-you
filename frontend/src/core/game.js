/* 游戏逻辑，不碰界面。数据都来自 store 里的明文文件。文字都通过 CY.t 取，所以换语言不用改这里。
   核心是照顾的代价：现实模式下长按占用你现实里的时间，故事模式下点击占用游戏里的时间，完整体验里工作赚钱，照顾要用物品。 */
(function (CY) {
  const { ini, store } = CY;
  const t = (k, v) => CY.t(k, v);
  const G = CY.game = {
    cfg: {}, people: [], world: { game_minutes: 0 }, req: {}, toast: {}, fx: {}, crying: {}, act: {}, journal: {}, sayings: {},
    tpl: { species: {}, conditions: {}, voices: {}, sayLib: [], nudges: [], asks: [], skills: {}, persona: null, classes: {}, traits: {}, engine: {}, items: { items: {}, start: {}, for_need: {} } },
    listeners: [], timer: null, nextAt: 0, lastTick: Date.now(), dirty: new Set(),
  };
  /* 事件总线：各个系统把发生的事发出来，可选的模块自己来听，发的人不用知道谁在听。听的人出错不影响游戏 */
  G.bus = (() => { const m = {}; return { on: (n, f) => { (m[n] = m[n] || []).push(f); }, emit: (n, d) => { for (const f of m[n] || []) { try { f(d); } catch (e) { /* 统计出错不能影响游戏 */ } } } }; })();
  /* 打扰间隔，单位是游戏分钟，所以真实时间下是真实分钟，压缩时间下会按比例变短。test 档单位是现实秒。 */
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const monthKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const DEFAULT_VOICE = { cat: 'cat', dog: 'dog', snake: 'snake', rabbit: 'rabbit', hamster: 'hamster', bird: 'bird', fish: 'fish', turtle: 'turtle', guineapig: 'rabbit', gecko: 'snake', hedgehog: 'hedgehog', duck: 'duck', ferret: 'ferret', axolotl: 'axolotl', chicken: 'chicken', orchid: 'plant', bamboo: 'plant', succulent: 'plant', flower: 'plant', tree: 'plant', cactus: 'plant' };
  const PLANTS = ['succulent', 'flower', 'tree', 'cactus', 'orchid', 'bamboo'];
  const NOCTURNAL = ['hamster', 'hedgehog', 'gecko'];
  const CHILDLIKE = ['child', 'infant', 'toddler', 'teen'];
  const PRON_CODE = { he: 'm', she: 'f', it: 'n' };

  G.on = fn => G.listeners.push(fn);
  const emit = () => G.listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  G._h = { emit, clamp, pick, applyEffects };   /* 拆出去的文件用，函数声明会提升 */
  G.emit = emit;
  G.saveCfg = () => store.write('settings.ini', ini.stringify(G.cfg));

  /* ---------- 载入 ---------- */
  const CONTENT_FILES = ['sayings', 'asks', 'nudges'];
  /* 内置模板：物种，疾病，类别，角色卡，台词，规则都是程序自带的，不放进存档，直接读内置种子。玩家自己放进来的东西（导入的疾病包，自制的来客卡）放在存档的 custom/ 下。
     种子按界面语言生成，同一种语言只生成一次 */
  G.T = () => { const L = CY.i18n.lang; return (G._tc && G._tc.lang === L) ? G._tc.f : (G._tc = { lang: L, f: CY.seed.files() }).f; };
  const tyaml = p => { const x = G.T()[p]; return x === undefined ? null : jsyaml.load(x); };
  /* 台词、说话库、问答库、提醒库是内容包，按语言生成 */
  async function loadContent() {
    const L = CY.i18n.lang, dir = `templates/content/${L}/`, T = G.T();
    G.tpl.voices = {};
    for (const p of Object.keys(T)) { const m = p.match(new RegExp('^' + dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 'voices/([^/]+)\\.yaml$')); if (m) { const x = tyaml(p); if (x) G.tpl.voices[x.id || m[1]] = x; } }
    G.tpl.sayLib = ((tyaml(dir + 'library/sayings.yaml')) || {}).items || [];
    G.tpl.nudges = ((tyaml(dir + 'library/nudges.yaml')) || {}).items || [];
    G.tpl.asks = ((tyaml(dir + 'library/asks.yaml')) || {}).items || [];
    G.tpl.traitLines = tyaml(dir + 'traits.yaml') || {};
    /* 疾病的台词和事件文字：当前语言的覆盖到疾病模板上 */
    const conds = tyaml(dir + 'conditions.yaml') || {};
    for (const c in G.tpl.conditions) {
      const tx = conds[c], cd = G.tpl.conditions[c];
      if (!tx) continue;
      if (tx.lines) { cd.lines = cd.lines || {}; for (const g in tx.lines) cd.lines[g] = Object.assign({}, cd.lines[g], tx.lines[g]); }
      for (const ek in tx.events || {}) {
        const ev = (cd.events || {})[ek]; if (!ev) continue;
        ev.say = tx.events[ek].say || ev.say;
        (tx.events[ek].choices || []).forEach((ch, i) => { if (ev.choices[i]) Object.assign(ev.choices[i], { label: ch.label, reply: ch.reply }); });
      }
    }
    for (const p of G.people) p.voice = G.tpl.voices[p.person.voice || DEFAULT_VOICE[p.person.species] || 'sibling'] || {};
  }
  /* 系统起的名字和身份（开局预设、随机、没填名字时用的角色名）跟界面语言走；玩家自己改过的名字不动。name_auto 存名字键，玩家改名时清掉 */
  G.refreshAutoNames = async function () {
    for (const p of G.people) {
      /* 来客的名字和身份跟界面语言走，换语言时一起换 */
      if (p.person.visitor) {
        const arch = p.person.archetype || p.person.card, role = CY.tOr('arch.' + arch, (CY.content.archOf(arch) || {}).role || p.person.role), name = CY.tOr('visitor.' + p.person.visitor.id + '.name', p.person.name);
        if (name !== p.person.name || role !== p.person.role) { p.person.name = name; p.person.role = role; await store.writeYaml(`people/${p.id}/person.yaml`, p.person); }
        continue;
      }
      const k = p.person.name_auto; if (!k) continue;
      const arch = p.person.archetype || p.person.card, role = CY.tOr('arch.' + arch, (CY.content.archOf(arch) || {}).role || p.person.role);
      const name = CY.tOr('preset.name.' + k, role);
      if (name !== p.person.name || role !== p.person.role) { p.person.name = name; p.person.role = role; await store.writeYaml(`people/${p.id}/person.yaml`, p.person); }
    }
  };
  G.reloadContent = async function () {
    /* 疾病模板重新读一份干净的，再把当前语言的台词盖上去；玩家导入的疾病包在存档的 custom/conditions 下 */
    for (const p of Object.keys(G.T())) {
      const m = p.match(/^templates\/conditions\/([^/]+)\.yaml$/);
      if (m) { const x = tyaml(p); if (x) G.tpl.conditions[x.id || m[1]] = x; }
    }
    for (const p of (await store.list()).filter(p => /^custom\/conditions\/[^/]+\.yaml$/.test(p))) { const x = await store.readYaml(p); if (x) G.tpl.conditions[x.id || p.split('/').pop().replace('.yaml', '')] = x; }
    await loadContent();
    await G.refreshAutoNames();
    emit();
  };

  /* 读一个人进内存：载入时逐个调用，访客到来时单独调用 */
  G.loadOnePerson = async (id, files) => {
      const person = await store.readYaml(`people/${id}/person.yaml`);
      if (!person) return null;
      person.id = id;
      /* 旧存档里的角色卡 id 和称呼，换成现在的写法 */
      if (person.archetype) person.archetype = CY.content.archId(person.archetype);
      if (person.card) person.card = CY.content.archId(person.card);
      if (person.pronoun) person.pronoun = CY.content.pron(person.pronoun);
      const species = G.tpl.species[person.species];
      if (!species) { console.warn('找不到物种模板', person.species); return null; }
      if (person.kind === 'human' && typeof person.age !== 'number') person.age = CY.content.AGE_OF_STAGE[person.age_stage] || G.E('game').person.default_age;
      const state = Object.assign({ version: 1, needs: {}, mood: G.E('game').person.start_mood, frailty: G.E('game').person.start_frailty, last_seen: '', asked: [], heal: {} }, await store.readYaml(`people/${id}/state.yaml`));
      state.learn = Object.assign({ needy: (person.personality && person.personality.talkative) || G.E('game').person.talkative_default, resp: 0, n_resp: 0, kinds: {} }, state.learn);
      const story = Object.assign({ version: 1, arcs: {}, care_total: 0, cares_back_total: 0, revealed: false, nudge_done: 0, self_total: 0 }, await store.readYaml(`people/${id}/story.yaml`));
      const p = { id, person, species, state, story, voice: {} };
      for (const k of Object.keys(G.needsOf(p))) if (typeof state.needs[k] !== 'number') state.needs[k] = 1 - (G.E('needs').init_floor + Math.random() * G.E('needs').init_spread);
      G.people.push(p);
      const sy = await store.readYaml(`people/${id}/sayings.yaml`);
      G.sayings[id] = (sy && sy.items) || [];
      G.journal[id] = {};
      for (const f of files.filter(f => f.startsWith(`people/${id}/journal/`))) {
        const j = await store.readYaml(f);
        G.journal[id][f.split('/').pop().replace('.yaml', '')] = (j && j.entries) || [];
      }
      return p;
  };

  /* 世界文件的路径：world/世界编号/文件名 */
  G.worldId = () => G.E('world').default_id;
  G.wpath = f => 'world/' + G.worldId() + '/' + f;

  G.load = async function () {
    if (!(await store.list()).includes('settings.ini')) {
      const seed = CY.seed.files();
      for (const p in seed) if (!/^templates\//.test(p)) await store.write(p, seed[p]);   /* 模板不进存档 */
    }
    G.cfg = ini.parse((await store.read('settings.ini')) || '');
    CY.i18n.set(CY.i18n.detect(ini.get(G.cfg, 'ui', 'language')));
    /* 规则配置最先读：后面的载入就要用它。模板是程序自带的，不在存档里 */
    G.tpl.engine = tyaml('templates/engine.yaml') || {};
    G.world = Object.assign({ version: 1, game_minutes: 0, last_seen: '' }, await store.readYaml(G.wpath('world.yaml')));
    /* 新档开局对齐系统时间，之后游戏时钟自己走 */
    if (typeof G.world.clock_shift !== 'number') G.setClock(G.startMinute());
    const files = await store.list(), T = G.T();
    G.tpl = { species: {}, conditions: {}, voices: {}, sayLib: [], nudges: [], asks: [], skills: {}, persona: null, classes: {}, traits: {}, engine: G.tpl.engine, system: G.tpl.system };   /* engine 在最前面已经读进来了；重新载入的几个 await 之间游戏还在走，system 先留着 */
    for (const p of Object.keys(T)) {
      const m = p.match(/^templates\/(species|conditions)\/([^/]+)\.yaml$/);
      if (m) { const x = tyaml(p); if (x) G.tpl[m[1]][x.id || m[2]] = x; }
      const sk = p.match(/^templates\/ai\/skills\/([^/]+)\.yaml$/);
      if (sk) { const x = tyaml(p); if (x) G.tpl.skills[x.id || sk[1]] = x; }
    }
    /* 玩家导入的疾病包在存档的 custom/conditions 下 */
    for (const p of files) { const m = p.match(/^custom\/conditions\/([^/]+)\.yaml$/); if (m) { const x = await store.readYaml(p); if (x) G.tpl.conditions[x.id || m[1]] = x; } }
    /* 角色卡：每类典型角色一张，读进来替换内置的原型，新增的卡会出现在添加角色的列表里 */
    G.tpl.cards = {};
    for (const p of Object.keys(T)) { const m = p.match(/^templates\/cards\/([^/]+)\.yaml$/); if (m && !(m[1] in CY.content.LEGACY_ARCH)) { const x = tyaml(p); if (x) G.tpl.cards[x.id || m[1]] = x; } }
    for (const id in G.tpl.cards) {
      const c = G.tpl.cards[id], a = Object.assign({}, c, { id, role: c.label || c.role || id }), L = CY.content.archetypes, i = L.findIndex(x => x.id === id);
      if (i >= 0) L[i] = a; else L.push(a);
    }
    G.tpl.persona = tyaml('templates/ai/persona.yaml');
    G.tpl.rules = (tyaml('templates/events/rules.yaml') || {}).rules || [];
    G.tpl.system = tyaml('templates/system.yaml') || {};
    G.tpl.classes = (tyaml('templates/classes.yaml') || {}).classes || {};
    G.tpl.traits = (tyaml('templates/traits.yaml') || {}).traits || {};
    if (typeof G.world.money !== 'number') G.world.money = G.START_MONEY;
    if (G.loadCalendar) await G.loadCalendar();
    if (G.loadVisitorPacks) await G.loadVisitorPacks();
    if (G.afterLoad) G.afterLoad();
    delete G.world.busy;
    G.people = []; G.journal = {}; G.sayings = {};
    const ids = [...new Set(files.map(p => (p.match(/^people\/([^/]+)\//) || [])[1]).filter(Boolean))].sort();
    for (const id of ids) await G.loadOnePerson(id, files);
    await loadContent();
    await G.refreshAutoNames();
    emit();
  };

  /* 读一个人进内存：载入时逐个调用，访客到来时单独调用 */
  G.loadOnePerson = async (id, files) => {
      const person = await store.readYaml(`people/${id}/person.yaml`);
      if (!person) return null;
      person.id = id;
      /* 旧存档里的角色卡 id 和称呼，换成现在的写法 */
      if (person.archetype) person.archetype = CY.content.archId(person.archetype);
      if (person.card) person.card = CY.content.archId(person.card);
      if (person.pronoun) person.pronoun = CY.content.pron(person.pronoun);
      const species = G.tpl.species[person.species];
      if (!species) { console.warn('找不到物种模板', person.species); return null; }
      if (person.kind === 'human' && typeof person.age !== 'number') person.age = CY.content.AGE_OF_STAGE[person.age_stage] || G.E('game').person.default_age;
      const state = Object.assign({ version: 1, needs: {}, mood: G.E('game').person.start_mood, frailty: G.E('game').person.start_frailty, last_seen: '', asked: [], heal: {} }, await store.readYaml(`people/${id}/state.yaml`));
      state.learn = Object.assign({ needy: (person.personality && person.personality.talkative) || G.E('game').person.talkative_default, resp: 0, n_resp: 0, kinds: {} }, state.learn);
      const story = Object.assign({ version: 1, arcs: {}, care_total: 0, cares_back_total: 0, revealed: false, nudge_done: 0, self_total: 0 }, await store.readYaml(`people/${id}/story.yaml`));
      const p = { id, person, species, state, story, voice: {} };
      for (const k of Object.keys(G.needsOf(p))) if (typeof state.needs[k] !== 'number') state.needs[k] = 1 - (G.E('needs').init_floor + Math.random() * G.E('needs').init_spread);
      G.people.push(p);
      const sy = await store.readYaml(`people/${id}/sayings.yaml`);
      G.sayings[id] = (sy && sy.items) || [];
      G.journal[id] = {};
      for (const f of files.filter(f => f.startsWith(`people/${id}/journal/`))) {
        const j = await store.readYaml(f);
        G.journal[id][f.split('/').pop().replace('.yaml', '')] = (j && j.entries) || [];
      }
      return p;
  };

  /* 世界文件的路径：world/世界编号/文件名 */
  G.worldId = () => G.E('world').default_id;
  G.wpath = f => 'world/' + G.worldId() + '/' + f;

  G.load = async function () {
    if (!(await store.list()).includes('settings.ini')) {
      const seed = CY.seed.files();
      for (const p in seed) if (!/^templates\//.test(p)) await store.write(p, seed[p]);   /* 模板不进存档 */
    }
    G.cfg = ini.parse((await store.read('settings.ini')) || '');
    CY.i18n.set(CY.i18n.detect(ini.get(G.cfg, 'ui', 'language')));
    /* 规则配置最先读：后面的载入就要用它。模板是程序自带的，不在存档里 */
    G.tpl.engine = tyaml('templates/engine.yaml') || {};
    G.world = Object.assign({ version: 1, game_minutes: 0, last_seen: '' }, await store.readYaml(G.wpath('world.yaml')));
    /* 新档开局对齐系统时间，之后游戏时钟自己走 */
    if (typeof G.world.clock_shift !== 'number') G.setClock(G.startMinute());
    const files = await store.list(), T = G.T();
    G.tpl = { species: {}, conditions: {}, voices: {}, sayLib: [], nudges: [], asks: [], skills: {}, persona: null, classes: {}, traits: {}, engine: G.tpl.engine, system: G.tpl.system };   /* engine 在最前面已经读进来了；重新载入的几个 await 之间游戏还在走，system 先留着 */
    for (const p of Object.keys(T)) {
      const m = p.match(/^templates\/(species|conditions)\/([^/]+)\.yaml$/);
      if (m) { const x = tyaml(p); if (x) G.tpl[m[1]][x.id || m[2]] = x; }
      const sk = p.match(/^templates\/ai\/skills\/([^/]+)\.yaml$/);
      if (sk) { const x = tyaml(p); if (x) G.tpl.skills[x.id || sk[1]] = x; }
    }
    /* 玩家导入的疾病包在存档的 custom/conditions 下 */
    for (const p of files) { const m = p.match(/^custom\/conditions\/([^/]+)\.yaml$/); if (m) { const x = await store.readYaml(p); if (x) G.tpl.conditions[x.id || m[1]] = x; } }
    /* 角色卡：每类典型角色一张，读进来替换内置的原型，新增的卡会出现在添加角色的列表里 */
    G.tpl.cards = {};
    for (const p of Object.keys(T)) { const m = p.match(/^templates\/cards\/([^/]+)\.yaml$/); if (m && !(m[1] in CY.content.LEGACY_ARCH)) { const x = tyaml(p); if (x) G.tpl.cards[x.id || m[1]] = x; } }
    for (const id in G.tpl.cards) {
      const c = G.tpl.cards[id], a = Object.assign({}, c, { id, role: c.label || c.role || id }), L = CY.content.archetypes, i = L.findIndex(x => x.id === id);
      if (i >= 0) L[i] = a; else L.push(a);
    }
    G.tpl.persona = tyaml('templates/ai/persona.yaml');
    G.tpl.rules = (tyaml('templates/events/rules.yaml') || {}).rules || [];
    G.tpl.system = tyaml('templates/system.yaml') || {};
    G.tpl.classes = (tyaml('templates/classes.yaml') || {}).classes || {};
    G.tpl.traits = (tyaml('templates/traits.yaml') || {}).traits || {};
    if (typeof G.world.money !== 'number') G.world.money = G.START_MONEY;
    if (G.loadCalendar) await G.loadCalendar();
    if (G.loadVisitorPacks) await G.loadVisitorPacks();
    if (G.afterLoad) G.afterLoad();
    delete G.world.busy;
    G.people = []; G.journal = {}; G.sayings = {};
    const ids = [...new Set(files.map(p => (p.match(/^people\/([^/]+)\//) || [])[1]).filter(Boolean))].sort();
    for (const id of ids) await G.loadOnePerson(id, files);
    G.journal.you = {};
    for (const f of files.filter(f => f.startsWith('me/journal/'))) { const j = await store.readYaml(f); G.journal.you[f.split('/').pop().replace('.yaml', '')] = (j && j.entries) || []; }
    await loadContent(files);
    if (G.loadCurves) await G.loadCurves();
    G.req = {}; G.toast = {}; G.fx = {}; G.crying = {}; G.act = {};
  };


  /* ---------- 创建与停用角色 ---------- */
  /* 这个物种在这个阶段自己能做的动作，卡里没写就按这个 */
  const defaultSelf = (species, stage) => { const acts = ((G.tpl.species[species] || {}).actions) || {}; return Object.keys(acts).filter(k => { const x = acts[k]; return x.self && (x.self === true || x.self.includes(stage)); }); };
  G.createPerson = async function (spec) {
    const arch = CY.content.archOf(spec.arch) || {};
    /* 编号带一个递增序号，同一毫秒里连着建人也不会撞 */
    const id = 'c' + Date.now().toString(36) + (G._seq = ((G._seq || 0) + 1) % G.E('game').person.id_mod).toString(36).padStart(2, '0') + Math.floor(Math.random() * G.E('game').person.id_mod).toString(36).padStart(2, '0');
    const species = spec.species || arch.species || 'human';
    const human = species === 'human';
    const age = human ? (typeof spec.age === 'number' ? spec.age : typeof arch.age === 'number' ? arch.age : G.E('game').person.default_age) : undefined;
    let voice = spec.voice || arch.voice || DEFAULT_VOICE[species] || 'sibling';
    if (human && CHILDLIKE.includes(voice)) voice = CY.content.STAGE_VOICE[CY.content.stageOf(age)] || voice;
    const person = {
      version: 2, id, active: true, name: spec.name || spec.roleText || arch.role || '', role: spec.roleText || arch.role || '',
      archetype: spec.arch || '', voice, pronoun: CY.content.pron(spec.pronoun || arch.pronoun || (human ? 'he' : 'it')),
      kind: human ? 'human' : PLANTS.includes(species) ? 'plant' : 'animal', species,
      appearance: Object.assign({}, spec.look || arch.look || {}), personality: { talkative: G.E('game').person.talkative_default, temper: '', catchphrases: [] },
      traits: (spec.traits || []).slice(0, 2), conditions: spec.conditions || (arch.health && arch.health.conditions) || [], lines: JSON.parse(JSON.stringify((arch.dialogue && arch.dialogue.lines) || {})),
    };
    if (spec.name_auto) person.name_auto = spec.name_auto;
    if (spec.away && human) person.away = spec.away;
    if (spec.cond_set && Object.keys(spec.cond_set).length) person.cond_set = JSON.parse(JSON.stringify(spec.cond_set));
    if (spec.arch) { person.card = spec.arch; if (Object.keys(person.lines).length) person.lines_lang = 'zh-CN'; }
    const hp = arch.help || {};
    if (human) person.helper = typeof spec.helper === 'boolean' ? spec.helper : !!hp.proactive;
    if (human && (hp.efficiency || hp.interval || hp.role)) person.help = { efficiency: hp.efficiency, interval: hp.interval, role: hp.role };
    const stg = human ? CY.content.stageOf(age) : species, cls0 = G.tpl.classes[stg] || {};
    const diff = {}; for (const k in arch.class || {}) if (arch.class[k] !== cls0[k]) diff[k] = arch.class[k];
    if (Object.keys(diff).length) person.class_override = diff;
    if (arch.need_rate && Object.keys(arch.need_rate).length) person.need_rate = arch.need_rate;
    if (arch.prefs) person.prefs = JSON.parse(JSON.stringify(arch.prefs));
    if (Array.isArray(arch.self_actions)) { const def = defaultSelf(species, stg); if (arch.self_actions.slice().sort().join() !== def.slice().sort().join()) person.self_actions = arch.self_actions.slice(); }
    if (human) person.age = age;
    await store.writeYaml(`people/${id}/person.yaml`, person);
    if (arch.health && typeof arch.health.score === 'number') await store.writeYaml(`people/${id}/state.yaml`, { version: 1, needs: {}, mood: typeof arch.health.mood === 'number' ? arch.health.mood : G.E('game').person.start_mood, frailty: +(1 - arch.health.score).toFixed(2), last_seen: '', asked: [], heal: {} });
    return id;
  };
  G.setActive = async function (pid, on) {
    const p = G.get(pid); if (!p) return;
    p.person.active = on;
    if (on) p.person.archived = false;
    await store.writeYaml(`people/${pid}/person.yaml`, p.person);
    emit();
  };

  /* 编辑：只改玩家看得见的资料，需求、心情、记录都不动 */
  G.updatePerson = async function (pid, patch) {
    const p = G.get(pid); if (!p) return;
    const o = p.person;
    if (patch.away && !G.activePeople().some(q => q !== p && G.canLead(q))) delete patch.away;   /* 家里要留一个能操作的人，最后一位不能改成白天离家 */
    if ('away' in patch) { if (patch.away) o.away = patch.away; else delete o.away; const f = G.flag(p, 'outing'); if (!patch.away && f && f.away) G.clearFlag(p, 'outing'); }
    if (typeof patch.name === 'string' && patch.name.trim() && patch.name.trim() !== o.name) { o.name = patch.name.trim(); delete o.name_auto; }
    if (patch.arch && patch.arch !== (o.archetype || o.card)) {
      const a = CY.content.archOf(patch.arch);
      if (a && a.species === o.species) {
        o.archetype = patch.arch; o.card = patch.arch; o.role = CY.tOr('arch.' + patch.arch, a.role);
        if (o.name_auto) o.name_auto = patch.arch;
        if (G.isHuman(p) && a.voice && !CHILDLIKE.includes(o.voice)) o.voice = a.voice;
        o.lines = JSON.parse(JSON.stringify((a.dialogue && a.dialogue.lines) || {})); if (Object.keys(o.lines).length) o.lines_lang = 'zh-CN';
        if (a.help) { o.help = { efficiency: a.help.efficiency, interval: a.help.interval, role: a.help.role }; }
      }
    }
    if (patch.pronoun) o.pronoun = CY.content.pron(patch.pronoun);
    if (patch.look) o.appearance = Object.assign({}, o.appearance, patch.look);
    if (Array.isArray(patch.traits)) o.traits = patch.traits.slice(0, 2);
    if (typeof patch.helper === 'boolean') o.helper = patch.helper;
    if (Array.isArray(patch.conditions)) o.conditions = patch.conditions.slice();
    if (patch.cond_set !== undefined) { if (patch.cond_set && Object.keys(patch.cond_set).length) o.cond_set = JSON.parse(JSON.stringify(patch.cond_set)); else delete o.cond_set; }
    if (G.isHuman(p) && typeof patch.age === 'number') {
      o.age = Math.round(patch.age);
      if (CHILDLIKE.includes(o.voice)) o.voice = CY.content.STAGE_VOICE[CY.content.stageOf(o.age)] || o.voice;
      p.voice = G.tpl.voices[o.voice] || p.voice;
    }
    await store.writeYaml(`people/${pid}/person.yaml`, o);
    emit();
  };
  /* 归档：离开桌面，不再出现，记录和说过的话都留着，随时可以恢复 */
  G.archivePerson = async function (pid, on) {
    const p = G.get(pid); if (!p) return;
    p.person.archived = on;
    p.person.active = !on;
    await store.writeYaml(`people/${pid}/person.yaml`, p.person);
    emit();
  };
  /* 删除：连同记录一起从本机移除，不可恢复 */
  G.deletePerson = async function (pid) {
    const i = G.people.findIndex(p => p.id === pid); if (i < 0) return;
    G.people.splice(i, 1);
    delete G.journal[pid]; delete G.sayings[pid]; delete G.hist[pid];
    for (const m of [G.req, G.toast, G.fx, G.crying, G.act]) delete m[pid];
    if (G.world.protagonist === pid) G.world.protagonist = null;
    for (const k of [...G.dirty]) if (k.split('|')[1] === pid) G.dirty.delete(k);
    await store.removeDir(`people/${pid}`);
    G.save(true);
    emit();
  };

  /* ---------- 查询 ---------- */
  G.activePeople = () => G.people.filter(p => p.person.active !== false);
  G.get = id => G.people.find(p => p.id === id);
  G.isHuman = p => p.species.id === 'human';
  G.age = p => (typeof p.person.age === 'number' ? p.person.age : G.E('game').person.default_age);
  G.stage = p => (G.isHuman(p) ? CY.content.stageOf(G.age(p)) : 'adult');
  G.classKey = p => (G.isHuman(p) ? G.stage(p) : p.species.id);
  /* 性格特征：叠加起来影响需求速度、自理、作息、效果和心情 */
  G.traitMods = p => {
    const m = { rate: {}, self_care: 0, sleep_shift: 0, effect: {}, frailty: 1, mood_offset: 0 };
    for (const id of p.person.traits || []) {
      const tr = G.tpl.traits[id]; if (!tr) continue;
      for (const k in tr.rate || {}) m.rate[k] = (m.rate[k] || 1) * tr.rate[k];
      for (const k in tr.effect || {}) m.effect[k] = (m.effect[k] || 1) * tr.effect[k];
      m.self_care += tr.self_care || 0; m.sleep_shift += tr.sleep_shift || 0; m.frailty *= tr.frailty || 1; m.mood_offset += tr.mood_offset || 0;
    }
    return m;
  };
  G.classOf = p => {
    const c = Object.assign({}, G.E('game').class_defaults, G.tpl.classes[G.classKey(p)], p.person.class_override);   /* cry_at 会哭的类别，需求压力到这里就哭；wake_at 夜里需求压力到这里就睡不着；sleep_cycle 没有昼夜作息的类别，睡几分钟醒几分钟 */
    c.self_care = clamp(c.self_care + G.traitMods(p).self_care, 0, G.E('game').class_defaults.self_care_cap);
    return c;
  };
  G.pronoun = p => CY.content.pron(p ? (p.person.pronoun || (G.isHuman(p) ? 'he' : 'it')) : 'he');
  const rateOf = (d, stage) => (typeof d.rate === 'number' ? d.rate : (d.rate && (d.rate[stage] !== undefined ? d.rate[stage] : d.rate.default)) || G.E('game').need_rate_default);
  G.needsOf = p => {
    const out = {};
    const add = (defs) => { for (const k in defs || {}) { const d = defs[k]; if ((!d.stages || d.stages.includes(G.stage(p))) && !(d.min_age && G.age(p) < d.min_age)) out[k] = Object.assign({}, d, { rateNow: rateOf(d, G.stage(p)) }); } };
    add(p.species.needs);
    for (const c of p.person.conditions || []) add((G.tpl.conditions[c] || {}).needs);
    return out;
  };
  /* 需求和动作的显示名：当前语言包有就用，没有就用模板里的写法 */
  G.needLabel = (k, d) => CY.tOr('need.' + k, d.label);
  /* 状态里存的是水平：1 是满足（饱食度），0 是见底，和 LM 的状态变量同一个方向。规则的语言仍是需求压力，压力等于 1 减水平：
     速率是压力涨得多快，动作效果的负数是缓解，阈值是压力超过多少。两者的换算只在 G.need 和 G.setNeed 这两处。 */
  G.LEVEL_NAME = { thirst: 'Hydration', hunger: 'Fullness', rest: 'Energy', company: 'Companionship', play: 'Fun', diaper: 'Dryness', hygiene: 'Cleanliness', homework: 'Homework done', mobility: 'Movement', clean: 'Tidiness', warmth: 'Warmth', veg: 'Fresh greens', humid: 'Humidity', water: 'Moisture', sun: 'Sunlight', fertilize: 'Nutrients', prune: 'Shape' };
  G.isLevel = k => k in G.LEVEL_NAME;
  G.level = (p, k) => (typeof p.state.needs[k] === 'number' ? Math.min(1, Math.max(0, p.state.needs[k])) : 1);
  G.need = (p, k) => 1 - G.level(p, k);
  G.setNeed = (p, k, pressure) => { p.state.needs[k] = 1 - clamp(pressure); };
  G.levelName = (k, d) => G.LEVEL_NAME[k] || G.needLabel(k, d);
  G.vigor = p => Math.min(1, Math.max(0, 1 - p.state.frailty));
  /* 全部动作，含角色只能自己做的。界面上的菜单用 actionsOf，不含自己做的 */
  G.allActionsOf = p => {
    const out = {};
    const add = (defs) => {
      for (const k in defs || {}) {
        const d = defs[k];
        if (d.stages && !d.stages.includes(G.stage(p))) continue;
        if (!G.usable(p, d)) continue;
        const own = typeof d.label === 'object' ? (d.label[G.stage(p)] || d.label.default) : d.label;
        const lab = CY.tOr('act.' + k + '.' + G.stage(p), CY.tOr('act.' + k, own));
        out[k] = Object.assign({}, d, { label: lab, id: k, min: d.min !== undefined ? d.min : Math.max(G.E('game').action_min.floor, (d.hold || G.E('game').action_min.hold_default) * G.E('game').action_min.hold_factor) });
      }
    };
    add(p.species.actions);
    for (const c of p.person.conditions || []) add((G.tpl.conditions[c] || {}).actions);
    return out;
  };
  /* 玩家能对这个人做的动作。主角自己的圈里多出只有自己能做的，少了要出门的 */
  /* 点别人：只有照顾他的动作。点自己：自己做的动作，加上自己做不了替代的照顾动作（比如测血糖）。
     自己的需求只要有自己做的版本，就不再出现"帮别人做"的同名动作，所以不会又有倒水又有倒水喝，又有陪吃药又有自己吃药 */
  G.actionsOf = p => {
    const all = G.allActionsOf(p), out = {}, me = p === G.protagonist();
    if (!me) { for (const k in all) if (!all[k].selfonly) out[k] = all[k]; return out; }
    const covered = new Set(); for (const k in all) if (all[k].selfonly) for (const n in all[k].effect || {}) covered.add(n);
    for (const k in all) { const a = all[k]; if (a.away || a.outing) continue; if (a.selfonly || Object.keys(a.effect || {}).some(n => !covered.has(n))) out[k] = a; }
    return out;
  };
  G.maxNeed = p => Math.max(0, ...Object.keys(p.state.needs).map(k => G.need(p, k)));
  G.topNeed = p => { const d = G.needsOf(p); return Object.keys(d).sort((a, b) => G.need(p, b) - G.need(p, a))[0]; };
  /* 紧迫程度：最急的需求乘以类别的紧迫系数。不让玩家手动排优先级，由类别和当下的需求自然决定谁最急 */
  G.urgency = p => G.maxNeed(p) * G.classOf(p).urgency;
  /* 长按多久：动作本身的时长，乘以主角的年纪。老人手慢，圈转得慢些 */
  G.holdSeconds = a => { if (G.DEV) return 0; const pr = G.protagonist(), k = pr ? G.opt(G.E('game').actor_slow, G.stage(pr)) || 1 : 1; return +((typeof a.min === 'number' && a.min > 0 ? G.holdFor(a.min) : a.hold) * k).toFixed(1); };
  /* 对主角的称呼：家里的孩子按主角的名字叫，那是孩子的视角。外甥女，侄子，逃难来的孩子不是主角的孩子，主角是爸爸就叫叔叔，是妈妈就叫阿姨，是姑姑舅舅这类就照名字叫 */
  const NOT_MINE = ['maternal_niece', 'nephew', 'refugee_child'];
  G.titleFor = p => {
    const pr = G.protagonist();
    if (!pr) return t('player.title');
    const spk = p && p.person ? (p.person.archetype || p.person.card || '') : '', role = pr.person.archetype || pr.person.card || '';
    if (NOT_MINE.includes(spk) && (role === 'dad' || role === 'mom')) return t(role === 'dad' ? 'title.uncle' : 'title.aunt');
    return pr.person.name;
  };
  /* 称呼：内部用 he，she，it 三个码，显示时按当前语言取词，拉丁文字的语言在句首大写 */
  G.pronounWord = p => t('pron.sub.' + (PRON_CODE[G.pronoun(p)] || 'm'));
  G.fmt = (s, p) => {
    const w = G.pronounWord(p), cap = /^[a-zà-ÿ]/.test(w) && CY.i18n.lang !== 'zh-CN' && CY.i18n.lang !== 'zh-TW';
    /* 称呼和名字：有主角就用主角的名字，没有就用当前语言的默认叫法 */
    const pr = G.protagonist();
    let out = String(s).replace(/\{title\}/g, G.titleFor(p)).replace(/\{name\}/g, p ? p.person.name : pr ? pr.person.name : t('player.name'));
    out = out.replace(/(^|[.!?]\s+|[。！？]\s*)\{ta\}/g, (m, pre) => pre + (cap ? w.charAt(0).toUpperCase() + w.slice(1) : w));
    return out.replace(/\{ta\}/g, w);
  };

  /* ---------- 作息：睡觉，以及各自的状态 ---------- */
  const inWindow = (dm, a, b) => { a = (((a % 24) + 24) % 24) * 60; b = (((b % 24) + 24) % 24) * 60; return a <= b ? dm >= a && dm < b : dm >= a || dm < b; };
  /* 每个人的作息：类别给出基准，再按人的编号加一点固定的偏差，所以同一类的人也不会同时起床和吃饭；老人最早，成年人次之，孩子和青少年更晚 */
  const hash01 = (id, salt) => { const H = G.E('hash'); let h = H.fnv_offset; for (const ch of String(id) + salt) h = Math.imul(h ^ ch.charCodeAt(0), H.fnv_prime) >>> 0; return h / H.modulus; };
  G.routineOf = p => {
    if (!G.isHuman(p)) return null;
    const r = (G.classOf(p) || {}).routine; if (!r) return null;
    const off = salt => (hash01(p.id, salt) * 2 - 1) * (r.spread || 0), sys = (G.tpl.system || {}).routine || {};
    const morningBath = (sys.morning_bath_langs || []).includes(CY.i18n.lang);
    const wake = r.wake + off('w'), bed = r.bed + off('b');
    return { wake, bed, nap: r.nap ? r.nap.map(x => x + off('n')) : null, meals: (r.meals || []).map((x, i) => x + off('m' + i) * G.E('game').routine.meal_jitter), bath: morningBath ? wake + G.E('game').routine.morning_bath_offset + hash01(p.id, 'bm') * G.E('game').routine.morning_bath_spread : r.bath + off('h') };
  };
  /* 需求涨速随时间起伏：靠近某个时刻涨得快，其余时间慢一点；饭点前后饿得快，洗澡点前后觉得脏得快 */
  G.rhythm = (p, need) => {
    const R = G.routineOf(p), cfg = (((G.tpl.system || {}).routine || {}).rhythm || {})[need];
    if (!R || !cfg) return 1;
    const times = need === 'hygiene' ? [R.bath] : R.meals, h = G.dayMinutes() / 60;
    let m = 0;
    for (const x of times) { const d = Math.abs(((h - (x - G.E('game').rhythm_lead_hours) + 12) % 24 + 24) % 24 - 12); m = Math.max(m, 1 - d / cfg.width); }
    return cfg.lo + (cfg.hi - cfg.lo) * Math.max(0, m);
  };
  G.sleepWindow = p => {
    const SW = G.E('game').sleep_window;
    if (NOCTURNAL.includes(p.species.id)) return SW.nocturnal;
    const sh = G.traitMods(p).sleep_shift, R = G.routineOf(p);
    return R ? [R.bed + sh, R.wake + sh] : [SW.default_bed + sh, SW.default_wake + sh];
  };
  G.activityOf = p => {
    if (p === G.protagonist()) return CY.world && CY.world.leadSleeping() ? 'sleeping' : 'awake';   /* 主角睡不睡看他在不在床上：小睡，或者夜里在卧室里闲着 */
    if (p.species.id !== 'human' && !NOCTURNAL.includes(p.species.id)) return 'awake';
    if (G.flag(p, 'nap')) return 'sleeping';
    if (G.flag(p, 'awake')) return 'awake';   /* 被叫醒去看护，一会儿再睡 */
    const [a, b] = G.sleepWindow(p), dm = G.dayMinutes(), R = G.routineOf(p);
    if (R && R.nap && inWindow(dm, R.nap[0], R.nap[1]) && G.need(p, 'rest') > G.E('game').nap_min_level) return 'sleeping';   /* 幼儿和老人的午睡 */
    if (!inWindow(dm, a, b)) return 'awake';
    const cl = G.classOf(p);
    /* 夜里睡不着：除了 wake_except 里列的需求，别的需求压力到 wake_at 就睡不着。
       wake_except 是过渡性的字段：现在它只是把疲倦从"睡不着"里拿掉，让累垮的成人深睡；以后要被更深层的机制取代，用觉醒（压力，焦虑，夜里要照顾）决定入睡快慢和睡得深浅，累到睡不着和累到叫不醒由同一条规则长出来。
       在那之前，这个字段也可以留给其他临时的或特殊的机制，比如"必须有人醒着看着婴儿"这一类，写在类别或角色数据里，不写进代码。婴儿的疲倦不在其中，累过头会哭闹睡不着 */
    if (Math.max(0, ...Object.keys(p.state.needs).filter(k => !cl.wake_except.includes(k)).map(k => G.need(p, k))) > cl.wake_at) return 'awake';
    return cl.sleep_cycle ? ((dm % cl.sleep_cycle[0]) < cl.sleep_cycle[1] ? 'sleeping' : 'awake') : 'sleeping';
  };
  G.isSleeping = p => G.act[p.id] === 'sleeping';
  G.moodBand = p => { const B = G.E('game').mood_bands; return p.state.mood > B.great ? 'great' : p.state.mood > B.ok ? 'ok' : p.state.mood > B.low ? 'low' : 'bad'; };
  G.statusOf = p => ({
    activity: G.act[p.id] || G.activityOf(p), crying: !!G.crying[p.id], mood: G.moodBand(p),
    conditions: p.person.conditions || [], traits: p.person.traits || [], self_care: G.classOf(p).self_care,
  });

  /* 台词来源：角色自己写的优先，其次疾病里写的，最后是声线模板。 */
  /* 年龄分段：宝宝几个月，孩子几岁，说话不一样。婴儿 m0 m4 m7，幼儿 y1 y2 y3，儿童 c4 c7 */
  G.ageBand = p => {
    if (!G.isHuman(p)) return null;
    const a = G.age(p), st = G.stage(p);
    const AB = G.E('game').age_buckets;
    if (st === 'infant') return a * 12 < AB.infant_months[0] ? 'm0' : a * 12 < AB.infant_months[1] ? 'm4' : 'm7';
    if (st === 'toddler') return a < AB.toddler_years[0] ? 'y1' : a < AB.toddler_years[1] ? 'y2' : 'y3';
    if (st === 'child') return a < AB.child_years ? 'c4' : 'c7';
    return null;
  };
  /* 性格里的台词：键没有就退回 any 或 default。十三岁以下只用描写神态的那一对 */
  const traitLines = (p, group, key) => {
    const out = [], kid = G.isHuman(p) && G.age(p) < G.E('game').age_buckets.kid_age;
    for (const id of p.person.traits || []) {
      const tr = (G.tpl.traitLines || {})[id] || {};
      const tl = (kid ? tr.kid || {} : tr)[group]; if (!tl) continue;
      const v = Array.isArray(tl) ? tl : (key !== undefined && key !== null ? (tl[key] || tl.any || tl.default) : undefined);
      if (Array.isArray(v)) out.push(...v);
    }
    return out;
  };
  G.lines = (p, group, key) => {
    const pickFrom = src => (key === undefined || key === null) ? src : (src && !Array.isArray(src) && typeof src === 'object' ? src[key] : undefined);
    /* 卡里的专属台词是中文写的，只在中文界面用，别的语言走各自的声线 */
    const own = p.person.card && !p.person.lines_lang ? 'zh' : p.person.lines_lang, ownOk = !own || CY.i18n.lang.startsWith(own.slice(0, 2));
    const srcs = [ownOk ? (p.person.lines || {})[group] : undefined];
    for (const c of p.person.conditions || []) srcs.push((((G.tpl.conditions[c] || {}).lines) || {})[group]);
    const band = G.ageBand(p);
    if (band && p.voice.age && p.voice.age[band]) srcs.push(p.voice.age[band][group]);
    srcs.push(p.voice[group]);
    let base = [];
    for (const s of srcs) {
      const v = pickFrom(s);
      if (Array.isArray(v) && v.length) { base = v; break; }
      if (typeof v === 'string') { base = [v]; break; }
    }
    /* 性格的台词和声线的台词混在一起，按数量折算，有性格的角色说话明显不一样 */
    const tr = traitLines(p, group, key);
    if (!tr.length) return base;
    const reps = Math.max(1, Math.round(base.length / (tr.length * 2)));
    let out = base.slice();
    for (let i = 0; i < reps; i++) out = out.concat(tr);
    return out;
  };
  /* 同一个角色近来说过的不再重复 */
  const recent = {};
  G.pickFresh = (p, arr) => {
    /* 同一个人同一句话，十分钟内不重复（评估表 D10）：按现实时间记，不按条数记；候选都说过了才允许重复 */
    const now = Date.now(), r = (recent[p.id] = (recent[p.id] || []).filter(e => now - e.t < G.E('game').recent_window_ms));
    const fresh = arr.filter(x => !r.some(e => e.x === x)), x = pick(fresh.length ? fresh : arr);
    r.push({ x, t: now });
    return x;
  };
  const line = (p, group, key, fallback) => {
    const arr = G.lines(p, group, key);
    return G.fmt(arr.length ? G.pickFresh(p, arr) : fallback, p);
  };
  G.speechPool = p => ((p.person.personality && p.person.personality.catchphrases) || []).concat((G.sayings[p.id] || []).filter(s => s.by === 'char' && s.lib).map(s => s.text));

  /* ---------- 写文件 ---------- */
  let saveTimer = null;
  G.save = function (now) {
    clearTimeout(saveTimer);
    const run = () => {
      if (G.beforeSave) G.beforeSave();
      G.world.last_seen = new Date().toISOString();
      G.world.schema = CY.meta.schema;
      store.writeYaml(G.wpath('world.yaml'), G.world);
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
      if (G.saveCalendar) G.saveCalendar();
      if (G.saveCurves) G.saveCurves();
    };
    if (now) run(); else saveTimer = setTimeout(run, G.E('game').save_debounce_ms);
  };
  /* 发生的事。能翻译的记录同时存下文字的键 k 和参数 a，换语言后按当前语言重新生成；别人说过的原话留着原样。
     参数里要跟着语言变的词（动作名，需求名，地点，病名）用 G.ref 包一下 */
  G.ref = (keys, d) => ({ t: [].concat(keys), d });
  const refText = v => (v && typeof v === 'object' && v.t ? v.t.reduceRight((fb, k) => CY.tOr(k, fb), v.d) : v);
  G.entryText = e => (e.k && CY.i18n.hasOwn(e.k) ? t(e.k, Object.fromEntries(Object.entries(e.a || {}).map(([k, v]) => [k, refText(v)]))) : e.text);
  G.log = function (pid, type, text, meta) {
    const d = new Date(), mk = monthKey(d);
    const arr = ((G.journal[pid] = G.journal[pid] || {})[mk] = G.journal[pid][mk] || []);
    /* t 是现实时间，只用来排先后；day 和 cm 是游戏里的第几天和几点几分，界面显示这两个 */
    arr.push(Object.assign({ t: d.toISOString(), seq: G._logSeq = (G._logSeq || 0) + 1, day: G.gameDate().n, cm: Math.floor(G.dayMinutes()), type, text }, meta ? { k: meta.k, a: meta.a } : {}));   /* seq 是同一时刻的先后 */
    G.dirty.add(`j|${pid}|${mk}`);
    if (type === 'event' && G.get(pid)) G.pop(pid, 'event', '✨');
    G.save();
  };
  G.logK = (pid, type, key, args) => G.log(pid, type, G.entryText({ k: key, a: args }), { k: key, a: args });
  /* 动作名，需求名，病名，地点：跟着语言变 */
  G.refAct = (a, p) => G.ref(['act.' + a.id + '.' + G.stage(p), 'act.' + a.id], a.label);
  G.refNeed = (k, d) => G.ref('need.' + k, d.label);
  /* lib 是库里的编号，ans 是预设回答的序号或 custom。正文总是一起记下来。 */
  G.say = function (pid, by, text, lib, ans) {
    const item = { t: new Date().toISOString(), by, text };
    if (lib) item.lib = lib;
    if (ans !== undefined) item.ans = ans;
    (G.sayings[pid] = G.sayings[pid] || []).push(item);
    G.dirty.add(`s|${pid}`);
  };
  /* 头上弹出的事件：ask 有人开口要求，done 完成了打勾，event 发生了事情。界面和声音各自来取 */
  G.pops = []; G.popSeq = 0; G.popHooks = G.popHooks || [];
  G.pop = (pid, kind, icon) => {
    const e = { n: ++G.popSeq, pid, kind, icon, t: Date.now() };
    G.pops.push(e); if (G.pops.length > G.E('game').pops_max) G.pops.shift();
    for (const f of G.popHooks) f(e);
  };
  G.playFx = (pid, act) => { G.fx[pid] = { act, t: Date.now() }; G.pop(pid, 'done', '✓'); };

  /* ---------- 学习每个角色的节奏 ---------- */
  const learnOn = () => ini.bool(G.cfg, 'interaction', 'learn');
  function learn(p, kind, responded, latency) {
    if (!learnOn()) return;
    const L = p.state.learn, K = (L.kinds[kind] = L.kinds[kind] || { y: 0, n: 0 });
    if (responded) {
      K.y++; L.n_resp++;
      L.resp = L.n_resp === 1 ? latency : L.resp * G.E('game').learn.resp_keep + latency * (1 - G.E('game').learn.resp_keep);
      { const LN = G.E('game').learn; L.needy = clamp(L.needy + (latency < LN.fast_latency ? LN.needy_fast : LN.needy_slow), LN.needy_min, LN.needy_max); }
    } else {
      K.n++;
      { const LN = G.E('game').learn; L.needy = clamp(L.needy - LN.needy_drop, LN.needy_min, LN.needy_max); }
    }
  }
  const kindWeight = (p, kind, base) => {
    const K = p.state.learn.kinds[kind];
    if (!K || !learnOn()) return base;
    { const LN = G.E('game').learn; return base * clamp(1 + LN.k_slope * (K.y - K.n), LN.k_min, LN.k_max); }
  };
  const weighted = (items, w) => {
    const ws = items.map(w), sum = ws.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };
  const needyW = p => (learnOn() ? G.E('game').learn.needy_weight_base + p.state.learn.needy : 1);

  /* ---------- 时间推进 ---------- */
  function gameMinutes(realSeconds) {
    return realSeconds / 60 * G.speed();
  }
  const foodOf = p => p.species.food || 'food';
  const itemForNeed = (p, k) => (k === 'hunger' ? foodOf(p) : (G.tpl.items.for_need || {})[k]);

  /* 把一个动作的效果加到角色身上，scale 是效果的比例。玩家做和角色自己做都走这里 */
  /* 动作和选择带来的输入，攒着，下一次向积分引擎要状态时一起带过去 */
  const pulseBox = {};
  /* 每条带来源：player 玩家动作，dispatch 自动调度和家人自己做，event 随机事件和故事选择。积分后端按来源合并同一个输入 */
  G.pulse = (pid, key, source) => { if (key) (pulseBox[pid] = pulseBox[pid] || []).push({ id: String(key), source }); };
  G.takeActions = pid => { const l = pulseBox[pid] || []; delete pulseBox[pid]; return l; };
  function applyEffects(p, a, scale, source) {
    const s = p.state, mods = G.traitMods(p);
    G.pulse(p.id, a.id, source);
    const bo = G.shopBoost(p, a);   /* 买的东西让这一次动作的效果更多，只管当次，不改需求涨落的速度 */
    for (const k in a.effect || {}) if (k in s.needs) s.needs[k] = clamp(s.needs[k] + a.effect[k] * scale * (a.effect[k] > 0 ? (mods.effect[k] || 1) * (bo.scale[k] || 1) * bo.all : 1));   /* 效果是水平的增量，正数是补上 */
    if (bo.mood) s.mood = clamp(s.mood + bo.mood);
    if (a.frailty) s.frailty = clamp(s.frailty + a.frailty * (a.frailty > 0 ? mods.frailty : 1));
  }
  /* 这个动作这个角色自己做得了吗：卡里写了名单就按名单，没写就按年龄阶段 */
  G.canSelf = (p, a) => !!a.self && (p.person.self_actions ? p.person.self_actions.includes(a.id) : a.self === true || a.self.includes(G.stage(p)));
  /* 角色自己能做的动作：需求落在动作的效果里，并且这个阶段的角色自己做得了 */
  function selfActionFor(p, need) {
    return Object.values(G.allActionsOf(p)).find(a => G.canSelf(p, a) && a.effect && need in a.effect && a.effect[need] > 0);
  }
  /* 角色自己动手：效果打折，行动记进日志 */
  function selfAct(p, a, need, offline) {
    applyEffects(p, a, G.E('game').self_act.efficiency, 'dispatch');
    G.bus.emit('care', { kind: 'self', actor: p.id, target: p.id, action: a.id, need });
    p.state.mood = clamp(p.state.mood + G.E('game').self_act.mood);
    p.story.self_total = (p.story.self_total || 0) + 1;
    const lk = CY.i18n.hasOwn('selfact.' + a.id) ? 'selfact.' + a.id : 'log.self_did', la = { name: p.person.name, label: G.refAct(a, p) };
    const txt = t(lk, { name: p.person.name, label: a.label });
    if (!offline) { G.logK(p.id, 'self', lk, la); G.toastFor(p, txt, 'self'); G.pop(p.id, 'done', '✓'); }
    if (a.household && !offline) G.shareMeal(p, a, 1);   /* 家人自己做饭，也是全家一起吃；先记做了什么，再记全家吃上了 */
    return true;
  }
  G.selfActFor = selfActionFor;
  G.selfAct = selfAct;

  /* 卧床：类别数据 bedrest，老人是虚弱度到 0.8 躺下，降到 0.55 以下才起来。坐轮椅的家人本来就坐着，不算。躺着的人不能散步，去不了公园和街上，有轮椅才能被推出去 */
  G.bedridden = p => !!(p && p.state && p.state.bedrest);
  G.usable = (p, d) => {
    if (d.outing && d.outing.group && G.outingBlocked && G.outingBlocked(p)) return false;   /* 家里不能单独留下需要看护的人 */
    if (d.trip && (G.world.trip || (G.world.money || 0) < d.trip.cost)) return false;   /* 已经在路上，或钱不够 */
    if (d.walks && G.bedridden(p)) return false;
    if (d.needs_chair && !G.needsChair(p)) return false;   /* 推轮椅出去，只给需要轮椅的人 */
    if (d.outing && !d.needs_chair && G.legsBad(p) && !G.unlocked('wheelchair')) return false;   /* 腿脚不便的老人没有轮椅出不了门 */
    if (d.visitor_only && !(p.person && p.person.visitor)) return false;
    if (d.module && !G.module(d.module)) return false;   /* 属于某个可选模块的动作，模块关了就没有 */
    if (d.item && !G.unlocked(d.item)) return false;
    const need = d.item_for && d.item_for[G.stage(p)];
    return !need || G.unlocked(need) || !!(d.carry && d.carry.includes(G.stage(p)) && G.canCarry(G.stage(p)));
  };
  /* 外出的按钮没出现时，告诉玩家为什么：婴儿要婴儿车或成年人抱着，卧床的老人要轮椅，家里有不能单独留下又带不走的人。没有被拦下就返回空 */
  G.outingHint = p => {
    if (!p || p === G.protagonist() || !G.isHuman(p)) return '';
    const st = G.stage(p);
    const outs = Object.entries(p.species.actions || {}).filter(([k, d]) => (d.outing || d.walks) && k !== 'doctor' && (!d.stages || d.stages.includes(st)));
    if (G.needsChair(p) && !G.unlocked('wheelchair') && outs.some(([k, d]) => d.outing && !d.needs_chair)) return 'hint.need_wheelchair';   /* 还能搀着散步，但出不了门，也要说原因 */
    const oo = outs.filter(([k, d]) => d.outing && !d.needs_chair);   /* 有出门的动作就只看它们：搀着散步还能做，不该把出不了门的原因吞掉 */
    if (!outs.length || (oo.length ? oo : outs).some(([k, d]) => G.usable(p, d))) return '';
    for (const [k, d] of outs) {
      if (G.needsChair(p) && !G.unlocked('wheelchair')) return 'hint.need_wheelchair';
      if (d.item_for && d.item_for[st] && !G.unlocked(d.item_for[st]) && !(d.carry && d.carry.includes(st) && G.canCarry(st))) return 'hint.need_stroller';
      if (d.outing && d.outing.group && G.outingBlocked && G.outingBlocked(p)) return 'hint.cant_leave';
    }
    return '';
  };
  G.bedCheck = p => {
    const s = p.state;
    const br = G.isHuman(p) ? G.classOf(p).bedrest : null;   /* 类别数据：[躺下的虚弱度, 起来的虚弱度]，有滞后；没写的类别不会卧床 */
    if (!br || p.person.visitor || (p.person.archetype || p.person.card) === 'wheelchair_user') { if (s.bedrest) delete s.bedrest; return; }
    if (!s.bedrest && s.frailty >= br[0]) { s.bedrest = true; G.logK(p.id, 'frail', 'log.bedrest', { name: p.person.name }); G.toastFor(p, G.fmt(t('toast.bedrest'), p), 'soft'); }
    else if (s.bedrest && s.frailty < br[1]) { delete s.bedrest; G.logK(p.id, 'recovered', 'log.bedrest_end', { name: p.person.name }); }
  };
  /* 虚弱度跨过 0.7 或 0.5 时记一笔，游戏自己算的和后端给的都走这里 */
  G.frailCross = (p, was) => {
    const s = p.state;
    const FC = G.E('game').frailty_cross;
    if (was < FC.weak && s.frailty >= FC.weak) { G.logK(p.id, 'frail', 'log.frail', { name: p.person.name }); G.toastFor(p, G.fmt(t('toast.weak'), p), 'soft'); }
    if (was >= FC.recover && s.frailty < FC.recover) G.logK(p.id, 'recovered', 'log.recovered', { name: p.person.name });
    G.bedCheck(p);
  };

  /* 状态曲线用的历史：每 15 游戏分钟给每个人记一点需求、心情、虚弱度，只存在内存里，每人最多留 600 点，约六天半 */
  Object.defineProperty(G, 'HIST', { get: () => G.E('game').hist, configurable: true }); G.hist = {};   /* modules.js 在 game.js 之后载入，所以这里直接定义 */
  function sampleHist() {
    const gm = Math.floor(G.world.game_minutes), b = Math.floor(gm / G.HIST.step);
    if (G._histB === b) return;
    G._histB = b;
    for (const p of G.activePeople()) {
      const h = G.hist[p.id] = G.hist[p.id] || [];
      h.push({ t: gm, mood: p.state.mood, frailty: p.state.frailty, needs: Object.assign({}, p.state.needs) });
      if (h.length > G.HIST.keep) h.shift();
    }
    if (G.sampleWorldCurve) G.sampleWorldCurve(gm);
  }
  function advance(gmin, offline) {
    if (gmin <= 0) return;
    const ND = G.E('game').need_dynamics, hours = gmin / 60, hp = hours * G.pace();   /* 需求、虚弱、自理按配速折算的小时算，钟面小时只管几点 */
    const boost = G.freq() === 'test' && !offline ? G.E('game').test_boost : 1;
    G.world.game_minutes += gmin;
    if (G.awayTick) G.awayTick(offline);
    const external = ini.get(G.cfg, 'play', 'needs_source') === 'backend';
    const driven = (p, k) => external || (CY.backend && CY.backend.isDriven(p.id, k));
    for (const p of G.activePeople()) {
      const defs = G.needsOf(p), s = p.state, mods = G.traitMods(p), shop = G.shopFx(p);
      const prevAct = G.act[p.id];
      const act = G.act[p.id] = G.activityOf(p), sleeping = act === 'sleeping';
      const night = G.isNight();
      const nc = CY.coreNeeds && CY.coreNeeds.ready() ? CY.coreNeeds : null;
      /* 速率里除了时间以外的各个倍数：不同需求，时段，睡着，住院，外出，性格，物品，节律 */
      const chain = k => boost * (k === 'rest' && night ? 2 : 1) * (sleeping ? ND.sleeping_growth : 1) * (G.flag(p, 'hospital') ? ND.hospital_growth : 1) * (G.awayMult ? G.awayMult(p) : 1) * (mods.rate[k] || 1) * ((p.person.need_rate || {})[k] || 1) * (shop.rate[k] || 1) * G.rhythm(p, k);
      const cap = offline ? ND.offline_cap : 1, needsIn = {}, rates = {}, caps = {};
      for (const k in p.state.needs) if (nc && nc.has(k)) needsIn[k] = G.need(p, k);
      for (const k in defs) {
        if (driven(p, k)) continue;
        const modeled = nc && nc.has(k);
        if (k === 'rest' && sleeping) {
          if (modeled) { rates[k] = -ND.rest_sleep_recovery * G.pace() * shop.rest_sleep; caps[k] = 1; } else G.setNeed(p, 'rest', G.need(p, 'rest') - ND.rest_sleep_recovery * hp * shop.rest_sleep);
          continue;
        }
        if (modeled) { rates[k] = defs[k].rateNow * G.pace() * chain(k); caps[k] = cap; continue; }   /* 有模型的需求交给共享核心，没有的仍在这里涨 */
        G.setNeed(p, k, Math.min(cap, G.need(p, k) + defs[k].rateNow * hp * chain(k)));
      }
      const moodOn = !driven(p, 'mood');
      if (nc) {
        if (!moodOn && !Object.keys(rates).length) { /* 这个人的需求和心情都由别处推进，没有要算的 */ } else {
        let other = 0; for (const k of Object.keys(p.state.needs)) if (!nc.has(k)) other = Math.max(other, G.need(p, k));
        const out = nc.advance(p.id, gmin, { needs: needsIn, rates, caps, mood: s.mood, mood_on: moodOn ? 1 : 0, slope: ND.mood_target_slope, relax: ND.mood_relax, shift: mods.mood_offset + shop.mood, other_max: other });
        for (const k in rates) G.setNeed(p, k, out.needs[k]);
        if (moodOn) s.mood = out.mood;
        }
      } else if (moodOn) {
        let target = 1 - ND.mood_target_slope * G.maxNeed(p) + mods.mood_offset + shop.mood;
        s.mood = clamp(s.mood + (clamp(target) - s.mood) * Math.min(1, hours * ND.mood_relax));
      }
      if (offline) continue;
      if (prevAct === 'awake' && act === 'sleeping') G.toastFor(p, t('toast.sleep', { name: p.person.name }), 'soft');
      /* 没人管的时候，有的会自己动手：老人自己倒水做饭，孩子能做的少，婴儿什么也做不了 */
      const sc = G.classOf(p).self_care;
      if (sc > 0 && !sleeping && G.canAutoAct(p)) for (const k in defs) {
        if (G.need(p, k) > G.E('game').need_dynamics.self_act_level && Math.random() < sc * hp * G.E('game').need_dynamics.self_act_rate * boost) {
          const a = selfActionFor(p, k);
          if (a && selfAct(p, a, k, offline)) { if (p === G.protagonist() && a.at && CY.world.doAt) CY.world.doAt(a); break; }   /* 主角自己做的事要走到那个房间，摆那个姿势，和玩家点出来的一样 */
        }
      }
      if (!driven(p, 'frailty')) {
        const was = s.frailty;
        const ND = G.E('game').need_dynamics;
        if (G.maxNeed(p) > ND.frailty_up_level) s.frailty = clamp(s.frailty + ND.frailty_up * hp * boost * mods.frailty);
        else if (G.maxNeed(p) < ND.frailty_down_level) s.frailty = clamp(s.frailty - ND.frailty_down * hp);
        G.frailCross(p, was);
      }
    }
    G.bus.emit('advance', { gmin, offline: !!offline });
    if (!offline) sampleHist();
    if (G.economyTick) G.economyTick(gmin, offline);
    if (!offline && G.arcTick) G.arcTick();
    if (!offline) G.driveTick(gmin);
  }

  G.advance = advance;
  /* 推进一段时间，跨过午夜时在午夜处停一下先翻日，再走剩下的：午夜前后的事各记在各自的一天里，不会把前一天还没收口的记录冲掉 */
  G.advanceDay = (gmin, offline) => {
    const toMid = 1440 - (G.dayMinutes() % 1440);
    if (G.DAY.enabled && gmin > toMid + 1e-6 && toMid > 0) { advance(toMid, offline); G.dayRoll(); advance(gmin - toMid, offline); }
    else advance(gmin, offline);
  };

  /* ---------- 打断 ---------- */
  /* 打扰频率是内部设计，不在设置里；测试或仿真可以直接改 G.cfg.interrupt.frequency */
  G.freq = () => (G.cfg.interrupt || {}).frequency || 'normal';
  G.nextGapSeconds = () => {
    const f = G.freq();
    const K = G.E('game');
    if (f === 'test') return K.test_gap_seconds[0] + Math.random() * (K.test_gap_seconds[1] - K.test_gap_seconds[0]);
    const [lo, hi] = G.opt(K.interrupt_gap_minutes, f) || K.interrupt_gap_minutes.normal;
    return Math.max(K.min_gap_seconds, (lo + Math.random() * (hi - lo)) * 60 / G.speed());
  };
  function scheduleNext() {
    const s = G.nextGapSeconds();
    G.nextAt = isFinite(s) ? Date.now() + s * 1000 : Date.now() + G.E('game').retry_ms;
  }
  /* 闲聊气泡不能太密：画面上同时只有上限那么多个，请求在底部的对话卡里，不占这个数；超出的排队，前一个出现或消失后隔几秒再冒出来。揭示这类要紧的不排队 */
  const bub = () => (G.tpl && G.tpl.system && G.tpl.system.bubbles) || {};
  const liveToasts = () => Object.values(G.toast).filter(x => x.kind !== 'cry').length;
  const narrow = () => typeof document !== 'undefined' && !!(CY.ui && CY.ui.room && CY.ui.room.clientWidth && CY.ui.room.clientWidth < G.E('game').toasts.narrow_width);   /* 窄屏上界面只开一个请求气泡，说话气泡的上限也只有一个 */
  const cap = () => (CY.ui && CY.ui.sel ? 0 : (narrow() ? bub().narrow || 1 : bub().total || 1));   /* 操作面板开着时闲聊先不冒 */
  const showToast = (p, text, kind) => { G.toast[p.id] = { text, kind, until: Date.now() + (kind === 'reveal' ? G.E('game').toasts.reveal_ms : kind === 'cry' ? G.E('game').toasts.cry_ms : kind === 'self' ? G.E('game').toasts.self_ms : G.E('game').toasts.default_ms) }; };
  const gapMs = () => { const g = bub().gap_seconds; return (g[0] + Math.random() * (g[1] - g[0])) * 1000; };
  G.toastQ = []; G.toastGapUntil = 0;
  G.toastFor = (p, text, kind) => {
    kind = kind || 'soft';
    if (kind === 'cry' || kind === 'reveal' || !bub().total) { showToast(p, text, kind); return; }
    const now = Date.now();
    if (liveToasts() < cap() && now >= G.toastGapUntil && !G.toastQ.length) { showToast(p, text, kind); G.toastGapUntil = now + gapMs(); return; }
    G.toastQ = G.toastQ.filter(x => x.p !== p); G.toastQ.push({ p, text, kind, at: now });
  };
  G.toastTick = () => {
    const now = Date.now(), ttl = bub().queue_seconds * 1000;
    G.toastQ = G.toastQ.filter(x => now - x.at < ttl && G.get(x.p.id) && x.p.person.active !== false);
    while (G.toastQ.length && liveToasts() < cap() && now >= G.toastGapUntil) {
      const x = G.toastQ.shift(); showToast(x.p, x.text, x.kind); G.toastGapUntil = now + gapMs();
    }
  };

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

  const mkReq = G.mkReq = (o) => {
    if (o.kind === 'need' && G.get(o.pid)) G.pop(o.pid, 'ask', ((G.needsOf(G.get(o.pid)) || {})[o.need] || {}).icon || '❗');
    return Object.assign({ since: Date.now(), deadline: Date.now() + ini.num(G.cfg, 'interrupt', 'countdown_seconds') * 1000 }, o);
  };

  /* 台词和问答的适用关系：谁会说（arch），主角是谁（to），成对的（pairs，说话的人和主角）；没有主角时不卡 to */
  G.related = (q, p) => {
    const C = CY.content, archOf = x => C.archId(x && x.person ? x.person.archetype || x.person.card || '' : ''), spk = archOf(p), lead = G.protagonist(), role = archOf(lead), ids = a => a.map(C.archId);
    return (!q.arch || ids(q.arch).includes(spk)) && (!q.to || !lead || ids(q.to).includes(role)) && (!q.pairs || !!(lead && q.pairs.some(([a, b]) => C.archId(a) === spk && C.archId(b) === role)));
  };
  /* 候选的“说过的话”：同声线、还没选过的 */
  G.pickOptions = (p, n = G.E('game').pick_options_default) => {
    const taken = new Set((G.sayings[p.id] || []).map(s => s.lib).filter(Boolean));
    const v = p.person.voice || DEFAULT_VOICE[p.person.species] || 'sibling';
    const pool = G.tpl.sayLib.filter(x => x.voice === v && !taken.has(x.id) && G.related(x, p));
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
    let pool = G.tpl.asks.filter(q => fits(q.voice, v) && fits(q.stage, st) && fits(q.pronoun && q.pronoun.map(CY.content.pron), pr) && G.related(q, p) && (!q.min_age || G.age(p) >= q.min_age) && (sens || !q.sensitive));
    const mine = ((p.person.lines || {}).ask || []).filter(q => q && q.say).map((q, i) => ({ id: `own${i}`, say: q.say, answers: q.answers || [] }));
    pool = pool.concat(mine);
    const fresh = pool.filter(q => !recent.has(q.id));
    return fresh.length ? fresh : pool;
  };
  const GENERIC_ANSWERS = ['ans.generic1', 'ans.generic2', 'ans.generic3'];

  const eveningOk = () => G.freq() === 'test' || (G.dayMinutes() >= G.E('game').evening.from_hour * 60 && G.dayMinutes() < G.E('game').evening.to_hour * 60);
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
    if (G.world.story_pending) return;   /* 开局的选择和故事还没读完，家人先不打扰 */
    const awake = p => !G.isSleeping(p);
    const free = G.activePeople().filter(p => !p.person.visitor && !G.req[p.id] && awake(p) && p !== G.protagonist());
    if (!free.length) return;
    const needy = free.filter(p => G.maxNeed(p) > (p.person.kind === 'plant' ? G.E('game').fire.needy_level_plant : G.E('game').fire.needy_level));
    if (needy.length && Math.random() < G.E('game').fire.needy_chance) {
      const p = weighted(needy, q => G.urgency(q) * needyW(q) + G.E('game').fire.weight_floor), defs = G.needsOf(p), need = G.topNeed(p);
      const text = line(p, 'request', need, t('req.need_fallback', { name: p.person.name, need: G.needLabel(need, defs[need]) }));
      G.req[p.id] = mkReq({ pid: p.id, kind: 'need', need, text });
      G.say(p.id, 'char', text);
      return;
    }
    const talkers = free.filter(p => p.person.kind !== 'plant');
    if (!talkers.length) return;
    const p = weighted(talkers, needyW);
    const s = p.story;
    const CB = G.E('game').care_back, pCB = s.care_total >= CB.min_care ? Math.min(CB.cap, CB.base + CB.per_care * s.care_total) : 0;
    if (!s.revealed && s.cares_back_total >= CB.reveal_back && s.care_total >= CB.reveal_care) {
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
    /* 还不会说话的孩子没有“平时会说哪句”可回想 */
    const speaks = p.person.kind !== 'human' || G.age(p) >= 2;
    const picks = ini.bool(G.cfg, 'interaction', 'picks') && p.person.kind !== 'plant' && speaks ? G.pickOptions(p) : [];
    const nudgeOk = p.person.kind === 'human' && G.stage(p) !== 'infant' && G.tpl.nudges.length;
    const kinds = [
      ['choice', evs.length ? G.E('game').event_weights.choice : 0], ['ask', asks.length ? G.E('game').event_weights.ask : 0], ['pick', picks.length ? G.E('game').event_weights.pick : 0], ['nudge', nudgeOk ? G.E('game').event_weights.nudge : 0],
      ['glance', G.E('game').event_weights.glance], ['speech', G.E('game').event_weights.speech],
    ].map(([k, w]) => [k, kindWeight(p, k, w)]).filter(x => x[1] > 0);
    const kind = weighted(kinds, x => x[1])[0];

    if (kind === 'choice') {
      const ev = pick(evs);
      G.req[p.id] = mkReq({ pid: p.id, kind: 'choice', text: G.fmt(ev.say, p), choices: ev.choices });
      G.say(p.id, 'char', G.fmt(ev.say, p));
    } else if (kind === 'ask') {
      const q = pick(asks);
      const answers = (q.answers && q.answers.length ? q.answers : GENERIC_ANSWERS.map(k => t(k))).map(a => G.fmt(a, p));
      p.state.asked = (p.state.asked || []).concat(q.id).slice(-G.E('game').asked_keep);
      /* 问答题一律有倒计时，到时没答就当作没赶上 */
      G.req[p.id] = mkReq({ pid: p.id, kind: 'ask', askId: q.id, text: G.fmt(q.say, p), answers, deadline: Date.now() + ini.num(G.cfg, 'interrupt', 'countdown_seconds') * 1000 });
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
  /* 宝宝一直要人，需求超过一半就一直提示，隔一小会儿再叫一次；猫和狗也会隔一阵来要。别的角色安静 */
  G.nagAt = {};
  G.nagN = {};          /* 这一轮已经叫了几次没人理，叫得越久间隔越长，最长十六倍 */
  G.nagLogged = {};     /* 这一轮没人管的记录只留一次，免得发生的事被刷屏 */
  G.needy = p => p !== G.protagonist() && !!G.classOf(p).nag && !G.isSleeping(p) && !G.flag(p, 'hospital') && !G.flag(p, 'outing') && G.maxNeed(p) > G.E('game').need_call_level;
  G.nagTick = now => {
    for (const p of G.activePeople()) {
      if (!G.needy(p)) { delete G.nagN[p.id]; delete G.nagLogged[p.id]; continue; }
      if (G.req[p.id] || (G.nagAt[p.id] || 0) > now) continue;
      const defs = G.needsOf(p), need = G.topNeed(p), n = G.nagN[p.id] || 0;
      const text = line(p, 'request', need, t('req.need_fallback', { name: p.person.name, need: G.needLabel(need, defs[need]) }));
      G.req[p.id] = mkReq({ pid: p.id, kind: 'need', need, text, nag: true });
      if (n === 0) G.say(p.id, 'char', text);
      G.nagAt[p.id] = now + G.classOf(p).nag * 1000 * Math.min(16, Math.pow(2, n));
    }
  };

  function expire(req) {
    const p = G.get(req.pid);
    /* 问答，回想，提醒这类不急的弹窗，时间到了先收成一个小气泡挂在角色头上，还可以点开回答；再过两分钟才真的作废 */
    if (['ask', 'pick', 'nudge'].includes(req.kind) && !req.folded) { req.folded = true; req.deadline = Date.now() + G.E('game').fold_ms; emit(); return; }
    delete G.req[req.pid];
    learn(p, req.kind, false);
    if (req.kind === 'pick' || req.kind === 'nudge') return;
    if (req.kind === 'need') {
      /* 没赶上的时候，能自理的自己动手处理，不能自理的需求照旧 */
      const a = selfActionFor(p, req.need);
      if (a && G.classOf(p).self_care > 0 && selfAct(p, a, req.need, false)) return;
      if (req.nag) G.nagN[p.id] = (G.nagN[p.id] || 0) + 1;
      if (!req.nag || !G.nagLogged[p.id]) { G.logK(p.id, 'missed', 'log.missed_need_helpless', { name: p.person.name, text: req.text }); G.nagLogged[p.id] = true; }
      G.toastFor(p, t('toast.nobody'), 'soft');
    } else if (req.kind === 'choice') {
      const c = req.choices.find(x => x.liked) || req.choices[0];
      applyChoice(p, c, true);
    } else {
      G.logK(p.id, 'missed', 'log.missed_generic', { text: req.text });
      G.toastFor(p, t('toast.nevermind2'), 'soft');
    }
  }

  /* ---------- 玩家动作：现实模式长按立刻生效，故事模式点击要花掉游戏里的时间 ---------- */
  /* 做饭是做给吃饭的人：在家的、醒着的、吃得了饭的人都吃上，访客也在其内，婴儿幼儿不算，睡着的人这一顿赶不上。
     玩家做饭和家人自己做饭走同一处，家人自己做饭也是全家一起吃，不是只有做饭的人吃饱。返回有几位别人吃上了 */
  G.shareMeal = (cook, a, scale) => {
    const W0 = CY.world;
    let n = 0;
    for (const q of G.activePeople()) {
      if (q === cook || !G.isHuman(q) || ['infant', 'toddler'].includes(G.stage(q)) || G.isSleeping(q) || G.flag(q, 'hospital') || G.flag(q, 'outing') || (W0 && W0.locationOf(q).place !== 'home')) continue;
      const bo = G.shopBoost(q, a);
      for (const [k, v] of Object.entries(a.effect || {})) if (k in q.state.needs) q.state.needs[k] = clamp(q.state.needs[k] + v * scale * (v > 0 ? (bo.scale[k] || 1) : 1));
      if (bo.mood) q.state.mood = clamp(q.state.mood + bo.mood);
      n++;
    }
    G.logK(cook.id, 'event', 'log.meal_all', {});
    return n;
  };
  function applyAction(pid, actionId) {
    const p = G.get(pid), a = p && G.actionsOf(p)[actionId];
    if (!a) return false;
    const s = p.state;
    /* 对方这件事上还不需要：不做，说明原因。gate 写在动作数据里，需求是压力，低于 min 算还不需要 */
    if (a.gate && G.need(p, a.gate.need) < a.gate.min) {
      const why = t('refuse.not_tired', { name: p.person.name });
      G.toastFor(p, why, 'soft');
      return false;
    }
    G.nagN[pid] = 0; G.nagLogged[pid] = false;
    applyEffects(p, a, 1, 'player');
    if (G.arcCare) G.arcCare(p, a);
    const meal = () => { if (a.household) { G.shareMeal(p, a, 1); if (G.useGroceries) G.useGroceries(p, a); } };   /* 做饭的结果在这次动作的记录之后写 */
    if (a.trip && G.startTrip) G.startTrip(a);
    if (a.at && p === G.protagonist() && CY.world && CY.world.doAt) CY.world.doAt(a);   /* 自己做的动作：去那个房间做，摆那个姿势 */
    const goOut = () => {   /* 出门放在这次动作的记录之后做，先记做了什么，再记出门 */
      if (a.outing && G.startOuting) {
      G.startOuting(p, a);
      /* 带人出门，主角自己也一起去：去的是同一个地点，人回来了主角也回家 */
      const lead = G.protagonist(), W = CY.world;
      if (lead && lead !== p && W && W.moveTo && W.PLACES[a.outing.place]) { W.moveTo(a.outing.place, a.outing.room); W.escort = true; G.logK(G.youId(), 'event', 'me.go', { place: G.ref('loc.' + a.outing.place, a.outing.place) }); }
    }
    };
    /* 送人睡觉：睡着的人走到自己的床上躺下，睡这么多现实秒，不是效果一下子加上就算了 */
    if (a.nap && G.isHuman(p) && p !== G.protagonist()) { G.setFlag(p, 'nap', { minutes: G.realMin(a.nap) }); G.act[p.id] = G.activityOf(p); }
    if (a.flag && a.flag.name) G.setFlag(p, a.flag.name, { minutes: a.flag.minutes });
    s.mood = clamp(s.mood + (a.mood === undefined ? G.E('game').go_mood_default : a.mood));
    p.story.care_total++;
    { const lead = G.protagonist(); G.bus.emit('care', a.selfonly && p === lead ? { kind: 'self', actor: pid, target: pid, action: actionId } : { kind: 'player', actor: lead ? lead.id : null, target: pid, action: actionId }); }
    /* 带去看医生一类的动作直接治好某些病 */
    for (const c of a.heals || []) {
      if ((p.person.conditions || []).includes(c)) { p.person.conditions = p.person.conditions.filter(x => x !== c); store.writeYaml(`people/${p.id}/person.yaml`, p.person); G.logK(p.id, 'recovered', 'log.healed', { name: p.person.name, cond: G.ref('cond.' + c, (G.tpl.conditions[c] || {}).label || c) }); }
    }
    /* 急性的病好起来：照顾够了次数就痊愈 */
    for (const c of [...(p.person.conditions || [])]) {
      const ha = (G.tpl.conditions[c] || {}).heal_after;
      if (ha && a.effect && ha.need in a.effect) {
        s.heal = s.heal || {}; s.heal[c] = (s.heal[c] || 0) + 1;
        if (s.heal[c] >= ha.count) {
          p.person.conditions = p.person.conditions.filter(x => x !== c); delete s.heal[c];
          store.writeYaml(`people/${p.id}/person.yaml`, p.person);
          G.logK(p.id, 'recovered', 'log.healed', { name: p.person.name, cond: G.ref('cond.' + c, (G.tpl.conditions[c] || {}).label || c) });
        }
      }
    }
    const req = G.req[pid];
    if (req && req.kind === 'need') {
      if (G.need(p, req.need) < G.E('game').answer_level) { delete G.req[pid]; learn(p, 'need', true, (Date.now() - req.since) / 1000); }
    }
    if (p === G.protagonist() && a.selfonly) {
      /* 自己做自己的事：旁白一句，不是被照顾的人道谢 */
      const lk = CY.i18n.hasOwn('selfact.' + a.id) ? 'selfact.' + a.id : 'log.self_did', la = { name: p.person.name, label: G.refAct(a, p) };
      G.toastFor(p, t(lk, { name: p.person.name, label: a.label }), 'soft'); G.logK(pid, 'self', lk, la);
      goOut(); meal(); G.playFx(pid, actionId); G.save(); emit();
      return true;
    }
    let tx = line(p, 'thanks', actionId, line(p, 'thanks', a.thanks_as || 'default', line(p, 'thanks', 'default', t('line.ok'))));
    /* 要不要说不一样的话，由后端决定：受了伤，在医院，到了某个次数 */
    const dres = G.drive('action', { person: p, action: { id: actionId, label: a.label }, collect: true });
    if (dres && dres.said) tx = dres.said;
    G.toastFor(p, tx, 'speech'); G.say(pid, 'char', tx);
    G.logK(pid, 'care', 'log.care', { who: G.protagonist() ? G.protagonist().person.name : G.ref('player.name', t('player.name')), name: p.person.name, label: G.refAct(a, p), line: tx });   /* 玩家做的也直说谁照顾了谁，和家人之间一样 */
    goOut(); meal();
    G.playFx(pid, actionId);
    G.save(); emit();
    return true;
  }
  G.applyAction = applyAction;

  /* 闲谈：不用你做什么，隔一阵有人随口说一句。说什么由后端按房间，时段，旧事挑 */
  function ambientChat() {
    const cands = G.activePeople().filter(p => !p.person.visitor && !G.toast[p.id] && !G.req[p.id] && p !== G.protagonist());
    if (!cands.length) return;
    const p = pick(cands), loc = CY.world ? CY.world.locationOf(p) : { room: 'living' };
    const hr = G.dayMinutes() / 60, CK = G.E('clock'), TB = G.E('game').time_bands, band = hr < CK.night_to || hr >= CK.night_from ? 'night' : hr < TB.morning_to ? 'morning' : hr < TB.noon_to ? 'noon' : 'evening';
    const text = G.sayLine(p, 'ambient', null, { room: loc.room, band, asleep: G.isSleeping(p) }, tx => G.toastFor(p, G.fmt(tx, p), 'soft'));
    if (text) G.toastFor(p, text, 'soft');
  }
  G.ambientChat = ambientChat;
  G.perform = function (pid, actionId) { return G.worldGuard ? G.worldGuard(pid, () => applyAction(pid, actionId)) : applyAction(pid, actionId); };
  G.cancelAllTasks = () => { G.world.tasks = []; emit(); };
  /* 回答问答题：idx 是预设回答的序号，custom 是玩家自己写的 */
  G.answerAsk = function (pid, idx, custom) {
    const p = G.get(pid), req = G.req[pid];
    if (!req || req.kind !== 'ask') return;
    const text = custom !== undefined && custom !== null ? String(custom).trim() : req.answers[idx];
    if (!text) return;
    delete G.req[pid];
    G.say(pid, 'you', text, req.askId, custom !== undefined && custom !== null ? 'custom' : idx);
    G.logK(pid, 'talk', 'log.talk', { q: req.text, a: text });
    p.story.care_total++; p.state.mood = clamp(p.state.mood + G.E('game').answer_reward.care_mood);
    if (p.person.visitor && G.visitorFav) G.visitorFav(p, G.FAV.ask);   /* 回答来客的问题，好感加一点 */
    /* 来客自己带着回答：卡片里写的一句，选了劝你歇一歇的那个回答，主角的休息需求就降一点 */
    const rp = req.reply || G.sayLine(p, 'reply', custom !== undefined && custom !== null ? 'custom' : 'a' + idx);
    if (req.rest !== undefined && req.rest === idx) { const lead = G.protagonist(); if (lead && lead.state.needs.rest !== undefined) G.setNeed(lead, 'rest', Math.max(0, G.need(lead, 'rest') - G.E('game').answer_reward.rest_relief)); }
    G.toastFor(p, rp || line(p, 'thanks', 'default', t('line.ok')), 'speech');
    learn(p, 'ask', true, (Date.now() - req.since) / 1000);
    G.playFx(pid, 'talk');
    G.save(); emit();
  };
  function applyChoice(p, c, auto) {
    p.state.mood = clamp(p.state.mood + (c.mood || 0));
    p.state.frailty = clamp(p.state.frailty + (c.frailty || 0));
    if (c.pulse) G.pulse(p.id, c.pulse, 'event');
    const reply = G.fmt(c.reply, p);
    G.toastFor(p, reply, 'speech'); G.say(p.id, 'char', reply);
    G.logK(p.id, 'event', auto ? 'log.dinner_auto' : 'log.dinner', { name: p.person.name, label: c.label, reply });
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
    G.logK(pid, 'picked', 'log.picked', { name: p.person.name, text });
    G.toastFor(p, text, 'speech');
    learn(p, 'pick', true, (Date.now() - req.since) / 1000);
    G.save(); emit();
  };
  G.answerNudge = function (pid, yes) {
    const req = G.req[pid];
    if (!req || req.kind !== 'nudge') return;
    const p = G.get(pid);
    delete G.req[pid];
    if (yes) {
      p.story.nudge_done++;
      G.logK(pid, 'nudge', 'log.nudge', { name: p.person.name, text: (G.tpl.nudges.find(n => n.id === req.nudge) || {}).text || '' });
      G.toastFor(p, t('toast.go'), 'soft');
    } else G.toastFor(p, t('toast.later'), 'soft');
    learn(p, 'nudge', !!yes, (Date.now() - req.since) / 1000);
    G.save(); emit();
  };
  G.dismiss = function (pid) {
    const r = G.req[pid]; if (!r) return;
    delete G.req[pid];
    learn(G.get(pid), r.kind, false);
    if (r.kind !== 'pick' && r.kind !== 'nudge') G.logK(pid, 'missed', 'log.put_down', { text: r.text });
    emit();
  };

  /* ---------- 心跳 ---------- */
  G.tick = function () {
    const now = Date.now(), dt = Math.min((now - G.lastTick) / 1000, G.E('game').tick.dt_max_seconds);
    G.lastTick = now;
    G.advanceDay(gameMinutes(dt), false);
    G.dayRoll();
    for (const id in G.req) if (G.req[id].deadline && now > G.req[id].deadline) expire(G.req[id]);
    for (const id in G.toast) if (now > G.toast[id].until) { delete G.toast[id]; G.toastGapUntil = Math.max(G.toastGapUntil, now + gapMs()); }
    G.toastTick();
    /* 婴幼儿需求严重时会一直哭闹，直到有人管 */
    const was = G.crying; G.crying = {};
    for (const p of G.activePeople()) {
      if (!G.classOf(p).cries || G.maxNeed(p) <= G.classOf(p).cry_at || G.isSleeping(p)) continue;
      G.crying[p.id] = true;
      if (!was[p.id]) G.logK(p.id, 'cry', 'log.cry', { name: p.person.name, need: G.refNeed(G.topNeed(p), G.needsOf(p)[G.topNeed(p)]) });
    }
    if (now >= G.nextAt) { if (G.activePeople().length) fire(); scheduleNext(); }
    const wk = G.isWorkTime();
    if (G._wk !== undefined && G._wk !== wk && G.activePeople().length) G.logK(G.youId(), 'event', wk ? 'me.work_start' : 'me.work_end', {});
    G._wk = wk;
    if (G.worldTick) G.worldTick(now);
    G.nagTick(now);
    if (G.agentTick) G.agentTick(dt);
    if (G.dispatchTick) G.dispatchTick(dt);
    if (G.socialTick) G.socialTick(dt);
    if (now >= (G.nextAmbient || 0)) { G.nextAmbient = now + G.E('game').tick.ambient_ms[0] + Math.random() * (G.E('game').tick.ambient_ms[1] - G.E('game').tick.ambient_ms[0]); if (!G.isPaused() && G.activePeople().length) ambientChat(); }
    emit();
  };
  G.start = function () {
    for (const p of G.activePeople()) G.act[p.id] = G.activityOf(p);
    G.lastTick = Date.now();   /* 关掉页面期间游戏不走，从停下的时刻接着走 */
    G._dayN = G.gameDate().n;
    scheduleNext();
    G.nextAt = Date.now() + G.E('game').tick.first_fire_ms;
    clearInterval(G.timer);
    G.timer = setInterval(G.tick, 1000);
    clearInterval(G.saveIv);
    G.saveIv = setInterval(() => G.save(true), G.E('game').tick.autosave_ms);
  };
  G.stop = function () { clearInterval(G.timer); };
})(globalThis.CY = globalThis.CY || {});
