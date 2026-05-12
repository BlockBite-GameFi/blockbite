'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import PrizePoolCounter from '@/components/PrizePoolCounter';
import Countdown from '@/components/Countdown';
import { TICKET_PACKAGES } from '@/lib/game/constants';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { purchaseTickets, getUsdcBalance, InsufficientFundsError, NoTokenAccountError } from '@/lib/solana/usdc';
import { explorerTx, IS_DEVNET } from '@/lib/solana/config';

const TIER_COLORS: Record<string, { from: string; to: string; glow: string }> = {
  starter:   { from: '#444466', to: '#333355', glow: 'rgba(100,100,200,0.3)' },
  explorer:  { from: '#00C3FF', to: '#0040FF', glow: 'rgba(0,195,255,0.3)' },
  warrior:   { from: '#00FF88', to: '#00AA44', glow: 'rgba(0,255,136,0.3)' },
  hunter:    { from: '#FFD700', to: '#FF8C00', glow: 'rgba(255,215,0,0.3)' },
  champion:  { from: '#AA00FF', to: '#5500AA', glow: 'rgba(170,0,255,0.3)' },
  legendary: { from: '#FF00FF', to: '#AA0066', glow: 'rgba(255,0,255,0.35)' },
  godmode:   { from: '#00F5FF', to: '#FF00FF', glow: 'rgba(0,245,255,0.4)' },
};

const TIER_ICONS: Record<string, string> = {
  starter: '🎟', explorer: '🧭', warrior: '⚔️',
  hunter: '🎯', champion: '👑', legendary: '🌟', godmode: '💎',
};

export default function ShopPage() {
  const [hoveredPkg, setHoveredPkg]   = useState<string | null>(null);
  const [buying, setBuying]           = useState<string | null>(null);
  const [txSig, setTxSig]             = useState<string | null>(null);
  const [txError, setTxError]         = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [ticketBalance, setTicketBalance] = useState<number>(0);

  // Load localStorage ticket balance
  useEffect(() => {
    if (publicKey) {
      const saved = localStorage.getItem(`tickets_${publicKey.toBase58()}`);
      if (saved) setTicketBalance(parseInt(saved));
    }
  }, [publicKey]);

  // Fetch real on-chain USDC balance
  useEffect(() => {
    if (!publicKey || !connection) return;
    getUsdcBalance(connection, publicKey).then(setUsdcBalance);
  }, [publicKey, connection]);

  const handleBuy = useCallback(async (pkg: typeof TICKET_PACKAGES[0]) => {
    if (!connected || !publicKey) {
      setTxError('Please connect your wallet first.');
      return;
    }
    setTxError(null);
    setTxSig(null);
    setBuying(pkg.id);

    try {
      // Real on-chain USDC transfer → FEE_WALLET on devnet
      const sig = await purchaseTickets({
        connection,
        payer: publicKey,
        usdcAmount: pkg.price,
        sendTransaction,
      });

      // Confirm success → credit tickets in localStorage
      const newBal = ticketBalance + pkg.tickets;
      setTicketBalance(newBal);
      localStorage.setItem(`tickets_${publicKey.toBase58()}`, newBal.toString());
      setTxSig(sig);

      // Refresh USDC balance
      const newUsdc = await getUsdcBalance(connection, publicKey);
      setUsdcBalance(newUsdc);
    } catch (err) {
      if (err instanceof InsufficientFundsError) {
        setTxError(`Not enough USDC. You have ${err.have.toFixed(2)} USDC, need ${err.need.toFixed(2)} USDC.${IS_DEVNET ? ' Get devnet USDC from faucet.solana.com.' : ''}`);
      } else if (err instanceof NoTokenAccountError) {
        setTxError(`No USDC account found.${IS_DEVNET ? ' Airdrop devnet USDC first at faucet.solana.com.' : ''}`);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setTxError(`Transaction failed: ${msg}`);
      }
    } finally {
      setBuying(null);
    }
  }, [connected, publicKey, connection, sendTransaction, ticketBalance]);

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingBottom: 80, background: 'var(--ds-bg)', color: 'var(--ds-text)' }}>
        {/* Page header band */}
        <div style={{ padding: '80px 24px 32px', background: 'linear-gradient(180deg, #1e1b4b 0%, var(--ds-bg) 100%)', borderBottom: '1px solid #312e81' }}>
          <div className="container">
            <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--ds-accent)', fontWeight: 800, marginBottom: 6 }}>BLOCKBITE SHOP</div>
            <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.5px' }}>
              Tickets · USDC
            </h1>
            <p style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 13, color: 'var(--ds-text-dim)', marginBottom: 0 }}>
              70% prize pool · 15% team · 10% dev · 5% referral · split on-chain
            </p>
          </div>
        </div>
        <div className="container" style={{ paddingTop: 32 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 15, color: 'var(--ds-text-dim)', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Buy tickets to compete on the leaderboard. More tickets = more chances to top the board.
              70% of every purchase goes directly to the prize pool.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
              <PrizePoolCounter size="sm" />
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: 'rgba(18,18,42,0.8)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '12px 24px',
              }}>
                <Countdown size="sm" showLabel />
              </div>
            </div>
          </div>

          {/* Wallet USDC balance + network badge */}
          {connected && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(0,245,255,0.07)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: 10, padding: '8px 20px', fontSize: 13, color: '#8888BB' }}>
                🎟 Tickets: <b style={{ color: '#00F5FF' }}>{ticketBalance}</b>
              </div>
              <div style={{ background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 10, padding: '8px 20px', fontSize: 13, color: '#8888BB' }}>
                💰 USDC Balance: <b style={{ color: '#FFD700' }}>{usdcBalance !== null ? usdcBalance.toFixed(2) : '...'}</b>
              </div>
              {IS_DEVNET && (
                <div style={{ background: 'rgba(153,69,255,0.1)', border: '1px solid rgba(153,69,255,0.3)', borderRadius: 10, padding: '8px 20px', fontSize: 12, color: '#CC88FF' }}>
                  🔬 DEVNET — <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" style={{ color: '#9945FF' }}>Get test USDC</a>
                </div>
              )}
            </div>
          )}

          {/* Tx feedback */}
          {txSig && (
            <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 10, padding: '12px 20px', marginBottom: 20, textAlign: 'center', fontSize: 14, color: '#00FF88' }}>
              ✅ Purchase confirmed! Tickets added.{' '}
              <a href={explorerTx(txSig)} target="_blank" rel="noopener noreferrer" style={{ color: '#00F5FF', textDecoration: 'underline' }}>View on Solana Explorer →</a>
            </div>
          )}
          {txError && (
            <div style={{ background: 'rgba(255,34,68,0.08)', border: '1px solid rgba(255,34,68,0.25)', borderRadius: 10, padding: '12px 20px', marginBottom: 20, textAlign: 'center', fontSize: 14, color: '#FF5577' }}>
              ❌ {txError}
            </div>
          )}

          {/* Flash sale banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,140,0,0.08))',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 12,
            padding: '12px 20px',
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <span style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 12, fontWeight: 700, color: '#FFD700',
              }}>
                WEEKEND WARRIORS SALE
              </span>
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13, color: '#8888BB', marginLeft: 12,
              }}>
                Extra 5% off all packages this Friday & Saturday · Use referral for additional discount
              </span>
            </div>
          </div>

          {/* Packages grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
            marginBottom: 48,
          }}>
            {TICKET_PACKAGES.map(pkg => {
              const colors = TIER_COLORS[pkg.id];
              const isGodmode = pkg.id === 'godmode';
              const isLegendary = pkg.id === 'legendary' || isGodmode;
              const isHovered = hoveredPkg === pkg.id;
              const isBuying = buying === pkg.id;

              return (
                <div
                  key={pkg.id}
                  id={`shop-pkg-${pkg.id}`}
                  onMouseEnter={() => setHoveredPkg(pkg.id)}
                  onMouseLeave={() => setHoveredPkg(null)}
                  style={{
                    position: 'relative',
                    background: isHovered
                      ? `linear-gradient(135deg, rgba(18,18,42,0.95), rgba(10,10,26,0.98))`
                      : 'rgba(18,18,42,0.85)',
                    backdropFilter: 'blur(16px)',
                    border: isGodmode
                      ? `2px solid transparent`
                      : isHovered
                        ? `1px solid ${colors.from}60`
                        : '1px solid rgba(255,255,255,0.06)',
                    backgroundImage: isGodmode
                      ? `linear-gradient(rgba(18,18,42,0.95), rgba(10,10,26,0.98)), linear-gradient(135deg, ${colors.from}, ${colors.to})`
                      : undefined,
                    backgroundOrigin: isGodmode ? 'border-box' : undefined,
                    backgroundClip: isGodmode ? 'padding-box, border-box' : undefined,
                    borderRadius: 20,
                    padding: '28px 24px',
                    transition: 'all 0.25s ease',
                    transform: isHovered ? 'translateY(-6px)' : 'none',
                    boxShadow: isHovered
                      ? `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${colors.glow}`
                      : '0 4px 20px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  {/* Popular badge */}
                  {pkg.id === 'hunter' && (
                    <div style={{
                      position: 'absolute', top: 16, right: 16,
                      background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
                      color: '#000', fontSize: 10, fontWeight: 700,
                      fontFamily: "'Orbitron', monospace",
                      padding: '3px 10px', borderRadius: 99,
                      letterSpacing: '0.06em',
                    }}>
                      POPULAR
                    </div>
                  )}

                  {isGodmode && (
                    <div style={{
                      position: 'absolute', top: 16, right: 16,
                      background: 'linear-gradient(135deg, #00F5FF, #FF00FF)',
                      color: '#000', fontSize: 10, fontWeight: 700,
                      fontFamily: "'Orbitron', monospace",
                      padding: '3px 10px', borderRadius: 99,
                      letterSpacing: '0.06em',
                    }}>
                      BEST VALUE
                    </div>
                  )}

                  {/* Icon + Name */}
                  <div style={{ fontSize: 32, marginBottom: 8 }}>
                    {TIER_ICONS[pkg.id]}
                  </div>
                  <div style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 16, fontWeight: 800,
                    background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: 4,
                  }}>
                    {pkg.name.toUpperCase()}
                  </div>

                  {/* Ticket count */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    marginBottom: 16,
                  }}>
                    <span style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 40, fontWeight: 900, color: '#FFFFFF',
                      lineHeight: 1,
                    }}>{pkg.tickets}</span>
                    <span style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 14, color: '#8888BB',
                    }}>tickets</span>
                    {pkg.discount > 0 && (
                      <span style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 11, fontWeight: 700, color: '#00FF88',
                        background: 'rgba(0,255,136,0.1)',
                        border: '1px solid rgba(0,255,136,0.2)',
                        borderRadius: 99,
                        padding: '2px 8px',
                        marginLeft: 4,
                      }}>
                        -{pkg.discount}%
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    padding: '10px 0',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div>
                      <div style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 24, fontWeight: 900, color: '#FFFFFF',
                      }}>
                        {pkg.price} <span style={{ fontSize: 14, color: '#8888BB' }}>USDC</span>
                      </div>
                      <div style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 12, color: '#55557A',
                      }}>
                        {pkg.pricePerTicket.toFixed(2)} USDC/ticket
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 11, fontWeight: 700, color: '#00FF88',
                      }}>
                        +{(pkg.price * 0.7).toFixed(2)}
                      </div>
                      <div style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 10, color: '#55557A',
                      }}>
                        to prize pool
                      </div>
                    </div>
                  </div>

                  {/* Bonuses */}
                  {pkg.bonuses.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      {pkg.bonuses.map(bonus => (
                        <div key={bonus} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                        }}>
                          <span style={{ color: colors.from, fontSize: 13 }}>✓</span>
                          <span style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: 13, color: '#AAAACC',
                          }}>{bonus}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Buy button */}
                  <button
                    type="button"
                    onClick={() => handleBuy(pkg)}
                    disabled={!!buying}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 10,
                      background: isBuying
                        ? 'rgba(0,245,255,0.1)'
                        : `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                      color: isGodmode || pkg.id === 'explorer' || pkg.id === 'starter' ? '#000' : '#fff',
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      border: 'none',
                      cursor: buying ? 'wait' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {isBuying ? (
                      <>
                        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                        Processing...
                      </>
                    ) : (
                      `Buy ${pkg.tickets} Ticket${pkg.tickets > 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Info section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {[
              {
                icon: '🔒',
                title: 'Secure Payments',
                desc: 'All transactions are processed on-chain via Solana. We never hold your funds.',
              },
              {
                icon: '♻️',
                title: 'No Expiry',
                desc: 'Tickets never expire. Buy now, play whenever you want.',
              },
              {
                icon: '🔗',
                title: 'Referral Rewards',
                desc: 'Share your referral link and earn 5% of every ticket your friends buy — forever.',
              },
            ].map(item => (
              <div key={item.title} style={{
                background: 'rgba(18,18,42,0.6)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                gap: 12,
              }}>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700, color: '#FFFFFF', marginBottom: 4, fontSize: 14,
                  }}>{item.title}</div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13, color: '#8888BB', lineHeight: 1.5,
                  }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
