import { Button } from './Button.js';

function withVariant(options, variant) {
  return {
    ...options,
    variant,
    strictHitArea: true,
    hitPadding: 0
  };
}

export class PrimaryButton extends Button {
  constructor(scene, x, y, width, height, label, onClick, options = {}) {
    super(scene, x, y, width, height, label, onClick, withVariant(options, 'primary'));
  }
}

export class SecondaryButton extends Button {
  constructor(scene, x, y, width, height, label, onClick, options = {}) {
    super(scene, x, y, width, height, label, onClick, withVariant(options, 'secondary'));
  }
}

export class DangerButton extends Button {
  constructor(scene, x, y, width, height, label, onClick, options = {}) {
    super(scene, x, y, width, height, label, onClick, withVariant(options, 'danger'));
  }
}
