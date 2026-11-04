/* settings.ini 的读写。扁平键值，分节，分号开头是注释。 */
(function (CY) {
  /* 节，键，默认值，说明 */
  const SCHEMA = [
    ['interrupt', 'countdown_seconds', '25', '提醒和问答的倒计时秒数，到时没赶上，能自理的自己处理，没有惩罚'],
    ['time', 'mode', 'standard', 'standard 标准模式，现实 1 秒是游戏 1 分钟，现实 24 分钟是游戏一天，适合挂机；fast 加速，倍数见 fast_speed，赚钱仍按标准模式算，不随加速增加'],
    ['time', 'fast_speed', '2', '加速模式是标准模式的几倍，2，4 或 6'],
    ['time', 'daynight', 'auto', 'auto 用游戏内时钟；system 一律跟随系统时钟；game 一律用游戏内时钟'],
    ['play', 'backend_provider', 'builtin', 'builtin 是内置后端，规则和台词都在数据文件夹的明文 YAML 里；lm 是内置的数值积分后端，在浏览器里直接积分需求，心情，虚弱度，模型在 templates/lm，实验阶段；http 是把状态发给一个远程后端'],
    ['play', 'condition_models', 'true', '为 true 时，得了病的角色，其疾病部分由浏览器里的积分引擎按 templates/lm/models 里的疾病模型计算，并在状态窗口里显示读数；没有疾病模型的角色不受影响。关掉就退回纯概率表'],
    ['play', 'backend_url', '', '远程后端的地址，只在 backend_provider 为 http 时用。发出去的只有状态快照，不含名字'],
    ['play', 'backend_timeout', '4000', '远程后端的超时，毫秒'],
    ['play', 'backend_send_names', 'false', '为 true 时，发给远程后端的快照里带角色的名字。默认不带'],
    ['play', 'needs_source', 'builtin', 'builtin 是游戏自己算需求的增长；backend 是需求完全由后端用 need_set 指令给，比如接入你自己的 ODE，游戏不再自己涨'],
    ['play', 'api_bridge', 'false', '为 true 时，页面响应 postMessage 的 care.getState 和 care.apply，让外部程序读取每个人的需求和状态，也能写入。默认关闭'],
    ['economy', 'work_hours', '09:00-18:00', '每天的工作时段，按昼夜时钟算'],
    ['ui', 'scene', 'auto', '房间背景：auto 白天客厅夜里卧室；living 客厅；bedroom 卧室；kitchen 厨房；lawn 草坪；balcony 阳台；none 纯色'],
    ['ui', 'house_view', 'rooms', '家里怎么看：rooms 每个区域一页的小场景；house 整座房子一张大图'],
    ['ui', 'clock_12h', 'false', '为 true 时界面上的时刻用十二小时制，默认二十四小时制'],
    ['ui', 'theme', 'auto', 'auto 跟随系统；light 浅色；dark 深色'],
    ['ui', 'background', 'warm', '背景色调：warm 暖米；mint 薄荷；sky 天青；rose 玫瑰；gray 中性灰'],
    ['ui', 'language', 'auto', 'auto 跟随浏览器；zh-CN 简体中文；en English'],
    ['ui', 'figure', 'sprite', '人物的造型：sprite 方块小人，Kenney 素材渲染的斜视图；dressed 穿衣小豆，上半肤色下半衣服；plain 素色小豆，整只衣服色；dumpling 团子，没有手脚'],
    ['interaction', 'picks', 'true', '偶尔问你某个角色会说哪句话'],
    ['interaction', 'sensitive_topics', 'false', '是否出现较私密或带文化压力的话题，例如身体不适、催婚，默认关闭'],
    ['interaction', 'learn', 'true', '根据你的回应逐步适应每个角色的打扰频率和话题'],
    ['audio', 'music_volume', '50', '背景音乐音量，0 到 100，0 是关掉。现场合成的安静音乐，夜里更低更慢。浏览器要求先点一下页面才会出声'],
    ['audio', 'mute', 'false', '为 true 时音乐和音效全部静音，不改两个音量的值'],
    ['audio', 'sfx_volume', '50', '音效音量，0 到 100，0 是关掉。点按、有人开口、完成打勾、发生了事情时的轻响'],
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

  /* 已经取消的设置，旧文件里留着的也丢掉 */
  const REMOVED = { interrupt: ['mode', 'answer_seconds', 'quiet_hours'], time: ['offline_cap_hours'], player: ['name', 'title'], play: ['fall_scale', 'economy', 'auto_return'], economy: ['wage', 'nanny_daily'], interaction: ['click_instead_of_hold', 'hold_scale', 'nudges'], audio: ['sfx', 'music', 'volume'], ui: ['avatar_style', 'hide_when_fullscreen'], privacy: ['upload'] };
  const dropRemoved = out => { for (const s in REMOVED) if (out[s]) { for (const k of REMOVED[s]) delete out[s][k]; if (!Object.keys(out[s]).length && !SCHEMA.some(x => x[0] === s)) delete out[s]; } return out; };

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
    return dropRemoved(out);
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
