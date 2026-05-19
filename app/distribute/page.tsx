'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';

/**
 * Founder/B2B landing for the Token Distribution Protocol.
 * Public route, no wallet required to view. Links to /distribute/new for
 * the actual create-stream flow (wallet-gated inside that page).
 */
export default function DistributeLanding() {
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
            FOR BUILDERS · TOKEN DISTRIBUTION PROTOCOL
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 7vw, 64px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1.5px', margin: 0 }}>
            Distribute Tokens via<br/>
            <span style={{ background: 'var(--ds-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Verifiable Competition.
            </span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--ds-text-dim)', lineHeight: 1.6, maxWidth: 600, margin: '24px auto 0' }}>
            Lock tokens with cliff + linear vesting. Let on-chain milestones
            decide who claims and when. Bots filtered. Recipients engaged.
            Zero spreadsheets.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
            <Link href="/distribute/new" style={{
              padding: '14px 32px', borderRadius: 12, background: 'var(--ds-grad)',
              color: '#0a0a14', fontWeight: 900, fontSize: 16, textDecoration: 'none',
              boxShadow: '0 0 28px rgba(167,139,250,.45)',
            }}>
              CREATE NEW STREAM
            </Link>
            <Link href="/distribute/streams" style={{
              padding: '14px 28px', borderRadius: 12, background: 'transparent',
              border: '1px solid var(--ds-border)', color: 'var(--ds-text)',
              fontWeight: 700, fontSize: 16, textDecoration: 'none',
            }}>
              MY STREAMS
            </Link>
          </div>
        </section>

        {/* Three-step founder flow */}
        <section style={{ marginBottom: 80 }}>
          <p style={{ fontSize: 11, letterSpacing: '2px', color: 'var(--ds-accent)', textAlign: 'center', marginBottom: 10 }}>
            HOW IT WORKS · FOR FOUNDERS
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, textAlign: 'center', marginBottom: 40 }}>
            Three steps to launch a distribution
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              {
                n: '01', t: 'Configure schedule',
                d: 'Pick cliff (1w / 1mo / 3mo / 6mo / 1y / custom) and total vesting duration. Live preview shows the daily unlock rate.',
              },
              {
                n: '02', t: 'Lock tokens on-chain',
                d: 'create_stream atomically transfers tokens from your wallet into a PDA-owned vault. The vault is autonomous — only the program can release funds.',
              },
              {
                n: '03', t: 'Recipients claim through play',
                d: 'Beneficiaries see vested progress on /claim/[stream]. Competition gates the claim — bots filter naturally. You stop chasing spreadsheets.',
              },
            ].map((s) => (
              <div key={s.n} style={{
                padding: 24, borderRadius: 16,
                background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  fontSize: 58, fontWeight: 900, color: 'var(--ds-accent)', opacity: 0.12,
                  position: 'absolute', top: 4, right: 14, lineHeight: 1, userSelect: 'none',
                }}>{s.n}</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, position: 'relative' }}>{s.t}</div>
                <div style={{ fontSize: 13, color: 'var(--ds-text-dim)', lineHeight: 1.6, position: 'relative' }}>{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* On-chain spec summary */}
        <section style={{
          padding: 32, borderRadius: 18, background: 'var(--ds-surface)',
          border: '1px solid var(--ds-border)', marginBottom: 40,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--ds-accent)', marginBottom: 8 }}>
            PROGRAM SPEC · DEVNET
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 18px' }}>What runs on-chain</h3>
          <ul style={{ paddingLeft: 18, lineHeight: 1.8, color: 'var(--ds-text-dim)', fontSize: 14, margin: 0 }}>
            <li><code style={{ color: 'var(--ds-text)' }}>create_stream(stream_id, amount, start_ts, cliff_ts, end_ts)</code> — lock + record</li>
            <li><code style={{ color: 'var(--ds-text)' }}>withdraw()</code> — beneficiary pulls vested portion (24h cooldown)</li>
            <li><code style={{ color: 'var(--ds-text)' }}>cancel()</code> — creator reclaims unvested, beneficiary gets vested-but-unclaimed</li>
            <li>Velocity-Gated Proof Validation rejects bot-like claim patterns</li>
          </ul>
          <p style={{ marginTop: 18, fontSize: 12, color: 'var(--ds-text-dim)', fontFamily: 'monospace' }}>
            Program ID: DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf
          </p>
        </section>
      </main>
    </div>
  );
}
