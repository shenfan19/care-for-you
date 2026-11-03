/* 结算页与日历。午夜时世界停住，读完翻页再接着走；日历里每一天都能翻回去看。 */
(function (CY) {
  const G = CY.game, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;

  const WD = ['cal.wd0', 'cal.wd1', 'cal.wd2', 'cal.wd3', 'cal.wd4', 'cal.wd5', 'cal.wd6'];
  const dateLine = n => { const d = G.dateOf(n); return t('cal.md', { m: d.month, d: d.day }) + ' ' + t(WD[d.weekday]); };
  const body = rec => rec.lines.map(l => `<p class="settle-line">${esc(G.settleText(l))}</p>`).join('') + (rec.money ? `<p class="mute">${esc(t('settle.money', { n: rec.money }))}</p>` : '');

  U.settleDialog = rec => {
    G.holdTick = true;
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(dateLine(rec.n))}</h2>${body(rec)}
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="stCal">${esc(t('settle.calendar'))}</button>${U.shareDayCard ? `<button id="stShare">${esc(t('settle.share'))}</button>` : ''}<button id="stGo" class="primary">${esc(t('settle.next'))}</button></div>`);
    const done = () => { G.holdTick = false; G.lastTick = Date.now(); U.closeDialog(); };
    dlg.querySelector('#stGo').onclick = done;
    dlg.querySelector('#stCal').onclick = () => U.calendarDialog(rec.n, done);
    const sh = dlg.querySelector('#stShare'); if (sh) sh.onclick = () => U.shareDayCard(rec);
    $modalClose(done);
  };
  /* 点遮罩也算翻页 */
  const $modalClose = done => { const m = document.getElementById('modal'); m.onclick = e => { if (e.target === m) done(); }; };

  U.calendarDialog = (focus, back) => {
    const days = G.cal.days, first = days.length ? days[0].n : G.gameDate().n, last = Math.max(G.gameDate().n, days.length ? days[days.length - 1].n : 0);
    let sel = focus || (days.length ? days[days.length - 1].n : null);
    const f = G.dateOf(sel || last);
    let ym = { y: +f.iso.slice(0, 4), m: f.month };
    const draw = () => {
      const recs = new Map(days.map(r => [r.iso, r])), n0 = new Date(ym.y, ym.m - 1, 1), dim = new Date(ym.y, ym.m, 0).getDate(), pad = n0.getDay();
      let cells = '';
      for (let i = 0; i < pad; i++) cells += '<span></span>';
      for (let d = 1; d <= dim; d++) {
        const iso = ym.y + '-' + String(ym.m).padStart(2, '0') + '-' + String(d).padStart(2, '0'), r = recs.get(iso);
        cells += r ? `<button class="calday ${r.n === sel ? 'on' : ''}" data-n="${r.n}">${d}</button>` : `<span class="calday off">${d}</span>`;
      }
      const rec = sel && G.dayRecord(sel);
      const wd = [0, 1, 2, 3, 4, 5, 6].map(i => `<span class="mute">${esc(t(WD[i]))}</span>`).join('');
      const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('cal.title'))}</h2>
        <div class="timeset">${U.timeSettingsHtml()}</div>
        <div class="row" style="justify-content:space-between"><button id="cPrev" aria-label="${esc(t('cal.prev'))}">‹</button><strong>${esc(t('cal.ym', { y: ym.y, m: ym.m }))}</strong><button id="cNext" aria-label="${esc(t('cal.next'))}">›</button></div>
        <div class="calgrid">${wd}${cells}</div>
        <div class="calbody">${days.length ? (rec ? `<h3>${esc(dateLine(rec.n))}</h3>${body(rec)}` : `<p class="mute">${esc(t('cal.empty'))}</p>`) : `<p class="mute">${esc(t('cal.none'))}</p>`}</div>
        <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="cClose" class="primary">${esc(t('cal.close'))}</button></div>`, true);
      U.wireTimeSettings(dlg, draw);
      dlg.querySelector('#cPrev').onclick = () => { ym = ym.m === 1 ? { y: ym.y - 1, m: 12 } : { y: ym.y, m: ym.m - 1 }; draw(); };
      dlg.querySelector('#cNext').onclick = () => { ym = ym.m === 12 ? { y: ym.y + 1, m: 1 } : { y: ym.y, m: ym.m + 1 }; draw(); };
      dlg.querySelectorAll('.calday[data-n]').forEach(b => b.onclick = () => { sel = +b.dataset.n; draw(); });
      dlg.querySelector('#cClose').onclick = () => { if (back) back(); else U.closeDialog(); };
      const m = document.getElementById('modal'); m.onclick = e => { if (e.target === m) { if (back) back(); else U.closeDialog(); } };
    };
    draw();
  };

  /* 午夜：世界停住，先显示这一天 */
  G.dayEndHooks.push(info => { if (!info.offline && G.lastSettled && typeof document !== 'undefined') U.settleDialog(G.lastSettled); });
  /* 回来时若追算了几天，打开日历停在最新一天 */
  U.afterStart = () => { if (G.lastCatchUp > 0) U.calendarDialog(); };
})(globalThis.CY = globalThis.CY || {});
