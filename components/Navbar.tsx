'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Rocket, Trophy, ShoppingBag, Info, Moon, Sun } from 'lucide-react';
import styles from './Navbar.module.css';
import { useApp } from '@/lib/useApp';

const CustomWalletButton = dynamic(
  () => import('./CustomWalletButton'),
  { ssr: false, loading: () => <div className={styles.walletPlaceholder} /> }
);

const NAV_LINKS = [
  { name: 'PLAY',        href: '/game',        icon: <Rocket      size={15} />, play: true,  lb: false },
  { name: 'LEADERBOARD', href: '/leaderboard', icon: <Trophy      size={15} />, play: false, lb: false },
  { name: 'SHOP',        href: '/shop',        icon: <ShoppingBag size={15} />, play: false, lb: false },
  { name: 'GUIDE',       href: '/how-to-play', icon: <Info        size={15} />, play: false, lb: false },
] as const;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { lang, setLang, theme, setTheme } = useApp();

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
                className={`${styles.link} ${link.play ? styles.playLink : ''} ${pathname === link.href ? styles.active : ''}`}
              >
                {link.icon}
                {link.name}
                {link.lb && null}
              </Link>
            </li>
          ))}
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
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
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
              className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.mobileLinkInner}>
                {link.icon}
                {link.name}
                {link.lb && null}
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
