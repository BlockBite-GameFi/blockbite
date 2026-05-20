'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ── Brand tokens ────────────────────────────────────────────────────────────
const MAGENTA = '#b12c84';
const TEAL    = '#3d7c91';
const GOLD    = '#e1a438';
const PURPLE  = '#7c80e8';
const BG      = '#08080f';

const PROGRAM_ID = 'DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf';

// ── Types ────────────────────────────────────────────────────────────────────
interface StreamCard {
  id: string;
  streamId: string;
  authority: string;
  beneficiary: string;
  amountTotal: number;
  amountWithdrawn: number;
  startTs: number;
  cliffTs: number;
  endTs: number;
  cancelled: boolean;
  requiredTier: number;
  pda: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTokens(raw: number, decimals = 6): string {
  return (raw / Math.pow(10, decimals)).toFixed(2);
}

function calcUnlocked(stream: StreamCard, nowSec: number): number {
  if (stream.cancelled) return 0;
  if (nowSec < stream.cliffTs) return 0;
  if (nowSec >= stream.endTs) return stream.amountTotal;
  const elapsed = nowSec - stream.startTs;
  const duration = stream.endTs - stream.startTs;
  return Math.floor((stream.amountTotal * elapsed) / duration);
}

function calcClaimable(stream: StreamCard, nowSec: number): number {
  const unlocked = calcUnlocked(stream, nowSec);
  return Math.max(0, unlocked - stream.amountWithdrawn);
}

function vestPercent(stream: StreamCard, nowSec: number): number {
  if (stream.amountTotal === 0) return 0;
  const unlocked = calcUnlocked(stream, nowSec);
  return Math.min(100, Math.floor((unlocked / stream.amountTotal) * 100));
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

function shortenAddr(addr: string): string {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

// ── StreamCard Component ─────────────────────────────────────────────────────
function StreamCardView({ stream, nowSec, onClaim, onCancel, walletAddr }: {
  stream: StreamCard;
  nowSec: number;
  onClaim: (stream: StreamCard) => void;
  onCancel: (stream: StreamCard) => void;
  walletAddr: string;
}) {
  const pct       = vestPercent(stream, nowSec);
  const claimable = calcClaimable(stream, nowSec);
  const isCreator = walletAddr === stream.authority;
  const isBenef   = walletAddr === stream.beneficiary;
  const beforeCliff = nowSec < stream.cliffTs;

  const statusLabel = stream.cancelled
    ? 'CANCELLED'
    : nowSec >= stream.endTs
    ? 'FULLY VESTED'
    : beforeCliff
    ? 'CLIFF PENDING'
    : 'STREAMING';

  const statusColor = stream.cancelled
    ? '#555'
    : nowSec >= stream.endTs
    ? GOLD
    : beforeCliff
    ? PURPLE
    : TEAL;

  return (
    <div style={{
      background: '#0d0d1a',
      border: `1px solid #1e1e3a`,
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 16,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: '#666',
          }}>
            STREAM #{stream.streamId}
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: statusColor,
            background: `${statusColor}22`,
            padding: '2px 8px',
            borderRadius: 4,
          }}>
            {statusLabel}
          </span>
          {stream.requiredTier > 0 && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: MAGENTA,
              background: `${MAGENTA}22`,
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              MILESTONE T{stream.requiredTier}
            </span>
          )}
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#444' }}>
          {shortenAddr(stream.pda)}
        </span>
      </div>

      {/* Vesting bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          background: '#1a1a2e',
          borderRadius: 4,
          height: 6,
          width: '100%',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            background: stream.cancelled ? '#333' : `linear-gradient(90deg, ${TEAL}, ${GOLD})`,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666' }}>
            {pct}% vested
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666' }}>
            {timeRemaining(stream.endTs, nowSec)}
          </span>
        </div>
      </div>

      {/* Token amounts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'TOTAL', value: formatTokens(stream.amountTotal), color: '#aaa' },
          { label: 'WITHDRAWN', value: formatTokens(stream.amountWithdrawn), color: '#888' },
          { label: 'CLAIMABLE', value: formatTokens(claimable), color: claimable > 0 ? GOLD : '#555' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#555', marginBottom: 2 }}>
              {label}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Addresses */}
      <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#444', marginBottom: 12 }}>
        <span>FROM: {shortenAddr(stream.authority)}</span>
        <span style={{ margin: '0 8px' }}>-&gt;</span>
        <span>TO: {shortenAddr(stream.beneficiary)}</span>
      </div>

      {/* Actions */}
      {!stream.cancelled && (
        <div style={{ display: 'flex', gap: 10 }}>
          {isBenef && claimable > 0 && (
            <button
              onClick={() => onClaim(stream)}
              style={{
                flex: 1,
                padding: '10px 0',
                background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`,
                border: 'none',
                borderRadius: 8,
                color: '#000',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              CLAIM {formatTokens(claimable)}
            </button>
          )}
          {isBenef && claimable === 0 && !stream.cancelled && (
            <div style={{
              flex: 1, padding: '10px 0', textAlign: 'center',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#444',
            }}>
              {beforeCliff ? 'Cliff pending...' : 'Nothing to claim'}
            </div>
          )}
          {isCreator && nowSec < stream.endTs && (
            <button
              onClick={() => onCancel(stream)}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: '1px solid #3a1a1a',
                borderRadius: 8,
                color: '#833',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              CANCEL
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [walletAddr, setWalletAddr] = useState<string>('');
  const [connected, setConnected]   = useState(false);
  const [streams, setStreams]        = useState<StreamCard[]>([]);
  const [nowSec, setNowSec]          = useState(Math.floor(Date.now() / 1000));
  const [tab, setTab]                = useState<'my-streams' | 'all'>('my-streams');

  // Update clock every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Mock wallet connection (real wallet adapter added in Week 6 full impl)
  function handleConnect() {
    const mockAddr = 'Dv1KhE...XTFf';
    setWalletAddr(mockAddr);
    setConnected(true);
    // In production: use @solana/wallet-adapter-react useWallet()
  }

  function handleDisconnect() {
    setWalletAddr('');
    setConnected(false);
    setStreams([]);
  }

  function handleClaim(stream: StreamCard) {
    alert(`Claim ${formatTokens(calcClaimable(stream, nowSec))} tokens from stream #${stream.streamId}\n\nReal wallet signing requires wallet adapter (Week 6).`);
  }

  function handleCancel(stream: StreamCard) {
    const confirmed = confirm(`Cancel stream #${stream.streamId}?\nUnvested tokens will return to your wallet.`);
    if (confirmed) {
      alert('Cancel transaction requires wallet adapter (Week 6).');
    }
  }

  const filteredStreams = tab === 'my-streams'
    ? streams.filter(s => s.authority === walletAddr || s.beneficiary === walletAddr)
    : streams;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid #1a1a2e',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src="/logo.png" alt="BLOCKBITE" width={32} height={32} />
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#fff', fontSize: 18 }}>
            BLOCKBITE
          </span>
        </Link>

        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/game" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, color: '#888', textDecoration: 'none' }}>
            GAME
          </Link>
          <Link href="/leaderboard" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, color: '#888', textDecoration: 'none' }}>
            LEADERBOARD
          </Link>
          <Link href="/dashboard" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, color: TEAL, textDecoration: 'none', fontWeight: 700 }}>
            TDP DASHBOARD
          </Link>

          {connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: TEAL }}>
                {shortenAddr(walletAddr)}
              </span>
              <button
                onClick={handleDisconnect}
                style={{
                  padding: '6px 14px', background: 'transparent',
                  border: '1px solid #333', borderRadius: 6,
                  color: '#666', fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, cursor: 'pointer',
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              style={{
                padding: '8px 20px',
                background: `linear-gradient(135deg, ${MAGENTA}, ${PURPLE})`,
                border: 'none', borderRadius: 8,
                color: '#fff', fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '48px 32px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: TEAL, letterSpacing: 2, marginBottom: 8,
        }}>
          TOKEN DISTRIBUTION PROTOCOL
        </div>
        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif', fontSize: 36, fontWeight: 800,
          margin: '0 0 8px', lineHeight: 1.1,
        }}>
          TDP Dashboard
        </h1>
        <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#888', fontSize: 15, margin: '0 0 4px' }}>
          Manage token vesting streams. Cliff + Milestone + Linear unlock, all on Solana.
        </p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#444', margin: 0 }}>
          Program: {PROGRAM_ID}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ padding: '0 32px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'ACTIVE STREAMS', value: streams.filter(s => !s.cancelled).length.toString() },
            { label: 'TOTAL LOCKED', value: formatTokens(streams.reduce((a, s) => a + s.amountTotal, 0)) },
            { label: 'TOTAL CLAIMED', value: formatTokens(streams.reduce((a, s) => a + s.amountWithdrawn, 0)) },
            { label: 'PROGRAM', value: 'Devnet' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: '#0d0d1a', border: '1px solid #1e1e3a',
              borderRadius: 10, padding: '16px',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#555', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: GOLD }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: '0 32px', maxWidth: 900, margin: '0 auto' }}>
        {!connected ? (
          /* Connect prompt */
          <div style={{
            textAlign: 'center', padding: '80px 32px',
            background: '#0d0d1a', border: '1px solid #1e1e3a',
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {/* no emoji — use text */}
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
              Connect your wallet
            </h2>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#666', fontSize: 14, marginBottom: 24 }}>
              Connect Phantom or Solflare to view and manage your TDP streams.
            </p>
            <button
              onClick={handleConnect}
              style={{
                padding: '12px 32px',
                background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`,
                border: 'none', borderRadius: 10,
                color: '#000', fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}
            >
              Connect Wallet
            </button>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#333', marginTop: 16 }}>
              Phantom / Solflare / Coinbase / Trust supported
            </p>
          </div>
        ) : (
          /* Stream list */
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['my-streams', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '8px 20px',
                    background: tab === t ? `linear-gradient(135deg, ${MAGENTA}, ${PURPLE})` : 'transparent',
                    border: tab === t ? 'none' : '1px solid #2a2a3e',
                    borderRadius: 8,
                    color: tab === t ? '#fff' : '#666',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {t === 'my-streams' ? 'MY STREAMS' : 'ALL STREAMS'}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button
                style={{
                  padding: '8px 20px',
                  background: `linear-gradient(135deg, ${TEAL}, ${GOLD})`,
                  border: 'none', borderRadius: 8,
                  color: '#000', fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
                onClick={() => alert('Create Stream form coming in Week 6 full implementation.')}
              >
                + NEW STREAM
              </button>
            </div>

            {filteredStreams.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 32px',
                background: '#0d0d1a', border: '1px solid #1e1e3a',
                borderRadius: 16, color: '#444',
              }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, marginBottom: 8 }}>
                  No streams found
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                  Connect wallet and create your first TDP stream
                </div>
              </div>
            ) : (
              filteredStreams.map((stream) => (
                <StreamCardView
                  key={stream.id}
                  stream={stream}
                  nowSec={nowSec}
                  onClaim={handleClaim}
                  onCancel={handleCancel}
                  walletAddr={walletAddr}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* TDP info footer */}
      <div style={{ padding: '48px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          background: '#0d0d1a', border: '1px solid #1e1e3a',
          borderRadius: 12, padding: '24px',
        }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: TEAL, marginBottom: 8 }}>
            HOW IT WORKS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {[
              { step: '01', title: 'Cliff Gate', desc: 'Zero tokens unlock before cliff_ts. No early withdrawals.' },
              { step: '02', title: 'Milestone Gate', desc: 'required_tier > 0 gates unlock on oracle proof (game level, DAO vote, admin key).' },
              { step: '03', title: 'Linear Streaming', desc: 'After cliff + milestone: tokens flow per-second at rate amount / duration.' },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, color: '#2a2a3e', marginBottom: 4 }}>
                  {step}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, color: GOLD, marginBottom: 6 }}>
                  {title}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
