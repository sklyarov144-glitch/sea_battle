import { CAPTAIN_XP_PER_LEVEL } from '../config/balanceConfig.js';
import { CareerService } from './CareerService.js';

const STORAGE_KEY = 'pirateSeaBattle.profile.v1';

const DEFAULT_PROFILE = {
  unlockedLevel: 1,
  gold: 250,
  captainXp: 0,
  captainLevel: 1,
  careerXp: 0,
  careerRankIndex: 0,
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
    selectedSkins: {
      ...profile.selectedSkins,
      ...(saved?.selectedSkins ?? {})
    },
    settings: {
      ...profile.settings,
      ...(saved?.settings ?? {})
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
  return CareerService.normalize(profile);
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

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
        profile.unlockedLevel = Math.max(profile.unlockedLevel, Math.min(10, levelId + 1));
      } else {
        profile.totalLosses += 1;
        profile.currentWinStreak = 0;
      }

      return CareerService.checkRankUp(profile, previousRankIndex);
    });
  },

  consumeBattleBoosts() {
    return this.updateProfile((profile) => {
      const boosts = {
        radar: profile.purchasedItems.radarCharge,
        barrage: profile.purchasedItems.barrageCharge,
        torpedo: profile.purchasedItems.torpedoCharge
      };

      profile.purchasedItems.radarCharge = 0;
      profile.purchasedItems.barrageCharge = 0;
      profile.purchasedItems.torpedoCharge = 0;
      profile.__lastConsumedBoosts = boosts;
      return profile;
    }).__lastConsumedBoosts;
  },

  buyItem(item) {
    return this.updateProfile((profile) => {
      if (profile.gold < item.price) {
        profile.__purchaseStatus = 'notEnoughGold';
        return profile;
      }

      if (item.type === 'skin' && profile.purchasedItems[item.id]) {
        profile.selectedSkins[item.skinGroup] = item.skinValue;
        profile.__purchaseStatus = 'selected';
        return profile;
      }

      profile.gold -= item.price;

      if (item.type === 'consumable') {
        profile.purchasedItems[item.id] = (profile.purchasedItems[item.id] ?? 0) + 1;
        profile.__purchaseStatus = 'purchased';
      }

      if (item.type === 'skin') {
        profile.purchasedItems[item.id] = true;
        profile.selectedSkins[item.skinGroup] = item.skinValue;
        profile.__purchaseStatus = 'purchased';
      }

      return profile;
    });
  },

  canClaimDailyReward() {
    const profile = this.loadProfile();
    return profile.dailyRewardLastClaim !== todayKey();
  },

  claimDailyReward() {
    const today = todayKey();

    return this.updateProfile((profile) => {
      if (profile.dailyRewardLastClaim === today) {
        profile.__dailyRewardClaimed = false;
        return profile;
      }

      profile.dailyRewardLastClaim = today;
      const previousRankIndex = profile.careerRankIndex ?? CareerService.getRankIndex(profile);
      const rewardGold = Math.floor(80 + Math.random() * 71);
      const xpBonus = Math.random() < 0.35 ? 10 : 0;
      CareerService.addGold(profile, rewardGold);
      if (xpBonus > 0) {
        CareerService.addXp(profile, xpBonus);
      }
      CareerService.checkRankUp(profile, previousRankIndex);
      profile.__dailyRewardClaimed = true;
      profile.__dailyRewardGold = rewardGold;
      profile.__dailyRewardXp = xpBonus;
      return profile;
    });
  },

  resetProfile() {
    const freshProfile = cloneDefaultProfile();
    return this.saveProfile(freshProfile);
  }
};
