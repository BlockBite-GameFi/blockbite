'use client';

import { ScrollReveal } from './ScrollReveal';

const PILLARS = [
  {
    icon: '\u25C8',
    title: 'Modular Verification Layers',
    desc: 'Take control over how users access their tokens. Choose between a simple direct claim for maximum ease, or gamified verification to act as an anti-bots filter.',
    accent: '#9945FF',
  },
  {
    icon: '\u223F',
    title: 'Adaptive Tokenomics Logic',
    desc: 'Choose between linear streaming, cliff vesting, or milestone based unlocks to match your project\u2019s unique roadmap and specific distribution needs.',
    accent: '#00C2FF',
  },
  {
    icon: '\u25CE',
    title: 'Eliminate Manual Overhead',
    desc: 'Stop wasting hundreds of hours on manual distributions and cross checking spreadsheets.',
    accent: '#14F195',
  },
  {
    icon: '\u2726',
    title: 'Active Clawback Control',
    desc: 'Protect your treasury from broken contracts or project pivots. Our built-in clawback feature allows builders to reclaim unvested tokens instantly.',
    accent: '#f5c66a',
  },
  {
    icon: '\u2B21',
    title: 'Professional Standard Security',
    desc: 'BlockBite ensures that project assets are locked securely while providing transparent, on chain proof for every single distribution.',
    accent: '#ff7a3a',
  },
];

export function Pillars() {
  return (
    <section id="product" className="lp-section">
      <ScrollReveal>
        <div className="lp-section-header">
          <p className="lp-kicker lp-kicker-green">PROTOCOL FEATURES</p>
          <h2 className="lp-section-title">
            Everything a token campaign needs.{' '}
            <span className="lp-gradient-text">Nothing it doesn&apos;t.</span>
          </h2>
          <p className="lp-section-sub">
            From modular verification to automated clawbacks &mdash; all the tools a token distribution needs, built into one trustless protocol.
          </p>
        </div>
      </ScrollReveal>

      <div className="lp-pillars-grid">
        {PILLARS.map((p, i) => (
          <ScrollReveal key={i} delay={i * 80}>
            <div
              className="lp-pillar-card"
              style={{ '--pillar-accent': p.accent } as React.CSSProperties}
            >
              <div className="lp-pillar-header">
                <span className="lp-pillar-icon">{p.icon}</span>
                <span className="lp-pillar-num">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="lp-pillar-title">{p.title}</h3>
              <p className="lp-pillar-desc">{p.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
