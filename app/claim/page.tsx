'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// ─── Design System V3 ─────────────────────────────────────────────────────────
const DS = {
  bg0:      '#05040d',
  bg1:      '#09071a',
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
  cinzel:   "'Cinzel', serif",
  sora:     "'Sora', system-ui, sans-serif",
  mono:     "'JetBrains Mono', monospace",
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
      { label: 'Token Launch',   pct: 25, done: true  },
      { label: 'Mainnet Deploy', pct: 25, done: false },
      { label: '10K Players',    pct: 25, done: false },
      { label: 'Protocol V2',    pct: 25, done: false },
    ],
  },
  {
    id: 'stm-006', name: 'Game Rewards Pool',  token: 'BBT',
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
  const [selectedIdx,  setSelectedIdx]  = useState(0);
  const [ticker,       setTicker]       = useState(0);
  const [justClaimed,  setJustClaimed]  = useState(false);
  const [claimedExtra, setClaimedExtra] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTicker(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setJustClaimed(false);
    setClaimedExtra(0);
  }, [selectedIdx]);

  const stream        = CLAIMABLE_STREAMS[selectedIdx];
  const unlocked      = stream.claimed + claimedExtra + ticker * stream.rate;
  const claimable     = Math.max(0, Math.floor(unlocked - stream.claimed - claimedExtra));
  const pctUnlocked   = Math.min(100, (unlocked / stream.total) * 100);
  const pctClaimed    = Math.min(100, ((stream.claimed + claimedExtra) / stream.total) * 100);

  const milestoneQuota = stream.milestones.length > 0
    ? stream.milestones.filter(m => m.done).reduce((a, m) => a + m.pct, 0)
    : 100;
  const quotaCap = Math.floor(stream.total * milestoneQuota / 100);
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
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 30% 40%,${DS.accent}08,transparent 60%),${DS.bg0}`,
      color: '#f0ecff', fontFamily: DS.sora, overflowX: 'hidden',
    }}>
      <Navbar />

      <main style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '120px 24px 80px', gap: 16,
      }}>

        {/* Page label */}
        <div style={{ fontSize: 10, letterSpacing: '2.5px', color: DS.blue, fontWeight: 700, textTransform: 'uppercase' }}>
          TDP · Claim Portal
        </div>
        <h1 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, margin: '0 0 4px', textAlign: 'center' }}>
          Claim Streamed Tokens
        </h1>
        <p style={{ fontSize: 13, color: DS.muted, textAlign: 'center', maxWidth: 400, marginBottom: 12 }}>
          Tokens stream second-by-second. Withdraw any vested amount at any time — milestone gates apply.
        </p>

        {/* Stream selector tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, overflowX: 'auto', maxWidth: 440, width: '100%' }}>
          {CLAIMABLE_STREAMS.map((s, i) => (
            <button key={s.id} onClick={() => setSelectedIdx(i)} style={{
              padding: '7px 14px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap',
              border: `1.5px solid ${selectedIdx === i ? DS.accent : DS.border}`,
              background: selectedIdx === i ? `${DS.accent}18` : DS.card,
              color: selectedIdx === i ? DS.accent : DS.muted,
              fontSize: 12, fontWeight: 600, transition: 'all .15s',
            }}>{s.name}</button>
          ))}
        </div>

        {/* ─── Centered claim card (max 440px) ─────────────────────────────── */}
        <div style={{
          width: '100%', maxWidth: 440,
          background: 'rgba(10,8,26,.92)',
          border: `1.5px solid ${DS.accent}33`,
          borderRadius: 24, padding: '32px 28px',
          boxShadow: `0 0 60px ${DS.accent}12, 0 24px 60px rgba(0,0,0,.6)`,
        }}>

          {/* Stream header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontFamily: DS.mono, fontSize: 10, color: DS.accent, letterSpacing: '.12em', marginBottom: 6 }}>
              BLOCKBITE TDP · TOKEN STREAM
            </div>
            <div style={{ fontFamily: DS.cinzel, fontSize: 22, fontWeight: 800, color: '#fff' }}>{stream.name}</div>
            <div style={{ fontSize: 11, color: DS.muted, marginTop: 3 }}>{stream.id} · {stream.type.toUpperCase()}</div>
          </div>

          {/* "Available to Claim" large number */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 10, color: DS.muted, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              {stream.milestones.length > 0 ? 'Available to Claim (milestone-gated)' : 'Available to Claim'}
            </div>
            <div style={{
              fontFamily: DS.mono, fontSize: 'clamp(42px,12vw,64px)', fontWeight: 800, lineHeight: 1,
              color: justClaimed ? DS.green : DS.gold,
              textShadow: `0 0 40px ${justClaimed ? DS.green : DS.gold}66`,
              transition: 'color .3s, text-shadow .3s',
            }}>
              {effectiveClaimable.toLocaleString()}
            </div>
            <div style={{ fontSize: 16, color: DS.gold, marginTop: 6, fontWeight: 600, fontFamily: DS.mono }}>
              {stream.token}
            </div>
            {/* Live stream indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: DS.green,
                boxShadow: `0 0 8px ${DS.green}`,
                animation: 'pulse 1.4s ease-in-out infinite',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 11.5, color: DS.green, fontWeight: 600, fontFamily: DS.mono }}>
                +{stream.rate.toFixed(3)} {stream.token}/sec
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ height: 12, borderRadius: 99, background: 'rgba(255,255,255,.07)', position: 'relative', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${pctUnlocked}%`, background: `${DS.accent}3a`,
                transition: 'width .5s ease',
              }} />
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${pctClaimed}%`,
                background: `linear-gradient(90deg,${DS.gold}88,${DS.gold})`,
                boxShadow: `0 0 10px ${DS.gold}66`,
                transition: 'width .5s ease',
              }} />
            </div>

            {/* Stats row: Unlocked / Claimed / Total */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { l: 'Unlocked', v: Math.floor(unlocked).toLocaleString(), c: DS.accent },
                { l: 'Claimed',  v: (stream.claimed + claimedExtra).toLocaleString(), c: DS.gold   },
                { l: 'Total',    v: stream.total.toLocaleString(),                    c: DS.muted   },
              ].map(x => (
                <div key={x.l} style={{
                  textAlign: 'center', padding: '10px 6px',
                  background: 'rgba(255,255,255,.03)', borderRadius: 11,
                  border: '1px solid rgba(255,255,255,.06)',
                }}>
                  <div style={{ fontFamily: DS.mono, fontSize: 13, fontWeight: 700, color: x.c }}>{x.v}</div>
                  <div style={{ fontSize: 9, color: DS.muted, marginTop: 2 }}>{x.l} {stream.token}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone gates */}
          {stream.milestones.length > 0 && (
            <div style={{ marginBottom: 22, padding: '12px 14px', background: `${DS.blue}08`, border: `1px solid ${DS.blue}22`, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: DS.blue, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Milestone Gates — {milestoneQuota}% unlocked
              </div>
              {stream.milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < stream.milestones.length - 1 ? 8 : 0 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: m.done ? `${DS.green}20` : 'rgba(255,255,255,.06)',
                    border: `1.5px solid ${m.done ? DS.green : 'rgba(255,255,255,.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: m.done ? DS.green : DS.muted,
                  }}>
                    {m.done ? '✓' : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: m.done ? '#fff' : DS.muted }}>{m.label}</span>
                    <span style={{ fontFamily: DS.mono, fontSize: 10, color: m.done ? DS.green : DS.muted, marginLeft: 8 }}>{m.pct}%</span>
                  </div>
                  {!m.done && (
                    <Link href="/milestones" style={{ fontSize: 10, color: DS.blue, textDecoration: 'none', fontWeight: 600 }}>Verify →</Link>
                  )}
                </div>
              ))}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.06)', fontSize: 11, color: DS.muted }}>
                Quota cap: <span style={{ fontFamily: DS.mono, color: DS.blue }}>{quotaCap.toLocaleString()} {stream.token}</span>
                {' '}· remaining: <span style={{ fontFamily: DS.mono, color: '#fff' }}>{Math.max(0, quotaCap - stream.claimed - claimedExtra).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Large gold Claim button */}
          <button
            onClick={handleClaim}
            disabled={effectiveClaimable <= 0}
            style={{
              width: '100%', padding: '16px 24px', borderRadius: 14, border: 'none',
              background: effectiveClaimable > 0
                ? `linear-gradient(135deg,${DS.gold}cc,#a36a17cc)`
                : 'rgba(255,255,255,.06)',
              color: effectiveClaimable > 0 ? '#0b0a14' : DS.muted,
              fontFamily: DS.cinzel, fontSize: 16, fontWeight: 800,
              cursor: effectiveClaimable > 0 ? 'pointer' : 'not-allowed',
              boxShadow: effectiveClaimable > 0 ? `0 0 24px ${DS.gold}44` : 'none',
              letterSpacing: '.04em', transition: 'all .2s',
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
          <div style={{ marginTop: 10, fontSize: 11, color: DS.muted, textAlign: 'center' }}>
            Calls <span style={{ fontFamily: DS.mono, color: DS.accent }}>withdraw()</span> on-chain · sent to your wallet
          </div>
        </div>

        {/* ─── Details row ─────────────────────────────────────────────────── */}
        <div style={{
          width: '100%', maxWidth: 440,
          padding: '16px 20px', background: DS.card,
          border: `1px solid ${DS.border}`, borderRadius: 16,
        }}>
          {[
            { l: 'Stream ends', v: stream.end,                                      icon: '⏱' },
            { l: 'Cliff date',  v: stream.cliff,                                    icon: '🔒' },
            { l: 'Rate',        v: `${(stream.rate * 86400).toFixed(0)} ${stream.token} / day`, icon: '📈' },
            { l: 'Contract',    v: 'DvhxiL5P…XTFf',                                icon: '⛓' },
            { l: 'Network',     v: 'Solana Devnet',                                 icon: '🌐' },
          ].map((r, i, a) => (
            <div key={r.l} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0',
              borderBottom: i < a.length - 1 ? `1px solid ${DS.border}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: DS.muted, fontSize: 12 }}>
                <span>{r.icon}</span>{r.l}
              </div>
              <span style={{ fontFamily: DS.mono, fontSize: 12, color: '#fff' }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Navigation links */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 4 }}>
          <Link href="/streams" style={{ fontSize: 12, color: DS.accent, textDecoration: 'none' }}>← All Streams</Link>
          <span style={{ color: DS.muted }}>·</span>
          <Link href="/milestones" style={{ fontSize: 12, color: DS.blue, textDecoration: 'none' }}>Verify Milestones →</Link>
        </div>
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
      `}</style>
    </div>
  );
}
