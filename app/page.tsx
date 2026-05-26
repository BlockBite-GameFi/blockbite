'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { getAllStreams } from '@/lib/anchor/vesting-client';
import Navbar from '@/components/Navbar';

// ─── Design System V4 — Vestra/Solana standard ────────────────────────────────
const DS = {
  bg0:      '#03000A',   // Vestra bg-void
  bg1:      '#0A0714',   // Vestra bg-surface
  bg2:      '#110E1F',   // Vestra bg-elevated
  accent:   '#9945FF',   // Solana purple (official)
  accentDk: '#7733CC',   // darker purple
  gold:     '#f5c66a',
  green:    '#14F195',   // Solana green (official)
  red:      '#ff3b6b',
  blue:     '#00C2FF',   // Solana blue (official)
  ember:    '#ff7a3a',
  muted:    'rgba(160,154,191,.80)',  // Vestra text-secondary
  border:   'rgba(153,69,255,.20)',   // purple-tinted border
  card:     'rgba(153,69,255,.07)',   // purple glass card
  cinzel:   "'Montserrat', 'Nunito', 'Syne', system-ui, sans-serif",
  sora:     "'Montserrat', 'Nunito', 'DM Sans', system-ui, sans-serif",
  mono:     "'JetBrains Mono', monospace",
};

// STATS are fetched live from on-chain (getAllStreams) in the component below.

const VERIFY_METHODS = [
  {
    icon: '⬡',
    color: DS.blue,
    title: 'Automated',
    sub: 'Always On',
    desc: 'Token streams run fully on-chain. No manual intervention needed — conditions execute the moment they are met.',
    badge: 'Fully Automated',
  },
  {
    icon: '◈',
    color: '#c084fc',
    title: 'Game',
    sub: 'Play to Unlock',
    desc: 'Recipients earn milestone unlocks through the BlockBite puzzle game. Gamified, sybil-resistant, and on-chain verifiable.',
    badge: 'Sybil-Resistant',
  },
  {
    icon: '⬡',
    color: DS.accent,
    title: 'Oracle',
    sub: 'On-Chain Data',
    desc: 'Connect any on-chain data feed. KPI thresholds — user count, revenue, TVL — trigger milestone unlock automatically.',
    badge: 'Data-Driven',
  },
  {
    icon: '✦',
    color: DS.green,
    title: 'Manual',
    sub: 'Creator Signs',
    desc: 'Stream creator verifies milestone completion with a signed transaction. Simple, transparent, and fully permissioned.',
    badge: 'Permissioned',
  },
];

const VESTING_MODELS = [
  {
    title: 'Linear',
    icon: '∿',
    color: DS.blue,
    desc: 'Tokens unlock at a constant rate from start to end date. Ideal for team, advisor, and contributor allocations.',
  },
  {
    title: 'Cliff',
    icon: '⌐',
    color: DS.accent,
    desc: 'Zero tokens release until the cliff date. Hard time-lock enforced on-chain — no early withdrawals, no exceptions.',
  },
  {
    title: 'Milestone',
    icon: '◎',
    color: DS.gold,
    desc: 'Tokens unlock in tranches as project milestones are verified. Choose any verification method to match your workflow.',
  },
];


const HOW_IT_WORKS = [
  {
    num: '01',
    color: '#ff7a3a',
    title: 'Connect & Import Data',
    desc: 'Connect your wallet and upload your recipient list via CSV or manual entry in seconds.',
  },
  {
    num: '02',
    color: DS.blue,
    title: 'Define Tokenomics',
    desc: 'Customize your release strategy using linear vesting, cliff periods, or milestone-based distribution.',
  },
  {
    num: '03',
    color: '#c084fc',
    title: 'Set Verification Layer',
    desc: 'Choose Direct Claim for simplicity or add Verification Layers like multisig, oracles, or gamified challenges.',
  },
  {
    num: '04',
    color: DS.green,
    title: 'Lock, Launch & Manage',
    desc: 'Lock assets to automate user claims. Monitor distribution in real-time with absolute Clawback control.',
  },
];

const COMPARISON = [
  { feature: 'Milestone Unlock',      bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Fully Automated',       bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Game Verification',     bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Oracle Data Feed',      bb: true,  sablier: false, superfluid: false, streamflow: true  },
  { feature: 'Cliff + Linear',        bb: true,  sablier: true,  superfluid: false, streamflow: true  },
  { feature: 'On-chain Enforcement',  bb: true,  sablier: true,  superfluid: true,  streamflow: true  },
  { feature: 'Anti-dump by Default',  bb: true,  sablier: false, superfluid: false, streamflow: false },
];

interface LiveStats { streams: number; active: number; locked: string; distributed: string; }

export default function Home() {
  const { connection } = useConnection();
  const cvs = useRef<HTMLCanvasElement>(null);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [faqOpen, setFaqOpen] = useState<boolean[]>(Array(6).fill(false));
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


  // Floating particles background
  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    let raf: number;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const COLORS = [DS.accent, DS.blue, DS.green, DS.accentDk];
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
    <div style={{ minHeight: '100vh', background: DS.bg0, color: '#F8F6FF', fontFamily: DS.sora, overflowX: 'hidden' }}>
      {/* Warp-speed canvas particles */}
      <canvas ref={cvs} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.55 }} />

      <Navbar />

      {/* ─── HERO ──────────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '140px 24px 100px', textAlign: 'center', gap: 32,
        background: [
          'radial-gradient(ellipse 80% 55% at 50% 20%, rgba(153,69,255,0.18) 0%, transparent 65%)',
          'radial-gradient(ellipse 50% 35% at 80% 80%, rgba(0,194,255,0.10) 0%, transparent 60%)',
          'radial-gradient(ellipse 40% 30% at 20% 70%, rgba(20,241,149,0.07) 0%, transparent 55%)',
        ].join(','),
      }}>
        {/* Top glow orb */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(153,69,255,0.22) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Badge */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', borderRadius: 999,
          border: '1px solid rgba(20,241,149,.40)',
          background: 'rgba(20,241,149,.10)',
          fontSize: 11, fontWeight: 800,
          color: DS.green,
          letterSpacing: '2.5px', fontFamily: DS.sora,
          boxShadow: '0 0 20px rgba(20,241,149,.15)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: DS.green, display: 'inline-block', animation: 'pulse 2s infinite', boxShadow: '0 0 8px rgba(20,241,149,.8)' }} />
          POWERED BY SOLANA
        </div>

        {/* Logo */}
        <img
          src="/logo.png"
          alt="BlockBite"
          style={{ position: 'relative', zIndex: 1, width: 88, height: 88, objectFit: 'contain', filter: 'drop-shadow(0 0 36px rgba(153,69,255,0.70))' }}
        />

        {/* Kicker */}
        <p style={{
          position: 'relative', zIndex: 1,
          fontFamily: DS.cinzel,
          fontSize: 'clamp(10px,1.1vw,12px)',
          fontWeight: 800,
          color: 'rgba(160,154,191,.65)',
          letterSpacing: '.30em',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          THE UNIFIED TOKEN DISTRIBUTION PROTOCOL
        </p>

        {/* Headline */}
        <h1 style={{
          position: 'relative', zIndex: 1,
          fontFamily: DS.cinzel,
          fontSize: 'clamp(40px,7vw,80px)',
          fontWeight: 900,
          lineHeight: 1.02,
          letterSpacing: '-2px',
          margin: 0,
          maxWidth: 860,
          color: '#F8F6FF',
          textShadow: '0 0 80px rgba(153,69,255,0.25)',
        }}>
          Stop Distributing{' '}
          <span style={{
            background: 'linear-gradient(90deg, #9945FF 0%, #00C2FF 50%, #14F195 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 24px rgba(153,69,255,0.5))',
          }}>Tokens Blindly.</span>
        </h1>

        {/* Sub-headline */}
        <p style={{
          position: 'relative', zIndex: 1,
          fontFamily: DS.sora,
          fontSize: 'clamp(15px,1.6vw,18px)',
          color: 'rgba(160,154,191,.85)',
          maxWidth: 600,
          lineHeight: 1.80,
          margin: 0,
          fontWeight: 400,
        }}>
          The unified engine for automated token logistics. Effortlessly manage your entire
          lifecycle from secure vesting to real-time streaming with built-in validation layers.
        </p>

        {/* CTAs */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/waitlist" style={{
            padding: '16px 40px', borderRadius: 9999,
            background: 'linear-gradient(90deg, #9945FF 0%, #00C2FF 100%)',
            color: '#fff', fontWeight: 800, fontSize: 16,
            textDecoration: 'none', letterSpacing: '.04em',
            boxShadow: '0 0 40px rgba(153,69,255,.55), 0 4px 24px rgba(0,0,0,.4)',
            fontFamily: DS.cinzel,
            transition: 'transform .2s, box-shadow .2s',
            display: 'inline-block',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(153,69,255,.70), 0 4px 24px rgba(0,0,0,.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(153,69,255,.55), 0 4px 24px rgba(0,0,0,.4)'; }}
          >
            Secure Your Spot Now!
          </Link>
          <Link href="/streams/new" style={{
            padding: '16px 32px', borderRadius: 9999,
            background: 'rgba(153,69,255,.08)',
            border: '1px solid rgba(153,69,255,.45)',
            color: '#F8F6FF', fontWeight: 600, fontSize: 16,
            textDecoration: 'none', letterSpacing: '.02em',
            fontFamily: DS.sora,
            backdropFilter: 'blur(12px)',
            display: 'inline-block',
          }}>
            Launch App →
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: '24px 40px',
          marginTop: 48, paddingTop: 44,
          borderTop: '1px solid rgba(153,69,255,.22)',
          maxWidth: 680, width: '100%',
        }}>
          {([
            { label: 'Total Streams',     val: liveStats ? liveStats.streams.toLocaleString() : '0' },
            { label: 'Active Streams',    val: liveStats ? liveStats.active.toLocaleString()  : '0' },
            { label: 'Total Distributed', val: liveStats ? liveStats.distributed + ' tokens'  : '0 tokens' },
          ]).map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(160,154,191,.6)', letterSpacing: '2.5px', textTransform: 'uppercase', margin: '0 0 10px' }}>{s.label}</p>
              <p style={{
                fontFamily: DS.cinzel, fontWeight: 900, fontSize: 'clamp(24px,3vw,34px)',
                margin: 0,
                background: 'linear-gradient(90deg, #9945FF, #00C2FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>{s.val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.accent, fontWeight: 700, marginBottom: 12 }}>
            WHAT WE DO
          </div>
          <h2 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 700, color: '#F8F6FF', margin: 0 }}>
            Token distribution, done right.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {[
            {
              icon: '◎', color: DS.accent,
              title: 'Flexible Schedules',
              desc: 'Send tokens to your team, investors, or community with cliff locks, linear streams, and milestone-gated tranches — all in one stream.',
            },
            {
              icon: '◈', color: '#c084fc',
              title: 'Game-Powered Proof',
              desc: 'Recipients earn milestone unlocks by playing the BlockBite puzzle game. Gamified, sybil-resistant, and fully verifiable on-chain.',
            },
            {
              icon: '✦', color: DS.green,
              title: 'Anti-Dump by Default',
              desc: 'Hard time locks and milestone gates prevent immediate sell pressure. Align your community around long-term growth.',
            },
          ].map((f, i) => (
            <div key={i} style={{
              padding: '36px 32px', borderRadius: 24,
              background: DS.card, border: `1px solid ${DS.border}`,
              transition: 'border-color .2s, transform .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = f.color + '55'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = DS.border; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${f.color}18`, border: `1px solid ${f.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: f.color, marginBottom: 20,
              }}>{f.icon}</div>
              <h3 style={{ fontFamily: DS.cinzel, fontSize: 21, fontWeight: 700, margin: '0 0 14px', color: '#F8F6FF' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: DS.muted, lineHeight: 1.72, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '80px 24px',
        background: DS.bg1,
        borderTop: `1px solid ${DS.border}`,
        borderBottom: `1px solid ${DS.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.accent, fontWeight: 700, marginBottom: 12 }}>
              HOW IT WORKS
            </div>
            <h2 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 700, color: '#F8F6FF', margin: '0 0 16px' }}>
              Four steps to launch.
            </h2>
            <p style={{ fontFamily: DS.sora, fontSize: 15, color: DS.muted, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              From stream creation to recipient claim — every step enforced on-chain, no admin required.
            </p>
          </div>

          {/* 3 steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, marginBottom: 56 }}>
            {HOW_IT_WORKS.map((h, i) => (
              <div key={i} style={{
                padding: '32px 28px', borderRadius: 20,
                background: DS.card, border: `1px solid ${DS.border}`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 14, right: 18,
                  fontFamily: DS.mono, fontSize: 44, fontWeight: 800,
                  color: `${h.color}12`, lineHeight: 1, userSelect: 'none',
                }}>{h.num}</div>
                <div style={{ fontFamily: DS.mono, fontSize: 12, fontWeight: 700, color: h.color, marginBottom: 14, letterSpacing: '.08em' }}>{h.num}</div>
                <h3 style={{ fontFamily: DS.cinzel, fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: '#F8F6FF' }}>{h.title}</h3>
                <p style={{ fontFamily: DS.sora, fontSize: 13, color: DS.muted, lineHeight: 1.65, margin: 0 }}>{h.desc}</p>
              </div>
            ))}
          </div>

          {/* Verification methods — inside how it works */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.muted, fontWeight: 600, marginBottom: 8 }}>
              STEP 2 — CHOOSE HOW TO VERIFY
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
            {VERIFY_METHODS.map((m, i) => (
              <div key={i} style={{
                padding: '22px 20px', borderRadius: 16,
                background: `${m.color}07`, border: `1px solid ${m.color}25`,
                transition: 'border-color .2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = m.color + '55'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = m.color + '25'; }}
              >
                <div style={{ fontSize: 11, color: m.color, fontWeight: 700, letterSpacing: '1.5px', marginBottom: 6 }}>{m.title.toUpperCase()}</div>
                <div style={{ fontFamily: DS.cinzel, fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#F8F6FF' }}>{m.sub}</div>
                <p style={{ fontSize: 12, color: DS.muted, lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
                <div style={{
                  marginTop: 12, display: 'inline-block',
                  padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 700,
                  background: `${m.color}15`, color: m.color, letterSpacing: '1px',
                }}>{m.badge}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO USES IT ───────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.accent, fontWeight: 700, marginBottom: 12 }}>
              USE CASES
            </div>
            <h2 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 700, color: '#F8F6FF', margin: 0 }}>
              Who uses{' '}
              <span style={{
                fontStyle: 'italic',
                background: 'linear-gradient(90deg, #9945FF, #14F195)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>BlockBite TDP.</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            {([
              {
                audience: 'TEAMS',
                headline: 'Enforce vesting on-chain,\nnot in spreadsheets.',
                body: 'Give co-founders and employees their tokens over time. Standard 4-year vesting with 1-year cliff — enforce agreements on-chain.',
                example: '4-year linear · 1-year cliff',
              },
              {
                audience: 'INVESTORS',
                headline: 'Deliver the unlock schedule\nyou committed to.',
                body: 'Investors claim on their own — no manual transfers, no trust required. Fully transparent on-chain.',
                example: '2-year linear · 3-month cliff',
              },
              {
                audience: 'COMMUNITY',
                headline: 'Reward contributors\nfairly and transparently.',
                body: 'Reward contributors, airdrop participants, or ecosystem grants. Each recipient sees only their own allocation.',
                example: 'Custom schedule per recipient',
              },
            ] as const).map((uc, i) => (
              <div key={i} style={{
                borderRadius: 18, padding: 1,
                background: 'linear-gradient(135deg, rgba(153,69,255,0.25), rgba(20,241,149,0.12))',
              }}>
                <div style={{
                  borderRadius: 17, background: DS.bg1,
                  padding: '28px 28px 24px',
                  height: '100%', boxSizing: 'border-box',
                  display: 'flex', flexDirection: 'column', gap: 16,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: DS.accent, letterSpacing: '2.5px', textTransform: 'uppercase', margin: 0 }}>{uc.audience}</p>
                  <h3 style={{ fontFamily: DS.cinzel, fontSize: 20, fontWeight: 700, color: '#F8F6FF', whiteSpace: 'pre-line', lineHeight: 1.3, margin: 0 }}>{uc.headline}</h3>
                  <p style={{ fontFamily: DS.sora, fontSize: 13.5, color: DS.muted, lineHeight: 1.72, margin: 0, flex: 1 }}>{uc.body}</p>
                  <div style={{ borderTop: `1px solid ${DS.border}`, paddingTop: 14 }}>
                    <p style={{ fontFamily: DS.mono, fontSize: 11, color: DS.muted, margin: 0 }}>{uc.example}</p>
                  </div>
                </div>
              </div>
            ))}
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
              WHY BLOCKBITE
            </div>
            <h2 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, color: '#F8F6FF' }}>
              Built different from day one.
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
                <div style={{ fontSize: 13, color: '#F8F6FF', fontWeight: 500 }}>{row.feature}</div>
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

      {/* ─── FAQ ───────────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.accent, fontWeight: 700, marginBottom: 12 }}>
              FAQ
            </div>
            <h2 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 700, color: '#F8F6FF', margin: 0 }}>
              Questions,{' '}
              <span style={{
                fontStyle: 'italic',
                background: 'linear-gradient(90deg, #9945FF, #14F195)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>answered.</span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([
              {
                q: 'What is BlockBite TDP?',
                a: 'BlockBite TDP is a token distribution protocol on Solana. It lets project teams create vesting streams for team members, investors, and contributors — directly on-chain, with no intermediary.',
              },
              {
                q: 'Who controls the locked tokens?',
                a: 'Nobody. Tokens are locked in a PDA-controlled vault — a program-derived address with no private key. Only the on-chain program can release tokens, and only when the vesting schedule allows it.',
              },
              {
                q: 'What vesting schedules are supported?',
                a: 'Cliff vesting (all tokens at a single date), linear vesting (gradual release over time), and milestone-gated tranches. All schedules support an optional cliff period before linear release begins.',
              },
              {
                q: 'What is the game verification layer?',
                a: 'Recipients can earn milestone unlocks by playing the BlockBite puzzle game. It\'s gamified, sybil-resistant, and the result is fully verifiable on-chain — no one can fake a score.',
              },
              {
                q: 'What happens if a stream is cancelled?',
                a: 'Vesting freezes immediately. The recipient keeps everything already vested and can claim it at any time. Unvested tokens are returned to the stream creator.',
              },
              {
                q: 'What wallets are supported?',
                a: 'Phantom and Solflare are fully supported via Solana wallet-adapter. Any wallet compatible with the adapter standard will work.',
              },
            ] as const).map((item, i) => (
              <div key={i} style={{
                borderRadius: 14, overflow: 'hidden',
                border: `1px solid ${faqOpen[i] ? 'rgba(153,69,255,0.45)' : DS.border}`,
                transition: 'border-color .2s',
              }}>
                <button
                  onClick={() => setFaqOpen(prev => prev.map((v, idx) => idx === i ? !v : v))}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', textAlign: 'left',
                    background: faqOpen[i] ? DS.bg2 : 'transparent',
                    border: 'none', cursor: 'pointer',
                    color: '#F8F6FF', fontFamily: DS.sora, fontSize: 14.5, fontWeight: 600,
                    transition: 'background .2s',
                  }}
                >
                  <span>{item.q}</span>
                  <span style={{
                    fontSize: 18, color: DS.muted, flexShrink: 0, marginLeft: 16,
                    transform: faqOpen[i] ? 'rotate(180deg)' : 'none',
                    transition: 'transform .2s',
                    display: 'inline-block',
                  }}>⌄</span>
                </button>
                {faqOpen[i] && (
                  <div style={{ padding: '0 20px 16px', fontFamily: DS.sora, fontSize: 13.5, color: DS.muted, lineHeight: 1.75 }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '100px 24px 120px', textAlign: 'center',
        background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(153,69,255,.12) 0%, transparent 70%)',
      }}>
        <h2 style={{
          fontFamily: DS.cinzel,
          fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800,
          marginBottom: 16, color: '#F8F6FF',
        }}>
          Ready to distribute tokens responsibly?
        </h2>
        <p style={{ fontSize: 15, color: DS.muted, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Join the projects already streaming tokens with cliff, linear, and milestone vesting on Solana.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/streams/new" style={{
            padding: '15px 40px', borderRadius: 9999,
            background: 'linear-gradient(90deg, #9945FF 0%, #00C2FF 100%)',
            color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none',
            boxShadow: '0 0 40px rgba(153,69,255,.40)',
          }}>
            Launch App →
          </Link>
          <Link href="/streams" style={{
            padding: '15px 36px', borderRadius: 9999,
            background: 'rgba(153,69,255,.06)',
            border: '1px solid rgba(153,69,255,.35)',
            color: '#F8F6FF', fontWeight: 600, fontSize: 16, textDecoration: 'none',
          }}>
            View Streams
          </Link>
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
        <div>© 2026 BlockBite · Token Distribution Protocol on Solana</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="https://x.com/blockbite_gg" target="_blank" rel="noopener noreferrer" style={{ color: DS.muted, textDecoration: 'none' }}>Twitter / X</a>
          <a href="https://discord.gg/blockbite" target="_blank" rel="noopener noreferrer" style={{ color: DS.muted, textDecoration: 'none' }}>Discord</a>
          <a href="https://github.com/nayrbryanGaming/blockblast" target="_blank" rel="noopener noreferrer" style={{ color: DS.muted, textDecoration: 'none' }}>GitHub</a>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.65)} }
        @keyframes heroGlow { 0%,100%{opacity:.18} 50%{opacity:.28} }
      `}</style>
    </div>
  );
}
