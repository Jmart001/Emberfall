// sfx.js — tiny Web Audio sound effects for Emberfall EF1 (no assets).
// Exposes window.SFX.play(type) and window.SFX.toggle(). Muted state persists.
const SFX = (() => {
  let ctx = null;
  let muted = false;
  try {
    muted = localStorage.getItem('emberfall-ef1-muted') === '1';
  } catch (e) {}

  // type -> { f: start freq, f2: end freq, d: seconds, type: wave, g: gain }
  const SPECS = {
    hit: { f: 200, f2: 80, d: 0.11, type: 'square', g: 0.14 },
    miss: { f: 140, f2: 120, d: 0.07, type: 'triangle', g: 0.07 },
    level: { f: 523, f2: 1046, d: 0.32, type: 'sine', g: 0.16 },
    mine: { f: 300, f2: 150, d: 0.1, type: 'square', g: 0.12 },
    chop: { f: 240, f2: 120, d: 0.12, type: 'sawtooth', g: 0.1 },
    cast: { f: 620, f2: 1200, d: 0.16, type: 'sine', g: 0.12 },
    eat: { f: 420, f2: 300, d: 0.12, type: 'triangle', g: 0.1 },
    coins: { f: 880, f2: 1320, d: 0.14, type: 'sine', g: 0.12 },
    fish: { f: 520, f2: 360, d: 0.14, type: 'sine', g: 0.1 },
    prayer: { f: 700, f2: 1000, d: 0.35, type: 'sine', g: 0.1 },
    hurt: { f: 200, f2: 70, d: 0.16, type: 'sawtooth', g: 0.16 },
    die: { f: 300, f2: 60, d: 0.5, type: 'sawtooth', g: 0.18 },
  };

  function play(type) {
    if (muted) return;
    const s = SPECS[type];
    if (!s) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = s.type;
      osc.frequency.setValueAtTime(s.f, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, s.f2), now + s.d);
      gain.gain.setValueAtTime(s.g, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + s.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + s.d);
    } catch (e) {
      /* audio unavailable */
    }
  }

  function toggle() {
    muted = !muted;
    try {
      localStorage.setItem('emberfall-ef1-muted', muted ? '1' : '0');
    } catch (e) {}
    if (!muted) play('level');
    return muted;
  }

  return { play, toggle, isMuted: () => muted };
})();
window.SFX = SFX;
