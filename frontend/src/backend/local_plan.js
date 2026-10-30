/* 内置后台的第二部分：状态表和策略。极轻量，只有概率表，不用 AI。
   输入是前台发来的快照（每个人带个人卡的判断 abilities），输出是
     states：状态表，每行一个人，这里只给位置愿望，比如狗想去公园，爷爷想上街；需求心情虚弱由速率表和事件规则产生
     strategies：策略，一个有需求的角色向另一个角色（也可能是自己）发的请求
   概率与权重都读数据文件夹 templates/system.yaml，这是内部总体设置，不是玩家的 settings.ini。
   换成别的后台时，只要按协议回同样形状的 states 和 strategies，前台照样响应。 */
(function (CY) {
  const L = CY.backendLocal = CY.backendLocal || { name: 'builtin' };
  const wpick = items => {
    const sum = items.reduce((a, x) => a + x.w, 0);
    if (sum <= 0) return null;
    let r = Math.random() * sum;
    for (const x of items) { r -= x.w; if (r <= 0) return x; }
    return items[items.length - 1];
  };
  const sameRoom = (a, b) => a.location.place === b.location.place && a.location.room === b.location.room;
  const busy = q => q.sleeping || q.flags.hospital || q.flags.outing || q.flags.offduty;
  const GO_ALONE = ['teen', 'adult', 'elder'];

  /* 一行愿望表是否适用于这个人 */
  const rowFits = (row, ps, hour) => {
    if (row.species && !row.species.includes(ps.species)) return false;
    if (row.stage && !row.stage.includes(ps.stage)) return false;
    if (row.hour_from !== undefined && !(hour >= row.hour_from && hour < (row.hour_to === undefined ? 24 : row.hour_to))) return false;
    for (const k in row.min_need || {}) if ((ps.needs[k] || 0) < row.min_need[k]) return false;
    return ps.abilities.go_actions.includes(row.action);
  };

  L.plan = req => {
    const S = (CY.game.tpl && CY.game.tpl.system) || {}, A = S.agents || {}, R = A.request || {}, WT = A.want || {}, RW = A.role_weight || {};
    const people = (req.people || []).filter(p => !p.protagonist), hours = (req.minutes || 0) / 60, hour = (req.world || {}).hour || 0;
    const pending = req.pending || [], declined = req.declined || [];
    const has = (from, to, key) => pending.concat(declined).some(x => x.from === from && x.to === to && x.key === key);
    const states = [], strategies = [];

    /* 状态表：位置愿望 */
    for (const ps of people) {
      if (ps.want || busy(ps)) continue;
      for (const row of WT.rows || []) {
        if (!rowFits(row, ps, hour) || Math.random() >= Math.min(1, (row.chance_per_hour || 0) * hours)) continue;
        states.push({ person: ps.id, want: { id: row.id, action: row.action } });
        break;
      }
    }

    /* 策略：有需求的人向别人发请求。每个人每次最多发一个 */
    const scale = R.scale === undefined ? 1 : R.scale, room = (R.max_open || 6) - pending.length;
    if (scale <= 0 || room <= 0) return { v: 1, states, strategies };
    const sameBonus = A.same_room_bonus || 1;
    const targets = (ps, ok) => {
      const out = [];
      for (const q of people) {
        if (busy(q) || !ok(q)) continue;
        const role = q.id === ps.id ? 'self' : q.abilities.help ? q.abilities.help.role : 'other';
        const w = (RW[role] === undefined ? 0 : RW[role]) * (q.id !== ps.id && sameRoom(q, ps) ? sameBonus : 1);
        if (w > 0) out.push({ q, w });
      }
      return out;
    };
    for (const ps of people) {
      if (strategies.length >= room || ps.sleeping || ps.flags.hospital || ps.flags.outing) continue;
      /* 愿望：想去的地方，同伴或自己响应 */
      if (ps.want) {
        if (Math.random() < Math.min(1, (R.go_rate_per_hour || 6) * scale * hours)) {
          const act = ps.want.action;
          const t = wpick(targets(ps, q => q.id === ps.id ? ps.species === 'human' && GO_ALONE.includes(ps.stage) : !!q.abilities.help && !has(ps.id, q.id, act)));
          if (t) { strategies.push({ from: ps.id, to: t.q.id, kind: 'go', action: act }); continue; }
        }
      }
      /* 需求：超过门槛的需求，先挑最急的有人能管的 */
      const needs = Object.keys(ps.needs).filter(k => ps.needs[k] > (R.threshold || 0.55)).sort((a, b) => ps.needs[b] - ps.needs[a]);
      if (!needs.length || Math.random() >= Math.min(1, (R.rate_per_hour || 20) * scale * hours)) continue;
      for (const k of needs) {
        const t = wpick(targets(ps, q => q.id === ps.id ? ps.abilities.self_needs.includes(k) : ps.abilities.care_needs.includes(k) && !has(ps.id, q.id, k)));
        if (t) { strategies.push({ from: ps.id, to: t.q.id, kind: t.q.id === ps.id ? 'self' : 'care', need: k }); break; }
      }
    }
    return { v: 1, states, strategies };
  };
})(globalThis.CY = globalThis.CY || {});
