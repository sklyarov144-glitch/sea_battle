import { BOARD_SIZE } from '../config/balanceConfig.js';

export const SHIP_BLUEPRINTS = [
  { length: 4, count: 1 },
  { length: 3, count: 1 },
  { length: 2, count: 1 },
  { length: 1, count: 2 }
];

export const EVENT_TYPES = {
  Chest: 'chest',
  Barrel: 'barrel',
  Wreck: 'wreck',
  Vortex: 'vortex',
  Mine: 'mine'
};

export function createEmptyBoard(size = BOARD_SIZE) {
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({
      x,
      y,
      shipId: null,
      shot: false,
      event: null,
      hint: false,
      sunk: false
    }))
  );
}

export function inBounds(x, y, size = BOARD_SIZE) {
  return x >= 0 && y >= 0 && x < size && y < size;
}

export function getNeighbors4(x, y, size = BOARD_SIZE) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ].filter((cell) => inBounds(cell.x, cell.y, size));
}

export function getNeighbors8(x, y, size = BOARD_SIZE) {
  const cells = [];

  for (let yy = y - 1; yy <= y + 1; yy += 1) {
    for (let xx = x - 1; xx <= x + 1; xx += 1) {
      if ((xx !== x || yy !== y) && inBounds(xx, yy, size)) {
        cells.push({ x: xx, y: yy });
      }
    }
  }

  return cells;
}

function shuffled(items, rng) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function canPlaceShip(board, x, y, length, direction, gap) {
  const size = board.length;
  const cells = Array.from({ length }, (_, index) => ({
    x: direction === 'horizontal' ? x + index : x,
    y: direction === 'vertical' ? y + index : y
  }));

  if (cells.some((cell) => !inBounds(cell.x, cell.y, size))) {
    return false;
  }

  if (cells.some((cell) => board[cell.y][cell.x].shipId !== null)) {
    return false;
  }

  if (!gap) {
    return true;
  }

  return cells.every((cell) =>
    getNeighbors8(cell.x, cell.y, size).every((neighbor) => board[neighbor.y][neighbor.x].shipId === null)
  );
}

function placeShip(board, ship, x, y, direction) {
  for (let index = 0; index < ship.length; index += 1) {
    const cell = {
      x: direction === 'horizontal' ? x + index : x,
      y: direction === 'vertical' ? y + index : y
    };

    board[cell.y][cell.x].shipId = ship.id;
    ship.cells.push(cell);
  }
}

function buildShipList() {
  const ships = [];
  let id = 1;

  SHIP_BLUEPRINTS.forEach((blueprint) => {
    for (let index = 0; index < blueprint.count; index += 1) {
      ships.push({
        id,
        length: blueprint.length,
        cells: [],
        hits: 0,
        sunk: false
      });
      id += 1;
    }
  });

  return ships;
}

function tryGenerateFleet(size, rng, gap) {
  const board = createEmptyBoard(size);
  const ships = buildShipList();

  for (const ship of ships) {
    let placed = false;

    for (let attempt = 0; attempt < 400 && !placed; attempt += 1) {
      const direction = rng() > 0.5 ? 'horizontal' : 'vertical';
      const x = Math.floor(rng() * size);
      const y = Math.floor(rng() * size);

      if (canPlaceShip(board, x, y, ship.length, direction, gap)) {
        placeShip(board, ship, x, y, direction);
        placed = true;
      }
    }

    if (!placed) {
      return null;
    }
  }

  return { board, ships };
}

export function generateFleet(size = BOARD_SIZE, rng = Math.random) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const setup = tryGenerateFleet(size, rng, true);
    if (setup) {
      return setup;
    }
  }

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const setup = tryGenerateFleet(size, rng, false);
    if (setup) {
      return setup;
    }
  }

  throw new Error('Не удалось расставить флот');
}

export function placeEvents(board, eventCounts, rng = Math.random) {
  const emptyCells = [];

  board.forEach((row) => {
    row.forEach((cell) => {
      if (cell.shipId === null) {
        emptyCells.push(cell);
      }
    });
  });

  const queue = [];
  Object.entries(eventCounts ?? {}).forEach(([eventType, count]) => {
    for (let index = 0; index < count; index += 1) {
      queue.push(eventType);
    }
  });

  shuffled(queue, rng).forEach((eventType) => {
    const available = emptyCells.filter((cell) => cell.event === null);
    if (available.length === 0) {
      return;
    }

    const cell = available[Math.floor(rng() * available.length)];
    cell.event = eventType;
  });

  return board;
}

export function createBattleSetup(levelConfig, rng = Math.random) {
  const player = generateFleet(BOARD_SIZE, rng);
  const enemy = generateFleet(BOARD_SIZE, rng);
  placeEvents(enemy.board, levelConfig.events, rng);
  return { player, enemy };
}

export function getShipById(ships, shipId) {
  return ships.find((ship) => ship.id === shipId) ?? null;
}

export function fireAt(board, ships, x, y) {
  if (!inBounds(x, y, board.length)) {
    return { valid: false, reason: 'outOfBounds', x, y };
  }

  const cell = board[y][x];
  if (cell.shot) {
    return { valid: false, reason: 'alreadyShot', x, y };
  }

  cell.shot = true;

  const result = {
    valid: true,
    x,
    y,
    hit: false,
    miss: false,
    sunk: false,
    ship: null,
    event: cell.event,
    cell
  };

  if (cell.shipId !== null) {
    const ship = getShipById(ships, cell.shipId);
    result.hit = true;
    result.ship = ship;

    if (ship) {
      ship.hits += 1;
      if (ship.hits >= ship.length) {
        ship.sunk = true;
        result.sunk = true;
        ship.cells.forEach((shipCell) => {
          board[shipCell.y][shipCell.x].sunk = true;
        });
      }
    }
  } else {
    result.miss = true;
  }

  return result;
}

export function allShipsSunk(ships) {
  return ships.every((ship) => ship.sunk);
}

export function countAliveShips(ships) {
  return ships.filter((ship) => !ship.sunk).length;
}

export function getCellsInCross(x, y, size = BOARD_SIZE, includeCenter = true) {
  const cells = includeCenter ? [{ x, y }] : [];
  return cells.concat(getNeighbors4(x, y, size));
}

export function getCellsInArea(x, y, radius = 1, size = BOARD_SIZE) {
  const cells = [];

  for (let yy = y - radius; yy <= y + radius; yy += 1) {
    for (let xx = x - radius; xx <= x + radius; xx += 1) {
      if (inBounds(xx, yy, size)) {
        cells.push({ x: xx, y: yy });
      }
    }
  }

  return cells;
}

export function getLineCells(x, y, axis, size = BOARD_SIZE) {
  if (axis === 'column') {
    return Array.from({ length: size }, (_, yy) => ({ x, y: yy }));
  }

  return Array.from({ length: size }, (_, xx) => ({ x: xx, y }));
}

export function findShipPresenceInArea(board, x, y, radius = 1) {
  return getCellsInArea(x, y, radius, board.length).some((cell) => board[cell.y][cell.x].shipId !== null);
}

export function findHintCellNearShip(board, ships, rng = Math.random) {
  const candidates = [];

  ships
    .filter((ship) => !ship.sunk)
    .forEach((ship) => {
      ship.cells.forEach((shipCell) => {
        getNeighbors8(shipCell.x, shipCell.y, board.length).forEach((neighbor) => {
          const cell = board[neighbor.y][neighbor.x];
          if (!cell.shot && cell.shipId === null && !cell.hint) {
            candidates.push(cell);
          }
        });
      });
    });

  if (candidates.length === 0) {
    return null;
  }

  const cell = candidates[Math.floor(rng() * candidates.length)];
  cell.hint = true;
  return { x: cell.x, y: cell.y };
}

export function getUnshotCells(board) {
  const cells = [];
  board.forEach((row) => {
    row.forEach((cell) => {
      if (!cell.shot) {
        cells.push({ x: cell.x, y: cell.y });
      }
    });
  });
  return cells;
}

export function getRandomUnshotCell(board, rng = Math.random, preferParity = false) {
  const unshotCells = getUnshotCells(board);
  if (unshotCells.length === 0) {
    return null;
  }

  const parityCells = preferParity ? unshotCells.filter((cell) => (cell.x + cell.y) % 2 === 0) : [];
  const pool = parityCells.length > 0 ? parityCells : unshotCells;
  return pool[Math.floor(rng() * pool.length)];
}

function getActiveHitCells(board, ships) {
  const activeHits = [];

  board.forEach((row) => {
    row.forEach((cell) => {
      if (!cell.shot || cell.shipId === null) {
        return;
      }

      const ship = getShipById(ships, cell.shipId);
      if (ship && !ship.sunk) {
        activeHits.push({ x: cell.x, y: cell.y, shipId: cell.shipId });
      }
    });
  });

  return activeHits;
}

function buildTargetCandidates(board, hits) {
  if (hits.length === 0) {
    return [];
  }

  const size = board.length;
  const candidates = [];
  const sameRow = hits.length >= 2 && hits.every((cell) => cell.y === hits[0].y);
  const sameColumn = hits.length >= 2 && hits.every((cell) => cell.x === hits[0].x);

  if (sameRow) {
    const sorted = [...hits].sort((a, b) => a.x - b.x);
    candidates.push({ x: sorted[0].x - 1, y: sorted[0].y });
    candidates.push({ x: sorted[sorted.length - 1].x + 1, y: sorted[0].y });
  } else if (sameColumn) {
    const sorted = [...hits].sort((a, b) => a.y - b.y);
    candidates.push({ x: sorted[0].x, y: sorted[0].y - 1 });
    candidates.push({ x: sorted[0].x, y: sorted[sorted.length - 1].y + 1 });
  } else {
    hits.forEach((cell) => candidates.push(...getNeighbors4(cell.x, cell.y, size)));
  }

  return candidates.filter((cell) => inBounds(cell.x, cell.y, size) && !board[cell.y][cell.x].shot);
}

export function chooseBotShot(board, ships, botSkill = 0.5, rng = Math.random) {
  const activeHits = getActiveHitCells(board, ships);

  if (activeHits.length > 0 && rng() < botSkill) {
    const groupedByShip = activeHits.reduce((groups, hit) => {
      groups[hit.shipId] = groups[hit.shipId] ?? [];
      groups[hit.shipId].push(hit);
      return groups;
    }, {});

    const groups = Object.values(groupedByShip).sort((a, b) => b.length - a.length);

    for (const hits of groups) {
      const candidates = buildTargetCandidates(board, hits);
      if (candidates.length > 0) {
        return candidates[Math.floor(rng() * candidates.length)];
      }
    }
  }

  return getRandomUnshotCell(board, rng, botSkill > 0.6);
}
