import React, { useRef, useEffect } from 'react';
import '../css/components/MazeViewer.css';

export default function MazeViewer({ map, rover, onCanvasClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map || !rover) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const cols = map.width;
    const rows = map.height;
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Martian terrain background (Rich warm rust-orange terracotta soil,
    //    with a hazy atmospheric sun-glow so it reads as real Mars ground, not a flat fill)
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#C4673B');
    bgGradient.addColorStop(0.5, '#BC5E33');
    bgGradient.addColorStop(1, '#9C4622');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Hazy dust-lit sun glow, upper-left, like sunlight raking across the regolith
    const sunGlow = ctx.createRadialGradient(
      width * 0.14, height * 0.1, 0,
      width * 0.14, height * 0.1, width * 0.55
    );
    sunGlow.addColorStop(0, 'rgba(255, 205, 140, 0.28)');
    sunGlow.addColorStop(1, 'rgba(255, 205, 140, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height);

    // Draw subtle natural crater spots and dusty textures across terrain
    ctx.fillStyle = 'rgba(100, 35, 15, 0.22)';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if ((x * 7 + y * 13) % 9 === 0) {
          ctx.beginPath();
          ctx.ellipse(
            (x + 0.5) * cellWidth,
            (y + 0.5) * cellHeight,
            cellWidth * 0.4,
            cellHeight * 0.24,
            ((x + y) * 0.4),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    // Fine scattered rock speckles & dust grain for extra ground realism
    ctx.fillStyle = 'rgba(60, 22, 10, 0.35)';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if ((x * 11 + y * 5) % 17 === 0) {
          const rx = (x + 0.3 + ((x * 3) % 5) * 0.08) * cellWidth;
          const ry = (y + 0.7 + ((y * 7) % 5) * 0.06) * cellHeight;
          ctx.beginPath();
          ctx.arc(rx, ry, Math.max(1, cellWidth * 0.05), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.fillStyle = 'rgba(255, 210, 160, 0.12)';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if ((x * 13 + y * 19) % 23 === 0) {
          const rx = (x + 0.6) * cellWidth;
          const ry = (y + 0.2) * cellHeight;
          ctx.beginPath();
          ctx.arc(rx, ry, Math.max(0.8, cellWidth * 0.035), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Draw Maze Walls with 3D brick segments (matching attached screenshot)
    const grid = map.grid;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y][x];
        const px = x * cellWidth;
        const py = y * cellHeight;

        if (cell === 0) {
          // Wall cell: dark rock/brick segment
          // Base dark outline
          ctx.fillStyle = '#1A0B06';
          ctx.fillRect(px, py, cellWidth, cellHeight);

          // Inner dark reddish-brown stone face
          ctx.fillStyle = '#381B13';
          ctx.fillRect(px + 1, py + 1, cellWidth - 2, cellHeight - 2);

          // Top/Left subtle highlight
          ctx.strokeStyle = '#542B20';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 1, py + cellHeight - 1);
          ctx.lineTo(px + 1, py + 1);
          ctx.lineTo(px + cellWidth - 1, py + 1);
          ctx.stroke();

          // Bottom/Right dark bevel
          ctx.strokeStyle = '#120603';
          ctx.beginPath();
          ctx.moveTo(px + cellWidth - 1, py + 1);
          ctx.lineTo(px + cellWidth - 1, py + cellHeight - 1);
          ctx.lineTo(px + 1, py + cellHeight - 1);
          ctx.stroke();

          // Horizontal/vertical brick partition line
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = '#220E08';
            ctx.fillRect(px + cellWidth * 0.48, py + 1, 1.5, cellHeight - 2);
          }
        }
      }
    }

    // 3. Draw START Station Badge (Top-Left, matching screenshot exactly)
    const startX = 0.8 * cellWidth;
    const startY = 0.8 * cellHeight;
    const badgeW = cellWidth * 2.2;
    const badgeH = cellHeight * 2.1;

    ctx.save();
    // Badge Box (warm dark mars card, matching the app's amber/rust accent — no blue-grey)
    ctx.fillStyle = '#1C0F0A';
    ctx.strokeStyle = '#E2530A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(startX, startY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    // START Amber Text
    ctx.fillStyle = '#FFC978';
    ctx.font = `bold ${Math.max(9, cellHeight * 0.48)}px Poppins, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START', startX + badgeW / 2, startY + badgeH * 0.32);

    // Mini Rover Icon (Light body with two wheels)
    const iconCenterX = startX + badgeW / 2;
    const iconCenterY = startY + badgeH * 0.72;
    ctx.fillStyle = '#F0E6DD';
    ctx.fillRect(iconCenterX - cellWidth * 0.4, iconCenterY - cellHeight * 0.18, cellWidth * 0.8, cellHeight * 0.25);
    // Wheels
    ctx.fillStyle = '#2A1710';
    ctx.beginPath();
    ctx.arc(iconCenterX - cellWidth * 0.25, iconCenterY + cellHeight * 0.12, cellHeight * 0.12, 0, Math.PI * 2);
    ctx.arc(iconCenterX + cellWidth * 0.25, iconCenterY + cellHeight * 0.12, cellHeight * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Draw RELAY Station Badge (Bottom-Right, matching screenshot exactly)
    const goalX = (cols - 3) * cellWidth;
    const goalY = (rows - 2.9) * cellHeight;
    const relayW = cellWidth * 2.2;
    const relayH = cellHeight * 2.1;

    ctx.save();
    // Badge Box (matches the START badge's warm mars card treatment)
    ctx.fillStyle = '#1C0F0A';
    ctx.strokeStyle = '#E2530A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(goalX, goalY, relayW, relayH, 6);
    ctx.fill();
    ctx.stroke();

    // Dish Antenna Icon (Warm amber curved dish, kept off-blue to match the theme)
    const dishCenterX = goalX + relayW / 2;
    const dishCenterY = goalY + relayH * 0.38;
    ctx.strokeStyle = '#FFC978';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(dishCenterX, dishCenterY, cellWidth * 0.38, Math.PI * 0.85, Math.PI * 1.75, false);
    ctx.stroke();
    // Mast pole & base
    ctx.beginPath();
    ctx.moveTo(dishCenterX, dishCenterY);
    ctx.lineTo(dishCenterX, dishCenterY + cellHeight * 0.25);
    ctx.moveTo(dishCenterX - cellWidth * 0.2, dishCenterY + cellHeight * 0.25);
    ctx.lineTo(dishCenterX + cellWidth * 0.2, dishCenterY + cellHeight * 0.25);
    ctx.stroke();

    // RELAY Text
    ctx.fillStyle = '#F0E6DD';
    ctx.font = `bold ${Math.max(8, cellHeight * 0.44)}px Poppins, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RELAY', dishCenterX, goalY + relayH * 0.78);
    ctx.restore();

    // NOTE: Checkpoint visibility removed completely as requested by user!

    // 5. Draw Mars Rover Sprite with Directional Headlight Beam
    const rx = rover.x * cellWidth + cellWidth / 2;
    const ry = rover.y * cellHeight + cellHeight / 2;
    const facing = rover.facing || 'E';

    let angle = 0;
    if (facing === 'N') angle = -Math.PI / 2;
    else if (facing === 'E') angle = 0;
    else if (facing === 'S') angle = Math.PI / 2;
    else if (facing === 'W') angle = Math.PI;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(angle);

    // Directional Headlight Cone
    const lightGradient = ctx.createRadialGradient(0, 0, 5, cellWidth * 2.2, 0, cellWidth * 3.5);
    lightGradient.addColorStop(0, 'rgba(255, 245, 190, 0.6)');
    lightGradient.addColorStop(0.5, 'rgba(255, 215, 100, 0.25)');
    lightGradient.addColorStop(1, 'rgba(255, 200, 50, 0)');

    ctx.fillStyle = lightGradient;
    ctx.beginPath();
    ctx.moveTo(cellWidth * 0.4, 0);
    ctx.lineTo(cellWidth * 2.8, -cellHeight * 1.1);
    ctx.lineTo(cellWidth * 2.8, cellHeight * 1.1);
    ctx.closePath();
    ctx.fill();

    // Rover Chassis
    const bodyW = cellWidth * 0.85;
    const bodyH = cellHeight * 0.65;

    // Body base (Martian Red Explorer chassis)
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.roundRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH, 4);
    ctx.fill();

    // Top deck plate
    ctx.fillStyle = '#ECEFF1';
    ctx.fillRect(-bodyW * 0.35, -bodyH * 0.35, bodyW * 0.6, bodyH * 0.7);

    // Solar Panels
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(-bodyW * 0.42, -bodyH * 0.4, bodyW * 0.2, bodyH * 0.8);

    // Front Mast Camera
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.arc(bodyW * 0.32, 0, cellHeight * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(bodyW * 0.36, 0, cellHeight * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#1A1A1A';
    const wheelW = bodyW * 0.24;
    const wheelH = bodyH * 0.22;
    const wheelOffsets = [-bodyW * 0.32, 0, bodyW * 0.32];

    wheelOffsets.forEach((ox) => {
      ctx.fillRect(ox - wheelW / 2, -bodyH / 2 - wheelH * 0.8, wheelW, wheelH);
      ctx.fillRect(ox - wheelW / 2, bodyH / 2 - wheelH * 0.2, wheelW, wheelH);
    });

    ctx.restore();
  }, [map, rover]);

  return (
    <div className="relative w-full aspect-[45/23] rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        width={1440}
        height={736}
        onClick={onCanvasClick}
        className="w-full h-full object-contain block rounded-xl cursor-crosshair"
      />
    </div>
  );
}