import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene.js';
import { PreloadScene } from '../scenes/PreloadScene.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { MapScene } from '../scenes/MapScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { ResultScene } from '../scenes/ResultScene.js';
import { ShopScene } from '../scenes/ShopScene.js';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#082f49',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  render: {
    antialias: true,
    pixelArt: false
  },
  dom: {
    createContainer: false
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    MapScene,
    GameScene,
    ResultScene,
    ShopScene
  ]
};
