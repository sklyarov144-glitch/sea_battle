import Phaser from 'phaser';
import { UIPanel } from './UIPanel.js';
import { UITheme } from './theme.js';

export class TopBar extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, options = {}) {
    super(scene, x, y);
    this.panel = new UIPanel(scene, 0, 0, width, height, {
      alpha: 0.92,
      radius: 12,
      compact: true,
      ...options
    });
    this.add(this.panel);

    this.titleText = scene.add.text(28, height / 2, options.title ?? '', {
      fontFamily: UITheme.fonts.title,
      fontSize: `${options.titleSize ?? 30}px`,
      color: UITheme.css.goldText,
      stroke: UITheme.css.navyShadow,
      strokeThickness: 3
    }).setOrigin(0, 0.5);
    this.add(this.titleText);

    this.metaText = scene.add.text(width - 28, height / 2, options.meta ?? '', {
      fontFamily: UITheme.fonts.body,
      fontSize: `${options.metaSize ?? 20}px`,
      color: UITheme.css.bodyText,
      align: 'right'
    }).setOrigin(1, 0.5);
    this.add(this.metaText);

    scene.add.existing(this);
  }

  setTitle(value) {
    this.titleText.setText(value);
    return this;
  }

  setMeta(value) {
    this.metaText.setText(value);
    return this;
  }
}
