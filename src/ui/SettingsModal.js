import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { LocalizationService, t } from '../services/LocalizationService.js';
import { SoundService } from '../services/SoundService.js';
import { StorageService } from '../services/StorageService.js';
import { Button } from './Button.js';
import { drawNavalPanel } from './NavalPanel.js';

export class SettingsModal {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = options;
    this.profile = StorageService.loadProfile();
    LocalizationService.init(this.profile);
    SoundService.init(this.profile);
    this.container = scene.add.container(0, 0).setDepth(options.depth ?? 1000);
    this.controls = [];
    this.create();
  }

  create() {
    this.panel = {
      x: GAME_WIDTH / 2 - 340,
      y: GAME_HEIGHT / 2 - 230,
      width: 680,
      height: 460
    };
    const dim = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020812, 0.72);
    dim.setInteractive();
    const panel = drawNavalPanel(this.scene, this.panel.x, this.panel.y, this.panel.width, this.panel.height, {
      title: t('settings'),
      titleSize: 30
    });
    this.container.add([dim, panel]);

    this.addLanguageControls();
    this.addToggleRow(255, t('sfx'), 'sound');
    this.addToggleRow(314, t('music'), 'music');
    this.addVolumeRow(374, t('music_volume'), 'musicVolume');
    this.addVolumeRow(424, t('sfx_volume'), 'sfxVolume');

    const closeButton = new Button(this.scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 188, 228, 56, t('close'), () => this.close(), {
      variant: 'primary',
      fontSize: 20
    });
    this.container.add(closeButton);

    this.container.setScale(0.96);
    this.scene.tweens.add({ targets: this.container, scale: 1, duration: 180, ease: 'Back.easeOut' });
  }

  addLanguageControls() {
    const y = 184;
    this.container.add(this.scene.add.text(this.panel.x + 40, y - 12, t('language'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#fff0bf'
    }));

    LocalizationService.getSupportedLanguages().forEach((language, index) => {
      const buttonWidth = 104;
      const gap = 10;
      const startX = this.panel.x + 396;
      const button = new Button(this.scene, startX + index * (buttonWidth + gap), y, buttonWidth, 44, language.label, () => {
        this.setLanguage(language.code);
      }, {
        variant: language.code === LocalizationService.getLanguage() ? 'primary' : 'secondary',
        selected: language.code === LocalizationService.getLanguage(),
        fontSize: 16,
        small: true
      });
      this.controls.push({ type: 'language', code: language.code, button });
      this.container.add(button);
    });
  }

  addToggleRow(y, label, key) {
    this.container.add(this.scene.add.text(this.panel.x + 40, y - 13, label, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#fff0bf'
    }));
    const button = new Button(this.scene, this.panel.x + 530, y, 154, 44, this.profile.settings[key] ? t('on') : t('off'), () => {
      this.updateSetting(key, !this.profile.settings[key]);
      button.setLabel(this.profile.settings[key] ? t('on') : t('off'));
      button.setSelected(Boolean(this.profile.settings[key]));
    }, {
      variant: this.profile.settings[key] ? 'ready' : 'secondary',
      selected: Boolean(this.profile.settings[key]),
      fontSize: 18,
      small: true
    });
    this.controls.push({ type: 'toggle', key, button });
    this.container.add(button);
  }

  addVolumeRow(y, label, key) {
    this.container.add(this.scene.add.text(this.panel.x + 40, y - 13, label, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '20px',
      color: '#fff0bf'
    }));
    const minusX = this.panel.x + 388;
    const valueX = this.panel.x + 468;
    const plusX = this.panel.x + 548;
    const minus = new Button(this.scene, minusX, y, 54, 42, '-', () => this.adjustVolume(key, -0.1), {
      variant: 'secondary',
      fontSize: 22,
      small: true
    });
    const valueText = this.scene.add.text(valueX, y, this.formatPercent(this.profile.settings[key]), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#d9fbff',
      fixedWidth: 88,
      align: 'center'
    }).setOrigin(0.5);
    const plus = new Button(this.scene, plusX, y, 54, 42, '+', () => this.adjustVolume(key, 0.1), {
      variant: 'secondary',
      fontSize: 22,
      small: true
    });
    this.controls.push({ type: 'volume', key, valueText });
    this.container.add([minus, valueText, plus]);
  }

  formatPercent(value) {
    return `${Math.round((value ?? 0) * 100)}%`;
  }

  setLanguage(language) {
    this.profile = StorageService.updateSettings({ language });
    LocalizationService.setLanguage(language);
    this.controls.forEach((control) => {
      if (control.type === 'language') {
        control.button
          .setSelected(control.code === language)
          .setEnabled(true);
      }
    });
    this.options.onLanguageChanged?.(language);
    this.close();
  }

  updateSetting(key, value) {
    this.profile = StorageService.updateSettings({ [key]: value });
    if (key === 'music') {
      SoundService.setMusicEnabled(value);
      this.options.onMusicChanged?.(value);
    }
    if (key === 'sound') {
      SoundService.setSfxEnabled(value);
    }
  }

  adjustVolume(key, delta) {
    const value = Math.max(0, Math.min(1, (this.profile.settings[key] ?? 0) + delta));
    this.profile = StorageService.updateSettings({ [key]: Number(value.toFixed(2)) });
    if (key === 'musicVolume') {
      SoundService.setMusicVolume(value);
    } else {
      SoundService.setSfxVolume(value);
      SoundService.playSfx(this.scene, SoundService.keys.sfx_click);
    }
    this.controls.forEach((control) => {
      if (control.type === 'volume' && control.key === key) {
        control.valueText.setText(this.formatPercent(value));
      }
    });
  }

  close() {
    this.options.onClose?.();
    this.container.destroy();
  }
}
