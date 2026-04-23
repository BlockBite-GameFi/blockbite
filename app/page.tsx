'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PrizePoolCounter from '@/components/PrizePoolCounter';
import Countdown from '@/components/Countdown';
import { MOCK_LEADERBOARD, MOCK_PLAYERS, MOCK_TICKETS_SOLD, MOCK_USDC_DISTRIBUTED, MOCK_PRIZE_POOL_USDC } from '@/lib/game/constants';
import { createIdleBlocks, drawIdleBackground } from '@/lib/game/renderer';

export default function HomePage() {
  const heroBgRef = useRef<HTMLCanvasElement>(null);
  const idleBlocksRef = useRef<ReturnType<typeof createIdleBlocks> | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = heroBgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      idleBlocksRef.current = createIdleBlocks(canvas!.width, canvas!.height, 24);
    }
    resize();
    window.addEventListener('resize', resize);

    function render(time: number) {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      if (idleBlocksRef.current) {
        drawIdleBackground(ctx, idleBlocksRef.current, time, canvas!.width, canvas!.height);
      }
      rafRef.current = requestAnimationFrame(render);
    }
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <Navbar />

      {/* Hero background canvas */}
      <canvas
        ref={heroBgRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <main style={{ position: 'relative', zIndex: 1, paddingTop: 64 }}>

        {/* ── HERO SECTION ─────────────────────────────────── */}
        <section style={{
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          textAlign: 'center',
          gap: 24,
        }}>
          {/* Live badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(0,255,136,0.08)',
            border: '1px solid rgba(0,255,136,0.2)',
            borderRadius: 99,
            padding: '6px 16px',
            animation: 'slideInDown 0.6s ease-out',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#00FF88',
              boxShadow: '0 0 8px rgba(0,255,136,0.8)',
              animation: 'pulseGlow 2s infinite',
              display: 'inline-block',
            }} />
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13, fontWeight: 600,
              color: '#00FF88',
            }}>LIVE on Solana Devnet · Season 1</span>
          </div>

          {/* Main title */}
          <h1 style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(40px, 8vw, 80px)',
            fontWeight: 900,
            lineHeight: 1.05,
            animation: 'slideInUp 0.7s ease-out',
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #8888BB 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>BLOCK</span>
            <span style={{
              background: 'linear-gradient(135deg, #00F5FF 0%, #0088FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>BLAST</span>
            <br />
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(16px, 3vw, 28px)',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #FF00FF, #AA0066)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '0.15em',
              display: 'block',
              marginTop: 8,
            }}>WEB3 GAMEFI</span>
          </h1>

          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(15px, 2.5vw, 20px)',
            color: '#8888BB',
            maxWidth: 560,
            lineHeight: 1.6,
            animation: 'slideInUp 0.8s ease-out',
          }}>
            The skill-based arcade where <strong style={{ color: '#00FF88' }}>top players win real USDC</strong>.
            Buy a ticket, play Block Blast, and compete for the weekly prize pool on Solana.
          </p>

          {/* Prize Pool Counter */}
          <div style={{
            background: 'rgba(18,18,42,0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,215,0,0.15)',
            borderRadius: 24,
            padding: '32px 48px',
            animation: 'slideInUp 0.9s ease-out',
            boxShadow: '0 0 60px rgba(255,215,0,0.05)',
          }}>
            <PrizePoolCounter size="hero" />
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <Countdown size="md" showLabel={true} />
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            animation: 'slideInUp 1s ease-out',
          }}>
            <Link href="/game" className="btn btn-primary btn-lg" id="hero-play-now">
              ▶ Play Now — Free Preview
            </Link>
            <Link href="/shop" className="btn btn-secondary btn-lg" id="hero-buy-tickets">
              🎟 Buy Tickets
            </Link>
            <Link href="/how-to-play" className="btn btn-ghost btn-lg">
              How It Works
            </Link>
          </div>

          {/* Stats bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 32,
            justifyContent: 'center',
            animation: 'fadeIn 1.2s ease-out',
          }}>
            {[
              { value: MOCK_PLAYERS.toLocaleString(), label: 'Players This Week' },
              { value: MOCK_TICKETS_SOLD.toLocaleString(), label: 'Tickets Sold' },
              { value: `$${MOCK_USDC_DISTRIBUTED.toLocaleString()}`, label: 'USDC Distributed' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#00F5FF',
                  textShadow: '0 0 20px rgba(0,245,255,0.4)',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 12,
                  color: '#55557A',
                  marginTop: 4,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────── */}
        <section style={{
          padding: '80px 24px',
          background: 'rgba(18,18,42,0.6)',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: 48, fontSize: 'clamp(24px, 4vw, 40px)' }}>
              <span className="neon-cyan">How It Works</span>
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 24,
            }}>
              {[
                {
                  step: '01',
                  icon: '🔗',
                  title: 'Connect Wallet',
                  desc: 'Connect your Phantom, Solflare, or Backpack wallet. No account required — your wallet is your identity.',
                  color: '#00F5FF',
                },
                {
                  step: '02',
                  icon: '🎟',
                  title: 'Buy a Ticket',
                  desc: 'Purchase a ticket with USDC. Starting from just 1 USDC. 70% goes directly to the prize pool.',
                  color: '#FF00FF',
                },
                {
                  step: '03',
                  icon: '🎮',
                  title: 'Play & Compete',
                  desc: 'Play Block Blast and get the highest score you can. Your best score this week counts for the leaderboard.',
                  color: '#FFD700',
                },
                {
                  step: '04',
                  icon: '💰',
                  title: 'Win USDC',
                  desc: 'Every Sunday, prizes are distributed automatically on-chain to the top 100 scorers. Fully transparent.',
                  color: '#00FF88',
                },
              ].map(item => (
                <div key={item.step} className="card" style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: 20,
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: item.color,
                    background: 'var(--bg-primary)',
                    padding: '2px 10px',
                    borderRadius: 4,
                    border: `1px solid ${item.color}40`,
                  }}>
                    STEP {item.step}
                  </div>
                  <div style={{ fontSize: 40, marginBottom: 12, marginTop: 8 }}>{item.icon}</div>
                  <h3 style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 16,
                    color: item.color,
                    marginBottom: 8,
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 14,
                    color: '#8888BB',
                    lineHeight: 1.6,
                  }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LEADERBOARD PREVIEW ───────────────────────────── */}
        <section style={{ padding: '80px 24px' }}>
          <div className="container">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <h2 style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
                🏆 <span className="neon-gold">Top Players This Week</span>
              </h2>
              <Link href="/leaderboard" className="btn btn-ghost btn-sm">
                View Full Leaderboard →
              </Link>
            </div>

            <div style={{
              background: 'rgba(18,18,42,0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              {MOCK_LEADERBOARD.slice(0, 5).map((player, i) => (
                <div key={player.rank} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.2s',
                  cursor: 'default',
                }}>
                  <div style={{ width: 36 }}>
                    <span className={`rank-${player.rank <= 3 ? player.rank : ''}`}
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 16,
                        fontWeight: 800,
                        color: player.rank === 1 ? '#FFD700' : player.rank === 2 ? '#C0C0C0' : player.rank === 3 ? '#CD7F32' : '#8888BB',
                      }}>
                      #{player.rank}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: player.rank <= 3 ? '#FFFFFF' : '#CCCCCC',
                    }}>
                      {player.username || player.wallet}
                    </div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 11,
                      color: '#55557A',
                    }}>
                      {player.wallet} · {player.tickets} tickets used
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#00FF88',
                    }}>
                      {player.score.toLocaleString()}
                    </div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 11,
                      color: '#FFD700',
                    }}>
                      ≈ {player.estimatedReward.toFixed(2)} USDC
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link href="/game" className="btn btn-primary btn-lg" id="home-join-competition">
                Join the Competition →
              </Link>
            </div>
          </div>
        </section>

        {/* ── TOKENOMICS SECTION ───────────────────────────── */}
        <section style={{
          padding: '80px 24px',
          background: 'rgba(18,18,42,0.6)',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: 16, fontSize: 'clamp(20px, 3vw, 36px)' }}>
              <span className="neon-magenta">Transparent Tokenomics</span>
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#8888BB',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              maxWidth: 480,
              margin: '0 auto 48px',
            }}>
              Every USDC you spend is split transparently on-chain. No hidden fees. No rug pulls.
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              justifyContent: 'center',
              maxWidth: 700,
              margin: '0 auto',
            }}>
              {[
                { pct: 70, label: 'Prize Pool', color: '#00FF88', desc: 'Distributed to top 100 scorers every Sunday' },
                { pct: 15, label: 'Team Revenue', color: '#00F5FF', desc: 'Sustains development and operations' },
                { pct: 10, label: 'Dev Fund', color: '#FF00FF', desc: 'Smart contract audits, marketing, tools' },
                { pct: 5,  label: 'Referral Pool', color: '#FFD700', desc: 'Rewards players who bring new users' },
              ].map(item => (
                <div key={item.label} style={{
                  flex: '1 1 200px',
                  background: 'rgba(18,18,42,0.9)',
                  border: `1px solid ${item.color}30`,
                  borderRadius: 16,
                  padding: '20px 24px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: `${item.pct}%`,
                    height: 3,
                    background: item.color,
                    boxShadow: `0 0 12px ${item.color}`,
                  }} />
                  <div style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 36,
                    fontWeight: 900,
                    color: item.color,
                    textShadow: `0 0 20px ${item.color}60`,
                    lineHeight: 1,
                  }}>
                    {item.pct}%
                  </div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginTop: 4,
                    marginBottom: 6,
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 12,
                    color: '#8888BB',
                    lineHeight: 1.4,
                  }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Link href="/how-to-play" className="btn btn-ghost">
                Learn More About Tokenomics →
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────── */}
        <footer style={{
          padding: '40px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 18,
            fontWeight: 800,
            color: '#00F5FF',
            marginBottom: 8,
          }}>
            BLOCKBLAST <span style={{ color: '#FF00FF' }}>WEB3</span>
          </div>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13,
            color: '#55557A',
          }}>
            Built on Solana · Powered by USDC · nayrbryanGaming 2026
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/game" style={{ color: '#8888BB', fontSize: 13 }}>Play</Link>
            <Link href="/shop" style={{ color: '#8888BB', fontSize: 13 }}>Shop</Link>
            <Link href="/leaderboard" style={{ color: '#8888BB', fontSize: 13 }}>Leaderboard</Link>
            <Link href="/how-to-play" style={{ color: '#8888BB', fontSize: 13 }}>How to Play</Link>
          </div>
        </footer>
      </main>
    </>
  );
}
