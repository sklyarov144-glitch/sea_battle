import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { SHOP_ITEMS } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { EconomyService } from '../services/EconomyService.js';
import { LocalizationService, t } from '../services/LocalizationService.js';
import { SoundService } from '../services/SoundService.js';
import { StorageService } from '../services/StorageService.js';
import { Button } from '../ui/Button.js';
import { drawNavalPanel } from '../ui/NavalPanel.js';
import { Toast } from '../ui/Toast.js';
import { createCoverImageBackground, flyCoins } from '../utils/effects.js';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  init(data) {
    this.fromScene = data.from ?? 'MenuScene';
    this.shopPage = data.page ?? 'abilities';
  }

  create() {
    document.body.dataset.scene = 'ShopScene';
    this.profile = StorageService.loadProfile();
    LocalizationService.init(this.profile);
    SoundService.init(this.profile);
    SoundService.playMusic(this, SoundService.keys.music_menu);
    createCoverImageBackground(this, AssetKeys.Images.ShopBg, {
      fallback: { waterSkin: this.profile.selectedSkins.water },
      overlayAlpha: 0.42,
      overlayColor: 0x04121f
    });
    this.addHeader();
    this.addShopTabs();
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
    this.itemObjects?.forEach((object) => object.destroy());
    this.itemObjects = [];
    this.itemRows = [];
    const startY = 182;
    const columns = [
      { x: 84, textX: 154, buttonX: 492 },
      { x: 660, textX: 730, buttonX: 1068 }
    ];

    const pageItems = SHOP_ITEMS.filter((item) => (item.page ?? 'abilities') === this.shopPage);
    pageItems.forEach((item, index) => {
      const column = columns[index % 2];
      const y = startY + Math.floor(index / 2) * 118;
      const panel = drawNavalPanel(this, column.x, y - 42, 536, 104, { alpha: 0.92, radius: 9 });
      const iconKey = this.getItemIconKey(item);
      const icon = iconKey && this.textures.exists(iconKey)
        ? this.add.image(column.x + 45, y + 3, iconKey).setDisplaySize(42, 42)
        : null;

      const title = this.add.text(column.textX, y - 23, t(`shop_${item.id}_name`), {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '19px',
        color: '#fff0bf',
        fixedWidth: 310,
        wordWrap: { width: 310, useAdvancedWrap: true }
      }).setOrigin(0, 0.5);

      const desc = this.add.text(column.textX, y + 8, t(`shop_${item.id}_desc`), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#d9fbff',
        fixedWidth: 310,
        wordWrap: { width: 310, useAdvancedWrap: true },
        lineSpacing: 2
      }).setOrigin(0, 0);

      const priceText = this.add.text(column.buttonX, y - 32, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        color: '#fff5d6'
      }).setOrigin(0.5);

      const stockText = this.add.text(column.buttonX, y + 39, '', {
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
      this.itemObjects.push(panel, title, desc, priceText, stockText, button);
      if (icon) {
        this.itemObjects.push(icon);
      }
    });

    this.refreshItemButtons();
  }

  getItemIconKey(item) {
    const id = `${item.id} ${item.upgradeId ?? ''}`;
    if (id.includes('radar')) return AssetKeys.StyleIcons.Radar;
    if (id.includes('salvo')) return AssetKeys.StyleIcons.Salvo;
    if (id.includes('torpedo')) return AssetKeys.StyleIcons.Torpedo;
    if (id.includes('gold')) return AssetKeys.StyleIcons.Gold;
    if (id.includes('xp')) return AssetKeys.StyleIcons.Xp;
    return AssetKeys.StyleIcons.Rank;
  }

  addShopTabs() {
    this.abilityTab = new Button(this, GAME_WIDTH / 2 - 120, 128, 210, 42, t('shop_tab_abilities'), () => {
      this.shopPage = 'abilities';
      this.refreshTabs();
      this.addItems();
    }, { variant: 'secondary', fontSize: 16, small: true });
    this.upgradeTab = new Button(this, GAME_WIDTH / 2 + 120, 128, 210, 42, t('shop_tab_upgrades'), () => {
      this.shopPage = 'upgrades';
      this.refreshTabs();
      this.addItems();
    }, { variant: 'secondary', fontSize: 16, small: true });
    this.refreshTabs();
  }

  refreshTabs() {
    this.abilityTab?.setSelected(this.shopPage === 'abilities');
    this.upgradeTab?.setSelected(this.shopPage === 'upgrades');
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
    } else if (profile.__purchaseStatus === 'comingSoon') {
      Toast.show(this, t('coming_soon'));
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
        const stock = Object.keys(item.grants ?? {})
          .map((key) => `${t(key)}: ${this.profile.inventory?.[key] ?? 0}`)
          .join('  ');
        button.setLabel(t('buy'));
        priceText.setText(t('price_gold', { amount: item.price }));
        stockText.setText(stock || t('in_stock', { count: 0 }));
        button.setEnabled(this.profile.gold >= item.price);
        return;
      }

      if (item.type === 'comingSoon') {
        button.setLabel(t('coming_soon')).setEnabled(false);
        priceText.setText('');
        stockText.setText(t('coming_soon'));
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
