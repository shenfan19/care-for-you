/* 账号与云端存档的客户端。账号可选，不登录也能完整使用。
   登录用邮箱验证码，不存口令；存档在本机用玩家自己设的口令加密后再上传，服务器只存密文，口令丢了无法找回。
   所有上传都由玩家点击触发。服务地址为空时整套功能不出现。服务端见仓库里的 account_server。 */
(function (CY) {
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = u8 => { let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  let token = '';
  const A = CY.account = {
    provider: 'http',
    url: cfg => ((cfg && cfg.account && cfg.account.server_url) || '').replace(/\/+$/, ''),
    configured: cfg => CY.ini.bool(cfg, 'account', 'enabled') && !!A.url(cfg),
    enabled: cfg => A.configured(cfg),
    status: () => ({ signedIn: !!token, user: token ? 'signed-in' : null, provider: A.provider }),

    async call(cfg, method, path, bodyObj) {
      const r = await fetch(A.url(cfg) + path, { method, headers: Object.assign({ 'content-type': 'application/json' }, token ? { authorization: 'Bearer ' + token } : {}), body: bodyObj ? JSON.stringify(bodyObj) : undefined });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'http_' + r.status);
      return j;
    },
    /* 第一步：要验证码。必须确认成年并同意隐私说明，同意的版本和时间由服务器记录 */
    async requestCode(cfg, email, adult, consent) {
      return A.call(cfg, 'POST', '/api/login/request', { email, adult: !!adult, consent: !!consent, policy_version: CY.meta ? CY.meta.version : '' });
    },
    async verify(cfg, email, code) { const j = await A.call(cfg, 'POST', '/api/login/verify', { email, code }); token = j.token; return true; },
    async signOut() { token = ''; },

    /* 口令派生密钥，AES-GCM 加密；服务器拿不到口令 */
    async encrypt(plain, pass) {
      const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await A.key(pass, salt), ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
      return { blob: b64(ct), salt: b64(salt), iv: b64(iv) };
    },
    async decrypt(o, pass) {
      const key = await A.key(pass, unb64(o.salt));
      return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, key, unb64(o.blob)));
    },
    async key(pass, salt) {
      const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    },
    /* 上传：只传存档的加密结果，由玩家点击触发 */
    async uploadSave(cfg, pass) {
      const { blob } = await CY.archive.exportSave({});
      const enc1 = await A.encrypt(new Uint8Array(await blob.arrayBuffer()), pass);
      return A.call(cfg, 'PUT', '/api/save', Object.assign(enc1, { manifest: { created: new Date().toISOString(), version: CY.meta ? CY.meta.version : '' } }));
    },
    async downloadSave(cfg, pass) {
      const o = await A.call(cfg, 'GET', '/api/save');
      const plain = await A.decrypt(o, pass), info = await CY.archive.inspect(plain.buffer);
      if (!info.ok) throw new Error('bad_save');
      return info;
    },
    /* 删除账号和云端数据 */
    async deleteAccount(cfg) { await A.call(cfg, 'DELETE', '/api/account'); token = ''; },
    consentRecord: (purpose, granted) => ({ purpose, granted: !!granted, at: new Date().toISOString(), policy_version: CY.meta ? CY.meta.version : '' }),
  };
})(globalThis.CY = globalThis.CY || {});
