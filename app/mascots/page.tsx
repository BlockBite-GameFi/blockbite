'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MascotSVG, BRAND_MASCOTS, generateMascots, PAL_KEYS, PALETTES, type MascotConfig } from '@/components/Mascot';

const ALL_MASCOTS = generateMascots(100);
const CATS = ['all', 'cute', 'emotion', 'themed', 'special'] as const;

const BG = '#07060f';
const MAGENTA = '#b12c84';
const DIM = '#64748b';

export default function MascotsPage() {
  const [filter, setFilter] = useState<string>('all');
  const [hovered, setHovered] = useState<number | null>(null);

  const filtered = useMemo<MascotConfig[]>(() => {
    if (filter === 'all') return ALL_MASCOTS;
    if (filter.startsWith('pal:')) return ALL_MASCOTS.filter(m => m.palKey === filter.slice(4));
    return ALL_MASCOTS.filter(m => m.category === filter);
  }, [filter]);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;800;900&display=swap');
        @keyframes bbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes bbSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .mascot-card:hover { transform:translateY(-6px) scale(1.05) !important; }
        .filter-btn { padding:7px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:#94a3b8; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; letter-spacing:.5px; transition:.15s; }
        .filter-btn.active { background:${MAGENTA}; color:#fff; border-color:${MAGENTA}; }
        .filter-btn:hover:not(.active) { border-color:rgba(255,255,255,0.25); color:#fff; }
      `}</style>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(7,6,15,0.85)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
          <img src="/logo.png" alt="BlockBite" width={34} height={34} style={{ objectFit: 'contain', flexShrink: 0 }}/>
          <span style={{ fontSize: 18, fontWeight: 900 }}>BlockBite</span>
        </Link>
        <div style={{ flex: 1 }}/>
        <Link href="/game" style={{
          padding: '8px 18px', borderRadius: 999,
          background: `linear-gradient(135deg, ${MAGENTA}, #5055a4)`,
          color: '#fff', fontWeight: 800, fontSize: 13, textDecoration: 'none',
        }}>PLAY</Link>
      </nav>

      {/* Header */}
      <div style={{ padding: '52px 32px 24px', animation: 'bbSlide .5s ease both' }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: MAGENTA, marginBottom: 10, fontFamily: 'Space Grotesk,sans-serif' }}>BLOCKBITE UNIVERSE</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
          Mascot{' '}
          <span style={{ background: `linear-gradient(135deg, ${MAGENTA}, #5055a4)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Icons
          </span>
        </h1>
        <p style={{ color: DIM, fontSize: 14, marginTop: 8, marginBottom: 0 }}>
          100 unique block mascots · SVG · expressions · accessories · palettes · for social, stickers &amp; marketing
        </p>
      </div>

      {/* Brand mascots spotlight */}
      <div style={{ padding: '0 32px 40px' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: DIM, marginBottom: 20, fontWeight: 700 }}>THE CREW — 5 BRAND MASCOTS</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {BRAND_MASCOTS.map(m => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'bbFloat 3s ease-in-out infinite', animationDelay: `${(m.id - 101) * 0.4}s` }}>
              <MascotSVG cfg={m} size={140}/>
              <div style={{ fontSize: 13, fontWeight: 800, color: PALETTES[m.palKey][0] }}>{m.name}</div>
              <div style={{ fontSize: 10, color: DIM, letterSpacing: 1 }}>{m.exprKey.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 32px' }}/>

      {/* Filter bar */}
      <div style={{ padding: '20px 32px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {CATS.map(f => {
          const cnt = f === 'all' ? ALL_MASCOTS.length : ALL_MASCOTS.filter(m => m.category === f).length;
          return (
            <button key={f} className={'filter-btn' + (filter === f ? ' active' : '')} onClick={() => setFilter(f)}>
              {f === 'all' ? `ALL (${cnt})` : f.toUpperCase() + ` (${cnt})`}
            </button>
          );
        })}
        <span style={{ color: DIM, fontSize: 11, padding: '0 4px' }}>palette:</span>
        {PAL_KEYS.map(k => (
          <button
            key={k}
            className={'filter-btn' + (filter === `pal:${k}` ? ' active' : '')}
            onClick={() => setFilter(`pal:${k}`)}
            style={{ borderColor: PALETTES[k][0] + '66' }}
          >
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: PALETTES[k][0], marginRight: 4, verticalAlign: 'middle' }}/>
            {k}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ padding: '0 32px 12px', fontSize: 11, color: DIM, fontWeight: 700 }}>
        {filtered.length} icons shown
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 16, padding: '0 32px 64px',
      }}>
        {filtered.map(m => (
          <div
            key={m.id}
            className="mascot-card"
            onMouseEnter={() => setHovered(m.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: '.2s ease' }}
          >
            <MascotSVG cfg={m} size={hovered === m.id ? 124 : 120}/>
            <div style={{ fontSize: 9, color: DIM, fontWeight: 700, letterSpacing: '.5px', textAlign: 'center' }}>
              #{String(m.id).padStart(3, '0')} · {m.palKey}
            </div>
            <div style={{
              fontSize: 8, padding: '2px 6px', borderRadius: 999,
              background: PALETTES[m.palKey][0] + '25', color: PALETTES[m.palKey][0],
              fontWeight: 700, letterSpacing: '.5px',
            }}>
              {m.exprKey}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
