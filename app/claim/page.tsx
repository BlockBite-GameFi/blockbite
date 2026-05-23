'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import {
  getStreamsByBeneficiary,
  computeUnlocked,
  withdraw,
  deriveStreamPDA,
  deriveVaultPDA,
  StreamInfo,
} from '@/lib/anchor/vesting-client';
import { BN } from '@coral-xyz/anchor';
import type { SendTx } from '@/lib/anchor/vesting-client';

const DS = {
  bg0: '#05040d', bg1: '#09071a', accent: '#a78bff', accentDk: '#5e35d4',
  gold: '#f5c66a', green: '#5fd07a', red: '#ff3b6b', blue: '#7ad7ff',
  muted: 'rgba(232,225,248,.38)', border: 'rgba(167,139,255,.13)',
  card: 'rgba(255,255,255,.042)', cinzel: "'Space Grotesk', system-ui, sans-serif",
  sora: "'Sora', system-ui, sans-serif", mono: "'JetBrains Mono', monospace",
};

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

function fmtU(bn: BN): string {
  return (Number(bn.toString()) / 1e6).toFixed(2);
}

export default function ClaimPage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [streams,   setStreams]   = useState<StreamInfo[]>([]);
  const [selected,  setSelected]  = useState<number>(0);
  const [loading,   setLoading]   = useState(false);
  const [claiming,  setClaiming]  = useState(false);
  const [txSig,     setTxSig]     = useState<string | null>(null);
  const [claimErr,  setClaimErr]  = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [nowSec,    setNowSec]    = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 10_000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const all = await getStreamsByBeneficiary(connection, publicKey);
      // Only show non-cancelled streams that have something locked
      const relevant = all.filter(s => !s.cancelled || Number(s.amountWithdrawn.toString()) < Number(s.amountTotal.toString()));
      relevant.sort((a, b) => Number(computeUnlocked(b, nowSec)) - Number(computeUnlocked(a, nowSec)));
      setStreams(relevant);
      setSelected(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, nowSec]);

  useEffect(() => { load(); }, [load]);

  const stream   = streams[selected] ?? null;
  const claimable = stream ? Number(computeUnlocked(stream, nowSec)) : 0;
  const total     = stream ? Number(stream.amountTotal.toString()) : 0;
  const withdrawn = stream ? Number(stream.amountWithdrawn.toString()) : 0;
  const pctUnlocked = total > 0 ? Math.min(100, ((withdrawn + claimable) / total) * 100) : 0;
  const pctClaimed  = total > 0 ? Math.min(100, (withdrawn / total) * 100) : 0;
  const status = stream ? streamStatus(stream, nowSec) : null;

  const handleClaim = useCallback(async () => {
    if (!stream || !publicKey || claimable === 0) return;
    setClaiming(true);
    setClaimErr(null);
    setTxSig(null);
    try {
      const streamIdBn = stream.streamId;
      const [streamPda] = deriveStreamPDA(stream.authority, streamIdBn);
      const [vaultPda]  = deriveVaultPDA(stream.authority, streamIdBn);
      const beneficiaryAta = await getAssociatedTokenAddress(stream.mint, publicKey);

      const sig = await withdraw({
        connection,
        beneficiary:    publicKey,
        stream:         streamPda,
        vault:          vaultPda,
        beneficiaryAta,
        mint:           stream.mint,
        sendTransaction: sendTransaction as unknown as SendTx,
      });
      setTxSig(sig);
      await load(); // Refresh balances
    } catch (e) {
      setClaimErr(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setClaiming(false);
    }
  }, [stream, publicKey, claimable, connection, sendTransaction, load]);

  return (
    <main style={{ minHeight: '100vh', background: DS.bg0, color: '#e8e1f8' }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 24px 80px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: DS.accent, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>
            TDP · Claim Portal
          </div>
          <h1 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, letterSpacing: '0.03em', marginBottom: 10, color: '#fff' }}>
            Claim Vested Tokens
          </h1>
          <p style={{ fontSize: 13, color: DS.muted, maxWidth: 500 }}>
            Withdraw your vested tokens from on-chain PDA vaults. Amounts are calculated from the live blockchain state.
          </p>
          <div style={{ marginTop: 10 }}>
            <Link href="/demo#claim" style={{ fontSize: 12, color: DS.accent, textDecoration: 'none' }}>
              Explore demo mode →
            </Link>
          </div>
        </div>

        {/* ── Wallet gate ── */}
        {!connected && (
          <div style={{ background: DS.bg1, border: `1px solid ${DS.border}`, borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>◎</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Connect wallet to claim</div>
            <div style={{ fontSize: 13, color: DS.muted, marginBottom: 24 }}>
              Connect the wallet that is the beneficiary of a stream to see your claimable tokens.
            </div>
            <button onClick={() => setVisible(true)} style={{
              padding: '12px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg,${DS.accent},${DS.accentDk})`, color: '#fff',
              fontWeight: 700, fontSize: 14,
            }}>
              Connect Wallet
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ background: '#ff3b6b1a', border: '1px solid #ff3b6b44', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: DS.red }}>
            ✗ {error}
          </div>
        )}

        {/* ── Loading ── */}
        {connected && loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: DS.muted, fontSize: 13 }}>
            Loading your streams from Solana devnet…
          </div>
        )}

        {/* ── No streams ── */}
        {connected && !loading && streams.length === 0 && (
          <div style={{ background: DS.bg1, border: `1px solid ${DS.border}`, borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No streams found</div>
            <div style={{ fontSize: 13, color: DS.muted, marginBottom: 20 }}>
              No vesting streams where this wallet is the beneficiary were found on devnet.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/streams/new" style={{ padding: '10px 22px', borderRadius: 10, background: `linear-gradient(135deg,${DS.accent},${DS.accentDk})`, color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
                Create a stream
              </Link>
              <Link href="/demo#claim" style={{ padding: '10px 22px', borderRadius: 10, background: DS.card, border: `1px solid ${DS.border}`, color: DS.muted, fontWeight: 600, fontSize: 12, textDecoration: 'none' }}>
                View demo
              </Link>
            </div>
          </div>
        )}

        {/* ── Stream selector + claim panel ── */}
        {connected && !loading && streams.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

            {/* Stream list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {streams.map((s, i) => {
                const c = Number(computeUnlocked(s, nowSec));
                const type = streamType(s);
                const typeCol = ({ linear: DS.accent, milestone: DS.blue, cliff: DS.gold, hybrid: '#c084fc' } as Record<string, string>)[type] ?? DS.accent;
                return (
                  <button
                    key={s.pubkey.toBase58()}
                    onClick={() => { setSelected(i); setTxSig(null); setClaimErr(null); }}
                    style={{
                      background: selected === i ? `${DS.accent}18` : DS.card,
                      border: `1px solid ${selected === i ? DS.accent + '55' : DS.border}`,
                      borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: 11, fontFamily: DS.mono, color: typeCol, marginBottom: 4 }}>
                      {type.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: DS.mono, fontSize: 11, color: '#fff', marginBottom: 2 }}>
                      {s.pubkey.toBase58().slice(0, 8)}…
                    </div>
                    <div style={{ fontSize: 11, color: c > 0 ? DS.green : DS.muted, fontWeight: 700 }}>
                      {(c / 1e6).toFixed(4)} claimable
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Claim detail */}
            {stream && (
              <div style={{ background: DS.bg1, border: `1px solid ${DS.border}`, borderRadius: 20, padding: '28px' }}>

                {/* Stream header */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, color: DS.muted, fontFamily: DS.mono, marginBottom: 6 }}>
                    {stream.pubkey.toBase58()}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: `${DS.accent}1a`, color: DS.accent, border: `1px solid ${DS.accent}44` }}>
                      {streamType(stream).toUpperCase()}
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10.5, fontWeight: 700,
                      background: status === 'active' ? '#5fd07a1a' : '#f5c66a1a',
                      color: status === 'active' ? DS.green : DS.gold,
                      border: `1px solid ${status === 'active' ? '#5fd07a' : '#f5c66a'}44` }}>
                      {status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Amount bars */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: DS.muted }}>Progress</span>
                    <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.accent }}>{pctUnlocked.toFixed(1)}% unlocked</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,.07)', overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${pctUnlocked}%`, background: `linear-gradient(90deg,${DS.accent},${DS.accentDk})`, borderRadius: 99 }} />
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pctClaimed}%`, background: DS.green, borderRadius: 99 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 10, height: 3, borderRadius: 99, background: DS.accent }} />
                      <span style={{ fontSize: 10, color: DS.muted }}>Unlocked</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 10, height: 3, borderRadius: 99, background: DS.green }} />
                      <span style={{ fontSize: 10, color: DS.muted }}>Claimed</span>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Total Locked', val: fmtU(stream.amountTotal), col: DS.accent },
                    { label: 'Withdrawn',    val: fmtU(stream.amountWithdrawn), col: DS.muted },
                    { label: 'Claimable Now',val: (claimable / 1e6).toFixed(4), col: claimable > 0 ? DS.green : DS.muted },
                  ].map(s => (
                    <div key={s.label} style={{ background: DS.card, borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 9.5, color: DS.muted, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontFamily: DS.mono, fontSize: 16, fontWeight: 700, color: s.col }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Timestamps */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                  {[
                    { label: 'Cliff', val: new Date(Number(stream.cliffTs.toString()) * 1000).toLocaleDateString() },
                    { label: 'End',   val: new Date(Number(stream.endTs.toString()) * 1000).toLocaleDateString() },
                  ].map(s => (
                    <div key={s.label} style={{ background: DS.card, borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: 9.5, color: DS.muted, marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontFamily: DS.mono, fontSize: 12, color: '#fff' }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Pending cliff warning */}
                {status === 'pending' && (
                  <div style={{ background: '#f5c66a1a', border: '1px solid #f5c66a44', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: DS.gold }}>
                    ⏱ Cliff has not passed yet. Tokens will begin unlocking on {new Date(Number(stream.cliffTs.toString()) * 1000).toLocaleDateString()}.
                  </div>
                )}

                {/* Success */}
                {txSig && (
                  <div style={{ background: '#5fd07a1a', border: '1px solid #5fd07a44', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: DS.green }}>
                    ✓ Claimed successfully!{' '}
                    <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ color: DS.accent }}>
                      View on Explorer ↗
                    </a>
                  </div>
                )}

                {/* Error */}
                {claimErr && (
                  <div style={{ background: '#ff3b6b1a', border: '1px solid #ff3b6b44', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: DS.red }}>
                    ✗ {claimErr}
                  </div>
                )}

                {/* Claim button */}
                <button
                  onClick={handleClaim}
                  disabled={claimable === 0 || claiming || status === 'pending' || status === 'cancelled'}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: claimable > 0 && !claiming ? 'pointer' : 'default',
                    background: claimable > 0 && !claiming && status !== 'pending'
                      ? `linear-gradient(135deg,${DS.green},#2d8f4e)`
                      : 'rgba(255,255,255,.06)',
                    color: claimable > 0 && !claiming && status !== 'pending' ? '#fff' : DS.muted,
                    fontWeight: 700, fontSize: 14, fontFamily: DS.sora,
                    opacity: claiming ? 0.7 : 1,
                  }}
                >
                  {claiming
                    ? 'Waiting for wallet…'
                    : claimable === 0
                      ? status === 'pending' ? 'Cliff not reached' : 'Nothing to claim'
                      : `Claim ${(claimable / 1e6).toFixed(4)} TOKEN`}
                </button>

                <div style={{ fontSize: 10.5, color: DS.muted, textAlign: 'center', marginTop: 10 }}>
                  Solana devnet · Tokens released directly to your wallet
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
