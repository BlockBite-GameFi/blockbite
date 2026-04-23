// ═══════════════════════════════════════════════════════════════
// BLOCKBLAST — CANVAS RENDERER
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
  const r = Math.max(4, size * 0.08); // border radius

  ctx.save();
  ctx.globalAlpha = alpha;

  // Drop shadow
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = glowing ? 20 : 10;

  // Main gradient fill
  const grad = ctx.createLinearGradient(px, py, px + s, py + s);
  grad.addColorStop(0, palette.gradStart);
  grad.addColorStop(1, palette.gradEnd);

  ctx.beginPath();
  roundRect(ctx, px, py, s, s, r);
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner highlight (top-left glossy sheen)
  ctx.shadowBlur = 0;
  const hlGrad = ctx.createLinearGradient(px, py, px + s * 0.6, py + s * 0.6);
  hlGrad.addColorStop(0, palette.highlight);
  hlGrad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.beginPath();
  roundRect(ctx, px + 2, py + 2, s - 4, s - 4, r - 1);
  ctx.fillStyle = hlGrad;
  ctx.fill();

  // Outer glow for selected/hover
  if (glowing) {
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = 30;
    ctx.strokeStyle = palette.gradStart;
    ctx.lineWidth = 2;
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

  const r = Math.max(3, size * 0.07);
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, '#555577');
  grad.addColorStop(1, '#333355');

  ctx.beginPath();
  roundRect(ctx, x, y, size, size, r);
  ctx.fillStyle = grad;
  ctx.fill();

  // Cross pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 4);
  ctx.lineTo(x + size - 4, y + size - 4);
  ctx.moveTo(x + size - 4, y + 4);
  ctx.lineTo(x + 4, y + size - 4);
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
      roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 4);
      ctx.fillStyle = isAlt
        ? 'rgba(255,255,255,0.025)'
        : 'rgba(255,255,255,0.015)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 0.5;
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

      // Flash overlay for clearing lines
      if ((highlightRows.includes(r) || highlightCols.includes(c)) && flashAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, flashAlpha * 1.5);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 4);
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
        ctx.globalAlpha = valid ? 0.4 : 0.15;
        ctx.beginPath();
        roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 5);
        ctx.fillStyle = valid ? palette.gradStart : '#FF3366';
        ctx.fill();

        if (valid) {
          ctx.strokeStyle = palette.gradStart;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
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
    : progress > 0.7
      ? 1 - (progress - 0.7) / 0.3
      : 1;
  const yOffset = progress * -80;
  const scale = progress < 0.2 ? 0.8 + progress * 1.0 : 1.0;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy + yOffset);
  ctx.scale(scale, scale);

  // Points text
  ctx.font = `bold 28px 'Orbitron', monospace`;
  ctx.fillStyle = '#00FF88';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,255,136,0.8)';
  ctx.shadowBlur = 15;
  ctx.fillText(`+${points.toLocaleString()}`, 0, 0);

  // Label below points
  if (label) {
    ctx.font = `600 14px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#00F5FF';
    ctx.shadowColor = 'rgba(0,245,255,0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(label, 0, 28);
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
        color: `hsl(${Math.random() * 360}, 100%, 70%)`,
      });
    }
  }
  for (const col of cols) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      if (!rows.includes(r)) {
        positions.push({
          x: originX + col * cellTotal + CELL_SIZE / 2,
          y: originY + r * cellTotal + CELL_SIZE / 2,
          color: `hsl(${Math.random() * 360}, 100%, 70%)`,
        });
      }
    }
  }

  for (const pos of positions) {
    const count = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: pos.color,
        size: 2 + Math.random() * 4,
        life: 1.0,
        decay: 0.018 + Math.random() * 0.012,
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
      vy: p.vy + 0.12, // gravity
      vx: p.vx * 0.98, // drag
      life: p.life - p.decay,
    }))
    .filter(p => p.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
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

export function createIdleBlocks(width: number, height: number, count = 18): IdleBlock[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 20 + Math.random() * 40,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speed: 0.3 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.01,
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
    const yOff = Math.sin(time * b.speed * 0.001 + b.phase) * 12;
    const alpha = 0.08 + Math.abs(Math.sin(time * 0.0004 + b.phase)) * 0.07;

    ctx.save();
    ctx.translate(b.x, b.y + yOff);
    ctx.rotate(b.rotation + time * b.rotSpeed);
    ctx.globalAlpha = alpha;

    const palette = BLOCK_COLORS[b.color];
    const grad = ctx.createLinearGradient(-b.size / 2, -b.size / 2, b.size / 2, b.size / 2);
    grad.addColorStop(0, palette.gradStart);
    grad.addColorStop(1, palette.gradEnd);

    ctx.beginPath();
    roundRect(ctx, -b.size / 2, -b.size / 2, b.size, b.size, 5);
    ctx.fillStyle = grad;
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.restore();

    // Slowly move block upward, reset when offscreen
    b.y -= b.speed * 0.4;
    if (b.y + b.size < 0) {
      b.y = height + b.size;
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
