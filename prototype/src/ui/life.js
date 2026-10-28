/* 照顾的代价：生活栏，任务条，商店，开局体验选择。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  /* ---------- 照顾的代价：居家办公的提示条、钱、商店、家人与保姆、体验选择 ---------- */
  U.renderLife = function () {
    const bar = $('lifeBar'), eco = G.economyOn(), people = G.activePeople();
    const show = ini.bool(G.cfg, 'ui', 'wfh_notice') && people.length > 0;
    bar.style.display = show ? '' : 'none';
    if (!show) return;
    const work = G.isWorkTime();
    const sig = [eco, work, Math.floor(G.world.money), people.length, I.lang, JSON.stringify(G.world.inv || {})].join('|');
    if (bar.dataset.sig === sig) return;
    bar.dataset.sig = sig;
    const n = people.length;
    bar.innerHTML = `<span class="wfh">💼 ${esc(t(eco ? (work ? 'life.working' : 'life.offwork') : 'life.wfh', { n }))}</span>` +
      (eco ? `<span class="money" title="${esc(t('life.money_tip'))}">💰 ${Math.floor(G.world.money)}</span><button id="shopBtn">${esc(t('life.shop'))}</button>` : '');
    if ($('shopBtn')) $('shopBtn').onclick = () => U.shopDialog();
  };

  U.shopDialog = function () {
    const items = G.tpl.items.items || {};
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('shop.title'))}</h2><div class="mute" style="margin-bottom:6px">${esc(t('shop.note'))}</div>
      <div class="money big">💰 ${Math.floor(G.world.money)}</div>
      ${Object.keys(items).map(k => `<div class="shoprow"><span class="ic">${items[k].icon}</span><span class="nm">${esc(CY.tOr('item.' + k, items[k].label))}</span><span class="mute">${esc(t('shop.have', { n: G.world.inv[k] || 0 }))}</span><span class="pr">${items[k].price}</span>
        <button data-b="${k}" data-n="1" ${G.world.money < items[k].price ? 'disabled' : ''}>＋1</button><button data-b="${k}" data-n="5" ${G.world.money < items[k].price * 5 ? 'disabled' : ''}>＋5</button></div>`).join('')}
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button id="shclose">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { G.buy(b.dataset.b, +b.dataset.n); U.shopDialog(); U.renderLife(); });
    dlg.querySelector('#shclose').onclick = U.closeDialog;
  };

  /* 家人与保姆：按谁最需要你排列，保姆能分担，但在场的效果打折 */

  /* 第一次有了角色之后，讲清楚照顾的代价，并让玩家选一种模式开始 */
  U.maybeIntro = function () { if (!G.world.intro_done) U.introDialog(); };
  U.introDialog = function () {
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('intro.title'))}</h2><p>${esc(t('intro.p1'))}</p><p>${esc(t('intro.p2'))}</p>
      <button class="preset" data-e="light"><b>${esc(t('intro.light'))}</b><br><span class="mute">${esc(t('intro.light_note'))}</span></button>
      <button class="preset" data-e="full"><b>${esc(t('intro.full'))}</b><br><span class="mute">${esc(t('intro.full_note'))}</span></button>
      <div class="mute">${esc(t('intro.later'))}</div>`, true);
    dlg.querySelectorAll('[data-e]').forEach(b => b.onclick = async () => {
      G.cfg.play = G.cfg.play || {};
      G.cfg.play.economy = b.dataset.e === 'full' ? 'true' : 'false';
      G.world.intro_done = true; G.save(true); await G.saveCfg();
      U.closeDialog(); U.renderLife(); U.renderControls(); U.renderRoom(true);
    });
  };

  /* 一句话提示，几秒后消失 */
  U.flash = function (msg) {
    const el = $('modeToast');
    el.textContent = msg; el.style.display = 'block'; clearTimeout(U._mt); U._mt = setTimeout(() => { el.style.display = 'none'; }, 6000);
  };

})(globalThis.CY = globalThis.CY || {});
