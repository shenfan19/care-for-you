/* 无头逻辑测试：用内存存储跑一遍载入、创建角色、时间推进、打断、动作、挑话、学习、AI 校验和导出。 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = vm.createContext({ console, Math, Date, JSON, RegExp, Promise, setInterval, clearInterval, setTimeout, clearTimeout, TextEncoder, Blob, fetch: undefined });
ctx.globalThis = ctx;
const root = path.join(__dirname, '..');
for (const f of ['vendor/js-yaml.min.js', 'src/ini.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
/* 内存存储代替浏览器存储 */
const mem = new Map();
vm.runInContext(`
  CY.store = {
    read: async p => (globalThis.__mem.has(p) ? globalThis.__mem.get(p) : null),
    list: async () => [...globalThis.__mem.keys()],
    write: async (p, t) => { globalThis.__mem.set(p, t); },
    readYaml: async p => { const t = globalThis.__mem.get(p); return t === undefined ? null : jsyaml.load(t); },
    writeYaml: async (p, o) => { globalThis.__mem.set(p, jsyaml.dump(o, { lineWidth: -1 })); },
  };`, ctx);
ctx.__mem = mem;
for (const f of ['src/content.js', 'src/seed.js', 'src/ai.js', 'src/game.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const CY = ctx.CY, G = CY.game;
let fails = 0;
const check = (n, c, x) => { if (!c) fails++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };
const total = () => Object.values(G.journal).reduce((a, m) => a + Object.values(m).reduce((b, e) => b + e.length, 0), 0);

(async () => {
  await G.load();
  check('第一次进来没有角色，由引导页选', G.people.length === 0);
  check('种子里有声线、说话库、提醒库、AI 技能', G.tpl.voices.elder && G.tpl.sayLib.length > 30 && G.tpl.nudges.length > 3 && G.tpl.skills.speak && G.tpl.persona);
  check('原型至少 15 种', CY.content.archetypes.length >= 15);

  /* 一键推荐组合 */
  for (const m of CY.content.presets[0].members) await G.createPerson({ arch: m.arch, name: m.name, conditions: m.conditions });
  await G.load();
  let grandpa, baby, cat; const refs = () => { grandpa = G.people.find(p => p.person.name === '爷爷'); baby = G.people.find(p => p.person.name === '宝宝'); cat = G.people.find(p => p.person.name === '团子'); }; refs();
  check('推荐组合创建了三个角色', G.people.length === 3 && grandpa && baby && cat);
  check('爷爷有糖尿病需求', 'medicine' in G.needsOf(grandpa));
  check('宝宝有玩耍需求，爷爷没有', 'play' in G.needsOf(baby) && !('play' in G.needsOf(grandpa)));
  check('爷爷的摸一摸标签是拍拍肩', G.actionsOf(grandpa).pet.label === '拍拍肩');
  check('台词里的 {ta} 按称呼替换', G.fmt('{ta}看了你一眼', grandpa) === '他看了你一眼' && G.fmt('{ta}看了你一眼', cat) === '它看了你一眼');
  check('角色没写的台词用声线模板', G.lines(grandpa, 'request', 'thirst').length > 0 && G.lines(cat, 'glance').length > 0);
  check('settings.ini 读得出默认频率', CY.ini.get(G.cfg, 'interrupt', 'frequency') === 'normal');
  check('ini 往返一致', JSON.stringify(CY.ini.parse(CY.ini.stringify(G.cfg))) === JSON.stringify(G.cfg));

  /* 其他原型都能创建并有台词 */
  for (const a of CY.content.archetypes) await G.createPerson({ arch: a.id, name: a.role });
  await G.load();
  check('每种原型都能载入', G.people.length === 3 + CY.content.archetypes.length);
  check('每种原型都有声线和候选话', G.people.every(p => Object.keys(p.voice).length > 0 && G.pickOptions(p).length > 0), G.people.filter(p => !Object.keys(p.voice).length || !G.pickOptions(p).length).map(p => p.person.name).join());
  for (const p of G.people.slice(3)) p.person.active = false;
  await Promise.all(G.people.slice(3).map(p => CY.store.writeYaml(`people/${p.id}/person.yaml`, p.person)));
  await G.load();
  check('可以让角色离开桌面', G.activePeople().length === 3); refs();

  /* 时间与频率 */
  G.cfg.interrupt.frequency = 'normal';
  G.cfg.time.mode = 'real'; const s1 = G.secPerGameMin();
  G.cfg.time.mode = 'compressed'; const s2 = G.secPerGameMin();
  check('压缩时间下打扰间隔按比例变短', s1 / s2 === +G.cfg.time.compress_ratio || Math.abs(s1 / s2 - +G.cfg.time.compress_ratio) < 1e-9);
  G.cfg.time.mode = 'paused';
  check('暂停时不排期', !isFinite(G.secPerGameMin()));

  G.cfg.interrupt.frequency = 'test';
  G.cfg.interrupt.quiet_hours = '';
  G.cfg.time.mode = 'compressed';
  G.start();
  for (let i = 0; i < 600; i++) { G.lastTick -= 1000; G.nextAt = 0; G.tick(); }
  check('跑 600 秒后产生了日志', total() > 0, 'journal=' + total());
  check('说过的话有记录', Object.values(G.sayings).some(a => a.length > 0));
  check('需求不超过 1', G.people.every(p => Object.values(p.state.needs).every(v => v >= 0 && v <= 1)));
  const seen = new Set(); for (let i = 0; i < 400; i++) { G.req = {}; G.fire(); for (const r of Object.values(G.req)) seen.add(r.kind); }
  check('各种打断都能出现', ['need', 'ask', 'pick', 'choice'].every(k => seen.has(k)) , [...seen].join());

  /* 动作 */
  G.req = {};
  baby.state.needs.thirst = 0.9;
  G.req[baby.id] = { pid: baby.id, kind: 'need', need: 'thirst', text: '水！', since: Date.now() - 3000, deadline: 0 };
  const n0 = baby.state.learn.n_resp;
  G.perform(baby.id, 'water');
  check('倒水后口渴下降且打断结束', baby.state.needs.thirst < 0.4 && !G.req[baby.id]);
  check('响应被学习记录', baby.state.learn.n_resp === n0 + 1);

  /* 问话与选择 */
  G.req[grandpa.id] = { pid: grandpa.id, kind: 'ask', text: '你最近睡得好吗？', prompt: '', since: Date.now(), deadline: 0 };
  G.answer(grandpa.id, '还行，就是有点累。');
  check('回答被记成玩家说的话', G.sayings[grandpa.id].some(s => s.by === 'you' && s.text.includes('有点累')));
  const dinner = G.tpl.conditions.diabetes.events.dinner;
  G.req[grandpa.id] = { pid: grandpa.id, kind: 'choice', text: dinner.say, choices: dinner.choices, since: Date.now(), deadline: 0 };
  const f0 = grandpa.state.frailty;
  G.choose(grandpa.id, 2);
  check('选清淡的晚饭虚弱度不升', grandpa.state.frailty <= f0);

  /* 挑一句话：库编号和原文一起记 */
  G.req = {};
  const opts = G.pickOptions(grandpa);
  G.req[grandpa.id] = { pid: grandpa.id, kind: 'pick', text: 'x', options: opts, since: Date.now(), deadline: 0 };
  const before = (G.sayings[grandpa.id] || []).length;
  G.pickSaying(grandpa.id, 1);
  const rec = G.sayings[grandpa.id][before];
  check('挑话记下库编号和原文', rec && rec.lib === opts[1].id && rec.text === G.fmt(opts[1].text, grandpa) && rec.by === 'char', JSON.stringify(rec));
  check('挑过的话不会再出现在候选里', !G.pickOptions(grandpa, 50).some(o => o.id === opts[1].id));
  check('挑过的话进入角色的说话池', G.speechPool(grandpa).includes(rec.text));
  G.req[grandpa.id] = { pid: grandpa.id, kind: 'pick', text: 'x', options: G.pickOptions(grandpa), since: Date.now(), deadline: 0 };
  const o1 = G.req[grandpa.id].options.map(o => o.id).join();
  let changed = false; for (let i = 0; i < 20 && !changed; i++) { G.rerollPick(grandpa.id); changed = G.req[grandpa.id].options.map(o => o.id).join() !== o1; }
  check('可以换一批候选', changed);

  /* 现实提醒 */
  G.req = {};
  G.req[grandpa.id] = { pid: grandpa.id, kind: 'nudge', nudge: 'n01', text: 'x', since: Date.now(), deadline: 0 };
  G.answerNudge(grandpa.id, true);
  check('回应现实提醒被记录', grandpa.story.nudge_done === 1 && !G.req[grandpa.id]);

  /* 学习：连续忽略的角色会被更少打扰，常回应的更多 */
  const w0 = cat.state.learn.needy;
  for (let i = 0; i < 6; i++) { G.req[cat.id] = { pid: cat.id, kind: 'ask', text: 'x', prompt: '', since: Date.now(), deadline: 0 }; G.dismiss(cat.id); }
  check('连续忽略后更少打扰', cat.state.learn.needy < w0, `${w0.toFixed(2)} -> ${cat.state.learn.needy.toFixed(2)}`);
  G.cfg.interaction.learn = 'false';
  const w1 = cat.state.learn.needy; G.req[cat.id] = { pid: cat.id, kind: 'ask', text: 'x', prompt: '', since: Date.now(), deadline: 0 }; G.dismiss(cat.id);
  check('关闭学习后不再调整', cat.state.learn.needy === w1);
  G.cfg.interaction.learn = 'true';

  /* 倒计时自动处理 */
  G.req = {};
  G.cfg.interrupt.mode = 'countdown_default';
  G.req[grandpa.id] = { pid: grandpa.id, kind: 'choice', text: dinner.say, choices: dinner.choices, since: Date.now(), deadline: Date.now() - 1 };
  G.tick();
  check('倒计时到了按角色习惯处理', !G.req[grandpa.id]);

  /* 保存与载入往返 */
  G.save(true);
  await new Promise(r => setTimeout(r, 50));
  const keys = [...mem.keys()];
  check('写出了 state、story、journal、sayings', ['state.yaml', 'story.yaml', 'sayings.yaml'].every(n => keys.some(k => k.endsWith(n))) && keys.some(k => /journal\/\d{4}-\d\d\.yaml$/.test(k)));
  const yaml = mem.get(`people/${grandpa.id}/sayings.yaml`);
  check('明文文件里同时有库编号和原文', yaml.includes('lib: ' + opts[1].id) && yaml.includes(rec.text));
  const before2 = JSON.stringify(baby.state.needs);
  await G.load();
  const baby2 = G.people.find(p => p.person.name === '宝宝');
  check('重新载入后需求保持', JSON.stringify(baby2.state.needs) === before2);
  check('重新载入后学习状态保持', G.people.find(p => p.person.name === '团子').state.learn.kinds.ask.n >= 6);

  /* 暂停模式不推进 */
  G.cfg.time.mode = 'paused';
  const m0 = G.world.game_minutes;
  G.lastTick -= 5000; G.tick();
  check('暂停时游戏时间不走', G.world.game_minutes === m0);

  /* 手改后的 YAML 容错：缺字段 */
  mem.set(`people/${grandpa.id}/state.yaml`, 'version: 1\n');
  await G.load();
  const g2 = G.people.find(p => p.person.name === '爷爷');
  check('状态文件缺字段时用默认值', typeof g2.state.mood === 'number' && 'thirst' in g2.state.needs && g2.state.learn.kinds);

  /* AI 接入：默认关闭，不调用；mock 下校验输出 */
  const ai = CY.ai;
  check('AI 默认关闭', !ai.enabled(G.cfg));
  check('关闭时不发请求', (await ai.run('speak', {}, G.tpl)) === null && ai.calls.length === 0);
  G.cfg.ai.enabled = 'true'; G.cfg.ai.provider = 'mock';
  const full = { persona: { name: '爷爷', role: '爷爷', voice: 'elder', temper: '倔强', catchphrases: ['嗯'], secret: '不该泄露' }, state: { mood: 0.5, frailty: 0.1, top_need: 'thirst', hidden: 1 }, situation: '随口说了一句', everything_else: 'x' };
  ai.mockReply = '{"text":"今天天气不错。"}';
  const r1 = await ai.run('speak', full, G.tpl);
  check('合法输出被接受', r1 && r1.text === '今天天气不错。');
  check('AI 只看到白名单里的上下文', ai.last.ctx.persona.secret === undefined && ai.last.ctx.state.hidden === undefined && ai.last.ctx.everything_else === undefined && ai.last.ctx.persona.name === '爷爷');
  ai.mockReply = '{"text":"我是真的你的爷爷。"}';
  check('命中禁用句式的输出被丢弃', (await ai.run('speak', full, G.tpl)) === null);
  ai.mockReply = '{"text":"' + '很长'.repeat(30) + '"}';
  check('超长输出被丢弃', (await ai.run('speak', full, G.tpl)) === null);
  ai.mockReply = 'not json';
  check('不是 JSON 被丢弃', (await ai.run('speak', full, G.tpl)) === null);
  ai.mockReply = '{"needy_delta": 5}';
  const r2 = await ai.run('adapt', full, G.tpl);
  check('数值越界被压回范围内', r2 && r2.needy_delta === 0.05);
  G.cfg.ai.max_calls_per_hour = '2';
  check('每小时调用次数有上限', (await ai.run('speak', full, G.tpl)) === null);
  G.cfg.ai.enabled = 'false';

  /* zip：单独载入 store.js，只用它的 zip 函数 */
  const c2 = vm.createContext({ console, TextEncoder, Blob, Uint8Array, DataView, ArrayBuffer });
  c2.globalThis = c2;
  vm.runInContext(fs.readFileSync(path.join(root, 'src/store.js'), 'utf8'), c2);
  const blob = c2.CY.store.zip([{ name: 'careforyou-data/people/a.yaml', data: new TextEncoder().encode('名字: 爷爷\n') }, { name: 'careforyou-data/settings.ini', data: new TextEncoder().encode('[a]\nb = 1\n') }]);
  fs.writeFileSync(path.join(process.env.TEMP || '/tmp', 'cy_test.zip'), Buffer.from(await blob.arrayBuffer()));
  check('zip 已写出', true);
  console.log(fails ? `失败 ${fails} 项` : '全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
