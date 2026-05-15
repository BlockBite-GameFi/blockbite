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

const SESSION_SECRET = process.env.SESSION_SECRET;
// True upper-bound per placement — see security audit comment in constants.ts
const MAX_SCORE_PER_MOVE = 200_000;

function verifyToken(token: string): { walletAddress: string; expiresAt: number; nonce: string } | null {
  try {
    if (!SESSION_SECRET) return null;
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('|');
    // Support new 6-part format (with nonce) and legacy 5-part format
    if (parts.length === 6) {
      const [sessionId, wallet, , expiresAt, nonce, sig] = parts;
      const payload = `${sessionId}|${wallet}|${parts[2]}|${expiresAt}|${nonce}`;
      const expected = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
      if (sig !== expected) return null;
      return { walletAddress: wallet, expiresAt: Number(expiresAt), nonce };
    }
    if (parts.length === 5) {
      // Legacy tokens (issued before nonce was added) — no replay protection
      const [sessionId, wallet, , expiresAt, sig] = parts;
      const payload = `${sessionId}|${wallet}|${parts[2]}|${expiresAt}`;
      const expected = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
      if (sig !== expected) return null;
      return { walletAddress: wallet, expiresAt: Number(expiresAt), nonce: '' };
    }
    return null;
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

  // 4. Nonce replay protection (only for new-format tokens with a nonce)
  if (session.nonce) {
    const nonceKey = `blockbite:nonce:${session.nonce}`;
    try {
      const { kv } = await import('@vercel/kv');
      const used = await kv.get(nonceKey);
      if (used) return NextResponse.json({ error: 'Session already submitted' }, { status: 409 });
      const ttl = Math.ceil((session.expiresAt - Date.now()) / 1000) + 60;
      await kv.set(nonceKey, 1, { ex: ttl > 0 ? ttl : 3600 });
    } catch { /* KV unavailable — allow through in dev */ }
  }

  // 5. Plausibility
  const maxPlausibleScore = (placements + 1) * MAX_SCORE_PER_MOVE;
  if (score < 0 || score > maxPlausibleScore) {
    return NextResponse.json({ error: 'Score implausible' }, { status: 422 });
  }

  // Persist to KV (best score per wallet) + update in-memory cache
  await recordScore({ walletAddress, score, level, submittedAt: Date.now() });

  return NextResponse.json({ ok: true, recorded: true });
}
