// ------------------------------------------------------------------
// One-off reset script: wipes every team, its round progress, and its
// scores. Does NOT touch game_session (current phase) or admin_reveals.
//
// Run once from the server/ folder, with the server stopped:
//
//   node resetTeams.js
//
// ------------------------------------------------------------------

const db = require('./db');

const TABLES = ['round1_state', 'round2_state', 'round3_state', 'scores', 'teams'];

const before = db.prepare('SELECT COUNT(*) AS n FROM teams').get().n;

const wipe = db.transaction(() => {
  for (const table of TABLES) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
});
wipe();

console.log(`Cleared ${before} team(s) and all associated round progress / scores.`);
console.log('Tables reset:', TABLES.join(', '));