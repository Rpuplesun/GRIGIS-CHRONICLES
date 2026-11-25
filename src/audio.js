// 소리. 이벤트 표 하나로 재생한다: file이 있으면 녹음(공개 라이선스, docs/audio/audio-log.md), 없으면 임시 합성음.
// 합성음은 자리 표시용이다. 녹음을 구하면 EVENTS의 file만 채우면 바뀐다.
(function () {
  const DD = window.DD;
  // f = web/audio/sfx/Sfx_<f>.wav (tools/audio/make_sfx.py: CC0 악기 녹음 + 절차 합성). vary = 재생 속도 흔들림(반복감 줄이기)
  const R = (f, vol, gap, vary) => ({ file: 'audio/sfx/Sfx_' + f + '.wav', vol, gap, vary: vary || 0 });
  const EVENTS = {
    click: { file: 'audio/sfx/Sfx_Thread_Snip.wav', vol: 0.5, gap: 0.05 },
    build: { file: 'audio/sfx/Sfx_Paper_FlapDrop.wav', vol: 0.9, gap: 0.1 },
    melee: R('melee', 0.45, 0.07, 0.08), arrow: R('arrow', 0.25, 0.08, 0.1), fire: R('fire', 0.22, 0.1, 0.08),
    orb: { gap: 0.08, vol: 0.28, syn: (a) => a.tone('sine', 700, 1300, 0.11, 0.5) }, // 마법 구슬은 합성음이 더 어울려 남긴다
    heal: R('heal', 0.35, 0.2, 0.05), die: R('die', 0.32, 0.06, 0.1), bossdie: R('bossdie', 0.75, 1), udie: R('udie', 0.4, 0.15, 0.05),
    summon: R('summon', 0.3, 0.08, 0.03), hero: R('hero', 0.7, 0.5), up: R('up', 0.45, 0.1), err: R('err', 0.5, 0.15),
    heart: R('heart', 0.55, 0.25, 0.04), bfall: R('bfall', 0.7, 0.2, 0.05), wave: R('wave', 0.5, 1), boss: R('boss', 0.7, 1), fall: R('fall', 0.7, 1),
    // 개선과 함께 생긴 순간들
    coin: R('coin', 0.5, 0.15, 0.04), clear: R('clear', 0.5, 1), ready: R('ready', 0.45, 1), alert: R('alert', 0.55, 1), alarm: R('alarm', 0.7, 2), edit: R('edit', 0.4, 0.15),
    imprint: R('imprint', 0.45, 0.15, 0.04),
    legend: R('legend', 0.72, 0.5),
    interrupt: R('interrupt', 0.55, 0.2, 0.05),
    ally: R('ally', 0.52, 0.3, 0.04),
    telegraph: R('telegraph', 0.5, 0.4),
    push: R('push', 0.46, 0.1, 0.08),
    pulse: R('pulse', 0.72, 0.5),
    event: R('event', 0.52, 0.3),
    spec: R('spec', 0.58, 0.2, 0.03),
    phase: R('phase', 0.68, 0.5),
    medal: R('medal', 0.6, 0.4),
  };
  const AMB = { water: 'audio/ambience/Amb_Ch1Corridor_RainLoop.ogg' };
  let ac = null, master = null, vol = 0.6, lastAt = {}, ambEl = null, ambNode = null, nbuf = null;
  const pool = {}, sbuf = {};
  // 녹음 효과음은 디코딩해 두고 Web Audio로 낸다(겹쳐도 끊기지 않고 지연이 적다). fetch가 안 되는 file://에서는 <audio> 풀
  function sload(id) {
    const ev = EVENTS[id]; if (sbuf[id] !== undefined || !ac || location.protocol === 'file:') return;
    sbuf[id] = null; fetch(ev.file).then((r) => r.arrayBuffer()).then((b) => new Promise((ok, no) => ac.decodeAudioData(b, ok, no))).then((x) => { sbuf[id] = x; }).catch(() => {});
  }
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
    preload() { if (ctx()) for (const id in EVENTS) if (EVENTS[id].file) sload(id); },
    play(id) {
      const ev = EVENTS[id]; if (!ev || vol <= 0) return;
      const now = performance.now() / 1000; if (now - (lastAt[id] || 0) < ev.gap) return; lastAt[id] = now;
      if (ev.file && ctx()) { sload(id); const bf = sbuf[id];
        if (bf) { const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = bf; src.playbackRate.value = 1 + (Math.random() * 2 - 1) * (ev.vary || 0); g.gain.value = ev.vol; src.connect(g); g.connect(master); src.start(); return; } }
      if (ev.file) { // 녹음 파일: 버퍼가 아직 없거나 file:// 이면 <audio> 풀
        const p = (pool[id] = pool[id] || { i: 0, els: [0, 1, 2].map(() => new Audio(ev.file)) });
        const el = p.els[p.i++ % 3]; el.volume = Math.min(1, vol * ev.vol); try { el.currentTime = 0; el.play().catch(() => {}); } catch (e) { /* 무시 */ }
        return;
      }
      if (ctx()) ev.syn(api(ev));
    },
    ambience(stageId) { // 스테이지 환경음: 실제 녹음이 없으면 스테이지별 다층 Web Audio 환경음
      this.stopAmbience(); if (!stageId) return;
      if (AMB[stageId]) { ambEl = new Audio(AMB[stageId]); ambEl.loop = true; ambEl.volume = Math.min(1, vol * 0.7); ambEl.play().catch(() => {}); return; }
      if (!ctx()) return;
      const cfg = {
        cave: { f: 110, q: 1.5, type: 'lowpass', g: 0.045, modF: 0.18, modA: 30, drone: 55 },
        fire: { f: 240, q: 2.0, type: 'bandpass', g: 0.05, modF: 0.45, modA: 80, drone: 68 },
        wild: { f: 420, q: 1.2, type: 'bandpass', g: 0.04, modF: 0.25, modA: 180 },
        forest: { f: 680, q: 0.9, type: 'bandpass', g: 0.032, modF: 0.14, modA: 220 },
        abyss: { f: 95, q: 2.2, type: 'lowpass', g: 0.055, modF: 0.12, modA: 25, drone: 46 },
      }[stageId] || { f: 140, q: 1, type: 'lowpass', g: 0.04, modF: 0.2, modA: 20 };
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      s.buffer = nbuf; s.loop = true; f.type = cfg.type; f.frequency.value = cfg.f; f.Q.value = cfg.q; g.gain.value = cfg.g;
      lfo.frequency.value = cfg.modF; lg.gain.value = cfg.modA;
      lfo.connect(lg); lg.connect(f.frequency);
      s.connect(f); f.connect(g); g.connect(master);
      s.start(); lfo.start();
      let dr = null;
      if (cfg.drone) {
        const o = ac.createOscillator(), dg = ac.createGain();
        o.type = 'sine'; o.frequency.value = cfg.drone; dg.gain.value = 0.018;
        o.connect(dg); dg.connect(master); o.start(); dr = o;
      }
      ambNode = { s, lfo, dr, g };
    },
    stopAmbience() {
      if (ambEl) { ambEl.pause(); ambEl = null; }
      if (ambNode) {
        try { ambNode.s.stop(); } catch (e) { /* 무시 */ }
        try { if (ambNode.lfo) ambNode.lfo.stop(); } catch (e) { /* 무시 */ }
        try { if (ambNode.dr) ambNode.dr.stop(); } catch (e) { /* 무시 */ }
        ambNode = null;
      }
    },
  };

  // ── 배경음악: web/audio/bgm/<id>.ogg (tools/music/compose.py로 만든 곡) ──
  // Web Audio 버퍼로 이음매 없이 반복하고 곡 사이를 겹쳐 넘긴다. 파일을 fetch할 수 없는 곳(file://)에서는 <audio>로 대신한다.
  // 맵 곡에서 군주 곡으로 넘어갔다 돌아오면, 맵 곡은 멈췄던 자리부터 다시 흐른다.
  const BGM = { title: 1, menu: 1, cave: 1, fire: 1, wild: 1, forest: 1, water: 1, abyss: 1, boss: 1, victory: 0, defeat: 0 }; // 1 = 반복
  let mVol = 0.5, mGain = null, cur = null; const bufs = {}, resumeAt = {};
  const url = (id) => 'audio/bgm/' + id + '.ogg';
  function mctx() { const a = ctx(); if (a && !mGain) { mGain = a.createGain(); mGain.gain.value = mVol; mGain.connect(a.destination); } return a; }
  function load(id) {
    if (!bufs[id]) bufs[id] = fetch(url(id)).then((r) => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then((b) => new Promise((ok, no) => ac.decodeAudioData(b, ok, no))).catch(() => null);
    return bufs[id];
  }
  function fadeOut(c, sec) {
    if (!c) return; c.dead = true;
    if (c.src) { const t = ac.currentTime; if (c.loop) resumeAt[c.id] = (t - c.t0) % c.src.buffer.duration;
      c.g.gain.cancelScheduledValues(t); c.g.gain.setValueAtTime(c.g.gain.value, t); c.g.gain.linearRampToValueAtTime(0, t + sec); c.src.stop(t + sec + 0.05); }
    if (c.el) { const el = c.el; if (c.loop) resumeAt[c.id] = el.currentTime; let v = el.volume; const step = v / Math.max(1, sec * 20);
      const iv = setInterval(() => { v -= step; if (v <= 0) { clearInterval(iv); el.pause(); } else el.volume = v; }, 50); }
  }
  function startEl(c, sec, off) {
    const el = new Audio(url(c.id)); el.loop = c.loop; el.volume = 0; c.el = el;
    try { if (off) el.currentTime = off; } catch (e) { /* 무시 */ }
    el.play().catch(() => { c.blocked = true; }); // 첫 입력 전에는 막힌다 → unlock에서 다시
    let v = 0; const iv = setInterval(() => { if (c.dead) return clearInterval(iv); v = Math.min(1, v + 1 / Math.max(1, sec * 20)); el.volume = v * mVol; if (v >= 1) clearInterval(iv); }, 50);
  }
  DD.Music = {
    get vol() { return mVol; },
    get id() { return cur && cur.id; },
    setVol(v) { mVol = v; if (mGain) mGain.gain.value = v; if (cur && cur.el) cur.el.volume = v; },
    // play(id, {fade, resume}): 같은 곡이면 그대로 둔다. resume이면 지난번 멈춘 자리부터
    play(id, o) {
      o = o || {}; if (!(id in BGM)) return; if (cur && cur.id === id && !cur.dead) return;
      const sec = o.fade === undefined ? 1.2 : o.fade, c = { id, loop: !!BGM[id] }, off = o.resume ? resumeAt[id] || 0 : 0;
      fadeOut(cur, sec); cur = c;
      if (!mctx() || location.protocol === 'file:') return startEl(c, sec, off);
      load(id).then((buf) => {
        if (cur !== c) return;
        if (!buf) return startEl(c, sec, off);
        const src = ac.createBufferSource(), g = ac.createGain(), t = ac.currentTime;
        src.buffer = buf; src.loop = c.loop; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + sec);
        src.connect(g); g.connect(mGain); src.start(t, off % buf.duration); c.src = src; c.g = g; c.t0 = t - (off % buf.duration);
      });
    },
    stop(sec) { fadeOut(cur, sec === undefined ? 1 : sec); cur = null; },
    preload(ids) { if (mctx() && location.protocol !== 'file:') ids.forEach(load); },
  };
  // 브라우저는 첫 클릭·키 입력 전에는 소리를 막는다. 첫 입력에서 풀고, 막혀 있던 곡을 다시 튼다.
  const unlock = () => { if (ac && ac.state === 'suspended') ac.resume(); else mctx(); if (cur && cur.el && cur.blocked) { cur.blocked = false; cur.el.play().catch(() => {}); } };
  window.addEventListener('pointerdown', unlock, true); window.addEventListener('keydown', unlock, true);
})();
