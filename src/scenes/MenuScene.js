import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { DAILY_REWARD } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { CareerService } from '../services/CareerService.js';
import { LocalizationService, t } from '../services/LocalizationService.js';
import { SoundService } from '../services/SoundService.js';
import { StorageService } from '../services/StorageService.js';
import { YandexService } from '../services/YandexService.js';
import { Button } from '../ui/Button.js';
import { drawCareerEmblem, drawNavalPanel } from '../ui/NavalPanel.js';
import { SettingsModal } from '../ui/SettingsModal.js';
import { Toast } from '../ui/Toast.js';
import { createCoverImageBackground, flyCoins } from '../utils/effects.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    document.body.dataset.scene = 'MenuScene';
    this.profile = StorageService.loadProfile();
    LocalizationService.init(this.profile);
    SoundService.init(this.profile);
    SoundService.playMusic(this, SoundService.keys.music_menu);
    createCoverImageBackground(this, AssetKeys.Images.MenuBattleBg, {
      fallback: { waterSkin: this.profile.selectedSkins.water },
      overlayAlpha: 0.46,
      overlayColor: 0x061827,
      scale: 1.03,
      toScale: 1.09,
      panX: 16,
      panY: -8,
      duration: 14500
    });

    this.addTitle();
    this.addMenuButtons();
    this.addCareerPanel();
    this.addAdmiralChest();
  }

  addTitle() {
    this.add.text(88, 82, t('menu_title'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '50px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 8,
      lineSpacing: 2
    }).setOrigin(0, 0.5);

    this.add.text(92, 178, t('menu_subtitle'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#f0c35a',
      letterSpacing: 2
    });

    const line = this.add.graphics();
    line.lineStyle(2, 0xd7a748, 0.75);
    line.lineBetween(92, 214, 386, 214);
    line.lineStyle(1, 0x6db7d4, 0.32);
    line.lineBetween(92, 222, 330, 222);
  }

  addMenuButtons() {
    const x = 600;
    const startY = 142;
    const gap = 78;
    const width = 336;
    const height = 58;

    new Button(this, x, startY, width, height, t('play'), () => {
      this.scene.start('PreparationScene', {
        levelId: this.profile.unlockedLevel,
        battleMode: 'campaign',
        returnScene: 'MenuScene'
      });
    }, { variant: 'primary', fontSize: 23 });

    new Button(this, x, startY + gap, width, height, t('campaign'), () => {
      this.scene.start('MapScene');
    }, { variant: 'secondary', fontSize: 23 });

    new Button(this, x, startY + gap * 2, width, height, t('quick_battle'), () => {
      this.scene.start('PreparationScene', {
        levelId: 1,
        battleMode: 'quick',
        returnScene: 'MenuScene'
      });
    }, { variant: 'secondary', fontSize: 22 });

    new Button(this, x, startY + gap * 3, width, height, t('arsenal'), () => {
      this.scene.start('ShopScene', { from: 'MenuScene' });
    }, { variant: 'secondary', fontSize: 22 });

    new Button(this, x, startY + gap * 4, width, height, t('settings'), () => {
      this.openSettings();
    }, { variant: 'secondary', fontSize: 22 });
  }

  addCareerPanel() {
    drawNavalPanel(this, 858, 42, 354, 238, { title: t('career'), titleSize: 22 });
    drawCareerEmblem(this, 1118, 103, 1.05);

    this.rankText = this.add.text(886, 92, '', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#fff0bf'
    });
    this.goldText = this.add.text(886, 132, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '21px',
      color: '#f8d77a'
    });
    this.xpText = this.add.text(886, 166, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      color: '#d9fbff'
    });

    this.careerBar = this.add.graphics();
    this.refreshCareerPanel();
  }

  refreshCareerPanel() {
    this.profile = StorageService.loadProfile();
    const rank = CareerService.getCurrentRankName(this.profile);
    const currentXp = CareerService.getXpForCurrentRank(this.profile);
    const nextXp = CareerService.getXpForNextRank(this.profile);
    const progress = CareerService.getProgressToNextRank(this.profile);
    const maxRank = nextXp === currentXp;

    this.rankText.setText(`${t('rank')}: ${rank}`);
    this.goldText.setText(`${t('gold')}: ${this.profile.gold}`);
    this.xpText.setText(maxRank ? `${t('xp')}: ${this.profile.careerXp}` : `${t('xp')}: ${this.profile.careerXp} / ${nextXp}`);

    this.careerBar.clear();
    this.careerBar.fillStyle(0x020812, 0.75);
    this.careerBar.fillRoundedRect(886, 206, 286, 18, 7);
    this.careerBar.fillStyle(0x113a58, 0.96);
    this.careerBar.fillRoundedRect(889, 209, 280, 12, 6);
    this.careerBar.fillStyle(0xd7a748, 0.98);
    this.careerBar.fillRoundedRect(889, 209, Math.max(10, 280 * progress), 12, 6);
  }

  addAdmiralChest() {
    const panelX = GAME_WIDTH / 2 - 300;
    const panelY = GAME_HEIGHT - 126;
    drawNavalPanel(this, panelX, panelY, 600, 96, { title: t('admiral_chest'), titleSize: 20 });

    this.chestRewardText = this.add.text(panelX + 28, panelY + 48, `${t('open_for_ad')}  •  +${DAILY_REWARD.gold} ${t('gold').toLowerCase()}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#d9fbff'
    });

    this.chestButton = new Button(this, panelX + 498, panelY + 52, 154, 46, t('open'), () => this.claimDailyReward(), {
      variant: 'primary',
      fontSize: 18,
      small: true
    });
    this.refreshChest();
  }

  refreshChest() {
    const canClaim = StorageService.canClaimDailyReward();
    this.chestButton.setEnabled(canClaim);
    this.chestButton.setLabel(canClaim ? t('open') : t('tomorrow'));
    this.chestRewardText.setText(canClaim ? `${t('open_for_ad')}  •  +80–150 ${t('gold').toLowerCase()}` : t('available_tomorrow'));
  }

  claimDailyReward() {
    this.chestButton.setEnabled(false);
    YandexService.showRewardedAd(() => this.grantDailyReward());
  }

  grantDailyReward() {
    const profile = StorageService.claimDailyReward();

    if (!profile.__dailyRewardClaimed) {
      Toast.show(this, t('daily_already_opened'));
      this.refreshChest();
      return;
    }

    const rewardGold = profile.__dailyRewardGold ?? DAILY_REWARD.gold;
    const xpLine = profile.__dailyRewardXp > 0 ? ` и +${profile.__dailyRewardXp} XP` : '';
    Toast.show(this, `${t('admiral_chest')}: +${rewardGold} ${t('gold').toLowerCase()}${xpLine}`);
    SoundService.playSfx(this, SoundService.keys.sfx_reward);
    flyCoins(this, { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 78 }, { x: 930, y: 132 }, 14);
    this.profile = profile;
    this.refreshCareerPanel();
    this.refreshChest();

    if (profile.__rankUp) {
      this.showRankUpPopup(profile.__rankUp);
    }
  }

  showRankUpPopup(rankUp) {
    const overlay = this.add.container(0, 0).setDepth(800);
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020812, 0.72);
    const panel = drawNavalPanel(this, GAME_WIDTH / 2 - 260, GAME_HEIGHT / 2 - 142, 520, 284, {
      title: t('rank_up_title'),
      titleSize: 28
    });
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 54, t('rank_up_text'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '23px',
      color: '#d9fbff'
    }).setOrigin(0.5);
    const rank = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 8, rankUp.rankName, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 5
    }).setOrigin(0.5);
    const reward = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, `${t('rank_reward')}: +${rankUp.rewardGold} ${t('gold').toLowerCase()}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#f8d77a'
    }).setOrigin(0.5);
    const button = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 98, 230, 56, t('continue'), () => overlay.destroy(), {
      variant: 'primary',
      fontSize: 20
    });

    overlay.add([dim, panel, text, rank, reward, button]);
    SoundService.playSfx(this, SoundService.keys.sfx_rank_up);
    overlay.setScale(0.94);
    this.tweens.add({ targets: overlay, scale: 1, duration: 220, ease: 'Back.easeOut' });
  }

  openSettings() {
    if (this.settingsModal) {
      return;
    }
    this.settingsModal = new SettingsModal(this, {
      onLanguageChanged: () => this.scene.restart(),
      onMusicChanged: (enabled) => {
        if (enabled) {
          SoundService.playMusic(this, SoundService.keys.music_menu);
        }
      },
      onClose: () => {
        this.settingsModal = null;
      }
    });
  }
}
