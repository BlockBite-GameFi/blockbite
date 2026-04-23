// ═══════════════════════════════════════════════════════════════
// BLOCKBLAST — GAME CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const BOARD_COLS = 8;
export const BOARD_ROWS = 8;
export const CELL_SIZE = 60; // pixels per cell (desktop)
export const CELL_GAP = 3;   // gap between cells

export type BlockColor = 'fire' | 'ice' | 'nature' | 'thunder' | 'shadow' | 'crystal' | 'void';
export type CellType = 'empty' | 'block' | 'obstacle';

export interface Cell {
  type: CellType;
  color?: BlockColor;
}

// ── 7 Block Color Themes ─────────────────────────────────────────
export const BLOCK_COLORS: Record<BlockColor, {
  gradStart: string;
  gradEnd: string;
  glow: string;
  highlight: string;
  name: string;
}> = {
  fire: {
    gradStart: '#FF6B00',
    gradEnd: '#FF0040',
    glow: 'rgba(255, 107, 0, 0.7)',
    highlight: 'rgba(255, 200, 100, 0.4)',
    name: 'FIRE',
  },
  ice: {
    gradStart: '#00C3FF',
    gradEnd: '#0040FF',
    glow: 'rgba(0, 195, 255, 0.7)',
    highlight: 'rgba(180, 240, 255, 0.4)',
    name: 'ICE',
  },
  nature: {
    gradStart: '#00FF88',
    gradEnd: '#00AA44',
    glow: 'rgba(0, 255, 136, 0.7)',
    highlight: 'rgba(160, 255, 200, 0.4)',
    name: 'NATURE',
  },
  thunder: {
    gradStart: '#FFD700',
    gradEnd: '#FF8C00',
    glow: 'rgba(255, 215, 0, 0.7)',
    highlight: 'rgba(255, 245, 150, 0.4)',
    name: 'THUNDER',
  },
  shadow: {
    gradStart: '#AA00FF',
    gradEnd: '#5500AA',
    glow: 'rgba(170, 0, 255, 0.7)',
    highlight: 'rgba(220, 150, 255, 0.4)',
    name: 'SHADOW',
  },
  crystal: {
    gradStart: '#FF00FF',
    gradEnd: '#AA0066',
    glow: 'rgba(255, 0, 255, 0.7)',
    highlight: 'rgba(255, 180, 255, 0.4)',
    name: 'CRYSTAL',
  },
  void: {
    gradStart: '#FFFFFF',
    gradEnd: '#8888AA',
    glow: 'rgba(200, 200, 255, 0.6)',
    highlight: 'rgba(255, 255, 255, 0.5)',
    name: 'VOID',
  },
};

export const COLOR_POOL: BlockColor[] = ['fire', 'ice', 'nature', 'thunder', 'shadow', 'crystal', 'void'];

// ── Scoring Constants ────────────────────────────────────────────
export const POINTS_PER_BLOCK = 10;
export const BLOCKS_PER_LINE = 8; // 8×8 board

export const LINE_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.0,
  4: 3.0,
};
export const PENTA_MULTIPLIER = 5.0;    // 5+ simultaneous clears
export const PERFECT_BOARD_BONUS = 5000;
export const PERFECT_NEXT_MULTIPLIER = 10;
export const LARGE_PIECE_BONUS = 25;    // per block, for pieces with 5+ blocks

export const CHAIN_BONUSES: { threshold: number; multiplier: number }[] = [
  { threshold: 5, multiplier: 2.0 },
  { threshold: 3, multiplier: 1.5 },
  { threshold: 2, multiplier: 1.2 },
];

// ── Level System ─────────────────────────────────────────────────
export const OBSTACLE_SPAWN_LEVEL = 6;  // Obstacles start at level 6
export const OBSTACLE_COUNT_BY_LEVEL: Record<number, number> = {
  6: 10, 7: 12, 8: 13, 9: 14, 10: 15,
};

export const CURSED_MODE_LEVEL = 21;        // Cursed mode starts level 21
export const CURSED_PLACEMENT_TRIGGER = 5;  // Every 5 placements without clear

// ── Game Timing ──────────────────────────────────────────────────
export const ANIMATION_PLACE_MS = 120;
export const ANIMATION_CLEAR_MS = 400;
export const ANIMATION_SCORE_POP_MS = 1500;
export const GAME_LOOP_TARGET_FPS = 60;

// ── Prize Pool (mocked for Phase 0) ──────────────────────────────
export const MOCK_PRIZE_POOL_USDC = 3248.75;
export const MOCK_TICKETS_SOLD = 4641;
export const MOCK_PLAYERS = 1283;
export const MOCK_USDC_DISTRIBUTED = 18420.0;

// ── Weekly Period Duration ────────────────────────────────────────
export const PERIOD_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// next Sunday midnight UTC as the mock end time
function nextSundayMidnight(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const daysUntilSunday = (7 - day) % 7 || 7;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntilSunday);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

export const MOCK_PERIOD_END = nextSundayMidnight();

// ── Distribution Tiers ────────────────────────────────────────────
export const PRIZE_DISTRIBUTION = [
  { rank: '1', pct: 20 },
  { rank: '2', pct: 12 },
  { rank: '3', pct: 8 },
  { rank: '4–5', pct: 5 },     // each
  { rank: '6–10', pct: 3 },    // each
  { rank: '11–20', pct: 1.5 }, // each
  { rank: '21–50', pct: 0.5 }, // each
  { rank: '51–100', pct: 0.1 }, // each
];

// ── Shop Packages ─────────────────────────────────────────────────
export const TICKET_PACKAGES = [
  { id: 'starter',   name: 'Starter',   tickets: 1,   price: 1.00,  pricePerTicket: 1.00,  discount: 0,  bonuses: [] },
  { id: 'explorer',  name: 'Explorer',  tickets: 3,   price: 2.85,  pricePerTicket: 0.95,  discount: 5,  bonuses: ['Explorer badge'] },
  { id: 'warrior',   name: 'Warrior',   tickets: 5,   price: 4.50,  pricePerTicket: 0.90,  discount: 10, bonuses: ['Warrior badge', 'Colored name'] },
  { id: 'hunter',    name: 'Hunter',    tickets: 10,  price: 8.50,  pricePerTicket: 0.85,  discount: 15, bonuses: ['Hunter badge', 'Streak Shield ×1'] },
  { id: 'champion',  name: 'Champion',  tickets: 25,  price: 20.00, pricePerTicket: 0.80,  discount: 20, bonuses: ['Champion badge', 'Early access'] },
  { id: 'legendary', name: 'Legendary', tickets: 50,  price: 37.50, pricePerTicket: 0.75,  discount: 25, bonuses: ['Legendary badge', 'Hall of Fame'] },
  { id: 'godmode',   name: 'GODMODE',   tickets: 100, price: 70.00, pricePerTicket: 0.70,  discount: 30, bonuses: ['GODMODE badge', 'Whale Room access'] },
];

// ── Mock Leaderboard Data ─────────────────────────────────────────
export const MOCK_LEADERBOARD = [
  { rank: 1, wallet: '7xK3...mN9p', username: 'CryptoAce', score: 48250, tickets: 32, badge: 'legendary', estimatedReward: 649.75 },
  { rank: 2, wallet: 'Bx9F...qR2m', username: 'NeonBlaster', score: 43180, tickets: 28, badge: 'champion', estimatedReward: 389.85 },
  { rank: 3, wallet: 'mKp7...xL5t', username: 'PixelKing', score: 41020, tickets: 45, badge: 'godmode', estimatedReward: 259.90 },
  { rank: 4, wallet: 'Wr4X...nD8k', username: 'GridMaster', score: 38750, tickets: 21, badge: 'warrior', estimatedReward: 162.44 },
  { rank: 5, wallet: 'Zq2P...vL6h', username: 'VoidHunter', score: 35900, tickets: 19, badge: 'hunter', estimatedReward: 162.44 },
  { rank: 6, wallet: 'Lm5R...cT3j', username: 'BlockWizard', score: 31250, tickets: 15, badge: 'warrior', estimatedReward: 97.46 },
  { rank: 7, wallet: 'Hq8N...wS2y', username: 'NovaSurge', score: 29800, tickets: 22, badge: 'champion', estimatedReward: 97.46 },
  { rank: 8, wallet: 'Ux3K...bP7m', username: 'StarlightX', score: 27650, tickets: 11, badge: 'hunter', estimatedReward: 97.46 },
  { rank: 9, wallet: 'Rf6T...oE4n', username: null, score: 25430, tickets: 8, badge: 'explorer', estimatedReward: 97.46 },
  { rank: 10, wallet: 'Ck2J...pA9v', username: 'DragonFly', score: 23100, tickets: 17, badge: 'warrior', estimatedReward: 97.46 },
];
