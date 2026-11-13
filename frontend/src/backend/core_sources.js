/* 适配层：输入来源合并。玩家动作、自动调度、随机事件、预设都往同一个手柄写，核心每步每个手柄只收一个值。
   合并规则：level 类取优先级最高的来源，total 类把所有来源求和。优先级是适配层配置，不写在这里，也不写在核心里。 */
(function (CY) {
  /* writes 是 [{ mode: 'level' | 'total', value, source }]，priority 是来源名从高到低的列表。返回 { level, source, total }：
     level 是赢的那个 level 值，没有 level 写入就是 null，source 是它的来源；total 是 total 写入的和。 */
  function merge(writes, priority) {
    let level = null, source = null, rank = Infinity, total = 0;
    for (const w of writes) {
      if (w.mode === 'total') { total += w.value; continue; }
      if (w.mode !== 'level') throw new Error(`输入来源合并：不认识的 mode ${w.mode}`);
      const r = priority.indexOf(w.source);
      if (r < 0) throw new Error(`输入来源合并：来源 ${w.source} 不在优先级配置里`);
      if (r < rank) { rank = r; level = w.value; source = w.source; }
    }
    return { level, source, total };
  }
  CY.coreSources = { merge };
})(globalThis.CY = globalThis.CY || {});
