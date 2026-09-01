import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Radio, AlertTriangle } from 'lucide-react';
import '../css/components/Controls.css';

export default function Controls({ onMove, facing = 'E', disabled = false, proximityPercent, coordinates }) {
  const getFacingLabel = (dir) => {
    switch (dir) {
      case 'N': return { name: 'NORTH', deg: '0°' };
      case 'E': return { name: 'EAST', deg: '90°' };
      case 'S': return { name: 'SOUTH', deg: '180°' };
      case 'W': return { name: 'WEST', deg: '270°' };
      default: return { name: 'EAST', deg: '90°' };
    }
  };

  const facingInfo = getFacingLabel(facing);

  return (
    <div className="w-full space-y-4">
      {/* 1. Rover Telemetry Table — same dark pill styling/font as the header */}
      <div className="rounded-2xl bg-[#302f27] p-4 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-white/60">Head Orientation</span>
          <span className="font-semibold text-white">
            {facingInfo.name} <span className="text-[#E2530A]">({facingInfo.deg})</span>
          </span>
        </div>

        {proximityPercent != null && (
          <div className="flex items-center justify-between text-sm border-t border-white/10 pt-2.5">
            <span className="font-medium text-white/60">Proximity to Relay</span>
            <span className="font-semibold text-[#E2530A]">{proximityPercent}%</span>
          </div>
        )}

        {coordinates && (
          <div className="flex items-center justify-between text-sm border-t border-white/10 pt-2.5">
            <span className="font-medium text-white/60">Coordinates</span>
            <span className="font-semibold text-white">X:{coordinates.x} Y:{coordinates.y}</span>
          </div>
        )}
      </div>

      {/* 2. Primary Navigation Keypad (Always visible without scrolling) */}
      <div className="rounded-2xl bg-[#302f27] p-4 space-y-3">
        <div className="text-sm font-black font-rajdhani text-white tracking-tight flex items-center justify-between">
          <span>MANUAL DRIVE CONSOLE</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#E2530A]">
            <AlertTriangle className="w-4 h-4" />
            Corrupted Mappings
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
          {/* Top Row: Empty / UP / Empty */}
          <div />
          <button
            onClick={() => onMove('UP')}
            disabled={disabled}
            className="py-3 rounded-xl bg-[#1c1b15] border border-white/10 hover:bg-[#26251d] flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-40 transition-colors"
            title="UP Control Input"
          >
            <ArrowUp className="w-5 h-5 text-[#E2530A]" />
            <span className="text-[10px] font-bold text-white">UP</span>
          </button>
          <div />

          {/* Middle Row: LEFT / CENTER ICON / RIGHT */}
          <button
            onClick={() => onMove('LEFT')}
            disabled={disabled}
            className="py-3 rounded-xl bg-[#1c1b15] border border-white/10 hover:bg-[#26251d] flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-40 transition-colors"
            title="LEFT Control Input"
          >
            <ArrowLeft className="w-5 h-5 text-[#E2530A]" />
            <span className="text-[10px] font-bold text-white">LEFT</span>
          </button>

          <div className="py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-white/40">
            <Radio className="w-5 h-5 text-[#E2530A]/70 animate-pulse" />
            <span className="text-[8px] font-bold">GRID</span>
          </div>

          <button
            onClick={() => onMove('RIGHT')}
            disabled={disabled}
            className="py-3 rounded-xl bg-[#1c1b15] border border-white/10 hover:bg-[#26251d] flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-40 transition-colors"
            title="RIGHT Control Input"
          >
            <ArrowRight className="w-5 h-5 text-[#E2530A]" />
            <span className="text-[10px] font-bold text-white">RIGHT</span>
          </button>

          {/* Bottom Row: Empty / DOWN / Empty */}
          <div />
          <button
            onClick={() => onMove('DOWN')}
            disabled={disabled}
            className="py-3 rounded-xl bg-[#1c1b15] border border-white/10 hover:bg-[#26251d] flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-40 transition-colors"
            title="DOWN Control Input"
          >
            <ArrowDown className="w-5 h-5 text-[#E2530A]" />
            <span className="text-[10px] font-bold text-white">DOWN</span>
          </button>
          <div />
        </div>
      </div>
    </div>
  );
}