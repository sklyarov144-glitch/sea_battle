import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { createSeaBackground, drawWoodPanel } from '../utils/effects.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.image(AssetKeys.Images.MenuBattleBg, '/assets/backgrounds/menu_battle_bg.png');
    this.load.image(AssetKeys.Images.BattleOceanBg, '/assets/backgrounds/battle_ocean_bg.png');
  }

  create() {
    document.body.dataset.scene = 'PreloadScene';
    createSeaBackground(this);
    drawWoodPanel(this, GAME_WIDTH / 2 - 240, GAME_HEIGHT / 2 - 58, 480, 116);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'Поднимаем паруса...', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      color: '#fff0bf'
    }).setOrigin(0.5);

    const bar = this.add.graphics();
    bar.fillStyle(0x0e2f45, 1);
    bar.fillRoundedRect(GAME_WIDTH / 2 - 190, GAME_HEIGHT / 2 + 22, 380, 18, 7);
    bar.fillStyle(0xf0c35a, 1);
    bar.fillRoundedRect(GAME_WIDTH / 2 - 186, GAME_HEIGHT / 2 + 26, 372, 10, 5);

    window.setTimeout(() => {
      this.scene.start('MenuScene');
    }, 360);
  }
}
