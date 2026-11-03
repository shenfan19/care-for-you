/* 官方访客卡片，第二批。都是虚构化的短暂访客：来住几天，满意离开时留下一件无害的纪念品，离开后历史不变。
   选人标准：逝世超过五十年或为文学虚构人物，公认正面，不涉及战争、殖民、宗教创立和政治领袖；写的只是广为记载的习惯和爱好，不做诊断。
   每张卡都记出处 src 和核查结果 review。新增人物先在这里写卡，再跑 tests/play_test.js。 */
(function (CY) {
  const V = CY.visitors;
  const SK = { a: '#fffaf6', b: '#fde3d0', c: '#f6d2b4', d: '#e8bc92', e: '#d9a67c', f: '#a8714b', g: '#6e4631' };
  const OK = '2026-11-02 通过：无政治与宗教争议，只写习惯与爱好';
  /* P(id, 名字[中,英], 时代[中,英], 地区, 年龄, 性别代词, 外观[肤色,发色,发型,眼镜,衣服], 住几天[最少,最多], 想要的礼物, 暗示两条, 纪念品[图标,中,英], 一句话[中,英], 出处, 满足时的一句[中,英]) */
  const P = (id, name, era, region, age, pron, lk, stay, wants, hints, sou, q, src, okLine, review) => {
    const n = name;
    V.add({
      id, official: true, region, age, pronoun: pron, stay, wants, src, review: review || OK,
      look: { skin: SK[lk[0]], hairColor: lk[1], hairStyle: lk[2], glasses: lk[3], clothes: lk[4] }, souvenir: { id: id + '_keepsake', icon: sou[0] },
      t: {
        name, era, souvenir: [sou[1], sou[2]], hint: hints,
        arrive_note: [`${n[0]}推开时空门走了进来，说想在这里住几天。`, `${n[1]} stepped through the time door and asked to stay a few days.`],
        ok_line: okLine,
        leave_ok: [`${n[0]}临走前留下${sou[1]}，说：${q[0]}`, `Before leaving, ${n[1]} left ${sou[2].replace(/^An? /, 'a ')} and said: ${q[1]}`],
        leave_miss: [`${n[0]}道了谢，推开门回去了。`, `${n[1]} said thanks and went back through the door.`],
        wrong_late: ['', ''],
      },
    });
  };

  P('galois', ['埃瓦里斯特·伽罗瓦', 'Évariste Galois'], ['十九世纪，法国', '19th century, France'], 'France', 20, '他', ['c', 'black', 'curly', 'none', '#7d8fa8'], [1, 2], ['notebook', 'pen'],
    [['他一直在纸上写着，边角上有一行小字：“我没有时间了。”', 'He kept writing, and in the margin was a line: "I have no time."'], ['他说今晚要把想到的东西全写完，怕明天来不及。', 'He said he had to write down everything tonight in case tomorrow was too late.']],
    ['📝', '一张写满公式的纸', 'A sheet full of formulas'], ['有人替我留意到了时间，谢谢。', 'Thank you for noticing that I was short of time.'], 'Encyclopaedia Britannica, Évariste Galois; his last-night manuscripts with the marginal note "Je n\'ai pas le temps".',
    ['他接过东西，立刻伏案写了起来。', 'He took it and bent over the desk writing at once.']);
  P('mozart', ['沃尔夫冈·莫扎特', 'Wolfgang Amadeus Mozart'], ['十八世纪，奥地利', '18th century, Austria'], 'Austria', 30, '他', ['b', 'brown', 'ponytail', 'none', '#c07a6b'], [1, 2], ['flute', 'tea'],
    [['他随口哼着一段旋律，说要写进新的歌剧里。', 'He hummed a tune and said it would go into a new opera.'], ['他问你家里有没有会吹响的东西，哪怕只有一支。', 'He asked whether there was anything in the house that could be blown into, even just one.']],
    ['🎼', '一页乐谱的复印件', 'A copy of a page of music'], ['音乐是送给听的人的，谢谢你听。', 'Music is for those who listen. Thank you for listening.'], 'Encyclopaedia Britannica, Wolfgang Amadeus Mozart; The Magic Flute (1791).',
    ['他试了两个音，眼睛亮了起来。', 'He tried two notes and his eyes lit up.']);
  P('beethoven', ['路德维希·范·贝多芬', 'Ludwig van Beethoven'], ['十八至十九世纪，德国', '18th-19th century, Germany'], 'Germany', 45, '他', ['b', 'gray', 'curly', 'none', '#4f6d8f'], [2, 3], ['notebook', 'pen'],
    [['他指了指耳朵，摆摆手，示意你把想说的写下来。', 'He pointed to his ears, waved a hand, and gestured for you to write down what you wanted to say.'], ['他随身带着一本小册子，翻得很旧。', 'He carried a small, well-worn booklet everywhere.']],
    ['🎼', '一页谈话本的复印件', 'A copy of a page from a conversation book'], ['有人肯把话写给我，就不孤单。', 'When someone takes the trouble to write to me, I am not alone.'], 'Encyclopaedia Britannica, Ludwig van Beethoven; his "conversation books" used from about 1818.',
    ['他翻开新本子，点了点头。', 'He opened the new notebook and nodded.']);
  P('da_vinci', ['列奥纳多·达·芬奇', 'Leonardo da Vinci'], ['十五至十六世纪，意大利', '15th-16th century, Italy'], 'Italy', 50, '他', ['c', 'gray', 'long', 'none', '#9a8fc0'], [2, 3], ['paints', 'kite'],
    [['他从右往左写字，字是反过来的，要对着镜子才读得懂。', 'He wrote from right to left, mirrored, so you needed a mirror to read it.'], ['他盯着天上的鸟看了很久，说想知道它们怎么停在风里。', 'He watched the birds for a long time, wondering how they rest on the wind.']],
    ['📜', '一页手稿的复印件', 'A copy of a manuscript page'], ['好奇心就是最好的礼物，谢谢你陪我看鸟。', 'Curiosity is the best gift. Thank you for watching the birds with me.'], 'Encyclopaedia Britannica, Leonardo da Vinci; notebooks in mirror script, studies of bird flight.',
    ['他拿起东西，立刻画了起来。', 'He picked it up and started drawing at once.']);
  P('li_bai', ['李白', 'Li Bai'], ['唐代，中国', 'Tang dynasty, China'], 'China', 40, '他', ['c', 'black', 'bun', 'none', '#5f8a7a'], [1, 2], ['brush', 'map'],
    [['他望着窗外的月亮发呆，嘴里念念有词。', 'He stared at the moon outside the window, murmuring to himself.'], ['他问你有没有纸笔，诗要趁新鲜写下来，还问你远处是什么地方。', 'He asked for paper and a brush, since a poem has to be written while fresh, and wondered what lay far away.']],
    ['📜', '一页诗稿的复印件', 'A copy of a page of poems'], ['明月在，就还有人陪着。', 'As long as the moon is there, someone keeps you company.'], '《全唐诗》，《静夜思》；Encyclopaedia Britannica, Li Bai.',
    ['他提笔就写，墨迹还没干，月亮已经上来了。', 'He took the brush and wrote, and the moon was up before the ink dried.']);
  P('du_fu', ['杜甫', 'Du Fu'], ['唐代，中国', 'Tang dynasty, China'], 'China', 50, '他', ['c', 'gray', 'bun', 'none', '#7f9580'], [2, 3], ['coat', 'soup'],
    [['他裹紧了身上的单衣，说今年的冬天特别冷。', 'He pulled his thin robe tighter and said this winter was especially cold.'], ['他看着你家的灯火说，要是天下人都能有一间暖和的屋子就好了。', 'Looking at your lamplight, he said it would be wonderful if everyone had a warm place to live.']],
    ['📜', '一页诗稿的复印件', 'A copy of a page of poems'], ['暖和了，诗里才有力气。', 'It is the warmth that gives a poem its strength.'], '《茅屋为秋风所破歌》；Encyclopaedia Britannica, Du Fu.',
    ['他捧着暖和的东西，长长地舒了口气。', 'Holding something warm, he let out a long breath.']);
  P('su_shi', ['苏轼', 'Su Shi'], ['宋代，中国', 'Song dynasty, China'], 'China', 45, '他', ['c', 'black', 'bun', 'none', '#c28a6e'], [1, 2], ['soup', 'tea'],
    [['他吸了吸鼻子，问厨房里炖的是什么，说自己也琢磨过一道炖肉。', 'He sniffed the air and asked what was simmering in the kitchen, saying he had once worked out a braise himself.'], ['他说诗可以晚点写，先吃饭。', 'He said poems could wait, but dinner could not.']],
    ['📜', '一页菜谱和诗稿', 'A page of recipe and verse'], ['日子好不好，先看这一顿。', 'How the day went depends on this one meal.'], '《猪肉颂》；Encyclopaedia Britannica, Su Shi.',
    ['他喝了一口，满意地眯起了眼睛。', 'He took a sip and narrowed his eyes in contentment.']);
  P('zhang_heng', ['张衡', 'Zhang Heng'], ['东汉，中国', 'Eastern Han dynasty, China'], 'China', 45, '他', ['c', 'black', 'bun', 'none', '#6f86a0'], [2, 3], ['telescope', 'clock'],
    [['他仰头看着夜空，说想把星星的位置一颗颗记下来。', 'He tilted his head back to the night sky, saying he wanted to record the stars one by one.'], ['他盯着你的钟看了很久，问它是怎么走得这么准的。', 'He studied your clock for a long time and asked how it kept such good time.']],
    ['🌌', '一幅星图的复印件', 'A copy of a star chart'], ['天上的事，要一点一点量。', 'The heavens have to be measured bit by bit.'], '《后汉书·张衡传》；Encyclopaedia Britannica, Zhang Heng.',
    ['他对着东西调了又调，嘴角带着笑。', 'He adjusted it again and again, smiling.']);
  P('li_shizhen', ['李时珍', 'Li Shizhen'], ['明代，中国', 'Ming dynasty, China'], 'China', 55, '他', ['d', 'gray', 'bun', 'none', '#8fbf9f'], [2, 3], ['seeds', 'medkit'],
    [['他蹲在花盆前，认真研究叶子的纹路。', 'He crouched by a flowerpot, closely studying the veins of a leaf.'], ['他说想认全天下的药草，一样一样记下来。', 'He said he wanted to know every medicinal herb under the sun and record them one by one.']],
    ['🌿', '一株药草的标本', 'A pressed herb specimen'], ['草木各有各的用处，别小看它们。', 'Every plant has its use. Never look down on them.'], '《明史·李时珍传》；《本草纲目》；Encyclopaedia Britannica, Li Shizhen.',
    ['他把东西收好，又蹲回花盆前继续看。', 'He put it away and crouched back by the flowerpot.']);
  P('lin_daiyu', ['林黛玉', 'Lin Daiyu'], ['《红楼梦》中的人物', 'A character from Dream of the Red Chamber'], 'China (fiction)', 17, '她', ['a', 'black', 'long', 'none', '#e7a6a1'], [1, 2], ['aspirin', 'soup'],
    [['她轻轻咳了两声，说夜里风有些凉。', 'She coughed softly and said the night wind was a little cold.'], ['她捧着一本书，问你有没有能让人好受一点的东西。', 'Holding a book, she asked whether you had anything that might make a person feel a little better.']],
    ['🌸', '一朵绢花', 'A silk flower'], ['能被人记挂着，就是福气。', 'It is a blessing to be remembered.'], '曹雪芹《红楼梦》；虚构人物，不涉及真实人物的健康。',
    ['她接过东西，轻轻说了声谢谢。', 'She took it and said a soft thank you.'], '2026-11-02 通过：虚构人物，纪念品为绢花');
  P('archimedes', ['阿基米德', 'Archimedes'], ['古希腊', 'Ancient Greece'], 'Greece', 50, '他', ['d', 'white', 'bald', 'none', '#7d8fa8'], [1, 2], ['book', 'lamp'],
    [['他盯着你的浴缸看了很久，若有所思。', 'He stared at your bathtub for a long while, lost in thought.'], ['他说只要有一个够稳的支点，他能把整个世界撬起来。', 'He said that with a firm enough place to stand he could move the whole world.']],
    ['⚖️', '一根小杠杆', 'A small lever'], ['找到那个支点，剩下的只是时间。', 'Find the fulcrum and the rest is only time.'], 'Plutarch, Life of Marcellus; Encyclopaedia Britannica, Archimedes.',
    ['他转着东西，露出了孩子般的笑容。', 'He turned it over, grinning like a child.']);
  P('ibn_sina', ['伊本·西纳', 'Ibn Sina'], ['十一世纪，波斯', '11th century, Persia'], 'Persia', 45, '他', ['d', 'black', 'bun', 'none', '#4f6d8f'], [2, 3], ['book', 'medkit'],
    [['他在翻你的书架，说好书比什么药都让人安心。', 'He was leafing through your shelves, saying a good book can reassure a person more than any medicine.'], ['他说想把见过的病症都记下来，留给后来的人。', 'He said he wanted to write down every illness he had seen for those who come after.']],
    ['📜', '一页手稿的复印件', 'A copy of a manuscript page'], ['医生的本分，是把知道的告诉后来人。', 'A physician\'s duty is to pass on what he knows.'], 'Encyclopaedia Britannica, Avicenna; The Canon of Medicine.',
    ['他认真地检查了东西，点点头。', 'He examined it carefully and nodded.']);
  P('al_khwarizmi', ['花拉子米', 'Al-Khwarizmi'], ['九世纪，中亚', '9th century, Central Asia'], 'Central Asia', 40, '他', ['d', 'black', 'short', 'none', '#d4a24c'], [1, 2], ['map', 'notebook'],
    [['他在地上画着方程，一步一步地解给你看。', 'He drew an equation on the ground and solved it step by step for you.'], ['他问你的地图画得准不准，说他也画过一幅。', 'He asked whether your map was accurate, saying he had drawn one himself.']],
    ['📐', '一页演算的复印件', 'A copy of a page of workings'], ['把难题拆开，一步一步，总能走完。', 'Break a hard problem apart and take it step by step.'], 'Encyclopaedia Britannica, al-Khwarizmi; Kitab al-jabr; Surat al-ard.',
    ['他把东西摊开，立刻算了起来。', 'He spread it out and began calculating.']);
  P('ada', ['阿达·洛芙莱斯', 'Ada Lovelace'], ['十九世纪，英国', '19th century, Britain'], 'Britain', 30, '她', ['a', 'brown', 'bun', 'none', '#9a8fc0'], [2, 3], ['book', 'pen'],
    [['她说机器也许有一天能谱写音乐。', 'She said that perhaps one day machines could compose music.'], ['她问你有没有一支好用的笔，笔记还没整理完。', 'She asked for a good pen, since her notes were not yet finished.']],
    ['📓', '一页笔记的复印件', 'A copy of a page of notes'], ['想象力和算术，其实是一回事。', 'Imagination and arithmetic are really the same thing.'], 'Encyclopaedia Britannica, Ada Lovelace; Notes on the Analytical Engine (1843).',
    ['她拿起笔，立刻在笔记上添了一行。', 'She picked up the pen and added a line to her notes at once.']);
  P('ramanujan', ['斯里尼瓦瑟·拉马努金', 'Srinivasa Ramanujan'], ['二十世纪初，印度', 'early 20th century, India'], 'India', 30, '他', ['f', 'black', 'short', 'none', '#f0f0f0'], [2, 3], ['notebook', 'soup'],
    [['他翻着一本旧笔记本，说有些公式是睡梦里想到的。', 'He leafed through an old notebook, saying some of the formulas came to him in sleep.'], ['他说起家乡的饭菜，眼睛里有一点光。', 'He talked about the food of home, with a gleam in his eyes.']],
    ['📓', '一页笔记的复印件', 'A copy of a page of notes'], ['数字是有感情的，你只要肯陪它们。', 'Numbers have feelings, if only you keep them company.'], 'Encyclopaedia Britannica, Srinivasa Ramanujan; his notebooks.',
    ['他吃得很慢，吃完又翻开了笔记本。', 'He ate slowly, and afterwards opened his notebook again.'], '2026-11-02 通过：不涉及宗教说法，只写笔记与饭菜');
  P('tagore', ['拉宾德拉纳特·泰戈尔', 'Rabindranath Tagore'], ['十九至二十世纪，印度', '19th-20th century, India'], 'India', 60, '他', ['e', 'white', 'long', 'round', '#f0f0f0'], [1, 2], ['pen', 'paints'],
    [['他望着窗外的雨，说想写一首短诗。', 'He watched the rain at the window and said he wanted to write a short poem.'], ['他说自己到了晚年才开始画画，觉得很快乐。', 'He said he only took up painting late in life, and loved it.']],
    ['📜', '一页诗稿的复印件', 'A copy of a page of poems'], ['别急着长大，也别急着变老。', 'Do not be in a hurry to grow up, nor to grow old.'], 'Encyclopaedia Britannica, Rabindranath Tagore.',
    ['他接过东西，眼睛望向了雨里。', 'He took it, gazing out into the rain.']);
  P('hokusai', ['葛饰北斋', 'Katsushika Hokusai'], ['江户时代，日本', 'Edo period, Japan'], 'Japan', 75, '他', ['c', 'white', 'bald', 'none', '#4f6d8f'], [2, 3], ['paints', 'brush'],
    [['他说自己画了一辈子，还想再多活几年，把画学得更好。', 'He said he had painted all his life and wanted a few more years to get better at it.'], ['他盯着你的窗外看，说想画一朵浪。', 'He looked out your window and said he wanted to paint a wave.']],
    ['🌊', '一幅浪的小画', 'A small painting of a wave'], ['画到老，也还是个学生。', 'Painting to the end, you are still a student.'], 'Encyclopaedia Britannica, Hokusai; The Great Wave off Kanagawa.',
    ['他铺开纸，笑着画了第一笔。', 'He spread the paper and laughed as he made the first stroke.']);
  P('murasaki', ['紫式部', 'Murasaki Shikibu'], ['平安时代，日本', 'Heian period, Japan'], 'Japan', 35, '她', ['a', 'black', 'long', 'none', '#9a8fc0'], [1, 2], ['brush', 'lamp'],
    [['她安静地坐在窗边，说夜里想写点东西。', 'She sat quietly by the window and said she wanted to write something tonight.'], ['她看了看天色，问能不能再亮一点。', 'She looked at the sky and asked whether it could be a little brighter.']],
    ['📜', '一页物语的复印件', 'A copy of a page of the tale'], ['故事是写给还没出生的人的。', 'Stories are written for people who are not yet born.'], 'Encyclopaedia Britannica, Murasaki Shikibu; The Tale of Genji.',
    ['灯亮了，她提起笔，轻轻点了点头。', 'The lamp lit, she took up the brush and nodded softly.']);
  P('basho', ['松尾芭蕉', 'Matsuo Basho'], ['江户时代，日本', 'Edo period, Japan'], 'Japan', 45, '他', ['c', 'gray', 'bald', 'none', '#8a7f6a'], [1, 2], ['shoes', 'tea'],
    [['他低头看了看自己的草鞋，说路还长着呢。', 'He looked down at his straw sandals and said the road was still long.'], ['他说旅途中最好的是一杯热茶。', 'He said the best part of a journey is a hot cup of tea.']],
    ['🍵', '一页俳句的复印件', 'A copy of a page of haiku'], ['路上遇见的，都是诗。', 'Everything you meet on the road is a poem.'], 'Encyclopaedia Britannica, Matsuo Basho; Oku no hosomichi.',
    ['他穿上东西走了两步，笑着点头。', 'He tried it on, took two steps, and nodded with a smile.']);
  P('ibn_battuta', ['伊本·白图泰', 'Ibn Battuta'], ['十四世纪，摩洛哥', '14th century, Morocco'], 'Morocco', 40, '他', ['e', 'black', 'short', 'none', '#d4a24c'], [1, 2], ['map', 'shoes'],
    [['他讲起一路上见过的城市，说得没完没了。', 'He talked endlessly about the cities he had seen along the way.'], ['他想知道你这里到底在哪，问了好几遍。', 'He asked several times where exactly your place was.']],
    ['🗺️', '一页游记的复印件', 'A copy of a page from the travel book'], ['走得越远，越明白家在哪里。', 'The farther you go, the better you know where home is.'], 'Encyclopaedia Britannica, Ibn Battuta; the Rihla.',
    ['他摊开东西，指着上面某个地方笑了。', 'He spread it out and laughed, pointing at a place on it.']);
  P('austen', ['简·奥斯汀', 'Jane Austen'], ['十八至十九世纪，英国', '18th-19th century, Britain'], 'Britain', 35, '她', ['a', 'brown', 'bun', 'none', '#b58aa5'], [1, 2], ['pen', 'tea'],
    [['她把稿纸悄悄盖在吸墨纸下面，听见人来就藏起来。', 'She tucked her manuscript under a blotter whenever someone came near.'], ['她说一杯热茶和一小张桌子就够写出一章。', 'She said a hot cup of tea and a small table were enough for a chapter.']],
    ['📜', '一页手稿的复印件', 'A copy of a manuscript page'], ['小小的桌子，也能装下整个世界。', 'Even a small table can hold the whole world.'], 'Encyclopaedia Britannica, Jane Austen; the account of her hiding manuscripts from visitors.',
    ['她眉眼弯弯，把东西放在了小桌上。', 'She smiled and set it on her little table.']);
  P('pasteur', ['路易·巴斯德', 'Louis Pasteur'], ['十九世纪，法国', '19th century, France'], 'France', 55, '他', ['b', 'gray', 'short', 'none', '#6f86a0'], [2, 3], ['microscope', 'medkit'],
    [['他对着一滴水看了很久，说里面有看不见的世界。', 'He looked at a single drop of water for a long time, saying there was an unseen world inside.'], ['他说想让大家吃的、喝的都更干净一点。', 'He said he wanted everything people eat and drink to be a little cleaner.']],
    ['🔬', '一页实验记录的复印件', 'A copy of a page of lab records'], ['看得见的是结果，看不见的是原因。', 'What you see is the result, what you cannot see is the cause.'], 'Encyclopaedia Britannica, Louis Pasteur.',
    ['他凑近东西，屏住呼吸看了起来。', 'He leaned close and watched, holding his breath.']);
  P('seacole', ['玛丽·西科尔', 'Mary Seacole'], ['十九世纪，牙买加与英国', '19th century, Jamaica and Britain'], 'Jamaica / Britain', 50, '她', ['f', 'black', 'bun', 'none', '#e7a6a1'], [2, 3], ['medkit', 'soup'],
    [['她提着一个自己配的草药包，说走到哪里都带着。', 'She carried a bag of herbs she had mixed herself, saying she took it everywhere.'], ['她说一碗热汤有时比药更管用。', 'She said a bowl of hot soup sometimes works better than medicine.']],
    ['🌿', '一小包草药', 'A small pouch of herbs'], ['哪里有人需要，哪里就是我的地方。', 'Wherever someone needs me, that is my place.'], 'Encyclopaedia Britannica, Mary Seacole; Wonderful Adventures of Mrs. Seacole in Many Lands (1857).',
    ['她点点头，把东西收进了自己的包里。', 'She nodded and put it into her own bag.']);
  P('dickinson', ['艾米莉·狄金森', 'Emily Dickinson'], ['十九世纪，美国', '19th century, United States'], 'United States', 40, '她', ['a', 'brown', 'bun', 'none', '#f0f0f0'], [1, 2], ['lamp', 'notebook'],
    [['她安静地说，夜里写些短短的句子最合适。', 'She said quietly that short lines at night suited her best.'], ['她问你有没有小本子，装得下一首诗就行。', 'She asked for a little notebook, just big enough for a poem.']],
    ['📓', '一页短诗的复印件', 'A copy of a page of short poems'], ['希望是长着羽毛的东西。', 'Hope is the thing with feathers.'], 'Encyclopaedia Britannica, Emily Dickinson.',
    ['她轻轻翻开本子，没说话，笑了。', 'She opened the notebook gently and smiled without a word.']);
  P('wang_xizhi', ['王羲之', 'Wang Xizhi'], ['东晋，中国', 'Eastern Jin dynasty, China'], 'China', 45, '他', ['c', 'black', 'bun', 'none', '#5f8a7a'], [1, 2], ['brush', 'tea'],
    [['他说起一次春天的聚会，大家在溪边写诗。', 'He recalled a spring gathering where everyone wrote poems by the stream.'], ['他问你的桌子够不够大，铺得下一张纸。', 'He asked whether your table was big enough for a sheet of paper.']],
    ['📜', '一页字帖的复印件', 'A copy of a calligraphy page'], ['字写得好不好，看的是心静不静。', 'Whether the writing is good depends on how calm the mind is.'], '《晋书·王羲之传》；《兰亭集序》；Encyclopaedia Britannica, Wang Xizhi.',
    ['他铺开纸，深吸一口气，落了第一笔。', 'He spread the paper, drew a deep breath, and set down the first stroke.']);
  P('zhang_zhongjing', ['张仲景', 'Zhang Zhongjing'], ['东汉，中国', 'Eastern Han dynasty, China'], 'China', 50, '他', ['d', 'gray', 'bun', 'none', '#7f9580'], [2, 3], ['medkit', 'tea'],
    [['他说想把见过的病症整理成书，让后来人少走些弯路。', 'He said he wanted to compile the illnesses he had seen into a book to spare those who come after.'], ['他闻了闻你的茶，说得看看是什么茶。', 'He sniffed your tea and said he would need to know what kind it was.']],
    ['📜', '一页医书的复印件', 'A copy of a page from the medical book'], ['把见过的写下来，就是留给后人的药。', 'What you have seen, written down, is medicine for those who follow.'], '《后汉书》；《伤寒杂病论》；Encyclopaedia Britannica, Zhang Zhongjing.',
    ['他认真地看了看东西，点了点头。', 'He looked at it carefully and nodded.']);
  P('euler', ['莱昂哈德·欧拉', 'Leonhard Euler'], ['十八世纪，瑞士', '18th century, Switzerland'], 'Switzerland', 60, '他', ['b', 'gray', 'short', 'round', '#7d8fa8'], [2, 3], ['spectacles', 'pen'],
    [['他眯着眼睛看你写的字，说眼睛越来越花了。', 'He squinted at your handwriting and said his eyes were getting worse.'], ['他说算着算着，旁边孩子爬到膝盖上也不影响。', 'He said he could keep calculating even with a child climbing on his knee.']],
    ['📐', '一页演算的复印件', 'A copy of a page of workings'], ['光线暗下来，也还能算下去。', 'Even when the light dims, you can keep calculating.'], 'Encyclopaedia Britannica, Leonhard Euler.',
    ['他戴上东西，把纸凑得近了一些。', 'He put it on and held the paper closer.']);

  /* ---------- 第三批：补足地区和行业，共五十张 ----------
     这一批由 AI 起草并做初核，review 里写明待用户终审。传说性质或来源有争议的人物，文字只写传统上广为人知的部分。 */
  const OK3 = "2026-11-02 AI初核通过，待用户终审：无政治与宗教争议，只写习惯与爱好";

  P("hippocrates", ["希波克拉底", "Hippocrates"], ["古希腊", "Ancient Greece"], "Greece", 55, "他", ["c", "gray", "short", "none", "#a7b5a0"], [2, 3], ["aspirin", "soup"],
    [["他在床边坐了很久，一句话不说，先把人看明白，才开口问昨晚睡得怎么样。", "He sat by the bed for a long while without a word, looking carefully before asking how the night had been."], ["他说传说里自己让人嚼过柳树皮，又说清淡的饮食和休息比什么都要紧。", "He said that, as the story goes, he once had people chew willow bark, and that plain food and rest matter most."]],
    ["🌿", "一片柳叶", "A willow leaf"], ["多看一看，多等一等，身体自己会帮忙。", "Look a little longer, wait a little longer, and the body will help."], "Encyclopaedia Britannica, Hippocrates; the Hippocratic Corpus on observation, diet and rest. The willow bark remedy is a traditional attribution.",
    ["他嚼了嚼，点点头，说味道和故乡的一样。", "He chewed it, nodded, and said it tasted like home."], "2026-11-02 AI初核通过，待用户终审：柳树皮疗法是传统说法，文字已标明");
  P("ibn_al_nafis", ["伊本·纳菲斯", "Ibn al-Nafis"], ["十三世纪，叙利亚与埃及", "13th century, Syria and Egypt"], "Syria / Egypt", 50, "他", ["d", "black", "short", "none", "#7c8fb0"], [2, 3], ["medkit", "notebook"],
    [["他在纸上画了一个心脏，说血不是直接穿过中间的隔，而是要绕到肺里走一圈。", "He drew a heart on paper and said the blood does not pass straight through the middle wall but goes around through the lungs."], ["他说他大半辈子都在医院里，最爱看的是病人慢慢好起来。", "He said he had spent most of his life in hospitals and loved most to watch patients slowly recover."]],
    ["🫀", "一页肺循环的手稿抄本", "A copy of a manuscript page on the lungs and blood"], ["看得仔细，才写得对。", "Only careful looking leads to careful writing."], "Encyclopaedia Britannica, Ibn al-Nafis; description of the pulmonary transit of blood, commentary on Avicenna's Canon.",
    ["他接过东西，立刻翻开写了起来。", "He took it and opened it to write at once."], OK3);
  P("omar_khayyam", ["奥马尔·海亚姆", "Omar Khayyam"], ["十一至十二世纪，波斯", "11th-12th century, Persia"], "Persia", 50, "他", ["d", "black", "short", "none", "#8a6f9a"], [1, 2], ["telescope", "chess"],
    [["他在纸上画了几段圆锥曲线，说三次方程也能用几何的办法解出来。", "He drew a few conic sections and said even cubic equations can be solved with geometry."], ["他说算了一晚上的历，想找个人下盘棋歇一歇。", "He said he had spent the whole evening on calendar sums and wanted someone to play a game of chess with."]],
    ["📅", "一页历法算稿", "A page of calendar calculations"], ["日子数得清，才好好过。", "Count the days well and you can live them well."], "Encyclopaedia Britannica, Omar Khayyam; algebra treatise on cubic equations, the Jalali calendar reform. Attribution of the quatrains is debated and not used here.",
    ["他把棋子一枚枚摆好，说今晚的星星一定很好。", "He set out the pieces one by one and said tonight's stars would be good."], OK3);
  P("scheherazade", ["山鲁佐德", "Scheherazade"], ["《一千零一夜》中的人物", "A character from One Thousand and One Nights"], "Arabian Nights (fiction)", 28, "她", ["d", "black", "long", "none", "#b0707a"], [1, 2], ["lamp", "blanket"],
    [["她说她肚子里有很多很多故事，一个晚上讲不完。", "She said she held so many stories that one night would never be enough."], ["她问你家里有没有人想听故事，最好是睡觉之前。", "She asked whether anyone in the house wanted a story, preferably before bed."]],
    ["🕯️", "一支故事蜡烛", "A story candle"], ["故事讲给愿意听的人，就不会断。", "Tell a story to someone who wants to listen and it never ends."], "One Thousand and One Nights, the frame story; Encyclopaedia Britannica, Arabian Nights.",
    ["她把灯放在床边，轻声讲起了第一个故事。", "She set it by the bed and softly began the first story."], "2026-11-02 AI初核通过，待用户终审：只用说书人形象，不涉及框架故事里的情节");
  P("sushruta", ["妙闻", "Sushruta"], ["古印度，传说中的外科医生", "Ancient India, traditionally the author of a surgical text"], "India", 50, "他", ["e", "black", "short", "none", "#c49a5b"], [2, 3], ["medkit", "gloves"],
    [["他说学外科要先在瓜果和皮囊上练手，不能一上来就在人身上试。", "He said surgery must be practised first on gourds and leather bags, never straight on a person."], ["他把器具一件件擦干净摆好，说每一步都要先想清楚再动手。", "He wiped each instrument clean and laid them out, saying every step must be thought through before the hand moves."]],
    ["📜", "一页器械图谱的复印件", "A copy of a page of instrument drawings"], ["手要稳，心要静，用之前先想一遍。", "Steady hands, a quiet mind, and think it through once before you begin."], "Encyclopaedia Britannica, Sushruta; the Sushruta Samhita. Dates and authorship are debated, so the card only states what the text is traditionally known for.",
    ["他戴上看了看，满意地点点头。", "He tried them on and nodded with satisfaction."], "2026-11-02 AI初核通过，待用户终审：年代与作者有争议，卡片只写传统说法");
  P("aryabhata", ["阿耶波多", "Aryabhata"], ["五至六世纪，印度", "5th-6th century, India"], "India", 40, "他", ["e", "black", "short", "none", "#d1b25a"], [1, 2], ["telescope", "notebook"],
    [["他指着天说，星星看上去在转，也可能是我们脚下的地在转。", "He pointed at the sky and said the stars seem to turn, but perhaps it is the ground under our feet that turns."], ["他算出圆周和直径的比大约是三点一四一六，一遍又一遍地核对。", "He worked out that the circle to its diameter is about 3.1416, and checked it again and again."]],
    ["🔢", "一页圆周率的算稿", "A page of calculations of pi"], ["数字不会骗人，只要你肯再算一遍。", "Numbers do not lie, as long as you are willing to count once more."], "Encyclopaedia Britannica, Aryabhata; the Aryabhatiya, an approximation of pi and the explanation of the apparent motion of the stars by the rotation of the Earth.",
    ["他架好看了看，认真记下了几个数字。", "He set it up, looked through it, and carefully noted a few numbers."], OK3);
  P("le_huu_trac", ["黎有晫（海上懒翁）", "Le Huu Trac (Hai Thuong Lan Ong)"], ["十八世纪，越南", "18th century, Vietnam"], "Vietnam", 55, "他", ["d", "gray", "short", "none", "#7a9a6a"], [2, 3], ["seeds", "medkit"],
    [["他说药不一定贵，田埂边的草，用对了也是药。", "He said medicine need not be costly: a plant at the edge of a field is medicine too, if used well."], ["他说给穷人看病不必收钱，药材可以自己种。", "He said there is no need to charge the poor, and you can grow the herbs yourself."]],
    ["🌿", "一包晒干的草药", "A bundle of dried herbs"], ["医者的心，比药更要紧。", "A healer's heart matters more than the medicine."], "Encyclopaedia Britannica and Vietnamese historical sources on Le Huu Trac (Hai Thuong Lan Ong), physician and author of Hai Thuong y tong tam linh.",
    ["他捻了捻种子，说这一把种下去，来年就够用了。", "He rolled the seeds between his fingers and said a handful planted now would be enough next year."], OK3);
  P("raden_saleh", ["拉登·萨利赫", "Raden Saleh"], ["十九世纪，爪哇", "19th century, Java"], "Indonesia", 40, "他", ["e", "black", "short", "none", "#9a6a4b"], [1, 2], ["paints", "notebook"],
    [["他随身带着速写本，在院子里一坐就是一下午。", "He carried a sketchbook and could sit in the yard the whole afternoon."], ["他喜欢画动物和天气的变化，问你家的猫愿不愿意坐着不动。", "He liked to paint animals and changes in the weather, and asked whether your cat would sit still."]],
    ["🖼️", "一幅小画的复印件", "A copy of a small painting"], ["光是怎么落下来的，要一直看着才画得对。", "To paint the way light falls, you have to keep watching it."], "Encyclopaedia Britannica, Raden Saleh; regarded as the first modern Indonesian painter, trained in Europe.",
    ["他打开颜料，对着窗口调起了颜色。", "He opened the paints and began mixing colours facing the window."], OK3);
  P("sunthorn_phu", ["顺吞蒲", "Sunthorn Phu"], ["十八至十九世纪，泰国", "18th-19th century, Thailand"], "Thailand", 50, "他", ["e", "black", "short", "none", "#c9a05a"], [1, 2], ["pen", "shoes"],
    [["他说走到哪里就写到哪里，沿路的风景都能写成诗。", "He said he wrote wherever he walked, and any scenery along the way could become a poem."], ["他说话爱押韵，一句话说到一半就变成了诗。", "He liked to rhyme, and half a sentence would turn into verse."]],
    ["📜", "一页诗稿的抄本", "A copy of a page of verse"], ["路是读不完的书，写下来才算走过。", "The road is a book you never finish; you have walked it only once you write it down."], "Encyclopaedia Britannica and UNESCO, Sunthorn Phu, Thai poet, author of Phra Aphai Mani; honoured by UNESCO in 1986.",
    ["他换上鞋，在屋里走了一圈，嘴里念出了一句新的。", "He put on the shoes, took a turn around the room, and murmured a new line."], OK3);
  P("al_fihri", ["法蒂玛·菲赫里", "Fatima al-Fihri"], ["九世纪，摩洛哥", "9th century, Morocco"], "Morocco", 45, "她", ["d", "black", "bun", "none", "#6f9a8a"], [1, 2], ["book", "lamp"],
    [["她问你家孩子在读什么书，说有个地方能读书，比什么都重要。", "She asked what the children were reading and said a place to study matters more than almost anything."], ["她说，她把家里留下的钱，都用来盖一座能读书的地方。", "She said she spent what her family left her on building a place where people could study."]],
    ["📚", "一页学堂的图样", "A sketch of a school"], ["能让人读书的地方，就是最好的家产。", "A place where people can study is the best inheritance."], "Encyclopaedia Britannica, University of al-Qarawiyyin; traditional accounts credit Fatima al-Fihri with founding it in 859. Some details are traditional.",
    ["她把灯放在桌上，翻开了一本书。", "She put the lamp on the table and opened a book."], "2026-11-02 AI初核通过，待用户终审：只写办学，不涉及宗教内容");
  P("ibn_khaldun", ["伊本·赫勒敦", "Ibn Khaldun"], ["十四世纪，突尼斯与埃及", "14th century, Tunisia and Egypt"], "Tunisia", 50, "他", ["d", "gray", "short", "none", "#7a7a9a"], [2, 3], ["book", "lamp"],
    [["他说弄懂一件事，不能只听传说，要看前前后后的缘由。", "He said to understand a thing you cannot rely on legend alone; look at the causes before and after."], ["他随身带着一摞厚厚的书稿，说还要再改。", "He carried a thick stack of manuscript and said it still needed revising."]],
    ["📘", "一页导言的复印件", "A copy of a page of the Introduction"], ["看得远，是因为把前面的事看清了。", "You see far because you have seen clearly what came before."], "Encyclopaedia Britannica, Ibn Khaldun; the Muqaddimah (1377).",
    ["他把灯拨亮，又翻开稿子写了起来。", "He turned the lamp up and went back to his manuscript."], OK3);
  P("horton", ["詹姆斯·阿非利加努斯·霍顿", "James Africanus Horton"], ["十九世纪，塞拉利昂", "19th century, Sierra Leone"], "Sierra Leone", 40, "他", ["f", "black", "short", "round", "#5f7f9a"], [2, 3], ["umbrella", "coat"],
    [["他说一个地方的病，要用那个地方的天气、水和饮食来看，每一样都要记。", "He said the illnesses of a place must be read against its weather, water and food, and each must be recorded."], ["他在英国学了医，回来后一直在记家乡的病例。", "He trained in medicine in Britain and, back home, kept recording the cases of his homeland."]],
    ["🌦️", "一页天气和病例的记录", "A page of weather and case records"], ["数据是诚实的，你只要肯记。", "Records are honest, as long as you keep them."], "Encyclopaedia Britannica and Dictionary of African Biography, James Africanus Horton; Physical and Medical Climate and Meteorology of the West Coast of Africa (1867).",
    ["他撑开看了看，说雨季的数字又要多记一栏。", "He opened it, looked at the sky, and said the rainy season needed another column."], OK3);
  P("anansi", ["阿南西", "Anansi"], ["西非阿肯人的民间故事", "West African Akan folktales"], "Ghana (folklore)", 40, "他", ["f", "black", "short", "none", "#c08a3a"], [1, 2], ["gloves", "scarf"],
    [["他说所有的故事原来都是他的，后来才被带到了世上。", "He said all the stories were once his, and only later were they carried out into the world."], ["他八只手一起忙，还嫌不够用，问你有没有多的手套。", "He kept eight hands busy and still found them too few, and asked if you had spare gloves."]],
    ["🕸️", "一小段银丝", "A short strand of silver thread"], ["故事是织出来的，一针一线，慢慢来。", "Stories are woven, thread by thread, so take your time."], "Akan folktales of Anansi, Encyclopaedia Britannica, Anansi.",
    ["他把东西往手上一套，高兴地摆弄起来。", "He pulled them on and happily flexed his fingers."], "2026-11-02 AI初核通过，待用户终审：民间故事形象，不涉及宗教");
  P("imhotep", ["伊姆霍特普", "Imhotep"], ["古埃及，传说他也是医者", "Ancient Egypt, later remembered as a healer"], "Egypt", 45, "他", ["f", "black", "short", "none", "#c9b27a"], [1, 2], ["map", "lamp"],
    [["他说盖一座高高的石头建筑，先要把地基量得比谁都准。", "He said to raise a tall stone building you must measure the foundation more carefully than anyone."], ["后来的人说他也会治病，他听了笑笑，没有说是还是不是。", "Later people said he could heal as well; he smiled and neither agreed nor denied it."]],
    ["🔺", "一页阶梯形的草图", "A sketch of a stepped building"], ["高的东西，都是从稳的地方开始的。", "Anything tall begins from somewhere steady."], "Encyclopaedia Britannica, Imhotep; architect of the Step Pyramid at Saqqara. His reputation as a healer comes from later tradition.",
    ["他把东西摊开，指着上面的一个点，说就从这里量起。", "He spread it out, pointed at one spot, and said they would measure from here."], "2026-11-02 AI初核通过，待用户终审：行医一说是后世传统，文字已标明");
  P("sor_juana", ["胡安娜修女", "Sor Juana Ines de la Cruz"], ["十七世纪，新西班牙（今墨西哥）", "17th century, New Spain (now Mexico)"], "Mexico", 40, "她", ["d", "black", "bun", "none", "#6a7a9a"], [2, 3], ["book", "spectacles"],
    [["她书架上的书比谁都多，她说一整面墙也不够放。", "Her shelf held more books than anyone's, and she said a whole wall was not enough."], ["她说女子也有读书的权利，说这话时很平静。", "She said women have the right to read too, and said it very calmly."]],
    ["🖋️", "一页诗稿的复印件", "A copy of a page of verse"], ["想读的书，值得好好等。", "A book you want to read is worth waiting for."], "Encyclopaedia Britannica, Sor Juana Ines de la Cruz; poet and scholar of New Spain, her Reply to Sor Filotea.",
    ["她捧着书，翻到第一页，安静地读了起来。", "She held the book, turned to the first page and began to read in silence."], "2026-11-02 AI初核通过，待用户终审：只写读书和写作，不涉及宗教生活");
  P("machado", ["马查多·德·阿西斯", "Machado de Assis"], ["十九至二十世纪，巴西", "19th-20th century, Brazil"], "Brazil", 55, "他", ["e", "gray", "short", "round", "#7a6a5a"], [1, 2], ["spectacles", "tea"],
    [["他说话慢条斯理，总在你以为他要认真的时候讲个笑话。", "He spoke slowly and always told a joke just when you thought he was about to be serious."], ["他说读书的人就像朋友，写东西时得时不时跟他打个招呼。", "He said a reader is like a friend, and while writing you should greet them now and then."]],
    ["📕", "一页校样的复印件", "A copy of a page of proofs"], ["字要一个一个排对，才对得起读的人。", "Set each word right, and you deserve the reader."], "Encyclopaedia Britannica, Machado de Assis; founder and first president of the Brazilian Academy of Letters.",
    ["他戴上看了看，满意地笑了。", "He put them on, looked around, and smiled with satisfaction."], OK3);
  P("finlay", ["卡洛斯·芬莱", "Carlos Finlay"], ["十九至二十世纪，古巴", "19th-20th century, Cuba"], "Cuba", 55, "他", ["c", "gray", "short", "square", "#7a8f6a"], [2, 3], ["microscope", "tea"],
    [["他盯着一只蚊子看了很久，说小东西也可能是大麻烦的源头。", "He stared at a mosquito for a long time and said a small thing may be the source of a large trouble."], ["他说想法被人笑了很多年也没关系，等证据就是了。", "He said it did not matter that people had laughed at his idea for years; one simply waits for the evidence."]],
    ["🦟", "一页蚊子的素描", "A sketch of a mosquito"], ["耐心比争论管用。", "Patience works better than argument."], "Encyclopaedia Britannica, Carlos Finlay; proposed in 1881 that mosquitoes carry yellow fever.",
    ["他把眼睛凑上去，半天没有抬头。", "He put an eye to it and did not look up for a long time."], OK3);
  P("kahlo", ["弗里达·卡罗", "Frida Kahlo"], ["二十世纪，墨西哥", "20th century, Mexico"], "Mexico", 35, "她", ["e", "black", "bun", "none", "#c0506a"], [1, 2], ["paints", "scarf"],
    [["她问你家里有没有镜子，她喜欢对着镜子画自己。", "She asked whether you had a mirror, because she liked to paint herself looking into one."], ["她的衣服颜色鲜艳，还说家里养过猴子、小狗和鹦鹉。", "Her clothes were brightly coloured, and she said she had kept monkeys, dogs and a parrot at home."]],
    ["🌺", "一朵纸花", "A paper flower"], ["颜色是不会骗人的，我只是照着画。", "Colours do not lie; I only paint what I see."], "Encyclopaedia Britannica, Frida Kahlo; self-portraits, her house in Coyoacan and her pets.",
    ["她立刻铺开颜料，说要先画这条围巾的红。", "She spread out the paints at once and said she would start with the red of the scarf."], "2026-11-02 AI初核通过，待用户终审：只写绘画与家居，不涉及政治立场和健康状况");
  P("sequoyah", ["塞阔雅", "Sequoyah"], ["十八至十九世纪，切罗基族", "18th-19th century, Cherokee"], "United States", 50, "他", ["f", "black", "short", "none", "#8a6a4b"], [1, 2], ["pen", "lamp"],
    [["他说要给自己的话造一套文字，试了很多年，一个符号一个符号地改。", "He said he wanted to make a writing system for his own language, and tried for years, changing it symbol by symbol."], ["他随身带着一叠写满符号的纸，说还要再核对一遍。", "He carried a stack of paper full of symbols and said he still had to check them once more."]],
    ["📝", "一页音节表的复印件", "A copy of a page of a syllable chart"], ["自己的话，值得有自己的字。", "Your own language deserves its own letters."], "Encyclopaedia Britannica, Sequoyah; creator of the Cherokee syllabary, completed about 1821.",
    ["他把灯移近，一个符号一个符号地对了起来。", "He moved the lamp closer and checked the symbols one by one."], OK3);
  P("tupaia", ["图帕伊亚", "Tupaia"], ["十八世纪，社会群岛", "18th century, Society Islands"], "Raiatea (Polynesia)", 40, "他", ["f", "black", "long", "none", "#6a9a8f"], [1, 2], ["map", "umbrella"],
    [["他不看星图，凭星星出现的方向，就能说出哪个岛在哪边。", "He needed no star chart; from the direction in which stars rise, he could say where each island lay."], ["他在纸上画了一张海的图，上面有七十多个岛。", "He drew a chart of the sea on paper, with more than seventy islands on it."]],
    ["🧭", "一张海图的复印件", "A copy of a sea chart"], ["海上没有路，只有记住的方向。", "There are no roads at sea, only directions you remember."], "Encyclopaedia Britannica, Tupaia; navigator and priest from Raiatea, his chart of the Pacific islands drawn in 1769.",
    ["他把东西展开，用手指在上面比了比远处的岛。", "He spread it out and traced the distant islands with a finger."], "2026-11-02 AI初核通过，待用户终审：只写航海与海图，不涉及殖民叙事");

  /* ---------- 地区和行业标签：选人时按地区均分，行业略微倾斜 ----------
     area：ea 东亚，sa 南亚与东南亚，wa 西亚与中亚，eu 欧洲，af 非洲，am 美洲与大洋洲。
     field：med 医疗，sci 科学与工程，art 文学艺术，edu 学问与教育，pol 政治与军事，trv 旅行与航海。 */
  V.AREAS = ["ea", "sa", "wa", "eu", "af", "am"];
  V.FIELDS = ["med", "sci", "art", "edu", "pol", "trv"];
  const TAGS = {
    nightingale: ["eu", "med"], zhuge: ["ea", "pol"], curie: ["eu", "sci"], galois: ["eu", "sci"], mozart: ["eu", "art"], beethoven: ["eu", "art"], da_vinci: ["eu", "art"],
    li_bai: ["ea", "art"], du_fu: ["ea", "art"], su_shi: ["ea", "art"], zhang_heng: ["ea", "sci"], li_shizhen: ["ea", "med"], lin_daiyu: ["ea", "art"], archimedes: ["eu", "sci"],
    ibn_sina: ["wa", "med"], al_khwarizmi: ["wa", "sci"], ada: ["eu", "sci"], ramanujan: ["sa", "sci"], tagore: ["sa", "art"], hokusai: ["ea", "art"], murasaki: ["ea", "art"],
    basho: ["ea", "art"], ibn_battuta: ["af", "trv"], austen: ["eu", "art"], pasteur: ["eu", "med"], seacole: ["am", "med"], dickinson: ["am", "art"], wang_xizhi: ["ea", "art"],
    zhang_zhongjing: ["ea", "med"], euler: ["eu", "sci"],
    hippocrates: ["eu", "med"], ibn_al_nafis: ["wa", "med"], omar_khayyam: ["wa", "sci"], scheherazade: ["wa", "art"], sushruta: ["sa", "med"], aryabhata: ["sa", "sci"],
    le_huu_trac: ["sa", "med"], raden_saleh: ["sa", "art"], sunthorn_phu: ["sa", "art"], al_fihri: ["af", "edu"], ibn_khaldun: ["af", "edu"], horton: ["af", "med"],
    anansi: ["af", "art"], imhotep: ["af", "sci"], sor_juana: ["am", "art"], machado: ["am", "art"], finlay: ["am", "med"], kahlo: ["am", "art"], sequoyah: ["am", "edu"], tupaia: ["am", "trv"],
  };
  for (const id in TAGS) { const c = V.cards[id]; if (c) { c.area = TAGS[id][0]; c.field = TAGS[id][1]; } }

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

  /* ---------- 年龄：按大众印象里的样子，白胡子的老先生就是老先生，年轻的天才就是年轻的 ---------- */
  const AGES = { nightingale: 38, zhuge: 48, curie: 45, du_fu: 58, su_shi: 52, li_shizhen: 60, da_vinci: 62, tagore: 70, euler: 62, hippocrates: 70, archimedes: 60, pasteur: 60, machado: 60, ibn_sina: 55, zhang_zhongjing: 55, dickinson: 35 };
  for (const id in AGES) if (V.cards[id]) V.cards[id].age = AGES[id];

  /* ---------- 自己的话：广为流传的名言，来客隔一阵念叨一句，满足以后也还会念叨。排在需求暗示后面 ---------- */
  V.NEED_HINTS = 2;
  V.said = (id, zh, en) => {
    const c = V.cards[id]; if (!c) return;
    const n = c.t.hint.length;
    c.t.hint.push({ "zh-CN": zh, en });
    CY.i18n.register("zh-CN", { [`visitor.${id}.hint.${n}`]: zh });
    CY.i18n.register("en", { [`visitor.${id}.hint.${n}`]: en });
  };
  V.said("nightingale", "医院的第一条要求，是不能伤害病人。", "The very first requirement in a hospital is that it should do the sick no harm.");
  V.said("zhuge", "非淡泊无以明志，非宁静无以致远。", "Without simplicity there is no clarity of purpose; without stillness, no reaching far.");
  V.said("curie", "生活中没有什么可怕的东西，只有需要理解的东西。", "Nothing in life is to be feared, it is only to be understood.");
  V.said("galois", "我没有时间了……我没有时间了。", "I have no time... I have no time.");
  V.said("mozart", "我从不理会别人的称赞或责备，只听我自己的感觉。", "I pay no attention to anyone's praise or blame. I simply follow my own feelings.");
  V.said("beethoven", "所有的人，都将成为兄弟。", "All men shall become brothers.");
  V.said("da_vinci", "学习从不会让头脑疲惫。", "Learning never exhausts the mind.");
  V.said("li_bai", "天生我材必有用，千金散尽还复来。", "Heaven made me with talents, and they must be of use; spend a thousand in gold and it will come again.");
  V.said("du_fu", "安得广厦千万间，大庇天下寒士俱欢颜。", "If only I had ten thousand spacious houses to shelter every poor scholar under heaven, all smiling.");
  V.said("su_shi", "人间有味是清欢。", "The truest taste in this world is a simple, quiet joy.");
  V.said("zhang_heng", "浑天如鸡子，地如鸡子中黄。", "The heavens are like an egg, and the earth is the yolk inside it.");
  V.said("archimedes", "尤里卡！我找到了！", "Eureka! I have found it!");
  V.said("ibn_sina", "要真正了解一件事，就得知道它的缘由。", "To truly know a thing, you must know its causes.");
  V.said("ada", "想象力是发现的能力，它能穿透我们周围看不见的世界。", "Imagination is the discovering faculty. It penetrates the unseen worlds around us.");
  V.said("tagore", "愿你的生命像露珠，在时间的叶尖上轻轻起舞。", "Let your life lightly dance on the edges of Time like dew on the tip of a leaf.");
  V.said("hokusai", "七十三岁，我才对鸟兽草木鱼虫的真正结构略有所悟。", "At seventy-three I learned a little about the real structure of animals, plants, trees, birds, fishes and insects.");
  V.said("basho", "古池塘，青蛙跳进去，水声响。", "An old pond: a frog jumps in, the sound of water.");
  V.said("austen", "要说真正的舒适，没有什么比待在家里更好。", "There is nothing like staying at home for real comfort.");
  V.said("pasteur", "在观察的领域里，机遇只偏爱有准备的头脑。", "In the fields of observation, chance favors only the prepared mind.");
  V.said("dickinson", "我是无名小卒！你是谁？", "I'm nobody! Who are you?");
  V.said("wang_xizhi", "仰观宇宙之大，俯察品类之盛。", "Looking up, I see how vast the universe is; looking down, how rich the myriad things.");
  V.said("zhang_zhongjing", "勤求古训，博采众方。", "Seek the old teachings diligently, and gather every prescription widely.");
  V.said("euler", "世上没有哪件事，不带着某种最大或最小的道理。", "Nothing takes place in the world whose meaning is not that of some maximum or minimum.");
  V.said("hippocrates", "生命短暂，技艺长久。", "Life is short, the art is long.");
  V.said("scheherazade", "这还只是故事的开头。", "And that was only the beginning of the story.");
  V.said("sor_juana", "我读书，不是为了知道得更多，而是为了少一些无知。", "I do not study to know more, but to ignore less.");
  V.said("kahlo", "我画的，是我自己的现实。", "I paint my own reality.");

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
})(globalThis.CY = globalThis.CY || {});
