import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys.js';
import { BASE_ABILITY_CHARGES, LEVELS } from '../config/balanceConfig.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { StorageService } from '../services/StorageService.js';
import { Button } from '../ui/Button.js';
import { Toast } from '../ui/Toast.js';
import {
  allShipsSunk,
  chooseBotShot,
  createBattleSetup,
  EVENT_TYPES,
  findHintCellNearShip,
  findShipPresenceInArea,
  fireAt,
  getCellsInArea,
  getCellsInCross,
  getLineCells
} from '../utils/boardUtils.js';
import {
  cameraShake,
  createCannonArc,
  createSeaBackground,
  drawWoodPanel,
  flyCoins,
  pulseTarget,
  spawnExplosion,
  spawnSmoke,
  spawnSplash
} from '../utils/effects.js';

const EVENT_LABELS = {
  [EVENT_TYPES.Chest]: { icon: '▣', color: '#ffd36e' },
  [EVENT_TYPES.Barrel]: { icon: '✹', color: '#ff9d66' },
  [EVENT_TYPES.Wreck]: { icon: '◇', color: '#d9fbff' },
  [EVENT_TYPES.Vortex]: { icon: '◎', color: '#8fefff' },
  [EVENT_TYPES.Mine]: { icon: '●', color: '#ff786e' }
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.levelId = data.levelId ?? 1;
  }

  create() {
    document.body.dataset.scene = 'GameScene';
    document.body.dataset.level = String(this.levelId);
    this.level = LEVELS[this.levelId - 1] ?? LEVELS[0];
    this.profile = StorageService.loadProfile();
    this.boosts = StorageService.consumeBattleBoosts() ?? { radar: 0, barrage: 0, torpedo: 0 };
    this.profile = StorageService.loadProfile();
    this.battle = createBattleSetup(this.level);

    this.playerBoard = this.battle.player.board;
    this.playerShips = this.battle.player.ships;
    this.enemyBoard = this.battle.enemy.board;
    this.enemyShips = this.battle.enemy.ships;

    this.playerTurn = true;
    this.busy = false;
    this.battleEnded = false;
    this.selectedAbility = null;
    this.torpedoAxis = 'row';
    this.battleGold = 0;
    this.logs = [];
    this.hoveredEnemyCell = null;
    this.radarHighlights = new Map();

    this.abilityCharges = {
      radar: BASE_ABILITY_CHARGES.radar + (this.boosts.radar ?? 0),
      barrage: BASE_ABILITY_CHARGES.barrage + (this.boosts.barrage ?? 0),
      torpedo: BASE_ABILITY_CHARGES.torpedo + (this.boosts.torpedo ?? 0)
    };

    createSeaBackground(this, { waterSkin: this.profile.selectedSkins.water });
    this.createLayout();
    this.createStatusPanel();
    this.createBoards();
    this.createCenterPanel();
    this.createAbilityPanel();
    this.updateAllBoards();
    this.addLog('Ваш ход. Цельтесь по вражескому полю.');
  }

  createLayout() {
    this.layout = {
      player: { x: 70, y: 205, cell: 42 },
      enemy: { x: 720, y: 150, cell: 58 },
      playerCannon: { x: 406, y: 570 },
      enemyCannon: { x: 1115, y: 126 },
      goldCounter: { x: 180, y: 68 }
    };
  }

  createStatusPanel() {
    drawWoodPanel(this, 42, 22, 1196, 86);

    this.add.text(72, 48, `Остров ${this.level.id}: ${this.level.name}`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '27px',
      color: '#fff0bf'
    });

    this.goldText = this.add.text(72, 80, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#fff5d6'
    });

    this.turnText = this.add.text(GAME_WIDTH / 2, 66, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#d9fbff',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(940, 54, `Капитан ур. ${this.profile.captainLevel}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#fff5d6'
    });

    this.updateStatus();
  }

  createBoards() {
    this.add.text(238, 166, 'Ваш флот', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '28px',
      color: '#fff0bf',
      stroke: '#2b170b',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(952, 116, 'Вражеские воды', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '30px',
      color: '#fff0bf',
      stroke: '#2b170b',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.playerCells = this.createBoardCells('player', this.layout.player);
    this.enemyCells = this.createBoardCells('enemy', this.layout.enemy);
  }

  createBoardCells(kind, layout) {
    const cells = [];

    for (let y = 0; y < 8; y += 1) {
      cells[y] = [];
      for (let x = 0; x < 8; x += 1) {
        const px = layout.x + x * layout.cell;
        const py = layout.y + y * layout.cell;
        const graphics = this.add.graphics();
        const icon = this.add.text(px + layout.cell / 2, py + layout.cell / 2, '', {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(layout.cell * 0.46)}px`,
          color: '#ffffff',
          align: 'center'
        }).setOrigin(0.5);

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
    drawWoodPanel(this, 432, 138, 244, 360, { fill: 0x563218 });

    this.add.text(554, 160, 'Бортовой журнал', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px',
      color: '#fff0bf'
    }).setOrigin(0.5);

    this.logText = this.add.text(454, 198, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      color: '#fff5d6',
      fixedWidth: 200,
      lineSpacing: 7,
      wordWrap: { width: 200, useAdvancedWrap: true }
    });

    this.add.image(556, 446, AssetKeys.Textures.Compass).setScale(1.15).setAlpha(0.88);
  }

  createAbilityPanel() {
    drawWoodPanel(this, 70, 570, 1114, 106, { fill: 0x563218 });

    this.abilityButtons = {
      radar: new Button(this, 170, 623, 180, 52, '', () => this.selectAbility('radar'), {
        icon: '◉',
        fontSize: 22
      }),
      barrage: new Button(this, 380, 623, 180, 52, '', () => this.selectAbility('barrage'), {
        icon: '✚',
        fontSize: 22
      }),
      torpedo: new Button(this, 590, 623, 190, 52, '', () => this.selectAbility('torpedo'), {
        icon: '➜',
        fontSize: 22
      }),
      cancel: new Button(this, 804, 623, 170, 52, 'Отмена', () => this.cancelAbility(), {
        icon: '×',
        fontSize: 22,
        fill: 0x6d3440,
        hoverFill: 0x843e4c
      }),
      row: new Button(this, 1010, 606, 150, 38, 'Строка', () => this.setTorpedoAxis('row'), {
        fontSize: 18,
        fill: 0x0f6477,
        hoverFill: 0x147f93
      }),
      column: new Button(this, 1010, 646, 150, 38, 'Колонка', () => this.setTorpedoAxis('column'), {
        fontSize: 18,
        fill: 0x0f6477,
        hoverFill: 0x147f93
      })
    };

    this.updateAbilityButtons();
  }

  updateStatus() {
    this.goldText.setText(`Золото: ${this.profile.gold}  |  добыча боя: ${this.battleGold}`);
    this.turnText.setText(this.playerTurn ? 'Ваш ход' : 'Ход капитана-бота');
    document.body.dataset.turn = this.playerTurn ? 'player' : 'bot';
    document.body.dataset.battleGold = String(this.battleGold);
  }

  updateAbilityButtons() {
    const canAct = this.playerTurn && !this.busy && !this.battleEnded;
    document.body.dataset.busy = String(this.busy);
    document.body.dataset.selectedAbility = this.selectedAbility ?? '';
    document.body.dataset.torpedoAxis = this.torpedoAxis;
    document.body.dataset.abilityCharges = JSON.stringify(this.abilityCharges);
    this.abilityButtons.radar
      .setLabel(`Радар ${this.abilityCharges.radar}`)
      .setEnabled(canAct && this.abilityCharges.radar > 0)
      .setSelected(this.selectedAbility === 'radar');
    this.abilityButtons.barrage
      .setLabel(`Залп ${this.abilityCharges.barrage}`)
      .setEnabled(canAct && this.abilityCharges.barrage > 0)
      .setSelected(this.selectedAbility === 'barrage');
    this.abilityButtons.torpedo
      .setLabel(`Торпеда ${this.abilityCharges.torpedo}`)
      .setEnabled(canAct && this.abilityCharges.torpedo > 0)
      .setSelected(this.selectedAbility === 'torpedo');
    this.abilityButtons.cancel.setEnabled(canAct && Boolean(this.selectedAbility));
    this.abilityButtons.row
      .setEnabled(canAct && this.selectedAbility === 'torpedo')
      .setSelected(this.selectedAbility === 'torpedo' && this.torpedoAxis === 'row');
    this.abilityButtons.column
      .setEnabled(canAct && this.selectedAbility === 'torpedo')
      .setSelected(this.selectedAbility === 'torpedo' && this.torpedoAxis === 'column');
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
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        this.drawCell(cellViews[y][x], board[y][x], layout, revealShips);
      }
    }
  }

  drawCell(view, cell, layout, revealShips) {
    const px = layout.x + cell.x * layout.cell;
    const py = layout.y + cell.y * layout.cell;
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
      icon = '■';
      iconColor = '#f7d783';
    }

    if (!revealShips && cell.hint && !cell.shot) {
      fill = 0x244a59;
      stroke = 0xf0c35a;
      icon = '◇';
      iconColor = '#fff0bf';
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

        if (cell.event) {
          const eventData = EVENT_LABELS[cell.event];
          icon = eventData.icon;
          iconColor = eventData.color;
          if (cell.event === EVENT_TYPES.Mine) {
            fill = 0x442432;
          }
          if (cell.event === EVENT_TYPES.Vortex) {
            fill = 0x123c5d;
          }
          if (cell.event === EVENT_TYPES.Chest) {
            fill = 0x5b4215;
          }
        }
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
      radar: 'Радар: выберите центр области 3x3.',
      barrage: 'Залп: выберите центр креста.',
      torpedo: 'Торпеда: выберите строку или колонку и клетку.'
    };
    this.addLog(labels[ability]);
    this.updateAbilityButtons();
  }

  cancelAbility() {
    this.selectedAbility = null;
    this.addLog('Способность отменена.');
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
    let forceEndTurn = false;

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
      const outcome = await this.resolvePlayerShot(result);
      anyHit = anyHit || result.hit || outcome.extraHit;
      forceEndTurn = forceEndTurn || outcome.forceEndTurn;
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

    if (forceEndTurn || !anyHit) {
      this.addLog(forceEndTurn ? 'Ход уносит водоворот.' : 'Промах. Бот готовит ответ.');
      this.startBotTurn();
      return;
    }

    this.busy = false;
    this.playerTurn = true;
    this.addLog('Попадание дает еще один ход.');
    this.updateAllBoards();
  }

  async resolvePlayerShot(result) {
    const center = this.getEnemyCellCenter(result.x, result.y);
    let extraHit = false;
    let forceEndTurn = false;

    if (result.hit) {
      spawnExplosion(this, center.x, center.y);
      this.addLog(result.sunk ? 'Корабль врага потоплен!' : 'Попадание!');
      if (result.sunk) {
        cameraShake(this, 0.007, 250);
        spawnSmoke(this, center.x, center.y - 8);
      }
      return { extraHit, forceEndTurn };
    }

    spawnSplash(this, center.x, center.y);
    if (!result.event) {
      this.addLog('Промах!');
      return { extraHit, forceEndTurn };
    }

    const eventOutcome = await this.resolveEnemyEvent(result);
    extraHit = extraHit || eventOutcome.extraHit;
    forceEndTurn = forceEndTurn || eventOutcome.forceEndTurn;
    return { extraHit, forceEndTurn };
  }

  async resolveEnemyEvent(result, visited = new Set()) {
    const key = `${result.x}:${result.y}`;
    if (visited.has(key)) {
      return { extraHit: false, forceEndTurn: false };
    }
    visited.add(key);

    const center = this.getEnemyCellCenter(result.x, result.y);

    if (result.event === EVENT_TYPES.Chest) {
      this.battleGold += this.level.eventGold;
      this.addLog(`Найден сундук! +${this.level.eventGold} золота.`);
      flyCoins(this, center, this.layout.goldCounter, 9);
      return { extraHit: false, forceEndTurn: false };
    }

    if (result.event === EVENT_TYPES.Wreck) {
      const hintCell = findHintCellNearShip(this.enemyBoard, this.enemyShips);
      this.addLog(hintCell ? 'Обломки дали подсказку рядом с кораблем.' : 'Обломки молчат.');
      if (hintCell) {
        const hintCenter = this.getEnemyCellCenter(hintCell.x, hintCell.y);
        pulseTarget(this, hintCenter.x, hintCenter.y, 34, 0xd9fbff);
      }
      return { extraHit: false, forceEndTurn: false };
    }

    if (result.event === EVENT_TYPES.Vortex) {
      this.addLog('Водоворот! Вы теряете ход.');
      pulseTarget(this, center.x, center.y, 38, 0x8fefff);
      return { extraHit: false, forceEndTurn: true };
    }

    if (result.event === EVENT_TYPES.Mine) {
      this.battleGold = Math.max(0, this.battleGold - this.level.minePenalty);
      this.addLog(`Мина! Штраф ${this.level.minePenalty} золота.`);
      spawnExplosion(this, center.x, center.y, { count: 10 });
      cameraShake(this, 0.004, 180);
      return { extraHit: false, forceEndTurn: false };
    }

    if (result.event === EVENT_TYPES.Barrel) {
      this.addLog('Бочка с порохом взрывает крест!');
      spawnExplosion(this, center.x, center.y, { count: 22 });
      cameraShake(this, 0.006, 220);
      let extraHit = false;

      const blastCells = getCellsInCross(result.x, result.y, this.enemyBoard.length, false);
      for (const cell of blastCells) {
        const blastResult = fireAt(this.enemyBoard, this.enemyShips, cell.x, cell.y);
        if (!blastResult.valid) {
          continue;
        }

        await this.wait(95);
        const blastCenter = this.getEnemyCellCenter(cell.x, cell.y);
        if (blastResult.hit) {
          extraHit = true;
          spawnExplosion(this, blastCenter.x, blastCenter.y, { count: 10 });
          this.addLog(blastResult.sunk ? 'Взрыв потопил корабль!' : 'Взрыв задел корабль!');
          if (blastResult.sunk) {
            spawnSmoke(this, blastCenter.x, blastCenter.y);
          }
        } else {
          spawnSplash(this, blastCenter.x, blastCenter.y);
          if (blastResult.event && blastResult.event !== EVENT_TYPES.Barrel) {
            const nestedOutcome = await this.resolveEnemyEvent(blastResult, visited);
            extraHit = extraHit || nestedOutcome.extraHit;
          }
        }
        this.updateEnemyBoard();
      }

      return { extraHit, forceEndTurn: false };
    }

    return { extraHit: false, forceEndTurn: false };
  }

  async startBotTurn() {
    this.playerTurn = false;
    this.busy = true;
    this.updateAllBoards();
    await this.wait(this.level.botDelay);

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

      await this.wait(Math.max(260, this.level.botDelay * 0.65));
    }

    this.playerTurn = true;
    this.busy = false;
    this.addLog('Ваш ход.');
    this.updateAllBoards();
  }

  resolveBotShot(result) {
    const center = this.getPlayerCellCenter(result.x, result.y);

    if (result.hit) {
      spawnExplosion(this, center.x, center.y);
      this.addLog(result.sunk ? 'Бот потопил ваш корабль!' : 'Бот попал!');
      if (result.sunk) {
        cameraShake(this, 0.008, 260);
        spawnSmoke(this, center.x, center.y);
      }
      return;
    }

    spawnSplash(this, center.x, center.y);
    this.addLog('Бот промахнулся.');
  }

  async animatePlayerShot(result) {
    const target = this.getEnemyCellCenter(result.x, result.y);
    await createCannonArc(this, this.layout.playerCannon, target, { duration: 380, arc: 110, scale: 0.82 });
  }

  async animateBotShot(result) {
    const target = this.getPlayerCellCenter(result.x, result.y);
    await createCannonArc(this, this.layout.enemyCannon, target, { duration: 420, arc: 92, scale: 0.72 });
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
    this.logs.unshift(message);
    this.logs = this.logs.slice(0, 6);
    document.body.dataset.lastLog = message;
    if (this.logText) {
      this.logText.setText(this.logs.join('\n'));
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

    const rewards = victory ? this.level.rewards : this.level.consolation;
    this.time.delayedCall(900, () => {
      this.scene.start('ResultScene', {
        victory,
        levelId: this.level.id,
        rewardGold: rewards.gold,
        rewardXp: rewards.xp,
        chestGold: victory ? this.level.rewards.chest : 0,
        battleGold: this.battleGold
      });
    });
  }
}
