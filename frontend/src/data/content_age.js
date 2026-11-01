/* 按年龄说话：宝宝几个月，孩子几岁，说的话不一样。每种声线里的 age 分段，优先于声线里的通用台词。
   分段：婴儿 m0 零到三个月，m4 四到六个月，m7 七到十二个月；幼儿 y1 一岁，y2 两岁，y3 三岁；儿童 c4 四到六岁，c7 七到十二岁。
   另外，十三岁以下的角色不用成人口吻的性格台词，每个性格有一对只描写神态的句子。每条是 [中文, 英文]。 */
(function (CY) {
  const C = CY.content, V = C.voices;
  const en = () => (C.packs.en.voices = C.packs.en.voices || {});

  const AGE = {
    infant: {
      m0: {
        request: { thirst: [['{ta}张着小嘴，细细地哼了一声。', '{ta} opened the tiny mouth and gave a thin whimper.']], hunger: [['{ta}哇地一声哭了，小嘴一直在找。', '{ta} wailed, the little mouth searching.'], ['{ta}把小拳头塞进嘴里，哭得断断续续。', '{ta} sucked a tiny fist and cried in fits.']], rest: [['{ta}眼皮沉沉的，哼哼唧唧。', '{ta} had heavy eyelids and fussed.']], company: [['{ta}小声哭着，等人来抱。', '{ta} cried softly, waiting to be held.']], play: [['{ta}睁着眼，盯着一团光。', '{ta} stared wide-eyed at a patch of light.']], diaper: [['{ta}扭了扭，哭了起来。', '{ta} squirmed and began to cry.']] },
        thanks: { default: [['{ta}安静了下来。', '{ta} grew quiet.'], ['{ta}小嘴动了动。', '{ta}’s little mouth moved.'], ['{ta}慢慢合上了眼睛。', '{ta} slowly closed both eyes.']] },
        glance: [['{ta}的眼睛慢慢转过来，找着声音。', '{ta}’s eyes turned slowly, finding the sound.'], ['{ta}被一点声响吓了一跳，又安静了。', '{ta} startled at a small noise and settled again.'], ['{ta}盯着天花板上晃动的光斑，看了很久。', '{ta} stared at the moving patch of light on the ceiling for a long while.'], ['{ta}把手举到眼前，认真地看着。', '{ta} lifted a hand in front of the eyes and studied it.'], ['{ta}打了个小小的哈欠，又睁开了眼睛。', '{ta} gave a tiny yawn and opened both eyes again.'], ['{ta}的小脚在被子里蹬了两下。', '{ta} kicked both little feet under the blanket.']],
      },
      m4: {
        request: { thirst: [['{ta}咿咿呀呀，嘴巴一张一合。', '{ta} cooed, mouth opening and closing.']], hunger: [['{ta}哭着，小手乱抓。', '{ta} cried, little hands grabbing at the air.'], ['{ta}咿呀咿呀，嘬着手指。', '{ta} babbled and sucked a finger.']], rest: [['{ta}揉着眼睛，咿呀地哼着。', '{ta} rubbed both eyes and hummed a coo.']], company: [['{ta}伸着双手，咿呀咿呀地叫你。', '{ta} stretched both arms and cooed for you.']], play: [['{ta}咯咯地笑，对着你挥小手。', '{ta} giggled and waved a small hand at you.']], diaper: [['{ta}蹬着小腿，哼哼唧唧。', '{ta} kicked both legs and fussed.']] },
        thanks: { default: [['{ta}咯咯地笑了。', '{ta} giggled.'], ['{ta}咿呀了两声。', '{ta} cooed twice.'], ['{ta}抓住了你的手指。', '{ta} grasped your finger.']] },
        glance: [['{ta}看见你，咧开没牙的嘴笑了。', '{ta} saw you and grinned a toothless grin.'], ['{ta}翻了个身，咿咿呀呀地说着话。', '{ta} rolled over, cooing away.'], ['{ta}抓着自己的脚丫，玩得很认真。', '{ta} caught both feet and played with them very seriously.'], ['{ta}对着玩具咯咯地笑出了声。', '{ta} giggled out loud at the toy.'], ['{ta}吹了个口水泡泡，自己吓了一跳。', '{ta} blew a bubble and startled at it.'], ['{ta}趴着，努力抬起头来看你。', '{ta} lay on the tummy and worked hard to lift the head toward you.'], ['{ta}把小手伸向你，够了又够。', '{ta} reached a small hand toward you again and again.']],
      },
      m7: {
        request: { thirst: [['{ta}拍着桌子，嘴里念着“啊啊”。', '{ta} slapped the table, saying “ah ah”.']], hunger: [['{ta}“啊——啊——”地叫，指着吃的。', '{ta} called “ah, ah” and pointed at the food.'], ['{ta}爬到你脚边，仰着头“嘛嘛”地叫。', '{ta} crawled to your feet and looked up, babbling “ma ma”.']], rest: [['{ta}趴在地上，揉着眼睛哼哼。', '{ta} lay on the floor, rubbing both eyes and fussing.']], company: [['{ta}爬过来，拉着你的裤腿“嘛嘛”。', '{ta} crawled over and tugged your trousers, babbling “ma ma”.']], play: [['{ta}“吧吧吧”地对着玩具说话。', '{ta} babbled “ba ba ba” at the toy.']], diaper: [['{ta}扭着屁股，皱着小脸。', '{ta} wriggled the bottom and scrunched the face.']] },
        thanks: { default: [['{ta}“嘛嘛”地叫了一声。', '{ta} called out a “ma ma”.'], ['{ta}拍着小手，笑得露出两颗牙。', '{ta} clapped and laughed, showing two teeth.'], ['{ta}把脸埋进你怀里。', '{ta} buried the face in your chest.']] },
        glance: [['{ta}扶着沙发站了一会儿，回头看你。', '{ta} stood holding the sofa for a moment and looked back at you.'], ['{ta}“吧——吧——”地对你说了一长串。', '{ta} told you a long string of “ba ba”.'], ['{ta}拿着积木敲了敲地板，听着响声。', '{ta} knocked a block on the floor and listened to the sound.'], ['{ta}爬了几步，回头看你有没有跟上来。', '{ta} crawled a few steps and looked back to check you were following.'], ['{ta}把一块饼干递给你，等着你吃。', '{ta} held out a cracker and waited for you to eat it.'], ['{ta}指着窗外，“啊！啊！”', '{ta} pointed out the window: “ah! ah!”']],
      },
    },
    toddler: {
      y1: {
        request: { thirst: [['“水……水。”', '“Wa… wa.”']], hunger: [['“饭……饭。”{ta}指着碗。', '“Foo… foo.” {ta} pointed at the bowl.']], rest: [['{ta}揉着眼睛，“觉觉”。', '{ta} rubbed both eyes: “nigh-nigh”.']], company: [['“{title}！{title}！”{ta}朝你伸着手。', '“{title}! {title}!” {ta} reached out to you.']], play: [['“玩！”{ta}拿起一个球。', '“Play!” {ta} picked up a ball.']], diaper: [['“湿湿。”{ta}拉着裤子。', '“Wet.” {ta} tugged at the trousers.']] },
        thanks: { default: [['“好。”{ta}点点头。', '“Yes.” {ta} nodded.'], ['“还要！”', '“More!”'], ['{ta}咧嘴笑，“哦哦哦”。', '{ta} grinned: “oh oh oh”.']] },
        glance: [['{ta}摇摇晃晃地走了两步，坐下了。', '{ta} wobbled two steps and sat down.'], ['{ta}指着窗外：“鸟！”', '{ta} pointed out the window: “Bird!”']],
      },
      y2: {
        request: { thirst: [['“要喝水。”', '“Want water.”'], ['“{title}，水水。”', '“{title}, wa-wa.”']], hunger: [['“要吃饭。”', '“Want food.”'], ['“饿饿，要饭饭。”', '“Hungry, want din-din.”']], rest: [['“想睡觉。”', '“Want sleep.”']], company: [['“{title}来，陪我。”', '“{title} come, play with me.”']], play: [['“要玩，一起玩。”', '“Want play, play together.”']], diaper: [['“尿尿了。”', '“Pee pee.”']] },
        thanks: { default: [['“谢谢。”{ta}小声说。', '“Thank you.” {ta} said quietly.'], ['“好吃！还要。”', '“Yummy! More.”'], ['“{title}，抱抱。”', '“{title}, hug.”']] },
        glance: [['{ta}抱着一只小熊，跟小熊说着话。', '{ta} hugged a small bear and talked to it.'], ['{ta}指着你：“{title}！看！”', '{ta} pointed at you: “{title}! Look!”']],
      },
      y3: {
        request: { thirst: [['“我想喝水，可以吗？”', '“I want some water, can I?”']], hunger: [['“我饿了，今天吃什么？”', '“I am hungry, what do we have today?”']], rest: [['“我困了，你陪我睡好吗？”', '“I am sleepy, will you stay with me?”']], company: [['“{title}，你过来陪我玩。”', '“{title}, come and play with me.”']], play: [['“我们玩积木吧！”', '“Let us play with blocks!”']], diaper: [['“我要去厕所。”', '“I need to go to the toilet.”']] },
        thanks: { default: [['“谢谢{title}！”', '“Thank you, {title}!”'], ['“我自己也可以的。”', '“I can do it myself too.”'], ['“再来一次好不好？”', '“Can we do it again?”']] },
        glance: [['{ta}问：“{title}，为什么天黑了？”', '{ta} asked: “{title}, why is it dark?”'], ['{ta}把画给你看：“这是你。”', '{ta} showed you a drawing: “This is you.”']],
      },
    },
    child: {
      c4: {
        request: { thirst: [['“我渴了。”', '“I am thirsty.”']], hunger: [['“{title}，我饿了，有吃的吗？”', '“{title}, I am hungry, is there anything to eat?”']], rest: [['“我有点困。”', '“I am a little sleepy.”']], company: [['“{title}，你陪我玩一会儿好不好？”', '“{title}, will you play with me for a bit?”']], play: [['“我们来玩游戏吧！”', '“Let us play a game!”']] },
        thanks: { default: [['“谢谢！我最喜欢你了。”', '“Thank you! I like you the most.”'], ['“我自己会了，你看！”', '“I can do it myself, look!”']] },
        glance: [['{ta}举着一张画朝你跑来。', '{ta} ran toward you holding up a drawing.'], ['{ta}对着你敬了个不标准的礼。', '{ta} gave you a clumsy salute.']],
      },
      c7: {
        request: { thirst: [['“有水吗？”', '“Is there any water?”']], hunger: [['“有什么吃的吗？”', '“Is there anything to eat?”']], rest: [['“我有点累了。”', '“I am a bit tired.”']], company: [['“{title}，你现在忙吗？我有件事想说。”', '“{title}, are you busy? I want to tell you something.”']], play: [['“要不要一起玩个游戏？”', '“Want to play a game together?”']], homework: [['“这道题我不会，你能看看吗？”', '“I cannot do this one, could you take a look?”']] },
        thanks: { default: [['“谢谢，我懂了。”', '“Thanks, I get it now.”'], ['“嗯，这样就对了。”', '“Mm, that is right now.”']] },
        glance: [['{ta}在书桌前写着什么，抬头看了你一眼。', '{ta} was writing something at the desk and looked up at you.'], ['{ta}小声嘀咕着今天学校里的事。', '{ta} muttered quietly about today at school.']],
      },
    },
  };
  for (const voice in AGE) for (const band in AGE[voice]) {
    const d = AGE[voice][band];
    for (const [i, root] of [[0, V], [1, en()]]) {
      const v = (root[voice] = root[voice] || {});
      v.age = v.age || {};
      const o = (v.age[band] = {});
      o.request = {}; for (const k in d.request) o.request[k] = d.request[k].map(p => p[i]);
      o.thanks = {}; for (const k in d.thanks) o.thanks[k] = d.thanks[k].map(p => p[i]);
      o.glance = d.glance.map(p => p[i]);
    }
  }

  /* ---------- 十三岁以下，性格只描写神态 ---------- */
  const KID = {
    clingy: [['{ta}一直想挨着你。', '{ta} kept wanting to be close to you.'], ['{ta}不肯松手，要多抱一会儿。', '{ta} would not let go and wanted to be held longer.']],
    independent: [['{ta}自己玩得很专心，不太需要人。', '{ta} played absorbed, needing hardly anyone.'], ['{ta}自己接了过去，摆弄起来。', '{ta} took it and fiddled with it alone.']],
    nightowl: [['{ta}到了晚上反而越来越精神。', '{ta} got livelier as the evening went on.'], ['{ta}睁着亮亮的眼睛，不想睡。', '{ta} lay bright-eyed, not wanting to sleep.']],
    earlybird: [['{ta}天刚亮就醒了，躺着自己玩。', '{ta} woke at first light and played alone.'], ['{ta}一大早就开心起来。', '{ta} was cheerful from early morning.']],
    picky: [['{ta}对着碗里的东西皱了皱鼻子。', '{ta} wrinkled the nose at what was in the bowl.'], ['{ta}尝了一口，又推开了。', '{ta} tasted a bite and pushed it away.']],
    sickly: [['{ta}看起来比别的孩子安静，脸色有点白。', '{ta} looked quieter than other children, a little pale.'], ['{ta}软软地靠在你身上。', '{ta} leaned softly against you.']],
    sturdy: [['{ta}摔了一跤，爬起来拍拍就继续玩。', '{ta} fell, got up, brushed off and kept playing.'], ['{ta}精神十足地蹬着腿。', '{ta} kicked about full of energy.']],
    grumpy: [['{ta}撇着嘴，不知道在闹什么别扭。', '{ta} pouted, fussing about something unknown.'], ['{ta}哼哼了两声，才肯安静。', '{ta} grumbled twice before settling.']],
    cheerful: [['{ta}一看见你就笑。', '{ta} smiled the moment it saw you.'], ['{ta}笑得眼睛弯弯的。', '{ta} laughed with eyes curved.']],
    thirsty: [['{ta}总是在找水喝。', '{ta} was always looking for something to drink.'], ['{ta}咕嘟咕嘟喝个不停。', '{ta} gulped and gulped.']],
    hearty: [['{ta}一听到吃的，眼睛就亮了。', '{ta} lit up at any mention of food.'], ['{ta}吃得干干净净，还想再要。', '{ta} cleaned the plate and wanted more.']],
    shy: [['{ta}躲在你身后，探出半个脑袋。', '{ta} hid behind you with half a head showing.'], ['{ta}把脸埋在你的衣服里。', '{ta} buried the face in your clothes.']],
    chatty: [['{ta}一个人也说个不停。', '{ta} kept chattering even alone.'], ['{ta}咿咿呀呀地说了很多话。', '{ta} babbled a great many words.']],
    curious: [['{ta}伸着手，什么都想摸一摸。', '{ta} reached out, wanting to touch everything.'], ['{ta}把东西翻来覆去地看。', '{ta} turned the thing over and over.']],
    stubborn: [['{ta}认准了一样东西，怎么也不肯放。', '{ta} fixed on one thing and would not let go.'], ['{ta}顿了一下，才不情愿地松开手。', '{ta} paused, then reluctantly loosened the grip.']],
    gentle: [['{ta}安安静静的，很少哭闹。', '{ta} stayed quiet and rarely fussed.'], ['{ta}轻轻地靠了过来。', '{ta} leaned in gently.']],
    playful: [['{ta}自己跟自己玩得咯咯笑。', '{ta} giggled at a game played alone.'], ['{ta}开心地蹬着腿，还想再玩。', '{ta} kicked happily, wanting more.']],
    anxious: [['{ta}一直回头看你在不在。', '{ta} kept looking back to check you were there.'], ['{ta}紧紧抓着你的手指。', '{ta} held tightly to your finger.']],
    proud: [['{ta}自己想做的事，不肯让人插手。', '{ta} would not let anyone interfere with what it wanted to do.'], ['{ta}自己试着做了一遍，才让你帮忙。', '{ta} tried it alone first before letting you help.']],
    sentimental: [['{ta}抱着一件旧东西，不肯放。', '{ta} hugged an old thing and would not let go.'], ['{ta}把脸贴在你熟悉的衣服上。', '{ta} pressed the face to your familiar clothes.']],
  };
  for (const id in KID) {
    const [g, t] = KID[id];
    C.packs['zh-CN'].traits[id].kid = { glance: [g[0]], thanks: { default: [t[0]] }, ambient: { any: [g[0]] } };
    C.packs.en.traits[id].kid = { glance: [g[1]], thanks: { default: [t[1]] }, ambient: { any: [g[1]] } };
  }
  C.KID_TRAITS = Object.keys(KID);

  /* 一岁多的孩子不会提问，两岁起才有问答 */
  for (const list of [C.asks, C.packs.en.asks]) for (const q of list) if ((q.voice || []).length === 1 && q.voice[0] === 'toddler') q.min_age = 2;
})(globalThis.CY = globalThis.CY || {});
