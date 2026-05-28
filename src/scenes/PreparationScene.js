import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { BOARD_SIZE } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { Button } from '../ui/Button.js';
import { Toast } from '../ui/Toast.js';
import {
  canPlaceShip,
  cloneBoardSetup,
  createEmptyBoard,
  createShip,
  generateFleet,
  placeShip,
  SHIP_BLUEPRINTS
} from '../utils/boardUtils.js';
import { createCoverImageBackground, drawWoodPanel } from '../utils/effects.js';

export class PreparationScene extends Phaser.Scene {
  constructor() {
    super('PreparationScene');
  }

  init(data) {
    this.levelId = data.levelId ?? 1;
  }

  create() {
    document.body.dataset.scene = 'PreparationScene';
    document.body.dataset.level = String(this.levelId);
    createCoverImageBackground(this, AssetKeys.Images.BattleOceanBg, {
      overlayAlpha: 0.42,
      overlayColor: 0x031827,
      scale: 1.02,
      toScale: 1.06,
      panX: -10,
      panY: 8,
      duration: 16000
    });

    this.board = createEmptyBoard(BOARD_SIZE);
    this.ships = [];
    this.nextShipId = 1;
    this.direction = 'horizontal';
    this.selectedTemplateIndex = 0;
    this.placedTemplateIds = new Set();
    this.cellViews = [];
    this.previewCells = [];
    this.timeLeft = 30;

    this.shipTemplates = SHIP_BLUEPRINTS.flatMap((blueprint) =>
      Array.from({ length: blueprint.count }, (_, index) => ({
        id: `${blueprint.length}-${index}`,
        length: blueprint.length,
        label: `${blueprint.length} клетки`
      }))
    );

    this.addHeader();
    this.addBoard();
    this.addShipList();
    this.addControls();
    this.updateBoard();
    this.updateShipList();
    this.updateReadyState();
    this.startTimer();
  }

  addHeader() {
    drawWoodPanel(this, 48, 24, 1184, 86);
    this.add.text(82, 50, 'Подготовка флота', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      color: '#fff0bf'
    });
    this.timerText = this.add.text(GAME_WIDTH / 2, 67, 'Подготовка: 00:30', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      color: '#d9fbff',
      stroke: '#041f32',
      strokeThickness: 4
    }).setOrigin(0.5);
  }

  addBoard() {
    this.boardLayout = { x: 128, y: 154, cell: 58 };
    const panel = this.add.graphics();
    panel.fillStyle(0x041f32, 0.58);
    panel.fillRoundedRect(94, 122, 532, 532, 12);
    panel.lineStyle(2, 0x65d6ef, 0.32);
    panel.strokeRoundedRect(94, 122, 532, 532, 12);

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      this.cellViews[y] = [];
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const px = this.boardLayout.x + x * this.boardLayout.cell;
        const py = this.boardLayout.y + y * this.boardLayout.cell;
        const graphics = this.add.graphics();
        const zone = this.add.zone(px + this.boardLayout.cell / 2, py + this.boardLayout.cell / 2, this.boardLayout.cell - 2, this.boardLayout.cell - 2);
        zone.setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => {
          this.previewCells = this.getPlacementCells(x, y);
          this.updateBoard();
        });
        zone.on('pointerout', () => {
          this.previewCells = [];
          this.updateBoard();
        });
        zone.on('pointerup', () => this.tryPlaceSelectedShip(x, y));
        this.cellViews[y][x] = { graphics, zone };
      }
    }
  }

  addShipList() {
    drawWoodPanel(this, 690, 132, 482, 260, { fill: 0x563218, alpha: 0.94 });
    this.add.image(724, 168, AssetKeys.Icons.Ships).setDisplaySize(42, 42);
    this.add.text(760, 151, 'Корабли', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '30px',
      color: '#fff0bf'
    });

    this.shipButtons = this.shipTemplates.map((template, index) => {
      const x = 802 + (index % 2) * 210;
      const y = 232 + Math.floor(index / 2) * 70;
      return new Button(this, x, y, 188, 48, `${template.length} пал.`, () => {
        if (!this.placedTemplateIds.has(template.id)) {
          this.selectedTemplateIndex = index;
          this.updateShipList();
          this.updateBoard();
        }
      }, {
        fontSize: 19,
        iconKey: AssetKeys.Icons.Ships,
        iconSize: 28
      });
    });
  }

  addControls() {
    drawWoodPanel(this, 690, 418, 482, 202, { fill: 0x563218, alpha: 0.94 });
    this.directionButton = new Button(this, 825, 474, 228, 52, 'Поворот: горизонт.', () => {
      this.direction = this.direction === 'horizontal' ? 'vertical' : 'horizontal';
      this.directionButton.setLabel(this.direction === 'horizontal' ? 'Поворот: горизонт.' : 'Поворот: вертик.');
      this.updateBoard();
    }, {
      fontSize: 18,
      icon: '↻'
    });

    this.autoButton = new Button(this, 1044, 474, 260, 72, 'Авто', () => this.autoPlace(), {
      fontSize: 20,
      iconKey: AssetKeys.Icons.AutoPlace,
      backgroundKey: AssetKeys.Buttons.AutoPlace,
      iconSize: 38
    });

    this.readyButton = new Button(this, 936, 556, 330, 82, 'Готов к бою', () => this.startBattle(), {
      fontSize: 22,
      iconKey: AssetKeys.Icons.Ready,
      backgroundKey: AssetKeys.Buttons.Ready,
      iconSize: 44
    });

    new Button(this, 112, GAME_HEIGHT - 50, 190, 56, 'Назад', () => {
      this.scene.start('MapScene');
    }, {
      fontSize: 18,
      iconKey: AssetKeys.Icons.Cancel,
      backgroundKey: AssetKeys.Buttons.Cancel,
      iconSize: 30
    });
  }

  get selectedTemplate() {
    return this.shipTemplates[this.selectedTemplateIndex] ?? null;
  }

  getPlacementCells(x, y, template = this.selectedTemplate) {
    if (!template || this.placedTemplateIds.has(template.id)) {
      return [];
    }
    return Array.from({ length: template.length }, (_, index) => ({
      x: this.direction === 'horizontal' ? x + index : x,
      y: this.direction === 'vertical' ? y + index : y
    }));
  }

  tryPlaceSelectedShip(x, y) {
    const template = this.selectedTemplate;
    if (!template || this.placedTemplateIds.has(template.id)) {
      return;
    }

    if (!canPlaceShip(this.board, x, y, template.length, this.direction, true)) {
      this.flashError(this.getPlacementCells(x, y, template));
      Toast.show(this, 'Нельзя поставить сюда', { y: 112 });
      return;
    }

    const ship = createShip(template.length, this.nextShipId);
    this.nextShipId += 1;
    placeShip(this.board, ship, x, y, this.direction);
    this.ships.push(ship);
    this.placedTemplateIds.add(template.id);
    this.selectNextAvailableShip();
    this.updateBoard();
    this.updateShipList();
    this.updateReadyState();
  }

  selectNextAvailableShip() {
    const nextIndex = this.shipTemplates.findIndex((template) => !this.placedTemplateIds.has(template.id));
    this.selectedTemplateIndex = Math.max(0, nextIndex);
  }

  flashError(cells) {
    this.errorCells = cells;
    this.updateBoard();
    this.time.delayedCall(360, () => {
      this.errorCells = [];
      this.updateBoard();
    });
  }

  autoPlace() {
    const setup = generateFleet(BOARD_SIZE);
    this.board = setup.board;
    this.ships = setup.ships;
    this.placedTemplateIds = new Set(this.shipTemplates.map((template) => template.id));
    this.selectedTemplateIndex = 0;
    Toast.show(this, 'Флот расставлен', { y: 112 });
    this.updateBoard();
    this.updateShipList();
    this.updateReadyState();
  }

  updateBoard() {
    const previewKeys = new Set(this.previewCells.map((cell) => `${cell.x}:${cell.y}`));
    const errorKeys = new Set((this.errorCells ?? []).map((cell) => `${cell.x}:${cell.y}`));
    const previewOrigin = this.previewCells[0];
    const previewValid = Boolean(
      this.selectedTemplate &&
      previewOrigin &&
      canPlaceShip(this.board, previewOrigin.x, previewOrigin.y, this.selectedTemplate.length, this.direction, true)
    );

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const view = this.cellViews[y][x];
        const cell = this.board[y][x];
        const px = this.boardLayout.x + x * this.boardLayout.cell;
        const py = this.boardLayout.y + y * this.boardLayout.cell;
        const key = `${x}:${y}`;
        let fill = 0x0e6079;
        let stroke = 0x65d6ef;
        let alpha = 0.8;

        if (cell.shipId !== null) {
          fill = 0x8a5528;
          stroke = 0xf0c35a;
          alpha = 0.96;
        }
        if (previewKeys.has(key)) {
          fill = previewValid ? 0x2fbf71 : 0xb93632;
          stroke = previewValid ? 0xb8ffd2 : 0xffb0a8;
          alpha = 0.78;
        }
        if (errorKeys.has(key)) {
          fill = 0xb93632;
          stroke = 0xffd36e;
          alpha = 0.94;
        }

        view.graphics.clear();
        view.graphics.fillStyle(0x041f32, 0.46);
        view.graphics.fillRoundedRect(px + 3, py + 4, this.boardLayout.cell - 4, this.boardLayout.cell - 4, 5);
        view.graphics.fillStyle(fill, alpha);
        view.graphics.fillRoundedRect(px + 1, py + 1, this.boardLayout.cell - 4, this.boardLayout.cell - 4, 5);
        view.graphics.lineStyle(2, stroke, 0.9);
        view.graphics.strokeRoundedRect(px + 1, py + 1, this.boardLayout.cell - 4, this.boardLayout.cell - 4, 5);
      }
    }
  }

  updateShipList() {
    this.shipButtons.forEach((button, index) => {
      const template = this.shipTemplates[index];
      const placed = this.placedTemplateIds.has(template.id);
      button
        .setEnabled(!placed)
        .setSelected(!placed && index === this.selectedTemplateIndex)
        .setLabel(placed ? `${template.length} пал. ✓` : `${template.length} пал.`);
    });
  }

  updateReadyState() {
    const ready = this.ships.length === this.shipTemplates.length;
    this.readyButton.setEnabled(ready);
    if (ready && !this.readyPulse) {
      this.readyPulse = this.tweens.add({
        targets: this.readyButton,
        scale: 1.045,
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
    if (!ready && this.readyPulse) {
      this.readyPulse.stop();
      this.readyPulse = null;
      this.readyButton.setScale(1);
    }
  }

  startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeLeft -= 1;
        this.updateTimer();
        if (this.timeLeft <= 0) {
          this.timerEvent.remove(false);
          this.autoPlaceMissingAndStart();
        }
      }
    });
    this.updateTimer();
  }

  updateTimer() {
    this.timerText.setText(`Подготовка: 00:${String(Math.max(0, this.timeLeft)).padStart(2, '0')}`);
    this.timerText.setColor(this.timeLeft <= 5 ? '#ff9d66' : '#d9fbff');
  }

  autoPlaceMissingAndStart() {
    if (this.ships.length < this.shipTemplates.length) {
      this.autoPlace();
    }
    this.startBattle();
  }

  startBattle() {
    if (this.ships.length < this.shipTemplates.length) {
      return;
    }
    this.timerEvent?.remove(false);
    this.readyPulse?.stop();
    const playerSetup = cloneBoardSetup(this.board, this.ships);
    this.scene.start('GameScene', {
      levelId: this.levelId,
      playerSetup
    });
  }
}
