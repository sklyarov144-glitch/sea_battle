import { RANKS } from './EconomyService.js';

export const CAREER_RANKS = RANKS.map((rank) => ({
  name: rank.title,
  xp: rank.xpRequired,
  rewardGold: rank.rewardGold
}));

export const CareerService = {
  economy: null,

  setEconomyService(service) {
    this.economy = service;
  },

  normalize(profile) {
    if (typeof profile.careerXp !== 'number') {
      profile.careerXp = profile.captainXp ?? 0;
    }
    profile.careerRankIndex = this.getRankIndex(profile);
    return profile;
  },

  getRankIndex(profile) {
    const xp = profile.careerXp ?? profile.captainXp ?? 0;
    let index = 0;
    CAREER_RANKS.forEach((rank, rankIndex) => {
      if (xp >= rank.xp) {
        index = rankIndex;
      }
    });
    return index;
  },

  getRank(profile) {
    return CAREER_RANKS[this.getRankIndex(profile)];
  },

  getNextRank(profile) {
    return CAREER_RANKS[Math.min(CAREER_RANKS.length - 1, this.getRankIndex(profile) + 1)];
  },

  getCurrentRankName(profile) {
    return this.getRank(profile).name;
  },

  getXpForCurrentRank(profile) {
    return this.getRank(profile).xp;
  },

  getXpForNextRank(profile) {
    return this.getNextRank(profile).xp;
  },

  getProgressToNextRank(profile) {
    const current = this.getXpForCurrentRank(profile);
    const next = this.getXpForNextRank(profile);
    if (next <= current) {
      return 1;
    }
    return Math.max(0, Math.min(1, ((profile.careerXp ?? 0) - current) / (next - current)));
  },

  addXp(profile, amount) {
    profile.careerXp = Math.max(0, (profile.careerXp ?? profile.captainXp ?? 0) + amount);
    profile.captainXp = Math.max(0, (profile.captainXp ?? 0) + amount);
    return profile;
  },

  addGold(profile, amount) {
    profile.gold = Math.max(0, (profile.gold ?? 0) + amount);
    return profile;
  },

  checkRankUp(profile, previousRankIndex = profile.careerRankIndex ?? 0) {
    const newRankIndex = this.getRankIndex(profile);
    profile.careerRankIndex = newRankIndex;
    if (newRankIndex > previousRankIndex) {
      const rewardGold = this.economy?.getRankGoldReward
        ? this.economy.getRankGoldReward(newRankIndex)
        : Math.max(50, Math.min(300, 50 + newRankIndex * 16));
      this.addGold(profile, rewardGold);
      profile.__rankUp = {
        rankName: CAREER_RANKS[newRankIndex].name,
        rewardGold
      };
    }
    return profile;
  }
};
