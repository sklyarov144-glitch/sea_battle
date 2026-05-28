import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { YandexService } from '../services/YandexService.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.createGeneratedTextures();
    YandexService.init();
    this.scene.start('PreloadScene');
  }

  createGeneratedTextures() {
    this.createTexture(AssetKeys.Textures.Cannonball, 28, 28, (graphics) => {
      graphics.fillStyle(0x17191d, 1);
      graphics.fillCircle(14, 14, 11);
      graphics.fillStyle(0xffffff, 0.22);
      graphics.fillCircle(10, 9, 3);
    });

    this.createTexture(AssetKeys.Textures.Coin, 30, 30, (graphics) => {
      graphics.fillStyle(0x8f5f09, 1);
      graphics.fillCircle(15, 16, 12);
      graphics.fillStyle(0xffd764, 1);
      graphics.fillCircle(15, 14, 11);
      graphics.lineStyle(2, 0xfff0a6, 0.9);
      graphics.strokeCircle(15, 14, 7);
    });

    this.createTexture(AssetKeys.Textures.Spark, 22, 22, (graphics) => {
      graphics.fillStyle(0xffe18a, 1);
      graphics.fillCircle(11, 11, 7);
      graphics.fillStyle(0xffffff, 0.85);
      graphics.fillCircle(9, 8, 3);
    });

    this.createTexture(AssetKeys.Textures.Smoke, 64, 64, (graphics) => {
      graphics.fillStyle(0x26313c, 0.6);
      graphics.fillCircle(28, 34, 22);
      graphics.fillStyle(0x65717c, 0.35);
      graphics.fillCircle(38, 25, 18);
      graphics.fillStyle(0x101820, 0.2);
      graphics.fillCircle(24, 22, 14);
    });

    this.createTexture(AssetKeys.Textures.Fire, 34, 34, (graphics) => {
      graphics.fillStyle(0xd83f14, 0.95);
      graphics.fillTriangle(17, 2, 30, 30, 5, 30);
      graphics.fillStyle(0xffd36e, 0.95);
      graphics.fillTriangle(17, 9, 24, 28, 10, 28);
    });

    this.createTexture(AssetKeys.Textures.Splash, 18, 18, (graphics) => {
      graphics.fillStyle(0xc7fbff, 0.9);
      graphics.fillEllipse(9, 9, 8, 12);
      graphics.fillStyle(0xffffff, 0.8);
      graphics.fillCircle(7, 6, 2);
    });

    this.createTexture(AssetKeys.Textures.Chest, 48, 42, (graphics) => {
      graphics.fillStyle(0x5b3215, 1);
      graphics.fillRoundedRect(7, 15, 34, 20, 5);
      graphics.fillStyle(0x8d5727, 1);
      graphics.fillRoundedRect(8, 8, 32, 17, 7);
      graphics.lineStyle(3, 0xf0c35a, 1);
      graphics.strokeRoundedRect(7, 9, 34, 26, 5);
      graphics.fillStyle(0xf0c35a, 1);
      graphics.fillRect(21, 20, 6, 8);
    });

    this.createTexture(AssetKeys.Textures.Mine, 42, 42, (graphics) => {
      graphics.fillStyle(0x1c1f25, 1);
      graphics.fillCircle(21, 21, 13);
      graphics.lineStyle(3, 0x2e3540, 1);
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        graphics.lineBetween(21, 21, 21 + Math.cos(angle) * 18, 21 + Math.sin(angle) * 18);
      }
      graphics.fillStyle(0xd83f14, 1);
      graphics.fillCircle(17, 16, 3);
    });

    this.createTexture(AssetKeys.Textures.Vortex, 48, 48, (graphics) => {
      graphics.lineStyle(4, 0x8fefff, 0.9);
      graphics.beginPath();
      for (let angle = 0; angle < Math.PI * 4.8; angle += 0.28) {
        const radius = 2 + angle * 1.5;
        const x = 24 + Math.cos(angle) * radius;
        const y = 24 + Math.sin(angle) * radius;
        if (angle === 0) {
          graphics.moveTo(x, y);
        } else {
          graphics.lineTo(x, y);
        }
      }
      graphics.strokePath();
    });

    this.createTexture(AssetKeys.Textures.Compass, 42, 42, (graphics) => {
      graphics.fillStyle(0x173a4e, 1);
      graphics.fillCircle(21, 21, 17);
      graphics.lineStyle(2, 0xf0c35a, 1);
      graphics.strokeCircle(21, 21, 16);
      graphics.fillStyle(0xfff0a6, 1);
      graphics.fillTriangle(21, 5, 26, 23, 21, 20);
      graphics.fillStyle(0xff786e, 1);
      graphics.fillTriangle(21, 37, 16, 19, 21, 22);
    });

    this.createTexture(AssetKeys.Textures.ShipFlag, 36, 30, (graphics) => {
      graphics.fillStyle(0x2a170c, 1);
      graphics.fillRect(6, 3, 4, 24);
      graphics.fillStyle(0xf0c35a, 1);
      graphics.fillTriangle(10, 4, 31, 9, 10, 16);
      graphics.fillStyle(0xffffff, 0.75);
      graphics.fillCircle(17, 10, 2);
    });

    this.createTexture(AssetKeys.Textures.Star, 24, 24, (graphics) => {
      graphics.fillStyle(0xfff0a6, 1);
      graphics.fillPoints([
        new Phaser.Geom.Point(12, 1),
        new Phaser.Geom.Point(15, 9),
        new Phaser.Geom.Point(23, 9),
        new Phaser.Geom.Point(17, 14),
        new Phaser.Geom.Point(19, 23),
        new Phaser.Geom.Point(12, 18),
        new Phaser.Geom.Point(5, 23),
        new Phaser.Geom.Point(7, 14),
        new Phaser.Geom.Point(1, 9),
        new Phaser.Geom.Point(9, 9)
      ], true);
    });
  }

  createTexture(key, width, height, draw) {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.add.graphics();
    draw(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}
