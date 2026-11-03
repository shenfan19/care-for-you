/* 送礼按钮和物品框。按钮一直亮着；点开是背包里的东西，点一件就送给客人，客人多于一位时再选送给谁。
   另有礼物店和展柜两个页签。访客本人是家里的一个角色，在房间里点他就能用普通的动作照顾。 */
(function (CY) {
  const G = CY.game, V = CY.visitors, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;

  const giftName = id => t('gift.' + id);
  let tab = 'bag', note = '', picking = '';

  U.giftDialog = which => {
    if (which) tab = which;
    const guests = G.visitorPeople(), inv = G.giftInv(), money = G.world.money || 0;
    const tabs = ['bag', 'shop', 'cabinet'].map(k => `<button class="chip ${tab === k ? 'on' : ''}" data-tab="${k}">${esc(t('gift.tab_' + k))}</button>`).join('');
    let body = '';
    if (tab === 'bag') {
      const ids = Object.keys(inv).filter(g => inv[g] > 0);
      if (picking && !inv[picking]) picking = '';
      body = `<p class="mute">${esc(guests.length ? t('gift.here', { names: guests.map(p => p.person.name).join(t('sep.list')), n: G.giftsLeft() }) : t('gift.nobody'))}</p>` +
        (ids.length ? `<div class="giftgrid">${ids.map(g => `<button class="gift pick ${picking === g ? 'on' : ''}" data-item="${g}"><div>${V.GIFTS[g].icon}</div><div>${esc(giftName(g))}</div><div class="mute">×${inv[g]}</div></button>`).join('')}</div>` : `<p class="mute">${esc(t('gift.empty'))}</p>`) +
        (picking && guests.length > 1 ? `<p>${esc(t('gift.to', { gift: giftName(picking) }))}</p><div class="row" style="flex-wrap:wrap">${guests.map(p => `<button data-to="${p.id}" class="primary">${esc(p.person.name)}</button>`).join('')}</div>` : '');
    } else if (tab === 'shop') {
      body = `<p class="mute">${esc(t('gift.shop_note'))}</p><div class="giftgrid">` + Object.values(V.GIFTS).map(g => `<div class="gift"><div>${g.icon}</div><div>${esc(giftName(g.id))}</div><div class="mute">💰 ${g.price}${inv[g.id] ? ' · ' + esc(t('gift.owned', { n: inv[g.id] })) : ''}</div><button data-buy="${g.id}" ${money < g.price || (inv[g.id] || 0) >= G.DOOR.gift_max ? 'disabled' : ''}>${esc(t('gift.buy'))}</button></div>`).join('') + '</div>';
    } else {
      const souv = G.souvenirs(), ids = V.order.filter(id => souv[id]);
      body = `<p class="mute">${esc(t('gift.cabinet_count', { n: ids.length, m: V.order.length }))}</p>` + (ids.length ? '<div class="giftgrid">' + ids.map(id => `<div class="gift"><div style="font-size:1.8em">${V.cards[id].souvenir.icon}</div><div>${esc(t(`visitor.${id}.souvenir`))}</div><div class="mute">${esc(t('gift.cab_from', { name: t(`visitor.${id}.name`) }))}</div></div>`).join('') + '</div>' : `<p class="mute">${esc(t('gift.cabinet_empty'))}</p>`);
    }
    const dlg = U.dialog(`<h2 style="margin-top:0">🎁 ${esc(t('gift.title'))}</h2><div class="chips">${tabs}</div>${note ? `<p class="settle-line">${esc(note)}</p>` : ''}<div class="vbody">${body}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="vClose" class="primary">${esc(t('cal.close'))}</button></div>`, true);
    note = '';
    dlg.querySelector('#vClose').onclick = () => { picking = ''; U.closeDialog(); };
    dlg.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { picking = ''; U.giftDialog(b.dataset.tab); });
    const give = (pid, gid) => {
      const r = G.giveGift(pid, gid), who = G.get(pid) ? G.get(pid).person.name : '';
      note = r.error === 'limit' ? t('gift.limit') : r.error === 'done' ? t('gift.done', { name: who }) : r.ok ? t(r.line) : r.error ? '' : t('gift.thanks', { name: who });
      picking = ''; U.giftDialog(); U.renderClock && U.renderClock();
    };
    dlg.querySelectorAll('[data-item]').forEach(b => b.onclick = () => {
      if (!guests.length) { note = t('gift.nobody'); return U.giftDialog(); }
      if (guests.length === 1) return give(guests[0].id, b.dataset.item);
      picking = b.dataset.item; U.giftDialog();
    });
    dlg.querySelectorAll('[data-to]').forEach(b => b.onclick = () => give(b.dataset.to, picking));
    dlg.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { G.buyGift(b.dataset.buy); U.giftDialog(); U.renderClock && U.renderClock(); });
  };

  /* 访客到来时提醒一下 */
  G.visitHooks.push((type, p) => {
    if (typeof document === 'undefined') return;
    if (type === 'arrive' && U.flash) U.flash(t('visit.arrive_toast', { name: p.person.name }));
    if (U.renderClock) U.renderClock();
  });
})(globalThis.CY = globalThis.CY || {});
