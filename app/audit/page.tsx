'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
  accent: '#a78bfa',
  gold:   '#f5c66a',
  green:  '#5fd07a',
  blue:   '#7ad7ff',
  ember:  '#ff7a3a',
  red:    '#f87171',
  muted:  'rgba(148,163,184,0.7)',
  border: 'rgba(167,139,250,0.15)',
  bg0:    '#0b0918',
  bg1:    '#0f0d1e',
  bg2:    '#140f2a',
  mono:   '"JetBrains Mono",monospace',
  serif:  '"Space Grotesk",system-ui,sans-serif',
};

// ─── Mock audit log ───────────────────────────────────────────────────────────
type ActionType = 'create_stream' | 'withdraw' | 'cancel_attempt' | 'milestone_verified' | 'cliff_expired';

interface AuditEvent {
  ts:     string;
  action: ActionType;
  stream: string;
  actor:  string;
  amount: number;
  tx:     string | null;
  status: 'success' | 'failed';
}

const AUDIT_LOG: AuditEvent[] = [
  { ts:'2025-05-21 14:32:11', action:'withdraw',          stream:'stm-001', actor:'4xK2…1mWd', amount:10_000, tx:'5xKj…3mRd', status:'success' },
  { ts:'2025-05-20 09:15:44', action:'milestone_verified',stream:'stm-002', actor:'Dn7f…XTFf', amount:0,      tx:'2cVq…7hKn', status:'success' },
  { ts:'2025-05-19 17:08:02', action:'withdraw',          stream:'stm-005', actor:'Dn7f…XTFf', amount:5_000,  tx:'8mNc…2sDf', status:'success' },
  { ts:'2025-05-18 11:22:59', action:'create_stream',     stream:'stm-006', actor:'Dn7f…XTFf', amount:100_000,tx:'9qP5…nBjc', status:'success' },
  { ts:'2025-05-17 15:44:03', action:'cancel_attempt',    stream:'stm-003', actor:'8mNc…2sDf', amount:0,      tx:null,        status:'failed'  },
  { ts:'2025-05-16 08:55:17', action:'cliff_expired',     stream:'stm-001', actor:'system',    amount:0,      tx:'Bn6h…3kQm', status:'success' },
  { ts:'2025-05-15 13:11:30', action:'withdraw',          stream:'stm-002', actor:'9qP5…nBjc', amount:30_000, tx:'7rPw…8vLx', status:'success' },
  { ts:'2025-05-14 10:00:00', action:'create_stream',     stream:'stm-005', actor:'2cVq…7hKn', amount:150_000,tx:'5mRs…2yZp', status:'success' },
  { ts:'2025-05-13 16:30:22', action:'milestone_verified',stream:'stm-005', actor:'2cVq…7hKn', amount:0,      tx:'6nHk…4pTv', status:'success' },
  { ts:'2025-05-12 12:45:08', action:'withdraw',          stream:'stm-004', actor:'7rPw…8vLx', amount:20_000, tx:'3qLm…9sWx', status:'success' },
  { ts:'2025-05-11 07:20:55', action:'create_stream',     stream:'stm-004', actor:'Dn7f…XTFf', amount:300_000,tx:'1cFr…6tUy', status:'success' },
  { ts:'2025-05-10 14:00:00', action:'create_stream',     stream:'stm-003', actor:'8mNc…2sDf', amount:1_000_000,tx:'4dGs…7uVz', status:'success' },
  { ts:'2025-05-09 09:30:41', action:'cancel_attempt',    stream:'stm-002', actor:'Dn7f…XTFf', amount:0,      tx:null,        status:'failed'  },
  { ts:'2025-05-08 18:15:33', action:'create_stream',     stream:'stm-002', actor:'Dn7f…XTFf', amount:200_000,tx:'0xef2c…',   status:'success' },
  { ts:'2025-05-07 11:00:00', action:'create_stream',     stream:'stm-001', actor:'Dn7f…XTFf', amount:500_000,tx:'0xab3f…',   status:'success' },
];

const ACTION_COL: Record<ActionType, string> = {
  create_stream:      C.accent,
  withdraw:           C.green,
  cancel_attempt:     C.red,
  milestone_verified: C.blue,
  cliff_expired:      C.gold,
};
const ACTION_ICON: Record<ActionType, string> = {
  create_stream:      '＋',
  withdraw:           '↓',
  cancel_attempt:     '✗',
  milestone_verified: '✓',
  cliff_expired:      '⏱',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 20px', ...style }}>
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 6,
      fontSize: 9.5, fontWeight: 700, letterSpacing: '.05em',
      background: `${color}18`, border: `1px solid ${color}44`, color,
      fontFamily: C.mono,
    }}>
      {label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AuditTrailPage() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = AUDIT_LOG.filter(e => {
    if (filter !== 'all' && !e.action.startsWith(filter)) return false;
    if (search && !e.stream.includes(search) && !e.action.includes(search) && !e.actor.includes(search)) return false;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: C.bg0, padding: '0 0 60px' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '32px 40px 20px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Link href="/streams" style={{ color: C.muted, fontSize: 12, textDecoration: 'none' }}>← Streams</Link>
          </div>
          <h1 style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
            Audit Trail
          </h1>
          <p style={{ fontSize: 12.5, color: C.muted, margin: '4px 0 0' }}>
            Immutable on-chain event log · Full protocol history · Investor-grade transparency
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Summary KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { l:'Total Events',    v: AUDIT_LOG.length,                                              c: C.accent },
            { l:'Streams Created', v: AUDIT_LOG.filter(e => e.action === 'create_stream').length,    c: C.green  },
            { l:'Withdrawals',     v: AUDIT_LOG.filter(e => e.action === 'withdraw').length,         c: C.gold   },
            { l:'Failed Txns',     v: AUDIT_LOG.filter(e => e.status === 'failed').length,           c: C.red    },
          ].map(s => (
            <Card key={s.l} style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                {s.l}
              </div>
              <div style={{ fontFamily: C.mono, fontSize: 24, fontWeight: 700, color: s.c }}>
                {s.v}
              </div>
            </Card>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', gap: 2,
            background: C.bg1, border: `1px solid ${C.border}`,
            borderRadius: 9, padding: 3,
          }}>
            {(['all','create','withdraw','milestone','cancel'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: filter === f ? C.accent : 'transparent',
                  color: filter === f ? '#fff' : C.muted,
                  fontSize: 11, fontWeight: 600, transition: 'all .15s',
                  textTransform: 'capitalize', fontFamily: C.serif,
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stream ID, action, actor…"
            style={{
              flex: 1, maxWidth: 280,
              padding: '7px 12px',
              background: 'rgba(255,255,255,.05)',
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: '#fff', fontSize: 12,
              outline: 'none', fontFamily: C.mono,
            }}
            onFocus={e  => (e.target.style.borderColor = C.accent)}
            onBlur={e   => (e.target.style.borderColor = C.border)}
          />

          <button style={{
            padding: '7px 14px', borderRadius: 9, border: `1px solid ${C.border}`,
            background: 'rgba(255,255,255,.04)', color: C.muted,
            fontSize: 12, cursor: 'pointer', fontFamily: C.serif,
          }}>
            ↓ Export CSV
          </button>
          <button style={{
            padding: '7px 14px', borderRadius: 9, border: `1px solid ${C.border}`,
            background: 'rgba(255,255,255,.04)', color: C.muted,
            fontSize: 12, cursor: 'pointer', fontFamily: C.serif,
          }}>
            ⛓ View on Explorer
          </button>
        </div>

        {/* ── Log table ── */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.04)' }}>
                {['Timestamp','Action','Stream','Actor','Amount','Tx Hash','Status'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 9.5, color: C.muted, letterSpacing: '.06em', fontWeight: 700,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const col = ACTION_COL[e.action] ?? C.muted;
                return (
                  <tr key={i} style={{
                    borderTop: `1px solid ${C.border}`,
                    background: e.status === 'failed' ? `${C.red}06` : i % 2 ? 'rgba(255,255,255,.01)' : 'transparent',
                    transition: 'background .12s',
                  }}>
                    <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 10.5, color: C.muted }}>{e.ts}</td>
                    <td style={{ padding: '9px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 7,
                          background: `${col}15`, border: `1px solid ${col}44`,
                          display: 'grid', placeItems: 'center',
                          fontSize: 10, color: col, flexShrink: 0,
                        }}>
                          {ACTION_ICON[e.action] ?? '·'}
                        </div>
                        <span style={{ fontFamily: C.mono, fontSize: 11, color: col }}>{e.action}</span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 11, color: C.accent }}>
                      <Link href={`/streams/${e.stream}`} style={{ color: C.accent, textDecoration: 'none' }}>
                        {e.stream}
                      </Link>
                    </td>
                    <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 10.5, color: C.muted }}>{e.actor}</td>
                    <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 11, color: e.amount > 0 ? C.gold : C.muted }}>
                      {e.amount > 0 ? `${e.amount.toLocaleString()} BBT` : '—'}
                    </td>
                    <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 10.5, color: C.accent }}>
                      {e.tx ?? '—'}
                    </td>
                    <td style={{ padding: '9px 16px' }}>
                      <Badge
                        label={e.status.toUpperCase()}
                        color={e.status === 'success' ? C.green : C.red}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 13 }}>
              No events match your filter
            </div>
          )}
        </Card>

        {/* ── Integrity note ── */}
        <div style={{
          padding: '14px 18px',
          background: `${C.green}08`,
          border: `1px solid ${C.green}22`,
          borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 22 }}>🔐</div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.green, marginBottom: 2 }}>
              Immutable On-Chain Audit Trail
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(232,225,248,.6)' }}>
              Every event is permanently recorded on Solana. This log cannot be altered by anyone —
              including the stream creator. Exportable as verifiable proof for investors, auditors, and regulators.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
