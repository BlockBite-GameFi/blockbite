'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/* ── BlockBite Brand ── */
const MAGENTA  = '#b12c84';
const TEAL     = '#3d7c91';
const GOLD     = '#e1a438';
const PURPLE   = '#5055a4';
const CORAL    = '#d94553';
const BG       = '#08080f';
const BG_LIGHT = '#f5f1f8';

const GRAD_MAIN = `linear-gradient(135deg, ${MAGENTA}, ${PURPLE})`;
const GRAD_ALT  = `linear-gradient(135deg, ${TEAL}, ${GOLD})`;

/* ── I18N ── */
const I18N = {
  en: {
    badge: 'SOLANA ECOSYSTEM · EARLY ACCESS',
    h1: 'Stop Distributing',
    h1grad: 'Tokens Blindly.',
    sub: 'Secure your assets with automated, milestone-based distribution that eliminates fatal human error while transforming passive claimants into loyal, long-term contributors.',
    target: 'For Solana Ecosystem Builders & Project Founders',
    cta: 'Get Early Access — Join the Waitlist Now!',
    note: 'No spam. Unsubscribe anytime.',
    success: '✓ You\'re on the list! We\'ll notify you when BlockBite launches.',
    stats: [
      { v: '100%', l: 'ON-CHAIN' },
      { v: 'Multi-sig', l: 'ADMIN CONTROL' },
      { v: '0', l: 'HUMAN ERROR' },
      { v: '', l: 'WAITLIST', dynamic: true },
    ],
    features: [
      { color: MAGENTA, t: 'Milestone-Based Distribution', d: 'Set unlock conditions tied to real project milestones — not just time. Contributors receive tokens only when targets are met.' },
      { color: TEAL,    t: 'Automated & Trustless', d: 'Smart contract enforces all distribution rules on-chain. No manual transfers, no oversight gaps, no rug-pull vectors.' },
      { color: GOLD,    t: 'Cliff + Linear Vesting', d: 'Configure cliff periods and linear unlock schedules. On-chain enforcement means even the team can\'t bypass the rules.' },
      { color: PURPLE,  t: 'Squads Multisig Admin', d: 'All admin actions require 2-of-3 Squads v4 signatures. Vault is PDA-owned — never a hot wallet.' },
      { color: CORAL,   t: 'Full Transparency', d: 'Every vesting schedule, unlock event, and claim is recorded on-chain. Auditable by anyone, anytime.' },
      { color: TEAL,    t: 'Loyal Contributor Incentives', d: 'Transform passive token holders into active contributors by aligning rewards with long-term project success.' },
    ],
    featTitle: 'Why BlockBite?',
    featKicker: 'CORE FEATURES',
    howTitle: 'Deploy in 4 steps',
    howKicker: 'HOW IT WORKS',
    steps: [
      { t: 'Connect Wallet', d: 'Connect your Solana wallet — Phantom, Solflare, Backpack, or any compatible wallet.' },
      { t: 'Define Schedules', d: 'Set cliff periods, vesting durations, and milestone unlock conditions for each recipient group.' },
      { t: 'Fund the Vault', d: 'Deposit tokens into the PDA-owned vault. Multisig approval required for any admin action.' },
      { t: 'Automated Distribution', d: 'Recipients claim vested tokens on-chain when conditions are met. Zero manual intervention needed.' },
    ],
    footer: '© 2026 BlockBite · Built on Solana',
  },
  id: {
    badge: 'EKOSISTEM SOLANA · AKSES AWAL',
    h1: 'Hentikan Distribusi',
    h1grad: 'Token Sembarangan.',
    sub: 'Amankan asetmu dengan distribusi berbasis milestone yang otomatis — menghilangkan kesalahan manusia yang fatal sekaligus mengubah penerima pasif menjadi kontributor jangka panjang yang loyal.',
    target: 'Untuk Builder & Founder Ekosistem Solana',
    cta: 'Dapatkan Akses Awal — Daftar Waitlist Sekarang!',
    note: 'Tanpa spam. Bisa berhenti kapan saja.',
    success: '✓ Kamu sudah terdaftar! Kami akan notifikasi saat BlockBite meluncur.',
    stats: [
      { v: '100%', l: 'ON-CHAIN' },
      { v: 'Multi-sig', l: 'KONTROL ADMIN' },
      { v: '0', l: 'KESALAHAN MANUSIA' },
      { v: '', l: 'WAITLIST', dynamic: true },
    ],
    features: [
      { color: MAGENTA, t: 'Distribusi Berbasis Milestone', d: 'Tetapkan kondisi unlock yang terikat pada milestone proyek nyata — bukan sekadar waktu. Kontributor menerima token hanya saat target tercapai.' },
      { color: TEAL,    t: 'Otomatis & Trustless', d: 'Smart contract menegakkan semua aturan distribusi on-chain. Tanpa transfer manual, tanpa celah pengawasan.' },
      { color: GOLD,    t: 'Cliff + Vesting Linear', d: 'Konfigurasi periode cliff dan jadwal unlock linear. Penegakan on-chain berarti bahkan tim tidak bisa melewatinya.' },
      { color: PURPLE,  t: 'Admin Multisig Squads', d: 'Semua aksi admin memerlukan tanda tangan 2-dari-3 Squads v4. Vault dimiliki PDA — bukan hot wallet.' },
      { color: CORAL,   t: 'Transparansi Penuh', d: 'Setiap jadwal vesting, event unlock, dan klaim tercatat on-chain. Dapat diaudit siapa saja, kapan saja.' },
      { color: TEAL,    t: 'Insentif Kontributor Loyal', d: 'Ubah pemegang token pasif menjadi kontributor aktif dengan menyelaraskan reward dengan kesuksesan proyek jangka panjang.' },
    ],
    featTitle: 'Kenapa BlockBite?',
    featKicker: 'FITUR UTAMA',
    howTitle: 'Deploy dalam 4 langkah',
    howKicker: 'CARA KERJA',
    steps: [
      { t: 'Hubungkan Wallet', d: 'Hubungkan wallet Solanamu — Phantom, Solflare, Backpack, atau wallet compatible apapun.' },
      { t: 'Tentukan Jadwal', d: 'Atur periode cliff, durasi vesting, dan kondisi unlock milestone untuk setiap kelompok penerima.' },
      { t: 'Dana Vault', d: 'Depositkan token ke vault milik PDA. Persetujuan multisig diperlukan untuk aksi admin apapun.' },
      { t: 'Distribusi Otomatis', d: 'Penerima mengklaim token yang sudah vested on-chain saat kondisi terpenuhi. Tanpa intervensi manual.' },
    ],
    footer: '© 2026 BlockBite · Dibangun di Solana',
  },
};

type Lang = 'en' | 'id';

export default function WaitlistPage() {
  const [lang, setLang]   = useState<Lang>('en');
  const [email, setEmail] = useState('');
  const [done, setDone]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState(false);
  const [count, setCount] = useState<number>(0);

  const cvs = useRef<HTMLCanvasElement>(null);
  const txt = I18N[lang];

  useEffect(() => {
    fetch('/api/waitlist/count')
      .then(r => r.json())
      .then(d => { if (typeof d?.count === 'number') setCount(d.count); })
      .catch(() => {});
  }, []);

  /* Floating blocks canvas */
  useEffect(() => {
    const canvas = cvs.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const COLORS = [MAGENTA, TEAL, GOLD, PURPLE, CORAL];
    type Block = { x: number; y: number; size: number; rot: number; vx: number; vy: number; vr: number; color: string; alpha: number };
    let blocks: Block[] = [];
    let rafId: number;

    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
      blocks = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        size: Math.random() * 52 + 14,
        rot: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vr: (Math.random() - 0.5) * 0.01,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.3 + 0.04,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      blocks.forEach(b => {
        b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        if (b.x < -80)                b.x = canvas!.width  + 80;
        if (b.x > canvas!.width  + 80) b.x = -80;
        if (b.y < -80)                b.y = canvas!.height + 80;
        if (b.y > canvas!.height + 80) b.y = -80;
        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        const r = b.size * 0.2, s = b.size / 2;
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
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); };
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

  const border = 'rgba(255,255,255,0.08)';
  const surface = 'rgba(255,255,255,0.04)';
  const dim = '#8892a4';

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: "'Montserrat', 'Roboto', system-ui, sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Roboto:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
        @keyframes bbPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        @keyframes bbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes bbSlide { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .wl-feature:hover { border-color: ${MAGENTA} !important; background: rgba(177,44,132,0.07) !important; }
        .wl-input:focus { border-color: ${MAGENTA} !important; box-shadow: 0 0 0 3px rgba(177,44,132,0.2) !important; outline:none; }
        .wl-btn:hover { filter: brightness(1.1); }
        .wl-btn:active { transform: translateY(2px); }
      `}</style>

      {/* BG canvas */}
      <canvas ref={cvs} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.22 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Nav */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 32px', borderBottom: `1px solid ${border}`,
          background: 'rgba(8,8,15,0.75)', backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
            {/* Stacked B-block logo mark */}
            <svg width="38" height="38" viewBox="0 0 38 38">
              <defs>
                <linearGradient id="lgNav" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={MAGENTA}/>
                  <stop offset="100%" stopColor={PURPLE}/>
                </linearGradient>
              </defs>
              <rect width="38" height="38" rx="10" fill="url(#lgNav)"/>
              <text x="19" y="27" textAnchor="middle" fontSize="22" fontWeight="900" fill="#fff" fontFamily="Montserrat,sans-serif">B</text>
            </svg>
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', fontFamily: 'Montserrat,sans-serif' }}>BlockBite</span>
          </Link>

          {/* Lang switcher */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 999, padding: 3, gap: 3 }}>
            {(['en','id'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                border: 'none', background: lang === l ? MAGENTA : 'transparent',
                color: lang === l ? '#fff' : dim,
                padding: '6px 14px', borderRadius: 999, fontWeight: 700, fontSize: 11,
                cursor: 'pointer', fontFamily: 'Montserrat,sans-serif', transition: '0.15s', letterSpacing: '0.5px',
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '72px 24px 48px', gap: 28, animation: 'bbSlide 0.6s ease both' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 999,
            border: `1px solid ${MAGENTA}`, background: 'rgba(177,44,132,0.12)',
            fontSize: 11, fontWeight: 800, color: MAGENTA, letterSpacing: '2px',
            fontFamily: 'IBM Plex Mono, monospace',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: MAGENTA, animation: 'bbPulse 2s infinite', flexShrink: 0 }}/>
            {txt.badge}
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(36px,8vw,90px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-2px', maxWidth: 820, margin: 0, fontFamily: 'Montserrat,sans-serif' }}>
            {txt.h1}<br/>
            <span style={{ background: GRAD_MAIN, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {txt.h1grad}
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{ fontSize: 'clamp(15px,2vw,19px)', color: '#c8ccd6', maxWidth: 600, lineHeight: 1.65, margin: 0, fontFamily: 'Roboto,sans-serif', fontWeight: 400 }}>
            {txt.sub}
          </p>

          {/* Target user pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 999,
            border: `1px solid ${TEAL}44`, background: `${TEAL}11`,
            fontSize: 12, fontWeight: 600, color: TEAL, letterSpacing: '0.5px',
            fontFamily: 'Roboto,sans-serif',
          }}>
            🎯 {txt.target}
          </div>

          {/* Floating block decorations */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            {[
              { c: MAGENTA, d: '3.1s' }, { c: TEAL,   d: '2.7s' },
              { c: GOLD,    d: '3.4s' }, { c: PURPLE, d: '2.4s' },
              { c: CORAL,   d: '3.7s' }, { c: TEAL,   d: '2.9s' },
            ].map((b, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: 9,
                background: b.c, animation: `bbFloat ${b.d} ease-in-out infinite`,
                animationDelay: `${i * 0.18}s`,
              }}/>
            ))}
          </div>

          {/* Email form */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 500 }}>
            {!done ? (
              <>
                <div style={{ display: 'flex', gap: 8, width: '100%', flexWrap: 'wrap' }}>
                  <input
                    className="wl-input"
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder={lang === 'en' ? 'your@email.com' : 'email@anda.com'}
                    style={{
                      flex: 1, minWidth: 200, padding: '15px 20px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${err ? CORAL : border}`,
                      color: '#fff', fontFamily: 'Roboto,sans-serif', fontSize: 15,
                      transition: '0.15s',
                    }}
                  />
                  <button
                    className="wl-btn"
                    onClick={submit} disabled={busy}
                    style={{
                      padding: '15px 28px', borderRadius: 12,
                      background: GRAD_MAIN, color: '#fff',
                      fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer',
                      fontFamily: 'Montserrat,sans-serif', whiteSpace: 'nowrap',
                      boxShadow: `0 4px 32px ${MAGENTA}44`, transition: '0.15s', letterSpacing: '0.3px',
                    }}
                  >
                    {busy ? (lang === 'en' ? 'Joining...' : 'Mendaftar...') : txt.cta}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: dim, letterSpacing: '0.5px', fontFamily: 'Roboto,sans-serif' }}>{txt.note}</div>
              </>
            ) : (
              <div style={{
                padding: '18px 28px', borderRadius: 14,
                background: `${TEAL}18`, border: `1.5px solid ${TEAL}`,
                color: TEAL, fontWeight: 700, fontSize: 15, textAlign: 'center',
                fontFamily: 'Roboto,sans-serif',
              }}>
                {txt.success}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '40px', marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {txt.stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'Montserrat,sans-serif', letterSpacing: '-0.5px' }}>
                  {s.dynamic ? count : s.v}
                </div>
                <div style={{ fontSize: 10, color: dim, letterSpacing: '2px', marginTop: 2, fontFamily: 'IBM Plex Mono,monospace' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${MAGENTA}44, transparent)`, margin: '0 40px' }}/>

        {/* ── Features ── */}
        <section style={{ padding: '72px 24px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: '3px', color: MAGENTA, marginBottom: 10, textAlign: 'center', fontFamily: 'IBM Plex Mono,monospace' }}>{txt.featKicker}</div>
          <div style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, textAlign: 'center', marginBottom: 48, fontFamily: 'Montserrat,sans-serif' }}>{txt.featTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {txt.features.map((f, i) => (
              <div className="wl-feature" key={i} style={{
                padding: '28px 24px', borderRadius: 20,
                background: surface, border: `1.5px solid ${border}`,
                transition: '0.2s', cursor: 'default',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${f.color}22`, border: `1.5px solid ${f.color}44`, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: f.color }}/>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, fontFamily: 'Montserrat,sans-serif', color: '#fff' }}>{f.t}</div>
                <div style={{ fontSize: 13, color: dim, lineHeight: 1.65, fontFamily: 'Roboto,sans-serif' }}>{f.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${TEAL}44, transparent)`, margin: '0 40px' }}/>

        {/* ── How it works ── */}
        <section style={{ padding: '72px 24px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: '3px', color: TEAL, marginBottom: 10, textAlign: 'center', fontFamily: 'IBM Plex Mono,monospace' }}>{txt.howKicker}</div>
          <div style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, textAlign: 'center', marginBottom: 48, fontFamily: 'Montserrat,sans-serif' }}>{txt.howTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {txt.steps.map((s, i) => (
              <div key={i} style={{
                padding: '24px 20px', borderRadius: 18,
                background: surface, border: `1.5px solid ${border}`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 10, right: 16,
                  fontSize: 64, fontWeight: 900, color: MAGENTA, opacity: 0.1, lineHeight: 1,
                  fontFamily: 'Montserrat,sans-serif',
                }}>
                  {i + 1}
                </div>
                {/* Step number badge */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: GRAD_MAIN,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 14,
                  fontFamily: 'Montserrat,sans-serif',
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, fontFamily: 'Montserrat,sans-serif' }}>{s.t}</div>
                <div style={{ fontSize: 13, color: dim, lineHeight: 1.6, fontFamily: 'Roboto,sans-serif' }}>{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section style={{ padding: '60px 24px 80px', textAlign: 'center' }}>
          <div style={{
            maxWidth: 600, margin: '0 auto',
            padding: '48px 32px', borderRadius: 24,
            background: 'rgba(177,44,132,0.08)', border: `1.5px solid ${MAGENTA}33`,
          }}>
            <div style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, marginBottom: 16, fontFamily: 'Montserrat,sans-serif' }}>
              Ready to secure your token distribution?
            </div>
            <p style={{ color: dim, fontSize: 15, marginBottom: 28, lineHeight: 1.6, fontFamily: 'Roboto,sans-serif' }}>
              {lang === 'en'
                ? 'Join the waitlist and be first to automate trust-minimized vesting on Solana.'
                : 'Daftar waitlist dan jadilah yang pertama mengotomasi vesting berbasis kepercayaan di Solana.'}
            </p>
            {!done ? (
              <div style={{ display: 'flex', gap: 8, maxWidth: 440, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
                <input
                  className="wl-input"
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder={lang === 'en' ? 'your@email.com' : 'email@anda.com'}
                  style={{
                    flex: 1, minWidth: 180, padding: '14px 18px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${border}`,
                    color: '#fff', fontFamily: 'Roboto,sans-serif', fontSize: 14,
                    transition: '0.15s',
                  }}
                />
                <button
                  className="wl-btn"
                  onClick={submit} disabled={busy}
                  style={{
                    padding: '14px 24px', borderRadius: 12,
                    background: GRAD_MAIN, color: '#fff',
                    fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer',
                    fontFamily: 'Montserrat,sans-serif', boxShadow: `0 4px 24px ${MAGENTA}44`, transition: '0.15s',
                  }}
                >
                  {busy ? '...' : txt.cta}
                </button>
              </div>
            ) : (
              <div style={{ padding: '16px 24px', borderRadius: 12, background: `${TEAL}18`, border: `1.5px solid ${TEAL}`, color: TEAL, fontWeight: 700, fontFamily: 'Roboto,sans-serif' }}>
                {txt.success}
              </div>
            )}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          borderTop: `1px solid ${border}`, padding: '28px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, fontSize: 12, color: dim,
          fontFamily: 'IBM Plex Mono,monospace',
        }}>
          <div>{txt.footer}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[MAGENTA, TEAL, GOLD, PURPLE, CORAL].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: c }}/>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
