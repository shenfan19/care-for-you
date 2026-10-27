/* 多语言。界面文字全部通过 CY.t(key, vars) 取，语言包在 locales 下，缺的键回退到中文。
   数据里的标签，比如需求名和动作名，写在模板 YAML 里，中文以 YAML 为准，其他语言用语言包里同名键覆盖，没有就回退到 YAML 的写法。
   台词、说话库、问答库这类内容是内容包，换语言就是换 templates 里对应的文件。 */
(function (CY) {
  const I = CY.i18n = { lang: 'zh-CN', fallback: 'zh-CN', packs: {}, names: { 'zh-CN': '简体中文', en: 'English' } };
  I.register = (lang, dict) => { I.packs[lang] = Object.assign(I.packs[lang] || {}, dict); };
  I.detect = pref => {
    if (pref && pref !== 'auto' && I.packs[pref]) return pref;
    const n = (typeof navigator !== 'undefined' && navigator.language || 'zh-CN').toLowerCase();
    return n.startsWith('zh') && I.packs['zh-CN'] ? 'zh-CN' : I.packs.en ? 'en' : I.fallback;
  };
  I.set = lang => {
    I.lang = I.packs[lang] ? lang : I.fallback;
    if (typeof document !== 'undefined') document.documentElement.lang = I.lang;
  };
  const fill = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (m, n) => (n in v ? v[n] : m)) : s);
  CY.t = (k, v) => {
    let s = (I.packs[I.lang] || {})[k];
    if (s === undefined) s = (I.packs[I.fallback] || {})[k];
    return s === undefined ? k : fill(s, v);
  };
  /* 数据标签：当前语言包里有就用，没有就用数据自带的写法 */
  CY.tOr = (k, fb) => { const s = (I.packs[I.lang] || {})[k]; return s === undefined ? fb : s; };
  /* 把页面里带 data-i18n、data-i18n-title、data-i18n-ph 的元素翻译一遍 */
  I.applyDom = (root) => {
    root.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = CY.t(e.dataset.i18n); });
    root.querySelectorAll('[data-i18n-title]').forEach(e => { e.title = CY.t(e.dataset.i18nTitle); });
    root.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = CY.t(e.dataset.i18nPh); });
  };
})(globalThis.CY = globalThis.CY || {});
