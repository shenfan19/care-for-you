/* 生活里的台词：人形声线的路过和心意补充，回答之后的通用回应，更多的问答和提醒，节日，纪念日，周末，随机小事。
   每条是 [中文, 英文] 一对。事件什么时候发生由后端的规则决定，这里只写说什么。 */
(function (CY) {
  const C = CY.content, V = C.voices;
  const en = () => (C.packs.en.voices = C.packs.en.voices || {});
  const ensure = (obj, v) => (obj[v] = obj[v] || {});
  const GROUPS = { adult: ['parent', 'aunt', 'sibling', 'partner'], elder: ['elder'], child: ['child', 'toddler', 'teen'] };
  const addList = (voice, group, pairs) => { for (const [i, tgt] of [[0, ensure(V, voice)], [1, ensure(en(), voice)]]) tgt[group] = (tgt[group] || []).concat(pairs.map(p => p[i])); };
  const addKeyed = (voice, group, key, pairs) => { for (const [i, tgt] of [[0, ensure(V, voice)], [1, ensure(en(), voice)]]) { tgt[group] = tgt[group] || {}; tgt[group][key] = (tgt[group][key] || []).concat(pairs.map(p => p[i])); } };
  const maxId = voice => C.sayings.filter(s => s.voice === voice).reduce((m, s) => Math.max(m, parseInt(s.id.slice(voice.length), 10) || 0), 0);
  const addSay = (voice, pairs) => { let n = maxId(voice); for (const p of pairs) { n++; const id = voice + String(n).padStart(2, '0'); C.sayings.push({ id, voice, text: p[0] }); C.packs.en.sayings.push({ id, voice, text: p[1] }); } };

  /* ---------- 路过和心意，每种人形声线各补三句 ---------- */
  const GB = {
    elder: { glance: [['{ta}从报纸上抬起眼睛，看了你一下，又低下头。', '{ta} looked up from the newspaper, then back down.'], ['{ta}端着茶杯，慢慢地在客厅里走了一圈。', '{ta} walked slowly around the living room with a cup of tea.'], ['{ta}对着窗外的树发了一会儿呆。', '{ta} gazed at the tree outside for a while.']], back: [['{ta}把一个剥好的橘子放在你桌边。', '{ta} left a peeled tangerine at the edge of your desk.'], ['{ta}把你的鞋子摆正了。', '{ta} set your shoes straight.'], ['{ta}悄悄把你忘在椅背上的外套叠好了。', '{ta} quietly folded the coat you left on the chair.']] },
    parent: { glance: [['{ta}在厨房门口探了探头，又缩回去了。', '{ta} peeked in from the kitchen door and withdrew.'], ['{ta}擦着手，从你背后走过，轻轻拍了拍你的肩。', '{ta} wiped both hands and patted your shoulder as they passed.'], ['{ta}站在门口，像是有话要说。', '{ta} stood at the door as if about to say something.']], back: [['{ta}往你碗里夹了块你爱吃的。', '{ta} put a piece you like into your bowl.'], ['{ta}说：别熬夜，我给你留了灯。', '{ta} said: do not stay up late, I left a light on for you.'], ['{ta}把你的衣服洗好叠好，放在床边。', '{ta} washed and folded your clothes and left them at the bedside.']] },
    aunt: { glance: [['{ta}在隔壁房间打着电话，朝你比了个手势。', '{ta} was on the phone next door and gave you a gesture.'], ['{ta}提着一袋水果走过，朝你挤了挤眼。', '{ta} walked by with a bag of fruit and winked.'], ['{ta}拿着手机，笑着拍了你一张。', '{ta} laughed and snapped a photo of you.']], back: [['{ta}塞给你一个小红包，不许你推。', '{ta} pressed a small red envelope on you and would not hear no.'], ['{ta}给你带来了一盒自己做的点心。', '{ta} brought you a box of homemade snacks.'], ['{ta}说：你呀，该多吃点。', '{ta} said: you really should eat more.']] },
    sibling: { glance: [['{ta}在你桌边晃了一圈，顺手拿走了一块饼干。', '{ta} wandered by your desk and took a cookie.'], ['{ta}给你发了一条没头没尾的消息。', '{ta} sent you a message out of nowhere.'], ['{ta}冲你扬了扬手里的东西，像是在显摆。', '{ta} waved something at you as if showing off.']], back: [['{ta}说：这周末我来，你歇一天。', '{ta} said: I will come this weekend, you take a day off.'], ['{ta}把你的外卖钱悄悄付了。', '{ta} quietly paid for your takeout.'], ['{ta}发来一句：你还好吗。', '{ta} sent: are you okay.']] },
    child: { glance: [['{ta}躲在门后，偷偷看你。', '{ta} hid behind the door, peeking at you.'], ['{ta}拖着一个比自己还大的玩具走过。', '{ta} dragged by a toy bigger than itself.'], ['{ta}对你做了个鬼脸，咯咯笑着跑了。', '{ta} pulled a face at you and ran off giggling.']], back: [['{ta}送你一张画，上面有三个人。', '{ta} gave you a drawing with three people in it.'], ['{ta}把自己最大的那块饼干分了一半给你。', '{ta} shared half of its biggest cookie with you.'], ['{ta}拉着你的手，说：我陪你。', '{ta} took your hand and said: I will keep you company.']] },
    toddler: { glance: [['{ta}摇摇晃晃地朝你走了两步，又坐下了。', '{ta} toddled two steps toward you and sat down.'], ['{ta}指着你，大声喊了一个听不懂的词。', '{ta} pointed at you and shouted an unintelligible word.'], ['{ta}抱着一只小熊，慢慢地看着你。', '{ta} hugged a small bear, watching you slowly.']], back: [['{ta}张开两只手，等着你抱。', '{ta} stretched out both arms, waiting to be held.'], ['{ta}把脸埋在你的怀里，蹭了蹭。', '{ta} buried its face in your chest and nuzzled.'], ['{ta}递给你一个啃了一半的饼干。', '{ta} handed you a half-eaten cookie.']] },
    teen: { glance: [['{ta}戴着耳机从你身边经过，耳机里漏出一点音乐。', '{ta} passed by in headphones, a little music leaking out.'], ['{ta}靠在墙边看手机，偶尔抬头看你一眼。', '{ta} leaned on the wall with a phone, glancing up now and then.'], ['{ta}叹了口气，又把房门关上了。', '{ta} sighed and closed the door again.']], back: [['{ta}把你的杯子续上水，假装是顺手。', '{ta} refilled your cup and pretended it was nothing.'], ['{ta}把音乐关小了，因为你在工作。', '{ta} turned the music down because you were working.'], ['{ta}说：你别太累，我自己能行。', '{ta} said: do not overwork, I can manage myself.']] },
    partner: { glance: [['{ta}隔着房间看了你一眼，笑了一下。', '{ta} caught your eye across the room and smiled.'], ['{ta}从你身后走过，轻轻碰了碰你的头发。', '{ta} walked past and lightly touched your hair.'], ['{ta}端着两杯水，在你旁边坐下了。', '{ta} sat down beside you with two glasses of water.']], back: [['{ta}把你的那份饭热了又热，等你来吃。', '{ta} reheated your meal again and again, waiting for you.'], ['{ta}替你把窗户关上了，说夜里凉。', '{ta} closed the window for you, saying nights get cool.'], ['{ta}靠在你肩上，什么也没说。', '{ta} leaned on your shoulder and said nothing.']] },
    infant: { glance: [['{ta}转过头，用眼睛找你。', '{ta} turned the head, searching for you with both eyes.'], ['{ta}对着天花板上的光斑咿咿呀呀。', '{ta} babbled at the patch of light on the ceiling.'], ['{ta}把小拳头塞进嘴里，看着你。', '{ta} stuffed a tiny fist in its mouth, watching you.'], ['{ta}盯着你手里的东西，眼睛一眨不眨。', '{ta} stared at what you held without blinking.'], ['{ta}被什么逗笑了，肩膀一抖一抖的。', '{ta} was tickled by something, shoulders shaking.'], ['{ta}把脚抬起来，自己抱着玩。', '{ta} lifted both feet and hugged them to play.']], back: [['{ta}抓住你的一根手指，睡着了。', '{ta} fell asleep holding one of your fingers.'], ['{ta}对你笑了，口水挂在下巴上。', '{ta} smiled at you with a bit of drool on the chin.'], ['{ta}把脸贴在你的肩膀上，很安静。', '{ta} laid its face on your shoulder, very quiet.'], ['{ta}揪住你的衣角，不肯放。', '{ta} grabbed a corner of your clothes and would not let go.'], ['{ta}打了个小嗝，满足地眯起眼睛。', '{ta} gave a tiny hiccup and squinted contentedly.'], ['{ta}把小手放在你的脸上，轻轻拍了拍。', '{ta} laid a small hand on your face and patted it.'], ['{ta}靠着你，呼吸一下一下地变慢了。', '{ta} leaned on you, breathing slowing down bit by bit.'], ['{ta}对着你“啊”了一声，像是在道谢。', '{ta} said “ah” to you, as if saying thanks.'], ['{ta}用额头蹭了蹭你的下巴。', '{ta} rubbed a forehead against your chin.']] },
  };
  for (const v in GB) { addList(v, 'glance', GB[v].glance); addList(v, 'cares_back', GB[v].back); }
  addSay('infant', [['{ta}打了个小小的哈欠。', '{ta} gave a tiny yawn.'], ['{ta}对着自己的小脚丫笑了。', '{ta} laughed at its own little feet.']]);
  addSay('toddler', [['{ta}把积木推倒了，又笑了。', '{ta} knocked the blocks down and laughed.']]);
  addSay('teen', [['……哦。', '…oh.']]);

  /* ---------- 回答之后的通用回应，没有性格的角色也会回应 ---------- */
  const REPLY = {
    adult: { a0: [['{ta}笑了：你这么说，我就放心了。', '{ta} smiled: hearing that settles me.'], ['{ta}点点头：嗯，你也要照顾好自己。', '{ta} nodded: yes, look after yourself too.']], a1: [['{ta}想了想，说：好，那就这样。', '{ta} thought, then said: fine, let us leave it at that.'], ['{ta}说：嗯，我明白。', '{ta} said: mm, I understand.']], a2: [['{ta}笑笑：行，不勉强。', '{ta} smiled: fine, no pressure.'], ['{ta}说：好吧，改天再说。', '{ta} said: all right, another day.']], custom: [['{ta}把你写的话认真读了一遍。', '{ta} read what you wrote carefully.'], ['{ta}看完，没说话，嘴角动了动。', '{ta} finished reading and said nothing, a corner of the mouth moving.']] },
    elder: { a0: [['{ta}眯着眼笑了：好，好。', '{ta} smiled with narrowed eyes: good, good.'], ['{ta}点点头，说：你记得就好。', '{ta} nodded: as long as you remember.']], a1: [['{ta}慢慢地说：嗯，那也行。', '{ta} said slowly: mm, that will do.'], ['{ta}说：你说了算。', '{ta} said: whatever you say.']], a2: [['{ta}叹了口气：你忙，你去忙。', '{ta} sighed: you are busy, go on.'], ['{ta}摆摆手：没事，我就是问问。', '{ta} waved a hand: nothing, I was only asking.']], custom: [['{ta}戴上老花镜，把你写的话慢慢看了一遍。', '{ta} put on reading glasses and read your words slowly.'], ['{ta}把你写的话念出了声，念了两遍。', '{ta} read your words out loud, twice.']] },
    child: { a0: [['{ta}咯咯地笑了：嘿嘿。', '{ta} giggled: hee hee.'], ['{ta}一下子扑过来抱住了你。', '{ta} threw both arms around you.']], a1: [['{ta}歪着头想了想：嗯。', '{ta} tilted the head to think: mm.'], ['{ta}说：好吧。', '{ta} said: okay then.']], a2: [['{ta}嘟着嘴：哦……', '{ta} pouted: oh…'], ['{ta}低下头，不说话了。', '{ta} lowered its head and went quiet.']], custom: [['{ta}踮起脚看你写的字，看不懂，但很高兴。', '{ta} stood on tiptoe to see your writing, could not read it but was pleased.'], ['{ta}把你写的话指着一个字一个字地念。', '{ta} pointed at your words and read them one by one.']] },
  };
  for (const g in GROUPS) for (const v of GROUPS[g]) for (const k in REPLY[g]) addKeyed(v, 'reply', k, REPLY[g][k]);

  /* ---------- 更多的问答，三个预设回答，每条 [id, 声线, 中文问, 中文答, 英文问, 英文答] ---------- */
  const ASKS = [
    ['ask_x01', ['aunt'], '你最近睡得好吗？看你眼圈有点黑。', ['还行，别担心。', '不太好，老是醒。', '忙完就睡。'], 'Are you sleeping well? You have dark circles lately.', ['Fine, do not worry.', 'Not great, I keep waking up.', 'I will sleep once things are done.']],
    ['ask_x02', ['aunt'], '你吃饭了吗？姑姑给你带了点东西。', ['还没，正好。', '吃过了，谢谢姑姑。', '你放那儿吧。'], 'Have you eaten? I brought you something.', ['Not yet, perfect timing.', 'I have, thank you.', 'Just leave it there.']],
    ['ask_x03', ['aunt'], '你小时候最爱吃我做的什么，还记得吗？', ['红烧排骨！', '好像是饺子。', '不记得了，你说。'], 'What did you love most from my cooking when you were little?', ['Braised ribs!', 'I think the dumplings.', 'I forget, tell me.']],
    ['ask_x04', ['aunt'], '你妈最近还好吗？我有点想她。', ['挺好的，我替你问问。', '有点累，你打个电话吧。', '我也很久没联系了。'], 'How is your mother? I have been missing her.', ['Doing well, I will ask for you.', 'A little tired, give her a call.', 'I have not been in touch for ages either.']],
    ['ask_x05', ['child'], '你今天开心吗？', ['开心，因为有你。', '还好。', '一般般。'], 'Are you happy today?', ['Yes, because you are here.', 'Okay.', 'So-so.']],
    ['ask_x06', ['child'], '你小时候害怕过什么吗？', ['怕黑，现在还有点。', '怕打雷。', '不记得了。'], 'Were you ever scared when you were little?', ['The dark, a bit still.', 'Thunder.', 'I forget.']],
    ['ask_x07', ['child'], '我们明天做什么好玩的事？', ['一起去公园。', '一起画画。', '明天再说吧。'], 'What fun thing shall we do tomorrow?', ['Go to the park together.', 'Draw together.', 'Let us see tomorrow.']],
    ['ask_x08', ['toddler'], '要不要一起玩？', ['要，来！', '等一下好吗？', '你先玩，我看着你。'], 'Shall we play together?', ['Yes, come!', 'Wait a bit, okay?', 'You play, I will watch.']],
    ['ask_x09', ['toddler'], '饿饿，吃什么？', ['吃饭饭。', '吃水果。', '先喝水。'], 'Hungry, what do we eat?', ['Dinner.', 'Fruit.', 'Water first.']],
    ['ask_x10', ['toddler'], '这是什么？', ['这是小狗。', '这是小鸟。', '你说是什么？'], 'What is this?', ['A puppy.', 'A birdie.', 'What do you think it is?']],
    ['ask_x11', ['teen'], '你觉得我这样做对吗？', ['你想清楚了就好。', '我觉得可以试试。', '我不太确定，一起想想。'], 'Do you think what I am doing is right?', ['If you have thought it through.', 'I think you could try.', 'I am not sure, let us think together.']],
    ['ask_x12', ['teen'], '你上学的时候，也这么烦吗？', ['烦，而且很多。', '还好，后来就过去了。', '忘了。'], 'When you were in school, was it this annoying too?', ['Yes, very much.', 'Not bad, it passed.', 'I forget.']],
    ['ask_x13', ['teen'], '我想一个人待一会儿，可以吗？', ['可以，想说话再叫我。', '好，我给你留灯。', '为什么？出什么事了？'], 'Can I be alone for a bit?', ['Sure, call me when you want to talk.', 'Okay, I will leave a light on.', 'Why? Did something happen?']],
    ['ask_x14', ['partner'], '今天你有什么想对我说的吗？', ['谢谢你。', '我有点累。', '没什么，就想看看你。'], 'Is there anything you wanted to tell me today?', ['Thank you.', 'I am a bit tired.', 'Nothing, just wanted to see you.']],
    ['ask_x15', ['partner'], '周末我们去哪儿走走？', ['去公园吧。', '在家待着就好。', '你定。'], 'Where shall we go this weekend?', ['The park.', 'Staying home is fine.', 'You decide.']],
    ['ask_x16', ['partner'], '我们好久没一起吃饭了。', ['今晚就一起。', '周末吧。', '我最近太忙了，对不起。'], 'We have not eaten together in ages.', ['Tonight, then.', 'This weekend.', 'I have been so busy, sorry.']],
    ['ask_x17', ['partner'], '你有没有觉得我最近变了？', ['没有，你一直是你。', '有一点，不过挺好。', '你怎么这么问？'], 'Do you feel I have changed lately?', ['No, you are always you.', 'A little, but a good kind.', 'Why do you ask?']],
    ['ask_x18', ['parent'], '你最近有没有好好吃饭？', ['有，你别操心。', '有点乱，我改。', '你呢？'], 'Have you been eating properly lately?', ['Yes, do not worry.', 'A bit messy, I will fix it.', 'What about you?']],
    ['ask_x19', ['parent'], '下次你回来，想吃点什么？', ['你做的那个。', '随便，你做什么都好。', '我自己带吃的。'], 'What would you like to eat next time you are back?', ['The thing you make.', 'Anything, whatever you make.', 'I will bring something.']],
    ['ask_x20', ['elder'], '你小时候我给你讲的那个故事，还记得吗？', ['记得，您再讲一遍。', '有点印象。', '忘了，对不起。'], 'Do you remember the story I told you when you were little?', ['I do, tell it again.', 'A little.', 'I forgot, sorry.']],
    ['ask_x21', ['elder'], '今天外面天气好，要不要出去走走？', ['好，我陪您。', '等一会儿，我先忙完。', '今天有点冷。'], 'The weather is nice, shall we go for a walk?', ['Yes, I will go with you.', 'In a bit, after I finish.', 'It is a little cold today.']],
    ['ask_x22', ['sibling'], '你还记得我们小时候吵架的那件事吗？', ['记得，笑死。', '有点印象。', '别提了。'], 'Remember that fight we had as kids?', ['I do, so funny.', 'A little.', 'Do not bring it up.']],
    ['ask_x23', ['sibling'], '最近有没有什么烦心事？', ['有一点，改天说。', '没有。', '你先说。'], 'Anything weighing on you lately?', ['A bit, another day.', 'No.', 'You first.']],
    ['ask_x24', ['parent', 'aunt', 'sibling', 'partner'], '你今天笑了吗？', ['笑了好几次。', '好像没有。', '看到你就笑了。'], 'Did you smile today?', ['Several times.', 'I do not think so.', 'Seeing you made me smile.']],
    ['ask_x25', ['elder', 'parent', 'aunt'], '你觉得最近天冷了吗？', ['有一点，你多穿点。', '还行。', '你冷不冷？'], 'Do you think it has gotten cold lately?', ['A little, wear more.', 'It is fine.', 'Are you cold?']],
    ['ask_x26', ['parent', 'aunt', 'sibling', 'partner', 'elder'], '你最想去的地方是哪里？', ['海边。', '老家。', '哪里都行，有你就好。'], 'Where would you most like to go?', ['The seaside.', 'Home town.', 'Anywhere, as long as you are there.']],
  ];
  for (const [id, voice, zq, za, eq, ea] of ASKS) {
    C.asks.push({ id, say: zq, answers: za, voice });
    C.packs.en.asks.push({ id, say: eq, answers: ea, voice });
  }

  /* ---------- 更多的提醒，轻轻鼓励联系现实里的人 ---------- */
  const NUDGES = [
    ['有一个人，你上次聊天还是去年。', 'There is someone you last chatted with a year ago.'],
    ['今天给谁发一句问候吧，不为什么。', 'Send someone a greeting today, no reason needed.'],
    ['你有多久没有跟家里人好好说话了？', 'How long since you really talked with family?'],
    ['也许有一位老朋友，正等着你的一句话。', 'An old friend might be waiting for a word from you.'],
    ['今天和一个人说说话，不谈工作。', 'Talk to someone today, and not about work.'],
    ['如果想念谁，不妨现在就说。', 'If you miss someone, you could say so now.'],
    ['别忘了，对身边的人说一句谢谢。', 'Do not forget to say thank you to someone near you.'],
    ['有些话，早一点说会比晚一点轻松。', 'Some words are easier to say sooner than later.'],
    ['也许有人今天也在想着你。', 'Someone may be thinking of you today too.'],
    ['下一次见面，约好了吗？', 'Have you set the next time to meet?'],
    ['你上一次拥抱谁，是什么时候？', 'When did you last hug someone?'],
    ['今晚和家里人通个话吧，几分钟就好。', 'Call family tonight, just a few minutes.'],
    ['把今天的一件小事，讲给一个人听。', 'Tell someone about one small thing from today.'],
    ['有人帮过你，你还记得吗？现在可以说声谢谢。', 'Someone helped you once, remember? You can thank them now.'],
    ['这个周末，约一个人一起吃饭吧。', 'This weekend, invite someone for a meal.'],
    ['看看通讯录，有没有一个很久没联系的名字。', 'Look through your contacts for a name you have not messaged in ages.'],
  ];
  NUDGES.forEach((n, i) => {
    const id = 'n' + String(C.nudges.length + 1).padStart(2, '0');
    C.nudges.push({ id, text: n[0] });
    C.packs.en.nudges.push({ id, text: n[1] });
    void i;
  });

  /* ---------- 生活事件的台词：节日，纪念日，周末，早晚，随机小事。每类声线每个键两句 ---------- */
  const LIFE = {
    festival_newyear: { adult: [['{ta}说：新年快乐，今年也要好好的。', '{ta} said: happy new year, let us be well again this year.'], ['{ta}在日历上画了一个圈：新的一年开始了。', '{ta} circled the date on the calendar: a new year begins.']], elder: [['{ta}笑着说：又是一年了，真快啊。', '{ta} smiled: another year, how fast it goes.'], ['{ta}说：新年新气象，你要多保重。', '{ta} said: a new year, take good care of yourself.']], child: [['{ta}跳起来：新年啦！我要新衣服！', '{ta} jumped up: new year! I want new clothes!'], ['{ta}大声说：新年快乐！', '{ta} shouted: happy new year!']] },
    festival_spring: { adult: [['{ta}说：过年了，今天什么都不用急。', '{ta} said: it is the new year, no rush for anything today.'], ['{ta}在厨房里忙着，满屋子都是年的味道。', '{ta} was busy in the kitchen, the house smelling of the festival.']], elder: [['{ta}拿出了压箱底的红包：拿着，别推。', '{ta} took out a red envelope kept in the chest: take it, no refusing.'], ['{ta}说：一家人整整齐齐，就是最好的年。', '{ta} said: the whole family together is the best new year.']], child: [['{ta}举着红包：我有压岁钱！', '{ta} held up a red envelope: I have new year money!'], ['{ta}说：我要放鞭炮！……小的那种。', '{ta} said: I want firecrackers! …the small kind.']] },
    festival_valentine: { adult: [['{ta}笑着说：今天是个适合说点好听话的日子。', '{ta} smiled: today is a good day for kind words.'], ['{ta}悄悄把一朵花放在了你桌上。', '{ta} quietly placed a flower on your desk.']], elder: [['{ta}说：我们那时候，不兴这个。不过……挺好的。', '{ta} said: we did not do this back then. But… it is nice.'], ['{ta}看着你笑：你今天有人惦记吗？', '{ta} smiled at you: is anyone thinking of you today?']], child: [['{ta}把一颗心形的饼干递给你：给你。', '{ta} handed you a heart-shaped cookie: for you.'], ['{ta}说：我最喜欢你了，不告诉别人。', '{ta} said: I like you the most, I will not tell anyone.']] },
    festival_children: { adult: [['{ta}说：今天是儿童节，你也可以当一天小孩。', '{ta} said: it is Children’s Day, you can be a kid for a day too.'], ['{ta}翻出了一张小时候的照片，笑了很久。', '{ta} dug out a childhood photo and laughed for a long while.']], elder: [['{ta}说：小孩子的节日，让孩子们高兴高兴。', '{ta} said: a day for children, let them be happy.'], ['{ta}翻着旧相册：你们小时候也过这个节。', '{ta} flipped the old album: you celebrated this one too when small.']], child: [['{ta}大喊：今天是我的节日！', '{ta} shouted: today is my day!'], ['{ta}问：今天可以多吃一块糖吗？', '{ta} asked: can I have one more candy today?']] },
    festival_midautumn: { adult: [['{ta}说：中秋了，今晚的月亮一定很圆。', '{ta} said: it is Mid-Autumn, tonight’s moon will surely be round.'], ['{ta}切开一块月饼，分了你一半。', '{ta} cut a mooncake and gave you half.']], elder: [['{ta}看着窗外：月亮出来了，一家人在一起才叫圆。', '{ta} looked out: the moon is up, family together is what makes it whole.'], ['{ta}说：小时候我们也这样赏月。', '{ta} said: we watched the moon like this when we were small.']], child: [['{ta}指着天上：月亮，大饼！', '{ta} pointed at the sky: moon, big cookie!'], ['{ta}说：我想吃月饼，要有蛋黄的。', '{ta} said: I want a mooncake, the kind with yolk.']] },
    festival_national: { adult: [['{ta}说：放假了，今天什么都不干也行。', '{ta} said: a holiday, doing nothing is fine today.'], ['{ta}看着窗外，说：街上好热闹。', '{ta} looked out: the street is so lively.']], elder: [['{ta}说：这个日子，我们小时候是要升旗的。', '{ta} said: we used to raise the flag on this day when we were young.'], ['{ta}把电视打开，看着节日的画面。', '{ta} turned on the TV and watched the festive scenes.']], child: [['{ta}说：放假！不用上学！', '{ta} said: holiday! no school!'], ['{ta}举着一面小旗，满屋子跑。', '{ta} ran around the house with a little flag.']] },
    festival_halloween: { adult: [['{ta}戴着一个很好笑的面具，从你身后冒了出来。', '{ta} popped up behind you in a very silly mask.'], ['{ta}说：今晚要不要吓一吓别人？', '{ta} said: shall we scare someone tonight?']], elder: [['{ta}看着你们折腾，说：这种热闹，真好。', '{ta} watched you all and said: this kind of fuss is nice.'], ['{ta}被面具吓了一跳，然后笑出了声。', '{ta} jumped at the mask, then burst out laughing.']], child: [['{ta}披着一块床单：呜——我是鬼！', '{ta} draped a bedsheet: whoo, I am a ghost!'], ['{ta}问：不给糖就捣蛋，可以吗？', '{ta} asked: trick or treat, can I?']] },
    festival_christmas: { adult: [['{ta}说：圣诞快乐，今晚早点回来。', '{ta} said: merry Christmas, come home early tonight.'], ['{ta}把一个小小的礼物放在了桌上。', '{ta} left a small gift on the table.']], elder: [['{ta}说：外国的节日，不过热闹一下也好。', '{ta} said: a foreign festival, but some cheer does no harm.'], ['{ta}看着你们装饰，笑着说好看。', '{ta} watched you decorate and said it looked nice.']], child: [['{ta}说：圣诞老人今晚会来吗？', '{ta} asked: will Santa come tonight?'], ['{ta}把袜子挂在了床头。', '{ta} hung a stocking at the bedpost.']] },
    anniv_7: { adult: [['{ta}说：这几天，你一直都在，谢谢你。', '{ta} said: you have been here these days, thank you.']], elder: [['{ta}说：这才几天，我就习惯了你在这儿。', '{ta} said: only a few days, and I am already used to you here.']], child: [['{ta}说：我们已经一起玩了好多天了！', '{ta} said: we have been playing together for so many days!']] },
    anniv_30: { adult: [['{ta}说：一个月了，时间过得真快。', '{ta} said: a month already, time flies.']], elder: [['{ta}说：一个月了。这一个月，我睡得比以前安稳。', '{ta} said: a month. I have slept more soundly this month.']], child: [['{ta}说：一个月！我数过的。', '{ta} said: one month! I counted.']] },
    anniv_100: { adult: [['{ta}说：一百天了，我记着呢。', '{ta} said: a hundred days, I have been keeping track.']], elder: [['{ta}说：一百天，一百个日子，我都记着。', '{ta} said: a hundred days, I remember every one.']], child: [['{ta}张开两只手：一百，一百天！', '{ta} spread both hands: a hundred, a hundred days!']] },
    anniv_365: { adult: [['{ta}说：一整年了。这一年，谢谢你。', '{ta} said: a whole year. Thank you for this year.']], elder: [['{ta}说：一整年了。我这把年纪，最怕的是孤单，你让我不怕了。', '{ta} said: a whole year. At my age loneliness is the fear, and you took it away.']], child: [['{ta}抱着你：一年了，一年了！我长高了一点点。', '{ta} hugged you: a year, a year! I grew a tiny bit.']] },
    weekend: { adult: [['{ta}说：周末了，今天不用赶时间。', '{ta} said: weekend, no need to hurry today.'], ['{ta}伸了个懒腰：周末，就该这样。', '{ta} stretched: weekends are meant to be like this.']], elder: [['{ta}说：周末了，家里人都在，热闹。', '{ta} said: weekend, everyone is home, lively.'], ['{ta}说：周末你也歇歇，别老盯着我。', '{ta} said: rest on the weekend too, stop watching over me.']], child: [['{ta}大喊：周末！可以玩一天！', '{ta} shouted: weekend! we can play all day!'], ['{ta}说：今天我不想写作业。', '{ta} said: I do not want to do homework today.']] },
    greet_morning: { adult: [['{ta}说：早，睡得好吗？', '{ta} said: morning, did you sleep well?'], ['{ta}端着两杯热水，递了你一杯。', '{ta} handed you one of two cups of hot water.']], elder: [['{ta}说：醒啦？我早就醒了。', '{ta} said: awake? I have been up for ages.'], ['{ta}朝你点点头：今天天气不错。', '{ta} nodded: nice weather today.']], child: [['{ta}揉着眼睛：早……', '{ta} rubbed both eyes: morning…'], ['{ta}一下子扑过来：早上好！', '{ta} pounced on you: good morning!']] },
    goodnight: { adult: [['{ta}说：早点睡，晚安。', '{ta} said: go to bed early, good night.'], ['{ta}关了客厅的灯：晚安。', '{ta} switched off the living room light: good night.']], elder: [['{ta}说：天晚了，你也别熬着。', '{ta} said: it is late, do not stay up.'], ['{ta}慢慢地说：晚安，明天见。', '{ta} said slowly: good night, see you tomorrow.']], child: [['{ta}打着哈欠：晚安……', '{ta} yawned: good night…'], ['{ta}抱着枕头说：我要睡觉了。', '{ta} hugged a pillow: I am going to sleep.']] },
    lunch: { adult: [['{ta}问：中午吃什么？', '{ta} asked: what is for lunch?'], ['{ta}看了看时间：该吃饭了。', '{ta} checked the time: time to eat.']], elder: [['{ta}说：该吃饭了，别饿着。', '{ta} said: time to eat, do not go hungry.'], ['{ta}说：中午我想喝点热汤。', '{ta} said: I would like hot soup for lunch.']], child: [['{ta}喊：我饿了！饭饭！', '{ta} shouted: hungry! food!'], ['{ta}拉着你的衣角：吃饭啦。', '{ta} tugged your sleeve: lunchtime.']] },
    feeling_low: { adult: [['{ta}安静地坐了一会儿，说：我没事，就是有点累。', '{ta} sat quietly for a while: I am fine, just tired.'], ['{ta}靠在沙发上，闭着眼睛。', '{ta} leaned on the sofa with both eyes closed.']], elder: [['{ta}说：今天有点没精神。你别担心。', '{ta} said: a bit listless today. Do not worry.'], ['{ta}慢慢地靠在椅背上，歇着。', '{ta} slowly leaned back in the chair to rest.']], child: [['{ta}趴在桌上：我不想动。', '{ta} lay on the table: I do not want to move.'], ['{ta}蔫蔫地抱着一个玩具。', '{ta} hugged a toy listlessly.']] },
    rain: { adult: [['{ta}看着窗外：下雨了。', '{ta} looked outside: it is raining.'], ['{ta}把窗户关小了一点，听着雨声。', '{ta} closed the window a little and listened to the rain.']], elder: [['{ta}说：下雨了，我的腿又要疼了。', '{ta} said: rain, my legs will ache again.'], ['{ta}坐在窗边，看雨一滴一滴落下来。', '{ta} sat by the window, watching the rain fall drop by drop.']], child: [['{ta}趴在窗边：下雨了！我想踩水坑！', '{ta} pressed to the window: rain! I want to jump in puddles!'], ['{ta}对着玻璃哈了口气，画了一个笑脸。', '{ta} breathed on the glass and drew a smiley.']] },
    power_cut: { adult: [['{ta}摸出了手电：停电了，别慌。', '{ta} found a flashlight: power cut, do not panic.'], ['{ta}点起一支蜡烛，屋里亮了一小圈。', '{ta} lit a candle and a small circle of light filled the room.']], elder: [['{ta}说：我们以前常停电，习惯了。', '{ta} said: we often had blackouts before, I am used to it.'], ['{ta}在黑暗里摸索着，说：你在哪呢？', '{ta} felt around in the dark: where are you?']], child: [['{ta}一下子钻进了你怀里：黑黑的！', '{ta} dived into your arms: it is dark!'], ['{ta}拿着手电筒，照着自己的脸做鬼脸。', '{ta} held a flashlight under its face to look spooky.']] },
    package: { adult: [['{ta}说：有你的快递，放在门口了。', '{ta} said: a package for you, left at the door.'], ['{ta}拿着一个大纸箱：这是什么呀？', '{ta} held a large box: what is this?']], elder: [['{ta}说：来了个快递，我也不知道是什么。', '{ta} said: a package came, I do not know what is in it.'], ['{ta}把纸箱放得端端正正，等你回来拆。', '{ta} set the box straight and waited for you to open it.']], child: [['{ta}拖着一个箱子过来：我来拆！', '{ta} dragged a box over: I will open it!'], ['{ta}钻进了空纸箱里，不出来了。', '{ta} crawled into the empty box and refused to come out.']] },
    neighbor: { adult: [['{ta}说：邻居来串门了，在门口聊了好一会儿。', '{ta} said: a neighbor dropped by and chatted at the door for ages.'], ['{ta}从门口拿回一碗别人送来的汤。', '{ta} brought back a bowl of soup a neighbor had sent.']], elder: [['{ta}说：隔壁王家来了，我们说了好些话。', '{ta} said: the neighbors came by, we talked a long while.'], ['{ta}高兴地说：很久没人来聊天了。', '{ta} said happily: no one had come to chat in ages.']], child: [['{ta}说：邻居给了我一颗糖！', '{ta} said: the neighbor gave me a candy!'], ['{ta}躲在门后，偷看来串门的人。', '{ta} hid behind the door, peeking at the visitor.']] },
    old_song: { adult: [['{ta}哼起了一首很老的歌，哼着哼着笑了。', '{ta} hummed a very old song and laughed while humming.'], ['{ta}说：这首歌，让我想起了高中。', '{ta} said: this song reminds me of high school.']], elder: [['{ta}在收音机里听到一首老歌，跟着轻轻哼。', '{ta} heard an old song on the radio and hummed along softly.'], ['{ta}说：这首歌，我年轻时候常听。', '{ta} said: I often listened to this when I was young.']], child: [['{ta}跟着音乐摇了起来，不成调。', '{ta} swayed to the music, off key.'], ['{ta}问：这是什么歌？好听。', '{ta} asked: what song is this? it sounds nice.']] },
    old_photo: { adult: [['{ta}翻到了一张旧照片，递给你看。', '{ta} found an old photo and handed it to you.'], ['{ta}说：你看你以前，笑得多开心。', '{ta} said: look how happy you looked back then.']], elder: [['{ta}拿着一张发黄的照片，看了很久。', '{ta} held a yellowed photo and looked for a long time.'], ['{ta}说：这是你小时候。你不记得了吧。', '{ta} said: this is you as a child. You do not remember.']], child: [['{ta}指着照片：这是谁？是我吗？', '{ta} pointed at the photo: who is this? is it me?'], ['{ta}把照片贴在脸上，笑了。', '{ta} held the photo against its cheek and laughed.']] },
  };
  for (const key in LIFE) for (const g in LIFE[key]) for (const v of GROUPS[g]) addKeyed(v, 'life', key, LIFE[key][g]);
  const ANNIV2 = {
    anniv_7: { adult: [['{ta}笑了笑：习惯有你在身边了。', '{ta} smiled: I am getting used to you being around.']], elder: [['{ta}说：这几天，家里有了声音。', '{ta} said: these days the house has had sound in it.']], child: [['{ta}说：你每天都在，真好。', '{ta} said: it is nice that you are here every day.']] },
    anniv_30: { adult: [['{ta}说：这一个月，每天都有点小事可以记住。', '{ta} said: this month, every day gave me some small thing to remember.']], elder: [['{ta}说：一个月，我数着日子过的。', '{ta} said: a month, I counted the days.']], child: [['{ta}说：一个月，你还是陪着我。', '{ta} said: one month, and you are still with me.']] },
    anniv_100: { adult: [['{ta}说：一百天里，你没有一天不在。', '{ta} said: in a hundred days there was none where you were not here.']], elder: [['{ta}说：一百天，比我想的要快。', '{ta} said: a hundred days, faster than I thought.']], child: [['{ta}说：一百天，我给你画一张画。', '{ta} said: a hundred days, I will draw you a picture.']] },
    anniv_365: { adult: [['{ta}说：一年了，我们都不太一样了。', '{ta} said: a year, and we have both changed a little.']], elder: [['{ta}说：一年，四季都有你在。', '{ta} said: a year, with you through all four seasons.']], child: [['{ta}说：一年，我已经认得你的脚步声了。', '{ta} said: a year, and I know the sound of your steps.']] },
  };
  for (const key in ANNIV2) for (const g in ANNIV2[key]) for (const v of GROUPS[g]) addKeyed(v, 'life', key, ANNIV2[key][g]);
  /* 外出回来，宝宝和爷爷一起玩 */
  const OUT = {
    outing_back: {
      adult: [['{ta}从外面回来，脸上带着风。', '{ta} came back with wind on the face.'], ['{ta}把外套挂好，说：外面的空气真好。', '{ta} hung up the coat and said: the air outside was lovely.']],
      elder: [['{ta}慢慢走回来，说：今天走了不少路。', '{ta} walked slowly back and said: I walked quite a way today.'], ['{ta}坐下来，满足地叹了口气。', '{ta} sat down and let out a contented sigh.']],
      child: [['{ta}蹦蹦跳跳地跑回来：好玩！', '{ta} bounded back: that was fun!'], ['{ta}手里攥着一片捡来的叶子。', '{ta} held a leaf picked up along the way.']],
    },
  };
  for (const key in OUT) for (const g in OUT[key]) for (const v of GROUPS[g]) addKeyed(v, 'life', key, OUT[key][g]);
  const EXTRA = {
    infant: { outing_back: [['{ta}回到家，趴在你肩上睡着了。', '{ta} came home and fell asleep on your shoulder.']], play_together: [['{ta}在垫子上咯咯地笑，朝老人伸着手。', '{ta} giggled on the mat, reaching for the elder.'], ['{ta}把一个玩具塞到了老人手里。', '{ta} pushed a toy into the elder’s hand.']] },
    toddler: { outing_back: [['{ta}回到家，还在说着路上看到的狗。', '{ta} came home still talking about the dog seen on the way.']], play_together: [['{ta}把积木一块块递给老人：给！', '{ta} handed the blocks to the elder one by one: here!'], ['{ta}坐在老人腿上，笑得停不下来。', '{ta} sat on the elder’s lap, unable to stop laughing.']] },
    elder: { play_with_baby: [['{ta}蹲在垫子边，慢慢地逗着孩子。', '{ta} crouched by the mat and slowly played with the little one.'], ['{ta}学着孩子的样子拍手，笑出了声。', '{ta} clapped like the child and laughed out loud.']] },
    dog: { outing_back: [['{ta}回到家，喝了一大口水，趴下了。', '{ta} came home, drank a big gulp of water and lay down.']] },
    cat: { outing_back: [['{ta}好奇地嗅着你身上带回来的外面的味道。', '{ta} sniffed curiously at the outdoor smell you brought back.']] },
  };
  for (const v in EXTRA) for (const key in EXTRA[v]) addKeyed(v, 'life', key, EXTRA[v][key]);
  C.LIFE_KEYS = Object.keys(LIFE).concat('outing_back');
})(globalThis.CY = globalThis.CY || {});
