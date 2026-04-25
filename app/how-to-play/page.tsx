import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Play — BlockBite Web3',
  description: 'Learn how to play BlockBite Web3, understand tokenomics, and maximize your chances of winning USDC prizes.',
};

const FAQ = [
  {
    q: 'Is this gambling?',
    a: 'No. BlockBite is a skill-based game — your outcome depends entirely on your ability to play the game well, not random chance. The same legal framework applies as competitive esports tournaments.',
  },
  {
    q: 'How are prizes distributed?',
    a: 'On the 1st of each month at 00:00 UTC, a Solana smart contract automatically distributes USDC to the top 10 players\' wallets. The process is fully transparent and visible on Solana Explorer.',
  },
  {
    q: 'What if I disconnect during a game?',
    a: 'Your ticket is consumed at the start of the session. If you disconnect, the ticket is burned (anti-cheat). Your score up to that point is saved.',
  },
  {
    q: 'Can I use the same ticket multiple times?',
    a: 'No. One ticket = one session. However, you can buy multiple tickets and your best score of the week counts for the leaderboard.',
  },
  {
    q: 'How does the referral system work?',
    a: 'You get a unique referral link. Anyone who signs up and buys tickets through your link gives you 5% of every ticket they ever buy — forever.',
  },
  {
    q: 'Is the smart contract audited?',
    a: 'The Solana program will be professionally audited before Mainnet launch. During Devnet, the code is open-source and verifiable by anyone.',
  },
];

export default function HowToPlayPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: '100vh', paddingBottom: 80 }}>
        <div className="container" style={{ maxWidth: 800 }}>

          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h1 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 900,
              marginBottom: 12,
            }}>
              📖 <span className="neon-cyan">How to Play</span>
            </h1>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              color: '#8888BB',
              maxWidth: 480,
              margin: '0 auto',
            }}>
              Everything you need to know to play BlockBite Web3 and start winning USDC.
            </p>
          </div>

          {/* Game Mechanics */}
          <section style={{ marginBottom: 56 }}>
            <h2 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 20,
              color: '#00F5FF',
              marginBottom: 24,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(0,245,255,0.15)',
            }}>
              🎮 Game Mechanics
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  title: '8×8 Grid Board',
                  icon: '⬛',
                  content: 'The game board is 8 columns × 8 rows = 64 cells. You place pieces on this board.',
                },
                {
                  title: '3-Piece Tray',
                  icon: '🧩',
                  content: 'Three pieces are always available at the bottom. Select one (click or press 1/2/3) then click the board to place it. Pieces cannot be rotated.',
                },
                {
                  title: 'Line Clearing',
                  icon: '💥',
                  content: 'When a full row (8 blocks) or full column (8 blocks) is completed, it gets cleared. Both can happen simultaneously — that\'s a COMBO and earns multiplier bonuses.',
                },
                {
                  title: 'No Gravity',
                  icon: '🚀',
                  content: 'Unlike Tetris, blocks do NOT fall after a clear. Only the cleared row/column disappears. Remaining blocks stay in place.',
                },
                {
                  title: 'Game Over',
                  icon: '💀',
                  content: 'Game over when none of the 3 available pieces can fit anywhere on the board. No more moves = session ends.',
                },
              ].map(item => (
                <div key={item.title} style={{
                  display: 'flex',
                  gap: 16,
                  background: 'rgba(18,18,42,0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '16px 20px',
                }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 14,
                      color: '#FFFFFF',
                      marginBottom: 6,
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 14,
                      color: '#8888BB',
                      lineHeight: 1.6,
                    }}>
                      {item.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Scoring */}
          <section style={{ marginBottom: 56 }}>
            <h2 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 20,
              color: '#00FF88',
              marginBottom: 24,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(0,255,136,0.15)',
            }}>
              📊 Scoring System
            </h2>
            <div style={{
              background: 'rgba(18,18,42,0.8)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 20,
            }}>
              {[
                { clear: 'Single (1 line)', mult: '×1.0', pts: '80 pts', color: '#8888BB' },
                { clear: 'Double (2 lines)', mult: '×1.5', pts: '240 pts', color: '#00F5FF' },
                { clear: 'Triple (3 lines)', mult: '×2.0', pts: '480 pts', color: '#00FF88' },
                { clear: 'Quad (4 lines)', mult: '×3.0', pts: '960 pts', color: '#FFD700' },
                { clear: 'Penta (5+ lines)', mult: '×5.0', pts: '2,000+ pts', color: '#FF00FF' },
                { clear: 'Perfect Board', mult: '×10 next', pts: '+5,000 BONUS', color: '#FF6B00' },
              ].map((row, i) => (
                <div key={row.clear} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  padding: '12px 20px',
                  borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 14,
                    color: '#CCCCCC',
                  }}>{row.clear}</span>
                  <span style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 14,
                    fontWeight: 700,
                    color: row.color,
                    marginRight: 24,
                    textShadow: `0 0 10px ${row.color}60`,
                  }}>{row.mult}</span>
                  <span style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 13,
                    color: '#8888BB',
                    minWidth: 100,
                    textAlign: 'right',
                  }}>{row.pts}</span>
                </div>
              ))}
            </div>
            <div style={{
              background: 'rgba(0,245,255,0.04)',
              border: '1px solid rgba(0,245,255,0.1)',
              borderRadius: 12,
              padding: '16px 20px',
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 12,
                color: '#00F5FF',
                marginBottom: 8,
              }}>🔗 CHAIN BONUS</div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 14,
                color: '#8888BB',
                lineHeight: 1.6,
              }}>
                Clear lines in consecutive placements to build a chain:<br />
                • 2 consecutive: +20% to active multiplier<br />
                • 3 consecutive: +50% to active multiplier<br />
                • 5+ consecutive: +100% (double) to active multiplier<br />
                Chain resets if any placement doesn't result in a clear.
              </div>
            </div>
          </section>

          {/* Tokenomics */}
          <section style={{ marginBottom: 56 }}>
            <h2 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 20,
              color: '#FFD700',
              marginBottom: 24,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(255,215,0,0.15)',
            }}>
              💰 Tokenomics & Prize Pool
            </h2>
            <div style={{
              background: 'rgba(18,18,42,0.8)',
              border: '1px solid rgba(255,215,0,0.1)',
              borderRadius: 16,
              padding: '24px',
              marginBottom: 20,
            }}>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 14,
                color: '#8888BB',
                marginBottom: 16,
                lineHeight: 1.6,
              }}>
                Every USDC spent on tickets is split automatically by the Solana smart contract:
              </div>
              {[
                { pct: 70, label: 'Prize Pool → Distributed to Top 100 players on the 1st of each month', color: '#00FF88', bar: 70 },
                { pct: 15, label: 'Team Revenue → Development & operations', color: '#00F5FF', bar: 15 },
                { pct: 10, label: 'Dev Fund → Smart contract audits, marketing, infrastructure', color: '#FF00FF', bar: 10 },
                { pct: 5,  label: 'Referral Pool → Rewarded to referrers', color: '#FFD700', bar: 5 },
              ].map(item => (
                <div key={item.pct} style={{ marginBottom: 12 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}>
                    <span style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 13,
                      color: '#CCCCCC',
                    }}>{item.label}</span>
                    <span style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      color: item.color,
                    }}>{item.pct}%</span>
                  </div>
                  <div style={{
                    height: 6,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${item.bar}%`,
                      background: item.color,
                      borderRadius: 3,
                      boxShadow: `0 0 8px ${item.color}`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 20,
              color: '#FF00FF',
              marginBottom: 24,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(255,0,255,0.15)',
            }}>
              ❓ FAQ
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FAQ.map(faq => (
                <details key={faq.q} style={{
                  background: 'rgba(18,18,42,0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '0',
                  overflow: 'hidden',
                }}>
                  <summary style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    listStyle: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none',
                  }}>
                    {faq.q}
                    <span style={{ color: '#00F5FF', fontSize: 18, flexShrink: 0 }}>+</span>
                  </summary>
                  <div style={{
                    padding: '0 20px 16px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 14,
                    color: '#8888BB',
                    lineHeight: 1.7,
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    marginTop: 0,
                    paddingTop: 14,
                  }}>
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div style={{
            textAlign: 'center',
            marginTop: 56,
            padding: '40px',
            background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(255,0,255,0.05))',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
          }}>
            <h3 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 20,
              color: '#FFFFFF',
              marginBottom: 12,
            }}>
              Ready to compete?
            </h3>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: '#8888BB',
              marginBottom: 24,
            }}>
              Try the game for free in Phase 0 preview, or buy tickets to enter the leaderboard.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/game" className="btn btn-primary btn-lg">▶ Play Free Preview</a>
              <a href="/shop" className="btn btn-secondary btn-lg">🎟 Buy Tickets</a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
