/**
 * Server-only: game authority keypair + in-memory session store.
 *
 * Keypair priority:
 *   1. GAME_AUTHORITY_SECRET_KEY env var (base58 64-byte secret key)
 *   2. Deterministic demo seed (devnet only — safe, no real value)
 *
 * Session store uses globalThis so warm lambda re-uses keep sessions alive.
 * On cold-start or different lambda, sessions are not found — verify still
 * succeeds on devnet by trusting claimed level (acceptable for demo).
 */

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// ASCII "BlockBiteGameAuthDevnet123456789" — 32 bytes, deterministic devnet demo seed
const DEMO_SEED = new Uint8Array([
  66,108,111,99,107,66,105,116,101,71,97,109,101,65,117,116,
  104,68,101,118,110,101,116,49,50,51,52,53,54,55,56,57,
]);

function buildKeypair(): Keypair {
  const secret = process.env.GAME_AUTHORITY_SECRET_KEY;
  if (secret) {
    try {
      const decoded = bs58.decode(secret);
      if (decoded.length === 64) return Keypair.fromSecretKey(decoded);
      if (decoded.length === 32) return Keypair.fromSeed(decoded);
    } catch {
      console.warn('[game-authority] Invalid GAME_AUTHORITY_SECRET_KEY — using demo seed');
    }
  }
  return Keypair.fromSeed(DEMO_SEED);
}

export const gameAuthorityKeypair: Keypair = buildKeypair();

// ── In-memory session store (warm lambda only) ────────────────────────────────
export interface GameSession {
  userId:       string;
  sessionId:    string;
  achievedLevel: number;
  completedAt:  number;
}

const g = globalThis as typeof globalThis & { _bbGameSessions?: Map<string, GameSession> };
if (!g._bbGameSessions) g._bbGameSessions = new Map();

export const gameSessions: Map<string, GameSession> = g._bbGameSessions;

export function storeSession(userId: string, sessionId: string, level: number): void {
  gameSessions.set(sessionId, { userId, sessionId, achievedLevel: level, completedAt: Date.now() });
  // Keep max 500 sessions to avoid memory leak
  if (gameSessions.size > 500) {
    const firstKey = gameSessions.keys().next().value;
    if (firstKey) gameSessions.delete(firstKey);
  }
}

export function validateSession(userId: string, sessionId: string, claimedLevel: number): boolean {
  const session = gameSessions.get(sessionId);
  // If session not found (cold start / different lambda), trust client for devnet demo
  if (!session) return true;
  return session.userId === userId && session.achievedLevel >= claimedLevel;
}
