'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { getAllStreams } from '@/lib/anchor/vesting-client';
import Navbar from '@/components/Navbar';

// ─── Design System V3 ─────────────────────────────────────────────────────────
const DS = {
  bg0:      '#05040d',
  bg1:      '#09071a',
  bg2:      '#0e0c22',
  accent:   '#a78bff',
  accentDk: '#5e35d4',
  gold:     '#f5c66a',
  green:    '#5fd07a',
  red:      '#ff3b6b',
  blue:     '#7ad7ff',
  ember:    '#ff7a3a',
  muted:    'rgba(232,225,248,.38)',
  border:   'rgba(167,139,255,.13)',
  card:     'rgba(255,255,255,.042)',
  cinzel:   "'Space Grotesk', system-ui, sans-serif",
  sora:     "'Sora', system-ui, sans-serif",
  mono:     "'JetBrains Mono', monospace",
};

// STATS are fetched live from on-chain (getAllStreams) in the component below.

const VERIFY_METHODS = [
  {
    icon: '◈',
    color: '#c084fc',
    title: 'Game',
    sub: 'Play to Unlock',
    desc: 'Token recipients play the BlockBite puzzle game. Score thresholds trigger on-chain milestone verification. Gamified, sybil-resistant, fun.',
    badge: 'Sybil-Resistant',
  },
  {
    icon: '⬡',
    color: DS.blue,
    title: 'Oracle',
    sub: 'Chainlink Automated',
    desc: 'Connect any on-chain data feed. KPI thresholds (user count, revenue, TVL) trigger milestone unlock automatically.',
    badge: 'Fully Automated',
  },
  {
    icon: '◉',
    color: DS.gold,
    title: 'MultiSig',
    sub: 'Multi-Sig Approval',
    desc: '3-of-5 designated signers approve milestone completion. Ideal for DAO governance and advisory boards.',
    badge: 'DAO Native',
  },
  {
    icon: '✦',
    color: DS.green,
    title: 'Manual',
    sub: 'Creator Signs',
    desc: 'Stream creator manually verifies KPI completion with a signed transaction. Simple and transparent.',
    badge: 'Permissioned',
  },
];

const VESTING_MODELS = [
  {
    title: 'Linear',
    icon: '∿',
    color: DS.blue,
    desc: 'Tokens unlock at a constant rate from start to end. Ideal for team and advisor allocations.',
    formula: 'unlocked(t) = amount × (t − start)\n             ÷ duration',
  },
  {
    title: 'Cliff',
    icon: '⌐',
    color: DS.accent,
    desc: 'Zero tokens release until cliff_ts. Hard on-chain time floor — no early withdrawal, no exceptions.',
    formula: 'unlocked(t) = 0           if t < cliff\n           = amount        if t ≥ cliff',
  },
  {
    title: 'Milestone',
    icon: '◎',
    color: DS.gold,
    desc: 'Tokens unlock in tranches as KPI milestones are verified. Any verification method applies.',
    formula: 'unlocked(t) = amount × Σ pct[i]\n             where verified[i] = true',
  },
];

const ROTATING_HEADLINES = [
  'Stop Distributing Tokens Blindly.',
  'Vesting Infrastructure for Solana.',
  'Cliff. Milestone. Linear. Hybrid.',
  'Your Token Payroll, On-Chain.',
];

const HOW_IT_WORKS = [
  {
    num: '01',
    color: '#ff7a3a',
    title: 'Cliff Gate',
    desc: 'Tokens locked until cliff_end timestamp. Zero withdrawals. Anti-bot by default.',
  },
  {
    num: '02',
    color: '#7ad7ff',
    title: 'Milestone',
    desc: 'On-chain oracle verifies KPI completion. Quota allocated per milestone hit.',
  },
  {
    num: '03',
    color: '#5fd07a',
    title: 'Linear Stream',
    desc: 'Stream flows second-by-second once conditions are met. Claim anytime.',
  },
];

const COMPARISON = [
  { feature: 'Milestone Unlock',     bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Game Verification',    bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Oracle Sync',          bb: true,  sablier: false, superfluid: false, streamflow: true  },
  { feature: 'MultiSig Gate',        bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'On-chain Formula',     bb: true,  sablier: true,  superfluid: true,  streamflow: true  },
  { feature: 'Cliff + Linear',       bb: true,  sablier: true,  superfluid: false, streamflow: true  },
  { feature: 'In-game Rewards',      bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Anti-dump by Default', bb: true,  sablier: false, superfluid: false, streamflow: false },
];

interface LiveStats { streams: number; active: number; locked: string; distributed: string; }

export default function Home() {
  const { connection } = useConnection();
  const cvs = useRef<HTMLCanvasElement>(null);
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);

  // Live on-chain stats
  useEffect(() => {
    let cancelled = false;
    getAllStreams(connection).then(all => {
      if (cancelled) return;
      const nowSec = Math.floor(Date.now() / 1000);
      const active = all.filter(s => !s.cancelled && Number(s.endTs.toString()) > nowSec).length;
      const locked = all.reduce((sum, s) => {
        const total    = BigInt(s.amountTotal.toString());
        const drawn    = BigInt(s.amountWithdrawn.toString());
        return sum + (total > drawn ? total - drawn : 0n);
      }, 0n);
      const distributed = all.reduce((sum, s) => sum + BigInt(s.amountWithdrawn.toString()), 0n);
      const fmt = (n: bigint) => {
        const m = n / 1_000_000n;
        return m >= 1_000_000n ? (Number(m / 1_000_000n)).toFixed(1) + 'M'
             : m >= 1_000n     ? (Number(m / 1_000n)).toFixed(1) + 'K'
             : m.toString();
      };
      setLiveStats({ streams: all.length, active, locked: fmt(locked), distributed: fmt(distributed) });
    }).catch(() => {}); // fail silently — landing page still renders
    return () => { cancelled = true; };
  }, [connection]);

  // Rotating headline
  useEffect(() => {
    const id = setInterval(() => {
      setHeadlineIdx(i => (i + 1) % ROTATING_HEADLINES.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  // Floating particles background
  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    let raf: number;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const COLORS = [DS.accent, DS.accentDk, DS.blue, DS.gold];
    const pts = Array.from({ length: 28 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 1 + Math.random() * 2.5,
      spd: 0.12 + Math.random() * 0.22,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      op: 0.06 + Math.random() * 0.14,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.y -= p.spd;
        if (p.y < -10) { p.y = c.height + 10; p.x = Math.random() * c.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.op;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: DS.bg0, color: '#f0ecff', fontFamily: DS.sora, overflowX: 'hidden' }}>
      <canvas ref={cvs} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      {/* ─── HERO ──────────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', textAlign: 'center', gap: 32,
        background: `radial-gradient(ellipse 70% 60% at 80% 10%, rgba(94,53,212,.18) 0%, transparent 70%),
                     radial-gradient(ellipse 60% 50% at 20% 90%, rgba(167,139,255,.10) 0%, transparent 65%)`,
        backgroundImage: 'linear-gradient(rgba(167,139,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,255,.04) 1px,transparent 1px)',
        backgroundSize: '48px 48px',
      }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '7px 16px', borderRadius: 999,
          border: `1px solid ${DS.border}`,
          background: 'rgba(167,139,255,.10)',
          fontSize: 11, fontWeight: 700, color: DS.accent,
          letterSpacing: '1.8px', fontFamily: DS.sora,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: DS.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />
          POWERED BY SOLANA
        </div>

        {/* H1 */}
        <h1 style={{
          fontFamily: DS.cinzel,
          fontSize: 'clamp(36px,6vw,56px)',
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          margin: 0,
          maxWidth: 780,
        }}>
          Programmable Token<br />
          <span style={{
            background: `linear-gradient(135deg, ${DS.accent} 0%, ${DS.blue} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Distribution Protocol</span>
        </h1>

        {/* Rotating tagline */}
        <div style={{
          fontFamily: DS.mono,
          fontSize: 'clamp(13px,1.6vw,16px)',
          color: DS.accent,
          letterSpacing: '.04em',
          minHeight: 24,
          transition: 'opacity .3s',
        }}>
          {ROTATING_HEADLINES[headlineIdx]}
        </div>

        {/* Sub */}
        <p style={{
          fontSize: 'clamp(14px,1.8vw,17px)',
          color: DS.muted,
          maxWidth: 600,
          lineHeight: 1.72,
          margin: 0,
          fontWeight: 400,
        }}>
          Cliff, linear, and milestone vesting streams — with optional game-based or oracle verification.
          Built for Web3 projects that take anti-dump seriously.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
          <Link href="/streams/new" style={{
            padding: '14px 32px', borderRadius: 12,
            background: `linear-gradient(135deg, ${DS.accent} 0%, ${DS.accentDk} 100%)`,
            color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none',
            boxShadow: `0 0 32px rgba(167,139,255,.35)`,
            letterSpacing: '.02em',
          }}>
            Launch App →
          </Link>
          <Link href="/streams" style={{
            padding: '14px 28px', borderRadius: 12,
            background: 'transparent',
            border: `1px solid ${DS.border}`,
            color: '#f0ecff', fontWeight: 600, fontSize: 15, textDecoration: 'none',
            backdropFilter: 'blur(8px)',
          }}>
            View Streams
          </Link>
        </div>
      </section>

      {/* ─── STATS ROW ─────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        borderTop: `1px solid ${DS.border}`,
        borderBottom: `1px solid ${DS.border}`,
        background: DS.bg1,
        padding: '32px 24px',
      }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: 24,
        }}>
          {([
            { label: 'Total Streams',     val: liveStats?.streams.toString()   ?? '…', col: DS.accent },
            { label: 'Active Streams',    val: liveStats?.active.toString()    ?? '…', col: '#5fd07a' },
            { label: 'Tokens Locked',     val: liveStats?.locked               ?? '…', col: '#7ad7ff' },
            { label: 'Tokens Distributed',val: liveStats?.distributed          ?? '…', col: '#f5c66a' },
          ] as const).map((s, i) => (
            <div key={i} style={{
              padding: '20px 24px', borderRadius: 16,
              background: DS.card, border: `1px solid ${DS.border}`,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: DS.mono, fontSize: 28, fontWeight: 700, color: s.col, marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: DS.muted, letterSpacing: '1.4px', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.accent, fontWeight: 700, marginBottom: 12, fontFamily: DS.sora }}>
            HOW IT WORKS
          </div>
          <h2 style={{
            fontFamily: DS.cinzel, fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700,
            marginBottom: 14, color: '#f0ecff',
          }}>
            Three phases. One protocol.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {HOW_IT_WORKS.map((h, i) => (
            <div key={i} style={{
              padding: '28px 26px', borderRadius: 20,
              background: DS.card,
              border: `1px solid ${DS.border}`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 16, right: 20,
                fontFamily: DS.mono, fontSize: 40, fontWeight: 800,
                color: `${h.color}14`, lineHeight: 1,
              }}>{h.num}</div>
              <div style={{
                fontFamily: DS.mono, fontSize: 13, fontWeight: 700,
                color: h.color, marginBottom: 12, letterSpacing: '.06em',
              }}>{h.num}</div>
              <h3 style={{
                fontFamily: DS.cinzel, fontSize: 20, fontWeight: 700,
                margin: '0 0 12px', color: '#f0ecff',
              }}>{h.title}</h3>
              <p style={{ fontSize: 13, color: DS.muted, lineHeight: 1.65, margin: 0 }}>{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── VERIFICATION LAYER ────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.accent, fontWeight: 700, marginBottom: 12, fontFamily: DS.sora }}>
            KEY DIFFERENTIATOR
          </div>
          <h2 style={{
            fontFamily: DS.cinzel, fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700,
            marginBottom: 14, color: '#f0ecff',
          }}>
            One Protocol. Four Ways to Verify.
          </h2>
          <p style={{ fontSize: 15, color: DS.muted, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Milestone streams can use any verification method. Projects choose what fits their product.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
          {VERIFY_METHODS.map((m, i) => (
            <div key={i} style={{
              padding: '28px 24px', borderRadius: 20,
              background: DS.card,
              border: `1px solid ${DS.border}`,
              transition: 'border-color .2s, transform .2s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = m.color + '55';
                el.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = DS.border;
                el.style.transform = 'none';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${m.color}18`,
                border: `1px solid ${m.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: m.color, marginBottom: 16,
              }}>{m.icon}</div>
              <div style={{ fontSize: 11, color: m.color, fontWeight: 700, letterSpacing: '1.5px', marginBottom: 4 }}>
                {m.title.toUpperCase()}
              </div>
              <div style={{ fontFamily: DS.cinzel, fontSize: 17, fontWeight: 600, marginBottom: 10, color: '#f0ecff' }}>
                {m.sub}
              </div>
              <p style={{ fontSize: 13, color: DS.muted, lineHeight: 1.65, margin: 0 }}>{m.desc}</p>
              <div style={{
                marginTop: 16, display: 'inline-block',
                padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                background: `${m.color}15`, color: m.color, border: `1px solid ${m.color}30`,
                letterSpacing: '1px',
              }}>{m.badge}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── VESTING MODELS ────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '80px 24px',
        background: DS.bg1,
        borderTop: `1px solid ${DS.border}`,
        borderBottom: `1px solid ${DS.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.accent, fontWeight: 700, marginBottom: 12 }}>
              VESTING ARCHITECTURE
            </div>
            <h2 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, color: '#f0ecff' }}>
              Three Vesting Models
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {VESTING_MODELS.map((v, i) => (
              <div key={i} style={{
                padding: '28px 26px', borderRadius: 20,
                background: DS.card,
                border: `1px solid ${DS.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 11,
                    background: `${v.color}18`, border: `1px solid ${v.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: v.color,
                  }}>{v.icon}</div>
                  <h3 style={{ fontFamily: DS.cinzel, fontSize: 20, fontWeight: 700, margin: 0, color: '#f0ecff' }}>{v.title}</h3>
                </div>
                <p style={{ fontSize: 13, color: DS.muted, lineHeight: 1.65, marginBottom: 18 }}>{v.desc}</p>
                <pre style={{
                  fontFamily: DS.mono, fontSize: 10.5, color: v.color,
                  background: `${v.color}0c`, border: `1px solid ${v.color}22`,
                  borderRadius: 10, padding: '12px 14px', margin: 0,
                  whiteSpace: 'pre-wrap', lineHeight: 1.8,
                }}>{v.formula}</pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROTOCOL FLOW DIAGRAM ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.accent, fontWeight: 700, marginBottom: 12 }}>
            ARCHITECTURE
          </div>
          <h2 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, color: '#f0ecff' }}>
            How It Flows On-Chain
          </h2>
        </div>

        {/* Flow diagram */}
        <div style={{
          padding: '32px 24px', borderRadius: 24,
          background: DS.card, border: `1px solid ${DS.border}`,
          overflowX: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 680, justifyContent: 'center', flexWrap: 'nowrap' }}>
            {/* Step boxes */}
            {[
              { label: 'Project', sub: 'Deploys stream', color: DS.accent },
              null,
              { label: 'Stream', sub: 'PDA Vault', color: DS.blue },
              null,
              { label: 'Vesting Type', sub: 'Linear / Cliff\nMilestone', color: DS.gold, multi: true },
              null,
              { label: 'Verification', sub: 'Game / Oracle\nMultiSig / Manual', color: '#c084fc', multi: true },
              null,
              { label: 'Recipient', sub: 'Claims tokens', color: DS.green },
            ].map((node, i) => {
              if (node === null) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                    <svg width="32" height="16" viewBox="0 0 32 16">
                      <path d="M0 8 L24 8 M18 2 L32 8 L18 14" stroke="rgba(167,139,255,.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                );
              }
              return (
                <div key={i} style={{
                  padding: '14px 18px', borderRadius: 14, textAlign: 'center', minWidth: 100,
                  background: `${node.color}12`, border: `1px solid ${node.color}44`,
                  flexShrink: 0,
                }}>
                  <div style={{ fontFamily: DS.mono, fontSize: 11, fontWeight: 700, color: node.color, marginBottom: 4 }}>{node.label}</div>
                  <div style={{ fontSize: 9.5, color: DS.muted, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{node.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE ──────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '80px 24px',
        background: DS.bg1,
        borderTop: `1px solid ${DS.border}`,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.accent, fontWeight: 700, marginBottom: 12 }}>
              COMPETITIVE ANALYSIS
            </div>
            <h2 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, color: '#f0ecff' }}>
              BlockBite TDP vs The Field
            </h2>
          </div>

          <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${DS.border}` }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              background: DS.bg2, padding: '14px 20px',
              borderBottom: `1px solid ${DS.border}`,
            }}>
              {['Feature', 'BlockBite TDP', 'Sablier v2', 'Superfluid', 'Streamflow'].map((h, i) => (
                <div key={i} style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
                  color: i === 1 ? DS.accent : DS.muted,
                  textAlign: i === 0 ? 'left' : 'center',
                  fontFamily: DS.sora,
                }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {COMPARISON.map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                padding: '13px 20px',
                background: i % 2 === 0 ? DS.card : 'transparent',
                borderBottom: i < COMPARISON.length - 1 ? `1px solid ${DS.border}` : 'none',
                alignItems: 'center',
              }}>
                <div style={{ fontSize: 13, color: '#e8e1f8', fontWeight: 500 }}>{row.feature}</div>
                {[row.bb, row.sablier, row.superfluid, row.streamflow].map((val, j) => (
                  <div key={j} style={{ textAlign: 'center' }}>
                    {val
                      ? <span style={{ color: j === 0 ? DS.green : 'rgba(95,208,122,.5)', fontSize: 16 }}>✓</span>
                      : <span style={{ color: 'rgba(255,59,107,.4)', fontSize: 16 }}>✗</span>
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '100px 24px 120px', textAlign: 'center',
        background: `radial-gradient(ellipse 60% 70% at 50% 50%, rgba(94,53,212,.14) 0%, transparent 70%)`,
      }}>
        <h2 style={{
          fontFamily: DS.cinzel,
          fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800,
          marginBottom: 16, color: '#f0ecff',
        }}>
          Ready to distribute tokens responsibly?
        </h2>
        <p style={{ fontSize: 15, color: DS.muted, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Join the projects already streaming tokens with cliff, linear, and milestone vesting on Solana.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/streams/new" style={{
            padding: '15px 36px', borderRadius: 13,
            background: `linear-gradient(135deg, ${DS.accent} 0%, ${DS.accentDk} 100%)`,
            color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none',
            boxShadow: `0 0 40px rgba(167,139,255,.4)`,
          }}>
            Launch App →
          </Link>
          <a href="/protocol" style={{
            padding: '15px 32px', borderRadius: 13,
            background: 'transparent', border: `1px solid ${DS.border}`,
            color: '#f0ecff', fontWeight: 600, fontSize: 16, textDecoration: 'none',
          }}>
            Read Docs ↗
          </a>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: `1px solid ${DS.border}`,
        padding: '28px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        fontSize: 12, color: DS.muted,
        background: DS.bg1,
        fontFamily: DS.sora,
      }}>
        <div>© 2026 BlockBite TDP · Solana Devnet · DvhxiL5P…XTFf</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="https://x.com/blockbite_gg" target="_blank" rel="noopener noreferrer" style={{ color: DS.muted, textDecoration: 'none' }}>Twitter / X</a>
          <a href="https://discord.gg/blockbite" target="_blank" rel="noopener noreferrer" style={{ color: DS.muted, textDecoration: 'none' }}>Discord</a>
          <a href="https://github.com/nayrbryanGaming/blockblast" target="_blank" rel="noopener noreferrer" style={{ color: DS.muted, textDecoration: 'none' }}>GitHub</a>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
      `}</style>
    </div>
  );
}
