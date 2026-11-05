/* 贡献统计的页面，只在开发者模式里看。读 G.ledger，不改任何游戏状态。
   两个出口：窗体里记录面板的一个标签，和开发者面板里的弹窗，两边用同一份内容。
   和记录的关系：联动只走记录开放的接口，记录当前选了谁，这里就把谁的那一行和那一列标出来；点矩阵里的名字，记录就切到那个人，并回到"发生的事"。
   独立：记录不认识本文件，没有本文件记录也完整；本文件不依赖记录，没有记录面板时只剩弹窗。
   写法上守几条：只写事实，不排名，不打分；先写做了什么，最后才写没被顾上的时间；每个数都能点出是哪几种动作。
   开发者面板是内部界面，文字不走语言包。 */
(function (CY) {
  const G = CY.game, U = CY.ui = CY.ui || {};
  const esc = U.esc;
  const fmtMin = m => (m >= 120 ? Math.round(m / 60 * 10) / 10 + ' 小时' : Math.round(m) + ' 分钟');
  const actName = id => CY.tOr('act.' + id, id);
  const kindName = { player: '你做的', family: '家人做的', self: '自己做的', social: '聊天玩耍' };
  const needName = k => { const sp = G.tpl.species || {}; const d = (sp.human && sp.human.needs && sp.human.needs[k]) || Object.values(sp).map(x => x.needs && x.needs[k]).find(Boolean) || { label: k }; return G.needLabel(k, d); };
  let range = 'today';

  /* 内容：一段 HTML，who 是记录里当前选的人，可以是空 */
  const body = (rng, who) => {
    const L = G.ledger, today = G.gameDate().n, days = L.days();
    const r = { today: [today, today], yesterday: [today - 1, today - 1], week: [today - 6, today], all: [undefined, undefined] }[rng];
    const sum = L.sum(r[0], r[1]), m = L.matrix(sum), nm = id => L.nameOf(sum, id), on = L.enabled();
    const tab = (k, label) => `<button class="chip ${rng === k ? 'on' : ''}" data-lr="${k}">${label}</button>`;
    const mark = id => (who && id === who ? ' class="sel"' : '');
    const matrix = m.actors.length ? `<table class="ltab"><tr><th></th>${m.targets.map(t => `<th${mark(t)}><a href="#" data-lp="${t}">${esc(nm(t))}</a></th>`).join('')}<th class="mute">一共</th></tr>
      ${m.actors.map(a => `<tr><th${mark(a)}>${a === 'you' ? '你' : `<a href="#" data-lp="${a}">${esc(nm(a))}</a>`}</th>${m.targets.map(t => { const c = m.cell[a + '>' + t]; return `<td${who && (a === who || t === who) ? ' class="sel"' : ''} title="${c ? esc(Object.entries(c.by).sort((x, y) => y[1] - x[1]).map(([k, v]) => actName(k) + ' ' + v).join('，') + '；' + Object.entries(c.kinds).map(([k, v]) => (kindName[k] || k) + ' ' + v).join('，')) : ''}">${c ? c.n : ''}</td>`; }).join('')}<td class="mute">${m.give[a]}</td></tr>`).join('')}
      <tr><th class="mute">被照顾</th>${m.targets.map(t => `<td class="mute">${m.got[t]}</td>`).join('')}<td class="mute">${L.total(sum)}</td></tr></table>` : '<div class="mute">这一段没有记录。</div>';
    const list = (obj, unit) => { const es = Object.entries(obj).sort((a, b) => b[1] - a[1]); return es.length ? es.map(([id, v]) => `${esc(nm(id))} ${v}${unit}`).join('，') : '<span class="mute">没有</span>'; };
    const watch = {}; for (const k in sum.watch) { const [a, t] = k.split('>'); (watch[t] = watch[t] || []).push([a, sum.watch[k]]); }
    const watchRows = Object.keys(watch).length ? Object.entries(watch).map(([t, as]) => `<div>${esc(nm(t))}：${as.sort((x, y) => y[1] - x[1]).map(([a, v]) => `${esc(nm(a))} ${fmtMin(v)}`).join('，')}</div>`).join('') : '<span class="mute">没有</span>';
    const neg = Object.entries(sum.neglect).map(([id, o]) => [id, Object.values(o).reduce((a, b) => a + b, 0), Object.entries(o).sort((a, b) => b[1] - a[1])[0]]).sort((a, b) => b[1] - a[1]);
    const negRows = neg.length ? neg.map(([id, v, top]) => `<div${who && id === who ? ' class="sel"' : ''}>${esc(nm(id))}：${fmtMin(v)}，多半是「${esc(needName(top[0]))}」</div>`).join('') : '<span class="mute">没有</span>';
    /* 选了谁，先写这个人做了什么，再写被谁照顾 */
    let focus = '';
    if (who && G.get(who)) {
      const gave = m.give[who] || 0, got = m.got[who] || 0;
      focus = `<div class="lfocus">${esc(nm(who))}：照顾了别人 ${gave} 次，被照顾 ${got} 次${(sum.wakes[who] ? '，被叫醒去看护 ' + sum.wakes[who] + ' 次' : '')}${(sum.cooks[who] ? '，做了 ' + sum.cooks[who] + ' 顿饭' : '')}。</div>`;
    }
    return `<div class="mute">开发者面板里的内部功能，普通玩家看不到。模块状态：<b>${on ? '已开启' : '未开启'}</b>，总开关是 templates/system.yaml 的 modules.ledger，默认关；这里的按钮只改这一次运行。每个数是事实记录，没有评分，不排名。</div>
      <div class="row" style="margin:8px 0"><button data-lt="1">${on ? '这次运行先关掉' : '这次运行先开启'}</button>${tab('today', '今天')}${tab('yesterday', '昨天')}${tab('week', '最近七天')}${tab('all', '全部，共 ' + days.length + ' 天')}</div>
      ${focus}
      <h3>谁照顾了谁</h3><div class="mute" style="margin-bottom:4px">行是出手的人，列是被照顾的人，格子是次数，鼠标停上去看是哪几种动作；点名字，记录就切到这个人；「你」是没有选主角时玩家自己做的。</div>${matrix}
      <h3>盯着孩子的时间</h3>${watchRows}
      <h3>被叫醒去看护的次数</h3><div>${list(sum.wakes, ' 次')}</div>
      <h3>做了几顿饭</h3><div>${list(sum.cooks, ' 顿')}</div>
      <h3>没有被顾上的时间</h3><div class="mute" style="margin-bottom:4px">某一项需求压到八成以上的累计时间。离线推进不算。这一项只说明那段时间里这个人的需求没有被满足，不说明是谁的错。</div>${negRows}`;
  };
  /* 把按钮和名字接上：rerender 重画，pick 点了谁 */
  const bind = (root, rerender, pick) => {
    root.querySelectorAll('[data-lr]').forEach(b => b.onclick = () => { range = b.dataset.lr; rerender(); });
    const tg = root.querySelector('[data-lt]'); if (tg) tg.onclick = () => { G.setModule('ledger', !G.ledger.enabled()); rerender(); };
    root.querySelectorAll('[data-lp]').forEach(a => a.onclick = e => { e.preventDefault(); pick(a.dataset.lp); });
  };

  /* 开发者面板里的弹窗 */
  U.ledgerDialog = function (rng) {
    if (rng) range = rng;
    const dlg = U.dialog(`<h2 style="margin-top:0">贡献统计</h2>${body(range, U.logView && U.logView.who)}
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button id="lgClose" class="primary">关闭</button></div>`, true);
    dlg.querySelector('#lgClose').onclick = U.closeDialog;
    bind(dlg, () => U.ledgerDialog(), id => { U.closeDialog(); if (U.logGo) U.logGo('events', id); });
  };

  /* 记录面板里的一个标签：只在开发者模式里出现 */
  if (U.registerLogTab) U.registerLogTab({
    id: 'ledger', label: () => '贡献', visible: () => !!G.DEVTOOLS,
    sig: () => range + (G.ledger.enabled() ? '1' : '0') + G.ledger.days().length + JSON.stringify(Object.keys((G.world.ledger && G.world.ledger.days[G.gameDate().n] && G.world.ledger.days[G.gameDate().n].acts) || {}).length) + ((G.world.ledger && G.world.ledger.days[G.gameDate().n] && Object.values(G.world.ledger.days[G.gameDate().n].acts).reduce((a, c) => a + c.n, 0)) || 0) + ((U.logView && U.logView.who) || ''),
    render: v => `<div class="lgtab">${body(range, v.who)}</div>`,
    bind: (root, v) => bind(root, () => U.renderFeed(true), id => U.logGo('events', id)),
  });
})(globalThis.CY = globalThis.CY || {});
