/* 无头逻辑测试：用内存存储跑一遍载入、创建角色、时间、打断、动作、问答、挑话、学习、AI 校验、存档导入导出、多语言完整性。 */
const fs = require('fs'), vm = require('vm'), path = require('path'), zlib = require('zlib');
const ctx = vm.createContext({ console, Math, Date, JSON, RegExp, Promise, setInterval, clearInterval, setTimeout, clearTimeout, TextEncoder, TextDecoder, Blob, Response, DecompressionStream, Uint8Array, DataView, ArrayBuffer, fetch: undefined });
ctx.globalThis = ctx;
const root = path.join(__dirname, '..');
const run = f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
for (const f of ['vendor/js-yaml.min.js', 'src/meta.js', 'src/i18n.js', 'locales/zh-CN.js', 'locales/en.js', 'src/ini.js', 'src/store.js', 'src/archive.js']) run(f);
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
  });`, ctx);
for (const f of ['src/content.js', 'src/seed.js', 'src/ai.js', 'src/account.js', 'src/game.js']) run(f);
const CY = ctx.CY, G = CY.game;
let fails = 0;
const check = (n, c, x) => { if (!c) fails++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };
const total = () => Object.values(G.journal).reduce((a, m) => a + Object.values(m).reduce((b, e) => b + e.length, 0), 0);

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
  ['care', 'talk', 'missed', 'cares_back', 'glance', 'event', 'frail', 'recovered', 'reveal', 'picked', 'nudge'].forEach(k => used.add('type.' + k));
  ['interrupt', 'time', 'player', 'interaction', 'ui', 'privacy', 'account', 'ai'].forEach(k => used.add('sec.' + k));
  ['warm', 'mint', 'sky', 'rose', 'gray'].forEach(k => used.add('bg.' + k));
  ['none', 'round', 'square'].forEach(k => used.add('glasses.' + k));
  ['short', 'long', 'bob', 'ponytail', 'bun', 'curly', 'bald'].forEach(k => used.add('hair.' + k));
  ['zip', 'empty', 'newer'].forEach(k => used.add('import.err_' + k));
  ['about', 'privacy', 'credits', 'version'].forEach(k => used.add('about.tab_' + k));
  for (let i = 1; i <= 10; i++) used.add('priv.p' + i);
  const zh = ctx.CY.i18n.packs['zh-CN'], en = ctx.CY.i18n.packs.en;
  const missZh = [...used].filter(k => !(k in zh)), missEn = [...used].filter(k => !(k in en));
  check('界面用到的键中文包都有', missZh.length === 0, missZh.join());
  check('界面用到的键英文包都有', missEn.length === 0, missEn.join());
  const needKeys = new Set(), actKeys = new Set();
  for (const sp of ['human', 'cat', 'dog', 'snake']) { const y = CY.seed.files()[`templates/species/${sp}.yaml`]; const o = ctx.jsyaml.load(y); Object.keys(o.needs).forEach(k => needKeys.add(k)); Object.keys(o.actions).forEach(k => actKeys.add(k)); }
  check('英文包覆盖所有需求和动作标签', [...needKeys].every(k => 'need.' + k in en) && [...actKeys].every(k => 'act.' + k in en), [...needKeys].filter(k => !('need.' + k in en)).concat([...actKeys].filter(k => !('act.' + k in en))).join());
  const iniMiss = CY.ini.SCHEMA.filter(([s, k]) => !['ui.theme', 'ui.background', 'ui.language'].includes(s + '.' + k) && !(`ini.${s}.${k}` in en)).map(x => x[0] + '.' + x[1]);
  check('英文包覆盖所有设置说明', iniMiss.length === 0, iniMiss.join());

  /* 运行包清单和页面一致 */
  const refsInHtml = [...html.matchAll(/(?:src|href)="((?!#|http)[^"]+)"/g)].map(m => m[1]);
  const notInPack = refsInHtml.filter(f => !CY.archive.APP_FILES.includes(f)), notOnDisk = CY.archive.APP_FILES.filter(f => !fs.existsSync(path.join(root, f)));
  check('页面引用的文件都在运行包清单里', notInPack.length === 0, notInPack.join());
  check('运行包清单里的文件都存在', notOnDisk.length === 0, notOnDisk.join());

  /* 其他原型 */
  for (const a of A) await G.createPerson({ arch: a.id, name: a.role });
  await G.load();
  check('每种原型都能载入', G.people.length === 3 + A.length);
  check('每种原型都有声线和候选话', G.people.every(p => Object.keys(p.voice).length > 0 && G.pickOptions(p).length > 0));
  const talkers = G.people.filter(p => p.person.kind === 'human');
  check('每个人形原型都有可问的问题', talkers.every(p => G.askBank(p).length > 0), talkers.filter(p => !G.askBank(p).length).map(p => p.person.name).join());
  for (const p of G.people.slice(3)) p.person.active = false;
  await Promise.all(G.people.slice(3).map(p => CY.store.writeYaml(`people/${p.id}/person.yaml`, p.person)));
  await G.load(); refs();
  check('可以让角色离开桌面', G.activePeople().length === 3);

  /* 问答库按身份和称呼筛选，敏感话题默认不出现 */
  const sis = { person: { voice: 'sibling', age_stage: 'adult', pronoun: '她', kind: 'human', lines: {} }, species: { id: 'human' }, state: { asked: [] } };
  const bro = { person: { voice: 'sibling', age_stage: 'adult', pronoun: '他', kind: 'human', lines: {} }, species: { id: 'human' }, state: { asked: [] } };
  const kid = { person: { voice: 'child', age_stage: 'child', pronoun: '她', kind: 'human', lines: {} }, species: { id: 'human' }, state: { asked: [] } };
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
  G.cfg.time.mode = 'paused';
  check('暂停时不排期', !isFinite(G.secPerGameMin()));
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
  check('世界文件记了数据结构版本', ctx.jsyaml.load(mem.get('world.yaml')).schema === 2);

  /* 存档导出，再导入 */
  CY.ini; mem.set('settings.ini', CY.ini.stringify(Object.assign({}, G.cfg, { ai: Object.assign({}, G.cfg.ai, { api_key: 'sk-secret' }) })));
  const s1b = await CY.archive.exportSave();
  const zipBuf = Buffer.from(await s1b.blob.arrayBuffer());
  fs.writeFileSync(path.join(process.env.TEMP || '/tmp', 'cy_save_test.zip'), zipBuf);
  const info = await CY.archive.inspect(new Uint8Array(zipBuf));
  check('存档能被读回，带 manifest 和角色名', info.ok && info.manifest && info.manifest.schema === 2 && info.people.length === 3 + A.length, info.error);
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

  /* 暂停模式不推进 */
  G.cfg.time.mode = 'paused';
  const m0 = G.world.game_minutes;
  G.lastTick -= 5000; G.tick();
  check('暂停时游戏时间不走', G.world.game_minutes === m0);

  /* 手改后的 YAML 容错：缺字段 */
  mem.set(`people/${grandpa.id}/state.yaml`, 'version: 1\n');
  await G.load(); refs();
  check('状态文件缺字段时用默认值', typeof grandpa.state.mood === 'number' && 'thirst' in grandpa.state.needs && grandpa.state.learn.kinds && Array.isArray(grandpa.state.asked));

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
