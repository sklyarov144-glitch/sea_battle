import Phaser from 'phaser';
import { UITheme } from './theme.js';

export class ChestPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, textureKey, onClick, options = {}) {
    super(scene, x, y);
    this.widthValue = width;
    this.heightValue = height;
    this.onClick = onClick;
    this.enabled = options.enabled ?? true;

    this.glow = scene.add.graphics();
    this.icon = scene.add.image(0, -12, textureKey);
    this.icon.setDisplaySize(options.iconWidth ?? width * 0.68, options.iconHeight ?? height * 0.68);
    this.titleText = scene.add.text(0, height * 0.32, options.title ?? '', {
      fontFamily: UITheme.fonts.title,
      fontSize: `${options.titleSize ?? 17}px`,
      color: UITheme.css.goldText,
      align: 'center',
      stroke: UITheme.css.navyShadow,
      strokeThickness: 3
    }).setOrigin(0.5);
    this.captionText = scene.add.text(0, height * 0.43, options.caption ?? '', {
      fontFamily: UITheme.fonts.body,
      fontSize: `${options.captionSize ?? 12}px`,
      color: UITheme.css.bodyText,
      align: 'center',
      fixedWidth: width,
      wordWrap: { width, useAdvancedWrap: true },
      stroke: UITheme.css.navyShadow,
      strokeThickness: 3
    }).setOrigin(0.5, 0);
    this.hitZone = scene.add.zone(0, -6, width, height).setInteractive({ useHandCursor: true });
    this.add([this.glow, this.icon, this.titleText, this.captionText, this.hitZone]);

    this.hitZone.on('pointerover', () => this.enabled && scene.tweens.add({ targets: this, scale: 1.04, duration: 120 }));
    this.hitZone.on('pointerout', () => scene.tweens.add({ targets: this, scale: 1, duration: 120 }));
    this.hitZone.on('pointerup', () => this.enabled && this.onClick?.());

    scene.add.existing(this);
    this.draw();
  }

  draw() {
    this.glow.clear();
    this.glow.fillStyle(UITheme.colors.gold500, this.enabled ? 0.15 : 0.06);
    this.glow.fillEllipse(0, 0, this.widthValue * 0.95, this.heightValue * 0.72);
    this.setAlpha(this.enabled ? 1 : 0.58);
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    this.draw();
    return this;
  }

  setCaption(value) {
    this.captionText.setText(value);
    return this;
  }
}
