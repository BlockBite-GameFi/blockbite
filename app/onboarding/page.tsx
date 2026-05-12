'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/useApp';
import { ChevronRight, ChevronLeft, Zap, Trophy, Wallet, Star } from 'lucide-react';

const SLIDES = {
  en: [
    {
      icon: <Zap size={40} />,
      accent: '#a78bfa',
      title: 'Place Blocks',
      sub: 'Drag and drop pieces onto the 8×8 grid. Clear full rows or columns to score.',
      hint: 'No time limit — pure skill, pure strategy.',
    },
    {
      icon: <Star size={40} />,
      accent: '#5eead4',
      title: 'Climb 4,000 Levels',
      sub: 'Journey through 8 unique biomes — Crystal Caverns to Apex Sanctum.',
      hint: 'Boss levels every 100 stages unlock rare blocks.',
    },
    {
      icon: <Trophy size={40} />,
      accent: '#fbbf24',
      title: 'Win Real USDC',
      sub: 'Top the monthly leaderboard and claim from the on-chain prize pool.',
      hint: '70% of every ticket goes directly to players.',
    },
    {
      icon: <Wallet size={40} />,
      accent: '#a78bfa',
      title: 'Connect & Play',
      sub: 'Link your Solana wallet, buy tickets, and start your journey on-chain.',
      hint: 'Scores, tickets, and rewards — all verifiable on Solana.',
    },
  ],
  id: [
    {
      icon: <Zap size={40} />,
      accent: '#a78bfa',
      title: 'Susun Blok',
      sub: 'Seret dan lepaskan potongan ke grid 8×8. Selesaikan baris atau kolom untuk skor.',
      hint: 'Tanpa batas waktu — murni keahlian dan strategi.',
    },
    {
      icon: <Star size={40} />,
      accent: '#5eead4',
      title: 'Taklukkan 4.000 Level',
      sub: 'Jelajahi 8 bioma unik — dari Crystal Caverns hingga Apex Sanctum.',
      hint: 'Level bos setiap 100 tahap membuka blok langka.',
    },
    {
      icon: <Trophy size={40} />,
      accent: '#fbbf24',
      title: 'Menangkan USDC Nyata',
      sub: 'Puncaki papan bulanan dan klaim hadiah dari prize pool on-chain.',
      hint: '70% dari setiap tiket langsung ke pemain.',
    },
    {
      icon: <Wallet size={40} />,
      accent: '#a78bfa',
      title: 'Hubungkan & Main',
      sub: 'Sambungkan dompet Solana, beli tiket, dan mulai perjalanan on-chain.',
      hint: 'Skor, tiket, dan hadiah — semua dapat diverifikasi di Solana.',
    },
  ],
};

export default function OnboardingPage() {
  const router = useRouter();
  const { lang } = useApp();
  const slides = SLIDES[lang];
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const isLast = step === slides.length - 1;

  const next = () => {
    if (isLast) {
      localStorage.setItem('bb:onboarded', '1');
      router.push('/game');
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--ds-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${slide.accent}18 0%, transparent 70%)`,
        pointerEvents: 'none', transition: 'background 0.5s ease',
      }} />

      {/* Skip */}
      <button
        onClick={() => { localStorage.setItem('bb:onboarded', '1'); router.push('/'); }}
        style={{
          position: 'absolute', top: 24, right: 24,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sg)', fontSize: 13, color: 'var(--ds-text-dim)',
          padding: '6px 12px',
        }}
      >
        Skip
      </button>

      {/* Card */}
      <div style={{
        background: 'var(--ds-surface)',
        border: '1px solid var(--ds-border)',
        borderRadius: 24, padding: '48px 40px',
        maxWidth: 440, width: '100%',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: slide.accent + '18',
          border: `1px solid ${slide.accent}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
          color: slide.accent,
          boxShadow: `0 0 32px ${slide.accent}22`,
          transition: 'all 0.4s ease',
        }}>
          {slide.icon}
        </div>

        <h2 style={{
          fontFamily: 'var(--font-sg)', fontWeight: 800,
          fontSize: 26, margin: '0 0 12px',
          color: 'var(--ds-text)',
        }}>
          {slide.title}
        </h2>

        <p style={{
          fontFamily: 'var(--font-sg)', fontSize: 15,
          color: 'var(--ds-text-dim)', lineHeight: 1.6,
          margin: '0 0 20px',
        }}>
          {slide.sub}
        </p>

        <div style={{
          background: slide.accent + '10',
          border: `1px solid ${slide.accent}22`,
          borderRadius: 10, padding: '10px 16px',
          fontFamily: 'var(--font-sg)', fontSize: 12,
          color: slide.accent, marginBottom: 36,
        }}>
          {slide.hint}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 24 : 8, height: 8,
                borderRadius: 4, border: 'none', cursor: 'pointer',
                background: i === step
                  ? `linear-gradient(135deg, var(--ds-accent), var(--ds-accent2))`
                  : 'var(--ds-border)',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: '0 0 auto', width: 46, height: 46, borderRadius: 12,
                background: 'var(--ds-surface2)',
                border: '1px solid var(--ds-border)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ds-text-dim)',
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <button
            onClick={next}
            style={{
              flex: 1, padding: '13px 0', borderRadius: 12, border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--ds-accent), var(--ds-accent2))',
              color: '#fff', fontFamily: 'var(--font-sg)',
              fontSize: 15, fontWeight: 700,
              boxShadow: '0 4px 16px rgba(167,139,250,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.15s',
            }}
          >
            {isLast ? (lang === 'en' ? 'Start Playing' : 'Mulai Main') : (lang === 'en' ? 'Next' : 'Lanjut')}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Step counter */}
      <p style={{
        fontFamily: 'var(--font-jb)', fontSize: 11,
        color: 'var(--ds-text-dim)', marginTop: 20, opacity: 0.5,
      }}>
        {step + 1} / {slides.length}
      </p>
    </main>
  );
}
