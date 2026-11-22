# Changelog

## Unreleased

### 中文

- 网站部署时由 Cloudflare 运行 `node tools/predeploy.js`，自动把卡片和配置的 YAML 打包成页面读取的脚本，检查不通过就不部署。
- 打包配置时把换行统一成 LF，Windows 和 Linux 上打出的脚本完全一致。

### English

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
