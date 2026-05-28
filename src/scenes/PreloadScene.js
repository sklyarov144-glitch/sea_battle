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

    this.load.image(AssetKeys.Buttons.AutoPlace, '/assets/ui/buttons/button_auto_place.png');
    this.load.image(AssetKeys.Buttons.Campaign, '/assets/ui/buttons/button_campaign.png');
    this.load.image(AssetKeys.Buttons.Cancel, '/assets/ui/buttons/button_cancel.png');
    this.load.image(AssetKeys.Buttons.Map, '/assets/ui/buttons/button_map.png');
    this.load.image(AssetKeys.Buttons.Play, '/assets/ui/buttons/button_play.png');
    this.load.image(AssetKeys.Buttons.QuickBattle, '/assets/ui/buttons/button_quick_battle.png');
    this.load.image(AssetKeys.Buttons.Ready, '/assets/ui/buttons/button_ready.png');
    this.load.image(AssetKeys.Buttons.Settings, '/assets/ui/buttons/button_settings.png');

    this.load.image(AssetKeys.Icons.AutoPlace, '/assets/ui/icons/auto_place.png');
    this.load.image(AssetKeys.Icons.Campaign, '/assets/ui/icons/campaign.png');
    this.load.image(AssetKeys.Icons.Cancel, '/assets/ui/icons/cancel.png');
    this.load.image(AssetKeys.Icons.Ready, '/assets/ui/icons/ready.png');
    this.load.image(AssetKeys.Icons.Settings, '/assets/ui/icons/settings.png');
    this.load.image(AssetKeys.Icons.Ships, '/assets/ui/icons/ships.png');
    this.load.image(AssetKeys.Icons.Upgrades, '/assets/ui/icons/upgrades.png');
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
