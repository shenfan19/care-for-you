# Care for You

一个需要你照看的人，不定时出现在你的桌面上，打断你的工作。你以为是你在照顾他们，其实他们也一直在照顾你。没有分数。

## 当前状态

原型 v0.5，纯网页，没有后端，没有构建步骤。动作动画预览在 media_ai 文件夹。

![猫](media_ai/cat_pet.gif) ![爷爷喝水](media_ai/grandpa_water.gif) ![幼儿玩球](media_ai/toddler_play.gif) ![兔子](media_ai/rabbit_play.gif) ![浇花](media_ai/flower_water.gif)

核心是照顾的代价：你居家办公，家里还有人要照顾，每次照顾都从别处挤出来。

- 两种代价：长按占用你现实里的时间，点击花掉游戏里的时间
- 完整体验：工作时段赚钱，照顾要用食材、药品、尿布、玩具，可以请保姆，保姆在场效果会打折
- 轻量体验：只有长按，没有钱
- 年龄是数字，婴儿幼儿儿童少年成人老人各不相同，动作按阶段和种类限定，婴儿没人管会一直哭，老人能自己照顾自己一阵
- 十八种人，八种宠物，三种花草，六种基础疾病
- 一页式主页，点角色出环形菜单，每种动作有动画
- 回答问题直接是四个选项，三个预设加一个自己写的，倒计时默认二十秒
- 形象默认简洁抽象，可切换细致画法，页面明暗、背景、语言、压缩比例都在顶栏或设置里
- 存档下载、本地运行包下载、存档导入，关于页面含隐私与免责
- 数据全部是明文 YAML 和 settings.ini，AI 接口默认关闭，账号只预留

## 运行

双击 start_web.cmd，或运行 start_web.sh，然后打开 http://localhost:8765/index.html。
需要用桌面版 Chrome 或 Edge，选择数据文件夹和浮动小窗才可用。直接双击 index.html 也能玩，但这两项不可用。

## 试玩技巧

- 地址后加 ?freq=test 会让打断变得很频繁，加 &quiet= 可以关掉静音时段，仅用于试玩，不会写入设置。
- 齿轮里或 settings.ini 里可以改 frequency、倒计时、时间模式。
- 地址后加 ?onboard=0 可以跳过引导页。

## 测试

```
node tests/logic_test.js
```

覆盖载入、创建角色、时间显示、问答筛选与记录、打断、动作、挑话、节奏学习、存档导出与导入、多语言完整性、运行包清单、AI 校验和手改容错。界面部分没有自动测试。

## 目录

- prototype/index.html、style.css：页面
- prototype/src：meta、i18n、ini、store、archive、content、content_more、seed、ai、account、game、avatar、ui_room、ui_home、main
- prototype/locales：语言包，一个语言一个文件
- prototype/tests：逻辑测试，avatar_sheet.html 看全部角色形象，gif_stage.html 用来取动画帧
- media_ai：动作动画预览
- prototype/vendor：js-yaml
- android：预留，暂时搁置

## 数据与隐私

记忆只写在本机，不上传。内容是明文，选择文件夹时请确认它不会被同步到别人能看到的地方。
