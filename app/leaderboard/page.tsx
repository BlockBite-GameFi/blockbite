'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import PrizePoolCounter from '@/components/PrizePoolCounter';
import Countdown from '@/components/Countdown';
import { PRIZE_DISTRIBUTION } from '@/lib/game/constants';
import styles from './leaderboard.module.css';

const GameBackground = dynamic(() => import('@/components/GameBackground'), { ssr: false });

const TABS = ['Monthly', 'All-Time', 'Daily', 'Whale Room'] as const;
type Tab = typeof TABS[number];

interface LiveEntry {
  rank: number;
  walletAddress: string;
  score: number;
  level: number;
  submittedAt: number;
}

function rankLabel(rank: number | [number, number]): string {
  if (typeof rank === 'number') return `RANK ${rank}`;
  const [a, b] = rank;
  if (b === -1) return `RANK ${a}+`;
  return `RANK ${a}–${b}`;
}

function shortWallet(addr: string) {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

const TAB_ICONS: Record<Tab, string> = {
  Monthly: '📅',
  'All-Time': '🏆',
  Daily: '⚡',
  'Whale Room': '🐋',
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Monthly');
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/leaderboard?limit=20')
      .then(r => r.ok ? r.json() : { entries: [] })
      .then(data => setEntries(Array.isArray(data.entries) ? data.entries : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.main}>
      <Navbar />
      <GameBackground />
      <div className="grid-overlay" />

      <div className="container" style={{ paddingTop: 100, paddingBottom: 100 }}>

        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="badge badge-gold" style={{ marginBottom: 16 }}>SEASON 1 · PHASE 0</div>
          <h1 className="orbitron neon-gold" style={{ fontSize: 'clamp(32px,8vw,64px)', marginBottom: 16 }}>
            HALL OF FAME
          </h1>
          <p style={{ color: '#8888BB', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Top players split the prize pool every month — smart-contract payouts, zero middlemen.
            <br />
            <span style={{ fontSize: 12, color: '#444466' }}>
              Phase 0 · Devnet · No real funds at risk
            </span>
          </p>
        </header>

        {/* Pool + Timer */}
        <div className={styles.statsGrid}>
          <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ color: '#55557A', fontSize: 12, letterSpacing: 2, marginBottom: 10 }}>CURRENT POOL</div>
            <PrizePoolCounter size="lg" />
          </div>
          <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ color: '#55557A', fontSize: 12, letterSpacing: 2, marginBottom: 10 }}>MONTHLY RESET IN</div>
            <Countdown size="lg" />
          </div>
        </div>

        {/* Prize Tiers */}
        <div className="glass-panel" style={{ padding: 32, marginBottom: 40 }}>
          <h3 className="orbitron neon-cyan" style={{ fontSize: 14, marginBottom: 8 }}>PRIZE DISTRIBUTION</h3>
          <p style={{ color: '#8888BB', fontSize: 12, marginBottom: 24 }}>
            On-chain distribution via <code style={{ color: '#E0C5FF' }}>distribute_rewards</code> instruction · Settled automatically at month end.
          </p>
          <div className={styles.prizeGrid}>
            {PRIZE_DISTRIBUTION.map((tier, i) => (
              <div key={i} className={styles.prizeCard}>
                <span style={{ color: '#55557A' }}>{rankLabel(tier.rank)}</span>
                <span className="neon-green" style={{ fontWeight: 800 }}>{tier.pct}%</span>
                <span style={{ fontSize: 11, opacity: 0.6 }}>{tier.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabContainer}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_ICONS[tab]} {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className={styles.tableHeader}>
            <span>RANK</span>
            <span>PLAYER</span>
            <span style={{ textAlign: 'right' }}>SCORE</span>
            <span style={{ textAlign: 'right' }}>EST. REWARD</span>
          </div>

          <div className={styles.tableBody}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: '#55557A' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <p className="orbitron" style={{ fontSize: 13 }}>LOADING SCORES...</p>
              </div>
            )}

            {!loading && entries.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
                <h3 className="orbitron neon-cyan" style={{ fontSize: 18, marginBottom: 12 }}>
                  NO SCORES YET
                </h3>
                <p style={{ color: '#55557A', fontSize: 14, marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
                  Be the first to claim the top spot. Play a game and submit your score to appear here.
                </p>
                <a href="/game" className="btn btn-primary">PLAY NOW →</a>
              </div>
            )}

            {!loading && entries.map((entry, i) => {
              const isTop = entry.rank <= 3;
              const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
              return (
                <div key={entry.walletAddress} className={`${styles.tableRow} ${isTop ? styles.rowTop : ''}`}>
                  <div className={styles.rankCol}>
                    <span className={styles.rankNum} style={{ color: isTop ? rankColors[i] : undefined }}>
                      #{entry.rank}
                    </span>
                  </div>
                  <div className={styles.playerCol}>
                    <div style={{ fontWeight: 700, color: isTop ? '#FFFFFF' : '#CCCCCC', fontFamily: "'Orbitron', monospace", fontSize: 13 }}>
                      {shortWallet(entry.walletAddress)}
                    </div>
                    <div style={{ fontSize: 11, color: '#55557A' }}>Level {entry.level}</div>
                  </div>
                  <div style={{ textAlign: 'right' }} className="neon-cyan orbitron">
                    {entry.score.toLocaleString()}
                  </div>
                  <div style={{ textAlign: 'right', color: '#55557A', fontFamily: "'Orbitron', monospace", fontSize: 12 }}>
                    —
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.tableFooter}>
            <p>
              Leaderboard updates in real time · Monthly snapshot on the 1st, 00:00 UTC ·
              Rewards distributed on-chain automatically
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
