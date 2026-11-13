/* 存档与运行包。
   存档：数据文件夹的 zip，加一份 manifest 和两份表格。
   运行包：整个网页程序的 zip，解压后双击 index.html 就能在本地运行，可以顺带带上一份存档。
   导入：读存档 zip，检查每个文件的路径和格式，再选择覆盖或合并。 */
(function (CY) {
  const { store, ini, meta } = CY;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const A = CY.archive = {};

  /* 运行包里的文件，测试会核对它和 index.html 里的脚本一致 */
  A.APP_FILES = ['locales/play_zh-CN.js', 'locales/play_en.js', 'locales/play_de.js', 'locales/play_es.js', 'locales/play_fr.js', 'locales/play_ja.js', 'locales/play_ko.js', 'locales/play_zh-TW.js', 'src/core/settle.js', 'src/ui/settle.js', 'src/data/visitors.js', 'src/data/visitors_packed.js', 'src/data/visitors_cards.js', 'src/core/visitors.js', 'src/ui/visitor.js', 'src/ui/account.js', 'index.html', 'css/style.css', 'favicon.svg', 'manifest.webmanifest', 'vendor/js-yaml.min.js',
    'src/core/meta.js', 'src/core/i18n.js', 'src/core/ini.js', 'src/core/store.js', 'src/core/archive.js', 'src/data/content.js', 'src/data/cards_packed.js', 'src/data/content_more.js', 'src/data/content_en.js', 'src/data/content_pets.js', 'src/data/content_react.js', 'src/data/content_life.js', 'src/data/content_traits.js', 'src/data/content_age.js', 'src/data/templates_packed.js', 'src/data/seed.js', 'src/data/lm_seed.js', 'src/data/references.js', 'src/ai/ai.js', 'src/ai/account.js', 'src/core/game.js', 'src/core/modules.js', 'src/core/directives.js', 'src/core/arcs.js', 'src/core/time.js', 'src/core/economy.js', 'src/core/household.js', 'src/core/agents.js', 'src/core/dispatch_policy.js', 'src/core/dispatch.js', 'src/core/ledger.js', 'src/core/clock.js', 'src/core/curves.js', 'src/backend/protocol.js', 'src/backend/local.js', 'src/backend/local_plan.js', 'src/backend/http.js', 'src/backend/core_convert.js', 'src/backend/core_assign.js', 'src/backend/core_sources.js', 'src/backend/core_needs.js', 'src/backend/core_remote.js', 'src/backend/lm.js', 'src/backend/core_runtime/index.js', 'src/backend/core_runtime/lm_core.js', 'src/backend/core_runtime/lookup_core.js', 'src/backend/core_runtime/expr.js', 'src/backend/core_runtime/version.js', 'src/backend/index.js', 'src/backend/api.js', 'src/world/avatar.js', 'src/world/world.js', 'assets/iso/manifest.js', 'src/data/houses.js', 'src/world/iso.js', 'src/ui/ui_room.js', 'src/ui/header.js', 'src/ui/feed.js', 'src/ui/people_add.js', 'src/ui/people.js', 'src/ui/life.js', 'src/ui/dialogs.js', 'src/ui/knowledge.js', 'src/ui/ledger_ui.js', 'src/ui/care_stats.js', 'src/data/share_qr.js', 'src/ui/share.js', 'src/ui/sound.js', 'src/ui/main.js',
    'locales/zh-CN.js', 'locales/en.js', 'locales/zh-TW.js', 'locales/fr.js', 'locales/ja.js', 'locales/ko.js', 'locales/es.js', 'locales/de.js', 'locales/content_zh-TW.js', 'locales/content_ja.js', 'locales/content_ko.js', 'locales/content_fr.js', 'locales/content_es.js', 'locales/content_de.js'];

  /* 存档里允许的文件：数据是 YAML，序列是 CSV。人物文件夹里除了固定的几份，任何 小写字母数字下划线 命名的 yaml 或 csv 都收，
     以后新增一种记录只需要多放一个文件，导入端不用改；根目录同理。路径里不许有 .. 或奇怪字符 */
  const DATA_OK = /^(people\/[^/]+\/[a-z0-9_]+\.(yaml|csv)|world\/[a-z0-9_]+\/[a-z0-9_]+\.(yaml|csv)|people\/[^/]+\/journal\/\d{4}-\d\d\.yaml|custom\/(lm\/models|conditions|visitors)\/[^/]+\.yaml|settings\.ini|[a-z0-9_]+\.(yaml|csv)|README\.txt)$/;
  /* 数据结构升级：存档的 schema 比当前低，按顺序跑每一步，把文件改成当前结构。新增字段和新增文件通常不需要写步骤，
     因为读取时缺的字段都有默认值；只有改名，拆分，换单位这类才写。每一步只改 files 这张 路径到文本 的表 */
  A.MIGRATIONS = [];   /* 第一个公开版以后，每次结构变化在这里登记一步 */
  A.migrate = (files, from) => {
    let v = from, steps = [];
    for (const m of A.MIGRATIONS.slice().sort((x, y) => x.from - y.from)) if (m.from === v && m.to <= meta.schema) { files = m.run(files) || files; steps.push(m.from + '->' + m.to); v = m.to; }
    return { files, steps, version: v };
  };
  /* 序列文件：第一行是列名，第一列叫 t；至少一列，没有空字符 */
  const csvOk = text => { const l = text.replace(/^\uFEFF/, '').split(/\r?\n/)[0] || ''; return !text.includes('\u0000') && l.length > 0 && l.length < 2000; };
  const ROOT = 'careforyou-data/';
  const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };

  /* ---------- 存档 ---------- */
  A.README = `Care for You save
This zip is a plain copy of the game's data folder. Open any file in a text editor.
- manifest.json: app version, schema (data structure version), file list with sizes.
- world/<world id>/world.yaml, calendar.yaml: the shared world (money, clock, focus, owned things) and the day-by-day calendar. Each world has its own folder; today there is one, home.
- people/<id>/person.yaml, state.yaml, story.yaml, sayings.yaml: one folder per character.
- people/<id>/curves.csv: mood, frailty and every need, one row per 15 game minutes, last 600 rows.
- world/<world id>/curves_world.csv: money, focus, efficiency and family bonus on the same clock.
- people/<id>/journal/YYYY-MM.yaml: what happened, by real month.
- custom/: things you added yourself, such as imported disease packs and your own visitor cards. The game's own rules are part of the program, not of the save.
- settings.ini: preferences.
- summary/*.csv: readable tables of sayings and journal. Ignored on import.
Any new kind of record is simply a new yaml or csv file in these folders. A save from an older schema is upgraded step by step on import; a save from a newer schema is refused.
`;
  A.exportSave = async function (opts = {}) {
    const G = CY.game, files = [];
    for (const p of await store.list()) {
      let text = (await store.read(p)) || '';
      files.push({ name: ROOT + p, data: enc.encode(text) });
    }
    const extra = CY.ui && CY.ui.summaryFiles ? CY.ui.summaryFiles() : {};
    for (const p in extra) files.push({ name: ROOT + p, data: enc.encode(extra[p]) });
    if (!files.some(f => f.name === ROOT + 'README.txt')) files.push({ name: ROOT + 'README.txt', data: enc.encode(A.README) });
    const manifest = { app: meta.app, version: meta.version, schema: meta.schema, created: new Date().toISOString(), language: CY.i18n.lang,
      format: { data: 'yaml', series: 'csv', tables: 'summary/*.csv', encoding: 'utf-8' },
      people: G.people.map(p => ({ id: p.id, name: p.person.name, role: p.person.role })), game_minutes: Math.floor(G.world.game_minutes),
      files: Object.fromEntries(files.map(f => [f.name.slice(ROOT.length), f.data.length])) };
    files.push({ name: ROOT + 'manifest.json', data: enc.encode(JSON.stringify(manifest, null, 2)) });
    return { blob: store.zip(files), name: `careforyou-save-${stamp()}.zip` };
  };

  /* ---------- 运行包 ---------- */
  A.exportApp = async function (opts = {}) {
    const files = [], dir = `careforyou-app-${meta.version}/`;
    const sprites = Object.keys(((CY.isoSprites || {}).furn) || {}).flatMap(n => [0, 1, 2, 3].map(r => `assets/iso/furn/${n}_${r}.png`));
    for (const p of A.APP_FILES.concat(sprites)) {
      let r;
      try { r = await fetch(p); } catch (e) { throw new Error('fetch'); }
      if (!r.ok) throw new Error('fetch');
      files.push({ name: dir + p, data: new Uint8Array(await r.arrayBuffer()) });
    }
    files.push({ name: dir + 'README_run.txt', data: enc.encode(CY.t('pack.readme', { version: meta.version })) });
    if (opts.withSave) { const s = await A.exportSave(); files.push({ name: dir + 'my-save.zip', data: new Uint8Array(await s.blob.arrayBuffer()) }); }
    return { blob: store.zip(files), name: `careforyou-app-${meta.version}.zip` };
  };

  /* ---------- 导入 ---------- */
  /* 读 zip，逐个文件检查，返回可导入的文件和被拒绝的文件 */
  A.inspect = async function (buf) {
    let entries;
    try { entries = await store.readZip(buf); } catch (e) { return { ok: false, error: 'zip' }; }
    const files = {}, rejected = [];
    let manifest = null;
    for (const e of entries) {
      let name = e.name.replace(/\\/g, '/');
      const i = name.indexOf('careforyou-data/');
      if (i >= 0) name = name.slice(i + ROOT.length);
      name = name.replace(/^templates\/(lm\/models|conditions|visitors)\//, 'custom/$1/');   /* 外面生成的疾病包仍然写 templates/，存进来放 custom/ */
      if (name === 'manifest.json') { try { manifest = JSON.parse(dec.decode(e.data)); } catch (x) {} continue; }
      if (name.startsWith('summary/')) continue;
      if (name.includes('..') || name.startsWith('/') || !DATA_OK.test(name)) { rejected.push(name); continue; }
      if (e.data.length > 5 * 1024 * 1024) { rejected.push(name); continue; }
      const text = dec.decode(e.data);
      if (name.endsWith('.yaml')) { try { jsyaml.load(text); } catch (x) { rejected.push(name); continue; } }
      if (name.endsWith('.csv') && !csvOk(text)) { rejected.push(name); continue; }
      files[name] = text;
    }
    if (manifest && manifest.schema > meta.schema) return { ok: false, error: 'newer', manifest };
    let migrated = null;
    { const from = manifest && typeof manifest.schema === 'number' ? manifest.schema : 5; if (from < meta.schema) { const r = A.migrate(files, from); migrated = { from, to: r.version, steps: r.steps }; } }
    /* 疾病包：只有模板，没有存档，例如 Life Matters 的 care_export 插件生成的 zip。导入时写进 custom 文件夹，不动角色 */
    if (!files['settings.ini'] && !Object.keys(files).some(n => n.startsWith('people/'))) {
      const tpl = Object.keys(files).filter(n => /^custom\/(lm\/models|conditions)\/[^/]+\.yaml$/.test(n));
      if (!tpl.length || tpl.length !== Object.keys(files).filter(n => n !== 'README.txt').length) return { ok: false, error: 'empty' };
      const names = tpl.map(n => { try { const d = jsyaml.load(files[n]) || {}; return (d.metadata && d.metadata.condition) || d.id || n; } catch (x) { return n; } });
      return { ok: true, kind: 'pack', files, rejected, manifest, people: [], conditions: [...new Set(names)] };
    }
    const people = [...new Set(Object.keys(files).map(n => (n.match(/^people\/([^/]+)\//) || [])[1]).filter(Boolean))].map(id => {
      let name = id; try { name = jsyaml.load(files[`people/${id}/person.yaml`] || '').name || id; } catch (x) {}
      return { id, name };
    });
    /* 存档里的关键数字和存盘时写下的校验对不上，说明被手改过：导入时提醒，分享卡片上会标「已编辑」 */
    let edited = false;
    try {
      const w = jsyaml.load(files[CY.game.wpath('world.yaml')] || '') || {}, c = jsyaml.load(files[CY.game.wpath('calendar.yaml')] || '') || {};
      if (w.sig && w.sig !== CY.game.sigOf(w.money, Object.keys(w.souv || {}).length, (c.days || []).length)) edited = true;
    } catch (x) {}
    return { ok: true, files, rejected, manifest, people, edited, migrated };
  };

  /* mode: replace 用存档整体替换当前数据；merge 只加入当前没有的角色 */
  A.apply = async function (info, mode) {
    if (info.kind === 'pack') { for (const p in info.files) if (p !== 'README.txt') await store.write(p, info.files[p]); return Object.keys(info.files).length; }
    if (mode === 'replace') {
      const keep = ini.parse((await store.read('settings.ini')) || '');
      await store.wipe();
      for (const p in info.files) {
        let text = info.files[p];
        if (p === 'settings.ini') {
          const cfg = ini.parse(text);
          text = ini.stringify(cfg);
        }
        await store.write(p, text);
      }
      return Object.keys(info.files).length;
    }
    const have = new Set((await store.list()).map(p => (p.match(/^people\/([^/]+)\//) || [])[1]).filter(Boolean));
    let n = 0;
    for (const p in info.files) {
      const id = (p.match(/^people\/([^/]+)\//) || [])[1];
      if (id && !have.has(id)) { await store.write(p, info.files[p]); n++; }
    }
    return n;
  };

  A.saveBlob = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  };
})(globalThis.CY = globalThis.CY || {});
