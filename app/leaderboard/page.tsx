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
  walletAddress: string; // API returns 'walletAddress' for live entries
  wallet?: string;       // API also returns truncated 'wallet'
  score: number;
  level: number | null;
  submittedAt: number | null;
  live?: boolean;
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
  Monthly: '',
  'All-Time': '',
  Daily: '',
  'Whale Room': '',
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
    <main className={styles.main} style={{ background: 'var(--ds-bg)', color: 'var(--ds-text)' }}>
      <Navbar />

      {/* Header band */}
      <div style={{ padding: '80px 24px 32px', background: 'linear-gradient(180deg, #422006 0%, var(--ds-bg) 100%)', borderBottom: '1px solid #78350f44' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#fbbf24', fontWeight: 800, marginBottom: 8 }}>SEASON 1 · ON-CHAIN</div>
          <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 'clamp(28px,6vw,52px)', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 10 }}>
            Leaderboard
          </h1>
          <p style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 13, color: 'var(--ds-text-dim)', maxWidth: 480, margin: '0 auto' }}>
            Reads PlayerClaim PDAs · refreshes every 30s · rewards distributed on-chain monthly
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 100 }}>

        {/* Header — legacy spacing filler */}
        <header style={{ marginBottom: 40 }}>
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
        <div style={{ padding: 24, marginBottom: 32, background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--ds-accent)', fontWeight: 800, marginBottom: 6 }}>PRIZE DISTRIBUTION</div>
          <p style={{ color: 'var(--ds-text-dim)', fontSize: 12, marginBottom: 20 }}>
            On-chain distribution via <code style={{ color: 'var(--ds-accent2)' }}>distribute_rewards</code> instruction · Settled automatically at month end.
          </p>
          <div className={styles.prizeGrid}>
            {PRIZE_DISTRIBUTION.map((tier, i) => (
              <div key={i} className={styles.prizeCard}>
                <span style={{ color: 'var(--ds-text-dim)' }}>{rankLabel(tier.rank)}</span>
                <span style={{ color: 'var(--ds-ok)', fontWeight: 800 }}>{tier.pct}%</span>
                <span style={{ fontSize: 11, opacity: 0.6 }}>{tier.label}</span>
              </div>
            ))}
          </div>
        </div>
        </header>

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
        <div style={{ overflow: 'hidden', background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: 16 }}>
          <div className={styles.tableHeader}>
            <span>RANK</span>
            <span>PLAYER</span>
            <span style={{ textAlign: 'right' }}>SCORE</span>
            <span style={{ textAlign: 'right' }}>EST. REWARD</span>
          </div>

          <div className={styles.tableBody}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--ds-text-dim)' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 13, letterSpacing: 1 }}>LOADING SCORES…</p>
              </div>
            )}

            {!loading && entries.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <div style={{ fontSize: 14, letterSpacing: 2, fontWeight: 800, color: 'var(--ds-accent)', marginBottom: 16 }}>LEADERBOARD</div>
                <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: 'var(--ds-accent)', fontSize: 18, marginBottom: 12 }}>
                  NO SCORES YET
                </h3>
                <p style={{ color: 'var(--ds-text-dim)', fontSize: 14, marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
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
                      {entry.wallet ?? shortWallet(entry.walletAddress ?? '')}
                    </div>
                    {entry.level != null && (
                      <div style={{ fontSize: 11, color: '#55557A' }}>Level {entry.level}</div>
                    )}
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
