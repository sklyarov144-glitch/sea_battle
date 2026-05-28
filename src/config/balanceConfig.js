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

export const LEVELS = [
  {
    id: 1,
    name: 'Учебная бухта',
    botSkill: 0.36,
    botDelay: 720,
    eventGold: 35,
    minePenalty: 10,
    events: { chest: 3, barrel: 2, wreck: 3, vortex: 1, mine: 1 },
    rewards: { gold: 120, xp: 70, chest: 60 },
    consolation: { gold: 35, xp: 25 }
  },
  {
    id: 2,
    name: 'Пиратский залив',
    botSkill: 0.42,
    botDelay: 680,
    eventGold: 40,
    minePenalty: 12,
    events: { chest: 3, barrel: 2, wreck: 2, vortex: 1, mine: 1 },
    rewards: { gold: 150, xp: 85, chest: 70 },
    consolation: { gold: 40, xp: 28 }
  },
  {
    id: 3,
    name: 'Остров рифов',
    botSkill: 0.48,
    botDelay: 650,
    eventGold: 42,
    minePenalty: 15,
    events: { chest: 2, barrel: 2, wreck: 2, vortex: 2, mine: 1 },
    rewards: { gold: 180, xp: 95, chest: 80 },
    consolation: { gold: 45, xp: 30 }
  },
  {
    id: 4,
    name: 'Туманный пролив',
    botSkill: 0.54,
    botDelay: 620,
    eventGold: 45,
    minePenalty: 18,
    events: { chest: 2, barrel: 2, wreck: 2, vortex: 2, mine: 2 },
    rewards: { gold: 220, xp: 110, chest: 95 },
    consolation: { gold: 50, xp: 34 }
  },
  {
    id: 5,
    name: 'Форт корсаров',
    botSkill: 0.6,
    botDelay: 590,
    eventGold: 48,
    minePenalty: 20,
    events: { chest: 2, barrel: 1, wreck: 2, vortex: 2, mine: 2 },
    rewards: { gold: 260, xp: 125, chest: 110 },
    consolation: { gold: 55, xp: 38 }
  },
  {
    id: 6,
    name: 'Ледяные воды',
    botSkill: 0.66,
    botDelay: 560,
    eventGold: 52,
    minePenalty: 24,
    events: { chest: 2, barrel: 1, wreck: 1, vortex: 2, mine: 3 },
    rewards: { gold: 310, xp: 145, chest: 125 },
    consolation: { gold: 62, xp: 42 }
  },
  {
    id: 7,
    name: 'Вулканический архипелаг',
    botSkill: 0.72,
    botDelay: 530,
    eventGold: 58,
    minePenalty: 28,
    events: { chest: 1, barrel: 2, wreck: 1, vortex: 2, mine: 3 },
    rewards: { gold: 370, xp: 165, chest: 145 },
    consolation: { gold: 70, xp: 48 }
  },
  {
    id: 8,
    name: 'Залив кракена',
    botSkill: 0.78,
    botDelay: 500,
    eventGold: 62,
    minePenalty: 32,
    events: { chest: 1, barrel: 1, wreck: 1, vortex: 3, mine: 3 },
    rewards: { gold: 440, xp: 190, chest: 165 },
    consolation: { gold: 80, xp: 55 }
  },
  {
    id: 9,
    name: 'Проклятая гавань',
    botSkill: 0.84,
    botDelay: 470,
    eventGold: 68,
    minePenalty: 36,
    events: { chest: 1, barrel: 1, wreck: 1, vortex: 3, mine: 4 },
    rewards: { gold: 520, xp: 215, chest: 190 },
    consolation: { gold: 90, xp: 62 }
  },
  {
    id: 10,
    name: 'Флагман Черной Бороды',
    botSkill: 0.9,
    botDelay: 430,
    eventGold: 75,
    minePenalty: 45,
    events: { chest: 1, barrel: 1, wreck: 1, vortex: 4, mine: 4 },
    rewards: { gold: 650, xp: 260, chest: 240 },
    consolation: { gold: 110, xp: 75 }
  }
];

export const SHOP_ITEMS = [
  {
    id: 'radarCharge',
    name: '+1 заряд радара',
    description: 'Дополнительный скан 3x3 в следующем бою.',
    price: 120,
    type: 'consumable',
    ability: 'radar'
  },
  {
    id: 'barrageCharge',
    name: '+1 заряд залпа',
    description: 'Один дополнительный выстрел крестом.',
    price: 190,
    type: 'consumable',
    ability: 'barrage'
  },
  {
    id: 'torpedoCharge',
    name: '+1 заряд торпеды',
    description: 'Дополнительная атака по строке или колонке.',
    price: 220,
    type: 'consumable',
    ability: 'torpedo'
  },
  {
    id: 'shipSkinGoldCorsair',
    name: 'Скин корабля “Золотой корсар”',
    description: 'Золотые флаги и теплый оттенок кораблей.',
    price: 520,
    type: 'skin',
    skinGroup: 'ship',
    skinValue: 'goldCorsair'
  },
  {
    id: 'waterSkinTropical',
    name: 'Скин воды “Тропическое море”',
    description: 'Более яркий тропический оттенок моря.',
    price: 460,
    type: 'skin',
    skinGroup: 'water',
    skinValue: 'tropical'
  }
];
