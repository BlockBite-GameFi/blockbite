/**
 * GET /api/leaderboard?limit=10
 * Returns the current top-N leaderboard entries, sorted by score descending.
 * Backed by the same in-memory Map used by /api/session/submit.
 *
 * Upgrade path → Vercel KV:
 *   const entries = await kv.zrange('lb:scores', 0, limit - 1, { rev: true, withScores: true });
 */

import { NextRequest, NextResponse } from 'next/server';
import { LEADERBOARD } from '@/lib/leaderboard/store';
import { MOCK_LEADERBOARD } from '@/lib/game/constants';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 10)));

  // Use live in-memory entries if any have been submitted this server instance
  const live = [...LEADERBOARD.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((e, i) => ({
      rank: i + 1,
      wallet: e.walletAddress.slice(0, 4) + '...' + e.walletAddress.slice(-4),
      walletFull: e.walletAddress,
      score: e.score,
      level: e.level,
      submittedAt: e.submittedAt,
      live: true,
    }));

  // Fall back to mock data when no live entries exist yet
  const entries = live.length > 0 ? live : MOCK_LEADERBOARD.slice(0, limit).map(e => ({
    rank: e.rank,
    wallet: e.wallet,
    walletFull: null,
    score: e.score,
    level: null,
    submittedAt: null,
    live: false,
  }));

  return NextResponse.json({ entries, total: LEADERBOARD.size });
}
