import React, { useState } from 'react';
import { audioEngine } from './AudioEngine';
import '../css/components/MorseDecoder.css';

const MORSE_CHART = [
  { char: 'A', code: '.-' },    { char: 'B', code: '-...' },  { char: 'C', code: '-.-.' },
  { char: 'D', code: '-..' },   { char: 'E', code: '.' },     { char: 'F', code: '..-.' },
  { char: 'G', code: '--.' },   { char: 'H', code: '....' },  { char: 'I', code: '..' },
  { char: 'J', code: '.---' },  { char: 'K', code: '-.-' },   { char: 'L', code: '.-..' },
  { char: 'M', code: '--' },    { char: 'N', code: '-.' },    { char: 'O', code: '---' },
  { char: 'P', code: '.--.' },  { char: 'Q', code: '--.-' },  { char: 'R', code: '.-.' },
  { char: 'S', code: '...' },   { char: 'T', code: '-' },     { char: 'U', code: '..-' },
  { char: 'V', code: '...-' },  { char: 'W', code: '.--' },   { char: 'X', code: '-..-' },
  { char: 'Y', code: '-.--' },  { char: 'Z', code: '--..' }
];

const TABS = [
  { id: 'decoder', label: 'Transmission Decoder', icon: 'sensors' },
  { id: 'reference', label: 'Morse Code Reference', icon: 'menu_book' },
];

// Small helper so every icon in this component renders as a Material Symbol
// instead of an inline SVG — keeps the icon set consistent with the rest
// of the dark mission-console screens (CinematicStoryline, Header, etc.).
function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined leading-none ${className}`}>{name}</span>;
}

export default function MorseDecoder({
  timesPlayed = 0,
  submission = null,
  completed = false,
  score = 0,
  onPlayAudio,
  onSubmitWords,
  disabled = false
}) {
  const [activeTab, setActiveTab] = useState('decoder');
  const [playbackState, setPlaybackState] = useState('stopped'); // 'stopped', 'playing', 'paused'
  const [word1, setWord1] = useState(submission ? submission[0] || '' : '');
  const [word2, setWord2] = useState(submission ? submission[1] || '' : '');
  const [word3, setWord3] = useState(submission ? submission[2] || '' : '');
  const [activeSignal, setActiveSignal] = useState(null);
  const [cachedMorseString, setCachedMorseString] = useState(null);

  const handlePlayToggle = () => {
    if (playbackState === 'playing') {
      audioEngine.pauseMorse();
      setPlaybackState('paused');
      return;
    }

    if (playbackState === 'paused') {
      audioEngine.resumeMorse(
        (progress) => {
          setActiveSignal(progress);
        },
        () => {
          setPlaybackState('stopped');
          setActiveSignal(null);
        }
      );
      setPlaybackState('playing');
      return;
    }

    // New playback start
    onPlayAudio((morseString) => {
      setCachedMorseString(morseString);
      setPlaybackState('playing');
      audioEngine.playMorse(
        morseString,
        (progress) => {
          setActiveSignal(progress);
        },
        () => {
          setPlaybackState('stopped');
          setActiveSignal(null);
        }
      );
    });
  };

  const handleStop = () => {
    audioEngine.stop();
    setPlaybackState('stopped');
    setActiveSignal(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!word1 || !word2 || !word3) {
      alert('Please fill in all 3 transmission words.');
      return;
    }

    if (window.confirm('Confirm final transmission submission? This cannot be undone.')) {
      onSubmitWords([word1.trim(), word2.trim(), word3.trim()]);
    }
  };

  return (
    <div className="w-full space-y-5 select-none">
      {/* ========================================================
          TAB BAR — switches the panel below between the audio
          receiver and the permanent reference sheet, so only one
          is ever on screen at a time. Left-aligned, fit-content.
          ======================================================== */}
      <div className="morse-tabbar inline-flex items-center gap-1.5 rounded-2xl bg-[#22221c] p-1.5 shadow-[0_4px_18px_-4px_rgba(0,0,0,0.25)]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`morse-tab flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold tracking-tight transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-[#14140F] shadow-sm'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Icon name={tab.icon} className={`text-base ${isActive ? 'text-[#E2530A]' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          BIG CARD — full black/console theme (matches the
          CinematicStoryline briefing cards). The active tab panel
          (audio receiver or reference table) and the submission
          form live together inside this one continuous dark card.
          ======================================================== */}
      <div className="rounded-2xl bg-[#302f27] border border-white/10 overflow-hidden">

      {/* TAB PANEL: Distress Signal Audio Receiver */}
      {activeTab === 'decoder' && (
        <div className="p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                playbackState === 'playing' ? 'bg-[#E2530A]/20 text-[#E2530A] animate-pulse' : 'bg-white/5 border border-white/10 text-white/40'
              }`}>
                <Icon name="sensors" className="text-xl" />
              </div>
              <div>
                <div className="text-xs font-medium text-white/60">
                  Frequency 650Hz · Synthesized Morse Transmission
                </div>
                <h2 className="text-lg font-black font-rajdhani text-white tracking-tight">
                  DISTRESS SIGNAL AUDIO RECEIVER
                </h2>
              </div>
            </div>

            {/* Playback Badge */}
            <div className="text-right">
              <div className="text-xs font-medium text-white/60">Audio Controls</div>
              <div className="text-sm font-semibold text-white">Unlimited Playback</div>
            </div>
          </div>

          {/* Audio Visualizer Waveform Bar */}
          <div className="h-16 bg-black/40 rounded-xl border border-white/10 p-3 flex items-center justify-center gap-1.5 overflow-hidden">
            {playbackState === 'playing' ? (
              [...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-[#E2530A] to-[#FF7A1A] rounded-full animate-pulse"
                  style={{
                    height: `${20 + ((i * 17) % 75)}%`,
                    animationDuration: `${0.3 + (i % 5) * 0.1}s`
                  }}
                />
              ))
            ) : playbackState === 'paused' ? (
              <div className="text-sm font-medium text-[#E2530A] flex items-center gap-2 animate-pulse">
                <Icon name="pause" className="text-base" />
                <span>Audio paused — press resume to continue from current position</span>
              </div>
            ) : (
              <div className="text-sm font-medium text-white/40 flex items-center gap-2">
                <Icon name="volume_off" className="text-base" />
                <span>Standby — press play to listen to embedded Morse code</span>
              </div>
            )}
          </div>

          {/* Play / Pause / Stop Buttons — pill outline style, matching the
              briefing-card navigation buttons (rounded-full, white/40 border). */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayToggle}
                disabled={disabled}
                className={`h-11 pl-4 pr-5 rounded-full border flex items-center gap-2 text-sm font-semibold tracking-wide cursor-pointer transition-colors disabled:opacity-50 ${
                  playbackState === 'playing'
                    ? 'border-[#E2530A]/70 text-[#E2530A] hover:bg-[#E2530A]/10'
                    : 'border-white/40 text-white hover:bg-white/10'
                }`}
              >
                {playbackState === 'playing' ? (
                  <>
                    <Icon name="pause" className="text-base" />
                    <span>PAUSE TRANSMISSION</span>
                  </>
                ) : playbackState === 'paused' ? (
                  <>
                    <Icon name="play_arrow" className="text-base" />
                    <span>RESUME TRANSMISSION</span>
                  </>
                ) : (
                  <>
                    <Icon name="play_arrow" className="text-base" />
                    <span>PLAY MORSE TRANSMISSION</span>
                  </>
                )}
              </button>

              {playbackState !== 'stopped' && (
                <button
                  onClick={handleStop}
                  className="h-11 pl-3 pr-4 rounded-full border border-white/40 text-white/70 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-white/10 transition-colors"
                  title="Reset to beginning"
                >
                  <Icon name="stop" className="text-base" />
                  <span>STOP</span>
                </button>
              )}
            </div>

            {activeSignal && (
              <div className="text-xs font-medium text-white/60 animate-pulse">
                Receiving word [{activeSignal.wordIndex + 1}] · Signal: <strong className="text-[#E2530A] font-bold">{activeSignal.symbol}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB PANEL: Permanent Morse Code Reference Sheet (A-Z) */}
      {activeTab === 'reference' && (
        <div className="p-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-white font-black font-rajdhani tracking-tight text-sm border-b border-white/10 pb-3 mb-4">
            <Icon name="menu_book" className="text-base text-[#E2530A]" />
            <span>MORSE CODE REFERENCE TABLE</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2 text-xs">
            {MORSE_CHART.map((item) => (
              <div
                key={item.char}
                className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between hover:border-[#E2530A]/40 transition-colors"
              >
                <span className="font-bold text-white text-sm">{item.char}</span>
                <span className="font-bold text-[#E2530A] tracking-widest">{item.code}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3-Word Transmission Submission Form — merged into the
          same dark card, directly below whichever panel is active. */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6 border-t border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
          <div className="text-base font-black font-rajdhani tracking-tight text-white">
            TRANSMISSION DECODER SUBMISSION
          </div>
          <div className="text-xs font-semibold text-[#E2530A]">
            TARGET: 3 WORDS (ASTRONAUT MESSAGE)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Word 1 */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/50">
              WORD 1
            </label>
            <input
              type="text"
              value={word1}
              onChange={(e) => setWord1(e.target.value.toUpperCase())}
              disabled={completed || disabled}
              placeholder="WORD 1"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white uppercase tracking-wide placeholder:text-white/30 focus:outline-none focus:border-[#E2530A]/60 focus:ring-2 focus:ring-[#E2530A]/20 disabled:opacity-60"
            />
          </div>

          {/* Word 2 */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/50">
              WORD 2
            </label>
            <input
              type="text"
              value={word2}
              onChange={(e) => setWord2(e.target.value.toUpperCase())}
              disabled={completed || disabled}
              placeholder="WORD 2"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white uppercase tracking-wide placeholder:text-white/30 focus:outline-none focus:border-[#E2530A]/60 focus:ring-2 focus:ring-[#E2530A]/20 disabled:opacity-60"
            />
          </div>

          {/* Word 3 */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/50">
              WORD 3
            </label>
            <input
              type="text"
              value={word3}
              onChange={(e) => setWord3(e.target.value.toUpperCase())}
              disabled={completed || disabled}
              placeholder="WORD 3"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white uppercase tracking-wide placeholder:text-white/30 focus:outline-none focus:border-[#E2530A]/60 focus:ring-2 focus:ring-[#E2530A]/20 disabled:opacity-60"
            />
          </div>
        </div>

        {completed ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <Icon name="check_circle" className="text-lg text-emerald-400" />
              <span>TRANSMISSION SUBMITTED &amp; LOGGED</span>
            </div>
            <div className="font-black font-rajdhani text-base">
              SCORE: {score} / 30 PTS
            </div>
          </div>
        ) : (
          <button
            type="submit"
            disabled={disabled || completed}
            className="w-full h-14 rounded-full border border-white/40 text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <Icon name="send" className="text-base" />
            <span>TRANSMIT DECODED MESSAGE TO MISSION CONTROL</span>
          </button>
        )}
      </form>
      </div>
    </div>
  );
}