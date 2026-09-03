const db = require('./db');
const { marsMap } = require('./maps');

// 35 Minutes in milliseconds
const ROUND1_TIME = 35 * 60 * 1000;
const WRONG_RIDDLE_PENALTY_MS = 5 * 60 * 1000; // 5 minutes penalty

const ACTIONS = ['FORWARD', 'BACKWARD', 'TURN_LEFT_MOVE', 'TURN_RIGHT_MOVE'];
const BUTTONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const RIDDLES = [
  {
    id: 1,
    title: 'The Martian Shadow',
    question: "I follow you everywhere on Mars, but disappear completely when there is no light. You can't catch me, no matter how fast you run. What am I?",
    answers: ['shadow', 'your shadow', 'a shadow', 'rover shadow', 'martian shadow']
  },
  {
    id: 2,
    title: 'The Silent Traveller',
    question: 'I can travel across Mars without moving, I can reach your ears without having legs, and I disappear if you stop me. What am I?',
    answers: ['sound', 'a sound', 'sound wave', 'soundwave', 'voice', 'sound waves']
  },
  {
    id: 3,
    title: 'The Expansion',
    question: 'The more you take from me, the bigger I become. What am I?',
    answers: ['hole', 'a hole', 'crater', 'a crater']
  },
  {
    id: 4,
    title: 'Mars Mission',
    question: 'I have a face but no eyes, I have hands but no arms, and I can tell you something important without saying a word. What am I?',
    answers: ['clock', 'a clock', 'watch', 'a watch', 'timer']
  },
  {
    id: 5,
    title: 'The Strange Journey',
    question: "I'm always coming, but I never arrive. What am I?",
    answers: ['tomorrow', 'future', 'the future']
  }
];

// Seeded RNG for consistent team mismatched controls and riddle selection
function getSeededRandom(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(31, h) + seedStr.charCodeAt(i)) | 0;
  }
  return function () {
    h = Math.imul(1525252033, h);
    h ^= h >>> 15;
    h = Math.imul(3111003661, h);
    h ^= h >>> 16;
    h = Math.imul(2474773822, h);
    h ^= h >>> 14;
    return ((h >>> 0) / 4294967296);
  };
}

// Generate hidden scrambled control mapping for the team (mapping UP, DOWN, LEFT, RIGHT to head-directional actions)
function generateControls(teamId) {
  const rng = getSeededRandom(teamId + '_r1_ctrls_v2');
  const available = [...ACTIONS];
  const mapping = {};

  for (const btn of BUTTONS) {
    const idx = Math.floor(rng() * available.length);
    mapping[btn] = available[idx];
    available.splice(idx, 1);
  }

  return mapping;
}

// Get or initialize Round 1 state from Postgres
async function getOrInitRound1State(teamId) {
  let row = await db.prepare('SELECT * FROM round1_state WHERE team_id = ?').get(teamId);

  if (!row) {
    // Ensure team exists
    const team = await db.prepare('SELECT id FROM teams WHERE id = ?').get(teamId);
    if (!team) {
      await db.prepare('INSERT INTO teams (id, name) VALUES (?, ?) ON CONFLICT (id) DO NOTHING').run(teamId, `Team ${teamId}`);
      await db.prepare('INSERT INTO scores (team_id) VALUES (?) ON CONFLICT (team_id) DO NOTHING').run(teamId);
    }

    const rng = getSeededRandom(teamId + '_riddle');
    const riddleIndex = Math.floor(rng() * RIDDLES.length);

    await db.prepare(`
      INSERT INTO round1_state (
        team_id, rover_x, rover_y, facing, furthest_cell, start_time,
        time_penalty, riddle_id, riddle_attempts, riddle_solved, failed_all_riddles,
        checkpoint_reached, checkpoint_passed, completed, score
      ) VALUES (?, ?, ?, ?, 0, NULL, 0, ?, 0, 0, 0, 0, 0, 0, 0)
    `).run(teamId, marsMap.start.x, marsMap.start.y, 'E', riddleIndex);

    row = await db.prepare('SELECT * FROM round1_state WHERE team_id = ?').get(teamId);
  }

  return row;
}

function getTimeRemaining(state) {
  if (!state.start_time) return ROUND1_TIME;
  const elapsed = (Date.now() - Number(state.start_time)) + (state.time_penalty || 0);
  return Math.max(0, ROUND1_TIME - elapsed);
}

async function applyMove(teamId, buttonName) {
  const state = await getOrInitRound1State(teamId);

  if (state.completed) {
    return { success: false, error: 'Rover has reached the relay station.', state: await getClientState(teamId) };
  }

  const timeRemaining = getTimeRemaining(state);
  if (timeRemaining <= 0) {
    return { success: false, error: 'Round 1 time expired.', state: await getClientState(teamId) };
  }

  // Lock movement if at checkpoint and riddle has not been resolved (solved or failed 3 times)
  if (state.checkpoint_reached && !state.checkpoint_passed && !state.failed_all_riddles) {
    return {
      success: false,
      error: 'Lockout active: Solve the Mid-Mission Riddle at the checkpoint to proceed.',
      state: await getClientState(teamId)
    };
  }

  // Set start time on first movement
  let startTime = state.start_time;
  if (!startTime) {
    startTime = Date.now();
    await db.prepare('UPDATE round1_state SET start_time = ? WHERE team_id = ?').run(startTime, teamId);
    state.start_time = startTime;
  }

  // Scrambled button mapping
  const controls = generateControls(teamId);
  const action = controls[buttonName] || buttonName;

  const DIRS = ['N', 'E', 'S', 'W'];
  let currentFacing = state.facing || 'E';
  let facingIdx = DIRS.indexOf(currentFacing);
  if (facingIdx === -1) facingIdx = 1;

  let newFacing = currentFacing;
  let moveDirIdx = facingIdx;

  if (action === 'FORWARD' || action === 'UP') {
    // Move in current head direction
    moveDirIdx = facingIdx;
    newFacing = currentFacing;
  } else if (action === 'BACKWARD' || action === 'DOWN') {
    // Reverse movement or 180 flip
    moveDirIdx = (facingIdx + 2) % 4;
    newFacing = currentFacing; // Reverses while maintaining head or moves backward
  } else if (action === 'TURN_LEFT_MOVE' || action === 'LEFT') {
    // Rotate head left 90° and move
    moveDirIdx = (facingIdx + 3) % 4;
    newFacing = DIRS[moveDirIdx];
  } else if (action === 'TURN_RIGHT_MOVE' || action === 'RIGHT') {
    // Rotate head right 90° and move
    moveDirIdx = (facingIdx + 1) % 4;
    newFacing = DIRS[moveDirIdx];
  }

  const moveDir = DIRS[moveDirIdx];
  let dx = 0;
  let dy = 0;
  if (moveDir === 'N') dy = -1;
  else if (moveDir === 'S') dy = 1;
  else if (moveDir === 'E') dx = 1;
  else if (moveDir === 'W') dx = -1;

  let newX = state.rover_x + dx;
  let newY = state.rover_y + dy;

  // Collision check against map grid walls
  const isWalkable =
    newX >= 0 && newX < marsMap.width &&
    newY >= 0 && newY < marsMap.height &&
    marsMap.grid[newY][newX] !== 0;

  if (!isWalkable) {
    newX = state.rover_x;
    newY = state.rover_y;
  }
  
  // Update path progression using distanceMap
  let furthestCell = state.furthest_cell;
  const currentDist = marsMap.distanceMap[`${newX},${newY}`];
  if (currentDist !== undefined) {
    const progress = Math.max(0, marsMap.maxDistance - currentDist);
    if (progress > furthestCell) {
      furthestCell = progress;
    }
  }

  // Checkpoint trigger
  let checkpointReached = state.checkpoint_reached;
  if (newX === marsMap.checkpoint.x && newY === marsMap.checkpoint.y && !state.checkpoint_passed && !state.failed_all_riddles) {
    checkpointReached = 1;
  }

  // Final Relay Goal trigger
  let completed = state.completed;
  if (newX === marsMap.goal.x && newY === marsMap.goal.y && !completed) {
    completed = 1;
  }

  // Commit update to database
  await db.prepare(`
    UPDATE round1_state
    SET rover_x = ?, rover_y = ?, facing = ?, furthest_cell = ?,
        checkpoint_reached = ?, completed = ?
    WHERE team_id = ?
  `).run(newX, newY, newFacing, furthestCell, checkpointReached, completed, teamId);

  // We already know exactly what the row now looks like — merge it in
  // memory instead of re-SELECTing it twice more (once for the score
  // calc, once for the response state). Cuts this handler from ~3
  // SELECTs to 1 per move.
  const updatedState = {
    ...state,
    rover_x: newX,
    rover_y: newY,
    facing: newFacing,
    furthest_cell: furthestCell,
    checkpoint_reached: checkpointReached,
    completed
  };

  // Recalculate score
  const score = await calculateAndSaveRound1Score(teamId, updatedState);
  updatedState.score = score;

  return {
    success: true,
    actionExecuted: action,
    state: await getClientState(teamId, updatedState)
  };
}

async function submitRiddle(teamId, answerText) {
  const state = await getOrInitRound1State(teamId);

  if (!state.checkpoint_reached || state.checkpoint_passed || state.failed_all_riddles) {
    return { success: false, error: 'Checkpoint riddle is not currently pending.', state: await getClientState(teamId) };
  }

  const riddle = RIDDLES[state.riddle_id] || RIDDLES[0];
  const cleaned = (answerText || '').trim().toLowerCase();
  const isCorrect = riddle.answers.some(ans => cleaned.includes(ans) || ans.includes(cleaned));

  let attempts = state.riddle_attempts + 1;
  let solved = 0;
  let failedAll = 0;
  let checkpointPassed = 0;
  let penaltyAdd = 0;

  if (isCorrect) {
    solved = 1;
    checkpointPassed = 1;
  } else {
    // 5-minute penalty per failed attempt
    penaltyAdd = WRONG_RIDDLE_PENALTY_MS;
    if (attempts >= 3) {
      failedAll = 1;
      checkpointPassed = 1; // Unlocks movement after 3 failed attempts
    }
  }

  await db.prepare(`
    UPDATE round1_state
    SET riddle_attempts = ?, riddle_solved = ?, failed_all_riddles = ?,
        checkpoint_passed = ?, time_penalty = time_penalty + ?
    WHERE team_id = ?
  `).run(attempts, solved, failedAll, checkpointPassed, penaltyAdd, teamId);

  const updatedState = {
    ...state,
    riddle_attempts: attempts,
    riddle_solved: solved,
    failed_all_riddles: failedAll,
    checkpoint_passed: checkpointPassed,
    time_penalty: (state.time_penalty || 0) + penaltyAdd
  };

  const score = await calculateAndSaveRound1Score(teamId, updatedState);
  updatedState.score = score;

  return {
    success: true,
    correct: Boolean(solved),
    failedAll: Boolean(failedAll),
    penaltyAddedMs: penaltyAdd,
    state: await getClientState(teamId, updatedState)
  };
}

async function calculateAndSaveRound1Score(teamId, stateOverride) {
  const state = stateOverride || await getOrInitRound1State(teamId);

  // Distance Score (Up to 60 Points)
  const totalSteps = marsMap.maxDistance || 1;
  const cellsVisited = Math.min(totalSteps, state.furthest_cell || 0);
  const distanceScore = Math.floor((cellsVisited / totalSteps) * 60);

  // Time Bonus (Up to 40 Points)
  let timeScore = 0;
  if (state.completed && state.start_time) {
    const elapsed = (Date.now() - Number(state.start_time)) + (state.time_penalty || 0);
    const timeRemaining = Math.max(0, ROUND1_TIME - elapsed);
    timeScore = Math.floor((timeRemaining / ROUND1_TIME) * 40);
  }

  // Checkpoint Riddle Points (+20 Points if solved)
  const riddleBonus = state.riddle_solved ? 20 : 0;

  const score = Math.min(100, Math.max(0, distanceScore + timeScore + riddleBonus));

  await db.prepare('UPDATE round1_state SET score = ? WHERE team_id = ?').run(score, teamId);
  await db.prepare('UPDATE scores SET round1_score = ?, total_score = round1_score + round2_score + round3_score WHERE team_id = ?').run(score, teamId);

  return score;
}

async function getClientState(teamId, stateOverride) {
  const state = stateOverride || await getOrInitRound1State(teamId);
  const riddle = RIDDLES[state.riddle_id] || RIDDLES[0];
  const timeRemaining = getTimeRemaining(state);
  const totalCorrect = marsMap.maxDistance || 1;
  const proximityPercent = Math.min(100, Math.max(0, Math.floor((state.furthest_cell / totalCorrect) * 100)));
  const scoreRevealed = timeRemaining <= 0;

  return {
    map: {
      width: marsMap.width,
      height: marsMap.height,
      grid: marsMap.grid,
      start: marsMap.start,
      goal: marsMap.goal
    },
    rover: {
      x: state.rover_x,
      y: state.rover_y,
      facing: state.facing
    },
    furthestCell: state.furthest_cell,
    proximityPercent,
    timeRemaining,
    checkpointReached: Boolean(state.checkpoint_reached),
    checkpointPassed: Boolean(state.checkpoint_passed),
    riddle: state.checkpoint_reached ? {
      title: riddle.title,
      question: riddle.question,
      attempts: state.riddle_attempts,
      solved: Boolean(state.riddle_solved),
      failedAll: Boolean(state.failed_all_riddles)
    } : null,
    completed: Boolean(state.completed),
    scoreRevealed,
    score: scoreRevealed ? state.score : null,
    rawScore: state.score // For internal/admin references if needed
  };
}

async function startRound1ForTeam(teamId, startTime = Date.now()) {
  const state = await getOrInitRound1State(teamId);
  if (!state.start_time) {
    await db.prepare('UPDATE round1_state SET start_time = ? WHERE team_id = ?').run(startTime, teamId);
  }
}

module.exports = {
  ROUND1_TIME,
  RIDDLES,
  getOrInitRound1State,
  startRound1ForTeam,
  applyMove,
  submitRiddle,
  calculateAndSaveRound1Score,
  getClientState
};