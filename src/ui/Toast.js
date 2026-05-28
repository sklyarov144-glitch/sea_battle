import Phaser from 'phaser';

export class Toast {
  static show(scene, message, options = {}) {
    const width = options.width ?? 430;
    const height = options.height ?? 54;
    const x = options.x ?? scene.scale.width / 2;
    const y = options.y ?? 92;
    const container = scene.add.container(x, y).setDepth(options.depth ?? 200);
    const background = scene.add.graphics();
    background.fillStyle(0x2b170b, 0.94);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    background.lineStyle(2, 0xf0c35a, 0.92);
    background.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 7);

    const text = scene.add.text(0, 0, message, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${options.fontSize ?? 22}px`,
      color: '#fff5d6',
      align: 'center',
      fixedWidth: width - 34,
      wordWrap: { width: width - 34, useAdvancedWrap: true }
    }).setOrigin(0.5);

    container.add([background, text]);
    container.setAlpha(0).setScale(0.94);

    scene.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 160,
      ease: 'Sine.easeOut',
      yoyo: true,
      hold: options.hold ?? 1350,
      onComplete: () => container.destroy()
    });

    return container;
  }
}
