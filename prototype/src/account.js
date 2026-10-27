/* 账号与云端存档的预留接口。目前没有服务器，这里只定义形状，保证以后接入时界面和存档格式不用改。
   原则：账号可选，不登录也能完整使用；上传必须玩家逐次明确同意；任何时候都能导出和删除自己的数据。 */
(function (CY) {
  const A = CY.account = {
    /* 以后接入服务器时替换这个对象里的实现，签名保持不变 */
    provider: 'none',
    enabled: cfg => CY.ini.bool(cfg, 'account', 'enabled') && A.provider !== 'none',
    status: () => ({ signedIn: false, user: null, provider: A.provider }),
    async signUp() { throw new Error('not_enabled'); },
    async signIn() { throw new Error('not_enabled'); },
    async signOut() { throw new Error('not_enabled'); },
    /* 上传存档：只上传 archive.exportSave 的结果，由玩家点击触发，且需要最近一次的明确同意记录 */
    async uploadSave() { throw new Error('not_enabled'); },
    async downloadSave() { throw new Error('not_enabled'); },
    /* 删除账号和云端数据，对应 GDPR 的删除权 */
    async deleteAccount() { throw new Error('not_enabled'); },
    /* 同意记录的形状，写进存档的 manifest 或服务器端 */
    consentRecord: (purpose, granted) => ({ purpose, granted: !!granted, at: new Date().toISOString(), policy_version: CY.meta ? CY.meta.version : '' }),
  };
})(globalThis.CY = globalThis.CY || {});
