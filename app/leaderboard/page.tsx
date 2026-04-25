'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import PrizePoolCounter from '@/components/PrizePoolCounter';
import Countdown from '@/components/Countdown';
import {
  MOCK_LEADERBOARD,
  MOCK_PRIZE_POOL_USDC,
  PRIZE_DISTRIBUTION,
} from '@/lib/game/constants';
import { calculateEstimatedReward } from '@/lib/solana/prizes';
import styles from './leaderboard.module.css';

const GameBackground = dynamic(() => import('@/components/GameBackground'), { ssr: false });

const TABS = ['Monthly', 'All-Time', 'Daily', 'Whale Room'] as const;
type Tab = typeof TABS[number];

/** Format a prize tier's rank range as a readable string. */
function rankLabel(rank: number | [number, number]): string {
  if (typeof rank === 'number') return `RANK ${rank}`;
  const [a, b] = rank;
  if (b === -1) return `RANK ${a}+`;
  return `RANK ${a}–${b}`;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Monthly');

  return (
    <main className={styles.main}>
      <Navbar />
      <GameBackground />
      <div className="grid-overlay"></div>
      
      <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
        {/* Header Section */}
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="badge badge-gold" style={{ marginBottom: '16px' }}>SEASON 1 LIVE</div>
          <h1 className="orbitron neon-gold" style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginBottom: '16px' }}>
            HALL OF FAME
          </h1>
          <p style={{ color: '#8888BB', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            The elite arena where strategy meets rewards. Top 10 take the pool every month —
            smart-contract-enforced payouts, zero middlemen.
          </p>
        </header>

        {/* Prize Pool Highlight */}
        <div className={styles.statsGrid}>
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ color: '#55557A', fontSize: '12px', letterSpacing: '2px', marginBottom: '10px' }}>CURRENT POOL</div>
            <PrizePoolCounter size="lg" />
          </div>
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ color: '#55557A', fontSize: '12px', letterSpacing: '2px', marginBottom: '10px' }}>MONTHLY RESET IN</div>
            <Countdown size="lg" />
          </div>
        </div>

        {/* Prize Tiers */}
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '40px' }}>
          <h3 className="orbitron neon-cyan" style={{ fontSize: '14px', marginBottom: '8px' }}>PRIZE DISTRIBUTION</h3>
          <p style={{ color: '#8888BB', fontSize: '12px', marginBottom: '24px' }}>
            Top-10 competitive payouts + ticket-weighted participation bucket.
            All distributions settled on-chain via a single <code style={{ color: '#E0C5FF' }}>distribute_rewards</code> instruction.
          </p>
          <div className={styles.prizeGrid}>
            {PRIZE_DISTRIBUTION.map((tier, i) => (
              <div key={i} className={styles.prizeCard}>
                <span style={{ color: '#55557A' }}>{rankLabel(tier.rank)}</span>
                <span className="neon-green" style={{ fontWeight: '800' }}>{tier.pct}%</span>
                <span style={{ fontSize: '11px', opacity: 0.6 }}>
                  ≈ {(MOCK_PRIZE_POOL_USDC * tier.pct / 100).toFixed(0)} USDC · {tier.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Selector */}
        <div className={styles.tabContainer}>
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'Monthly' ? '📅 MONTHLY' : tab === 'All-Time' ? '🏆 ALL-TIME' : tab === 'Daily' ? '⚡ DAILY' : '🐋 WHALE ROOM'}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className={styles.tableHeader}>
            <span>RANK</span>
            <span>PLAYER</span>
            <span style={{ textAlign: 'right' }}>SCORE</span>
            <span style={{ textAlign: 'right' }}>EST. REWARD</span>
          </div>

          <div className={styles.tableBody}>
            {MOCK_LEADERBOARD.map((player) => {
              const reward = calculateEstimatedReward(player.rank, MOCK_PRIZE_POOL_USDC);
              const isTop = player.rank <= 3;
              
              return (
                <div key={player.rank} className={`${styles.tableRow} ${isTop ? styles.rowTop : ''}`}>
                  <div className={styles.rankCol}>
                    <span className={styles.rankNum}>#{player.rank}</span>
                  </div>
                  <div className={styles.playerCol}>
                    <div style={{ fontWeight: '700', color: isTop ? '#FFFFFF' : '#CCCCCC' }}>
                      {player.username || player.wallet.slice(0, 8) + '...'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#55557A' }}>{player.wallet}</div>
                  </div>
                  <div style={{ textAlign: 'right' }} className="neon-cyan orbitron">
                    {player.score.toLocaleString()}
                  </div>
                  <div style={{ textAlign: 'right' }} className="neon-gold orbitron">
                    ${reward.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className={styles.tableFooter}>
            <p>Leaderboard updates every 5 minutes · Monthly snapshot taken on the 1st, 00:00 UTC · Distributed automatically via smart contract</p>
          </div>
        </div>
      </div>
    </main>
  );
}
