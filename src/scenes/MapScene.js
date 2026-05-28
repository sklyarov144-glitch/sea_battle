import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { LEVELS } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { StorageService } from '../services/StorageService.js';
import { Button } from '../ui/Button.js';
import { Toast } from '../ui/Toast.js';
import { createSeaBackground, drawWoodPanel } from '../utils/effects.js';

export class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  create() {
    document.body.dataset.scene = 'MapScene';
    this.profile = StorageService.loadProfile();
    createSeaBackground(this, { waterSkin: this.profile.selectedSkins.water });

    this.addHeader();
    this.addIslandPath();
    this.addNavigation();
  }

  addHeader() {
    drawWoodPanel(this, 44, 28, 1192, 82);
    this.add.text(80, 54, 'Кампания', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '36px',
      color: '#fff0bf'
    });
    this.add.text(730, 58, `Открыто: ${this.profile.unlockedLevel}/10   Золото: ${this.profile.gold}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '25px',
      color: '#d9fbff'
    });
  }

  addIslandPath() {
    const positions = [
      { x: 142, y: 552 },
      { x: 248, y: 438 },
      { x: 382, y: 500 },
      { x: 500, y: 364 },
      { x: 638, y: 424 },
      { x: 758, y: 286 },
      { x: 886, y: 352 },
      { x: 1004, y: 232 },
      { x: 1108, y: 338 },
      { x: 1132, y: 520 }
    ];

    const route = this.add.graphics();
    route.lineStyle(5, 0xf0c35a, 0.55);
    route.beginPath();
    route.moveTo(positions[0].x, positions[0].y);
    positions.slice(1).forEach((position) => route.lineTo(position.x, position.y));
    route.strokePath();

    positions.forEach((position, index) => {
      const level = LEVELS[index];
      const unlocked = level.id <= this.profile.unlockedLevel;
      this.createIsland(position, level, unlocked);
    });
  }

  createIsland(position, level, unlocked) {
    const container = this.add.container(position.x, position.y);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.2);
    shadow.fillEllipse(5, 18, 122, 42);

    const island = this.add.graphics();
    island.fillStyle(unlocked ? 0xd9b36d : 0x59636c, unlocked ? 1 : 0.72);
    island.fillEllipse(0, 0, 112, 70);
    island.fillStyle(unlocked ? 0x2b8a4b : 0x3c4a52, unlocked ? 0.96 : 0.72);
    island.fillEllipse(-10, -6, 62, 36);
    island.fillStyle(unlocked ? 0x39a96b : 0x46525b, unlocked ? 0.9 : 0.72);
    island.fillEllipse(20, 4, 48, 32);

    const palm = this.add.text(-10, -23, unlocked ? '🌴' : '🔒', {
      fontSize: unlocked ? '34px' : '30px'
    }).setOrigin(0.5);

    const number = this.add.text(0, 39, String(level.id), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '26px',
      color: unlocked ? '#fff5d6' : '#b7c2ce',
      stroke: '#2b170b',
      strokeThickness: 4
    }).setOrigin(0.5);

    const label = this.add.text(0, 72, level.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: unlocked ? '#fff5d6' : '#b7c2ce',
      align: 'center',
      fixedWidth: 160,
      wordWrap: { width: 160, useAdvancedWrap: true }
    }).setOrigin(0.5, 0);

    container.add([shadow, island, palm, number, label]);
    container.setAlpha(unlocked ? 1 : 0.62);

    const hitZone = this.add.zone(position.x, position.y, 150, 126).setInteractive({ useHandCursor: unlocked });

    if (unlocked) {
      hitZone.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.08, duration: 140 }));
      hitZone.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 140 }));
      hitZone.on('pointerup', () => this.scene.start('PreparationScene', { levelId: level.id }));
    } else {
      hitZone.on('pointerup', () => Toast.show(this, 'Этот остров пока закрыт'));
    }
  }

  addNavigation() {
    new Button(this, 124, GAME_HEIGHT - 54, 170, 50, 'Назад', () => {
      this.scene.start('MenuScene');
    }, {
      iconKey: AssetKeys.Icons.Cancel,
      backgroundKey: AssetKeys.Buttons.Cancel,
      fontSize: 22
    });

    new Button(this, GAME_WIDTH - 126, GAME_HEIGHT - 54, 190, 50, 'Магазин', () => {
      this.scene.start('ShopScene', { from: 'MapScene' });
    }, {
      iconKey: AssetKeys.Icons.Upgrades,
      backgroundKey: AssetKeys.Buttons.Map,
      fontSize: 22
    });
  }
}
