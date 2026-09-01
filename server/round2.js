const db = require('./db');

const SYSTEMS = [
  {
    id: 'comm',
    name: 'Communication System',
    cost: 40,
    points: 40,
    advantage: 'Preserves clear telemetry links with Mission Control, keeps live audio/text updates stable, and eliminates radio noise.',
    disadvantage: 'Transmissions experience heavy static, telemetry updates suffer lag, and future text prompts become corrupted.'
  },
  {
    id: 'drive',
    name: 'Rover Drive & Battery System',
    cost: 20,
    points: 20,
    advantage: 'Motors run at 100% capacity, providing max drive speed and instant movement response times.',
    disadvantage: 'Movement speed drops by 50%, motor responsiveness becomes sluggish, and drive strain alerts trigger.'
  },
  {
    id: 'nav',
    name: 'Navigation System',
    cost: 25,
    points: 25,
    advantage: 'Maintains active satellite positioning, accurate coordinate tracking, and automated path orientation.',
    disadvantage: 'Position tracking loses precision, automated mapping disables, and visual coordinates blur.'
  },
  {
    id: 'thermal',
    name: 'Thermal Regulation System',
    cost: 25,
    points: 25,
    advantage: 'Regulates internal core temperatures, protecting delicate processing circuits from thermal decay.',
    disadvantage: 'Temperature fluctuations trigger periodic overheat warnings and transient visual interface glitches.'
  },
  {
    id: 'radar',
    name: 'Radar & Terrain Scanner',
    cost: 15,
    points: 15,
    advantage: 'Actively scans local Martian topography, identifying rocks, drop-offs, and environmental obstacles.',
    disadvantage: 'Terrain radar turns off; visual awareness of surrounding hazards becomes strictly limited.'
  },
  {
    id: 'beacon',
    name: 'Emergency Beacon',
    cost: 20,
    points: 20,
    advantage: 'Continuously broadcasts localized emergency recovery signals, making location tracking simple.',
    disadvantage: 'Signal beacon shuts down; emergency tracking systems lose sight of the rover\'s location.'
  },
  {
    id: 'aux',
    name: 'Life Support Auxiliary Relay',
    cost: 15,
    points: 15,
    advantage: 'Maintains suit environmental monitoring relays and atmospheric pressure sensors for nearby crew.',
    disadvantage: 'Environmental sensors fail; persistent critical alert overlays clutter the Mission Control display.'
  }
];

const WORD_POOL = [
  'SUPERNOVA', 'GALAXY', 'MILKYWAY', 'ROCKET',
  'NEBULA', 'METEOR', 'STARDUST', 'TELESCOPE',
  'COSMOS', 'UNIVERSE', 'ASTRONAUT', 'SPACECRAFT'
];

// Phase durations
const ALLOCATION_DURATION_MS = 10 * 60 * 1000;   // 10 minutes for Part 1
const HANGMAN_DURATION_MS = 6 * 60 * 1000;        // 6 minutes per Hangman
const DECISION_DURATION_MS = 1.5 * 60 * 1000;     // 1.5 minutes decision window

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

function getOrInitRound2State(teamId) {
  let row = db.prepare('SELECT * FROM round2_state WHERE team_id = ?').get(teamId);

  if (!row) {
    const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(teamId);
    if (!team) {
      db.prepare('INSERT OR IGNORE INTO teams (id, name) VALUES (?, ?)').run(teamId, `Team ${teamId}`);
      db.prepare('INSERT OR IGNORE INTO scores (team_id) VALUES (?)').run(teamId);
    }

    const rng = getSeededRandom(teamId + '_r2_words');
    const pool = [...WORD_POOL];
    const words = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(rng() * pool.length);
      words.push(pool[idx]);
      pool.splice(idx, 1);
    }

    db.prepare(`
      INSERT INTO round2_state (
        team_id, phase, active_systems, baseline_systems, power_budget, hangman_index,
        hangman_words, guessed_letters, mistakes, hangman_completed,
        hangman_won, decision_type, phase_start_time, phase_duration,
        completed, score
      ) VALUES (?, 'allocation', '[]', '[]', 90, 0, ?, '[]', 0, 0, 0, NULL, NULL, ?, 0, 0)
    `).run(teamId, JSON.stringify(words), ALLOCATION_DURATION_MS);

    row = db.prepare('SELECT * FROM round2_state WHERE team_id = ?').get(teamId);
  }

  return row;
}

function startRound2ForTeam(teamId, startTime = Date.now()) {
  getOrInitRound2State(teamId);
  db.prepare(`
    UPDATE round2_state
    SET phase = 'allocation', phase_start_time = ?, phase_duration = ?,
        hangman_index = 0, guessed_letters = '[]', mistakes = 0,
        hangman_completed = 0, hangman_won = 0, decision_type = NULL,
        completed = 0, power_budget = 90
    WHERE team_id = ?
  `).run(startTime, ALLOCATION_DURATION_MS, teamId);
}

function updatePhaseIfExpired(state) {
  if (state.completed || state.phase === 'completed') return false;
  if (!state.phase_start_time) return false;

  const now = Date.now();
  const elapsed = now - state.phase_start_time;
  if (elapsed < state.phase_duration) return false;

  let currentPhase = state.phase;
  let activeSystems = JSON.parse(state.active_systems || '[]');
  let hangmanWords = JSON.parse(state.hangman_words || '[]');
  let hangmanIdx = state.hangman_index || 0;
  let powerBudget = state.power_budget || 80;
  let nextPhase = currentPhase;
  let nextDuration = 0;
  let decisionType = state.decision_type;
  let hangmanWon = state.hangman_won;
  let completed = state.completed;

  if (currentPhase === 'allocation') {
    nextPhase = 'hangman_0';
    nextDuration = HANGMAN_DURATION_MS;
    hangmanIdx = 0;
  } else if (currentPhase.startsWith('hangman_')) {
    const idx = parseInt(currentPhase.split('_')[1], 10);
    nextPhase = `decision_${idx}`;
    nextDuration = DECISION_DURATION_MS;
    decisionType = hangmanWon ? 'power_boost' : 'forced_shutdown';
  } else if (currentPhase.startsWith('decision_')) {
    const idx = parseInt(currentPhase.split('_')[1], 10);
    if (idx < 2) {
      nextPhase = `hangman_${idx + 1}`;
      nextDuration = HANGMAN_DURATION_MS;
      hangmanIdx = idx + 1;
      decisionType = null;
      hangmanWon = 0;
    } else {
      nextPhase = 'completed';
      nextDuration = 0;
      completed = 1;
    }
  }

  db.prepare(`
    UPDATE round2_state
    SET phase = ?, phase_start_time = ?, phase_duration = ?,
        hangman_index = ?, guessed_letters = '[]', mistakes = 0,
        hangman_completed = 0, hangman_won = ?, decision_type = ?,
        completed = ?
    WHERE team_id = ?
  `).run(nextPhase, now, nextDuration, hangmanIdx, hangmanWon, decisionType, completed, state.team_id);

  if (completed) {
    calculateAndSaveRound2Score(state.team_id);
  }

  return true;
}

function toggleSystem(teamId, sysId) {
  const state = getOrInitRound2State(teamId);
  updatePhaseIfExpired(state);

  const activeSystems = JSON.parse(state.active_systems || '[]');
  const sys = SYSTEMS.find(s => s.id === sysId);
  if (!sys) return { success: false, error: 'System not found.', state: getClientState(teamId) };

  const isCurrentlyActive = activeSystems.includes(sysId);

  // During allocation phase
  if (state.phase === 'allocation') {
    let newActive = [];
    if (isCurrentlyActive) {
      newActive = activeSystems.filter(id => id !== sysId);
    } else {
      const currentPowerUsed = activeSystems.reduce((sum, id) => {
        const item = SYSTEMS.find(s => s.id === id);
        return sum + (item ? item.cost : 0);
      }, 0);

      if (currentPowerUsed + sys.cost > state.power_budget) {
        return { success: false, error: `Insufficient power budget (Max ${state.power_budget} units).`, state: getClientState(teamId) };
      }
      newActive = [...activeSystems, sysId];
    }

    db.prepare('UPDATE round2_state SET active_systems = ? WHERE team_id = ?').run(JSON.stringify(newActive), teamId);
    calculateAndSaveRound2Score(teamId);

    return { success: true, state: getClientState(teamId) };
  }

  // During decision phase
  if (state.phase.startsWith('decision_')) {
    const baseline = JSON.parse(state.baseline_systems || '[]');

    if (state.decision_type === 'power_boost') {
      // Baseline active systems cannot be dropped
      if (baseline.includes(sysId)) {
        return { success: false, error: 'Previously active systems cannot be dropped.', state: getClientState(teamId) };
      }

      let newActive = [];
      if (isCurrentlyActive) {
        // Allow deselecting a newly selected unselected system
        newActive = activeSystems.filter(id => id !== sysId);
      } else {
        // Select an unselected system if power budget permits
        const currentPowerUsed = activeSystems.reduce((sum, id) => {
          const item = SYSTEMS.find(s => s.id === id);
          return sum + (item ? item.cost : 0);
        }, 0);

        if (currentPowerUsed + sys.cost > state.power_budget) {
          return { success: false, error: `Insufficient power budget (${currentPowerUsed + sys.cost} / ${state.power_budget}).`, state: getClientState(teamId) };
        }
        newActive = [...activeSystems, sysId];
      }

      db.prepare('UPDATE round2_state SET active_systems = ? WHERE team_id = ?').run(JSON.stringify(newActive), teamId);
      calculateAndSaveRound2Score(teamId);
      return { success: true, state: getClientState(teamId) };
    } else if (state.decision_type === 'forced_shutdown') {
      // Only baseline active systems can be chosen for shutdown
      if (!baseline.includes(sysId)) {
        return { success: false, error: 'Only previously active systems can be selected for shutdown.', state: getClientState(teamId) };
      }

      let newActive = [];
      if (isCurrentlyActive) {
        // Deselect system to stage it for shutdown
        newActive = activeSystems.filter(id => id !== sysId);
      } else {
        // Re-select system to cancel shutdown and pick another one
        newActive = [...activeSystems, sysId];
      }

      db.prepare('UPDATE round2_state SET active_systems = ? WHERE team_id = ?').run(JSON.stringify(newActive), teamId);
      calculateAndSaveRound2Score(teamId);
      return { success: true, state: getClientState(teamId) };
    }
  }

  return { success: false, error: 'System modifications locked during current phase.', state: getClientState(teamId) };
}

function guessLetter(teamId, letter) {
  const state = getOrInitRound2State(teamId);
  updatePhaseIfExpired(state);

  if (!state.phase.startsWith('hangman_') || state.hangman_completed) {
    return { success: false, error: 'Hangman challenge not currently open for guesses.', state: getClientState(teamId) };
  }

  const char = String(letter).toUpperCase().trim();
  if (!char || char.length !== 1 || !/[A-Z]/.test(char)) {
    return { success: false, error: 'Invalid character.', state: getClientState(teamId) };
  }

  const guessed = JSON.parse(state.guessed_letters || '[]');
  if (guessed.includes(char)) {
    return { success: false, error: 'Letter already guessed.', state: getClientState(teamId) };
  }

  guessed.push(char);

  const hangmanWords = JSON.parse(state.hangman_words || '[]');
  const word = hangmanWords[state.hangman_index] || 'GALAXY';

  let mistakes = state.mistakes;
  if (!word.includes(char)) {
    mistakes++;
  }

  const won = word.split('').every(c => guessed.includes(c));
  const lost = mistakes >= 8; // 8 SVG parts: Base, Pole, Head, Body, Left Arm, Right Arm, Left Leg, Right Leg

  let completed = 0;
  let hangmanWon = 0;
  let powerBudget = state.power_budget;

  if (won) {
    completed = 1;
    hangmanWon = 1;
    // Reward +15 emergency power units (and +5 pts word bonus counted in score)
    powerBudget = powerBudget + 15;
  } else if (lost) {
    completed = 1;
    hangmanWon = 0;
  }

  db.prepare(`
    UPDATE round2_state
    SET guessed_letters = ?, mistakes = ?, hangman_completed = ?,
        hangman_won = ?, power_budget = ?, baseline_systems = ?
    WHERE team_id = ?
  `).run(JSON.stringify(guessed), mistakes, completed, hangmanWon, powerBudget, state.active_systems, teamId);

  // If completed, automatically set decision phase
  if (completed) {
    const idx = state.hangman_index;
    const nextPhase = `decision_${idx}`;
    const decisionType = hangmanWon ? 'power_boost' : 'forced_shutdown';
    const now = Date.now();

    db.prepare(`
      UPDATE round2_state
      SET phase = ?, phase_start_time = ?, phase_duration = ?, decision_type = ?,
          baseline_systems = ?
      WHERE team_id = ?
    `).run(nextPhase, now, DECISION_DURATION_MS, decisionType, state.active_systems, teamId);
  }

  calculateAndSaveRound2Score(teamId);

  return { success: true, state: getClientState(teamId) };
}

function advanceDecision(teamId) {
  const state = getOrInitRound2State(teamId);
  const currentPhase = state.phase;

  if (!currentPhase.startsWith('decision_')) {
    return { success: false, error: 'Not currently in decision window.', state: getClientState(teamId) };
  }

  const baseline = JSON.parse(state.baseline_systems || '[]');
  const active = JSON.parse(state.active_systems || '[]');

  if (state.decision_type === 'forced_shutdown') {
    if (baseline.length > 0 && active.length >= baseline.length) {
      return { success: false, error: 'Please select at least 1 active system to shut down before proceeding.', state: getClientState(teamId) };
    }
  } else if (state.decision_type === 'power_boost') {
    const currentPowerUsed = active.reduce((sum, id) => {
      const item = SYSTEMS.find(s => s.id === id);
      return sum + (item ? item.cost : 0);
    }, 0);
    const canAffordAny = SYSTEMS.some(s => !baseline.includes(s.id) && s.cost <= (state.power_budget - currentPowerUsed));
    if (canAffordAny && active.length <= baseline.length) {
      return { success: false, error: 'Please select an unselected system to activate before proceeding.', state: getClientState(teamId) };
    }
  }

  const idx = parseInt(currentPhase.split('_')[1], 10);
  let nextPhase = '';
  let nextDuration = 0;
  let hangmanIdx = idx;
  let decisionType = null;
  let hangmanWon = 0;
  let completed = state.completed;
  const now = Date.now();

  if (idx < 2) {
    nextPhase = `hangman_${idx + 1}`;
    nextDuration = HANGMAN_DURATION_MS;
    hangmanIdx = idx + 1;
    decisionType = null;
    hangmanWon = 0;
  } else {
    nextPhase = 'completed';
    nextDuration = 0;
    completed = 1;
  }

  db.prepare(`
    UPDATE round2_state
    SET phase = ?, phase_start_time = ?, phase_duration = ?,
        hangman_index = ?, guessed_letters = '[]', mistakes = 0,
        hangman_completed = 0, hangman_won = ?, decision_type = ?,
        completed = ?, baseline_systems = ?
    WHERE team_id = ?
  `).run(nextPhase, now, nextDuration, hangmanIdx, hangmanWon, decisionType, completed, state.active_systems, teamId);

  calculateAndSaveRound2Score(teamId);
  return { success: true, state: getClientState(teamId) };
}

function calculateAndSaveRound2Score(teamId) {
  const state = getOrInitRound2State(teamId);
  const activeSystems = JSON.parse(state.active_systems || '[]');

  // Active system preserved points
  let systemsScore = 0;
  for (const sysId of activeSystems) {
    const sys = SYSTEMS.find(s => s.id === sysId);
    if (sys) systemsScore += sys.points;
  }

  // Hangman solved bonuses: +5 pts per word won
  let hangmanBonus = 0;
  if (state.hangman_won) {
    hangmanBonus += 5;
  }
  const powerDiff = (state.power_budget || 90) - 90;
  if (powerDiff > 0) {
    const wordsWonCount = Math.min(3, Math.floor(powerDiff / 15));
    hangmanBonus = wordsWonCount * 5;
  }

  const totalRound2Score = systemsScore + hangmanBonus;

  db.prepare('UPDATE round2_state SET score = ? WHERE team_id = ?').run(totalRound2Score, teamId);
  db.prepare('UPDATE scores SET round2_score = ?, total_score = round1_score + round2_score + round3_score WHERE team_id = ?').run(totalRound2Score, teamId);

  return totalRound2Score;
}

function getClientState(teamId) {
  let state = getOrInitRound2State(teamId);
  const changed = updatePhaseIfExpired(state);
  if (changed) {
    state = db.prepare('SELECT * FROM round2_state WHERE team_id = ?').get(teamId) || state;
  }

  const activeSystems = JSON.parse(state.active_systems || '[]');
  const baselineSystems = JSON.parse(state.baseline_systems || '[]');
  const hangmanWords = JSON.parse(state.hangman_words || '[]');
  const guessedLetters = JSON.parse(state.guessed_letters || '[]');
  const word = hangmanWords[state.hangman_index] || '';

  const maskedWord = word.split('').map(c => guessedLetters.includes(c) ? c : '_').join(' ');

  const now = Date.now();
  let timeRemaining = state.phase_duration || ALLOCATION_DURATION_MS;
  if (state.phase_start_time) {
    const elapsed = now - state.phase_start_time;
    timeRemaining = Math.max(0, (state.phase_duration || 0) - elapsed);
  }

  const powerUsed = activeSystems.reduce((sum, id) => {
    const s = SYSTEMS.find(item => item.id === id);
    return sum + (s ? s.cost : 0);
  }, 0);

  return {
    phase: state.phase,
    systems: SYSTEMS.map(s => ({
      id: s.id,
      name: s.name,
      cost: s.cost,
      advantage: s.advantage,
      disadvantage: s.disadvantage,
      active: activeSystems.includes(s.id),
      isBaseline: baselineSystems.includes(s.id)
    })),
    baselineSystems,
    powerBudget: state.power_budget,
    powerUsed,
    powerRemaining: Math.max(0, state.power_budget - powerUsed),
    hangman: {
      gameNumber: (state.hangman_index || 0) + 1,
      totalGames: 3,
      maskedWord: state.phase.startsWith('hangman_') || state.phase.startsWith('decision_') ? maskedWord : '',
      solutionWord: word,
      guessedLetters,
      mistakes: state.mistakes,
      maxMistakes: 8,
      completed: Boolean(state.hangman_completed) || state.phase.startsWith('decision_'),
      won: Boolean(state.hangman_won)
    },
    decisionType: state.decision_type,
    timeRemaining,
    completed: Boolean(state.completed),
    score: state.score
  };
}

module.exports = {
  SYSTEMS,
  WORD_POOL,
  ALLOCATION_DURATION_MS,
  HANGMAN_DURATION_MS,
  DECISION_DURATION_MS,
  getOrInitRound2State,
  startRound2ForTeam,
  updatePhaseIfExpired,
  toggleSystem,
  guessLetter,
  advanceDecision,
  calculateAndSaveRound2Score,
  getClientState
};