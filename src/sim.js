// 시뮬레이션 (DOM 없음, Node에서도 실행). 모든 플레이어 조작은 game.cmd(dungeonIdx, {...}) 한 곳으로 들어온다.
(function (g) {
  const DD = (g.DD = g.DD || {});
  const C = DD.C, T = C.TILE, GW = C.GW, GH = C.GH;
  const DT = 0.05;
  DD.DT = DT;
  C.HEART = { x: C.OX + C.HEART_T[0] * T + 12, y: C.OY + C.HEART_T[1] * T + 12 };
  C.SUMMON = { x: C.OX + C.SUMMON_T[0] * T + 12, y: C.OY + C.SUMMON_T[1] * T + 12 };
  C.ALTAR = { x: C.OX + C.ALTAR_T[0] * T + 12, y: C.OY + C.ALTAR_T[1] * T + 12 };

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const d2 = (a, b) => { const x = a.x - b.x, y = a.y - b.y; return x * x + y * y; };
  const key = (cx, cy) => cx + cy * GW;
  const inG = (cx, cy) => cx >= 0 && cy >= 0 && cx < GW && cy < GH;
  const is = (t, cx, cy) => t[0] === cx && t[1] === cy;
  const tcx = (cx) => C.OX + cx * T + 12, tcy = (cy) => C.OY + cy * T + 12;
  const tx = (x) => Math.floor((x - C.OX) / T), ty = (y) => Math.floor((y - C.OY) / T);
  DD.tileAt = (x, y) => [tx(x), ty(y)];
  DD.isPlot = (cx, cy) => C.PLOTS.some((p) => is(p, cx, cy));
  // 고정 칸: 심장·소환소·제단·거점은 길이나 벽으로 바꿀 수 없다. 입구 칸은 언제나 길이다.
  DD.isFixed = (cx, cy) => is(C.HEART_T, cx, cy) || is(C.SUMMON_T, cx, cy) || is(C.ALTAR_T, cx, cy) || DD.isPlot(cx, cy);
  const NB = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  // ── 던전 격자: 0 바닥(건물 자리), 1 길(악마가 걷는 칸), 2 벽(통과·사격 불가) ──
  DD.defaultGrid = function () {
    const gr = new Uint8Array(GW * GH);
    // 기본 길은 ㄹ 모양: 입구(아래 가운데) → 왼쪽 → 위 → 오른쪽으로 가로질러 → 위 → 심장(위 가운데)
    const mx = C.ENT_T[0], L = 3, R = GW - 4, row = (y, a, b) => { for (let x = a; x <= b; x++) gr[key(x, y)] = 1; }, col = (x, a, b) => { for (let y = a; y <= b; y++) gr[key(x, y)] = 1; };
    col(mx, GH - 2, GH - 1); row(GH - 3, L, mx); col(L, GH >> 1, GH - 3); row(GH >> 1, L, R); col(R, 2, GH >> 1); row(2, mx, R); col(mx, 1, 2);
    return gr;
  };
  function flow(gr) { // 심장에서 길을 따라 퍼지는 거리. -1은 심장에 닿지 않는 칸
    const dist = new Int16Array(GW * GH).fill(-1), q = [C.HEART_T];
    dist[key(C.HEART_T[0], C.HEART_T[1])] = 0;
    for (let i = 0; i < q.length; i++) {
      const [cx, cy] = q[i], dv = dist[key(cx, cy)];
      for (const [dx, dy] of NB) { const nx = cx + dx, ny = cy + dy; if (inG(nx, ny) && gr[key(nx, ny)] === 1 && dist[key(nx, ny)] < 0) { dist[key(nx, ny)] = dv + 1; q.push([nx, ny]); } }
    }
    return dist;
  }
  DD.gridCount = (gr) => { let r = 0, w = 0; for (const v of gr) { if (v === 1) r++; else if (v === 2) w++; } return { road: r, wall: w }; };
  DD.gridCheck = function (gr) { // 규칙 위반 사유 또는 null
    if (gr.length !== GW * GH) return '격자 크기가 다릅니다';
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) if (DD.isFixed(cx, cy) && gr[key(cx, cy)]) return '바꿀 수 없는 칸';
    if (gr[key(C.ENT_T[0], C.ENT_T[1])] !== 1) return '입구는 길이어야 한다';
    const n = DD.gridCount(gr);
    if (n.road > C.ROAD_MAX) return `길 타일 한도 초과 (${C.ROAD_MAX})`;
    if (n.wall > C.WALL_MAX) return `벽 타일 한도 초과 (${C.WALL_MAX})`;
    if (flow(gr)[key(C.ENT_T[0], C.ENT_T[1])] < 0) return '입구와 심장은 이어져 있어야 합니다.';
    return null;
  };
  function pathOf(dist) { // 입구에서 심장까지의 최단 경로(끊겨 있으면 빈 배열)
    const path = []; let [cx, cy] = C.ENT_T;
    while (dist[key(cx, cy)] > 0) {
      path.push([cx, cy]);
      const dv = dist[key(cx, cy)]; let nx = -1, ny = -1;
      for (const [dx, dy] of NB) { const ax = cx + dx, ay = cy + dy; if (inG(ax, ay) && dist[key(ax, ay)] === dv - 1) { nx = ax; ny = ay; break; } }
      cx = nx; cy = ny;
    }
    return path;
  }
  DD.gridPath = (gr) => { const dist = flow(gr); return { dist, path: pathOf(dist) }; }; // 편집 초안 미리보기용
  // 진행 중인 요새에 격자 전체를 적용할 수 있는가. 사유 또는 null
  DD.gridErr = function (d, gr) {
    const e0 = DD.gridCheck(gr); if (e0) return e0;
    for (const b of d.blds) if (gr[key(b.cx, b.cy)] !== (b.def.kind === 'wall' ? 1 : 0)) return '건물 아래 칸은 바꿀 수 없습니다';
    const nd = flow(gr);
    for (const e of d.demons) { const ex = tx(e.x), ey = ty(e.y); if (inG(ex, ey) && nd[key(ex, ey)] < 0) return '악마가 서 있는 길도 심장과 이어져 있어야 합니다'; }
    return null;
  };
  function applyGrid(d, gr) {
    d.grid = gr; d.dist = flow(gr); d.ver++;
    const path = pathOf(d.dist);
    d.path = path;
    // 기본 배치: 근접은 길 중간 두 칸, 원거리는 바로 뒤(심장 쪽) 세 칸(칸마다 여섯 자리)
    const L = path.length, a = Math.max(0, Math.min(L - 2, Math.floor(L * 0.45)));
    d.sm = path.slice(a, a + 2); d.sr = path.slice(a + 2, a + 5).length ? path.slice(a + 2, a + 5) : d.sm;
  }
  function los(d, a, b) { // 벽이 사격을 막는가
    if (!d.walls) return true;
    const dx = b.x - a.x, dy = b.y - a.y, n = Math.ceil(Math.hypot(dx, dy) / 8);
    for (let i = 1; i < n; i++) { const cx = tx(a.x + (dx * i) / n), cy = ty(a.y + (dy * i) / n); if (inG(cx, cy) && d.grid[key(cx, cy)] === 2) return false; }
    return true;
  }

  // 전체 지도(6px 칸, 92×60칸)에서 던전의 자리. k: 방 회전(0 입구가 아래, 1 오른쪽, 2 위, 3 왼쪽), cor: 게이트→입구 회랑
  const SLOT = {
    N: { x0: 34, y0: 0, k: 0, cor: [[45, 24], [45, 15]] }, E: { x0: 73, y0: 19, k: 3, cor: [[51, 30], [72, 30]] },
    S: { x0: 34, y0: 45, k: 2, cor: [[45, 36], [45, 44]] }, W: { x0: 4, y0: 19, k: 1, cor: [[39, 30], [19, 30]] },
    SE: { x0: 60, y0: 45, k: 2, cor: [[45, 36], [45, 43], [71, 43], [71, 44]] }, SW: { x0: 9, y0: 45, k: 2, cor: [[45, 36], [45, 43], [20, 43], [20, 44]] },
  };
  DD.worldSlots = (n) => ({ 1: ['N'], 2: ['N', 'S'], 3: ['N', 'E', 'W'], 4: ['N', 'E', 'S', 'W'], 5: ['N', 'E', 'SE', 'SW', 'W'] }[n].map((s) => SLOT[s]));
  // 방 안 칸 좌표(벽 포함, 실수 가능) → 전체 지도 칸 좌표
  DD.worldCell = (s, lx, ly) => (s.k === 0 ? [s.x0 + lx, s.y0 + ly] : s.k === 2 ? [s.x0 + GW + 2 - lx, s.y0 + GH + 2 - ly] : s.k === 1 ? [s.x0 + ly, s.y0 + lx] : [s.x0 + GH + 2 - ly, s.y0 + lx]);

  DD.newGame = function (opt) {
    const G = {
      t: 0, wave: 0, over: false, win: false, stage: opt.stage || 0, tutorial: !!opt.tutorial, diff: opt.tutorial || opt.diff == null ? 1 : opt.diff, muts: {},
      st: DD.stageOf(opt.players[Math.max(0, opt.players.findIndex((p) => !p.bot))].race, opt.stage || 0),
      rnd: rng(opt.seed || 1), nid: 1, dungeons: [], events: [], human: opt.players.findIndex((p) => !p.bot),
    };
    G.D = DD.DIFFS[G.diff];
    if (!G.tutorial) { const ks = Object.keys(DD.MUTS); for (let w = 3; w < C.WAVES; w++) if (w % 5 && G.rnd() < 0.4) G.muts[w] = ks[Math.floor(G.rnd() * ks.length)]; }
    G.dungeons = opt.players.map((p, i) => mkDungeon(G, i, p));
    G.step = () => step(G);
    G.cmd = (di, c) => cmd(G, G.dungeons[di], c);
    G.endT = C.FIRST_WAVE + C.WAVES * C.WAVE_T;
    G.nextWaveIn = () => (G.wave >= C.WAVES ? G.endT - G.t : C.FIRST_WAVE + G.wave * C.WAVE_T - G.t);
    return G;
  };

  function mkDungeon(G, i, p) {
    const R = DD.RACES[p.race], m = p.meta || {}, sm = G.st.mods[p.race] || {};
    const d = {
      i, race: p.race, R, bot: !!p.bot, alive: true, gold: 150 + 30 * (m.sGold || 0) + (p.bonusGold || 0), mat: 0, kills: 0,
      units: [], blds: [], demons: [], shots: [], fx: [], snd: {}, queue: [], occ: {}, bc: {}, ver: 0, walls: 0,
      up: { atk: 0, hp: 0, bld: 0 }, rallyU: null, rallyH: null, altarLv: 1, heroN: 0, nSum: 0, nBld: 0, share: 1, slot: 0, botT: 0, wavesCleared: 0, pop: C.POP, boons: [], boonPick: null,
      mod: {
        atk: (sm.atk || 1) * (1 + 0.05 * (m.uAtk || 0)), hp: (sm.hp || 1) * (1 + 0.05 * (m.uHp || 0)), spd: sm.spd || 1,
        bhp: (1 + 0.08 * (m.bHp || 0)) * (p.race === 'human' ? 1.2 : 1), gold: 1 + 0.05 * (m.gold || 0), hcd: 1 - 0.04 * (m.hCd || 0),
        bcost: p.race === 'human' ? 0.8 : 1,
      },
    };
    d.heroT = DD.HERO_CD.first * d.mod.hcd;
    const hh = Math.round(1000 * (1 + 0.08 * (m.bHp || 0)));
    d.heart = { k: 'h', x: C.HEART.x, y: C.HEART.y, hp: hh, mhp: hh, r: 12, hit: 0 };
    let gr = DD.defaultGrid();
    if (p.layout) { const u = Uint8Array.from(p.layout); if (!DD.gridCheck(u)) gr = u; }
    applyGrid(d, gr); d.walls = DD.gridCount(gr).wall;
    return d;
  }

  // ── 비용·조건 ──
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
  DD.buildErr = function (d, b, cx, cy) {
    if (!inG(cx, cy) || is(C.HEART_T, cx, cy) || is(C.SUMMON_T, cx, cy) || is(C.ALTAR_T, cx, cy)) return '지을 수 없는 위치';
    if (d.occ[key(cx, cy)]) return '건물이 있는 칸';
    const gv = d.grid[key(cx, cy)];
    if (b.kind === 'wall') return gv !== 1 ? '방벽은 길 위에만 세울 수 있습니다' : is(C.ENT_T, cx, cy) ? '입구는 못 막는다' : null;
    return gv === 1 ? '길 위에는 방벽만' : gv === 2 ? '벽 위에는 못 짓는다' : null;
  };
  // 조합 계획: 고른 유닛이 있으면 그 종류에서, 없으면 가장 낮은 등급부터 찾는다. {def, us, to} 또는 null
  DD.mergePlan = function (d, ids) {
    const need = DD.mergeNeed(d.race), own = d.units.filter((u) => u.own === d.i && !u.hero && !u.def.legend && u.hp > 0);
    const sel = ids && ids.length ? new Set(own.filter((u) => ids.includes(u.id)).map((u) => u.def)) : null;
    for (const def of d.R.units) {
      if (sel && sel.size && !sel.has(def)) continue;
      const us = own.filter((u) => u.def === def); if (us.length < need) continue;
      us.sort((a, b) => (ids && ids.includes(b.id) ? 1 : 0) - (ids && ids.includes(a.id) ? 1 : 0) || a.hp - b.hp);
      return { def, us: us.slice(0, need), to: def.tier < 3 ? d.R.units[def.tier] : d.R.legend };
    }
    return null;
  };
  // 기본 수입(초당). 골드 수급 강화는 처치 골드와 기본 수입 모두에 붙는다
  DD.income = (d) => ({ g: (1.6 + 1.2 * (d.bc.market || 0)) * d.mod.gold, m: (d.race === 'spirit' ? 0.15 : 0) + 0.3 * (d.bc.crystal || 0) });
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
    const u = { id: G.nid++, k: 'u', def, x: src.x + (G.rnd() - 0.5) * 10, y: src.y + 14, hx: h.x, hy: h.y, hp: mhp, mhp, cd: 0, rt: 0, tg: null, own: d.i, kills: 0, hero: hero || null, face: 1, hit: 0, r: 7 };
    d.units.push(u);
    fx(d, hero ? 'hero' : 'summon', u.x, u.y, hero ? 0.75 : 0.42, { c: hero ? DD.GRADES[hero.grade].col : d.R.color });
    snd(d, hero ? 'hero' : 'summon');
    return u;
  }
  function recount(d) { d.bc = {}; d.blds.forEach((b) => (d.bc[b.def.id] = (d.bc[b.def.id] || 0) + 1)); }

  function cmd(G, d, c) {
    if (G.over || !d.alive) return '지금은 안 된다';
    if (c.a === 'summon') {
      const u = d.R.units[c.u], f = DD.reqFail(d, u);
      if (f) return f;
      const own = d.units.filter((x) => x.own === d.i).length - (u.req && u.req.eat ? u.req.eat[1] : 0);
      if (own >= d.pop) return '인구 한도';
      if (!pay(d, u)) return '자원 부족';
      if (u.req && u.req.eat) {
        let n = u.req.eat[1]; const src = d.R.units[u.req.eat[0]];
        d.units = d.units.filter((x) => !(n > 0 && x.def === src && x.own === d.i && n--));
      }
      addUnit(G, d, u); d.nSum++;
    } else if (c.a === 'build') {
      const b = d.R.blds[c.b], cost = DD.bldCost(d, b), e0 = DD.buildErr(d, b, c.cx, c.cy);
      if (e0) return e0;
      if ((d.bc[b.id] || 0) >= DD.bldMax(b)) return '이 건물은 더 지을 수 없다';
      if (d.blds.length >= C.BLD_CAP) return '건물 한도';
      if (!pay(d, cost)) return '자원 부족';
      const mhp = b.hp * d.mod.bhp * (1 + 0.15 * d.up.bld) * (DD.isPlot(c.cx, c.cy) ? C.PLOT_HP : 1);
      const e = { id: G.nid++, k: 'b', def: b, cx: c.cx, cy: c.cy, x: tcx(c.cx), y: tcy(c.cy), hp: mhp, mhp, cd: 0, hit: 0, r: 12, paid: cost };
      d.blds.push(e); d.occ[key(c.cx, c.cy)] = e; recount(d);
      fx(d, 'dust', e.x, e.y + 8, 0.42, { c: 'e' }); snd(d, 'build'); d.nBld++;
    } else if (c.a === 'tile') { // 길·벽 편집. t: 0 바닥, 1 길, 2 벽
      const { cx, cy, t } = c;
      if (!inG(cx, cy) || DD.isFixed(cx, cy) || is(C.ENT_T, cx, cy)) return '바꿀 수 없는 칸';
      if (d.grid[key(cx, cy)] === t) return null;
      if (d.occ[key(cx, cy)]) return '건물이 있는 칸';
      const ng = Uint8Array.from(d.grid); ng[key(cx, cy)] = t;
      const e0 = DD.gridCheck(ng); if (e0) return e0;
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
      const bonus = DD.callBonus(G);
      G.t += skip;
      for (const x of G.dungeons) if (x.alive) { const inc = DD.income(x); x.gold += inc.g * skip + bonus; x.mat += inc.m * skip; x.heroT -= skip; }
      G.events.push({ t: 'called', d: d.i, bonus });
    } else if (c.a === 'rally') { // which: 'U' 소환소, 'H' 영웅 제단. x가 없으면 기본 배치로 되돌린다
      const k = c.which === 'H' ? 'rallyH' : 'rallyU';
      if (c.x === undefined) d[k] = null;
      else { if (wallAt(d, c.x, c.y)) return '벽 위에는 세울 수 없습니다'; d[k] = { x: Math.max(C.OX + 8, Math.min(C.OX + GW * T - 8, c.x)), y: Math.max(C.OY + 12, Math.min(C.OY + GH * T - 4, c.y)), n: 0 }; }
    } else if (c.a === 'sell') {
      const b = d.blds.find((x) => x.id === c.id); if (!b) return '없음';
      const k = 0.5 * (b.hp / b.mhp); d.gold += Math.floor(b.paid.g * k); d.mat += Math.floor(b.paid.m * k); b.hp = 0; snd(d, 'coin');
      delete d.occ[key(b.cx, b.cy)]; d.blds = d.blds.filter((x) => x !== b); recount(d); fx(d, 'dust', b.x, b.y + 6, 0.42, { c: 'e' }); // 멈춘 동안에도 바로 사라지게
    } else if (c.a === 'dismiss') { // 고른 유닛을 돌려보내 인구를 비운다(영웅 제외, 비용의 30% 환급)
      const us = d.units.filter((u) => c.ids.includes(u.id) && u.own === d.i && !u.hero);
      if (!us.length) return '해산할 유닛이 없습니다(영웅은 해산 불가)';
      for (const u of us) { d.gold += Math.floor((u.def.g || 0) * 0.3); d.mat += Math.floor((u.def.m || 0) * 0.3); fx(d, 'dust', u.x, u.y, 0.42, { c: 's' }); }
      d.units = d.units.filter((u) => !us.includes(u)); snd(d, 'coin');
    } else if (c.a === 'move') {
      const us = d.units.filter((u) => c.ids.includes(u.id) && u.own === d.i);
      const n = Math.ceil(Math.sqrt(us.length));
      us.forEach((u, i) => {
        u.hx = Math.max(C.OX + 5, Math.min(C.OX + GW * T - 5, c.x + ((i % n) - (n - 1) / 2) * 12));
        u.hy = Math.max(C.OY + 8, Math.min(C.OY + GH * T - 3, c.y + (Math.floor(i / n) - (n - 1) / 2) * 12));
      });
    } else if (c.a === 'gamble') { // 랜덤 소환: 해금 조건 없이 등급을 뽑는다
      if (d.units.filter((x) => x.own === d.i).length >= d.pop) return '인구 한도';
      if (!pay(d, DD.gambleCost(d.R))) return '자원 부족';
      const r = G.rnd(), P = DD.GAMBLE_P, ti = r < P[0] ? 0 : r < P[0] + P[1] ? 1 : 2;
      addUnit(G, d, d.R.units[ti]); d.nSum++;
      G.events.push({ t: 'gamble', d: d.i, tier: ti + 1, name: d.R.units[ti].name });
    } else if (c.a === 'merge') { // 조합: 같은 유닛 셋을 한 단계 위 유닛 하나로
      const p = DD.mergePlan(d, c.ids); if (!p) return `같은 유닛 ${DD.mergeNeed(d.race)}기가 필요합니다`;
      const f = p.us[0], kills = p.us.reduce((s, u) => s + u.kills, 0);
      d.units = d.units.filter((u) => !p.us.includes(u));
      const u = addUnit(G, d, p.to); u.x = f.x; u.y = f.y; u.hx = f.hx; u.hy = f.hy; u.kills = kills;
      fx(d, 'hero', u.x, u.y, 0.75, { c: p.to.legend ? 'g1' : d.R.color }); if (p.to.legend) snd(d, 'hero');
      G.events.push({ t: 'merge', d: d.i, name: p.to.name, legend: !!p.to.legend });
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
      addUnit(G, d, def, { name: pick[0], grade: gi, role: pick[1] });
      d.heroN++;
      d.heroT = (DD.HERO_CD.base + DD.HERO_CD.inc * d.heroN) * DD.ALTAR[d.altarLv - 1].cd * d.mod.hcd;
      G.events.push({ t: 'hero', d: d.i, name: pick[0], grade: gr.id, spr: 'p_' + d.race + '_' + pick[1] });
    } else if (c.a === 'support') {
      const to = G.dungeons[c.to]; if (!to || !to.alive || to === d) return '보낼 수 없는 곳';
      const us = d.units.filter((u) => c.ids.includes(u.id) && u.own === d.i);
      if (!us.length) return '선택된 유닛 없음';
      d.units = d.units.filter((u) => !us.includes(u));
      us.forEach((u) => { const h = homeSlot(to, u.def.rng > 30); u.x = C.SUMMON.x; u.y = C.SUMMON.y + 14; u.hx = h.x; u.hy = h.y; u.tg = null; to.units.push(u); });
      G.events.push({ t: 'support', d: d.i, to: to.i, n: us.length });
    }
    return null;
  }

  // ── 전투 ──
  function unitAtk(G, d, u) {
    const o = G.dungeons[u.own];
    let a = u.def.atk * o.mod.atk * (1 + 0.1 * o.up.atk);
    if (o.bc.forge && o.race === 'human') a *= 1.15;
    if (o.race === 'dragon') a *= 1 + Math.min(0.5, 0.02 * u.kills);
    if (o.race === 'beast') a *= 1 + Math.min(0.4, 0.015 * d.units.length);
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
    G.events.push({ t: 'boonGot', d: d.i, b: bi });
  }
  function hurt(G, d, src, t, amt) {
    t.hp -= amt; t.hit = 0.12;
    if (t.k === 'd' && t.hp <= 0 && !t.dead) {
      t.dead = true; d.kills++; if (src && src.k === 'u') src.kills++;
      const kg = t.def.gold * (t.gm || 1) * G.D.gold * d.mod.gold * (d.mod.kg || 1) * (1 + 0.2 * Math.min(3, d.bc.hoard || 0)); d.gold += kg;
      if (t.def.spr === 'd_boss' && G.wave < C.WAVES && !G.tutorial) offerBoon(G, d);
      d.mat += (t.def.mat || 0) + (G.rnd() < 0.1 ? 1 : 0);
      fx(d, 'corpse', t.x, t.y, 0.5, { s: t.def.spr, face: t.face }); fx(d, 'smoke', t.x, t.y, 0.5); fx(d, 'gold', t.x, t.y - 14, 0.7, { n: Math.round(kg) });
      snd(d, t.def.spr === 'd_boss' ? 'bossdie' : 'die');
    }
    if (t.k === 'b' && t.def.thorn && src && src.k === 'd') hurt(G, d, null, src, t.def.thorn);
  }
  function strike(G, d, src, t, amt, splash, col) {
    if (src.def.rng > 30 || src.k === 'b') { const k = src.k === 'd' ? 'orb' : SHOT[src.k === 'u' ? G.dungeons[src.own].race : d.race]; shoot(d, src, t, k, col); snd(d, k); }
    else { fx(d, 'hit', t.x + (G.rnd() - 0.5) * 4, t.y - 7, 0.17, { c: src.k === 'd' ? 'r1' : 'W' }); snd(d, 'melee'); }
    if (t.k === 'h') snd(d, 'heart');
    // 상성: 중장갑은 범위 공격에 강하고 단일 공격에 약하다. 떼로 오는 악마는 범위 공격에 약하다
    const ty = (x) => (x.k !== 'd' || src.k === 'd' ? 1 : x.def.heavy ? (splash ? 0.8 : 1.2) : x.def.light && splash ? 1.2 : 1);
    hurt(G, d, src, t, amt * ty(t));
    if (splash) {
      const list = src.k === 'd' ? d.units : d.demons;
      for (const o of list) if (o !== t && d2(o, t) < splash * splash && !(o.k === 'd' && o.def.fly && src.k === 'u' && src.def.rng <= 30)) hurt(G, d, src, o, amt * 0.6 * ty(o));
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
  const roadAt = (d, x, y) => { const cx = tx(x), cy = ty(y); return inG(cx, cy) ? d.grid[key(cx, cy)] === 1 : cy >= GH && cx === C.ENT_T[0]; };
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
    const mu = DD.MUTS[G.muts[w]] || {}, D = G.D;
    const n = Math.round(base.length * d.share * (mu.n || 1));
    for (let i = 0; i < n; i++) list.push(base[i % base.length]);
    const easy = G.tutorial ? (w <= 5 ? 0.6 : 0.85) : 1; // 튜토리얼의 첫 다섯 웨이브는 약하다
    list.forEach((t, i) => d.queue.push({ at: G.t + (i / list.length) * 25, t, hp: sc.hp * G.st.mul * easy * D.hp * (mu.hp || 1), atk: sc.atk * Math.sqrt(G.st.mul) * D.atk * (mu.atk || 1), spd: mu.spd || 1, gm: mu.gold || 1 }));
    d.queue.sort((a, b) => a.at - b.at);
  }

  function demonStep(G, d, e) {
    if (e.def.fly) { // 비행: 길도 벽도 유닛도 무시하고 심장으로
      const h = d.heart, reach = e.def.rng + h.r; e.face = h.x >= e.x ? 1 : -1;
      if (d2(e, h) <= reach * reach) { e.mv = false; if (e.cd <= 0) { e.cd = e.def.as; e.atkT = 0.3; strike(G, d, e, h, e.atk, 0, 'p2'); } }
      else { const p = step2(e, h.x, h.y, e.def.spd * (e.spd || 1)); e.mv = !!p; if (p) { e.x = p[0]; e.y = p[1]; } }
      return;
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
        const b = nearest(e, d.blds, e.def.rng + 12 + (boss ? 6 : 0));
        if (b && los(d, e, b)) e.tg = b;
      }
    }
    let t = e.tg;
    if (!t) { // 길을 따라 심장으로
      const cx = tx(e.x), cy = ty(e.y); let nx = C.ENT_T[0], ny = C.ENT_T[1];
      if (inG(cx, cy)) {
        const dv = d.dist[key(cx, cy)];
        for (const [dx, dy] of NB) { const ax = cx + dx, ay = cy + dy; if (inG(ax, ay) && d.dist[key(ax, ay)] === dv - 1 && dv > 0) { nx = ax; ny = ay; break; } }
      }
      if (is(C.HEART_T, nx, ny)) t = d.heart;
      else {
        const blk = d.occ[key(nx, ny)] || (inG(cx, cy) && d.occ[key(cx, cy)]);
        if (blk && blk.hp > 0) t = blk; // 바리케이드
        else { const p = step2(e, tcx(nx), tcy(ny), e.def.spd * (e.spd || 1)); e.mv = !!p; if (p) { e.x = p[0]; e.y = p[1]; } return; }
      }
    }
    const reach = e.def.rng + t.r;
    if (d2(e, t) <= reach * reach) {
      e.mv = false; e.face = t.x >= e.x ? 1 : -1;
      if (e.cd <= 0) { e.cd = e.def.as; e.atkT = 0.3; strike(G, d, e, t, e.atk, e.def.splash, 'p2'); }
    } else {
      const p = step2(e, t.x, t.y, e.def.spd * (e.spd || 1));
      if (p && (t.k !== 'u' || roadAt(d, p[0], p[1]))) { e.x = p[0]; e.y = p[1]; e.mv = true; } else { e.tg = null; e.rt = 0.2; }
    }
  }

  function stepDungeon(G, d) {
    const inc = DD.income(d); d.gold += inc.g * DT; d.mat += inc.m * DT;
    if (d.heroT > 0) d.heroT -= DT;
    while (d.queue.length && d.queue[0].at <= G.t) {
      const q = d.queue.shift(), def = DD.DEMONS[q.t], mhp = def.hp * q.hp;
      d.demons.push({ id: G.nid++, k: 'd', def, x: tcx(C.ENT_T[0]) + (G.rnd() - 0.5) * 12, y: C.OY + GH * T - 12 + G.rnd() * 6, hp: mhp, mhp, atk: def.atk * q.atk, spd: q.spd || 1, gm: q.gm || 1, cd: 0, rt: G.rnd() * 0.3, tg: null, face: 1, hit: 0, r: q.t === 'boss' ? 12 : 7 });
    }
    const drums = d.blds.filter((b) => b.def.haste), pools = d.blds.filter((b) => b.def.regen);
    // 유닛
    for (const u of d.units) {
      if (u.hit > 0) u.hit -= DT; u.cd -= DT; u.rt -= DT;
      const o = G.dungeons[u.own];
      let reg = u.mhp * ((o.race === 'merfolk' ? 0.01 : 0) + (o.mod.regen || 0));
      for (const p of pools) if (d2(u, p) < p.def.rad * p.def.rad) reg += p.def.regen;
      if (reg && u.hp < u.mhp) u.hp = Math.min(u.mhp, u.hp + reg * DT);
      const home = { x: u.hx, y: u.hy }, heal = u.def.heal, ranged = u.def.rng > 30;
      if (u.rt <= 0) {
        u.rt = 0.3; u.tg = null; u.fast = drums.some((b) => d2(u, b) < b.def.rad * b.def.rad);
        if (heal) {
          let br = 0.95;
          for (const a of d.units) if (a !== u && a.hp > 0 && a.hp / a.mhp < br && d2(a, home) < 120 * 120) { br = a.hp / a.mhp; u.tg = a; }
        }
        if (!u.tg) {
          let bd = Math.max(u.def.rng + 12, 64) ** 2;
          for (const e of d.demons) { if (e.hp <= 0 || (e.def.fly && !ranged)) continue; const q = d2(u, e); if (q < bd && d2(e, home) < 110 * 110 && (!ranged || e.def.fly || los(d, u, e))) { bd = q; u.tg = e; } }
        }
      }
      const t = u.tg;
      if (t && t.hp > 0) {
        const reach = u.def.rng + t.r, ally = t.k === 'u';
        if (d2(u, t) <= reach * reach) {
          u.mv = false; u.face = t.x >= u.x ? 1 : -1;
          if (u.cd <= 0) {
            u.cd = u.def.as / (u.fast ? 1.25 : 1); u.atkT = 0.3;
            if (ally) { t.hp = Math.min(t.mhp, t.hp + heal * o.mod.atk * (1 + 0.1 * o.up.atk)); shoot(d, u, t, 'heal', 'n1'); fx(d, 'heal', t.x, t.y - 12, 0.4, { c: 'n1' }); snd(d, 'heal'); }
            else strike(G, d, u, t, unitAtk(G, d, u), u.def.splash, o.R.color);
          }
        } else moveUnit(d, u, t.x, t.y, u.def.spd * o.mod.spd);
      } else moveUnit(d, u, u.hx, u.hy, u.def.spd * o.mod.spd);
      if (u.atkT > 0) u.atkT -= DT;
    }
    // 탑
    for (const b of d.blds) {
      if (b.hit > 0) b.hit -= DT;
      if (b.def.kind !== 'tower') continue;
      b.cd -= DT;
      if (b.cd <= 0) {
        // 사거리 안에서 심장에 가장 가까이 온 악마부터 쏜다(같으면 가까운 쪽)
        let t = null, best = Infinity; const r2 = b.def.rng * b.def.rng;
        for (const e of d.demons) { if (e.hp <= 0) continue; const q = d2(b, e); if (q >= r2) continue; const sc = prog(d, e) * 1e5 + q; if (sc < best && (e.def.fly || los(d, b, e))) { best = sc; t = e; } }
        if (t) { b.cd = b.def.as; strike(G, d, b, t, b.def.atk * (1 + 0.15 * d.up.bld) * d.mod.atk, b.def.splash, d.R.color); } else b.cd = 0.2;
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
      d.units.forEach((u) => { if (u.hp <= 0) { fx(d, 'dust', u.x, u.y, 0.42, { c: 's' }); snd(d, 'udie'); if (u.hero) G.events.push({ t: 'herodead', d: d.i, name: u.hero.name }); } });
      d.units = d.units.filter((u) => u.hp > 0);
    }
    if (d.blds.some((b) => b.hp <= 0)) {
      d.blds.forEach((b) => { if (b.hp <= 0) { delete d.occ[key(b.cx, b.cy)]; fx(d, 'collapse', b.x, b.y, 0.6); snd(d, 'bfall'); } });
      d.blds = d.blds.filter((b) => b.hp > 0); recount(d);
    }
    for (const s of d.shots) s.t -= DT; for (const f of d.fx) f.t -= DT;
    if (d.shots.some((s) => s.t <= 0)) d.shots = d.shots.filter((s) => s.t > 0);
    if (d.fx.some((f) => f.t <= 0)) d.fx = d.fx.filter((f) => f.t > 0);
    if (d.heart.hit > 0) d.heart.hit -= DT;
    if (G.tutorial && G.t < 300 && d.heart.hp < 250) d.heart.hp = 250; // 튜토리얼 5분 동안은 심장이 무너지지 않는다
    if (d.heart.hp <= 0) fall(G, d);
    else if (d.bot) { d.botT -= DT; if (d.botT <= 0) { d.botT = 0.6; DD.botThink(G, d); } }
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
    if (G.wave < C.WAVES && G.t >= C.FIRST_WAVE + G.wave * C.WAVE_T) {
      G.wave++;
      G.dungeons.forEach((d) => { if (d.alive) { d.wavesCleared = G.wave - 1; spawnWave(G, d, G.wave); } });
      G.events.push({ t: 'wave', w: G.wave, mut: G.muts[G.wave] || null });
    }
    for (const d of G.dungeons) if (d.alive) stepDungeon(G, d);
    if (!G.over && G.t >= G.endT) { G.over = true; G.win = true; G.dungeons.forEach((d) => d.alive && (d.wavesCleared = C.WAVES)); }
  }

  // ── 봇(동맹 AI 겸 밸런스 시험용). 어떤 길 모양에서도 자리를 스스로 찾는다 ──
  function spots(d, kind) {
    const free = (cx, cy) => !d.occ[key(cx, cy)];
    if (kind === 'wall') return d.path.slice(1, 5).filter(([x, y]) => free(x, y));
    const out = [];
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
      if (d.grid[key(cx, cy)] !== 0 || !free(cx, cy) || is(C.HEART_T, cx, cy) || is(C.SUMMON_T, cx, cy) || is(C.ALTAR_T, cx, cy)) continue;
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
    const own = d.units.filter((u) => u.own === d.i);
    const build = (bi, kind, max) => {
      const b = R.blds[bi], n = d.bc[b.id] || 0;
      if (n >= max) return false;
      const bc = DD.bldCost(d, b); if (d.mat < bc.m) return false; if (d.gold < bc.g) return true; // 골드만 모자라면 저축
      const s = spots(d, kind)[0];
      if (s) G.cmd(d.i, { a: 'build', b: bi, cx: s[0], cy: s[1] });
      return !!s;
    };
    const w = G.wave;
    if (own.length >= 4 && build(0, 'far', 1)) return;
    if (w >= 2 && build(4, 'far', d.race === 'merfolk' || d.race === 'dragon' ? 2 : 1)) return;
    if (w >= 3 && build(2, 'tower', Math.min(6, Math.floor(w / 2)))) return;
    if (w >= 5 && own.length >= 8 && build(1, 'far', 1)) return;
    if (w >= 6 && build(3, 'wall', 3)) return;
    if (w >= 8 && d.altarLv < 3) { const c = DD.upCost(d, 'altar'); if (c && can({ g: c.g + 100, m: c.m })) { G.cmd(d.i, { a: 'up', k: 'altar' }); return; } }
    for (const k of d.up.atk <= d.up.hp ? ['atk', 'hp'] : ['hp', 'atk']) {
      const c = DD.upCost(d, k);
      if (c && own.length >= 8 + d.up[k] * 2 && can({ g: c.g + 60, m: c.m })) { G.cmd(d.i, { a: 'up', k }); return; }
    }
    if (own.length >= d.pop && DD.mergePlan(d)) { G.cmd(d.i, { a: 'merge' }); return; } // 인구가 차면 조합으로 질을 올린다
    for (let ui = 2; ui >= 0; ui--) {
      const u = R.units[ui];
      if (DD.reqFail(d, u)) continue;
      if (ui === 0 && own.length >= 16 && !DD.reqFail(d, R.units[1])) continue;
      if (ui < 2 && own.length >= d.pop - 4 && !DD.reqFail(d, R.units[2])) continue;
      if (can(u)) { if (!G.cmd(d.i, { a: 'summon', u: ui })) return; }
      else if (ui === 2 && own.length >= 12) return; // 상위 유닛 저축
    }
    if (own.length >= d.pop && d.gold > 400) { const weak = own.find((u) => u.def.tier === 1); if (weak) weak.hp = 0; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
