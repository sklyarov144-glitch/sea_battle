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
      overlayAlpha: 0.2,
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
    this.mainMenuTitleGroup = this.add.container(0, 0);
    const glow = this.add.graphics();
    glow.fillStyle(0x001329, 0.34);
    glow.fillRoundedRect(54, 36, 576, 150, 18);
    glow.lineStyle(2, 0xd7a748, 0.36);
    glow.strokeRoundedRect(60, 42, 564, 138, 16);

    const title1 = this.add.text(86, 76, t('menu_title_line_1'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '38px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 5,
      fixedWidth: 540,
      wordWrap: { width: 540, useAdvancedWrap: false },
      shadow: { offsetX: 0, offsetY: 3, color: '#020812', blur: 2, fill: true }
    }).setOrigin(0, 0.5);

    const title2 = this.add.text(90, 130, t('menu_title_line_2'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '37px',
      color: '#f8d77a',
      stroke: '#020812',
      strokeThickness: 5,
      fixedWidth: 500,
      wordWrap: { width: 500, useAdvancedWrap: false },
      shadow: { offsetX: 0, offsetY: 2, color: '#020812', blur: 2, fill: true }
    }).setOrigin(0, 0.5);

    const line = this.add.graphics();
    line.lineStyle(2, 0xd7a748, 0.75);
    line.lineBetween(90, 176, 520, 176);
    line.lineStyle(1, 0x6db7d4, 0.32);
    line.lineBetween(90, 184, 440, 184);
    this.mainMenuTitleGroup.add([glow, title1, title2, line]);
  }

  addMenuButtons() {
    this.mainMenuButtonsGroup = this.add.container(0, 0);
    const x = 478;
    const startY = 252;
    const gap = 78;
    const width = 370;
    const height = 66;

    const play = new Button(this, x, startY, width, height, t('play'), () => {
      this.scene.start('PreparationScene', {
        levelId: 1,
        battleMode: 'quick',
        returnScene: 'MenuScene'
      });
    }, { variant: 'primary', fontSize: 26 });

    const campaign = new Button(this, x, startY + gap, width, height, t('campaign'), () => {
      this.scene.start('MapScene');
    }, { variant: 'secondary', fontSize: 25 });

    const shop = new Button(this, x, startY + gap * 2, width, height, t('shop'), () => {
      this.scene.start('ShopScene', { from: 'MenuScene' });
    }, { variant: 'secondary', fontSize: 25 });

    const settings = new Button(this, x, startY + gap * 3, width, height, t('settings'), () => {
      this.openSettings();
    }, { variant: 'secondary', fontSize: 24 });

    this.mainMenuButtonsGroup.add([play, campaign, shop, settings]);
  }

  addCareerPanel() {
    this.careerPanelGroup = this.add.container(0, 0);
    const panel = drawNavalPanel(this, 852, 38, 382, 232, { title: t('career'), titleSize: 26 });
    this.careerPanelGroup.add(panel);
    if (this.textures.exists(AssetKeys.StyleIcons.Rank)) {
      this.careerPanelGroup.add(this.add.image(1134, 122, AssetKeys.StyleIcons.Rank).setDisplaySize(86, 86));
    } else {
      this.careerPanelGroup.add(drawCareerEmblem(this, 1134, 122, 0.9));
    }
    if (this.textures.exists(AssetKeys.StyleIcons.Gold)) {
      this.careerPanelGroup.add(this.add.image(886, 155, AssetKeys.StyleIcons.Gold).setDisplaySize(30, 30));
    }
    if (this.textures.exists(AssetKeys.StyleIcons.Xp)) {
      this.careerPanelGroup.add(this.add.image(886, 190, AssetKeys.StyleIcons.Xp).setDisplaySize(28, 28));
    }

    this.rankText = this.add.text(886, 88, '', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#fff0bf',
      fixedWidth: 230,
      wordWrap: { width: 230, useAdvancedWrap: true },
      stroke: '#020812',
      strokeThickness: 3
    });
    this.goldText = this.add.text(910, 143, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#fff5d6',
      stroke: '#020812',
      strokeThickness: 2,
      fixedWidth: 184,
      wordWrap: { width: 184, useAdvancedWrap: true }
    });
    this.xpText = this.add.text(910, 179, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      color: '#d9fbff',
      stroke: '#020812',
      strokeThickness: 2,
      fixedWidth: 188,
      wordWrap: { width: 188, useAdvancedWrap: true }
    });

    this.careerBar = this.add.graphics();
    this.careerPanelGroup.add([this.rankText, this.goldText, this.xpText, this.careerBar]);
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
    this.careerBar.fillRoundedRect(886, 222, 306, 20, 8);
    this.careerBar.fillStyle(0x113a58, 0.96);
    this.careerBar.fillRoundedRect(890, 226, 298, 12, 6);
    this.careerBar.fillStyle(0x14bff4, 0.98);
    this.careerBar.fillRoundedRect(890, 226, Math.max(10, 298 * progress), 12, 6);
    this.careerBar.lineStyle(1, 0xf8d77a, 0.72);
    this.careerBar.strokeRoundedRect(890, 226, 298, 12, 6);
  }

  addAdmiralChest() {
    const x = 772;
    const y = 622;
    const width = 468;
    const height = 132;
    if (this.textures.exists(AssetKeys.Images.DailyChestReward)) {
      drawNavalPanel(this, x - width / 2, y - height / 2, width, height, { alpha: 0.88, radius: 14 });
      this.chestContainer = this.add.container(x, y);
      this.chestRewardsGroup = this.chestRewardsGroup ?? this.add.container(0, 0);
      this.chestGlow = this.add.graphics();
      this.chestGlow.fillStyle(0xd7a748, 0.09);
      this.chestGlow.fillEllipse(-132, 10, 188, 102);
      this.chestButton = this.add.image(-132, 0, AssetKeys.StyleChests.DailyGlow)
        .setDisplaySize(142, 142);
      const title = this.add.text(16, -44, t('admiral_chest'), {
        fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 3,
      align: 'center',
      fixedWidth: 260,
      wordWrap: { width: 260, useAdvancedWrap: true }
    }).setOrigin(0.5);
      this.dailyChestStatus = this.add.text(26, 6, '', {
        fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#fff5d6',
      align: 'center',
      fixedWidth: 270,
      fixedHeight: 52,
      wordWrap: { width: 270, useAdvancedWrap: true },
      stroke: '#020812',
      strokeThickness: 2
    }).setOrigin(0.5);
      this.chestHitZone = this.add.zone(0, 0, width, height)
        .setInteractive({ useHandCursor: true });
      this.chestContainer.add([this.chestGlow, this.chestButton, title, this.dailyChestStatus, this.chestHitZone]);
      this.chestBaseScale = 1;
      this.chestHitZone.on('pointerover', () => {
        if (StorageService.canClaimDailyReward()) {
          this.chestContainer.setAlpha(1);
        }
      });
      this.chestHitZone.on('pointerout', () => {
        this.chestContainer.setScale(this.chestBaseScale);
      });
      this.chestHitZone.on('pointerup', () => this.claimDailyReward());
    } else {
      this.chestButton = new Button(this, x, y, 300, 56, t('admiral_chest'), () => this.claimDailyReward(), {
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
    const x = 302;
    const y = 622;
    const width = 408;
    const height = 132;
    if (this.textures.exists(AssetKeys.Images.RareChestReward)) {
      drawNavalPanel(this, x - width / 2, y - height / 2, width, height, { alpha: 0.88, radius: 14 });
      this.rareChestContainer = this.add.container(x, y);
      const glow = this.add.graphics();
      glow.fillStyle(0xb156ff, 0.09);
      glow.fillEllipse(-112, 10, 172, 104);
      this.rareChestImage = this.add.image(-112, 2, AssetKeys.StyleChests.EpicGlow)
        .setDisplaySize(132, 132);
      this.rareChestLabel = this.add.text(54, -44, t('rare_chest'), {
        fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '23px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 3,
      align: 'center',
      fixedWidth: 210,
      wordWrap: { width: 210, useAdvancedWrap: true }
    }).setOrigin(0.5);
      this.rareChestStatus = this.add.text(54, 8, '', {
        fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#fff5d6',
      align: 'center',
      fixedWidth: 220,
      fixedHeight: 54,
      wordWrap: { width: 220, useAdvancedWrap: true },
      stroke: '#020812',
      strokeThickness: 2
    }).setOrigin(0.5);
      this.rareChestHitZone = this.add.zone(0, 0, width, height)
        .setInteractive({ useHandCursor: true });
      this.rareChestContainer.add([glow, this.rareChestImage, this.rareChestLabel, this.rareChestStatus, this.rareChestHitZone]);
      this.rareChestHitZone.on('pointerover', () => {
        if (StorageService.canClaimRareChest()) {
          this.rareChestContainer.setAlpha(1);
        }
      });
      this.rareChestHitZone.on('pointerout', () => {
        this.rareChestContainer.setScale(1);
      });
      this.rareChestHitZone.on('pointerup', () => this.claimRareChest());
    } else {
      this.rareChestButton = new Button(this, x, y, 300, 50, t('rare_chest_open'), () => this.claimRareChest(), {
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
      fontStyle: 'bold',
      fixedWidth: 472,
      wordWrap: { width: 472, useAdvancedWrap: true }
    });
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 54, t('rank_up_text'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '23px',
      color: '#d9fbff',
      align: 'center',
      fixedWidth: 440,
      wordWrap: { width: 440, useAdvancedWrap: true }
    }).setOrigin(0.5);
    const rank = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 8, rankUp.rankName, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 4,
      align: 'center',
      fixedWidth: 450,
      wordWrap: { width: 450, useAdvancedWrap: true }
    }).setOrigin(0.5);
    const reward = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, `${t('rank_reward')}: +${rankUp.rewardGold} ${t('gold').toLowerCase()}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#f8d77a',
      align: 'center',
      fixedWidth: 430,
      wordWrap: { width: 430, useAdvancedWrap: true }
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
