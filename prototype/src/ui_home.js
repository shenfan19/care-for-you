/* 主页：顶栏、发生的事、说过的话，以及添加角色、引导、设置、存档与下载、关于。全部在一页里，没有标签页。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  const TYPES = ['care', 'talk', 'missed', 'cares_back', 'glance', 'event', 'frail', 'recovered', 'reveal', 'picked', 'nudge', 'cry', 'self'];
  const typeName = k => (TYPES.includes(k) ? t('type.' + k) : k);
  const fmtT = ts => { const d = new Date(ts); return t('fmt.datetime', { m: d.getMonth() + 1, d: d.getDate(), hh: String(d.getHours()).padStart(2, '0'), mm: String(d.getMinutes()).padStart(2, '0') }); };
  const view = { who: '', more: 40 };

  /* ---------- 外观：明暗、背景色调、语言 ---------- */
  U.applyTheme = function () {
    let th = ini.get(G.cfg, 'ui', 'theme');
    if (th !== 'light' && th !== 'dark') th = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const bg = ini.get(G.cfg, 'ui', 'background');
    for (const d of [document, U.pipDoc]) if (d) { d.documentElement.dataset.theme = th; d.documentElement.dataset.bg = bg; }
    const style = ini.get(G.cfg, 'ui', 'avatar_style') === 'detailed' ? 'detailed' : 'simple';
    if (CY.avatarStyle !== style) { CY.avatarStyle = style; if (U.room) U.renderRoom(true); }
    const tb = $('themeBtn');
    if (tb) { const m = ini.get(G.cfg, 'ui', 'theme'); tb.textContent = m === 'light' ? '☀' : m === 'dark' ? '☾' : '◐'; tb.title = t('hdr.theme_tip', { mode: t('theme.' + (m === 'light' || m === 'dark' ? m : 'auto')) }); }
  };
  /* 顶栏上的快捷控件：明暗、语言、压缩比例 */
  U.cycleTheme = async function () {
    const order = ['auto', 'light', 'dark'], cur = ini.get(G.cfg, 'ui', 'theme');
    G.cfg.ui = G.cfg.ui || {}; G.cfg.ui.theme = order[(order.indexOf(cur) + 1) % 3] || 'auto';
    await saveCfg(); U.applyTheme();
  };
  U.renderControls = function () {
    const ls = $('langSel'), names = I.names;
    const langs = Object.keys(I.packs);
    const sig = langs.join() + I.lang;
    if (ls.dataset.sig !== sig) { ls.dataset.sig = sig; ls.innerHTML = langs.map(l => `<option value="${l}" ${l === I.lang ? 'selected' : ''}>${esc(names[l] || l)}</option>`).join(''); }
    const rs = $('ratioSel'), ratio = ini.num(G.cfg, 'time', 'compress_ratio');
    rs.style.display = G.playMode() === 'story' ? '' : 'none';
    const cur = G.isPaused() ? 'paused' : G.playMode();
    document.querySelectorAll('#modeSeg button').forEach(b => { b.classList.toggle('on', b.dataset.m === cur); b.title = t('mode.' + b.dataset.m + '_tip'); b.textContent = t('mode.' + b.dataset.m); });
    const list = [...new Set([10, 30, 60, 120, 360, ratio])].sort((a, b) => a - b);
    const rsig = list.join() + ratio + I.lang;
    if (rs.dataset.sig !== rsig) { rs.dataset.sig = rsig; rs.title = t('hdr.ratio_tip'); rs.innerHTML = list.map(v => `<option value="${v}" ${v === ratio ? 'selected' : ''}>${esc(t('ratio.label', { n: v }))}</option>`).join(''); }
  };
  U.syncTheme = U.applyTheme;
  U.applyLang = async function () {
    I.set(I.detect(ini.get(G.cfg, 'ui', 'language')));
    await G.reloadContent();
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
    const c = G.clock();
    const el = c.d > 0 ? t('clock.dh', { d: c.d, h: c.h }) : c.h > 0 ? t('clock.hm', { h: c.h, m: c.m }) : t('clock.m', { m: c.m });
    $('elapsed').textContent = t('clock.elapsed', { t: el });
    $('elapsed').title = t('clock.elapsed_tip');
    const now = $('nowClock');
    now.textContent = (c.night ? '🌙 ' : '☀ ') + c.hh + ':' + c.mm;
    now.title = t(c.src === 'game' ? 'clock.tip_game' : 'clock.tip_system');
  };

  /* ---------- 房间下方：添加与离开中的角色 ---------- */
  U.renderBar = function () {
    const away = G.people.filter(p => p.person.active === false);
    const sig = away.map(p => p.id + p.person.name).join() + U.floating + I.lang + ini.get(G.cfg, 'ui', 'scene');
    const bar = $('roomBar');
    if (bar.dataset.sig === sig) return;
    bar.dataset.sig = sig;
    $('floatNote').style.display = U.floating ? 'block' : 'none';
    $('roomSlot').style.display = U.floating ? 'none' : 'block';
    bar.innerHTML = `<button id="addBtn" class="primary">${esc(t('btn.add'))}</button>` +
      away.map(p => `<span class="pill">${esc(t('bar.away', { name: p.person.name }))} <a href="#" data-id="${p.id}">${esc(t('bar.recall'))}</a></span>`).join('') +
      `<select id="sceneSel" title="${esc(t('scene.tip'))}">${['auto', ...CY.scenes.ids, 'none'].map(k => `<option value="${k}" ${k === ini.get(G.cfg, 'ui', 'scene') ? 'selected' : ''}>${esc(t('scene.' + k))}</option>`).join('')}</select>`;
    $('sceneSel').onchange = async e => { G.cfg.ui = G.cfg.ui || {}; G.cfg.ui.scene = e.target.value; await saveCfg(); U.renderScene(); };
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
    const st = { arch: arch0.id, name: '', pronoun: arch0.pronoun, age: arch0.age, look: Object.assign({}, arch0.look), cond: '', traits: [] };
    const sw = (k, vals, cur, hexOf) => `<span class="sws">${vals.map((v, i) => `<span class="sw ${String(cur) === String(v) ? 'on' : ''}" data-k="${k}" data-v="${v}" style="background:${hexOf ? hexOf(v, i) : v}"></span>`).join('')}</span>`;
    const sel = (k, vals, labels, cur) => `<select data-s="${k}">${vals.map((v, i) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(labels[i])}</option>`).join('')}</select>`;
    const GROUPS = ['family', 'animal', 'plant'];
    function render() {
      const arch = C.archOf(st.arch), human = arch.species === 'human';
      const archSel = GROUPS.map(g => `<optgroup label="${esc(t('add.group_' + g))}">${C.archetypes.filter(a => a.group === g).map(a => `<option value="${a.id}" ${a.id === st.arch ? 'selected' : ''}>${esc(U.archName(a.id))}</option>`).join('')}</optgroup>`).join('');
      const look = st.look, stage = C.stageOf(st.age);
      const dlg = U.dialog(`<div class="addgrid"><div class="prev">${CY.avatarPreview(arch, look, st.age)}</div><div>
        <div class="row"><input id="an" placeholder="${esc(t('add.name_ph'))}" value="${esc(st.name)}" style="flex:1"><select id="aa">${archSel}</select></div>
        ${human ? `<div class="row">${esc(t('add.age'))} <input id="aage" type="number" min="0" max="110" step="0.5" value="${st.age}" style="width:72px"> <span class="pill">${esc(t('stage.' + stage))}</span>
          ${esc(t('add.pronoun'))} ${sel('pronoun', ['他', '她', '它'], [t('pron.he'), t('pron.she'), t('pron.it')], st.pronoun)}</div>
          <div class="mute stagenote">${esc(t('stage.note.' + stage))}</div>
          <div class="row">${esc(t('add.glasses'))} ${sel('glasses', O.glasses, O.glasses.map(g => t('glasses.' + g)), look.glasses === true ? 'round' : look.glasses || 'none')}
          <label><input type="checkbox" id="abeard" ${look.beard ? 'checked' : ''}> ${esc(t('add.beard'))}</label></div>
          <div class="row">${esc(t('add.skin'))} ${sw('skin', O.skin.map((_, i) => i), look.skin, v => O.skin[v])} ${esc(t('add.haircolor'))} ${sw('hair_color', O.hairColor, look.hair_color, v => O.hairColorHex[v])}</div>
          <div class="row">${esc(t('add.hair'))} ${sel('hair_style', O.hairStyle, O.hairStyle.map(h => t('hair.' + h)), look.hair_style)} ${esc(t('add.cloth'))} ${sw('cloth', O.clothes, look.cloth)}</div>
          <div class="row">${esc(t('add.cond'))} ${sel('cond', ['', ...Object.keys(G.tpl.conditions)], [t('add.cond_none'), ...Object.keys(G.tpl.conditions).map(c => CY.tOr('cond.' + c, G.tpl.conditions[c].label))], st.cond)}</div>`
        : `<div class="row">${esc(t('add.coat'))} ${sw('coat', O.coatBySpecies[arch.species] || O.coat, look.coat, v => O.coatHex[v])}</div><div class="mute stagenote">${esc(t('kind.note.' + (arch.group === 'plant' ? 'plant' : 'animal')))}</div>`}
        <div class="row">${esc(t('add.traits'))} <span class="chips inl">${C.TRAITS.map(k => `<button class="chip ${st.traits.includes(k) ? 'on' : ''}" data-tr="${k}" title="${esc(t('trait.' + k + '_tip'))}">${esc(t('trait.' + k))}</button>`).join('')}</span></div>
        <div class="row" style="justify-content:flex-end;margin:12px 0 0"><button id="acancel">${esc(t('btn.cancel'))}</button><button id="aok" class="primary">${esc(t('add.ok'))}</button></div></div></div>`, true);
      dlg.querySelector('#an').oninput = e => { st.name = e.target.value; };
      dlg.querySelector('#aa').onchange = e => {
        const a = C.archOf(e.target.value); st.arch = a.id; st.pronoun = a.pronoun; st.age = a.age; st.look = Object.assign({}, a.look);
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
      const bd = dlg.querySelector('#abeard'); if (bd) bd.onchange = () => { st.look.beard = bd.checked; render(); };
      dlg.querySelector('#acancel').onclick = () => { U.closeDialog(); done && done(false); };
      dlg.querySelector('#aok').onclick = async () => {
        const a = C.archOf(st.arch), role = U.archName(a.id);
        await G.createPerson({ arch: a.id, name: st.name.trim() || role, roleText: role, pronoun: st.pronoun, age: st.age, look: st.look, traits: st.traits, conditions: st.cond ? [st.cond] : [] });
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

  /* ---------- 设置（齿轮） ---------- */
  const OPT = { 'interrupt.mode': ['keep', 'countdown_default', 'countdown_dismiss'], 'interrupt.frequency': ['test', 'often', 'normal', 'rare'], 'time.mode': ['real', 'compressed', 'paused'], 'time.daynight': ['auto', 'system', 'game'], 'ui.avatar_style': ['simple', 'detailed'], 'ai.provider': ['none', 'openai_compat', 'mock'], 'ai.autonomy': ['text_only', 'suggest', 'bounded'] };
  const SKIP = new Set(['ui.theme', 'ui.background', 'ui.language', 'ui.scene', 'play.last_mode']);
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
      <div class="row">${esc(t('set.scene'))} ${chips('scene', ['auto', ...CY.scenes.ids, 'none'], ['auto', ...CY.scenes.ids, 'none'].map(k => t('scene.' + k)), ini.get(G.cfg, 'ui', 'scene'))}</div>
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
  /* ---------- 照顾的代价：居家办公的提示条、钱、商店、家人与保姆、体验选择 ---------- */
  U.renderLife = function () {
    const bar = $('lifeBar'), eco = G.economyOn(), people = G.activePeople(), tasks = G.tasks();
    const show = ini.bool(G.cfg, 'ui', 'wfh_notice') && people.length > 0;
    bar.style.display = show ? '' : 'none';
    if (!show) return;
    const mode = G.isPaused() ? 'paused' : G.playMode(), work = G.isWorkTime();
    const sig = [eco, mode, work, Math.floor(G.world.money), people.length, tasks.map(x => x.pid + x.act).join(), I.lang, JSON.stringify(G.world.inv || {})].join('|');
    if (bar.dataset.sig !== sig) {
      bar.dataset.sig = sig;
      const n = people.length;
      const taskHtml = tasks.slice().reverse().map((x, i) => {
        const run = i === 0 && G.timeMode() === 'compressed', who = G.get(x.pid), idx = tasks.length - 1 - i;
        return `<span class="taskrow ${run ? '' : 'paused'}">${run ? '⏳' : '⏸'} ${esc(who ? who.person.name : '')} ${esc(x.label)}<span class="bar"><i data-tb="${idx}"></i></span><button class="chip" data-tc="${idx}">${esc(t('btn.cancel'))}</button></span>`;
      }).join('');
      bar.innerHTML = `<span class="wfh">💼 ${esc(t(eco ? (work ? 'life.working' : 'life.offwork') : 'life.wfh', { n }))}</span>` +
        (eco ? `<span class="money" title="${esc(t('life.money_tip'))}">💰 ${Math.floor(G.world.money)}</span>` : '') +
        `<span class="modehint" title="${esc(t('mode.' + mode + '_tip'))}">${esc(t('mode.hint_' + mode))}</span>` + taskHtml +
        (eco ? `<button id="shopBtn">${esc(t('life.shop'))}</button>` : '') + `<button id="homeBtn">${esc(t('life.household'))}</button>`;
      if ($('shopBtn')) $('shopBtn').onclick = () => U.shopDialog();
      $('homeBtn').onclick = () => U.householdDialog();
      bar.querySelectorAll('[data-tc]').forEach(b => b.onclick = () => G.cancelAction(+b.dataset.tc));
    }
    bar.querySelectorAll('[data-tb]').forEach(el => { const x = tasks[+el.dataset.tb]; if (x) el.style.width = Math.min(100, (x.total - x.left) / x.total * 100) + '%'; });
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
  U.householdDialog = function () {
    const eco = G.economyOn();
    const list = G.activePeople().slice().sort((a, b) => G.urgency(b) - G.urgency(a));
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('home.title'))}</h2>
      ${list.map(p => { const cl = G.classKey(p), u = G.urgency(p);
        return `<div class="shoprow"><span class="nm">${esc(p.person.name)}</span><span class="pill">${esc(t('class.' + cl))}</span>
          <span class="bar" title="${esc(t('home.urgency'))}"><i style="width:${Math.min(100, Math.round(u / 3 * 100))}%"></i></span>
          <span class="mute">${esc(t('home.self', { n: Math.round(G.classOf(p).self_care * 100) }))}</span>
          ${eco ? `<label><input type="checkbox" data-nn="${p.id}" ${G.hasNanny(p) ? 'checked' : ''}> ${esc(t('home.nanny'))}</label>` : ''}</div>`; }).join('')}
      ${eco ? `<div class="mute" style="margin-top:8px">${esc(t('home.nanny_note', { cost: G.nannyCostPerHour() }))}</div>` : ''}
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button id="hclose">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelectorAll('[data-nn]').forEach(c => c.onchange = () => { G.setNanny(c.dataset.nn, c.checked); U.renderLife(); });
    dlg.querySelector('#hclose').onclick = U.closeDialog;
  };

  /* 第一次有了角色之后，讲清楚照顾的代价，并让玩家选一种模式开始 */
  U.maybeIntro = function () { if (!G.world.intro_done) U.introDialog(); };
  U.introDialog = function () {
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('intro.title'))}</h2><p>${esc(t('intro.p1'))}</p><p>${esc(t('intro.p2'))}</p>
      <button class="preset" data-m="reality"><b>${esc(t('intro.reality'))}</b><br><span class="mute">${esc(t('intro.reality_note'))}</span></button>
      <button class="preset" data-m="story"><b>${esc(t('intro.story'))}</b><br><span class="mute">${esc(t('intro.story_note'))}</span></button>
      <div class="mute">${esc(t('intro.later'))}</div>`, true);
    dlg.querySelectorAll('[data-m]').forEach(b => b.onclick = async () => {
      const story = b.dataset.m === 'story';
      G.cfg.play = G.cfg.play || {};
      G.cfg.play.economy = story ? 'true' : 'false';
      G.world.intro_done = true; G.save(true); await G.setPlayMode(story ? 'story' : 'reality');
      U.closeDialog(); U.renderLife(); U.renderControls(); U.renderRoom(true);
    });
  };

  /* 切换模式时的说明：说清楚时间怎么走，动作怎么做，故事里没做完的事怎么处理 */
  U.switchMode = async function (m) {
    if (m === 'story' && G.economyOn() === false && !G.world.mode_hint_seen) { G.world.mode_hint_seen = true; }
    await G.setPlayMode(m);
    U.renderControls(); U.renderLife(); U.renderClock();
    const el = $('modeToast');
    el.textContent = t('mode.switched_' + m, { n: ini.num(G.cfg, 'time', 'compress_ratio'), k: G.tasks().length });
    el.style.display = 'block'; clearTimeout(U._mt); U._mt = setTimeout(() => { el.style.display = 'none'; }, 6000);
  };

  /* ---------- 角色的状态和需求 ---------- */
  U.statusDialog = function (pid) {
    const p = G.get(pid); if (!p) return;
    const st = G.statusOf(p), defs = G.needsOf(p), cls = G.classKey(p);
    const sig = () => U.statusDialog(pid);
    const bars = Object.keys(defs).sort((a, b) => p.state.needs[b] - p.state.needs[a]).map(k => `<div class="srow2"><span class="l">${defs[k].icon || ''} ${esc(G.needLabel(k, defs[k]))}</span><div class="bar"><i style="width:${Math.round(p.state.needs[k] * 100)}%"></i></div></div>`).join('');
    const selfs = Object.values(G.allActionsOf(p)).filter(a => a.self && (a.self === true || a.self.includes(G.stage(p)))).map(a => `<span class="tag">${esc(a.label)}</span>`).join('');
    const made = (G.journal[p.id] ? Object.values(G.journal[p.id]).flat() : []).filter(e => e.type === 'self').slice(-3).reverse().map(e => `<div class="mute" style="font-size:12px">${esc(e.text)}</div>`).join('');
    const dlg = U.dialog(`<div class="statgrid"><div class="prev">${CY.avatar(p)}</div><div>
      <h2 style="margin:0 0 4px">${esc(p.person.name)} <span class="pill">${esc(p.person.role || '')}</span></h2>
      <div class="mute">${esc(t('class.' + cls))}${G.isHuman(p) ? ' · ' + esc(t('status.age', { n: +G.age(p).toFixed(1) })) : ''}</div>
      <div style="margin:6px 0"><span class="tag">${esc(t('mood.' + st.mood))}</span><span class="tag">${esc(t('act.' + st.activity))}</span>${st.crying ? `<span class="tag">${esc(t('status.crying'))}</span>` : ''}${st.nanny ? `<span class="tag">${esc(t('status.nanny'))}</span>` : ''}
        ${st.conditions.map(k => `<span class="tag">🩺 ${esc(CY.tOr('cond.' + k, (G.tpl.conditions[k] || {}).label || k))}</span>`).join('')}${st.traits.map(k => `<span class="tag">${esc(t('trait.' + k))}</span>`).join('')}</div>
      <div class="srow2"><span class="l">${esc(t('status.mood'))}</span><div class="bar mood"><i style="width:${Math.round(p.state.mood * 100)}%"></i></div></div>
      <div class="srow2"><span class="l">${esc(t('status.frailty'))}</span><div class="bar"><i style="width:${Math.round(p.state.frailty * 100)}%"></i></div></div>
      <h3>${esc(t('status.needs'))}</h3>${bars}
      <h3>${esc(t('status.selfdo', { n: Math.round(st.self_care * 100) }))}</h3><div>${selfs || `<span class="mute">${esc(t('status.selfnone'))}</span>`}</div>${made}
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="stclose">${esc(t('btn.close'))}</button></div></div></div>`, true);
    dlg.querySelector('#stclose').onclick = U.closeDialog;
  };
})(globalThis.CY = globalThis.CY || {});
