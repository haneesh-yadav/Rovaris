const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');
const round1 = require('./round1');
const round2 = require('./round2');
const round3 = require('./round3');
const admin = require('./admin');
const ALLOWED_TEAMS = require('./allowedTeams');

// Lookup map from a normalized (trimmed + lowercased) name to the
// canonical, correctly-cased name from allowedTeams.js — so however
// a team types their name, it gets stored/displayed consistently.
const ALLOWED_TEAMS_MAP = new Map(
  ALLOWED_TEAMS.map((name) => [name.trim().toLowerCase(), name.trim()])
);

// Admin password lives only in the server's environment — never in the
// client bundle. Set ADMIN_PASSWORD in Render's environment variables.
// If it's not set, all admin actions are refused (fail closed, not open).
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.warn(
    '[admin] ADMIN_PASSWORD is not set. Admin login and all admin_* ' +
    'actions will be refused until it is configured.'
  );
}

const app = express();
app.use(cors());
app.use(express.json());

// CSV Export Endpoint — gated behind the same admin password, passed as
// a query param since this is a plain GET link, not a socket event.
app.get('/api/export', async (req, res) => {
  if (!ADMIN_PASSWORD || req.query.token !== ADMIN_PASSWORD) {
    return res.status(401).send('Unauthorized');
  }
  try {
    const csv = await admin.generateCSV();
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
async function broadcastAdminUpdate() {
  // Compute telemetry ONCE, then derive the leaderboard from it in memory
  // instead of recomputing a full per-team, per-round sweep a second time
  // (getLeaderboard used to call getAdminTelemetry() again internally —
  // that doubled every action's DB load for no reason).
  const telemetry = await admin.getAdminTelemetry();
  const leaderboard = await admin.getLeaderboard(telemetry);

  // admin_telemetry_update carries full per-team detail (rover position,
  // hangman words, etc.) that only the admin panel uses — send it only to
  // sockets that have authenticated as admin, not to every player tablet.
  io.to('admins').emit('admin_telemetry_update', telemetry);
  // The leaderboard IS shown on every team's dashboard as well as the
  // public leaderboard page, so this one stays a broadcast to everyone.
  io.emit('leaderboard_update', leaderboard);
}

// Player-facing actions (moves, guesses, toggles, etc.) need to ack the
// acting team fast — broadcastAdminUpdate() re-sweeps every team's full
// state across all 3 rounds, which is too slow to make a player wait on
// before their own move confirms. Fire it after the callback instead of
// awaiting it inline, so a slow admin/leaderboard recompute never delays
// the click that triggered it.
function scheduleAdminUpdate() {
  broadcastAdminUpdate().catch((err) => console.error('broadcastAdminUpdate error:', err));
}

async function broadcastLobbyUpdate() {
  const [teams, session] = await Promise.all([
    db.prepare('SELECT id, name, connected FROM teams ORDER BY created_at ASC').all(),
    admin.getSessionState()
  ]);
  io.emit('lobby_update', { teams, session });
}

async function broadcastPhaseChange(session) {
  io.emit('global_phase_change', session);
  await broadcastAdminUpdate();
  await broadcastLobbyUpdate();
}

// Rejects an admin_* call unless this socket has already passed
// admin_login on this connection. Every admin_* handler below calls
// this first and returns immediately if it fails.
function requireAdmin(socket, callback) {
  if (!socket.isAdmin) {
    if (callback) callback({ success: false, error: 'Admin authorization required.' });
    return false;
  }
  return true;
}

// Gameplay events pass teamId as an argument for backward compatibility
// with the existing client calls, but it is never trusted — the team a
// socket may act as is fixed at team_login time. This stops one team's
// tablet from acting on another team's state by passing a different id.
function ownTeamId(socket, callback) {
  if (!socket.teamId) {
    if (callback) callback({ success: false, error: 'Not logged in.' });
    return null;
  }
  return socket.teamId;
}

io.on('connection', (socket) => {
  // ----------------------------------------------------
  // 1. Team Authentication & Lobby
  // ----------------------------------------------------
  socket.on('admin_login', (password, callback) => {
    if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
      socket.isAdmin = true;
      socket.join('admins'); // scopes admin_telemetry_update to this socket
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ success: false, error: 'Invalid password.' });
    }
  });

  socket.on('team_login', async (teamName, members, callback) => {
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

      // Gate login to the pre-approved roster only. Match is trimmed +
      // case-insensitive, but the canonical (correctly-cased) name from
      // allowedTeams.js is what actually gets used/stored below.
      const canonicalName = ALLOWED_TEAMS_MAP.get(cleanName.toLowerCase());
      if (!canonicalName) {
        return callback({ success: false, error: 'Team name not recognized. Please check with Mission Control.' });
      }

      const cleanMembers = Array.isArray(members)
        ? members.map((m) => String(m || '').trim()).filter(Boolean).slice(0, 10)
        : [];

      // Consistent ID generated from the canonical team name
      const teamId = canonicalName.toLowerCase().replace(/[^a-z0-9]/g, '_');

      let team = await db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
      if (!team) {
        await db.prepare('INSERT INTO teams (id, name, connected, socket_id, members) VALUES (?, ?, 1, ?, ?)')
          .run(teamId, canonicalName, socket.id, JSON.stringify(cleanMembers));
        await db.prepare('INSERT INTO scores (team_id) VALUES (?)').run(teamId);
        team = { id: teamId, name: canonicalName, connected: 1, members: JSON.stringify(cleanMembers) };
      } else {
        // Only overwrite the stored roster if this login actually supplied member names,
        // so re-logging in with a blank field doesn't wipe an existing roster.
        const membersToStore = cleanMembers.length > 0 ? cleanMembers : JSON.parse(team.members || '[]');
        await db.prepare('UPDATE teams SET connected = 1, socket_id = ?, members = ? WHERE id = ?')
          .run(socket.id, JSON.stringify(membersToStore), teamId);
        team.connected = 1;
        team.members = JSON.stringify(membersToStore);
      }

      socket.teamId = teamId;
      socket.join(teamId);

      // Initialize round states if needed
      await round1.getOrInitRound1State(teamId);
      await round2.getOrInitRound2State(teamId);
      await round3.getOrInitRound3State(teamId);

      const session = await admin.getSessionState();
      await broadcastLobbyUpdate();
      await broadcastAdminUpdate();

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

  socket.on('get_lobby_state', async (callback) => {
    try {
      const teams = await db.prepare('SELECT id, name, connected FROM teams ORDER BY created_at ASC').all();
      const session = await admin.getSessionState();
      callback({ success: true, teams, session });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('get_game_session', async (callback) => {
    try {
      callback({ success: true, session: await admin.getSessionState() });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // 2. Round 1 Events
  // ----------------------------------------------------
  socket.on('get_round1_state', async (_teamId, callback) => {
    const teamId = ownTeamId(socket, callback);
    if (!teamId) return;
    try {
      const state = await round1.getClientState(teamId);
      callback({ success: true, state });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('rover_move', async (_teamId, buttonName, callback) => {
    const teamId = ownTeamId(socket, callback);
    if (!teamId) return;
    try {
      const result = await round1.applyMove(teamId, buttonName);
      if (result.success) {
        io.to(teamId).emit('round1_update', result.state);
      }
      callback(result);
      if (result.success) scheduleAdminUpdate();
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('submit_riddle', async (_teamId, answer, callback) => {
    const teamId = ownTeamId(socket, callback);
    if (!teamId) return;
    try {
      const result = await round1.submitRiddle(teamId, answer);
      if (result.success) {
        io.to(teamId).emit('round1_update', result.state);
      }
      callback(result);
      if (result.success) scheduleAdminUpdate();
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // 3. Round 2 Events
  // ----------------------------------------------------
  socket.on('get_round2_state', async (_teamId, callback) => {
    const teamId = ownTeamId(socket, callback);
    if (!teamId) return;
    try {
      const state = await round2.getClientState(teamId);
      callback({ success: true, state });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('toggle_system', async (_teamId, sysId, callback) => {
    const teamId = ownTeamId(socket, callback);
    if (!teamId) return;
    try {
      const result = await round2.toggleSystem(teamId, sysId);
      if (result.success) {
        io.to(teamId).emit('round2_update', result.state);
      }
      callback(result);
      if (result.success) scheduleAdminUpdate();
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('guess_letter', async (_teamId, letter, callback) => {
    const teamId = ownTeamId(socket, callback);
    if (!teamId) return;
    try {
      const result = await round2.guessLetter(teamId, letter);
      if (result.success) {
        io.to(teamId).emit('round2_update', result.state);
      }
      callback(result);
      if (result.success) scheduleAdminUpdate();
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('advance_decision', async (_teamId, callback) => {
    const teamId = ownTeamId(socket, callback);
    if (!teamId) return;
    try {
      const result = await round2.advanceDecision(teamId);
      if (result.success) {
        io.to(teamId).emit('round2_update', result.state);
      }
      callback(result);
      if (result.success) scheduleAdminUpdate();
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // 4. Round 3 Events
  // ----------------------------------------------------
  socket.on('get_round3_state', async (_teamId, callback) => {
    const teamId = ownTeamId(socket, callback);
    if (!teamId) return;
    try {
      const state = await round3.getClientState(teamId);
      callback({ success: true, state });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('play_audio', async (_teamId, callback) => {
    const teamId = ownTeamId(socket, callback);
    if (!teamId) return;
    try {
      const result = await round3.playAudio(teamId);
      if (result.success) {
        io.to(teamId).emit('round3_update', result.state);
      }
      callback(result);
      if (result.success) scheduleAdminUpdate();
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('submit_transmission', async (_teamId, words, callback) => {
    const teamId = ownTeamId(socket, callback);
    if (!teamId) return;
    try {
      const result = await round3.submitTransmission(teamId, words);
      if (result.success) {
        io.to(teamId).emit('round3_update', result.state);
      }
      callback(result);
      if (result.success) scheduleAdminUpdate();
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('start_round_game', async (_teamId, roundNum, callback) => {
    const teamId = ownTeamId(socket, callback);
    if (!teamId) return;
    try {
      const now = Date.now();
      if (roundNum === 1) {
        await round1.startRound1ForTeam(teamId, now);
        io.to(teamId).emit('round1_update', await round1.getClientState(teamId));
      } else if (roundNum === 2) {
        await round2.startRound2ForTeam(teamId, now);
        io.to(teamId).emit('round2_update', await round2.getClientState(teamId));
      } else if (roundNum === 3) {
        await round3.startRound3ForTeam(teamId, now);
        io.to(teamId).emit('round3_update', await round3.getClientState(teamId));
      }
      if (callback) callback({ success: true });
      scheduleAdminUpdate();
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // 5. Admin & Global Control Events
  // ----------------------------------------------------
  socket.on('get_admin_telemetry', async (callback) => {
    if (!requireAdmin(socket, callback)) return;
    try {
      callback({ success: true, telemetry: await admin.getAdminTelemetry() });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('get_leaderboard', async (callback) => {
    try {
      callback({ success: true, leaderboard: await admin.getLeaderboard() });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_set_phase', async (newPhase, callback) => {
    if (!requireAdmin(socket, callback)) return;
    try {
      console.log(`[Admin] Switching global game phase to: ${newPhase}`);
      const session = await admin.setGamePhase(newPhase);

      const teams = await db.prepare('SELECT id FROM teams').all();

      // Timers start strictly when participants enter the actual game after the storyline
      if (newPhase === 'round1') {
        for (const t of teams) {
          io.to(t.id).emit('round1_update', await round1.getClientState(t.id));
        }
      } else if (newPhase === 'round2') {
        for (const t of teams) {
          io.to(t.id).emit('round2_update', await round2.getClientState(t.id));
        }
      } else if (newPhase === 'round3') {
        for (const t of teams) {
          io.to(t.id).emit('round3_update', await round3.getClientState(t.id));
        }
      }

      await broadcastPhaseChange(session);
      if (callback) callback({ success: true, session });
    } catch (err) {
      console.error('admin_set_phase error:', err);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_force_advance', async (teamId, roundNum, callback) => {
    if (!requireAdmin(socket, callback)) return;
    try {
      if (roundNum === 1) {
        await db.prepare('UPDATE round1_state SET completed = 1 WHERE team_id = ?').run(teamId);
        await round1.calculateAndSaveRound1Score(teamId);
        io.to(teamId).emit('round1_update', await round1.getClientState(teamId));
      } else if (roundNum === 2) {
        await db.prepare("UPDATE round2_state SET completed = 1, phase = 'completed' WHERE team_id = ?").run(teamId);
        await round2.calculateAndSaveRound2Score(teamId);
        io.to(teamId).emit('round2_update', await round2.getClientState(teamId));
      } else if (roundNum === 3) {
        await db.prepare('UPDATE round3_state SET completed = 1 WHERE team_id = ?').run(teamId);
        io.to(teamId).emit('round3_update', await round3.getClientState(teamId));
      }
      await broadcastAdminUpdate();
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_toggle_pause', async (callback) => {
    if (!requireAdmin(socket, callback)) return;
    try {
      const session = await admin.toggleGamePause();
      io.emit('global_pause_toggle', session);
      await broadcastAdminUpdate();
      if (callback) callback({ success: true, session });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_adjust_score', async (teamId, roundNum, delta, callback) => {
    if (!requireAdmin(socket, callback)) return;
    try {
      const telemetry = await admin.adjustTeamScore(teamId, roundNum, delta);
      await broadcastAdminUpdate();
      // Notify team if connected
      if (roundNum === 1) io.to(teamId).emit('round1_update', await round1.getClientState(teamId));
      if (roundNum === 2) io.to(teamId).emit('round2_update', await round2.getClientState(teamId));
      if (roundNum === 3) io.to(teamId).emit('round3_update', await round3.getClientState(teamId));
      if (callback) callback({ success: true, telemetry });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_override_time', async (teamId, deltaMin, callback) => {
    if (!requireAdmin(socket, callback)) return;
    try {
      const telemetry = await admin.overrideTeamTime(teamId, deltaMin * 60 * 1000);
      io.to(teamId).emit('round1_update', await round1.getClientState(teamId));
      await broadcastAdminUpdate();
      if (callback) callback({ success: true, telemetry });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_trigger_reveal', async (roundNum, callback) => {
    if (!requireAdmin(socket, callback)) return;
    try {
      const session = await admin.triggerReveal(roundNum);
      io.emit('global_reveal', session.reveals);
      await broadcastAdminUpdate();
      if (callback) callback({ success: true, reveals: session.reveals });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('admin_reset_game', async (callback) => {
    if (!requireAdmin(socket, callback)) return;
    try {
      const telemetry = await admin.resetGame();
      const session = await admin.getSessionState();
      await broadcastPhaseChange(session);
      if (callback) callback({ success: true, telemetry });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Disconnection handler
  socket.on('disconnect', async () => {
    if (socket.teamId) {
      try {
        await db.prepare('UPDATE teams SET connected = 0 WHERE id = ?').run(socket.teamId);
        await broadcastLobbyUpdate();
        await broadcastAdminUpdate();
      } catch (err) {
        console.error('disconnect handler error:', err);
      }
    }
  });
});

// Periodic server-authoritative timer & auto-phase-transition monitor.
// Guarded with `tickInFlight` so a slow database round-trip can never
// cause overlapping ticks to stack up.
let tickInFlight = false;
setInterval(async () => {
  if (tickInFlight) return;
  tickInFlight = true;
  try {
    const session = await admin.getSessionState();
    if (session.isPaused) return;

    if (session.phase === 'round2' || session.phase === 'round2_cinematic') {
      const teams = await db.prepare('SELECT id FROM teams').all();
      let anyChanged = false;
      for (const t of teams) {
        const state = await round2.getOrInitRound2State(t.id);
        const changed = await round2.updatePhaseIfExpired(state);
        if (changed) {
          anyChanged = true;
          io.to(t.id).emit('round2_update', await round2.getClientState(t.id));
        }
      }
      if (anyChanged) {
        await broadcastAdminUpdate();
      }
    }
  } catch (err) {
    console.error('Ticker monitor error:', err);
  } finally {
    tickInFlight = false;
  }
}, 1000);

const PORT = process.env.PORT || 3001;

// Ensure the Postgres schema exists before accepting any connections.
db.initDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`[ROVARIS Mission Control] Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[db] Failed to initialize database — server not started:', err);
    process.exit(1);
  });