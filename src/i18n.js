// 언어(한국어·영어·일본어). 원문은 한국어이고, 화면에 나가는 글을 이 사전으로 바꾼다.
// 사전에 없는 글은 한국어 그대로 나온다 → `node tools/i18n_extract.js --missing en|ja` 로 누락을 찾는다.
(function (g) {
  const DD = (g.DD = g.DD || {});
  DD.LANGS = { ko: '한국어', en: 'English', ja: '日本語' };

  // [한국어, 영어, 일본어]
  const D = [
    ['영웅 기술', 'Hero Skills', '英雄スキル'], ['살아 있는 영웅이 모두 기술을 쓴다 · 대기', 'Every living hero uses their skill · cooldown', '生きている英雄が全員スキルを使う · 待機'],
    ['대지 강타', 'Ground Slam', '大地強打'], ['주변 악마에게 큰 피해를 주고 2초 기절', 'Heavy damage to nearby demons and a 2s stun', '周囲の悪魔に大ダメージを与え2秒気絶'],
    ['화살비', 'Arrow Rain', '矢の雨'], ['사거리 안의 모든 악마에게 2배 피해', 'Double damage to every demon in range', '射程内のすべての悪魔に2倍ダメージ'],
    ['질풍 돌격', 'Gale Charge', '疾風突撃'], ['6초 동안 이동·공격 속도 +60%', '+60% move and attack speed for 6s', '6秒間、移動·攻撃速度 +60%'],
    ['치유의 빛', 'Healing Light', '癒しの光'], ['주변 아군의 체력을 35% 회복', 'Restores 35% HP to nearby allies', '周囲の味方のHPを35%回復'],
    ['영웅이 없습니다', 'You have no heroes', '英雄がいません'], ['기술을 아직 쓸 수 없습니다', 'Skills are not ready yet', 'スキルはまだ使えません'],
    ['· 심장이 한가운데', '· the Heart is in the middle', '· 心臓は中央'], ['심장 중앙', 'center', '心臓中央'], ['기술', 'Skill', 'スキル'],
    ['가시 함정', 'Spike Trap', 'スパイク罠'], ['밟고 지나는 악마에게 0.5초마다 피해', 'Damages demons crossing it every 0.5s', '踏んだ悪魔に0.5秒ごとにダメージ'],
    ['끈끈이 늪', 'Tar Pit', '粘着沼'], ['밟고 지나는 악마의 이동 -45%', 'Demons crossing it move 45% slower', '踏んだ悪魔の移動 -45%'],
    ['길 위에 깐다 · 악마는 부수지 못한다', 'Laid on roads · demons cannot destroy it', '道の上に置く · 悪魔には壊せない'], ['고른 뒤 Del로 걷는다', 'Select it and press Del to remove', '選んでDelで撤去'],
    ['함정은 길 위에만 놓을 수 있습니다', 'Traps can only be laid on roads', '罠は道の上にしか置けません'], ['H J 함정', 'H J traps', 'H J 罠'],
    ['소환의 군주', 'Lord of Summons', '召喚の君主'], ['8초마다 임프 셋을 부른다 · 빨리 쓰러뜨려야 한다', 'Calls three imps every 8s · bring it down fast', '8秒ごとにインプを三体呼ぶ · 早く倒せ'],
    ['파성의 군주', 'Siegebreaker Lord', '破城の君主'], ['건물에 4배 피해 · 체력이 절반 아래로 떨어지면 돌진한다', 'Deals 4× damage to buildings · charges below half HP', '建物に4倍ダメージ · HPが半分を切ると突進する'],
    ['포효의 군주', 'Roaring Lord', '咆哮の君主'], ['10초마다 포효해 주변 유닛을 2초 동안 기절시킨다', 'Roars every 10s, stunning nearby units for 2s', '10秒ごとに咆哮し、周囲のユニットを2秒間気絶させる'],
    ['악마 대군주', 'Demon Overlord', '悪魔大君主'], ['임프 소환 · 건물 4배 피해 · 포효 · 절반 아래에서 돌진', 'Summons imps · 4× damage to buildings · roars · charges below half HP', 'インプ召喚 · 建物に4倍ダメージ · 咆哮 · 半分以下で突進'],
    ['· 중장갑', '· Heavy armor', '· 重装甲'], ['군주가 돌진한다!', 'The Lord is charging!', '君主が突進してくる!'],
    ['미션 성공 ·', 'Mission complete ·', 'ミッション成功 ·'], ['미션 실패 ·', 'Mission failed ·', 'ミッション失敗 ·'], ['미션 ·', 'Mission ·', 'ミッション ·'], ['미션', 'Mission', 'ミッション'],
    ['심장이 맞기 전에 격퇴', 'Repel the wave before the Heart is hit', '心臓が攻撃される前に撃退'], ['유닛을 잃지 않고 격퇴', 'Repel the wave without losing a unit', 'ユニットを失わずに撃退'],
    ['마법사', 'Mage', '魔法使い'], ['용아병', 'Fangguard', '竜牙兵'], ['투창꾼', 'Javelineer', '投槍兵'], ['바위 정령', 'Rock Spirit', '岩の精霊'], ['작살수', 'Harpooner', '銛撃ち'],
    ['2단계 무작위', 'random tier 2', '2段階ランダム'], ['2단계', 'Tier 2', '2段階'],
    ['성기사', 'Paladin', '聖騎士'], ['고룡', 'Elder Dragon', '古龍'], ['베헤모스', 'Behemoth', 'ベヒーモス'], ['정령왕', 'Spirit King', '精霊王'], ['크라켄', 'Kraken', 'クラーケン'],
    ['가고일', 'Gargoyle', 'ガーゴイル'], ['비행 · 길을 무시하고 심장으로 직진 · 원거리 공격과 탑만 닿는다', 'Flying · ignores roads and heads straight for the Heart · only ranged attacks and towers can hit it', '飛行 · 道を無視して心臓へ直進 · 遠距離攻撃と塔だけが届く'],
    ['약하지만 떼로 몰려온다 · 범위 공격에 약하다', 'Weak, but they come in swarms · weak to area attacks', '弱いが群れで来る · 範囲攻撃に弱い'],
    ['중장갑 · 범위 공격에 강하고 단일 공격에 약하다 · 자재(◆)를 흘린다', 'Heavy armor · resists area attacks, weak to single hits · drops materials (◆)', '重装甲 · 範囲攻撃に強く単体攻撃に弱い · 資材(◆)を落とす'],
    ['매우 빠르다 · 범위 공격에 약하다 · 길을 길게 늘여 붙잡자', 'Very fast · weak to area attacks · lengthen the road to catch them', 'とても速い · 範囲攻撃に弱い · 道を長くして捕まえよう'],
    ['중장갑 ·', 'Heavy armor ·', '重装甲 ·'],
    ['랜덤 소환 ·', 'Random summon ·', 'ランダム召喚 ·'], ['랜덤 소환', 'Random', 'ランダム'], ['건물 조건 없이 유닛 하나를 뽑는다', 'Draws one unit, ignoring building requirements', '建物条件なしでユニットを一体引く'],
    ['조합 ·', 'Merged ·', '合成 ·'], ['조합', 'Merge', '合成'], ['지금은 합칠 유닛이 없다', 'Nothing to merge right now', '今は合成できるユニットがいない'], ['지금 합칠 유닛은 갈 길이 하나뿐이다', 'These units have only one path', 'このユニットの合成先は一つだけ'],
    ['전설 유닛 탄생', 'A legendary unit is born', '伝説ユニット誕生'], ['B V 조합', 'B V merge', 'B V 合成'],
    ['쉬움', 'Easy', 'やさしい'], ['보통', 'Normal', 'ふつう'], ['어려움', 'Hard', 'むずかしい'], ['악몽', 'Nightmare', '悪夢'], ['난이도', 'Difficulty', '難易度'],
    ['악마 체력', 'Demon HP', '悪魔のHP'], ['· 공격 ×', '· ATK ×', '· 攻撃 ×'], ['· 골드 ×', '· Gold ×', '· ゴールド ×'], ['영혼석 ×', 'Soul Shards ×', '魂石 ×'],
    ['이 건물은 더 지을 수 없다', 'You cannot build more of these', 'この建物はこれ以上建てられません'], ['골드 +1.2/초', '+1.2 gold/s', 'ゴールド +1.2/秒'],
    ['질주', 'Swift', '疾走'], ['악마 이동 +35%', 'Demons move 35% faster', '悪魔の移動 +35%'], ['철갑', 'Armored', '鉄甲'], ['악마 체력 +40%', 'Demons have 40% more HP', '悪魔のHP +40%'],
    ['대군', 'Horde', '大軍'], ['악마 수 +50%', '50% more demons', '悪魔の数 +50%'], ['격노', 'Enraged', '激怒'], ['악마 공격 +40%', 'Demons hit 40% harder', '悪魔の攻撃 +40%'],
    ['약탈단', 'Raiders', '略奪団'], ['처치 골드 2배 · 악마 체력 +20%', 'Double kill gold · demons have 20% more HP', '撃破ゴールド2倍 · 悪魔のHP +20%'], ['변이 ·', 'Mutation ·', '変異 ·'],
    ['전리품 ·', 'Spoils ·', '戦利品 ·'], ['전리품', 'Spoils of War', '戦利品'], ['악마 군주를 쓰러뜨렸다. 하나를 고른다.', 'The Demon Lord has fallen. Choose one.', '悪魔君主を倒した。一つ選べ。'],
    ['날 선 무기', 'Honed Blades', '研がれた刃'], ['유닛·탑 공격 +12%', 'Units and towers deal 12% more damage', 'ユニット·塔の攻撃 +12%'], ['두꺼운 갑옷', 'Thick Armor', '厚い鎧'], ['유닛 체력 +15%', 'Units have 15% more HP', 'ユニットのHP +15%'],
    ['약탈 허가', 'Licence to Loot', '略奪許可'], ['처치 골드 +20%', '+20% kill gold', '撃破ゴールド +20%'], ['징집령', 'Conscription', '徴兵令'], ['인구 한도 +6', 'Population cap +6', '人口上限 +6'],
    ['심장 강화', 'Fortified Heart', '心臓強化'], ['심장 최대 체력 +250 · 250 회복', 'Heart max HP +250 · heals 250', '心臓の最大HP +250 · 250回復'],
    ['영웅의 부름', "Hero's Call", '英雄の呼び声'], ['영웅을 바로 소환 · 대기 -15%', 'A hero is ready now · 15% shorter wait', '英雄をすぐ召喚 · 待機 -15%'],
    ['군자금', 'War Chest', '軍資金'], ['골드 +300', '+300 gold', 'ゴールド +300'], ['보급 마차', 'Supply Wagon', '補給馬車'], ['자재 +60', '+60 materials', '資材 +60'],
    ['견고한 축성', 'Sturdy Works', '堅固な築城'], ['건물 체력 +30%', 'Buildings have 30% more HP', '建物のHP +30%'], ['야전 치유', 'Field Medicine', '野戦治療'], ['유닛 초당 체력 0.5% 재생', 'Units regenerate 0.5% HP per second', 'ユニットが毎秒HP 0.5%再生'],
    ['· 새 기록 +', '· New record +', '· 新記録 +'],
    // ── 종족·유닛·건물·영웅 ──
    ['인간족', 'Humans', '人間族'], ['용족', 'Dragonkin', '竜族'], ['수인족', 'Beastfolk', '獣人族'], ['정령족', 'Spirits', '精霊族'], ['어인족', 'Merfolk', '魚人族'],
    ['건물 비용 -20% · 체력 +20%', 'Buildings cost 20% less, +20% HP', '建物コスト-20% · 耐久+20%'],
    ['처치마다 공격 +2% (최대 50%)', '+2% ATK per kill (max 50%)', '撃破ごとに攻撃+2% (最大50%)'],
    ['아군 1기당 공격 +1.5% (최대 40%)', '+1.5% ATK per ally (max 40%)', '味方1体につき攻撃+1.5% (最大40%)'],
    ['자재 +0.15/초 · 하위 정령을 융합', '+0.15 materials/s · fuse lesser spirits', '資材+0.15/秒 · 下位の精霊を融合'],
    ['유닛 초당 체력 1% 재생', 'Units regenerate 1% HP per second', 'ユニットは毎秒HPを1%回復'],
    ['보병', 'Footman', '歩兵'], ['궁병', 'Archer', '弓兵'], ['기사', 'Knight', '騎士'],
    ['리자드맨', 'Lizardman', 'リザードマン'], ['드레이크', 'Drake', 'ドレイク'], ['와이번', 'Wyvern', 'ワイバーン'],
    ['코볼트', 'Kobold', 'コボルト'], ['늑대전사', 'Wolf Warrior', '狼戦士'], ['미노타우로스', 'Minotaur', 'ミノタウロス'],
    ['하급정령', 'Lesser Spirit', '下級精霊'], ['중급정령', 'Greater Spirit', '中級精霊'], ['상급정령', 'High Spirit', '上級精霊'],
    ['갈퀴병', 'Gillkin', 'ギルキン'], ['조수 주술사', 'Tide Shaman', '潮の呪術師'], ['심해 거인', 'Deep Giant', '深海の巨人'],
    ['병영', 'Barracks', '兵舎'], ['궁병 해금', 'Unlocks Archers', '弓兵を解放'],
    ['대장간', 'Forge', '鍛冶場'], ['기사 해금 · 공격 +15%', 'Unlocks Knights · +15% ATK', '騎士を解放 · 攻撃+15%'],
    ['화살탑', 'Arrow Tower', '矢の塔'], ['원거리 공격', 'Ranged attack', '遠距離攻撃'],
    ['방벽', 'Barricade', '防壁'], ['길 차단', 'Blocks the road', '道をふさぐ'],
    ['시장', 'Market', '市場'], ['골드 +1.5/초', '+1.5 gold/s', 'ゴールド+1.5/秒'],
    ['부화장', 'Hatchery', '孵化場'], ['드레이크 해금', 'Unlocks Drakes', 'ドレイクを解放'],
    ['용의 둥지', 'Dragon Nest', '竜の巣'], ['와이번 해금 (처치 50)', 'Unlocks Wyverns (50 kills)', 'ワイバーンを解放 (撃破50)'],
    ['화염 기둥', 'Flame Pillar', '炎の柱'], ['범위 공격', 'Area attack', '範囲攻撃'],
    ['용암벽', 'Lava Wall', '溶岩壁'], ['길 차단 · 피해 반사', 'Blocks the road · reflects damage', '道をふさぐ · ダメージ反射'],
    ['보물 더미', 'Hoard', '財宝の山'], ['처치 골드 +20% (최대 3개)', '+20% gold per kill (max 3)', '撃破ゴールド+20% (最大3つ)'],
    ['사냥굴', 'Hunting Den', '狩りの巣穴'], ['늑대전사 해금 (코볼트 5기)', 'Unlocks Wolf Warriors (5 Kobolds)', '狼戦士を解放 (コボルト5体)'],
    ['투기장', 'Arena', '闘技場'], ['미노타우로스 해금', 'Unlocks Minotaurs', 'ミノタウロスを解放'],
    ['투척탑', 'Sling Tower', '投石塔'], ['빠른 공격', 'Fast attack', '高速攻撃'],
    ['가시 울타리', 'Thorn Fence', 'いばらの柵'], ['싼 길 차단 · 약한 반사', 'Cheap roadblock · weak reflect', '安い道ふさぎ · 弱い反射'],
    ['전투 북', 'War Drum', '戦太鼓'], ['주변 공격 속도 +25%', '+25% attack speed nearby', '周囲の攻撃速度+25%'],
    ['정령의 샘', 'Spirit Spring', '精霊の泉'], ['중급정령 해금 (하급정령 2기 융합)', 'Unlocks Greater Spirits (fuse 2 Lesser)', '中級精霊を解放 (下級精霊2体を融合)'],
    ['세계수 묘목', 'World Tree Sapling', '世界樹の苗木'], ['상급정령 해금 (중급정령 2기 융합)', 'Unlocks High Spirits (fuse 2 Greater)', '上級精霊を解放 (中級精霊2体を融合)'],
    ['수정탑', 'Crystal Spire', '水晶塔'], ['긴 사거리', 'Long range', '長射程'],
    ['결계석', 'Ward Stone', '結界石'], ['마나 수정', 'Mana Crystal', 'マナ水晶'], ['자재 +0.3/초', '+0.3 materials/s', '資材+0.3/秒'],
    ['산호 제단', 'Coral Altar', '珊瑚の祭壇'], ['조수 주술사(치유사) 해금', 'Unlocks Tide Shamans (healers)', '潮の呪術師(回復役)を解放'],
    ['심해 균열', 'Abyssal Rift', '深海の裂け目'], ['심해 거인 해금 (웅덩이 2개)', 'Unlocks Deep Giants (2 Tide Pools)', '深海の巨人を解放 (潮だまり2つ)'],
    ['작살탑', 'Harpoon Tower', '銛の塔'], ['강한 한 방', 'Heavy single shot', '強力な一撃'],
    ['조개 방벽', 'Shell Wall', '貝の防壁'], ['튼튼한 길 차단', 'Sturdy roadblock', '頑丈な道ふさぎ'],
    ['조수 웅덩이', 'Tide Pool', '潮だまり'], ['주변 체력 6/초 회복', 'Heals 6 HP/s nearby', '周囲のHPを毎秒6回復'],
    ['검성 레온하르트', 'Leonhart the Sword Saint', '剣聖レオンハルト'], ['명궁 실비아', 'Sylvia the Deadeye', '名弓シルヴィア'], ['창기사 발트', 'Walt the Lancer', '槍騎士ヴァルト'], ['성녀 에일라', 'Saint Aila', '聖女エイラ'],
    ['적린의 카르가스', 'Kargas the Red-Scaled', '赤鱗のカルガス'], ['화염숨결 이그니아', 'Ignia Flamebreath', '炎息のイグニア'], ['질풍날개 자르칸', 'Zarkan Galewing', '疾風翼のザルカン'], ['용무녀 세라핀', 'Seraphine the Dragon Maiden', '竜巫女セラフィーヌ'],
    ['철엄니 바록', 'Barok Irontusk', '鉄牙のバロック'], ['매눈 시라', 'Sira Hawkeye', '鷹の目シラ'], ['질주하는 펜로', 'Fenro the Swift', '疾走のフェンロ'], ['달무당 루나라', 'Lunara the Moon Shaman', '月巫女ルナラ'],
    ['대지의 그론', 'Gron of the Earth', '大地のグロン'], ['바람의 실피엘', 'Sylphiel of the Wind', '風のシルフィエル'], ['번개의 볼탄', 'Voltan of the Storm', '雷のヴォルタン'], ['샘의 운디아', 'Undia of the Spring', '泉のウンディア'],
    ['파도가르는 모르간', 'Morgan Wavecleaver', '波裂きのモルガン'], ['작살잡이 넵타', 'Nepta the Harpooner', '銛打ちのネプタ'], ['해마기수 코랄', 'Coral the Seahorse Rider', '海馬乗りのコーラル'], ['진주무녀 나이아', 'Naia the Pearl Maiden', '真珠巫女ナイア'],
    ['전사', 'Warrior', '戦士'], ['궁수', 'Ranger', '射手'], ['기수', 'Rider', '騎手'], ['치유사', 'Healer', '回復役'],
    ['공격 강화', 'Attack', '攻撃強化'], ['유닛 공격 +10%', '+10% unit ATK', 'ユニットの攻撃+10%'],
    ['체력 강화', 'Vitality', '体力強化'], ['유닛 체력 +10%', '+10% unit HP', 'ユニットのHP+10%'],
    ['건축 강화', 'Masonry', '建築強化'], ['건물 체력·탑 공격 +15%', '+15% building HP and tower ATK', '建物の耐久·塔の攻撃+15%'],
    // ── 악마 ──
    ['임프', 'Imp', 'インプ'], ['약하지만 떼로 몰려온다', 'Weak, but comes in swarms', '弱いが群れで押し寄せる'],
    ['악귀', 'Brute', '悪鬼'], ['단단하다 · 자재(◆)를 흘린다', 'Tough · drops materials (◆)', '頑丈 · 資材(◆)を落とす'],
    ['지옥견', 'Hellhound', 'ヘルハウンド'], ['매우 빠르다 · 길을 길게 늘여 붙잡자', 'Very fast · stretch the road to catch it', 'とても速い · 道を長くして捕まえよう'],
    ['흑마술사', 'Warlock', '黒魔術師'], ['원거리 · 길가 건물을 부순다 · 벽으로 시야를 막자', 'Ranged · wrecks roadside buildings · block its sight with walls', '遠距離 · 道沿いの建物を壊す · 壁で視界を遮ろう'],
    ['악마 군주', 'Demon Lord', 'デーモンロード'], ['광역 공격 · 건물도 부순다 · 다섯 웨이브마다', 'Area attacks · wrecks buildings · every fifth wave', '範囲攻撃 · 建物も壊す · 5ウェーブごと'],
    // ── 땅 ──
    ['왕국의 지하 요새', 'The Royal Undercroft', '王国の地下要塞'], ['인간의 땅', 'Land of Humans', '人間の地'],
    ['불타는 심연', 'The Burning Abyss', '燃える深淵'], ['용족의 땅', 'Land of Dragonkin', '竜族の地'],
    ['송곳니 황야', 'The Fang Wastes', '牙の荒野'], ['수인족의 땅', 'Land of Beastfolk', '獣人族の地'],
    ['고대의 숲', 'The Ancient Forest', '古の森'], ['정령족의 땅', 'Land of Spirits', '精霊族の地'],
    ['수몰된 회랑', 'The Drowned Halls', '水没の回廊'], ['어인족의 땅', 'Land of Merfolk', '魚人族の地'],
    ['악마성', 'The Demon Castle', '悪魔城'], ['게이트 너머', 'Beyond the Gate', 'ゲートの向こう'],
    ['유닛 체력', 'Unit HP', 'ユニットHP'], ['유닛 공격', 'Unit ATK', 'ユニット攻撃'], ['건물·심장 체력', 'Building & Heart HP', '建物·心臓の耐久'],
    ['골드 수급', 'Gold income', 'ゴールド収入'], ['시작 골드', 'Starting gold', '初期ゴールド'], ['영웅 소환 대기 단축', 'Faster hero summons', '英雄召喚の待機短縮'],
    // ── 제목·참모 ──
    ['그리기스 연대기 — 악마 침공 방어전', 'Grigis Chronicles — Hold Back the Demon Invasion', 'グリギス年代記 — 悪魔侵攻防衛戦'],
    ['그리기스 연대기', 'GRIGIS CHRONICLES', 'グリギス年代記'], ['악마 침공 방어전', 'Hold Back the Demon Invasion', '悪魔侵攻防衛戦'],
    ['아델라', 'Adela', 'アデラ'], ['왕국 참모장', 'Royal Chief of Staff', '王国参謀長'],
    ['발타르', 'Baltar', 'バルタル'], ['용족 기록관', 'Dragonkin Chronicler', '竜族の記録官'],
    ['그레이', 'Grey', 'グレイ'], ['수인족 책사', 'Beastfolk Strategist', '獣人族の軍師'],
    ['베릴', 'Beryl', 'ベリル'], ['정령족 별지기', 'Spirit Stargazer', '精霊族の星守'],
    ['마레아', 'Marea', 'マレア'], ['어인족 조류술사', 'Merfolk Tidecaller', '魚人族の潮読み'],
    // ── 프롤로그 ──
    ['그리기스.', 'Grigis.', 'グリギス。'],
    ['다섯 종족이 평화롭게 살던 대륙.', 'A continent where five races lived in peace.', '五つの種族が平和に暮らしていた大陸。'],
    ['어느 날, 대륙 한복판에 정체모를 게이트가 열리고,', 'One day, a gate of unknown origin opened in the heart of the land,', 'ある日、大陸の真ん中に正体不明のゲートが開き、'],
    ['게이트에선 악마가 쏟아져 나왔다.', 'and demons came pouring out of it.', 'そこから悪魔があふれ出した。'],
    ['대륙은 악마들에 의해 불타올랐고,', 'The continent burned at the hands of the demons,', '大陸は悪魔の手で燃え上がり、'],
    ['대륙의 다섯 종족은 위기를 맞이했다.', 'and its five races stood on the brink.', '五つの種族は危機に立たされた。'],
    ['인간, 용, 수인, 정령, 어인.', 'Humans. Dragonkin. Beastfolk. Spirits. Merfolk.', '人間、竜、獣人、精霊、魚人。'],
    ['다섯 종족은 처음으로 힘을 하나로 모았다.', 'For the first time, the five stood as one.', '五つの種族は初めて力を一つに合わせた。'],
    ['방벽과 병사를 세워 악마를 막고, 대륙의 심장을 지켜라.', 'Raise your walls and your soldiers. Hold back the demons. Protect the Heart of the continent.', '防壁と兵を並べて悪魔を食い止め、大陸の心臓を守れ。'],
    ['당신이 이 대륙의 희망이다.', 'You are this land\'s last hope.', 'あなたこそがこの大陸の希望だ。'],
    // ── 튜토리얼(아델라) ──
    ['오늘부터 사령관님을 도와드릴 참모장 아델라입니다.', 'I am Adela, your chief of staff. I serve at your side from today, Commander.', '本日より司令官をお支えする参謀長、アデラです。'],
    ['악마는 아래 입구로 들어와 대륙의 심장까지 길을 따라 진격합니다. 심장을 지키지 못하면 이 대륙은 끝장입니다.', 'The demons enter through the gate below and march along the road to the Heart. If the Heart falls, the continent falls with it.', '悪魔は下の入口から入り、道に沿って大陸の心臓まで進軍します。心臓を守れなければ、この大陸は終わりです。'],
    ['우선 보병부터 세우죠.', 'Let us begin with footmen.', 'まずは歩兵を立てましょう。'],
    ['보병 3기 소환 · Q', 'Summon 3 Footmen · Q', '歩兵を3体召喚 · Q'],
    ['병사들이 소환되었습니다.', 'Your soldiers have arrived.', '兵が召喚されました。'],
    ['병사들을 이동시켜보죠.', 'Now let us move them.', '兵を動かしてみましょう。'],
    ['병사를 드래그로 고른 뒤 바닥을 클릭', 'Drag to select soldiers, then click the ground', '兵をドラッグで選び、地面をクリック'],
    ['악마들이 옵니다! 악마를 해치우세요!', 'Here they come! Cut them down!', '悪魔が来ます!倒してください!'],
    ['궁병과 기사는 특정 건물이 있어야 소환할 수 있습니다. 궁병부터 소환해볼까요?', 'Archers and knights each need a building before they can be summoned. Shall we start with archers?', '弓兵と騎士は特定の建物がなければ召喚できません。まずは弓兵からにしましょうか。'],
    ['궁병을 소환하기 위해선 병영이 필요합니다. 병영을 먼저 지어보죠.', 'Archers need a barracks. Let us build one first.', '弓兵の召喚には兵舎が必要です。先に兵舎を建てましょう。'],
    ['건물을 거점 위에 세울 경우 쉽게 무너지지 않습니다.', 'A building raised on a platform does not fall easily.', '拠点の上に建てた建物は、簡単には崩れません。'],
    ['병영 건설 · A → 초록 칸 클릭', 'Build a Barracks · A → click a green tile', '兵舎を建設 · A → 緑のマスをクリック'],
    ['궁병은 원거리 유닛입니다. 보병 뒤에 세우세요.', 'Archers fight from range. Keep them behind your footmen.', '弓兵は遠距離ユニットです。歩兵の後ろに置いてください。'],
    ['궁병 2기 소환 · W', 'Summon 2 Archers · W', '弓兵を2体召喚 · W'],
    ['영웅 소환을 할 수 있습니다. 어떤 영웅이 소집에 응할까요?', 'You may summon a hero now. I wonder who will answer the call.', '英雄を召喚できます。どの英雄が呼びかけに応えるでしょうか。'],
    ['영웅 소환 제단을 강화하면 더 강하고, 더 빠르게 영웅을 소환할 수 있습니다.', 'Upgrade the Hero Altar and stronger heroes will come, and sooner.', '英雄の祭壇を強化すれば、より強い英雄をより早く召喚できます。'],
    ['영웅 소환 · T', 'Summon a Hero · T', '英雄を召喚 · T'],
    ['사령관님, 악마들의 진격을 방해해보죠.', 'Commander, let us slow their advance.', '司令官、悪魔の進軍を妨害しましょう。'],
    ['길을 미로처럼 이어두면 악마들의 진격이 늦어질겁니다. 단, 길은 대륙의 심장과 이어져 있어야 합니다.', 'Wind the road like a maze and they will take longer to arrive. The road must still reach the Heart.', '道を迷路のようにつなげば、悪魔の進軍は遅れます。ただし、道は大陸の心臓につながっていなければなりません。'],
    ['길 바꾸기 · E → 칸을 드래그 → E로 적용', 'Reshape the road · E → drag tiles → E to apply', '道を変える · E → マスをドラッグ → Eで適用'],
    ['악귀와 흑마술사가 자재(◆)를 흘렸습니다. 화살탑을 건설해보죠!', 'The brutes and warlocks dropped materials (◆). Let us raise an arrow tower!', '悪鬼と黒魔術師が資材(◆)を落としました。矢の塔を建てましょう!'],
    ['화살탑 건설 · D → 초록 칸 클릭', 'Build an Arrow Tower · D → click a green tile', '矢の塔を建設 · D → 緑のマスをクリック'],
    ['골드는 여러가지 강화에 사용할 수 있습니다.', 'Gold also pays for upgrades.', 'ゴールドはさまざまな強化にも使えます。'],
    ['악마는 다섯 번째 진격마다 군주가 함께 진격합니다.', 'Every fifth wave, a Demon Lord marches with them.', '五度目の進軍ごとに、デーモンロードが共に攻めてきます。'],
    ['군주가 나타났습니다! 전원 길목으로!', 'A Demon Lord! Everyone to the road!', 'デーモンロードです!全員、道へ!'],
    ['제가 알려 드릴 건 여기까지입니다.', 'That is all I have to teach you.', '私からお伝えできるのはここまでです。'],
    ['앞으로 잘 부탁드립니다. 사령관님.', 'I look forward to serving you, Commander.', 'これからよろしくお願いします、司令官。'],
    // ── 종족 소개 ──
    ['또 뵙네요, 사령관님. 인간족은 건물이 저렴하고 단단합니다.', 'We meet again, Commander. Human buildings are cheap and sturdy.', 'またお会いしましたね、司令官。人間族の建物は安く、頑丈です。'],
    ['병영에서 궁병, 대장간에서 기사가 나옵니다. 대장간을 건설하면 모든 병사의 칼도 날카로워집니다.', 'The barracks gives you archers, the forge knights. A forge also sharpens every blade you field.', '兵舎から弓兵、鍛冶場から騎士が出ます。鍛冶場を建てれば、全兵士の刃も鋭くなります。'],
    ['인간족은 특출난 능력은 없어도 빈틈이 없습니다. 탑과 방벽으로 길을 틀어쥐세요.', 'Humans excel at nothing and lack nothing. Lock down the road with towers and barricades.', '人間族に突出した力はありませんが、隙もありません。塔と防壁で道を押さえてください。'],
    ['기록관 발타르요. 우리는 수가 적고 값이 비싸오. 대신 하나가 여럿 몫을 하오.', 'Baltar, chronicler. We are few and we are costly. Each of us is worth many.', '記録官バルタルである。我らは数が少なく、値も張る。その代わり、一体が何体分もの働きをする。'],
    ['용은 적을 벨수록 강해지오. 죽이지 말고 오래 살려 두시오.', 'A dragon grows stronger with every kill. Keep them alive.', '竜は敵を斬るほど強くなる。死なせず、長く生かしておかれよ。'],
    ['부화장에서 드레이크, 둥지에서 와이번이 나오오. 와이번은 악마 쉰을 잡아야 깨어나오.', 'The hatchery yields drakes, the nest wyverns. A wyvern wakes only after fifty demons lie dead.', '孵化場からドレイク、巣からワイバーンが出る。ワイバーンは悪魔を五十体倒さねば目覚めぬ。'],
    ['그레이다. 수인은 싸고 빠르다. 머릿수가 힘이지.', 'Grey. Beastfolk are cheap and fast. Numbers are our strength.', 'グレイだ。獣人は安くて速い。数こそ力だ。'],
    ['옆에 동족이 많을수록 더 세게 문다. 코볼트는 아끼지 마.', 'The bigger the pack, the harder we bite. Don\'t hold back the kobolds.', '仲間が多いほど強く噛みつく。コボルトは惜しむな。'],
    ['늑대전사는 사냥굴에 코볼트 다섯이 살아 있어야 나온다. 북을 세우면 더 빨리 문다.', 'Wolf warriors need a den and five living kobolds. Put up a drum and we bite faster.', '狼戦士は巣穴があって、コボルトが五体生きていれば出せる。太鼓を置けばもっと速く噛む。'],
    ['베릴이에요. 정령은 다 멀리서 싸워요. 몸은 약하고요.', 'I\'m Beryl. Spirits all fight from afar. We\'re fragile, though.', 'ベリルです。精霊はみんな遠くから戦います。体は弱いんですけどね。'],
    ['상위 등급 정령은 하위 등급 정령 둘을 합쳐서 불러요. 하급정령을 넉넉히 두세요.', 'A higher spirit is called by fusing two lower ones. Keep plenty of lesser spirits around.', '上位の精霊は、下位の精霊を二体合わせて呼びます。下級精霊を多めに置いてくださいね。'],
    ['자재는 저절로 차올라요. 수정탑에 쓰세요. 길은 길수록 좋아요.', 'Materials well up on their own. Spend them on crystal spires. And the longer the road, the better.', '資材はひとりでに溜まります。水晶塔に使ってください。道は長いほどいいですよ。'],
    ['마레아랍니다. 어인은 잘 죽지 않는답니다. 가만있어도 상처가 아물거든요.', 'I am Marea, dear. Merfolk do not die easily. Our wounds close on their own, you see.', 'マレアですのよ。魚人はなかなか死にませんの。じっとしていても傷がふさがりますからね。'],
    ['주술사가 아군을 고치고, 웅덩이 옆에서는 더 빨리 낫지요.', 'Our shamans mend the others, and by a tide pool they heal faster still.', '呪術師が味方を癒やし、潮だまりのそばではもっと早く治りますわ。'],
    ['심해 거인은 균열 하나에 웅덩이 둘이 있어야 올라온답니다. 서두르지 말고 버티세요.', 'A deep giant rises only with a rift and two pools. No need to hurry, dear. Hold on.', '深海の巨人は、裂け目が一つと潮だまりが二つあって初めて上がってきますの。焦らず、こらえてくださいね。'],
    ['왕국의 지하 요새입니다. 돌과 강철뿐인 곳이죠.', 'The Royal Undercroft. Nothing here but stone and steel.', '王国の地下要塞です。石と鋼しかない場所ですよ。'],
    ['불타는 심연이오. 무른 것부터 녹소.', 'The Burning Abyss. The soft melt first.', '燃える深淵である。柔いものから溶ける。'],
    ['송곳니 황야다. 느린 놈은 여기서 죽는다.', 'The Fang Wastes. The slow die here.', '牙の荒野だ。遅い奴はここで死ぬ。'],
    ['고대의 숲이에요. 뿌리가 낯선 발을 잡아요.', 'The Ancient Forest. The roots catch unfamiliar feet.', '古の森です。根が、よそ者の足をつかむんです。'],
    ['수몰된 회랑이랍니다. 물이 낯설면 몸이 무겁지요.', 'The Drowned Halls, dear. If you are a stranger to water, your body will feel heavy.', '水没の回廊ですのよ。水に慣れていないと、体が重くなりますわ。'],
    // ── 패배 팁·경고 ──
    ['길 편집(E)으로 길을 구불구불하게 늘이면 악마가 탑 앞을 오래 지나갑니다.', 'Wind the road with the path editor (E) and demons spend longer under your towers.', '道の編集(E)で道をくねくねと伸ばせば、悪魔が塔の前を長く通ります。'],
    ['벽 타일은 흑마술사의 사격도 막습니다. 탑 앞에 벽을 두면 탑이 오래 버팁니다.', 'Wall tiles stop warlock fire too. A wall in front of a tower keeps it standing longer.', '壁マスは黒魔術師の射撃も防ぎます。塔の前に壁を置けば、塔が長持ちします。'],
    ['거점(보라색 단) 위 건물은 체력이 25% 더 높습니다. 해금 건물은 거점에 세우세요.', 'Buildings on a platform (the purple dais) have 25% more HP. Put your unlock buildings there.', '拠点(紫の台)の上の建物は耐久が25%高くなります。解放用の建物は拠点に建てましょう。'],
    ['탑은 심장에 가장 가까이 온 악마부터 쏩니다. 심장 가까운 길목에 탑을 모아 두세요.', 'Towers shoot the demon closest to the Heart first. Cluster them near the last stretch of road.', '塔は心臓に最も近い悪魔から撃ちます。心臓に近い道に塔を集めましょう。'],
    ['방벽(F)은 길 위에 세워 악마를 붙잡아 둡니다. 탑의 사거리 안에 세우면 효과가 큽니다.', 'Barricades (F) go on the road and hold demons in place. They work best inside tower range.', '防壁(F)は道の上に建てて悪魔を足止めします。塔の射程内に置くと効果的です。'],
    ['인구가 차면 약한 유닛을 골라 해산하고 상위 유닛으로 바꾸세요.', 'When you hit the population cap, dismiss weak units and replace them with stronger ones.', '人口が上限に達したら、弱いユニットを解散して上位ユニットに入れ替えましょう。'],
    ['전장이 비면 N으로 다음 웨이브를 앞당길 수 있습니다. 앞당긴 만큼 보너스 골드가 들어옵니다.', 'When the field is clear, press N to call the next wave early. The earlier you call, the bigger the gold bonus.', '戦場が空になったら、Nで次のウェーブを前倒しできます。早めた分だけボーナスゴールドが入ります。'],
    ['영구 강화는 종족마다 따로 쌓입니다. 영혼석을 모아 체력·공격부터 올리세요.', 'Permanent upgrades are kept per race. Save soul shards and raise HP and ATK first.', '永久強化は種族ごとに別々です。魂石を集めて、まずHPと攻撃を上げましょう。'],
    ['다섯 번째 웨이브마다 악마 군주가 옵니다. 그 전에 제단을 강화하고 영웅을 불러 두세요.', 'A Demon Lord comes every fifth wave. Upgrade the altar and summon a hero before then.', '5ウェーブごとにデーモンロードが来ます。その前に祭壇を強化し、英雄を呼んでおきましょう。'],
    ['심장이 곧 무너집니다! 어서 병력을 소환하거나 방벽을 세우세요!', 'The Heart is about to fall! Summon troops or raise a barricade, now!', '心臓がもうすぐ崩れます!急いで兵を召喚するか、防壁を建ててください!'],
    ['악마성입니다. 악마성에서는 그 어떤 종족도 제 능력을 발휘하지 못합니다.', 'The Demon Castle. No race fights at its full strength here.', '悪魔城です。ここでは、どの種族も本来の力を出せません。'],
    // ── 규칙 알림 ──
    ['격자 크기가 다릅니다', 'Grid size mismatch', 'マス目の大きさが違います'], ['바꿀 수 없는 칸', 'This tile cannot be changed', '変更できないマスです'],
    ['입구는 길이어야 한다', 'The entrance must be a road', '入口は道でなければなりません'],
    ['입구와 심장은 이어져 있어야 합니다.', 'The entrance and the Heart must be connected.', '入口と心臓はつながっていなければなりません。'],
    ['건물 아래 칸은 바꿀 수 없습니다', 'Tiles under a building cannot be changed', '建物の下のマスは変更できません'],
    ['악마가 서 있는 길도 심장과 이어져 있어야 합니다', 'Roads with demons on them must also reach the Heart', '悪魔が立っている道も、心臓につながっていなければなりません'],
    ['지을 수 없는 위치', 'Cannot build here', 'ここには建てられません'], ['건물이 있는 칸', 'There is a building here', '建物があるマスです'],
    ['방벽은 길 위에만 세울 수 있습니다', 'Barricades can only be built on roads', '防壁は道の上にしか建てられません'],
    ['입구는 못 막는다', 'The entrance cannot be blocked', '入口はふさげません'], ['길 위에는 방벽만', 'Only barricades go on roads', '道の上には防壁だけ'],
    ['벽 위에는 못 짓는다', 'Cannot build on a wall', '壁の上には建てられません'], ['벽 위에는 세울 수 없습니다', 'Cannot be placed on a wall', '壁の上には置けません'],
    ['지금은 안 된다', 'Not now', '今はできません'], ['인구 한도', 'Population cap reached', '人口が上限です'], ['자원 부족', 'Not enough resources', '資源が足りません'],
    ['건물 한도', 'Building limit reached', '建物が上限です'], ['악마가 서 있는 길', 'There are demons on this road', '悪魔が立っている道です'], ['유닛이 서 있는 칸', 'A unit is standing here', 'ユニットが立っているマスです'],
    ['전장에 악마가 남아 있습니다', 'Demons remain on the field', '戦場に悪魔が残っています'],
    ['해산할 유닛이 없습니다(영웅은 해산 불가)', 'No units to dismiss (heroes cannot be dismissed)', '解散できるユニットがいません(英雄は解散不可)'],
    ['최대 레벨', 'Max level', '最大レベル'], ['영웅 소환 대기 중', 'Hero summon not ready', '英雄召喚は待機中です'], ['보낼 수 없는 곳', 'Cannot send there', 'そこには送れません'], ['선택된 유닛 없음', 'No units selected', 'ユニットが選ばれていません'],
    ['없음', 'None', 'なし'], ['포기하고 나갈까요?', 'Give up and leave?', 'あきらめて退出しますか?'], ['내 요새에서만 조작', 'You can only command your own fortress', '自分の要塞でのみ操作できます'],
    // ── 메뉴 ──
    ['보정 없음', 'No modifiers', '補正なし'], ['· 데모', '· Demo', '· 体験版'], ['전쟁 자금 ●', 'War chest ●', '軍資金 ●'], ['(다음 출전에 지급)', '(paid at your next battle)', '(次の出撃で支給)'],
    ['멀티 (AI 동맹)', 'Allied (AI)', 'マルチ (AI同盟)'], ['솔로', 'Solo', 'ソロ'], ['· 스테이지', '· Stage', '· ステージ'], ['스테이지', 'Stages', 'ステージ'],
    ['정식 버전에서', 'In the full game', '製品版で'], ['잠김', 'Locked', 'ロック'], ['· 악마 ×', '· Demons ×', '· 悪魔 ×'], ['✔ 클리어', '✔ Cleared', '✔ クリア'], ['최고 웨이브', 'Best wave', '最高ウェーブ'],
    ['영구 강화', 'Permanent Upgrades', '永久強化'], ['출전', 'To Battle', '出撃'], ['이야기', 'Story', '物語'], ['튜토리얼', 'Tutorial', 'チュートリアル'], ['⚙ 설정', '⚙ Settings', '⚙ 設定'], ['설정', 'Settings', '設定'], ['조작법', 'Controls', '操作方法'],
    ['클릭·드래그 선택(더블클릭 같은 유닛, Ctrl+A 전체) → 바닥 클릭 배치 · Q W R Y 소환 · T 영웅 · X 영웅 기술 · B V 조합 · 소환소나 제단을 누르면 집결지 지정', 'Click or drag to select (double-click: same type, Ctrl+A: all) → click the ground to post them · Q W R Y summon · T hero · X hero skills · B V merge · click the Summoning Circle or Altar to set a rally point', 'クリック·ドラッグで選択(ダブルクリックで同種、Ctrl+Aで全員) → 地面クリックで配置 · Q W R Y 召喚 · T 英雄 · X 英雄スキル · B V 合成 · 召喚陣か祭壇を押すと集合地点を指定'],
    ['A S D F G → 칸 클릭(Shift 연속) · 건물은 바닥, 방벽은 길 위 · H J 함정 · 거점 위는 체력 +25% · 고른 건물 Del 철거', 'A S D F G → click a tile (Shift: keep building) · buildings on floor, barricades on roads · H J traps · +25% HP on platforms · Del demolishes the selected building', 'A S D F G → マスをクリック(Shiftで連続) · 建物は床、防壁は道の上 · 拠点の上は耐久+25% · 選んだ建物はDelで撤去'],
    ['E (Z 길, X 벽, C 지우기, 우클릭 지우기, Ctrl+Z 되돌리기) · 길 최대', 'E (Z road, X wall, C erase, right-click erase, Ctrl+Z undo) · up to', 'E (Z 道, X 壁, C 消去, 右クリックで消去, Ctrl+Z 元に戻す) · 道は最大'],
    [', 벽 최대', ' road tiles,', '、壁は最大'], ['· 입구↔심장 연결 필수', 'wall tiles · the entrance must reach the Heart', '· 入口↔心臓の接続が必須'],
    ['1 2 3 속도 · Space 일시정지 · N 다음 웨이브(보너스 골드) · Tab 지도 · Esc 취소 · 한글 입력 상태에서도 단축키가 듣는다', '1 2 3 speed · Space pause · N next wave (bonus gold) · Tab map · Esc cancel', '1 2 3 速度 · Space 一時停止 · N 次のウェーブ(ボーナスゴールド) · Tab 地図 · Esc キャンセル · 日本語入力中でもショートカットが効く'],
    ['기타', 'Other', 'その他'], ['종족 선택', 'Choose a Race', '種族選択'], ['종족', 'Race', '種族'],
    // ── 진행 ──
    ['· 클릭 또는 Space ▸', '· Click or Space ▸', '· クリックまたはSpace ▸'], ['안내 끄기', 'Turn off guidance', '案内をオフ'], ['목표', 'Goal', '目標'],
    ['게임 시작', 'Start Game', 'ゲーム開始'], ['건너뛰기', 'Skip', 'スキップ'], ['다음 ▸', 'Next ▸', '次へ ▸'], ['시작', 'Begin', '開始'], ['영웅 합류', 'A hero joins you', '英雄が加わった'],
    ['마지막 웨이브', 'Final wave', '最終ウェーブ'], ['기다리지 않고 끝내기', 'End without waiting', '待たずに終了'], ['다음 웨이브 부르기', 'Call next wave', '次のウェーブを呼ぶ'],
    ['단축키 Space · 멈춘 동안에도 소환·건설·길 편집을 할 수 있다', 'Hotkey Space · you can still summon, build and edit paths while paused', 'ショートカット Space · 停止中も召喚·建設·道の編集ができる'],
    ['배경음악·효과음 음량, 피격 번쩍임 · Esc', 'Music and sound volume, hit flash · Esc', 'BGM·効果音の音量、被弾フラッシュ · Esc'],
    ['이번 판을 포기한다(보상 없음)', 'Abandon this battle (no rewards)', 'この戦いをあきらめる(報酬なし)'],
    ['Ⅱ 일시정지', 'Ⅱ Paused', 'Ⅱ 一時停止'], ['일시정지', 'Pause', '一時停止'], ['Space · 다시 누르면 계속', 'Space · press again to resume', 'Space · もう一度押すと再開'],
    ['배속', '× speed', '倍速'], ['단축키', 'Hotkey', 'ショートカット'], ['나가기', 'Quit', '退出'], ['함락', 'Fallen', '陥落'],
    // ── 길 편집 ──
    ['길 편집 · 게임 멈춤', 'Path Editor · game paused', '道の編集 · ゲーム停止中'], ['길 편집', 'Paths', '道編集'], ['적용하고 계속', 'Apply and resume', '適用して再開'], ['적용', 'Apply', '適用'],
    ['조건이 맞습니다', 'All conditions met', '条件を満たしています'], ['게임을 멈추고 길과 벽을 고친다', 'Pause the game and reshape roads and walls', 'ゲームを止めて道と壁を直す'],
    ['· 악마 경로', '· Demon path', '· 悪魔の経路'], ['악마 경로', 'Demon path', '悪魔の経路'],
    ['길 깔기', 'Road', '道を敷く'], ['악마가 걷는 칸을 만든다', 'Lays tiles the demons walk on', '悪魔が歩くマスを作る'],
    ['벽 쌓기', 'Wall', '壁を積む'], ['통과와 사격을 막는 칸', 'Blocks movement and shots', '通行と射撃を防ぐマス'],
    ['지우기', 'Erase', '消去'], ['바닥으로 되돌린다 · 우클릭으로도 지운다', 'Turns a tile back into floor · right-click also erases', '床に戻す · 右クリックでも消せる'],
    ['기본 길', 'Reset', '基本の道'], ['ㄹ 모양으로 되돌린다', 'Restores the default winding road', '基本のジグザグ道に戻す'],
    ['되돌리기', 'Undo', '元に戻す'], ['마지막으로 칠한 것을 되돌린다 · Ctrl+Z', 'Undoes the last stroke · Ctrl+Z', '最後に塗ったものを戻す · Ctrl+Z'],
    ['취소', 'Cancel', 'キャンセル'], ['고친 것을 버리고 나간다', 'Discards your changes and exits', '変更を捨てて戻る'], ['✔ E로 적용', '✔ Press E to apply', '✔ Eで適用'],
    // ── 패널·정보 줄 ──
    ['· 보유', '· Owned', '· 所持'], ['· 사거리', '· Range', '· 射程'], ['· 치유', '· Heal', '· 回復'], ['· 범위', '· Area', '· 範囲'], ['· 간격', '· Interval', '· 間隔'], ['· 원거리', '· Ranged', '· 遠距離'], ['· 처치', '· Kills', '· 撃破'],
    ['준비!', 'Ready!', '準備OK'], ['영웅 소환 준비 · T', 'Hero ready · T', '英雄召喚の準備完了 · T'], ['영웅 소환', 'Summon Hero', '英雄召喚'], ['누가 올지는 모른다', 'No telling who will come', '誰が来るかはわからない'],
    ['길 위에만 세운다 · 악마를 붙잡아 둔다', 'Built on roads only · holds demons in place', '道の上にのみ建てる · 悪魔を足止めする'], ['바닥에 세운다', 'Built on floor tiles', '床に建てる'],
    ['강화하면 등급↑ 대기↓', 'Upgrading raises hero grades and shortens the wait', '強化で等級↑ 待機↓'], ['영웅 제단', 'Hero Altar', '英雄の祭壇'], ['소환소', 'Summoning Circle', '召喚陣'],
    ['유닛 소환', 'Summon', 'ユニット召喚'], ['건물 · 바닥에', 'Buildings · on floor', '建物 · 床に'], ['길 · 방벽과 함정은 길 위에', 'Paths · Barricades · Traps', '道 · 防壁と罠は道の上'], ['강화', 'Upgrades', '強化'],
    ['칸이나 전장의 유닛·악마·건물에 마우스를 올리면 설명', 'Hover a slot, or a unit, demon or building on the field, for details', 'スロットや戦場のユニット·悪魔·建物にカーソルを置くと説明'],
    ['유닛 선택 → 바닥 클릭으로 배치 · 더블클릭으로 같은 유닛 모두 선택 · 소환소를 누르면 집결지', 'Select units → click the ground to post them · double-click selects all of a type · click the Summoning Circle to set a rally point', 'ユニット選択 → 地面クリックで配置 · ダブルクリックで同種を全選択 · 召喚陣を押すと集合地点'],
    ['· 요새를 누르면 들어간다', '· click a fortress to enter', '· 要塞を押すと入る'], ['관전 중', '— spectating', 'を観戦中'], ['기본 배치로', 'Default formation', '基本配置に戻す'],
    ['초록 칸', 'Green tiles', '緑のマス'], ['(길 위)', ' (on roads)', '(道の上)'], ['(바닥)', ' (on floor)', '(床)'], ['을 클릭 · Shift 연속 · 우클릭 취소', ': click to build · Shift keeps building · right-click cancels', 'をクリック · Shiftで連続 · 右クリックで取消'],
    ['해산 (30% 환급)', 'Dismiss (30% refund)', '解散 (30%返還)'], ['철거 (50% 환급) · Del', 'Demolish (50% refund) · Del', '撤去 (50%返還) · Del'], ['지원군', 'reinforcements', 'の援軍'],
    // ── 알림 ──
    ['내 요새', 'My fortress', '自分の要塞'], ['악마 군주가 온다', 'A Demon Lord approaches', 'デーモンロードが来る'], ['악마 침공', 'Demons attack', '悪魔の侵攻'],
    ['악마가 남은 요새로 몰려온다', 'The demons turn on the remaining fortresses', '悪魔が残りの要塞へ押し寄せる'],
    ['웨이브를 앞당겼다 · 보너스 ●', 'Wave called early · bonus ●', 'ウェーブを前倒し · ボーナス ●'], ['새 악마 ·', 'New demon ·', '新たな悪魔 ·'],
    ['심장이 위험합니다! 병력을 심장 앞으로', 'The Heart is in danger! Pull your troops back to it', '心臓が危険です!兵を心臓の前へ'], ['· N으로 다음 웨이브 (+●', '· N for the next wave (+●', '· Nで次のウェーブ (+●'],
    ['튜토리얼 완료 보상 · 전쟁 자금 ●', 'Tutorial reward · War chest ●', 'チュートリアル完了報酬 · 軍資金 ●'], ['이끌 종족을 고르십시오, 사령관.', 'Choose the race you will lead, Commander.', '率いる種族をお選びください、司令官。'],
    ['데모는 여기까지. 다른 종족도 기다립니다.', 'That is the end of the demo. The other races await.', '体験版はここまで。他の種族も待っています。'], ['해금 ·', 'Unlocked ·', '解放 ·'],
    // ── 결과·설정 ──
    ['승리', 'Victory', '勝利'], ['패배', 'Defeat', '敗北'], ['◈ 영혼석 +', '◈ Soul Shards +', '◈ 魂石 +'], ['영혼석 +', 'Soul Shards +', '魂石 +'], ['(보유', '(total', '(所持'], ['팁 ·', 'Tip ·', 'ヒント ·'],
    ['다음 스테이지 ▸', 'Next Stage ▸', '次のステージ ▸'], ['다음 스테이지', 'Next stage', '次のステージ'], ['다시 도전', 'Try Again', '再挑戦'], ['돌아가기', 'Back', '戻る'],
    ['배경음악', 'Music', 'BGM'], ['효과음', 'Sound', '効果音'], ['피격 번쩍임', 'Hit flash', '被弾フラッシュ'], ['켜짐', 'On', 'オン'], ['꺼짐', 'Off', 'オフ'], ['닫기 · Esc', 'Close · Esc', '閉じる · Esc'], ['언어', 'Language', '言語'], ['전체 화면', 'Fullscreen', '全画面'], ['처음부터 다시', 'Erase save data', 'セーブを消去'], ['모든 진행을 지우고 처음부터 다시 할까요?', 'Erase all progress and start over?', 'すべての進行を消して最初からやり直しますか?'], ['불러오는 중…', 'Loading…', '読み込み中…'], ['화면', 'Display', '画面'], ['저장', 'Save', 'セーブ'],
    // ── 짧은 낱말(낱말 경계에서만 바뀐다) ──
    ['공격', 'ATK', '攻撃'], ['체력', 'HP', 'HP'], ['이동', 'Speed', '移動'], ['건축', 'Build', '建築'], ['제단', 'Altar', '祭壇'], ['요새', 'Fortresses', '要塞'], ['유닛', 'Units', 'ユニット'], ['건물', 'Buildings', '建物'], ['영웅', 'Hero', '英雄'],
    ['최대', 'Max', '最大'], ['다음', 'Next', '次'], ['인구', 'Pop', '人口'], ['지도', 'Map', '地図'], ['대기', 'Wait', '待機'], ['웨이브', 'Waves', 'ウェーブ'], ['처치', 'Kills', '撃破'], ['시간', 'Time', '時間'], ['소환', 'Summons', '召喚'], ['심장', 'Heart', '心臓'],
    ['필요', 'required', '必要'], ['길', 'Road', '道'], ['벽', 'Wall', '壁'], ['나', 'Me', '自分'],
  ];

  // 숫자·이름이 끼는 문장. 사전보다 먼저 적용한다. [정규식, 영어, 일본어]
  const R = [
    [/ · 입구 (\d+)곳/, ' · $1 gates', ' · 入口$1か所'], [/입구 (\d+)/, '$1 gates', '入口$1'],
    [/(\d+)초 안에 격퇴/, 'Repel the wave within $1s', '$1秒以内に撃退'],
    [/같은 유닛 (\d+)기를 한 단계 위 유닛 하나로 합친다/, 'Merges $1 identical units into one of the next tier', '同じユニット$1体を一段上のユニット一体に合成する'],
    [/같은 유닛 (\d+)기가 필요합니다/, 'You need $1 identical units', '同じユニットが$1体必要です'],
    [/유닛을 골라 두면 그 종류를 합친다 · 최상위 (\d+)기는 전설 /, 'Select units to merge that type · $1 top-tier units make the legendary ', 'ユニットを選ぶとその種類を合成 · 最上位$1体で伝説の'],
    [/^(\d+)기 필요$/, 'Need $1', '$1体必要'],
    [/길은 (\d+)칸, 벽은 (\d+)칸까지 건설할 수 있습니다\. 벽은 악마들의 진격도, 화살도 막을 수 있습니다\. 잘 활용해보죠\./, 'You may lay up to $1 road tiles and $2 walls. A wall stops demons and arrows alike. Use them well.', '道は$1マス、壁は$2マスまで作れます。壁は悪魔の進軍も、矢も防ぎます。うまく使いましょう。'],
    [/(\d+)초 뒤 첫 침공/, 'First wave in $1s', '$1秒後に最初の侵攻'],
    [/길은 (\d+)칸까지/, 'Roads: up to $1 tiles', '道は$1マスまで'], [/벽은 (\d+)칸까지/, 'Walls: up to $1 tiles', '壁は$1マスまで'],
    [/길 타일 한도 초과 \((\d+)\)/, 'Too many road tiles (max $1)', '道マスが上限超過 ($1)'], [/벽 타일 한도 초과 \((\d+)\)/, 'Too many wall tiles (max $1)', '壁マスが上限超過 ($1)'],
    [/^(.+) (\d+)기 생존 필요$/, 'Needs $2 living $1', '$1が$2体生存している必要あり'], [/^(.+) (\d+)기 필요\(융합\)$/, 'Needs $2 $1 to fuse', '$1が$2体必要(融合)'],
    [/^(.+) (\d+)개 필요$/, 'Needs $2 × $1', '$1が$2つ必要'], [/^(.+) 필요$/, 'Requires $1', '$1が必要'], [/누적 처치 (\d+)\/(\d+)/, 'Kills $1/$2', '累計撃破 $1/$2'],
    [/유닛 (\d+)기 지원/, '$1 units sent', 'ユニット$1体を派遣'], [/웨이브 (\d+) 격퇴/, 'Wave $1 repelled', 'ウェーブ$1を撃退'],
    [/새로 오는 (영웅|유닛)이 모일 자리를 클릭/, 'Click where new $1 should gather', '新しく来る$1が集まる場所をクリック'],
    [/(\d+)배속/, '$1× speed', '$1倍速'],
  ];
  // 단위 붙은 숫자. 사전 다음에 적용한다(사전의 긴 문구가 먼저 맞도록)
  const RG = [
    [/(\d+)칸/, '$1 tiles', '$1マス'], [/\(지금 (\d+)\)/, ' (now $1)', '(現在 $1)'], [/(\d+)기당/, 'per $1', '$1体につき'], [/(\d+)기/, '$1', '$1体'], [/([\d.]+)초/, '$1s', '$1秒'],
  ];

  const HANGUL = /[가-힣ㄱ-ㅎ]/, esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const col = { en: 1, ja: 2 }, cache = { en: new Map(), ja: new Map() };
  // 긴 것부터 바꾼다. 두 글자 이하 낱말은 앞뒤가 한글이 아닐 때만(다른 낱말 속을 건드리지 않게)
  const rules = D.slice().sort((a, b) => b[0].length - a[0].length).map((e) => [new RegExp(e[0].length <= 2 ? '(?<![\\uac00-\\ud7a3])' + esc(e[0]) + '(?![\\uac00-\\ud7a3])' : esc(e[0]), 'g'), e]);
  DD.tr = function (text, lang) {
    lang = lang || DD.lang;
    const c = col[lang]; if (!c || !text || !HANGUL.test(text)) return text;
    const hit = cache[lang].get(text); if (hit !== undefined) return hit;
    let out = text;
    for (const r of R) out = out.replace(new RegExp(r[0].source, 'g'), r[c]);
    for (const [re, e] of rules) { if (!HANGUL.test(out)) break; out = out.replace(re, () => e[c]); }
    if (HANGUL.test(out)) for (const r of RG) out = out.replace(new RegExp(r[0].source, 'g'), r[c]);
    if (cache[lang].size > 4000) cache[lang].clear();
    cache[lang].set(text, out); return out;
  };
  DD.i18nStrings = (lang) => D.map((e) => e[col[lang]]).concat(R.concat(RG).map((r) => r[col[lang]])); // 글꼴 부분집합을 만들 때 쓴다

  if (typeof document === 'undefined') { DD.lang = 'ko'; return; }
  // ── 브라우저: 화면에 붙는 글을 지켜보다가 바꾼다. 원문은 노드에 남겨 두어 언어를 다시 바꿀 수 있다 ──
  const KEY = 'grigis_lang';
  const q = /[?&]lang=(ko|en|ja)/.exec(location.search), nav = (navigator.language || 'en').slice(0, 2);
  let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) { /* 저장 불가 환경 */ }
  DD.lang = (q && q[1]) || (DD.LANGS[saved] ? saved : DD.LANGS[nav] ? nav : 'en');
  function node(n) {
    if (n.nodeType === 3) { const src = n.__ko !== undefined && n.__out === n.nodeValue ? n.__ko : n.nodeValue; if (!HANGUL.test(src)) return; const out = DD.tr(src); n.__ko = src; n.__out = out; if (out !== n.nodeValue) n.nodeValue = out; }
    else if (n.nodeType === 1) {
      if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.dataset.noI18n !== undefined) return;
      if (n.title && (HANGUL.test(n.title) || n.__kt)) { const src = n.__kt && n.__ktOut === n.title ? n.__kt : n.title; n.__kt = src; n.__ktOut = DD.tr(src); if (n.title !== n.__ktOut) n.title = n.__ktOut; }
      for (let c = n.firstChild; c; c = c.nextSibling) node(c);
    }
  }
  function all() { document.documentElement.lang = DD.lang; node(document.documentElement); const t = document.querySelector('title'); if (t) node(t); }
  DD.setLang = function (l) { if (!DD.LANGS[l]) return; DD.lang = l; try { localStorage.setItem(KEY, l); } catch (e) { /* 무시 */ } all(); };
  new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') node(m.target); else if (m.type === 'attributes') node(m.target); else for (const n of m.addedNodes) node(n); } })
    .observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
})(typeof window !== 'undefined' ? window : globalThis);
