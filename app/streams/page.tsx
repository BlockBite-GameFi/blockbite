'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  fetchMyStreams,
  StreamData,
  calcClaimable,
  vestingProgress,
  fmtTokens,
  fmtDate,
  getStreamPDA,
  getVaultPDA,
  VESTING_PROGRAM_ID,
  VESTING_IDL,
} from '@/lib/solana/vesting';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';

const card: React.CSSProperties = {
  background: 'rgba(18,18,42,0.85)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 24,
};

export default function StreamsPage() {
  const { publicKey, connected, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [streams, setStreams]   = useState<StreamData[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [now, setNow]           = useState(Math.floor(Date.now() / 1000));
  const [pending, setPending]   = useState<string | null>(null); // stream key being acted on

  // Tick every 10 s so progress bars update live
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 10_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyStreams(connection, publicKey);
      setStreams(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => { if (connected) load(); }, [connected, load]);

  async function handleWithdraw(stream: StreamData) {
    if (!publicKey || !signTransaction) return;
    setPending(stream.publicKey.toBase58());
    try {
      const wallet = { publicKey, signTransaction, signAllTransactions };
      const provider = new AnchorProvider(connection, wallet as never, { commitment: 'confirmed' });
      const program  = new Program(VESTING_IDL, provider);

      const [streamPDA] = getStreamPDA(stream.authority, stream.streamId);
      const [vaultPDA]  = getVaultPDA(stream.authority, stream.streamId);
      const beneficiaryAta = getAssociatedTokenAddressSync(stream.mint, publicKey);

      await (program.methods as never as { withdraw: () => { accounts: (a: object) => { rpc: () => Promise<string> } } })
        .withdraw()
        .accounts({
          beneficiary:     publicKey,
          stream:          streamPDA,
          vault:           vaultPDA,
          beneficiary_ata: beneficiaryAta,
          token_program:   TOKEN_PROGRAM_ID,
        })
        .rpc();

      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Withdraw failed');
    } finally {
      setPending(null);
    }
  }

  async function handleCancel(stream: StreamData) {
    if (!publicKey || !signTransaction) return;
    setPending(stream.publicKey.toBase58());
    try {
      const wallet = { publicKey, signTransaction, signAllTransactions };
      const provider = new AnchorProvider(connection, wallet as never, { commitment: 'confirmed' });
      const program  = new Program(VESTING_IDL, provider);

      const [streamPDA] = getStreamPDA(stream.authority, stream.streamId);
      const [vaultPDA]  = getVaultPDA(stream.authority, stream.streamId);
      const authorityAta    = getAssociatedTokenAddressSync(stream.mint, publicKey);
      const beneficiaryAta  = getAssociatedTokenAddressSync(stream.mint, stream.beneficiary);

      await (program.methods as never as { cancel: () => { accounts: (a: object) => { rpc: () => Promise<string> } } })
        .cancel()
        .accounts({
          authority:       publicKey,
          beneficiary:     stream.beneficiary,
          stream:          streamPDA,
          vault:           vaultPDA,
          authority_ata:   authorityAta,
          beneficiary_ata: beneficiaryAta,
          token_program:   TOKEN_PROGRAM_ID,
        })
        .rpc();

      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setPending(null);
    }
  }

  const myCreated   = streams.filter(s => s.authority.equals(publicKey!));
  const myReceiving = streams.filter(s => s.beneficiary.equals(publicKey!) && !s.authority.equals(publicKey!));

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: '100vh', paddingBottom: 80, padding: '80px 24px 80px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, margin: 0 }}>
                <span style={{ color: '#00F5FF' }}>TOKEN</span>{' '}
                <span style={{ color: '#fff' }}>STREAMS</span>
              </h1>
              <p style={{ color: '#8888BB', fontSize: 14, marginTop: 6 }}>
                Vesting schedules on Solana — create, claim, or cancel
              </p>
            </div>
            <Link href="/streams/create">
              <button style={{
                background: 'linear-gradient(135deg, #00F5FF, #7B2FBE)',
                border: 'none', borderRadius: 12, padding: '12px 24px',
                color: '#fff', fontFamily: "'Orbitron', monospace",
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                letterSpacing: '0.05em',
              }}>
                + CREATE STREAM
              </button>
            </Link>
          </div>

          {/* Wallet gate */}
          {!connected && (
            <div style={{ ...card, textAlign: 'center', padding: 48 }}>
              <p style={{ color: '#8888BB', marginBottom: 20, fontSize: 16 }}>
                Connect your wallet to view your vesting streams.
              </p>
              <button
                onClick={() => setVisible(true)}
                style={{
                  background: 'linear-gradient(135deg, #00F5FF, #7B2FBE)',
                  border: 'none', borderRadius: 12, padding: '14px 32px',
                  color: '#fff', fontFamily: "'Orbitron', monospace",
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                }}
              >
                CONNECT WALLET
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ ...card, borderColor: 'rgba(255,80,80,0.3)', background: 'rgba(255,30,30,0.08)', marginBottom: 20 }}>
              <p style={{ color: '#ff6b6b', margin: 0, fontSize: 14 }}>⚠ {error}</p>
            </div>
          )}

          {/* Loading */}
          {connected && loading && (
            <div style={{ ...card, textAlign: 'center', padding: 48 }}>
              <p style={{ color: '#8888BB' }}>Loading streams…</p>
            </div>
          )}

          {/* Empty */}
          {connected && !loading && streams.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: 48 }}>
              <p style={{ color: '#8888BB', marginBottom: 20 }}>
                No streams found for this wallet.
              </p>
              <Link href="/streams/create">
                <button style={{
                  background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)',
                  borderRadius: 12, padding: '12px 28px', color: '#00F5FF',
                  fontFamily: "'Orbitron', monospace", fontWeight: 700,
                  fontSize: 14, cursor: 'pointer',
                }}>
                  CREATE YOUR FIRST STREAM
                </button>
              </Link>
            </div>
          )}

          {/* Streams I created */}
          {myCreated.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 16, color: '#FFD700', marginBottom: 16 }}>
                STREAMS YOU CREATED ({myCreated.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {myCreated.map(s => (
                  <StreamCard
                    key={s.publicKey.toBase58()}
                    stream={s}
                    now={now}
                    role="creator"
                    isPending={pending === s.publicKey.toBase58()}
                    onCancel={() => handleCancel(s)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Streams I receive */}
          {myReceiving.length > 0 && (
            <section>
              <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 16, color: '#00F5FF', marginBottom: 16 }}>
                STREAMS YOU RECEIVE ({myReceiving.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {myReceiving.map(s => (
                  <StreamCard
                    key={s.publicKey.toBase58()}
                    stream={s}
                    now={now}
                    role="beneficiary"
                    isPending={pending === s.publicKey.toBase58()}
                    onWithdraw={() => handleWithdraw(s)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function StreamCard({
  stream, now, role, isPending, onWithdraw, onCancel,
}: {
  stream: StreamData;
  now: number;
  role: 'creator' | 'beneficiary';
  isPending: boolean;
  onWithdraw?: () => void;
  onCancel?: () => void;
}) {
  const progress   = vestingProgress(stream, now);
  const claimable  = calcClaimable(stream, now);
  const hasCliff   = stream.cliffTs > stream.startTs;
  const cliffPassed = now >= stream.cliffTs;

  return (
    <div style={{
      background: 'rgba(18,18,42,0.85)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${stream.cancelled ? 'rgba(255,80,80,0.2)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 16,
      padding: 24,
      opacity: stream.cancelled ? 0.7 : 1,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 12,
              background: 'rgba(0,245,255,0.08)',
              border: '1px solid rgba(0,245,255,0.15)',
              borderRadius: 6, padding: '2px 8px', color: '#00F5FF',
            }}>
              #{stream.streamId.toString()}
            </span>
            {stream.cancelled && (
              <span style={{ fontSize: 11, color: '#ff6b6b', fontWeight: 600 }}>CANCELLED</span>
            )}
            {!stream.cancelled && now >= stream.endTs && (
              <span style={{ fontSize: 11, color: '#51CF66', fontWeight: 600 }}>FULLY VESTED</span>
            )}
            {hasCliff && !cliffPassed && !stream.cancelled && (
              <span style={{ fontSize: 11, color: '#FFD700', fontWeight: 600 }}>
                CLIFF {fmtDate(stream.cliffTs)}
              </span>
            )}
          </div>
          <p style={{ margin: 0, color: '#8888BB', fontSize: 12, fontFamily: 'monospace' }}>
            {role === 'creator'
              ? `To: ${stream.beneficiary.toBase58().slice(0,8)}…${stream.beneficiary.toBase58().slice(-4)}`
              : `From: ${stream.authority.toBase58().slice(0,8)}…${stream.authority.toBase58().slice(-4)}`
            }
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontFamily: "'Orbitron', monospace", fontSize: 18, color: '#fff', fontWeight: 700 }}>
            {fmtTokens(stream.amountTotal)}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#8888BB' }}>
            {fmtTokens(stream.amountWithdrawn)} claimed
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8888BB', marginBottom: 6 }}>
          <span>{fmtDate(stream.startTs)}</span>
          <span style={{ color: '#00F5FF', fontWeight: 600 }}>{progress.toFixed(1)}% vested</span>
          <span>{fmtDate(stream.endTs)}</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: stream.cancelled
              ? 'rgba(255,80,80,0.5)'
              : 'linear-gradient(90deg, #00F5FF, #7B2FBE)',
            borderRadius: 4,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Actions */}
      {!stream.cancelled && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {role === 'beneficiary' && (
            <button
              onClick={onWithdraw}
              disabled={isPending || claimable === 0n}
              style={{
                background: claimable > 0n
                  ? 'linear-gradient(135deg, #00F5FF, #7B2FBE)'
                  : 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: 10, padding: '10px 20px',
                color: claimable > 0n ? '#fff' : '#555',
                fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: 13,
                cursor: claimable > 0n && !isPending ? 'pointer' : 'not-allowed',
                transition: 'opacity 0.2s',
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'CLAIMING…' : `CLAIM ${fmtTokens(claimable)}`}
            </button>
          )}
          {role === 'creator' && now < stream.endTs && (
            <button
              onClick={onCancel}
              disabled={isPending}
              style={{
                background: 'rgba(255,80,80,0.08)',
                border: '1px solid rgba(255,80,80,0.3)',
                borderRadius: 10, padding: '10px 20px',
                color: '#ff6b6b', fontFamily: "'Orbitron', monospace",
                fontWeight: 700, fontSize: 13,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'CANCELLING…' : 'CANCEL STREAM'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
