import React, { useEffect } from 'react';
import { Crown, Trophy, Sparkles, Medal, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import '../css/components/VictoryScreen.css';

export default function VictoryScreen({ leaderboard = [], onBackToLobby }) {
  useEffect(() => {
    // Launch celebratory confetti burst
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#FFD700', '#00E5FF', '#FF5722', '#00E676']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#FFD700', '#00E5FF', '#FF5722', '#00E676']
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const firstPlace = leaderboard[0];
  const secondPlace = leaderboard[1];
  const thirdPlace = leaderboard[2];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 py-8 select-none">
      {/* Animated Victory Headline */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-mono text-xs font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(255,215,0,0.3)] animate-pulse">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>MARS-EARTH COMMUNICATION RELAY RESTORED</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-cyan-400 text-glow-gold tracking-wide uppercase leading-tight">
          ALL OF YOU RESTORED THE COMMUNICATION TO THE FULLEST!
        </h1>

        <p className="text-sm md:text-base font-rajdhani text-slate-300 max-w-2xl mx-auto">
          Through coordinated navigation, crisis power allocation, and distress cipher decoding, Mission Control has successfully reconnected Aurora-7 with Earth.
        </p>
      </div>

      {/* ========================================================
          INTERACTIVE 3D TOP-3 PODIUM
          ======================================================== */}
      <div className="relative pt-12 pb-6 px-4">
        <div className="grid grid-cols-3 gap-3 md:gap-6 items-end max-w-3xl mx-auto">
          {/* 2nd Place (Silver) */}
          <div className="flex flex-col items-center space-y-3 order-1">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-full bg-slate-300/20 border-2 border-slate-300 flex items-center justify-center text-slate-200 shadow-[0_0_15px_rgba(203,213,225,0.4)]">
                <Medal className="w-6 h-6" />
              </div>
              <div className="font-orbitron font-bold text-sm md:text-lg text-slate-200 truncate max-w-[120px] md:max-w-[180px]">
                {secondPlace ? secondPlace.name : '—'}
              </div>
              <div className="font-mono text-xs text-slate-400 font-bold">
                {secondPlace ? `${secondPlace.scores.total} PTS` : '0 PTS'}
              </div>
            </div>

            {/* Silver Podium Pillar */}
            <div className="w-full h-32 md:h-40 rounded-t-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-t-2 border-x-2 border-slate-400 flex flex-col items-center justify-start pt-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              <span className="font-orbitron font-black text-2xl md:text-4xl text-slate-400">2ND</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">SILVER</span>
            </div>
          </div>

          {/* 1st Place (Gold Champion) */}
          <div className="flex flex-col items-center space-y-3 order-2 -mt-8">
            <div className="text-center space-y-1 relative">
              {/* Crown Badge */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce">
                <Crown className="w-8 h-8 text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_#ffd700]" />
              </div>

              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-[0_0_30px_rgba(255,215,0,0.7)] animate-pulse">
                <Trophy className="w-8 h-8" />
              </div>

              <div className="font-orbitron font-black text-base md:text-xl text-amber-300 truncate max-w-[140px] md:max-w-[200px]">
                {firstPlace ? firstPlace.name : '—'}
              </div>
              <div className="font-mono text-sm text-amber-400 font-bold">
                {firstPlace ? `${firstPlace.scores.total} PTS` : '0 PTS'}
              </div>
            </div>

            {/* Gold Podium Pillar (Tallest & Glowing) */}
            <div className="w-full h-44 md:h-56 rounded-t-2xl bg-gradient-to-b from-amber-600 via-amber-800 to-amber-950 border-t-2 border-x-2 border-amber-300 flex flex-col items-center justify-start pt-4 shadow-[0_0_50px_rgba(255,215,0,0.3)]">
              <span className="font-orbitron font-black text-3xl md:text-5xl text-amber-200 text-glow-gold">1ST</span>
              <span className="text-xs font-mono text-amber-300 uppercase font-bold tracking-widest">CHAMPION</span>
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="flex flex-col items-center space-y-3 order-3">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-full bg-amber-800/20 border-2 border-amber-700 flex items-center justify-center text-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                <Medal className="w-6 h-6" />
              </div>
              <div className="font-orbitron font-bold text-sm md:text-lg text-amber-600 truncate max-w-[120px] md:max-w-[180px]">
                {thirdPlace ? thirdPlace.name : '—'}
              </div>
              <div className="font-mono text-xs text-slate-400 font-bold">
                {thirdPlace ? `${thirdPlace.scores.total} PTS` : '0 PTS'}
              </div>
            </div>

            {/* Bronze Podium Pillar */}
            <div className="w-full h-24 md:h-32 rounded-t-2xl bg-gradient-to-b from-amber-900 via-stone-900 to-neutral-950 border-t-2 border-x-2 border-amber-700 flex flex-col items-center justify-start pt-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              <span className="font-orbitron font-black text-2xl md:text-4xl text-amber-600">3RD</span>
              <span className="text-[10px] font-mono text-amber-700 uppercase">BRONZE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          FULL RANKED LEADERBOARD TABLE (R1, R2, R3, TOTAL)
          ======================================================== */}
      <div className="glass-panel rounded-2xl p-6 border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="text-lg font-bold font-orbitron text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyan-400" />
            <span>FINAL SQUADRON SCOREBOARD BREAKDOWN</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            TOTAL TEAMS: {leaderboard.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-cyan-400 uppercase">
                <th className="py-3 px-3">RANK</th>
                <th className="py-3 px-3">SQUADRON NAME</th>
                <th className="py-3 px-3 text-center">ROUND 1 (MAZE)</th>
                <th className="py-3 px-3 text-center">ROUND 2 (POWER)</th>
                <th className="py-3 px-3 text-center">ROUND 3 (MORSE)</th>
                <th className="py-3 px-3 text-right">CUMULATIVE TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((team, idx) => (
                <tr
                  key={team.id || idx}
                  className={`border-b border-slate-800/60 hover:bg-slate-900/50 transition-colors ${
                    idx === 0 ? 'bg-amber-500/10' : idx === 1 ? 'bg-slate-500/5' : idx === 2 ? 'bg-amber-900/10' : ''
                  }`}
                >
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold font-orbitron text-xs ${
                      idx === 0
                        ? 'bg-amber-400 text-black shadow-[0_0_10px_#ffd700]'
                        : idx === 1
                        ? 'bg-slate-300 text-black'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-bold font-rajdhani text-base text-slate-100">
                    {team.name}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-300">
                    {team.scores.r1} pts
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-300">
                    {team.scores.r2} pts
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-300">
                    {team.scores.r3} pts
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-base font-orbitron text-cyan-300">
                    {team.scores.total} PTS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
