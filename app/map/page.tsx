'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MapRedirect() {
  const router = useRouter();
  useEffect(() => {
    const saved = parseInt(localStorage.getItem('bb_max_level') ?? '1');
    const level = isNaN(saved) || saved < 1 ? 1 : saved;
    const act = Math.min(8, Math.max(1, Math.ceil(level / 500)));
    router.replace(`/map/${act}`);
  }, [router]);
  return null;
}
