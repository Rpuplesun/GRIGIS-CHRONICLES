// 아틀라스(사용자 제공 아트, tools/slice_art.py 산출물)에서 프레임을 꺼낸다.
(function () {
  const DD = window.DD, A = DD.ATLAS, img = new Image();
  let ready = false; const cbs = [];
  img.onload = () => { ready = true; cbs.splice(0).forEach((f) => f()); };
  img.src = A.img;
  DD.artReady = (f) => (ready ? f() : cbs.push(f));
  const BIDX = { b_unlock1: 0, b_unlock2: 1, b_tower: 2, b_wall: 3, b_special: 4 };
  const keyOf = (id) => { if (id.indexOf('@') < 0) return id; const [s, r] = id.split('@'); return 'b_' + r + '_' + BIDX[s]; };
  DD.frames = (id) => A.frames[keyOf(id)] || A.frames.t_void;
  const cache = {};
  // mode: 0 그대로, 1 좌우 반전, 2 흰 실루엣, 3 흰 실루엣 반전
  DD.frame = function (id, i, mode) {
    const k = id + '|' + i + '|' + (mode || 0);
    if (cache[k]) return cache[k];
    const fr = DD.frames(id), f = fr[Math.min(i, fr.length - 1)], c = document.createElement('canvas'), x = c.getContext('2d');
    c.width = f[2]; c.height = f[3];
    if (mode & 1) { x.translate(f[2], 0); x.scale(-1, 1); }
    x.drawImage(img, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
    if (mode & 2) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, f[2], f[3]); }
    c.ax = mode & 1 ? f[2] - f[4] : f[4];
    return (cache[k] = c);
  };
  // 발 기준점(x, y)에 맞춰 그린다
  DD.blit = function (ctx, id, i, x, y, flip, white) {
    const c = DD.frame(id, i, (flip ? 1 : 0) | (white ? 2 : 0));
    ctx.drawImage(c, Math.round(x - c.ax), Math.round(y - c.height));
    return c;
  };
  const icons = {};
  DD.icon = (id) => icons[id] || (icons[id] = DD.frame(id, 0, 0).toDataURL());
  // 스테이지 색조를 입힌 타일
  const TINT = { cave: [1, 1, 1.06], fire: [1.3, 0.78, 0.74], water: [0.72, 0.96, 1.3], forest: [0.78, 1.12, 0.82], wild: [1.18, 0.98, 0.72], abyss: [1.08, 0.74, 1.26] };
  const BASE = { floor: [0.5, 0.5, 0.72], road: [1.32, 1.2, 1.02], wall: [0.98, 0.96, 1.1], void: [0.6, 0.55, 0.8] }; // 바닥은 어둡고 차갑게, 길은 밝고 따뜻하게
  // 스테이지 타일셋(바닥·길·소품). 바닥은 어둡게, 길은 밝게 해서 길이 또렷이 보이게 한다
  const LIGHT = { floor: 0.7, road: 1.12, prop: 0.78 }, WILD = [1.16, 1.0, 0.78];
  DD.stageTiles = (stage, kind) => (A.frames['t_' + stage + '_' + kind] || []).length;
  DD.stageTile = function (stage, kind, i) {
    const k = 'st|' + stage + '|' + kind + '|' + i;
    if (cache[k]) return cache[k];
    const src = DD.frame('t_' + stage + '_' + kind, i, 0), c = document.createElement('canvas'), l = LIGHT[kind], t = stage === 'wild' ? WILD : [1, 1, 1];
    c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height);
    for (let p = 0; p < d.data.length; p += 4) for (let j = 0; j < 3; j++) d.data[p + j] = Math.min(255, d.data[p + j] * l * t[j]);
    x.putImageData(d, 0, 0);
    return (cache[k] = c);
  };
  DD.tile = function (name, stage) {
    const k = 'tile|' + name + '|' + stage;
    if (cache[k]) return cache[k];
    const src = DD.frame('t_' + name, 0, 0), b = BASE[name] || [1, 1, 1], t = (TINT[stage] || [1, 1, 1]).map((v, i) => v * b[i]);
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d'); x.drawImage(src, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) for (let j = 0; j < 3; j++) d.data[i + j] = Math.min(255, d.data[i + j] * t[j]);
    x.putImageData(d, 0, 0);
    return (cache[k] = c);
  };
})();
