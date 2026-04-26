'use client';

interface PrizePoolCounterProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

export default function PrizePoolCounter({ size = 'md' }: PrizePoolCounterProps) {
  const fontSizeMap = {
    sm:   { main: 18, sub: 10 },
    md:   { main: 28, sub: 12 },
    lg:   { main: 42, sub: 14 },
    hero: { main: 68, sub: 16 },
  };
  const { main, sub } = fontSizeMap[size];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: sub,
        fontWeight: 600,
        color: '#8888BB',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
      }}>
        🏆 Prize Pool
      </span>
      <span style={{
        fontFamily: "'Orbitron', monospace",
        fontSize: main,
        fontWeight: 900,
        background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1.1,
      }}>
        0.00{' '}
        <span style={{
          fontSize: main * 0.45,
          background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>USDC</span>
      </span>
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: sub - 1,
        color: '#55557A',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#00FF88', display: 'inline-block',
          animation: 'pulseGlow 2s infinite',
        }} />
        Phase 0 · Devnet · Grows with every ticket sold
      </span>
    </div>
  );
}
