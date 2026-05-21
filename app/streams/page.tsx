'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// ─── Mock stream data (replaces on-chain fetch once wallet connected) ─────────
const MOCK_STREAMS = [
  { id: 'stm-001', name: 'Team Allocation',   token: 'BBT', total: 500_000, claimed: 80_000,  unlocked: 140_000, cliff: '2025-06-01', end: '2027-01-01', type: 'linear',    status: 'active',    creator: '35z7X5…NxFzr', recipient: '3f7a…c9b2', milestones: 0 },
  { id: 'stm-002', name: 'Advisor Round',     token: 'BBT', total: 120_000, claimed: 12_000,  unlocked:  30_000, cliff: '2025-03-15', end: '2026-03-15', type: 'milestone', status: 'active',    creator: '35z7X5…NxFzr', recipient: 'B55a…1D3e', milestones: 4 },
  { id: 'stm-003', name: 'Ecosystem Fund',    token: 'BBT', total: 1_000_000, claimed: 0,     unlocked:       0, cliff: '2026-01-01', end: '2028-01-01', type: 'cliff',     status: 'pending',   creator: 'C99d…8A2f',    recipient: '3f7a…c9b2', milestones: 0 },
  { id: 'stm-004', name: 'Player Rewards S1', token: 'BBT', total: 200_000, claimed: 200_000, unlocked: 200_000, cliff: '2024-09-01', end: '2025-03-01', type: 'linear',    status: 'completed', creator: 'D44c…5B1a',    recipient: '3f7a…c9b2', milestones: 0 },
  { id: 'stm-005', name: 'VC Seed Round',     token: 'BBT', total: 750_000, claimed: 0,       unlocked:       0, cliff: '2025-12-01', end: '2027-12-01', type: 'hybrid',    status: 'active',    creator: '35z7X5…NxFzr', recipient: 'E72f…9C4b', milestones: 3 },
  { id: 'stm-006', name: 'Game Rewards Pool', token: 'BBT', total: 300_000, claimed: 45_000,  unlocked:  90_000, cliff: '2025-05-01', end: '2026-05-01', type: 'milestone', status: 'active',    creator: '35z7X5…NxFzr', recipient: 'F13b…8Qa1', milestones: 4 },
];

const TYPE_COLORS: Record<string, string> = {
  linear:    '#a78bfa',
  milestone: '#7ad7ff',
  cliff:     '#f5c66a',
  hybrid:    '#c084fc',
  pending:   '#94a3b8',
};
const STATUS_COLORS: Record<string, string> = {
  active:    '#5fd07a',
  pending:   '#f5c66a',
  completed: '#94a3b8',
  cancelled: '#ff3b6b',
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 99, fontSize: 10.5, fontWeight: 700,
      letterSpacing: '.04em', background: `${color}1a`, color, border: `1px solid ${color}44`,
    }}>{label}</span>
  );
}

function StatusDot({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? '#94a3b8';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />
      <span style={{ fontSize: 10.5, color: c, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{status}</span>
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 64, height: 5, borderRadius: 99, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 10.5, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(pct)}%</span>
    </div>
  );
}

export default function StreamsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTicker(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const liveTvl = (1_950_000 + ticker * 0.463).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const liveRate = (0.000463 + ticker * 0.000001).toFixed(6);

  const filtered = MOCK_STREAMS.filter(s => filter === 'all' || s.status === filter);

  const stats = [
    { label: 'Total Locked',     value: '$' + liveTvl,    sub: 'live TVL',               color: '#f5c66a', live: true  },
    { label: 'Active Streams',   value: String(MOCK_STREAMS.filter(s => s.status === 'active').length),  sub: 'currently streaming', color: '#a78bfa', live: false },
    { label: 'BBT Distributed',  value: '637K',            sub: 'all-time claimed',       color: '#5fd07a', live: false },
    { label: 'Stream Rate',      value: liveRate,          sub: 'TOKEN/sec live',         color: '#7ad7ff', live: true  },
  ];

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ds-bg)', color: 'var(--ds-text)' }}>
      <Navbar />

      {/* ── Header band ────────────────────────────────────────────── */}
      <div style={{ padding: '80px 24px 32px', background: 'linear-gradient(180deg,#0d0820 0%,var(--ds-bg) 100%)', borderBottom: '1px solid #1f1f3a' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#a78bfa', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>TDP Protocol · Devnet</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(26px,5vw,44px)', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8 }}>
                Token Streams
              </h1>
              <p style={{ fontSize: 13, color: 'var(--ds-text-dim)', maxWidth: 520 }}>
                Sablier-style vesting protocol on Solana — cliff · linear · milestone · hybrid streams. Each stream is a PDA vault with configurable unlock conditions.
              </p>
            </div>
            <Link href="/streams/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
              background: 'linear-gradient(135deg,#a78bfa,#5e35d4)', color: '#fff', borderRadius: 12,
              fontWeight: 700, fontSize: 13, textDecoration: 'none', boxShadow: '0 0 20px #a78bfa44',
              letterSpacing: '.03em',
            }}>
              + Create Stream
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 100px' }}>

        {/* ── Live KPI Row ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 32 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
              borderRadius: 16, padding: '18px 20px', position: 'relative',
            }}>
              {s.live && (
                <div style={{
                  position: 'absolute', top: 12, right: 12, width: 7, height: 7, borderRadius: '50%',
                  background: '#5fd07a', boxShadow: '0 0 6px #5fd07a',
                  animation: 'pulse 1.4s ease-in-out infinite',
                }} />
              )}
              <div style={{ fontSize: 10, color: 'var(--ds-text-dim)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: s.value.length > 10 ? 18 : 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ds-text-dim)', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Filter tabs ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {(['all', 'active', 'pending', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              letterSpacing: '.04em', textTransform: 'uppercase',
              background: filter === f ? '#a78bfa' : 'rgba(255,255,255,.06)',
              color: filter === f ? '#fff' : 'var(--ds-text-dim)',
              transition: 'all .15s',
            }}>{f}</button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: 'var(--ds-text-dim)', alignSelf: 'center' }}>{filtered.length} stream{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* ── Streams table ─────────────────────────────────────────── */}
        <div style={{ background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.8fr 110px 1fr 140px 140px 110px 100px',
            padding: '10px 20px', borderBottom: '1px solid var(--ds-border)',
            background: 'rgba(255,255,255,.03)',
          }}>
            {['STREAM', 'TYPE', 'RECIPIENT', 'TOTAL LOCKED', 'UNLOCKED', 'PROGRESS', 'STATUS'].map(h => (
              <div key={h} style={{ fontSize: 9.5, color: 'var(--ds-text-dim)', fontWeight: 700, letterSpacing: '.06em' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ds-text-dim)', fontSize: 14 }}>
              No streams found
            </div>
          )}
          {filtered.map((s, i) => {
            const pct = s.total > 0 ? (s.unlocked / s.total) * 100 : 0;
            const typeCol = TYPE_COLORS[s.type] ?? '#a78bfa';
            return (
              <div key={s.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1.8fr 110px 1fr 140px 140px 110px 100px',
                  padding: '13px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--ds-border)',
                  background: i % 2 ? 'rgba(255,255,255,.01)' : 'transparent',
                  alignItems: 'center', transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,250,.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 ? 'rgba(255,255,255,.01)' : 'transparent')}
              >
                {/* Name */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--ds-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {s.id} {s.milestones > 0 && <span style={{ color: '#7ad7ff' }}>· {s.milestones} milestones</span>}
                  </div>
                </div>
                {/* Type */}
                <div><Badge label={s.type.toUpperCase()} color={typeCol} /></div>
                {/* Recipient */}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'var(--ds-text-dim)' }}>
                  {s.recipient}
                </div>
                {/* Total */}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#fff' }}>
                  {s.total.toLocaleString()} <span style={{ color: '#a78bfa', fontSize: 10 }}>{s.token}</span>
                </div>
                {/* Unlocked */}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#a78bfa' }}>
                  {s.unlocked.toLocaleString()}
                </div>
                {/* Progress bar */}
                <MiniBar pct={pct} color={typeCol} />
                {/* Status */}
                <StatusDot status={s.status} />
              </div>
            );
          })}

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--ds-border)', background: 'rgba(255,255,255,.02)', fontSize: 11, color: 'var(--ds-text-dim)' }}>
            Streams update in real-time · PDA-controlled vaults on Solana devnet · Program: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#a78bfa' }}>DvhxiL5P…XTFf</span>
          </div>
        </div>

        {/* ── Stream type breakdown ─────────────────────────────────── */}
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
          <div style={{ background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
              Stream Types
            </div>
            {[
              { type: 'Linear',    pct: 44, col: '#a78bfa', n: 2 },
              { type: 'Milestone', pct: 28, col: '#7ad7ff', n: 2 },
              { type: 'Cliff',     pct: 18, col: '#f5c66a', n: 1 },
              { type: 'Hybrid',    pct: 10, col: '#c084fc', n: 1 },
            ].map(s => (
              <div key={s.type} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.col }} />
                    <span style={{ fontSize: 12, color: '#fff' }}>{s.type}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: s.col, fontWeight: 700 }}>{s.pct}%</span>
                    <span style={{ fontSize: 10, color: 'var(--ds-text-dim)', marginLeft: 5 }}>({s.n})</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, borderRadius: 99, background: `linear-gradient(90deg,${s.col}77,${s.col})` }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Create New Stream', href: '/streams/new', col: '#a78bfa', desc: 'Lock tokens into a PDA vault' },
                { label: 'Claim Tokens',      href: '/claim',        col: '#5fd07a', desc: 'Withdraw vested tokens' },
                { label: 'Verify Milestone',  href: '/milestones',   col: '#7ad7ff', desc: 'Unlock milestone allocation' },
                { label: 'Vesting Calculator',href: '/calculator',   col: '#f5c66a', desc: 'Model distribution schedule' },
              ].map(a => (
                <Link key={a.href} href={a.href} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: 'rgba(255,255,255,.03)', border: `1px solid rgba(255,255,255,.06)`,
                  borderRadius: 10, textDecoration: 'none', transition: 'all .15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = a.col + '44'; (e.currentTarget as HTMLElement).style.background = a.col + '0a'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.03)'; }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.col, boxShadow: `0 0 6px ${a.col}`, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>{a.label}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ds-text-dim)', marginTop: 1 }}>{a.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
