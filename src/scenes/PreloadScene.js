import Phaser from 'phaser';
import { AssetConfig } from '../config/assetConfig.js';
import { AssetKeys } from '../config/assetKeys.js';
import { CAMPAIGN_ISLAND_FILES, CAMPAIGN_ISLAND_KEYS } from '../config/campaignVisualConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { drawNavalPanel } from '../ui/NavalPanel.js';
import { createCoverImageBackground, createSeaBackground } from '../utils/effects.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.loadStylePackImages();

    this.load.audio('music_menu', '/assets/audio/music_menu.mp3');
    this.load.audio('music_battle', '/assets/audio/music_battle.mp3');
    this.load.audio('sfx_click', '/assets/audio/click.wav');
    this.load.audio('sfx_shot', '/assets/audio/shot.wav');
    this.load.audio('sfx_hit', '/assets/audio/hit.wav');
    this.load.audio('sfx_miss', '/assets/audio/miss.wav');
    this.load.audio('sfx_explosion', '/assets/audio/explosion.wav');
    this.load.audio('sfx_reward', '/assets/audio/reward.wav');
    this.load.audio('sfx_rank_up', '/assets/audio/rank_up.wav');
    this.load.audio('sfx_button_hover', '/assets/audio/button_hover.wav');

    this.load.on('loaderror', (file) => {
      if (file?.type === 'audio' || String(file?.key ?? '').startsWith('style_')) {
        console.warn(`[PreloadScene] Optional asset skipped: ${file.key}`);
      }
    });
  }

  loadStylePackImages() {
    this.load.image(AssetKeys.Images.MenuBattleBg, AssetConfig.backgrounds.mainMenu);
    this.load.image(AssetKeys.Images.BattleOceanBg, AssetConfig.backgrounds.battle);
    this.load.image(AssetKeys.Images.CampaignBg, AssetConfig.backgrounds.campaign);
    this.load.image(AssetKeys.Images.ShopBg, AssetConfig.backgrounds.shop);

    this.load.image(AssetKeys.Images.DailyChestReward, AssetConfig.chests.dailyGlow);
    this.load.image(AssetKeys.Images.RareChestReward, AssetConfig.chests.epicGlow);

    [
      [AssetKeys.StyleChests.DailyClosed, AssetConfig.chests.dailyClosed],
      [AssetKeys.StyleChests.DailyGlow, AssetConfig.chests.dailyGlow],
      [AssetKeys.StyleChests.DailyOpen, AssetConfig.chests.dailyOpen],
      [AssetKeys.StyleChests.EpicClosed, AssetConfig.chests.epicClosed],
      [AssetKeys.StyleChests.EpicGlow, AssetConfig.chests.epicGlow],
      [AssetKeys.StyleChests.EpicOpen, AssetConfig.chests.epicOpen],
      [AssetKeys.StyleChests.NavalClosed, AssetConfig.chests.navalClosed],
      [AssetKeys.StyleChests.NavalGlow, AssetConfig.chests.navalGlow],
      [AssetKeys.StyleChests.NavalOpen, AssetConfig.chests.navalOpen],
      [AssetKeys.StyleIcons.Gold, AssetConfig.icons.gold],
      [AssetKeys.StyleIcons.Gem, AssetConfig.icons.gem],
      [AssetKeys.StyleIcons.Xp, AssetConfig.icons.xp],
      [AssetKeys.StyleIcons.Rank, AssetConfig.icons.rank],
      [AssetKeys.StyleIcons.RankShield, AssetConfig.icons.rankShield],
      [AssetKeys.StyleIcons.Radar, AssetConfig.icons.radar],
      [AssetKeys.StyleIcons.Salvo, AssetConfig.icons.salvo],
      [AssetKeys.StyleIcons.Torpedo, AssetConfig.icons.torpedo],
      [AssetKeys.StyleIcons.Settings, AssetConfig.icons.settings],
      [AssetKeys.StyleIcons.Menu, AssetConfig.icons.menu],
      [AssetKeys.StyleIcons.Map, AssetConfig.icons.map],
      [AssetKeys.StyleIcons.Flag, AssetConfig.icons.flag],
      [AssetKeys.StyleIcons.Mail, AssetConfig.icons.mail],
      [AssetKeys.StyleIcons.Social, AssetConfig.icons.social],
      [AssetKeys.StyleButtons.Primary, AssetConfig.buttons.primary],
      [AssetKeys.StyleButtons.Secondary, AssetConfig.buttons.secondary],
      [AssetKeys.StyleButtons.Ready, AssetConfig.buttons.ready],
      [AssetKeys.StyleButtons.Danger, AssetConfig.buttons.danger],
      [AssetKeys.StyleButtons.MediumPrimary, AssetConfig.buttons.mediumPrimary],
      [AssetKeys.StyleButtons.MediumSecondary, AssetConfig.buttons.mediumSecondary],
      [AssetKeys.StyleButtons.MediumReady, AssetConfig.buttons.mediumReady],
      [AssetKeys.StyleButtons.MediumDanger, AssetConfig.buttons.mediumDanger],
      [AssetKeys.StyleButtons.SmallPrimary, AssetConfig.buttons.smallPrimary],
      [AssetKeys.StyleButtons.SmallSecondary, AssetConfig.buttons.smallSecondary],
      [AssetKeys.StyleButtons.SmallDanger, AssetConfig.buttons.smallDanger],
      [AssetKeys.StylePanels.Wide, AssetConfig.panels.wide],
      [AssetKeys.StylePanels.Large, AssetConfig.panels.large],
      [AssetKeys.StylePanels.Medium, AssetConfig.panels.medium],
      [AssetKeys.StylePanels.Small, AssetConfig.panels.small],
      [AssetKeys.StylePanels.Tall, AssetConfig.panels.tall],
      [AssetKeys.StyleFrames.Card, AssetConfig.frames.card],
      [AssetKeys.StyleFrames.ShopCard, AssetConfig.frames.shopCard],
      [AssetKeys.StyleFrames.Modal, AssetConfig.frames.modal],
      [AssetKeys.StyleFrames.Result, AssetConfig.frames.result],
      [AssetKeys.StyleEffects.Victory1, AssetConfig.effects.victory[0]],
      [AssetKeys.StyleEffects.Victory2, AssetConfig.effects.victory[1]],
      [AssetKeys.StyleEffects.Victory3, AssetConfig.effects.victory[2]],
      [AssetKeys.StyleEffects.Victory4, AssetConfig.effects.victory[3]],
      [AssetKeys.StyleEffects.Defeat1, AssetConfig.effects.defeat[0]],
      [AssetKeys.StyleEffects.Defeat2, AssetConfig.effects.defeat[1]],
      [AssetKeys.StyleEffects.Defeat3, AssetConfig.effects.defeat[2]]
    ].forEach(([key, path]) => this.load.image(key, path));

    Object.entries(CAMPAIGN_ISLAND_FILES).forEach(([id, file]) => {
      this.load.image(CAMPAIGN_ISLAND_KEYS[id], `${AssetConfig.backgrounds.islandsPath}${file}`);
    });
  }

  create() {
    document.body.dataset.scene = 'PreloadScene';
    if (this.textures.exists(AssetKeys.Images.MenuBattleBg)) {
      createCoverImageBackground(this, AssetKeys.Images.MenuBattleBg, { overlayAlpha: 0.42 });
    } else {
      createSeaBackground(this);
    }
    drawNavalPanel(this, GAME_WIDTH / 2 - 240, GAME_HEIGHT / 2 - 58, 480, 116);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'Поднимаем паруса...', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      color: '#fff0bf'
    }).setOrigin(0.5);

    const bar = this.add.graphics();
    bar.fillStyle(0x0e2f45, 1);
    bar.fillRoundedRect(GAME_WIDTH / 2 - 190, GAME_HEIGHT / 2 + 22, 380, 18, 7);
    bar.fillStyle(0xf0c35a, 1);
    bar.fillRoundedRect(GAME_WIDTH / 2 - 186, GAME_HEIGHT / 2 + 26, 372, 10, 5);

    window.setTimeout(() => {
      this.scene.start('MenuScene');
    }, 360);
  }
}
