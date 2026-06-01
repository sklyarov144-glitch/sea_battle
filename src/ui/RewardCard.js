import Phaser from 'phaser';
import { UIPanel } from './UIPanel.js';
import { UITheme } from './theme.js';

export class RewardCard extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, options = {}) {
    super(scene, x, y);
    this.panel = new UIPanel(scene, 0, 0, width, height, {
      alpha: 0.9,
      radius: 12,
      compact: true
    });
    this.add(this.panel);

    this.titleText = scene.add.text(22, 16, options.title ?? '', {
      fontFamily: UITheme.fonts.title,
      fontSize: `${options.titleSize ?? 20}px`,
      color: UITheme.css.goldTextStrong
    });
    this.valueText = scene.add.text(22, 48, options.value ?? '', {
      fontFamily: UITheme.fonts.body,
      fontSize: `${options.valueSize ?? 26}px`,
      color: UITheme.css.goldText
    });
    this.captionText = scene.add.text(22, height - 28, options.caption ?? '', {
      fontFamily: UITheme.fonts.body,
      fontSize: `${options.captionSize ?? 13}px`,
      color: UITheme.css.mutedText
    });
    this.add([this.titleText, this.valueText, this.captionText]);
    scene.add.existing(this);
  }

  setValue(value) {
    this.valueText.setText(value);
    return this;
  }

  setCaption(value) {
    this.captionText.setText(value);
    return this;
  }
}
