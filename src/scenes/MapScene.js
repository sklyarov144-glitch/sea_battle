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
      overlayAlpha: 0.07,
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

    const title = this.add.text(GAME_WIDTH / 2, 36, t('campaign'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '46px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 3, color: '#020812', blur: 3, fill: true }
    }).setOrigin(0.5);

    const completed = this.getCompletedCount();
    const progressText = this.add.text(GAME_WIDTH / 2, 78, `${completed}/${CAMPAIGN_LEVEL_COUNT}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#d9fbff',
      stroke: '#020812',
      strokeThickness: 3
    }).setOrigin(0.5);

    const bar = this.add.graphics();
    bar.fillStyle(0x020812, 0.72);
    bar.fillRoundedRect(468, 72, 396, 16, 8);
    bar.fillStyle(0x092c49, 0.95);
    bar.fillRoundedRect(472, 76, 388, 8, 4);
    bar.fillStyle(0x13c7f6, 0.96);
    bar.fillRoundedRect(472, 76, Math.max(10, 388 * completed / CAMPAIGN_LEVEL_COUNT), 8, 4);
    bar.lineStyle(1, 0xf8d77a, 0.68);
    bar.strokeRoundedRect(468, 72, 396, 16, 8);

    const rewardChest = this.add.image(904, 58, AssetKeys.StyleChests.NavalClosed).setDisplaySize(54, 54);
    const stars = this.add.text(952, 56, `${this.getCampaignStars()} / 50 ★`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 3
    }).setOrigin(0, 0.5);

    const goldIcon = this.textures.exists(AssetKeys.StyleIcons.Gold)
      ? this.add.image(1030, 82, AssetKeys.StyleIcons.Gold).setDisplaySize(22, 22)
      : null;
    const gold = this.add.text(1050, 82, String(this.profile.gold), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#fff5d6',
      stroke: '#020812',
      strokeThickness: 3
    }).setOrigin(0, 0.5);

    this.campaignHeaderGroup.add([back, shop, title, bar, progressText, rewardChest, stars, gold, ...(goldIcon ? [goldIcon] : [])]);
  }

  addChapterTabs() {
    const y = 128;
    const startX = 188;
    const gap = 206;

    CHAPTERS.forEach((chapter, index) => {
      const unlocked = this.profile.unlockedLevel >= chapter.levelRange[0];
      const selected = index === this.selectedChapterIndex;
      const button = new Button(this, startX + index * gap, y, 164, 42, `${t('chapter')} ${index + 1}`, () => {
        this.scene.restart({ chapterIndex: index });
      }, {
        variant: selected ? 'primary' : 'secondary',
        selected,
        disabled: false,
        fontSize: 15,
        small: true,
        strictHitArea: true
      });
      button.setAlpha(unlocked ? 1 : 0.58);
      this.chapterTabsGroup.add(button);
    });

    this.addChapterBanner();
  }

  addChapterBanner() {
    const chapterUnlocked = this.profile.unlockedLevel >= CHAPTERS[this.selectedChapterIndex].levelRange[0];
    const roman = ['I', 'II', 'III', 'IV', 'V'][this.selectedChapterIndex];
    const banner = drawNavalPanel(this, GAME_WIDTH / 2 - 238, 166, 476, 52, { alpha: 0.9, radius: 12 });
    const title = this.add.text(GAME_WIDTH / 2, 181, `${t('chapter')} ${roman} — ${CAMPAIGN_CHAPTER_TITLES[this.selectedChapterIndex]}`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: chapterUnlocked ? '#fff0bf' : '#aeb8c4',
      stroke: '#020812',
      strokeThickness: 3
    }).setOrigin(0.5);
    const hint = this.add.text(GAME_WIDTH / 2, 207, chapterUnlocked ? '' : t('opens_after_previous_chapter'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#f8d77a',
      stroke: '#020812',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.chapterTabsGroup.add([banner, title, hint]);
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
    route.setDepth(1);
    for (let index = 0; index < CAMPAIGN_NODE_POSITIONS.length - 1; index += 1) {
      const from = CAMPAIGN_NODE_POSITIONS[index];
      const to = CAMPAIGN_NODE_POSITIONS[index + 1];
      const active = levels[index + 1]?.id <= this.profile.unlockedLevel;
      this.drawDottedRoute(route, from, to, active, index);
    }
    this.campaignNodesGroup.add(route);
  }

  drawDottedRoute(graphics, from, to, active, index) {
    const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
    const steps = Math.max(12, Math.floor(distance / 12));
    const curve = CAMPAIGN_NODE_POSITIONS[index]?.curve ?? 18;
    const points = [];
    for (let step = 0; step <= steps; step += 1) {
      const tValue = step / steps;
      const x = Phaser.Math.Linear(from.x, to.x, tValue);
      const y = Phaser.Math.Linear(from.y, to.y, tValue) + Math.sin(tValue * Math.PI) * curve;
      points.push({ x, y });
    }

    graphics.lineStyle(7, 0x020812, 0.42);
    for (let indexPoint = 0; indexPoint < points.length - 1; indexPoint += 2) {
      const a = points[indexPoint];
      const b = points[indexPoint + 1];
      graphics.lineBetween(a.x, a.y, b.x, b.y);
    }

    graphics.lineStyle(active ? 3 : 2.5, active ? 0xffe0a6 : 0xffe0a6, active ? 0.95 : 0.5);
    for (let indexPoint = 0; indexPoint < points.length - 1; indexPoint += 2) {
      const a = points[indexPoint];
      const b = points[indexPoint + 1];
      graphics.lineBetween(a.x, a.y, b.x, b.y);
    }

    graphics.fillStyle(active ? 0xf8d77a : 0xffe0a6, active ? 0.92 : 0.56);
    points.forEach((point, indexPoint) => {
      if (indexPoint % 4 === 0) {
        graphics.fillCircle(point.x, point.y, active ? 3.8 : 3.2);
      }
    });
  }

  getIslandDisplaySize(boss, position) {
    return {
      width: boss ? 174 : 188 * position.scale,
      height: boss ? 124 : 102 * position.scale
    };
  }

  createIslandImage(islandKey, position, boss, unlocked, container) {
    const size = this.getIslandDisplaySize(boss, position);
    const maskGraphics = this.add.graphics();
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillEllipse(0, 2, size.width * 0.92, size.height * 0.86);
    maskGraphics.setVisible(false);
    container.add(maskGraphics);

    const island = this.add.image(0, 0, islandKey)
      .setDisplaySize(size.width, size.height)
      .setAlpha(unlocked ? 1 : 0.62);
    island.setMask(maskGraphics.createGeometryMask());
    if (!unlocked) {
      island.setTint(0x56606b);
    }
    return island;
  }

  createIslandNode(position, level, index) {
    const unlocked = level.id <= this.profile.unlockedLevel;
    const completed = this.completedLevels.has(level.id) || level.id < this.profile.unlockedLevel;
    const current = level.id === this.profile.unlockedLevel;
    const boss = index === 9;
    const islandKey = getIslandKey(this.selectedChapterIndex, index);
    const container = this.add.container(position.x, position.y);
    container.setDepth(3);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x001322, 0.36);
    shadow.fillEllipse(4, 18, boss ? 188 : 178, boss ? 104 : 92);
    container.add(shadow);

    if (current) {
      const glow = this.add.graphics();
      glow.fillStyle(0xf8d77a, 0.28);
      glow.fillEllipse(0, 10, boss ? 216 : 202, boss ? 122 : 112);
      container.add(glow);
      this.tweens.add({ targets: container, scale: 1.035, yoyo: true, repeat: -1, duration: 1050, ease: 'Sine.inOut' });
    }

    const island = this.createIslandImage(islandKey, position, boss, unlocked, container);
    container.add(island);

    const medallion = this.add.graphics();
    medallion.fillStyle(0x000000, 0.32);
    medallion.fillCircle(4, 6, boss ? 29 : 26);
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
    stars.setPosition(0, boss ? 40 : 36);
    container.add(stars);

    const label = this.add.text(0, position.labelY, level.name, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '14px',
      color: unlocked ? '#fff5d6' : '#b9c3cf',
      align: 'center',
      fixedWidth: 150,
      wordWrap: { width: 150, useAdvancedWrap: true },
      stroke: '#020812',
      strokeThickness: 4
    }).setOrigin(0.5, 0);
    container.add(label);

    const hitZone = this.add.zone(position.x, position.y + 8, boss ? 174 : 160, boss ? 132 : 118)
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
    const x = 236;
    const y = 638;
    const width = 804;
    const height = 84;
    const stars = this.getCampaignStars();
    drawNavalPanel(this, x, y - 42, width, height, { alpha: 0.9, radius: 14 });

    const title = this.add.text(x + 28, y - 25, t('campaign_stars'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#fff0bf',
      stroke: '#020812',
      strokeThickness: 3
    });
    const value = this.add.text(x + 232, y - 25, `${stars} / 50 ★`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px',
      color: '#f8d77a',
      stroke: '#020812',
      strokeThickness: 3
    });

    const bar = this.add.graphics();
    const barX = x + 30;
    const barY = y + 23;
    const barW = 486;
    bar.fillStyle(0x020812, 0.78);
    bar.fillRoundedRect(barX, barY, barW, 12, 6);
    bar.fillStyle(0x10bff4, 0.95);
    bar.fillRoundedRect(barX + 2, barY + 2, Math.max(8, (barW - 4) * Math.min(1, stars / 50)), 8, 4);

    STAR_REWARD_THRESHOLDS.forEach((reward, index) => {
      const chestX = x + 558 + index * 50;
      const available = stars >= reward.stars;
      const key = available && this.textures.exists(AssetKeys.StyleChests.NavalGlow)
        ? AssetKeys.StyleChests.NavalGlow
        : reward.chestKey;
      const chest = this.add.image(chestX, y + 4, key).setDisplaySize(46, 46).setAlpha(available ? 1 : 0.48);
      const threshold = this.add.text(chestX, y - 31, `${reward.label}★`, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '14px',
        color: available ? '#fff0bf' : '#8d99a6',
        stroke: '#020812',
        strokeThickness: 2
      }).setOrigin(0.5);
      this.campaignRewardsGroup.add([chest, threshold]);
    });

    drawNavalPanel(this, 1044, y - 42, 212, height, { alpha: 0.9, radius: 14 });
    const next = STAR_REWARD_THRESHOLDS.find((reward) => stars < reward.stars) ?? STAR_REWARD_THRESHOLDS.at(-1);
    const nextChest = this.add.image(1094, y + 4, next.chestKey).setDisplaySize(56, 56);
    const nextText = this.add.text(1142, y - 21, `${t('next_reward')}\n${next.stars}★`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '16px',
      color: '#fff0bf',
      lineSpacing: 1,
      stroke: '#020812',
      strokeThickness: 3,
      fixedWidth: 94,
      wordWrap: { width: 94, useAdvancedWrap: true }
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
