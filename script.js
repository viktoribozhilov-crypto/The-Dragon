const boardElement = document.getElementById('board');
const levelLabel = document.getElementById('level-label');
const statusText = document.getElementById('status-text');

const rows = 5;
const cols = 5;

const levels = [
  {
    name: 'Level 1',
    player: { x: 0, y: 4 },
    fish: { x: 4, y: 0 },
    route: [
      { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 },
      { x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 },
      { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 0 }
    ]
  },
  {
    name: 'Level 2',
    player: { x: 0, y: 0 },
    fish: { x: 4, y: 4 },
    route: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 },
      { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
      { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 4 }
    ]
  },
  {
    name: 'Level 3',
    player: { x: 0, y: 2 },
    fish: { x: 4, y: 2 },
    route: [
      { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 1 },
      { x: 2, y: 1 }, { x: 2, y: 0 }, { x: 3, y: 0 },
      { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 4, y: 2 }
    ]
  }
];

let currentLevelIndex = 0;
let player = null;
let fish = null;
let treePositions = new Set();
let routeCells = new Set();
let isAnimating = false;

function getKey(position) {
  return `${position.x},${position.y}`;
}

function isInsideBoard(x, y) {
  return x >= 0 && x < cols && y >= 0 && y < rows;
}

function canMoveTo(x, y, obstacles = treePositions) {
  if (!isInsideBoard(x, y)) {
    return false;
  }

  return !obstacles.has(getKey({ x, y }));
}

function findPath(start, goal, obstacles = treePositions) {
  if (!start || !goal) {
    return [];
  }

  const queue = [start];
  const visited = new Set([getKey(start)]);
  const previous = new Map();

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.x === goal.x && current.y === goal.y) {
      break;
    }

    const nextMoves = [
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y }
    ];

    nextMoves.forEach((next) => {
      const key = getKey(next);
      if (!canMoveTo(next.x, next.y, obstacles) || visited.has(key)) {
        return;
      }

      visited.add(key);
      previous.set(key, current);
      queue.push(next);
    });
  }

  const goalKey = getKey(goal);
  if (!visited.has(goalKey)) {
    return [];
  }

  const path = [];
  let current = goal;

  while (current) {
    path.push({ x: current.x, y: current.y });
    if (current.x === start.x && current.y === start.y) {
      break;
    }

    const prev = previous.get(getKey(current));
    if (!prev) {
      return [];
    }
    current = prev;
  }

  return path.reverse();
}

function loadLevel(levelIndex) {
  const level = levels[levelIndex];
  currentLevelIndex = levelIndex;

  levelLabel.textContent = level.name;
  statusText.textContent = 'Find the fish';

  player = { ...level.player };
  fish = { ...level.fish, eaten: false };
  routeCells = new Set(level.route.map((cell) => getKey(cell)));
  treePositions = new Set();

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const key = `${x},${y}`;
      const isRouteCell = routeCells.has(key);
      const isPlayerCell = x === player.x && y === player.y;
      const isFishCell = x === fish.x && y === fish.y;

      if (!isRouteCell && !isPlayerCell && !isFishCell) {
        treePositions.add(key);
      }
    }
  }

  isAnimating = false;
  boardElement.classList.remove('dragon-eating');
  renderBoard();
}

function renderBoard() {
  boardElement.innerHTML = '';

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);

      const key = `${x},${y}`;
      if (routeCells.has(key)) {
        cell.classList.add('path');
      }

      if (treePositions.has(key)) {
        cell.classList.add('tree');
      }

      if (fish && !fish.eaten && x === fish.x && y === fish.y) {
        cell.classList.add('fish');
      }

      if (fish && fish.eaten && x === fish.x && y === fish.y) {
        cell.classList.add('fish', 'eaten');
      }

      if (x === player.x && y === player.y) {
        cell.classList.add('player');
        if (isAnimating) {
          cell.classList.add('eating');
        }
      }

      boardElement.appendChild(cell);
    }
  }
}

function triggerFishEaten() {
  fish.eaten = true;
  isAnimating = true;
  statusText.textContent = 'The dragon ate the fish!';
  renderBoard();

  setTimeout(() => {
    if (currentLevelIndex < levels.length - 1) {
      const nextLevelIndex = currentLevelIndex + 1;
      loadLevel(nextLevelIndex);
    } else {
      statusText.textContent = 'All levels complete!';
      setTimeout(() => {
        loadLevel(0);
      }, 1000);
    }
  }, 650);
}

function movePlayer(dx, dy) {
  if (isAnimating) {
    return;
  }

  const nextX = player.x + dx;
  const nextY = player.y + dy;

  if (!canMoveTo(nextX, nextY)) {
    return;
  }

  player = { x: nextX, y: nextY };
  renderBoard();

  if (player.x === fish.x && player.y === fish.y) {
    triggerFishEaten();
  }
}

function bindControls() {
  document.querySelectorAll('.control-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const dir = button.dataset.dir;

      if (dir === 'up') movePlayer(0, -1);
      if (dir === 'down') movePlayer(0, 1);
      if (dir === 'left') movePlayer(-1, 0);
      if (dir === 'right') movePlayer(1, 0);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') movePlayer(0, -1);
    if (event.key === 'ArrowDown') movePlayer(0, 1);
    if (event.key === 'ArrowLeft') movePlayer(-1, 0);
    if (event.key === 'ArrowRight') movePlayer(1, 0);
  });
}

function validateLevels() {
  levels.forEach((level, index) => {
    const tempPlayer = { ...level.player };
    const tempFish = { ...level.fish };
    const tempTreePositions = new Set();

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const key = `${x},${y}`;
        const isRouteCell = level.route.some((cell) => cell.x === x && cell.y === y);
        const isPlayerCell = tempPlayer.x === x && tempPlayer.y === y;
        const isFishCell = tempFish.x === x && tempFish.y === y;

        if (!isRouteCell && !isPlayerCell && !isFishCell) {
          tempTreePositions.add(key);
        }
      }
    }

    const path = findPath(tempPlayer, tempFish, tempTreePositions);
    if (path.length === 0) {
      console.warn(`Level ${index + 1} has no valid route to the fish.`);
    }
  });
}

validateLevels();
loadLevel(0);
bindControls();
