'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

/**
 * Public marketing page for B2B partnerships.
 *
 * Lead-gen funnel: explain the value prop to founders + ecosystem partners,
 * collect interest via a simple POST → /api/partnership-lead (which logs to
 * Supabase + Discord). Once whitelisted, partners get /distribute/* access.
 *
 * Distinct from /distribute (which is the actual product surface). This page
 * targets people who aren't yet sure whether they should integrate.
 */
export default function PartnershipPage() {
  const [email, setEmail]     = useState('');
  const [project, setProject] = useState('');
  const [notes, setNotes]     = useState('');
  const [sent, setSent]       = useState(false);
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !project) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/partnership-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, project, notes }),
      });
      if (res.ok || res.status === 409) {
        setSent(true);
      } else {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--ds-bg)', color: 'var(--ds-text)',
      fontFamily: "'Montserrat', 'Space Grotesk', system-ui, sans-serif",
    }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 24px 80px' }}>

        {/* Hero */}
        <section style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{
            display: 'inline-flex', gap: 8, padding: '8px 16px', borderRadius: 999,
            border: '1px solid var(--ds-accent)', background: 'rgba(167,139,250,.12)',
            fontSize: 12, fontWeight: 800, color: 'var(--ds-accent)', letterSpacing: '1.5px',
            marginBottom: 24,
          }}>
            PARTNERSHIPS · BUILDERS WANTED
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 6vw, 56px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1px', margin: 0 }}>
            Reward Real Supporters,<br/>
            <span style={{ background: 'var(--ds-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Not Sybil Farms.
            </span>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ds-text-dim)', lineHeight: 1.6, maxWidth: 620, margin: '24px auto 0' }}>
            Plug BlockBite into your ecosystem to distribute tokens through verifiable
            competition. We filter bots with skill, not captchas. You ship rewards,
            we ship engagement.
          </p>
        </section>

        {/* Use cases */}
        <section style={{ marginBottom: 60 }}>
          <p style={{ fontSize: 11, letterSpacing: '2px', color: 'var(--ds-accent)', textAlign: 'center', marginBottom: 10 }}>
            USE CASES
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, textAlign: 'center', marginBottom: 36 }}>
            What you can ship through BlockBite
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { t: 'Ecosystem partner rewards',
                d: 'Reward LP providers, integrators, and ecosystem partners with tokens that vest as they hit on-chain milestones. No more manual payouts.' },
              { t: 'Hackathon & bounty prizes',
                d: 'Lock prize pools transparently before judging. Recipients claim through the same competition layer, fully on-chain auditable.' },
              { t: 'Community vesting',
                d: 'Distribute team / contributor / advisor allocations with cliff + linear. Recipients see vested progress live; founders can cancel if a contributor leaves.' },
              { t: 'Token launch retention',
                d: 'Replace one-shot airdrops with milestone-based unlocks. Active users compound, bots filter out, holders engage.' },
            ].map((c) => (
              <div key={c.t} style={{
                padding: 22, borderRadius: 14,
                background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{c.t}</div>
                <div style={{ fontSize: 13, color: 'var(--ds-text-dim)', lineHeight: 1.6 }}>{c.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: 60 }}>
          <p style={{ fontSize: 11, letterSpacing: '2px', color: 'var(--ds-accent)', textAlign: 'center', marginBottom: 10 }}>
            HOW PARTNERSHIPS WORK
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, textAlign: 'center', marginBottom: 36 }}>
            From signal to ship in days, not months
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {[
              { n: '01', t: 'Apply', d: 'Drop your project info below. We review same-week.' },
              { n: '02', t: 'Whitelist', d: 'On approval, your wallet gets /distribute/* access.' },
              { n: '03', t: 'Configure', d: 'Set cliff, duration, recipient set, optional quest gating.' },
              { n: '04', t: 'Ship', d: 'create_stream signs from your wallet. Live on devnet today, mainnet on launch.' },
            ].map((s) => (
              <div key={s.n} style={{
                padding: 18, borderRadius: 12,
                background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  fontSize: 44, fontWeight: 900, color: 'var(--ds-accent)', opacity: 0.12,
                  position: 'absolute', top: 2, right: 10, lineHeight: 1, userSelect: 'none',
                }}>{s.n}</div>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, position: 'relative' }}>{s.t}</div>
                <div style={{ fontSize: 12, color: 'var(--ds-text-dim)', lineHeight: 1.5, position: 'relative' }}>{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Lead form */}
        <section style={{
          maxWidth: 560, margin: '0 auto',
          padding: 28, borderRadius: 18,
          background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 0, marginBottom: 6 }}>Apply for Partnership</h2>
          <p style={{ color: 'var(--ds-text-dim)', fontSize: 13, marginBottom: 22 }}>
            We respond within 3 business days. No spam — just a check whether
            our protocol fits your distribution.
          </p>

          {sent ? (
            <div style={{
              padding: 18, borderRadius: 12,
              background: 'rgba(94,234,212,0.08)', border: '1px solid rgba(94,234,212,0.5)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#5eead4', marginBottom: 6 }}>
                Application received.
              </div>
              <p style={{ fontSize: 13, color: 'var(--ds-text-dim)', margin: 0, lineHeight: 1.6 }}>
                We'll reach out at <strong>{email}</strong> within 3 business days.
                In the meantime, you can preview the protocol surface at
                {' '}<Link href="/distribute" style={{ color: 'var(--ds-accent)' }}>/distribute</Link>.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Email</label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@project.xyz"
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Project / Org</label>
                <input
                  type="text" required value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="What are you building?"
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Notes (optional)</label>
                <textarea
                  value={notes} rows={3}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Token, intended distribution size, timeline…"
                  style={{ ...inp, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              {err && (
                <div style={{ fontSize: 12, color: '#f472b6' }}>{err}</div>
              )}
              <button
                type="submit"
                disabled={busy || !email || !project}
                style={{
                  marginTop: 4,
                  padding: '12px 22px', borderRadius: 10, border: 'none',
                  background: (!busy && email && project) ? 'var(--ds-grad)' : 'rgba(255,255,255,0.08)',
                  color: (!busy && email && project) ? '#0a0a14' : 'var(--ds-text-dim)',
                  fontWeight: 900, fontSize: 14,
                  cursor: (!busy && email && project) ? 'pointer' : 'not-allowed',
                  letterSpacing: 0.5,
                }}
              >
                {busy ? 'SUBMITTING…' : 'SUBMIT APPLICATION'}
              </button>
            </form>
          )}
        </section>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ds-text-dim)', marginTop: 30 }}>
          Already approved? Head to{' '}
          <Link href="/distribute" style={{ color: 'var(--ds-accent)' }}>/distribute</Link>
          {' '}or DM us on{' '}
          <a href="https://x.com/blockbite_gg" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ds-accent)' }}>X</a>.
        </p>
      </main>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, letterSpacing: 1.5, color: 'var(--ds-text-dim)',
  fontWeight: 700, marginBottom: 6,
};
const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ds-border)',
  color: 'var(--ds-text)', fontSize: 14, outline: 'none',
};
