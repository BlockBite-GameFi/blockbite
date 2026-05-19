'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import Navbar from '@/components/Navbar';
import {
  VESTING_PROGRAM_ID, deriveStreamPDA, deriveVaultPDA, fetchStream, cancelStream,
} from '@/lib/anchor/vesting-client';

interface StreamRow {
  pda: PublicKey;
  vault: PublicKey;
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

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString();
}
function shortPk(pk: PublicKey) {
  const s = pk.toBase58();
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export default function StreamsPage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [streams, setStreams] = useState<StreamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      // Anchor accounts can't be filtered by `authority` via getProgramAccounts
      // without an account discriminator + offset. Easier: enumerate by trying
      // stream_id around recent timestamps. For Phase 0 we cap discovery at 32
      // candidates pulled from a local index in localStorage that the create
      // page writes to. (Solana RPC getProgramAccounts is too heavy a default.)
      const idxKey = `bb_streams_${publicKey.toBase58()}`;
      const stored = JSON.parse(localStorage.getItem(idxKey) ?? '[]') as string[];
      const found: StreamRow[] = [];
      for (const idStr of stored) {
        const streamIdBn = new BN(idStr);
        const [pda] = deriveStreamPDA(publicKey, streamIdBn);
        const data = await fetchStream(connection, pda);
        if (!data) continue;
        const [vault] = deriveVaultPDA(publicKey, streamIdBn);
        found.push({
          pda, vault,
          beneficiary:    data.beneficiary,
          mint:           data.mint,
          amountTotal:    data.amountTotal,
          amountWithdrawn: data.amountWithdrawn,
          startTs:        data.startTs.toNumber(),
          cliffTs:        data.cliffTs.toNumber(),
          endTs:          data.endTs.toNumber(),
          streamId:       data.streamId,
          cancelled:      data.cancelled,
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
    if (!confirm(`Cancel stream ${shortPk(row.pda)}? Unvested tokens return to you; vested-but-unclaimed go to recipient.`)) return;
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

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--ds-bg)', color: 'var(--ds-text)',
      fontFamily: "'Montserrat', 'Space Grotesk', system-ui, sans-serif",
    }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 24px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link href="/distribute" style={{ color: 'var(--ds-text-dim)', fontSize: 12, textDecoration: 'none' }}>
              ← Back to distribute
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: '6px 0 0' }}>My Streams</h1>
          </div>
          <Link href="/distribute/new" style={{
            padding: '10px 18px', borderRadius: 10, background: 'var(--ds-grad)',
            color: '#0a0a14', fontWeight: 800, fontSize: 13, textDecoration: 'none',
          }}>
            + NEW STREAM
          </Link>
        </div>

        {!connected && (
          <div style={{
            padding: 30, borderRadius: 14, textAlign: 'center',
            background: 'rgba(167,139,250,0.06)', border: '1px solid var(--ds-border)',
          }}>
            <p style={{ marginBottom: 16, color: 'var(--ds-text-dim)' }}>
              Connect your wallet to view streams you've created.
            </p>
            <button
              type="button"
              onClick={() => setVisible(true)}
              style={{
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: 'var(--ds-grad)', color: '#0a0a14',
                fontWeight: 800, fontSize: 13, cursor: 'pointer',
              }}
            >
              CONNECT WALLET
            </button>
          </div>
        )}

        {connected && loading && (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--ds-text-dim)' }}>
            Loading streams…
          </div>
        )}

        {connected && !loading && streams.length === 0 && (
          <div style={{
            padding: 30, borderRadius: 14, textAlign: 'center',
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ds-border)',
          }}>
            <p style={{ color: 'var(--ds-text-dim)', marginBottom: 14 }}>
              No streams yet. Create your first distribution.
            </p>
            <Link href="/distribute/new" style={{
              padding: '10px 18px', borderRadius: 10, background: 'var(--ds-grad)',
              color: '#0a0a14', fontWeight: 800, fontSize: 13, textDecoration: 'none',
            }}>
              CREATE STREAM
            </Link>
          </div>
        )}

        {error && (
          <div style={{
            padding: 14, borderRadius: 12, marginBottom: 18,
            background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.5)',
            fontSize: 12, color: '#f472b6',
          }}>
            {error}
          </div>
        )}

        {streams.length > 0 && (
          <div style={{
            background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ds-border)' }}>
                    {['Stream', 'Recipient', 'Mint', 'Vested', 'Status', ''].map((h) => (
                      <th key={h} style={{
                        padding: '14px 16px', textAlign: 'left',
                        color: 'var(--ds-text-dim)', fontSize: 11,
                        fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {streams.map((s) => {
                    const total     = Number(s.amountTotal.toString());
                    const withdrawn = Number(s.amountWithdrawn.toString());
                    const now       = Math.floor(Date.now() / 1000);
                    const vestedFrac = now < s.cliffTs ? 0
                      : now >= s.endTs ? 1
                      : (now - s.startTs) / (s.endTs - s.startTs);
                    const vestedPct = (vestedFrac * 100).toFixed(1);
                    const withdrawnPct = total > 0 ? ((withdrawn / total) * 100).toFixed(1) : '0';
                    const isCancelling = cancelBusy === s.pda.toBase58();
                    return (
                      <tr key={s.pda.toBase58()} style={{ borderBottom: '1px solid var(--ds-border)' }}>
                        <td style={td}>
                          <div style={{ fontFamily: 'monospace', fontSize: 11 }}>{shortPk(s.pda)}</div>
                          <div style={{ fontSize: 10, color: 'var(--ds-text-dim)', marginTop: 2 }}>
                            id #{s.streamId.toString()}
                          </div>
                        </td>
                        <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{shortPk(s.beneficiary)}</td>
                        <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{shortPk(s.mint)}</td>
                        <td style={td}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{vestedPct}%</div>
                          <div style={{ fontSize: 10, color: 'var(--ds-text-dim)' }}>
                            withdrawn {withdrawnPct}% · ends {fmtDate(s.endTs)}
                          </div>
                        </td>
                        <td style={td}>
                          <span style={{
                            fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                            padding: '3px 8px', borderRadius: 999,
                            background: s.cancelled ? 'rgba(244,114,182,0.15)' : 'rgba(94,234,212,0.15)',
                            color: s.cancelled ? '#f472b6' : '#5eead4',
                          }}>
                            {s.cancelled ? 'CANCELLED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          {!s.cancelled && (
                            <button
                              type="button"
                              onClick={() => handleCancel(s)}
                              disabled={!!cancelBusy}
                              style={{
                                padding: '6px 12px', borderRadius: 8,
                                border: '1px solid rgba(244,114,182,0.4)',
                                background: 'transparent', color: '#f472b6',
                                fontSize: 11, fontWeight: 700,
                                cursor: cancelBusy ? 'wait' : 'pointer',
                                opacity: cancelBusy ? 0.5 : 1,
                              }}
                            >
                              {isCancelling ? '…' : 'Cancel'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const td: React.CSSProperties = {
  padding: '14px 16px', fontSize: 13, color: 'var(--ds-text)', verticalAlign: 'top',
};
