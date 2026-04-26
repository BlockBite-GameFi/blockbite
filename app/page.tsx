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
      
      {/* Hero Background with generated asset */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: -2,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url("/assets/hero_bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6) contrast(1.1)',
          transform: 'scale(1.05)',
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, var(--bg-deep) 90%)',
        }} />
      </div>

      <section className={styles.hero}>

        <div className={styles.heroContent}>
          <div className="badge badge-cyan" style={{ marginBottom: '24px', animation: 'float 3s ease-in-out infinite' }}>
            SOLANA MAINNET READY
          </div>
          <h1 className={styles.title}>
            STACK. CLEAR.<br />
            <span className="neon-cyan">EARN.</span>
          </h1>
          <p className={styles.subtitle}>
            Skill-based arcade on Solana — 4,000 deterministic puzzle levels, transparent prize pool, real USDC rewards. Earn by playing better, not by gambling.
          </p>

          <div className={styles.prizeCard}>
            <div className={styles.prizeLabel}>MONTHLY PRIZE POOL</div>
            <PrizePoolCounter />
            <div className={styles.prizeDivider}></div>
            <div className={styles.timerWrap}>
              <span>ENDS IN:</span>
              <Countdown />
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
          <h3 className="neon-cyan">SKILL, NOT LUCK</h3>
          <p style={{ color: '#8888BB', fontSize: '14px', lineHeight: '1.6' }}>
            4,000 deterministic puzzle levels — same seed, same board for every player. Pure skill decides the leaderboard.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⛓️</div>
          <h3 className="neon-magenta">TRANSPARENT POOL</h3>
          <p style={{ color: '#8888BB', fontSize: '14px', lineHeight: '1.6' }}>
            70% of every ticket goes on-chain to the prize pool. Smart-contract settlement, public leaderboard. No team interference.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>💰</div>
          <h3 className="neon-green">USDC REWARDS</h3>
          <p style={{ color: '#8888BB', fontSize: '14px', lineHeight: '1.6' }}>
            Win real stablecoins. Top-10 monthly winners split 85% of the prize pool. Every player earns from the remaining 15%.
          </p>
        </div>
      </section>

      {/* 8-Act Progression */}
      <section style={{ padding: '0 24px 80px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 'clamp(18px,3vw,28px)', fontWeight: 700, color: '#FFFFFF', textAlign: 'center', marginBottom: 32, letterSpacing: '0.06em' }}>
          8 ACTS · 4,000 LEVELS
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {([
            { act: 'I',   name: 'Awakening',   range: '1–500',    color: '#00F5FF', icon: '🌅' },
            { act: 'II',  name: 'Frostfall',   range: '501–1000', color: '#00C3FF', icon: '❄️' },
            { act: 'III', name: 'Inferno',      range: '1001–1500',color: '#FF6B00', icon: '🔥' },
            { act: 'IV',  name: 'Stormlands',   range: '1501–2000',color: '#FFD700', icon: '⚡' },
            { act: 'V',   name: 'Verdant',      range: '2001–2500',color: '#00FF88', icon: '🌿' },
            { act: 'VI',  name: 'Nightfall',    range: '2501–3000',color: '#AA00FF', icon: '🌑' },
            { act: 'VII', name: 'Crystalline',  range: '3001–3500',color: '#FF00FF', icon: '💎' },
            { act: 'VIII',name: 'Voidbreak',    range: '3501–4000',color: '#FFFFFF', icon: '🌌' },
          ] as const).map(a => (
            <div key={a.act} style={{
              background: 'rgba(18,18,42,0.7)', border: `1px solid ${a.color}22`,
              borderRadius: 12, padding: '14px 16px',
              borderLeft: `3px solid ${a.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span>{a.icon}</span>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: a.color, fontWeight: 700 }}>ACT {a.act}</span>
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#FFFFFF', fontWeight: 700 }}>{a.name}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: '#555577', marginTop: 2 }}>Levels {a.range}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 BlockBite Web3 · Built on Solana · <a href="https://explorer.solana.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00F5FF' }}>Verify on-chain</a></p>
      </footer>
    </main>
  );
}
