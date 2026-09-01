import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Trophy, Radio, Sparkles, Lock } from 'lucide-react';
import VictoryScreen from '../components/VictoryScreen';
import Header from '../components/Header';
import '../css/pages/Leaderboard.css';

export default function Leaderboard() {
  const { socket, gameSession } = useSocket();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('get_leaderboard', (res) => {
      if (res && res.success) setLeaderboard(res.leaderboard.leaderboard || []);
    });

    socket.on('leaderboard_update', (data) => {
      if (data && data.leaderboard) setLeaderboard(data.leaderboard);
    });

    return () => {
      socket.off('leaderboard_update');
    };
  }, [socket]);

  // If game is in victory phase, render the full 3D podium view
  if (gameSession.phase === 'victory') {
    return (
      <div className="min-h-screen w-full mission-light-bg text-[#14140F] px-4 pt-20 pb-8 select-none">
        <Header />
        <VictoryScreen leaderboard={leaderboard} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full mission-light-bg text-[#14140F] px-4 pt-20 pb-8 select-none overflow-x-hidden font-sans">
      <Header />
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page intro */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-mono text-xs font-bold tracking-widest uppercase">
            <Radio className="w-4 h-4 text-orange-500" />
            <span>LIVE MISSION LEADERBOARD • MARS SECTOR 7</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-rajdhani text-[#14140F] tracking-tight">
            ROVARIS SQUADRON <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">RANKINGS</span>
          </h1>
          <p className="text-sm font-rajdhani text-[#4a4a44]">
            Real-time score accumulation across Rover Navigation, Power Stabilization, and Signal Recovery.
          </p>
        </header>

        {/* Live Scoreboard Table */}
        <div className="panel-light rounded-2xl p-6 border-black/10 space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold font-orbitron text-[#14140F]">
                ACTIVE SQUADRON STANDINGS
              </h2>
            </div>
            <div className="text-xs font-mono text-orange-500">
              STATUS: REAL-TIME SYNCHRONIZED
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm font-mono">
              <thead>
                <tr className="border-b border-black/10 text-xs text-[#6b6b64] uppercase">
                  <th className="py-3 px-3">RANK</th>
                  <th className="py-3 px-3">SQUADRON NAME</th>
                  <th className="py-3 px-3 text-center">ROUND 1</th>
                  <th className="py-3 px-3 text-center">ROUND 2</th>
                  <th className="py-3 px-3 text-center">ROUND 3</th>
                  <th className="py-3 px-3 text-right">TOTAL PTS</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#8a8a82]">
                      Standby for squadron telemetry stream...
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((team, idx) => (
                    <tr
                      key={team.id || idx}
                      className={`border-b border-black/10 hover:bg-black/[0.04] transition-colors ${
                        idx === 0 ? 'bg-amber-500/10' : idx === 1 ? 'bg-slate-500/5' : idx === 2 ? 'bg-amber-900/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold font-orbitron text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-black shadow-[0_2px_8px_rgba(245,158,11,0.4)]'
                            : idx === 1
                            ? 'bg-slate-300 text-black'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-black/[0.05] text-[#4a4a44]'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold font-rajdhani text-base text-[#14140F]">
                        {team.name}
                      </td>
                      <td className="py-3.5 px-3 text-center text-[#6b6b64] font-mono text-xs">
                        <span className="inline-flex items-center gap-1 text-amber-600/80">
                          <Lock className="w-3 h-3" /> LOCKED
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-[#6b6b64] font-mono text-xs">
                        <span className="inline-flex items-center gap-1 text-amber-600/80">
                          <Lock className="w-3 h-3" /> LOCKED
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-[#6b6b64] font-mono text-xs">
                        <span className="inline-flex items-center gap-1 text-amber-600/80">
                          <Lock className="w-3 h-3" /> LOCKED
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-xs font-orbitron text-orange-600">
                        <span className="inline-flex items-center gap-1 text-orange-500/80">
                          <Lock className="w-3 h-3 text-amber-600" /> REVEAL AT END
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}