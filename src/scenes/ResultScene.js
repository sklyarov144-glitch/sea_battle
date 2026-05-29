import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { LEVELS } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { EconomyService } from '../services/EconomyService.js';
import { LocalizationService, t } from '../services/LocalizationService.js';
import { SoundService } from '../services/SoundService.js';
import { StorageService } from '../services/StorageService.js';
import { YandexService } from '../services/YandexService.js';
import { Button } from '../ui/Button.js';
import { drawNavalPanel } from '../ui/NavalPanel.js';
import { Toast } from '../ui/Toast.js';
import { createRainOverlay, createSeaBackground, flyCoins, spawnFireworks } from '../utils/effects.js';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  init(data) {
    this.result = {
      victory: Boolean(data.victory),
      levelId: data.levelId ?? 1,
      rewardGold: data.rewardGold ?? 0,
      rewardXp: data.rewardXp ?? 0,
      chestGold: data.chestGold ?? 0,
      battleGold: data.battleGold ?? 0,
      battleMode: data.battleMode ?? 'campaign'
    };
    this.rewardDoubled = false;
  }

  create() {
    document.body.dataset.scene = 'ResultScene';
    document.body.dataset.result = this.result.victory ? 'victory' : 'defeat';
    const profile = StorageService.loadProfile();
    LocalizationService.init(profile);
    SoundService.init(profile);
    SoundService.playMusic(this, this.result.victory ? SoundService.keys.music_menu : SoundService.keys.music_battle);
    createSeaBackground(this, { waterSkin: profile.selectedSkins.water });
    this.applyRewards();

    if (this.result.victory) {
      spawnFireworks(this, GAME_WIDTH / 2, 210);
    } else {
      createRainOverlay(this);
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a101a, 0.24).setDepth(20);
    }

    this.addPanel();
    if (this.rankUp) {
      this.time.delayedCall(420, () => this.showRankUpPopup(this.rankUp));
    }
  }

  applyRewards() {
    const totalGold = this.result.rewardGold + this.result.chestGold + this.result.battleGold;
    const profileBeforeRewards = StorageService.loadProfile();
    const careerXp = this.result.rewardXp || EconomyService.getBattleXpReward({
      victory: this.result.victory,
      battleMode: this.result.battleMode,
      profile: profileBeforeRewards
    });
    this.appliedGold = totalGold;
    this.appliedXp = careerXp;
    const profile = StorageService.applyBattleResult({
      victory: this.result.victory,
      levelId: this.result.levelId,
      gold: totalGold,
      xp: careerXp
    });
    this.rankUp = profile.__rankUp ?? null;

    if (this.result.victory) {
      YandexService.submitLeaderboardScore(profile.totalWins);
    }
  }

  addPanel() {
    const level = LEVELS[this.result.levelId - 1];
    drawNavalPanel(this, GAME_WIDTH / 2 - 350, 78, 700, 560, { alpha: 0.96 });

    const title = this.result.victory ? t('victory') : t('defeat');
    const subtitle = this.result.victory ? t('captain_chest_opened') : t('crew_saved_loot');

    this.add.text(GAME_WIDTH / 2, 150, title, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '54px',
      color: this.result.victory ? '#fff0bf' : '#d8e1ea',
      stroke: '#2b170b',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 202, level?.name ?? 'Остров', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#d9fbff'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 238, subtitle, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#fff5d6'
    }).setOrigin(0.5);

    const chest = this.add.image(GAME_WIDTH / 2, 302, AssetKeys.Textures.Chest).setScale(1.7);
    this.tweens.add({ targets: chest, y: 294, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.rewardText = this.add.text(GAME_WIDTH / 2, 378, this.getRewardText(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '25px',
      color: '#fff5d6',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    new Button(this, GAME_WIDTH / 2 - 170, 498, 310, 56, 'Главное меню', () => {
      this.scene.start('MenuScene');
    }, {
      variant: 'secondary',
      fontSize: 21,
      hitPadding: 0
    });

    new Button(this, GAME_WIDTH / 2 + 170, 498, 310, 56, t('play_again'), () => {
      this.scene.start('PreparationScene', {
        levelId: this.result.levelId,
        battleMode: this.result.battleMode,
        returnScene: this.result.battleMode === 'quick' ? 'MenuScene' : 'MapScene'
      });
    }, {
      variant: 'primary',
      fontSize: 21,
      hitPadding: 0
    });

    this.doubleButton = new Button(this, GAME_WIDTH / 2, 572, 520, 56, 'Удвоить награду за рекламу', () => {
      this.doubleReward();
    }, {
      fontSize: 21,
      variant: 'ready',
      hitPadding: 0
    });
  }

  getRewardText() {
    const lines = [
      `${t('gold')}: +${this.appliedGold}`,
      `${t('career_xp')}: +${this.appliedXp}`
    ];

    if (this.result.chestGold > 0) {
      lines.push(`${t('admiral_chest')}: +${this.result.chestGold}`);
    }

    return lines.join('\n');
  }

  doubleReward() {
    if (this.rewardDoubled) {
      return;
    }

    this.doubleButton.setEnabled(false).setLabel(t('reward_received'));
    YandexService.showRewardedAd(() => {
      this.rewardDoubled = true;
      StorageService.addRewards({ gold: this.appliedGold, xp: 0 });
      Toast.show(this, `+${this.appliedGold} ${t('gold').toLowerCase()}`);
      SoundService.playSfx(this, SoundService.keys.sfx_reward);
      flyCoins(this, { x: GAME_WIDTH / 2, y: 574 }, { x: GAME_WIDTH / 2, y: 380 }, 16);
    });
  }

  continueAfterDefeat() {
    if (this.result.victory || this.continuedAfterDefeat) {
      return;
    }
    YandexService.showRewardedAd(() => {
      this.continuedAfterDefeat = true;
      this.scene.start('PreparationScene', {
        levelId: this.result.levelId,
        battleMode: this.result.battleMode,
        returnScene: this.result.battleMode === 'quick' ? 'MenuScene' : 'MapScene'
      });
    });
  }

  showRankUpPopup(rankUp) {
    const overlay = this.add.container(0, 0).setDepth(900);
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020812, 0.72);
    const panel = drawNavalPanel(this, GAME_WIDTH / 2 - 270, GAME_HEIGHT / 2 - 146, 540, 292, {
      title: t('rank_up_title'),
      titleSize: 30
    });
    const lead = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 58, t('rank_up_text'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '23px',
      color: '#d9fbff'
    }).setOrigin(0.5);
    const rank = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 8, rankUp.rankName, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '35px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 5
    }).setOrigin(0.5);
    const reward = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 44, `${t('rank_reward')}: +${rankUp.rewardGold} ${t('gold').toLowerCase()}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#f8d77a'
    }).setOrigin(0.5);
    const button = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 104, 230, 56, t('continue'), () => overlay.destroy(), {
      variant: 'primary',
      fontSize: 20
    });

    overlay.add([dim, panel, lead, rank, reward, button]);
    SoundService.playSfx(this, SoundService.keys.sfx_rank_up);
    overlay.setScale(0.94);
    this.tweens.add({ targets: overlay, scale: 1, duration: 220, ease: 'Back.easeOut' });
  }
}
