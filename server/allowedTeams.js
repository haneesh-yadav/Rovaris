// ------------------------------------------------------------------
// Whitelist of team names allowed to log in / register.
//
// Only names listed here (matched trimmed + case-insensitively) can
// authenticate via `team_login`. Anything else is rejected with a
// "team not recognized" error instead of silently creating a new
// team.
//
// Add the final roster here once it's confirmed — one name per line,
// exactly as it should be displayed (this exact casing/spelling is
// what gets stored and shown everywhere: lobby, admin, leaderboard).
// ------------------------------------------------------------------

module.exports = [
  'Rovaris', // test team — remove once the real roster is in
];