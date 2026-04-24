'use client';

import { useEffect, useRef } from 'react';
import { createIdleBlocks, drawIdleBackground } from '@/lib/game/renderer';

export default function GameBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idleBlocksRef = useRef<any[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      idleBlocksRef.current = createIdleBlocks(canvas.width, canvas.height, 30);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawIdleBackground(ctx, idleBlocksRef.current, time, canvas.width, canvas.height);
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage: 'url("/assets/bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.4,
        }}
      />
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          backgroundImage: 'url("/assets/grid.png")',
          backgroundSize: '100px 100px',
          opacity: 0.1,
          pointerEvents: 'none',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />
    </>
  );
}
