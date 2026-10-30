/* 动物和花草的台词补充，以及五种新动物的整套声线。每条是 [中文, 英文] 一对。
   原来的动物声线每个键只有一两句，这里补到不会很快重复。其他语言先回退到英文。 */
(function (CY) {
  const C = CY.content, V = C.voices;
  /* 这一版之前就有的内容，八种语言都完整；之后新增的只保证中文和英文，其他语言回退到英文 */
  C.CORE = { voices: Object.keys(V), sayings: C.sayings.map(x => x.id), asks: C.asks.map(x => x.id), nudges: C.nudges.map(x => x.id) };
  const en = () => (C.packs.en.voices = C.packs.en.voices || {});
  const ensure = (obj, v) => (obj[v] = obj[v] || {});
  /* 往某个声线的某个组里加句子。group 是 request/thanks/ambient，key 是需求名或动作名 */
  const addKeyed = (voice, group, key, pairs) => {
    for (const [i, tgt] of [[0, ensure(V, voice)], [1, ensure(en(), voice)]]) {
      tgt[group] = tgt[group] || {};
      tgt[group][key] = (tgt[group][key] || []).concat(pairs.map(p => p[i]));
    }
  };
  const addList = (voice, group, pairs) => {
    for (const [i, tgt] of [[0, ensure(V, voice)], [1, ensure(en(), voice)]]) tgt[group] = (tgt[group] || []).concat(pairs.map(p => p[i]));
  };
  const setReveal = (voice, zh, enn) => { ensure(V, voice).reveal = zh; ensure(en(), voice).reveal = enn; };
  const maxId = voice => C.sayings.filter(s => s.voice === voice).reduce((m, s) => Math.max(m, parseInt(s.id.slice(voice.length), 10) || 0), 0);
  const addSay = (voice, pairs) => {
    let n = maxId(voice);
    for (const p of pairs) {
      n++; const id = voice + String(n).padStart(2, '0');
      C.sayings.push({ id, voice, text: p[0] });
      C.packs.en.sayings = C.packs.en.sayings || [];
      C.packs.en.sayings.push({ id, voice, text: p[1] });
    }
  };
  const fill = (voice, d) => {
    for (const g of ['request', 'thanks']) for (const k in d[g] || {}) addKeyed(voice, g, k, d[g][k]);
    if (d.glance) addList(voice, 'glance', d.glance);
    if (d.back) addList(voice, 'cares_back', d.back);
    if (d.reveal) setReveal(voice, d.reveal[0], d.reveal[1]);
    if (d.say) addSay(voice, d.say);
  };

  /* ---------- 原有的动物和花草，补句子 ---------- */
  fill('cat', {
    request: { thirst: [['{ta}对着水碗叫了一声，碗是空的。', '{ta} meowed at the water bowl, which was empty.']], hunger: [['{ta}坐在食盆前，一动不动地盯着你。', '{ta} sat before the dish, staring at you without moving.']], company: [['{ta}在你腿边蹭来蹭去，不肯走。', '{ta} rubbed against your legs and would not leave.']], play: [['{ta}叼着一根逗猫棒，放在你脚边。', '{ta} dropped a wand toy at your feet.']], clean: [['{ta}嫌弃地看了看猫砂盆，又看了看你。', '{ta} looked at the litter box with disgust, then at you.']] },
    thanks: { default: [['{ta}喵了一声，算是谢过了。', '{ta} meowed, which counted as thanks.'], ['{ta}尾巴尖轻轻勾了一下。', '{ta}’s tail tip curled lightly.'], ['{ta}转过身，把屁股对着你，其实是满意。', '{ta} turned its back on you, which meant satisfaction.']] },
    glance: [['{ta}从沙发背上居高临下地看着你。', '{ta} looked down at you from the sofa back.'], ['{ta}慢慢眨了眨眼，像是在对你说话。', '{ta} blinked slowly, as if speaking to you.'], ['{ta}在你工作的时候，坐在了屏幕前面。', '{ta} sat down in front of your screen while you worked.'], ['{ta}伸了个懒腰，打了个哈欠，又看了你一眼。', '{ta} stretched, yawned, and looked at you again.']],
    back: [['{ta}叼来一只不知道哪里找来的毛线球，放在你脚边。', '{ta} brought a ball of yarn from who knows where and left it at your feet.'], ['{ta}趴在你的键盘上，不让你再工作了。', '{ta} lay on your keyboard to stop you working.'], ['{ta}把前爪搭在你的手臂上，眯起眼睛。', '{ta} rested a paw on your arm and narrowed both eyes.'], ['{ta}半夜跳上床，在你脚边趴下了。', '{ta} jumped on the bed at night and settled at your feet.']],
    say: [['{ta}对着空气扑了一下。', '{ta} pounced at thin air.'], ['{ta}打了个很响的喷嚏。', '{ta} sneezed very loudly.'], ['{ta}把一个杯子推到了桌边。', '{ta} nudged a cup toward the edge of the table.'], ['{ta}冲窗外的鸟发出咔咔的声音。', '{ta} chattered at the birds outside.'], ['{ta}在你脚边打了个滚。', '{ta} rolled over at your feet.']],
  });
  fill('dog', {
    request: { thirst: [['{ta}把空水碗推到你脚边。', '{ta} pushed the empty bowl to your feet.']], hunger: [['{ta}围着你的脚转了三圈，眼睛一直看着厨房。', '{ta} circled your feet three times, eyes on the kitchen.']], company: [['{ta}把下巴搁在你膝盖上，叹了口气。', '{ta} rested its chin on your knee and sighed.']], play: [['{ta}叼着球，尾巴摇得整个屁股都在晃。', '{ta} held a ball, wagging so hard the whole rump shook.']] },
    thanks: { default: [['{ta}汪了一声，尾巴摇个不停。', '{ta} barked once, tail never stopping.'], ['{ta}用头顶了顶你的手。', '{ta} bumped its head against your hand.'], ['{ta}原地转了个圈，高兴得不得了。', '{ta} spun in place, delighted.']] },
    glance: [['{ta}趴在门口，下巴放在前爪上，看着你。', '{ta} lay by the door, chin on paws, watching you.'], ['{ta}一听见你的动静，耳朵立刻竖了起来。', '{ta}’s ears shot up at the slightest sound from you.'], ['{ta}叼着拖鞋走过来，放下，又看了你一眼。', '{ta} carried over a slipper, dropped it, and looked at you again.'], ['{ta}摇着尾巴站在门口，像是在问去不去散步。', '{ta} stood at the door wagging, asking if it was walk time.']],
    back: [['{ta}把最喜欢的球放在你脚边，那是它最珍贵的东西。', '{ta} set its favorite ball at your feet, its most precious thing.'], ['{ta}在你难过的时候，默默把脑袋放在你膝盖上。', '{ta} quietly laid its head on your knee when you were sad.'], ['{ta}跟着你从客厅走到厨房，再走到阳台。', '{ta} followed you from the living room to the kitchen to the balcony.'], ['{ta}睡在你房门口，一整夜。', '{ta} slept at your door all night.']],
    say: [['{ta}对着门外汪了一声。', '{ta} barked once at the door.'], ['{ta}打了个哈欠，发出长长的呜声。', '{ta} yawned with a long whine.'], ['{ta}追着自己的尾巴转了一圈。', '{ta} chased its own tail once around.'], ['{ta}把脑袋歪到了一边。', '{ta} tilted its head to one side.'], ['{ta}在地毯上蹭了蹭后背。', '{ta} scratched its back on the rug.']],
  });
  fill('rabbit', {
    request: { thirst: [['{ta}用爪子拍了拍水瓶。', '{ta} patted the water bottle with a paw.']], hunger: [['{ta}对着空的草架看了又看。', '{ta} stared at the empty hay rack.']], play: [['{ta}扒着笼门，想出来蹦跶。', '{ta} pawed at the cage door to come out and hop.']], clean: [['{ta}嫌弃地躲到笼子的另一头。', '{ta} retreated to the far end of the cage with distaste.']] },
    thanks: { default: [['{ta}鼻子抽动了好几下。', '{ta}’s nose twitched several times.'], ['{ta}轻轻跺了一下脚，算是回应。', '{ta} thumped one foot lightly in reply.'], ['{ta}侧着身子躺倒，露出了肚皮。', '{ta} flopped on one side, belly showing.']] },
    glance: [['{ta}坐直了，两只耳朵朝着你转过来。', '{ta} sat up, both ears turning to you.'], ['{ta}在笼子里一下子窜了起来，又落下。', '{ta} popped up in the cage and landed again.'], ['{ta}盯着你手里的东西，鼻子一抽一抽。', '{ta} stared at your hand, nose twitching.'], ['{ta}把前爪搭在笼子边上，看着你。', '{ta} rested both front paws on the cage edge, watching you.']],
    back: [['{ta}轻轻啃了啃你的衣角。', '{ta} nibbled your sleeve gently.'], ['{ta}在你脚边蹦了三个很高的蹦。', '{ta} did three high hops at your feet.'], ['{ta}把下巴放在你的手背上。', '{ta} laid its chin on the back of your hand.'], ['{ta}安静地陪你待了一整个下午。', '{ta} kept you company quietly all afternoon.']],
    say: [['{ta}在笼子里转了三圈。', '{ta} circled the cage three times.'], ['{ta}打了个小小的喷嚏。', '{ta} gave a tiny sneeze.'], ['{ta}一口气跳到了沙发上。', '{ta} hopped onto the sofa in one go.'], ['{ta}把耳朵压平，趴在地上。', '{ta} laid both ears flat and lay down.'], ['{ta}用两条后腿站了起来。', '{ta} stood up on both hind legs.']],
  });
  fill('hamster', {
    request: { thirst: [['{ta}舔着水瓶的嘴，什么也没舔出来。', '{ta} licked the bottle spout and got nothing.']], hunger: [['{ta}两颊瘪瘪的，在空碗里翻找。', '{ta} had hollow cheeks and rummaged in an empty dish.']], play: [['{ta}在轮子边上蹲着，看着你。', '{ta} crouched by the wheel, looking at you.']], clean: [['{ta}把垫料扒到了一边，露出了光秃秃的底。', '{ta} pushed bedding aside to expose the bare floor.']] },
    thanks: { default: [['{ta}吱吱叫了两声。', '{ta} squeaked twice.'], ['{ta}把脸洗了好几遍。', '{ta} washed its face several times.'], ['{ta}叼起一粒瓜子藏了起来。', '{ta} picked up a seed and stashed it away.']] },
    glance: [['{ta}从窝里探出半个脑袋。', '{ta} poked half its head out of the nest.'], ['{ta}叼着瓜子，直直地看着你。', '{ta} stared at you with a seed in its mouth.'], ['{ta}站起来，两只前爪捧着胸口。', '{ta} stood up with both paws on its chest.'], ['{ta}在轮子上跑了一半，停下来看你。', '{ta} stopped halfway through a run to look at you.']],
    back: [['{ta}把一粒瓜子推到你的手边。', '{ta} pushed a seed toward your hand.'], ['{ta}爬到你的手心里，团成了一个球。', '{ta} climbed into your palm and curled into a ball.'], ['{ta}在你掌心里洗了个脸。', '{ta} washed its face in your palm.'], ['{ta}半夜在轮子上跑，像是在替你守夜。', '{ta} ran on the wheel through the night as if keeping watch for you.']],
    say: [['{ta}把两颊塞得满满的。', '{ta} stuffed both cheeks full.'], ['{ta}在轮子上飞快地跑。', '{ta} ran fast on the wheel.'], ['{ta}钻进了纸筒里，只露出屁股。', '{ta} dived into a paper tube, rump sticking out.'], ['{ta}打了一个很小的哈欠。', '{ta} gave a very small yawn.'], ['{ta}把瓜子壳吐了一地。', '{ta} spat seed shells everywhere.']],
  });
  fill('bird', {
    request: { thirst: [['{ta}站在水杯边，歪着头看你。', '{ta} stood by the water cup, head tilted at you.']], hunger: [['{ta}对着空食槽啾啾叫了好几声。', '{ta} chirped at the empty feeder several times.']], company: [['{ta}叫了一声，等你回应。', '{ta} called once and waited for your reply.']], play: [['{ta}扑着翅膀，想从笼子里出来。', '{ta} flapped its wings, wanting out of the cage.']] },
    thanks: { default: [['{ta}啾啾叫了两声。', '{ta} chirped twice.'], ['{ta}梳了梳羽毛，神气十足。', '{ta} preened, full of pride.'], ['{ta}学着你的声音叫了一声。', '{ta} imitated your voice with a call.']] },
    glance: [['{ta}在栖杆上换了个脚站着，看着你。', '{ta} switched feet on the perch, looking at you.'], ['{ta}歪着头，眼睛一眨一眨。', '{ta} tilted its head, blinking.'], ['{ta}把脑袋缩进羽毛里，只露出一只眼睛。', '{ta} tucked its head into its feathers, one eye showing.'], ['{ta}叫了几声，像是在打招呼。', '{ta} gave a few calls, as if greeting you.']],
    back: [['{ta}学着你的口哨声唱了起来。', '{ta} sang along to your whistle.'], ['{ta}飞到你的肩膀上，小声哼着。', '{ta} flew to your shoulder and hummed softly.'], ['{ta}叼来一根羽毛，放在你的手心里。', '{ta} brought a feather and placed it in your palm.'], ['{ta}在你不说话的时候，唱了一整个下午。', '{ta} sang all afternoon while you stayed quiet.']],
    say: [['{ta}学了一声门铃。', '{ta} imitated the doorbell.'], ['{ta}唱了一段不成调的歌。', '{ta} sang a tuneless little song.'], ['{ta}在栖杆上荡来荡去。', '{ta} swung back and forth on the perch.'], ['{ta}抖了抖翅膀。', '{ta} shook out its wings.'], ['{ta}把瓜子壳啄得到处都是。', '{ta} pecked seed shells everywhere.']],
  });
  fill('fish', {
    request: { hunger: [['{ta}在水面绕了一圈，等着投食。', '{ta} circled the surface, waiting for food.'], ['{ta}张着嘴，一下一下地吐泡泡。', '{ta} opened its mouth and blew bubbles one by one.']], clean: [['缸壁长了一层绿绿的东西。', 'A green film has grown on the glass.'], ['水看起来有些浑浊。', 'The water looks a little cloudy.']], oxygen: [['{ta}靠在水面，嘴一张一合。', '{ta} hung at the surface, mouth opening and closing.']] },
    thanks: { default: [['{ta}摆了摆尾巴。', '{ta} flicked its tail.'], ['{ta}吐了一串小泡泡。', '{ta} blew a string of tiny bubbles.'], ['{ta}慢慢地游了一圈。', '{ta} swam slowly around once.']], feed: [['{ta}一口一口地吃，鳃盖一张一合。', '{ta} ate bite by bite, gills opening and closing.']] },
    glance: [['{ta}贴着玻璃，一动不动地看着你。', '{ta} hung against the glass, watching you without moving.'], ['{ta}从水草后面游出来，又游了回去。', '{ta} swam out from the weeds and back again.'], ['{ta}跟着你的手指游来游去。', '{ta} followed your finger back and forth.'], ['{ta}慢悠悠地翻了个身。', '{ta} lazily rolled over.']],
    back: [['{ta}游到离你最近的地方，停在那里。', '{ta} swam to the spot nearest you and stayed.'], ['{ta}吐了一个很大的泡泡。', '{ta} blew a very large bubble.'], ['{ta}在水草之间穿来穿去，像是在表演。', '{ta} wove through the weeds as if performing.'], ['{ta}在你看它的时候，摆出了最好看的姿势。', '{ta} struck its prettiest pose while you looked.']],
    say: [['{ta}在缸里转了个圈。', '{ta} circled the tank once.'], ['{ta}吐了一串泡泡。', '{ta} blew a string of bubbles.'], ['{ta}躲在水草后面。', '{ta} hid behind the weeds.'], ['{ta}慢慢摆了摆尾巴。', '{ta} slowly swished its tail.'], ['{ta}浮到水面，张了张嘴。', '{ta} rose to the surface and opened its mouth.']],
  });
  fill('turtle', {
    request: { thirst: [['{ta}趴在水边，不太想动。', '{ta} lay at the water’s edge, reluctant to move.']], hunger: [['{ta}伸长脖子看着食盆，一动不动。', '{ta} stretched its neck toward the dish and froze.']], warmth: [['{ta}缩在角落里，把头藏了起来。', '{ta} huddled in a corner, head tucked away.']], clean: [['水有点浑，{ta}不太想游。', 'The water is murky and {ta} does not feel like swimming.']] },
    thanks: { default: [['{ta}慢慢眨了眨眼。', '{ta} blinked slowly.'], ['{ta}伸出脖子，又慢慢缩了回去。', '{ta} stretched its neck out and slowly drew it back.'], ['{ta}安静地趴在石头上。', '{ta} lay quietly on the rock.']] },
    glance: [['{ta}从石头上抬起头，看着你。', '{ta} raised its head from the rock to look at you.'], ['{ta}慢慢地划过水面。', '{ta} paddled slowly across the surface.'], ['{ta}把脖子伸得老长，盯着你手里的东西。', '{ta} stretched its neck long to eye what you held.'], ['{ta}晒着灯，眯着眼睛。', '{ta} basked under the lamp, eyes narrowed.']],
    back: [['{ta}慢吞吞地爬到离你最近的那一边。', '{ta} slowly crawled to the side nearest you.'], ['{ta}伸出头来，让你摸了一下。', '{ta} put out its head and let you touch it once.'], ['{ta}认出了你的脚步声，把头伸了出来。', '{ta} knew your footsteps and poked its head out.'], ['{ta}安安静静地陪着你，一整个晚上。', '{ta} kept you company, quietly, all evening.']],
    say: [['{ta}缓缓地游了一圈。', '{ta} slowly swam one lap.'], ['{ta}把脖子伸得老长。', '{ta} stretched its neck very long.'], ['{ta}慢慢爬上了石头。', '{ta} slowly climbed onto the rock.'], ['{ta}眯着眼，晒着灯。', '{ta} basked under the lamp, eyes narrowed.'], ['{ta}把头缩了回去。', '{ta} drew its head back in.']],
  });
  fill('snake', {
    request: { warmth: [['{ta}盘在角落里，一动不动，像是有点冷。', '{ta} lay coiled in a corner, motionless, as if a bit cold.'], ['{ta}整个身体贴在保温灯下面。', '{ta} pressed its whole body under the heat lamp.']], thirst: [['{ta}舔了舔空的水盆。', '{ta} flicked its tongue at the empty bowl.'], ['{ta}把头伸进水盆里，什么也没碰到。', '{ta} put its head in the bowl and touched nothing.']], hunger: [['{ta}缓缓地抬起头，朝着你的方向吐了吐信子。', '{ta} slowly raised its head and flicked its tongue toward you.']] },
    thanks: { default: [['{ta}吐了吐信子，一动不动。', '{ta} flicked its tongue and stayed still.'], ['{ta}缓缓地换了个盘法。', '{ta} slowly changed its coil.'], ['{ta}把头靠在了你的手指边。', '{ta} rested its head near your finger.']] },
    glance: [['{ta}从盘着的身体中抬起头。', '{ta} lifted its head from the coil.'], ['{ta}慢慢地转动着脑袋，看着你。', '{ta} slowly turned its head, watching you.'], ['{ta}整个身体沿着玻璃爬了半圈。', '{ta} crawled half a lap along the glass.']],
    back: [['{ta}安静地缠在你的手腕上，一动不动。', '{ta} wrapped quietly around your wrist, motionless.'], ['{ta}不再躲避你的手。', '{ta} no longer shied from your hand.'], ['{ta}盘在你靠近的这一侧，睡着了。', '{ta} coiled on the side nearest you and fell asleep.']],
    say: [['{ta}吐了吐信子。', '{ta} flicked its tongue.'], ['{ta}缓缓地盘成了一个圈。', '{ta} slowly formed a coil.'], ['{ta}在保温灯下一动不动。', '{ta} lay still under the heat lamp.']],
  });
  fill('plant', {
    request: { water: [['{ta}的叶尖有点卷了。', '{ta}’s leaf tips are starting to curl.']], sun: [['{ta}整个朝着窗户的方向歪着。', '{ta} leans entirely toward the window.']], fertilize: [['新叶比前几天更小了。', 'The new leaves are smaller than a few days ago.']], prune: [['有一根枝条歪向了一边。', 'One branch has bent to the side.']] },
    thanks: { default: [['{ta}的叶子在光里轻轻颤了颤。', '{ta}’s leaves trembled lightly in the light.'], ['{ta}好像舒展开了一点。', '{ta} seems to have spread out a little.'], ['{ta}的叶子在水珠下闪闪发亮。', '{ta}’s leaves glittered under the drops.']] },
    glance: [['{ta}的叶子在窗边微微晃着。', '{ta}’s leaves swayed slightly by the window.'], ['{ta}的影子落在墙上，慢慢移动。', '{ta}’s shadow moved slowly across the wall.'], ['{ta}安安静静地待在原地。', '{ta} stayed quietly where it was.']],
    back: [['{ta}悄悄长出了一片嫩绿的新叶。', '{ta} quietly put out a tender green leaf.'], ['{ta}的叶子朝你这边转了过来。', '{ta}’s leaves turned toward you.'], ['{ta}开出了一朵很小很小的花。', '{ta} bloomed with a very small flower.']],
    say: [['{ta}落下了一片叶子。', '{ta} dropped a leaf.'], ['{ta}朝着光的方向歪了歪。', '{ta} leaned toward the light.'], ['{ta}的新芽顶开了土。', '{ta}’s new shoot pushed through the soil.'], ['{ta}的叶子沾着一颗水珠。', '{ta}’s leaf held a drop of water.'], ['{ta}在风里轻轻摇晃。', '{ta} swayed gently in the wind.']],
  });

  /* ---------- 五种新动物的整套声线 ---------- */
  const NEW = {
    hedgehog: {
      request: { thirst: [['{ta}舔着空的水碗边。', '{ta} licked the edge of the empty bowl.'], ['{ta}把小鼻子凑到水碗里，只闻到空气。', '{ta} put its small nose into the bowl and smelled only air.'], ['{ta}在碗边嗅了半天。', '{ta} sniffed around the bowl for ages.']], hunger: [['{ta}在食盆边转了好几圈。', '{ta} circled the food dish several times.'], ['{ta}的鼻子一抽一抽，在找吃的。', '{ta}’s nose twitched, searching for food.'], ['{ta}翻着空盆，发出哗啦哗啦的声音。', '{ta} rattled the empty dish.']], play: [['{ta}在笼子里窸窸窣窣地走来走去。', '{ta} rustled back and forth in the cage.'], ['{ta}对着笼门使劲嗅。', '{ta} sniffed hard at the cage door.'], ['{ta}想出去散散步。', '{ta} wanted to go out for a stroll.']], clean: [['笼子里的味道不太对。', 'The cage smells a bit off.'], ['{ta}把垫料扒得乱七八糟。', '{ta} scattered the bedding everywhere.'], ['{ta}躲在角落里，不想动了。', '{ta} hid in a corner and did not want to move.']] },
      thanks: { default: [['{ta}把刺放松了一点。', '{ta} relaxed its spines a little.'], ['{ta}打了个小小的呼噜。', '{ta} gave a tiny snuffle.'], ['{ta}抬头嗅了嗅你的手指。', '{ta} lifted its head and sniffed your finger.']], water: [['{ta}舔得啪嗒啪嗒响。', '{ta} lapped noisily.']], feed: [['{ta}津津有味地嚼着。', '{ta} chewed with great relish.']], pet: [['{ta}缩成一团，又慢慢松开。', '{ta} curled into a ball and slowly uncurled.']], play: [['{ta}在地上飞快地跑了一圈。', '{ta} ran a quick lap on the floor.']], clean: [['{ta}在新垫料里钻来钻去。', '{ta} burrowed around in the fresh bedding.']] },
      glance: [['{ta}从窝里探出尖尖的小鼻子。', '{ta} poked a pointy nose out of the nest.'], ['{ta}慢慢地把刺放平，看着你。', '{ta} slowly flattened its spines to look at you.'], ['{ta}在笼子里踱来踱去。', '{ta} paced up and down the cage.'], ['{ta}用鼻子顶了顶笼子的栏杆。', '{ta} nudged the cage bars with its nose.'], ['{ta}把脑袋缩进刺里，又悄悄露出来。', '{ta} drew its head into the spines and slyly peeked out.']],
      back: [['{ta}放下了全部的刺，让你摸了一下。', '{ta} lowered all its spines and let you touch it.'], ['{ta}慢慢爬进了你的手心。', '{ta} slowly climbed into your palm.'], ['{ta}不再缩成一团，凑过来嗅你的手。', '{ta} no longer curled up, and came to sniff your hand.'], ['{ta}在你的膝盖上睡着了。', '{ta} fell asleep on your knee.'], ['{ta}慢慢地、慢慢地向你靠过来。', '{ta} slowly, slowly crept toward you.']],
      reveal: ['{ta}是一个不太会表达的小家伙，但每次你来，它都不再缩成一团。', '{ta} is not good at showing it, but whenever you come, it stops curling up.'],
      say: [['{ta}在落叶里窸窸窣窣地走着。', '{ta} rustled through the leaves.'], ['{ta}打了个小小的喷嚏。', '{ta} sneezed a small sneeze.'], ['{ta}把自己团成了一个球。', '{ta} rolled itself into a ball.'], ['{ta}对着空气嗅了很久。', '{ta} sniffed at the air for a long time.'], ['{ta}白天一直睡，傍晚才醒。', '{ta} slept all day and woke only at dusk.'], ['{ta}用小爪子抓了抓脸。', '{ta} scratched its face with a tiny paw.']],
    },
    duck: {
      request: { thirst: [['{ta}对着空水盆嘎了一声。', '{ta} quacked at the empty basin.'], ['{ta}扁着嘴，在盆底拨来拨去。', '{ta} dabbled around the bottom of the basin.'], ['{ta}站在水盆边，一脸委屈。', '{ta} stood by the basin looking wronged.']], hunger: [['{ta}嘎嘎地叫着，在你脚边绕。', '{ta} quacked and circled at your feet.'], ['{ta}盯着食槽，一步也不肯离开。', '{ta} fixed on the trough and would not leave.'], ['{ta}把嘴伸进空碗里翻了又翻。', '{ta} dug into the empty bowl again and again.']], company: [['{ta}摇摇摆摆地跟在你后面。', '{ta} waddled along behind you.'], ['{ta}嘎了一声，等你回头。', '{ta} quacked once, waiting for you to turn.'], ['{ta}把脑袋靠在你腿边。', '{ta} rested its head against your leg.']], play: [['{ta}对着水盆扑腾了好几下。', '{ta} flapped at the basin several times.'], ['{ta}想去水里玩。', '{ta} wanted to play in the water.'], ['{ta}在地上张开翅膀，转了半圈。', '{ta} spread both wings and turned half a circle.']], clean: [['水盆里的水已经脏了。', 'The basin water has gone dirty.'], ['{ta}嫌弃地抖了抖脚蹼。', '{ta} shook its webbed feet in disgust.'], ['地上有点脏，{ta}不愿落脚。', 'The ground is dirty and {ta} will not step down.']] },
      thanks: { default: [['{ta}嘎嘎两声，扭着屁股走开了。', '{ta} quacked twice and wiggled away.'], ['{ta}拍了拍翅膀，神气十足。', '{ta} flapped, full of pride.'], ['{ta}把嘴巴在你手上蹭了蹭。', '{ta} rubbed its bill against your hand.']], water: [['{ta}大口大口地喝，还抖了抖头。', '{ta} drank in big gulps and shook its head.']], feed: [['{ta}吃得嘎嘎响。', '{ta} ate with loud smacks.']], pet: [['{ta}眯着眼睛，伸长了脖子。', '{ta} narrowed both eyes and stretched its neck.']], play: [['{ta}在水里扑腾了半天。', '{ta} splashed about for ages.']], clean: [['{ta}在干净的水里转了几圈。', '{ta} paddled a few laps in clean water.']] },
      glance: [['{ta}摇摇摆摆地走过，朝你嘎了一声。', '{ta} waddled past and quacked at you.'], ['{ta}把脑袋歪过来，一只眼睛盯着你。', '{ta} tilted its head and watched you with one eye.'], ['{ta}在水盆里浮着，慢悠悠地转圈。', '{ta} floated in the basin, turning slowly.'], ['{ta}整理着羽毛，时不时看你一眼。', '{ta} preened, glancing at you now and then.'], ['{ta}抖了抖尾巴，一脸得意。', '{ta} wagged its tail looking very pleased.']],
      back: [['{ta}一直跟在你脚后跟，你停它也停。', '{ta} stayed at your heels, stopping when you stopped.'], ['{ta}把脑袋靠在你的腿上，闭上了眼。', '{ta} laid its head on your leg and closed both eyes.'], ['{ta}叼来一片树叶，放在你的脚边。', '{ta} brought a leaf and dropped it at your feet.'], ['{ta}把嘴伸到你的手心里，轻轻碰了碰。', '{ta} put its bill into your palm and touched it softly.'], ['{ta}在你面前展开翅膀，转了一个圈。', '{ta} spread its wings and turned a full circle before you.']],
      reveal: ['{ta}不管你去哪里，都要摇摇摆摆地跟上来，哪怕你根本没走远。', '{ta} waddles after you wherever you go, even if you have gone nowhere.'],
      say: [['{ta}嘎了一声，不知道在说什么。', '{ta} quacked something unclear.'], ['{ta}一头扎进水里，又浮了起来。', '{ta} dipped its head under and bobbed up.'], ['{ta}摇着屁股走过去。', '{ta} wiggled past.'], ['{ta}把水溅了一地。', '{ta} splashed water everywhere.'], ['{ta}张开嘴，打了个很大的哈欠。', '{ta} opened its bill in a huge yawn.'], ['{ta}对着自己的倒影嘎了一声。', '{ta} quacked at its own reflection.']],
    },
    ferret: {
      request: { thirst: [['{ta}扒着水瓶，咚咚地敲。', '{ta} pawed at the water bottle, tapping.'], ['{ta}舔着空水碗，抬头看你。', '{ta} licked the empty bowl and looked up at you.'], ['{ta}钻进水碗旁边的管子，又钻了出来。', '{ta} dived into the tube by the bowl and out again.']], hunger: [['{ta}叼着空碗，拖到你脚边。', '{ta} dragged the empty bowl to your feet.'], ['{ta}在你脚边窜来窜去，鼻子一直朝着厨房。', '{ta} darted around your feet, nose toward the kitchen.'], ['{ta}把食盆翻了个底朝天。', '{ta} turned the dish upside down.']], company: [['{ta}一下子跳到了你的腿上。', '{ta} hopped straight onto your lap.'], ['{ta}绕着你的脚踝转圈。', '{ta} circled your ankle.'], ['{ta}爬上你的肩膀，趴在那里。', '{ta} climbed to your shoulder and lay there.']], play: [['{ta}在地上蹦来蹦去，像在跳舞。', '{ta} bounced around the floor like dancing.'], ['{ta}叼着一只袜子，满屋子跑。', '{ta} ran around the house with a sock.'], ['{ta}在管道里钻进钻出，叫个不停。', '{ta} darted in and out of the tunnel, chirping.']], clean: [['窝里的味道已经很浓了。', 'The nest smells quite strong now.'], ['{ta}把垫子拖到了窝外面。', '{ta} dragged the bedding out of the nest.'], ['{ta}嫌弃地打了个喷嚏。', '{ta} sneezed in disgust.']] },
      thanks: { default: [['{ta}发出咯咯的笑声。', '{ta} made a soft chuckling sound.'], ['{ta}在你脚边打了个滚。', '{ta} rolled over at your feet.'], ['{ta}叼着你的袖口，扯了扯。', '{ta} tugged at your sleeve.']], water: [['{ta}喝得叭叭响。', '{ta} drank with loud smacks.']], feed: [['{ta}吃得头都不抬。', '{ta} ate without lifting its head.']], pet: [['{ta}舒服得整个身子都软了。', '{ta} went completely limp with comfort.']], play: [['{ta}跳起了奇怪的舞步。', '{ta} did a strange little dance.']], clean: [['{ta}在干净的窝里滚来滚去。', '{ta} rolled around in the clean nest.']] },
      glance: [['{ta}从沙发底下探出头来。', '{ta} poked its head out from under the sofa.'], ['{ta}叼着一只袜子，从你面前跑过。', '{ta} ran past carrying a sock.'], ['{ta}整个身体拉得老长，看着你。', '{ta} stretched itself long to look at you.'], ['{ta}一动不动地盯着你，然后突然跳起来。', '{ta} stared at you without moving, then suddenly leaped.'], ['{ta}从一个纸袋里钻了出来。', '{ta} popped out of a paper bag.']],
      back: [['{ta}把偷来的袜子藏到你的鞋子里。', '{ta} hid a stolen sock in your shoe.'], ['{ta}趴在你的肩膀上，一动不动，很久。', '{ta} lay on your shoulder without moving for a long while.'], ['{ta}钻进你的衣服里，只露出一个小脑袋。', '{ta} crawled into your clothes with only a small head sticking out.'], ['{ta}在你怀里睡着了，发出细细的呼噜声。', '{ta} fell asleep in your arms, purring faintly.'], ['{ta}把你的钥匙叼到了窝里。', '{ta} carried your keys to its nest.']],
      reveal: ['{ta}总会偷偷把你的东西藏进窝里，其实只是想让你多看它一眼。', '{ta} keeps sneaking your things into its nest, really just wanting you to look at it more.'],
      say: [['{ta}在沙发底下发出窸窸窣窣的声音。', '{ta} rustled around under the sofa.'], ['{ta}咯咯地笑了一声。', '{ta} chuckled once.'], ['{ta}突然蹦了起来，又躺下了。', '{ta} suddenly leaped up and lay down again.'], ['{ta}把一只拖鞋拖进了窝里。', '{ta} dragged a slipper into its nest.'], ['{ta}钻进一个袜子里，不出来了。', '{ta} crawled into a sock and refused to come out.'], ['{ta}睡成了一条软软的长条。', '{ta} slept stretched out like a soft ribbon.']],
    },
    axolotl: {
      request: { hunger: [['{ta}贴着玻璃，用小手扒拉着。', '{ta} pressed against the glass, pawing with tiny hands.'], ['{ta}摇着外鳃，张着嘴看你。', '{ta} waved its gills and opened its mouth at you.'], ['{ta}在缸底转了一圈，一脸期待。', '{ta} circled the tank bottom looking hopeful.']], clean: [['缸里的水有点发黄了。', 'The tank water has gone a bit yellow.'], ['{ta}的外鳃缩了起来。', '{ta}’s gills have shrunk in.'], ['水里有一层薄薄的东西。', 'There is a thin film in the water.']], thirst: [['{ta}待在水面附近，不太想动。', '{ta} stayed near the surface, reluctant to move.'], ['缸里的水位稍微低了一点。', 'The water level is a little lower.'], ['{ta}在缸壁边慢慢地蹭。', '{ta} drifted slowly along the glass.']] },
      thanks: { default: [['{ta}笑眯眯地摇了摇外鳃。', '{ta} smiled and waved its gills.'], ['{ta}一动不动地漂在水里。', '{ta} floated without moving.'], ['{ta}吐了一串小泡泡。', '{ta} blew a string of small bubbles.']], feed: [['{ta}一口吞下，鼓起腮帮子。', '{ta} swallowed in one gulp, cheeks puffed.']], clean: [['{ta}在清水里舒展开四肢。', '{ta} stretched all four limbs in clear water.']], pet: [['{ta}眨了眨眼，没有躲开。', '{ta} blinked and did not shy away.']] },
      glance: [['{ta}贴在玻璃上，笑眯眯地看着你。', '{ta} pressed against the glass, smiling at you.'], ['{ta}慢慢地划动小手，浮了起来。', '{ta} paddled with tiny hands and slowly rose.'], ['{ta}摆了摆外鳃，像是在打招呼。', '{ta} waved its gills as if greeting you.'], ['{ta}在水底慢悠悠地走着。', '{ta} strolled leisurely along the bottom.'], ['{ta}张开嘴，像是打了个哈欠。', '{ta} opened its mouth like a yawn.']],
      back: [['{ta}一直跟着你的手指游。', '{ta} followed your finger the whole time.'], ['{ta}浮到水面，朝你笑了一下。', '{ta} floated up and smiled at you.'], ['{ta}把小手贴在玻璃上，对着你。', '{ta} laid its tiny hand on the glass toward you.'], ['{ta}一直在缸边等着你，不去别处。', '{ta} waited by the glass for you and went nowhere else.'], ['{ta}慢慢地摇着外鳃，像是在跳舞。', '{ta} slowly waved its gills as if dancing.']],
      reveal: ['{ta}什么都不说，只是笑眯眯地看着你，好像永远不会生气。', '{ta} says nothing and just smiles at you, as if it could never be angry.'],
      say: [['{ta}摇了摇外鳃。', '{ta} waved its gills.'], ['{ta}慢慢爬上了缸里的石头。', '{ta} slowly climbed onto the rock in the tank.'], ['{ta}吐了一个泡泡。', '{ta} blew a bubble.'], ['{ta}眯着眼睛，像在笑。', '{ta} narrowed its eyes as if smiling.'], ['{ta}浮到水面，换了口气。', '{ta} rose to the surface for a breath.'], ['{ta}把小手贴在了玻璃上。', '{ta} pressed a tiny hand to the glass.']],
    },
    chicken: {
      request: { thirst: [['{ta}在空水槽边咯咯叫。', '{ta} clucked beside the empty trough.'], ['{ta}一下一下地啄着水槽底。', '{ta} pecked at the bottom of the trough.'], ['{ta}歪着头看着水槽。', '{ta} tilted its head at the trough.']], hunger: [['{ta}咯咯咯地围着你转。', '{ta} clucked and circled you.'], ['{ta}在地上啄来啄去，什么也没啄到。', '{ta} pecked about the ground and found nothing.'], ['{ta}盯着你的口袋，不肯移开。', '{ta} stared at your pocket and would not look away.']], company: [['{ta}小跑着凑到你脚边。', '{ta} trotted up to your feet.'], ['{ta}咕咕地叫着，等你回应。', '{ta} clucked, waiting for a reply.'], ['{ta}蹲在你身旁，不肯走。', '{ta} squatted beside you and would not leave.']], clean: [['鸡窝里的稻草已经很脏了。', 'The straw in the coop has gotten dirty.'], ['{ta}嫌弃地刨了刨窝里的草。', '{ta} scratched at the straw in disgust.'], ['窝里有一股味道。', 'The coop has a smell.']] },
      thanks: { default: [['{ta}咯咯咯地叫了几声。', '{ta} clucked a few times.'], ['{ta}拍了拍翅膀，昂首阔步地走了。', '{ta} flapped and strutted away.'], ['{ta}啄了啄你的鞋带。', '{ta} pecked at your shoelace.']], water: [['{ta}喝一口，抬头，再喝一口。', '{ta} drank, lifted its head, and drank again.']], feed: [['{ta}啄得飞快，头一点一点的。', '{ta} pecked fast, head bobbing.']], pet: [['{ta}蹲下来，眯起了眼睛。', '{ta} squatted and narrowed both eyes.']], clean: [['{ta}在新的稻草里刨来刨去。', '{ta} scratched about in the fresh straw.']] },
      glance: [['{ta}昂着头，从你面前走过。', '{ta} walked past with head high.'], ['{ta}歪着头，用一只眼睛看着你。', '{ta} tilted its head and watched you with one eye.'], ['{ta}在地上啄啄停停，时不时抬头看你。', '{ta} pecked and paused, glancing up at you now and then.'], ['{ta}抖了抖羽毛，蹲了下来。', '{ta} fluffed its feathers and squatted.'], ['{ta}咯咯叫着，像是在打招呼。', '{ta} clucked as if greeting you.']],
      back: [['{ta}在窝里下了一个蛋，咯咯地叫着让你来看。', '{ta} laid an egg and clucked for you to come see.'], ['{ta}一直跟在你的脚后跟，你走哪它走哪。', '{ta} stayed at your heels wherever you went.'], ['{ta}把一条虫子啄来，放在你脚边。', '{ta} pecked up a worm and dropped it at your feet.'], ['{ta}蹲在你的脚边，睡着了。', '{ta} squatted at your feet and fell asleep.'], ['{ta}把羽毛蓬了起来，神气地走了两圈。', '{ta} fluffed up and strutted two laps.']],
      reveal: ['{ta}每天早上都在窝门口等你，你来了，它才肯下蛋。', '{ta} waits at the coop door every morning, and only lays when you arrive.'],
      say: [['{ta}咯咯地叫了一声。', '{ta} clucked once.'], ['{ta}在地上刨了几下。', '{ta} scratched the ground a few times.'], ['{ta}把羽毛抖得蓬蓬的。', '{ta} fluffed its feathers up.'], ['{ta}一边走一边点头。', '{ta} nodded as it walked.'], ['{ta}对着一只蝴蝶歪了歪头。', '{ta} tilted its head at a butterfly.'], ['{ta}晒着太阳，打起了盹。', '{ta} dozed in the sun.']],
    },
  };
  for (const v in NEW) fill(v, NEW[v]);
})(globalThis.CY = globalThis.CY || {});
