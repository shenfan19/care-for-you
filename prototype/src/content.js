/* 内容数据：角色原型、声线（每种角色默认会说的话）、可挑选的“说过的话”库、现实提醒库。
   首次运行时写成文件夹里的明文 YAML，之后以文件为准，用户可以随便改。
   台词里 {ta} 是他/她/它，{title} 是对方怎么称呼你，{name} 是角色名。 */
(function (CY) {
  /* ---------- 角色原型：添加角色时的预设 ---------- */
  const L = (look) => look;
  const archetypes = [
    { id: 'grandpa', group: 'family', role: '爷爷', species: 'human', age_stage: 'elder', voice: 'elder', pronoun: '他', look: L({ skin: 2, hair_style: 'bald', hair_color: 'white', glasses: 'round', beard: false, cloth: '#7f9580' }) },
    { id: 'grandma', group: 'family', role: '奶奶', species: 'human', age_stage: 'elder', voice: 'elder', pronoun: '她', look: L({ skin: 2, hair_style: 'bun', hair_color: 'gray', glasses: 'none', beard: false, cloth: '#b58aa5' }) },
    { id: 'waigong', group: 'family', role: '外公', species: 'human', age_stage: 'elder', voice: 'elder', pronoun: '他', look: L({ skin: 1, hair_style: 'short', hair_color: 'gray', glasses: 'square', beard: false, cloth: '#7d8fa8' }) },
    { id: 'waipo', group: 'family', role: '外婆', species: 'human', age_stage: 'elder', voice: 'elder', pronoun: '她', look: L({ skin: 1, hair_style: 'bob', hair_color: 'gray', glasses: 'none', beard: false, cloth: '#c28a6e' }) },
    { id: 'dad', group: 'family', role: '爸爸', species: 'human', age_stage: 'adult', voice: 'parent', pronoun: '他', look: L({ skin: 2, hair_style: 'short', hair_color: 'black', glasses: 'square', beard: false, cloth: '#6f86a0' }) },
    { id: 'mom', group: 'family', role: '妈妈', species: 'human', age_stage: 'adult', voice: 'parent', pronoun: '她', look: L({ skin: 2, hair_style: 'bob', hair_color: 'brown', glasses: 'none', beard: false, cloth: '#c07a6b' }) },
    { id: 'aunt', group: 'family', role: '姑姑', species: 'human', age_stage: 'adult', voice: 'aunt', pronoun: '她', look: L({ skin: 2, hair_style: 'curly', hair_color: 'brown', glasses: 'none', beard: false, cloth: '#d4a24c' }) },
    { id: 'uncle', group: 'family', role: '舅舅', species: 'human', age_stage: 'adult', voice: 'aunt', pronoun: '他', look: L({ skin: 3, hair_style: 'short', hair_color: 'black', glasses: 'none', beard: true, cloth: '#5f8a7a' }) },
    { id: 'brother', group: 'family', role: '哥哥', species: 'human', age_stage: 'adult', voice: 'sibling', pronoun: '他', look: L({ skin: 2, hair_style: 'short', hair_color: 'black', glasses: 'none', beard: false, cloth: '#4f6d8f' }) },
    { id: 'sister', group: 'family', role: '姐姐', species: 'human', age_stage: 'adult', voice: 'sibling', pronoun: '她', look: L({ skin: 2, hair_style: 'ponytail', hair_color: 'black', glasses: 'none', beard: false, cloth: '#b5677a' }) },
    { id: 'daughter', group: 'family', role: '女儿', species: 'human', age_stage: 'child', voice: 'child', pronoun: '她', look: L({ skin: 1, hair_style: 'ponytail', hair_color: 'brown', glasses: 'none', beard: false, cloth: '#e7a6a1' }) },
    { id: 'son', group: 'family', role: '儿子', species: 'human', age_stage: 'child', voice: 'child', pronoun: '他', look: L({ skin: 1, hair_style: 'short', hair_color: 'black', glasses: 'none', beard: false, cloth: '#8fbf9f' }) },
    { id: 'nephew', group: 'family', role: '侄子', species: 'human', age_stage: 'child', voice: 'child', pronoun: '他', look: L({ skin: 2, hair_style: 'curly', hair_color: 'black', glasses: 'round', beard: false, cloth: '#e0b062' }) },
    { id: 'friend', group: 'family', role: '朋友', species: 'human', age_stage: 'adult', voice: 'sibling', pronoun: '她', look: L({ skin: 2, hair_style: 'long', hair_color: 'auburn', glasses: 'none', beard: false, cloth: '#7aa5b8' }) },
    { id: 'cat', group: 'animal', role: '猫', species: 'cat', age_stage: 'adult', voice: 'cat', pronoun: '它', look: L({ coat: 'orange' }) },
    { id: 'dog', group: 'animal', role: '狗', species: 'dog', age_stage: 'adult', voice: 'dog', pronoun: '它', look: L({ coat: 'tan' }) },
    { id: 'snake', group: 'animal', role: '蛇', species: 'snake', age_stage: 'adult', voice: 'snake', pronoun: '它', look: L({ coat: 'green' }) },
  ];

  /* 推荐组合：第一次进来时一键开始 */
  const presets = [
    { id: 'trio', label: '试试看：爷爷、宝宝和一只猫', note: '三种不同的节奏，适合先熟悉一下', members: [
      { arch: 'grandpa', name: '爷爷', conditions: ['diabetes'] }, { arch: 'daughter', name: '宝宝' }, { arch: 'cat', name: '团子' }] },
    { id: 'elder', label: '一位需要陪伴的老人', note: '有糖尿病，会有吃药和饮食的小选择', members: [{ arch: 'grandpa', name: '爷爷', conditions: ['diabetes'] }] },
    { id: 'pet', label: '只养一只猫', note: '最轻的开始', members: [{ arch: 'cat', name: '团子' }] },
  ];

  /* ---------- 声线：每种角色默认会说的话 ---------- */
  const voices = {};

  voices.elder = {
    request: {
      thirst: ['……有点渴。', '那个，水。'], hunger: ['几点了？还没吃吧。', '肚子有点空。'], rest: ['我坐一会儿。', '腰又不舒服了。'],
      company: ['你在忙啊……没事。', '过来坐坐？'], medicine: ['药，是不是该吃了？', '我记不清吃没吃了。'],
    },
    thanks: { water: ['嗯。'], feed: ['好，好。'], rest: ['靠一会儿就好。'], pet: ['……'], hand: ['你手比小时候大多了。'], medicine: ['吃了。你自己也别忘了。'], default: ['嗯。'] },
    glance: ['{ta}从门口看了你一眼，没说话，又走开了。', '{ta}在不远处坐着，只是看着你。', '{ta}轻轻咳了一声，像是想说什么，又没说。'],
    cares_back: ['{ta}把一杯水放在你手边，什么也没说。', '{ta}悄悄把你桌边的灯拧亮了一点。', '{ta}走过来，把你肩上滑下来的外套拉了拉。', '{ta}递过来一块洗好的水果，说：趁新鲜。'],
    reveal: '{ta}看着你，说：你这样天天围着我转，累不累？我没事的。你也得吃饭。',
    ask: [{ say: '你小时候发烧，我背着你走了好几里路，你还记得不？', prompt: '你记得吗？写下你的回忆：' }, { say: '你最近睡得好吗？', prompt: '你怎么回答：' }, { say: '我年轻的时候啊……', prompt: '{ta}没说完，你想接什么：' }],
  };

  voices.parent = {
    request: {
      thirst: ['给我倒杯水吧。', '嗓子有点干。'], hunger: ['你吃了没？我随便吃点就行。', '该做饭了吧。'], rest: ['我歇会儿，你别管我。', '今天有点累。'],
      company: ['最近怎么样？', '来，陪我说两句。'], medicine: ['药是不是该吃了？', '你帮我看看，药吃过没有。'],
    },
    thanks: { water: ['好了，够了。'], feed: ['你也吃。'], rest: ['我躺一会儿就好。'], pet: ['哎呀，多大了。'], hand: ['你的手都凉了。'], default: ['好了好了，不用管我，你忙。'] },
    glance: ['{ta}在厨房门口站了一下，看你一眼，又转身去忙了。', '{ta}拿着手机，想问你什么，又放下了。', '{ta}从你身后走过，脚步放得很轻。'],
    cares_back: ['{ta}把一碗汤放在你桌边，说：趁热喝。', '{ta}悄悄把你的杯子续上了水。', '{ta}说：别熬夜，我给你留了灯。', '{ta}把你换下来的衣服叠好了。'],
    reveal: '{ta}看着你说：我这边没事，你自己的日子也要过。',
    ask: [{ say: '你吃饭了没有？', prompt: '你怎么回答：' }, { say: '最近工作累不累？', prompt: '你怎么回答：' }],
  };

  voices.aunt = {
    request: {
      thirst: ['哎，倒口水喝～', '渴死了，有水没？'], hunger: ['饭做好没？我来帮忙。', '有点饿，有吃的没？'], rest: ['我坐会儿，腿酸。', '站不动了，歇歇。'],
      company: ['来来来，聊聊！', '你最近怎么都不说话？'], medicine: ['药在哪来着？', '我是不是该吃药了？'],
    },
    thanks: { water: ['哎，谢谢谢谢。'], feed: ['好吃好吃。'], rest: ['这下舒服了。'], pet: ['哎呀。'], hand: ['你这孩子。'], default: ['哎，好。'] },
    glance: ['{ta}隔着门探了探头，冲你笑了一下。', '{ta}在客厅跟谁讲着电话，一边朝你挥了挥手。', '{ta}端着一盘水果走过，朝你努努嘴。'],
    cares_back: ['{ta}往你碗里夹了块最大的肉。', '{ta}塞给你一个红包，说：拿着，别推。', '{ta}说：你瘦了。然后给你盛了一碗汤。'],
    reveal: '{ta}拍拍你的手，说：别光顾着我们，你自己好好的，比什么都强。',
    ask: [{ say: '你有对象了吗？', prompt: '你怎么回答：' }, { say: '小时候我带你去逛庙会，你还记得不？', prompt: '你记得吗？写下你的回忆：' }],
  };

  voices.sibling = {
    request: {
      thirst: ['哎，有水没？', '渴了，倒一杯。'], hunger: ['饿了，点个外卖？', '有吃的没？'], rest: ['我眯一会儿，别叫我。', '好困。'],
      company: ['在忙啥呢？', '打游戏不？', '出来聊两句。'], medicine: ['该吃药了吧。'],
    },
    thanks: { water: ['行。'], feed: ['行，欠你一顿。'], rest: ['谢了。'], pet: ['干嘛。'], hand: ['……肉麻。'], default: ['行。'] },
    glance: ['{ta}靠在门框上看了你一会儿，什么也没说。', '{ta}给你发了个表情包，然后就没了下文。', '{ta}冲你扬了扬下巴。'],
    cares_back: ['{ta}把你爱吃的零食放在你桌上，装作随手放的。', '{ta}说：我帮你看一下，你去睡。', '{ta}把你的快递拿进来了。'],
    reveal: '{ta}说：你别总一个人扛着，我在呢。',
    ask: [{ say: '你还记得咱俩小时候抢遥控器吗？', prompt: '你怎么回答：' }, { say: '最近有啥好玩的事没？', prompt: '你怎么回答：' }],
  };

  voices.child = {
    request: {
      thirst: ['{title}，喝水水。', '水！'], hunger: ['饿饿。', '{title}，我要吃饭饭。'], rest: ['困……', '{title}，我想睡觉。'],
      company: ['{title}～', '{title}，你看我。'], play: ['玩！{title}玩！', '{title}，陪我玩一会儿嘛。'],
    },
    thanks: { water: ['咕嘟咕嘟。'], feed: ['好吃！'], play: ['嘿嘿嘿嘿。'], soothe: ['……（慢慢闭上了眼睛）'], pet: ['嘻。'], hand: ['{title}的手好暖。'], default: ['嗯！'] },
    glance: ['{ta}抱着玩具，站在门边看你。', '{ta}远远地冲你挥了挥手。', '{ta}把脸贴在门框上，眼睛亮亮的。'],
    cares_back: ['{ta}跑过来，往你手里塞了一颗不知道从哪里找来的糖。', '{ta}摸了摸你的脸，说：{title}不哭。你其实没有哭。', '{ta}把自己最喜欢的小熊放在你的椅子上。', '{ta}踮着脚，用小手拍了拍你的肩膀。'],
    reveal: '{ta}抱着你的腿，仰着头说：{title}，我会照顾你的。',
    ask: [{ say: '{title}，你小时候也这么小吗？', prompt: '你怎么回答：' }, { say: '{title}，天为什么会黑？', prompt: '你怎么回答：' }],
  };

  voices.cat = {
    request: {
      thirst: ['{ta}站在水碗边，看看碗，又看看你。'], hunger: ['{ta}绕着你的脚边转了一圈，喵了一声。'], company: ['{ta}跳上桌子，在你的键盘旁边坐下了。'], play: ['{ta}叼来了那只破旧的小球，放在你脚边。'],
    },
    thanks: { water: ['{ta}低头喝了起来。'], feed: ['{ta}埋头吃，尾巴一晃一晃。'], play: ['{ta}扑了出去，又扑了回来。'], pet: ['{ta}眯起了眼睛，发出呼噜声。'], hand: ['{ta}在你怀里转了一圈，趴下了。'], default: ['喵。'] },
    glance: ['{ta}趴在窗台上，回头看了你一眼。', '{ta}走过来，用头顶了顶你的手，又走开了。'],
    cares_back: ['{ta}跳上你的膝盖，趴下，不动了。你发现你肩膀已经很僵了。', '{ta}安静地坐在你旁边，一直待到你站起来。', '{ta}用尾巴扫过你的手背，像是在说：该歇歇了。'],
    reveal: '{ta}整个下午都趴在你脚边，你一动，它就抬头看你。原来{ta}一直在等你。',
    ask: [],
  };

  voices.dog = {
    request: {
      thirst: ['{ta}舔着嘴，看了看空碗。'], hunger: ['{ta}坐在饭盆旁边，尾巴把地板扫得沙沙响。'], company: ['{ta}把下巴搁在你的膝盖上，眼巴巴地望着你。'], play: ['{ta}叼着牵引绳，跑到你面前。'],
    },
    thanks: { water: ['{ta}咕嘟咕嘟喝了半碗。'], feed: ['{ta}三两口就吃光了，抬头看你。'], play: ['{ta}撒着欢儿跑了一圈又回来。'], pet: ['{ta}把肚皮翻了出来。'], hand: ['{ta}靠着你，一动不动。'], default: ['汪。'] },
    glance: ['{ta}躺在门口，听见你动了就抬了抬头。', '{ta}摇了摇尾巴，又趴下了。'],
    cares_back: ['{ta}把一只湿漉漉的玩具放在你脚边，像是在把最好的给你。', '你一叹气，{ta}就凑过来蹭你的手。', '{ta}一直守在你的椅子旁边，直到你起身。'],
    reveal: '{ta}整个晚上都挨着你，你换了几个姿势，{ta}也跟着换。原来{ta}一直在陪你。',
    ask: [],
  };

  voices.snake = {
    request: {
      warmth: ['{ta}缩在饲养箱角落，不太动。'], thirst: ['{ta}的水盆见底了。'], hunger: ['{ta}抬起头，慢慢地吐了吐信子。'],
    },
    thanks: { warm: ['{ta}慢慢舒展开身体。'], water: ['{ta}缓缓地游向水盆。'], feed: ['{ta}安静地吞了下去。'], pet: ['{ta}缓缓转过头，吐了一下信子。'], default: ['{ta}看了你一眼。'] },
    glance: ['{ta}盘在暖灯下，只有眼睛跟着你动。', '{ta}无声地换了个位置。'],
    cares_back: ['{ta}安静地盘在离你最近的那一侧，不吵不闹。', '{ta}在你工作时一动不动，像是怕打扰你。'],
    reveal: '{ta}什么也没说，只是整个下午都守在离你最近的地方。',
    ask: [],
  };

  /* ---------- 可以挑选的“说过的话”：id 前缀对应声线 ---------- */
  const sayings = [];
  const S = (v, list) => list.forEach((t, i) => sayings.push({ id: v + String(i + 1).padStart(2, '0'), voice: v, text: t }));
  S('elder', ['吃了没？', '外面冷，多穿点。', '没事，老毛病。', '你忙你的，不用管我。', '我年轻的时候啊……', '慢点，别摔着。', '路上小心。', '我不饿，你吃。']);
  S('parent', ['吃饭了没有？', '别熬夜，早点睡。', '到家说一声。', '钱够不够用？', '你自己的事自己拿主意。', '我没事，你别担心。', '天凉了，加件衣服。', '回来吃饭吗？']);
  S('aunt', ['哎，你这孩子。', '多吃点，看你瘦的。', '来来来，坐下说。', '你小时候啊，可皮了。', '拿着，别推。', '最近忙什么呢？']);
  S('sibling', ['行吧行吧。', '你自己看着办。', '要帮忙就说话。', '欠你一顿。', '别硬撑。', '周末有空吗？']);
  S('child', ['抱抱！', '再玩一会儿嘛。', '{title}，你看我！', '我不要睡觉。', '我长大了照顾你。', '{title}～']);
  S('cat', ['喵。', '它用头顶了顶你的手。', '它趴在你的键盘上，就是不让开。', '它在你脚边绕了一圈。', '它半夜踩在你肚子上。']);
  S('dog', ['汪！', '它围着你转圈，尾巴甩个不停。', '它把鞋叼到了门口。', '你一回家，它就在门口等着。', '它把头靠在你腿上。']);
  S('snake', ['它盘在暖灯下，纹丝不动。', '它吐了吐信子，看着你。', '它慢慢地从石头上滑下来。', '它安静地蜕了一层皮。']);

  /* ---------- 现实提醒：偶尔鼓励你去和现实里的人联系 ---------- */
  const nudges = [
    { id: 'n01', kind: 'connect', text: '你多久没给家里人打电话了？' },
    { id: 'n02', kind: 'connect', text: '有个人你很久没联系了，对吧？' },
    { id: 'n03', kind: 'connect', text: '今天跟谁说过话了吗？不是工作的那种。' },
    { id: 'n04', kind: 'connect', text: '你上次和朋友见面是什么时候？' },
    { id: 'n05', kind: 'connect', text: '发一条消息给想起来的那个人吧，不用说什么大事。' },
    { id: 'n06', kind: 'self', text: '站起来，喝口水，看看窗外。' },
    { id: 'n07', kind: 'self', text: '你坐了很久了，出去走五分钟吧。' },
  ];

  /* ---------- 创建角色 ---------- */
  function archOf(id) { return archetypes.find(a => a.id === id); }

  CY.content = { archetypes, presets, voices, sayings, nudges, archOf };
})(globalThis.CY = globalThis.CY || {});
