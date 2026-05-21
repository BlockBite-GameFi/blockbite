'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import Navbar from '@/components/Navbar';
import { createStream } from '@/lib/anchor/vesting-client';

const ONE_DAY    = 86_400;
const ONE_WEEK   = 7   * ONE_DAY;
const ONE_MONTH  = 30  * ONE_DAY;
const SIX_MONTHS = 180 * ONE_DAY;
const ONE_YEAR   = 365 * ONE_DAY;

const CLIFF_PRESETS = [
  { label: 'None',     seconds: 0 },
  { label: '1 week',   seconds: ONE_WEEK },
  { label: '1 month',  seconds: ONE_MONTH },
  { label: '3 months', seconds: 3 * ONE_MONTH },
  { label: '6 months', seconds: SIX_MONTHS },
  { label: '1 year',   seconds: ONE_YEAR },
];

const DURATION_PRESETS = [
  { label: '6 months', seconds: SIX_MONTHS },
  { label: '1 year',   seconds: ONE_YEAR },
  { label: '2 years',  seconds: 2 * ONE_YEAR },
  { label: '4 years',  seconds: 4 * ONE_YEAR },
];

export default function CreateStreamPage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [mintInput,     setMintInput]    = useState('');
  const [recipientInput,setRecipient]    = useState('');
  const [amountInput,   setAmountInput]  = useState('');
  const [decimals,      setDecimals]     = useState<number | null>(null);
  const [cliffSeconds,  setCliffSeconds] = useState(0);
  const [durationSec,   setDurationSec]  = useState(ONE_YEAR);
  const [requiredTier,  setRequiredTier] = useState<0 | 1 | 2>(0);
  const [streamId,      setStreamId]     = useState<bigint>(() => BigInt(Math.floor(Date.now() / 1000)));

  const [busy,    setBusy]   = useState(false);
  const [sig,     setSig]    = useState<string | null>(null);
  const [error,   setError]  = useState<string | null>(null);

  // Validate mint pubkey + fetch decimals on the fly
  const [mintLoading, setMintLoading] = useState(false);
  const onMintBlur = async () => {
    if (!mintInput) { setDecimals(null); return; }
    setMintLoading(true);
    try {
      const mintPk = new PublicKey(mintInput.trim());
      const info = await getMint(connection, mintPk);
      setDecimals(info.decimals);
      setError(null);
    } catch (e) {
      setDecimals(null);
      setError(e instanceof Error ? `Mint lookup failed: ${e.message}` : 'Invalid mint address');
    } finally {
      setMintLoading(false);
    }
  };

  // Live preview math
  const preview = useMemo(() => {
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0 || !decimals) return null;
    const startTs = Math.floor(Date.now() / 1000);
    const cliffTs = cliffSeconds > 0 ? startTs + cliffSeconds : 0;
    const endTs   = startTs + durationSec;
    const lockedUntilCliff = cliffSeconds;
    const linearWindow = durationSec - cliffSeconds;
    const dailyRate = linearWindow > 0 ? amt / (linearWindow / ONE_DAY) : 0;
    return { startTs, cliffTs, endTs, lockedUntilCliff, dailyRate, totalDays: durationSec / ONE_DAY };
  }, [amountInput, decimals, cliffSeconds, durationSec]);

  const validRecipient = useMemo(() => {
    if (!recipientInput) return false;
    try { new PublicKey(recipientInput.trim()); return true; } catch { return false; }
  }, [recipientInput]);

  const canSubmit = connected && publicKey && decimals !== null && validRecipient
    && parseFloat(amountInput) > 0 && !busy;

  const handleCreate = useCallback(async () => {
    if (!publicKey || !preview || decimals === null) return;
    setError(null);
    setSig(null);
    setBusy(true);
    try {
      const rawAmount = BigInt(Math.floor(parseFloat(amountInput) * 10 ** decimals));
      const signature = await createStream({
        connection,
        authority:    publicKey,
        beneficiary:  new PublicKey(recipientInput.trim()),
        mint:         new PublicKey(mintInput.trim()),
        streamId,
        amount:       rawAmount,
        startTs:      preview.startTs,
        cliffTs:      preview.cliffTs,
        endTs:        preview.endTs,
        requiredTier,
        sendTransaction,
      });
      setSig(signature);
      // Record stream_id in localStorage so /distribute/streams can discover it
      // without doing a heavy getProgramAccounts scan against devnet RPC.
      try {
        const idxKey = `bb_streams_${publicKey.toBase58()}`;
        const stored = JSON.parse(localStorage.getItem(idxKey) ?? '[]') as string[];
        const next = Array.from(new Set([streamId.toString(), ...stored]));
        localStorage.setItem(idxKey, JSON.stringify(next));
      } catch { /* localStorage off — non-fatal */ }
      // Roll the stream_id forward so a second create in the same session
      // doesn't collide with the just-claimed PDA seed.
      setStreamId(BigInt(Math.floor(Date.now() / 1000)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Create failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }, [publicKey, preview, decimals, amountInput, recipientInput, mintInput, streamId, sendTransaction, connection]);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--ds-bg)', color: 'var(--ds-text)',
      fontFamily: "'Montserrat', 'Space Grotesk', system-ui, sans-serif",
    }}>
      <Navbar />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Link href="/distribute" style={{ color: 'var(--ds-text-dim)', fontSize: 12, textDecoration: 'none' }}>
            ← Back to distribute
          </Link>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, marginBottom: 8 }}>Create New Stream</h1>
        <p style={{ color: 'var(--ds-text-dim)', fontSize: 14, marginBottom: 30 }}>
          Lock tokens into a PDA vault with optional cliff + linear vesting.
        </p>

        {!connected && (
          <div style={{
            padding: 18, borderRadius: 12, marginBottom: 24,
            background: 'rgba(167,139,250,0.08)', border: '1px solid var(--ds-accent)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 14 }}>Connect a Solana wallet to lock tokens.</span>
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

        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Mint */}
          <div>
            <label style={lblStyle}>Token mint</label>
            <input
              type="text"
              placeholder="SPL mint address"
              value={mintInput}
              onChange={(e) => setMintInput(e.target.value)}
              onBlur={onMintBlur}
              style={inputStyle}
            />
            <small style={{ color: 'var(--ds-text-dim)', fontSize: 11 }}>
              {mintLoading ? 'Reading decimals…'
               : decimals !== null ? `Decimals: ${decimals}`
               : 'Paste any SPL token mint (USDC, your project token, etc.)'}
            </small>
          </div>

          {/* Recipient */}
          <div>
            <label style={lblStyle}>Recipient wallet</label>
            <input
              type="text"
              placeholder="Solana wallet address"
              value={recipientInput}
              onChange={(e) => setRecipient(e.target.value)}
              style={inputStyle}
            />
            <small style={{ color: 'var(--ds-text-dim)', fontSize: 11 }}>
              {recipientInput && !validRecipient ? 'Not a valid Solana address' : 'Tokens will unlock for this address.'}
            </small>
          </div>

          {/* Amount */}
          <div>
            <label style={lblStyle}>Total amount</label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="1000000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Cliff presets */}
          <div>
            <label style={lblStyle}>Cliff (no tokens unlock before this)</label>
            <div style={chipsRow}>
              {CLIFF_PRESETS.map((p) => (
                <button
                  type="button" key={p.label}
                  onClick={() => setCliffSeconds(p.seconds)}
                  style={chipStyle(cliffSeconds === p.seconds)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration presets */}
          <div>
            <label style={lblStyle}>Total vesting duration</label>
            <div style={chipsRow}>
              {DURATION_PRESETS.map((p) => (
                <button
                  type="button" key={p.label}
                  onClick={() => setDurationSec(p.seconds)}
                  style={chipStyle(durationSec === p.seconds)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Milestone gate (required_tier) */}
          <div>
            <label style={lblStyle}>Milestone gate (required_tier)</label>
            <div style={chipsRow}>
              {([
                { label: 'None (tier 0)',          value: 0 as const, desc: 'Anyone can claim after cliff' },
                { label: 'Activity tier 1',         value: 1 as const, desc: 'Recipient must reach oracle Tier 1' },
                { label: 'Activity tier 2',         value: 2 as const, desc: 'Recipient must reach oracle Tier 2' },
              ] satisfies { label: string; value: 0 | 1 | 2; desc: string }[]).map((p) => (
                <button
                  type="button" key={p.value}
                  onClick={() => setRequiredTier(p.value)}
                  title={p.desc}
                  style={chipStyle(requiredTier === p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <small style={{ color: 'var(--ds-text-dim)', fontSize: 11 }}>
              {requiredTier === 0
                ? 'No oracle gate — cliff + linear only.'
                : `Recipient must reach Tier ${requiredTier} via game or admin oracle before claiming.`}
            </small>
          </div>

          {/* Live preview */}
          {preview && (
            <div style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(125,211,252,0.06)', border: '1px solid rgba(125,211,252,0.3)',
            }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: '#7dd3fc', marginBottom: 8 }}>
                LIVE PREVIEW
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                Locks <strong>{parseFloat(amountInput).toLocaleString()}</strong> tokens
                starting <strong>{new Date(preview.startTs * 1000).toLocaleDateString()}</strong>.<br/>
                {cliffSeconds > 0
                  ? <>0 unlocks until <strong>{new Date(preview.cliffTs * 1000).toLocaleDateString()}</strong> (cliff), then </>
                  : <>From start, </>
                }
                <strong>{preview.dailyRate.toFixed(2)}</strong> tokens per day for <strong>{Math.round((preview.endTs - preview.startTs - preview.lockedUntilCliff) / ONE_DAY)}</strong> days.<br/>
                Fully vested <strong>{new Date(preview.endTs * 1000).toLocaleDateString()}</strong>.
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmit}
            style={{
              padding: '14px 22px', borderRadius: 12, border: 'none',
              background: canSubmit ? 'var(--ds-grad)' : 'rgba(255,255,255,0.08)',
              color: canSubmit ? '#0a0a14' : 'var(--ds-text-dim)',
              fontWeight: 900, fontSize: 15, cursor: canSubmit ? 'pointer' : 'not-allowed',
              letterSpacing: 0.5, marginTop: 6,
            }}
          >
            {busy ? 'LOCKING TOKENS…' : 'CREATE STREAM'}
          </button>

          {/* Result */}
          {sig && (
            <div style={{
              padding: 14, borderRadius: 12,
              background: 'rgba(94,234,212,0.08)', border: '1px solid rgba(94,234,212,0.5)',
            }}>
              <div style={{ fontSize: 12, color: '#5eead4', fontWeight: 800, marginBottom: 6 }}>
                STREAM CREATED
              </div>
              <a
                href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#5eead4', wordBreak: 'break-all', fontFamily: 'monospace' }}
              >
                {sig.slice(0, 16)}…{sig.slice(-16)} ↗
              </a>
            </div>
          )}
          {error && (
            <div style={{
              padding: 14, borderRadius: 12,
              background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.5)',
              fontSize: 12, color: '#f472b6',
            }}>
              {error}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* Shared inline styles */
const lblStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, letterSpacing: 1.5, color: 'var(--ds-text-dim)',
  fontWeight: 700, marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ds-border)',
  color: 'var(--ds-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
};
const chipsRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };
function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
    border: active ? '1px solid var(--ds-accent)' : '1px solid var(--ds-border)',
    background: active ? 'rgba(167,139,250,0.18)' : 'transparent',
    color: active ? 'var(--ds-accent)' : 'var(--ds-text-dim)',
    fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
  };
}
