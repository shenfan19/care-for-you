/* 多语言。界面文字全部通过 CY.t(key, vars) 取，语言包在 locales 下，缺的键回退到中文。
   数据里的标签，比如需求名和动作名，写在模板 YAML 里，中文以 YAML 为准，其他语言用语言包里同名键覆盖，没有就回退到 YAML 的写法。
   台词、说话库、问答库这类内容是内容包，换语言就是换 templates 里对应的文件。 */
(function (CY) {
  const I = CY.i18n = { lang: 'zh-CN', fallback: 'zh-CN', packs: {}, names: { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', en: 'English', fr: 'Français', ja: '日本語', ko: '한국어', es: 'Español', de: 'Deutsch' } };
  I.register = (lang, dict) => { I.packs[lang] = Object.assign(I.packs[lang] || {}, dict); };
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
