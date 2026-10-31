# Care for You：后端接口

这份文档是后端接口的权威说明，面向想写自己后端的人。游戏本体只做两件事：把每个角色此刻的状态打包发出去，把回来的指令执行掉。谁说话、发生什么、需求怎么涨，都可以由后端决定。

仓库里有三个后端，用同一份接口：

- 内置后端：在浏览器里用 JS 跑，随游戏一起，规则在数据文件夹的明文 YAML 里，默认使用。代码在 frontend/src/backend 的 local.js 和 local_plan.js。
- 基础后端：backend_basic_ai/server.py，标准库，一阶线性的需求模型，用来演示接口最小要写什么。
- LM 后端：backend_lm_ai，把需求、心情、虚弱度当作 Life Matters 风格的模型状态来积分，说明见 backend_lm_ai/README_lm_backend_ai.md。

## 切换

设置的高级设置折叠区里：

- backend_provider：builtin 或 http。改成 http 以后游戏向 backend_url 发请求，出错自动退回内置，只提示一次。
- backend_url：远程后端的地址，例如 http://127.0.0.1:8787/ 是基础后端，http://127.0.0.1:8788/ 是 LM 后端。
- backend_timeout：单次请求的超时，毫秒，默认 4000。
- backend_send_names：为 true 时快照里带角色的名字，默认不带。
- needs_source：builtin 或 backend。backend 表示全部需求都由后端给，游戏不再自己涨。有 drives 声明时（见下文）不需要设这一项。

切换是即时的：改了设置，下一次请求就走新的后端。远程后端中途掉线，被它驱动的变量立即还给游戏自己算，不会卡住。

## 传输

- 方法与地址：POST 到 backend_url，请求体和回应都是 UTF-8 的 JSON。GET 同一个地址可以返回握手信息，方便手动检查。
- 版本：所有请求和回应都带 "v": 1。回应的 v 不是 1，游戏当作出错处理。
- 跨域：游戏页面从 localhost 或 file:// 打开时是跨域请求，后端要回 Access-Control-Allow-Origin，并响应 OPTIONS 预检。
- 出错：HTTP 状态不是 2xx、超时、不是合法 JSON、v 不对，都算失败，本次退回内置后端的结果。
- 请求频率：游戏每秒推进一次，向远程后端的 drive tick 请求最多每 5 秒一次，攒下的游戏分钟数一并发过去；plan 请求每 20 秒一次（system.yaml 的 plan.interval_seconds）；line 请求在需要台词时发。
- 检查：回来的所有东西都经过游戏的检查，不认识的丢掉，数值压回范围，不存在的角色丢掉，文字限长。后端写错了不会弄坏存档。

## 请求一览

| kind | 什么时候发 | 回应 |
| --- | --- | --- |
| hello | 切到 http 后第一次、换了 backend_url 后、握手失败 30 秒后重试 | 后端是谁，管哪几样 |
| drive，trigger 为 tick | 时间推进，最多每 5 秒一次 | 指令列表，可带 drives |
| drive，trigger 为 action | 玩家刚做了一个动作 | 指令列表 |
| plan | 每 20 秒 | 状态表和策略 |
| line | 需要一句台词 | 一句话，或 null |

### hello

请求：

```json
{ "v": 1, "kind": "hello", "client": { "name": "care-for-you", "version": "0.49.0" } }
```

回应：

```json
{ "v": 1, "name": "care-lm-backend", "version": "0.1.0",
  "handles": { "events": false, "strategies": false, "lines": false } }
```

- handles 声明后端管哪几样，没写的键当作 true，整个 handles 不写（老后端）当作全都管：
  - events：随机事件，比如夜尿起夜、跌倒、住院、出院，对应 drive 请求里除积分以外的指令。为 false 时游戏仍运行内置后端的事件规则，把两边的指令合在一起执行，内置的排前面，远程的排后面。
  - strategies：谁向谁求助、位置愿望，对应 plan 请求。为 false 时游戏不再发 plan 给它，直接用内置后端的。
  - lines：台词，对应 line 请求。为 false 时游戏不发 line 给它。
- 其余字段随意，name 和 version 会被截断到 48 和 24 个字符，仅用于显示。
- 不认识 hello 的老后端按普通请求回一个 {"v":1,"directives":[]} 就行，游戏按“全都管”处理，行为和以前完全一样。
- 握手失败（连不上、回应不合格）时本次用内置，30 秒后再试。

### drive，tick

请求：

```json
{ "v": 1, "kind": "drive", "trigger": "tick", "minutes": 0.0833,
  "world": { }, "people": [ { } ], "expired": [ { "person": "p1", "name": "wc" } ] }
```

- minutes：距离上次 drive tick 过去的游戏分钟数，可以是小数。积分类的后端用它做步长。游戏时间有倍速设置 time.speed，默认 24，所以每 5 秒一次的 tick 大约带 2 分钟，60 倍时约 5 分钟，不要假定它很小。
- world：世界快照，见下。
- people：全体在场角色的快照，见下，不含已归档的。
- expired：刚到期的带时限标记，比如夜里起夜结束了，规则可以据此决定跌倒还是回床。

回应：

```json
{ "v": 1, "directives": [ { "op": "need", "person": "p1", "need": "thirst", "delta": 0.0007 } ],
  "drives": { "p1": ["thirst", "hunger", "rest", "mood", "frailty"] } }
```

- directives：指令列表，见下。
- drives：可选。这次后端替哪些角色算了哪些变量，键是角色编号，值是变量名数组，变量名是需求名，或者 mood，或者 frailty。游戏对声明过的变量不再自己推进（不涨需求，不算心情，不算虚弱度），只执行后端的指令。没声明的变量游戏照旧自己算。每次回应整体替换上一次的声明，所以后端哪次不声明了，变量立刻还给游戏。远程失败时全部还给游戏。

### drive，action

请求：

```json
{ "v": 1, "kind": "drive", "trigger": "action", "world": { }, "minutes": 0,
  "person": { }, "action": { "id": "feed", "label": "喂饭", "min": 25, "effect": { "hunger": -0.9 } } }
```

玩家做了一个动作。回应同 tick，其中的 say 指令如果 kind 为 speech，游戏用作被照顾的人对这次动作的回话。action 触发的回应应当很快，游戏等着它。后端 handles.events 为 false 时，游戏不把 action 发给它，直接用内置的结果。

### plan

请求：

```json
{ "v": 1, "kind": "plan", "world": { }, "minutes": 20, "people": [ { } ],
  "pending": [ { "from": "p1", "to": "p2", "key": "hunger" } ],
  "declined": [ { "from": "p1", "to": "p3", "key": "hunger" } ] }
```

- pending：还在路上的请求，declined：刚被拒绝的请求，后端据此不重复发。key 是需求名或外出动作名。

回应：

```json
{ "v": 1,
  "states": [ { "person": "p1", "needs": { "hunger": 0.4 }, "mood": 0.7, "frailty": 0.1, "want": { "id": "dog_park", "action": "walk" } } ],
  "strategies": [ { "from": "p1", "to": "p2", "kind": "care", "need": "hunger" } ] }
```

- states 每行一个人，needs、mood、frailty 都可省，给了就是新的绝对值；want 是位置愿望，id 是愿望编号，action 是外出动作名。
- strategies 每条是 from 向 to 发的请求，kind 为 care（别人替他做）、self（自己做）、go（去某个地方）；care 和 self 要写 need，go 要写 action。
- 游戏收到后再核一遍：接收者不在、睡着、住院、外出、没有这项能力的，丢掉。
- 需求不是 plan 的主要用途，积分请在 drive tick 里做。

### line

请求：`{ "v": 1, "kind": "line", "person": { }, "group": "events", "key": "discharge", "situation": { }, "world": { } }`

回应：`{ "v": 1, "text": "一句话" }`，没有就回 `"text": null`。游戏先用内置的一句，远程的回来了再换上。

## 指令

drive 回应里的 directives，每条都有 op 和 person，op 只能是下面这些，别的一律丢弃：

| op | 字段 | 作用 | 范围 |
| --- | --- | --- | --- |
| need | need, delta | 需求加一个增量 | delta 在负一到一之间，结果压到零到一 |
| need_set | need, value | 把需求设成一个值 | 零到一 |
| mood | delta | 心情加增量 | 同上 |
| mood_set | value | 设心情 | 零到一 |
| frailty | delta | 虚弱度加增量 | 同上 |
| frailty_set | value | 设虚弱度 | 零到一 |
| flag_set | name, minutes, value?, place?, room?, mode? | 打一个带时限的标记，比如在医院、起夜中、受伤 | minutes 零到 43200；place 是地点编号，带 place 的标记会让这个人出现在那里；mode 为 stand、sleep、cradle |
| flag_clear | name | 去掉标记 | |
| move | room, minutes? | 让这个人走到家里某个房间停一阵 | minutes 零点二到三十 |
| condition_add | id | 给这个人加一种病 | id 必须是已有的病 |
| condition_remove | id | 去掉一种病 | |
| counter | name, delta | 计数加减 | 负一百到一百的整数 |
| seen | name | 记下今天已经触发过，每天只触发一次的规则用 | |
| log | type, text 或 key+args | 往发生的事里记一条 | type 是 care、talk、missed、cares_back、glance、event、frail、recovered、reveal、picked、nudge、cry、self 之一 |
| say | text 或 tkey 或 group+key, kind? | 角色说一句话 | kind 为 soft、speech、cry、reveal、self |

- 积分类的后端请用增量（need，mood，frailty），不要用 need_set 一类的绝对值：请求飞行期间玩家可能刚做了动作，绝对值会把它盖掉，增量不会。
- 快照里的数保留四位小数，游戏内部的值不取整。积分类后端每次推进只有几秒时，单步增量可能比取整误差大不了多少，所以后端应以自己的内部状态为准算增量，不要拿快照值当作自己的状态，除非发现它和你上次回的值差得明显（LM 后端的容差是 0.004）。否则游戏里的值会在阈值附近来回抖动，反复触发叫人。
- 文字类字段限长：text 二百四十个字符，name 二十四个，id 三十二个。

## 快照

### 世界快照 world

| 字段 | 含义 |
| --- | --- |
| v | 1 |
| date | month, day, weekday（零为星期日），iso，day_index（自 1970 年的天数，本地时区） |
| working | 现在是不是工作时段 |
| at_desk | 玩家是不是在书桌前 |
| days_together | 一起生活了多少天 |
| game_minutes | 游戏累计分钟数 |
| day_minutes | 今天已过的分钟数 |
| hour | 钟点，小数，零到二十四 |
| night | 现在是不是夜里 |
| mode | 时间模式，目前恒为 real |
| player | place 和 room，玩家所在的地点和房间 |
| protagonist | 操纵对象的编号，没有为 null |
| params | 自由参数，预留，目前为空对象 |

### 角色快照 person

| 字段 | 含义 |
| --- | --- |
| id | 角色编号，稳定不变 |
| card | 角色卡编号，后端可按它去找卡的全部设定 |
| health | 健康度，一减虚弱度 |
| name | 名字，backend_send_names 关闭时是空字符串 |
| species | 物种编号，human、cat、dog、flower 等 |
| stage | 人是年龄阶段 infant、toddler、child、teen、adult、elder；非人是物种编号 |
| age | 年龄，岁，非人为 null |
| age_band | 更细的年龄档，非人为 null |
| mood | 心情，零到一，一最好，保留四位小数 |
| frailty | 虚弱度，零到一，一最虚弱，保留四位小数 |
| needs | 需求，键是需求名，值零到一，一最急，保留四位小数。不同物种有不同的需求，疾病会加需求 |
| conditions | 病的编号数组 |
| traits | 性格编号数组，最多两个 |
| voice | 声线编号 |
| flags | 带时限的标记，键是标记名，值有 until（游戏分钟）、value、place、room、mode |
| rate_mult | 每个需求的个性化速率倍数，性格的倍数乘角色卡的 need_rate，没有特别的是 1。基础速率不发，后端按年龄阶段和物种自己定 |
| mood_offset | 性格带来的心情偏移 |
| frailty_mult | 性格带来的虚弱度倍数 |
| sleeping | 是不是睡着 |
| protagonist | 是不是操纵对象 |
| abilities | help（能不能帮别人，含 role 和 efficiency，不能为 null），care_needs（别人能替他做的需求），self_needs（他自己能做的需求），go_actions（他能去的外出动作） |
| want | 当前的位置愿望，没有为 null |
| location | place 和 room |
| care_total | 被照顾的累计次数 |
| counters | 计数 |
| seen | 每天只触发一次的规则的记录 |

需求名参考：thirst、hunger、rest、company、play、diaper、hygiene、homework、mobility 是人的；clean 是小动物的；water、sun、fertilize、prune 是花草的；疾病另加 medicine、sugar、bp、joint、fever、breath、reorient 等。后端遇到不认识的需求名，不碰它就行，游戏自己会算。

## 谁算什么：分工与组合

游戏里的每个变量（某人的某个需求、心情、虚弱度）在任何时刻只有一个主人：

- 没有被远程后端声明驱动的，游戏自己算：需求按速率涨，心情向目标松弛，虚弱度按规则升降。
- 被远程后端在 drives 里声明的，后端算，游戏只执行指令。
- 玩家的动作永远直接改游戏里的数。积分类后端每次收到快照时，如果发现某个变量和它上次回的不一样，就是玩家动了它，应当以快照为准重新对表，不需要知道玩家做了什么动作。LM 后端就是这样做的。

事件、策略、台词三样按 hello 的 handles 决定归谁，没人声明的归内置后端。

## 页面内与页面外的接口

除了 HTTP 后端，游戏页面自己也提供读写接口，给在同一页面里或外面的程序用：

- 页面内：CY.api.state() 读全体快照，CY.api.apply(指令列表) 写，CY.api.cards() 读全部角色卡，CY.api.onTick(fn) 每次状态变化收一次。
- 页面外：设置里 api_bridge 改成 true，页面响应 postMessage。发 { type: 'care.getState', id, names } 回 { type: 'care.state', id, state }；发 { type: 'care.apply', id, directives } 回 { type: 'care.applied', id, applied }。默认关闭，没有来源白名单，只在自己的环境里打开。
- 指令和 HTTP 后端用同一套，同样被检查。

## 角色卡

数据文件夹 templates/cards/卡编号.yaml，每类典型角色一张。字段：id，label，group，species，age，stage，pronoun，voice，look，traits，health（score，mood，conditions），class（urgency，self_care，nag，cries），need_rate（需求速率倍数），self_actions，help（proactive，efficiency，interval），dialogue（voice，lines）。快照里的 card 是卡编号。后端可以用 CY.api.cards() 读到全部卡。

## 写一个自己的后端：清单

- 响应 OPTIONS 和 POST，回 JSON，带跨域头。
- 回应里带 "v": 1。
- hello 里声明 handles：只做积分就把三项都设为 false。
- drive tick 里按 minutes 做步长，回增量指令，并在 drives 里声明你负责的变量。
- 对没见过的角色，用快照里的值初始化；对不认识的需求，不碰。
- 角色编号稳定，角色消失（归档、删除）就清掉自己的内部状态。
- 用 python backend_basic_ai/server.py 起基础后端，改它的 step()；或者看 backend_lm_ai 里怎么把模型写成 YAML。
- 验证：CARE_BACKEND_URL=你的地址 node frontend/tests/logic_test.js 会对真实后端走一遍；CARE_BACKEND_URL=你的地址 node frontend/tests/sim_eval.js 1 120 family 让一家人在虚拟时钟里过一天，输出请求次数和往返耗时。
