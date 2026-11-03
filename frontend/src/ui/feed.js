/* 发生的事。说过的话仍然记在人物文件夹里，不在页面上单列。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  const TYPES = ['care', 'talk', 'missed', 'cares_back', 'glance', 'event', 'frail', 'recovered', 'reveal', 'picked', 'nudge', 'cry', 'self'];
  const typeName = k => (TYPES.includes(k) ? t('type.' + k) : k);
  U.typeName = typeName;
  const fmtT = ts => { const d = new Date(ts); return t('fmt.datetime', { m: d.getMonth() + 1, d: d.getDate(), hh: String(d.getHours()).padStart(2, '0'), mm: String(d.getMinutes()).padStart(2, '0') }); };
  const view = { who: '', more: 40, quiet: false };
  const QUIET_HIDES = ['event', 'self'];

  /* ---------- 发生的事 ---------- */
  function entries() {
    const out = [];
    for (const pid in G.journal) for (const mk in G.journal[pid]) G.journal[pid][mk].forEach(e => out.push({ pid, e }));
    return out.sort((a, b) => (a.e.t < b.e.t ? 1 : -1));
  }
  const nameOf = pid => (G.get(pid) ? G.get(pid).person.name : pid === 'you' ? t('player.name') : pid);
  U.renderFeed = function (force) {
    const all = entries(), list = all.filter(x => (!view.who || x.pid === view.who) && !(view.quiet && QUIET_HIDES.includes(x.e.type)));
    const sig = view.who + view.more + view.quiet + all.length + I.lang + G.people.map(p => p.id + p.person.name + p.story.care_total).join();
    const root = $('feed');
    if (!force && root.dataset.sig === sig) return;
    root.dataset.sig = sig;
    const chips = [`<button class="chip ${view.who ? '' : 'on'}" data-w="">${esc(t('feed.all'))}</button>`].concat(G.people.map(p => `<button class="chip ${view.who === p.id ? 'on' : ''}" data-w="${p.id}">${esc(p.person.name)}</button>`).concat(Object.keys(G.journal.you || {}).length ? [`<button class="chip ${view.who === 'you' ? 'on' : ''}" data-w="you">${esc(t('player.name'))}</button>`] : [])).join('');
    const stat = view.who && G.get(view.who) ? (() => {
      const p = G.get(view.who), n = ty => all.filter(x => x.pid === p.id && x.e.type === ty).length;
      return `<div class="mute stat">${esc(t('feed.stat', { care: p.story.care_total, talk: n('talk'), missed: n('missed') }))}${p.story.revealed ? esc(t('feed.stat_back', { name: p.person.name, n: p.story.cares_back_total })) : ''}</div>`;
    })() : '';
    root.innerHTML = `<h2>${esc(t('feed.title'))}</h2><div class="chips">${chips}<button class="chip ${view.quiet ? 'on' : ''}" id="quietBtn">${esc(t('feed.quiet'))}</button></div>${stat}` +
      '<div class="tlbox">' + (list.slice(0, view.more).map(x => `<div class="tl"><span class="t">${fmtT(x.e.t)}<br>${esc(t('feed.day', { n: x.e.day || '?' }))}</span><span class="who">${esc(nameOf(x.pid))}</span><span class="pill">${esc(typeName(x.e.type))}</span><span class="x">${esc(G.entryText(x.e))}</span></div>`).join('') || `<div class="mute">${esc(t('feed.empty'))}</div>`) +
      (list.length > view.more ? `<div class="row" style="margin-top:8px"><button id="moreBtn">${esc(t('feed.more'))}</button></div>` : '') + '</div>';
    root.querySelectorAll('.chip[data-w]').forEach(b => b.onclick = () => { view.who = b.dataset.w; view.more = 40; U.renderFeed(true); });
    $('quietBtn').onclick = () => { view.quiet = !view.quiet; view.more = 40; U.renderFeed(true); };
    const mb = $('moreBtn'); if (mb) mb.onclick = () => { view.more += 60; U.renderFeed(true); };
  };

})(globalThis.CY = globalThis.CY || {});
