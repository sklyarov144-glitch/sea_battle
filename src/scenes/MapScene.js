import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { CAMPAIGN_LEVEL_COUNT, CHAPTERS, LEVELS } from '../config/balanceConfig.js';
import {
  CAMPAIGN_CHAPTER_TITLES,
  CAMPAIGN_NODE_POSITIONS,
  STAR_REWARD_THRESHOLDS,
  getIslandKey
} from '../config/campaignVisualConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { LocalizationService, t } from '../services/LocalizationService.js';
import { SoundService } from '../services/SoundService.js';
import { StorageService } from '../services/StorageService.js';
import { Button } from '../ui/Button.js';
import { drawNavalPanel } from '../ui/NavalPanel.js';
import { Toast } from '../ui/Toast.js';
import { createCoverImageBackground } from '../utils/effects.js';

export class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  init(data) {
    this.requestedChapterIndex = data?.chapterIndex;
  }

  create() {
    document.body.dataset.scene = 'MapScene';
    this.profile = StorageService.loadProfile();
    LocalizationService.init(this.profile);
    SoundService.init(this.profile);
    SoundService.playMusic(this, SoundService.keys.music_menu);
    createCoverImageBackground(this, AssetKeys.Images.CampaignBg, {
      fallback: { waterSkin: this.profile.selectedSkins.water },
      overlayAlpha: 0.12,
      overlayColor: 0x061827,
      animate: false
    });

    this.selectedChapterIndex = Phaser.Math.Clamp(
      this.requestedChapterIndex ?? Math.ceil((this.profile.unlockedLevel || 1) / 10) - 1,
      0,
      CHAPTERS.length - 1
    );
    this.completedLevels = new Set(this.profile.completedLevels ?? []);

    this.campaignHeaderGroup = this.add.container(0, 0);
    this.chapterTabsGroup = this.add.container(0, 0);
    this.campaignNodesGroup = this.add.container(0, 0);
    this.campaignRewardsGroup = this.add.container(0, 0);

    this.addHeader();
    this.addChapterTabs();
    this.addMissionPath();
    this.addStarRewards();
  }

  addHeader() {
    this.campaignHeaderGroup.add(drawNavalPanel(this, 20, 12, 1240, 92, { alpha: 0.94, radius: 14 }));

    const back = new Button(this, 122, 58, 176, 54, t('back'), () => {
      this.scene.start('MenuScene');
    }, {
      variant: 'danger',
      fontSize: 21,
      strictHitArea: true
    });

    const shop = new Button(this, 1144, 58, 176, 54, t('shop'), () => {
      this.scene.start('ShopScene', { from: 'MapScene' });
    }, {
      variant: 'secondary',
      fontSize: 21,
      strictHitArea: true
    });

    const title = this.add.text(GAME_WIDTH / 2, 38, t('campaign'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '46px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 3, color: '#020812', blur: 3, fill: true }
    }).setOrigin(0.5);

    const completed = this.getCompletedCount();
    const progress = this.add.text(GAME_WIDTH / 2, 78, `${completed}/${CAMPAIGN_LEVEL_COUNT}  •  ${t('gold')}: ${this.profile.gold}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      color: '#d9fbff',
      stroke: '#020812',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.campaignHeaderGroup.add([back, shop, title, progress]);
  }

  addChapterTabs() {
    const y = 132;
    const startX = 214;
    const gap = 214;

    CHAPTERS.forEach((chapter, index) => {
      const unlocked = this.profile.unlockedLevel >= chapter.levelRange[0];
      const selected = index === this.selectedChapterIndex;
      const button = new Button(this, startX + index * gap, y, 176, 44, `${t('chapter')} ${index + 1}`, () => {
        this.scene.restart({ chapterIndex: index });
      }, {
        variant: selected ? 'primary' : 'secondary',
        selected,
        disabled: false,
        fontSize: 16,
        small: true,
        strictHitArea: true
      });
      button.setAlpha(unlocked ? 1 : 0.58);
      const label = this.add.text(startX + index * gap, y + 38, CAMPAIGN_CHAPTER_TITLES[index], {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '15px',
        color: selected ? '#fff0bf' : '#d9fbff',
        align: 'center',
        fixedWidth: 174,
        wordWrap: { width: 174, useAdvancedWrap: true },
        stroke: '#020812',
        strokeThickness: 3
      }).setOrigin(0.5, 0);
      label.setAlpha(unlocked ? 1 : 0.66);
      this.chapterTabsGroup.add([button, label]);
    });
  }

  addMissionPath() {
    const chapter = CHAPTERS[this.selectedChapterIndex];
    const chapterLevels = LEVELS.slice(chapter.levelRange[0] - 1, chapter.levelRange[1]);
    this.drawRoute(chapterLevels);
    chapterLevels.forEach((level, index) => {
      this.createIslandNode(CAMPAIGN_NODE_POSITIONS[index], level, index);
    });
  }

  drawRoute(levels) {
    const route = this.add.graphics();
    route.setDepth(-1);
    for (let index = 0; index < CAMPAIGN_NODE_POSITIONS.length - 1; index += 1) {
      const from = CAMPAIGN_NODE_POSITIONS[index];
      const to = CAMPAIGN_NODE_POSITIONS[index + 1];
      const active = levels[index + 1]?.id <= this.profile.unlockedLevel;
      this.drawDottedRoute(route, from, to, active);
    }
    this.campaignNodesGroup.add(route);
  }

  drawDottedRoute(graphics, from, to, active) {
    const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
    const steps = Math.max(8, Math.floor(distance / 18));
    graphics.fillStyle(active ? 0xf8d77a : 0x61707f, active ? 0.82 : 0.46);
    for (let step = 0; step <= steps; step += 1) {
      if (step % 2 !== 0) continue;
      const tValue = step / steps;
      const x = Phaser.Math.Linear(from.x, to.x, tValue);
      const y = Phaser.Math.Linear(from.y, to.y, tValue) + Math.sin(tValue * Math.PI) * 18;
      graphics.fillCircle(x, y, active ? 3.2 : 2.8);
    }
  }

  createIslandNode(position, level, index) {
    const unlocked = level.id <= this.profile.unlockedLevel;
    const completed = this.completedLevels.has(level.id) || level.id < this.profile.unlockedLevel;
    const current = level.id === this.profile.unlockedLevel;
    const boss = index === 9;
    const islandKey = getIslandKey(this.selectedChapterIndex, index);
    const container = this.add.container(position.x, position.y);

    if (current) {
      const glow = this.add.graphics();
      glow.fillStyle(0xf8d77a, 0.24);
      glow.fillEllipse(0, 8, 190, 104);
      container.add(glow);
      this.tweens.add({ targets: container, scale: 1.035, yoyo: true, repeat: -1, duration: 1050, ease: 'Sine.inOut' });
    }

    const island = this.add.image(0, 0, islandKey)
      .setScale(position.scale)
      .setAlpha(unlocked ? 1 : 0.58);
    if (!unlocked) {
      island.setTint(0x515762);
    }
    container.add(island);

    const medallion = this.add.graphics();
    medallion.fillStyle(0x031827, 0.92);
    medallion.fillCircle(0, 2, boss ? 26 : 23);
    medallion.lineStyle(4, boss ? 0xe1513d : 0xd7a748, 0.95);
    medallion.strokeCircle(0, 2, boss ? 26 : 23);
    container.add(medallion);

    const number = this.add.text(0, 2, unlocked ? String(level.id) : '🔒', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: unlocked ? '24px' : '21px',
      color: unlocked ? '#fff0bf' : '#b9c3cf',
      stroke: '#020812',
      strokeThickness: 4
    }).setOrigin(0.5);
    container.add(number);

    const stars = this.createStars(completed ? 3 : 0, unlocked);
    stars.setPosition(0, 34);
    container.add(stars);

    const label = this.add.text(0, position.labelY, level.name, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '15px',
      color: unlocked ? '#fff5d6' : '#b9c3cf',
      align: 'center',
      fixedWidth: 156,
      wordWrap: { width: 156, useAdvancedWrap: true },
      stroke: '#020812',
      strokeThickness: 4
    }).setOrigin(0.5, 0);
    container.add(label);

    const hitZone = this.add.zone(position.x, position.y + 8, 150, 118)
      .setInteractive({ useHandCursor: unlocked });

    if (unlocked) {
      hitZone.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.08, duration: 130, ease: 'Sine.easeOut' }));
      hitZone.on('pointerout', () => this.tweens.add({ targets: container, scale: current ? 1.035 : 1, duration: 130, ease: 'Sine.easeOut' }));
      hitZone.on('pointerup', () => this.scene.start('PreparationScene', {
        levelId: level.id,
        battleMode: 'campaign',
        returnScene: 'MapScene'
      }));
    } else {
      hitZone.on('pointerup', () => Toast.show(this, t('locked_island')));
    }

    this.campaignNodesGroup.add([container, hitZone]);
  }

  createStars(count, unlocked) {
    const group = this.add.container(0, 0);
    for (let index = 0; index < 3; index += 1) {
      const star = this.add.text((index - 1) * 20, 0, '★', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '22px',
        color: index < count ? '#ffd768' : (unlocked ? '#526273' : '#38424d'),
        stroke: '#020812',
        strokeThickness: 3
      }).setOrigin(0.5);
      group.add(star);
    }
    return group;
  }

  addStarRewards() {
    const x = 246;
    const y = 626;
    const width = 790;
    const height = 82;
    const stars = this.getCampaignStars();
    drawNavalPanel(this, x, y - 42, width, height, { alpha: 0.9, radius: 14 });

    const title = this.add.text(x + 28, y - 24, t('campaign_stars'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 3
    });
    const value = this.add.text(x + 232, y - 24, `${stars} / 50 ★`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px',
      color: '#f8d77a',
      stroke: '#020812',
      strokeThickness: 3
    });

    const bar = this.add.graphics();
    const barX = x + 30;
    const barY = y + 22;
    const barW = 486;
    bar.fillStyle(0x020812, 0.78);
    bar.fillRoundedRect(barX, barY, barW, 12, 6);
    bar.fillStyle(0x10bff4, 0.95);
    bar.fillRoundedRect(barX + 2, barY + 2, Math.max(8, (barW - 4) * Math.min(1, stars / 50)), 8, 4);

    STAR_REWARD_THRESHOLDS.forEach((reward, index) => {
      const chestX = x + 552 + index * 48;
      const available = stars >= reward.stars;
      const key = available && this.textures.exists(AssetKeys.StyleChests.NavalGlow)
        ? AssetKeys.StyleChests.NavalGlow
        : reward.chestKey;
      const chest = this.add.image(chestX, y + 2, key).setDisplaySize(44, 44).setAlpha(available ? 1 : 0.48);
      const threshold = this.add.text(chestX, y - 32, `${reward.label}★`, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '14px',
        color: available ? '#fff0bf' : '#8d99a6',
        stroke: '#020812',
        strokeThickness: 2
      }).setOrigin(0.5);
      this.campaignRewardsGroup.add([chest, threshold]);
    });

    drawNavalPanel(this, 1060, y - 42, 188, height, { alpha: 0.9, radius: 14 });
    const next = STAR_REWARD_THRESHOLDS.find((reward) => stars < reward.stars) ?? STAR_REWARD_THRESHOLDS.at(-1);
    const nextChest = this.add.image(1102, y + 2, next.chestKey).setDisplaySize(54, 54);
    const nextText = this.add.text(1148, y - 22, `${t('next_reward')}\n${next.stars}★`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '16px',
      color: '#fff0bf',
      lineSpacing: 1,
      stroke: '#020812',
      strokeThickness: 3
    });

    this.campaignRewardsGroup.add([title, value, bar, nextChest, nextText]);
  }

  getCompletedCount() {
    const completed = Math.max(this.completedLevels.size, Math.max(0, (this.profile.unlockedLevel ?? 1) - 1));
    return Math.min(CAMPAIGN_LEVEL_COUNT, completed);
  }

  getCampaignStars() {
    return Math.min(50, this.getCompletedCount());
  }
}
