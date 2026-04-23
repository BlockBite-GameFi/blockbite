'use client';

import { useEffect, useRef, useState } from 'react';
import { MOCK_PRIZE_POOL_USDC } from '@/lib/game/constants';

interface PrizePoolCounterProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

export default function PrizePoolCounter({ size = 'md' }: PrizePoolCounterProps) {
  const [displayed, setDisplayed] = useState(MOCK_PRIZE_POOL_USDC - 150);
  const [pulse, setPulse] = useState(false);
  const animRef = useRef<number | null>(null);
  const target = MOCK_PRIZE_POOL_USDC;

  // Animate counter to target on mount
  useEffect(() => {
    const start = displayed;
    const diff = target - start;
    const duration = 2000;
    const startTime = Date.now();

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + diff * eased);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []); // eslint-disable-line

  // Simulated live increment (random ticket purchases)
  useEffect(() => {
    const interval = setInterval(() => {
      const ticketValue = 0.70; // 70% to prize pool
      setDisplayed(prev => {
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
        return prev + ticketValue;
      });
    }, 8000 + Math.random() * 12000);
    return () => clearInterval(interval);
  }, []);

  const formatted = displayed.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const heroStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
  };

  const fontSizeMap = {
    sm: { main: 18, sub: 10 },
    md: { main: 28, sub: 12 },
    lg: { main: 42, sub: 14 },
    hero: { main: 68, sub: 16 },
  };

  const { main, sub } = fontSizeMap[size];

  return (
    <div style={heroStyle}>
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: sub,
        fontWeight: 600,
        color: '#8888BB',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
      }}>
        🏆 Weekly Prize Pool
      </span>
      <span style={{
        fontFamily: "'Orbitron', monospace",
        fontSize: main,
        fontWeight: 900,
        background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: 'none',
        filter: pulse
          ? 'drop-shadow(0 0 30px rgba(255,215,0,0.8))'
          : 'drop-shadow(0 0 20px rgba(255,215,0,0.4))',
        transition: 'filter 0.3s ease',
        lineHeight: 1.1,
      }}>
        {formatted} <span style={{
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
        color: pulse ? '#00FF88' : '#55557A',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        transition: 'color 0.3s ease',
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#00FF88',
          display: 'inline-block',
          animation: 'pulseGlow 2s infinite',
        }} />
        LIVE · Updates with every ticket sold
      </span>
    </div>
  );
}
