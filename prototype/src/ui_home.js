/* 主页：顶栏、发生的事、说过的话，以及添加角色、引导、设置、存档与下载、关于。全部在一页里，没有标签页。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  const TYPES = ['care', 'talk', 'missed', 'cares_back', 'glance', 'event', 'frail', 'recovered', 'reveal', 'picked', 'nudge'];
  const typeName = k => (TYPES.includes(k) ? t('type.' + k) : k);
  const fmtT = ts => { const d = new Date(ts); return t('fmt.datetime', { m: d.getMonth() + 1, d: d.getDate(), hh: String(d.getHours()).padStart(2, '0'), mm: String(d.getMinutes()).padStart(2, '0') }); };
  const view = { who: '', more: 40 };

  /* ---------- 外观：明暗、背景色调、语言 ---------- */
  U.applyTheme = function () {
    let th = ini.get(G.cfg, 'ui', 'theme');
    if (th !== 'light' && th !== 'dark') th = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const bg = ini.get(G.cfg, 'ui', 'background');
    for (const d of [document, U.pipDoc]) if (d) { d.documentElement.dataset.theme = th; d.documentElement.dataset.bg = bg; }
  };
  U.syncTheme = U.applyTheme;
  U.applyLang = function () {
    I.set(I.detect(ini.get(G.cfg, 'ui', 'language')));
    I.applyDom(document);
    document.title = t('app.title');
    $('verTxt').textContent = t('app.proto', { v: CY.meta.version }); $('footTxt').textContent = t('foot.text');
    for (const k of ['feed', 'said', 'roomBar']) delete $(k).dataset.sig;
    if (U.room) { U.renderRoom(true); }
    U.renderClock(); U.renderBar(); U.renderFeed(true); U.renderSaid(true);
  };
  async function saveCfg() { await store.write('settings.ini', ini.stringify(G.cfg)); }

  /* ---------- 通用弹窗 ---------- */
  U.dialog = function (html, wide) {
    const m = $('modal');
    m.innerHTML = `<div class="box ${wide ? 'wide' : ''}">${html}</div>`;
    m.style.display = 'grid';
    m.onclick = e => { if (e.target === m) U.closeDialog(); };
    return m.firstChild;
  };
  U.closeDialog = function () { const m = $('modal'); m.style.display = 'none'; m.innerHTML = ''; };

  /* ---------- 顶栏：经历了多少时间，现在是几点 ---------- */
  U.renderClock = function () {
    const c = G.clock(), mode = ini.get(G.cfg, 'time', 'mode');
    const el = c.d > 0 ? t('clock.dh', { d: c.d, h: c.h }) : c.h > 0 ? t('clock.hm', { h: c.h, m: c.m }) : t('clock.m', { m: c.m });
    $('elapsed').textContent = t('clock.elapsed', { t: el });
    $('elapsed').title = t('clock.elapsed_tip');
    const now = $('nowClock');
    now.textContent = (c.night ? '🌙 ' : '☀ ') + c.hh + ':' + c.mm + (c.src === 'game' ? '  ' + t('clock.real', { hh: c.realHh, mm: c.realMm }) : '');
    now.title = t(c.src === 'game' ? 'clock.tip_game' : 'clock.tip_system');
    if ($('timeMode').value !== mode) $('timeMode').value = mode;
  };

  /* ---------- 房间下方：添加与离开中的角色 ---------- */
  U.renderBar = function () {
    const away = G.people.filter(p => p.person.active === false);
    const sig = away.map(p => p.id + p.person.name).join() + U.floating + I.lang;
    const bar = $('roomBar');
    if (bar.dataset.sig === sig) return;
    bar.dataset.sig = sig;
    $('floatNote').style.display = U.floating ? 'block' : 'none';
    $('roomSlot').style.display = U.floating ? 'none' : 'block';
    bar.innerHTML = `<button id="addBtn" class="primary">${esc(t('btn.add'))}</button>` +
      away.map(p => `<span class="pill">${esc(t('bar.away', { name: p.person.name }))} <a href="#" data-id="${p.id}">${esc(t('bar.recall'))}</a></span>`).join('');
    $('addBtn').onclick = () => U.addDialog(null, () => { U.renderBar(); });
    bar.querySelectorAll('a').forEach(a => a.onclick = e => { e.preventDefault(); G.setActive(a.dataset.id, true); });
  };

  /* ---------- 发生的事 ---------- */
  function entries() {
    const out = [];
    for (const pid in G.journal) for (const mk in G.journal[pid]) G.journal[pid][mk].forEach(e => out.push({ pid, e }));
    return out.sort((a, b) => (a.e.t < b.e.t ? 1 : -1));
  }
  const nameOf = pid => (G.get(pid) ? G.get(pid).person.name : pid);
  U.renderFeed = function (force) {
    const all = entries(), list = all.filter(x => !view.who || x.pid === view.who);
    const sig = view.who + view.more + all.length + I.lang + G.people.map(p => p.id + p.person.name + p.story.care_total).join();
    const root = $('feed');
    if (!force && root.dataset.sig === sig) return;
    root.dataset.sig = sig;
    const chips = [`<button class="chip ${view.who ? '' : 'on'}" data-w="">${esc(t('feed.all'))}</button>`].concat(G.people.map(p => `<button class="chip ${view.who === p.id ? 'on' : ''}" data-w="${p.id}">${esc(p.person.name)}</button>`)).join('');
    const stat = view.who && G.get(view.who) ? (() => {
      const p = G.get(view.who), n = ty => all.filter(x => x.pid === p.id && x.e.type === ty).length;
      return `<div class="mute stat">${esc(t('feed.stat', { care: p.story.care_total, talk: n('talk'), missed: n('missed') }))}${p.story.revealed ? esc(t('feed.stat_back', { name: p.person.name, n: p.story.cares_back_total })) : ''}</div>`;
    })() : '';
    root.innerHTML = `<h2>${esc(t('feed.title'))}</h2><div class="chips">${chips}</div>${stat}` +
      (list.slice(0, view.more).map(x => `<div class="tl"><span class="t">${fmtT(x.e.t)}<br>${esc(t('feed.day', { n: x.e.day || '?' }))}</span><span class="who">${esc(nameOf(x.pid))}</span><span class="pill">${esc(typeName(x.e.type))}</span><span class="x">${esc(x.e.text)}</span></div>`).join('') || `<div class="mute">${esc(t('feed.empty'))}</div>`) +
      (list.length > view.more ? `<div class="row" style="margin-top:8px"><button id="moreBtn">${esc(t('feed.more'))}</button></div>` : '');
    root.querySelectorAll('.chip').forEach(b => b.onclick = () => { view.who = b.dataset.w; view.more = 40; U.renderFeed(true); });
    const mb = $('moreBtn'); if (mb) mb.onclick = () => { view.more += 60; U.renderFeed(true); };
  };

  /* ---------- 说过的话（只读：想改字就去数据文件夹里改明文） ---------- */
  U.renderSaid = function (force) {
    const root = $('said');
    const sig = I.lang + G.people.map(p => p.id + p.person.name + (G.sayings[p.id] || []).length).join();
    if (!force && root.dataset.sig === sig) return;
    root.dataset.sig = sig;
    const open = new Set([...root.querySelectorAll('details[open]')].map(d => d.dataset.id));
    root.innerHTML = `<h2>${esc(t('said.title'))}</h2>` + (G.people.map(p => {
      const items = (G.sayings[p.id] || []).slice().reverse().filter(s => s.lib || s.by === 'you');
      const n = items.filter(s => s.by === 'char').length, m = items.filter(s => s.by === 'you').length;
      return `<details data-id="${p.id}" ${open.has(p.id) ? 'open' : ''}><summary>${esc(p.person.name)}<span class="mute">　${esc(t('said.count', { n, m }))}</span></summary>` +
        (items.slice(0, 80).map(s => `<div class="tl"><span class="t">${fmtT(s.t)}</span><span class="who ${s.by === 'you' ? 'said-you' : ''}">${s.by === 'you' ? esc(t('said.you')) : esc(p.person.name)}</span><span class="x">${esc(s.text)}</span>${s.lib ? `<span class="pill" title="${esc(t('said.lib'))}">${esc(s.lib)}${s.ans !== undefined ? '·' + esc(s.ans) : ''}</span>` : ''}</div>`).join('') || `<div class="mute" style="padding:6px 0">${esc(t('said.empty'))}</div>`) + '</details>';
    }).join('') || `<div class="mute">${esc(t('said.nobody'))}</div>`);
  };

  /* ---------- 添加角色 ---------- */
  U.archName = id => t('arch.' + id);
  U.addDialog = function (archId, done) {
    const O = CY.avatarOptions;
    const arch0 = C.archOf(archId) || C.archetypes[0];
    const st = { arch: arch0.id, name: '', pronoun: arch0.pronoun, age_stage: arch0.age_stage, look: Object.assign({}, arch0.look), cond: '' };
    const sw = (k, vals, cur, hexOf) => `<span class="sws">${vals.map((v, i) => `<span class="sw ${String(cur) === String(v) ? 'on' : ''}" data-k="${k}" data-v="${v}" style="background:${hexOf ? hexOf(v, i) : v}"></span>`).join('')}</span>`;
    const sel = (k, vals, labels, cur) => `<select data-s="${k}">${vals.map((v, i) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(labels[i])}</option>`).join('')}</select>`;
    function render() {
      const arch = C.archOf(st.arch), human = arch.species === 'human';
      const archSel = ['family', 'animal'].map(g => `<optgroup label="${esc(t('add.group_' + g))}">${C.archetypes.filter(a => a.group === g).map(a => `<option value="${a.id}" ${a.id === st.arch ? 'selected' : ''}>${esc(U.archName(a.id))}</option>`).join('')}</optgroup>`).join('');
      const look = st.look;
      const dlg = U.dialog(`<div class="addgrid"><div class="prev">${CY.avatarPreview(arch, look)}</div><div>
        <div class="row"><input id="an" placeholder="${esc(t('add.name_ph'))}" value="${esc(st.name)}" style="flex:1"><select id="aa">${archSel}</select></div>
        ${human ? `<div class="row">${esc(t('add.pronoun'))} ${sel('pronoun', ['他', '她', '它'], [t('pron.he'), t('pron.she'), t('pron.it')], st.pronoun)} ${esc(t('add.age'))} ${sel('age_stage', ['child', 'adult', 'elder'], [t('age.child'), t('age.adult'), t('age.elder')], st.age_stage)}
          ${esc(t('add.glasses'))} ${sel('glasses', O.glasses, O.glasses.map(g => t('glasses.' + g)), look.glasses === true ? 'round' : look.glasses || 'none')}
          <label><input type="checkbox" id="abeard" ${look.beard ? 'checked' : ''}> ${esc(t('add.beard'))}</label></div>
          <div class="row">${esc(t('add.skin'))} ${sw('skin', [0, 1, 2, 3, 4, 5], look.skin, v => O.skin[v])} ${esc(t('add.haircolor'))} ${sw('hair_color', O.hairColor, look.hair_color, v => O.hairColorHex[v])}</div>
          <div class="row">${esc(t('add.hair'))} ${sel('hair_style', O.hairStyle, O.hairStyle.map(h => t('hair.' + h)), look.hair_style)} ${esc(t('add.cloth'))} ${sw('cloth', O.clothes, look.cloth)}</div>
          <div class="row">${esc(t('add.cond'))} ${sel('cond', ['', ...Object.keys(G.tpl.conditions)], [t('add.cond_none'), ...Object.keys(G.tpl.conditions).map(c => CY.tOr('cond.' + c, G.tpl.conditions[c].label))], st.cond)}</div>`
        : `<div class="row">${esc(t('add.coat'))} ${sw('coat', O.coatBySpecies[arch.species] || O.coat, look.coat, v => O.coatHex[v])}</div>`}
        <div class="row" style="justify-content:flex-end;margin:12px 0 0"><button id="acancel">${esc(t('btn.cancel'))}</button><button id="aok" class="primary">${esc(t('add.ok'))}</button></div></div></div>`, true);
      dlg.querySelector('#an').oninput = e => { st.name = e.target.value; };
      dlg.querySelector('#aa').onchange = e => {
        const a = C.archOf(e.target.value); st.arch = a.id; st.pronoun = a.pronoun; st.age_stage = a.age_stage; st.look = Object.assign({}, a.look);
        if (a.species !== 'human') st.cond = '';
        render();
      };
      dlg.querySelectorAll('.sw').forEach(s => s.onclick = () => { st.look[s.dataset.k] = s.dataset.k === 'skin' ? +s.dataset.v : s.dataset.v; render(); });
      dlg.querySelectorAll('select[data-s]').forEach(s => s.onchange = () => {
        const k = s.dataset.s;
        if (k === 'pronoun' || k === 'age_stage' || k === 'cond') st[k] = s.value; else st.look[k] = s.value;
        render();
      });
      const bd = dlg.querySelector('#abeard'); if (bd) bd.onchange = () => { st.look.beard = bd.checked; render(); };
      dlg.querySelector('#acancel').onclick = () => { U.closeDialog(); done && done(false); };
      dlg.querySelector('#aok').onclick = async () => {
        const a = C.archOf(st.arch), role = U.archName(a.id);
        await G.createPerson({ arch: a.id, name: st.name.trim() || role, roleText: role, pronoun: st.pronoun, age_stage: st.age_stage, look: st.look, conditions: st.cond ? [st.cond] : [] });
        await G.load(); U.closeDialog(); U.afterPeopleChange(); done && done(true);
      };
    }
    render();
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
        <div class="row" style="margin-top:14px;justify-content:space-between"><span class="mute">${added.length ? esc(t('ob.added', { names: added.join(t('sep.list')) })) : ''}</span>
          <button id="obgo" class="primary">${esc(t(added.length ? 'ob.start' : 'ob.skip'))}</button></div>`, true);
      dlg.querySelectorAll('.chip').forEach(b => b.onclick = () => U.addDialog(b.dataset.a, ok => { if (ok) added.push(G.people[G.people.length - 1].person.name); render(); }));
      dlg.querySelectorAll('.preset').forEach(b => b.onclick = async () => {
        const pr = C.presets.find(x => x.id === b.dataset.p);
        for (const m of pr.members) await G.createPerson({ arch: m.arch, name: t('preset.name.' + m.arch), roleText: U.archName(m.arch), conditions: m.conditions });
        await G.load(); U.closeDialog(); U.afterPeopleChange();
      });
      dlg.querySelector('#obgo').onclick = () => { U.closeDialog(); U.afterPeopleChange(); };
    }
    render();
  };

  /* ---------- 设置（齿轮） ---------- */
  const OPT = { 'interrupt.mode': ['keep', 'countdown_default', 'countdown_dismiss'], 'interrupt.frequency': ['test', 'often', 'normal', 'rare'], 'time.mode': ['real', 'compressed', 'paused'], 'time.daynight': ['auto', 'system', 'game'], 'ai.provider': ['none', 'openai_compat', 'mock'], 'ai.autonomy': ['text_only', 'suggest', 'bounded'] };
  const SKIP = new Set(['ui.theme', 'ui.background', 'ui.language']);
  const BGS = ['warm', 'mint', 'sky', 'rose', 'gray'], BG_HEX = { warm: '#e9d9c0', mint: '#cfe7da', sky: '#cfe0f2', rose: '#f0d3d9', gray: '#d9d9dc' };
  U.settingsDialog = function () {
    let sec = '';
    const form = ini.SCHEMA.filter(([s, k]) => !SKIP.has(s + '.' + k)).map(([s, k, d, note]) => {
      const v = ini.get(G.cfg, s, k), key = s + '.' + k;
      const head = s !== sec ? `<h3>${esc(t('sec.' + s))}</h3>` : ''; sec = s;
      const opts = OPT[key] || (d === 'true' || d === 'false' ? ['true', 'false'] : null);
      const input = opts ? `<select data-k="${key}">${opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>` : `<input data-k="${key}" ${k === 'api_key' ? 'type="password"' : ''} value="${esc(v)}">`;
      return head + `<div class="srow"><span class="k">${k}</span>${input}<span class="mute n">${esc(CY.tOr('ini.' + key, note))}</span></div>`;
    }).join('');
    const th = ini.get(G.cfg, 'ui', 'theme'), bg = ini.get(G.cfg, 'ui', 'background'), lg = ini.get(G.cfg, 'ui', 'language');
    const chips = (name, vals, labels, cur) => `<span class="chips inl">${vals.map((v, i) => `<button class="chip ${v === cur ? 'on' : ''}" data-ap="${name}" data-v="${v}">${esc(labels[i])}</button>`).join('')}</span>`;
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('set.title'))}</h2>
      <h3>${esc(t('set.look'))}</h3>
      <div class="row">${esc(t('set.theme'))} ${chips('theme', ['auto', 'light', 'dark'], [t('theme.auto'), t('theme.light'), t('theme.dark')], th)}</div>
      <div class="row">${esc(t('set.bg'))} <span class="sws">${BGS.map(b => `<span class="sw ${b === bg ? 'on' : ''}" data-ap="background" data-v="${b}" title="${esc(t('bg.' + b))}" style="background:${BG_HEX[b]}"></span>`).join('')}</span></div>
      <div class="row">${esc(t('set.lang'))} ${chips('language', ['auto', ...Object.keys(I.packs)], [t('lang.auto'), ...Object.keys(I.packs).map(l => I.names[l] || l)], lg)}</div>
      <div class="sform">${form}</div>
      <h3>${esc(t('set.data'))}</h3><div class="mute" style="margin-bottom:6px">${esc(t('set.data_note', { where: store.backend.label }))}</div>
      <div class="row"><button id="dfolder">${esc(t('set.folder'))}</button><button id="drestore">${esc(t('set.restore'))}</button></div>
      <h3>${esc(t('set.danger'))}</h3><div class="mute" style="margin-bottom:6px">${esc(t('set.wipe_note'))}</div>
      <div class="row"><button id="dwipe" class="danger">${esc(t('set.wipe'))}</button></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="scancel">${esc(t('btn.close'))}</button><button id="sapply" class="primary">${esc(t('btn.save'))}</button></div>`, true);
    dlg.querySelectorAll('[data-ap]').forEach(el => el.onclick = async () => {
      const k = el.dataset.ap; G.cfg.ui = G.cfg.ui || {}; G.cfg.ui[k] = el.dataset.v;
      await saveCfg(); U.applyTheme(); if (k === 'language') U.applyLang(); U.settingsDialog();
    });
    dlg.querySelector('#scancel').onclick = U.closeDialog;
    dlg.querySelector('#sapply').onclick = async () => {
      const cfg = JSON.parse(JSON.stringify(G.cfg));
      dlg.querySelectorAll('[data-k]').forEach(el => { const [s, k] = el.dataset.k.split('.'); (cfg[s] = cfg[s] || {})[k] = el.value.trim(); });
      G.cfg = cfg; await saveCfg(); U.closeDialog(); U.renderClock();
    };
    dlg.querySelector('#dfolder').onclick = async () => {
      try { const had = await store.chooseFolder(); await G.load(); U.closeDialog(); U.afterPeopleChange(); alert(t(had ? 'set.folder_had' : 'set.folder_copied')); } catch (e) { alert(e.message); }
    };
    dlg.querySelector('#drestore').onclick = async () => {
      const have = new Set(await store.list()), seed = CY.seed.files(); let n = 0;
      for (const p in seed) if (!have.has(p)) { await store.write(p, seed[p]); n++; }
      await G.load(); alert(t('set.restored', { n })); U.afterPeopleChange();
    };
    dlg.querySelector('#dwipe').onclick = () => U.wipeDialog();
  };

  /* 删除全部本地数据：先建议下载存档，再要求明确确认 */
  U.wipeDialog = function () {
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('wipe.title'))}</h2><p>${esc(t('wipe.body'))}</p>
      <div class="row"><button id="wsave">${esc(t('wipe.save_first'))}</button></div>
      <label class="row"><input type="checkbox" id="wsure"> ${esc(t('wipe.sure'))}</label>
      <div class="row" style="justify-content:flex-end"><button id="wno">${esc(t('btn.cancel'))}</button><button id="wgo" class="danger" disabled>${esc(t('wipe.go'))}</button></div>`);
    dlg.querySelector('#wsave').onclick = async () => { G.save(true); await new Promise(r => setTimeout(r, 200)); const s = await A.exportSave(); A.saveBlob(s.blob, s.name); };
    dlg.querySelector('#wsure').onchange = e => { dlg.querySelector('#wgo').disabled = !e.target.checked; };
    dlg.querySelector('#wno').onclick = U.closeDialog;
    dlg.querySelector('#wgo').onclick = async () => { G.stop(); await store.wipe(); location.reload(); };
  };

  /* ---------- 存档与下载 ---------- */
  const csv = rows => '﻿' + rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  U.summaryFiles = function () {
    const sayRows = [[t('csv.person'), t('csv.time'), t('csv.who'), t('csv.lib'), t('csv.ans'), t('csv.text')]], logRows = [[t('csv.person'), t('csv.time'), t('csv.day'), t('csv.type'), t('csv.text')]];
    for (const p of G.people) {
      for (const s of G.sayings[p.id] || []) sayRows.push([p.person.name, s.t, s.by === 'you' ? t('said.you') : p.person.name, s.lib || '', s.ans === undefined ? '' : s.ans, s.text]);
      for (const mk in G.journal[p.id] || {}) for (const e of G.journal[p.id][mk]) logRows.push([p.person.name, e.t, e.day || '', typeName(e.type), e.text]);
    }
    return { 'summary/sayings.csv': csv(sayRows), 'summary/journal.csv': csv(logRows) };
  };

  U.saveDialog = function () {
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('save.title'))}</h2>
      <h3>${esc(t('save.s1'))}</h3><div class="mute">${esc(t('save.s1_note'))}</div>
      <div class="row" style="margin-top:6px"><button id="vsave" class="primary">${esc(t('save.s1_btn'))}</button><label><input type="checkbox" id="vkey"> ${esc(t('save.s1_key'))}</label></div>
      <h3>${esc(t('save.s2'))}</h3><div class="mute">${esc(t('save.s2_note'))}</div>
      <div class="row" style="margin-top:6px"><button id="vapp">${esc(t('save.s2_btn'))}</button><label><input type="checkbox" id="vwith" checked> ${esc(t('save.s2_with'))}</label></div>
      <div class="mute" id="vmsg"></div>
      <h3>${esc(t('save.s3'))}</h3><div class="mute">${esc(t('save.s3_note'))}</div>
      <div class="row" style="margin-top:6px"><input type="file" id="vfile" accept=".zip,application/zip"></div><div id="vimp"></div>
      <h3>${esc(t('save.s4'))}</h3><div class="mute">${esc(t('save.s4_note'))}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="vclose">${esc(t('btn.close'))}</button></div>`, true);
    const msg = s => { dlg.querySelector('#vmsg').textContent = s; };
    dlg.querySelector('#vclose').onclick = U.closeDialog;
    dlg.querySelector('#vsave').onclick = async () => {
      G.save(true); await new Promise(r => setTimeout(r, 200));
      const s = await A.exportSave({ keepKey: dlg.querySelector('#vkey').checked }); A.saveBlob(s.blob, s.name);
    };
    dlg.querySelector('#vapp').onclick = async () => {
      msg(t('save.s2_working'));
      try { if (dlg.querySelector('#vwith').checked) { G.save(true); await new Promise(r => setTimeout(r, 200)); } const s = await A.exportApp({ withSave: dlg.querySelector('#vwith').checked }); A.saveBlob(s.blob, s.name); msg(''); } catch (e) { msg(t('save.s2_fail')); }
    };
    dlg.querySelector('#vfile').onchange = async e => {
      const f = e.target.files[0], out = dlg.querySelector('#vimp'); if (!f) return;
      const info = await A.inspect(await f.arrayBuffer());
      if (!info.ok) { out.innerHTML = `<div class="warn">${esc(t('import.err_' + info.error))}</div>`; return; }
      const m = info.manifest;
      out.innerHTML = `<div class="card"><div>${esc(t('import.found', { n: info.people.length, names: info.people.map(p => p.name).join(t('sep.list')) || '-' }))}</div>
        ${m ? `<div class="mute">${esc(t('import.manifest', { v: m.version, at: (m.created || '').slice(0, 16).replace('T', ' ') }))}</div>` : ''}
        ${info.rejected.length ? `<div class="warn">${esc(t('import.rejected', { n: info.rejected.length }))}</div>` : ''}
        <div class="row" style="margin-top:6px"><label><input type="radio" name="imode" value="merge" checked> ${esc(t('import.merge'))}</label><label><input type="radio" name="imode" value="replace"> ${esc(t('import.replace'))}</label></div>
        <label class="row"><input type="checkbox" id="ibak" checked> ${esc(t('import.backup'))}</label>
        <div class="row"><button id="igo" class="primary">${esc(t('import.go'))}</button></div></div>`;
      out.querySelector('#igo').onclick = async () => {
        const mode = out.querySelector('input[name=imode]:checked').value;
        if (mode === 'replace' && !confirm(t('import.confirm_replace'))) return;
        if (out.querySelector('#ibak').checked) { G.save(true); await new Promise(r => setTimeout(r, 200)); const s = await A.exportSave(); A.saveBlob(s.blob, 'before-import-' + s.name); }
        const n = await A.apply(info, mode);
        G.stop(); await G.load(); G.start(); U.applyTheme(); U.applyLang(); U.afterPeopleChange();
        out.innerHTML = `<div class="ok">${esc(t('import.done', { n }))}</div>`;
      };
    };
  };

  /* ---------- 关于：个人项目的说明、隐私与免责、致谢、版本 ---------- */
  U.aboutDialog = function (tab) {
    tab = tab || 'about';
    const M = CY.meta, tabs = ['about', 'privacy', 'credits', 'version'];
    const para = keys => keys.map(k => `<p>${esc(t(k))}</p>`).join('');
    const body = {
      about: para(['about.p1', 'about.p2', 'about.p3', 'about.p4']),
      privacy: `<h3>${esc(t('priv.h1'))}</h3>${para(['priv.p1', 'priv.p2', 'priv.p3'])}<h3>${esc(t('priv.h2'))}</h3>${para(['priv.p4', 'priv.p5'])}
        <h3>${esc(t('priv.h3'))}</h3>${para(['priv.p6', 'priv.p7', 'priv.p8'])}<h3>${esc(t('priv.h4'))}</h3>${para(['priv.p9', 'priv.p10'])}<div class="mute">${esc(t('priv.note'))}</div>`,
      credits: para(['cred.p1', 'cred.p2', 'cred.p3']),
      version: `<p>${esc(t('ver.line', { app: M.app, v: M.version, schema: M.schema, date: M.released }))}</p><p>${esc(t('ver.lang', { l: I.names[I.lang] || I.lang }))}</p><p class="mute">${esc(t('ver.account'))}</p>`,
    };
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('about.title'))}</h2><div class="chips">${tabs.map(k => `<button class="chip ${k === tab ? 'on' : ''}" data-t="${k}">${esc(t('about.tab_' + k))}</button>`).join('')}</div>
      <div class="aboutbody">${body[tab]}</div><div class="row" style="justify-content:flex-end;margin-top:10px"><button id="aclose">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelectorAll('.chip').forEach(b => b.onclick = () => U.aboutDialog(b.dataset.t));
    dlg.querySelector('#aclose').onclick = U.closeDialog;
  };
})(globalThis.CY = globalThis.CY || {});
