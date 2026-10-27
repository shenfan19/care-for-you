/* 内容数据的第二部分：按年龄和种类分组的角色原型，推荐组合，婴幼儿、少年、更多宠物和花草的声线，以及补充的说话库、问答库和提醒库。 */
(function (CY) {
  const C = CY.content;

  /* 年龄决定阶段：不满一岁是婴儿，一到三岁是幼儿，四到十二岁是儿童，十三到十七岁是少年，十八到六十四岁是成人，六十五岁起是老人 */
  C.stageOf = years => (years < 1 ? 'infant' : years < 4 ? 'toddler' : years < 13 ? 'child' : years < 18 ? 'teen' : years < 65 ? 'adult' : 'elder');
  C.STAGE_VOICE = { infant: 'infant', toddler: 'toddler', child: 'child', teen: 'teen' };
  C.AGE_OF_STAGE = { infant: 0.5, toddler: 2, child: 7, teen: 15, adult: 35, elder: 75 };

  const H = (id, role, age, voice, pronoun, look) => ({ id, group: 'family', role, species: 'human', age, voice, pronoun, look });
  const P = (id, group, role, species, voice, look, pronoun) => ({ id, group, role, species, age: 3, voice, pronoun: pronoun || '它', look });
  C.archetypes.push(
    H('grandpa', '爷爷', 75, 'elder', '他', { skin: 1, hair_style: 'bald', hair_color: 'white', glasses: 'round', beard: false, cloth: '#7f9580' }),
    H('grandma', '奶奶', 72, 'elder', '她', { skin: 1, hair_style: 'bun', hair_color: 'gray', glasses: 'none', beard: false, cloth: '#b58aa5' }),
    H('waigong', '外公', 78, 'elder', '他', { skin: 1, hair_style: 'short', hair_color: 'gray', glasses: 'square', beard: false, cloth: '#7d8fa8' }),
    H('waipo', '外婆', 76, 'elder', '她', { skin: 1, hair_style: 'bob', hair_color: 'gray', glasses: 'none', beard: false, cloth: '#c28a6e' }),
    H('dad', '爸爸', 45, 'parent', '他', { skin: 1, hair_style: 'short', hair_color: 'black', glasses: 'square', beard: false, cloth: '#6f86a0' }),
    H('mom', '妈妈', 42, 'parent', '她', { skin: 1, hair_style: 'bob', hair_color: 'brown', glasses: 'none', beard: false, cloth: '#c07a6b' }),
    H('aunt', '姑姑', 50, 'aunt', '她', { skin: 1, hair_style: 'curly', hair_color: 'brown', glasses: 'none', beard: false, cloth: '#d4a24c' }),
    H('uncle', '舅舅', 48, 'aunt', '他', { skin: 2, hair_style: 'short', hair_color: 'black', glasses: 'none', beard: true, cloth: '#5f8a7a' }),
    H('brother', '哥哥', 28, 'sibling', '他', { skin: 1, hair_style: 'short', hair_color: 'black', glasses: 'none', beard: false, cloth: '#4f6d8f' }),
    H('sister', '姐姐', 26, 'sibling', '她', { skin: 1, hair_style: 'ponytail', hair_color: 'black', glasses: 'none', beard: false, cloth: '#b5677a' }),
    H('friend', '朋友', 30, 'sibling', '她', { skin: 1, hair_style: 'long', hair_color: 'auburn', glasses: 'none', beard: false, cloth: '#7aa5b8' }),
    H('baby', '宝宝', 0.5, 'infant', '她', { skin: 0, hair_style: 'bald', hair_color: 'brown', glasses: 'none', beard: false, cloth: '#f2c9c4' }),
    H('toddler', '幼儿', 2, 'toddler', '她', { skin: 0, hair_style: 'bun', hair_color: 'brown', glasses: 'none', beard: false, cloth: '#e7a6a1' }),
    H('daughter', '女儿', 7, 'child', '她', { skin: 0, hair_style: 'ponytail', hair_color: 'brown', glasses: 'none', beard: false, cloth: '#e7a6a1' }),
    H('son', '儿子', 7, 'child', '他', { skin: 0, hair_style: 'short', hair_color: 'black', glasses: 'none', beard: false, cloth: '#8fbf9f' }),
    H('nephew', '侄子', 9, 'child', '他', { skin: 1, hair_style: 'curly', hair_color: 'black', glasses: 'round', beard: false, cloth: '#e0b062' }),
    H('teen', '少年', 15, 'teen', '他', { skin: 1, hair_style: 'short', hair_color: 'brown', glasses: 'none', beard: false, cloth: '#7a8fb8' }),
    P('cat', 'animal', '猫', 'cat', 'cat', { coat: 'orange' }),
    P('dog', 'animal', '狗', 'dog', 'dog', { coat: 'tan' }),
    P('rabbit', 'animal', '兔子', 'rabbit', 'rabbit', { coat: 'white' }),
    P('hamster', 'animal', '仓鼠', 'hamster', 'hamster', { coat: 'tan' }),
    P('bird', 'animal', '小鸟', 'bird', 'bird', { coat: 'yellow' }),
    P('fish', 'animal', '金鱼', 'fish', 'fish', { coat: 'orange' }),
    P('turtle', 'animal', '乌龟', 'turtle', 'turtle', { coat: 'green' }),
    P('snake', 'animal', '蛇', 'snake', 'snake', { coat: 'green' }),
    P('succulent', 'plant', '多肉', 'succulent', 'plant', { coat: 'green' }),
    P('flower', 'plant', '开花的花', 'flower', 'plant', { coat: 'rose' }),
    P('tree', 'plant', '盆栽小树', 'tree', 'plant', { coat: 'green' }),
  );

  C.presets.push(
    { id: 'trio', members: [{ arch: 'grandpa', name: '爷爷', conditions: ['diabetes'] }, { arch: 'toddler', name: '宝宝' }, { arch: 'cat', name: '团子' }] },
    { id: 'elder', members: [{ arch: 'grandpa', name: '爷爷', conditions: ['diabetes', 'hypertension'] }] },
    { id: 'baby', members: [{ arch: 'baby', name: '宝宝' }] },
    { id: 'pet', members: [{ arch: 'cat', name: '团子' }] },
    { id: 'plants', members: [{ arch: 'succulent', name: '多肉' }, { arch: 'flower', name: '小花' }] },
  );

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
})(globalThis.CY = globalThis.CY || {});
