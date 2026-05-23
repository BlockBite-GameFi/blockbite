'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import Navbar from '@/components/Navbar';
import { createStream } from '@/lib/anchor/vesting-client';

// ─── Design System V3 ─────────────────────────────────────────────────────────
const DS = {
  bg0:      '#05040d',
  bg1:      '#09071a',
  bg2:      '#0e0c22',
  accent:   '#a78bff',
  accentDk: '#5e35d4',
  gold:     '#f5c66a',
  green:    '#5fd07a',
  red:      '#ff3b6b',
  blue:     '#7ad7ff',
  ember:    '#ff7a3a',
  muted:    'rgba(232,225,248,.38)',
  border:   'rgba(167,139,255,.13)',
  card:     'rgba(255,255,255,.042)',
  cinzel:   "'Space Grotesk', system-ui, sans-serif",
  sora:     "'Sora', system-ui, sans-serif",
  mono:     "'JetBrains Mono', monospace",
};

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

type VestingType = 'linear' | 'cliff' | 'milestone';
type VerifyMethod = 'game' | 'oracle' | 'multisig' | 'manual';

const VESTING_OPTIONS: { type: VestingType; icon: string; title: string; desc: string; color: string }[] = [
  { type: 'linear',    icon: '∿', color: DS.blue,   title: 'Linear',    desc: 'Constant unlock rate after optional cliff.' },
  { type: 'cliff',     icon: '⌐', color: DS.accent, title: 'Cliff',     desc: 'Hard lock until date, then full release.' },
  { type: 'milestone', icon: '◎', color: DS.gold,   title: 'Milestone', desc: 'Percentage unlocks tied to verified conditions.' },
];

const VERIFY_OPTIONS: { method: VerifyMethod; icon: string; color: string; title: string; desc: string; badge: string }[] = [
  {
    method: 'game', icon: '◈', color: '#c084fc',
    title: 'Game',
    desc: 'Recipients play BlockBite puzzle. Score threshold triggers on-chain milestone verification. Sybil-resistant.',
    badge: 'SYBIL RESISTANT',
  },
  {
    method: 'oracle', icon: '⬡', color: DS.blue,
    title: 'Oracle',
    desc: 'Chainlink data feed triggers milestone automatically when KPI threshold is met.',
    badge: 'AUTOMATED',
  },
  {
    method: 'multisig', icon: '◉', color: DS.gold,
    title: 'MultiSig',
    desc: '3-of-5 designated signers approve milestone completion. DAO-native governance.',
    badge: 'DAO NATIVE',
  },
  {
    method: 'manual', icon: '✦', color: DS.muted,
    title: 'Manual',
    desc: 'Stream creator manually signs transaction to approve each milestone.',
    badge: 'SIMPLE',
  },
];

interface Milestone {
  label: string;
  pct: number;
}

export default function CreateStreamPage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  // Wizard step: 1–4
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Recipient & Token
  const [mintInput,      setMintInput]    = useState('');
  const [recipientInput, setRecipient]    = useState('');
  const [amountInput,    setAmountInput]  = useState('');
  const [decimals,       setDecimals]     = useState<number | null>(null);

  // Step 2: Vesting Schedule
  const [vestingType,   setVestingType]  = useState<VestingType>('linear');
  const [cliffSeconds,  setCliffSeconds] = useState(0);
  const [durationSec,   setDurationSec]  = useState(ONE_YEAR);

  // Step 3: Verification (milestone only)
  const [verifyMethod,  setVerifyMethod] = useState<VerifyMethod>('game');
  const [milestones,    setMilestones]   = useState<Milestone[]>([
    { label: 'Milestone 1', pct: 25 },
    { label: 'Milestone 2', pct: 25 },
    { label: 'Milestone 3', pct: 25 },
    { label: 'Milestone 4', pct: 25 },
  ]);
  const [numMilestones, setNumMilestones] = useState(4);

  const [streamId, setStreamId] = useState<bigint>(() => BigInt(Math.floor(Date.now() / 1000)));
  const [busy,     setBusy]     = useState(false);
  const [sig,      setSig]      = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  // Validate mint pubkey + fetch decimals
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

  const validRecipient = useMemo(() => {
    if (!recipientInput) return false;
    try { new PublicKey(recipientInput.trim()); return true; } catch { return false; }
  }, [recipientInput]);

  // Derive requiredTier from vestingType for the contract
  const requiredTier: 0 | 1 | 2 = vestingType === 'milestone' ? 2 : vestingType === 'cliff' ? 0 : 1;

  const preview = useMemo(() => {
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0 || !decimals) return null;
    const startTs = Math.floor(Date.now() / 1000);
    const cliffTs = cliffSeconds > 0 ? startTs + cliffSeconds : 0;
    const endTs   = startTs + durationSec;
    const linearWindow = durationSec - cliffSeconds;
    const dailyRate = linearWindow > 0 ? amt / (linearWindow / ONE_DAY) : 0;
    return { startTs, cliffTs, endTs, dailyRate, totalDays: durationSec / ONE_DAY };
  }, [amountInput, decimals, cliffSeconds, durationSec]);

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
      try {
        const idxKey = `bb_streams_${publicKey.toBase58()}`;
        const stored = JSON.parse(localStorage.getItem(idxKey) ?? '[]') as string[];
        const next = Array.from(new Set([streamId.toString(), ...stored]));
        localStorage.setItem(idxKey, JSON.stringify(next));
      } catch { /* localStorage off — non-fatal */ }
      setStreamId(BigInt(Math.floor(Date.now() / 1000)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Create failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }, [publicKey, preview, decimals, amountInput, recipientInput, mintInput, streamId, sendTransaction, connection, requiredTier]);

  const updateMilestonePct = (idx: number, value: number) => {
    setMilestones(ms => ms.map((m, i) => i === idx ? { ...m, pct: value } : m));
  };
  const updateMilestoneLabel = (idx: number, value: string) => {
    setMilestones(ms => ms.map((m, i) => i === idx ? { ...m, label: value } : m));
  };

  const activeMilestones = milestones.slice(0, numMilestones);
  const totalPct = activeMilestones.reduce((a, m) => a + m.pct, 0);

  // Step validation
  const step1Valid = decimals !== null && validRecipient && parseFloat(amountInput) > 0;
  const step2Valid = true; // always has defaults
  const step3Valid = vestingType !== 'milestone' || totalPct === 100;

  const goToStep = (target: 1 | 2 | 3 | 4) => {
    if (target === 3 && vestingType !== 'milestone') {
      // skip verify step
      setStep(4);
      return;
    }
    setStep(target);
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.bg0, color: '#f0ecff', fontFamily: DS.sora }}>
      <Navbar />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 100px' }}>

        {/* Back link */}
        <Link href="/distribute" style={{ color: DS.muted, fontSize: 12, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          ← Back to distribute
        </Link>

        {/* Header */}
        <h1 style={{ fontFamily: DS.cinzel, fontSize: 32, fontWeight: 800, margin: '0 0 8px', color: '#f0ecff' }}>
          Create New Stream
        </h1>
        <p style={{ color: DS.muted, fontSize: 14, marginBottom: 36 }}>
          Lock tokens into a PDA vault with programmable vesting and optional verification.
        </p>

        {/* Wallet connect banner */}
        {!connected && (
          <div style={{
            padding: 18, borderRadius: 12, marginBottom: 28,
            background: `${DS.accent}10`, border: `1px solid ${DS.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 14 }}>Connect a Solana wallet to lock tokens.</span>
            <button type="button" onClick={() => setVisible(true)} style={{
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: `linear-gradient(135deg,${DS.accent},${DS.accentDk})`,
              color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            }}>
              CONNECT WALLET
            </button>
          </div>
        )}

        {/* ─── Step indicator ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 40 }}>
          {(['Recipient & Token', 'Vesting Schedule', 'Verification', 'Review & Deploy'] as const).map((label, i) => {
            const s = (i + 1) as 1 | 2 | 3 | 4;
            const isActive = step === s;
            const isDone   = step > s;
            const isSkipped = s === 3 && vestingType !== 'milestone';
            return (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: '100%', height: 3, borderRadius: 99,
                  background: isDone || isActive ? DS.accent : DS.border,
                  opacity: isSkipped ? 0.3 : 1,
                  marginBottom: 6,
                }} />
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isActive ? DS.accent : isDone ? DS.green : DS.border}`,
                  background: isActive ? `${DS.accent}20` : isDone ? `${DS.green}20` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: isActive ? DS.accent : isDone ? DS.green : DS.muted,
                  opacity: isSkipped ? 0.35 : 1,
                }}>
                  {isDone ? '✓' : s}
                </div>
                <div style={{
                  fontSize: 9, color: isActive ? DS.accent : DS.muted,
                  fontWeight: isActive ? 700 : 400, textAlign: 'center',
                  letterSpacing: '.03em', opacity: isSkipped ? 0.35 : 1,
                }}>{label}</div>
              </div>
            );
          })}
        </div>

        {/* ─── Step 1: Recipient & Token ───────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <StepCard title="Recipient & Token" subtitle="Define who receives the stream and which token">

              <FieldLabel>Token mint</FieldLabel>
              <input
                type="text" placeholder="SPL mint address"
                value={mintInput} onChange={e => setMintInput(e.target.value)} onBlur={onMintBlur}
                style={inputStyle}
              />
              <small style={{ color: DS.muted, fontSize: 11 }}>
                {mintLoading ? 'Reading decimals…' : decimals !== null ? `Decimals: ${decimals}` : 'Paste any SPL token mint address'}
              </small>

              <div style={{ marginTop: 18 }} />
              <FieldLabel>Recipient wallet</FieldLabel>
              <input
                type="text" placeholder="Solana wallet address"
                value={recipientInput} onChange={e => setRecipient(e.target.value)}
                style={inputStyle}
              />
              <small style={{ color: validRecipient || !recipientInput ? DS.muted : DS.red, fontSize: 11 }}>
                {recipientInput && !validRecipient ? 'Not a valid Solana address' : 'Tokens will unlock for this address.'}
              </small>

              <div style={{ marginTop: 18 }} />
              <FieldLabel>Total amount</FieldLabel>
              <input
                type="number" min="0" step="any" placeholder="1000000"
                value={amountInput} onChange={e => setAmountInput(e.target.value)}
                style={inputStyle}
              />
            </StepCard>

            <NavButtons
              onNext={() => goToStep(2)}
              nextDisabled={!step1Valid}
              nextLabel="Vesting Schedule →"
            />
          </div>
        )}

        {/* ─── Step 2: Vesting Schedule ────────────────────────────────────────── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <StepCard title="Vesting Schedule" subtitle="Select the unlock model and timing">

              <FieldLabel>Vesting type</FieldLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
                {VESTING_OPTIONS.map(v => (
                  <button
                    key={v.type} type="button"
                    onClick={() => setVestingType(v.type)}
                    style={{
                      padding: '18px 14px', borderRadius: 14, cursor: 'pointer',
                      border: `2px solid ${vestingType === v.type ? v.color : DS.border}`,
                      background: vestingType === v.type ? `${v.color}12` : DS.card,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ fontSize: 24, color: v.color }}>{v.icon}</div>
                    <div style={{ fontFamily: DS.cinzel, fontSize: 13, fontWeight: 700, color: '#f0ecff' }}>{v.title}</div>
                    <div style={{ fontSize: 10, color: DS.muted, textAlign: 'center', lineHeight: 1.4 }}>{v.desc}</div>
                  </button>
                ))}
              </div>

              <FieldLabel>Cliff duration</FieldLabel>
              <div style={chipsRow}>
                {CLIFF_PRESETS.map(p => (
                  <button type="button" key={p.label} onClick={() => setCliffSeconds(p.seconds)} style={chipStyle(cliffSeconds === p.seconds)}>
                    {p.label}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 20 }} />
              <FieldLabel>Total duration</FieldLabel>
              <div style={chipsRow}>
                {DURATION_PRESETS.map(p => (
                  <button type="button" key={p.label} onClick={() => setDurationSec(p.seconds)} style={chipStyle(durationSec === p.seconds)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </StepCard>

            <NavButtons
              onBack={() => setStep(1)}
              onNext={() => goToStep(3)}
              nextLabel={vestingType === 'milestone' ? 'Verification Layer →' : 'Review & Deploy →'}
            />
          </div>
        )}

        {/* ─── Step 3: Verification Layer (milestone only) ─────────────────────── */}
        {step === 3 && vestingType === 'milestone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <StepCard title="Verification Layer" subtitle="How will milestones be confirmed on-chain?">

              <FieldLabel>Choose verification method</FieldLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginBottom: 28 }}>
                {VERIFY_OPTIONS.map(v => (
                  <button
                    key={v.method} type="button"
                    onClick={() => setVerifyMethod(v.method)}
                    style={{
                      padding: '18px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      border: `2px solid ${verifyMethod === v.method ? v.color : DS.border}`,
                      background: verifyMethod === v.method ? `${v.color}10` : DS.card,
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18, color: v.color }}>{v.icon}</span>
                      <span style={{ fontFamily: DS.cinzel, fontSize: 14, fontWeight: 700, color: '#f0ecff' }}>{v.title}</span>
                      <span style={{
                        marginLeft: 'auto', padding: '2px 7px', borderRadius: 99, fontSize: 8,
                        fontWeight: 700, letterSpacing: '.8px', color: v.color,
                        border: `1px solid ${v.color}44`, background: `${v.color}10`,
                      }}>{v.badge}</span>
                    </div>
                    <div style={{ fontSize: 11, color: DS.muted, lineHeight: 1.55 }}>{v.desc}</div>
                  </button>
                ))}
              </div>

              <FieldLabel>Number of milestones</FieldLabel>
              <div style={{ ...chipsRow, marginBottom: 24 }}>
                {[1, 2, 3, 4].map(n => (
                  <button type="button" key={n} onClick={() => setNumMilestones(n)} style={chipStyle(numMilestones === n)}>
                    {n}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeMilestones.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="text" value={m.label}
                      onChange={e => updateMilestoneLabel(i, e.target.value)}
                      placeholder={`Milestone ${i + 1} name`}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="number" min={0} max={100} value={m.pct}
                        onChange={e => updateMilestonePct(i, Number(e.target.value))}
                        style={{ ...inputStyle, width: 72, textAlign: 'center' }}
                      />
                      <span style={{ color: DS.muted, fontSize: 12 }}>%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: totalPct === 100 ? DS.green : DS.red }}>
                Total: {totalPct}% {totalPct === 100 ? '✓' : `(must equal 100%)`}
              </div>
            </StepCard>

            <NavButtons
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              nextDisabled={totalPct !== 100}
              nextLabel="Review & Deploy →"
            />
          </div>
        )}

        {/* ─── Step 4: Review & Deploy ─────────────────────────────────────────── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <StepCard title="Review & Deploy" subtitle="Confirm all settings before deploying to Solana">

              {/* Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 14, overflow: 'hidden', border: `1px solid ${DS.border}` }}>
                {[
                  { label: 'Token mint',     value: mintInput || '—',                icon: '◈' },
                  { label: 'Recipient',      value: recipientInput || '—',           icon: '◎' },
                  { label: 'Amount',         value: `${amountInput || '—'} tokens`,  icon: '◉' },
                  { label: 'Vesting type',   value: vestingType.charAt(0).toUpperCase() + vestingType.slice(1), icon: '∿' },
                  { label: 'Cliff',          value: CLIFF_PRESETS.find(c => c.seconds === cliffSeconds)?.label ?? '—', icon: '⌐' },
                  { label: 'Duration',       value: DURATION_PRESETS.find(d => d.seconds === durationSec)?.label ?? '—', icon: '⬡' },
                  ...(vestingType === 'milestone' ? [
                    { label: 'Verification', value: verifyMethod.charAt(0).toUpperCase() + verifyMethod.slice(1), icon: '✦' },
                    { label: 'Milestones',   value: `${numMilestones} (${activeMilestones.map(m => `${m.label} ${m.pct}%`).join(', ')})`, icon: '◇' },
                  ] : []),
                ].map((row, i, a) => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', gap: 12,
                    padding: '12px 16px',
                    background: i % 2 === 0 ? DS.card : 'transparent',
                    borderBottom: i < a.length - 1 ? `1px solid ${DS.border}` : 'none',
                  }}>
                    <div style={{ fontSize: 12, color: DS.muted, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>{row.icon}</span>{row.label}
                    </div>
                    <div style={{ fontFamily: DS.mono, fontSize: 11, color: '#f0ecff', wordBreak: 'break-all', textAlign: 'right', maxWidth: 320 }}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live preview */}
              {preview && (
                <div style={{
                  padding: 16, borderRadius: 12, marginTop: 8,
                  background: `${DS.blue}08`, border: `1px solid ${DS.blue}25`,
                }}>
                  <div style={{ fontSize: 10, letterSpacing: '1.5px', color: DS.blue, marginBottom: 8, fontWeight: 700 }}>LIVE PREVIEW</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: DS.muted }}>
                    Locks <strong style={{ color: '#f0ecff' }}>{parseFloat(amountInput).toLocaleString()}</strong> tokens
                    starting <strong style={{ color: '#f0ecff' }}>{new Date(preview.startTs * 1000).toLocaleDateString()}</strong>.<br/>
                    {cliffSeconds > 0
                      ? <>Cliff until <strong style={{ color: '#f0ecff' }}>{new Date(preview.cliffTs * 1000).toLocaleDateString()}</strong>, then </>
                      : 'From start, '}
                    <strong style={{ color: '#f0ecff' }}>{preview.dailyRate.toFixed(2)}</strong> tokens/day.
                    Fully vested <strong style={{ color: '#f0ecff' }}>{new Date(preview.endTs * 1000).toLocaleDateString()}</strong>.
                  </div>
                </div>
              )}

              {/* Deploy button */}
              <button
                type="button" onClick={handleCreate}
                disabled={!canSubmit}
                style={{
                  width: '100%', padding: '16px 22px', borderRadius: 14, border: 'none', marginTop: 8,
                  background: canSubmit
                    ? `linear-gradient(135deg,${DS.accent},${DS.accentDk})`
                    : 'rgba(255,255,255,.08)',
                  color: canSubmit ? '#fff' : DS.muted,
                  fontWeight: 900, fontSize: 15, cursor: canSubmit ? 'pointer' : 'not-allowed',
                  letterSpacing: '.03em', fontFamily: DS.sora,
                  boxShadow: canSubmit ? `0 0 32px ${DS.accent}44` : 'none',
                  transition: 'all .2s',
                }}
              >
                {busy ? 'DEPLOYING TO SOLANA…' : 'DEPLOY STREAM →'}
              </button>

              {sig && (
                <div style={{ padding: 14, borderRadius: 12, background: `${DS.green}10`, border: `1px solid ${DS.green}44` }}>
                  <div style={{ fontSize: 12, color: DS.green, fontWeight: 800, marginBottom: 6 }}>STREAM DEPLOYED</div>
                  <a href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: DS.green, wordBreak: 'break-all', fontFamily: DS.mono }}>
                    {sig.slice(0, 16)}…{sig.slice(-16)} ↗
                  </a>
                </div>
              )}
              {error && (
                <div style={{ padding: 14, borderRadius: 12, background: `${DS.red}10`, border: `1px solid ${DS.red}44`, fontSize: 12, color: DS.red }}>
                  {error}
                </div>
              )}
            </StepCard>

            <NavButtons onBack={() => setStep(vestingType === 'milestone' ? 3 : 2)} />
          </div>
        )}

      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.025)', border: `1px solid rgba(167,139,255,.13)`,
      borderRadius: 20, padding: '28px 28px 24px',
    }}>
      <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#f0ecff' }}>{title}</h2>
      <p style={{ fontSize: 12, color: 'rgba(232,225,248,.38)', margin: '0 0 24px' }}>{subtitle}</p>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: '1.4px', color: 'rgba(232,225,248,.38)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

function NavButtons({
  onBack, onNext, nextDisabled, nextLabel,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
      {onBack ? (
        <button type="button" onClick={onBack} style={{
          padding: '12px 22px', borderRadius: 12, border: `1px solid rgba(167,139,255,.13)`,
          background: 'transparent', color: 'rgba(232,225,248,.38)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'Sora', system-ui, sans-serif",
        }}>
          ← Back
        </button>
      ) : <div />}
      {onNext && (
        <button type="button" onClick={onNext} disabled={nextDisabled} style={{
          padding: '12px 28px', borderRadius: 12, border: 'none',
          background: nextDisabled
            ? 'rgba(255,255,255,.06)'
            : `linear-gradient(135deg,#a78bff,#5e35d4)`,
          color: nextDisabled ? 'rgba(232,225,248,.38)' : '#fff',
          fontSize: 13, fontWeight: 700, cursor: nextDisabled ? 'not-allowed' : 'pointer',
          letterSpacing: '.02em', fontFamily: "'Sora', system-ui, sans-serif",
          boxShadow: nextDisabled ? 'none' : '0 0 20px rgba(167,139,255,.3)',
          transition: 'all .15s',
        }}>
          {nextLabel ?? 'Next →'}
        </button>
      )}
    </div>
  );
}

/* Shared inline styles */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
  background: 'rgba(255,255,255,.03)', border: '1px solid rgba(167,139,255,.13)',
  color: '#f0ecff', fontSize: 14, fontFamily: "'Sora', system-ui, sans-serif", outline: 'none',
};
const chipsRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };
function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
    border: active ? '1px solid #a78bff' : '1px solid rgba(167,139,255,.13)',
    background: active ? 'rgba(167,139,255,.18)' : 'transparent',
    color: active ? '#a78bff' : 'rgba(232,225,248,.38)',
    fontSize: 12, fontWeight: 700, fontFamily: "'Sora', system-ui, sans-serif",
    transition: 'all .12s',
  };
}
