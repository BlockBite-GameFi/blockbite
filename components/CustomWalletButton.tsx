'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { CssAvatar, AVATAR_CONFIGS, AvatarPicker } from './CssAvatars';
import styles from './CustomWalletButton.module.css';

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function CustomWalletButton() {
  const { wallet, publicKey, disconnect, connecting, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subPanel, setSubPanel] = useState<'none' | 'avatar'>('none');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const [username, setUsername] = useState('');
  const [avatarIdx, setAvatarIdx] = useState(0);

  useEffect(() => {
    setUsername(localStorage.getItem('bb_username') || '');
    setAvatarIdx(parseInt(localStorage.getItem('bb_avatar') || '0'));
  }, []);

  useEffect(() => {
    const sync = () => {
      setUsername(localStorage.getItem('bb_username') || '');
      setAvatarIdx(parseInt(localStorage.getItem('bb_avatar') || '0'));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleAvatarSelect = useCallback((id: number) => {
    setAvatarIdx(id);
    localStorage.setItem('bb_avatar', id.toString());
    window.dispatchEvent(new Event('storage'));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSubPanel('none');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Disconnected ──────────────────────────────────────────────
  if (!connected || !publicKey) {
    return (
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setVisible(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}
      >
        {connecting ? (
          <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Connecting...</>
        ) : (
          <><WalletIcon />Connect Wallet</>
        )}
      </button>
    );
  }

  // ── Connected ─────────────────────────────────────────────────
  const base58 = publicKey.toBase58();
  const avatarCfg = AVATAR_CONFIGS[avatarIdx] ?? AVATAR_CONFIGS[0];

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.triggerPill} ${dropdownOpen ? styles.open : ''}`}
        style={dropdownOpen ? { borderColor: avatarCfg.glowColor, boxShadow: `0 0 18px ${avatarCfg.glowColor}40` } : {}}
        onClick={() => { setDropdownOpen(!dropdownOpen); setSubPanel('none'); }}
      >
        <CssAvatar config={avatarCfg} size={28} />
        <div className={styles.triggerInfo}>
          <span className={styles.triggerName}>{username || shortenAddress(base58)}</span>
          <span className={styles.triggerStatus}>CONNECTED</span>
        </div>
        <svg
          width="11" height="11" viewBox="0 0 24 24"
          fill="none" stroke="#8888BB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`${styles.chevron} ${dropdownOpen ? styles.rotated : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className={`${styles.dropdown} ${subPanel === 'avatar' ? styles.widePanel : ''}`}>
          {subPanel === 'none' && (
            <>
              <div className={styles.profileHeader}>
                <div className={styles.avatarWrap}>
                  <CssAvatar config={avatarCfg} size={44} />
                  <button
                    type="button"
                    className={styles.avatarEditBtn}
                    style={{ background: avatarCfg.glowColor }}
                    onClick={() => setSubPanel('avatar')}
                    title="Change Avatar"
                  >edit</button>
                </div>
                <div className={styles.profileMeta}>
                  <div className={styles.profileUsername}>{username || shortenAddress(base58)}</div>
                  <button
                    type="button"
                    className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied!' : shortenAddress(base58)}
                  </button>
                  {wallet?.adapter.name && (
                    <div className={styles.walletBadge}>
                      {wallet.adapter.icon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={wallet.adapter.icon} alt="" className={styles.walletBadgeIcon} />
                      )}
                      {wallet.adapter.name}
                    </div>
                  )}
                </div>
              </div>

              <nav className={styles.navLinks}>
                {([
                  { href: '/shop',        label: 'Buy Tickets' },
                  { href: '/leaderboard', label: 'Leaderboard' },
                ] as const).map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={styles.navLink}
                    onClick={() => setDropdownOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  className={styles.navLink}
                  onClick={() => setSubPanel('avatar')}
                >
                  Change Avatar
                </button>
              </nav>

              <button
                type="button"
                className={styles.disconnectBtn}
                onClick={() => { disconnect(); setDropdownOpen(false); }}
              >
                <DisconnectIcon />Disconnect
              </button>
            </>
          )}

          {subPanel === 'avatar' && (
            <>
              <div className={styles.subPanelHeader}>
                <button type="button" className={styles.backBtn} onClick={() => setSubPanel('none')}>←</button>
                <span className={styles.subPanelTitle}>CHOOSE AVATAR</span>
              </div>
              <AvatarPicker selected={avatarIdx} onSelect={handleAvatarSelect} size={46} />
              <p className={styles.avatarPickerHint}>
                Avatar: <span style={{ color: avatarCfg.glowColor }}>{avatarCfg.name}</span>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function WalletIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function DisconnectIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
