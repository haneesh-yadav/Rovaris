const db = require('./db');

const SECRET_TRANSMISSION = ['ALIENS', 'ARE', 'CUTE'];
const ROUND3_TIME = 40 * 60 * 1000; // 40 minutes

const MORSE_TABLE = {
  'A': '.-',   'B': '-...', 'C': '-.-.', 'D': '-..',
  'E': '.',    'F': '..-.', 'G': '--.',  'H': '....',
  'I': '..',   'J': '.---', 'K': '-.-',  'L': '.-..',
  'M': '--',   'N': '-.',   'O': '---',  'P': '.--.',
  'Q': '--.-', 'R': '.-.',  'S': '...',  'T': '-',
  'U': '..-',  'V': '...-', 'W': '.--',  'X': '-..-',
  'Y': '-.--', 'Z': '--..'
};

function encodeToMorse(words) {
  return words.map(w => 
    w.toUpperCase().split('').map(char => MORSE_TABLE[char] || '').join(' ')
  ).join(' / ');
}

async function getOrInitRound3State(teamId) {
  let row = await db.prepare('SELECT * FROM round3_state WHERE team_id = ?').get(teamId);

  if (!row) {
    const team = await db.prepare('SELECT id FROM teams WHERE id = ?').get(teamId);
    if (!team) {
      await db.prepare('INSERT INTO teams (id, name) VALUES (?, ?) ON CONFLICT (id) DO NOTHING').run(teamId, `Team ${teamId}`);
      await db.prepare('INSERT INTO scores (team_id) VALUES (?) ON CONFLICT (team_id) DO NOTHING').run(teamId);
    }

    await db.prepare(`
      INSERT INTO round3_state (
        team_id, playbacks_remaining, submission, completed, score, start_time
      ) VALUES (?, 0, NULL, 0, 0, NULL)
    `).run(teamId);

    row = await db.prepare('SELECT * FROM round3_state WHERE team_id = ?').get(teamId);
  }

  return row;
}

async function startRound3ForTeam(teamId, startTime = Date.now()) {
  await getOrInitRound3State(teamId);
  await db.prepare('UPDATE round3_state SET start_time = ? WHERE team_id = ?').run(startTime, teamId);
}

async function playAudio(teamId) {
  const state = await getOrInitRound3State(teamId);

  if (state.completed) {
    return { success: false, error: 'Transmission challenge already completed.', state: await getClientState(teamId) };
  }

  // Increment playback count (stored in playbacks_remaining column as times played)
  const timesPlayed = (state.playbacks_remaining || 0) + 1;
  await db.prepare('UPDATE round3_state SET playbacks_remaining = ? WHERE team_id = ?').run(timesPlayed, teamId);

  const updatedState = { ...state, playbacks_remaining: timesPlayed };

  return {
    success: true,
    morseString: encodeToMorse(SECRET_TRANSMISSION),
    state: await getClientState(teamId, updatedState)
  };
}

async function submitTransmission(teamId, words) {
  const state = await getOrInitRound3State(teamId);

  if (state.completed) {
    return { success: false, error: 'Transmission already submitted.', state: await getClientState(teamId) };
  }

  const submittedWords = Array.isArray(words) ? words : [];
  let correctCount = 0;

  for (let i = 0; i < 3; i++) {
    const userWord = (submittedWords[i] || '').trim().toUpperCase();
    const targetWord = SECRET_TRANSMISSION[i];
    if (userWord === targetWord) {
      correctCount++;
    }
  }

  let round3Score = 0;
  if (correctCount === 3) round3Score = 30;
  else if (correctCount === 2) round3Score = 20;
  else if (correctCount === 1) round3Score = 10;
  else round3Score = 0;

  await db.prepare(`
    UPDATE round3_state
    SET submission = ?, completed = 1, score = ?
    WHERE team_id = ?
  `).run(JSON.stringify(submittedWords), round3Score, teamId);

  await db.prepare(`
    UPDATE scores
    SET round3_score = ?, total_score = round1_score + round2_score + ?
    WHERE team_id = ?
  `).run(round3Score, round3Score, teamId);

  const updatedState = {
    ...state,
    submission: JSON.stringify(submittedWords),
    completed: 1,
    score: round3Score
  };

  return {
    success: true,
    correctWords: correctCount,
    scoreAwarded: round3Score,
    state: await getClientState(teamId, updatedState)
  };
}

async function getClientState(teamId, stateOverride) {
  const state = stateOverride || await getOrInitRound3State(teamId);
  const now = Date.now();
  let timeRemaining = ROUND3_TIME;
  if (state.start_time) {
    timeRemaining = Math.max(0, ROUND3_TIME - (now - Number(state.start_time)));
  }
  const scoreRevealed = Boolean((state.start_time && timeRemaining <= 0) || state.completed);

  return {
    timesPlayed: state.playbacks_remaining || 0,
    submission: JSON.parse(state.submission || 'null'),
    completed: Boolean(state.completed),
    scoreRevealed,
    score: scoreRevealed ? state.score : null,
    rawScore: state.score,
    timeRemaining
  };
}

module.exports = {
  ROUND3_TIME,
  SECRET_TRANSMISSION,
  MORSE_TABLE,
  getOrInitRound3State,
  startRound3ForTeam,
  playAudio,
  submitTransmission,
  getClientState
};