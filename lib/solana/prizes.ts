/**
 * Prize Pool Distribution Logic — V3 (Option B, top-10 + participation)
 *
 * Ticket revenue split (applied at every ticket purchase):
 *   70% → Prize Pool (monthly)
 *   15% → Team Revenue
 *   10% → Development Fund
 *    5% → Referral Pool
 *
 * Prize Pool distribution (monthly reset, executed on-chain):
 *   Rank 1       → 30%
 *   Rank 2       → 20%
 *   Rank 3       → 10%
 *   Rank 4-10    → 25% split evenly across 7 seats (≈3.5714% each)
 *   Participants → 15% split ticket-weighted across ALL entrants
 *
 * Design rationale:
 *   - Bounded payout set (10 seats + 1 bucket) = constant-gas distribution
 *   - Eliminates long-tail sybil farming (ranks 51-100 micro-rewards)
 *   - Ticket-weighted participation preserves "every player gets something"
 *     without creating a free-for-all exploit vector
 */

export const PRIZE_SPLIT = {
  PRIZE_POOL: 0.70,
  TEAM:       0.15,
  DEV:        0.10,
  REFERRAL:   0.05,
} as const;

/** Rank-based tier shares of the prize pool (as fractions of 1.0). */
export const RANK_SHARES = {
  R1:    0.30,
  R2:    0.20,
  R3:    0.10,
  R4_10: 0.25,  // split evenly across 7 seats
  PART:  0.15,  // ticket-weighted among all participants
} as const;

/** Per-seat share for ranks 4-10. */
export const R4_10_PER_SEAT = RANK_SHARES.R4_10 / 7;

/**
 * Compute estimated reward for a fixed rank (1-10).
 * @param rank       1..10 (anything above returns 0 — use participation calc instead)
 * @param totalPool  total prize pool in the selected token (e.g. USDC)
 */
export function calculateEstimatedReward(rank: number, totalPool: number): number {
  if (rank === 1) return totalPool * RANK_SHARES.R1;
  if (rank === 2) return totalPool * RANK_SHARES.R2;
  if (rank === 3) return totalPool * RANK_SHARES.R3;
  if (rank >= 4 && rank <= 10) return totalPool * R4_10_PER_SEAT;
  return 0;
}

/**
 * Compute this player's share of the participation bucket.
 * @param myTickets     tickets consumed by this wallet in the period
 * @param totalTickets  total tickets consumed across all non-top-10 players
 * @param totalPool     total prize pool in the selected token
 */
export function calculateParticipationReward(
  myTickets: number,
  totalTickets: number,
  totalPool: number,
): number {
  if (totalTickets <= 0 || myTickets <= 0) return 0;
  return totalPool * RANK_SHARES.PART * (myTickets / totalTickets);
}

/**
 * Distribution event the on-chain program emits (one per finalized period).
 * The actual Anchor instruction signature is:
 *   distribute_rewards(period_id: u64, winners: [Pubkey; 10], merkle_root: [u8; 32])
 * where `merkle_root` commits to the ticket-weighted participation list so
 * stragglers can claim trustlessly after the top-10 payout settles.
 */
export interface DistributionReceipt {
  periodId: number;
  prizeMint: string;       // SPL mint address
  totalPool: number;       // denominated in `prizeMint` decimals
  top10: { rank: number; wallet: string; amount: number }[];
  participationRoot: string;  // 32-byte merkle root hex
  settledAt: number;       // unix ms
}
