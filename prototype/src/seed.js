/* 初始数据：物种模板、疾病模板、声线、说话库、AI 技能。首次运行时写成文件夹里的明文 YAML，之后以文件为准。
   起始时没有任何角色，由引导页让用户选。 */
(function (CY) {
  const F = {};

  F['templates/species/human.yaml'] = `version: 1
id: human
label: 人
# 每项需求每游戏小时涨多少，满值 1。stages 限定适用的年龄阶段。
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.10 }
  hunger: { label: 饥饿, icon: "🍚", rate: 0.08 }
  rest: { label: 疲倦, icon: "😴", rate: 0.05 }
  company: { label: 想有人陪, icon: "🤝", rate: 0.06 }
  play: { label: 想玩, icon: "🧸", rate: 0.12, stages: [child] }
# hold 是需要长按的秒数。label 可以按年龄阶段分别写。
actions:
  pet: { label: { default: 摸一摸, elder: 拍拍肩, child: 摸摸头 }, hold: 1, effect: { company: -0.25 }, mood: 0.05 }
  water: { label: 倒水, hold: 3, effect: { thirst: -0.9 } }
  feed: { label: 喂饭, hold: 5, effect: { hunger: -0.9 } }
  play: { label: 陪玩, hold: 8, effect: { play: -0.9, company: -0.4 }, stages: [child] }
  soothe: { label: 哄睡, hold: 10, effect: { rest: -0.9 }, stages: [child] }
  rest: { label: 扶去休息, hold: 6, effect: { rest: -0.9 }, stages: [adult, elder] }
  hand: { label: 握着手, hold: 6, effect: { company: -0.5 }, frailty: -0.15, mood: 0.1 }
`;

  F['templates/species/cat.yaml'] = `version: 1
id: cat
label: 猫
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.09 }
  hunger: { label: 饥饿, icon: "🍚", rate: 0.09 }
  company: { label: 想蹭人, icon: "🤝", rate: 0.07 }
  play: { label: 想玩, icon: "🧶", rate: 0.10 }
actions:
  pet: { label: 摸一摸, hold: 1, effect: { company: -0.3 }, mood: 0.06 }
  water: { label: 换水, hold: 3, effect: { thirst: -0.9 } }
  feed: { label: 喂猫粮, hold: 4, effect: { hunger: -0.9 } }
  play: { label: 逗猫, hold: 8, effect: { play: -0.9, company: -0.3 } }
  hand: { label: 抱一会儿, hold: 6, effect: { company: -0.5 }, frailty: -0.15, mood: 0.1 }
`;

  F['templates/species/dog.yaml'] = `version: 1
id: dog
label: 狗
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.09 }
  hunger: { label: 饥饿, icon: "🍖", rate: 0.09 }
  company: { label: 想你陪, icon: "🤝", rate: 0.09 }
  play: { label: 想出去玩, icon: "🎾", rate: 0.12 }
actions:
  pet: { label: 摸摸头, hold: 1, effect: { company: -0.3 }, mood: 0.06 }
  water: { label: 换水, hold: 3, effect: { thirst: -0.9 } }
  feed: { label: 喂狗粮, hold: 4, effect: { hunger: -0.9 } }
  play: { label: 扔球, hold: 7, effect: { play: -0.9, company: -0.3 } }
  walk: { label: 遛一圈, hold: 10, effect: { play: -1, company: -0.5 }, mood: 0.12 }
`;

  F['templates/species/snake.yaml'] = `version: 1
id: snake
label: 蛇
needs:
  warmth: { label: 要保温, icon: "🔥", rate: 0.07 }
  thirst: { label: 口渴, icon: "💧", rate: 0.05 }
  hunger: { label: 饥饿, icon: "🍖", rate: 0.02 }
actions:
  pet: { label: 轻轻碰一下, hold: 1, effect: {}, mood: 0.03 }
  warm: { label: 调保温灯, hold: 4, effect: { warmth: -0.9 } }
  water: { label: 换水, hold: 3, effect: { thirst: -0.9 } }
  feed: { label: 喂食, hold: 5, effect: { hunger: -0.9 } }
`;

  F['templates/conditions/diabetes.yaml'] = `version: 1
id: diabetes
label: 糖尿病
# 只是基础的体验，不是医学建议。更深的医学内容以后交给 Life Matters。
needs:
  medicine: { label: 该吃药了, icon: "💊", rate: 0.07 }
actions:
  medicine: { label: 陪吃药, hold: 5, effect: { medicine: -1 } }
events:
  dinner:
    say: 晚上吃什么？
    choices:
      - { label: 红烧肉, liked: true, mood: 0.15, frailty: 0.04, reply: "{ta}吃得很高兴。你心里知道，这对{ta}不太好。" }
      - { label: 清蒸鱼配青菜, mood: 0.02, frailty: -0.02, reply: "{ta}嘟囔了一句太清淡，还是吃完了。" }
      - { label: 杂粮粥配小菜, mood: 0.0, frailty: -0.04, reply: "{ta}点点头，说也行。" }
`;

  /* 以下由 content.js 的数据生成 */
  const C = CY.content;
  const dump = o => jsyaml.dump(o, { lineWidth: -1, noRefs: true });

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

  CY.seed = {
    files() {
      const out = Object.assign({}, F);
      for (const v in C.voices) out[`templates/voices/${v}.yaml`] = '# 这种声线的角色默认会说的话。角色自己的 person.yaml 里 lines 写了同名项时，以角色自己的为准。\n' + dump(Object.assign({ version: 1, id: v }, C.voices[v]));
      out['templates/library/sayings.yaml'] = '# 可挑选的“说过的话”。游戏偶尔会问你：某某会对你说哪句。你选了哪句就记哪句的编号和原文。\n' + dump({ version: 1, items: C.sayings });
      out['templates/library/asks.yaml'] = '# 问答库。每个问题有三个预设回答，游戏里另有一个自己写的回答。voice、stage、pronoun 限制谁会问这个问题，sensitive 为 true 的需要在设置里打开。\n' + dump({ version: 1, items: C.asks });
      out['templates/library/nudges.yaml'] = '# 偶尔出现的现实提醒，轻轻鼓励你联系现实里的人。\n' + dump({ version: 1, items: C.nudges });
      out['templates/ai/persona.yaml'] = '# AI 接入时共用的规则。引擎会用 forbidden_patterns 过滤 AI 的输出。\n' + dump(aiPersona);
      for (const k in aiSkills) out[`templates/ai/skills/${k}.yaml`] = '# AI 只能做这一件事，输入输出都受限。\n' + dump(aiSkills[k]);
      out['settings.ini'] = CY.ini.stringify({});
      out['world.yaml'] = 'version: 1\ngame_minutes: 0\nlast_seen: ""\n';
      out['README.txt'] = '这是 Care for You 的数据文件夹。里面全是明文文件，可以用记事本打开、修改、复制、备份。\n' +
        'settings.ini 是参数。people 里每个角色一个文件夹。templates 是物种、疾病、声线、说话库和 AI 技能。\n' +
        'people/角色/sayings.yaml 里每句话同时记着库编号 lib 和原文 text。\n' +
        '_backup 里是被覆盖前的旧版本。改坏了可以从那里取回，或者删掉对应文件让程序重新生成。\n';
      return out;
    },
  };
})(globalThis.CY = globalThis.CY || {});
