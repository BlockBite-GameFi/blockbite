'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useConnection } from '@solana/wallet-adapter-react';
import { VESTING_PROGRAM_ID } from '@/lib/anchor/vesting-client';
import { ConfirmedSignatureInfo } from '@solana/web3.js';

const C = {
  accent: '#a78bfa', gold: '#f5c66a', green: '#5fd07a', blue: '#7ad7ff',
  red: '#f87171', muted: 'rgba(148,163,184,0.7)', border: 'rgba(167,139,250,0.15)',
  bg0: '#0b0918', bg1: '#0f0d1e',
  mono: '"JetBrains Mono",monospace', serif: '"Space Grotesk",system-ui,sans-serif',
};

// Map Anchor instruction discriminator prefix (8 bytes) to human name.
// These are the sha256("global:<ix_name>") discriminators from the IDL.
// We detect them by matching the base64-encoded first 8 bytes of each
// instruction's data field in the parsed transaction logs.
const IX_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  create_stream:       { label: 'create_stream',       color: C.accent, icon: '＋' },
  withdraw:            { label: 'withdraw',             color: C.green,  icon: '↓'  },
  cancel:              { label: 'cancel',               color: C.red,    icon: '✗'  },
  configure_milestones:{ label: 'configure_milestones', color: C.blue,   icon: '◉'  },
  verify_milestone:    { label: 'verify_milestone',     color: C.gold,   icon: '✓'  },
  fund_vault:          { label: 'fund_vault',           color: '#c084fc', icon: '↑'  },
  update_proof:        { label: 'update_proof',         color: C.blue,   icon: '◈'  },
};

function formatTs(blockTime: number | null | undefined): string {
  if (!blockTime) return '—';
  return new Date(blockTime * 1000).toISOString().replace('T', ' ').slice(0, 19);
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 20px', ...style }}>{children}</div>;
}

interface TxRow {
  sig:       string;
  blockTime: number | null;
  err:       boolean;
  label:     string;
  color:     string;
  icon:      string;
}

export default function AuditPage() {
  const { connection } = useConnection();
  const [txRows,   setTxRows]   = useState<TxRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [filter,   setFilter]   = useState<'all' | string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch most recent 50 confirmed transactions for the program
      const sigs: ConfirmedSignatureInfo[] = await connection.getSignaturesForAddress(
        VESTING_PROGRAM_ID,
        { limit: 50 },
        'confirmed',
      );

      // We can't cheaply decode the exact instruction name without fetching
      // full tx data, so we use the memo / log approach: fetch in batches.
      // For the first 20 sigs, fetch parsed tx to extract instruction logs.
      const first20 = sigs.slice(0, 20);
      const parsedBatch = await Promise.allSettled(
        first20.map(s => connection.getParsedTransaction(s.signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 })),
      );

      const rows: TxRow[] = sigs.map((s, i) => {
        let label = 'program_ix';
        let color = C.muted;
        let icon  = '◦';

        // Try to identify from logs
        if (i < parsedBatch.length) {
          const res = parsedBatch[i];
          if (res.status === 'fulfilled' && res.value) {
            const logs = res.value.meta?.logMessages ?? [];
            // Anchor logs: "Program log: Instruction: CreateStream"
            for (const log of logs) {
              if (log.includes('Instruction:')) {
                const match = log.match(/Instruction:\s*(\w+)/);
                if (match) {
                  // Convert CamelCase → snake_case for lookup
                  const snake = match[1].replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLowerCase();
                  const known = IX_LABELS[snake];
                  if (known) { label = known.label; color = known.color; icon = known.icon; }
                  else        { label = snake; color = C.muted; icon = '◦'; }
                  break;
                }
              }
            }
          }
        } else if (i >= 20) {
          // For sigs beyond first 20, show generically
          label = 'program_ix';
        }

        return { sig: s.signature, blockTime: s.blockTime ?? null, err: s.err != null, label, color, icon };
      });

      setTxRows(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'RPC error');
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? txRows : txRows.filter(r => r.label === filter);
  const actionTypes = [...new Set(txRows.map(r => r.label))];

  return (
    <div style={{ minHeight: '100vh', background: C.bg0, padding: '0 0 60px' }}>

      {/* ── Header ── */}
      <div style={{ padding: '32px 40px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Link href="/streams" style={{ color: C.muted, fontSize: 12, textDecoration: 'none' }}>← Streams</Link>
            <span style={{ color: C.muted, fontSize: 12 }}>·</span>
            <Link href="/demo#audit" style={{ color: C.accent, fontSize: 12, textDecoration: 'none' }}>View demo ↗</Link>
          </div>
          <h1 style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
            Audit Trail
          </h1>
          <p style={{ fontSize: 12.5, color: C.muted, margin: '4px 0 0' }}>
            Real on-chain transactions · Program {VESTING_PROGRAM_ID.toBase58().slice(0, 8)}…{VESTING_PROGRAM_ID.toBase58().slice(-4)} · Solana devnet
          </p>
        </div>
        <button onClick={load} style={{ padding: '8px 16px', borderRadius: 9, border: `1px solid ${C.border}`, background: 'transparent', color: C.accent, cursor: 'pointer', fontSize: 11, alignSelf: 'flex-start' }}>
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={{ margin: '16px 40px', background: '#f871711a', border: '1px solid #f8717144', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: C.red }}>
          RPC error: {error}
        </div>
      )}

      <div style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Summary KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'Transactions Fetched', val: String(txRows.length),                                    col: C.accent },
            { label: 'Successful',           val: String(txRows.filter(r => !r.err).length),                col: C.green  },
            { label: 'Failed / Reverted',    val: String(txRows.filter(r => r.err).length),                 col: C.red    },
            { label: 'Unique Instruction',   val: String(actionTypes.length),                               col: C.blue   },
          ].map(s => (
            <Card key={s.label} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 700, color: s.col, lineHeight: 1 }}>{loading ? '…' : s.val}</div>
            </Card>
          ))}
        </div>

        {/* ── Filter tabs ── */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('all')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: filter === 'all' ? C.accent : 'rgba(255,255,255,.06)', color: filter === 'all' ? '#fff' : C.muted }}>All</button>
          {actionTypes.map(t => {
            const meta = IX_LABELS[t];
            return (
              <button key={t} onClick={() => setFilter(t)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: filter === t ? (meta?.color ?? C.accent) : 'rgba(255,255,255,.06)', color: filter === t ? '#fff' : C.muted }}>
                {meta?.icon ?? '◦'} {t}
              </button>
            );
          })}
        </div>

        {/* ── Transaction log ── */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {loading ? 'Loading…' : `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`}
            </span>
            <span style={{ fontSize: 10, color: C.muted }}>Most recent first</span>
          </div>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 140px 160px 100px', padding: '8px 20px', background: 'rgba(255,255,255,.03)', borderBottom: `1px solid ${C.border}` }}>
            {['', 'SIGNATURE', 'INSTRUCTION', 'TIMESTAMP (UTC)', 'STATUS'].map(h => (
              <div key={h} style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, letterSpacing: '.06em' }}>{h}</div>
            ))}
          </div>

          {loading && <div style={{ padding: '40px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Fetching from Solana devnet…</div>}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
              {txRows.length === 0
                ? <>No transactions found for this program yet. <Link href="/streams/new" style={{ color: C.accent }}>Create a stream</Link> to populate this log.</>
                : 'No transactions match this filter.'
              }
            </div>
          )}

          {filtered.map((row, i) => (
            <div key={row.sig} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 140px 160px 100px',
              padding: '11px 20px', borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
              background: row.err ? '#f871710a' : (i % 2 ? 'rgba(255,255,255,.01)' : 'transparent'),
              alignItems: 'center',
            }}>
              {/* Icon */}
              <div style={{ fontSize: 14, color: row.color, textAlign: 'center' }}>{row.icon}</div>
              {/* Signature */}
              <div>
                <a
                  href={`https://explorer.solana.com/tx/${row.sig}?cluster=devnet`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: C.mono, fontSize: 10, color: C.accent, textDecoration: 'none' }}
                >
                  {row.sig.slice(0, 16)}…{row.sig.slice(-8)}
                </a>
              </div>
              {/* Instruction */}
              <div>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 700, background: `${row.color}18`, border: `1px solid ${row.color}44`, color: row.color, fontFamily: C.mono }}>
                  {row.label}
                </span>
              </div>
              {/* Timestamp */}
              <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>{formatTs(row.blockTime)}</div>
              {/* Status */}
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: row.err ? C.red : C.green }}>
                  {row.err ? '✗ FAILED' : '✓ OK'}
                </span>
              </div>
            </div>
          ))}
        </Card>

        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>
          Showing last 50 transactions · Full history on{' '}
          <a href={`https://explorer.solana.com/address/${VESTING_PROGRAM_ID.toBase58()}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
            Solana Explorer ↗
          </a>
          {' '}·{' '}
          <Link href="/demo#audit" style={{ color: C.muted }}>View demo log</Link>
        </div>
      </div>
    </div>
  );
}
