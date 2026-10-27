/* 存储：数据是一个文件夹里的明文文件。
   后端有两种：玩家选择的真实文件夹，或浏览器内部存储作备用。接口一样，读写的都是路径加文本。 */
(function (CY) {
  const DB = 'careforyou', FILES = 'files', META = 'meta';

  function openDb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore(FILES); r.result.createObjectStore(META); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  function tx(db, store, mode, fn) {
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode);
      const rq = fn(t.objectStore(store));
      t.oncomplete = () => res(rq ? rq.result : undefined);
      t.onerror = () => rej(t.error);
    });
  }

  class IdbBackend {
    constructor(db) { this.db = db; this.kind = 'idb'; this.label = '浏览器内部存储'; }
    async read(p) { const v = await tx(this.db, FILES, 'readonly', s => s.get(p)); return v === undefined ? null : v; }
    write(p, t) { return tx(this.db, FILES, 'readwrite', s => s.put(t, p)); }
    list() { return tx(this.db, FILES, 'readonly', s => s.getAllKeys()).then(k => k.filter(x => !x.startsWith('_backup/'))); }
    wipe() { return tx(this.db, FILES, 'readwrite', s => s.clear()); }
  }

  class FolderBackend {
    constructor(h) { this.root = h; this.kind = 'folder'; this.label = '文件夹 ' + h.name; }
    async dir(parts, create) { let d = this.root; for (const p of parts) d = await d.getDirectoryHandle(p, { create }); return d; }
    async read(path) {
      const parts = path.split('/'); const f = parts.pop();
      try { const d = await this.dir(parts, false); return await (await (await d.getFileHandle(f)).getFile()).text(); } catch (e) { return null; }
    }
    async write(path, text) {
      const parts = path.split('/'); const f = parts.pop();
      const d = await this.dir(parts, true);
      const w = await (await d.getFileHandle(f, { create: true })).createWritable();
      await w.write(text); await w.close();
    }
    async wipe() {
      for (const n of ['people', 'templates', '_backup', 'settings.ini', 'world.yaml', 'README.txt']) { try { await this.root.removeEntry(n, { recursive: true }); } catch (e) {} }
    }
    async list() {
      const out = [];
      const walk = async (d, pre) => {
        for await (const [n, h] of d.entries()) {
          if (h.kind === 'directory') { if (n !== '_backup') await walk(h, pre + n + '/'); } else out.push(pre + n);
        }
      };
      await walk(this.root, '');
      return out;
    }
  }

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
    return (~crc) >>> 0;
  }
  /* 不压缩的 zip，文件名按 UTF-8 */
  function zip(files) {
    const enc = new TextEncoder(), parts = [], central = [];
    let off = 0;
    for (const f of files) {
      const name = enc.encode(f.name), crc = crc32(f.data), len = f.data.length;
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, len, true); h.setUint32(22, len, true);
      h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, f.data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, len, true); c.setUint32(24, len, true);
      c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + len;
    }
    const cd = central.reduce((a, x) => a + x.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cd, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
  }

  /* 读 zip：支持不压缩和 deflate 两种，别的软件打的包也能读。返回 [{name, data}] */
  async function readZip(buf) {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), dec = new TextDecoder();
    let e = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('not a zip');
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
    const out = [];
    for (let k = 0; k < n; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('bad zip');
      const flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      p += 46 + nlen + xlen + clen;
      if (name.endsWith('/')) continue;
      const lh = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
      const raw = u8.subarray(lh, lh + csize);
      let data;
      if (method === 0) data = raw;
      else if (method === 8) {
        const ds = new DecompressionStream('deflate-raw');
        data = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer());
      } else throw new Error('unsupported zip method ' + method);
      out.push({ name, data });
    }
    return out;
  }

  const S = CY.store = {
    backend: null, db: null, pendingHandle: null, lastBackup: {}, queue: Promise.resolve(),

    /* 返回 'ready' 或 'need-permission' */
    async init() {
      S.db = await openDb();
      const h = await tx(S.db, META, 'readonly', s => s.get('handle'));
      if (h) {
        try {
          if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') { S.backend = new FolderBackend(h); return 'ready'; }
        } catch (e) {}
        S.pendingHandle = h;
        return 'need-permission';
      }
      S.backend = new IdbBackend(S.db);
      return 'ready';
    },
    async restoreFolder() {
      const h = S.pendingHandle;
      if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('没有获得文件夹权限');
      S.backend = new FolderBackend(h); S.pendingHandle = null;
    },
    async useBrowserStorage() {
      await tx(S.db, META, 'readwrite', s => s.delete('handle'));
      S.pendingHandle = null; S.backend = new IdbBackend(S.db);
    },
    async chooseFolder() {
      if (!window.showDirectoryPicker) throw new Error('这个浏览器不支持选择文件夹，请用桌面版 Chrome 或 Edge');
      const h = await window.showDirectoryPicker({ mode: 'readwrite' });
      const target = new FolderBackend(h);
      const has = (await target.list()).includes('settings.ini');
      if (!has && S.backend) {
        for (const p of await S.backend.list()) await target.write(p, await S.backend.read(p));
      }
      await tx(S.db, META, 'readwrite', s => s.put(h, 'handle'));
      S.backend = target;
      return has;
    },

    read: p => S.backend.read(p),
    list: () => S.backend.list(),
    /* 写之前把旧内容留一份到 _backup，同一个文件十分钟内只留一次 */
    write(path, text) {
      S.queue = S.queue.then(async () => {
        const now = Date.now();
        if (!S.lastBackup[path] || now - S.lastBackup[path] > 600000) {
          const old = await S.backend.read(path);
          if (old !== null && old !== text) { await S.backend.write('_backup/' + path.replace(/\//g, '__'), old); S.lastBackup[path] = now; }
        }
        await S.backend.write(path, text);
      }).catch(e => console.error('写入失败', path, e));
      return S.queue;
    },
    async readYaml(p) { const t = await S.read(p); if (t === null) return null; try { return jsyaml.load(t); } catch (e) { console.warn('YAML 读取失败', p, e); return null; } },
    writeYaml: (p, o) => S.write(p, jsyaml.dump(o, { lineWidth: -1, noRefs: true })),
    async exportZip(extras) {
      const enc = new TextEncoder(), files = [];
      for (const p of await S.list()) files.push({ name: 'careforyou-data/' + p, data: enc.encode((await S.read(p)) || '') });
      for (const p in extras || {}) files.push({ name: 'careforyou-data/' + p, data: enc.encode(extras[p]) });
      return zip(files);
    },
    zip, readZip,
    async wipe() { await S.backend.wipe(); S.lastBackup = {}; },
  };
})(globalThis.CY = globalThis.CY || {});
