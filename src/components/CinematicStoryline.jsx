import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Radio } from 'lucide-react';
import Header from './Header';
import '../css/components/CinematicStoryline.css';

export const STORYLINES = {
  intro: {
    index: '00',
    title: 'MISSION DEPLOYMENT — MARS SECTOR 7',
    subtitle: 'ORIGIN TELEMETRY DEPLOYMENT',
    pairs: [
      [
        'A Mars exploration rover was deployed to investigate an unexplored region of Mars...',
        '...and establish a communication relay with Mission Control on Earth.'
      ],
      [
        'During the mission, a powerful solar disturbance strikes Mars.',
        "Severe electromagnetic interference damages the rover's navigation and communication systems."
      ],
      [
        'Mission Control loses stable contact, maintaining only a weak emergency connection.',
        'Now YOU are the new Mission Control Team.'
      ],
      [
        "Your mission: recover the rover, stabilize systems, decode the astronaut's message, and restore complete communication.",
        'Prepare for deployment.'
      ],
      [
        'ALL SYSTEMS INITIALIZING...',
        "LETS BEGIN WITH ROUND 1"
      ]
    ]
  },
  round1: {
    index: '01',
    title: 'ROUND 1 — ROVER CONTROL FAILURE',
    subtitle: 'TRANSMISSION ANOMALY DETECTED',
    pairs: [
      [
        'Temporary emergency connection established... Navigation control system heavily damaged.',
        'The rover is stranded at one end of hostile Martian terrain; the relay station lies on the other end.'
      ],
      [
        'Direct control is impossible due to corrupted interface mappings.',
        'Re-calibrate controls, navigate the terrain, solve emergency prompts, and reach the relay.'
      ]
    ]
  },
  round2: {
    index: '02',
    title: 'ROUND 2 — SOLAR STORM EMERGENCY',
    subtitle: 'CRITICAL POWER FLUCTUATION',
    pairs: [
      [
        'The solar storm intensifies across the Martian surface!',
        'Increasing solar radiation triggers a catastrophic main power outage within the rover.'
      ],
      [
        'Rover power is down to a critical emergency threshold.',
        'Seven core systems are competing for limited power—sacrifices must be made to survive.'
      ]
    ]
  },
  round3: {
    index: '03',
    title: 'ROUND 3 — DISTRESS SIGNAL RECOVERY',
    subtitle: 'EMERGENCY FREQUENCY INTERCEPT',
    pairs: [
      [
        'The solar storm has passed; rover power and core systems have stabilized.',
        'Scanning surrounding channels... CRITICAL DISTRESS SIGNAL DETECTED!'
      ],
      [
        'Source: Unknown Stranded Astronaut. Signal: Heavily distorted.',
        'Audio voice channels are ruined, but an embedded Morse code transmission is active. Recover the message!'
      ]
    ]
  }
};

export const ROUND_LABELS = {
  intro: 'ROVARIS STORYLINE',
  round1: 'ROUND 1 • MAZE',
  round2: 'ROUND 2 • POWER',
  round3: 'ROUND 3 • MORSE',
};

export default function CinematicStoryline({ type = 'intro', onComplete, isAdmin = false, teamName }) {
  const storyline = STORYLINES[type] || STORYLINES.intro;

  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [fadeState, setFadeState] = useState('in'); // 'in', 'visible', 'out'
  const [line1Text, setLine1Text] = useState('');
  const [line2Text, setLine2Text] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  // Measure the header's real rendered height (it's position:fixed, so it
  // takes no flow space) so the container's top padding — and therefore the
  // connector line right below it — touches the header exactly, on any
  // screen size or font-loading timing, instead of a guessed pixel value.
  const headerWrapRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(64);

  useLayoutEffect(() => {
    const getHeaderEl = () => headerWrapRef.current?.querySelector('header');

    const measure = () => {
      const headerEl = getHeaderEl();
      if (headerEl) setHeaderHeight(headerEl.offsetHeight);
    };

    measure();

    // A plain 'resize' listener isn't enough: the header's real height can
    // also change after this first measurement — e.g. a webfont swapping in,
    // the team badge/instructions pill appearing, or text reflowing — none
    // of which fire a window resize event. ResizeObserver catches all of
    // those so the padding (and therefore the connector line) never drifts
    // out of sync with the header's actual rendered height.
    let resizeObserver;
    const headerEl = getHeaderEl();
    if (headerEl && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(headerEl);
    }

    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [teamName, type]);

  const pair = storyline.pairs[currentPairIndex] || storyline.pairs[0];
  const targetLine1 = pair[0] || '';
  const targetLine2 = pair[1] || '';

  const isLastPair = currentPairIndex === storyline.pairs.length - 1;

  // Typewriter effect for the 2 lines
  useEffect(() => {
    setLine1Text('');
    setLine2Text('');
    setIsTyping(true);
    setFadeState('in');

    let l1Idx = 0;
    let l2Idx = 0;
    let cancelled = false;

    // Type line 1 first
    const interval1 = setInterval(() => {
      if (cancelled) return;
      if (l1Idx < targetLine1.length) {
        setLine1Text(targetLine1.slice(0, l1Idx + 1));
        l1Idx++;
      } else {
        clearInterval(interval1);
        // Type line 2 after short pause
        setTimeout(() => {
          if (cancelled) return;
          const interval2 = setInterval(() => {
            if (cancelled) return;
            if (l2Idx < targetLine2.length) {
              setLine2Text(targetLine2.slice(0, l2Idx + 1));
              l2Idx++;
            } else {
              clearInterval(interval2);
              setIsTyping(false);
              // No auto-advance anymore — the team reads each transmission
              // at their own pace and taps the arrow to continue.
            }
          }, 24);
        }, 300);
      }
    }, 24);

    return () => {
      cancelled = true;
      clearInterval(interval1);
    };
  }, [currentPairIndex, type]);

  const advanceNextPair = () => {
    if (currentPairIndex < storyline.pairs.length - 1) {
      setFadeState('out');
      setTimeout(() => {
        setCurrentPairIndex((prev) => prev + 1);
      }, 400);
    }
  };

  const goToPreviousPair = () => {
    if (currentPairIndex > 0) {
      setFadeState('out');
      setTimeout(() => {
        setCurrentPairIndex((prev) => prev - 1);
      }, 400);
    }
  };

  // Smooth hand-off: fade the briefing out before the actual game mounts underneath.
  const enterGame = () => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 500);
  };

  return (
    <div
      className="cinematic-light fixed inset-0 z-50 flex flex-col items-center mission-light-bg px-6 pb-10 select-none overflow-hidden font-sans"
      style={{ paddingTop: headerHeight }}
    >
      {/* Same fixed round-nav / team-name header used across the rest of the mission */}
      <div
        ref={headerWrapRef}
        className={`transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        <Header roundLabel={ROUND_LABELS[type] || ROUND_LABELS.intro} teamName={teamName} />
      </div>

      {/* Ambient warm glow, consistent with the mission-light theme */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-100/40 via-transparent to-transparent pointer-events-none" />

      {/* Remaining space below the header: an invisible spacer above and below
          this block keep the box vertically centered in the screen, while the
          connector line (the top spacer) is rendered visibly so it touches
          both the header pill above and the box below. */}
      <div
        className={`relative z-10 w-full flex-1 min-h-0 flex flex-col items-center transition-opacity duration-500 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className="w-px bg-black/15 shrink-0" style={{ flexGrow: 0.5, flexBasis: 0, minHeight: 40 }} />

        <div className="w-full max-w-3xl mx-auto flex flex-col items-center shrink-0">
          {/* Storyline box — dark console theme, text sized to match the header pill */}
          <div
            className={`w-full rounded-2xl bg-[#302f27] px-12 py-10 space-y-6 transition-all duration-400 ease-in-out ${
              fadeState === 'out' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            <div className="text-center space-y-2 border-b border-white/10 pb-5">
              <div className="text-xs text-white/40 tracking-widest uppercase">
                {storyline.index} — {storyline.subtitle}
              </div>
              <h1 className="text-base font-semibold text-white">
                {storyline.title}
              </h1>
            </div>

            {/* Text block is sized to the FINAL text from the first frame: an
                invisible copy of the full target lines reserves the layout
                space (grid stacks it under the visible, typing copy), so the
                box never grows/shrinks as the typewriter effect plays. */}
            <div className="text-center space-y-3">
              <div className="grid">
                <p
                  className="invisible col-start-1 row-start-1 text-base font-semibold leading-relaxed"
                  aria-hidden="true"
                >
                  {targetLine1 || '\u00A0'}
                </p>
                <p className="col-start-1 row-start-1 text-base font-semibold text-white leading-relaxed">
                  {line1Text}
                  {isTyping && !line2Text && <span className="typewriter-cursor" />}
                </p>
              </div>
              <div className="grid">
                <p
                  className="invisible col-start-1 row-start-1 text-base font-medium leading-relaxed"
                  aria-hidden="true"
                >
                  {targetLine2 || '\u00A0'}
                </p>
                <p className="col-start-1 row-start-1 text-base font-medium text-[#E2530A] leading-relaxed">
                  {line2Text}
                  {isTyping && line2Text && <span className="typewriter-cursor" />}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs text-white/40">
                Sequence [{currentPairIndex + 1}/{storyline.pairs.length}]
              </span>
              <div className="flex items-center gap-2">
                {currentPairIndex > 0 && (
                  <button
                    onClick={goToPreviousPair}
                    aria-label="Previous transmission"
                    className="h-9 pl-3 pr-4 rounded-full border border-white/40 flex items-center gap-1.5 text-white text-xs font-semibold tracking-wide cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-white text-base leading-none">arrow_back</span>
                    <span>Previous Sequence</span>
                  </button>
                )}
                {!isLastPair && (
                  <button
                    onClick={advanceNextPair}
                    aria-label="Next transmission"
                    className="h-9 pl-4 pr-3 rounded-full border border-white/40 flex items-center gap-1.5 text-white text-xs font-semibold tracking-wide cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <span>Next Sequence</span>
                    <span className="material-symbols-outlined text-white text-base leading-none">arrow_forward</span>
                  </button>
                )}
                {isLastPair && type !== 'intro' && (
                  <button
                    onClick={enterGame}
                    className="h-9 pl-4 pr-3 rounded-full border border-white/40 flex items-center gap-1.5 text-white text-xs font-semibold tracking-wide cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <span>ENTER GAME ARENA</span>
                    <span className="material-symbols-outlined text-white text-base leading-none">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Standby badge — intro briefing only, waiting on Mission Control */}
          {isLastPair && type === 'intro' && (
            <div className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#302f27] text-white text-xs font-semibold tracking-wide uppercase animate-pulse">
              <Radio className="w-4 h-4 text-[#E2530A]" />
              <span>Mission briefing complete · Standby for Mission Control to initiate Round 1...</span>
            </div>
          )}
        </div>

        <span aria-hidden="true" className="shrink-0" style={{ flexGrow: 1.5, flexBasis: 0 }} />
      </div>
    </div>
  );
}