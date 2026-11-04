/* 参考文献与节奏出处。游戏里每一个有现实依据的节奏都在这里有一行，知识页（设置里的"知识与参考文献"）从这里和实时的需求速率生成，
   所以数值改了页面跟着变，出处不会脱节。字段叫 reference，和 Life Matters 以及论文的叫法一致。
   status：sourced 数值直接来自文献；derived 由文献里的数换算出来；setting 游戏设定，没有可靠出处，诚实标出，不冒充有依据。
   key 是需求名，加冒号再加年龄阶段表示只管这一阶段；没有阶段的管所有人类阶段里没有单独一行的那些。
   real 是现实里的节奏，写给读的人，按语言写，没有的语言用英文。real_h 是现实里两次之间的小时数区间，给表格对照用。
   出处是检索时核对过摘要或官方页面，没有逐篇读全文；原始出处查不到的流行说法不写成定论。 */
(function (CY) {
  const R = CY.references = {};

  R.sources = {
    efsa2010: { cite: 'EFSA Panel on Dietetic Products, Nutrition and Allergies (2010). Scientific Opinion on Dietary Reference Values for water. EFSA Journal 8(3):1459.', url: 'https://doi.org/10.2903/j.efsa.2010.1459' },
    paruthi2016: { cite: 'Paruthi S, et al. (2016). Recommended amount of sleep for pediatric populations: a consensus statement of the American Academy of Sleep Medicine. Journal of Clinical Sleep Medicine 12(6):785-786.', url: 'https://aasm.org/resources/pdf/pediatricsleepdurationmethods.pdf' },
    watson2015: { cite: 'Watson NF, et al. (2015). Recommended amount of sleep for a healthy adult: a joint consensus statement of the American Academy of Sleep Medicine and Sleep Research Society. Journal of Clinical Sleep Medicine 11(6):591-592.', url: 'https://www.aasm.org/resources/pdf/adultsleepdurationconsensus.pdf' },
    nhs_nappies: { cite: 'NHS Start4Life. Breastfeeding challenges: milk supply (at least 6 heavy wet nappies every 24 hours from day 5).', url: 'https://www.nhs.uk/start4life/baby/feeding-your-baby/breastfeeding/breastfeeding-challenges/milk-supply' },
    nhs_feeds: { cite: 'NHS Scotland breastfeeding guidance, as commonly quoted: breastfed newborns feed frequently, about 8 to 12 times in 24 hours. Original page not re-opened; treat as a range, not a rule.', url: '' },
    leroy2009: { cite: 'Leroy S (2009). Why is it so hard to do my work? The challenge of attention residue when switching between work tasks. Organizational Behavior and Human Decision Processes 109(2):168-181.', url: 'https://econpapers.repec.org/RePEc:eee:jobhdp:v:109:y:2009:i:2:p:168-181' },
  };

  const SET = { en: 'Game setting. No reliable source for this interval.', 'zh-CN': '游戏设定，这个间隔没有可靠出处。' };
  R.items = [
    { id: 'thirst', kind: 'need', key: 'thirst', status: 'derived', real_h: [2, 3], refs: ['efsa2010'],
      real: { en: 'Adults need about 2.0 L (women) to 2.5 L (men) of total water a day, part of it from food. At roughly a glass a time that is 6 to 8 drinks a day, one every 2 to 3 waking hours. The per-drink count is arithmetic, not from the source.', 'zh-CN': '成人每天总水量约女性 2.0 升，男性 2.5 升，其中一部分来自食物。按一次一杯算，一天 6 到 8 次，醒着每 2 到 3 小时一次。每次的杯数是换算，不是文献原话。' },
      note: { en: 'The game waits longer than real life on purpose, so that nobody is asked all day. Older adults mostly pour their own water.', 'zh-CN': '游戏有意比现实间隔长，不让人一整天被叫。大多数老人自己会倒水。' } },
    { id: 'hunger', kind: 'need', key: 'hunger', status: 'setting', real_h: [4, 6],
      real: { en: 'Three meals a day is the common pattern, 4 to 6 waking hours apart. No single source; stated as common knowledge.', 'zh-CN': '常见是一天三餐，醒着每隔 4 到 6 小时。没有单一出处，按常识写。' } },
    { id: 'hunger:infant', kind: 'need', key: 'hunger:infant', status: 'sourced', real_h: [2, 3], refs: ['nhs_feeds'],
      real: { en: 'Breastfed newborns feed about 8 to 12 times in 24 hours, every 2 to 3 hours. Babies of 6 months start solids but still feed often.', 'zh-CN': '母乳喂养的新生儿 24 小时约吃 8 到 12 次，每 2 到 3 小时一次。六个月开始加辅食，仍然吃得勤。' } },
    { id: 'diaper:infant', kind: 'need', key: 'diaper:infant', status: 'sourced', real_h: [2, 4], refs: ['nhs_nappies'],
      real: { en: 'From day 5 at least 6 heavy wet nappies every 24 hours; a baby can wet a nappy anywhere between every 2 and 4 hours.', 'zh-CN': '出生第五天起每 24 小时至少 6 片湿透的尿布，一个宝宝每 2 到 4 小时湿一次都算正常。' } },
    { id: 'diaper', kind: 'need', key: 'diaper', status: 'setting', real: SET },
    { id: 'rest:infant', kind: 'need', key: 'rest:infant', status: 'sourced', refs: ['paruthi2016'],
      real: { en: 'Infants of 4 to 12 months: 12 to 16 hours of sleep per 24 hours including naps. Toddlers 1 to 2 years: 11 to 14 hours. Awake stretches are short, so tiredness returns every few hours.', 'zh-CN': '4 到 12 个月的婴儿每 24 小时睡 12 到 16 小时，含小睡；1 到 2 岁的幼儿 11 到 14 小时。醒着的时段很短，几个小时就又累了。' },
      note: { en: 'In the game sleep lowers tiredness by 0.12 per hour, so a full night clears it.', 'zh-CN': '游戏里睡觉每小时降低 0.12 的疲倦，睡满一晚就清掉。' } },
    { id: 'rest', kind: 'need', key: 'rest', status: 'sourced', refs: ['watson2015', 'paruthi2016'],
      real: { en: 'Healthy adults need 7 or more hours of sleep per night (Watson 2015); school-age children 9 to 12 hours and teenagers 8 to 10 hours (Paruthi 2016). People are awake about 16 hours a day.', 'zh-CN': '健康成人每晚需要 7 小时以上（Watson 2015）；学龄儿童 9 到 12 小时，青少年 8 到 10 小时（Paruthi 2016）。人一天醒着约 16 小时。' },
      note: { en: 'Sleep recovers 0.12 per hour in the game: 7 hours clear 0.84 of the need, in line with the 7 hour minimum.', 'zh-CN': '游戏里睡觉每小时恢复 0.12，睡 7 小时恢复 0.84，和 7 小时的下限相符。' } },
    { id: 'company', kind: 'need', key: 'company', status: 'setting', real: SET },
    { id: 'play', kind: 'need', key: 'play', status: 'setting', real: SET },
    { id: 'hygiene', kind: 'need', key: 'hygiene', status: 'setting', real_h: [24, 24], real: { en: 'Daily washing is the common habit; no source, kept as a setting.', 'zh-CN': '每天洗一次是常见习惯，没有出处，按设定。' } },
    { id: 'homework', kind: 'need', key: 'homework', status: 'setting', real: SET },
    { id: 'mobility', kind: 'need', key: 'mobility', status: 'setting', real: SET },
    { id: 'focus', kind: 'focus', status: 'setting', refs: ['leroy2009'],
      real: { en: 'After an interruption part of the attention stays with the unfinished task and later work suffers (attention residue). Commonly quoted figures for how long it takes to get back to full focus, such as 15 to 25 minutes, have no reliable original source.', 'zh-CN': '被打断后，一部分注意力还留在没做完的事上，之后的工作做得更差（注意力残留）。常被引用的"回到满专注要 15 到 25 分钟"没有可靠的原始出处。' },
      note: { en: 'In the game, leaving work drops income to 10% at once and it climbs back linearly over 20 game minutes. The direction has a source; the 20 minutes is a setting.', 'zh-CN': '游戏里离开工作立刻掉到 10%，之后用 20 个游戏分钟线性爬回满额。方向有文献，20 分钟是设定。' } },
  ];

  /* 一个需求在某个阶段对应的条目：先找阶段专属的，再找通用的，都没有返回 null */
  R.itemFor = (key, stage) => R.items.find(i => i.key === key + ':' + stage) || R.items.find(i => i.key === key) || null;
  /* 一个需求在人类各阶段里游戏的间隔：速率是每个游戏小时涨多少，涨到头顶亮起的线（0.5，和界面的 NEED_LIT 一致）除以速率 */
  R.LIT = 0.5;
  R.STAGES = ['infant', 'toddler', 'child', 'teen', 'adult', 'elder'];
  R.intervals = key => {
    const d = ((CY.game.tpl.species.human || {}).needs || {})[key]; if (!d) return [];
    const rate = d.rate, out = [];
    if (typeof rate === 'number') return [{ stage: 'all', h: R.LIT / rate }];
    for (const s of R.STAGES) { const r = rate && (rate[s] !== undefined ? rate[s] : rate.default); if (r && (!d.stages || d.stages.includes(s))) out.push({ stage: s, h: R.LIT / r }); }
    return out;
  };
  /* 页面和测试共用的行：每个人类需求按条目分组，没有条目的 item 为 null，测试要求这种情况不存在 */
  R.rows = () => {
    const rows = [];
    for (const k of Object.keys(((CY.game.tpl.species.human || {}).needs) || {})) {
      const groups = [];
      for (const x of R.intervals(k)) {
        const it = R.itemFor(k, x.stage), id = it ? it.id : '', g = groups.find(q => (q.item ? q.item.id : '') === id);
        if (g) g.ivs.push(x); else groups.push({ need: k, item: it, ivs: [x] });
      }
      rows.push(...groups);
    }
    return rows;
  };
  /* 宠物和植物的需求都是设定，页面上合并成一行说明 */
  R.setting = SET;
  R.medical = { en: 'This is not medical advice. Illness in the game only simulates how some people are affected; real medicines, doses and timings differ from person to person, so follow your own doctor.', 'zh-CN': '这不是医疗建议。游戏里的疾病只是模拟一部分人群的情况，真实的用药，剂量和时间因人而异，请遵医嘱。' };
})(globalThis.CY = globalThis.CY || {});
