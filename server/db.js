// ------------------------------------------------------------------
// Postgres-backed data layer (migrated from local better-sqlite3).
//
// Local SQLite doesn't survive free-tier hosting (Render/Koyeb wipe
// the filesystem on every redeploy, restart, AND idle spin-down), so
// this now talks to a real Postgres database via DATABASE_URL — e.g.
// a free Neon project — which persists independently of wherever the
// server process itself is running.
//
// To keep round1.js / round2.js / round3.js / admin.js / server.js
// mostly unchanged, this module exposes a `db.prepare(sql).get/all/run`
// shim shaped like better-sqlite3's API. The one real difference:
// get/all/run are now async, so every call site needs `await`.
// ------------------------------------------------------------------

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    '[db] DATABASE_URL is not set. Set it to your Postgres connection ' +
    'string (e.g. a free Neon project) before starting the server.'
  );
}

const isLocalHost = /localhost|127\.0\.0\.1/.test(connectionString || '');

const pool = new Pool({
  connectionString,
  // Hosted free Postgres providers (Neon, Render, Supabase, etc.) require
  // SSL; local dev/test Postgres does not.
  ssl: isLocalHost ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  // A background/idle client error should never crash the whole server.
  console.error('[db] Unexpected error on idle Postgres client:', err.message);
});

// Convert SQLite-style `?` positional placeholders to Postgres's
// `$1, $2, ...`, skipping any `?` that appears inside a quoted string.
function toPgSql(sql) {
  let count = 0;
  let inQuote = false;
  let out = '';
  for (const ch of sql) {
    if (ch === "'") inQuote = !inQuote;
    if (ch === '?' && !inQuote) {
      count += 1;
      out += `$${count}`;
    } else {
      out += ch;
    }
  }
  return out;
}

function prepare(sql) {
  const pgSql = toPgSql(sql);
  return {
    get: async (...params) => {
      const { rows } = await pool.query(pgSql, params);
      return rows[0];
    },
    all: async (...params) => {
      const { rows } = await pool.query(pgSql, params);
      return rows;
    },
    run: async (...params) => {
      const result = await pool.query(pgSql, params);
      return { changes: result.rowCount, rowCount: result.rowCount };
    },
  };
}

// Runs a raw (often multi-statement) SQL string — used for schema setup.
async function exec(sql) {
  await pool.query(sql);
}

// Compatibility shim for better-sqlite3's db.transaction(fn). This does
// NOT provide real multi-statement atomicity (each db.prepare(...) call
// still runs as its own query against the shared pool) — it exists only
// so call sites like resetTeams.js don't need restructuring. The only
// current usage (resetTeams.js) wipes independent tables and is meant
// to be run with the server stopped, so this is a safe simplification.
function transaction(fn) {
  return async (...args) => fn(...args);
}

// ------------------------------------------------------------------
// Schema initialization — call and await this once at server startup
// before accepting any connections.
// ------------------------------------------------------------------
async function initDb() {
  await exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      connected INTEGER DEFAULT 1,
      socket_id TEXT,
      members TEXT DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS game_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_phase TEXT DEFAULT 'lobby',
      is_paused INTEGER DEFAULT 0,
      pause_time INTEGER DEFAULT 0,
      started_at BIGINT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS round1_state (
      team_id TEXT PRIMARY KEY REFERENCES teams(id),
      rover_x INTEGER DEFAULT 1,
      rover_y INTEGER DEFAULT 1,
      facing TEXT DEFAULT 'E',
      furthest_cell INTEGER DEFAULT 0,
      start_time BIGINT,
      time_penalty INTEGER DEFAULT 0,
      riddle_id INTEGER DEFAULT 0,
      riddle_attempts INTEGER DEFAULT 0,
      riddle_solved INTEGER DEFAULT 0,
      failed_all_riddles INTEGER DEFAULT 0,
      checkpoint_reached INTEGER DEFAULT 0,
      checkpoint_passed INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS round2_state (
      team_id TEXT PRIMARY KEY REFERENCES teams(id),
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
      phase_start_time BIGINT,
      phase_duration INTEGER DEFAULT 900000,
      completed INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS round3_state (
      team_id TEXT PRIMARY KEY REFERENCES teams(id),
      playbacks_remaining INTEGER DEFAULT 7,
      submission TEXT,
      completed INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      start_time BIGINT
    );

    CREATE TABLE IF NOT EXISTS scores (
      team_id TEXT PRIMARY KEY REFERENCES teams(id),
      round1_score INTEGER DEFAULT 0,
      round2_score INTEGER DEFAULT 0,
      round3_score INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_reveals (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      round2_revealed INTEGER DEFAULT 0,
      round3_revealed INTEGER DEFAULT 0
    );
  `);

  // Migration safeguards for columns added after initial release —
  // Postgres supports IF NOT EXISTS directly, no try/catch needed.
  await exec("ALTER TABLE round2_state ADD COLUMN IF NOT EXISTS baseline_systems TEXT DEFAULT '[]'");
  await exec("ALTER TABLE teams ADD COLUMN IF NOT EXISTS members TEXT DEFAULT '[]'");

  // Seed default singleton rows if they don't exist yet.
  await exec(`
    INSERT INTO game_session (id, current_phase, is_paused, started_at)
    VALUES (1, 'lobby', 0, ${Date.now()})
    ON CONFLICT (id) DO NOTHING;
  `);
  await exec(`
    INSERT INTO admin_reveals (id, round2_revealed, round3_revealed)
    VALUES (1, 0, 0)
    ON CONFLICT (id) DO NOTHING;
  `);
}

module.exports = { prepare, exec, transaction, initDb, pool };