const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'rovaris.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    connected INTEGER DEFAULT 1,
    socket_id TEXT,
    members TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS game_session (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    current_phase TEXT DEFAULT 'lobby',
    is_paused INTEGER DEFAULT 0,
    pause_time INTEGER DEFAULT 0,
    started_at INTEGER,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS round1_state (
    team_id TEXT PRIMARY KEY,
    rover_x INTEGER DEFAULT 1,
    rover_y INTEGER DEFAULT 1,
    facing TEXT DEFAULT 'E',
    furthest_cell INTEGER DEFAULT 0,
    start_time INTEGER,
    time_penalty INTEGER DEFAULT 0,
    riddle_id INTEGER DEFAULT 0,
    riddle_attempts INTEGER DEFAULT 0,
    riddle_solved INTEGER DEFAULT 0,
    failed_all_riddles INTEGER DEFAULT 0,
    checkpoint_reached INTEGER DEFAULT 0,
    checkpoint_passed INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    FOREIGN KEY(team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS round2_state (
    team_id TEXT PRIMARY KEY,
    phase TEXT DEFAULT 'allocation',
    active_systems TEXT DEFAULT '[]',
    baseline_systems TEXT DEFAULT '[]',
    power_budget INTEGER DEFAULT 80,
    hangman_index INTEGER DEFAULT 0,
    hangman_words TEXT DEFAULT '[]',
    guessed_letters TEXT DEFAULT '[]',
    mistakes INTEGER DEFAULT 0,
    hangman_completed INTEGER DEFAULT 0,
    hangman_won INTEGER DEFAULT 0,
    decision_type TEXT,
    phase_start_time INTEGER,
    phase_duration INTEGER DEFAULT 900000,
    completed INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    FOREIGN KEY(team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS round3_state (
    team_id TEXT PRIMARY KEY,
    playbacks_remaining INTEGER DEFAULT 7,
    submission TEXT,
    completed INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    start_time INTEGER,
    FOREIGN KEY(team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS scores (
    team_id TEXT PRIMARY KEY,
    round1_score INTEGER DEFAULT 0,
    round2_score INTEGER DEFAULT 0,
    round3_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS admin_reveals (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    round2_revealed INTEGER DEFAULT 0,
    round3_revealed INTEGER DEFAULT 0
  );
`);

// Migration safeguard for baseline_systems column
try {
  db.exec("ALTER TABLE round2_state ADD COLUMN baseline_systems TEXT DEFAULT '[]'");
} catch (e) {
  // Column already exists
}

// Migration safeguard for teams.members column (existing DBs created before this field existed)
try {
  db.exec("ALTER TABLE teams ADD COLUMN members TEXT DEFAULT '[]'");
} catch (e) {
  // Column already exists
}

// Seed default singleton rows if they don't exist
const sessionCheck = db.prepare('SELECT id FROM game_session WHERE id = 1').get();
if (!sessionCheck) {
  db.prepare('INSERT INTO game_session (id, current_phase, is_paused, started_at) VALUES (1, ?, 0, ?)').run('lobby', Date.now());
}

const revealCheck = db.prepare('SELECT id FROM admin_reveals WHERE id = 1').get();
if (!revealCheck) {
  db.prepare('INSERT INTO admin_reveals (id, round2_revealed, round3_revealed) VALUES (1, 0, 0)').run();
}

module.exports = db;