/* 时间：只有现实。游戏里几点就是现实里几点，动作靠长按，占用你现实里的时间。
   没有快进，没有暂停，没有任务队列：世界只在页面开着的时候走，不需要停，也不需要排。 */
(function (CY) {
  const G = CY.game;
  G.timeMode = () => 'real';
  G.playMode = () => 'reality';
  G.isPaused = () => false;
  G.inputMode = () => 'hold';
  /* 长按要多少秒：由动作花掉的游戏分钟算出来，不是线性的，开方后压缩。一分钟的小事一秒多，一个小时的大事五秒多，封顶六秒。 */
  G.holdFor = min => Math.round(Math.min(6, Math.max(1, 0.6 + 0.65 * Math.sqrt(min))) * 2) / 2;
})(globalThis.CY = globalThis.CY || {});
