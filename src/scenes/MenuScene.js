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
    this.chestTimerEvent = this.time.addEvent({
      delay: 60000,
      loop: true,
      callback: () => {
        this.refreshChest();
        this.refreshRareChest();
      }
    });
  }

  addTitle() {
    this.add.text(88, 76, t('menu_title_line_1'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '44px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 7
    }).setOrigin(0, 0.5);

    this.add.text(92, 128, t('menu_title_line_2'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '38px',
      color: '#f8d77a',
      stroke: '#020812',
      strokeThickness: 6
    }).setOrigin(0, 0.5);

    const line = this.add.graphics();
    line.lineStyle(2, 0xd7a748, 0.75);
    line.lineBetween(92, 180, 430, 180);
    line.lineStyle(1, 0x6db7d4, 0.32);
    line.lineBetween(92, 188, 360, 188);
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
    if (this.textures.exists(AssetKeys.StyleIcons.Rank)) {
      this.add.image(1122, 102, AssetKeys.StyleIcons.Rank).setDisplaySize(66, 66);
    } else {
      drawCareerEmblem(this, 1122, 102, 0.78);
    }
    if (this.textures.exists(AssetKeys.StyleIcons.Gold)) {
      this.add.image(900, 143, AssetKeys.StyleIcons.Gold).setDisplaySize(22, 22);
    }
    if (this.textures.exists(AssetKeys.StyleIcons.Xp)) {
      this.add.image(900, 169, AssetKeys.StyleIcons.Xp).setDisplaySize(20, 20);
    }

    this.rankText = this.add.text(910, 88, '', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '20px',
      color: '#fff0bf',
      fixedWidth: 198,
      wordWrap: { width: 198, useAdvancedWrap: true }
    });
    this.goldText = this.add.text(928, 134, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#f8d77a'
    });
    this.xpText = this.add.text(928, 160, '', {
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
      this.chestGlow.fillStyle(0xd7a748, 0.14);
      this.chestGlow.fillEllipse(0, 18, 330, 196);
      this.chestButton = this.add.image(0, -2, AssetKeys.StyleChests.DailyGlow)
        .setDisplaySize(244, 265);
      this.dailyChestStatus = this.add.text(0, 120, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#fff5d6',
        align: 'center',
        fixedWidth: 280,
        wordWrap: { width: 280, useAdvancedWrap: true },
        stroke: '#020812',
        strokeThickness: 3
      }).setOrigin(0.5);
      this.chestHitZone = this.add.zone(0, -2, 244, 265)
        .setInteractive({ useHandCursor: true });
      this.chestContainer.add([this.chestGlow, this.chestButton, this.dailyChestStatus, this.chestHitZone]);
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
      const textureKey = canClaim ? AssetKeys.StyleChests.DailyGlow : AssetKeys.StyleChests.DailyClosed;
      if (this.textures.exists(textureKey)) {
        this.chestButton.setTexture(textureKey);
      }
      this.dailyChestStatus?.setText(`${canClaim ? t('available') : this.getDailyCooldownText()}\n${t('daily_chest_rules')}`);
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
    if (!(this.chestButton instanceof Button) && this.textures.exists(AssetKeys.StyleChests.DailyOpen)) {
      this.chestButton.setTexture(AssetKeys.StyleChests.DailyOpen);
    }
    const xpLine = profile.__dailyRewardXp > 0 ? t('daily_xp_bonus', { amount: profile.__dailyRewardXp }) : '';
    const abilityLine = profile.__dailyRewardAbility ? `, +1 ${t(profile.__dailyRewardAbility)}` : '';
    Toast.show(this, `${t('admiral_chest')}: +${rewardGold} ${t('gold').toLowerCase()}${xpLine}${abilityLine}`);
    SoundService.playSfx(this, SoundService.keys.sfx_reward);
    flyCoins(this, { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 78 }, { x: 930, y: 132 }, 14);
    this.profile = profile;
    this.refreshCareerPanel();
    this.time.delayedCall(850, () => this.refreshChest());
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
      glow.fillStyle(0xb156ff, 0.14);
      glow.fillEllipse(0, -4, 196, 154);
      this.rareChestImage = this.add.image(0, -16, AssetKeys.StyleChests.EpicGlow)
        .setDisplaySize(138, 137);
      this.rareChestLabel = this.add.text(0, 52, t('rare_chest'), {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '17px',
        color: '#fff0bf',
        stroke: '#020812',
        strokeThickness: 3
      }).setOrigin(0.5);
      this.rareChestStatus = this.add.text(0, 80, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#fff5d6',
        align: 'center',
        fixedWidth: 230,
        wordWrap: { width: 230, useAdvancedWrap: true },
        stroke: '#020812',
        strokeThickness: 3
      }).setOrigin(0.5);
      this.rareChestHitZone = this.add.zone(0, -16, 138, 137)
        .setInteractive({ useHandCursor: true });
      this.rareChestContainer.add([glow, this.rareChestImage, this.rareChestLabel, this.rareChestStatus, this.rareChestHitZone]);
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
    this.rareChestStatus?.setText(this.getRareChestStatusText(canClaim));
    this.rareChestImage?.clearTint();
    const textureKey = canClaim ? AssetKeys.StyleChests.EpicGlow : AssetKeys.StyleChests.EpicClosed;
    if (this.rareChestImage && this.textures.exists(textureKey)) {
      this.rareChestImage.setTexture(textureKey);
    }
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
    if (this.rareChestImage && this.textures.exists(AssetKeys.StyleChests.EpicOpen)) {
      this.rareChestImage.setTexture(AssetKeys.StyleChests.EpicOpen);
    }
    Toast.show(this, `${t('rare_chest')}: +${reward.gold} ${t('gold').toLowerCase()}, +${reward.xp} XP`);
    SoundService.playSfx(this, SoundService.keys.sfx_reward);
    flyCoins(this, { x: 224, y: GAME_HEIGHT - 72 }, { x: 930, y: 132 }, 14);
    this.profile = profile;
    this.refreshCareerPanel();
    this.time.delayedCall(850, () => this.refreshRareChest());
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
    return t('opens_in', { time: `${hours}:${String(minutes).padStart(2, '0')}` });
  }

  getRareChestStatusText(canClaim = StorageService.canClaimRareChest()) {
    if (canClaim) {
      return `${t('available')}\n${t('rare_chest_rules')}`;
    }
    const profile = StorageService.loadProfile();
    const last = profile.rareChest?.lastRareChestAt;
    const ms = last ? Math.max(0, 6 * 60 * 60 * 1000 - (Date.now() - new Date(last).getTime())) : 0;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.ceil((ms % 3600000) / 60000);
    const wins = profile.rareChest?.winsSinceRareChest ?? 0;
    return `${t('opens_in', { time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` })}\n${t('wins_until_open', { count: Math.max(0, 3 - wins), current: Math.min(3, wins) })}`;
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
