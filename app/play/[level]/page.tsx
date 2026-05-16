'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import GameCanvas from '@/components/game/GameCanvas';
import { BIOMES, type Biome } from '@/lib/game/biomes';

// Real-time 3D backdrop, same component the map page uses. Client-only —
// no SSR, no hydration mismatch.
const BiomeScene3D = dynamic(() => import('@/lib/components/BiomeScene3D'), {
  ssr: false,
});

/** Deferred + WebGL-probed mount, with localStorage kill switch. */
function Backdrop3D({ biome, progress }: { biome: Biome; progress: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('bb_3d_disabled') === '1') return;
    try {
      const probe = document.createElement('canvas');
      const ctx =
        probe.getContext('webgl2') ||
        probe.getContext('webgl') ||
        (probe as HTMLCanvasElement & { getContext(t: string): unknown }).getContext('experimental-webgl');
      if (!ctx) return;
    } catch { return; }
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return <BiomeScene3D biome={biome} progress={progress} />;
}

export default function PlayLevelPage() {
  const params = useParams<{ level: string }>();
  const level = Math.max(1, parseInt(params.level || '1', 10));
  const router = useRouter();

  // Pick the biome that owns this level so the in-game backdrop matches the
  // map theme the player just came from (Crystal/Frost/Ember/.../Apex).
  const biome = BIOMES.find(b => level >= b.range[0] && level <= b.range[1]) ?? BIOMES[0];
  const progress = Math.max(
    0,
    Math.min(1, (level - biome.range[0]) / Math.max(1, biome.range[1] - biome.range[0])),
  );

  return (
    <>
      {/* Real-time 3D biome backdrop — fixed behind the entire game UI so
          the canvas always plays "inside" the act's landscape. Pointer
          events disabled so it never blocks game controls. */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -2,
          background: biome.sky, overflow: 'hidden', pointerEvents: 'none',
        }}
      >
        <Backdrop3D biome={biome} progress={progress} />
      </div>
      {/* Vignette + biome fog tint above the 3D layer for legibility. */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -1,
          background: biome.fog, pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -1,
          background: `radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 40%, rgba(0,0,0,0.55) 100%)`,
          pointerEvents: 'none',
        }}
      />

      <Navbar />
      <main style={{ paddingTop: 64, minHeight: '100vh' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '12px 24px 0',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '7px 16px', borderRadius: 10,
              border: `1px solid ${biome.accent}44`,
              background: 'rgba(255,255,255,0.05)', color: biome.glow,
              fontFamily: "'Orbitron', monospace", fontSize: 11,
              cursor: 'pointer', letterSpacing: '0.06em',
            }}
          >
            BACK TO MAP
          </button>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: 13,
            color: biome.glow, fontWeight: 700,
          }}>
            LEVEL {level.toLocaleString()}
          </span>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: 10,
            color: '#cbd5e1', opacity: 0.7, letterSpacing: '0.2em',
            padding: '4px 10px', borderRadius: 999,
            background: `${biome.accent}22`,
            border: `1px solid ${biome.accent}55`,
          }}>
            ACT {['I','II','III','IV','V','VI','VII','VIII'][biome.act - 1]} · {biome.name.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 24px 40px' }}>
          <GameCanvas initialLevel={level} onBack={() => router.back()} />
        </div>
      </main>
    </>
  );
}
