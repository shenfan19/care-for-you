/* English content pack: character voices, the sayings library, the question bank, real-life reminders and condition texts.
   Item ids match the Chinese pack, so a saying you picked or a question you answered keeps its meaning when the language changes.
   Placeholders: {ta} is he, she or it, {title} is what a child calls you, {name} is the character name. Lines avoid object and possessive pronouns on purpose. */
(function (CY) {
  const C = CY.content;
  const V = {};

  V.elder = {
    request: {
      thirst: ['...A little thirsty.', 'Um, some water, please.'], hunger: ['What time is it? Have you eaten yet?', 'My stomach feels a bit empty.'], rest: ["I'll sit down for a while.", 'My back is acting up again.'],
      company: ["You're busy... never mind.", 'Come and sit with me?'], medicine: ['Is it time for my pills?', "I can't remember if I took them."], hygiene: ['I could do with a wash.'], mobility: ['My legs feel stiff. A short walk, maybe?'],
    },
    thanks: { water: ['Mm.'], feed: ['Good, good.'], meal: ['Lovely. You are a good cook.'], rest: ['I just need to lean back a while.'], pet: ['...'], hand: ['Your hands are so big now.'], medicine: ['Taken. Mind you take care of yourself too.'], walk: ['The air does me good.'], default: ['Mm.'] },
    glance: ['{ta} looked at you from the doorway, said nothing, and wandered off.', '{ta} sat nearby, just watching you.', '{ta} coughed softly, as if about to say something, then did not.'],
    cares_back: ['{ta} set a glass of water by your hand and said nothing.', '{ta} quietly turned your desk lamp up a little.', '{ta} came over and pulled the coat back up on your shoulders.', '{ta} brought a plate of washed fruit and said: eat it while it is fresh.'],
    reveal: "{ta} looked at you and said: you go round and round for me, aren't you tired? I am fine. You must eat too.",
  };
  V.parent = {
    request: {
      thirst: ['Could you pour me a glass of water?', 'My throat is a little dry.'], hunger: ['Have you eaten? I will just make do.', 'It must be time to cook.'], rest: ["I'll rest a bit, don't mind me.", 'A bit tired today.'],
      company: ['How have you been lately?', 'Come, talk with me a while.'], medicine: ['Is it time for my medicine?', 'Check for me, did I take my pills?'], hygiene: ['I will freshen up first.'],
    },
    thanks: { water: ['That is enough, thank you.'], feed: ['You eat too.'], meal: ['Smells good. You did not have to.'], rest: ['I will lie down a little, then I am fine.'], pet: ['Oh, look how grown up you are.'], hand: ['Your hands are cold.'], default: ["There, there, don't mind me, go on with your work."] },
    glance: ['{ta} stood at the kitchen door for a moment, looked at you, and went back to work.', '{ta} held the phone, about to ask something, then put it down.', '{ta} walked past behind you, very softly.'],
    cares_back: ['{ta} put a bowl of soup by your desk and said: drink it while it is hot.', '{ta} quietly topped up your cup.', '{ta} said: do not stay up late, I left the light on for you.', '{ta} folded the clothes you changed out of.'],
    reveal: '{ta} looked at you and said: I am all right here. Your own life matters too.',
  };
  V.aunt = {
    request: {
      thirst: ['Oh, a drink of water, dear?', 'Dying of thirst here, any water?'], hunger: ['Is dinner ready? Let me help.', 'A bit hungry, anything to eat?'], rest: ['I will sit a minute, my legs ache.', "I can't stand any longer, let me rest."],
      company: ['Come, come, let us chat!', 'Why so quiet lately?'], medicine: ['Where did I put the pills?', 'Am I supposed to take my medicine now?'], hygiene: ['I am going to have a wash.'],
    },
    thanks: { water: ['Thank you, thank you.'], feed: ['Delicious, delicious.'], meal: ['Oh, that is lovely.'], rest: ['Now that is better.'], pet: ['Oh, you.'], hand: ['You dear child.'], default: ['Oh, good.'] },
    glance: ['{ta} peeked around the door and smiled at you.', '{ta} waved at you while talking on the phone in the living room.', '{ta} walked past with a plate of fruit and nodded at it.'],
    cares_back: ['{ta} put the biggest piece of meat in your bowl.', '{ta} slipped you a red envelope and said: take it, do not refuse.', '{ta} said: you look thinner. Then served you a bowl of soup.'],
    reveal: '{ta} patted your hand and said: do not only think of us. You doing well is worth more than anything.',
  };
  V.sibling = {
    request: {
      thirst: ['Hey, got any water?', 'Thirsty. Pour me one.'], hunger: ['Hungry. Order something?', 'Anything to eat?'], rest: ["I'll nap. Don't wake me.", 'So sleepy.'],
      company: ['What are you up to?', 'Want to play something?', 'Come out and talk for a bit.'], medicine: ['Time for the pills, I think.'], hygiene: ['Going to hop in the shower.'],
    },
    thanks: { water: ['Fine.'], feed: ['OK, I owe you a meal.'], meal: ['Not bad. I owe you one.'], rest: ['Thanks.'], pet: ['What.'], hand: ['...so cheesy.'], chat: ['Heh. That helped.'], default: ['OK.'] },
    glance: ['{ta} leaned on the doorframe and watched you for a while without a word.', '{ta} sent you a meme and then went silent.', '{ta} lifted a chin at you.'],
    cares_back: ['{ta} left your favorite snack on your desk, pretending to have dropped it by chance.', '{ta} said: I will watch this, you go sleep.', '{ta} brought your parcel inside.'],
    reveal: '{ta} said: do not carry everything alone. I am right here.',
  };
  V.partner = {
    request: {
      thirst: ['Could you grab me a glass of water while you are up?', 'A little thirsty.'], hunger: ['What do you want for dinner?', 'I am a bit hungry.'], rest: ['I am tired, I just want to lean on you a while.'], company: ['You have hardly talked to me today.', 'Come sit with me?'],
      hygiene: ['I will take a shower first.'], medicine: ['Is it time for the medicine?', 'Check for me, did I take the pills?'],
    },
    thanks: { water: ['Thank you.'], meal: ['Delicious. Thank you for cooking.'], chat: ['Talking to you makes me feel better.'], pet: ['Mm, that is nice.'], default: ['Thank you.'] },
    glance: ['{ta} looked at you across the room and smiled.', '{ta} walked past and gently touched your shoulder.', '{ta} sat down next to you with two cups of tea.'],
    cares_back: ['{ta} reheated your share of dinner and left it by your hand.', '{ta} turned off the lights for you and said: sleep early.', '{ta} folded the coat you dropped and put it on the chair.'],
    reveal: '{ta} said: you have held it together alone for too long. Today it is my turn.',
  };
  V.child = {
    request: {
      thirst: ['{title}, water please.', 'Water!'], hunger: ["I'm hungry.", '{title}, I want dinner.'], rest: ["I'm sleepy...", '{title}, I want to go to bed.'], company: ['{title}~', '{title}, look at me.'],
      play: ['Play! {title}, play!', '{title}, play with me for a bit?'], hygiene: ['I need a bath.'], homework: ['I do not get this one.', 'I still have homework.'],
    },
    thanks: { water: ['Gulp gulp.'], feed: ['Yummy!'], meal: ['Yummy!'], play: ['Hehehe.'], soothe: ['...(slowly closed the eyes)'], pet: ['Hee.'], hand: ["{title}'s hands are warm."], bath: ['Splash!'], read: ['Again, again!'], default: ['Yes!'] },
    glance: ['{ta} stood at the door hugging a toy and looking at you.', '{ta} waved at you from far away.', '{ta} pressed a face against the doorframe, eyes shining.'],
    cares_back: ['{ta} ran over and pressed a candy into your hand, found from who knows where.', "{ta} touched your face and said: don't cry, {title}. You were not crying.", '{ta} put the favorite teddy on your chair.', '{ta} stood on tiptoe and patted your shoulder with a small hand.'],
    reveal: '{ta} hugged your leg, looked up, and said: {title}, I will look after you.',
  };
  V.infant = {
    request: {
      thirst: ['{ta} opened the mouth and fussed.'], hunger: ['{ta} burst into tears, small hands searching for food.', '{ta} cried and sucked on a tiny fist.'], rest: ['{ta} rubbed the eyes and fussed.'], company: ['{ta} stretched out two small hands, waiting to be picked up.'],
      play: ['{ta} stared at you and babbled.'], diaper: ['{ta} wriggled around and started to cry.'], fever: ['{ta} had a red little face and a weak cry.'], hygiene: ['{ta} smelled like it was time for a bath.'],
    },
    thanks: { feed: ['Gulp, gulp. Eating happily.'], diaper: ['{ta} made a comfortable little sound.'], soothe: ['{ta} slowly closed the eyes.'], hug: ['{ta} buried a face in your arms.'], pet: ['{ta} giggled.'], play: ['{ta} giggled and giggled.'], bath: ['{ta} splashed happily.'], default: ['{ta} quieted down.'] },
    glance: ['{ta} lay in the crib, eyes open, looking at you.', '{ta} waved a small hand.'],
    cares_back: ['{ta} caught one of your fingers and would not let go.', '{ta} smiled at you with a gummy smile.'],
    reveal: '{ta} looked at you and reached out to touch your face.',
    cry: ['Waaah... waaah...', 'Wah-wah-wah...', '{ta} cried and could not stop.'],
  };
  V.toddler = {
    request: {
      thirst: ['{title}, water.', 'Drink!'], hunger: ['Hungry!', '{title}, food.'], rest: ['Sleepy...', '{title}, hug, sleep.'], company: ['{title}! {title}!', 'Look at me, look at me.'],
      play: ['Play! Play!', '{title}, play together.'], diaper: ['{title}, wet.', '{ta} tugged at the pants and wrinkled up a face.'], fever: ['{title}, hot, yucky.'], breath: ['{ta} coughed a few times and was breathing fast.'], hygiene: ['{title}, bath, bath!'],
    },
    thanks: { feed: ['Yummy! More!'], diaper: ['Better.'], soothe: ['{ta} slowly closed the eyes.'], hug: ['Hug, no let go.'], pet: ['Hee hee.'], play: ['Again again!'], water: ['Gulp gulp.'], bath: ['Splash splash!'], read: ['Again! Again!'], default: ['Yes!'] },
    glance: ['{ta} stood at the door hugging a toy.', '{ta} toddled two steps toward you, then stopped.', '{ta} waved at you.'],
    cares_back: ['{ta} wobbled over and pushed a cracker into your hand.', "{ta} patted your leg and said: no cry. You were not crying.", '{ta} put the toy bear on your chair.'],
    reveal: '{ta} hugged your leg, looked up and said: {title}, good.',
    cry: ['Waaah, {title}!', 'Boo-hoo, no, no!', '{ta} cried, face bright red.'],
  };
  V.teen = {
    request: {
      thirst: ['Got any water?', 'So thirsty.'], hunger: ['I am hungry, anything to eat?', 'What is for dinner?'], rest: ['So tired, do not bug me.'], company: ['...Are you busy?', 'I want to tell you something.'],
      homework: ['I do not get this one.', 'So much homework, ugh.'], fever: ['I think I have a fever.'], hygiene: ['I will go shower.'],
    },
    thanks: { meal: ['Fine. ...Thanks.'], homework: ['Oh, so that is how it works.'], chat: ['...It was nothing, but it helps to say it.'], game: ['OK, that was fun.'], pet: ['What.'], default: ['Mm.'] },
    glance: ['{ta} wandered past with headphones on, then wandered back.', '{ta} leaned on the doorframe, wanting to say something.'],
    cares_back: ['{ta} topped up your cup, as if it was nothing.', '{ta} said: do not overwork. Then went back to the room quickly.'],
    reveal: '{ta} said: I do know how hard it is for you.',
  };
  V.cat = {
    request: {
      thirst: ['{ta} stood by the water bowl, looked at it, then at you.'], hunger: ['{ta} circled your feet once and meowed.'], company: ['{ta} jumped on the desk and sat down next to the keyboard.'], play: ['{ta} brought the battered little ball and dropped it at your feet.'], clean: ['{ta} gave the litter box a long, meaningful look.'],
    },
    thanks: { water: ['{ta} bent down and drank.'], feed: ['{ta} buried a face in the bowl, tail swaying.'], play: ['{ta} pounced out and pounced back.'], pet: ['{ta} narrowed the eyes and purred.'], hand: ['{ta} turned once in your arms and lay down.'], groom: ['{ta} stretched and purred.'], clean: ['{ta} gave a satisfied sniff.'], default: ['Meow.'] },
    glance: ['{ta} lay on the windowsill and glanced back at you.', '{ta} came over, bumped your hand with a head, and wandered off.'],
    cares_back: ['{ta} climbed on your lap and lay down. You noticed your shoulders were stiff.', '{ta} sat quietly next to you until you stood up.', '{ta} brushed a tail across the back of your hand, as if to say: time to rest.'],
    reveal: 'All afternoon {ta} lay by your feet, looking up whenever you moved. It seems {ta} had been waiting for you all along.',
  };
  V.dog = {
    request: {
      thirst: ['{ta} licked a mouth and looked at the empty bowl.'], hunger: ['{ta} sat by the food bowl, tail sweeping the floor.'], company: ['{ta} rested a chin on your knee and gazed up at you.'], play: ['{ta} carried the leash over and stood in front of you.'],
    },
    thanks: { water: ['{ta} gulped down half the bowl.'], feed: ['{ta} finished in three bites and looked up.'], play: ['{ta} raced a lap and came back.'], walk: ['{ta} trotted proudly beside you.'], pet: ['{ta} rolled over to show the belly.'], hand: ['{ta} leaned on you without moving.'], groom: ['{ta} wagged the whole back half.'], default: ['Woof.'] },
    glance: ['{ta} lay by the door and lifted a head when you moved.', '{ta} wagged the tail and lay down again.'],
    cares_back: ['{ta} set a soggy toy at your feet, giving you the best thing it had.', 'Whenever you sighed, {ta} came over and nudged your hand.', '{ta} stayed by your chair until you got up.'],
    reveal: 'All evening {ta} stayed beside you, and every time you shifted, {ta} shifted too. {ta} had been keeping you company all along.',
  };
  V.rabbit = {
    request: { thirst: ['{ta} licked at the empty water bottle.'], hunger: ['{ta} crouched by the food dish, nose twitching.'], company: ['{ta} nudged your foot and thumped once.'], play: ['{ta} circled the cage, wanting to hop around outside.'], clean: ['The cage smells a bit.'] },
    thanks: { water: ['{ta} drank several mouthfuls.'], feed: ['{ta} crunched happily.'], play: ['{ta} hopped three times and spun around.'], pet: ['{ta} narrowed the eyes and flattened the ears.'], groom: ['{ta} sat very still and let you.'], clean: ['{ta} sniffed it approvingly.'], default: ['{ta} twitched a nose.'] },
    glance: ['{ta} perked up the ears and looked at you.'], cares_back: ['{ta} lay quietly by your feet.', '{ta} licked your hand.'], reveal: 'All night {ta} lay by your feet, ears following every move you made.',
  };
  V.hamster = {
    request: { thirst: ['{ta} clung to the water bottle. It was empty.'], hunger: ['{ta} rummaged through the empty dish.'], play: ['{ta} looked at you from the wheel.'], clean: ['The bedding needs changing.'] },
    thanks: { water: ['{ta} lapped quickly.'], feed: ['{ta} stuffed both cheeks.'], play: ['{ta} ran on the wheel at full speed.'], pet: ['{ta} curled up in your palm.'], groom: ['{ta} squeaked.'], clean: ['{ta} dove into the new bedding and would not come out.'], default: ['{ta} squeaked.'] },
    glance: ['{ta} paused on the wheel and looked at you.'], cares_back: ['{ta} pushed a sunflower seed toward you.'], reveal: '{ta} sleeps by day and runs all night, as if keeping watch for you.',
  };
  V.bird = {
    request: { thirst: ['{ta} stood by the water cup and chirped twice.'], hunger: ['{ta} chirped at the feeder.'], play: ['{ta} hopped back and forth, wanting to fly outside.'], clean: ['The cage floor needs cleaning.'] },
    thanks: { water: ['{ta} pecked at the water.'], feed: ['{ta} pecked very seriously.'], play: ['{ta} flew a lap around the room and landed on your shoulder.'], pet: ['{ta} tilted a head and rubbed a finger.'], groom: ['{ta} fluffed up happily.'], clean: ['{ta} shook out the feathers.'], default: ['{ta} chirped.'] },
    glance: ['{ta} tilted a head and looked at you.'], cares_back: ['{ta} landed on your shoulder and hummed a little tune.'], reveal: '{ta} always sings when you are quiet, as if worried you are alone.',
  };
  V.fish = {
    request: { hunger: ['{ta} floated to the surface with an open mouth.'], clean: ['The water in the tank is cloudy.'], oxygen: ['{ta} gasped at the surface.'] },
    thanks: { feed: ['{ta} darted over and swallowed it in one gulp.'], clean: ['The water is clear and {ta} did a happy lap.'], default: ['{ta} blew a bubble.'] },
    glance: ['{ta} pressed against the glass and looked at you.'], cares_back: ['{ta} followed your finger back and forth.'], reveal: '{ta} just swims quietly, but whenever you come close, {ta} swims over.',
  };
  V.turtle = {
    request: { thirst: ['The water level is a bit low.'], hunger: ['{ta} stretched out a neck, eyeing the dish.'], warmth: ['{ta} lay in a corner without moving.'], clean: ['The water is dirty.'] },
    thanks: { water: ['{ta} swam a slow circle.'], feed: ['{ta} ate bit by bit.'], warm: ['{ta} spread out all four legs under the lamp.'], pet: ['{ta} pulled the neck in, then slowly out again.'], groom: ['{ta} blinked slowly.'], clean: ['{ta} paddled happily.'], default: ['{ta} looked at you.'] },
    glance: ['{ta} slowly climbed onto a rock and watched you.'], cares_back: ['{ta} crawled slowly to the spot nearest you.'], reveal: '{ta} says nothing and is simply, slowly, always there.',
  };
  V.snake = {
    request: { warmth: ['{ta} coiled in a corner of the tank and hardly moved.'], thirst: ['The water dish is dry.'], hunger: ['{ta} raised a head and slowly flicked a tongue.'] },
    thanks: { warm: ['{ta} slowly stretched out.'], water: ['{ta} glided to the water dish.'], feed: ['{ta} swallowed it quietly.'], pet: ['{ta} slowly turned a head and flicked a tongue.'], default: ['{ta} looked at you.'] },
    glance: ['{ta} coiled under the lamp, only the eyes following you.', '{ta} silently changed position.'],
    cares_back: ['{ta} coiled quietly on the side nearest to you, no fuss.', '{ta} stayed perfectly still while you worked, as if afraid to disturb you.'],
    reveal: '{ta} said nothing, only stayed in the spot nearest to you all afternoon.',
  };
  V.plant = {
    request: { water: ['The leaves are drooping a bit.', 'The soil is dry.'], sun: ['{ta} is leaning toward the window.'], fertilize: ['The new leaves are growing slowly.'], prune: ['A few leaves have turned yellow.'] },
    thanks: { water: ['The leaves slowly spread out.'], sun: ['{ta} seems to breathe a sigh of relief.'], fertilize: ['{ta} looks much livelier.'], prune: ['{ta} looks tidier.'], repot: ['{ta} settled happily into the new pot.'], pet: ['The leaves swayed a little.'], default: ['The leaves swayed a little.'] },
    glance: ['Sunlight fell on the leaves and the shadows slowly moved.', '{ta} grew a new leaf.'], cares_back: ['{ta} opened a tiny flower, facing you.', 'A new leaf curled into a small heart.'], reveal: 'Every time you pass by, {ta} grows a little toward you.',
  };

  const S = {
    elder01: 'Have you eaten yet?', elder02: 'It is cold out, wear more.', elder03: 'Nothing, just old troubles.', elder04: 'You go on, do not mind me.', elder05: 'When I was young...', elder06: 'Slowly, do not fall.', elder07: 'Be careful on the road.', elder08: 'I am not hungry, you eat.', elder09: 'Old Zhang next door went off to play chess again.', elder10: 'Young one, have you eaten?',
    parent01: 'Have you eaten?', parent02: 'Do not stay up late. Sleep early.', parent03: 'Let me know when you get home.', parent04: 'Is your money enough?', parent05: 'Your life is yours to decide.', parent06: 'I am fine, do not worry.', parent07: 'It is getting cold, put on another layer.', parent08: 'Are you coming home for dinner?',
    aunt01: 'Oh, you child.', aunt02: 'Eat more, look how thin you are.', aunt03: 'Come, come, sit down and talk.', aunt04: 'When you were little, you were so naughty.', aunt05: 'Take it, do not refuse.', aunt06: 'What have you been busy with?',
    sibling01: 'Fine, fine.', sibling02: 'Do what you think is best.', sibling03: 'Say so if you need help.', sibling04: 'I owe you a meal.', sibling05: 'Do not push yourself.', sibling06: 'Free this weekend?',
    child01: 'Hug!', child02: 'Just a bit more play.', child03: '{title}, look at me!', child04: 'I do not want to sleep.', child05: 'When I grow up I will look after you.', child06: '{title}~',
    cat01: 'Meow.', cat02: 'It nudged your hand with its head.', cat03: 'It sat on your keyboard and refused to move.', cat04: 'It circled your feet once.', cat05: 'It stepped on your stomach in the middle of the night.',
    dog01: 'Woof!', dog02: 'It circled you, tail wagging nonstop.', dog03: 'It carried your shoe to the door.', dog04: 'It waits at the door whenever you come home.', dog05: 'It rested its head on your leg.',
    snake01: 'It coiled still under the lamp.', snake02: 'It flicked its tongue and looked at you.', snake03: 'It slid slowly off the rock.', snake04: 'It quietly shed a layer of skin.',
    infant01: '{ta} giggled.', infant02: '{ta} caught your finger.', infant03: '{ta} blew a bubble at you.', infant04: '{ta} fell asleep in your arms.',
    toddler01: 'Hug!', toddler02: '{title}, look!', toddler03: 'No no!', toddler04: 'Again!', toddler05: '{title}, food.',
    teen01: 'Yeah yeah, I know.', teen02: 'Do not bug me.', teen03: '...Thanks.', teen04: 'I can do it myself.', teen05: 'I have something to tell you.',
    rabbit01: 'It hopped three times.', rabbit02: 'Its ears twitched.', rabbit03: 'It rolled over by your feet.',
    hamster01: 'It ran on the wheel all night.', hamster02: 'Its cheeks were stuffed full.',
    bird01: 'It sang a little song.', bird02: 'It landed on your shoulder.',
    fish01: 'It blew a bubble.', fish02: 'It followed your finger.',
    turtle01: 'It slowly stretched out its head.', turtle02: 'It basked on the rock.',
    plant01: 'It grows toward the window.', plant02: 'It grew a new leaf.',
    partner01: 'How was your day?', partner02: 'You eat first, I am not hungry.', partner03: 'Do not overdo it.', partner04: 'What do you want for dinner?', partner05: 'I am here.', partner06: 'Let us go for a walk this weekend.',
  };
  const sayings = Object.keys(S).map(id => ({ id, voice: id.replace(/\d+$/, ''), text: S[id] }));

  const A = {
    ask_e01: ['When you had a fever as a child, I carried you for miles on my back. Do you remember?', ['I do, it rained hard that day.', 'A bit. Tell me more.', 'Not really, but thank you.']],
    ask_e02: ['Are you sleeping well lately?', ['Fine, do not worry.', 'A bit tired, I am adjusting.', 'Always up late. Do not copy me.']],
    ask_e03: ['When I was young...', ['Take your time, I am listening.', 'You told me this when I was little.', 'And then?']],
    ask_e04: ['Have you eaten today?', ['I have, and you?', 'Not yet, soon.', 'Perfect, let us eat together.']],
    ask_e05: ['Have you lost weight again?', ['No, the clothes are loose.', 'Busy lately, I will watch it.', 'You are the one who should eat more.']],
    ask_e06: ['Am I a burden to you, this old frame of mine?', ['No, with you here I feel steady.', 'Please do not think that.', 'We are family.']],
    ask_e07: ['Come, a game of chess with me?', ['Sure, I will give you three stones.', 'After I finish this.', 'Today I will go first.']],
    ask_e08: ['I still keep one of your old baby clothes.', ['Really? I would love to see it.', 'You kept it all this time.', 'Put it away safely, do not lose it.']],
    ask_e09: ['How is the weather today?', ['Nice, let us go out for a walk.', 'A bit cold, wear more.', 'Why not go and see?']],
    ask_e10: ['Is the red envelope I gave you when you married still around?', ['Yes, I keep it safe.', 'Let me look for it.', 'Thank you for always remembering.']],
    ask_p01: ['Have you eaten?', ['I have, do not worry.', 'Not yet, soon.', 'Have you?']],
    ask_p02: ['Are you tired from work lately?', ['It is fine, I can manage.', 'A bit tired, but coping.', 'It will ease after this stretch.']],
    ask_p03: ['It is getting cold, did you bring enough clothes?', ['I did.', 'No, I will add some later.', 'You too, wear more.']],
    ask_p04: ['Can you come home for dinner?', ['This weekend for sure.', 'Cannot get away for now, in a few days.', 'I want to, let me arrange it.']],
    ask_p05: ['Alone out there, are you looking after yourself?', ['Yes, do not worry.', 'Sometimes I forget.', 'Honestly, it has been a lot lately.']],
    ask_p06: ['What were you most afraid of as a child, do you remember?', ['The dark.', 'Thunder.', 'I forgot, you tell me.']],
    ask_a01: ['Eat more, look how thin you are.', ['OK, I will eat.', 'I have not lost weight, you misremember.', 'You eat too.']],
    ask_a02: ['I took you to the temple fair when you were little. Do you remember?', ['I do, you bought me a sugar figure.', 'A little bit.', 'Tell me about that day.']],
    ask_a03: ['Anything happy happening lately?', ['Yes, let me tell you.', 'Nothing special.', 'Seeing you is happy enough.']],
    ask_a04: ['Do you have someone special?', ['Not yet, no hurry.', 'Let us not talk about it.', 'Yes, I will bring them to meet you.']],
    ask_s01: ['Remember fighting over the remote when we were little?', ['I do, you always cheated.', 'Ha, I remember.', 'You can have it first now.']],
    ask_s02: ['Anything fun lately?', ['Yes, I will tell you sometime.', 'No, just work every day.', 'You first.']],
    ask_s03: ['Free this weekend? Let us go out.', ['Yes, where to?', 'Not this week, next week.', 'OK, you choose.']],
    ask_s04: ['Were you up late again?', ['You caught me.', 'No, do not guess.', 'Early night tonight, promise.']],
    ask_s05: ['My stomach is a bit upset today. I would like something warm.', ['I will pour you something hot.', 'Want to rest first?', 'Do you need me to stay?']],
    ask_s06: ['I have not been feeling well and I am in a bad mood these days. Bear with me.', ['It is fine, I will give you some quiet.', 'Want something warm to drink?', 'Tell me anytime.']],
    ask_s07: ['How are Mom and Dad doing lately?', ['Fine, and you?', 'A bit worried, let us talk it over.', 'I will call them this week.']],
    ask_c01: ['{title}, were you this small once?', ['Yes, even smaller than you.', 'I asked lots of questions too.', 'Guess!']],
    ask_c02: ['{title}, why does the sky get dark?', ['Because the sun went to sleep.', 'Because the Earth is spinning.', 'Let us look it up together.']],
    ask_c03: ['{title}, will you come home early today?', ['Yes, I will try.', 'Not sure, but I will call.', 'I will come home early to play.']],
    ask_c04: ['{title}, I drew a picture. Do you want to see it?', ['Yes, show me!', 'OK, give me two minutes.', 'What did you draw?']],
    ask_c05: ['{title}, can I be like you when I grow up?', ['You will be even better.', 'What do you want to be like?', 'Being yourself is best.']],
    ask_t01: ['{title}, what is that?', ['That is a bird.', 'What do you think it is?', 'Let us go and look.']],
    ask_t02: ['{title}, I want this.', ['OK, here you go.', 'Say please first.', 'Not this one, but that one.']],
    ask_t03: ['{title}, do not go.', ['I am not going, I am right here.', 'I will be right back.', 'Come with me.']],
    ask_t04: ['{title}, I can do it!', ['Great! Once more.', 'Let me see.', 'You did it yourself?']],
    ask_g01: ['Were you like this when you were young?', ['Pretty much, I was annoyed too.', 'I was even worse.', 'Want to hear about it?']],
    ask_g02: ['I do not want to go to school.', ['What happened?', 'Take a day off today, we talk tomorrow.', 'I will go with you.']],
    ask_g03: ['What should I do in the future?', ['What do you like right now?', 'No hurry, think slowly.', 'I did not know either when I was young.']],
    ask_g04: ['Are you tired?', ['A bit, but fine.', 'You noticed.', 'Not when I see you.']],
    ask_m01: ['How was your day?', ['Not bad, and you?', 'A bit tired, hug me.', 'Let us eat first and talk slowly.']],
    ask_m02: ['Where do you want to go this weekend?', ['A walk in the park.', 'Stay in and sleep all day.', 'You choose, I will join you.']],
    ask_m03: ['Remember the first time we met?', ['I do, you were late.', 'A little bit.', 'Tell me about that day again.']],
    ask_m04: ['Is something on your mind lately?', ['A little, I will tell you later.', 'No, just tired.', 'I was about to talk to you.']],
  };
  const SENS = new Set(['ask_a04', 'ask_s06', 'ask_g02']);
  const asks = Object.keys(A).map(id => ({ id, say: A[id][0], answers: A[id][1] }));
  /* voice, stage, pronoun and sensitive flags come from the base pack; here only the texts differ */

  const nudges = [
    { id: 'n01', text: 'How long since you called your family?' },
    { id: 'n02', text: 'There is someone you have not been in touch with for a long time, right?' },
    { id: 'n03', text: 'Have you talked to anyone today, not about work?' },
    { id: 'n04', text: 'When did you last meet a friend?' },
    { id: 'n05', text: 'Send a message to the person who just came to mind, it need not be anything big.' },
    { id: 'n06', text: 'Stand up, drink some water, look out of the window.' },
    { id: 'n07', text: 'You have been sitting for a long time. Take a five-minute walk.' },
    { id: 'n08', text: 'How long since you invited a friend to dinner?' },
    { id: 'n09', text: 'Send someone you have not talked to in ages a line: how have you been.' },
    { id: 'n10', text: 'Have dinner with your family tonight, without looking at the phone.' },
    { id: 'n11', text: 'You have not moved for a while. Stretch.' },
    { id: 'n12', text: 'Look into the distance and let your eyes rest.' },
  ];

  const conds = {
    diabetes: {
      lines: { request: { medicine: ['Is it time for the pills?', '{ta} looked at the pill box, then at you.'], sugar: ['{ta} touched the little blood sugar kit.', 'Is it time to check?'] } },
      events: { dinner: { say: 'What is for dinner?', choices: [{ label: 'Braised pork', reply: '{ta} ate happily. You knew it was not good for {ta}.' }, { label: 'Steamed fish with greens', reply: '{ta} grumbled that it was too bland, but finished it.' }, { label: 'Whole grain porridge with sides', reply: '{ta} nodded and said it would do.' }] } },
    },
    hypertension: {
      lines: { request: { medicine: ['Is it time for the pills?', '{ta} looked at the pill box.'], bp: ['I have not measured my blood pressure today.', '{ta} rubbed the temples.'] } },
      events: { salty: { say: 'Should I add salt to the dish today?', choices: [{ label: 'A good pinch more', reply: '{ta} said it tastes better that way. You said nothing.' }, { label: 'Less salt, a splash of vinegar', reply: '{ta} tasted it and said it would do.' }, { label: 'No salt, plenty of ginger', reply: '{ta} frowned, then cleaned the plate.' }] } },
    },
    arthritis: { lines: { request: { joint: ['{ta} rubbed the knee and drew a quiet breath.', 'The weather is turning, my legs hurt again.'] } } },
    cold: { lines: { request: { fever: ['{ta} had a warm face and no energy.', '{ta} leaned back limply, forehead hot.'] } } },
    asthma: { lines: { request: { breath: ['{ta} coughed a few times and breathed quickly.', '{ta} pressed a hand to the chest, breathing heavily.'] } } },
    forgetful: { lines: { request: { reorient: ['Where did I put my keys?', 'What day is it today?', '{ta} stood at the door, not remembering where to go.'] } } },
    heart: { lines: { request: { medicine: ['Is it time for the pills?', '{ta} looked at the pill box.'], chest: ['{ta} pressed a hand to the chest and slowly sat down.', '{ta} said it felt tight, and that a rest would help.'] } } },
    parkinson: { lines: { request: { medicine: ['Is it time for the pills?', '{ta} looked at the pill box, then at the hands.'], tremor: ['{ta} held the cup, hands trembling gently.', '{ta} said the hands were not listening today.'] } } },
    depress: { lines: { request: { lowmood: ['{ta} sat by the window and said nothing for a long while.', '{ta} said: it is nothing, I just have no energy.'] } } },
    nocturia: {
      lines: { request: { toilet: ['{ta} got up again and felt the way toward the bathroom.', '{ta} said getting up several times a night is normal now.'] } },
      events: { pre_sleep: { say: 'Would you like some water before bed?', choices: [{ label: 'Just a sip', reply: '{ta} took a small sip and said that was enough.' }, { label: 'A big glass', reply: '{ta} drank happily. You knew the night would be interrupted.' }, { label: 'None, just rinse the mouth', reply: '{ta} nodded and said that was fine.' }] } },
    },
    eczema: { lines: { request: { itch: ['{ta} kept scratching the arm, frowning.', '{ta} fussed, little hands scratching at the skin.'] } } },
    fracture: { lines: { request: { pain: ['{ta} held the injured spot and drew in a breath.', '{ta} said it hurt again today.'] } } },
    trauma: { lines: { request: { nightmare: ['{ta} woke with a start and sat hugging both arms for a long time.', '{ta} kept watching the door and could not settle.'] } } },
    allergy: { lines: { request: { sneeze: ['{ta} sneezed several times in a row, eyes red.', '{ta} rubbed the nose and said the allergy was back.'] } } },
  };

  /* 补齐：这几句原先只有中文 */
  Object.assign(V.elder.thanks, { bath: ['Nice and clean, thank you.'], chat: ['Talking with you does me good.'] });
  Object.assign(V.parent.thanks, { chat: ['Talking with you eases my mind.'] });
  Object.assign(V.aunt.thanks, { chat: ['What a good chat.'] });
  Object.assign(V.child.thanks, { homework: ['Oh, I get it now!'] });
  Object.assign(V.partner.request, { mobility: ['My back aches a bit, I want to move around.'] });

  C.registerPack('en', { voices: V, sayings, asks, nudges, conds });
  /* items are merged by id; for asks and nudges only text fields need translating, the structure comes from the Chinese pack */
  const base = C.packs['zh-CN'];
  const withBase = (list, tr) => tr.map(it => Object.assign({}, (list.find(b => b.id === it.id) || {}), it));
  C.packs.en.asks = withBase(base.asks, asks);
  C.packs.en.nudges = withBase(base.nudges, nudges);
  C.packs.en.sayings = withBase(base.sayings, sayings);
  C.packs.en.asks.forEach(q => { if (SENS.has(q.id)) q.sensitive = true; });
})(globalThis.CY = globalThis.CY || {});
