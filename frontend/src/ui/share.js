/* 分享卡片：只有日历里选中的某一天能分享，玩家自己点开，在本机用画布画成一张图，保存或交给系统分享。
   没有全局的总数分享：总数会变成成就展示，违背了叙事。不联网，不带链接，不上传。游戏里没有任何地方推荐或奖励分享。 */
(function (CY) {
  const G = CY.game, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

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
})(globalThis.CY = globalThis.CY || {});
