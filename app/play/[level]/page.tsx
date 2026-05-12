// app/play/[level]/page.tsx — Next.js 14 App Router page

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';

type Layout = 'mobile' | 'tablet' | 'desktop';

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
  const { publicKey } = useWallet();

  // Redirect to game page with level param
  useEffect(() => {
    if (!publicKey) {
      router.push('/');
      return;
    }
    router.replace(`/game?level=${level}`);
  }, [level, publicKey, router]);

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p>Loading level {level}…</p>
    </main>
  );
}
