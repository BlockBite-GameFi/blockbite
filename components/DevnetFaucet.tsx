'use client';
/**
 * DevnetTools — Devnet token funding panel.
 * Compact, professional. Only visible on devnet.
 */

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { T } from '@/lib/theme';

const ASSETS = [
  { id: 'SOL',  label: '0.5 SOL',      sub: 'native' },
  { id: 'WSOL', label: '1 wSOL',        sub: 'wrapped' },
  { id: 'BBT',  label: '10,000 BBT',    sub: 'devnet' },
  { id: 'USDC', label: '100 USDC',      sub: 'devnet' },
];

export default function DevnetFaucet({ onReceived }: { onReceived?: () => void }) {
  const { publicKey } = useWallet();
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; sig?: string; err?: string }>>({});

  async function fund(asset: string) {
    if (!publicKey) return;
    setLoading(asset);
    try {
      const res = await fetch('/api/faucet/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toBase58(), asset }),
      });
      const data = await res.json();
      if (data.sig) {
        setResults(r => ({ ...r, [asset]: { ok: true, sig: data.sig } }));
        onReceived?.();
      } else {
        setResults(r => ({ ...r, [asset]: { ok: false, err: data.error } }));
      }
    } catch {
      setResults(r => ({ ...r, [asset]: { ok: false, err: 'Request failed' } }));
    } finally {
      setLoading(null);
    }
  }

  if (!publicKey) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
          background: 'transparent',
          border: `1px solid ${T.border}`,
          color: T.textDim, cursor: 'pointer', fontFamily: "'Space Grotesk', system-ui",
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all .15s',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#14F195', flexShrink: 0 }} />
        Devnet Tools
        <span style={{ color: T.textDim, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          marginTop: 8, padding: '14px 16px', borderRadius: 10,
          background: T.bg1, border: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: 11, color: T.textDim, marginBottom: 12 }}>
            Fund wallet with devnet tokens for testing
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {ASSETS.map(a => {
              const r = results[a.id];
              const busy = loading === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => fund(a.id)}
                  disabled={busy || !!loading || r?.ok}
                  title={r?.sig ? `Tx: ${r.sig.slice(0,20)}…` : r?.err ?? ''}
                  style={{
                    padding: '8px', borderRadius: 7, cursor: r?.ok || !!loading ? 'default' : 'pointer',
                    background: r?.ok ? 'rgba(20,241,149,.06)' : 'rgba(255,255,255,.03)',
                    border: `1px solid ${r?.ok ? '#14F195' : r?.err ? T.red : T.border}`,
                    color: r?.ok ? '#14F195' : r?.err ? T.red : T.text,
                    fontSize: 11, fontWeight: 600, textAlign: 'center',
                    opacity: loading && !busy ? 0.4 : 1,
                    transition: 'all .12s',
                    fontFamily: "'Space Grotesk', system-ui",
                  }}
                >
                  <div>{busy ? '…' : r?.ok ? '✓' : a.label}</div>
                  <div style={{ fontSize: 9, color: r?.ok ? '#14F195' : T.textDim, marginTop: 2 }}>{a.sub}</div>
                </button>
              );
            })}
          </div>
          {Object.values(results).some(r => r.ok) && (
            <div style={{ fontSize: 10, color: '#14F195', marginTop: 8 }}>
              Tokens sent — re-open token selector to see updated balance
            </div>
          )}
        </div>
      )}
    </div>
  );
}
