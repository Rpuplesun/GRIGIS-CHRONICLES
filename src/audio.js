// 소리. 이벤트 표 하나로 재생한다: file이 있으면 녹음(공개 라이선스, docs/audio/audio-log.md), 없으면 임시 합성음.
// 합성음은 자리 표시용이다. 녹음을 구하면 EVENTS의 file만 채우면 바뀐다.
(function () {
  const DD = window.DD;
  const EVENTS = {
    click: { file: 'audio/sfx/Sfx_Thread_Snip.wav', vol: 0.5, gap: 0.05 },
    build: { file: 'audio/sfx/Sfx_Paper_FlapDrop.wav', vol: 0.9, gap: 0.1 },
    melee: { gap: 0.07, vol: 0.35, syn: (a) => { a.noise(0.05, 0.5, 1800, 'highpass'); a.tone('square', 190, 80, 0.07, 0.35); } },
    arrow: { gap: 0.08, vol: 0.3, syn: (a) => a.noise(0.09, 0.5, 2600, 'bandpass', 900) },
    orb: { gap: 0.08, vol: 0.28, syn: (a) => a.tone('sine', 700, 1300, 0.11, 0.5) },
    fire: { gap: 0.1, vol: 0.35, syn: (a) => { a.noise(0.18, 0.6, 700, 'lowpass'); a.tone('sawtooth', 160, 60, 0.15, 0.2); } },
    heal: { gap: 0.2, vol: 0.25, syn: (a) => { a.tone('sine', 880, 880, 0.08, 0.5); a.tone('sine', 1320, 1320, 0.12, 0.4, 0.07); } },
    die: { gap: 0.06, vol: 0.3, syn: (a) => a.tone('square', 240, 50, 0.16, 0.5) },
    bossdie: { gap: 1, vol: 0.7, syn: (a) => { a.tone('sawtooth', 200, 30, 0.9, 0.6); a.noise(0.8, 0.6, 400, 'lowpass'); } },
    udie: { gap: 0.15, vol: 0.4, syn: (a) => a.tone('triangle', 360, 100, 0.26, 0.6) },
    summon: { gap: 0.08, vol: 0.35, syn: (a) => { a.tone('triangle', 440, 440, 0.07, 0.6); a.tone('triangle', 660, 660, 0.1, 0.6, 0.06); } },
    hero: { gap: 0.5, vol: 0.55, syn: (a) => [523, 659, 784, 1047, 1319].forEach((f, i) => a.tone('square', f, f, i === 4 ? 0.35 : 0.09, 0.4, i * 0.08)) },
    up: { gap: 0.1, vol: 0.4, syn: (a) => { a.tone('square', 660, 660, 0.06, 0.4); a.tone('square', 990, 990, 0.12, 0.4, 0.06); } },
    err: { gap: 0.15, vol: 0.35, syn: (a) => a.tone('square', 150, 130, 0.13, 0.5) },
    heart: { gap: 0.25, vol: 0.6, syn: (a) => { a.tone('sine', 90, 40, 0.3, 0.9); a.noise(0.08, 0.4, 300, 'lowpass'); } },
    bfall: { gap: 0.2, vol: 0.55, syn: (a) => { a.noise(0.45, 0.8, 500, 'lowpass'); a.tone('sine', 120, 40, 0.3, 0.5); } },
    wave: { gap: 1, vol: 0.5, syn: (a) => { a.tone('sawtooth', 110, 104, 0.9, 0.5, 0, 500); a.tone('sawtooth', 165, 156, 0.9, 0.3, 0.05, 700); } },
    boss: { gap: 1, vol: 0.6, syn: (a) => { a.tone('sawtooth', 73, 65, 1.4, 0.6, 0, 400); a.tone('sawtooth', 110, 98, 1.4, 0.4, 0.1, 500); a.tone('sawtooth', 55, 55, 1.2, 0.4, 0.5, 300); } },
    fall: { gap: 1, vol: 0.6, syn: (a) => [330, 262, 196, 131].forEach((f, i) => a.tone('triangle', f, f * 0.97, 0.3, 0.6, i * 0.22)) },
    win: { gap: 1, vol: 0.6, syn: (a) => [523, 659, 784, 659, 784, 1047].forEach((f, i) => a.tone('square', f, f, i === 5 ? 0.6 : 0.13, 0.4, i * 0.13)) },
    lose: { gap: 1, vol: 0.6, syn: (a) => [392, 370, 330, 262, 196].forEach((f, i) => a.tone('triangle', f, f, i === 4 ? 0.8 : 0.25, 0.6, i * 0.25)) },
  };
  const AMB = { water: 'audio/ambience/Amb_Ch1Corridor_RainLoop.ogg' };
  let ac = null, master = null, vol = 0.6, lastAt = {}, ambEl = null, ambNode = null, nbuf = null;
  const pool = {};
  function ctx() {
    if (!ac) {
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
      ac = new A(); master = ac.createGain(); master.gain.value = vol; master.connect(ac.destination);
      nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nbuf.getChannelData(0); let s = 12345;
      for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; }
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  const api = (ev) => ({
    tone(type, f0, f1, dur, v, delay, lp) {
      const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * ev.vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let n = o; if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
      n.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
    },
    noise(dur, v, freq, type, f1) {
      const t = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = nbuf; s.loop = true; f.type = type; f.frequency.setValueAtTime(freq, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(v * ev.vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t, (t * 7.3) % 0.9); s.stop(t + dur + 0.02);
    },
  });
  DD.Audio = {
    EVENTS,
    get vol() { return vol; },
    setVol(v) { vol = v; if (master) master.gain.value = v; if (ambEl) ambEl.volume = Math.min(1, v * 0.7); if (ambNode) ambNode.g.gain.value = 0.05; },
    play(id) {
      const ev = EVENTS[id]; if (!ev || vol <= 0) return;
      const now = performance.now() / 1000; if (now - (lastAt[id] || 0) < ev.gap) return; lastAt[id] = now;
      if (ev.file) { // 녹음 파일: file:// 에서도 되도록 <audio> 풀을 쓴다
        const p = (pool[id] = pool[id] || { i: 0, els: [0, 1, 2].map(() => new Audio(ev.file)) });
        const el = p.els[p.i++ % 3]; el.volume = Math.min(1, vol * ev.vol); try { el.currentTime = 0; el.play().catch(() => {}); } catch (e) { /* 무시 */ }
        return;
      }
      if (ctx()) ev.syn(api(ev));
    },
    ambience(stageId) { // 스테이지 환경음. 녹음이 없으면 낮은 잡음 웅웅거림(임시)
      this.stopAmbience(); if (!stageId) return;
      if (AMB[stageId]) { ambEl = new Audio(AMB[stageId]); ambEl.loop = true; ambEl.volume = Math.min(1, vol * 0.7); ambEl.play().catch(() => {}); return; }
      if (!ctx()) return;
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = nbuf; s.loop = true; f.type = 'lowpass'; f.frequency.value = stageId === 'fire' ? 220 : 130; g.gain.value = 0.05;
      s.connect(f); f.connect(g); g.connect(master); s.start(); ambNode = { s, g };
    },
    stopAmbience() { if (ambEl) { ambEl.pause(); ambEl = null; } if (ambNode) { try { ambNode.s.stop(); } catch (e) { /* 무시 */ } ambNode = null; } },
  };
})();
