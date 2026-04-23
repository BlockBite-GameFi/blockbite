import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile — BlockBlast Web3',
  description: 'View your BlockBlast stats, achievements, referral earnings, and win history.',
};

const MOCK_PROFILE = {
  wallet: '7xK3...mN9p',
  username: 'YourUsername',
  joinedDate: 'April 2026',
  totalGames: 24,
  bestScore: 18450,
  totalTickets: 32,
  totalEarned: 87.50,
  currentRank: 8,
  referralCode: 'BLOCKBLAST-7XK3',
  referralCount: 3,
  referralEarned: 4.20,
  streak: 5,
};

const ACHIEVEMENTS = [
  { id: 'first_blood', icon: '🩸', name: 'First Blood', desc: 'Bought your first ticket', unlocked: true },
  { id: 'high_roller', icon: '🎰', name: 'High Roller', desc: 'Score over 10,000 in one session', unlocked: true },
  { id: 'combo_king', icon: '⚡', name: 'Combo King', desc: '5-line clear in one placement', unlocked: false },
  { id: 'streak_master', icon: '🔗', name: 'Streak Master', desc: '10 consecutive line clears', unlocked: false },
  { id: 'veteran', icon: '🎖', name: 'Veteran', desc: '100 tickets used total', unlocked: false },
  { id: 'whale', icon: '🐋', name: 'Whale', desc: 'Total spending over 100 USDC', unlocked: false },
  { id: 'social', icon: '🦋', name: 'Social Butterfly', desc: 'Refer 5 active friends', unlocked: false },
  { id: 'perfect', icon: '✨', name: 'Perfectionist', desc: 'Achieve a Perfect Board clear', unlocked: true },
];

const WIN_HISTORY = [
  { period: 'Week 3 - Apr 2026', rank: 8, score: 18450, reward: 29.20 },
  { period: 'Week 2 - Apr 2026', rank: 14, score: 15300, reward: 14.10 },
  { period: 'Week 1 - Apr 2026', rank: 22, score: 11800, reward: 5.25 },
];

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: '100vh', paddingBottom: 80 }}>
        <div className="container" style={{ maxWidth: 900 }}>

          {/* Profile Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(255,0,255,0.05))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            padding: '32px',
            marginBottom: 24,
            display: 'flex',
            gap: 24,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00F5FF, #FF00FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 32,
              boxShadow: '0 0 30px rgba(0,245,255,0.3)',
            }}>
              🎮
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 4,
                flexWrap: 'wrap',
              }}>
                <h1 style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  margin: 0,
                }}>
                  {MOCK_PROFILE.username}
                </h1>
                <span className="badge badge-cyan">Hunter</span>
                <span className="badge badge-green">🔥 {MOCK_PROFILE.streak}-Day Streak</span>
              </div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13,
                color: '#55557A',
                marginBottom: 12,
              }}>
                {MOCK_PROFILE.wallet} · Joined {MOCK_PROFILE.joinedDate}
              </div>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 13,
                color: '#00F5FF',
              }}>
                Current Rank: <span style={{ color: '#FFD700' }}>#{MOCK_PROFILE.currentRank}</span> this week
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 28,
                fontWeight: 900,
                color: '#00FF88',
                textShadow: '0 0 20px rgba(0,255,136,0.4)',
              }}>
                {MOCK_PROFILE.totalEarned.toFixed(2)}
              </div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                color: '#55557A',
              }}>
                USDC Earned Total
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}>
            {[
              { label: 'Total Games', value: MOCK_PROFILE.totalGames, icon: '🎮', color: '#00F5FF' },
              { label: 'Best Score', value: MOCK_PROFILE.bestScore.toLocaleString(), icon: '⭐', color: '#00FF88' },
              { label: 'Tickets Used', value: MOCK_PROFILE.totalTickets, icon: '🎟', color: '#FF00FF' },
              { label: 'Best Rank', value: `#${MOCK_PROFILE.currentRank}`, icon: '🏆', color: '#FFD700' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(18,18,42,0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 16px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
                <div style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 22,
                  fontWeight: 800,
                  color: stat.color,
                  textShadow: `0 0 15px ${stat.color}60`,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 11,
                  color: '#55557A',
                  marginTop: 4,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

            {/* Referral */}
            <div style={{
              background: 'rgba(18,18,42,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,215,0,0.1)',
              borderRadius: 16,
              padding: '24px',
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 12,
                color: '#55557A',
                letterSpacing: '0.08em',
                marginBottom: 16,
              }}>
                🔗 REFERRAL PROGRAM
              </div>
              <div style={{
                background: 'rgba(255,215,0,0.05)',
                border: '1px solid rgba(255,215,0,0.15)',
                borderRadius: 10,
                padding: '12px 16px',
                fontFamily: "'Orbitron', monospace",
                fontSize: 13,
                color: '#FFD700',
                letterSpacing: '0.05em',
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                {MOCK_PROFILE.referralCode}
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#00F5FF',
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 12,
                }}>
                  📋 Copy
                </button>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}>
                {[
                  { label: 'Friends Referred', value: MOCK_PROFILE.referralCount },
                  { label: 'USDC Earned', value: `${MOCK_PROFILE.referralEarned.toFixed(2)}` },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    padding: '10px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#00FF88',
                    }}>
                      {item.value}
                    </div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 11,
                      color: '#55557A',
                    }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Win history */}
            <div style={{
              background: 'rgba(18,18,42,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '24px',
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 12,
                color: '#55557A',
                letterSpacing: '0.08em',
                marginBottom: 16,
              }}>
                💰 WIN HISTORY
              </div>
              {WIN_HISTORY.map(win => (
                <div key={win.period} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 12,
                      color: '#CCCCCC',
                    }}>
                      Rank #{win.rank} — {win.period}
                    </div>
                    <div style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 11,
                      color: '#55557A',
                    }}>
                      {win.score.toLocaleString()} pts
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#FFD700',
                  }}>
                    +{win.reward.toFixed(2)} USDC
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div style={{
            background: 'rgba(18,18,42,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '24px',
          }}>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 12,
              color: '#55557A',
              letterSpacing: '0.08em',
              marginBottom: 20,
            }}>
              🏅 ACHIEVEMENTS ({ACHIEVEMENTS.filter(a => a.unlocked).length}/{ACHIEVEMENTS.length})
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}>
              {ACHIEVEMENTS.map(ach => (
                <div key={ach.id} style={{
                  background: ach.unlocked ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${ach.unlocked ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: 12,
                  padding: '14px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  opacity: ach.unlocked ? 1 : 0.45,
                  transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{ach.icon}</span>
                  <div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: ach.unlocked ? '#FFFFFF' : '#8888BB',
                    }}>
                      {ach.name}
                    </div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 11,
                      color: '#55557A',
                      lineHeight: 1.4,
                    }}>
                      {ach.desc}
                    </div>
                  </div>
                  {ach.unlocked && (
                    <span style={{
                      marginLeft: 'auto',
                      color: '#00FF88',
                      fontSize: 16,
                      flexShrink: 0,
                    }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
