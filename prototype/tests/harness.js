/* 测试和仿真共用的载入：把页面脚本按顺序放进一个虚拟环境，用内存代替浏览器存储。 */
const fs = require('fs'), vm = require('vm'), path = require('path'), zlib = require('zlib');
const ctx = vm.createContext({ console, Math, Date, JSON, RegExp, Promise, AbortController, setInterval, clearInterval, setTimeout, clearTimeout, TextEncoder, TextDecoder, Blob, Response, DecompressionStream, Uint8Array, DataView, ArrayBuffer, fetch: undefined });
ctx.globalThis = ctx;
const root = path.join(__dirname, '..');
const run = f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
for (const f of ['vendor/js-yaml.min.js', 'src/core/meta.js', 'src/core/i18n.js', 'locales/zh-CN.js', 'locales/en.js', 'locales/zh-TW.js', 'locales/fr.js', 'locales/ja.js', 'locales/ko.js', 'locales/es.js', 'locales/de.js', 'src/core/ini.js', 'src/core/store.js', 'src/core/archive.js']) run(f);
/* 内存存储代替浏览器存储，zip 读写用真实实现 */
const mem = new Map();
ctx.__mem = mem;
vm.runInContext(`
  Object.assign(CY.store, {
    backend: { label: 'memory' },
    read: async p => (globalThis.__mem.has(p) ? globalThis.__mem.get(p) : null),
    list: async () => [...globalThis.__mem.keys()],
    write: async (p, t) => { globalThis.__mem.set(p, t); },
    readYaml: async p => { const t = globalThis.__mem.get(p); return t === undefined ? null : jsyaml.load(t); },
    writeYaml: async (p, o) => { globalThis.__mem.set(p, jsyaml.dump(o, { lineWidth: -1 })); },
    wipe: async () => { globalThis.__mem.clear(); },
    removeDir: async p => { for (const k of [...globalThis.__mem.keys()]) if (k.startsWith(p + '/')) globalThis.__mem.delete(k); },
  });`, ctx);
for (const f of ['src/data/content.js', 'src/data/content_more.js', 'src/data/content_en.js', 'src/data/content_pets.js', 'src/data/content_react.js', 'src/data/content_life.js', 'src/data/content_traits.js', 'src/data/content_age.js', 'locales/content_zh-TW.js', 'locales/content_ja.js', 'locales/content_ko.js', 'locales/content_fr.js', 'locales/content_es.js', 'locales/content_de.js', 'src/data/seed.js', 'src/ai/ai.js', 'src/ai/account.js', 'src/core/game.js', 'src/core/directives.js', 'src/core/time.js', 'src/core/economy.js', 'src/core/household.js', 'src/core/agents.js', 'src/core/clock.js', 'src/backend/protocol.js', 'src/backend/local.js', 'src/backend/local_plan.js', 'src/backend/http.js', 'src/backend/index.js', 'src/backend/api.js', 'src/world/world.js', 'src/world/iso.js', 'src/world/avatar.js', 'src/world/scenes.js']) run(f);
const CY = ctx.CY, G = CY.game;
module.exports = { ctx, CY, G, root, fs, vm, path, zlib, mem };
