'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { MapScreen, type Layout } from '@/lib/components/MapScreen';
import { BIOMES } from '@/lib/game/biomes';
import { getPlayerProgress } from '@/lib/api/progress';

function useLayout(): Layout {
  const [layout, setLayout] = useState<Layout>('mobile');
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setLayout(w >= 1280 ? 'desktop' : w >= 768 ? 'tablet' : 'mobile');
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return layout;
}

export default function MapActPage() {
  const { act } = useParams<{ act: string }>();
  const router = useRouter();
  const layout = useLayout();
  const { publicKey } = useWallet();
  const actNum = Math.max(1, Math.min(8, parseInt(act ?? '1', 10)));
  const biome = BIOMES[actNum - 1];
  const [currentLevel, setCurrentLevel] = useState(biome.range[0]);

  useEffect(() => {
    getPlayerProgress('local').then(p => {
      let level = p.currentLevel;
      // fallback to localStorage for guests
      if (!publicKey) {
        const stored = localStorage.getItem('bb_max_level');
        if (stored) level = Math.max(level, parseInt(stored, 10));
      }
      const clamped = Math.max(biome.range[0], Math.min(biome.range[1], level));
      setCurrentLevel(clamped);
    });
  }, [biome, publicKey]);

  return (
    <MapScreen
      biome={biome}
      currentLevel={currentLevel}
      layout={layout}
      onEnterLevel={(lvl) => router.push(`/play/${lvl}`)}
      walletAddress={publicKey?.toBase58()}
    />
  );
}
