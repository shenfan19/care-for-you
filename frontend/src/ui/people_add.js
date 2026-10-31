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
      const archSel = GROUPS.map(g => `<optgroup label="${esc(t('add.group_' + g))}">${C.archetypes.filter(a => a.group === g && !a.hidden).map(a => `<option value="${a.id}" ${a.id === st.arch ? 'selected' : ''}>${esc(U.archName(a.id))}</option>`).join('')}</optgroup>`).join('');
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
        await G.createPerson({ arch: a.id, name: st.name.trim() || role, name_auto: st.name.trim() && st.name.trim() !== role ? undefined : a.id, roleText: role, pronoun: st.pronoun, age: st.age, look: st.look, traits: st.traits, conditions: st.cond ? [st.cond] : [], helper: st.helper });
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

  U.afterPeopleChange = function () { G.ensurePlayer().then(made => { if (made) U.afterPeopleChange(); }); U.renderRoom(true); U.renderBar(); U.renderFeed(true); U.renderSaid(true); };

  /* ---------- 引导：家里还是空的时候 ----------
     第一屏只有一排场景和三个按钮，放得进一屏；想自己搭就进第二屏，按家人、动物、植物分页。 */
  const TOP = ['trio', 'selfcare', 'elder', 'baby', 'threegen', 'pet', 'zoo', 'garden'];
  const COND_BY_STAGE = { elder: ['diabetes', 'hypertension', 'arthritis', 'heart', 'nocturia', 'forgetful', 'parkinson'], adult: ['depress', 'hypertension', 'asthma', 'allergy'], child: ['asthma', 'eczema', 'allergy', 'cold'] };
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  /* 随机生成一个家：三成是一个人住照顾自己，其余是一到三个人加宠物和花草，人有几率带病 */
  U.randomHousehold = function () {
    const fam = C.archetypes.filter(a => a.group === 'family' && !a.hidden), pets = C.archetypes.filter(a => a.group === 'animal'), plants = C.archetypes.filter(a => a.group === 'plant');
    const stageOf = a => (a.species === 'human' ? C.stageOf(a.age) : '');
    const condsFor = (a, p) => { const st = stageOf(a), pool = COND_BY_STAGE[st === 'elder' ? 'elder' : ['child', 'teen'].includes(st) ? 'child' : 'adult']; return st === 'infant' || st === 'toddler' || Math.random() > p ? [] : shuffle(pool).slice(0, Math.random() < 0.3 ? 2 : 1); };
    const nm = a => CY.tOr('preset.name.' + a.id, U.archName(a.id));
    const members = [];
    if (Math.random() < 0.3) {
      const a = rnd(fam.filter(x => ['uncle', 'aunt', 'grandpa', 'grandma', 'friend', 'man25', 'woman25'].includes(x.id))), age = 25 + Math.floor(Math.random() * 56);
      members.push({ arch: a.id, name: t('preset.name.self'), age, conditions: condsFor({ species: 'human', age }, 0.8), lead: true });
      if (Math.random() < 0.5) { const p = rnd(pets.concat(plants)); members.push({ arch: p.id, name: nm(p) }); }
    } else {
      for (const a of shuffle(fam).slice(0, 1 + Math.floor(Math.random() * 3))) members.push({ arch: a.id, name: nm(a), conditions: condsFor(a, 0.5) });
      for (const p of shuffle(pets).slice(0, Math.floor(Math.random() * 3))) members.push({ arch: p.id, name: nm(p) });
      if (Math.random() < 0.4) { const p = rnd(plants); members.push({ arch: p.id, name: nm(p) }); }
    }
    return members;
  };
  /* 家里没有爸爸妈妈也没有指定主角的开局，补一个在家办公的成年人当主角，男女随机。没有他，就没有人坐在书桌前，也就没有工作和打断 */
  U.withWorker = function (members) {
    if (members.some(m => m.lead || ['dad', 'mom', 'wife', 'husband'].includes(m.arch))) return members;
    return [{ arch: rnd(['man25', 'woman25']), name: t('preset.name.self'), age: 26 + Math.floor(Math.random() * 15), lead: true }].concat(members);
  };
  U.createMembers = async function (members) {
    let lead = null;
    for (const m of members) { const id = await G.createPerson({ arch: m.arch, name: m.name, name_auto: m.lead ? 'self' : m.arch, roleText: U.archName(m.arch), conditions: m.conditions || [], age: m.age }); if (m.lead) lead = id; }
    await G.load();
    if (lead) G.setProtagonist(lead);
  };
  U.onboard = function (page) {
    const added = [], I = CY.i18n;
    let tab = 'family';
    const langSel = () => `<select id="oblang" aria-label="${esc(t('set.lang'))}">${Object.keys(I.packs).map(l => `<option value="${l}" ${l === I.lang ? 'selected' : ''}>${esc(I.names[l] || l)}</option>`).join('')}</select>`;
    const wireLang = dlg => { dlg.querySelector('#oblang').onchange = async e => { G.cfg.ui = G.cfg.ui || {}; G.cfg.ui.language = e.target.value; await G.saveCfg(); await U.applyLang(); render(); }; };
    const start = async members => { await U.createMembers(members); U.closeDialog(); U.afterPeopleChange(); U.maybeIntro(); };
    const tile = id => { const p = C.presets.find(x => x.id === id); return p ? `<button class="tile" data-p="${id}"><b>${esc(t('preset.' + id + '.label'))}</b><span class="mute">${esc(t('preset.' + id + '.note'))}</span></button>` : ''; };
    const wireTiles = dlg => dlg.querySelectorAll('.tile').forEach(b => b.onclick = () => { const pr = C.presets.find(x => x.id === b.dataset.p); start(U.withWorker(pr.members.map(m => Object.assign({}, m, { name: CY.tOr('preset.name.' + (m.lead ? 'self' : m.arch), U.archName(m.arch)) })))); });
    const footer = () => `<div class="row" style="margin-top:12px;justify-content:space-between"><span class="mute">${added.length ? esc(t('ob.added', { names: added.join(t('sep.list')) })) : ''}</span>
          <button id="obgo" class="primary">${esc(t(added.length ? 'ob.start' : 'ob.skip'))}</button></div>`;
    const wireGo = dlg => { dlg.querySelector('#obgo').onclick = () => { U.closeDialog(); U.afterPeopleChange(); if (G.people.length) U.maybeIntro(); }; };
    function render() { return page === 'custom' ? renderCustom() : renderMain(); }
    function renderMain() {
      const more = C.presets.filter(p => !TOP.includes(p.id));
      const dlg = U.dialog(`<div class="obhead"><h2 style="margin:0">${esc(t('ob.title'))}</h2>${langSel()}</div>
        <div class="mute" style="margin:6px 0 10px">${esc(t('ob.sub'))}</div>
        <div class="tiles">${TOP.map(tile).join('')}</div>
        <div class="row" style="margin-top:10px"><button id="obrand">🎲 ${esc(t('ob.random'))}</button><button id="obcustom">${esc(t('ob.custom'))}</button></div>
        <details class="adv"><summary>${esc(t('ob.more'))}</summary><div class="tiles" style="margin-top:6px">${more.map(p => tile(p.id)).join('')}</div></details>${footer()}`, true);
      wireLang(dlg); wireTiles(dlg); wireGo(dlg);
      dlg.querySelector('#obrand').onclick = () => start(U.withWorker(U.randomHousehold()));
      dlg.querySelector('#obcustom').onclick = () => { page = 'custom'; render(); };
    }
    function renderCustom() {
      const groups = ['family', 'animal', 'plant'];
      const dlg = U.dialog(`<div class="obhead"><h2 style="margin:0">${esc(t('ob.custom'))}</h2>${langSel()}</div>
        <div class="chips" style="margin:10px 0">${groups.map(g => `<button class="chip ${g === tab ? 'on' : ''}" data-tab="${g}">${esc(t('add.group_' + g))}</button>`).join('')}</div>
        <div class="chips">${C.archetypes.filter(a => a.group === tab && !a.hidden).map(a => `<button class="chip" data-a="${a.id}">${esc(U.archName(a.id))}</button>`).join('')}</div>
        <div class="row" style="margin-top:12px"><button id="obback">${esc(t('ob.back'))}</button></div>${footer()}`, true);
      wireLang(dlg); wireGo(dlg);
      dlg.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
      dlg.querySelectorAll('[data-a]').forEach(b => b.onclick = () => U.addDialog(b.dataset.a, ok => { if (ok) added.push(G.people[G.people.length - 1].person.name); render(); }));
      dlg.querySelector('#obback').onclick = () => { page = 'main'; render(); };
    }
    render();
  };

})(globalThis.CY = globalThis.CY || {});
