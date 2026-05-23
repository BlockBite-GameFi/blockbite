'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// ─── Design System V3 ─────────────────────────────────────────────────────────
const DS = {
  bg0:    '#05040d',
  bg1:    '#09071a',
  bg2:    '#0e0c22',
  accent: '#a78bff',
  gold:   '#f5c66a',
  green:  '#5fd07a',
  red:    '#ff3b6b',
  blue:   '#7ad7ff',
  purple: '#c084fc',
  ember:  '#ff7a3a',
  muted:  'rgba(232,225,248,.38)',
  border: 'rgba(167,139,255,.13)',
  card:   'rgba(255,255,255,.042)',
  cinzel: "'Space Grotesk', system-ui, sans-serif",
  sora:   "'Sora', system-ui, sans-serif",
  mono:   "'JetBrains Mono', monospace",
};

type VerifyMethod = 'game' | 'oracle' | 'multisig' | 'manual';

interface Milestone {
  index: number;
  label: string;
  pct: number;
  done: boolean;
  source: string;
  date?: string;
}

interface MilestoneStream {
  id: string;
  name: string;
  token: string;
  total: number;
  claimed: number;
  milestones: Milestone[];
  authority: string;
  beneficiary: string;
}

const VERIFY_METHODS: {
  id: VerifyMethod;
  label: string;
  icon: string;
  color: string;
  title: string;
  desc: string;
  badge: string;
  detail: string;
  action: string;
}[] = [
  {
    id: 'game', label: 'Game', icon: '◈', color: DS.purple,
    title: 'Play to Unlock',
    desc: 'Token recipients play the BlockBite puzzle game. Score thresholds trigger on-chain milestone verification.',
    badge: 'Sybil-Resistant',
    detail: 'Score ≥ 1,000 points to verify this milestone. Each verified session submits a signed proof to the TDP program.',
    action: 'Play & Verify',
  },
  {
    id: 'oracle', label: 'Oracle', icon: '⬡', color: DS.blue,
    title: 'Chainlink Automated',
    desc: 'Connect any on-chain data feed. KPI thresholds (user count, revenue, TVL) trigger milestone unlock automatically.',
    badge: 'Fully Automated',
    detail: 'Configure an oracle endpoint and threshold value. The TDP program polls on a schedule and auto-verifies.',
    action: 'Connect Feed',
  },
  {
    id: 'multisig', label: 'MultiSig', icon: '◉', color: DS.gold,
    title: 'Multi-Sig Approval',
    desc: '3-of-5 designated signers approve milestone completion. Ideal for DAO governance and advisory boards.',
    badge: 'DAO Native',
    detail: '3 of 5 configured signers must co-sign a verify_milestone instruction. Signer list is locked at stream creation.',
    action: 'Collect Signatures',
  },
  {
    id: 'manual', label: 'Manual', icon: '✦', color: DS.green,
    title: 'Creator Signs',
    desc: 'Stream creator manually verifies KPI completion with a signed transaction. Simple and transparent.',
    badge: 'Permissioned',
    detail: 'Enter the KPI description and the stream creator wallet submits a signed verify_milestone transaction.',
    action: 'Creator Verify',
  },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_STREAMS: MilestoneStream[] = [
  {
    id: 'stm-002', name: 'Advisor Round', token: 'BBT',
    total: 120_000, claimed: 12_000,
    authority: '35z7X5…NxFzr', beneficiary: 'B55a…1D3e',
    milestones: [
      { index: 0, label: 'Token Launch',       pct: 25, done: true,  source: 'manual',   date: '2025-03-01' },
      { index: 1, label: 'Mainnet Deploy',      pct: 25, done: false, source: 'manual'   },
      { index: 2, label: '10K Active Players',  pct: 25, done: false, source: 'game'     },
      { index: 3, label: 'Protocol V2 Release', pct: 25, done: false, source: 'multisig' },
    ],
  },
  {
    id: 'stm-006', name: 'Game Rewards Pool', token: 'BBT',
    total: 300_000, claimed: 45_000,
    authority: '35z7X5…NxFzr', beneficiary: 'F13b…8Qa1',
    milestones: [
      { index: 0, label: 'Level 10 Clear',  pct: 20, done: true,  source: 'game', date: '2025-05-10' },
      { index: 1, label: 'Level 30 Clear',  pct: 30, done: true,  source: 'game', date: '2025-05-18' },
      { index: 2, label: 'Level 50 Clear',  pct: 50, done: false, source: 'game' },
    ],
  },
  {
    id: 'stm-005', name: 'VC Seed Round', token: 'BBT',
    total: 750_000, claimed: 0,
    authority: '35z7X5…NxFzr', beneficiary: 'E72f…9C4b',
    milestones: [
      { index: 0, label: 'Product Launch',    pct: 33, done: false, source: 'manual'  },
      { index: 1, label: '1M Revenue',        pct: 33, done: false, source: 'oracle'  },
      { index: 2, label: 'Series A Close',    pct: 34, done: false, source: 'multisig'},
    ],
  },
];

function SourceBadge({ source }: { source: string }) {
  const m = VERIFY_METHODS.find(v => v.id === source);
  const color = m?.color ?? DS.muted;
  const label = m?.label ?? source;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 99, fontSize: 9.5, fontWeight: 700,
      letterSpacing: '.04em', background: `${color}18`, color, border: `1px solid ${color}33`,
      fontFamily: DS.sora,
    }}>{label}</span>
  );
}

export default function MilestonesPage() {
  const [streams, setStreams]           = useState<MilestoneStream[]>(INIT_STREAMS);
  const [selectedStream, setSelectedStream] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<VerifyMethod>('game');
  const [verifying, setVerifying]       = useState<number | null>(null);
  const [justVerified, setJustVerified] = useState<number | null>(null);
  const [confirmIdx, setConfirmIdx]     = useState<number | null>(null);

  const stream = streams[selectedStream];

  const verifiedPct = stream.milestones
    .filter(m => m.done)
    .reduce((a, m) => a + m.pct, 0);

  const quotaCap = Math.floor(stream.total * verifiedPct / 100);

  const handleVerify = async (idx: number) => {
    setConfirmIdx(null);
    setVerifying(idx);
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

  const activeMethod = VERIFY_METHODS.find(v => v.id === selectedMethod)!;

  return (
    <main style={{ minHeight: '100vh', background: DS.bg0, color: '#f0ecff', fontFamily: DS.sora }}>
      <Navbar />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '80px 24px 40px',
        background: `linear-gradient(180deg, ${DS.bg1} 0%, ${DS.bg0} 100%)`,
        borderBottom: `1px solid ${DS.border}`,
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.blue, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', fontFamily: DS.sora }}>
            TDP · Verification Layer
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h1 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(26px,5vw,42px)', fontWeight: 700, marginBottom: 10 }}>
                Milestone Verification Layer
              </h1>
              <p style={{ fontSize: 14, color: DS.muted, maxWidth: 580, lineHeight: 1.65 }}>
                Projects choose their verification method. All methods are enforceable on-chain via the TDP smart contract.
              </p>
            </div>
            <Link href="/streams" style={{ fontSize: 12, color: DS.muted, textDecoration: 'none' }}>← All Streams</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 100px' }}>

        {/* ── Verification Method Selector ───────────────────────────────────── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: '1.8px', color: DS.accent, fontWeight: 700, marginBottom: 18, textTransform: 'uppercase' }}>
            Select Verification Method
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            {VERIFY_METHODS.map(method => {
              const isActive = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  style={{
                    padding: '20px 18px', borderRadius: 18, textAlign: 'left', cursor: 'pointer',
                    background: isActive ? `${method.color}14` : DS.card,
                    border: `1.5px solid ${isActive ? method.color + '55' : DS.border}`,
                    color: '#f0ecff', fontFamily: DS.sora, transition: 'all .18s',
                    boxShadow: isActive ? `0 0 24px ${method.color}22` : 'none',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${method.color}18`, border: `1px solid ${method.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: method.color, marginBottom: 12,
                  }}>{method.icon}</div>
                  <div style={{ fontSize: 10, color: method.color, fontWeight: 700, letterSpacing: '1.4px', marginBottom: 4 }}>
                    {method.label.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: DS.cinzel, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{method.title}</div>
                  <div style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.5 }}>{method.desc}</div>
                  <div style={{
                    marginTop: 12, display: 'inline-block', padding: '2px 8px',
                    borderRadius: 99, fontSize: 9, fontWeight: 700, letterSpacing: '1px',
                    background: `${method.color}15`, color: method.color, border: `1px solid ${method.color}30`,
                  }}>{method.badge}</div>
                </button>
              );
            })}
          </div>

          {/* Method detail panel */}
          <div style={{
            marginTop: 16, padding: '18px 22px', borderRadius: 14,
            background: `${activeMethod.color}0a`, border: `1px solid ${activeMethod.color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 11, color: activeMethod.color, fontWeight: 700, marginBottom: 4 }}>
                {activeMethod.icon} {activeMethod.label} — {activeMethod.title}
              </div>
              <div style={{ fontSize: 13, color: DS.muted }}>{activeMethod.detail}</div>
            </div>
            {activeMethod.id === 'game' ? (
              <Link href="/game" style={{
                padding: '9px 20px', borderRadius: 10,
                background: `linear-gradient(135deg, ${DS.purple}cc, #6b21a8cc)`,
                color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}>{activeMethod.action} →</Link>
            ) : (
              <button style={{
                padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
                background: `${activeMethod.color}22`, border: `1px solid ${activeMethod.color}44`,
                color: activeMethod.color, fontWeight: 700, fontSize: 13, fontFamily: DS.sora,
              }}>{activeMethod.action} →</button>
            )}
          </div>
        </div>

        {/* ── Stream tabs + milestones ────────────────────────────────────────── */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {streams.map((s, i) => {
            const dPct = s.milestones.filter(m => m.done).reduce((a, m) => a + m.pct, 0);
            return (
              <button key={s.id} onClick={() => setSelectedStream(i)} style={{
                padding: '9px 16px', borderRadius: 11, cursor: 'pointer',
                border: `1.5px solid ${selectedStream === i ? DS.blue : 'rgba(255,255,255,.08)'}`,
                background: selectedStream === i ? `${DS.blue}14` : DS.card,
                color: selectedStream === i ? DS.blue : DS.muted,
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                transition: 'all .15s', fontFamily: DS.sora,
              }}>
                {s.name}
                <span style={{
                  marginLeft: 8, fontFamily: DS.mono, fontSize: 10,
                  color: dPct === 100 ? DS.green : selectedStream === i ? DS.blue : DS.muted,
                }}>{dPct}%</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* ── Milestones list ─────────────────────────────────────────────── */}
          <div>
            {/* Stream info bar */}
            <div style={{
              padding: '14px 18px', background: DS.card, border: `1px solid ${DS.border}`,
              borderRadius: 14, marginBottom: 18, display: 'flex', gap: 20, flexWrap: 'wrap',
            }}>
              {[
                { l: 'Stream',         v: stream.id,                                    c: DS.accent },
                { l: 'Total',          v: `${stream.total.toLocaleString()} ${stream.token}`, c: '#fff' },
                { l: 'Quota Unlocked', v: `${quotaCap.toLocaleString()}`,                c: DS.blue  },
                { l: 'Authority',      v: stream.authority,                              c: DS.muted },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontSize: 9.5, color: DS.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 2 }}>{s.l}</div>
                  <div style={{ fontFamily: DS.mono, fontSize: 11.5, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Milestone cards */}
            {stream.milestones.map((m) => {
              const isVerifying   = verifying === m.index;
              const isJustVerified = justVerified === m.index;
              const isConfirming  = confirmIdx === m.index;

              return (
                <div key={m.index} style={{
                  background: m.done ? `${DS.green}06` : DS.card,
                  border: `1px solid ${m.done ? DS.green + '33' : isConfirming ? DS.gold + '44' : DS.border}`,
                  borderRadius: 14, padding: '18px 20px', marginBottom: 12,
                  transition: 'all .2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Index circle */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: DS.mono, fontSize: 14, fontWeight: 700,
                      background: m.done ? `${DS.green}20` : 'rgba(255,255,255,.06)',
                      border: `2px solid ${m.done ? DS.green : 'rgba(255,255,255,.1)'}`,
                      color: m.done ? DS.green : DS.muted,
                      boxShadow: m.done ? `0 0 12px ${DS.green}33` : 'none',
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
                          <span style={{ fontFamily: DS.mono, fontSize: 10, color: DS.muted }}>Verified {m.date}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ fontFamily: DS.mono, fontSize: 12, color: m.done ? DS.green : DS.muted }}>
                          {m.pct}% allocation
                          <span style={{ color: m.done ? DS.green : DS.muted, marginLeft: 6, fontSize: 10 }}>
                            ({Math.floor(stream.total * m.pct / 100).toLocaleString()} {stream.token})
                          </span>
                        </div>
                        {m.done && <span style={{ fontSize: 11, color: DS.green, fontWeight: 600 }}>✓ Unlocked on-chain</span>}
                      </div>
                    </div>

                    {/* Action */}
                    {!m.done && (
                      <div style={{ flexShrink: 0 }}>
                        {isConfirming ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleVerify(m.index)} style={{
                              padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                              background: `linear-gradient(135deg, ${DS.green}, #0d6e2e)`,
                              color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: DS.sora,
                            }}>Confirm</button>
                            <button onClick={() => setConfirmIdx(null)} style={{
                              padding: '8px 12px', borderRadius: 9, cursor: 'pointer',
                              background: 'rgba(255,255,255,.06)', border: `1px solid ${DS.border}`,
                              color: DS.muted, fontWeight: 600, fontSize: 12, fontFamily: DS.sora,
                            }}>Cancel</button>
                          </div>
                        ) : isVerifying ? (
                          <div style={{
                            padding: '8px 16px', borderRadius: 9,
                            background: `${DS.blue}18`, border: `1px solid ${DS.blue}33`,
                            color: DS.blue, fontSize: 12, fontWeight: 600,
                          }}>
                            Verifying…
                          </div>
                        ) : isJustVerified ? (
                          <div style={{
                            padding: '8px 16px', borderRadius: 9,
                            background: `${DS.green}18`, border: `1px solid ${DS.green}33`,
                            color: DS.green, fontSize: 12, fontWeight: 700,
                          }}>✓ Verified!</div>
                        ) : (
                          <button onClick={() => setConfirmIdx(m.index)} style={{
                            padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
                            background: `linear-gradient(135deg, ${DS.blue}cc, #0a3a5acc)`,
                            color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: DS.sora,
                            boxShadow: `0 0 14px ${DS.blue}33`,
                          }}>Verify →</button>
                        )}
                      </div>
                    )}
                  </div>

                  {m.done && (
                    <div style={{ marginTop: 12, height: 3, borderRadius: 99, background: DS.green, opacity: .35 }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Side panel ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Quota summary */}
            <div style={{
              background: DS.card, border: `1px solid ${DS.border}`,
              borderRadius: 16, padding: '18px 20px',
            }}>
              <div style={{ fontFamily: DS.cinzel, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                Milestone Quota
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                  <span style={{ color: DS.muted }}>Verified quota</span>
                  <span style={{ fontFamily: DS.mono, color: DS.blue, fontWeight: 700 }}>{verifiedPct}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${verifiedPct}%`, borderRadius: 99,
                    background: `linear-gradient(90deg, ${DS.blue}88, ${DS.blue})`,
                    boxShadow: `0 0 8px ${DS.blue}55`,
                    transition: 'width .5s ease',
                  }} />
                </div>
              </div>
              {[
                { l: 'Total supply',   v: `${stream.total.toLocaleString()} ${stream.token}`,             c: '#fff'    },
                { l: 'Quota unlocked', v: `${quotaCap.toLocaleString()} ${stream.token}`,                 c: DS.blue   },
                { l: 'Claimed so far', v: `${stream.claimed.toLocaleString()} ${stream.token}`,            c: DS.gold   },
                { l: 'Claimable now',  v: `${Math.max(0, quotaCap - stream.claimed).toLocaleString()}`,   c: DS.green  },
              ].map((r, i, a) => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < a.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                  <span style={{ fontSize: 11, color: DS.muted }}>{r.l}</span>
                  <span style={{ fontFamily: DS.mono, fontSize: 11.5, color: r.c, fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
            </div>

            {/* Formula */}
            <div style={{
              background: `${DS.blue}08`, border: `1px solid ${DS.blue}22`,
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ fontSize: 10, color: DS.blue, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Claimable Formula
              </div>
              <pre style={{ fontFamily: DS.mono, fontSize: 10, color: 'rgba(255,255,255,.75)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{`claimable(t) = min(
  unlocked(t),        // linear
  total × Σ pct[i]    // quota cap
  where verified[i]=true
)`}</pre>
            </div>

            {/* Verification log placeholder */}
            <div style={{
              background: DS.card, border: `1px solid ${DS.border}`,
              borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 10, color: DS.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                Verification Log
              </div>
              {stream.milestones.filter(m => m.done).map(m => (
                <div key={m.index} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid rgba(255,255,255,.04)` }}>
                  <span style={{ fontSize: 11, color: DS.green }}>✓ {m.label}</span>
                  <span style={{ fontFamily: DS.mono, fontSize: 10, color: DS.muted }}>{m.date}</span>
                </div>
              ))}
              {stream.milestones.filter(m => m.done).length === 0 && (
                <div style={{ fontSize: 12, color: DS.muted, textAlign: 'center', padding: '8px 0' }}>No verifications yet</div>
              )}
            </div>

            {/* Quick links */}
            <div style={{
              background: DS.card, border: `1px solid ${DS.border}`,
              borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ fontSize: 10, color: DS.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Related</div>
              {[
                { href: '/claim',     label: 'Claim Portal',      col: DS.gold   },
                { href: '/streams',   label: 'All Streams',       col: DS.accent },
                { href: '/analytics', label: 'Protocol Analytics', col: DS.green  },
                { href: '/game',      label: 'Play & Verify',      col: DS.purple },
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
