import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Shield, Play, Pause, RotateCcw, Download, Plus, Minus, Users, Eye, Radio, Sparkles, Award, AlertTriangle, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import Header from '../components/Header';
import '../css/pages/Admin.css';

export default function Admin() {
  const { socket, connected } = useSocket();
  const [telemetry, setTelemetry] = useState({ session: { phase: 'lobby', isPaused: false, reveals: {} }, teams: [] });
  const [confirmReset, setConfirmReset] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('get_admin_telemetry', (res) => {
      if (res && res.success) setTelemetry(res.telemetry);
    });

    socket.on('admin_telemetry_update', (data) => {
      if (data) setTelemetry(data);
    });

    return () => {
      socket.off('admin_telemetry_update');
    };
  }, [socket]);

  const showNotification = (msg) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 4000);
  };

  const handleSetPhase = (newPhase, phaseLabel) => {
    if (!socket) {
      alert('Socket connection offline. Please reload or check server.');
      return;
    }
    socket.emit('admin_set_phase', newPhase, (res) => {
      if (res && res.success) {
        showNotification(`⚡ Successfully switched game phase to: ${phaseLabel || newPhase.toUpperCase()}`);
        if (res.session) {
          setTelemetry((prev) => ({ ...prev, session: res.session }));
        }
      } else {
        alert(res?.error || 'Failed to switch phase');
      }
    });
  };

  const handleTogglePause = () => {
    if (!socket) return;
    socket.emit('admin_toggle_pause', (res) => {
      if (res && res.session) {
        showNotification(res.session.isPaused ? '⏸️ All missions PAUSED' : '▶️ All missions RESUMED');
        setTelemetry((prev) => ({ ...prev, session: res.session }));
      }
    });
  };

  const handleAdjustScore = (teamId, roundNum, delta) => {
    if (!socket) return;
    socket.emit('admin_adjust_score', teamId, roundNum, delta, (res) => {
      showNotification(`Score adjusted (${delta > 0 ? '+' : ''}${delta} pts on Round ${roundNum})`);
    });
  };

  const handleOverrideTime = (teamId, deltaMinutes) => {
    if (!socket) return;
    socket.emit('admin_override_time', teamId, deltaMinutes, (res) => {
      showNotification(`Time adjusted (${deltaMinutes > 0 ? '+' : ''}${deltaMinutes} mins on Round 1)`);
    });
  };

  const handleForceAdvance = (teamId, roundNum) => {
    if (!socket) return;
    if (window.confirm(`Force mark Round ${roundNum} completed for this team?`)) {
      socket.emit('admin_force_advance', teamId, roundNum, (res) => {
        showNotification(`Team completed Round ${roundNum}`);
      });
    }
  };

  const handleResetGame = () => {
    if (!socket) return;
    socket.emit('admin_reset_game', () => {
      setConfirmReset(false);
      showNotification('🔄 Full mission data reset to Lobby');
    });
  };

  const session = telemetry.session || { phase: 'lobby', isPaused: false, reveals: {} };
  const teams = telemetry.teams || [];

  return (
    <div className="min-h-screen w-full mission-light-bg text-[#14140F] px-4 pt-20 pb-6 select-none overflow-x-hidden font-sans">
      <Header />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Notification Toast */}
        {actionNotice && (
          <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-white border border-orange-200 text-[#14140F] font-mono text-xs flex items-center gap-2.5 shadow-[0_10px_30px_-8px_rgba(20,20,15,0.25)] animate-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* ========================================================
            ADMIN HEADER
            ======================================================== */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl panel-light-gold">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-amber-700 tracking-widest uppercase">
                DIRECTOR COMMAND CONSOLE
              </div>
              <h1 className="text-2xl font-black font-rajdhani text-[#14140F] tracking-tight">
                ROVARIS MISSION CONTROL ADMIN
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status Badge */}
            <div className="px-3.5 py-2 rounded-xl bg-[#16160F] border border-black/10 text-xs font-mono flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[#f3f3f0]">{connected ? 'SERVER SYNC ONLINE' : 'DISCONNECTED'}</span>
            </div>

            {/* CSV Export */}
            <a
              href="http://localhost:3001/api/export"
              download
              className="px-4 py-2.5 rounded-xl btn-mars-ghost text-xs flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT CSV</span>
            </a>

            {/* Global Pause Button */}
            <button
              onClick={handleTogglePause}
              className={`px-5 py-2.5 rounded-xl font-rajdhani font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                session.isPaused
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
              }`}
            >
              {session.isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              <span>{session.isPaused ? 'RESUME MISSIONS' : 'PAUSE MISSIONS'}</span>
            </button>

            {/* Reset Mission Button */}
            <button
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET GAME</span>
            </button>
          </div>
        </header>

        {/* ========================================================
            GLOBAL MISSION PHASE MASTER CONTROLLER
            ======================================================== */}
        <div className="panel-light rounded-2xl p-6 border-orange-200 space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-bold font-orbitron text-[#14140F]">
                GLOBAL PHASE CONTROLLER (CLICK TO TRIGGER ACROSS ALL SCREENS)
              </h2>
            </div>
            <div className="text-xs font-mono text-orange-600">
              ACTIVE STAGE: <strong className="uppercase font-orbitron text-amber-600">{session.phase}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            {/* 1. START MAIN STORYLINE */}
            <button
              onClick={() => handleSetPhase('intro_cinematic', 'MAIN STORYLINE')}
              className={`p-4 rounded-xl font-rajdhani font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border ${
                session.phase === 'intro_cinematic' || session.phase === 'main_storyline'
                  ? 'bg-[#16160F] text-white border-[#16160F] scale-105'
                  : 'bg-white border-black/10 text-[#4a4a44] hover:bg-black/[0.03] hover:border-black/20'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="tracking-wider">1. START MAIN STORYLINE</span>
              <span className="text-[10px] font-mono opacity-80 font-normal">Intro Storyline Reveal</span>
            </button>

            {/* 2. START ROUND 1 */}
            <button
              onClick={() => handleSetPhase('round1', 'ROUND 1 (MAZE & NAVIGATION)')}
              className={`p-4 rounded-xl font-rajdhani font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border ${
                session.phase === 'round1' || session.phase === 'round1_cinematic'
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-orange-400 scale-105'
                  : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-400'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span className="tracking-wider">2. START ROUND 1</span>
              <span className="text-[10px] font-mono opacity-80 font-normal">Rover Maze & 35-min Timer</span>
            </button>

            {/* 3. START ROUND 2 */}
            <button
              onClick={() => handleSetPhase('round2', 'ROUND 2 (SOLAR STORM POWER ALLOCATION)')}
              className={`p-4 rounded-xl font-rajdhani font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border ${
                session.phase === 'round2' || session.phase === 'round2_cinematic'
                  ? 'bg-[#B5391F] text-white border-[#B5391F] scale-105'
                  : 'bg-white border-[#B5391F]/25 text-[#B5391F] hover:bg-[#B5391F]/5 hover:border-[#B5391F]/50'
              }`}
            >
              <Radio className="w-5 h-5" />
              <span className="tracking-wider">3. START ROUND 2</span>
              <span className="text-[10px] font-mono opacity-80 font-normal">Power Systems & Hangman</span>
            </button>

            {/* 4. START ROUND 3 */}
            <button
              onClick={() => handleSetPhase('round3', 'ROUND 3 (DISTRESS SIGNAL & MORSE)')}
              className={`p-4 rounded-xl font-rajdhani font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border ${
                session.phase === 'round3' || session.phase === 'round3_cinematic'
                  ? 'bg-amber-500 text-white border-amber-500 scale-105'
                  : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-400'
              }`}
            >
              <Radio className="w-5 h-5" />
              <span className="tracking-wider">4. START ROUND 3</span>
              <span className="text-[10px] font-mono opacity-80 font-normal">Morse Audio & Decoder</span>
            </button>

            {/* 5. TRIGGER FINAL VICTORY */}
            <button
              onClick={() => handleSetPhase('victory', 'FINAL VICTORY & PODIUM')}
              className={`p-4 rounded-xl font-rajdhani font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border ${
                session.phase === 'victory'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-600 text-white border-orange-400 scale-105'
                  : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="tracking-wider">5. TRIGGER VICTORY</span>
              <span className="text-[10px] font-mono opacity-80 font-normal">3D Podium & Final Ranks</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-[#6b6b64] pt-2 border-t border-black/10">
            <div>
              💡 Clicking any stage button immediately transitions all connected player terminals and leaderboards.
            </div>
            <button
              onClick={() => handleSetPhase('lobby', 'WAITING ARENA')}
              className="px-3 py-1 rounded bg-black/[0.05] hover:bg-black/10 text-[#4a4a44] text-[11px] cursor-pointer"
            >
              Return to Waiting Arena
            </button>
          </div>
        </div>

        {/* ========================================================
            ROUND COMPLETION MONITOR & QUICK TRANSITION CONTROLS
            ======================================================== */}
        <div className="panel-light rounded-2xl p-6 border-black/10 space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold font-orbitron text-[#14140F]">
                SQUADRON COMPLETION MONITOR & STAGE TRANSITIONS
              </h2>
            </div>
            <div className="text-xs font-mono text-[#6b6b64]">
              TOTAL REGISTERED SQUADRONS: <strong className="text-orange-600 font-bold">{teams.length}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Round 1 Completion Card */}
            {(() => {
              const r1Done = teams.filter((t) => t.r1.completed).length;
              const r1All = teams.length > 0 && r1Done === teams.length;
              const pct = teams.length > 0 ? Math.round((r1Done / teams.length) * 100) : 0;
              return (
                <div className={`p-4 rounded-xl border transition-all ${
                  r1All ? 'bg-emerald-50 border-emerald-300' : 'bg-black/[0.02] border-black/10'
                }`}>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-orange-600 font-bold uppercase">ROUND 1 • MAZE</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r1All ? 'bg-emerald-500 text-white' : 'bg-black/[0.05] text-[#4a4a44]'
                    }`}>
                      {r1Done} / {teams.length} COMPLETED ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-black/[0.05] rounded-full h-2 overflow-hidden mb-3">
                    <div className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <button
                    onClick={() => handleSetPhase('round2', 'ROUND 2 (SOLAR STORM POWER ALLOCATION)')}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      r1All
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white scale-[1.02]'
                        : 'bg-black/[0.05] hover:bg-black/10 text-[#4a4a44]'
                    }`}
                  >
                    <span>ENABLE ROUND 2 ➔</span>
                  </button>
                </div>
              );
            })()}

            {/* Round 2 Completion Card */}
            {(() => {
              const r2Done = teams.filter((t) => t.r2.completed).length;
              const r2All = teams.length > 0 && r2Done === teams.length;
              const pct = teams.length > 0 ? Math.round((r2Done / teams.length) * 100) : 0;
              return (
                <div className={`p-4 rounded-xl border transition-all ${
                  r2All ? 'bg-emerald-50 border-emerald-300' : 'bg-black/[0.02] border-black/10'
                }`}>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-amber-600 font-bold uppercase">ROUND 2 • POWER CRISIS</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r2All ? 'bg-emerald-500 text-white' : 'bg-black/[0.05] text-[#4a4a44]'
                    }`}>
                      {r2Done} / {teams.length} COMPLETED ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-black/[0.05] rounded-full h-2 overflow-hidden mb-3">
                    <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <button
                    onClick={() => handleSetPhase('round3', 'ROUND 3 (DISTRESS SIGNAL & MORSE)')}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      r2All
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white scale-[1.02]'
                        : 'bg-black/[0.05] hover:bg-black/10 text-[#4a4a44]'
                    }`}
                  >
                    <span>ENABLE ROUND 3 ➔</span>
                  </button>
                </div>
              );
            })()}

            {/* Round 3 Completion Card */}
            {(() => {
              const r3Done = teams.filter((t) => t.r3.completed).length;
              const r3All = teams.length > 0 && r3Done === teams.length;
              const pct = teams.length > 0 ? Math.round((r3Done / teams.length) * 100) : 0;
              return (
                <div className={`p-4 rounded-xl border transition-all ${
                  r3All ? 'bg-emerald-50 border-emerald-300' : 'bg-black/[0.02] border-black/10'
                }`}>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-[#B5391F] font-bold uppercase">ROUND 3 • MORSE SIGNAL</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r3All ? 'bg-emerald-500 text-white' : 'bg-black/[0.05] text-[#4a4a44]'
                    }`}>
                      {r3Done} / {teams.length} SUBMITTED ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-black/[0.05] rounded-full h-2 overflow-hidden mb-3">
                    <div className="bg-gradient-to-r from-orange-400 to-emerald-500 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <button
                    onClick={() => handleSetPhase('victory', 'FINAL VICTORY & PODIUM')}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      r3All
                        ? 'bg-gradient-to-r from-amber-400 to-orange-600 hover:from-amber-300 hover:to-orange-500 text-white scale-[1.02]'
                        : 'bg-black/[0.05] hover:bg-black/10 text-[#4a4a44]'
                    }`}
                  >
                    <span>TRIGGER FINAL VICTORY ➔</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ========================================================
            LIVE TELEMETRY SCOREBOARD & SQUADRON OVERRIDE TABLE
            ======================================================== */}
        <div className="panel-light rounded-2xl p-6 border-black/10 space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold font-orbitron text-[#14140F]">
                LIVE SQUADRON TELEMETRY & CONTROLS
              </h2>
            </div>
            <div className="text-xs font-mono text-[#6b6b64]">
              CONNECTED SQUADRONS: <strong className="text-orange-600">{teams.filter((t) => t.connected).length}</strong> / {teams.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-black/10 text-[#6b6b64] uppercase">
                  <th className="py-3 px-2">STATUS</th>
                  <th className="py-3 px-2">SQUADRON</th>
                  <th className="py-3 px-2">ROUND 1 (MAZE)</th>
                  <th className="py-3 px-2">ROUND 2 (POWER)</th>
                  <th className="py-3 px-2">ROUND 3 (MORSE)</th>
                  <th className="py-3 px-2 text-center">SCORES (R1 / R2 / R3)</th>
                  <th className="py-3 px-2 text-center">TOTAL</th>
                  <th className="py-3 px-2 text-right">DIRECT OVERRIDES</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#8a8a82]">
                      No squadrons connected. Open team client at <a href="/" className="text-orange-500 underline">http://localhost:5173/</a> to join.
                    </td>
                  </tr>
                ) : (
                  teams.map((t) => (
                    <tr key={t.id} className="border-b border-black/10 hover:bg-black/[0.04]">
                      {/* Connection status */}
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] ${
                          t.connected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-black/[0.05] text-[#8a8a82]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                          {t.connected ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>

                      {/* Squadron name */}
                      <td className="py-3 px-2 font-bold font-rajdhani text-sm text-[#14140F]">
                        {t.name}
                      </td>

                      {/* Round 1 telemetry & completion status */}
                      <td className="py-3 px-2 text-[#4a4a44]">
                        {t.r1.completed ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>COMPLETED (100%)</span>
                          </div>
                        ) : t.r1.checkpointReached && !t.r1.checkpointPassed ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-700 font-bold">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>CHECKPOINT RIDDLE</span>
                          </div>
                        ) : (
                          <div>
                            <div>POS: X:{t.r1.x} Y:{t.r1.y} ({t.r1.facing})</div>
                            <div className="text-[10px] text-orange-500">{t.r1.proximity}% Traversed</div>
                          </div>
                        )}
                      </td>

                      {/* Round 2 telemetry & completion status */}
                      <td className="py-3 px-2 text-[#4a4a44]">
                        {t.r2.completed ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>COMPLETED</span>
                          </div>
                        ) : t.r2.phase.startsWith('hangman') ? (
                          <div>
                            <div className="text-amber-600 font-bold">🔤 HANGMAN {t.r2.hangmanGame}/3</div>
                            <div className="text-[10px] text-rose-400">{t.r2.hangmanMistakes}/5 Strikes</div>
                          </div>
                        ) : (
                          <div>
                            <div>PHASE: {t.r2.phase}</div>
                            <div className="text-[10px] text-orange-500">
                              {t.r2.activeSystems.length} Systems ({t.r2.powerUsed}W)
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Round 3 telemetry & completion status */}
                      <td className="py-3 px-2 text-[#4a4a44]">
                        {t.r3.completed ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>SUBMITTED</span>
                          </div>
                        ) : (
                          <div>
                            <div>PLAYS: {t.r3.timesPlayed}/7</div>
                            <div className="text-[10px] text-orange-600">DECODING IN PROGRESS</div>
                          </div>
                        )}
                      </td>

                      {/* Scores breakdown (Internal admin view) */}
                      <td className="py-3 px-2 text-center text-[#25251c]">
                        <span className="text-orange-600 font-bold">{t.scores.r1}</span> /{' '}
                        <span className="text-amber-600 font-bold">{t.scores.r2}</span> /{' '}
                        <span className="text-orange-500 font-bold">{t.scores.r3}</span>
                      </td>

                      {/* Total score */}
                      <td className="py-3 px-2 text-center font-bold text-sm font-orbitron text-amber-600">
                        {t.scores.total}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 text-right">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            onClick={() => handleAdjustScore(t.id, 1, 5)}
                            className="px-2 py-1 rounded bg-black/[0.05] hover:bg-black/10 text-[10px] font-mono text-orange-600 cursor-pointer"
                            title="Add +5 pts to Round 1"
                          >
                            +5 R1
                          </button>
                          <button
                            onClick={() => handleAdjustScore(t.id, 2, 5)}
                            className="px-2 py-1 rounded bg-black/[0.05] hover:bg-black/10 text-[10px] font-mono text-amber-600 cursor-pointer"
                            title="Add +5 pts to Round 2"
                          >
                            +5 R2
                          </button>
                          <button
                            onClick={() => handleAdjustScore(t.id, 3, 5)}
                            className="px-2 py-1 rounded bg-black/[0.05] hover:bg-black/10 text-[10px] font-mono text-emerald-600 cursor-pointer"
                            title="Add +5 pts to Round 3"
                          >
                            +5 R3
                          </button>
                          <button
                            onClick={() => handleOverrideTime(t.id, 5)}
                            className="px-2 py-1 rounded bg-orange-50 hover:bg-orange-100 border border-orange-300 text-[10px] font-mono text-orange-700 cursor-pointer"
                            title="Grant +5 minutes to Round 1 timer"
                          >
                            +5m R1
                          </button>
                          <button
                            onClick={() => handleForceAdvance(t.id, 1)}
                            className="px-2 py-1 rounded bg-black/[0.05] hover:bg-black/10 text-[10px] font-mono text-[#4a4a44] cursor-pointer"
                            title="Skip Round 1 for team"
                          >
                            Skip R1
                          </button>
                          <button
                            onClick={() => handleForceAdvance(t.id, 2)}
                            className="px-2 py-1 rounded bg-black/[0.05] hover:bg-black/10 text-[10px] font-mono text-[#4a4a44] cursor-pointer"
                            title="Skip Round 2 for team"
                          >
                            Skip R2
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================
            LIVE RANKED LEADERBOARD (UNLOCKED ADMIN VIEW THE ENTIRE TIME)
            ======================================================== */}
        <div className="panel-light rounded-2xl p-6 border-amber-200 space-y-4 shadow-[0_0_30px_rgba(255,193,7,0.1)]">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold font-orbitron text-[#14140F]">
                LIVE RANKED SQUADRON LEADERBOARD (ADMIN VIEW)
              </h2>
            </div>
            <div className="text-xs font-mono text-amber-600">
              REAL-TIME SCORE ACCUMULATION • VISIBLE TO ADMIN ONLY DURING MATCH
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-black/10 text-[#6b6b64] uppercase">
                  <th className="py-3 px-3">RANK</th>
                  <th className="py-3 px-3">SQUADRON</th>
                  <th className="py-3 px-3 text-center">ROUND 1 (MAZE)</th>
                  <th className="py-3 px-3 text-center">ROUND 2 (POWER)</th>
                  <th className="py-3 px-3 text-center">ROUND 3 (MORSE)</th>
                  <th className="py-3 px-3 text-right">TOTAL POINTS</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#8a8a82]">
                      Standby for team registrations...
                    </td>
                  </tr>
                ) : (
                  [...teams]
                    .sort((a, b) => (b.scores.total || 0) - (a.scores.total || 0))
                    .map((t, idx) => (
                      <tr
                        key={t.id}
                        className={`border-b border-black/10 hover:bg-black/[0.04] transition-colors ${
                          idx === 0
                            ? 'bg-amber-500/10'
                            : idx === 1
                            ? 'bg-slate-500/5'
                            : idx === 2
                            ? 'bg-amber-900/10'
                            : ''
                        }`}
                      >
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold font-orbitron text-xs ${
                            idx === 0
                              ? 'bg-amber-400 text-black shadow-[0_0_10px_#ffd700]'
                              : idx === 1
                              ? 'bg-slate-300 text-black'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-black/[0.05] text-[#4a4a44]'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-bold font-rajdhani text-sm text-[#14140F]">
                          {t.name}
                        </td>
                        <td className="py-3.5 px-3 text-center text-orange-600 font-bold">
                          {t.scores.r1} pts
                        </td>
                        <td className="py-3.5 px-3 text-center text-amber-600 font-bold">
                          {t.scores.r2} pts
                        </td>
                        <td className="py-3.5 px-3 text-center text-orange-600 font-bold">
                          {t.scores.r3} pts
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-sm font-orbitron text-amber-600">
                          {t.scores.total} PTS
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {confirmReset && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full border border-rose-200 space-y-6 shadow-[0_20px_60px_-15px_rgba(20,20,15,0.4)]">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-8 h-8" />
                <h3 className="text-xl font-black font-rajdhani text-[#14140F]">CONFIRM GAME RESET</h3>
              </div>
              <p className="text-sm font-rajdhani text-[#4a4a44] leading-relaxed">
                This will reset all team coordinates, power selections, Hangman states, audio playback quotas, and scores to zero, returning all clients to the Lobby.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-4 py-2 rounded-xl bg-black/[0.05] hover:bg-black/10 text-xs font-mono cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleResetGame}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold cursor-pointer"
                >
                  CONFIRM & RESET
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}