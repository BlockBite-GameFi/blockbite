'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import PrizePoolCounter from '@/components/PrizePoolCounter';
import Countdown from '@/components/Countdown';
import Navbar from '@/components/Navbar';
import WinnersTicker from '@/components/WinnersTicker';
import styles from './page.module.css';

// Client-only game background
const GameBackground = dynamic(() => import('@/components/GameBackground'), { ssr: false });

export default function Home() {
  return (
    <main className={styles.main}>
      <Navbar />
      <div className="grid-overlay"></div>
      <div className="scanline-overlay"></div>
      
      {/* Hero Background — pure CSS, no images */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: -2,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(0,245,255,0.08) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 80% 60%, rgba(255,0,255,0.06) 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(0,255,136,0.04) 0%, transparent 50%), #060614',
      }}>
        <GameBackground />
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

      {/* Winners Ticker */}
      <WinnersTicker />

      {/* 3-Step Guide */}
      <section style={{ padding: '48px 24px 0', maxWidth: 860, margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 'clamp(14px,2.5vw,20px)', fontWeight: 700, color: '#8888BB', textAlign: 'center', letterSpacing: '0.1em', marginBottom: 28 }}>
          START IN 3 STEPS
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { step: '01', icon: '🔗', title: 'Connect Wallet', desc: 'Phantom, Backpack or Solflare — any Solana wallet works.', href: '#', color: '#00F5FF' },
            { step: '02', icon: '🎟', title: 'Buy a Ticket', desc: 'Starting at $1 USDC. 70% goes straight to the prize pool.', href: '/shop', color: '#FF00FF' },
            { step: '03', icon: '🏆', title: 'Play & Claim', desc: 'Top-10 on the monthly leaderboard? Claim your USDC prize.', href: '/game', color: '#00FF88' },
          ].map(s => (
            <Link key={s.step} href={s.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(18,18,42,0.8)', border: `1px solid ${s.color}22`, borderLeft: `3px solid ${s.color}`, borderRadius: 14, padding: '22px 20px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: s.color, fontWeight: 800, letterSpacing: '0.1em' }}>STEP {s.step}</span>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                </div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 14, color: '#FFFFFF', fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#8888BB', lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            </Link>
          ))}
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
