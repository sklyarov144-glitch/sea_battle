export const CAREER_RANKS = [
  { name: 'Матрос', xp: 0 },
  { name: 'Старший матрос', xp: 100 },
  { name: 'Старшина 2 статьи', xp: 240 },
  { name: 'Старшина 1 статьи', xp: 420 },
  { name: 'Главный старшина', xp: 650 },
  { name: 'Мичман', xp: 930 },
  { name: 'Старший мичман', xp: 1260 },
  { name: 'Младший лейтенант', xp: 1640 },
  { name: 'Лейтенант', xp: 2080 },
  { name: 'Старший лейтенант', xp: 2580 },
  { name: 'Капитан-лейтенант', xp: 3150 },
  { name: 'Капитан 3 ранга', xp: 3790 },
  { name: 'Капитан 2 ранга', xp: 4500 },
  { name: 'Капитан 1 ранга', xp: 5280 },
  { name: 'Контр-адмирал', xp: 6130 },
  { name: 'Вице-адмирал', xp: 7050 },
  { name: 'Адмирал', xp: 8040 }
];

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
