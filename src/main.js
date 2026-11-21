// 화면(UI)·입력·저장. 게임 규칙은 sim.js, 수치는 data.js.
(function () {
  const DD = window.DD, C = DD.C, $ = (s) => document.querySelector(s);
  const SAVE_KEY = 'dungeon_dep_save_v1';
  let save;
  try { save = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { /* 저장 불가 환경 */ }
  if (!save || !save.races) save = { races: {} };
  DD.RACE_IDS.forEach((r) => (save.races[r] = save.races[r] || { shards: 0, meta: {}, stage: 0 }));
  save.seen = save.seen || {};
  save.opt = Object.assign({ vol: 0.6, bgm: 0.5, flash: true }, save.opt); // vol = 효과음, bgm = 배경음악
  DD.Audio.setVol(save.opt.vol); DD.Music.setVol(save.opt.bgm);
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* 무시 */ } };
  const icon = (id, m) => { const f = DD.frames(id)[0]; return `<img class="px" src="${DD.icon(id)}" style="width:${f[2] * m}px;height:${f[3] * m}px">`; };
  const ic = (id) => `<img class="px ic" src="${DD.icon(id)}" alt="">`; // UI 시트의 아이콘(글자 높이에 맞춘다)
  const pct = (v) => Math.round(v * 100);

  // ───────── 메뉴 ─────────
  const menu = Object.assign({ race: 'human', mode: 'solo', allies: 3, diff: 1 }, save.menu);
  if (!DD.DIFFS[menu.diff]) menu.diff = 1; // 마지막으로 고른 종족·방식을 기억한다
  if (!DD.RACES[menu.race]) menu.race = 'human';
  const topStage = (race) => (DD.DEMO ? 0 : Math.min(5, save.races[race].stage)); // 열린 스테이지 중 가장 뒤
  menu.stage = topStage(menu.race);
  function modText(st, race) {
    const m = st.mods[race]; if (!m) return '보정 없음';
    const n = { atk: '공격', hp: '체력', spd: '이동' };
    return Object.keys(m).map((k) => `<span class="${m[k] > 1 ? 'good' : 'bad'}">${n[k]} ${m[k] > 1 ? '+' : ''}${pct(m[k] - 1)}%</span>`).join(' ');
  }
  const fmtMeta = (m) => (lv) => '+' + (m.unit === '%' ? pct(m.per * lv) + '%' : m.per * lv);
  function drawMenu() {
    const rs = save.races[menu.race], R = DD.RACES[menu.race], best = rs.best || {}, rec = rs.rec || {}, DF = DD.DIFFS[menu.diff];
    const xm = (v) => '×' + v;
    if (menu.stage > rs.stage) menu.stage = rs.stage;
    $('#menu').innerHTML = `
      <header><h1>${DD.TITLE.name}</h1><p class="sub">${DD.TITLE.sub}${DD.DEMO ? ' · 데모' : ''}${save.bonusGold ? ` · <span class="gold">전쟁 자금 ●${save.bonusGold} (다음 출전에 지급)</span>` : ''}</p></header>
      <section class="races"><h2>종족 <span class="row">
        <button class="${menu.mode === 'solo' ? 'on' : ''}" data-m="mode:solo">솔로</button><button class="${menu.mode === 'multi' ? 'on' : ''}" data-m="mode:multi">멀티 (AI 동맹)</button>
        ${menu.mode === 'multi' ? `<span class="lbl">요새</span>` + [2, 3, 4, 5].map((n) => `<button class="${menu.allies === n ? 'on' : ''}" data-m="allies:${n}">${n}</button>`).join('') : ''}</span></h2>
        <div class="cards">${DD.RACE_IDS.map((id) => { const r = DD.RACES[id]; return `
        <button class="card ${menu.race === id ? 'on' : ''}" data-m="race:${id}">
          <div class="icons">${r.units.map((u) => icon(u.spr, 3)).join('')}</div>
          <b>${r.name}</b><small>${r.trait}</small><small class="gold">${ic('ui_shard')} ${save.races[id].shards} · 스테이지 ${save.races[id].stage + 1}</small>
        </button>`; }).join('')}</div></section>
      <section><h2>스테이지 <span class="row"><span class="lbl">난이도</span>${DD.DIFFS.map((x, i) => `<button class="${menu.diff === i ? 'on' : ''}" data-m="diff:${i}">${x.name}</button>`).join('')}</span></h2>
        <p class="diffnote">악마 체력 ${xm(DF.hp)} · 공격 ${xm(DF.atk)} · 골드 ${xm(DF.gold)} · <span class="gold">영혼석 ${xm(DF.shard)}</span></p><div class="cards c3">${DD.stageOrder(menu.race).map((id, i) => { const st = DD.stageOf(menu.race, i), lock = i > rs.stage, demo = DD.DEMO && i > 0; return `
        <button class="card ${menu.stage === i ? 'on' : ''}" ${lock || demo ? 'disabled' : ''} data-m="stage:${i}">
          <b>${i + 1}. ${st.name}</b><small>${demo ? '정식 버전에서' : lock ? '잠김' : st.desc} · 악마 ×${st.mul}</small><small>${modText(st, menu.race)}</small>${rec[i] ? `<small class="rec"><span class="stars">${'★'.repeat(rec[i].s)}${'☆'.repeat(3 - rec[i].s)}</span> ${DD.DIFFS[rec[i].d].name}</small>` : best[i] ? `<small class="rec">${best[i] > C.WAVES ? '✔ 클리어' : `최고 웨이브 ${best[i]}/${C.WAVES}`}</small>` : ''}
        </button>`; }).join('')}</div></section>
      <section><h2>영구 강화 <span class="gold">${ic('ui_shard')} ${rs.shards}</span></h2><div class="cards c3">${DD.META.map((m) => { const fmt = fmtMeta(m), lv = rs.meta[m.k] || 0, cost = DD.metaCost(lv), max = lv >= DD.META_MAX; return `
        <button class="card" ${max || rs.shards < cost ? 'disabled' : ''} data-m="meta:${m.k}">
          <b>${m.name}</b><small>Lv.${lv}/${DD.META_MAX} · ${fmt(lv)}${max ? '' : ` → <span class="good">${fmt(lv + 1)}</span>`}</small><small class="gold">${max ? '최대' : ic('ui_shard') + ' ' + cost}</small>
        </button>`; }).join('')}</div></section>
      <span></span><span></span>
      <footer><button class="start" data-m="start:1">출전</button><button data-m="story:1">이야기</button><button data-m="tutorial:1">튜토리얼</button><button data-m="settings:1">설정</button>
        <details class="help"><summary>조작법</summary><div class="helpbox">
        <p><b>유닛</b> 클릭·드래그 선택(더블클릭 같은 유닛, Ctrl+A 전체) → 바닥 클릭 배치 · Q W R Y 소환 · T 영웅 · V 랜덤 소환 · B 조합 · 소환소나 제단을 누르면 집결지 지정</p>
        <p><b>건물</b> A S D F G → 칸 클릭(Shift 연속) · 건물은 바닥, 방벽은 길 위 · 거점 위는 체력 +25% · 고른 건물 Del 철거</p>
        <p><b>길 편집</b> E (Z 길, X 벽, C 지우기, 우클릭 지우기, Ctrl+Z 되돌리기) · 길 최대 ${C.ROAD_MAX}, 벽 최대 ${C.WALL_MAX} · 입구↔심장 연결 필수</p>
        <p><b>기타</b> 1 2 3 속도 · Space 일시정지 · N 다음 웨이브(보너스 골드) · Tab 지도 · Esc 취소 · 한글 입력 상태에서도 단축키가 듣는다</p></div></details></footer>`;
  }
  $('#menu').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-m]'); if (!b || b.disabled) return;
    DD.Audio.play('click'); b.blur();
    const [k, v] = b.dataset.m.split(':');
    if (k === 'mode') menu.mode = v;
    else if (k === 'race') { menu.race = v; menu.stage = topStage(v); }
    else if (k === 'allies' || k === 'stage' || k === 'diff') menu[k] = +v;
    else if (k === 'meta') { const rs = save.races[menu.race], lv = rs.meta[v] || 0, c = DD.metaCost(lv); if (rs.shards >= c) { rs.shards -= c; rs.meta[v] = lv + 1; persist(); } }
    else if (k === 'start') { save.menu = { race: menu.race, mode: menu.mode, allies: menu.allies, diff: menu.diff }; persist(); return startGame(); }
    else if (k === 'story') return showStory(showMenu);
    else if (k === 'settings') return openSettings();
    else if (k === 'tutorial') return startGame(true);
    drawMenu();
  });

  // ───────── 게임 ─────────
  let G = null, ui = null, speed = 1, paused = false, acc = 0, last = 0, lastHtml = {};
  const cv = $('#cv'), ctx = cv.getContext('2d');
  const me = () => G.dungeons[G.human];

  function startGame(tutorial) {
    const race = tutorial ? 'human' : menu.race, others = DD.RACE_IDS.filter((r) => r !== race);
    const players = [{ race, meta: save.races[race].meta, layout: tutorial ? null : save.layout, bonusGold: tutorial ? 0 : save.bonusGold || 0 }];
    if (!tutorial && menu.mode === 'multi') for (let i = 0; i < menu.allies - 1; i++) players.push({ race: others[i], bot: true });
    if (!tutorial && save.bonusGold) { save.bonusGold = 0; persist(); }
    G = DD.newGame({ players, stage: tutorial ? 0 : menu.stage, diff: menu.diff, tutorial: !!tutorial, seed: (Date.now() & 0xffff) + 1 });
    ui = { sel: new Set(), selB: null, ghost: null, box: null, view: 0, build: -1, veil: 16, flash: save.opt.flash, edit: false, tool: 1, hover: null, rally: null, insp: null, seenD: new Set(), heroReady: false, busy: false };
    DD.Audio.ambience(G.st.id); DD.Audio.preload(); DD.Music.play(G.st.id); DD.Music.preload(['boss', 'victory', 'defeat']); ui.music = G.st.id;
    speed = 1; paused = false; acc = 0; lastHtml = {}; dlg = null; drawDlg(); setGoal('');
    for (const id of ['#title', '#story', '#menu', '#result']) $(id).hidden = true;
    $('#game').hidden = false; $('#feed').innerHTML = ''; $('#herocard').innerHTML = ''; $('#banner').innerHTML = '';
    buildScript();
    resize(); last = performance.now(); requestAnimationFrame(loop);
    if (!script.steps.length || script.steps[0].when) banner(G.st.name, `${C.FIRST_WAVE}초 뒤 첫 침공`);
  }

  // ───────── 참모 대화·대본 ─────────
  let dlg = null, script = { steps: [], i: 0, goal: null, el: 0 };
  function say(adv, lines, onEnd) { dlg = { adv, lines, i: 0, onEnd }; drawDlg(); }
  function drawDlg() {
    const el = $('#dialog'); el.hidden = !dlg; $('#info').style.visibility = dlg ? 'hidden' : ''; if (!dlg) return;
    const a = DD.ADVISORS[dlg.adv];
    el.innerHTML = `<img src="art/adv_${dlg.adv}_${(dlg.i % 2) + 1}.webp" alt=""><div class="box"><b>${a.name}</b><small>${a.title}</small><p>${dlg.lines[dlg.i]}</p><span class="next">${dlg.i + 1}/${dlg.lines.length} · 클릭 또는 Space ▸</span>${G && G.tutorial ? '<button class="skiptut" data-a="skiptut:1">안내 끄기</button>' : ''}</div>`;
  }
  function advance() { if (!dlg) return; DD.Audio.play('click'); if (++dlg.i >= dlg.lines.length) { const f = dlg.onEnd; dlg = null; drawDlg(); if (f) f(); } else drawDlg(); }
  $('#dialog').addEventListener('click', (ev) => { if (!ev.target.closest('[data-a]')) advance(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over) paused = true; }); // 창을 떠나면 멈춘다
  function setGoal(t) { const el = $('#goal'); el.hidden = !t; el.innerHTML = t ? `<small>목표</small>${t}` : ''; }
  function buildScript() {
    const d = me(), race = d.race, land = G.st, steps = [];
    if (G.tutorial) DD.TUTORIAL.forEach((st) => steps.push(Object.assign({ adv: 'human' }, st)));
    else {
      const m = land.mods[race] ? [`<span class="fx">${d.R.name} · ${modText(land, race)}</span>`] : [];
      if (!save.seen['race_' + race]) steps.push({ adv: race, say: DD.RACE_INTRO[race].concat(land.home === race ? m : []), mark: 'race_' + race });
      if (land.id === 'abyss') { if (!save.seen['abyss_' + race]) steps.push({ adv: race, say: [DD.TIPS.final].concat(m), mark: 'abyss_' + race }); }
      else if (land.home !== race && !save.seen['land_' + race + land.id]) steps.push({ adv: land.home, say: [DD.LAND_HOST[land.id]].concat(m), mark: 'land_' + race + land.id });
    }
    if (!save.seen.tip_heart) steps.push({ adv: race, when: (g, x) => x.heart.hp < x.heart.mhp * 0.5, say: [DD.TIPS.heart], mark: 'tip_heart' });
    script = { steps, i: 0, goal: null, el: 0 };
  }
  function runScript(dt) { // 조건이 되면 참모가 말하고, 목표가 있으면 달성(또는 제한 시간)까지 기다린다
    const st = script.steps[script.i]; if (!st || dlg || G.over) return;
    const d = me();
    if (script.goal) { if (!paused) script.el += dt; if (st.done(G, d, ui) || (st.limit && script.el >= st.limit)) { script.goal = null; script.i++; setGoal(''); } return; }
    if (!st.when || st.when(G, d, ui)) say(st.adv, st.say, () => { if (st.mark) { save.seen[st.mark] = 1; persist(); } if (st.goal) { script.goal = st.goal; script.el = 0; setGoal(st.goal); } else script.i++; });
  }

  // ───────── 타이틀·이야기 ─────────
  function showMenu() { $('#menu').hidden = false; drawMenu(); DD.Music.play('menu'); }
  // 언어 버튼(타이틀·설정). 누르면 화면의 글이 그 자리에서 바뀐다
  const langRow = () => Object.keys(DD.LANGS).map((l) => `<button class="${DD.lang === l ? 'on' : ''}" data-lang="${l}" data-no-i18n>${DD.LANGS[l]}</button>`).join('');
  document.addEventListener('click', (ev) => { const b = ev.target.closest('[data-lang]'); if (!b) return; DD.Audio.play('click'); DD.setLang(b.dataset.lang); document.querySelectorAll('[data-lang]').forEach((x) => x.classList.toggle('on', x.dataset.lang === DD.lang)); });
  function showTitle() {
    DD.Music.play('title'); DD.Music.preload(['menu']);
    const rs0 = document.documentElement.style; for (const k of ['panel', 'btn_gold', 'btn_dark', 'btn_blue']) rs0.setProperty('--ui-' + k.replace('_', '-'), `url(${DD.icon('ui_' + k)})`); // UI 시트의 패널·버튼을 CSS 테두리 그림으로
    $('#loading').hidden = true; $('#title').hidden = false;
    $('#title').innerHTML = `<div><h1>${DD.TITLE.name}</h1><div class="en">${DD.TITLE.ko}</div><p>${DD.TITLE.sub}${DD.DEMO ? ' · 데모' : ''}</p><button class="start" id="begin">게임 시작</button><div class="langs">${langRow()}</div></div>`;
    $('#begin').onclick = () => { DD.Audio.play('click'); $('#title').hidden = true; if (!save.tutorialDone) showStory(() => startGame(true)); else showMenu(); };
  }
  function showStory(onEnd) {
    let i = 0, t0 = 0, raf = 0; const el = $('#story'); $('#menu').hidden = true; el.hidden = false; DD.Music.play('title');
    const src = (k) => (k === 'capsule' ? 'art/capsule.webp' : DD.PROLOGUE_ART[k] ? `art/prologue_${k}.webp` : null);
    DD.STORY.forEach((sl) => { const u = src(sl.art); if (u) new Image().src = u; }); // 넘길 때 빈 화면이 보이지 않게 미리 받는다
    const draw = () => {
      const sl = DD.STORY[i], u = src(sl.art); cancelAnimationFrame(raf);
      el.innerHTML = `<div class="art">${u ? `<img class="map" src="${u}">` : '<canvas class="px map" width="320" height="160"></canvas>'}</div><div class="txt">${sl.lines.map((l, n) => `<p style="animation-delay:${n * 1.1}s">${l}</p>`).join('')}</div><div class="nav"><button id="skip">건너뛰기</button><button id="next" class="on">${i === DD.STORY.length - 1 ? '시작' : '다음 ▸'}</button></div>`;
      $('#next').onclick = () => { DD.Audio.play('click'); if (++i >= DD.STORY.length) end(); else draw(); }; $('#skip').onclick = end;
      if (u) return;
      const cx = el.querySelector('canvas').getContext('2d'); t0 = performance.now();
      const tick = (now) => { DD.prologue(cx, sl.art, (now - t0) / 1000); raf = requestAnimationFrame(tick); }; tick(t0);
    };
    const end = () => { cancelAnimationFrame(raf); el.hidden = true; save.storySeen = 1; persist(); onEnd(); };
    draw();
  }

  function toast(t, cls) { const e = document.createElement('div'); e.textContent = t; if (cls) e.className = cls; const f = $('#feed'); f.prepend(e); while (f.children.length > 4) f.lastChild.remove(); setTimeout(() => e.remove(), 4000); }
  function banner(title, sub, boss) { $('#banner').innerHTML = `<div class="${boss ? 'boss' : ''}"><b>${title}</b><span>${sub}</span></div>`; }
  function heroCard(e) { $('#herocard').innerHTML = `<div class="g${['R', 'SR', 'SSR'].indexOf(e.grade)}"><img class="px" src="${DD.icon(e.spr)}"><img class="px badge" src="${DD.icon('ui_grade' + e.grade)}"><span><b>${e.grade} · ${e.name}</b>영웅 합류</span></div>`; }
  function callWave() { const err = G.cmd(G.human, { a: 'callwave' }); if (err) { toast(err, 'bad'); DD.Audio.play('err'); } }
  function togglePause() { if (ui.edit) { if (applyEdit()) paused = false; } else paused = !paused; }
  function setSpeed(sp) { if (applyEdit()) { speed = sp; paused = false; } }
  function act(c) { if (c.a === 'move') { ui.moved = true; ui.ping = { x: c.x, y: c.y, r: performance.now() }; }
    const err = G.cmd(G.human, c); if (err) { toast(err, 'bad'); DD.Audio.play('err'); } return !err; }
  function set(id, html) { if (lastHtml[id] !== html) { lastHtml[id] = html; $(id).innerHTML = html; } }
  const cost = (c, d) => `<span class="cost"><i class="g ${d.gold < c.g ? 'no' : ''}">${ic('ui_coin')}${c.g}</i>${c.m ? `<i class="m ${d.mat < c.m ? 'no' : ''}">${ic('ui_crate')}${c.m}</i>` : ''}</span>`;
  const mmss = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  // 핫바 칸 하나. tip은 마우스를 올리면 정보 줄에 뜬다.
  // 핫바 칸 하나. tip은 마우스를 올리면 오른쪽 설명 상자에 뜬다.
  const spotOf = () => (script.goal && script.steps[script.i] ? script.steps[script.i].hl : null);
  const slot = (act, body, tip, o) => `<button class="slot ${o.on ? 'on' : ''} ${o.cls || ''} ${spotOf() === act ? 'spot' : ''}" data-a="${act}" data-tip="${tip.replace(/"/g, '&quot;')}" ${o.dim ? 'data-dim="1"' : ''}>${o.key ? `<kbd>${o.key}</kbd>` : ''}${body}</button>`;
  const grp = (name, slots, cls) => `<div class="grp ${cls || ''}"><h3>${name}</h3><div class="slots">${slots}</div></div>`;
  const nextWave = () => { if (G.wave >= C.WAVES) return '마지막 웨이브'; const c = {}, mu = DD.MUTS[G.muts[G.wave + 1]]; DD.waveList(G.wave + 1).forEach((t) => (c[t] = (c[t] || 0) + 1)); return Object.keys(c).map((t) => { const m = DD.DEMONS[t]; return `<span class="${m.fly ? 'fly' : ''}" data-tip="<b>${m.name} ×${c[t]}</b>${m.desc}">${icon(m.spr, 2)}${c[t]}</span>`; }).join(' ') + (mu ? ` <span class="mut" data-tip="<b>변이 · ${mu.name}</b>${mu.desc}">${mu.name}</span>` : ''); };
  const UKEY = ['Q', 'W', 'R', 'Y'], BKEY = ['A', 'S', 'D', 'F', 'G'];
  function drawHud() {
    const d = me(), R = d.R, own = d.units.filter((u) => u.own === d.i).length, hp = d.heart.hp / d.heart.mhp;
    const next = G.nextWaveIn(), span = G.wave === 0 ? C.FIRST_WAVE : C.WAVE_T;
    set('#top', `<div class="stage">${G.st.name} · ${R.name}${G.diff !== 1 ? ' · ' + G.D.name : ''}</div><div class="timer">${mmss(G.endT - G.t)}</div>
      <div class="wave"><b>WAVE ${G.wave}<small style="display:inline">/${C.WAVES}</small></b><small>다음 ${mmss(next)}</small></div>${DD.canCall(G) ? `<button class="call" data-a="callwave:1"><kbd>N</kbd> ${G.wave >= C.WAVES ? '기다리지 않고 끝내기' : '다음 웨이브 부르기'} <span class="gold">+●${DD.callBonus(G)}</span></button>` : `<button class="call" disabled><kbd>N</kbd> ${G.wave >= C.WAVES ? '기다리지 않고 끝내기' : '다음 웨이브 부르기'}</button>`}
      <div class="nextw">${nextWave()}</div>
      <div class="prog"><i style="width:${Math.round(Math.max(0, 1 - next / span) * 50) * 2}%"></i></div>
      <div class="res"><span class="gold">${ic('ui_coin')} ${Math.floor(d.gold)}</span><span class="mat">${ic('ui_crate')} ${Math.floor(d.mat)}</span><span class="pop">${ic('ui_pop')} 인구 ${own}/${d.pop}</span></div>
      <div class="heart">${ic('ui_heart')} ${Math.ceil(d.heart.hp)}<i class="hpbar"><i style="width:${Math.max(0, hp * 100)}%"></i></i></div>`);
    set('#sys', `${[1, 2, 4].map((sp, i) => `<button class="${speed === sp && !paused ? 'on' : ''}" data-a="speed:${sp}" data-tip="<b>${sp}배속</b>단축키 ${i + 1}">${sp}×</button>`).join('')}<button class="${paused ? 'on' : ''}" data-a="pause:1" data-tip="<b>일시정지</b>단축키 Space · 멈춘 동안에도 소환·건설·길 편집을 할 수 있다">Ⅱ</button>
      <button class="wide" data-a="settings:1" data-tip="<b>설정</b>배경음악·효과음 음량, 피격 번쩍임 · Esc">⚙ 설정</button><button class="wide" data-a="quit:1" data-tip="<b>나가기</b>이번 판을 포기한다(보상 없음)">나가기</button>`);
    if (G.dungeons.length > 1) set('#allies', `<button class="${ui.world ? 'on' : ''}" data-a="world:1">지도 <kbd>Tab</kbd></button>` + G.dungeons.map((x) => `<button class="${ui.view === x.i && !ui.world ? 'on' : ''} ${x.alive ? '' : 'dead'}" data-a="view:${x.i}">${x.i + 1} ${x.i === G.human ? '나' : x.R.name} <small>${x.alive ? '♥' + pct(x.heart.hp / x.heart.mhp) + '%' : '함락'}</small></button>`).join(''));
    else set('#allies', '');
    const gc = DD.gridCount(ui.draft ? ui.draft.grid : d.grid), no = (c) => d.gold < c.g || d.mat < c.m;
    const dr = ui.draft;
    let maze = slot('edit:1', `<b class="glyph">${ui.edit ? '✔' : '▦'}</b><em>${ui.edit ? '적용' : '길 편집'}</em>`, ui.edit ? `<b>적용하고 계속</b>${dr.err ? `<small class="bad">${dr.err}</small>` : '조건이 맞습니다'}` : `<b>길 편집</b>게임을 멈추고 길과 벽을 고친다<small>악마 경로 ${d.path.length}칸 · 길 ${gc.road}/${C.ROAD_MAX} · 벽 ${gc.wall}/${C.WALL_MAX}</small>`, { on: ui.edit, key: 'E', dim: ui.edit && !!dr.err, cls: ui.edit ? '' : 'span2' });
    if (ui.edit) maze += [[1, '길 깔기', '악마가 걷는 칸을 만든다', 'Z'], [2, '벽 쌓기', '통과와 사격을 막는 칸', 'X'], [0, '지우기', '바닥으로 되돌린다 · 우클릭으로도 지운다', 'C']].map(([t, n, tip, key]) => slot('tool:' + t, `<b class="glyph">${['✕', '▤', '▣'][t]}</b><em>${n}</em>`, `<b>${n}</b>${tip}`, { on: ui.tool === t, key })).join('')
      + slot('resetmaze:1', `<b class="glyph">↺</b><em>기본 길</em>`, '<b>기본 길</b>ㄹ 모양으로 되돌린다', {}) + slot('undo:1', `<b class="glyph">↶</b><em>되돌리기</em>`, '<b>되돌리기</b>마지막으로 칠한 것을 되돌린다 · Ctrl+Z', { key: '^Z', dim: !dr.hist.length }) + slot('editcancel:1', `<b class="glyph">✖</b><em>취소</em>`, '<b>취소</b>고친 것을 버리고 나간다', { key: 'Esc' });
    const units = R.units.map((u, i) => { const f = DD.reqFail(d, u); return slot('summon:' + i, `<img class="px tier" src="${DD.icon('ui_tier' + u.tier)}" alt="">${icon(u.spr, 2)}${f ? '<span class="cost bad">잠김</span>' : cost(u, d)}`, `<b>${u.name}</b>${ic('ui_coin')} ${u.g}${u.m ? ' ' + ic('ui_crate') + ' ' + u.m : ''} · 보유 ${d.units.filter((x) => x.def === u && x.own === d.i).length}기<br>체력 ${u.hp} · 공격 ${u.atk} · 사거리 ${u.rng}${u.heal ? ' · 치유 ' + u.heal : ''}${u.splash ? ' · 범위' : ''}${f ? `<small class="bad">${f}</small>` : ''}`, { dim: f || no(u), key: UKEY[i], cls: f ? 'lock' : '' }); }).join('')
      + (ui.edit ? '' : slot('hero:1', `${icon('f_altar', 2)}<span class="cost">${d.heroT <= 0 ? '준비!' : mmss(d.heroT)}</span>`, `<b>영웅 소환</b>${d.heroT <= 0 ? '누가 올지는 모른다' : '대기 ' + mmss(d.heroT)}`, { dim: d.heroT > 0, key: 'T', cls: 'tall' + (d.heroT <= 0 ? ' ready' : '') })
      + (() => { const gc2 = DD.gambleCost(R), mp = DD.mergePlan(d, [...ui.sel]), need = DD.mergeNeed(d.race), P = DD.gambleP(R), toN = mp ? (mp.to ? mp.to.name : '2단계 무작위') : '';
        return slot('gamble:1', `<em>랜덤 소환</em>${cost(gc2, d)}`, `<b>랜덤 소환</b>${ic('ui_coin')} ${gc2.g}<br>건물 조건 없이 유닛 하나를 뽑는다<small>${R.units.map((u, i) => `${u.name} ${pct(P[i])}%`).join(' · ')}</small>`, { key: 'V', cls: 'short', dim: no(gc2) || own >= d.pop })
          + slot('merge:1', `<em>조합</em><span class="cost">${mp ? '→ ' + (mp.to ? toN : '2단계') : need + '기 필요'}</span>`, `<b>조합</b>같은 유닛 ${need}기를 한 단계 위 유닛 하나로 합친다<br>${mp ? `${mp.def.name} ${need}기 → <span class="gold">${toN}</span>` : '지금은 합칠 유닛이 없다'}<small>유닛을 골라 두면 그 종류를 합친다 · 최상위 ${need}기는 전설 ${R.legend.name}</small>`, { key: 'B', cls: 'short' + (mp && mp.to && mp.to.legend ? ' ready' : ''), dim: !mp }); })());
    const bslots = R.blds.map((b, i) => { const c = DD.bldCost(d, b), have = d.bc[b.id] || 0, full = have >= DD.bldMax(b); return slot('build:' + i, `${icon(b.spr + '@' + d.race, 2)}${full ? '<span class="cost">최대</span>' : cost(c, d)}`, `<b>${b.name}</b>${ic('ui_coin')} ${c.g}${c.m ? ' ' + ic('ui_crate') + ' ' + c.m : ''} · 보유 ${have}/${DD.bldMax(b)}<br>${b.desc}${b.atk ? `<br>공격 ${b.atk} · 사거리 ${b.rng} · 간격 ${b.as}초${b.splash ? ' · 범위' : ''}` : ''}<small>${b.kind === 'wall' ? '길 위에만 세운다 · 악마를 붙잡아 둔다' : '바닥에 세운다'}</small>`, { dim: full || no(c), on: ui.build === i, key: BKEY[i] }); });
    const blds = bslots.filter((x, i) => i !== 3).join('');
    maze = bslots[3] + maze;
    const ac = DD.upCost(d, 'altar'), ap = DD.ALTAR[d.altarLv - 1].p;
    const ups = ['atk', 'hp', 'bld'].map((k) => { const u = DD.UPGRADES[k], c = DD.upCost(d, k); return slot('up:' + k, `<b class="glyph">${{ atk: '⚔', hp: '♥', bld: '▲' }[k]}<sub>${d.up[k]}</sub></b><em>${u.name.replace(' 강화', '')}</em>${c ? cost(c, d) : '<span class="cost">최대</span>'}`, `<b>${u.name} Lv.${d.up[k]}</b>${u.desc}`, { dim: !c || no(c) }); }).join('')
      + slot('up:altar', `<b class="glyph">★<sub>${d.altarLv}</sub></b><em>제단</em>${ac ? cost(ac, d) : '<span class="cost">최대</span>'}`, `<b>영웅 제단 Lv.${d.altarLv}</b>R ${pct(ap[0])}% · SR ${pct(ap[1])}% · SSR ${pct(ap[2])}%<small>강화하면 등급↑ 대기↓</small>`, { dim: !ac || no(ac) });
    set('#bar', grp('유닛 소환', units) + grp('건물 · 바닥에', blds) + grp('길 · 방벽은 길 위에', maze, ui.edit ? 'c3' : '') + (ui.edit ? '' : grp('강화', ups))); // 편집 중에는 도구가 한 줄 더 생기므로 강화 묶음을 접는다
    const hl = spotOf(), gm = $('#game'); gm.classList.toggle('guide', !!hl); gm.classList.toggle('dimfield', !!hl && ui.build < 0 && !ui.edit); // 튜토리얼: 목표 칸만 밝게
    set('#tip', ui.tip || inspect() || ''); placeTip();
    const bp = d.boonPick; // 전리품 고르기: 고를 때까지 게임이 멈춘다
    set('#boon', bp ? `<div class="box"><h2>전리품</h2><p>악마 군주를 쓰러뜨렸다. 하나를 고른다.</p><div class="cards c3">${bp.map((bi, i) => `<button class="card" data-a="boon:${i}"><kbd>${i + 1}</kbd><b>${DD.BOONS[bi].name}</b><small>${DD.BOONS[bi].desc}</small></button>`).join('')}</div></div>` : ''); $('#boon').hidden = !bp;
    const vd = G.dungeons[ui.view], boss = !ui.world && vd.demons.find((e) => e.def.spr === 'd_boss' && e.hp > 0);
    set('#bossbar', boss ? `<b>${boss.def.name}</b><i><i style="width:${Math.max(0, Math.round((boss.hp / boss.mhp) * 100))}%"></i></i><span>${Math.ceil(boss.hp)}</span>` : '');
    $('#paused').hidden = !(paused && !ui.edit && !dlg && !G.over);
    // 아래 정보 줄: 편집 안내 > 선택 > 기본 안내
    let info = '유닛 선택 → 바닥 클릭으로 배치 · 더블클릭으로 같은 유닛 모두 선택 · 소환소를 누르면 집결지';
    if (ui.world) info = '<b>지도</b> · 요새를 누르면 들어간다';
    else if (ui.view !== G.human) info = `<b>${G.dungeons[ui.view].R.name}</b> 관전 중`;
    else if (ui.rally) info = `<b>${ui.rally === 'H' ? '영웅 제단' : '소환소'}</b> · 새로 오는 ${ui.rally === 'H' ? '영웅' : '유닛'}이 모일 자리를 클릭 <button data-a="rallyclear:${ui.rally}">기본 배치로</button>`;
    else if (ui.edit) info = `<b>길 편집 · 게임 멈춤</b> · ${['지우기', '길 깔기', '벽 쌓기'][ui.tool]} · 악마 경로 <b class="${dr.path.length > d.path.length ? 'good' : dr.path.length < d.path.length ? 'bad' : ''}">${dr.path.length}칸</b>(지금 ${d.path.length}) · 길 ${gc.road}/${C.ROAD_MAX} 벽 ${gc.wall}/${C.WALL_MAX} · ${ui.draft.err ? `<span class="bad">✘ ${ui.draft.err}</span>` : '<span class="good">✔ E로 적용</span>'}`;
    else if (ui.build >= 0) info = `<b>${R.blds[ui.build].name}</b> · <span class="good">초록 칸</span>${R.blds[ui.build].kind === 'wall' ? '(길 위)' : '(바닥)'}을 클릭 · Shift 연속 · 우클릭 취소`;
    else if (ui.sel.size) {
      const us = d.units.filter((u) => ui.sel.has(u.id)), names = {};
      us.forEach((u) => { const n = (u.hero ? `[${DD.GRADES[u.hero.grade].id}] ` : '') + u.def.name; names[n] = (names[n] || 0) + 1; });
      info = Object.keys(names).map((n) => `${n} ×${names[n]}`).join(' · ');
      if (us.length === 1) info += ` · ♥ ${Math.ceil(us[0].hp)}/${Math.ceil(us[0].mhp)} · 처치 ${us[0].kills}`;
      if (us.some((u) => !u.hero && u.own === d.i)) info += ` <button data-a="dismiss:1">해산 (30% 환급)</button>`;
      G.dungeons.forEach((x) => { if (x.i !== d.i && x.alive) info += ` <button data-a="support:${x.i}">→ ${x.R.name}</button>`; });
    } else if (ui.selB) {
      const b = d.blds.find((x) => x.id === ui.selB);
      if (b) info = `<b>${b.def.name}</b> · ♥ ${Math.ceil(b.hp)}/${Math.ceil(b.mhp)} · ${b.def.desc} <button data-a="sell:${b.id}">철거 (50% 환급) · Del</button>`;
    }
    set('#info', (paused && !ui.edit ? '<b class="gold">Ⅱ 일시정지</b> · ' : '') + info); $('#info').hidden = !!ui.world;
  }
  $('#side').addEventListener('mouseover', (ev) => { const b = ev.target.closest('[data-tip]'); const t = b ? b.dataset.tip : null; if (ui && ui.tip !== t) { ui.tip = t; if (b) tipAt(b); if (G) drawHud(); } });
  $('#side').addEventListener('mouseleave', () => { if (ui) { ui.tip = null; if (G) drawHud(); } });
  // 설명 상자는 패널 왼쪽으로 펼쳐진다. 내용 길이에 맞춰 커지므로 글자가 잘리지 않는다
  function tipAt(b) { const r = b.getBoundingClientRect(), s = $('#side').getBoundingClientRect(); ui.tipY = (r.top - s.top) / (s.height / 1440); }
  function placeTip() {
    const t = $('#tip'), on = !!lastHtml['#tip']; t.hidden = !on; if (!on) return;
    const h = t.offsetHeight, y = ui.tip ? ui.tipY : ui.mouse && ui.mouse.y > 180 ? 96 : 1440 - h - 110; // 전장 설명은 마우스 반대쪽에
    t.style.top = Math.max(8, Math.min(y, 1440 - h - 8)) + 'px';
  }
  // 전장 위 마우스: 악마·유닛·건물 정보를 설명 상자에
  function inspect() {
    if (!ui.mouse || ui.world || ui.edit) return '';
    const q = pickAt(ui.mouse); if (!q) return '';
    const d = G.dungeons[ui.view], e = (q.k === 'd' ? d.demons : q.k === 'u' ? d.units : d.blds).find((x) => x.id === q.id && x.hp > 0); if (!e) return '';
    const hp = `♥ ${Math.ceil(e.hp)}/${Math.ceil(e.mhp)}`;
    if (q.k === 'd') return `<b>${e.def.name}</b>${hp} · 공격 ${Math.round(e.atk)}${e.def.rng > 30 ? ' · 원거리' : ''}<small>${e.def.desc}</small>`;
    if (q.k === 'u') { const o = G.dungeons[e.own]; return `<b>${e.hero ? `[${DD.GRADES[e.hero.grade].id}] ` : ''}${e.def.name}</b>${hp} · 처치 ${e.kills}${e.own !== d.i ? `<small>${o.R.name} 지원군</small>` : e.hero ? `<small>${DD.HERO_ROLES[e.hero.role].label}</small>` : ''}`; }
    return `<b>${e.def.name}</b>${hp}<br>${e.def.desc}${e.def.atk ? `<small>공격 ${e.def.atk} · 사거리 ${e.def.rng}</small>` : ''}`;
  }
  function pickAt(p) {
    const d = G.dungeons[ui.view]; let best = null, bd = 120;
    for (const e of d.demons) { const q = (e.x - p.x) ** 2 + (e.y - 7 - p.y) ** 2; if (q < bd) { bd = q; best = { k: 'd', id: e.id }; } }
    for (const u of d.units) { const q = (u.x - p.x) ** 2 + (u.y - 7 - p.y) ** 2; if (q < bd) { bd = q; best = { k: 'u', id: u.id }; } }
    if (best) return best;
    const [cx, cy] = DD.tileAt(p.x, p.y), b = cx >= 0 && cx < C.GW && cy >= 0 && cy < C.GH ? d.occ[cx + cy * C.GW] : null;
    return b ? { k: 'b', id: b.id } : null;
  }

  $('#game').addEventListener('pointerdown', (ev) => { // click은 패널이 다시 그려지면 사라진다(누른 버튼이 교체됨) → 누르는 순간 처리
    if (ev.button !== 0) return;
    const b = ev.target.closest('[data-a]'); if (!b || !G || b.disabled) return;
    if (b.dataset.tip) { ui.tip = b.dataset.tip; tipAt(b); } // 터치 화면에서는 누르면 설명이 뜬다
    b.blur(); // 눌린 버튼에 초점이 남으면 Space·Enter가 그 버튼을 다시 누른다
    const [k, v] = b.dataset.a.split(':');
    DD.Audio.play('click');
    if (k === 'boon') { act({ a: 'boon', i: +v }); lastHtml = {}; hudT = 0; }
    else if (k === 'gamble') act({ a: 'gamble' });
    else if (k === 'merge') { if (act({ a: 'merge', ids: [...ui.sel] })) ui.sel.clear(); }
    else if (k === 'speed') setSpeed(+v);
    else if (k === 'settings') openSettings();
    else if (k === 'pause') togglePause();
    else if (k === 'quit') { if (confirm(DD.tr('포기하고 나갈까요?'))) { G.over = true; G.win = false; G.quit = true; } }
    else if (k === 'world') setWorld(!ui.world);
    else if (k === 'callwave') callWave();
    else if (k === 'skiptut') { script = { steps: [], i: 0, goal: null, el: 0 }; dlg = null; drawDlg(); setGoal(''); }
    else if (k === 'view') { if (!applyEdit()) return; ui.veil = 12; ui.world = false; ui.view = +v; ui.sel.clear(); ui.selB = null; ui.build = -1; ui.ghost = null; }
    else if (ui.view !== G.human || ui.world) toast('내 요새에서만 조작', 'bad');
    else if (k === 'rallyclear') { act({ a: 'rally', which: v }); ui.rally = null; ui.hover = null; }
    else if (k === 'edit') { if (ui.edit) applyEdit(); else enterEdit(); }
    else if (k === 'editcancel') leaveEdit();
    else if (k === 'tool') ui.tool = +v;
    else if (k === 'undo') undoEdit();
    else if (k === 'resetmaze') { pushHist(); const def = DD.defaultGrid(), d = me(); for (let n = 0; n < def.length; n++) if (!d.occ[n]) ui.draft.grid[n] = def[n]; draftSync(); } // 건물 아래 칸은 그대로 둔다
    else if (k === 'summon') act({ a: 'summon', u: +v });
    else if (k === 'build') { if (applyEdit()) { ui.build = ui.build === +v ? -1 : +v; ui.ghost = null; ui.sel.clear(); } }
    else if (k === 'up') act({ a: 'up', k: v });
    else if (k === 'hero') act({ a: 'hero' });
    else if (k === 'sell') { act({ a: 'sell', id: +v }); ui.selB = null; }
    else if (k === 'dismiss') { if (act({ a: 'dismiss', ids: [...ui.sel] })) ui.sel.clear(); }
    else if (k === 'support') { if (act({ a: 'support', ids: [...ui.sel], to: +v })) ui.sel.clear(); }
    lastHtml = {}; drawHud();
  });

  // 캔버스 입력
  function setWorld(on, view) {
    if (!G || G.dungeons.length < 2) return;
    if (!applyEdit()) return;
    ui.world = on; ui.veil = 12; ui.build = -1; ui.ghost = null; ui.box = null; ui.sel.clear(); ui.selB = null;
    if (view !== undefined && view >= 0) ui.view = view;
    lastHtml = {};
  }
  const pos = (ev) => { const r = cv.getBoundingClientRect(); return { x: ((ev.clientX - r.left) / r.width) * C.W, y: ((ev.clientY - r.top) / r.height) * C.H }; };
  let hudT = 0, veilT = 0;
  // 길 편집: 들어가면 게임이 멈추고, 초안을 자유롭게 고친 뒤 조건이 맞아야 적용되고 다시 흐른다
  function draftSync() { const dr = ui.draft, info = DD.gridPath(dr.grid); dr.path = info.path; dr.dist = info.dist; dr.err = DD.gridErr(me(), dr.grid); dr.ver++; lastHtml = {}; }
  function enterEdit() {
    if (ui.edit || ui.world || ui.view !== G.human) return;
    ui.rally = null; ui.build = -1; ui.ghost = null; ui.sel.clear(); ui.selB = null;
    DD.Audio.play('edit'); ui.edit = true; ui.wasPaused = paused; paused = true; ui.draft = { grid: Uint8Array.from(me().grid), ver: 0, hist: [] }; draftSync();
  }
  function pushHist() { const h = ui.draft.hist; h.push(Uint8Array.from(ui.draft.grid)); if (h.length > 60) h.shift(); }
  function undoEdit() { if (!ui.edit || !ui.draft.hist.length) return; ui.draft.grid = ui.draft.hist.pop(); draftSync(); }
  function leaveEdit() { ui.edit = false; ui.draft = null; ui.hover = null; paused = ui.wasPaused; lastHtml = {}; }
  function applyEdit() { // 조건이 맞으면 적용하고 true. 아니면 사유를 알리고 편집에 머문다
    if (!ui.edit) return true;
    const err = G.cmd(G.human, { a: 'grid', grid: Array.from(ui.draft.grid) });
    if (err) { toast(err, 'bad'); DD.Audio.play('err'); return false; }
    leaveEdit(); return true;
  }
  let down = null, painting = false, paintErr = '', lastPaint = '';
  let eraseDrag = false, lastHit = { id: 0, t: 0 };
  function paint(ev) { // 길 편집: 커서 아래 칸을 현재 도구로 칠한다(우클릭 드래그는 지우기)
    const tool = eraseDrag ? 0 : ui.tool, p = pos(ev), [cx, cy] = DD.tileAt(p.x, p.y), k = cx + ',' + cy + ',' + tool;
    if (k === lastPaint && ev.type !== 'pointerdown') return; lastPaint = k;
    if (cx < 0 || cy < 0 || cx >= C.GW || cy >= C.GH) return;
    const d = me(), i = cx + cy * C.GW, gr = ui.draft.grid, n = DD.gridCount(gr); let err = null;
    if (DD.isFixed(cx, cy) || (cx === C.ENT_T[0] && cy === C.ENT_T[1])) err = '바꿀 수 없는 칸';
    else if (d.occ[i]) err = '건물이 있는 칸';
    else if (gr[i] === tool) return;
    else if (tool === 1 && n.road >= C.ROAD_MAX) err = `길은 ${C.ROAD_MAX}칸까지`;
    else if (tool === 2 && n.wall >= C.WALL_MAX) err = `벽은 ${C.WALL_MAX}칸까지`;
    else { gr[i] = tool; draftSync(); }
    if (err && err !== paintErr) { paintErr = err; toast(err, 'bad'); DD.Audio.play('err'); }
  }
  cv.addEventListener('pointerdown', (ev) => { if (!G) return; if (ui.world) { const p = pos(ev), i = DD.worldPick(G, p.x, p.y); if (i >= 0) setWorld(false, i); return; } if (ui.view !== G.human) return; if (ui.edit) { pushHist(); painting = true; paintErr = ''; eraseDrag = ev.button === 2; paint(ev); return; } cv.setPointerCapture(ev.pointerId); down = Object.assign(pos(ev), { btn: ev.button, shift: ev.shiftKey }); });
  cv.addEventListener('pointermove', (ev) => {
    if (!G || ui.world) return; const p = pos(ev), tt = DD.tileAt(p.x, p.y); ui.mouse = p;
    if (ui.rally) { ui.hover = [Math.round(p.x), Math.round(p.y)]; return; }
    if (ui.edit) { ui.hover = tt; if (painting) paint(ev); return; }
    ui.mouse = p; const pk = pickAt(p); if ((pk && pk.id) !== ui.insp) { ui.insp = pk && pk.id; hudT = 0; }
    if (ui.build >= 0) ui.ghost = { cx: tt[0], cy: tt[1], b: me().R.blds[ui.build] };
    else if (down && down.btn === 0 && Math.hypot(p.x - down.x, p.y - down.y) > 5) ui.box = { x0: down.x, y0: down.y, x1: p.x, y1: p.y };
  });
  cv.addEventListener('pointerup', (ev) => {
    if (painting && ui.edit) { const h = ui.draft.hist, l = h[h.length - 1]; if (l && l.every((v, i) => v === ui.draft.grid[i])) h.pop(); } // 바뀐 게 없는 획은 기록하지 않는다
    painting = false; eraseDrag = false; hudT = 0; // 입력 직후 HUD를 바로 갱신한다
    if (!G || !down) return; const p = pos(ev), d = me(), dn = down, tt = DD.tileAt(p.x, p.y); down = null;
    if (ui.edit) return;
    if (dn.btn === 2 && ui.rally) { ui.rally = null; ui.hover = null; return; }
    if (ui.rally) { if (act({ a: 'rally', which: ui.rally, x: p.x, y: p.y })) { ui.rally = null; ui.hover = null; } return; }
    if (dn.btn === 2) { if (ui.build >= 0) { ui.build = -1; ui.ghost = null; } else if (ui.sel.size) act({ a: 'move', ids: [...ui.sel], x: p.x, y: p.y }); return; }
    if (ui.build >= 0) { const ok = act({ a: 'build', b: ui.build, cx: tt[0], cy: tt[1] }); if (ok && !ev.shiftKey) { ui.build = -1; ui.ghost = null; } hudT = 0; return; }
    if (ui.box) {
      const b = ui.box; ui.box = null; if (!dn.shift) ui.sel.clear(); ui.selB = null;
      d.units.forEach((u) => { if (u.own === d.i && u.x >= Math.min(b.x0, b.x1) && u.x <= Math.max(b.x0, b.x1) && u.y - 5 >= Math.min(b.y0, b.y1) && u.y - 5 <= Math.max(b.y0, b.y1)) ui.sel.add(u.id); });
      return;
    }
    let hit = null, bd = 170;
    d.units.forEach((u) => { if (u.own !== d.i) return; const q = (u.x - p.x) ** 2 + (u.y - 9 - p.y) ** 2; if (q < bd) { bd = q; hit = u; } });
    if (hit) { const now = performance.now(), dbl = lastHit.id === hit.id && now - lastHit.t < 350; lastHit = { id: hit.id, t: now };
      if (!dn.shift) ui.sel.clear(); ui.selB = null;
      if (dbl) d.units.forEach((u) => { if (u.own === d.i && u.def === hit.def) ui.sel.add(u.id); }); else ui.sel.add(hit.id); return; }
    const fac = tt[0] === C.SUMMON_T[0] && tt[1] === C.SUMMON_T[1] ? 'U' : tt[0] === C.ALTAR_T[0] && tt[1] === C.ALTAR_T[1] ? 'H' : null;
    if (fac) { ui.rally = fac; ui.sel.clear(); ui.selB = null; return; } // 소환소·제단을 누르면 집결지를 고른다
    if (ui.sel.size) { act({ a: 'move', ids: [...ui.sel], x: p.x, y: p.y }); return; }
    const b = tt[0] >= 0 && tt[0] < C.GW ? d.occ[tt[0] + tt[1] * C.GW] : null;
    ui.selB = b ? b.id : null;
  });
  cv.addEventListener('wheel', (ev) => { if (!G || G.dungeons.length < 2) return; ev.preventDefault(); if (ev.deltaY > 0 && !ui.world) setWorld(true); else if (ev.deltaY < 0 && ui.world) { const p = pos(ev), i = DD.worldPick(G, p.x, p.y); setWorld(false, i >= 0 ? i : ui.view); } }, { passive: false });
  cv.addEventListener('contextmenu', (ev) => ev.preventDefault());
  cv.addEventListener('pointerleave', () => { if (ui) { ui.mouse = ui.insp = null; hudT = 0; } });
  // 단축키는 ev.code(자판 위치)로 읽는다: 한글 입력 상태·Caps Lock·Shift와 상관없이 듣는다
  const UCODE = ['KeyQ', 'KeyW', 'KeyR', 'KeyY'], BCODE = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'], TCODE = { KeyZ: 1, KeyX: 2, KeyC: 0 };
  const SCODE = { Digit1: 1, Digit2: 2, Digit3: 4, Numpad1: 1, Numpad2: 2, Numpad3: 4 };
  window.addEventListener('keydown', (ev) => {
    const k = ev.code, ctrl = ev.ctrlKey || ev.metaKey, enter = k === 'Enter' || k === 'NumpadEnter';
    if (!$('#settings').hidden) { if (k === 'Escape' && !ev.repeat) closeSettings(); return; }
    if (!$('#story').hidden) { if (k === 'Space' || enter) { ev.preventDefault(); $('#next').click(); } else if (k === 'Escape') $('#skip').click(); return; }
    if (!$('#result').hidden) { if (enter && !ev.repeat) { ev.preventDefault(); const b = $('#next2') || $('#again') || $('#back'); if (b) b.click(); } return; }
    if (!$('#title').hidden) { if ((enter || k === 'Space') && !ev.repeat) { ev.preventDefault(); $('#begin').click(); } return; }
    if (!G || G.over) return;
    if (dlg) { if (k === 'Space' || enter) advance(); ev.preventDefault(); return; }
    if (me().boonPick) { const bi = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[k]; if (bi != null && !ev.repeat) { act({ a: 'boon', i: bi }); lastHtml = {}; hudT = 0; } ev.preventDefault(); return; }
    lastHtml = {}; hudT = 0;
    const mine = !ui.world && ui.view === G.human, rep = ev.repeat;
    if (ctrl) {
      if (k === 'KeyA' && mine) { me().units.forEach((u) => u.own === G.human && ui.sel.add(u.id)); ui.selB = null; ev.preventDefault(); }
      else if (k === 'KeyZ' && ui.edit) { undoEdit(); ev.preventDefault(); }
      return;
    }
    if (k === 'KeyE' && mine) { if (!rep) { if (ui.edit) applyEdit(); else enterEdit(); } }
    else if (k === 'KeyN') { if (!rep) callWave(); }
    else if (k === 'Tab' || k === 'KeyM') { ev.preventDefault(); if (!rep) setWorld(!ui.world); }
    else if (k === 'Escape') { if (!rep && !ui.edit && !ui.rally && ui.build < 0 && !ui.sel.size && !ui.selB) return openSettings(); if (ui.edit) leaveEdit(); ui.rally = null; ui.build = -1; ui.ghost = null; ui.sel.clear(); ui.selB = null; }
    else if (ui.edit && k in TCODE) ui.tool = TCODE[k];
    else if (mine && UCODE.includes(k)) act({ a: 'summon', u: UCODE.indexOf(k) });
    else if (mine && k === 'KeyT') act({ a: 'hero' });
    else if (mine && k === 'KeyV') act({ a: 'gamble' });
    else if (mine && k === 'KeyB') { if (!rep && act({ a: 'merge', ids: [...ui.sel] })) ui.sel.clear(); }
    else if (mine && BCODE.includes(k)) { if (!rep && applyEdit()) { const i = BCODE.indexOf(k); ui.build = ui.build === i ? -1 : i; ui.ghost = null; ui.sel.clear(); ui.selB = null; } }
    else if (k === 'Space') { ev.preventDefault(); if (!rep) togglePause(); }
    else if (k in SCODE) setSpeed(SCODE[k]);
    else if ((k === 'Delete' || k === 'Backspace') && mine && ui.selB) { ev.preventDefault(); act({ a: 'sell', id: ui.selB }); ui.selB = null; }
  });

  const K = 4; // 캔버스는 언제나 4배(2208×1440)로 그린다
  function resize() {
    const s = Math.min(window.innerWidth / 2560, window.innerHeight / 1440);
    $('#root').style.transform = `translate(-50%, -50%) scale(${s})`;
    cv.style.imageRendering = Number.isInteger(s * K) ? 'pixelated' : 'auto'; // 정수 배가 아니면 부드럽게 줄인다
  }
  window.addEventListener('resize', resize);

  function loop(now) {
    if (!G) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    runScript(dt);
    if (!paused && !dlg && !G.over && !me().boonPick) { acc += dt * speed; let n = 0; while (acc >= DD.DT && n++ < 60) { G.step(); acc -= DD.DT; } }
    for (const e of G.events.splice(0)) {
      const who = (i) => (i === G.human ? '내 요새' : G.dungeons[i].R.name);
      if (e.t === 'wave') DD.Audio.play(e.w % 5 === 0 ? 'boss' : 'wave'); else if (e.t === 'fall') DD.Audio.play('fall');
      if (e.t === 'wave') banner('WAVE ' + e.w, e.w % 5 === 0 ? '악마 군주가 온다' : e.mut ? `변이 · ${DD.MUTS[e.mut].name} — ${DD.MUTS[e.mut].desc}` : '악마 침공', e.w % 5 === 0);
      else if (e.t === 'gamble' && e.d === G.human) toast(`랜덤 소환 · ${e.name}`, e.tier > 1 ? 'good' : '');
      else if (e.t === 'merge' && e.d === G.human) { if (e.legend) banner(e.name, '전설 유닛 탄생'); else toast(`조합 · ${e.name}`, 'good'); }
      else if (e.t === 'boon' && e.d === G.human) { DD.Audio.play('ready'); lastHtml = {}; hudT = 0; }
      else if (e.t === 'boonGot' && e.d === G.human) toast(`전리품 · ${DD.BOONS[e.b].name} — ${DD.BOONS[e.b].desc}`, 'good');
      else if (e.t === 'hero' && e.d === G.human) heroCard(e);
      else if (e.t === 'herodead' && e.d === G.human) toast(`${e.name} 전사`, 'bad');
      else if (e.t === 'fall') banner(who(e.d) + ' 함락', '악마가 남은 요새로 몰려온다', true);
      else if (e.t === 'support') toast(`${who(e.d)} → ${who(e.to)} 유닛 ${e.n}기 지원`);
      else if (e.t === 'called' && e.bonus) { toast(`웨이브를 앞당겼다 · 보너스 ●${e.bonus}`, 'good'); DD.Audio.play('coin'); }
      if (e.t === 'wave') for (const t of new Set(DD.waveList(e.w))) if (!ui.seenD.has(t)) { ui.seenD.add(t); if (e.w > 1) { toast(`새 악마 · ${DD.DEMONS[t].name} — ${DD.DEMONS[t].desc}`, 'info'); setTimeout(() => DD.Audio.play('alert'), 1300); } } // 웨이브 뿔피리 뒤에
    }
    { // 군주가 내 요새에 있으면 군주 곡, 사라지면 맵 곡을 멈췄던 자리부터
      const want = me().demons.some((e) => e.def.spr === 'd_boss' && e.hp > 0) ? 'boss' : G.st.id;
      if (want !== ui.music && !G.over) { ui.music = want; DD.Music.play(want, { fade: want === 'boss' ? 0.6 : 2, resume: want !== 'boss' }); }
    }
    { // 내 요새 알림: 영웅 소환 준비, 웨이브 격퇴
      const d = me(), hr = d.alive && d.heroT <= 0, busy = !!(d.demons.length || d.queue.length);
      if (hr && !ui.heroReady) { toast('영웅 소환 준비 · T', 'good'); DD.Audio.play('ready'); }
      const low = d.alive && d.heart.hp < d.heart.mhp * 0.3;
      if (low && !ui.low) { toast('심장이 위험합니다! 병력을 심장 앞으로', 'bad'); DD.Audio.play('alarm'); }
      ui.low = low;
      if (ui.busy && !busy && d.alive && !G.over) { toast(`웨이브 ${G.wave} 격퇴${DD.canCall(G) ? ` · N으로 다음 웨이브 (+●${DD.callBonus(G)})` : ''}`, 'good'); DD.Audio.play('clear'); }
      ui.heroReady = hr; ui.busy = busy;
    }
    // 보고 있는 요새에서 이번 프레임에 난 소리만 낸다
    for (const d of G.dungeons) { if (d.i === ui.view && !paused) for (const k in d.snd) DD.Audio.play(k); d.snd = {}; }
    if (ui.veil > 0) { veilT -= dt; if (veilT <= 0) { veilT = 1 / 12; ui.veil -= 4; } } // 디더 가림막을 12fps로 4단계씩 걷는다
    ctx.setTransform(K, 0, 0, K, 0, 0);
    if (ui.world) DD.drawWorld(ctx, G, ui); else DD.draw(ctx, G, G.dungeons[ui.view], ui);
    hudT -= dt; if (hudT <= 0) { hudT = 0.2; drawHud(); }
    if (G.over) return finish();
    requestAnimationFrame(loop);
  }
  function finish() {
    const d = me(), rs = save.races[d.race];
    let sh = G.quit ? 0 : DD.shardsFor(G.stage, d.wavesCleared, G.win, G.diff), recLine = '';
    if (G.win && !G.tutorial && !G.quit) { // 기록 갱신: 더 높은 난이도, 같은 난이도면 별이 더 많을 때. 오른 만큼 영혼석을 더 준다
      const s = DD.starsFor(d.heart.hp / d.heart.mhp), sc = (r) => (r ? r.d * 3 + r.s : 0), old = (rs.rec = rs.rec || {})[G.stage], now = { d: G.diff, s };
      const gain = sc(now) - sc(old), bonus = gain > 0 ? Math.round(gain * 3 * (1 + G.stage * 0.5)) : 0;
      if (gain > 0) { rs.rec[G.stage] = now; sh += bonus; }
      recLine = `<p class="stars big">${'★'.repeat(s)}${'☆'.repeat(3 - s)} <small>${G.D.name}${gain > 0 ? ` · 새 기록 +${bonus}` : ''}</small></p>`;
    }
    rs.shards += sh;
    let unlocked = '';
    const tut = G.tutorial && !G.quit && !save.tutorialDone;
    if (!G.tutorial && !G.quit) { rs.best = rs.best || {}; rs.best[G.stage] = Math.max(rs.best[G.stage] || 0, G.win ? C.WAVES + 1 : d.wavesCleared); }
    if (tut) { save.tutorialDone = 1; save.bonusGold = DD.TUTORIAL_GOLD; unlocked = `<p class="gold">튜토리얼 완료 보상 · 전쟁 자금 ●${DD.TUTORIAL_GOLD}</p><p>이끌 종족을 고르십시오, 사령관.</p>`; }
    else if (!G.tutorial && G.win && rs.stage === G.stage && G.stage < 5) { rs.stage++; unlocked = DD.DEMO ? '<p>데모는 여기까지. 다른 종족도 기다립니다.</p>' : `<p class="good">해금 · ${DD.stageOf(d.race, rs.stage).name}</p>`; }
    if (!G.tutorial) save.layout = Array.from(d.grid); // 다음 판에도 같은 길로 시작한다
    persist();
    DD.Audio.stopAmbience(); if (G.quit) DD.Music.stop(); else DD.Music.play(G.win ? 'victory' : 'defeat', { fade: 0.4 });
    dlg = null; drawDlg(); setGoal('');
    const nextOk = !G.tutorial && G.win && G.stage < 5 && rs.stage > G.stage && !DD.DEMO;
    const tipL = !G.win && !G.tutorial ? DD.TIPS_LOSE[Math.floor(Math.random() * DD.TIPS_LOSE.length)] : '';
    $('#result').innerHTML = `<div><h1 class="${G.win ? 'good' : 'bad'}">${G.win ? '승리' : '패배'}</h1>
      <p>${d.R.name} · ${G.st.name}${G.tutorial ? '' : ' · ' + G.D.name}</p>${recLine}
      <div class="stats"><span><b>${d.wavesCleared}/${C.WAVES}</b>웨이브</span><span><b>${d.kills}</b>처치</span><span><b>${mmss(G.t)}</b>시간</span>
        <span><b>${d.nSum}</b>소환</span><span><b>${d.heroN}</b>영웅</span><span><b>${d.alive ? pct(d.heart.hp / d.heart.mhp) + '%' : '함락'}</b>심장</span></div>
      <p class="gold">${ic('ui_shard')} 영혼석 +${sh}${sh && !G.tutorial ? ` (보유 ${rs.shards})` : ''}</p>${unlocked}${tipL ? `<p class="tip">팁 · ${tipL}</p>` : ''}
      ${nextOk ? '<button id="next2" class="on">다음 스테이지 ▸</button> ' : ''}${tut || G.tutorial ? '' : `<button id="again" class="${nextOk ? '' : 'on'}">다시 도전</button> `}<button id="back">${tut ? '종족 선택' : '돌아가기'}</button>
      <small>Enter · ${nextOk ? '다음 스테이지' : tut || G.tutorial ? '종족 선택' : '다시 도전'}</small></div>`;
    $('#result').hidden = false;
    if ($('#again')) $('#again').onclick = () => startGame();
    if ($('#next2')) $('#next2').onclick = () => { menu.stage = G.stage + 1; startGame(); };
    $('#back').onclick = () => { G = null; $('#game').hidden = true; $('#result').hidden = true; showMenu(); };
  }
  // ───────── 설정(배경음악·효과음 음량, 번쩍임). 메뉴의 설정 버튼, 게임 중 ⚙ 또는 Esc ─────────
  let setWasPaused = false;
  function drawSettings() {
    const o = save.opt, row = (k, name) => `<label class="vol"><span>${name}</span><input type="range" min="0" max="100" step="5" value="${Math.round(o[k] * 100)}" data-o="${k}"><b>${Math.round(o[k] * 100)}</b></label>`;
    $('#settings').innerHTML = `<div class="box"><h2>설정</h2>${row('bgm', '배경음악')}${row('vol', '효과음')}
      <label class="vol"><span>피격 번쩍임</span><button class="${o.flash ? 'on' : ''}" data-o="flash">${o.flash ? '켜짐' : '꺼짐'}</button></label>
      <div class="vol"><span>언어</span><span class="langs">${langRow()}</span></div>
      <div class="vol"><span>화면</span><span class="langs"><button class="${document.fullscreenElement ? 'on' : ''}" data-o="fs">전체 화면</button></span></div>
      <div class="vol"><span>저장</span><span class="langs"><button data-o="reset">처음부터 다시</button></span></div>
      <button class="close" data-o="close">닫기 · Esc</button></div>`;
  }
  function openSettings() {
    if (!$('#settings').hidden) return;
    if (G && !G.over) { setWasPaused = paused; paused = true; }
    drawSettings(); $('#settings').hidden = false; if (G) { lastHtml = {}; drawHud(); }
  }
  function closeSettings() { $('#settings').hidden = true; if (G && !G.over) { paused = setWasPaused; lastHtml = {}; drawHud(); } }
  $('#settings').addEventListener('input', (ev) => {
    const k = ev.target.dataset.o; if (k !== 'vol' && k !== 'bgm') return;
    const v = +ev.target.value / 100; save.opt[k] = v; ev.target.nextElementSibling.textContent = Math.round(v * 100);
    if (k === 'vol') DD.Audio.setVol(v); else DD.Music.setVol(v);
  });
  $('#settings').addEventListener('change', (ev) => { if (ev.target.dataset.o === 'vol') DD.Audio.play('click'); persist(); });
  $('#settings').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-o]');
    if (!b) { if (ev.target.id === 'settings') closeSettings(); return; } // 바깥을 누르면 닫는다
    DD.Audio.play('click');
    if (b.dataset.o === 'flash') { save.opt.flash = !save.opt.flash; if (ui) ui.flash = save.opt.flash; persist(); drawSettings(); }
    else if (b.dataset.o === 'close') closeSettings();
    else if (b.dataset.o === 'fs') { const el = document.documentElement; (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).then(drawSettings, () => {}); }
    else if (b.dataset.o === 'reset') { if (confirm(DD.tr('모든 진행을 지우고 처음부터 다시 할까요?'))) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ } location.reload(); } }
  });
  DD.debug = { get G() { return G; }, menu, startGame, save, get script() { return script; }, get dlg() { return dlg; } };
  resize();
  DD.artReady(showTitle);
})();
