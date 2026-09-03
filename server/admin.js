const db = require('./db');
const round1 = require('./round1');
const round2 = require('./round2');
const round3 = require('./round3');

async function getSessionState() {
  const session = (await db.prepare('SELECT * FROM game_session WHERE id = 1').get()) || { current_phase: 'lobby', is_paused: 0 };
  const reveals = (await db.prepare('SELECT * FROM admin_reveals WHERE id = 1').get()) || { round2_revealed: 0, round3_revealed: 0 };
  return {
    phase: session.current_phase,
    isPaused: Boolean(session.is_paused),
    reveals: {
      round2Revealed: Boolean(reveals.round2_revealed),
      round3Revealed: Boolean(reveals.round3_revealed)
    }
  };
}

async function setGamePhase(newPhase) {
  await db.prepare("UPDATE game_session SET current_phase = ?, updated_at = NOW() WHERE id = 1").run(newPhase);
  return getSessionState();
}

async function toggleGamePause() {
  const session = await db.prepare('SELECT * FROM game_session WHERE id = 1').get();
  const nextPaused = session.is_paused ? 0 : 1;
  await db.prepare("UPDATE game_session SET is_paused = ?, updated_at = NOW() WHERE id = 1").run(nextPaused);
  return getSessionState();
}

async function getAdminTelemetry() {
  const teams = await db.prepare('SELECT * FROM teams ORDER BY created_at ASC').all();
  const session = await getSessionState();

  const telemetryTeams = await Promise.all(teams.map(async (team) => {
    const r1State = await round1.getClientState(team.id);
    const r2State = await round2.getClientState(team.id);
    const r3State = await round3.getClientState(team.id);
    const scoreRow = (await db.prepare('SELECT * FROM scores WHERE team_id = ?').get(team.id)) || {
      round1_score: 0,
      round2_score: 0,
      round3_score: 0,
      total_score: 0
    };

    return {
      id: team.id,
      name: team.name,
      connected: Boolean(team.connected),
      r1: {
        x: r1State.rover.x,
        y: r1State.rover.y,
        facing: r1State.rover.facing,
        proximity: r1State.proximityPercent,
        checkpointReached: r1State.checkpointReached,
        checkpointPassed: r1State.checkpointPassed,
        completed: r1State.completed,
        score: scoreRow.round1_score
      },
      r2: {
        phase: r2State.phase,
        powerUsed: r2State.powerUsed,
        powerBudget: r2State.powerBudget,
        activeSystems: r2State.systems.filter(s => s.active).map(s => s.name),
        hangmanGame: r2State.hangman.gameNumber,
        hangmanMistakes: r2State.hangman.mistakes,
        completed: r2State.completed,
        score: scoreRow.round2_score
      },
      r3: {
        timesPlayed: r3State.timesPlayed || 0,
        submission: r3State.submission,
        completed: r3State.completed,
        score: scoreRow.round3_score
      },
      scores: {
        r1: scoreRow.round1_score || 0,
        r2: scoreRow.round2_score || 0,
        r3: scoreRow.round3_score || 0,
        total: (scoreRow.round1_score || 0) + (scoreRow.round2_score || 0) + (scoreRow.round3_score || 0)
      }
    };
  }));

  return {
    session,
    teams: telemetryTeams
  };
}

async function getLeaderboard() {
  const telemetry = await getAdminTelemetry();
  const sorted = [...telemetry.teams].sort((a, b) => b.scores.total - a.scores.total);
  return {
    leaderboard: sorted,
    reveals: telemetry.session.reveals
  };
}

async function adjustTeamScore(teamId, roundNum, delta) {
  const col = `round${roundNum}_score`;
  await db.prepare(`
    UPDATE scores
    SET ${col} = GREATEST(0, ${col} + ?),
        total_score = round1_score + round2_score + round3_score
    WHERE team_id = ?
  `).run(delta, teamId);

  // Sync to round state table
  if (roundNum === 1) {
    await db.prepare('UPDATE round1_state SET score = GREATEST(0, score + ?) WHERE team_id = ?').run(delta, teamId);
  } else if (roundNum === 2) {
    await db.prepare('UPDATE round2_state SET score = GREATEST(0, score + ?) WHERE team_id = ?').run(delta, teamId);
  } else if (roundNum === 3) {
    await db.prepare('UPDATE round3_state SET score = GREATEST(0, score + ?) WHERE team_id = ?').run(delta, teamId);
  }

  return getAdminTelemetry();
}

async function overrideTeamTime(teamId, deltaMs) {
  const r1 = await db.prepare('SELECT time_penalty FROM round1_state WHERE team_id = ?').get(teamId);
  if (r1) {
    const newPenalty = (r1.time_penalty || 0) - deltaMs; // Negative deltaMs reduces penalty (adds time)
    await db.prepare('UPDATE round1_state SET time_penalty = ? WHERE team_id = ?').run(newPenalty, teamId);
  }
  return getAdminTelemetry();
}

async function triggerReveal(roundNum) {
  if (roundNum === 2) {
    await db.prepare('UPDATE admin_reveals SET round2_revealed = 1 WHERE id = 1').run();
  } else if (roundNum === 3) {
    await db.prepare('UPDATE admin_reveals SET round3_revealed = 1 WHERE id = 1').run();
  }
  return getSessionState();
}

async function resetGame() {
  await db.prepare('DELETE FROM round1_state').run();
  await db.prepare('DELETE FROM round2_state').run();
  await db.prepare('DELETE FROM round3_state').run();
  await db.prepare('UPDATE scores SET round1_score = 0, round2_score = 0, round3_score = 0, total_score = 0').run();
  await db.prepare("UPDATE game_session SET current_phase = 'lobby', is_paused = 0 WHERE id = 1").run();
  await db.prepare('UPDATE admin_reveals SET round2_revealed = 0, round3_revealed = 0 WHERE id = 1').run();
  return getAdminTelemetry();
}

async function generateCSV() {
  const telemetry = await getAdminTelemetry();
  let csv = 'Team ID,Team Name,Status,R1 Progress %,R1 Score,R2 Phase,R2 Active Systems,R2 Score,R3 Audio Plays,R3 Score,Total Score\n';

  telemetry.teams.forEach(t => {
    const activeSys = `"${t.r2.activeSystems.join(', ')}"`;
    csv += `"${t.id}","${t.name}",${t.connected ? 'Online' : 'Offline'},${t.r1.proximity}%,${t.scores.r1},${t.r2.phase},${activeSys},${t.scores.r2},${t.r3.timesPlayed},${t.scores.r3},${t.scores.total}\n`;
  });

  return csv;
}

module.exports = {
  getSessionState,
  setGamePhase,
  toggleGamePause,
  getAdminTelemetry,
  getLeaderboard,
  adjustTeamScore,
  overrideTeamTime,
  triggerReveal,
  resetGame,
  generateCSV
};