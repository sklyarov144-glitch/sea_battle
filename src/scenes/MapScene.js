import Phaser from 'phaser';
import { CAMPAIGN_LEVEL_COUNT, CHAPTERS, LEVELS } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { LocalizationService, t } from '../services/LocalizationService.js';
import { SoundService } from '../services/SoundService.js';
import { StorageService } from '../services/StorageService.js';
import { Button } from '../ui/Button.js';
import { drawNavalPanel } from '../ui/NavalPanel.js';
import { Toast } from '../ui/Toast.js';
import { AssetKeys } from '../config/assetKeys.js';
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
      overlayAlpha: 0.38,
      overlayColor: 0x061827
    });
    this.selectedChapterIndex = Phaser.Math.Clamp(
      this.requestedChapterIndex ?? Math.ceil((this.profile.unlockedLevel || 1) / 10) - 1,
      0,
      CHAPTERS.length - 1
    );

    this.addHeader();
    this.addChapterTabs();
    this.addMissionPath();
    this.addNavigation();
  }

  addHeader() {
    drawNavalPanel(this, 44, 28, 1192, 82);
    this.add.text(80, 54, t('campaign'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '36px',
      color: '#fff0bf'
    });
    this.add.text(370, 58, `${t('campaign')}: ${this.profile.unlockedLevel}/${CAMPAIGN_LEVEL_COUNT}   ${t('gold')}: ${this.profile.gold}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#d9fbff',
      fixedWidth: 760
    });
  }

  addChapterTabs() {
    const chapter = CHAPTERS[this.selectedChapterIndex];
    this.add.text(GAME_WIDTH / 2, 130, `${chapter.title}`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '28px',
      color: '#fff0bf'
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 162, chapter.subtitle, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#b7d7e6',
      fixedWidth: 620,
      align: 'center'
    }).setOrigin(0.5);
    const chapterUnlocked = this.profile.unlockedLevel >= chapter.levelRange[0];
    if (!chapterUnlocked) {
      this.add.text(GAME_WIDTH / 2, 184, t('opens_after_previous_chapter'), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#f8d77a',
        fixedWidth: 620,
        align: 'center'
      }).setOrigin(0.5);
    }

    CHAPTERS.forEach((item, index) => {
      const x = 412 + index * 114;
      new Button(this, x, 212, 96, 38, `${t('chapter')} ${index + 1}`, () => {
        this.selectedChapterIndex = index;
        this.scene.restart({ chapterIndex: index });
      }, {
        variant: index === this.selectedChapterIndex ? 'primary' : 'secondary',
        selected: index === this.selectedChapterIndex,
        fontSize: 13,
        small: true
      });
    });
  }

  addMissionPath() {
    const positions = [
      { x: 150, y: 510 },
      { x: 270, y: 410 },
      { x: 402, y: 492 },
      { x: 520, y: 350 },
      { x: 648, y: 432 },
      { x: 760, y: 296 },
      { x: 884, y: 374 },
      { x: 1002, y: 280 },
      { x: 1110, y: 382 },
      { x: 1088, y: 520 }
    ];
    const chapter = CHAPTERS[this.selectedChapterIndex];
    const chapterLevels = LEVELS.slice(chapter.levelRange[0] - 1, chapter.levelRange[1]);

    const route = this.add.graphics();
    route.lineStyle(2, 0xf0c35a, 0.48);
    route.beginPath();
    route.moveTo(positions[0].x, positions[0].y);
    positions.slice(1).forEach((position) => route.lineTo(position.x, position.y));
    route.strokePath();

    positions.forEach((position, index) => {
      const level = chapterLevels[index];
      const unlocked = level.id <= this.profile.unlockedLevel;
      this.createMissionMarker(position, level, unlocked);
    });
  }

  createMissionMarker(position, level, unlocked) {
    const container = this.add.container(position.x, position.y);
    const marker = this.add.graphics();
    marker.fillStyle(0x000000, 0.24);
    marker.fillCircle(5, 7, 40);
    marker.fillStyle(unlocked ? 0x0e3b55 : 0x172331, unlocked ? 0.98 : 0.78);
    marker.fillCircle(0, 0, 38);
    marker.lineStyle(5, unlocked ? 0xd7a748 : 0x53606b, unlocked ? 0.95 : 0.65);
    marker.strokeCircle(0, 0, 36);
    marker.lineStyle(1, unlocked ? 0x9ee8ff : 0x75808b, unlocked ? 0.78 : 0.45);
    marker.strokeCircle(0, 0, 26);
    marker.lineStyle(2, unlocked ? 0xf6d37c : 0x59636c, unlocked ? 0.62 : 0.35);
    marker.lineBetween(-18, 0, 18, 0);
    marker.lineBetween(0, -18, 0, 18);

    const number = this.add.text(0, unlocked ? 0 : -2, unlocked ? String(level.id) : '🔒', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: unlocked ? '24px' : '22px',
      color: unlocked ? '#fff5d6' : '#b7c2ce',
      stroke: '#2b170b',
      strokeThickness: unlocked ? 3 : 0
    }).setOrigin(0.5);

    const label = this.add.text(0, 48, level.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: unlocked ? '#fff5d6' : '#b7c2ce',
      align: 'center',
      fixedWidth: 146,
      wordWrap: { width: 146, useAdvancedWrap: true }
    }).setOrigin(0.5, 0);

    container.add([marker, number, label]);
    container.setAlpha(unlocked ? 1 : 0.62);

    const hitZone = this.add.zone(position.x, position.y, 120, 112).setInteractive({ useHandCursor: unlocked });

    if (unlocked) {
      hitZone.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.08, duration: 140 }));
      hitZone.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 140 }));
      hitZone.on('pointerup', () => this.scene.start('PreparationScene', {
        levelId: level.id,
        battleMode: 'campaign',
        returnScene: 'MapScene'
      }));
    } else {
      hitZone.on('pointerup', () => Toast.show(this, t('locked_island')));
    }
  }

  addNavigation() {
    new Button(this, 134, GAME_HEIGHT - 58, 188, 52, t('back'), () => {
      this.scene.start('MenuScene');
    }, {
      variant: 'danger',
      fontSize: 19
    });

    new Button(this, GAME_WIDTH - 140, GAME_HEIGHT - 58, 196, 52, t('shop'), () => {
      this.scene.start('ShopScene', { from: 'MapScene' });
    }, {
      variant: 'secondary',
      fontSize: 20
    });
  }
}
