'use client';
/**
 * WalletTracker — fires once per 24 h per wallet address per browser whenever
 * a Solana wallet is connected. Must be rendered inside WalletProvider
 * (i.e. inside AppWalletProvider).
 *
 * Dedup strategy: localStorage key `bb_wc_<first12>` stores the Unix-ms
 * timestamp of the last tracked event.  A new event is written only when
 * the stored timestamp is absent or older than 24 h.  localStorage (vs
 * sessionStorage) prevents the same wallet being double-counted across
 * multiple open tabs in the same browser.
 *
 * Privacy: only the first 6 + last 4 chars of the address are stored
 * (e.g. "Ab3xYz…kR9q"). Full address is never sent to the server.
 */
import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePathname } from 'next/navigation';

const DEDUP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function WalletTracker() {
  const { connected, publicKey, wallet } = useWallet();
  const pathname = usePathname();
  // in-process guard: prevents firing twice in the same React lifecycle
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) return;

    const address = publicKey.toBase58();

    // Guard 1 — already fired for this address in this React tree lifetime
    if (firedRef.current === address) return;

    // Guard 2 — localStorage 24-h dedup (cross-tab safe, survives tab close)
    const lsKey = `bb_wc_${address.slice(0, 12)}`;
    try {
      const last = localStorage.getItem(lsKey);
      const now  = Date.now();
      if (last && now - parseInt(last, 10) < DEDUP_TTL_MS) return;
      localStorage.setItem(lsKey, String(now));
    } catch { /* private/incognito may block localStorage — continue anyway */ }

    firedRef.current = address;

    // Anonymised address: first 6 + "…" + last 4
    const anon = `${address.slice(0, 6)}…${address.slice(-4)}`;

    fetch('/api/wallet-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anon,
        walletName: wallet?.adapter?.name ?? 'unknown',
        path: pathname,
      }),
    }).catch(() => {}); // fire-and-forget, never crash the page
  }, [connected, publicKey, wallet, pathname]);

  return null;
}
