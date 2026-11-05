/* 开局引导。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  U.renderLife = function () {};

  /* 商店：点钱的格子直接打开。所有东西一个样子：图标，名字，价格，点一下格子在弹窗里看说明。分四块：床位，日用品，装饰，送客人的礼物。
     床位决定家里最多住几个人，家人和穿越者都占，很贵，一张一张买；装饰纯粹是观感，没有数值；礼物买了进背包，每样最多备三件。没有限时，没有折扣 */
  U.shopDialog = function () {
    const V = CY.visitors, inv = G.giftInv(), money = G.world.money || 0, old = document.querySelector('#modal .box'), keep = old ? old.scrollTop : 0;
    /* 格子里只有图标，名字，价格：说明太占地方，点一下格子，在弹窗里看。info 是弹窗的编号：item:商品，gift:礼物，bed */
    const tile = (icon, name, label, extra, info) => `<div class="gift shoptile" data-info="${esc(info)}" tabindex="0"><span class="tinfo" aria-hidden="true">ⓘ</span><div>${icon}</div><div>${esc(name)}</div><div class="mute">${extra || '&nbsp;'}</div>${label}</div>`;
    const item = it => {
      const own = G.owned(it.id), can = G.canBuy(it.id);
      return tile(it.icon, t('shop.' + it.id), own ? `<button disabled>${esc(t('shop.owned'))}</button>` : `<button data-b="${it.id}" ${can ? '' : 'disabled'}>💰 ${it.price}</button>`, '', 'item:' + it.id);
    };
    const bp = G.bedPrice();
    const bed = tile('🛏', t('shop.bed_slot'), bp === null ? `<button disabled>${esc(t('shop.full'))}</button>` : `<button data-bed="1" ${G.canBuyBed() ? '' : 'disabled'}>💰 ${bp}</button>`, esc(t('shop.beds_now', { n: G.guestBedsOwned(), m: G.GUEST_BED_MAX, u: G.guestBedsOwned() - G.guestRoom() })), 'bed');
    const giftTile = g => tile(g.icon, t('gift.' + g.id), `<button data-g="${g.id}" ${money < g.price || (inv[g.id] || 0) >= G.DOOR.gift_max ? 'disabled' : ''}>💰 ${g.price}</button>`, inv[g.id] ? esc(t('gift.have', { n: inv[g.id] })) : '', 'gift:' + g.id);
    const gifts = V ? Object.values(V.GIFTS).sort((a, b) => a.price - b.price).map(giftTile).join('') : '';
    const sec = (key, note, body, wide) => `<h3>${esc(t(key))}</h3>${note ? `<div class="mute" style="margin-bottom:6px">${esc(t(note))}</div>` : ''}<div class="giftgrid${wide ? ' wide' : ''}">${body}</div>`;
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('shop.title'))}</h2><div class="money big">💰 ${Math.floor(money)}</div><div class="mute" style="margin:6px 0">${esc(t('shop.note'))}</div>
      ${sec('shop.sec_bed', '', bed)}${sec('shop.sec_daily', '', G.SHOP.filter(i => i.cat === 'daily').map(item).join(''))}${sec('shop.sec_decor', 'shop.decor_note', G.SHOP.filter(i => i.cat === 'decor').map(item).join(''))}${sec('shop.sec_gifts', 'shop.gift_note', gifts)}
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="shclose" class="primary">${esc(t('btn.close'))}</button></div>`, true);
    dlg.scrollTop = keep;
    dlg.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { if (G.buy(b.dataset.b)) { U.renderRoom(true); U.renderClock(); U.shopDialog(); } });
    dlg.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { if (G.buyGift(b.dataset.g)) { U.renderClock(); U.shopDialog(); } });
    dlg.querySelectorAll('[data-bed]').forEach(b => b.onclick = () => { if (G.buyBed()) { U.renderRoom(true); U.renderClock(); U.shopDialog(); } });
    dlg.querySelector('#shclose').onclick = U.closeDialog;
    let tipBox = document.getElementById('shopTip');
    if (!tipBox) { tipBox = document.createElement('div'); tipBox.id = 'shopTip'; tipBox.className = 'shoptip'; document.body.appendChild(tipBox); }
    tipBox.style.display = 'none';
    dlg.querySelectorAll('[data-info]').forEach(el => {
      const open = e => { if (e.target.closest && e.target.closest('button')) return; U.shopTip(null); U.shopInfo(el.dataset.info); };
      el.onclick = open; el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); } };
      el.onpointerenter = e => { if (!e.pointerType || e.pointerType === 'mouse') U.shopTip(el); };
      el.onpointerleave = () => U.shopTip(null);
      el.onfocus = () => U.shopTip(el); el.onblur = () => U.shopTip(null);
    });
    dlg.addEventListener('scroll', () => U.shopTip(null));
  };

  /* 礼物适合送给谁：只说哪一类领域的人会喜欢，不点名字，也不说有几位，让玩家自己猜，猜对了才有惊喜。没有人想要才直说 */
  U.giftHint = id => {
    const V = CY.visitors, who = Object.values(V.cards).filter(c => (c.wants || []).includes(id));
    if (!who.length) return t('gift.hint_none');
    const by = {}; for (const c of who) by[c.field] = (by[c.field] || 0) + 1;
    const top = Object.entries(by).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 2).map(x => t('field.' + x[0]));
    return t('gift.hint_fields', { fields: top.join(t('sep.list')) });
  };

  /* 一件东西的说明：图标，名字，说明，价格。悬停气泡和点开的弹窗共用 */
  U.shopInfoData = function (info) {
    const [kind, id] = info.split(':');
    if (kind === 'item') {
      const it = G.SHOP.find(x => x.id === id); if (!it) return null;
      return { icon: it.icon, name: t('shop.' + id), price: it.price, body: `<p>${esc(t('shop.' + id + '_fx'))}</p>${it.needs && !G.owned(it.needs) ? `<p class="mute">${esc(t('shop.locked'))}</p>` : ''}` };
    }
    if (kind === 'gift') {
      const g = CY.visitors.GIFTS[id]; if (!g) return null;
      return { icon: g.icon, name: t('gift.' + id), price: g.price, tip: `<p>${esc(U.giftHint(id))}</p>`, body: `<p>${esc(U.giftHint(id))}</p><p class="mute">${esc(t('shop.gift_note'))}</p>` };
    }
    return { icon: '🛏', name: t('shop.bed_slot'), price: G.bedPrice() === null ? '' : G.bedPrice(), body: `<p>${esc(t('shop.bed_slot_fx'))}</p><p>${esc(t('shop.bed_note'))}</p><p class="mute">${esc(t('shop.beds_now', { n: G.guestBedsOwned(), m: G.GUEST_BED_MAX, u: G.guestBedsOwned() - G.guestRoom() }))}</p>` };
  };
  /* 说明弹窗：触屏没有悬停，点一下格子打开这个；关掉回到商店 */
  U.shopInfo = function (info) {
    const d = U.shopInfoData(info); if (!d) return;
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(d.icon)} ${esc(d.name)}</h2>${d.body}${d.price !== '' ? `<div class="money">💰 ${esc(d.price)}</div>` : ''}
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="shback" class="primary">${esc(t('shop.back'))}</button></div>`);
    dlg.querySelector('#shback').onclick = () => U.shopDialog();
  };
  /* 悬停或键盘聚焦在格子上就出说明气泡，移开就收起；不用点进去。气泡在格子上方，放不下放下方，不出窗口 */
  U.shopTip = function (el) {
    const tip = document.getElementById('shopTip');
    if (!el) { if (tip) tip.style.display = 'none'; return; }
    const d = U.shopInfoData(el.dataset.info); if (!d || !tip) return;
    tip.innerHTML = `<b>${esc(d.icon)} ${esc(d.name)}</b>${d.tip || d.body}${d.price !== '' ? `<div class="money">💰 ${esc(d.price)}</div>` : ''}`;
    tip.style.display = 'block';
    const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    let top = r.top - h - 8; if (top < 8) top = r.bottom + 8;
    tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    tip.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, top)) + 'px';
  };

  /* 第一次有了角色之后，走开局的后两步 */
  U.maybeIntro = function () { if (!G.world.intro_done) U.introDialog(); };
  /* 开局第二步和第三步：先选你是谁，再是来到老屋，南丁格尔走出来。第一步是选家庭配置，在 U.onboard。
     选好之前第一位来客不来；故事读完才记下开局完成，南丁格尔随后从大门走进院子 */
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

  /* 一句话提示，几秒后消失；画在游戏窗体里面，不在窗体之外 */
  U.flash = function (msg) {
    const el = $('modeToast');
    if (!el) return;
    el.textContent = msg; el.style.display = 'block'; clearTimeout(U._mt); U._mt = setTimeout(() => { el.style.display = 'none'; }, 6000);
  };

})(globalThis.CY = globalThis.CY || {});
