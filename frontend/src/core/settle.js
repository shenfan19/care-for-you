/* 每日结算与日历：一天里发生的事累积成事实，午夜收成三到五句话，存进日历，全部保留，可以翻看。
   存的是句子的键和参数，不是成品文字，所以换语言后重新生成。同一天同一个键的变体由日期决定，反复打开不变。 */
(function (CY) {
  const G = CY.game, store = CY.store;
  const t = (k, v) => CY.t(k, v);

  G.cal = { version: 1, days: [] };
  G.loadCalendar = async () => { G.cal = Object.assign({ version: 1, days: [] }, await store.readYaml(G.wpath('calendar.yaml'))); };
  G.saveCalendar = () => { if (G._calDirty) { G._calDirty = false; store.writeYaml(G.wpath('calendar.yaml'), G.cal); } };

  /* 自动称呼保存翻译键，玩家起的名字保存原文；离开家庭后仍能翻译历史记录。 */
  G.settleNameRef = p => {
    if (p.person.visitor) return G.ref('visitor.' + p.person.visitor.id + '.name', p.person.name);
    return G.ref(p.person.name_auto ? ['preset.name.' + p.person.name_auto, 'arch.' + (p.person.archetype || p.person.card)] : [], p.person.name);
  };
  /* 旧日历只有名字文本：仅在仍能明确对应到自动命名角色时恢复引用，不猜玩家自定义姓名。 */
  const legacyNameRef = value => {
    if (typeof value !== 'string') return value;
    if (G.people.some(p => !p.person.name_auto && !p.person.visitor && p.person.name === value)) return value;
    const matches = G.people.filter(p => {
      if (!p.person.name_auto && !p.person.visitor) return false;
      const ref = G.settleNameRef(p); if (!ref || !ref.t) return false;
      return p.person.name === value || Object.values(CY.i18n.packs).some(pack => {
        const name = ref.t.map(k => pack[k]).find(x => x !== undefined);
        return name === value;
      });
    }).map(G.settleNameRef);
    return matches.length && matches.every(ref => JSON.stringify(ref.t) === JSON.stringify(matches[0].t)) ? matches[0] : value;
  };
  const blank = n => ({ n, names: {}, care: {}, fam: {}, acts: {}, cry: {}, self: {}, recovered: [], frail: [], bought: [], notes: [], money0: Math.round(G.world.money || 0) });
  const today = () => {
    const n = G._closing || G._dayN || G.gameDate().n;   /* 事记在还没收口的那一天，午夜过了到翻日之间的一小段也算前一天 */
    if (!G.world.today || G.world.today.n !== n) G.world.today = blank(n);
    return G.world.today;
  };
  G.settleNote = (k, a) => { today().notes.push({ k, a: a || {} }); };

  /* 记事实：包一层 G.log，不改原来的记录。访客身上发生的事按时间顺序直接记成句子，家人的动作只数次数，日终再挑 */
  G.actIdOf = meta => { const ref = meta && meta.a && meta.a.label && meta.a.label.t, last = ref && ref[ref.length - 1]; return last ? String(last).replace(/^act\./, '').replace(/\.\w+$/, '') : ''; };
  const ACT_LINES = ['meal', 'rest', 'invite_rest', 'street', 'park', 'walk', 'chat', 'play', 'bath', 'doctor', 'medicine', 'sugar', 'water', 'hand', 'soothe', 'read', 'homework', 'game', 'pet', 'wheel'];
  const actKey = id => 'settle.act_' + (ACT_LINES.includes(id) ? id : 'other');
  const log0 = G.log;
  G.log = function (pid, type, text, meta) {
    try {
      const d = today(), p = G.get(pid), name = p ? p.id : '', k = meta && meta.k;
      if (p) { d.names = d.names || {}; d.names[name] = G.settleNameRef(p); }
      if (type === 'care' && p && k === 'log.care') {
        const id = G.actIdOf(meta);
        if (p.person.visitor) {
          const key = actKey(id), dup = d.notes.some(n => n.k === key && n.a.who === name);
          if (!dup) d.notes.push({ k: key, a: { name: G.settleNameRef(p), who: name } });
        } else {
          d.care[name] = (d.care[name] || 0) + 1;
          d.fam = d.fam || {}; (d.fam[name] = d.fam[name] || {})[id] = (d.fam[name][id] || 0) + 1;
        }
      } else if (type === 'cry' && p && !p.person.visitor) d.cry[name] = (d.cry[name] || 0) + 1;
      else if (type === 'self' && p && !p.person.visitor) d.self[name] = (d.self[name] || 0) + 1;
      else if (type === 'recovered' && p && !d.recovered.includes(name)) d.recovered.push(name);
      else if (type === 'frail' && p && !d.frail.includes(name)) d.frail.push(name);
      else if (k === 'log.bought' && meta.a && meta.a.item) d.bought.push(meta.a.item);
    } catch (e) { /* 记事实不能影响游戏 */ }
    return log0.apply(this, arguments);
  };

  const top = obj => Object.entries(obj).sort((a, b) => b[1] - a[1])[0];
  const hash = s => { const H = G.E('hash'); let h = H.settle_seed; for (const c of String(s)) h = (h * H.settle_mult + c.charCodeAt(0)) >>> 0; return h; };
  /* 变体：键 settle.xxx 有 settle.xxx.0 settle.xxx.1 ...，按日期挑一个 */
  const variant = (key, n) => { const list = []; for (let i = 0; i < G.E('settle').variants; i++) if (CY.i18n.has(key + '.' + i)) list.push(key + '.' + i); return list.length ? list[hash(key + n) % list.length] : key; };

  G.composeDay = (d, offline) => {
    const L = [], line = (k, a) => L.push({ k: variant('settle.' + k, d.n), a: a || {} });
    const nameOf = id => (d.names || {})[id] || legacyNameRef(id);
    if (offline) {
      line('away');
      for (const n of d.notes.slice(0, G.E('settle').offline_notes)) L.push(n);
      return L;
    }
    /* 访客先说：到来，被照顾，收到礼物，离开，都按发生的顺序 */
    /* 最多六句：先舍家人互动，再舍最早的，遇见的话和别的访客事不丢 */
    const ns = d.notes.slice();
    while (ns.length > G.E('settle').max_notes) { const i = ns.findIndex(n => /^visit\.fam\./.test(n.k)), j = i >= 0 ? i : ns.findIndex(n => !/^meet\./.test(n.k)); ns.splice(j >= 0 ? j : 0, 1); }
    for (const n of ns) L.push(n);
    /* 家人的日常：照顾得最多的两个人，各挑最常做的一件事 */
    const fam = Object.entries(d.fam || {}).sort((a, b) => (d.care[b[0]] || 0) - (d.care[a[0]] || 0)).slice(0, 2);
    for (const [name, acts] of fam) {
      const id = Object.entries(acts).sort((a, b) => b[1] - a[1])[0][0];
      line('fam_' + (['meal', 'rest', 'street', 'park', 'walk', 'chat', 'play', 'bath', 'doctor', 'medicine', 'sugar', 'water', 'hand', 'soothe', 'read', 'homework', 'game', 'pet'].includes(id) ? id : 'other'), { name: nameOf(name) });
    }
    const cr = top(d.cry);
    if (cr) line('cry', { name: nameOf(cr[0]) });
    if (d.frail.length) line('frail', { name: nameOf(d.frail[0]) });
    else if (d.recovered.length) line('recovered', { name: nameOf(d.recovered[0]) });
    else {
      const s = top(d.self);
      if (s) line('self', { name: nameOf(s[0]) });
    }
    if (d.bought.length) line('bought', { item: d.bought[0] });
    const people = G.activePeople().filter(p => p.person.kind === 'human');
    const mood = people.length ? people.reduce((a, p) => a + p.state.mood, 0) / people.length : G.E('settle').mood_default;
    if (!L.length) line('quiet');
    if (L.length < G.E('settle').end_line_below) line(mood >= G.E('settle').mood_good ? 'end_good' : mood < G.E('settle').mood_low ? 'end_low' : 'end_mid');
    return L.slice(0, G.E('settle').max_lines);
  };

  G.dateOf = n => {
    const [y, m, dd] = (G.world.start_date || G.gameDate().iso).split('-').map(Number), x = new Date(y, m - 1, dd + n - 1);
    return { iso: x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), month: x.getMonth() + 1, day: x.getDate(), weekday: x.getDay() };
  };

  G.closeDay = info => {
    const d = G.world.today && G.world.today.n === info.day ? G.world.today : blank(info.day);
    const rec = { n: info.day, iso: G.dateOf(info.day).iso, money: Math.round((G.world.money || 0) - d.money0), lines: G.composeDay(d, info.offline), offline: !!info.offline };
    G.cal.days = G.cal.days.filter(x => x.n !== rec.n);
    G.cal.days.push(rec);
    G._calDirty = true;
    G.world.today = blank(G.gameDate().n);
    G.lastSettled = rec;
    G.world.unread = (G.world.unread || []).filter(x => x !== rec.n).concat(rec.n);
    return rec;
  };
  G.dayEndHooks.unshift(G.closeDay);

  G.settleText = line => (line.k && CY.i18n.has(line.k) ? t(line.k, Object.fromEntries(Object.entries(line.a || {}).map(([k, value]) => {
    const v = ['name', 'who', 'guest'].includes(k) ? legacyNameRef(value) : value;
    return [k, v && v.t ? v.t.reduceRight((fb, kk) => CY.tOr(kk, fb), v.d) : v];
  }))) : line.text || '');
  /* 存档被手动改过的标记：存盘时写入关键数字的校验，载入时对不上就记一个“已编辑”，分享卡片上会标出来。
     只是诚实的标注，不是防作弊；存档本来就是明文，鼓励自己改着玩 */
  G.sigOf = (money, souvN, days) => { const H = G.E('hash'); let h = H.sig_seed; for (const c of `${Math.floor(money || 0)}|${souvN}|${days}|care`) h = ((h * H.sig_mult) ^ c.charCodeAt(0)) >>> 0; return h.toString(16); };
  G.computeSig = () => G.sigOf(G.world.money, Object.keys(G.world.souv || {}).length, G.cal.days.length);
  G.beforeSave = () => { G.world.sig = G.computeSig(); };
  G.afterLoad = () => { if (G.world.sig && G.world.sig !== G.computeSig()) G.world.edited = true; };
  /* 没点开看过的日子：总结弹出几秒就消失，挂机回来也不会错过，时间条上亮一个点，日历里标出来 */
  G.unread = () => G.world.unread || [];
  G.markRead = n => { G.world.unread = G.unread().filter(x => x !== n); };
  G.dayRecord = n => G.cal.days.find(x => x.n === n) || null;
})(globalThis.CY = globalThis.CY || {});
