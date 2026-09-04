import React, { useRef, useEffect, useState } from 'react';
import { Trophy, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import '../css/components/DinoRunner.css';

export default function DinoRunner({
  title,
  message,
  scoreText,
  statusText,
  hideBanner = false
}) {
  const canvasRef = useRef(null);
  const jumpFnRef = useRef(() => {});
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Game variables
    let currentScore = 0;
    let groundY = 190;
    let rover = {
      x: 50,
      y: groundY - 30,
      width: 44,
      height: 30,
      vy: 0,
      gravity: 0.7,
      jumpPower: -12,
      isGrounded: true
    };

    let obstacles = [];
    let obstacleTimer = 0;
    let gameSpeed = 5;
    // The rover no longer starts running the instant this component
    // mounts — physics/scoring stay paused until the player launches it.
    let isRunning = false;
    let crashed = false;

    // Static starfield + dust motes, generated once so they don't re-randomize every frame
    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * groundY * 0.7,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.5 + 0.3
    }));
    const duneSpecks = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: groundY + Math.random() * (canvas.height - groundY),
      r: Math.random() * 1.4 + 0.4
    }));

    const spawnObstacle = () => {
      const type = Math.random() > 0.5 ? 'rock' : 'crater';
      obstacles.push({
        x: canvas.width + 20,
        y: type === 'rock' ? groundY - 26 : groundY - 8,
        width: type === 'rock' ? 24 : 32,
        height: type === 'rock' ? 26 : 8,
        type
      });
    };

    const handleJump = () => {
      if (!isRunning) {
        if (crashed) {
          // Rover crashed — restart the run immediately.
          resetGame();
        } else {
          // First launch: player explicitly starts the run.
          isRunning = true;
          setStarted(true);
        }
        rover.vy = rover.jumpPower;
        rover.isGrounded = false;
        return;
      }
      if (rover.isGrounded) {
        rover.vy = rover.jumpPower;
        rover.isGrounded = false;
      }
    };
    jumpFnRef.current = handleJump;

    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const resetGame = () => {
      currentScore = 0;
      setScore(0);
      obstacles = [];
      rover.y = groundY - 30;
      rover.vy = 0;
      rover.isGrounded = true;
      gameSpeed = 5;
      isRunning = true;
      crashed = false;
      setGameOver(false);
      setStarted(true);
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Martian Sky — deep atmospheric haze fading to a dusty rust horizon
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#0A0407');
      skyGrad.addColorStop(0.55, '#3D1409');
      skyGrad.addColorStop(1, '#6B2A12');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, groundY);

      // Faint stars high in the thin Martian atmosphere
      stars.forEach((s) => {
        ctx.fillStyle = `rgba(255, 236, 210, ${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Small distant sun / Phobos glow low on the horizon
      const sunGrad = ctx.createRadialGradient(
        canvas.width * 0.78, groundY * 0.32, 2,
        canvas.width * 0.78, groundY * 0.32, 70
      );
      sunGrad.addColorStop(0, 'rgba(255, 214, 168, 0.9)');
      sunGrad.addColorStop(0.35, 'rgba(255, 170, 110, 0.25)');
      sunGrad.addColorStop(1, 'rgba(255, 170, 110, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, canvas.width, groundY);

      // Far haze ridge (soft, desaturated — atmospheric perspective)
      ctx.fillStyle = '#4A1D0E';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(60, groundY - 22);
      ctx.lineTo(160, groundY - 8);
      ctx.lineTo(260, groundY - 30);
      ctx.lineTo(400, groundY - 12);
      ctx.lineTo(540, groundY - 26);
      ctx.lineTo(660, groundY - 6);
      ctx.lineTo(canvas.width, groundY - 18);
      ctx.lineTo(canvas.width, groundY);
      ctx.closePath();
      ctx.fill();

      // Nearer, darker Martian hills with jagged crater-carved silhouette
      ctx.fillStyle = '#2E0F06';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(80, groundY - 40);
      ctx.lineTo(190, groundY - 15);
      ctx.lineTo(310, groundY - 50);
      ctx.lineTo(460, groundY - 20);
      ctx.lineTo(600, groundY - 45);
      ctx.lineTo(700, groundY);
      ctx.closePath();
      ctx.fill();

      // 2. Draw Martian Ground Terrain — layered regolith with dust texture
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, canvas.height);
      groundGrad.addColorStop(0, '#B84E24');
      groundGrad.addColorStop(1, '#7A2F13');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

      // Scattered dust/rock speckles across the ground for a grittier, real-terrain feel
      duneSpecks.forEach((d) => {
        ctx.fillStyle = 'rgba(40, 14, 6, 0.4)';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.r * 2, d.r, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = '#E06B34';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      if (isRunning) {
        // Update rover physics
        rover.vy += rover.gravity;
        rover.y += rover.vy;

        if (rover.y >= groundY - rover.height) {
          rover.y = groundY - rover.height;
          rover.vy = 0;
          rover.isGrounded = true;
        }

        // Spawn obstacles
        obstacleTimer++;
        if (obstacleTimer > 80 + Math.random() * 60) {
          spawnObstacle();
          obstacleTimer = 0;
          gameSpeed += 0.05;
        }

        // Score update
        currentScore++;
        if (currentScore % 5 === 0) {
          setScore(Math.floor(currentScore / 5));
        }

        // Update & Draw Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const obs = obstacles[i];
          obs.x -= gameSpeed;

          // Draw obstacle
          if (obs.type === 'rock') {
            ctx.fillStyle = '#260F07';
            ctx.strokeStyle = '#5E2914';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width * 0.3, obs.y);
            ctx.lineTo(obs.x + obs.width * 0.8, obs.y + 4);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else {
            // Crater
            ctx.fillStyle = '#1A0C06';
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          }

          // Collision Detection
          const padding = 4;
          if (
            rover.x + padding < obs.x + obs.width &&
            rover.x + rover.width - padding > obs.x &&
            rover.y + padding < obs.y + obs.height &&
            rover.y + rover.height > obs.y
          ) {
            // Crash
            isRunning = false;
            crashed = true;
            setGameOver(true);
            setHighScore((prev) => Math.max(prev, Math.floor(currentScore / 5)));
          }

          // Remove offscreen
          if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
          }
        }
      }

      // 3. Draw Red Mars Rover
      ctx.save();
      ctx.translate(rover.x, rover.y);

      // Chassis
      ctx.fillStyle = '#E53935';
      ctx.fillRect(0, 8, rover.width, rover.height - 14);

      // Solar Panel
      ctx.fillStyle = '#0D47A1';
      ctx.fillRect(4, 2, rover.width * 0.5, 6);

      // Mast Camera
      ctx.fillStyle = '#263238';
      ctx.fillRect(rover.width - 12, 0, 8, 10);
      ctx.fillStyle = '#00E5FF';
      ctx.beginPath();
      ctx.arc(rover.width - 8, 4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(8, rover.height - 4, 6, 0, Math.PI * 2);
      ctx.arc(rover.width / 2, rover.height - 4, 6, 0, Math.PI * 2);
      ctx.arc(rover.width - 8, rover.height - 4, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="w-full space-y-6 select-none animate-in fade-in zoom-in-95 duration-300">
      {/* Early Completion Victory Banner — hidden when this component is
          reused outside a round-completion context (e.g. the lobby). */}
      {!hideBanner && (
      <div className="rounded-2xl p-6 md:p-8 text-center space-y-3 bg-gradient-to-b from-[#241109] to-[#170a05] border border-emerald-500/40 shadow-[0_0_40px_rgba(0,230,118,0.15)]">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-bold tracking-widest uppercase animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>MISSION OBJECTIVE COMPLETE</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white">
          {title || "ROUND OBJECTIVE COMPLETED!"}
        </h2>
        <p className="text-sm md:text-base text-orange-100/80 max-w-2xl mx-auto leading-relaxed">
          {message || "Your squadron successfully completed this round. Your score is locked. Enjoy the Martian Robo Runner while the other teams finish this round!"}
        </p>

        {scoreText && (
          <div className="pt-2 text-lg text-amber-300 font-bold">
            {scoreText}
          </div>
        )}
      </div>
      )}

      {/* Mini-Game Frame — warm mars-toned card, full bleed left-to-right */}
      <div className="rounded-2xl p-4 md:p-7 space-y-4 bg-gradient-to-b from-[#2a1710] to-[#1c0f0a] border border-[#E2530A]/25 shadow-[0_25px_60px_-25px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-white tracking-tight">MARTIAN ROBO RUNNER</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-orange-200/60 uppercase tracking-wider">Untracked Mini-Game</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="text-orange-100/50">
              DISTANCE: <span className="text-amber-300 font-bold">{score}m</span>
            </div>
            <div className="text-orange-100/50">
              BEST: <span className="text-amber-400 font-bold">{highScore}m</span>
            </div>
          </div>
        </div>

        {/* Canvas Runner */}
        <div
          className="relative rounded-xl overflow-hidden border border-[#E2530A]/20 bg-black cursor-pointer shadow-inner"
          onClick={() => jumpFnRef.current()}
        >
          <canvas
            ref={canvasRef}
            width={720}
            height={240}
            className="w-full h-auto block"
          />

          {!started && !gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
              <div className="text-amber-300 font-bold text-xl tracking-wider">
                MARTIAN ROBO RUNNER
              </div>
              <div className="text-xs text-orange-100/80 animate-pulse">
                PRESS SPACE OR TAP SCREEN TO START
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
              <div className="text-rose-400 font-bold text-xl tracking-wider">
                ROVER COLLISION DETECTED
              </div>
              <div className="text-xs text-orange-100/70">
                FINAL RUN DISTANCE: <span className="text-amber-300 font-bold">{score}m</span>
              </div>
              <div className="text-xs text-amber-300 animate-pulse">
                PRESS SPACE OR TAP SCREEN TO RETRY
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-orange-100/50 pt-1">
          <div>CONTROLS: [SPACE] OR [UP ARROW] OR TAP TO JUMP OVER CRATERS & ROCKS</div>
          <div className="text-emerald-400">{statusText || "STATUS: SQUADRON SCORE PRESERVED"}</div>
        </div>
      </div>
    </div>
  );
}