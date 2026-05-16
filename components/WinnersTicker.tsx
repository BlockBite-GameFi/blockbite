'use client';

const MOCK_WINNERS = [
  { addr: 'Ph4nt...x9zK', amount: '142.80', act: 'Voidbreak', rank: 1 },
  { addr: 'So1fl...mN3A', amount: '89.50',  act: 'Crystalline', rank: 2 },
  { addr: 'Cb1nW...pQ7R', amount: '53.20',  act: 'Nightfall',  rank: 3 },
  { addr: 'TrV5k...wE2B', amount: '38.90',  act: 'Verdant',    rank: 4 },
  { addr: 'Ld9xF...aH4C', amount: '24.10',  act: 'Stormlands', rank: 5 },
  { addr: 'Ph8mD...uJ6T', amount: '182.00', act: 'Voidbreak',  rank: 1 },
  { addr: 'So3pA...kL8Y', amount: '71.40',  act: 'Crystalline',rank: 2 },
  { addr: 'Nm2qK...vG5S', amount: '44.60',  act: 'Inferno',    rank: 3 },
];

const RANK_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

export default function WinnersTicker() {
  return (
    <div style={{
      width: '100%',
      overflow: 'hidden',
      background: 'rgba(0,0,0,0.3)',
      borderTop: '1px solid rgba(0,245,255,0.08)',
      borderBottom: '1px solid rgba(0,245,255,0.08)',
      padding: '10px 0',
      position: 'relative',
    }}>
      {/* Fade edges */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, zIndex: 2,
        background: 'linear-gradient(90deg, rgba(6,6,20,1), transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, zIndex: 2,
        background: 'linear-gradient(270deg, rgba(6,6,20,1), transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        display: 'flex',
        gap: 0,
        animation: 'tickerScroll 32s linear infinite',
        whiteSpace: 'nowrap',
        width: 'max-content',
      }}>
        {[...MOCK_WINNERS, ...MOCK_WINNERS].map((w, i) => (
          <div key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0 28px', borderRight: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{
              fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 900,
              color: RANK_COLORS[w.rank] ?? '#8888BB',
            }}>#{w.rank}</span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: '#AAAACC' }}>{w.addr}</span>
            <span style={{
              fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 800,
              color: '#00FF88', textShadow: '0 0 8px rgba(0,255,136,0.5)',
            }}>+{w.amount} USDC</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: '#555577' }}>
              {w.act}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
