'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import PrizePoolCounter from '@/components/PrizePoolCounter';
import Countdown from '@/components/Countdown';
import {
  MOCK_LEADERBOARD,
  MOCK_PRIZE_POOL_USDC,
  PRIZE_DISTRIBUTION,
} from '@/lib/game/constants';

const TABS = ['Weekly', 'All-Time', 'Daily', 'Whale Room'] as const;
type Tab = typeof TABS[number];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Weekly');

  const prizeForRank = (rank: number): number => {
    if (rank === 1) return MOCK_PRIZE_POOL_USDC * 0.20;
    if (rank === 2) return MOCK_PRIZE_POOL_USDC * 0.12;
    if (rank === 3) return MOCK_PRIZE_POOL_USDC * 0.08;
    if (rank <= 5)  return MOCK_PRIZE_POOL_USDC * 0.05;
    if (rank <= 10) return MOCK_PRIZE_POOL_USDC * 0.03;
    return 0;
  };

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: '100vh', paddingBottom: 80 }}>
        <div className="container">

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 'clamp(28px, 5vw, 52px)',
              fontWeight: 900,
              marginBottom: 12,
            }}>
              🏆 <span className="neon-gold">Leaderboard</span>
            </h1>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
              color: '#8888BB',
              maxWidth: 480,
              margin: '0 auto',
            }}>
              Compete every week for real USDC prizes. Top 100 players share the prize pool.
            </p>
          </div>

          {/* Prize pool + countdown row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            justifyContent: 'center',
            marginBottom: 40,
          }}>
            <div style={{
              background: 'rgba(18,18,42,0.9)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,215,0,0.15)',
              borderRadius: 20,
              padding: '24px 36px',
              textAlign: 'center',
            }}>
              <PrizePoolCounter size="lg" />
            </div>
            <div style={{
              background: 'rgba(18,18,42,0.9)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,245,255,0.1)',
              borderRadius: 20,
              padding: '24px 36px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <Countdown size="lg" showLabel />
            </div>
          </div>

          {/* Prize distribution table */}
          <div style={{
            background: 'rgba(18,18,42,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 32,
          }}>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 12,
              color: '#55557A',
              letterSpacing: '0.08em',
              marginBottom: 16,
            }}>
              PRIZE DISTRIBUTION
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}>
              {PRIZE_DISTRIBUTION.map(tier => (
                <div key={tier.rank} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 12,
                    color: '#8888BB',
                  }}>
                    Rank {tier.rank}
                  </span>
                  <span style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    color: tier.pct >= 10 ? '#FFD700' : tier.pct >= 3 ? '#00F5FF' : '#00FF88',
                  }}>
                    {tier.pct}%
                    <span style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 10,
                      color: '#55557A',
                      fontWeight: 400,
                    }}>
                      {' '}(≈{(MOCK_PRIZE_POOL_USDC * tier.pct / 100).toFixed(0)} USDC)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tab selector */}
          <div style={{
            display: 'flex',
            gap: 4,
            background: 'rgba(18,18,42,0.8)',
            borderRadius: 12,
            padding: 4,
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 20,
            width: 'fit-content',
          }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: 'none',
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeTab === tab
                    ? 'linear-gradient(135deg, #00F5FF, #0088FF)'
                    : 'transparent',
                  color: activeTab === tab ? '#000' : '#8888BB',
                }}
              >
                {tab}
                {tab === 'Whale Room' && (
                  <span style={{ marginLeft: 4 }}>🐋</span>
                )}
              </button>
            ))}
          </div>

          {/* Leaderboard table */}
          <div style={{
            background: 'rgba(18,18,42,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 140px 100px 120px',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              {['Rank', 'Player', 'Score', 'Tickets', 'Est. Reward'].map(col => (
                <div key={col} style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 10,
                  color: '#55557A',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textAlign: col === 'Score' || col === 'Tickets' || col === 'Est. Reward' ? 'right' : 'left',
                }}>
                  {col}
                </div>
              ))}
            </div>

            {/* Rows */}
            {MOCK_LEADERBOARD.map((player, i) => {
              const isTopThree = player.rank <= 3;
              const estimatedReward = player.estimatedReward ?? prizeForRank(player.rank);

              return (
                <div
                  key={player.rank}
                  id={`lb-row-${player.rank}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 140px 100px 120px',
                    padding: '14px 20px',
                    borderBottom: i < MOCK_LEADERBOARD.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: isTopThree
                      ? `rgba(${player.rank === 1 ? '255,215,0' : player.rank === 2 ? '192,192,192' : '205,127,50'}, 0.04)`
                      : 'transparent',
                    transition: 'background 0.15s',
                    alignItems: 'center',
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: isTopThree ? 20 : 14,
                    fontWeight: 800,
                    color: player.rank === 1 ? '#FFD700' : player.rank === 2 ? '#C0C0C0' : player.rank === 3 ? '#CD7F32' : '#55557A',
                    textShadow: isTopThree
                      ? `0 0 20px ${player.rank === 1 ? 'rgba(255,215,0,0.5)' : player.rank === 2 ? 'rgba(192,192,192,0.4)' : 'rgba(205,127,50,0.4)'}`
                      : 'none',
                  }}>
                    #{player.rank}
                  </div>

                  {/* Player */}
                  <div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: isTopThree ? '#FFFFFF' : '#CCCCCC',
                      marginBottom: 2,
                    }}>
                      {player.username || 'Anonymous'}
                    </div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 11,
                      color: '#55557A',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                    }}>
                      <span>{player.wallet}</span>
                      <span
                        className={`badge badge-${
                          player.badge === 'godmode' ? 'cyan' :
                          player.badge === 'legendary' ? 'magenta' :
                          player.badge === 'champion' ? 'magenta' :
                          player.badge === 'hunter' ? 'gold' :
                          'cyan'
                        }`}
                        style={{ fontSize: 9, padding: '2px 6px' }}
                      >
                        {player.badge?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#00FF88',
                    textAlign: 'right',
                    textShadow: '0 0 10px rgba(0,255,136,0.3)',
                  }}>
                    {player.score.toLocaleString()}
                  </div>

                  {/* Tickets */}
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13,
                    color: '#8888BB',
                    textAlign: 'right',
                  }}>
                    {player.tickets} 🎟
                  </div>

                  {/* Reward */}
                  <div style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFD700',
                    textAlign: 'right',
                    textShadow: isTopThree ? '0 0 10px rgba(255,215,0,0.4)' : 'none',
                  }}>
                    ≈ {estimatedReward.toFixed(2)}
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 10,
                      color: '#55557A',
                      fontWeight: 400,
                    }}>USDC</div>
                  </div>
                </div>
              );
            })}

            {/* Join CTA row */}
            <div style={{
              padding: '20px',
              textAlign: 'center',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,245,255,0.02)',
            }}>
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 14,
                color: '#8888BB',
                marginBottom: 12,
              }}>
                Your name could be here. Top 100 players win USDC every week.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/game" className="btn btn-primary">▶ Play Now</a>
                <a href="/shop" className="btn btn-secondary">🎟 Buy Tickets</a>
              </div>
            </div>
          </div>

          {/* Mobile note */}
          <p style={{
            textAlign: 'center',
            marginTop: 16,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            color: '#33337A',
          }}>
            Leaderboard updates every 5 minutes · Prize distribution every Sunday 00:00 UTC on-chain
          </p>
        </div>
      </main>
    </>
  );
}
