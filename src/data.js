// 게임 데이터 (브라우저·Node 공용). 수치 조정은 이 파일만 고치면 된다.
(function (g) {
  const DD = (g.DD = g.DD || {});
  // 던전은 24px 타일 격자. 안쪽 21×13칸, 입구는 아래 가운데, 심장은 위 가운데.
  DD.C = {
    TILE: 24, GW: 27, GH: 18, OX: 24, OY: 24, W: 696, H: 480,
    WAVES: 20, WAVE_T: 60, FIRST_WAVE: 20, POP: 40, BLD_CAP: 40,
    ROAD_MAX: 140, WALL_MAX: 50, PLOT_HP: 1.25,
    HEART_T: [13, 0], SUMMON_T: [11, 0], ALTAR_T: [15, 0], ENT_T: [13, 17],
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
      trait: '건물 비용 -20% · 체력 +20%',
      units: [
        U('보병', 1, 40, 0, 150, 12, 14, 1.0, 30, 'u_human_1'),
        U('궁병', 2, 70, 0, 75, 17, 85, 1.1, 28, 'u_human_2', { req: { b: 'barracks' } }),
        U('기사', 3, 170, 20, 420, 36, 16, 1.0, 44, 'u_human_3', { req: { b: 'forge' } }),
        U('마법사', 2, 90, 5, 70, 14, 80, 1.4, 26, 'u_human_4', { splash: 16, req: { b: 'barracks' } }),
      ],
      blds: [
        B('barracks', '병영', 'unlock', 100, 0, 500, 'b_unlock1', '궁병 해금'),
        B('forge', '대장간', 'unlock', 160, 30, 600, 'b_unlock2', '기사 해금 · 공격 +15%', { buffAtk: 0.15 }),
        B('tower', '화살탑', 'tower', 90, 10, 350, 'b_tower', '원거리 공격', { atk: 16, rng: 95, as: 0.9 }),
        B('wall', '방벽', 'wall', 30, 0, 700, 'b_wall', '길 차단'),
        B('market', '시장', 'eco', 120, 0, 300, 'b_special', '골드 +1.2/초', { gps: 1.2 }),
      ],
      heroes: [['검성 레온하르트', 'war'], ['명궁 실비아', 'arc'], ['창기사 발트', 'rid'], ['성녀 에일라', 'heal']],
    },
    dragon: {
      name: '용족', color: 'r2',
      trait: '처치마다 공격 +2% (최대 50%)',
      units: [
        U('리자드맨', 1, 55, 0, 180, 15, 16, 1.0, 28, 'u_dragon_1'),
        U('드레이크', 2, 110, 10, 140, 22, 70, 1.3, 26, 'u_dragon_2', { splash: 14, req: { b: 'hatchery' } }),
        U('와이번', 3, 240, 40, 540, 48, 60, 1.2, 40, 'u_dragon_3', { splash: 18, req: { b: 'nest', kills: 50 } }),
        U('용아병', 2, 90, 0, 330, 14, 15, 1.1, 26, 'u_dragon_4', { req: { b: 'hatchery' } }),
      ],
      blds: [
        B('hatchery', '부화장', 'unlock', 120, 0, 500, 'b_unlock1', '드레이크 해금'),
        B('nest', '용의 둥지', 'unlock', 200, 40, 700, 'b_unlock2', '와이번 해금 (처치 50)'),
        B('tower', '화염 기둥', 'tower', 110, 15, 320, 'b_tower', '범위 공격', { atk: 14, rng: 80, as: 1.2, splash: 16 }),
        B('wall', '용암벽', 'wall', 45, 0, 600, 'b_wall', '길 차단 · 피해 반사', { thorn: 6 }),
        B('hoard', '보물 더미', 'eco', 130, 0, 300, 'b_special', '처치 골드 +20% (최대 3개)', { killGold: 0.2 }),
      ],
      heroes: [['적린의 카르가스', 'war'], ['화염숨결 이그니아', 'arc'], ['질풍날개 자르칸', 'rid'], ['용무녀 세라핀', 'heal']],
    },
    beast: {
      name: '수인족', color: 'w2',
      trait: '아군 1기당 공격 +1.5% (최대 40%)',
      units: [
        U('코볼트', 1, 22, 0, 84, 10, 13, 0.8, 42, 'u_beast_1'),
        U('늑대전사', 2, 60, 0, 170, 23, 14, 0.9, 46, 'u_beast_2', { req: { b: 'den', alive: [0, 5] } }),
        U('미노타우로스', 3, 170, 25, 640, 40, 18, 1.2, 30, 'u_beast_3', { splash: 12, req: { b: 'arena' } }),
        U('투창꾼', 2, 55, 0, 95, 20, 78, 1.1, 40, 'u_beast_4', { req: { b: 'den' } }),
      ],
      blds: [
        B('den', '사냥굴', 'unlock', 80, 0, 450, 'b_unlock1', '늑대전사 해금 (코볼트 5기)'),
        B('arena', '투기장', 'unlock', 150, 25, 650, 'b_unlock2', '미노타우로스 해금'),
        B('tower', '투척탑', 'tower', 80, 10, 300, 'b_tower', '빠른 공격', { atk: 10, rng: 85, as: 0.6 }),
        B('wall', '가시 울타리', 'wall', 20, 0, 400, 'b_wall', '싼 길 차단 · 약한 반사', { thorn: 3 }),
        B('drum', '전투 북', 'aura', 110, 10, 300, 'b_special', '주변 공격 속도 +25%', { haste: 0.25, rad: 64 }),
      ],
      heroes: [['철엄니 바록', 'war'], ['매눈 시라', 'arc'], ['질주하는 펜로', 'rid'], ['달무당 루나라', 'heal']],
    },
    spirit: {
      name: '정령족', color: 't2',
      trait: '자재 +0.15/초 · 하위 정령을 융합',
      units: [
        U('하급정령', 1, 35, 0, 65, 11, 62, 1.0, 30, 'u_spirit_1'),
        U('중급정령', 2, 50, 0, 190, 28, 76, 1.0, 30, 'u_spirit_2', { req: { b: 'spring', eat: [0, 2] } }),
        U('상급정령', 3, 120, 30, 520, 66, 92, 1.1, 30, 'u_spirit_3', { splash: 16, req: { b: 'tree', eat: [1, 2] } }),
        U('바위 정령', 2, 60, 0, 360, 16, 15, 1.2, 26, 'u_spirit_4', { req: { b: 'spring' } }),
      ],
      blds: [
        B('spring', '정령의 샘', 'unlock', 100, 0, 450, 'b_unlock1', '중급정령 해금 (하급정령 2기 융합)'),
        B('tree', '세계수 묘목', 'unlock', 180, 35, 650, 'b_unlock2', '상급정령 해금 (중급정령 2기 융합)'),
        B('tower', '수정탑', 'tower', 100, 15, 280, 'b_tower', '긴 사거리', { atk: 20, rng: 120, as: 1.1 }),
        B('wall', '결계석', 'wall', 35, 5, 550, 'b_wall', '길 차단'),
        B('crystal', '마나 수정', 'eco', 110, 0, 280, 'b_special', '자재 +0.3/초', { mps: 0.3 }),
      ],
      heroes: [['대지의 그론', 'war'], ['바람의 실피엘', 'arc'], ['번개의 볼탄', 'rid'], ['샘의 운디아', 'heal']],
    },
    merfolk: {
      name: '어인족', color: 'b1',
      trait: '유닛 초당 체력 1% 재생',
      units: [
        U('갈퀴병', 1, 30, 0, 108, 10, 14, 0.9, 36, 'u_merfolk_1'),
        U('조수 주술사', 2, 80, 5, 95, 10, 72, 1.2, 28, 'u_merfolk_2', { heal: 14, req: { b: 'coral' } }),
        U('심해 거인', 3, 200, 35, 780, 38, 18, 1.2, 26, 'u_merfolk_3', { splash: 12, req: { b: 'trench', cnt: ['pool', 2] } }),
        U('작살수', 2, 85, 5, 100, 30, 84, 1.5, 28, 'u_merfolk_4', { req: { b: 'coral' } }),
      ],
      blds: [
        B('coral', '산호 제단', 'unlock', 100, 0, 450, 'b_unlock1', '조수 주술사(치유사) 해금'),
        B('trench', '심해 균열', 'unlock', 170, 30, 650, 'b_unlock2', '심해 거인 해금 (웅덩이 2개)'),
        B('tower', '작살탑', 'tower', 90, 10, 320, 'b_tower', '강한 한 방', { atk: 22, rng: 90, as: 1.3 }),
        B('wall', '조개 방벽', 'wall', 30, 0, 650, 'b_wall', '튼튼한 길 차단'),
        B('pool', '조수 웅덩이', 'aura', 90, 5, 300, 'b_special', '주변 체력 6/초 회복', { regen: 6, rad: 56 }),
      ],
      heroes: [['파도가르는 모르간', 'war'], ['작살잡이 넵타', 'arc'], ['해마기수 코랄', 'rid'], ['진주무녀 나이아', 'heal']],
    },
  };
  // 전설 유닛: 최상위 유닛을 조합해야만 나온다(소환 불가)
  const LG = {
    human: ['성기사', 1100, 82, 16, 1.0, 44, { splash: 12 }], dragon: ['고룡', 1300, 105, 70, 1.2, 40, { splash: 22 }],
    beast: ['베헤모스', 1700, 90, 18, 1.2, 30, { splash: 16 }], spirit: ['정령왕', 1200, 150, 100, 1.1, 30, { splash: 20 }],
    merfolk: ['크라켄', 2000, 85, 20, 1.2, 26, { splash: 16 }],
  };
  for (const k in LG) { const l = LG[k]; DD.RACES[k].legend = U(l[0], 4, 0, 0, l[1], l[2], l[3], l[4], l[5], 'u_' + k + '_5', Object.assign({ legend: true }, l[6])); }
  // 함정: 모든 종족 공통. 길 위에 깔고, 악마는 부수지 못한다
  const TRAPS = [
    B('spike', '가시 함정', 'trap', 40, 0, 1, 'trap_spike', '밟고 지나는 악마에게 0.5초마다 피해', { dmg: 9, every: 0.5 }),
    B('tar', '끈끈이 늪', 'trap', 35, 0, 1, 'trap_tar', '밟고 지나는 악마의 이동 -45%', { slow: 0.55 }),
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
    imp: { name: '임프', hp: 42, atk: 6, rng: 12, as: 0.9, spd: 34, gold: 7, light: true, spr: 'd_imp', desc: '약하지만 떼로 몰려온다 · 범위 공격에 약하다' },
    brute: { name: '악귀', hp: 170, atk: 16, rng: 15, as: 1.2, spd: 20, gold: 15, mat: 3, heavy: true, spr: 'd_brute', desc: '중장갑 · 범위 공격에 강하고 단일 공격에 약하다 · 자재(◆)를 흘린다' },
    hound: { name: '지옥견', hp: 62, atk: 9, rng: 13, as: 0.7, spd: 54, gold: 8, light: true, spr: 'd_hound', desc: '매우 빠르다 · 범위 공격에 약하다 · 길을 길게 늘여 붙잡자' },
    bat: { name: '가고일', hp: 38, atk: 3, rng: 12, as: 1.0, spd: 36, gold: 9, fly: true, spr: 'd_bat', desc: '비행 · 길을 무시하고 심장으로 직진 · 원거리 공격과 탑만 닿는다' },
    warlock: { name: '흑마술사', hp: 72, atk: 14, rng: 72, as: 1.4, spd: 22, gold: 13, mat: 3, spr: 'd_warlock', desc: '원거리 · 길가 건물을 부순다 · 벽으로 시야를 막자' },
    boss: { name: '악마 군주', hp: 1500, atk: 40, rng: 20, as: 1.4, spd: 15, gold: 200, mat: 30, splash: 16, heavy: true, spr: 'd_boss', desc: '중장갑 · 광역 공격 · 건물도 부순다 · 다섯 웨이브마다' },
  };
  // 웨이브 w(1~20)의 구성
  DD.waveList = function (w) {
    const l = [];
    const add = (t, n) => { for (let i = 0; i < n; i++) l.push(t); };
    add('imp', 5 + 2 * w);
    if (w >= 3) add('brute', Math.floor(w * 0.8));
    if (w >= 5) add('hound', w - 3);
    if (w >= 7) add('warlock', Math.floor(w / 2));
    if (w >= 6) add('bat', Math.floor(w / 5));
    if (w % 5 === 0) add('boss', 1);
    return l;
  };
  DD.waveScale = (w) => ({ hp: Math.pow(1.105, w - 1) * (w === 20 ? 1.4 : 1), atk: Math.pow(1.055, w - 1) });

  // 스테이지(땅): 종족마다 고향이 하나, 마지막은 악마성. mods[종족]={atk,hp,spd 배율}
  DD.LANDS = {
    cave: { id: 'cave', home: 'human', name: '왕국의 지하 요새', desc: '인간의 땅', mods: { human: { hp: 1.1 } } },
    fire: { id: 'fire', home: 'dragon', name: '불타는 심연', desc: '용족의 땅', mods: { dragon: { atk: 1.2, hp: 1.1 }, merfolk: { hp: 0.8 }, spirit: { atk: 0.9 }, beast: { hp: 0.9 } } },
    wild: { id: 'wild', home: 'beast', name: '송곳니 황야', desc: '수인족의 땅', mods: { beast: { atk: 1.15, spd: 1.1 }, human: { spd: 0.9 }, merfolk: { atk: 0.9 } } },
    forest: { id: 'forest', home: 'spirit', name: '고대의 숲', desc: '정령족의 땅', mods: { spirit: { hp: 1.25 }, dragon: { spd: 0.9 }, merfolk: { atk: 0.85 } } },
    water: { id: 'water', home: 'merfolk', name: '수몰된 회랑', desc: '어인족의 땅', mods: { merfolk: { atk: 1.2, hp: 1.2 }, dragon: { atk: 0.85 }, human: { spd: 0.85 }, beast: { spd: 0.85 } } },
    abyss: { id: 'abyss', home: null, name: '악마성', desc: '게이트 너머', mods: { human: { hp: 0.9 }, dragon: { hp: 0.9 }, beast: { hp: 0.9 }, spirit: { hp: 0.9 }, merfolk: { hp: 0.9 } } },
  };
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
  DD.CALL_BONUS = 1; // 웨이브를 일찍 부르면 건너뛴 1초마다 주는 추가 골드
  DD.shardsFor = (stage, wavesCleared, win, diff) => Math.round((wavesCleared * 2 + (win ? 30 : 0)) * (1 + stage * 0.5) * DD.DIFFS[diff == null ? 1 : diff].shard);

  // 건물 종류별 최대 수. 같은 건물을 끝없이 늘릴 수 없다
  DD.BLD_MAX = { unlock: 1, tower: 6, wall: 10, eco: 3, aura: 3, trap: 6 };
  DD.bldMax = (b) => DD.BLD_MAX[b.kind];
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
  ];
  // 침공로: 스테이지와 난이도가 오르면 좌우 벽에도 입구가 열린다
  // 배치: 넷째 스테이지와 악마성은 심장이 한가운데 있고 위아래에서 쳐들어온다
  DD.LAYOUTS = { top: { heart: [13, 0], summon: [11, 0], altar: [15, 0] }, center: { heart: [13, 9], summon: [11, 9], altar: [15, 9] } };
  DD.layoutOf = (stage, tutorial) => (!tutorial && (stage === 3 || stage === 5) ? 'center' : 'top');
  DD.entCount = (stage, diff, tutorial) => {
    if (tutorial) return 1; const s = stage + (diff >= 2 ? 1 : 0) + (diff >= 3 ? 1 : 0);
    return DD.layoutOf(stage) === 'center' ? (s < 4 ? 2 : s < 6 ? 3 : 4) : s < 2 ? 1 : s < 4 ? 2 : 3;
  };
  DD.entsFor = (n, lay) => { const C = DD.C, mx = C.ENT_T[0], L = [0, C.GH >> 1], R = [C.GW - 1, C.GH >> 1]; return ((lay || C.LAYOUT) === 'center' ? [C.ENT_T, [mx, 0], L, R] : [C.ENT_T, L, R]).slice(0, n); };
  // 숙련: 악마를 많이 잡은 유닛은 승급한다(영웅 제외). 단계마다 공격·체력 +15%
  DD.RANKS = ['', '정예', '백전노장'];
  DD.RANK_KILLS = [0, 8, 25];
  DD.rankOf = (u) => (u.hero ? 0 : u.kills >= DD.RANK_KILLS[2] ? 2 : u.kills >= DD.RANK_KILLS[1] ? 1 : 0);
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
  DD.missionGold = (w) => 40 + 10 * w;
  // 기록: 깬 난이도와 남은 심장으로 별 1~3개
  DD.starsFor = (heartRatio) => (heartRatio >= 0.9 ? 3 : heartRatio >= 0.5 ? 2 : 1);
})(typeof window !== 'undefined' ? window : globalThis);
