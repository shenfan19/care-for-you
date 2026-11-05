/* 送礼：在客人身上的行动圈里长按「送礼」，做完后弹出这个选择窗，点一件背包里的礼物就送。礼物在商店的礼物区买，点钱的格子打开商店。展柜是客厅里买来的家具。 */
(function (CY) {
  const G = CY.game, V = CY.visitors, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;

  const giftName = id => t('gift.' + id);
  /* 好感度：五颗星，三颗星满足。礼物窗，来客的状态面板，名录里都用它 */
  U.favStars = fav => { const n = Math.min(5, Math.floor((fav || 0) / (G.FAV.max / 5))); return '★'.repeat(n) + '☆'.repeat(5 - n); };
  let note = '';

  U.giftDialog = pid => {
    const p = G.get(pid);
    if (!p || !p.person.visitor) return;
    const inv = G.giftInv(), money = G.world.money || 0;
    const ids = Object.keys(V.GIFTS).filter(g => inv[g] > 0).sort((a, b) => V.GIFTS[a].price - V.GIFTS[b].price);
    const grid = ids.map(g => `<button class="gift pick" data-item="${g}"><div>${V.GIFTS[g].icon}</div><div>${esc(giftName(g))}</div><div class="mute">${esc(t('gift.have', { n: inv[g] }))}</div></button>`).join('');
    const vc = G.visitorCard(p), st = p.person.visitor;
    const profile = vc ? `${t('visitor.' + vc.id + '.era')} · ${t('field.' + vc.field)}` : '';
    const favLine = `${U.favStars(st.fav)}${st.ok ? ' · ' + t('gift.fav_ok') : ''}`;
    const dlg = U.dialog(`<h2 style="margin-top:0">🎁 ${esc(t('gift.title'))}</h2><div class="mute">${esc(p.person.name)} · ${esc(profile)}</div><div style="margin:4px 0">${esc(favLine)}</div>${note ? `<p class="gift-react">${esc(note)}</p>` : ''}<p class="mute">${esc(t('gift.pick', { name: p.person.name, n: G.giftsLeft() }))}</p>${grid ? `<div class="giftgrid vbody">${grid}</div>` : `<p class="mute">${esc(t('gift.empty'))}</p>`}
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="vClose" class="primary">${esc(t('cal.close'))}</button></div>`, true);
    note = '';
    dlg.querySelector('#vClose').onclick = () => U.closeDialog();
    dlg.querySelectorAll('[data-item]').forEach(b => b.onclick = () => {
      const r = G.giveGift(pid, b.dataset.item);
      if (r.error === 'limit' || r.error === 'done' || r.error === 'money') { note = r.error === 'limit' ? t('gift.limit') : r.error === 'done' ? t('gift.done', { name: p.person.name }) : t('gift.money'); return U.giftDialog(pid); }
      /* 送完不关窗：窗里写对方的反应，星星当场变化，还能接着送，送满足了窗里写明 */
      note = r.like ? t(r.line) : t('gift.mild', { name: p.person.name });
      U.giftDialog(pid);
      U.renderClock && U.renderClock();
    });
  };

  /* 来客介绍：名字，时代，领域，来源，留下的纪念品，和一个去维基百科搜索的链接。那句广为流传的话要等到拿到纪念品之后才显示，免得替玩家猜了需求 */
  const WIKI = { 'zh-CN': 'zh', 'zh-TW': 'zh', en: 'en', ja: 'ja', ko: 'ko', fr: 'fr', es: 'es', de: 'de' };
  U.visitorIntroHtml = p => (p && p.person.visitor ? `<div style="margin:0 0 6px">${esc(U.favStars(p.person.visitor.fav))}${p.person.visitor.ok ? ' · ' + esc(t('gift.fav_ok')) : ''}</div>` : '') + U.visitorCardHtml(p && p.person.visitor && G.visitorCard(p));
  U.visitorCardHtml = c => {
    if (!c) return '';
    const name = t('visitor.' + c.id + '.name'), kept = G.souvenirs()[c.id], n = c.t && c.t.hint ? c.t.hint.length : 0;
    const quote = kept && n ? t('visitor.' + c.id + '.hint.' + (n - 1)) : '';
    const url = `https://${WIKI[CY.i18n.lang] || 'en'}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`;
    return `<div class="mute">${esc(t('visitor.' + c.id + '.era'))} · ${esc(t('field.' + c.field))}</div>
      ${quote ? `<p style="font-style:italic;margin:10px 0">${esc(quote)}</p>` : ''}
      <div style="margin:8px 0">${c.souvenir.icon} ${esc(t('visitor.' + c.id + '.souvenir'))}</div>
      ${c.src ? `<div class="mute" style="font-size:12px">${esc(c.src)}</div>` : ''}
      <p><a href="${url}" target="_blank" rel="noopener noreferrer">${esc(t('visitor.wiki'))}</a></p>`;
  };

  /* 点事件里来客的名字：人还在家就看状态，已经走了就看来客介绍，走了以后也能查到她是谁 */
  U.visitorDialog = cid => {
    const here = G.visitorPeople().find(p => p.person.visitor.id === cid);
    if (here) { U.statusDialog(here.id); return; }
    const c = V.cards[cid]; if (!c) return;
    const dlg = U.dialog(`<h2 style="margin:0 0 4px">${esc(t('visitor.' + cid + '.name'))}</h2><div class="intro">${U.visitorCardHtml(c)}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="vcclose" class="primary">${esc(t('btn.close'))}</button></div>`);
    dlg.querySelector('#vcclose').onclick = U.closeDialog;
  };


  /* 来客名录：来过的亮起来，没来过的是问号和黑影。每位写最高好感几颗星，有没有收到回礼（满足后离开留下的纪念品）。点一位来过的看介绍 */
  U.visitorBook = () => {
    const ids = Object.keys(V.cards), met = G.world.met || {}, souv = G.souvenirs(), best = G.world.favbest || {};
    const seen = ids.filter(i => met[i] > 0).length;
    const tile = id => {
      const c = V.cards[id];
      if (!(met[id] > 0)) return `<div class="vbk dark"><div class="vbi">👤</div><b>${esc(t('book.unknown'))}</b></div>`;
      return `<button class="vbk" data-v="${esc(id)}"><div class="vbi">${c.souvenir && souv[id] ? c.souvenir.icon : '🙂'}</div><b>${esc(t('visitor.' + id + '.name'))}</b>
        <span class="mute">${esc(t('visitor.' + id + '.era'))}</span><span>${esc(U.favStars(best[id]))}</span>
        <span class="${souv[id] ? '' : 'mute'}">${souv[id] ? esc(t('book.got')) + ' ' + esc(t('visitor.' + id + '.souvenir')) : esc(t('book.not_yet'))}</span></button>`;
    };
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('book.title'))} <span class="mute" style="font-size:14px">${seen} / ${ids.length}</span></h2>
      <p class="mute">${esc(t('book.note'))}</p><div class="vbgrid vbody">${ids.map(tile).join('')}</div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button id="vbclose" class="primary">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelector('#vbclose').onclick = U.closeDialog;
    dlg.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
      const cid = b.dataset.v, c = V.cards[cid];
      const d2 = U.dialog(`<h2 style="margin:0 0 4px">${esc(t('visitor.' + cid + '.name'))}</h2><div class="intro">${U.visitorCardHtml(c)}</div>
        <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="vbback" class="primary">${esc(t('shop.back'))}</button></div>`);
      d2.querySelector('#vbback').onclick = () => U.visitorBook();
    });
  };

  /* 访客到来时提醒一下 */
  G.visitHooks.push((type, p) => {
    if (typeof document === 'undefined') return;
    if (type === 'arrive' && U.flash) U.flash(t('visit.arrive_toast', { name: p.person.name }) + (G.visitorCard(p) ? ' · ' + t('visitor.' + G.visitorCard(p).id + '.era') : '') + (G.visitorCard(p) && !G.visitorCard(p).official ? ' · ' + t('visit.unofficial') : ''));
    if (U.renderClock) U.renderClock();
  });
})(globalThis.CY = globalThis.CY || {});
