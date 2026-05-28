import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { LEVELS } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { StorageService } from '../services/StorageService.js';
import { YandexService } from '../services/YandexService.js';
import { Button } from '../ui/Button.js';
import { Toast } from '../ui/Toast.js';
import { createRainOverlay, createSeaBackground, drawWoodPanel, flyCoins, spawnFireworks } from '../utils/effects.js';

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
      battleGold: data.battleGold ?? 0
    };
    this.rewardDoubled = false;
  }

  create() {
    document.body.dataset.scene = 'ResultScene';
    document.body.dataset.result = this.result.victory ? 'victory' : 'defeat';
    const profile = StorageService.loadProfile();
    createSeaBackground(this, { waterSkin: profile.selectedSkins.water });
    this.applyRewards();

    if (this.result.victory) {
      spawnFireworks(this, GAME_WIDTH / 2, 210);
    } else {
      createRainOverlay(this);
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a101a, 0.24).setDepth(20);
    }

    this.addPanel();
  }

  applyRewards() {
    const totalGold = this.result.rewardGold + this.result.chestGold + this.result.battleGold;
    this.appliedGold = totalGold;
    this.appliedXp = this.result.rewardXp;
    const profile = StorageService.applyBattleResult({
      victory: this.result.victory,
      levelId: this.result.levelId,
      gold: totalGold,
      xp: this.result.rewardXp
    });

    if (this.result.victory) {
      YandexService.submitLeaderboardScore(profile.totalWins);
    }
  }

  addPanel() {
    const level = LEVELS[this.result.levelId - 1];
    drawWoodPanel(this, GAME_WIDTH / 2 - 320, 96, 640, 508, { alpha: 0.96 });

    const title = this.result.victory ? 'Победа!' : 'Поражение';
    const subtitle = this.result.victory ? 'Сундук капитана открыт' : 'Команда спасла часть добычи';

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

    new Button(this, GAME_WIDTH / 2 - 190, 506, 300, 76, 'В кампанию', () => {
      this.scene.start('MapScene');
    }, {
      iconKey: AssetKeys.Icons.Campaign,
      backgroundKey: AssetKeys.Buttons.Campaign,
      iconSize: 38
    });

    new Button(this, GAME_WIDTH / 2 + 190, 506, 300, 76, 'Играть снова', () => {
      this.scene.start('PreparationScene', { levelId: this.result.levelId });
    }, {
      iconKey: AssetKeys.Icons.Ready,
      backgroundKey: AssetKeys.Buttons.Play,
      iconSize: 38
    });

    this.doubleButton = new Button(this, GAME_WIDTH / 2, 594, 390, 60, 'Удвоить за рекламу', () => {
      this.doubleReward();
    }, {
      icon: '▶',
      fontSize: 22,
      fill: 0x0f7d8a,
      hoverFill: 0x139cab
    });
  }

  getRewardText() {
    const lines = [
      `Золото: +${this.appliedGold}`,
      `Опыт капитана: +${this.appliedXp}`
    ];

    if (this.result.chestGold > 0) {
      lines.push(`Сундук: +${this.result.chestGold}`);
    }

    return lines.join('\n');
  }

  doubleReward() {
    if (this.rewardDoubled) {
      return;
    }

    this.doubleButton.setEnabled(false).setLabel('Награда получена');
    YandexService.showRewardedAd(() => {
      this.rewardDoubled = true;
      StorageService.addRewards({ gold: this.appliedGold, xp: 0 });
      Toast.show(this, `Реклама-заглушка: +${this.appliedGold} золота`);
      flyCoins(this, { x: GAME_WIDTH / 2, y: 574 }, { x: GAME_WIDTH / 2, y: 380 }, 16);
    });
  }
}
