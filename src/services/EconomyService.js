import { LEVELS } from '../config/balanceConfig.js';

export const UPGRADE_PRICES = [250, 500, 1000, 1800, 3200];

export const ECONOMY_UPGRADES = [
  { id: 'radarLevel', legacyId: 'radarChargeUpgrade' },
  { id: 'salvoLevel', legacyId: 'salvoChargeUpgrade' },
  { id: 'torpedoLevel', legacyId: 'torpedoChargeUpgrade' },
  { id: 'goldBonusLevel', legacyId: 'bonusGoldUpgrade' },
  { id: 'xpBonusLevel', legacyId: 'bonusXpUpgrade' }
];

export const RANKS = [
  { id: 'sailor', title: 'Матрос', xpRequired: 0, rewardGold: 0 },
  { id: 'senior_sailor', title: 'Старший матрос', xpRequired: 100, rewardGold: 50 },
  { id: 'boatswain', title: 'Боцман', xpRequired: 260, rewardGold: 75 },
  { id: 'warrant', title: 'Мичман', xpRequired: 520, rewardGold: 100 },
  { id: 'lieutenant', title: 'Лейтенант', xpRequired: 900, rewardGold: 130 },
  { id: 'captain_lieutenant', title: 'Капитан-лейтенант', xpRequired: 1400, rewardGold: 170 },
  { id: 'captain', title: 'Капитан', xpRequired: 2050, rewardGold: 210 },
  { id: 'commodore', title: 'Командор', xpRequired: 2850, rewardGold: 250 },
  { id: 'rear_admiral', title: 'Контр-адмирал', xpRequired: 3800, rewardGold: 300 },
  { id: 'admiral', title: 'Адмирал', xpRequired: 5000, rewardGold: 300 }
];

export function createDefaultUpgrades() {
  return ECONOMY_UPGRADES.reduce((upgrades, upgrade) => {
    upgrades[upgrade.id] = 0;
    return upgrades;
  }, {});
}

export function createDefaultInventory() {
  return { radar: 0, salvo: 0, torpedo: 0 };
}

function clampLevel(level) {
  return Math.max(0, Math.min(5, Number(level) || 0));
}

function withPercentBonus(value, bonusLevel) {
  return Math.round(value * (1 + clampLevel(bonusLevel) * 0.05));
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randomAbility() {
  return ['radar', 'salvo', 'torpedo'][randomInt(0, 2)];
}

export function getRankByXp(xp = 0) {
  return RANKS.reduce((current, rank) => xp >= rank.xpRequired ? rank : current, RANKS[0]);
}

export function getNextRankProgress(xp = 0) {
  const rankIndex = RANKS.findIndex((rank) => rank.id === getRankByXp(xp).id);
  const current = RANKS[Math.max(0, rankIndex)];
  const next = RANKS[Math.min(RANKS.length - 1, rankIndex + 1)];
  if (next.id === current.id) {
    return { current, next, progress: 1 };
  }
  return {
    current,
    next,
    progress: Math.max(0, Math.min(1, (xp - current.xpRequired) / (next.xpRequired - current.xpRequired)))
  };
}

export function calculateVictoryReward(level, profile) {
  return {
    gold: withPercentBonus(level?.rewards?.gold ?? 40, profile?.upgrades?.goldBonusLevel),
    xp: withPercentBonus(level?.rewards?.xp ?? 20, profile?.upgrades?.xpBonusLevel)
  };
}

export function calculateDefeatReward(level, profile) {
  const percent = 0.1 + Math.random() * 0.1;
  return {
    gold: withPercentBonus(Math.max(10, Math.round((level?.rewards?.gold ?? 40) * percent)), profile?.upgrades?.goldBonusLevel),
    xp: withPercentBonus(Math.max(5, Math.round((level?.rewards?.xp ?? 20) * percent)), profile?.upgrades?.xpBonusLevel)
  };
}

export function calculateDailyChestReward(profile) {
  const streak = profile?.dailyReward?.dailyStreak ?? 0;
  const multiplier = 1 + Math.min(streak, 7) * 0.05;
  const ability = Math.random() < 0.25 ? randomAbility() : null;
  return {
    gold: withPercentBonus(Math.round(randomInt(100, 180) * multiplier), profile?.upgrades?.goldBonusLevel),
    xp: withPercentBonus(Math.round(randomInt(15, 35) * multiplier), profile?.upgrades?.xpBonusLevel),
    ability,
    abilityCount: ability ? 1 : 0
  };
}

export function calculateRareChestReward(profile) {
  const abilityCount = randomInt(1, 3);
  const abilities = Array.from({ length: abilityCount }, () => randomAbility());
  return {
    gold: withPercentBonus(randomInt(250, 500), profile?.upgrades?.goldBonusLevel),
    xp: withPercentBonus(randomInt(50, 100), profile?.upgrades?.xpBonusLevel),
    abilities
  };
}

export const EconomyService = {
  normalize(profile) {
    profile.inventory = {
      ...createDefaultInventory(),
      ...(profile.inventory ?? {})
    };
    profile.inventory.radar += Number(profile.purchasedItems?.radarCharge ?? 0);
    profile.inventory.salvo += Number(profile.purchasedItems?.barrageCharge ?? profile.purchasedItems?.salvoCharge ?? 0);
    profile.inventory.torpedo += Number(profile.purchasedItems?.torpedoCharge ?? 0);
    if (profile.purchasedItems) {
      profile.purchasedItems.radarCharge = 0;
      profile.purchasedItems.barrageCharge = 0;
      profile.purchasedItems.salvoCharge = 0;
      profile.purchasedItems.torpedoCharge = 0;
    }

    const defaults = createDefaultUpgrades();
    profile.upgrades = { ...defaults, ...(profile.upgrades ?? {}) };
    ECONOMY_UPGRADES.forEach(({ id, legacyId }) => {
      profile.upgrades[id] = clampLevel(profile.upgrades[id] ?? profile.upgrades[legacyId] ?? 0);
    });

    profile.completedLevels = Array.isArray(profile.completedLevels) ? profile.completedLevels : [];
    profile.dailyReward = {
      lastDailyChestAt: profile.dailyRewardLastClaim ?? null,
      dailyStreak: 0,
      ...(profile.dailyReward ?? {})
    };
    profile.rareChest = {
      lastRareChestAt: null,
      winsSinceRareChest: 0,
      ...(profile.rareChest ?? {})
    };
    return profile;
  },

  getUpgradeLevel(profile, upgradeId) {
    return clampLevel(profile?.upgrades?.[upgradeId]);
  },

  getUpgradePrice(profile, upgradeId) {
    const level = this.getUpgradeLevel(profile, upgradeId);
    return level >= 5 ? null : UPGRADE_PRICES[level];
  },

  buyUpgrade(profile, upgradeId) {
    this.normalize(profile);
    const price = this.getUpgradePrice(profile, upgradeId);
    if (price === null) {
      profile.__purchaseStatus = 'maxLevel';
      return profile;
    }
    if ((profile.gold ?? 0) < price) {
      profile.__purchaseStatus = 'notEnoughGold';
      return profile;
    }
    profile.gold -= price;
    profile.upgrades[upgradeId] = this.getUpgradeLevel(profile, upgradeId) + 1;
    profile.__purchaseStatus = 'purchased';
    return profile;
  },

  buyConsumable(profile, grants, price) {
    this.normalize(profile);
    if ((profile.gold ?? 0) < price) {
      profile.__purchaseStatus = 'notEnoughGold';
      return profile;
    }
    profile.gold -= price;
    Object.entries(grants ?? {}).forEach(([key, count]) => {
      profile.inventory[key] = (profile.inventory[key] ?? 0) + count;
    });
    profile.__purchaseStatus = 'purchased';
    return profile;
  },

  getAbilityBonus(profile, ability) {
    const map = { radar: 'radarLevel', barrage: 'salvoLevel', salvo: 'salvoLevel', torpedo: 'torpedoLevel' };
    return this.getUpgradeLevel(profile, map[ability]);
  },

  getAbilityCharges(profile) {
    this.normalize(profile);
    return {
      radar: profile.inventory.radar + this.getAbilityBonus(profile, 'radar'),
      barrage: profile.inventory.salvo + this.getAbilityBonus(profile, 'barrage'),
      torpedo: profile.inventory.torpedo + this.getAbilityBonus(profile, 'torpedo')
    };
  },

  calculateVictoryReward,
  calculateDefeatReward,
  calculateDailyChestReward,
  calculateRareChestReward,
  getRankByXp,
  getNextRankProgress,

  getBattleGoldReward({ victory, battleMode, levelId, profile }) {
    if (battleMode === 'quick') {
      return withPercentBonus(victory ? 40 : 10, profile?.upgrades?.goldBonusLevel);
    }
    const level = LEVELS[levelId - 1];
    return (victory ? calculateVictoryReward(level, profile) : calculateDefeatReward(level, profile)).gold;
  },

  getBattleXpReward({ victory, battleMode, levelId, profile }) {
    if (battleMode === 'quick') {
      return withPercentBonus(victory ? 20 : 5, profile?.upgrades?.xpBonusLevel);
    }
    const level = LEVELS[levelId - 1];
    return (victory ? calculateVictoryReward(level, profile) : calculateDefeatReward(level, profile)).xp;
  },

  getRankGoldReward(rankIndex) {
    return RANKS[rankIndex]?.rewardGold ?? 0;
  },

  canClaimRareChest(profile) {
    const last = profile?.rareChest?.lastRareChestAt ? new Date(profile.rareChest.lastRareChestAt).getTime() : 0;
    return Date.now() - last >= 6 * 60 * 60 * 1000 || (profile?.rareChest?.winsSinceRareChest ?? 0) >= 3;
  },

  getRewardedChestGold(profile) {
    return calculateRareChestReward(profile).gold;
  },

  getDailyGold(profile) {
    return calculateDailyChestReward(profile).gold;
  },

  rollExtraChest(profile) {
    return Math.random() < this.getUpgradeLevel(profile, 'goldBonusLevel') * 0.02;
  },

  getPreparationTime() {
    return 45;
  },

  getStartingBattleGold() {
    return 0;
  }
};
