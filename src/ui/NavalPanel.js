export function drawNavalPanel(scene, x, y, width, height, options = {}) {
  const graphics = scene.add.graphics();
  const radius = options.radius ?? 12;
  const alpha = options.alpha ?? 0.94;

  graphics.fillStyle(0x010711, 0.52);
  graphics.fillRoundedRect(x + 7, y + 9, width, height, radius);
  graphics.fillStyle(options.fill ?? 0x071827, alpha);
  graphics.fillRoundedRect(x, y, width, height, radius);
  graphics.fillStyle(0x0b2b48, 0.46);
  graphics.fillRoundedRect(x + 8, y + 8, width - 16, height - 16, radius - 3);
  graphics.lineStyle(4, 0x9c6b2f, 0.96);
  graphics.strokeRoundedRect(x + 1, y + 1, width - 2, height - 2, radius);
  graphics.lineStyle(1, 0xf6d37c, 0.72);
  graphics.strokeRoundedRect(x + 8, y + 8, width - 16, height - 16, radius - 4);

  graphics.fillStyle(0xd7a748, 0.9);
  [[x + 18, y + 18], [x + width - 18, y + 18], [x + 18, y + height - 18], [x + width - 18, y + height - 18]]
    .forEach(([rx, ry]) => graphics.fillCircle(rx, ry, 4));

  if (options.title) {
    scene.add.text(x + 24, y + 16, options.title, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: `${options.titleSize ?? 22}px`,
      color: '#f8d77a',
      fontStyle: 'bold'
    });
  }

  return graphics;
}

export function drawCareerEmblem(scene, x, y, scale = 1) {
  const g = scene.add.graphics();
  g.lineStyle(3 * scale, 0xd7a748, 0.95);
  g.strokeCircle(x, y, 28 * scale);
  g.fillStyle(0x08263f, 0.9);
  g.fillCircle(x, y, 24 * scale);
  g.lineStyle(4 * scale, 0xf6d37c, 0.92);
  g.lineBetween(x, y - 22 * scale, x, y + 18 * scale);
  g.lineBetween(x - 14 * scale, y + 4 * scale, x + 14 * scale, y + 4 * scale);
  g.lineStyle(3 * scale, 0xf6d37c, 0.92);
  g.beginPath();
  g.arc(x, y + 10 * scale, 15 * scale, 0.15, Math.PI - 0.15, false);
  g.strokePath();
  g.fillStyle(0xf8d77a, 0.95);
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + i * ((Math.PI * 2) / 5);
    g.fillCircle(x + Math.cos(angle) * 34 * scale, y + Math.sin(angle) * 34 * scale, 2.5 * scale);
  }
  return g;
}
