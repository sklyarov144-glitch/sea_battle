import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { CAPTAIN_XP_PER_LEVEL, DAILY_REWARD } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { StorageService } from '../services/StorageService.js';
import { Button } from '../ui/Button.js';
import { ProgressBar } from '../ui/ProgressBar.js';
import { Toast } from '../ui/Toast.js';
import { createCoverImageBackground, drawWoodPanel, flyCoins } from '../utils/effects.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    document.body.dataset.scene = 'MenuScene';
    this.profile = StorageService.loadProfile();
    createCoverImageBackground(this, AssetKeys.Images.MenuBattleBg, {
      fallback: { waterSkin: this.profile.selectedSkins.water },
      overlayAlpha: 0.42,
      overlayColor: 0x061827,
      scale: 1.03,
      toScale: 1.09,
      panX: 16,
      panY: -8,
      duration: 14500
    });

    this.addTitle();
    this.addStatsPanel();
    this.addMenuButtons();
    this.addShipsSilhouette();
  }

  addTitle() {
    const titleX = 390;

    this.add.text(titleX, 76, 'Пиратский Морской Бой', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '48px',
      color: '#fff0bf',
      stroke: '#2b170b',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(titleX, 126, 'Карта Сокровищ', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      color: '#f0c35a',
      stroke: '#2b170b',
      strokeThickness: 5
    }).setOrigin(0.5);
  }

  addStatsPanel() {
    drawWoodPanel(this, 830, 36, 390, 164);
    this.goldText = this.add.text(858, 62, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '25px',
      color: '#fff5d6'
    });
    this.levelText = this.add.text(858, 98, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '23px',
      color: '#d9fbff'
    });
    this.xpBar = new ProgressBar(this, 1025, 156, 300, 24, { fill: 0x34d399, background: 0x17324a });
    this.refreshStats();
  }

  addMenuButtons() {
    const x = GAME_WIDTH / 2;
    const startY = 238;
    const gap = 76;

    new Button(this, x, startY, 330, 58, 'Играть', () => {
      this.scene.start('MapScene');
    }, { icon: '⚔', fontSize: 28 });

    new Button(this, x, startY + gap, 330, 58, 'Карта', () => {
      this.scene.start('MapScene');
    }, { icon: '🗺', fontSize: 27 });

    new Button(this, x, startY + gap * 2, 330, 58, 'Магазин', () => {
      this.scene.start('ShopScene', { from: 'MenuScene' });
    }, { icon: '💰', fontSize: 27 });

    this.dailyButton = new Button(this, x, startY + gap * 3, 330, 58, '', () => {
      this.claimDailyReward();
    }, { icon: '🎁', fontSize: 24 });

    this.refreshDailyButton();
  }

  addShipsSilhouette() {
    const graphics = this.add.graphics();
    graphics.setDepth(-2);
    graphics.fillStyle(0x1a1f28, 0.28);
    graphics.fillEllipse(246, 598, 290, 58);
    graphics.fillStyle(0x3a2717, 0.78);
    graphics.fillRoundedRect(116, 550, 260, 48, 8);
    graphics.fillTriangle(156, 550, 238, 495, 328, 550);
    graphics.fillStyle(0xf0c35a, 0.76);
    graphics.fillTriangle(246, 458, 246, 533, 332, 533);
    graphics.fillStyle(0xd7f8ff, 0.68);
    graphics.fillTriangle(236, 472, 162, 535, 236, 535);

    this.tweens.add({
      targets: graphics,
      y: 8,
      angle: 1.3,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  refreshStats() {
    this.profile = StorageService.loadProfile();
    const xpInLevel = this.profile.captainXp % CAPTAIN_XP_PER_LEVEL;
    this.goldText.setText(`Золото: ${this.profile.gold}`);
    this.levelText.setText(`Капитан: ур. ${this.profile.captainLevel}`);
    this.xpBar.setValue(xpInLevel, CAPTAIN_XP_PER_LEVEL, `Опыт ${xpInLevel}/${CAPTAIN_XP_PER_LEVEL}`);
  }

  refreshDailyButton() {
    const canClaim = StorageService.canClaimDailyReward();
    this.dailyButton.setEnabled(canClaim);
    this.dailyButton.setLabel(canClaim ? `Ежедневный сундук +${DAILY_REWARD.gold}` : 'Ежедневный сундук: завтра');
  }

  claimDailyReward() {
    const beforeGold = this.profile.gold;
    const profile = StorageService.claimDailyReward();

    if (!profile.__dailyRewardClaimed) {
      Toast.show(this, 'Сундук уже открыт. Новый будет завтра.');
      this.refreshDailyButton();
      return;
    }

    Toast.show(this, `Ежедневный сундук: +${DAILY_REWARD.gold} золота`);
    flyCoins(this, { x: GAME_WIDTH / 2, y: 470 }, { x: 900, y: 72 }, 14);
    this.profile = profile;
    this.refreshStats();
    this.refreshDailyButton();

    if (profile.gold <= beforeGold) {
      this.refreshStats();
    }
  }
}
