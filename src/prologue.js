// 프롤로그 그림: 코드로 그린 그리기스 대륙(시드 고정). 320×160 논리 픽셀.
// web/art/prologue_<land|gate|invade|flags>.webp 가 있으면 그 그림이 대신 쓰인다(main.js showStory).
(function () {
  const DD = window.DD, P = DD.PAL, W = 320, H = 160, CX = 160, CY = 80;
  const hash = (x, y) => { let n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const noise = (x, y, s) => { const xi = Math.floor(x / s), yi = Math.floor(y / s), fx = x / s - xi, fy = y / s - yi, sm = (t) => t * t * (3 - 2 * t), a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * sm(fx) + (c - a) * sm(fy) + (a - b - c + d) * sm(fx) * sm(fy); };
  // 다섯 종족의 영토 중심과 색(밝음, 어두움)
  const LANDS = [['human', 160, 104, 'b2', 'b3'], ['dragon', 236, 62, 'r2', 'r3'], ['beast', 84, 66, 'w2', 'w3'], ['spirit', 158, 44, 'n2', 'n3'], ['merfolk', 226, 112, 't2', 't3']];
  const land = (x, y) => { const dx = (x - CX) / 128, dy = (y - CY) / 62; return 1 - Math.sqrt(dx * dx + dy * dy) + (noise(x, y, 22) - 0.5) * 0.7 + (noise(x, y, 9) - 0.5) * 0.25 > 0.12; };
  const owner = (x, y) => { let b = 0, bd = 1e9; LANDS.forEach((l, i) => { const q = (x - l[1]) ** 2 + ((y - l[2]) * 1.5) ** 2 + noise(x + i * 50, y, 14) * 900; if (q < bd) { bd = q; b = i; } }); return b; };
  let base = null, own = null;
  function build() {
    base = document.createElement('canvas'); base.width = W; base.height = H; own = new Int8Array(W * H).fill(-1);
    const x = base.getContext('2d');
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      if (land(px, py)) { const o = owner(px, py); own[px + py * W] = o; x.fillStyle = P[LANDS[o][noise(px, py, 5) > 0.55 ? 4 : 3]]; }
      else x.fillStyle = P[noise(px, py, 30) > 0.5 ? 'b4' : 'p4'];
      x.fillRect(px, py, 1, 1);
    }
    for (let py = 1; py < H - 1; py++) for (let px = 1; px < W - 1; px++) { // 해안선·국경, 얕은 물, 산과 숲 점
      const o = own[px + py * W];
      if (o < 0) { if ([-1, 1, -W, W].some((d) => own[px + py * W + d] >= 0)) { x.fillStyle = P.b3; x.fillRect(px, py, 1, 1); } else if (hash(px, py) < 0.012) { x.fillStyle = P.b3; x.fillRect(px, py, 2, 1); } continue; }
      if ([-1, 1, -W, W].some((d) => own[px + py * W + d] < 0)) { x.fillStyle = P.K; x.fillRect(px, py, 1, 1); }
      else if (own[px + py * W + 1] !== o || own[px + py * W + W] !== o) { if ((px + py) % 2) { x.fillStyle = P.K; x.fillRect(px, py, 1, 1); } }
      else if (hash(px * 3, py * 7) < 0.02) { x.fillStyle = P[o === 1 ? 'o2' : o === 3 ? 'n4' : o === 2 ? 'w4' : o === 4 ? 't1' : 'b1']; x.fillRect(px, py - 1, 1, 1); x.fillRect(px - 1, py, 3, 1); }
    }
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function flag(x, px, py, col, t, i) {
    const wv = ((t * 4 + i) | 0) % 2;
    x.fillStyle = P.K; x.fillRect(px - 1, py - 17, 3, 18); x.fillRect(px + 1, py - 17 + wv, 12, 9);
    x.fillStyle = P.w1; x.fillRect(px, py - 16, 1, 16);
    x.fillStyle = P[col]; x.fillRect(px + 2, py - 16 + wv, 10, 7);
    x.fillStyle = P.W; x.fillRect(px + 5, py - 14 + wv, 4, 3); x.fillStyle = P.g1; x.fillRect(px + 6, py - 13 + wv, 2, 1);
    x.fillStyle = P.K; x.fillRect(px + 10, py - 13 + wv, 2, 1); // 깃발 끝 갈라짐
  }
  function gate(x, t) { // 지도 위의 작은 문
    const f = ((t * 6) | 0) % 2;
    x.fillStyle = P.K; x.fillRect(CX - 8, CY - 9, 16, 18); x.fillRect(CX - 10, CY - 6, 20, 12);
    x.fillStyle = P.e2; x.fillRect(CX - 7, CY - 8, 14, 16); x.fillRect(CX - 9, CY - 5, 18, 10);
    x.fillStyle = P.r4; x.fillRect(CX - 5, CY - 6, 10, 12); x.fillRect(CX - 7, CY - 3, 14, 6);
    x.fillStyle = P.r2; x.fillRect(CX - 4 + f, CY - 4, 7, 8); x.fillStyle = P.o2; x.fillRect(CX - 2, CY - 2 + f, 4, 4); x.fillStyle = P.g1; x.fillRect(CX - 1 + f, CY - 1, 2, 2);
    x.fillStyle = P.e1; x.fillRect(CX - 9, CY - 11, 3, 3); x.fillRect(CX + 6, CY - 11, 3, 3); // 뿔
  }
  DD.prologue = function (ctx, kind, t) {
    if (!base) build();
    ctx.imageSmoothingEnabled = false; ctx.drawImage(base, 0, 0);
    if (kind === 'gate' || kind === 'invade') {
      const r = kind === 'gate' ? 14 + Math.min(10, t * 3) : Math.min(150, 26 + t * 22); // 오염이 문에서 번져 나간다
      for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
        if (own[px + py * W] < 0) continue;
        const d = Math.hypot(px - CX, (py - CY) * 1.4) + (noise(px, py, 10) - 0.5) * 26;
        if (d < r) { const k = (r - d) / 30; if (BAYER[(px & 3) + (py & 3) * 4] < Math.min(15, 4 + k * 14)) { ctx.fillStyle = P[d < r * 0.55 ? 'r4' : 'p4']; ctx.fillRect(px, py, 1, 1); } }
      }
      if (kind === 'invade') { // 악마 무리가 사방으로 퍼진다
        for (let i = 0; i < 22; i++) {
          const a = i * 2.39996, rr = 22 + ((t * 9 + i * 13) % Math.max(24, r - 20)), px = CX + Math.cos(a) * rr * 1.25, py = CY + Math.sin(a) * rr * 0.72;
          if (px < 4 || py < 12 || px > W - 4 || py > H - 2 || own[(px | 0) + (py | 0) * W] < 0) continue;
          DD.blit(ctx, i % 5 === 0 ? 'd_brute' : i % 3 === 0 ? 'd_hound' : 'd_imp', 2 + (((t * 8 + i) | 0) % 4), px, py, Math.cos(a) < 0);
        }
        for (let i = 0; i < 14; i++) { const px = (hash(i, 3) * W) | 0, py = (hash(i, 9) * H) | 0; if (own[px + py * W] >= 0 && Math.hypot(px - CX, py - CY) < r) { const f = ((t * 6 + i) | 0) % 3; ctx.fillStyle = P.o2; ctx.fillRect(px, py - f, 2, 2 + f); ctx.fillStyle = P.g1; ctx.fillRect(px, py, 1, 1); } }
      }
      gate(ctx, t);
    }
    if (kind === 'flags') {
      gate(ctx, t);
      LANDS.forEach((l, i) => { if (t > i * 0.35) flag(ctx, l[1] + (i === 0 ? -20 : 0), l[2] + (i === 0 ? 16 : 0), l[3], t, i); });
    }
  };
})();
