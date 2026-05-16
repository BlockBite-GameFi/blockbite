'use client';
/**
 * Route-level error boundary for /map/[act].
 *
 * Without this, any uncaught throw in MapScreen / BiomeScene3D / SideCards
 * propagates up and Next.js renders its default error page ("Application
 * error: a client-side exception has occurred"), which is opaque and
 * destroys the whole route.
 *
 * Here we render a small fallback that:
 *   - tells the user what happened
 *   - offers a retry button (resets the error boundary)
 *   - offers a "disable 3D and reload" button that sets the kill switch
 *     localStorage.bb_3d_disabled = '1' (the most common crash source on
 *     low-spec GPUs is the WebGL backdrop)
 *   - links back to / and /game so the user isn't stranded
 */

import { useEffect } from 'react';
import Link from 'next/link';

export default function MapActError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[map/[act]] route error:', error);
  }, [error]);

  const disable3DAndReload = () => {
    try { localStorage.setItem('bb_3d_disabled', '1'); } catch { /* ignore */ }
    if (typeof window !== 'undefined') window.location.reload();
  };

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
        background: 'rgba(8,8,22,0.7)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(167,139,250,0.3)',
        borderRadius: 18, padding: 28,
        textAlign: 'center', boxShadow: '0 8px 40px rgba(167,139,250,0.15)',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#a78bfa', marginBottom: 8 }}>
          MAP HICCUP
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, marginBottom: 10 }}>
          Something tripped while loading this act.
        </h1>
        <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 22 }}>
          Most often this happens when a browser refuses to start the WebGL
          backdrop. The game itself still works — try one of these:
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
          <button
            onClick={disable3DAndReload}
            style={{
              padding: '12px 18px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              letterSpacing: 0.5,
            }}
          >
            DISABLE 3D BACKDROP &amp; RELOAD
          </button>
          <Link href="/game" style={{
            padding: '12px 18px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent', color: '#cbd5e1',
            fontWeight: 700, fontSize: 13, textDecoration: 'none',
            letterSpacing: 0.5,
          }}>
            PLAY FREE PREVIEW INSTEAD
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
