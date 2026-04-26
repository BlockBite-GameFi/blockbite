export interface LeaderboardEntry {
  walletAddress: string;
  score: number;
  level: number;
  submittedAt: number;
}

// In-memory leaderboard — shared at module level (survives warm instances)
// Key: walletAddress, Value: best score entry
// Upgrade path → Vercel KV: replace with kv.zadd / kv.zrange calls
export const LEADERBOARD = new Map<string, LeaderboardEntry>();
