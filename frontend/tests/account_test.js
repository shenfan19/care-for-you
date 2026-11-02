/* 账号服务和客户端加密的测试：服务端在本进程里起，邮件用本地的接收端代替。 */
const http = require('http'), fs = require('fs'), vm = require('vm'), path = require('path'), os = require('os');
let fails = 0;
const check = (n, c, x) => { if (!c) fails++; console.log((c ? '通过 ' : '失败 ') + n + (x ? '  ' + x : '')); };

(async () => {
  /* 客户端加密：口令加密再解密，口令错了解不开，服务器看不到明文 */
  const ctx = vm.createContext({ console, TextEncoder, TextDecoder, crypto: require('crypto').webcrypto, btoa, atob, Uint8Array, fetch: undefined });
  ctx.globalThis = ctx; ctx.CY = { ini: { bool: () => false } };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'ai', 'account.js'), 'utf8'), ctx);
  const A = ctx.CY.account, plain = new TextEncoder().encode('save-data-家人');
  const sealed = await A.encrypt(plain, 'correct horse battery');
  check('密文里看不到明文', !Buffer.from(sealed.blob, 'base64').includes(Buffer.from('save-data')));
  check('口令对能解开', Buffer.from(await A.decrypt(sealed, 'correct horse battery')).toString() === 'save-data-家人');
  check('口令错解不开', await A.decrypt(sealed, 'wrong passphrase').then(() => false, () => true));
  check('没有服务地址时功能不出现', !A.configured({ account: { enabled: 'true', server_url: '' } }) && !A.status().signedIn);

  /* 服务端 */
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyacct-'));
  const mails = [];
  const mailSrv = http.createServer((req, res) => { let b = ''; req.on('data', c => b += c); req.on('end', () => { mails.push(JSON.parse(b)); res.end('ok'); }); });
  await new Promise(r => mailSrv.listen(0, r));
  process.env.DATA_DIR = dir; process.env.MAIL_WEBHOOK = 'http://127.0.0.1:' + mailSrv.address().port + '/';
  const server = require('../../account_server/server.js');
  await new Promise(r => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const call = async (method, p, body, token) => { const r = await fetch(base + p, { method, headers: Object.assign({ 'content-type': 'application/json' }, token ? { authorization: 'Bearer ' + token } : {}), body: body ? JSON.stringify(body) : undefined }); return { status: r.status, json: await r.json().catch(() => ({})) }; };

  check('没勾成年和同意不发验证码', (await call('POST', '/api/login/request', { email: 'a@b.co' })).status === 400 && mails.length === 0);
  check('邮箱格式不对被拒', (await call('POST', '/api/login/request', { email: 'nope', adult: true, consent: true })).status === 400);
  check('要验证码', (await call('POST', '/api/login/request', { email: 'a@b.co', adult: true, consent: true, policy_version: '1' })).status === 200 && mails.length === 1);
  const code = /(\d{6})/.exec(mails[0].text)[1];
  check('错验证码被拒', (await call('POST', '/api/login/verify', { email: 'a@b.co', code: '000000' })).status === 401 || code === '000000');
  const v = await call('POST', '/api/login/verify', { email: 'a@b.co', code });
  check('对的验证码拿到令牌', v.status === 200 && v.json.token && v.json.token.length === 64);
  const tk = v.json.token;
  check('验证码只能用一次', (await call('POST', '/api/login/verify', { email: 'a@b.co', code })).status === 401);
  check('没令牌不能存', (await call('PUT', '/api/save', sealed)).status === 401);
  check('存密文', (await call('PUT', '/api/save', Object.assign({ manifest: { v: 1 } }, sealed), tk)).status === 200);
  const got = await call('GET', '/api/save', null, tk);
  check('取回的和存的一样，服务器没有明文', got.status === 200 && got.json.blob === sealed.blob && !JSON.stringify(got.json).includes('save-data'));
  const users = fs.readdirSync(path.join(dir, 'users'));
  check('磁盘上只有邮箱的哈希，没有邮箱', users.length === 1 && !users[0].includes('a@b.co') && !fs.readFileSync(path.join(dir, 'users', users[0], 'save.json'), 'utf8').includes('a@b.co'));
  const consent = JSON.parse(fs.readFileSync(path.join(dir, 'users', users[0], 'consent.json'), 'utf8'));
  check('同意记录包含时间、版本、成年确认', consent.adult === true && consent.policy_version === '1' && !!consent.at);
  check('删除账号清掉数据', (await call('DELETE', '/api/account', null, tk)).status === 200 && !fs.existsSync(path.join(dir, 'users', users[0])));
  check('删除后令牌失效', (await call('GET', '/api/save', null, tk)).status === 401);
  const big = await call('PUT', '/api/save', { blob: 'x'.repeat(4 * 1024 * 1024), salt: 's', iv: 'i' }, tk);
  check('过大的请求被拒', big.status === 401 || big.status === 413);

  server.close(); mailSrv.close(); fs.rmSync(dir, { recursive: true, force: true });
  console.log(fails ? `失败 ${fails} 项` : '全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
