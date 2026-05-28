export const YandexService = {
  sdk: null,
  initialized: false,

  async init() {
    if (this.initialized) {
      return this.sdk;
    }

    this.initialized = true;
    console.log('[YandexService] SDK заглушка инициализирована');
    return this.sdk;
  },

  async showFullscreenAd() {
    console.log('[YandexService] showFullscreenAd: заглушка без SDK');
    return true;
  },

  async showRewardedAd(onReward) {
    console.log('[YandexService] showRewardedAd: заглушка, награда выдана');

    if (typeof onReward === 'function') {
      onReward();
    }

    return true;
  },

  async savePlayerData(data) {
    console.log('[YandexService] savePlayerData:', data);
    return true;
  },

  async loadPlayerData() {
    console.log('[YandexService] loadPlayerData: заглушка возвращает null');
    return null;
  },

  async submitLeaderboardScore(score) {
    console.log('[YandexService] submitLeaderboardScore:', score);
    return true;
  }
};
