/* 适配层：游戏赋值模块。
   规矩：生理状态必须经过核心，游戏不直接改；测量和需求这类量，游戏可以直接赋值，因为测量不改变系统。
   这里用核心的 snapshot 与 restore 把值写进去，不需要核心提供写状态的接口。每次赋值记一笔，测试和排查用。
   现在由 lm.js 在游戏侧的值与核心里的值不一致时调用。药效加一这类 add 动作暂时也走这里，等核心有了冲量输入后改成手柄写入。 */
(function (CY) {
  const log = [];
  function set(core, id, values, reason) {
    const snap = core.snapshot(id);
    for (const k in values) {
      if (!(k in snap.state.values)) throw new Error(`游戏赋值：核心里没有变量 ${k}`);
      snap.state.values[k] = Number(values[k]);
    }
    core.restore(snap);
    log.push({ id, reason: reason || null, vars: Object.keys(values) });
    if (log.length > 200) log.shift();
  }
  CY.coreAssign = { set, log };
})(globalThis.CY = globalThis.CY || {});
