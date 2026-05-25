'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useConnection } from '@solana/wallet-adapter-react';
import {
  getAllStreams,
  computeUnlocked,
  StreamInfo,
} from '@/lib/anchor/vesting-client';

const C = {
  accent: '#a78bfa', gold: '#f5c66a', green: '#5fd07a', blue: '#7ad7ff',
  red: '#f87171', muted: 'rgba(148,163,184,0.7)', border: 'rgba(167,139,250,0.15)',
  bg0: '#0b0918', bg1: '#0f0d1e',
  mono: '"JetBrains Mono",monospace', serif: '"Space Grotesk",system-ui,sans-serif',
};

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 20px', ...style }}>
      {children}
    </div>
  );
}

function streamType(s: StreamInfo): string {
  const cliff  = Number(s.cliffTs.toString());
  const start  = Number(s.startTs.toString());
  const hasMilestone = (s.milestoneCount ?? 0) > 0;
  const hasCliff     = cliff > start;
  if (hasMilestone && hasCliff) return 'hybrid';
  if (hasMilestone) return 'milestone';
  if (hasCliff) return 'cliff';
  return 'linear';
}

function streamStatus(s: StreamInfo, nowSec: number): string {
  if (s.cancelled) return 'cancelled';
  if (nowSec < Number(s.cliffTs.toString())) return 'pending';
  if (nowSec >= Number(s.endTs.toString())) return 'completed';
  return 'active';
}

export default function AnalyticsPage() {
  const { connection } = useConnection();
  const [streams,  setStreams]  = useState<StreamInfo[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [period,   setPeriod]   = useState('all');
  const nowSec = Math.floor(Date.now() / 1000);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getAllStreams(connection);
      setStreams(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'RPC error');
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => { load(); }, [load]);

  // ── Real aggregate metrics ──────────────────────────────────────────────────
  const totalLocked     = streams.reduce((a, s) => a + Number(s.amountTotal.toString()), 0) / 1e6;
  const totalWithdrawn  = streams.reduce((a, s) => a + Number(s.amountWithdrawn.toString()), 0) / 1e6;
  const totalClaimable  = streams.reduce((a, s) => a + Number(computeUnlocked(s, nowSec)), 0) / 1e6;
  const activeStreams   = streams.filter(s => streamStatus(s, nowSec) === 'active');
  const cancelledCount  = streams.filter(s => s.cancelled).length;

  // Type breakdown — real counts
  const typeCounts = streams.reduce((acc, s) => {
    const t = streamType(s);
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const total = streams.length || 1;
  const typeBreakdown = [
    { type: 'Linear',    pct: Math.round((typeCounts.linear ?? 0) / total * 100),    col: C.accent, n: typeCounts.linear ?? 0 },
    { type: 'Milestone', pct: Math.round((typeCounts.milestone ?? 0) / total * 100), col: C.blue,   n: typeCounts.milestone ?? 0 },
    { type: 'Cliff',     pct: Math.round((typeCounts.cliff ?? 0) / total * 100),     col: C.gold,   n: typeCounts.cliff ?? 0 },
    { type: 'Hybrid',    pct: Math.round((typeCounts.hybrid ?? 0) / total * 100),    col: '#c084fc', n: typeCounts.hybrid ?? 0 },
  ];

  // Top 6 by locked amount
  const topStreams = [...streams]
    .sort((a, b) => Number(b.amountTotal.toString()) - Number(a.amountTotal.toString()))
    .slice(0, 6);

  return (
    <div style={{ minHeight: '100vh', background: C.bg0, padding: '0 0 60px' }}>

      {/* ── Header ── */}
      <div style={{ padding: '32px 40px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Link href="/streams" style={{ color: C.muted, fontSize: 12, textDecoration: 'none' }}>← Streams</Link>
            <span style={{ color: C.muted, fontSize: 12 }}>·</span>
            <Link href="/demo#analytics" style={{ color: C.accent, fontSize: 12, textDecoration: 'none' }}>View demo ↗</Link>
          </div>
          <h1 style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
            Protocol Analytics
          </h1>
          <p style={{ fontSize: 12.5, color: C.muted, margin: '4px 0 0' }}>
            Live on-chain data · Solana devnet · Program DvhxiL5P…XTFf
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 9, padding: 3 }}>
            {(['7d', '30d', '90d', 'all'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: period === p ? C.accent : 'transparent',
                color: period === p ? '#fff' : C.muted,
                fontSize: 11, fontWeight: 600, fontFamily: C.serif,
              }}>{p}</button>
            ))}
          </div>
          <button onClick={load} style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${C.border}`, background: 'transparent', color: C.accent, cursor: 'pointer', fontSize: 11 }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ margin: '16px 40px', background: '#f871711a', border: '1px solid #f8717144', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: C.red }}>
          RPC error: {error} — data may be stale.
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 40px', color: C.muted, fontSize: 13 }}>
          Loading on-chain data…
        </div>
      )}

      {!loading && (
        <div style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── KPI row — REAL numbers ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {[
              { label: 'Total Streams',      val: String(streams.length),                        sub: 'on devnet program',         col: C.accent },
              { label: 'Active Streams',     val: String(activeStreams.length),                   sub: 'currently unlocking',       col: C.green  },
              { label: 'Total Locked',       val: totalLocked.toFixed(2),                         sub: 'TOKEN across all streams',  col: C.gold   },
              { label: 'Total Withdrawn',    val: totalWithdrawn.toFixed(2),                      sub: 'claimed by beneficiaries',  col: C.blue   },
              { label: 'Currently Claimable',val: totalClaimable.toFixed(2),                      sub: 'TOKEN available now',       col: C.green  },
            ].map(s => (
              <Card key={s.label} style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontFamily: C.mono, fontSize: s.val.length > 10 ? 16 : 22, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{s.sub}</div>
              </Card>
            ))}
          </div>

          {/* ── Stream types + secondary stats ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <Card>
              <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Stream Types</div>
              {streams.length === 0 ? (
                <div style={{ fontSize: 12, color: C.muted, padding: '20px 0', textAlign: 'center' }}>No streams on devnet yet</div>
              ) : (
                typeBreakdown.map(s => (
                  <div key={s.type} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.col }} />
                        <span style={{ fontSize: 12, color: '#fff' }}>{s.type}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: C.mono, fontSize: 12, color: s.col, fontWeight: 700 }}>{s.pct}%</span>
                        <span style={{ fontSize: 10, color: C.muted, marginLeft: 5 }}>({s.n})</span>
                      </div>
                    </div>
                    <div style={{ height: 7, borderRadius: 99, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.pct}%`, borderRadius: 99, background: `linear-gradient(90deg,${s.col}77,${s.col})` }} />
                    </div>
                  </div>
                ))
              )}
            </Card>

            <Card>
              <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Status Breakdown</div>
              {[
                { label: 'Active',     col: C.green,  n: activeStreams.length },
                { label: 'Pending',    col: C.gold,   n: streams.filter(s => streamStatus(s, nowSec) === 'pending').length },
                { label: 'Completed',  col: C.muted,  n: streams.filter(s => streamStatus(s, nowSec) === 'completed').length },
                { label: 'Cancelled',  col: C.red,    n: cancelledCount },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.col, boxShadow: `0 0 4px ${s.col}` }} />
                    <span style={{ fontSize: 12, color: '#fff' }}>{s.label}</span>
                  </div>
                  <span style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, color: s.col }}>{s.n}</span>
                </div>
              ))}
            </Card>
          </div>

          {/* ── Top streams table ── */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {streams.length === 0 ? 'No streams yet' : `Top ${topStreams.length} streams by locked amount`}
            </div>
            {streams.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
                No streams found on devnet. <Link href="/streams/new" style={{ color: C.accent }}>Create the first one →</Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,.03)' }}>
                    {['Stream PDA', 'Type', 'Authority', 'Total Locked', 'Withdrawn', 'Claimable', 'Status'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 9.5, color: C.muted, letterSpacing: '.06em', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topStreams.map((s, i) => {
                    const type    = streamType(s);
                    const status  = streamStatus(s, nowSec);
                    const typeCol = ({ linear: C.accent, milestone: C.blue, cliff: C.gold, hybrid: '#c084fc' } as Record<string, string>)[type] ?? C.accent;
                    const statCol = ({ active: C.green, pending: C.gold, completed: C.muted, cancelled: C.red } as Record<string, string>)[status] ?? C.muted;
                    const claimable = Number(computeUnlocked(s, nowSec)) / 1e6;

                    return (
                      <tr key={s.pubkey.toBase58()} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                        <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 10, color: C.muted }}>{s.pubkey.toBase58().slice(0, 8)}…</td>
                        <td style={{ padding: '9px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 700, background: `${typeCol}18`, border: `1px solid ${typeCol}44`, color: typeCol, fontFamily: C.mono }}>
                            {type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 10, color: C.muted }}>
                          {s.authority.toBase58().slice(0, 6)}…{s.authority.toBase58().slice(-4)}
                        </td>
                        <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 11, color: '#fff' }}>
                          {(Number(s.amountTotal.toString()) / 1e6).toFixed(2)}
                        </td>
                        <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 11, color: C.accent }}>
                          {(Number(s.amountWithdrawn.toString()) / 1e6).toFixed(2)}
                        </td>
                        <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 11, color: claimable > 0 ? C.green : C.muted }}>
                          {claimable.toFixed(2)}
                        </td>
                        <td style={{ padding: '9px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statCol, boxShadow: `0 0 5px ${statCol}` }} />
                            <span style={{ fontSize: 10.5, color: statCol, fontWeight: 600, textTransform: 'uppercase' }}>{status}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>

          {/* ── No data CTA ── */}
          {streams.length === 0 && (
            <Card style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
                No streams on devnet yet. Be the first to create one, or explore simulated data.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Link href="/streams/new" style={{ padding: '9px 20px', borderRadius: 10, background: `linear-gradient(135deg,${C.accent},#5e35d4)`, color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
                  Create Stream
                </Link>
                <Link href="/demo#analytics" style={{ padding: '9px 20px', borderRadius: 10, background: 'rgba(255,255,255,.06)', color: C.muted, fontWeight: 600, fontSize: 12, textDecoration: 'none', border: `1px solid ${C.border}` }}>
                  View Demo
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
