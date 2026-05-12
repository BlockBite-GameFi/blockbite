'use client';

import { useApp } from '@/lib/useApp';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SLIDES = {
  en: [
    { ic: '◆', t: 'Welcome to BlockBite', d: 'On-chain match-3 with real USDC rewards on Solana.' },
    { ic: '⛁', t: 'Buy Tickets',           d: 'From $1 USDC. Tickets fuel gameplay and unlock reward tiers.' },
    { ic: '⛨', t: 'Clear Acts',            d: '500 levels → on-chain proof → claim USDC. 8 acts total.' },
    { ic: '◷', t: '24h Cooldown',          d: 'Enforced by the Solana program — not just a UI check.' },
  ],
  id: [
    { ic: '◆', t: 'Selamat Datang',        d: 'Match-3 on-chain dengan hadiah USDC nyata di Solana.' },
    { ic: '⛁', t: 'Beli Tiket',            d: 'Mulai dari $1 USDC. Tiket untuk bermain dan buka tier hadiah.' },
    { ic: '⛨', t: 'Selesaikan Babak',      d: '500 level → bukti on-chain → klaim USDC. Total 8 babak.' },
    { ic: '◷', t: 'Cooldown 24 Jam',       d: 'Dipaksa oleh program Solana — bukan sekadar cek UI.' },
  ],
};

export default function OnboardingPage() {
  const { lang, theme } = useApp();
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const slides = SLIDES[lang];
  const s = slides[idx];
  const isLast = idx === slides.length - 1;

  function next() {
    if (isLast) { router.push('/'); return; }
    setIdx(i => i + 1);
  }

  return (
    <main data-theme={theme} className="onboard">
      <div className="ic">{s.ic}</div>
      <h1>{s.t}</h1>
      <p>{s.d}</p>

      <div className="dots">
        {slides.map((_, i) => (
          <span key={i} data-on={String(i === idx)} />
        ))}
      </div>

      <button onClick={next}>
        {isLast
          ? (lang === 'id' ? 'Mulai Bermain' : 'Get Started') + ' →'
          : (lang === 'id' ? 'Lanjut' : 'Next') + ' →'}
      </button>
    </main>
  );
}
