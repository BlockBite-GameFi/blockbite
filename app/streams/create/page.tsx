'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  getStreamPDA,
  getVaultPDA,
  VESTING_IDL,
  VESTING_PROGRAM_ID,
} from '@/lib/solana/vesting';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import Link from 'next/link';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#fff',
  fontSize: 15,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#8888BB',
  marginBottom: 8,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const fieldStyle: React.CSSProperties = {
  marginBottom: 24,
};

function todayLocalDateStr() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateToUnix(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

export default function CreateStreamPage() {
  const { publicKey, connected, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  const today = todayLocalDateStr();

  const [form, setForm] = useState({
    recipient: '',
    mint: '',
    amount: '',
    decimals: '6',
    startDate: today,
    endDate: '',
    cliffDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError(null);
  }

  function validate(): string | null {
    try { new PublicKey(form.recipient); } catch { return 'Invalid recipient address'; }
    try { new PublicKey(form.mint); } catch { return 'Invalid token mint address'; }
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) return 'Amount must be greater than 0';
    if (!form.endDate) return 'End date is required';
    const start = dateToUnix(form.startDate);
    const end   = dateToUnix(form.endDate);
    if (end <= start) return 'End date must be after start date';
    if (form.cliffDate) {
      const cliff = dateToUnix(form.cliffDate);
      if (cliff < start || cliff > end) return 'Cliff date must be between start and end';
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    if (!publicKey || !signTransaction) return;

    setSubmitting(true);
    setError(null);
    try {
      const recipient = new PublicKey(form.recipient);
      const mint      = new PublicKey(form.mint);
      const decimals  = parseInt(form.decimals, 10);
      const rawAmount = BigInt(Math.round(parseFloat(form.amount) * 10 ** decimals));
      const startTs   = dateToUnix(form.startDate);
      const endTs     = dateToUnix(form.endDate);
      const cliffTs   = form.cliffDate ? dateToUnix(form.cliffDate) : 0;

      const streamId = BigInt(Date.now()); // unique ID based on timestamp

      const [streamPDA] = getStreamPDA(publicKey, streamId);
      const [vaultPDA]  = getVaultPDA(publicKey, streamId);
      const authorityAta = getAssociatedTokenAddressSync(mint, publicKey);

      const wallet   = { publicKey, signTransaction, signAllTransactions };
      const provider = new AnchorProvider(connection, wallet as never, { commitment: 'confirmed' });
      const program  = new Program(VESTING_IDL, provider);

      const sig = await (program.methods as never as {
        create_stream: (
          streamId: BN, amount: BN, startTs: BN, cliffTs: BN, endTs: BN
        ) => { accounts: (a: object) => { rpc: () => Promise<string> } }
      })
        .create_stream(
          new BN(streamId.toString()),
          new BN(rawAmount.toString()),
          new BN(startTs),
          new BN(cliffTs),
          new BN(endTs),
        )
        .accounts({
          authority:     publicKey,
          beneficiary:   recipient,
          mint,
          stream:        streamPDA,
          vault:         vaultPDA,
          authority_ata: authorityAta,
          token_program:  TOKEN_PROGRAM_ID,
          system_program: SystemProgram.programId,
          rent:           SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      setTxSig(sig);
      setTimeout(() => router.push('/streams'), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: '100vh', padding: '80px 24px 80px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          {/* Back link */}
          <Link href="/streams" style={{ color: '#8888BB', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            ← Back to streams
          </Link>

          <div style={{
            background: 'rgba(18,18,42,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: 32,
          }}>
            <h1 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 'clamp(20px,3vw,28px)',
              fontWeight: 900,
              margin: '0 0 8px',
            }}>
              <span style={{ color: '#00F5FF' }}>CREATE</span>{' '}
              <span style={{ color: '#fff' }}>STREAM</span>
            </h1>
            <p style={{ color: '#8888BB', fontSize: 14, marginBottom: 32, marginTop: 0 }}>
              Lock tokens and set a vesting schedule for any recipient.
            </p>

            {!connected && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: '#8888BB', marginBottom: 16 }}>Connect your wallet to create a stream.</p>
                <button
                  onClick={() => setVisible(true)}
                  style={{
                    background: 'linear-gradient(135deg, #00F5FF, #7B2FBE)',
                    border: 'none', borderRadius: 12, padding: '12px 28px',
                    color: '#fff', fontFamily: "'Orbitron', monospace",
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  CONNECT WALLET
                </button>
              </div>
            )}

            {connected && !txSig && (
              <form onSubmit={handleSubmit}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Recipient Address *</label>
                  <input
                    style={inputStyle}
                    placeholder="Solana wallet address (base58)"
                    value={form.recipient}
                    onChange={e => set('recipient', e.target.value)}
                    required
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Token Mint *</label>
                  <input
                    style={inputStyle}
                    placeholder="SPL token mint address"
                    value={form.mint}
                    onChange={e => set('mint', e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}>Amount *</label>
                    <input
                      style={inputStyle}
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 10000"
                      value={form.amount}
                      onChange={e => set('amount', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Decimals</label>
                    <input
                      style={inputStyle}
                      type="number"
                      min="0"
                      max="9"
                      value={form.decimals}
                      onChange={e => set('decimals', e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}>Start Date *</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={form.startDate}
                      onChange={e => set('startDate', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>End Date *</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={form.endDate}
                      onChange={e => set('endDate', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>
                    Cliff Date <span style={{ color: '#555', fontWeight: 400 }}>(optional — no tokens until this date)</span>
                  </label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.cliffDate}
                    onChange={e => set('cliffDate', e.target.value)}
                  />
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(255,30,30,0.08)',
                    border: '1px solid rgba(255,80,80,0.3)',
                    borderRadius: 10, padding: '12px 16px',
                    marginBottom: 20, color: '#ff6b6b', fontSize: 13,
                  }}>
                    ⚠ {error}
                  </div>
                )}

                {/* Preview */}
                {form.amount && form.endDate && (
                  <div style={{
                    background: 'rgba(0,245,255,0.04)',
                    border: '1px solid rgba(0,245,255,0.12)',
                    borderRadius: 10, padding: '14px 16px',
                    marginBottom: 24, fontSize: 13, color: '#8888BB',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Total locked</span>
                      <span style={{ color: '#fff' }}>{parseFloat(form.amount || '0').toLocaleString()} tokens</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Vesting period</span>
                      <span style={{ color: '#fff' }}>
                        {form.endDate && form.startDate
                          ? `${Math.ceil((dateToUnix(form.endDate) - dateToUnix(form.startDate)) / 86400)} days`
                          : '—'}
                      </span>
                    </div>
                    {form.cliffDate && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Cliff</span>
                        <span style={{ color: '#FFD700' }}>{form.cliffDate}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    background: submitting
                      ? 'rgba(255,255,255,0.1)'
                      : 'linear-gradient(135deg, #00F5FF, #7B2FBE)',
                    border: 'none', borderRadius: 12, padding: '14px',
                    color: '#fff', fontFamily: "'Orbitron', monospace",
                    fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.05em',
                  }}
                >
                  {submitting ? 'CREATING STREAM…' : 'CREATE STREAM'}
                </button>
              </form>
            )}

            {txSig && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
                <p style={{ color: '#51CF66', fontFamily: "'Orbitron', monospace", fontWeight: 700, marginBottom: 8 }}>
                  STREAM CREATED
                </p>
                <a
                  href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#00F5FF', fontSize: 13, textDecoration: 'none' }}
                >
                  View on Solana Explorer →
                </a>
                <p style={{ color: '#8888BB', fontSize: 13, marginTop: 12 }}>Redirecting to dashboard…</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
