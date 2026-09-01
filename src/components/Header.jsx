import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, Info, AlertTriangle, X } from 'lucide-react';
import '../css/components/Header.css';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/admin', label: 'Mission Admin' },
];

/**
 * Header can render two ways:
 *  - Default nav mode (no props): the usual Home/Leaderboard/Mission Admin/Briefing pill nav.
 *  - Round mode (roundLabel passed in): the nav collapses to a single active pill showing
 *    the current round, with a small connected pill dropping below it that displays the
 *    live round timer (timeRemaining) — same font/weight as the nav itself.
 *
 * instructions (optional, round mode only): { title, items: [{ label, text }] }.
 * Renders a "Round Instructions" pill next to the round pill; clicking it drops down a
 * panel listing the items, styled to match the header (dark pill, same font).
 *
 * teamName (optional): renders a "Team <name>" badge on the right side of the header
 * row, level with the nav pill, in the same dark pill styling as the round pill, with
 * the name in the mars/orange accent color.
 */
export default function Header({ roundLabel, timeRemaining, instructions, teamName }) {
  const location = useLocation();
  const isRoundMode = Boolean(roundLabel);
  const hasRoster = Boolean(teamName);
  const [showInstructions, setShowInstructions] = useState(false);
  const instructionsRef = useRef(null);

  useEffect(() => {
    if (!showInstructions) return;
    const handleClickOutside = (e) => {
      if (instructionsRef.current && !instructionsRef.current.contains(e.target)) {
        setShowInstructions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInstructions]);

  return (
    <header className="fixed top-0 left-0 z-50 w-full flex flex-col items-center pt-2 pb-3 px-2">
      <div className="relative w-full flex justify-center">
        <nav className="flex items-center gap-1 bg-gradient-to-b from-[#b9b9b4] to-[#a3a39d] border border-black/10 rounded-full p-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_4px_14px_rgba(0,0,0,0.12)]">
          {isRoundMode ? (
            <span className="px-5 py-2 rounded-full text-sm font-semibold bg-[#302f27] text-white shadow-sm">
              {roundLabel}
            </span>
          ) : (
            <>
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-5 py-2 rounded-full text-sm transition-colors ${
                      isActive
                        ? 'bg-[#302f27] text-white font-semibold shadow-sm'
                        : 'text-[#f3f3f0] font-medium hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <a
                href="#briefing"
                className="px-5 py-2 rounded-full text-sm font-medium text-[#f3f3f0] hover:text-white transition-colors"
              >
                Briefing
              </a>
            </>
          )}
        </nav>

        {/* Round Instructions — sits in the gap between the round pill and the team badge */}
        {isRoundMode && instructions && (
          <div className="absolute right-[18%] top-1/2 -translate-y-1/2" ref={instructionsRef}>
            <button
              type="button"
              onClick={() => setShowInstructions((v) => !v)}
              className="px-5 py-2 rounded-full text-sm font-semibold bg-[#302f27] text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-4 h-4 text-[#E2530A]" />
              Round Instructions
            </button>

            {showInstructions && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[340px] rounded-2xl bg-[#302f27] shadow-[0_4px_20px_rgba(0,0,0,0.25)] p-4 text-left">
                <div className="flex items-center justify-between gap-2 text-sm font-semibold text-white border-b border-white/10 pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#E2530A] shrink-0" />
                    <span>{instructions.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInstructions(false)}
                    aria-label="Close"
                    className="text-white/50 hover:text-white cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <ul className="space-y-2">
                  {instructions.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-white/60">
                      <span className="text-[#E2530A] font-bold">•</span>
                      <span>
                        <span className="font-semibold text-white">{item.label}</span> {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Team badge — right side of the header row, same pill styling as the round pill */}
        {hasRoster && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 rounded-full bg-[#302f27] shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
            <span className="text-sm font-semibold text-[#E2530A]">Team {teamName}</span>
          </div>
        )}
      </div>

      {/* Dropped sub-bar: live round timer, connected to the header pill */}
      {isRoundMode && timeRemaining && (
        <div className="flex flex-col items-center">
          <span className="w-px h-1.5 bg-black/15" />
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#302f27] shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
            <Clock className="w-3.5 h-3.5 text-white/50" />
            <span className="text-sm font-medium text-white/60">Time Remaining</span>
            <span className="text-sm font-semibold text-white">{timeRemaining}</span>
          </div>
        </div>
      )}
    </header>
  );
}