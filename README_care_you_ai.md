# Care for You

手停一停，照看一下家里人。工作的时候，他们会不定时叫你一声。没有分数，也没有惩罚。

Pause for a moment and look after the people at home. They call for you now and then while you work. No scores, no penalties.

## 当前状态

原型 0.42，纯网页，默认不需要后端，没有构建步骤。动作动画预览在 media_ai 文件夹。

![猫](media_ai/cat_pet.gif) ![爷爷喝水](media_ai/grandpa_water.gif) ![幼儿玩球](media_ai/toddler_play.gif) ![兔子](media_ai/rabbit_play.gif) ![浇花](media_ai/flower_water.gif)

- 时间只有一条，流速可调，默认 24 倍，现实一小时过游戏里一整天，四档 1、6、24、60，点房间右下角的时间切换；游戏里几点在设置的游戏时钟里调，新档开局对齐系统时间；离开期间世界暂停，回来接着走；动作只有长按，没有倒计时压力，没有惩罚
- 每个角色是一个小行动者：按自己的喜好和当下的需求在家里慢慢换房间，饿了去厨房，困了去卧室，饭点一起吃饭，大人会走过去照顾最需要的人，同一个房间的人会聊天、玩、逗宠物。鼠标悬停或点选一个人，他就停住
- 你默认是一个看不见的成年人，也可以选一个角色做主角，老人主角手慢，孩子也可以照顾别人，主角也能照顾自己
- 每类典型角色是一张明文 YAML 角色卡：年龄、外观、声线、健康度、自理、需求速率、爱去的房间、主动帮忙、对话。典型老人，1 到 4 岁孩子，12 岁孩子，25 岁男女，妻子，婆婆，全部原型都有卡，加一张卡就多一种角色
- 年龄是数字，婴儿幼儿儿童少年成人老人各不相同，婴儿没人管会一直哭，老人和孩子能自己动手做一部分，做了就记下来
- 夜里会睡觉，睡着不打扰；每个角色有状态面板和最多两个性格特征
- 二十几种人，十几种动物，几种花草，十多种疾病，原创动作动画
- 八种语言，界面和对话都有：简体中文，繁體中文，English，Français，日本語，한국어，Español，Deutsch
- 数据全部是明文 YAML 和 settings.ini，AI 接口默认关闭，存档下载、运行包下载、存档导入

## 后端

游戏本体不写死谁说话、发生什么、需求怎么涨，只把每个角色的状态快照发出去，把回来的指令执行掉。有三个后端，用同一份接口，在设置的高级设置里改 backend_provider 和 backend_url 就能换：

- 内置后端：默认，在浏览器里跑，规则和台词是数据文件夹里的明文 YAML，不需要任何服务进程。
- 基础后端：backend_basic_ai，标准库，一阶线性需求，换掉 step() 就是自己的模型。
- LM 后端：backend_lm_ai，把需求、心情、虚弱度当作 Life Matters 风格的六个模型来积分，一个 human 类按年龄阶段、疾病派生到每个角色，说明见 backend_lm_ai/README_lm_backend_ai.md。

远程后端先握手，声明自己只管积分还是什么都管；不管的部分游戏交给内置后端，两边合起来用。远程不通自动退回内置。完整接口在 README_backend_protocol_ai.md：请求与回应、指令表、快照字段、跨域与超时、分工规则、写自己后端的清单。

页面内也有接口：CY.api.state()、apply()、cards()、onTick()；页面外打开 api_bridge 后用 postMessage。

## 运行

双击前端文件夹里的 index.html 就能玩，不需要启动任何服务。建议用桌面版 Chrome 或 Edge，选择数据文件夹和浮动小窗只有这两个浏览器支持。
只有“下载本地运行包”需要从网址打开页面，因为它要读取程序文件。
基础后端和 LM 后端是可选的独立进程，用 python 直接运行各自文件夹里的 server.py，见各自的说明。

## 试玩技巧

- 地址后加 ?freq=test 会让打断变得很频繁，仅用于试玩，不会写入设置。
- 齿轮里或 settings.ini 里可以改打断频率、倒计时、工作时段等，改了立刻生效。
- 地址后加 ?onboard=0 可以跳过引导页。

## 测试与仿真

```
node tests/logic_test.js
node tests/sim_eval.js 3 120 family
python backend_lm_ai/test_lm_backend.py
python frontend/tests/backend_compare.py 1 3
```

CARE_BACKEND_URL 设成某个后端的地址，logic_test 会对它走一遍真实往返，sim_eval 会改用它并统计请求次数和耗时，CARE_SEED 固定随机种子。backend_compare.py 把内置、基础、LM 三个后端放在同一个种子下比较服务耗时和仿真指标。

logic_test 覆盖载入、创建角色、角色卡、行动者走动、帮忙与互动、时间、问答、打断、动作、存档、多语言完整性、AI 校验。sim_eval 让一家人在虚拟时钟里过几天，玩家按注意力策略去照顾，输出急需占比、哭闹时长、被打扰次数、换房间次数，并检查数值不变量。界面部分没有自动测试。

## 目录

- frontend/index.html、css：页面
- frontend/src/core：游戏本体，game、clock、time、directives、household（主角、外出、帮忙、互动）、store、ini、i18n、archive
- frontend/src/backend：协议、内置后端、远程传输、页面内接口
- frontend/src/world：地点与房间、行动者走动、斜视画法、头像、场景
- frontend/src/data：初始数据与角色卡、对话内容
- frontend/src/ui：界面
- frontend/locales：界面语言包，一个语言一个文件；content_开头的是对话内容包
- frontend/tests：逻辑测试、仿真评估，avatar_sheet.html 看全部角色形象
- backend_basic_ai：基础后端，最小可用的远程后端
- backend_lm_ai：轻量 LM 后端，models 是六个 YAML 模型，classes.yaml 是类的派生
- media_ai：动作动画预览
- frontend/vendor：js-yaml
- android：预留，暂时搁置

## 数据与隐私

记忆只写在本机，不上传。内容是明文，选择文件夹时请确认它不会被同步到别人能看到的地方。

## 许可证与联系

MIT，见 LICENSE。意见与问题：shenfan19@gmail.com，或在 GitHub 仓库提 issue。

## 同类的小游戏

喜欢这类安静的照看游戏的话，下面这些也值得去玩。链接只是方便找到，各自的内容与授权以原页面为准。

- [Mama](https://gg.deals/game/mama-1/)：叙事冒险，女儿照顾患痴呆症的母亲。
- [The Cost of Care](https://octopun.itch.io/the-cost-of-care)：第一人称，照顾开始痴呆的母亲，同时做家务。
- [She Was 98](https://playpile.gg/games/she-was-98)：和一位老太太相处的一个安静的下午。
- [Granny's Home](https://robto.itch.io/grannys-home)：帮奶奶在搬家前整理东西。
- [Forgotten, Not Lost](https://store.steampowered.com/app/457490)：作者照顾痴呆亲人的亲身经历改成的短篇视觉小说。
- [Spiritfarer](https://en.wikipedia.org/wiki/Spiritfarer)：在船上照顾灵魂，温和的经营加告别的故事。
- [Neko Atsume](https://en.wikipedia.org/wiki/Neko_Atsume)：布置院子，等猫来做客。
- [Weyrdlets](https://weyrdworks.itch.io/weyrdlets)：桌面宠物，陪你工作。

这份名单来自 2026 年 10 月的一次英文检索，不完整。欢迎补充。
