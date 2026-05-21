'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import {
  VESTING_PROGRAM_ID, deriveStreamPDA, deriveVaultPDA,
  fetchStream, cancelStream,
} from '@/lib/anchor/vesting-client';

// ── Brand tokens ────────────────────────────────────────────────────────────
const MAGENTA = '#b12c84';
const TEAL    = '#3d7c91';
const GOLD    = '#e1a438';
const PURPLE  = '#7c80e8';
const BG      = '#08080f';

// ── Types ────────────────────────────────────────────────────────────────────
interface StreamRow {
  pda: PublicKey;
  vault: PublicKey;
  authority: PublicKey;
  beneficiary: PublicKey;
  mint: PublicKey;
  amountTotal: BN;
  amountWithdrawn: BN;
  startTs: number;
  cliffTs: number;
  endTs: number;
  streamId: BN;
  cancelled: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtTokens(raw: BN, decimals = 6): string {
  return (Number(raw.toString()) / 10 ** decimals).toFixed(2);
}

function calcUnlockedFrac(row: StreamRow, nowSec: number): number {
  if (row.cancelled) return 0;
  if (nowSec < row.cliffTs) return 0;
  if (nowSec >= row.endTs) return 1;
  return (nowSec - row.startTs) / (row.endTs - row.startTs);
}

function timeRemaining(endTs: number, nowSec: number): string {
  const diff = endTs - nowSec;
  if (diff <= 0) return 'Fully vested';
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (d > 0) return `${d}d ${h}h remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

function shortPk(pk: PublicKey) {
  const s = pk.toBase58();
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

// ── StreamCard ────────────────────────────────────────────────────────────────
function StreamCard({ row, nowSec, walletKey, onCancel, cancelling }: {
  row: StreamRow;
  nowSec: number;
  walletKey: PublicKey | null;
  onCancel: (r: StreamRow) => void;
  cancelling: boolean;
}) {
  const frac     = calcUnlockedFrac(row, nowSec);
  const pct      = Math.round(frac * 100);
  const total    = Number(row.amountTotal.toString());
  const taken    = Number(row.amountWithdrawn.toString());
  const claimable = Math.max(0, Math.floor(total * frac) - taken);
  const isCreator = walletKey?.equals(row.authority);
  const isBenef   = walletKey?.equals(row.beneficiary);
  const beforeCliff = nowSec < row.cliffTs;

  const status = row.cancelled   ? 'CANCELLED'
    : nowSec >= row.endTs        ? 'FULLY VESTED'
    : beforeCliff                ? 'CLIFF PENDING'
    : 'STREAMING';

  const statusColor = row.cancelled ? '#555'
    : nowSec >= row.endTs           ? GOLD
    : beforeCliff                   ? PURPLE
    : TEAL;

  return (
    <div style={{
      background: '#0d0d1a', border: '1px solid #1e1e3a',
      borderRadius: 12, padding: '20px 24px', marginBottom: 14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666' }}>
            STREAM #{row.streamId.toString()}
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            color: statusColor, background: `${statusColor}22`,
            padding: '2px 8px', borderRadius: 4,
          }}>
            {status}
          </span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#333' }}>
          {shortPk(row.pda)}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#1a1a2e', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: row.cancelled ? '#333' : `linear-gradient(90deg, ${TEAL}, ${GOLD})`,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666' }}>{pct}% vested</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666' }}>{timeRemaining(row.endTs, nowSec)}</span>
      </div>

      {/* Token amounts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'TOTAL',     value: fmtTokens(row.amountTotal),     color: '#aaa' },
          { label: 'WITHDRAWN', value: fmtTokens(row.amountWithdrawn), color: '#888' },
          { label: 'CLAIMABLE', value: (claimable / 1e6).toFixed(2),    color: claimable > 0 ? GOLD : '#555' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#555', marginBottom: 2 }}>{label}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Addresses */}
      <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#444', marginBottom: 12 }}>
        FROM: {shortPk(row.authority)} -&gt; TO: {shortPk(row.beneficiary)}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {isBenef && !row.cancelled && (
          <Link
            href={`/claim/${row.pda.toBase58()}`}
            style={{
              flex: 1, padding: '10px 0', textAlign: 'center',
              background: claimable > 0 ? `linear-gradient(135deg, ${TEAL}, ${GOLD})` : 'rgba(255,255,255,0.05)',
              border: claimable > 0 ? 'none' : '1px solid #2a2a3e',
              borderRadius: 8,
              color: claimable > 0 ? '#000' : '#555',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13,
              textDecoration: 'none', display: 'block',
            }}
          >
            {claimable > 0 ? `CLAIM ${(claimable / 1e6).toFixed(2)}` : beforeCliff ? 'CLIFF PENDING' : 'NOTHING TO CLAIM'}
          </Link>
        )}
        {isCreator && !row.cancelled && nowSec < row.endTs && (
          <button
            onClick={() => onCancel(row)}
            disabled={cancelling}
            style={{
              padding: '10px 16px', background: 'transparent',
              border: '1px solid #3a1a1a', borderRadius: 8,
              color: '#833', fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600, fontSize: 12, cursor: cancelling ? 'wait' : 'pointer',
              opacity: cancelling ? 0.5 : 1,
            }}
          >
            {cancelling ? '...' : 'CANCEL'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { sendTransaction } = useWallet();

  const [streams,    setStreams]    = useState<StreamRow[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState<string | null>(null);
  const [nowSec,     setNowSec]     = useState(Math.floor(Date.now() / 1000));
  const [tab,        setTab]        = useState<'mine' | 'all'>('mine');

  useEffect(() => {
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 30_000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const idxKey = `bb_streams_${publicKey.toBase58()}`;
      const stored = JSON.parse(localStorage.getItem(idxKey) ?? '[]') as string[];
      const found: StreamRow[] = [];
      for (const idStr of stored) {
        const streamIdBn = new BN(idStr);
        const [pda]   = deriveStreamPDA(publicKey, streamIdBn);
        const data    = await fetchStream(connection, pda);
        if (!data) continue;
        const [vault] = deriveVaultPDA(publicKey, streamIdBn);
        found.push({
          pda, vault,
          authority:       data.authority,
          beneficiary:     data.beneficiary,
          mint:            data.mint,
          amountTotal:     data.amountTotal,
          amountWithdrawn: data.amountWithdrawn,
          startTs:  data.startTs.toNumber(),
          cliffTs:  data.cliffTs.toNumber(),
          endTs:    data.endTs.toNumber(),
          streamId: data.streamId,
          cancelled: data.cancelled,
        });
      }
      setStreams(found.sort((a, b) => b.startTs - a.startTs));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCancel = useCallback(async (row: StreamRow) => {
    if (!publicKey) return;
    if (!confirm(`Cancel stream #${row.streamId.toString()}? Unvested tokens return to you; vested-but-unclaimed go to recipient.`)) return;
    setCancelBusy(row.pda.toBase58());
    setError(null);
    try {
      const authorityAta   = await getAssociatedTokenAddress(row.mint, publicKey);
      const beneficiaryAta = await getAssociatedTokenAddress(row.mint, row.beneficiary);
      await cancelStream({
        connection,
        authority:      publicKey,
        beneficiary:    row.beneficiary,
        stream:         row.pda,
        vault:          row.vault,
        authorityAta,
        beneficiaryAta,
        sendTransaction,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCancelBusy(null);
    }
  }, [publicKey, sendTransaction, connection, refresh]);

  const filtered = tab === 'mine'
    ? streams.filter(s => publicKey && (s.authority.equals(publicKey) || s.beneficiary.equals(publicKey)))
    : streams;

  const totalLocked   = streams.reduce((a, s) => a + Number(s.amountTotal.toString()), 0);
  const totalWithdrawn = streams.reduce((a, s) => a + Number(s.amountWithdrawn.toString()), 0);
  const activeCount   = streams.filter(s => !s.cancelled).length;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff' }}>

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', borderBottom: '1px solid #1a1a2e',
        position: 'sticky', top: 0, background: BG, zIndex: 50,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src="/logo.png" alt="BLOCKBITE" width={32} height={32} />
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#fff', fontSize: 18 }}>
            BLOCKBITE
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="/distribute" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, color: PURPLE, fontWeight: 700, textDecoration: 'none' }}>DISTRIBUTE</Link>
          <Link href="/game"        style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, color: '#888', textDecoration: 'none' }}>PLAY</Link>
          <Link href="/leaderboard" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, color: '#888', textDecoration: 'none' }}>LEADERBOARD</Link>
          {connected ? (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: TEAL }}>
              {publicKey ? shortPk(publicKey) : ''}
            </span>
          ) : (
            <button
              onClick={() => setVisible(true)}
              style={{
                padding: '8px 20px', background: `linear-gradient(135deg, ${MAGENTA}, ${PURPLE})`,
                border: 'none', borderRadius: 8, color: '#fff',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '48px 32px 24px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: TEAL, letterSpacing: 2, marginBottom: 8 }}>
          TOKEN DISTRIBUTION PROTOCOL
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 36, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.1 }}>
          TDP Dashboard
        </h1>
        <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#888', fontSize: 14, margin: 0 }}>
          Manage on-chain vesting streams. Cliff + Milestone + Linear unlock on Solana devnet.
        </p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#333', marginTop: 6 }}>
          Program: {VESTING_PROGRAM_ID.toBase58()}
        </p>
      </div>

      {/* Stats */}
      <div style={{ padding: '0 32px 28px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'ACTIVE STREAMS', value: activeCount.toString() },
            { label: 'TOTAL LOCKED',   value: (totalLocked / 1e6).toFixed(2) },
            { label: 'TOTAL CLAIMED',  value: (totalWithdrawn / 1e6).toFixed(2) },
            { label: 'NETWORK',        value: 'Devnet' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 10, padding: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#555', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: GOLD }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 32px 48px', maxWidth: 960, margin: '0 auto' }}>
        {!connected ? (
          <div style={{
            textAlign: 'center', padding: '72px 32px',
            background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16,
          }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
              Connect your wallet
            </h2>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#666', fontSize: 14, marginBottom: 24 }}>
              Connect Phantom or Solflare to view and manage your TDP streams.
            </p>
            <button
              onClick={() => setVisible(true)}
              style={{
                padding: '12px 32px', background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`,
                border: 'none', borderRadius: 10, color: '#000',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}
            >
              Connect Wallet
            </button>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#333', marginTop: 14 }}>
              Phantom / Solflare / Coinbase / Trust
            </p>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
              {(['mine', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '8px 20px',
                    background: tab === t ? `linear-gradient(135deg, ${MAGENTA}, ${PURPLE})` : 'transparent',
                    border: tab === t ? 'none' : '1px solid #2a2a3e',
                    borderRadius: 8, color: tab === t ? '#fff' : '#666',
                    fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {t === 'mine' ? 'MY STREAMS' : 'ALL STREAMS'}
                </button>
              ))}
              <button
                onClick={refresh}
                style={{
                  padding: '8px 14px', background: 'transparent',
                  border: '1px solid #2a2a3e', borderRadius: 8,
                  color: '#555', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, cursor: 'pointer',
                }}
              >
                {loading ? '...' : 'REFRESH'}
              </button>
              <div style={{ flex: 1 }} />
              <Link href="/distribute/new" style={{
                padding: '8px 20px', background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`,
                border: 'none', borderRadius: 8, color: '#000',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13, textDecoration: 'none',
              }}>
                + NEW STREAM
              </Link>
            </div>

            {error && (
              <div style={{
                padding: 14, borderRadius: 10, marginBottom: 16,
                background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.4)',
                color: '#f472b6', fontSize: 12, fontFamily: 'monospace',
              }}>{error}</div>
            )}

            {loading && (
              <div style={{ padding: 40, textAlign: 'center', color: '#444', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                Loading streams from devnet...
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '56px 32px',
                background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16, color: '#444',
              }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, marginBottom: 8 }}>No streams found</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, marginBottom: 24 }}>
                  Create a stream from /distribute/new — it will appear here
                </div>
                <Link href="/distribute/new" style={{
                  padding: '10px 22px', background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`,
                  borderRadius: 8, color: '#000', fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 700, fontSize: 13, textDecoration: 'none',
                }}>
                  CREATE FIRST STREAM
                </Link>
              </div>
            )}

            {!loading && filtered.map((row) => (
              <StreamCard
                key={row.pda.toBase58()}
                row={row}
                nowSec={nowSec}
                walletKey={publicKey}
                onCancel={handleCancel}
                cancelling={cancelBusy === row.pda.toBase58()}
              />
            ))}
          </>
        )}
      </div>

      {/* How it works */}
      <div style={{ padding: '0 32px 60px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: 24 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: TEAL, marginBottom: 12 }}>
            HOW IT WORKS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { n: '01', t: 'Cliff Gate',        d: 'Zero tokens unlock before cliff_ts. Hard time floor.' },
              { n: '02', t: 'Milestone Gate',     d: 'required_tier > 0 gates on oracle proof (game, DAO vote, admin).' },
              { n: '03', t: 'Linear Streaming',   d: 'After cliff + milestone: tokens flow per-second, rate = amount / duration.' },
            ].map(({ n, t, d }) => (
              <div key={n}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, color: '#2a2a3e', marginBottom: 4 }}>{n}</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, color: GOLD, marginBottom: 6 }}>{t}</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, color: '#666', lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
