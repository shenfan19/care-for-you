/* 音效和音乐：全部用浏览器自带的 Web Audio 现场合成，没有音频文件，不增加体积。
   音效：点按、有人开口要求、完成打勾、发生了事情。音乐：安静的五声音阶和弦垫加零星的旋律，夜里更低更慢。
   浏览器要求先有一次点击才能出声，所以第一次点按之后才开始。设置里 audio.sfx、audio.music、audio.volume 可以关或调。 */
(function (CY) {
  const G = CY.game, ini = CY.ini;
  const S = CY.sound = CY.sound || {};
  let ctx = null, master = null, musicBus = null, sfxBus = null, timer = null, nextT = 0, bar = 0;
  const flag = k => ini.bool(G.cfg, 'audio', k);
  const volume = () => { const v = parseFloat(ini.get(G.cfg, 'audio', 'volume')); return isNaN(v) ? 0.5 : Math.max(0, Math.min(1, v)); };

  const ensure = () => {
    if (ctx) return ctx;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
    musicBus = ctx.createGain(); sfxBus = ctx.createGain(); musicBus.connect(master); sfxBus.connect(master);
    return ctx;
  };
  const tone = (freq, at, dur, type, gain, bus, attack) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), a = attack || 0.012;
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(gain, at + a); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(bus); o.start(at); o.stop(at + dur + 0.05);
  };

  /* 音效：[频率, 开始秒, 时长秒, 波形, 音量] */
  const SFX = {
    tap: [[760, 0, 0.06, 'sine', 0.07]],
    ask: [[660, 0, 0.12, 'sine', 0.14], [880, 0.09, 0.18, 'sine', 0.11]],
    done: [[784, 0, 0.18, 'triangle', 0.2], [1047, 0.11, 0.34, 'triangle', 0.2]],
    event: [[523, 0, 0.26, 'sine', 0.13], [659, 0.13, 0.32, 'sine', 0.11]],
  };
  const lastAt = {};
  S.sfx = name => {
    if (!flag('sfx') || !SFX[name] || !ensure() || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (now - (lastAt[name] || -1) < 0.15) return;
    lastAt[name] = now;
    for (const [f, d, dur, type, g] of SFX[name]) tone(f, now + d, dur, type, g, sfxBus);
  };

  /* 音乐：四小节一循环，C 大调的 I、vi、IV、V。每小节一个长和弦垫，旋律是五声音阶里随机走的两三个音 */
  const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0];
  const CHORDS = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]];
  const scheduleBar = at => {
    const night = G.isNight && G.isNight(), len = night ? 7 : 5, ch = CHORDS[bar % 4], oct = night ? 0.5 : 1;
    for (const f of ch) tone(f * 0.5, at, len + 1.2, 'sine', night ? 0.035 : 0.05, musicBus, 1.4);
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const f = PENTA[Math.floor(Math.random() * PENTA.length)] * 2 * oct;
      tone(f, at + 0.4 + i * (len / n) + Math.random() * 0.5, 2.2, 'triangle', 0.045, musicBus, 0.05);
    }
    bar++;
    return len;
  };
  const pump = () => {
    if (!ctx || ctx.state !== 'running') return;
    while (nextT < ctx.currentTime + 1.5) nextT += scheduleBar(Math.max(nextT, ctx.currentTime + 0.05));
  };
  const startMusic = () => { if (timer || !ensure()) return; nextT = ctx.currentTime + 0.3; timer = setInterval(pump, 500); pump(); };
  const stopMusic = () => { if (timer) { clearInterval(timer); timer = null; } };

  /* 按设置开关音乐、调音量 */
  S.apply = () => {
    if (!ctx) return;
    const v = volume(), t = ctx.currentTime;
    sfxBus.gain.setTargetAtTime(flag('sfx') ? v : 0, t, 0.05);
    musicBus.gain.setTargetAtTime(flag('music') ? v * 0.6 : 0, t, 0.4);
    if (flag('music') && v > 0) startMusic(); else stopMusic();
  };
  const wake = () => {
    if (!ensure()) return;
    const go = () => { S.apply(); };
    if (ctx.state === 'suspended') ctx.resume().then(go).catch(() => {}); else go();
  };

  /* 第一次点按之后才开始；之后每次点按按钮有一声轻响 */
  document.addEventListener('pointerdown', e => {
    wake();
    if (e.target.closest && e.target.closest('button, .tile, .chip, .sw')) S.sfx('tap');
  }, true);
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (flag('music') || flag('sfx')) ctx.resume(); });

  /* 头上弹出的事件各有各的声音 */
  (G.popHooks = G.popHooks || []).push(e => S.sfx(e.kind === 'done' ? 'done' : e.kind === 'ask' ? 'ask' : 'event'));
})(globalThis.CY = globalThis.CY || {});
