/**
 * GET /api/leaderboard?limit=10
 * Returns top-N entries sorted by score descending.
 * Backed by Vercel KV (persists across cold starts) with in-memory fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LEADERBOARD, hydrateFromKV } from '@/lib/leaderboard/store';
import { MOCK_LEADERBOARD } from '@/lib/game/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 10)));

  // Hydrate from KV on cold start (no-op if already warm)
  await hydrateFromKV();

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

  // Fall back to mock data only when no real entries exist
  const entries = live.length > 0
    ? live
    : MOCK_LEADERBOARD.slice(0, limit).map(e => ({
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
