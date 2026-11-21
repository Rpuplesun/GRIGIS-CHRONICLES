// 캔버스 렌더러. 논리 해상도 696×480, 정수 좌표만 사용(반투명·보간 없음).
// 효과 규칙(VFX 키트): 프레임 교체만, 알파·크기·회전 애니메이션 없음, 덮기는 순서 디더.
(function () {
  const DD = window.DD, C = DD.C, P = DD.PAL;
  const bgCache = {};
  function rnd(seed) { let a = seed; return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296); }
    // 순서 디더(Bayer 4×4). step k는 k-1을 반드시 포함한다(VeilDither 셰이더와 같은 성질).
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const veilPat = {};
  function dither(ctx, step, col, x, y, w, h) {
    if (step <= 0) return;
    const k = step + col;
    if (!veilPat[k]) {
      const c = document.createElement('canvas'); c.width = c.height = 4; const cx = c.getContext('2d'); cx.fillStyle = P[col];
      BAYER.forEach((t, i) => { if (t < step) cx.fillRect(i % 4, (i / 4) | 0, 1, 1); });
      veilPat[k] = ctx.createPattern(c, 'repeat');
    }
    ctx.fillStyle = veilPat[k]; ctx.fillRect(x, y, w, h);
  }
  DD.veil = (ctx, step) => dither(ctx, step, 'K', 0, 0, C.W, C.H);
  function glow(x, cx, cy, r, col) { // 디더로 그린 빛 무리(안쪽 진하게, 바깥 성기게)
    x.save(); x.beginPath(); x.rect(cx - r, cy - r, r * 2, r * 2); x.clip();
    for (let i = 3; i >= 1; i--) { const rr = Math.round((r * i) / 3); x.save(); x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.clip(); dither(x, i === 3 ? 3 : i === 2 ? 4 : 6, col, cx - rr, cy - rr, rr * 2, rr * 2); x.restore(); }
    x.restore();
  }
  // 스테이지별 떠다니는 티끌(상태 없음: 시간의 함수)
  const MOTE = { cave: ['e2', 0, -3], fire: ['o2', 0, -14], water: ['b1', 0, -9], forest: ['n1', 4, 8], wild: ['w1', 6, 2], abyss: ['p1', 0, -6] };
  function motes(x, T, st) {
    const [col, vx, vy] = MOTE[st.id];
    for (let i = 0; i < 16; i++) {
      const sx = (i * 97) % C.W, sy = (i * 53) % (C.H - 30), ph = i * 1.7;
      const py = 26 + ((((sy + T * vy * (0.6 + (i % 3) * 0.3)) % (C.H - 30)) + (C.H - 30)) % (C.H - 30)), px = (((sx + T * vx + Math.sin(T * 0.7 + ph) * 5) % C.W) + C.W) % C.W;
      x.fillStyle = P[i % 5 === 0 && st.id === 'fire' ? 'g1' : col]; x.fillRect(px | 0, py | 0, 1, 1);
    }
  }
  function bar(x, x0, y0, w, f, col) {
    x.fillStyle = P.K; x.fillRect(x0 - 1, y0 - 1, w + 2, 3);
    x.fillStyle = P[col]; x.fillRect(x0, y0, Math.max(0, Math.round(w * f)), 1);
  }
  function ring(x, cx, cy, rx, col, solid) {
    x.fillStyle = P[col];
    for (let i = -rx; i <= rx; i++) if (solid || i % 2 === 0) { const dy = Math.abs(i) > rx - 2 ? 0 : 1; x.fillRect(cx + i, cy + 3 + dy, 1, 1); x.fillRect(cx + i, cy + 1 - dy, 1, 1); }
  }
  function dotted(x, cx, cy, r, col, n) {
    x.fillStyle = P[col]; n = n || 48;
    for (let a = 0; a < n; a++) x.fillRect(Math.round(cx + Math.cos((a / n) * 6.283) * r), Math.round(cy + Math.sin((a / n) * 6.283) * r), 1, 1);
  }
  const FONT = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111', '+': '000010111010000' };
  function num(x, s, cx, cy, col) {
    let px = cx - s.length * 2;
    for (const ch of s) { const g = FONT[ch]; for (let i = 0; i < 15; i++) if (g[i] === '1') { x.fillStyle = P.K; x.fillRect(px + (i % 3) + 1, cy + ((i / 3) | 0) + 1, 1, 1); } for (let i = 0; i < 15; i++) if (g[i] === '1') { x.fillStyle = P[col]; x.fillRect(px + (i % 3), cy + ((i / 3) | 0), 1, 1); } px += 4; }
  }
  function drawFx(x, f) {
    const p = 1 - f.t / f.T, X = Math.round(f.x), Y = Math.round(f.y); // p: 0→1
    const vfx = (name, ox, oy, flip) => { const n = DD.frames('v_' + name).length; DD.blit(x, 'v_' + name, Math.min(n - 1, (p * n) | 0), X + (ox || 0), Y + (oy || 0), flip); };
    if (f.k === 'dust') return vfx('puff', 0, 5);
    if (f.k === 'hit') return vfx('slash', 0, 9, f.c === 'r1');
    if (f.k === 'boom') return vfx(f.c === 't2' || f.c === 'b1' || f.c === 'b2' ? 'ice' : 'explode', 0, 12);
    if (f.k === 'heal') return vfx('healfx', 0, 12);
    if (f.k === 'summon') return vfx('pillar', 0, 5);
    if (f.k === 'collapse') return vfx('collapse', 0, 13);
    if (f.k === 'smoke') return vfx('smoke', 0, 5);
    if (f.k === 'hero') vfx('burst', 0, 5);
    if (f.k === 'corpse') { const n = DD.frames(f.s).length; DD.blit(x, f.s, Math.min(n - 1, 9 + ((p * 3) | 0)), X, Y + 3, f.face < 0); }
    else if (f.k === 'dust') { const a = DD.fxArt('dust', Math.min(4, (p * 5) | 0), f.c); x.drawImage(a.c, X - 8, Y - 12); }
    else if (f.k === 'hit') { x.fillStyle = P[f.c]; if (p < 0.5) { x.fillRect(X - 1, Y, 3, 1); x.fillRect(X, Y - 1, 1, 3); } else { [[-2, -2], [2, -2], [-2, 2], [2, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => x.fillRect(X + a, Y + b, 1, 1)); } }
    else if (f.k === 'boom') { const fr = (p * 3) | 0; dotted(x, X, Y, Math.round(f.r * (0.45 + fr * 0.27)), fr === 2 ? 'W' : f.c, 20 + fr * 8); if (fr === 0) { x.fillStyle = P.W; x.fillRect(X - 1, Y - 1, 3, 3); } }
    else if (f.k === 'heal') { x.fillStyle = P[f.c]; const y = Y - ((p * 4) | 0) * 2; x.fillRect(X - 1, y, 3, 1); x.fillRect(X, y - 1, 1, 3); }
    else if (f.k === 'gold') num(x, '+' + f.n, X, Y - ((p * 5) | 0) * 2, 'g1');
    else if (f.k === 'summon' || f.k === 'hero') {
      const fr = (p * (f.k === 'hero' ? 9 : 5)) | 0, big = f.k === 'hero';
      ring(x, X, Y - fr * 3, big ? 8 : 6, f.c, true);
      if (fr > 0) ring(x, X, Y - (fr - 1) * 3, big ? 8 : 6, f.c, false);
      x.fillStyle = P.W; x.fillRect(X - (big ? 6 : 4) + ((fr * 5) % (big ? 12 : 8)), Y - 4 - ((fr * 7) % 14), 1, 2);
      if (big) { const a = DD.fxArt('glint', 0, fr % 2 ? 'g' : f.c); x.drawImage(a.c, X - 6, Y - 26 - (fr % 2)); }
    }
  }
  function drawShot(x, s) {
    const f = 1 - Math.max(0, s.t) / s.T, dx = s.tx - s.x, dy = s.ty - s.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    const arc = s.k === 'arrow' ? -Math.sin(f * 3.1416) * Math.min(10, l / 8) : 0;
    const X = s.x + dx * f, Y = s.y + dy * f + arc, px = (k, c) => { x.fillStyle = P[c] || P.W; x.fillRect(Math.round(X - ux * k), Math.round(Y - uy * k), 1, 1); };
    if (s.k === 'arrow') { px(0, 's1'); px(1, 'w1'); px(2, 'w2'); px(3, 'w3'); }
    else if (s.k === 'fire') { x.fillStyle = P.o2; x.fillRect(Math.round(X) - 1, Math.round(Y) - 1, 3, 3); x.fillStyle = P.g1; x.fillRect(Math.round(X), Math.round(Y), 1, 1); px(3, 'o2'); px(5, 'o3'); px(7, 'r3'); }
    else { x.fillStyle = P[s.c] || P.W; x.fillRect(Math.round(X) - 1, Math.round(Y) - 1, 2, 2); x.fillStyle = P.W; x.fillRect(Math.round(X) - 1, Math.round(Y) - 1, 1, 1); px(3, s.c); if (((f * 8) | 0) % 2) px(5, s.c); }
  }
  const T = C.TILE, GW = C.GW, GH = C.GH, OX = C.OX, OY = C.OY;
  const tcx = (cx) => OX + cx * T + 12, tcy = (cy) => OY + cy * T + 12;
  function shadow(x, cx, cy, w) { x.fillStyle = P.K; const h = w >> 1; x.fillRect(cx - h + 1, cy + 1, w - 2, 1); x.fillRect(cx - h, cy + 2, w, 1); x.fillRect(cx - h + 1, cy + 3, w - 2, 1); }
  // 던전 바닥(길·벽 편집이 바뀔 때만 다시 그린다)
  function bg(G, d) {
    const k = G.st.id + ':' + d.i + ':' + d.ver;
    if (bgCache[d.i] && bgCache[d.i].k === k) return bgCache[d.i].c;
    const c = document.createElement('canvas'); c.width = C.W; c.height = C.H;
    const x = c.getContext('2d'), st = G.st.id, tl = (n) => DD.tile(n, st);
    for (let y = 0; y < C.H; y += T) for (let px = 0; px < C.W; px += T) x.drawImage(DD.tile('void', 'cave'), px, y);
    for (let cy = -1; cy <= GH + 1; cy++) for (let cx = -1; cx <= GW; cx++) {
      const inside = cx >= 0 && cy >= 0 && cx < GW && cy < GH, ent = !inside && DD.entOutside(d.ents, cx, cy);
      if (cy > GH && !ent) continue;
      const v = inside ? d.grid[cx + cy * GW] : ent ? 1 : 2;
      const h = ((cx * 73856093) ^ (cy * 19349663) ^ (st.length * 83492791)) >>> 0; // 칸마다 고정된 무작위 값
      let img;
      if (v === 2) img = tl('wall');
      else if (v === 1) img = DD.stageTile(st, 'road', h % DD.stageTiles(st, 'road'));
      else { const nf = DD.stageTiles(st, 'floor'), np = DD.stageTiles(st, 'prop'); // 바닥: 대부분 기본 무늬, 가끔 변형, 드물게 소품
        img = inside && h % 100 < 6 && !DD.isFixed(cx, cy) ? DD.stageTile(st, 'prop', (h >> 8) % np) : DD.stageTile(st, 'floor', h % 10 < 5 ? 0 : 1 + ((h >> 4) % (nf - 1))); }
      x.drawImage(img, OX + cx * T, OY + cy * T);
      if (inside && v === 2) { x.fillStyle = P.K; x.fillRect(OX + cx * T, OY + cy * T + T - 1, T, 1); }
    }
    // 길 가장자리: 어두운 턱과 밝은 테두리를 둘러 악마가 걷는 길을 또렷하게 한다
    const isRoad = (cx, cy) => (cx >= 0 && cy >= 0 && cx < GW && cy < GH ? d.grid[cx + cy * GW] === 1 : DD.entOutside(d.ents, cx, cy));
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
      if (!isRoad(cx, cy)) continue; const X = OX + cx * T, Y = OY + cy * T;
      [[0, -1, X, Y, T, 1, X, Y - 2, T, 2], [0, 1, X, Y + T - 1, T, 1, X, Y + T, T, 2], [-1, 0, X, Y, 1, T, X - 2, Y, 2, T], [1, 0, X + T - 1, Y, 1, T, X + T, Y, 2, T]].forEach(([dx, dy, lx, ly, lw, lh, kx, ky, kw, kh]) => {
        if (isRoad(cx + dx, cy + dy) || (cx + dx === C.HEART_T[0] && cy + dy === C.HEART_T[1])) return;
        x.fillStyle = P.K; x.fillRect(kx, ky, kw, kh); x.fillStyle = P.w1; x.fillRect(lx, ly, lw, lh);
      });
    }
    dither(x, 7, 'K', OX, OY, GW * T, 3);
    // 색감: 가장자리 어둠 + 심장·화로의 따뜻한 빛, 소환소의 푸른 빛, 입구의 붉은 기운
    for (const [w, lv] of [[10, 6], [22, 3]]) { dither(x, lv, 'K', OX, OY, w, GH * T); dither(x, lv, 'K', OX + GW * T - w, OY, w, GH * T); dither(x, lv, 'K', OX, OY + GH * T - w, GW * T, w); }
    glow(x, C.HEART.x, C.HEART.y + 4, 58, 'o3'); glow(x, C.HEART.x, C.HEART.y, 30, 'r2');
    glow(x, C.SUMMON.x, C.SUMMON.y, 30, 'b3'); glow(x, C.ALTAR.x, C.ALTAR.y, 30, 'g3');
    for (const e of d.ents) { if (e[0] === 0) glow(x, OX + 14, tcy(e[1]), 30, 'r3'); else if (e[0] === GW - 1) glow(x, OX + GW * T - 14, tcy(e[1]), 30, 'r3'); else if (e[1] === 0) glow(x, tcx(e[0]), OY + 14, 30, 'r3'); else glow(x, tcx(e[0]), OY + GH * T - 16, 34, 'r3'); }
    for (const [cx, cy] of C.PLOTS) x.drawImage(DD.frame('t_platform', 0, 0), tcx(cx) - 14, tcy(cy) - 13);
    for (const sx of [0, GW - 1]) DD.blit(x, 't_standard', 0, tcx(sx), tcy(0) + 12);
    bgCache[d.i] = { k, c };
    return c;
  }
  function animFrame(e, TT, n) {
    if (n < 6) return 0;
    const an = n >= 10 && e.k === 'u' ? 4 : 3;
    if (e.atkT > 0) return 6 + Math.min(an - 1, ((1 - e.atkT / 0.3) * an) | 0);
    if (e.mv) return 2 + (((TT * 8 + e.id) | 0) % 4);
    return ((TT * 2 + e.id * 0.37) | 0) % 2;
  }
  function spr(x, e, id, TT, flash) {
    const n = DD.frames(id).length, X = Math.round(e.x), Y = Math.round(e.y);
    const big = e.k === 'u' && e.def.legend, fly = e.k === 'd' && e.def.fly, lift = fly ? 8 : 0;
    shadow(x, X, Y, e.r > 8 || big ? 22 : fly ? 8 : 12);
    let c;
    if (big || fly) { // 전설 유닛은 크게, 비행 악마는 띄워서 다른 색으로
      c = DD.blit(x, id, animFrame(e, TT, n), X, Y + 3 - lift, e.face < 0, flash && e.hit > 0.06);
      if (big) { x.fillStyle = P.g1; x.fillRect(X - 1, Y - c.height - 3 - (((TT * 3) | 0) & 1), 3, 2); }
      c = { height: c.height + lift };
    } else c = DD.blit(x, id, animFrame(e, TT, n), X, Y + 3, e.face < 0, flash && e.hit > 0.06);
    if (e.hp < e.mhp || e.hero) bar(x, X - 6, Y - c.height, 12, e.hp / e.mhp, e.k === 'd' ? 'r2' : e.hero ? 'g1' : 'n2');
  }
  DD.draw = function (ctx, G, d, ui) {
    const TT = G.t + (ui.clock || 0), flash = ui.flash !== false;
    ctx.imageSmoothingEnabled = false;
    // 길 편집 중에는 초안 격자를 보여 준다
    const gd = ui.draft ? Object.assign(Object.create(d), { grid: ui.draft.grid, ver: 'draft' + ui.draft.ver, path: ui.draft.path, paths: ui.draft.paths }) : d;
    ctx.drawImage(bg(G, gd), 0, 0);
    DD.blit(ctx, 'f_summon', ((TT * 5) | 0) % 4, C.SUMMON.x, C.SUMMON.y + 12);
    DD.blit(ctx, 'f_altar', ((TT * 6) | 0) % 4, C.ALTAR.x, C.ALTAR.y + 12);
    if (d.heroT <= 0) { const fr = ((TT * 4) | 0) % 4; dotted(ctx, C.ALTAR.x, C.ALTAR.y, 13 + fr, 'g1', 20); }
    for (const sx of [-1, 1]) { DD.blit(ctx, 't_brazier', 0, C.HEART.x + sx * 22, C.HEART.y + 10); const f = ((TT * 8 + sx) | 0) % 3; ctx.fillStyle = P.g1; ctx.fillRect(C.HEART.x + sx * 22 - (f === 2 ? 1 : 0), C.HEART.y - 9 - (f === 1 ? 1 : 0), 1, 2); }
    { const low = d.heart.hp / d.heart.mhp < 0.3; dotted(ctx, C.HEART.x, C.HEART.y - 2, 17 + (((TT * 2) | 0) % 2), low ? 'r1' : 'r3', 28);
      const c = DD.blit(ctx, 'f_heart', ((TT * 4) | 0) % 4, C.HEART.x, C.HEART.y + 12, false, flash && d.heart.hit > 0.06); bar(ctx, C.HEART.x - 14, C.HEART.y + 12 - c.height - 3, 28, d.heart.hp / d.heart.mhp, 'r2'); }
    for (const e of d.ents) { const f = ((TT * 6) | 0) % 6; if (e[0] === 0) DD.blit(ctx, 'gate_s', f, OX - 8, tcy(e[1]) + 16); else if (e[0] === GW - 1) DD.blit(ctx, 'gate_s', f, OX + GW * T + 10, tcy(e[1]) + 16); else if (e[1] === 0) DD.blit(ctx, 'gate_s', f, tcx(e[0]) + 2, OY + 8); else DD.blit(ctx, 'gate_s', f, tcx(e[0]) + 2, OY + GH * T + 4); } // 악마가 나오는 게이트
    { // 다음 웨이브의 주공 입구를 미리 깜박여 알린다
      const th = G.thrust[G.wave + 1], e = th != null && d.ents[th];
      if (e && ((TT * 3) | 0) % 2) { const gx = e[0] === 0 ? OX + 12 : e[0] === GW - 1 ? OX + GW * T - 12 : tcx(e[0]), gy = e[0] === 0 || e[0] === GW - 1 ? tcy(e[1]) : e[1] === 0 ? OY + 12 : OY + GH * T - 12; dotted(ctx, gx, gy, 16, 'r1', 20); dotted(ctx, gx, gy, 20, 'g1', 24); }
    }
    // 길 위의 진행 방향 화살표(악마가 걷는 쪽으로 흐른다)
    const seenA = new Set(); // 여러 입구의 길이 겹치는 칸은 한 번만
    (gd.paths || [gd.path]).forEach((pth) => pth.forEach(([cx, cy], i) => {
      if ((i + 300 - ((TT * 3) | 0) % 3) % 3 || seenA.has(cx + cy * GW)) return; seenA.add(cx + cy * GW);
      const nx = i + 1 < pth.length ? pth[i + 1] : C.HEART_T, dx = nx[0] - cx, dy = nx[1] - cy, X = tcx(cx), Y = tcy(cy);
      ctx.fillStyle = P.w4;
      for (let k = -3; k <= 3; k++) { const a = 3 - Math.abs(k); if (dx) { ctx.fillRect(X + dx * a - 1, Y + k, 2, 1); } else { ctx.fillRect(X + k, Y + dy * a - 1, 1, 2); } }
    }));
    for (const b of d.blds) if (b.def.kind === 'trap') { // 함정은 바닥에 깔린다
      DD.blit(ctx, b.def.spr, b.def.slow ? ((TT * 3 + b.id) | 0) % 4 : b.hit > 0.2 ? 1 : b.hit > 0.1 ? 2 : b.hit > 0 ? 3 : 0, b.x, b.y + 12); // 늪은 끓고, 가시는 악마가 밟을 때 튀어나온다
      if (ui.selB === b.id) ring(ctx, Math.round(b.x), Math.round(b.y), 11, 'n1', true);
    }
    const all = d.blds.filter((b) => b.def.kind !== 'trap').concat(d.units, d.demons).sort((a, b) => (a.k === 'b' ? a.y + 8 : a.y) - (b.k === 'b' ? b.y + 8 : b.y));
    for (const e of all) {
      if (e.k === 'b') {
        const id = e.def.spr + '@' + d.race;
        const big = e.def.size === 2, fr = e.hp < e.mhp * 0.5 ? 1 : 0, wh = flash && e.hit > 0.06; let c;
        const bk = big ? 'B_' + d.race + '_' + d.R.blds.indexOf(e.def) : '';
        if (big && DD.ATLAS.frames[bk]) { c = DD.blit(ctx, bk, fr, e.x, e.y + 24, false, wh); c = { height: c.height - 11 }; } // 2×2 전용 그림
        else if (big) { ctx.save(); ctx.translate(e.x, e.y + 25); ctx.scale(2, 2); c = DD.blit(ctx, id, fr, 0, 0, false, wh); ctx.restore(); c = { height: c.height * 2 - 12 }; } // 전용 그림이 없으면 두 배로 그린다
        else c = DD.blit(ctx, id, fr, e.x, e.y + 13, false, wh);
        if (e.hp < e.mhp) bar(ctx, e.x - (big ? 14 : 8), e.y + 13 - c.height - 2, big ? 28 : 16, e.hp / e.mhp, 's2');
        if (ui.selB === e.id) { ctx.fillStyle = P.n1; (big ? [[-25, -25], [23, -25], [-25, 23], [23, 23]] : [[-13, -13], [11, -13], [-13, 11], [11, 11]]).forEach(([a1, b1]) => ctx.fillRect(e.x + a1, e.y + b1, 2, 2)); if (e.def.rng) dotted(ctx, e.x, e.y, e.def.rng, 'n1'); if (e.def.rad) dotted(ctx, e.x, e.y, e.def.rad, 'b1'); }
      } else {
        const x0 = Math.round(e.x), y0 = Math.round(e.y);
        if (e.k === 'u') {
          if (ui.sel.has(e.id)) ring(ctx, x0, y0, 8, 'n1', true);
          else if (e.hero) ring(ctx, x0, y0, 9, DD.GRADES[e.hero.grade].col, ((TT * 3) | 0) % 2 === 0);
          else if (e.own !== d.i) ring(ctx, x0, y0, 7, 's2', false);
        }
        spr(ctx, e, e.gim && DD.ATLAS.frames['d_lord_' + e.gim] ? 'd_lord_' + e.gim : e.def.spr, TT, flash); // 군주는 기믹마다 모습이 다르다
        if (e.rk) { ctx.fillStyle = P.K; ctx.fillRect(x0 - 9, y0 - 1 - e.rk * 3, 5, e.rk * 3 + 1); ctx.fillStyle = P.g1; for (let i = 0; i < e.rk; i++) ctx.fillRect(x0 - 8, y0 - 3 - i * 3, 3, 2); } // 숙련 표식
        if (e.stun > 0) { ctx.fillStyle = P.g1; const o = ((TT * 8) | 0) % 3; ctx.fillRect(x0 - 5 + o * 4, y0 - 20, 2, 2); ctx.fillRect(x0 + 3 - o * 4, y0 - 22, 2, 2); }
        if (e.fast) { ctx.fillStyle = P.g1; ctx.fillRect(x0 - 7, y0 - 16 - (((TT * 6) | 0) % 2), 1, 2); }
      }
    }
    // 집결지 깃발(소환소는 푸른색, 제단은 금색)과 선택한 시설 표시
    [[d.rallyU, 'b2'], [d.rallyH, 'g1']].forEach(([r, col]) => { if (!r) return; const X = Math.round(r.x), Y = Math.round(r.y), w = ((TT * 4) | 0) % 2;
      ctx.fillStyle = P.K; ctx.fillRect(X - 1, Y - 15, 3, 16); ctx.fillRect(X + 1, Y - 15 + w, 10, 8); ctx.fillStyle = P.w1; ctx.fillRect(X, Y - 14, 1, 14); ctx.fillStyle = P[col]; ctx.fillRect(X + 2, Y - 14 + w, 8, 6); ctx.fillStyle = P.W; ctx.fillRect(X + 4, Y - 12 + w, 3, 2); });
    if (ui.rally) { const f = ui.rally === 'H' ? C.ALTAR : C.SUMMON; dotted(ctx, f.x, f.y, 15 + (((TT * 4) | 0) % 2), 'n1', 24); if (ui.hover) { ctx.fillStyle = P.n1; const [hx, hy] = ui.hover; ctx.fillRect(hx - 3, hy, 7, 1); ctx.fillRect(hx, hy - 3, 1, 7); } }
    if (ui.ping) { const a = (performance.now() - ui.ping.r) / 400; if (a < 1) dotted(ctx, Math.round(ui.ping.x), Math.round(ui.ping.y), 3 + Math.round(a * 8), 'n1', 12); else ui.ping = null; } // 이동 지점 표시
    for (const u of d.units) if (ui.sel.has(u.id)) { ctx.fillStyle = P.n1; ctx.fillRect(Math.round(u.hx) - 1, Math.round(u.hy), 3, 1); ctx.fillRect(Math.round(u.hx), Math.round(u.hy) - 1, 1, 3); } // 고른 유닛이 지키는 자리
    for (const s of d.shots) drawShot(ctx, s);
    for (const f of d.fx) drawFx(ctx, f);
    motes(ctx, TT, G.st);
    if (ui.edit) { // 길 편집: 칸 모서리 점, 악마의 최단 경로, 커서 칸
      ctx.fillStyle = P.e2;
      for (let cy = 0; cy <= GH; cy++) for (let cx = 0; cx <= GW; cx++) ctx.fillRect(OX + cx * T, OY + cy * T, 1, 1);
      const rt = (performance.now() / 160) | 0; // 게임이 멈춰 있어도 흐르게
      gd.path.forEach(([cx, cy], i) => { ctx.fillStyle = P[(rt + i) % 4 === 0 ? 'W' : 'g2']; ctx.fillRect(tcx(cx) - 1, tcy(cy) - 1, 3, 3); });
      // 심장에 닿지 않는 길은 붉게 칠해 끊긴 곳을 보여 준다
      if (ui.draft) for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) if (ui.draft.grid[cx + cy * GW] === 1 && ui.draft.dist[cx + cy * GW] < 0) dither(ctx, 8, 'r2', OX + cx * T, OY + cy * T, T, T);
      for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) if (DD.isFixed(cx, cy)) dither(ctx, 4, 'K', OX + cx * T, OY + cy * T, T, T);
      if (ui.hover) { const [cx, cy] = ui.hover, X = OX + cx * T, Y = OY + cy * T; ctx.fillStyle = P[ui.tool === 1 ? 'g1' : ui.tool === 2 ? 's1' : 'r1']; ctx.fillRect(X, Y, T, 1); ctx.fillRect(X, Y + T - 1, T, 1); ctx.fillRect(X, Y, 1, T); ctx.fillRect(X + T - 1, Y, 1, T); }
    }
    if (ui.build >= 0 && d.R.blds[ui.build]) { // 지을 수 있는 칸을 초록으로 깔아 보여 준다(건물은 바닥, 방벽은 길 위)
      const bb = d.R.blds[ui.build];
      const okT = new Set(); // 지을 수 있는 자리가 덮는 칸을 모두 칠한다(큰 건물은 2×2)
      for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) if (!DD.buildErr(d, bb, cx, cy)) for (const [x, y] of DD.bldTiles(bb, cx, cy)) okT.add(x + y * GW);
      for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) if (okT.has(cx + cy * GW)) {
        const X = OX + cx * T, Y = OY + cy * T; dither(ctx, 4, 'n2', X + 1, Y + 1, T - 2, T - 2);
        ctx.fillStyle = P[DD.isPlot(cx, cy) ? 'g1' : 'n1']; ctx.fillRect(X + 1, Y + 1, 3, 1); ctx.fillRect(X + 1, Y + 1, 1, 3); ctx.fillRect(X + T - 4, Y + T - 2, 3, 1); ctx.fillRect(X + T - 2, Y + T - 4, 1, 3);
      }
    }
    if (ui.ghost) {
      const { cx, cy, b } = ui.ghost, ok = !DD.buildErr(d, b, cx, cy), X = OX + cx * T, Y = OY + cy * T;
      const sz = b.size === 2 ? 2 : 1, W2 = T * sz;
      if (b.kind === 'trap') DD.blit(ctx, b.spr, 0, X + 12, Y + 24);
      else if (sz === 2 && DD.ATLAS.frames['B_' + d.race + '_' + d.R.blds.indexOf(b)]) DD.blit(ctx, 'B_' + d.race + '_' + d.R.blds.indexOf(b), 0, X + 24, Y + 48);
      else if (sz === 2) { ctx.save(); ctx.translate(X + 24, Y + 49); ctx.scale(2, 2); DD.blit(ctx, b.spr + '@' + d.race, 0, 0, 0); ctx.restore(); }
      else DD.blit(ctx, b.spr + '@' + d.race, 0, X + 12, Y + 25);
      ctx.fillStyle = P[ok ? 'n1' : 'r2']; ctx.fillRect(X, Y, W2, 1); ctx.fillRect(X, Y + W2 - 1, W2, 1); ctx.fillRect(X, Y, 1, W2); ctx.fillRect(X + W2 - 1, Y, 1, W2);
      if (b.rng) dotted(ctx, X + 12, Y + 12, b.rng, 'n1'); if (b.rad) dotted(ctx, X + W2 / 2, Y + W2 / 2, b.rad, 'b1');
    }
    if (ui.box) { const b = ui.box; ctx.fillStyle = P.W; const x0 = Math.min(b.x0, b.x1) | 0, y0 = Math.min(b.y0, b.y1) | 0, w = Math.abs(b.x1 - b.x0) | 0, h = Math.abs(b.y1 - b.y0) | 0; for (let i = 0; i < w; i += 2) { ctx.fillRect(x0 + i, y0, 1, 1); ctx.fillRect(x0 + i, y0 + h, 1, 1); } for (let i = 0; i < h; i += 2) { ctx.fillRect(x0, y0 + i, 1, 1); ctx.fillRect(x0 + w, y0 + i, 1, 1); } }
    if (d.alive && d.heart.hp / d.heart.mhp < 0.3) { dither(ctx, 8, 'r2', 0, 0, C.W, 3); dither(ctx, 8, 'r2', 0, C.H - 3, C.W, 3); dither(ctx, 8, 'r2', 0, 0, 3, C.H); dither(ctx, 8, 'r2', C.W - 3, 0, 3, C.H); }
    if (!d.alive) DD.veil(ctx, 10);
    if (ui.veil > 0) DD.veil(ctx, ui.veil);
  };

  // ── 전체 지도(멀티): 가운데 게이트에서 회랑이 각 방으로. 한 칸 6px, 점 하나가 유닛 하나 ──
  const S6 = 6;
  DD.worldPick = function (G, x, y) {
    const sl = DD.worldSlots(G.dungeons.length);
    for (let i = 0; i < sl.length; i++) { const s = sl[i], w = s.k % 2 ? GH + 2 : GW + 2, h = s.k % 2 ? GW + 2 : GH + 2; if (x >= s.x0 * S6 && x < (s.x0 + w) * S6 && y >= s.y0 * S6 && y < (s.y0 + h) * S6) return i; }
    return -1;
  };
  DD.drawWorld = function (ctx, G, ui) {
    const TT = G.t, sl = DD.worldSlots(G.dungeons.length);
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < C.H; y += T) for (let x = 0; x < C.W; x += T) ctx.drawImage(DD.tile('void', 'cave'), x, y);
    const cell = (cx, cy, col) => { ctx.fillStyle = P[col]; ctx.fillRect(Math.round(cx * S6), Math.round(cy * S6), S6, S6); };
    const pts = (cor) => { const out = []; for (let i = 0; i < cor.length - 1; i++) { const [ax, ay] = cor[i], [bx, by] = cor[i + 1], n = Math.abs(bx - ax) + Math.abs(by - ay); for (let j = 0; j < n; j++) out.push([ax + Math.sign(bx - ax) * j, ay + Math.sign(by - ay) * j]); } out.push(cor[cor.length - 1]); return out; };
    G.dungeons.forEach((d, i) => {
      const s = sl[i], cor = pts(s.cor);
      for (const [cx, cy] of cor) { cell(cx, cy, 'e3'); ctx.fillStyle = P.e4; ctx.fillRect(cx * S6, cy * S6, 1, 1); }
      for (let ly = 0; ly < GH + 2; ly++) for (let lx = 0; lx < GW + 2; lx++) { // 벽 포함
        const gx = lx - 1, gy = ly - 1, inside = gx >= 0 && gy >= 0 && gx < GW && gy < GH;
        const v = inside ? d.grid[gx + gy * GW] : DD.entOutside(d.ents, gx, gy) ? 1 : 2;
        const [wx, wy] = DD.worldCell(s, lx + 0.5, ly + 0.5).map((q) => Math.floor(q));
        cell(wx, wy, v === 1 ? 'e3' : v === 2 ? 'e2' : 'e4');
        if (v === 2) { ctx.fillStyle = P.e1; ctx.fillRect(wx * S6, wy * S6, S6, 1); ctx.fillStyle = P.e3; ctx.fillRect(wx * S6, wy * S6 + S6 - 1, S6, 1); }
        else if (inside && DD.isPlot(gx, gy)) { ctx.fillStyle = P.p3; ctx.fillRect(wx * S6 + 1, wy * S6 + 1, S6 - 2, S6 - 2); }
      }
      const tp = (x, y) => DD.worldCell(s, (x - OX) / T + 1, (y - OY) / T + 1).map((q) => Math.round(q * S6));
      const dot = (x, y, col, sz) => { const [X, Y] = tp(x, y); ctx.fillStyle = P.K; ctx.fillRect(X - (sz >> 1) - 1, Y - (sz >> 1) - 1, sz + 2, sz + 2); ctx.fillStyle = P[col]; ctx.fillRect(X - (sz >> 1), Y - (sz >> 1), sz, sz); };
      if (d.alive) {
        for (const q of d.queue) { const k = (q.at - G.t) / 10; if (k < 1 && k >= 0) { const c = cor[Math.min(cor.length - 1, ((1 - k) * cor.length) | 0)]; ctx.fillStyle = P.r1; const z = q.t === 'boss' ? 4 : 2; ctx.fillRect(c[0] * S6 + 2 + ((q.at * 7) % 3 | 0) - 1, c[1] * S6 + 2 + ((q.at * 13) % 3 | 0) - 1, z, z); } }
        for (const b of d.blds) dot(b.x, b.y, 's1', 3);
        for (const u of d.units) dot(u.x, u.y, u.hero ? 'g1' : G.dungeons[u.own].R.color, 2);
        for (const e of d.demons) dot(e.x, e.y, 'r1', e.r > 8 ? 4 : 2);
      }
      const [hx, hy] = tp(C.HEART.x, C.HEART.y);
      ctx.fillStyle = P.K; ctx.fillRect(hx - 4, hy - 4, 8, 8); ctx.fillStyle = P[d.alive ? 'r2' : 'e3']; ctx.fillRect(hx - 3, hy - 3, 6, 6); if (d.alive) { ctx.fillStyle = P.r1; ctx.fillRect(hx - 3, hy - 3, 2, 2); }
      const w = s.k % 2 ? GH + 2 : GW + 2, h = s.k % 2 ? GW + 2 : GH + 2, X0 = s.x0 * S6, Y0 = s.y0 * S6;
      if (d.alive) bar(ctx, X0 + w * 3 - 12, Y0 + h * S6 - 4, 24, d.heart.hp / d.heart.mhp, 'r2'); else dither(ctx, 10, 'K', X0, Y0, w * S6, h * S6);
      num(ctx, String(i + 1), X0 + 5, Y0 + 2, i === G.human ? 'n1' : 'W');
      if (i === ui.view) { ctx.fillStyle = P[i === G.human ? 'n1' : 'W']; for (let a = 0; a < w * S6; a += 3) { ctx.fillRect(X0 + a, Y0 - 2, 1, 1); ctx.fillRect(X0 + a, Y0 + h * S6 + 1, 1, 1); } for (let a = 0; a < h * S6; a += 3) { ctx.fillRect(X0 - 2, Y0 + a, 1, 1); ctx.fillRect(X0 + w * S6 + 1, Y0 + a, 1, 1); } }
    });
    glow(ctx, (C.W >> 1) - 3, (C.H >> 1) + 3, 46, 'r3');
    DD.blit(ctx, 'gate', ((TT * 6) | 0) % 6, (C.W >> 1) - 3, (C.H >> 1) + 34);
    if (ui.veil > 0) DD.veil(ctx, ui.veil);
  };
})();
