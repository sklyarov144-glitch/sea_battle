import Phaser from 'phaser';
import { SHOP_ITEMS } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { LocalizationService, t } from '../services/LocalizationService.js';
import { SoundService } from '../services/SoundService.js';
import { StorageService } from '../services/StorageService.js';
import { Button } from '../ui/Button.js';
import { drawNavalPanel } from '../ui/NavalPanel.js';
import { Toast } from '../ui/Toast.js';
import { createSeaBackground, flyCoins } from '../utils/effects.js';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  init(data) {
    this.fromScene = data.from ?? 'MenuScene';
  }

  create() {
    document.body.dataset.scene = 'ShopScene';
    this.profile = StorageService.loadProfile();
    LocalizationService.init(this.profile);
    SoundService.init(this.profile);
    SoundService.playMusic(this, SoundService.keys.music_menu);
    createSeaBackground(this, { waterSkin: this.profile.selectedSkins.water });
    this.addHeader();
    this.addItems();
    this.addBackButton();
  }

  addHeader() {
    drawNavalPanel(this, 44, 26, 1192, 86);

    this.add.text(80, 54, t('shop_title'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '36px',
      color: '#fff0bf'
    });

    this.goldText = this.add.text(920, 58, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#fff5d6'
    });
    this.refreshGold();
  }

  addItems() {
    this.itemRows = [];
    const startY = 150;

    SHOP_ITEMS.forEach((item, index) => {
      const y = startY + index * 96;
      drawNavalPanel(this, 104, y - 34, 1072, 74, { alpha: 0.92, radius: 9 });

      this.add.text(134, y - 18, item.name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '24px',
        color: '#fff0bf'
      });

      this.add.text(134, y + 13, item.description, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#d9fbff'
      });

      const priceText = this.add.text(806, y - 3, `${item.price} золота`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#fff5d6'
      }).setOrigin(0.5);

      const stockText = this.add.text(1038, y + 34, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#d9fbff',
        align: 'center'
      }).setOrigin(0.5);

      const button = new Button(this, 1038, y, 190, 48, '', () => {
        this.buyItem(item, { x: button.x, y: button.y });
      }, { fontSize: 20, variant: 'secondary', small: true });

      this.itemRows.push({ item, button, priceText, stockText });
    });

    this.refreshItemButtons();
  }

  addBackButton() {
    new Button(this, 130, GAME_HEIGHT - 54, 180, 50, t('back'), () => {
      this.scene.start(this.fromScene);
    }, { variant: 'danger', fontSize: 20 });
  }

  buyItem(item, from) {
    const profile = StorageService.buyItem(item);
    this.profile = profile;

    if (profile.__purchaseStatus === 'notEnoughGold') {
      Toast.show(this, t('not_enough_gold'));
    } else if (profile.__purchaseStatus === 'selected') {
      Toast.show(this, t('skin_selected'));
    } else {
      Toast.show(this, t('purchase_ready'));
      flyCoins(this, from, { x: 972, y: 70 }, 8);
    }

    this.refreshGold();
    this.refreshItemButtons();
  }

  refreshGold() {
    this.profile = StorageService.loadProfile();
    this.goldText.setText(`${t('gold')}: ${this.profile.gold}`);
  }

  refreshItemButtons() {
    this.profile = StorageService.loadProfile();
    this.itemRows.forEach(({ item, button, stockText }) => {
      if (item.type === 'consumable') {
        const count = this.profile.purchasedItems[item.id] ?? 0;
        button.setLabel(t('buy'));
        stockText.setText(`В наличии: ${count}`);
        button.setEnabled(this.profile.gold >= item.price);
        return;
      }

      stockText.setText('');

      const purchased = Boolean(this.profile.purchasedItems[item.id]);
      const selected = this.profile.selectedSkins[item.skinGroup] === item.skinValue;

      if (selected) {
        button.setLabel(t('selected')).setEnabled(false);
      } else if (purchased) {
        button.setLabel(t('select')).setEnabled(true);
      } else {
        button.setLabel(t('buy')).setEnabled(this.profile.gold >= item.price);
      }
    });
  }
}
