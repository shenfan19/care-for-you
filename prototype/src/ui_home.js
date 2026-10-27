/* 主页：顶栏、发生的事、说过的话，以及添加角色、引导、设置、下载。全部在一页里，没有标签页。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content;
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  const TYPE = { care: '照顾', talk: '谈话', missed: '没赶上', cares_back: '心意', glance: '看了你一眼', event: '事件', frail: '虚弱', recovered: '缓过来', reveal: '那一刻', picked: '记起的话', nudge: '提醒' };
  const fmtT = t => { const d = new Date(t); return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const view = { who: '', more: 40 };

  /* ---------- 通用弹窗 ---------- */
  U.dialog = function (html, wide) {
    const m = $('modal');
    m.innerHTML = `<div class="box ${wide ? 'wide' : ''}">${html}</div>`;
    m.style.display = 'grid';
    return m.firstChild;
  };
  U.closeDialog = function () { const m = $('modal'); m.style.display = 'none'; m.innerHTML = ''; };

  /* ---------- 顶栏 ---------- */
  U.renderClock = function () {
    const c = G.clock(), mode = ini.get(G.cfg, 'time', 'mode');
    $('clockTxt').textContent = `第 ${c.day} 天 ${c.hh}:${c.mm}`;
    if ($('timeMode').value !== mode) $('timeMode').value = mode;
  };

  /* ---------- 房间下方：添加与离开中的角色 ---------- */
  U.renderBar = function () {
    const away = G.people.filter(p => p.person.active === false);
    const sig = away.map(p => p.id).join() + U.floating;
    const bar = $('roomBar');
    if (bar.dataset.sig === sig) return;
    bar.dataset.sig = sig;
    $('floatNote').style.display = U.floating ? 'block' : 'none';
    $('roomSlot').style.display = U.floating ? 'none' : 'block';
    bar.innerHTML = '<button id="addBtn" class="primary">＋ 添加</button>' +
      away.map(p => `<span class="pill">${esc(p.person.name)}暂时离开 <a href="#" data-id="${p.id}">叫回来</a></span>`).join('');
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
    const sig = view.who + view.more + all.length + G.people.map(p => p.id + p.person.name + p.story.care_total).join();
    const root = $('feed');
    if (!force && root.dataset.sig === sig) return;
    root.dataset.sig = sig;
    const chips = ['<button class="chip ' + (view.who ? '' : 'on') + '" data-w="">大家</button>'].concat(G.people.map(p => `<button class="chip ${view.who === p.id ? 'on' : ''}" data-w="${p.id}">${esc(p.person.name)}</button>`)).join('');
    const stat = view.who && G.get(view.who) ? (() => {
      const p = G.get(view.who), n = t => all.filter(x => x.pid === p.id && x.e.type === t).length;
      return `<div class="mute stat">一共照顾了 ${p.story.care_total} 次，谈话 ${n('talk')} 次，没赶上 ${n('missed')} 次${p.story.revealed ? `，${esc(p.person.name)}给你的心意 ${p.story.cares_back_total} 次` : ''}</div>`;
    })() : '';
    root.innerHTML = `<h2>发生的事</h2><div class="chips">${chips}</div>${stat}` +
      (list.slice(0, view.more).map(x => `<div class="tl"><span class="t">${fmtT(x.e.t)}<br>第 ${x.e.day || '?'} 天</span><span class="who">${esc(nameOf(x.pid))}</span><span class="pill">${TYPE[x.e.type] || x.e.type}</span><span class="x">${esc(x.e.text)}</span></div>`).join('') || '<div class="mute">还没有发生什么。</div>') +
      (list.length > view.more ? '<div class="row" style="margin-top:8px"><button id="moreBtn">再看一些</button></div>' : '');
    root.querySelectorAll('.chip').forEach(b => b.onclick = () => { view.who = b.dataset.w; view.more = 40; U.renderFeed(true); });
    const mb = $('moreBtn'); if (mb) mb.onclick = () => { view.more += 60; U.renderFeed(true); };
  };

  /* ---------- 说过的话（只读：不能在这里改字，想改就去数据文件夹里改明文） ---------- */
  U.renderSaid = function (force) {
    const root = $('said');
    const sig = G.people.map(p => p.id + (G.sayings[p.id] || []).length).join();
    if (!force && root.dataset.sig === sig) return;
    root.dataset.sig = sig;
    const open = new Set([...root.querySelectorAll('details[open]')].map(d => d.dataset.id));
    root.innerHTML = '<h2>说过的话</h2>' + (G.people.map(p => {
      const items = (G.sayings[p.id] || []).slice().reverse().filter(s => s.lib || s.by === 'you');
      const n = items.filter(s => s.lib).length;
      return `<details data-id="${p.id}" ${open.has(p.id) ? 'open' : ''}><summary>${esc(p.person.name)}<span class="mute">　你记起的 ${n} 句，你回答的 ${items.filter(s => s.by === 'you').length} 句</span></summary>` +
        (items.slice(0, 80).map(s => `<div class="tl"><span class="t">${fmtT(s.t)}</span><span class="who ${s.by === 'you' ? 'said-you' : ''}">${s.by === 'you' ? '你' : esc(p.person.name)}</span><span class="x">${esc(s.text)}</span>${s.lib ? `<span class="pill" title="说话库编号">${esc(s.lib)}</span>` : ''}</div>`).join('') || '<div class="mute" style="padding:6px 0">还没有。游戏里偶尔会问你，这个人会说哪句话。</div>') + '</details>';
    }).join('') || '<div class="mute">还没有角色。</div>');
  };

  /* ---------- 添加角色 ---------- */
  U.addDialog = function (archId, done) {
    const A = CY.avatarOptions;
    const arch0 = C.archOf(archId) || C.archetypes[0];
    const st = { arch: arch0.id, name: '', pronoun: arch0.pronoun, age_stage: arch0.age_stage, look: Object.assign({}, arch0.look), cond: '' };
    const sw = (k, vals, cur, hexOf) => `<span class="sws">${vals.map((v, i) => `<span class="sw ${String(cur) === String(v) ? 'on' : ''}" data-k="${k}" data-v="${v}" style="background:${hexOf ? hexOf(v, i) : v}"></span>`).join('')}</span>`;
    const sel = (k, vals, labels, cur) => `<select data-s="${k}">${vals.map((v, i) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${labels[i]}</option>`).join('')}</select>`;
    function render() {
      const arch = C.archOf(st.arch), human = arch.species === 'human';
      const archSel = ['family', 'animal'].map(g => `<optgroup label="${g === 'family' ? '家人和朋友' : '动物'}">${C.archetypes.filter(a => a.group === g).map(a => `<option value="${a.id}" ${a.id === st.arch ? 'selected' : ''}>${a.role}</option>`).join('')}</optgroup>`).join('');
      const look = st.look;
      const dlg = U.dialog(`<div class="addgrid"><div class="prev">${CY.avatarPreview(arch, look)}</div><div>
        <div class="row"><input id="an" placeholder="名字，例如 阿牛" value="${esc(st.name)}" style="flex:1"><select id="aa">${archSel}</select></div>
        ${human ? `<div class="row">称呼 ${sel('pronoun', ['他', '她', '它'], ['他', '她', '它'], st.pronoun)} 年龄 ${sel('age_stage', ['child', 'adult', 'elder'], ['孩子', '成人', '老人'], st.age_stage)}
          眼镜 ${sel('glasses', A.glasses, A.glassesLabel, look.glasses === true ? 'round' : look.glasses || 'none')}
          <label><input type="checkbox" id="abeard" ${look.beard ? 'checked' : ''}> 胡子</label></div>
          <div class="row">肤色 ${sw('skin', [0, 1, 2, 3, 4, 5], look.skin, (v) => A.skin[v])} 发色 ${sw('hair_color', A.hairColor, look.hair_color, v => A.hairColorHex[v])}</div>
          <div class="row">发型 ${sel('hair_style', A.hairStyle, A.hairStyleLabel, look.hair_style)} 衣服 ${sw('cloth', A.clothes, look.cloth)}</div>
          <div class="row">基础疾病 ${sel('cond', ['', ...Object.keys(G.tpl.conditions)], ['无', ...Object.values(G.tpl.conditions).map(c => c.label)], st.cond)}</div>`
        : `<div class="row">毛色 ${sw('coat', A.coatBySpecies[arch.species] || A.coat, look.coat, v => A.coatHex[v])}</div>`}
        <div class="row" style="justify-content:flex-end;margin:12px 0 0"><button id="acancel">取消</button><button id="aok" class="primary">添加</button></div></div></div>`, true);
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
        const a = C.archOf(st.arch);
        await G.createPerson({ arch: a.id, name: st.name.trim() || a.role, pronoun: st.pronoun, age_stage: st.age_stage, look: st.look, conditions: st.cond ? [st.cond] : [] });
        await G.load(); U.closeDialog(); U.afterPeopleChange(); done && done(true);
      };
    }
    render();
  };

  U.afterPeopleChange = function () {
    U.renderRoom(true); U.renderBar(); U.renderFeed(true); U.renderSaid(true);
  };

  /* ---------- 引导：家里还是空的时候 ---------- */
  U.onboard = function () {
    const added = [];
    function render() {
      const chip = a => `<button class="chip" data-a="${a.id}">${esc(a.role)}</button>`;
      const dlg = U.dialog(`<h2 style="margin-top:0">你有什么人要照顾吗？</h2>
        <div class="mute" style="margin-bottom:8px">选一个开始就行，之后随时可以再添加。</div>
        <h3>推荐</h3>${C.presets.map(p => `<button class="preset" data-p="${p.id}"><b>${esc(p.label)}</b><br><span class="mute">${esc(p.note)}</span></button>`).join('')}
        <h3>家人和朋友</h3><div class="chips">${C.archetypes.filter(a => a.group === 'family').map(chip).join('')}</div>
        <h3>动物</h3><div class="chips">${C.archetypes.filter(a => a.group === 'animal').map(chip).join('')}</div>
        <div class="row" style="margin-top:14px;justify-content:space-between"><span class="mute">${added.length ? '已添加：' + added.join('、') : ''}</span>
          <button id="obgo" class="primary">${added.length ? '开始' : '先看看，以后再加'}</button></div>`, true);
      dlg.querySelectorAll('.chip').forEach(b => b.onclick = () => U.addDialog(b.dataset.a, ok => { if (ok) added.push(G.people[G.people.length - 1].person.name); render(); }));
      dlg.querySelectorAll('.preset').forEach(b => b.onclick = async () => {
        const pr = C.presets.find(x => x.id === b.dataset.p);
        for (const m of pr.members) await G.createPerson({ arch: m.arch, name: m.name, conditions: m.conditions });
        await G.load(); U.closeDialog(); U.afterPeopleChange();
      });
      dlg.querySelector('#obgo').onclick = () => { U.closeDialog(); U.afterPeopleChange(); };
    }
    render();
  };

  /* ---------- 设置（齿轮） ---------- */
  const SECTION = { interrupt: '打扰', time: '时间', player: '称呼', interaction: '互动', ui: '界面', privacy: '隐私', ai: 'AI 接入' };
  U.settingsDialog = function () {
    const OPT = { 'interrupt.mode': ['keep', 'countdown_default', 'countdown_dismiss'], 'interrupt.frequency': ['test', 'often', 'normal', 'rare'], 'time.mode': ['real', 'compressed', 'paused'], 'ai.provider': ['none', 'openai_compat', 'mock'], 'ai.autonomy': ['text_only', 'suggest', 'bounded'] };
    let sec = '';
    const form = ini.SCHEMA.map(([s, k, d, note]) => {
      const v = ini.get(G.cfg, s, k), key = s + '.' + k;
      const head = s !== sec ? `<h3>${SECTION[s] || s}</h3>` : ''; sec = s;
      const opts = OPT[key] || (d === 'true' || d === 'false' ? ['true', 'false'] : null);
      const input = opts ? `<select data-k="${key}">${opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>` : `<input data-k="${key}" ${k === 'api_key' ? 'type="password"' : ''} value="${esc(v)}">`;
      return head + `<div class="srow"><span class="k">${k}</span>${input}<span class="mute n">${esc(note)}</span></div>`;
    }).join('');
    const dlg = U.dialog(`<h2 style="margin-top:0">设置</h2><div class="sform">${form}</div>
      <h3>数据位置</h3><div class="mute" style="margin-bottom:6px">${esc(store.backend.label)}。所有数据都是明文文件，选文件夹时请确认它不会被同步到别人能看到的地方。</div>
      <div class="row"><button id="dfolder">选择数据文件夹</button><button id="drestore">补回缺失的初始文件</button></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="scancel">关闭</button><button id="sapply" class="primary">保存</button></div>`, true);
    dlg.querySelector('#scancel').onclick = U.closeDialog;
    dlg.querySelector('#sapply').onclick = async () => {
      const cfg = JSON.parse(JSON.stringify(G.cfg));
      dlg.querySelectorAll('[data-k]').forEach(el => { const [s, k] = el.dataset.k.split('.'); (cfg[s] = cfg[s] || {})[k] = el.value.trim(); });
      await store.write('settings.ini', ini.stringify(cfg));
      G.cfg = cfg; U.closeDialog(); U.renderClock();
    };
    dlg.querySelector('#dfolder').onclick = async () => {
      try { const had = await store.chooseFolder(); await G.load(); U.closeDialog(); U.afterPeopleChange(); alert(had ? '已切换到该文件夹里已有的数据' : '已把当前数据复制到该文件夹'); } catch (e) { alert(e.message); }
    };
    dlg.querySelector('#drestore').onclick = async () => {
      const have = new Set(await store.list()), seed = CY.seed.files(); let n = 0;
      for (const p in seed) if (!have.has(p)) { await store.write(p, seed[p]); n++; }
      await G.load(); alert('补回了 ' + n + ' 个文件'); U.afterPeopleChange();
    };
  };

  /* ---------- 下载：整个数据文件夹的 zip，另附方便看的表格 ---------- */
  const csv = rows => '﻿' + rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  U.summaryFiles = function () {
    const sayRows = [['角色', '时间', '谁说的', '库编号', '原文']], logRows = [['角色', '时间', '游戏天数', '类型', '内容']];
    for (const p of G.people) {
      for (const s of G.sayings[p.id] || []) sayRows.push([p.person.name, s.t, s.by === 'you' ? '你' : p.person.name, s.lib || '', s.text]);
      for (const mk in G.journal[p.id] || {}) for (const e of G.journal[p.id][mk]) logRows.push([p.person.name, e.t, e.day || '', TYPE[e.type] || e.type, e.text]);
    }
    return { 'summary/说过的话.csv': csv(sayRows), 'summary/发生的事.csv': csv(logRows) };
  };
  U.download = async function () {
    G.save(true);
    await new Promise(r => setTimeout(r, 200));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(await store.exportZip(U.summaryFiles()));
    a.download = 'careforyou-data.zip';
    a.click();
  };
})(globalThis.CY = globalThis.CY || {});
