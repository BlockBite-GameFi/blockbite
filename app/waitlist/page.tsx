'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/* ── Brand constants ── */
const P1 = '#a78bfa';
const P2 = '#5eead4';
const GRAD = `linear-gradient(135deg,${P1},${P2})`;
const BG_DARK = '#07060f';
const BG_LIGHT = '#f4f1ff';

/* ── I18N ── */
const I18N = {
  en: {
    badge: 'COMING SOON · SOLANA DEVNET',
    h1: 'Play Blocks.',
    h1grad: 'Earn Real USDC.',
    sub: 'BlockBite is an on-chain match-3 puzzle game on Solana. Clear Acts, write proofs on-chain, and claim real USDC rewards.',
    cta: 'Join Waitlist →',
    note: 'No spam. Unsubscribe anytime. Stored in Vercel KV.',
    success: '✓ You\'re on the list! We\'ll notify you when BlockBite launches.',
    stats: [
      { v: '4,000', l: 'LEVELS' },
      { v: '8', l: 'ACTS' },
      { v: '100%', l: 'ON-CHAIN' },
      { v: '', l: 'WAITLIST', dynamic: true },
    ],
    features: [
      { ic: '◆', t: 'On-chain Proofs', d: 'Every Act completion writes a ProofCache PDA to Solana. Your progress is permanent and verifiable.' },
      { ic: '⛁', t: 'Real USDC Rewards', d: '70% of ticket revenue goes to the prize pool. Claim USDC directly to your wallet — no intermediaries.' },
      { ic: '▦', t: 'Skill-Based Match-3', d: '4,000 levels across 8 biomes. Boards seeded by keccak256 — same level looks identical for every player.' },
      { ic: '◷', t: 'Vesting Cooldown', d: '24-hour on-chain cooldown between claims. Enforced by the Solana program — not just a UI check.' },
      { ic: '◈', t: 'Transparent Tokenomics', d: '70% prize · 15% team · 10% dev · 5% referral. All splits happen atomically on-chain.' },
      { ic: '⛨', t: 'Squads Multisig', d: 'Admin actions require 2-of-3 Squads v4 signatures. The vault is PDA-owned — not a team wallet.' },
    ],
    featTitle: 'Why BlockBite?',
    featKicker: 'CORE FEATURES',
    howTitle: 'Start in 4 steps',
    howKicker: 'HOW IT WORKS',
    steps: [
      { t: 'Connect Wallet', d: 'Phantom, Solflare, Backpack, or any Solana wallet.' },
      { t: 'Buy Tickets', d: 'From $1 USDC. Tickets fuel gameplay and unlock reward tiers.' },
      { t: 'Clear Acts', d: 'Complete 500 levels to finish an Act and write your proof on-chain.' },
      { t: 'Claim USDC', d: 'After the 24h cooldown, claim your tier reward directly to your wallet.' },
    ],
    tokTitle: 'Revenue Split',
    tokKicker: 'TOKENOMICS',
    tokenomics: [
      { pct: '70%', name: 'Prize Pool', desc: 'Paid to winners via vault PDA', color: P2 },
      { pct: '15%', name: 'Team', desc: 'Operations & marketing', color: P1 },
      { pct: '10%', name: 'Dev', desc: 'Protocol development', color: '#fbbf24' },
      { pct: '5%', name: 'Referral', desc: 'Direct to referrer wallet', color: '#f472b6' },
    ],
    footer: '© 2026 BlockBite · Solana Devnet',
  },
  id: {
    badge: 'SEGERA HADIR · SOLANA DEVNET',
    h1: 'Main Blok.',
    h1grad: 'Dapatkan USDC Asli.',
    sub: 'BlockBite adalah game puzzle match-3 on-chain di Solana. Selesaikan Babak, tulis bukti on-chain, dan klaim hadiah USDC nyata.',
    cta: 'Daftar Waitlist →',
    note: 'Tanpa spam. Bisa berhenti kapan saja. Disimpan di Vercel KV.',
    success: '✓ Kamu sudah terdaftar! Kami akan notifikasi saat BlockBite meluncur.',
    stats: [
      { v: '4.000', l: 'LEVEL' },
      { v: '8', l: 'BABAK' },
      { v: '100%', l: 'ON-CHAIN' },
      { v: '', l: 'WAITLIST', dynamic: true },
    ],
    features: [
      { ic: '◆', t: 'Bukti On-chain', d: 'Setiap Babak selesai menulis ProofCache PDA ke Solana. Progresmu permanen dan terverifikasi.' },
      { ic: '⛁', t: 'Hadiah USDC Nyata', d: '70% pendapatan tiket masuk ke pool hadiah. Klaim USDC langsung ke wallet tanpa perantara.' },
      { ic: '▦', t: 'Match-3 Berbasis Skill', d: '4.000 level di 8 bioma. Papan diacak oleh keccak256 — level yang sama terlihat identik untuk setiap pemain.' },
      { ic: '◷', t: 'Cooldown Vesting', d: 'Cooldown 24 jam on-chain antara klaim. Dipaksakan oleh program Solana — bukan hanya pemeriksaan UI.' },
      { ic: '◈', t: 'Tokenomik Transparan', d: '70% hadiah · 15% tim · 10% dev · 5% referral. Semua pembagian terjadi secara atomik on-chain.' },
      { ic: '⛨', t: 'Multisig Squads', d: 'Aksi admin memerlukan tanda tangan 2-dari-3 Squads v4. Vault dimiliki PDA — bukan wallet tim.' },
    ],
    featTitle: 'Kenapa BlockBite?',
    featKicker: 'FITUR UTAMA',
    howTitle: 'Mulai dalam 4 langkah',
    howKicker: 'CARA KERJA',
    steps: [
      { t: 'Hubungkan Wallet', d: 'Phantom, Solflare, Backpack, atau wallet Solana apapun.' },
      { t: 'Beli Tiket', d: 'Mulai dari $1 USDC. Tiket untuk bermain dan membuka tingkat hadiah.' },
      { t: 'Selesaikan Babak', d: 'Selesaikan 500 level untuk menyelesaikan Babak dan tulis bukti on-chain.' },
      { t: 'Klaim USDC', d: 'Setelah cooldown 24 jam, klaim hadiahmu langsung ke wallet.' },
    ],
    tokTitle: 'Pembagian Pendapatan',
    tokKicker: 'TOKENOMIK',
    tokenomics: [
      { pct: '70%', name: 'Pool Hadiah', desc: 'Dibayar ke pemenang via vault PDA', color: P2 },
      { pct: '15%', name: 'Tim', desc: 'Operasional & pemasaran', color: P1 },
      { pct: '10%', name: 'Dev', desc: 'Pengembangan protokol', color: '#fbbf24' },
      { pct: '5%', name: 'Referral', desc: 'Langsung ke wallet referrer', color: '#f472b6' },
    ],
    footer: '© 2026 BlockBite · Solana Devnet',
  },
};

type Lang = 'en' | 'id';
type Theme = 'dark' | 'light';

export default function WaitlistPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const [count, setCount] = useState<number>(0);

  const cvs = useRef<HTMLCanvasElement>(null);

  const txt = I18N[lang];
  const isDark = theme === 'dark';
  const bg = isDark ? BG_DARK : BG_LIGHT;
  const textColor = isDark ? '#fff' : '#0a0a14';
  const dimColor = isDark ? '#94a3b8' : '#475569';
  const surfaceColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)';

  /* Fetch waitlist count */
  useEffect(() => {
    fetch('/api/waitlist/count')
      .then(r => r.json())
      .then(d => {
        if (typeof d?.count === 'number') setCount(d.count);
      })
      .catch(() => {});
  }, []);

  /* Canvas animation */
  useEffect(() => {
    const canvas = cvs.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const COLORS = [P1, P2, '#fbbf24', '#f472b6', '#7dd3fc', '#fb923c'];
    type Block = { x: number; y: number; size: number; rot: number; vx: number; vy: number; vr: number; color: string; alpha: number };
    let blocks: Block[] = [];
    let rafId: number;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      blocks = Array.from({ length: 28 }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        size: Math.random() * 48 + 16,
        rot: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vr: (Math.random() - 0.5) * 0.012,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.45 + 0.06,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      blocks.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.vr;
        if (b.x < -70) b.x = canvas!.width + 70;
        if (b.x > canvas!.width + 70) b.x = -70;
        if (b.y < -70) b.y = canvas!.height + 70;
        if (b.y > canvas!.height + 70) b.y = -70;
        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        const r = b.size * 0.22;
        const s = b.size / 2;
        ctx.beginPath();
        ctx.moveTo(-s + r, -s);
        ctx.arcTo(s, -s, s, s, r);
        ctx.arcTo(s, s, -s, s, r);
        ctx.arcTo(-s, s, -s, -s, r);
        ctx.arcTo(-s, -s, s, -s, r);
        ctx.closePath();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });
      rafId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  async function submit() {
    if (!email || !email.includes('@')) {
      setErr(true);
      setTimeout(() => setErr(false), 1500);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok || res.status === 409) {
        setDone(true);
        setCount(c => c + 1);
      }
    } catch {
      setDone(true);
    }
    setBusy(false);
  }

  const styles = `
    @keyframes wlPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    @keyframes wlFloat {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(5deg); }
    }
    input:focus { border-color: ${P1} !important; box-shadow: 0 0 0 3px rgba(167,139,250,0.2) !important; }
  `;

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textColor, fontFamily: "'Space Grotesk', system-ui, sans-serif", transition: 'background 0.3s, color 0.3s', overflowX: 'hidden' }}>
      <style>{styles}</style>

      {/* Canvas background */}
      <canvas ref={cvs} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: isDark ? 0.18 : 0.08 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Nav */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 28px', borderBottom: `1px solid ${borderColor}`,
          background: isDark ? 'rgba(7,6,15,0.7)' : 'rgba(244,241,255,0.85)',
          backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: textColor }}>
            <svg width="36" height="36" viewBox="0 0 36 36">
              <defs>
                <linearGradient id="nlg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={P1} />
                  <stop offset="100%" stopColor={P2} />
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="9" fill="url(#nlg)" />
              <text x="18" y="26" textAnchor="middle" fontSize="22" fontWeight="900" fill="#0a0a14">◆</text>
            </svg>
            <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>BlockBite</span>
          </Link>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <SegBtn value={lang} onChange={setLang} options={['en', 'id']} />
            <SegBtn value={theme} onChange={setTheme} options={['dark', 'light']} />
          </div>
        </nav>

        {/* Hero */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '60px 24px 40px', gap: '28px' }}>
          
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: 999,
            border: `1px solid ${P1}`, background: 'rgba(167,139,250,0.12)',
            fontSize: '12px', fontWeight: 800, color: P1, letterSpacing: '1.5px',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: P1, animation: 'wlPulse 2s infinite' }} />
            {txt.badge}
          </div>

          {/* H1 */}
          <h1 style={{ fontSize: 'clamp(36px,8vw,88px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-2px', maxWidth: 800, margin: 0 }}>
            {txt.h1}<br />
            <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {txt.h1grad}
            </span>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 'clamp(14px,2vw,18px)', color: dimColor, maxWidth: 520, lineHeight: 1.6, margin: 0 }}>
            {txt.sub}
          </p>

          {/* Floating blocks */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
            {[
              { color: P1, icon: '◆', d: '3.2s' },
              { color: P2, icon: '◈', d: '2.8s' },
              { color: '#fbbf24', icon: '◉', d: '3.5s' },
              { color: '#f472b6', icon: '✦', d: '2.5s' },
              { color: '#7dd3fc', icon: '⬡', d: '3.8s' },
              { color: '#fb923c', icon: '◇', d: '2.9s' },
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 900, color: '#0a0a14', background: b.color,
                  animation: `wlFloat ${b.d} ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                {b.icon}
              </div>
            ))}
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder={lang === 'en' ? 'your@email.com' : 'email@anda.com'}
                style={{
                  flex: 1, padding: '14px 18px', borderRadius: 12, background: surfaceColor, border: `1px solid ${err ? '#ef4444' : borderColor}`,
                  color: textColor, fontFamily: 'inherit', fontSize: 15, outline: 'none', transition: '0.15s',
                }}
              />
              <button
                onClick={submit} disabled={busy}
                style={{
                  padding: '14px 28px', borderRadius: 12, background: GRAD, color: '#0a0a14', fontWeight: 900, fontSize: 15,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  boxShadow: '0 0 24px rgba(167,139,250,0.4)', transition: 'transform 0.15s, box-shadow 0.15s', letterSpacing: '0.5px',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'translateY(2px)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {busy ? (lang === 'en' ? 'Joining...' : 'Mendaftar...') : txt.cta}
              </button>
            </div>
            {done && <div style={{ padding: '16px 24px', borderRadius: 14, background: `rgba(${P2 === '#5eead4' ? '94,234,212' : '100,100,100'},0.15)`, border: `1px solid ${P2}`, color: P2, fontWeight: 700, fontSize: 14, textAlign: 'center' }}>
              {txt.success}
            </div>}
            <div style={{ fontSize: '11px', color: dimColor, letterSpacing: '0.5px' }}>{txt.note}</div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {txt.stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: textColor }}>
                  {s.dynamic ? count : s.v}
                </div>
                <div style={{ fontSize: 11, color: dimColor, letterSpacing: '1.5px', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', color: P1, marginBottom: 10, textAlign: 'center' }}>{txt.featKicker}</div>
          <div style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, textAlign: 'center', marginBottom: 40 }}>{txt.featTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {txt.features.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: 24, borderRadius: 20, background: surfaceColor, border: `1px solid ${borderColor}`,
                  transition: '0.2s', cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = P1;
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(167,139,250,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = borderColor;
                  (e.currentTarget as HTMLDivElement).style.background = surfaceColor;
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 14, lineHeight: 1 }}>{f.ic}</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{f.t}</div>
                <div style={{ fontSize: 13, color: dimColor, lineHeight: 1.6 }}>{f.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How */}
        <section style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', color: P1, marginBottom: 10, textAlign: 'center' }}>{txt.howKicker}</div>
          <div style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, textAlign: 'center', marginBottom: 40 }}>{txt.howTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 32 }}>
            {txt.steps.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: 20, borderRadius: 16, background: surfaceColor, border: `1px solid ${borderColor}`,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: 48, fontWeight: 900, color: P1, opacity: 0.15, position: 'absolute', top: 8, right: 14, lineHeight: 1 }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, position: 'relative' }}>{s.t}</div>
                <div style={{ fontSize: 12, color: dimColor, lineHeight: 1.6, position: 'relative' }}>{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tokenomics */}
        <section style={{ padding: '60px 24px 80px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', color: P1, marginBottom: 10, textAlign: 'center' }}>{txt.tokKicker}</div>
          <div style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, textAlign: 'center', marginBottom: 40 }}>{txt.tokTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 24, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            {txt.tokenomics.map((tok, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 14, background: surfaceColor, border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: tok.color }}>{tok.pct}</div>
                <div>
                  <div style={{ fontWeight: 800 }}>{tok.name}</div>
                  <div style={{ fontSize: 12, color: dimColor }}>{tok.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: `1px solid ${borderColor}`, padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12, color: dimColor }}>
          <div>{txt.footer}</div>
        </footer>
      </div>
    </div>
  );
}

function SegBtn({ value, onChange, options }: { value: string; onChange: (v: any) => void; options: string[] }) {
  return (
    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: 3, gap: 3 }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            border: 'none', background: value === opt ? P1 : 'transparent', color: value === opt ? '#0a0a14' : '#94a3b8',
            padding: '6px 12px', borderRadius: 999, fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
            transition: '0.15s', letterSpacing: '0.5px',
          }}
        >
          {opt === 'en' ? 'EN' : opt === 'id' ? 'ID' : opt === 'dark' ? '🌙' : '☀'}
        </button>
      ))}
    </div>
  );
}
