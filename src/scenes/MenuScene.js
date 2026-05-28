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

    this.add.text(titleX, 126, 'Кампания Сокровищ', {
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
    const startY = 204;
    const gap = 104;
    const buttonWidth = 410;
    const buttonHeight = 112;

    new Button(this, x, startY, buttonWidth, buttonHeight, 'Играть', () => {
      this.scene.start('PreparationScene', { levelId: this.profile.unlockedLevel });
    }, {
      iconKey: AssetKeys.Icons.Ready,
      backgroundKey: AssetKeys.Buttons.Play,
      iconSize: 50
    });

    new Button(this, x, startY + gap, buttonWidth, buttonHeight, 'Кампания', () => {
      this.scene.start('MapScene');
    }, {
      iconKey: AssetKeys.Icons.Campaign,
      backgroundKey: AssetKeys.Buttons.Campaign,
      iconSize: 50
    });

    new Button(this, x, startY + gap * 2, buttonWidth, buttonHeight, 'Быстрый бой', () => {
      this.scene.start('PreparationScene', { levelId: 1 });
    }, {
      iconKey: AssetKeys.Icons.Ships,
      backgroundKey: AssetKeys.Buttons.QuickBattle,
      iconSize: 50
    });

    new Button(this, x, startY + gap * 3, buttonWidth, buttonHeight, 'Настройки', () => {
      Toast.show(this, 'Настройки появятся позже');
    }, {
      iconKey: AssetKeys.Icons.Settings,
      backgroundKey: AssetKeys.Buttons.Settings,
      iconSize: 50
    });

    new Button(this, x, startY + gap * 4, 330, 58, 'Магазин', () => {
      this.scene.start('ShopScene', { from: 'MenuScene' });
    }, {
      iconKey: AssetKeys.Icons.Upgrades,
      fontSize: 27,
      iconSize: 34
    });

    this.dailyButton = new Button(this, x, startY + gap * 5, 330, 58, '', () => {
      this.claimDailyReward();
    }, {
      icon: '🎁',
      fontSize: 23
    });

    this.refreshDailyButton();
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
