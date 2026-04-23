'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Menu, X, Rocket, Trophy, ShoppingBag, Info } from 'lucide-react';
import styles from './Navbar.module.css';

// Wallet button is dynamically imported to avoid hydration errors
const CustomWalletButton = dynamic(
  () => import('./CustomWalletButton'),
  { ssr: false, loading: () => <div className={styles.walletPlaceholder} /> }
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'HOME', href: '/', icon: null },
    { name: 'GAME', href: '/game', icon: <Rocket size={16} /> },
    { name: 'PRIZES', href: '/leaderboard', icon: <Trophy size={16} /> },
    { name: 'SHOP', href: '/shop', icon: <ShoppingBag size={16} /> },
    { name: 'GUIDE', href: '/how-to-play', icon: <Info size={16} /> },
  ];

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>B</div>
          <div className={styles.logoText}>
            BLOCK<span className="neon-cyan">BLAST</span>
            <span className={styles.logoBadge}>WEB3</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className={styles.desktopLinks}>
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
            >
              {link.icon && <span className={styles.navIcon}>{link.icon}</span>}
              {link.name}
            </Link>
          ))}
          <div className={styles.divider} />
          <CustomWalletButton />
        </div>

        {/* Mobile Toggle */}
        <button className={styles.mobileToggle} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {link.icon}
              {link.name}
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
