'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { getPlayerProgress } from '@/lib/api/progress';

export default function MapRedirect() {
  const router = useRouter();
  const { publicKey } = useWallet();

  useEffect(() => {
    const walletAddr = publicKey?.toBase58() ?? '';
    getPlayerProgress(walletAddr).then(p => {
      const act = Math.min(8, Math.max(1, Math.ceil(p.currentLevel / 500)));
      router.replace(`/map/${act}`);
    });
  }, [router, publicKey]);

  return null;
}
