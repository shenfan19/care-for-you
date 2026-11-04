/* 来客的附加规则：地区与行业的取值，同时到来的组合，家人互动，来客的提问。卡片本身一人一个 YAML 在 visitors 文件夹里，由 tools/build_cards.js 打包进 visitors_packed.js。
   官方卡片都是虚构化的短暂访客：来住几天，满意离开时留下一件无害的纪念品，离开后历史不变。
   选人标准：逝世超过五十年或为文学虚构人物，公认正面，不涉及战争、殖民、宗教创立和政治领袖；写的只是广为记载的习惯和爱好，不做诊断。
   每张卡都记出处 src 和核查结果 review。新增人物先在 visitors 里写卡，打包，再跑 tests/play_test.js。 */
(function (CY) {
  const V = CY.visitors;
  /* 地区和行业标签：选人时按地区均分，行业略微倾斜，每张卡里的 area 和 field 取这里的值。
     area：ea 东亚，sa 南亚与东南亚，wa 西亚与中亚，eu 欧洲，af 非洲，am 美洲与大洋洲。
     field：med 医疗，sci 科学与工程，art 文学艺术，edu 学问与教育，pol 政治与军事，trv 旅行与航海。 */
  V.AREAS = ["ea", "sa", "wa", "eu", "af", "am"];
  V.FIELDS = ["med", "sci", "art", "edu", "pol", "trv"];

  /* ---------- 同时到来的珍稀组合：两位或三位同在家里时，有一句只属于他们的话 ---------- */
  V.MEETS = [];
  const M = (key, ids, zh, en) => {
    V.MEETS.push({ key, ids });
    CY.i18n.register("zh-CN", { ["meet." + key]: zh });
    CY.i18n.register("en", { ["meet." + key]: en });
  };
  M("poets3", ["li_bai", "du_fu", "basho"], "芭蕉读过李白和杜甫的诗，站在一旁行了个礼，三个人从天黑聊到了天亮。", "Basho had read the poems of Li Bai and Du Fu; he stood aside and bowed, and the three talked from dusk to dawn.");
  M("nurses3", ["nightingale", "seacole", "hippocrates"], "希波克拉底问她们：病人最需要什么？三个人几乎同时回答：休息。", "Hippocrates asked the two women what a patient needs most. All three answered almost together: rest.");
  M("numbers3", ["euler", "ramanujan", "al_khwarizmi"], "花拉子米听见他们在算级数，笑着说：算法这个词，还是从我的名字来的。", "Al-Khwarizmi heard them working on series and smiled: the word algorithm comes from my name, you know.");
  M("readers3", ["al_fihri", "sor_juana", "murasaki"], "三位爱读书的女子坐在同一盏灯下，各读各的书，谁也没有打扰谁。", "Three women who loved books sat under one lamp, each reading her own, none disturbing the others.");
  M("friends2", ["li_bai", "du_fu"], "李白和杜甫在院子里碰上了，话没说完两个人先笑了，像认识了很多年。", "Li Bai and Du Fu ran into each other in the yard and laughed before either finished a sentence, as if they had known each other for years.");
  M("nurses2", ["nightingale", "seacole"], "南丁格尔和西科尔认出了彼此，说起很多年前曾经见过一面。", "Florence Nightingale and Mary Seacole recognised each other and recalled having met once, many years ago.");
  M("math2", ["euler", "ramanujan"], "欧拉和拉马努金一起算起了级数，没人看得出谁在教谁。", "Euler and Ramanujan started working on series together, and nobody could tell who was teaching whom.");
  M("music2", ["mozart", "beethoven"], "莫扎特哼了一段旋律，贝多芬在纸上写了几句回应，两个人这样聊了一晚上。", "Mozart hummed a melody and Beethoven wrote a few lines in reply on paper, and they talked like that all evening.");
  M("healers2", ["ibn_sina", "hippocrates"], "伊本·西纳翻出一本旧书，说里面好几处都引用了希波克拉底。", "Ibn Sina pulled out an old book and said several passages in it quoted Hippocrates.");
  M("herbs2", ["li_shizhen", "zhang_zhongjing"], "李时珍翻着随身的本草书，张仲景在一旁补了几句方子的写法，两个人不住地点头。", "Li Shizhen leafed through his herbal while Zhang Zhongjing added a few notes on writing prescriptions, and both kept nodding.");
  M("novels2", ["murasaki", "austen"], "紫式部和简·奥斯汀聊起写小说，两个人都说，写家里人说话最难。", "Murasaki Shikibu and Jane Austen talked about writing novels, and both said that the hardest thing to write is how a family talks.");

  /* ---------- 来客和家人的小互动：按行业和对方的年龄段取一句，一天最多一次 ---------- */
  const FAM = {
    med: { little: ["弯下腰看了看{who}的小脸，说气色不错", "bent down, looked at {who}'s little face and said the colour was good"], child: ["问{who}今天有没有好好喝水，听到回答才放心", "asked {who} whether water had been drunk today, and was only content once told"], adult: ["和{who}聊起了怎么好好睡一觉", "talked with {who} about how to get a proper night's sleep"], elder: ["轻轻按了按{who}的手腕，说看着还稳", "gently pressed {who}'s wrist and said it felt steady"] },
    sci: { little: ["拿一个小东西在{who}面前晃了晃，看着{who}的眼睛跟着转", "waved a small thing before {who} and watched the eyes follow it"], child: ["教{who}数了数窗外飞过的鸟", "taught {who} to count the birds flying past the window"], adult: ["和{who}就着一个问题讨论了很久，谁也没说服谁", "discussed a question with {who} for a long time, and neither convinced the other"], elder: ["请教{who}年轻时的见闻，听得很认真", "asked {who} about things seen in younger days and listened closely"] },
    art: { little: ["对着{who}哼了一小段调子，{who}笑了", "hummed a little tune at {who}, who laughed"], child: ["在纸上给{who}画了一只小动物", "drew a little animal on paper for {who}"], adult: ["给{who}念了几句自己最近想到的句子", "read {who} a few lines thought up lately"], elder: ["坐在{who}旁边，听{who}讲从前的事，没有打断", "sat beside {who} and listened to old stories without interrupting"] },
    edu: { little: ["给{who}念了一页书，念着念着声音越来越轻", "read a page aloud to {who}, the voice growing softer and softer"], child: ["问{who}今天学了什么，听得很认真", "asked {who} what was learned today and listened closely"], adult: ["和{who}说起读书的事，两个人都说想再多读一点", "talked with {who} about reading, and both said they wanted to read more"], elder: ["向{who}请教了一句老话的意思", "asked {who} what an old saying meant"] },
    pol: { little: ["蹲下来，认真地陪{who}玩了一会儿", "crouched down and played earnestly with {who} for a while"], child: ["教{who}摆了一局棋", "taught {who} to set up a game of chess"], adult: ["和{who}商量起了家里一天的安排", "talked over the day's arrangements at home with {who}"], elder: ["给{who}端了杯茶，请{who}多保重", "brought {who} a cup of tea and asked {who} to take care"] },
    trv: { little: ["给{who}讲了一个远方的小故事", "told {who} a small story from far away"], child: ["给{who}看了路上收集的小东西", "showed {who} the little things gathered along the road"], adult: ["和{who}聊起了沿路见过的地方", "talked with {who} about places seen along the way"], elder: ["听{who}讲起老家的路，问得很细", "listened to {who} describe the road back home and asked many questions"] },
  };
  V.FAMLINES = FAM;
  for (const f in FAM) for (const g in FAM[f]) {
    CY.i18n.register("zh-CN", { [`visit.fam.${f}.${g}`]: "{guest}" + FAM[f][g][0] + "。" });
    CY.i18n.register("en", { [`visit.fam.${f}.${g}`]: "{guest} " + FAM[f][g][1] + "." });
  }


  V.NEED_HINTS = 2;

  /* 同辈的老人：来客自己也上了年纪时，和家里的老人是平辈，不是去听对方讲从前 */
  const PEER = {
    med: ["和{who}说起各自常吃的药，互相提醒要按时服用", "compared notes with {who} on their daily medicine and reminded each other to take it on time"],
    sci: ["和{who}并排站在窗前，说起明天会不会下雨", "stood beside {who} at the window and wondered whether it would rain tomorrow"],
    art: ["给{who}念了一句老诗，两个人都点了点头", "recited an old line of verse to {who}, and both of them nodded"],
    edu: ["和{who}聊起各自读过的旧书", "talked with {who} about the old books each had read"],
    pol: ["给{who}倒了杯茶，两个人并排坐着，没怎么说话", "poured {who} a cup of tea, and the two sat side by side without saying much"],
    trv: ["和{who}说起各自家乡的天气和吃食", "talked with {who} about the weather and food back in their home towns"],
  };
  V.FAMPEER = PEER; V.SENIOR_AGE = 50;
  for (const f in PEER) {
    CY.i18n.register("zh-CN", { [`visit.fam.${f}.peer`]: "{guest}" + PEER[f][0] + "。" });
    CY.i18n.register("en", { [`visit.fam.${f}.peer`]: "{guest} " + PEER[f][1] + "." });
  }

  /* ---------- 来客向主角提的问题：类型卡（行业）通用的两条，加上个人特化的一条 ----------
     每条是 [问, 回答一, 回答二, 来客的回应]，中英文写在这里，其他语言在各自的语言包里。rest 是第几个回答会让主角歇一歇。 */
  V.ASKS = {};
  V.GASKS = {};
  const regAsk = (base, row) => ["say", "a0", "a1", "reply"].forEach((k, i) => { CY.i18n.register("zh-CN", { [`${base}.${k}`]: row[0][i] }); CY.i18n.register("en", { [`${base}.${k}`]: row[1][i] }); });
  const ASK = (id, zh, en, rest) => { V.ASKS[id] = { rest }; regAsk(`visitor.${id}.ask`, [zh, en]); };
  const GASK = (key, zh, en) => { V.GASKS[key] = 1; regAsk(`visit.ask.${key}`, [zh, en]); };

  ASK("archimedes", ["给我一个支点，我能撬起地球。你相信吗？", "我信，但先给我一根够长的杠杆。", "不信，我们来辩一辩。", "好！先把你的杠杆画出来，我们一寸一寸地算。"], ["Give me a place to stand and I will move the Earth. Do you believe me?", "I do, but first give me a lever long enough.", "No. Let us debate it.", "Good! Draw me your lever and we shall reckon it inch by inch."]);
  ASK("nightingale", ["你已经忙了很久了。照顾别人的人，也要睡觉。", "好，我歇一会儿。", "等忙完这一阵。", "灯我替你守着，去吧。"], ["You have been busy for a long time. Those who care for others must sleep too.", "All right, I will rest a while.", "After this busy stretch.", "I will keep the lamp for you. Go on."], 0);
  ASK("zhuge", ["家中诸事，你可有章法？我愿为你排个先后。", "请先生指点。", "我心里有数，先生请喝茶。", "急事先办，缓事后办，最要紧的，是别把自己累垮。"], ["Do you have a plan for the household? Let me set an order for it.", "Please advise me.", "I have it in hand. Have some tea.", "Urgent things first, slow things after, and above all do not wear yourself out."]);
  ASK("curie", ["你知道自己每天在做什么吗？只有理解了，才不用害怕。", "我想试着弄明白。", "我只想把事情做完。", "那就一件一件来。不懂的，先写下来。"], ["Do you know what you are doing each day? Only once you understand it, there is nothing to fear.", "I want to try to understand.", "I just want to get it done.", "Then one thing at a time. Write down what you do not understand."]);
  ASK("galois", ["你有没有什么想做，却一直没时间做的事？", "有，我想现在就开始。", "有，但还不是时候。", "别等。我是说，真的，别等。"], ["Is there something you want to do and never had time for?", "Yes, and I want to begin now.", "Yes, but the time is not right.", "Do not wait. I mean it, truly, do not wait."]);
  ASK("da_vinci", ["你有没有认真看过一只鸟怎么停下来？", "没有，你教我看。", "看过，它先收翅膀再收爪子。", "对！世界上最好的老师，就是不说话的东西。"], ["Have you ever properly watched how a bird comes to rest?", "No, teach me to watch.", "I have: wings first, then claws.", "Yes! The best teachers are the ones that say nothing."]);
  ASK("hippocrates", ["说说看，你今天哪里最不舒服？先别想原因，只说感觉。", "有点累，肩膀很沉。", "没什么，我很好。", "嗯。身体先开口，我们再慢慢听。"], ["Tell me, where do you feel worst today? Do not think of causes, only of how it feels.", "A little tired, and my shoulders are heavy.", "Nothing, I am fine.", "Mm. The body speaks first; we shall listen slowly."]);
  ASK("su_shi", ["诗可以等，晚饭不能等。你想吃什么？", "一碗热汤面。", "你定，我吃什么都好。", "好！我来想个办法，让它比看上去更好吃。"], ["Poems can wait, dinner cannot. What would you like to eat?", "A bowl of hot noodle soup.", "You choose, I will eat anything.", "Good! I shall find a way to make it better than it looks."]);
  ASK("li_bai", ["今晚月色好，你说，该不该喝一杯茶？", "该，陪你坐一会儿。", "你喝，我还有事。", "月亮不等人，可它也不赶人，坐一会儿吧。"], ["The moon is fine tonight. Tell me, should we have a cup of tea?", "Yes, I will sit with you a while.", "You go ahead, I still have things to do.", "The moon does not wait for anyone, but it does not hurry anyone either. Sit a while."]);
  ASK("du_fu", ["我常想，若天下人都有一间暖和的屋子，该多好。你觉得呢？", "这里就是一间，您也暖和了吧。", "太难了，能顾好一家就不错。", "能暖一家，便是暖了天下的一角。"], ["I often think how good it would be if everyone had a warm house. What do you think?", "This place is one. Are you comfortable now?", "That is too hard; looking after one family is enough.", "To warm one home is to warm one corner of the world."]);
  ASK("ada", ["你觉得，机器有一天能懂得诗吗？", "也许，如果有人教它。", "不会，诗是人的事。", "好问题。我们都别急着下结论，先把想象力用足。"], ["Do you think a machine might one day understand poetry?", "Perhaps, if someone taught it.", "No, poetry belongs to people.", "A fine question. Let us not rush to conclusions; first use our imagination to the full."]);
  ASK("pasteur", ["不是所有看不见的东西都不存在。你洗手了吗？", "洗了，您放心。", "这就去洗。", "很好。机遇只偏爱有准备的人，健康也是。"], ["Not everything unseen is absent, you know. Have you washed your hands?", "I have, do not worry.", "I will go and wash now.", "Good. Chance favors the prepared, and so does health."]);

  GASK("med.0", ["你今天喝水了吗？吃饭了吗？先管好自己，再管别人。", "喝了，也吃了。", "还没，我这就去。", "好，这是最便宜的良药。"], ["Have you had water today, and a meal? Look after yourself first, then others.", "Yes, both.", "Not yet, I will go now.", "Good. That is the cheapest medicine."]);
  GASK("med.1", ["你睡得怎么样？睡眠是最古老的药方。", "还好。", "不太好，常常醒。", "记下来，晚上我们再一起想办法。"], ["How have you been sleeping? Sleep is the oldest prescription.", "Fine.", "Not well, I keep waking.", "Write it down; tonight we will think of something together."]);
  GASK("sci.0", ["有件事我一直想不明白：为什么孩子一哭，大人就心软？", "因为我们都怕他难过。", "大概是进化吧。", "有意思。两种解释都值得做个实验。"], ["Something puzzles me: why do adults soften the moment a child cries?", "Because we cannot bear their sadness.", "Evolution, probably.", "Interesting. Both explanations deserve an experiment."]);
  GASK("sci.1", ["你有没有发现，今天的影子比昨天短了一点？", "你这么一说，还真是。", "我没注意。", "世界一直在变，只是我们太忙，没空看。"], ["Have you noticed that today's shadows are a little shorter than yesterday's?", "Now that you say it, yes.", "I did not notice.", "The world keeps changing; we are just too busy to look."]);
  GASK("art.0", ["给你出个题：用一个词，形容你今天的心情。", "平静。", "忙乱。", "好词。我记下了，也许哪天会写进诗里。"], ["A riddle for you: one word for your mood today.", "Calm.", "Hectic.", "A good word. I will keep it; perhaps it will end up in a poem."]);
  GASK("art.1", ["你家的光线真好。你有没有在黄昏时什么也不做，就看一会儿？", "有时候。", "没有，总是在忙。", "试试看。最好的画和诗，常常从发呆里来。"], ["The light in your house is lovely. Have you ever done nothing at dusk, just watched it?", "Sometimes.", "No, I am always busy.", "Try it. The best paintings and poems often begin in idleness."]);
  GASK("edu.0", ["你最近读了什么？不必是书，什么都算。", "在读孩子的绘本。", "什么也没读。", "绘本也是书，而且是写得最认真的一类。"], ["What have you been reading lately? It need not be a book; anything counts.", "A children's picture book.", "Nothing at all.", "Picture books count, and they are among the most carefully written."]);
  GASK("edu.1", ["我想问你：教一个人，是为了让他记住，还是为了让他想问？", "为了让他想问。", "为了让他记住。", "两个答案都对，只是顺序不同。"], ["Let me ask: is teaching meant to make people remember, or to make them ask?", "To make them ask.", "To make them remember.", "Both are right; only the order differs."]);
  GASK("pol.0", ["一个家和一个小国差不多：有人做饭，有人扫地，有人负责不吵架。你是哪一样？", "我什么都负责一点。", "我负责不吵架。", "那是最难的一份差事。"], ["A household is much like a small kingdom: someone cooks, someone sweeps, someone keeps the peace. Which are you?", "A little of everything.", "I keep the peace.", "Then yours is the hardest post of all."]);
  GASK("pol.1", ["凡事先看大局，再看细节。你家今天的大局是什么？", "大家都平安。", "我还没想过。", "平安就够了。多少人一辈子都在追这两个字。"], ["See the whole first, then the details. What is the whole of your home today?", "That everyone is safe.", "I have not thought about it.", "Safe is enough. Many chase those two words all their lives."]);
  GASK("trv.0", ["出门在外，我最想念的不是风景，是一碗热饭。你呢？", "我也是。", "我想念安静。", "各有各的乡愁，都值得好好收着。"], ["Away from home, what I miss is not the scenery but a bowl of hot food. And you?", "The same.", "I miss quiet.", "Each has their own homesickness. Both are worth keeping."]);
  GASK("trv.1", ["你有没有想过，这间屋子是你走过的最远的一段路？", "没有，但听起来有道理。", "想过，我每天都在走。", "对，最长的旅程，往往不出门。"], ["Have you ever thought that this house is the farthest road you have walked?", "No, but it sounds right.", "Yes, I walk it every day.", "Quite so. The longest journeys often never leave the door."]);

})(globalThis.CY = globalThis.CY || {});
