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
  const fmtC = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');   /* 游戏里的几点 */
  const view = { who: '', more: 40, quiet: false, tab: 'events', cwho: '', off: {} };
  const SERIES_COLORS = ['#c8794a', '#4f9bb3', '#7aa05a', '#b36ab0', '#d1a23b', '#6f7fc4', '#c4566b', '#4aa08a', '#8a7a66', '#e0864f'];
  const QUIET_HIDES = ['event', 'self'];

  /* ---------- 发生的事 ---------- */
  function entries() {
    const out = [];
    for (const pid in G.journal) for (const mk in G.journal[pid]) G.journal[pid][mk].forEach(e => out.push({ pid: pid === 'you' ? G.youId() : pid, e }));   /* 旧存档里记在"你"名下的事，归到操纵对象身上 */
    return out.sort((a, b) => (a.e.t < b.e.t ? 1 : -1));
  }
  const nameOf = pid => (G.get(pid) ? G.get(pid).person.name : pid === 'you' ? t('player.name') : pid);
  /* ---------- 状态曲线：和发生的事并列的一个标签，现在只在开发者模式里看得到 ----------
     二级是人，三级是这个人的每一条曲线，需求，心情，虚弱度，点一下开关。横轴是游戏时间，纵轴 0 到 1 */
  const curvesOn = () => !!G.DEVTOOLS;
  function renderCurves(root) {
    const people = G.people.filter(p => p.person.active !== false);
    if (!people.some(p => p.id === view.cwho)) view.cwho = people.length ? people[0].id : '';
    const p = G.get(view.cwho), h = (p && G.hist[p.id]) || [];
    const keys = p ? Object.keys(G.needsOf(p)).concat(['mood', 'frailty']) : [];
    const label = k => (k === 'mood' || k === 'frailty' ? t('curves.' + k) : CY.tOr('need.' + k, (G.needsOf(p)[k] || {}).label || k));
    const pchips = people.map(q => `<button class="chip ${view.cwho === q.id ? 'on' : ''}" data-cw="${q.id}">${esc(q.person.name)}</button>`).join('');
    const schips = keys.map((k, i) => `<button class="chip ${view.off[k] ? '' : 'on'}" data-ck="${k}" style="${view.off[k] ? '' : 'border-color:' + SERIES_COLORS[i % SERIES_COLORS.length]}"><span style="color:${SERIES_COLORS[i % SERIES_COLORS.length]}">●</span> ${esc(label(k))}</button>`).join('');
    let svg = '';
    if (h.length < 2) svg = `<div class="mute" style="margin:10px 0">${esc(t('curves.empty'))}</div>`;
    else {
      const W = 720, H = 220, L = 30, R = 8, T = 8, B = 22, t0 = h[0].t, t1 = h[h.length - 1].t, X = x => L + (W - L - R) * (x - t0) / Math.max(1, t1 - t0), Y = v => T + (H - T - B) * (1 - Math.max(0, Math.min(1, v)));
      let g = '';
      for (let v = 0; v <= 1.001; v += 0.25) g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="currentColor" opacity=".12"/><text x="${L - 4}" y="${Y(v) + 3}" font-size="9" text-anchor="end" fill="currentColor" opacity=".5">${v.toFixed(2)}</text>`;
      const clk = m => { const dm = ((m + (typeof G.world.clock_shift === 'number' ? G.world.clock_shift : 0)) % 1440 + 1440) % 1440; return String(Math.floor(dm / 60)).padStart(2, '0') + ':' + String(Math.floor(dm % 60)).padStart(2, '0'); };
      for (let i = 0; i <= 4; i++) { const m = t0 + (t1 - t0) * i / 4; g += `<text x="${X(m)}" y="${H - 6}" font-size="9" text-anchor="${i === 4 ? 'end' : i === 0 ? 'start' : 'middle'}" fill="currentColor" opacity=".55">${clk(m)}</text>`; }
      const lines = keys.map((k, i) => {
        if (view.off[k]) return '';
        const pts = h.map(e => [X(e.t), Y(k === 'mood' || k === 'frailty' ? e[k] : e.needs[k])]).filter(q => !isNaN(q[1]));
        return pts.length > 1 ? `<polyline fill="none" stroke="${SERIES_COLORS[i % SERIES_COLORS.length]}" stroke-width="1.6" points="${pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ')}"/>` : '';
      }).join('');
      svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;margin-top:8px;color:var(--ink)">${g}${lines}</svg>`;
    }
    return `<div class="chips" style="margin-top:8px">${pchips}</div><div class="chips" style="margin-top:6px">${schips}</div>${svg}`;
  }
  U.renderFeed = function (force) {
    const all = entries(), list = all.filter(x => (!view.who || x.pid === view.who) && !(view.quiet && QUIET_HIDES.includes(x.e.type)));
    const sig = view.tab + view.cwho + JSON.stringify(view.off) + Object.values(G.hist).map(h => h.length).join() + view.who + view.more + view.quiet + all.length + I.lang + G.people.map(p => p.id + p.person.name + p.story.care_total).join();
    const root = $('feed');
    if (!force && root.dataset.sig === sig) return;
    root.dataset.sig = sig;
    const chips = [`<button class="chip ${view.who ? '' : 'on'}" data-w="">${esc(t('feed.all'))}</button>`].concat(G.people.map(p => `<button class="chip ${view.who === p.id ? 'on' : ''}" data-w="${p.id}">${esc(p.person.name)}</button>`)).join('');
    const stat = view.who && G.get(view.who) ? (() => {
      const p = G.get(view.who), n = ty => all.filter(x => x.pid === p.id && x.e.type === ty).length;
      return `<div class="mute stat">${esc(t('feed.stat', { care: p.story.care_total, talk: n('talk'), missed: n('missed') }))}${p.story.revealed ? esc(t('feed.stat_back', { name: p.person.name, n: p.story.cares_back_total })) : ''}</div>`;
    })() : '';
    if (!curvesOn()) view.tab = 'events';
    const tabs = curvesOn() ? `<div class="chips tabs" style="margin-bottom:8px"><button class="chip ${view.tab === 'events' ? 'on' : ''}" data-tab="events">${esc(t('feed.title'))}</button><button class="chip ${view.tab === 'curves' ? 'on' : ''}" data-tab="curves">${esc(t('feed.tab_curves'))}</button></div>` : '';
    if (view.tab === 'curves') {
      root.innerHTML = tabs + renderCurves(root);
      root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { view.tab = b.dataset.tab; U.renderFeed(true); });
      root.querySelectorAll('[data-cw]').forEach(b => b.onclick = () => { view.cwho = b.dataset.cw; U.renderFeed(true); });
      root.querySelectorAll('[data-ck]').forEach(b => b.onclick = () => { view.off[b.dataset.ck] = !view.off[b.dataset.ck]; U.renderFeed(true); });
      return;
    }
    root.innerHTML = (curvesOn() ? tabs : `<h2>${esc(t('feed.title'))}</h2>`) + `<div class="chips">${chips}<button class="chip ${view.quiet ? 'on' : ''}" id="quietBtn">${esc(t('feed.quiet'))}</button></div>${stat}` +
      '<div class="tlbox">' + (list.slice(0, view.more).map(x => `<div class="tl"><span class="t">${x.e.cm !== undefined ? fmtC(x.e.cm) : fmtT(x.e.t)}<br>${esc(t('feed.day', { n: x.e.day || '?' }))}</span><span class="who">${esc(nameOf(x.pid))}</span><span class="pill">${esc(typeName(x.e.type))}</span><span class="x">${esc(G.entryText(x.e))}</span></div>`).join('') || `<div class="mute">${esc(t('feed.empty'))}</div>`) +
      (list.length > view.more ? `<div class="row" style="margin-top:8px"><button id="moreBtn">${esc(t('feed.more'))}</button></div>` : '') + '</div>';
    root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { view.tab = b.dataset.tab; U.renderFeed(true); });
    root.querySelectorAll('.chip[data-w]').forEach(b => b.onclick = () => { view.who = b.dataset.w; view.more = 40; U.renderFeed(true); });
    $('quietBtn').onclick = () => { view.quiet = !view.quiet; view.more = 40; U.renderFeed(true); };
    const mb = $('moreBtn'); if (mb) mb.onclick = () => { view.more += 60; U.renderFeed(true); };
  };

})(globalThis.CY = globalThis.CY || {});
