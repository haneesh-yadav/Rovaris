import React from 'react';
import { Gamepad2 } from 'lucide-react';
import DinoRunner from '../components/DinoRunner';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DinoGame() {
  return (
    <div className="min-h-screen w-full mission-light-bg text-[#14140F] px-4 pt-24 pb-8 select-none overflow-x-hidden font-sans">
      <Header />
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-[#9a9a90]">
            <Gamepad2 className="w-5 h-5" />
            <span className="font-rajdhani font-black tracking-tight text-xl sm:text-2xl">
              STANDBY DIVERSION
            </span>
          </div>
          <h1 className="font-rajdhani font-bold leading-[0.92] tracking-tight text-4xl sm:text-5xl text-[#14140F]">
            MARTIAN DINO <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E2530A] to-[#B5391F]">RUNNER</span>
          </h1>
          <p className="text-sm text-[#4a4a44] leading-relaxed">
            An untracked mini-game — jump over craters and rocks while you wait for the next mission update.
          </p>
        </div>

        <div className="rounded-3xl bg-[#302f27] border border-white/10 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.2)] p-4 sm:p-8">
          <DinoRunner hideBanner statusText="STATUS: FREE PLAY" />
        </div>
      </div>
    
      {/* ============================ FOOTER ============================ */}
      <div className="relative -mx-4 -mb-6 mt-12 w-[calc(100%+2rem)]">
        <Footer />
      </div>
    </div>
  );
}
