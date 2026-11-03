/* 结算页与日历。午夜时世界停住，读完翻页再接着走；日历里每一天都能翻回去看。 */
(function (CY) {
  const G = CY.game, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;

  const WD = ['cal.wd0', 'cal.wd1', 'cal.wd2', 'cal.wd3', 'cal.wd4', 'cal.wd5', 'cal.wd6'];
  const dateLine = n => { const d = G.dateOf(n); return t('cal.md', { m: d.month, d: d.day }) + ' ' + t(WD[d.weekday]); };
  const body = rec => rec.lines.map(l => `<p class="settle-line">${esc(G.settleText(l))}</p>`).join('') + (rec.money ? `<p class="mute">${esc(t('settle.money', { n: rec.money }))}</p>` : '');

  /* 弹出的提示和对话气泡一样：不挡住游戏，倒计时走完自己消失，没点开的留在日历里。
     鼠标停在上面时暂停倒计时。点一下打开日历，停在对应的那天 */
  U.notice = ({ title, lines, secs = 20, onclick }) => {
    const old = document.getElementById('dayNote'); if (old) old.remove();
    clearTimeout(U._noteT);
    const el = document.createElement('div'); el.id = 'dayNote'; el.className = 'daynote';
    el.innerHTML = `<div class="dn-t">${esc(title)}</div>${lines.map(l => `<p>${esc(l)}</p>`).join('')}<div class="dn-tap mute">${esc(t('cal.tap'))}</div><div class="dn-bar"><i style="animation-duration:${secs}s"></i></div>`;
    document.body.appendChild(el);
    const bar = el.querySelector('i'), end = () => { el.remove(); };
    bar.addEventListener('animationend', end);
    el.onmouseenter = () => { bar.style.animationPlayState = 'paused'; };
    el.onmouseleave = () => { bar.style.animationPlayState = 'running'; };
    el.onclick = () => { end(); if (onclick) onclick(); };
  };
  U.dayNotice = rec => U.notice({ title: dateLine(rec.n), lines: rec.lines.map(l => G.settleText(l)), onclick: () => U.calendarDialog(rec.n) });

  U.calendarDialog = (focus, back) => {
    const days = G.cal.days, first = days.length ? days[0].n : G.gameDate().n, last = Math.max(G.gameDate().n, days.length ? days[days.length - 1].n : 0);
    let sel = focus || (days.length ? days[days.length - 1].n : null);
    if (sel) G.markRead(sel);
    const f = G.dateOf(sel || last);
    let ym = { y: +f.iso.slice(0, 4), m: f.month };
    const draw = () => {
      const recs = new Map(days.map(r => [r.iso, r])), n0 = new Date(ym.y, ym.m - 1, 1), dim = new Date(ym.y, ym.m, 0).getDate(), pad = n0.getDay();
      let cells = '';
      for (let i = 0; i < pad; i++) cells += '<span></span>';
      for (let d = 1; d <= dim; d++) {
        const iso = ym.y + '-' + String(ym.m).padStart(2, '0') + '-' + String(d).padStart(2, '0'), r = recs.get(iso);
        cells += r ? `<button class="calday ${r.n === sel ? 'on' : ''} ${G.unread().includes(r.n) ? 'unread' : ''}" data-n="${r.n}">${d}</button>` : `<span class="calday off">${d}</span>`;
      }
      const rec = sel && G.dayRecord(sel);
      const wd = [0, 1, 2, 3, 4, 5, 6].map(i => `<span class="mute">${esc(t(WD[i]))}</span>`).join('');
      const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('cal.title'))}</h2>
        <div class="timeset">${U.timeSettingsHtml()}</div>
        <div class="row" style="justify-content:space-between"><button id="cPrev" aria-label="${esc(t('cal.prev'))}">‹</button><strong>${esc(t('cal.ym', { y: ym.y, m: ym.m }))}</strong><button id="cNext" aria-label="${esc(t('cal.next'))}">›</button></div>
        <div class="calgrid">${wd}${cells}</div>
        <div class="calbody">${days.length ? (rec ? `<h3>${esc(dateLine(rec.n))}</h3>${body(rec)}${U.shareDayCard ? `<div class="row" style="justify-content:flex-end"><button id="cShare">${esc(t('settle.share'))}</button></div>` : ''}` : `<p class="mute">${esc(t('cal.empty'))}</p>`) : `<p class="mute">${esc(t('cal.none'))}</p>`}</div>
        <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="cClose" class="primary">${esc(t('cal.close'))}</button></div>`, true);
      U.wireTimeSettings(dlg, draw);
      dlg.querySelector('#cPrev').onclick = () => { ym = ym.m === 1 ? { y: ym.y - 1, m: 12 } : { y: ym.y, m: ym.m - 1 }; draw(); };
      dlg.querySelector('#cNext').onclick = () => { ym = ym.m === 12 ? { y: ym.y + 1, m: 1 } : { y: ym.y, m: ym.m + 1 }; draw(); };
      dlg.querySelectorAll('.calday[data-n]').forEach(b => b.onclick = () => { sel = +b.dataset.n; G.markRead(sel); draw(); U.renderClock && U.renderClock(); });
      const sh = dlg.querySelector('#cShare'); if (sh) sh.onclick = () => U.shareDayCard(rec);
      dlg.querySelector('#cClose').onclick = () => { if (back) back(); else U.closeDialog(); };
      const m = document.getElementById('modal'); m.onclick = e => { if (e.target === m) { if (back) back(); else U.closeDialog(); } };
    };
    draw();
  };

  /* 午夜：不停世界，弹一张到时间自己消失的总结 */
  G.dayEndHooks.push(info => { if (!info.offline && G.lastSettled && typeof document !== 'undefined') U.dayNotice(G.lastSettled); if (U.renderClock) U.renderClock(); });
  /* 回来时若追算了几天，打开日历停在最新一天 */
  U.afterStart = () => { if (G.lastCatchUp > 0) U.notice({ title: t('cal.title'), lines: [t('cal.away', { n: G.lastCatchUp })], onclick: () => U.calendarDialog() }); U.renderClock && U.renderClock(); };
})(globalThis.CY = globalThis.CY || {});
