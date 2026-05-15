'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameEngine, canPlace } from '@/lib/game/engine';
import { BOARD_ROWS, BOARD_COLS, CELL_SIZE, CELL_GAP, BLOCK_COLORS, TICKET_COST_USDC, MAX_GAME_LEVEL, getLevelThreshold, getLevelTier } from '@/lib/game/constants';
import {
  drawBoard, drawGhostPiece, drawScorePop, drawParticles,
  createParticlesForClear, updateParticles, Particle, roundRect,
  drawShockwave, Shockwave, drawIdleBackground, createIdleBlocks
} from '@/lib/game/renderer';
import { formatScore } from '@/lib/game/scoring';
import { Piece } from '@/lib/game/pieces';
import { getStageName } from '@/lib/game/stages';
import MysteryBoxModal from './MysteryBoxModal';
import { BoxResult } from '@/lib/game/mysteryBox';
import { reportError } from '@/lib/analytics/errorReporter';
import styles from './GameCanvas.module.css';

const BOARD_PX = BOARD_COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
const BOARD_PY = BOARD_ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
const TRAY_CELL = 28;
const TRAY_GAP = 2;

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
      const radius = Math.max(4, cellSize * 0.12);

      // HDR Glow
      ctx.shadowColor = selected ? palette.glow : 'transparent';
      ctx.shadowBlur = selected ? 25 : 0;

      // Gradient fill (HDR Ultra)
      const grad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
      grad.addColorStop(0, canPlace_ ? palette.gradStart : '#2A2A3E');
      grad.addColorStop(0.5, canPlace_ ? palette.gradEnd : '#1A1A2E');
      grad.addColorStop(1, canPlace_ ? palette.gradEnd : '#12122A');
      
      ctx.beginPath();
      roundRect(ctx, x, y, cellSize, cellSize, radius);
      ctx.fillStyle = grad;
      ctx.fill();

      // Inner highlight
      const hlGrad = ctx.createLinearGradient(x, y, x + cellSize * 0.7, y + cellSize * 0.7);
      hlGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
      hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      roundRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, radius - 1);
      ctx.fillStyle = hlGrad;
      ctx.fill();
    }
  }

  // Selected ring (Neon animated look)
  if (selected) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = palette.gradStart;
    ctx.strokeStyle = palette.gradStart;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = (Date.now() / 30) % 12;
    ctx.beginPath();
    roundRect(ctx, startX - 6, startY - 6, totalW + 12, totalH + 12, 10);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export default function GameCanvas({ initialLevel = 1, onBack }: { initialLevel?: number; onBack?: () => void }) {
  const { connected, publicKey } = useWallet();
  const [ticketBalance, setTicketBalance] = useState<number | null>(null);
  const [isCheckingTicket, setIsCheckingTicket] = useState(false);
  // Tracks whether the player has consumed a ticket and a live session is
  // running. We can't rely on `state.score === 0` because a fresh game also
  // starts at score 0 — without this flag the START overlay never hides.
  const [hasStartedGame, setHasStartedGame] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const clearFlashRef = useRef<{ progress: number; rows: number[]; cols: number[] } | null>(null);
  const shakeRef = useRef(0);
  const idleBlocksRef = useRef<any[]>([]);

  const [selectedTray, setSelectedTray] = useState<0 | 1 | 2 | null>(null);
  const [ghostPos, setGhostPos] = useState<{ row: number; col: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPiece, setDragPiece] = useState<{ trayIdx: 0|1|2; mouseX: number; mouseY: number } | null>(null);

  const { state, placePiece, newGame, newGameAt, clearAnimationDone, removeScorePop, mysteryBoxPicked, levelName } = useGameEngine(initialLevel);
  const sessionTokenRef = useRef<string | null>(null);

  // Board origin
  const originX = 12;
  const originY = 12;

  // Tray layout
  const TRAY_Y = originY + BOARD_PY + 40;
  const CANVAS_W = BOARD_PX + 24;
  const CANVAS_H = TRAY_Y + 130;

  useEffect(() => {
    if (connected && publicKey) {
      setIsCheckingTicket(true);
      const addr = publicKey.toBase58();
      const saved = localStorage.getItem(`tickets_${addr}`);
      if (saved !== null) {
        setTicketBalance(parseInt(saved));
      } else {
        // First-time wallet: auto-gift 5 free starter tickets (bb_free_gifted flag)
        const giftFlag = `bb_free_gifted_${addr}`;
        if (!localStorage.getItem(giftFlag)) {
          localStorage.setItem(`tickets_${addr}`, '5');
          localStorage.setItem(giftFlag, '1');
          setTicketBalance(5);
        } else {
          setTicketBalance(0);
        }
      }
      setIsCheckingTicket(false);
    }
  }, [connected, publicKey]);

  const handleStartGame = async () => {
    if (!connected || !publicKey) return;
    if (ticketBalance && ticketBalance > 0) {
      const newBal = ticketBalance - 1;
      setTicketBalance(newBal);
      localStorage.setItem(`tickets_${publicKey.toBase58()}`, newBal.toString());
      // Hide the START overlay immediately — synchronous state update so the
      // user gets instant visual feedback even before the async session POST.
      setHasStartedGame(true);
      // Start a server-side session so the submit endpoint can validate the score
      try {
        const res = await fetch('/api/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: publicKey.toBase58(), level: initialLevel }),
        });
        if (res.ok) {
          const data = await res.json();
          sessionTokenRef.current = data.token ?? null;
        }
      } catch { /* non-fatal — game proceeds without server session */ }
      if (initialLevel > 1) {
        newGameAt(initialLevel);
      } else {
        newGame();
      }
    }
  };

  const gameOverHandledRef = useRef(false);
  useEffect(() => {
    if (state.isGameOver && !gameOverHandledRef.current && connected && publicKey) {
      gameOverHandledRef.current = true;
      reportError({
        severity: 'info',
        message: `Game over at ${getStageName(state.level)} — score ${state.score}`,
        level: state.level,
        sessionId: state.sessionId,
        walletAddress: publicKey.toBase58(),
        component: 'GameCanvas',
      });
      // Advance map progress: move to next map level after playing
      if (state.score > 0) {
        const prevMapLevel = parseInt(localStorage.getItem('bb_max_level') ?? '1');
        if (initialLevel >= prevMapLevel) {
          localStorage.setItem('bb_max_level', String(initialLevel + 1));
        }
        const prevGames = parseInt(localStorage.getItem('bb_games_played') ?? '0');
        localStorage.setItem('bb_games_played', String(prevGames + 1));
      }

      // Submit score to leaderboard API (placements no longer sent — server-computed)
      if (sessionTokenRef.current) {
        fetch('/api/session/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: sessionTokenRef.current,
            score: state.score,
            level: initialLevel,
            walletAddress: publicKey.toBase58(),
          }),
        }).catch(() => { /* best-effort */ });
      }
    }
    if (!state.isGameOver) gameOverHandledRef.current = false;
    // When the engine declares game over, allow the START overlay back so the
    // player can buy another ticket and play again.
    if (state.isGameOver) setHasStartedGame(false);
  }, [state.isGameOver, connected, publicKey, state.level, state.score, state.sessionId, state.placements]);

  const handleMysteryBoxResult = useCallback((result: BoxResult) => {
    mysteryBoxPicked(result.halvScore, result.pointsDelta, result.nextMultiplier);
  }, [mysteryBoxPicked]);

  // Initialize idle blocks
  useEffect(() => {
    idleBlocksRef.current = createIdleBlocks(CANVAS_W, CANVAS_H);
  }, [CANVAS_W, CANVAS_H]);

  const traySlotX = (idx: number) => {
    const spacing = CANVAS_W / 3;
    return spacing * idx + spacing / 2;
  };

  function getBoardCell(mouseX: number, mouseY: number): { row: number; col: number } | null {
    const cellTotal = CELL_SIZE + CELL_GAP;
    const col = Math.floor((mouseX - originX) / cellTotal);
    const row = Math.floor((mouseY - originY) / cellTotal);
    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return null;
    return { row, col };
  }

  function getCanvasPos(e: any): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if (e.touches) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX;
      clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function getTraySlot(x: number, y: number): 0 | 1 | 2 | null {
    if (y < TRAY_Y - 40 || y > TRAY_Y + 120) return null;
    for (let i = 0; i < 3; i++) {
      const cx = traySlotX(i);
      if (Math.abs(x - cx) < 60) return i as 0 | 1 | 2;
    }
    return null;
  }

  const handleCanvasClick = useCallback((e: any) => {
    if (state.isGameOver || state.isPaused) return;
    const { x, y } = getCanvasPos(e);
    const traySlot = getTraySlot(x, y);
    if (traySlot !== null && state.tray[traySlot] !== null) {
      setSelectedTray(traySlot);
      setGhostPos(null);
      return;
    }
    const cell = getBoardCell(x, y);
    if (cell && selectedTray !== null) {
      const piece = state.tray[selectedTray];
      if (!piece) return;
      const row = Math.max(0, Math.min(cell.row, BOARD_ROWS - piece.shape.length));
      const col = Math.max(0, Math.min(cell.col, BOARD_COLS - piece.shape[0].length));
      if (canPlace(state.board, piece.shape, row, col)) {
        placePiece(selectedTray, row, col);
        setSelectedTray(null);
        setGhostPos(null);
      }
    }
  }, [state, selectedTray, placePiece]);

  const handleMouseMove = useCallback((e: any) => {
    if (state.isGameOver || selectedTray === null) return;
    const { x, y } = getCanvasPos(e);
    const cell = getBoardCell(x, y);
    if (cell) {
      const piece = state.tray[selectedTray];
      if (piece) {
        const row = Math.max(0, Math.min(cell.row, BOARD_ROWS - piece.shape.length));
        const col = Math.max(0, Math.min(cell.col, BOARD_COLS - piece.shape[0].length));
        setGhostPos({ row, col });
      }
    } else {
      setGhostPos(null);
    }
  }, [state, selectedTray]);

  const handleMouseDown = useCallback((e: any) => {
    if (state.isGameOver) return;
    const { x, y } = getCanvasPos(e);
    const traySlot = getTraySlot(x, y);
    if (traySlot !== null && state.tray[traySlot] !== null) {
      setDragPiece({ trayIdx: traySlot, mouseX: x, mouseY: y });
      setSelectedTray(traySlot);
      setIsDragging(true);
    }
  }, [state]);

  const handleMouseUp = useCallback((e: any) => {
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

  // Effects for clear animation
  useEffect(() => {
    if (state.clearAnimation) {
      const { rows, cols } = state.clearAnimation;
      particlesRef.current = [...particlesRef.current, ...createParticlesForClear(rows, cols, originX, originY)];
      
      rows.forEach(r => shockwavesRef.current.push({ x: originX + BOARD_PX / 2, y: originY + r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2, r: 20, life: 1.0 }));
      cols.forEach(c => shockwavesRef.current.push({ x: originX + c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2, y: originY + BOARD_PY / 2, r: 20, life: 1.0 }));

      clearFlashRef.current = { progress: 0, rows, cols };
      shakeRef.current = (rows.length + cols.length) >= 4 ? 15 : 8;
      
      const timer = setTimeout(() => {
        clearFlashRef.current = null;
        clearAnimationDone();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [state.clearAnimation, clearAnimationDone]);

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
      drawIdleBackground(ctx, idleBlocksRef.current, time, CANVAS_W, CANVAS_H);

      let shakeX = 0, shakeY = 0;
      if (shakeRef.current > 0) {
        shakeX = (Math.random() - 0.5) * shakeRef.current;
        shakeY = (Math.random() - 0.5) * shakeRef.current;
        shakeRef.current = Math.max(0, shakeRef.current - 0.6);
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);
      shockwavesRef.current = shockwavesRef.current.map(s => ({ ...s, r: s.r + dt * 0.5, life: s.life - dt * 0.002 })).filter(s => s.life > 0);
      shockwavesRef.current.forEach(s => drawShockwave(ctx, s));

      let flashAlpha = 0, flashRows: number[] = [], flashCols: number[] = [];
      if (clearFlashRef.current) {
        clearFlashRef.current.progress = Math.min(1, clearFlashRef.current.progress + dt / 400);
        flashAlpha = clearFlashRef.current.progress;
        flashRows = clearFlashRef.current.rows;
        flashCols = clearFlashRef.current.cols;
      }

      drawBoard(ctx, state.board, originX, originY, flashRows, flashCols, flashAlpha);

      if (selectedTray !== null && ghostPos) {
        const piece = state.tray[selectedTray];
        if (piece) {
          const valid = canPlace(state.board, piece.shape, ghostPos.row, ghostPos.col);
          drawGhostPiece(ctx, piece.shape, piece.color, ghostPos.row, ghostPos.col, originX, originY, valid);
        }
      }

      particlesRef.current = updateParticles(particlesRef.current);
      drawParticles(ctx, particlesRef.current);

      ctx.save();
      ctx.fillStyle = 'rgba(6, 6, 20, 0.88)';
      ctx.beginPath();
      roundRect(ctx, 0, TRAY_Y - 20, CANVAS_W, 150, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < 3; i++) {
        const piece = state.tray[i];
        const cx = traySlotX(i);
        const cy = TRAY_Y + 45;
        const isSelected = selectedTray === i;

        if (!piece) {
          ctx.save();
          ctx.globalAlpha = 0.1;
          ctx.strokeStyle = '#8888BB';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          roundRect(ctx, cx - 30, cy - 30, 60, 60, 10);
          ctx.stroke();
          ctx.restore();
          continue;
        }

        const scale = isSelected ? 1.15 : 1.0;
        drawTrayPiece(ctx, piece, cx, cy, TRAY_CELL, isSelected, true, scale);
        
        ctx.font = `600 12px 'Orbitron'`;
        ctx.fillStyle = isSelected ? '#00F5FF' : '#444466';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, cx, TRAY_Y + 110);
      }

      const now = Date.now();
      state.scorePops.forEach(pop => {
        const progress = Math.min((now - pop.startTime) / 1500, 1);
        drawScorePop(ctx, pop.label, pop.points, CANVAS_W * pop.x, CANVAS_H * pop.y, progress);
        if (progress >= 1) removeScorePop(pop.id);
      });

      if (state.isGameOver) {
        // Dim overlay
        ctx.fillStyle = 'rgba(6,6,20,0.88)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Game-over card
        const cardW = CANVAS_W - 48, cardH = 180, cardX = 24, cardY = CANVAS_H / 2 - 110;
        ctx.fillStyle = 'rgba(255,51,102,0.08)';
        ctx.strokeStyle = 'rgba(255,51,102,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        roundRect(ctx, cardX, cardY, cardW, cardH, 16);
        ctx.fill(); ctx.stroke();

        ctx.textAlign = 'center';

        // Title
        ctx.font = `900 32px 'Orbitron'`;
        ctx.fillStyle = '#FF3366';
        ctx.shadowBlur = 24; ctx.shadowColor = '#FF3366';
        ctx.fillText('GAME OVER', CANVAS_W / 2, cardY + 48);
        ctx.shadowBlur = 0;

        // Score
        ctx.font = `700 20px 'Orbitron'`;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(formatScore(state.score), CANVAS_W / 2, cardY + 84);
        ctx.font = `500 11px 'Plus Jakarta Sans'`;
        ctx.fillStyle = '#8888BB';
        ctx.fillText('FINAL SCORE', CANVAS_W / 2, cardY + 100);

        // Level name
        ctx.font = `600 12px 'Plus Jakarta Sans'`;
        ctx.fillStyle = '#00F5FF';
        ctx.fillText(`Reached: Level ${state.level}`, CANVAS_W / 2, cardY + 130);

        // Hint
        ctx.font = `500 11px 'Plus Jakarta Sans'`;
        ctx.fillStyle = '#555577';
        ctx.fillText('Your score has been submitted to the leaderboard', CANVAS_W / 2, cardY + 154);
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, selectedTray, ghostPos, isDragging, dragPiece, CANVAS_W, CANVAS_H, TRAY_Y]);

  const handleEsc = useCallback((e: any) => {
    if (e.key === 'Escape') setSelectedTray(null);
    if (e.key >= '1' && e.key <= '3') {
      const idx = (parseInt(e.key) - 1) as 0 | 1 | 2;
      if (state.tray[idx]) setSelectedTray(idx);
    }
  }, [state.tray]);

  useEffect(() => {
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleEsc]);

  // UI Overlays
  if (!connected) {
    return (
      <div className={styles.overlay}>
        <h2 className={`orbitron neon-cyan ${styles.overlayTitle}`}>CONNECT WALLET</h2>
        <p className={styles.overlayBody}>
          Use the <strong style={{ color: '#00F5FF' }}>Connect Wallet</strong> button above to get started.
          BlockBite runs on <strong style={{ color: '#00FF88' }}>Solana</strong> — supported wallets:
        </p>
        <div className={styles.walletIcons}>
          {['Phantom', 'Solflare', 'Backpack'].map((name) => (
            <div key={name} className={styles.walletChip}>
              <span>{name}</span>
            </div>
          ))}
        </div>
        <Link href="/" className="btn btn-secondary" style={{ marginTop: 8 }}>BACK TO HOME</Link>
      </div>
    );
  }

  if (isCheckingTicket) {
    return (
      <div className={styles.overlay}>
        <div className="spinner" />
        <p className="orbitron" style={{ marginTop: '20px' }}>VERIFYING TICKETS...</p>
      </div>
    );
  }

  if (state.score === 0 && !state.isGameOver && (ticketBalance === 0 || ticketBalance === null)) {
    return (
      <div className={styles.overlay}>
        <div className={styles.noTickets}>
          <h2 className="orbitron neon-magenta" style={{ marginBottom: '8px' }}>NO TICKETS FOUND</h2>
          <p style={{ color: '#8888BB', marginBottom: '24px' }}>Tickets are required to play and earn rewards.</p>
          <div className={styles.priceTag}>1 TICKET = {TICKET_COST_USDC} USDC</div>
          <Link href="/shop" className="btn btn-primary btn-lg" style={{ marginTop: '20px' }}>BUY TICKETS</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Mystery Box overlay — auto-shows when pendingMysteryBox=true */}
      {state.pendingMysteryBox && (
        <MysteryBoxModal
          level={state.level}
          currentScore={state.score}
          picksInSession={state.mysteryBoxPicks}
          onResult={handleMysteryBoxResult}
        />
      )}
      <div className={styles.hud}>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>SCORE</span>
          <span className={styles.hudValue}>{formatScore(state.score)}</span>
        </div>
        <div className={styles.hudCenter}>
          <span className={styles.levelBadge} title={getLevelTier(state.level)}>LVL {state.level}</span>
          {levelName && (
            <span style={{ fontSize: 10, color: '#8888BB', fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 2, letterSpacing: '0.04em', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {levelName}
            </span>
          )}
          <div className={styles.levelProgressBar}>
            {(() => {
              const prev = state.level <= 1 ? 0 : getLevelThreshold(state.level - 1);
              const next = state.level >= MAX_GAME_LEVEL ? state.score : getLevelThreshold(state.level);
              const span = Math.max(1, next - prev);
              const pct = Math.min(100, Math.max(0, ((state.score - prev) / span) * 100));
              return <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />;
            })()}
          </div>
          {state.chain > 1 && (
            <div className={styles.chainBadge}>
              <span className={styles.chainIcon}>x</span>
              <span>×{state.chain} CHAIN</span>
            </div>
          )}
        </div>
        <div className={styles.hudStat} style={{ textAlign: 'right' }}>
          <span className={styles.hudLabel}>BEST SCORE</span>
          <span className={styles.hudValue}>{formatScore(state.bestScore)}</span>
        </div>
      </div>

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

      <div className={styles.hint}>
        <span className={styles.hintKey}>1-3</span> SELECT PIECE · <span className={styles.hintKey}>CLICK</span> BOARD TO PLACE · <span className={styles.hintKey}>ESC</span> DESELECT
      </div>

      {(state.isGameOver || (!hasStartedGame && ticketBalance !== null && ticketBalance > 0)) && (
        <div className={styles.gameOverActions}>
          <button type="button" className="btn btn-primary btn-lg" onClick={handleStartGame}>
            {state.isGameOver ? 'PLAY AGAIN (1 TICKET)' : 'START GAME (1 TICKET)'}
          </button>
          {onBack ? (
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              BACK TO MAP
            </button>
          ) : (
            <Link href="/leaderboard" className="btn btn-secondary">
              LEADERBOARD
            </Link>
          )}
        </div>
      )}

      {/* No-tickets dead-end: connected but ran out, and we're not in or done with a game.
          Without this overlay the canvas just sits there with no way forward. */}
      {!hasStartedGame && !state.isGameOver && connected && ticketBalance === 0 && (
        <div className={styles.gameOverActions}>
          <Link href="/shop" className="btn btn-primary btn-lg">
            GET TICKETS →
          </Link>
          {onBack && (
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              BACK TO MAP
            </button>
          )}
        </div>
      )}
    </div>
  );
}
