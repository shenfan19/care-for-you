/* 访客卡片和礼物目录。官方卡片在 visitors 文件夹里，玩家也可以在数据文件夹 templates/visitors/ 里放自己的 YAML 卡片，格式相同，文字按语言写成对象。
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
  ]) { const price = Math.round(price0 * 2 / 5) * 5; /* 礼物价格按慢攒钱重标，比日常家具更花钱；最便宜的约等于满负荷两分钟的收入 */ V.GIFTS[id] = { id, icon, price, name: { 'zh-CN': zh, en } }; CY.i18n.register('zh-CN', { ['gift.' + id]: zh }); CY.i18n.register('en', { ['gift.' + id]: en }); }

  /* 第一位来客固定是南丁格尔：开局故事里她推开大门走进来，说这里有趣，很快就会离开 */
  V.FIRST = { default: 'nightingale' };

  /* 写卡片：spec.t 里每个字段是 [中文, 英文] 或 {语言: 文字}；hint 是这样的数组；spec.said 是这个人广为流传的一句话，接在需求暗示后面。官方卡片在 visitors 文件夹里，由 tools/build_cards.js 打包成 visitors_packed.js */
  const L = ['zh-CN', 'en'];
  const obj = x => (Array.isArray(x) ? Object.fromEntries(L.map((l, i) => [l, x[i]])) : x);
  V.add = spec => {
    const c = Object.assign({ wants: [], stay: [1, 2], official: false, controllable: false }, spec);   /* 来客是客人，不是玩家能操纵的人，卡上写 controllable: false；和宠物一样 */
    c.t = {}; delete c.said;
    for (const k in spec.t) c.t[k] = k === 'hint' ? spec.t[k].map(obj) : obj(spec.t[k]);
    if (spec.said) c.t.hint.push(obj(spec.said));
    V.cards[c.id] = c; if (!V.order.includes(c.id)) V.order.push(c.id);
    const regs = {};
    for (const k in c.t) {
      if (k === 'hint') c.t.hint.forEach((h, i) => { for (const l in h) (regs[l] = regs[l] || {})[`visitor.${c.id}.hint.${i}`] = h[l]; });
      else for (const l in c.t[k]) (regs[l] = regs[l] || {})[`visitor.${c.id}.${k}`] = c.t[k][l];
    }
    for (const l in regs) CY.i18n.register(l, regs[l]);
    return c;
  };
})(globalThis.CY = globalThis.CY || {});
