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
      iconKey: null,
      backgroundKey: null,
      iconSize: null,
      radius: 8,
      ...options
    };
    this.enabled = true;
    this.selected = false;
    this.hovered = false;
    this.pressed = false;

    this.backgroundImage = null;
    this.background = scene.add.graphics();
    if (this.options.backgroundKey && scene.textures.exists(this.options.backgroundKey)) {
      this.backgroundImage = scene.add.image(0, 0, this.options.backgroundKey);
      this.backgroundImage.setOrigin(0.5);
      this.backgroundImage.setDisplaySize(width, height);
      this.add(this.backgroundImage);
    } else {
      this.add(this.background);
    }

    this.iconText = null;
    this.iconImage = null;
    const iconLeft = -width / 2 + Math.max(28, height * 0.62);
    if (this.options.iconKey && scene.textures.exists(this.options.iconKey)) {
      this.iconImage = scene.add.image(iconLeft, 0, this.options.iconKey);
      this.iconImage.setOrigin(0.5);
      const iconSize = this.options.iconSize ?? Math.round(height * 0.62);
      this.iconImage.setDisplaySize(iconSize, iconSize);
      this.add(this.iconImage);
    } else if (this.options.icon) {
      this.iconText = scene.add.text(-width / 2 + 30, 0, this.options.icon, {
        fontSize: `${Math.round(this.options.fontSize * 1.05)}px`
      }).setOrigin(0.5);
      this.add(this.iconText);
    }

    const hasIcon = Boolean(this.options.icon || this.iconImage);
    this.text = scene.add.text(hasIcon ? Math.round(height * 0.28) : 0, 0, label, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: `${this.options.fontSize}px`,
      color: this.options.textColor,
      align: 'center',
      fixedWidth: width - (hasIcon ? Math.round(height * 1.35) : 22),
      wordWrap: { width: width - (hasIcon ? Math.round(height * 1.35) : 22), useAdvancedWrap: true }
    }).setOrigin(0.5);
    this.add(this.text);

    this.hitTarget = scene.add.rectangle(0, 0, width, height, 0xffffff, 0.001);
    this.hitTarget.setOrigin(0.5);
    this.add(this.hitTarget);

    this.setSize(width, height);
    this.updateHitArea();

    this.hitTarget.on('pointerover', () => this.handlePointerOver());
    this.hitTarget.on('pointerout', () => this.handlePointerOut());
    this.hitTarget.on('pointerdown', () => this.handlePointerDown());
    this.hitTarget.on('pointerup', () => this.handlePointerUp());

    scene.add.existing(this);
    this.draw();
  }

  updateHitArea() {
    this.hitTarget.setSize(this.widthValue, this.heightValue);
    this.hitTarget.setDisplaySize(this.widthValue, this.heightValue);
    this.hitTarget.setInteractive({
      useHandCursor: this.enabled,
      hitArea: new Phaser.Geom.Rectangle(0, 0, this.widthValue, this.heightValue),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains
    });
  }

  handlePointerOver() {
    this.hovered = true;
    this.draw();

    if (this.enabled) {
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.add({ targets: this, scale: 1.035, duration: 120, ease: 'Sine.easeOut' });
    }
  }

  handlePointerOut() {
    this.hovered = false;
    this.pressed = false;
    this.draw();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, scale: 1, duration: 120, ease: 'Sine.easeOut' });
  }

  handlePointerDown() {
    if (!this.enabled) {
      return;
    }

    this.pressed = true;
    this.draw();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, scale: 0.975, duration: 80, ease: 'Sine.easeOut' });
  }

  handlePointerUp() {
    if (!this.enabled) {
      return;
    }

    this.pressed = false;
    this.draw();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, scale: this.hovered ? 1.035 : 1, duration: 100, ease: 'Sine.easeOut' });
    this.onClick?.();
  }

  draw() {
    this.background.clear();

    const radius = this.options.radius;
    const fill = this.selected
      ? this.options.selectedFill
      : this.enabled
        ? this.hovered
          ? this.options.hoverFill
          : this.options.fill
        : this.options.disabledFill;
    const alpha = this.enabled ? 1 : 0.55;
    const yOffset = this.pressed ? 2 : 0;

    if (this.backgroundImage) {
      this.backgroundImage.setY(yOffset);
      this.backgroundImage.setAlpha(alpha);
      this.backgroundImage.clearTint();
      if (this.selected) {
        this.backgroundImage.setTint(0x9ff3ff);
      } else if (this.hovered && this.enabled) {
        this.backgroundImage.setTint(0xfff0bf);
      } else if (!this.enabled) {
        this.backgroundImage.setTint(0x666b75);
      }
    } else {
      this.background.fillStyle(0x261509, alpha);
      this.background.fillRoundedRect(-this.widthValue / 2 + 3, -this.heightValue / 2 + 5 + yOffset, this.widthValue, this.heightValue, radius);
      this.background.fillStyle(fill, alpha);
      this.background.fillRoundedRect(-this.widthValue / 2, -this.heightValue / 2 + yOffset, this.widthValue, this.heightValue, radius);
      this.background.lineStyle(2, this.options.stroke, alpha);
      this.background.strokeRoundedRect(-this.widthValue / 2 + 2, -this.heightValue / 2 + 2 + yOffset, this.widthValue - 4, this.heightValue - 4, radius - 1);
    }
    if (this.iconImage) {
      this.iconImage.setAlpha(this.enabled ? 1 : 0.55);
      this.iconImage.setY(yOffset);
    }
    if (this.iconText) {
      this.iconText.setAlpha(this.enabled ? 1 : 0.55);
      this.iconText.setY(yOffset);
    }
    this.text.setY(yOffset);
    this.setAlpha(this.enabled ? 1 : 0.68);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.updateHitArea();
    } else {
      this.hitTarget.disableInteractive();
      this.hovered = false;
      this.pressed = false;
      this.scene.tweens.killTweensOf(this);
      this.setScale(1);
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
