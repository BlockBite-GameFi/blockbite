'use client';

import { ScrollReveal } from './ScrollReveal';

const STEPS = [
  { num: '01', title: 'Connect & Import Data', desc: 'Connect your wallet and upload your recipient list via CSV or manual entry in seconds.', color: '#ff7a3a' },
  { num: '02', title: 'Define Tokenomics', desc: 'Customize your release strategy using linear vesting, cliff periods, or milestone-based distribution.', color: '#00C2FF' },
  { num: '03', title: 'Set Verification Layer', desc: 'Choose between a simple direct claim for maximum ease, or gamified verification to act as an anti-bots filter.', color: '#c084fc' },
  { num: '04', title: 'Lock, Launch & Manage', desc: 'Lock assets to automate user claims. Monitor distribution in real-time with absolute Clawback control.', color: '#14F195' },
];

const VERIFY_METHODS = [
  {
    title: 'Direct Claim',
    sub: 'Fastest Setup',
    desc: 'The fastest setup for simple distributions. Users can claim their tokens instantly as soon as the schedule unlocks without any extra steps or requirements.',
    badge: 'No Extra Steps',
    color: '#00C2FF',
  },
  {
    title: 'Gamified',
    sub: 'Play to Unlock',
    desc: 'The defense against automated bots. Users must complete and pass a specific level or reach a target milestone in the game to unlock their tokens.',
    badge: 'Sybil-Resistant',
    color: '#c084fc',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="lp-section lp-section-alt">
      <ScrollReveal>
        <div className="lp-section-header">
          <p className="lp-kicker lp-kicker-green">HOW IT WORKS</p>
          <h2 className="lp-section-title">
            Four moves. <span className="lp-gradient-text">From setup to claim.</span>
          </h2>
          <p className="lp-section-sub">
            Upload recipients, choose how tokens unlock, and let each wallet claim on schedule.
          </p>
        </div>
      </ScrollReveal>

      <div className="lp-steps-grid">
        <div className="lp-connector" />
        {STEPS.map((s, i) => (
          <ScrollReveal key={i} delay={i * 100}>
            <div className="lp-step">
              <span className="lp-step-ghost">{s.num}</span>
              <div className="lp-step-badge">{s.num}</div>
              <h3 className="lp-step-title">{s.title}</h3>
              <p className="lp-step-desc">{s.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal>
        <div className="lp-verify-header">
          <p className="lp-kicker">CHOOSE YOUR VERIFICATION LAYER</p>
        </div>
      </ScrollReveal>

      <div className="lp-verify-grid">
        {VERIFY_METHODS.map((m, i) => (
          <ScrollReveal key={i} delay={i * 100}>
            <div
              className="lp-verify-card"
              style={{
                background: `color-mix(in srgb, ${m.color} 3%, transparent)`,
                border: `1px solid color-mix(in srgb, ${m.color} 13%, transparent)`,
              }}
            >
              <div className="lp-verify-title" style={{ color: m.color }}>
                {m.title.toUpperCase()}
              </div>
              <div className="lp-verify-sub">{m.sub}</div>
              <p className="lp-verify-desc">{m.desc}</p>
              <span
                className="lp-verify-badge"
                style={{
                  background: `color-mix(in srgb, ${m.color} 8%, transparent)`,
                  color: m.color,
                }}
              >
                {m.badge}
              </span>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
