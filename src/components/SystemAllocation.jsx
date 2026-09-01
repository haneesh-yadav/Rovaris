import React from 'react';
import { Battery, Zap, Check, X, ShieldAlert, Cpu, Radio, Compass, Thermometer, Eye, RadioTower, HeartPulse } from 'lucide-react';
import '../css/components/SystemAllocation.css';

const SYSTEM_ICONS = {
  comm: Radio,
  drive: Cpu,
  nav: Compass,
  thermal: Thermometer,
  radar: Eye,
  beacon: RadioTower,
  aux: HeartPulse
};

export default function SystemAllocation({
  systems = [],
  powerBudget = 90,
  powerUsed = 0,
  powerRemaining = 90,
  onToggleSystem,
  onAdvanceDecision,
  phase = 'allocation',
  decisionType = null,
  disabled = false
}) {
  const percentage = Math.min(100, Math.round((powerUsed / powerBudget) * 100));

  // Determine whether the confirm button is validly clickable
  const hasSelectedNew = systems.some((s) => !s.isBaseline && s.active);
  const canAffordAny = systems.some((s) => !s.isBaseline && s.cost <= powerRemaining);
  const hasShutDown = systems.some((s) => s.isBaseline && !s.active);

  const isConfirmDisabled = disabled || (
    decisionType === 'power_boost'
      ? (canAffordAny && !hasSelectedNew)
      : decisionType === 'forced_shutdown'
      ? !hasShutDown
      : false
  );

  return (
    <div className="w-full space-y-6 select-none">
      {/* Power Budget HUD Bar — same dark pill styling/font as the header */}
      <div className="rounded-2xl bg-[#302f27] p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#E2530A]">
              <Battery className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-white/60">Rover Auxiliary Power Cell</div>
              <h2 className="text-lg font-black font-rajdhani text-white tracking-tight">
                EMERGENCY POWER ALLOCATION
              </h2>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-medium text-white/60">Power Allocated</div>
            <div className="text-2xl font-bold text-white">
              <span className={powerRemaining === 0 ? 'text-amber-400' : 'text-[#E2530A]'}>{powerUsed}</span>
              <span className="text-sm text-white/40"> / {powerBudget} Units</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-3 bg-black/40 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentage > 90
                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                : 'bg-gradient-to-r from-[#FF7A1A] to-[#E2530A]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm border-t border-white/10 pt-3">
          <span className="font-medium text-white/60">
            Surplus Available: <strong className="font-semibold text-emerald-400">{powerRemaining} Units</strong>
          </span>
          <span className="font-medium text-white/60">
            System Demand: <strong className="font-semibold text-white">160 Units (Sacrifices Required)</strong>
          </span>
        </div>
      </div>

      {/* Decision Banner if in Decision phase */}
      {decisionType && (
        <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
          decisionType === 'power_boost'
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldAlert className={`w-6 h-6 shrink-0 ${decisionType === 'power_boost' ? 'text-emerald-600' : 'text-rose-600'}`} />
            <div>
              <div className={`text-sm font-black font-rajdhani tracking-tight ${
                decisionType === 'power_boost' ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {decisionType === 'power_boost' ? 'RECOVERY SUCCESS: +15 POWER UNITS GAINED' : 'RECOVERY FAILED: POWER LOSS INCURRED'}
              </div>
              <div className="text-xs text-[#4a4a44] mt-0.5">
                {decisionType === 'power_boost'
                  ? 'Click any unselected offline system below to power it online. You can select and deselect freely before confirming.'
                  : 'Click an active system below to shut it down. You can change your selection freely before confirming.'}
              </div>
            </div>
          </div>

          {onAdvanceDecision && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={onAdvanceDecision}
                disabled={isConfirmDisabled}
                className={`px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  isConfirmDisabled ? 'btn-mars-ghost opacity-50 cursor-not-allowed' : 'btn-mars-solid'
                }`}
              >
                <span>{decisionType === 'power_boost' ? 'CONFIRM SELECTION ➔' : 'CONFIRM SHUTDOWN ➔'}</span>
              </button>
              {isConfirmDisabled && (
                <div className="text-[10px] text-orange-600 font-medium">
                  {decisionType === 'power_boost'
                    ? 'Select 1 unselected system below first'
                    : 'Select 1 active system to shut down first'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7 Systems Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systems.map((sys) => {
          const Icon = SYSTEM_ICONS[sys.id] || Zap;
          const isActive = sys.active;
          const isBaseline = Boolean(sys.isBaseline);

          let canToggle = false;
          let badgeText = isActive ? 'ONLINE' : 'OFFLINE';
          let badgeClass = isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200';

          if (!disabled) {
            if (phase === 'allocation') {
              canToggle = true;
            } else if (decisionType === 'power_boost') {
              if (isBaseline) {
                canToggle = false; // Baseline active systems locked
                badgeText = 'LOCKED ONLINE';
                badgeClass = 'bg-black/[0.04] text-[#6b6b64] border border-black/10';
              } else {
                if (isActive) {
                  canToggle = true; // Can deselect newly selected unselected system
                  badgeText = 'SELECTED (CLICK TO DESELECT)';
                  badgeClass = 'bg-orange-50 text-orange-600 border border-orange-200';
                } else if (sys.cost <= powerRemaining) {
                  canToggle = true; // Can select unselected offline system
                  badgeText = 'AVAILABLE (CLICK TO SELECT)';
                  badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                } else {
                  badgeText = 'INSUFFICIENT POWER';
                  badgeClass = 'bg-black/[0.04] text-[#8a8a82] border border-black/10';
                }
              }
            } else if (decisionType === 'forced_shutdown') {
              if (!isBaseline) {
                canToggle = false; // Cannot activate offline systems
                badgeText = 'OFFLINE';
                badgeClass = 'bg-black/[0.04] text-[#8a8a82] border border-black/10';
              } else {
                if (isActive) {
                  canToggle = true; // Can click to sacrifice/shut down
                  badgeText = 'ACTIVE (CLICK TO SHUTDOWN)';
                  badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200';
                } else {
                  canToggle = true; // Can click to restore/cancel shutdown
                  badgeText = 'STAGED SHUTDOWN (CLICK TO RESTORE)';
                  badgeClass = 'bg-rose-50 text-rose-600 border border-rose-200';
                }
              }
            }
          }

          return (
            <div
              key={sys.id}
              onClick={() => canToggle && onToggleSystem(sys.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'panel-light-warm'
                  : 'bg-black/[0.02] border-black/10 opacity-90'
              } ${canToggle ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-not-allowed opacity-60'}`}
            >
              {/* Top Row: Icon + Name + Cost Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-black/[0.04] text-[#8a8a82]'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-rajdhani text-[#14140F]">{sys.name}</h3>
                    <div className="text-xs font-medium text-orange-600">Cost: {sys.cost} units</div>
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 whitespace-nowrap ${badgeClass}`}>
                  {isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>{badgeText}</span>
                </div>
              </div>

              {/* Advantage & Offline Penalty — table layout */}
              <div className="rounded-xl bg-black/[0.03] border border-black/10 overflow-hidden text-xs">
                <div className="grid grid-cols-[110px_1fr] gap-3 px-3 py-2.5 border-b border-black/10">
                  <span className="font-semibold text-emerald-600">Advantage</span>
                  <span className="text-[#4a4a44] leading-relaxed">{sys.advantage}</span>
                </div>
                <div className="grid grid-cols-[110px_1fr] gap-3 px-3 py-2.5">
                  <span className="font-semibold text-rose-600">Offline Penalty</span>
                  <span className="text-[#4a4a44] leading-relaxed">{sys.disadvantage}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}