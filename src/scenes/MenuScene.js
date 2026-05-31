import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { CareerService } from '../services/CareerService.js';
import { LocalizationService, t } from '../services/LocalizationService.js';
import { SoundService } from '../services/SoundService.js';
import { StorageService } from '../services/StorageService.js';
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
    this.addRareChest();
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
    const startY = 170;
    const gap = 86;
    const width = 336;
    const height = 58;

    new Button(this, x, startY, width, height, t('play'), () => {
      this.scene.start('PreparationScene', {
        levelId: 1,
        battleMode: 'quick',
        returnScene: 'MenuScene'
      });
    }, { variant: 'primary', fontSize: 23 });

    new Button(this, x, startY + gap, width, height, t('campaign'), () => {
      this.scene.start('MapScene');
    }, { variant: 'secondary', fontSize: 23 });

    new Button(this, x, startY + gap * 2, width, height, t('shop'), () => {
      this.scene.start('ShopScene', { from: 'MenuScene' });
    }, { variant: 'secondary', fontSize: 22 });

    new Button(this, x, startY + gap * 3, width, height, t('settings'), () => {
      this.openSettings();
    }, { variant: 'secondary', fontSize: 22 });
  }

  addCareerPanel() {
    drawNavalPanel(this, 882, 42, 330, 186, { title: t('career'), titleSize: 21 });
    drawCareerEmblem(this, 1122, 102, 0.78);

    this.rankText = this.add.text(910, 88, '', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '20px',
      color: '#fff0bf',
      fixedWidth: 198,
      wordWrap: { width: 198, useAdvancedWrap: true }
    });
    this.goldText = this.add.text(910, 134, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#f8d77a'
    });
    this.xpText = this.add.text(910, 160, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
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
    this.careerBar.fillRoundedRect(910, 190, 248, 16, 7);
    this.careerBar.fillStyle(0x113a58, 0.96);
    this.careerBar.fillRoundedRect(913, 193, 242, 10, 5);
    this.careerBar.fillStyle(0xd7a748, 0.98);
    this.careerBar.fillRoundedRect(913, 193, Math.max(8, 242 * progress), 10, 5);
  }

  addAdmiralChest() {
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT - 133;
    if (this.textures.exists(AssetKeys.Images.DailyChestReward)) {
      this.chestContainer = this.add.container(x, y);
      this.chestGlow = this.add.graphics();
      this.chestGlow.fillStyle(0x020812, 0.62);
      this.chestGlow.fillRoundedRect(-168, -58, 336, 132, 24);
      this.chestGlow.fillStyle(0xd7a748, 0.12);
      this.chestGlow.fillEllipse(0, 18, 330, 196);
      this.chestGlow.lineStyle(2, 0xd7a748, 0.46);
      this.chestGlow.strokeRoundedRect(-168, -58, 336, 132, 24);
      this.chestButton = this.add.image(0, -2, AssetKeys.Images.DailyChestReward)
        .setDisplaySize(244, 265);
      this.chestHitZone = this.add.zone(0, 8, 312, 248)
        .setInteractive({ useHandCursor: true });
      this.chestContainer.add([this.chestGlow, this.chestButton, this.chestHitZone]);
      this.chestBaseScale = 1;
      this.chestHitZone.on('pointerover', () => {
        if (StorageService.canClaimDailyReward()) {
          this.tweens.add({
            targets: this.chestContainer,
            scale: this.chestBaseScale * 1.04,
            duration: 120,
            ease: 'Sine.easeOut'
          });
        }
      });
      this.chestHitZone.on('pointerout', () => {
        this.tweens.add({
          targets: this.chestContainer,
          scale: this.chestBaseScale,
          duration: 120,
          ease: 'Sine.easeOut'
        });
      });
      this.chestHitZone.on('pointerup', () => this.claimDailyReward());
    } else {
      this.chestButton = new Button(this, x, GAME_HEIGHT - 76, 260, 56, t('admiral_chest'), () => this.claimDailyReward(), {
        variant: 'primary',
        fontSize: 18
      });
    }
    this.refreshChest();
  }

  refreshChest() {
    const canClaim = StorageService.canClaimDailyReward();
    if (this.chestButton instanceof Button) {
      this.chestButton.setEnabled(canClaim);
      this.chestButton.setLabel(canClaim ? t('admiral_chest') : t('tomorrow'));
    } else {
      this.chestContainer.setAlpha(canClaim ? 1 : 0.62);
      this.chestButton.clearTint();
      if (!canClaim) {
        this.chestButton.setTint(0x6f7784);
      }
    }
  }

  claimDailyReward() {
    if (!StorageService.canClaimDailyReward()) {
      Toast.show(this, this.getDailyCooldownText());
      return;
    }
    if (this.chestButton instanceof Button) {
      this.chestButton.setEnabled(false);
    } else {
      this.chestHitZone.disableInteractive();
      this.chestContainer.setAlpha(0.62);
    }
    this.mockRewardedAd(() => this.grantDailyReward());
  }

  mockRewardedAd(callback) {
    callback?.();
  }

  grantDailyReward() {
    const profile = StorageService.claimDailyReward();

    if (!profile.__dailyRewardClaimed) {
      Toast.show(this, t('daily_already_opened'));
      this.refreshChest();
      return;
    }

    const rewardGold = profile.__dailyRewardGold ?? 100;
    const xpLine = profile.__dailyRewardXp > 0 ? t('daily_xp_bonus', { amount: profile.__dailyRewardXp }) : '';
    const abilityLine = profile.__dailyRewardAbility ? `, +1 ${t(profile.__dailyRewardAbility)}` : '';
    Toast.show(this, `${t('admiral_chest')}: +${rewardGold} ${t('gold').toLowerCase()}${xpLine}${abilityLine}`);
    SoundService.playSfx(this, SoundService.keys.sfx_reward);
    flyCoins(this, { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 78 }, { x: 930, y: 132 }, 14);
    this.profile = profile;
    this.refreshCareerPanel();
    this.refreshChest();
    if (!(this.chestButton instanceof Button)) {
      this.chestHitZone.setInteractive({ useHandCursor: true });
    }

    if (profile.__rankUp) {
      this.showRankUpPopup(profile.__rankUp);
    }
  }

  addRareChest() {
    const x = 236;
    const y = GAME_HEIGHT - 96;
    if (this.textures.exists(AssetKeys.Images.RareChestReward)) {
      this.rareChestContainer = this.add.container(x, y);
      const glow = this.add.graphics();
      glow.fillStyle(0x020812, 0.58);
      glow.fillRoundedRect(-104, -72, 208, 138, 22);
      glow.fillStyle(0xb156ff, 0.14);
      glow.fillEllipse(0, -4, 196, 154);
      glow.lineStyle(2, 0xd7a748, 0.36);
      glow.strokeRoundedRect(-104, -72, 208, 138, 22);
      this.rareChestImage = this.add.image(0, -16, AssetKeys.Images.RareChestReward)
        .setDisplaySize(138, 137);
      this.rareChestLabel = this.add.text(0, 52, t('rare_chest'), {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '17px',
        color: '#fff0bf',
        stroke: '#020812',
        strokeThickness: 3
      }).setOrigin(0.5);
      this.rareChestHitZone = this.add.zone(0, -6, 208, 150)
        .setInteractive({ useHandCursor: true });
      this.rareChestContainer.add([glow, this.rareChestImage, this.rareChestLabel, this.rareChestHitZone]);
      this.rareChestHitZone.on('pointerover', () => {
        if (StorageService.canClaimRareChest()) {
          this.tweens.add({ targets: this.rareChestContainer, scale: 1.04, duration: 120, ease: 'Sine.easeOut' });
        }
      });
      this.rareChestHitZone.on('pointerout', () => {
        this.tweens.add({ targets: this.rareChestContainer, scale: 1, duration: 120, ease: 'Sine.easeOut' });
      });
      this.rareChestHitZone.on('pointerup', () => this.claimRareChest());
    } else {
      this.rareChestButton = new Button(this, 224, GAME_HEIGHT - 72, 300, 50, t('rare_chest_open'), () => this.claimRareChest(), {
        variant: 'secondary',
        fontSize: 16,
        small: true
      });
    }
    this.refreshRareChest();
  }

  refreshRareChest() {
    const canClaim = StorageService.canClaimRareChest();
    if (this.rareChestButton) {
      this.rareChestButton.setEnabled(canClaim);
      return;
    }
    this.rareChestContainer?.setAlpha(canClaim ? 1 : 0.58);
    this.rareChestImage?.clearTint();
    if (!canClaim) {
      this.rareChestImage?.setTint(0x7f7787);
    }
  }

  claimRareChest() {
    const profile = StorageService.claimRareChest();
    if (!profile.__rareChestClaimed) {
      Toast.show(this, t('rare_chest_later'));
      this.refreshRareChest();
      return;
    }

    const reward = profile.__rareChestReward;
    Toast.show(this, `${t('rare_chest')}: +${reward.gold} ${t('gold').toLowerCase()}, +${reward.xp} XP`);
    SoundService.playSfx(this, SoundService.keys.sfx_reward);
    flyCoins(this, { x: 224, y: GAME_HEIGHT - 72 }, { x: 930, y: 132 }, 14);
    this.profile = profile;
    this.refreshCareerPanel();
    this.refreshRareChest();
    if (profile.__rankUp) {
      this.showRankUpPopup(profile.__rankUp);
    }
  }

  getDailyCooldownText() {
    const last = this.profile?.dailyReward?.lastDailyChestAt ?? this.profile?.dailyRewardLastClaim;
    if (!last) {
      return t('available_tomorrow');
    }
    const ms = Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - new Date(last).getTime()));
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.ceil((ms % 3600000) / 60000);
    return t('daily_chest_cooldown', { time: `${hours}:${String(minutes).padStart(2, '0')}` });
  }

  showRankUpPopup(rankUp) {
    this.rankPopupOverlay?.destroy();
    const overlay = this.add.container(0, 0).setDepth(800);
    this.rankPopupOverlay = overlay;
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020812, 0.72);
    const panel = drawNavalPanel(this, GAME_WIDTH / 2 - 260, GAME_HEIGHT / 2 - 142, 520, 284);
    const title = this.add.text(GAME_WIDTH / 2 - 236, GAME_HEIGHT / 2 - 126, t('rank_up_title'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '28px',
      color: '#f8d77a',
      fontStyle: 'bold'
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
    const closePopup = () => {
      overlay.destroy();
      if (this.rankPopupOverlay === overlay) {
        this.rankPopupOverlay = null;
      }
    };
    const button = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 98, 230, 56, t('continue'), closePopup, {
      variant: 'primary',
      fontSize: 20
    });

    overlay.add([dim, panel, title, text, rank, reward, button]);
    overlay.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.rankPopupOverlay === overlay) {
        this.rankPopupOverlay = null;
      }
    });
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
