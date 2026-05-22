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

// ─── Design System V3 colors ──────────────────────────────────────────────────
const DS = {
  accent:   '#a78bff',
  accentDk: '#5e35d4',
  border:   'rgba(167,139,255,.13)',
  bg1:      '#09071a',
  muted:    'rgba(232,225,248,.5)',
  cinzel:   "'Cinzel', serif",
  sora:     "'Sora', system-ui, sans-serif",
};

const TDP_LINKS = [
  { name: 'Streams Dashboard', href: '/streams',     desc: 'All active vesting streams',        icon: '◈' },
  { name: 'Create Stream',     href: '/streams/new', desc: 'Lock tokens into a PDA vault',      icon: '＋' },
  { name: 'Claim Portal',      href: '/claim',       desc: 'Withdraw vested tokens',            icon: '◎' },
  { name: 'Milestones',        href: '/milestones',  desc: 'Verify milestone unlocks on-chain', icon: '◉' },
  { name: 'Calculator',        href: '/calculator',  desc: 'Model your vesting schedule',       icon: '∿' },
  { name: 'Analytics',         href: '/analytics',   desc: 'Protocol-wide on-chain metrics',    icon: '✦' },
  { name: 'Audit Trail',       href: '/audit',       desc: 'Immutable event log on Solana',     icon: '◇' },
  { name: 'Protocol',          href: '/protocol',    desc: 'TDP overview & comparison',         icon: '⬡' },
] as const;

const NAV_LINKS = [
  { name: 'DASHBOARD', href: '/streams' },
  { name: 'STREAMS',   href: '/streams/new' },
  { name: 'PROTOCOL',  href: '/protocol' },
] as const;

export default function Navbar() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [tdpOpen,  setTdpOpen]    = useState(false);
  const [gameTooltip, setGameTooltip] = useState(false);
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

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo.png"
            alt="BlockBite"
            width={38}
            height={38}
            style={{ objectFit: 'contain', flexShrink: 0 }}
            priority
          />
          <div className={styles.logoText} style={{ fontFamily: DS.cinzel }}>
            BLOCK<span className={styles.logoAccent}>BITE</span>
            <span style={{
              marginLeft: 7, fontSize: 9, fontWeight: 700, letterSpacing: '1.5px',
              padding: '2px 6px', borderRadius: 5,
              background: `linear-gradient(135deg, ${DS.accent}33, ${DS.accentDk}33)`,
              border: `1px solid ${DS.border}`,
              color: DS.accent,
              fontFamily: DS.sora,
              verticalAlign: 'middle',
              lineHeight: 1,
            }}>TDP</span>
          </div>
        </Link>

        {/* ── Desktop links ──────────────────────────────────────────────── */}
        <ul className={styles.links}>

          {NAV_LINKS.map((link) => (
            <li key={link.name}>
              <Link
                href={link.href}
                className={`${styles.link} ${pathname === link.href || pathname?.startsWith(link.href + '/') ? styles.active : ''}`}
                style={{ fontFamily: DS.sora }}
              >
                {link.name}
              </Link>
            </li>
          ))}

          {/* GAME link with tooltip */}
          <li style={{ position: 'relative' }}>
            <Link
              href="/game"
              className={`${styles.link} ${pathname === '/game' || pathname?.startsWith('/tutorial') ? styles.active : ''}`}
              style={{ fontFamily: DS.sora, position: 'relative' }}
              onMouseEnter={() => setGameTooltip(true)}
              onMouseLeave={() => setGameTooltip(false)}
            >
              GAME
              <span style={{
                marginLeft: 5, fontSize: 8, padding: '2px 5px', borderRadius: 4,
                background: 'rgba(192,132,252,.18)', color: '#c084fc',
                border: '1px solid rgba(192,132,252,.3)',
                fontFamily: DS.sora, fontWeight: 600, letterSpacing: '.5px',
                verticalAlign: 'middle',
              }}>VERIFY</span>
            </Link>
            {gameTooltip && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 10, zIndex: 9999,
                background: DS.bg1,
                border: `1px solid ${DS.border}`,
                borderRadius: 10, padding: '10px 14px',
                minWidth: 200, maxWidth: 240,
                boxShadow: '0 12px 40px rgba(0,0,0,.7)',
                pointerEvents: 'none',
              }}>
                <div style={{ fontSize: 11, color: '#c084fc', fontWeight: 700, marginBottom: 5, fontFamily: DS.sora }}>
                  Verify via Game
                </div>
                <div style={{ fontSize: 11, color: DS.muted, lineHeight: 1.5 }}>
                  Play BlockBite to earn milestone verification points on-chain for your vesting stream.
                </div>
                <div style={{
                  position: 'absolute', top: -5, left: '50%',
                  width: 8, height: 8, background: DS.bg1,
                  border: `1px solid ${DS.border}`, borderBottom: 'none', borderRight: 'none',
                  transform: 'translateX(-50%) rotate(45deg)',
                }} />
              </div>
            )}
          </li>

          {/* ⬡ PROTOCOL dropdown */}
          <li style={{ position: 'relative' }}>
            <button
              onClick={() => setTdpOpen(o => !o)}
              onBlur={() => setTimeout(() => setTdpOpen(false), 150)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: isTdpActive ? 'rgba(167,139,255,.18)' : 'rgba(167,139,255,.09)',
                color: isTdpActive ? DS.accent : 'rgba(167,139,255,.8)',
                fontSize: 12, fontWeight: 700, letterSpacing: '.06em',
                transition: 'all .15s', fontFamily: DS.sora,
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
                background: DS.bg1,
                border: `1px solid rgba(167,139,255,.2)`,
                borderRadius: 14, padding: '8px',
                boxShadow: '0 16px 48px rgba(0,0,0,.7), 0 0 0 1px rgba(167,139,255,.08)',
                minWidth: 240,
              }}>
                {TDP_LINKS.map(l => (
                  <Link key={l.href} href={l.href}
                    onClick={() => setTdpOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px',
                      borderRadius: 9, textDecoration: 'none',
                      background: pathname === l.href || (l.href !== '/streams' && pathname.startsWith(l.href))
                        ? 'rgba(167,139,255,.12)' : 'transparent',
                      transition: 'background .12s',
                      fontFamily: DS.sora,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,255,.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background =
                      pathname === l.href ? 'rgba(167,139,255,.12)' : 'transparent')}
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
                  fontFamily: DS.sora,
                }}>
                  TDP · Solana Devnet · DvhxiL5P…XTFf
                </div>
              </div>
            )}
          </li>
        </ul>

        {/* ── Right controls ─────────────────────────────────────────────── */}
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

          {/* Launch App primary CTA */}
          <Link href="/streams/new" style={{
            padding: '7px 16px', borderRadius: 9,
            background: `linear-gradient(135deg, ${DS.accent}, ${DS.accentDk})`,
            color: '#fff', fontWeight: 700, fontSize: 12,
            textDecoration: 'none', letterSpacing: '.03em',
            fontFamily: DS.sora, whiteSpace: 'nowrap',
            boxShadow: '0 0 18px rgba(167,139,255,.3)',
          }}>
            Launch App
          </Link>

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

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`${styles.mobileLink} ${pathname === link.href || pathname?.startsWith(link.href + '/') ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: DS.sora }}
            >
              <span className={styles.mobileLinkInner}>{link.name}</span>
            </Link>
          ))}

          <Link
            href="/game"
            className={`${styles.mobileLink} ${pathname === '/game' ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
            style={{ fontFamily: DS.sora }}
          >
            <span className={styles.mobileLinkInner}>GAME — Verify via Game</span>
          </Link>

          {/* TDP section in mobile */}
          <div style={{ padding: '8px 20px 4px', fontSize: 9.5, color: 'rgba(167,139,255,.5)', letterSpacing: '.1em', fontWeight: 700, fontFamily: DS.sora }}>
            ⬡ TDP PROTOCOL
          </div>
          {TDP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: DS.sora }}
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
