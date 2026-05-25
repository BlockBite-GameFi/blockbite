'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  getStreamsByAuthority,
  getStreamsByBeneficiary,
  computeUnlocked,
  StreamInfo,
} from '@/lib/anchor/vesting-client';
import { BN } from '@coral-xyz/anchor';

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
  accent: '#a78bff', gold: '#f5c66a', green: '#5fd07a',
  blue: '#7ad7ff', red: '#ff3b6b', muted: 'rgba(232,225,248,.38)',
  border: 'rgba(167,139,255,.13)', bg0: '#05040d', bg1: '#09071a',
  mono: "'JetBrains Mono',monospace", serif: "'Space Grotesk',system-ui,sans-serif",
};

const TYPE_COLORS: Record<string, string> = {
  linear: C.accent, milestone: C.blue, cliff: C.gold, hybrid: '#c084fc',
};

function streamType(s: StreamInfo): string {
  if (s.milestoneCount > 0 && Number(s.cliffTs.toString()) > Number(s.startTs.toString())) return 'hybrid';
  if (s.milestoneCount > 0) return 'milestone';
  if (Number(s.cliffTs.toString()) > Number(s.startTs.toString())) return 'cliff';
  return 'linear';
}

function streamStatus(s: StreamInfo, nowSec: number): string {
  if (s.cancelled) return 'cancelled';
  if (nowSec < Number(s.cliffTs.toString())) return 'pending';
  if (nowSec >= Number(s.endTs.toString())) return 'completed';
  return 'active';
}

function shortKey(pk: { toBase58(): string } | null): string {
  if (!pk) return '—';
  const s = pk.toBase58();
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function fmtTokens(bn: BN): string {
  const n = Number(bn.toString()) / 1e6;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(2);
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 99, fontSize: 10.5, fontWeight: 700,
      letterSpacing: '.04em', background: `${color}1a`, color, border: `1px solid ${color}44`,
    }}>{label}</span>
  );
}

function StatusDot({ status }: { status: string }) {
  const col = ({ active: C.green, pending: C.gold, completed: C.muted, cancelled: C.red } as Record<string, string>)[status] ?? C.muted;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}` }} />
      <span style={{ fontSize: 10.5, color: col, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{status}</span>
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 64, height: 5, borderRadius: 99, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 10.5, color: '#fff', fontFamily: C.mono }}>{Math.round(pct)}%</span>
    </div>
  );
}

export default function StreamsPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [streams,  setStreams]  = useState<StreamInfo[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [filter,   setFilter]   = useState<'all' | 'active' | 'pending' | 'completed' | 'cancelled'>('all');
  const [nowSec,   setNowSec]   = useState(Math.floor(Date.now() / 1000));

  // Keep clock updated
  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 5000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const [asCreator, asRecipient] = await Promise.all([
        getStreamsByAuthority(connection, publicKey),
        getStreamsByBeneficiary(connection, publicKey),
      ]);
      // Deduplicate (could appear in both if creator = beneficiary)
      const seen = new Set<string>();
      const all: StreamInfo[] = [];
      for (const s of [...asCreator, ...asRecipient]) {
        const key = s.pubkey.toBase58();
        if (!seen.has(key)) { seen.add(key); all.push(s); }
      }
      // Sort by endTs descending (newest end date first)
      all.sort((a, b) => Number(b.endTs.toString()) - Number(a.endTs.toString()));
      setStreams(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => { load(); }, [load]);

  const filtered = streams.filter(s => {
    if (filter === 'all') return true;
    return streamStatus(s, nowSec) === filter;
  });

  // Real aggregate metrics
  const totalLocked = streams.reduce((acc, s) => acc + Number(s.amountTotal.toString()), 0) / 1e6;
  const totalWithdrawn = streams.reduce((acc, s) => acc + Number(s.amountWithdrawn.toString()), 0) / 1e6;
  const activeCount = streams.filter(s => streamStatus(s, nowSec) === 'active').length;

  return (
    <main style={{ minHeight: '100vh', background: C.bg0, color: '#e8e1f8' }}>
      <Navbar />

      {/* ── Header ── */}
      <div style={{ padding: '80px 24px 32px', background: 'linear-gradient(180deg,#0d0820 0%,#05040d 100%)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: C.accent, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>TDP Protocol · Devnet</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: C.serif, fontSize: 'clamp(26px,5vw,44px)', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8, color: '#fff' }}>
                Token Streams
              </h1>
              <p style={{ fontSize: 13, color: C.muted, maxWidth: 520 }}>
                Cliff · linear · milestone · hybrid vesting streams. Each stream is a PDA vault on Solana devnet.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/demo" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                background: 'rgba(167,139,255,.08)', color: C.accent,
                border: `1px solid ${C.border}`, borderRadius: 10,
                fontWeight: 600, fontSize: 12, textDecoration: 'none',
              }}>
                ◈ View Demo
              </Link>
              <Link href="/streams/new" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px',
                background: `linear-gradient(135deg,${C.accent},#5e35d4)`, color: '#fff', borderRadius: 12,
                fontWeight: 700, fontSize: 13, textDecoration: 'none', boxShadow: `0 0 20px ${C.accent}44`,
              }}>
                + Create Stream
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 100px' }}>

        {/* ── KPI row — REAL numbers ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Your Streams',       value: String(streams.length),               sub: 'as creator or recipient', color: C.accent },
            { label: 'Active',             value: String(activeCount),                  sub: 'currently streaming',     color: C.green  },
            { label: 'Total Locked',       value: totalLocked.toFixed(2) + ' TOKEN',    sub: 'across your streams',     color: C.gold   },
            { label: 'Total Withdrawn',    value: totalWithdrawn.toFixed(2) + ' TOKEN', sub: 'all-time claimed',        color: C.blue   },
          ].map(s => (
            <div key={s.label} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: C.mono, fontSize: s.value.length > 10 ? 16 : 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Wallet gate ── */}
        {!connected && (
          <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '48px 24px', textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Connect wallet to see your streams</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              Your streams will appear here — streams you created and streams you&apos;re a beneficiary of.
            </div>
            <button
              onClick={() => setVisible(true)}
              style={{
                padding: '11px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg,${C.accent},#5e35d4)`, color: '#fff',
                fontWeight: 700, fontSize: 13,
              }}
            >
              Connect Wallet
            </button>
            <div style={{ marginTop: 14 }}>
              <Link href="/demo" style={{ fontSize: 12, color: C.accent, textDecoration: 'none' }}>
                Or explore the demo →
              </Link>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ background: '#ff3b6b1a', border: '1px solid #ff3b6b44', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#ff3b6b' }}>
            ✗ {error} — <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accent, fontSize: 13 }}>Retry</button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted, fontSize: 13 }}>
            Loading streams from Solana devnet…
          </div>
        )}

        {/* ── Streams table ── */}
        {connected && !loading && (
          <>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
              {(['all', 'active', 'pending', 'completed', 'cancelled'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  letterSpacing: '.04em', textTransform: 'uppercase',
                  background: filter === f ? C.accent : 'rgba(255,255,255,.06)',
                  color: filter === f ? '#fff' : C.muted,
                }}>{f}</button>
              ))}
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: C.muted, alignSelf: 'center' }}>
                {filtered.length} stream{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1fr 130px 130px 110px 100px', padding: '10px 20px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,.03)' }}>
                {['STREAM PDA', 'TYPE', 'COUNTERPART', 'TOTAL', 'CLAIMABLE NOW', 'PROGRESS', 'STATUS'].map(h => (
                  <div key={h} style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, letterSpacing: '.06em' }}>{h}</div>
                ))}
              </div>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: C.muted, fontSize: 14 }}>
                  {streams.length === 0
                    ? <>No streams found. <Link href="/streams/new" style={{ color: C.accent }}>Create your first stream →</Link></>
                    : 'No streams match this filter.'
                  }
                </div>
              )}

              {/* Rows */}
              {filtered.map((s, i) => {
                const type    = streamType(s);
                const status  = streamStatus(s, nowSec);
                const typeCol = TYPE_COLORS[type] ?? C.accent;
                const total   = Number(s.amountTotal.toString());
                const withdrawn = Number(s.amountWithdrawn.toString());
                const claimable = Number(computeUnlocked(s, nowSec));
                const pct     = total > 0 ? (withdrawn / total) * 100 : 0;
                const isCreator = publicKey && s.authority.toBase58() === publicKey.toBase58();
                const counterpart = isCreator ? s.beneficiary : s.authority;

                return (
                  <div key={s.pubkey.toBase58()} style={{
                    display: 'grid', gridTemplateColumns: '2fr 100px 1fr 130px 130px 110px 100px',
                    padding: '13px 20px', borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
                    background: i % 2 ? 'rgba(255,255,255,.01)' : 'transparent', alignItems: 'center',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${C.accent}06`)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 ? 'rgba(255,255,255,.01)' : 'transparent')}
                  >
                    {/* PDA + role */}
                    <div>
                      <div style={{ fontFamily: C.mono, fontSize: 10.5, color: '#fff', marginBottom: 2 }}>
                        {shortKey(s.pubkey)}
                      </div>
                      <div style={{ fontSize: 10, color: isCreator ? C.accent : C.green }}>
                        {isCreator ? 'You created' : 'You receive'}
                        {s.milestoneCount > 0 && <span style={{ color: C.blue }}> · {s.milestoneCount} milestone{s.milestoneCount !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                    {/* Type */}
                    <div><Badge label={type.toUpperCase()} color={typeCol} /></div>
                    {/* Counterpart */}
                    <div style={{ fontFamily: C.mono, fontSize: 10.5, color: C.muted }}>{shortKey(counterpart)}</div>
                    {/* Total */}
                    <div style={{ fontFamily: C.mono, fontSize: 12, color: '#fff' }}>
                      {fmtTokens(s.amountTotal)} <span style={{ color: C.accent, fontSize: 10 }}>TOKEN</span>
                    </div>
                    {/* Claimable */}
                    <div style={{ fontFamily: C.mono, fontSize: 12, color: claimable > 0 ? C.green : C.muted }}>
                      {(claimable / 1e6).toFixed(2)}
                    </div>
                    {/* Progress */}
                    <MiniBar pct={pct} color={typeCol} />
                    {/* Status */}
                    <StatusDot status={status} />
                  </div>
                );
              })}

              {/* Footer */}
              <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, background: 'rgba(255,255,255,.02)', fontSize: 11, color: C.muted }}>
                Live on-chain data · Solana devnet · Program:{' '}
                <span style={{ fontFamily: C.mono, color: C.accent }}>DvhxiL5P…XTFf</span>
                {streams.length > 0 && (
                  <button onClick={load} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: C.accent, fontSize: 11 }}>
                    ↻ Refresh
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Quick Actions ── */}
        <div style={{ marginTop: 24, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              { label: 'Create New Stream',  href: '/streams/new',  col: C.accent, desc: 'Lock tokens into a PDA vault' },
              { label: 'Claim Tokens',       href: '/claim',        col: C.green,  desc: 'Withdraw vested tokens' },
              { label: 'Verify Milestone',   href: '/milestones',   col: C.blue,   desc: 'Unlock milestone allocation' },
              { label: 'Vesting Calculator', href: '/calculator',   col: C.gold,   desc: 'Model distribution schedule' },
              { label: 'View Demo',          href: '/demo',         col: C.muted,  desc: 'Simulated data walkthrough' },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 10, textDecoration: 'none', flex: '1 1 180px',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = a.col + '44'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.06)'; }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.col, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>{a.label}</div>
                  <div style={{ fontSize: 10.5, color: C.muted }}>{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
