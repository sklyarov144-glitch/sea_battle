import Phaser from 'phaser';

export class ProgressBar extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, options = {}) {
    super(scene, x, y);

    this.widthValue = width;
    this.heightValue = height;
    this.value = 0;
    this.max = 1;
    this.options = {
      fill: 0xf0c35a,
      background: 0x19324a,
      stroke: 0xf5d27a,
      label: '',
      ...options
    };

    this.graphics = scene.add.graphics();
    this.labelText = scene.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#fff8df'
    }).setOrigin(0.5);

    this.add([this.graphics, this.labelText]);
    scene.add.existing(this);
    this.draw();
  }

  setValue(value, max = this.max, label = this.options.label) {
    this.value = Math.max(0, value);
    this.max = Math.max(1, max);
    this.options.label = label;
    this.draw();
    return this;
  }

  draw() {
    const progress = Phaser.Math.Clamp(this.value / this.max, 0, 1);
    const radius = Math.min(8, this.heightValue / 2);

    this.graphics.clear();
    this.graphics.fillStyle(0x000000, 0.26);
    this.graphics.fillRoundedRect(-this.widthValue / 2 + 3, -this.heightValue / 2 + 4, this.widthValue, this.heightValue, radius);
    this.graphics.fillStyle(this.options.background, 0.92);
    this.graphics.fillRoundedRect(-this.widthValue / 2, -this.heightValue / 2, this.widthValue, this.heightValue, radius);
    this.graphics.fillStyle(this.options.fill, 1);
    this.graphics.fillRoundedRect(
      -this.widthValue / 2 + 4,
      -this.heightValue / 2 + 4,
      Math.max(8, (this.widthValue - 8) * progress),
      this.heightValue - 8,
      Math.max(1, radius - 2)
    );
    this.graphics.lineStyle(2, this.options.stroke, 0.9);
    this.graphics.strokeRoundedRect(-this.widthValue / 2, -this.heightValue / 2, this.widthValue, this.heightValue, radius);
    this.labelText.setText(this.options.label);
  }
}
