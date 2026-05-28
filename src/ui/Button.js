import Phaser from 'phaser';

export class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, label, onClick, options = {}) {
    super(scene, x, y);

    this.widthValue = width;
    this.heightValue = height;
    this.label = label;
    this.onClick = onClick;
    this.options = {
      fill: 0x8a5528,
      hoverFill: 0xa96f35,
      disabledFill: 0x4f4f58,
      selectedFill: 0x0f7d8a,
      textColor: '#fff4cf',
      stroke: 0xf0c35a,
      fontSize: 24,
      icon: null,
      ...options
    };
    this.enabled = true;
    this.selected = false;
    this.hovered = false;
    this.pressed = false;

    this.background = scene.add.graphics();
    this.add(this.background);

    this.iconText = null;
    if (this.options.icon) {
      this.iconText = scene.add.text(-width / 2 + 30, 0, this.options.icon, {
        fontSize: `${Math.round(this.options.fontSize * 1.05)}px`
      }).setOrigin(0.5);
      this.add(this.iconText);
    }

    this.text = scene.add.text(this.options.icon ? 16 : 0, 0, label, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: `${this.options.fontSize}px`,
      color: this.options.textColor,
      align: 'center',
      fixedWidth: width - (this.options.icon ? 58 : 22),
      wordWrap: { width: width - (this.options.icon ? 58 : 22), useAdvancedWrap: true }
    }).setOrigin(0.5);
    this.add(this.text);

    this.setSize(width, height);
    this.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);

    this.on('pointerover', () => {
      this.hovered = true;
      this.draw();
      if (this.enabled) {
        scene.tweens.add({ targets: this, scale: 1.035, duration: 120, ease: 'Sine.easeOut' });
      }
    });

    this.on('pointerout', () => {
      this.hovered = false;
      this.pressed = false;
      this.draw();
      scene.tweens.add({ targets: this, scale: 1, duration: 120, ease: 'Sine.easeOut' });
    });

    this.on('pointerdown', () => {
      if (!this.enabled) {
        return;
      }
      this.pressed = true;
      this.draw();
      scene.tweens.add({ targets: this, scale: 0.975, duration: 80, ease: 'Sine.easeOut' });
    });

    this.on('pointerup', () => {
      if (!this.enabled) {
        return;
      }
      this.pressed = false;
      this.draw();
      scene.tweens.add({ targets: this, scale: this.hovered ? 1.035 : 1, duration: 100, ease: 'Sine.easeOut' });
      this.onClick?.();
    });

    scene.add.existing(this);
    this.draw();
  }

  draw() {
    this.background.clear();

    const radius = 8;
    const fill = this.selected
      ? this.options.selectedFill
      : this.enabled
        ? this.hovered
          ? this.options.hoverFill
          : this.options.fill
        : this.options.disabledFill;
    const alpha = this.enabled ? 1 : 0.55;
    const yOffset = this.pressed ? 2 : 0;

    this.background.fillStyle(0x261509, alpha);
    this.background.fillRoundedRect(-this.widthValue / 2 + 3, -this.heightValue / 2 + 5 + yOffset, this.widthValue, this.heightValue, radius);
    this.background.fillStyle(fill, alpha);
    this.background.fillRoundedRect(-this.widthValue / 2, -this.heightValue / 2 + yOffset, this.widthValue, this.heightValue, radius);
    this.background.lineStyle(2, this.options.stroke, alpha);
    this.background.strokeRoundedRect(-this.widthValue / 2 + 2, -this.heightValue / 2 + 2 + yOffset, this.widthValue - 4, this.heightValue - 4, radius - 1);
    this.setAlpha(this.enabled ? 1 : 0.68);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.disableInteractive();
    if (enabled) {
      this.setInteractive(
        new Phaser.Geom.Rectangle(-this.widthValue / 2, -this.heightValue / 2, this.widthValue, this.heightValue),
        Phaser.Geom.Rectangle.Contains
      );
    }
    this.draw();
    return this;
  }

  setSelected(selected) {
    this.selected = selected;
    this.draw();
    return this;
  }

  setLabel(label) {
    this.label = label;
    this.text.setText(label);
    return this;
  }
}
