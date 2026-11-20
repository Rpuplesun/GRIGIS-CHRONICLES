// 픽셀 아트 원본. pxl 방식의 텍스트 격자(한 글자 = 논리 픽셀 1개, 팔레트 키만 사용).
// 규칙: 팔레트 밖 색 0, 반투명·안티앨리어싱 없음, 재질당 3~4단 램프. 전부 밑그림(확인 대기)이다.
(function (g) {
  const DD = (g.DD = g.DD || {});

  // 마스터 팔레트 (palettes/Dungeon.json 과 동일. tools/export_art.js 가 내보낸다)
  DD.PAL_GROUPS = {
    ink: { K: '#1a1423', W: '#ffffff' },
    steel: { s1: '#e8eef2', s2: '#9fb0c0', s3: '#5d6b82', s4: '#3a4257' },
    gold: { g1: '#ffe27a', g2: '#f2b23a', g3: '#b3741f' },
    red: { r1: '#ff8a70', r2: '#d9433b', r3: '#8f2331', r4: '#561a2a' },
    orange: { o1: '#ffc46b', o2: '#f0803c', o3: '#b34a26' },
    green: { n1: '#b9e36b', n2: '#5fb04a', n3: '#2f7a45', n4: '#1d4a3a' },
    blue: { b1: '#a8e4ff', b2: '#4fa8e8', b3: '#2b62b8', b4: '#1f3a78' },
    teal: { t1: '#9ff0d8', t2: '#3fc2a8', t3: '#1f8078' },
    purple: { p1: '#e0a8ff', p2: '#a05ad6', p3: '#5f3394', p4: '#36205a' },
    brown: { w1: '#e0b88a', w2: '#b07d4f', w3: '#74492f', w4: '#45291f' },
    skin: { k1: '#ffd9b8', k2: '#e0a57e' },
    stone: { e1: '#b5b0a8', e2: '#7d7a80', e3: '#4f4c5a', e4: '#2e2b3a' },
  };
  const PAL = (DD.PAL = {});
  for (const k in DD.PAL_GROUPS) Object.assign(PAL, DD.PAL_GROUPS[k]);

  // 격자 글자 → 팔레트 키 기본값. A/B/C=주색 밝음→어두움, D/E=보조색, F=발광
  const DEF = { o: 'K', M: 's1', m: 's3', W: 'W', e: 'K', G: 'g2', h: 'w3', w: 'w2', S: 'k1', s: 'k2', F: 'g1' };
  const S = {};
  const add = (id, name, p, g_) => (S[id] = { name, p, g: g_ });

  // ── 인간족 ──
  const HU = { A: 'b2', B: 'b3', C: 'b4', D: 'r2', E: 'r3' };
  add('u_human_1', '보병', HU, [
    '....oooo....', '...oMMMMo.M.', '..oMMMMMMoM.', '..oSSeSeo.M.', '..oSSSSSo.M.', '...oooooo.M.',
    '.ooABBBAoGGG', 'oDDoBBBASSh.', 'oDDoBBBAo...', '.oo.oCCo....', '...oCooCo...', '...oo..oo...']);
  add('u_human_2', '궁병', { A: 'n2', B: 'n3', C: 'n4' }, [
    '....oooo....', '...oAAAAo.o.', '..oAAAAAAoho', '..oASeSeo.oh', '..oASSSSo.oh', '...oooooo.oh',
    '..oABBBASSSh', '..oABBBAo.oh', '..oBBBBBo.oh', '...oCCCo.oho', '...oCoCo.o..', '...oo.oo....']);
  add('u_human_3', '기사', HU, [
    '......oooo......', '.....oMMMMo...M.', '.....oMmmMo..M..', '.....oMeMeo.M...', '....ooAAAAoM....',
    '...oDoABBAoS....', '...oDoABBAo.ooo.', '..ooooBBBooowwwo', '.owwwwwwwwwwwewo', 'owwwwwwwwwwwwwwo',
    'owoAAAAAAowwooo.', 'ooowwwwwwwwo....', '..owwoooowwo....', '..owo....owo....', '..owo....owo....', '..ooo....ooo....']);

  // ── 용족 ──
  const DR = { A: 'n2', B: 'n3', C: 'n4', D: 'g1', E: 'g2' };
  add('u_dragon_1', '리자드맨', DR, [
    '.....ooo...M', '....oAAAo.M.', '...oAWeAAoM.', '...oAAAAAAo.', '....oBBooM..', '...oBDDBSM..',
    'o..oBDDBoM..', 'oo.oBBBBo...', 'oBooBBBo....', '.oBBoCCo....', '..oooCoCo...', '....oo.oo...']);
  const DR2 = { A: 'r2', B: 'r3', C: 'r4', D: 'o2', E: 'o1' };
  add('u_dragon_2', '드레이크', DR2, [
    '..........ooo.', '.oo......oAAAo', 'oDDo....oAWeAo', '.oDDo...oAAAAo', '..oDDoooBBBoo.', '..oDDBBBBBBo..',
    '...oBBBBBBBo..', 'o..oBEEEEBo...', 'oBooBBBBBBo...', '.oBBBoooBBo...', '..ooCo..oCo...', '...oo...oo....']);
  add('u_dragon_3', '와이번', DR2, [
    '..oo........ooo.', '.oDDo......oAAAo', 'oDDDDo....oAWeAo', 'oDDDDDo...oAAAAo', 'oDEDDDDo.oBBGoo.',
    'oDEDEDDDoBBBo...', '.oEDEDDDBBBBo...', '..oEDEDBBBBBo...', '...ooEBBBBBBo...', '.....oBEEEBBo...',
    'o....oBEEEEBo...', 'oo..oBBEEEBBo...', 'oBooBBBBBBBo....', '.oBBBooooBBo....', '..ooCo...oCo....', '...oo....oo.....']);

  // ── 수인족 ──
  const BE = { A: 'w2', B: 'w3', C: 'w4', D: 'w1', E: 'r2' };
  add('u_beast_1', '코볼트', BE, [
    '............', '..o....o....', '.oAo..oAo...', '.oAAooAAo...', '.oAAAAAAo.M.', '.oAWeAWeo.M.',
    '.oAADDeAo.M.', '..oADDAoSoh.', '..oEEEEES...', '..oBBBBo....', '..oCooCo....', '..oo..oo....']);
  add('u_beast_2', '늑대전사', { A: 's2', B: 's3', C: 's4', D: 's1', E: 'r2' }, [
    '..o...o.....', '.oAo.oAo.mMm', '.oAAoAAo.MMM', '.oAAAAAoomhM', '.oAWeAAAAoh.', '.oAAAADDeoh.',
    '..oAADDDooh.', '.ooBEEBoSSh.', 'oAoBBBBBo.h.', 'oAoBBBBo....', '.o.oCoCo....', '...oo.oo....']);
  add('u_beast_3', '미노타우로스', { A: 'w2', B: 'w3', C: 'w4', D: 'w1', G: 's1' }, [
    '.o........o.....', 'oGo......oGo....', 'oGGo....oGGo.mMm', '.oGGooooGGo.mMMM', '..oAAAAAAo..MMhM',
    '..oAWeAWeo..mMhm', '..oAAAAAAo....h.', '..oADDDDAo....h.', '.ooAAeeAAoo...h.', 'oBBBBBBBBBBoSSh.',
    'oBBoBBBBoBBBSSh.', 'oSSoBBBBo.ooo.h.', 'oSSoDDDDo.......', '.oooCCCCo.......', '...oCCoCCo......', '...ooo.ooo......']);

  // ── 정령족 ──
  const SP = { A: 't1', B: 't2', C: 't3', F: 'W' };
  add('u_spirit_1', '하급정령', SP, [
    '............', '.....o......', '....oAo.....', '....oAAo....', '...oAAAAo...', '..oAAAAAAo..',
    '..oAWeAWeo..', '..oBAAAABo..', '..oBBBBBBo..', '...oBBBBo...', '....oCCo....', '.....oo.....']);
  add('u_spirit_2', '중급정령', { A: 'b1', B: 'b2', C: 'b3', F: 'W' }, [
    '.....oo.....', '....oFFo....', '...oFAAFo...', '..oAAAAAAo..', '..oAWeAWeo..', 'o.oAAAAAAo.o',
    'FooBAAAABooF', 'oBBBBBBBBBBo', '.ooBBBBBBoo.', '..oBBCCBBo..', '...oCCCCo...', '....oooo....']);
  add('u_spirit_3', '상급정령', { A: 'p1', B: 'p2', C: 'p3', F: 'g1' }, [
    '......o..o......', '.....oFooFo.....', '..o..oFFFFo..o..', '.oFo.oAAAAo.oFo.', '..o.oAAAAAAo.o..',
    '....oAWeAWeo....', '....oAAAAAAo....', '.oooBAAFFAABooo.', 'oAABBBAFFABBBAAo', 'oAoBBBBBBBBBBoAo',
    '.o.oBBBBBBBBo.o.', '...oBBBCCBBBo...', '....oBCCCCBo....', '....oCCCCCCo....', '.....oCCCCo.....', '......oooo......']);

  // ── 어인족 ──
  const ME = { A: 'b2', B: 'b3', C: 'b4', D: 'o2', E: 'b1' };
  add('u_merfolk_1', '갈퀴병', { A: 'n1', B: 'n2', C: 'n3', D: 'o2', E: 'g1' }, [
    '.....o......', '....oDo.....', '...oDDooo...', '..oAAAAAAo..', '.oAWWAAWWAo.', '.oAWeAAWeAo.',
    '.oAAAAAAAAo.', '..oAEEEEAoM.', '..oBBBBBBSM.', '.oBoBBBBo.M.', '.oo.oCoCo...', '....oo.oo...']);
  add('u_merfolk_2', '조수 주술사', { A: 't1', B: 'p2', C: 'p3', D: 'o2', E: 'g1', F: 'b1' }, [
    '....o....oo.', '...oDo..oFFo', '..oDDDo.oFFo', '..oAAAAo.oo.', '.oAWeAWeo.h.', '.oAAAAAAo.h.',
    '..oEEEEoSSh.', '.oBBBBBBo.h.', '.oBBGGBBo.h.', '.oBBBBBBo.h.', '.oCBBBBCo...', '..oooooo....']);
  add('u_merfolk_3', '심해 거인', ME, [
    '....oooooo......', '...oAAAAAAo..ooo', '..oAAAAAAAAo.oMo', '..oAWeAAWeAo.oMo', '..oAAAAAAAAoooMo',
    '.ooAEEEEEEAoMMMo', 'oBBBAAAAAABBoMo.', 'oBBBBBBBBBBBSMo.', 'oBBoBEEEEBoBSMo.', 'oSSoBEEEEBo.oMo.',
    'oSSoBEEEEBooMMMo', '.oooBBBBBBoMoMoM', '...oBBBBBBo.o.o.', '...oCCooCCo.....', '..oCCCooCCCo....', '..oooo..oooo....']);

  // ── 영웅 몸체(16×16) + 역할별 무기 덧그림 ──
  add('hb_human', '인간 영웅 몸체', { A: 's1', B: 'b2', C: 'b4', D: 'r2' }, [
    '....oGoGo.......', '....oGGGo.......', '...oMMMMMo......', '...oSeSeSo......', '...oSSSSSo......',
    '..oooooooo......', '.oDoAAGAAoo.....', 'oDDoABGBASSo....', 'oDDoABGBAoo.....', 'oDDoBBBBBo......',
    'oDDoBBBBBo......', '.oDoCCoCCo......', '.oo.oCoCo.......', '....oCoCo.......', '...ooo.ooo......', '................']);
  add('hb_dragon', '용 영웅 몸체', { A: 'r1', B: 'r2', C: 'r4', D: 'g1', E: 'p3' }, [
    '..o.....o.......', '..oGo.oGo.......', '...oAAAAAo......', '..oAWeAAAAo.....', '..oAAAAAAAo.....',
    '...oBBBooo......', '.oEoBDDBBoo.....', 'oEEoBDDDBSSo....', 'oEEoBDDDBoo.....', 'oEEoBBBBBo......',
    'oEoBBBBBBo......', 'oBoBBCoCCo......', '.oBBoCoCo.......', '..oooCoCo.......', '...ooo.ooo......', '................']);
  add('hb_beast', '수인 영웅 몸체', { A: 'g2', B: 'w2', C: 'w4', D: 'w1', E: 'g3' }, [
    '..oo....oo......', '.oEEooooEEo.....', '.oEAAAAAAEo.....', '.oEAWeAWeEo.....', '.oEAADDeAEo.....',
    '..oEADDAEo......', '.oooEEEEooo.....', 'oBBoBBGBBSSo....', 'oBBoBBGBBoo.....', 'oSSoBBBBBo......',
    '.oooBBBBBo......', '...oCCoCCo......', '...oCCoCCo......', '...oCoooCo......', '..ooo..ooo......', '................']);
  add('hb_spirit', '정령 영웅 몸체', { A: 'g1', B: 't2', C: 't3', D: 'W', E: 't1' }, [
    '....o.oo.o......', '...oFoFFoFo.....', '...oFFFFFFo.....', '..oEEEEEEEEo....', '..oEWeEEWeEo....',
    '..oEEEEEEEEo....', '.ooBEEDDEEBoo...', 'oEEBBBDDBBBEEo..', 'oEoBBBBBBBBoo...', '.o.oBBBBBBo.....',
    '...oBBCCBBo.....', '...oBCCCCBo.....', '....oCCCCo......', '....oCCCCo......', '.....oooo.......', '................']);
  add('hb_merfolk', '어인 영웅 몸체', { A: 'b1', B: 'b2', C: 'b4', D: 'o2', E: 'g1' }, [
    '.....oo.........', '....oDDo........', '...oDDDDoo......', '..oAAAAAAAo.....', '.oAWWAAAWWAo....',
    '.oAWeAAAWeAo....', '..oAAEEEAAo.....', '.oDoBBGBBoo.....', 'oDDoBBGBBSSo....', 'oDDoBBBBBoo.....',
    '.oDoBBBBBo......', '..o.oCCCCo......', '....oCoCo.......', '...oDoooDo......', '..ooo..ooo......', '................']);
  const E16 = '................';
  add('hw_war', '영웅 무기: 대검', {}, [
    '............M...', '...........oMo..', '...........oMo..', '...........oMo..', '...........oMo..', '...........oMo..',
    '..........oGGGo.', '............h...', E16, E16, E16, E16, E16, E16, E16, E16]);
  add('hw_arc', '영웅 무기: 활', {}, [
    E16, '...........oo...', '...........ohho.', '...........W.oho', '...........W..oh', '...........W..oh',
    '...........W..oh', '..........MMMMoh', '...........W..oh', '...........W..oh', '...........W.oho', '...........ohho.',
    '...........oo...', E16, E16, E16]);
  add('hw_rid', '영웅 무기: 기창', { D: 'r2' }, [
    '.............M..', '............oMo.', '..........DDoMo.', '.........DDDoMo.', '..........DDoho.', '............oho.',
    '............oho.', '............oho.', '............oho.', '............oho.', '............oho.', '............oho.',
    '............oho.', '.............o..', E16, E16]);
  add('hw_heal', '영웅 무기: 지팡이', { F: 'g1' }, [
    '...........ooo..', '..........oFFFo.', '..........oFWFo.', '..........oFFFo.', '...........oho..', '............h...',
    '............h...', '............h...', '............h...', '............h...', '............h...', '............h...',
    '............h...', '............o...', E16, E16]);

  // ── 악마 ──
  const DE = { A: 'r2', B: 'r3', C: 'r4', D: 'p3', G: 'g1' };
  add('d_imp', '임프', DE, [
    '.o......o.', 'oAo....oAo', '.oAooooAo.', '..oAAAAo..', '.ooWeWeoo.', 'oDoAAAAoDo', 'oDoBBBBoDo', '.o.oBBo.o.', '...oCoCo..', '...oo.oo..']);
  add('d_hound', '지옥견', { A: 'o2', B: 'o3', C: 'r4', G: 'g1' }, [
    '..........o.o.', '.........oAoAo', 'o.......oAAAAo', 'oo.ooooooAGeAo', '.oBBBBBBBAAAWo', '.oBBBBBBBBBooo',
    '.oBBBBBBBBo...', '.oBoBo.oBoBo..', '.oCoCo.oCoCo..', '.oo.oo.oo.oo..']);
  add('d_brute', '악귀', { A: 'p2', B: 'p3', C: 'p4', D: 'p1', G: 'g1', W: 's1' }, [
    '.oo........oo...', 'oWWo......oWWo..', '.oWWooooooWWo...', '..oAAAAAAAAo....', '..oAGeAAGeAo.oo.',
    '..oAAAAAAAAo.ohh', '..oAWoWoWoAo.ohh', '.ooAAAAAAAAooohh', 'oBBBBBBBBBBBoohh', 'oBBoBBBBBBoBBSho',
    'oBBoBDDDDBo.ooho', 'oSSoBDDDDBo...o.', '.oooBBBBBBo.....', '...oCCooCCo.....', '..oCCCooCCCo....', '..oooo..oooo....']);
  add('d_warlock', '흑마술사', { A: 'p3', B: 'p4', C: 'K', G: 'n1', F: 'n1' }, [
    '....oooo....', '...oAAAAo...', '..oAAAAAAo..', '..oAooooAo..', '..oAoGoGoo.o', '..oAAooAAooF',
    '.oAAAAAAAAoo', '.oABBBBBBSo.', '.oABBBBBBo..', '.oABBBBBBo..', 'oAABBBBBBAo.', 'oooooooooooo']);
  add('d_boss', '악마 군주', { A: 'r2', B: 'r3', C: 'r4', D: 'p4', G: 'g1', W: 's1', S: 'r1' }, [
    '..o..............o..', '.oWo............oWo.', '.oWWo..........oWWo.', '.oWWWo........oWWWo.', '..oWWWooooooooWWWo..',
    '...oooAAAAAAAAooo...', '....oAAAAAAAAAAo....', '....oAGGeAAGGeAo....', '....oAAAAAAAAAAo....', '....oAWoWoWoWAAo....',
    '.oooooAAAAAAAAooooo.', 'oBBBBBBBBBBBBBBBBBBo', 'oBBBoBBDDDDDDBBoBBBo', 'oBBBoBBDGGGGDBBoBBBo', 'oBBo.oBDDDDDDBo.oBBo',
    'oSSo.oBBBBBBBBo.oSSo', 'oSSo.oBBBBBBBBo.oSSo', '.oo..oCCCooCCCo..oo.', '....oCCCCooCCCCo....', '....ooooo..ooooo....']);

  // ── 건물(형태 공용, 종족 팔레트로 색만 바꿈) ──
  add('b_unlock1', '해금 건물 1', {}, [
    '......oooo......', '....ooAAAAoo....', '..ooAAAAAAAAoo..', '.oAAAAAAAAAAAAo.', 'oAAABBBBBBBBAAAo', 'oooooooooooooooo',
    '.oEEEEEEEEEEEEo.', '.oEDDEEEEEEDDEo.', '.oEDDEEEEEEDDEo.', '.oEEEEEooEEEEEo.', '.oEEEEohhoEEEEo.', '.oEEEEohhoEEEEo.',
    '.oEEEEohGoEEEEo.', '.oEEEEohhoEEEEo.', '.oooooooooooooo.', E16]);
  add('b_unlock2', '해금 건물 2', {}, [
    '.......oo.......', '......oGGo......', '.....oGGGGo.....', '....oooooooo....', '...oAAAAAAAAo...', '..oAABBBBBBAAo..',
    '.oooooooooooooo.', '.oEoEEoDDoEEoEo.', '.oEoEEoDDoEEoEo.', '.oEoEEoDDoEEoEo.', '.oEoEEooooEEoEo.', '.oEoEEohhoEEoEo.',
    '.oEoEEohhoEEoEo.', 'oooooooooooooooo', 'oCCCCCCCCCCCCCCo', 'oooooooooooooooo']);
  add('b_tower', '방어탑', {}, [
    '....o..oo..o....', '...oAooAAooAo...', '...oAAAAAAAAo...', '...oBBBBBBBBo...', '....oooooooo....', '....oEEEEEEo....',
    '....oEEDDEEo....', '....oEEDDEEo....', '....oEEEEEEo....', '....oEEEEEEo....', '....oEEeeEEo....', '...oEEEEEEEEo...',
    '...oEEEEEEEEo...', '..oCCCCCCCCCCo..', '..oooooooooooo..', E16]);
  add('b_wall', '방벽', {}, [
    E16, E16, '.ooo..oooo..ooo.', '.oAo..oAAo..oAo.', 'ooAooooAAooooAoo', 'oAAAAAAAAAAAAAAo', 'oEEEEoEEEEEoEEEo',
    'oooooooooooooooo', 'oEEoEEEEEoEEEEEo', 'oooooooooooooooo', 'oEEEEoEEEEEoEEEo', 'oooooooooooooooo', 'oEEoEEEEEoEEEEEo',
    'oCCCCCCCCCCCCCCo', 'oooooooooooooooo', E16]);
  add('b_special', '특수 건물', {}, [
    '.......oo.......', '......oDDo......', '.....oDDFDo.....', '.....oDFDDo.....', '....oDDFDDDo....', '....oDFDDDDo....',
    '....oDDDDDDo....', '.....oDDDDo.....', '......oDDo......', '....oooooooo....', '...oAAAAAAAAo...', '...oBBBBBBBBo...',
    '..oEEEEEEEEEEo..', '..oCCCCCCCCCCo..', '..oooooooooooo..', E16]);
  // 건물 종족 팔레트: A/B 지붕, E 벽, C 기단, D 창·수정
  DD.BLD_PAL = {
    human: { A: 'b2', B: 'b3', E: 'e1', C: 'e3', D: 'g1' },
    dragon: { A: 'r2', B: 'r3', E: 'e2', C: 'e4', D: 'o1' },
    beast: { A: 'w1', B: 'w2', E: 'w3', C: 'w4', D: 'r1' },
    spirit: { A: 't1', B: 't2', E: 's1', C: 't3', D: 'p1' },
    merfolk: { A: 'o2', B: 'o3', E: 'b2', C: 'b4', D: 'b1' },
  };

  // ── 공용 시설 ──
  add('f_heart', '던전의 심장', { A: 'r1', B: 'r2', C: 'r3', F: 'W' }, [
    '......oooo......', '....ooAAAAoo....', '...oAAFFAAABo...', '..oAAFFAAAABBo..', '..oAAFAAAABBBo..', '.oAAAAAAABBBBBo.',
    '.oAAAAAABBBBBBo.', '.oAAAABBBBBBCCo.', '..oABBBBBBBCCo..', '..oBBBBBBCCCCo..', '...oBBBBCCCCo...', '....oBBCCCCo....',
    '.oooooCCCCooooo.', 'oeMMMMooooMMMMeo', 'ommmmmmmmmmmmmmo', 'oooooooooooooooo'].map((r) => r.replace(/e/g, 'm')));
  add('f_summon', '소환소', { A: 'b1', B: 'b2', C: 'b3' }, [
    E16, E16, E16, E16, E16, '.....oooooo.....', '...ooBBBBBBoo...', '..oBBoooooBBBo..', '.oBBooAAAAooBBo.', '.oBoAAoAAoAAoBo.',
    '.oBoAAAooAAAoBo.', '.oBBooAAAAooBBo.', '..oBBBooooBBBo..', '...ooBBBBBBoo...', '.....oooooo.....', E16]);
  add('f_altar', '영웅 제단', { A: 'g1', B: 'g2', C: 'g3' }, [
    '.......oo.......', '......oAAo......', '.....oAAAAo.....', '......oBBo......', '....oooBBooo....', '...oMMMMMMMMo...',
    '...ommmmmmmmo...', '....oMMmmMMo....', '....oMMmmMMo....', '....oMMmmMMo....', '...oMMMMMMMMo...', '..oMMMMMMMMMMo..',
    '.oCCCCCCCCCCCCo.', 'ommmmmmmmmmmmmmo', 'oooooooooooooooo', E16]);

  // ── 바닥 소품(8×8). A/B/C는 스테이지 램프로 칠한다 ──
  DD.PROPS = {
    rock: ['........', '...oo...', '..oAAo..', '.oAABBo.', 'oAABBBCo', 'oBBBBCCo', '.oooooo.', '........'],
    bones: ['........', '.oo.....', 'oWWo.oo.', 'oWeWoWWo', '.oWWWWo.', '..oWoWo.', '...o.o..', '........'],
    pool: ['........', '..oooo..', '.oAABBo.', 'oAFBBBBo', 'oBBBBFBo', '.oBBBBo.', '..oooo..', '........'],
    shroom: ['........', '..oooo..', '.oAFAAo.', 'oAAAAFAo', '.ooWWoo.', '...oWo..', '...ooo..', '........'],
    tuft: ['........', '........', '.A...A..', '.B.A.B.A', 'AB.B.B.B', 'BBABABAB', '.BBBBBB.', '........'],
    crystal: ['...o....', '..oAo...', '..oABo.o', '.oAABooA', '.oABBoAB', 'oAABBoBB', 'oooooooo', '........'],
  };
  DD.STAGE_PROPS = {
    cave: [['rock', ['e1', 'e2', 'e3']], ['bones', ['e1', 'e2', 'e3']], ['crystal', ['b1', 'b2', 'b3']]],
    fire: [['pool', ['g1', 'o2', 'o3']], ['rock', ['e2', 'e3', 'e4']], ['bones', ['e1', 'e2', 'e3']]],
    water: [['pool', ['b1', 'b2', 'b3']], ['rock', ['e1', 'e2', 'e3']], ['crystal', ['t1', 't2', 't3']]],
    forest: [['shroom', ['r1', 'r2', 'r3']], ['tuft', ['n1', 'n2', 'n3']], ['rock', ['e1', 'e2', 'e3']], ['tuft', ['n1', 'n2', 'n3']]],
    abyss: [['crystal', ['p1', 'p2', 'p3']], ['bones', ['e1', 'e2', 'e3']], ['pool', ['r1', 'r2', 'r3']]],
  };
  DD.SPRITES = S;
  DD.SPR_DEF = DEF;

  // 유닛 표시용 목록(갤러리·확인용)
  DD.heroSpr = (race, role) => 'h_' + race + '_' + role;

  // ── 런타임 렌더 (브라우저 전용) ──
  const cache = {};
  function paint(ctx, def, extra, ox, oy) {
    const map = Object.assign({}, DEF, def.p, extra || {});
    def.g.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        ctx.fillStyle = PAL[map[ch]] || '#f0f';
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    });
  }
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function finish(c) {
    const w = c.width, h = c.height;
    const f = mk(w, h), fx = f.getContext('2d');
    fx.translate(w, 0); fx.scale(-1, 1); fx.drawImage(c, 0, 0);
    const wh = mk(w, h), wx = wh.getContext('2d'); // 피격 표시용 흰 실루엣
    wx.drawImage(c, 0, 0); wx.globalCompositeOperation = 'source-in'; wx.fillStyle = PAL.W; wx.fillRect(0, 0, w, h);
    // 걸음·숨쉬기용 둘째 프레임: 윗몸을 1px 내리고 발 두 줄은 그대로 둔다(프레임 교체, 보간 없음)
    const c2 = mk(w, h), x2 = c2.getContext('2d');
    x2.drawImage(c, 0, 0, w, h - 3, 0, 1, w, h - 3); x2.drawImage(c, 0, h - 2, w, 2, 0, h - 2, w, 2);
    const f2 = mk(w, h), y2 = f2.getContext('2d');
    y2.translate(w, 0); y2.scale(-1, 1); y2.drawImage(c2, 0, 0);
    return { c, f, wh, c2, f2, w, h };
  }
  // 효과 스프라이트(키트 생성기에서 변환한 격자)와 소품을 3단 램프로 칠한다
  const RAMP = { e: ['e1', 'e2', 'e3'], p: ['p1', 'p2', 'p3'], s: ['s1', 's2', 's3'], g: ['W', 'g1', 'g2'] };
  DD.fxArt = function (name, frame, ramp) {
    const id = 'fx:' + name + frame + ramp;
    if (cache[id]) return cache[id];
    const g_ = DD.FX_GRIDS[name][frame], c = mk(g_[0].length, g_.length), r = RAMP[ramp] || [ramp, ramp, ramp];
    paint(c.getContext('2d'), { g: g_, p: { A: r[0], B: r[1], C: r[2] } }, null, 0, 0);
    return (cache[id] = { c, w: c.width, h: c.height });
  };
  DD.propArt = function (name, pal) {
    const id = 'prop:' + name + pal.join();
    if (cache[id]) return cache[id];
    const g_ = DD.PROPS[name], c = mk(g_[0].length, g_.length);
    paint(c.getContext('2d'), { g: g_, p: { A: pal[0], B: pal[1], C: pal[2] } }, null, 0, 0);
    return (cache[id] = { c, w: c.width, h: c.height });
  };
  // id: 스프라이트 id, 'h_<race>_<role>'(영웅), 'b_xxx@race'(건물)
  DD.art = function (id) {
    if (cache[id]) return cache[id];
    let c;
    if (id.startsWith('h_')) {
      const [, race, role] = id.split('_');
      const body = S['hb_' + race], wp = S['hw_' + role];
      c = mk(16, 16); const x = c.getContext('2d');
      paint(x, body, null, 0, 0); paint(x, wp, null, 0, 0);
    } else {
      const [sid, race] = id.split('@');
      const d = S[sid];
      c = mk(d.g[0].length, d.g.length);
      paint(c.getContext('2d'), d, race ? DD.BLD_PAL[race] : null, 0, 0);
    }
    return (cache[id] = finish(c));
  };
})(typeof window !== 'undefined' ? window : globalThis);
