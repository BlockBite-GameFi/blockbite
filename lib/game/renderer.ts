// ═══════════════════════════════════════════════════════════════
// BLOCKBLAST — CANVAS RENDERER (HDR ULTRA EDITION)
// All drawing routines: blocks, board, animations, particles
// ═══════════════════════════════════════════════════════════════

import { BLOCK_COLORS, BlockColor, CELL_SIZE, CELL_GAP, BOARD_ROWS, BOARD_COLS } from './constants';
import { Cell } from './constants';

// ── Block Rendering ──────────────────────────────────────────────

/**
 * Draw a single block at canvas pixel (x, y)
 * Includes: gradient, inner highlight, colored drop shadow, border radius
 */
export function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: BlockColor,
  alpha = 1.0,
  scale = 1.0,
  glowing = false,
): void {
  const palette = BLOCK_COLORS[color];
  const s = size * scale;
  const offset = (size - s) / 2;
  const px = x + offset;
  const py = y + offset;
  const r = Math.max(6, size * 0.12); // border radius (increased for modern look)

  ctx.save();
  ctx.globalAlpha = alpha;

  // Premium colored drop shadow (HDR effect)
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = glowing ? 30 : 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  // Main gradient fill (3-stop feel)
  const grad = ctx.createLinearGradient(px, py, px + s, py + s);
  grad.addColorStop(0, palette.gradStart);
  grad.addColorStop(0.5, palette.gradEnd);
  grad.addColorStop(1, palette.gradEnd);

  ctx.beginPath();
  roundRect(ctx, px, py, s, s, r);
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner highlight (top-left glossy sheen - HDR Ultra style)
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const hlGrad = ctx.createLinearGradient(px, py, px + s * 0.7, py + s * 0.7);
  hlGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
  hlGrad.addColorStop(0.4, 'rgba(255,255,255,0.1)');
  hlGrad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.beginPath();
  roundRect(ctx, px + 3, py + 3, s - 6, s - 6, r - 1);
  ctx.fillStyle = hlGrad;
  ctx.fill();

  // Outer stroke (subtle neon border)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Extra bloom for selected/hover
  if (glowing) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = palette.gradStart;
    ctx.lineWidth = 3;
    ctx.shadowColor = palette.gradStart;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    roundRect(ctx, px, py, s, s, r);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw an obstacle block (gray, rough look)
 */
export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha = 1.0,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;

  const r = Math.max(4, size * 0.1);
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, '#444466');
  grad.addColorStop(1, '#1A1A2E');

  ctx.beginPath();
  roundRect(ctx, x, y, size, size, r);
  ctx.fillStyle = grad;
  ctx.fill();

  // Brushed metal effect
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 4; i < size; i += 6) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + 2);
    ctx.lineTo(x + i, y + size - 2);
    ctx.stroke();
  }

  // Cross pattern (reinforced)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 6);
  ctx.lineTo(x + size - 6, y + size - 6);
  ctx.moveTo(x + size - 6, y + 6);
  ctx.lineTo(x + 6, y + size - 6);
  ctx.stroke();

  ctx.restore();
}

// ── Board Rendering ──────────────────────────────────────────────

/**
 * Draw the empty 8×8 grid background
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
): void {
  const cellTotal = CELL_SIZE + CELL_GAP;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const x = originX + c * cellTotal;
      const y = originY + r * cellTotal;
      const isAlt = (r + c) % 2 === 0;

      ctx.beginPath();
      roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 6);
      ctx.fillStyle = isAlt
        ? 'rgba(255,255,255,0.03)'
        : 'rgba(255,255,255,0.02)';
      ctx.fill();
      
      // Subtle inner shadow for cells
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

/**
 * Draw the full board (grid + all placed blocks)
 */
export function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: Cell[][],
  originX: number,
  originY: number,
  highlightRows: number[] = [],
  highlightCols: number[] = [],
  flashAlpha = 0,
): void {
  const cellTotal = CELL_SIZE + CELL_GAP;
  drawGrid(ctx, originX, originY);

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = board[r][c];
      const x = originX + c * cellTotal;
      const y = originY + r * cellTotal;

      if (cell.type === 'block' && cell.color) {
        const isClearing = highlightRows.includes(r) || highlightCols.includes(c);
        const alpha = isClearing ? Math.max(0, 1 - flashAlpha) : 1;
        drawBlock(ctx, x, y, CELL_SIZE, cell.color, alpha);
      } else if (cell.type === 'obstacle') {
        drawObstacle(ctx, x, y, CELL_SIZE);
      }

      // HDR Flash overlay for clearing lines
      if ((highlightRows.includes(r) || highlightCols.includes(c)) && flashAlpha > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, flashAlpha * 2);
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.shadowColor = '#00F5FF';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 6);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}

// ── Ghost Piece (placement preview) ─────────────────────────────

export function drawGhostPiece(
  ctx: CanvasRenderingContext2D,
  shape: number[][],
  color: BlockColor,
  row: number,
  col: number,
  originX: number,
  originY: number,
  valid: boolean,
): void {
  const cellTotal = CELL_SIZE + CELL_GAP;
  const palette = BLOCK_COLORS[color];

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) {
        const x = originX + (col + c) * cellTotal;
        const y = originY + (row + r) * cellTotal;

        ctx.save();
        ctx.globalAlpha = valid ? 0.45 : 0.2;
        ctx.beginPath();
        roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 8);
        ctx.fillStyle = valid ? palette.gradStart : '#FF3366';
        ctx.fill();

        if (valid) {
          ctx.strokeStyle = palette.gradStart;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.restore();
      }
    }
  }
}

// ── Floating Score Pop ───────────────────────────────────────────

export function drawScorePop(
  ctx: CanvasRenderingContext2D,
  label: string,
  points: number,
  cx: number,
  cy: number,
  progress: number, // 0→1
): void {
  const alpha = progress < 0.2
    ? progress / 0.2
    : progress > 0.8
      ? 1 - (progress - 0.8) / 0.2
      : 1;
  const yOffset = progress * -100;
  const scale = progress < 0.2 ? 0.7 + progress * 1.5 : 1.0;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy + yOffset);
  ctx.scale(scale, scale);

  // Points text (High visibility)
  ctx.font = `bold 36px 'Orbitron', monospace`;
  ctx.fillStyle = '#00FF88';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,255,136,1)';
  ctx.shadowBlur = 25;
  ctx.fillText(`+${points.toLocaleString()}`, 0, 0);

  // Label below points
  if (label) {
    ctx.font = `bold 16px 'Orbitron', sans-serif`;
    ctx.fillStyle = '#00F5FF';
    ctx.shadowColor = 'rgba(0,245,255,0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(label.toUpperCase(), 0, 36);
  }

  ctx.restore();
}

// ── Particle System ──────────────────────────────────────────────

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number; // 0→1 remaining life
  decay: number;
  glow: boolean;
}

export interface Shockwave {
  x: number;
  y: number;
  r: number;
  life: number;
}

export function createParticlesForClear(
  rows: number[],
  cols: number[],
  originX: number,
  originY: number,
): Particle[] {
  const particles: Particle[] = [];
  const cellTotal = CELL_SIZE + CELL_GAP;

  const positions: { x: number; y: number; color: string }[] = [];
  for (const r of rows) {
    for (let c = 0; c < BOARD_COLS; c++) {
      positions.push({
        x: originX + c * cellTotal + CELL_SIZE / 2,
        y: originY + r * cellTotal + CELL_SIZE / 2,
        color: `hsl(${180 + Math.random() * 60}, 100%, 70%)`, // Cyan-themed particles
      });
    }
  }
  for (const col of cols) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      if (!rows.includes(r)) {
        positions.push({
          x: originX + col * cellTotal + CELL_SIZE / 2,
          y: originY + r * cellTotal + CELL_SIZE / 2,
          color: `hsl(${300 + Math.random() * 60}, 100%, 70%)`, // Magenta-themed particles
        });
      }
    }
  }

  for (const pos of positions) {
    const count = 10 + Math.floor(Math.random() * 8); // Increased density
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: pos.color,
        size: 3 + Math.random() * 5,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.01,
        glow: Math.random() > 0.3,
      });
    }
  }
  return particles;
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.15, // gravity
      vx: p.vx * 0.97, // drag
      life: p.life - p.decay,
    }))
    .filter(p => p.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  ctx.save();
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    
    if (p.glow) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawShockwave(ctx: CanvasRenderingContext2D, wave: Shockwave): void {
  ctx.save();
  ctx.globalAlpha = wave.life;
  ctx.strokeStyle = '#00F5FF';
  ctx.lineWidth = 4 * wave.life;
  ctx.shadowColor = '#00F5FF';
  ctx.shadowBlur = 20;
  
  ctx.beginPath();
  ctx.arc(wave.x, wave.y, wave.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ── Idle Background (parallax floating blocks) ───────────────────

interface IdleBlock {
  x: number;
  y: number;
  size: number;
  color: BlockColor;
  speed: number;
  phase: number;
  rotation: number;
  rotSpeed: number;
}

const COLORS: BlockColor[] = ['fire', 'ice', 'nature', 'thunder', 'shadow', 'crystal', 'void'];

export function createIdleBlocks(width: number, height: number, count = 22): IdleBlock[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 30 + Math.random() * 50,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speed: 0.2 + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.005,
  }));
}

export function drawIdleBackground(
  ctx: CanvasRenderingContext2D,
  blocks: IdleBlock[],
  time: number,
  width: number,
  height: number,
): void {
  for (const b of blocks) {
    const yOff = Math.sin(time * b.speed * 0.001 + b.phase) * 15;
    const alpha = 0.05 + Math.abs(Math.sin(time * 0.0003 + b.phase)) * 0.05;

    ctx.save();
    ctx.translate(b.x, b.y + yOff);
    ctx.rotate(b.rotation + time * b.rotSpeed);
    ctx.globalAlpha = alpha;

    const palette = BLOCK_COLORS[b.color];
    const grad = ctx.createLinearGradient(-b.size / 2, -b.size / 2, b.size / 2, b.size / 2);
    grad.addColorStop(0, palette.gradStart);
    grad.addColorStop(1, palette.gradEnd);

    ctx.beginPath();
    roundRect(ctx, -b.size / 2, -b.size / 2, b.size, b.size, 10);
    ctx.fillStyle = grad;
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();

    // Slowly move block upward, reset when offscreen
    b.y -= b.speed * 0.3;
    if (b.y + b.size < -50) {
      b.y = height + b.size + 50;
      b.x = Math.random() * width;
    }
  }
}

// ── Utility: roundRect (polyfill for older canvas implementations) ─

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
