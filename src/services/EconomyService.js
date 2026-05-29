export const UPGRADE_PRICES = [150, 350, 750, 1500, 3000];

export const ECONOMY_UPGRADES = [
  {
    id: 'radarChargeUpgrade',
    name: 'Radar Charge Upgrade',
    description: '+1 заряд радара за уровень улучшения.'
  },
  {
    id: 'salvoChargeUpgrade',
    name: 'Salvo Charge Upgrade',
    description: '+1 заряд залпа за уровень улучшения.'
  },
  {
    id: 'torpedoChargeUpgrade',
    name: 'Torpedo Charge Upgrade',
    description: '+1 заряд торпеды за уровень улучшения.'
  },
  {
    id: 'bonusGoldUpgrade',
    name: 'Bonus Gold +5%',
    description: '+5% золота за каждый уровень.'
  },
  {
    id: 'bonusXpUpgrade',
    name: 'Bonus XP +5%',
    description: '+5% опыта за каждый уровень.'
  },
  {
    id: 'betterAutoPlacementUpgrade',
    name: 'Better Auto Placement',
    description: 'Больше времени на подготовку и лучший старт.'
  },
  {
    id: 'extraRewardChestChanceUpgrade',
    name: 'Extra Reward Chest Chance',
    description: '+10% шанс дополнительного сундука за уровень.'
  }
];

export function createDefaultUpgrades() {
  return ECONOMY_UPGRADES.reduce((upgrades, upgrade) => {
    upgrades[upgrade.id] = 0;
    return upgrades;
  }, {});
}

function clampLevel(level) {
  return Math.max(0, Math.min(5, Number(level) || 0));
}

function withPercentBonus(value, bonusLevel) {
  return Math.round(value * (1 + clampLevel(bonusLevel) * 0.05));
}

export const EconomyService = {
  normalize(profile) {
    profile.upgrades = {
      ...createDefaultUpgrades(),
      ...(profile.upgrades ?? {})
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

  canBuyUpgrade(profile, upgradeId) {
    const price = this.getUpgradePrice(profile, upgradeId);
    return price !== null && (profile.gold ?? 0) >= price;
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
    profile.__purchasedUpgrade = upgradeId;
    return profile;
  },

  getAbilityBonus(profile, ability) {
    const map = {
      radar: 'radarChargeUpgrade',
      barrage: 'salvoChargeUpgrade',
      torpedo: 'torpedoChargeUpgrade'
    };
    return this.getUpgradeLevel(profile, map[ability]);
  },

  getBattleGoldReward({ victory, battleMode, levelId, profile }) {
    const base = victory
      ? (battleMode === 'quick' ? 40 : Math.round(50 + ((Math.max(1, levelId) - 1) / 9) * 100))
      : 10;
    return withPercentBonus(base, this.getUpgradeLevel(profile, 'bonusGoldUpgrade'));
  },

  getBattleXpReward({ victory, battleMode, profile }) {
    const base = victory ? (battleMode === 'quick' ? 20 : 30) : 5;
    return withPercentBonus(base, this.getUpgradeLevel(profile, 'bonusXpUpgrade'));
  },

  getRewardedChestGold(profile) {
    return withPercentBonus(80 + Math.floor(Math.random() * 121), this.getUpgradeLevel(profile, 'bonusGoldUpgrade'));
  },

  getDailyGold(profile) {
    return withPercentBonus(100, this.getUpgradeLevel(profile, 'bonusGoldUpgrade'));
  },

  getRankGoldReward(rankIndex) {
    return Math.max(50, Math.min(300, 50 + rankIndex * 16));
  },

  rollExtraChest(profile) {
    const chance = this.getUpgradeLevel(profile, 'extraRewardChestChanceUpgrade') * 0.1;
    return Math.random() < chance;
  },

  getPreparationTime(profile) {
    return 30 + this.getUpgradeLevel(profile, 'betterAutoPlacementUpgrade') * 3;
  },

  getStartingBattleGold(profile) {
    return this.getUpgradeLevel(profile, 'betterAutoPlacementUpgrade') * 5;
  }
};
