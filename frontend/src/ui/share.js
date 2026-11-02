/* 分享卡片：玩家自己点开，选想放的数字，在本机用画布画成一张图，保存或交给系统分享。
   不联网，不带链接，不上传，默认不含名字。游戏里没有任何地方推荐或奖励分享。 */
(function (CY) {
  const G = CY.game, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;

  const FIELDS = ['time', 'care', 'talk', 'back', 'names'];
  const choice = { time: true, care: true, talk: true, back: true, names: true };

  /* 从记录里数出来，不另存 */
  U.shareStats = function () {
    let care = 0, back = 0, talk = 0;
    for (const p of G.people) {
      care += p.story.care_total || 0;
      back += p.story.cares_back_total || 0;
      for (const mk in G.journal[p.id] || {}) talk += G.journal[p.id][mk].filter(e => e.type === 'talk').length;
    }
    const c = G.clock();
    const time = c.d > 0 ? t('clock.dh', { d: c.d, h: c.h }) : c.h > 0 ? t('clock.hm', { h: c.h, m: c.m }) : t('clock.m', { m: c.m });
    return { care, back, talk, time, names: G.people.filter(p => !p.person.archived).map(p => p.person.name) };
  };

  function lines(st, pick) {
    const out = [];
    if (pick.time) out.push(t('share.line_time', { t: st.time }));
    if (pick.care) out.push(t('share.line_care', { n: st.care }));
    if (pick.talk) out.push(t('share.line_talk', { n: st.talk }));
    if (pick.back) out.push(t('share.line_back', { n: st.back }));
    return out;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  U.drawShareCard = function (canvas, st, pick) {
    const css = getComputedStyle(document.documentElement), v = k => css.getPropertyValue(k).trim() || '#888';
    const W = 1080, H = 1350, ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    ctx.fillStyle = v('--bg'); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = v('--card'); roundRect(ctx, 70, 70, W - 140, H - 140, 36); ctx.fill();
    ctx.fillStyle = v('--accent'); roundRect(ctx, 130, 150, 90, 10, 5); ctx.fill();
    const font = 'system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = v('--mute'); ctx.font = `34px ${font}`; ctx.fillText('Care for You', 130, 220);
    const ls = lines(st, pick);
    ctx.fillStyle = v('--ink'); ctx.font = `bold 62px ${font}`;
    let y = 420;
    /* 太长就缩小字号，保证放得下 */
    for (const l of ls) {
      let size = 62; ctx.font = `bold ${size}px ${font}`;
      while (ctx.measureText(l).width > W - 260 && size > 30) { size -= 2; ctx.font = `bold ${size}px ${font}`; }
      ctx.fillText(l, 130, y); y += 130;
    }
    if (pick.names && st.names.length) {
      ctx.fillStyle = v('--mute'); ctx.font = `38px ${font}`;
      const s = st.names.join(t('sep.list')); let size = 38;
      while (ctx.measureText(s).width > W - 260 && size > 22) { size -= 2; ctx.font = `${size}px ${font}`; }
      ctx.fillText(s, 130, H - 250);
    }
    ctx.fillStyle = v('--mute'); ctx.font = `30px ${font}`;
    ctx.fillText(t('share.foot'), 130, H - 150);
  };

  /* 每日结算的分享卡：日期，三到五句话，纪念品；存档被改过的会标一句。画在本机，不联网 */
  U.drawDayCard = function (canvas, rec) {
    const css = getComputedStyle(document.documentElement), v = k => css.getPropertyValue(k).trim() || '#888';
    const W = 1080, H = 1350, ctx = canvas.getContext('2d'), font = 'system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    canvas.width = W; canvas.height = H;
    ctx.fillStyle = v('--bg'); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = v('--card'); roundRect(ctx, 70, 70, W - 140, H - 140, 36); ctx.fill();
    ctx.fillStyle = v('--accent'); roundRect(ctx, 130, 150, 90, 10, 5); ctx.fill();
    ctx.textBaseline = 'alphabetic'; ctx.fillStyle = v('--mute'); ctx.font = `34px ${font}`; ctx.fillText('Care for You', 130, 220);
    const d = G.dateOf(rec.n);
    ctx.fillStyle = v('--ink'); ctx.font = `bold 64px ${font}`; ctx.fillText(t('cal.md', { m: d.month, d: d.day }) + ' ' + t(['cal.wd0', 'cal.wd1', 'cal.wd2', 'cal.wd3', 'cal.wd4', 'cal.wd5', 'cal.wd6'][d.weekday]), 130, 330);
    ctx.font = `44px ${font}`;
    let y = 440;
    const wrap = (text, maxW) => { const out = []; let line = ''; for (const ch of Array.from(text)) { if (ctx.measureText(line + ch).width > maxW) { out.push(line); line = ch; } else line += ch; } if (line) out.push(line); return out; };
    for (const l of rec.lines) for (const row of wrap(G.settleText(l), W - 260)) { if (y > H - 300) break; ctx.fillText(row, 130, y); y += 70; }
    ctx.fillStyle = v('--mute'); ctx.font = `30px ${font}`;
    if (G.world.edited) ctx.fillText(t('share.edited'), 130, H - 200);
    ctx.fillText(t('share.foot'), 130, H - 150);
  };
  U.shareDayCard = function (rec) {
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('share.title'))}</h2>
      <div style="text-align:center"><canvas id="shareCv" style="width:min(300px,70vw);height:auto;border-radius:10px;border:1px solid var(--line)"></canvas></div>
      <div id="shReg"></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="shClose">${esc(t('btn.close'))}</button>${navigator.canShare ? `<button id="shSend">${esc(t('share.send'))}</button>` : ''}<button id="shSave" class="primary">${esc(t('share.save'))}</button></div>`, true);
    const cv = dlg.querySelector('#shareCv'); U.drawDayCard(cv, rec);
    const toBlob = () => new Promise(res => cv.toBlob(res, 'image/png'));
    dlg.querySelector('#shClose').onclick = () => (U.afterShareClose ? U.afterShareClose(rec) : U.closeDialog());
    dlg.querySelector('#shSave').onclick = async () => { const b = await toBlob(), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'care-for-you-day.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); if (U.softRegister) U.softRegister(dlg.querySelector('#shReg')); };
    const send = dlg.querySelector('#shSend');
    if (send) send.onclick = async () => { const b = await toBlob(), f = new File([b], 'care-for-you-day.png', { type: 'image/png' }); try { if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); } catch (e) { /* 取消就算了 */ } if (U.softRegister) U.softRegister(dlg.querySelector('#shReg')); };
  };

  U.shareDialog = function () {
    const st = U.shareStats();
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('share.title'))}</h2><div class="mute">${esc(t('share.note'))}</div>
      <div class="chips" style="margin:10px 0">${FIELDS.map(k => `<label class="chip"><input type="checkbox" data-f="${k}" ${choice[k] ? 'checked' : ''}> ${esc(t('share.f_' + k))}</label>`).join('')}</div>
      <div style="text-align:center"><canvas id="shareCv" style="width:min(300px,70vw);height:auto;border-radius:10px;border:1px solid var(--line)"></canvas></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="shClose">${esc(t('btn.close'))}</button>${navigator.canShare ? `<button id="shSend">${esc(t('share.send'))}</button>` : ''}<button id="shSave" class="primary">${esc(t('share.save'))}</button></div>`, true);
    const cv = dlg.querySelector('#shareCv');
    const redraw = () => U.drawShareCard(cv, st, choice);
    dlg.querySelectorAll('[data-f]').forEach(c => c.onchange = () => { choice[c.dataset.f] = c.checked; redraw(); });
    redraw();
    const toBlob = () => new Promise(res => cv.toBlob(res, 'image/png'));
    dlg.querySelector('#shClose').onclick = U.closeDialog;
    dlg.querySelector('#shSave').onclick = async () => {
      const b = await toBlob(), a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'care-for-you-card.png'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };
    const send = dlg.querySelector('#shSend');
    if (send) send.onclick = async () => {
      const b = await toBlob(), f = new File([b], 'care-for-you-card.png', { type: 'image/png' });
      try { if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); } catch (e) { /* 玩家取消就算了 */ }
    };
  };
})(globalThis.CY = globalThis.CY || {});
