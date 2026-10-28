/* 初始数据：物种模板、疾病模板、类别设定、声线、说话库、AI 技能。首次运行时写成文件夹里的明文 YAML，之后以文件为准。
   起始时没有任何角色，由引导页让用户选。
   需求的 rate 可以是一个数，也可以按阶段分别写，hold 是长按秒数，min 是这件事花掉的游戏分钟。stages 限定适用的年龄阶段，不写就不限。 */
(function (CY) {
  const F = {};

  F['templates/species/human.yaml'] = `version: 4
id: human
label: 人
food: food
needs:
  thirst: { label: 口渴, icon: "💧", rate: { default: 0.08, infant: 0.1 } }
  hunger: { label: 饥饿, icon: "🍚", rate: { infant: 0.22, toddler: 0.15, child: 0.1, default: 0.08 } }
  rest: { label: 疲倦, icon: "😴", rate: { infant: 0.12, toddler: 0.08, default: 0.05 } }
  company: { label: 想有人陪, icon: "🤝", rate: { infant: 0.12, toddler: 0.1, child: 0.08, default: 0.05 } }
  play: { label: 想玩, icon: "🧸", rate: { infant: 0.08, toddler: 0.12, default: 0.1 }, stages: [infant, toddler, child] }
  diaper: { label: 尿布湿了, icon: "🚼", rate: { infant: 0.14, default: 0.06 }, stages: [infant, toddler] }
  hygiene: { label: 想洗澡, icon: "🛁", rate: { infant: 0.04, toddler: 0.04, child: 0.035, default: 0.025 } }
  homework: { label: 作业没写完, icon: "📚", rate: 0.05, stages: [child, teen] }
  mobility: { label: 想活动活动, icon: "🚶", rate: 0.03, stages: [elder] }
actions:
  pet: { label: { default: 拍拍肩, infant: 摸摸脸, toddler: 摸摸头, child: 摸摸头, teen: 拍拍肩 }, hold: 1, min: 2, effect: { company: -0.25 }, mood: 0.05 }
  hug: { label: { infant: 抱着, default: 抱一抱 }, hold: 4, min: 8, effect: { company: -0.5, rest: -0.15 }, mood: 0.1, stages: [infant, toddler, child] }
  water: { label: 倒水, hold: 3, min: 3, effect: { thirst: -0.9 }, stages: [toddler, child, teen, adult, elder] }
  feed: { label: { infant: 喂奶, default: 喂饭 }, hold: 5, min: 25, effect: { hunger: -0.9, thirst: -0.4 }, stages: [infant, toddler] }
  meal: { label: { default: 做一顿饭, elder: 做饭给ta吃 }, hold: 6, min: 60, effect: { hunger: -0.9, thirst: -0.2 }, stages: [child, teen, adult, elder] }
  diaper: { label: 换尿布, hold: 4, min: 8, effect: { diaper: -1 }, stages: [infant, toddler] }
  bath: { label: { elder: 帮忙洗澡, default: 洗澡 }, hold: 6, min: 25, effect: { hygiene: -1, company: -0.1 }, stages: [infant, toddler, child, elder] }
  play: { label: { infant: 逗逗ta, default: 陪玩 }, hold: 8, min: 40, effect: { play: -0.9, company: -0.4 }, stages: [infant, toddler, child] }
  read: { label: 读绘本, hold: 6, min: 20, effect: { play: -0.4, company: -0.3, rest: -0.2 }, mood: 0.1, stages: [toddler, child] }
  soothe: { label: { child: 讲睡前故事, default: 哄睡 }, hold: 10, min: 30, effect: { rest: -0.9 }, stages: [infant, toddler, child] }
  homework: { label: 陪写作业, hold: 7, min: 45, effect: { homework: -1, company: -0.3 }, stages: [child, teen] }
  game: { label: 一起打游戏, hold: 7, min: 40, effect: { company: -0.6 }, mood: 0.12, stages: [teen] }
  chat: { label: 聊聊天, hold: 6, min: 20, effect: { company: -0.6 }, mood: 0.1, stages: [teen, adult, elder] }
  rest: { label: 扶去休息, hold: 6, min: 15, effect: { rest: -0.9 }, stages: [elder] }
  walk: { label: 搀着散步, hold: 8, min: 45, effect: { mobility: -1, company: -0.3 }, frailty: -0.05, stages: [elder] }
  park: { label: 带去公园, hold: 8, min: 40, away: true, outing: { place: park, room: lawn, minutes: 8, group: true }, effect: { play: -0.6, company: -0.4, mobility: -0.5 }, mood: 0.15, stages: [infant, toddler, child, elder] }
  street: { label: 去街上逛逛, hold: 6, min: 30, away: true, outing: { place: street, room: road, minutes: 6, group: true }, effect: { company: -0.3, play: -0.3 }, mood: 0.1, stages: [toddler, child, elder] }
  hand: { label: 握着手, hold: 6, min: 10, effect: { company: -0.5 }, frailty: -0.15, mood: 0.1, stages: [elder] }
  doctor: { label: 带去看医生, hold: 8, min: 120, away: true, effect: {}, frailty: -0.25, mood: 0.05, heals: [cold] }
  drink: { label: 倒水喝, selfonly: true, self: [child, teen, adult, elder], hold: 1, min: 3, effect: { thirst: -0.8 }, stages: [child, teen, adult, elder] }
  cook: { label: 做饭, selfonly: true, self: [teen, adult, elder], hold: 1, min: 60, effect: { hunger: -0.8 }, stages: [teen, adult, elder] }
  snack: { label: 找点吃的, selfonly: true, self: [child], hold: 1, min: 10, effect: { hunger: -0.6 }, stages: [child] }
  nap: { label: 小睡一会儿, selfonly: true, self: [child, teen, adult, elder], hold: 1, min: 30, effect: { rest: -0.6 }, stages: [child, teen, adult, elder] }
  wash: { label: 洗个澡, selfonly: true, self: [child, teen, adult, elder], hold: 1, min: 25, effect: { hygiene: -0.9 }, stages: [child, teen, adult, elder] }
  tv: { label: 看会儿电视, selfonly: true, self: [child, teen, adult, elder], hold: 1, min: 30, effect: { company: -0.25, play: -0.3 }, stages: [child, teen, adult, elder] }
  stretch: { label: 活动活动腿脚, selfonly: true, self: [elder], hold: 1, min: 15, effect: { mobility: -0.5 }, stages: [elder] }
`;

const petActions = (feedLabel, extra) => `  peat: { label: 自己吃东西, selfonly: true, self: true, hold: 1, min: 5, effect: { hunger: -0.7 } }
  pdrink: { label: 自己喝水, selfonly: true, self: true, hold: 1, min: 3, effect: { thirst: -0.7 } }
  groom: { label: 梳毛, hold: 5, min: 15, effect: { company: -0.3 }, mood: 0.1 }
  vet: { label: 带去看兽医, hold: 8, min: 90, away: true, effect: {}, frailty: -0.25, mood: 0.05 }
  pet: { label: 摸一摸, hold: 1, min: 2, effect: { company: -0.3 }, mood: 0.06 }
  water: { label: 换水, hold: 3, min: 3, effect: { thirst: -0.9 } }
  feed: { label: ${feedLabel}, hold: 4, min: 5, effect: { hunger: -0.9 } }
${extra}`;

  F['templates/species/cat.yaml'] = `version: 3
id: cat
label: 猫
food: pet_food
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.09 }
  hunger: { label: 饥饿, icon: "🍚", rate: 0.09 }
  company: { label: 想蹭人, icon: "🤝", rate: 0.07 }
  play: { label: 想玩, icon: "🧶", rate: 0.10 }
  clean: { label: 猫砂该清了, icon: "🧹", rate: 0.04 }
actions:
${petActions('喂猫粮', `  play: { label: 逗猫, hold: 8, min: 20, effect: { play: -0.9, company: -0.3 } }
  clean: { label: 铲猫砂, hold: 4, min: 10, effect: { clean: -1 } }
  hand: { label: 抱一会儿, hold: 6, min: 10, effect: { company: -0.5 }, frailty: -0.15, mood: 0.1 }`)}`;

  F['templates/species/dog.yaml'] = `version: 5
id: dog
label: 狗
food: pet_food
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.09 }
  hunger: { label: 饥饿, icon: "🍖", rate: 0.09 }
  company: { label: 想你陪, icon: "🤝", rate: 0.09 }
  play: { label: 想出去玩, icon: "🎾", rate: 0.12 }
actions:
${petActions('喂狗粮', `  play: { label: 扔球, hold: 7, min: 20, effect: { play: -0.9, company: -0.3 } }
  walk: { label: 遛一圈, hold: 10, min: 40, away: true, outing: { place: park, room: lawn, minutes: 6, group: false }, effect: { play: -1, company: -0.5 }, mood: 0.12 }
  train: { label: 教口令, hold: 6, min: 20, effect: { play: -0.4, company: -0.3 }, mood: 0.08 }`)}`;

  F['templates/species/rabbit.yaml'] = `version: 3
id: rabbit
label: 兔子
food: pet_food
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.08 }
  hunger: { label: 饥饿, icon: "🥕", rate: 0.09 }
  company: { label: 想你陪, icon: "🤝", rate: 0.05 }
  play: { label: 想出来跳跳, icon: "🐇", rate: 0.07 }
  clean: { label: 笼子该打扫了, icon: "🧹", rate: 0.04 }
actions:
${petActions('喂草和菜', `  play: { label: 放出来跳, hold: 7, min: 25, effect: { play: -0.9, company: -0.3 } }
  clean: { label: 打扫笼子, hold: 5, min: 15, effect: { clean: -1 } }`)}`;

  F['templates/species/hamster.yaml'] = `version: 3
id: hamster
label: 仓鼠
food: pet_food
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.07 }
  hunger: { label: 饥饿, icon: "🌰", rate: 0.07 }
  play: { label: 想跑轮, icon: "🎡", rate: 0.05 }
  clean: { label: 窝该换垫料了, icon: "🧹", rate: 0.03 }
actions:
${petActions('喂鼠粮', `  play: { label: 放进跑轮, hold: 3, min: 10, effect: { play: -0.9 } }
  clean: { label: 换垫料, hold: 5, min: 15, effect: { clean: -1 } }`)}`;

  F['templates/species/bird.yaml'] = `version: 4
id: bird
label: 小鸟
food: pet_food
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.09 }
  hunger: { label: 饥饿, icon: "🌾", rate: 0.09 }
  company: { label: 想你陪, icon: "🤝", rate: 0.07 }
  play: { label: 想出来飞, icon: "🪶", rate: 0.08 }
  clean: { label: 笼底该清了, icon: "🧹", rate: 0.04 }
actions:
${petActions('添鸟食', `  play: { label: 放出来飞, hold: 6, min: 20, effect: { play: -0.9, company: -0.3 } }
  clean: { label: 清笼底, hold: 4, min: 10, effect: { clean: -1 } }
  teach: { label: 教说话, hold: 6, min: 15, effect: { play: -0.3, company: -0.4 }, mood: 0.08 }`)}`;

  F['templates/species/fish.yaml'] = `version: 3
id: fish
label: 金鱼
food: pet_food
needs:
  hunger: { label: 饥饿, icon: "🍚", rate: 0.05 }
  clean: { label: 水该换了, icon: "🫧", rate: 0.04 }
actions:
  pet: { label: 看一看, hold: 1, min: 2, effect: {}, mood: 0.03 }
  feed: { label: 撒鱼食, hold: 2, min: 2, effect: { hunger: -0.9 } }
  clean: { label: 换水, hold: 6, min: 20, effect: { clean: -1 } }
`;

  F['templates/species/turtle.yaml'] = `version: 3
id: turtle
label: 乌龟
food: pet_food
needs:
  thirst: { label: 水位低了, icon: "💧", rate: 0.04 }
  hunger: { label: 饥饿, icon: "🍤", rate: 0.04 }
  warmth: { label: 要晒灯, icon: "🔥", rate: 0.05 }
  clean: { label: 水该换了, icon: "🫧", rate: 0.03 }
actions:
${petActions('喂龟粮', `  warm: { label: 开晒灯, hold: 3, min: 5, effect: { warmth: -0.9 } }
  clean: { label: 换水, hold: 6, min: 20, effect: { clean: -1 } }`)}`;

  F['templates/species/snake.yaml'] = `version: 3
id: snake
label: 蛇
food: pet_food
needs:
  warmth: { label: 要保温, icon: "🔥", rate: 0.07 }
  thirst: { label: 口渴, icon: "💧", rate: 0.05 }
  hunger: { label: 饥饿, icon: "🍖", rate: 0.02 }
actions:
  peat: { label: 自己吃东西, selfonly: true, self: true, hold: 1, min: 5, effect: { hunger: -0.7 } }
  pdrink: { label: 自己喝水, selfonly: true, self: true, hold: 1, min: 3, effect: { thirst: -0.7 } }
  vet: { label: 带去看兽医, hold: 8, min: 90, away: true, effect: {}, frailty: -0.25, mood: 0.05 }
  pet: { label: 轻轻碰一下, hold: 1, min: 2, effect: {}, mood: 0.03 }
  warm: { label: 调保温灯, hold: 4, min: 5, effect: { warmth: -0.9 } }
  water: { label: 换水, hold: 3, min: 3, effect: { thirst: -0.9 } }
  feed: { label: 喂食, hold: 5, min: 8, effect: { hunger: -0.9 } }
`;

  F['templates/species/guineapig.yaml'] = `version: 3
id: guineapig
label: 豚鼠
food: pet_food
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.08 }
  hunger: { label: 饥饿, icon: "🌾", rate: 0.09 }
  veg: { label: 想吃新鲜蔬菜, icon: "🥬", rate: 0.06 }
  company: { label: 想你陪, icon: "🤝", rate: 0.06 }
  clean: { label: 笼子该打扫了, icon: "🧹", rate: 0.04 }
actions:
${petActions('喂鼠粮', `  veggie: { label: 喂新鲜蔬菜, hold: 4, min: 6, effect: { veg: -1 }, mood: 0.06 }
  clean: { label: 打扫笼子, hold: 5, min: 15, effect: { clean: -1 } }`)}`;

  F['templates/species/gecko.yaml'] = `version: 3
id: gecko
label: 守宫
food: pet_food
needs:
  warmth: { label: 要保温, icon: "🔥", rate: 0.05 }
  humid: { label: 要喷水保湿, icon: "💦", rate: 0.06 }
  thirst: { label: 口渴, icon: "💧", rate: 0.04 }
  hunger: { label: 饥饿, icon: "🦗", rate: 0.03 }
actions:
  peat: { label: 自己吃东西, selfonly: true, self: true, hold: 1, min: 5, effect: { hunger: -0.7 } }
  pdrink: { label: 自己喝水, selfonly: true, self: true, hold: 1, min: 3, effect: { thirst: -0.7 } }
  vet: { label: 带去看兽医, hold: 8, min: 90, away: true, effect: {}, frailty: -0.25, mood: 0.05 }
  pet: { label: 轻轻碰一下, hold: 1, min: 2, effect: {}, mood: 0.03 }
  warm: { label: 调保温灯, hold: 4, min: 5, effect: { warmth: -0.9 } }
  mist: { label: 喷水保湿, hold: 3, min: 5, effect: { humid: -1 } }
  water: { label: 换水, hold: 3, min: 3, effect: { thirst: -0.9 } }
  feed: { label: 喂食, hold: 5, min: 8, effect: { hunger: -0.9 } }
`;

  F['templates/species/hedgehog.yaml'] = `version: 3
id: hedgehog
label: 刺猬
food: pet_food
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.07 }
  hunger: { label: 饥饿, icon: "🐛", rate: 0.08 }
  play: { label: 想出来逛逛, icon: "🍂", rate: 0.06 }
  clean: { label: 窝该换垫料了, icon: "🧹", rate: 0.04 }
actions:
${petActions('喂刺猬粮', `  play: { label: 放出来逛逛, hold: 7, min: 25, effect: { play: -0.9 } }
  clean: { label: 换垫料, hold: 5, min: 15, effect: { clean: -1 } }`)}`;

  F['templates/species/duck.yaml'] = `version: 3
id: duck
label: 鸭子
food: pet_food
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.1 }
  hunger: { label: 饥饿, icon: "🌾", rate: 0.09 }
  company: { label: 想你陪, icon: "🤝", rate: 0.07 }
  play: { label: 想下水玩, icon: "🦆", rate: 0.07 }
  clean: { label: 水盆该换了, icon: "🫧", rate: 0.05 }
actions:
${petActions('喂鸭食', `  play: { label: 放去玩水, hold: 7, min: 25, effect: { play: -0.9, company: -0.3 } }
  clean: { label: 换水盆, hold: 5, min: 15, effect: { clean: -1 } }`)}`;

  F['templates/species/ferret.yaml'] = `version: 3
id: ferret
label: 雪貂
food: pet_food
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.08 }
  hunger: { label: 饥饿, icon: "🍖", rate: 0.1 }
  company: { label: 想你陪, icon: "🤝", rate: 0.09 }
  play: { label: 想出来跑, icon: "🐾", rate: 0.12 }
  clean: { label: 窝该清了, icon: "🧹", rate: 0.04 }
actions:
${petActions('喂雪貂粮', `  play: { label: 陪它钻管道, hold: 8, min: 25, effect: { play: -0.9, company: -0.3 } }
  clean: { label: 清窝, hold: 5, min: 15, effect: { clean: -1 } }
  hand: { label: 抱一会儿, hold: 6, min: 10, effect: { company: -0.5 }, frailty: -0.15, mood: 0.1 }`)}`;

  F['templates/species/axolotl.yaml'] = `version: 3
id: axolotl
label: 六角恐龙
food: pet_food
needs:
  thirst: { label: 水位低了, icon: "💧", rate: 0.03 }
  hunger: { label: 饥饿, icon: "🪱", rate: 0.04 }
  clean: { label: 水该换了, icon: "🫧", rate: 0.05 }
actions:
  vet: { label: 带去看兽医, hold: 8, min: 90, away: true, effect: {}, frailty: -0.25, mood: 0.05 }
  pet: { label: 轻轻碰一下, hold: 1, min: 2, effect: {}, mood: 0.03 }
  water: { label: 补水, hold: 3, min: 3, effect: { thirst: -0.9 } }
  feed: { label: 喂食, hold: 5, min: 8, effect: { hunger: -0.9 } }
  clean: { label: 换水, hold: 6, min: 20, effect: { clean: -1 } }
`;

  F['templates/species/chicken.yaml'] = `version: 3
id: chicken
label: 小鸡
food: pet_food
needs:
  thirst: { label: 口渴, icon: "💧", rate: 0.09 }
  hunger: { label: 饥饿, icon: "🌽", rate: 0.1 }
  company: { label: 想你陪, icon: "🤝", rate: 0.05 }
  clean: { label: 鸡窝该换稻草了, icon: "🧹", rate: 0.04 }
actions:
${petActions('撒玉米', `  clean: { label: 换稻草, hold: 5, min: 15, effect: { clean: -1 } }`)}`;

  const plant = (id, label, w, s, f, p) => `version: 3
id: ${id}
label: ${label}
needs:
  water: { label: 土干了, icon: "💧", rate: ${w} }
  sun: { label: 想晒太阳, icon: "☀", rate: ${s} }
  fertilize: { label: 该施肥了, icon: "🌱", rate: ${f} }
  prune: { label: 该修剪了, icon: "✂", rate: ${p} }
actions:
  pet: { label: 碰碰叶子, hold: 1, min: 1, effect: {}, mood: 0.02 }
  water: { label: 浇水, hold: 3, min: 5, effect: { water: -1 } }
  sun: { label: 挪到阳光下, hold: 3, min: 3, effect: { sun: -1 } }
  fertilize: { label: 施肥, hold: 4, min: 8, effect: { fertilize: -1 } }
  prune: { label: 修剪, hold: 5, min: 10, effect: { prune: -1 } }
  repot: { label: 换盆, hold: 6, min: 20, effect: { fertilize: -0.5, prune: -0.4 }, mood: 0.1 }
`;
  F['templates/species/succulent.yaml'] = plant('succulent', '多肉', 0.008, 0.01, 0.003, 0.002);
  F['templates/species/flower.yaml'] = plant('flower', '开花的花', 0.025, 0.015, 0.006, 0.006);
  F['templates/species/tree.yaml'] = plant('tree', '盆栽小树', 0.012, 0.01, 0.004, 0.008);
  F['templates/species/cactus.yaml'] = plant('cactus', '仙人掌', 0.004, 0.012, 0.002, 0.002);
  F['templates/species/orchid.yaml'] = plant('orchid', '兰花', 0.02, 0.01, 0.004, 0.004);
  F['templates/species/bamboo.yaml'] = plant('bamboo', '竹子', 0.025, 0.012, 0.005, 0.006);

  /* 类别：人按年龄阶段，其余按物种。urgency 是被需要的紧迫程度，self_care 是没人管时自己解决需求的可能，cries 为真时需求严重会不停哭闹 */
  F['templates/classes.yaml'] = `version: 6
# 不同类别的人和动物在没人管的时候表现不同。婴儿完全不能自理，会哭闹，老人能自己吃饭睡觉，花草不会说话但会慢慢蔫掉。
classes:
  infant: { urgency: 3.0, self_care: 0, cries: true, nag: 15 }
  toddler: { urgency: 2.4, self_care: 0.05, cries: true, nag: 20 }
  child: { urgency: 1.5, self_care: 0.35 }
  teen: { urgency: 1.0, self_care: 0.7 }
  adult: { urgency: 0.8, self_care: 0.9 }
  elder: { urgency: 1.6, self_care: 0.6 }
  cat: { urgency: 1.0, self_care: 0.3, nag: 40 }
  dog: { urgency: 1.1, self_care: 0.1, nag: 35 }
  rabbit: { urgency: 1.0, self_care: 0.1 }
  hamster: { urgency: 0.8, self_care: 0.15 }
  bird: { urgency: 1.0, self_care: 0.1 }
  fish: { urgency: 0.6, self_care: 0.02 }
  turtle: { urgency: 0.6, self_care: 0.05 }
  snake: { urgency: 0.6, self_care: 0.05 }
  guineapig: { urgency: 0.9, self_care: 0.15 }
  gecko: { urgency: 0.6, self_care: 0.05 }
  hedgehog: { urgency: 0.8, self_care: 0.15 }
  duck: { urgency: 1.0, self_care: 0.15 }
  ferret: { urgency: 1.1, self_care: 0.1 }
  axolotl: { urgency: 0.6, self_care: 0.03 }
  chicken: { urgency: 0.9, self_care: 0.2 }
  orchid: { urgency: 0.35, self_care: 0 }
  bamboo: { urgency: 0.3, self_care: 0 }
  succulent: { urgency: 0.3, self_care: 0 }
  cactus: { urgency: 0.25, self_care: 0 }
  flower: { urgency: 0.4, self_care: 0 }
  tree: { urgency: 0.3, self_care: 0 }
`;

  F['templates/traits.yaml'] = `version: 4
# 性格特征：每个角色可以带最多两个，叠加影响需求速度、自理、作息、效果和心情。
traits:
  clingy: { rate: { company: 1.6, play: 1.3 } }
  independent: { rate: { company: 0.6 }, self_care: 0.2 }
  nightowl: { sleep_shift: 3 }
  earlybird: { sleep_shift: -2 }
  picky: { effect: { hunger: 0.75 } }
  sickly: { frailty: 1.6 }
  sturdy: { frailty: 0.6 }
  grumpy: { mood_offset: -0.1 }
  cheerful: { mood_offset: 0.1 }
  thirsty: { rate: { thirst: 1.5 } }
  hearty: { rate: { hunger: 1.4 } }
  shy: { rate: { company: 0.8 }, self_care: 0.1, mood_offset: -0.03 }
  chatty: { rate: { company: 1.4 }, mood_offset: 0.03 }
  curious: { rate: { play: 1.3 } }
  stubborn: { effect: { company: 0.85, hunger: 0.9 }, mood_offset: -0.05 }
  gentle: { mood_offset: 0.06, frailty: 0.9 }
  playful: { rate: { play: 1.5 }, mood_offset: 0.04 }
  anxious: { rate: { company: 1.3 }, frailty: 1.2, mood_offset: -0.05 }
  proud: { self_care: 0.15, rate: { company: 0.8 } }
  sentimental: { rate: { company: 1.2 } }
`;

  /* 物品与开局的钱。durable 为真表示买了不消耗 */


  /* 疾病：只做基础的典型情景，不是医学建议，更深的内容交给 Life Matters。lines.request 按需求名给出台词，用 {ta} 和 {name} 占位，对谁都适用 */
  F['templates/conditions/diabetes.yaml'] = `version: 3
id: diabetes
label: 糖尿病
needs:
  medicine: { label: 该吃药了, icon: "💊", rate: 0.06 }
  sugar: { label: 该测血糖了, icon: "🩸", rate: 0.05 }
actions:
  medicine: { label: 陪吃药, hold: 5, min: 5, effect: { medicine: -1 } }
  sugar: { label: 测血糖, hold: 3, min: 5, effect: { sugar: -1 } }
  selfmed: { label: 自己吃药, selfonly: true, self: [adult, elder], hold: 1, min: 3, effect: { medicine: -0.8 } }
lines:
  request:
    medicine: ["药，是不是该吃了？", "{ta}看了看药盒，又看了看你。"]
    sugar: ["{ta}摸了摸测血糖的小盒子。", "是不是该测一下了？"]
events:
  dinner:
    evening: true
    say: 晚上吃什么？
    choices:
      - { label: 红烧肉, liked: true, mood: 0.15, frailty: 0.04, reply: "{ta}吃得很高兴。你心里知道，这对{ta}不太好。" }
      - { label: 清蒸鱼配青菜, mood: 0.02, frailty: -0.02, reply: "{ta}嘟囔了一句太清淡，还是吃完了。" }
      - { label: 杂粮粥配小菜, mood: 0.0, frailty: -0.04, reply: "{ta}点点头，说也行。" }
`;

  F['templates/conditions/hypertension.yaml'] = `version: 3
id: hypertension
label: 高血压
needs:
  medicine: { label: 该吃药了, icon: "💊", rate: 0.06 }
  bp: { label: 该量血压了, icon: "🩺", rate: 0.04 }
actions:
  medicine: { label: 陪吃药, hold: 5, min: 5, effect: { medicine: -1 } }
  bp: { label: 量血压, hold: 3, min: 5, effect: { bp: -1 } }
  selfmed: { label: 自己吃药, selfonly: true, self: [adult, elder], hold: 1, min: 3, effect: { medicine: -0.8 } }
  selfbp: { label: 自己量血压, selfonly: true, self: [adult, elder], hold: 1, min: 5, effect: { bp: -0.7 } }
lines:
  request:
    medicine: ["药，是不是该吃了？", "{ta}看了看药盒。"]
    bp: ["今天还没量血压。", "{ta}揉了揉太阳穴。"]
events:
  salty:
    say: 今天菜里放盐吗？
    choices:
      - { label: 多放点盐, liked: true, mood: 0.12, frailty: 0.05, reply: "{ta}说这样才有味道。你没说话。" }
      - { label: 少盐，加点醋, mood: 0.02, frailty: -0.02, reply: "{ta}尝了一口，说也能吃。" }
      - { label: 不放盐，多放姜, mood: -0.02, frailty: -0.04, reply: "{ta}皱了皱眉，还是吃光了。" }
`;

  F['templates/conditions/arthritis.yaml'] = `version: 3
id: arthritis
label: 关节炎
needs:
  joint: { label: 关节疼, icon: "🔥", rate: 0.05 }
actions:
  heat: { label: 热敷, hold: 4, min: 15, effect: { joint: -0.9 } }
  massage: { label: 按摩, hold: 6, min: 20, effect: { joint: -0.6, company: -0.3 }, mood: 0.08 }
  selfheat: { label: 自己热敷, selfonly: true, self: [adult, elder], hold: 1, min: 15, effect: { joint: -0.6 } }
lines:
  request:
    joint: ["{ta}揉着膝盖，轻轻吸了口气。", "天要变了，腿又疼了。"]
`;

  F['templates/conditions/cold.yaml'] = `version: 3
id: cold
label: 感冒发烧
heal_after: { need: fever, count: 3 }
needs:
  fever: { label: 体温高, icon: "🌡", rate: 0.1 }
actions:
  fever: { label: 量体温退热, hold: 4, min: 10, effect: { fever: -0.8 } }
  cool: { label: 物理降温, hold: 5, min: 15, effect: { fever: -0.5, company: -0.2 }, mood: 0.05 }
lines:
  request:
    fever: ["{ta}脸有点烫，没精神。", "{ta}蔫蔫地靠着，额头摸着有点热。"]
`;

  F['templates/conditions/asthma.yaml'] = `version: 3
id: asthma
label: 哮喘
needs:
  breath: { label: 喘得厉害, icon: "💨", rate: 0.03 }
actions:
  inhaler: { label: 用吸入器, hold: 2, min: 3, effect: { breath: -1 } }
  air: { label: 开窗通风, hold: 2, min: 3, effect: { breath: -0.3 } }
lines:
  request:
    breath: ["{ta}咳了几声，喘得有点急。", "{ta}按着胸口，呼吸有点重。"]
`;

  F['templates/conditions/forgetful.yaml'] = `version: 3
id: forgetful
label: 记性变差
needs:
  reorient: { label: 又问了一遍, icon: "❓", rate: 0.05 }
actions:
  remind: { label: 耐心再说一遍, hold: 4, min: 5, effect: { reorient: -1 }, mood: 0.06 }
  album: { label: 翻老相册, hold: 7, min: 30, effect: { reorient: -1, company: -0.5 }, mood: 0.12 }
lines:
  request:
    reorient: ["我的钥匙放哪了？", "今天几号了？", "{ta}站在门口，不记得要去哪儿了。"]
`;

  F['templates/conditions/heart.yaml'] = `version: 3
id: heart
label: 心脏病
needs:
  medicine: { label: 该吃药了, icon: "💊", rate: 0.06 }
  chest: { label: 胸口发闷, icon: "🫀", rate: 0.04 }
actions:
  medicine: { label: 陪吃药, hold: 5, min: 5, effect: { medicine: -1 } }
  restsit: { label: 扶着坐下歇歇, hold: 4, min: 10, effect: { chest: -0.8, company: -0.2 }, mood: 0.03 }
  selfmed: { label: 自己吃药, selfonly: true, self: [adult, elder], hold: 1, min: 3, effect: { medicine: -0.8 } }
lines:
  request:
    medicine: ["药，是不是该吃了？", "{ta}看了看药盒。"]
    chest: ["{ta}按着胸口，慢慢坐了下来。", "{ta}说有点闷，歇一会儿就好。"]
`;

  F['templates/conditions/parkinson.yaml'] = `version: 3
id: parkinson
label: 帕金森
needs:
  medicine: { label: 该吃药了, icon: "💊", rate: 0.06 }
  tremor: { label: 手在抖, icon: "🤲", rate: 0.05 }
actions:
  medicine: { label: 陪吃药, hold: 5, min: 5, effect: { medicine: -1 } }
  steady: { label: 扶稳, hold: 3, min: 8, effect: { tremor: -0.8 }, mood: 0.04 }
  selfmed: { label: 自己吃药, selfonly: true, self: [adult, elder], hold: 1, min: 3, effect: { medicine: -0.8 } }
lines:
  request:
    medicine: ["药，是不是该吃了？", "{ta}看了看药盒，又看了看自己的手。"]
    tremor: ["{ta}端着杯子，手一直在轻轻抖。", "{ta}说今天手不太听使唤。"]
`;

  F['templates/conditions/depress.yaml'] = `version: 3
id: depress
label: 情绪低落
needs:
  lowmood: { label: 心情很低落, icon: "🌧", rate: 0.04 }
actions:
  listen: { label: 静静听ta说, hold: 7, min: 30, effect: { lowmood: -0.7, company: -0.4 }, mood: 0.1 }
  walkout: { label: 陪着出去走走, hold: 9, min: 40, effect: { lowmood: -0.5, company: -0.3 }, mood: 0.12 }
lines:
  request:
    lowmood: ["{ta}坐在窗边，很久没有说话。", "{ta}说：没什么，就是提不起劲。"]
`;

  F['templates/conditions/nocturia.yaml'] = `version: 3
id: nocturia
label: 夜尿多
needs:
  toilet: { label: 想上厕所, icon: "🚽", rate: 0.05 }
actions:
  lead: { label: 扶去厕所, hold: 4, min: 8, effect: { toilet: -1 } }
  nightlight: { label: 开小夜灯, hold: 2, min: 2, effect: { toilet: -0.3 }, flag: { name: nightlight, minutes: 480 } }
  selftoilet: { label: 自己去厕所, selfonly: true, self: [adult, elder], hold: 1, min: 5, effect: { toilet: -0.8 } }
lines:
  request:
    toilet: ["{ta}又起来了，摸索着往厕所走。", "{ta}说夜里要起好几次。"]
events:
  pre_sleep:
    evening: true
    say: 睡前想喝点水吗？
    choices:
      - { label: 喝一小口, mood: 0.03, frailty: 0.0, reply: "{ta}抿了一小口，说够了。" }
      - { label: 喝一大杯, liked: true, mood: 0.08, frailty: 0.03, reply: "{ta}喝得很痛快。你知道夜里怕是要起来了。" }
      - { label: 不喝了，漱漱口, mood: -0.02, frailty: -0.02, reply: "{ta}点点头，说也行。" }
`;

  F['templates/conditions/eczema.yaml'] = `version: 3
id: eczema
label: 湿疹
needs:
  itch: { label: 皮肤发痒, icon: "🩹", rate: 0.06 }
actions:
  ointment: { label: 涂药膏, hold: 4, min: 8, effect: { itch: -0.9 } }
  trimnails: { label: 剪指甲, hold: 5, min: 10, effect: { itch: -0.2 }, mood: 0.04 }
lines:
  request:
    itch: ["{ta}不停地抓着胳膊，皱着眉。", "{ta}哭闹着，小手往身上挠。"]
`;

  F['templates/conditions/fracture.yaml'] = `version: 3
id: fracture
label: 骨折恢复
heal_after: { need: pain, count: 8 }
needs:
  pain: { label: 伤处疼, icon: "🦴", rate: 0.05 }
actions:
  painkill: { label: 吃止痛药, hold: 3, min: 5, effect: { pain: -0.8 } }
  support: { label: 扶着走几步, hold: 5, min: 15, effect: { pain: -0.1 }, frailty: -0.05, mood: 0.04 }
  rehab: { label: 陪着做康复动作, hold: 7, min: 30, effect: { pain: -0.3 }, frailty: -0.1, mood: 0.06 }
lines:
  request:
    pain: ["{ta}扶着伤处，倒吸了一口气。", "{ta}说今天伤口又疼了。"]
`;

  F['templates/conditions/trauma.yaml'] = `version: 3
id: trauma
label: 创伤后惊醒
needs:
  nightmare: { label: 睡不安稳, icon: "🌙", rate: 0.04 }
actions:
  stayclose: { label: 陪在身边不说话, hold: 8, min: 30, effect: { nightmare: -0.7, company: -0.4 }, mood: 0.1 }
  warmdrink: { label: 递一杯热饮, hold: 3, min: 5, effect: { nightmare: -0.4, thirst: -0.3 }, mood: 0.05 }
lines:
  request:
    nightmare: ["{ta}猛地惊醒，抱着自己的胳膊坐了很久。", "{ta}一直看着门口，睡不踏实。"]
`;

  F['templates/conditions/allergy.yaml'] = `version: 3
id: allergy
label: 过敏
needs:
  sneeze: { label: 打喷嚏流眼泪, icon: "🤧", rate: 0.05 }
actions:
  antihist: { label: 吃抗过敏药, hold: 2, min: 3, effect: { sneeze: -0.9 } }
  airclean: { label: 打扫除尘, hold: 6, min: 25, effect: { sneeze: -0.5 } }
lines:
  request:
    sneeze: ["{ta}连着打了几个喷嚏，眼睛红红的。", "{ta}揉着鼻子，说这几天又过敏了。"]
`;

  F['templates/events/rules.yaml'] = `version: 3
# 事件规则数据库。游戏本体不写死任何人或事件，谁在什么时候发生什么，都从这里读，改了就生效。
# trigger：tick 是时间过去，action 是玩家做了一件事，end 是某个带时限的标记到期。
# when：触发条件，可用 sleeping，any_condition，all_conditions，stage，species，hour_from，hour_to，flag，no_flag，care_total_in，min_frailty。
# rate_per_hour：每游戏小时发生的概率。chance：这一条触发的概率。stop：触发后不再看后面的规则。
# do：要做的事，op 可用 flag_set，flag_clear，need，mood，frailty，condition_add，condition_remove，counter，log，say。
# then：先 do，再按 chance 乘以 scale 里的各项算概率，从 outcomes 里按 weight 挑一个结果。
# when 还可以用 dates 日期列表，写 MM-DD 每年重复或 YYYY-MM-DD 某一天，weekday 星期，days_together_in 已陪伴的天数。once_per_day 为真时每人每天只触发一次。
# 数值是占位，等 Life Matters 的模型接进来，可以换成远程后端，规则格式不用变。
rules:
  - id: night_toilet
    trigger: tick
    when: { sleeping: true, any_condition: [nocturia], no_flag: [wc, hospital] }
    rate_per_hour: 0.31
    do:
      - { op: flag_set, name: wc, minutes: 6, place: home, room: toilet }
      - { op: log, type: self, key: log.night_wc }
  - id: night_toilet_end
    trigger: end
    flag: wc
    do:
      - { op: need, need: toilet, delta: -0.9 }
    then:
      chance: 0.012
      scale:
        - { frailty: 2 }
        - { age_over: 80, mult: 1.3 }
        - { flag: nightlight, mult: 0.5 }
      outcomes:
        - weight: 0.65
          do:
            - { op: mood, delta: -0.15 }
            - { op: frailty, delta: 0.15 }
            - { op: flag_set, name: hurt, minutes: 0, value: minor }
            - { op: log, type: event, key: log.fall_minor }
            - { op: say, kind: soft, tkey: log.fall_minor }
        - weight: 0.35
          do:
            - { op: flag_set, name: hospital, minutes: 4320, place: hospital, room: ward, mode: sleep }
            - { op: condition_add, id: fracture }
            - { op: flag_set, name: hurt, minutes: 0, value: serious }
            - { op: log, type: event, key: log.fall_serious }
            - { op: say, kind: cry, tkey: log.fall_serious }
  - id: hospital_end
    trigger: end
    flag: hospital
    do:
      - { op: flag_clear, name: hurt }
      - { op: counter, name: hospital_n, delta: 1 }
      - { op: log, type: recovered, key: log.discharge }
      - { op: say, kind: soft, group: events, key: discharge }
  - id: outing_end
    trigger: end
    flag: outing
    do:
      - { op: mood, delta: 0.05 }
      - { op: log, type: event, key: log.outing_back }
      - { op: say, kind: soft, group: life, key: outing_back }
  - id: play_together_baby
    trigger: tick
    when: { stage: [infant, toddler], sleeping: false, with: { stage: [elder], same_room: true } }
    rate_per_hour: 6
    do:
      - { op: need, need: play, delta: -0.12 }
      - { op: mood, delta: 0.02 }
      - { op: say, kind: soft, group: life, key: play_together }
  - id: play_together_elder
    trigger: tick
    when: { stage: [elder], sleeping: false, with: { stage: [infant, toddler], same_room: true } }
    rate_per_hour: 6
    do:
      - { op: need, need: company, delta: -0.12 }
      - { op: mood, delta: 0.02 }
      - { op: say, kind: soft, group: life, key: play_with_baby }
  - id: clear_hurt
    trigger: action
    when: { flag: [hurt] }
    do:
      - { op: flag_clear, name: hurt }
  - id: milestone
    trigger: action
    when: { care_total_in: [10, 50, 100, 300] }
    stop: true
    do:
      - { op: say, kind: speech, group: events, key: 'milestone_{care_total}' }
  - id: after_fall
    trigger: action
    when: { flag: [hurt] }
    chance: 0.8
    stop: true
    do:
      - { op: say, kind: speech, group: events, key: after_fall }
  - id: visit_hospital
    trigger: action
    when: { flag: [hospital] }
    chance: 0.6
    stop: true
    do:
      - { op: say, kind: speech, group: events, key: visit_hospital }
  - id: festival_newyear
    trigger: tick
    when: { dates: ['01-01'], sleeping: false, hour_from: 8, hour_to: 22 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: festival_newyear }
  - id: festival_valentine
    trigger: tick
    when: { dates: ['02-14'], sleeping: false, hour_from: 8, hour_to: 22 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: festival_valentine }
  - id: festival_children
    trigger: tick
    when: { dates: ['06-01'], sleeping: false, hour_from: 8, hour_to: 22 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: festival_children }
  - id: festival_national
    trigger: tick
    when: { dates: ['10-01'], sleeping: false, hour_from: 8, hour_to: 22 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: festival_national }
  - id: festival_halloween
    trigger: tick
    when: { dates: ['10-31'], sleeping: false, hour_from: 8, hour_to: 22 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: festival_halloween }
  - id: festival_christmas
    trigger: tick
    when: { dates: ['12-24', '12-25'], sleeping: false, hour_from: 8, hour_to: 22 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: festival_christmas }
  - id: festival_spring
    trigger: tick
    when: { dates: ['2026-02-17', '2027-02-06', '2028-01-26', '2029-02-13', '2030-02-03'], sleeping: false, hour_from: 8, hour_to: 22 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: festival_spring }
  - id: festival_midautumn
    trigger: tick
    when: { dates: ['2026-09-25', '2027-09-15', '2028-10-03', '2029-09-22', '2030-09-12'], sleeping: false, hour_from: 8, hour_to: 22 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: festival_midautumn }
  - id: anniv_7
    trigger: tick
    when: { days_together_in: [7], sleeping: false, hour_from: 9, hour_to: 21 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: anniv_7 }
  - id: anniv_30
    trigger: tick
    when: { days_together_in: [30], sleeping: false, hour_from: 9, hour_to: 21 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: anniv_30 }
  - id: anniv_100
    trigger: tick
    when: { days_together_in: [100], sleeping: false, hour_from: 9, hour_to: 21 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: anniv_100 }
  - id: anniv_365
    trigger: tick
    when: { days_together_in: [365], sleeping: false, hour_from: 9, hour_to: 21 }
    once_per_day: true
    rate_per_hour: 3
    do:
      - { op: say, kind: soft, group: life, key: anniv_365 }
  - id: weekend
    trigger: tick
    when: { weekday: [0, 6], sleeping: false, hour_from: 9, hour_to: 20 }
    once_per_day: true
    rate_per_hour: 0.6
    do:
      - { op: say, kind: soft, group: life, key: weekend }
  - id: greet_morning
    trigger: tick
    when: { sleeping: false, hour_from: 6, hour_to: 9 }
    once_per_day: true
    rate_per_hour: 1.5
    do:
      - { op: say, kind: soft, group: life, key: greet_morning }
  - id: goodnight
    trigger: tick
    when: { sleeping: false, hour_from: 21, hour_to: 23 }
    once_per_day: true
    rate_per_hour: 1.5
    do:
      - { op: say, kind: soft, group: life, key: goodnight }
  - id: lunch
    trigger: tick
    when: { sleeping: false, hour_from: 11.5, hour_to: 13 }
    once_per_day: true
    rate_per_hour: 1.5
    do:
      - { op: say, kind: soft, group: life, key: lunch }
  - id: feeling_low
    trigger: tick
    when: { sleeping: false, min_frailty: 0.6 }
    once_per_day: true
    rate_per_hour: 1.5
    do:
      - { op: say, kind: soft, group: life, key: feeling_low }
      - { op: mood, delta: -0.02 }
  - id: rain
    trigger: tick
    when: { sleeping: false, hour_from: 7, hour_to: 22 }
    once_per_day: true
    rate_per_hour: 0.03
    do:
      - { op: say, kind: soft, group: life, key: rain }
  - id: power_cut
    trigger: tick
    when: { sleeping: false, hour_from: 18, hour_to: 23 }
    once_per_day: true
    rate_per_hour: 0.015
    do:
      - { op: say, kind: soft, group: life, key: power_cut }
      - { op: need, need: company, delta: 0.1 }
  - id: package
    trigger: tick
    when: { sleeping: false, hour_from: 9, hour_to: 19 }
    once_per_day: true
    rate_per_hour: 0.04
    do:
      - { op: say, kind: soft, group: life, key: package }
  - id: neighbor
    trigger: tick
    when: { sleeping: false, hour_from: 9, hour_to: 20 }
    once_per_day: true
    rate_per_hour: 0.03
    do:
      - { op: say, kind: soft, group: life, key: neighbor }
      - { op: mood, delta: 0.03 }
  - id: old_song
    trigger: tick
    when: { sleeping: false, hour_from: 17, hour_to: 22 }
    once_per_day: true
    rate_per_hour: 0.03
    do:
      - { op: say, kind: soft, group: life, key: old_song }
      - { op: mood, delta: 0.03 }
  - id: old_photo
    trigger: tick
    when: { sleeping: false, hour_from: 10, hour_to: 21 }
    once_per_day: true
    rate_per_hour: 0.02
    do:
      - { op: say, kind: soft, group: life, key: old_photo }
`;

  /* 以下由 content.js 的数据生成 */
  const C = CY.content;
  const dump = o => jsyaml.dump(o, { lineWidth: -1, noRefs: true, skipInvalid: true });

  /* AI 接入：人设规则和技能清单。引擎只允许 AI 做这里列出的事，输出必须符合 output 的限制。 */
  const aiPersona = {
    version: 1,
    system: '你在为一个照顾类桌面小游戏写角色台词。你只写角色的话，不扮演任何真实存在或已故的具体的人，不给医疗建议，不评价玩家，不说教。中文，口语，短句。只输出 JSON。',
    forbidden_patterns: ['我是真的', '我就是你', '去世', '遗言', '诊断', '处方', '吃[0-9]+(毫克|片)', '你应该看医生'],
  };
  const aiSkills = {
    speak: {
      version: 1, id: 'speak', purpose: '在角色用一句话回应当下情境时，替代库里的固定句子',
      inputs: ['persona.name', 'persona.role', 'persona.voice', 'persona.temper', 'persona.catchphrases', 'state.mood', 'state.frailty', 'state.top_need', 'situation'],
      prompt: '根据输入，用角色的口吻说一句话。situation 是当前情境。保持和 catchphrases 相近的语气。',
      output: { text: { type: 'string', max: 40 } },
    },
    adapt: {
      version: 1, id: 'adapt', purpose: '根据近期互动提出对角色性格参数的小幅调整建议',
      inputs: ['persona.name', 'persona.voice', 'learn', 'recent_counts'],
      prompt: '根据 learn 和 recent_counts，给出 needy 的调整量。',
      output: { needy_delta: { type: 'number', min: -0.05, max: 0.05 } },
    },
  };

  const CV = 3;   /* 内容文件的版本，内置内容更新了就加一，数据文件夹里旧版本的会被覆盖，旧的留在 _backup */
  const HEAD = {
    voice: '# 这种声线的角色默认会说的话。角色自己的 person.yaml 里 lines 写了同名项时，以角色自己的为准。\n',
    sayings: '# 可挑选的“说过的话”。游戏偶尔会问你：某某会对你说哪句。你选了哪句就记哪句的编号和原文。\n',
    asks: '# 问答库。每个问题有三个预设回答，游戏里另有一个自己写的回答。voice、stage、pronoun 限制谁会问这个问题，sensitive 为 true 的需要在设置里打开。\n',
    nudges: '# 偶尔出现的现实提醒，轻轻鼓励你联系现实里的人。\n',
    traits: '# 性格的台词。每个性格有路过 glance，道谢 thanks，闲谈 ambient，需求 request，回答之后的回应 reply。和声线里的台词混在一起选。\n',
    conds: '# 疾病的台词和事件文字，覆盖到疾病模板上。这个语言没有写的，用疾病模板里的写法。\n',
  };

  /* 角色卡：每种典型角色一张，plain YAML，一个文件。游戏创建角色时按卡来，后端也按同样的字段读。
     health.score 是健康度，1 是完全健康；class 是这类人的紧迫、自理、哭闹；self_actions 是自己能做的动作；
     prefs 是爱待在哪些房间（rooms 是权重）和爱不爱动（restless，0 到 1，越大越爱换地方）；
     help 是主动帮忙：proactive 为真就会隔一阵自己动手照顾别人，efficiency 是效果比例，interval 是间隔的现实秒数范围；
     dialogue 是对话：voice 指向声线，lines 里写的话优先于声线。 */
  const CARD_V = 2;
  /* 各类角色在各个房间的喜好权重，卡里的 prefs.rooms 写了就以卡为准。需求会另外把人推向厨房、卧室这些地方 */
  const PREFS = {
    elder: { living: 3, yard: 2, kitchen: 1.5 }, adult: { living: 3, kitchen: 1.5, yard: 1, study: 0.6 }, teen: { bedroom: 3, living: 1.5, study: 1.5, kitchen: 0.6 },
    child: { living: 3, yard: 2, kitchen: 1, bedroom: 0.8 }, toddler: { living: 4, yard: 1, kitchen: 0.6 },
    cat: { living: 3, bedroom: 2, kitchen: 1, yard: 1, study: 0.5 }, dog: { living: 3, yard: 3, kitchen: 1 },
    rabbit: { living: 3, yard: 1.5 }, guineapig: { living: 3, yard: 1 }, ferret: { living: 3, bedroom: 1 }, hedgehog: { living: 2, yard: 2 }, duck: { yard: 3, living: 1 }, chicken: { yard: 4, living: 0.5 },
  };
  const RESTLESS = { elder: 0.35, adult: 0.6, teen: 0.5, child: 0.9, toddler: 0.9, cat: 0.5, dog: 0.9 };
  const SCORE = { infant: 0.85, toddler: 0.9, child: 0.95, teen: 0.95, adult: 0.9, elder: 0.65 };
  const HELPERS = ['mom', 'dad', 'wife', 'husband', 'woman25', 'man25'];
  const CARD_EXTRA = {
    elder: { health: { score: 0.6 }, lines: { request: { thirst: ['……有点渴，倒杯水吧。'], rest: ['我坐一会儿，不碍事。'] }, thanks: { default: ['好，好，难为你了。'] } } },
    child12: { help: { proactive: true, efficiency: 0.3, interval: [50, 80] }, lines: { request: { hunger: ['{title}，我饿了，有吃的吗？'] }, thanks: { default: ['嗯！我也可以帮你。'] } } },
    toddler1: { lines: { request: { hunger: ['啊——啊——'] } } },
    toddler2: { lines: { request: { hunger: ['饿饿。'] } } },
    toddler3: { lines: { request: { hunger: ['{title}，我饿了。'] } } },
    toddler4: { lines: { request: { hunger: ['{title}，我要吃饭，我自己吃。'] } } },
    woman25: { lines: { thanks: { default: ['谢啦。'] } } },
    popo: { health: { score: 0.6 } },
  };
  let cardCache = null;
  const cardFiles = () => {
    if (cardCache) return cardCache;
    const cls = jsyaml.load(F['templates/classes.yaml']).classes, out = {};
    for (const a of C.archetypes) {
      const human = a.species === 'human', stage = human ? C.stageOf(a.age) : a.species;
      const spy = F[`templates/species/${a.species}.yaml`], sp = spy ? jsyaml.load(spy) : { actions: {} };
      const selfActs = Object.keys(sp.actions || {}).filter(k => { const x = sp.actions[k]; return x.self && (x.self === true || x.self.includes(stage)); });
      const ex = CARD_EXTRA[a.id] || {};
      const card = { version: CARD_V, id: a.id, label: a.role, group: a.group, species: a.species };
      if (human) { card.age = a.age; card.stage = stage; }
      Object.assign(card, { pronoun: a.pronoun, voice: a.voice, look: a.look, traits: [],
        health: Object.assign({ score: human ? SCORE[stage] : 0.9, mood: 0.6, conditions: [] }, ex.health),
        class: Object.assign({}, cls[stage]), need_rate: {}, self_actions: selfActs,
        help: Object.assign({ proactive: HELPERS.includes(a.id), efficiency: 0.5, interval: [40, 70] }, ex.help),
        prefs: Object.assign({ rooms: PREFS[stage] || PREFS.adult, restless: RESTLESS[stage] || 0.6 }, ex.prefs),
        dialogue: { voice: a.voice, lines: ex.lines || {} } });
      out[`templates/cards/${a.id}.yaml`] = '# 角色卡：一类典型角色的全部设定。改了以后，新建的这一类角色按新的来。' + String.fromCharCode(10) + jsyaml.dump(card, { lineWidth: -1, noRefs: true, skipInvalid: true, flowLevel: 3 });
    }
    return (cardCache = out);
  };

  CY.seed = {
    PREFS, cardFiles,
    /* 内容包：台词、说话库、问答库、提醒库、疾病文字，按语言放在 templates/content/语言 下 */
    contentFiles(lang) {
      const P = C.packFor(lang), L = `templates/content/${lang}/`, out = {};
      for (const v in P.voices) out[`${L}voices/${v}.yaml`] = HEAD.voice + dump(Object.assign({ version: CV, id: v }, P.voices[v]));
      out[`${L}library/sayings.yaml`] = HEAD.sayings + dump({ version: CV, items: P.sayings });
      out[`${L}library/asks.yaml`] = HEAD.asks + dump({ version: CV, items: P.asks });
      out[`${L}library/nudges.yaml`] = HEAD.nudges + dump({ version: CV, items: P.nudges });
      if (P.conds && Object.keys(P.conds).length) out[`${L}conditions.yaml`] = HEAD.conds + dump(Object.assign({ version: CV }, P.conds));
      if (P.traits && Object.keys(P.traits).length) out[`${L}traits.yaml`] = HEAD.traits + dump(Object.assign({ version: CV }, P.traits));
      return out;
    },
    files() {
      const out = Object.assign({}, F, this.contentFiles(CY.i18n.lang), cardFiles());
      out['templates/ai/persona.yaml'] = '# AI 接入时共用的规则。引擎会用 forbidden_patterns 过滤 AI 的输出。\n' + dump(aiPersona);
      for (const k in aiSkills) out[`templates/ai/skills/${k}.yaml`] = '# AI 只能做这一件事，输入输出都受限。\n' + dump(aiSkills[k]);
      out['settings.ini'] = CY.ini.stringify({});
      out['world.yaml'] = 'version: 1\ngame_minutes: 0\nlast_seen: ""\n';
      out['README.txt'] = '这是 Care for You 的数据文件夹。里面全是明文文件，可以用记事本打开、修改、复制、备份。\n' +
        'settings.ini 是参数。people 里每个角色一个文件夹。templates 是物种、疾病、类别、性格特征、物品和 AI 技能，templates/content 下按语言放着台词、说话库、问答库和提醒库。\n' +
        'people/角色/sayings.yaml 里每句话同时记着库编号 lib 和原文 text。\n' +
        '_backup 里是被覆盖前的旧版本。改坏了可以从那里取回，或者删掉对应文件让程序重新生成。\n';
      return out;
    },
  };
})(globalThis.CY = globalThis.CY || {});
