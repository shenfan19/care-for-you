/* 角色的反应和闲谈：不用你做什么也会发生的小事，随时间和所在的房间变，也会记得你们之间发生过的事。
   中文和英文各写一份，其他语言先回退到英文。台词里 {ta} 是他她它，{name} 是名字，{title} 是对你的称呼。
   每个类别写了不同的口吻：成人，老人，孩子，婴儿，猫，狗，小动物，花草。 */
(function (CY) {
  const C = CY.content;
  const V = C.voices;

  /* 声线属于哪个类别 */
  const GROUP = { parent: 'adult', aunt: 'adult', sibling: 'adult', partner: 'adult', elder: 'elder', child: 'child', toddler: 'child', teen: 'child', infant: 'infant', cat: 'cat', dog: 'dog',
    rabbit: 'critter', hedgehog: 'critter', duck: 'critter', ferret: 'critter', axolotl: 'critter', chicken: 'critter', hamster: 'critter', bird: 'critter', fish: 'critter', turtle: 'critter', snake: 'critter', plant: 'plant' };
  C.VOICE_GROUP = GROUP;

  const ZH = {
    adult: {
      ambient: {
        tv: ['{ta}窝在沙发里看电视，笑了一声。', '{ta}拿着遥控器换了几个台，又换回来了。', '{ta}看着电视，手里的水杯快凉了。'],
        lunch: ['{ta}端着午饭站在灶台边吃了两口。', '{ta}把饭菜热了热，问你要不要来一口。'],
        dinner: ['{ta}在灶台前忙着，厨房里开始有香味。', '{ta}摆好碗筷，朝你这边看了一眼。'],
        work: ['{ta}在敲键盘，敲得很快。', '{ta}盯着屏幕，皱了皱眉，又舒展开。', '{ta}戴着耳机，轻轻点着头。'],
        wakeup: ['{ta}揉着眼睛，说了声早。', '{ta}伸了个懒腰，关节响了一声。'],
        goodnight: ['{ta}打了个哈欠，说该睡了。', '{ta}把客厅的灯关了一半。'],
        morning: ['{ta}端着一杯热水，在窗边站了一会儿。', '{ta}在厨房里哼着不成调的歌。', '{ta}把窗帘拉开，说今天天不错。', '{ta}一边刷牙一边看手机，被你看见了，笑了一下。'],
        noon: ['{ta}看了看时间，问你吃了没有。', '{ta}靠在椅背上，揉了揉后颈。', '{ta}把午饭的碗叠起来，又放下了。'],
        evening: ['{ta}在厨房里弄出一阵香味。', '{ta}把鞋摆整齐，换上了拖鞋。', '{ta}坐在沙发上，长长地呼了一口气。'],
        night: ['{ta}关了客厅的灯，轻手轻脚地走过。', '{ta}说了句早点睡，声音很轻。', '{ta}在黑暗里看着手机的光，过了一会儿也放下了。'],
        kitchen: ['{ta}在洗菜，水声哗哗的。', '{ta}尝了尝汤，加了一点盐。', '{ta}翻出一包不知什么时候买的零食。'],
        living: ['{ta}翻着一本旧杂志。', '{ta}在沙发上看电视，声音开得很小。', '{ta}把靠垫拍松，又靠了回去。'],
        yard: ['{ta}蹲在院子里看一朵花。', '{ta}在院子里晒衣服，衣角被风吹起来。'],
        bedroom: ['{ta}在整理床铺。', '{ta}坐在床边，看着窗外发了一会儿呆。'],
        study: ['{ta}在你的书桌旁站了站，没出声。'],
        toilet: ['{ta}在卫生间里，水声响了一阵。'],
        elder: ['{ta}在老人房门口站了站，听了听里面的动静。'],
        memory_hospital: ['上次你天天往医院跑，我都记着呢。', '那几天你辛苦了。'],
      },
      events: {
        after_fall: ['{ta}摆摆手说：没事没事，你别担心。', '{ta}说：我自己不小心，你别自责。'],
        visit_hospital: ['{ta}看见你来了，笑了一下，说：这么远还跑一趟。', '{ta}拉着你的手，说：我没事，你坐一会儿再走。'],
        discharge: ['{ta}回到家，站在门口环顾了一圈，说：还是家里好。'],
        milestone_10: ['{ta}说：这阵子你一直在照顾我，我都看在眼里。'],
        milestone_50: ['{ta}说：有你在，我心里踏实。'],
        milestone_100: ['{ta}说：你知道吗，我一直想谢谢你，就是不太会说。'],
        milestone_300: ['{ta}看着你，说：你这样，我什么时候才还得清。'],
      },
    },
    elder: {
      ambient: {
        tv: ['{ta}坐在电视前，把音量调大了一格。', '{ta}看着戏曲频道，手指在膝盖上打着拍子。'],
        lunch: ['{ta}慢慢吃着，说今天的菜咸淡刚好。'],
        dinner: ['{ta}坐在桌边，等着开饭。'],
        wakeup: ['{ta}早就醒了，坐在床边活动手脚。'],
        goodnight: ['{ta}把拖鞋摆正，说：睡了。'],
        morning: ['{ta}起得很早，坐在窗边晒太阳。', '{ta}慢慢地打了一套不成样子的太极。', '{ta}把昨天的报纸又看了一遍。', '{ta}摸着杯子，说今天的水温刚好。'],
        noon: ['{ta}靠在椅子上打盹，手里还拿着遥控器。', '{ta}说中午想吃点软的。', '{ta}眯着眼睛，数着墙上的光斑。'],
        evening: ['{ta}坐在门口，看着天一点点暗下来。', '{ta}把拖鞋摆在了你常坐的位置旁边。', '{ta}说，这个时候，以前家里都开饭了。'],
        night: ['{ta}在黑暗里翻了个身，叹了口气，又睡着了。', '{ta}梦里嘟囔了一句什么。', '{ta}的呼吸很轻，很慢。'],
        kitchen: ['{ta}扶着台面，慢慢地烧水。', '{ta}打开冰箱看了看，又关上了。', '{ta}在找什么东西，找了一会儿，想起来了，笑了。'],
        yard: ['{ta}在院子里慢慢地走，一步一步数着。', '{ta}给花浇了点水，说它们渴了。', '{ta}坐在小凳上，眯着眼睛晒太阳。'],
        living: ['{ta}戴上老花镜，翻看一本旧相册。', '{ta}把电视调得很大声，又调小了。', '{ta}拿着你小时候的照片，看了很久。'],
        elder: ['{ta}在自己的房间里整理抽屉。', '{ta}把被子叠了又叠。'],
        bedroom: ['{ta}在门口站了一下，不知道要进去做什么。'],
        study: ['{ta}路过书房，轻轻带上了门缝。'],
        toilet: ['{ta}在卫生间里扶着墙，慢慢地。'],
        memory_hospital: ['在医院那几天，我总想着回家。现在回来了，真好。', '你来看我那天，我一直在等。', '医院的饭不好吃，还是家里的好。'],
      },
      events: {
        after_fall: ['{ta}说：不碍事，老了，腿不听使唤。', '{ta}不好意思地说：给你添麻烦了。', '{ta}说：我下次慢一点，你别担心。'],
        visit_hospital: ['{ta}看见你，眼睛亮了一下，说：你来啦。', '{ta}拉着你的手，半天没松开。', '{ta}说：我在这挺好的，你回去早点休息。'],
        discharge: ['{ta}回到家，慢慢地摸了摸自己的椅子，说：还是家里好。'],
        milestone_10: ['{ta}说：你对我这么好，我都不知道怎么谢你。'],
        milestone_50: ['{ta}说：我这把年纪，能被你这样照顾，是福气。'],
        milestone_100: ['{ta}说：你小的时候，我也是这样守着你的。'],
        milestone_300: ['{ta}拉着你的手，说：这些日子，我都记在心里。'],
      },
    },
    child: {
      ambient: {
        tv: ['{ta}盘腿坐在地上，离电视太近了。'],
        lunch: ['{ta}把青菜拨到了碗边。'],
        dinner: ['{ta}踮着脚想看锅里。'],
        wakeup: ['{ta}抱着枕头不肯起床。'],
        goodnight: ['{ta}抱着玩具，说再玩一会儿。'],
        morning: ['{ta}顶着乱糟糟的头发出来，揉着眼睛。', '{ta}一边刷牙一边打哈欠。', '{ta}说今天想吃煎蛋。'],
        noon: ['{ta}抱着一本书，趴在地上看。', '{ta}把玩具一个个排好，说是在开会。'],
        evening: ['{ta}问：今天晚饭吃什么？', '{ta}把画好的画举起来给你看。'],
        night: ['{ta}抱着枕头，打了个大大的哈欠。', '{ta}说：我不困，就是眼睛想闭一会儿。'],
        kitchen: ['{ta}踮着脚，想看看锅里是什么。', '{ta}偷偷拿了一块饼干，被你看见了。'],
        living: ['{ta}在地毯上滚来滚去。', '{ta}搭了一座很歪的积木塔。'],
        yard: ['{ta}蹲在地上，看蚂蚁搬家。', '{ta}追着一只蝴蝶跑了一圈。'],
        bedroom: ['{ta}在床上蹦了两下，又赶紧坐好。', '{ta}把毛绒玩具一个个盖上被子。'],
        study: ['{ta}趴在门边，探头看你工作。'],
        toilet: ['{ta}在卫生间里洗手，玩起了泡泡。'],
        elder: ['{ta}坐在老人床边，听着故事。'],
        memory_hospital: ['爷爷那次住院，我好想他。', '{title}，上次你去医院，我一个人好怕。'],
      },
      events: {
        after_fall: ['{ta}眼睛红红的，说：你不要有事。'],
        visit_hospital: ['{ta}拉着你的手，说：我们一起去看ta。'],
        discharge: ['{ta}飞快地跑过去，抱住了回家的人。'],
        milestone_10: ['{ta}悄悄说：{title}，我最喜欢你了。'],
        milestone_50: ['{ta}给你画了一张画，上面有两个人，手牵着手。'],
        milestone_100: ['{ta}说：我长大了也要照顾你。'],
        milestone_300: ['{ta}抱着你，说：{title}，你不要走。'],
      },
    },
    infant: {
      ambient: {
        morning: ['{ta}醒了，躺着自己玩手指。', '{ta}咿咿呀呀地冲着天花板说话。'],
        noon: ['{ta}对着自己的小脚丫研究了很久。', '{ta}含着手指，眼睛慢慢眯起来。'],
        evening: ['{ta}踢着腿，冲你咧开嘴笑。'],
        night: ['{ta}在梦里扁了扁嘴，又睡着了。', '{ta}的小胸口轻轻起伏着。'],
        bedroom: ['{ta}抓着小被子的一角，不撒手。', '{ta}转着头，在找你的声音。'],
        living: ['{ta}盯着窗外的光看了很久。'],
        elder: ['{ta}被抱着，伸手去摸老人的脸。'],
        memory_hospital: ['{ta}看见你，一下子笑了，像是久别重逢。'],
      },
      events: {
        after_fall: ['{ta}盯着你，眼睛圆圆的。'],
        visit_hospital: ['{ta}伸着小手，想抓你的脸。'],
        discharge: ['{ta}咯咯地笑出了声。'],
        milestone_10: ['{ta}第一次对你伸出了双手，要抱。'],
        milestone_50: ['{ta}含糊地叫了一声，像是在喊你。'],
        milestone_100: ['{ta}一看见你就笑，笑得眼睛都没了。'],
        milestone_300: ['{ta}靠在你肩上，安安静静地睡着了。'],
      },
    },
    cat: {
      ambient: {
        tv: ['{ta}蜷在沙发角落，尾巴一甩一甩。'],
        dinner: ['{ta}蹲在厨房门口，一直盯着你。'],
        goodnight: ['{ta}占了你的位置，闭着眼装睡。'],
        morning: ['{ta}伸了个很长的懒腰，尾巴竖得高高的。', '{ta}蹲在窗台上，看外面的鸟。'],
        noon: ['{ta}趴在阳光里，打起了呼噜。', '{ta}舔了舔爪子，认真地洗脸。'],
        evening: ['{ta}突然在家里狂奔了一圈，又若无其事地坐下。'],
        night: ['{ta}蜷成一个团，只露出半张脸。', '{ta}的耳朵动了动，像在听什么。'],
        living: ['{ta}盯着墙角的一点，一动不动。', '{ta}钻进了一个太小的纸箱。'],
        bedroom: ['{ta}跳上床，在被子上踩了两圈。'],
        kitchen: ['{ta}在冰箱前坐下，期待地看着你。'],
        yard: ['{ta}趴在草地上，眯着眼睛晒太阳。'],
        study: ['{ta}跳上书桌，坐在你的键盘旁边。'],
        elder: ['{ta}钻进老人的被窝，只露出一个尾巴尖。'],
        memory_hospital: ['{ta}在门口等了好几天，今天终于等到了。'],
      },
      events: {
        after_fall: ['{ta}蹲在旁边，安静地看着。'],
        visit_hospital: ['{ta}隔着窗户看着你。'],
        discharge: ['{ta}绕着回家的人转了三圈，才肯坐下。'],
        milestone_10: ['{ta}第一次主动跳上了你的膝盖。'],
        milestone_50: ['{ta}用头轻轻顶了顶你的手。'],
        milestone_100: ['{ta}闭着眼睛，在你怀里发出长长的呼噜声。'],
        milestone_300: ['{ta}每天都在门口等你。'],
      },
    },
    dog: {
      ambient: {
        tv: ['{ta}趴在脚边，耳朵动了动。'],
        dinner: ['{ta}在厨房门口摇着尾巴。'],
        wakeup: ['{ta}早就守在门口了。'],
        morning: ['{ta}一看到你，尾巴摇成了螺旋桨。', '{ta}叼来了拖鞋，放在你脚边。'],
        noon: ['{ta}趴在门口，下巴搁在爪子上。', '{ta}打了个哈欠，翻过身晒肚皮。'],
        evening: ['{ta}听到钥匙响，飞快地冲到了门口。'],
        night: ['{ta}在梦里蹬着腿，像在追什么。', '{ta}叹了一口气，把头埋进前爪里。'],
        living: ['{ta}叼着一个破破烂烂的玩具，看着你。', '{ta}跟在你后面，你走哪它走哪。'],
        yard: ['{ta}在院子里刨了一个坑，一脸无辜。', '{ta}追着自己的尾巴转了一圈。'],
        kitchen: ['{ta}坐在你脚边，眼巴巴地盯着案板。'],
        bedroom: ['{ta}趴在床边，一动不动地守着。'],
        study: ['{ta}趴在你的椅子下面，叹了口气。'],
        elder: ['{ta}卧在老人的床边。'],
        memory_hospital: ['{ta}每天在门口等，今天终于等到了。'],
      },
      events: {
        after_fall: ['{ta}着急地围着转，低低地叫。'],
        visit_hospital: ['{ta}在门口呜咽着，不肯走。'],
        discharge: ['{ta}疯了一样扑过去，摇着尾巴，转了又转。'],
        milestone_10: ['{ta}把脑袋放在你膝盖上，不走了。'],
        milestone_50: ['{ta}认得你的脚步声，隔着门就开始摇尾巴。'],
        milestone_100: ['{ta}趴在你脚边，睡得很沉，像是终于放心了。'],
        milestone_300: ['{ta}不管你去哪儿，都要跟着。'],
      },
    },
    critter: {
      ambient: {
        morning: ['{ta}动了动，像在迎接新的一天。'], noon: ['{ta}安静地待着，偶尔动一下。'], evening: ['{ta}慢慢地活跃起来。'], night: ['{ta}安静地待着，一动不动。'],
        living: ['{ta}转头看了你一眼。'], bedroom: ['{ta}在自己的小窝里转了一圈。'], study: ['{ta}隔着玻璃，静静地看着你。'], kitchen: ['{ta}悄悄探出头来。'], yard: ['{ta}晒着太阳，一动不动。'],
        memory_hospital: ['{ta}好像在等你回来。'],
      },
      events: {
        after_fall: ['{ta}轻轻动了动。'], visit_hospital: ['{ta}安静地看着。'], discharge: ['{ta}好像比平时活泼了一点。'],
        milestone_10: ['{ta}开始认得你了。'], milestone_50: ['{ta}一看见你就凑了过来。'], milestone_100: ['{ta}在你手边安心地待着。'], milestone_300: ['{ta}好像已经把你当成了家的一部分。'],
      },
    },
    plant: {
      ambient: {
        morning: ['{ta}的叶子上挂着一颗小水珠。'], noon: ['{ta}安安静静地晒着太阳。'], evening: ['{ta}的影子被拉得很长。'], night: ['{ta}静静地立在黑暗里。'],
        living: ['{ta}朝着窗户的方向，微微倾斜。'], yard: ['{ta}被风吹得轻轻摇晃。'], study: ['{ta}安静地陪着你工作。'], kitchen: ['{ta}沾了一点厨房的烟火气。'], bedroom: ['{ta}在床边静静地待着。'],
        memory_hospital: ['{ta}长出了一片新叶子，像是在欢迎谁回来。'],
      },
      events: {
        after_fall: ['{ta}静静地立着。'], visit_hospital: ['{ta}静静地立着。'], discharge: ['{ta}悄悄长出了新芽。'],
        milestone_10: ['{ta}长出了一片新叶子。'], milestone_50: ['{ta}的叶子比以前更绿了。'], milestone_100: ['{ta}开出了一朵小花，或者是新的一圈叶子。'], milestone_300: ['{ta}已经长成了家里的一部分。'],
      },
    },
  };

  const EN = {
    adult: {
      ambient: {
        tv: ['{ta} curled up on the sofa in front of the TV and laughed once.', '{ta} flipped through a few channels and went back to the first.', '{ta} watched TV while the glass of water went cold.'],
        lunch: ['{ta} stood at the stove eating a few bites of lunch.', '{ta} reheated lunch and asked if you wanted some.'],
        dinner: ['{ta} was busy at the stove and the kitchen began to smell good.', '{ta} set out bowls and chopsticks and glanced your way.'],
        work: ['{ta} was typing, fast.', '{ta} frowned at the screen, then relaxed.', '{ta} nodded along to something in the headphones.'],
        wakeup: ['{ta} rubbed the eyes and said good morning.', '{ta} stretched, and a joint cracked.'],
        goodnight: ['{ta} yawned and said it was time for bed.', '{ta} turned off half of the living room lights.'],
        morning: ['{ta} stood by the window with a cup of hot water.', '{ta} hummed something off-key in the kitchen.', '{ta} pulled the curtains open and said it looked like a good day.', '{ta} brushed teeth while checking the phone, and smiled when you noticed.'],
        noon: ['{ta} glanced at the clock and asked if you had eaten.', '{ta} leaned back and rubbed the back of the neck.', '{ta} stacked the lunch bowls, then put them down again.'],
        evening: ['{ta} filled the kitchen with a good smell.', '{ta} lined up the shoes and slipped into slippers.', '{ta} dropped onto the sofa and let out a long breath.'],
        night: ['{ta} turned off the living room light and walked past on tiptoe.', '{ta} said, quietly, to go to bed early.', '{ta} watched the glow of the phone in the dark, then put it down.'],
        kitchen: ['{ta} washed vegetables, the water running.', '{ta} tasted the soup and added a little salt.', '{ta} dug out a snack of unknown age.'],
        living: ['{ta} flipped through an old magazine.', '{ta} watched TV with the volume turned low.', '{ta} fluffed a cushion and leaned back again.'],
        yard: ['{ta} crouched in the yard to look at a flower.', '{ta} hung laundry outside, the hems lifting in the wind.'],
        bedroom: ['{ta} was making the bed.', '{ta} sat on the edge of the bed, staring out of the window for a while.'],
        study: ['{ta} stood by your desk for a moment without a word.'],
        toilet: ['{ta} was in the bathroom, water running for a bit.'],
        elder: ['{ta} stopped at the elders’ room door and listened for a moment.'],
        memory_hospital: ['I remember how you kept going to the hospital.', 'Those days were hard on you.'],
      },
      events: {
        after_fall: ['{ta} waved a hand: it is nothing, please do not worry.', '{ta} said: it was my own carelessness, do not blame yourself.'],
        visit_hospital: ['{ta} smiled when you came in and said: you came all this way.', '{ta} held your hand and said: I am fine, sit for a while before you go.'],
        discharge: ['{ta} stood in the doorway, looked around, and said: nothing like home.'],
        milestone_10: ['{ta} said: you have been looking after me lately, and I notice.'],
        milestone_50: ['{ta} said: with you around, I feel at ease.'],
        milestone_100: ['{ta} said: I have wanted to thank you for a long time, I am just not good at saying it.'],
        milestone_300: ['{ta} looked at you and said: how will I ever repay you.'],
      },
    },
    elder: {
      ambient: {
        tv: ['{ta} sat close to the TV and turned the volume up one notch.', '{ta} watched the opera channel, tapping a finger on the knee.'],
        lunch: ['{ta} ate slowly and said the food was seasoned just right.'],
        dinner: ['{ta} sat at the table, waiting for dinner.'],
        wakeup: ['{ta} had been awake for a while, moving the arms and legs on the edge of the bed.'],
        goodnight: ['{ta} lined up the slippers and said: bedtime.'],
        morning: ['{ta} was up early, sitting by the window in the sun.', '{ta} slowly went through a rough version of tai chi.', '{ta} read yesterday’s paper once more.', '{ta} held the cup and said the water was just right today.'],
        noon: ['{ta} dozed in the chair with the remote still in hand.', '{ta} said something soft would be nice for lunch.', '{ta} squinted, counting the spots of light on the wall.'],
        evening: ['{ta} sat by the door, watching the sky darken little by little.', '{ta} put the slippers beside the place where you usually sit.', '{ta} said that at this hour, supper used to be on the table.'],
        night: ['{ta} turned over in the dark, sighed, and fell asleep again.', '{ta} mumbled something in a dream.', '{ta} breathed softly and slowly.'],
        kitchen: ['{ta} steadied against the counter and boiled water, slowly.', '{ta} opened the fridge, looked in, and closed it again.', '{ta} was looking for something, remembered it, and laughed.'],
        yard: ['{ta} walked slowly around the yard, counting each step.', '{ta} watered the flowers and said they were thirsty.', '{ta} sat on a small stool, squinting in the sun.'],
        living: ['{ta} put on reading glasses and leafed through an old album.', '{ta} turned the TV up loud, then down.', '{ta} looked at a photo of you as a child for a long time.'],
        elder: ['{ta} sorted through the drawers in the room.', '{ta} folded the quilt, then folded it again.'],
        bedroom: ['{ta} stood at the door, unsure what to go in for.'],
        study: ['{ta} walked past the study and pulled the door nearly shut.'],
        toilet: ['{ta} was in the bathroom, one hand on the wall, taking it slowly.'],
        memory_hospital: ['In the hospital I kept thinking of home. Now I am back, and it is good.', 'The day you came to see me, I had been waiting.', 'Hospital food is not like home food.'],
      },
      events: {
        after_fall: ['{ta} said: it is nothing, my legs are just old.', '{ta} said, a little embarrassed: sorry to trouble you.', '{ta} said: I will go slower next time, do not worry.'],
        visit_hospital: ['{ta} looked up and lit up: you came.', '{ta} held your hand for a long while.', '{ta} said: I am fine here, go home and rest early.'],
        discharge: ['{ta} came home, slowly touched the chair, and said: nothing like home.'],
        milestone_10: ['{ta} said: you are so good to me that I do not know how to thank you.'],
        milestone_50: ['{ta} said: at my age, to be looked after like this is a blessing.'],
        milestone_100: ['{ta} said: I used to sit up with you like this when you were small.'],
        milestone_300: ['{ta} held your hand and said: I keep all these days in my heart.'],
      },
    },
    child: {
      ambient: {
        tv: ['{ta} sat cross-legged on the floor, much too close to the TV.'],
        lunch: ['{ta} pushed the greens to the edge of the bowl.'],
        dinner: ['{ta} stood on tiptoe trying to see into the pot.'],
        wakeup: ['{ta} hugged the pillow and refused to get up.'],
        goodnight: ['{ta} hugged a toy and asked for a little more play.'],
        morning: ['{ta} came out with messy hair, rubbing both eyes.', '{ta} yawned through brushing teeth.', '{ta} said today felt like a fried egg day.'],
        noon: ['{ta} lay on the floor with a book.', '{ta} lined up the toys and said it was a meeting.'],
        evening: ['{ta} asked what was for dinner.', '{ta} held up a drawing to show you.'],
        night: ['{ta} hugged a pillow and gave a giant yawn.', '{ta} said: I am not sleepy, my eyes just want to close for a bit.'],
        kitchen: ['{ta} stood on tiptoe to see what was in the pot.', '{ta} quietly took a cookie and got caught.'],
        living: ['{ta} rolled around on the rug.', '{ta} built a very crooked block tower.'],
        yard: ['{ta} crouched to watch ants carry things home.', '{ta} chased a butterfly around once.'],
        bedroom: ['{ta} bounced on the bed twice, then quickly sat still.', '{ta} tucked the stuffed animals in, one by one.'],
        study: ['{ta} peeked around the door to watch you work.'],
        toilet: ['{ta} washed hands and started playing with the bubbles.'],
        elder: ['{ta} sat by the elder’s bed, listening to a story.'],
        memory_hospital: ['I missed Grandpa so much when he was in hospital.', '{title}, I was scared when you went to the hospital.'],
      },
      events: {
        after_fall: ['{ta} had red eyes and said: please do not get hurt.'],
        visit_hospital: ['{ta} took your hand and said: let us go see them together.'],
        discharge: ['{ta} ran straight over and hugged the one who came home.'],
        milestone_10: ['{ta} whispered: {title}, I like you the most.'],
        milestone_50: ['{ta} drew you a picture of two people holding hands.'],
        milestone_100: ['{ta} said: when I grow up I will look after you too.'],
        milestone_300: ['{ta} hugged you and said: {title}, please do not go away.'],
      },
    },
    infant: {
      ambient: {
        morning: ['{ta} woke up and lay there playing with fingers.', '{ta} cooed at the ceiling.'],
        noon: ['{ta} studied one little foot at great length.', '{ta} sucked a finger, eyes slowly closing.'],
        evening: ['{ta} kicked both legs and grinned at you.'],
        night: ['{ta} pouted in a dream, then settled again.', '{ta}’s tiny chest rose and fell.'],
        bedroom: ['{ta} gripped a corner of the blanket and would not let go.', '{ta} turned the head, looking for the sound of you.'],
        living: ['{ta} stared at the light from the window for a long time.'],
        elder: ['{ta} was held, and reached to touch the elder’s face.'],
        memory_hospital: ['{ta} saw you and broke into a smile, like a long-awaited reunion.'],
      },
      events: {
        after_fall: ['{ta} watched you with round eyes.'], visit_hospital: ['{ta} reached out tiny hands toward your face.'], discharge: ['{ta} giggled out loud.'],
        milestone_10: ['{ta} held both arms up to you for the first time.'], milestone_50: ['{ta} babbled something that sounded like your name.'],
        milestone_100: ['{ta} smiles every time you appear, so wide the eyes disappear.'], milestone_300: ['{ta} leaned on your shoulder and fell quietly asleep.'],
      },
    },
    cat: {
      ambient: {
        tv: ['{ta} curled up in the corner of the sofa, tail flicking.'],
        dinner: ['{ta} sat at the kitchen door, watching you the whole time.'],
        goodnight: ['{ta} took your spot and pretended to be asleep.'],
        morning: ['{ta} stretched long, tail straight up.', '{ta} sat on the windowsill, watching the birds.'],
        noon: ['{ta} lay in a patch of sun and started to purr.', '{ta} licked a paw and washed the face with great seriousness.'],
        evening: ['{ta} suddenly sprinted around the house, then sat down as if nothing happened.'],
        night: ['{ta} curled into a ball with only half a face showing.', '{ta}’s ears twitched, listening to something.'],
        living: ['{ta} stared at one spot on the wall without moving.', '{ta} squeezed into a box far too small.'],
        bedroom: ['{ta} hopped onto the bed and kneaded the blanket twice.'], kitchen: ['{ta} sat before the fridge, hopeful.'], yard: ['{ta} lay on the grass, squinting in the sun.'],
        study: ['{ta} jumped on the desk and sat by your keyboard.'], elder: ['{ta} burrowed under the elder’s quilt, only the tail tip showing.'],
        memory_hospital: ['{ta} had waited at the door for days, and today the wait was over.'],
      },
      events: {
        after_fall: ['{ta} sat nearby, quietly watching.'], visit_hospital: ['{ta} watched you through the window.'], discharge: ['{ta} circled the one who came home three times before sitting down.'],
        milestone_10: ['{ta} jumped onto your lap by choice for the first time.'], milestone_50: ['{ta} bumped a head gently against your hand.'],
        milestone_100: ['{ta} closed both eyes and purred long and low in your arms.'], milestone_300: ['{ta} waits at the door for you every day.'],
      },
    },
    dog: {
      ambient: {
        tv: ['{ta} lay by your feet, one ear twitching.'],
        dinner: ['{ta} wagged at the kitchen door.'],
        wakeup: ['{ta} was already waiting by the door.'],
        morning: ['{ta} saw you and wagged like a propeller.', '{ta} brought a slipper and left it at your feet.'],
        noon: ['{ta} lay at the door with the chin on both paws.', '{ta} yawned and rolled over to sun the belly.'],
        evening: ['{ta} heard the key and raced to the door.'],
        night: ['{ta} kicked in a dream, chasing something.', '{ta} sighed and tucked the head between the paws.'],
        living: ['{ta} held a ragged toy in the mouth and looked at you.', '{ta} followed you wherever you went.'],
        yard: ['{ta} dug a hole in the yard and looked innocent.', '{ta} chased its own tail once.'],
        kitchen: ['{ta} sat at your feet, eyes on the chopping board.'], bedroom: ['{ta} lay by the bed, keeping watch.'], study: ['{ta} lay beneath your chair and sighed.'], elder: ['{ta} lay beside the elder’s bed.'],
        memory_hospital: ['{ta} waited at the door each day, and today it paid off.'],
      },
      events: {
        after_fall: ['{ta} circled anxiously, whining softly.'], visit_hospital: ['{ta} whimpered at the door and would not leave.'], discharge: ['{ta} flung itself over, tail going, spinning round and round.'],
        milestone_10: ['{ta} rested the head on your knee and stayed there.'], milestone_50: ['{ta} knows your footsteps and starts wagging through the door.'],
        milestone_100: ['{ta} slept deeply at your feet, as if finally at ease.'], milestone_300: ['{ta} follows you everywhere now.'],
      },
    },
    critter: {
      ambient: {
        morning: ['{ta} stirred, as if welcoming the day.'], noon: ['{ta} stayed quiet, moving now and then.'], evening: ['{ta} slowly woke up.'], night: ['{ta} stayed quietly still.'],
        living: ['{ta} turned to look at you.'], bedroom: ['{ta} circled its little nest.'], study: ['{ta} watched you quietly through the glass.'], kitchen: ['{ta} peeked out.'], yard: ['{ta} basked, not moving.'],
        memory_hospital: ['{ta} seems to have been waiting for you to come back.'],
      },
      events: {
        after_fall: ['{ta} stirred gently.'], visit_hospital: ['{ta} watched quietly.'], discharge: ['{ta} seems a bit livelier than usual.'],
        milestone_10: ['{ta} is starting to know you.'], milestone_50: ['{ta} comes over as soon as it sees you.'], milestone_100: ['{ta} settles calmly beside your hand.'], milestone_300: ['{ta} seems to count you as part of home.'],
      },
    },
    plant: {
      ambient: {
        morning: ['{ta} has a small drop of water on a leaf.'], noon: ['{ta} basks quietly.'], evening: ['{ta}’s shadow stretches long.'], night: ['{ta} stands quietly in the dark.'],
        living: ['{ta} leans slightly toward the window.'], yard: ['{ta} sways gently in the wind.'], study: ['{ta} keeps you company while you work.'], kitchen: ['{ta} has picked up a bit of kitchen warmth.'], bedroom: ['{ta} stands quietly by the bed.'],
        memory_hospital: ['{ta} grew a new leaf, as if welcoming someone back.'],
      },
      events: {
        after_fall: ['{ta} stands quietly.'], visit_hospital: ['{ta} stands quietly.'], discharge: ['{ta} quietly put out a new shoot.'],
        milestone_10: ['{ta} put out a new leaf.'], milestone_50: ['{ta}’s leaves are greener than before.'], milestone_100: ['{ta} added a new ring of leaves.'], milestone_300: ['{ta} has become part of the house.'],
      },
    },
  };

  /* 新动作的道谢，按人的类别，成人和老人和孩子 */
  const THANKS_ZH = {
    adult: { listen: ['谢谢你听我说完。'], walkout: ['出来走走，心里亮堂多了。'], lead: ['谢谢，我自己能行，不过有你在放心一点。'], steady: ['手稳了一点，谢谢。'], restsit: ['坐一会儿，好多了。'], nightlight: ['有点光，安心多了。'], ointment: ['涂上舒服多了。'], painkill: ['吃了，一会儿就好了。'], support: ['慢慢来，有你扶着就不怕。'], rehab: ['今天比昨天多动了一点点。'], stayclose: ['你不说话，也很好。'], warmdrink: ['热乎乎的，谢谢你。'], antihist: ['药吃了，一会儿就好了。'], airclean: ['干净了，鼻子舒服多了。'] },
    elder: { listen: ['这些话，好久没人听我说了。'], walkout: ['外面的空气真好。'], lead: ['你扶着，我走得稳。'], steady: ['这手，不听话啊。'], restsit: ['歇一歇，歇一歇。'], nightlight: ['留盏小灯，夜里就不怕了。'], ointment: ['凉凉的，舒服。'], painkill: ['吃了就不疼了。'], support: ['慢慢走，不急。'], rehab: ['疼是疼点，能动就是好事。'], stayclose: ['你在，我就踏实了。'], warmdrink: ['这茶，暖到心里了。'], antihist: ['吃了药，不打喷嚏了。'], airclean: ['屋里清爽多了。'] },
    child: { listen: ['{title}听我说话，真好。'], walkout: ['出去玩！'], lead: ['{title}陪我去！'], steady: ['嗯嗯。'], restsit: ['坐一会儿。'], nightlight: ['有灯就不怕了。'], ointment: ['不痒了。'], painkill: ['不疼了。'], support: ['{title}抱我走。'], rehab: ['我可以的！'], stayclose: ['{title}不要走。'], warmdrink: ['暖暖的。'], antihist: ['不难受了。'], airclean: ['干净啦。'], train: ['我学会啦！'] },
  };
  const THANKS_EN = {
    adult: { listen: ['Thank you for hearing me out.'], walkout: ['Being outside cleared my head.'], lead: ['Thanks, I could manage, but I feel better with you here.'], steady: ['My hands are steadier now, thanks.'], restsit: ['A short sit, much better.'], nightlight: ['A bit of light makes it easier.'], ointment: ['That feels much better.'], painkill: ['Taken, it will ease soon.'], support: ['Slowly, with you holding on I am not afraid.'], rehab: ['A little more than yesterday.'], stayclose: ['You do not have to say anything, it is fine.'], warmdrink: ['Warm, thank you.'], antihist: ['I took it, it will settle soon.'], airclean: ['Clean now, my nose feels better.'] },
    elder: { listen: ['No one has listened to me like that in a long time.'], walkout: ['The air out here is good.'], lead: ['With you holding on, I walk steady.'], steady: ['These hands, they do not listen.'], restsit: ['Rest a bit, rest a bit.'], nightlight: ['A small light and the night is not scary.'], ointment: ['Cool, comfortable.'], painkill: ['Taken, the pain will go.'], support: ['Slowly, no rush.'], rehab: ['It hurts a little, but moving is good.'], stayclose: ['With you here I feel at ease.'], warmdrink: ['This tea warms me all the way through.'], antihist: ['I took the medicine, no more sneezing.'], airclean: ['The room feels fresh now.'] },
    child: { listen: ['{title} listens to me, that is nice.'], walkout: ['Let us go out and play!'], lead: ['{title} come with me!'], steady: ['Mm-hm.'], restsit: ['Sit for a bit.'], nightlight: ['With a light I am not scared.'], ointment: ['It does not itch now.'], painkill: ['It does not hurt now.'], support: ['{title} carry me along.'], rehab: ['I can do it!'], stayclose: ['{title}, do not go.'], warmdrink: ['Warm.'], antihist: ['I feel better.'], airclean: ['All clean!'], train: ['I learned it!'] },
  };
  const THANKS_PET_ZH = { dog: { train: ['{ta}端端正正地坐下，眼睛一直看着你。'] }, bird: { teach: ['{ta}歪着头，学着叫了一声。'] } };
  const THANKS_PET_EN = { dog: { train: ['{ta} sat up straight, eyes on you the whole time.'] }, bird: { teach: ['{ta} tilted the head and tried a sound back.'] } };

  const put = (target, lang, table, thanksZh, thanksEn) => {
    for (const v in GROUP) {
      const g = GROUP[v], src = table[g]; if (!src) continue;
      const voice = target(v); if (!voice) continue;
      voice.ambient = Object.assign({}, voice.ambient, src.ambient);
      voice.events = Object.assign({}, voice.events, src.events);
      const th = (lang === 'zh' ? thanksZh : thanksEn)[g];
      if (th) { voice.thanks = Object.assign({}, voice.thanks, th); }
    }
    for (const v in (lang === 'zh' ? THANKS_PET_ZH : THANKS_PET_EN)) { const voice = target(v); if (voice) voice.thanks = Object.assign({}, voice.thanks, (lang === 'zh' ? THANKS_PET_ZH : THANKS_PET_EN)[v]); }
  };
  put(v => V[v], 'zh', ZH, THANKS_ZH, THANKS_EN);
  const enVoices = C.packs.en && C.packs.en.voices;
  if (enVoices) put(v => { enVoices[v] = enVoices[v] || {}; return enVoices[v]; }, 'en', EN, THANKS_ZH, THANKS_EN);
})(globalThis.CY = globalThis.CY || {});
