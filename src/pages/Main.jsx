import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import {
  TrendingUp, Globe, ArrowUp, AlertCircle
} from 'lucide-react';
import CinematicStoryline from '../components/CinematicStoryline';
import DinoRunner from '../components/DinoRunner';
import Header from '../components/Header';
import Footer from '../components/Footer';
import rovarisRover from '../assets/rovaris-rover.png';
import rovarisWordmark from '../assets/rovaris-wordmark.png';
import '../css/pages/Main.css';

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.842.505 3.567 1.383 5.043L2 22l5.076-1.332A9.94 9.94 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.007a8.03 8.03 0 0 1-4.093-1.12l-.294-.174-3.033.796.81-2.958-.192-.304A7.98 7.98 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8.007z" />
  </svg>
);

const InstagramIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className={className}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45z" />
  </svg>
);

// Material Symbol helper — keeps the lobby's icon set consistent with the
// dark round screens (CinematicStoryline, MorseDecoder), which all use
// Material Symbols instead of inline SVG icon packs.
const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none ${className}`}>{name}</span>
);

const ICON_NAV_ITEMS = [
  { label: 'Instagram', href: 'https://www.instagram.com/vit_stellar', icon: <InstagramIcon /> },
  { label: 'WhatsApp', href: 'https://www.whatsapp.com/channel/0029VbDDEqe3GJP5VpaGoA0h', icon: <WhatsAppIcon /> },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/vit-stellar', icon: <LinkedinIcon /> },
  { label: 'Website', href: 'https://vitstellar.vercel.app', icon: <Globe className="w-4.5 h-4.5" /> },
];

const LOBBY_TABS = [
  { id: 'lobby', label: 'Lobby', icon: 'groups' },
  { id: 'dino', label: 'Dino Game', icon: 'sports_esports' },
];

export default function Main() {
  const { team, login, connected, gameSession, lobbyTeams } = useSocket();
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCinematic, setShowCinematic] = useState(false);
  const [lobbyTab, setLobbyTab] = useState('lobby');
  const navigate = useNavigate();

  // Phase synchronization
  useEffect(() => {
    if (team) {
      if (gameSession.phase === 'intro_cinematic' || gameSession.phase === 'main_storyline') {
        setShowCinematic(true);
      } else if (gameSession.phase === 'round1' || gameSession.phase === 'round2' || gameSession.phase === 'round3' || gameSession.phase === 'victory') {
        setShowCinematic(false);
        navigate('/team');
      }
    }
  }, [team, gameSession.phase, navigate]);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    const clean = teamName.trim();
    if (!clean) {
      setError('Please enter your squadron team name.');
      return;
    }

    setLoading(true);
    login(clean, (res) => {
      setLoading(false);
      if (!res || !res.success) {
        setError(res?.error || 'Failed to authenticate team.');
      }
    });
  };

  const handleCinematicComplete = () => {
    setShowCinematic(false);
    if (gameSession.phase === 'round1' || gameSession.phase === 'round2' || gameSession.phase === 'round3') {
      navigate('/team');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between mission-light-bg text-[#14140F] px-4 pt-20 pb-6 select-none overflow-hidden font-sans">

      {/* Cinematic Modal Overlay if active */}
      {showCinematic && (
        <CinematicStoryline
          type="intro"
          teamName={team?.name}
          onComplete={handleCinematicComplete}
          isAdmin={false}
        />
      )}

      {!showCinematic && (
        <Header
          roundLabel={team ? 'MISSION LOBBY' : undefined}
          teamName={team?.name}
        />
      )}

      {/* ============================ MAIN ============================ */}
      {!showCinematic && (
      <main className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col justify-center py-4">
        {!team ? (
          /* ======================================================
             1. HERO LANDING — TEAM REGISTRATION
             ====================================================== */
          <div className="w-full animate-in fade-in zoom-in-95 duration-300 lg:-mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-12 items-center">

              {/* LEFT — eyebrow + headline */}
              <div className="lg:col-span-4 space-y-3 pt-1 order-1 lg:mt-16">
                <h1 className="font-rajdhani font-bold leading-[0.92] tracking-tight text-4xl sm:text-5xl text-[#9a9a90]">
                  <div className="text-left pl-[28%] sm:pl-[30%]">BUILDING</div>
                  <div className="text-left">ROVERS</div>
                  <div className="text-left pl-[2%] sm:pl-[3%] whitespace-nowrap">THAT CONQUER</div>
                  <div className="text-left">TERRAIN</div>
                </h1>

                <div className="mt-10 relative">
                  <div className="flex items-center justify-between gap-3 bg-[#dcdcd6] border border-black/10 rounded-full pl-6 pr-2 py-2">
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
                      placeholder="Enter your Team Name"
                      maxLength={30}
                      autoFocus
                      className="flex-1 min-w-0 bg-transparent text-sm text-[#4a4a44] placeholder-[#8a8a82] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading || !connected}
                      aria-label="Deploy Squadron"
                      className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#C15B34] text-white shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                  </div>

                  {error && (
                    <div className="absolute top-full left-0 right-0 mt-2 flex items-center gap-2 bg-[#f7dcd3] border border-[#C15B34]/30 rounded-full px-5 py-2.5 z-20 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle className="w-4 h-4 text-[#C15B34] shrink-0" />
                      <span className="text-sm text-[#8a3a1f]">{error}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CENTER — the rover, sitting still, slightly lower than center */}
              <div className="lg:col-span-4 order-3 lg:order-2 flex justify-center items-center relative py-4">
                <div className="relative w-full max-w-[420px] mt-8 sm:mt-12">
                  <img
                    src={rovarisRover}
                    alt="The ROVARIS rover"
                    className="relative z-10 w-full h-auto drop-shadow-[0_30px_30px_rgba(75,15,18,0.25)]"
                  />
                </div>
              </div>

              {/* RIGHT — live stat + quick-nav icons */}
              <div className="lg:col-span-4 order-2 lg:order-3 pt-1 self-start mt-2 sm:mt-6">
                <div className="flex flex-col items-end text-right">
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-6 h-6 text-[#b9b9b0] shrink-0" />
                    <div className="font-rajdhani font-black text-[#9a9a90] leading-[0.92] tracking-tight text-xl sm:text-2xl whitespace-nowrap">
                      DRIVE BEYOND BOUNDARIES
                    </div>
                  </div>
                  <p className="text-sm text-[#4a4a44] mt-4 max-w-xs text-right">
                    Three rounds. One relay window. Navigate the maze rover, stabilize the power grid, and decode the final distress signal.
                  </p>

                  <nav className="mt-6 flex flex-col items-center gap-1 bg-gradient-to-b from-[#b9b9b4] to-[#a3a39d] border border-black/10 rounded-2xl p-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_4px_14px_rgba(0,0,0,0.12)]">
                    {ICON_NAV_ITEMS.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={item.label}
                        aria-label={item.label}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[#f3f3f0] hover:text-white hover:bg-black/10 transition-colors"
                      >
                        {item.icon}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Wordmark — spans from under the rover (tires) to the social icon bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 mt-6 lg:mt-4">
              <div className="hidden lg:block lg:col-span-4" />
              <div className="lg:col-span-8 flex justify-center lg:justify-end">
                <img
                  src={rovarisWordmark}
                  alt="ROVARIS"
                  className="w-full max-w-[520px] h-auto select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================
             2. WAITING LOBBY — TEAM REGISTERED
             ====================================================== */
          <div className="w-full space-y-5 animate-in fade-in duration-300 py-4">
            {/* TAB BAR — switches between the lobby roster and the
                standby mini-game, same pattern/style as the MorseDecoder
                tab bar (dark pill container, white active pill). */}
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-[#22221c] p-1.5 shadow-[0_4px_18px_-4px_rgba(0,0,0,0.25)]">
              {LOBBY_TABS.map((tab) => {
                const isActive = lobbyTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLobbyTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold tracking-tight transition-all cursor-pointer ${
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

            {lobbyTab === 'lobby' ? (
              /* BIG CARD — dark console theme matching the round screens
                  (CinematicStoryline / MorseDecoder), so the connected
                  squadrons and the standby note live inside one continuous
                  dark card that fills the available width. */
              <div className="rounded-2xl bg-[#302f27] border border-white/10 overflow-hidden animate-in fade-in duration-200">

                {/* Connected squadrons */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <div className="flex items-center gap-2">
                      <Icon name="groups" className="text-base text-[#E2530A]" />
                      <span>Connected Squadrons ({lobbyTeams.length})</span>
                    </div>
                    <span>Auto-synced</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {lobbyTeams.map((t, idx) => {
                      const isCurrent = t.id === team.id;
                      return (
                        <div
                          key={t.id || idx}
                          className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
                            isCurrent
                              ? 'bg-[#E2530A]/10 border-[#E2530A]/40 scale-105'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full shrink-0 ${t.connected ? 'bg-emerald-400' : 'bg-white/20'}`} />
                          <div className="truncate">
                            <div className="text-sm font-bold font-rajdhani text-white truncate">{t.name}</div>
                            <div className="text-[10px] text-white/40 tracking-widest">{isCurrent ? 'YOU' : 'SQUADRON'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Standby note */}
                <div className="p-4 border-t border-white/10 text-xs text-white/40 space-y-1 text-center">
                  <div>Standby at your terminal. All round storylines and timers are server-synchronized.</div>
                  <div>When Mission Control triggers deployment, your screen will launch automatically.</div>
                </div>
              </div>
            ) : (
              /* Standby mini-game — reuses the same DinoRunner used on the
                  round-completion screens, with the victory banner hidden
                  since nothing has been completed here. */
              <div className="animate-in fade-in duration-200">
                <DinoRunner
                  hideBanner
                  statusText="STATUS: WAITING ON MISSION CONTROL"
                />
              </div>
            )}
          </div>
        )}
      </main>
      )}

      {/* ============================ FOOTER ============================ */}
      {!showCinematic && (
      <div className="relative -mx-4 -mb-6 w-[calc(100%+2rem)]">
        <Footer />
      </div>
      )}
    </div>
  );
}