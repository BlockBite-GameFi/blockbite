'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/game', label: '▶ Play' },
  { href: '/shop', label: 'Shop' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/how-to-play', label: 'How to Play' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoBlocks}>
            <span style={{ background: 'linear-gradient(135deg, #00F5FF, #0088FF)' }} />
            <span style={{ background: 'linear-gradient(135deg, #FF00FF, #AA0066)' }} />
            <span style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }} />
            <span style={{ background: 'linear-gradient(135deg, #00FF88, #00AA44)' }} />
          </span>
          <span className={styles.logoText}>Block<span className={styles.logoAccent}>Blast</span></span>
          <span className={styles.logoBadge}>WEB3</span>
        </Link>

        {/* Desktop Links */}
        <ul className={styles.links}>
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`${styles.link} ${pathname === link.href ? styles.active : ''} ${link.label.startsWith('▶') ? styles.playLink : ''}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Wallet Button */}
        <div className={styles.right}>
          <div className={styles.prizeChip}>
            <span className={styles.prizeIcon}>🏆</span>
            <span className={styles.prizeLabel}>Pool</span>
            <span className={styles.prizeValue}>3,248 USDC</span>
          </div>
          <button className={`btn btn-primary btn-sm ${styles.walletBtn}`} id="navbar-connect-wallet">
            Connect Wallet
          </button>
          <button
            className={styles.menuToggle}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={mobileOpen ? styles.menuOpen : ''} />
            <span className={mobileOpen ? styles.menuOpen : ''} />
            <span className={mobileOpen ? styles.menuOpen : ''} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button className="btn btn-primary" style={{ margin: '8px 16px' }}>
            Connect Wallet
          </button>
        </div>
      )}
    </nav>
  );
}
