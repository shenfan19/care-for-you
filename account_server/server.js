/* Care for You 账号与云存档服务，参考实现。只用 Node 自带模块，不需要安装依赖。
   设计见 docs 里的隐私账号与合规设计：账号可选，邮箱只用来登录，存档在客户端加密后才上传，服务器只存密文。
   上线前必须完成数据保护影响评估、隐私说明和泄露应对流程，见 README_account_server.md。
   运行：PORT=8787 DATA_DIR=./data ORIGIN=https://你的前端域名 MAIL_WEBHOOK=https://邮件发送服务 node server.js */
const http = require('http'), crypto = require('crypto'), fs = require('fs'), path = require('path');

const PORT = +process.env.PORT || 8787, DATA = path.resolve(process.env.DATA_DIR || './data'), ORIGIN = process.env.ORIGIN || '*';
const MAIL_WEBHOOK = process.env.MAIL_WEBHOOK || '', DEV = process.env.DEV === '1';
const MAX_BODY = 3 * 1024 * 1024, CODE_TTL = 10 * 60e3, SESSION_TTL = 30 * 864e5, RATE = { n: 8, per: 60e3 };
fs.mkdirSync(path.join(DATA, 'users'), { recursive: true });

const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const codes = new Map(), sessions = new Map(), hits = new Map();
const okEmail = e => typeof e === 'string' && e.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const userDir = id => path.join(DATA, 'users', id);
const limited = ip => { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < RATE.per); a.push(now); hits.set(ip, a); return a.length > RATE.n; };

const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': ORIGIN, 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET, PUT, POST, DELETE, OPTIONS' }); res.end(JSON.stringify(obj)); };
const body = req => new Promise((res, rej) => { let n = 0; const b = []; req.on('data', c => { n += c.length; if (n > MAX_BODY) { rej(new Error('too_big')); req.destroy(); } else b.push(c); }); req.on('end', () => { try { res(b.length ? JSON.parse(Buffer.concat(b).toString('utf8')) : {}); } catch (e) { rej(new Error('bad_json')); } }); });
const auth = req => { const t = (req.headers.authorization || '').replace(/^Bearer /, ''), s = sessions.get(sha(t)); return s && s.exp > Date.now() ? s : null; };

async function mail(to, code) {
  if (MAIL_WEBHOOK) { await fetch(MAIL_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to, subject: 'Care for You login code', text: `Your code is ${code}. It expires in 10 minutes.` }) }); return true; }
  if (DEV) { console.log('[dev] login code for', to, code); return true; }
  return false;
}

const server = http.createServer(async (req, res) => {
  const ip = req.socket.remoteAddress || '';
  if (req.method === 'OPTIONS') return send(res, 204, {});
  try {
    const url = new URL(req.url, 'http://x').pathname;
    if (req.method === 'POST' && url === '/api/login/request') {
      if (limited(ip)) return send(res, 429, { error: 'rate' });
      const b = await body(req);
      /* 注册时要确认成年和同意隐私说明，记录同意的版本和时间 */
      if (!okEmail(b.email) || b.adult !== true || b.consent !== true) return send(res, 400, { error: 'bad_request' });
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0'), id = sha(b.email.trim().toLowerCase());
      codes.set(id, { h: sha(code + id), exp: Date.now() + CODE_TTL, tries: 0, consent: { at: new Date().toISOString(), policy_version: String(b.policy_version || ''), adult: true } });
      if (!(await mail(b.email, code))) return send(res, 503, { error: 'mail_not_configured' });
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url === '/api/login/verify') {
      if (limited(ip)) return send(res, 429, { error: 'rate' });
      const b = await body(req), id = okEmail(b.email) ? sha(b.email.trim().toLowerCase()) : '', c = codes.get(id);
      if (!c || c.exp < Date.now() || ++c.tries > 5 || c.h !== sha(String(b.code || '') + id)) return send(res, 401, { error: 'bad_code' });
      codes.delete(id);
      fs.mkdirSync(userDir(id), { recursive: true });
      fs.writeFileSync(path.join(userDir(id), 'consent.json'), JSON.stringify(c.consent));
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(sha(token), { id, exp: Date.now() + SESSION_TTL });
      return send(res, 200, { token });
    }
    const s = auth(req);
    if (!s) return send(res, 401, { error: 'unauthorized' });
    const f = path.join(userDir(s.id), 'save.json');
    if (req.method === 'PUT' && url === '/api/save') {
      const b = await body(req);
      if (typeof b.blob !== 'string' || typeof b.salt !== 'string' || typeof b.iv !== 'string') return send(res, 400, { error: 'bad_request' });
      fs.writeFileSync(f, JSON.stringify({ blob: b.blob, salt: b.salt, iv: b.iv, manifest: b.manifest || {}, at: new Date().toISOString() }));
      return send(res, 200, { ok: true });
    }
    if (req.method === 'GET' && url === '/api/save') return fs.existsSync(f) ? send(res, 200, JSON.parse(fs.readFileSync(f, 'utf8'))) : send(res, 404, { error: 'none' });
    if (req.method === 'DELETE' && url === '/api/account') {
      fs.rmSync(userDir(s.id), { recursive: true, force: true });
      for (const [k, v] of sessions) if (v.id === s.id) sessions.delete(k);
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: 'not_found' });
  } catch (e) { return send(res, e.message === 'too_big' ? 413 : 400, { error: e.message }); }
});

if (require.main === module) server.listen(PORT, () => console.log('account server on', PORT));
module.exports = server;
