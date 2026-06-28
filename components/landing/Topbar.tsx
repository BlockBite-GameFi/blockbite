'use client';

import Image from 'next/image';
import { useState } from 'react';
import { SmoothScrollLink } from './SmoothScrollLink';
import { useApp } from '@/lib/useApp';
import dynamic from 'next/dynamic';

const CustomWalletButton = dynamic(
  () => import('../CustomWalletButton'),
  { ssr: false, loading: () => <div className="lp-wallet-placeholder" /> }
);

const navLinks = [
  { href: '#product', labelKey: 'nav_product' },
  { href: '#how', labelKey: 'nav_how_it_works' },
  { href: '#demo', labelKey: 'nav_demo' },
  { href: '#faq', labelKey: 'nav_faq' },
];

export function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useApp();

  return (
    <header className="lp-topbar" id="top">
      <div className="lp-wrap lp-topbar-inner">
        <SmoothScrollLink className="lp-brand" href="#top" onNavigate={() => setMenuOpen(false)}>
          <span className="lp-brand-mark">
            <Image
              src="/logo.png"
              alt=""
              aria-hidden="true"
              className="lp-brand-logo"
              width={28}
              height={28}
            />
          </span>
          <span className="name">BlockBite</span>
        </SmoothScrollLink>

        <nav className="lp-nav">
          {navLinks.map((link) => (
            <SmoothScrollLink
              key={link.href}
              href={link.href}
              onNavigate={() => setMenuOpen(false)}
            >
              {t(link.labelKey)}
            </SmoothScrollLink>
          ))}
        </nav>

        <div className="lp-topbar-actions">
          <SmoothScrollLink
            href="#waitlist"
            className="lp-btn waitlist-cta"
            onNavigate={() => setMenuOpen(false)}
          >
            {t('join_waitlist')} <span className="arrow">&rarr;</span>
          </SmoothScrollLink>

          <button
            type="button"
            className={`lp-menu-toggle${menuOpen ? ' is-open' : ''}`}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="lp-mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
            suppressHydrationWarning
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav id="lp-mobile-nav" className={`lp-nav lp-nav-mobile${menuOpen ? ' is-open' : ''}`}>
          {navLinks.map((link) => (
            <SmoothScrollLink
              key={link.href}
              href={link.href}
              onNavigate={() => setMenuOpen(false)}
            >
              {t(link.labelKey)}
            </SmoothScrollLink>
          ))}
          <div className="lp-mobile-wallet">
            <CustomWalletButton />
          </div>
          <SmoothScrollLink
            href="#waitlist"
            className="lp-mobile-cta"
            onNavigate={() => setMenuOpen(false)}
          >
            {t('join_waitlist')} <span className="arrow">&rarr;</span>
          </SmoothScrollLink>
        </nav>
      </div>
    </header>
  );
}
