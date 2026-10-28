/* 添加角色，编辑角色，引导。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  /* ---------- 添加角色 ---------- */
  U.archName = id => CY.tOr('arch.' + id, (C.archOf(id) || {}).role || id);
  U.addDialog = function (archId, done, editPid) {
    const O = CY.avatarOptions;
    const editP = editPid && G.get(editPid);
    const arch0 = (editP && C.archOf(editP.person.archetype)) || C.archOf(archId) || C.archetypes[0];
    const st = editP
      ? { arch: arch0.id, name: editP.person.name, pronoun: editP.person.pronoun, age: G.isHuman(editP) ? G.age(editP) : arch0.age, look: Object.assign({}, editP.person.appearance), cond: (editP.person.conditions || [])[0] || '', traits: (editP.person.traits || []).slice(), helper: !!editP.person.helper }
      : { arch: arch0.id, name: '', pronoun: arch0.pronoun, age: arch0.age, look: Object.assign({}, arch0.look), cond: '', traits: [], helper: !!(arch0.help && arch0.help.proactive) };
    const sw = (k, vals, cur, hexOf) => `<span class="sws">${vals.map((v, i) => `<span class="sw ${String(cur) === String(v) ? 'on' : ''}" data-k="${k}" data-v="${v}" style="background:${hexOf ? hexOf(v, i) : v}"></span>`).join('')}</span>`;
    const sel = (k, vals, labels, cur) => `<select data-s="${k}">${vals.map((v, i) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(labels[i])}</option>`).join('')}</select>`;
    const GROUPS = ['family', 'animal', 'plant'];
    function render() {
      const arch = C.archOf(st.arch), human = arch.species === 'human';
      const archSel = GROUPS.map(g => `<optgroup label="${esc(t('add.group_' + g))}">${C.archetypes.filter(a => a.group === g).map(a => `<option value="${a.id}" ${a.id === st.arch ? 'selected' : ''}>${esc(U.archName(a.id))}</option>`).join('')}</optgroup>`).join('');
      const look = st.look, stage = C.stageOf(st.age);
      const dlg = U.dialog(`<div class="addgrid"><div class="prev">${CY.avatarPreview(arch, look, st.age)}</div><div>
        <div class="row"><input id="an" placeholder="${esc(t('add.name_ph'))}" value="${esc(st.name)}" style="flex:1"><select id="aa" ${editP ? 'disabled' : ''}>${archSel}</select></div>
        ${human ? `<div class="row">${esc(t('add.age'))} <input id="aage" type="number" min="0" max="110" step="0.25" value="${st.age}" style="width:72px"> <span class="pill">${esc(t('stage.' + stage))}</span>
          ${esc(t('add.pronoun'))} ${sel('pronoun', ['他', '她', '它'], [t('pron.he'), t('pron.she'), t('pron.it')], st.pronoun)}</div>
          <div class="mute stagenote">${esc(t('stage.note.' + stage))}</div>
          <div class="row">${esc(t('add.glasses'))} ${sel('glasses', O.glasses, O.glasses.map(g => t('glasses.' + g)), look.glasses === true ? 'round' : look.glasses || 'none')}
          <label><input type="checkbox" id="abeard" ${look.beard ? 'checked' : ''}> ${esc(t('add.beard'))}</label></div>
          <div class="row">${esc(t('add.skin'))} ${sw('skin', O.skin.map((_, i) => i), look.skin, v => O.skin[v])} ${esc(t('add.haircolor'))} ${sw('hair_color', O.hairColor, look.hair_color, v => O.hairColorHex[v])}</div>
          <div class="row">${esc(t('add.hair'))} ${sel('hair_style', O.hairStyle, O.hairStyle.map(h => t('hair.' + h)), look.hair_style)} ${esc(t('add.cloth'))} ${sw('cloth', O.clothes, look.cloth)}</div>
          <div class="row">${esc(t('add.cond'))} ${sel('cond', ['', ...Object.keys(G.tpl.conditions)], [t('add.cond_none'), ...Object.keys(G.tpl.conditions).map(c => CY.tOr('cond.' + c, G.tpl.conditions[c].label))], st.cond)}</div>`
        : `<div class="row">${esc(t('add.coat'))} ${sw('coat', O.coatBySpecies[arch.species] || O.coat, look.coat, v => O.coatHex[v])}</div><div class="mute stagenote">${esc(t('kind.note.' + (arch.group === 'plant' ? 'plant' : 'animal')))}</div>`}
        ${human && !['infant', 'toddler'].includes(stage) ? `<label class="row"><input type="checkbox" id="ahelper" ${st.helper ? 'checked' : ''}> ${esc(t('add.helper'))}</label>` : ''}
        <div class="row">${esc(t('add.traits'))} <span class="chips inl">${C.TRAITS.map(k => `<button class="chip ${st.traits.includes(k) ? 'on' : ''}" data-tr="${k}" title="${esc(t('trait.' + k + '_tip'))}">${esc(t('trait.' + k))}</button>`).join('')}</span></div>
        <div class="row" style="justify-content:flex-end;margin:12px 0 0"><button id="acancel">${esc(t('btn.cancel'))}</button><button id="aok" class="primary">${esc(t(editP ? 'btn.save' : 'add.ok'))}</button></div></div></div>`, true);
      dlg.querySelector('#an').oninput = e => { st.name = e.target.value; };
      dlg.querySelector('#aa').onchange = e => {
        const a = C.archOf(e.target.value); st.arch = a.id; st.pronoun = a.pronoun; st.age = a.age; st.look = Object.assign({}, a.look); st.helper = !!(a.help && a.help.proactive);
        if (a.species !== 'human') st.cond = '';
        render();
      };
      dlg.querySelectorAll('[data-tr]').forEach(b => b.onclick = () => { const k = b.dataset.tr, i = st.traits.indexOf(k); if (i >= 0) st.traits.splice(i, 1); else if (st.traits.length < 2) st.traits.push(k); render(); });
      const ag = dlg.querySelector('#aage');
      if (ag) ag.onchange = () => { const v = parseFloat(ag.value); st.age = isNaN(v) ? 35 : Math.min(110, Math.max(0, v)); render(); };
      dlg.querySelectorAll('.sw').forEach(s => s.onclick = () => { st.look[s.dataset.k] = s.dataset.k === 'skin' ? +s.dataset.v : s.dataset.v; render(); });
      dlg.querySelectorAll('select[data-s]').forEach(s => s.onchange = () => {
        const k = s.dataset.s;
        if (k === 'pronoun' || k === 'cond') st[k] = s.value; else st.look[k] = s.value;
        render();
      });
      const hp = dlg.querySelector('#ahelper'); if (hp) hp.onchange = () => { st.helper = hp.checked; };
      const bd = dlg.querySelector('#abeard'); if (bd) bd.onchange = () => { st.look.beard = bd.checked; render(); };
      dlg.querySelector('#acancel').onclick = () => { U.closeDialog(); done && done(false); };
      dlg.querySelector('#aok').onclick = async () => {
        if (editP) {
          const first = (editP.person.conditions || [])[0] || '';
          let conds = (editP.person.conditions || []).slice();
          if (st.cond !== first) { conds = conds.filter(c => c !== first); if (st.cond) conds.unshift(st.cond); }
          await G.updatePerson(editP.id, { name: st.name, pronoun: st.pronoun, age: st.age, look: st.look, traits: st.traits, conditions: conds, helper: st.helper });
          U.closeDialog(); U.afterPeopleChange(); done && done(true);
          return;
        }
        const a = C.archOf(st.arch), role = U.archName(a.id);
        await G.createPerson({ arch: a.id, name: st.name.trim() || role, roleText: role, pronoun: st.pronoun, age: st.age, look: st.look, traits: st.traits, conditions: st.cond ? [st.cond] : [], helper: st.helper });
        await G.load(); U.closeDialog(); U.afterPeopleChange(); done && done(true);
      };
    }
    render();
  };

  /* 删除前确认：记录会一起没有，所以把归档作为另一条路摆在旁边 */
  U.deleteDialog = function (pid, back) {
    const p = G.get(pid); if (!p) return;
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('del.title', { name: p.person.name }))}</h2><div class="mute">${esc(t('del.note', { name: p.person.name }))}</div>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button id="dcancel">${esc(t('btn.cancel'))}</button>${p.person.archived ? '' : `<button id="darch">${esc(t('btn.archive'))}</button>`}<button id="dok" class="danger">${esc(t('btn.delete'))}</button></div>`, true);
    dlg.querySelector('#dcancel').onclick = () => { U.closeDialog(); back && back(); };
    const da = dlg.querySelector('#darch'); if (da) da.onclick = async () => { await G.archivePerson(pid, true); U.closeDialog(); U.afterPeopleChange(); back && back(); };
    dlg.querySelector('#dok').onclick = async () => { await G.deletePerson(pid); U.closeDialog(); U.afterPeopleChange(); back && back(); };
  };

  U.afterPeopleChange = function () { U.renderRoom(true); U.renderBar(); U.renderFeed(true); U.renderSaid(true); };

  /* ---------- 引导：家里还是空的时候 ---------- */
  U.onboard = function () {
    const added = [];
    function render() {
      const chip = a => `<button class="chip" data-a="${a.id}">${esc(U.archName(a.id))}</button>`;
      const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('ob.title'))}</h2>
        <div class="mute" style="margin-bottom:8px">${esc(t('ob.sub'))}</div>
        <h3>${esc(t('ob.recommend'))}</h3>${C.presets.map(p => `<button class="preset" data-p="${p.id}"><b>${esc(t('preset.' + p.id + '.label'))}</b><br><span class="mute">${esc(t('preset.' + p.id + '.note'))}</span></button>`).join('')}
        <h3>${esc(t('add.group_family'))}</h3><div class="chips">${C.archetypes.filter(a => a.group === 'family').map(chip).join('')}</div>
        <h3>${esc(t('add.group_animal'))}</h3><div class="chips">${C.archetypes.filter(a => a.group === 'animal').map(chip).join('')}</div>
        <h3>${esc(t('add.group_plant'))}</h3><div class="chips">${C.archetypes.filter(a => a.group === 'plant').map(chip).join('')}</div>
        <div class="row" style="margin-top:14px;justify-content:space-between"><span class="mute">${added.length ? esc(t('ob.added', { names: added.join(t('sep.list')) })) : ''}</span>
          <button id="obgo" class="primary">${esc(t(added.length ? 'ob.start' : 'ob.skip'))}</button></div>`, true);
      dlg.querySelectorAll('.chip').forEach(b => b.onclick = () => U.addDialog(b.dataset.a, ok => { if (ok) added.push(G.people[G.people.length - 1].person.name); render(); }));
      dlg.querySelectorAll('.preset').forEach(b => b.onclick = async () => {
        const pr = C.presets.find(x => x.id === b.dataset.p);
        for (const m of pr.members) await G.createPerson({ arch: m.arch, name: t('preset.name.' + m.arch), roleText: U.archName(m.arch), conditions: m.conditions });
        await G.load(); U.closeDialog(); U.afterPeopleChange(); U.maybeIntro();
      });
      dlg.querySelector('#obgo').onclick = () => { U.closeDialog(); U.afterPeopleChange(); if (G.people.length) U.maybeIntro(); };
    }
    render();
  };

})(globalThis.CY = globalThis.CY || {});
