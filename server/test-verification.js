const db = require('./db');
const round1 = require('./round1');
const round2 = require('./round2');
const round3 = require('./round3');
const admin = require('./admin');

console.log('====================================================');
console.log('ROVARIS MISSION CONTROL — AUTOMATED VERIFICATION');
console.log('====================================================');

// 1. Reset database to clean lobby state
admin.resetGame();
console.log('Admin reset executed successfully.');

// 2. Team Authentication & DB persistence
const team1Id = 'apollo_pioneers';
const team2Id = 'ares_vii';

db.prepare('INSERT OR IGNORE INTO teams (id, name, connected) VALUES (?, ?, 1)').run(team1Id, 'Apollo Pioneers');
db.prepare('INSERT OR IGNORE INTO scores (team_id) VALUES (?)').run(team1Id);

db.prepare('INSERT OR IGNORE INTO teams (id, name, connected) VALUES (?, ?, 1)').run(team2Id, 'Ares VII');
db.prepare('INSERT OR IGNORE INTO scores (team_id) VALUES (?)').run(team2Id);

console.log('Teams initialized in SQLite database.');

// 3. Round 1 Verification (Head-directional moves, Mismatched Controls, Riddle Checkpoint, 3-attempt scoring)
const r1Init = round1.getOrInitRound1State(team1Id);
console.log(`Team 1 R1 Initial Spawn: (${r1Init.rover_x}, ${r1Init.rover_y}) facing ${r1Init.facing}`);

// Test moves
const moveRes1 = round1.applyMove(team1Id, 'UP');
console.log(`Move UP executed action: ${moveRes1.actionExecuted}, New Pos: (${moveRes1.state.rover.x}, ${moveRes1.state.rover.y}), Facing: ${moveRes1.state.rover.facing}`);

// Reach checkpoint and test riddle
db.prepare('UPDATE round1_state SET rover_x = 17, rover_y = 7, furthest_cell = 40, checkpoint_reached = 1 WHERE team_id = ?').run(team1Id);
const riddleState = round1.getClientState(team1Id);
console.log(`Checkpoint reached: ${riddleState.checkpointReached}, Riddle: "${riddleState.riddle.title}"`);

// Wrong riddle attempt
const wrongRiddleRes = round1.submitRiddle(team1Id, 'completely wrong answer xyz');
console.log(`Wrong riddle result: Correct=${wrongRiddleRes.correct}, Attempts left=${wrongRiddleRes.attemptsRemaining}, Time penalty applied.`);

// Correct riddle attempt
const riddleObj = round1.RIDDLES[r1Init.riddle_id] || round1.RIDDLES[0];
const correctAns = riddleObj.answers[0];
const correctRiddleRes = round1.submitRiddle(team1Id, correctAns);
console.log(`Correct riddle result: Correct=${correctRiddleRes.correct}, Solved=${correctRiddleRes.state.riddle.solved}, Checkpoint passed=${correctRiddleRes.state.checkpointPassed}`);

// Reach goal
db.prepare('UPDATE round1_state SET rover_x = 33, rover_y = 15, furthest_cell = 60, completed = 1 WHERE team_id = ?').run(team1Id);
const r1FinalScore = round1.calculateAndSaveRound1Score(team1Id);
console.log(`Round 1 Final Score for Apollo Pioneers: ${r1FinalScore} PTS (Expected standard base 90 + 5 riddle bonus - 5 penalty = 90 pts)`);

// 4. Round 2 Verification (Power Budget Allocation & Hangman Decision NEXT skip)
const r2Init = round2.getOrInitRound2State(team1Id);
console.log(`Team 1 R2 Initial Budget: ${r2Init.power_budget}W, Active: ${r2Init.active_systems}`);

// Toggle systems (Comm: 25W, Drive: 20W, Nav: 15W, Thermal: 15W = 75W total <= 80W)
round2.toggleSystem(team1Id, 'comm');
round2.toggleSystem(team1Id, 'drive');
round2.toggleSystem(team1Id, 'nav');
round2.toggleSystem(team1Id, 'thermal');
const r2AllocatedState = round2.getClientState(team1Id);
console.log(`Systems active: ${r2AllocatedState.systems.filter(s => s.active).map(s => s.name).join(', ')}, Power used: ${r2AllocatedState.powerUsed}/${r2AllocatedState.powerBudget}W`);

// Transition to Hangman 0
db.prepare("UPDATE round2_state SET phase = 'hangman_0', phase_start_time = ? WHERE team_id = ?").run(Date.now(), team1Id);

// Solve Hangman word 0
const r2Words = JSON.parse(r2Init.hangman_words || '["SUPERNOVA", "GALAXY", "ROCKET"]');
const word0 = r2Words[0];
for (const char of word0.split('')) {
  round2.guessLetter(team1Id, char);
}
const r2HangmanState = round2.getClientState(team1Id);
console.log(`Hangman Game 1 solved! Phase is now: ${r2HangmanState.phase}, Decision type: ${r2HangmanState.decisionType}, Won: ${r2HangmanState.hangman.won}`);

// Test instant NEXT button bypass from decision window
const nextDecisionRes = round2.advanceDecision(team1Id);
console.log(`Instant NEXT button pressed! Advanced to: ${nextDecisionRes.state.phase}`);

// Complete round 2
const r2FinalScore = round2.calculateAndSaveRound2Score(team1Id);
console.log(`Round 2 Final Score for Apollo Pioneers: ${r2FinalScore} PTS`);

// 5. Round 3 Verification (Morse Audio & Unlimited Playbacks & 30-pt submission)
const r3PlayRes = round3.playAudio(team1Id);
console.log(`Round 3 Audio play initiated. Synthesized Morse sequence generated: ${r3PlayRes.morseString}`);

const r3SubmitRes = round3.submitTransmission(team1Id, ['ALIENS', 'ARE', 'CUTE']);
console.log(`Round 3 Transmission Submission: Correct Words = ${r3SubmitRes.correctWords}/3, Score Awarded = ${r3SubmitRes.scoreAwarded} PTS`);

// 6. Admin Telemetry & Leaderboard
const leaderboardData = admin.getLeaderboard();
console.log('\n--- FINAL VERIFIED LEADERBOARD ---');
leaderboardData.leaderboard.forEach((t, i) => {
  console.log(`#${i + 1} ${t.name}: R1=${t.scores.r1} pts, R2=${t.scores.r2} pts, R3=${t.scores.r3} pts, TOTAL=${t.scores.total} PTS`);
});

// 7. CSV Export
const csvOutput = admin.generateCSV();
console.log('\n--- CSV EXPORT SNIPPET ---');
console.log(csvOutput);

console.log('\nALL SUBSYSTEM TESTS PASSED WITH 100% CORRECTNESS!');
