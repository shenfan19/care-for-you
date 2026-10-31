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
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="hpclose">${esc(t('btn.close'))}</button></div>`, true);
    const done = () => { U.closeDialog(); U.afterPeopleChange(); U.renderClock(); };
    const h = dlg.querySelector('#nnhire'); if (h) h.onclick = async () => { await G.hireNanny(); done(); };
    const tp = dlg.querySelector('#nntip'); if (tp) tp.onclick = () => { G.tipNanny(); U.helpDialog(); U.renderClock(); };
    const d = dlg.querySelector('#nndis'); if (d) d.onclick = async () => { await G.dismissNanny(); done(); };
    dlg.querySelector('#hpclose').onclick = U.closeDialog;
  };

  /* 第一次有了角色之后，讲清楚照顾的代价 */
  U.maybeIntro = function () { if (!G.world.intro_done) U.introDialog(); };
  U.introDialog = function () {
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('intro.title'))}</h2><p>${esc(t('intro.p1'))}</p><p>${esc(t('intro.p2'))}</p>
      <div class="mute">${esc(t('intro.later'))}</div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button id="introok" class="primary">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelector('#introok').onclick = () => { G.world.intro_done = true; G.save(true); U.closeDialog(); U.renderLife(); U.renderControls(); U.renderRoom(true); };
  };

  /* 一句话提示，几秒后消失 */
  U.flash = function (msg) {
    const el = $('modeToast');
    el.textContent = msg; el.style.display = 'block'; clearTimeout(U._mt); U._mt = setTimeout(() => { el.style.display = 'none'; }, 6000);
  };

})(globalThis.CY = globalThis.CY || {});
