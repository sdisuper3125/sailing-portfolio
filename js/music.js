// Background music: a calm piano-and-pad piece synthesised with Web Audio (no audio files, no licensing).
// To use your own recording instead, put it at audio/music.mp3 and it will be used automatically.
(() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  let ctx = null, master = null, timer = null, on = false, step = 0, nextT = 0, useFile = null;
  let muted = false; try { muted = localStorage.getItem('music') === 'off'; } catch (e) {}
  const L = window.LANG || 'en';
  const label = L === 'zh' ? { on: '音樂：開', off: '音樂：關' } : { on: 'Music: on', off: 'Music: off' };

  // D major, Canon-like progression; each chord lasts 8 beats
  const f = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const CH = [[50, 57, 62, 66], [45, 52, 57, 61], [47, 54, 59, 62], [42, 49, 54, 57], [43, 50, 55, 59], [50, 57, 62, 66], [43, 50, 55, 59], [45, 52, 57, 61]];
  const ARP = [0, 2, 1, 3, 2, 1, 3, 2];
  const BEAT = 0.8;

  function impulse(c, sec) {
    const len = c.sampleRate * sec, b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    return b;
  }
  function build() {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    const verb = ctx.createConvolver(); verb.buffer = impulse(ctx, 3.2);
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    const dry = ctx.createGain(); dry.gain.value = 0.8;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    lp.connect(dry); lp.connect(verb); verb.connect(wet);
    dry.connect(comp); wet.connect(comp); comp.connect(master); master.connect(ctx.destination);
    ctx.bus = lp;
  }
  function tone(freq, t, dur, gain, type, atk, rel) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = (Math.random() - 0.5) * 8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel);
    o.connect(g); g.connect(ctx.bus); o.start(t); o.stop(t + dur + rel + 0.1);
  }
  function schedule() {
    while (nextT < ctx.currentTime + 1.2) {
      const bar = Math.floor(step / 8) % CH.length, b = step % 8, ch = CH[bar];
      if (b === 0) {
        ch.forEach((n, i) => tone(f(n), nextT, 8 * BEAT, i === 0 ? 0.06 : 0.035, 'sine', 1.6, 2.2));
        tone(f(ch[0] - 12), nextT, 8 * BEAT, 0.05, 'triangle', 0.6, 1.5);
      }
      const n = ch[ARP[b] % 4] + 12 + ((b % 4 === 3) ? 12 : 0);
      tone(f(n), nextT, 0.35, 0.05, 'triangle', 0.01, 1.4);
      if (b % 2 === 0) tone(f(n) * 2, nextT, 0.2, 0.012, 'sine', 0.01, 0.9);
      nextT += BEAT; step++;
    }
  }
  function start() {
    if (on || muted) return;
    on = true;
    // custom file takes priority if present
    if (useFile === null) { useFile = false; fetch('audio/music.mp3', { method: 'HEAD' }).then((r) => { if (r.ok && 'audio' in window) { useFile = new Audio('audio/music.mp3'); useFile.loop = true; useFile.volume = 0.35; if (on) useFile.play().catch(() => {}); stopSynth(); } }).catch(() => {}); }
    if (useFile) { useFile.play().catch(() => {}); return; }
    if (!ctx) build();
    ctx.resume();
    nextT = ctx.currentTime + 0.2; step = 0;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 4);
    schedule(); timer = setInterval(schedule, 250);
  }
  function stopSynth() { if (timer) { clearInterval(timer); timer = null; } if (ctx && master) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, 0.25); } }
  function stop() { on = false; stopSynth(); if (useFile && useFile.pause) useFile.pause(); }

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ghost music';
  const paint = () => { btn.textContent = muted ? '🔇' : '🎵'; btn.title = btn.ariaLabel = muted ? label.off : label.on; };
  paint();
  btn.onclick = () => {
    muted = !muted; try { localStorage.setItem('music', muted ? 'off' : 'on'); } catch (e) {}
    paint(); if (muted) stop(); else start();
  };
  const bar = document.querySelector('#top .bar'), lang = document.querySelector('#top .bar .lang');
  if (bar) bar.insertBefore(btn, lang || document.getElementById('btn-simple'));
  const go = () => start();
  document.getElementById('btn-start')?.addEventListener('click', go);
  document.getElementById('btn-intro-simple')?.addEventListener('click', () => {});
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
  window.__music = { start, stop };
})();
