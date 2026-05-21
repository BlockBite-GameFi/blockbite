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

interface NavLink {
  name: string;
  href: string;
  play?: boolean;
  tdp?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { name: 'PLAY',        href: '/map',        play: true  },
  { name: 'LEADERBOARD', href: '/leaderboard'             },
  { name: 'SHOP',        href: '/shop'                    },
  { name: 'GUIDE',       href: '/how-to-play'             },
];

const TDP_LINKS = [
  { name: 'Streams Dashboard', href: '/streams',       desc: 'All active vesting streams',        icon: '◈' },
  { name: 'Create Stream',     href: '/streams/new',   desc: 'Lock tokens into a PDA vault',      icon: '＋' },
  { name: 'Claim Portal',      href: '/claim',         desc: 'Withdraw vested tokens',            icon: '◎' },
  { name: 'Milestones',        href: '/milestones',    desc: 'Verify milestone unlocks on-chain', icon: '🎯' },
  { name: 'Calculator',        href: '/calculator',    desc: 'Model your vesting schedule',       icon: '📊' },
  { name: 'Analytics',         href: '/analytics',     desc: 'Protocol-wide on-chain metrics',    icon: '📈' },
  { name: 'Audit Trail',       href: '/audit',         desc: 'Immutable event log on Solana',     icon: '🔐' },
  { name: 'Protocol',          href: '/protocol',      desc: 'TDP overview & comparison',         icon: '⬡' },
] as const;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tdpOpen,  setTdpOpen]  = useState(false);
  const pathname = usePathname();
  const { lang, setLang, theme, setTheme } = useApp();

  const isTdpActive = pathname.startsWith('/streams') || pathname.startsWith('/claim')
    || pathname === '/milestones' || pathname === '/calculator'
    || pathname === '/analytics'  || pathname === '/audit'
    || pathname === '/protocol'   || pathname === '/distribute';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>

        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo.png"
            alt="BlockBite"
            width={40}
            height={40}
            style={{ objectFit: 'contain', flexShrink: 0 }}
            priority
          />
          <div className={styles.logoText}>
            BLOCK<span className={styles.logoAccent}>BITE</span>
          </div>
        </Link>

        {/* Desktop links */}
        <ul className={styles.links}>
          {NAV_LINKS.map((link) => (
            <li key={link.name}>
              <Link
                href={link.href}
                className={`${styles.link} ${link.play ? styles.playLink : ''} ${pathname === link.href || pathname?.startsWith(link.href + '/') ? styles.active : ''}`}
              >
                {link.name}
              </Link>
            </li>
          ))}

          {/* TDP Protocol dropdown */}
          <li style={{ position: 'relative' }}>
            <button
              onClick={() => setTdpOpen(o => !o)}
              onBlur={() => setTimeout(() => setTdpOpen(false), 150)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: isTdpActive ? 'rgba(167,139,250,.18)' : 'rgba(167,139,250,.09)',
                color: isTdpActive ? '#a78bfa' : 'rgba(167,139,250,.8)',
                fontSize: 12, fontWeight: 700, letterSpacing: '.06em',
                transition: 'all .15s', fontFamily: 'inherit',
              }}
            >
              ⬡ PROTOCOL
              <span style={{
                fontSize: 9, opacity: .7,
                transition: 'transform .2s',
                transform: tdpOpen ? 'rotate(180deg)' : 'none',
                display: 'inline-block',
              }}>▾</span>
            </button>

            {tdpOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 8, zIndex: 9999,
                background: '#09071a', border: '1px solid rgba(167,139,250,.2)',
                borderRadius: 14, padding: '8px',
                boxShadow: '0 16px 48px rgba(0,0,0,.7), 0 0 0 1px rgba(167,139,250,.08)',
                minWidth: 240,
              }}>
                {TDP_LINKS.map(l => (
                  <Link key={l.href} href={l.href}
                    onClick={() => setTdpOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px',
                      borderRadius: 9, textDecoration: 'none',
                      background: pathname === l.href || (l.href !== '/streams' && pathname.startsWith(l.href))
                        ? 'rgba(167,139,250,.12)' : 'transparent',
                      transition: 'background .12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,250,.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background =
                      pathname === l.href ? 'rgba(167,139,250,.12)' : 'transparent')}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{l.icon}</span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', letterSpacing: '.02em' }}>{l.name}</div>
                      <div style={{ fontSize: 10.5, color: 'rgba(148,163,184,.7)', marginTop: 1 }}>{l.desc}</div>
                    </div>
                  </Link>
                ))}
                <div style={{
                  margin: '6px 12px 2px', paddingTop: 8,
                  borderTop: '1px solid rgba(255,255,255,.06)',
                  fontSize: 9.5, color: 'rgba(148,163,184,.45)', letterSpacing: '.06em',
                }}>
                  TDP · Solana Devnet · DvhxiL5P…XTFf
                </div>
              </div>
            )}
          </li>
        </ul>

        {/* Right: lang + theme + wallet + hamburger */}
        <div className={styles.right}>
          <button
            type="button"
            className={styles.iconToggle}
            onClick={() => setLang(lang === 'en' ? 'id' : 'en')}
            aria-label="Toggle language"
            title={lang === 'en' ? 'Switch to Indonesian' : 'Switch to English'}
          >
            <span className={styles.langLabel}>{lang.toUpperCase()}</span>
          </button>
          <button
            type="button"
            className={styles.iconToggle}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className={styles.langLabel}>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
          </button>
          <CustomWalletButton />
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

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`${styles.mobileLink} ${pathname === link.href || pathname?.startsWith(link.href + '/') ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.mobileLinkInner}>
                {link.name}
              </span>
            </Link>
          ))}

          {/* TDP section in mobile */}
          <div style={{ padding: '8px 20px 4px', fontSize: 9.5, color: 'rgba(167,139,250,.5)', letterSpacing: '.1em', fontWeight: 700 }}>
            ⬡ TDP PROTOCOL
          </div>
          {TDP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.mobileLinkInner}>
                {link.icon} {link.name.toUpperCase()}
              </span>
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
