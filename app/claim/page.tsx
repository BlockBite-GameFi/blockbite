'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const C = {
  accent:  '#a78bfa',
  accentDk:'#5e35d4',
  gold:    '#f5c66a',
  green:   '#5fd07a',
  red:     '#ff3b6b',
  blue:    '#7ad7ff',
  ember:   '#ff7a3a',
  muted:   'var(--ds-text-dim)',
  mono:    "'JetBrains Mono', monospace",
  serif:   "'Space Grotesk', sans-serif",
};

// ─── Mock streams available to claim ─────────────────────────────────────────
const CLAIMABLE_STREAMS = [
  {
    id: 'stm-001', name: 'Team Allocation',    token: 'BBT',
    total: 500_000, claimed: 80_000, rate: 0.463,
    cliff: '2025-06-01', end: '2027-01-01', type: 'linear',
    milestones: [],
  },
  {
    id: 'stm-002', name: 'Advisor Round',       token: 'BBT',
    total: 120_000, claimed: 12_000, rate: 0.0463,
    cliff: '2025-03-15', end: '2026-03-15', type: 'milestone',
    milestones: [
      { label: 'Token Launch',  pct: 25, done: true  },
      { label: 'Mainnet Deploy',pct: 25, done: false },
      { label: '10K Players',   pct: 25, done: false },
      { label: 'Protocol V2',   pct: 25, done: false },
    ],
  },
  {
    id: 'stm-006', name: 'Game Rewards Pool',   token: 'BBT',
    total: 300_000, claimed: 45_000, rate: 0.115,
    cliff: '2025-05-01', end: '2026-05-01', type: 'milestone',
    milestones: [
      { label: 'Level 10 Clear', pct: 20, done: true  },
      { label: 'Level 30 Clear', pct: 30, done: true  },
      { label: 'Level 50 Clear', pct: 50, done: false },
    ],
  },
];

export default function ClaimPage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [ticker, setTicker]           = useState(0);
  const [justClaimed, setJustClaimed] = useState(false);
  const [claimedExtra, setClaimedExtra] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTicker(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Reset ticker display when switching streams
    setJustClaimed(false);
    setClaimedExtra(0);
  }, [selectedIdx]);

  const stream   = CLAIMABLE_STREAMS[selectedIdx];
  const unlocked = stream.claimed + claimedExtra + ticker * stream.rate;
  const claimable = Math.max(0, Math.floor(unlocked - stream.claimed - claimedExtra));
  const pctUnlocked = Math.min(100, (unlocked / stream.total) * 100);
  const pctClaimed  = Math.min(100, ((stream.claimed + claimedExtra) / stream.total) * 100);

  // Milestone quota gate
  const milestoneQuota = stream.milestones.length > 0
    ? stream.milestones.filter(m => m.done).reduce((a, m) => a + m.pct, 0)
    : 100;
  const quotaCap  = Math.floor(stream.total * milestoneQuota / 100);
  const effectiveClaimable = stream.milestones.length > 0
    ? Math.max(0, Math.min(claimable, quotaCap - stream.claimed - claimedExtra))
    : claimable;

  const handleClaim = () => {
    if (effectiveClaimable > 0) {
      setClaimedExtra(c => c + effectiveClaimable);
      setJustClaimed(true);
      setTimeout(() => setJustClaimed(false), 2000);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ds-bg)', color: 'var(--ds-text)' }}>
      <Navbar />

      {/* Header */}
      <div style={{ padding: '80px 24px 32px', background: 'linear-gradient(180deg,#0a0d20 0%,var(--ds-bg) 100%)', borderBottom: '1px solid #1f1f3a' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: C.blue, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>
            TDP · Claim Portal
          </div>
          <h1 style={{ fontFamily: C.serif, fontSize: 'clamp(24px,5vw,38px)', fontWeight: 900, marginBottom: 8 }}>
            Claim Streamed Tokens
          </h1>
          <p style={{ fontSize: 13, color: C.muted }}>
            Tokens stream second-by-second into your wallet. Withdraw any vested amount at any time — milestone gates apply.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px 100px' }}>

        {/* ── Stream selector ─────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' }}>
          {CLAIMABLE_STREAMS.map((s, i) => (
            <button key={s.id} onClick={() => setSelectedIdx(i)} style={{
              padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${selectedIdx === i ? C.accent : 'rgba(255,255,255,.08)'}`,
              background: selectedIdx === i ? `${C.accent}18` : 'rgba(255,255,255,.04)',
              color: selectedIdx === i ? C.accent : C.muted,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all .15s',
            }}>{s.name}</button>
          ))}
        </div>

        {/* ── Claim card ──────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(10,8,26,.9)', border: `1.5px solid ${C.accent}33`,
          borderRadius: 24, padding: '32px 28px',
          boxShadow: `0 0 60px ${C.accent}12, 0 24px 60px rgba(0,0,0,.6)`,
        }}>

          {/* Stream header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: C.mono, fontSize: 12, color: C.accent, letterSpacing: '.1em' }}>BLOCKBITE TDP · TOKEN STREAM</span>
            </div>
            <div style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 800, color: '#fff' }}>{stream.name}</div>
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>{stream.id} · {stream.type.toUpperCase()}</div>
          </div>

          {/* Live counter */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: '.1em', marginBottom: 10, textTransform: 'uppercase' }}>
              {stream.milestones.length > 0 ? 'Available to Claim (milestone-gated)' : 'Available to Claim'}
            </div>
            <div style={{
              fontFamily: C.mono, fontSize: 'clamp(40px,12vw,64px)', fontWeight: 800,
              color: justClaimed ? C.green : C.gold, lineHeight: 1,
              textShadow: `0 0 40px ${justClaimed ? C.green : C.gold}66`,
              transition: 'color .3s, text-shadow .3s',
            }}>
              {effectiveClaimable.toLocaleString()}
            </div>
            <div style={{ fontSize: 16, color: C.gold, marginTop: 6, fontWeight: 600 }}>{stream.token}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', background: C.green,
                boxShadow: `0 0 6px ${C.green}`,
                animation: 'pulse 1.4s infinite',
              }} />
              <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>
                Streaming live · +{stream.rate.toFixed(3)} {stream.token}/sec
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ height: 12, borderRadius: 99, background: 'rgba(255,255,255,.07)', position: 'relative', overflow: 'hidden', marginBottom: 10 }}>
              {/* Unlocked fill */}
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${pctUnlocked}%`, background: `${C.accent}3a`,
                transition: 'width .5s ease',
              }} />
              {/* Claimed fill */}
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${pctClaimed}%`,
                background: `linear-gradient(90deg,${C.gold}88,${C.gold})`,
                boxShadow: `0 0 10px ${C.gold}66`,
                transition: 'width .5s ease',
              }} />
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { l: 'Unlocked', v: Math.floor(unlocked).toLocaleString(), c: C.accent },
                { l: 'Claimed',  v: (stream.claimed + claimedExtra).toLocaleString(), c: C.gold },
                { l: 'Total',    v: stream.total.toLocaleString(), c: C.muted },
              ].map(x => (
                <div key={x.l} style={{
                  textAlign: 'center', padding: '10px 6px',
                  background: 'rgba(255,255,255,.03)', borderRadius: 11, border: '1px solid rgba(255,255,255,.06)',
                }}>
                  <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: x.c }}>{x.v}</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{x.l} {stream.token}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone gates (if applicable) */}
          {stream.milestones.length > 0 && (
            <div style={{ marginBottom: 20, padding: '12px 14px', background: `${C.blue}08`, border: `1px solid ${C.blue}22`, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Milestone Gates — {milestoneQuota}% unlocked
              </div>
              {stream.milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < stream.milestones.length - 1 ? 8 : 0 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: m.done ? `${C.green}20` : 'rgba(255,255,255,.06)',
                    border: `1.5px solid ${m.done ? C.green : 'rgba(255,255,255,.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: m.done ? C.green : C.muted,
                  }}>
                    {m.done ? '✓' : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: m.done ? '#fff' : C.muted }}>{m.label}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: m.done ? C.green : C.muted, marginLeft: 8 }}>{m.pct}%</span>
                  </div>
                  {!m.done && (
                    <Link href="/milestones" style={{ fontSize: 10, color: C.blue, textDecoration: 'none', fontWeight: 600 }}>Verify →</Link>
                  )}
                </div>
              ))}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.06)', fontSize: 11, color: C.muted }}>
                Quota cap: <span style={{ fontFamily: C.mono, color: C.blue }}>{quotaCap.toLocaleString()} {stream.token}</span>
                {' '}· remaining: <span style={{ fontFamily: C.mono, color: '#fff' }}>{Math.max(0, quotaCap - stream.claimed - claimedExtra).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Claim button */}
          <button
            onClick={handleClaim}
            disabled={effectiveClaimable <= 0}
            style={{
              width: '100%', padding: '15px 24px', borderRadius: 14, border: 'none',
              background: effectiveClaimable > 0
                ? `linear-gradient(135deg,${C.gold}cc,#a36a17cc)`
                : 'rgba(255,255,255,.06)',
              color: effectiveClaimable > 0 ? '#0b0a14' : C.muted,
              fontFamily: C.serif, fontSize: 15, fontWeight: 800, cursor: effectiveClaimable > 0 ? 'pointer' : 'not-allowed',
              boxShadow: effectiveClaimable > 0 ? `0 0 20px ${C.gold}44` : 'none',
              transition: 'all .2s',
            }}
          >
            {justClaimed
              ? '✓ Claimed!'
              : effectiveClaimable > 0
                ? `Claim ${effectiveClaimable.toLocaleString()} ${stream.token}`
                : stream.milestones.length > 0 && milestoneQuota === 0
                  ? 'No milestones verified yet'
                  : 'Nothing to claim yet'}
          </button>
          <div style={{ marginTop: 10, fontSize: 11, color: C.muted, textAlign: 'center' }}>
            Calls <code style={{ fontFamily: C.mono, color: C.accent }}>withdraw()</code> on-chain · tokens sent to your Phantom wallet
          </div>
        </div>

        {/* ── Stream metadata ─────────────────────────────────────── */}
        <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: 16 }}>
          {[
            { l: 'Stream ends',  v: stream.end,              icon: '📅' },
            { l: 'Cliff date',   v: stream.cliff,            icon: '🔒' },
            { l: 'Rate',         v: `${(stream.rate * 86400).toFixed(0)} ${stream.token} / day`, icon: '📈' },
            { l: 'Program',      v: 'DvhxiL5P…XTFf',        icon: '⛓' },
            { l: 'Network',      v: 'Solana Devnet',         icon: '🌐' },
          ].map((r, i, a) => (
            <div key={r.l} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: i < a.length - 1 ? '1px solid var(--ds-border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 12 }}>
                <span>{r.icon}</span>{r.l}
              </div>
              <span style={{ fontFamily: C.mono, fontSize: 12, color: '#fff' }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Links */}
        <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link href="/streams" style={{ fontSize: 12, color: C.accent, textDecoration: 'none' }}>← All Streams</Link>
          <span style={{ color: C.muted }}>·</span>
          <Link href="/milestones" style={{ fontSize: 12, color: C.blue, textDecoration: 'none' }}>Verify Milestones →</Link>
        </div>
      </div>
    </main>
  );
}
