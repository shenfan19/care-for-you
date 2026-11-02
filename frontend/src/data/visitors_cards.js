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
})(globalThis.CY = globalThis.CY || {});
