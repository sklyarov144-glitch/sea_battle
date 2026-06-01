import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { LEVELS } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { EconomyService } from '../services/EconomyService.js';
import { CareerService } from '../services/CareerService.js';
import { LocalizationService, t } from '../services/LocalizationService.js';
import { SoundService } from '../services/SoundService.js';
import { StorageService } from '../services/StorageService.js';
import { Button } from '../ui/Button.js';
import { drawNavalPanel } from '../ui/NavalPanel.js';
import { Toast } from '../ui/Toast.js';
import { createCoverImageBackground, createRainOverlay, flyCoins, spawnFireworks } from '../utils/effects.js';

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
    createCoverImageBackground(this, AssetKeys.Images.BattleOceanBg, {
      fallback: { waterSkin: profile.selectedSkins.water },
      overlayAlpha: this.result.victory ? 0.32 : 0.52,
      overlayColor: this.result.victory ? 0x061827 : 0x050914
    });
    this.applyRewards();

    if (this.result.victory) {
      this.addResultEffects(true);
      spawnFireworks(this, GAME_WIDTH / 2, 210);
    } else {
      this.addResultEffects(false);
      createRainOverlay(this, { depth: -2, alpha: 0.26 });
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a101a, 0.24).setDepth(-4);
    }

    this.addPanel();
    if (this.rankUp) {
      this.time.delayedCall(420, () => this.showRankUpPopup(this.rankUp));
    }
  }

  addResultEffects(victory) {
    const keys = victory
      ? [AssetKeys.StyleEffects.Victory1, AssetKeys.StyleEffects.Victory2, AssetKeys.StyleEffects.Victory3, AssetKeys.StyleEffects.Victory4]
      : [AssetKeys.StyleEffects.Defeat1, AssetKeys.StyleEffects.Defeat2, AssetKeys.StyleEffects.Defeat3];
    const positions = victory
      ? [{ x: 302, y: 168, s: 0.86 }, { x: 962, y: 188, s: 0.76 }, { x: 640, y: 114, s: 0.92 }, { x: 650, y: 602, s: 0.74 }]
      : [{ x: 298, y: 230, s: 0.92 }, { x: 958, y: 248, s: 0.84 }, { x: 640, y: 610, s: 0.78 }];
    keys.forEach((key, index) => {
      if (!this.textures.exists(key)) {
        return;
      }
      const pos = positions[index];
      const effect = this.add.image(pos.x, pos.y, key)
        .setScale(pos.s)
        .setAlpha(victory ? 0.72 : 0.48)
        .setDepth(-3);
      this.tweens.add({
        targets: effect,
        alpha: victory ? 0.42 : 0.28,
        scale: pos.s * 1.06,
        duration: 1300 + index * 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    });
  }

  applyRewards() {
    const totalGold = this.result.rewardGold + this.result.chestGold + this.result.battleGold;
    const profileBeforeRewards = StorageService.loadProfile();
    const careerXp = this.result.rewardXp || EconomyService.getBattleXpReward({
      victory: this.result.victory,
      battleMode: this.result.battleMode,
      levelId: this.result.levelId,
      profile: profileBeforeRewards
    });
    this.appliedGold = totalGold;
    this.appliedXp = careerXp;
    this.profile = StorageService.applyBattleResult({
      victory: this.result.victory,
      levelId: this.result.levelId,
      gold: totalGold,
      xp: careerXp
    });
    this.rankUp = this.profile.__rankUp ?? null;
  }

  addPanel() {
    const level = LEVELS[this.result.levelId - 1];
    drawNavalPanel(this, GAME_WIDTH / 2 - 360, 66, 720, 584, { alpha: 0.96 });

    const title = this.result.victory ? t('victory') : t('defeat');
    const subtitle = this.result.victory ? t('captain_chest_opened') : t('crew_saved_loot');

    this.add.text(GAME_WIDTH / 2, 150, title, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '54px',
      color: this.result.victory ? '#fff0bf' : '#d8e1ea',
      stroke: '#2b170b',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 202, level ? level.name : t('campaign'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#d9fbff'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 236, subtitle, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#fff5d6'
    }).setOrigin(0.5);

    const chestKey = this.result.victory && this.textures.exists(AssetKeys.StyleChests.NavalOpen)
      ? AssetKeys.StyleChests.NavalOpen
      : AssetKeys.Textures.Chest;
    const chest = this.add.image(GAME_WIDTH / 2, 292, chestKey);
    if (chestKey === AssetKeys.Textures.Chest) {
      chest.setScale(1.45);
    } else {
      chest.setDisplaySize(128, 128);
    }
    this.tweens.add({ targets: chest, y: 286, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.rewardText = this.add.text(GAME_WIDTH / 2, 356, this.getRewardText(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#fff5d6',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    this.rankText = this.add.text(GAME_WIDTH / 2, 424, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#d9fbff',
      align: 'center'
    }).setOrigin(0.5);
    this.rankBar = this.add.graphics();
    this.updateRankProgress();

    new Button(this, GAME_WIDTH / 2 - 170, 510, 310, 56, t('main_menu'), () => {
      this.scene.start('MenuScene');
    }, {
      variant: 'secondary',
      fontSize: 21,
      hitPadding: 0
    });

    new Button(this, GAME_WIDTH / 2 + 170, 510, 310, 56, this.result.victory ? t('play_again') : t('try_again'), () => {
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

    if (this.result.victory) {
      this.doubleButton = new Button(this, GAME_WIDTH / 2, 586, 520, 56, t('double_reward_ad'), () => {
        this.doubleReward();
      }, {
        fontSize: 20,
        variant: 'ready',
        hitPadding: 0,
        pulse: true
      });
    }
  }

  getRewardText() {
    const lines = [
      `${t('gold_reward')}: +${this.appliedGold}`,
      `${t('xp_reward')}: +${this.appliedXp}`
    ];

    if (this.result.chestGold > 0) {
      lines.push(`${t('admiral_chest')}: +${this.result.chestGold}`);
    }

    return lines.join('\n');
  }

  updateRankProgress() {
    this.profile = StorageService.loadProfile();
    const rank = CareerService.getCurrentRankName(this.profile);
    const nextXp = CareerService.getXpForNextRank(this.profile);
    const currentXp = this.profile.careerXp ?? 0;
    const progress = CareerService.getProgressToNextRank(this.profile);
    this.rankText.setText(`${t('rank')}: ${rank}\n${t('rank_progress')}: ${currentXp} / ${nextXp}`);
    this.rankBar.clear();
    this.rankBar.fillStyle(0x020812, 0.74);
    this.rankBar.fillRoundedRect(GAME_WIDTH / 2 - 180, 462, 360, 16, 7);
    this.rankBar.fillStyle(0x123b58, 0.96);
    this.rankBar.fillRoundedRect(GAME_WIDTH / 2 - 176, 466, 352, 8, 4);
    this.rankBar.fillStyle(0xd7a748, 0.98);
    this.rankBar.fillRoundedRect(GAME_WIDTH / 2 - 176, 466, Math.max(8, 352 * progress), 8, 4);
  }

  mockRewardedAd(callback) {
    Toast.show(this, t('test_ad_watched'));
    callback?.();
  }

  doubleReward() {
    if (this.rewardDoubled || !this.result.victory) {
      return;
    }

    this.rewardDoubled = true;
    this.doubleButton?.setEnabled(false).setLabel(t('reward_doubled'));
    this.mockRewardedAd(() => {
      const profile = StorageService.addRewards({ gold: this.appliedGold, xp: this.appliedXp });
      this.appliedGold *= 2;
      this.appliedXp *= 2;
      this.rewardText.setText(`${this.getRewardText()}\n${t('reward_doubled')}`);
      this.updateRankProgress();
      SoundService.playSfx(this, SoundService.keys.sfx_reward);
      flyCoins(this, { x: GAME_WIDTH / 2, y: 574 }, { x: GAME_WIDTH / 2, y: 380 }, 16);
      if (profile.__rankUp) {
        this.showRankUpPopup(profile.__rankUp);
      }
    });
  }

  continueAfterDefeat() {
    if (this.result.victory || this.continuedAfterDefeat) {
      return;
    }
    Toast.show(this, t('ad_placeholder'));
  }

  showRankUpPopup(rankUp) {
    this.rankPopupOverlay?.destroy();
    const overlay = this.add.container(0, 0).setDepth(900);
    this.rankPopupOverlay = overlay;
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020812, 0.72);
    const panel = drawNavalPanel(this, GAME_WIDTH / 2 - 270, GAME_HEIGHT / 2 - 146, 540, 292);
    const title = this.add.text(GAME_WIDTH / 2 - 246, GAME_HEIGHT / 2 - 128, t('rank_up_title'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '30px',
      color: '#f8d77a',
      fontStyle: 'bold'
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
    const closePopup = () => {
      overlay.destroy();
      if (this.rankPopupOverlay === overlay) {
        this.rankPopupOverlay = null;
      }
    };
    const button = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 104, 230, 56, t('continue'), closePopup, {
      variant: 'primary',
      fontSize: 20
    });

    overlay.add([dim, panel, title, lead, rank, reward, button]);
    overlay.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.rankPopupOverlay === overlay) {
        this.rankPopupOverlay = null;
      }
    });
    SoundService.playSfx(this, SoundService.keys.sfx_rank_up);
    overlay.setScale(0.94);
    this.tweens.add({ targets: overlay, scale: 1, duration: 220, ease: 'Back.easeOut' });
  }
}
