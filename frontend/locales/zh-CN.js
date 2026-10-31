/* 简体中文语言包。需求名、动作名、疾病名以模板 YAML 里的中文为准，所以这里不重复。设置项的说明以 ini.js 里的中文为准。 */
CY.i18n.register('zh-CN', {
  'app.title': 'Care for You',
  'app.proto': '原型 {v}',
  'foot.text': '个人项目，与任何学校、单位或机构无关。',
  'hdr.time_tip': '时间流逝的快慢',
  'time.real': '真实时间', 'time.compressed': '压缩时间', 'time.paused': '暂停',
  'hdr.float': '浮出小窗', 'hdr.float_tip': '把角色浮出成一个置顶小窗',
  'hdr.save': '存档与下载', 'hdr.save_tip': '保存游戏记录，下载本地运行包，导入存档',
  'hdr.settings': '设置', 'hdr.about': '关于',
  'float.note': '角色现在在浮出的小窗里。', 'float.back': '收回到这里',
  'float.unsupported': '这个浏览器不支持文档画中画，请用桌面版 Chrome 或 Edge。',
  'btn.add': '＋ 添加', 'btn.cancel': '取消', 'btn.close': '关闭', 'btn.save': '保存', 'btn.later': '待会儿',
  'room.empty': '这里还没有人。', 'room.away': '让{name}先离开桌面', 'room.bar': '心情 {mood}%　虚弱 {frail}%',
  'ask.own': '自己说……', 'ask.send': '说', 'pick.reroll': '都不像', 'nudge.yes': '好，我去', 'nudge.no': '晚点', 'unit.sec': '{n}秒',

  'clock.dh': '{d} 天 {h} 小时', 'clock.hm': '{h} 小时 {m} 分', 'clock.m': '{m} 分钟',
  'clock.elapsed': '已陪伴 {t}', 'clock.elapsed_tip': '按你选择的时间快慢累计的游戏时间，暂停时不增加',
  'clock.real': '现实 {hh}:{mm}',
  'clock.tip_system': '现在的时间，跟随你电脑的系统时钟，白天黑夜和你窗外一致',
  'clock.tip_game': '游戏里的时间，昼夜按游戏时间循环，后面是你电脑的系统时间',

  'bar.away': '{name}暂时离开', 'bar.recall': '叫回来',
  'feed.title': '发生的事', 'feed.all': '大家', 'feed.quiet': '隐藏日常动态', 'feed.stat': '一共照顾了 {care} 次，谈话 {talk} 次，没赶上 {missed} 次',
  'feed.stat_back': '，{name}给你的心意 {n} 次', 'feed.day': '第 {n} 天', 'feed.empty': '还没有发生什么。', 'feed.more': '再看一些',
  'fmt.datetime': '{m}月{d}日 {hh}:{mm}',
  'said.title': '说过的话', 'said.count': '记起的话 {n} 句，你回答的 {m} 句', 'said.you': '你', 'said.lib': '库编号，点号后面是预设回答的序号',
  'said.empty': '还没有。游戏里偶尔会问你问题，或者问你某个人会说哪句话。', 'said.nobody': '还没有角色。',
  'type.care': '照顾', 'type.talk': '谈话', 'type.missed': '没赶上', 'type.cares_back': '心意', 'type.glance': '看了你一眼', 'type.event': '事件',
  'type.frail': '虚弱', 'type.recovered': '缓过来', 'type.reveal': '那一刻', 'type.picked': '记起的话', 'type.nudge': '提醒',

  'add.group_family': '家人和朋友', 'add.group_animal': '动物', 'add.name_ph': '名字，例如 阿牛',
  'add.pronoun': '称呼', 'add.age': '年龄', 'add.glasses': '眼镜', 'add.beard': '胡子', 'add.skin': '肤色', 'add.haircolor': '发色', 'add.hair': '发型',
  'add.cloth': '衣服', 'add.cond': '基础疾病', 'add.cond_none': '无', 'add.coat': '毛色', 'add.ok': '添加',
  'pron.he': '他', 'pron.she': '她', 'pron.it': '它', 'age.child': '孩子', 'age.adult': '成人', 'age.elder': '老人',
  'glasses.none': '无', 'glasses.round': '圆框', 'glasses.square': '方框',
  'hair.short': '短发', 'hair.long': '长发', 'hair.bob': '齐肩', 'hair.ponytail': '马尾', 'hair.bun': '发髻', 'hair.curly': '卷发', 'hair.bald': '光头',
  'theme.auto': '跟随系统', 'theme.light': '浅色', 'theme.dark': '深色',
  'bg.warm': '暖米', 'bg.mint': '薄荷', 'bg.sky': '天青', 'bg.rose': '玫瑰', 'bg.gray': '中性灰', 'lang.auto': '跟随浏览器',
  'arch.grandpa': '爷爷', 'arch.grandma': '奶奶', 'arch.waigong': '外公', 'arch.waipo': '外婆', 'arch.dad': '爸爸', 'arch.mom': '妈妈', 'arch.aunt': '姑姑', 'arch.uncle': '舅舅', 'arch.me': '我',
  'arch.brother': '哥哥', 'arch.sister': '姐姐', 'arch.daughter': '女儿', 'arch.son': '儿子', 'arch.nephew': '侄子', 'arch.friend': '朋友', 'arch.cat': '猫', 'arch.dog': '狗', 'arch.snake': '蛇',

  'ob.title': '你有什么人要照顾吗？', 'ob.sub': '选一个开始就行，之后随时可以再添加。', 'ob.recommend': '推荐',
  'ob.added': '已添加：{names}', 'ob.start': '开始', 'ob.skip': '先看看，以后再加', 'sep.list': '、',
  'preset.trio.label': '试试看：爷爷、宝宝和一只猫', 'preset.trio.note': '三种不同的节奏，适合先熟悉一下',
  'preset.elder.label': '一位需要陪伴的老人', 'preset.elder.note': '有糖尿病，会有吃药和饮食的小选择',
  'preset.pet.label': '只养一只猫', 'preset.pet.note': '最轻的开始',
  'preset.name.grandpa': '爷爷', 'preset.name.daughter': '宝宝', 'preset.name.cat': '团子',

  'sec.interrupt': '打扰', 'sec.time': '时间', 'sec.player': '称呼', 'sec.interaction': '互动', 'sec.ui': '界面', 'sec.privacy': '隐私', 'sec.account': '账号', 'sec.ai': 'AI 接入',
  'set.title': '设置', 'set.look': '外观与语言', 'set.theme': '明暗', 'set.bg': '背景', 'set.lang': '语言',
  'set.data': '数据位置', 'set.data_note': '{where}。所有数据都是明文文件，选文件夹时请确认它不会被同步到别人能看到的地方。',
  'set.folder': '选择数据文件夹', 'set.restore': '补回缺失的初始文件', 'ob.random': '随机生成', 'ob.custom': '自己搭配', 'ob.back': '返回', 'ob.more': '更多场景', 'preset.selfcare.label': '一个人住，照顾自己', 'preset.selfcare.note': '单身独居，你就是那个人：按时吃药、测血糖、做饭、休息', 'preset.name.self': '我', 'corner.speed_tip': '时间 ×{speed}。点击切换：×1，×6，×24（现实一小时过一天），×60。几点在设置里调。', 'set.clock': '游戏时钟', 'set.clock_note': '游戏里现在是几点。它按上面的速度自己走；改它不影响陪伴天数和任何计时。新档开局对齐你的系统时间。', 'set.clock_set': '设为这个时间', 'set.clock_sync': '对齐系统时间', 'corner.money_tip': '钱。点开可以请保姆', 'corner.music_tip': '音乐。点一下开或关', 'help.title': '家里的帮手', 'help.income': '工作时段在书桌前会赚钱，每小时 {n}；你操纵的老人领固定的退休金，每小时 {p}。钱只用来请保姆。', 'nanny.title': '保姆', 'nanny.note': '白天帮你照顾家里的人，每天 {n}，从钱里自动付。钱不够的那天保姆休息，不会欠账。', 'nanny.status': '保姆在白天帮你照顾家里的人，每天 {n}。', 'nanny.hire': '请保姆', 'nanny.dismiss': '不请了', 'nanny.name': '保姆', 'log.nanny_hired': '请了一位保姆。', 'log.nanny_paid': '付了今天保姆的钱，{n}。', 'log.nanny_rest': '钱不够，今天保姆休息。', 'log.nanny_end': '保姆不来了。', 'arch.nanny': '保姆', 'set.figure': '人物造型', 'figure.dressed': '穿衣小豆', 'figure.plain': '素色小豆', 'figure.dumpling': '团子', 'sec.audio': '声音', 'set.advanced': '高级设置', 'set.danger': '删除', 'set.wipe_note': '删除本机上的全部游戏数据，包括所有角色和记录。',
  'set.wipe': '删除全部本地数据', 'set.folder_had': '已切换到该文件夹里已有的数据', 'set.folder_copied': '已把当前数据复制到该文件夹', 'set.restored': '补回了 {n} 个文件',
  'wipe.title': '删除全部本地数据', 'wipe.body': '这会清除这台设备上的所有角色、记录和设置，无法恢复。建议先下载一份存档。',
  'wipe.save_first': '先下载存档', 'wipe.sure': '我知道删除后无法恢复', 'wipe.go': '删除',

  'save.title': '存档与下载',
  'save.s1': '保存游戏记录', 'save.s1_note': '下载一个 zip，里面是全部数据文件、两份表格和一份说明，以后可以导入回来，也可以拿去备份或迁移。',
  'save.s1_btn': '下载存档', 'save.s1_key': '包含 AI 密钥，默认不含',
  'save.s2': '下载本地运行包', 'save.s2_note': '下载整个游戏程序，解压后双击 index.html 就能在本机运行，不需要联网，也不需要服务器。',
  'save.s2_btn': '下载运行包', 'save.s2_with': '同时附上我的存档', 'save.s2_working': '正在打包……',
  'save.s2_fail': '打包失败。从本地文件打开的页面读不到程序文件，请从网址打开游戏再下载。',
  'save.s3': '导入存档', 'save.s3_note': '选择之前下载的存档 zip。文件只在本机读取，不会上传到任何地方。',
  'save.s4': '云端同步', 'save.s4_note': '暂未开放。将来如果有账号，也只在你明确同意后才会上传，并且随时可以撤回和删除。',
  'import.err_zip': '这不是一个有效的 zip 文件。', 'import.err_empty': '这个 zip 里没有可以导入的游戏数据。', 'import.err_newer': '这个存档来自更新的版本，当前版本读不了。',
  'import.found': '找到 {n} 个角色：{names}', 'import.manifest': '来自版本 {v}，保存于 {at}', 'import.rejected': '有 {n} 个文件路径不合规或格式有误，已跳过。',
  'import.merge': '合并，只加入当前没有的角色', 'import.replace': '覆盖，用存档替换当前全部数据', 'import.backup': '导入前先下载当前存档作为备份', 'import.go': '导入',
  'import.confirm_replace': '覆盖会替换当前的全部数据，确定吗？', 'import.done': '导入完成，写入了 {n} 个文件。',
  'csv.person': '角色', 'csv.time': '时间', 'csv.who': '谁说的', 'csv.lib': '库编号', 'csv.ans': '预设回答序号', 'csv.text': '原文', 'csv.day': '游戏天数', 'csv.type': '类型',
  'pack.readme': 'Care for You {version} 本地运行包\n\n1. 解压到任意文件夹。\n2. 双击 index.html。建议用桌面版 Chrome 或 Edge。\n3. 如果包里有 my-save.zip，打开后点右上角的存档与下载，选择导入存档，选这个文件。\n\n数据只保存在你的设备上，不会上传。',

  'gate.fail': '打不开存储', 'gate.perm': '上次你选了数据文件夹 {name}。浏览器需要你再确认一次访问权限。', 'gate.continue': '继续使用这个文件夹', 'gate.browser': '改用浏览器内部存储',

  'about.title': '关于 Care for You', 'about.tab_about': '关于', 'about.tab_privacy': '隐私与免责', 'about.tab_credits': '致谢与许可', 'about.tab_version': '版本',
  'about.p1': '手停一停，照看一下家里人。你在工作，他们会不定时来叫你一声。没有分数，也没有惩罚。',
  'about.p2': '这是一个个人项目，作者是一个人，与任何学校、单位或机构无关，也不代表它们的立场。',
  'about.p3': '游戏里的角色都是虚构的。游戏不提供也不鼓励复制已故的人。你记起的话，只是你自己对一类人的印象。',
  'about.p4': '目前是早期版本，会有不完善的地方。欢迎提意见：shenfan19@gmail.com，或在 github.com/shenfan19/care-for-you 提 issue。',
  'priv.h1': '数据放在哪里',
  'priv.p1': '所有游戏数据只保存在你自己的设备上，是明文文件，你可以随时打开、修改、复制和删除。',
  'priv.p2': '目前没有账号，没有服务器，没有统计，没有广告，也不使用 cookie 或第三方追踪。',
  'priv.p3': '网页本身是静态的，运行时不会把你的游戏数据发到任何地方。',
  'priv.h2': 'AI 功能',
  'priv.p4': 'AI 功能默认关闭。只有你在设置里打开并填入服务地址后，才会把角色的名字、身份和当前情绪等少量上下文发给你选择的 AI 服务，用来生成一句台词。',
  'priv.p5': '你回答过的话默认不会发出去，需要你另外打开才会。AI 服务由第三方提供，它如何处理数据由它的政策决定，请你自行了解。密钥保存在设置文件里，是明文，不要把设置文件分享给别人，存档下载默认不含密钥。',
  'priv.h3': '你的权利',
  'priv.p6': '你可以随时下载全部数据，设置里有删除全部本地数据的按钮，删除后无法恢复。',
  'priv.p7': '如果将来增加账号或云端功能，会先写明收集哪些数据、用来做什么、保存多久，并且只在你明确同意后才上传。同意可以撤回，撤回后可以要求删除。',
  'priv.p8': '游戏面向成年人。如果将来在欧盟等地区提供服务，会按当地的数据保护法规，例如 GDPR，完善说明和流程。',
  'priv.h4': '免责声明',
  'priv.p9': '这是一个游戏，不是医疗、心理或护理产品，不提供诊断、治疗或用药建议。游戏里的疾病只是基础的情景，不代表真实的医学判断，真实的照护请咨询专业人员。',
  'priv.p10': '游戏按现状提供，不作任何担保。如果你正处于很难受的状态，或者觉得自己对游戏产生了不健康的依赖，请联系你身边可信的人或当地的专业援助机构。',
  'priv.note': '本页说明了目前的设计和承诺，不是法律意见。正式对外提供服务前会请专业人士审阅。',
  'cred.p1': '界面和逻辑是纯静态网页，没有后端。数据文件用 YAML 保存，解析使用 js-yaml，采用 MIT 许可证。',
  'cred.p2': '本项目在开发中使用了人工智能辅助工具。',
  'cred.p3': '角色形象、动画和文字均为原创。开源许可证尚未确定，确定后会在这里和仓库里写明。',
  'ver.line': '{app} {v}，数据结构版本 {schema}，发布于 {date}', 'ver.lang': '当前语言：{l}', 'ver.account': '账号功能：未启用。',

  'log.frail': '{name}很虚弱了，需要有人陪着', 'log.recovered': '{name}慢慢缓过来了', 'toast.weak': '{ta}今天特别没力气。',
  'req.need_fallback': '{name}需要{need}', 'line.reveal_fallback': '{ta}一直在看着你。', 'line.glance_fallback': '{name}看了你一眼。', 'line.ok': '嗯。',
  'req.pick_human': '你想想，{name}平时会对你说哪句话？', 'req.pick_animal': '你想想，{name}平时是怎么表示的？',
  'req.nudge_human': '{name}看着你：{text}', 'req.nudge_animal': '{name}盯着你，你忽然想起：{text}',
  'log.called_gone': '{name}叫了你一声，后来没事了', 'toast.nevermind': '没事了。', 'log.missed_need': '你没赶上，{name}自己处理了：{text}', 'toast.self': '我自己来吧。',
  'log.missed_generic': '你没回应：{text}', 'toast.nevermind2': '……没事。', 'log.care': '{label}。{line}', 'log.talk': '{q} 你说：{a}',
  'log.dinner_auto': '你没来得及选，{name}自己定了：{reply}', 'log.dinner': '晚饭选了{label}：{reply}', 'log.picked': '你记起{name}会说：{text}',
  'log.nudge': '{name}提醒你：{text} 你说好，去了。', 'toast.go': '去吧，我在这儿。', 'toast.later': '好，晚点也行。', 'log.put_down': '你先放下了：{text}',
  'ans.generic1': '嗯，我听着呢。', 'ans.generic2': '等我忙完告诉你。', 'ans.generic3': '我也想知道。',
});

CY.i18n.register("zh-CN", {
 "hdr.lang_tip": "语言",
 "hdr.theme_tip": "明暗：{mode}，点击切换",
 "hdr.ratio_tip": "压缩时间的快慢，现实一分钟等于游戏多少分钟",
 "ratio.label": "×{n}",
 "unit.min": "{n} 分钟",
 "unit.hour": "{n} 小时",
 
 "sec.play": "体验",
 "sec.economy": "工作与钱",
 "add.group_plant": "花草",
 "stage.infant": "婴儿",
 "stage.toddler": "幼儿",
 "stage.child": "儿童",
 "stage.teen": "少年",
 "stage.adult": "成人",
 "stage.elder": "老人",
 "stage.note.infant": "完全不能自理，要频繁喂奶和换尿布，需求严重时会不停哭闹。",
 "stage.note.toddler": "几乎不能自理，会哭闹，要喂饭、换尿布、陪玩和哄睡。",
 "stage.note.child": "能自己做一部分事，需要陪玩、写作业和睡前故事。",
 "stage.note.teen": "大部分能自理，更需要陪伴和聊天。",
 "stage.note.adult": "基本自理，偶尔需要陪伴，不需要喂饭。",
 "stage.note.elder": "能自己吃饭睡觉一阵，但行动和健康需要关照，慢性病要吃药。",
 "kind.note.animal": "动物不会说话，用动作表达需求，没人管的时候能撑一阵。",
 "kind.note.plant": "花草不说话，需求按天计，慢慢蔫掉，不会哭闹。",
 "preset.baby.label": "一个刚出生的宝宝",
 "preset.baby.note": "喂奶、换尿布、哄睡，没人管会一直哭",
 "preset.plants.label": "几盆花草",
 "preset.plants.note": "不说话，只按时间需要浇水和阳光",
 "preset.name.toddler": "宝宝",
 "preset.name.baby": "宝宝",
 "preset.name.succulent": "多肉",
 "preset.name.flower": "小花",
 "arch.baby": "宝宝",
 "arch.toddler": "幼儿",
 "arch.teen": "少年",
 "arch.rabbit": "兔子",
 "arch.hamster": "仓鼠",
 "arch.bird": "小鸟",
 "arch.fish": "金鱼",
 "arch.turtle": "乌龟",
 "arch.succulent": "多肉",
 "arch.flower": "开花的花",
 "arch.tree": "盆栽小树",
 "class.infant": "婴儿",
 "class.toddler": "幼儿",
 "class.child": "儿童",
 "class.teen": "少年",
 "class.adult": "成人",
 "class.elder": "老人",
 "class.cat": "猫",
 "class.dog": "狗",
 "class.rabbit": "兔子",
 "class.hamster": "仓鼠",
 "class.bird": "小鸟",
 "class.fish": "金鱼",
 "class.turtle": "乌龟",
 "class.snake": "蛇",
 "class.succulent": "多肉",
 "class.flower": "花",
 "class.tree": "小树",
 "type.cry": "哭闹",
 "type.self": "自己来",
 "life.wfh": "你正在居家办公，家里还有 {n} 个要照顾的。",
 "life.working": "工作中，家里还有 {n} 个要照顾的。",
 "life.offwork": "不在工作时段，家里还有 {n} 个要照顾的。",
 
 "life.mode_tip": "切换长按和点击。长按占用你现实里的时间，点击花掉游戏里的时间",
 "life.mode_hold": "长按：占用现实时间",
 "life.mode_click": "点击：花掉游戏时间",
 "life.busy": "正在{what}",
 
 "life.household": "家人与保姆",

 
 "home.title": "家人与保姆",
 "home.note": "按谁最需要你排列，由类别和当下的需求自然决定，不需要自己排优先级。",
 "home.urgency": "紧迫程度",
 "home.self": "自理 {n}%",
 "home.nanny": "请保姆",
 "home.nanny_note": "保姆只在工作时段在场，每游戏小时 {cost}。在场时需求涨得慢六成，但情绪上不如你在身边，也不会有心意。钱花光保姆会先走。",
 "intro.title": "照顾是有代价的",
 "intro.p1": "你正在居家办公，同时家里还有人要照顾。每一次照顾，都要从别的地方挤出来。",
 "intro.p2": "长按会打断你现实里正在做的事，点击会花掉游戏里的时间，那段时间里你赚不了钱。选一种体验：",
 "intro.light": "轻量体验",
 "intro.light_note": "只有长按，没有金钱，适合工作时放在一边。",
 "intro.life": "完整体验",
 "intro.life_note": "点击开始，花掉游戏里的时间。工作赚钱，用来买食材、药品、尿布和玩具，也可以请保姆，但保姆在场的效果会打折。婴儿没人管会一直哭，老人能自己照顾自己一阵。",
 "intro.later": "之后可以在设置里改，也可以随时用顶栏下面的按钮切换长按和点击。",
 "toast.busy": "你正忙着{what}。",
 "toast.started": "开始{what}，要花 {min} 分钟。",
 
 "toast.nobody": "……",
 "log.self": "没人管，{name}自己解决了：{need}",
 "log.cry": "{name}哭了起来：{need}",
 "log.healed": "{name}的{cond}好了",
 
 "log.missed_need_helpless": "你没赶上，{name}没法自己处理：{text}",
 "line.cry": "哇——"
});

CY.i18n.register("zh-CN", {
 "mode.reality": "现实",
 "mode.story": "加速",
 "mode.paused": "暂停",
 "mode.reality_tip": "现实模式：时间跟现实同步，动作靠长按，占用你现实里的时间。加速里没做完的事先停着",
 "mode.story_tip": "加速模式：时间压缩，动作点一下就开始，花掉游戏里的时间。一次只能做一件事，后开始的会把先开始的压下去，做完再接着做",
 "mode.paused_tip": "暂停：时间停住，什么都不会发生",
 "mode.hint_reality": "现实模式：长按，占用现实时间",
 "mode.hint_story": "加速模式：点击，花掉游戏时间",
 "mode.hint_paused": "已暂停",
 "mode.switched_reality": "已切换到现实模式：时间和现实同步，动作靠长按。加速里还有 {k} 件没做完的事，先停着，回到加速模式再接着做。",
 "mode.switched_story": "已切换到加速模式：时间压缩为 ×{n}，动作点一下开始，花掉游戏里的时间。一次只能做一件事，插进来的新事会让旧的先暂停。",
 "mode.switched_paused": "已暂停，时间不走，也不会有人来打扰。",
 "intro.reality": "现实模式",
 "intro.reality_note": "时间和现实同步，只有长按，没有钱，适合放在工作旁边，打断的是你真实的时间。",
 "intro.story": "加速模式",
 "intro.story_note": "时间压缩，点一下就开始，花掉游戏里的时间。工作赚钱，买食材药品尿布玩具，也可以请保姆。一次只做一件事，新的会让旧的先暂停。婴儿没人管会一直哭，老人能自己照顾自己一阵。",
 "intro.later": "顶栏里的现实、加速、暂停可以随时切换，其余细节在设置里改。",
 "scene.auto": "自动",
 "scene.living": "客厅",
 "scene.bedroom": "卧室",
 "scene.kitchen": "厨房",
 "scene.lawn": "草坪",
 "scene.balcony": "阳台",
 "scene.none": "纯色",
 "scene.tip": "房间背景",
 "set.scene": "背景场景",
 "add.traits": "性格特征",
 "trait.clingy": "黏人",
 "trait.independent": "独立",
 "trait.nightowl": "夜猫子",
 "trait.earlybird": "早起",
 "trait.picky": "挑食",
 "trait.sickly": "体弱",
 "trait.sturdy": "结实",
 "trait.grumpy": "爱闹脾气",
 "trait.cheerful": "乐天",
 "trait.thirsty": "爱喝水",
 "trait.hearty": "饭量大",
 "trait.clingy_tip": "想要陪伴的需求涨得更快",
 "trait.independent_tip": "想要陪伴的需求涨得慢，更能自己照顾自己",
 "trait.nightowl_tip": "睡得更晚，起得更晚",
 "trait.earlybird_tip": "睡得更早，起得更早",
 "trait.picky_tip": "吃饭的效果打折",
 "trait.sickly_tip": "虚弱度涨得更快",
 "trait.sturdy_tip": "虚弱度涨得更慢",
 "trait.grumpy_tip": "心情容易低",
 "trait.cheerful_tip": "心情容易好",
 "trait.thirsty_tip": "口渴涨得更快",
 "trait.hearty_tip": "饥饿涨得更快",
 "act.sleeping": "在睡觉",
 "act.awake": "醒着",
 "mood.great": "心情很好",
 "mood.ok": "心情还行",
 "mood.low": "情绪低落",
 "mood.bad": "很难受",
 "status.age": "{n} 岁",
 "status.crying": "正在哭闹",
 "status.nanny": "有保姆",
 "status.mood": "心情",
 "status.frailty": "虚弱",
 "status.needs": "需求",
 "status.selfdo": "自己能做的，自理 {n}%",
 "status.selfnone": "什么也不能自己做",
 "room.info": "看看{name}的状态",
 "toast.sleep": "{name}睡着了。",
 "toast.paused": "现在是暂停的。",
 "toast.already": "已经在{what}了。",
 "toast.too_many": "手上的事太多了，先做完几件。",
 "toast.interrupt": "先放下{prev}，做{what}，做完再接着做。",
 "log.self_did": "{name}自己做了：{label}",
 "selfact.drink": "{name}自己倒了杯水",
 "selfact.cook": "{name}自己做了顿饭",
 "selfact.snack": "{name}自己找了点吃的",
 "selfact.nap": "{name}自己小睡了一会儿",
 "selfact.wash": "{name}自己洗了个澡",
 "selfact.tv": "{name}自己看了会儿电视",
 "selfact.stretch": "{name}自己活动了活动腿脚", "selfact.rattle": "{name}自己抓着摇铃玩", "selfact.babble": "{name}自己咿咿呀呀说了一阵", "selfact.blocks": "{name}自己搭了会儿积木",
 "selfact.peat": "{name}自己吃了点东西",
 "selfact.pdrink": "{name}自己喝了点水",
 "selfact.selfmed": "{name}自己吃了药",
 "selfact.selfbp": "{name}自己量了血压",
 "selfact.selfheat": "{name}自己热敷了一下",
 "pron.sub.m": "他",
 "pron.sub.f": "她",
 "pron.sub.n": "它",
 "arch.husband": "丈夫",
 "arch.wife": "妻子",
 "arch.neighbor": "邻居老人",
 "arch.roommate": "室友",
 "arch.parrot": "鹦鹉",
 "arch.cactus": "仙人掌",
 "class.cactus": "仙人掌"
});

CY.i18n.register("zh-CN", {"player.title": "爸爸", "player.name": "你"});

CY.i18n.register("zh-CN", {"btn.edit": "编辑", "btn.archive": "归档", "btn.delete": "删除", "btn.restore": "恢复", "bar.archived": "已归档 {n} 位", "del.title": "删除{name}？", "del.note": "删除后{name}的记录、说过的话和状态都会从本机移除，不能恢复。只是想让ta先离开的话，可以选归档，记录会留着。"});

CY.i18n.register("zh-CN", {"hdr.share": "分享卡片", "share.title": "分享卡片", "share.note": "只在你的设备上生成一张图，你选哪些数字就放哪些，默认不含名字。游戏不会上传，也不推荐你分享。", "share.f_time": "陪伴时间", "share.f_care": "照顾次数", "share.f_talk": "聊过天", "share.f_called": "被叫的次数", "share.f_back": "收到的心意", "share.f_names": "显示名字", "share.save": "保存图片", "share.send": "分享", "share.line_time": "陪伴了 {t}", "share.line_care": "照顾了 {n} 次", "share.line_talk": "聊了 {n} 次", "share.line_called": "被叫了 {n} 声{title}", "share.line_back": "收到了 {n} 份心意", "share.foot": "Care for You · 没有分数，只有陪伴", "cond.heart": "心脏病", "cond.parkinson": "帕金森", "cond.depress": "情绪低落", "cond.nocturia": "夜尿多", "cond.eczema": "湿疹", "cond.fracture": "骨折恢复", "cond.trauma": "创伤后惊醒", "cond.allergy": "过敏", "need.chest": "胸口发闷", "need.tremor": "手在抖", "need.lowmood": "心情很低落", "need.toilet": "想上厕所", "need.itch": "皮肤发痒", "need.pain": "伤处疼", "need.nightmare": "睡不安稳", "need.sneeze": "打喷嚏流眼泪", "need.veg": "想吃新鲜蔬菜", "need.humid": "要喷水保湿", "act.restsit": "扶着坐下歇歇", "act.steady": "扶稳", "act.listen": "静静听ta说", "act.walkout": "陪着出去走走", "act.lead": "扶去厕所", "act.nightlight": "开小夜灯", "act.selftoilet": "自己去厕所", "selfact.selftoilet": "自己去厕所", "act.ointment": "涂药膏", "act.trimnails": "剪指甲", "act.support": "扶着走几步", "act.painkill": "吃止痛药", "act.rehab": "陪着做康复动作", "act.stayclose": "陪在身边不说话", "act.warmdrink": "递一杯热饮", "act.antihist": "吃抗过敏药", "act.airclean": "打扫除尘", "act.veggie": "喂新鲜蔬菜", "act.mist": "喷水保湿", "act.train": "教口令", "act.teach": "教说话", "class.guineapig": "豚鼠", "class.gecko": "守宫", "arch.guineapig": "豚鼠", "arch.gecko": "守宫", "arch.refugee_elder": "逃难来的老人", "arch.refugee_mother": "逃难来的妈妈", "arch.refugee_child": "逃难来的孩子", "arch.wheelchair": "坐轮椅的家人", "preset.host.label": "收留一家逃难的人", "preset.host.note": "一位老人，一位妈妈，一个孩子，刚到一个陌生的地方，需要时间慢慢安下心来", "preset.name.refugee_elder": "老人", "preset.name.refugee_mother": "妈妈", "preset.name.refugee_child": "孩子", "preset.night.label": "夜里起夜的爷爷", "preset.night.note": "夜尿多，夜里要起来，白天也有些虚弱，需要有人留意"});

CY.i18n.register("zh-CN", {"loc.home": "家", "loc.office": "办公室", "loc.hospital": "医院", "loc.bedroom": "卧室", "loc.elder": "老人房", "loc.toilet": "卫生间", "loc.study": "书房", "loc.living": "客厅", "loc.kitchen": "厨房", "loc.yard": "院子", "loc.ward": "病房", "loc.desk": "工位", "nav.here": "你在{place}", "nav.transit": "正在路上", "nav.travel_hold": "前往{place}，长按 {n} 秒", "nav.travel_click": "前往{place}，花 {t}", "walk.to": "走到{room}", "walk.travel": "前往{place}", "toast.offsite": "{name}在{place}，先过去吧", "toast.walking": "正在走过去，到了就做", "log.fall_minor": "{name}夜里起夜时摔了一下，没有大碍。", "log.fall_serious": "{name}夜里起夜摔倒了，被送到了医院。", "log.discharge": "{name}出院回家了。", "log.night_wc": "{name}夜里起来上了厕所。", "room.edit": "编辑{name}", "life.drag": "拖动可以调整顺序"});

CY.i18n.register("zh-CN", {"hdr.people": "角色", "hdr.people_tip": "添加、编辑、归档、删除角色", "people.title": "管理角色", "people.note": "添加、编辑、归档和删除都在这里。", "people.archived": "已归档", "loc.family": "全家", "time.sync": "与现实同步", "time.free": "游戏时间，与现实分开", "time.ff": "快进到 {time}", "time.tip_real": "游戏里几点就是现实里几点，动作靠长按", "time.tip_free": "游戏用自己的时间，一倍速，和现实的几点分开。点「对回现实」回到现实时间", "time.tip_compressed": "快进中，动作点一下，花掉游戏里的时间", "time.back": "对回现实", "time.back_tip": "游戏时间直接变成现实此刻的时间，不渐变，只记录时间", "time.stop": "停下", "time.stop_tip": "停在现在的游戏时间，回到一倍速", "ff.title": "快进…", "ff.tip": "快进到一个时刻，到了自动回到一倍速。快进里点一下做事，花掉游戏里的时间", "ff.morning": "到下一个早上 7:00", "ff.noon": "到中午 12:00", "ff.evening": "到傍晚 18:00", "ff.night": "到夜里 22:00", "ff.p60": "快进 1 小时", "ff.p180": "快进 3 小时", "ff.p360": "快进 6 小时", "ff.start": "开始快进，到 {time} 停下，之后用游戏自己的时间，和现实分开。", "ff.done": "到 {time} 了，回到一倍速。游戏时间和现实分开，想回去点「对回现实」。", "intro.light": "轻量体验", "intro.light_note": "只有长按，没有钱，适合放在工作旁边，打断的是你真实的时间。", "intro.full": "完整体验", "intro.full_note": "工作赚钱，买食材药品尿布玩具，也可以请保姆。婴儿没人管会一直哭，老人能自己照顾自己一阵。", "intro.p2": "你可以选只有长按的轻量体验，也可以选要工作赚钱、买物品的完整体验。想快进时，顶栏里有快进。选一种开始：", "intro.later": "快进和对回现实在顶栏里，其余细节在设置里改。"});

CY.i18n.register("zh-CN", {"backend.error": "远程后端连不上，已改用内置后端。"});

CY.i18n.register("zh-CN", {"trait.shy": "害羞", "trait.shy_tip": "话少，不爱主动开口，需要陪伴的速度慢一点，也更能自己待着", "trait.chatty": "爱聊天", "trait.chatty_tip": "话多，想有人陪的速度更快，心情也更好", "trait.curious": "好奇", "trait.curious_tip": "什么都想看看，想玩的速度更快", "trait.stubborn": "倔强", "trait.stubborn_tip": "认定了就不改，照顾的效果打一点折扣，心情稍低", "trait.gentle": "温和", "trait.gentle_tip": "脾气好，心情偏高，身体稍结实一点", "trait.playful": "爱玩", "trait.playful_tip": "想玩的速度很快，心情偏高", "trait.anxious": "爱操心", "trait.anxious_tip": "想有人陪的速度更快，身体稍弱，心情偏低", "trait.proud": "要面子", "trait.proud_tip": "不愿麻烦别人，自理更多，想有人陪的速度慢", "trait.sentimental": "念旧", "trait.sentimental_tip": "爱回忆以前，想有人陪的速度偏快"});

CY.i18n.register("zh-CN", {"arch.hedgehog": "刺猬", "arch.duck": "鸭子", "arch.ferret": "雪貂", "arch.axolotl": "六角恐龙", "arch.chicken": "小鸡", "arch.orchid": "兰花", "arch.bamboo": "竹子", "arch.gongong": "公公", "arch.popo": "婆婆", "arch.grandson": "孙子", "arch.granddaughter": "孙女", "arch.younger_brother": "弟弟", "arch.younger_sister": "妹妹", "arch.niece": "外甥女", "arch.classmate": "同学", "class.hedgehog": "刺猬", "class.duck": "鸭子", "class.ferret": "雪貂", "class.axolotl": "六角恐龙", "class.chicken": "小鸡", "class.orchid": "兰花", "class.bamboo": "竹子", "preset.threegen.label": "三代同堂", "preset.threegen.note": "爷爷奶奶，妈妈，宝宝，每个人的节奏都不一样", "preset.solo.label": "一个人，一只猫，几盆花", "preset.solo.note": "安静的日子，需要的不多，但每天都要看一眼", "preset.zoo.label": "一屋子小动物", "preset.zoo.note": "猫，狗，兔子，刺猬，各有各的脾气", "preset.garden.label": "花草一角", "preset.garden.note": "不说话，只按时间需要浇水和阳光", "preset.name.grandma": "奶奶", "preset.name.mom": "妈妈", "preset.name.dog": "豆豆", "preset.name.rabbit": "糯米", "preset.name.hedgehog": "小刺", "preset.name.orchid": "兰兰", "preset.name.bamboo": "青青", "preset.name.cactus": "小刺球"});

CY.i18n.register("zh-CN", {"intro.p2": "你可以选只有长按的轻量体验，也可以选要工作赚钱、买物品的完整体验。选一种开始：", "intro.later": "其余细节在设置里改。"});

CY.i18n.register("zh-CN", {"about.p5": "让手停在鼠标上，让脑子歇一会儿。"});

CY.i18n.register("zh-CN", {"me.work_start": "到了工作时间，你在书房办公。", "me.work_end": "下班了，你从书房出来。", "me.go": "你去了{place}。", "me.back": "你回到了家。"});

CY.i18n.register("zh-CN", {"loc.park": "公园", "loc.street": "街上", "loc.lawn": "草坪", "loc.road": "马路", "act.park": "带去公园", "act.street": "去街上逛逛", "toast.outing": "{name}在{place}玩呢，一会儿就回来。", "log.outing_start": "{name}出门去{place}了。", "log.outing_back": "{name}回来了。", "log.assist": "{who}替你照顾了{name}：{label}", });

CY.i18n.register("zh-CN", {"add.helper": "在家办公，自动赚钱，也分担照顾"});

CY.i18n.register("zh-CN", {"intro.p2": "离开书桌去照顾人，那段时间就赚不了钱。钱用来买物品，也可以请保姆。"});

CY.i18n.register("zh-CN", {"people.lead": "设为操纵对象", "people.lead_on": "操纵对象，点击取消"});

CY.i18n.register("zh-CN", {"arch.elder": "典型老人", "arch.toddler1": "1岁孩子", "arch.toddler2": "2岁孩子", "arch.toddler3": "3岁孩子", "arch.toddler4": "4岁孩子", "arch.child12": "12岁孩子", "arch.woman25": "25岁女性", "arch.man25": "25岁男性", "add.helper": "在家，自动分担照顾"});

CY.i18n.register("zh-CN", {"social.chat": "{a}和{b}聊了几句。", "social.play": "{a}陪{b}玩了一会儿。", "social.pet": "{a}摸了摸{b}。"});

CY.i18n.register("zh-CN", {"social.meal": "{n}个人在厨房一起吃了饭。"});

CY.i18n.register("zh-CN", {"status.at": "现在在{room}，爱待在{likes}"});

CY.i18n.register("zh-CN", {"preset.bighouse.label": "热闹的一家", "preset.bighouse.note": "爷爷奶奶，爸爸妈妈，孩子，猫和狗，大家各走各的，也会互相照顾", "preset.name.dad": "爸爸"});

CY.i18n.register("zh-CN", {"status.at": "现在在{room}，爱待在{likes}"});

CY.i18n.register("zh-CN", {"card.title": "角色卡", "card.note": "这一类角色的全部设定，在数据文件夹的 {file}，只读，新建的这一类角色按它来", "card.copy": "复制", "card.none": "没有找到这张卡"});

CY.i18n.register("zh-CN", {"badge.help": "去帮忙"});

CY.i18n.register("zh-CN", {"social.pets": "{a}和{b}追着玩了一阵。"});
CY.i18n.register("zh-CN", {"nanny.st_here": "现在：保姆在家里。", "nanny.st_wait": "现在：保姆不在。每天 {from} 上班，到点才来，来的时候收 {n}。", "nanny.st_rest": "现在：钱不够 {n}，保姆今天休息，明天钱够了再来。", "log.nanny_wait": "保姆接下了活，{from} 上班时间到了就来。"});
CY.i18n.register("zh-CN", {"log.nanny_arrive": "保姆到了，朝家里人点点头，开始忙。", "log.nanny_tea": "保姆在你手边放了一杯茶，没说话，转身去忙了。", "log.nanny_leave": "保姆下班了，留了张条：今天都照看过了。"});
CY.i18n.register("zh-CN", {"corner.day": "第 {n} 天", "share.note": "只在你的设备上生成一张图，放什么内容由你勾选，名字也由你决定。游戏不会上传，也不推荐你分享。", "brand.name": "照顾你", "wd.0": "周日", "wd.1": "周一", "wd.2": "周二", "wd.3": "周三", "wd.4": "周四", "wd.5": "周五", "wd.6": "周六", "tag.1": "手停一停，照看一下家里人。", "tag.2": "没有什么急事，只是有人想让你抬抬头。", "tag.3": "给自己一个离开工作五分钟的小借口。", "tag.4": "没有分数，没人记你做得怎么样。", "tag.5": "你照看他们，他们也在悄悄照看你。", "tag.6": "慢一点，他们会等你。", "app.title": "照顾你 · Care for You"});
CY.i18n.register("zh-CN", {"corner.day": "第 {m} 个月 第 {d} 天"});
CY.i18n.register("zh-CN", {"lbl.interrupt.countdown_seconds": "提醒倒计时，秒", "lbl.economy.work_hours": "工作时段", "lbl.audio.music_volume": "背景音乐", "lbl.audio.sfx_volume": "音效", "set.clock_note": "改它不改变陪伴天数和任何计时。"});
