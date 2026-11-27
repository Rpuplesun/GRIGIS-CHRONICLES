// 게임 데이터 (브라우저·Node 공용). 수치 조정은 이 파일만 고치면 된다.
(function (g) {
  const DD = (g.DD = g.DD || {});
  DD.VERSION = '1.0.0'; // package.json의 version과 맞춘다
  // 던전은 24px 타일 격자. 안쪽 21×13칸, 입구는 아래 가운데, 심장은 위 가운데.
  DD.C = {
    TILE: 24, GW: 27, GH: 18, OX: 24, OY: 24, W: 696, H: 480,
    WAVES: 20, WAVE_T: 60, FIRST_WAVE: 20, POP: 40, BLD_CAP: 40,
    ROAD_MAX: 140, WALL_MAX: 50, PLOT_HP: 1.25,
    HEART_T: [13, 1], SUMMON_T: [8, 0], ALTAR_T: [17, 0], ENT_T: [13, 17],
    PLOTS: [[5, 4], [21, 4], [5, 13], [21, 13]],
  };

  // 유닛: hp, atk, rng(사거리 px), as(공격 간격 초), spd(px/초)
  // req: b=필요 건물, kills=누적 처치, alive=[유닛 idx, 수], cnt=[건물 id, 수], eat=[유닛 idx, 수](소모)
  const U = (name, tier, g_, m, hp, atk, rng, as, spd, spr, x) =>
    Object.assign({ name, tier, g: g_, m, hp, atk, rng, as, spd, spr }, x || {});
  const B = (id, name, kind, g_, m, hp, spr, desc, x) =>
    Object.assign({ id, name, kind, g: g_, m, hp, spr, desc }, x || {});

  DD.RACES = {
    human: {
      name: '인간족', color: 'b2',
      trait: '건물 비용 -20% · 체력 +20% · 탑·방벽·함정 한도 +2',
      units: [
        U('보병', 1, 40, 0, 165, 13, 14, 1.0, 30, 'u_human_1', { sig: 'swift' }),
        U('궁병', 2, 70, 0, 85, 19, 85, 1.1, 28, 'u_human_2', { sig: 'reach', req: { b: 'barracks' } }),
        U('기사', 3, 170, 20, 460, 40, 16, 1.0, 44, 'u_human_3', { sig: 'guard', pierce: 0.5, req: { b: 'forge' } }),
        U('마법사', 2, 90, 5, 70, 16, 80, 1.4, 26, 'u_human_4', { sig: 'burst', splash: 18, shred: 0.3, req: { b: 'barracks' } }),
      ],
      blds: [
        B('barracks', '병영', 'unlock', 100, 0, 500, 'b_unlock1', '궁병 해금'),
        B('forge', '대장간', 'unlock', 160, 30, 600, 'b_unlock2', '기사 해금 · 공격 +15%', { buffAtk: 0.15 }),
        B('tower', '화살탑', 'tower', 90, 10, 350, 'b_tower', '원거리 공격', { atk: 18, rng: 95, as: 0.85 }),
        B('wall', '방벽', 'wall', 30, 0, 700, 'b_wall', '길 차단'),
        B('market', '시장', 'eco', 120, 0, 300, 'b_special', '골드 +1.2/초', { gps: 1.2 }),
      ],
      heroes: [['검성 레온하르트', 'war'], ['명궁 실비아', 'arc'], ['창기사 발트', 'rid'], ['성녀 에일라', 'heal']],
    },
    dragon: {
      name: '용족', color: 'r2',
      trait: '처치마다 공격 +2% (최대 50%) · 승급이 두 배 빠름',
      units: [
        U('리자드맨', 1, 55, 0, 205, 15, 16, 1.0, 28, 'u_dragon_1', { sig: 'swift' }),
        U('드레이크', 2, 110, 10, 140, 22, 70, 1.3, 26, 'u_dragon_2', { sig: 'burst', splash: 14, req: { b: 'hatchery' } }),
        U('와이번', 3, 240, 40, 540, 48, 60, 1.2, 40, 'u_dragon_3', { sig: 'reach', splash: 18, req: { b: 'nest', kills: 50 } }),
        U('용아병', 2, 90, 0, 370, 14, 15, 1.1, 26, 'u_dragon_4', { sig: 'guard', req: { b: 'hatchery' } }),
      ],
      blds: [
        B('hatchery', '부화장', 'unlock', 120, 0, 500, 'b_unlock1', '드레이크 해금'),
        B('nest', '용의 둥지', 'unlock', 200, 40, 700, 'b_unlock2', '와이번 해금 (처치 50)'),
        B('tower', '화염 기둥', 'tower', 110, 15, 320, 'b_tower', '범위 공격', { atk: 13, rng: 80, as: 1.2, splash: 16 }),
        B('wall', '용암벽', 'wall', 45, 0, 600, 'b_wall', '길 차단 · 피해 반사', { thorn: 6 }),
        B('hoard', '보물 더미', 'eco', 130, 0, 300, 'b_special', '처치 골드 +20% (최대 3개)', { killGold: 0.2 }),
      ],
      heroes: [['적린의 카르가스', 'war'], ['화염숨결 이그니아', 'arc'], ['질풍날개 자르칸', 'rid'], ['용무녀 세라핀', 'heal']],
    },
    beast: {
      name: '수인족', color: 'w2',
      trait: '아군 1기당 공격 +1.5% (최대 40%) · 인구 +10',
      units: [
        U('코볼트', 1, 22, 0, 96, 11, 13, 0.8, 42, 'u_beast_1', { sig: 'swift' }),
        U('늑대전사', 2, 60, 0, 215, 27, 14, 0.9, 46, 'u_beast_2', { sig: 'guard', req: { b: 'den', alive: [0, 4] } }),
        U('미노타우로스', 3, 170, 25, 720, 48, 18, 1.2, 30, 'u_beast_3', { sig: 'burst', splash: 16, req: { b: 'arena' } }),
        U('투창꾼', 2, 55, 0, 95, 23, 78, 1.1, 40, 'u_beast_4', { sig: 'reach', pierce: 0.35, req: { b: 'den' } }),
      ],
      blds: [
        B('den', '사냥굴', 'unlock', 80, 0, 450, 'b_unlock1', '늑대전사 해금 (코볼트 4기)'),
        B('arena', '투기장', 'unlock', 150, 25, 650, 'b_unlock2', '미노타우로스 해금'),
        B('tower', '투척탑', 'tower', 80, 10, 300, 'b_tower', '빠른 공격', { atk: 15, rng: 85, as: 0.65 }),
        B('wall', '가시 울타리', 'wall', 20, 0, 400, 'b_wall', '싼 길 차단 · 약한 반사', { thorn: 3 }),
        B('drum', '전투 북', 'aura', 110, 10, 300, 'b_special', '주변 공격 속도 +25%', { haste: 0.25, rad: 64 }),
      ],
      heroes: [['철엄니 바록', 'war'], ['매눈 시라', 'arc'], ['질주하는 펜로', 'rid'], ['달무당 루나라', 'heal']],
    },
    spirit: {
      name: '정령족', color: 't2',
      trait: '자재 +0.15/초 · 2기로 조합 · 조합하면 정예',
      units: [
        U('하급정령', 1, 35, 0, 72, 11, 62, 1.0, 30, 'u_spirit_1', { sig: 'swift' }),
        U('중급정령', 2, 70, 0, 190, 28, 76, 1.0, 30, 'u_spirit_2', { sig: 'reach', req: { b: 'spring' } }),
        U('상급정령', 3, 180, 35, 520, 66, 92, 1.1, 30, 'u_spirit_3', { sig: 'burst', splash: 16, req: { b: 'tree' } }),
        U('바위 정령', 2, 60, 0, 360, 16, 15, 1.2, 26, 'u_spirit_4', { sig: 'guard', req: { b: 'spring' } }),
      ],
      blds: [
        B('spring', '정령의 샘', 'unlock', 100, 0, 450, 'b_unlock1', '중급정령 해금'),
        B('tree', '세계수 묘목', 'unlock', 180, 35, 650, 'b_unlock2', '상급정령 해금'),
        B('tower', '수정탑', 'tower', 100, 15, 280, 'b_tower', '긴 사거리', { atk: 20, rng: 120, as: 1.1 }),
        B('wall', '결계석', 'wall', 35, 5, 550, 'b_wall', '길 차단'),
        B('crystal', '마나 수정', 'eco', 110, 0, 280, 'b_special', '자재 +0.3/초', { mps: 0.3 }),
      ],
      heroes: [['대지의 그론', 'war'], ['바람의 실피엘', 'arc'], ['번개의 볼탄', 'rid'], ['샘의 운디아', 'heal']],
    },
    merfolk: {
      name: '어인족', color: 'b1',
      trait: '유닛 초당 체력 1% 재생 · 싸움이 멎으면 5%',
      units: [
        U('갈퀴병', 1, 30, 0, 125, 12, 14, 0.9, 36, 'u_merfolk_1', { sig: 'swift' }),
        U('조수 주술사', 2, 80, 5, 95, 13, 72, 1.2, 28, 'u_merfolk_2', { sig: 'mend', heal: 18, req: { b: 'coral' } }),
        U('심해 거인', 3, 200, 35, 840, 44, 18, 1.2, 26, 'u_merfolk_3', { sig: 'burst', splash: 18, req: { b: 'trench', cnt: ['pool', 1] } }),
        U('작살수', 2, 85, 5, 100, 34, 84, 1.35, 28, 'u_merfolk_4', { sig: 'reach', pierce: 0.6, req: { b: 'coral' } }),
      ],
      blds: [
        B('coral', '산호 제단', 'unlock', 100, 0, 450, 'b_unlock1', '조수 주술사(치유사) 해금'),
        B('trench', '심해 균열', 'unlock', 170, 30, 650, 'b_unlock2', '심해 거인 해금 (웅덩이 1개)'),
        B('tower', '작살탑', 'tower', 90, 10, 320, 'b_tower', '강한 한 방', { atk: 26, rng: 90, as: 1.15, pierce: 0.4 }),
        B('wall', '조개 방벽', 'wall', 30, 0, 650, 'b_wall', '튼튼한 길 차단'),
        B('pool', '조수 웅덩이', 'aura', 90, 5, 300, 'b_special', '주변 체력 6/초 회복', { regen: 6, rad: 56 }),
      ],
      heroes: [['파도가르는 모르간', 'war'], ['작살잡이 넵타', 'arc'], ['해마기수 코랄', 'rid'], ['진주무녀 나이아', 'heal']],
    },
  };
  // 전설 유닛: 최상위 유닛을 조합해야만 나온다(소환 불가)
  const LG = {
    human: ['성기사', 1100, 82, 16, 1.0, 44, { splash: 12, passive: 'aegis', pdesc: '주변 아군 받는 피해 -25%' }],
    dragon: ['고룡', 1300, 105, 70, 1.2, 40, { splash: 22, passive: 'burn', pierce: 1, pdesc: '방어력 무시 · 3초 화상' }],
    beast: ['베헤모스', 1700, 90, 18, 1.2, 30, { splash: 16, passive: 'quake', pdesc: '3타마다 주변 광역 기절' }],
    spirit: ['정령왕', 1200, 150, 100, 1.1, 30, { splash: 20, passive: 'prism', pdesc: '최대 3타겟 동시 공격 · 처치 시 자재 +1' }],
    merfolk: ['크라켄', 2000, 85, 20, 1.2, 26, { splash: 16, passive: 'maelstrom', pdesc: '광역 이동 -40% · 방어 파쇄' }],
  };
  for (const k in LG) { const l = LG[k]; DD.RACES[k].legend = U(l[0], 4, 0, 0, l[1], l[2], l[3], l[4], l[5], 'u_' + k + '_5', Object.assign({ legend: true }, l[6])); }
  // 함정: 모든 종족 공통. 길 위에 깔고, 악마는 부수지 못한다
  const TRAPS = [
    B('spike', '가시 함정', 'trap', 40, 0, 1, 'trap_spike', '밟고 지나는 악마에게 0.5초마다 피해 (방어 50% 관통)', { dmg: 12, every: 0.5, pierce: 0.5 }),
    B('tar', '끈끈이 늪', 'trap', 35, 0, 1, 'trap_tar', '밟고 지나는 악마의 이동 -45%', { slow: 0.55 }),
    B('push', '충격 발판', 'trap', 50, 5, 1, 'trap_push', '밟은 악마를 입구 쪽으로 2칸 밀쳐낸다 (대기 3초)', { push: 2, cdMax: 3, dmg: 10, pierce: 0.5 }),
  ];
  for (const k in DD.RACES) { DD.RACES[k].blds.forEach((b) => { if (b.kind === 'unlock' || b.kind === 'eco' || b.kind === 'aura') b.size = 2; }); DD.RACES[k].blds.push(...TRAPS); } // 해금·특수 건물은 2×2칸을 차지한다
  DD.RACE_IDS = Object.keys(DD.RACES);
  DD.mergeNeed = (race) => (race === 'spirit' ? 2 : 3); // 정령은 둘만 있어도 융합한다

  DD.HERO_ROLES = {
    war: { label: '전사', hp: 800, atk: 42, rng: 16, as: 1.0, spd: 34, splash: 10 },
    arc: { label: '궁수', hp: 380, atk: 48, rng: 100, as: 0.8, spd: 32 },
    rid: { label: '기수', hp: 560, atk: 60, rng: 16, as: 0.9, spd: 64 },
    heal: { label: '치유사', hp: 420, atk: 20, rng: 76, as: 1.0, spd: 30, heal: 30 },
  };
  DD.GRADES = [
    { id: 'R', mul: 1, col: 'b2' }, { id: 'SR', mul: 1.6, col: 'p2' }, { id: 'SSR', mul: 2.4, col: 'g1' },
  ];
  // 영웅 제단 레벨별: 등급 확률, 쿨타임 배율, 강화 비용
  DD.ALTAR = [
    { p: [1, 0, 0], cd: 1 },
    { p: [0.55, 0.45, 0], cd: 0.85, g: 200, m: 30 },
    { p: [0.35, 0.45, 0.2], cd: 0.7, g: 400, m: 80 },
  ];
  DD.HERO_CD = { first: 45, base: 60, inc: 30 };

  DD.UPGRADES = {
    atk: { name: '공격 강화', desc: '유닛 공격 +10%', g: 80, m: 8, max: 10 },
    hp: { name: '체력 강화', desc: '유닛 체력 +10%', g: 80, m: 8, max: 10 },
    bld: { name: '건축 강화', desc: '건물 체력·탑 공격 +15%', g: 70, m: 12, max: 10 },
  };

  DD.DEMONS = {
    imp: { name: '임프', hp: 42, atk: 6, rng: 12, as: 0.9, spd: 34, gold: 7, light: true, squeeze: true, spr: 'd_imp', desc: '약하지만 떼로 몰려온다 · 벽 없는 1칸 바닥 틈새를 가로지른다 · 벽으로 막자' },
    brute: { name: '악귀', hp: 170, atk: 16, rng: 15, as: 1.2, spd: 20, gold: 15, mat: 3, heavy: true, spr: 'd_brute', desc: '중장갑 · 길 전체를 정직하게 돌아온다 · 범위 공격에 강하고 단일 공격에 약하다 · 자재(◆)를 흘린다' },
    hound: { name: '지옥견', hp: 62, atk: 9, rng: 13, as: 0.7, spd: 54, gold: 8, light: true, vault: true, spr: 'd_hound', desc: '매우 빠르다 · 1칸 벽·틈새를 뛰어넘어 지름길로 질주 · 2칸 간격으로 떼어 두자' },
    bat: { name: '가고일', hp: 38, atk: 3, rng: 12, as: 1.0, spd: 36, gold: 9, fly: true, spr: 'd_bat', desc: '경량 비행 · 길과 벽을 무시하고 심장으로 직진 · 원거리 공격과 탑만 닿는다' },
    wyvern: { name: '심연 비룡', hp: 155, atk: 14, rng: 46, as: 1.35, spd: 25, gold: 18, mat: 4, fly: true, heavy: true, spr: 'd_wyvern', desc: '정예 비행 · 벽과 길을 넘어 날며 원거리 화염을 뿜는다 · 대공 화력 필수' },
    warlock: { name: '흑마술사', hp: 72, atk: 14, rng: 72, as: 1.4, spd: 22, gold: 13, mat: 3, spr: 'd_warlock', desc: '원거리 · 길가 건물을 부순다 · 벽으로 시야를 막자' },
    boss: { name: '악마 군주', hp: 1500, atk: 40, rng: 20, as: 1.4, spd: 15, gold: 200, mat: 30, splash: 16, heavy: true, spr: 'd_boss', desc: '중장갑 · 광역 공격 · 길 전체를 돌아오며 건물도 부순다 · 다섯 웨이브마다' },
  };
  // 처치 골드와 방어력(한 대 맞을 때마다 깎는 피해). 방어력은 웨이브가 갈수록 오른다 → 한 방이 약한 유닛은 뒤로 갈수록 힘을 못 쓴다
  { const GOLD = { imp: 5, hound: 6, brute: 13, warlock: 11, bat: 7, wyvern: 18 }, ARM = { imp: 1, hound: 1, bat: 1, warlock: 2, wyvern: 3, brute: 4, boss: 6 };
    for (const k in GOLD) DD.DEMONS[k].gold = GOLD[k]; for (const k in ARM) DD.DEMONS[k].arm = ARM[k]; }
  DD.armAt = (t, w) => DD.DEMONS[t].arm * (0.5 + 0.1 * w);
  // 웨이브 w(1~20)의 구성
  DD.waveList = function (w) {
    const l = [];
    const add = (t, n) => { for (let i = 0; i < n; i++) l.push(t); };
    add('imp', 5 + 2 * w);
    if (w >= 3) add('brute', Math.floor(w * 0.8));
    if (w >= 4) add('bat', Math.max(1, Math.floor((w - 2) / 3)));
    if (w >= 5) add('hound', w - 3);
    if (w >= 7) add('warlock', Math.floor(w / 2));
    if (w >= 8) add('wyvern', Math.max(1, Math.floor((w - 5) / 4)));
    if (w % 5 === 0) add('boss', 1);
    return l;
  };
  DD.waveScale = (w) => ({ hp: Math.pow(1.105, w - 1) * (w === 20 ? 1.4 : 1), atk: Math.pow(1.055, w - 1) });

  // 스테이지(땅): 종족마다 고향이 하나, 마지막은 악마성. mods[종족]={atk,hp,spd 배율}
  DD.LANDS = {
    cave: { id: 'cave', home: 'human', name: '왕국의 지하 요새', desc: '인간의 땅', mods: { human: { hp: 1.1 } } },
    fire: { id: 'fire', home: 'dragon', name: '불타는 심연', desc: '용족의 땅', mods: { dragon: { atk: 1.2, hp: 1.1 }, merfolk: { hp: 0.8 }, spirit: { atk: 0.9 }, beast: { hp: 0.9 } } },
    wild: { id: 'wild', home: 'beast', name: '송곳니 황야', desc: '수인족의 땅', mods: { beast: { atk: 1.15, spd: 1.1 }, human: { spd: 0.9 }, merfolk: { atk: 0.9 } } },
    forest: { id: 'forest', home: 'spirit', name: '고대의 숲', desc: '정령족의 땅', mods: { spirit: { hp: 1.25 }, dragon: { spd: 0.9 } } },
    water: { id: 'water', home: 'merfolk', name: '수몰된 회랑', desc: '어인족의 땅', mods: { merfolk: { atk: 1.2, hp: 1.2 }, dragon: { atk: 0.85 }, human: { spd: 0.85 }, beast: { spd: 0.85 } } },
    abyss: { id: 'abyss', home: null, name: '악마성', desc: '게이트 너머', mods: { human: { hp: 0.9 }, dragon: { hp: 0.9 }, beast: { hp: 0.9 }, spirit: { hp: 0.9 }, merfolk: { hp: 0.9 } } },
  };
  // 지형 현상: 땅마다 주기적으로 일어난다(첫 90초 뒤, 그 뒤로 75초마다 12초 동안). 그 땅이 고향인 종족은 해를 입지 않는다
  DD.HAZ = {
    fire: { name: '용암 분출', desc: '길 위의 악마와 유닛이 초당 체력 2%를 잃는다', col: 'r2' },
    wild: { name: '모래폭풍', desc: '원거리 유닛과 탑의 피해 -30%', col: 'g2' },
    forest: { name: '숲의 숨결', desc: '아군 유닛이 초당 체력 2%를 되찾는다', col: 'n2' },
    water: { name: '밀물', desc: '악마와 유닛 모두 이동 -35%', col: 'b2' },
    abyss: { name: '악마의 포효', desc: '악마의 공격 +30%', col: 'p2' },
  };
  // 스테이지별 고유 지형 거점(고정 칸 · 길이나 건물로 덮을 수 없다)
  DD.LANDMARKS = {
    cave: { id: 'watch', name: '감시초소', col: 'b2', rad: 76, pos: [[9, 6], [17, 13]], desc: '주변 탑·원거리 사거리 +15%' },
    fire: { id: 'lava', name: '용암 균열', col: 'o2', rad: 56, pos: [[17, 6], [9, 13]], desc: '주변 악마 초당 체력 2% 화상' },
    wild: { id: 'wind', name: '바람 기둥', col: 'g1', rad: 68, pos: [[9, 6], [17, 13]], desc: '주변 아군 이동·공속 +15%' },
    forest: { id: 'root', name: '고대의 뿌리', col: 'n2', rad: 64, pos: [[17, 6], [9, 13]], desc: '주변 악마 이동 -25%' },
    water: { id: 'vortex', name: '소용돌이', col: 'b1', rad: 64, pos: [[9, 6], [17, 13]], desc: '주변 악마 이동 -20% · 방어 -2' },
    abyss: { id: 'rift', name: '균열의 제단', col: 'p2', rad: 72, pos: [[17, 6], [9, 13]], desc: '주변 피아 공격 +25%' },
  };
  // 종족별 길·지형 고유 시너지
  DD.RACE_MAZE_TRAIT = {
    human: '성벽 수비 · 벽 옆 탑·원거리 공격 +15% · 사거리 +12%',
    dragon: '초토화 · 용암벽 주변 길의 악마에게 화상 피해',
    beast: '코너 매복 · 꺾이는 길 위 악마에게 근접 피해 +25%',
    spirit: '결계 공명 · 마주 보는 수정탑·결계석 사이에 마력선 생성',
    merfolk: '침수 회랑 · 조수 웅덩이 주변 길 악마 이동 -20% · 어인 공속 +15%',
  };
  // 종족별 교리(출전 전 선택)
  DD.DOCTRINES = {
    human: [
      { id: 'std', name: '왕국 표준', desc: '균형 잡힌 기본 편제' },
      { id: 'bastion', name: '철벽 요새', desc: '탑·방벽 한도 +2 · 탑 공격 +15% · 건물 체력 +15%' },
      { id: 'crusade', name: '기사단 돌격', desc: '근접·영웅 공격 +20% · 승급 비용 -25%' },
    ],
    dragon: [
      { id: 'std', name: '고대 혈통', desc: '균형 잡힌 기본 편제' },
      { id: 'pyre', name: '화염 군주', desc: '범위 반경 +30% · 화상 피해 +50%' },
      { id: 'frenzy', name: '혈전 각성', desc: '처치 공격 상한 80% · 승급 조건 완화 · 유닛 체력 +15%' },
    ],
    beast: [
      { id: 'std', name: '무리 본능', desc: '균형 잡힌 기본 편제' },
      { id: 'swarm', name: '끝없는 물결', desc: '인구 +12 · 1티어 비용 -25%' },
      { id: 'fang', name: '야수의 송곳니', desc: '단일 공격 +20% · 코너 매복 추가 +20%' },
    ],
    spirit: [
      { id: 'std', name: '세계수의 조화', desc: '균형 잡힌 기본 편제' },
      { id: 'prism', name: '수정 공명', desc: '자재 수급 +40% · 탑 사거리 +15% · 탑 공격 +10%' },
      { id: 'pure', name: '순수 융합', desc: '각인 슬롯 +1 · 승급 유닛 공격·체력 +10%' },
    ],
    merfolk: [
      { id: 'std', name: '심해의 흐름', desc: '균형 잡힌 기본 편제' },
      { id: 'tide', name: '치유의 조류', desc: '회복·재생 +40% · 웅덩이 반경 +20%' },
      { id: 'abyssal', name: '심해 사냥꾼', desc: '방어 관통 +25% · 탑·원거리 공격 +15%' },
    ],
  };
  // 솔로 모드 동맹 원정(보조 종족)
  DD.ALLY_CD = 90;
  DD.ALLY_FIRST = 40;
  DD.ALLY_PERK = {
    human: '건물 체력 +10%',
    dragon: '유닛 공격 +6%',
    beast: '유닛 이동 +8% · 인구 +4',
    spirit: '자재 +0.1/초',
    merfolk: '비전투 시 체력 +1.5%/초 재생',
  };
  DD.HAZ_T = { first: 90, every: 75, len: 12 };
  DD.HOME = { human: 'cave', dragon: 'fire', beast: 'wild', spirit: 'forest', merfolk: 'water' };
  DD.STAGE_MUL = [0.8, 1.1, 1.4, 1.75, 2.15, 2.6]; // 차례가 뒤로 갈수록 악마가 강해진다
  // 종족별 스테이지 순서: 고향 → 다른 네 종족의 땅 → 악마성
  DD.stageOrder = (race) => [DD.HOME[race]].concat(DD.RACE_IDS.filter((r) => r !== race).map((r) => DD.HOME[r]), ['abyss']);
  DD.stageOf = (race, pos) => Object.assign({}, DD.LANDS[DD.stageOrder(race)[pos]], { mul: DD.STAGE_MUL[pos] });

  // 영구 강화(종족별). per=레벨당 효과
  DD.META = [
    { k: 'uHp', name: '유닛 체력', per: 0.05, unit: '%' },
    { k: 'uAtk', name: '유닛 공격', per: 0.05, unit: '%' },
    { k: 'bHp', name: '건물·심장 체력', per: 0.08, unit: '%' },
    { k: 'gold', name: '골드 수급', per: 0.05, unit: '%' },
    { k: 'sGold', name: '시작 골드', per: 30, unit: '' },
    { k: 'hCd', name: '영웅 소환 대기 단축', per: 0.04, unit: '%' },
  ];
  DD.META_MAX = 10;
  DD.metaCost = (lv) => 10 + lv * 10;
  DD.CALL_BONUS = 0.5; // 웨이브를 일찍 부르면 건너뛴 1초마다 주는 추가 골드
  DD.shardsFor = (stage, wavesCleared, win, diff, oathMul) => Math.round((wavesCleared * 2 + (win ? 30 : 0)) * (1 + stage * 0.5) * DD.DIFFS[diff == null ? 1 : diff].shard * (oathMul || 1));

  // 종족별 타워 Lv.3 2지선다 특화 진화
  DD.TOWER_SPECS = {
    human: [
      { id: 'crossbow', name: '연발 석궁탑', desc: '공속 +45% · 비행 적 피해 +35%', asMul: 0.68, flyMul: 1.35, col: 'b1' },
      { id: 'ballista', name: '공성 발리스타', desc: '공격 +35% · 방어 70% 관통 · 사거리 +15%', atkMul: 1.35, pierce: 0.7, rngMul: 1.15, col: 'g1' },
    ],
    dragon: [
      { id: 'meteor', name: '유성 포탑', desc: '공격 +25% · 폭발 반경 +10', atkMul: 1.25, splashAdd: 10, col: 'r1' },
      { id: 'breath', name: '용염 방사기', desc: '공속 +30% · 3초 화상 + 방어 35% 파쇄', asMul: 0.77, burn: 0.025, shred: 0.35, col: 'o2' },
    ],
    beast: [
      { id: 'warcross', name: '광폭 쇠뇌', desc: '공속 +35% · 주변 아군 공속 +15%', asMul: 0.74, auraHaste: 0.15, col: 'o1' },
      { id: 'snare', name: '사냥꾼 덫포', desc: '공격 +25% · 명중 시 이동 -50% · 출혈', atkMul: 1.25, slow: 0.5, burn: 0.02, col: 'w1' },
    ],
    spirit: [
      { id: 'prism', name: '프리즘 탑', desc: '최대 3타겟 동시 연쇄 사격 (연쇄 65%)', chain: 2, col: 't1' },
      { id: 'chrono', name: '시공 수정', desc: '광역 이동 -40% · 주변 공명선 피해 2배', slow: 0.6, splashAdd: 16, beamBoost: 2, col: 'p1' },
    ],
    merfolk: [
      { id: 'volt', name: '뇌전 작살', desc: '방어 무시 · 최대 2타겟 감전 연쇄', pierce: 1.0, chain: 1, col: 'b1' },
      { id: 'cannon', name: '심해 포대', desc: '공격 +20% · 광역 폭발 + 적 1칸 밀침', atkMul: 1.2, splashAdd: 18, push1: true, col: 't2' },
    ],
  };

  // 심장 공명 (종족별 사령관 전역 스킬 · 에너지 100% 도달 시 발동)
  DD.HEART_SKILLS = {
    human: { name: '왕국의 성벽', desc: '5초간 모든 건물·방벽 무적 + 체력 40% 수리', col: 'b1' },
    dragon: { name: '용염 폭격', desc: '모든 길의 악마에게 최대 체력 15% + 4초 화상', col: 'r1' },
    beast: { name: '피의 포효', desc: '7초간 전 아군 공속·이동 +45%', col: 'o1' },
    spirit: { name: '시간 정지', desc: '전장의 모든 악마 3.5초 빙결 (군주 1.8초)', col: 't1' },
    merfolk: { name: '대해일', desc: '모든 지상 악마를 입구 쪽 2칸 밀침 + 4초 둔화', col: 'b2' },
  };

  // 출전 전 시련의 맹약 (최대 3개 선택 · 리스크-리턴 영혼석 배율 증가)
  DD.OATHS = [
    { id: 'fast', name: '가속 침공', desc: '악마 이동 +20%', sh: 0.30 },
    { id: 'nowall', name: '무방벽 결전', desc: '방벽 금지 · 탑 공격 +15%', sh: 0.35 },
    { id: 'extraent', name: '다중 균열', desc: '입구 +1 · 골드 +15%', sh: 0.40 },
    { id: 'wildhaz', name: '광폭 지형', desc: '지형 현상 주기 2배', sh: 0.25 },
    { id: 'elites', name: '정예 군단', desc: '매 웨이브 우두머리 +1', sh: 0.35 },
    { id: 'fragile', name: '철의 규율', desc: '심장 최대 체력 60% 시작', sh: 0.40 },
  ];
  DD.oathShardMul = (oaths) => 1 + (oaths || []).reduce((s, id) => s + ((DD.OATHS.find((o) => o.id === id) || {}).sh || 0), 0);

  // 중반 전령 사건 (웨이브 4 · 8 · 12 · 16 · 연대기 2지선다 딜레마)
  DD.CHRONICLE_EVENTS = [
    {
      id: 'caravan', title: '피난 상단의 호위 요청',
      body: '전선 외곽에서 피난민 상단이 도움을 청합니다. 호위하면 악마들이 몰려들지만 귀한 물자를 남길 것입니다.',
      opts: [
        { name: '상단 호위', desc: '즉시 골드 +180 · 자재 +35 (다음 웨이브 악마 수 +20%)' },
        { name: '통행세 징수', desc: '즉시 골드 +90 (추가 위험 없음)' },
      ],
    },
    {
      id: 'runestone', title: '고대 룬 석판 발굴',
      body: '던전 바닥 아래서 빛나는 룬 석판이 드러났습니다. 심장의 기운을 나눠 깨우거나 자재로 분해할 수 있습니다.',
      opts: [
        { name: '룬 해방', desc: '무작위 아군 최대 3기에 각인 부여 (심장 체력 -80)' },
        { name: '석판 해체', desc: '자재 +45 즉시 획득' },
      ],
    },
    {
      id: 'mercs', title: '타 종족 용병단의 제안',
      body: '인근 전선에서 넘어온 타 종족 정예 용병단이 계약을 제안합니다.',
      opts: [
        { name: '용병 고용', desc: '골드 -90 · 타 종족 2티어 정예 2기 영구 합류' },
        { name: '제단 봉헌', desc: '영웅 소환 대기 -25초 단축' },
      ],
    },
    {
      id: 'peddler', title: '심연의 암상인',
      body: '검은 망토의 상인이 심장의 생명력을 대가로 군주의 전리품을 내놓겠다고 속삭입니다.',
      opts: [
        { name: '금지된 거래', desc: '심장 최대 체력 -150 · 전리품 1회 즉시 선택' },
        { name: '상인 추방', desc: '골드 +80 · 심장 체력 +120 회복' },
      ],
    },
    {
      id: 'engineers', title: '전선 공병대 도착',
      body: '후방에서 보급 마차와 공병대가 도착했습니다. 미로를 넓히거나 무기를 연마할 수 있습니다.',
      opts: [
        { name: '축성 지원', desc: '길 한도 +12 · 벽 한도 +4 즉시 확장' },
        { name: '화력 보급', desc: '모든 유닛·탑 공격 영구 +6%' },
      ],
    },
    {
      id: 'smith', title: '유랑 대장장이',
      body: '전설의 대장장이가 요새를 찾아왔습니다. 병사의 무구를 벼리거나 성벽을 보강해 주겠다고 합니다.',
      opts: [
        { name: '무구 연마', desc: '골드 -70 · 공격·체력·건축 강화 중 최저 레벨 +1' },
        { name: '성벽 보강', desc: '모든 건물 완전 수리 · 건물 체력 영구 +15%' },
      ],
    },
    {
      id: 'resonance', title: '심장의 맥동',
      body: '대륙의 심장이 전장의 마력에 강하게 공명하고 있습니다. 기운을 어디로 돌릴지 정하십시오.',
      opts: [
        { name: '공명 과충전', desc: '심장 공명 에너지 즉시 100% 충전' },
        { name: '심장 수복', desc: '심장 최대 체력 +100 · 체력 250 회복' },
      ],
    },
    {
      id: 'scout', title: '정찰병의 첩보',
      body: '다음 침공대의 진군로를 파악했습니다. 기습으로 힘을 빼거나 현상금을 걸어 약탈할 수 있습니다.',
      opts: [
        { name: '기습 매복', desc: '다음 웨이브 악마 체력 -15% (처치 골드 -10%)' },
        { name: '현상금 포고', desc: '다음 웨이브 처치 골드 +45% (악마 공격 +15%)' },
      ],
    },
  ];

  // 건물 종류별 최대 수. 같은 건물을 끝없이 늘릴 수 없다
  DD.BLD_MAX = { unlock: 1, tower: 6, wall: 10, eco: 3, aura: 3, trap: 6 };
  DD.bldMax = (b, race, doc) => DD.BLD_MAX[b.kind]
    + (race === 'human' && (b.kind === 'tower' || b.kind === 'wall' || b.kind === 'trap') ? 2 : 0)
    + (race === 'human' && doc === 1 && (b.kind === 'tower' || b.kind === 'wall') ? 2 : 0); // 철벽 요새 교리는 탑·방벽 +2
  DD.TARGET_MODES = [
    { id: 'first', name: '선두' },
    { id: 'strong', name: '강적' },
    { id: 'fly', name: '비행' },
    { id: 'ranged', name: '원거리' },
  ];
  // 난이도: 악마 체력·공격, 골드, 영혼석 배율
  DD.DIFFS = [
    { name: '쉬움', hp: 0.8, atk: 0.85, gold: 1.1, shard: 0.7 },
    { name: '보통', hp: 1, atk: 1, gold: 1, shard: 1 },
    { name: '어려움', hp: 1.3, atk: 1.15, gold: 0.85, shard: 1.6 },
    { name: '악몽', hp: 1.7, atk: 1.3, gold: 0.7, shard: 2.4 },
  ];
  // 변이 웨이브: 군주가 없는 웨이브 가운데 몇 개는 성질이 바뀌어 온다
  DD.MUTS = {
    swift: { name: '질주', desc: '악마 이동 +35%', spd: 1.35 },
    armor: { name: '철갑', desc: '악마 체력 +40%', hp: 1.4 },
    horde: { name: '대군', desc: '악마 수 +50%', n: 1.5, hp: 0.85 },
    rage: { name: '격노', desc: '악마 공격 +40%', atk: 1.4 },
    rich: { name: '약탈단', desc: '처치 골드 2배 · 악마 체력 +20%', gold: 2, hp: 1.2 },
  };
  // 전리품: 악마 군주를 쓰러뜨리면 셋 중 하나를 고른다
  DD.BOONS = [
    { id: 'atk', name: '날 선 무기', desc: '유닛·탑 공격 +12%' },
    { id: 'hp', name: '두꺼운 갑옷', desc: '유닛 체력 +15%' },
    { id: 'loot', name: '약탈 허가', desc: '처치 골드 +20%' },
    { id: 'pop', name: '징집령', desc: '인구 한도 +6' },
    { id: 'heart', name: '심장 강화', desc: '심장 최대 체력 +250 · 250 회복' },
    { id: 'hero', name: '영웅의 부름', desc: '영웅을 바로 소환 · 대기 -15%' },
    { id: 'bank', name: '군자금', desc: '골드 +300' },
    { id: 'mat', name: '보급 마차', desc: '자재 +60' },
    { id: 'bld', name: '견고한 축성', desc: '건물 체력 +30%' },
    { id: 'regen', name: '야전 치유', desc: '유닛 초당 체력 0.5% 재생' },
    { id: 'trapboom', name: '함정 연쇄', desc: '함정 위에서 악마 처치 시 주변에 체력 15% 폭발' },
    { id: 'wallbomb', name: '성벽 자폭', desc: '방벽 파괴 시 주변 악마 120 피해 · 2초 기절' },
    { id: 'mazehaste', name: '미로의 가호', desc: '길 10칸마다 탑 공격 속도 +4%' },
    { id: 'allymerc', name: '연합 원군', desc: '타 종족 2티어 정예 3기 즉시 합류 (각인 가능)' },
    { id: 'shredall', name: '파쇄의 룬', desc: '모든 공격이 악마 방어력 35% 관통' },
    { id: 'fastmerge', name: '고속 승급', desc: '승급 비용 -50%' },
  ];
  // 침공로: 스테이지와 난이도가 오르면 좌우 벽에도 입구가 열린다
  // 배치: 넷째 스테이지와 악마성은 심장이 한가운데 있고 위아래에서 쳐들어온다
  // heart: 3×3의 가운데 칸, summon·altar: 2×2의 왼쪽 위 칸
  DD.LAYOUTS = { top: { heart: [13, 1], summon: [8, 0], altar: [17, 0] }, center: { heart: [13, 9], summon: [8, 8], altar: [17, 8] } };
  DD.layoutOf = (stage, tutorial) => (!tutorial && (stage === 3 || stage === 5) ? 'center' : 'top');
  DD.entCount = (stage, diff, tutorial, extraEnt) => {
    if (tutorial) return 1; const s = stage + (diff >= 2 ? 1 : 0) + (diff >= 3 ? 1 : 0);
    const lay = DD.layoutOf(stage), maxE = lay === 'center' ? 4 : 3;
    const base = lay === 'center' ? (s < 4 ? 2 : s < 6 ? 3 : 4) : s < 2 ? 1 : s < 4 ? 2 : 3;
    return Math.min(maxE, base + (extraEnt ? 1 : 0));
  };
  DD.entsFor = (n, lay) => { const C = DD.C, mx = C.ENT_T[0], L = [0, C.GH >> 1], R = [C.GW - 1, C.GH >> 1]; return ((lay || C.LAYOUT) === 'center' ? [C.ENT_T, [mx, 0], L, R] : [C.ENT_T, L, R]).slice(0, n); };
  // 각인: 서로 다른 유닛 둘을 합치면 하나가 사라지며 제 장기를 남긴다. 유닛마다 둘(전설은 셋)까지
  DD.SIGS = {
    swift: { name: '날랜', desc: '공격 속도 +20%', col: 'g1' }, reach: { name: '멀리 닿는', desc: '사거리 +25%', col: 'b2' },
    guard: { name: '굳센', desc: '최대 체력 +30%', col: 's1' }, burst: { name: '터지는', desc: '공격이 주변으로 퍼진다', col: 'r1' },
    mend: { name: '아무는', desc: '초당 체력 1.5% 재생', col: 'n1' },
  };
  DD.sigOf = (def) => def.sig || (def.heal ? 'mend' : def.splash ? 'burst' : def.rng > 30 ? 'reach' : def.tier >= 2 ? 'guard' : 'swift');
  DD.sigCap = (def, doc, race) => (def.legend ? 3 : 2) + (race === 'spirit' && doc === 2 ? 1 : 0);
  DD.SIG_COMBOS = {
    'burst+swift': { id: 'burst+swift', name: '연쇄 폭렬', desc: '공격 +20% · 범위 +6' },
    'guard+mend': { id: 'guard+mend', name: '불굴의 재생', desc: '체력 40% 이하 시 재생 2배' },
    'burst+reach': { id: 'burst+reach', name: '장거리 포격', desc: '방어력 40% 관통' },
    'guard+swift': { id: 'guard+swift', name: '선봉장', desc: '이동 +25% · 받는 피해 -15%' },
    'reach+swift': { id: 'reach+swift', name: '속사수', desc: '공격 속도 추가 +15%' },
    'mend+reach': { id: 'mend+reach', name: '활력 사격', desc: '공격마다 체력 2% 회복' },
    harmony: { id: 'harmony', name: '각인 공명', desc: '공격·체력 +10%' },
  };
  DD.sigCombo = (sigs) => {
    if (!sigs || sigs.length < 2) return null;
    for (let i = 0; i < sigs.length; i++) for (let j = i + 1; j < sigs.length; j++) {
      const k = [sigs[i], sigs[j]].sort().join('+');
      if (DD.SIG_COMBOS[k]) return DD.SIG_COMBOS[k];
    }
    return DD.SIG_COMBOS.harmony;
  };
  // 승급 값: 골드는 그 유닛 값의 절반, 자재는 그 유닛이 원래 드는 만큼. 전설은 따로
  DD.mergeCost = (to, race, doc, mul) => {
    const k = (race === 'human' && doc === 2 ? 0.75 : 1) * (mul || 1);
    const b = to.legend ? { g: 150, m: 60 } : { g: Math.round((to.g * 0.5) / 5) * 5, m: to.m };
    return { g: Math.round(b.g * k), m: Math.round(b.m * k) };
  };
  // 숙련: 악마를 많이 잡은 유닛은 승급한다(영웅 제외). 단계마다 공격·체력 +15%
  DD.RANKS = ['', '정예', '백전노장'];
  DD.RANK_KILLS = [0, 8, 25];
  DD.rankKills = (race, doc) => {
    const base = race === 'dragon' ? [0, 4, 13] : DD.RANK_KILLS;
    return race === 'dragon' && doc === 2 ? [0, Math.max(2, base[1] - 1), Math.max(8, base[2] - 3)] : base;
  }; // 용족은 절반만 잡아도 승급한다
  DD.rankOf = (u, race, doc) => { const k = DD.rankKills(race, doc); return u.hero ? 0 : u.kills >= k[2] ? 2 : u.kills >= k[1] ? 1 : 0; };
  // 주공: 입구가 여럿이면 웨이브마다 한 곳으로 악마의 6할이 몰린다. 미리 알려 준다
  DD.gateName = (e) => (e[0] === 0 ? '왼쪽' : e[0] === DD.C.GW - 1 ? '오른쪽' : e[1] === 0 ? '위' : '아래');
  // 영웅 기술: 살아 있는 영웅이 한꺼번에 쓴다
  DD.SKILL_CD = 40;
  DD.HERO_SKILL = {
    war: { name: '대지 강타', desc: '주변 악마에게 큰 피해를 주고 2초 기절' },
    arc: { name: '화살비', desc: '사거리 안의 모든 악마에게 2배 피해' },
    rid: { name: '질풍 돌격', desc: '6초 동안 이동·공격 속도 +60%' },
    heal: { name: '치유의 빛', desc: '주변 아군의 체력을 35% 회복' },
  };
  DD.HERO_RACE_SKILL = {
    human: { name: '성채의 맹세', desc: '주변 건물 25% 수리 · 아군 4초 보호막(-25% 피해)' },
    dragon: { name: '용염의 흔적', desc: '5초간 화염 장판 생성' },
    beast: { name: '무리 사냥', desc: '주변 아군 4초간 이동·공속 +30%' },
    spirit: { name: '마력 공명', desc: '주변 악마 방어 무시 피해 · 자재 +5' },
    merfolk: { name: '해일', desc: '주변 악마 밀쳐냄 · 3초 이동 -35%' },
  };
  // 군주 기믹: 웨이브마다 다른 군주가 온다
  DD.BOSS = { 5: 'summon', 10: 'ram', 15: 'roar', 20: 'all' };
  DD.BOSS_GIM = {
    summon: { name: '소환의 군주', desc: '8초마다 임프 셋을 부른다 · 빨리 쓰러뜨려야 한다' },
    ram: { name: '파성의 군주', desc: '건물에 4배 피해 · 체력이 절반 아래로 떨어지면 돌진한다' },
    roar: { name: '포효의 군주', desc: '10초마다 포효해 주변 유닛을 2초 동안 기절시킨다' },
    all: { name: '악마 대군주', desc: '임프 소환 · 건물 4배 피해 · 포효 · 절반 아래에서 돌진' },
  };
  // 판 안의 미션: 군주가 없는 웨이브에 가끔 걸린다. 이루면 골드
  DD.MISSION = {
    fast: { name: '50초 안에 격퇴', t: 50 },
    nodmg: { name: '심장이 맞기 전에 격퇴' },
    noloss: { name: '유닛을 잃지 않고 격퇴' },
  };
  DD.missionGold = (w) => 25 + 8 * w;
  // 업적: 한 번만 달성되고 영혼석을 준다. x = { G, d, win, save }
  DD.ACH_CATS = [
    ['common', '공통'], ['challenge', '도전'], ['human', '인간족'], ['dragon', '용족'], ['beast', '수인족'], ['spirit', '정령족'], ['merfolk', '어인족'],
  ];
  DD.ACH = [
    { id: 'win1', cat: 'common', name: '첫 승리', desc: '아무 스테이지나 승리한다', sh: 20, test: (x) => x.win },
    { id: 'flawless', cat: 'common', name: '철벽', desc: '심장이 한 번도 맞지 않고 승리한다', sh: 40, test: (x) => x.win && x.d.heart.hp >= x.d.heart.mhp - 0.5 },
    { id: 'hard', cat: 'common', name: '역전의 지휘관', desc: '어려움 이상에서 승리한다', sh: 40, test: (x) => x.win && x.G.diff >= 2 },
    { id: 'hell', cat: 'common', name: '악몽을 넘어', desc: '악몽에서 승리한다', sh: 80, test: (x) => x.win && x.G.diff >= 3 },
    { id: 'abyss', cat: 'common', name: '게이트 너머', desc: '악마성에서 승리한다', sh: 80, test: (x) => x.win && x.G.stage === 5 },
    { id: 'five', cat: 'common', name: '다섯 깃발', desc: '다섯 종족 모두로 승리한다', sh: 100, test: (x) => DD.RACE_IDS.every((r) => (x.save.races[r].rec && Object.keys(x.save.races[r].rec).length) || (x.win && r === x.d.race)) },
    { id: 'legend', cat: 'common', name: '전설의 탄생', desc: '전설 유닛을 조합해 낸다', sh: 30, test: (x) => x.d.nLegend >= 1 },
    { id: 'merge10', cat: 'common', name: '연금술사', desc: '한 판에 조합을 10번 한다', sh: 30, test: (x) => x.d.nMerge >= 10 },
    { id: 'rank2', cat: 'common', name: '백전노장', desc: '유닛 하나를 백전노장까지 키운다', sh: 30, test: (x) => x.d.nRank2 >= 1 },
    { id: 'lords', cat: 'common', name: '군주 사냥꾼', desc: '한 판에 군주 넷을 쓰러뜨린다', sh: 50, test: (x) => x.d.bossKills >= 4 },
    { id: 'alpha', cat: 'common', name: '우두머리 사냥', desc: '한 판에 우두머리 악마 열을 쓰러뜨린다', sh: 30, test: (x) => x.d.eliteKills >= 10 },
    { id: 'mission5', cat: 'common', name: '임무 완수', desc: '한 판에 미션을 5번 성공한다', sh: 40, test: (x) => x.d.nMission >= 5 },
    { id: 'traps', cat: 'common', name: '함정 설계자', desc: '한 판에 함정으로 악마 50을 쓰러뜨린다', sh: 30, test: (x) => x.d.trapKills >= 50 },
    { id: 'rush', cat: 'common', name: '속전속결', desc: '한 판에 웨이브를 10번 앞당긴다', sh: 30, test: (x) => x.d.nCall >= 10 },
    { id: 'endless30', cat: 'common', name: '끝없는 밤', desc: '무한 침공에서 30웨이브를 넘긴다', sh: 100, test: (x) => x.G.endless && x.d.wavesCleared >= 30 },
    // 신규 시스템 연계 도전 업적
    { id: 'oath3', cat: 'challenge', name: '시련의 정복자', desc: '시련의 맹약 3개를 활성화한 채 승리한다', sh: 80, test: (x) => x.win && x.G.oaths && x.G.oaths.length >= 3 },
    { id: 'push40', cat: 'challenge', name: '되돌려 보내기', desc: '한 판에 충격 발판으로 악마를 40회 이상 밀쳐낸다', sh: 40, test: (x) => (x.d.pushN || 0) >= 40 },
    { id: 'spectwin', cat: 'challenge', name: '극한의 공학', desc: '한 판에 Lv.3 특화 타워 2종을 모두 건설한다', sh: 40, test: (x) => (x.d.specIds && x.d.specIds.length >= 2) || new Set(x.d.blds.filter((b) => b.spec).map((b) => b.spec.id)).size >= 2 },
    { id: 'pulse3', cat: 'challenge', name: '심장의 부름', desc: '한 판에 심장 공명을 3회 이상 발동한다', sh: 40, test: (x) => (x.d.pulseN || 0) >= 3 },
    { id: 'event3', cat: 'challenge', name: '역사의 증인', desc: '한 판에 전령 사건을 3회 이상 해결한다', sh: 35, test: (x) => !!(x.d.chronicle && x.d.chronicle.length >= 3) },
    { id: 'medal5', cat: 'challenge', name: '전선의 영웅', desc: '멀티에서 연합 훈장 5중첩을 달성한다', sh: 60, test: (x) => (x.G.medals || 0) >= 5 },
    // 종족별 특색 업적
    { id: 'h_fort', cat: 'human', name: '철옹성', desc: '인간족으로 방어 시설을 동시에 14개 이상 세우고 승리한다', sh: 40, test: (x) => x.win && x.d.race === 'human' && (x.d.maxDefBlds || 0) >= 14 },
    { id: 'h_paladin', cat: 'human', name: '빛의 수호자', desc: '인간족으로 성기사를 조합하고 심장 체력 80% 이상으로 승리한다', sh: 50, test: (x) => x.win && x.d.race === 'human' && x.d.nLegend >= 1 && x.d.heart.hp >= x.d.heart.mhp * 0.8 },
    { id: 'h_doc', cat: 'human', name: '왕국의 교리', desc: '인간족 특화 교리(철벽 요새·기사단 돌격)로 승리한다', sh: 40, test: (x) => x.win && x.d.race === 'human' && x.d.doc > 0 },
    { id: 'd_elder', cat: 'dragon', name: '고룡의 강림', desc: '용족으로 고룡을 조합해 낸다', sh: 45, test: (x) => x.d.race === 'dragon' && x.d.nLegend >= 1 },
    { id: 'd_vet3', cat: 'dragon', name: '피의 비늘', desc: '용족으로 한 판에 백전노장을 3기 이상 키워낸다', sh: 50, test: (x) => x.d.race === 'dragon' && x.d.nRank2 >= 3 },
    { id: 'd_slay', cat: 'dragon', name: '불타는 전장', desc: '용족으로 악마 450마리 이상 처치하고 승리한다', sh: 45, test: (x) => x.win && x.d.race === 'dragon' && x.d.kills >= 450 },
    { id: 'b_swarm', cat: 'beast', name: '대군집', desc: '수인족으로 아군 유닛을 동시에 45기 이상 편성한다', sh: 40, test: (x) => x.d.race === 'beast' && (x.d.maxUnits || 0) >= 45 },
    { id: 'b_ambush', cat: 'beast', name: '송곳니의 매복', desc: '수인족으로 코너 매복을 40회 이상 발동하고 승리한다', sh: 50, test: (x) => x.win && x.d.race === 'beast' && (x.d.ambushHits || 0) >= 40 },
    { id: 'b_behemoth', cat: 'beast', name: '대지의 패자', desc: '수인족으로 베헤모스를 조합하고 군주 3기 이상 처치한다', sh: 50, test: (x) => x.d.race === 'beast' && x.d.nLegend >= 1 && x.d.bossKills >= 3 },
    { id: 's_beams', cat: 'spirit', name: '마력 격자', desc: '정령족으로 결계 공명선을 동시에 3개 이상 형성한다', sh: 45, test: (x) => x.d.race === 'spirit' && (x.d.maxBeams || 0) >= 3 },
    { id: 's_combo', cat: 'spirit', name: '순수 공명', desc: '정령족으로 2각인 공명 유닛을 2기 이상 보유하고 승리한다', sh: 50, test: (x) => x.win && x.d.race === 'spirit' && x.d.units.filter((u) => u.own === x.d.i && u.sig && u.sig.length >= 2).length >= 2 },
    { id: 's_king', cat: 'spirit', name: '세계수의 화신', desc: '정령족으로 정령왕을 조합해 낸다', sh: 45, test: (x) => x.d.race === 'spirit' && x.d.nLegend >= 1 },
    { id: 'm_noloss', cat: 'merfolk', name: '불사의 조류', desc: '어인족으로 유닛 손실 10기 이하로 승리한다', sh: 50, test: (x) => x.win && x.d.race === 'merfolk' && x.d.lost <= 10 },
    { id: 'm_pools', cat: 'merfolk', name: '침수 지대', desc: '어인족으로 조수 웅덩이 3개를 유지한 채 승리한다', sh: 40, test: (x) => x.win && x.d.race === 'merfolk' && (x.d.bc.pool || 0) >= 3 },
    { id: 'm_kraken', cat: 'merfolk', name: '심연의 괴수', desc: '어인족으로 크라켄을 조합해 낸다', sh: 45, test: (x) => x.d.race === 'merfolk' && x.d.nLegend >= 1 },
  ];
  // 기록: 깬 난이도와 남은 심장으로 별 1~3개
  DD.starsFor = (heartRatio) => (heartRatio >= 0.9 ? 3 : heartRatio >= 0.5 ? 2 : 1);
})(typeof window !== 'undefined' ? window : globalThis);
