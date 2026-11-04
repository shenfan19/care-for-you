/* 无头逻辑测试：用内存存储跑一遍载入、创建角色、时间、打断、动作、问答、挑话、学习、AI 校验、存档导入导出、多语言完整性。 */
const { ctx, CY, G, root, fs, vm, path, zlib, mem } = require('./harness');
let fails = 0;
const check = (n, c, x) => { if (!c) fails++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };
const total = () => Object.values(G.journal).reduce((a, m) => a + Object.values(m).reduce((b, e) => b + e.length, 0), 0);

const store_write_cfg = () => CY.store.write('settings.ini', CY.ini.stringify(G.cfg));
(async () => {
  CY.i18n.set('zh-CN');
  await G.load();
  await store_write_cfg();
  check('第一次进来没有角色，由引导页选', G.people.length === 0);
  check('种子里有声线、说话库、问答库、提醒库、AI 技能', G.tpl.voices.elder && G.tpl.sayLib.length > 30 && G.tpl.asks.length > 20 && G.tpl.nudges.length > 3 && G.tpl.skills.speak && G.tpl.persona);
  check('原型至少 15 种', CY.content.archetypes.length >= 15);

  for (const m of [{ arch: 'paternal_grandpa', name: '爷爷', conditions: ['diabetes'] }, { arch: 'toddler', name: '宝宝' }, { arch: 'cat', name: '团子' }]) await G.createPerson({ arch: m.arch, name: m.name, conditions: m.conditions });
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
  check('缺的键回退到中文，再回退到键名', CY.t('no.such.key') === 'no.such.key' && CY.t('arch.paternal_grandpa') === 'Grandpa');
  CY.i18n.set('zh-CN');
  check('中文下用模板里的标签', G.actionsOf(grandpa).pet.label === '拍拍肩');
  check('语言检测', CY.i18n.detect('en') === 'en' && CY.i18n.detect('zh-CN') === 'zh-CN');

  /* 多语言完整性：代码和页面里用到的键，两种语言包都要有 */
  const used = new Set(), dataOnly = new Set();
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(path.join(root, 'src'))) {
    const s = fs.readFileSync(f, 'utf8');
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
  CY.content.presets.forEach(p => { used.add(`preset.${p.id}.label`); used.add(`preset.${p.id}.note`); p.members.forEach(m => used.add('preset.name.' + (m.lead ? 'self' : m.arch))); });
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
  for (const i of [1, 2, 3, 6, 7, 8, 9, 10]) used.add('priv.p' + i);
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
  
  /* 玩法新增的文字（locales/play_*.js）八种语言都有，这里只把它们从界面键检查里排除，齐全性在 play_test 里查 */
  const playKeys = new Set(); for (const f of fs.readdirSync(path.join(root, 'locales')).filter(f => /^play_/.test(f))) vm.runInNewContext(fs.readFileSync(path.join(root, 'locales', f), 'utf8'), { CY: { i18n: { register: (l, d) => Object.keys(d).forEach(k => playKeys.add(k)), cards: (l, tpl, rows) => Object.keys(rows).forEach(id => playKeys.add('visitor.' + id + '.name')), said: () => {}, asks: () => {} } } });
  for (const lang of ['zh-TW', 'fr', 'ja', 'ko', 'es', 'de']) {
    const pk = ctx.CY.i18n.packs[lang] || {};
    const miss = [...used].filter(k => !playKeys.has(k)).filter(k => !(k in pk && pk[k] !== undefined)).concat([...needKeys0].filter(k => !(('need.' + k) in pk)).map(k => 'need.' + k), [...actKeys0].filter(k => !(('act.' + k) in pk)).map(k => 'act.' + k), [...condKeys0].filter(k => !(('cond.' + k) in pk)).map(k => 'cond.' + k));
    const ph = Object.keys(pk).filter(k => { const a = [...new Set(pk[k].match(/\{\w+\}/g) || [])].sort().join(), b = [...new Set(((lang.startsWith('zh') ? zh[k] : en[k]) || zh[k] || '').match(/\{\w+\}/g) || [])].sort().join(); return a !== b; });
    check('语言包 ' + lang + ' 覆盖所有界面键和数据标签', miss.length === 0, miss.slice(0, 12).join());
    check('语言包 ' + lang + ' 的占位符和英文一致', ph.length === 0, ph.slice(0, 6).join());
  }
  const needKeys = new Set(), actKeys = new Set();
  for (const f of Object.keys(CY.seed.files()).filter(f => /^templates\/(species|conditions)\//.test(f))) { const o = ctx.jsyaml.load(CY.seed.files()[f]); Object.keys(o.needs || {}).forEach(k => needKeys.add(k)); Object.keys(o.actions || {}).forEach(k => actKeys.add(k)); }
  check('英文包覆盖所有需求和动作标签', [...needKeys].every(k => 'need.' + k in en) && [...actKeys].every(k => 'act.' + k in en), [...needKeys].filter(k => !('need.' + k in en)).concat([...actKeys].filter(k => !('act.' + k in en))).join());
  const iniMiss = CY.ini.SCHEMA.filter(([s, k]) => !['ui.theme', 'ui.background', 'ui.language', 'ui.figure'].includes(s + '.' + k) && !(`ini.${s}.${k}` in en)).map(x => x[0] + '.' + x[1]);
  check('英文包覆盖所有设置说明', iniMiss.length === 0, iniMiss.join());

  /* 运行包清单和页面一致 */
  const refsInHtml = [...html.matchAll(/(?:src|href)="((?!#|http)[^"]+)"/g)].map(m => m[1].split('?')[0]);
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
      const pid = await G.createPerson({ arch: 'paternal_grandpa', name: '测试', conditions: [c] }); await G.load();
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

  /* 世界与后端：房间分布，直接站到旁边，住院，夜里起夜，指令检查，远程后端，台词 */
  {
    const W = CY.world, P = CY.protocol;
    const gp = await G.createPerson({ arch: 'paternal_grandpa', name: '爷爷', conditions: ['nocturia'] });
    const bb = await G.createPerson({ arch: 'baby', name: '宝宝' });
    const ct = await G.createPerson({ arch: 'cat', name: '猫' });
    await G.load();
    const setHour = h => { G.cfg.time.daynight = 'game'; G.world.clock_shift = 480; G.world.game_minutes = (h * 60 - 480 + 1440) % 1440; for (const p of G.people) G.act[p.id] = G.activityOf(p); };
    setHour(14);
    check('白天爷爷在客厅或院子或厨房', ['living', 'yard', 'kitchen'].includes(W.locationOf(G.get(gp)).room));
    G.get(bb).state.needs.rest = 0.2;
    check('婴儿醒着不困，白天在客厅的玩具垫上', W.locationOf(G.get(bb)).room === 'living' && W.locationOf(G.get(bb)).mode === 'mat');
    G.get(bb).state.needs.rest = 0.9;
    check('婴儿困了在卧室的小床里', W.locationOf(G.get(bb)).room === 'bedroom' && W.locationOf(G.get(bb)).mode === 'cradle');
    check('没有人的地点不出现', W.occupiedPlaces().join() === 'home');
    setHour(2);
    check('夜里爷爷在老人房睡，不和婴儿一屋', W.locationOf(G.get(gp)).room === 'elder' && W.locationOf(G.get(bb)).room === 'bedroom');
    check('每个人都有位置', W.layout('home').length === G.activePeople().length);

    /* 后端指令：标记带地点，就会出现在那个地点；到期由后端的规则收尾 */
    const dirs = P.sanitize([{ op: 'flag_set', person: gp, name: 'hospital', minutes: 4320, place: 'hospital', room: 'ward', mode: 'sleep' }]);
    G.applyDirectives(dirs);
    check('住院的标记让他出现在医院病房', W.locationOf(G.get(gp)).place === 'hospital' && W.layout('hospital').some(l => l.id === gp) && W.occupiedPlaces().join() === 'home,hospital');
    G.world.game_minutes += 4400; G.drive('tick', { minutes: 1 });
    check('住满天数后规则让他出院，旧事记在计数里', !G.flag(G.get(gp), 'hospital') && (G.get(gp).story.counters || {}).hospital_n === 1 && W.occupiedPlaces().join() === 'home');
    G.world.game_minutes -= 4400;

    /* 指令检查：不认识的丢掉，数值压回范围，名字不存在的人丢掉 */
    const bad = P.sanitize([{ op: 'format_disk', person: gp }, { op: 'need', person: gp, need: 'thirst', delta: 99 }, { op: 'say', person: 'nobody', text: 'x' }, { op: 'flag_set', person: gp, name: 'x', minutes: 1e9, place: 'moon' }, { op: 'say', person: gp, text: 'y'.repeat(999) }]);
    check('后端指令被检查', bad.length === 2 && bad[0].delta === 1 && bad[1].text.length === 240);

    /* 照顾别的地点的人要先去，同一个地点直接出现在旁边，没有走路 */
    W.enforce = true;
    Object.assign(W.player(), { place: 'home', room: 'study' }, W.playerAnchor('home', 'study'));
    check('同一个地点不需要走路', W.presenceNeed(G.get(ct)) === null);
    check('做事时主角直接出现在他旁边', (W.guard(ct, () => true), W.player().room === W.locationOf(G.get(ct)).room));
    G.clearFlag(G.get(gp), 'outing');   /* 随机的外出愿望可能刚好让他出门，会盖过住院，测试先清掉 */
    G.applyDirectives(P.sanitize([{ op: 'flag_set', person: gp, name: 'hospital', minutes: 4320, place: 'hospital', room: 'ward', mode: 'sleep' }]));
    const off = W.presenceNeed(G.get(gp));
    check('在医院的人要先去医院', off && off.offsite && off.place === 'hospital', JSON.stringify(off) + ' ' + JSON.stringify(G.get(gp).state.flags) + ' lead=' + (G.protagonist() && G.protagonist().id === gp) + ' gp=' + gp);
    check('去医院，主角位置变了', W.travel('hospital') && W.player().place === 'hospital');
    check('长按去医院的时间不是线性的', W.travelHold('home', 'hospital') <= 8 && W.travelHold('home', 'hospital') >= 3);
    G.clearFlag(G.get(gp), 'hospital');
    W.holding = false; W.tick();
    check('医院里没有人了，主角回家', W.player().place === 'home');
    G.cfg.time.mode = 'fast';
    /* 动作停下几秒，勾了自动回岗位就回去 */
    W.moveTo('home', 'kitchen'); W.lastActive = Date.now() - 1000; W.tick();
    check('停得不够久不自动回去', W.player().room === 'kitchen');
    W.lastActive = Date.now() - W.IDLE_MS - 100; W.tick();
    check('停够几秒后回到客厅', W.player().room === W.workRoom());
    W.enforce = false;

    /* 起夜与跌倒：全是规则数据库里的规则，概率放大后一定出事 */
    setHour(2);
    const keepFall = G.tpl.rules; G.tpl.rules = keepFall.map(r => (r.id === 'night_toilet_end' ? Object.assign({}, r, { then: Object.assign({}, r.then, { chance: 1000 }) }) : r));
    const g = G.get(gp);
    G.setFlag(g, 'wc', { minutes: 6, place: 'home', room: 'toilet' });
    G.world.game_minutes += 10; G.drive('tick', { minutes: 1 });
    check('起夜到期后按规则跌倒或住院', !!G.flag(g, 'hurt'));
    G.tpl.rules = keepFall;
    check('规则就在数据文件夹的明文 YAML 里', (await CY.store.read('templates/events/rules.yaml')).includes('night_toilet') && G.tpl.rules.length >= 5);
    /* 改规则文件就改行为：把夜尿起夜的频率调成零 */
    const keep = G.tpl.rules; G.tpl.rules = keep.map(r => (r.id === 'night_toilet' ? Object.assign({}, r, { rate_per_hour: 0 }) : r));
    G.clearFlag(g, 'hurt'); G.clearFlag(g, 'hospital'); delete g.state.flags.wc; g.person.conditions = ['nocturia']; G.act[gp] = 'sleeping';
    for (let i = 0; i < 200; i++) G.drive('tick', { minutes: 60 });
    check('规则改成零就不再起夜', !G.flag(g, 'wc'));
    G.tpl.rules = keep;

    /* 远程后端：用假的 fetch，指令被检查后执行；失败时退回内置，并只提示一次 */
    let calls = 0, errs = 0; G.backendError = () => { errs++; };
    ctx.AbortController = AbortController;
    G.cfg.play.backend_provider = 'http'; G.cfg.play.backend_url = 'http://example.invalid/drive';
    ctx.fetch = async (url, opt) => { const body = JSON.parse(opt.body); if (body.kind === 'hello') return { ok: true, json: async () => ({ v: 1, directives: [] }) }; calls++; ctx.__lastReq = body; return { ok: true, json: async () => ({ v: 1, directives: [{ op: 'mood', person: body.people[0].id, delta: 5 }, { op: 'nope', person: body.people[0].id }] }) }; };
    const m0 = G.get(body0Id()).state.mood = 0.5;
    function body0Id() { return G.activePeople()[0].id; }
    CY.backend.caps = null; CY.backend.ensureHello();
    await new Promise(r => setTimeout(r, 5));
    check('没有声明 handles 的老后端当成什么都管', CY.backend.caps && CY.backend.handles('events') && CY.backend.handles('strategies') && CY.backend.handles('lines'));
    await CY.backend.drive(CY.backend.build('tick', { minutes: 1 })).then(list => G.applyDirectives(list));
    check('远程后端回来的指令被执行且被检查', calls === 1 && G.get(body0Id()).state.mood === 1 && ctx.__lastReq.kind === 'drive' && ctx.__lastReq.v === 1);
    check('默认不把名字发出去', ctx.__lastReq.people.every(p => p.name === ''));
    const rw = ctx.__lastReq.world;
    check('请求里带工作时段和玩家位置', 'working' in rw && !('money' in rw) && rw.player && rw.player.place && ctx.__lastReq.people.every(p => p.needs && p.location));
    /* 设了环境变量就对真实的基础后端走一遍：CARE_BACKEND_URL=http://127.0.0.1:8787/ */
    if (process.env.CARE_BACKEND_URL) {
      ctx.fetch = fetch; G.cfg.play.backend_url = process.env.CARE_BACKEND_URL;
      CY.backend.caps = null; CY.backend.ensureHello();
      while (CY.backend.pending) await new Promise(r => setTimeout(r, 10));
      check('真实后端握手成功', !!CY.backend.caps && !CY.backend.failed);
      const pe = G.activePeople()[0], k = Object.keys(pe.state.needs)[0]; pe.state.needs[k] = 0.1;
      await CY.backend.drive(CY.backend.build('tick', { minutes: 60 })).then(list => G.applyDirectives(list));
      check('真实远程后端的需求增量生效', Math.abs(pe.state.needs[k] - 0.15) < 0.011 && !CY.backend.failed);
    }
    ctx.fetch = async () => { throw new Error('offline'); };
    const r1 = await CY.backend.drive(CY.backend.build('tick', { minutes: 1 })), r2 = await CY.backend.drive(CY.backend.build('tick', { minutes: 1 }));
    check('远程失败退回内置，只提示一次', Array.isArray(r1) && Array.isArray(r2) && errs === 1);
    /* 声明了只管积分的后端：事件交给内置，积分的变量游戏不再自己涨，plan 不再发给它，失败时变量还给游戏 */
    {
      const kinds = [], pe = G.activePeople()[0], nk = Object.keys(pe.state.needs)[0];
      ctx.fetch = async (url, opt) => {
        const b = JSON.parse(opt.body); kinds.push(b.kind + (b.trigger ? ':' + b.trigger : ''));
        if (b.kind === 'hello') return { ok: true, json: async () => ({ v: 1, name: 'fake-lm', handles: { events: false, strategies: false, lines: false } }) };
        return { ok: true, json: async () => ({ v: 1, directives: [{ op: 'need', person: pe.id, need: nk, delta: 0.1 }], drives: { [pe.id]: [nk, 'mood'] } }) };
      };
      G.cfg.play.backend_url = 'http://fake-lm.invalid/';
      CY.backend.caps = null; CY.backend.failed = false; CY.backend.driven = {}; CY.backend.ensureHello();
      await new Promise(r => setTimeout(r, 5));
      check('握手读到后端只管积分', CY.backend.caps.name === 'fake-lm' && CY.backend.handles('events') === false && CY.backend.handles('strategies') === false);
      pe.state.needs[nk] = 0.2;
      const list = await CY.backend.drive(CY.backend.build('tick', { minutes: 1 }));
      G.applyDirectives(list);
      check('后端的积分指令被执行', Math.abs(pe.state.needs[nk] - 0.3) < 1e-6);
      check('后端声明驱动的变量被记下', CY.backend.isDriven(pe.id, nk) && CY.backend.isDriven(pe.id, 'mood') && !CY.backend.isDriven(pe.id, 'frailty'));
      kinds.length = 0;
      CY.backend.plan(CY.backend.buildPlan({ minutes: 1 }));
      check('不管策略的后端不收 plan 请求', !kinds.includes('plan'));
      const act = CY.backend.drive(CY.backend.build('action', { person: pe, action: { id: 'pet' } }));
      check('玩家动作的指令同步返回，不等远程', Array.isArray(act) && !kinds.includes('drive:action'));
      ctx.fetch = async () => { throw new Error('offline'); };
      await CY.backend.drive(CY.backend.build('tick', { minutes: 1 }));
      check('远程失败后变量还给游戏', !CY.backend.isDriven(pe.id, nk));
      CY.backend.caps = null; CY.backend.driven = {}; G.cfg.play.needs_source = 'builtin';
    }
    G.cfg.play.backend_provider = 'builtin'; CY.backend.failed = false;
    const sayText = CY.backend.line({ v: 1, kind: 'line', person: P.person(G.get(gp), {}), group: 'events', key: 'discharge' });
    check('台词也走后端接口', typeof sayText === 'string' && sayText.length > 0);

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
    await G.load(); refs();
  }

  /* 发布线：内容规模的下限，数字来自发布级原型需求 */
  {
    const C = CY.content, V = C.voices, en = C.packs.en.voices, miss = [];
    const arch = C.archetypes, nHuman = arch.filter(a => a.species === 'human').length, nAnimal = arch.filter(a => a.group === 'animal').length, nPlant = arch.filter(a => a.group === 'plant').length;
    check('身份数量达到发布线', nHuman >= 33 && nAnimal >= 16 && nPlant >= 6, [nHuman, nAnimal, nPlant].join());
    check('性格至少 20 种，疾病至少 14 种', C.TRAITS.length >= 20 && Object.keys(G.tpl.conditions).length >= 14, C.TRAITS.length + ' ' + Object.keys(G.tpl.conditions).length);
    check('问答至少 70 题，提醒至少 28 条', C.asks.length >= 70 && C.nudges.length >= 28, C.asks.length + ' ' + C.nudges.length);
    check('事件规则至少 30 条', G.tpl.rules.length >= 30, G.tpl.rules.length);
    check('声线至少 23 种', Object.keys(V).length >= 23, Object.keys(V).length);
    const count = o => Object.values(o || {}).flat().length;
    for (const v in V) {
      for (const [lang, voices] of [['zh', V], ['en', en]]) {
        const o = voices[v] || {};
        if (count(o.request) < 6) miss.push(lang + ':' + v + ' 需求台词');
        if (count(o.thanks) < 6) miss.push(lang + ':' + v + ' 道谢');
        if ((o.glance || []).length < 5) miss.push(lang + ':' + v + ' 路过');
        if ((o.cares_back || []).length < 5) miss.push(lang + ':' + v + ' 心意');
      }
      if (C.sayings.filter(s => s.voice === v).length < 6) miss.push(v + ' 说过的话');
      for (const k of ['morning', 'noon', 'evening', 'night']) if (!((V[v].ambient || {})[k] || []).length) miss.push(v + ' 闲谈 ' + k);
    }
    check('每种声线的各类对话都达到下限', miss.length === 0, miss.slice(0, 8).join('; '));
    const humanVoices = ['elder', 'parent', 'aunt', 'sibling', 'child', 'toddler', 'teen', 'partner'];
    const lowAsk = humanVoices.filter(v => C.asks.filter(a => (a.voice || []).includes(v)).length < 6);
    check('每种人形声线至少 6 题问答', lowAsk.length === 0, lowAsk.join());
    const lifeLow = [];
    for (const k of C.LIFE_KEYS) for (const v of ['parent', 'elder', 'child']) { if (((V[v].life || {})[k] || []).length < 2 || ((en[v].life || {})[k] || []).length < 2) lifeLow.push(v + '.' + k); }
    check('生活事件的台词，成人老人孩子各至少两句', C.LIFE_KEYS.length >= 23 && lifeLow.length === 0, lifeLow.slice(0, 5).join());
    const trLow = [];
    for (const tr of C.TRAITS) for (const lang of ['zh', 'en']) { const o = (lang === 'zh' ? C.TRAIT_LINES.zh : C.TRAIT_LINES.en)[tr]; if (!o || o.glance.length < 2 || o.thanks.default.length < 2 || o.ambient.any.length < 2 || !['a0', 'a1', 'a2', 'custom'].every(k => (o.reply[k] || []).length >= 1)) trLow.push(lang + tr); }
    check('每个性格都有路过，道谢，闲谈，回应', trLow.length === 0, trLow.join());
    const noTrait = C.TRAITS.filter(tr => !G.tpl.traits[tr]);
    check('每个性格都有数值定义', noTrait.length === 0, noTrait.join());
    /* 全部身份都能画出头像 */
    const noArt = [];
    for (const a of arch) { const id = await G.createPerson({ arch: a.id, name: 't' }); await G.load(); const pp = G.get(id); try { const svg = CY.avatar(pp); if (!svg || svg.length < 200) noArt.push(a.id); } catch (e) { noArt.push(a.id + ':' + e.message); } await G.deletePerson(id); }
    check('每个身份都画得出头像', noArt.length === 0, noArt.join());
    /* 性格的台词真的会被选到 */
    const tid = await G.createPerson({ arch: 'paternal_grandpa', name: '性格测试', traits: ['shy', 'chatty'] }); await G.load();
    const tp = G.get(tid), shyLines = C.TRAIT_LINES.zh.shy.glance.concat(C.TRAIT_LINES.zh.chatty.glance);
    const lines = G.lines(tp, 'glance', null);
    check('性格的台词混进了可选的台词', shyLines.every(l => lines.includes(l)) && lines.length > shyLines.length);
    const reply = G.lines(tp, 'reply', 'a1');
    check('回答之后有性格的回应', reply.length >= 2);
    await G.deletePerson(tid); refs();
  }

  /* 按年龄说话：宝宝几个月说的话不同，十三岁以下不说成人口吻的性格台词 */
  {
    const C = CY.content;
    const mkp = async (arch, age, traits) => { const id = await G.createPerson({ arch, name: 'a' + age, age, traits: traits || [] }); await G.load(); return G.get(id); };
    const b0 = await mkp('baby', 0.2, ['independent']), b5 = await mkp('baby', 0.45), b9 = await mkp('baby', 0.8), t1 = await mkp('toddler', 1.4), t2 = await mkp('toddler', 2.4), t3 = await mkp('toddler', 3.4), k5 = await mkp('daughter', 5), k9 = await mkp('son', 9, ['stubborn']);
    check('年龄分段', [b0, b5, b9, t1, t2, t3, k5, k9].map(p => G.ageBand(p)).join() === 'm0,m4,m7,y1,y2,y3,c4,c7', [b0, b5, b9, t1, t2, t3, k5, k9].map(p => G.ageBand(p)).join());
    const adult = C.TRAIT_LINES.zh.independent.glance[0];
    check('零个月的宝宝不说成人口吻的性格台词', !G.lines(b0, 'glance', null).includes(adult) && !G.lines(b0, 'thanks', 'default').some(l => /不用管我|我能行/.test(l)));
    check('宝宝带性格时只描写神态', G.lines(b0, 'glance', null).includes(C.TRAIT_LINES.zh.independent.kid.glance[0]));
    const req = p => G.lines(p, 'request', 'hunger').join('|');
    check('不同月龄的宝宝需求台词不同', req(b0) !== req(b5) && req(b5) !== req(b9));
    check('一岁说单字，三岁说句子', /饭/.test(req(t1)) && !/我饿了/.test(req(t1)) && /我饿了/.test(req(t3)));
    check('九岁孩子的性格台词是神态，不是大人的话', !G.lines(k9, 'glance', null).some(l => /我说了，不用|我自己能行/.test(l)));
    check('婴儿没有问答，一岁的孩子也没有，三岁才有', G.askBank(b9).length === 0 && G.askBank(t1).length === 0 && G.askBank(t3).length > 0);
    for (const p of [b0, b5, b9, t1, t2, t3, k5, k9]) await G.deletePerson(p.id);
    refs();
  }

  /* 其他原型 */
  for (const a of A) await G.createPerson({ arch: a.id, name: a.role });
  await G.load();
  check('每种原型都能载入', G.people.length === 3 + A.length);
  check('每种原型都有声线和候选话', G.people.every(p => Object.keys(p.voice).length > 0 && G.pickOptions(p).length > 0));
  const talkers = G.people.filter(p => p.person.kind === 'human' && G.stage(p) !== 'infant' && G.age(p) >= 2);
  check('每个人形原型都有可问的问题', talkers.every(p => G.askBank(p).length > 0), talkers.filter(p => !G.askBank(p).length).map(p => p.person.name).join());
  for (const p of G.people.slice(3)) p.person.active = false;
  await Promise.all(G.people.slice(3).map(p => CY.store.writeYaml(`people/${p.id}/person.yaml`, p.person)));
  await G.load(); refs();
  check('可以让角色离开桌面', G.activePeople().length === 3);

  /* 问答库按身份和称呼筛选，敏感话题默认不出现 */
  const sis = { person: { voice: 'sibling', age: 26, pronoun: 'she', kind: 'human', lines: {} }, species: { id: 'human' }, state: { asked: [] } };
  const bro = { person: { voice: 'sibling', age: 28, pronoun: 'he', kind: 'human', lines: {} }, species: { id: 'human' }, state: { asked: [] } };
  const kid = { person: { voice: 'child', age: 7, pronoun: 'she', kind: 'human', lines: {} }, species: { id: 'human' }, state: { asked: [] } };
  G.cfg.interaction.sensitive_topics = 'false';
  check('姐妹可以被问到身体不适的话题，兄弟不会', G.askBank(sis).some(q => q.id === 'ask_s05') && !G.askBank(bro).some(q => q.id === 'ask_s05'));
  check('孩子只被问孩子的问题', G.askBank(kid).every(q => q.voice.includes('child')));
  check('敏感话题默认不出现', !G.askBank(sis).some(q => q.sensitive));
  G.cfg.interaction.sensitive_topics = 'true';
  check('打开后敏感话题才出现', G.askBank(sis).some(q => q.id === 'ask_s06') && !G.askBank(bro).some(q => q.id === 'ask_s06'));
  G.cfg.interaction.sensitive_topics = 'false';
  check('每个问题恰好三个预设回答', G.tpl.asks.every(q => q.answers.length === 3));

  /* 时间显示 */
  G.cfg.time.mode = 'fast'; G.cfg.time.daynight = 'auto';
  G.cfg.time.mode = 'fast';
  check('没有倍速档，加速模式 120 倍由一天长度推出，昼夜用游戏时钟', (delete G.cfg.time.speed, G.speed() === 120 && G.daySource() === 'game'));
  {   /* 两种时间：普通一比一，加速可选 30，60，120；钱按现实时间算 */
    const m0 = G.cfg.time.mode, f0 = G.cfg.time.fast_speed; delete G.cfg.time.speed;
    G.cfg.time.mode = 'normal'; check('普通模式流速一比一', G.speed() === 1 && !G.isFast());
    { const keep = G.cfg.time; G.cfg.time = {}; check('没设过时间模式的新档默认普通', G.timeModeSetting() === 'normal' && G.speed() === 1); G.cfg.time = keep; }
    G.cfg.time.mode = 'fast'; for (const v of [30, 60, 120]) { G.cfg.time.fast_speed = String(v); check('加速模式 ' + v + ' 倍', G.speed() === v && G.isFast()); }
    G.cfg.time.fast_speed = '77'; check('加速倍率写错按 120', G.speed() === 120);
    G.cfg.time.fast_speed = '60'; check('加速 60 倍时一个游戏小时折成 1/60 个现实小时的收入', Math.abs(G.econHours(60) - 1 / 60) < 1e-12);
    G.cfg.time.mode = 'normal'; check('普通模式一个游戏小时收入就是一个小时', Math.abs(G.econHours(60) - 1) < 1e-12);
    /* 对齐系统时钟只往后走，天数不倒退 */
    G.world.game_minutes = 5000; G.world.clock_shift = 3000; const d0 = G.gameDate().n; G.alignClock(); const now = new Date(), tm = now.getHours() * 60 + now.getMinutes();
    check('对齐系统时钟后时刻对得上，天数不倒退', Math.round(G.dayMinutes()) % 1440 === tm && G.gameDate().n >= d0, G.dayMinutes() + ' ' + tm);
    G.world.game_minutes = 5000; G.world.clock_shift = 1439 + 1440 * 3; const d1 = G.gameDate().n; G.alignClock(); check('昨天很晚关的，对齐后是第二天，不回到前一天', G.gameDate().n >= d1);
    G.cfg.time.mode = m0; if (f0 === undefined) delete G.cfg.time.fast_speed; else G.cfg.time.fast_speed = f0;
    delete G.world.clock_shift; G.world.game_minutes = 0;
  }
  { /* 午夜翻日：从第二天起是完整的一天，不跳过夜里和上午，时钟在 0 点接着走，日历加一天，钩子被调用 */
    G.setClock(23 * 60 + 58); G._dayN = G.gameDate().n; const d0 = G.gameDate().n, calls = [], starts = [];
    G.dayEndHooks.push(x => calls.push(x)); G.dayStartHooks.push(x => starts.push(x));
    G.advance(5, false);
    check('午夜翻日，从零点接着走，不跳到午后', G.dayRoll() === true && G.dayMinutes() < 10 && G.gameDate().n === d0 + 1 && calls.length === 1 && calls[0].day === d0 && starts.length === 1, G.dayMinutes() + ' ' + G.gameDate().n);
    check('没有离线追算，也没有跳过夜里的函数', G.catchUp === undefined && G.skipToAfternoon === undefined);
    G.dayEndHooks.length = 0; G.dayStartHooks.pop();
  }
  check('状态历史：每十五游戏分钟给每个人记一点，只在内存里，普通玩家看不到曲线', (() => { G.hist = {}; G._histB = undefined; const p0 = G.activePeople()[0]; G.advance(60, false); const h = G.hist[p0.id]; return !!h && h.length >= 1 && 'mood' in h[0] && 'needs' in h[0] && G.DEVTOOLS === false; })());
  check('没有离线推进，也没有暂停', G.catchUp === undefined && G.isPaused() === false);
  G.DAY.enabled = false;   /* 其余测试按连续时间写，不走日终跳过 */
  check('倍速写坏了按 1，旧设置 real 也按 1', (G.cfg.time.speed = 'abc', G.speed() === 1) && (G.cfg.time.speed = 'real', G.speed() === 1 && G.daySource() === 'game'));
  { /* 切倍速不动时钟；校准和自己设几点只改钟点，不动陪伴天数 */
    G.world.game_minutes = 12345; G.alignClock();
    const sysNow = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }, near = (a, b) => Math.min(Math.abs(a - b), 1440 - Math.abs(a - b)) <= 1;
    check('对齐系统时间', near(G.dayMinutes(), sysNow()), G.dayMinutes() + ' ' + sysNow());
    G.setClock(6 * 60 + 30); const before = G.world.game_minutes, shift = G.world.clock_shift;
    await G.setSpeed(60); await G.setSpeed(6); await G.setSpeed(24);
    check('切倍速不动游戏时钟', G.world.clock_shift === shift && G.dayMinutes() === 6 * 60 + 30 + (Math.floor(G.world.game_minutes) - before), G.dayMinutes());
    G.world.game_minutes = 7 * 1440 + 100; G.setClock(23 * 60 + 59);
    check('自己设几点，陪伴天数不变', G.clock().hh === '23' && G.clock().mm === '59' && G.clock().d === 7);
    G.cfg.time.speed = '24'; const gap = [...Array(50)].map(() => G.nextGapSeconds());
    check('打断间隔按倍速缩短', Math.min(...gap) >= 20 && Math.max(...gap) <= 180 * 60 / 24 + 1, Math.min(...gap) + ' ' + Math.max(...gap));
    G.cfg.time.speed = '999'; check('倍速封顶 360', G.speed() === 360);
    G.cfg.time.speed = '24'; delete G.world.clock_shift; G.world.game_minutes = 0; await G.saveCfg(); await G.save(true); }
  G.cfg.time.daynight = 'system';
  check('可以强制跟随系统时钟', G.daySource() === 'system');
  { /* 离开五小时，回来追算一天，停在午后；离开两小时不动 */
    const gm0 = G.world.game_minutes;
    G.world.last_seen = new Date(Date.now() - 2 * 3600e3).toISOString();
    G.start(); G.stop();
    check('离开两小时回来，游戏时间不动', G.world.game_minutes === gm0);
    G.cfg.time.daynight = 'game'; G.world.last_seen = new Date(Date.now() - 5 * 3600e3).toISOString();
    G.start(); G.stop();
    check('离开五小时回来，游戏时间照样不动', G.world.game_minutes === gm0);
    G.cfg.time.daynight = 'system';
    check('新档开局从午后两点开始', await (async () => { const w = G.world.clock_shift; { const wy = Object.assign({}, G.world); delete wy.clock_shift; await CY.store.writeYaml('world.yaml', wy); } await G.load(); const ok = typeof G.world.clock_shift === 'number' && G.dayMinutes() === G.DAY.start; G.world.clock_shift = w; return ok; })());
  }
  G.cfg.time.daynight = 'game'; delete G.world.clock_shift;
  G.world.game_minutes = 3 * 1440 + 5 * 60 + 7;
  const ck = G.clock();
  check('已陪伴的时间按游戏时间累计', ck.d === 3 && ck.h === 5 && ck.m === 7, JSON.stringify([ck.d, ck.h, ck.m]));
  check('游戏时钟从早上八点开始', (G.world.game_minutes = 0, G.clock().hh === '08'));
  G.world.game_minutes = 15 * 60; check('游戏时钟夜里是夜晚', G.clock().night === true, G.clock().hh);
  G.cfg.time.daynight = 'system'; await G.saveCfg();
  G.cfg.interrupt.frequency = 'normal';
  check('时间只有现实，一倍速，长按', G.timeMode() === 'real' && G.playMode() === 'reality' && G.inputMode() === 'hold');
  check('长按时间不是线性的', G.holdFor(1) < G.holdFor(10) && G.holdFor(10) < G.holdFor(60) && G.holdFor(60) <= 6 && G.holdFor(600) === 6);
  G.world.game_minutes = 0;
    check('账号功能默认未启用，没有服务地址就不出现', !CY.account.enabled(G.cfg) && !CY.account.configured(G.cfg) && CY.account.status().signedIn === false && CY.account.consentRecord('upload', true).granted === true);

  /* 手改后的 YAML 容错：缺字段 */
  mem.set(`people/${grandpa.id}/state.yaml`, 'version: 1\n');
  await G.load(); refs();
  check('状态文件缺字段时用默认值', typeof grandpa.state.mood === 'number' && 'thirst' in grandpa.state.needs && grandpa.state.learn.kinds && Array.isArray(grandpa.state.asked));

  /* ---------- v0.5：年龄阶段、类别、自理、哭闹、代价系统 ---------- */
  const mk = async (arch, name, extra) => { const id = await G.createPerson(Object.assign({ arch, name }, extra || {})); await G.load(); refs(); return G.get(id); };
  const stg = CY.content.stageOf;
  check('年龄换成阶段', [0.5, 1, 3.9, 4, 12, 13, 17, 18, 64, 65].map(stg).join() === 'infant,toddler,toddler,child,child,teen,teen,adult,adult,elder');
  let bb = await mk('baby', '小宝'), sis2 = await mk('older_sister', '阿姐'), eld = await mk('paternal_grandma', '阿婆', { conditions: ['arthritis', 'forgetful'] }), tdl = await mk('toddler', '二岁');
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
  check('三种人物造型都能画，有手脚的带可动的手脚，团子没有', (() => { const old = CY.figure; const ok = []; for (const fg of CY.FIGURES) { CY.figure = fg; for (const age of [0.5, 2, 8, 15, 35, 70]) { const svg = CY.avatarPreview(CY.content.archOf('mom'), CY.content.archOf('mom').look, age); ok.push(svg.startsWith('<svg')); if (fg !== 'dumpling') ok.push(svg.includes('class="foot l"') && svg.includes('class="hand r"')); else ok.push(svg.includes('class="bean"') && !svg.includes('class="foot')); } } CY.figure = old; return ok.every(Boolean); })());
  check('旧设置的造型名转成新的，默认方块小人，三种手画豆子可选', CY.figureOf('classic') === 'dressed' && CY.figureOf('bean_a') === 'dumpling' && CY.figureOf('bean_b') === 'plain' && CY.figureOf('') === 'sprite' && CY.figureOf('dressed') === 'dressed' && CY.figure === 'sprite');
  check('四个方向都能画：朝上看不到脸，朝下脸转向一侧，左右是镜像', (() => { const mom = CY.content.archOf('mom'), at = d => CY.avatarPreview(mom, mom.look, 35).length && CY.avatar({ species: { id: 'human' }, state: { mood: 0.7 }, person: { age: 35, appearance: mom.look } }, d); const f = at(''), se = at('se'), sw = at('sw'), ne = at('ne'), nw = at('nw'); return CY.DIRS.length === 4 && f.includes('class="eyes"') && se.includes('class="eyes"') && sw.includes('scale(-1 1)') && !se.includes('scale(-1 1)') && !ne.includes('class="eyes"') && !nw.includes('class="eyes"') && nw.includes('scale(-1 1)') && ne.includes('data-dir="ne"') && ne.includes('class="foot l"'); })());
  check('书桌前的椅子在书房和办公室都有', (() => { const W = CY.world; const a = W.slotPoint('home', 'study', 'seat', 0), c = W.slotPoint('office', 'desk', 'player', 0); const old = Object.assign({}, W.player()); W.moveTo('home', 'study'); const s1 = W.atWork(); W.moveTo('office', 'desk'); const s2 = W.atWork(); W.moveTo('home', 'living'); const s3 = W.atWork(); Object.assign(W.player(), old); return s1 && s2 && !s3 && a.gy < 2 && c.gx < 3; })());
  check('只有夫妻办公；家里没有夫妻时才轮到主角自己', (() => { const W = CY.world, G2 = CY.game, ar = p => p.person.archetype || p.person.card, act = G2.activePeople(), couple = act.filter(p => G2.isHuman(p) && G2.stage(p) === 'adult' && ['dad', 'mom', 'husband', 'wife'].includes(ar(p))); return act.every(p => W.worker(p) === (couple.includes(p) || (!couple.length && p === G2.protagonist() && G2.isHuman(p) && G2.stage(p) === 'adult'))); })());
  check('头上弹出的事件：完成打勾和有人开口', (() => { const GG = CY.game, p = GG.people[0]; if (!p) return false; const n0 = GG.popSeq; GG.playFx(p.id, 'talk'); const e = GG.pops[GG.pops.length - 1]; return GG.popSeq === n0 + 1 && e.kind === 'done' && e.icon === '✓' && e.pid === p.id; })());
  check('默认肤色都偏浅', CY.content.archetypes.filter(a => a.species === 'human').every(a => a.look.skin <= 4) && CY.avatarOptions.skin.length >= 8 && CY.avatarOptions.skin[0] === '#fffaf6');

  /* 没人管：婴儿哭闹，老人自己解决 */
  G.cfg.time.mode = 'fast'; G.cfg.interrupt.frequency = 'normal'; 
  for (const p of G.people) { for (const k in p.state.needs) p.state.needs[k] = 0.1; p.person.active = false; }
  bb.person.active = true; eld.person.active = true; sis2.person.active = true;
  bb.state.needs.hunger = 0.95; eld.state.needs.hunger = 0.95; eld.state.needs.rest = 0.95;
  G.lastTick = Date.now() - 1000; G.nextAt = Date.now() + 1e9; G.tick();
  check('婴儿需求严重时哭闹，老人不哭，哭闹不弹气泡', G.crying[bb.id] && !G.crying[eld.id] && !(G.toast[bb.id] && G.toast[bb.id].kind === 'cry'));
  let selfDone = 0, infantSelf = 0; const n0s = eld.state.needs.hunger;
  for (let i = 0; i < 4000; i++) { G.lastTick -= 5000; for (const p of [eld, bb]) p.state.needs.hunger = Math.max(p.state.needs.hunger, 0.9); const h = eld.state.needs.hunger; G.tick(); }
  check('老人没人管会自己解决', G.journal[eld.id] && Object.values(G.journal[eld.id]).flat().some(e => e.type === 'self'));
  check('哭闹只记一次', Object.values(G.journal[bb.id]).flat().filter(e => e.type === 'cry').length === 1);
  for (const k in bb.state.needs) bb.state.needs[k] = 0.1; G.lastTick = Date.now() - 1000; G.tick();
  check('需求解决后不再哭', !G.crying[bb.id]);
  for (const p of [bb, eld, sis2]) { p.person.active = true; }

  /* 急性病：照顾够了次数就好 */
  const sick = await mk('toddler', '病宝', { conditions: ['cold'] });
  for (let i = 0; i < 3; i++) { sick.state.needs.fever = 0.8; G.perform(sick.id, 'fever'); }
  check('感冒照顾三次痊愈', !sick.person.conditions.includes('cold') && Object.values(G.journal[sick.id]).flat().some(e => e.type === 'recovered'));

  const tp = await mk('toddler', '测试宝');

  G.cfg.time.daynight = 'system'; G.cfg.economy.work_hours = '00:00-23:59';
  G.cfg.interrupt.frequency = 'normal'; G.nextAt = Date.now() + 1e9;
  for (const p of G.people) p.state.needs = Object.fromEntries(Object.keys(p.state.needs).map(k => [k, 0.05]));
  G.lastTick = Date.now() - 1000; G.tick();
  check('游戏时钟下不再带现实时间', !('realHh' in G.clock()) && !('realMm' in G.clock()));

  /* 分担的家人：妈妈自动分担照顾 */
  const mom = await mk('mom', '分担妈妈'); const MM = G.get(mom.id);
  check('妈妈默认分担', MM.person.helper === true && G.helpers().some(h => h.id === MM.id));
  const tpn = G.get(tp.id); for (const p of G.people) p.person.active = p === tpn || p === MM;
  tpn.state.needs.hunger = 0.9; let momHelped = false;
  for (let i = 0; i < 80 && !momHelped; i++) { G.agentState.declined = []; G.world.game_minutes += 60; G.assistTick(60); tpn.state.needs.hunger = Math.max(tpn.state.needs.hunger, 0.9); momHelped = Object.values(G.journal[tpn.id] || {}).flat().some(e => e.type === 'care' && /分担妈妈/.test(e.text)); }
  check('分担的家人响应后台的请求去照顾', momHelped);
  /* 外出和耽误的工作 */
  G.cfg.economy.work_hours = '00:00-23:59'; G.cfg.time.daynight = 'system'; await store_write_cfg();
  const elderX = await mk('paternal_grandpa', '外出爷爷'), babyX = await mk('toddler', '外出宝宝'); const EX = G.get(elderX.id), BX = G.get(babyX.id);
  EX.state.needs.mobility = 0.9; BX.state.needs.play = 0.9; for (const p of G.people) { p.person.active = p === EX || p === BX; }
  check('带爷爷去公园', G.perform(EX.id, 'park') === true && !!G.flag(EX, 'outing') && !!G.flag(BX, 'outing'));
  check('一起去的人在公园，公园页出现', CY.world.locationOf(EX).place === 'park' && CY.world.occupiedPlaces().includes('park'));
  check('在外面的人先不能照顾', CY.world.presenceNeed(EX).outing === true);
  G.world.game_minutes += 30; G.drive('tick', { minutes: 1 });
  check('外出时间到了自己回来，规则收尾', !G.flag(EX, 'outing') && !G.flag(BX, 'outing') && CY.world.locationOf(EX).place === 'home');
  /* 宝宝一直要人，猫狗会来身边 */
  BX.state.needs.hunger = 0.8; delete G.req[BX.id]; G.nagAt = {}; G.nagTick(Date.now());
  check('宝宝需求超过一半一直提示', G.needy(BX) && !!G.req[BX.id]);
  const catX = await mk('cat', '要摸的猫'); const CX = G.get(catX.id); CX.state.needs.company = 0.8; CX.person.active = true;
  check('猫想蹭人就来书桌边', CY.world.locationOf(CX).room === 'study');
  const dogX = await mk('dog', '要出去的狗'); const DX = G.get(dogX.id); DX.state.needs.play = 0.8; DX.person.active = true;
  check('狗想出去玩就来书桌边', CY.world.locationOf(DX).room === 'study');
  /* 离开书桌没有收入 */
  CY.world.enforce = true; CY.world.moveTo('home', 'kitchen'); for (const p of G.people) p.person.active = false;
  G.lastTick = Date.now() - 1000; G.nextAt = Date.now() + 1e9; G.tick();
  CY.world.moveTo('home', 'study'); G.lastTick = Date.now() - 1000; G.tick();
  CY.world.enforce = false;
  /* 需求交给后端：游戏自己不涨，由 need_set 给 */
  const BXn = G.get(babyX.id);
  G.cfg.play.needs_source = 'backend'; BXn.person.active = true; BXn.state.needs.thirst = 0.1; G.lastTick = Date.now() - 1000; G.tick();
  check('需求交给后端时游戏不再自己涨', BXn.state.needs.thirst === 0.1);
  G.applyDirectives(CY.protocol.sanitize([{ op: 'need_set', person: BXn.id, need: 'thirst', value: 0.77 }]));
  check('后端用 need_set 直接设需求', BXn.state.needs.thirst === 0.77);
  G.cfg.play.needs_source = 'builtin';
  for (const id of [mom.id, elderX.id, babyX.id, catX.id, dogX.id]) await G.deletePerson(id);
  for (const p of G.people) p.person.active = true;
  G.cfg.economy.work_hours = '09:00-18:00'; G.cfg.time.daynight = 'auto'; await store_write_cfg(); refs();

  /* 旧数据：缺年龄的人按阶段补年龄，旧版本的物种模板被新版覆盖 */
  const legacy = await mk('paternal_grandpa', '旧爷爷');
  const pr = ctx.jsyaml.load(mem.get(`people/${legacy.id}/person.yaml`)); delete pr.age; pr.age_stage = 'elder'; mem.set(`people/${legacy.id}/person.yaml`, ctx.jsyaml.dump(pr));
  mem.set('templates/species/human.yaml', 'version: 1\nid: human\nlabel: 人\nneeds: {}\nactions: {}\n');
  await G.load(); refs();
  check('旧数据按阶段补上年龄', G.get(legacy.id).person.age === 75 && G.stage(G.get(legacy.id)) === 'elder');
  check('旧版本的物种模板被新版覆盖', ctx.jsyaml.load(mem.get('templates/species/human.yaml')).version === 5 && Object.keys(G.tpl.species.human.needs).length > 5);


  /* ---------- v0.6：自己做、睡觉、性格特征、更多动作、内容包、场景 ---------- */
  const eld2 = await mk('paternal_grandpa', '独居老人'); const kid2 = await mk('daughter', '小孩'); const hamP = await mk('hamster', '仓鼠鼠'); const owl = await mk('older_sister', '夜猫', { traits: ['nightowl'] }); const lark = await mk('older_sister', '早起', { traits: ['earlybird'] });
  check('自己做的动作不在菜单里，但属于角色自己', !('drink' in G.actionsOf(eld2)) && 'drink' in G.allActionsOf(eld2) && 'cook' in G.allActionsOf(eld2) && !('drink' in G.allActionsOf(await mk('baby', '宝'))));
  const bby = G.people[G.people.length - 1];
  check('婴儿自己只能玩一玩、咿呀几声，吃喝拉睡一样都做不了', (() => { const own = Object.values(G.allActionsOf(bby)).filter(a => a.self); return own.length >= 2 && own.every(a => Object.keys(a.effect).every(k => ['play', 'company'].includes(k))); })());
  G.cfg.time.daynight = 'game'; G.world.clock_shift = 480; G.cfg.interrupt.frequency = 'test'; G.nextAt = Date.now() + 1e9;
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
  const at = (h) => { G.cfg.time.daynight = 'game'; G.world.clock_shift = 480; G.world.game_minutes = ((h * 60 - 8 * 60) + 1440 * 5) % 1440 + 1440 * 5; for (const p of G.activePeople()) G.act[p.id] = G.activityOf(p); };
  for (const p of [K, E]) p.state.needs = Object.fromEntries(Object.keys(p.state.needs).map(k => [k, 0.1]));
  at(23); check('夜里成人孩子在睡觉', G.act[K.id] === 'sleeping' && G.act[E.id] === 'sleeping');
  at(12); check('白天醒着', G.act[K.id] === 'awake' && G.act[E.id] === 'awake');
  at(12); check('仓鼠白天睡', G.act[HA.id] === 'sleeping');
  at(23); check('夜猫子晚上十一点还醒着，凌晨两点在睡', G.act[OW.id] === 'awake' && (at(2.5), G.act[OW.id] === 'sleeping'));
  at(5.2); check('早起的人五点多已经醒了', G.act[LA.id] === 'awake' && G.act[K.id] === 'sleeping');
  at(23); const babyS = G.get(bby.id); babyS.person.active = true; babyS.state.needs = Object.fromEntries(Object.keys(babyS.state.needs).map(k => [k, 0.1]));
  G.world.clock_shift = 480; const wakeups = new Set(); for (let dm = 0; dm < 180; dm += 10) { G.world.game_minutes = 1440 * 5 + (23 * 60 - 8 * 60) + dm; wakeups.add(G.activityOf(babyS)); }
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
  const ind = await mk('older_brother', '独立哥', { traits: ['independent', 'sturdy'] });
  check('独立的人自理更强，结实的人虚弱涨得慢', G.classOf(G.get(ind.id)).self_care > G.classOf(G.get(await mk('older_brother', '普通哥').then(x => x.id))).self_care && G.traitMods(G.get(ind.id)).frailty < 1);
  check('性格特征最多两个', (await mk('older_brother', '多特征', { traits: ['clingy', 'sickly', 'grumpy'] })).person.traits.length === 2);
  /* 更多动作 */
  const doc = await mk('paternal_grandpa', '看病的', { conditions: ['cold'] }); const DC = G.get(doc.id);
  DC.state.needs.fever = 0.9;
  check('宠物有梳毛和看兽医，花草有换盆，洗澡只有需要的人', 'groom' in G.actionsOf(G.get(dogP.id)) && 'vet' in G.actionsOf(G.get(dogP.id)) && 'repot' in G.actionsOf(G.get(flowerP.id)) && 'bath' in G.actionsOf(C1) && !('bath' in G.actionsOf(G.get(ind.id))));
  const act26 = new Set(); for (const p of G.people) for (const k in G.allActionsOf(p)) act26.add(k);
  check('动作种类丰富', act26.size >= 40, String(act26.size));
  check('新的身份能创建', ['husband', 'wife', 'neighbor', 'roommate', 'parrot', 'cactus'].every(id => CY.content.archOf(id)) && G.people.length > 0);
  /* 内容包 */
  const zhP = CY.content.packFor('zh-CN'), enP = CY.content.packFor('en'), frP = CY.content.packFor('xx');
  check('英文内容包的每种声线都齐全', Object.keys(zhP.voices).every(v => enP.voices[v] && enP.voices[v].request && enP.voices[v].glance && enP.voices[v].cares_back && enP.voices[v].reveal), Object.keys(zhP.voices).filter(v => !CY.content.packs.en.voices[v]).join());
  check('各语言的条目编号一致', JSON.stringify(zhP.sayings.map(x => x.id)) === JSON.stringify(enP.sayings.map(x => x.id)) && JSON.stringify(zhP.asks.map(x => x.id)) === JSON.stringify(enP.asks.map(x => x.id)) && JSON.stringify(zhP.nudges.map(x => x.id)) === JSON.stringify(enP.nudges.map(x => x.id)));
  check('英文的说话库和问答库真的是英文', enP.sayings.every(x => /[A-Za-z]/.test(x.text)) && enP.asks.every(q => /[A-Za-z]/.test(q.say) && q.answers.length === 3 && q.answers.every(a => /[A-Za-z]/.test(a))), enP.asks.filter(q => !/[A-Za-z]/.test(q.say) || q.answers.length !== 3).map(q => q.id).join());
  check('英文问题保留筛选条件', enP.asks.find(q => q.id === 'ask_s05').pronoun[0] === 'she' && enP.asks.find(q => q.id === 'ask_a04').sensitive === true);
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
    const core = lang !== 'en' ? CY.content.CORE : null;
    const need = (list, key) => zhC[list].map(x => x.id).filter(id => (!core || core[list].includes(id)) && !(P[list] || []).some(y => y.id === id));
    const problems = [];
    if (!P) { problems.push('没有内容包'); } else {
      for (const v of Object.keys(zhC.voices).filter(v => !core || core.voices.includes(v))) { const pv = P.voices[v]; if (!pv) problems.push('声线 ' + v); else for (const g of ['request', 'glance', 'cares_back', 'reveal']) if (zhC.voices[v][g] && !pv[g]) problems.push(v + '.' + g); }
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

  /* 主角：可选，玩家的手就是他的手 */
  {
    const W = CY.world;
    for (const x of G.people) x.person.active = false;
    const ids = []; for (const [a2, n2] of [['paternal_grandpa', '主角爷爷'], ['dad', '爸爸'], ['baby', '小宝宝'], ['daughter', '十二岁']]) ids.push((await mk(a2, n2)).id);
    const [gp, dd, bz, kd] = ids.map(id => G.get(id));
    for (const x of [gp, dd, bz, kd]) { x.person.active = true; for (const k in x.state.needs) x.state.needs[k] = 0.1; }
    const h0 = G.holdSeconds({ min: 30 }), nObs = W.layout('home').length;
    check('没有主角时没有主角', G.protagonist() === null);
    check('宝宝不能做主角', G.setProtagonist(bz.id) === false && G.protagonist() === null);
    check('老人可以做主角', G.setProtagonist(gp.id) === true && G.protagonist() === gp);
    check('老人主角长按更慢', G.holdSeconds({ min: 30 }) > h0 * 1.5, h0 + ' -> ' + G.holdSeconds({ min: 30 }));
    check('主角自己的圈里有只有自己能做的', !!G.actionsOf(gp).drink && !G.actionsOf(dd).drink);
    W.moveTo('home', 'kitchen');
    const lay = W.layout('home').filter(l => l.id === gp.id);
    check('主角站在玩家所在的房间且只出现一次', lay.length === 1 && lay[0].room === 'kitchen' && W.locationOf(gp).room === 'kitchen');
    check('主角不睡觉', G.activityOf(gp) === 'awake' && !G.needy(gp));
    G.req = {}; for (let i = 0; i < 30; i++) G.fire();
    check('主角不会被打扰', !G.req[gp.id]);
    dd.person.helper = true; G.setProtagonist(dd.id);
    check('做了主角的大人不再算分担家人', !G.helpers().some(h => h.id === dd.id));
    G.setProtagonist(gp.id);
    G.cfg.time.mode = 'fast'; G.lastTick = Date.now() - 5000; G.tick();
    G.setProtagonist(kd.id);
    check('孩子可以做主角，圈不变慢', G.protagonist() === kd && G.holdSeconds({ min: 30 }) === h0);
    check('快照里有主角', CY.protocol.world().protagonist === kd.id && CY.protocol.person(kd, {}).protagonist === true);
    await G.deletePerson(kd.id);
    check('删掉主角后回到没有主角', G.protagonist() === null);
    G.setProtagonist(null); W.moveTo('home', 'study');
  }

  /* 角色卡：每类典型角色一张明文 YAML，创建角色按卡来，改了卡就变 */
  {
    const files = Object.keys(CY.seed.files()).filter(f => /^templates\/cards\//.test(f));
    check('每种原型都有一张角色卡', files.length === CY.content.archetypes.length && files.length >= 40, files.length + ' vs ' + CY.content.archetypes.length);
    for (const id of ['elder', 'toddler_1', 'toddler_2', 'toddler_3', 'toddler_4', 'child_12', 'young_woman', 'wife', 'mother_in_law']) check('有典型角色卡 ' + id, !!G.tpl.cards[id] && G.tpl.cards[id].health && typeof G.tpl.cards[id].health.score === 'number' && !!G.tpl.cards[id].help && !!G.tpl.cards[id].dialogue && Array.isArray(G.tpl.cards[id].self_actions));
    check('1到4岁卡的年龄对', [1, 2, 3, 4].every(n => G.tpl.cards['toddler_' + n].age === n) && G.tpl.cards.child_12.age === 12 && G.tpl.cards.young_woman.age === 25);
    const eid = await G.createPerson({ arch: 'elder', name: '卡爷爷' }), cid = await G.createPerson({ arch: 'child_12', name: '卡孩子' }), wid = await G.createPerson({ arch: 'wife', name: '卡妻子' });
    await G.load();
    const E0 = G.get(eid), K = G.get(cid), Wf = G.get(wid);
    const E = E0;
    check('老人卡的健康度进了状态', Math.abs(E.state.frailty - 0.4) < 0.011 && E.person.card === 'elder', String(E.state.frailty));
    check('老人卡的台词优先于声线', G.lines(E, 'request', 'thirst')[0].includes('倒杯水'));
    check('卡里的主动帮忙', K.person.helper === true && K.person.help.efficiency === 0.3 && Wf.person.helper === true && E.person.helper === false);
    check('快照带卡和健康度', CY.protocol.person(E, {}).card === 'elder' && Math.abs(CY.protocol.person(E, {}).health - 0.6) < 0.011 && !!CY.api.cards().elder);
    /* 改卡：自理动作名单和需求速率只对新建的角色生效 */
    const cardY = ctx.jsyaml.load(await CY.store.read('templates/cards/elder.yaml')); cardY.self_actions = ['drink']; cardY.need_rate = { thirst: 2 };
    await CY.store.write('templates/cards/elder.yaml', ctx.jsyaml.dump(cardY)); await G.load();
    const e2id = await G.createPerson({ arch: 'elder', name: '改卡' }); await G.load();
    const E2 = G.get(e2id); const Eold = G.get(eid);
    check('改了卡的自理名单生效', JSON.stringify(E2.person.self_actions) === '["drink"]' && G.canSelf(E2, G.allActionsOf(E2).drink) && !G.canSelf(E2, G.allActionsOf(E2).wash) && G.canSelf(Eold, G.allActionsOf(Eold).wash));
    check('改了卡的需求速率生效', E2.person.need_rate.thirst === 2);
    await G.load();
  }

  /* 行动者：每个人按喜好和需求慢慢换房间，悬停的人停住 */
  {
    const W = CY.world;
    const keepDay = [G.cfg.time.daynight, G.world.clock_shift];
    for (const x of G.people) x.person.active = false;
    const ids = []; for (const [a2, n2] of [['paternal_grandpa', '走动爷爷'], ['mom', '走动妈妈'], ['baby', '走动宝宝'], ['cat', '走动猫']]) ids.push((await mk(a2, n2)).id);
    const [gp2, mm2, bb2, ct2] = ids.map(id => G.get(id));
    G.cfg.time.daynight = 'game'; G.world.clock_shift = (14 * 60 - (Math.floor(G.world.game_minutes) % 1440) + 1440) % 1440;   /* 下午两点，创建角色会重新载入设置，所以放在创建之后 */
    for (const x of [gp2, mm2, bb2, ct2]) { x.person.active = true; for (const k in x.state.needs) x.state.needs[k] = 0.1; G.act[x.id] = 'awake'; }
    const seenRooms = new Set();
    for (let i = 0; i < 60; i++) { for (const k in W.agents) W.agents[k].next = 0; seenRooms.add(W.locationOf(mm2).room); }
    check('醒着的大人会换房间', seenRooms.size >= 3, [...seenRooms].join());
    check('宝宝自己不会走，醒着在垫子上', W.locationOf(bb2).room === 'living' && W.locationOf(bb2).mode === 'mat');
    check('老人白天只在喜欢的房间', (() => { const r = new Set(); for (let i = 0; i < 60; i++) { for (const k in W.agents) W.agents[k].next = 0; r.add(W.locationOf(gp2).room); } return [...r].every(x => ['living', 'yard', 'kitchen'].includes(x)); })());
    /* 需求把人推向对应的房间 */
    const kitchenCount = () => { let n = 0; for (let i = 0; i < 200; i++) { for (const k in W.agents) W.agents[k].next = 0; if (W.locationOf(mm2).room === 'kitchen') n++; } return n; };
    mm2.state.needs.hunger = 0.1; const kitFull = kitchenCount();
    mm2.state.needs.hunger = 0.95; const kitHungry = kitchenCount();
    check('饿了更常去厨房', kitHungry > kitFull * 1.5, kitFull + ' -> ' + kitHungry);
    mm2.state.needs.hunger = 0.1;
    /* 悬停的人停住，放开后才动 */
    const r0 = W.locationOf(mm2).room; W.freeze(mm2.id, true);
    let moved = false; for (let i = 0; i < 40; i++) { W.agents[mm2.id].next = 0; if (W.locationOf(mm2).room !== r0) moved = true; }
    check('悬停的人不会走开', !moved);
    W.freeze(mm2.id, false);
    check('放开后还要再等几秒才动', W.agents[mm2.id].next > Date.now());
    /* 同一个房间的人会自己聊天、玩耍、逗宠物 */
    for (const x of [gp2, mm2, bb2, ct2]) { for (const k in x.state.needs) x.state.needs[k] = 0.1; x.person.active = true; }
    gp2.state.needs.company = 0.9; mm2.state.needs.company = 0.9;
    for (const k of ['living']) { W.agents[gp2.id] = { room: k, next: Date.now() + 1e9 }; W.agents[mm2.id] = { room: k, next: Date.now() + 1e9 }; W.agents[ct2.id] = { room: k, next: Date.now() + 1e9 }; }
    const before = Object.values(G.journal[gp2.id] || {}).flat().length + Object.values(G.journal[mm2.id] || {}).flat().length + Object.values(G.journal[ct2.id] || {}).flat().length + Object.values(G.journal[bb2.id] || {}).flat().length;
    for (let i = 0; i < 400; i++) G.socialTick(60);
    const after = Object.values(G.journal[gp2.id] || {}).flat().length + Object.values(G.journal[mm2.id] || {}).flat().length + Object.values(G.journal[ct2.id] || {}).flat().length + Object.values(G.journal[bb2.id] || {}).flat().length;
    check('同房间的人自己聊起来并留在发生的事里', after > before && (gp2.state.needs.company < 0.9 || mm2.state.needs.company < 0.9), before + ' -> ' + after);
    /* 后端可以让一个人走去某个房间 */
    const mv = CY.protocol.sanitize([{ op: 'move', person: mm2.id, room: 'toilet', minutes: 3 }, { op: 'move', person: mm2.id, room: 'nowhere' }]);
    check('move 指令只认家里的房间', mv.length === 1 && mv[0].room === 'toilet');
    G.applyDirectives(mv);
    check('后端能把人叫去房间', W.locationOf(mm2).room === 'toilet' && W.agents[mm2.id].next > Date.now() + 2.5 * 60000);
    /* 家人去帮忙：先走到要照顾的人那里，头上有标记 */
    for (const x of G.people) x.person.active = x === mm2 || x === bb2;
 mm2.state.needs.hunger = 0.1; bb2.state.needs.hunger = 0.9; G.act[bb2.id] = 'awake';
    W.agents[mm2.id] = { room: 'kitchen', next: Date.now() + 1e9 }; W.frozen.clear();
    mm2.person.helper = true; for (let i = 0; i < 40 && CY.world.errandOf(mm2) !== 'help'; i++) { W.agents[mm2.id] = { room: 'kitchen', next: Date.now() + 1e9 }; bb2.state.needs.hunger = 0.9; G.agentState.declined = []; G.world.game_minutes += 60; G.assistTick(60); }
    check('帮忙的人先走去要照顾的人那里并带着标记', W.agents[mm2.id].room === 'living' && W.errandOf(mm2) === 'help', JSON.stringify(W.agents[mm2.id]));
    for (const x of G.people) x.person.active = true;
    /* 角色卡里的喜好优先 */
    const cardY = ctx.jsyaml.load(await CY.store.read('templates/cards/mom.yaml')); cardY.prefs = { rooms: { yard: 1 }, restless: 1 };
    await CY.store.write('templates/cards/mom.yaml', ctx.jsyaml.dump(cardY)); await G.load();
    const m3id = await G.createPerson({ arch: 'mom', name: '爱院子' }); await G.load();
    const M3 = G.get(m3id); for (const x of G.people) x.person.active = x === M3; for (const k in M3.state.needs) M3.state.needs[k] = 0.1;
    G.setClock(8 * 60 + 45);   /* 八点四十五，上班的人的日程里这个时刻没有去处，喜好才起作用；不固定时钟的话，测试会随真实时间偶尔失败 */
    const r3 = new Set(); for (let i = 0; i < 40; i++) { for (const k in W.agents) W.agents[k].next = 0; r3.add(W.locationOf(M3).room); }
    check('卡里的 prefs 决定爱去哪', r3.has('yard') && M3.person.prefs.restless === 1, [...r3].join());
    for (const x of G.people) x.person.active = true;
    G.cfg.time.daynight = keepDay[0]; G.world.clock_shift = keepDay[1];
  }

  /* 饭点全家在厨房一起吃饭 */
  {
    const W = CY.world, keepDay = [G.cfg.time.daynight, G.world.clock_shift];
    for (const x of G.people) x.person.active = false;
    const ids = []; for (const [a2, n2] of [['mom', '饭妈妈'], ['dad', '饭爸爸'], ['paternal_grandma', '饭奶奶'], ['baby', '饭宝宝']]) ids.push((await mk(a2, n2)).id);
    const four = ids.map(id => G.get(id));
    G.cfg.time.daynight = 'game'; G.world.clock_shift = (18.5 * 60 - (Math.floor(G.world.game_minutes) % 1440) + 1440) % 1440;
    for (const x of four) { x.person.active = true; for (const k in x.state.needs) x.state.needs[k] = 0.1; x.state.needs.hunger = 0.8; W.agents[x.id] = { room: 'kitchen', next: Date.now() + 1e9 }; G.act[x.id] = 'awake'; }
    check('饭点是饭点', W.isMealTime(), G.dayMinutes() + ' ' + G.daySource() + ' ' + G.world.clock_shift + ' ' + G.world.game_minutes);
    G.socialTick(1e6);
    check('饭点三个人在厨房就一起吃饭，婴儿不算', four.slice(0, 3).every(x => x.state.needs.hunger < 0.5) && four[3].state.needs.hunger === 0.8);
    G.cfg.time.daynight = keepDay[0]; G.world.clock_shift = keepDay[1];
    for (const x of G.people) x.person.active = true;
  }

  /* 宝宝一直叫没人理：间隔越来越长，没人管的记录只留一次 */
  {
    for (const x of G.people) x.person.active = false;
    const baby3 = await mk('baby', '没人理的宝宝'); const B3 = G.get(baby3.id); B3.person.active = true; for (const k in B3.state.needs) B3.state.needs[k] = 0.1; B3.state.needs.hunger = 0.85; G.act[B3.id] = 'awake';
    G.cfg.time.mode = 'fast'; G.cfg.time.daynight = 'game'; G.world.clock_shift = ((600 - Math.floor(G.world.game_minutes)) % 1440 + 1440) % 1440; G.nagN = {}; G.nagLogged = {}; G.nagAt = {}; G.req = {}; G.nextAt = Date.now() + 1e9;
    const gaps = [];
    for (let i = 0; i < 5; i++) {
      G.nagAt = {}; G.nagTick(Date.now()); gaps.push(G.nagAt[B3.id] - Date.now());
      G.req[B3.id].deadline = 1; G.lastTick = Date.now() - 1000; B3.state.needs.hunger = 0.85; G.tick();
    }
    const missed = Object.values(G.journal[B3.id] || {}).flat().filter(e => e.type === 'missed').length;
    check('没人理的叫声间隔越来越长', gaps[4] > gaps[0] * 4 && G.nagN[B3.id] >= 4, gaps.map(x => Math.round(x / 1000)).join());
    check('没人管的记录一轮只留一次', missed === 1, String(missed));
    G.perform(B3.id, 'feed'); check('照顾过后重新计', G.nagN[B3.id] === 0);
    for (const x of G.people) x.person.active = true;
  }

  /* 旧数据文件夹：没有 card、prefs、help 的角色，带钱和保姆的旧 world.yaml，都能照常载入 */
  {
    for (const x of G.people) x.person.active = true;
    const oid = await G.createPerson({ arch: 'mom', name: '旧妈妈', helper: true });
    const py = ctx.jsyaml.load(await CY.store.read(`people/${oid}/person.yaml`)); delete py.card; delete py.prefs; delete py.help; delete py.class_override; delete py.need_rate; delete py.self_actions;
    await CY.store.write(`people/${oid}/person.yaml`, ctx.jsyaml.dump(py));
    const wy = ctx.jsyaml.load(await CY.store.read('world.yaml')); wy.money = 321; wy.inv = { food: 3 }; wy.nanny = { days_left: 2, owed: 0 }; await CY.store.write('world.yaml', ctx.jsyaml.dump(wy));
    let loadErr = null; try { await G.load(); } catch (e) { loadErr = e; }
    const OM = G.get(oid);
    check('旧数据文件夹能载入', !loadErr && !!OM, loadErr && String(loadErr));
    check('旧数据里的钱保留，物品和旧保姆被丢掉', G.world.money === 321 && !('inv' in G.world) && !('nanny' in G.world));
    check('没有卡的旧角色也会走动、也能帮忙', ['living', 'kitchen', 'yard', 'study', 'toilet', 'bedroom'].includes(CY.world.locationOf(OM).room) && G.helpers().some(h => h.id === oid));
    await G.deletePerson(oid);
  }

  /* 旧设置文件里取消了的项会被丢掉 */
  {
    const old = CY.ini.parse(['[interrupt]', 'mode = keep', 'quiet_hours = 22:00-07:00', 'countdown_seconds = 30', '[play]', 'fall_scale = 9', 'economy = false', '[interaction]', 'click_instead_of_hold = true'].join(String.fromCharCode(10)));
    const txt = CY.ini.stringify(old);
    check('取消了的设置不再写回', !/quiet_hours|fall_scale|click_instead|economy = false|answer_seconds|offline_cap|hold_scale|nanny_daily|^wage/m.test(txt) && CY.ini.num(old, 'interrupt', 'countdown_seconds') === 30);
  }

  /* 心情低落的人更想回自己的房间 */
  {
    const p = await mk('dad', '爸');
    const keep = p.state.mood; p.state.mood = 0.1; const low = CY.world.scoreRoom(p, 'bedroom'); p.state.mood = 0.6; const mid = CY.world.scoreRoom(p, 'bedroom'); p.state.mood = keep;
    check('心情低落的人更想回卧室', low > mid, low + ' ' + mid);
  }

  /* 卡里的专属台词是中文，英文界面不该说中文 */
  {
    const p = await mk('elder', '爷'), keep = CY.i18n.lang;
    const zhLine = G.lines(p, 'request', 'thirst').join('');
    CY.i18n.lang = 'en';
    const enLine = G.lines(p, 'request', 'thirst').join('');
    CY.i18n.lang = keep;
    check('卡里的中文专属台词只在中文界面用', zhLine.includes('倒杯水') && !enLine.includes('倒杯水'), enLine.slice(0, 40));
  }

  /* 前后台分离：后台产生状态表和策略，前台按个人卡和自身状态响应 */
  {
    for (const x of G.people) x.person.active = false;
    const ids4 = []; for (const [a, nm] of [['baby', '宝宝'], ['mom', '妈妈'], ['dog', '小狗'], ['elder', '老爷子']]) ids4.push((await mk(a, nm)).id);
    for (const x of G.people) x.person.active = ids4.includes(x.id);
    let [bab, mom3, dg, el] = ids4.map(i => G.get(i));
    const snap = () => CY.backend.buildPlan({ minutes: 600 });
    const sn = snap(), sb = sn.people.find(x => x.id === bab.id), se = sn.people.find(x => x.id === el.id);
    check('快照带个人卡的判断：宝宝自己只能玩和咿呀，妈妈能帮忙', sb.abilities.self_needs.every(n => ['play', 'company'].includes(n)) && sn.people.find(x => x.id === mom3.id).abilities.help && !sb.abilities.help && se.abilities.go_actions.includes('street'), JSON.stringify(sb.abilities));
    let toSelf = 0, toMom = 0, toOther = 0, n = 0;
    const T = G.tpl.system.agents, keep = JSON.stringify(T);
    for (let i = 0; i < 300; i++) {
      bab.state.needs.hunger = 0.9; bab.state.needs.diaper = 0.9; G.act[mom3.id] = 'awake'; G.act[bab.id] = 'awake'; G.act[el.id] = 'awake';
      const r = CY.backend.plan(Object.assign(snap(), { minutes: 600 }));
      for (const s of r.strategies.filter(x => x.from === bab.id)) { n++; if (s.to === bab.id) toSelf++; else if (s.to === mom3.id) toMom++; else toOther++; }
    }
    check('宝宝的请求从不发给自己，也不发给不能帮忙的人', n > 20 && toSelf === 0 && toOther === 0 && toMom === n, n + ' ' + toSelf + ' ' + toOther);
    /* 调低请求倍率为 0 就不再发请求 */
    G.tpl.system.agents.request.scale = 0;
    const r0 = CY.backend.plan(snap());
    check('请求倍率为 0 时不发请求', r0.strategies.length === 0);
    G.tpl.system.agents = JSON.parse(keep);
    /* 状态表给位置愿望：白天狗想去公园，老人想上街 */
    G.act[dg.id] = 'awake'; dg.state.needs.play = 0.8; el.state.needs.hunger = 0.1; G.setClockHour && G.setClockHour(10);
    let wants = 0;
    for (let i = 0; i < 400 && !(G.wants[dg.id] && G.wants[el.id]); i++) { const r = CY.backend.plan(Object.assign(snap(), { minutes: 600, world: Object.assign(snap().world, { hour: 10 }) })); for (const s of r.states) if (s.want) { wants++; G.wants[s.person] = G.wants[s.person] || { id: s.want.id, action: s.want.action, until: Date.now() + 1e6 }; } }
    check('状态表会产生位置愿望', wants > 0 && !!G.wants[dg.id], JSON.stringify(G.wants));
    /* 前台响应：妈妈陪狗去遛 */
    G.wants[dg.id] = { id: 'dog_park', action: 'walk', until: Date.now() + 1e6 };
    let went = false;
    for (let i = 0; i < 60 && !went; i++) { G.act[mom3.id] = 'awake'; G.act[dg.id] = 'awake'; G.agentState.declined = []; G.world.game_minutes += 60; if (!G.flag(dg, 'outing') && !G.wants[dg.id]) G.wants[dg.id] = { id: 'dog_park', action: 'walk', until: Date.now() + 1e6 }; G.agentTick(60); went = !!G.flag(dg, 'outing'); }
    check('愿望得到响应：狗被带出去了，同行的人也在外面', went && !!G.flag(mom3, 'outing') && !G.wants[dg.id]);
    /* 检查：后台回的策略不合卡的会被丢掉 */
    const clean = CY.protocol.sanitizePlan({ states: [{ person: 'nobody' }, { person: bab.id, needs: { hunger: 5 }, mood: -3 }], strategies: [{ from: bab.id, to: mom3.id, kind: 'care', need: 'hunger' }, { from: bab.id, to: mom3.id, kind: 'fly' }, { from: 'x', to: mom3.id, kind: 'care', need: 'hunger' }] });
    check('策略与状态表的检查：不认识的丢掉，数值压回范围', clean.states.length === 1 && clean.states[0].needs.hunger === 1 && clean.states[0].mood === 0 && clean.strategies.length === 1);
    const bad = { from: bab.id, to: bab.id, kind: 'self', need: 'hunger' };
    G.agentState.inbox = []; bab.state.needs.hunger = 0.95;
    const before = bab.state.needs.hunger; G.agentState.inbox.push(Object.assign({ id: 99, born: Date.now(), phase: 'sent', wait: 0, tries: 0 }, bad)); G.agentTick(10);
    check('宝宝发给自己的请求不会被执行', bab.state.needs.hunger >= before && G.agentState.inbox.length === 0);
    for (const x of G.people) x.person.active = true;
  }

  /* 换语言：台词库没有残留中文，发生的事的记录跟着语言变 */
  {
    const y = ctx.jsyaml, cjk = /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/, zhF = CY.seed.contentFiles('zh-CN');
    const leaves = (o, pre = '', out = []) => { if (Array.isArray(o)) out.push([pre, o]); else if (o && typeof o === 'object') for (const k in o) leaves(o[k], pre + '/' + k, out); return out; };
    const bad = [];
    for (const L of ['en', 'fr', 'es', 'de']) {
      const F = CY.seed.contentFiles(L);
      for (const f in zhF) { if (!/voices\//.test(f)) continue; const rel = f.replace(/^templates\/content\/[^/]+\//, ''), key = Object.keys(F).find(x => x.endsWith(rel)); const B = Object.fromEntries(leaves(y.load(F[key]) || {})); for (const [p, a] of leaves(y.load(zhF[f]) || {})) if (!B[p] || B[p].some(x => typeof x === 'string' && cjk.test(x))) bad.push(L + rel + p); }
    }
    check('英法西德的台词库没有缺的或残留的中文', bad.length === 0, bad.slice(0, 4).join(' '));
    const jp = await mk('mom', '语言妈妈'); jp.state.needs.hunger = 0.9; G.act[jp.id] = 'awake';
    for (const x of G.people) x.person.active = x === jp;
    CY.i18n.set('zh-CN'); const act = Object.values(G.actionsOf(jp)).find(a => a.effect && a.effect.hunger < 0);
    G.perform(jp.id, act.id);
    const ent = Object.values(G.journal[jp.id]).flat().filter(e => e.type === 'care').pop();
    const zhText = G.entryText(ent); CY.i18n.set('en'); const enText = G.entryText(ent); CY.i18n.set('zh-CN');
    check('发生的事存了键和参数，换成英文后框架和动作名都变了', !!ent.k && enText !== zhText && !/[\u4e00-\u9fff]/.test(enText.replace(ent.a.line, '')), zhText + ' | ' + enText);
    for (const x of G.people) x.person.active = true;
  }

  /* 开始场景：一个人住照顾自己 */
  {
    const pr = CY.content.presets.find(x => x.id === 'solo_pets'), m = pr.members[0];
    for (const x of G.people) x.person.active = false;
    const sid = await G.createPerson({ arch: m.arch, name: m.name, age: m.age, conditions: m.conditions }); await G.load();
    check('一个人养宠物和植物的场景：只有一个成年人，是主角，另有猫和花草', pr.members.filter(x => CY.content.archOf(x.arch).species === 'human').length === 1 && m.lead && pr.members.length === 4 && G.get(sid).person.age === 28);
    check('他能当主角，也能自己照顾自己', G.setProtagonist(sid) && G.protagonist().id === sid && Object.keys(G.actionsOf(G.get(sid))).length > 0);
    G.setProtagonist(null);
    for (const x of G.people) x.person.active = true;
  }

  /* 金钱：工作时段赚钱，没有欠账 */
  {
    const atHour = h => { G.cfg.time.daynight = 'game'; G.world.clock_shift = ((h * 60 - Math.floor(G.world.game_minutes)) % 1440 + 1440) % 1440; };
    CY.world.enforce = false; G.cfg.economy.work_hours = '09:00-18:00'; G.setProtagonist(null);
    const sp0 = G.cfg.time.speed; G.cfg.time.speed = '1';   /* 这一段按普通模式，一个游戏小时就是一个现实小时 */
    atHour(10); G.world.money = 100; G.world.focus = undefined; G.economyTick(60, false);
    /* 专注从 10% 用 20 分钟线性爬到满额：第一个小时的平均专注是 (20 乘 0.55 加 40) 除以 60 */
    check('工作时段第一个小时按专注曲线赚钱', Math.abs(G.world.money - (100 + G.WAGE * 51 / 60)) < 0.01 && G.focus() === 1, G.world.money + ' ' + G.focus());
    G.economyTick(60, false);
    check('专注满额后每小时赚 G.WAGE', Math.abs(G.world.money - (100 + G.WAGE * 51 / 60 + G.WAGE)) < 0.01, G.world.money);
    const m1 = G.world.money; atHour(22); G.economyTick(60, false);
    check('不是工作时段不赚钱，专注掉回 10%', Math.abs(G.world.money - m1) < 0.01 && Math.abs(G.focus() - 0.1) < 1e-9, G.focus());
    atHour(10); G.world.focus = undefined; G.economyTick(10, false);
    check('坐下 10 分钟专注爬到 55%', Math.abs(G.focus() - 0.55) < 1e-9, G.focus());
    G.economyTick(10, false); check('再坐 10 分钟到 100%', Math.abs(G.focus() - 1) < 1e-9, G.focus());
    G.economyTick(30, false); atHour(22);
    {   /* 被叫走：时段内不在书桌前，立刻掉回 10% */
      atHour(11); G.world.focus = 1; const lw0 = G.leadWorking; G.leadWorking = () => false; G.economyTick(5, false); G.leadWorking = lw0;
      check('被叫走专注立刻掉回 10%', Math.abs(G.focus() - 0.1) < 1e-9, G.focus());
    }
    atHour(22); G.world.money = m1;
    if (sp0 === undefined) delete G.cfg.time.speed; else G.cfg.time.speed = sp0;
    const pen = (() => { const e = G.people.find(p => p.person.kind === 'human' && G.stage(p) === 'elder'); return e; })();
    if (pen) { G.setProtagonist(pen.id); const m1 = G.world.money; atHour(22); G.economyTick(60, false); check('老人主角领固定退休金，按现实小时算', Math.abs(G.world.money - m1 - G.PENSION * G.econHours(60)) < 0.01); G.setProtagonist(null); }
    for (const x of G.people) x.person.active = true;
  }

  {
    /* 病程：进度存在 story.arcs，读档，导出再导入都原样回来，不重复触发，条件不够就停着，世界暂停不跳阶段 */
    const id = await G.createPerson({ arch: 'paternal_grandpa', name: '病程', conditions: ['diabetes'] }); await G.load(); for (const x of G.people) x.person.active = x.id === id;
    const arcLogs = () => Object.values(G.journal[id] || {}).flat().filter(e => e.k && e.k.indexOf('arc.diabetes.') === 0).map(e => e.k);
    const day = () => Math.floor(G.world.game_minutes / 1440);
    const st = () => G.arcState(G.get(id), 'diabetes');
    G.world.game_minutes = 10 * 1440 + 600; G.act = {};
    G.arcTick(); check('刚得病的第一天先建进度，不触发阶段', st().stage === 0 && arcLogs().length === 0);
    G.world.game_minutes += 1440; G.arcTick();
    check('过一天走到第一阶段，记一笔', st().stage === 1 && arcLogs().join() === 'arc.diabetes.first', JSON.stringify(st()));
    G.arcTick(); check('同一天再调不重复触发', st().stage === 1 && arcLogs().length === 1);
    G.save(true); await new Promise(r => setTimeout(r, 50));
    const before = JSON.stringify(G.get(id).story.arcs);
    await G.load(); G.act = {};
    check('读档后进度原样回来', JSON.stringify(G.get(id).story.arcs) === before, before);
    G.arcTick(); check('读档后不重复触发第一阶段', st().stage === 1 && arcLogs().length === 1);
    G.world.game_minutes += 5 * 1440; G.arcTick();
    check('天数够了但照顾次数不够，阶段停着，不倒退不惩罚', st().stage === 1 && st().cares === 0);
    for (let i = 0; i < 3; i++) G.applyAction(id, 'sugar');
    check('照顾这个病的需求算一次照顾', st().cares === 3, JSON.stringify(st()));
    const mood0 = G.get(id).state.mood; G.act = {}; G.arcTick();
    check('照顾够了走到第二阶段，心情加上', st().stage === 2 && st().cares === 0 && arcLogs().length === 2 && G.get(id).state.mood > mood0 - 1e-9);
    const keep = G.world.game_minutes; G.stop && G.stop();
    G.save(true); await new Promise(r => setTimeout(r, 50));
    const ex = await CY.archive.exportSave();
    const info = await CY.archive.inspect(new Uint8Array(await ex.blob.arrayBuffer()));
    check('导出的存档能读，包含病程', info.ok && /arcs:/.test(info.files['people/' + id + '/story.yaml']) && info.manifest.schema === CY.meta.schema);
    const before2 = JSON.stringify(G.get(id).story.arcs);
    await CY.archive.apply(info, 'replace'); await G.load(); G.act = {};
    check('导出再导入后进度原样回来', JSON.stringify(G.get(id).story.arcs) === before2 && G.world.game_minutes === keep, JSON.stringify(G.get(id).story.arcs));
    G.arcTick(); check('导入后不重复触发', st().stage === 2 && arcLogs().length === 2);
    {   /* 存档弹性：曲线存成 CSV 往返，旧结构按步骤升级，新结构拒收，新增文件照收，坏文件拒收 */
      const A = CY.archive, enc = new TextEncoder(), pid0 = id;
      G.hist[pid0] = []; for (let i = 0; i < 700; i++) G.hist[pid0].push({ t: i * 15, mood: 0.5 + (i % 7) / 100, frailty: 0.1, needs: { thirst: (i % 10) / 10, hunger: 0.25 } });
      G.wcurve = []; for (let i = 0; i < 5; i++) G.wcurve.push({ t: i * 15, money: 100 + i, focus: 0.1 + 0.2 * i, eff: 0.8, bonus: 1.2 });
      G._curveRev++; G.save(true); await new Promise(r => setTimeout(r, 50));
      const csv = await CY.store.read('people/' + pid0 + '/curves.csv');
      check('曲线存成 CSV，列是 t，心情，虚弱，再是各项需求', /^t,mood,frailty,hunger,thirst\n/.test(csv), csv.slice(0, 60));
      const ex2 = await A.exportSave(), buf2 = new Uint8Array(await ex2.blob.arrayBuffer()), inf2 = await A.inspect(buf2);
      check('导出里有曲线和说明，manifest 记着格式和文件清单', inf2.ok && !!inf2.files['people/' + pid0 + '/curves.csv'] && !!inf2.files['curves_world.csv'] && !!inf2.files['README.txt'] && inf2.manifest.format.series === 'csv' && inf2.manifest.files['curves_world.csv'] > 0, JSON.stringify(inf2.manifest && inf2.manifest.format));
      await A.apply(inf2, 'replace'); await G.load();
      check('曲线往返后行数按上限只留最近 600 行，最后一行对得上', (G.hist[pid0] || []).length === 600 && G.hist[pid0][599].t === 699 * 15 && Math.abs(G.hist[pid0][599].needs.thirst - 0.9) < 1e-9 && G.wcurve.length === 5 && Math.abs(G.wcurve[4].focus - 0.9) < 1e-9, (G.hist[pid0] || []).length);
      const mk = extra => { const z = [{ name: 'careforyou-data/manifest.json', data: enc.encode(JSON.stringify(extra.manifest)) }, { name: 'careforyou-data/settings.ini', data: enc.encode('[ui]\nlanguage = en\n') }, { name: 'careforyou-data/world.yaml', data: enc.encode('game_minutes: 5\n') }]; for (const k in extra.files || {}) z.push({ name: 'careforyou-data/' + k, data: typeof extra.files[k] === 'string' ? enc.encode(extra.files[k]) : extra.files[k] }); return CY.store.zip(z).arrayBuffer(); };
      const old = await A.inspect(await mk({ manifest: { schema: 5, version: '0.60.0' } }));
      check('旧结构的存档能读，并记下升级了哪几步', old.ok && old.migrated && old.migrated.from === 5 && old.migrated.to === CY.meta.schema && old.migrated.steps.length >= 1, JSON.stringify(old.migrated));
      const nw = await A.inspect(await mk({ manifest: { schema: CY.meta.schema + 1 } }));
      check('更新结构的存档拒收，不乱读', !nw.ok && nw.error === 'newer');
      const ext = await A.inspect(await mk({ manifest: { schema: CY.meta.schema }, files: { 'people/x1/person.yaml': 'name: X\n', 'people/x1/mood_notes.csv': 't,note\n1,a\n', 'people/x1/future_thing.yaml': 'a: 1\n', 'curves_extra.csv': 't,v\n1,2\n' } }));
      check('以后新增的 yaml 和 csv 文件照收，不用改导入端', ext.ok && !!ext.files['people/x1/future_thing.yaml'] && !!ext.files['people/x1/mood_notes.csv'] && !!ext.files['curves_extra.csv'] && ext.rejected.length === 0, JSON.stringify(ext.rejected));
      const bad = await A.inspect(await mk({ manifest: { schema: CY.meta.schema }, files: { 'people/x1/person.yaml': 'name: X\n', 'people/x1/Bad Name.csv': 't\n', 'people/x1/nul.csv': 't\u0000\n', '../evil.yaml': 'a: 1\n', 'people/x1/run.js': 'x' } }));
      check('文件名不合规，csv 含空字符，路径越界，不认识的类型都拒收', bad.ok && bad.rejected.length === 4 && !bad.files['people/x1/nul.csv'], JSON.stringify(bad.rejected));
    }
    {   /* 经济目标（普通模式，现实时间，按一小时实得约工资的 85% 算）：十分钟买得起一件礼物，一小时左右买第一张床，再两小时买第二张 */
      const hourly = G.WAGE * 0.85, bed1 = G.BED_PRICE[1] / hourly, bed2 = G.BED_PRICE[2] / hourly, cheap = Object.values(CY.visitors.GIFTS).filter(g => g.price <= hourly / 6).length;
      check('第一张床约一小时攒够', bed1 > 0.8 && bed1 < 1.3, String(bed1));
      check('第二张床再约两小时攒够', bed2 > 1.6 && bed2 < 2.6, String(bed2));
      check('十分钟的收入够买至少五种礼物，一天里随时有礼物可买', cheap >= 5, String(cheap));
    }
    {   /* 站位：同一间房里的人不叠在一起 */
      const W = CY.world, ls = [{ id: 'a', room: 'living', kind: 'stand', gx: 2, gy: 2 }, { id: 'b', room: 'living', kind: 'stand', gx: 2, gy: 2 }, { id: 'c', room: 'living', kind: 'stand', gx: 2.05, gy: 2 }, { id: 'd', room: 'living', kind: 'stand', gx: 2, gy: 2.05 }, { id: 'e', room: 'living', kind: 'stand', gx: 2, gy: 2 }];
      W.spread('home', ls);
      const r = W.PLACES.home.rooms.living; let minD = 9; for (const x of ls) for (const y of ls) if (x !== y) minD = Math.min(minD, Math.hypot(x.gx - y.gx, x.gy - y.gy));
      check('五个人挤在一点也会被推开，互相至少 0.5 格，且都在房间里', minD > 0.5 && ls.every(l => l.gx >= r.gx && l.gx <= r.gx + r.w && l.gy >= r.gy && l.gy <= r.gy + r.h), String(minD));
      const again = [{ id: 'a', room: 'living', kind: 'stand', gx: 2, gy: 2 }, { id: 'b', room: 'living', kind: 'stand', gx: 2, gy: 2 }]; W.spread('home', again); const a2 = JSON.stringify(again); again[0].gx = 2; again[0].gy = 2; again[1].gx = 2; again[1].gy = 2; W.spread('home', again);
      check('同样的输入结果固定，不抖', JSON.stringify(again) === a2);
    }
    {   /* 叙事冲突：老人自己能倒水，宝宝不能；卧床的人没有轮椅出不了门，买了就能 */
      const gid = await G.createPerson({ arch: 'paternal_grandpa', name: '爷爷叙事' }), bid = await G.createPerson({ arch: 'baby', name: '宝宝叙事' }); await G.load();
      const gp = G.get(gid), bp = G.get(bid);
      check('老人口渴自己能解决，宝宝不能', !!G.selfActFor(gp, 'thirst') && !G.selfActFor(bp, 'thirst'), String(!!G.selfActFor(gp, 'thirst')) + String(!!G.selfActFor(bp, 'thirst')));
      gp.state.bedrest = true; G.world.owned = {};
      check('卧床的老人没有轮椅不能一起出门', !G.canJoinOuting(gp));
      G.world.owned = { wheelchair: true };
      check('买了轮椅就能一起出门', G.canJoinOuting(gp));
      delete gp.state.bedrest; G.world.owned = {};
    }
    {   /* 参考文献：每个人类需求都有条目，有出处的写了出处，没有的明说是游戏设定 */
      const R = CY.references, rows = R.rows();
      check('每个人类需求的每个阶段都有一行，不留空', rows.length >= 9 && rows.every(r => r.item), rows.filter(r => !r.item).map(r => r.need).join());
      check('所有引用的出处都存在，带 cite', R.items.every(i => (i.refs || []).every(id => R.sources[id] && R.sources[id].cite.length > 20)));
      check('标了有出处或由出处换算的，必须带至少一条出处', R.items.filter(i => i.status !== 'setting').every(i => (i.refs || []).length >= 1));
      check('状态只能是三种', R.items.every(i => ['sourced', 'derived', 'setting'].includes(i.status)));
      check('每条都有中英文的现实说明', R.items.every(i => i.real && i.real.en && i.real['zh-CN']));
      check('医疗声明有中英文', !!(R.medical.en && R.medical['zh-CN']) && /not medical advice/.test(R.medical.en));
      const th = R.intervals('thirst'), inf = R.intervals('hunger').find(x => x.stage === 'infant');
      check('游戏间隔按速率算：口渴 0.08 到亮起 6.25 小时，婴儿饥饿 0.22 约 2.3 小时', Math.abs(th.find(x => x.stage === 'adult').h - 6.25) < 0.01 && Math.abs(inf.h - 0.5 / 0.22) < 0.01, JSON.stringify(th) + JSON.stringify(inf));
      const gap = R.items.filter(i => i.status === 'sourced' && i.real_h).map(i => { const k = i.key.split(':'), iv = R.intervals(k[0]).find(x => x.stage === (k[1] || x.stage)); return iv ? iv.h / ((i.real_h[0] + i.real_h[1]) / 2) : 1; });
      check('有出处的需求，游戏间隔和现实区间中点相差不超过一倍半', gap.every(g => g > 0.66 && g < 1.5), JSON.stringify(gap));
      /* 每种语言都有知识页要用的键，否则知识页在这种语言里会露出键名 */
      const kk = ['set.know', 'know.intro', 'know.checked', 'know.sec_needs', 'know.sec_focus', 'know.sec_cond', 'know.sec_other', 'know.cond_note', 'know.other', 'know.game', 'know.real_short', 'know.focus', 'know.sourced', 'know.derived', 'know.setting', 'know.stage_all', 'know.stage_infant', 'know.stage_toddler', 'know.stage_child', 'know.stage_teen', 'know.stage_adult', 'know.stage_elder'];
      const miss = []; for (const lang of ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'fr', 'es', 'de']) { CY.i18n.set(lang); for (const k of kk) if (!CY.i18n.hasOwn(k)) miss.push(lang + ':' + k); } CY.i18n.set('zh-CN');
      check('八种语言都有知识页的键', miss.length === 0, miss.slice(0, 5).join());
    }
    for (let i = 0; i < 6; i++) G.applyAction(id, 'medicine');
    G.world.game_minutes += 4 * 1440; G.arcTick();
    check('走完三个阶段，标记完成，之后不再触发', st().stage === 3 && st().done && arcLogs().length === 3);
    G.world.game_minutes += 30 * 1440; G.arcTick(); check('完成后很久也不再触发', arcLogs().length === 3);
    const old = G.get(id); delete old.story.arcs; G.arcTick();
    check('旧存档没有 arcs 也能读，当作刚得病从头开始', G.arcState(G.get(id), 'diabetes').stage === 0);
    for (const x of G.people) x.person.active = true;
  }
  /* zip：不压缩的写出，读回内容一致 */
  const blob = CY.store.zip([{ name: 'careforyou-data/people/a.yaml', data: new TextEncoder().encode('名字: 爷爷\n') }, { name: 'careforyou-data/settings.ini', data: new TextEncoder().encode('[a]\nb = 1\n') }]);
  fs.writeFileSync(path.join(process.env.TEMP || '/tmp', 'cy_test.zip'), Buffer.from(await blob.arrayBuffer()));
  const back = await CY.store.readZip(new Uint8Array(await blob.arrayBuffer()));
  check('zip 写出再读回一致', back.length === 2 && new TextDecoder().decode(back[0].data) === '名字: 爷爷\n');
  check('操纵对象必须有：放弃以后自动换回默认的那位（爸爸，没有就妈妈、成年人），不另造“我”，事件挂在他身上而不是一个叫“你”的角色', await (async () => { const GG = CY.game, had = GG.protagonist(); GG.setProtagonist(null); const n0 = GG.people.length; const made = await GG.ensurePlayer(); const again = await GG.ensurePlayer(); const lead = GG.protagonist(); const ar = p => p.person.archetype || p.person.card; const want = GG.activePeople().filter(GG.canLead); const def = want.find(p => ar(p) === 'dad') || want.find(p => ar(p) === 'mom') || want.find(p => GG.stage(p) === 'adult') || want[0]; GG.logK(GG.youId(), 'event', 'log.groceries', { n: 1 }); const bound = GG.journal[lead.id] && Object.values(GG.journal[lead.id]).some(m => m.some(e => e.k === 'log.groceries')); const ok = made && !again && lead && lead === def && GG.youId() === lead.id && bound && GG.people.length === n0 && !GG.people.some(p => ar(p) === 'me'); GG.setProtagonist(had ? had.id : null); return !!ok; })());
  {
    CY.i18n.set('zh-CN');
    const ida = await G.createPerson({ arch: 'paternal_grandpa', name: '爷爷', name_auto: 'paternal_grandpa', roleText: '爷爷' }), idb = await G.createPerson({ arch: 'paternal_grandma', name: '奶奶', name_auto: 'paternal_grandma', roleText: '奶奶' });
    await G.load();
    CY.i18n.set('en'); await G.refreshAutoNames();
    check('系统起的名字跟界面语言走', G.get(ida).person.name === 'Grandpa' && G.get(ida).person.role !== '爷爷', G.get(ida).person.name);
    await G.updatePerson(idb, { name: '阿婆' });
    CY.i18n.set('zh-CN'); await G.refreshAutoNames(); CY.i18n.set('en'); await G.refreshAutoNames();
    check('玩家改过的名字不再跟语言变', G.get(idb).person.name === '阿婆' && !G.get(idb).person.name_auto);
    CY.i18n.set('zh-CN'); await G.refreshAutoNames();
    check('切回中文名字回到中文', G.get(ida).person.name === '爷爷');
  }
  {
    const W = CY.world;
    for (const x of G.people) x.person.active = false;
    const mkp = async (arch, age) => { const id = await G.createPerson({ arch, name: arch, age }); return id; };
    const ids = [await mkp('paternal_grandpa'), await mkp('paternal_grandma'), await mkp('dad'), await mkp('mom'), await mkp('toddler'), await mkp('daughter'), await mkp('baby')];
    await G.load(); for (const x of G.people) x.person.active = ids.includes(x.id);
    const plan = W.bedPlan(), humans = G.activePeople().filter(p => G.isHuman(p) && G.stage(p) !== 'infant').length;
    const placed = plan.bedroom.length + plan.kids.length + plan.elder.length + plan.guest.length + plan.living.length;
    check('每个不是婴儿的人都有床位，床位够所以没人睡客厅', placed === humans && plan.living.length === 0, placed + '/' + humans);
    check('老人睡老人房，床位不超上限', plan.elder.length >= 2 && plan.bedroom.length <= W.BED_CAP.bedroom && plan.elder.length <= W.BED_CAP.elder, JSON.stringify(plan));
    const seen = new Set(); let dup = false;
    for (const r in plan) plan[r].forEach((id, i) => { const k = r + i; if (seen.has(k)) dup = true; seen.add(k); });
    check('同一间房里每个人的床位序号不同', !dup);
    const bb = G.activePeople().find(p => G.stage(p) === 'infant'); G.act[bb.id] = 'sleeping';
    check('婴儿睡婴儿床，不占床位', W.locationOf(bb).mode === 'cradle');
    for (const x of G.people) x.person.active = true;
  }
  {
    const W = CY.world;
    const lead = G.activePeople().find(p => W.worker(p)) || G.activePeople().find(p => G.isHuman(p) && G.stage(p) === 'adult');
    if (lead) {
      G.setProtagonist(lead.id); const wk = W.worker(lead);
      check('上班的人白天去书房，中午去厨房，晚上去客厅，夜里去卧室', !wk || (W.routineRoom(lead, 10) === 'study' && W.routineRoom(lead, 12.5) === 'kitchen' && W.routineRoom(lead, 20) === 'living' && W.routineRoom(lead, 23) === (W.bedOf(lead) || { room: 'bedroom' }).room));
      G.setClock(10 * 60); check('白天主角默认在书桌前工作的房间', !wk || W.workRoom() === 'study');
      G.setClock(20 * 60); check('傍晚主角默认在客厅', W.workRoom() === 'living');
    }
    const pid0 = G.activePeople()[0].id; G.req[pid0] = { kind: 'ask', pid: pid0, text: 'q', answers: ['a'], since: Date.now(), deadline: Date.now() - 1 };
    G.tick();
    check('问答超时先折成小气泡，还在', !!G.req[pid0] && G.req[pid0].folded === true && G.req[pid0].deadline > Date.now());
    G.req[pid0].deadline = Date.now() - 1; G.tick();
    check('折起来再过时间才真的作废', !G.req[pid0]);
  }
  {
    for (const x of G.people) x.person.active = false;
    const mk2 = async (arch, name) => { const id = await G.createPerson({ arch, name }); return id; };
    const dadId = await mk2('dad', '爸'), momId = await mk2('mom', '妈'), sisId = await mk2('older_sister', '姐'), babId = await mk2('baby', '宝'), husId = await mk2('husband', '夫');
    await G.load(); const ids = [dadId, momId, sisId, babId, husId]; for (const x of G.people) x.person.active = ids.includes(x.id);
    const W = CY.world;
    check('夫妻上班，姐姐不上班', W.worker(G.get(dadId)) && W.worker(G.get(momId)) && W.worker(G.get(husId)) && !W.worker(G.get(sisId)));
    for (const x of G.people) x.person.active = true;
  }
  {
    /* 浏览器里的积分后端自检：每一类角色空放十四天，状态不越界，没有 NaN；表达式解析和 Python 语法一致 */
    const LM = CY.lm, docs = Object.keys(CY.lmSeed).filter(p => p.startsWith('templates/lm/models/')).sort().map(p => [p.split('/').pop(), ctx.jsyaml.load(CY.lmSeed[p])]);
    const lib = new LM.Library(docs, ctx.jsyaml.load(CY.lmSeed['templates/lm/classes.yaml']));
    const ev = (src, env) => LM.compile(src, 't').fn(env || {});
    check('表达式：乘方右结合，一元负号，三元式，and or not，比较连写', ev('2 ** 3 ** 2') === 512 && ev('-2 ** 2') === -4 && ev('1 if 2 > 1 else 0') === 1 && ev('0 or 5') === 5 && ev('3 and 0') === 0 && ev('not 0') === 1 && ev('1 < 2 < 3') === 1 && ev('1 < 3 < 2') === 0 && ev('-7 % 3') === 2 && ev('min(3, 1, 2) + max(1, 4)') === 5);
    const probes = [];
    for (const st of ['infant', 'toddler', 'child', 'teen', 'adult', 'elder']) probes.push(['human', st, ['thirst', 'hunger', 'rest', 'company', 'play', 'diaper', 'hygiene', 'homework', 'mobility']]);
    for (const sp in lib.classes.kinds) { const k = lib.classes.kinds[sp]; if (k === 'animal') probes.push([sp, 'adult', ['thirst', 'hunger', 'company', 'play', 'clean']]); else if (k === 'plant') probes.push([sp, 'adult', ['water', 'sun', 'fertilize', 'prune']]); }
    let bad = [];
    for (const [sp, st, needs] of probes) {
      const eng = new LM.Engine(lib), snap = { id: 'x', species: sp, stage: st, age: 30, needs: Object.fromEntries(needs.map(n => [n, 0.2])), mood: 0.7, frailty: 0.1, sleeping: false, conditions: [], flags: {} };
      for (let i = 0; i < 14 * 24 * 12; i++) {
        snap.sleeping = ((i * 5 / 60) % 24) < 7;
        for (const d of eng.drive({ minutes: 5, people: [JSON.parse(JSON.stringify(snap))], world: { hour: (i * 5 / 60) % 24 } }).directives) {
          const cur = d.need ? snap.needs[d.need] : snap[d.op], nv = Math.min(1, Math.max(0, cur + d.delta));
          if (!(nv === nv)) bad.push(sp + '/' + st); if (d.need) snap.needs[d.need] = nv; else snap[d.op] = nv;
        }
      }
      for (const v of Object.values(eng.people.x.state)) if (!(v === v)) bad.push(sp + '/' + st + ' state');
    }
    check('积分后端：每类角色空放十四天没有 NaN', bad.length === 0, bad.join(','));
  }
  {
    const mkv = async arch => { const id = await G.createPerson({ arch, name: arch }); await G.load(); for (const x of G.people) x.person.active = x.id === id; return G.get(id); };
    const keys = ['tv', 'lunch', 'dinner', 'wakeup', 'goodnight'];
    const okAll = []; for (const arch of ['dad', 'paternal_grandpa', 'toddler_2', 'cat', 'dog']) { const pp = await mkv(arch); for (const k of keys) { const has = G.lines(pp, 'ambient', k).length > 0; if (!has && !(['cat', 'dog'].includes(arch) && ['lunch', 'wakeup'].includes(k) && arch === 'cat') && !(arch === 'dog' && ['lunch', 'goodnight'].includes(k)) && !(arch === 'cat' && ['lunch', 'wakeup'].includes(k)) && !(arch === 'dog' && k === 'goodnight')) okAll.push(arch + '.' + k); } }
    check('日程台词：大人，老人，孩子都有早起，午饭，晚饭，看电视，睡前', !okAll.some(x => /^(dad|paternal_grandpa|toddler_2)\./.test(x)), okAll.join(','));
    const dad = await mkv('dad'); G.setClock(20 * 60); let seen = 0; for (let i = 0; i < 60; i++) { const r = CY.backendLocal.line({ person: { id: dad.id, counters: {} }, group: 'ambient', situation: { room: 'living', band: 'evening' } }); if (G.lines(dad, 'ambient', 'tv').includes(r.text)) seen++; }
    check('晚上在客厅，大人闲谈里会说到看电视', seen > 5, seen);
    for (const x of G.people) x.person.active = true;
  }
  {
  }
  {
    G.world.owned = {}; G.world.money = 100;
    check('钱不够不能买，够了能买，买了扣钱，不能重复买', G.canBuy('toy') && G.buy('toy') && G.world.money === 20 && !G.buy('toy'));
    G.world.money = 1000;
    check('装饰要一档一档买', !G.canBuy('decor2') && G.buy('decor1') && G.decorLevel() === 1 && G.buy('decor2') && G.decorLevel() === 2);
    G.world.owned = {}; G.world.money = 200;
  }
  {
    /* 卧床：老人虚弱到 0.8 躺下，降到 0.55 以下起来；躺着不能散步，有轮椅才能被推出去；婴儿没有婴儿车出不了门 */
    const W = CY.world;
    for (const x of G.people) x.person.active = false;
    const gpId = await G.createPerson({ arch: 'paternal_grandpa', name: '卧床爷' }), babyId = await G.createPerson({ arch: 'baby', name: '小宝' });
    await G.load(); for (const x of G.people) x.person.active = [gpId, babyId].includes(x.id);
    const gp = G.get(gpId), bb = G.get(babyId);
    G.world.owned = {};
    gp.state.frailty = 0.6; G.bedCheck(gp);
    check('虚弱度 0.6 不卧床', !G.bedridden(gp) && !!G.actionsOf(gp).walk && !G.actionsOf(gp).wheel);
    gp.state.frailty = 0.8; G.bedCheck(gp);
    check('虚弱度到 0.8 卧床，在床上躺着，不能散步，没轮椅也没有推出去', G.bedridden(gp) && W.locationOf(gp).mode === 'sleep' && !G.actionsOf(gp).walk && !G.actionsOf(gp).park && !G.actionsOf(gp).wheel);
    gp.state.frailty = 0.6; G.bedCheck(gp);
    check('降到 0.55 以上仍卧床', G.bedridden(gp));
    G.world.owned = { wheelchair: true };
    check('有轮椅，卧床的人能被推出去', !!G.actionsOf(gp).wheel && !G.actionsOf(gp).walk);
    gp.state.frailty = 0.5; G.bedCheck(gp);
    check('降到 0.55 以下起床，恢复散步', !G.bedridden(gp) && !!G.actionsOf(gp).walk && !G.actionsOf(gp).wheel);
    G.world.owned = {};
    check('没有婴儿车，对婴儿不出现带去公园', !G.actionsOf(bb).park);
    G.world.owned = { stroller: true };
    check('有婴儿车，婴儿能被带去公园', !!G.actionsOf(bb).park);
    G.world.owned = { stroller: true, wheelchair: true }; G.clearFlag(bb, 'outing');
    check('用品没出门时都在家里', !G.itemAway('stroller') && !G.itemAway('wheelchair'));
    G.setFlag(bb, 'outing', { minutes: 10, place: 'park', room: 'lawn', mode: 'stand' }); G.setFlag(gp, 'outing', { minutes: 10, place: 'park', room: 'lawn', mode: 'stand' }); gp.state.frailty = 0.9; G.bedCheck(gp);
    check('婴儿出门用着婴儿车，卧床的老人出门坐着轮椅，家里那件不在了', G.usingStroller(bb) && G.itemAway('stroller') && G.usingWheelchair(gp) && G.itemAway('wheelchair'));
    G.clearFlag(bb, 'outing'); G.clearFlag(gp, 'outing');
    G.world.owned = {}; G.world.money = 200;
  }
  {
    /* 看护：需要看护的人不能单独留在家里；家里还有别的大人，他就留下；作业只有五岁以后才有 */
    const W = CY.world;
    for (const x of G.people) x.person.active = false;
    const dId = await G.createPerson({ arch: 'dad', name: '领队爸' }), gId = await G.createPerson({ arch: 'paternal_grandpa', name: '带队爷' }), kId = await G.createPerson({ arch: 'daughter', name: '跟着的女儿' }), mId = await G.createPerson({ arch: 'mom', name: '留守妈' });
    await G.load(); const set = ids => { for (const x of G.people) { x.person.active = ids.includes(x.id); G.clearFlag(x, 'outing'); G.act[x.id] = 'awake'; } };
    set([dId, gId, kId]); G.setProtagonist(dId); W.enforce = false;
    const gp = G.get(gId), kid = G.get(kId);
    G.applyAction(gId, 'park');
    check('没有别的大人看家，女儿跟着爷爷出门', !!G.flag(kid, 'outing') && G.classOf(kid).needs_caregiver === true);
    const lines = (G.journal[kId] ? Object.values(G.journal[kId]).flat() : []).map(e => e.text).join('|') + (G.journal[gId] ? Object.values(G.journal[gId]).flat() : []).map(e => e.text).join('|');
    check('事件按谁带谁写：爷爷带着女儿，女儿跟着爷爷', /带着跟着的女儿/.test(lines) && /跟着带队爷/.test(lines), lines.slice(-120));
    set([dId, gId, kId, mId]); G.applyAction(gId, 'park');
    check('家里还有妈妈看家，女儿留下', !G.flag(kid, 'outing') && !!G.flag(gp, 'outing'));
    const small = G.get(kId); small.person.age = 4;
    check('四岁没有作业，六岁才有', !('homework' in G.needsOf(small)) && (small.person.age = 6, 'homework' in G.needsOf(small)));
  }
  {
    /* 中等屋子：多一间客房，三张床位，睡不下卧室和老人房的人睡客房 */
    const W = CY.world;
    G.world.owned = {};
    check('只有一座房子，客房一直在，三间卧室各两张床', !!W.PLACES.home.rooms.guest && !!W.PLACES.home.rooms.kids && W.PLACES.home.w === 18 && W.vw('home') === 980 && W.vw('park') === 800);
    G.world.gbeds = undefined; check('开局：卧室二，儿童房二，老人房二，客房一张', JSON.stringify(W.BED_CAP) === JSON.stringify({ bedroom: 2, kids: 2, elder: 2, guest: 1 }), JSON.stringify(W.BED_CAP));
    G.world.gbeds = 3; check('客房最多三张', W.BED_CAP.guest === 3); G.world.gbeds = 9; check('客房床位被封顶在三张', G.guestBedsOwned() === 3); G.world.gbeds = undefined;
    const pj = W.project('home', 17, 7);
    check('最远的格子仍在画面里', pj.x > 0 && pj.x < 980 && pj.y > 0 && pj.y < 640, JSON.stringify(pj));
    check('床位计划里有客房', Array.isArray(W.bedPlan().guest));
    check('装饰纯粹是观感：商店里装饰类没有任何数值效果', G.SHOP.filter(i => i.cat === 'decor').every(i => !i.fx) && G.SHOP.filter(i => i.cat === 'decor').length === 4);
    check('商店里没有房子可买，也没有床品，床位另有价格', !G.SHOP.some(i => /house|^bed/.test(i.id)) && G.bedPrice() === 600);
    G.world.gbeds = undefined;
    G.world.owned = {}; G.world.money = 200;
  }
  {
    /* 朝向：站着的人按房间焦点和同屋的人看向某处，同一时段里不变；主角在书房办公始终看向书桌 */
    {
      const W = CY.world, ppl = G.activePeople().filter(p => G.isHuman(p));
      const lay = W.layout('home');
      const f1 = ppl.map(p => W.facing(p, lay)), f2 = ppl.map(p => W.facing(p, lay));
      check('同一时段里朝向不来回变', JSON.stringify(f1) === JSON.stringify(f2));
      check('在家的人朝向只会是四个斜向之一，不在布局里的是空', ppl.every((p, i) => (lay.some(l => l.id === p.id) ? ['sw', 'se', 'ne', 'nw'].includes(f1[i]) : f1[i] === '')));
      check('格子方向换算', W.dirOf(1, 0) === 'se' && W.dirOf(-1, 0) === 'nw' && W.dirOf(0, 1) === 'sw' && W.dirOf(0, -1) === 'ne');
      const pet = G.activePeople().find(p => !G.isHuman(p));
      if (pet) check('宠物不走朝向规则', W.facing(pet, lay) === '');
    }
    /* 舒适度修正：商品的 fx 由 G.shopFx 按人汇总，后台计算只读这一处 */
    const kid = G.activePeople().find(p => G.stage(p) === 'infant' || G.stage(p) === 'toddler'), ad = G.activePeople().find(p => G.stage(p) === 'adult');
    G.world.owned = {};
    if (ad) {
      const base = G.shopFx(ad);
      check('什么都没买，修正是单位值', base.rest_sleep === 1 && base.mood === 0 && Object.keys(base.rate).length === 0);
      G.world.owned = { books: true, fruit: true, decor1: true };
      const f = G.shopFx(ad);
      check('床和装饰不再改睡觉恢复', f.rest_sleep === 1);
      check('书架只对玩耍起作用，果盘只对饥饿起作用', f.rate.play === 0.85 && f.rate.hunger === 0.9 && f.rate.mobility === undefined);
      check('心情目标加成只来自书架 0.01，装饰没有', Math.abs(f.mood - 0.01) < 1e-9);
    }
    if (kid) { G.world.owned = { toy: true, books: true }; const k = G.shopFx(kid); check('玩具只对婴幼儿，书架不对婴幼儿', k.rate.play === 0.75 && k.mood === 0); }
    G.world.owned = {}; G.world.money = 200;
  }
  {
    /* 买菜：花 40 去超市，二十五分钟后回来，带回八份食材；做饭用掉一份，桌上摆出饭菜，全家更饱 */
    const W = CY.world;
    for (const x of G.people) x.person.active = false;
    const dId = await G.createPerson({ arch: 'dad', name: '买菜爸' }), mId = await G.createPerson({ arch: 'mom', name: '吃饭妈' });
    await G.load(); for (const x of G.people) x.person.active = [dId, mId].includes(x.id);
    G.setProtagonist(dId); G.world.money = 100; G.world.groceries = 0; delete G.world.trip;
    const dad = G.get(dId), mom = G.get(mId);
    check('钱够就有去买菜', !!G.actionsOf(dad).groceries);
    G.world.money = 10; check('钱不够没有去买菜', !G.actionsOf(dad).groceries); G.world.money = 100;
    G.applyAction(dId, 'groceries');
    check('去买菜花四十，人在超市路上', G.world.money === 60 && !!G.world.trip && !G.actionsOf(dad).groceries && W.PLACES.market.rooms.aisle);
    G.world.game_minutes += 10; G.tripTick(); check('没到时间还在路上', !!G.world.trip && G.groceries() === 0);
    G.world.game_minutes += 20; G.tripTick(); check('到时间回来，带回八份食材', !G.world.trip && G.groceries() === 8);
    mom.state.needs.hunger = 0.8; dad.state.needs.hunger = 0.8; G.world.fed_until = 0;
    G.applyAction(dId, 'cook');
    check('做饭用掉一份食材，桌上摆出饭菜', G.groceries() === 7 && G.tableFood());
    check('有食材时家人吃得更饱', mom.state.needs.hunger < 0.8 - 0.8 * 0 - 0.1, String(mom.state.needs.hunger));
    G.world.groceries = 0; G.world.fed_until = 0; mom.state.needs.hunger = 0.8; G.applyAction(dId, 'cook');
    check('没有食材照样能做饭，只是没有加成', G.groceries() === 0 && !G.tableFood());
    G.world.money = 200;
  }
  {
    const W = CY.world;
    for (const x of G.people) x.person.active = false;
    const dadId = await G.createPerson({ arch: 'dad', name: 'd' }), gpId = await G.createPerson({ arch: 'paternal_grandpa', name: 'g' }), kidId = await G.createPerson({ arch: 'daughter', name: 'k' });
    await G.load(); for (const x of G.people) x.person.active = [dadId, gpId, kidId].includes(x.id);
    G.setProtagonist(dadId); W.enforce = true; W.moveTo('home', 'study'); W.escort = false;
    const gp = G.get(gpId);
    G.clearFlag(gp, 'outing'); G.act[gpId] = 'awake'; gp.state.needs.mobility = 0.9;
    G.applyAction(gpId, 'street');
    check('送祖父去街上，主角也去', !!G.flag(gp, 'outing') && W.player().place === 'street', JSON.stringify(W.player()));
    W.lastActive = Date.now() - 10000; W.tick();
    check('他们还在外面时主角不会先回家', W.player().place === 'street');
    for (const x of G.people) G.clearFlag(x, 'outing');
    W.tick();
    check('人都回来了主角也回家', W.player().place === 'home');
    W.enforce = false; for (const x of G.people) x.person.active = true;
  }
  {
    for (const x of G.people) x.person.active = false;
    const dId = await G.createPerson({ arch: 'dad', name: 'd' }), gId = await G.createPerson({ arch: 'paternal_grandpa', name: 'g', conditions: ['diabetes'] });
    await G.load(); for (const x of G.people) x.person.active = [dId, gId].includes(x.id);
    G.setProtagonist(dId);
    const mine = Object.values(G.actionsOf(G.get(dId))).map(a => a.id), theirs = Object.values(G.actionsOf(G.get(gId))).map(a => a.id);
    check('点自己只有自己做的动作，没有又倒水又倒水喝', mine.includes('drink') && !mine.includes('water') && mine.includes('cook') && !mine.includes('meal') && !mine.includes('medicine') && !mine.includes('bath'), mine.join());
    check('点别人只有照顾他的动作，没有自己做的', theirs.includes('water') && theirs.includes('meal') && !theirs.includes('drink') && !theirs.includes('cook') && !theirs.includes('selfmed'), theirs.join());
    G.setProtagonist(gId);
    const mine2 = Object.values(G.actionsOf(G.get(gId))).map(a => a.id);
    check('老人做主角，吃药只有自己吃药一个', mine2.includes('selfmed') && !mine2.includes('medicine'), mine2.join());
    G.setProtagonist(dId); for (const x of G.people) x.person.active = true;
  }
  {
    for (const x of G.people) x.person.active = false;
    const dId = await G.createPerson({ arch: 'dad', name: 'd' }), mId = await G.createPerson({ arch: 'mom', name: 'm' }), gId = await G.createPerson({ arch: 'paternal_grandpa', name: 'g' }), bId = await G.createPerson({ arch: 'baby', name: 'b' });
    await G.load(); const ids = [dId, mId, gId, bId]; for (const x of G.people) x.person.active = ids.includes(x.id);
    G.setProtagonist(dId); for (const id of ids) { G.act[id] = 'awake'; for (const k in G.get(id).state.needs) G.get(id).state.needs[k] = 0.2; }
    const mom = G.get(mId), gp = G.get(gId), baby = G.get(bId);
    mom.state.needs.hunger = 0.9; gp.state.needs.hunger = 0.9; baby.state.needs.hunger = 0.9;
    G.applyAction(mId, 'meal');
    check('做饭给人吃，在家吃得了饭的人都吃上，婴儿不算', gp.state.needs.hunger < 0.5 && mom.state.needs.hunger < 0.5 && baby.state.needs.hunger === 0.9, gp.state.needs.hunger + ' ' + baby.state.needs.hunger);
    for (const id of ids) G.get(id).state.mood = 0.8;
    /* 负荷：自己 0.3，妈妈 0.1，爷爷 0.4，宝宝 1，各乘 1 减心情；容量 1 加妈妈这个助力 0.3 */
    check('效率由负荷决定', Math.abs(G.burden() - 0.36) < 1e-9 && Math.abs(G.capacity() - 1.3) < 1e-9 && Math.abs(G.efficiency() - (0.4 + 0.6 * (1 - 0.36 / 1.3))) < 1e-9, G.burden() + ' ' + G.capacity() + ' ' + G.efficiency());
    check('家人满意度加成线性叠加，花草不算', Math.abs(G.householdBonus() - 1.24) < 1e-9, G.householdBonus());
    const before = G.efficiency(), bonus0 = G.householdBonus();
    for (let i = 0; i < 4; i++) { const fId = await G.createPerson({ arch: 'flower', name: 'f' + i }); await G.load(); for (const x of G.people) x.person.active = ids.includes(x.id) || x.person.kind === 'plant'; G.setProtagonist(dId); G.get(fId).state.mood = 0.9; }
    check('堆花草堆不出效率和加成', G.efficiency() <= before + 1e-9 && Math.abs(G.householdBonus() - bonus0) < 1e-9, G.efficiency() + ' ' + before);
    for (const x of G.people) x.person.active = ids.includes(x.id);
    for (const id of ids) G.get(id).state.mood = 0.1;
    check('负荷太高按四成算', Math.abs(G.efficiency() - 0.4) < 1e-9, G.efficiency());
    for (const x of G.people) x.person.active = true;
  }
  {
    for (const x of G.people) x.person.active = false;
    const dId = await G.createPerson({ arch: 'dad', name: 'd' }), mId = await G.createPerson({ arch: 'mom', name: 'm' }), gId = await G.createPerson({ arch: 'paternal_grandpa', name: 'g' });
    await G.load(); const ids = [dId, mId, gId]; for (const x of G.people) x.person.active = ids.includes(x.id);
    G.setProtagonist(dId); for (const id of ids) { G.act[id] = 'awake'; for (const k in G.get(id).state.needs) G.get(id).state.needs[k] = 0.2; }
    const dad = G.get(dId), mom = G.get(mId), gp = G.get(gId);
    dad.state.needs.hunger = 0.9; mom.state.needs.hunger = 0.9; gp.state.needs.hunger = 0.9;
    G.applyAction(dId, 'cook');
    check('自己做饭也是全家的饭', mom.state.needs.hunger < 0.5 && gp.state.needs.hunger < 0.5 && dad.state.needs.hunger < 0.5);
    mom.state.needs.thirst = 0.9; gp.state.needs.thirst = 0.9; dad.state.needs.thirst = 0.9; G.applyAction(dId, 'drink');
    check('喝水每个人各管各的', dad.state.needs.thirst < 0.5 && mom.state.needs.thirst === 0.9 && gp.state.needs.thirst === 0.9);
    for (const x of G.people) x.person.active = true;
  }
  {
    const W = CY.world;
    for (const x of G.people) x.person.active = false;
    const dId = await G.createPerson({ arch: 'dad', name: 'd' }), gId = await G.createPerson({ arch: 'paternal_grandpa', name: 'g' });
    await G.load(); for (const x of G.people) x.person.active = [dId, gId].includes(x.id);
    G.setProtagonist(dId); W.enforce = true; W.moveTo('home', 'study'); G.setClock(15 * 60);
    const dad = G.get(dId); dad.state.needs.rest = 0.9;
    G.applyAction(dId, 'sleep');
    check('去睡觉：主角躺到自己的床上，是睡着的', W.player().room === 'bedroom' && G.activityOf(dad) === 'sleeping' && W.player().bed === true, JSON.stringify(W.player()));
    dad.state.needs.rest = 0.02;
    check('睡到不累就醒来，没有固定时长', G.activityOf(dad) === 'awake');
    G.applyAction(dId, 'drink');
    check('倒水喝要去厨房', W.player().room === 'kitchen');
    G.setClock(23 * 60); W.moveTo('home', 'bedroom'); W.lastActive = Date.now() - 10000;
    check('夜里在卧室闲着，主角也躺下睡', G.activityOf(dad) === 'sleeping');
    W.lastActive = Date.now();
    check('一动手就醒', G.activityOf(dad) === 'awake');
    W.enforce = false; for (const x of G.people) x.person.active = true;
  }
  console.log(fails ? `失败 ${fails} 项` : '全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
