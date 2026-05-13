/**
 * POST /api/session/submit
 * Called by the client when a game session ends (game over).
 *
 * Body: {
 *   token:         string  — session token from /api/session/start
 *   score:         number
 *   level:         number
 *   placements:    number  — total pieces placed this session
 *   walletAddress: string
 * }
 *
 * Validation:
 *   1. Token signature check (HMAC-SHA256)
 *   2. Token not expired
 *   3. wallet in token matches body wallet
 *   4. Plausibility: score ≤ placements * MAX_SCORE_PER_MOVE
 *
 * Phase 0: stores in-memory (resets on cold start — fine for devnet demo).
 * Upgrade path → Vercel KV: replace in-memory Map with kv.zadd / kv.get calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { LEADERBOARD } from '@/lib/leaderboard/store';

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'blockbite-dev-secret-changeme';
// True upper-bound per placement:
//   - max 16 lines (8 rows + 8 cols) × 8 blocks × 10 pts = 1280 base
//   - PENTA_MULTIPLIER (5.0) × max chain bonus (×2.0) = ×10 total → 12,800
//   - large piece (6 blocks × 25) = 150
//   - perfect-board bonus = 5,000
//   - mystery-box MULTIPLIER can go up to ×10 on any one move
// Absolute ceiling = (12800 + 150 + 5000) × 10 = 179,500 → round up to 200,000
const MAX_SCORE_PER_MOVE = 200_000;

function verifyToken(token: string): { walletAddress: string; expiresAt: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length !== 5) return null;
    const [sessionId, wallet, , expiresAt, sig] = parts;
    const payload = `${sessionId}|${wallet}|${parts[2]}|${expiresAt}`;
    const expected = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    if (sig !== expected) return null;
    return { walletAddress: wallet, expiresAt: Number(expiresAt) };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: {
    token?: string;
    score?: number;
    level?: number;
    placements?: number;
    walletAddress?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token, score, level, placements, walletAddress } = body;
  if (!token || score == null || level == null || placements == null || !walletAddress) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 1. Verify token
  const session = verifyToken(token);
  if (!session) return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });

  // 2. Token expiry
  if (Date.now() > session.expiresAt) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  // 3. Wallet match
  if (session.walletAddress !== walletAddress) {
    return NextResponse.json({ error: 'Wallet mismatch' }, { status: 403 });
  }

  // 4. Plausibility check
  const maxPlausibleScore = (placements + 1) * MAX_SCORE_PER_MOVE;
  if (score < 0 || score > maxPlausibleScore) {
    return NextResponse.json({ error: 'Score implausible' }, { status: 422 });
  }

  // Update leaderboard (keep best score per wallet)
  const existing = LEADERBOARD.get(walletAddress);
  if (!existing || score > existing.score) {
    LEADERBOARD.set(walletAddress, { walletAddress, score, level, submittedAt: Date.now() });
  }

  return NextResponse.json({ ok: true, recorded: true });
}
