'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useGameEngine, canPlace } from '@/lib/game/engine';
import { BOARD_ROWS, BOARD_COLS, CELL_SIZE, CELL_GAP, BLOCK_COLORS } from '@/lib/game/constants';
import {
  drawBoard, drawGhostPiece, drawScorePop, drawParticles,
  createParticlesForClear, updateParticles, Particle, roundRect
} from '@/lib/game/renderer';
import { formatScore } from '@/lib/game/scoring';
import { Piece } from '@/lib/game/pieces';
import styles from './GameCanvas.module.css';

const BOARD_PX = BOARD_COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
const BOARD_PY = BOARD_ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
const TRAY_CELL = 28;
const TRAY_GAP = 2;

function getPieceCanvasSize(shape: number[][]): { w: number; h: number } {
  return {
    w: shape[0].length * (TRAY_CELL + TRAY_GAP),
    h: shape.length * (TRAY_CELL + TRAY_GAP),
  };
}

function drawTrayPiece(
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  cx: number,
  cy: number,
  cellSize: number,
  selected: boolean,
  canPlace_: boolean,
  scale = 1,
): void {
  const { shape, color } = piece;
  const rows = shape.length;
  const cols = shape[0].length;
  const totalW = cols * (cellSize + TRAY_GAP) - TRAY_GAP;
  const totalH = rows * (cellSize + TRAY_GAP) - TRAY_GAP;
  const startX = cx - totalW / 2;
  const startY = cy - totalH / 2;
  const palette = BLOCK_COLORS[color];

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shape[r][c] !== 1) continue;
      const x = startX + c * (cellSize + TRAY_GAP);
      const y = startY + r * (cellSize + TRAY_GAP);
      const radius = Math.max(2, cellSize * 0.1);

      // Shadow/glow
      ctx.shadowColor = selected ? palette.glow : 'transparent';
      ctx.shadowBlur = selected ? 20 : 0;

      // Gradient fill
      const grad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
      grad.addColorStop(0, canPlace_ ? palette.gradStart : '#333355');
      grad.addColorStop(1, canPlace_ ? palette.gradEnd : '#222244');
      ctx.beginPath();
      roundRect(ctx, x, y, cellSize, cellSize, radius);
      ctx.fillStyle = grad;
      ctx.fill();

      // Inner highlight
      const hlGrad = ctx.createLinearGradient(x, y, x + cellSize * 0.6, y + cellSize * 0.6);
      hlGrad.addColorStop(0, palette.highlight);
      hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      roundRect(ctx, x + 1, y + 1, cellSize - 2, cellSize - 2, radius - 1);
      ctx.fillStyle = hlGrad;
      ctx.fill();
    }
  }

  // Selected ring
  if (selected) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = palette.gradStart;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    roundRect(ctx, startX - 4, startY - 4, totalW + 8, totalH + 8, 8);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const clearFlashRef = useRef<{ progress: number; rows: number[]; cols: number[] } | null>(null);
  const shakeRef = useRef(0);

  const [selectedTray, setSelectedTray] = useState<0 | 1 | 2 | null>(null);
  const [ghostPos, setGhostPos] = useState<{ row: number; col: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPiece, setDragPiece] = useState<{ trayIdx: 0|1|2; mouseX: number; mouseY: number } | null>(null);

  const { state, placePiece, newGame, clearAnimationDone, removeScorePop } = useGameEngine();

  // Board origin on canvas
  const originX = 8;
  const originY = 8;

  // Tray layout (3 slots below board)
  const TRAY_Y = originY + BOARD_PY + 32;
  const CANVAS_W = BOARD_PX + 16;
  const CANVAS_H = TRAY_Y + 120;

  const traySlotX = (idx: number) => {
    const spacing = CANVAS_W / 3;
    return spacing * idx + spacing / 2;
  };

  // Convert canvas mouse coords to board cell
  function getBoardCell(mouseX: number, mouseY: number): { row: number; col: number } | null {
    const cellTotal = CELL_SIZE + CELL_GAP;
    const col = Math.floor((mouseX - originX) / cellTotal);
    const row = Math.floor((mouseY - originY) / cellTotal);
    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return null;
    return { row, col };
  }

  // Get scaled mouse position relative to canvas
  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement> | MouseEvent | React.TouchEvent<HTMLCanvasElement> | TouchEvent): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? (e as any).changedTouches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? (e as any).changedTouches[0]?.clientY ?? 0;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  // Check if click is in tray slot
  function getTraySlot(x: number, y: number): 0 | 1 | 2 | null {
    if (y < TRAY_Y - 50 || y > TRAY_Y + 100) return null;
    for (let i = 0; i < 3; i++) {
      const cx = traySlotX(i);
      if (Math.abs(x - cx) < 55) return i as 0 | 1 | 2;
    }
    return null;
  }

  // Handle canvas click (tap-to-select + tap-to-place)
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.isGameOver || state.isPaused) return;
    const { x, y } = getCanvasPos(e);

    // Click on tray?
    const traySlot = getTraySlot(x, y);
    if (traySlot !== null && state.tray[traySlot] !== null) {
      setSelectedTray(traySlot);
      setGhostPos(null);
      return;
    }

    // Click on board?
    const cell = getBoardCell(x, y);
    if (cell && selectedTray !== null) {
      const piece = state.tray[selectedTray];
      if (!piece) return;
      // Adjust placement so piece top-left is near cursor center
      const adjustedRow = Math.max(0, Math.min(cell.row, BOARD_ROWS - piece.shape.length));
      const adjustedCol = Math.max(0, Math.min(cell.col, BOARD_COLS - piece.shape[0].length));
      if (canPlace(state.board, piece.shape, adjustedRow, adjustedCol)) {
        placePiece(selectedTray, adjustedRow, adjustedCol);
        setSelectedTray(null);
        setGhostPos(null);
      }
    }
  }, [state, selectedTray, placePiece]);

  // Mouse move for ghost preview
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.isGameOver || selectedTray === null) return;
    const { x, y } = getCanvasPos(e);
    const cell = getBoardCell(x, y);
    if (cell) {
      const piece = state.tray[selectedTray];
      if (!piece) return;
      const row = Math.max(0, Math.min(cell.row, BOARD_ROWS - piece.shape.length));
      const col = Math.max(0, Math.min(cell.col, BOARD_COLS - piece.shape[0].length));
      setGhostPos({ row, col });
    } else {
      setGhostPos(null);
    }
  }, [state, selectedTray]);

  // Handle drag start from tray
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.isGameOver) return;
    const { x, y } = getCanvasPos(e);
    const traySlot = getTraySlot(x, y);
    if (traySlot !== null && state.tray[traySlot] !== null) {
      setDragPiece({ trayIdx: traySlot, mouseX: x, mouseY: y });
      setSelectedTray(traySlot);
      setIsDragging(true);
    }
  }, [state]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragPiece) return;
    const { x, y } = getCanvasPos(e);
    const cell = getBoardCell(x, y);
    if (cell) {
      const piece = state.tray[dragPiece.trayIdx];
      if (piece) {
        const row = Math.max(0, Math.min(cell.row, BOARD_ROWS - piece.shape.length));
        const col = Math.max(0, Math.min(cell.col, BOARD_COLS - piece.shape[0].length));
        if (canPlace(state.board, piece.shape, row, col)) {
          placePiece(dragPiece.trayIdx, row, col);
          setSelectedTray(null);
          setGhostPos(null);
        }
      }
    }
    setIsDragging(false);
    setDragPiece(null);
  }, [isDragging, dragPiece, state, placePiece]);

  // Handle clear animation trigger
  useEffect(() => {
    if (state.clearAnimation) {
      const { rows, cols } = state.clearAnimation;
      // Add particles
      particlesRef.current = [
        ...particlesRef.current,
        ...createParticlesForClear(rows, cols, originX, originY),
      ];
      clearFlashRef.current = { progress: 0, rows, cols };
      // Shake on 3+ lines
      if (rows.length + cols.length >= 3) {
        shakeRef.current = rows.length + cols.length >= 5 ? 12 : 6;
      }
      const timer = setTimeout(() => {
        clearFlashRef.current = null;
        clearAnimationDone();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [state.clearAnimation, clearAnimationDone]);

  // Dismiss score pops after duration
  useEffect(() => {
    state.scorePops.forEach(pop => {
      const remaining = 1500 - (Date.now() - pop.startTime);
      if (remaining > 0) {
        const t = setTimeout(() => removeScorePop(pop.id), remaining);
        return () => clearTimeout(t);
      } else {
        removeScorePop(pop.id);
      }
    });
  }, [state.scorePops, removeScorePop]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let lastTime = 0;

    function render(time: number) {
      const dt = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Shake effect
      let shakeX = 0, shakeY = 0;
      if (shakeRef.current > 0) {
        shakeX = (Math.random() - 0.5) * shakeRef.current;
        shakeY = (Math.random() - 0.5) * shakeRef.current;
        shakeRef.current = Math.max(0, shakeRef.current - 0.8);
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Update flash
      let flashAlpha = 0;
      let flashRows: number[] = [], flashCols: number[] = [];
      if (clearFlashRef.current) {
        clearFlashRef.current.progress = Math.min(1, clearFlashRef.current.progress + dt / 400);
        flashAlpha = clearFlashRef.current.progress;
        flashRows = clearFlashRef.current.rows;
        flashCols = clearFlashRef.current.cols;
      }

      // Draw board
      drawBoard(ctx, state.board, originX, originY, flashRows, flashCols, flashAlpha);

      // Draw ghost
      if (selectedTray !== null && ghostPos) {
        const piece = state.tray[selectedTray];
        if (piece) {
          const valid = canPlace(state.board, piece.shape, ghostPos.row, ghostPos.col);
          drawGhostPiece(ctx, piece.shape, piece.color, ghostPos.row, ghostPos.col, originX, originY, valid);
        }
      }

      // Draw drag preview
      if (isDragging && dragPiece) {
        // Ghost already handles this via ghostPos
      }

      // Draw particles
      particlesRef.current = updateParticles(particlesRef.current);
      drawParticles(ctx, particlesRef.current);

      // Draw tray background
      const trayBg = ctx.createLinearGradient(0, TRAY_Y - 16, 0, TRAY_Y + 110);
      trayBg.addColorStop(0, 'rgba(255,255,255,0)');
      trayBg.addColorStop(0.2, 'rgba(18,18,42,0.95)');
      trayBg.addColorStop(1, 'rgba(18,18,42,0.95)');
      ctx.fillStyle = trayBg;
      ctx.fillRect(0, TRAY_Y - 16, CANVAS_W, 136);

      // Tray divider line
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, TRAY_Y - 16);
      ctx.lineTo(CANVAS_W, TRAY_Y - 16);
      ctx.stroke();

      // Draw 3 tray pieces
      for (let i = 0; i < 3; i++) {
        const piece = state.tray[i] as Piece | null;
        const cx = traySlotX(i);
        const cy = TRAY_Y + 40;
        const isSelected = selectedTray === i;

        if (!piece) {
          // Empty slot indicator
          ctx.save();
          ctx.globalAlpha = 0.2;
          ctx.strokeStyle = '#8888BB';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          roundRect(ctx, cx - 28, cy - 28, 56, 56, 8);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
          continue;
        }

        // Check if this piece can be placed anywhere
        const canPlaceAnywhere_ = true; // simplified for performance

        // Slot background glow on selected
        if (isSelected) {
          ctx.save();
          const palette = BLOCK_COLORS[piece.color];
          ctx.shadowColor = palette.glow;
          ctx.shadowBlur = 30;
          ctx.fillStyle = `rgba(${hexToRgb(palette.gradStart)}, 0.05)`;
          ctx.beginPath();
          roundRect(ctx, cx - 52, cy - 52, 104, 90, 12);
          ctx.fill();
          ctx.restore();
        }

        const pieceScale = isSelected ? 1.1 : 1.0;
        drawTrayPiece(ctx, piece, cx, cy, TRAY_CELL, isSelected, canPlaceAnywhere_, pieceScale);

        // Slot number label
        ctx.save();
        ctx.font = `500 11px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = isSelected ? '#00F5FF' : '#33337A';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, cx, TRAY_Y + 98);
        ctx.restore();
      }

      // Draw score pops
      const now = Date.now();
      for (const pop of state.scorePops) {
        const elapsed = now - pop.startTime;
        const progress = Math.min(elapsed / 1500, 1);
        drawScorePop(
          ctx,
          pop.label,
          pop.points,
          CANVAS_W * pop.x,
          CANVAS_H * pop.y,
          progress,
        );
      }

      // Game over overlay
      if (state.isGameOver) {
        ctx.save();
        ctx.fillStyle = 'rgba(10,10,26,0.85)';
        ctx.fillRect(0, 0, CANVAS_W, TRAY_Y);

        // Game Over text
        ctx.font = `bold 32px 'Orbitron', monospace`;
        ctx.fillStyle = '#FF3366';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255,51,102,0.8)';
        ctx.shadowBlur = 30;
        ctx.fillText('GAME OVER', CANVAS_W / 2, BOARD_PY / 2 - 30);

        ctx.font = `bold 22px 'Orbitron', monospace`;
        ctx.fillStyle = '#00FF88';
        ctx.shadowColor = 'rgba(0,255,136,0.6)';
        ctx.shadowBlur = 20;
        ctx.fillText(formatScore(state.score), CANVAS_W / 2, BOARD_PY / 2 + 10);

        ctx.font = `500 14px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = '#8888BB';
        ctx.shadowBlur = 0;
        ctx.fillText('FINAL SCORE', CANVAS_W / 2, BOARD_PY / 2 - 60);

        ctx.restore();
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, selectedTray, ghostPos, isDragging, dragPiece, CANVAS_W, CANVAS_H, TRAY_Y]);

  function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setSelectedTray(null);
    if (e.key >= '1' && e.key <= '3') {
      const idx = parseInt(e.key) - 1 as 0 | 1 | 2;
      if (state.tray[idx]) setSelectedTray(idx);
    }
  }, [state.tray]);

  useEffect(() => {
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleEsc]);

  return (
    <div className={styles.wrapper}>
      {/* HUD */}
      <div className={styles.hud}>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>SCORE</span>
          <span className={styles.hudValue} id="game-score">{formatScore(state.score)}</span>
        </div>
        <div className={styles.hudCenter}>
          <span className={styles.levelBadge}>LVL {state.level}</span>
          {state.chain > 1 && (
            <span className={styles.chainBadge}>🔗 ×{state.chain} CHAIN</span>
          )}
        </div>
        <div className={styles.hudStat} style={{ textAlign: 'right' }}>
          <span className={styles.hudLabel}>BEST</span>
          <span className={styles.hudValue}>{formatScore(state.bestScore)}</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className={styles.canvas}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ cursor: selectedTray !== null ? 'crosshair' : 'default' }}
      />

      {/* Controls hint */}
      <div className={styles.hint}>
        Click piece tray (1/2/3) → click board to place · ESC to deselect
      </div>

      {/* Game Over actions */}
      {state.isGameOver && (
        <div className={styles.gameOverActions}>
          <button className="btn btn-primary btn-lg" onClick={newGame} id="game-play-again">
            ▶ Play Again
          </button>
          <Link href="/leaderboard" className="btn btn-ghost">
            View Leaderboard
          </Link>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const text = `I just scored ${formatScore(state.score)} on BlockBlast Web3! 🎮 Can you beat me? Join the weekly prize pool at https://nngblockblast.vercel.app`;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
            }}
            id="game-share-score"
          >
            Share on X 𝕏
          </button>
        </div>
      )}
    </div>
  );
}
