'use client';

import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GameCanvas from '@/components/game/GameCanvas';
import { BIOMES } from '@/lib/game/biomes';

export default function PlayLevelPage() {
  const params = useParams<{ level: string }>();
  const level = Math.max(1, parseInt(params.level || '1', 10));
  const router = useRouter();

  // Pick the biome that owns this level so the in-game backdrop matches the
  // map theme the player just came from (Crystal/Frost/Ember/.../Apex).
  const biome = BIOMES.find(b => level >= b.range[0] && level <= b.range[1]) ?? BIOMES[0];

  return (
    <>
      {/* Biome-themed full-screen backdrop — sits behind everything. */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -1,
          background: biome.sky,
          overflow: 'hidden',
        }}
      >
        {/* Atmospheric fog overlay tinted by biome */}
        <div style={{ position: 'absolute', inset: 0, background: biome.fog }} />
        {/* Soft accent halo */}
        <div style={{
          position: 'absolute', left: '50%', top: '30%',
          transform: 'translate(-50%, -50%)',
          width: '80vw', height: '80vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${biome.accent}22 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />
      </div>

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
