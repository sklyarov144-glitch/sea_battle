import Phaser from 'phaser';
import { UITheme } from './theme.js';

export class UIPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, options = {}) {
    super(scene, x, y);
    this.widthValue = width;
    this.heightValue = height;
    this.options = {
      title: '',
      titleSize: 22,
      alpha: 0.94,
      radius: UITheme.radius.panel,
      fill: UITheme.colors.navy800,
      compact: false,
      ...options
    };

    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    if (this.options.title) {
      this.titleText = scene.add.text(24, 16, this.options.title, {
        fontFamily: UITheme.fonts.title,
        fontSize: `${this.options.titleSize}px`,
        color: UITheme.css.goldTextStrong,
        fontStyle: 'bold'
      });
      this.add(this.titleText);
    }

    scene.add.existing(this);
    this.draw();
  }

  draw() {
    const w = this.widthValue;
    const h = this.heightValue;
    const radius = this.options.radius;
    this.graphics.clear();
    this.graphics.fillStyle(UITheme.colors.navy950, 0.5);
    this.graphics.fillRoundedRect(7, 9, w, h, radius);
    this.graphics.fillStyle(this.options.fill, this.options.alpha);
    this.graphics.fillRoundedRect(0, 0, w, h, radius);
    this.graphics.fillStyle(UITheme.colors.navy700, 0.44);
    this.graphics.fillRoundedRect(8, 8, w - 16, h - 16, Math.max(4, radius - 3));
    this.graphics.lineStyle(4, UITheme.colors.brass600, 0.96);
    this.graphics.strokeRoundedRect(1, 1, w - 2, h - 2, radius);
    this.graphics.lineStyle(1, UITheme.colors.gold300, 0.76);
    this.graphics.strokeRoundedRect(8, 8, w - 16, h - 16, Math.max(4, radius - 4));

    const rivet = this.options.compact ? 3 : 4;
    this.graphics.fillStyle(UITheme.colors.gold500, 0.9);
    [[18, 18], [w - 18, 18], [18, h - 18], [w - 18, h - 18]]
      .forEach(([rx, ry]) => this.graphics.fillCircle(rx, ry, rivet));
  }

  setTitle(value) {
    if (!this.titleText) {
      this.titleText = this.scene.add.text(24, 16, value, {
        fontFamily: UITheme.fonts.title,
        fontSize: `${this.options.titleSize}px`,
        color: UITheme.css.goldTextStrong,
        fontStyle: 'bold'
      });
      this.add(this.titleText);
    } else {
      this.titleText.setText(value);
    }
    return this;
  }
}

export function drawUIPanel(scene, x, y, width, height, options = {}) {
  return new UIPanel(scene, x, y, width, height, options);
}
