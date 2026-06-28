'use client';

import { useState } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useApp } from '@/lib/useApp';

export function Waitlist() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { t } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail('');
  };

  return (
    <section id="waitlist" className="lp-section lp-section-alt">
      <ScrollReveal>
        <div className="lp-waitlist-card">
          <p className="lp-kicker lp-kicker-green">EARLY ACCESS &middot; LIMITED SPOTS</p>
          <h2 className="lp-waitlist-title">
            Be first on the <span className="lp-gradient-text">mainnet rollout.</span>
          </h2>
          <p className="lp-waitlist-sub">
            Leave your email. We&apos;ll let you know when live campaigns open, plus a personal onboarding session for the first 100 teams.
          </p>

          {submitted ? (
            <div className="lp-waitlist-success">
              <span className="lp-success-icon">&#10003;</span>
              <p>{t('waitlist_success')}</p>
            </div>
          ) : (
            <form className="lp-waitlist-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lp-waitlist-input"
                required
              />
              <button type="submit" className="lp-btn lp-btn-primary">
                {t('join_waitlist')} &rarr;
              </button>
            </form>
          )}

          <p className="lp-waitlist-note">{t('waitlist_note')}</p>

          <div className="lp-access-badges">
            <span className="lp-access-badge lp-access-badge--open">
              <span className="lp-access-dot" />
              Founding access open
            </span>
            <span className="lp-access-badge">Q3 2026 mainnet target</span>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
