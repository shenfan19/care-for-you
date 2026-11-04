/* 曲线记录：每个角色的心情，虚弱度和各项需求，加上全家的钱，专注，效率，每隔 G.HIST.step 个游戏分钟记一行，
   存成明文 CSV，随存档一起导出导入。只留最近 G.HIST.keep 行（默认 600 行，约六个游戏日），再往前的不存：
   够核对仿真曲线和收入节奏，又不会越存越大。列是按当时有哪些需求现写的，以后新增需求只会多出列，旧文件照样能读。 */
(function (CY) {
  const G = CY.game, store = CY.store;
  const num = v => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : '');
  const toCsv = rows => rows.map(r => r.join(',')).join('\n') + '\n';
  const parse = text => String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).map(l => l.split(','));
  G.wcurve = [];
  G._curveRev = 0;

  /* 每次采样一行，game.js 的 sampleHist 调用 */
  G.sampleWorldCurve = gm => {
    G.wcurve.push({ t: gm, money: G.world.money, focus: G.focus ? G.focus() : 1, eff: G.efficiency(), bonus: G.householdBonus() });
    if (G.wcurve.length > G.HIST.keep) G.wcurve.shift();
    G._curveRev++;
  };

  G.curvesCsv = pid => {
    const h = G.hist[pid] || [], cols = [...new Set(h.flatMap(r => Object.keys(r.needs || {})))].sort();   /* 需求列写成 lv_ 开头的水平，1 满足，0 见底；没有 lv_ 的是旧版的压力 */
    return toCsv([['t', 'mood', 'frailty', ...cols.map(c => 'lv_' + c)], ...h.map(r => [Math.round(r.t), num(r.mood), num(r.frailty), ...cols.map(c => num((r.needs || {})[c]))])]);
  };
  G.worldCurveCsv = () => toCsv([['t', 'money', 'focus', 'efficiency', 'bonus'], ...G.wcurve.map(r => [Math.round(r.t), num(r.money), num(r.focus), num(r.eff), num(r.bonus)])]);

  /* 随存盘一起写：没有新样本就不重写 */
  G.saveCurves = () => {
    if (G._curveSaved === G._curveRev) return;
    G._curveSaved = G._curveRev;
    for (const p of G.people) if ((G.hist[p.id] || []).length) store.write(`people/${p.id}/curves.csv`, G.curvesCsv(p.id));
    if (G.wcurve.length) store.write('curves_world.csv', G.worldCurveCsv());
  };

  /* 读存档里的曲线，格式对不上的行直接丢掉，不影响游戏 */
  G.loadCurves = async () => {
    G.hist = {}; G.wcurve = [];
    for (const p of G.people) {
      const rows = parse(await store.read(`people/${p.id}/curves.csv`)), head = rows.shift();
      if (!head || head[0] !== 't') continue;
      G.hist[p.id] = rows.map(r => {
        const needs = {}; head.slice(3).forEach((c, i) => { if (r[3 + i] === undefined || r[3 + i] === '') return; const lv = c.startsWith('lv_'); needs[lv ? c.slice(3) : c] = lv ? +r[3 + i] : 1 - +r[3 + i]; });
        return { t: +r[0], mood: +r[1], frailty: +r[2], needs };
      }).filter(x => isFinite(x.t)).slice(-G.HIST.keep);
    }
    const rows = parse(await store.read('curves_world.csv')), head = rows.shift();
    if (head && head[0] === 't') G.wcurve = rows.map(r => ({ t: +r[0], money: +r[1], focus: +r[2], eff: +r[3], bonus: +r[4] })).filter(x => isFinite(x.t)).slice(-G.HIST.keep);
    G._curveSaved = G._curveRev;
  };
})(globalThis.CY = globalThis.CY || {});
