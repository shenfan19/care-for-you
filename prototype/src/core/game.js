/* 游戏逻辑，不碰界面。数据都来自 store 里的明文文件。文字都通过 CY.t 取，所以换语言不用改这里。
   核心是照顾的代价：现实模式下长按占用你现实里的时间，故事模式下点击占用游戏里的时间，完整体验里工作赚钱，照顾要用物品。 */
(function (CY) {
  const { ini, store } = CY;
  const t = (k, v) => CY.t(k, v);
  const G = CY.game = {
    cfg: {}, people: [], world: { game_minutes: 0 }, req: {}, toast: {}, fx: {}, crying: {}, act: {}, journal: {}, sayings: {},
    tpl: { species: {}, conditions: {}, voices: {}, sayLib: [], nudges: [], asks: [], skills: {}, persona: null, classes: {}, traits: {}, items: { items: {}, start: {}, for_need: {} } },
    listeners: [], timer: null, nextAt: 0, lastTick: Date.now(), dirty: new Set(),
  };
  /* 打扰间隔，单位是游戏分钟，所以真实时间下是真实分钟，压缩时间下会按比例变短。test 档单位是现实秒。 */
  const GAP = { often: [20, 60], normal: [60, 180], rare: [240, 600] };
  const GAP_TEST = [15, 40];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const monthKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const DEFAULT_VOICE = { cat: 'cat', dog: 'dog', snake: 'snake', rabbit: 'rabbit', hamster: 'hamster', bird: 'bird', fish: 'fish', turtle: 'turtle', guineapig: 'rabbit', gecko: 'snake', hedgehog: 'hedgehog', duck: 'duck', ferret: 'ferret', axolotl: 'axolotl', chicken: 'chicken', orchid: 'plant', bamboo: 'plant', succulent: 'plant', flower: 'plant', tree: 'plant', cactus: 'plant' };
  const PLANTS = ['succulent', 'flower', 'tree', 'cactus', 'orchid', 'bamboo'];
  const NOCTURNAL = ['hamster', 'hedgehog', 'gecko'];
  const CHILDLIKE = ['child', 'infant', 'toddler', 'teen'];
  const PRON_CODE = { '他': 'm', '她': 'f', '它': 'n' };

  G.on = fn => G.listeners.push(fn);
  const emit = () => G.listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  G._h = { emit, clamp, pick, applyEffects, consume };   /* 拆出去的文件用，函数声明会提升 */
  G.emit = emit;
  G.saveCfg = () => store.write('settings.ini', ini.stringify(G.cfg));

  /* ---------- 载入 ---------- */
  const CONTENT_FILES = ['sayings', 'asks', 'nudges'];
  /* 台词、说话库、问答库、提醒库是内容包，按语言放在 templates/content/语言 下，缺的从内置内容补上 */
  async function loadContent(files) {
    const L = CY.i18n.lang, dir = `templates/content/${L}/`;
    /* 旧版本放在 templates/voices 和 templates/library 下的中文内容，搬到新位置，保住玩家改过的字 */
    if (L === 'zh-CN') {
      for (const p of files.slice()) {
        let to = null;
        const v = p.match(/^templates\/voices\/([^/]+)\.yaml$/), l = p.match(/^templates\/library\/([^/]+)\.yaml$/);
        if (v) to = `${dir}voices/${v[1]}.yaml`; else if (l) to = `${dir}library/${l[1]}.yaml`;
        if (to && !files.includes(to)) { await store.write(to, await store.read(p)); files.push(to); }
      }
    }
    const seed = CY.seed.contentFiles(L);
    for (const p in seed) {
      if (!files.includes(p)) { await store.write(p, seed[p]); files.push(p); continue; }
      try { const cur = jsyaml.load(await store.read(p)) || {}, nv = (jsyaml.load(seed[p]) || {}).version || 1; if ((cur.version || 1) < nv) await store.write(p, seed[p]); } catch (e) { await store.write(p, seed[p]); }
    }
    G.tpl.voices = {};
    for (const p of files) { const m = p.match(new RegExp('^' + dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 'voices/([^/]+)\\.yaml$')); if (m) { const x = await store.readYaml(p); if (x) G.tpl.voices[x.id || m[1]] = x; } }
    G.tpl.sayLib = ((await store.readYaml(dir + 'library/sayings.yaml')) || {}).items || [];
    G.tpl.nudges = ((await store.readYaml(dir + 'library/nudges.yaml')) || {}).items || [];
    G.tpl.asks = ((await store.readYaml(dir + 'library/asks.yaml')) || {}).items || [];
    G.tpl.traitLines = (await store.readYaml(dir + 'traits.yaml')) || {};
    /* 疾病的台词和事件文字：当前语言的覆盖到疾病模板上 */
    const conds = (await store.readYaml(dir + 'conditions.yaml')) || {};
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
  G.reloadContent = async function () {
    const files = await store.list();
    for (const p of files) {
      const m = p.match(/^templates\/conditions\/([^/]+)\.yaml$/);
      if (m) { const x = await store.readYaml(p); if (x) G.tpl.conditions[x.id || m[1]] = x; }
    }
    await loadContent(files);
    emit();
  };

  G.load = async function () {
    if (!(await store.list()).includes('settings.ini')) {
      const seed = CY.seed.files();
      for (const p in seed) await store.write(p, seed[p]);
    }
    G.cfg = ini.parse((await store.read('settings.ini')) || '');
    CY.i18n.set(CY.i18n.detect(ini.get(G.cfg, 'ui', 'language')));
    G.world = Object.assign({ game_minutes: 0, last_seen: '' }, await store.readYaml('world.yaml'));
    const files = await store.list();
    /* 新增的模板文件补上；内置模板的版本比文件里新，就用新的覆盖，旧的留在 _backup 里 */
    const seed = CY.seed.files();
    for (const p in seed) {
      if (!/^templates\//.test(p)) continue;
      if (!files.includes(p)) { await store.write(p, seed[p]); files.push(p); continue; }
      if (/^templates\/(species|conditions)\/|^templates\/(classes|traits|economy\/items|events\/rules)\.yaml$/.test(p)) {
        try { const cur = jsyaml.load(await store.read(p)) || {}, nv = (jsyaml.load(seed[p]) || {}).version || 1; if ((cur.version || 1) < nv) await store.write(p, seed[p]); } catch (e) { await store.write(p, seed[p]); }
      }
    }
    G.tpl = { species: {}, conditions: {}, voices: {}, sayLib: [], nudges: [], asks: [], skills: {}, persona: null, classes: {}, traits: {}, items: { items: {}, start: {}, for_need: {} } };
    for (const p of files) {
      const m = p.match(/^templates\/(species|conditions)\/([^/]+)\.yaml$/);
      if (m) { const x = await store.readYaml(p); if (x) G.tpl[m[1]][x.id || m[2]] = x; }
      const sk = p.match(/^templates\/ai\/skills\/([^/]+)\.yaml$/);
      if (sk) { const x = await store.readYaml(p); if (x) G.tpl.skills[x.id || sk[1]] = x; }
    }
    G.tpl.persona = await store.readYaml('templates/ai/persona.yaml');
    G.tpl.rules = ((await store.readYaml('templates/events/rules.yaml')) || {}).rules || [];
    G.tpl.classes = ((await store.readYaml('templates/classes.yaml')) || {}).classes || {};
    G.tpl.traits = ((await store.readYaml('templates/traits.yaml')) || {}).traits || {};
    G.tpl.items = Object.assign({ items: {}, start: {}, for_need: {} }, await store.readYaml('templates/economy/items.yaml'));
    const st = G.tpl.items.start || {};
    if (typeof G.world.money !== 'number') G.world.money = st.money || 0;
    if (!G.world.inv) G.world.inv = Object.assign({}, st.inv || {});
    if (!G.world.nanny || typeof G.world.nanny.days_left !== 'number') G.world.nanny = { days_left: 0, owed: 0, paid_today: 0, day: -1 };
    delete G.world.tasks;
    delete G.world.busy;
    G.people = []; G.journal = {}; G.sayings = {};
    const ids = [...new Set(files.map(p => (p.match(/^people\/([^/]+)\//) || [])[1]).filter(Boolean))].sort();
    for (const id of ids) {
      const person = await store.readYaml(`people/${id}/person.yaml`);
      if (!person) continue;
      person.id = id;
      const species = G.tpl.species[person.species];
      if (!species) { console.warn('找不到物种模板', person.species); continue; }
      /* 肤色色板加了两档偏白的，旧存档里的肤色序号按新色板换算，保持原来的颜色 */
      if (person.appearance && typeof person.appearance.skin === 'number' && person.appearance.skin_v !== 2) { person.appearance.skin = [1, 2, 4, 5, 6, 7][person.appearance.skin] || 2; person.appearance.skin_v = 2; }
      if (person.kind === 'human' && typeof person.age !== 'number') person.age = CY.content.AGE_OF_STAGE[person.age_stage] || 35;
      const state = Object.assign({ version: 1, needs: {}, mood: 0.6, frailty: 0.1, last_seen: '', asked: [], heal: {} }, await store.readYaml(`people/${id}/state.yaml`));
      state.learn = Object.assign({ needy: (person.personality && person.personality.talkative) || 0.5, resp: 0, n_resp: 0, kinds: {} }, state.learn);
      const story = Object.assign({ version: 1, care_total: 0, cares_back_total: 0, revealed: false, nudge_done: 0, self_total: 0 }, await store.readYaml(`people/${id}/story.yaml`));
      const p = { id, person, species, state, story, voice: {} };
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
    G.journal.you = {};
    for (const f of files.filter(f => f.startsWith('me/journal/'))) { const j = await store.readYaml(f); G.journal.you[f.split('/').pop().replace('.yaml', '')] = (j && j.entries) || []; }
    await loadContent(files);
    G.req = {}; G.toast = {}; G.fx = {}; G.crying = {}; G.act = {};
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
      kind: human ? 'human' : PLANTS.includes(species) ? 'plant' : 'animal', species,
      appearance: Object.assign({}, spec.look || arch.look || {}, typeof (spec.look || arch.look || {}).skin === 'number' ? { skin_v: 2 } : {}), personality: { talkative: 0.5, temper: '', catchphrases: [] },
      traits: (spec.traits || []).slice(0, 2), conditions: spec.conditions || [], lines: {},
    };
    if (human) person.age = age;
    if (human) person.helper = typeof spec.helper === 'boolean' ? spec.helper : ['mom', 'dad', 'wife', 'husband'].includes(spec.arch);
    await store.writeYaml(`people/${id}/person.yaml`, person);
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
    if (typeof patch.name === 'string' && patch.name.trim()) o.name = patch.name.trim();
    if (patch.pronoun) o.pronoun = patch.pronoun;
    if (patch.look) o.appearance = Object.assign({}, o.appearance, patch.look);
    if (Array.isArray(patch.traits)) o.traits = patch.traits.slice(0, 2);
    if (typeof patch.helper === 'boolean') o.helper = patch.helper;
    if (Array.isArray(patch.conditions)) o.conditions = patch.conditions.slice();
    if (G.isHuman(p) && typeof patch.age === 'number') {
      o.age = patch.age;
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
    delete G.journal[pid]; delete G.sayings[pid];
    for (const m of [G.req, G.toast, G.fx, G.crying, G.act]) delete m[pid];
    for (const k of [...G.dirty]) if (k.split('|')[1] === pid) G.dirty.delete(k);
    await store.removeDir(`people/${pid}`);
    G.save(true);
    emit();
  };

  /* ---------- 查询 ---------- */
  G.activePeople = () => G.people.filter(p => p.person.active !== false);
  G.get = id => G.people.find(p => p.id === id);
  G.isHuman = p => p.species.id === 'human';
  G.age = p => (typeof p.person.age === 'number' ? p.person.age : 35);
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
    const c = Object.assign({ urgency: 1, self_care: 0.3 }, G.tpl.classes[G.classKey(p)]);
    c.self_care = clamp(c.self_care + G.traitMods(p).self_care, 0, 0.98);
    return c;
  };
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
  /* 全部动作，含角色只能自己做的。界面上的菜单用 actionsOf，不含自己做的 */
  G.allActionsOf = p => {
    const out = {};
    const add = (defs) => {
      for (const k in defs || {}) {
        const d = defs[k];
        if (d.stages && !d.stages.includes(G.stage(p))) continue;
        const own = typeof d.label === 'object' ? (d.label[G.stage(p)] || d.label.default) : d.label;
        const lab = CY.tOr('act.' + k + '.' + G.stage(p), CY.tOr('act.' + k, own));
        out[k] = Object.assign({}, d, { label: lab, id: k, min: d.min !== undefined ? d.min : Math.max(3, (d.hold || 3) * 3) });
      }
    };
    add(p.species.actions);
    for (const c of p.person.conditions || []) add((G.tpl.conditions[c] || {}).actions);
    return out;
  };
  G.actionsOf = p => { const all = G.allActionsOf(p), out = {}; for (const k in all) if (!all[k].selfonly) out[k] = all[k]; return out; };
  G.maxNeed = p => Math.max(0, ...Object.values(p.state.needs));
  G.topNeed = p => { const d = G.needsOf(p); return Object.keys(d).sort((a, b) => p.state.needs[b] - p.state.needs[a])[0]; };
  /* 紧迫程度：最急的需求乘以类别的紧迫系数。不让玩家手动排优先级，由类别和当下的需求自然决定谁最急 */
  G.urgency = p => G.maxNeed(p) * G.classOf(p).urgency;
  G.holdSeconds = a => (typeof a.min === 'number' && a.min > 0 ? G.holdFor(a.min) : a.hold) * ini.num(G.cfg, 'interaction', 'hold_scale');
  /* 称呼：内部用他她它三个码，显示时按当前语言取词，拉丁文字的语言在句首大写 */
  G.pronounWord = p => t('pron.sub.' + (PRON_CODE[G.pronoun(p)] || 'm'));
  G.fmt = (s, p) => {
    const w = G.pronounWord(p), cap = /^[a-zà-ÿ]/.test(w) && CY.i18n.lang !== 'zh-CN' && CY.i18n.lang !== 'zh-TW';
    /* 称呼和名字用设置里的，没改过就用当前语言的默认叫法 */
    const dflt = (k, tk) => { const v = ini.get(G.cfg, 'player', k); return v === (ini.SCHEMA.find(x => x[0] === 'player' && x[1] === k) || [])[2] ? t(tk) : v; };
    let out = String(s).replace(/\{title\}/g, dflt('title', 'player.title')).replace(/\{name\}/g, p ? p.person.name : dflt('name', 'player.name'));
    out = out.replace(/(^|[.!?]\s+|[。！？]\s*)\{ta\}/g, (m, pre) => pre + (cap ? w.charAt(0).toUpperCase() + w.slice(1) : w));
    return out.replace(/\{ta\}/g, w);
  };

  /* ---------- 作息：睡觉，以及各自的状态 ---------- */
  const inWindow = (dm, a, b) => { a = (((a % 24) + 24) % 24) * 60; b = (((b % 24) + 24) % 24) * 60; return a <= b ? dm >= a && dm < b : dm >= a || dm < b; };
  G.sleepWindow = p => {
    if (NOCTURNAL.includes(p.species.id)) return [10, 18];
    const sh = G.traitMods(p).sleep_shift;
    return [22 + sh, 6.5 + sh];
  };
  G.activityOf = p => {
    if (p.species.id !== 'human' && !NOCTURNAL.includes(p.species.id)) return 'awake';
    const [a, b] = G.sleepWindow(p), dm = G.dayMinutes();
    if (!inWindow(dm, a, b)) return 'awake';
    const st = G.stage(p);
    if (st === 'infant') return G.maxNeed(p) > 0.9 ? 'awake' : (dm % 180) < 120 ? 'sleeping' : 'awake';
    return G.maxNeed(p) > 0.95 ? 'awake' : 'sleeping';
  };
  G.isSleeping = p => G.act[p.id] === 'sleeping';
  G.moodBand = p => (p.state.mood > 0.75 ? 'great' : p.state.mood > 0.5 ? 'ok' : p.state.mood > 0.3 ? 'low' : 'bad');
  G.statusOf = p => ({
    activity: G.act[p.id] || G.activityOf(p), crying: !!G.crying[p.id], mood: G.moodBand(p),
    conditions: p.person.conditions || [], traits: p.person.traits || [], self_care: G.classOf(p).self_care,
  });

  /* 台词来源：角色自己写的优先，其次疾病里写的，最后是声线模板。 */
  /* 年龄分段：宝宝几个月，孩子几岁，说话不一样。婴儿 m0 m4 m7，幼儿 y1 y2 y3，儿童 c4 c7 */
  G.ageBand = p => {
    if (!G.isHuman(p)) return null;
    const a = G.age(p), st = G.stage(p);
    if (st === 'infant') return a * 12 < 4 ? 'm0' : a * 12 < 7 ? 'm4' : 'm7';
    if (st === 'toddler') return a < 2 ? 'y1' : a < 3 ? 'y2' : 'y3';
    if (st === 'child') return a < 7 ? 'c4' : 'c7';
    return null;
  };
  /* 性格里的台词：键没有就退回 any 或 default。十三岁以下只用描写神态的那一对 */
  const traitLines = (p, group, key) => {
    const out = [], kid = G.isHuman(p) && G.age(p) < 13;
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
    const srcs = [(p.person.lines || {})[group]];
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
    const r = recent[p.id] = recent[p.id] || [];
    const fresh = arr.filter(x => !r.includes(x)), x = pick(fresh.length ? fresh : arr);
    r.push(x); if (r.length > 12) r.shift();
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
      G.world.last_seen = new Date().toISOString();
      G.world.schema = CY.meta ? CY.meta.schema : 4;
      store.writeYaml('world.yaml', G.world);
      for (const p of G.people) {
        p.state.last_seen = G.world.last_seen;
        store.writeYaml(`people/${p.id}/state.yaml`, p.state);
        store.writeYaml(`people/${p.id}/story.yaml`, p.story);
      }
      for (const k of G.dirty) {
        const [kind, id, mk] = k.split('|');
        if (kind === 'j') store.writeYaml(`${id === 'you' ? 'me' : 'people/' + id}/journal/${mk}.yaml`, { version: 1, entries: G.journal[id][mk] });
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
    return realSeconds / 60;
  }
  const foodOf = p => p.species.food || 'food';
  const itemForNeed = (p, k) => (k === 'hunger' ? foodOf(p) : (G.tpl.items.for_need || {})[k]);

  /* 把一个动作的效果加到角色身上，scale 是效果的比例。玩家做和角色自己做都走这里 */
  function applyEffects(p, a, scale) {
    const s = p.state, mods = G.traitMods(p);
    for (const k in a.effect || {}) if (k in s.needs) s.needs[k] = clamp(s.needs[k] + a.effect[k] * scale * (a.effect[k] < 0 ? (mods.effect[k] || 1) : 1));
    if (a.frailty) s.frailty = clamp(s.frailty + a.frailty * (a.frailty > 0 ? mods.frailty : 1));
  }
  function consume(a) {
    if (!G.economyOn()) return;
    for (const k in a.uses || {}) G.world.inv[k] -= a.uses[k];
    if (a.cost && a.cost.money) G.world.money -= a.cost.money;
  }
  /* 角色自己能做的动作：需求落在动作的效果里，并且这个阶段的角色自己做得了 */
  function selfActionFor(p, need) {
    const st = G.stage(p);
    return Object.values(G.allActionsOf(p)).find(a => a.self && (a.self === true || a.self.includes(st)) && a.effect && need in a.effect && a.effect[need] < 0);
  }
  /* 角色自己动手：效果打折，用掉物品，行动记进日志 */
  function selfAct(p, a, need, offline) {
    const lack = G.lacking(a);
    if (lack) return false;
    consume(a);
    applyEffects(p, a, 0.7);
    p.state.mood = clamp(p.state.mood + 0.02);
    p.story.self_total = (p.story.self_total || 0) + 1;
    const txt = CY.i18n.hasOwn('selfact.' + a.id) ? t('selfact.' + a.id, { name: p.person.name }) : t('log.self_did', { name: p.person.name, label: a.label });
    if (!offline) { G.log(p.id, 'self', txt); G.toastFor(p, txt, 'self'); }
    return true;
  }
  G.selfActFor = selfActionFor;

  function advance(gmin, offline) {
    if (gmin <= 0) return;
    const hours = gmin / 60;
    const boost = ini.get(G.cfg, 'interrupt', 'frequency') === 'test' && !offline ? 30 : 1;
    const eco = G.economyOn(), working = eco && G.isWorkTime();
    G.world.game_minutes += gmin;
    /* 工作收入：工作时段里，人在书桌前才赚钱，离开书桌的时间没有收入；分担的家人在家办公，自己赚一份 */
    const atDesk = !CY.world || !CY.world.enforce || CY.world.atDesk();
    if (!offline && eco && working && atDesk) G.world.money += ini.num(G.cfg, 'economy', 'wage') * hours;
    if (!offline && eco && working && G.helperIncome) G.world.money += G.helperIncome() * hours;
    const external = ini.get(G.cfg, 'play', 'needs_source') === 'backend';
    for (const p of G.activePeople()) {
      const defs = G.needsOf(p), s = p.state, mods = G.traitMods(p);
      const prevAct = G.act[p.id];
      const act = G.act[p.id] = G.activityOf(p), sleeping = act === 'sleeping';
      const night = G.isNight();
      for (const k in defs) {
        if (external) continue;
        if (k === 'rest' && sleeping) { s.needs.rest = clamp((s.needs.rest || 0) - 0.12 * hours); continue; }
        const grow = defs[k].rateNow * hours * boost * (k === 'rest' && night ? 2 : 1) * (sleeping ? 0.4 : 1) * (G.flag(p, 'hospital') ? 0.25 : 1) * (mods.rate[k] || 1);
        s.needs[k] = clamp((s.needs[k] || 0) + grow, 0, offline ? 0.7 : 1);
      }
      let target = 1 - 0.7 * G.maxNeed(p) + mods.mood_offset;
      s.mood = clamp(s.mood + (clamp(target) - s.mood) * Math.min(1, hours * 0.5));
      if (offline) continue;
      if (prevAct === 'awake' && act === 'sleeping') G.toastFor(p, t('toast.sleep', { name: p.person.name }), 'soft');
      /* 没人管的时候，有的会自己动手：老人自己倒水做饭，孩子能做的少，婴儿什么也做不了 */
      const sc = G.classOf(p).self_care;
      if (sc > 0 && !sleeping) for (const k in defs) {
        if (s.needs[k] > 0.7 && Math.random() < sc * hours * 1.2 * boost) {
          const a = selfActionFor(p, k);
          if (a && selfAct(p, a, k, offline)) break;
        }
      }
      const was = s.frailty;
      if (G.maxNeed(p) > 0.9) s.frailty = clamp(s.frailty + 0.02 * hours * boost * mods.frailty);
      else if (G.maxNeed(p) < 0.4) s.frailty = clamp(s.frailty - 0.01 * hours);
      if (was < 0.7 && s.frailty >= 0.7) { G.log(p.id, 'frail', t('log.frail', { name: p.person.name })); G.toastFor(p, G.fmt(t('toast.weak'), p), 'soft'); }
      if (was >= 0.5 && s.frailty < 0.5) G.log(p.id, 'recovered', t('log.recovered', { name: p.person.name }));
    }
    if (!offline) G.driveTick(gmin);
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
    return (lo + Math.random() * (hi - lo)) * 60;
  };
  function scheduleNext() {
    const s = G.nextGapSeconds();
    G.nextAt = isFinite(s) ? Date.now() + s * 1000 : Date.now() + 5000;
  }
  G.toastFor = (p, text, kind) => { G.toast[p.id] = { text, kind: kind || 'soft', until: Date.now() + (kind === 'reveal' ? 16000 : kind === 'cry' ? 6500 : kind === 'self' ? 7000 : 9000) }; };

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
    let pool = G.tpl.asks.filter(q => fits(q.voice, v) && fits(q.stage, st) && fits(q.pronoun, pr) && (!q.min_age || G.age(p) >= q.min_age) && (sens || !q.sensitive));
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
    const awake = p => !G.isSleeping(p);
    const free = G.activePeople().filter(p => !G.req[p.id] && awake(p));
    if (!free.length) return;
    const needy = free.filter(p => G.maxNeed(p) > (p.person.kind === 'plant' ? 0.7 : 0.55));
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
    /* 还不会说话的孩子没有“平时会说哪句”可回想 */
    const speaks = p.person.kind !== 'human' || G.age(p) >= 2;
    const picks = ini.bool(G.cfg, 'interaction', 'picks') && p.person.kind !== 'plant' && speaks ? G.pickOptions(p) : [];
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
  /* 宝宝一直要人，需求超过一半就一直提示，隔一小会儿再叫一次；猫和狗也会隔一阵来要。别的角色安静 */
  G.nagAt = {};
  G.needy = p => !!G.classOf(p).nag && !G.isSleeping(p) && !G.flag(p, 'hospital') && !G.flag(p, 'outing') && G.maxNeed(p) > 0.5;
  G.nagTick = now => {
    if (G.inQuiet()) return;
    for (const p of G.activePeople()) {
      if (!G.needy(p) || G.req[p.id] || (G.nagAt[p.id] || 0) > now) continue;
      const defs = G.needsOf(p), need = G.topNeed(p);
      const text = line(p, 'request', need, t('req.need_fallback', { name: p.person.name, need: G.needLabel(need, defs[need]) }));
      G.req[p.id] = mkReq({ pid: p.id, kind: 'need', need, text });
      G.say(p.id, 'char', text);
      G.nagAt[p.id] = now + G.classOf(p).nag * 1000;
    }
  };

  function expire(req) {
    const p = G.get(req.pid), mode = ini.get(G.cfg, 'interrupt', 'mode');
    delete G.req[req.pid];
    learn(p, req.kind, false);
    if (req.kind === 'pick' || req.kind === 'nudge') return;
    if (mode === 'countdown_dismiss') { G.log(p.id, 'missed', t('log.called_gone', { name: p.person.name })); G.toastFor(p, t('toast.nevermind'), 'soft'); return; }
    if (req.kind === 'need') {
      /* 没赶上的时候，能自理的自己动手处理，不能自理的需求照旧 */
      const a = selfActionFor(p, req.need);
      if (a && G.classOf(p).self_care > 0 && selfAct(p, a, req.need, false)) return;
      G.log(p.id, 'missed', t('log.missed_need_helpless', { name: p.person.name, text: req.text }));
      G.toastFor(p, t('toast.nobody'), 'soft');
    } else if (req.kind === 'choice') {
      const c = req.choices.find(x => x.liked) || req.choices[0];
      applyChoice(p, c, true);
    } else {
      G.log(p.id, 'missed', t('log.missed_generic', { text: req.text }));
      G.toastFor(p, t('toast.nevermind2'), 'soft');
    }
  }

  /* ---------- 玩家动作：现实模式长按立刻生效，故事模式点击要花掉游戏里的时间 ---------- */
  function applyAction(pid, actionId) {
    const p = G.get(pid), a = p && G.actionsOf(p)[actionId];
    if (!a) return false;
    const lack = G.lacking(a);
    if (lack) { G.toastFor(p, t('toast.no_item', { item: G.item(lack).label }), 'soft'); emit(); return false; }
    const s = p.state;
    const scale = a.bonus_item && G.economyOn() && !(G.world.inv[a.bonus_item] > 0) ? 0.5 : 1;
    consume(a);
    applyEffects(p, a, scale);
    if (a.away && G.awayCost) G.awayCost(p, a);
    if (a.outing && G.startOuting) G.startOuting(p, a);
    if (a.flag && a.flag.name) G.setFlag(p, a.flag.name, { minutes: a.flag.minutes });
    s.mood = clamp(s.mood + (a.mood === undefined ? 0.08 : a.mood));
    p.story.care_total++;
    /* 带去看医生一类的动作直接治好某些病 */
    for (const c of a.heals || []) {
      if ((p.person.conditions || []).includes(c)) { p.person.conditions = p.person.conditions.filter(x => x !== c); store.writeYaml(`people/${p.id}/person.yaml`, p.person); G.log(p.id, 'recovered', t('log.healed', { name: p.person.name, cond: CY.tOr('cond.' + c, (G.tpl.conditions[c] || {}).label || c) })); }
    }
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
    let tx = line(p, 'thanks', actionId, line(p, 'thanks', 'default', t('line.ok')));
    /* 要不要说不一样的话，由后端决定：受了伤，在医院，到了某个次数 */
    const dres = G.drive('action', { person: p, action: { id: actionId, label: a.label }, collect: true });
    if (dres && dres.said) tx = dres.said;
    G.toastFor(p, tx, 'speech'); G.say(pid, 'char', tx);
    G.log(pid, 'care', t('log.care', { label: a.label, line: tx }));
    G.playFx(pid, actionId);
    G.save(); emit();
    return true;
  }
  G.applyAction = applyAction;

  /* 闲谈：不用你做什么，隔一阵有人随口说一句。说什么由后端按房间，时段，旧事挑 */
  function ambientChat() {
    const cands = G.activePeople().filter(p => !G.toast[p.id] && !G.req[p.id]);
    if (!cands.length) return;
    const p = pick(cands), loc = CY.world ? CY.world.locationOf(p) : { room: 'living' };
    const hr = G.dayMinutes() / 60, band = hr < 6 || hr >= 22 ? 'night' : hr < 11 ? 'morning' : hr < 17 ? 'noon' : 'evening';
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
    G.log(pid, 'talk', t('log.talk', { q: req.text, a: text }));
    p.story.care_total++; p.state.mood = clamp(p.state.mood + 0.1);
    const rp = G.sayLine(p, 'reply', custom !== undefined && custom !== null ? 'custom' : 'a' + idx);
    G.toastFor(p, rp || line(p, 'thanks', 'default', t('line.ok')), 'speech');
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
      if (!G.classOf(p).cries || G.maxNeed(p) <= 0.8 || G.isSleeping(p)) continue;
      G.crying[p.id] = true;
      if (!was[p.id]) G.log(p.id, 'cry', t('log.cry', { name: p.person.name, need: G.needLabel(G.topNeed(p), G.needsOf(p)[G.topNeed(p)]) }));
      if (!G.toast[p.id] || G.toast[p.id].kind !== 'cry') if (!G.req[p.id] || G.req[p.id].kind !== 'ask') G.toastFor(p, line(p, 'cry', null, t('line.cry')), 'cry');
    }
    if (now >= G.nextAt) { if (G.activePeople().length) fire(); scheduleNext(); }
    const wk = G.isWorkTime();
    if (G._wk !== undefined && G._wk !== wk && G.activePeople().length) G.log('you', 'event', t(wk ? 'me.work_start' : 'me.work_end'));
    G._wk = wk;
    if (G.worldTick) G.worldTick(now);
    G.nagTick(now);
    if (G.assistTick) G.assistTick(dt);
    if (now >= (G.nextAmbient || 0)) { G.nextAmbient = now + 30000 + Math.random() * 40000; if (!G.isPaused() && G.activePeople().length) ambientChat(); }
    emit();
  };
  G.start = function () {
    for (const p of G.activePeople()) G.act[p.id] = G.activityOf(p);
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
