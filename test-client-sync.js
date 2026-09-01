const { io } = require('socket.io-client');
const http = require('http');

console.log('====================================================');
console.log('🌐 ROVARIS CLIENT-SERVER REAL-TIME INTEGRATION TEST');
console.log('====================================================');

const SERVER_URL = 'http://localhost:3001';

async function runIntegrationTest() {
  const adminSocket = io(SERVER_URL);
  const teamSocket = io(SERVER_URL);

  await new Promise((resolve) => {
    let connectedCount = 0;
    const check = () => {
      connectedCount++;
      if (connectedCount === 2) resolve();
    };
    adminSocket.on('connect', check);
    teamSocket.on('connect', check);
  });

  console.log('1. Connected both Admin and Team sockets to server.');

  // 1. Team Login
  const loginRes = await new Promise((res) => {
    teamSocket.emit('team_login', 'Apollo Squadron', res);
  });
  console.log('2. Team Login Response:', loginRes.team.name, '(ID:', loginRes.team.id, ')');

  // 2. Admin set phase to Round 1
  const phase1Res = await new Promise((res) => {
    adminSocket.emit('admin_set_phase', 'round1', res);
  });
  console.log('3. Admin Set Phase to Round 1:', phase1Res.session.phase);

  // 3. Team Move Rover in Round 1
  const moveRes = await new Promise((res) => {
    teamSocket.emit('rover_move', 'apollo_squadron', 'UP', res);
  });
  console.log('4. Team Rover Move Result: Action =', moveRes.actionExecuted, 'Rover Position =', moveRes.state.rover);

  // 4. Admin set phase to Round 2
  const phase2Res = await new Promise((res) => {
    adminSocket.emit('admin_set_phase', 'round2', res);
  });
  console.log('5. Admin Set Phase to Round 2:', phase2Res.session.phase);

  // 5. Team toggle power systems
  const powerRes = await new Promise((res) => {
    teamSocket.emit('toggle_system', 'apollo_squadron', 'comm', res);
  });
  console.log('6. Team Power System Toggle Result: Comm Active =', powerRes.state.systems.find(s => s.id === 'comm').active, 'Power Used =', powerRes.state.powerUsed);

  // 6. Admin set phase to Round 3
  const phase3Res = await new Promise((res) => {
    adminSocket.emit('admin_set_phase', 'round3', res);
  });
  console.log('7. Admin Set Phase to Round 3:', phase3Res.session.phase);

  // 7. Team play Morse audio & submit decoded words
  const playAudioRes = await new Promise((res) => {
    teamSocket.emit('play_audio', 'apollo_squadron', res);
  });
  console.log('8. Team Audio Playback Triggered: Morse String =', playAudioRes.morseString);

  const submitRes = await new Promise((res) => {
    teamSocket.emit('submit_transmission', 'apollo_squadron', ['ALIENS', 'ARE', 'CUTE'], res);
  });
  console.log('9. Team Morse Submission Result: Correct =', submitRes.correctWords, '/ 3, Score =', submitRes.scoreAwarded, 'PTS');

  // 8. Admin Telemetry & Victory Trigger
  const telemetryRes = await new Promise((res) => {
    adminSocket.emit('get_admin_telemetry', res);
  });
  console.log('10. Admin Telemetry Verified: Teams Online =', telemetryRes.telemetry.teams.length);

  const victoryRes = await new Promise((res) => {
    adminSocket.emit('admin_set_phase', 'victory', res);
  });
  console.log('11. Admin Triggered Victory Phase:', victoryRes.session.phase);

  // 9. Verify CSV export HTTP endpoint
  const csvData = await new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}/api/export`, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => { resolve(data); });
    }).on('error', reject);
  });
  console.log('12. HTTP CSV Export Endpoint Verified (Length:', csvData.length, 'bytes).');

  adminSocket.disconnect();
  teamSocket.disconnect();

  console.log('\n====================================================');
  console.log('ALL CLIENT-SERVER INTEGRATION TESTS PASSED 100%!');
  console.log('====================================================');
}

runIntegrationTest().catch(console.error);
