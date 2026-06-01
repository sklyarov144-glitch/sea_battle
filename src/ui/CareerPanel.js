import Phaser from 'phaser';
import { UIPanel } from './UIPanel.js';
import { UITheme } from './theme.js';

export class CareerPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, options = {}) {
    super(scene, x, y);
    this.widthValue = width;
    this.heightValue = height;
    this.panel = new UIPanel(scene, 0, 0, width, height, {
      title: options.title ?? '',
      titleSize: options.titleSize ?? 20,
      compact: true
    });
    this.add(this.panel);

    this.rankText = scene.add.text(24, 58, '', {
      fontFamily: UITheme.fonts.title,
      fontSize: `${options.rankSize ?? 20}px`,
      color: UITheme.css.goldText,
      fixedWidth: width - 48,
      wordWrap: { width: width - 48, useAdvancedWrap: true }
    });
    this.goldText = scene.add.text(24, 100, '', {
      fontFamily: UITheme.fonts.body,
      fontSize: '17px',
      color: UITheme.css.goldTextStrong
    });
    this.xpText = scene.add.text(24, 126, '', {
      fontFamily: UITheme.fonts.body,
      fontSize: '15px',
      color: UITheme.css.bodyText
    });
    this.bar = scene.add.graphics();
    this.add([this.rankText, this.goldText, this.xpText, this.bar]);
    scene.add.existing(this);
  }

  setData({ rank = '', gold = 0, xp = 0, nextXp = 0, progress = 0 }) {
    this.rankText.setText(rank);
    this.goldText.setText(String(gold));
    this.xpText.setText(nextXp > 0 ? `${xp} / ${nextXp}` : String(xp));
    this.bar.clear();
    const barWidth = this.widthValue - 48;
    const y = this.heightValue - 32;
    this.bar.fillStyle(UITheme.colors.navy950, 0.74);
    this.bar.fillRoundedRect(24, y, barWidth, 16, 7);
    this.bar.fillStyle(UITheme.colors.navy600, 0.96);
    this.bar.fillRoundedRect(28, y + 4, barWidth - 8, 8, 4);
    this.bar.fillStyle(UITheme.colors.gold500, 0.98);
    this.bar.fillRoundedRect(28, y + 4, Math.max(8, (barWidth - 8) * progress), 8, 4);
    return this;
  }
}
