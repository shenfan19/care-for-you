# Care for You

一个需要你照看的人，不定时出现在你的桌面上，打断你的工作。你以为是你在照顾他们，其实他们也一直在照顾你。没有分数。

## 当前状态

原型 v0.4，纯网页，没有后端，没有构建步骤。动作动画预览在 media_ai 文件夹。

![猫](media_ai/cat_pet.gif) ![爷爷喝水](media_ai/grandpa_water.gif) ![宝宝玩球](media_ai/baby_play.gif) ![狗](media_ai/dog_walk.gif)

- 一页式主页：房间里是角色，下面是发生的事和说过的话，设置在右上角齿轮，另有存档与下载、关于
- 第一次进来有引导页，三个推荐组合，或从十四种人和三种动物里选，外观可调并有预览
- 点角色出环形菜单，长按动作，长按时有进度环，每种动作有自己的动画
- 回答问题直接是四个选项，三个预设加一个自己写的，倒计时默认二十秒
- 问答按角色的身份、年龄和称呼筛选，较私密的话题默认关闭
- 顶栏显示已陪伴的时间和现在几点，昼夜可跟随系统时钟或用游戏内时钟
- 页面明暗和五种背景色调，简体中文和英文界面
- 存档下载、本地运行包下载、存档导入，设置里可删除全部本地数据
- 关于页面含隐私与免责，账号功能预留接口，目前没有服务器
- 浮出小窗：整个房间搬进置顶小窗，仍可操作
- 打断设置：保留、倒计时自动处理、倒计时自动消除，静音时段，间隔跟随时间模式
- 每个角色的节奏学习，偶尔的现实提醒，偶尔问你某个角色会说哪句话
- AI 接口层：任意兼容 /chat/completions 的服务，技能清单、上下文白名单、输出校验、调用上限，默认关闭
- 数据全部是明文 YAML 和 settings.ini，可选择真实文件夹，也可用浏览器内部存储

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
- prototype/src：meta、i18n、ini、store、archive、content、seed、ai、account、game、avatar、ui_room、ui_home、main
- prototype/locales：语言包，一个语言一个文件
- prototype/tests：逻辑测试，avatar_sheet.html 看全部角色形象，gif_stage.html 用来取动画帧
- media_ai：动作动画预览
- prototype/vendor：js-yaml
- android：预留，暂时搁置

## 数据与隐私

记忆只写在本机，不上传。内容是明文，选择文件夹时请确认它不会被同步到别人能看到的地方。
