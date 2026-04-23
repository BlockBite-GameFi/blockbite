/**
 * Prize Pool Distribution Logic (0-Modal Philosophy)
 * Fixed Split:
 * 70% - Player Prize Pool (Weekly)
 * 15% - Team Revenue
 * 10% - Development Fund
 * 5%  - Referral Pool
 */

export const PRIZE_SPLIT = {
  PRIZE_POOL: 0.70,
  TEAM: 0.15,
  DEV: 0.10,
  REFERRAL: 0.05,
};

export interface PrizeDistribution {
  rank: number;
  pct: number;
}

export const WEEKLY_DISTRIBUTION_TIERS: PrizeDistribution[] = [
  { rank: 1, pct: 20 },      // 20% of 70% pool
  { rank: 2, pct: 12 },
  { rank: 3, pct: 8 },
  { rank: 4, pct: 5 },
  { rank: 5, pct: 5 },
  { rank: 10, pct: 3 },     // 6-10 share 3% each? or total? Usually total for simplicity in logic
  { rank: 50, pct: 0.5 },   // 11-50 share 
  { rank: 100, pct: 0.2 },  // 51-100 share
];

/**
 * Calculate the estimated reward for a player based on their rank and total pool
 * @param rank Player's current rank
 * @param totalPoolUSDC Total prize pool in USDC
 * @returns Estimated reward in USDC
 */
export function calculateEstimatedReward(rank: number, totalPoolUSDC: number): number {
  const poolShare = totalPoolUSDC; // 70% already accounted for in the display value
  
  if (rank === 1) return poolShare * 0.20;
  if (rank === 2) return poolShare * 0.12;
  if (rank === 3) return poolShare * 0.08;
  if (rank <= 5) return poolShare * 0.05;
  if (rank <= 10) return poolShare * 0.03;
  if (rank <= 50) return poolShare * 0.005;
  if (rank <= 100) return poolShare * 0.002;
  
  return 0;
}
