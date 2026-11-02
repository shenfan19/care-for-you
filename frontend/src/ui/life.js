/* 开局引导。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  U.renderLife = function () {};

  /* 家里的帮手：钱从哪来，请不请保姆 */
  U.helpDialog = function () {
    const on = G.nannyOn();
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('help.title'))}</h2>
      <div class="money big">💰 ${Math.floor(G.world.money || 0)}</div>
      <div class="mute" style="margin:6px 0 10px">${esc(t('help.income', { n: G.WAGE, p: G.PENSION }))}</div>
      <h3>${esc(t('nanny.title'))}</h3><div class="mute">${esc(t(on ? 'nanny.status' : 'nanny.note', { n: G.NANNY_DAILY }))}</div>
      ${on && G.nanny() ? `<div class="mute">${esc(t('nanny.mood', { n: Math.round(G.nanny().state.mood * 100) }))}</div><div class="row" style="margin-top:6px"><button id="nntip" ${G.canTip() ? '' : 'disabled'}>${esc(t('nanny.tip', { n: G.NANNY_MOOD.tip_cost }))}</button><span class="mute">${esc(G.world.nanny_tip_day === Math.floor(G.world.game_minutes / 1440) ? t('nanny.tip_done') : G.nannyState() !== 'here' ? t('nanny.tip_wait') : '')}</span></div>` : ''}
      ${on ? `<div class="mute">${esc(t('nanny.st_' + G.nannyState(), { n: G.NANNY_DAILY, from: ini.get(G.cfg, 'economy', 'work_hours').split('-')[0] }))}</div>` : ''}
      <div class="row" style="margin-top:8px">${on ? `<button id="nndis">${esc(t('nanny.dismiss'))}</button>` : `<button id="nnhire" class="primary">${esc(t('nanny.hire'))}</button>`}</div>
      <div class="row" style="margin-top:8px"><button id="hpshop">${esc(t('shop.open'))}</button></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="hpclose">${esc(t('btn.close'))}</button></div>`, true);
    const done = () => { U.closeDialog(); U.afterPeopleChange(); U.renderClock(); };
    const h = dlg.querySelector('#nnhire'); if (h) h.onclick = async () => { await G.hireNanny(); done(); };
    const tp = dlg.querySelector('#nntip'); if (tp) tp.onclick = () => { G.tipNanny(); U.helpDialog(); U.renderClock(); };
    const d = dlg.querySelector('#nndis'); if (d) d.onclick = async () => { await G.dismissNanny(); done(); };
    dlg.querySelector('#hpclose').onclick = U.closeDialog;
    dlg.querySelector('#hpshop').onclick = () => U.shopDialog();
  };
  /* 商店：买了就一直有，没有限时，没有折扣 */
  U.shopDialog = function () {
    const rows = G.SHOP.map(it => {
      const own = G.owned(it.id), can = G.canBuy(it.id), locked = it.needs && !G.owned(it.needs);
      return `<div class="srow" style="align-items:center"><span class="k" style="font-size:20px">${it.icon}</span><span style="flex:1"><b>${esc(t('shop.' + it.id))}</b><br><span class="mute">${esc(t('shop.' + it.id + '_fx'))}</span></span>${own ? `<span class="mute">${esc(t('shop.owned'))}</span>` : `<button data-b="${it.id}" ${can ? '' : 'disabled'}>${locked ? esc(t('shop.locked')) : '💰 ' + it.price}</button>`}</div>`;
    }).join('');
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('shop.title'))}</h2><div class="money big">💰 ${Math.floor(G.world.money || 0)}</div><div class="mute" style="margin:6px 0">${esc(t('shop.note'))}</div><div class="sform">${rows}</div><div class="row" style="justify-content:space-between;margin-top:12px"><button id="shback">${esc(t('ob.back'))}</button><button id="shclose">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { if (G.buy(b.dataset.b)) { U.renderRoom(true); U.renderClock(); U.shopDialog(); } });
    dlg.querySelector('#shback').onclick = () => U.helpDialog();
    dlg.querySelector('#shclose').onclick = U.closeDialog;
  };

  /* 第一次有了角色之后，讲清楚照顾的代价 */
  U.maybeIntro = function () { if (!G.world.intro_done) U.introDialog(); };
  U.introDialog = function () {
    const BG = ['layoff', 'return', 'house'];
    const finish = () => { G.world.intro_done = true; G.save(true); U.closeDialog(); U.renderLife(); U.renderControls(); U.renderRoom(true); G.maybeArrive(); };
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('start.title'))}</h2><p>${esc(t('start.p1'))}</p><p>${esc(t('start.p2'))}</p>
      <div class="tiles">${BG.map(b => `<button class="tile" data-bg="${b}"><b>${esc(t('start.bg_' + b))}</b><span class="mute">${esc(t('start.bg_' + b + '_note'))}</span></button>`).join('')}</div>`, true);
    dlg.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => {
      G.chooseBackground(b.dataset.bg);
      const d2 = U.dialog(`<h2 style="margin-top:0">${esc(t('start.title'))}</h2><p>${esc(t('start.story_' + b.dataset.bg))}</p><p>${esc(t('start.door'))}</p><div class="mute">${esc(t('start.later'))}</div>
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
