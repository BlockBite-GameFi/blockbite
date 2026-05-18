'use client';
/**
 * Route-level error boundary for /play/[level].
 *
 * Mirrors /map/[act]/error.tsx. Without this, an uncaught throw inside
 * GameCanvas (canvas allocation, useGameEngine init, wallet adapter
 * hydration on a janky mobile browser, etc.) propagates up and Next.js
 * renders a blank "Application error" page — exactly what we just saw
 * on a tablet: gray void with a broken-page icon and zero recovery
 * path for the user.
 *
 * This fallback gives the user a Try Again button + a route home, so
 * they're never stranded.
 */

import { useEffect } from 'react';
import Link from 'next/link';

export default function PlayLevelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[play/[level]] route error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, #1a1a3e 0%, #08081a 100%)',
      color: '#fff', fontFamily: "'Space Grotesk', system-ui, sans-serif",
      padding: 24,
    }}>
      <div style={{
        maxWidth: 480, width: '100%',
        background: 'rgba(8,8,22,0.7)',
        border: '1px solid rgba(167,139,250,0.3)',
        borderRadius: 18, padding: 28, textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#a78bfa', marginBottom: 8 }}>
          LEVEL HICCUP
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, marginBottom: 10 }}>
          Something tripped while loading this level.
        </h1>
        <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 22 }}>
          Usually a transient browser issue (low memory, canvas allocation
          refused). Reload almost always fixes it. If not, try the map.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={reset}
            style={{
              padding: '12px 18px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #a78bfa, #7dd3fc)',
              color: '#0a0a14', fontWeight: 800, fontSize: 14, cursor: 'pointer',
              letterSpacing: 0.5,
            }}
          >
            TRY AGAIN
          </button>
          <Link href="/map/1" style={{
            padding: '12px 18px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none',
            letterSpacing: 0.5,
          }}>
            BACK TO MAP
          </Link>
          <Link href="/" style={{
            color: '#94a3b8', fontSize: 12, marginTop: 6, textDecoration: 'underline',
          }}>
            Back to home
          </Link>
        </div>
        {error?.digest && (
          <div style={{
            marginTop: 18, fontSize: 10, color: '#64748b',
            fontFamily: 'monospace', opacity: 0.6,
          }}>
            digest: {error.digest}
          </div>
        )}
      </div>
    </div>
  );
}
