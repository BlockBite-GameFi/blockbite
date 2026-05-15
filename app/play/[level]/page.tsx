'use client';

import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GameCanvas from '@/components/game/GameCanvas';

export default function PlayLevelPage() {
  const params = useParams<{ level: string }>();
  const level = Math.max(1, parseInt(params.level || '1', 10));
  const router = useRouter();

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64, minHeight: '100vh' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '12px 24px 0',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '7px 16px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)', color: '#8888BB',
              fontFamily: "'Orbitron', monospace", fontSize: 11,
              cursor: 'pointer', letterSpacing: '0.06em',
            }}
          >
            BACK TO MAP
          </button>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: 13,
            color: '#00F5FF', fontWeight: 700,
          }}>
            LEVEL {level}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 24px 40px' }}>
          <GameCanvas initialLevel={level} onBack={() => router.back()} />
        </div>
      </main>
    </>
  );
}
