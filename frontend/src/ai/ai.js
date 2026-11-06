/* AI 接入层。设计原则：AI 只是一个“被问话的写手”，不是游戏的操作者。
   - 默认关闭。关闭时不发任何网络请求。
   - 引擎先从游戏数据里按技能的 inputs 白名单挑出一小包上下文，AI 看不到其他文件。
   - AI 只能返回技能 output 里声明的字段，类型、长度、范围都由引擎校验，越界就丢弃。
   - 文字再过一遍 forbidden_patterns，命中就丢弃，回退到库里的固定句子。
   - 每小时调用次数有上限，失败静默回退，游戏不依赖 AI 才能玩。
   技能和人设规则是 templates/ai 下的明文文件，可以自己改。 */
(function (CY) {
  const { ini } = CY;
  const A = CY.ai = { calls: [], providers: {}, last: null };

  /* 提供者：只需要实现 chat(messages, cfg) 返回字符串。换服务只改这里。 */
  A.providers.openai_compat = {
    async chat(messages, cfg) {
      const url = String(ini.get(cfg, 'ai', 'base_url')).replace(/\/+$/, '') + '/chat/completions';
      const headers = { 'Content-Type': 'application/json' };
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ model: ini.get(cfg, 'ai', 'model'), messages, temperature: 0.8, max_tokens: 200 }) });
      if (!r.ok) throw new Error('AI 服务返回 ' + r.status);
      const j = await r.json();
      return j.choices[0].message.content;
    },
  };
  A.providers.mock = { async chat() { return A.mockReply; } };
  A.mockReply = '{"text":"你今天辛苦了。"}';

  A.enabled = cfg => ini.bool(cfg, 'ai', 'enabled') && ini.get(cfg, 'ai', 'provider') !== 'none' && !!A.providers[ini.get(cfg, 'ai', 'provider')];

  /* 从游戏数据里按白名单取上下文。路径形如 state.mood。 */
  function buildContext(skill, full) {
    const out = {};
    for (const path of skill.inputs || []) {
      const [a, b] = path.split('.');
      if (b === undefined) { if (full[a] !== undefined) out[a] = full[a]; continue; }
      if (full[a] && full[a][b] !== undefined) (out[a] = out[a] || {})[b] = full[a][b];
    }
    return out;
  }

  function validate(output, spec, patterns) {
    let j;
    try { j = JSON.parse(String(output).replace(/^```(?:json)?|```$/g, '').trim()); } catch (e) { return null; }
    const res = {};
    for (const k in spec) {
      const s = spec[k], v = j[k];
      if (s.type === 'string') {
        if (typeof v !== 'string' || !v.trim() || v.length > (s.max || 60)) return null;
        if ((patterns || []).some(p => new RegExp(p).test(v))) return null;
        res[k] = v.trim();
      } else if (s.type === 'number') {
        if (typeof v !== 'number' || !isFinite(v)) return null;
        res[k] = Math.min(s.max, Math.max(s.min, v));
      } else return null;
    }
    return res;
  }

  /* 返回校验过的结果，或 null。调用方负责回退。 */
  A.run = async function (skillId, full, tpl) {
    const cfg = CY.game.cfg;
    if (!A.enabled(cfg)) return null;
    const skill = tpl.skills[skillId], persona = tpl.persona;
    if (!skill || !persona) return null;
    const now = Date.now();
    A.calls = A.calls.filter(t => now - t < 3600000);
    if (A.calls.length >= ini.num(cfg, 'ai', 'max_calls_per_hour')) return null;
    const ctx = buildContext(skill, full);
    if (!ini.bool(cfg, 'ai', 'share_replies')) delete ctx.recent_replies;
    A.calls.push(now);
    try {
      const text = await A.providers[ini.get(cfg, 'ai', 'provider')].chat([
        { role: 'system', content: persona.system + '\n' + skill.prompt + '\n输出 JSON，字段：' + JSON.stringify(skill.output) },
        { role: 'user', content: JSON.stringify(ctx) },
      ], cfg);
      A.last = { skill: skillId, ctx, text };
      return validate(text, skill.output, persona.forbidden_patterns);
    } catch (e) { console.warn('AI 调用失败，已回退', e.message); return null; }
  };
  A.validate = validate;
  A.buildContext = buildContext;
})(globalThis.CY = globalThis.CY || {});
