import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { AssetKeys } from '../config/assetKeys.js';
import { coverImage } from './displayUtils.js';

export function createSeaBackground(scene, options = {}) {
  const waterSkin = options.waterSkin ?? 'classic';
  const topColor = waterSkin === 'tropical' ? 0x0a99a8 : 0x062f4f;
  const middleColor = waterSkin === 'tropical' ? 0x087f8c : 0x07546f;
  const bottomColor = waterSkin === 'tropical' ? 0x045b70 : 0x041f32;
  const graphics = scene.add.graphics();

  const bands = 42;
  for (let index = 0; index < bands; index += 1) {
    const t = index / (bands - 1);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(t < 0.48 ? topColor : middleColor),
      Phaser.Display.Color.ValueToColor(t < 0.48 ? middleColor : bottomColor),
      bands,
      index
    );
    graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
    graphics.fillRect(0, (GAME_HEIGHT / bands) * index, GAME_WIDTH, GAME_HEIGHT / bands + 2);
  }

  const waveGraphics = scene.add.graphics();
  waveGraphics.setAlpha(0.36);
  waveGraphics.lineStyle(2, 0x95f1ff, 0.55);

  for (let row = 0; row < 12; row += 1) {
    const y = 54 + row * 58;
    waveGraphics.beginPath();
    waveGraphics.moveTo(-80, y);
    for (let x = -80; x <= GAME_WIDTH + 80; x += 28) {
      waveGraphics.lineTo(x, y + Math.sin((x + row * 30) / 42) * 8);
    }
    waveGraphics.strokePath();
  }

  scene.tweens.add({
    targets: waveGraphics,
    x: 70,
    duration: 5200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  const foamGraphics = scene.add.graphics();
  foamGraphics.setAlpha(0.16);
  for (let index = 0; index < 40; index += 1) {
    foamGraphics.fillStyle(0xd9fbff, Phaser.Math.FloatBetween(0.18, 0.45));
    foamGraphics.fillEllipse(
      Phaser.Math.Between(0, GAME_WIDTH),
      Phaser.Math.Between(0, GAME_HEIGHT),
      Phaser.Math.Between(24, 86),
      Phaser.Math.Between(4, 10)
    );
  }

  scene.tweens.add({
    targets: foamGraphics,
    x: -50,
    duration: 7000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  return scene.add.container(0, 0, [graphics, waveGraphics, foamGraphics]).setDepth(-100);
}

export function createCoverImageBackground(scene, key, options = {}) {
  if (!scene.textures.exists(key)) {
    return createSeaBackground(scene, options.fallback ?? {});
  }

  const image = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key);
  const baseScale = coverImage(image, GAME_WIDTH, GAME_HEIGHT);
  image.setScale(baseScale * (options.scale ?? 1.04));
  image.setDepth(options.depth ?? -100);

  if (options.animate !== false) {
    scene.tweens.add({
      targets: image,
      scale: baseScale * (options.toScale ?? 1.1),
      x: GAME_WIDTH / 2 + (options.panX ?? 18),
      y: GAME_HEIGHT / 2 + (options.panY ?? 8),
      duration: options.duration ?? 12000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  const objects = [image];
  if (options.overlayAlpha && options.overlayAlpha > 0) {
    const overlay = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      options.overlayColor ?? 0x031827,
      options.overlayAlpha
    );
    overlay.setDepth((options.depth ?? -100) + 1);
    objects.push(overlay);
  }

  return scene.add.container(0, 0, objects).setDepth(options.depth ?? -100);
}

export function drawWoodPanel(scene, x, y, width, height, options = {}) {
  const graphics = scene.add.graphics();
  const fill = options.fill ?? 0x6b3f1e;
  const alpha = options.alpha ?? 0.92;
  const radius = options.radius ?? 8;

  graphics.fillStyle(0x2a160b, alpha);
  graphics.fillRoundedRect(x + 5, y + 6, width, height, radius);
  graphics.fillStyle(fill, alpha);
  graphics.fillRoundedRect(x, y, width, height, radius);
  graphics.lineStyle(3, 0xd7a748, 0.95);
  graphics.strokeRoundedRect(x + 2, y + 2, width - 4, height - 4, radius - 1);

  for (let plank = 0; plank < Math.max(1, Math.floor(height / 34)); plank += 1) {
    const lineY = y + 18 + plank * 34;
    graphics.lineStyle(1, 0x3b210f, 0.22);
    graphics.lineBetween(x + 10, lineY, x + width - 10, lineY);
  }

  return graphics;
}

export function createCannonArc(scene, from, to, options = {}) {
  return new Promise((resolve) => {
    const ball = scene.add.image(from.x, from.y, AssetKeys.Textures.Cannonball);
    ball.setDepth(options.depth ?? 80);
    ball.setScale(options.scale ?? 1);

    const trail = scene.add.graphics();
    trail.setDepth((options.depth ?? 80) - 1);
    trail.lineStyle(2, 0xf5d27a, 0.5);

    let finished = false;
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      ball.destroy();
      trail.destroy();
      resolve();
    };

    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: options.duration ?? 420,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        const t = tween.getValue();
        const x = Phaser.Math.Linear(from.x, to.x, t);
        const y = Phaser.Math.Linear(from.y, to.y, t) - Math.sin(t * Math.PI) * (options.arc ?? 95);
        ball.setPosition(x, y);
        ball.setScale((options.scale ?? 1) * (1 + Math.sin(t * Math.PI) * 0.18));
        trail.clear();
        trail.lineStyle(2, 0xf5d27a, 0.5);
        trail.lineBetween(from.x, from.y, x, y);
      },
      onComplete: () => {
        finish();
      }
    });

    window.setTimeout(finish, (options.duration ?? 420) + 700);
  });
}

export function spawnExplosion(scene, x, y, options = {}) {
  const particles = [];
  const count = options.count ?? 16;

  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + Phaser.Math.FloatBetween(-0.2, 0.2);
    const distance = Phaser.Math.Between(24, 62);
    const spark = scene.add.image(x, y, index % 3 === 0 ? AssetKeys.Textures.Fire : AssetKeys.Textures.Spark);
    spark.setDepth(options.depth ?? 95);
    spark.setScale(Phaser.Math.FloatBetween(0.45, 0.9));
    particles.push(spark);

    scene.tweens.add({
      targets: spark,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      scale: 0.1,
      duration: Phaser.Math.Between(420, 680),
      ease: 'Cubic.easeOut',
      onComplete: () => spark.destroy()
    });
  }

  const smoke = scene.add.image(x, y, AssetKeys.Textures.Smoke).setDepth((options.depth ?? 95) + 1);
  smoke.setAlpha(0.55).setScale(0.35);
  scene.tweens.add({
    targets: smoke,
    y: y - 30,
    alpha: 0,
    scale: 1.8,
    duration: 900,
    ease: 'Sine.easeOut',
    onComplete: () => smoke.destroy()
  });

  return particles;
}

export function spawnSplash(scene, x, y, options = {}) {
  const ring = scene.add.graphics();
  ring.setDepth(options.depth ?? 90);
  ring.lineStyle(4, 0xbaf7ff, 0.85);
  ring.strokeCircle(x, y, 8);

  scene.tweens.add({
    targets: ring,
    alpha: 0,
    scaleX: 3,
    scaleY: 1.7,
    duration: 460,
    ease: 'Sine.easeOut',
    onComplete: () => ring.destroy()
  });

  for (let index = 0; index < 10; index += 1) {
    const drop = scene.add.image(x, y, AssetKeys.Textures.Splash);
    drop.setDepth((options.depth ?? 90) + 1);
    drop.setScale(Phaser.Math.FloatBetween(0.35, 0.7));
    scene.tweens.add({
      targets: drop,
      x: x + Phaser.Math.Between(-34, 34),
      y: y + Phaser.Math.Between(-24, 28),
      alpha: 0,
      duration: Phaser.Math.Between(330, 620),
      ease: 'Quad.easeOut',
      onComplete: () => drop.destroy()
    });
  }
}

export function spawnSmoke(scene, x, y, options = {}) {
  for (let index = 0; index < 7; index += 1) {
    const puff = scene.add.image(x + Phaser.Math.Between(-14, 14), y + Phaser.Math.Between(-8, 8), AssetKeys.Textures.Smoke);
    puff.setDepth(options.depth ?? 88);
    puff.setAlpha(0.34).setScale(0.3);
    scene.tweens.add({
      targets: puff,
      x: puff.x + Phaser.Math.Between(-18, 18),
      y: puff.y - Phaser.Math.Between(18, 46),
      alpha: 0,
      scale: Phaser.Math.FloatBetween(0.9, 1.5),
      duration: Phaser.Math.Between(850, 1300),
      delay: index * 65,
      ease: 'Sine.easeOut',
      onComplete: () => puff.destroy()
    });
  }
}

export function spawnFireworks(scene, x, y) {
  for (let burst = 0; burst < 5; burst += 1) {
    scene.time.delayedCall(burst * 210, () => {
      const cx = x + Phaser.Math.Between(-220, 220);
      const cy = y + Phaser.Math.Between(-120, 90);
      for (let index = 0; index < 22; index += 1) {
        const angle = (Math.PI * 2 * index) / 22;
        const star = scene.add.image(cx, cy, AssetKeys.Textures.Star);
        star.setDepth(100).setScale(0.45);
        star.setTint([0xffd36e, 0xff786e, 0x8fffff, 0xffffff][index % 4]);
        scene.tweens.add({
          targets: star,
          x: cx + Math.cos(angle) * Phaser.Math.Between(48, 86),
          y: cy + Math.sin(angle) * Phaser.Math.Between(48, 86),
          alpha: 0,
          scale: 0.05,
          duration: 800,
          ease: 'Cubic.easeOut',
          onComplete: () => star.destroy()
        });
      }
    });
  }
}

export function flyCoins(scene, from, to, amount = 8) {
  for (let index = 0; index < amount; index += 1) {
    const coin = scene.add.image(from.x, from.y, AssetKeys.Textures.Coin);
    coin.setDepth(120).setScale(0.55);
    scene.tweens.add({
      targets: coin,
      x: to.x + Phaser.Math.Between(-12, 12),
      y: to.y + Phaser.Math.Between(-8, 8),
      angle: Phaser.Math.Between(180, 540),
      scale: 0.25,
      duration: 620 + index * 22,
      delay: index * 25,
      ease: 'Cubic.easeIn',
      onComplete: () => coin.destroy()
    });
  }
}

export function cameraShake(scene, intensity = 0.006, duration = 220) {
  scene.cameras.main.shake(duration, intensity);
}

export function pulseTarget(scene, x, y, radius = 28, color = 0xffd36e) {
  const ring = scene.add.graphics();
  ring.setDepth(85);
  ring.lineStyle(3, color, 0.9);
  ring.strokeCircle(x, y, radius);

  scene.tweens.add({
    targets: ring,
    alpha: 0,
    scale: 1.45,
    duration: 520,
    ease: 'Sine.easeOut',
    onComplete: () => ring.destroy()
  });
}

export function createRainOverlay(scene) {
  const rain = scene.add.graphics();
  rain.setDepth(110);
  rain.setAlpha(0.32);

  for (let index = 0; index < 80; index += 1) {
    const x = Phaser.Math.Between(-80, GAME_WIDTH + 80);
    const y = Phaser.Math.Between(-80, GAME_HEIGHT + 80);
    rain.lineStyle(2, 0xbdd8e8, Phaser.Math.FloatBetween(0.2, 0.5));
    rain.lineBetween(x, y, x - 18, y + 48);
  }

  scene.tweens.add({
    targets: rain,
    x: -110,
    y: 110,
    duration: 900,
    repeat: -1,
    onRepeat: () => rain.setPosition(0, 0)
  });

  return rain;
}
