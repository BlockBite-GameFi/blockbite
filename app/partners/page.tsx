'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

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

const TRUSTED_BY = [
  'SolarDAO', 'FrostChain', 'VerdantFi', 'VoidLabs', 'EmberDAO', 'NexusVault',
];

const TIERS = [
  {
    name: 'Basic',
    price: 'Free',
    priceSub: 'No credit card needed',
    color: DS.accent,
    popular: false,
    features: [
      '5 active streams',
      'Linear + Cliff vesting',
      'Public dashboard',
      'Devnet + Mainnet',
    ],
  },
  {
    name: 'Growth',
    price: 'TBD',
    priceSub: 'Pricing not yet confirmed',
    color: DS.gold,
    popular: true,
    features: [
      '50 active streams',
      'All vesting models',
      'Analytics dashboard',
      'Milestone verifier',
      'White-label claim portal',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceSub: 'Contact us for pricing',
    color: DS.blue,
    popular: false,
    features: [
      'Unlimited streams',
      'Oracle integration',
      'Multi-sig governance',
      'SLA 99.9% uptime',
      'Dedicated support',
    ],
  },
];

export default function PartnersPage() {
  return (
    <div style={{ minHeight: '100vh', background: DS.bg0, color: '#f0ecff', fontFamily: DS.sora, overflowX: 'hidden' }}>
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '140px 24px 80px', textAlign: 'center',
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(94,53,212,.22) 0%, transparent 65%),
                     radial-gradient(ellipse 50% 40% at 80% 80%, rgba(167,139,255,.08) 0%, transparent 60%),
                     ${DS.bg0}`,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '7px 16px', borderRadius: 999,
          border: `1px solid ${DS.border}`, background: `${DS.accent}10`,
          fontSize: 11, fontWeight: 700, color: DS.accent,
          letterSpacing: '1.8px', marginBottom: 24,
        }}>
          PARTNERSHIP PROGRAM
        </div>
        <h1 style={{
          fontFamily: DS.cinzel, fontSize: 'clamp(30px,5.5vw,52px)',
          fontWeight: 800, lineHeight: 1.12, margin: '0 0 18px',
          background: `linear-gradient(135deg, #f0ecff 0%, ${DS.accent} 60%, ${DS.blue} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Build on BlockBite TDP
        </h1>
        <p style={{ fontSize: 'clamp(14px,1.8vw,17px)', color: DS.muted, maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.72 }}>
          Programmable token vesting infrastructure for the next generation of Solana protocols.
          Choose the plan that fits your project.
        </p>
        <Link href="/waitlist" style={{
          display: 'inline-block', padding: '14px 36px', borderRadius: 13,
          background: `linear-gradient(135deg,${DS.accent},${DS.accentDk})`,
          color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none',
          boxShadow: `0 0 36px ${DS.accent}40`, letterSpacing: '.02em',
        }}>
          Join the Waitlist →
        </Link>
      </section>

      {/* ─── TRUSTED BY ───────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        borderTop: `1px solid ${DS.border}`, borderBottom: `1px solid ${DS.border}`,
        background: DS.bg1, padding: '36px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 10, letterSpacing: '2.5px', color: DS.muted, fontWeight: 700, marginBottom: 24, textTransform: 'uppercase' }}>
            TRUSTED BY
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', alignItems: 'center',
          }}>
            {TRUSTED_BY.map((name) => (
              <div key={name} style={{
                padding: '10px 22px', borderRadius: 10,
                background: DS.card, border: `1px solid ${DS.border}`,
                fontSize: 13, fontWeight: 700, color: DS.muted,
                letterSpacing: '.04em', fontFamily: DS.mono,
              }}>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING TIERS ────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px 100px' }}>
        <div style={{ maxWidth: 1050, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.accent, fontWeight: 700, marginBottom: 12 }}>
              PLANS & PRICING
            </div>
            <h2 style={{
              fontFamily: DS.cinzel, fontSize: 'clamp(24px,3.5vw,38px)',
              fontWeight: 700, color: '#f0ecff', margin: 0,
            }}>
              Simple, transparent pricing
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {TIERS.map((tier) => (
              <div key={tier.name} style={{
                padding: '32px 28px', borderRadius: 24, position: 'relative',
                background: tier.popular
                  ? `linear-gradient(160deg, ${DS.bg2} 0%, rgba(245,198,106,.04) 100%)`
                  : DS.card,
                border: `${tier.popular ? 2 : 1}px solid ${tier.popular ? tier.color + '55' : DS.border}`,
                boxShadow: tier.popular ? `0 0 48px ${tier.color}10` : 'none',
              }}>
                {tier.popular && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    padding: '4px 14px', borderRadius: 99,
                    background: `linear-gradient(135deg,${DS.gold},#b87a1a)`,
                    color: '#0a0810', fontSize: 9, fontWeight: 800, letterSpacing: '1.2px',
                    whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{ fontSize: 11, color: tier.color, fontWeight: 700, letterSpacing: '1.5px', marginBottom: 10 }}>
                  {tier.name.toUpperCase()}
                </div>
                <div style={{ fontFamily: DS.cinzel, fontSize: 36, fontWeight: 800, color: '#f0ecff', marginBottom: 4 }}>
                  {tier.price}
                </div>
                <div style={{ fontSize: 11, color: DS.muted, marginBottom: 28 }}>{tier.priceSub}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 32 }}>
                  {tier.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: `${tier.color}15`, border: `1px solid ${tier.color}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: tier.color,
                      }}>✓</span>
                      <span style={{ fontSize: 13, color: '#e8e1f8' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <Link href="/waitlist" style={{
                  display: 'block', textAlign: 'center',
                  padding: '13px 20px', borderRadius: 12, textDecoration: 'none',
                  background: tier.popular
                    ? `linear-gradient(135deg,${DS.gold}cc,#a36a17cc)`
                    : 'transparent',
                  border: tier.popular ? 'none' : `1px solid ${tier.color}44`,
                  color: tier.popular ? '#0a0810' : tier.color,
                  fontWeight: 700, fontSize: 13, letterSpacing: '.03em',
                  boxShadow: tier.popular ? `0 0 20px ${DS.gold}30` : 'none',
                  transition: 'all .15s',
                }}>
                  {tier.price === 'Custom' ? 'Contact Sales →' : 'Get Started →'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FOOTER ───────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        padding: '60px 24px 80px', borderTop: `1px solid ${DS.border}`,
        background: DS.bg1,
      }}>
        <h2 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, marginBottom: 16, color: '#f0ecff' }}>
          Ready to launch your token distribution?
        </h2>
        <p style={{ fontSize: 14, color: DS.muted, maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Join the waitlist and get early access to the full BlockBite TDP suite.
        </p>
        <Link href="/waitlist" style={{
          display: 'inline-block', padding: '14px 40px', borderRadius: 13,
          background: `linear-gradient(135deg,${DS.accent},${DS.accentDk})`,
          color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none',
          boxShadow: `0 0 36px ${DS.accent}40`, letterSpacing: '.02em',
        }}>
          Join Waitlist →
        </Link>
      </section>

      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: `1px solid ${DS.border}`,
        padding: '24px', textAlign: 'center',
        fontSize: 11, color: DS.muted,
        background: DS.bg0,
      }}>
        © 2026 BlockBite TDP · Solana Devnet
      </footer>
    </div>
  );
}
