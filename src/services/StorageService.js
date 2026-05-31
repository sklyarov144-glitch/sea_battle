import { CAMPAIGN_LEVEL_COUNT, CAPTAIN_XP_PER_LEVEL } from '../config/balanceConfig.js';
import { CareerService } from './CareerService.js';
import { EconomyService, createDefaultUpgrades } from './EconomyService.js';

CareerService.setEconomyService(EconomyService);

const STORAGE_KEY = 'pirateSeaBattle.profile.v1';

const DEFAULT_PROFILE = {
  unlockedLevel: 1,
  gold: 250,
  captainXp: 0,
  captainLevel: 1,
  careerXp: 0,
  careerRankIndex: 0,
  completedLevels: [],
  inventory: {
    radar: 0,
    salvo: 0,
    torpedo: 0
  },
  upgrades: createDefaultUpgrades(),
  purchasedItems: {
    radarCharge: 0,
    barrageCharge: 0,
    torpedoCharge: 0,
    shipSkinGoldCorsair: false,
    waterSkinTropical: false
  },
  selectedSkins: {
    ship: 'classic',
    water: 'classic'
  },
  dailyRewardLastClaim: null,
  dailyReward: {
    lastDailyChestAt: null,
    dailyStreak: 0
  },
  rareChest: {
    lastRareChestAt: null,
    winsSinceRareChest: 0
  },
  settings: {
    language: 'ru',
    sound: true,
    music: true,
    musicVolume: 0.45,
    sfxVolume: 0.7,
    vibration: true
  },
  totalWins: 0,
  totalLosses: 0,
  bestWinStreak: 0,
  currentWinStreak: 0
};

function cloneDefaultProfile() {
  return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
}

function mergeProfile(saved) {
  const profile = cloneDefaultProfile();

  return {
    ...profile,
    ...saved,
    purchasedItems: {
      ...profile.purchasedItems,
      ...(saved?.purchasedItems ?? {})
    },
    inventory: {
      ...profile.inventory,
      ...(saved?.inventory ?? {})
    },
    selectedSkins: {
      ...profile.selectedSkins,
      ...(saved?.selectedSkins ?? {})
    },
    settings: {
      ...profile.settings,
      ...(saved?.settings ?? {})
    },
    upgrades: {
      ...profile.upgrades,
      ...(saved?.upgrades ?? {})
    },
    dailyReward: {
      ...profile.dailyReward,
      ...(saved?.dailyReward ?? {})
    },
    rareChest: {
      ...profile.rareChest,
      ...(saved?.rareChest ?? {})
    }
  };
}

function hasLocalStorage() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch (error) {
    console.warn('[StorageService] localStorage недоступен', error);
    return false;
  }
}

function normalizeCaptainLevel(profile) {
  const levelFromXp = Math.floor(profile.captainXp / CAPTAIN_XP_PER_LEVEL) + 1;
  profile.captainLevel = Math.max(1, levelFromXp);
  return CareerService.normalize(EconomyService.normalize(profile));
}

function stripTransientFields(profile) {
  const cleanProfile = { ...profile };
  Object.keys(cleanProfile).forEach((key) => {
    if (key.startsWith('__')) {
      delete cleanProfile[key];
    }
  });
  return cleanProfile;
}

function isWithinHours(dateValue, hours) {
  if (!dateValue) {
    return false;
  }
  return Date.now() - new Date(dateValue).getTime() < hours * 60 * 60 * 1000;
}

function isConsecutiveDailyClaim(dateValue) {
  if (!dateValue) {
    return false;
  }
  const diff = Date.now() - new Date(dateValue).getTime();
  return diff >= 18 * 60 * 60 * 1000 && diff < 48 * 60 * 60 * 1000;
}

export const StorageService = {
  getDefaultProfile() {
    return cloneDefaultProfile();
  },

  loadProfile() {
    if (!hasLocalStorage()) {
      return cloneDefaultProfile();
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const freshProfile = cloneDefaultProfile();
        this.saveProfile(freshProfile);
        return freshProfile;
      }

      return normalizeCaptainLevel(mergeProfile(JSON.parse(raw)));
    } catch (error) {
      console.warn('[StorageService] Не удалось прочитать профиль', error);
      return cloneDefaultProfile();
    }
  },

  saveProfile(profile) {
    const normalized = normalizeCaptainLevel(mergeProfile(profile));

    if (!hasLocalStorage()) {
      return normalized;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stripTransientFields(normalized)));
    } catch (error) {
      console.warn('[StorageService] Не удалось сохранить профиль', error);
    }

    return normalized;
  },

  updateProfile(updater) {
    const current = this.loadProfile();
    const updated = updater({ ...current });
    return this.saveProfile(updated ?? current);
  },

  updateSettings(partialSettings) {
    return this.updateProfile((profile) => {
      profile.settings = {
        ...profile.settings,
        ...partialSettings
      };
      return profile;
    });
  },

  addRewards({ gold = 0, xp = 0 }) {
    return this.updateProfile((profile) => {
      const previousRankIndex = profile.careerRankIndex ?? CareerService.getRankIndex(profile);
      CareerService.addGold(profile, gold);
      CareerService.addXp(profile, xp);
      CareerService.checkRankUp(profile, previousRankIndex);
      return profile;
    });
  },

  applyBattleResult({ victory, levelId, gold = 0, xp = 0 }) {
    return this.updateProfile((profile) => {
      const previousRankIndex = profile.careerRankIndex ?? CareerService.getRankIndex(profile);
      CareerService.addGold(profile, gold);
      CareerService.addXp(profile, xp);

      if (victory) {
        profile.totalWins += 1;
        profile.currentWinStreak += 1;
        profile.bestWinStreak = Math.max(profile.bestWinStreak, profile.currentWinStreak);
        profile.unlockedLevel = Math.max(profile.unlockedLevel, Math.min(CAMPAIGN_LEVEL_COUNT, levelId + 1));
        profile.completedLevels = [...new Set([...(profile.completedLevels ?? []), levelId])];
        profile.rareChest.winsSinceRareChest = (profile.rareChest.winsSinceRareChest ?? 0) + 1;
      } else {
        profile.totalLosses += 1;
        profile.currentWinStreak = 0;
      }

      return CareerService.checkRankUp(profile, previousRankIndex);
    });
  },

  consumeBattleBoosts() {
    const profile = this.loadProfile();
    return EconomyService.getAbilityCharges(profile);
  },

  buyItem(item) {
    return this.updateProfile((profile) => {
      if (item.type === 'upgrade') {
        return EconomyService.buyUpgrade(profile, item.upgradeId ?? item.id);
      }

      if (item.type === 'consumable') {
        return EconomyService.buyConsumable(profile, item.grants, item.price);
      }

      if (item.type === 'comingSoon') {
        profile.__purchaseStatus = 'comingSoon';
        return profile;
      }

      if (item.type === 'skin') {
        if (profile.gold < item.price) {
          profile.__purchaseStatus = 'notEnoughGold';
          return profile;
        }
        if (profile.purchasedItems[item.id]) {
          profile.selectedSkins[item.skinGroup] = item.skinValue;
          profile.__purchaseStatus = 'selected';
          return profile;
        }
        profile.gold -= item.price;
        profile.purchasedItems[item.id] = true;
        profile.selectedSkins[item.skinGroup] = item.skinValue;
        profile.__purchaseStatus = 'purchased';
      }

      return profile;
    });
  },

  canClaimDailyReward() {
    const profile = this.loadProfile();
    return !isWithinHours(profile.dailyReward?.lastDailyChestAt ?? profile.dailyRewardLastClaim, 24);
  },

  claimDailyReward() {
    return this.updateProfile((profile) => {
      if (isWithinHours(profile.dailyReward?.lastDailyChestAt ?? profile.dailyRewardLastClaim, 24)) {
        profile.__dailyRewardClaimed = false;
        return profile;
      }

      const previousClaim = profile.dailyReward?.lastDailyChestAt ?? profile.dailyRewardLastClaim;
      const now = new Date().toISOString();
      profile.dailyReward.dailyStreak = isConsecutiveDailyClaim(previousClaim)
        ? (profile.dailyReward.dailyStreak ?? 0) + 1
        : 1;
      profile.dailyReward.lastDailyChestAt = now;
      profile.dailyRewardLastClaim = now;
      const previousRankIndex = profile.careerRankIndex ?? CareerService.getRankIndex(profile);
      const reward = EconomyService.calculateDailyChestReward(profile);
      CareerService.addGold(profile, reward.gold);
      CareerService.addXp(profile, reward.xp);
      if (reward.ability) {
        profile.inventory[reward.ability] = (profile.inventory[reward.ability] ?? 0) + reward.abilityCount;
      }
      CareerService.checkRankUp(profile, previousRankIndex);
      profile.__dailyRewardClaimed = true;
      profile.__dailyRewardGold = reward.gold;
      profile.__dailyRewardXp = reward.xp;
      profile.__dailyRewardAbility = reward.ability;
      return profile;
    });
  },

  canClaimRareChest() {
    return EconomyService.canClaimRareChest(this.loadProfile());
  },

  claimRareChest() {
    return this.updateProfile((profile) => {
      if (!EconomyService.canClaimRareChest(profile)) {
        profile.__rareChestClaimed = false;
        return profile;
      }
      const previousRankIndex = profile.careerRankIndex ?? CareerService.getRankIndex(profile);
      const reward = EconomyService.calculateRareChestReward(profile);
      CareerService.addGold(profile, reward.gold);
      CareerService.addXp(profile, reward.xp);
      reward.abilities.forEach((ability) => {
        profile.inventory[ability] = (profile.inventory[ability] ?? 0) + 1;
      });
      profile.rareChest.lastRareChestAt = new Date().toISOString();
      profile.rareChest.winsSinceRareChest = 0;
      CareerService.checkRankUp(profile, previousRankIndex);
      profile.__rareChestClaimed = true;
      profile.__rareChestReward = reward;
      return profile;
    });
  },

  claimRewardedChest() {
    return this.claimRareChest();
  },

  consumeAbilityCharge(ability) {
    const key = ability === 'barrage' ? 'salvo' : ability;
    return this.updateProfile((profile) => {
      if ((profile.inventory?.[key] ?? 0) > 0) {
        profile.inventory[key] -= 1;
        profile.__abilityConsumed = true;
      } else {
        profile.__abilityConsumed = false;
      }
      return profile;
    });
  },

  grantFreeAbilityCharge(ability = 'radar') {
    return this.updateProfile((profile) => {
      const itemMap = {
        radar: 'radarCharge',
        barrage: 'barrageCharge',
        torpedo: 'torpedoCharge'
      };
      const itemId = itemMap[ability] ?? itemMap.radar;
      profile.purchasedItems[itemId] = (profile.purchasedItems[itemId] ?? 0) + 1;
      profile.__freeAbility = ability;
      return profile;
    });
  },

  resetProfile() {
    const freshProfile = cloneDefaultProfile();
    return this.saveProfile(freshProfile);
  }
};
