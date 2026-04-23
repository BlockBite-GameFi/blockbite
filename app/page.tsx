'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import PrizePoolCounter from '@/components/PrizePoolCounter';
import Countdown from '@/components/Countdown';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

// Client-only game background
const GameBackground = dynamic(() => import('@/components/GameBackground'), { ssr: false });

export default function Home() {
  return (
    <main className={styles.main}>
      <Navbar />
      <div className="grid-overlay"></div>
      <div className="scanline-overlay"></div>
      
      {/* Dynamic Floating Background */}
      <GameBackground />

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className="badge badge-cyan" style={{ marginBottom: '24px', animation: 'float 3s ease-in-out infinite' }}>
            SOLANA MAINNET READY
          </div>
          <h1 className={styles.title}>
            SKILL. STRATEGY.<br />
            <span className="neon-cyan">BLOCKBLAST</span> <span className="neon-magenta">WEB3</span>
          </h1>
          <p className={styles.subtitle}>
            The world's first 100% transparent, skill-based puzzle arena on Solana. 
            Turn your strategy into USDC rewards.
          </p>

          <div className={styles.prizeCard}>
            <div className={styles.prizeLabel}>WEEKLY PRIZE POOL</div>
            <PrizePoolCounter initialValue={3248.50} />
            <div className={styles.prizeDivider}></div>
            <div className={styles.timerWrap}>
              <span>ENDS IN:</span>
              <Countdown targetDate={new Date(Date.now() + 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60 * 5)} />
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/game" className="btn btn-primary btn-lg">
              ▶ LAUNCH GAME
            </Link>
            <Link href="/how-to-play" className="btn btn-secondary btn-lg">
              LEARN MECHANICS
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.features}>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎯</div>
          <h3 className="neon-cyan">0% LUCK</h3>
          <p style={{ color: '#8888BB', fontSize: '14px', lineHeight: '1.6' }}>
            No RNG, no gambling. Every piece placement is a strategic decision that affects your final payout.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⛓️</div>
          <h3 className="neon-magenta">100% ON-CHAIN</h3>
          <p style={{ color: '#8888BB', fontSize: '14px', lineHeight: '1.6' }}>
            Verify every prize pool distribution and top score directly on the Solana blockchain.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>💰</div>
          <h3 className="neon-green">USDC REWARDS</h3>
          <p style={{ color: '#8888BB', fontSize: '14px', lineHeight: '1.6' }}>
            Win real stablecoins. No volatile tokens, no inflationary mechanics. Pure skill, pure rewards.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 BlockBlast Web3 · Built on Solana for the next generation of gamers.</p>
      </footer>
    </main>
  );
}
