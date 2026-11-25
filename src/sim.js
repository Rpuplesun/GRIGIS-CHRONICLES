// 시뮬레이션 (DOM 없음, Node에서도 실행). 모든 플레이어 조작은 game.cmd(dungeonIdx, {...}) 한 곳으로 들어온다.
(function (g) {
  const DD = (g.DD = g.DD || {});
  const C = DD.C, T = C.TILE, GW = C.GW, GH = C.GH;
  const DT = 0.05;
  DD.DT = DT;
  // 배치(심장·소환소·제단 자리)는 판마다 정한다. 한 번에 한 판만 돌기 때문에 공용 상수를 바꿔 쓴다
  DD.setLayout = function (name) {
    const l = DD.LAYOUTS[name] || DD.LAYOUTS.top, px = (t) => ({ x: C.OX + t[0] * T + 12, y: C.OY + t[1] * T + 12 });
    C.LAYOUT = DD.LAYOUTS[name] ? name : 'top'; C.HEART_T = l.heart; C.SUMMON_T = l.summon; C.ALTAR_T = l.altar;
    const p2 = (t) => ({ x: C.OX + t[0] * T + T, y: C.OY + t[1] * T + T }); // 2×2의 한가운데
    C.HEART = px(l.heart); C.SUMMON = p2(l.summon); C.ALTAR = p2(l.altar);
    // 시설이 차지하는 칸: 심장 3×3, 소환소·제단 2×2. FAC[칸 번호] = 'h' | 'u' | 'a'
    C.FAC = {}; const put = (x, y, k) => { C.FAC[x + y * C.GW] = k; };
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(l.heart[0] + dx, l.heart[1] + dy, 'h');
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { put(l.summon[0] + dx, l.summon[1] + dy, 'u'); put(l.altar[0] + dx, l.altar[1] + dy, 'a'); }
  };
  DD.setLayout('top');

  function rng(seed) {
    let a = seed >>> 0;
    const fn = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    fn.state = () => a >>> 0;
    return fn;
  }
  const d2 = (a, b) => { const x = a.x - b.x, y = a.y - b.y; return x * x + y * y; };
  const key = (cx, cy) => cx + cy * GW;
  const inG = (cx, cy) => cx >= 0 && cy >= 0 && cx < GW && cy < GH;
  const is = (t, cx, cy) => t[0] === cx && t[1] === cy;
  const tcx = (cx) => C.OX + cx * T + 12, tcy = (cy) => C.OY + cy * T + 12;
  const tx = (x) => Math.floor((x - C.OX) / T), ty = (y) => Math.floor((y - C.OY) / T);
  DD.tileAt = (x, y) => [tx(x), ty(y)];
  DD.isPlot = (cx, cy) => C.PLOTS.some((p) => is(p, cx, cy));
  DD.isLandmark = (cx, cy) => (C.LANDMARKS || []).some((p) => is(p, cx, cy));
  // 고정 칸: 심장·소환소·제단·거점·지형거점은 길이나 벽으로 바꿀 수 없다. 입구 칸은 언제나 길이다.
  DD.facAt = (cx, cy) => (cx >= 0 && cy >= 0 && cx < GW && cy < GH ? C.FAC[cx + cy * GW] || null : null); // 그 칸의 시설('h' 심장, 'u' 소환소, 'a' 제단)
  DD.isFixed = (cx, cy) => !!DD.facAt(cx, cy) || DD.isPlot(cx, cy) || DD.isLandmark(cx, cy);
  const NB = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  // ── 던전 격자: 0 바닥(건물 자리), 1 길(악마가 걷는 칸), 2 벽(통과·사격 불가) ──
  // 기본 길: 입구에서 심장까지 곧게. 길을 늘이는 것은 사령관의 몫이다
  DD.defaultGrid = function (nEnt) {
    const gr = new Uint8Array(GW * GH), mx = C.ENT_T[0], hy = C.HEART_T[1], my = GH >> 1;
    const row = (y, a, b) => { for (let x = a; x <= b; x++) gr[key(x, y)] = 1; }, col = (x, a, b) => { for (let y = a; y <= b; y++) gr[key(x, y)] = 1; };
    col(mx, hy + 2, GH - 1);
    if (C.LAYOUT === 'center') {
      if (nEnt >= 2) col(mx, 0, hy - 2);
      if (nEnt >= 3) { row(my, 0, 6); col(6, my, my + 2); row(my + 2, 6, mx); }
      if (nEnt >= 4) { row(my, GW - 7, GW - 1); col(GW - 7, my, my + 2); row(my + 2, mx, GW - 7); }
    } else { if (nEnt >= 2) row(my, 0, mx); if (nEnt >= 3) row(my, mx, GW - 1); }
    return gr;
  };
  // AI 동맹이 쓰는 미리 짜 둔 길
  DD.botGrid = function (nEnt) {
    const gr = new Uint8Array(GW * GH);
    if (C.LAYOUT === 'center') { // 심장이 가운데: 아래 입구는 오른쪽으로, 위 입구는 왼쪽으로 한 번 돌아 들어온다
      const mx = C.ENT_T[0], hy = C.HEART_T[1], row = (y, a, b) => { for (let x = a; x <= b; x++) gr[key(x, y)] = 1; }, col = (x, a, b) => { for (let y = a; y <= b; y++) gr[key(x, y)] = 1; };
      col(mx, GH - 2, GH - 1); row(GH - 2, mx, GW - 5); col(GW - 5, GH - 4, GH - 2); row(GH - 4, 8, GW - 5); col(8, hy + 3, GH - 4); row(hy + 3, 8, mx); col(mx, hy + 2, hy + 3);
      if (nEnt >= 2) { col(mx, 0, 1); row(1, 4, mx); col(4, 1, 3); row(3, 4, GW - 9); col(GW - 9, 3, 5); row(5, mx, GW - 9); col(mx, 5, hy - 2); }
      if (nEnt >= 3) { row(hy, 0, 4); col(4, 3, hy); }
      if (nEnt >= 4) { row(hy, GW - 5, GW - 1); col(GW - 5, hy, GH - 4); }
      return gr;
    }
    // 기본 길은 ㄹ 모양: 입구(아래 가운데) → 왼쪽 → 위 → 오른쪽으로 가로질러 → 위 → 심장(위 가운데)
    const mx = C.ENT_T[0], L = 3, R = GW - 4, row = (y, a, b) => { for (let x = a; x <= b; x++) gr[key(x, y)] = 1; }, col = (x, a, b) => { for (let y = a; y <= b; y++) gr[key(x, y)] = 1; };
    col(mx, GH - 2, GH - 1); row(GH - 3, L, mx); col(L, GH >> 1, GH - 3); row(GH >> 1, L, R); col(R, 3, GH >> 1); row(3, mx, R); // 심장(3×3) 바로 아래 칸에서 끝난다
    if (nEnt >= 2) row(GH >> 1, 0, L); // 왼쪽 입구는 가운데 가로길에 붙는다
    if (nEnt >= 3) { row(GH >> 1, GW - 2, GW - 1); col(GW - 2, GH >> 1, GH - 3); row(GH - 3, mx, GW - 2); } // 오른쪽 입구는 아래로 돌아 아래 입구 길에 합류한다
    return gr;
  };
  function flow(gr) { // 심장에서 길을 따라 퍼지는 거리. -1은 심장에 닿지 않는 칸
    const dist = new Int16Array(GW * GH).fill(-1), q = [];
    for (const k in C.FAC) if (C.FAC[k] === 'h') { dist[k] = 0; q.push([k % GW, (k / GW) | 0]); } // 심장의 아홉 칸 모두에서 퍼진다
    for (let i = 0; i < q.length; i++) {
      const [cx, cy] = q[i], dv = dist[key(cx, cy)];
      for (const [dx, dy] of NB) { const nx = cx + dx, ny = cy + dy; if (inG(nx, ny) && gr[key(nx, ny)] === 1 && dist[key(nx, ny)] < 0) { dist[key(nx, ny)] = dv + 1; q.push([nx, ny]); } }
    }
    return dist;
  }
  DD.gridCount = (gr) => { let r = 0, w = 0; for (const v of gr) { if (v === 1) r++; else if (v === 2) w++; } return { road: r, wall: w }; };
  // 입구 바깥 칸인가(아래 입구의 아래쪽, 좌우 입구의 바깥쪽). 악마가 들어오는 통로로 그리고 걷는다
  DD.entOutside = (ents, cx, cy) => ents.some((e) => (e[0] === 0 ? cx < 0 && cy === e[1] : e[0] === GW - 1 ? cx >= GW && cy === e[1] : e[1] === 0 ? cx === e[0] && cy < 0 : cx === e[0] && cy >= GH));
  DD.gridCheck = function (gr, ents, caps) { // 규칙 위반 사유 또는 null. caps: { roadCap, wallCap }
    const rc = caps && caps.roadCap ? caps.roadCap : C.ROAD_MAX, wc = caps && caps.wallCap != null ? caps.wallCap : C.WALL_MAX;
    ents = ents || [C.ENT_T];
    if (gr.length !== GW * GH) return '격자 크기가 다릅니다';
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) if (DD.isFixed(cx, cy) && gr[key(cx, cy)]) return '바꿀 수 없는 칸';
    for (const e of ents) if (gr[key(e[0], e[1])] !== 1) return '입구는 길이어야 한다';
    const n = DD.gridCount(gr);
    if (n.road > rc) return `길 타일 한도 초과 (${rc})`;
    if (n.wall > wc) return `벽 타일 한도 초과 (${wc})`;
    const fl = flow(gr); for (const e of ents) if (fl[key(e[0], e[1])] < 0) return '입구와 심장은 이어져 있어야 합니다.';
    return null;
  };
  function pathOf(dist, ent) { // 입구에서 심장까지의 최단 경로(끊겨 있으면 빈 배열)
    const path = []; let [cx, cy] = ent || C.ENT_T;
    while (dist[key(cx, cy)] > 0) {
      path.push([cx, cy]);
      const dv = dist[key(cx, cy)]; let nx = -1, ny = -1;
      for (const [dx, dy] of NB) { const ax = cx + dx, ay = cy + dy; if (inG(ax, ay) && dist[key(ax, ay)] === dv - 1) { nx = ax; ny = ay; break; } }
      cx = nx; cy = ny;
    }
    return path;
  }
  DD.gridPath = (gr, ents) => { const dist = flow(gr), paths = (ents || [C.ENT_T]).map((e) => pathOf(dist, e)); return { dist, path: paths[0], paths }; }; // 편집 초안 미리보기용
  // 진행 중인 요새에 격자 전체를 적용할 수 있는가. 사유 또는 null
  DD.gridErr = function (d, gr) {
    const e0 = DD.gridCheck(gr, d.ents, d); if (e0) return e0;
    for (const b of d.blds) if (DD.bldTiles(b.def, b.cx, b.cy).some(([x, y]) => gr[key(x, y)] !== (b.def.kind === 'wall' || b.def.kind === 'trap' ? 1 : 0))) return '건물 아래 칸은 바꿀 수 없습니다';
    const nd = flow(gr);
    for (const e of d.demons) { const ex = tx(e.x), ey = ty(e.y); if (inG(ex, ey) && nd[key(ex, ey)] < 0) return '악마가 서 있는 길도 심장과 이어져 있어야 합니다'; }
    return null;
  };
  DD.calcBeams = function (d, grid, extra) {
    const out = [];
    if (d.race !== 'spirit') return out;
    const gr = grid || d.grid;
    const isNode = (cx, cy) => {
      if (!inG(cx, cy)) return false;
      if (extra && cx === extra[0] && cy === extra[1]) return true;
      if (gr[key(cx, cy)] === 2) return true;
      const b = d.occ[key(cx, cy)];
      return !!(b && (b.def.kind === 'tower' || b.def.kind === 'wall'));
    };
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
      if (!isNode(cx, cy)) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        for (let step = 2; step <= 4; step++) {
          const nx = cx + dx * step, ny = cy + dy * step;
          if (!inG(nx, ny)) break;
          if (isNode(nx, ny)) {
            const tiles = []; let ok = true;
            for (let s = 1; s < step; s++) { const mx = cx + dx * s, my = cy + dy * s; if (gr[key(mx, my)] !== 1) { ok = false; break; } tiles.push([mx, my]); }
            if (ok && tiles.length) out.push({ x1: tcx(cx), y1: tcy(cy), x2: tcx(nx), y2: tcy(ny), tiles });
            break;
          }
          if (gr[key(nx, ny)] !== 1) break;
        }
      }
    }
    return out;
  };
  function recomputeBeams(d) { d.beams = DD.calcBeams(d, d.grid); }
  function applyGrid(d, gr) {
    d.grid = gr; d.dist = flow(gr); d.ver++;
    d.paths = d.ents.map((e) => pathOf(d.dist, e)); const path = d.paths[0];
    d.path = path;
    d.maxPath = Math.max(d.maxPath || 0, path.length);
    d.corners = new Uint8Array(GW * GH);
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
      if (gr[key(cx, cy)] !== 1) continue;
      const r = (ax, ay) => inG(ax, ay) && gr[key(ax, ay)] === 1;
      if ((r(cx - 1, cy) || r(cx + 1, cy)) && (r(cx, cy - 1) || r(cx, cy + 1))) d.corners[key(cx, cy)] = 1;
    }
    recomputeBeams(d);
    d.maxBeams = Math.max(d.maxBeams || 0, (d.beams || []).length);
    // 기본 배치: 근접은 길 중간 두 칸, 원거리는 바로 뒤(심장 쪽) 세 칸(칸마다 여섯 자리)
    // 입구가 여럿이면 모든 길이 합쳐진 뒤의 칸에 세운다(어느 입구로 와도 지나가게)
    const sets = d.paths.slice(1).map((p) => new Set(p.map((c) => key(c[0], c[1])))), mi = path.findIndex((c) => sets.every((st) => st.has(key(c[0], c[1]))));
    const L = path.length, a = Math.max(0, Math.min(L - 2, Math.max(Math.floor(L * 0.45), mi)));
    d.sm = path.slice(a, a + 2); d.sr = path.slice(a + 2, a + 5).length ? path.slice(a + 2, a + 5) : d.sm;
    if (mi < 0 && d.paths.length > 1) { // 길이 심장에서야 만난다(심장이 가운데): 길마다 심장 앞에 나눠 세운다
      const at = (p, k) => p[Math.max(0, p.length - k)]; d.sm = d.paths.filter((p) => p.length).map((p) => at(p, 2)); d.sr = d.paths.filter((p) => p.length).map((p) => at(p, 1)); // 심장 바로 앞: 서로 가까워서 다른 길도 거든다
      if (!d.sm.length) { d.sm = path.slice(a, a + 2); d.sr = d.sm; }
    }
  }
  // 저장된 청사진(blueprint)을 현재 길·벽 한도 안에서 최대한 이어 붙인다
  DD.blueprintApply = function (d, curGrid) {
    const bp = d.blueprint; if (!bp) return null;
    if (!DD.gridErr(d, bp)) {
      let diff = 0; for (let i = 0; i < bp.length; i++) if (bp[i] !== curGrid[i]) diff++;
      return { grid: Uint8Array.from(bp), added: diff };
    }
    const ng = Uint8Array.from(curGrid); let added = 0;
    const cnt = () => DD.gridCount(ng);
    // 청사진의 길(1)을 현재 길과 맞닿은 칸부터 BFS로 확장한다
    const q = [], seen = new Uint8Array(GW * GH);
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
      if (ng[key(cx, cy)] === 1) { seen[key(cx, cy)] = 1; q.push([cx, cy]); }
    }
    for (let i = 0; i < q.length; i++) {
      const [cx, cy] = q[i];
      for (const [dx, dy] of NB) {
        const ax = cx + dx, ay = cy + dy; if (!inG(ax, ay)) continue;
        const k = key(ax, ay); if (seen[k]) continue; seen[k] = 1;
        if (bp[k] !== 1) continue;
        if (ng[k] === 0 && !DD.isFixed(ax, ay) && !d.occ[k] && cnt().road < d.roadCap) {
          ng[k] = 1;
          if (DD.gridErr(d, ng)) ng[k] = 0;
          else { added++; q.push([ax, ay]); }
        } else if (ng[k] === 1) q.push([ax, ay]);
      }
    }
    // 남은 벽 한도 안에서 청사진의 벽(2)을 세운다
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
      if (cnt().wall >= d.wallCap) break;
      const k = key(cx, cy);
      if (bp[k] === 2 && ng[k] === 0 && !DD.isFixed(cx, cy) && !d.occ[k] && !d.units.some((u) => tx(u.x) === cx && ty(u.y) === cy)) {
        ng[k] = 2;
        if (DD.gridErr(d, ng)) ng[k] = 0;
        else added++;
      }
    }
    return { grid: ng, added };
  };
  function los(d, a, b) { // 벽이 사격을 막는가
    if (!d.walls) return true;
    const dx = b.x - a.x, dy = b.y - a.y, n = Math.ceil(Math.hypot(dx, dy) / 8);
    for (let i = 1; i < n; i++) { const cx = tx(a.x + (dx * i) / n), cy = ty(a.y + (dy * i) / n); if (inG(cx, cy) && d.grid[key(cx, cy)] === 2) return false; }
    return true;
  }

  // 전체 지도(6px 칸, 116×80칸)에서 던전의 자리. k: 방 회전(0 입구가 아래, 1 오른쪽, 2 위, 3 왼쪽), cor: 게이트→입구 회랑
  const SLOT = {
    N: { x0: 44, y0: 0, k: 0, cor: [[58, 34], [58, 20]] }, E: { x0: 92, y0: 25, k: 3, cor: [[64, 40], [91, 40]] },
    S: { x0: 44, y0: 60, k: 2, cor: [[58, 46], [58, 59]] }, W: { x0: 4, y0: 25, k: 1, cor: [[52, 40], [24, 40]] },
    SE: { x0: 75, y0: 60, k: 2, cor: [[58, 46], [58, 57], [89, 57], [89, 59]] }, SW: { x0: 12, y0: 60, k: 2, cor: [[58, 46], [58, 57], [26, 57], [26, 59]] },
  };
  DD.worldSlots = (n) => ({ 1: ['N'], 2: ['N', 'S'], 3: ['N', 'E', 'W'], 4: ['N', 'E', 'S', 'W'], 5: ['N', 'E', 'SE', 'SW', 'W'] }[n].map((s) => SLOT[s]));
  // 방 안 칸 좌표(벽 포함, 실수 가능) → 전체 지도 칸 좌표
  DD.worldCell = (s, lx, ly) => (s.k === 0 ? [s.x0 + lx, s.y0 + ly] : s.k === 2 ? [s.x0 + GW + 2 - lx, s.y0 + GH + 2 - ly] : s.k === 1 ? [s.x0 + ly, s.y0 + lx] : [s.x0 + GH + 2 - ly, s.y0 + lx]);

  DD.newGame = function (opt) {
    const st = DD.stageOf(opt.players[Math.max(0, opt.players.findIndex((p) => !p.bot))].race, opt.stage || 0);
    const oaths = opt.tutorial ? [] : (opt.oaths || []).filter((id) => DD.OATHS.some((o) => o.id === id) && (id !== 'wildhaz' || DD.HAZ[st.id])).slice(0, 3);
    const hasOath = (id) => oaths.includes(id);
    const G = {
      t: 0, wave: 0, over: false, win: false, stage: opt.stage || 0, tutorial: !!opt.tutorial, diff: opt.tutorial || opt.diff == null ? 1 : opt.diff, muts: {}, muts2: {}, thrust: {}, endless: !!opt.endless && !opt.tutorial, hz: null,
      oaths, hasOath, medals: 0, st,
      rnd: rng(opt.seed || 1), nid: 1, dungeons: [], events: [], human: opt.players.findIndex((p) => !p.bot),
    };
    const hazFirst = hasOath('wildhaz') ? Math.round(DD.HAZ_T.first * 0.5) : DD.HAZ_T.first;
    G.haz = DD.HAZ[G.st.id] && !G.tutorial ? { next: hazFirst, left: 0, warned: false } : null;
    G.hazWarn = null;
    G.D = DD.DIFFS[G.diff]; G.nEnt = DD.entCount(G.stage, G.diff, G.tutorial, hasOath('extraent')); G.layout = DD.layoutOf(G.stage, G.tutorial); DD.setLayout(G.layout);
    C.LANDMARKS = !G.tutorial && DD.LANDMARKS[G.st.id] ? DD.LANDMARKS[G.st.id].pos : [];
    if (!G.tutorial) { const ks = Object.keys(DD.MUTS); for (let w = 3; w < C.WAVES; w++) if (w % 5 && G.rnd() < 0.4) G.muts[w] = ks[Math.floor(G.rnd() * ks.length)]; }
    if (G.nEnt > 1) for (let w = 1; w <= C.WAVES; w++) G.thrust[w] = Math.floor(G.rnd() * G.nEnt);
    G.dungeons = opt.players.map((p, i) => mkDungeon(G, i, p));
    G.step = () => step(G);
    G.cmd = (di, c) => cmd(G, G.dungeons[di], c);
    G.endT = C.FIRST_WAVE + C.WAVES * C.WAVE_T;
    G.nextWaveIn = () => (!G.endless && G.wave >= C.WAVES ? G.endT - G.t : C.FIRST_WAVE + G.wave * C.WAVE_T - G.t);
    return G;
  };

  // 길·벽 타일 한도: 곧은 길 + 12칸에서 시작해 웨이브마다 길 6칸, 벽 2칸씩 는다(AI 동맹은 처음부터 다 쓴다)
  function setCaps(G, d) {
    d.roadCap = (d.bot ? C.ROAD_MAX : Math.min(C.ROAD_MAX, d.roadCap0 + 6 * G.wave)) + (d.roadBonus || 0);
    d.wallCap = (d.bot ? C.WALL_MAX : Math.min(C.WALL_MAX, 6 + 2 * G.wave)) + (d.wallBonus || 0);
  }
  function mkDungeon(G, i, p) {
    const R = DD.RACES[p.race], m = p.meta || {}, sm = G.st.mods[p.race] || {}, doc = p.doctrine || 0;
    const allyRace = !G.tutorial && p.ally && DD.RACES[p.ally] && p.ally !== p.race ? p.ally : null;
    const noWall = G.hasOath('nowall'), extraEnt = G.hasOath('extraent'), fragile = G.hasOath('fragile');
    const d = {
      i, race: p.race, R, bot: !!p.bot, alive: true, doc, allyRace, allyCd: allyRace ? DD.ALLY_FIRST : 0, sosCd: 0, noWall,
      gold: 110 + 30 * (m.sGold || 0) + (p.bonusGold || 0), mat: 0, kills: 0,
      units: [], blds: [], demons: [], shots: [], fx: [], snd: {}, queue: [], occ: {}, bc: {}, ver: 0, walls: 0, zones: [], beams: [],
      up: { atk: 0, hp: 0, bld: 0 }, rallyU: null, rallyH: null, altarLv: 1, heroN: 0, nSum: 0, nBld: 0, share: 1, slot: 0, botT: 0, wavesCleared: 0, lost: 0, skillT: 0, nMerge: 0, nLegend: 0, nRank2: 0, bossKills: 0, eliteKills: 0, trapKills: 0, nMission: 0, nCall: 0, mission: null,
      maxUnits: 0, maxBeams: 0, maxDefBlds: 0, ambushHits: 0, maxPath: 0,
      heartE: 0, invulnBldT: 0, eventPick: null, usedEvents: [], chronicle: [], nextWaveMod: null, mvp: null, roadBonus: 0, wallBonus: 0, helpedByHuman: false, pushN: 0, pulseN: 0, specIds: [],
      pop: C.POP + (p.race === 'beast' ? 10 : 0) + (p.race === 'beast' && doc === 1 ? 12 : 0) + (allyRace === 'beast' ? 4 : 0),
      boons: [], boonPick: null, blueprint: null,
      stats: { units: 0, towers: 0, traps: 0, heroes: 0, top: {} },
      codex: { demons: {}, bosses: {}, heroes: {}, legends: {} },
      mod: {
        atk: (sm.atk || 1) * (1 + 0.05 * (m.uAtk || 0)) * (allyRace === 'dragon' ? 1.06 : 1),
        hp: (sm.hp || 1) * (1 + 0.05 * (m.uHp || 0)) * (p.race === 'dragon' && doc === 2 ? 1.15 : 1),
        spd: (sm.spd || 1) * (allyRace === 'beast' ? 1.08 : 1),
        bhp: (1 + 0.08 * (m.bHp || 0)) * (p.race === 'human' ? 1.2 : 1) * (p.race === 'human' && doc === 1 ? 1.15 : 1) * (allyRace === 'human' ? 1.1 : 1),
        gold: (1 + 0.05 * (m.gold || 0)) * (extraEnt ? 1.15 : 1), hcd: 1 - 0.04 * (m.hCd || 0),
        bcost: p.race === 'human' ? 0.8 : 1,
        tatk: (p.race === 'human' && doc === 1 ? 1.15 : p.race === 'merfolk' && doc === 2 ? 1.15 : p.race === 'spirit' && doc === 1 ? 1.1 : 1) * (noWall ? 1.15 : 1),
        trng: p.race === 'spirit' && doc === 1 ? 1.15 : 1,
        splashMul: p.race === 'dragon' && doc === 1 ? 1.3 : 1,
        burnMul: p.race === 'dragon' && doc === 1 ? 1.5 : 1,
        matMul: p.race === 'spirit' && doc === 1 ? 1.4 : 1,
        healMul: p.race === 'merfolk' && doc === 1 ? 1.4 : 1,
        pierce: p.race === 'merfolk' && doc === 2 ? 0.25 : 0,
        allyRegen: allyRace === 'merfolk' ? 0.015 : 0,
        mergeMul: 1,
      },
    };
    d.heroT = DD.HERO_CD.first * d.mod.hcd;
    const hh = Math.round(1000 * (1 + 0.08 * (m.bHp || 0)) * (fragile ? 0.6 : 1));
    d.heart = { k: 'h', x: C.HEART.x, y: C.HEART.y, hp: hh, mhp: hh, r: 38, hit: 0 };
    d.ents = DD.entsFor(G.nEnt, G.layout);
    const straight = DD.defaultGrid(G.nEnt); d.roadCap0 = DD.gridCount(straight).road + 12; setCaps(G, d);
    let gr = p.bot ? DD.botGrid(G.nEnt) : straight;
    if (p.layout) {
      const u = Uint8Array.from(p.layout);
      if (u.length === GW * GH) {
        d.blueprint = u;
        if (!DD.gridCheck(u, d.ents, d)) gr = u;
      }
    }
    applyGrid(d, gr); d.walls = DD.gridCount(gr).wall;
    return d;
  }

  // ── 비용·조건 ──
  DD.unitCost = (d, u) => {
    let k = 1;
    if (d.race === 'beast' && d.doc === 1 && u.tier === 1) k *= 0.75;
    return { g: Math.round(u.g * k), m: Math.round(u.m * k) };
  };
  DD.bldCost = (d, b) => ({ g: Math.round(b.g * d.mod.bcost), m: Math.round(b.m * d.mod.bcost) });
  DD.upCost = (d, k) => {
    if (k === 'altar') { const a = DD.ALTAR[d.altarLv]; return a ? { g: a.g, m: a.m } : null; }
    const u = DD.UPGRADES[k], l = d.up[k];
    return l >= u.max ? null : { g: u.g * (l + 1), m: u.m * (l + 1) };
  };
  DD.reqFail = function (d, u) { // 조건 미달 사유(문자열) 또는 null
    const r = u.req; if (!r) return null;
    const bn = (id) => d.R.blds.find((b) => b.id === id).name;
    if (r.b && !d.bc[r.b]) return bn(r.b) + ' 필요';
    if (r.cnt && (d.bc[r.cnt[0]] || 0) < r.cnt[1]) return bn(r.cnt[0]) + ' ' + r.cnt[1] + '개 필요';
    if (r.kills && d.kills < r.kills) return '누적 처치 ' + d.kills + '/' + r.kills;
    const cnt = (ui) => d.units.filter((x) => x.def === d.R.units[ui] && x.own === d.i).length;
    if (r.alive && cnt(r.alive[0]) < r.alive[1]) return d.R.units[r.alive[0]].name + ' ' + r.alive[1] + '기 생존 필요';
    if (r.eat && cnt(r.eat[0]) < r.eat[1]) return d.R.units[r.eat[0]].name + ' ' + r.eat[1] + '기 필요(융합)';
    return null;
  };
  // 건설 불가 사유 또는 null. 방벽(바리케이드)은 길 위에만, 나머지 건물은 바닥에만.
  // 건물이 차지하는 칸(왼쪽 위 칸 기준). 큰 건물은 2×2
  DD.bldTiles = (b, cx, cy) => (b.size === 2 ? [[cx, cy], [cx + 1, cy], [cx, cy + 1], [cx + 1, cy + 1]] : [[cx, cy]]);
  DD.buildErr = function (d, b, cx, cy) { for (const [x, y] of DD.bldTiles(b, cx, cy)) { const e = buildErr1(d, b, x, y); if (e) return e; } return null; };
  const buildErr1 = function (d, b, cx, cy) {
    if (!inG(cx, cy) || DD.facAt(cx, cy)) return '지을 수 없는 위치';
    if (d.occ[key(cx, cy)]) return '건물이 있는 칸';
    const gv = d.grid[key(cx, cy)];
    if (b.kind === 'trap') return gv !== 1 ? '함정은 길 위에만 놓을 수 있습니다' : null;
    if (b.kind === 'wall') return d.noWall ? '무방벽 맹약 중 방벽 건설 불가' : gv !== 1 ? '방벽은 길 위에만 세울 수 있습니다' : d.ents.some((e) => is(e, cx, cy)) ? '입구는 못 막는다' : null;
    return gv === 1 ? '길 위에는 방벽만' : gv === 2 ? '벽 위에는 못 짓는다' : null;
  };
  function nearWall(d, cx, cy) {
    for (const [dx, dy] of NB) {
      const ax = cx + dx, ay = cy + dy; if (!inG(ax, ay)) continue;
      if (d.grid[key(ax, ay)] === 2) return true;
      const b = d.occ[key(ax, ay)]; if (b && b.def.kind === 'wall') return true;
    }
    return false;
  }
  DD.nearWall = nearWall;
  DD.killzoneCount = (d, cx, cy, rng) => {
    let n = 0; const r2 = rng * rng, x0 = tcx(cx), y0 = tcy(cy);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      if (d.grid[key(x, y)] === 1 && ((tcx(x) - x0) ** 2 + (tcy(y) - y0) ** 2 <= r2)) n++;
    }
    return n;
  };
  function pushDemonBack(d, e, steps) {
    if (!e || e.def.fly) return;
    let cx = tx(e.x), cy = ty(e.y);
    for (let s = 0; s < steps; s++) {
      if (!inG(cx, cy)) break;
      const dv = d.dist[key(cx, cy)];
      if (dv < 0) break;
      let bx = -1, by = -1;
      for (const [dx, dy] of NB) {
        const ax = cx + dx, ay = cy + dy;
        if (inG(ax, ay) && d.grid[key(ax, ay)] === 1 && d.dist[key(ax, ay)] === dv + 1) { bx = ax; by = ay; break; }
      }
      if (bx < 0) break;
      cx = bx; cy = by;
    }
    if (inG(cx, cy) && d.grid[key(cx, cy)] === 1) { e.x = tcx(cx); e.y = tcy(cy); e.px = e.x; e.py = e.y; e.tg = null; }
  }
  function nearLandmark(G, x, y) {
    if (!C.LANDMARKS || !C.LANDMARKS.length) return null;
    const lm = DD.LANDMARKS[G.st.id]; if (!lm) return null;
    const r2 = lm.rad * lm.rad;
    for (const [cx, cy] of C.LANDMARKS) { const dx = x - tcx(cx), dy = y - tcy(cy); if (dx * dx + dy * dy <= r2) return lm; }
    return null;
  }
  DD.landmarkAt = (G, cx, cy) => (C.LANDMARKS && DD.LANDMARKS[G.st.id] && C.LANDMARKS.some((p) => p[0] === cx && p[1] === cy) ? DD.LANDMARKS[G.st.id] : null);
  // 방어 시설 강화: 탑(공격·사거리), 방벽(체력·반사), 함정(피해·감속)을 3단계까지. 비용은 지을 때 값의 80% × 지금 단계
  DD.BLD_LV_MAX = 3;
  DD.bldUpCost = (d, b) => { if (!['tower', 'wall', 'trap'].includes(b.def.kind) || (b.lv || 1) >= DD.BLD_LV_MAX) return null; const c = DD.bldCost(d, b.def), k = 0.8 * (b.lv || 1); return { g: Math.round(c.g * k), m: Math.round(c.m * k) }; };
  const lvMul = (b) => 1 + 0.4 * ((b.lv || 1) - 1);
  // 조합 계획: 고른 유닛이 있으면 그 종류에서, 없으면 가장 낮은 등급부터 찾는다. {def, us, to} 또는 null
  const has = (u, s) => !!u.sig && u.sig.includes(s);
  const rngOf = (G, d, u) => {
    let r = has(u, 'reach') ? u.def.rng * 1.25 + 4 : u.def.rng;
    if (u.def.rng > 30) {
      if (d.race === 'human' && nearWall(d, tx(u.x), ty(u.y))) r *= 1.12;
      if (nearLandmark(G, u.x, u.y)?.id === 'watch') r *= 1.15;
    }
    return r;
  };
  function giveSig(u, s) {
    (u.sig = u.sig || []).push(s);
    if (s === 'guard') { u.mhp *= 1.3; u.hp *= 1.3; }
    const cb = DD.sigCombo(u.sig);
    if (cb && cb.id === 'harmony' && !u._harm) { u._harm = true; u.mhp *= 1.1; u.hp *= 1.1; }
  }
  // 승급에 필요한 건물이 없으면 그 사유, 있으면 null
  DD.mergeBlock = function (d, to) { const id = to.legend ? (d.R.units.find((x) => x.tier === 3).req || {}).b : to.req && to.req.b; return id && !d.bc[id] ? d.R.blds.find((b) => b.id === id).name + ' 필요' : null; };
  // 각인 계획: 고른 유닛 가운데 가장 높은 단계(같으면 처치가 많은 쪽)가 받고, 종류가 다른 가장 낮은 유닛이 사라진다
  DD.imprintPlan = function (d, ids) {
    const us = d.units.filter((u) => ids && ids.includes(u.id) && u.own === d.i && !u.hero && u.hp > 0);
    if (us.length < 2) return { err: '서로 다른 유닛 둘을 골라야 합니다' };
    us.sort((a, b) => b.def.tier - a.def.tier || b.kills - a.kills);
    const base = us[0], cap = DD.sigCap(base.def, d.doc, d.race); if ((base.sig || []).length >= cap) return { err: '각인 자리가 없습니다' };
    const mat = us.slice(1).reverse().find((u) => u.def !== base.def && !u.def.legend && !has(base, DD.sigOf(u.def)));
    if (!mat) return { err: us.some((u) => u.def !== base.def) ? '이미 가진 각인입니다' : '서로 다른 유닛 둘을 골라야 합니다' };
    return { base, mat, sig: DD.sigOf(mat.def) };
  };
  DD.mergePlan = function (d, ids) {
    const need = DD.mergeNeed(d.race), own = d.units.filter((u) => u.own === d.i && !u.hero && !u.def.legend && u.hp > 0);
    const sel = ids && ids.length ? new Set(own.filter((u) => ids.includes(u.id)).map((u) => u.def)) : null;
    for (const def of d.R.units.slice().sort((a, b) => a.tier - b.tier)) {
      if (sel && sel.size && !sel.has(def)) continue;
      const us = own.filter((u) => u.def === def); if (us.length < need) continue;
      us.sort((a, b) => (ids && ids.includes(b.id) ? 1 : 0) - (ids && ids.includes(a.id) ? 1 : 0) || a.hp - b.hp);
      const up = d.R.units.filter((x) => x.tier === def.tier + 1); // 1단계는 두 2단계 유닛 중 고른다(opts)
      return { def, us: us.slice(0, need), to: def.tier >= 3 ? d.R.legend : up.length === 1 ? up[0] : null, opts: def.tier >= 3 ? [d.R.legend] : up };
    }
    return null;
  };
  // 기본 수입(초당). 골드 수급 강화는 처치 골드와 기본 수입 모두에 붙는다
  DD.income = (d) => ({
    g: (1.2 + 1.2 * (d.bc.market || 0)) * d.mod.gold,
    m: ((d.race === 'spirit' ? 0.15 : 0) + (d.allyRace === 'spirit' ? 0.1 : 0) + 0.3 * (d.bc.crystal || 0)) * d.mod.matMul,
  });
  DD.callBonus = (G) => Math.floor(DD.canCall(G) * DD.CALL_BONUS);
  const pay = (d, c) => { if (d.gold < c.g || d.mat < c.m) return false; d.gold -= c.g; d.mat -= c.m; return true; };

  // 연출 신호: fx(그림 효과)와 snd(이번 프레임에 난 소리 종류). 규칙에는 영향이 없다.
  const fx = (d, k, x, y, TT, o) => d.fx.push(Object.assign({ k, x, y, t: TT, T: TT }, o));
  const snd = (d, k) => (d.snd[k] = 1);
  const SHOT = { human: 'arrow', beast: 'arrow', dragon: 'fire', spirit: 'orb', merfolk: 'orb' };
  function shoot(d, src, t, k, c) {
    const TT = Math.max(0.1, Math.min(0.32, Math.hypot(t.x - src.x, t.y - src.y) / 260));
    d.shots.push({ x: src.x, y: src.y - 8, tx: t.x, ty: t.y - 6, t: TT, T: TT, c, k });
  }
  const OFF = [[-7, -6], [0, -6], [7, -6], [-7, 5], [0, 5], [7, 5]];
  const RING = [[0, 0], [-12, 0], [12, 0], [0, -11], [0, 11], [-12, -11], [12, -11], [-12, 11], [12, 11], [-24, 0], [24, 0], [0, -22], [0, 22]];
  function homeSlot(d, ranged, hero) {
    const r = hero ? d.rallyH : d.rallyU;
    if (r) { const o = RING[r.n++ % RING.length]; return { x: r.x + o[0], y: r.y + o[1] }; }
    const list = ranged ? d.sr : d.sm, n = d.slot++, t = list[Math.floor(n / 6) % list.length], o = OFF[n % 6];
    return { x: tcx(t[0]) + o[0], y: tcy(t[1]) + o[1] };
  }
  function addUnit(G, d, def, hero) {
    const h = homeSlot(d, def.rng > 30, !!hero), src = hero ? C.ALTAR : C.SUMMON;
    const mhp = def.hp * d.mod.hp * (1 + 0.1 * d.up.hp);
    const u = { id: G.nid++, k: 'u', def, x: src.x + (G.rnd() - 0.5) * 16, y: src.y + 26, hx: h.x, hy: h.y, hp: mhp, mhp, cd: 0, rt: 0, tg: null, own: d.i, kills: 0, hero: hero || null, face: 1, hit: 0, r: 7 };
    d.units.push(u);
    fx(d, hero ? 'hero' : 'summon', u.x, u.y, hero ? 0.75 : 0.42, { c: hero ? DD.GRADES[hero.grade].col : d.R.color });
    snd(d, hero ? 'hero' : 'summon');
    return u;
  }
  function recount(d) {
    d.bc = {}; d.blds.forEach((b) => (d.bc[b.def.id] = (d.bc[b.def.id] || 0) + 1));
    recomputeBeams(d);
    d.maxBeams = Math.max(d.maxBeams || 0, (d.beams || []).length);
    const defCnt = d.blds.filter((b) => b.def.kind === 'tower' || b.def.kind === 'wall' || b.def.kind === 'trap').length;
    d.maxDefBlds = Math.max(d.maxDefBlds || 0, defCnt);
  }

  function cmd(G, d, c) {
    if (G.over || !d.alive) return '지금은 안 된다';
    if (c.a === 'summon') {
      const u = d.R.units[c.u], f = DD.reqFail(d, u);
      if (f) return f;
      const own = d.units.filter((x) => x.own === d.i).length - (u.req && u.req.eat ? u.req.eat[1] : 0);
      if (own >= d.pop) return '인구 한도';
      if (!pay(d, DD.unitCost(d, u))) return '자원 부족';
      if (u.req && u.req.eat) {
        let n = u.req.eat[1]; const src = d.R.units[u.req.eat[0]];
        d.units = d.units.filter((x) => !(n > 0 && x.def === src && x.own === d.i && n--));
      }
      addUnit(G, d, u); d.nSum++;
    } else if (c.a === 'build') {
      const b = d.R.blds[c.b], cost = DD.bldCost(d, b), e0 = DD.buildErr(d, b, c.cx, c.cy);
      if (e0) return e0;
      if ((d.bc[b.id] || 0) >= DD.bldMax(b, d.race, d.doc)) return '이 건물은 더 지을 수 없다';
      if (d.blds.length >= C.BLD_CAP) return '건물 한도';
      if (!pay(d, cost)) return '자원 부족';
      const mhp = b.hp * d.mod.bhp * (1 + 0.15 * d.up.bld) * (DD.bldTiles(b, c.cx, c.cy).some(([x, y]) => DD.isPlot(x, y)) ? C.PLOT_HP : 1);
      const e = { id: G.nid++, k: 'b', def: b, cx: c.cx, cy: c.cy, x: tcx(c.cx) + (b.size === 2 ? 12 : 0), y: tcy(c.cy) + (b.size === 2 ? 12 : 0), hp: mhp, mhp, cd: 0, hit: 0, r: b.size === 2 ? 20 : 12, paid: cost, tmode: 0 };
      d.blds.push(e); for (const [x, y] of DD.bldTiles(b, c.cx, c.cy)) d.occ[key(x, y)] = e; recount(d);
      fx(d, 'dust', e.x, e.y + 8, 0.42, { c: 'e' }); snd(d, 'build'); d.nBld++;
    } else if (c.a === 'tile') { // 길·벽 편집. t: 0 바닥, 1 길, 2 벽
      const { cx, cy, t } = c;
      if (!inG(cx, cy) || DD.isFixed(cx, cy) || d.ents.some((e) => is(e, cx, cy))) return '바꿀 수 없는 칸';
      if (d.grid[key(cx, cy)] === t) return null;
      if (d.occ[key(cx, cy)]) return '건물이 있는 칸';
      const ng = Uint8Array.from(d.grid); ng[key(cx, cy)] = t;
      const e0 = DD.gridCheck(ng, d.ents, d); if (e0) return e0;
      const nd = flow(ng);
      for (const e of d.demons) { const ex = tx(e.x), ey = ty(e.y); if (inG(ex, ey) && nd[key(ex, ey)] < 0) return '악마가 서 있는 길'; }
      if (t === 2 && d.units.some((u) => tx(u.x) === cx && ty(u.y) === cy)) return '유닛이 서 있는 칸';
      applyGrid(d, ng); d.walls = DD.gridCount(ng).wall; snd(d, 'build');
    } else if (c.a === 'grid') { // 편집한 격자 전체를 한 번에 적용한다
      const ng = Uint8Array.from(c.grid);
      if (ng.length === d.grid.length && ng.every((v, i) => v === d.grid[i])) return null;
      const e0 = DD.gridErr(d, ng); if (e0) return e0;
      applyGrid(d, ng); d.walls = DD.gridCount(ng).wall; snd(d, 'build');
      for (const u of d.units) if (wallAt(d, u.hx, u.hy)) { const h = homeSlot(d, u.def.rng > 30, !!u.hero); u.hx = h.x; u.hy = h.y; } // 벽 속이 된 자리는 다시 잡는다
    } else if (c.a === 'callwave') { // 전장이 비었으면 기다리지 않고 다음 웨이브를 부른다. 건너뛴 시간만큼의 기본 수입은 준다
      const skip = DD.canCall(G); if (!skip) return '전장에 악마가 남아 있습니다';
      const bonus = DD.callBonus(G); d.nCall++;
      G.t += skip;
      for (const x of G.dungeons) if (x.alive) { const inc = DD.income(x); x.gold += inc.g * skip + bonus; x.mat += inc.m * skip; x.heroT -= skip; }
      G.events.push({ t: 'called', d: d.i, bonus });
    } else if (c.a === 'rally') { // which: 'U' 소환소, 'H' 영웅 제단. x가 없으면 기본 배치로 되돌린다
      const k = c.which === 'H' ? 'rallyH' : 'rallyU';
      if (c.x === undefined) d[k] = null;
      else { if (wallAt(d, c.x, c.y)) return '벽 위에는 세울 수 없습니다'; d[k] = { x: Math.max(C.OX + 8, Math.min(C.OX + GW * T - 8, c.x)), y: Math.max(C.OY + 12, Math.min(C.OY + GH * T - 4, c.y)), n: 0 }; }
    } else if (c.a === 'upb') {
      const b = d.blds.find((x) => x.id === c.id); if (!b) return '없음';
      const cost = DD.bldUpCost(d, b); if (!cost) return '더 강화할 수 없습니다';
      if (!pay(d, cost)) return '자원 부족';
      b.lv = (b.lv || 1) + 1; b.paid = { g: b.paid.g + cost.g, m: b.paid.m + cost.m };
      if (b.def.kind === 'wall') { b.mhp *= 1.5; b.hp *= 1.5; }
      if (b.def.kind === 'tower' && b.lv === 3) {
        const specs = DD.TOWER_SPECS[d.race];
        b.spec = specs[c.spec ? 1 : 0];
        if (!d.specIds) d.specIds = [];
        if (!d.specIds.includes(b.spec.id)) d.specIds.push(b.spec.id);
        snd(d, 'spec');
        G.events.push({ t: 'spec', d: d.i, name: b.spec.name });
      }
      fx(d, 'hero', b.x, b.y, 0.5, { c: b.spec ? b.spec.col : 'g1' }); snd(d, 'up');
    } else if (c.a === 'sell') {
      const b = d.blds.find((x) => x.id === c.id); if (!b) return '없음';
      const k = 0.5 * (b.hp / b.mhp); d.gold += Math.floor(b.paid.g * k); d.mat += Math.floor(b.paid.m * k); b.hp = 0; snd(d, 'coin');
      for (const [x, y] of DD.bldTiles(b.def, b.cx, b.cy)) delete d.occ[key(x, y)]; d.blds = d.blds.filter((x) => x !== b); recount(d); fx(d, 'dust', b.x, b.y + 6, 0.42, { c: 'e' }); // 멈춘 동안에도 바로 사라지게
    } else if (c.a === 'dismiss') { // 고른 유닛을 돌려보내 인구를 비운다(영웅 제외, 비용의 30% 환급)
      const us = d.units.filter((u) => c.ids.includes(u.id) && u.own === d.i && !u.hero);
      if (!us.length) return '해산할 유닛이 없습니다(영웅은 해산 불가)';
      for (const u of us) { const uc = DD.unitCost(d, u.def); d.gold += Math.floor((uc.g || 0) * 0.3); d.mat += Math.floor((uc.m || 0) * 0.3); fx(d, 'dust', u.x, u.y, 0.42, { c: 's' }); }
      d.units = d.units.filter((u) => !us.includes(u)); snd(d, 'coin');
    } else if (c.a === 'hold') { // 위치 고수 전환
      const us = d.units.filter((u) => c.ids && c.ids.includes(u.id) && u.own === d.i);
      if (!us.length) return '선택된 유닛 없음';
      const next = !us.every((u) => u.hold);
      us.forEach((u) => { u.hold = next; if (next) { u.hx = u.x; u.hy = u.y; } });
    } else if (c.a === 'tmode') { // 탑 표적 우선순위 전환
      const b = d.blds.find((x) => x.id === c.id && x.def.kind === 'tower');
      if (!b) return '없음';
      b.tmode = ((b.tmode || 0) + 1) % DD.TARGET_MODES.length;
    } else if (c.a === 'move') {
      const us = d.units.filter((u) => c.ids.includes(u.id) && u.own === d.i);
      const n = Math.ceil(Math.sqrt(us.length));
      us.forEach((u, i) => {
        u.hx = Math.max(C.OX + 5, Math.min(C.OX + GW * T - 5, c.x + ((i % n) - (n - 1) / 2) * 12));
        u.hy = Math.max(C.OY + 8, Math.min(C.OY + GH * T - 3, c.y + (Math.floor(i / n) - (n - 1) / 2) * 12));
      });
    } else if (c.a === 'merge') { // 조합: 같은 유닛 셋을 한 단계 위 유닛 하나로
      const p = DD.mergePlan(d, c.ids); if (!p) return `같은 유닛 ${DD.mergeNeed(d.race)}기가 필요합니다`;
      const to = p.to || p.opts[c.pick ? 1 : 0]; // 1단계는 두 2단계 유닛 중 고른 쪽으로
      const blk = DD.mergeBlock(d, to); if (blk) return blk;
      if (!pay(d, DD.mergeCost(to, d.race, d.doc, d.mod.mergeMul))) return '자원 부족';
      const f = p.us[0], kills = p.us.reduce((s, u) => s + u.kills, 0);
      d.units = d.units.filter((u) => !p.us.includes(u));
      const u = addUnit(G, d, to); u.x = f.x; u.y = f.y; u.hx = f.hx; u.hy = f.hy; u.kills = d.race === 'spirit' ? Math.max(kills, DD.RANK_KILLS[1]) : kills; d.nMerge++; promote(G, d, u);
      if (d.race === 'spirit' && d.doc === 2) { u.mergedBonus = 0.1; u.mhp *= 1.1; u.hp *= 1.1; }
      [...new Set(p.us.flatMap((x) => x.sig || []))].slice(0, DD.sigCap(to, d.doc, d.race)).forEach((sg) => giveSig(u, sg)); // 각인은 물려받는다 // 정령은 조합하면 정예로 태어난다
      fx(d, 'hero', u.x, u.y, 0.75, { c: to.legend ? 'g1' : d.R.color }); if (to.legend) { snd(d, 'hero'); d.nLegend++; d.codex.legends[d.race] = 1; }
      G.events.push({ t: 'merge', d: d.i, name: to.name, legend: !!to.legend });
    } else if (c.a === 'imprint') { // 각인: 서로 다른 유닛 둘 → 하나가 사라지며 제 장기를 새긴다
      const p = DD.imprintPlan(d, c.ids); if (p.err) return p.err;
      const hadCb = DD.sigCombo(p.base.sig);
      d.units = d.units.filter((u) => u !== p.mat); p.base.kills += p.mat.kills; giveSig(p.base, p.sig); promote(G, d, p.base); d.nImprint = (d.nImprint || 0) + 1;
      const newCb = DD.sigCombo(p.base.sig);
      fx(d, 'hero', p.base.x, p.base.y, 0.6, { c: DD.SIGS[p.sig].col }); fx(d, 'dust', p.mat.x, p.mat.y, 0.42, { c: 's' }); snd(d, 'up');
      G.events.push({ t: 'imprint', d: d.i, name: p.base.def.name, sig: p.sig, combo: !hadCb && newCb ? newCb : null });
    } else if (c.a === 'skill') { // 영웅 기술: 선택한 영웅(없으면 살아 있는 내 영웅 전부) 중 준비된 영웅이 쓴다
      const allHs = d.units.filter((u) => u.hero && u.own === d.i && u.hp > 0);
      if (!allHs.length) return '영웅이 없습니다';
      const selHs = c.ids && c.ids.length ? allHs.filter((u) => c.ids.includes(u.id)) : [];
      const targetHs = selHs.length ? selHs : allHs;
      const readyHs = targetHs.filter((u) => (u.skCd || 0) <= 0);
      if (!readyHs.length) return '기술을 아직 쓸 수 없습니다';
      snd(d, 'hero');
      for (const u of readyHs) {
        u.skCd = DD.SKILL_CD;
        const r = u.hero.role, a = unitAtk(G, d, u);
        if (r === 'war') { for (const e of d.demons) if (e.hp > 0 && !e.def.fly && d2(e, u) < 62 * 62) { if (!e.gim) e.stun = 2; else if (e.tele) { e.stun = 1.2; } hurt(G, d, u, e, a * 3); } fx(d, 'boom', u.x, u.y - 6, 0.45, { c: 'g1', r: 62 }); }
        else if (r === 'arc') { const rr = (u.def.rng + 24) ** 2; for (const e of d.demons) if (e.hp > 0 && d2(e, u) < rr) { hurt(G, d, u, e, a * 2); fx(d, 'hit', e.x, e.y - 7, 0.2, { c: 'g1' }); } fx(d, 'hero', u.x, u.y, 0.5, { c: 'g1' }); }
        else if (r === 'rid') { u.rush = 6; fx(d, 'hero', u.x, u.y, 0.5, { c: 'g1' }); }
        else { for (const o of d.units) if (o.hp > 0 && d2(o, u) < 90 * 90) { o.hp = Math.min(o.mhp, o.hp + o.mhp * 0.35 * d.mod.healMul); fx(d, 'heal', o.x, o.y - 12, 0.4, { c: 'n1' }); } snd(d, 'heal'); }
        // 종족별 영웅 기술 변형 효과
        if (d.race === 'human') {
          for (const b of d.blds) if (b.hp > 0 && b.hp < b.mhp && d2(b, u) < 88 * 88) { b.hp = Math.min(b.mhp, b.hp + b.mhp * 0.25); fx(d, 'heal', b.x, b.y - 8, 0.4, { c: 'b1' }); }
          for (const o of d.units) if (o.hp > 0 && d2(o, u) < 88 * 88) o.shieldT = Math.max(o.shieldT || 0, 4);
        } else if (d.race === 'dragon') {
          d.zones.push({ x: u.x, y: u.y, r: 46, t: 5, T: 5, tick: 0, dps: a * 0.45 * d.mod.burnMul, own: u });
        } else if (d.race === 'beast') {
          for (const o of d.units) if (o.hp > 0 && d2(o, u) < 96 * 96) { o.hasteT = Math.max(o.hasteT || 0, 4); fx(d, 'hero', o.x, o.y, 0.35, { c: 'o1' }); }
        } else if (d.race === 'spirit') {
          for (const e of d.demons) if (e.hp > 0 && d2(e, u) < 84 * 84) hurt(G, d, u, e, a * 1.4, { pierce: 1 });
          d.mat += 5;
        } else if (d.race === 'merfolk') {
          for (const e of d.demons) if (e.hp > 0 && !e.def.fly && d2(e, u) < 76 * 76) {
            e.slowT = Math.max(e.slowT || 0, 3); e.slowMul = Math.min(e.slowMul || 1, 0.65);
            const dx = e.x - u.x, dy = e.y - u.y, l = Math.hypot(dx, dy) || 1;
            const nx = e.x + (dx / l) * 14, ny = e.y + (dy / l) * 14;
            if (roadAt(d, nx, ny)) { e.x = nx; e.y = ny; }
          }
        }
      }
      d.skillT = Math.min(...allHs.map((u) => u.skCd || 0));
      for (const b of d.blds) b.sealT = 0; // 영웅 기술은 군주의 탑 봉인을 즉시 해제한다
      G.events.push({ t: 'skill', d: d.i, race: d.race });
    } else if (c.a === 'pulse') { // 심장 공명: 종족별 사령관 전역 스킬
      if ((d.heartE || 0) < 100) return '심장 에너지가 부족합니다';
      d.heartE = 0; d.pulseN = (d.pulseN || 0) + 1;
      for (const b of d.blds) b.sealT = 0;
      if (d.race === 'human') {
        d.invulnBldT = 5;
        for (const b of d.blds) if (b.hp > 0 && b.def.kind !== 'trap') { b.hp = Math.min(b.mhp, b.hp + b.mhp * 0.4); fx(d, 'heal', b.x, b.y - 6, 0.45, { c: 'b1' }); }
      } else if (d.race === 'dragon') {
        for (const e of d.demons) if (e.hp > 0 && !e.def.fly) {
          const dmg = e.mhp * 0.15;
          hurt(G, d, null, e, dmg, { pierce: 1 });
          e.burnT = Math.max(e.burnT || 0, 4); e.burnDps = Math.max(e.burnDps || 0, e.mhp * 0.025 * d.mod.burnMul);
          fx(d, 'boom', e.x, e.y - 4, 0.3, { c: 'r1', r: 18 });
        }
      } else if (d.race === 'beast') {
        for (const u of d.units) if (u.hp > 0) { u.rush = Math.max(u.rush || 0, 7); u.hasteT = Math.max(u.hasteT || 0, 7); fx(d, 'hero', u.x, u.y, 0.4, { c: 'o1' }); }
      } else if (d.race === 'spirit') {
        for (const e of d.demons) if (e.hp > 0) e.stun = Math.max(e.stun || 0, e.gim ? 1.8 : 3.5);
      } else if (d.race === 'merfolk') {
        for (const e of d.demons) if (e.hp > 0 && !e.def.fly) { pushDemonBack(d, e, e.gim ? 1 : 2); e.slowT = Math.max(e.slowT || 0, 4); e.slowMul = Math.min(e.slowMul || 1, 0.6); }
      }
      fx(d, 'pulse', C.HEART.x, C.HEART.y, 0.7, { c: DD.HEART_SKILLS[d.race].col });
      snd(d, 'pulse');
      G.events.push({ t: 'pulse', d: d.i, race: d.race });
    } else if (c.a === 'event') { // 중반 전령 사건 선택
      const ev = d.eventPick; if (!ev || !ev.opts[c.i]) return '지금은 안 된다';
      const opt = ev.opts[c.i];
      if (ev.id === 'caravan') {
        if (c.i === 0) { d.gold += 180; d.mat += 35; d.nextWaveMod = { nMul: 1.2 }; }
        else d.gold += 90;
      } else if (ev.id === 'runestone') {
        if (c.i === 0) {
          d.heart.hp = Math.max(1, d.heart.hp - 80);
          let cnt = 0;
          for (const u of d.units) {
            if (cnt >= 3) break;
            if (u.hp > 0 && !u.hero && (u.sig || []).length < DD.sigCap(u.def, d.doc, d.race)) {
              const s = Object.keys(DD.SIGS).find((k) => !has(u, k));
              if (s) { giveSig(u, s); fx(d, 'hero', u.x, u.y, 0.5, { c: DD.SIGS[s].col }); cnt++; }
            }
          }
        } else d.mat += 45;
      } else if (ev.id === 'mercs') {
        if (c.i === 0) {
          if (d.gold < 90) return '자원 부족';
          d.gold -= 90;
          const others = DD.RACE_IDS.filter((r) => r !== d.race), ar = others[Math.floor(G.rnd() * others.length)], R2 = DD.RACES[ar];
          for (let k = 0; k < 2; k++) { const u = addUnit(G, d, R2.units[k ? 3 : 1]); u.ally = ar; u.rk = 1; }
        } else d.heroT = Math.max(0, d.heroT - 25);
      } else if (ev.id === 'peddler') {
        if (c.i === 0) {
          d.heart.mhp = Math.max(200, d.heart.mhp - 150); d.heart.hp = Math.min(d.heart.hp, d.heart.mhp);
          d.eventPick = null; d.chronicle.push({ w: G.wave, title: ev.title, pick: opt.name });
          offerBoon(G, d); snd(d, 'up'); G.events.push({ t: 'eventDone', d: d.i, title: ev.title, pick: opt.name });
          return null;
        } else { d.gold += 80; d.heart.hp = Math.min(d.heart.mhp, d.heart.hp + 120); }
      } else if (ev.id === 'engineers') {
        if (c.i === 0) { d.roadBonus = (d.roadBonus || 0) + 12; d.wallBonus = (d.wallBonus || 0) + 4; setCaps(G, d); }
        else d.mod.atk *= 1.06;
      } else if (ev.id === 'smith') {
        if (c.i === 0) {
          const k = ['atk', 'hp', 'bld'].sort((a, b) => d.up[a] - d.up[b])[0];
          if (d.up[k] >= DD.UPGRADES[k].max) return '더 강화할 수 없습니다';
          if (d.gold < 70) return '자원 부족';
          d.gold -= 70;
          d.up[k]++;
          if (k === 'hp') d.units.forEach((u) => { if (u.own === d.i) { const r = (1 + 0.1 * d.up.hp) / (1 + 0.1 * (d.up.hp - 1)); u.mhp *= r; u.hp *= r; } });
          if (k === 'bld') d.blds.forEach((b) => { const r = (1 + 0.15 * d.up.bld) / (1 + 0.15 * (d.up.bld - 1)); b.mhp *= r; b.hp *= r; });
        } else { d.mod.bhp *= 1.15; d.blds.forEach((b) => { if (b.def.kind !== 'trap') { b.mhp *= 1.15; b.hp = b.mhp; } }); }
      } else if (ev.id === 'resonance') {
        if (c.i === 0) d.heartE = 100;
        else { d.heart.mhp += 100; d.heart.hp = Math.min(d.heart.mhp, d.heart.hp + 250); }
      } else if (ev.id === 'scout') {
        if (c.i === 0) d.nextWaveMod = { hpMul: 0.85, goldMul: 0.9 };
        else d.nextWaveMod = { goldMul: 1.45, atkMul: 1.15 };
      }
      d.eventPick = null;
      d.chronicle.push({ w: G.wave, title: ev.title, pick: opt.name });
      snd(d, 'up');
      G.events.push({ t: 'eventDone', d: d.i, title: ev.title, pick: opt.name });
    } else if (c.a === 'quicksend') { // 멀티: 화면 전환 없이 예비 병력 2기 즉시 파병
      const to = G.dungeons[c.to]; if (!to || !to.alive || to === d) return '보낼 수 없는 곳';
      const sent = d.units.filter((u) => !u.hero && u.own === d.i && u.hp > 0).slice(0, 2);
      if (!sent.length) return '보낼 예비 병력이 없습니다';
      d.units = d.units.filter((u) => !sent.includes(u));
      sent.forEach((u) => { const h = homeSlot(to, u.def.rng > 30); u.x = C.SUMMON.x; u.y = C.SUMMON.y + 26; u.hx = h.x; u.hy = h.y; u.tg = null; to.units.push(u); });
      if (to.demons.length || to.queue.length) to.helpedByHuman = true;
      G.events.push({ t: 'support', d: d.i, to: to.i, n: sent.length });
    } else if (c.a === 'boon') {
      if (!d.boonPick || d.boonPick[c.i] == null) return '지금은 안 된다';
      applyBoon(G, d, d.boonPick[c.i]); snd(d, 'up');
    } else if (c.a === 'up') {
      const cost = DD.upCost(d, c.k); if (!cost) return '최대 레벨';
      if (!pay(d, cost)) return '자원 부족';
      snd(d, 'up');
      if (c.k === 'altar') d.altarLv++;
      else {
        d.up[c.k]++;
        if (c.k === 'hp') G.dungeons.forEach((x) => x.units.forEach((u) => { if (u.own === d.i) { const r = (1 + 0.1 * d.up.hp) / (1 + 0.1 * (d.up.hp - 1)); u.mhp *= r; u.hp *= r; } }));
        if (c.k === 'bld') d.blds.forEach((b) => { const r = (1 + 0.15 * d.up.bld) / (1 + 0.15 * (d.up.bld - 1)); b.mhp *= r; b.hp *= r; });
      }
    } else if (c.a === 'hero') {
      if (d.heroT > 0) return '영웅 소환 대기 중';
      const pick = d.R.heroes[Math.floor(G.rnd() * d.R.heroes.length)];
      const pr = DD.ALTAR[d.altarLv - 1].p; let r = G.rnd(), gi = 0;
      while (gi < 2 && r >= pr[gi]) { r -= pr[gi]; gi++; }
      const role = DD.HERO_ROLES[pick[1]], gr = DD.GRADES[gi];
      const def = Object.assign({}, role, { name: pick[0], tier: 4, hp: role.hp * gr.mul, atk: role.atk * gr.mul, heal: role.heal ? role.heal * gr.mul : 0, spr: DD.heroSpr(d.race, pick[1]) });
      const hu = addUnit(G, d, def, { name: pick[0], grade: gi, role: pick[1] });
      hu.skCd = 0; d.skillT = 0; d.codex.heroes[d.race + '_' + pick[1]] = 1;
      d.heroN++;
      d.heroT = (DD.HERO_CD.base + DD.HERO_CD.inc * d.heroN) * DD.ALTAR[d.altarLv - 1].cd * d.mod.hcd;
      G.events.push({ t: 'hero', d: d.i, name: pick[0], grade: gr.id, spr: 'p_' + d.race + '_' + pick[1] });
    } else if (c.a === 'allycall') { // 솔로 모드: 동맹 종족 원정대 소집
      if (!d.allyRace) return '동맹 종족이 없습니다';
      if (d.allyCd > 0) return '원정 대기 중';
      const ar = DD.RACES[d.allyRace], own = d.units.filter((x) => x.own === d.i).length;
      if (own >= d.pop) return '인구 한도';
      const u1 = addUnit(G, d, ar.units[0]); u1.ally = d.allyRace; u1.rk = 1;
      if (own + 1 < d.pop) { const u2 = addUnit(G, d, ar.units[1]); u2.ally = d.allyRace; u2.rk = 1; }
      d.allyCd = DD.ALLY_CD;
      G.events.push({ t: 'allycall', d: d.i, race: d.allyRace });
    } else if (c.a === 'sos') { // 멀티 모드: AI 동맹에게 지원군 요청
      if (G.dungeons.length < 2) return '동맹 요새가 없습니다';
      if (d.sosCd > 0) return '지원 요청 대기 중';
      const donors = G.dungeons.filter((x) => x.i !== d.i && x.alive && x.bot && x.units.filter((u) => !u.hero && u.own === x.i).length >= 4);
      if (!donors.length) return '지원을 보낼 수 있는 동맹이 없습니다';
      donors.sort((a, b) => b.units.length - a.units.length);
      const from = donors[0], sent = from.units.filter((u) => !u.hero && u.own === from.i).slice(0, 3);
      from.units = from.units.filter((u) => !sent.includes(u));
      sent.forEach((u) => { const h = homeSlot(d, u.def.rng > 30); u.x = C.SUMMON.x; u.y = C.SUMMON.y + 26; u.hx = h.x; u.hy = h.y; u.tg = null; d.units.push(u); });
      d.sosCd = 75;
      G.events.push({ t: 'sos', d: d.i, from: from.i, n: sent.length });
    } else if (c.a === 'support') {
      const to = G.dungeons[c.to]; if (!to || !to.alive || to === d) return '보낼 수 없는 곳';
      const us = d.units.filter((u) => c.ids.includes(u.id) && u.own === d.i);
      if (!us.length) return '선택된 유닛 없음';
      d.units = d.units.filter((u) => !us.includes(u));
      us.forEach((u) => { const h = homeSlot(to, u.def.rng > 30); u.x = C.SUMMON.x; u.y = C.SUMMON.y + 26; u.hx = h.x; u.hy = h.y; u.tg = null; to.units.push(u); });
      G.events.push({ t: 'support', d: d.i, to: to.i, n: us.length });
    }
    return null;
  }

  // ── 전투 ──
  function unitAtk(G, d, u) {
    const o = G.dungeons[u.own];
    let a = u.def.atk * o.mod.atk * (1 + 0.1 * o.up.atk) * (1 + 0.15 * (u.rk || 0)) * (1 + (u.mergedBonus || 0));
    if (o.bc.forge && o.race === 'human') a *= 1.15;
    if (u.def.splash && has(u, 'burst')) a *= 1.25;
    if (o.race === 'dragon') a *= 1 + Math.min(o.doc === 2 ? 0.8 : 0.5, 0.02 * u.kills);
    if (o.race === 'beast') a *= 1 + Math.min(0.4, 0.015 * d.units.length);
    if (o.race === 'human' && o.doc === 2 && (u.def.rng <= 30 || u.hero)) a *= 1.2;
    if (o.race === 'beast' && o.doc === 2 && !u.def.splash) a *= 1.2;
    if (o.race === 'merfolk' && o.doc === 2 && u.def.rng > 30) a *= 1.15;
    if (o.race === 'human' && u.def.rng > 30 && nearWall(d, tx(u.x), ty(u.y))) a *= 1.15;
    const cb = DD.sigCombo(u.sig);
    if (cb && cb.id === 'burst+swift') a *= 1.2;
    else if (cb && cb.id === 'harmony') a *= 1.1;
    if (nearLandmark(G, u.x, u.y)?.id === 'rift') a *= 1.25;
    if (G.medals) a *= 1 + 0.05 * G.medals;
    return a;
  }
  // 전리품: 셋을 뽑아 고르게 한다. 봇은 바로 하나를 집는다
  function offerBoon(G, d) {
    const ids = DD.BOONS.map((b, i) => i), pick = [];
    while (pick.length < 3) pick.push(ids.splice(Math.floor(G.rnd() * ids.length), 1)[0]);
    if (d.bot) applyBoon(G, d, pick[Math.floor(G.rnd() * 3)]); else { d.boonPick = pick; G.events.push({ t: 'boon', d: d.i }); }
  }
  function applyBoon(G, d, bi) {
    const k = DD.BOONS[bi].id, own = d.units.filter((u) => u.own === d.i); d.boons.push(k); d.boonPick = null;
    if (k === 'atk') d.mod.atk *= 1.12;
    else if (k === 'hp') { d.mod.hp *= 1.15; own.forEach((u) => { u.mhp *= 1.15; u.hp *= 1.15; }); }
    else if (k === 'loot') d.mod.kg = (d.mod.kg || 1) + 0.2;
    else if (k === 'pop') d.pop += 6;
    else if (k === 'heart') { d.heart.mhp += 250; d.heart.hp += 250; }
    else if (k === 'hero') { d.heroT = 0; d.mod.hcd *= 0.85; }
    else if (k === 'bank') d.gold += 300;
    else if (k === 'mat') d.mat += 60;
    else if (k === 'bld') { d.mod.bhp *= 1.3; d.blds.forEach((b) => { b.mhp *= 1.3; b.hp *= 1.3; }); }
    else if (k === 'regen') d.mod.regen = (d.mod.regen || 0) + 0.005;
    else if (k === 'fastmerge') d.mod.mergeMul = (d.mod.mergeMul || 1) * 0.5;
    else if (k === 'allymerc') {
      const others = DD.RACE_IDS.filter((r) => r !== d.race), ar = others[Math.floor(G.rnd() * others.length)], R2 = DD.RACES[ar];
      for (let i = 0; i < 3; i++) { const u = addUnit(G, d, R2.units[i % 2 ? 3 : 1]); u.ally = ar; u.rk = 1; }
    }
    G.events.push({ t: 'boonGot', d: d.i, b: bi });
  }
  function promote(G, d, u) { // 처치 수가 차면 승급: 최대 체력이 늘고(공격은 unitAtk에서) 표식이 붙는다
    const o = G.dungeons[u.own], r = DD.rankOf(u, o.race, o.doc), was = u.rk || 0; if (r <= was) return;
    const k = (1 + 0.15 * r) / (1 + 0.15 * was); u.mhp *= k; u.hp *= k; u.rk = r; if (r === 2) o.nRank2++;
    fx(d, 'hero', u.x, u.y, 0.5, { c: 'g1' }); snd(d, 'up');
  }
  function hurt(G, d, src, t, amt, opts) {
    if (t.k === 'b' && d.invulnBldT > 0) return;
    if (t.k === 'u') {
      if (t.shieldT > 0) amt *= 0.75;
      const cb = DD.sigCombo(t.sig); if (cb && cb.id === 'guard+swift') amt *= 0.85;
      if (d.units.some((x) => x !== t && x.hp > 0 && x.def.passive === 'aegis' && d2(x, t) < 52 * 52)) amt *= 0.75;
    }
    if (t.k === 'd') {
      let arm = t.arm || 0;
      if (nearLandmark(G, t.x, t.y)?.id === 'vortex') arm = Math.max(0, arm - 2);
      let pierce = (opts && opts.pierce) || (src && src.def && src.def.pierce) || 0;
      if (src && src.k === 'u') {
        const o = G.dungeons[src.own]; pierce += o.mod.pierce || 0;
        const cb = DD.sigCombo(src.sig); if (cb && cb.id === 'burst+reach') pierce += 0.4;
      }
      if (d.boons.includes('shredall')) pierce += 0.35;
      const effArm = Math.max(0, arm * (1 - Math.min(0.95, pierce)) * (1 - (t.shredT > 0 ? t.shred : 0)));
      const raw = amt;
      if (effArm && src) amt = Math.max(amt * 0.25, amt - effArm); // 방어력: 한 대마다 깎되 4분의 1은 들어간다
      if (effArm > 2 && amt < raw * 0.55 && G.rnd() < 0.22) fx(d, 'block', t.x, t.y - 10, 0.22);
      if (src && src.def && src.def.shred) { t.shredT = 3; t.shred = Math.max(t.shred || 0, src.def.shred); }
      const dealt = Math.min(Math.max(0, t.hp), amt);
      if (src && dealt > 0) {
        const cat = src.k === 'b' ? (src.def.kind === 'trap' ? 'traps' : 'towers') : src.hero ? 'heroes' : 'units';
        d.stats[cat] += dealt; const nm = src.def.name; d.stats.top[nm] = (d.stats.top[nm] || 0) + dealt;
      }
    }
    t.hp -= amt; t.hit = 0.12; if (t.k === 'h') { d.alarmT = 3; if (amt > 0) d.heartE = Math.min(100, (d.heartE || 0) + amt * 0.08); } // 심장이 맞으면 근처 병력이 달려온다
    if (t.k === 'd' && t.hp <= 0 && !t.dead) {
      t.dead = true; d.kills++; d.heartE = Math.min(100, (d.heartE || 0) + (t.def.spr === 'd_boss' ? 25 : t.elite ? 10 : 2.5));
      if (src && src.k === 'u') {
        src.kills++; promote(G, d, src);
        const ownerD = G.dungeons[src.own];
        if (!d.mvp || src.kills > d.mvp.kills) d.mvp = { name: src.def.name, kills: src.kills, sig: (src.sig || []).slice(), rk: src.rk || 0, race: ownerD ? ownerD.race : d.race };
        if (src.own !== d.i && src.own === G.human) d.helpedByHuman = true;
      }
      const kg = t.def.gold * (t.gm || 1) * G.D.gold * d.mod.gold * (d.mod.kg || 1) * (1 + 0.2 * Math.min(3, d.bc.hoard || 0)); d.gold += kg;
      if (src && src.k === 'u' && src.own !== d.i && G.dungeons[src.own]?.alive) G.dungeons[src.own].gold += Math.round(kg * 0.5);
      if (src && src.k === 'u' && src.def.passive === 'prism') d.mat += 1;
      if (t.def.spr === 'd_boss' && (G.endless || G.wave < C.WAVES) && !G.tutorial) offerBoon(G, d);
      d.mat += (t.def.mat || 0) + (G.rnd() < 0.1 ? 1 : 0) + (t.elite ? 5 : 0);
      if (t.def.spr === 'd_boss') { d.bossKills++; G.events.push({ t: 'bossDead', d: d.i }); }
      if (t.elite) d.eliteKills++;
      if (src && src.k === 'b' && src.def.kind === 'trap') {
        d.trapKills++;
        if (d.boons.includes('trapboom')) {
          for (const o of d.demons) if (o !== t && o.hp > 0 && d2(o, t) < 36 * 36) hurt(G, d, src, o, t.mhp * 0.15, { pierce: 0.5 });
          fx(d, 'boom', t.x, t.y - 4, 0.25, { c: 'o2', r: 36 });
        }
      }
      fx(d, 'corpse', t.x, t.y, 0.5, { s: t.gim ? 'd_lord_' + t.gim : t.def.spr, face: t.face }); fx(d, 'smoke', t.x, t.y, 0.5); fx(d, 'gold', t.x, t.y - 14, 0.7, { n: Math.round(kg) });
      snd(d, t.def.spr === 'd_boss' ? 'bossdie' : 'die');
    }
    if (t.k === 'b' && t.def.thorn && src && src.k === 'd') hurt(G, d, null, src, t.def.thorn * lvMul(t));
    if (t.k === 'b' && t.def.kind === 'wall' && t.hp <= 0 && !t.bombed && d.boons.includes('wallbomb')) {
      t.bombed = true;
      for (const o of d.demons) if (o.hp > 0 && !o.def.fly && d2(o, t) < 48 * 48) { if (!o.gim) o.stun = Math.max(o.stun || 0, 2); hurt(G, d, t, o, 120); }
      fx(d, 'boom', t.x, t.y - 4, 0.35, { c: 'r1', r: 48 });
    }
  }
  function strike(G, d, src, t, amt, splash, col, opts) {
    if (G.hz === 'wild' && src.k !== 'd' && (src.k === 'b' || src.def.rng > 30) && (src.k === 'u' ? G.dungeons[src.own].race : d.race) !== G.st.home) amt *= 0.7; // 모래폭풍(그 땅의 종족은 익숙하다)
    if (src.k === 'd' && nearLandmark(G, src.x, src.y)?.id === 'rift') amt *= 1.25;
    if (src.k === 'u') {
      const o = G.dungeons[src.own];
      if (o.race === 'beast' && src.def.rng <= 30 && t.k === 'd' && d.corners && d.corners[key(tx(t.x), ty(t.y))]) {
        amt *= (o.doc === 2 ? 1.45 : 1.25);
        o.ambushHits = (o.ambushHits || 0) + 1;
      }
      const cb = DD.sigCombo(src.sig);
      if (cb && cb.id === 'burst+swift') splash = (splash || 8) + 6;
      if (cb && cb.id === 'mend+reach' && src.hp < src.mhp) src.hp = Math.min(src.mhp, src.hp + src.mhp * 0.02);
      if (src.def.passive === 'burn' && t.k === 'd') { t.burnT = 3; t.burnDps = Math.max(t.burnDps || 0, t.mhp * 0.02 * o.mod.burnMul); }
      if (src.def.passive === 'maelstrom' && t.k === 'd') { t.slowT = 2.5; t.slowMul = Math.min(t.slowMul || 1, 0.6); t.shredT = 3; t.shred = Math.max(t.shred || 0, 0.35); }
      if (src.def.passive === 'quake') {
        src.atkCount = (src.atkCount || 0) + 1;
        if (src.atkCount % 3 === 0) {
          for (const o2 of d.demons) if (o2.hp > 0 && !o2.def.fly && d2(o2, t) < 44 * 44) { if (!o2.gim || o2.tele) o2.stun = Math.max(o2.stun || 0, 1.2); hurt(G, d, src, o2, amt * 0.6); }
          fx(d, 'boom', t.x, t.y - 4, 0.3, { c: 'g1', r: 44 });
        }
      }
      if (src.def.passive === 'prism') {
        const rg2 = (rngOf(G, d, src) + 16) ** 2; let extra = 0;
        for (const o2 of d.demons) if (o2 !== t && o2.hp > 0 && d2(src, o2) <= rg2) { shoot(d, src, o2, 'orb', col); hurt(G, d, src, o2, amt * 0.75); if (++extra >= 2) break; }
      }
    }
    if (splash) splash = Math.round(splash * (src.k === 'u' ? G.dungeons[src.own].mod.splashMul : d.mod.splashMul));
    if (src.def.rng > 30 || src.k === 'b') { const k = src.k === 'd' ? 'orb' : SHOT[src.k === 'u' ? (src.ally || G.dungeons[src.own].race) : d.race]; shoot(d, src, t, k, col); snd(d, k); }
    else { fx(d, 'hit', t.x + (G.rnd() - 0.5) * 4, t.y - 7, 0.17, { c: src.k === 'd' ? 'r1' : 'W' }); snd(d, 'melee'); }
    if (t.k === 'h') snd(d, 'heart');
    // 상성: 중장갑은 범위 공격에 강하고 단일 공격에 약하다. 떼로 오는 악마는 범위 공격에 약하다
    const typeMul = (x) => (x.k !== 'd' || src.k === 'd' ? 1 : x.def.heavy ? (splash ? 0.8 : 1.2) : x.def.light && splash ? 1.2 : 1);
    const tm = typeMul(t);
    if (tm > 1 && G.rnd() < 0.3) fx(d, 'crit', t.x, t.y - 12, 0.22);
    hurt(G, d, src, t, amt * tm, opts);
    if (splash) {
      const list = src.k === 'd' ? d.units : d.demons;
      for (const o of list) if (o !== t && d2(o, t) < splash * splash && !(o.k === 'd' && o.def.fly && src.k === 'u' && src.def.rng <= 30)) {
        hurt(G, d, src, o, amt * 0.6 * typeMul(o), opts);
        if (src.k === 'u' && src.def.passive === 'maelstrom' && o.k === 'd') { o.slowT = 2.5; o.slowMul = Math.min(o.slowMul || 1, 0.6); o.shredT = 3; o.shred = Math.max(o.shred || 0, 0.35); }
      }
      fx(d, 'boom', t.x, t.y - 4, 0.25, { c: col, r: splash });
    }
  }
  function step2(e, x, y, spd) { // e를 (x,y) 쪽으로 한 걸음. 새 좌표를 돌려준다(적용은 호출자가)
    const dx = x - e.x, dy = y - e.y, l = Math.hypot(dx, dy);
    if (l < 0.5) return null;
    const s = Math.min(l, spd * DT);
    if (Math.abs(dx) > 1) e.face = dx > 0 ? 1 : -1;
    return [e.x + (dx / l) * s, e.y + (dy / l) * s];
  }
  const wallAt = (d, x, y) => { const cx = tx(x), cy = ty(y); return inG(cx, cy) && d.grid[key(cx, cy)] === 2; };
  function clearLine(d, ax, ay, bx, by) { // 두 점 사이에 벽 타일이 없는가
    const dx = bx - ax, dy = by - ay, n = Math.ceil(Math.hypot(dx, dy) / 6);
    for (let i = 1; i <= n; i++) if (wallAt(d, ax + (dx * i) / n, ay + (dy * i) / n)) return false;
    return true;
  }
  function navTarget(d, u, x, y) { // 벽에 막히면 벽이 아닌 칸을 따라 돌아가는 다음 지점을 준다. 길이 없으면 null
    if (!d.walls || clearLine(d, u.x, u.y, x, y)) { u.nav = null; return [x, y]; }
    const gx = tx(x), gy = ty(y), k = d.ver + ':' + gx + ',' + gy;
    if (!u.nav || u.navK !== k) {
      u.navK = k; u.nav = [];
      const sx = tx(u.x), sy = ty(u.y), from = new Int16Array(GW * GH).fill(-1), q = [[sx, sy]];
      if (inG(sx, sy) && inG(gx, gy) && d.grid[key(gx, gy)] !== 2) {
        from[key(sx, sy)] = key(sx, sy);
        for (let i = 0; i < q.length; i++) {
          const [cx, cy] = q[i]; if (cx === gx && cy === gy) break;
          for (const [dx, dy] of NB) { const ax = cx + dx, ay = cy + dy; if (inG(ax, ay) && d.grid[key(ax, ay)] !== 2 && from[key(ax, ay)] < 0) { from[key(ax, ay)] = key(cx, cy); q.push([ax, ay]); } }
        }
        if (from[key(gx, gy)] >= 0) for (let c = key(gx, gy); c !== key(sx, sy); c = from[c]) u.nav.unshift([c % GW, (c / GW) | 0]);
      }
    }
    while (u.nav.length > 1 && clearLine(d, u.x, u.y, tcx(u.nav[1][0]), tcy(u.nav[1][1]))) u.nav.shift(); // 곧장 갈 수 있는 지점까지 건너뛴다
    if (!u.nav.length) return null;
    if (u.nav.length > 1 && Math.hypot(tcx(u.nav[0][0]) - u.x, tcy(u.nav[0][1]) - u.y) < 3) u.nav.shift();
    return u.nav.length === 1 && clearLine(d, u.x, u.y, x, y) ? [x, y] : [tcx(u.nav[0][0]), tcy(u.nav[0][1])];
  }
  function moveUnit(d, u, x, y, spd) { // 유닛은 자유롭게 걷되 벽 타일은 넘지 못하고, 막히면 돌아간다
    const tg = navTarget(d, u, x, y); u.mv = false;
    if (!tg) return;
    const p = step2(u, tg[0], tg[1], spd);
    if (!p) return;
    if (!wallAt(d, p[0], p[1]) || wallAt(d, u.x, u.y)) { u.x = p[0]; u.y = p[1]; u.mv = true; }
    else if (!wallAt(d, p[0], u.y)) { u.x = p[0]; u.mv = true; } else if (!wallAt(d, u.x, p[1])) { u.y = p[1]; u.mv = true; }
  }
  const prog = (d, e) => { const cx = tx(e.x), cy = ty(e.y), v = inG(cx, cy) ? d.dist[key(cx, cy)] : -1; return v < 0 ? 999 : v; }; // 심장까지 남은 칸
  const roadAt = (d, x, y) => { const cx = tx(x), cy = ty(y); return inG(cx, cy) ? d.grid[key(cx, cy)] === 1 : DD.entOutside(d.ents, cx, cy); };
  function nearest(e, list, maxD) {
    let best = null, bd = maxD * maxD;
    for (const o of list) { if (o.hp <= 0) continue; const q = d2(e, o); if (q < bd) { bd = q; best = o; } }
    return best;
  }
  function sep(list, rad) {
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j], dx = b.x - a.x, dy = b.y - a.y, q = dx * dx + dy * dy;
      if (q < rad * rad) { const l = Math.sqrt(q) || 0.01, p = (rad - l) * 0.25, ux = l > 0.02 ? dx / l : 1, uy = l > 0.02 ? dy / l : 0; a.x -= ux * p; a.y -= uy * p; b.x += ux * p; b.y += uy * p; }
    }
  }

  function spawnWave(G, d, w) {
    const base = DD.waveList(w), sc = DD.waveScale(w), list = [];
    const mu = DD.MUTS[G.muts[w]] || {}, mu2 = G.muts2 && DD.MUTS[G.muts2[w]] ? DD.MUTS[G.muts2[w]] : {}, D = G.D;
    const wm = d.nextWaveMod || {}; d.nextWaveMod = null;
    const n = Math.round(base.length * d.share * (mu.n || 1) * (mu2.n || 1) * (wm.nMul || 1));
    for (let i = 0; i < n; i++) list.push(base[i % base.length]);
    const easy = G.tutorial ? (w <= 5 ? 0.6 : 0.85) : 1; // 튜토리얼의 첫 다섯 웨이브는 약하다
    const cand = !G.tutorial && w >= 4 && w % 5 ? list.map((t, i) => i).filter((i) => list[i] === 'brute' || list[i] === 'hound' || list[i] === 'warlock') : [];
    const ei = cand.length ? cand[Math.floor(G.rnd() * cand.length)] : -1; // 우두머리: 체력 2.5배, 공격 1.25배, 골드 5배
    const ei2 = G.hasOath('elites') && cand.length > 1 ? cand.find((idx) => idx !== ei) : -1;
    const ne = d.ents.length, th = G.thrust[w], rest = d.ents.map((e, i) => i).filter((i) => i !== th); // 주공 입구로 6할, 나머지는 고르게
    const entOf = (i) => (ne < 2 || th == null ? 0 : i % 5 < 3 ? th : rest[((i / 5) | 0) % rest.length]);
    const spdBase = (mu.spd || 1) * (mu2.spd || 1) * (G.hasOath('fast') ? 1.2 : 1);
    const hpBase = sc.hp * G.st.mul * easy * D.hp * (mu.hp || 1) * (mu2.hp || 1) * (wm.hpMul || 1);
    const atkBase = sc.atk * Math.sqrt(G.st.mul) * D.atk * (mu.atk || 1) * (mu2.atk || 1) * (wm.atkMul || 1);
    const gmBase = (mu.gold || 1) * (mu2.gold || 1) * (wm.goldMul || 1);
    list.forEach((t, i) => d.queue.push({ arm: DD.armAt(t, w), elite: i === ei || i === ei2, ent: t === 'boss' ? 0 : entOf(i), at: G.t + (i / list.length) * 25, t, hp: hpBase, atk: atkBase, spd: spdBase, gm: gmBase, gim: t === 'boss' ? DD.BOSS[w] || (w > C.WAVES ? 'all' : null) : null }));
    d.queue.sort((a, b) => a.at - b.at);
  }

  // 군주 기믹: 임프 소환, 포효(기절), 절반 아래에서 돌진 + 50% 2페이즈 탑 봉인 (전조 중 기절하면 차단)
  function bossGim(G, d, e) {
    const g = e.gim, all = g === 'all';
    if (!e.p2 && e.hp < e.mhp * 0.5 && !G.tutorial) {
      e.p2 = true; snd(d, 'phase'); fx(d, 'boom', e.x, e.y - 8, 0.45, { c: 'p2', r: 52 });
      const needSeal = g === 'roar' || all ? 2 : 1;
      const towers = d.blds.filter((b) => b.def.kind === 'tower' && !(b.sealT > 0)).sort((a, b) => d2(a, e) - d2(b, e)).slice(0, needSeal);
      towers.forEach((b) => { b.sealT = all ? 5 : 4.5; fx(d, 'seal', b.x, b.y - 8, 0.6); });
      if (g === 'summon' || all) {
        const hd = DD.DEMONS.hound;
        for (let i = 0; i < 2; i++) { const mhp = hd.hp * e.sc[0]; d.demons.push({ id: G.nid++, k: 'd', def: hd, x: e.x + (G.rnd() - 0.5) * 14, y: e.y + (G.rnd() - 0.5) * 8, hp: mhp, mhp, atk: hd.atk * e.sc[1], spd: 1, gm: 0.5, cd: 0, rt: 0.2, tg: null, face: 1, hit: 0, r: 7 }); }
      }
      G.events.push({ t: 'bossPhase', d: d.i, gim: g, sealed: towers.length });
    }
    if ((g === 'ram' || all) && !e.rage && e.hp < e.mhp * 0.5) { e.rage = true; e.spd = (e.spd || 1) * 1.6; fx(d, 'boom', e.x, e.y - 8, 0.4, { c: 'r1', r: 26 }); snd(d, 'alarm'); G.events.push({ t: 'bossRage', d: d.i }); }
    if (g === 'ram') return;
    if (e.stun > 0) {
      if (e.tele) { e.tele = null; e.gt += 3.5; fx(d, 'interrupt', e.x, e.y - 6, 0.45); G.events.push({ t: 'bossInterrupt', d: d.i }); }
      return;
    }
    e.gt -= DT;
    const nextKind = g === 'summon' || (all && ((e.gn || 0) + 1) % 2) ? 'summon' : 'roar';
    if (e.gt <= 1.8 && e.gt > 0) e.tele = { kind: nextKind, t: e.gt, T: 1.8 };
    if (e.gt > 0) return;
    e.tele = null; e.gn = (e.gn || 0) + 1;
    if (g === 'summon' || (all && e.gn % 2)) {
      e.gt = all ? 7 : 8; const imp = DD.DEMONS.imp;
      for (let i = 0; i < 3; i++) { const mhp = imp.hp * e.sc[0]; d.demons.push({ id: G.nid++, k: 'd', def: imp, x: e.x + (G.rnd() - 0.5) * 14, y: e.y + (G.rnd() - 0.5) * 8, hp: mhp, mhp, atk: imp.atk * e.sc[1], spd: 1, gm: 0.5, cd: 0, rt: G.rnd() * 0.3, tg: null, face: 1, hit: 0, r: 7 }); }
      fx(d, 'smoke', e.x, e.y, 0.5); snd(d, 'summon');
    } else {
      e.gt = all ? 7 : 10;
      for (const u of d.units) if (u.hp > 0 && d2(u, e) < 70 * 70) u.stun = 2;
      fx(d, 'boom', e.x, e.y - 8, 0.45, { c: 'p2', r: 70 }); snd(d, 'alarm');
    }
  }
  function demonStep(G, d, e) {
    if (e.gim) bossGim(G, d, e);
    if (e.slowT > 0) e.slowT -= DT; if (e.shredT > 0) e.shredT -= DT;
    if (e.burnT > 0) { e.burnT -= DT; e.hp = Math.max(1, e.hp - e.burnDps * DT); }
    if (e.stun > 0) { e.stun -= DT; e.mv = false; return; } // 영웅의 대지 강타에 기절
    if (e.def.fly) { // 비행: 길도 벽도 유닛도 무시하고 심장으로
      const h = d.heart, reach = e.def.rng + h.r; e.face = h.x >= e.x ? 1 : -1;
      if (d2(e, h) <= reach * reach) { e.mv = false; if (e.cd <= 0) { e.cd = e.def.as; e.atkT = 0.3; strike(G, d, e, h, e.atk, 0, 'p2'); } }
      else { const p = step2(e, h.x, h.y, e.def.spd * (e.spd || 1)); e.mv = !!p; if (p) { e.x = p[0]; e.y = p[1]; } }
      return;
    }
    { // 함정·지형·종족 길 시너지(용암벽·침수 회랑·정령 결계선)
      const tcx0 = tx(e.x), tcy0 = ty(e.y), tr = inG(tcx0, tcy0) ? d.occ[key(tcx0, tcy0)] : null;
      e.slow = (G.hz === 'water' ? 0.65 : 1) * (e.slowT > 0 ? e.slowMul : 1);
      if (G.hz === 'fire') e.hp = Math.max(1, e.hp - e.mhp * 0.02 * DT);
      const lm = nearLandmark(G, e.x, e.y);
      if (lm) {
        if (lm.id === 'lava') e.hp = Math.max(1, e.hp - e.mhp * 0.02 * DT);
        else if (lm.id === 'root') e.slow *= 0.75;
        else if (lm.id === 'vortex') e.slow *= 0.8;
      }
      if (d.race === 'dragon' && d.blds.some((b) => b.def.kind === 'wall' && d2(e, b) < 36 * 36)) e.hp = Math.max(1, e.hp - e.mhp * 0.015 * d.mod.burnMul * DT);
      if (d.race === 'merfolk' && d.blds.some((b) => b.def.regen && d2(e, b) < (b.def.rad * (d.doc === 1 ? 1.2 : 1)) ** 2)) e.slow *= 0.8;
      if (d.race === 'spirit' && d.beams && d.beams.some((bm) => bm.tiles.some(([bx, by]) => bx === tcx0 && by === tcy0))) {
        e.slow *= 0.8; e.bmt = (e.bmt || 0) - DT;
        if (e.bmt <= 0) {
          e.bmt = 0.5;
          const boost = d.blds.some((b) => b.spec && b.spec.beamBoost && d2(e, b) <= 84 * 84) ? 2 : 1;
          hurt(G, d, null, e, 6 * (1 + 0.1 * d.up.bld) * boost);
        }
      }
      if (tr && tr.def.kind === 'trap') {
        if (tr.def.push && (tr.cd || 0) <= 0) {
          const boss = e.def.spr === 'd_boss', steps = boss ? 1 : tr.def.push + ((tr.lv || 1) >= 2 ? 1 : 0);
          tr.cd = Math.max(1.6, tr.def.cdMax - 0.5 * ((tr.lv || 1) - 1)); tr.hit = 0.4;
          pushDemonBack(d, e, steps);
          d.pushN = (d.pushN || 0) + 1;
          if (!e.gim) e.stun = Math.max(e.stun || 0, 0.6); else if (e.tele) e.stun = Math.max(e.stun || 0, 0.35);
          hurt(G, d, tr, e, (tr.def.dmg * lvMul(tr) + ((tr.lv || 1) >= 3 ? 25 : 0)) * (1 + 0.15 * d.up.bld) * d.mod.atk, { pierce: tr.def.pierce || 0.5 });
          fx(d, 'push', tr.x, tr.y, 0.32); snd(d, 'push');
          if (e.hp <= 0) return;
        }
        if (tr.def.slow) { const sl = tr.def.slow - 0.1 * ((tr.lv || 1) - 1); e.slow *= e.def.spr === 'd_boss' ? (1 + sl) / 2 : sl; if (tr.lv >= 3) { e.shredT = 2; e.shred = Math.max(e.shred || 0, 0.25); } }
        if (tr.def.dmg && !tr.def.push) { e.tt = (e.tt || 0) - DT; if (e.tt <= 0) { e.tt = tr.def.every; tr.hit = 0.3; hurt(G, d, tr, e, tr.def.dmg * lvMul(tr) * (1 + 0.15 * d.up.bld) * d.mod.atk, { pierce: tr.def.pierce || 0 }); fx(d, 'hit', e.x, e.y - 3, 0.17, { c: 'W' }); if (e.hp <= 0) return; } }
      }
    }
    const ranged = e.def.rng > 30, boss = e.def.spr === 'd_boss';
    if (e.rt <= 0 || (e.tg && e.tg.hp <= 0)) {
      e.rt = 0.35; e.tg = null;
      const agg = Math.max(e.def.rng + 8, 44); let bd = agg * agg;
      for (const u of d.units) { // 닿는 유닛, 또는 길 위에 서서 막는 유닛만 노린다
        if (u.hp <= 0) continue; const q = d2(e, u); if (q >= bd) continue;
        const reach = e.def.rng + u.r;
        if (q <= reach * reach ? !ranged || los(d, e, u) : !ranged && roadAt(d, u.x, u.y)) { bd = q; e.tg = u; }
      }
      if (!e.tg && (ranged || boss)) { // 흑마술사와 군주는 길가의 건물도 부순다
        const b = nearest(e, d.blds.filter((x) => x.def.kind !== 'trap'), e.def.rng + 12 + (boss ? 6 : 0));
        if (b && los(d, e, b)) e.tg = b;
      }
    }
    let t = e.tg;
    if (!t) { // 길을 따라 심장으로
      const cx = tx(e.x), cy = ty(e.y), en = d.ents[e.ent || 0] || d.ents[0]; let nx = en[0], ny = en[1];
      if (inG(cx, cy)) {
        const dv = d.dist[key(cx, cy)];
        for (const [dx, dy] of NB) { const ax = cx + dx, ay = cy + dy; if (inG(ax, ay) && d.dist[key(ax, ay)] === dv - 1 && dv > 0) { nx = ax; ny = ay; break; } }
      }
      if (DD.facAt(nx, ny) === 'h') t = d.heart;
      else {
        const blk = [d.occ[key(nx, ny)], inG(cx, cy) && d.occ[key(cx, cy)]].find((b) => b && b.def.kind !== 'trap'); // 함정은 막지 않는다
        if (blk && blk.hp > 0) t = blk; // 바리케이드
        else { const p = step2(e, tcx(nx), tcy(ny), e.def.spd * (e.spd || 1) * (e.slow || 1)); e.mv = !!p; if (p) { e.x = p[0]; e.y = p[1]; } return; }
      }
    }
    const reach = e.def.rng + t.r;
    if (d2(e, t) <= reach * reach) {
      e.mv = false; e.face = t.x >= e.x ? 1 : -1;
      if (e.cd <= 0) { e.cd = e.def.as; e.atkT = 0.3; strike(G, d, e, t, e.atk * (t.k === 'b' && (e.gim === 'ram' || e.gim === 'all') ? 4 : 1) * (G.hz === 'abyss' ? 1.3 : 1), e.def.splash, 'p2'); }
    } else {
      const p = step2(e, t.x, t.y, e.def.spd * (e.spd || 1) * (e.slow || 1));
      if (p && (t.k !== 'u' || roadAt(d, p[0], p[1]))) { e.x = p[0]; e.y = p[1]; e.mv = true; } else { e.tg = null; e.rt = 0.2; }
    }
  }

  function stepDungeon(G, d) {
    const inc = DD.income(d); d.gold += inc.g * DT; d.mat += inc.m * DT;
    const ms = d.mission;
    if (ms) { // 미션 판정: 웨이브를 다 잡으면 성공, 조건을 어기거나 다음 웨이브가 오면 실패
      const el = G.t - ms.t0, clear = el > 1 && !d.demons.length && !d.queue.length;
      const fail = G.wave !== ms.w || (ms.k === 'fast' && el > DD.MISSION.fast.t) || (ms.k === 'nodmg' && d.heart.hp < ms.hp0 - 0.5) || (ms.k === 'noloss' && d.lost > ms.lost0);
      if (fail || clear) { d.mission = null; if (!fail) { d.gold += ms.gold; d.nMission++; } G.events.push({ t: 'mission', d: d.i, ok: !fail, k: ms.k, gold: ms.gold }); }
    }
    if (d.heroT > 0) d.heroT -= DT;
    if (d.allyRace && d.allyCd > 0) d.allyCd -= DT;
    if (d.sosCd > 0) d.sosCd -= DT;
    if (d.invulnBldT > 0) d.invulnBldT = Math.max(0, d.invulnBldT - DT);
    for (const b of d.blds) {
      if (b.sealT > 0) b.sealT = Math.max(0, b.sealT - DT);
      if (b.def.kind === 'trap' && b.cd > 0) b.cd = Math.max(0, b.cd - DT);
    }
    const livingHs = d.units.filter((u) => u.hero && u.own === d.i && u.hp > 0);
    for (const hu of livingHs) if (hu.skCd > 0) hu.skCd = Math.max(0, hu.skCd - DT);
    d.skillT = livingHs.length ? Math.min(...livingHs.map((u) => u.skCd || 0)) : 0;
    if (d.alarmT > 0) d.alarmT -= DT;
    // 용족 영웅 화염 장판
    for (const z of d.zones) {
      z.t -= DT; z.tick -= DT;
      if (z.tick <= 0) {
        z.tick = 0.5;
        for (const e of d.demons) if (e.hp > 0 && !e.def.fly && d2(e, z) <= z.r * z.r) hurt(G, d, z.own, e, z.dps * 0.5);
      }
    }
    if (d.zones.some((z) => z.t <= 0)) d.zones = d.zones.filter((z) => z.t > 0);
    if (!d.demons.length && !d.queue.length) for (const b of d.blds) if (b.hp < b.mhp) b.hp = Math.min(b.mhp, b.hp + b.mhp * 0.03 * DT); // 전장이 비면 건물을 고친다
    while (d.queue.length && d.queue[0].at <= G.t) {
      const q = d.queue.shift(), def = DD.DEMONS[q.t], mhp = def.hp * q.hp * (q.elite ? 2.5 : 1);
      const en = d.ents[q.ent || 0] || d.ents[0], jx = (G.rnd() - 0.5) * 12, jo = G.rnd() * 6; // 입구가 난 벽 쪽 끝에서 나온다
      const sp = en[0] === 0 ? [C.OX + 6 + jo, tcy(en[1]) + jx] : en[0] === GW - 1 ? [C.OX + GW * T - 12 + jo, tcy(en[1]) + jx] : en[1] === 0 ? [tcx(en[0]) + jx, C.OY + 6 + jo] : [tcx(en[0]) + jx, C.OY + GH * T - 12 + jo];
      d.demons.push({ id: G.nid++, k: 'd', def, ent: q.ent || 0, x: sp[0], y: sp[1], hp: mhp, mhp, atk: def.atk * q.atk * (q.elite ? 1.25 : 1), spd: q.spd || 1, gm: (q.gm || 1) * (q.elite ? 5 : 1), elite: !!q.elite, arm: (q.arm || 0) * (q.elite ? 1.5 : 1), gim: q.gim || null, sc: [q.hp, q.atk], gt: 6, cd: 0, rt: G.rnd() * 0.3, tg: null, face: 1, hit: 0, r: q.t === 'boss' ? 12 : 7 });
      d.codex.demons[q.t] = 1;
      if (q.gim) d.codex.bosses[q.gim] = 1;
    }
    const drums = d.blds.filter((b) => b.def.haste), pools = d.blds.filter((b) => b.def.regen), warcrosses = d.blds.filter((b) => b.spec && b.spec.auraHaste);
    const poolRadMul = d.race === 'merfolk' && d.doc === 1 ? 1.2 : 1;
    d.maxUnits = Math.max(d.maxUnits || 0, d.units.filter((u) => u.own === d.i).length);
    // 유닛
    for (const u of d.units) {
      if (u.hit > 0) u.hit -= DT; u.cd -= DT; u.rt -= DT;
      if (u.shieldT > 0) u.shieldT -= DT; if (u.hasteT > 0) u.hasteT -= DT;
      const o = G.dungeons[u.own], cb = DD.sigCombo(u.sig);
      let reg = u.mhp * ((o.race === 'merfolk' ? (d.demons.length || d.queue.length ? 0.01 : 0.05) : 0) + (o.mod.regen || 0) + (!d.demons.length && !d.queue.length ? o.mod.allyRegen || 0 : 0) + (G.hz === 'forest' ? 0.02 : 0) + (has(u, 'mend') ? 0.015 : 0));
      if (cb && cb.id === 'guard+mend' && u.hp < u.mhp * 0.4) reg *= 2;
      if (G.hz === 'fire' && o.race !== G.st.home && roadAt(d, u.x, u.y)) u.hp = Math.max(1, u.hp - u.mhp * 0.02 * DT); // 용암 분출
      for (const p of pools) if (d2(u, p) < (p.def.rad * poolRadMul) ** 2) reg += p.def.regen;
      reg *= o.mod.healMul;
      if (reg && u.hp < u.mhp) u.hp = Math.min(u.mhp, u.hp + reg * DT);
      if (u.rush > 0) u.rush -= DT;
      if (u.stun > 0) { u.stun -= DT; u.mv = false; continue; } // 군주의 포효에 기절
      const home = { x: u.hx, y: u.hy }, heal = u.def.heal, ranged = u.def.rng > 30, ur = rngOf(G, d, u);
      const lmU = nearLandmark(G, u.x, u.y), windMul = lmU && lmU.id === 'wind' ? 1.15 : 1;
      const poolHaste = d.race === 'merfolk' && pools.some((p) => d2(u, p) < (p.def.rad * poolRadMul) ** 2) ? 1.15 : 1;
      const crossHaste = warcrosses.some((b) => d2(u, b) <= 72 * 72) ? 1.15 : 1;
      if (u.rt <= 0) {
        u.rt = 0.3; u.tg = null; u.fast = drums.some((b) => d2(u, b) < b.def.rad * b.def.rad);
        if (heal) {
          let br = 0.95;
          for (const a of d.units) if (a !== u && a.hp > 0 && a.hp / a.mhp < br && d2(a, home) < 120 * 120) { br = a.hp / a.mhp; u.tg = a; }
        }
        if (!u.tg) {
          let bd = (u.hold ? ur + 6 : Math.max(ur + 12, 64)) ** 2;
          for (const e of d.demons) { if (e.hp <= 0 || (e.def.fly && !ranged)) continue; const q = d2(u, e); if (q < bd && (u.hold || d2(e, home) < 110 * 110) && (!ranged || e.def.fly || los(d, u, e))) { bd = q; u.tg = e; } }
        }
        if (!u.tg && !u.hold && !heal && d.alarmT > 0 && d2(u, d.heart) < 240 * 240) { // 심장 구원: 심장을 치는 악마에게 달려간다
          let bd = Infinity;
          for (const e of d.demons) { if (e.hp <= 0 || (e.def.fly && !ranged) || d2(e, d.heart) > 90 * 90) continue; const q = d2(u, e); if (q < bd) { bd = q; u.tg = e; } }
        }
      }
      const t = u.tg;
      const spdMul = o.mod.spd * (u.rush > 0 ? 1.6 : 1) * (u.hasteT > 0 ? 1.3 : 1) * (cb && cb.id === 'guard+swift' ? 1.25 : 1) * windMul * (G.hz === 'water' && o.race !== G.st.home ? 0.65 : 1);
      if (t && t.hp > 0) {
        const reach = ur + t.r, ally = t.k === 'u';
        if (d2(u, t) <= reach * reach) {
          u.mv = false; u.face = t.x >= u.x ? 1 : -1;
          if (u.cd <= 0) {
            u.cd = u.def.as / ((u.fast ? 1.25 : 1) * (u.rush > 0 ? 1.6 : 1) * (u.hasteT > 0 ? 1.3 : 1) * (has(u, 'swift') ? 1.2 : 1) * (cb && cb.id === 'reach+swift' ? 1.15 : 1) * windMul * poolHaste * crossHaste);
            u.atkT = 0.3;
            const uCol = u.ally ? DD.RACES[u.ally].color : o.R.color;
            if (ally) { t.hp = Math.min(t.mhp, t.hp + heal * o.mod.atk * (1 + 0.1 * o.up.atk) * o.mod.healMul); shoot(d, u, t, 'heal', 'n1'); fx(d, 'heal', t.x, t.y - 12, 0.4, { c: 'n1' }); snd(d, 'heal'); }
            else strike(G, d, u, t, unitAtk(G, d, u), u.def.splash || (has(u, 'burst') ? 12 : 0), uCol);
          }
        } else if (!u.hold) moveUnit(d, u, t.x, t.y, u.def.spd * spdMul);
        else moveUnit(d, u, u.hx, u.hy, u.def.spd * spdMul);
      } else moveUnit(d, u, u.hx, u.hy, u.def.spd * spdMul);
      if (u.atkT > 0) u.atkT -= DT;
    }
    // 탑 (아군 탑은 벽 너머로도 사격 가능, 표적 우선순위 및 성벽/지형/미로 가호/Lv3 특화 적용)
    const mazeHaste = d.boons.includes('mazehaste') ? 1 + 0.04 * Math.floor(d.path.length / 10) : 1;
    const medalMul = 1 + 0.05 * (G.medals || 0);
    for (const b of d.blds) {
      if (b.hit > 0) b.hit -= DT;
      if (b.def.kind !== 'tower') continue;
      if (b.sealT > 0) continue; // 군주의 2페이즈 봉인 중에는 사격 정지
      b.cd -= DT;
      if (b.cd <= 0) {
        const sp = b.spec || null;
        const wallBuff = d.race === 'human' && nearWall(d, b.cx, b.cy);
        const lmB = nearLandmark(G, b.x, b.y);
        const rg = b.def.rng * (1 + 0.1 * ((b.lv || 1) - 1)) * d.mod.trng * (wallBuff ? 1.12 : 1) * (lmB && lmB.id === 'watch' ? 1.15 : 1) * (sp && sp.rngMul ? sp.rngMul : 1);
        const r2 = rg * rg, tm = b.tmode || 0;
        let t = null, best = Infinity;
        for (const e of d.demons) {
          if (e.hp <= 0) continue; const q = d2(b, e); if (q >= r2) continue;
          let sc = prog(d, e) * 1e5 + q;
          if (tm === 1) sc = -e.hp * 1e4 + prog(d, e);
          else if (tm === 2) sc = (e.def.fly ? 0 : 1e8) + prog(d, e) * 1e4 + q;
          else if (tm === 3) sc = (e.def.rng > 30 ? 0 : 1e8) + prog(d, e) * 1e4 + q;
          if (sc < best) { best = sc; t = e; }
        }
        if (t) {
          b.cd = (b.def.as / mazeHaste) * (sp && sp.asMul ? sp.asMul : 1);
          let atkB = b.def.atk * lvMul(b) * (1 + 0.15 * d.up.bld) * d.mod.atk * d.mod.tatk * medalMul * (wallBuff ? 1.15 : 1) * (lmB && lmB.id === 'rift' ? 1.25 : 1) * (sp && sp.atkMul ? sp.atkMul : 1);
          if (sp && sp.flyMul && t.def.fly) atkB *= sp.flyMul;
          const spl = (b.def.splash || 0) + (sp && sp.splashAdd ? sp.splashAdd : 0);
          const col = sp ? sp.col : d.R.color;
          strike(G, d, b, t, atkB, spl, col, sp && sp.pierce ? { pierce: sp.pierce } : null);
          if (sp) {
            if (sp.id === 'ballista' || sp.id === 'prism' || sp.id === 'volt') fx(d, 'specbeam', b.x, b.y - 6, 0.2, { tx: t.x, ty: t.y - 4, c: col, zig: sp.id === 'volt' });
            else if (sp.id === 'chrono' || sp.id === 'snare' || sp.id === 'breath' || sp.id === 'meteor' || sp.id === 'cannon') fx(d, 'specring', t.x, t.y, 0.26, { r: spl || (sp.id === 'chrono' ? 24 : 16), c: col });
            else if (sp.id === 'warcross') fx(d, 'specring', b.x, b.y, 0.22, { r: 24, c: col });
          }
          const applySpecDebuff = (en) => {
            if (!sp || !en || en.hp <= 0) return;
            const tough = !!en.gim || en.def.spr === 'd_boss';
            if (sp.burn) { en.burnT = Math.max(en.burnT || 0, 3); en.burnDps = Math.max(en.burnDps || 0, en.mhp * sp.burn * d.mod.burnMul * (tough ? 0.35 : 1)); }
            if (sp.shred) { en.shredT = Math.max(en.shredT || 0, 3); en.shred = Math.max(en.shred || 0, sp.shred); }
            if (sp.slow) { en.slowT = Math.max(en.slowT || 0, 2); en.slowMul = Math.min(en.slowMul || 1, tough ? (1 + sp.slow) / 2 : sp.slow); }
            if (sp.push1 && !en.gim && !en.def.fly && G.rnd() < 0.35) pushDemonBack(d, en, 1);
          };
          applySpecDebuff(t);
          if (spl) for (const o of d.demons) if (o !== t && o.hp > 0 && d2(o, t) < spl * spl) applySpecDebuff(o);
          if (sp && sp.chain) {
            let ex = 0;
            for (const o of d.demons) if (o !== t && o.hp > 0 && d2(b, o) <= r2) {
              shoot(d, b, o, SHOT[d.race], col);
              fx(d, 'specbeam', b.x, b.y - 6, 0.22, { tx: o.x, ty: o.y - 4, c: col, zig: sp.id === 'volt' });
              hurt(G, d, b, o, atkB * 0.65, sp.pierce ? { pierce: sp.pierce } : null);
              applySpecDebuff(o);
              if (++ex >= sp.chain) break;
            }
          }
        } else b.cd = 0.2;
      }
    }
    // 악마
    for (const e of d.demons) {
      if (e.hp <= 0) continue;
      if (e.hit > 0) e.hit -= DT; e.cd -= DT; e.rt -= DT;
      demonStep(G, d, e);
      if (e.atkT > 0) e.atkT -= DT;
      e.px = e.x; e.py = e.y;
    }
    sep(d.units, 11); sep(d.demons, 9);
    for (const e of d.demons) if (!roadAt(d, e.x, e.y)) { e.x = e.px; e.y = e.py; } // 밀려도 길 밖으로는 나가지 않는다
    for (const e of d.units) { e.x = Math.max(C.OX + 4, Math.min(C.OX + GW * T - 4, e.x)); e.y = Math.max(C.OY + 6, Math.min(C.OY + GH * T - 2, e.y)); }
    // 정리
    if (d.demons.some((e) => e.hp <= 0)) d.demons = d.demons.filter((e) => e.hp > 0);
    if (d.units.some((u) => u.hp <= 0)) {
      d.units.forEach((u) => { if (u.hp <= 0) { if (u.own === d.i) d.lost++; fx(d, 'dust', u.x, u.y, 0.42, { c: 's' }); snd(d, 'udie'); if (u.hero) G.events.push({ t: 'herodead', d: d.i, name: u.hero.name }); } });
      d.units = d.units.filter((u) => u.hp > 0);
    }
    if (d.blds.some((b) => b.hp <= 0)) {
      d.blds.forEach((b) => { if (b.hp <= 0) { for (const [x, y] of DD.bldTiles(b.def, b.cx, b.cy)) delete d.occ[key(x, y)]; fx(d, 'collapse', b.x, b.y, 0.6); snd(d, 'bfall'); } });
      d.blds = d.blds.filter((b) => b.hp > 0); recount(d);
    }
    for (const s of d.shots) s.t -= DT; for (const f of d.fx) f.t -= DT;
    if (d.shots.some((s) => s.t <= 0)) d.shots = d.shots.filter((s) => s.t > 0);
    if (d.fx.some((f) => f.t <= 0)) d.fx = d.fx.filter((f) => f.t > 0);
    if (d.heart.hit > 0) d.heart.hit -= DT;
    if (G.tutorial && G.t < 300 && d.heart.hp < 250) d.heart.hp = 250; // 튜토리얼 5분 동안은 심장이 무너지지 않는다
    if (d.heart.hp <= 0) fall(G, d);
    else if (d.bot) {
      if (d.helpedByHuman && !d.demons.length && !d.queue.length) {
        d.helpedByHuman = false;
        if (G.medals < 5 && d.medalW !== G.wave) { d.medalW = G.wave; G.medals++; G.events.push({ t: 'medal', d: d.i, n: G.medals }); }
      }
      d.botT -= DT; if (d.botT <= 0) { d.botT = 0.6; DD.botThink(G, d); }
    }
  }

  function fall(G, d) {
    d.alive = false; d.heart.hp = 0;
    const rest = G.dungeons.filter((x) => x.alive);
    rest.forEach((x) => (x.share += d.share / rest.length)); // 무너진 던전의 몫이 생존자에게 넘어간다
    const left = d.queue.concat(d.demons.map((e) => ({ at: G.t + 3, t: Object.keys(DD.DEMONS).find((k) => DD.DEMONS[k] === e.def), hp: e.mhp / e.def.hp, atk: e.atk / e.def.atk })));
    left.forEach((q, i) => { if (rest.length) { const x = rest[i % rest.length]; x.queue.push(Object.assign({}, q, { at: Math.max(q.at, G.t + 3) })); } });
    rest.forEach((x) => x.queue.sort((a, b) => a.at - b.at));
    d.demons = []; d.queue = []; d.units = []; d.shots = [];
    G.events.push({ t: 'fall', d: d.i });
    if (d.i === G.human || !rest.length) { G.over = true; G.win = false; }
  }

  // 다음 웨이브(또는 마지막 웨이브 뒤의 종료)까지 건너뛸 수 있는 초. 악마가 남아 있으면 0
  DD.canCall = function (G) {
    if (G.over || G.dungeons.some((d) => d.alive && (d.demons.length || d.queue.length))) return 0;
    const left = G.nextWaveIn() - 0.5; return left > 2 ? left : 0;
  };
  function step(G) {
    if (G.over) return;
    G.t += DT;
    if (G.haz) { // 지형 현상 (발동 3.5초 전 경고)
      const h = G.haz;
      if (h.left > 0) {
        h.left -= DT; G.hazWarn = null;
        if (h.left <= 0) { h.warned = false; G.events.push({ t: 'hazEnd' }); }
      } else {
        if (!h.warned && h.next - G.t <= 3.5) { h.warned = true; G.hazWarn = G.st.id; G.events.push({ t: 'hazWarn', id: G.st.id }); }
        if (G.t >= h.next) { h.left = DD.HAZ_T.len; h.next = G.t + (G.hasOath('wildhaz') ? Math.round(DD.HAZ_T.every * 0.5) : DD.HAZ_T.every); h.warned = false; G.hazWarn = null; G.events.push({ t: 'haz', id: G.st.id }); }
      }
      G.hz = h.left > 0 ? G.st.id : null;
    }
    if ((G.endless || G.wave < C.WAVES) && G.t >= C.FIRST_WAVE + G.wave * C.WAVE_T) {
      G.wave++;
      if (G.nEnt > 1 && G.thrust[G.wave + 1] == null) G.thrust[G.wave + 1] = Math.floor(G.rnd() * G.nEnt);
      if (G.endless && G.wave > C.WAVES) {
        const ks = Object.keys(DD.MUTS);
        if (G.wave % 5) {
          G.muts[G.wave] = ks[Math.floor(G.rnd() * ks.length)];
          if (G.wave >= 25) {
            const ks2 = ks.filter((k) => k !== G.muts[G.wave]);
            G.muts2[G.wave] = ks2[Math.floor(G.rnd() * ks2.length)];
          }
        }
        if (G.wave >= 25 && G.wave % 5 === 0) {
          const hd = G.dungeons[G.human];
          if (hd && hd.alive) {
            const others = DD.RACE_IDS.filter((r) => r !== hd.race), ar = others[Math.floor(G.rnd() * others.length)];
            const pick = DD.RACES[ar].heroes[Math.floor(G.rnd() * DD.RACES[ar].heroes.length)];
            const gi = G.wave >= 30 ? 2 : 1, role = DD.HERO_ROLES[pick[1]], gr = DD.GRADES[gi];
            const def = Object.assign({}, role, { name: pick[0], tier: 4, hp: role.hp * gr.mul, atk: role.atk * gr.mul, heal: role.heal ? role.heal * gr.mul : 0, spr: DD.heroSpr(ar, pick[1]) });
            const hu = addUnit(G, hd, def, { name: pick[0], grade: gi, role: pick[1] });
            hu.skCd = 0; hu.ally = ar;
            G.events.push({ t: 'endlessMile', w: G.wave, name: pick[0], race: ar, grade: gr.id });
          }
        }
      }
      G.dungeons.forEach((d) => { setCaps(G, d); if (d.alive) { d.wavesCleared = G.wave - 1; spawnWave(G, d, G.wave); } });
      for (const d of G.dungeons) if (d.alive && !d.bot && !G.tutorial && G.wave >= 2 && G.wave % 5 && G.rnd() < 0.5) {
        const ks = Object.keys(DD.MISSION), k = ks[Math.floor(G.rnd() * ks.length)];
        d.mission = { k, w: G.wave, t0: G.t, hp0: d.heart.hp, lost0: d.lost, gold: DD.missionGold(G.wave) }; G.events.push({ t: 'missionNew', d: d.i, k });
      }
      if (!G.tutorial && !G.endless && [4, 8, 12, 16].includes(G.wave)) {
        const hd = G.dungeons[G.human];
        if (hd && hd.alive && !hd.eventPick && !hd.boonPick) {
          const pool = DD.CHRONICLE_EVENTS.filter((e) => !(hd.usedEvents || []).includes(e.id));
          const ev = pool.length ? pool[Math.floor(G.rnd() * pool.length)] : DD.CHRONICLE_EVENTS[Math.floor(G.rnd() * DD.CHRONICLE_EVENTS.length)];
          hd.usedEvents.push(ev.id);
          hd.eventPick = ev;
          G.events.push({ t: 'event', d: hd.i });
        }
      }
      G.events.push({ t: 'wave', w: G.wave, mut: G.muts[G.wave] || null, mut2: G.muts2[G.wave] || null });
    }
    for (const d of G.dungeons) if (d.alive) stepDungeon(G, d);
    if (!G.over && !G.endless && G.t >= G.endT) { G.over = true; G.win = true; G.dungeons.forEach((d) => d.alive && (d.wavesCleared = C.WAVES)); }
  }

  // ── 봇(동맹 AI 겸 밸런스 시험용). 어떤 길 모양에서도 자리를 스스로 찾는다 ──
  function spots(d, kind) {
    const free = (cx, cy) => !d.occ[key(cx, cy)];
    if (kind === 'wall') return d.path.slice(1, 5).filter(([x, y]) => free(x, y));
    const out = [];
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
      if (d.grid[key(cx, cy)] !== 0 || !free(cx, cy) || DD.facAt(cx, cy)) continue;
      let best = 99, bi = 0;
      d.path.forEach(([px, py], i) => { const m = Math.abs(px - cx) + Math.abs(py - cy); if (m < best) { best = m; bi = i; } });
      out.push({ cx, cy, adj: best, off: Math.abs(bi - d.path.length * 0.45), plot: DD.isPlot(cx, cy) });
    }
    if (kind === 'tower') out.sort((a, b) => a.adj - b.adj || a.off - b.off);
    else out.sort((a, b) => (b.plot - a.plot) || b.adj - a.adj);
    return out.map((o) => [o.cx, o.cy]);
  }
  DD.botThink = function (G, d) {
    const R = d.R, can = (c) => d.gold >= c.g && d.mat >= c.m;
    if (d.heroT <= 0) { G.cmd(d.i, { a: 'hero' }); return; }
    if ((d.heartE || 0) >= 100 && (d.demons.length >= 16 || d.heart.hp < d.heart.mhp * 0.75 || d.demons.some((e) => e.def.spr === 'd_boss'))) { G.cmd(d.i, { a: 'pulse' }); return; }
    if (d.skillT <= 0 && d.demons.length >= 8 && d.units.some((u) => u.hero && u.own === d.i)) G.cmd(d.i, { a: 'skill' });
    const own = d.units.filter((u) => u.own === d.i);
    const build = (bi, kind, max) => {
      const b = R.blds[bi], n = d.bc[b.id] || 0;
      if (n >= max) return false;
      const bc = DD.bldCost(d, b); if (d.mat < bc.m) return false; if (d.gold < bc.g) return true; // 골드만 모자라면 저축
      const s = spots(d, kind).find((q) => !DD.buildErr(d, b, q[0], q[1]));
      if (s) G.cmd(d.i, { a: 'build', b: bi, cx: s[0], cy: s[1] });
      return !!s;
    };
    const w = G.wave;
    if (own.length >= 4 && build(0, 'far', 1)) return;
    if (w >= 2 && build(4, 'far', d.race === 'merfolk' || d.race === 'dragon' ? 2 : 1)) return;
    if (w >= 3 && build(2, 'tower', Math.min(6, Math.floor(w / 2)))) return;
    if (w >= 4 && build(6, 'wall', 1)) return;
    if (w >= 5 && build(5, 'wall', 1)) return;
    if (w >= 7 && build(7, 'wall', 1)) return;
    if (w >= 5 && own.length >= 8 && build(1, 'far', 1)) return;
    if (w >= 6 && build(3, 'wall', 3)) return;
    if (w >= 9) { const tb = d.blds.find((b) => b.def.kind === 'tower' && DD.bldUpCost(d, b)), tc = tb && DD.bldUpCost(d, tb); if (tc && can({ g: tc.g + 200, m: tc.m })) { G.cmd(d.i, { a: 'upb', id: tb.id, spec: G.rnd() < 0.5 ? 1 : 0 }); return; } }
    if (w >= 8 && d.altarLv < 3) { const c = DD.upCost(d, 'altar'); if (c && can({ g: c.g + 100, m: c.m })) { G.cmd(d.i, { a: 'up', k: 'altar' }); return; } }
    for (const k of d.up.atk <= d.up.hp ? ['atk', 'hp'] : ['hp', 'atk']) {
      const c = DD.upCost(d, k);
      if (c && own.length >= 8 + d.up[k] * 2 && can({ g: c.g + 60, m: c.m })) { G.cmd(d.i, { a: 'up', k }); return; }
    }
    const wantMerge = own.length >= d.pop || (d.race === 'spirit' && own.length >= 10);
    if (wantMerge && DD.mergePlan(d) && !G.cmd(d.i, { a: 'merge', pick: G.rnd() < 0.5 ? 1 : 0 })) return; // 인구가 차거나 정령족이면 조합으로 질을 올린다
    for (let ui = 2; ui >= 0; ui--) {
      const altP = d.race === 'human' ? 0.2 : d.race === 'merfolk' ? 0.35 : 0.5;
      const pickIdx = ui === 1 && G.rnd() < altP && !DD.reqFail(d, R.units[3]) ? 3 : ui;
      const u = R.units[pickIdx];
      if (DD.reqFail(d, u)) continue;
      if (ui === 0 && own.length >= (d.race === 'beast' ? 24 : 16) && !DD.reqFail(d, R.units[1])) continue;
      if (ui < 2 && own.length >= d.pop - 4 && !DD.reqFail(d, R.units[2])) continue;
      if (can(DD.unitCost(d, u))) { if (!G.cmd(d.i, { a: 'summon', u: pickIdx })) return; }
      else if (ui === 2 && own.length >= (d.race === 'beast' ? 18 : 12)) return; // 상위 유닛 저축
    }
    if (own.length >= d.pop && d.gold > 400) { const weak = own.find((u) => u.def.tier === 1); if (weak) weak.hp = 0; }
  };

  // ── 전투 중 자동 저장 / 이어하기 스냅샷 (순수 JSON 직렬화 + 참조 복원) ──
  function encodeUnitDef(d, u) {
    if (u.hero) return { k: 'hero', def: u.def };
    const r = u.ally || d.race, R = DD.RACES[r];
    if (u.def.legend || u.def === R.legend) return { k: 'legend', r };
    const idx = R.units.indexOf(u.def);
    if (idx >= 0) return { k: 'unit', r, idx };
    for (const rid of DD.RACE_IDS) {
      const i = DD.RACES[rid].units.indexOf(u.def);
      if (i >= 0) return { k: 'unit', r: rid, idx: i };
      if (DD.RACES[rid].legend === u.def) return { k: 'legend', r: rid };
    }
    return { k: 'hero', def: u.def };
  }
  function decodeUnitDef(ref) {
    if (!ref) return DD.RACES.human.units[0];
    if (ref.k === 'legend' && DD.RACES[ref.r]) return DD.RACES[ref.r].legend;
    if (ref.k === 'unit' && DD.RACES[ref.r] && DD.RACES[ref.r].units[ref.idx]) return DD.RACES[ref.r].units[ref.idx];
    return ref.def || DD.RACES.human.units[0];
  }
  DD.saveSnapshot = function (G) {
    if (!G || G.tutorial || G.over) return null;
    const demonKeys = Object.keys(DD.DEMONS);
    return {
      v: 1, t: G.t, wave: G.wave, stage: G.stage, diff: G.diff, endless: G.endless,
      muts: G.muts, muts2: G.muts2, thrust: G.thrust, hz: G.hz, haz: G.haz, hazWarn: G.hazWarn,
      oaths: G.oaths, medals: G.medals, nid: G.nid, human: G.human, nEnt: G.nEnt, layout: G.layout, endT: G.endT,
      rngState: G.rnd && G.rnd.state ? G.rnd.state() : 1,
      dungeons: G.dungeons.map((d) => ({
        i: d.i, race: d.race, bot: d.bot, alive: d.alive, doc: d.doc, allyRace: d.allyRace, allyCd: d.allyCd, sosCd: d.sosCd, noWall: d.noWall,
        gold: d.gold, mat: d.mat, kills: d.kills, up: d.up, rallyU: d.rallyU, rallyH: d.rallyH, altarLv: d.altarLv,
        heroN: d.heroN, nSum: d.nSum, nBld: d.nBld, share: d.share, slot: d.slot, botT: d.botT, wavesCleared: d.wavesCleared, lost: d.lost,
        skillT: d.skillT, nMerge: d.nMerge, nLegend: d.nLegend, nRank2: d.nRank2, bossKills: d.bossKills, eliteKills: d.eliteKills,
        trapKills: d.trapKills, nMission: d.nMission, nCall: d.nCall, mission: d.mission,
        maxUnits: d.maxUnits, maxBeams: d.maxBeams, maxDefBlds: d.maxDefBlds, ambushHits: d.ambushHits, maxPath: d.maxPath,
        heartE: d.heartE, invulnBldT: d.invulnBldT, usedEvents: d.usedEvents, chronicle: d.chronicle, nextWaveMod: d.nextWaveMod,
        mvp: d.mvp, roadBonus: d.roadBonus, wallBonus: d.wallBonus, helpedByHuman: d.helpedByHuman, medalW: d.medalW,
        pushN: d.pushN || 0, pulseN: d.pulseN || 0, specIds: d.specIds || [], nImprint: d.nImprint || 0,
        pop: d.pop, boons: d.boons, boonPick: d.boonPick, stats: d.stats, codex: d.codex, mod: d.mod,
        heroT: d.heroT, heart: d.heart, ents: d.ents, roadCap0: d.roadCap0, roadCap: d.roadCap, wallCap: d.wallCap, alarmT: d.alarmT || 0,
        eventPickId: d.eventPick ? d.eventPick.id : null,
        grid: Array.from(d.grid),
        blueprint: d.blueprint ? Array.from(d.blueprint) : null,
        queue: d.queue,
        zones: d.zones.map((z) => ({ x: z.x, y: z.y, r: z.r, t: z.t, T: z.T, tick: z.tick, dps: z.dps, ownId: z.own ? z.own.id : null })),
        blds: d.blds.map((b) => {
          const o = Object.assign({}, b); delete o.def; delete o.spec;
          o._bi = d.R.blds.indexOf(b.def);
          o._si = b.spec ? DD.TOWER_SPECS[d.race].indexOf(b.spec) : -1;
          return o;
        }),
        units: d.units.map((u) => {
          const o = Object.assign({}, u); delete o.def;
          o._def = encodeUnitDef(d, u);
          return o;
        }),
        demons: d.demons.map((e) => {
          const o = Object.assign({}, e); delete o.def; delete o.tg;
          o._dk = demonKeys.find((k) => DD.DEMONS[k] === e.def) || 'imp';
          return o;
        }),
      })),
    };
  };
  DD.loadSnapshot = function (snap) {
    if (!snap || snap.v !== 1 || !Array.isArray(snap.dungeons) || !snap.dungeons.length) return null;
    const hIdx = Math.max(0, snap.human || 0), hRace = snap.dungeons[hIdx] ? snap.dungeons[hIdx].race : 'human';
    const st = DD.stageOf(hRace, snap.stage || 0);
    const oaths = (snap.oaths || []).slice(0, 3);
    const G = {
      t: snap.t || 0, wave: snap.wave || 0, over: false, win: false, stage: snap.stage || 0, tutorial: false,
      diff: snap.diff == null ? 1 : snap.diff, muts: snap.muts || {}, muts2: snap.muts2 || {}, thrust: snap.thrust || {},
      endless: !!snap.endless, hz: snap.hz || null, haz: snap.haz || null, hazWarn: snap.hazWarn || null,
      oaths, hasOath: (id) => oaths.includes(id), medals: snap.medals || 0, st,
      D: DD.DIFFS[snap.diff == null ? 1 : snap.diff] || DD.DIFFS[1],
      nEnt: snap.nEnt || 1, layout: snap.layout || 'top', endT: snap.endT || (C.FIRST_WAVE + C.WAVES * C.WAVE_T),
      rnd: rng(snap.rngState || 1), nid: snap.nid || 1, dungeons: [], events: [], human: hIdx,
    };
    DD.setLayout(G.layout);
    C.LANDMARKS = DD.LANDMARKS[G.st.id] ? DD.LANDMARKS[G.st.id].pos : [];
    G.dungeons = snap.dungeons.map((ds) => {
      const R = DD.RACES[ds.race];
      const d = Object.assign({}, ds, {
        R, shots: [], fx: [], snd: {}, occ: {}, bc: {}, ver: 0, walls: 0, beams: [],
        eventPick: ds.eventPickId ? (DD.CHRONICLE_EVENTS.find((x) => x.id === ds.eventPickId) || null) : null,
        blueprint: ds.blueprint ? Uint8Array.from(ds.blueprint) : null,
      });
      delete d.eventPickId;
      d.units = (ds.units || []).map((u) => { const o = Object.assign({}, u, { def: decodeUnitDef(u._def) }); delete o._def; return o; });
      d.blds = (ds.blds || []).map((b) => {
        const def = R.blds[b._bi >= 0 ? b._bi : 0];
        const spec = b._si >= 0 && DD.TOWER_SPECS[d.race] ? DD.TOWER_SPECS[d.race][b._si] : null;
        const o = Object.assign({}, b, { def });
        if (spec) o.spec = spec;
        delete o._bi; delete o._si;
        return o;
      });
      d.demons = (ds.demons || []).map((e) => { const o = Object.assign({}, e, { def: DD.DEMONS[e._dk] || DD.DEMONS.imp, tg: null, rt: 0 }); delete o._dk; return o; });
      d.zones = (ds.zones || []).map((z) => { const o = Object.assign({}, z, { own: z.ownId != null ? (d.units.find((u) => u.id === z.ownId) || null) : null }); delete o.ownId; return o; });
      const gr = Uint8Array.from(ds.grid);
      applyGrid(d, gr);
      d.walls = DD.gridCount(gr).wall;
      for (const b of d.blds) for (const [x, y] of DD.bldTiles(b.def, b.cx, b.cy)) d.occ[key(x, y)] = b;
      recount(d);
      setCaps(G, d);
      return d;
    });
    G.step = () => step(G);
    G.cmd = (di, c) => cmd(G, G.dungeons[di], c);
    G.nextWaveIn = () => (!G.endless && G.wave >= C.WAVES ? G.endT - G.t : C.FIRST_WAVE + G.wave * C.WAVE_T - G.t);
    return G;
  };
})(typeof window !== 'undefined' ? window : globalThis);
