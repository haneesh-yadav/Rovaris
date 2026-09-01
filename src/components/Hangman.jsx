import React from 'react';
import { HelpCircle, Award, AlertOctagon } from 'lucide-react';
import '../css/components/Hangman.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Hangman({
  gameNumber = 1,
  totalGames = 3,
  maskedWord = '',
  solutionWord = '',
  guessedLetters = [],
  mistakes = 0,
  maxMistakes = 8,
  completed = false,
  won = false,
  onGuessLetter,
  disabled = false
}) {
  return (
    <div className="w-full glass-panel rounded-2xl p-6 border-cyan-500/30 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold font-orbitron text-slate-100">
            EMERGENCY RECOVERY CHALLENGE {gameNumber}/{totalGames}
          </h2>
        </div>
        <div className="text-xs font-mono text-slate-400">
          MISTAKES: <strong className={mistakes > 5 ? 'text-rose-400' : 'text-amber-400'}>{mistakes}</strong> / {maxMistakes}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* 1. SVG Hangman Visual (Gallows & Stranded Astronaut) */}
        <div className="bg-black/60 rounded-xl p-4 border border-slate-800 flex items-center justify-center min-h-[220px]">
          <svg width="200" height="200" viewBox="0 0 200 200" className="stroke-cyan-400 fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round">
            {/* Part 1: Base Platform */}
            {mistakes >= 1 && (
              <line x1="20" y1="180" x2="100" y2="180" className="stroke-slate-500 stroke-[4]" />
            )}

            {/* Part 2: Vertical Pole & Overhead Beam */}
            {mistakes >= 2 && (
              <>
                <line x1="60" y1="180" x2="60" y2="20" className="stroke-slate-500 stroke-[4]" />
                <line x1="60" y1="20" x2="140" y2="20" className="stroke-slate-500 stroke-[4]" />
                <line x1="140" y1="20" x2="140" y2="45" className="stroke-amber-400 stroke-[2]" />
              </>
            )}

            {/* Part 3: Astronaut Helmet / Head */}
            {mistakes >= 3 && (
              <circle cx="140" cy="60" r="14" className="stroke-cyan-300 fill-cyan-950/40 stroke-[2.5]" />
            )}

            {/* Part 4: Body */}
            {mistakes >= 4 && (
              <line x1="140" y1="74" x2="140" y2="120" className="stroke-cyan-300 stroke-[3]" />
            )}

            {/* Part 5: Left Arm */}
            {mistakes >= 5 && (
              <line x1="140" y1="85" x2="115" y2="105" className="stroke-cyan-300 stroke-[2.5]" />
            )}

            {/* Part 6: Right Arm */}
            {mistakes >= 6 && (
              <line x1="140" y1="85" x2="165" y2="105" className="stroke-cyan-300 stroke-[2.5]" />
            )}

            {/* Part 7: Left Leg */}
            {mistakes >= 7 && (
              <line x1="140" y1="120" x2="120" y2="160" className="stroke-cyan-300 stroke-[2.5]" />
            )}

            {/* Part 8: Right Leg (Full Failure) */}
            {mistakes >= 8 && (
              <line x1="140" y1="120" x2="160" y2="160" className="stroke-rose-500 stroke-[3]" />
            )}
          </svg>
        </div>

        {/* 2. Word Display & Status */}
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">
              DECODE ASTRONOMICAL CIPHER
            </div>
            {/* Masked Word */}
            <div className="text-2xl md:text-4xl font-mono font-bold tracking-[0.3em] text-amber-300 min-h-[48px] flex items-center justify-center">
              {completed ? (solutionWord || maskedWord) : (maskedWord || '— — — — —')}
            </div>
          </div>

          {/* Outcome Alert */}
          {completed && (
            <div className={`p-4 rounded-xl border text-sm font-mono flex flex-col items-center justify-center gap-1.5 shadow-lg ${
              won
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                : 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
            }`}>
              <div className="flex items-center gap-2 text-base font-bold font-orbitron">
                {won ? <Award className="w-5 h-5 text-emerald-400" /> : <AlertOctagon className="w-5 h-5 text-rose-400" />}
                <span>
                  {won
                    ? 'That was the right word!'
                    : `The word was: ${solutionWord || maskedWord}`}
                </span>
              </div>
              <div className="text-xs text-slate-300">
                {won
                  ? '⚡ +15 Power Units gained! You may select 1 additional system below (or change your selection before confirming).'
                  : '⚠️ 1 active system shutdown required! Select an active system below to sacrifice (you may change your choice before confirming).'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. On-Screen Alphabet Keyboard */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="text-[10px] font-mono text-slate-400">LETTER INPUT MATRIX</div>
        <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-13 gap-1.5">
          {ALPHABET.map((char) => {
            const isGuessed = guessedLetters.includes(char);
            return (
              <button
                key={char}
                onClick={() => onGuessLetter(char)}
                disabled={isGuessed || completed || disabled}
                className={`py-2 rounded-lg text-sm font-mono font-bold transition-all ${
                  isGuessed
                    ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'btn-space-cyber hover:bg-cyan-500/20 active:scale-95'
                }`}
              >
                {char}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
