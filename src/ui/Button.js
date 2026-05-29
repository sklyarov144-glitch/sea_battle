import Phaser from 'phaser';
import { SoundService } from '../services/SoundService.js';

const VARIANTS = {
  primary: { fill: 0x09263f, fill2: 0x0f3a5c, glow: 0xd7a748, text: '#f8d77a' },
  secondary: { fill: 0x071d32, fill2: 0x0b2b48, glow: 0x6db7d4, text: '#f2d48a' },
  ready: { fill: 0x083326, fill2: 0x0d5a3e, glow: 0x5ee0a1, text: '#e9ffd8' },
  danger: { fill: 0x35111a, fill2: 0x5c1d28, glow: 0xff6d5e, text: '#ffe2cc' },
  disabled: { fill: 0x1d2732, fill2: 0x27313b, glow: 0x56616e, text: '#9aa6b2' }
};

export class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, label, onClick, options = {}) {
    super(scene, x, y);

    this.widthValue = width;
    this.heightValue = height;
    this.label = label;
    this.onClick = onClick;
    this.options = {
      variant: 'primary',
      fontSize: 24,
      pulse: false,
      selected: false,
      disabled: false,
      small: false,
      hitPadding: 6,
      ...options
    };
    this.enabled = !this.options.disabled && this.options.variant !== 'disabled';
    this.selected = Boolean(this.options.selected);
    this.hovered = false;
    this.pressed = false;
    this.pulseTween = null;
    this.pulsing = false;

    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    this.text = scene.add.text(0, 1, this.formatLabel(label), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: `${this.options.fontSize}px`,
      color: '#f8d77a',
      align: 'center',
      fixedWidth: width - 24,
      wordWrap: { width: width - 24, useAdvancedWrap: true },
      shadow: {
        offsetX: 0,
        offsetY: 2,
        color: '#020812',
        blur: 5,
        fill: true
      }
    }).setOrigin(0.5);
    this.add(this.text);

    this.setSize(width, height);
    this.updateHitArea();
    this.input.cursor = 'pointer';

    this.on('pointerover', () => this.handlePointerOver());
    this.on('pointerout', () => this.handlePointerOut());
    this.on('pointerdown', () => this.handlePointerDown());
    this.on('pointerup', () => this.handlePointerUp());

    scene.add.existing(this);
    this.draw();
    this.setPulse(Boolean(this.options.pulse));
  }

  formatLabel(label) {
    return String(label ?? '').toLocaleUpperCase('ru-RU');
  }

  getVariant() {
    if (!this.enabled) {
      return VARIANTS.disabled;
    }
    return VARIANTS[this.options.variant] ?? VARIANTS.primary;
  }

  updateHitArea() {
    const width = Math.ceil(this.widthValue);
    const height = Math.ceil(this.heightValue);
    const hitPadding = Math.min(8, Math.max(0, this.options.hitPadding ?? 6));
    const hitArea = new Phaser.Geom.Rectangle(
      -width / 2 - hitPadding,
      -height / 2 - hitPadding,
      width + hitPadding * 2,
      height + hitPadding * 2
    );
    this.setSize(width, height);
    this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    if (this.input) {
      this.input.hitArea = hitArea;
      this.input.hitAreaCallback = Phaser.Geom.Rectangle.Contains;
      this.input.cursor = 'pointer';
    }
    return this;
  }

  handlePointerOver() {
    this.hovered = true;
    this.draw();
    if (this.enabled) {
      SoundService.playSfx(this.scene, SoundService.keys.sfx_button_hover);
      this.stopPulseTween();
      this.scene.tweens.add({ targets: this, scale: 1.03, duration: 120, ease: 'Sine.easeOut' });
    }
  }

  handlePointerOut() {
    this.hovered = false;
    this.pressed = false;
    this.draw();
    if (this.pulsing && this.enabled) {
      this.startPulseTween();
    } else {
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.add({ targets: this, scale: 1, duration: 120, ease: 'Sine.easeOut' });
    }
  }

  handlePointerDown() {
    if (!this.enabled) {
      return;
    }
    this.pressed = true;
    this.draw();
    this.stopPulseTween();
    this.scene.tweens.add({ targets: this, scale: 0.97, duration: 70, ease: 'Sine.easeOut' });
  }

  handlePointerUp() {
    if (!this.enabled) {
      return;
    }
    this.pressed = false;
    this.draw();
    SoundService.playSfx(this.scene, SoundService.keys.sfx_click);
    this.scene.tweens.add({ targets: this, scale: this.hovered ? 1.03 : 1, duration: 90, ease: 'Sine.easeOut' });
    this.onClick?.();
  }

  draw() {
    const variant = this.getVariant();
    const w = this.widthValue;
    const h = this.heightValue;
    const radius = this.options.small ? 7 : 10;
    const glowAlpha = this.selected || this.hovered ? 0.34 : 0.16;
    const yOffset = this.pressed ? 2 : 0;

    this.graphics.clear();
    this.graphics.fillStyle(0x010711, 0.48);
    this.graphics.fillRoundedRect(-w / 2 + 4, -h / 2 + 5 + yOffset, w - 8, h - 8, radius);

    this.graphics.lineStyle(7, variant.glow, glowAlpha);
    this.graphics.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2 + yOffset, w - 4, h - 4, radius);

    this.graphics.fillStyle(0x07121f, this.enabled ? 0.98 : 0.72);
    this.graphics.fillRoundedRect(-w / 2, -h / 2 + yOffset, w, h, radius);
    this.graphics.fillStyle(variant.fill, this.enabled ? 0.98 : 0.78);
    this.graphics.fillRoundedRect(-w / 2 + 5, -h / 2 + 5 + yOffset, w - 10, h - 10, radius - 2);
    this.graphics.fillStyle(variant.fill2, 0.62);
    this.graphics.fillRoundedRect(-w / 2 + 8, -h / 2 + h * 0.48 + yOffset, w - 16, h * 0.42, radius - 3);

    this.graphics.lineStyle(3, 0x9c6b2f, this.enabled ? 1 : 0.45);
    this.graphics.strokeRoundedRect(-w / 2 + 1, -h / 2 + 1 + yOffset, w - 2, h - 2, radius);
    this.graphics.lineStyle(1, 0xf6d37c, this.enabled ? 0.82 : 0.32);
    this.graphics.strokeRoundedRect(-w / 2 + 7, -h / 2 + 7 + yOffset, w - 14, h - 14, radius - 3);

    const rivetColor = this.enabled ? 0xd7a748 : 0x707987;
    this.graphics.fillStyle(rivetColor, 0.92);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      this.graphics.fillCircle(sx * (w / 2 - 14), sy * (h / 2 - 14) + yOffset, this.options.small ? 2.5 : 3.6);
    });

    this.text.setY(1 + yOffset);
    this.text.setColor(variant.text);
    this.setAlpha(this.enabled ? 1 : 0.72);
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    this.updateHitArea();
    this.input.cursor = 'pointer';
    if (!this.enabled) {
      this.hovered = false;
      this.pressed = false;
      this.stopPulseTween();
      this.setScale(1);
    }
    this.draw();
    return this;
  }

  setLabel(value) {
    this.label = value;
    this.text.setText(this.formatLabel(value));
    return this;
  }

  setPulse(value) {
    this.pulsing = Boolean(value);
    this.stopPulseTween();
    if (this.pulsing && this.enabled && !this.hovered && !this.pressed) {
      this.startPulseTween();
    }
    return this;
  }

  startPulseTween() {
    this.stopPulseTween(false);
    this.pulseTween = this.scene.tweens.add({
      targets: this,
      scale: 1.035,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  stopPulseTween(resetScale = true) {
    this.scene.tweens.killTweensOf(this);
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
    }
    if (resetScale) {
      this.setScale(1);
    }
  }

  setSelected(value) {
    this.selected = Boolean(value);
    this.draw();
    return this;
  }

  destroy(fromScene) {
    this.pulseTween?.stop();
    super.destroy(fromScene);
  }
}
