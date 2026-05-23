'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// ─── design tokens (matches TDP V2 palette) ───────────────────────────────────
const C = {
  accent:  '#a78bfa',
  accentDk:'#5e35d4',
  gold:    '#f5c66a',
  green:   '#5fd07a',
  red:     '#ff3b6b',
  blue:    '#7ad7ff',
  ember:   '#ff7a3a',
  muted:   'var(--ds-text-dim)',
  mono:    "'JetBrains Mono', monospace",
  serif:   "'Space Grotesk', sans-serif",
};

// ─── sub-components ───────────────────────────────────────────────────────────
function FormField({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ds-text)' }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
        {hint && <span style={{ fontWeight: 400, color: 'var(--ds-text-dim)', fontSize: 11 }}> — {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', prefix }: {
  value: string; onChange: (v: string) => void; placeholder: string; type?: string; prefix?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {prefix && <span style={{ position: 'absolute', left: 12, fontSize: 13, color: C.muted, pointerEvents: 'none' }}>{prefix}</span>}
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} type={type}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: prefix ? '11px 14px 11px 36px' : '11px 14px',
          background: 'var(--ds-surface)', border: `1px solid ${focused ? C.accent : 'var(--ds-border)'}`,
          borderRadius: 11, color: 'var(--ds-text)', fontSize: 13, outline: 'none', fontFamily: C.mono,
          transition: 'border-color .15s',
        }}
      />
    </div>
  );
}

function RangeSlider({ label, value, onChange, min, max, step = 1, unit = '', color = C.accent }: {
  label: string; value: number; onChange: (n: number) => void;
  min: number; max: number; step?: number; unit?: string; color?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: C.muted, fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: C.mono, color, fontWeight: 700 }}>{value.toLocaleString()}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, height: 4, cursor: 'pointer' }}
      />
    </div>
  );
}

function SelectInput({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: '100%', padding: '11px 14px',
      background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
      borderRadius: 11, color: 'var(--ds-text)', fontSize: 13, outline: 'none', fontFamily: C.mono,
      appearance: 'none', cursor: 'pointer',
    }}>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

// ─── main form ────────────────────────────────────────────────────────────────
export default function CreateStreamPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [form, setForm] = useState({
    beneficiary: '',
    token:       'BBT',
    amount:      '',
    startDate:   '',
    cliffDays:   90,
    vestDays:    365,
    streamType:  'linear',
    milestoneCount: 0,
    m0pct: 25, m1pct: 25, m2pct: 25, m3pct: 25,
  });

  const upd = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const amount     = Number(form.amount) || 0;
  const dailyRate  = form.vestDays > 0 ? (amount / form.vestDays).toFixed(2) : '0';
  const ratePerSec = form.vestDays > 0 ? (amount / (form.vestDays * 86400)).toFixed(6) : '0';
  const milestoneSum = form.milestoneCount > 0
    ? [form.m0pct, form.m1pct, form.m2pct, form.m3pct].slice(0, form.milestoneCount).reduce((a, b) => a + b, 0)
    : 0;

  const STEPS = [
    { label: 'Recipient', icon: '👤' },
    { label: 'Schedule',  icon: '📅' },
    { label: 'Milestones',icon: '🎯' },
    { label: 'Review',    icon: '✅' },
  ];

  if (submitted) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--ds-bg)', color: 'var(--ds-text)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 20 }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: `${C.green}18`,
              border: `2px solid ${C.green}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28,
            }}>✓</div>
            <h2 style={{ fontFamily: C.serif, fontSize: 28, fontWeight: 800, color: C.gold, marginBottom: 10 }}>Stream Created!</h2>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>
              Tokens locked into PDA vault. Stream is active on Solana devnet.
            </p>
            <div style={{ padding: '12px 16px', background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 9.5, color: C.muted, marginBottom: 4 }}>Stream ID</div>
              <div style={{ fontFamily: C.mono, fontSize: 18, fontWeight: 700, color: C.accent }}>
                stm-{Math.random().toString(36).slice(2, 8).toUpperCase()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link href="/streams" style={{
                padding: '10px 20px', background: 'linear-gradient(135deg,#a78bfa,#5e35d4)',
                color: '#fff', borderRadius: 11, textDecoration: 'none', fontWeight: 700, fontSize: 13,
              }}>View Streams →</Link>
              <button onClick={() => { setSubmitted(false); setStep(0); }} style={{
                padding: '10px 20px', background: 'var(--ds-surface)',
                color: 'var(--ds-text-dim)', borderRadius: 11, border: '1px solid var(--ds-border)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>Create Another</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ds-bg)', color: 'var(--ds-text)' }}>
      <Navbar />

      {/* Header */}
      <div style={{ padding: '80px 24px 32px', background: 'var(--ds-header)', borderBottom: '1px solid var(--ds-border)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <Link href="/streams" style={{ fontSize: 12, color: C.muted, textDecoration: 'none', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            ← Back to Streams
          </Link>
          <h1 style={{ fontFamily: C.serif, fontSize: 'clamp(24px,5vw,38px)', fontWeight: 900, marginBottom: 8, marginTop: 10 }}>
            Create Token Stream
          </h1>
          <p style={{ fontSize: 13, color: C.muted }}>
            Lock tokens into a PDA vault with cliff, linear, or milestone-based unlock conditions.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 100px' }}>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: i <= step ? 'pointer' : 'default' }}
                onClick={() => i <= step && setStep(i)}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, flexShrink: 0, transition: 'all .25s',
                  background: step === i ? C.accent : i < step ? C.green : 'var(--ds-surface)',
                  border: `1.5px solid ${step === i ? C.accent : i < step ? C.green : 'var(--ds-border)'}`,
                  boxShadow: step === i ? `0 0 14px ${C.accent}66` : 'none',
                  color: (step === i || i < step) ? '#fff' : 'var(--ds-text-dim)',
                }}>
                  {i < step ? '✓' : s.icon}
                </div>
                <span style={{ fontSize: 12, color: step === i ? 'var(--ds-text)' : i < step ? C.green : 'var(--ds-text-dim)', fontWeight: step === i ? 600 : 400, whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, margin: '0 10px', background: i < step ? C.green : 'var(--ds-border)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step panels */}
        <div style={{
          background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
          borderRadius: 18, padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 18,
        }}>

          {/* Step 0: Recipient */}
          {step === 0 && <>
            <div style={{ fontFamily: C.serif, fontSize: 15, fontWeight: 700, color: 'var(--ds-text)' }}>Recipient & Token</div>
            <FormField label="Beneficiary Address" required hint="Solana wallet — receives streamed tokens">
              <TextInput value={form.beneficiary} onChange={v => upd('beneficiary', v)} placeholder="e.g. 3f7aX59…NxFzr" />
            </FormField>
            <FormField label="Token Mint" required>
              <SelectInput value={form.token} onChange={v => upd('token', v)}
                options={[{ v: 'BBT', l: 'BBT — BlockBite Token' }, { v: 'USDC', l: 'USDC' }, { v: 'SOL', l: 'SOL (wrapped)' }]} />
            </FormField>
            <FormField label="Total Amount" required hint="Tokens locked into vault">
              <TextInput value={form.amount} onChange={v => upd('amount', v)} placeholder="500000" type="number" prefix="◎" />
            </FormField>
            {amount > 0 && (
              <div style={{ padding: '12px 14px', background: `${C.green}0a`, border: `1px solid ${C.green}33`, borderRadius: 10, fontFamily: C.mono, fontSize: 11.5, color: C.muted, lineHeight: 1.8 }}>
                <span style={{ color: C.gold }}>{amount.toLocaleString()} {form.token}</span>
                {' · cliff '}<span style={{ color: C.ember }}>{form.cliffDays}d</span>
                {' · vest '}<span style={{ color: C.accent }}>{form.vestDays}d</span>
                {' · '}<span style={{ color: C.green }}>{dailyRate} T/day</span>
              </div>
            )}
          </>}

          {/* Step 1: Schedule */}
          {step === 1 && <>
            <div style={{ fontFamily: C.serif, fontSize: 15, fontWeight: 700, color: 'var(--ds-text)' }}>Vesting Schedule</div>
            <FormField label="Stream Type" required>
              <SelectInput value={form.streamType} onChange={v => upd('streamType', v)}
                options={[
                  { v: 'linear',    l: 'Linear — tokens unlock continuously' },
                  { v: 'cliff',     l: 'Cliff — all at once after date' },
                  { v: 'milestone', l: 'Milestone — unlock by achievement' },
                  { v: 'hybrid',    l: 'Hybrid — cliff + milestone + linear' },
                ]} />
            </FormField>
            <FormField label="Stream Start Date">
              <TextInput value={form.startDate} onChange={v => upd('startDate', v)} placeholder="2025-06-01" type="date" />
            </FormField>
            <RangeSlider label="Cliff Period" value={form.cliffDays} onChange={v => upd('cliffDays', v)} min={0} max={730} unit=" days" color={C.ember} />
            <RangeSlider label="Vesting Duration" value={form.vestDays} onChange={v => upd('vestDays', v)} min={30} max={1460} unit=" days" color={C.accent} />
            {amount > 0 && (
              <div style={{ padding: '14px 16px', background: `${C.accent}08`, border: `1px solid ${C.accent}22`, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { l: 'Cliff unlock date', v: `Day ${form.cliffDays}` },
                  { l: 'Full vest complete', v: `Day ${form.cliffDays + form.vestDays}` },
                  { l: 'Daily unlock',      v: `${dailyRate} ${form.token}` },
                  { l: 'Rate / second',     v: `${ratePerSec} T/s` },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid var(--ds-border)', padding: '4px 0' }}>
                    <span style={{ color: 'var(--ds-text-dim)' }}>{r.l}</span>
                    <span style={{ fontFamily: C.mono, color: 'var(--ds-text)' }}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}
          </>}

          {/* Step 2: Milestones */}
          {step === 2 && <>
            <div style={{ fontFamily: C.serif, fontSize: 15, fontWeight: 700, color: 'var(--ds-text)' }}>Milestone Gates</div>
            <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
              Optional. Define up to 4 milestone checkpoints — each unlocks a % of the total allocation when verified on-chain via <code style={{ color: C.blue, fontFamily: C.mono }}>verify_milestone()</code>.
            </p>
            <RangeSlider label="Number of Milestones" value={form.milestoneCount} onChange={v => upd('milestoneCount', v)} min={0} max={4} color={C.blue} />

            {form.milestoneCount > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: form.milestoneCount }, (_, i) => {
                  const pctKeys = ['m0pct', 'm1pct', 'm2pct', 'm3pct'] as const;
                  const key = pctKeys[i];
                  const pctLookup: Record<string, number> = { m0pct: form.m0pct, m1pct: form.m1pct, m2pct: form.m2pct, m3pct: form.m3pct };
                  const val = pctLookup[key];
                  return (
                    <div key={i} style={{ padding: '12px 14px', background: 'var(--ds-surface)', border: `1px solid ${C.blue}33`, borderRadius: 10 }}>
                      <RangeSlider
                        label={`Milestone ${i + 1} allocation`}
                        value={val}
                        onChange={v => upd(key, v)}
                        min={0} max={100} unit="%" color={C.blue}
                      />
                    </div>
                  );
                })}
                <div style={{
                  padding: '8px 12px', borderRadius: 9,
                  background: milestoneSum > 100 ? `${C.red}12` : milestoneSum === 100 ? `${C.green}12` : `${C.gold}12`,
                  border: `1px solid ${milestoneSum > 100 ? C.red : milestoneSum === 100 ? C.green : C.gold}44`,
                  fontSize: 11.5, fontFamily: C.mono,
                  color: milestoneSum > 100 ? C.red : milestoneSum === 100 ? C.green : C.gold,
                }}>
                  Milestone total: {milestoneSum}% {milestoneSum > 100 ? '⚠ exceeds 100%' : milestoneSum === 100 ? '✓ perfect' : `(remaining: ${100 - milestoneSum}% linear)`}
                </div>
              </div>
            )}
            {form.milestoneCount === 0 && (
              <div style={{ padding: '14px 16px', background: 'var(--ds-surface)', borderRadius: 12, border: '1px solid var(--ds-border)', color: 'var(--ds-text-dim)', fontSize: 12.5 }}>
                No milestones — stream vests purely linearly after cliff.
              </div>
            )}
          </>}

          {/* Step 3: Review */}
          {step === 3 && <>
            <div style={{ fontFamily: C.serif, fontSize: 15, fontWeight: 700, color: 'var(--ds-text)' }}>Review & Create</div>
            <div style={{ padding: '16px 18px', background: `${C.accent}08`, border: `1px solid ${C.accent}33`, borderRadius: 13 }}>
              {[
                { l: 'Beneficiary',  v: form.beneficiary || '—' },
                { l: 'Token',        v: form.token },
                { l: 'Amount',       v: `${amount.toLocaleString()} ${form.token}` },
                { l: 'Stream Type',  v: form.streamType },
                { l: 'Cliff',        v: `${form.cliffDays} days` },
                { l: 'Vesting',      v: `${form.vestDays} days` },
                { l: 'Daily Rate',   v: `${dailyRate} ${form.token}/day` },
                { l: 'Rate/sec',     v: `${ratePerSec} T/s` },
                ...(form.milestoneCount > 0 ? [{ l: 'Milestones', v: `${form.milestoneCount} gates (${milestoneSum}% gated)` }] : []),
              ].map((r, i, a) => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < a.length - 1 ? '1px solid var(--ds-border)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--ds-text-dim)' }}>{r.l}</span>
                  <span style={{ fontFamily: C.mono, fontSize: 12, color: 'var(--ds-text)', maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', background: `${C.gold}0a`, border: `1px solid ${C.gold}33`, borderRadius: 9, fontSize: 11.5, color: C.gold }}>
              ⚠ This calls <code style={{ fontFamily: C.mono }}>create_stream()</code> on-chain and locks tokens into a PDA vault. This action is permanent.
            </div>
          </>}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          <button
            onClick={() => step > 0 && setStep(s => s - 1)}
            disabled={step === 0}
            style={{
              padding: '11px 22px', borderRadius: 11, border: '1px solid var(--ds-border)',
              background: 'var(--ds-surface)', color: step === 0 ? 'var(--ds-border)' : 'var(--ds-text-dim)',
              fontWeight: 600, fontSize: 13, cursor: step === 0 ? 'not-allowed' : 'pointer',
            }}
          >← Back</button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} style={{
              padding: '11px 28px', borderRadius: 11, border: 'none',
              background: `linear-gradient(135deg,${C.accent},${C.accentDk})`, color: '#fff',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 0 18px ${C.accent}44`,
            }}>Continue →</button>
          ) : (
            <button onClick={() => setSubmitted(true)} style={{
              padding: '11px 28px', borderRadius: 11, border: 'none',
              background: `linear-gradient(135deg,${C.gold}cc,#a36a17cc)`, color: '#0b0a14',
              fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: `0 0 16px ${C.gold}44`,
            }}>⚡ Create Stream</button>
          )}
        </div>
      </div>
    </main>
  );
}
