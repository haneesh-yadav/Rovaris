// ------------------------------------------------------------------
// One-off reset script: wipes every team, its round progress, and its
// scores. Does NOT touch game_session (current phase) or admin_reveals.
//
// Run once from the server/ folder, with the server stopped:
//
//   node resetTeams.js
//
// Requires DATABASE_URL to be set (same as the server itself).
// ------------------------------------------------------------------

const db = require('./db');

const TABLES = ['round1_state', 'round2_state', 'round3_state', 'scores', 'teams'];

(async () => {
  try {
    await db.initDb();

    const before = (await db.prepare('SELECT COUNT(*) AS n FROM teams').get()).n;

    for (const table of TABLES) {
      await db.prepare(`DELETE FROM ${table}`).run();
    }

    console.log(`Cleared ${before} team(s) and all associated round progress / scores.`);
    console.log('Tables reset:', TABLES.join(', '));
  } catch (err) {
    console.error('Reset failed:', err);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
})();