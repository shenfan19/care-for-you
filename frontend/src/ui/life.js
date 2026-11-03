/* 开局引导。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  U.renderLife = function () {};

  /* 商店：点钱的格子直接打开。所有东西一个样子：图标，名字，价格，鼠标停上去显示说明。分四块：床位，日用品，装饰，送客人的礼物。
     床位决定家里最多住几个人，家人和穿越者都占，很贵，一张一张买；装饰纯粹是观感，没有数值；礼物买了进背包，每样最多备三件。没有限时，没有折扣 */
  U.shopDialog = function () {
    const V = CY.visitors, inv = G.giftInv(), money = G.world.money || 0, old = document.querySelector('#modal .box'), keep = old ? old.scrollTop : 0;
    const tile = (icon, name, desc, label, attrs, extra) => `<div class="gift shoptile" title="${esc(desc)}"><div>${icon}</div><div>${esc(name)}</div><div class="mute">${extra || '&nbsp;'}</div>${label}</div>`;
    const item = it => {
      const own = G.owned(it.id), can = G.canBuy(it.id), locked = it.needs && !G.owned(it.needs);
      return tile(it.icon, t('shop.' + it.id), t('shop.' + it.id + '_fx') + (locked ? ' ' + t('shop.locked') : ''), own ? `<button disabled>${esc(t('shop.owned'))}</button>` : `<button data-b="${it.id}" ${can ? '' : 'disabled'}>💰 ${it.price}</button>`);
    };
    const bp = G.bedPrice();
    const bed = tile('🛏', t('shop.bed_slot'), t('shop.bed_slot_fx') + ' ' + t('shop.beds_now', { n: G.bedsOwned(), m: G.BED_MAX, u: G.bedUsers().length }), bp === null ? `<button disabled>${esc(t('shop.full'))}</button>` : `<button data-bed="1" ${G.canBuyBed() ? '' : 'disabled'}>💰 ${bp}</button>`, '', t('shop.beds_now', { n: G.bedsOwned(), m: G.BED_MAX, u: G.bedUsers().length }));
    const giftTile = g => tile(g.icon, t('gift.' + g.id), t('gift.' + g.id), `<button data-g="${g.id}" ${money < g.price || (inv[g.id] || 0) >= G.DOOR.gift_max ? 'disabled' : ''}>💰 ${g.price}</button>`, '', inv[g.id] ? esc(t('gift.have', { n: inv[g.id] })) : '');
    const gifts = V ? Object.values(V.GIFTS).sort((a, b) => a.price - b.price).map(giftTile).join('') : '';
    const sec = (key, note, body) => `<h3>${esc(t(key))}</h3>${note ? `<div class="mute" style="margin-bottom:6px">${esc(t(note))}</div>` : ''}<div class="giftgrid">${body}</div>`;
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('shop.title'))}</h2><div class="money big">💰 ${Math.floor(money)}</div><div class="mute" style="margin:6px 0">${esc(t('shop.note'))}</div>
      ${sec('shop.sec_bed', 'shop.bed_note', bed)}${sec('shop.sec_daily', '', G.SHOP.filter(i => i.cat === 'daily').map(item).join(''))}${sec('shop.sec_decor', 'shop.decor_note', G.SHOP.filter(i => i.cat === 'decor').map(item).join(''))}${sec('shop.sec_gifts', 'shop.gift_note', gifts)}
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="shclose" class="primary">${esc(t('btn.close'))}</button></div>`, true);
    dlg.scrollTop = keep;
    dlg.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { if (G.buy(b.dataset.b)) { U.renderRoom(true); U.renderClock(); U.shopDialog(); } });
    dlg.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { if (G.buyGift(b.dataset.g)) { U.renderClock(); U.shopDialog(); } });
    dlg.querySelectorAll('[data-bed]').forEach(b => b.onclick = () => { if (G.buyBed()) { U.renderRoom(true); U.renderClock(); U.shopDialog(); } });
    dlg.querySelector('#shclose').onclick = U.closeDialog;
  };

  /* 第一次有了角色之后，走开局的后两步 */
  U.maybeIntro = function () { if (!G.world.intro_done) U.introDialog(); };
  /* 开局第二步和第三步：先选你是谁，再是来到老屋，南丁格尔走出来。第一步是选家庭配置，在 U.onboard。
     选好之前第一位来客不来；故事读完才记下开局完成，南丁格尔随后从时空门走进院子 */
  U.introDialog = function () {
    G.world.story_pending = true;
    const finish = () => { G.world.intro_done = true; G.world.story_pending = false; G.save(true); U.closeDialog(); U.renderLife(); U.renderControls(); U.renderRoom(true); G.maybeArrive(); };
    const story = () => {
      const d2 = U.dialog(`<h2 style="margin-top:0">${esc(t('start.house_title'))}</h2><p>${esc(t('start.house_p1'))}</p><p>${esc(t('start.house_p2', { name: t('visitor.nightingale.name') }))}</p>
        <p class="settle-line">${esc(t('start.house_say'))}</p><p class="mute">${esc(t('start.house_p3'))}</p>
        <div class="row" style="justify-content:flex-end;margin-top:10px"><button id="introok" class="primary">${esc(t('start.go'))}</button></div>`, true);
      d2.querySelector('#introok').onclick = finish;
    };
    const cands = () => G.people.filter(p => !p.person.visitor && p.person.active !== false && G.canLead(p));
    const pickLead = () => {
      const list = cands();
      if (!list.length) return story();
      if (!G.protagonist()) G.setProtagonist(list[0].id);
      const cur = G.protagonist(), hint = t('start.lead_note', { btn: t('people.lead') });
      const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('start.lead_title'))}</h2><div class="mute" style="margin:6px 0 10px">${esc(hint)}</div>
        <div class="tiles">${list.map(p => `<button class="tile ${cur && cur.id === p.id ? 'on' : ''}" data-lead="${p.id}"><div style="width:56px;height:70px;margin:0 auto">${CY.avatar(p)}</div><b>${esc(p.person.name)}</b></button>`).join('')}</div>
        <div class="row" style="justify-content:flex-end;margin-top:10px"><button id="leadnext" class="primary">${esc(t('start.next'))}</button></div>`, true);
      dlg.querySelectorAll('[data-lead]').forEach(b => b.onclick = () => { G.setProtagonist(b.dataset.lead); dlg.querySelectorAll('[data-lead]').forEach(x => x.classList.toggle('on', x === b)); U.afterPeopleChange(); });
      dlg.querySelector('#leadnext').onclick = story;
    };
    pickLead();
  };

  /* 一句话提示，几秒后消失 */
  U.flash = function (msg) {
    const el = $('modeToast');
    el.textContent = msg; el.style.display = 'block'; clearTimeout(U._mt); U._mt = setTimeout(() => { el.style.display = 'none'; }, 6000);
  };

})(globalThis.CY = globalThis.CY || {});
