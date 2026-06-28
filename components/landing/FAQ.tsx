'use client';

import { useState } from 'react';
import { ScrollReveal } from './ScrollReveal';

const FAQ_ITEMS = [
  {
    q: 'What is BlockBite TDP?',
    a: 'BlockBite is the unified engine for automated token logistics. We remove the complexity and risk of manual management by providing an automated system that handles vesting, streaming, and distribution with flexible security layers, ensuring your treasury is protected and your tokens are delivered with surgical precision.',
  },
  {
    q: 'Who controls the locked tokens?',
    a: 'Tokens are secured in audited, non custodial smart contracts on Solana. Neither BlockBite nor outside parties can touch them. As the builder, you retain exclusive emergency control via our clawback feature to reclaim unvested tokens if conditions change.',
  },
  {
    q: 'What vesting schedules are supported?',
    a: 'We support highly adaptive tokenomics logic. You can use linear streaming for second by second unlocks, cliff schedules for timed lockups, or milestone based unlocks that release tokens only when project goals are achieved.',
  },
  {
    q: 'What is the gamified verification layer?',
    a: 'It is a mechanical filter built to block automated scripts and farming bots. When active, users must complete a specific level or reach a target milestone in a game to prove they are human before the smart contract unlocks their tokens.',
  },
  {
    q: 'What happens if a stream is cancelled?',
    a: 'Vesting freezes immediately. The recipient keeps everything already vested and can claim it at any time. Unvested tokens are returned to the stream creator.',
  },
  {
    q: 'What wallets are supported?',
    a: 'Phantom and Solflare are fully supported via Solana wallet-adapter. Any wallet compatible with the adapter standard will work.',
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="lp-section">
      <ScrollReveal>
        <div className="lp-section-header lp-section-header--center">
          <p className="lp-kicker">FAQ</p>
          <h2 className="lp-section-title">
            Questions, <span className="lp-gradient-text">answered.</span>
          </h2>
        </div>
      </ScrollReveal>

      <div className="lp-faq-list">
        {FAQ_ITEMS.map((item, i) => (
          <ScrollReveal key={i} delay={i * 60}>
            <div
              className="lp-faq-item"
              style={{
                borderColor: openIdx === i ? 'rgba(153,69,255,0.45)' : 'var(--p-border)',
              }}
            >
              <button
                className="lp-faq-question"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span>{item.q}</span>
                <span
                  className="lp-faq-chevron"
                  style={{ transform: openIdx === i ? 'rotate(180deg)' : 'none' }}
                >
                  &#8964;
                </span>
              </button>
              {openIdx === i && (
                <div className="lp-faq-answer">{item.a}</div>
              )}
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
