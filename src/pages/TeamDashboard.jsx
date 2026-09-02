import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { ShieldAlert, Trophy, Compass, HelpCircle, CheckCircle2, Clock, AlertTriangle, ArrowRight, Zap, Sparkles } from 'lucide-react';

import MazeViewer from '../components/MazeViewer';
import Controls from '../components/Controls';
import DinoRunner from '../components/DinoRunner';
import SystemAllocation from '../components/SystemAllocation';
import Hangman from '../components/Hangman';
import MorseDecoder from '../components/MorseDecoder';
import CinematicStoryline from '../components/CinematicStoryline';
import VictoryScreen from '../components/VictoryScreen';
import Header from '../components/Header';
import { ROUND_INSTRUCTIONS } from '../data/roundInstructions';
import '../css/pages/TeamDashboard.css';
import Footer from '../components/Footer';


export default function TeamDashboard() {
  const { team, socket, connected, gameSession } = useSocket();
  const navigate = useNavigate();

  // Round states
  const [r1State, setR1State] = useState(null);
  const [r2State, setR2State] = useState(null);
  const [r3State, setR3State] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Riddle state
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [riddleSubmitting, setRiddleSubmitting] = useState(false);
  const [riddleFeedback, setRiddleFeedback] = useState(null);

  // Storyline state: track which storylines this team has completed
  const [seenCinematics, setSeenCinematics] = useState({
    intro: false,
    round1: false,
    round2: false,
    round3: false
  });

  // Fetch and subscribe to socket state updates
  useEffect(() => {
    if (!team || !socket) return;

    const fetchAllStates = () => {
      socket.emit('get_round1_state', team.id, (res) => {
        if (res && res.success) setR1State(res.state);
      });
      socket.emit('get_round2_state', team.id, (res) => {
        if (res && res.success) setR2State(res.state);
      });
      socket.emit('get_round3_state', team.id, (res) => {
        if (res && res.success) setR3State(res.state);
      });
      socket.emit('get_leaderboard', (res) => {
        if (res && res.success) setLeaderboard(res.leaderboard.leaderboard || []);
      });
    };

    fetchAllStates();

    socket.on('round1_update', setR1State);
    socket.on('round2_update', setR2State);
    socket.on('round3_update', setR3State);
    socket.on('leaderboard_update', (data) => {
      if (data && data.leaderboard) setLeaderboard(data.leaderboard);
    });

    return () => {
      socket.off('round1_update');
      socket.off('round2_update');
      socket.off('round3_update');
      socket.off('leaderboard_update');
    };
  }, [team, socket]);

  // When global game phase changes, refetch states
  useEffect(() => {
    if (team && socket) {
      socket.emit('get_round1_state', team.id, (res) => {
        if (res && res.success) setR1State(res.state);
      });
      socket.emit('get_round2_state', team.id, (res) => {
        if (res && res.success) setR2State(res.state);
      });
      socket.emit('get_round3_state', team.id, (res) => {
        if (res && res.success) setR3State(res.state);
      });
      socket.emit('get_leaderboard', (res) => {
        if (res && res.success) setLeaderboard(res.leaderboard.leaderboard || []);
      });
    }
  }, [gameSession.phase, team, socket]);

  // Client-side smooth timer decrement tick every 1000ms
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setR1State((prev) => (prev && prev.timeRemaining > 0 ? { ...prev, timeRemaining: Math.max(0, prev.timeRemaining - 1000) } : prev));
      setR2State((prev) => {
        if (!prev) return prev;
        if (prev.timeRemaining > 0) {
          const nextTime = Math.max(0, prev.timeRemaining - 1000);
          if (nextTime === 0 && socket && team) {
            // Immediately sync with server when round 2 phase timer hits 0 to launch Hangman instantly
            socket.emit('get_round2_state', team.id, (res) => {
              if (res && res.success && res.state) setR2State(res.state);
            });
          }
          return { ...prev, timeRemaining: nextTime };
        }
        return prev;
      });
      setR3State((prev) => (prev && prev.timeRemaining > 0 ? { ...prev, timeRemaining: Math.max(0, prev.timeRemaining - 1000) } : prev));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [socket, team]);

  // Round 1 Handlers
  const handleRoverMove = (buttonName) => {
    if (!socket || !team) return;
    socket.emit('rover_move', team.id, buttonName, (res) => {
      if (res && res.state) setR1State(res.state);
    });
  };

  const handleRiddleSubmit = (e) => {
    e.preventDefault();
    if (!riddleAnswer.trim() || riddleSubmitting) return;

    setRiddleSubmitting(true);
    socket.emit('submit_riddle', team.id, riddleAnswer.trim(), (res) => {
      setRiddleSubmitting(false);
      if (res && res.success) {
        setRiddleFeedback({
          correct: res.correct,
          attemptsRemaining: res.attemptsRemaining,
          failedAll: res.failedAll
        });
        setRiddleAnswer('');
        if (res.state) setR1State(res.state);
      }
    });
  };

  // Round 2 Handlers
  const handleToggleSystem = (sysId) => {
    if (!socket || !team) return;
    socket.emit('toggle_system', team.id, sysId, (res) => {
      if (res && res.state) setR2State(res.state);
      if (res && !res.success && res.error) {
        alert(res.error);
      }
    });
  };

  const handleGuessLetter = (letter) => {
    if (!socket || !team) return;
    socket.emit('guess_letter', team.id, letter, (res) => {
      if (res && res.state) setR2State(res.state);
    });
  };

  const handleAdvanceDecision = () => {
    if (!socket || !team) return;
    socket.emit('advance_decision', team.id, (res) => {
      if (res && res.state) setR2State(res.state);
    });
  };

  // Round 3 Handlers
  const handlePlayAudio = (playCallback) => {
    if (!socket || !team) return;
    socket.emit('play_audio', team.id, (res) => {
      if (res && res.success) {
        if (res.state) setR3State(res.state);
        playCallback(res.morseString);
      } else {
        alert(res?.error || 'Cannot play audio.');
      }
    });
  };

  const handleSubmitTransmission = (words) => {
    if (!socket || !team) return;
    socket.emit('submit_transmission', team.id, words, (res) => {
      if (res && res.success && res.state) {
        setR3State(res.state);
      }
    });
  };

  const formatTimer = (ms) => {
    if (ms === null || ms === undefined) return '00:00';
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!team) {
    return <Navigate to="/" />;
  }

  const handleEnterRound = (roundNum) => {
    if (socket && team) {
      socket.emit('start_round_game', team.id, roundNum, () => {
        if (roundNum === 1) socket.emit('get_round1_state', team.id, (r) => r?.state && setR1State(r.state));
        if (roundNum === 2) socket.emit('get_round2_state', team.id, (r) => r?.state && setR2State(r.state));
        if (roundNum === 3) socket.emit('get_round3_state', team.id, (r) => r?.state && setR3State(r.state));
      });
    }
  };

  // Handle Global Storyline Cinematic Injections
  const currentPhase = gameSession.phase;

  if (currentPhase === 'intro_cinematic' && !seenCinematics.intro) {
    return (
      <CinematicStoryline
        type="intro"
        teamName={team.name}
        onComplete={() => setSeenCinematics((prev) => ({ ...prev, intro: true }))}
      />
    );
  }

  if ((currentPhase === 'round1' || currentPhase === 'round1_cinematic') && !seenCinematics.round1) {
    return (
      <CinematicStoryline
        type="round1"
        teamName={team.name}
        onComplete={() => {
          setSeenCinematics((prev) => ({ ...prev, round1: true }));
          handleEnterRound(1);
        }}
      />
    );
  }

  if ((currentPhase === 'round2' || currentPhase === 'round2_cinematic') && !seenCinematics.round2) {
    return (
      <CinematicStoryline
        type="round2"
        teamName={team.name}
        onComplete={() => {
          setSeenCinematics((prev) => ({ ...prev, round2: true }));
          handleEnterRound(2);
        }}
      />
    );
  }

  if ((currentPhase === 'round3' || currentPhase === 'round3_cinematic') && !seenCinematics.round3) {
    return (
      <CinematicStoryline
        type="round3"
        teamName={team.name}
        onComplete={() => {
          setSeenCinematics((prev) => ({ ...prev, round3: true }));
          handleEnterRound(3);
        }}
      />
    );
  }

  if (currentPhase === 'victory') {
    return (
      <div className="min-h-screen w-full mission-light-bg text-[#14140F] px-4 pt-20 pb-8">
        <Header />
        <VictoryScreen leaderboard={leaderboard} />
      </div>
    );
  }

  // Determine active round based strictly on Admin's server phase
  let activeRoundNumber = 1;
  if (currentPhase === 'round2' || currentPhase === 'round2_cinematic') activeRoundNumber = 2;
  else if (currentPhase === 'round3' || currentPhase === 'round3_cinematic') activeRoundNumber = 3;

  const totalCumulativeScore = (r1State?.score || 0) + (r2State?.score || 0) + (r3State?.score || 0);

  const roundLabels = {
    1: 'ROUND 1 • MAZE',
    2: 'ROUND 2 • POWER',
    3: 'ROUND 3 • MORSE',
  };
  const roundInstructions = ROUND_INSTRUCTIONS;
  const activeTimeRemaining =
    activeRoundNumber === 1 ? r1State?.timeRemaining
    : activeRoundNumber === 2 ? r2State?.timeRemaining
    : r3State?.timeRemaining;

  return (
    <div className="min-h-screen w-full mission-light-bg text-[#14140F] px-4 pt-28 pb-6 select-none overflow-x-hidden font-sans">
      <Header
        roundLabel={roundLabels[activeRoundNumber]}
        timeRemaining={activeTimeRemaining != null ? formatTimer(activeTimeRemaining) : null}
        instructions={roundInstructions[activeRoundNumber]}
        teamName={team.name}
      />

      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Global Pause Alert */}
        {gameSession.isPaused && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>MISSION TEMPORARILY PAUSED BY MISSION CONTROL. TIMERS AND INPUTS FROZEN.</span>
          </div>
        )}

        {/* ========================================================
            ROUND 1: ROVER CONTROL FAILURE (CANVAS MAZE & DINO RUNNER)
            ======================================================== */}
        {activeRoundNumber === 1 && r1State && (
          <div className="space-y-5">
            {/* Check if Completed -> Show Exact Message & Dino Runner */}
            {r1State.completed ? (
              <DinoRunner
                title="ROUND 1 OBJECTIVE COMPLETED!"
                message="Your squadron successfully traversed the corrupted Martian maze and connected with the relay dish. Your round 1 score is locked. Enjoy the Martian Dino Runner while the other teams finish this round!"
                scoreText={null}
                statusText="ROUND 1 OBJECTIVE COMPLETED • SCORE LOCKED UNTIL FINAL DEBRIEF"
              />
            ) : (
              /* Main Round 1 Arena: Maze Viewer (Left) & Controls Panel (Right) */
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start mt-6">
                {/* Canvas Maze Viewer (Wide Cols 8-9) */}
                <div className="xl:col-span-8 2xl:col-span-9 space-y-3">
                  <div className="rounded-2xl bg-[#302f27] p-3 md:p-4 border border-white/10 shadow-[0_25px_60px_-25px_rgba(0,0,0,0.55)]">
                    <div className="flex items-center justify-between px-1.5 pb-3">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#E2530A]" />
                        <span className="text-sm font-black text-white tracking-tight">MARTIAN TERRAIN SCANNER</span>
                      </div>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#E2530A] uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E2530A] animate-pulse" />
                        Live Feed
                      </span>
                    </div>
                    <MazeViewer
                      map={r1State.map}
                      rover={r1State.rover}
                    />
                  </div>
                </div>

                {/* Control Deck & Instructions (Cols 4-3) */}
                <div className="xl:col-span-4 2xl:col-span-3 space-y-3">
                  <Controls
                    onMove={handleRoverMove}
                    facing={r1State.rover.facing}
                    disabled={gameSession.isPaused || r1State.completed || (r1State.checkpointReached && !r1State.checkpointPassed)}
                    proximityPercent={r1State.proximityPercent}
                    coordinates={{ x: r1State.rover.x, y: r1State.rover.y }}
                  />
                </div>
              </div>
            )}

            {/* Mid-Mission Riddle Checkpoint Modal */}
            {r1State.checkpointReached && !r1State.checkpointPassed && r1State.riddle && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                <div className="panel-light-warm rounded-2xl p-6 md:p-8 max-w-lg w-full border-orange-500/60 shadow-[0_0_50px_rgba(255,87,34,0.3)] space-y-6 animate-in zoom-in-95">
                  <div className="flex items-center gap-3 border-b border-orange-500/30 pb-3">
                    <HelpCircle className="w-6 h-6 text-amber-600 animate-pulse" />
                    <div>
                      <div className="text-[10px] font-mono text-orange-700 uppercase">
                        MID-MISSION CHECKPOINT (50% MARK)
                      </div>
                      <h3 className="text-lg font-black font-rajdhani text-[#14140F]">
                        {r1State.riddle.title}
                      </h3>
                    </div>
                  </div>

                  {/* Riddle Prompt */}
                  <div className="p-4 rounded-xl bg-[#16160F] border border-black/10 text-sm md:text-base font-rajdhani font-semibold text-amber-300 leading-relaxed">
                    "{r1State.riddle.question}"
                  </div>

                  {/* Attempts & Warning Banner */}
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between text-[#4a4a44]">
                      <span>ATTEMPTS REMAINING:</span>
                      <strong className="text-amber-600">{3 - r1State.riddle.attempts} / 3</strong>
                    </div>
                    <div className="text-rose-600 text-[11px]">
                      ⚠️ 5-minute penalty applied to timer for each failed attempt. Failing 3 attempts unlocks path but caps completion score to 45 pts.
                    </div>
                  </div>

                  {/* Riddle Input Form */}
                  <form onSubmit={handleRiddleSubmit} className="space-y-4">
                    <input
                      type="text"
                      value={riddleAnswer}
                      onChange={(e) => setRiddleAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      autoFocus
                      disabled={riddleSubmitting}
                      className="w-full bg-white border border-orange-500/40 rounded-xl px-4 py-3 text-[#14140F] placeholder-[#9a9a90] focus:outline-none focus:border-orange-400 text-base font-mono"
                    />

                    {riddleFeedback && !riddleFeedback.correct && (
                      <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg font-mono text-center">
                        Incorrect answer. 5 minutes deducted! ({riddleFeedback.attemptsRemaining} attempts left)
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={riddleSubmitting || !riddleAnswer.trim()}
                      className="w-full py-3.5 rounded-xl btn-mars-solid text-base font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>{riddleSubmitting ? 'VERIFYING...' : 'SUBMIT ANSWER & UNLOCK ROVER'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            ROUND 2: SOLAR STORM EMERGENCY (POWER ALLOCATION & HANGMAN)
            ======================================================== */}
        {activeRoundNumber === 2 && r2State && (
          <div className="space-y-6">
            {/* Check if Completed -> Show Exact Message & Dino Runner */}
            {r2State.completed ? (
              <DinoRunner
                title="ROUND 2 OBJECTIVE COMPLETED!"
                message="Your squadron successfully stabilized the rover's emergency power systems and survived the solar storm. Your Round 2 score is locked. Enjoy the Martian Dino Runner while the other teams finish this round!"
                scoreText={null}
                statusText="ROUND 2 OBJECTIVE COMPLETED • SCORE LOCKED UNTIL FINAL DEBRIEF"
              />
            ) : (
              <>
                {/* Active Hangman Challenge (Visible during Hangman & Decision Phases) */}
                {(r2State.phase.startsWith('hangman_') || r2State.phase.startsWith('decision_')) && (
                  <Hangman
                    gameNumber={r2State.hangman.gameNumber}
                    totalGames={r2State.hangman.totalGames}
                    maskedWord={r2State.hangman.maskedWord}
                    solutionWord={r2State.hangman.solutionWord}
                    guessedLetters={r2State.hangman.guessedLetters}
                    mistakes={r2State.hangman.mistakes}
                    maxMistakes={r2State.hangman.maxMistakes}
                    completed={r2State.hangman.completed || r2State.phase.startsWith('decision_')}
                    won={r2State.hangman.won}
                    onGuessLetter={handleGuessLetter}
                    disabled={gameSession.isPaused || r2State.phase.startsWith('decision_')}
                  />
                )}

                {/* 7 Systems Power Allocation Matrix */}
                <SystemAllocation
                  systems={r2State.systems}
                  powerBudget={r2State.powerBudget}
                  powerUsed={r2State.powerUsed}
                  powerRemaining={r2State.powerRemaining}
                  onToggleSystem={handleToggleSystem}
                  onAdvanceDecision={handleAdvanceDecision}
                  phase={r2State.phase}
                  decisionType={r2State.decisionType}
                  disabled={gameSession.isPaused || r2State.completed}
                />
              </>
            )}
          </div>
        )}

        {/* ========================================================
            ROUND 3: DISTRESS SIGNAL RECOVERY (MORSE AUDIO ENGINE)
            ======================================================== */}
        {activeRoundNumber === 3 && r3State && (
          <div className="space-y-6">
            {/* Check if Completed or Timer Expired -> Show Exact Message & Dino Runner */}
            {r3State.completed || r3State.timeRemaining <= 0 ? (
              <DinoRunner
                title="ROUND 3 OBJECTIVE COMPLETED!"
                message="Your squadron successfully decoded the distress transmission and restored contact with the stranded astronaut. Your Round 3 score is locked. Enjoy the Martian Dino Runner while the other teams finish this round!"
                scoreText={null}
                statusText="ROUND 3 OBJECTIVE COMPLETED • SCORE LOCKED UNTIL FINAL DEBRIEF"
              />
            ) : (
              /* Morse Code Decoder UI Component */
              <MorseDecoder
                timesPlayed={r3State.timesPlayed}
                submission={r3State.submission}
                completed={r3State.completed}
                score={r3State.score}
                onPlayAudio={handlePlayAudio}
                onSubmitWords={handleSubmitTransmission}
                disabled={gameSession.isPaused}
              />
            )}
          </div>
        )}
      </div>
    
      {/* ============================ FOOTER ============================ */}
      <div className="relative -mx-4 -mb-6 mt-12 w-[calc(100%+2rem)]">
        <Footer />
      </div>
    </div>
  );
}