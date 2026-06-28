'use client';
/**
 * Universal Token Selector
 * - Reads ALL tokens from connected wallet on-chain
 * - Shows devnet/mainnet popular tokens
 * - Custom mint input with auto-fetch from chain
 * - Works mainnet, devnet, testnet, wrapped tokens, any SPL
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { T } from '@/lib/theme';
import {
  fetchWalletTokens, fetchMintInfo, WalletToken,
  KNOWN_DEVNET_TOKENS, KNOWN_MAINNET_TOKENS,
} from '@/lib/solana/token-registry';

interface TokenSelectorProps {
  value:     string;   // selected mint address
  onChange:  (mint: string, decimals: number, symbol: string) => void;
  isDevnet?: boolean;
  error?:    string;
}

const POPULAR_DEVNET = Object.entries(KNOWN_DEVNET_TOKENS).map(([mint, info]) => ({ mint, ...info, balance: 0n, balanceUI: 0, ata: '', isKnown: true }));
const POPULAR_MAINNET = Object.entries(KNOWN_MAINNET_TOKENS).map(([mint, info]) => ({ mint, ...info, balance: 0n, balanceUI: 0, ata: '', isKnown: true }));

export default function TokenSelector({ value, onChange, isDevnet = true, error }: TokenSelectorProps) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [open,          setOpen]          = useState(false);
  const [walletTokens,  setWalletTokens]  = useState<WalletToken[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [customMint,    setCustomMint]    = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [customError,   setCustomError]   = useState('');
  const [search,        setSearch]        = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch wallet tokens when opened — with 8s timeout and cleanup on re-render
  useEffect(() => {
    if (!open || !publicKey) return;
    let cancelled = false;
    setLoading(true);
    const timeout = new Promise<WalletToken[]>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 8000),
    );
    Promise.race([fetchWalletTokens(connection, publicKey, isDevnet), timeout])
      .then(tokens  => { if (!cancelled) setWalletTokens(tokens); })
      .catch(()     => { if (!cancelled) setWalletTokens([]); })
      .finally(()   => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, publicKey, connection, isDevnet]);

  const popular = isDevnet ? POPULAR_DEVNET : POPULAR_MAINNET;

  // Merge: popular + wallet tokens (deduplicated)
  const walletMints = new Set(walletTokens.map(t => t.mint));
  const popularMissing = popular.filter(t => !walletMints.has(t.mint));
  const allTokens: WalletToken[] = [...walletTokens, ...popularMissing];

  const filtered = allTokens.filter(t =>
    !search ||
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.mint.toLowerCase().includes(search.toLowerCase())
  );

  const selectedToken = allTokens.find(t => t.mint === value);

  async function addCustomMint() {
    if (!customMint.trim()) return;
    setCustomLoading(true);
    setCustomError('');
    try {
      new PublicKey(customMint.trim()); // validate
      const info = await fetchMintInfo(connection, customMint.trim(), isDevnet);
      if (!info) { setCustomError('Mint not found on chain'); return; }
      onChange(customMint.trim(), info.decimals, info.symbol);
      setOpen(false);
      setCustomMint('');
    } catch {
      setCustomError('Invalid mint address');
    } finally {
      setCustomLoading(false);
    }
  }

  function selectToken(t: WalletToken) {
    onChange(t.mint, t.decimals, t.symbol);
    setOpen(false);
    setSearch('');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,.05)',
    border: `1px solid ${error ? T.red : T.border}`,
    color: '#fff', fontSize: 13, outline: 'none',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,.05)',
          border: `1.5px solid ${error ? T.red : open ? T.accent : T.border}`,
          color: '#fff', fontSize: 13, cursor: 'pointer',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'border-color .15s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selectedToken ? (
            <>
              <span style={{ fontWeight: 700, color: T.accent }}>{selectedToken.symbol}</span>
              <span style={{ color: T.textDim, fontSize: 11 }}>{selectedToken.name}</span>
              {selectedToken.balanceUI > 0 && (
                <span style={{ color: T.green, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
                  bal: {selectedToken.balanceUI.toLocaleString()}
                </span>
              )}
            </>
          ) : (
            <span style={{ color: T.textDim }}>Select token…</span>
          )}
        </span>
        <span style={{ color: T.textDim, fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: '#0e0c22', border: `1.5px solid ${T.accent}44`,
          borderRadius: 14, boxShadow: `0 8px 40px ${T.accent}22`,
          maxHeight: 440, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.border}` }}>
            <input
              autoFocus
              placeholder="Search symbol, name, or paste mint address…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, padding: '8px 12px', fontSize: 12 }}
            />
          </div>

          {/* Token list — popular tokens render immediately; wallet balances update silently */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: 260 }}>
            {filtered.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: T.textDim, fontSize: 12 }}>
                No tokens found
              </div>
            )}
            {filtered.map(t => (
              <button
                key={t.mint}
                type="button"
                onClick={() => selectToken(t)}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: t.mint === value ? `${T.accent}12` : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: `1px solid ${T.border}22`,
                  color: '#fff',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = `${T.accent}18`)}
                onMouseLeave={e => (e.currentTarget.style.background = t.mint === value ? `${T.accent}12` : 'transparent')}
              >
                <div>
                  <span style={{ fontWeight: 700, color: t.isKnown ? T.accent : '#fff', marginRight: 8 }}>
                    {t.symbol}
                  </span>
                  <span style={{ fontSize: 11, color: T.textDim }}>{t.name}</span>
                  <div style={{ fontSize: 10, color: T.textDim, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                    {t.mint.slice(0, 12)}…
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {t.balanceUI > 0 && (
                    <div style={{ fontSize: 12, color: T.green, fontFamily: 'JetBrains Mono, monospace' }}>
                      {t.balanceUI.toLocaleString()}
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: T.textDim }}>{t.decimals} decimals</div>
                </div>
              </button>
            ))}
          </div>

          {/* Custom mint section */}
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${T.border}`, background: '#08060f' }}>
            <div style={{ fontSize: 10, color: T.textDim, marginBottom: 6, letterSpacing: '.05em', textTransform: 'uppercase' }}>
              + Add any SPL token mint
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                placeholder="Paste mint address (mainnet / devnet / testnet / wrapped)…"
                value={customMint}
                onChange={e => { setCustomMint(e.target.value); setCustomError(''); }}
                onKeyDown={e => e.key === 'Enter' && addCustomMint()}
                style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: 11 }}
              />
              <button
                type="button"
                onClick={addCustomMint}
                disabled={customLoading || !customMint.trim()}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: T.accent, color: '#fff', fontWeight: 700, fontSize: 12,
                  opacity: customLoading || !customMint.trim() ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {customLoading ? '…' : 'Add'}
              </button>
            </div>
            {customError && (
              <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>{customError}</div>
            )}
          </div>
        </div>
      )}

      {error && <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>{error}</div>}
    </div>
  );
}
