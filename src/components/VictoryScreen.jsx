import React, { useEffect } from 'react';
import { Crown, CalendarDays } from 'lucide-react';
import confetti from 'canvas-confetti';
import '../css/components/VictoryScreen.css';

// Pastel, cartoon-avatar-style palette (blues/pinks/purples), matching the
// reference leaderboard's avatar colors instead of the app's mars/orange set.
const AVATAR_PALETTE = [
  ['#7C8CF8', '#5A63D8'],
  ['#F28FCB', '#C25FA3'],
  ['#7FD1E0', '#4FA8C2'],
  ['#B98FF2', '#8A5FD8'],
  ['#F2A65A', '#D97D3A'],
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
      className={`${size} rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.3)]`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {initials(name)}
    </div>
  );
};

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
        colors: ['#FFD700', '#7C8CF8', '#F28FCB', '#F5F1E8']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#FFD700', '#7C8CF8', '#F28FCB', '#F5F1E8']
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
    <div className="w-full max-w-3xl mx-auto space-y-10 py-8 select-none">
      {/* ========================================================
          PODIUM — floats above the leaderboard panel, same layout
          as the reference: avatar + name + PTS pill, then a flat
          lavender block sized by rank.
          ======================================================== */}
      <div className="relative flex items-end justify-center gap-4 sm:gap-8 pt-2">
        {/* 2nd Place */}
        <div className="flex flex-col items-center w-24 sm:w-28">
          <Avatar name={secondPlace ? secondPlace.name : '—'} size="w-12 h-12 text-base" />
          <div className="mt-2 text-center">
            <div className="text-sm font-bold text-[#14140F] truncate max-w-[6rem] sm:max-w-[7rem]">
              {secondPlace ? secondPlace.name : '—'}
            </div>
            <div className="mt-1 inline-block px-3 py-1 rounded-full bg-[#2E3157] text-[#C7C9FF] text-xs font-bold">
              {secondPlace ? `${secondPlace.scores.total} PTS` : '0 PTS'}
            </div>
          </div>
          <div className="mt-4 w-full h-24 rounded-t-2xl bg-[#AEB0F2] flex flex-col items-center justify-start pt-4">
            <span className="text-3xl font-black text-white">2</span>
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
            <div className="mt-1 inline-block px-3 py-1 rounded-full bg-[#2E3157] text-[#C7C9FF] text-xs font-bold">
              {firstPlace ? `${firstPlace.scores.total} PTS` : '0 PTS'}
            </div>
          </div>
          <div className="mt-4 w-full h-32 rounded-t-2xl bg-[#AEB0F2] flex flex-col items-center justify-start pt-4">
            <span className="text-4xl font-black text-white">1</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center w-24 sm:w-28">
          <Avatar name={thirdPlace ? thirdPlace.name : '—'} size="w-12 h-12 text-base" />
          <div className="mt-2 text-center">
            <div className="text-sm font-bold text-[#14140F] truncate max-w-[6rem] sm:max-w-[7rem]">
              {thirdPlace ? thirdPlace.name : '—'}
            </div>
            <div className="mt-1 inline-block px-3 py-1 rounded-full bg-[#2E3157] text-[#C7C9FF] text-xs font-bold">
              {thirdPlace ? `${thirdPlace.scores.total} PTS` : '0 PTS'}
            </div>
          </div>
          <div className="mt-4 w-full h-20 rounded-t-2xl bg-[#AEB0F2] flex flex-col items-center justify-start pt-4">
            <span className="text-3xl font-black text-white">3</span>
          </div>
        </div>

        {/* Small connector dot bridging the podium to the panel below */}
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#0F1225] ring-4 ring-[#DEDEDA]" />
      </div>

      {/* ========================================================
          FULL RANKED LEADERBOARD PANEL — dark navy card, header row
          with a title + toggle-style pill, rows as individual cards
          ======================================================== */}
      <div className="rounded-3xl bg-[#0F1225] p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
            <CalendarDays className="w-4 h-4 text-white/50" />
            <span>Final Squadron Scoreboard</span>
          </div>
          <div className="flex items-center gap-1 bg-[#1B1F3B] rounded-full p-1">
            <span className="px-3 py-1 rounded-full bg-white text-[#0F1225] text-xs font-bold">
              This Mission
            </span>
            <span className="px-3 py-1 rounded-full text-white/40 text-xs font-semibold">
              {leaderboard.length} Teams
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {leaderboard.map((team, idx) => (
            <div
              key={team.id || idx}
              className="flex items-center gap-4 bg-[#171B35] rounded-2xl px-4 py-3"
            >
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs shrink-0 ${
                idx === 0
                  ? 'bg-amber-400 text-black'
                  : idx === 1
                  ? 'bg-slate-300 text-black'
                  : idx === 2
                  ? 'bg-amber-700 text-white'
                  : 'bg-white/10 text-white/50'
              }`}>
                {idx + 1}
              </span>

              <Avatar name={team.name} size="w-10 h-10 text-sm" />

              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">{team.name}</div>
                <div className="text-[11px] text-white/40">
                  Round scores: {team.scores.r1} · {team.scores.r2} · {team.scores.r3}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">Total</div>
                <div className="text-sm font-black text-[#C7C9FF]">{team.scores.total} PTS</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}