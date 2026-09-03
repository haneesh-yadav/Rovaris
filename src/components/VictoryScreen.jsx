import React, { useEffect } from 'react';
import { Crown, CalendarDays, Trophy, Medal, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import '../css/components/VictoryScreen.css';

// Warm mars/gold palette for avatars, matching the rest of the app
// (mission-light theme) instead of a cold blue/pink set.
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

// Rank tier — decorative badge shown per row, same spirit as the
// reference leaderboard's "Legendary Trainer" / "Pro Trainer" tags.
const tierFor = (idx) => {
  if (idx < 3) return { label: 'Mission Elite', icon: Trophy, cls: 'text-amber-600 bg-amber-50 border-amber-200' };
  if (idx < 6) return { label: 'Active Squadron', icon: Medal, cls: 'text-slate-500 bg-slate-100 border-slate-200' };
  return { label: 'Squadron', icon: Shield, cls: 'text-[#8a8a80] bg-black/[0.03] border-black/5' };
};

export default function VictoryScreen({ leaderboard = [], currentTeamId, onBackToLobby }) {
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
        colors: ['#FFD700', '#E2530A', '#FF7A1A', '#F5F1E8']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#FFD700', '#E2530A', '#FF7A1A', '#F5F1E8']
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

  const myIdx = currentTeamId != null ? leaderboard.findIndex((t) => t.id === currentTeamId) : -1;
  const myTeam = myIdx >= 0 ? leaderboard[myIdx] : null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 py-8 select-none">
      {/* ========================================================
          TOP BAR — scope toggle (left) + "my squadron" summary
          pill (right), same pattern as the reference leaderboard.
          ======================================================== */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="inline-flex items-center gap-1 bg-white rounded-full p-1 border border-black/5 shadow-sm">
          <span className="px-4 py-1.5 rounded-full bg-[#302f27] text-white text-xs font-bold">
            Final Results
          </span>
          <span className="px-4 py-1.5 rounded-full text-[#8a8a80] text-xs font-semibold">
            {leaderboard.length} {leaderboard.length === 1 ? 'Team' : 'Teams'}
          </span>
        </div>

        {myTeam && (
          <div className="inline-flex items-center gap-2.5 bg-white rounded-full pl-2 pr-1.5 py-1.5 border border-black/5 shadow-sm">
            <Avatar name={myTeam.name} size="w-7 h-7 text-[10px] ring-2" />
            <div className="text-left leading-tight pr-1">
              <div className="text-xs font-bold text-[#14140F] truncate max-w-[7rem]">{myTeam.name}</div>
              <div className="text-[10px] font-semibold text-[#E2530A]">{myTeam.scores.total} PTS</div>
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

      {/* ========================================================
          PODIUM — circular avatar, medal, name + PTS pill, then a
          flat cream block sized by rank (reference layout).
          ======================================================== */}
      <div className="relative flex items-end justify-center gap-4 sm:gap-8 pt-4">
        {/* 2nd Place */}
        <div className="flex flex-col items-center w-24 sm:w-28">
          <Medal className="w-5 h-5 text-slate-400 mb-1.5" />
          <Avatar name={secondPlace ? secondPlace.name : '—'} size="w-12 h-12 text-base" />
          <div className="mt-2 text-center">
            <div className="text-sm font-bold text-[#14140F] truncate max-w-[6rem] sm:max-w-[7rem]">
              {secondPlace ? secondPlace.name : '—'}
            </div>
            <div className="mt-1 inline-block px-3 py-1 rounded-full bg-[#302f27] text-amber-300 text-xs font-bold">
              {secondPlace ? `${secondPlace.scores.total} PTS` : '0 PTS'}
            </div>
          </div>
          <div className="mt-4 w-full h-24 rounded-t-2xl bg-gradient-to-b from-[#F5F1E8] to-[#E5DFCF] border border-black/5 border-b-0 flex flex-col items-center justify-start pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <span className="text-3xl font-black text-[#B8B2A0]">2</span>
          </div>
        </div>

        {/* 1st Place (Champion) */}
        <div className="flex flex-col items-center w-24 sm:w-28 -mt-8">
          <Crown className="w-7 h-7 text-amber-400 mb-1.5 fill-amber-400" />
          <Avatar name={firstPlace ? firstPlace.name : '—'} size="w-14 h-14 text-lg" />
          <div className="mt-2 text-center">
            <div className="text-sm font-bold text-[#14140F] truncate max-w-[6.5rem] sm:max-w-[7.5rem]">
              {firstPlace ? firstPlace.name : '—'}
            </div>
            <div className="mt-1 inline-block px-3 py-1 rounded-full bg-[#302f27] text-amber-300 text-xs font-bold">
              {firstPlace ? `${firstPlace.scores.total} PTS` : '0 PTS'}
            </div>
          </div>
          <div className="mt-4 w-full h-32 rounded-t-2xl bg-gradient-to-b from-[#FFF4E0] to-[#F5E4BE] border border-amber-200/60 border-b-0 flex flex-col items-center justify-start pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <span className="text-4xl font-black text-amber-500">1</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center w-24 sm:w-28">
          <Medal className="w-5 h-5 text-amber-700 mb-1.5" />
          <Avatar name={thirdPlace ? thirdPlace.name : '—'} size="w-12 h-12 text-base" />
          <div className="mt-2 text-center">
            <div className="text-sm font-bold text-[#14140F] truncate max-w-[6rem] sm:max-w-[7rem]">
              {thirdPlace ? thirdPlace.name : '—'}
            </div>
            <div className="mt-1 inline-block px-3 py-1 rounded-full bg-[#302f27] text-amber-300 text-xs font-bold">
              {thirdPlace ? `${thirdPlace.scores.total} PTS` : '0 PTS'}
            </div>
          </div>
          <div className="mt-4 w-full h-20 rounded-t-2xl bg-gradient-to-b from-[#F5F1E8] to-[#E5DFCF] border border-black/5 border-b-0 flex flex-col items-center justify-start pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <span className="text-3xl font-black text-[#B8B2A0]">3</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          FULL RANKED LEADERBOARD PANEL — light card, header row
          with a title + team-count pill, rows as individual cards
          ======================================================== */}
      <div className="rounded-3xl bg-white border border-black/5 shadow-[0_4px_20px_-6px_rgba(20,20,15,0.08)] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-[#14140F] flex items-center gap-2 tracking-tight">
            <CalendarDays className="w-4 h-4 text-[#8a8a80]" />
            <span>Final Squadron Scoreboard</span>
          </div>
          <span className="text-[10px] font-bold text-[#E2530A]/80 tracking-widest uppercase">
            Mission Complete
          </span>
        </div>

        <div className="space-y-2">
          {leaderboard.map((team, idx) => {
            const tier = tierFor(idx);
            const TierIcon = tier.icon;
            const isMe = team.id === currentTeamId;
            return (
              <div
                key={team.id || idx}
                className={`flex items-center gap-3 sm:gap-4 rounded-2xl px-3 sm:px-4 py-3 border transition-colors ${
                  isMe ? 'bg-[#FFF4EA] border-[#E2530A]/25' : 'bg-[#FAF9F5] border-black/5'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs shrink-0 ${
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
                  <div className="text-[11px] text-[#8a8a80]">
                    Rounds: {team.scores.r1} · {team.scores.r2} · {team.scores.r3}
                  </div>
                </div>

                <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold shrink-0 ${tier.cls}`}>
                  <TierIcon className="w-3 h-3" /> {tier.label}
                </span>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-[#8a8a80] font-semibold uppercase tracking-wide">Total</div>
                  <div className="text-sm font-black text-[#E2530A]">{team.scores.total} PTS</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}