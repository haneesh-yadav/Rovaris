// ============================================================
// ROVARIS - ROUND 1 MARS MAZE LAYOUTS
// High-complexity, ultra-intricate Martian labyrinth with 100+ turns.
// Start at top-left (1,1), Relay at bottom-right (43,21), multiple deceptive winding corridors.
// ============================================================

const MAP_WIDTH = 45;
const MAP_HEIGHT = 23;

function generateIntricateMarsMaze() {
  const w = MAP_WIDTH;
  const h = MAP_HEIGHT;

  let rngState = 1013;
  function random() {
    rngState = (rngState * 1664525 + 1013904223) % 4294967296;
    return rngState / 4294967296;
  }

  const grid = Array.from({ length: h }, () => Array(w).fill(0));

  // Turn-biased recursive backtracker to maximize winding corridors and turns
  function carve(cx, cy, lastDir = null) {
    grid[cy][cx] = 1;
    const allDirs = [
      [0, -2], // N
      [2, 0],  // E
      [0, 2],  // S
      [-2, 0]  // W
    ];

    // Bias towards turns rather than long straight lines
    const sortedDirs = allDirs.sort((a, b) => {
      const aIsStraight = lastDir && a[0] === lastDir[0] && a[1] === lastDir[1];
      const bIsStraight = lastDir && b[0] === lastDir[0] && b[1] === lastDir[1];
      if (aIsStraight) return 1;
      if (bIsStraight) return -1;
      return random() - 0.5;
    });

    for (const [dx, dy] of sortedDirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && grid[ny][nx] === 0) {
        grid[cy + dy / 2][cx + dx / 2] = 1;
        carve(nx, ny, [dx, dy]);
      }
    }
  }

  carve(1, 1);

  // Add 8% extra interconnects for deceptive parallel paths and loops
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      if (random() < 0.08) {
        const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        const [dx, dy] = dirs[Math.floor(random() * dirs.length)];
        const nx = x + dx;
        const ny = y + dy;
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
          grid[ny][nx] = 1;
        }
      }
    }
  }

  // Ensure Start (1,1) and Goal (w-2, h-2) are open corridors
  const start = { x: 1, y: 1 };
  const goal = { x: w - 2, y: h - 2 };
  grid[start.y][start.x] = 1;
  grid[goal.y][goal.x] = 1;

  // BFS to compute exact shortest solution path and distance map
  const queue = [[start.x, start.y, [start]]];
  const visited = new Set([`${start.x},${start.y}`]);
  let solutionPath = [];

  while (queue.length > 0) {
    const [x, y, path] = queue.shift();
    if (x === goal.x && y === goal.y) {
      solutionPath = path;
      break;
    }
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && grid[ny][nx] === 1 && !visited.has(key)) {
        visited.add(key);
        queue.push([nx, ny, [...path, { x: nx, y: ny }]]);
      }
    }
  }

  // Checkpoint placed at exact 50% midpoint of the true solution path
  const checkpoint = solutionPath[Math.floor(solutionPath.length / 2)] || { x: 23, y: 11 };

  // BFS from Goal to all reachable cells for realistic proximity telemetry
  const distanceMap = {};
  const goalQueue = [[goal.x, goal.y, 0]];
  const goalVisited = new Set([`${goal.x},${goal.y}`]);
  let maxDistance = 1;

  while (goalQueue.length > 0) {
    const [gx, gy, d] = goalQueue.shift();
    distanceMap[`${gx},${gy}`] = d;
    if (d > maxDistance) maxDistance = d;

    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = gx + dx;
      const ny = gy + dy;
      const key = `${nx},${ny}`;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && grid[ny][nx] === 1 && !goalVisited.has(key)) {
        goalVisited.add(key);
        goalQueue.push([nx, ny, d + 1]);
      }
    }
  }

  // Special tile codes:
  // 2: Start, 3: Relay Goal, 4: Checkpoint
  grid[start.y][start.x] = 2;
  grid[goal.y][goal.x] = 3;
  grid[checkpoint.y][checkpoint.x] = 4;

  return {
    id: 'mars_prime_ultra_intricate',
    name: 'Martian Sector 7 Labyrinth',
    width: w,
    height: h,
    grid,
    start,
    goal,
    checkpoint,
    solutionPath,
    totalCorrectCells: solutionPath.length,
    distanceMap,
    maxDistance
  };
}

const marsMap = generateIntricateMarsMaze();

module.exports = {
  MAP_WIDTH,
  MAP_HEIGHT,
  marsMap
};