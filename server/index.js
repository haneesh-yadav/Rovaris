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

// ===============================
// CSV EXPORT
// ===============================

app.get('/api/export', (req, res) => {
  try {
    const csv = admin.generateCSV();

    res.header('Content-Type', 'text/csv');
    res.attachment('rovaris_scores.csv');

    return res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    return res.status(500).send('Failed to export scores');
  }
});

// ===============================
// CREATE HTTP SERVER
// ===============================

const server = http.createServer(app);

// ===============================
// SOCKET.IO
// ===============================

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ===============================
// SOCKET CONNECTION
// ===============================

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // =====================================
  // TEAM LOGIN
  // =====================================

  socket.on('team_login', (teamCode, callback) => {
    try {
      const stmt = db.prepare(
        'SELECT * FROM teams WHERE id = ?'
      );

      let team = stmt.get(teamCode);

      // Create team if it doesn't exist
      if (!team) {
        const insert = db.prepare(
          'INSERT INTO teams (id, name) VALUES (?, ?)'
        );

        insert.run(
          teamCode,
          `Team ${teamCode}`
        );

        // Create initial score entry
        db.prepare(
          'INSERT INTO scores (team_id) VALUES (?)'
        ).run(teamCode);

        team = {
          id: teamCode,
          name: `Team ${teamCode}`
        };
      }

      // Join Socket.IO room
      socket.join(teamCode);

      console.log(`Team ${teamCode} logged in`);

      callback({
        success: true,
        team
      });

    } catch (error) {
      console.error('Team login error:', error);

      callback({
        success: false,
        error: error.message
      });
    }
  });

  // =====================================
  // ROUND 1
  // =====================================

  socket.on('get_round1_state', (teamId, callback) => {
    try {
      const state = round1.getClientState(teamId);

      callback({
        success: true,
        state
      });

    } catch (error) {
      console.error('Round 1 state error:', error);

      callback({
        success: false,
        error: error.message
      });
    }
  });

  // Rover movement
  socket.on(
    'rover_move',
    (teamId, buttonName, callback) => {

      try {
        const result = round1.applyMove(
          teamId,
          buttonName
        );

        if (result.success) {
          io
            .to(teamId)
            .emit(
              'round1_update',
              result.state
            );
        }

        callback(result);

      } catch (error) {
        console.error('Rover move error:', error);

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Riddle submission
  socket.on(
    'submit_riddle',
    (teamId, answer, callback) => {

      try {
        const result = round1.submitRiddle(
          teamId,
          answer
        );

        if (result.success) {
          io
            .to(teamId)
            .emit(
              'round1_update',
              result.state
            );
        }

        callback(result);

      } catch (error) {
        console.error(
          'Riddle submission error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // =====================================
  // ROUND 2
  // =====================================

  socket.on('get_round2_state', (teamId, callback) => {
    try {
      const state = round2.getClientState(teamId);

      callback({
        success: true,
        state
      });

    } catch (error) {
      console.error('Round 2 state error:', error);

      callback({
        success: false,
        error: error.message
      });
    }
  });

  // Toggle system
  socket.on(
    'toggle_system',
    (teamId, sysId, callback) => {

      try {
        const result = round2.toggleSystem(
          teamId,
          sysId
        );

        if (result.success) {
          io
            .to(teamId)
            .emit(
              'round2_update',
              result.state
            );
        }

        callback(result);

      } catch (error) {
        console.error(
          'Toggle system error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Lock Round 2 phase
  socket.on(
    'lock_round2_phase',
    (teamId, callback) => {

      try {
        const result = round2.lockPhase(teamId);

        if (result.success) {
          io
            .to(teamId)
            .emit(
              'round2_update',
              result.state
            );
        }

        callback(result);

      } catch (error) {
        console.error(
          'Round 2 lock error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Guess letter
  socket.on(
    'guess_letter',
    (teamId, letter, callback) => {

      try {
        const result = round2.guessLetter(
          teamId,
          letter
        );

        if (result.success) {
          io
            .to(teamId)
            .emit(
              'round2_update',
              result.state
            );
        }

        callback(result);

      } catch (error) {
        console.error(
          'Guess letter error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // =====================================
  // ROUND 3
  // =====================================

  socket.on('get_round3_state', (teamId, callback) => {
    try {
      const state = round3.getClientState(teamId);

      callback({
        success: true,
        state
      });

    } catch (error) {
      console.error('Round 3 state error:', error);

      callback({
        success: false,
        error: error.message
      });
    }
  });

  // Play audio
  socket.on(
    'play_audio',
    (teamId, callback) => {

      try {
        const result = round3.playAudio(teamId);

        if (result.success) {
          io
            .to(teamId)
            .emit(
              'round3_update',
              result.state
            );
        }

        callback(result);

      } catch (error) {
        console.error(
          'Play audio error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Submit transmission
  socket.on(
    'submit_transmission',
    (teamId, words, callback) => {

      try {
        const result =
          round3.submitTransmission(
            teamId,
            words
          );

        if (result.success) {
          io
            .to(teamId)
            .emit(
              'round3_update',
              result.state
            );
        }

        callback(result);

      } catch (error) {
        console.error(
          'Transmission submission error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // =====================================
  // ADMIN
  // =====================================

  socket.on(
    'get_admin_state',
    (callback) => {

      try {
        callback({
          success: true,
          state: admin.getAdminState()
        });

      } catch (error) {
        console.error(
          'Admin state error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // =====================================
  // LEADERBOARD
  // =====================================

  socket.on(
    'get_leaderboard_state',
    (callback) => {

      try {
        callback({
          success: true,
          state: admin.getLeaderboardState()
        });

      } catch (error) {
        console.error(
          'Leaderboard state error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // =====================================
  // ADMIN - TIME OVERRIDE
  // =====================================

  socket.on(
    'admin_override_time',
    (teamId, deltaMs, callback) => {

      try {
        admin.overrideTime(
          teamId,
          deltaMs
        );

        io.emit(
          'leaderboard_update',
          admin.getLeaderboardState()
        );

        io.emit(
          'admin_update',
          admin.getAdminState()
        );

        // Notify team
        io
          .to(teamId)
          .emit(
            'round1_update',
            round1.getClientState(teamId)
          );

        callback({
          success: true
        });

      } catch (error) {
        console.error(
          'Admin time override error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // =====================================
  // ADMIN - FORCE ADVANCE
  // =====================================

  socket.on(
    'admin_force_advance',
    (teamId, roundNum, callback) => {

      try {
        admin.forceAdvance(
          teamId,
          roundNum
        );

        io.emit(
          'leaderboard_update',
          admin.getLeaderboardState()
        );

        io.emit(
          'admin_update',
          admin.getAdminState()
        );

        // Notify appropriate team round
        if (roundNum === 1) {
          io
            .to(teamId)
            .emit(
              'round1_update',
              round1.getClientState(teamId)
            );
        }

        if (roundNum === 2) {
          io
            .to(teamId)
            .emit(
              'round2_update',
              round2.getClientState(teamId)
            );
        }

        if (roundNum === 3) {
          io
            .to(teamId)
            .emit(
              'round3_update',
              round3.getClientState(teamId)
            );
        }

        callback({
          success: true
        });

      } catch (error) {
        console.error(
          'Admin force advance error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // =====================================
  // ADMIN - ADJUST SCORE
  // =====================================

  socket.on(
    'admin_adjust_score',
    (teamId, roundNum, delta, callback) => {

      try {
        admin.adjustScore(
          teamId,
          roundNum,
          delta
        );

        io.emit(
          'leaderboard_update',
          admin.getLeaderboardState()
        );

        io.emit(
          'admin_update',
          admin.getAdminState()
        );

        callback({
          success: true
        });

      } catch (error) {
        console.error(
          'Admin score adjustment error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // =====================================
  // ADMIN - REVEAL
  // =====================================

  socket.on(
    'trigger_reveal',
    (roundNum, callback) => {

      try {
        const result =
          admin.triggerReveal(roundNum);

        io.emit(
          'global_reveal',
          result.reveals
        );

        io.emit(
          'leaderboard_update',
          admin.getLeaderboardState()
        );

        io.emit(
          'admin_update',
          admin.getAdminState()
        );

        callback(result);

      } catch (error) {
        console.error(
          'Reveal error:',
          error
        );

        callback({
          success: false,
          error: error.message
        });
      }
    }
  );

  // =====================================
  // DISCONNECT
  // =====================================

  socket.on('disconnect', () => {
    console.log(
      `User disconnected: ${socket.id}`
    );
  });
});

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(
    `ROVARIS Server running on port ${PORT}`
  );
});