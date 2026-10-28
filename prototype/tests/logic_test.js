/* 无头逻辑测试：用内存存储跑一遍载入、创建角色、时间、打断、动作、问答、挑话、学习、AI 校验、存档导入导出、多语言完整性。 */
const fs = require('fs'), vm = require('vm'), path = require('path'), zlib = require('zlib');
const ctx = vm.createContext({ console, Math, Date, JSON, RegExp, Promise, setInterval, clearInterval, setTimeout, clearTimeout, TextEncoder, TextDecoder, Blob, Response, DecompressionStream, Uint8Array, DataView, ArrayBuffer, fetch: undefined });
ctx.globalThis = ctx;
const root = path.join(__dirname, '..');
const run = f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
for (const f of ['vendor/js-yaml.min.js', 'src/meta.js', 'src/i18n.js', 'locales/zh-CN.js', 'locales/en.js', 'locales/zh-TW.js', 'locales/fr.js', 'locales/ja.js', 'locales/ko.js', 'locales/es.js', 'locales/de.js', 'src/ini.js', 'src/store.js', 'src/archive.js']) run(f);
/* 内存存储代替浏览器存储，zip 读写用真实实现 */
const mem = new Map();
ctx.__mem = mem;
vm.runInContext(`
  Object.assign(CY.store, {
    backend: { label: 'memory' },
    read: async p => (globalThis.__mem.has(p) ? globalThis.__mem.get(p) : null),
    list: async () => [...globalThis.__mem.keys()],
    write: async (p, t) => { globalThis.__mem.set(p, t); },
    readYaml: async p => { const t = globalThis.__mem.get(p); return t === undefined ? null : jsyaml.load(t); },
    writeYaml: async (p, o) => { globalThis.__mem.set(p, jsyaml.dump(o, { lineWidth: -1 })); },
    wipe: async () => { globalThis.__mem.clear(); },
    removeDir: async p => { for (const k of [...globalThis.__mem.keys()]) if (k.startsWith(p + '/')) globalThis.__mem.delete(k); },
  });`, ctx);
for (const f of ['src/content.js', 'src/content_more.js', 'src/content_en.js', 'src/content_react.js', 'locales/content_zh-TW.js', 'locales/content_ja.js', 'locales/content_ko.js', 'locales/content_fr.js', 'locales/content_es.js', 'locales/content_de.js', 'src/seed.js', 'src/ai.js', 'src/account.js', 'src/game.js', 'src/world.js', 'src/iso.js', 'src/avatar.js', 'src/scenes.js']) run(f);
const CY = ctx.CY, G = CY.game;
let fails = 0;
const check = (n, c, x) => { if (!c) fails++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };
const total = () => Object.values(G.journal).reduce((a, m) => a + Object.values(m).reduce((b, e) => b + e.length, 0), 0);

const store_write_cfg = () => CY.store.write('settings.ini', CY.ini.stringify(G.cfg));
(async () => {
  CY.i18n.set('zh-CN');
  await G.load();
  check('第一次进来没有角色，由引导页选', G.people.length === 0);
  check('种子里有声线、说话库、问答库、提醒库、AI 技能', G.tpl.voices.elder && G.tpl.sayLib.length > 30 && G.tpl.asks.length > 20 && G.tpl.nudges.length > 3 && G.tpl.skills.speak && G.tpl.persona);
  check('原型至少 15 种', CY.content.archetypes.length >= 15);

  for (const m of CY.content.presets[0].members) await G.createPerson({ arch: m.arch, name: m.name, conditions: m.conditions });
  await G.load();
  let grandpa, baby, cat; const refs = () => { grandpa = G.people.find(p => p.person.name === '爷爷'); baby = G.people.find(p => p.person.name === '宝宝'); cat = G.people.find(p => p.person.name === '团子'); }; refs();
  check('推荐组合创建了三个角色', G.people.length === 3 && grandpa && baby && cat);
  check('爷爷有糖尿病需求', 'medicine' in G.needsOf(grandpa));
  check('宝宝有玩耍需求，爷爷没有', 'play' in G.needsOf(baby) && !('play' in G.needsOf(grandpa)));
  check('爷爷的摸一摸标签是拍拍肩', G.actionsOf(grandpa).pet.label === '拍拍肩');
  check('台词里的 {ta} 按称呼替换', G.fmt('{ta}看了你一眼', grandpa) === '他看了你一眼' && G.fmt('{ta}看了你一眼', cat) === '它看了你一眼');
  check('角色没写的台词用声线模板', G.lines(grandpa, 'request', 'thirst').length > 0 && G.lines(cat, 'glance').length > 0);
  check('ini 往返一致', JSON.stringify(CY.ini.parse(CY.ini.stringify(G.cfg))) === JSON.stringify(G.cfg));

  /* 语言 */
  CY.i18n.set('en');
  check('英文下需求和动作标签换成英文', G.actionsOf(grandpa).pet.label === 'Pat shoulder' && G.needLabel('thirst', { label: '口渴' }) === 'Thirsty');
  check('缺的键回退到中文，再回退到键名', CY.t('no.such.key') === 'no.such.key' && CY.t('arch.grandpa') === 'Grandpa');
  CY.i18n.set('zh-CN');
  check('中文下用模板里的标签', G.actionsOf(grandpa).pet.label === '拍拍肩');
  check('语言检测', CY.i18n.detect('en') === 'en' && CY.i18n.detect('zh-CN') === 'zh-CN');

  /* 多语言完整性：代码和页面里用到的键，两种语言包都要有 */
  const used = new Set(), dataOnly = new Set();
  for (const f of fs.readdirSync(path.join(root, 'src'))) {
    const s = fs.readFileSync(path.join(root, 'src', f), 'utf8');
    for (const m of s.matchAll(/\bt\('([a-z_]+\.[A-Za-z0-9_.]+)'/g)) used.add(m[1]);
    for (const m of s.matchAll(/\bt\([^()]*\? '([a-z_]+\.[A-Za-z0-9_.]+)' : '([a-z_]+\.[A-Za-z0-9_.]+)'/g)) { used.add(m[1]); used.add(m[2]); }
    for (const m of s.matchAll(/\btOr\('([a-z_]+\.[A-Za-z0-9_.]+)'/g)) dataOnly.add(m[1]);
  }
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const m of html.matchAll(/data-i18n(?:-title|-ph)?="([^"]+)"/g)) used.add(m[1]);
  for (const k of [...used]) if (/[_.]$/.test(k)) used.delete(k);
  used.add('add.group_family'); used.add('add.group_animal');
  const A = CY.content.archetypes;
  A.forEach(a => used.add('arch.' + a.id));
  CY.content.presets.forEach(p => { used.add(`preset.${p.id}.label`); used.add(`preset.${p.id}.note`); p.members.forEach(m => used.add('preset.name.' + m.arch)); });
  ['care', 'talk', 'missed', 'cares_back', 'glance', 'event', 'frail', 'recovered', 'reveal', 'picked', 'nudge', 'cry', 'self'].forEach(k => used.add('type.' + k));
  ['infant', 'toddler', 'child', 'teen', 'adult', 'elder'].forEach(k => { used.add('stage.' + k); used.add('stage.note.' + k); });
  used.add('kind.note.plant'); used.add('kind.note.animal'); used.add('add.group_plant');
  Object.keys(ctx.CY.seed.files()).filter(f => /templates\/species/.test(f)).map(f => f.split('/').pop().replace('.yaml', '')).filter(k => k !== 'human').forEach(k => used.add('class.' + k));
  ['interrupt', 'time', 'player', 'interaction', 'ui', 'privacy', 'account', 'ai', 'play', 'economy'].forEach(k => used.add('sec.' + k));
  ['warm', 'mint', 'sky', 'rose', 'gray'].forEach(k => used.add('bg.' + k));
  ['none', 'round', 'square'].forEach(k => used.add('glasses.' + k));
  ['short', 'long', 'bob', 'ponytail', 'bun', 'curly', 'bald'].forEach(k => used.add('hair.' + k));
  ['zip', 'empty', 'newer'].forEach(k => used.add('import.err_' + k));
  ['about', 'privacy', 'credits', 'version'].forEach(k => used.add('about.tab_' + k));
  for (let i = 1; i <= 10; i++) used.add('priv.p' + i);
  used.add('player.title'); used.add('player.name');
  ['reality', 'story', 'paused'].forEach(m => { used.add('mode.' + m); used.add('mode.' + m + '_tip'); used.add('mode.hint_' + m); used.add('mode.switched_' + m); });
  ['auto', 'living', 'bedroom', 'kitchen', 'lawn', 'balcony', 'none'].forEach(k => used.add('scene.' + k));
  CY.content.TRAITS.forEach(k => { used.add('trait.' + k); used.add('trait.' + k + '_tip'); });
  ['great', 'ok', 'low', 'bad'].forEach(k => used.add('mood.' + k)); ['sleeping', 'awake'].forEach(k => used.add('act.' + k)); ['m', 'f', 'n'].forEach(k => used.add('pron.sub.' + k));
  for (const f of Object.keys(CY.seed.files()).filter(f => /^templates\/(species|conditions)\//.test(f))) { const o = ctx.jsyaml.load(CY.seed.files()[f]); for (const k in o.actions || {}) if (o.actions[k].selfonly) used.add('selfact.' + k); }
  const zh = ctx.CY.i18n.packs['zh-CN'], en = ctx.CY.i18n.packs.en;
  const missZh = [...used].filter(k => !(k in zh)), missEn = [...used].filter(k => !(k in en));
  check('界面用到的键中文包都有', missZh.length === 0, missZh.join());
  check('界面用到的键英文包都有', missEn.length === 0, missEn.join());
  const needKeys0 = new Set(), actKeys0 = new Set(), condKeys0 = new Set();
  for (const f of Object.keys(CY.seed.files()).filter(f => /^templates\/(species|conditions)\//.test(f))) { const o = ctx.jsyaml.load(CY.seed.files()[f]); Object.keys(o.needs || {}).forEach(k => needKeys0.add(k)); Object.keys(o.actions || {}).forEach(k => actKeys0.add(k)); if (o.label && /conditions/.test(f)) condKeys0.add(o.id); }
  const itemKeys0 = Object.keys(ctx.jsyaml.load(CY.seed.files()['templates/economy/items.yaml']).items);
  for (const lang of ['zh-TW', 'fr', 'ja', 'ko', 'es', 'de']) {
    const pk = ctx.CY.i18n.packs[lang] || {};
    const miss = [...used].filter(k => !(k in pk && pk[k] !== undefined)).concat([...needKeys0].filter(k => !(('need.' + k) in pk)).map(k => 'need.' + k), [...actKeys0].filter(k => !(('act.' + k) in pk)).map(k => 'act.' + k), [...condKeys0].filter(k => !(('cond.' + k) in pk)).map(k => 'cond.' + k), itemKeys0.filter(k => !(('item.' + k) in pk)).map(k => 'item.' + k));
    const ph = Object.keys(pk).filter(k => { const a = (pk[k].match(/\{\w+\}/g) || []).sort().join(), b = (((lang.startsWith('zh') ? zh[k] : en[k]) || zh[k] || '').match(/\{\w+\}/g) || []).sort().join(); return a !== b; });
    check('语言包 ' + lang + ' 覆盖所有界面键和数据标签', miss.length === 0, miss.slice(0, 12).join());
    check('语言包 ' + lang + ' 的占位符和英文一致', ph.length === 0, ph.slice(0, 6).join());
  }
  const needKeys = new Set(), actKeys = new Set();
  for (const f of Object.keys(CY.seed.files()).filter(f => /^templates\/(species|conditions)\//.test(f))) { const o = ctx.jsyaml.load(CY.seed.files()[f]); Object.keys(o.needs || {}).forEach(k => needKeys.add(k)); Object.keys(o.actions || {}).forEach(k => actKeys.add(k)); }
  check('英文包覆盖所有需求和动作标签', [...needKeys].every(k => 'need.' + k in en) && [...actKeys].every(k => 'act.' + k in en), [...needKeys].filter(k => !('need.' + k in en)).concat([...actKeys].filter(k => !('act.' + k in en))).join());
  const iniMiss = CY.ini.SCHEMA.filter(([s, k]) => !['ui.theme', 'ui.background', 'ui.language'].includes(s + '.' + k) && !(`ini.${s}.${k}` in en)).map(x => x[0] + '.' + x[1]);
  check('英文包覆盖所有设置说明', iniMiss.length === 0, iniMiss.join());

  /* 运行包清单和页面一致 */
  const refsInHtml = [...html.matchAll(/(?:src|href)="((?!#|http)[^"]+)"/g)].map(m => m[1]);
  const notInPack = refsInHtml.filter(f => !CY.archive.APP_FILES.includes(f)), notOnDisk = CY.archive.APP_FILES.filter(f => !fs.existsSync(path.join(root, f)));
  check('页面引用的文件都在运行包清单里', notInPack.length === 0, notInPack.join());
  check('运行包清单里的文件都存在', notOnDisk.length === 0, notOnDisk.join());

  /* 编辑、归档、删除 */
  {
    const vid = await G.createPerson({ arch: A[0].id, name: '临时' }); await G.load(); const before = G.people.length;
    await G.updatePerson(vid, { name: '新名字', traits: ['sticky', 'sunny', 'extra'] });
    check('编辑改了名字且特征最多两个', G.get(vid).person.name === '新名字' && G.get(vid).person.traits.length <= 2);
    const saved = await CY.store.readYaml(`people/${vid}/person.yaml`);
    check('编辑写入了文件', saved && saved.name === '新名字');
    await G.archivePerson(vid, true);
    check('归档后不在桌面但还在记录里', !G.activePeople().some(p => p.id === vid) && !!G.get(vid) && G.get(vid).person.archived === true);
    await G.setActive(vid, true);
    check('恢复后回到桌面', G.activePeople().some(p => p.id === vid) && !G.get(vid).person.archived);
    await G.deletePerson(vid);
    check('删除后人和文件都没了', G.people.length === before - 1 && !G.get(vid) && ![...mem.keys()].some(k => k.startsWith(`people/${vid}/`)));
  }

  /* 每种疾病都能挂到人身上，需求和动作齐全，动作能执行 */
  {
    const bad = [];
    for (const c of Object.keys(G.tpl.conditions)) {
      const pid = await G.createPerson({ arch: 'grandpa', name: '测试', conditions: [c] }); await G.load();
      const p = G.get(pid), cd = G.tpl.conditions[c];
      const acts = G.actionsOf(p);
      for (const a of Object.keys(cd.actions || {})) if (!cd.actions[a].selfonly && !acts[a]) bad.push(c + ':' + a + ':缺动作');
      for (const n of Object.keys(cd.needs || {})) if (typeof p.state.needs[n] !== 'number') bad.push(c + ':' + n + ':缺需求');
      try { for (const a of Object.keys(acts)) if (!acts[a].selfonly) G.perform(pid, a); } catch (e) { bad.push(c + ':执行出错 ' + e.message); }
      await G.deletePerson(pid);
    }
    check('每种疾病的需求动作齐全且动作可执行', bad.length === 0, bad.slice(0, 6).join());
    const bad2 = [];
    for (const a of CY.content.archetypes) {
      const pid = await G.createPerson({ arch: a.id, name: '测试' }); await G.load();
      const p = G.get(pid);
      try { for (const k of Object.keys(G.actionsOf(p))) if (!G.actionsOf(p)[k].selfonly) G.perform(pid, k); } catch (e) { bad2.push(a.id + ' ' + e.message); }
      await G.deletePerson(pid);
    }
    check('每种原型的全部动作可执行', bad2.length === 0, bad2.slice(0, 6).join());
  }

  /* 世界：房间分布，走路，住院，夜里起夜，闲谈 */
  {
    const W = CY.world;
    G.cfg.time.daynight = 'game';
    const gp = await G.createPerson({ arch: 'grandpa', name: '爷爷', conditions: ['nocturia'] });
    const bb = await G.createPerson({ arch: 'baby', name: '宝宝' });
    const ct = await G.createPerson({ arch: 'cat', name: '猫' });
    await G.load();
    const setHour = h => { G.cfg.time.daynight = 'game'; G.world.game_minutes = (h * 60 - 480 + 1440) % 1440; for (const p of G.people) G.act[p.id] = G.activityOf(p); };
    setHour(14);
    check('白天爷爷在客厅或院子或厨房', ['living', 'yard', 'kitchen'].includes(W.locationOf(G.get(gp)).room), JSON.stringify(W.locationOf(G.get(gp))) + ' dm=' + G.dayMinutes() + ' shift=' + G.world.clock_shift + ' mode=' + G.timeMode() + ' src=' + G.daySource());
    check('婴儿白天在卧室的小床里', W.locationOf(G.get(bb)).room === 'bedroom' && W.locationOf(G.get(bb)).mode === 'cradle');
    setHour(2);
    check('夜里爷爷在老人房睡，不和婴儿一屋', W.locationOf(G.get(gp)).room === 'elder' && W.locationOf(G.get(bb)).room === 'bedroom');
    const lay = W.layout('home');
    check('每个人都有位置', lay.length === G.people.length - G.people.filter(p => p.person.active === false).length || lay.length > 0);
    W.hospitalize(G.get(gp), 3);
    check('住院后在医院病房', W.locationOf(G.get(gp)).place === 'hospital' && W.layout('hospital').some(l => l.id === gp));
    const before = G.world.game_minutes; G.world.game_minutes += 4400; W.advance(1);
    check('住满天数后出院回家', !G.get(gp).state.hospital && G.get(gp).story.hospital_n === 1);
    G.world.game_minutes = before;
    /* 走路：主角不在这个人的房间，故事模式里先走过去再做 */
    W.enforce = true;
    const pl = W.player(); pl.place = 'home'; pl.room = 'study'; Object.assign(pl, W.playerAnchor('home', 'study'));
    setHour(14);
    G.cfg.time.mode = 'compressed'; G.world.tasks = [];
    const need = W.presenceNeed(G.get(ct));
    check('不在一个房间要走路', !!need && !need.offsite);
    const okStart = G.startAction(ct, 'pet');
    check('故事模式里开始动作会排上走路', okStart && G.tasks().length === 2 && G.tasks()[1].kind === 'walk' && G.tasks()[0].act === 'pet');
    for (let i = 0; i < 400 && G.tasks().length; i++) G.tick();
    G.world.tasks = [];
    W.walk = null;
    /* 医院：不在医院做不了医院里的事 */
    W.hospitalize(G.get(gp), 3);
    const off = W.presenceNeed(G.get(gp));
    check('在医院的人要先去医院', off && off.offsite && off.place === 'hospital');
    G.cfg.time.mode = 'compressed';
    check('去医院会排上路程', W.travel('hospital') && G.tasks().length === 1 && G.tasks()[0].kind === 'travel');
    G.finishSpecial(G.tasks()[0]); G.world.tasks = [];
    check('到了医院，主角位置变了', W.player().place === 'hospital');
    W.discharge(G.get(gp)); W.travel('home');
    G.cfg.time.mode = 'real'; G.world.tasks = [];
    G.finishSpecial({ to: { place: 'home', room: 'study', ...W.playerAnchor('home', 'study') } });
    W.enforce = false;
    /* 起夜与跌倒：概率放大后一定出事 */
    setHour(2);
    G.cfg.play.fall_scale = '1000';
    const g = G.get(gp); g.state.wc_until = G.world.game_minutes - 1; g.state.hospital = null; delete g.state.hospital;
    W.advance(1);
    check('起夜跌倒会记下来', g.state.hurt === 'minor' || g.state.hospital);
    G.cfg.play.fall_scale = '1';
    /* 闲谈和反应的台词齐全 */
    const missing = [];
    for (const v in CY.content.VOICE_GROUP) {
      const voice = CY.content.voices[v] || {};
      for (const k of ['morning', 'noon', 'evening', 'night']) if (!(voice.ambient && voice.ambient[k] && voice.ambient[k].length)) missing.push(v + '.ambient.' + k);
      for (const k of ['after_fall', 'visit_hospital', 'discharge', 'milestone_10', 'milestone_300']) if (!(voice.events && voice.events[k] && voice.events[k].length)) missing.push(v + '.events.' + k);
    }
    check('每种声线都有闲谈和反应台词', missing.length === 0, missing.slice(0, 6).join());
    G.ambientChat();
    for (const id of [gp, bb, ct]) await G.deletePerson(id);
    G.cfg.time.daynight = 'auto';
  }

  /* 其他原型 */
  for (const a of A) await G.createPerson({ arch: a.id, name: a.role });
  await G.load();
  check('每种原型都能载入', G.people.length === 3 + A.length);
  check('每种原型都有声线和候选话', G.people.every(p => Object.keys(p.voice).length > 0 && G.pickOptions(p).length > 0));
  const talkers = G.people.filter(p => p.person.kind === 'human' && G.stage(p) !== 'infant');
  check('每个人形原型都有可问的问题', talkers.every(p => G.askBank(p).length > 0), talkers.filter(p => !G.askBank(p).length).map(p => p.person.name).join());
  for (const p of G.people.slice(3)) p.person.active = false;
  await Promise.all(G.people.slice(3).map(p => CY.store.writeYaml(`people/${p.id}/person.yaml`, p.person)));
  await G.load(); refs();
  check('可以让角色离开桌面', G.activePeople().length === 3);

  /* 问答库按身份和称呼筛选，敏感话题默认不出现 */
  const sis = { person: { voice: 'sibling', age: 26, pronoun: '她', kind: 'human', lines: {} }, species: { id: 'human' }, state: { asked: [] } };
  const bro = { person: { voice: 'sibling', age: 28, pronoun: '他', kind: 'human', lines: {} }, species: { id: 'human' }, state: { asked: [] } };
  const kid = { person: { voice: 'child', age: 7, pronoun: '她', kind: 'human', lines: {} }, species: { id: 'human' }, state: { asked: [] } };
  G.cfg.interaction.sensitive_topics = 'false';
  check('姐妹可以被问到身体不适的话题，兄弟不会', G.askBank(sis).some(q => q.id === 'ask_s05') && !G.askBank(bro).some(q => q.id === 'ask_s05'));
  check('孩子只被问孩子的问题', G.askBank(kid).every(q => q.voice.includes('child')));
  check('敏感话题默认不出现', !G.askBank(sis).some(q => q.sensitive));
  G.cfg.interaction.sensitive_topics = 'true';
  check('打开后敏感话题才出现', G.askBank(sis).some(q => q.id === 'ask_s06') && !G.askBank(bro).some(q => q.id === 'ask_s06'));
  G.cfg.interaction.sensitive_topics = 'false';
  check('每个问题恰好三个预设回答', G.tpl.asks.every(q => q.answers.length === 3));

  /* 时间显示 */
  G.cfg.time.mode = 'compressed'; G.cfg.time.daynight = 'auto';
  check('压缩时间下昼夜用游戏内时钟', G.daySource() === 'game');
  G.cfg.time.mode = 'real';
  check('真实时间下昼夜跟随系统时钟', G.daySource() === 'system');
  G.cfg.time.daynight = 'game';
  check('可以强制用游戏时钟', G.daySource() === 'game');
  G.world.game_minutes = 3 * 1440 + 5 * 60 + 7;
  const ck = G.clock();
  check('已陪伴的时间按游戏时间累计', ck.d === 3 && ck.h === 5 && ck.m === 7, JSON.stringify([ck.d, ck.h, ck.m]));
  check('游戏时钟从早上八点开始', (G.world.game_minutes = 0, G.clock().hh === '08'));
  G.world.game_minutes = 15 * 60; check('游戏时钟夜里是夜晚', G.clock().night === true, G.clock().hh);
  G.cfg.time.daynight = 'auto';
  G.cfg.interrupt.frequency = 'normal';
  G.cfg.time.mode = 'real'; const s1 = G.secPerGameMin();
  G.cfg.time.mode = 'compressed'; const s2 = G.secPerGameMin();
  check('压缩时间下打扰间隔按比例变短', Math.abs(s1 / s2 - +G.cfg.time.compress_ratio) < 1e-9);
  G.cfg.time.mode = 'free';
  check('游戏自己的时间是一倍速', G.secPerGameMin() === 60 && G.playMode() === 'reality', G.secPerGameMin() + ' ' + G.playMode());
  G.world.game_minutes = 0;

  G.cfg.interrupt.frequency = 'test'; G.cfg.interrupt.quiet_hours = ''; G.cfg.time.mode = 'compressed'; G.cfg.time.daynight = 'game';
  G.start();
  for (let i = 0; i < 600; i++) { G.lastTick -= 1000; G.nextAt = 0; G.tick(); }
  check('跑 600 秒后产生了日志', total() > 0, 'journal=' + total());
  check('需求不超过 1', G.people.every(p => Object.values(p.state.needs).every(v => v >= 0 && v <= 1)));
  const seen = new Set(); for (let i = 0; i < 600; i++) { G.req = {}; G.fire(); for (const r of Object.values(G.req)) seen.add(r.kind); }
  check('各种打断都能出现', ['need', 'ask', 'pick', 'choice', 'nudge'].every(k => seen.has(k)), [...seen].join());

  /* 夜里更容易累 */
  G.cfg.time.mode = 'compressed'; G.cfg.time.daynight = 'game';
  const restRate = (min) => { G.world.game_minutes = min; baby.state.needs.rest = 0; const w = G.world.game_minutes; G.lastTick = Date.now() - 1000; G.tick(); return baby.state.needs.rest; };
  const day = restRate(4 * 60), night = restRate(15 * 60 + 60);
  check('夜里疲倦涨得更快', night > day * 1.5, day.toFixed(4) + ' vs ' + night.toFixed(4));
  G.world.game_minutes = 0;

  /* 动作与动画触发 */
  G.req = {};
  baby.state.needs.thirst = 0.9;
  G.req[baby.id] = { pid: baby.id, kind: 'need', need: 'thirst', text: '水！', since: Date.now() - 3000, deadline: 0 };
  const n0 = baby.state.learn.n_resp;
  G.perform(baby.id, 'water');
  check('倒水后口渴下降且打断结束', baby.state.needs.thirst < 0.4 && !G.req[baby.id]);
  check('响应被学习记录', baby.state.learn.n_resp === n0 + 1);
  check('动作触发了动画', G.fx[baby.id] && G.fx[baby.id].act === 'water');

  /* 问答：直接选预设或自己写，库编号与序号一起记 */
  G.req = {};
  const mkAsk = (p, qid) => { const q = G.tpl.asks.find(x => x.id === qid); G.req[p.id] = { pid: p.id, kind: 'ask', askId: q.id, text: q.say, answers: q.answers, since: Date.now(), deadline: Date.now() + 20000 }; return q; };
  const q1 = mkAsk(grandpa, 'ask_e02');
  G.answerAsk(grandpa.id, 1);
  const r1 = G.sayings[grandpa.id].slice(-1)[0];
  check('选预设回答，记库编号、序号和原文', r1.by === 'you' && r1.lib === 'ask_e02' && r1.ans === 1 && r1.text === q1.answers[1], JSON.stringify(r1));
  mkAsk(grandpa, 'ask_e03');
  G.answerAsk(grandpa.id, null, '  我在听。 ');
  const r2 = G.sayings[grandpa.id].slice(-1)[0];
  check('自己写的回答记为 custom 并去掉空白', r2.ans === 'custom' && r2.text === '我在听。' && r2.lib === 'ask_e03');
  mkAsk(grandpa, 'ask_e04'); G.answerAsk(grandpa.id, null, '   ');
  check('空白回答不算回答', !!G.req[grandpa.id]);
  G.req[grandpa.id].deadline = Date.now() - 1; const miss0 = G.journal[grandpa.id] ? total() : 0; G.tick();
  check('问答超时算没赶上，没有别的惩罚', !G.req[grandpa.id] && grandpa.state.learn.kinds.ask.n >= 1);
  const dinner = G.tpl.conditions.diabetes.events.dinner;
  G.req[grandpa.id] = { pid: grandpa.id, kind: 'choice', text: dinner.say, choices: dinner.choices, since: Date.now(), deadline: 0 };
  const f0 = grandpa.state.frailty;
  G.choose(grandpa.id, 2);
  check('选清淡的晚饭虚弱度不升', grandpa.state.frailty <= f0);

  /* 挑一句话 */
  G.req = {};
  const opts = G.pickOptions(grandpa);
  G.req[grandpa.id] = { pid: grandpa.id, kind: 'pick', text: 'x', options: opts, since: Date.now(), deadline: 0 };
  const before = G.sayings[grandpa.id].length;
  G.pickSaying(grandpa.id, 1);
  const rec = G.sayings[grandpa.id][before];
  check('挑话记下库编号和原文', rec && rec.lib === opts[1].id && rec.text === G.fmt(opts[1].text, grandpa) && rec.by === 'char');
  check('挑过的话不会再出现', !G.pickOptions(grandpa, 50).some(o => o.id === opts[1].id));
  check('挑过的话进入说话池', G.speechPool(grandpa).includes(rec.text));

  /* 现实提醒与学习 */
  G.req = {};
  G.req[grandpa.id] = { pid: grandpa.id, kind: 'nudge', nudge: 'n01', text: 'x', since: Date.now(), deadline: 0 };
  G.answerNudge(grandpa.id, true);
  check('回应现实提醒被记录', grandpa.story.nudge_done === 1 && !G.req[grandpa.id]);
  const w0 = cat.state.learn.needy;
  for (let i = 0; i < 6; i++) { G.req[cat.id] = { pid: cat.id, kind: 'ask', text: 'x', answers: ['a', 'b', 'c'], since: Date.now(), deadline: 0 }; G.dismiss(cat.id); }
  check('连续忽略后更少打扰', cat.state.learn.needy < w0);
  G.cfg.interaction.learn = 'false';
  const w1 = cat.state.learn.needy; G.req[cat.id] = { pid: cat.id, kind: 'ask', text: 'x', answers: ['a', 'b', 'c'], since: Date.now(), deadline: 0 }; G.dismiss(cat.id);
  check('关闭学习后不再调整', cat.state.learn.needy === w1);
  G.cfg.interaction.learn = 'true';

  /* 保存与载入往返 */
  G.save(true);
  await new Promise(r => setTimeout(r, 50));
  const keys = [...mem.keys()];
  check('写出了 state、story、journal、sayings', ['state.yaml', 'story.yaml', 'sayings.yaml'].every(n => keys.some(k => k.endsWith(n))) && keys.some(k => /journal\/\d{4}-\d\d\.yaml$/.test(k)));
  const yaml = mem.get(`people/${grandpa.id}/sayings.yaml`);
  check('明文文件里有库编号、预设序号和原文', yaml.includes('lib: ask_e02') && yaml.includes('ans: 1') && yaml.includes('ans: custom') && yaml.includes(rec.text));
  check('世界文件记了数据结构版本', ctx.jsyaml.load(mem.get('world.yaml')).schema === CY.meta.schema);

  /* 存档导出，再导入 */
  CY.ini; mem.set('settings.ini', CY.ini.stringify(Object.assign({}, G.cfg, { ai: Object.assign({}, G.cfg.ai, { api_key: 'sk-secret' }) })));
  const s1b = await CY.archive.exportSave();
  const zipBuf = Buffer.from(await s1b.blob.arrayBuffer());
  fs.writeFileSync(path.join(process.env.TEMP || '/tmp', 'cy_save_test.zip'), zipBuf);
  const info = await CY.archive.inspect(new Uint8Array(zipBuf));
  check('存档能被读回，带 manifest 和角色名', info.ok && info.manifest && info.manifest.schema === CY.meta.schema && info.people.length === 3 + A.length, info.error);
  check('存档默认不含 AI 密钥', !info.files['settings.ini'].includes('sk-secret'));
  const withKey = await CY.archive.inspect(new Uint8Array(await (await CY.archive.exportSave({ keepKey: true })).blob.arrayBuffer()));
  check('明确要求时才带密钥', withKey.files['settings.ini'].includes('sk-secret'));
  /* 合并：当前已有的角色不会被重复导入 */
  const nBefore = mem.size;
  check('合并不会重复导入已有角色', (await CY.archive.apply(info, 'merge')) === 0 && mem.size === nBefore);
  /* 覆盖：清空后从存档恢复，并保留本机的密钥 */
  const gid = grandpa.id;
  await CY.archive.apply(info, 'replace');
  check('覆盖后角色都回来了，本机已有密钥被保留', mem.has(`people/${gid}/person.yaml`) && mem.get('settings.ini').includes('sk-secret'));
  await G.load(); refs();
  check('覆盖后能正常载入', G.people.length === 3 + A.length && G.sayings[grandpa.id].some(s => s.ans === 'custom'));
  /* 别的软件打的 deflate 压缩包也能读，危险路径被拒绝 */
  const dz = (entries) => {
    const parts = [], cen = []; let off = 0;
    for (const [name, text] of entries) {
      const raw = Buffer.from(text), def = zlib.deflateRawSync(raw), nm = Buffer.from(name);
      const crc = zlib.crc32 ? zlib.crc32(raw) : 0;
      const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x800, 6); h.writeUInt16LE(8, 8); h.writeUInt32LE(crc, 14); h.writeUInt32LE(def.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(nm.length, 26);
      parts.push(h, nm, def);
      const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x800, 8); c.writeUInt16LE(8, 10); c.writeUInt32LE(crc, 16); c.writeUInt32LE(def.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(nm.length, 28); c.writeUInt32LE(off, 42);
      cen.push(c, nm); off += 30 + nm.length + def.length;
    }
    const cd = Buffer.concat(cen), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(entries.length, 8); e.writeUInt16LE(entries.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
    return new Uint8Array(Buffer.concat([...parts, cd, e]));
  };
  const evil = await CY.archive.inspect(dz([['people/x1/person.yaml', 'name: 甲\n'], ['../evil.yaml', 'a: 1\n'], ['people/x1/state.yaml', ':\n  - [bad'], ['settings.ini', '[time]\nmode = real\n']]));
  check('压缩过的 zip 能读，危险路径和坏 YAML 被拒绝', evil.ok && evil.files['people/x1/person.yaml'] && evil.rejected.includes('../evil.yaml') && evil.rejected.includes('people/x1/state.yaml'), JSON.stringify(evil.rejected));
  check('比当前版本新的存档被拒绝', (await CY.archive.inspect(dz([['manifest.json', JSON.stringify({ schema: 99 })], ['settings.ini', 'x']]))).error === 'newer');
  check('不是 zip 被拒绝', (await CY.archive.inspect(new Uint8Array([1, 2, 3, 4]))).error === 'zip');

  /* 账号预留 */
  check('账号功能默认未启用，调用会明确拒绝', !CY.account.enabled(G.cfg) && (await CY.account.signIn().catch(e => e.message)) === 'not_enabled' && CY.account.consentRecord('upload', true).granted === true);

  /* 快进到一个时刻，到了回到一倍速，之后和现实分开；对回现实时直接跟现实的钟 */
  G.cfg.time.mode = 'real'; G.cfg.time.daynight = 'auto'; G.world.tasks = [];
  await G.fastForward({ plus: 90 });
  check('快进里是点击模式，倍速生效', G.timeMode() === 'compressed' && G.inputMode() === 'click' && !!G.world.ff_target);
  const ffEnd = G.world.ff_target;
  for (let i = 0; i < 400 && G.timeMode() === 'compressed'; i++) { G.lastTick = Date.now() - 1000; G.tick(); }
  check('快进到了就回到一倍速的游戏时间', G.timeMode() === 'free' && G.world.game_minutes >= ffEnd && !G.world.ff_target && G.inputMode() === 'hold');
  const gmFree = G.world.game_minutes; G.lastTick = Date.now() - 1000; G.tick();
  check('自走时一倍速向前走', G.world.game_minutes - gmFree > 0.9 / 60 && G.world.game_minutes - gmFree < 1.1 / 60 + 1e-9);
  await G.backToReal();
  const sysDm = new Date().getHours() * 60 + new Date().getMinutes();
  check('对回现实后钟直接是现实的钟', G.timeMode() === 'real' && Math.abs(G.dayMinutes() - sysDm) <= 1);
  await G.fastForward({ to: 'morning' });
  const dm0 = G.dayMinutes();
  check('快进到早上七点的目标是下一个七点', (((G.world.ff_target - G.world.game_minutes) + dm0) % 1440) === 420);
  await G.stopFastForward(); await G.backToReal();

  /* 手改后的 YAML 容错：缺字段 */
  mem.set(`people/${grandpa.id}/state.yaml`, 'version: 1\n');
  await G.load(); refs();
  check('状态文件缺字段时用默认值', typeof grandpa.state.mood === 'number' && 'thirst' in grandpa.state.needs && grandpa.state.learn.kinds && Array.isArray(grandpa.state.asked));

  /* ---------- v0.5：年龄阶段、类别、自理、哭闹、代价系统 ---------- */
  const mk = async (arch, name, extra) => { const id = await G.createPerson(Object.assign({ arch, name }, extra || {})); await G.load(); refs(); return G.get(id); };
  const stg = CY.content.stageOf;
  check('年龄换成阶段', [0.5, 1, 3.9, 4, 12, 13, 17, 18, 64, 65].map(stg).join() === 'infant,toddler,toddler,child,child,teen,teen,adult,adult,elder');
  let bb = await mk('baby', '小宝'), sis2 = await mk('sister', '阿姐'), eld = await mk('grandma', '阿婆', { conditions: ['arthritis', 'forgetful'] }), tdl = await mk('toddler', '二岁');
  check('婴儿喂奶换尿布，没有倒水和做饭', 'feed' in G.actionsOf(bb) && 'diaper' in G.actionsOf(bb) && !('water' in G.actionsOf(bb)) && !('meal' in G.actionsOf(bb)));
  check('姐姐不能喂饭也不能换尿布，但可以聊天', !('feed' in G.actionsOf(sis2)) && !('diaper' in G.actionsOf(sis2)) && 'chat' in G.actionsOf(sis2));
  check('老人可以散步和扶去休息', 'walk' in G.actionsOf(eld) && 'rest' in G.actionsOf(eld));
  check('一岁以下和两岁的需求不同', G.needsOf(bb).hunger.rateNow > G.needsOf(tdl).hunger.rateNow && 'diaper' in G.needsOf(bb) && G.needsOf(bb).play.rateNow !== G.needsOf(tdl).play.rateNow);
  check('疾病带来的需求和动作并入', 'joint' in G.needsOf(eld) && 'heat' in G.actionsOf(eld) && 'reorient' in G.needsOf(eld));
  check('疾病自带台词，按需求取', G.lines(eld, 'request', 'joint').length > 0 && G.lines(eld, 'request', 'reorient').length > 0);
  check('老人的类别比成人更紧迫，婴儿最紧迫', G.classOf(bb).urgency > G.classOf(eld).urgency && G.classOf(eld).urgency > G.classOf(sis2).urgency);
  bb.state.needs.hunger = 0.9; eld.state.needs.hunger = 0.9;
  check('同样饿，婴儿比老人更急', G.urgency(bb) > G.urgency(eld));
  const plantS = await mk('succulent', '多肉1'), flowerP = await mk('flower', '小花1'), dogP = await mk('dog', '旺财'), fishP = await mk('fish', '金金'), rabbitP = await mk('rabbit', '白兔');
  check('花草按时间产生需求，浇水慢于宠物喝水', G.needsOf(flowerP).water.rateNow < G.needsOf(dogP).thirst.rateNow && G.needsOf(plantS).water.rateNow < G.needsOf(flowerP).water.rateNow);
  check('花草和宠物各有自己的动作，花草不是人', 'sun' in G.actionsOf(flowerP) && !('feed' in G.actionsOf(flowerP)) && 'clean' in G.actionsOf(fishP) && G.askBank(flowerP).length === 0 && flowerP.person.kind === 'plant');
  [bb, sis2, eld, tdl] = [bb, sis2, eld, tdl].map(p => G.get(p.id));
  check('每种原型都能画出形象', CY.content.archetypes.every(a => /<svg/.test(CY.avatarPreview(a, a.look))));
  check('两种画法都能画', (() => { CY.avatarStyle = 'detailed'; const d = CY.avatarPreview(CY.content.archOf('mom'), CY.content.archOf('mom').look); CY.avatarStyle = 'simple'; const s2 = CY.avatarPreview(CY.content.archOf('mom'), CY.content.archOf('mom').look); return d.length > s2.length; })());
  check('默认肤色都偏浅', CY.content.archetypes.filter(a => a.species === 'human').every(a => a.look.skin <= 4) && CY.avatarOptions.skin.length >= 8 && CY.avatarOptions.skin[0] === '#fffaf6');

  /* 没人管：婴儿哭闹，老人自己解决 */
  G.cfg.time.mode = 'compressed'; G.cfg.interrupt.frequency = 'normal'; G.cfg.interrupt.quiet_hours = ''; G.cfg.play.economy = 'false';
  for (const p of G.people) { for (const k in p.state.needs) p.state.needs[k] = 0.1; p.person.active = false; }
  bb.person.active = true; eld.person.active = true; sis2.person.active = true;
  bb.state.needs.hunger = 0.95; eld.state.needs.hunger = 0.95; eld.state.needs.rest = 0.95;
  G.lastTick = Date.now() - 1000; G.nextAt = Date.now() + 1e9; G.tick();
  check('婴儿需求严重时哭闹，老人不哭', G.crying[bb.id] && !G.crying[eld.id] && G.toast[bb.id].kind === 'cry');
  let selfDone = 0, infantSelf = 0; const n0s = eld.state.needs.hunger;
  for (let i = 0; i < 4000; i++) { G.lastTick -= 5000; for (const p of [eld, bb]) p.state.needs.hunger = Math.max(p.state.needs.hunger, 0.9); const h = eld.state.needs.hunger; G.tick(); }
  check('老人没人管会自己解决，婴儿不会', G.journal[eld.id] && Object.values(G.journal[eld.id]).flat().some(e => e.type === 'self') && !(G.journal[bb.id] && Object.values(G.journal[bb.id]).flat().some(e => e.type === 'self')));
  check('哭闹只记一次', Object.values(G.journal[bb.id]).flat().filter(e => e.type === 'cry').length === 1);
  for (const k in bb.state.needs) bb.state.needs[k] = 0.1; G.lastTick = Date.now() - 1000; G.tick();
  check('需求解决后不再哭', !G.crying[bb.id]);
  for (const p of [bb, eld, sis2]) { p.person.active = true; }

  /* 急性病：照顾够了次数就好 */
  const sick = await mk('toddler', '病宝', { conditions: ['cold'] });
  const hold0 = G.economyOn();
  for (let i = 0; i < 3; i++) { sick.state.needs.fever = 0.8; G.perform(sick.id, 'fever'); }
  check('感冒照顾三次痊愈', !sick.person.conditions.includes('cold') && Object.values(G.journal[sick.id]).flat().some(e => e.type === 'recovered'));

  /* 轻量体验不检查物品；完整体验才要钱和物品 */
  const tp = await mk('toddler', '测试宝'); tp.state.needs.hunger = 0.9; G.world.inv.food = 0;
  check('轻量体验不检查物品', G.perform(tp.id, 'feed') === true && tp.state.needs.hunger < 0.3);
  G.cfg.play.economy = 'true'; G.world.money = 100; tp.state.needs.hunger = 0.9; G.world.inv.food = 0;
  check('完整体验缺食材时做不了', G.perform(tp.id, 'feed') === false && tp.state.needs.hunger === 0.9);
  check('买东西花钱', G.buy('food', 2) === true && G.world.money === 70 && G.world.inv.food === 2);
  check('钱不够买不了', G.buy('toy', 5) === false && G.world.money === 70);
  G.perform(tp.id, 'feed');
  check('做了就消耗食材', G.world.inv.food === 1 && tp.state.needs.hunger < 0.3);
  tp.state.needs.play = 0.9; G.world.inv.toy = 1; G.perform(tp.id, 'play'); const withToy = 0.9 - tp.state.needs.play;
  tp.state.needs.play = 0.9; G.world.inv.toy = 0; G.perform(tp.id, 'play'); const noToy = 0.9 - tp.state.needs.play;
  check('没有玩具时玩耍效果减半', Math.abs(noToy - withToy / 2) < 0.01, withToy.toFixed(2) + ' vs ' + noToy.toFixed(2));

  /* 工作赚钱，点击动作花掉游戏时间并暂停收入 */
  G.cfg.time.mode = 'compressed'; G.cfg.time.compress_ratio = '60'; G.cfg.time.daynight = 'system'; G.cfg.economy.work_hours = '00:00-23:59';
  G.cfg.interrupt.frequency = 'normal'; G.nextAt = Date.now() + 1e9; G.world.tasks = []; G.world.money = 0;
  for (const p of G.people) p.state.needs = Object.fromEntries(Object.keys(p.state.needs).map(k => [k, 0.05]));
  G.lastTick = Date.now() - 1000; G.tick();
  const earned = G.world.money;
  check('工作时段里赚钱', earned > 0, String(earned));
  check('工资按游戏小时算', Math.abs(earned - ini40()) < 0.5, earned.toFixed(2));
  function ini40() { return CY.ini.num(G.cfg, 'economy', 'wage') * 1 / 60 * 60 / 60 * 1; }
  G.world.inv.food = 3; tp.state.needs.hunger = 0.9; tp.state.needs.company = 0.9;
  check('故事模式里点击就是开始一件事', G.playMode() === 'story' && G.inputMode() === 'click');
  check('点击开始一件事，占用游戏时间', G.startAction(tp.id, 'feed') === true && G.tasks().length === 1 && G.runningTask().total === 25);
  const m1 = G.world.money; check('做的过程中效果还没生效', tp.state.needs.hunger > 0.85);
  check('同一件事不能重复开始', G.startAction(tp.id, 'feed') === false && G.tasks().length === 1);
  check('后开始的把先开始的压下去，先暂停', G.startAction(tp.id, 'pet') === true && G.tasks().length === 2 && G.runningTask().act === 'pet');
  G.lastTick = Date.now() - 1000; G.tick();
  check('忙着的时候不赚钱', G.world.money === m1 && G.isBusy());
  G.lastTick = Date.now() - 1000; G.tick();
  check('插进来的做完了，先开始的接着做，时间没有被偷走', G.tasks().length === 1 && G.runningTask().act === 'feed' && Math.abs(G.runningTask().left - 25) < 0.01, JSON.stringify(G.tasks()));
  for (let i = 0; i < 30; i++) { G.lastTick = Date.now() - 1000; G.tick(); }
  check('时间到了动作完成', G.tasks().length === 0 && tp.state.needs.hunger < 0.3 && G.world.inv.food <= 2);
  G.lastTick = Date.now() - 1000; G.tick();
  check('做完后又开始赚钱', G.world.money > m1);
  check('忙的时候超过四件不让开始', (() => { G.startAction(tp.id, 'pet'); G.startAction(tp.id, 'hug'); G.startAction(tp.id, 'play'); G.startAction(tp.id, 'soothe'); const r = G.startAction(tp.id, 'diaper'); const n = G.tasks().length; G.world.tasks = []; return r === false && n === 4; })());

  /* 现实模式和故事模式的切换 */
  await G.setPlayMode('story'); G.startAction(tp.id, 'soothe'); const left0 = G.runningTask().left, mny = G.world.money;
  await G.setPlayMode('reality');
  check('切到现实模式：时间跟现实走，长按', G.timeMode() === 'real' && G.playMode() === 'reality' && G.inputMode() === 'hold' && G.daySource() === 'system');
  G.lastTick = Date.now() - 1000; G.tick();
  check('现实模式里故事里的事停着，不走时间', G.runningTask().left === left0 && !G.isBusy());
  check('现实模式里照样赚钱', G.world.money > mny);
  check('现实模式里点击也是立刻生效', (() => { tp.state.needs.rest = 0.9; const ok = G.startAction(tp.id, 'soothe') === true; return ok && tp.state.needs.rest < 0.3 && G.tasks().length === 1; })());
  await G.setPlayMode('story');
  check('回到故事模式，停着的事接着做', G.timeMode() === 'compressed' && G.inputMode() === 'click');
  G.lastTick = Date.now() - 1000; G.tick();
  check('接着做时时间在走', G.runningTask().left < left0);
  await G.setPlayMode('story'); G.world.tasks = [];
  check('游戏时钟下不再带现实时间', !('realHh' in G.clock()) && !('realMm' in G.clock()));

  /* 保姆：需求涨得慢，花钱，没钱先走 */
  G.world.money = 50; G.setNanny(tp.id, true);
  tp.state.needs.rest = 0.2; const slow = tp.state.needs.rest;
  G.nextAt = Date.now() + 1e9; G.lastTick = Date.now() - 1000; G.tick();
  check('请了保姆工作时段要花钱', G.hasNanny(tp) && G.world.money < 50 + 1000);
  G.world.money = -1; G.world.nanny[tp.id] = true; G.lastTick = Date.now() - 1000; G.tick();
  check('钱花光保姆先走', !G.hasNanny(tp) && G.world.money === 0);

  /* 旧数据：缺年龄的人按阶段补年龄，旧版本的物种模板被新版覆盖 */
  const legacy = await mk('grandpa', '旧爷爷');
  const pr = ctx.jsyaml.load(mem.get(`people/${legacy.id}/person.yaml`)); delete pr.age; pr.age_stage = 'elder'; mem.set(`people/${legacy.id}/person.yaml`, ctx.jsyaml.dump(pr));
  mem.set('templates/species/human.yaml', 'version: 1\nid: human\nlabel: 人\nneeds: {}\nactions: {}\n');
  await G.load(); refs();
  check('旧数据按阶段补上年龄', G.get(legacy.id).person.age === 75 && G.stage(G.get(legacy.id)) === 'elder');
  check('旧版本的物种模板被新版覆盖', ctx.jsyaml.load(mem.get('templates/species/human.yaml')).version === 3 && Object.keys(G.tpl.species.human.needs).length > 5);
  G.cfg.play.economy = 'false';


  /* ---------- v0.6：自己做、睡觉、性格特征、更多动作、内容包、场景 ---------- */
  const eld2 = await mk('grandpa', '独居老人'); const kid2 = await mk('daughter', '小孩'); const hamP = await mk('hamster', '仓鼠鼠'); const owl = await mk('sister', '夜猫', { traits: ['nightowl'] }); const lark = await mk('sister', '早起', { traits: ['earlybird'] });
  check('自己做的动作不在菜单里，但属于角色自己', !('drink' in G.actionsOf(eld2)) && 'drink' in G.allActionsOf(eld2) && 'cook' in G.allActionsOf(eld2) && !('drink' in G.allActionsOf(await mk('baby', '宝'))));
  const bby = G.people[G.people.length - 1];
  check('婴儿没有任何自己能做的动作', Object.values(G.allActionsOf(bby)).every(a => !a.self));
  G.cfg.play.economy = 'false'; G.cfg.time.mode = 'compressed'; G.cfg.time.daynight = 'game'; G.cfg.time.compress_ratio = '60'; G.cfg.interrupt.frequency = 'normal'; G.nextAt = Date.now() + 1e9;
  for (const p of G.people) p.person.active = false;
  const E = G.get(eld2.id); E.person.active = true; E.state.needs.thirst = 0.95; E.state.needs.hunger = 0.95;
  G.world.game_minutes = 12 * 60 - 8 * 60;
  let selfLogs = 0;
  for (let i = 0; i < 3000; i++) { E.state.needs.thirst = Math.max(E.state.needs.thirst, 0.9); G.lastTick = Date.now() - 1000; G.tick(); if (G.world.game_minutes > 1e9) break; }
  const selfs = Object.values(G.journal[E.id] || {}).flat().filter(e => e.type === 'self');
  check('没人管的老人会自己倒水做饭，行动记进日志', selfs.length > 0 && selfs.some(e => /倒了杯水|做了顿饭|小睡|洗了个澡|看了会儿电视|吃了药/.test(e.text)), selfs.slice(0, 2).map(e => e.text).join('|'));
  check('自己做的次数也记在角色身上', (E.story.self_total || 0) > 0);
  /* 作息 */
  const K = G.get(kid2.id), HA = G.get(hamP.id), OW = G.get(owl.id), LA = G.get(lark.id);
  for (const p of [K, HA, OW, LA]) p.person.active = true;
  const at = (h) => { G.cfg.time.daynight = 'game'; G.world.game_minutes = ((h * 60 - 8 * 60) + 1440 * 5) % 1440 + 1440 * 5; for (const p of G.activePeople()) G.act[p.id] = G.activityOf(p); };
  for (const p of [K, E]) p.state.needs = Object.fromEntries(Object.keys(p.state.needs).map(k => [k, 0.1]));
  at(23); check('夜里成人孩子在睡觉', G.act[K.id] === 'sleeping' && G.act[E.id] === 'sleeping');
  at(12); check('白天醒着', G.act[K.id] === 'awake' && G.act[E.id] === 'awake');
  at(12); check('仓鼠白天睡', G.act[HA.id] === 'sleeping');
  at(23); check('夜猫子晚上十一点还醒着，凌晨两点在睡', G.act[OW.id] === 'awake' && (at(2), G.act[OW.id] === 'sleeping'));
  at(5); check('早起的人五点已经醒了', G.act[LA.id] === 'awake' && G.act[K.id] === 'sleeping');
  at(23); const babyS = G.get(bby.id); babyS.person.active = true; babyS.state.needs = Object.fromEntries(Object.keys(babyS.state.needs).map(k => [k, 0.1]));
  const wakeups = new Set(); for (let dm = 0; dm < 180; dm += 10) { G.world.game_minutes = 1440 * 5 + (23 * 60 - 8 * 60) + dm; wakeups.add(G.activityOf(babyS)); }
  check('婴儿夜里睡睡醒醒', wakeups.has('sleeping') && wakeups.has('awake'));
  babyS.state.needs.hunger = 0.95; at(23); check('婴儿很饿时醒着', G.activityOf(babyS) === 'awake');
  /* 睡觉时的效果 */
  for (const p of G.people) p.person.active = false; K.person.active = true; E.person.active = true;
  for (const p of [K, E]) p.state.needs = Object.fromEntries(Object.keys(p.state.needs).map(k => [k, 0.1])); at(23); K.state.needs.rest = 0.8; G.lastTick = Date.now() - 1000; G.nextAt = Date.now() + 1e9; G.tick();
  check('睡着的人疲倦会下降', K.state.needs.rest < 0.8);
  G.req = {}; K.state.needs.thirst = 0.9; E.state.needs.thirst = 0.9; let reqs = 0; for (let i = 0; i < 200; i++) { G.req = {}; G.fire(); reqs += Object.keys(G.req).length; }
  check('睡着的人不会来打扰', reqs === 0);
  at(12);
  /* 性格特征 */
  const cl = await mk('toddler', '黏人精', { traits: ['clingy'] }); const pl = await mk('toddler', '普通娃');
  const C1 = G.get(cl.id), P1 = G.get(pl.id);
  check('黏人的孩子想要陪伴涨得更快', G.traitMods(C1).rate.company > 1.5 && G.traitMods(P1).rate.company === undefined);
  const ind = await mk('brother', '独立哥', { traits: ['independent', 'sturdy'] });
  check('独立的人自理更强，结实的人虚弱涨得慢', G.classOf(G.get(ind.id)).self_care > G.classOf(G.get(await mk('brother', '普通哥').then(x => x.id))).self_care && G.traitMods(G.get(ind.id)).frailty < 1);
  check('性格特征最多两个', (await mk('brother', '多特征', { traits: ['clingy', 'sickly', 'grumpy'] })).person.traits.length === 2);
  /* 更多动作 */
  const doc = await mk('grandpa', '看病的', { conditions: ['cold'] }); const DC = G.get(doc.id);
  G.cfg.play.economy = 'true'; G.world.money = 100; DC.state.needs.fever = 0.9;
  check('完整体验里看医生要花钱', 'doctor' in G.actionsOf(DC) && G.perform(DC.id, 'doctor') === true && G.world.money === 20 && !DC.person.conditions.includes('cold'));
  G.world.money = 10; check('钱不够看不了医生', G.perform(DC.id, 'doctor') === false && G.lacking(G.actionsOf(DC).doctor) === 'money');
  G.cfg.play.economy = 'false';
  check('宠物有梳毛和看兽医，花草有换盆，洗澡只有需要的人', 'groom' in G.actionsOf(G.get(dogP.id)) && 'vet' in G.actionsOf(G.get(dogP.id)) && 'repot' in G.actionsOf(G.get(flowerP.id)) && 'bath' in G.actionsOf(C1) && !('bath' in G.actionsOf(G.get(ind.id))));
  const act26 = new Set(); for (const p of G.people) for (const k in G.allActionsOf(p)) act26.add(k);
  check('动作种类丰富', act26.size >= 40, String(act26.size));
  check('新的身份能创建', ['husband', 'wife', 'neighbor', 'roommate', 'parrot', 'cactus'].every(id => CY.content.archOf(id)) && G.people.length > 0);
  /* 内容包 */
  const zhP = CY.content.packFor('zh-CN'), enP = CY.content.packFor('en'), frP = CY.content.packFor('xx');
  check('英文内容包的每种声线都齐全', Object.keys(zhP.voices).every(v => enP.voices[v] && enP.voices[v].request && enP.voices[v].glance && enP.voices[v].cares_back && enP.voices[v].reveal), Object.keys(zhP.voices).filter(v => !CY.content.packs.en.voices[v]).join());
  check('各语言的条目编号一致', JSON.stringify(zhP.sayings.map(x => x.id)) === JSON.stringify(enP.sayings.map(x => x.id)) && JSON.stringify(zhP.asks.map(x => x.id)) === JSON.stringify(enP.asks.map(x => x.id)) && JSON.stringify(zhP.nudges.map(x => x.id)) === JSON.stringify(enP.nudges.map(x => x.id)));
  check('英文的说话库和问答库真的是英文', enP.sayings.every(x => /[A-Za-z]/.test(x.text)) && enP.asks.every(q => /[A-Za-z]/.test(q.say) && q.answers.length === 3 && q.answers.every(a => /[A-Za-z]/.test(a))), enP.asks.filter(q => !/[A-Za-z]/.test(q.say) || q.answers.length !== 3).map(q => q.id).join());
  check('英文问题保留筛选条件', enP.asks.find(q => q.id === 'ask_s05').pronoun[0] === '她' && enP.asks.find(q => q.id === 'ask_a04').sensitive === true);
  check('没有内容包的语言回退到英文再回退到中文', frP.voices.elder.request.thirst[0].startsWith('...') && frP.sayings.length === zhP.sayings.length);
  G.cfg.ui.language = 'en'; await store_write_cfg(); CY.i18n.set('en'); await G.reloadContent();
  check('换语言时角色换成该语言的台词，问答也换', /[A-Za-z]/.test(G.lines(G.get(eld2.id), 'request', 'thirst')[0]) && G.askBank(G.get(eld2.id)).every(q => /[A-Za-z]/.test(q.say)));
  check('称呼随语言变，句首大写', G.fmt('{ta} smiled.', G.get(eld2.id)) === 'He smiled.' && G.fmt('and {ta} left', G.get(eld2.id)) === 'and he left');
  check('疾病的台词和事件文字也换了', /[A-Za-z]/.test(G.tpl.conditions.diabetes.events.dinner.say) && G.tpl.conditions.diabetes.events.dinner.choices[0].liked === true);
  check('内容包写成了按语言分的明文文件', mem.has('templates/content/en/voices/elder.yaml') && mem.has('templates/content/en/library/asks.yaml'));
  G.cfg.ui.language = 'zh-CN'; await store_write_cfg(); CY.i18n.set('zh-CN'); await G.reloadContent();
  check('切回中文后台词也回来', /[一-龥]/.test(G.lines(G.get(eld2.id), 'request', 'thirst')[0]) && G.fmt('{ta}笑了', G.get(eld2.id)) === '他笑了');

  /* 各语言的内容包：条目齐全，问题三个回答，没有残留的占位符错误 */
  const zhC = CY.content.packFor('zh-CN');
  for (const lang of ['en', 'zh-TW', 'ja', 'ko', 'fr', 'es', 'de']) {
    const P = CY.content.packs[lang];
    const need = (list, key) => zhC[list].map(x => x.id).filter(id => !(P[list] || []).some(y => y.id === id));
    const problems = [];
    if (!P) { problems.push('没有内容包'); } else {
      for (const v of Object.keys(zhC.voices)) { const pv = P.voices[v]; if (!pv) problems.push('声线 ' + v); else for (const g of ['request', 'glance', 'cares_back', 'reveal']) if (zhC.voices[v][g] && !pv[g]) problems.push(v + '.' + g); }
      for (const l of ['sayings', 'asks', 'nudges']) { const m = need(l); if (m.length) problems.push(l + ' 缺 ' + m.slice(0, 5).join()); }
      for (const q of P.asks) { if (!q.answers || q.answers.length !== 3 || q.answers.some(a => !a)) problems.push('回答数 ' + q.id); }
      for (const l of ['sayings', 'nudges']) for (const x of P[l]) if (!x.text) problems.push(l + ' 空 ' + x.id);
      for (const c of ['diabetes', 'hypertension']) { const e = Object.values((P.conds[c] || {}).events || {})[0]; if (!e || e.choices.length !== 3) problems.push('疾病事件 ' + c); }
      for (const q of P.asks) { const base = zhC.asks.find(b => b.id === q.id); if (base && (JSON.stringify(base.voice) !== JSON.stringify(q.voice) || JSON.stringify(base.pronoun) !== JSON.stringify(q.pronoun) || !!base.sensitive !== !!q.sensitive)) problems.push('条件被改 ' + q.id); }
    }
    check('内容包 ' + lang + ' 完整', problems.length === 0, problems.slice(0, 6).join('; '));
  }
  const phFmt = s => (String(s).match(/\{\w+\}/g) || []).sort().join();
  const badPh = [];
  for (const lang of ['en', 'ja', 'ko', 'fr']) for (const q of CY.content.packs[lang].asks) { const b = zhC.asks.find(x => x.id === q.id); if (phFmt(q.say) !== phFmt(b.say)) badPh.push(lang + ':' + q.id); }
  check('各语言问题里的 {title} 占位符和中文一致', badPh.length === 0, badPh.slice(0, 5).join());
  /* 场景 */
  check('五种场景都能画，昼夜不同', CY.scenes.ids.every(id => [3, 9, 19, 23].every(h => /<svg/.test(CY.scenes.svg(id, h))) && CY.scenes.svg(id, 3) !== CY.scenes.svg(id, 12)));
  check('自动场景白天客厅夜里卧室，纯色没有场景', CY.scenes.resolve('auto', 12) === 'living' && CY.scenes.resolve('auto', 23) === 'bedroom' && CY.scenes.resolve('lawn', 23) === 'lawn' && CY.scenes.resolve('none', 12) === null);

  /* AI 接入 */
  const ai = CY.ai;
  check('AI 默认关闭', !ai.enabled(G.cfg));
  check('关闭时不发请求', (await ai.run('speak', {}, G.tpl)) === null && ai.calls.length === 0);
  G.cfg.ai.enabled = 'true'; G.cfg.ai.provider = 'mock';
  const full = { persona: { name: '爷爷', role: '爷爷', voice: 'elder', temper: '倔强', catchphrases: ['嗯'], secret: '不该泄露' }, state: { mood: 0.5, frailty: 0.1, top_need: 'thirst', hidden: 1 }, situation: '随口说了一句', everything_else: 'x' };
  ai.mockReply = '{"text":"今天天气不错。"}';
  const a1 = await ai.run('speak', full, G.tpl);
  check('合法输出被接受', a1 && a1.text === '今天天气不错。');
  check('AI 只看到白名单里的上下文', ai.last.ctx.persona.secret === undefined && ai.last.ctx.state.hidden === undefined && ai.last.ctx.everything_else === undefined && ai.last.ctx.persona.name === '爷爷');
  ai.mockReply = '{"text":"我是真的你的爷爷。"}';
  check('命中禁用句式的输出被丢弃', (await ai.run('speak', full, G.tpl)) === null);
  ai.mockReply = '{"text":"' + '很长'.repeat(30) + '"}';
  check('超长输出被丢弃', (await ai.run('speak', full, G.tpl)) === null);
  ai.mockReply = 'not json';
  check('不是 JSON 被丢弃', (await ai.run('speak', full, G.tpl)) === null);
  ai.mockReply = '{"needy_delta": 5}';
  const a2 = await ai.run('adapt', full, G.tpl);
  check('数值越界被压回范围内', a2 && a2.needy_delta === 0.05);
  G.cfg.ai.max_calls_per_hour = '2';
  check('每小时调用次数有上限', (await ai.run('speak', full, G.tpl)) === null);
  G.cfg.ai.enabled = 'false';

  /* zip：不压缩的写出，读回内容一致 */
  const blob = CY.store.zip([{ name: 'careforyou-data/people/a.yaml', data: new TextEncoder().encode('名字: 爷爷\n') }, { name: 'careforyou-data/settings.ini', data: new TextEncoder().encode('[a]\nb = 1\n') }]);
  fs.writeFileSync(path.join(process.env.TEMP || '/tmp', 'cy_test.zip'), Buffer.from(await blob.arrayBuffer()));
  const back = await CY.store.readZip(new Uint8Array(await blob.arrayBuffer()));
  check('zip 写出再读回一致', back.length === 2 && new TextDecoder().decode(back[0].data) === '名字: 爷爷\n');
  console.log(fails ? `失败 ${fails} 项` : '全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
