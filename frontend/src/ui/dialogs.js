/* 设置，存档与下载，关于。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  const typeName = k => U.typeName(k);
  /* ---------- 设置（齿轮） ---------- */
  const OPT = { 'play.backend_provider': ['builtin', 'lm', 'http'], 'play.needs_source': ['builtin', 'backend'], 'time.daynight': ['auto', 'system', 'game'], 'ai.provider': ['none', 'openai_compat', 'mock'], 'ai.autonomy': ['text_only', 'suggest', 'bounded'] };
  /* 声音，时间倍率，时间模式，工作时段，时间制式都在角落按钮和日历菜单里，设置里不再重复 */
  const SKIP = new Set(['audio.music_volume', 'audio.sfx_volume', 'audio.mute', 'economy.work_hours', 'ui.clock_12h', 'time.speed', 'time.mode', 'time.fast_speed', 'time.daynight', 'ui.theme', 'ui.language', 'ui.figure', 'ui.house_view', 'play.last_mode']);
  U.settingsDialog = function () {
    /* AI、账号、后端、对外接口都在底部的高级设置里，默认折叠 */
    const ADV = k => /^(ai|account|interaction)\./.test(k) || /^play\.(backend_|needs_source|api_bridge|condition_models)/.test(k);
    const rows = (list, basic) => { let sec = ''; return list.map(([s, k, d, note]) => {
      const v = ini.get(G.cfg, s, k), key = s + '.' + k;
      const head = s !== sec ? `<h3>${esc(t('sec.' + s))}</h3>` : ''; sec = s;
      const opts = OPT[key] || (d === 'true' || d === 'false' ? ['true', 'false'] : null);
      const input = /_volume$/.test(k) ? `<input type="range" min="0" max="100" step="5" data-k="${key}" value="${esc(v)}" style="flex:1"><span class="vv" style="width:2.5em;text-align:right">${esc(v)}</span>` : opts ? `<select data-k="${key}">${opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>` : `<input data-k="${key}" ${k === 'api_key' ? 'type="password"' : ''} value="${esc(v)}">`;
      return head + `<div class="srow"><span class="k">${esc(basic ? CY.tOr('lbl.' + key, k) : k)}</span>${input}${basic ? '' : `<span class="mute n">${esc(CY.tOr('ini.' + key, note))}</span>`}</div>`;
    }).join(''); };
    const shown = ini.SCHEMA.filter(([s, k]) => !SKIP.has(s + '.' + k));
    const form = rows(shown.filter(([s, k]) => !ADV(s + '.' + k)), true);
    const advForm = rows(shown.filter(([s, k]) => ADV(s + '.' + k)));
    const th = ini.get(G.cfg, 'ui', 'theme'), lg = ini.get(G.cfg, 'ui', 'language');
    const sel = (name, vals, labels, cur) => `<select data-ap="${name}">${vals.map((v, i) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(labels[i])}</option>`).join('')}</select>`;
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('set.title'))}</h2>
      <div class="row">${esc(t('set.lang'))} ${sel('language', ['auto', ...Object.keys(I.packs)], [t('lang.auto'), ...Object.keys(I.packs).map(l => I.names[l] || l)], lg)}</div>
      <h3>${esc(t('set.look'))}</h3>
      <div class="row">${esc(t('set.theme'))} ${sel('theme', ['auto', 'light', 'dark'], [t('theme.auto'), t('theme.light'), t('theme.dark')], th)}</div>
      <div class="row">${esc(t('set.figure'))} ${sel('figure', CY.FIGURES, CY.FIGURES.map(k => t('figure.' + k)), CY.figureOf(ini.get(G.cfg, 'ui', 'figure')))}</div>
      <div class="row">${esc(t('set.house_view'))} ${sel('house_view', ['rooms', 'house'], [t('house_view.rooms'), t('house_view.house')], ini.get(G.cfg, 'ui', 'house_view') === 'house' ? 'house' : 'rooms')}</div>
      <div class="sform">${form}</div>
      <h3>${esc(t('set.danger'))}</h3><div class="mute" style="margin-bottom:6px">${esc(t('set.wipe_note'))}</div>
      <div class="row"><button id="dwipe" class="danger">${esc(t('set.wipe'))}</button></div>
      <details class="adv"><summary>${esc(t('set.advanced'))}</summary>
      <h3>${esc(t('set.data'))}</h3><div class="mute" style="margin-bottom:6px"><b>${esc(t('set.d_where'))}</b> ${esc(t('set.data_note', { where: store.backend.label }))}</div>
        <div class="drows">
            <div class="drow"><button id="dknow">${esc(t('set.know'))}</button><span class="mute">${esc(t('set.d_know_note'))}</span></div>
          ${G.DEVTOOLS && CY.account.configured(G.cfg) ? `<div class="drow"><button id="dacct">${esc(t('acct.title'))}</button></div>` : ''}
        </div>
        <h3>${esc(t('set.unf_title'))}</h3><div class="mute" style="margin-bottom:6px">${esc(t('set.unf_note'))}</div>
        <div class="drows">
          ${G.DEVTOOLS ? `<div class="drow"><button id="dsave">${esc(t('hdr.save'))}</button><span class="mute">${esc(t('set.d_save_note'))}</span></div>` : ''}
          <div class="drow"><button id="dfolder">${esc(t('set.folder'))}</button><span class="mute">${esc(t('set.d_folder_note'))}</span></div>
        </div>
        <div class="sform">${advForm}</div></details>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="scancel" class="primary">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelectorAll('[data-ap]').forEach(el => el[el.tagName === 'SELECT' ? 'onchange' : 'onclick'] = async () => {
      const k = el.dataset.ap; G.cfg.ui = G.cfg.ui || {}; G.cfg.ui[k] = el.tagName === 'SELECT' ? el.value : el.dataset.v;
      await G.saveCfg(); U.applyTheme(); if (k === 'language') U.applyLang(); if (k === 'figure') U.afterPeopleChange(); if (k === 'house_view') { U.viewPlace = 'home'; U.renderRoom(true); } U.settingsDialog();
    });
    dlg.querySelector('#scancel').onclick = U.closeDialog;
    /* 改了就生效，不用另外保存 */
    dlg.querySelectorAll('input[type=range]').forEach(el => el.oninput = () => { const vv = el.parentNode.querySelector('.vv'); if (vv) vv.textContent = el.value; });
    dlg.querySelectorAll('[data-k]').forEach(el => el.onchange = async () => {
      const [sc, k] = el.dataset.k.split('.'); G.cfg[sc] = G.cfg[sc] || {}; G.cfg[sc][k] = el.value.trim();
      await G.saveCfg(); if (CY.sound) CY.sound.apply(); U.renderRoom(true); U.renderClock();
    });
    const dsv = dlg.querySelector('#dsave'); if (dsv) dsv.onclick = () => U.saveDialog();
    const ac = dlg.querySelector('#dacct'); if (ac) ac.onclick = () => U.accountDialog();
    dlg.querySelector('#dfolder').onclick = async () => {
      try { const had = await store.chooseFolder(); await G.load(); U.closeDialog(); U.afterPeopleChange(); alert(t(had ? 'set.folder_had' : 'set.folder_copied')); } catch (e) { alert(e.message); }
    };
    dlg.querySelector('#dwipe').onclick = () => U.wipeDialog();
    dlg.querySelector('#dknow').onclick = () => U.knowledgeDialog();
  };

  /* 删除全部本地数据：先建议下载存档，再要求明确确认 */
  U.wipeDialog = function () {
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('wipe.title'))}</h2><p>${esc(t('wipe.body'))}</p>
      ${G.DEVTOOLS ? `<div class="row"><button id="wsave">${esc(t('wipe.save_first'))}</button></div>` : ''}
      <label class="row"><input type="checkbox" id="wsure"> ${esc(t('wipe.sure'))}</label>
      <div class="row" style="justify-content:flex-end"><button id="wno">${esc(t('btn.cancel'))}</button><button id="wgo" class="danger" disabled>${esc(t('wipe.go'))}</button></div>`);
    const wsv = dlg.querySelector('#wsave'); if (wsv) wsv.onclick = async () => { G.save(true); await new Promise(r => setTimeout(r, 200)); const s = await A.exportSave(); A.saveBlob(s.blob, s.name); };
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
      for (const mk in G.journal[p.id] || {}) for (const e of G.journal[p.id][mk]) logRows.push([p.person.name, e.t, e.day || '', typeName(e.type), G.entryText(e)]);
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
      if (info.kind === 'pack') {
        out.innerHTML = `<div class="card"><div>${esc(t('import.pack', { names: info.conditions.join(t('sep.list')), n: Object.keys(info.files).length }))}</div><div class="row"><button id="igo" class="primary">${esc(t('import.go'))}</button></div></div>`;
        out.querySelector('#igo').onclick = async () => {
          const n = await A.apply(info, 'merge');
          if (CY.lm) { CY.lm.ready = false; CY.lm.error = null; }
          G.stop(); await G.load(); G.start(); if (CY.lm) await CY.lm.load(); U.afterPeopleChange();
          out.innerHTML = `<div class="ok">${esc(t('import.done', { n }))}</div>`;
        };
        return;
      }
      const m = info.manifest;
      out.innerHTML = `<div class="card"><div>${esc(t('import.found', { n: info.people.length, names: info.people.map(p => p.name).join(t('sep.list')) || '-' }))}</div>
        ${m ? `<div class="mute">${esc(t('import.manifest', { v: m.version, at: (m.created || '').slice(0, 16).replace('T', ' ') }))}</div>` : ''}
        ${info.edited ? `<div class="warn">${esc(t('import.edited'))}</div>` : ''}
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
    const M = CY.meta, tabs = ['about', 'data', 'author'];
    const para = keys => keys.map(k => `<p>${esc(t(k))}</p>`).join('');
    const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(text || href)}</a>`;
    const ISSUES = 'https://github.com/shenfan19/care-for-you/issues', PAGE = 'https://shenfan19.github.io', GH = 'https://github.com/shenfan19/care-for-you';
    const body = {
      about: para(['about.p1', 'about.how', 'about.p3', 'about.p4']) + `<p>${link(ISSUES)}</p>`,
      data: `<h3>${esc(t('priv.h1'))}</h3>${para(['priv.p1', 'priv.p2', 'priv.p3'])}<h3>${esc(t('data.head'))}</h3><p>${esc(t('data.intro'))}</p>
        <h4>${esc(t('data.h1'))}</h4><p>${esc(t('data.p1'))}</p><h4>${esc(t('data.h2'))}</h4><p>${esc(t('data.p2'))}</p><h4>${esc(t('data.h3'))}</h4><p>${esc(t('data.p3'))}</p>
        <h3>${esc(t('priv.h3'))}</h3>${para(['priv.p6', 'priv.p7', 'priv.p8'])}<h3>${esc(t('priv.h4'))}</h3>${para(['priv.p9', 'priv.p10'])}`,
      author: `<h3>Fan Shen</h3>${para(['about.p2'])}<p>${esc(t('au.page'))}：${link(PAGE)}<br>GitHub：${link(GH)}<br>${esc(t('au.mail'))}：contact@careforyou.dev</p>
        <h3>${esc(t('au.credits'))}</h3>${para(['cred.p1', 'cred.p2', 'cred.p3'])}`,
    };
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('about.title'))}</h2><div class="chips">${tabs.map(k => `<button class="chip ${k === tab ? 'on' : ''}" data-t="${k}">${esc(t('about.tab_' + k))}</button>`).join('')}</div>
      <div class="aboutbody">${body[tab]}</div><div class="row" style="justify-content:space-between;margin-top:10px"><span class="mute" style="font-size:12px">${esc(t('ver.line', { app: M.app, v: M.version, schema: M.schema, date: M.released }))}</span><button id="aclose">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelectorAll('.chip').forEach(b => b.onclick = () => U.aboutDialog(b.dataset.t));
    dlg.querySelector('#aclose').onclick = U.closeDialog;
  };

  /* ---------- 开发者面板：只在开发者模式（网址带 ?devtools）里出现，调金钱，改时间，请来客，测试新功能 ----------
     只给开发和评审用，文字不进语言包，直接写中文 */
  U.devDialog = function () {
    const V = CY.visitors, hh = () => { const m = G.dayMinutes(); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.floor(m % 60)).padStart(2, '0'); };
    const cards = V ? V.order.map(id => `<option value="${id}">${esc(t('visitor.' + id + '.name'))}</option>`).join('') : '';
    const dlg = U.dialog(`<h2 style="margin-top:0">开发者面板</h2><div class="mute">只在开发者模式里出现，普通玩家看不到。</div>
      <h3>金钱　<span class="mute" id="dmNow"></span></h3>
      <div class="row"><input id="dmv" type="number" step="10" style="width:100px"> <button data-d="money-set">设为</button><button data-d="money+100">+100</button><button data-d="money+1000">+1000</button><button data-d="money-100">−100</button></div>
      <h3>时间　<span class="mute" id="dtNow"></span></h3>
      <div class="row"><input id="dth" type="number" min="0" max="23.99" step="0.5" value="12" style="width:80px"> 点 <button data-d="clock-set">设为这个钟点</button><button data-d="ff1">快进 1 小时</button><button data-d="ff6">快进 6 小时</button><button data-d="ffmid">快进到午夜结算</button></div>
      <div class="row">流速每现实分钟 <input id="dsp" type="number" min="1" step="10" style="width:80px"> 游戏分钟 <button data-d="speed">应用</button><button data-d="speed-reset">恢复默认</button></div>
      <h3>穿越者</h3>
      <div class="row"><select id="dvc">${cards}</select><button data-d="visit">让他现在来</button><button data-d="visit-next">客房空位立刻可来新客人</button><button data-d="visit-clear">送走所有来客</button></div>
      <h3>统计</h3>
      <div class="row"><button data-d="ledger">贡献统计</button><span class="mute">谁照顾了谁；默认关，见 templates/system.yaml 的 modules</span></div>
      <h3>角色</h3>
      <div class="row"><button data-d="needs-low">全部需求设为 0.1</button><button data-d="needs-high">全部需求设为 0.8</button><button data-d="flags-clear">清除外出和住院标记</button><button data-d="afford">所有商品和床位可买</button></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="dclose" class="primary">关闭</button></div>`, true);
    const refresh = () => { dlg.querySelector('#dmNow').textContent = Math.round(G.world.money || 0); dlg.querySelector('#dtNow').textContent = '第' + G.gameDate().n + '天 ' + hh() + '，流速 ' + Math.round(G.speed()); dlg.querySelector('#dsp').placeholder = Math.round(G.speed()); };
    const redraw = () => { refresh(); G.save(true); U.renderRoom(true); U.renderClock(); U.renderBar(); U.renderFeed(true); U.renderLife && U.renderLife(); };
    const ff = async minutes => { let left = minutes; while (left > 0) { const c = Math.min(30, left); G.advanceDay(c, false); left -= c; } G.dayRoll(); };
    refresh();
    dlg.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => {
      const a = b.dataset.d, num = id => parseFloat(dlg.querySelector(id).value);
      if (a === 'money-set') { const v = num('#dmv'); if (isFinite(v)) G.world.money = v; }
      else if (a.startsWith('money')) G.world.money = (G.world.money || 0) + (a === 'money-100' ? -100 : a === 'money+1000' ? 1000 : 100);
      else if (a === 'clock-set') { const v = num('#dth'); if (isFinite(v)) { G.setClock(Math.round(v * 60)); G._dayN = G.gameDate().n; } }
      else if (a === 'ff1') await ff(60);
      else if (a === 'ff6') await ff(360);
      else if (a === 'ffmid') await ff(1440 - G.dayMinutes() + 1);
      else if (a === 'speed') { const v = num('#dsp'); if (isFinite(v) && v > 0) { G.cfg.time = G.cfg.time || {}; G.cfg.time.speed = String(v); await G.saveCfg(); } }
      else if (a === 'speed-reset') { if (G.cfg.time) delete G.cfg.time.speed; await G.saveCfg(); }
      else if (a === 'visit') { await G.arrive(dlg.querySelector('#dvc').value, true); await G.load(); U.afterPeopleChange(); }
      else if (a === 'visit-next') { G.world.next_visit = 0; G.world.guest_full = false; G.maybeArrive(); }
      else if (a === 'visit-clear') { for (const p of G.visitorPeople().slice()) await G.deletePerson(p.id); U.afterPeopleChange(); }
      else if (a === 'needs-low' || a === 'needs-high') { for (const p of G.activePeople()) for (const k in p.state.needs) G.setNeed(p, k, a === 'needs-low' ? 0.1 : 0.8); }
      else if (a === 'flags-clear') { for (const p of G.activePeople()) { G.clearFlag(p, 'outing'); G.clearFlag(p, 'hospital'); } }
      else if (a === 'afford') G.world.money = Math.max(G.world.money || 0, 5000);
      else if (a === 'ledger') { U.ledgerDialog(); return; }
      redraw();
    });
    dlg.querySelector('#dclose').onclick = U.closeDialog;
  };
})(globalThis.CY = globalThis.CY || {});
