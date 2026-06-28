'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useApp } from '@/lib/useApp';
import { ScrollReveal } from './ScrollReveal';

export function Hero() {
  const { t } = useApp();
  const cvs = useRef<HTMLCanvasElement>(null);

  // Floating particles
  useEffect(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let raf: number;
    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const COLORS = ['#9945FF', '#00C2FF', '#14F195', '#7733CC'];
    const pts = Array.from({ length: 28 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 1 + Math.random() * 2.5,
      spd: 0.12 + Math.random() * 0.22,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      op: 0.06 + Math.random() * 0.14,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach((p) => {
        p.y -= p.spd;
        if (p.y < -10) {
          p.y = c.height + 10;
          p.x = Math.random() * c.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.op;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section className="lp-hero">
      <canvas ref={cvs} className="lp-hero-canvas" />

      <div className="lp-hero-glow" />

      <ScrollReveal>
        <div className="lp-badge">
          <span className="lp-badge-dot" />
          POWERED BY SOLANA
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <img src="/logo.png" alt="BlockBite" className="lp-hero-logo" />
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <p className="lp-kicker">THE UNIFIED TOKEN DISTRIBUTION PROTOCOL</p>
      </ScrollReveal>

      <ScrollReveal delay={300}>
        <h1 className="lp-hero-title">
          Stop Distributing{' '}
          <span className="lp-gradient-text">Tokens Blindly.</span>
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={400}>
        <p className="lp-hero-sub">
          The unified engine for automated token logistics. Effortlessly manage
          your entire lifecycle from secure vesting to real-time streaming with
          built-in validation layers.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={500}>
        <div className="lp-cta-wrap">
          <SmoothScrollLink href="#waitlist" className="lp-btn lp-btn-primary">
            {t('join_waitlist')}
          </SmoothScrollLink>
          <Link href="/new" className="lp-btn lp-btn-secondary">
            {t('cta_launch')} &rarr;
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}

function SmoothScrollLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.pushState(null, '', href);
  };
  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
