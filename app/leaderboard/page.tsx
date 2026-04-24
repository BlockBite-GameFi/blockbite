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
import styles from './leaderboard.module.css';

const GameBackground = dynamic(() => import('@/components/GameBackground'), { ssr: false });

const TABS = ['Weekly', 'All-Time', 'Daily', 'Whale Room'] as const;
type Tab = typeof TABS[number];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Weekly');

  const prizeForRank = (rank: number): number => {
    if (rank === 1) return MOCK_PRIZE_POOL_USDC * 0.20;
    if (rank === 2) return MOCK_PRIZE_POOL_USDC * 0.12;
    if (rank === 3) return MOCK_PRIZE_POOL_USDC * 0.08;
    if (rank <= 5)  return MOCK_PRIZE_POOL_USDC * 0.05;
    if (rank <= 10) return MOCK_PRIZE_POOL_USDC * 0.03;
    return 0;
  };

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
            The elite arena where strategy meets rewards. Compete against the best players 
            on Solana for your share of the weekly USDC prize pool.
          </p>
        </header>

        {/* Prize Pool Highlight */}
        <div className={styles.statsGrid}>
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ color: '#55557A', fontSize: '12px', letterSpacing: '2px', marginBottom: '10px' }}>CURRENT POOL</div>
            <PrizePoolCounter size="lg" />
          </div>
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ color: '#55557A', fontSize: '12px', letterSpacing: '2px', marginBottom: '10px' }}>POOL ENDS IN</div>
            <Countdown size="lg" />
          </div>
        </div>

        {/* Prize Tiers */}
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '40px' }}>
          <h3 className="orbitron neon-cyan" style={{ fontSize: '14px', marginBottom: '24px' }}>PRIZE DISTRIBUTION</h3>
          <div className={styles.prizeGrid}>
            {PRIZE_DISTRIBUTION.map((tier) => (
              <div key={tier.rank} className={styles.prizeCard}>
                <span style={{ color: '#55557A' }}>RANK {tier.rank}</span>
                <span className="neon-green" style={{ fontWeight: '800' }}>{tier.pct}%</span>
                <span style={{ fontSize: '11px', opacity: 0.6 }}>≈ {(MOCK_PRIZE_POOL_USDC * tier.pct / 100).toFixed(0)} USDC</span>
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
              {tab}
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
              const reward = player.estimatedReward ?? prizeForRank(player.rank);
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
            <p>Leaderboard updates every 5 minutes · Final snapshots taken every Sunday 00:00 UTC</p>
          </div>
        </div>
      </div>
    </main>
  );
}
