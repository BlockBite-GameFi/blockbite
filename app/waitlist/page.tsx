'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const DS = {
  bg0:    '#03000A',
  bg2:    '#110E1F',
  accent: '#9945FF',
  green:  '#14F195',
  blue:   '#00C2FF',
  muted:  'rgba(160,154,191,.80)',
  border: 'rgba(153,69,255,.25)',
  font:   "'Montserrat', 'DM Sans', system-ui, sans-serif",
};

const LS_DONE  = 'bb_wl_done';
const LS_EMAIL = 'bb_wl_email';

type State = 'idle' | 'loading' | 'success' | 'duplicate' | 'error';

/* ── Warp-speed background ── */
function WarpBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let id: number, frame = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const max = Math.sqrt(cx * cx + cy * cy) * 1.4;
      for (let i = 0; i < 120; i++) {
        const angle = (i / 120) * Math.PI * 2;
        const prog  = ((frame * 0.006 + i / 120) % 1);
        const s = Math.max(0, prog - 0.08) * max;
        const e = prog * max;
        const op = prog < 0.15 ? (prog / 0.15) * 0.35 : prog > 0.85 ? ((1 - prog) / 0.15) * 0.35 : 0.35;
        const hue = 270 - prog * 60;
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${hue},${80 + prog * 20}%,70%,${op})`;
        ctx.lineWidth = 0.6 + prog * 0.4;
        ctx.moveTo(cx + Math.cos(angle) * s, cy + Math.sin(angle) * s);
        ctx.lineTo(cx + Math.cos(angle) * e, cy + Math.sin(angle) * e);
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      g.addColorStop(0, 'rgba(153,69,255,0.15)');
      g.addColorStop(0.5, 'rgba(0,194,255,0.05)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2); ctx.fill();
      frame++; id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.6 }} />;
}

export default function WaitlistPage() {
  const [email, setEmail]   = useState('');
  const [state, setState]   = useState<State>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [count, setCount]   = useState<number | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_DONE) === '1') setState('success');
      const saved = localStorage.getItem(LS_EMAIL);
      if (saved) setEmail(saved);
    } catch { /* ignore */ }

    let cancelled = false;
    const refresh = () =>
      fetch('/api/waitlist/count', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { if (!cancelled && typeof d?.count === 'number') setCount(d.count); })
        .catch(() => {});

    refresh();
    const id = setInterval(refresh, 20_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'loading' || state === 'success') return;
    setState('loading');
    setErrMsg('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setState('success');
        try { localStorage.setItem(LS_DONE, '1'); localStorage.setItem(LS_EMAIL, email); } catch { /* ignore */ }
        try {
          const cr = await fetch('/api/waitlist/count', { cache: 'no-store' });
          const cd = await cr.json();
          if (typeof cd?.count === 'number') setCount(cd.count);
        } catch { /* ignore */ }
      } else if (res.status === 409) {
        setState('duplicate');
      } else if (res.status === 429) {
        setState('error'); setErrMsg('Too many requests. Please wait a moment.');
      } else {
        setState('error'); setErrMsg(data.error ?? 'Something went wrong. Try again.');
      }
    } catch {
      setState('error'); setErrMsg('Network error. Please try again.');
    }
  }

  const isSuccess = state === 'success';
  const isDup     = state === 'duplicate';
  const isErr     = state === 'error';
  const isLoading = state === 'loading';

  return (
    <div style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', background: DS.bg0, padding: '24px',
      fontFamily: DS.font,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');
        @keyframes bbPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        @keyframes bbSpin { to{transform:rotate(360deg)} }
      `}</style>

      {/* Warp background */}
      <WarpBg />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(153,69,255,0.07) 0%, rgba(0,194,255,0.04) 50%, transparent 100%)',
      }} />

      {/* Back link */}
      <Link href="/" style={{
        position: 'absolute', top: 24, left: 24,
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 600, color: DS.muted,
        textDecoration: 'none', zIndex: 10,
        transition: 'color .2s',
      }}
        onMouseEnter={e => (e.currentTarget.style.color = '#F8F6FF')}
        onMouseLeave={e => (e.currentTarget.style.color = DS.muted)}
      >
        ← Back
      </Link>

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 460,
        borderRadius: 32,
        padding: '40px 40px 32px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        background: 'rgba(17,14,31,0.85)',
        border: `1px solid ${DS.border}`,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 0 80px rgba(153,69,255,0.12), 0 0 160px rgba(0,194,255,0.06)',
        textAlign: 'center',
      }}>

        {/* Logo */}
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <Image
            src="/logo.png"
            alt="BlockBite"
            fill
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(153,69,255,0.6))' }}
          />
        </div>

        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <h1 style={{
            fontFamily: DS.font,
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: '.1em',
            margin: 0,
            background: 'linear-gradient(90deg, #9945FF 0%, #00C2FF 60%, #14F195 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            BLOCKBITE
          </h1>
          <p style={{
            fontFamily: DS.font,
            fontWeight: 600,
            fontSize: 10,
            color: DS.muted,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Token Distribution.{' '}
            <span style={{
              background: 'linear-gradient(90deg, #9945FF, #00C2FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Anti-Dump by Default.
            </span>
          </p>
        </div>

        {!isSuccess ? (
          <>
            {/* Heading */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 style={{
                fontFamily: DS.font, fontWeight: 800,
                fontSize: 20, color: '#F8F6FF', margin: 0,
              }}>
                Join the Early Access List
              </h2>
              <p style={{ fontFamily: DS.font, fontSize: 13, color: DS.muted, lineHeight: 1.65, margin: 0 }}>
                Be first to launch milestone vesting streams, token distributions,
                and automated payouts on Solana — fully on-chain.
              </p>
            </div>

            {/* Count badge */}
            {count !== null && count > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 16px', borderRadius: 999,
                background: 'rgba(153,69,255,0.12)',
                border: '1px solid rgba(153,69,255,0.30)',
                fontSize: 11, fontWeight: 700, color: '#B57FFF',
                fontFamily: DS.font,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9945FF', display: 'inline-block', animation: 'bbPulse 2s infinite' }} />
                {count.toLocaleString()} {count === 1 ? 'person' : 'people'} already signed up
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (state !== 'idle') setState('idle'); }}
                placeholder="your@email.com"
                required
                disabled={isLoading}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 18px', borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)',
                  border: isDup || isErr ? '1px solid rgba(255,77,77,0.5)' : '1px solid rgba(153,69,255,0.25)',
                  color: '#F8F6FF', fontSize: 14, fontFamily: DS.font, outline: 'none',
                  transition: 'border .15s, box-shadow .15s',
                  opacity: isLoading ? 0.5 : 1,
                }}
                onFocus={e => {
                  e.currentTarget.style.border = '1px solid rgba(153,69,255,0.65)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(153,69,255,0.12)';
                }}
                onBlur={e => {
                  e.currentTarget.style.border = isDup || isErr ? '1px solid rgba(255,77,77,0.5)' : '1px solid rgba(153,69,255,0.25)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                style={{
                  width: '100%', padding: '14px 24px', borderRadius: 9999,
                  background: isLoading ? 'rgba(153,69,255,0.6)' : 'linear-gradient(90deg, #9945FF 0%, #00C2FF 100%)',
                  color: '#fff', fontWeight: 800, fontSize: 15,
                  fontFamily: DS.font, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: isLoading ? 'none' : '0 0 28px rgba(153,69,255,0.35)',
                  letterSpacing: '.02em', transition: 'all .2s',
                  opacity: !email.trim() ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {isLoading ? (
                  <>
                    <span style={{
                      width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      display: 'inline-block', animation: 'bbSpin 0.8s linear infinite',
                    }} />
                    Joining…
                  </>
                ) : 'Secure Your Spot Now!'}
              </button>

              {/* Inline feedback */}
              {isDup && (
                <p style={{ textAlign: 'center', fontSize: 12, fontFamily: DS.font, color: '#FF9D4D', margin: 0 }}>
                  ✓ You&apos;re already on the list — we&apos;ll be in touch!
                </p>
              )}
              {isErr && (
                <p style={{ textAlign: 'center', fontSize: 12, fontFamily: DS.font, color: '#FF6B6B', margin: 0 }}>
                  {errMsg}
                </p>
              )}
            </form>

            {/* Footer note */}
            <p style={{ fontSize: 11, fontFamily: DS.font, color: DS.muted, margin: 0 }}>
              No spam. Just early access updates.
            </p>
          </>
        ) : (
          /* ── Success state ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(20,241,149,0.10)',
              border: '1px solid rgba(20,241,149,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              ✓
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 style={{ fontFamily: DS.font, fontWeight: 800, fontSize: 20, color: '#F8F6FF', margin: 0 }}>
                You&apos;re on the list!
              </h2>
              <p style={{ fontFamily: DS.font, fontSize: 13, color: DS.muted, lineHeight: 1.65, margin: 0 }}>
                Welcome aboard. We&apos;ll notify you when BlockBite early access opens.
                Get ready to launch your first token distribution on Solana.
              </p>
            </div>
            {count !== null && count > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 16px', borderRadius: 999,
                background: 'rgba(20,241,149,0.10)',
                border: '1px solid rgba(20,241,149,0.25)',
                fontSize: 11, fontWeight: 700, color: DS.green,
                fontFamily: DS.font,
              }}>
                #{count.toLocaleString()} on the waitlist
              </div>
            )}
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 24px', borderRadius: 9999,
              fontFamily: DS.font, fontWeight: 600, fontSize: 13,
              color: DS.muted, textDecoration: 'none',
              border: '1px solid rgba(153,69,255,0.25)',
              transition: 'all .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F8F6FF'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(153,69,255,0.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.muted; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(153,69,255,0.25)'; }}
            >
              ← Back to home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
