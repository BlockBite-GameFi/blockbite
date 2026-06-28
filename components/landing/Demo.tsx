'use client';

import { ScrollReveal } from './ScrollReveal';

export function Demo() {
  return (
    <section id="demo" className="lp-section lp-section-alt">
      <ScrollReveal>
        <div className="lp-section-header lp-section-header--center">
          <p className="lp-kicker">SEE IT IN ACTION</p>
          <h2 className="lp-section-title">
            See how a campaign <span className="lp-gradient-text">comes together.</span>
          </h2>
          <p className="lp-section-sub">
            A short walkthrough of campaign setup, vesting configuration, and recipient claims is on the way.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <div className="lp-video-wrap">
          <video
            src="/walkthrough.mp4"
            poster="/walkthrough-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            className="lp-video"
          />
        </div>
      </ScrollReveal>
    </section>
  );
}
