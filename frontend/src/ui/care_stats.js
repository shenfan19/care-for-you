/* 照顾统计：玩家能看到的版本。读贡献统计模块（G.ledger）的数据，不改任何游戏状态。
   某个人的两张饼图：ta 照顾了谁，谁照顾了 ta，嵌在人物状态面板里。
   「自己」是自己照顾自己，也算一块。来客不是家里人，不进统计。数据来自 G.ledger，模块关着时没有记录，界面直接说没有。
   面向玩家，文字走语言包（stats.*）；开发者面板里另有一份内部版本，见 ledger_ui.js。 */
(function (CY) {
  const G = CY.game, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;
  const view = { who: '', range: 'week', mode: 'pie' };

  const rangeOf = rng => {
    const n = G.gameDate().n;
    return { today: [n, n], yesterday: [n - 1, n - 1], week: [n - 6, n], all: [undefined, undefined] }[rng];
  };
  const nameOf = (sum, id) => (id === 'you' ? t('player.name') : G.ledger.nameOf(sum, id));

  /* 一张饼：slices 是 [标签, 次数, 角色主色] 的列表。一块占满时画整圆，免得弧线退化 */
  const pie = (slices, label, cls) => {
    const total = slices.reduce((a, s) => a + s[1], 0), R = 56, C = 64;
    if (!total) return `<div class="spie ${cls || ''}"><div class="mute">${esc(t('stats.none'))}</div></div>`;
    let ang = -Math.PI / 2, paths = '';
    slices.forEach(([name, n, color]) => {
      const col = esc(color), frac = n / total, tip = `<title>${esc(name)} ${esc(t('stats.times', { n }))}</title>`;
      if (frac >= 0.9999) { paths += `<circle cx="${C}" cy="${C}" r="${R}" fill="${col}">${tip}</circle>`; return; }
      const a2 = ang + frac * 2 * Math.PI, x1 = C + R * Math.cos(ang), y1 = C + R * Math.sin(ang), x2 = C + R * Math.cos(a2), y2 = C + R * Math.sin(a2);
      paths += `<path d="M${C} ${C} L${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z" fill="${col}" stroke="var(--card)" stroke-width="1.5">${tip}</path>`;
      ang = a2;
    });
    const legend = slices.map(([name, n, color]) => `<div class="sleg"><i style="background:${esc(color)}"></i><span>${esc(name)}</span><b>${esc(t('stats.times', { n }))}</b><span class="mute">${Math.round(n / total * 100)}%</span></div>`).join('');
    return `<div class="spie ${cls || ''}"><svg viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="${esc(label)}">${paths}</svg><div>${legend}</div></div>`;
  };

  /* 一个人的两组数：他照顾了谁，谁照顾了他，来自同一份汇总 */
  const slicesOf = (sum, who) => {
    const pick = (side, other) => Object.entries(sum.acts).filter(([k]) => k.split('>')[side] === who).map(([k, c]) => { const x = k.split('>')[other]; return [x === who ? t('stats.self') : nameOf(sum, x), c.n, CY.avatarColor(G.get(x))]; }).sort((a, b) => b[1] - a[1]);
    return { given: pick(0, 1), got: pick(1, 0) };
  };
  /* 分享卡用：某个人在某个时间范围里照顾了谁，谁照顾了他，名字已经翻成当前语言 */
  U.careSlices = (pid, rng) => { const sum = G.ledger && G.ledger.enabled() ? G.ledger.sum(...rangeOf(rng || 'all')) : { acts: {}, names: {} }; return slicesOf(sum, pid); };
  /* 嵌在人物状态面板里的两张饼图，带时间范围。模块关着或者没有这个人就什么也不画 */
  U.careStatsInline = function (pid) {
    const me = G.get(pid); if (!me || !G.ledger || !G.ledger.enabled()) return '';
    const sum = G.ledger.sum(...rangeOf(view.range)), sl = slicesOf(sum, pid);
    const chip = (val, label) => `<button class="chip ${view.range === val ? 'on' : ''}" data-ir="${val}">${esc(label)}</button>`;
    return `<h3>${esc(t('stats.open'))}</h3><div class="chips" style="margin-bottom:4px">${chip('today', t('stats.today'))}${chip('week', t('stats.week'))}${chip('all', t('stats.all'))}</div>
      <div class="spair"><div><div class="mute">${esc(t('stats.given', { name: me.person.name }))}</div>${pie(sl.given, t('stats.given', { name: me.person.name }), 'v')}</div>
      <div><div class="mute">${esc(t('stats.received', { name: me.person.name }))}</div>${pie(sl.got, t('stats.received', { name: me.person.name }), 'v')}</div></div>`;
  };
  U.careStatsInlineWire = function (dlg, pid) {
    dlg.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => { view.range = b.dataset.ir; U.statusDialog(pid); });
  };
})(globalThis.CY = globalThis.CY || {});
