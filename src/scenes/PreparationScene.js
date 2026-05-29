import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { BOARD_SIZE } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { LocalizationService, t } from '../services/LocalizationService.js';
import { SoundService } from '../services/SoundService.js';
import { StorageService } from '../services/StorageService.js';
import { Button } from '../ui/Button.js';
import { drawNavalPanel } from '../ui/NavalPanel.js';
import { SettingsModal } from '../ui/SettingsModal.js';
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
import { createCoverImageBackground } from '../utils/effects.js';

export class PreparationScene extends Phaser.Scene {
  constructor() {
    super('PreparationScene');
  }

  init(data) {
    this.levelId = data.levelId ?? 1;
    this.battleMode = data.battleMode ?? 'campaign';
    this.returnScene = data.returnScene ?? 'MenuScene';
  }

  create() {
    document.body.dataset.scene = 'PreparationScene';
    document.body.dataset.level = String(this.levelId);
    this.profile = StorageService.loadProfile();
    LocalizationService.init(this.profile);
    SoundService.init(this.profile);
    SoundService.playMusic(this, SoundService.keys.music_battle);
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
    this.draggingTemplate = null;
    this.dragPreviewValid = false;
    this.shipItems = [];
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
    this.addSettingsButton();
    this.updateBoard();
    this.updateShipList();
    this.updateReadyState();
    this.startTimer();
  }

  addHeader() {
    drawNavalPanel(this, 48, 24, 1184, 86);
    this.add.text(82, 50, t('fleet_preparation'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      color: '#fff0bf'
    });
    this.timerText = this.add.text(GAME_WIDTH / 2, 67, `${t('preparation_timer')}: 00:30`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      color: '#d9fbff',
      stroke: '#041f32',
      strokeThickness: 4
    }).setOrigin(0.5);
  }

  addBoard() {
    this.boardLayout = { x: 125, y: 153, cell: 57 };
    const panel = this.add.graphics();
    panel.fillStyle(0x041f32, 0.58);
    panel.fillRoundedRect(94, 122, 508, 508, 12);
    panel.lineStyle(2, 0x65d6ef, 0.32);
    panel.strokeRoundedRect(94, 122, 508, 508, 12);

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      this.cellViews[y] = [];
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const px = this.boardLayout.x + x * this.boardLayout.cell;
        const py = this.boardLayout.y + y * this.boardLayout.cell;
        const graphics = this.add.graphics();
        const zone = this.add.zone(px + this.boardLayout.cell / 2, py + this.boardLayout.cell / 2, this.boardLayout.cell - 2, this.boardLayout.cell - 2);
        zone.setInteractive({ useHandCursor: true });
        this.input.setDraggable(zone);
        zone.on('pointerup', () => this.tryPlaceSelectedShip(x, y));
        zone.on('dragstart', (pointer) => this.startPlacedShipDrag(x, y, pointer));
        zone.on('drag', (pointer) => this.updateShipDrag(pointer));
        zone.on('dragend', (pointer) => this.endPlacedShipDrag(pointer));
        this.cellViews[y][x] = { graphics, zone };
      }
    }
  }

  addShipList() {
    drawNavalPanel(this, 690, 132, 482, 260, { title: 'Текущий корабль', titleSize: 26 });
    this.currentShipText = this.add.text(724, 186, '', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#fff0bf',
      fixedWidth: 402,
      wordWrap: { width: 402, useAdvancedWrap: true }
    });
    this.remainingShipText = this.add.text(724, 254, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#d9fbff',
      fixedWidth: 402,
      wordWrap: { width: 402, useAdvancedWrap: true }
    });
    this.currentShipPreview = this.add.graphics();
    this.updateShipList();
  }

  addControls() {
    drawNavalPanel(this, 690, 420, 482, 208, { title: t('commands'), titleSize: 22 });
    this.directionButton = new Button(this, 802, 486, 184, 38, t('rotate_horizontal'), () => {
      this.direction = this.direction === 'horizontal' ? 'vertical' : 'horizontal';
      this.directionButton.setLabel(this.direction === 'horizontal' ? t('rotate_horizontal') : t('rotate_vertical'));
      this.updateBoard();
    }, {
      fontSize: 12,
      variant: 'secondary',
      small: true
    });

    this.autoButton = new Button(this, 1036, 486, 184, 38, t('auto_place'), () => this.autoPlace(), {
      fontSize: 12,
      variant: 'primary',
      small: true
    });

    this.readyButton = new Button(this, 919, 540, 256, 42, t('ready_to_battle'), () => this.startBattle(), {
      fontSize: 15,
      variant: 'ready'
    });

    new Button(this, 919, 594, 176, 34, t('back'), () => {
      this.scene.start(this.returnScene ?? 'MenuScene');
    }, {
      fontSize: 13,
      variant: 'danger',
      small: true
    });
  }

  addSettingsButton() {
    new Button(this, 1148, 67, 132, 42, t('settings'), () => this.openSettings(), {
      variant: 'secondary',
      fontSize: 14,
      small: true
    });
  }

  get selectedTemplate() {
    return this.shipTemplates[this.selectedTemplateIndex] ?? null;
  }

  createShipItem(template, index, x, y) {
    const container = this.add.container(x, y);
    const graphics = this.add.graphics();
    const width = 128;
    const height = 36;
    container.add(graphics);
    container.setSize(width, height);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    this.input.setDraggable(container);

    container.on('pointerup', () => {
      if (this.placedTemplateIds.has(template.id)) {
        return;
      }
      this.selectedTemplateIndex = index;
      this.updateShipList();
      this.updateBoard();
    });
    container.on('dragstart', (pointer) => this.startShipDrag(template, index, pointer));
    container.on('drag', (pointer) => this.updateShipDrag(pointer));
    container.on('dragend', (pointer) => this.endShipDrag(template, pointer));

    const item = { template, index, container, graphics, x, y, width, height };
    this.drawShipItem(item);
    return item;
  }

  drawMiniShip(graphics, length, x, y, options = {}) {
    const segment = options.segment ?? 19;
    const gap = options.gap ?? 2;
    const height = options.height ?? 20;
    const totalWidth = length * segment + (length - 1) * gap;
    const left = x - totalWidth / 2;
    const fill = options.fill ?? 0x9a642f;
    const stroke = options.stroke ?? 0xf0c35a;

    graphics.fillStyle(0x010711, 0.32);
    graphics.fillRoundedRect(left + 3, y - height / 2 + 4, totalWidth, height, 8);
    for (let i = 0; i < length; i += 1) {
      const sx = left + i * (segment + gap);
      graphics.fillStyle(fill, options.alpha ?? 0.96);
      graphics.fillRoundedRect(sx, y - height / 2, segment, height, 7);
      graphics.lineStyle(2, stroke, options.alpha ?? 0.9);
      graphics.strokeRoundedRect(sx, y - height / 2, segment, height, 7);
      graphics.fillStyle(0xffe0a6, options.alpha ?? 0.75);
      graphics.fillCircle(sx + segment / 2, y, Math.max(2, segment * 0.12));
    }
  }

  drawShipItem(item) {
    const { template, index, graphics, width, height } = item;
    const placed = this.placedTemplateIds.has(template.id);
    const selected = !placed && index === this.selectedTemplateIndex;
    graphics.clear();
    graphics.fillStyle(0x061827, placed ? 0.3 : 0.86);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    graphics.lineStyle(selected ? 2 : 1, selected ? 0xf8d77a : 0x6db7d4, selected ? 0.9 : placed ? 0.35 : 0.72);
    graphics.strokeRoundedRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 10);
    this.drawMiniShip(graphics, template.length, 0, 0, {
      alpha: placed ? 0.36 : 0.96,
      segment: 15,
      gap: 2,
      height: 14,
      fill: placed ? 0x46525b : 0x9a642f,
      stroke: placed ? 0x77828f : 0xf0c35a
    });
    item.container.setAlpha(placed ? 0.5 : 1);
    item.container.disableInteractive();
    if (!placed) {
      item.container.setInteractive(
        new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );
      this.input.setDraggable(item.container);
    }
  }

  startShipDrag(template, index, pointer) {
    if (this.placedTemplateIds.has(template.id)) {
      return;
    }
    this.selectedTemplateIndex = index;
    this.draggingTemplate = template;
    this.updateShipList();
    this.ghostShip = this.add.graphics().setDepth(200);
    this.updateShipGhost(pointer.x, pointer.y, true);
  }

  startPlacedShipDrag(x, y, pointer) {
    const shipId = this.board[y][x].shipId;
    if (shipId === null) {
      return;
    }
    this.ensureShipTemplateIds();
    const ship = this.ships.find((item) => item.id === shipId);
    if (!ship) {
      return;
    }
    const template = this.shipTemplates.find((item) => item.id === ship.templateId);
    if (!template) {
      return;
    }
    this.removeShipFromBoard(ship);
    this.ships = this.ships.filter((item) => item.id !== ship.id);
    this.placedTemplateIds.delete(template.id);
    this.selectedTemplateIndex = this.shipTemplates.findIndex((item) => item.id === template.id);
    this.draggingTemplate = template;
    this.dragRestore = { ship, template };
    this.ghostShip = this.add.graphics().setDepth(200);
    this.updateShipGhost(pointer.x, pointer.y, true);
    this.updateBoard();
    this.updateShipList();
    this.updateReadyState();
  }

  updateShipDrag(pointer) {
    if (!this.draggingTemplate) {
      return;
    }
    const cell = this.getCellFromPointer(pointer);
    this.previewCells = cell ? this.getPlacementCells(cell.x, cell.y, this.draggingTemplate) : [];
    this.dragPreviewValid = Boolean(
      cell && canPlaceShip(this.board, cell.x, cell.y, this.draggingTemplate.length, this.direction, true)
    );
    this.updateShipGhost(pointer.x, pointer.y, this.dragPreviewValid);
    this.updateBoard();
  }

  endShipDrag(template, pointer) {
    const cell = this.getCellFromPointer(pointer);
    const valid = Boolean(cell && canPlaceShip(this.board, cell.x, cell.y, template.length, this.direction, true));
    this.ghostShip?.destroy();
    this.ghostShip = null;
    this.draggingTemplate = null;
    this.previewCells = [];

    if (valid) {
      this.placeTemplate(template, cell.x, cell.y);
    } else {
      Toast.show(this, t('cannot_place'), { y: 112 });
      this.updateBoard();
      this.updateShipList();
    }
  }

  endPlacedShipDrag(pointer) {
    if (!this.dragRestore) {
      return;
    }
    const { template, ship } = this.dragRestore;
    const cell = this.getCellFromPointer(pointer);
    const valid = Boolean(cell && canPlaceShip(this.board, cell.x, cell.y, template.length, this.direction, true));
    this.ghostShip?.destroy();
    this.ghostShip = null;
    this.draggingTemplate = null;
    this.previewCells = [];
    this.dragRestore = null;

    if (valid) {
      this.placeTemplate(template, cell.x, cell.y);
    } else {
      ship.cells = [];
      placeShip(this.board, ship, ship.origin.x, ship.origin.y, ship.direction);
      this.ships.push(ship);
      this.placedTemplateIds.add(template.id);
      Toast.show(this, t('cannot_place'), { y: 112 });
      this.updateBoard();
      this.updateShipList();
      this.updateReadyState();
    }
  }

  updateShipGhost(x, y, valid) {
    if (!this.ghostShip || !this.draggingTemplate) {
      return;
    }
    this.ghostShip.clear();
    this.ghostShip.setPosition(x, y);
    this.drawMiniShip(this.ghostShip, this.draggingTemplate.length, 0, 0, {
      alpha: 0.78,
      segment: 20,
      height: 17,
      fill: valid ? 0xb98622 : 0xb93632,
      stroke: valid ? 0xffe0a6 : 0xffb0a8
    });
  }

  getCellFromPointer(pointer) {
    const { x, y, cell } = this.boardLayout;
    const boardX = Math.floor((pointer.x - x) / cell);
    const boardY = Math.floor((pointer.y - y) / cell);
    if (boardX < 0 || boardY < 0 || boardX >= BOARD_SIZE || boardY >= BOARD_SIZE) {
      return null;
    }
    return { x: boardX, y: boardY };
  }

  getPlacementCells(x, y, template = this.selectedTemplate) {
    if (!template || (!this.dragRestore && this.placedTemplateIds.has(template.id))) {
      return [];
    }
    return Array.from({ length: template.length }, (_, index) => ({
      x: this.direction === 'horizontal' ? x + index : x,
      y: this.direction === 'vertical' ? y + index : y
    }));
  }

  tryPlaceSelectedShip(x, y) {
    if (this.board[y][x].shipId !== null) {
      this.removePlacedShip(this.board[y][x].shipId);
      return;
    }

    const template = this.selectedTemplate;
    if (!template || this.placedTemplateIds.has(template.id)) {
      return;
    }

    if (!canPlaceShip(this.board, x, y, template.length, this.direction, true)) {
      this.flashError(this.getPlacementCells(x, y, template));
      Toast.show(this, t('cannot_place'), { y: 112 });
      return;
    }

    this.placeTemplate(template, x, y);
  }

  placeTemplate(template, x, y) {
    if (!template || this.placedTemplateIds.has(template.id)) {
      return;
    }
    const ship = createShip(template.length, this.nextShipId);
    ship.templateId = template.id;
    ship.direction = this.direction;
    ship.origin = { x, y };
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
    this.assignTemplatesToShips();
    this.placedTemplateIds = new Set(this.shipTemplates.map((template) => template.id));
    this.selectedTemplateIndex = 0;
    Toast.show(this, t('fleet_ready'), { y: 112 });
    this.updateBoard();
    this.updateShipList();
    this.updateReadyState();
  }

  autoPlaceRemaining() {
    const remaining = this.shipTemplates.filter((template) => !this.placedTemplateIds.has(template.id));
    remaining.forEach((template) => {
      for (let attempt = 0; attempt < 240; attempt += 1) {
        const direction = Phaser.Math.Between(0, 1) === 0 ? 'horizontal' : 'vertical';
        const x = Phaser.Math.Between(0, BOARD_SIZE - 1);
        const y = Phaser.Math.Between(0, BOARD_SIZE - 1);
        if (!canPlaceShip(this.board, x, y, template.length, direction, true)) {
          continue;
        }
        const ship = createShip(template.length, this.nextShipId);
        ship.templateId = template.id;
        ship.direction = direction;
        ship.origin = { x, y };
        this.nextShipId += 1;
        placeShip(this.board, ship, x, y, direction);
        this.ships.push(ship);
        this.placedTemplateIds.add(template.id);
        break;
      }
    });
    this.selectNextAvailableShip();
    this.updateBoard();
    this.updateShipList();
    this.updateReadyState();
  }

  updateBoard() {
    const previewKeys = new Set(this.previewCells.map((cell) => `${cell.x}:${cell.y}`));
    const errorKeys = new Set((this.errorCells ?? []).map((cell) => `${cell.x}:${cell.y}`));
    const previewOrigin = this.previewCells[0];
    const previewValid = Boolean(
      this.draggingTemplate &&
      previewOrigin &&
      canPlaceShip(this.board, previewOrigin.x, previewOrigin.y, this.draggingTemplate.length, this.direction, true)
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
          fill = 0x113a58;
          stroke = 0xf0c35a;
          alpha = 0.96;
        }
        if (previewKeys.has(key)) {
          fill = previewValid ? 0x9b6b2a : 0xb93632;
          stroke = previewValid ? 0xffe0a6 : 0xffb0a8;
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
        if (cell.shipId !== null) {
          const segment = Math.min(this.boardLayout.cell * 0.72, this.boardLayout.cell - 16);
          const cx = px + this.boardLayout.cell / 2;
          const cy = py + this.boardLayout.cell / 2;
          view.graphics.fillStyle(0x9a642f, 0.96);
          view.graphics.fillRoundedRect(cx - segment / 2, cy - segment / 2, segment, segment, 8);
          view.graphics.lineStyle(2, 0xf0c35a, 0.95);
          view.graphics.strokeRoundedRect(cx - segment / 2, cy - segment / 2, segment, segment, 8);
          view.graphics.fillStyle(0xffe0a6, 0.85);
          view.graphics.fillCircle(cx, cy, Math.max(3, segment * 0.13));
        }
      }
    }
  }

  updateShipList() {
    const current = this.selectedTemplate;
    const remaining = this.shipTemplates.length - this.placedTemplateIds.size;
    if (current && remaining > 0) {
      this.currentShipText.setText(`Сейчас ставим: ${current.length}-палубный корабль`);
      this.remainingShipText.setText(`Осталось поставить: ${remaining}\nКликните по клетке поля. Уже поставленный корабль можно снять кликом или перетащить.`);
    } else {
      this.currentShipText.setText('Флот готов');
      this.remainingShipText.setText('Можно переставить корабли или нажать “Готов к бою”.');
    }
    this.currentShipPreview.clear();
    if (current && remaining > 0) {
      this.drawMiniShip(this.currentShipPreview, current.length, 930, 328, {
        segment: 30,
        gap: 4,
        height: 26,
        fill: 0x9a642f,
        stroke: 0xf0c35a
      });
    }
  }

  removeShipFromBoard(ship) {
    ship.cells.forEach((cell) => {
      this.board[cell.y][cell.x].shipId = null;
    });
  }

  removePlacedShip(shipId) {
    this.ensureShipTemplateIds();
    const ship = this.ships.find((item) => item.id === shipId);
    if (!ship) {
      return;
    }
    this.removeShipFromBoard(ship);
    this.ships = this.ships.filter((item) => item.id !== shipId);
    if (ship.templateId) {
      this.placedTemplateIds.delete(ship.templateId);
      this.selectedTemplateIndex = this.shipTemplates.findIndex((template) => template.id === ship.templateId);
      if (this.selectedTemplateIndex < 0) {
        this.selectNextAvailableShip();
      }
    } else {
      this.selectNextAvailableShip();
    }
    this.updateBoard();
    this.updateShipList();
    this.updateReadyState();
  }

  assignTemplatesToShips() {
    const used = new Set();
    this.ships.forEach((ship) => {
      const template = this.shipTemplates.find((item) => item.length === ship.length && !used.has(item.id));
      if (template) {
        used.add(template.id);
        ship.templateId = template.id;
      }
      const first = ship.cells[0] ?? { x: 0, y: 0 };
      const second = ship.cells[1] ?? first;
      ship.direction = first.y === second.y ? 'horizontal' : 'vertical';
      ship.origin = { ...first };
    });
  }

  ensureShipTemplateIds() {
    if (this.ships.some((ship) => !ship.templateId)) {
      this.assignTemplatesToShips();
    }
  }

  updateReadyState() {
    const ready = this.ships.length === this.shipTemplates.length;
    this.readyButton.setEnabled(ready);
    this.readyButton.setPulse(ready);
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
    this.timerText.setText(`${t('preparation_timer')}: 00:${String(Math.max(0, this.timeLeft)).padStart(2, '0')}`);
    this.timerText.setColor(this.timeLeft <= 5 ? '#ff9d66' : '#d9fbff');
  }

  autoPlaceMissingAndStart() {
    if (this.ships.length < this.shipTemplates.length) {
      this.autoPlaceRemaining();
      if (this.ships.length < this.shipTemplates.length) {
        this.autoPlace();
      }
    }
    this.startBattle();
  }

  startBattle() {
    if (this.ships.length < this.shipTemplates.length) {
      return;
    }
    this.timerEvent?.remove(false);
    const playerSetup = cloneBoardSetup(this.board, this.ships);
    this.scene.start('GameScene', {
      levelId: this.levelId,
      playerSetup,
      battleMode: this.battleMode
    });
  }

  openSettings() {
    if (this.settingsModal) {
      return;
    }
    this.settingsModal = new SettingsModal(this, {
      onLanguageChanged: () => this.scene.restart({
        levelId: this.levelId,
        battleMode: this.battleMode,
        returnScene: this.returnScene
      }),
      onMusicChanged: (enabled) => {
        if (enabled) {
          SoundService.playMusic(this, SoundService.keys.music_battle);
        }
      },
      onClose: () => {
        this.settingsModal = null;
      }
    });
  }
}
