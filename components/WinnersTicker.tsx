'use client';

// WinnersTicker — scrolling leaderboard strip.
// Accepts real winner data as a prop. Shows nothing if the list is empty.
// Simulated data lives at /demo#leaderboard — not here.

interface Winner { addr: string; amount: string; act: string; rank: number; }

const RANK_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

export default function WinnersTicker({ winners }: { winners: Winner[] }) {
  if (!winners || winners.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...winners, ...winners];

  return (
    <div style={{
      width: '100%', overflow: 'hidden',
      background: 'rgba(0,0,0,0.3)',
      borderTop: '1px solid rgba(0,245,255,0.08)',
      borderBottom: '1px solid rgba(0,245,255,0.08)',
      padding: '10px 0', position: 'relative',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, zIndex: 2, background: 'linear-gradient(90deg,rgba(6,6,20,1),transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, zIndex: 2, background: 'linear-gradient(270deg,rgba(6,6,20,1),transparent)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', gap: 0, animation: 'tickerScroll 32s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
        {items.map((w, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 28px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, fontWeight: 900, color: RANK_COLORS[w.rank] ?? '#8888BB' }}>#{w.rank}</span>
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, color: '#AAAACC' }}>{w.addr}</span>
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 800, color: '#00FF88', textShadow: '0 0 8px rgba(0,255,136,0.5)' }}>+{w.amount} USDC</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, color: '#555577' }}>{w.act}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}
