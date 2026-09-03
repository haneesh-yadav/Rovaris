import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Trophy, Radio, Crown, Wifi, WifiOff, Medal, Shield, Lock } from 'lucide-react';
import VictoryScreen from '../components/VictoryScreen';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/pages/Leaderboard.css';


// Deterministic warm-palette avatar color per squadron, so the same team
// always renders the same accent instead of colors reshuffling on refresh.
const AVATAR_PALETTE = [
  ['#E2530A', '#A83E14'],
  ['#D98A3D', '#8C5321'],
  ['#C1653A', '#7A3A1D'],
  ['#E08A4B', '#9B5321'],
  ['#B85C2E', '#6E361A'],
];
const avatarColors = (name = '') => {
  const idx = Math.abs([...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
};
const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

const Avatar = ({ name, size = 'w-12 h-12 text-base' }) => {
  const [from, to] = avatarColors(name);
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.25)] ring-4 ring-white`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {initials(name)}
    </div>
  );
};

// Rank tier — decorative badge shown per row (mirrors the reference
// leaderboard's "Legendary Trainer" / "Pro Trainer" tags).
const tierFor = (idx) => {
  if (idx < 3) return { label: 'Mission Elite', icon: Trophy, cls: 'text-amber-600 bg-amber-50 border-amber-200' };
  if (idx < 6) return { label: 'Active Squadron', icon: Medal, cls: 'text-slate-500 bg-slate-100 border-slate-200' };
  return { label: 'Squadron', icon: Shield, cls: 'text-[#8a8a80] bg-black/[0.03] border-black/5' };
};

const PODIUM_STEPS = [
  { rank: 2, height: 'h-24', number: 'text-[#B8B2A0]' },
  { rank: 1, height: 'h-32', number: 'text-amber-500' },
  { rank: 3, height: 'h-[4.5rem]', number: 'text-[#B8B2A0]' },
];

export default function Leaderboard() {
  const { socket, gameSession, team } = useSocket();
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

  const currentTeamId = team ? team.id : null;

  // If game is in victory phase, render the full 3D podium view
  if (gameSession.phase === 'victory') {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center mission-light-bg text-[#14140F] px-4 pt-24 pb-10 select-none font-sans">
        <Header />
        <main className="relative z-10 w-full flex-1">
          <VictoryScreen leaderboard={leaderboard} currentTeamId={currentTeamId} />
        </main>
        <div className="relative -mx-4 -mb-10 w-[calc(100%+2rem)]">
          <Footer />
        </div>
      </div>
    );
  }

  const top3 = [leaderboard[1], leaderboard[0], leaderboard[2]]; // silver, gold, bronze order
  const myIdx = currentTeamId != null ? leaderboard.findIndex((t) => t.id === currentTeamId) : -1;
  const myTeam = myIdx >= 0 ? leaderboard[myIdx] : null;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center mission-light-bg text-[#14140F] px-4 pt-24 pb-10 font-sans">
      <Header />
      <main className="relative z-10 w-full max-w-3xl mx-auto flex-1 py-4 space-y-6">
        {/* Page intro — same compact icon + label pattern as the Briefing page */}
        <div className="w-full animate-in fade-in zoom-in-95 duration-300 text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-[#9a9a90]">
            <Radio className="w-5 h-5" />
            <span className="font-rajdhani font-black tracking-tight text-xl sm:text-2xl">
              SQUADRON RANKINGS
            </span>
          </div>
          <p className="text-sm text-[#4a4a44] leading-relaxed">
            Real-time score accumulation across Rover Navigation, Power Stabilization, and Signal Recovery.
          </p>
        </div>

        {/* Top bar — scope toggle (left) + "my squadron" summary pill (right) */}
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="inline-flex items-center gap-1 bg-white rounded-full p-1 border border-black/5 shadow-sm">
            <span className="px-4 py-1.5 rounded-full bg-[#302f27] text-white text-xs font-bold">
              Live Standings
            </span>
            <span className="px-4 py-1.5 rounded-full text-[#8a8a80] text-xs font-semibold">
              {leaderboard.length} {leaderboard.length === 1 ? 'Team' : 'Teams'}
            </span>
          </div>

          {myTeam && (
            <div className="inline-flex items-center gap-2.5 bg-white rounded-full pl-2 pr-1.5 py-1.5 border border-black/5 shadow-sm">
              <Avatar name={myTeam.name} size="w-7 h-7 text-[10px]" />
              <div className="text-left leading-tight pr-1">
                <div className="text-xs font-bold text-[#14140F] truncate max-w-[7rem]">{myTeam.name}</div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-[#8a8a80]">
                  <Lock className="w-2.5 h-2.5" /> Locked
                </div>
              </div>
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black shrink-0 ${
                  myIdx === 0
                    ? 'bg-amber-400 text-black'
                    : myIdx === 1
                    ? 'bg-slate-300 text-black'
                    : myIdx === 2
                    ? 'bg-amber-700 text-white'
                    : 'bg-[#302f27] text-white'
                }`}
              >
                {myIdx + 1}
              </span>
            </div>
          )}
        </div>

        {leaderboard.length === 0 ? (
          <div className="rounded-2xl bg-white border border-black/5 p-10 text-center text-[#8a8a80] text-sm shadow-sm">
            Standby for squadron telemetry stream...
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-black/5 shadow-[0_4px_20px_-6px_rgba(20,20,15,0.08)] overflow-hidden">
            {/* Podium */}
            {leaderboard.length >= 2 && (
              <div className="relative pt-10 pb-0 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(226,83,10,0.08),transparent_65%)] pointer-events-none" />
                <div className="relative flex items-end justify-center gap-3 sm:gap-6">
                  {PODIUM_STEPS.map((step) => {
                    const t = step.rank === 1 ? top3[1] : step.rank === 2 ? top3[0] : top3[2];
                    if (!t) return <div key={step.rank} className="w-24 sm:w-32" />;
                    return (
                      <div key={step.rank} className="flex flex-col items-center w-24 sm:w-32">
                        {step.rank === 1 ? (
                          <Crown className="w-6 h-6 text-amber-400 mb-1.5 fill-amber-400" />
                        ) : (
                          <Medal className={`w-5 h-5 mb-1.5 ${step.rank === 2 ? 'text-slate-400' : 'text-amber-700'}`} />
                        )}
                        <Avatar
                          name={t.name}
                          size={step.rank === 1 ? 'w-16 h-16 text-lg ring-4 ring-amber-400/60' : 'w-12 h-12 text-base'}
                        />
                        <div className="mt-2.5 text-center">
                          <div className="text-sm font-bold text-[#14140F] truncate max-w-[6.5rem] sm:max-w-[7.5rem]">
                            {t.name}
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#302f27] text-amber-300/90 text-[10px] font-bold tracking-wide">
                            <Lock className="w-2.5 h-2.5" /> LOCKED
                          </div>
                        </div>
                        <div
                          className={`mt-4 w-full ${step.height} rounded-t-xl border border-black/5 border-b-0 flex items-start justify-center pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${
                            step.rank === 1
                              ? 'bg-gradient-to-b from-[#FFF4E0] to-[#F5E4BE]'
                              : 'bg-gradient-to-b from-[#F5F1E8] to-[#E5DFCF]'
                          }`}
                        >
                          <span className={`text-3xl font-black ${step.number}`}>{step.rank}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full standings list */}
            <div className="border-t border-black/5 mt-6">
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h2 className="font-rajdhani font-bold text-sm text-[#14140F] tracking-tight">SQUADRON STANDINGS</h2>
                </div>
                <span className="text-[10px] font-bold text-[#E2530A]/80 tracking-widest uppercase">
                  Real-Time Synchronized
                </span>
              </div>

              <div className="divide-y divide-black/[0.05]">
                {leaderboard.map((team, idx) => {
                  const tier = tierFor(idx);
                  const TierIcon = tier.icon;
                  const isMe = team.id === currentTeamId;
                  return (
                    <div
                      key={team.id || idx}
                      className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
                        isMe ? 'bg-[#FFF4EA]' : idx === 0 ? 'bg-amber-50/50' : 'hover:bg-black/[0.02]'
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-black'
                            : idx === 1
                            ? 'bg-slate-300 text-black'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-black/[0.06] text-[#8a8a80]'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <Avatar name={team.name} size="w-10 h-10 text-sm" />

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-[#14140F] truncate">{team.name}</div>
                        <div className={`flex items-center gap-1 text-[11px] ${team.connected ? 'text-emerald-600' : 'text-[#8a8a80]'}`}>
                          {team.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                          {team.connected ? 'Online' : 'Offline'}
                        </div>
                      </div>

                      <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold shrink-0 ${tier.cls}`}>
                        <TierIcon className="w-3 h-3" /> {tier.label}
                      </span>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#302f27] text-amber-300/90 text-xs font-bold shrink-0">
                        <Lock className="w-3 h-3" /> LOCKED
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="relative -mx-4 -mb-10 w-[calc(100%+2rem)]">
        <Footer />
      </div>
    </div>
  );
}