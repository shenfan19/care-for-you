/* 开局引导。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  U.renderLife = function () {};

  /* 商店：点钱的格子打开。上面是家里的东西，买了就一直有；下面是送客人的礼物，放进背包，每样最多备三件。没有限时，没有折扣 */
  U.shopDialog = function () {
    const V = CY.visitors, inv = G.giftInv(), money = G.world.money || 0;
    const homeRows = G.SHOP.map(it => {
      const own = G.owned(it.id), can = G.canBuy(it.id), locked = it.needs && !G.owned(it.needs);
      return `<div class="srow" style="align-items:center"><span class="k" style="font-size:20px">${it.icon}</span><span style="flex:1"><b>${esc(t('shop.' + it.id))}</b><br><span class="mute">${esc(t('shop.' + it.id + '_fx'))}</span></span>${own ? `<span class="mute">${esc(t('shop.owned'))}</span>` : `<button data-b="${it.id}" ${can ? '' : 'disabled'}>${locked ? esc(t('shop.locked')) : '💰 ' + it.price}</button>`}</div>`;
    }).join('');
    const giftRows = V ? Object.values(V.GIFTS).sort((a, b) => a.price - b.price).map(g => `<div class="gift"><div>${g.icon}</div><div>${esc(t('gift.' + g.id))}</div><div class="mute">${inv[g.id] ? esc(t('gift.have', { n: inv[g.id] })) : '&nbsp;'}</div><button data-g="${g.id}" ${money < g.price || (inv[g.id] || 0) >= G.DOOR.gift_max ? 'disabled' : ''}>💰 ${g.price}</button></div>`).join('') : '';
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('shop.title'))}</h2><div class="money big">💰 ${Math.floor(money)}</div><div class="mute" style="margin:6px 0">${esc(t('shop.note'))}</div>
      <h3>${esc(t('shop.sec_home'))}</h3><div class="sform">${homeRows}</div>
      <h3>${esc(t('shop.sec_gifts'))}</h3><div class="mute" style="margin-bottom:6px">${esc(t('shop.gift_note'))}</div><div class="giftgrid">${giftRows}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="shclose" class="primary">${esc(t('btn.close'))}</button></div>`, true);
    const keep = dlg.scrollTop;
    dlg.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { if (G.buy(b.dataset.b)) { U.renderRoom(true); U.renderClock(); U.shopDialog(); } });
    dlg.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { if (G.buyGift(b.dataset.g)) { U.renderClock(); U.shopDialog(); } });
    dlg.querySelector('#shclose').onclick = U.closeDialog;
  };

  /* 第一次有了角色之后，讲清楚照顾的代价 */
  U.maybeIntro = function () { if (!G.world.intro_done) U.introDialog(); };
  U.introDialog = function () {
    const BG = ['layoff', 'return', 'house'];
    const finish = () => { G.world.intro_done = true; G.world.story_pending = false; G.save(true); U.closeDialog(); U.renderLife(); U.renderControls(); U.renderRoom(true); G.maybeArrive(); };
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('start.title'))}</h2><p>${esc(t('start.p1'))}</p><p>${esc(t('start.p2'))}</p>
      <div class="tiles">${BG.map(b => `<button class="tile" data-start-bg="${b}"><b>${esc(t('start.bg_' + b))}</b><span class="mute">${esc(t('start.bg_' + b + '_note'))}</span></button>`).join('')}</div>`, true);
    dlg.querySelectorAll('[data-start-bg]').forEach(b => b.onclick = () => {
      G.chooseBackground(b.dataset.startBg);
      const d2 = U.dialog(`<h2 style="margin-top:0">${esc(t('start.title'))}</h2><p>${esc(t('start.story_' + b.dataset.startBg))}</p><p>${esc(t('start.door'))}</p><div class="mute">${esc(t('start.later'))}</div>
        <div class="row" style="justify-content:flex-end;margin-top:10px"><button id="introok" class="primary">${esc(t('start.go'))}</button></div>`, true);
      d2.querySelector('#introok').onclick = finish;
    });
  };

  /* 一句话提示，几秒后消失 */
  U.flash = function (msg) {
    const el = $('modeToast');
    el.textContent = msg; el.style.display = 'block'; clearTimeout(U._mt); U._mt = setTimeout(() => { el.style.display = 'none'; }, 6000);
  };

})(globalThis.CY = globalThis.CY || {});
