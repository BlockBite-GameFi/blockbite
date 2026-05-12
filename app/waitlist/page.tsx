'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp, type Lang, type Theme } from '@/lib/useApp';

/* ── Brand constants ── */
const P1 = '#a78bfa';
const P2 = '#5eead4';
const GRAD = `linear-gradient(135deg,${P1},${P2})`;
const BG_DARK = '#07060f';
const BG_LIGHT = '#f4f1ff';

/* ── Copy ── */
const COPY = {
  en: {
    badge: 'SOLANA · TOKEN DISTRIBUTION PROTOCOL',
    h1a: 'Stop Distributing',
    h1b: 'Tokens Blindly.',
    sub: 'Secure your assets with automated, milestone-based distribution that eliminates fatal human error while transforming passive claimants into loyal, long-term contributors.',
    target: 'For Solana Ecosystem Builders & Project Founders',
    cta: 'Get Early Access — Join the Waitlist',
    ctaShort: 'Join the Waitlist',
    placeholder: 'your@email.com',
    note: 'No spam. Unsubscribe anytime.',
    success: "✓ You're on the list! We'll notify you at launch.",
    stats: [
      { v: '4 Types', l: 'DISTRIBUTION MODES' },
      { v: '100%', l: 'ON-CHAIN' },
      { v: '0', l: 'INTERMEDIARIES' },
      { v: '∞', l: 'RECIPIENTS' },
    ],
    painTitle: 'The Problem With Manual Distribution',
    painKicker: 'WHY IT BREAKS',
    pains: [
      { ic: '⚠', t: 'Fatal Human Error', d: 'One wrong address, one missed decimal — and tokens are gone forever. Manual spreadsheet management kills projects.' },
      { ic: '🔒', t: 'No Recipient Visibility', d: 'Team members, advisors, and investors have zero visibility into when or how much they will receive. Trust erodes.' },
      { ic: '🔀', t: 'No Vesting Flexibility', d: 'Cliff, linear, milestone-based — most projects support only one model, forcing expensive custom development.' },
      { ic: '📋', t: 'Zero Audit Trail', d: 'When disputes arise, there\'s no on-chain record of who was supposed to receive what, and when.' },
    ],
    featTitle: 'Automated. Transparent. Unstoppable.',
    featKicker: 'CORE FEATURES',
    feats: [
      { ic: '◆', t: 'Milestone-Based Distribution', d: 'Lock tokens behind deliverables, KPIs, or DAO votes. Claimants only receive tokens when conditions are verified on-chain.' },
      { ic: '▶', t: 'Linear Streaming', d: 'Set a start date, end date, and total amount. Tokens unlock every second — recipients can claim at any time within the window.' },
      { ic: '⏱', t: 'Cliff + Vesting', d: 'Traditional 1-year cliff with 3-year linear vesting — implemented as a single Anchor instruction. No custom code needed.' },
      { ic: '◉', t: 'Recipient Dashboard', d: 'Every recipient gets a real-time view of unlocked balance, claimed amount, and next unlock. Built on your on-chain proof.' },
      { ic: '🛡', t: 'Squads Multisig', d: '2-of-3 admin signatures required for all protocol changes. The vault is PDA-owned — never a team hot wallet.' },
      { ic: '🔍', t: 'Full Audit Trail', d: 'Every stream creation, withdrawal, and cancellation is a signed Solana transaction. Immutable, permanent, verifiable.' },
    ],
    howTitle: 'Up and Running in Minutes',
    howKicker: 'HOW IT WORKS',
    steps: [
      { t: 'Connect Wallet', d: 'Phantom, Solflare, Backpack, or any Solana wallet. No custody, no sign-up.' },
      { t: 'Create Stream', d: 'Set recipient, amount, start/end date, vesting type. Tokens lock into a PDA — creator cannot touch them.' },
      { t: 'Tokens Unlock', d: 'Linear, cliff, or milestone — unlock conditions enforced by the Solana program, not the UI.' },
      { t: 'Recipient Claims', d: 'Recipient connects, sees their unlocked balance, and withdraws anytime. Partial withdrawals supported.' },
    ],
    audienceTitle: 'Built For',
    audiences: ['DAOs', 'Protocol Teams', 'Accelerator Programs', 'Investor Rounds', 'Advisor Allocations', 'Community Rewards'],
    footerLine: '© 2026 BlockBite · Token Distribution Protocol · Solana Devnet',
  },
  id: {
    badge: 'SOLANA · PROTOKOL DISTRIBUSI TOKEN',
    h1a: 'Hentikan Distribusi',
    h1b: 'Token Sembarangan.',
    sub: 'Amankan aset Anda dengan distribusi berbasis milestone otomatis yang menghilangkan kesalahan manusia fatal sekaligus mengubah penerima pasif menjadi kontributor jangka panjang yang loyal.',
    target: 'Untuk Builder & Founder Ekosistem Solana',
    cta: 'Dapatkan Akses Awal — Daftar Waitlist',
    ctaShort: 'Daftar Waitlist',
    placeholder: 'email@anda.com',
    note: 'Tanpa spam. Bisa berhenti kapan saja.',
    success: '✓ Kamu sudah terdaftar! Kami akan notifikasi saat peluncuran.',
    stats: [
      { v: '4 Tipe', l: 'MODE DISTRIBUSI' },
      { v: '100%', l: 'ON-CHAIN' },
      { v: '0', l: 'PERANTARA' },
      { v: '∞', l: 'PENERIMA' },
    ],
    painTitle: 'Masalah Distribusi Manual',
    painKicker: 'KENAPA GAGAL',
    pains: [
      { ic: '⚠', t: 'Kesalahan Manusia Fatal', d: 'Satu alamat salah, satu desimal keliru — token hilang selamanya. Manajemen spreadsheet manual menghancurkan proyek.' },
      { ic: '🔒', t: 'Tidak Ada Visibilitas', d: 'Anggota tim, advisor, dan investor tidak tahu kapan atau berapa banyak yang akan mereka terima. Kepercayaan runtuh.' },
      { ic: '🔀', t: 'Tidak Fleksibel', d: 'Cliff, linear, milestone — kebanyakan proyek hanya mendukung satu model, memaksa pengembangan kustom yang mahal.' },
      { ic: '📋', t: 'Nol Jejak Audit', d: 'Saat sengketa terjadi, tidak ada catatan on-chain tentang siapa yang seharusnya menerima apa, dan kapan.' },
    ],
    featTitle: 'Otomatis. Transparan. Tidak Bisa Dihentikan.',
    featKicker: 'FITUR UTAMA',
    feats: [
      { ic: '◆', t: 'Distribusi Berbasis Milestone', d: 'Kunci token di balik deliverable, KPI, atau vote DAO. Penerima hanya menerima token saat kondisi diverifikasi on-chain.' },
      { ic: '▶', t: 'Streaming Linear', d: 'Atur tanggal mulai, akhir, dan total jumlah. Token terbuka setiap detik — penerima bisa klaim kapan saja.' },
      { ic: '⏱', t: 'Cliff + Vesting', d: 'Cliff 1 tahun tradisional dengan vesting linear 3 tahun — diimplementasikan sebagai satu instruksi Anchor.' },
      { ic: '◉', t: 'Dashboard Penerima', d: 'Setiap penerima mendapatkan tampilan real-time saldo terbuka, jumlah diklaim, dan buka berikutnya.' },
      { ic: '🛡', t: 'Multisig Squads', d: '2-dari-3 tanda tangan admin diperlukan untuk semua perubahan protokol. Vault dimiliki PDA — bukan hot wallet.' },
      { ic: '🔍', t: 'Jejak Audit Lengkap', d: 'Setiap pembuatan stream, penarikan, dan pembatalan adalah transaksi Solana yang ditandatangani. Permanen dan dapat diverifikasi.' },
    ],
    howTitle: 'Aktif dalam Hitungan Menit',
    howKicker: 'CARA KERJA',
    steps: [
      { t: 'Hubungkan Wallet', d: 'Phantom, Solflare, Backpack, atau wallet Solana manapun. Tanpa custody, tanpa daftar.' },
      { t: 'Buat Stream', d: 'Atur penerima, jumlah, tanggal mulai/akhir, jenis vesting. Token dikunci ke PDA — pembuat tidak bisa mengambilnya.' },
      { t: 'Token Terbuka', d: 'Linear, cliff, atau milestone — kondisi pembukaan dipaksakan oleh program Solana, bukan UI.' },
      { t: 'Penerima Klaim', d: 'Penerima terhubung, melihat saldo terbuka, dan menarik kapan saja. Penarikan parsial didukung.' },
    ],
    audienceTitle: 'Dibangun Untuk',
    audiences: ['DAO', 'Tim Protokol', 'Program Akselerator', 'Putaran Investor', 'Alokasi Advisor', 'Hadiah Komunitas'],
    footerLine: '© 2026 BlockBite · Protokol Distribusi Token · Solana Devnet',
  },
};

/* ── Main component ── */
export default function WaitlistPage() {
  const { lang, setLang, theme, setTheme } = useApp();
  const c = COPY[lang];
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const cvs = useRef<HTMLCanvasElement>(null);

  /* fetch waitlist count */
  useEffect(() => {
    fetch('/api/waitlist/count').then(r => r.json()).then(d => {
      if (typeof d?.count === 'number') setCount(d.count);
    }).catch(() => {});
  }, []);

  /* floating block canvas */
  useEffect(() => {
    const canvas = cvs.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const COLORS = [P1, P2, '#fbbf24', '#f472b6', '#7dd3fc', '#fb923c', '#e879f9', '#86efac'];
    type Block = { x:number; y:number; size:number; rot:number; vx:number; vy:number; vr:number; color:string; alpha:number };
    let blocks: Block[] = [];
    let rafId: number;

    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
      blocks = Array.from({ length: 28 }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        size: Math.random() * 48 + 16,
        rot: Math.random() * Math.PI * 2,
        vx: (Math.random() - .5) * .5,
        vy: (Math.random() - .5) * .5,
        vr: (Math.random() - .5) * .012,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * .45 + .06,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      blocks.forEach(b => {
        b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        if (b.x < -70) b.x = canvas!.width + 70;
        if (b.x > canvas!.width + 70) b.x = -70;
        if (b.y < -70) b.y = canvas!.height + 70;
        if (b.y > canvas!.height + 70) b.y = -70;
        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        const r = b.size * .22;
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
    if (!email || !email.includes('@')) { setErr(true); setTimeout(() => setErr(false), 1500); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok || res.status === 409) {
        setDone(true);
        setCount(n => (n ?? 0) + 1);
      }
    } catch {
      setDone(true); // optimistic
    }
    setBusy(false);
  }

  const bg = isDark ? BG_DARK : BG_LIGHT;
  const textColor = isDark ? '#fff' : '#0a0a14';
  const dimColor = isDark ? '#94a3b8' : '#475569';
  const surfaceColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)';
  const surface2 = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.9)';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textColor, fontFamily: "'Space Grotesk', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* Canvas background */}
      <canvas ref={cvs} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: isDark ? 0.18 : 0.08 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Minimal Nav ── */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 28px', borderBottom: `1px solid ${borderColor}`,
          background: isDark ? 'rgba(7,6,15,0.75)' : 'rgba(244,241,255,0.85)',
          backdropFilter: 'blur(18px)', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: textColor }}>
            <svg width="34" height="34" viewBox="0 0 36 36">
              <defs>
                <linearGradient id="nlg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={P1} /><stop offset="100%" stopColor={P2} />
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="9" fill="url(#nlg)" />
              <text x="18" y="26" textAnchor="middle" fontSize="20" fontWeight="900" fill="#0a0a14">◆</text>
            </svg>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.5px' }}>BlockBite</span>
          </Link>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <SegBtn
              options={[{ v: 'en', l: 'EN' }, { v: 'id', l: 'ID' }]}
              value={lang} onChange={v => setLang(v as Lang)}
              accent={P1} bg={surfaceColor} border={borderColor} text={textColor}
            />
            <SegBtn
              options={[{ v: 'dark', l: '🌙' }, { v: 'light', l: '☀' }]}
              value={theme} onChange={v => setTheme(v as Theme)}
              accent={P1} bg={surfaceColor} border={borderColor} text={textColor}
            />
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '72px 24px 56px', gap: 28 }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 999,
            border: `1px solid ${P1}`, background: 'rgba(167,139,250,0.1)',
            fontSize: 11, fontWeight: 800, color: P1, letterSpacing: '1.5px',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: P1, display: 'inline-block', animation: 'wlPulse 2s infinite' }} />
            {c.badge}
          </div>

          {/* H1 */}
          <h1 style={{ fontSize: 'clamp(38px,9vw,92px)', fontWeight: 900, lineHeight: 0.92, letterSpacing: '-2.5px', maxWidth: 820, margin: 0 }}>
            {c.h1a}<br />
            <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {c.h1b}
            </span>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 'clamp(14px,2vw,19px)', color: dimColor, maxWidth: 580, lineHeight: 1.65, margin: 0 }}>
            {c.sub}
          </p>

          {/* Target chip */}
          <div style={{ fontSize: 12, color: P2, fontWeight: 700, letterSpacing: '0.5px', opacity: 0.85 }}>
            {c.target}
          </div>

          {/* Floating gem blocks */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', margin: '4px 0' }}>
            {[
              { color: P1, icon: '◆', d: '3.2s', dl: '0s' },
              { color: P2, icon: '◈', d: '2.8s', dl: '.3s' },
              { color: '#fbbf24', icon: '▶', d: '3.5s', dl: '.6s' },
              { color: '#f472b6', icon: '⏱', d: '2.5s', dl: '.9s' },
              { color: '#7dd3fc', icon: '◉', d: '3.8s', dl: '1.1s' },
              { color: '#fb923c', icon: '✦', d: '2.9s', dl: '.2s' },
            ].map((b, i) => (
              <div key={i} style={{
                width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, color: '#0a0a14', background: b.color,
                animation: `wlFloat ${b.d} ease-in-out infinite ${b.dl}`,
                boxShadow: `0 4px 16px ${b.color}55`,
              }}>
                {b.icon}
              </div>
            ))}
          </div>

          {/* Waitlist Form */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 520 }}>
            {!done ? (
              <>
                <div style={{ display: 'flex', gap: 8, width: '100%', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder={c.placeholder}
                    style={{
                      flex: '1 1 220px', padding: '14px 18px', borderRadius: 12,
                      background: surface2, border: `1px solid ${err ? '#ef4444' : borderColor}`,
                      color: textColor, fontFamily: 'inherit', fontSize: 15, outline: 'none',
                      transition: 'border-color .15s',
                      boxShadow: err ? '0 0 0 3px rgba(239,68,68,0.2)' : 'none',
                    }}
                  />
                  <button
                    onClick={submit}
                    disabled={busy}
                    style={{
                      flex: '0 0 auto', padding: '14px 22px', borderRadius: 12,
                      background: GRAD, border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                      color: '#0a0a14', fontWeight: 900, fontSize: 14, fontFamily: 'inherit',
                      whiteSpace: 'nowrap', letterSpacing: '.5px',
                      boxShadow: '0 0 28px rgba(167,139,250,0.45)',
                      transition: 'transform .15s, box-shadow .15s',
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    {busy ? '…' : c.ctaShort}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: dimColor, letterSpacing: '.5px' }}>{c.note}</div>
              </>
            ) : (
              <div style={{
                padding: '16px 24px', borderRadius: 14,
                background: 'rgba(94,234,212,0.12)', border: `1px solid ${P2}`,
                color: P2, fontWeight: 700, fontSize: 14, textAlign: 'center',
              }}>
                {c.success}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            {c.stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: textColor }}>
                  {i === 3 && count !== null ? count.toLocaleString() : s.v}
                </div>
                <div style={{ fontSize: 10, color: dimColor, letterSpacing: '1.5px', marginTop: 2, fontWeight: 700 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pain Points ── */}
        <section style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, letterSpacing: '2px', color: '#ef4444', marginBottom: 10, fontWeight: 800 }}>{c.painKicker}</div>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 900, margin: 0 }}>{c.painTitle}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {c.pains.map((p, i) => (
              <div key={i} style={{
                padding: '22px', borderRadius: 18, background: surfaceColor,
                border: `1px solid rgba(239,68,68,0.15)`, transition: '.2s',
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{p.ic}</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{p.t}</div>
                <div style={{ fontSize: 13, color: dimColor, lineHeight: 1.6 }}>{p.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, letterSpacing: '2px', color: P1, marginBottom: 10, fontWeight: 800 }}>{c.featKicker}</div>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 900, margin: 0 }}>{c.featTitle}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {c.feats.map((f, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: 20, background: surfaceColor, border: `1px solid ${borderColor}`,
                transition: '.2s', cursor: 'default',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = P1;
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(167,139,250,0.07)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = borderColor;
                  (e.currentTarget as HTMLDivElement).style.background = surfaceColor;
                }}
              >
                <div style={{ fontSize: 30, marginBottom: 14, lineHeight: 1 }}>{f.ic}</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{f.t}</div>
                <div style={{ fontSize: 13, color: dimColor, lineHeight: 1.6 }}>{f.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, letterSpacing: '2px', color: P2, marginBottom: 10, fontWeight: 800 }}>{c.howKicker}</div>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 900, margin: 0 }}>{c.howTitle}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {c.steps.map((s, i) => (
              <div key={i} style={{ padding: '22px', borderRadius: 18, background: surfaceColor, border: `1px solid ${borderColor}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: P1, opacity: .12, position: 'absolute', top: 6, right: 14, lineHeight: 1 }}>{i + 1}</div>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, background: GRAD,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 14, color: '#0a0a14', marginBottom: 14,
                }}>{i + 1}</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, position: 'relative' }}>{s.t}</div>
                <div style={{ fontSize: 12, color: dimColor, lineHeight: 1.6, position: 'relative' }}>{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Audience ── */}
        <section style={{ padding: '40px 24px 60px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 12, letterSpacing: '1.5px', color: dimColor, fontWeight: 700, marginBottom: 20 }}>{c.audienceTitle}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {c.audiences.map((a, i) => (
              <span key={i} style={{
                padding: '8px 18px', borderRadius: 999,
                background: i % 2 === 0 ? 'rgba(167,139,250,0.1)' : 'rgba(94,234,212,0.1)',
                border: `1px solid ${i % 2 === 0 ? 'rgba(167,139,250,0.25)' : 'rgba(94,234,212,0.25)'}`,
                color: i % 2 === 0 ? P1 : P2,
                fontSize: 13, fontWeight: 700,
              }}>
                {a}
              </span>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section style={{
          margin: '0 24px 60px', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto',
          padding: '52px 40px', borderRadius: 28,
          background: isDark ? 'rgba(167,139,250,0.07)' : 'rgba(109,40,217,0.05)',
          border: `1px solid ${isDark ? 'rgba(167,139,250,0.18)' : 'rgba(109,40,217,0.12)'}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: P1, letterSpacing: '2px', marginBottom: 12 }}>EARLY ACCESS</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, margin: '0 0 14px', letterSpacing: '-0.5px' }}>
            {c.h1a} {c.h1b}
          </h2>
          <p style={{ fontSize: 15, color: dimColor, maxWidth: 500, margin: '0 auto 28px', lineHeight: 1.6 }}>
            {c.sub}
          </p>
          {!done ? (
            <div style={{ display: 'flex', gap: 10, maxWidth: 460, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder={c.placeholder}
                style={{
                  flex: '1 1 200px', padding: '13px 18px', borderRadius: 12,
                  background: surface2, border: `1px solid ${borderColor}`,
                  color: textColor, fontFamily: 'inherit', fontSize: 14, outline: 'none',
                }}
              />
              <button
                onClick={submit}
                disabled={busy}
                style={{
                  padding: '13px 22px', borderRadius: 12, border: 'none',
                  background: GRAD, cursor: 'pointer', color: '#0a0a14',
                  fontWeight: 900, fontSize: 14, fontFamily: 'inherit',
                  boxShadow: '0 0 24px rgba(167,139,250,0.4)',
                }}
              >
                {busy ? '…' : c.cta}
              </button>
            </div>
          ) : (
            <div style={{ padding: '14px 24px', borderRadius: 12, background: 'rgba(94,234,212,0.12)', border: `1px solid ${P2}`, color: P2, fontWeight: 700, display: 'inline-block' }}>
              {c.success}
            </div>
          )}
        </section>

        {/* ── Footer ── */}
        <footer style={{
          borderTop: `1px solid ${borderColor}`, padding: '24px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, fontSize: 12, color: dimColor,
        }}>
          <div>{c.footerLine}</div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Twitter / X', 'Discord', 'GitHub'].map(l => (
              <a key={l} href="#" style={{ color: dimColor, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = P1)}
                onMouseLeave={e => (e.currentTarget.style.color = dimColor)}
              >{l}</a>
            ))}
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes wlFloat {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes wlPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:.4; transform:scale(.75); }
        }
      `}</style>
    </div>
  );
}

/* ── Segmented control ── */
function SegBtn({
  options, value, onChange, accent, bg, border, text,
}: {
  options: { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
  accent: string; bg: string; border: string; text: string;
}) {
  return (
    <div style={{ display: 'flex', background: bg, border: `1px solid ${border}`, borderRadius: 999, padding: 3, gap: 3 }}>
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={{
            border: 'none', borderRadius: 999, padding: '6px 12px', cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: 800, fontSize: 11, letterSpacing: '.5px',
            background: value === o.v ? accent : 'transparent',
            color: value === o.v ? '#0a0a14' : text,
            transition: '.15s',
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
