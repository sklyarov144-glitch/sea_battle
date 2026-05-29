import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { drawNavalPanel } from '../ui/NavalPanel.js';
import { createSeaBackground } from '../utils/effects.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.image(AssetKeys.Images.MenuBattleBg, '/assets/backgrounds/menu_battle_bg.png');
    this.load.image(AssetKeys.Images.BattleOceanBg, '/assets/backgrounds/battle_ocean_bg.png');

    this.load.audio('music_menu', '/assets/audio/music_menu.mp3');
    this.load.audio('music_battle', '/assets/audio/music_battle.mp3');
    this.load.audio('sfx_click', '/assets/audio/click.wav');
    this.load.audio('sfx_shot', '/assets/audio/shot.wav');
    this.load.audio('sfx_hit', '/assets/audio/hit.wav');
    this.load.audio('sfx_miss', '/assets/audio/miss.wav');
    this.load.audio('sfx_explosion', '/assets/audio/explosion.wav');
    this.load.audio('sfx_reward', '/assets/audio/reward.wav');
    this.load.audio('sfx_rank_up', '/assets/audio/rank_up.wav');
    this.load.audio('sfx_button_hover', '/assets/audio/button_hover.wav');

    this.load.on('loaderror', (file) => {
      if (file?.type === 'audio') {
        console.warn(`[PreloadScene] Audio asset skipped: ${file.key}`);
      }
    });
  }

  create() {
    document.body.dataset.scene = 'PreloadScene';
    createSeaBackground(this);
    drawNavalPanel(this, GAME_WIDTH / 2 - 240, GAME_HEIGHT / 2 - 58, 480, 116);

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
