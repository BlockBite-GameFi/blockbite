'use client';

import Link from 'next/link';
import { ScrollReveal } from './ScrollReveal';

export function CallToAction() {
  return (
    <section className="lp-section lp-cta-section">
      <ScrollReveal>
        <h2 className="lp-cta-title">
          Ready to distribute tokens responsibly?
        </h2>
        <p className="lp-cta-sub">
          Join the projects already streaming tokens with cliff, linear, and milestone vesting on Solana.
        </p>
        <div className="lp-cta-wrap">
          <Link href="/new" className="lp-btn lp-btn-primary">
            Launch App &rarr;
          </Link>
          <a href="https://github.com/BlockBite-GameFi/blockbite-smart-contract/tree/main/docs" target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-secondary">
            Open docs
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
}
