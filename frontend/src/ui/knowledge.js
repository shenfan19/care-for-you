/* 知识与参考文献：设置里打开。游戏里每个有现实依据的节奏都列在这里，写清游戏里是多少，现实里是多少，出处是什么，没有出处的就写游戏设定。
   游戏里的数从实时的需求速率算，现实的数和文献来自 CY.references，所以改了数值页面跟着变。涉及疾病和用药的地方固定写明不是医疗建议。 */
(function (CY) {
  const G = CY.game, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v), esc = U.esc, R = CY.references;
  const pick = o => (o ? o[CY.i18n.lang] || (/^zh/.test(CY.i18n.lang) ? o['zh-CN'] : '') || o.en || '' : '');
  const fmtH = h => (h >= 10 ? Math.round(h) : Math.round(h * 10) / 10) + ' h';

  U.knowledgeDialog = function () {
    const stage = s => (s === 'all' ? t('know.stage_all') : t('know.stage_' + s));
    const badge = st => `<span class="kbadge ${st}">${esc(t('know.' + st))}</span>`;
    const refs = it => (it.refs || []).map(id => { const s = R.sources[id]; return `<li>${esc(s.cite)}${s.url ? ` <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">link</a>` : ''}</li>`; }).join('');
    const needLabel = k => CY.tOr('need.' + k, (((G.tpl.species.human || {}).needs || {})[k] || {}).label || k);
    const rows = R.rows().map(r => {
      const it = r.item, real = it ? pick(it.real) : pick(R.setting);
      const game = r.ivs.map(x => `${esc(stage(x.stage))} ${fmtH(x.h)}`).join(' · ');
      const hr = it && it.real_h ? ` (${it.real_h[0] === it.real_h[1] ? it.real_h[0] : it.real_h[0] + '-' + it.real_h[1]} h)` : '';
      return `<details class="kn"><summary><b>${esc(needLabel(r.need))}</b> ${badge(it ? it.status : 'setting')}<span class="mute"> ${esc(t('know.game'))}: ${game}${esc(hr ? ' · ' + t('know.real_short') + hr : '')}</span></summary>
        <div class="kbody"><p>${esc(real)}</p>${it && it.note ? `<p class="mute">${esc(pick(it.note))}</p>` : ''}${it && it.refs ? `<ul class="krefs">${refs(it)}</ul>` : ''}</div></details>`;
    }).join('');
    const fo = R.items.find(i => i.id === 'focus'), F = G.FOCUS || { floor: 0.1, minutes: 20 };
    const conds = Object.keys(G.tpl.conditions || {}).map(c => `<li>${esc(CY.tOr('cond.' + c, (G.tpl.conditions[c] || {}).label || c))}</li>`).join('');
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('set.know'))}</h2>
      <p class="warn">${esc(pick(R.medical))}</p>
      <p class="mute">${esc(t('know.intro'))} ${esc(t('know.checked'))}</p>
      <h3>${esc(t('know.sec_needs'))}</h3>${rows}
      <h3>${esc(t('know.sec_focus'))}</h3>
      <details class="kn" open><summary><b>${esc(t('know.focus'))}</b> ${badge(fo.status)}<span class="mute"> ${esc(t('know.game'))}: ${Math.round(F.floor * 100)}% → 100% / ${F.minutes} min</span></summary>
        <div class="kbody"><p>${esc(pick(fo.real))}</p><p class="mute">${esc(pick(fo.note))}</p><ul class="krefs">${refs(fo)}</ul></div></details>
      <h3>${esc(t('know.sec_cond'))}</h3><p class="mute">${esc(t('know.cond_note'))}</p><ul>${conds}</ul>
      <h3>${esc(t('know.sec_other'))}</h3><p class="mute">${esc(t('know.other'))}</p>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="kclose" class="primary">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelector('#kclose').onclick = U.closeDialog;
  };
})(globalThis.CY = globalThis.CY || {});
