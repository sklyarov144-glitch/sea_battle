export const BOARD_SIZE = 8;

export const CAPTAIN_XP_PER_LEVEL = 120;

export const DAILY_REWARD = {
  gold: 150
};

export const BASE_ABILITY_CHARGES = {
  radar: 2,
  barrage: 1,
  torpedo: 1
};

export const CAMPAIGN_LEVEL_COUNT = 50;

export const CHAPTERS = [
  {
    id: 'chapter_1',
    title: 'Учебная бухта',
    subtitle: 'Первые походы, простые капитаны и безопасные воды.',
    mentorId: 'admiral',
    theme: 'training_bay',
    levelRange: [1, 10],
    baseRewardGold: 40,
    baseRewardXp: 20,
    difficultyRange: [0.34, 0.52]
  },
  {
    id: 'chapter_2',
    title: 'Рифовые воды',
    subtitle: 'Узкие проходы, коралловые засады и более цепкий соперник.',
    mentorId: 'navigator',
    theme: 'reef_waters',
    levelRange: [11, 20],
    baseRewardGold: 120,
    baseRewardXp: 60,
    difficultyRange: [0.5, 0.66]
  },
  {
    id: 'chapter_3',
    title: 'Огненный пролив',
    subtitle: 'Вулканические берега и первые особые условия операций.',
    mentorId: 'engineer',
    theme: 'fire_strait',
    levelRange: [21, 30],
    baseRewardGold: 240,
    baseRewardXp: 110,
    difficultyRange: [0.62, 0.76]
  },
  {
    id: 'chapter_4',
    title: 'Северный шторм',
    subtitle: 'Долгие бои, холодные воды и сильные капитаны.',
    mentorId: 'corsair',
    theme: 'northern_storm',
    levelRange: [31, 40],
    baseRewardGold: 420,
    baseRewardXp: 170,
    difficultyRange: [0.72, 0.84]
  },
  {
    id: 'chapter_5',
    title: 'Флот Черной Бороды',
    subtitle: 'Финальные операции против элитного флота.',
    mentorId: 'strategist',
    theme: 'blackbeard_fleet',
    levelRange: [41, 50],
    baseRewardGold: 650,
    baseRewardXp: 240,
    difficultyRange: [0.82, 0.94]
  }
];

const LEVEL_NAMES_BY_CHAPTER = [
  [
    'Учебная бухта',
    'Пиратский залив',
    'Остров рифов',
    'Туманный пролив',
    'Форт корсаров',
    'Старая верфь',
    'Залив контрабандистов',
    'Маяк новичков',
    'Тихая лагуна',
    'Первый флагман'
  ],
  [
    'Рифовый проход',
    'Затонувшие мачты',
    'Коралловая засада',
    'Песчаная отмель',
    'Лабиринт лагун',
    'Сторожевые скалы',
    'Бухта жемчуга',
    'Разбитый конвой',
    'Зубы прилива',
    'Крепость рифов'
  ],
  [
    'Огненный пролив',
    'Пепельный фарватер',
    'Батареи вулкана',
    'Лава у причала',
    'Дымные берега',
    'Кратерный рейд',
    'Пылающий архипелаг',
    'Черный песок',
    'Горячий горизонт',
    'Сердце вулкана'
  ],
  [
    'Северный шторм',
    'Ледяная блокада',
    'Полярная гавань',
    'Снежный конвой',
    'Фьорд безмолвия',
    'Морозный дозор',
    'Штормовая завеса',
    'Белые мачты',
    'Залив айсбергов',
    'Северная цитадель'
  ],
  [
    'Тень Черной Бороды',
    'Черные паруса',
    'Адмиральская дуэль',
    'Осада флагмана',
    'Проклятая эскадра',
    'Золотая блокада',
    'Капкан стратега',
    'Последний пролив',
    'Корабли легенды',
    'Последний флагман'
  ]
];

const MODIFIERS_BY_CHAPTER = [
  ['none', 'treasure_bonus'],
  ['fog', 'treasure_bonus'],
  ['fog', 'storm', 'mines'],
  ['storm', 'mines', 'limited_abilities'],
  ['elite_enemy', 'storm', 'mines', 'limited_abilities']
];

const REWARD_RANGES = [
  { gold: [40, 120], xp: [20, 60] },
  { gold: [120, 240], xp: [60, 110] },
  { gold: [240, 420], xp: [110, 170] },
  { gold: [420, 650], xp: [170, 240] },
  { gold: [650, 1000], xp: [240, 350] }
];

const STANDARD_FLEET = [
  { length: 4, count: 1 },
  { length: 3, count: 1 },
  { length: 2, count: 1 },
  { length: 1, count: 2 }
];

const REINFORCED_FLEET = [
  { length: 4, count: 1 },
  { length: 3, count: 1 },
  { length: 2, count: 2 },
  { length: 1, count: 2 }
];

function lerp([from, to], progress) {
  return from + (to - from) * progress;
}

function getBoardSize(chapterIndex, levelInChapter) {
  if (chapterIndex === 0) {
    return 8;
  }
  if (chapterIndex === 1) {
    return levelInChapter <= 5 ? 8 : 9;
  }
  if (chapterIndex === 2) {
    return 9;
  }
  if (chapterIndex === 3) {
    return levelInChapter <= 5 ? 9 : 10;
  }
  return 10;
}

function getModifiers(chapterIndex, levelInChapter) {
  if (levelInChapter <= 2) {
    return ['none'];
  }

  const pool = MODIFIERS_BY_CHAPTER[chapterIndex];
  const first = pool[levelInChapter % pool.length];
  const second = levelInChapter >= 8 ? pool[(levelInChapter + 1) % pool.length] : null;
  return [...new Set([first, second].filter(Boolean))];
}

export function generateCampaignLevels() {
  return CHAPTERS.flatMap((chapter, chapterIndex) => {
    const rewardRange = REWARD_RANGES[chapterIndex];
    return Array.from({ length: 10 }, (_, index) => {
      const levelInChapter = index + 1;
      const id = chapter.levelRange[0] + index;
      const chapterProgress = index / 9;
      const globalProgress = (id - 1) / (CAMPAIGN_LEVEL_COUNT - 1);
      const botSkill = Number(lerp(chapter.difficultyRange, chapterProgress).toFixed(2));
      const gold = Math.round(lerp(rewardRange.gold, chapterProgress));
      const xp = Math.round(lerp(rewardRange.xp, chapterProgress));
      const fleet = chapterIndex >= 1 && levelInChapter >= 7 ? REINFORCED_FLEET : STANDARD_FLEET;

      return {
        id,
        chapterId: chapter.id,
        chapterIndex: chapterIndex + 1,
        levelInChapter,
        name: LEVEL_NAMES_BY_CHAPTER[chapterIndex][index],
        description: `${chapter.subtitle} Операция ${levelInChapter}/10.`,
        boardSize: getBoardSize(chapterIndex, levelInChapter),
        botSkill,
        botDelay: Math.round(900 - globalProgress * 420),
        rewards: { gold, xp, chest: Math.round(gold * 0.35) },
        enemyFleet: fleet,
        playerFleet: STANDARD_FLEET,
        modifiers: getModifiers(chapterIndex, levelInChapter),
        unlockRequirement: id === 1 ? null : { levelCompleted: id - 1 },
        mentorId: chapter.mentorId,
        theme: chapter.theme,
        eventGold: 0,
        minePenalty: 0,
        events: {},
        consolation: {
          gold: Math.max(10, Math.round(gold * 0.18)),
          xp: Math.max(5, Math.round(xp * 0.25))
        }
      };
    });
  });
}

export const LEVELS = generateCampaignLevels();

export const SHOP_ITEMS = [
  {
    id: 'radarCharge',
    price: 120,
    type: 'consumable',
    ability: 'radar',
    inventoryKey: 'radar'
  },
  {
    id: 'salvoCharge',
    price: 160,
    type: 'consumable',
    ability: 'barrage',
    inventoryKey: 'salvo'
  },
  {
    id: 'torpedoCharge',
    price: 220,
    type: 'consumable',
    ability: 'torpedo',
    inventoryKey: 'torpedo'
  },
  {
    id: 'radarLevel',
    type: 'upgrade',
    upgradeId: 'radarLevel'
  },
  {
    id: 'salvoLevel',
    type: 'upgrade',
    upgradeId: 'salvoLevel'
  },
  {
    id: 'torpedoLevel',
    type: 'upgrade',
    upgradeId: 'torpedoLevel'
  },
  {
    id: 'goldBonusLevel',
    type: 'upgrade',
    upgradeId: 'goldBonusLevel'
  },
  {
    id: 'xpBonusLevel',
    type: 'upgrade',
    upgradeId: 'xpBonusLevel'
  }
];
