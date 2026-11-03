/* 多语言。界面文字全部通过 CY.t(key, vars) 取，语言包在 locales 下，缺的键回退到中文。
   数据里的标签，比如需求名和动作名，写在模板 YAML 里，中文以 YAML 为准，其他语言用语言包里同名键覆盖，没有就回退到 YAML 的写法。
   台词、说话库、问答库这类内容是内容包，换语言就是换 templates 里对应的文件。 */
(function (CY) {
  const I = CY.i18n = { lang: 'zh-CN', fallback: 'zh-CN', packs: {}, names: { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', en: 'English', fr: 'Français', ja: '日本語', ko: '한국어', es: 'Español', de: 'Deutsch' } };
  I.register = (lang, dict) => { I.packs[lang] = Object.assign(I.packs[lang] || {}, dict); };
  /* 访客卡片的译文包：每张卡一行 [名字, 时代, 纪念品, 临别一句, 暗示一, 暗示二, 满足时], 到来和离开的句子用语言自己的模板拼出来，个别卡用第八项 o 覆盖。
     模板里 {n} 是名字，{s} 是纪念品，{q} 是临别一句。纪念品和名字放在冒号后面，各语言不用处理冠词和格 */
  I.cards = (lang, tpl, rows) => {
    const d = {};
    for (const id in rows) {
      const r = rows[id], o = r[7] || {}, k = x => `visitor.${id}.${x}`;
      d[k('name')] = r[0]; d[k('era')] = r[1]; d[k('souvenir')] = r[2]; d[k('hint.0')] = r[4]; d[k('hint.1')] = r[5]; d[k('ok_line')] = r[6];
      d[k('arrive_note')] = o.arrive || tpl.arrive.replace(/\{n\}/g, r[0]);
      d[k('leave_ok')] = o.ok || tpl.ok.replace(/\{n\}/g, r[0]).replace('{s}', r[2]).replace('{q}', r[3]);
      d[k('leave_miss')] = o.miss || tpl.miss.replace(/\{n\}/g, r[0]);
      d[k('wrong_late')] = o.late || '';
    }
    I.register(lang, d);
  };
  /* 来客自己的话：每人一两句名言，接在需求暗示后面，编号从 2 开始 */
  I.said = (lang, rows) => {
    const d = {};
    for (const id in rows) rows[id].forEach((x, i) => { d[`visitor.${id}.hint.${2 + i}`] = x; });
    I.register(lang, d);
  };
  /* 来客向主角提的问题的译文：键是卡片编号，或者行业加序号（如 med.0）；每条 [问，回答一，回答二，来客的回应] */
  I.asks = (lang, rows) => {
    const d = {};
    for (const key in rows) {
      const b = key.includes('.') ? `visit.ask.${key}` : `visitor.${key}.ask`;
      ['say', 'a0', 'a1', 'reply'].forEach((k, i) => { d[`${b}.${k}`] = rows[key][i]; });
    }
    I.register(lang, d);
  };
  I.detect = pref => {
    if (pref && pref !== 'auto' && I.packs[pref]) return pref;
    const low = (typeof navigator !== 'undefined' && navigator.language || 'zh-CN').toLowerCase();
    if (low.startsWith('zh')) return /tw|hk|mo|hant/.test(low) && I.packs['zh-TW'] ? 'zh-TW' : 'zh-CN';
    const base = low.split('-')[0];
    if (I.packs[base]) return base;
    return I.packs.en ? 'en' : I.fallback;
  };
  I.set = lang => {
    I.lang = I.packs[lang] ? lang : I.fallback;
    if (typeof document !== 'undefined') document.documentElement.lang = I.lang;
  };
  const fill = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (m, n) => (n in v ? v[n] : m)) : s);
  /* 回退顺序：中文各版回退到简体中文，其余语言先回退到英文再回退到简体中文 */
  const chainOf = lang => (lang.startsWith('zh') ? [lang, 'zh-CN'] : [lang, 'en', 'zh-CN']);
  CY.t = (k, v) => {
    for (const l of chainOf(I.lang)) { const s = (I.packs[l] || {})[k]; if (s !== undefined) return fill(s, v); }
    return k;
  };
  /* 数据标签：当前语言包里有就用，没有就用数据自带的写法。中文以数据里的为准 */
  CY.tOr = (k, fb) => {
    const chain = I.lang === 'zh-CN' ? ['zh-CN'] : I.lang.startsWith('zh') ? [I.lang] : [I.lang, 'en'];
    for (const l of chain) { const s = (I.packs[l] || {})[k]; if (s !== undefined) return s; }
    return fb;
  };
  I.has = k => chainOf(I.lang).some(l => k in (I.packs[l] || {}));
  I.hasOwn = k => k in (I.packs[I.lang] || {});
  /* 把页面里带 data-i18n、data-i18n-title、data-i18n-ph 的元素翻译一遍 */
  I.applyDom = (root) => {
    root.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = CY.t(e.dataset.i18n); });
    root.querySelectorAll('[data-i18n-title]').forEach(e => { e.title = CY.t(e.dataset.i18nTitle); });
    root.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = CY.t(e.dataset.i18nPh); });
  };
})(globalThis.CY = globalThis.CY || {});
