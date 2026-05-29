import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { LEVELS } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { EconomyService } from '../services/EconomyService.js';
import { LocalizationService, t } from '../services/LocalizationService.js';
import { SoundService } from '../services/SoundService.js';
import { StorageService } from '../services/StorageService.js';
import { Button } from '../ui/Button.js';
import { drawNavalPanel } from '../ui/NavalPanel.js';
import { SettingsModal } from '../ui/SettingsModal.js';
import { Toast } from '../ui/Toast.js';
import {
  allShipsSunk,
  chooseBotShot,
  createBattleSetup,
  findShipPresenceInArea,
  fireAt,
  getCellsInArea,
  getCellsInCross,
  getLineCells
} from '../utils/boardUtils.js';
import {
  cameraShake,
  createCoverImageBackground,
  pulseTarget,
  spawnExplosion,
  spawnSmoke,
  spawnSplash
} from '../utils/effects.js';

const QUICK_BATTLE_LOCATIONS = [
  'Открытое море',
  'Штормовая линия',
  'Торговый фарватер',
  'Безымянная отмель'
];

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.levelId = data.levelId ?? 1;
    this.playerSetup = data.playerSetup ?? null;
    this.battleMode = data.battleMode ?? 'campaign';
  }

  create() {
    document.body.dataset.scene = 'GameScene';
    document.body.dataset.level = String(this.levelId);
    this.level = LEVELS[this.levelId - 1] ?? LEVELS[0];
    this.profile = StorageService.loadProfile();
    LocalizationService.init(this.profile);
    SoundService.init(this.profile);
    SoundService.playMusic(this, SoundService.keys.music_battle);
    this.boosts = StorageService.consumeBattleBoosts() ?? { radar: 0, barrage: 0, torpedo: 0 };
    this.profile = StorageService.loadProfile();
    this.battle = createBattleSetup(this.level);

    this.playerBoard = this.playerSetup?.board ?? this.battle.player.board;
    this.playerShips = this.playerSetup?.ships ?? this.battle.player.ships;
    this.enemyBoard = this.battle.enemy.board;
    this.enemyShips = this.battle.enemy.ships;
    this.clearCombatEvents(this.enemyBoard);

    this.playerTurn = true;
    this.busy = false;
    this.battleEnded = false;
    this.exitConfirmOpen = false;
    this.selectedAbility = null;
    this.torpedoAxis = 'row';
    this.battleGold = 0;
    this.logs = [];
    this.hoveredEnemyCell = null;
    this.radarHighlights = new Map();

    this.abilityCharges = {
      radar: (this.boosts.radar ?? 0) + EconomyService.getAbilityBonus(this.profile, 'radar'),
      barrage: (this.boosts.barrage ?? 0) + EconomyService.getAbilityBonus(this.profile, 'barrage'),
      torpedo: (this.boosts.torpedo ?? 0) + EconomyService.getAbilityBonus(this.profile, 'torpedo')
    };

    createCoverImageBackground(this, AssetKeys.Images.BattleOceanBg, {
      fallback: { waterSkin: this.profile.selectedSkins.water },
      overlayAlpha: 0.32,
      overlayColor: 0x031827,
      scale: 1.02,
      toScale: 1.06,
      panX: -14,
      panY: 10,
      duration: 16000
    });
    this.createLayout();
    this.createBoardOverlays();
    this.createStatusPanel();
    this.createBoards();
    this.createCenterPanel();
    this.createAbilityPanel();
    this.updateAllBoards();
    this.addLog(`${t('your_turn')}.`);
  }

  createLayout() {
    const enemySize = this.enemyBoard?.length ?? 8;
    const playerSize = this.playerBoard?.length ?? 8;
    const enemyY = 128;
    const enemyCell = Math.floor(Math.min(52, (566 - enemyY) / enemySize));
    const playerCell = Math.floor(Math.min(40, 314 / playerSize));
    const enemyBoardWidth = enemySize * enemyCell;
    const playerBoardWidth = playerSize * playerCell;
    this.layout = {
      player: { x: Math.round(70 + (336 - playerBoardWidth) / 2), y: 190, cell: playerCell, size: playerSize },
      enemy: { x: Math.round(742 + (432 - enemyBoardWidth) / 2), y: enemyY, cell: enemyCell, size: enemySize },
      playerCannon: { x: 430, y: 548 },
      enemyCannon: { x: 1190, y: 126 }
    };
  }

  clearCombatEvents(board) {
    board.forEach((row) => {
      row.forEach((cell) => {
        cell.event = null;
        cell.hint = false;
      });
    });
  }

  createBoardOverlays() {
    const overlay = this.add.graphics();
    overlay.setDepth(-20);
    overlay.fillStyle(0x041f32, 0.52);
    overlay.fillRoundedRect(42, 128, 366, 408, 10);
    overlay.fillRoundedRect(700, 104, 512, 470, 10);
    overlay.fillRoundedRect(420, 126, 270, 388, 12);
    overlay.lineStyle(2, 0x65d6ef, 0.22);
    overlay.strokeRoundedRect(42, 128, 366, 408, 10);
    overlay.strokeRoundedRect(700, 104, 512, 470, 10);
  }

  createStatusPanel() {
    drawNavalPanel(this, 42, 18, 1196, 78);

    const locationName = this.battleMode === 'quick'
      ? QUICK_BATTLE_LOCATIONS[(this.levelId - 1) % QUICK_BATTLE_LOCATIONS.length]
      : `Остров ${this.level.id}: ${this.level.name}`;

    this.add.text(72, 43, locationName, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '25px',
      color: '#fff0bf'
    });

    this.goldText = this.add.text(72, 80, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#fff5d6'
    });

    this.turnText = this.add.text(GAME_WIDTH / 2, 58, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#d9fbff',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(800, 48, `Капитан ур. ${this.profile.captainLevel}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#fff5d6'
    });

    this.settingsButton = new Button(this, 1040, 58, 124, 42, t('settings'), () => this.openSettings(), {
      fontSize: 13,
      variant: 'secondary',
      small: true,
      hitPadding: 26
    });

    this.exitButton = new Button(this, 1164, 58, 116, 42, t('menu'), () => this.showExitConfirm(), {
      fontSize: 15,
      variant: 'danger',
      small: true,
      hitPadding: 26
    });

    this.updateStatus();
  }

  showExitConfirm() {
    if (this.battleEnded || this.exitConfirmOpen) {
      return;
    }

    this.exitConfirmOpen = true;
    this.cancelAbility();
    this.updateAbilityButtons();

    this.exitOverlay = this.add.container(0, 0).setDepth(500);
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020812, 0.68);
    dim.setInteractive();
    const panel = drawNavalPanel(this, GAME_WIDTH / 2 - 270, GAME_HEIGHT / 2 - 116, 540, 232, { alpha: 0.98 });
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 62, t('leave_battle'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      color: '#fff0bf',
      stroke: '#2b170b',
      strokeThickness: 4
    }).setOrigin(0.5);
    const message = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 12, t('leave_battle_text'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#fff5d6',
      align: 'center'
    }).setOrigin(0.5);
    const stayButton = new Button(this, GAME_WIDTH / 2 - 128, GAME_HEIGHT / 2 + 62, 238, 64, t('stay'), () => {
      this.closeExitConfirm();
    }, {
      fontSize: 21,
      variant: 'secondary',
      hitPadding: 26
    });
    const leaveButton = new Button(this, GAME_WIDTH / 2 + 128, GAME_HEIGHT / 2 + 62, 238, 64, t('to_menu'), () => {
      this.scene.start('MenuScene');
    }, {
      fontSize: 21,
      variant: 'danger',
      hitPadding: 26
    });

    this.exitOverlay.add([dim, panel, title, message, stayButton, leaveButton]);
  }

  closeExitConfirm() {
    this.exitConfirmOpen = false;
    this.exitOverlay?.destroy();
    this.exitOverlay = null;
    this.updateAbilityButtons();
  }

  openSettings() {
    if (this.settingsModal || this.exitConfirmOpen || this.battleEnded) {
      return;
    }
    this.cancelAbility();
    this.settingsModal = new SettingsModal(this, {
      onLanguageChanged: () => {
        this.updateStatus();
        this.updateAbilityButtons();
      },
      onMusicChanged: (enabled) => {
        if (enabled) {
          SoundService.playMusic(this, SoundService.keys.music_battle);
        }
      },
      onClose: () => {
        this.settingsModal = null;
        this.updateAbilityButtons();
      }
    });
    this.updateAbilityButtons();
  }

  createBoards() {
    this.add.text(238, 154, t('your_fleet'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '28px',
      color: '#fff0bf',
      stroke: '#2b170b',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(this.layout.enemy.x + (this.layout.enemy.size * this.layout.enemy.cell) / 2, 116, t('enemy_waters'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px',
      color: '#fff0bf',
      stroke: '#2b170b',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.playerCells = this.createBoardCells('player', this.layout.player);
    this.enemyCells = this.createBoardCells('enemy', this.layout.enemy);
    this.createMortars();
  }

  createMortars() {
    this.drawMortar(this.layout.playerCannon.x, this.layout.playerCannon.y, 0.28);
    this.drawMortar(this.layout.enemyCannon.x, this.layout.enemyCannon.y, Math.PI + 0.35);
  }

  drawMortar(x, y, rotation) {
    const g = this.add.graphics().setDepth(24);
    g.setPosition(x, y);
    g.setRotation(rotation);
    g.fillStyle(0x091522, 0.94);
    g.fillRoundedRect(-21, -14, 44, 28, 9);
    g.lineStyle(3, 0x9c6b2f, 0.95);
    g.strokeRoundedRect(-21, -14, 44, 28, 9);
    g.fillStyle(0x1f3344, 0.98);
    g.fillRoundedRect(4, -9, 34, 18, 8);
    g.lineStyle(2, 0xf0c35a, 0.75);
    g.strokeRoundedRect(4, -9, 34, 18, 8);
    g.fillStyle(0xd7a748, 0.85);
    g.fillCircle(-18, 14, 5);
    g.fillCircle(18, 14, 5);
    return g;
  }

  createBoardCells(kind, layout) {
    const cells = [];

    const boardSize = layout.size ?? 8;
    for (let y = 0; y < boardSize; y += 1) {
      cells[y] = [];
      for (let x = 0; x < boardSize; x += 1) {
        const px = Math.round(layout.x + x * layout.cell);
        const py = Math.round(layout.y + y * layout.cell);
        const graphics = this.add.graphics().setDepth(30);
        const icon = this.add.text(px + layout.cell / 2, py + layout.cell / 2, '', {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(layout.cell * 0.38)}px`,
          color: '#ffffff',
          align: 'center'
        }).setOrigin(0.5).setDepth(31);

        const zone = this.add.zone(px + layout.cell / 2, py + layout.cell / 2, layout.cell - 2, layout.cell - 2);

        if (kind === 'enemy') {
          zone.setInteractive({ useHandCursor: true });
          zone.on('pointerover', () => {
            this.hoveredEnemyCell = { x, y };
            this.updateEnemyBoard();
          });
          zone.on('pointerout', () => {
            this.hoveredEnemyCell = null;
            this.updateEnemyBoard();
          });
          zone.on('pointerup', () => this.handleEnemyCellClick(x, y));
        }

        cells[y][x] = { graphics, icon, zone };
      }
    }

    return cells;
  }

  createCenterPanel() {
    drawNavalPanel(this, 432, 138, 244, 360);

    this.add.text(554, 160, t('logbook'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px',
      color: '#fff0bf'
    }).setOrigin(0.5);

    this.logText = this.add.text(454, 198, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      color: '#fff5d6',
      fixedWidth: 200,
      fixedHeight: 82,
      lineSpacing: 5,
      wordWrap: { width: 200, useAdvancedWrap: true }
    });

    this.add.image(556, 446, AssetKeys.Textures.Compass).setScale(1.15).setAlpha(0.88);
  }

  createAbilityPanel() {
    drawNavalPanel(this, 170, 588, 940, 82);

    this.abilityButtons = {
      radar: new Button(this, 340, 626, 214, 44, '', () => this.selectAbility('radar'), {
        fontSize: 19,
        variant: 'secondary',
        small: false,
        hitPadding: 26
      }),
      barrage: new Button(this, 640, 626, 214, 44, '', () => this.selectAbility('barrage'), {
        fontSize: 19,
        variant: 'secondary',
        small: false,
        hitPadding: 26
      }),
      torpedo: new Button(this, 940, 626, 214, 44, '', () => this.selectAbility('torpedo'), {
        fontSize: 19,
        variant: 'secondary',
        small: false,
        hitPadding: 26
      })
    };
    this.abilityChargeTexts = {
      radar: this.add.text(340, 656, '', this.createChargeTextStyle()).setOrigin(0.5),
      barrage: this.add.text(640, 656, '', this.createChargeTextStyle()).setOrigin(0.5),
      torpedo: this.add.text(940, 656, '', this.createChargeTextStyle()).setOrigin(0.5)
    };

    this.updateAbilityButtons();
  }

  createChargeTextStyle() {
    return {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#d9fbff',
      align: 'center',
      fixedWidth: 210
    };
  }

  updateStatus() {
    this.goldText.setText('');
    this.turnText.setText(this.playerTurn ? t('your_turn') : t('opponent_turn'));
    document.body.dataset.turn = this.playerTurn ? 'player' : 'bot';
    document.body.dataset.battleGold = String(this.battleGold);
  }

  updateAbilityButtons() {
    const canAct = this.playerTurn && !this.busy && !this.battleEnded && !this.exitConfirmOpen;
    document.body.dataset.busy = String(this.busy);
    document.body.dataset.selectedAbility = this.selectedAbility ?? '';
    document.body.dataset.torpedoAxis = this.torpedoAxis;
    document.body.dataset.abilityCharges = JSON.stringify(this.abilityCharges);
    this.abilityButtons.radar
      .setLabel(t('radar'))
      .setEnabled(canAct && this.abilityCharges.radar > 0)
      .setSelected(this.selectedAbility === 'radar');
    this.abilityButtons.barrage
      .setLabel(t('barrage'))
      .setEnabled(canAct && this.abilityCharges.barrage > 0)
      .setSelected(this.selectedAbility === 'barrage');
    this.abilityButtons.torpedo
      .setLabel(t('torpedo'))
      .setEnabled(canAct && this.abilityCharges.torpedo > 0)
      .setSelected(this.selectedAbility === 'torpedo');
    this.abilityChargeTexts.radar.setText(`В наличии: ${this.abilityCharges.radar}`);
    this.abilityChargeTexts.barrage.setText(`В наличии: ${this.abilityCharges.barrage}`);
    this.abilityChargeTexts.torpedo.setText(`В наличии: ${this.abilityCharges.torpedo}`);
    this.exitButton?.setEnabled(!this.battleEnded && !this.exitConfirmOpen);
    this.settingsButton?.setEnabled(!this.battleEnded && !this.exitConfirmOpen);
  }

  updateAllBoards() {
    this.updatePlayerBoard();
    this.updateEnemyBoard();
    this.updateStatus();
    this.updateAbilityButtons();
  }

  updatePlayerBoard() {
    this.drawBoard(this.playerCells, this.playerBoard, this.layout.player, true);
  }

  updateEnemyBoard() {
    this.drawBoard(this.enemyCells, this.enemyBoard, this.layout.enemy, false);
  }

  drawBoard(cellViews, board, layout, revealShips) {
    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board[y].length; x += 1) {
        this.drawCell(cellViews[y][x], board[y][x], layout, revealShips);
      }
    }
  }

  drawCell(view, cell, layout, revealShips) {
    const px = Math.round(layout.x + cell.x * layout.cell);
    const py = Math.round(layout.y + cell.y * layout.cell);
    const size = layout.cell - 4;
    const isEnemy = !revealShips;
    const hover = isEnemy && this.hoveredEnemyCell?.x === cell.x && this.hoveredEnemyCell?.y === cell.y;
    const radarColor = this.radarHighlights.get(`${cell.x}:${cell.y}`);
    let fill = 0x0e6079;
    let stroke = 0x65d6ef;
    let alpha = 0.78;
    let icon = '';
    let iconColor = '#ffffff';

    if (revealShips && cell.shipId !== null) {
      fill = this.profile.selectedSkins.ship === 'goldCorsair' ? 0xb98622 : 0x654321;
      stroke = 0xf0c35a;
    }

    if (cell.shot) {
      if (cell.shipId !== null) {
        fill = cell.sunk ? 0x2a1b1b : 0x8f2f24;
        stroke = cell.sunk ? 0x111111 : 0xffd36e;
        icon = cell.sunk ? '✖' : '✹';
        iconColor = cell.sunk ? '#aab3bd' : '#ffe6a8';
      } else {
        fill = 0x155d78;
        stroke = 0x89e6ff;
        icon = '•';
        iconColor = '#c7fbff';

      }
    }

    if (radarColor && !cell.shot) {
      fill = radarColor;
      alpha = 0.38;
      stroke = radarColor;
    }

    view.graphics.clear();
    view.graphics.fillStyle(0x041f32, 0.46);
    view.graphics.fillRoundedRect(px + 3, py + 4, size, size, 5);
    view.graphics.fillStyle(fill, alpha);
    view.graphics.fillRoundedRect(px + 1, py + 1, size, size, 5);
    view.graphics.lineStyle(hover ? 4 : 2, hover ? 0xfff0a6 : stroke, hover ? 1 : 0.8);
    view.graphics.strokeRoundedRect(px + 1, py + 1, size, size, 5);

    if (hover && this.playerTurn && !this.busy) {
      view.graphics.lineStyle(2, this.selectedAbility ? 0xff786e : 0xf0c35a, 0.85);
      view.graphics.strokeCircle(px + layout.cell / 2, py + layout.cell / 2, layout.cell * 0.32);
    }

    if (revealShips && cell.shipId !== null) {
      const segment = Math.min(layout.cell * 0.72, layout.cell - 14);
      const cx = px + layout.cell / 2;
      const cy = py + layout.cell / 2;
      const shipFill = cell.shot ? (cell.sunk ? 0x3a2424 : 0xb93632) : (this.profile.selectedSkins.ship === 'goldCorsair' ? 0xc99634 : 0x9a642f);
      const shipStroke = cell.shot ? (cell.sunk ? 0x111111 : 0xffd36e) : 0xf0c35a;
      view.graphics.fillStyle(shipFill, 0.96);
      view.graphics.fillRoundedRect(cx - segment / 2, cy - segment / 2, segment, segment, 7);
      view.graphics.lineStyle(2, shipStroke, 0.92);
      view.graphics.strokeRoundedRect(cx - segment / 2, cy - segment / 2, segment, segment, 7);
      view.graphics.fillStyle(0xffe0a6, 0.82);
      view.graphics.fillCircle(cx, cy, Math.max(2.5, segment * 0.12));
    }

    view.icon.setText(icon);
    view.icon.setColor(iconColor);
  }

  handleEnemyCellClick(x, y) {
    if (!this.playerTurn || this.busy || this.battleEnded) {
      return;
    }

    if (this.selectedAbility === 'radar') {
      this.useRadar(x, y);
      return;
    }

    if (this.selectedAbility === 'barrage') {
      this.useBarrage(x, y);
      return;
    }

    if (this.selectedAbility === 'torpedo') {
      this.useTorpedo(x, y);
      return;
    }

    this.playerFireSequence([{ x, y }], { source: 'single' });
  }

  selectAbility(ability) {
    if (!this.playerTurn || this.busy || this.abilityCharges[ability] <= 0) {
      return;
    }

    this.selectedAbility = this.selectedAbility === ability ? null : ability;
    const labels = {
      radar: `${t('radar')}: выберите центр области 3x3.`,
      barrage: `${t('barrage')}: выберите центр креста.`,
      torpedo: `${t('torpedo')}: выберите строку или колонку и клетку.`
    };
    this.addLog(labels[ability]);
    this.updateAbilityButtons();
  }

  cancelAbility() {
    this.selectedAbility = null;
    this.addLog(t('cancel'));
    this.updateAbilityButtons();
  }

  setTorpedoAxis(axis) {
    this.torpedoAxis = axis;
    this.updateAbilityButtons();
  }

  useRadar(x, y) {
    this.abilityCharges.radar -= 1;
    this.selectedAbility = null;
    const hasShip = findShipPresenceInArea(this.enemyBoard, x, y, 1);
    const color = hasShip ? 0xffd36e : 0x65e4ff;

    getCellsInArea(x, y, 1).forEach((cell) => {
      this.radarHighlights.set(`${cell.x}:${cell.y}`, color);
    });

    const center = this.getEnemyCellCenter(x, y);
    pulseTarget(this, center.x, center.y, 92, color);
    this.addLog(hasShip ? 'Радар поймал корабельный сигнал!' : 'Радар показывает пустую воду.');
    this.updateAllBoards();

    this.time.delayedCall(1700, () => {
      getCellsInArea(x, y, 1).forEach((cell) => this.radarHighlights.delete(`${cell.x}:${cell.y}`));
      this.updateEnemyBoard();
    });
  }

  useBarrage(x, y) {
    const cells = getCellsInCross(x, y).filter((cell) => !this.enemyBoard[cell.y][cell.x].shot);
    if (cells.length === 0) {
      Toast.show(this, 'Все клетки залпа уже разведаны.');
      return;
    }

    this.abilityCharges.barrage -= 1;
    this.selectedAbility = null;
    this.playerFireSequence(cells, { source: 'barrage' });
  }

  useTorpedo(x, y) {
    const cells = getLineCells(x, y, this.torpedoAxis).filter((cell) => !this.enemyBoard[cell.y][cell.x].shot);
    if (cells.length === 0) {
      Toast.show(this, 'Эта линия уже прострелена.');
      return;
    }

    this.abilityCharges.torpedo -= 1;
    this.selectedAbility = null;
    this.playerFireSequence(cells, { source: 'torpedo', stopOnHit: true });
  }

  async playerFireSequence(cells, options = {}) {
    this.busy = true;
    this.playerTurn = true;
    this.updateAllBoards();

    let validShot = false;
    let anyHit = false;

    for (const cell of cells) {
      if (this.battleEnded) {
        return;
      }

      const result = fireAt(this.enemyBoard, this.enemyShips, cell.x, cell.y);
      if (!result.valid) {
        continue;
      }

      validShot = true;
      await this.animatePlayerShot(result);
      await this.resolvePlayerShot(result);
      anyHit = anyHit || result.hit;
      this.updateAllBoards();

      if (allShipsSunk(this.enemyShips)) {
        this.endBattle(true);
        return;
      }

      if (options.stopOnHit && result.hit) {
        break;
      }
    }

    if (!validShot) {
      Toast.show(this, 'Эта клетка уже разведана.');
      this.busy = false;
      this.updateAllBoards();
      return;
    }

    if (!anyHit) {
      this.addLog(`${t('miss')} ${t('opponent_turn')}.`);
      this.startBotTurn();
      return;
    }

    this.busy = false;
    this.playerTurn = true;
    this.addLog(`${t('hit')} ${t('your_turn')}.`);
    this.updateAllBoards();
  }

  async resolvePlayerShot(result) {
    const center = this.getEnemyCellCenter(result.x, result.y);

    if (result.hit) {
      spawnExplosion(this, center.x, center.y);
      SoundService.playSfx(this, SoundService.keys.sfx_hit);
      this.addLog(result.sunk ? 'Корабль врага потоплен!' : t('hit'));
      if (result.sunk) {
        SoundService.playSfx(this, SoundService.keys.sfx_explosion);
        cameraShake(this, 0.007, 250);
        spawnSmoke(this, center.x, center.y - 8);
      }
      return;
    }

    spawnSplash(this, center.x, center.y);
    SoundService.playSfx(this, SoundService.keys.sfx_miss);
    this.addLog(t('miss'));
  }

  async startBotTurn() {
    this.playerTurn = false;
    this.busy = true;
    this.updateAllBoards();
    this.addLog('Соперник целится...');
    await this.wait(Phaser.Math.Between(1000, 3000));

    while (!this.battleEnded) {
      const shot = chooseBotShot(this.playerBoard, this.playerShips, this.level.botSkill);
      if (!shot) {
        this.endBattle(true);
        return;
      }

      const result = fireAt(this.playerBoard, this.playerShips, shot.x, shot.y);
      if (!result.valid) {
        continue;
      }

      await this.animateBotShot(result);
      this.resolveBotShot(result);
      this.updateAllBoards();

      if (allShipsSunk(this.playerShips)) {
        this.endBattle(false);
        return;
      }

      if (!result.hit) {
        break;
      }

      this.addLog('Соперник целится...');
      await this.wait(Phaser.Math.Between(1000, 3000));
    }

    this.playerTurn = true;
    this.busy = false;
    this.addLog(t('your_turn'));
    this.updateAllBoards();
  }

  resolveBotShot(result) {
    const center = this.getPlayerCellCenter(result.x, result.y);

    if (result.hit) {
      spawnExplosion(this, center.x, center.y);
      SoundService.playSfx(this, SoundService.keys.sfx_hit);
      this.addLog(result.sunk ? 'Соперник потопил ваш корабль!' : t('opponent_hit'));
      if (result.sunk) {
        SoundService.playSfx(this, SoundService.keys.sfx_explosion);
        cameraShake(this, 0.008, 260);
        spawnSmoke(this, center.x, center.y);
      }
      return;
    }

    spawnSplash(this, center.x, center.y);
    SoundService.playSfx(this, SoundService.keys.sfx_miss);
    this.addLog(t('opponent_miss'));
  }

  async animatePlayerShot(result) {
    const target = this.getEnemyCellCenter(result.x, result.y);
    SoundService.playSfx(this, SoundService.keys.sfx_shot);
    await this.createProjectileArc(this.layout.playerCannon, target, { duration: 380, arc: 110, scale: 0.82 });
  }

  async animateBotShot(result) {
    const target = this.getPlayerCellCenter(result.x, result.y);
    SoundService.playSfx(this, SoundService.keys.sfx_shot);
    await this.createProjectileArc(this.layout.enemyCannon, target, { duration: 420, arc: 92, scale: 0.72 });
  }

  createProjectileArc(from, to, options = {}) {
    return new Promise((resolve) => {
      const ball = this.add.image(from.x, from.y, AssetKeys.Textures.Cannonball);
      ball.setDepth(options.depth ?? 80);
      ball.setScale(options.scale ?? 1);
      let finished = false;
      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        ball.destroy();
        resolve();
      };

      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: options.duration ?? 420,
        ease: 'Cubic.easeOut',
        onUpdate: (tween) => {
          const value = tween.getValue();
          const x = Phaser.Math.Linear(from.x, to.x, value);
          const y = Phaser.Math.Linear(from.y, to.y, value) - Math.sin(value * Math.PI) * (options.arc ?? 95);
          ball.setPosition(Math.round(x), Math.round(y));
          ball.setScale((options.scale ?? 1) * (1 + Math.sin(value * Math.PI) * 0.18));
        },
        onComplete: finish
      });

      window.setTimeout(finish, (options.duration ?? 420) + 700);
    });
  }

  getEnemyCellCenter(x, y) {
    return {
      x: this.layout.enemy.x + x * this.layout.enemy.cell + this.layout.enemy.cell / 2,
      y: this.layout.enemy.y + y * this.layout.enemy.cell + this.layout.enemy.cell / 2
    };
  }

  getPlayerCellCenter(x, y) {
    return {
      x: this.layout.player.x + x * this.layout.player.cell + this.layout.player.cell / 2,
      y: this.layout.player.y + y * this.layout.player.cell + this.layout.player.cell / 2
    };
  }

  addLog(message) {
    if (this.currentLogMessage === message) {
      return;
    }
    this.currentLogMessage = message;
    document.body.dataset.lastLog = message;
    if (this.logText) {
      this.logText.setText(message);
    }
  }

  wait(delay) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, delay);
    });
  }

  endBattle(victory) {
    if (this.battleEnded) {
      return;
    }

    this.battleEnded = true;
    this.busy = true;
    this.playerTurn = false;
    this.updateAllBoards();

    if (victory) {
      this.addLog('Победа! Сундук ждёт капитана.');
    } else {
      this.addLog('Флот разбит. Команда отступает.');
    }

    const profile = StorageService.loadProfile();
    const rewardGold = EconomyService.getBattleGoldReward({
      victory,
      battleMode: this.battleMode,
      levelId: this.level.id,
      profile
    });
    const rewardXp = EconomyService.getBattleXpReward({
      victory,
      battleMode: this.battleMode,
      profile
    });
    const extraChestGold = victory && EconomyService.rollExtraChest(profile)
      ? EconomyService.getRewardedChestGold(profile)
      : 0;
    this.time.delayedCall(900, () => {
      this.scene.start('ResultScene', {
        victory,
        levelId: this.level.id,
        rewardGold,
        rewardXp,
        chestGold: extraChestGold,
        battleGold: this.battleGold,
        battleMode: this.battleMode
      });
    });
  }
}
