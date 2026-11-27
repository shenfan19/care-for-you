# Changelog

## Unreleased

### 中文

- 标语下面多了一行小字，显示您是第几位来照顾家人的人。数字来自作者自建的匿名计数服务，不发送存档，也不发送任何能识别你的编号；服务连不上时这一行不显示。关于里的数据与隐私同步改写，九种语言都有。
- 加入俄语界面：设置、开局、商店、日历、结算和关于都有俄语，角色名称也有俄语；台词和来客暂时显示英文。
- 网站部署时由 Cloudflare 运行 `node tools/predeploy.js`，自动把卡片和配置的 YAML 打包成页面读取的脚本，检查不通过就不部署。
- 打包配置时把换行统一成 LF，Windows 和 Linux 上打出的脚本完全一致。

### English

- A small line under the tagline now says which person you are to come and look after the family. The number comes from the author’s own anonymous counting service; no save and no identifier are sent, and the line is hidden when the service cannot be reached. Data and privacy in About explains this in all nine languages.
- Added a Russian interface: settings, the opening, the shop, the calendar, the day summary and About are in Russian, and so are the character names; dialogue and visitors show in English for now.
- Cloudflare now runs `node tools/predeploy.js` when it deploys the site: it packs the card and config YAML into the scripts the page loads and stops the deployment if a check fails.
- Config packing normalizes line endings to LF, so Windows and Linux produce the same scripts.

## 0.73.2, 2026-11-19

### 中文

- 游戏顶栏、浏览器标签页和分享图统一显示英文名 Care for You。
- 简中、繁中、日文和韩文的「关于」与 README 导读收录中文副名「宜室宜家」。
- 作者页使用 The Past Is Yet to Come 的正式英文名和游戏官网链接。

### English

- Use Care for You as the single title in the game header, browser tab and share cards across all languages.
- Show 宜室宜家 in About and the Simplified Chinese, Traditional Chinese, Japanese and Korean README guides.
- The author page links to the current website for The Past Is Yet to Come under its full English title.
