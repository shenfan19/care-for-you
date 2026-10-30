/* 性格的台词：每种性格有路过，道谢，闲谈，需求，以及你回答问题之后的回应。性格的台词和声线的台词混在一起选，
   所以有性格的角色说话明显不一样。每个性格十二句：路过 2，道谢 2，闲谈 2，需求 2，回应 4（三个预设回答加自己写的）。
   中文和英文各一份，其他语言先回退到英文。 */
(function (CY) {
  const C = CY.content;
  const T = {
    clingy: {
      zh: ['{ta}一直跟在你后面，你停，{ta}也停。', '{ta}悄悄靠近了一点，又靠近了一点。', '{ta}不肯松手，多待了一会儿。', '{ta}往你身边又挤了挤。', '{ta}总是在你看得见的地方待着。', '{ta}看一眼你在不在，才放心地继续自己的事。', '你在哪呀，我找你。', '{ta}站在你旁边，什么也没说，只是不走。', '{ta}笑得眼睛都弯了，往你这边靠了靠。', '{ta}点点头，还想再多聊一会儿。', '{ta}有点失落，但还是凑近了一点。', '{ta}把你写的话看了很久。'],
      en: ['{ta} followed right behind you, stopping when you stopped.', '{ta} edged a little closer, then a little closer still.', '{ta} would not let go and stayed a while longer.', '{ta} squeezed in a bit closer.', '{ta} kept to places where you could see.', '{ta} checked that you were there before getting on with things.', 'Where are you, I was looking for you.', '{ta} stood beside you, saying nothing, simply not leaving.', '{ta} smiled with eyes curved and leaned toward you.', '{ta} nodded, wanting to talk a little longer.', '{ta} looked a little let down, but moved closer anyway.', '{ta} read what you wrote for a long time.'],
    },
    independent: {
      zh: ['{ta}朝你点了点头，自己忙自己的去了。', '{ta}看了你一眼，像是在确认你没事。', '不用管我，我能行。', '{ta}接过去，说了声谢谢，就自己继续了。', '{ta}安静地做着自己的事，不需要谁来帮忙。', '{ta}自己把东西收拾好了。', '我自己来也可以，不过你在的话更好。', '{ta}看了你一眼，说：不忙的话，帮我一下。', '{ta}点点头：嗯，我明白了。', '{ta}说：行，你说得对。', '{ta}耸耸肩：随你吧。', '{ta}把话听进去了，没多说什么。'],
      en: ['{ta} nodded at you and went back to doing things alone.', '{ta} glanced over as if checking you were fine.', 'No need to fuss over me, I can manage.', '{ta} took it, said thanks, and carried on alone.', '{ta} worked quietly, needing no one’s help.', '{ta} tidied everything up without being asked.', 'I can do it myself, though it is nicer with you here.', '{ta} looked at you: if you are not busy, give me a hand.', '{ta} nodded: yes, I understand.', '{ta} said: fine, you are right.', '{ta} shrugged: whatever you like.', '{ta} took it in without saying much.'],
    },
    nightowl: {
      zh: ['{ta}打了个哈欠，眼睛却亮亮的。', '{ta}说：这会儿才精神。', '谢啦，今晚我还想再待会儿。', '{ta}眼睛一亮：这个时间刚好。', '{ta}总是在别人犯困的时候最有精神。', '{ta}对着夜色发了一会儿呆。', '几点了？还早吧。', '{ta}说：再晚一点我也不困。', '{ta}说：这个时间聊天最合适。', '{ta}眼睛亮亮的：再说一会儿吧。', '{ta}说：明天再说也行，反正我醒着。', '{ta}把你的话放在心里，嘴角弯了弯。'],
      en: ['{ta} yawned, yet eyes stayed bright.', '{ta} said: this is when I wake up.', 'Thanks, I want to stay up a bit longer tonight.', '{ta} lit up: this is just the right hour.', '{ta} always seemed liveliest when others got sleepy.', '{ta} stared into the night for a while.', 'What time is it? It is early still.', '{ta} said: I am not sleepy even later.', '{ta} said: this is the best time to talk.', '{ta} said, eyes bright: tell me a bit more.', '{ta} said: tomorrow is fine, I will be awake anyway.', '{ta} kept your words inside and smiled a little.'],
    },
    earlybird: {
      zh: ['{ta}已经起来好久了。', '{ta}精神很好，像是早就把一天安排好了。', '早点弄好，我就踏实了。', '{ta}点点头：这个时候做刚好。', '{ta}说，早上的空气是最好的。', '{ta}已经把今天要做的事过了一遍。', '现在是什么时候了？我是不是起太早了？', '{ta}看看窗外，说：天刚亮。', '{ta}说：早上说话，心里清清爽爽的。', '{ta}点头：嗯，就这么定了。', '{ta}说：晚上再聊吧，我得早睡了。', '{ta}认真地读了一遍。'],
      en: ['{ta} had been up for ages.', '{ta} was bright and seemed to have planned the day already.', 'If it is done early, I feel settled.', '{ta} nodded: this is just the time to do it.', '{ta} said the morning air was the best.', '{ta} had already gone over everything for the day.', 'What time is it? Did I get up too early?', '{ta} looked out the window: it is just getting light.', '{ta} said: talking in the morning leaves the head clear.', '{ta} nodded: yes, that is settled.', '{ta} said: let us talk in the evening, I need to sleep early.', '{ta} read it through carefully.'],
    },
    picky: {
      zh: ['{ta}看了你一眼，像是有什么不太满意，又没说。', '{ta}说：那个，能不能换个样子？', '还行。要是少一点盐就更好了。', '{ta}尝了尝，勉强点了点头。', '{ta}对着碗里的东西看了半天。', '{ta}说今天的味道不太对。', '有没有别的吃的？', '{ta}翻了翻，说：这个我不太想吃。', '{ta}想了想：好吧，这样也行。', '{ta}说：嗯，不过我有点意见。', '{ta}说：随便吧……其实也不是随便。', '{ta}认真看完，挑出一个字问了问。'],
      en: ['{ta} gave you a look, as if not quite satisfied, and said nothing.', '{ta} said: could it be done a different way?', 'Not bad. A little less salt would be better.', '{ta} tasted it and reluctantly nodded.', '{ta} looked at what was in the bowl for a long time.', '{ta} said today’s flavor was a bit off.', 'Is there anything else to eat?', '{ta} poked around: I do not really feel like this one.', '{ta} thought: all right, that works too.', '{ta} said: fine, but I have a comment.', '{ta} said: whatever… though not quite whatever.', '{ta} read it carefully and asked about one word.'],
    },
    sickly: {
      zh: ['{ta}扶着墙慢慢走过，朝你笑了笑。', '{ta}脸色有点白，说没事。', '谢谢，我今天不太有力气。', '{ta}轻轻地靠了靠，说：歇一会儿就好。', '{ta}坐着的时间比站着的长。', '{ta}总是把外套裹得紧紧的。', '我有点没劲儿……', '{ta}说：不太舒服，不过不严重。', '{ta}轻轻笑了笑：你这么说，我心里踏实。', '{ta}点点头，声音很轻。', '{ta}说：我有点累，改天再聊吧。', '{ta}慢慢读完，闭上眼想了一会儿。'],
      en: ['{ta} walked slowly along the wall and smiled at you.', '{ta} looked a bit pale and said it was nothing.', 'Thank you, I have little strength today.', '{ta} leaned gently and said: a rest will do.', '{ta} spent more time sitting than standing.', '{ta} kept the coat wrapped tight.', 'I feel a bit drained…', '{ta} said: not quite well, but not serious.', '{ta} smiled faintly: hearing you say that settles me.', '{ta} nodded, voice very soft.', '{ta} said: I am tired, let us talk another day.', '{ta} read slowly, then closed both eyes to think.'],
    },
    sturdy: {
      zh: ['{ta}大步走过，精神头十足。', '{ta}朝你挥了挥手：今天身体倍儿棒。', '这点事，小意思。', '{ta}拍拍胸口：我好着呢。', '{ta}一直闲不住，总想找点事做。', '{ta}一口气把东西搬完了。', '有什么要我干的？', '{ta}说：我有劲，你说。', '{ta}笑出了声：好，好！', '{ta}说：行，没问题。', '{ta}说：下回你说点有意思的。', '{ta}大声念了一遍。'],
      en: ['{ta} strode past, full of energy.', '{ta} waved: I feel great today.', 'That is nothing.', '{ta} thumped the chest: I am fine.', '{ta} could not sit still and kept looking for something to do.', '{ta} carried everything over in one go.', 'Anything you need me to do?', '{ta} said: I have the strength, just say.', '{ta} laughed out loud: good, good!', '{ta} said: sure, no problem.', '{ta} said: next time tell me something more interesting.', '{ta} read it out loud.'],
    },
    grumpy: {
      zh: ['{ta}哼了一声，没看你。', '{ta}皱着眉，不知道在不高兴什么。', '哼，这还差不多。', '{ta}嘴上嘟囔着，手却接过去了。', '{ta}一个人在嘀咕着什么。', '{ta}把东西放得啪的一声响。', '怎么这么半天才来。', '{ta}别过脸去：没事。', '{ta}别扭地说：……还行吧。', '{ta}说：哦。过了一会儿，又说：谢谢。', '{ta}说：随便。', '{ta}看完，鼻子里哼了一声，嘴角却动了一下。'],
      en: ['{ta} huffed and did not look at you.', '{ta} frowned, unhappy about something.', 'Hmph, that is more like it.', '{ta} grumbled but took it anyway.', '{ta} muttered about something alone.', '{ta} set things down with a clap.', 'What took you so long.', '{ta} turned away: nothing.', '{ta} said awkwardly: …it is fine, I suppose.', '{ta} said: oh. A while later: thanks.', '{ta} said: whatever.', '{ta} read it, snorted, but the corner of the mouth moved.'],
    },
    cheerful: {
      zh: ['{ta}冲你笑了，笑得很大方。', '{ta}哼着歌从你旁边走过。', '太好了，谢谢你！', '{ta}笑得眼睛都没了。', '{ta}不知道想到什么，自己笑了起来。', '{ta}说：今天天气真好啊。', '今天有什么好玩的事吗？', '{ta}笑着问：你吃了没？', '{ta}笑起来：哈哈，真好！', '{ta}说：嗯嗯，我也这么觉得。', '{ta}笑着说：没事没事，下次也行。', '{ta}一边读一边笑。'],
      en: ['{ta} smiled at you, wide and easy.', '{ta} hummed while passing by.', 'Wonderful, thank you!', '{ta} beamed until the eyes disappeared.', '{ta} thought of something and laughed alone.', '{ta} said: what lovely weather today.', 'Anything fun happen today?', '{ta} asked, smiling: have you eaten?', '{ta} laughed: ha, that is great!', '{ta} said: mm-hm, I think so too.', '{ta} said cheerfully: no worries, next time is fine.', '{ta} laughed while reading.'],
    },
    thirsty: {
      zh: ['{ta}舔了舔嘴唇，看了看水杯。', '{ta}端着空杯子站在你旁边。', '咕嘟咕嘟，真舒服。', '{ta}喝完，满足地呼了口气。', '{ta}已经喝了好几杯水了。', '{ta}随身带着水杯，走到哪儿带到哪儿。', '有水吗？', '{ta}晃了晃空杯子。', '{ta}喝了口水：嗯，你接着说。', '{ta}说：等我喝口水再回你。', '{ta}一边喝水一边点头。', '{ta}喝了一大口，认真地看完。'],
      en: ['{ta} licked the lips and eyed the glass.', '{ta} stood by you with an empty cup.', 'Glug glug, that feels good.', '{ta} finished and let out a satisfied breath.', '{ta} had already had several cups of water.', '{ta} carried a cup everywhere.', 'Is there water?', '{ta} shook the empty cup.', '{ta} sipped: mm, go on.', '{ta} said: let me drink first and I will answer.', '{ta} nodded while drinking.', '{ta} took a big sip and read it carefully.'],
    },
    hearty: {
      zh: ['{ta}摸了摸肚子，朝厨房的方向看了一眼。', '{ta}问：今天吃什么？', '好吃！再来一点？', '{ta}吃得一点不剩，还舔了舔嘴。', '{ta}说起吃的，眼睛就亮了。', '{ta}在厨房门口探来探去。', '什么时候开饭？', '{ta}说：我又有点饿了。', '{ta}说：吃饱了再慢慢聊。', '{ta}说：嗯，不过我想先吃点东西。', '{ta}说：晚饭吃什么？哦，没事，你说你的。', '{ta}一边吃着东西，一边看完了。'],
      en: ['{ta} patted the belly and glanced toward the kitchen.', '{ta} asked: what is for dinner?', 'Delicious! Any more?', '{ta} cleaned the plate and licked the lips.', '{ta} lit up at any mention of food.', '{ta} kept peeking in at the kitchen door.', 'When do we eat?', '{ta} said: I am a bit hungry again.', '{ta} said: let us talk slowly once we are full.', '{ta} said: mm, but I want a bite first.', '{ta} said: what is for dinner? oh, never mind, go on.', '{ta} read it through while eating.'],
    },
    shy: {
      zh: ['{ta}偷偷看了你一眼，又低下头。', '{ta}站在门口，不知道该不该进来。', '谢……谢谢。', '{ta}声音很小，耳朵尖有点红。', '{ta}安安静静地待在角落里。', '{ta}想说什么，又咽回去了。', '那个……你有空吗？', '{ta}小声说：没什么，你忙吧。', '{ta}脸红了，点点头。', '{ta}小声说：嗯。', '{ta}低下头：……好。', '{ta}把你写的话捏在手心里，没出声。'],
      en: ['{ta} stole a glance at you and looked down.', '{ta} stood at the door, unsure whether to come in.', 'Th… thank you.', '{ta} spoke very softly, the tips of the ears pink.', '{ta} stayed quietly in a corner.', '{ta} wanted to say something and swallowed it.', 'Um… are you free?', '{ta} whispered: it is nothing, you carry on.', '{ta} blushed and nodded.', '{ta} said softly: mm.', '{ta} looked down: …okay.', '{ta} held what you wrote in a closed hand, without a sound.'],
    },
    chatty: {
      zh: ['{ta}一看见你就开口了，停不下来。', '{ta}说：对了对了，我跟你说个事。', '谢谢谢谢！你知道吗，其实……', '{ta}一边说话一边接过去，话比动作多。', '{ta}一个人也能说上半天。', '{ta}对着窗外的鸟都能聊两句。', '你听我说，我跟你讲！', '{ta}问：你今天都做了什么？', '{ta}马上接过话头，说个没完。', '{ta}说：哎对了，这让我想起一件事。', '{ta}说：好吧，那我换个话题。', '{ta}看完，又补充了三句。'],
      en: ['{ta} started talking the moment you appeared and could not stop.', '{ta} said: oh right, I have to tell you something.', 'Thank you, thank you! You know, actually…', '{ta} spoke while taking it, with more words than movement.', '{ta} could talk for ages even alone.', '{ta} even chatted with the birds outside.', 'Listen, let me tell you!', '{ta} asked: what did you do today?', '{ta} caught the thread at once and kept going.', '{ta} said: oh, that reminds me of something.', '{ta} said: fine, then I will change the subject.', '{ta} read it and added three more sentences.'],
    },
    curious: {
      zh: ['{ta}歪着头，盯着你手里的东西看。', '{ta}凑过来问：这是什么？', '这是怎么做的？', '{ta}翻来覆去地看，看得很仔细。', '{ta}对着一个小东西研究了好久。', '{ta}问了一个很奇怪的问题。', '为什么会这样呢？', '{ta}拉着你的袖子：你过来看。', '{ta}睁大眼睛：真的吗？然后呢？', '{ta}说：我还想知道得更多。', '{ta}说：嗯……那为什么呢？', '{ta}把你写的话反复念了几遍。'],
      en: ['{ta} tilted the head and stared at what you held.', '{ta} leaned in and asked: what is that?', 'How is this made?', '{ta} turned it over and over, looking closely.', '{ta} studied a small thing for a long time.', '{ta} asked a very odd question.', 'Why does it work like that?', '{ta} tugged your sleeve: come and see.', '{ta} opened both eyes wide: really? and then?', '{ta} said: I want to know more.', '{ta} said: hm… but why?', '{ta} read your words over several times.'],
    },
    stubborn: {
      zh: ['{ta}抱着胳膊，站得笔直。', '{ta}说：我说了，不用。', '我自己能行……好吧，谢了。', '{ta}顿了一下才接过去。', '{ta}认定了的事，谁说也不改。', '{ta}把椅子挪到了自己习惯的位置。', '我说了算。……你觉得呢？', '{ta}说：我不去，不过你要去的话，我也不拦你。', '{ta}想了想：这次听你的。', '{ta}说：嗯……我再想想。', '{ta}说：我不同意。', '{ta}看完，没说话，但没再反驳。'],
      en: ['{ta} crossed both arms and stood straight.', '{ta} said: I told you, no need.', 'I can do it myself… all right, thanks.', '{ta} paused before taking it.', 'Once decided, {ta} would not change for anyone.', '{ta} moved the chair back to its usual spot.', 'It is my call. …What do you think?', '{ta} said: I am not going, but I will not stop you.', '{ta} thought: this once, I will go with you.', '{ta} said: hm… let me think about it.', '{ta} said: I disagree.', '{ta} read it, said nothing, but did not argue again.'],
    },
    gentle: {
      zh: ['{ta}轻轻地朝你点点头。', '{ta}问你：累不累？', '谢谢你，辛苦了。', '{ta}轻声说：你也要照顾好自己。', '{ta}说话总是很轻。', '{ta}把你的杯子悄悄续上了水。', '你还好吗？', '{ta}温和地问：今天过得怎么样？', '{ta}温柔地笑了：你这样说，我很高兴。', '{ta}轻轻点头：我明白。', '{ta}说：没关系，慢慢来。', '{ta}小心地把你写的话读了一遍。'],
      en: ['{ta} gave you a gentle nod.', '{ta} asked: are you tired?', 'Thank you, you have worked hard.', '{ta} said softly: look after yourself too.', '{ta} always spoke softly.', '{ta} quietly refilled your cup.', 'Are you all right?', '{ta} asked gently: how was your day?', '{ta} smiled warmly: I am glad you said that.', '{ta} nodded softly: I understand.', '{ta} said: it is all right, take your time.', '{ta} carefully read what you wrote.'],
    },
    playful: {
      zh: ['{ta}冲你做了个鬼脸，跑开了。', '{ta}突然从背后拍了你一下。', '好玩好玩，再来一次！', '{ta}一把接过去，抛上抛下地玩了起来。', '{ta}把一个小东西抛来抛去。', '{ta}突然追着自己的影子跑了一圈。', '玩什么？玩什么？', '{ta}说：来比赛吧，看谁先到。', '{ta}笑闹着：哈哈，太逗了。', '{ta}说：好呀，那我们玩个游戏吧。', '{ta}说：切，没意思。……开玩笑的。', '{ta}把你的话编成了一段顺口溜。'],
      en: ['{ta} pulled a face and ran off.', '{ta} suddenly tapped you from behind.', 'Fun, fun, one more time!', '{ta} grabbed it and started tossing it up and down.', '{ta} tossed a little thing back and forth.', '{ta} suddenly chased the own shadow around once.', 'What shall we play? What shall we play?', '{ta} said: let us race, see who gets there first.', '{ta} laughed: ha, that is hilarious.', '{ta} said: sure, let us play a game.', '{ta} said: pfft, boring. …just kidding.', '{ta} turned your words into a little rhyme.'],
    },
    anxious: {
      zh: ['{ta}看着你，欲言又止。', '{ta}问：你没事吧？真的没事吗？', '谢谢……我还是有点担心。', '{ta}接过去，手有点抖。', '{ta}又检查了一遍门有没有锁好。', '{ta}说：万一……万一呢。', '会不会出什么事啊？', '{ta}站在你旁边，一直搓着手。', '{ta}松了口气：那就好，那就好。', '{ta}点点头，但看起来还是不太放心。', '{ta}说：这样啊……我有点担心。', '{ta}读了好几遍，每次都很认真。'],
      en: ['{ta} looked at you, about to speak, then stopped.', '{ta} asked: are you all right? really all right?', 'Thank you… I am still a bit worried.', '{ta} took it, hands slightly trembling.', '{ta} checked once more that the door was locked.', '{ta} said: what if… what if.', 'Could something go wrong?', '{ta} stood by you, rubbing both hands.', '{ta} breathed out: good, that is good.', '{ta} nodded but still looked uneasy.', '{ta} said: oh… I am a bit worried.', '{ta} read it several times, seriously each time.'],
    },
    proud: {
      zh: ['{ta}抬着下巴，从你面前走过。', '{ta}整了整衣领，说今天要体面一点。', '我可没有要你帮忙，不过……谢谢。', '{ta}客气地点点头。', '{ta}把衣服抚平了好几次。', '{ta}说：这种事不用让别人知道。', '别人是怎么看的？', '{ta}说：我不要紧，别给大家添麻烦。', '{ta}挺直了腰：你说得对。', '{ta}说：嗯，不过别让别人听见。', '{ta}说：这点事，我自己清楚。', '{ta}把你写的话读完，不动声色地笑了。'],
      en: ['{ta} walked past with chin lifted.', '{ta} straightened the collar and said to look decent today.', 'I did not ask for help, but… thank you.', '{ta} nodded politely.', '{ta} smoothed the clothes several times.', '{ta} said: no one else needs to know about this.', 'What will others think?', '{ta} said: I am fine, do not trouble everyone.', '{ta} stood straighter: you are right.', '{ta} said: mm, but do not let others hear.', '{ta} said: I know this matter well enough myself.', '{ta} read what you wrote and smiled without a word.'],
    },
    sentimental: {
      zh: ['{ta}拿着一张旧照片，看了你一眼。', '{ta}叹了口气：以前啊……', '这让我想起以前。', '{ta}眼睛有点湿，说：谢谢你。', '{ta}摸着一件旧东西，看了很久。', '{ta}说：时间过得真快。', '你还记得吗，那时候……', '{ta}问：你记不记得以前的事？', '{ta}眼眶红了：你还记得。', '{ta}点点头：嗯，这些我都记着。', '{ta}说：以前的事，说不得。', '{ta}把你写的话折好，收了起来。'],
      en: ['{ta} held an old photo and looked at you.', '{ta} sighed: in the old days…', 'This reminds me of the old days.', '{ta} had misty eyes and said: thank you.', '{ta} touched an old thing and looked at it for a long time.', '{ta} said: how fast time goes.', 'Do you remember, back then…', '{ta} asked: do you remember the old times?', '{ta} teared up: you remember.', '{ta} nodded: yes, I keep all of this.', '{ta} said: the past is better left unsaid.', '{ta} folded what you wrote and put it away.'],
    },
  };
  const build = arr => ({
    glance: [arr[0], arr[1]],
    thanks: { default: [arr[2], arr[3]] },
    ambient: { any: [arr[4], arr[5]] },
    request: { any: [arr[6], arr[7]] },
    reply: { a0: [arr[8]], a1: [arr[9]], a2: [arr[10]], custom: [arr[11]] },
  });
  const out = { zh: {}, en: {} };
  for (const id in T) { out.zh[id] = build(T[id].zh); out.en[id] = build(T[id].en); }
  C.TRAIT_LINES = out;
  C.packs['zh-CN'].traits = out.zh;
  if (C.packs.en) C.packs.en.traits = out.en;
})(globalThis.CY = globalThis.CY || {});
