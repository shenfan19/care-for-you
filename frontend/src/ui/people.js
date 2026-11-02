/* 角色管理，角色的状态面板。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  /* ---------- 角色管理：添加，编辑，归档，删除放在一起，在顶部菜单里 ---------- */
  U.peopleDialog = function () {
    const rows = G.people.map(p => `<div class="prow" data-id="${p.id}"><span class="pav">${CY.avatar(p)}</span><span class="pn"><b>${esc(p.person.name)}</b> <span class="mute">${esc(p.person.role || '')}${p.person.archived ? ' · ' + esc(t('people.archived')) : p.person.active === false ? ' · ' + esc(t('bar.away', { name: '' }).trim()) : ''}</span></span>
      ${G.canLead(p) && p.person.active !== false ? `<button data-a="lead" ${G.protagonist() === p ? 'class="primary"' : ''}>${esc(t(G.protagonist() === p ? 'people.lead_on' : 'people.lead'))}</button>` : ''}<button data-a="edit">${esc(t('btn.edit'))}</button>${p.person.archived ? `<button data-a="restore">${esc(t('btn.restore'))}</button>` : p.person.active === false ? `<button data-a="restore">${esc(t('bar.recall'))}</button>` : `<button data-a="archive">${esc(t('btn.archive'))}</button>`}<button data-a="del" class="danger">${esc(t('btn.delete'))}</button></div>`).join('');
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('people.title'))}</h2>
      <div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="mute">${esc(t('people.note'))}</span><button id="pAdd" class="primary">${esc(t('btn.add'))}</button></div>
      <div class="plist">${rows || `<div class="mute">${esc(t('said.nobody'))}</div>`}</div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button id="pClose">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelector('#pClose').onclick = U.closeDialog;
    dlg.querySelector('#pAdd').onclick = () => U.addDialog(null, () => U.peopleDialog());
    dlg.querySelectorAll('.prow button').forEach(b => b.onclick = async () => {
      const id = b.closest('.prow').dataset.id, a = b.dataset.a;
      if (a === 'lead') { G.setProtagonist(G.protagonist() && G.protagonist().id === id ? null : id); U.afterPeopleChange(); U.peopleDialog(); }
      else if (a === 'edit') U.addDialog(null, () => U.peopleDialog(), id);
      else if (a === 'archive') { await G.archivePerson(id, true); U.afterPeopleChange(); U.peopleDialog(); }
      else if (a === 'restore') { await G.setActive(id, true); U.afterPeopleChange(); U.peopleDialog(); }
      else if (a === 'del') U.deleteDialog(id, () => U.peopleDialog());
    });
  };

  /* ---------- 角色卡：这一类角色的明文 YAML，只读，可以复制 ---------- */
  U.cardDialog = async function (pid) {
    const p = G.get(pid); if (!p) return;
    const id = p.person.card || p.person.archetype, text = (id && await CY.store.read(`templates/cards/${id}.yaml`)) || '';
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('card.title'))} · ${esc(p.person.role || p.person.name)}</h2><div class="mute" style="margin-bottom:6px">${esc(t('card.note', { file: 'templates/cards/' + (id || '') + '.yaml' }))}</div>
      <pre class="cardtext">${esc(text || t('card.none'))}</pre>
      <div class="row" style="justify-content:space-between;margin-top:10px"><button id="ccopy">${esc(t('card.copy'))}</button><button id="cback">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelector('#ccopy').onclick = async () => { try { await navigator.clipboard.writeText(text); } catch (e) {} };
    dlg.querySelector('#cback').onclick = () => U.statusDialog(pid);
  };

  /* ---------- 观察：疾病模型给出的读数。需要先做一次（测血糖，量血压）才看得到的读数，没做过就写怎么才能看到；看不到不是坏事，没有任何惩罚 ---------- */
  const spark = (hist, scale, tone) => {
    if (!hist || hist.length < 3) return '';
    const lo = scale ? scale[0] : Math.min(...hist), hi = scale ? scale[1] : Math.max(...hist), W = 96, H = 22, span = (hi - lo) || 1;
    const pts = hist.map((v, i) => (i / (hist.length - 1) * W).toFixed(1) + ',' + (H - 2 - Math.min(1, Math.max(0, (v - lo) / span)) * (H - 4)).toFixed(1)).join(' ');
    return `<svg class="spark ${tone || ''}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  };
  U.observeHtml = p => {
    if (!CY.lm || !CY.lm.ready || !G.isHuman(p) || !(p.person.conditions || []).length) return '';
    const rows = CY.lm.readouts(p.id);
    if (!rows.length) return '';
    const acts = G.allActionsOf(p);
    const body = rows.map(r => {
      const label = U.pickLang(r, 'label') || r.id;
      if (r.value === null) {
        const a = r.reveal_by.map(k => acts[k]).find(x => x && !x.selfonly) || r.reveal_by.map(k => acts[k]).find(Boolean);
        return `<div class="obs"><span class="l">${esc(label)}</span><span class="v mute">${esc(a ? t('obs.measure', { act: a.label }) : t('obs.none'))}</span></div>`;
      }
      const num = r.value.toFixed(r.decimals) + (r.unit ? ' ' + r.unit : ''), arrow = r.reveal_by.length || !r.trend ? '' : r.trend > 0 ? ' ↗' : ' ↘';
      return `<div class="obs"><span class="l">${esc(label)}</span><span class="v obs-${r.tone || 'ok'}"><b>${esc(num)}</b>${arrow} ${esc(U.pickLang(r, 'word'))}</span>${r.reveal_by.length ? '' : spark(r.history, r.scale, 'obs-' + (r.tone || 'ok'))}</div>`;
    }).join('');
    return `<h3>${esc(t('obs.title'))}</h3>${body}`;
  };

  /* ---------- 角色的状态和需求 ---------- */
  U.statusDialog = function (pid) {
    const p = G.get(pid); if (!p) return;
    const st = G.statusOf(p), defs = G.needsOf(p), cls = G.classKey(p);
    const sig = () => U.statusDialog(pid);
    const bars = Object.keys(defs).sort((a, b) => p.state.needs[b] - p.state.needs[a]).map(k => `<div class="srow2"><span class="l">${defs[k].icon || ''} ${esc(G.needLabel(k, defs[k]))}</span><div class="bar"><i style="width:${Math.round(p.state.needs[k] * 100)}%"></i></div></div>`).join('');
    const selfs = Object.values(G.allActionsOf(p)).filter(a => G.canSelf(p, a)).map(a => `<span class="tag">${esc(a.label)}</span>`).join('');
    const made = (G.journal[p.id] ? Object.values(G.journal[p.id]).flat() : []).filter(e => e.type === 'self').slice(-3).reverse().map(e => `<div class="mute" style="font-size:12px">${esc(G.entryText(e))}</div>`).join('');
    const dlg = U.dialog(`<div class="statgrid"><div class="prev">${CY.avatar(p)}</div><div>
      <h2 style="margin:0 0 4px">${esc(p.person.name)} <span class="pill">${esc(p.person.role || '')}</span></h2>
      <div class="mute">${esc(t('class.' + cls))}${G.isHuman(p) ? ' · ' + esc(t('status.age', { n: +G.age(p).toFixed(1) })) : ''}</div>
      ${G.isHuman(p) || p.person.kind === 'animal' ? `<div class="mute">${esc(t('status.at', { room: t('loc.' + CY.world.locationOf(p).room), likes: Object.entries((p.person.prefs && p.person.prefs.rooms) || CY.world.PREFS[G.classKey(p)] || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => t('loc.' + x[0])).join(t('sep.list')) }))}</div>` : ''}
      <div style="margin:6px 0"><span class="tag">${esc(t('mood.' + st.mood))}</span><span class="tag">${esc(t('act.' + st.activity))}</span>${st.crying ? `<span class="tag">${esc(t('status.crying'))}</span>` : ''}
        ${st.conditions.map(k => `<span class="tag">🩺 ${esc(CY.tOr('cond.' + k, (G.tpl.conditions[k] || {}).label || k))}</span>`).join('')}${st.traits.map(k => `<span class="tag">${esc(t('trait.' + k))}</span>`).join('')}</div>
      <div class="srow2"><span class="l">${esc(t('status.mood'))}</span><div class="bar mood"><i style="width:${Math.round(p.state.mood * 100)}%"></i></div></div>
      <div class="srow2"><span class="l">${esc(t('status.frailty'))}</span><div class="bar"><i style="width:${Math.round(p.state.frailty * 100)}%"></i></div></div>
      ${U.observeHtml(p)}
      <h3>${esc(t('status.needs'))}</h3>${bars}
      <h3>${esc(t('status.selfdo', { n: Math.round(st.self_care * 100) }))}</h3><div>${selfs || `<span class="mute">${esc(t('status.selfnone'))}</span>`}</div>${made}
      <div class="row" style="justify-content:space-between;margin-top:12px"><span><button id="stedit">${esc(t('btn.edit'))}</button> <button id="stcard">${esc(t('card.title'))}</button> <button id="starch">${esc(t('btn.archive'))}</button> <button id="stdel">${esc(t('btn.delete'))}</button></span><button id="stclose">${esc(t('btn.close'))}</button></div></div></div>`, true);
    dlg.querySelector('#stclose').onclick = U.closeDialog;
    dlg.querySelector('#stedit').onclick = () => U.addDialog(null, () => {}, pid);
    dlg.querySelector('#stcard').onclick = () => U.cardDialog(pid);
    dlg.querySelector('#starch').onclick = async () => { await G.archivePerson(pid, true); U.closeDialog(); U.afterPeopleChange(); };
    dlg.querySelector('#stdel').onclick = () => U.deleteDialog(pid);
  };
})(globalThis.CY = globalThis.CY || {});
