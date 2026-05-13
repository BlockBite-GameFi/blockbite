/**
 * POST /api/session/submit
 * Called by the client when a game session ends.
 *
 * Body: { token, score, level, placements, walletAddress }
 *
 * Validation:
 *   1. HMAC-SHA256 token signature check
 *   2. Token not expired
 *   3. Wallet in token matches body wallet
 *   4. Plausibility: score ≤ placements × MAX_SCORE_PER_MOVE
 *
 * Scores are persisted to Vercel KV (via recordScore) so they survive cold starts.
 * In-memory LEADERBOARD acts as warm cache for fast reads.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { recordScore } from '@/lib/leaderboard/store';

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'blockbite-dev-secret-changeme';
// True upper-bound per placement — see security audit comment in constants.ts
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

  // 1. Verify token signature
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

  // 4. Plausibility
  const maxPlausibleScore = (placements + 1) * MAX_SCORE_PER_MOVE;
  if (score < 0 || score > maxPlausibleScore) {
    return NextResponse.json({ error: 'Score implausible' }, { status: 422 });
  }

  // Persist to KV (best score per wallet) + update in-memory cache
  await recordScore({ walletAddress, score, level, submittedAt: Date.now() });

  return NextResponse.json({ ok: true, recorded: true });
}
