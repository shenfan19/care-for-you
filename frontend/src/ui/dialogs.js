/* 设置，存档与下载，关于。 */
(function (CY) {
  const G = CY.game, ini = CY.ini, store = CY.store, C = CY.content, A = CY.archive, I = CY.i18n;
  const t = (k, v) => CY.t(k, v);
  const U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const $ = id => document.getElementById(id);
  const typeName = k => U.typeName(k);
  /* ---------- 设置（齿轮） ---------- */
  const OPT = { 'time.speed': ['1', '6', '24', '60'], 'audio.volume': ['0', '0.25', '0.5', '0.75', '1'], 'interrupt.frequency': ['test', 'often', 'normal', 'rare'], 'play.backend_provider': ['builtin', 'http'], 'play.needs_source': ['builtin', 'backend'], 'time.daynight': ['auto', 'system', 'game'], 'ai.provider': ['none', 'openai_compat', 'mock'], 'ai.autonomy': ['text_only', 'suggest', 'bounded'] };
  const SKIP = new Set(['time.daynight', 'ui.theme', 'ui.background', 'ui.language', 'ui.scene', 'ui.figure', 'play.last_mode']);
  const BGS = ['warm', 'mint', 'sky', 'rose', 'gray'], BG_HEX = { warm: '#e9d9c0', mint: '#cfe7da', sky: '#cfe0f2', rose: '#f0d3d9', gray: '#d9d9dc' };
  U.settingsDialog = function () {
    /* AI、账号、后端、对外接口都在底部的高级设置里，默认折叠 */
    const ADV = k => /^(ai|account)\./.test(k) || /^play\.(backend_|needs_source|api_bridge)/.test(k);
    const rows = list => { let sec = ''; return list.map(([s, k, d, note]) => {
      const v = ini.get(G.cfg, s, k), key = s + '.' + k;
      const head = s !== sec ? `<h3>${esc(t('sec.' + s))}</h3>` : ''; sec = s;
      const opts = OPT[key] || (d === 'true' || d === 'false' ? ['true', 'false'] : null);
      const input = opts ? `<select data-k="${key}">${opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>` : `<input data-k="${key}" ${k === 'api_key' ? 'type="password"' : ''} value="${esc(v)}">`;
      return head + `<div class="srow"><span class="k">${k}</span>${input}<span class="mute n">${esc(CY.tOr('ini.' + key, note))}</span></div>`;
    }).join(''); };
    const shown = ini.SCHEMA.filter(([s, k]) => !SKIP.has(s + '.' + k));
    const form = rows(shown.filter(([s, k]) => !ADV(s + '.' + k)));
    const advForm = rows(shown.filter(([s, k]) => ADV(s + '.' + k)));
    const th = ini.get(G.cfg, 'ui', 'theme'), bg = ini.get(G.cfg, 'ui', 'background'), lg = ini.get(G.cfg, 'ui', 'language');
    const sel = (name, vals, labels, cur) => `<select data-ap="${name}">${vals.map((v, i) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(labels[i])}</option>`).join('')}</select>`;
    const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('set.title'))}</h2>
      <h3>${esc(t('set.look'))}</h3>
      <div class="row">${esc(t('set.theme'))} ${sel('theme', ['auto', 'light', 'dark'], [t('theme.auto'), t('theme.light'), t('theme.dark')], th)}</div>
      <div class="row">${esc(t('set.bg'))} <span class="sws">${BGS.map(b => `<span class="sw ${b === bg ? 'on' : ''}" data-ap="background" data-v="${b}" title="${esc(t('bg.' + b))}" style="background:${BG_HEX[b]}"></span>`).join('')}</span></div>
      <div class="row">${esc(t('set.scene'))} ${sel('scene', ['auto', ...CY.scenes.ids, 'none'], ['auto', ...CY.scenes.ids, 'none'].map(k => t('scene.' + k)), ini.get(G.cfg, 'ui', 'scene'))}</div>
      <div class="row">${esc(t('set.figure'))} ${sel('figure', CY.FIGURES, CY.FIGURES.map(k => t('figure.' + k)), CY.figureOf(ini.get(G.cfg, 'ui', 'figure')))}</div>
      <div class="row">${esc(t('set.lang'))} ${sel('language', ['auto', ...Object.keys(I.packs)], [t('lang.auto'), ...Object.keys(I.packs).map(l => I.names[l] || l)], lg)}</div>
      <div class="sform">${form}</div>
      <h3>${esc(t('set.clock'))}</h3><div class="mute" style="margin-bottom:6px">${esc(t('set.clock_note'))}</div>
      <div class="row"><input type="time" id="clk" value="${G.clock().hh}:${G.clock().mm}"><button id="clkset">${esc(t('set.clock_set'))}</button><button id="clksync">${esc(t('set.clock_sync'))}</button></div>
      <h3>${esc(t('set.data'))}</h3><div class="mute" style="margin-bottom:6px">${esc(t('set.data_note', { where: store.backend.label }))}</div>
      <div class="row"><button id="dsave">${esc(t('hdr.save'))}</button><button id="dfolder">${esc(t('set.folder'))}</button><button id="drestore">${esc(t('set.restore'))}</button></div>
      <h3>${esc(t('set.danger'))}</h3><div class="mute" style="margin-bottom:6px">${esc(t('set.wipe_note'))}</div>
      <div class="row"><button id="dwipe" class="danger">${esc(t('set.wipe'))}</button></div>
      <details class="adv"><summary>${esc(t('set.advanced'))}</summary><div class="sform">${advForm}</div></details>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="scancel" class="primary">${esc(t('btn.close'))}</button></div>`, true);
    dlg.querySelectorAll('[data-ap]').forEach(el => el[el.tagName === 'SELECT' ? 'onchange' : 'onclick'] = async () => {
      const k = el.dataset.ap; G.cfg.ui = G.cfg.ui || {}; G.cfg.ui[k] = el.tagName === 'SELECT' ? el.value : el.dataset.v;
      await G.saveCfg(); U.applyTheme(); if (k === 'language') U.applyLang(); if (k === 'figure') U.afterPeopleChange(); U.settingsDialog();
    });
    dlg.querySelector('#scancel').onclick = U.closeDialog;
    /* 改了就生效，不用另外保存 */
    dlg.querySelectorAll('[data-k]').forEach(el => el.onchange = async () => {
      const [sc, k] = el.dataset.k.split('.'); G.cfg[sc] = G.cfg[sc] || {}; G.cfg[sc][k] = el.value.trim();
      await G.saveCfg(); if (CY.sound) CY.sound.apply(); U.renderRoom(true); U.renderClock();
    });
    const clockDone = async () => { await G.save(true); U.renderClock(); U.renderRoom(true); U.settingsDialog(); };
    dlg.querySelector('#clkset').onclick = async () => { const m = /^(\d{1,2}):(\d{2})$/.exec(dlg.querySelector('#clk').value); if (!m) return; G.setClock(+m[1] * 60 + +m[2]); await clockDone(); };
    dlg.querySelector('#clksync').onclick = async () => { G.alignClock(); await clockDone(); };
    dlg.querySelector('#dsave').onclick = () => U.saveDialog();
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
      about: para(['about.p1', 'about.p5', 'about.p2', 'about.p3', 'about.p4']),
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
