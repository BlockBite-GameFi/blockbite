'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LevelView, type Layout } from '@/lib/components/LevelView';
import { levelConfig, type LevelConfig } from '@/lib/game/levelConfig';
import { startLevel, submitScore } from '@/lib/api/levels';

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

export default function PlayLevelPage() {
  const params = useParams<{ level: string }>();
  const level = parseInt(params.level || '1', 10);
  const layout = useLayout();
  const router = useRouter();
  const [cfg, setCfg] = useState<LevelConfig>(() => levelConfig(level));

  useEffect(() => {
    const player = typeof window !== 'undefined'
      ? localStorage.getItem('bb_wallet') ?? 'anonymous'
      : 'anonymous';
    startLevel(level, player).then(({ seed }) => setCfg(levelConfig(level, seed)));
  }, [level]);

  const onSubmit = async (score: number) => {
    const player = localStorage.getItem('bb_wallet') ?? 'anonymous';
    const msg = `blockbite:score:${player}:${level}:${score}:${Date.now()}`;
    await submitScore({ level, score, message: msg, signature: '' });
    const prev = parseInt(localStorage.getItem('bb_max_level') ?? '1');
    if (level >= prev) localStorage.setItem('bb_max_level', String(level + 1));
    router.back();
  };

  return (
    <LevelView
      cfg={cfg}
      layout={layout}
      onSubmit={onSubmit}
      onBack={() => router.back()}
    />
  );
}
