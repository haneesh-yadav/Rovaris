const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');
const round1 = require('./round1');
const round2 = require('./round2');
const round3 = require('./round3');
const admin = require('./admin');

const app = express();
app.use(cors());
app.use(express.json());

// CSV Export Endpoint
app.get('/api/export', (req, res) => {
  try {
    const csv = admin.generateCSV();
    res.header('Content-Type', 'text/csv');
    res.attachment(`rovaris_scores_${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).send('Error generating export');
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Broadcast helpers
function broadcastAdminUpdate() {
  io.emit('admin_telemetry_update', admin.getAdminTelemetry());
  io.emit('leaderboard_update', admin.getLeaderboard());
}

function broadcastLobbyUpdate() {
  const teams = db.prepare('SELECT id, name, connected FROM teams ORDER BY created_at ASC').all();
  const session = admin.getSessionState();
  io.emit('lobby_update', { teams, session });
}

function broadcastPhaseChange(session) {
  io.emit('global_phase_change', session);
  broadcastAdminUpdate();
  broadcastLobbyUpdate();
}

io.on('connection', (socket) => {
  // ----------------------------------------------------
  // 1. Team Authentication & Lobby
  // ----------------------------------------------------
  socket.on('team_login', (teamName, members, callback) => {
    try {
      // Backward-compatible signature: allow team_login(teamName, callback)
      if (typeof members === 'function') {
        callback = members;
        members = [];
      }

      const cleanName = (teamName || '').trim();
      if (!cleanName) {
        return callback({ success: false, error: 'Team name cannot be empty.' });
      }

      const cleanMembers = Array.isArray(members)
        ? members.map((m) => String(m || '').trim()).filter(Boolean).slice(0, 10)
        : [];

      // Consistent ID generated from lowercased team name
      const teamId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');

      let team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
      if (!team) {
        db.prepare('INSERT INTO teams (id, name, connected, socket_id, members) VALUES (?, ?, 1, ?, ?)')
          .run(teamId, cleanName, socket.id, JSON.stringify(cleanMembers));
        db.prepare('INSERT INTO scores (team_id) VALUES (?)').run(teamId);
        team = { id: teamId, name: cleanName, connected: 1, members: JSON.stringify(cleanMembers) };
      } else {
        // Only overwrite the stored roster if this login actually supplied member names,
        // so re-logging in with a blank field doesn't wipe an existing roster.
        const membersToStore = cleanMembers.length > 0 ? cleanMembers : JSON.parse(team.members || '[]');
        db.prepare('UPDATE teams SET connected = 1, socket_id = ?, members = ? WHERE id = ?')
          .run(socket.id, JSON.stringify(membersToStore), teamId);
        team.connected = 1;
        team.members = JSON.stringify(membersToStore);
      }

      socket.teamId = teamId;
      socket.join(teamId);

      // Initialize round states if needed
      round1.getOrInitRound1State(teamId);
      round2.getOrInitRound2State(teamId);
      round3.getOrInitRound3State(teamId);

      const session = admin.getSessionState();
      broadcastLobbyUpdate();
      broadcastAdminUpdate();

      callback({
        success: true,
        team: { id: team.id, name: team.name, members: JSON.parse(team.members || '[]') },
        session
      });
    } catch (err) {
      console.error('team_login error:', err);
      callback({ success: false, error: err.message });
    }
  });

  socket.on('get_lobby_state', (callback) => {
    try {
      const teams = db.prepare('SELECT id, name, connected FROM teams ORDER BY created_at ASC').all();
      const session = admin.getSessionState();
      callback({ success: true, teams, session });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('get_game_session', (callback) => {
    try {
      callback({ success: true, session: admin.getSessionState() });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // 2. Round 1 Events
  // ----------------------------------------------------
  socket.on('get_round1_state', (teamId, callback) => {
    try {
      const state = round1.getClientState(teamId);
      callback({ success: true, state });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('rover_move', (teamId, buttonName, callback) => {
    try {
      const result = round1.applyMove(teamId, buttonName);
      if (result.success) {
        io.to(teamId).emit('round1_update', result.state);
        broadcastAdminUpdate();
      }
      callback(result);
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('submit_riddle', (teamId, answer, callback) => {
    try {
      const result = round1.submitRiddle(teamId, answer);
      if (result.success) {
        io.to(teamId).emit('round1_update', result.state);
        broadcastAdminUpdate();
      }
      callback(result);
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // 3. Round 2 Events
  // ----------------------------------------------------
  socket.on('get_round2_state', (teamId, callback) => {
    try {
      const state = round2.getClientState(teamId);
      callback({ success: true, state });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('toggle_system', (teamId, sysId, callback) => {
    try {
      const result = round2.toggleSystem(teamId, sysId);
      if (result.success) {
        io.to(teamId).emit('round2_update', result.state);
        broadcastAdminUpdate();
      }
      callback(result);
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('guess_letter', (teamId, letter, callback) => {
    try {
      const result = round2.guessLetter(teamId, letter);
      if (result.success) {
        io.to(teamId).emit('round2_update', result.state);
        broadcastAdminUpdate();
      }
      callback(result);
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('advance_decision', (teamId, callback) => {
    try {
      const result = round2.advanceDecision(teamId);
      if (result.success) {
        io.to(teamId).emit('round2_update', result.state);
        broadcastAdminUpdate();
      }
      callback(result);
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // 4. Round 3 Events
  // ----------------------------------------------------
  socket.on('get_round3_state', (teamId, callback) => {
    try {
      const state = round3.getClientState(teamId);
      callback({ success: true, state });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('play_audio', (teamId, callback) => {
    try {
      const result = round3.playAudio(teamId);
      if (result.success) {
        io.to(teamId).emit('round3_update', result.state);
        broadcastAdminUpdate();
      }
      callback(result);
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('submit_transmission', (teamId, words, callback) => {
    try {
      const result = round3.submitTransmission(teamId, words);
      if (result.success) {
        io.to(teamId).emit('round3_update', result.state);
        broadcastAdminUpdate();
      }
      callback(result);
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('start_round_game', (teamId, roundNum, callback) => {
    try {
      const now = Date.now();
      if (roundNum === 1) {
        round1.startRound1ForTeam(teamId, now);
        io.to(teamId).emit('round1_update', round1.getClientState(teamId));
      } else if (roundNum === 2) {
        round2.startRound2ForTeam(teamId, now);
        io.to(teamId).emit('round2_update', round2.getClientState(teamId));
      } else if (roundNum === 3) {
        round3.startRound3ForTeam(teamId, now);
        io.to(teamId).emit('round3_update', round3.getClientState(teamId));
      }
      broadcastAdminUpdate();
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // 5. Admin & Global Control Events
  // ----------------------------------------------------
  socket.on('get_admin_telemetry', (callback) => {
    try {
      callback({ success: true, telemetry: admin.getAdminTelemetry() });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('get_leaderboard', (callback) => {
    try {
      callback({ success: true, leaderboard: admin.getLeaderboard() });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_set_phase', (newPhase, callback) => {
    try {
      console.log(`[Admin] Switching global game phase to: ${newPhase}`);
      const session = admin.setGamePhase(newPhase);

      const teams = db.prepare('SELECT id FROM teams').all();

      // Timers start strictly when participants enter the actual game after the storyline
      if (newPhase === 'round1') {
        teams.forEach(t => {
          io.to(t.id).emit('round1_update', round1.getClientState(t.id));
        });
      } else if (newPhase === 'round2') {
        teams.forEach(t => {
          io.to(t.id).emit('round2_update', round2.getClientState(t.id));
        });
      } else if (newPhase === 'round3') {
        teams.forEach(t => {
          io.to(t.id).emit('round3_update', round3.getClientState(t.id));
        });
      }

      broadcastPhaseChange(session);
      if (callback) callback({ success: true, session });
    } catch (err) {
      console.error('admin_set_phase error:', err);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_force_advance', (teamId, roundNum, callback) => {
    try {
      if (roundNum === 1) {
        db.prepare('UPDATE round1_state SET completed = 1 WHERE team_id = ?').run(teamId);
        round1.calculateAndSaveRound1Score(teamId);
        io.to(teamId).emit('round1_update', round1.getClientState(teamId));
      } else if (roundNum === 2) {
        db.prepare("UPDATE round2_state SET completed = 1, phase = 'completed' WHERE team_id = ?").run(teamId);
        round2.calculateAndSaveRound2Score(teamId);
        io.to(teamId).emit('round2_update', round2.getClientState(teamId));
      } else if (roundNum === 3) {
        db.prepare('UPDATE round3_state SET completed = 1 WHERE team_id = ?').run(teamId);
        io.to(teamId).emit('round3_update', round3.getClientState(teamId));
      }
      broadcastAdminUpdate();
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_toggle_pause', (callback) => {
    try {
      const session = admin.toggleGamePause();
      io.emit('global_pause_toggle', session);
      broadcastAdminUpdate();
      if (callback) callback({ success: true, session });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_adjust_score', (teamId, roundNum, delta, callback) => {
    try {
      const telemetry = admin.adjustTeamScore(teamId, roundNum, delta);
      broadcastAdminUpdate();
      // Notify team if connected
      if (roundNum === 1) io.to(teamId).emit('round1_update', round1.getClientState(teamId));
      if (roundNum === 2) io.to(teamId).emit('round2_update', round2.getClientState(teamId));
      if (roundNum === 3) io.to(teamId).emit('round3_update', round3.getClientState(teamId));
      if (callback) callback({ success: true, telemetry });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_override_time', (teamId, deltaMin, callback) => {
    try {
      const telemetry = admin.overrideTeamTime(teamId, deltaMin * 60 * 1000);
      io.to(teamId).emit('round1_update', round1.getClientState(teamId));
      broadcastAdminUpdate();
      if (callback) callback({ success: true, telemetry });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_trigger_reveal', (roundNum, callback) => {
    try {
      const session = admin.triggerReveal(roundNum);
      io.emit('global_reveal', session.reveals);
      broadcastAdminUpdate();
      if (callback) callback({ success: true, reveals: session.reveals });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_reset_game', (callback) => {
    try {
      const telemetry = admin.resetGame();
      const session = admin.getSessionState();
      broadcastPhaseChange(session);
      if (callback) callback({ success: true, telemetry });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    if (socket.teamId) {
      db.prepare('UPDATE teams SET connected = 0 WHERE id = ?').run(socket.teamId);
      broadcastLobbyUpdate();
      broadcastAdminUpdate();
    }
  });
});

// Periodic server-authoritative timer & auto-phase-transition monitor
setInterval(() => {
  try {
    const session = admin.getSessionState();
    if (session.isPaused) return;

    if (session.phase === 'round2' || session.phase === 'round2_cinematic') {
      const teams = db.prepare('SELECT id FROM teams').all();
      let anyChanged = false;
      for (const t of teams) {
        const state = round2.getOrInitRound2State(t.id);
        const changed = round2.updatePhaseIfExpired(state);
        if (changed) {
          anyChanged = true;
          io.to(t.id).emit('round2_update', round2.getClientState(t.id));
        }
      }
      if (anyChanged) {
        broadcastAdminUpdate();
      }
    }
  } catch (err) {
    console.error('Ticker monitor error:', err);
  }
}, 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[ROVARIS Mission Control] Server listening on http://localhost:${PORT}`);
});