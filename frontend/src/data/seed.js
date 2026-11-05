/* 初始数据：物种模板、疾病模板、类别设定、声线、说话库、AI 技能。首次运行时写成文件夹里的明文 YAML，之后以文件为准。
   起始时没有任何角色，由引导页让用户选。
   需求的 rate 可以是一个数，也可以按阶段分别写，hold 是长按秒数，min 是这件事花掉的游戏分钟。stages 限定适用的年龄阶段，不写就不限。 */
(function (CY) {
  /* 物种，疾病，类别，系统，性格，事件这些模板的来源是 frontend/config/templates 下的 YAML 文件，
     由 tools/build_config.js 在部署前打包成 templates_packed.js，这里只读打包的结果。改 YAML，不改这里。 */
  const F = Object.assign({}, CY.templatesPacked);
  const C = CY.content;
  const dump = o => jsyaml.dump(o, { lineWidth: -1, noRefs: true, skipInvalid: true });

  /* AI 接入：人设规则和技能清单。引擎只允许 AI 做这里列出的事，输出必须符合 output 的限制。 */
  const aiPersona = {
    version: 1,
    system: '你在为一个照顾类桌面小游戏写角色台词。你只写角色的话，不扮演任何真实存在或已故的具体的人，不给医疗建议，不评价玩家，不说教。中文，口语，短句。只输出 JSON。',
    forbidden_patterns: ['我是真的', '我就是你', '去世', '遗言', '诊断', '处方', '吃[0-9]+(毫克|片)', '你应该看医生'],
  };
  const aiSkills = {
    speak: {
      version: 1, id: 'speak', purpose: '在角色用一句话回应当下情境时，替代库里的固定句子',
      inputs: ['persona.name', 'persona.role', 'persona.voice', 'persona.temper', 'persona.catchphrases', 'state.mood', 'state.frailty', 'state.top_need', 'situation'],
      prompt: '根据输入，用角色的口吻说一句话。situation 是当前情境。保持和 catchphrases 相近的语气。',
      output: { text: { type: 'string', max: 40 } },
    },
    adapt: {
      version: 1, id: 'adapt', purpose: '根据近期互动提出对角色性格参数的小幅调整建议',
      inputs: ['persona.name', 'persona.voice', 'learn', 'recent_counts'],
      prompt: '根据 learn 和 recent_counts，给出 needy 的调整量。',
      output: { needy_delta: { type: 'number', min: -0.05, max: 0.05 } },
    },
  };

  const CV = 5;   /* 内容文件的版本，内置内容更新了就加一，数据文件夹里旧版本的会被覆盖，旧的留在 _backup */
  const HEAD = {
    voice: '# 这种声线的角色默认会说的话。角色自己的 person.yaml 里 lines 写了同名项时，以角色自己的为准。\n',
    sayings: '# 可挑选的“说过的话”。游戏偶尔会问你：某某会对你说哪句。你选了哪句就记哪句的编号和原文。\n',
    asks: '# 问答库。每个问题有三个预设回答，游戏里另有一个自己写的回答。voice、stage、pronoun 限制谁会问这个问题，arch 是哪些角色会问，to 是主角是哪些角色时才问，pairs 是成对的（说话的角色，主角），sensitive 为 true 的需要在设置里打开。\n',
    nudges: '# 偶尔出现的现实提醒，轻轻鼓励你联系现实里的人。\n',
    traits: '# 性格的台词。每个性格有路过 glance，道谢 thanks，闲谈 ambient，需求 request，回答之后的回应 reply。和声线里的台词混在一起选。\n',
    conds: '# 疾病的台词和事件文字，覆盖到疾病模板上。这个语言没有写的，用疾病模板里的写法。\n',
  };

  /* 角色卡：每种典型角色一张，plain YAML，一个文件。游戏创建角色时按卡来，后端也按同样的字段读。
     health.score 是健康度，1 是完全健康；class 是这类人的紧迫、自理、哭闹；self_actions 是自己能做的动作；
     prefs 是爱待在哪些房间（rooms 是权重）和爱不爱动（restless，0 到 1，越大越爱换地方）；
     help 是主动帮忙：proactive 为真就会隔一阵自己走过去照顾最需要的人，below 是水平低于多少才出手，efficiency 是效果比例，interval 是间隔的现实秒数范围；
     dialogue 是对话：voice 指向声线，lines 里写的话优先于声线。 */
  const CARD_V = 6;
  /* 各类角色在各个房间的喜好权重，卡里的 prefs.rooms 写了就以卡为准。需求会另外把人推向厨房、卧室这些地方 */
  const PREFS = {
    elder: { living: 3, yard: 2, kitchen: 1.5 }, adult: { living: 3, kitchen: 1.5, yard: 1, study: 0.6 }, teen: { kids: 3, living: 1.5, study: 1.5, kitchen: 0.6 },
    child: { living: 3, yard: 2, kitchen: 1, kids: 0.8 }, toddler: { living: 4, yard: 1, kitchen: 0.6 },
    cat: { living: 3, bedroom: 2, kitchen: 1, yard: 1, study: 0.5 }, dog: { living: 3, yard: 3, kitchen: 1 },
    rabbit: { living: 3, yard: 1.5 }, guineapig: { living: 3, yard: 1 }, ferret: { living: 3, bedroom: 1 }, hedgehog: { living: 2, yard: 2 }, duck: { yard: 3, living: 1 }, chicken: { yard: 4, living: 0.5 },
  };
  const RESTLESS = { elder: 0.35, adult: 0.6, teen: 0.5, child: 0.9, toddler: 0.9, cat: 0.5, dog: 0.9 };
  const SCORE = { infant: 0.85, toddler: 0.9, child: 0.95, teen: 0.95, adult: 0.9, elder: 0.65 };
  const HELPERS = ['mom', 'dad', 'wife', 'husband', 'young_woman', 'young_man'];
  /* 各类角色在原型之上的覆盖，来自 cards/*.yaml，由 tools/build_cards.js 打包进 C.cardExtra */
  const CARD_EXTRA = C.cardExtra;
  let cardCache = null;
  const cardFiles = () => {
    if (cardCache) return cardCache;
    const cls = jsyaml.load(F['templates/classes.yaml']).classes, out = {};
    for (const a of C.archetypes) {
      const human = a.species === 'human', stage = human ? C.stageOf(a.age) : a.species;
      const spy = F[`templates/species/${a.species}.yaml`], sp = spy ? jsyaml.load(spy) : { actions: {} };
      const selfActs = Object.keys(sp.actions || {}).filter(k => { const x = sp.actions[k]; return x.self && (x.self === true || x.self.includes(stage)); });
      const ex = CARD_EXTRA[a.id] || {};
      const card = { version: CARD_V, id: a.id, label: a.role, group: a.group, species: a.species };
      if (human) { card.age = a.age; card.stage = stage; }
      if (a.hidden) card.hidden = true;
      Object.assign(card, { pronoun: a.pronoun, voice: a.voice, look: a.look, traits: [],
        health: Object.assign({ score: human ? SCORE[stage] : 0.9, mood: 0.6, conditions: [] }, ex.health),
        class: Object.assign({}, cls[stage]), need_rate: {}, self_actions: selfActs,
        help: Object.assign({ proactive: HELPERS.includes(a.id), efficiency: 0.4, interval: [90, 160], below: 0.35 }, ex.help),
        prefs: Object.assign({ rooms: PREFS[stage] || PREFS.adult, restless: RESTLESS[stage] || 0.6 }, ex.prefs),
        dialogue: { voice: a.voice, lines: ex.lines || {} } });
      out[`templates/cards/${a.id}.yaml`] = '# 角色卡：一类典型角色的全部设定。改了以后，新建的这一类角色按新的来。' + String.fromCharCode(10) + jsyaml.dump(card, { lineWidth: -1, noRefs: true, skipInvalid: true, flowLevel: 3 });
    }
    return (cardCache = out);
  };

  CY.seed = {
    PREFS, cardFiles,
    /* 内容包：台词、说话库、问答库、提醒库、疾病文字，按语言放在 templates/content/语言 下 */
    contentFiles(lang) {
      const P = C.packFor(lang), L = `templates/content/${lang}/`, out = {};
      for (const v in P.voices) out[`${L}voices/${v}.yaml`] = HEAD.voice + dump(Object.assign({ version: CV, id: v }, P.voices[v]));
      out[`${L}library/sayings.yaml`] = HEAD.sayings + dump({ version: CV, items: P.sayings });
      out[`${L}library/asks.yaml`] = HEAD.asks + dump({ version: CV, items: P.asks });
      out[`${L}library/nudges.yaml`] = HEAD.nudges + dump({ version: CV, items: P.nudges });
      if (P.conds && Object.keys(P.conds).length) out[`${L}conditions.yaml`] = HEAD.conds + dump(Object.assign({ version: CV }, P.conds));
      if (P.traits && Object.keys(P.traits).length) out[`${L}traits.yaml`] = HEAD.traits + dump(Object.assign({ version: CV }, P.traits));
      return out;
    },
    files() {
      const out = Object.assign({}, F, this.contentFiles(CY.i18n.lang), cardFiles());
      out['templates/ai/persona.yaml'] = '# AI 接入时共用的规则。引擎会用 forbidden_patterns 过滤 AI 的输出。\n' + dump(aiPersona);
      for (const k in aiSkills) out[`templates/ai/skills/${k}.yaml`] = '# AI 只能做这一件事，输入输出都受限。\n' + dump(aiSkills[k]);
      out['settings.ini'] = CY.ini.stringify({});
      out['README.txt'] = '这是 Care for You 的数据文件夹。里面全是明文文件，可以用记事本打开、修改、复制、备份。\n' +
        'settings.ini 是参数。people 里每个角色一个文件夹。world 里是这个世界的钱，时钟，日历。custom 里是你自己放进来的东西，比如导入的疾病包。\n' +
        'people/角色/sayings.yaml 里每句话同时记着库编号 lib 和原文 text。\n' +
        '_backup 里是被覆盖前的旧版本。改坏了可以从那里取回，或者删掉对应文件让程序重新生成。\n';
      return out;
    },
  };
})(globalThis.CY = globalThis.CY || {});
