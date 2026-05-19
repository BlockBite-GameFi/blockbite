/**
 * Leaderboard store — double database:
 *   Layer 1 (KV hash)        : best score per wallet  → fast O(1) lookup
 *   Layer 2 (KV sorted sets) : period leaderboards    → Monthly / Daily / All-Time tabs
 *   Layer 3 (txSignature)    : Solana memo proof      → on-chain audit trail
 *
 * Sorted set keys:
 *   bb:lb:all            – all-time best score per wallet
 *   bb:lb:YYYY-MM        – monthly best score per wallet
 *   bb:lb:YYYY-MM-DD     – daily best score per wallet
 *
 * Metadata hash:
 *   bb:lb:meta           – wallet → full LeaderboardEntry JSON
 */

export interface LeaderboardEntry {
  walletAddress: string;
  score: number;
  level: number;
  submittedAt: number;
  txSignature?: string; // Solana memo tx — blockchain proof layer
}

// In-memory cache (warm-instance, per serverless instance)
export const LEADERBOARD = new Map<string, LeaderboardEntry>();

async function getKV() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

const LB_HASH_KEY = 'blockbite:leaderboard'; // legacy hash key (kept for compat)
const LB_META_KEY = 'bb:lb:meta';

function periodKeys(ts: number) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return {
    all:     'bb:lb:all',
    monthly: `bb:lb:${y}-${m}`,
    daily:   `bb:lb:${y}-${m}-${day}`,
  };
}

/** Persist a score to all storage layers. Always updates period sorted sets. */
export async function recordScore(entry: LeaderboardEntry): Promise<void> {
  const existing = LEADERBOARD.get(entry.walletAddress);
  const isBest = !existing || existing.score < entry.score;

  // Update in-memory best score cache
  if (isBest) {
    LEADERBOARD.set(entry.walletAddress, entry);
  }

  const kv = await getKV();
  if (!kv) return;

  const keys = periodKeys(entry.submittedAt);

  await Promise.allSettled([
    // Layer 1: best score hash (legacy compat)
    isBest
      ? kv.hset(LB_HASH_KEY, { [entry.walletAddress]: JSON.stringify(entry) })
      : Promise.resolve(),

    // Layer 2a: all-time sorted set (GT = only update if new score is higher)
    // @vercel/kv v3 signature: zadd(key, opts, scoreMember) — opts is separate arg
    kv.zadd(keys.all,     { gt: true }, { score: entry.score, member: entry.walletAddress }),

    // Layer 2b: monthly sorted set
    kv.zadd(keys.monthly, { gt: true }, { score: entry.score, member: entry.walletAddress }),

    // Layer 2c: daily sorted set
    kv.zadd(keys.daily,   { gt: true }, { score: entry.score, member: entry.walletAddress }),

    // Layer 3: metadata hash (always update to latest entry)
    kv.hset(LB_META_KEY, { [entry.walletAddress]: JSON.stringify(entry) }),
  ]);
}

/** Load persisted best scores from KV into in-memory cache (cold start). */
export async function hydrateFromKV(): Promise<void> {
  if (LEADERBOARD.size > 0) return;
  const kv = await getKV();
  if (!kv) return;
  try {
    const raw = await kv.hgetall<Record<string, string>>(LB_HASH_KEY);
    if (!raw) return;
    for (const [wallet, json] of Object.entries(raw)) {
      try {
        LEADERBOARD.set(wallet, JSON.parse(json));
      } catch { /* skip malformed */ }
    }
  } catch { /* KV unavailable */ }
}

/**
 * Read top-N scores for a given period directly from sorted sets.
 * Falls back to in-memory LEADERBOARD for 'all' if KV unavailable.
 */
export async function getTopScores(
  period: 'all' | 'monthly' | 'daily',
  limit = 20,
): Promise<LeaderboardEntry[]> {
  const kv = await getKV();

  if (!kv) {
    // In-memory fallback (all-time only)
    return [...LEADERBOARD.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  const keys = periodKeys(Date.now());
  const setKey = period === 'monthly' ? keys.monthly
    : period === 'daily'   ? keys.daily
    : keys.all;

  try {
    // ZRANGE ... REV LIMIT — top N by score descending
    const wallets = await kv.zrange(setKey, 0, limit - 1, { rev: true });
    if (!wallets || wallets.length === 0) return [];

    // Bulk-fetch metadata
    const metaRaw = await kv.hmget(LB_META_KEY, ...(wallets as string[]));
    if (!metaRaw) return [];

    return (wallets as string[]).map((wallet, i) => {
      try {
        const raw = Array.isArray(metaRaw) ? metaRaw[i] : (metaRaw as Record<string,unknown>)[wallet];
        if (!raw) return null;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return parsed as LeaderboardEntry;
      } catch {
        return null;
      }
    }).filter(Boolean) as LeaderboardEntry[];
  } catch {
    // Sorted set unavailable — fall back to hash
    await hydrateFromKV();
    return [...LEADERBOARD.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
