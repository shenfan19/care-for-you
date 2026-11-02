/* 时空门、访客、礼物店、展柜。一个对话框三个页签，门按钮上有访客时带一个点。 */
(function (CY) {
  const G = CY.game, V = CY.visitors, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;

  const giftName = id => { const n = V.GIFTS[id].name, l = CY.i18n.lang; return n[l] || (l.startsWith('zh') ? n['zh-CN'] : n.en); };
  const portrait = c => CY.avatarPreview({ species: 'human', pronoun: c.pronoun }, c.look || {}, c.age || 40);
  let tab = 'guest', note = '';

  U.visitorDialog = (which) => {
    if (which) tab = which;
    const visits = G.visits(), left = G.visitActsLeft();
    const tabs = ['guest', 'shop', 'cabinet'].map(k => `<button class="chip ${tab === k ? 'on' : ''}" data-tab="${k}">${esc(t('visit.tab_' + k))}</button>`).join('');
    let body = '';
    if (tab === 'guest') {
      body = visits.length ? visits.map((st, i) => {
        const c = V.cards[st.id], inv = G.giftInv(), gifts = Object.keys(inv).filter(g => inv[g] > 0);
        return `<div class="vcard"><div class="prev">${portrait(c)}</div><div class="vinfo">
          <h3 style="margin:0">${esc(t(`visitor.${st.id}.name`))}${c.official ? '' : ` <span class="pill">${esc(t('visit.unofficial'))}</span>`}</h3>
          <div class="mute">${esc(t(`visitor.${st.id}.era`))} · ${esc(t('visit.stay_left', { n: G.daysLeft(st) }))}</div>
          ${st.ok ? `<p>${esc(t('visit.done'))}</p>` : `<div class="row"><button data-talk="${i}">${esc(t('visit.talk'))}</button>${c.care ? `<button data-care="${i}" class="primary">${esc(t('visit.care_' + c.care))}</button>` : ''}</div>
          ${gifts.length ? `<div class="mute" style="margin-top:6px">${esc(t('visit.give'))}</div><div class="row" style="flex-wrap:wrap">${gifts.map(g => `<button data-give="${i}|${g}">${V.GIFTS[g].icon} ${esc(giftName(g))} ×${inv[g]}</button>`).join('')}</div>` : `<div class="mute" style="margin-top:6px">${esc(t('visit.give_none'))}</div>`}`}
          </div></div>`;
      }).join('') + `<p class="mute">${esc(t('visit.acts_left', { n: left }))}</p>` : `<p class="mute">${esc(t('visit.empty'))}</p>`;
    } else if (tab === 'shop') {
      const inv = G.giftInv();
      body = `<p class="mute">${esc(t('visit.shop_note'))}</p><div class="giftgrid">` + Object.values(V.GIFTS).map(g => `<div class="gift"><div>${g.icon}</div><div>${esc(giftName(g.id))}</div><div class="mute">💰 ${g.price}${inv[g.id] ? ' · ' + esc(t('visit.owned', { n: inv[g.id] })) : ''}</div><button data-buy="${g.id}" ${(G.world.money || 0) < g.price || (inv[g.id] || 0) >= G.DOOR.gift_max ? 'disabled' : ''}>${esc(t('visit.buy'))}</button></div>`).join('') + '</div>';
    } else {
      const souv = G.souvenirs(), ids = V.order.filter(id => souv[id]);
      body = `<p class="mute">${esc(t('visit.cabinet_count', { n: ids.length, m: V.order.length }))}</p>` + (ids.length ? '<div class="giftgrid">' + ids.map(id => `<div class="gift"><div style="font-size:1.8em">${V.cards[id].souvenir.icon}</div><div>${esc(t(`visitor.${id}.souvenir`))}</div><div class="mute">${esc(t('visit.cab_from', { name: t(`visitor.${id}.name`) }))}</div></div>`).join('') + '</div>' : `<p class="mute">${esc(t('visit.cabinet_empty'))}</p>`);
    }
    const dlg = U.dialog(`<h2 style="margin-top:0">🚪 ${esc(t('visit.door_tip'))}</h2><div class="chips">${tabs}</div>${note ? `<p class="settle-line">${esc(note)}</p>` : ''}<div class="vbody">${body}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="vClose" class="primary">${esc(t('cal.close'))}</button></div>`, true);
    note = '';
    dlg.querySelector('#vClose').onclick = U.closeDialog;
    dlg.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => U.visitorDialog(b.dataset.tab));
    dlg.querySelectorAll('[data-talk]').forEach(b => b.onclick = () => { const k = G.visitTalk(+b.dataset.talk); note = k ? t(k) : ''; U.visitorDialog(); });
    dlg.querySelectorAll('[data-care]').forEach(b => b.onclick = () => { const r = G.visitCare(+b.dataset.care); note = r.ok ? t(r.line) : t('visit.limit'); U.visitorDialog(); U.renderClock && U.renderClock(); });
    dlg.querySelectorAll('[data-give]').forEach(b => b.onclick = () => {
      const [i, g] = b.dataset.give.split('|'), r = G.giveGift(+i, g);
      note = r.error === 'limit' ? t('visit.limit') : r.ok ? t(r.line) : r.error ? '' : t('visit.thanks_neutral');
      U.visitorDialog();
    });
    dlg.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { G.buyGift(b.dataset.buy); U.visitorDialog(); U.renderClock && U.renderClock(); });
  };

  /* 访客到来时提醒一下，第一位自动打开 */
  G.visitHooks.push((type, st) => {
    if (typeof document === 'undefined') return;
    if (type === 'arrive') { if (U.flash) U.flash(t('visit.arrive_toast', { name: t(`visitor.${st.id}.name`) })); if (G.visits().length === 1 && (G.world.met || {})[st.id] === 1 && Object.keys(G.world.met).length === 1) setTimeout(() => U.visitorDialog('guest'), 600); }
    if (U.renderClock) U.renderClock();
  });
})(globalThis.CY = globalThis.CY || {});
