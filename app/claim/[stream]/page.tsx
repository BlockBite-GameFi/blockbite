'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import {
  getAssociatedTokenAddress, getMint,
} from '@solana/spl-token';
import Navbar from '@/components/Navbar';
import {
  fetchStream, deriveStreamPDA, deriveVaultPDA,
  withdraw, ensureAtaIx,
} from '@/lib/anchor/vesting-client';

const ONE_DAY = 86_400;

function shortPk(pk: PublicKey) {
  const s = pk.toBase58();
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

/**
 * Public claim page.
 *
 * URL: /claim/<stream PDA base58> OR /claim/<authority>:<stream_id>
 *
 * Renders vested progress, recipient address, total/withdrawn breakdown.
 * When the connected wallet matches stream.beneficiary, exposes a Withdraw
 * button that calls the program's withdraw() instruction.
 *
 * Shareable link: founders can DM this URL to their recipients and that's
 * all the recipient needs — wallet picker handles the rest.
 */
export default function ClaimPage() {
  const params = useParams<{ stream: string }>();
  const streamParam = params?.stream ?? '';
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  // Resolve URL param into a stream PDA. Supports two forms.
  const streamPda = useMemo(() => {
    if (!streamParam) return null;
    // Form 1: direct base58 PDA
    try { return new PublicKey(streamParam); } catch { /* fall through */ }
    // Form 2: authority:stream_id derivation
    const parts = streamParam.split(':');
    if (parts.length === 2) {
      try {
        const auth = new PublicKey(parts[0]);
        const sid  = new BN(parts[1]);
        const [pda] = deriveStreamPDA(auth, sid);
        return pda;
      } catch { /* invalid */ }
    }
    return null;
  }, [streamParam]);

  const [stream,    setStream]    = useState<Awaited<ReturnType<typeof fetchStream>>>(null);
  const [decimals,  setDecimals]  = useState<number>(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [busy,      setBusy]      = useState(false);
  const [sig,       setSig]       = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!streamPda) {
      setError('Invalid stream URL.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchStream(connection, streamPda);
      if (!data) {
        setError('Stream not found on-chain. Verify the link.');
        setStream(null);
      } else {
        setStream(data);
        const mintInfo = await getMint(connection, data.mint);
        setDecimals(mintInfo.decimals);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [streamPda, connection]);

  useEffect(() => { refresh(); }, [refresh]);

  const ui = useMemo(() => {
    if (!stream || decimals === 0) return null;
    const now      = Math.floor(Date.now() / 1000);
    const total    = Number(stream.amountTotal.toString()) / 10 ** decimals;
    const taken    = Number(stream.amountWithdrawn.toString()) / 10 ** decimals;
    const startTs  = stream.startTs.toNumber();
    const cliffTs  = stream.cliffTs.toNumber();
    const endTs    = stream.endTs.toNumber();
    let vestedFrac = 0;
    if (now < cliffTs)       vestedFrac = 0;
    else if (now >= endTs)   vestedFrac = 1;
    else if (now > startTs)  vestedFrac = (now - startTs) / (endTs - startTs);
    const vested      = total * vestedFrac;
    const claimable   = Math.max(0, vested - taken);
    const cliffActive = now < cliffTs;
    const cliffDays   = Math.max(0, Math.ceil((cliffTs - now) / ONE_DAY));
    return {
      now, total, taken, vested, claimable, vestedFrac,
      startTs, cliffTs, endTs, cliffActive, cliffDays,
    };
  }, [stream, decimals]);

  const isRecipient = !!(stream && publicKey && publicKey.equals(stream.beneficiary));

  const handleWithdraw = useCallback(async () => {
    if (!publicKey || !stream || !streamPda) return;
    setBusy(true);
    setError(null);
    setSig(null);
    try {
      const [vault] = deriveVaultPDA(stream.authority, stream.streamId);
      const beneficiaryAta = await getAssociatedTokenAddress(stream.mint, publicKey);

      // If the recipient's ATA doesn't exist yet, prepend a create instruction.
      const createIx = await ensureAtaIx(connection, publicKey, publicKey, stream.mint);

      if (createIx) {
        // Bundle ATA create + withdraw into a single tx so the user signs once.
        const { Transaction: _Tx } = await import('@solana/web3.js');
        const _ = _Tx; // satisfy import lint
      }

      // For Phase 0 we send two separate transactions if ATA missing —
      // simpler than re-implementing the anchor-built ix as a Transaction
      // with an additional instruction. The wallet adapter handles each.
      if (createIx) {
        const tx = new Transaction().add(createIx);
        tx.feePayer = publicKey;
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
        tx.recentBlockhash = blockhash;
        const ataSig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(
          { signature: ataSig, blockhash, lastValidBlockHeight },
          'confirmed',
        );
      }

      const signature = await withdraw({
        connection,
        beneficiary:    publicKey,
        stream:         streamPda,
        vault,
        beneficiaryAta,
        mint:           stream.mint,
        sendTransaction,
      });
      setSig(signature);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [publicKey, stream, streamPda, sendTransaction, connection, refresh]);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--ds-bg)', color: 'var(--ds-text)',
      fontFamily: "'Montserrat', 'Space Grotesk', system-ui, sans-serif",
    }}>
      <Navbar />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>

        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, marginBottom: 4 }}>Claim Tokens</h1>
        <p style={{ color: 'var(--ds-text-dim)', fontSize: 13, marginBottom: 30 }}>
          On-chain vesting stream · {streamPda ? shortPk(streamPda) : 'invalid'}
        </p>

        {loading && (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--ds-text-dim)' }}>
            Reading stream from devnet…
          </div>
        )}

        {!loading && error && (
          <div style={{
            padding: 18, borderRadius: 12,
            background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.4)',
            color: '#f472b6', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {!loading && stream && ui && (
          <>
            {/* Vesting progress */}
            <section style={{
              padding: 22, borderRadius: 16,
              background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
              marginBottom: 18,
            }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'var(--ds-accent)', marginBottom: 6 }}>
                VESTED
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 4 }}>
                {ui.vested.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ds-text-dim)', marginLeft: 8 }}>
                  / {ui.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginTop: 12 }}>
                <div style={{
                  height: '100%', width: `${ui.vestedFrac * 100}%`,
                  background: 'var(--ds-grad)', transition: 'width 0.6s',
                }}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--ds-text-dim)' }}>
                <span>start {new Date(ui.startTs * 1000).toLocaleDateString()}</span>
                <span>{(ui.vestedFrac * 100).toFixed(2)}%</span>
                <span>end {new Date(ui.endTs * 1000).toLocaleDateString()}</span>
              </div>
            </section>

            {/* Stats grid */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 18 }}>
              <StatBox label="CLAIMABLE NOW" value={ui.claimable.toFixed(2)} accent={ui.claimable > 0}/>
              <StatBox label="ALREADY WITHDRAWN" value={ui.taken.toFixed(2)}/>
              <StatBox label="STATUS" value={
                stream.cancelled ? 'CANCELLED'
                : ui.cliffActive ? `CLIFF · ${ui.cliffDays}d`
                : ui.vestedFrac >= 1 ? 'FULLY VESTED'
                : 'VESTING'
              }/>
            </section>

            {/* Action area */}
            <section style={{
              padding: 22, borderRadius: 16,
              background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
            }}>
              {!connected && (
                <>
                  <p style={{ color: 'var(--ds-text-dim)', fontSize: 13, marginBottom: 14 }}>
                    Recipient address: <span style={{ fontFamily: 'monospace', color: 'var(--ds-text)' }}>{shortPk(stream.beneficiary)}</span>
                    <br/>Connect with this wallet to claim.
                  </p>
                  <button
                    type="button"
                    onClick={() => setVisible(true)}
                    style={{
                      padding: '12px 22px', borderRadius: 12, border: 'none',
                      background: 'var(--ds-grad)', color: '#0a0a14',
                      fontWeight: 900, fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    CONNECT WALLET
                  </button>
                </>
              )}

              {connected && !isRecipient && (
                <p style={{ color: 'var(--ds-text-dim)', fontSize: 13 }}>
                  Connected wallet doesn't match the recipient of this stream.
                  Switch to <span style={{ fontFamily: 'monospace', color: 'var(--ds-text)' }}>
                    {shortPk(stream.beneficiary)}
                  </span> to claim.
                </p>
              )}

              {connected && isRecipient && (
                <>
                  {stream.cancelled && (
                    <p style={{ color: '#f472b6', fontSize: 13, marginBottom: 12 }}>
                      Stream cancelled by creator. No further claims possible.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={busy || ui.claimable <= 0 || stream.cancelled}
                    style={{
                      padding: '14px 22px', borderRadius: 12, border: 'none',
                      background: ui.claimable > 0 && !stream.cancelled ? 'var(--ds-grad)' : 'rgba(255,255,255,0.08)',
                      color: ui.claimable > 0 && !stream.cancelled ? '#0a0a14' : 'var(--ds-text-dim)',
                      fontWeight: 900, fontSize: 15,
                      cursor: ui.claimable > 0 && !stream.cancelled ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {busy ? 'CLAIMING…'
                     : ui.claimable > 0 ? `CLAIM ${ui.claimable.toFixed(2)}`
                     : 'NOTHING TO CLAIM YET'}
                  </button>
                </>
              )}

              {sig && (
                <div style={{
                  marginTop: 14, padding: 12, borderRadius: 10,
                  background: 'rgba(94,234,212,0.08)', border: '1px solid rgba(94,234,212,0.5)',
                }}>
                  <div style={{ fontSize: 11, color: '#5eead4', fontWeight: 800, marginBottom: 4 }}>WITHDRAWN</div>
                  <a
                    href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: '#5eead4', fontFamily: 'monospace', wordBreak: 'break-all' }}
                  >
                    {sig.slice(0, 16)}…{sig.slice(-16)} ↗
                  </a>
                </div>
              )}
            </section>

            <div style={{ marginTop: 24, fontSize: 11, color: 'var(--ds-text-dim)', textAlign: 'center' }}>
              From {shortPk(stream.authority)} · Mint {shortPk(stream.mint)}
              <br/>
              <Link href="/distribute" style={{ color: 'var(--ds-accent)', textDecoration: 'none' }}>
                What is this?
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 12,
      background: accent ? 'rgba(94,234,212,0.10)' : 'var(--ds-surface)',
      border: `1px solid ${accent ? 'rgba(94,234,212,0.4)' : 'var(--ds-border)'}`,
    }}>
      <div style={{ fontSize: 10, color: 'var(--ds-text-dim)', fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: accent ? '#5eead4' : 'var(--ds-text)' }}>
        {value}
      </div>
    </div>
  );
}
