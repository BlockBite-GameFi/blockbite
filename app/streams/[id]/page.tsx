'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import {
  fetchStream,
  fetchVaultBalance,
  computeUnlocked,
  withdraw as doWithdraw,
  deriveVaultPDA,
  StreamInfo,
} from '@/lib/anchor/vesting-client';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function truncatePk(pk: PublicKey): string {
  const s = pk.toBase58();
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function fmtDate(ts: number): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/** Format raw token units to a human-readable string (no decimals assumed) */
function fmtTokens(raw: bigint): string {
  if (raw >= 1_000_000n) return `${(Number(raw) / 1_000_000).toFixed(2)}M`;
  if (raw >= 1_000n)     return `${(Number(raw) / 1_000).toFixed(1)}K`;
  return raw.toLocaleString();
}

/** Infer a vesting schedule label from on-chain timestamps */
type VestType = 'linear' | 'cliff' | 'milestone' | 'hybrid';
function inferType(
  startTs: number,
  cliffTs: number,
  endTs: number,
  milestoneCount: number,
  requiredTier: number,
): VestType {
  if (milestoneCount > 0 || requiredTier > 0) return 'milestone';
  const hasCliff = cliffTs > startTs;
  if (!hasCliff) return 'linear';
  // Pure cliff: cliff == end (all-or-nothing release)
  if (cliffTs >= endTs - 60) return 'cliff';
  // Has both cliff gate + linear decay after
  return 'hybrid';
}

// ─── Main page ────────────────────────────────────────────────────────────────
type RawStream = NonNullable<Awaited<ReturnType<typeof fetchStream>>>;

export default function StreamDetailPage() {
  const params   = useParams();
  const idParam  = params?.id as string | undefined;

  const { connection }               = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [stream,   setStream]   = useState<RawStream | null>(null);
  const [vault,    setVault]    = useState<bigint>(0n);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimSig, setClaimSig] = useState<string | null>(null);
  const [claimErr, setClaimErr] = useState<string | null>(null);

  // Parse PDA from URL — must be a valid base58 Solana pubkey
  const streamPda = (() => {
    if (!idParam) return null;
    try { return new PublicKey(idParam); } catch { return null; }
  })();

  const load = useCallback(() => {
    if (!streamPda) {
      setFetchErr('Invalid stream address in URL');
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchErr(null);
    fetchStream(connection, streamPda)
      .then(async s => {
        setStream(s);
        if (s) {
          try {
            const [vaultPda] = deriveVaultPDA(s.authority, s.streamId);
            const bal = await fetchVaultBalance(connection, vaultPda);
            setVault(bal);
          } catch { /* vault may not exist yet */ }
        }
        setLoading(false);
      })
      .catch(e => {
        setFetchErr((e as Error)?.message ?? 'RPC error');
        setLoading(false);
      });
  }, [connection, idParam]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── Withdraw / Claim handler ─────────────────────────────────────────────
  const handleClaim = async () => {
    if (!stream || !publicKey || !streamPda) return;
    setClaiming(true);
    setClaimErr(null);
    setClaimSig(null);
    try {
      const [vaultPda] = deriveVaultPDA(stream.authority, stream.streamId);
      const beneficiaryAta = await getAssociatedTokenAddress(stream.mint, publicKey);
      const sig = await doWithdraw({
        connection,
        beneficiary:     publicKey,
        stream:          streamPda,
        vault:           vaultPda,
        beneficiaryAta,
        mint:            stream.mint,
        sendTransaction: (tx, conn) => sendTransaction(tx, conn),
      });
      setClaimSig(sig);
      load(); // refresh on-chain state
    } catch (e: unknown) {
      setClaimErr((e as Error)?.message ?? 'Transaction failed');
    } finally {
      setClaiming(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: C.muted, fontFamily: C.mono, fontSize: 14 }}>
          Fetching stream from chain…
        </div>
      </div>
    );
  }

  // ── Not found / error state ──────────────────────────────────────────────
  if (fetchErr || !stream || !streamPda) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{ fontFamily: C.serif, fontSize: 22, fontWeight: 800, color: '#fff' }}>
          Stream not found
        </div>
        <div style={{ color: C.muted, fontSize: 13, maxWidth: 360, textAlign: 'center' }}>
          {fetchErr ?? 'No stream account exists at this address on devnet.'}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/streams" style={{ color: C.accent, textDecoration: 'none', fontSize: 13 }}>
            ← All Streams
          </Link>
          <Link href="/demo#streams" style={{ color: C.muted, textDecoration: 'none', fontSize: 13 }}>
            View demo data
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const nowSec    = Math.floor(Date.now() / 1000);
  const startTs   = Number(stream.startTs.toString());
  const cliffTs   = Number(stream.cliffTs.toString());
  const endTs     = Number(stream.endTs.toString());
  const total     = BigInt(stream.amountTotal.toString());
  const withdrawn = BigInt(stream.amountWithdrawn.toString());

  // Extra fields decoded by Anchor (present at runtime, not typed by fetchStream)
  const milestoneCount     = (stream as unknown as StreamInfo).milestoneCount    ?? 0;
  const requiredTier       = (stream as unknown as StreamInfo).requiredTier       ?? 0;
  const milestonesVerified = (stream as unknown as StreamInfo).milestonesVerified ?? [];
  const milestonePct       = (stream as unknown as StreamInfo).milestonePct       ?? [];

  const claimable  = computeUnlocked(stream as unknown as StreamInfo, nowSec);
  const type       = inferType(startTs, cliffTs, endTs, milestoneCount, requiredTier);
  const typeCol    = ({ linear: C.accent, milestone: C.blue, cliff: C.gold, hybrid: '#c084fc' } as Record<string, string>)[type] ?? C.accent;

  const statusLabel = stream.cancelled ? 'CANCELLED'
    : nowSec < cliffTs ? 'PENDING'
    : nowSec >= endTs  ? 'COMPLETED'
    : 'ACTIVE';
  const statusColor = stream.cancelled ? C.red
    : statusLabel === 'PENDING'    ? C.gold
    : statusLabel === 'COMPLETED'  ? C.muted
    : C.green;

  const unlockedTotal = withdrawn + claimable;
  const nowPct = total > 0n ? Math.min(1, Number(unlockedTotal) / Number(total)) : 0;

  // ── Vesting curve SVG (built from real timestamps) ───────────────────────
  const W = 560, H = 160, PX = 36, PY = 14;
  const iw = W - PX * 2;
  const ih = H - PY * 2;

  const cliffFrac = endTs > startTs ? Math.min(1, (cliffTs - startTs) / (endTs - startTs)) : 0;

  const curvePts = Array.from({ length: 60 }, (_, i) => {
    const t = i / 59;
    let y: number;
    const postCliff = cliffFrac >= 1 ? 0 : (t - cliffFrac) / (1 - cliffFrac);
    if      (type === 'linear')    y = t;
    else if (type === 'cliff')     y = t < cliffFrac ? 0 : 1;
    else if (type === 'milestone') y = t < cliffFrac ? 0 : postCliff < 0.33 ? 0.3 : postCliff < 0.67 ? 0.6 : 1;
    else                           y = t < cliffFrac ? 0 : Math.pow(Math.max(0, postCliff), 0.65);
    return { x: PX + t * iw, y: H - PY - y * ih };
  });

  const pathD = curvePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L${PX + iw},${H - PY} L${PX},${H - PY} Z`;
  const nowX  = PX + nowPct * iw;
  const nowY  = curvePts[Math.round(nowPct * 59)]?.y ?? (H - PY);

  const vestDays  = Math.max(1, Math.round((endTs - startTs) / 86400));
  const cliffDays = Math.max(0, Math.round((cliffTs - startTs) / 86400));
  const activeDays = Math.max(1, Math.round((endTs - cliffTs) / 86400));

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg0, padding: '0 0 60px' }}>

      {/* Header */}
      <div style={{
        padding: '32px 40px 20px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ marginBottom: 4 }}>
            <Link href="/streams" style={{ color: C.muted, fontSize: 12, textDecoration: 'none' }}>← All Streams</Link>
          </div>
          <h1 style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
            Stream Detail
          </h1>
          <p style={{ fontSize: 11, color: C.muted, margin: '4px 0 0', fontFamily: C.mono, wordBreak: 'break-all' }}>
            {streamPda.toBase58()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {publicKey && claimable > 0n && !stream.cancelled && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              style={{
                padding: '9px 20px', borderRadius: 10, border: 'none',
                cursor: claiming ? 'default' : 'pointer',
                background: `linear-gradient(135deg, ${C.gold}cc, ${C.gold})`,
                color: '#0b0918', fontSize: 13, fontWeight: 700, fontFamily: C.serif,
                opacity: claiming ? 0.6 : 1,
              }}
            >
              {claiming ? 'Claiming…' : `Claim ${fmtTokens(claimable)} tokens`}
            </button>
          )}
          {!publicKey && claimable > 0n && (
            <div style={{ fontSize: 12, color: C.muted, alignSelf: 'center' }}>
              Connect wallet to claim
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Claim result banner */}
        {claimSig && (
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: `${C.green}0a`, border: `1px solid ${C.green}44`,
            fontSize: 12, color: C.green,
          }}>
            ✓ Claimed ·{' '}
            <a
              href={`https://explorer.solana.com/tx/${claimSig}?cluster=devnet`}
              target="_blank" rel="noreferrer"
              style={{ color: C.green }}
            >
              {claimSig.slice(0, 8)}…{claimSig.slice(-6)} ↗
            </a>
          </div>
        )}
        {claimErr && (
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: `${C.red}0a`, border: `1px solid ${C.red}44`,
            fontSize: 12, color: C.red,
          }}>
            ✗ {claimErr}
          </div>
        )}

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {[
            { l: 'Total',      v: fmtTokens(total),                                                      c: '#fff'   },
            { l: 'Withdrawn',  v: fmtTokens(withdrawn),                                                   c: C.green  },
            { l: 'Claimable',  v: fmtTokens(claimable),                                                   c: C.gold   },
            { l: 'Vault Bal',  v: fmtTokens(vault),                                                       c: C.accent },
            { l: 'Still Locked', v: fmtTokens(total > unlockedTotal ? total - unlockedTotal : 0n),       c: C.muted  },
          ].map(x => (
            <Card key={x.l} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                {x.l}
              </div>
              <div style={{ fontFamily: C.mono, fontSize: 18, fontWeight: 700, color: x.c, lineHeight: 1 }}>
                {x.v}
              </div>
            </Card>
          ))}
        </div>

        {/* Meta badges */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge label={type.toUpperCase()} color={typeCol} />
          <Badge label={statusLabel}        color={statusColor} />
          <span style={{ fontSize: 11.5, color: C.muted }}>
            Start: <b style={{ color: '#fff' }}>{fmtDate(startTs)}</b>
          </span>
          <span style={{ fontSize: 11.5, color: C.muted }}>
            Cliff: <b style={{ color: '#fff' }}>{fmtDate(cliffTs)}</b>
          </span>
          <span style={{ fontSize: 11.5, color: C.muted }}>
            End: <b style={{ color: '#fff' }}>{fmtDate(endTs)}</b>
          </span>
          <span style={{ fontSize: 11.5, color: C.muted }}>
            Creator: <code style={{ color: C.accent, fontFamily: C.mono, fontSize: 11 }}>{truncatePk(stream.authority)}</code>
          </span>
          <span style={{ fontSize: 11.5, color: C.muted }}>
            Recipient: <code style={{ color: C.blue, fontFamily: C.mono, fontSize: 11 }}>{truncatePk(stream.beneficiary)}</code>
          </span>
          <span style={{ fontSize: 11.5, color: C.muted }}>
            Mint: <code style={{ color: C.gold, fontFamily: C.mono, fontSize: 11 }}>{truncatePk(stream.mint)}</code>
          </span>
        </div>

        {/* Curve + schedule/milestone panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>

          {/* Vesting curve SVG */}
          <Card>
            <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              Vesting Curve — {type.charAt(0).toUpperCase() + type.slice(1)} Model
            </div>
            <svg width="100%" viewBox={`0 0 ${W} ${H + 28}`} style={{ display: 'block' }}>
              <defs>
                <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={typeCol} stopOpacity="0.35" />
                  <stop offset="1" stopColor={typeCol} stopOpacity="0" />
                </linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="2.5" /></filter>
              </defs>
              {[0, 0.5, 1].map(v => (
                <line key={v}
                  x1={PX} y1={H - PY - v * ih}
                  x2={PX + iw} y2={H - PY - v * ih}
                  stroke="rgba(255,255,255,.05)" strokeWidth="1"
                />
              ))}
              <path d={areaD} fill="url(#vg)" />
              <path d={pathD} fill="none" stroke={typeCol} strokeWidth="2.5"
                filter="url(#glow)" strokeLinecap="round" />
              <path d={pathD} fill="none" stroke={typeCol} strokeWidth="1.5" strokeLinecap="round" />
              {/* NOW indicator */}
              <line
                x1={nowX} y1={PY / 2}
                x2={nowX} y2={H - PY}
                stroke={C.gold} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.8"
              />
              <circle cx={nowX} cy={nowY} r="5" fill={C.gold}
                style={{ filter: `drop-shadow(0 0 6px ${C.gold})` }} />
              <text x={nowX} y={PY / 2 - 2} textAnchor="middle" fontSize="8.5"
                fontFamily="JetBrains Mono,monospace" fill={C.gold}>
                NOW
              </text>
            </svg>

            {/* Progress bar */}
            <div style={{ marginTop: 10 }}>
              <div style={{
                height: 8, borderRadius: 99, background: 'rgba(255,255,255,.06)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${total > 0n ? Math.round(Number(unlockedTotal) * 100 / Number(total)) : 0}%`,
                  background: `${typeCol}44`, transition: 'width .5s',
                }} />
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${total > 0n ? Math.round(Number(withdrawn) * 100 / Number(total)) : 0}%`,
                  background: `linear-gradient(90deg,${typeCol}88,${typeCol})`,
                  transition: 'width .5s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginTop: 4 }}>
                <span>Withdrawn {total > 0n ? Math.round(Number(withdrawn) * 100 / Number(total)) : 0}%</span>
                <span>Unlocked {total > 0n ? Math.round(Number(unlockedTotal) * 100 / Number(total)) : 0}%</span>
                <span>Total {fmtTokens(total)} tokens</span>
              </div>
            </div>
          </Card>

          {/* Milestones or schedule */}
          <Card>
            <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              {milestoneCount > 0 ? 'Milestone Gates' : 'Schedule'}
            </div>

            {milestoneCount > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: milestoneCount }).map((_, i) => {
                  const done = milestonesVerified[i] ?? false;
                  const pct  = milestonePct[i] ?? 0;
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: 10, alignItems: 'center',
                      padding: '9px 12px', borderRadius: 10,
                      background: done ? `${C.green}0a` : 'rgba(255,255,255,.03)',
                      border: `1px solid ${done ? C.green : C.border}`,
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                        background: done ? C.green : 'rgba(255,255,255,.06)',
                        border: `1.5px solid ${done ? C.green : C.border}`,
                        display: 'grid', placeItems: 'center',
                        fontSize: 12, color: done ? '#0b0a14' : C.muted,
                      }}>
                        {done ? '✓' : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: done ? '#fff' : C.muted, fontWeight: done ? 600 : 400 }}>
                          Milestone {i + 1}
                        </div>
                        <div style={{ fontSize: 9.5, color: C.muted }}>{pct}% unlock · {done ? 'verified' : 'pending'}</div>
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 11, color: done ? C.green : C.muted }}>
                        {pct}%
                      </div>
                    </div>
                  );
                })}
                {requiredTier > 0 && (
                  <div style={{ fontSize: 11, color: C.muted, paddingTop: 4 }}>
                    Tier gate: requires tier ≥ {requiredTier}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { l: 'Start',      v: fmtDate(startTs),             c: C.muted  },
                  { l: 'Cliff',      v: fmtDate(cliffTs),             c: C.gold   },
                  { l: 'End',        v: fmtDate(endTs),               c: C.accent },
                  { l: 'Stream ID',  v: stream.streamId.toString(),   c: C.blue   },
                ].map((r, i, arr) => (
                  <div key={r.l} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '9px 0',
                    borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{r.l}</span>
                    <span style={{ fontSize: 12, color: r.c, fontFamily: C.mono }}>{r.v}</span>
                  </div>
                ))}
                {!publicKey && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 10, padding: '8px 10px', background: 'rgba(255,255,255,.02)', borderRadius: 8 }}>
                    Connect wallet to claim vested tokens
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Math breakdown */}
        <Card>
          <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Mathematical Breakdown — On-Chain Formula
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Total Duration',   val: `${vestDays} days`,     col: typeCol  },
              { label: 'Cliff Period',      val: `${cliffDays} days`,    col: C.ember  },
              { label: 'Vesting Rate',      val: activeDays > 0
                ? `${fmtTokens(total / BigInt(activeDays))} T/day`
                : '—',                                                    col: typeCol  },
            ].map(x => (
              <div key={x.label} style={{
                padding: '12px 14px', background: 'rgba(255,255,255,.03)',
                borderRadius: 10, border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 9.5, color: C.muted, marginBottom: 4 }}>{x.label}</div>
                <div style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, color: x.col }}>{x.val}</div>
              </div>
            ))}
          </div>
          <div style={{
            fontFamily: C.mono, fontSize: 12, color: C.muted,
            background: 'rgba(0,0,0,.3)', borderRadius: 10, padding: '12px 16px',
            lineHeight: 1.8,
          }}>
            <span style={{ color: C.accent }}>claimable(t)</span>
            {' = min('}
            <span style={{ color: C.gold }}>{fmtTokens(total)}</span>
            {', R × (t − cliff_ts)) − withdrawn'}
            <br />
            <span style={{ color: C.muted }}>
              {'// gated by: cliff_passed'}
              {requiredTier > 0 ? ` AND tier ≥ ${requiredTier}` : ''}
            </span>
          </div>
        </Card>

        {/* Explorer link */}
        <div style={{ textAlign: 'center', fontSize: 12, color: C.muted }}>
          <a
            href={`https://explorer.solana.com/address/${streamPda.toBase58()}?cluster=devnet`}
            target="_blank" rel="noreferrer"
            style={{ color: C.accent, textDecoration: 'none' }}
          >
            View stream account on Solana Explorer ↗
          </a>
        </div>
      </div>
    </div>
  );
}
