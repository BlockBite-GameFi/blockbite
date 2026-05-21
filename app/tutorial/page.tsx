import Navbar from '@/components/Navbar';
import GameCanvas from '@/components/game/GameCanvas';
import PrizePoolCounter from '@/components/PrizePoolCounter';
import Countdown from '@/components/Countdown';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tutorial — BlockBite Free Preview',
  description: 'Try BlockBite for free. No ticket required. Learn the mechanics before you compete for USDC prizes on Solana.',
};

export default function TutorialPage() {
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>

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
                fontSize: 11, color: '#55557A',
                letterSpacing: '0.08em', marginBottom: 12,
              }}>SCORING GUIDE</div>
              {[
                { label: '1 line',  mult: '×1.0', color: '#8888BB' },
                { label: '2 lines', mult: '×1.5', color: '#00F5FF' },
                { label: '3 lines', mult: '×2.0', color: '#00FF88' },
                { label: '4 lines', mult: '×3.0', color: '#FFD700' },
                { label: '5+ lines',mult: '×5.0', color: '#FF00FF' },
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

            {/* Go to map */}
            <a href="/map" style={{
              display: 'block', textAlign: 'center', padding: '12px 16px',
              background: 'linear-gradient(135deg, #7c80e8, #b12c84)',
              borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 13,
              textDecoration: 'none', fontFamily: "'Space Grotesk', sans-serif",
            }}>
              PLAY WITH SCORE → MAP
            </a>
          </div>

          {/* Game Canvas — Center */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 style={{
                fontFamily: "'Orbitron', monospace", fontSize: 16,
                fontWeight: 700, color: '#00F5FF', margin: 0,
              }}>TUTORIAL</h1>
              <span style={{
                background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)',
                borderRadius: 99, padding: '3px 10px',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: '#8888BB',
              }}>
                Phase 0 · No ticket required
              </span>
            </div>
            <GameCanvas />
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>

            {/* Quick tips */}
            <div style={{
              background: 'rgba(18,18,42,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: '20px',
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace", fontSize: 11, color: '#55557A',
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

            {/* Oracle explanation */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(124,128,232,0.08), rgba(177,44,132,0.08))',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(124,128,232,0.2)',
              borderRadius: 16, padding: '20px',
            }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: '#7c80e8', marginBottom: 8 }}>
                HOW THIS CONNECTS TO TDP
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: '#8888BB', lineHeight: 1.6, marginBottom: 12 }}>
                Leveling up here writes a proof to the on-chain ProofCache PDA.
                Vesting streams with required_tier &gt; 0 check this proof before releasing tokens.
              </div>
              <a href="/distribute" style={{
                display: 'block', textAlign: 'center', padding: '10px 0',
                background: 'linear-gradient(135deg, #3d7c91, #e1a438)',
                borderRadius: 10, color: '#000', fontWeight: 800, fontSize: 12,
                textDecoration: 'none', fontFamily: "'Space Grotesk', sans-serif",
              }}>
                CREATE STREAM → /distribute
              </a>
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
                Get Tickets
              </a>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 900px) {
          main > div { grid-template-columns: 1fr !important; }
          main > div > div:first-child,
          main > div > div:last-child { display: none !important; }
        }
      `}</style>
    </>
  );
}
