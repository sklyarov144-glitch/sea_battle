import Phaser from 'phaser';
import { SHOP_ITEMS } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { EconomyService } from '../services/EconomyService.js';
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
    const startY = 156;
    const columns = [
      { x: 84, textX: 112, buttonX: 492 },
      { x: 660, textX: 688, buttonX: 1068 }
    ];

    SHOP_ITEMS.forEach((item, index) => {
      const column = columns[index % 2];
      const y = startY + Math.floor(index / 2) * 124;
      drawNavalPanel(this, column.x, y - 42, 536, 108, { alpha: 0.92, radius: 9 });

      this.add.text(column.textX, y - 22, t(`shop_${item.id}_name`), {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '20px',
        color: '#fff0bf',
        fixedWidth: 310,
        wordWrap: { width: 310, useAdvancedWrap: true }
      }).setOrigin(0, 0.5);

      this.add.text(column.textX, y + 14, t(`shop_${item.id}_desc`), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#d9fbff',
        fixedWidth: 310,
        wordWrap: { width: 310, useAdvancedWrap: true },
        lineSpacing: 2
      }).setOrigin(0, 0);

      const priceText = this.add.text(column.buttonX, y - 34, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        color: '#fff5d6'
      }).setOrigin(0.5);

      const stockText = this.add.text(column.buttonX, y + 42, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#d9fbff',
        align: 'center',
        fixedWidth: 168
      }).setOrigin(0.5);

      const button = new Button(this, column.buttonX, y + 4, 164, 42, '', () => {
        this.buyItem(item, { x: button.x, y: button.y });
      }, { fontSize: 17, variant: 'secondary', small: true });

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
    } else if (profile.__purchaseStatus === 'maxLevel') {
      Toast.show(this, t('max_level'));
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
    this.itemRows.forEach(({ item, button, priceText, stockText }) => {
      if (item.type === 'consumable') {
        const count = this.profile.inventory?.[item.inventoryKey] ?? 0;
        button.setLabel(t('buy'));
        priceText.setText(t('price_gold', { amount: item.price }));
        stockText.setText(t('in_stock', { count }));
        button.setEnabled(this.profile.gold >= item.price);
        return;
      }

      if (item.type === 'upgrade') {
        const level = EconomyService.getUpgradeLevel(this.profile, item.upgradeId);
        const price = EconomyService.getUpgradePrice(this.profile, item.upgradeId);
        button.setLabel(price === null ? t('max_level_short') : t('buy'));
        button.setEnabled(price !== null && this.profile.gold >= price);
        priceText.setText(price === null ? t('max_level') : t('price_gold', { amount: price }));
        stockText.setText(t('upgrade_level', { level }));
        return;
      }

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
