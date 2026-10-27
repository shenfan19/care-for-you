/* settings.ini 的读写。扁平键值，分节，分号开头是注释。 */
(function (CY) {
  /* 节，键，默认值，说明 */
  const SCHEMA = [
    ['interrupt', 'mode', 'countdown_default', 'keep 一直等到你回应；countdown_default 倒计时到了按角色习惯自动处理；countdown_dismiss 倒计时到了自动消除'],
    ['interrupt', 'frequency', 'normal', 'test 试玩（现实秒）；often 经常；normal 适中；rare 很少。后三档按游戏时间算，所以压缩时间下会更频繁'],
    ['interrupt', 'countdown_seconds', '25', '倒计时秒数'],
    ['interrupt', 'answer_seconds', '20', '问答题的倒计时秒数，到时没回答就当作没赶上，没有惩罚'],
    ['interrupt', 'quiet_hours', '22:00-07:00', '这段现实时间内不打扰，留空表示不设'],
    ['time', 'mode', 'compressed', 'real 与现实同步；compressed 压缩；paused 暂停'],
    ['time', 'daynight', 'auto', 'auto 真实时间跟随系统时钟，压缩时间用游戏内时钟；system 一律跟随系统时钟；game 一律用游戏内时钟'],
    ['time', 'compress_ratio', '30', '压缩时，现实 1 分钟等于游戏多少分钟'],
    ['time', 'offline_cap_hours', '12', '离开期间最多推算多少游戏小时'],
    ['player', 'name', '你', '角色怎么叫你'],
    ['player', 'title', '爸爸', '宝宝怎么称呼你'],
    ['play', 'economy', 'false', 'true 为完整体验：工作赚钱，照顾要用物品，可以请保姆；false 为轻量体验，只有长按'],
    ['economy', 'wage', '40', '工作时间每游戏小时赚多少钱'],
    ['economy', 'work_hours', '09:00-18:00', '每天的工作时段，按昼夜时钟算'],
    ['economy', 'nanny_wage', '12', '保姆在工作时段每游戏小时的费用'],
    ['interaction', 'input', 'hold', 'hold 长按，占用你现实里的时间；click 点一下就开始，花掉游戏里的时间'],
    ['interaction', 'click_instead_of_hold', 'false', '为 true 时，点一下代替长按'],
    ['interaction', 'hold_scale', '1.0', '长按时长倍率，1.5 表示比默认长一半'],
    ['interaction', 'nudges', 'true', '偶尔提醒你联系现实里的人、站起来动一动'],
    ['interaction', 'picks', 'true', '偶尔问你某个角色会说哪句话'],
    ['interaction', 'sensitive_topics', 'false', '是否出现较私密或带文化压力的话题，例如身体不适、催婚，默认关闭'],
    ['interaction', 'learn', 'true', '根据你的回应逐步适应每个角色的打扰频率和话题'],
    ['ui', 'avatar_style', 'simple', 'simple 简洁抽象的形象；detailed 画出五官细节'],
    ['ui', 'wfh_notice', 'true', '是否显示居家办公的提示条'],
    ['ui', 'theme', 'auto', 'auto 跟随系统；light 浅色；dark 深色'],
    ['ui', 'background', 'warm', '背景色调：warm 暖米；mint 薄荷；sky 天青；rose 玫瑰；gray 中性灰'],
    ['ui', 'language', 'auto', 'auto 跟随浏览器；zh-CN 简体中文；en English'],
    ['ui', 'hide_when_fullscreen', 'true', '桌面版使用，全屏程序运行时隐藏'],
    ['privacy', 'upload', 'false', '是否允许上传数据，默认关闭'],
    ['account', 'enabled', 'false', '账号功能，预留。目前没有服务器，保持关闭'],
    ['account', 'server_url', '', '预留，将来账号和云端存档服务的地址'],
    ['ai', 'enabled', 'false', '是否启用 AI 台词。默认关闭，关闭时一个字节也不会发出去'],
    ['ai', 'provider', 'none', 'none 不用；openai_compat 任何兼容 /chat/completions 的服务；mock 测试用'],
    ['ai', 'base_url', 'https://api.openai.com/v1', '服务地址，本地模型填 http://localhost:11434/v1 之类'],
    ['ai', 'model', '', '模型名'],
    ['ai', 'api_key', '', '密钥。注意：这个文件是明文，别把它分享给别人'],
    ['ai', 'autonomy', 'text_only', 'text_only 只改写台词；suggest 另外可以提出性格调整建议，需要你确认；bounded 在很小范围内自动调整'],
    ['ai', 'max_calls_per_hour', '12', '每小时最多调用次数，防止花费失控'],
    ['ai', 'share_replies', 'false', '是否允许把你回答过的话发给 AI 作为上下文'],
  ];

  function parse(text) {
    const out = {};
    let sec = '';
    for (const raw of String(text || '').split(/\r?\n/)) {
      const l = raw.trim();
      if (!l || l[0] === ';' || l[0] === '#') continue;
      if (l[0] === '[') { sec = l.slice(1, l.indexOf(']')).trim(); out[sec] = out[sec] || {}; continue; }
      const i = l.indexOf('=');
      if (i < 0) continue;
      let v = l.slice(i + 1);
      const c = v.search(/\s;/);
      if (c >= 0) v = v.slice(0, c);
      (out[sec] = out[sec] || {})[l.slice(0, i).trim()] = v.trim();
    }
    return out;
  }

  function stringify(cfg) {
    const lines = ['; Care for You 设置。用记事本直接改就行，改完重新载入页面或在设置页点应用。', ''];
    const known = {};
    for (const [s, k, d, note] of SCHEMA) {
      if (!known[s]) { known[s] = new Set(); lines.push('[' + s + ']'); }
      known[s].add(k);
      const v = cfg && cfg[s] && cfg[s][k] !== undefined ? cfg[s][k] : d;
      lines.push(k + ' = ' + v + (note ? '    ; ' + note : ''));
      const next = SCHEMA[SCHEMA.indexOf(SCHEMA.find(x => x[0] === s && x[1] === k)) + 1];
      if (!next || next[0] !== s) {
        for (const kk in (cfg && cfg[s]) || {}) if (!known[s].has(kk)) lines.push(kk + ' = ' + cfg[s][kk]);
        lines.push('');
      }
    }
    for (const s in cfg || {}) if (!known[s]) { lines.push('[' + s + ']'); for (const k in cfg[s]) lines.push(k + ' = ' + cfg[s][k]); lines.push(''); }
    return lines.join('\n');
  }

  function get(cfg, sec, key) {
    const hit = cfg && cfg[sec] && cfg[sec][key];
    if (hit !== undefined) return hit;
    const d = SCHEMA.find(x => x[0] === sec && x[1] === key);
    return d ? d[2] : '';
  }
  const num = (cfg, s, k) => { const v = parseFloat(get(cfg, s, k)); return isNaN(v) ? parseFloat(SCHEMA.find(x => x[0] === s && x[1] === k)[2]) : v; };
  const bool = (cfg, s, k) => String(get(cfg, s, k)).toLowerCase() === 'true';

  CY.ini = { SCHEMA, parse, stringify, get, num, bool };
})(globalThis.CY = globalThis.CY || {});
