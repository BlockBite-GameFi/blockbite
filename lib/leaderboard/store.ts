export interface LeaderboardEntry {
  walletAddress: string;
  score: number;
  level: number;
  submittedAt: number;
}

// In-memory leaderboard — warm-instance cache, synced to KV on writes.
// Survives within a single Vercel function instance (warm start).
export const LEADERBOARD = new Map<string, LeaderboardEntry>();

async function getKV() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

const LB_KEY = 'blockbite:leaderboard';

/** Persist a new or improved score to KV and update the in-memory cache. */
export async function recordScore(entry: LeaderboardEntry): Promise<void> {
  const existing = LEADERBOARD.get(entry.walletAddress);
  if (existing && existing.score >= entry.score) return; // no improvement

  LEADERBOARD.set(entry.walletAddress, entry);

  const kv = await getKV();
  if (!kv) return;
  // Store as a flat hash field keyed by wallet address
  await kv.hset(LB_KEY, { [entry.walletAddress]: JSON.stringify(entry) });
}

/** Load persisted leaderboard from KV into the in-memory cache (called on cold start). */
export async function hydrateFromKV(): Promise<void> {
  if (LEADERBOARD.size > 0) return; // already warm
  const kv = await getKV();
  if (!kv) return;
  try {
    const raw = await kv.hgetall<Record<string, string>>(LB_KEY);
    if (!raw) return;
    for (const [wallet, json] of Object.entries(raw)) {
      try {
        const entry: LeaderboardEntry = JSON.parse(json);
        LEADERBOARD.set(wallet, entry);
      } catch { /* skip malformed */ }
    }
  } catch { /* KV unavailable, continue with empty */ }
}
