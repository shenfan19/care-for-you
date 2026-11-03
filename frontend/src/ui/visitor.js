/* 送礼：在客人身上的行动圈里长按「送礼」，做完后弹出这个选择窗，点一件就送。
   背包里有的直接送，没有的按目录价当场买下送出，所以没有单独的商店和背包页。展柜是客厅里买来的家具，不在菜单里。 */
(function (CY) {
  const G = CY.game, V = CY.visitors, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;

  const giftName = id => t('gift.' + id);
  let note = '';

  U.giftDialog = pid => {
    const p = G.get(pid);
    if (!p || !p.person.visitor) return;
    const inv = G.giftInv(), money = G.world.money || 0;
    const ids = Object.keys(V.GIFTS).sort((a, b) => (inv[b] > 0) - (inv[a] > 0) || V.GIFTS[a].price - V.GIFTS[b].price);
    const grid = ids.map(g => `<button class="gift pick" data-item="${g}"><div>${V.GIFTS[g].icon}</div><div>${esc(giftName(g))}</div><div class="mute">${inv[g] > 0 ? esc(t('gift.have', { n: inv[g] })) : '💰 ' + V.GIFTS[g].price}</div></button>`).join('');
    const dlg = U.dialog(`<h2 style="margin-top:0">🎁 ${esc(t('gift.title'))}</h2><p class="mute">${esc(t('gift.pick', { name: p.person.name, n: G.giftsLeft() }))}</p>${note ? `<p class="settle-line">${esc(note)}</p>` : ''}<div class="giftgrid vbody">${grid}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="vClose" class="primary">${esc(t('cal.close'))}</button></div>`, true);
    note = '';
    dlg.querySelector('#vClose').onclick = () => U.closeDialog();
    dlg.querySelectorAll('[data-item]').forEach(b => b.onclick = () => {
      const r = G.giveGift(pid, b.dataset.item);
      if (r.error === 'limit' || r.error === 'done' || r.error === 'money') { note = r.error === 'limit' ? t('gift.limit') : r.error === 'done' ? t('gift.done', { name: p.person.name }) : t('gift.money'); return U.giftDialog(pid); }
      U.closeDialog();
      if (U.flash) U.flash(r.ok ? t(r.line) : t('gift.thanks', { name: p.person.name }));
      U.renderClock && U.renderClock();
    });
  };

  /* 访客到来时提醒一下 */
  G.visitHooks.push((type, p) => {
    if (typeof document === 'undefined') return;
    if (type === 'arrive' && U.flash) U.flash(t('visit.arrive_toast', { name: p.person.name }) + (G.visitorCard(p) && !G.visitorCard(p).official ? ' · ' + t('visit.unofficial') : ''));
    if (U.renderClock) U.renderClock();
  });
})(globalThis.CY = globalThis.CY || {});
