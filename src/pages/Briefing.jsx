import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Radio, Compass, Zap, Waves } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { STORYLINES, ROUND_LABELS } from '../components/CinematicStoryline';
import { ROUND_INSTRUCTIONS } from '../data/roundInstructions';

// Pairs each round's story flavor (from the same STORYLINES data the
// in-game cinematics use) with its protocol directives (the same content
// shown in TeamDashboard's "Round Instructions" panel), plus a themed icon.
const ROUNDS = [
  { num: 1, icon: Compass, label: ROUND_LABELS.round1, story: STORYLINES.round1, instructions: ROUND_INSTRUCTIONS[1] },
  { num: 2, icon: Zap, label: ROUND_LABELS.round2, story: STORYLINES.round2, instructions: ROUND_INSTRUCTIONS[2] },
  { num: 3, icon: Waves, label: ROUND_LABELS.round3, story: STORYLINES.round3, instructions: ROUND_INSTRUCTIONS[3] },
];

export default function Briefing() {
  const { team } = useSocket();

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center mission-light-bg text-[#14140F] px-4 pt-24 pb-10 font-sans">
      <Header teamName={team?.name} />

      <main className="relative z-10 w-full max-w-5xl mx-auto flex-1 py-4 space-y-10">

        {/* ============================ PAGE INTRO ============================ */}
        <div className="w-full animate-in fade-in zoom-in-95 duration-300 text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-[#9a9a90]">
            <Radio className="w-5 h-5" />
            <span className="font-rajdhani font-black tracking-tight text-xl sm:text-2xl">
              MISSION BRIEFING
            </span>
          </div>
          <p className="text-sm text-[#4a4a44] leading-relaxed">
            {STORYLINES.intro.pairs[0][0]} {STORYLINES.intro.pairs[0][1]} {STORYLINES.intro.pairs[3][0]}
          </p>
        </div>

        {/* ============================ ROUND CARDS ============================ */}
        <div className="space-y-6 animate-in fade-in duration-300">
          {ROUNDS.map((round) => (
            <div
              key={round.num}
              className="rounded-2xl bg-[#302f27] border border-white/10 overflow-hidden"
            >
              <div className="p-6 space-y-5">
                {/* Header row — round pill + narrative subtitle */}
                <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/10 pb-4">
                  <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white tracking-widest uppercase">
                    <round.icon className="w-3.5 h-3.5 text-[#E2530A]" />
                    {round.label}
                  </span>
                  <span className="text-[10px] text-white/40 tracking-widest uppercase">
                    {round.story.subtitle}
                  </span>
                </div>

                {/* Story flavor */}
                <div className="space-y-1">
                  <h2 className="font-rajdhani font-bold text-white text-lg leading-tight">
                    {round.story.title}
                  </h2>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {round.story.pairs[0][0]} {round.story.pairs[0][1]}
                  </p>
                </div>

                {/* Protocol directives */}
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] text-white/40 tracking-widest uppercase">
                    {round.instructions.title}
                  </div>
                  <ul className="space-y-2">
                    {round.instructions.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-white/60">
                        <span className="text-[#E2530A] font-bold">•</span>
                        <span>
                          <span className="font-semibold text-white">{item.label}</span> {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ============================ FOOTER ============================ */}
      <div className="relative -mx-4 -mb-10 w-[calc(100%+2rem)]">
        <Footer />
      </div>
    </div>
  );
}