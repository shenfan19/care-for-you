/* 账号页和分享后的软提示。服务地址没配置时一切都不出现。 */
(function (CY) {
  const G = CY.game, A = CY.account, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v);
  const esc = U.esc;
  const errText = e => { const k = 'acct.err_' + String(e.message).replace(/\W/g, '_'); return CY.i18n.has(k) ? t(k) : t('acct.err_other', { e: e.message }); };

  U.softRegister = box => {
    if (!box || !A.configured(G.cfg)) return;
    box.innerHTML = `<p class="mute" style="margin-top:10px">${esc(t('acct.soft'))} <button id="acctOpen">${esc(t('acct.open'))}</button></p>`;
    box.querySelector('#acctOpen').onclick = () => U.accountDialog();
  };

  U.accountDialog = (step, email) => {
    if (!A.configured(G.cfg)) { const d = U.dialog(`<p>${esc(t('acct.off'))}</p><div class="row" style="justify-content:flex-end"><button class="primary" id="acOk">${esc(t('cal.close'))}</button></div>`); d.querySelector('#acOk').onclick = U.closeDialog; return; }
    step = step || (A.status().signedIn ? 'panel' : 'email');
    let body = '';
    if (step === 'email') body = `<p>${esc(t('acct.intro'))}</p><p class="mute">${esc(t('acct.privacy'))}</p>
      <div class="row"><input id="acEmail" type="email" placeholder="${esc(t('acct.email'))}" style="flex:1" value="${esc(email || '')}"></div>
      <label class="row"><input id="acAdult" type="checkbox"> ${esc(t('acct.adult'))}</label>
      <label class="row"><input id="acConsent" type="checkbox"> ${esc(t('acct.consent'))}</label>
      <div class="row" style="justify-content:flex-end"><button id="acSend" class="primary">${esc(t('acct.send'))}</button></div>`;
    else if (step === 'code') body = `<p>${esc(t('acct.code_sent', { email }))}</p><div class="row"><input id="acCode" inputmode="numeric" maxlength="6" placeholder="000000"></div>
      <div class="row" style="justify-content:flex-end"><button id="acVerify" class="primary">${esc(t('acct.verify'))}</button></div>`;
    else body = `<p>${esc(t('acct.panel_note'))}</p><div class="row"><input id="acPass" type="password" placeholder="${esc(t('acct.pass'))}" style="flex:1"></div>
      <div class="row"><button id="acUp">${esc(t('acct.upload'))}</button><button id="acDown">${esc(t('acct.download'))}</button></div>
      <div class="row"><button id="acOut">${esc(t('acct.signout'))}</button><button id="acDel" class="danger">${esc(t('acct.delete'))}</button></div>`;
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('acct.title'))}</h2>${body}<p id="acMsg" class="mute"></p><div class="row" style="justify-content:flex-end"><button id="acClose">${esc(t('cal.close'))}</button></div>`, true);
    const msg = s => { dlg.querySelector('#acMsg').textContent = s; };
    dlg.querySelector('#acClose').onclick = U.closeDialog;
    const on = (id, fn) => { const b = dlg.querySelector(id); if (b) b.onclick = async () => { try { await fn(); } catch (e) { msg(errText(e)); } }; };
    on('#acSend', async () => {
      const em = dlg.querySelector('#acEmail').value.trim();
      await A.requestCode(G.cfg, em, dlg.querySelector('#acAdult').checked, dlg.querySelector('#acConsent').checked);
      U.accountDialog('code', em);
    });
    on('#acVerify', async () => { await A.verify(G.cfg, email, dlg.querySelector('#acCode').value.trim()); U.accountDialog('panel'); });
    on('#acUp', async () => { const p = dlg.querySelector('#acPass').value; if (p.length < 8) return msg(t('acct.pass_short')); await A.uploadSave(G.cfg, p); msg(t('acct.uploaded')); });
    on('#acDown', async () => {
      const p = dlg.querySelector('#acPass').value; if (p.length < 8) return msg(t('acct.pass_short'));
      const info = await A.downloadSave(G.cfg, p);
      if (!confirm(t('acct.replace_confirm'))) return;
      await CY.archive.apply(info, 'replace'); await G.load(); U.afterPeopleChange(); msg(t('acct.downloaded'));
    });
    on('#acOut', async () => { await A.signOut(); U.accountDialog('email'); });
    on('#acDel', async () => { if (!confirm(t('acct.delete_confirm'))) return; await A.deleteAccount(G.cfg); U.accountDialog('email'); });
  };
})(globalThis.CY = globalThis.CY || {});
