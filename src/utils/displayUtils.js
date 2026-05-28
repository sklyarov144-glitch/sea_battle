export function coverImage(image, sceneWidth, sceneHeight) {
  const sourceWidth = image.width || image.texture?.getSourceImage()?.width || sceneWidth;
  const sourceHeight = image.height || image.texture?.getSourceImage()?.height || sceneHeight;
  const scale = Math.max(sceneWidth / sourceWidth, sceneHeight / sourceHeight);

  image.setOrigin(0.5);
  image.setPosition(sceneWidth / 2, sceneHeight / 2);
  image.setScale(scale);

  return scale;
}
