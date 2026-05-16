import Navbar from '@/components/Navbar';
import GameCanvas from '@/components/game/GameCanvas';
import PrizePoolCounter from '@/components/PrizePoolCounter';
import Countdown from '@/components/Countdown';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Play BlockBite — Compete for USDC Prizes on Solana',
  description: 'Play BlockBite and compete for the monthly USDC prize pool on Solana. Skill-based arcade GameFi. Top 10 win real prizes.',
};

export default function GamePage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64, minHeight: '100vh' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 24,
          padding: '24px 24px',
          maxWidth: 1100,
          margin: '0 auto',
          alignItems: 'start',
        }}>
          {/* Left sidebar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            paddingTop: 16,
          }}>
            {/* Prize pool mini */}
            <div style={{
              background: 'rgba(18,18,42,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,215,0,0.12)',
              borderRadius: 16,
              padding: '20px',
              textAlign: 'center',
            }}>
              <PrizePoolCounter size="sm" />
            </div>

            {/* Countdown mini */}
            <div style={{
              background: 'rgba(18,18,42,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '20px',
              textAlign: 'center',
            }}>
              <Countdown size="sm" showLabel={true} />
            </div>

            {/* Scoring guide */}
            <div style={{
              background: 'rgba(18,18,42,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '20px',
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 11,
                color: '#55557A',
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}>
                SCORING GUIDE
              </div>
              {[
                { label: '1 line', pts: '80 pts', mult: '×1.0', color: '#8888BB' },
                { label: '2 lines', pts: '240 pts', mult: '×1.5', color: '#00F5FF' },
                { label: '3 lines', pts: '480 pts', mult: '×2.0', color: '#00FF88' },
                { label: '4 lines', pts: '960 pts', mult: '×3.0', color: '#FFD700' },
                { label: '5+ lines', pts: '2000+', mult: '×5.0', color: '#FF00FF' },
                { label: 'Perfect!', pts: '+5000', mult: '×10 next', color: '#FF6B00' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}>
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 12, color: '#8888BB',
                  }}>{row.label}</span>
                  <span style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 11, color: row.color, fontWeight: 700,
                  }}>{row.mult}</span>
                </div>
              ))}
              <div style={{
                marginTop: 10,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 11,
                color: '#00FF88',
              }}>
                Consecutive clears: +20% / +50% / +100%
              </div>
            </div>
          </div>

          {/* Game Canvas — Center */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 4,
            }}>
              <h1 style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 16,
                fontWeight: 700,
                color: '#00F5FF',
                margin: 0,
              }}>
                FREE PREVIEW
              </h1>
              <span style={{
                background: 'rgba(0,245,255,0.1)',
                border: '1px solid rgba(0,245,255,0.2)',
                borderRadius: 99,
                padding: '3px 10px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 11,
                color: '#8888BB',
              }}>
                Phase 0 · No ticket required
              </span>
            </div>
            <GameCanvas />
          </div>

          {/* Right sidebar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            paddingTop: 16,
          }}>
            {/* Quick tips */}
            <div style={{
              background: 'rgba(18,18,42,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '20px',
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 11,
                color: '#55557A',
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}>
                QUICK TIPS
              </div>
              {[
                'Press 1/2/3 to select a piece',
                'Click the board to place it',
                'Clear lines in sequence for chain bonus',
                'Clear rows AND columns simultaneously for combos',
                'Empty the board for PERFECT BOARD +5000 pts',
                'Bigger pieces = more bonus points',
              ].map((tip, i) => (
                <div key={i} style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 12,
                  color: '#8888BB',
                  padding: '5px 0',
                  borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  lineHeight: 1.4,
                }}>
                  {tip}
                </div>
              ))}
            </div>

            {/* Prizes CTA */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(255,0,255,0.05))',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,245,255,0.1)',
              borderRadius: 16,
              padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 13,
                color: '#00F5FF',
                marginBottom: 8,
              }}>
                COMPETE FOR PRIZES
              </div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                color: '#8888BB',
                marginBottom: 16,
                lineHeight: 1.5,
              }}>
                Buy a ticket to make your score count on the official leaderboard and compete for USDC prizes.
              </div>
              <a href="/shop" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                Get Tickets →
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile layout fix */}
      <style>{`
        @media (max-width: 900px) {
          main > div {
            grid-template-columns: 1fr !important;
          }
          main > div > div:first-child,
          main > div > div:last-child {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
