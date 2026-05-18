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
  const { wallet, wallets, publicKey, disconnect, connecting, connected, select } = useWallet();
  const { setVisible } = useWalletModal();

  // Inline picker — bypasses the @solana/wallet-adapter-react-ui modal entirely
  // for environments where wallet-extension content scripts eat the modal's
  // click handlers or where its CSS gets stripped by an aggressive blocker.
  // Shows our own dropdown with the same wallet list and calls `select(name)`
  // directly. The react-ui modal is still attempted in parallel as a fallback.
  const [inlinePicker, setInlinePicker] = useState(false);

  const openPicker = useCallback(() => {
    // eslint-disable-next-line no-console
    console.info('[BlockBite] wallet picker invoked — build v5-dedup-pickers');
    if (connecting && !connected) {
      try { select(null as unknown as Parameters<typeof select>[0]); } catch { /* ignore */ }
    }
    // 1) Try the standard modal — works in most browsers (CSP fix in 65ee8e1
    //    means the wallet adapter's network handshake no longer fails silently).
    try { setVisible(true); } catch { /* ignore */ }
    // 2) Probe the standard modal at 300 ms. If it failed to mount (extension
    //    content script ate it), fall back to OUR inline picker. This avoids
    //    showing BOTH pickers at once, which production users find confusing.
    setTimeout(() => {
      const standardModalUp = !!document.querySelector('.wallet-adapter-modal.wallet-adapter-modal-fade-in');
      if (!standardModalUp) {
        setInlinePicker(true);
      }
    }, 300);
  }, [connecting, connected, select, setVisible]);

  const pickWallet = useCallback((adapterName: string) => {
    setInlinePicker(false);
    try {
      // select() is type-narrowed to WalletName | null in the adapter; cast at the call site
      select(adapterName as unknown as Parameters<typeof select>[0]);
    } catch (e) {
      console.warn('[wallet] inline select failed:', e);
    }
  }, [select]);

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
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openPicker}
          title={connecting ? 'Click again to reset and pick a wallet' : 'Connect a Solana wallet'}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          {connecting ? (
            <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Connecting...</>
          ) : (
            <>Connect Wallet</>
          )}
        </button>

        {/* Inline fallback picker — appears 200 ms after click in case the
            standard wallet-adapter-react-ui modal is blocked by a browser
            extension. Lists every adapter that's been installed by the
            WalletProvider with a "Detected" badge for browser extensions
            actually present on this device. */}
        {inlinePicker && (
          <div
            data-testid="bb-inline-wallet-picker"
            data-build="v3-2026-05-17-force-rebuild"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: 280,
              zIndex: 10000,
              background: 'rgba(10,10,24,0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(125,211,252,0.35)',
              borderRadius: 14,
              padding: 12,
              boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 22px rgba(125,211,252,0.15)',
              fontFamily: '"Space Grotesk", system-ui, sans-serif',
            }}
            role="dialog"
            aria-label="Select a wallet"
          >
            <div style={{
              fontSize: 10, letterSpacing: 2.5, color: '#7dd3fc',
              fontWeight: 800, marginBottom: 10, textTransform: 'uppercase',
            }}>
              Pick your Solana wallet
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {wallets.map(w => {
                const ready = w.readyState === 'Installed' || w.readyState === 'Loadable';
                return (
                  <button
                    key={w.adapter.name}
                    type="button"
                    onClick={() => pickWallet(w.adapter.name)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10,
                      background: ready ? 'rgba(125,211,252,0.10)' : 'rgba(255,255,255,0.03)',
                      border: ready ? '1px solid rgba(125,211,252,0.30)' : '1px solid rgba(255,255,255,0.07)',
                      color: '#fff', fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {w.adapter.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.adapter.icon} alt="" width={22} height={22} style={{ borderRadius: 6 }} />
                    )}
                    <span style={{ flex: 1 }}>{w.adapter.name}</span>
                    {ready && (
                      <span style={{
                        fontSize: 9, letterSpacing: 1.5, color: '#86efac',
                        background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(134,239,172,0.35)',
                        padding: '3px 7px', borderRadius: 999,
                      }}>
                        DETECTED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setInlinePicker(false)}
              style={{
                width: '100%', marginTop: 10, padding: '8px 12px',
                background: 'transparent', color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
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

function DisconnectIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
