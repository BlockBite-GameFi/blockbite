'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function CustomWalletButton() {
  const { wallet, wallets, publicKey, disconnect, connecting, connected, select, connect } = useWallet();
  const { setVisible } = useWalletModal();

  // autoConnect is disabled globally (prevents stuck-connecting on page load).
  // But that means after the user picks a wallet via the standard modal,
  // select() is called but connect() never fires — so nothing happens.
  // This effect bridges the gap: whenever a wallet becomes selected and we
  // are not yet connected/connecting, trigger connect() explicitly.
  useEffect(() => {
    if (wallet && !connected && !connecting) {
      connect().catch(() => {});
    }
  }, [wallet, connected, connecting, connect]);

  // Inline picker — bypasses the @solana/wallet-adapter-react-ui modal entirely
  // for environments where wallet-extension content scripts eat the modal's
  // click handlers or where its CSS gets stripped by an aggressive blocker.
  // Shows our own dropdown with the same wallet list and calls `select(name)`
  // directly. The react-ui modal is still attempted in parallel as a fallback.
  const [inlinePicker, setInlinePicker] = useState(false);

  const openPicker = useCallback(() => {
    // eslint-disable-next-line no-console
    console.info('[BlockBite] wallet picker invoked — build v6-observer-dedup');
    // Always start hidden — the observer below decides whether to show it.
    setInlinePicker(false);
    if (connecting && !connected) {
      try { select(null as unknown as Parameters<typeof select>[0]); } catch { /* ignore */ }
    }
    // 1) Try the standard modal — works in most browsers (CSP fix in 65ee8e1
    //    means the wallet adapter's network handshake no longer fails silently).
    try { setVisible(true); } catch { /* ignore */ }
    // 2) Use a MutationObserver to watch for the standard modal. If it ever
    //    appears (any time within 1500 ms), we DON'T show inline. If it never
    //    appears, we fall back to inline. Active observer also catches the case
    //    where the standard modal mounts AFTER our initial probe — in that case
    //    we close the inline picker so only one is ever visible.
    let standardSeen = false;
    const isStandardModalVisible = () => {
      const m = document.querySelector('.wallet-adapter-modal-container, .wallet-adapter-modal');
      if (!m) return false;
      const rect = (m as HTMLElement).getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const observer = new MutationObserver(() => {
      if (isStandardModalVisible()) {
        standardSeen = true;
        setInlinePicker(false);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Initial check in case the modal was already there
    if (isStandardModalVisible()) standardSeen = true;
    // Fallback timer — if no standard modal after 600 ms, show inline.
    const fallbackTimer = window.setTimeout(() => {
      if (!standardSeen && !isStandardModalVisible()) {
        setInlinePicker(true);
      }
    }, 600);
    // Stop observing after 1500 ms either way (modal animations complete by then).
    window.setTimeout(() => {
      observer.disconnect();
      window.clearTimeout(fallbackTimer);
    }, 1500);
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
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
            data-build="v6-2026-05-18-observer-dedup"
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

  // ── Connected — Veztra style ──────────────────────────────────
  const base58 = publicKey.toBase58();
  const short   = `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  const explorerHref = `https://explorer.solana.com/address/${base58}`;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger pill — green dot + short address + chevron */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 9999,
          background: 'rgba(17,14,31,0.90)',
          border: dropdownOpen ? '1px solid rgba(153,69,255,0.6)' : '1px solid rgba(153,69,255,0.25)',
          color: '#F8F6FF', fontSize: 13, fontWeight: 600,
          fontFamily: '"JetBrains Mono", monospace',
          cursor: 'pointer', backdropFilter: 'blur(12px)',
          boxShadow: dropdownOpen ? '0 0 18px rgba(153,69,255,0.25)' : 'none',
          transition: 'border-color .15s, box-shadow .15s',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#14F195', display: 'inline-block', flexShrink: 0 }} />
        {short}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8888BB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown — Veztra layout */}
      {dropdownOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 260, zIndex: 9999,
          background: 'rgba(13,10,25,0.97)',
          border: '1px solid rgba(153,69,255,0.25)',
          borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 28px rgba(153,69,255,0.12)',
          backdropFilter: 'blur(24px)',
          overflow: 'hidden',
          fontFamily: '"DM Sans", system-ui, sans-serif',
        }}>
          {/* Header — CONNECTED + full address */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(160,154,191,.6)', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Connected
            </p>
            <p style={{ fontSize: 11, color: '#F8F6FF', fontFamily: '"JetBrains Mono", monospace', wordBreak: 'break-all', margin: 0, lineHeight: 1.55 }}>
              {base58}
            </p>
          </div>

          {/* Actions */}
          <div style={{ padding: '6px' }}>
            {/* Copy Address */}
            <button type="button" onClick={handleCopy}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, background: 'transparent',
                border: 'none', color: copied ? '#14F195' : 'rgba(248,246,255,.75)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                transition: 'background .12s, color .12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <CopyIcon copied={copied} />
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            {/* View on Explorer */}
            <a href={explorerHref} target="_blank" rel="noopener noreferrer"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                color: 'rgba(248,246,255,.75)', fontSize: 13, fontWeight: 500,
                textDecoration: 'none', transition: 'background .12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <ExternalIcon />
              View on Explorer
            </a>

            {/* Change Wallet */}
            <button type="button" onClick={() => { setVisible(true); setDropdownOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, background: 'transparent',
                border: 'none', color: 'rgba(248,246,255,.75)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                transition: 'background .12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <WalletIcon />
              Change Wallet
            </button>

            {/* Disconnect */}
            <button type="button" onClick={() => { disconnect(); setDropdownOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, background: 'transparent',
                border: 'none', color: '#ef4444',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                transition: 'background .12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <DisconnectIcon />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V22H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16v4" />
      <path d="M22 12h-4a2 2 0 1 0 0 4h4v-4z" />
    </svg>
  );
}

function DisconnectIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
