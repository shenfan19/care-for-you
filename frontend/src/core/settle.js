/* 每日结算与日历：一天里发生的事累积成事实，午夜收成三到五句话，存进日历，全部保留，可以翻看。
   存的是句子的键和参数，不是成品文字，所以换语言后重新生成。同一天同一个键的变体由日期决定，反复打开不变。 */
(function (CY) {
  const G = CY.game, store = CY.store;
  const t = (k, v) => CY.t(k, v);

  G.cal = { version: 1, days: [] };
  G.loadCalendar = async () => { G.cal = Object.assign({ version: 1, days: [] }, await store.readYaml('calendar.yaml')); };
  G.saveCalendar = () => { if (G._calDirty) { G._calDirty = false; store.writeYaml('calendar.yaml', G.cal); } };

  const blank = n => ({ n, care: {}, acts: {}, cry: {}, self: {}, recovered: [], frail: [], bought: [], notes: [], money0: Math.round(G.world.money || 0) });
  const today = () => {
    const n = G.gameDate().n;
    if (!G.world.today || G.world.today.n !== n) G.world.today = blank(n);
    return G.world.today;
  };
  G.settleNote = (k, a) => { today().notes.push({ k, a: a || {} }); };

  /* 记事实：包一层 G.log，不改原来的记录 */
  const log0 = G.log;
  G.log = function (pid, type, text, meta) {
    try {
      const d = today(), p = G.get(pid), name = p ? p.person.name : '', k = meta && meta.k;
      if (type === 'care' && p && k === 'log.care') {
        d.care[name] = (d.care[name] || 0) + 1;
        const ref = meta.a && meta.a.label && meta.a.label.t, id = ref && ref[ref.length - 1] ? String(ref[ref.length - 1]).replace(/^act\./, '').replace(/\.\w+$/, '') : '';
        if (id) d.acts[id] = (d.acts[id] || 0) + 1;
      } else if (type === 'cry' && p) d.cry[name] = (d.cry[name] || 0) + 1;
      else if (type === 'self' && p) d.self[name] = (d.self[name] || 0) + 1;
      else if (type === 'recovered' && p && !d.recovered.includes(name)) d.recovered.push(name);
      else if (type === 'frail' && p && !d.frail.includes(name)) d.frail.push(name);
      else if (k === 'log.bought' && meta.a && meta.a.item) d.bought.push(meta.a.item);
    } catch (e) { /* 记事实不能影响游戏 */ }
    return log0.apply(this, arguments);
  };

  const top = obj => Object.entries(obj).sort((a, b) => b[1] - a[1])[0];
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  /* 变体：键 settle.xxx 有 settle.xxx.0 settle.xxx.1 ...，按日期挑一个 */
  const variant = (key, n) => { const list = []; for (let i = 0; i < 6; i++) if (CY.i18n.has(key + '.' + i)) list.push(key + '.' + i); return list.length ? list[hash(key + n) % list.length] : key; };

  G.composeDay = (d, offline) => {
    const L = [], line = (k, a) => L.push({ k: variant('settle.' + k, d.n), a: a || {} });
    if (offline) {
      line('away');
      for (const n of d.notes.slice(0, 2)) L.push(n);
      return L;
    }
    for (const n of d.notes.slice(0, 2)) L.push(n);
    const c = top(d.care), acts = d.acts;
    if (c) {
      const [name, count] = c;
      if (acts.meal || acts.cook) line('meal', { name });
      else if (acts.park || acts.street || acts.walk) line('out', { name });
      else line('care', { name, n: count });
    }
    const cr = top(d.cry);
    if (cr) line('cry', { name: cr[0] });
    if (d.frail.length) line('frail', { name: d.frail[0] });
    else if (d.recovered.length) line('recovered', { name: d.recovered[0] });
    else {
      const s = top(d.self);
      if (s) line('self', { name: s[0] });
    }
    if (d.bought.length) line('bought', { item: d.bought[0] });
    const people = G.activePeople().filter(p => p.person.kind === 'human' && !(p.person.help && p.person.help.role === 'nanny'));
    const mood = people.length ? people.reduce((a, p) => a + p.state.mood, 0) / people.length : 0.6;
    if (!L.length) line('quiet');
    if (L.length < 5) line(mood >= 0.7 ? 'end_good' : mood < 0.45 ? 'end_low' : 'end_mid');
    return L.slice(0, 5);
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
    return rec;
  };
  G.dayEndHooks.unshift(G.closeDay);

  G.settleText = line => (line.k && CY.i18n.has(line.k) ? t(line.k, Object.fromEntries(Object.entries(line.a || {}).map(([k, v]) => [k, v && v.t ? (v.t.reduceRight((fb, kk) => CY.tOr(kk, fb), v.d)) : v]))) : line.text || '');
  G.dayRecord = n => G.cal.days.find(x => x.n === n) || null;
})(globalThis.CY = globalThis.CY || {});
