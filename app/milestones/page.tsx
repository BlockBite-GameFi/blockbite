'use client';

import { useState } from 'react';
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

interface Milestone {
  index: number;
  label: string;
  pct:   number;
  done:  boolean;
  source: string;
  date?:  string;
}

interface MilestoneStream {
  id:         string;
  name:       string;
  token:      string;
  total:      number;
  claimed:    number;
  milestones: Milestone[];
  authority:  string;
  beneficiary:string;
}

// ─── Mock milestone streams ───────────────────────────────────────────────────
const INIT_STREAMS: MilestoneStream[] = [
  {
    id: 'stm-002', name: 'Advisor Round', token: 'BBT',
    total: 120_000, claimed: 12_000,
    authority: '35z7X5…NxFzr', beneficiary: 'B55a…1D3e',
    milestones: [
      { index: 0, label: 'Token Launch',       pct: 25, done: true,  source: 'Authority call', date: '2025-03-01' },
      { index: 1, label: 'Mainnet Deploy',      pct: 25, done: false, source: 'Authority call' },
      { index: 2, label: '10K Active Players',  pct: 25, done: false, source: 'Game CPI' },
      { index: 3, label: 'Protocol V2 Release', pct: 25, done: false, source: 'Multi-sig' },
    ],
  },
  {
    id: 'stm-006', name: 'Game Rewards Pool', token: 'BBT',
    total: 300_000, claimed: 45_000,
    authority: '35z7X5…NxFzr', beneficiary: 'F13b…8Qa1',
    milestones: [
      { index: 0, label: 'Level 10 Clear',  pct: 20, done: true,  source: 'Game CPI', date: '2025-05-10' },
      { index: 1, label: 'Level 30 Clear',  pct: 30, done: true,  source: 'Game CPI', date: '2025-05-18' },
      { index: 2, label: 'Level 50 Clear',  pct: 50, done: false, source: 'Game CPI' },
    ],
  },
  {
    id: 'stm-005', name: 'VC Seed Round', token: 'BBT',
    total: 750_000, claimed: 0,
    authority: '35z7X5…NxFzr', beneficiary: 'E72f…9C4b',
    milestones: [
      { index: 0, label: 'Product Launch',    pct: 33, done: false, source: 'Authority call' },
      { index: 1, label: '1M Revenue',        pct: 33, done: false, source: 'Switchboard Oracle' },
      { index: 2, label: 'Series A Close',    pct: 34, done: false, source: 'Multi-sig' },
    ],
  },
];

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    'Game CPI':          C.blue,
    'Authority call':    C.accent,
    'Multi-sig':         C.gold,
    'Switchboard Oracle':C.green,
  };
  const c = colors[source] ?? C.muted;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 99, fontSize: 9.5, fontWeight: 700,
      letterSpacing: '.04em', background: `${c}18`, color: c, border: `1px solid ${c}33`,
    }}>{source}</span>
  );
}

export default function MilestonesPage() {
  const [streams, setStreams] = useState<MilestoneStream[]>(INIT_STREAMS);
  const [selectedStream, setSelectedStream] = useState(0);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [justVerified, setJustVerified] = useState<number | null>(null);
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);

  const stream = streams[selectedStream];

  const verifiedPct = stream.milestones
    .filter(m => m.done)
    .reduce((a, m) => a + m.pct, 0);

  const quotaCap = Math.floor(stream.total * verifiedPct / 100);

  const handleVerify = async (idx: number) => {
    setConfirmIdx(null);
    setVerifying(idx);
    // Simulate on-chain call delay
    await new Promise(r => setTimeout(r, 1500));
    setStreams(prev => prev.map((s, si) =>
      si !== selectedStream ? s : {
        ...s,
        milestones: s.milestones.map(m =>
          m.index === idx
            ? { ...m, done: true, date: new Date().toISOString().slice(0, 10) }
            : m
        ),
      }
    ));
    setVerifying(null);
    setJustVerified(idx);
    setTimeout(() => setJustVerified(null), 2500);
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ds-bg)', color: 'var(--ds-text)' }}>
      <Navbar />

      {/* Header */}
      <div style={{ padding: '80px 24px 32px', background: 'linear-gradient(180deg,#060a1a 0%,var(--ds-bg) 100%)', borderBottom: '1px solid #1f1f3a' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: C.blue, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>
            TDP · Milestone Verifier
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: C.serif, fontSize: 'clamp(24px,5vw,40px)', fontWeight: 900, marginBottom: 8 }}>
                Milestone Verification
              </h1>
              <p style={{ fontSize: 13, color: C.muted, maxWidth: 520 }}>
                Call <code style={{ fontFamily: C.mono, color: C.blue }}>verify_milestone(index)</code> on-chain to unlock token allocation for each verified checkpoint.
                Sources: Game CPI · Authority · Oracle · Multi-sig.
              </p>
            </div>
            <Link href="/streams" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>← All Streams</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 100px' }}>

        {/* Stream tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
          {streams.map((s, i) => {
            const dPct = s.milestones.filter(m => m.done).reduce((a, m) => a + m.pct, 0);
            return (
              <button key={s.id} onClick={() => setSelectedStream(i)} style={{
                padding: '9px 16px', borderRadius: 11,
                border: `1.5px solid ${selectedStream === i ? C.blue : 'rgba(255,255,255,.08)'}`,
                background: selectedStream === i ? `${C.blue}14` : 'rgba(255,255,255,.04)',
                color: selectedStream === i ? C.blue : C.muted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all .15s',
              }}>
                {s.name}
                <span style={{
                  marginLeft: 8, fontFamily: C.mono, fontSize: 10,
                  color: dPct === 100 ? C.green : selectedStream === i ? C.blue : C.muted,
                }}>{dPct}%</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* ── Milestones list ─────────────────────────────────────── */}
          <div>
            {/* Stream info bar */}
            <div style={{
              padding: '14px 18px', background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
              borderRadius: 14, marginBottom: 18, display: 'flex', gap: 20, flexWrap: 'wrap',
            }}>
              {[
                { l: 'Stream',      v: stream.id,                        c: C.accent },
                { l: 'Total',       v: `${stream.total.toLocaleString()} ${stream.token}`, c: '#fff' },
                { l: 'Quota Unlocked', v: `${quotaCap.toLocaleString()}`,c: C.blue },
                { l: 'Authority',   v: stream.authority,                 c: C.muted },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 2 }}>{s.l}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 11.5, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Milestones */}
            {stream.milestones.map((m, i) => {
              const isVerifying  = verifying === m.index;
              const isJustVerified = justVerified === m.index;
              const isConfirming = confirmIdx === m.index;

              return (
                <div key={m.index} style={{
                  background: m.done ? `${C.green}06` : 'var(--ds-surface)',
                  border: `1px solid ${m.done ? C.green + '33' : isConfirming ? C.gold + '44' : 'var(--ds-border)'}`,
                  borderRadius: 14, padding: '18px 20px', marginBottom: 12,
                  transition: 'all .2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

                    {/* Index circle */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: C.mono, fontSize: 14, fontWeight: 700,
                      background: m.done ? `${C.green}20` : 'rgba(255,255,255,.06)',
                      border: `2px solid ${m.done ? C.green : 'rgba(255,255,255,.1)'}`,
                      color: m.done ? C.green : C.muted,
                      boxShadow: m.done ? `0 0 12px ${C.green}33` : 'none',
                    }}>
                      {m.done ? '✓' : m.index}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: m.done ? '#fff' : 'rgba(255,255,255,.8)' }}>
                          {m.label}
                        </span>
                        <SourceBadge source={m.source} />
                        {m.done && m.date && (
                          <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>Verified {m.date}</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ fontFamily: C.mono, fontSize: 12, color: m.done ? C.green : C.muted }}>
                          {m.pct}% allocation
                          <span style={{ color: m.done ? C.green : C.muted, marginLeft: 6, fontSize: 10 }}>
                            ({Math.floor(stream.total * m.pct / 100).toLocaleString()} {stream.token})
                          </span>
                        </div>

                        {m.done && (
                          <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>✓ Unlocked on-chain</span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    {!m.done && (
                      <div style={{ flexShrink: 0 }}>
                        {isConfirming ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleVerify(m.index)} style={{
                              padding: '8px 16px', borderRadius: 9, border: 'none',
                              background: `linear-gradient(135deg,${C.green},#0d6e2e)`,
                              color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                            }}>Confirm</button>
                            <button onClick={() => setConfirmIdx(null)} style={{
                              padding: '8px 12px', borderRadius: 9,
                              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                              color: C.muted, fontWeight: 600, fontSize: 12, cursor: 'pointer',
                            }}>Cancel</button>
                          </div>
                        ) : isVerifying ? (
                          <div style={{
                            padding: '8px 16px', borderRadius: 9, background: `${C.blue}18`,
                            border: `1px solid ${C.blue}33`, color: C.blue, fontSize: 12, fontWeight: 600,
                          }}>
                            <span style={{ animation: 'pulse 1s infinite', display: 'inline-block' }}>Verifying…</span>
                          </div>
                        ) : isJustVerified ? (
                          <div style={{
                            padding: '8px 16px', borderRadius: 9, background: `${C.green}18`,
                            border: `1px solid ${C.green}33`, color: C.green, fontSize: 12, fontWeight: 700,
                          }}>✓ Verified!</div>
                        ) : (
                          <button onClick={() => setConfirmIdx(m.index)} style={{
                            padding: '8px 18px', borderRadius: 9, border: 'none',
                            background: `linear-gradient(135deg,${C.blue}cc,#0a3a5acc)`,
                            color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                            boxShadow: `0 0 14px ${C.blue}33`,
                          }}>Verify →</button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Progress bar sub-fill for individual milestone */}
                  {m.done && (
                    <div style={{ marginTop: 12, height: 3, borderRadius: 99, background: C.green, opacity: .35 }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Side panel ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Quota summary */}
            <div style={{
              background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
              borderRadius: 16, padding: '18px 20px',
            }}>
              <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                Milestone Quota
              </div>

              {/* Donut-style bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                  <span style={{ color: C.muted }}>Verified quota</span>
                  <span style={{ fontFamily: C.mono, color: C.blue, fontWeight: 700 }}>{verifiedPct}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${verifiedPct}%`, borderRadius: 99,
                    background: `linear-gradient(90deg,${C.blue}88,${C.blue})`,
                    boxShadow: `0 0 8px ${C.blue}55`,
                    transition: 'width .5s ease',
                  }} />
                </div>
              </div>

              {[
                { l: 'Total supply',      v: `${stream.total.toLocaleString()} ${stream.token}`,   c: '#fff'   },
                { l: 'Quota unlocked',    v: `${quotaCap.toLocaleString()} ${stream.token}`,       c: C.blue   },
                { l: 'Claimed so far',    v: `${stream.claimed.toLocaleString()} ${stream.token}`, c: C.gold   },
                { l: 'Claimable now',     v: `${Math.max(0, quotaCap - stream.claimed).toLocaleString()}`, c: C.green },
              ].map((r, i, a) => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < a.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{r.l}</span>
                  <span style={{ fontFamily: C.mono, fontSize: 11.5, color: r.c, fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
            </div>

            {/* Formula box */}
            <div style={{
              background: `${C.blue}08`, border: `1px solid ${C.blue}22`,
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Claimable Formula
              </div>
              <pre style={{ fontFamily: C.mono, fontSize: 10, color: 'rgba(255,255,255,.75)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{`claimable(t) = min(
  unlocked(t),        // linear
  total × Σ pct[i]    // quota cap
  where verified[i]=true
)`}</pre>
            </div>

            {/* Quick links */}
            <div style={{
              background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
              borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Related</div>
              {[
                { href: '/claim',    label: 'Claim Portal',     col: C.gold  },
                { href: '/streams',  label: 'All Streams',      col: C.accent },
                { href: '/analytics',label: 'Protocol Analytics',col: C.green },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ fontSize: 12.5, color: l.col, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: l.col, flexShrink: 0 }} />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
