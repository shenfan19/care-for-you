/* 访客卡片和礼物目录。官方卡片在这里，玩家也可以在数据文件夹 templates/visitors/ 里放自己的 YAML 卡片，格式相同，文字按语言写成对象。
   每张卡片的文字登记成语言包里的键 visitor.<id>.<字段>，所以换语言后日历里的旧记录也跟着换。
   身体需求只有一两行：care 是不用礼物的照料，wants 是对方真正需要的礼物。不接生理模型，不做诊断。
   历史人物一律虚构化，离开后历史不变，只留下一件无害的纪念品。src 记出处，review 记争议核查结果和日期。 */
(function (CY) {
  const V = CY.visitors = { cards: {}, order: [] };

  /* 礼物目录：[id, 图标, 价格, 中文, 英文] */
  V.GIFTS = {};
  for (const [id, icon, price0, zh, en] of [
    ['tea', '🍵', 30, '一包茶', 'Tea'], ['seeds', '🌱', 30, '一包种子', 'Seeds'], ['aspirin', '💊', 40, '阿司匹林', 'Aspirin'], ['soup', '🍲', 40, '一锅热汤', 'Hot soup'],
    ['notebook', '📓', 40, '笔记本', 'Notebook'], ['book', '📖', 50, '一本书', 'A book'], ['blanket', '🧣', 60, '厚毯子', 'A thick blanket'], ['pen', '🖊️', 60, '钢笔', 'Fountain pen'],
    ['umbrella', '☂️', 70, '一把伞', 'Umbrella'], ['kite', '🪁', 70, '风筝', 'Kite'], ['lamp', '💡', 80, '台灯', 'Desk lamp'], ['gloves', '🧤', 80, '厚手套', 'Thick gloves'],
    ['scarf', '🧣', 90, '围巾', 'Scarf'], ['map', '🗺️', 90, '地图', 'A map'], ['brush', '🖌️', 100, '笔墨', 'Brush and ink'], ['shoes', '👟', 110, '软底鞋', 'Soft shoes'],
    ['spectacles', '👓', 120, '一副眼镜', 'Spectacles'], ['chess', '♟️', 120, '棋盘', 'Chess set'], ['paints', '🎨', 140, '一盒颜料', 'Box of paints'], ['medkit', '🧰', 150, '药箱', 'First-aid kit'],
    ['flute', '🎶', 150, '一支笛子', 'A flute'], ['harmonica', '🎵', 180, '口琴', 'Harmonica'], ['clock', '⏰', 200, '座钟', 'Table clock'], ['coat', '🧥', 220, '厚外套', 'Warm coat'],
    ['telescope', '🔭', 300, '望远镜', 'Telescope'], ['microscope', '🔬', 400, '显微镜', 'Microscope'], ['lab_suit', '🥼', 500, '防护服', 'Protective suit'],
  ]) { const price = Math.round(price0 * 1.5 / 5) * 5; /* 礼物价格按慢攒钱重标，比日常家具更花钱 */ V.GIFTS[id] = { id, icon, price, name: { 'zh-CN': zh, en } }; CY.i18n.register('zh-CN', { ['gift.' + id]: zh }); CY.i18n.register('en', { ['gift.' + id]: en }); }

  /* 首位访客按语言安排，缺省南丁格尔 */
  V.FIRST = { 'zh-CN': 'zhuge', 'zh-TW': 'zhuge', default: 'nightingale' };

  /* 写卡片：spec.t 里每个字段是 [中文, 英文] 或 {语言: 文字}；hint 是这样的数组 */
  const L = ['zh-CN', 'en'];
  const obj = x => (Array.isArray(x) ? Object.fromEntries(L.map((l, i) => [l, x[i]])) : x);
  V.add = spec => {
    const c = Object.assign({ wants: [], stay: [1, 2], official: false }, spec);
    c.t = {};
    for (const k in spec.t) c.t[k] = k === 'hint' ? spec.t[k].map(obj) : obj(spec.t[k]);
    V.cards[c.id] = c; if (!V.order.includes(c.id)) V.order.push(c.id);
    const regs = {};
    for (const k in c.t) {
      if (k === 'hint') c.t.hint.forEach((h, i) => { for (const l in h) (regs[l] = regs[l] || {})[`visitor.${c.id}.hint.${i}`] = h[l]; });
      else for (const l in c.t[k]) (regs[l] = regs[l] || {})[`visitor.${c.id}.${k}`] = c.t[k][l];
    }
    for (const l in regs) CY.i18n.register(l, regs[l]);
    return c;
  };
  const look = (skin, hair, style, glasses, clothes) => ({ skin, hairColor: hair, hairStyle: style, glasses, clothes });
  const OFF = true;

  V.add({
    id: 'nightingale', official: OFF, region: 'Britain', years: '1820-1910', age: 55, pronoun: '她', stay: [1, 1], care: 'invite_rest', tired: 0.85,
    look: look('#fde3d0', 'brown', 'bun', 'none', '#7d8fa8'), souvenir: { id: 'oil_lamp', icon: '🪔' },
    src: 'Encyclopaedia Britannica, Florence Nightingale; Crimean War nursing, later years largely bedridden by illness.', review: '2026-11-02 通过：无政治与宗教争议，只提护理与休息',
    t: {
      name: ['弗洛伦斯·南丁格尔', 'Florence Nightingale'], era: ['十九世纪，英国', '19th century, Britain'], souvenir: ['一盏油灯', 'An oil lamp'],
      arrive_note: ['南丁格尔推开时空门走了进来，说自己照顾了太多人，想借一张床。', 'Florence Nightingale stepped through the door and asked to borrow a bed, having nursed too many people.'],
      hint: [['她揉了揉眼睛：“我很久没有睡过一个整觉了。”', 'She rubbed her eyes: "I have not slept a whole night in a long time."'], ['她看了看你的家人：“照顾人的人，也需要被人照顾。”', 'She looked at your family: "Those who care for others need caring for too."']],
      ok_line: ['她睡了很久，醒来时气色好多了。', 'She slept for hours and woke looking much better.'],
      leave_ok: ['南丁格尔临走前说：你把家人照顾得很好，请继续好好照顾他们。她留下了一盏油灯。', 'Before leaving, Florence Nightingale said you are looking after your family well and asked you to keep doing so. She left an oil lamp.'],
      leave_miss: ['南丁格尔轻声道了谢，没有多说，推开门回去了。', 'Florence Nightingale thanked you quietly and went back through the door.'],
      wrong_late: ['', ''],
    },
  });
  V.add({
    id: 'zhuge', official: OFF, region: 'China', years: '181-234', age: 45, pronoun: '他', stay: [1, 1], care: 'invite_rest', tired: 0.85,
    look: look('#f6d2b4', 'black', 'bun', 'none', '#5f8a7a'), souvenir: { id: 'feather_fan', icon: '🪶' },
    src: '《三国志·蜀书·诸葛亮传》，司马懿评“食少事烦”。', review: '2026-11-02 通过：只写操劳与休息，不涉及战争评价',
    t: {
      name: ['诸葛亮', 'Zhuge Liang'], era: ['三国，蜀汉', 'Three Kingdoms, Shu Han'], souvenir: ['一把羽扇', 'A feather fan'],
      arrive_note: ['诸葛亮推开时空门走了进来，眼下有些青黑，问能否借一张床。', 'Zhuge Liang stepped through the door, dark circles under his eyes, and asked if he could borrow a bed.'],
      hint: [['他摆摆手：“事无巨细，夜里总睡不踏实。”', 'He waved a hand: "So many matters, big and small, and I never sleep well."'], ['他笑了笑：“有人说我吃得少、事情多，说得不错。”', 'He smiled: "Someone once said I eat little and handle too much. They were not wrong."']],
      ok_line: ['他一觉睡到天黑，醒来时精神了不少。', 'He slept until dusk and woke much refreshed.'],
      leave_ok: ['诸葛亮临走前说：家里人最重要，莫要熬坏了身子。他留下一把羽扇。', 'Before leaving, Zhuge Liang said family matters most and begged you not to wear yourself out. He left a feather fan.'],
      leave_miss: ['诸葛亮拱手道谢，转身回去了。', 'Zhuge Liang bowed his thanks and went back through the door.'],
      wrong_late: ['', ''],
    },
  });
  V.add({
    id: 'curie', official: OFF, region: 'Poland / France', years: '1867-1934', age: 50, pronoun: '她', stay: [3, 4], wants: ['lab_suit', 'gloves'],
    look: look('#fde3d0', 'gray', 'bun', 'none', '#4f6d8f'), souvenir: { id: 'notebook_page', icon: '📄' },
    src: 'Nobel Prize biographies, Marie Curie; her death from aplastic anemia is generally linked to long exposure to radiation.', review: '2026-11-02 通过：纪念品为笔记复印页，不涉及放射性物质',
    t: {
      name: ['玛丽·居里', 'Marie Curie'], era: ['十九至二十世纪，波兰与法国', '19th-20th century, Poland and France'], souvenir: ['一页笔记的复印件', 'A copy of a notebook page'],
      arrive_note: ['居里夫人推开时空门走了进来，说实验室太久没有休息，想在这里住几天。', 'Marie Curie stepped through the door, saying she had not left the laboratory in ages and would like to stay a few days.'],
      hint: [['她把手背到身后：“手指有时会疼，大概是实验室里的缘故。”', 'She hid her hands behind her back: "My fingers hurt sometimes, probably from the laboratory."'], ['她好奇地看着你的灯：“有没有能挡住那些看不见的光的东西？”', 'She looked at your lamp curiously: "Is there anything that can block those invisible rays?"']],
      ok_line: ['她把东西穿戴好，认真地点了点头。', 'She put it on and nodded seriously.'],
      leave_ok: ['居里夫人临走前把一页笔记的复印件留给了你，说：谢谢你替我想到这些。', 'Before leaving, Marie Curie left you a copy of a notebook page: "Thank you for thinking of this for me."'],
      leave_miss: ['居里夫人惦记着实验，匆匆道别回去了。', 'Marie Curie, worried about her experiments, said a quick goodbye and went back.'],
      wrong_late: ['临走时她轻声说：“你的心意我收到了，只是我更需要能护住双手的东西。”', 'On the way out she said softly: "I appreciate the thought, but what I really needed was something to protect my hands."'],
    },
  });
})(globalThis.CY = globalThis.CY || {});
