/* 内容数据的第二部分：推荐组合（角色原型在 cards 文件夹里，一类一个 YAML），婴幼儿、少年、更多宠物和花草的声线，以及补充的说话库、问答库和提醒库。 */
(function (CY) {
  const C = CY.content;

  /* 年龄决定阶段：不满一岁是婴儿，一到三岁是幼儿，四到十二岁是儿童，十三到十七岁是少年，十八到六十四岁是成人，六十五岁起是老人 */
  C.stageOf = years => (years < 1 ? 'infant' : years < 4 ? 'toddler' : years < 13 ? 'child' : years < 18 ? 'teen' : years < 65 ? 'adult' : 'elder');
  C.STAGE_VOICE = { infant: 'infant', toddler: 'toddler', child: 'child', teen: 'teen' };
  C.AGE_OF_STAGE = { infant: 0.5, toddler: 2, child: 7, teen: 15, adult: 35, elder: 75 };

  /* ---------- 声线 ---------- */
  const V = C.voices;
  V.infant = {
    request: {
      thirst: ['{ta}张着嘴，哼哼唧唧。'], hunger: ['{ta}哇地哭了起来，小手在找吃的。', '{ta}一边哭一边嘬着小拳头。'], rest: ['{ta}揉着眼睛，哼哼唧唧。'],
      company: ['{ta}伸着小手，等你抱。'], play: ['{ta}盯着你，咿咿呀呀。'], diaper: ['{ta}扭来扭去，哭了起来。'], fever: ['{ta}小脸红红的，哭声很弱。'],
    },
    thanks: { feed: ['咕嘟咕嘟，{ta}吃得很香。'], diaper: ['{ta}舒服地哼了一声。'], soothe: ['{ta}慢慢闭上了眼睛。'], hug: ['{ta}把脸埋进你的怀里。'], pet: ['{ta}咯咯笑了。'], play: ['{ta}咯咯笑个不停。'], default: ['{ta}安静下来了。'] },
    glance: ['{ta}躺在小床上，睁着眼睛看你。', '{ta}挥了挥小手。'],
    cares_back: ['{ta}抓住了你的一根手指，不松开。', '{ta}冲你笑了，露出没长牙的牙床。'],
    reveal: '{ta}看着你，伸出小手，碰了碰你的脸。',
    cry: ['哇——哇——', '呜哇——', '哇——{ta}哭得停不下来。'],
  };
  V.toddler = {
    request: {
      thirst: ['{title}，水水。', '喝！'], hunger: ['饿饿！', '{title}，饭饭。'], rest: ['困困……', '{title}，抱抱，睡觉。'], company: ['{title}！{title}！', '看我看我。'],
      play: ['玩！玩！', '{title}，一起玩。'], diaper: ['{title}，湿湿。', '{ta}拉了拉裤子，皱起了脸。'], fever: ['{title}，热热，难受。'], breath: ['{ta}咳了几声，喘得有点急。'],
    },
    thanks: { feed: ['好吃！还要！'], diaper: ['舒服了。'], soothe: ['{ta}慢慢闭上了眼睛。'], hug: ['抱抱，不放。'], pet: ['嘻嘻。'], play: ['再来再来！'], water: ['咕嘟咕嘟。'], default: ['嗯！'] },
    glance: ['{ta}抱着玩具，站在门边看你。', '{ta}摇摇晃晃地朝你走了两步，又停下来。', '{ta}冲你挥了挥手。'],
    cares_back: ['{ta}摇摇晃晃跑过来，往你手里塞了一块饼干。', '{ta}拍了拍你的腿，说：不哭。你其实没有哭。', '{ta}把玩具小熊放在你的椅子上。'],
    reveal: '{ta}抱着你的腿，仰着头说：{title}，好。',
    cry: ['哇——{title}——', '呜呜呜——不要不要——', '哇——{ta}哭得小脸通红。'],
  };
  V.teen = {
    request: {
      thirst: ['有水吗。', '渴死了。'], hunger: ['饿了，有吃的没？', '晚饭吃什么？'], rest: ['好困，别吵我。'], company: ['……你在忙吗？', '我有点事想说。'],
      homework: ['这题我不会。', '作业好多，烦死了。'], fever: ['我好像发烧了。'],
    },
    thanks: { meal: ['还行吧。……谢谢。'], homework: ['哦，原来是这样。'], chat: ['……其实也没什么，说出来好点了。'], pet: ['干嘛。'], default: ['嗯。'] },
    glance: ['{ta}戴着耳机，从门口晃过去，又晃了回来。', '{ta}靠在门框上，欲言又止。'],
    cares_back: ['{ta}把你的杯子续上了水，装作什么也没做。', '{ta}说：你别太累。然后很快回房间了。'],
    reveal: '{ta}说：其实我知道你很辛苦。',
  };
  const animal = obj => obj;
  V.rabbit = animal({
    request: { thirst: ['{ta}舔着空的水瓶。'], hunger: ['{ta}蹲在食盆旁边，鼻子一动一动。'], company: ['{ta}蹭到你脚边，轻轻跺了跺脚。'], play: ['{ta}在笼子里转圈，想出来跳一跳。'], clean: ['笼子有点味道了。'] },
    thanks: { water: ['{ta}喝了好几口。'], feed: ['{ta}嚼得咔嚓咔嚓。'], play: ['{ta}蹦了三下，转了个圈。'], pet: ['{ta}眯起眼睛，耳朵放平了。'], clean: ['{ta}满意地嗅了嗅。'], default: ['{ta}动了动鼻子。'] },
    glance: ['{ta}竖起耳朵，看着你。'], cares_back: ['{ta}安静地趴在你脚边。', '{ta}舔了舔你的手。'], reveal: '{ta}整个晚上都趴在你脚边，你一动，耳朵就跟着转。',
  });
  V.hamster = animal({
    request: { thirst: ['{ta}扒着水瓶，没有水了。'], hunger: ['{ta}在空空的食盆里翻来翻去。'], play: ['{ta}在跑轮上看着你。'], clean: ['{ta}的窝需要换垫料了。'] },
    thanks: { water: ['{ta}舔得飞快。'], feed: ['{ta}塞满了两颊。'], play: ['{ta}在轮子上跑得飞快。'], pet: ['{ta}在你手心里缩成一团。'], clean: ['{ta}钻进新窝里，不出来了。'], default: ['{ta}吱了一声。'] },
    glance: ['{ta}在轮子上停了一下，看了你一眼。'], cares_back: ['{ta}把一粒瓜子推到你这边。'], reveal: '{ta}白天睡觉，夜里一直跑，像是在替你守着夜。',
  });
  V.bird = animal({
    request: { thirst: ['{ta}站在水杯边，叫了两声。'], hunger: ['{ta}对着食槽啾啾叫。'], play: ['{ta}在笼子里来回蹦，想出来飞。'], clean: ['笼底该清理了。'] },
    thanks: { water: ['{ta}啄了几口水。'], feed: ['{ta}啄得很认真。'], play: ['{ta}绕着房间飞了一圈，落在你肩上。'], pet: ['{ta}歪着头，蹭了蹭你的手指。'], clean: ['{ta}抖了抖羽毛。'], default: ['{ta}啾了一声。'] },
    glance: ['{ta}歪着头，看了你一眼。'], cares_back: ['{ta}落在你肩头，小声哼了一段调子。'], reveal: '{ta}总在你不说话的时候唱起来，像是怕你一个人。',
  });
  V.fish = animal({
    request: { hunger: ['{ta}浮到水面，张着嘴。'], clean: ['缸里的水有点浑了。'], oxygen: ['{ta}靠在水面上喘气。'] },
    thanks: { feed: ['{ta}迅速游过来，一口吞下。'], clean: ['水清了，{ta}欢快地游了一圈。'], default: ['{ta}吐了个泡泡。'] },
    glance: ['{ta}贴着玻璃，看着你。'], cares_back: ['{ta}跟着你的手指游来游去。'], reveal: '{ta}只是安静地游着，可你每次靠近，它都会游过来。',
  });
  V.turtle = animal({
    request: { thirst: ['{ta}的水位有点低了。'], hunger: ['{ta}伸长脖子，盯着食盆。'], warmth: ['{ta}趴在角落，一动不动。'], clean: ['水有点脏了。'] },
    thanks: { water: ['{ta}慢慢游了一圈。'], feed: ['{ta}一点一点地吃。'], warm: ['{ta}舒展开四肢，晒起了灯。'], pet: ['{ta}缩了缩脖子，又慢慢伸了出来。'], clean: ['{ta}满意地划了划水。'], default: ['{ta}看了你一眼。'] },
    glance: ['{ta}慢慢爬上石头，看着你。'], cares_back: ['{ta}慢吞吞地爬到离你最近的地方。'], reveal: '{ta}什么都不说，只是慢慢地一直在。',
  });
  V.plant = {
    request: { water: ['叶子有点蔫了。', '土已经干了。'], sun: ['{ta}朝着窗户的方向弯了过去。'], fertilize: ['新叶长得有点慢。'], prune: ['有几片叶子黄了。'] },
    thanks: { water: ['叶子慢慢舒展开了。'], sun: ['{ta}像是松了一口气。'], fertilize: ['{ta}看起来精神多了。'], prune: ['{ta}清爽了不少。'], pet: ['叶子轻轻晃了晃。'], default: ['叶子轻轻晃了晃。'] },
    glance: ['阳光照在叶子上，影子慢慢地动。', '{ta}长出了一片新叶。'], cares_back: ['{ta}开出了一朵小小的花，朝着你的方向。', '{ta}的新叶卷成了一个小小的心形。'], reveal: '你每天路过，{ta}就朝着你的方向长。',
  };

  /* ---------- 说话库补充 ---------- */
  const S = (v, list) => list.forEach((t, i) => C.sayings.push({ id: v + String(i + 1).padStart(2, '0'), voice: v, text: t }));
  S('infant', ['{ta}咯咯地笑了。', '{ta}抓住了你的手指。', '{ta}冲你吐了个泡泡。', '{ta}在你怀里睡着了。']);
  S('toddler', ['抱抱！', '{title}，看！', '不要不要！', '再来一次！', '{title}，饭饭。']);
  S('teen', ['知道了知道了。', '你别管我。', '……谢谢。', '我自己能行。', '有点事想跟你说。']);
  S('rabbit', ['{ta}蹦了三下。', '{ta}耳朵动了动。', '{ta}在你脚边打了个滚。']);
  S('hamster', ['{ta}在轮子上跑了一整夜。', '{ta}塞得两颊鼓鼓的。']);
  S('bird', ['{ta}啾啾地唱了一段。', '{ta}落在你的肩上。']);
  S('fish', ['{ta}吐了个泡泡。', '{ta}跟着你的手指游。']);
  S('turtle', ['{ta}慢慢地伸出头来。', '{ta}趴在石头上晒着。']);
  S('plant', ['{ta}朝着窗户的方向长。', '{ta}长出了一片新叶。']);

  /* ---------- 现实提醒补充 ---------- */
  C.nudges.push(
    { id: 'n08', kind: 'connect', text: '你有多久没约朋友吃饭了？' },
    { id: 'n09', kind: 'connect', text: '给一个很久没联系的人发一句：最近好吗。' },
    { id: 'n10', kind: 'connect', text: '今晚和家里人一起吃一顿饭，不看手机。' },
    { id: 'n11', kind: 'self', text: '你有一会儿没动了，伸个懒腰。' },
    { id: 'n12', kind: 'self', text: '看看远处，让眼睛歇一会儿。' },
  );

  /* ---------- 问答库补充 ---------- */
  const Q = (id, cond, say, answers, extra) => C.asks.push(Object.assign({ id, say, answers }, cond, extra || {}));
  Q('ask_t01', { voice: ['toddler'] }, '{title}，那是什么？', ['那是小鸟。', '你说那是什么？', '我们一起去看看。']);
  Q('ask_t02', { voice: ['toddler'] }, '{title}，我要这个。', ['好，给你。', '先说请。', '这个不行，那个可以。']);
  Q('ask_t03', { voice: ['toddler'] }, '{title}，你不要走。', ['我不走，就在这儿。', '我去去就回来。', '你陪我一起去。']);
  Q('ask_t04', { voice: ['toddler'] }, '{title}，我会了！', ['真棒！再来一次。', '让我看看。', '你自己做的？']);
  Q('ask_g01', { voice: ['teen'] }, '你小时候也这样吗？', ['差不多，我也烦过。', '我那时候更不听话。', '你想听我讲讲吗？']);
  Q('ask_g02', { voice: ['teen'] }, '我不想去上学。', ['发生什么事了？', '今天先歇一天，明天聊。', '我陪你去。'], { sensitive: true });
  Q('ask_g03', { voice: ['teen'] }, '我以后做什么好？', ['你现在喜欢什么？', '不着急，慢慢想。', '我年轻时也不知道。']);
  Q('ask_g04', { voice: ['teen'] }, '你累不累？', ['有点，不过没事。', '你看出来了。', '看到你就不累了。']);
  Q('ask_e09', { voice: ['elder'] }, '今天天气怎么样？', ['挺好的，出去走走吧。', '有点冷，多穿点。', '你自己去看看？']);
  Q('ask_e10', { voice: ['elder'] }, '你结婚的时候，我给你包的红包还在吗？', ['还在，我收着呢。', '让我找找看。', '谢谢你，一直记着。']);
  Q('ask_p06', { voice: ['parent'] }, '你小时候最怕什么，还记得吗？', ['怕黑。', '怕打雷。', '不记得了，你说说。']);
  Q('ask_s07', { voice: ['sibling'] }, '爸妈那边最近怎么样？', ['挺好的，你呢？', '有点操心，一起商量？', '这周我打电话问问。']);

  /* 开局的七个典型叙事。away 写了上班或上学的人白天离家，到点回来，主角只能是留在家里的人 */
  C.presets.push(
    { id: 'couple_baby', members: [{ arch: 'dad', name: '爸爸' }, { arch: 'mom', name: '妈妈' }, { arch: 'baby', name: '宝宝' }] },
    { id: 'dual_work', members: [{ arch: 'dad', name: '爸爸', age: 36, away: 'work' }, { arch: 'mom', name: '妈妈', age: 34, away: 'work' }, { arch: 'paternal_grandpa', name: '爷爷', conditions: ['hypertension'] }, { arch: 'paternal_grandma', name: '奶奶', conditions: ['arthritis'] }, { arch: 'toddler', name: '宝宝' }] },
    { id: 'single_parent', members: [{ arch: 'mom', name: '妈妈', age: 36, away: 'work' }, { arch: 'maternal_grandma', name: '外婆', conditions: ['arthritis'] }, { arch: 'son', name: '儿子', age: 8, away: 'school' }] },
    { id: 'summer', members: [{ arch: 'dad', name: '爸爸', age: 40, away: 'work' }, { arch: 'mom', name: '妈妈', age: 38, away: 'work' }, { arch: 'teen', name: '哥哥', age: 15 }, { arch: 'toddler', name: '弟弟' }] },
    { id: 'threegen', members: [{ arch: 'paternal_grandpa', name: '爷爷', conditions: ['diabetes'] }, { arch: 'paternal_grandma', name: '奶奶', conditions: ['arthritis'] }, { arch: 'dad', name: '爸爸' }, { arch: 'mom', name: '妈妈' }, { arch: 'baby', name: '宝宝' }] },
    { id: 'elder_care', members: [{ arch: 'husband', name: '丈夫' }, { arch: 'wife', name: '妻子' }, { arch: 'maternal_grandpa', name: '外公', conditions: ['diabetes', 'hypertension'] }] },
    { id: 'solo_pets', members: [{ arch: 'young_woman', name: '我', age: 28, lead: true }, { arch: 'cat', name: '团子' }, { arch: 'succulent', name: '多肉' }, { arch: 'orchid', name: '兰兰' }] },
  );

  V.partner = {
    request: {
      thirst: ['顺便帮我倒杯水？', '有点渴。'], hunger: ['晚饭想吃点什么？', '我有点饿了。'], rest: ['我有点累，想靠一会儿。'], company: ['你今天都没怎么跟我说话。', '过来坐坐？'],
      hygiene: ['我想先去洗个澡。'], medicine: ['药是不是该吃了？', '你帮我看一下，药吃过没有。'],
    },
    thanks: { water: ['谢谢。'], meal: ['好吃，辛苦你了。'], chat: ['和你说说话，心里舒服多了。'], pet: ['嗯，这样挺好。'], default: ['谢谢你。'] },
    glance: ['{ta}隔着房间看了你一眼，笑了笑。', '{ta}走过你身边，轻轻碰了碰你的肩。', '{ta}端着两杯茶，在你旁边坐下了。'],
    cares_back: ['{ta}把你那份饭热好了，放在你手边。', '{ta}替你关了灯，说：早点睡。', '{ta}把你落下的外套叠好，放在椅背上。'],
    reveal: '{ta}说：你一个人撑着太久了，今天换我来。',
  };
  S('partner', ['今天过得怎么样？', '你先吃，我不饿。', '别太累了。', '晚上想吃什么？', '我在呢。', '周末我们出去走走吧。']);
  Q('ask_m01', { voice: ['partner'] }, '今天过得怎么样？', ['还不错，你呢？', '有点累，抱一下。', '先吃饭，慢慢说。']);
  Q('ask_m02', { voice: ['partner'] }, '周末想去哪儿？', ['去公园走走。', '在家睡一天。', '你定，我陪你。']);
  Q('ask_m03', { voice: ['partner'] }, '还记得我们第一次见面吗？', ['记得，你迟到了。', '记得一点点。', '你再讲讲那天。']);
  Q('ask_m04', { voice: ['partner'] }, '你最近是不是心里有事？', ['有一点，晚点跟你说。', '没有，只是累。', '正想跟你聊聊。']);
  C.sayings.push({ id: 'elder09', voice: 'elder', text: '隔壁老张今天又下棋去了。' }, { id: 'elder10', voice: 'elder', text: '年轻人，吃了没？' });

  /* 补充：新增需求和动作用到的台词 */
  Object.assign(V.elder.request, { hygiene: ['我想洗个澡。'], mobility: ['腿有点僵，想出去走一走。'] });
  Object.assign(V.elder.thanks, { meal: ['好吃，你做的饭。'], walk: ['出来走走，舒服多了。'], bath: ['洗得真干净。'], chat: ['陪我说说话，好。'] });
  Object.assign(V.parent.request, { hygiene: ['我先去洗个澡。'] });
  Object.assign(V.parent.thanks, { meal: ['挺香的，你不用特意做。'], chat: ['跟你说说话，心里敞亮些。'] });
  Object.assign(V.aunt.request, { hygiene: ['我去洗把脸，歇歇。'] });
  Object.assign(V.aunt.thanks, { meal: ['哎呀，真好吃。'], chat: ['聊聊真痛快。'] });
  Object.assign(V.sibling.request, { hygiene: ['我去冲个澡。'] });
  Object.assign(V.sibling.thanks, { meal: ['行，这顿算我欠你的。'], chat: ['哈，聊完好多了。'] });
  Object.assign(V.child.request, { hygiene: ['{title}，我要洗澡澡。'], homework: ['这题我不会。', '作业好多。'] });
  Object.assign(V.child.thanks, { bath: ['哗啦哗啦。'], read: ['再讲一遍！'], meal: ['好吃！'], homework: ['哦，我懂了！'] });
  Object.assign(V.toddler.request, { hygiene: ['{title}，洗澡，澡澡！'] });
  Object.assign(V.toddler.thanks, { bath: ['哗啦哗啦！'], read: ['再来！再来！'] });
  Object.assign(V.infant.request, { hygiene: ['{ta}身上黏黏的，该洗澡了。'] });
  Object.assign(V.infant.thanks, { bath: ['{ta}开心地拍着水花。'] });
  Object.assign(V.teen.request, { hygiene: ['我去洗个澡。'] });
  Object.assign(V.teen.thanks, { game: ['行，这把挺好玩。'] });
  Object.assign(V.cat.thanks, { groom: ['{ta}伸了个懒腰，呼噜呼噜。'], clean: ['{ta}满意地嗅了嗅。'] });
  Object.assign(V.dog.thanks, { groom: ['{ta}整个后半身都在摇。'], walk: ['{ta}神气地走在你旁边。'] });
  V.partner.request.mobility = ['我腰有点酸，想动一动。'];

  /* ---------- 性格特征，界面里选 ---------- */
  C.TRAITS = ['clingy', 'independent', 'nightowl', 'earlybird', 'picky', 'sickly', 'sturdy', 'grumpy', 'cheerful', 'thirsty', 'hearty', 'shy', 'chatty', 'curious', 'stubborn', 'gentle', 'playful', 'anxious', 'proud', 'sentimental'];

  /* ---------- 内容包：按语言存放，缺的按回退顺序补 ----------
     台词、说话库、问答库、提醒库、疾病文字都是内容，一个语言一份。条目的编号在各语言里相同，
     所以挑过的说话库编号和回答过的问题编号换语言后依然有意义。 */
  C.packs = { 'zh-CN': { voices: V, sayings: C.sayings, asks: C.asks, nudges: C.nudges, conds: {} } };
  const CHAIN = { 'zh-CN': ['zh-CN'], 'zh-TW': ['zh-TW', 'zh-CN'] };
  const deep = (a, b) => {
    if (Array.isArray(b) || typeof b !== 'object' || b === null) return b;
    const o = Object.assign({}, a && typeof a === 'object' && !Array.isArray(a) ? a : {});
    for (const k in b) o[k] = deep(o[k], b[k]);
    return o;
  };
  const byId = (lists) => {
    const m = new Map();
    for (const list of lists) for (const it of list || []) m.set(it.id, it);
    return [...m.values()];
  };
  C.packFor = lang => {
    const chain = (CHAIN[lang] || [lang, 'en', 'zh-CN']).filter(l => C.packs[l]), rev = chain.slice().reverse();
    const out = { voices: {}, conds: {}, traits: {} };
    for (const l of rev) { for (const v in C.packs[l].voices || {}) out.voices[v] = deep(out.voices[v], C.packs[l].voices[v]); for (const tr in C.packs[l].traits || {}) out.traits[tr] = deep(out.traits[tr], C.packs[l].traits[tr]); for (const c in C.packs[l].conds || {}) out.conds[c] = deep(out.conds[c], C.packs[l].conds[c]); }
    for (const k of ['sayings', 'asks', 'nudges']) out[k] = byId(rev.map(l => C.packs[l][k]));
    return out;
  };
  C.registerPack = (lang, pack) => { C.packs[lang] = pack; };
  /* 用简体中文内容包做结构底板，按条目编号换上译文。条件字段，例如谁会问这个问题，沿用底板，所以译文只写文字 */
  C.buildPack = ({ voices, sayings, asks, nudges, conds }) => {
    const base = C.packs['zh-CN'];
    return {
      voices, conds: conds || {},
      sayings: Object.keys(sayings || {}).map(id => Object.assign({ voice: id.replace(/\d+$/, '') }, base.sayings.find(b => b.id === id), { id, text: sayings[id] })),
      asks: Object.keys(asks || {}).map(id => Object.assign({}, base.asks.find(b => b.id === id), { id, say: asks[id][0], answers: asks[id][1] })),
      nudges: Object.keys(nudges || {}).map(id => Object.assign({}, base.nudges.find(b => b.id === id), { id, text: nudges[id] })),
    };
  };
})(globalThis.CY = globalThis.CY || {});
