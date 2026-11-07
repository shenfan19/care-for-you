/* 分享卡片：日历里选中的某一天，和人物页里的某个人，玩家自己点开，在本机用画布画成一张图，保存或交给系统分享。
   没有全局的总数分享：总数会变成成就展示，违背了叙事。不联网，不上传；标题右侧放主站的二维码，
   二维码矩阵随游戏打包，不请求外部服务。游戏里没有任何地方推荐或奖励分享。 */
(function (CY) {
  const G = CY.game, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;
  const FONT = 'system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';

  /* 主界面入口：先展开日期或角色，再选具体一项；只列已有结算的日期。 */
  U.sharePopover = anchor => {
    const days = G.cal.days.slice().sort((a, b) => b.n - a.n);
    const people = G.people.filter(p => G.isHuman(p));
    const dayLabel = rec => { const d = G.dateOf(rec.n); return d.iso + ' · ' + t(['cal.wd0', 'cal.wd1', 'cal.wd2', 'cal.wd3', 'cal.wd4', 'cal.wd5', 'cal.wd6'][d.weekday]); };
    const dayRows = days.map(rec => `<button type="button" data-share-day="${rec.n}">${esc(dayLabel(rec))}</button>`).join('');
    const personRows = people.map(p => `<button type="button" data-share-person="${esc(p.id)}"><span>${esc(p.person.name)}</span><small class="mute">${esc(p.person.role || '')}</small></button>`).join('');
    U.popover(anchor, `<details><summary>${esc(t('share.choose_day'))}</summary><div class="share-options">${dayRows || `<p class="mute">${esc(t('cal.none'))}</p>`}</div></details>
      <details><summary>${esc(t('share.choose_person'))}</summary><div class="share-options">${personRows || `<p class="mute">${esc(t('said.nobody'))}</p>`}</div></details>`, box => {
      box.classList.add('share-pop');
      const room = anchor.closest('.room'), bottom = Math.min(window.innerHeight, room ? room.getBoundingClientRect().bottom : window.innerHeight);
      box.style.maxHeight = Math.max(80, Math.min(320, bottom - box.getBoundingClientRect().top - 12)) + 'px';
      box.querySelectorAll('details').forEach(section => section.addEventListener('toggle', () => { if (section.open) box.querySelectorAll('details').forEach(other => { if (other !== section) other.open = false; }); }));
      const back = () => { U.closeDialog(); anchor.focus(); };
      box.querySelectorAll('[data-share-day]').forEach(b => b.onclick = () => { const rec = G.dayRecord(+b.dataset.shareDay); if (rec) { U.closePopover(); U.shareDayCard(rec, back); } });
      box.querySelectorAll('[data-share-person]').forEach(b => b.onclick = () => { if (G.get(b.dataset.sharePerson)) { U.closePopover(); U.sharePersonCard(b.dataset.sharePerson, back); } });
    }, true);
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  const palette = () => { const css = getComputedStyle(document.documentElement); return k => css.getPropertyValue(k).trim() || '#888'; };
  const wrapper = (ctx, text, maxW) => { const out = []; let line = ''; for (const ch of Array.from(text)) { if (ctx.measureText(line + ch).width > maxW) { out.push(line); line = ch; } else line += ch; } if (line) out.push(line); return out; };

  /* 图表各有自己的文字列。优先按词换行，过长的单词或无空格的名字再逐字折行。 */
  const chartLines = (ctx, text, maxW) => {
    const lines = []; let line = '';
    for (const word of text.match(/\S+\s*/gu) || []) {
      if (line && ctx.measureText(line + word.trimEnd()).width > maxW) { lines.push(line.trimEnd()); line = ''; }
      for (const ch of Array.from(word)) {
        if (!line && /\s/u.test(ch)) continue;
        if (line && ctx.measureText((line + ch).trimEnd()).width > maxW) { lines.push(line.trimEnd()); line = ''; }
        line += ch;
      }
    }
    if (line.trimEnd()) lines.push(line.trimEnd());
    return lines;
  };
  const fitHeading = (ctx, text, width, size, minSize) => {
    let rows;
    do { ctx.font = `bold ${size}px ${FONT}`; rows = chartLines(ctx, text, width); if (rows.length <= 2 || size <= minSize) break; size -= 2; } while (true);
    if (rows.length > 2) {
      rows = rows.slice(0, 2); let last = rows[1];
      while (last && ctx.measureText(last + '…').width > width) last = Array.from(last).slice(0, -1).join('');
      rows[1] = last.trimEnd() + '…';
    }
    return { rows, size };
  };

  /* 共用标题区：左侧是标题、游戏类型和短句，右侧是主站二维码及网址。 */
  function frame(canvas, W, H) {
    const v = palette(), ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    ctx.fillStyle = v('--bg'); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = v('--card'); roundRect(ctx, 70, 70, W - 140, H - 140, 36); ctx.fill();
    ctx.textBaseline = 'alphabetic';
    const qrY = 130, qrSize = 198;
    if (U.tagN === undefined) U.tagN = Math.floor(Math.random() * 6);
    ctx.font = `26px ${FONT}`;
    const tagRows = chartLines(ctx, t('tag.' + (U.tagN + 1)), 560);
    const titleY = qrY + qrSize / 2 - 2, labelY = titleY + 47;
    ctx.fillStyle = v('--accent'); ctx.font = `italic 600 64px Georgia, "Songti SC", "Noto Serif CJK SC", serif`; ctx.fillText(t('app.title'), 130, titleY);
    ctx.fillStyle = v('--mute'); ctx.font = `24px ${FONT}`;
    ctx.fillText(t('share.game_label'), 130, labelY, 560);
    ctx.fillStyle = v('--mute'); ctx.font = `26px ${FONT}`;
    const tagY = labelY + 50;
    tagRows.forEach((row, i) => ctx.fillText(row, 130, tagY + i * 34));
    {
      const code = CY.shareQR, x = 752, cells = code.rows.length + 8;
      // 深色卡使用低亮度暖灰底，同时保持深码浅底及四格留白。
      const dark = document.documentElement.dataset.theme === 'dark';
      ctx.fillStyle = dark ? '#b8aa98' : v('--card');
      roundRect(ctx, x, qrY, qrSize, qrSize, 12); ctx.fill();
      ctx.fillStyle = v(dark ? '--card' : '--ink');
      code.rows.forEach((row, r) => Array.from(row).forEach((cell, c) => {
        if (cell !== '1') return;
        const left = Math.round((c + 4) * qrSize / cells), top = Math.round((r + 4) * qrSize / cells);
        ctx.fillRect(x + left, qrY + top, Math.round((c + 5) * qrSize / cells) - left, Math.round((r + 5) * qrSize / cells) - top);
      }));
      ctx.fillStyle = v('--mute'); ctx.font = `20px ${FONT}`;
      ctx.fillText(code.url, x + (qrSize - ctx.measureText(code.url).width) / 2, qrY + qrSize + 18);
    }
    return { ctx, v, top: Math.max(360, tagY + (tagRows.length - 1) * 34 + 12) };
  }
  /* 左下角只留一句存档被改过的提示，标题和网址都在左上角 */
  function foot(ctx, v, H) {
    if (!G.world.edited) return;
    ctx.fillStyle = v('--mute'); ctx.font = `26px ${FONT}`; ctx.fillText(t('share.edited'), 130, H - 100);
  }

  /* 每日结算的分享卡：日期，三到五句话，纪念品 */
  U.drawDayCard = function (canvas, rec) {
    const W = 1080, d = G.dateOf(rec.n);
    let H = 1350, { ctx, v, top } = frame(canvas, W, H);
    ctx.font = `44px ${FONT}`;
    const rows = rec.lines.flatMap(l => wrapper(ctx, G.settleText(l), W - 260));
    const needed = top + 230 + Math.max(0, rows.length - 1) * 70 + 170;
    if (needed > H) { H = needed; ({ ctx, v, top } = frame(canvas, W, H)); }
    ctx.fillStyle = v('--ink'); ctx.font = `bold 64px ${FONT}`; ctx.fillText(t('cal.md', { m: d.month, d: d.day }) + ' ' + t(['cal.wd0', 'cal.wd1', 'cal.wd2', 'cal.wd3', 'cal.wd4', 'cal.wd5', 'cal.wd6'][d.weekday]), 130, top + 120);
    ctx.font = `44px ${FONT}`;
    let y = top + 230;
    for (const row of rows) { ctx.fillText(row, 130, y); y += 70; }
    foot(ctx, v, H);
  };

  /* 人物卡：头像，名字，身份和年龄，两张饼图（他照顾了谁，谁照顾了他）。数据是全部时间的统计，没有记录时饼是空环 */
  U.drawPersonCard = async function (canvas, pid) {
    const p = G.get(pid); if (!p) return;
    const W = 1080, H = 1480, { ctx, v, top } = frame(canvas, W, H), st = G.statusOf(p);
    // 头像：画成穿衣小豆，矢量，放得进画布；画不出来就只写名字
    try {
      const svg = CY.avatarBean(p).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="540" ');
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      ctx.drawImage(img, 135, top + 40, 250, 338);
    } catch (e) { /* 没有头像也能出卡 */ }
    ctx.fillStyle = v('--ink');
    const nameHeading = fitHeading(ctx, p.person.name, W - 570, 72, 44);
    let y = top + 130; for (const row of nameHeading.rows) { ctx.fillText(row, 440, y); y += nameHeading.size + 12; }
    ctx.fillStyle = v('--mute'); ctx.font = `38px ${FONT}`;
    const age = G.isHuman(p) ? ' · ' + t('status.age', { n: +G.age(p).toFixed(0) }) : '';
    ctx.fillText((p.person.role || '') + age, 440, y + 6);
    ctx.fillText(t('mood.' + st.mood), 440, y + 66);
    // 两张饼图
    const sl = U.careSlices ? U.careSlices(pid, 'all') : { given: [], got: [] };
    const pie = (cx, cy, r, slices, title) => {
      ctx.fillStyle = v('--ink'); ctx.textAlign = 'center';
      const titleRows = fitHeading(ctx, title, 380, 34, 26).rows;
      titleRows.forEach((row, i) => ctx.fillText(row, cx, cy - r - 30 - (titleRows.length - 1 - i) * 40));
      const total = slices.reduce((a, s) => a + s[1], 0);
      if (!total) { ctx.strokeStyle = v('--line'); ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(cx, cy, r - 9, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = v('--mute'); ctx.font = `26px ${FONT}`; const rows = chartLines(ctx, t('stats.none'), 280); rows.forEach((row, i) => ctx.fillText(row, cx, cy + 10 + (i - (rows.length - 1) / 2) * 34)); }
      else {
        let a0 = -Math.PI / 2;
        slices.forEach(([, n, color]) => { const a1 = a0 + n / total * Math.PI * 2; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = v('--card'); ctx.lineWidth = 4; ctx.stroke(); a0 = a1; });
        ctx.textAlign = 'left'; ctx.font = `30px ${FONT}`;
        slices.slice(0, 3).forEach(([name0, n, color], i) => { let name = name0; while (name.length > 1 && ctx.measureText(name).width > 190) name = name.slice(0, -2) + '…'; const ly = cy + r + 55 + i * 46; ctx.fillStyle = color; ctx.fillRect(cx - 150, ly - 24, 26, 26); ctx.fillStyle = v('--ink'); ctx.fillText(name, cx - 112, ly); ctx.textAlign = 'right'; ctx.fillStyle = v('--mute'); ctx.fillText(Math.round(n / total * 100) + '%', cx + 150, ly); ctx.textAlign = 'left'; });
      }
      ctx.textAlign = 'left';
    };
    pie(335, 925, 135, sl.given, t('stats.given', { name: p.person.name }));
    pie(745, 925, 135, sl.got, t('stats.received', { name: p.person.name }));
    ctx.fillStyle = v('--mute'); ctx.font = `26px ${FONT}`;
    const noteRows = chartLines(ctx, t('share.stats_note'), W - 260);
    const noteBottom = H - (G.world.edited ? 164 : 120);
    noteRows.forEach((row, i) => ctx.fillText(row, 130, noteBottom - (noteRows.length - 1 - i) * 34));
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
  U.shareDayCard = (rec, onClose) => shareDialog(cv => U.drawDayCard(cv, rec), 'care-for-you-day.png', onClose || (() => (U.afterShareClose ? U.afterShareClose(rec) : U.closeDialog())));
  U.sharePersonCard = (pid, onClose) => shareDialog(cv => U.drawPersonCard(cv, pid), 'care-for-you-person.png', onClose || (() => U.statusDialog(pid)));
})(globalThis.CY = globalThis.CY || {});
