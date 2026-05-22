'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GameCanvas from '@/components/game/GameCanvas';
import PrizePoolCounter from '@/components/PrizePoolCounter';
import Countdown from '@/components/Countdown';
import { BIOMES } from '@/lib/game/biomes';

const biome = BIOMES[0]; // Act I — Crystal Caverns (tutorial biome)

export default function TutorialPage() {
  const router = useRouter();

  return (
    <>
      {/* Biome backdrop — same system as /play/[level] */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -2,
          background: biome.sky, overflow: 'hidden', pointerEvents: 'none',
        }}
      />
      {/* Fog tint */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -1,
          background: biome.fog, pointerEvents: 'none',
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -1,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 40%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />

      <Navbar />
      <main style={{ paddingTop: 64, minHeight: '100vh' }}>

        {/* Top breadcrumb bar */}
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '12px 24px 0',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <button
            type="button"
            onClick={() => router.push('/map/1')}
            style={{
              padding: '7px 16px', borderRadius: 10,
              border: `1px solid ${biome.accent}44`,
              background: 'rgba(255,255,255,0.05)', color: biome.glow,
              fontFamily: "'Orbitron', monospace", fontSize: 11,
              cursor: 'pointer', letterSpacing: '0.06em',
            }}
          >
            ← BACK TO MAP
          </button>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: 13,
            color: biome.glow, fontWeight: 700,
          }}>
            TUTORIAL
          </span>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: 10,
            color: '#cbd5e1', opacity: 0.7, letterSpacing: '0.2em',
            padding: '4px 10px', borderRadius: 999,
            background: `${biome.accent}22`,
            border: `1px solid ${biome.accent}55`,
          }}>
            FREE PREVIEW · NO TICKET REQUIRED
          </span>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: 10,
            color: '#cbd5e1', opacity: 0.7, letterSpacing: '0.2em',
            padding: '4px 10px', borderRadius: 999,
            background: `${biome.accent}22`,
            border: `1px solid ${biome.accent}55`,
          }}>
            ACT I · {biome.name.toUpperCase()}
          </span>
        </div>

        {/* Main 3-column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 24,
          padding: '16px 24px 40px',
          maxWidth: 1100,
          margin: '0 auto',
          alignItems: 'start',
        }}>

          {/* Left sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>

            {/* Prize pool */}
            <div style={{
              background: `linear-gradient(180deg, ${biome.accent}0d 0%, rgba(8,8,22,0.7) 100%)`,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${biome.accent}33`,
              borderRadius: 16,
              padding: '20px',
              textAlign: 'center',
            }}>
              <PrizePoolCounter size="sm" />
            </div>

            {/* Countdown */}
            <div style={{
              background: `linear-gradient(180deg, ${biome.accent}0d 0%, rgba(8,8,22,0.7) 100%)`,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${biome.accent}33`,
              borderRadius: 16,
              padding: '20px',
              textAlign: 'center',
            }}>
              <Countdown size="sm" showLabel={true} />
            </div>

            {/* Scoring guide */}
            <div style={{
              background: `linear-gradient(180deg, ${biome.accent}0d 0%, rgba(8,8,22,0.7) 100%)`,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${biome.accent}33`,
              borderRadius: 16,
              padding: '20px',
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 11, color: biome.accent,
                letterSpacing: '0.08em', marginBottom: 12,
              }}>SCORING GUIDE</div>
              {[
                { label: '1 line',   mult: '×1.0', color: '#8888BB' },
                { label: '2 lines',  mult: '×1.5', color: '#00F5FF' },
                { label: '3 lines',  mult: '×2.0', color: '#00FF88' },
                { label: '4 lines',  mult: '×3.0', color: '#FFD700' },
                { label: '5+ lines', mult: '×5.0', color: '#FF00FF' },
                { label: 'Perfect!', mult: '×10 next', color: '#FF6B00' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: '#8888BB' }}>{row.label}</span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: row.color, fontWeight: 700 }}>{row.mult}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: '#00FF88' }}>
                Consecutive clears: +20% / +50% / +100%
              </div>
            </div>

            {/* CTA: Go to Map */}
            <button
              type="button"
              onClick={() => router.push('/map/1')}
              style={{
                display: 'block', width: '100%', textAlign: 'center', padding: '13px 16px',
                background: `linear-gradient(135deg, ${biome.accent}, ${biome.glow})`,
                border: 'none',
                borderRadius: 12, color: '#000', fontWeight: 800, fontSize: 13,
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '0.06em',
              }}
            >
              PLAY ON MAP → ACT I
            </button>
          </div>

          {/* Game Canvas — Center, biome-themed frame */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              padding: 14,
              borderRadius: 24,
              background: `linear-gradient(180deg, ${biome.accent}1a 0%, rgba(8,8,22,0.55) 60%)`,
              border: `1px solid ${biome.accent}66`,
            }}>
              <GameCanvas />
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>

            {/* Quick tips */}
            <div style={{
              background: `linear-gradient(180deg, ${biome.accent}0d 0%, rgba(8,8,22,0.7) 100%)`,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${biome.accent}33`,
              borderRadius: 16, padding: '20px',
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace", fontSize: 11, color: biome.accent,
                letterSpacing: '0.08em', marginBottom: 12,
              }}>QUICK TIPS</div>
              {[
                'Press 1/2/3 to select a piece',
                'Click the board to place it',
                'Clear lines in sequence for chain bonus',
                'Clear rows AND columns simultaneously for combos',
                'Empty the board for PERFECT BOARD +5000 pts',
                'Bigger pieces = more bonus points',
              ].map((tip, i) => (
                <div key={i} style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: '#8888BB',
                  padding: '5px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  lineHeight: 1.4,
                }}>{tip}</div>
              ))}
            </div>

            {/* Biome info */}
            <div style={{
              background: `linear-gradient(135deg, ${biome.accent}10, ${biome.glow}10)`,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${biome.accent}33`,
              borderRadius: 16, padding: '20px',
            }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: biome.accent, marginBottom: 8 }}>
                ACT I — {biome.name.toUpperCase()}
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: '#8888BB', lineHeight: 1.6, marginBottom: 12 }}>
                This is a free preview of Act I. Play without a wallet to learn the mechanics.
                Connect to save your score and climb the map.
              </div>
              <button
                type="button"
                onClick={() => router.push('/map/1')}
                style={{
                  display: 'block', width: '100%', textAlign: 'center', padding: '10px 0',
                  background: `linear-gradient(135deg, ${biome.accent}, ${biome.glow})`,
                  border: 'none',
                  borderRadius: 10, color: '#000', fontWeight: 800, fontSize: 12,
                  cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                ENTER MAP → LEVEL 1
              </button>
            </div>

            {/* Prizes CTA */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(255,0,255,0.05))',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,245,255,0.1)',
              borderRadius: 16, padding: '20px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: '#00F5FF', marginBottom: 8 }}>
                COMPETE FOR PRIZES
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: '#8888BB', marginBottom: 16, lineHeight: 1.5 }}>
                Buy a ticket to make your score count on the official leaderboard and compete for USDC prizes.
              </div>
              <a href="/shop" style={{
                display: 'block', padding: '10px 0', textAlign: 'center',
                background: 'linear-gradient(135deg, #00F5FF, #FF00FF)',
                borderRadius: 10, color: '#000', fontWeight: 800, fontSize: 13,
                textDecoration: 'none', fontFamily: "'Space Grotesk', sans-serif",
              }}>
                Get Tickets →
              </a>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 900px) {
          main > div:last-child { grid-template-columns: 1fr !important; }
          main > div:last-child > div:first-child,
          main > div:last-child > div:last-child { display: none !important; }
        }
      `}</style>
    </>
  );
}
