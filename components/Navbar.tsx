'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from './Navbar.module.css';
import { useApp } from '@/lib/useApp';

const CustomWalletButton = dynamic(
  () => import('./CustomWalletButton'),
  { ssr: false, loading: () => <div className={styles.walletPlaceholder} /> }
);

// ─── Design tokens — CSS var refs so dark/light toggle propagates to inline styles
const DS = {
  accent:   'var(--p-accent)',
  accentDk: 'var(--p-accent-dk)',
  border:   'var(--p-border)',
  bg1:      'var(--p-bg1)',
  muted:    'var(--p-muted)',
  font:     "'Space Grotesk', system-ui, sans-serif",
};

const TDP_LINKS = [
  { name: 'Streams Dashboard', href: '/streams',     desc: 'All active vesting streams',        icon: '◈' },
  { name: 'Demo',              href: '/demo',        desc: 'Interactive protocol walkthrough',  icon: '◇' },
  { name: 'Create Stream',     href: '/new', desc: 'Lock tokens into a PDA vault',      icon: '＋' },
  { name: 'Claim Portal',      href: '/claim',       desc: 'Withdraw vested tokens',            icon: '◎' },
  { name: 'Milestones',        href: '/milestones',  desc: 'Verify milestone unlocks on-chain', icon: '◉' },
  { name: 'Calculator',        href: '/calculator',  desc: 'Model your vesting schedule',       icon: '∿' },
  { name: 'Analytics',         href: '/analytics',   desc: 'Protocol-wide on-chain metrics',    icon: '✦' },
  { name: 'Audit Trail',       href: '/audit',       desc: 'Immutable event log on Solana',     icon: '◇' },
  { name: 'Protocol',          href: '/protocol',    desc: 'TDP overview & comparison',         icon: '⬡' },
  { name: 'Partners',          href: '/partners',    desc: 'Partnership program & tiers',       icon: '◆' },
];

// NAV_LINKS hrefs — HARDCODED. DO NOT change how-it-works to /how-to-play.
// HOW IT WORKS → /#how-it-works (homepage section anchor)
// /how-to-play  → game guide page (DIFFERENT PAGE — not this nav item)
const NAV_HREFS = [
  { key: 'nav_product',       href: '/protocol'      },
  { key: 'nav_how_it_works',  href: '/#how-it-works' }, // HARDCODED — homepage section
  { key: 'nav_token_streams', href: '/streams'       }, // Public global dashboard
  { key: 'nav_my_campaign',   href: '/my-campaign'   }, // User claim & interaction portal
  { key: 'nav_faq',           href: '/#faq'          }, // HARDCODED — homepage FAQ section
  { key: 'nav_demo',          href: '/#video'        }, // HARDCODED — homepage video section
] as const;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { t } = useApp();

  // Build nav links inside the component so the t() lookup happens
  const NAV_LINKS = NAV_HREFS.map(item => ({ name: t(item.key), href: item.href }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>

        {/* ── Logo + conditional Back-to-Landing button ──────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo.png"
              alt="BlockBite"
              width={38}
              height={38}
              style={{ objectFit: 'contain', flexShrink: 0 }}
              priority
            />
            <div className={styles.logoText}>
              BlockBite
            </div>
          </Link>

          {/* ← Home / Beranda — only visible on sub-pages */}
          {pathname !== '/' && (
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 8,
              border: '1px solid color-mix(in srgb, var(--p-accent) 28%, transparent)',
              background: 'color-mix(in srgb, var(--p-accent) 7%, transparent)',
              color: DS.accent,
              fontSize: 12, fontWeight: 700,
              textDecoration: 'none', letterSpacing: '.04em',
              fontFamily: DS.font, whiteSpace: 'nowrap',
              transition: 'all .15s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--p-text)';
                (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--p-accent) 50%, transparent)';
                (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--p-accent) 14%, transparent)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--p-accent)';
                (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--p-accent) 28%, transparent)';
                (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--p-accent) 7%, transparent)';
              }}
            >
              {t('nav_back')}
            </Link>
          )}
        </div>

        {/* ── Desktop links — Veztra clean style ────────────────────────── */}
        <ul className={styles.links}>
          {NAV_LINKS.map((link) => (
            <li key={link.name}>
              <Link
                href={link.href}
                className={`${styles.link} ${
                  pathname === link.href || pathname?.startsWith(link.href + '/')
                    ? styles.active : ''
                }`}
                style={{ fontFamily: DS.font }}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Right controls — Veztra clean: Launch App + Wallet only ── */}
        <div className={styles.right}>

          <CustomWalletButton />

          {/* Launch App primary CTA */}
          <Link href="/new" style={{
            padding: '8px 20px', borderRadius: 9999,
            background: 'var(--p-grad-alt)',
            color: '#fff', fontWeight: 700, fontSize: 13,
            textDecoration: 'none', letterSpacing: '.03em',
            fontFamily: DS.font, whiteSpace: 'nowrap',
            boxShadow: '0 0 20px color-mix(in srgb, var(--p-accent) 21%, transparent)',
          }}>
            {t('cta_launch')}
          </Link>

          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={menuOpen ? styles.menuOpen : ''} />
            <span className={menuOpen ? styles.menuOpen : ''} />
            <span className={menuOpen ? styles.menuOpen : ''} />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className={styles.mobileMenu}>

          {/* ← Home / Beranda — mobile */}
          {pathname !== '/' && (
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                margin: '4px 16px 8px',
                padding: '11px 16px', borderRadius: 10,
                border: '1px solid color-mix(in srgb, var(--p-accent) 28%, transparent)',
                background: 'color-mix(in srgb, var(--p-accent) 7%, transparent)',
                color: DS.accent,
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                fontFamily: DS.font, letterSpacing: '.03em',
              }}
            >
              {t('nav_back')}
            </Link>
          )}

          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`${styles.mobileLink} ${pathname === link.href || pathname?.startsWith(link.href + '/') ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: DS.font }}
            >
              <span className={styles.mobileLinkInner}>{link.name}</span>
            </Link>
          ))}

          <div className={styles.mobileWalletWrap}>
            <CustomWalletButton />
          </div>
        </div>
      )}
    </nav>
  );
}
