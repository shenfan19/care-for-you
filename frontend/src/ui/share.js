/* 分享卡片：日历里选中的某一天，和人物页里的某个人，玩家自己点开，在本机用画布画成一张图，保存或交给系统分享。
   没有全局的总数分享：总数会变成成就展示，违背了叙事。不联网，不上传；图上只有一个地方带链接，就是左上角的游戏网址，
   写信和发推广时靠它回到游戏，网址写在 engine.yaml 的 share.url。游戏里没有任何地方推荐或奖励分享。 */
(function (CY) {
  const G = CY.game, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;
  const FONT = 'system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  const palette = () => { const css = getComputedStyle(document.documentElement); return k => css.getPropertyValue(k).trim() || '#888'; };
  const wrapper = (ctx, text, maxW) => { const out = []; let line = ''; for (const ch of Array.from(text)) { if (ctx.measureText(line + ch).width > maxW) { out.push(line); line = ch; } else line += ch; } if (line) out.push(line); return out; };

  /* 卡片的底：背景，卡片面，左上角一个标题块：亮色的大标题 Care for You，旁边是和页面顶上同一句随机的话，再下面是游戏网址，
     话和网址同用低调的颜色，普通字体，话略大一点。返回标题块的下沿，内容从它下面开始 */
  function frame(canvas, W, H) {
    const v = palette(), ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    ctx.fillStyle = v('--bg'); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = v('--card'); roundRect(ctx, 70, 70, W - 140, H - 140, 36); ctx.fill();
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = v('--accent'); ctx.font = `italic 600 76px Georgia, "Songti SC", "Noto Serif CJK SC", serif`; ctx.fillText('Care for You', 130, 215);
    if (U.tagN === undefined) U.tagN = Math.floor(Math.random() * 6);
    const tag = t('tag.' + (U.tagN + 1)); let size = 32;
    ctx.fillStyle = v('--mute'); ctx.font = `${size}px ${FONT}`;
    while (ctx.measureText(tag).width > W - 260 && size > 20) { size -= 2; ctx.font = `${size}px ${FONT}`; }
    ctx.fillText(tag, 130, 268);
    ctx.fillStyle = v('--mute'); ctx.font = `28px ${FONT}`; ctx.fillText(G.E('share').url, 130, 312);
    return { ctx, v, top: 312 };
  }
  /* 左下角只留一句存档被改过的提示，标题和网址都在左上角 */
  function foot(ctx, v, H) {
    if (!G.world.edited) return;
    ctx.fillStyle = v('--mute'); ctx.font = `26px ${FONT}`; ctx.fillText(t('share.edited'), 130, H - 100);
  }

  /* 每日结算的分享卡：日期，三到五句话，纪念品 */
  U.drawDayCard = function (canvas, rec) {
    const W = 1080, H = 1350, { ctx, v, top } = frame(canvas, W, H), d = G.dateOf(rec.n);
    ctx.fillStyle = v('--ink'); ctx.font = `bold 64px ${FONT}`; ctx.fillText(t('cal.md', { m: d.month, d: d.day }) + ' ' + t(['cal.wd0', 'cal.wd1', 'cal.wd2', 'cal.wd3', 'cal.wd4', 'cal.wd5', 'cal.wd6'][d.weekday]), 130, top + 120);
    ctx.font = `44px ${FONT}`;
    let y = top + 230;
    for (const l of rec.lines) for (const row of wrapper(ctx, G.settleText(l), W - 260)) { if (y > H - 170) break; ctx.fillText(row, 130, y); y += 70; }
    foot(ctx, v, H);
  };

  /* 人物卡：头像，名字，身份和年龄，两张饼图（他照顾了谁，谁照顾了他）。数据是全部时间的统计，没有记录时饼是空环 */
  U.drawPersonCard = async function (canvas, pid) {
    const p = G.get(pid); if (!p) return;
    const W = 1080, H = 1350, { ctx, v, top } = frame(canvas, W, H), st = G.statusOf(p);
    // 头像：画成穿衣小豆，矢量，放得进画布；画不出来就只写名字
    try {
      const svg = CY.avatarBean(p).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="540" ');
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      ctx.drawImage(img, 135, top + 40, 250, 338);
    } catch (e) { /* 没有头像也能出卡 */ }
    ctx.fillStyle = v('--ink'); ctx.font = `bold 72px ${FONT}`;
    let y = top + 130; for (const row of wrapper(ctx, p.person.name, W - 560)) { ctx.fillText(row, 440, y); y += 84; }
    ctx.fillStyle = v('--mute'); ctx.font = `38px ${FONT}`;
    const age = G.isHuman(p) ? ' · ' + t('status.age', { n: +G.age(p).toFixed(0) }) : '';
    ctx.fillText((p.person.role || '') + age, 440, y + 6);
    ctx.fillText(t('mood.' + st.mood), 440, y + 66);
    // 两张饼图
    const sl = U.careSlices ? U.careSlices(pid, 'all') : { given: [], got: [] }, cols = U.careColors || ['#c8794a', '#4f9bb3', '#7aa05a', '#b36ab0', '#d1a23b'];
    const pie = (cx, cy, r, slices, title) => {
      ctx.fillStyle = v('--ink'); ctx.font = `bold 34px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(title, cx, cy - r - 30);
      const total = slices.reduce((a, s) => a + s[1], 0);
      if (!total) { ctx.strokeStyle = v('--line'); ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(cx, cy, r - 9, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = v('--mute'); ctx.font = `30px ${FONT}`; ctx.fillText(t('stats.none'), cx, cy + 10); }
      else {
        let a0 = -Math.PI / 2;
        slices.forEach(([, n], i) => { const a1 = a0 + n / total * Math.PI * 2; ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = v('--card'); ctx.lineWidth = 4; ctx.stroke(); a0 = a1; });
        ctx.textAlign = 'left'; ctx.font = `30px ${FONT}`;
        slices.slice(0, 3).forEach(([name0, n], i) => { let name = name0; while (name.length > 1 && ctx.measureText(name).width > 190) name = name.slice(0, -2) + '…'; const ly = cy + r + 55 + i * 46; ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(cx - 150, ly - 24, 26, 26); ctx.fillStyle = v('--ink'); ctx.fillText(name, cx - 112, ly); ctx.textAlign = 'right'; ctx.fillStyle = v('--mute'); ctx.fillText(Math.round(n / total * 100) + '%', cx + 150, ly); ctx.textAlign = 'left'; });
      }
      ctx.textAlign = 'left';
    };
    pie(335, 925, 135, sl.given, t('stats.given', { name: p.person.name }));
    pie(745, 925, 135, sl.got, t('stats.received', { name: p.person.name }));
    foot(ctx, v, H);
  };

  /* 分享窗口：画一张预览，可以保存，也可以交给系统分享。日卡和人物卡共用 */
  function shareDialog(drawFn, filename, onClose) {
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('share.title'))}</h2>
      <div style="text-align:center"><canvas id="shareCv" style="width:min(300px,70vw);height:auto;border-radius:10px;border:1px solid var(--line)"></canvas></div>
      <div id="shReg"></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="shClose">${esc(t('btn.close'))}</button>${navigator.canShare ? `<button id="shSend">${esc(t('share.send'))}</button>` : ''}<button id="shSave" class="primary">${esc(t('share.save'))}</button></div>`);
    const cv = dlg.querySelector('#shareCv'); drawFn(cv);
    const toBlob = () => new Promise(res => cv.toBlob(res, 'image/png'));
    dlg.querySelector('#shClose').onclick = onClose;
    dlg.querySelector('#shSave').onclick = async () => { const b = await toBlob(), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); if (U.softRegister) U.softRegister(dlg.querySelector('#shReg')); };
    const send = dlg.querySelector('#shSend');
    if (send) send.onclick = async () => { const b = await toBlob(), f = new File([b], filename, { type: 'image/png' }); try { if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); } catch (e) { /* 取消分享不算错误 */ } };
  }
  U.shareDayCard = rec => shareDialog(cv => U.drawDayCard(cv, rec), 'care-for-you-day.png', () => (U.afterShareClose ? U.afterShareClose(rec) : U.closeDialog()));
  U.sharePersonCard = pid => shareDialog(cv => U.drawPersonCard(cv, pid), 'care-for-you-person.png', () => U.statusDialog(pid));
})(globalThis.CY = globalThis.CY || {});
