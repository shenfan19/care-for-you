/* 存档与运行包。
   存档：数据文件夹的 zip，加一份 manifest 和两份表格，默认不带 AI 密钥。
   运行包：整个网页程序的 zip，解压后双击 index.html 就能在本地运行，可以顺带带上一份存档。
   导入：读存档 zip，检查每个文件的路径和格式，再选择覆盖或合并。 */
(function (CY) {
  const { store, ini, meta } = CY;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const A = CY.archive = {};

  /* 运行包里的文件，测试会核对它和 index.html 里的脚本一致 */
  A.APP_FILES = ['index.html', 'css/style.css', 'favicon.svg', 'manifest.webmanifest', 'vendor/js-yaml.min.js',
    'src/core/meta.js', 'src/core/i18n.js', 'src/core/ini.js', 'src/core/store.js', 'src/core/archive.js', 'src/data/content.js', 'src/data/content_more.js', 'src/data/content_en.js', 'src/data/content_pets.js', 'src/data/content_react.js', 'src/data/content_life.js', 'src/data/content_traits.js', 'src/data/content_age.js', 'src/data/seed.js', 'src/data/lm_seed.js', 'src/ai/ai.js', 'src/ai/account.js', 'src/core/game.js', 'src/core/directives.js', 'src/core/arcs.js', 'src/core/time.js', 'src/core/economy.js', 'src/core/household.js', 'src/core/agents.js', 'src/core/clock.js', 'src/backend/protocol.js', 'src/backend/local.js', 'src/backend/local_plan.js', 'src/backend/http.js', 'src/backend/lm.js', 'src/backend/index.js', 'src/backend/api.js', 'src/world/avatar.js', 'src/world/world.js', 'assets/iso/manifest.js', 'src/data/houses.js', 'src/world/iso.js', 'src/world/scenes.js', 'src/ui/ui_room.js', 'src/ui/header.js', 'src/ui/feed.js', 'src/ui/people_add.js', 'src/ui/people.js', 'src/ui/life.js', 'src/ui/dialogs.js', 'src/ui/share.js', 'src/ui/sound.js', 'src/ui/main.js',
    'locales/zh-CN.js', 'locales/en.js', 'locales/zh-TW.js', 'locales/fr.js', 'locales/ja.js', 'locales/ko.js', 'locales/es.js', 'locales/de.js', 'locales/content_zh-TW.js', 'locales/content_ja.js', 'locales/content_ko.js', 'locales/content_fr.js', 'locales/content_es.js', 'locales/content_de.js'];

  const DATA_OK = /^(people\/[^/]+\/(person|state|story|sayings)\.yaml|people\/[^/]+\/journal\/\d{4}-\d\d\.yaml|templates\/[^/]+(\/[^/]+)*\.yaml|settings\.ini|world\.yaml|README\.txt)$/;
  const ROOT = 'careforyou-data/';
  const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };

  /* 去掉 AI 密钥，除非调用方明确要带上 */
  function scrub(text, keepKey) {
    if (keepKey) return text;
    const cfg = ini.parse(text);
    if (cfg.ai && cfg.ai.api_key) cfg.ai.api_key = '';
    return ini.stringify(cfg);
  }

  /* ---------- 存档 ---------- */
  A.exportSave = async function (opts = {}) {
    const G = CY.game, files = [];
    for (const p of await store.list()) {
      let text = (await store.read(p)) || '';
      if (p === 'settings.ini') text = scrub(text, opts.keepKey);
      files.push({ name: ROOT + p, data: enc.encode(text) });
    }
    const extra = CY.ui && CY.ui.summaryFiles ? CY.ui.summaryFiles() : {};
    for (const p in extra) files.push({ name: ROOT + p, data: enc.encode(extra[p]) });
    const manifest = { app: meta.app, version: meta.version, schema: meta.schema, created: new Date().toISOString(), language: CY.i18n.lang,
      people: G.people.map(p => ({ id: p.id, name: p.person.name, role: p.person.role })), game_minutes: Math.floor(G.world.game_minutes), includes_ai_key: !!opts.keepKey };
    files.push({ name: ROOT + 'manifest.json', data: enc.encode(JSON.stringify(manifest, null, 2)) });
    return { blob: store.zip(files), name: `careforyou-save-${stamp()}.zip` };
  };

  /* ---------- 运行包 ---------- */
  A.exportApp = async function (opts = {}) {
    const files = [], dir = `careforyou-app-${meta.version}/`;
    const sprites = Object.keys(((CY.isoSprites || {}).furn) || {}).flatMap(n => [0, 1, 2, 3].map(r => `assets/iso/furn/${n}_${r}.png`)).concat(Object.entries(((CY.isoSprites || {}).blocky) || {}).flatMap(([k]) => ['stand', 'walk', 'sit', 'sleep'].flatMap(po => [0, 1, 2, 3].map(r => `assets/iso/blocky/${k}_${po}_${r}.png`)))).concat(Object.entries(((CY.isoSprites || {}).pet) || {}).flatMap(([k, v]) => Object.keys(v).flatMap(po => [0, 1, 2, 3].map(r => `assets/iso/pet/${k}_${po}_${r}.png`)))).concat(Object.keys(((CY.isoSprites || {}).char) || {}).flatMap(k => ['stand', 'walk', 'sit', 'sleep', 'chair'].flatMap(po => [0, 1, 2, 3].flatMap(r => ['', '_m', '_h', '_c'].map(sf => `assets/iso/char/${k}_${po}_${r}${sf}.png`)))));
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
      if (name === 'manifest.json') { try { manifest = JSON.parse(dec.decode(e.data)); } catch (x) {} continue; }
      if (name.startsWith('summary/')) continue;
      if (name.includes('..') || name.startsWith('/') || !DATA_OK.test(name)) { rejected.push(name); continue; }
      if (e.data.length > 5 * 1024 * 1024) { rejected.push(name); continue; }
      const text = dec.decode(e.data);
      if (name.endsWith('.yaml')) { try { jsyaml.load(text); } catch (x) { rejected.push(name); continue; } }
      files[name] = text;
    }
    if (manifest && manifest.schema > meta.schema) return { ok: false, error: 'newer', manifest };
    /* 疾病包：只有模板，没有存档，例如 Life Matters 的 care_export 插件生成的 zip。导入时写进模板文件夹，不动角色 */
    if (!files['settings.ini'] && !Object.keys(files).some(n => n.startsWith('people/'))) {
      const tpl = Object.keys(files).filter(n => /^templates\/(lm\/models|conditions)\/[^/]+\.yaml$/.test(n));
      if (!tpl.length || tpl.length !== Object.keys(files).filter(n => n !== 'README.txt').length) return { ok: false, error: 'empty' };
      const names = tpl.map(n => { try { const d = jsyaml.load(files[n]) || {}; return (d.metadata && d.metadata.condition) || d.id || n; } catch (x) { return n; } });
      return { ok: true, kind: 'pack', files, rejected, manifest, people: [], conditions: [...new Set(names)] };
    }
    const people = [...new Set(Object.keys(files).map(n => (n.match(/^people\/([^/]+)\//) || [])[1]).filter(Boolean))].map(id => {
      let name = id; try { name = jsyaml.load(files[`people/${id}/person.yaml`] || '').name || id; } catch (x) {}
      return { id, name };
    });
    return { ok: true, files, rejected, manifest, people };
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
          if (keep.ai && keep.ai.api_key && !(cfg.ai && cfg.ai.api_key)) { cfg.ai = cfg.ai || {}; cfg.ai.api_key = keep.ai.api_key; }
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
