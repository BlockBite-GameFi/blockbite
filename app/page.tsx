'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { getAllStreams } from '@/lib/anchor/vesting-client';
import Navbar from '@/components/Navbar';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  void:    '#020008',
  deep:    '#05010E',
  surface: '#0A0618',
  elev:    '#110A20',
  purple:  '#9945FF',
  purpleDk:'#6B2FBF',
  purpleLt:'#C084FC',
  green:   '#14F195',
  blue:    '#00C2FF',
  gold:    '#F5C66A',
  ember:   '#FF7A3A',
  text:    '#F0ECFF',
  muted:   'rgba(168,160,210,0.72)',
  border:  'rgba(153,69,255,0.16)',
  borderS: 'rgba(153,69,255,0.42)',
  card:    'rgba(153,69,255,0.055)',
  fontD:   "'Space Grotesk','Sora',system-ui,sans-serif",
  fontB:   "'Sora','DM Sans',system-ui,sans-serif",
  fontM:   "'JetBrains Mono',monospace",
};

const VERIFY = [
  { color: C.blue,     title: 'Automated',   sub: 'Always On',       badge: 'Fully Automated',
    desc: 'Token streams run fully on-chain. No manual intervention needed — conditions execute the moment they are met.' },
  { color: '#c084fc',  title: 'Game',        sub: 'Play to Unlock',  badge: 'Sybil-Resistant',
    desc: 'Recipients earn milestone unlocks through the BlockBite puzzle game. Gamified, sybil-resistant, and on-chain verifiable.' },
  { color: C.purple,   title: 'Oracle',      sub: 'On-Chain Data',   badge: 'Data-Driven',
    desc: 'Connect any on-chain data feed. KPI thresholds — user count, revenue, TVL — trigger milestone unlock automatically.' },
  { color: C.green,    title: 'Manual',      sub: 'Creator Signs',   badge: 'Permissioned',
    desc: 'Stream creator verifies milestone completion with a signed transaction. Simple, transparent, and fully permissioned.' },
];

const VESTING = [
  { title: 'Linear',    icon: '∿', color: C.blue,   bar: 100,
    desc: 'Tokens unlock at a constant rate from start to end date. Ideal for team, advisor, and contributor allocations.' },
  { title: 'Cliff',     icon: '⌐', color: C.purple, bar: 65,
    desc: 'Zero tokens release until the cliff date. Hard time-lock enforced on-chain — no early withdrawals, no exceptions.' },
  { title: 'Milestone', icon: '◎', color: C.gold,   bar: 80,
    desc: 'Tokens unlock in tranches as project milestones are verified. Choose any verification method to match your workflow.' },
];

const STEPS = [
  { num: '01', color: C.ember,    title: 'Connect & Import Data',      desc: 'Connect your wallet and upload your recipient list via CSV or manual entry in seconds.' },
  { num: '02', color: C.blue,     title: 'Define Tokenomics',          desc: 'Customize your release strategy using linear vesting, cliff periods, or milestone-based distribution.' },
  { num: '03', color: '#c084fc',  title: 'Set Verification Layer',     desc: 'Choose Direct Claim for simplicity or add Verification Layers like multisig, oracles, or gamified challenges.' },
  { num: '04', color: C.green,    title: 'Lock, Launch & Manage',      desc: 'Lock assets to automate user claims. Monitor distribution in real-time with absolute Clawback control.' },
];

const CMP = [
  { feature: 'Milestone Unlock',      bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Fully Automated',       bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Game Verification',     bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Oracle Data Feed',      bb: true,  sablier: false, superfluid: false, streamflow: true  },
  { feature: 'Cliff + Linear',        bb: true,  sablier: true,  superfluid: false, streamflow: true  },
  { feature: 'On-chain Enforcement',  bb: true,  sablier: true,  superfluid: true,  streamflow: true  },
  { feature: 'Anti-dump by Default',  bb: true,  sablier: false, superfluid: false, streamflow: false },
];

const FAQ = [
  { q: 'What is BlockBite TDP?',
    a: 'BlockBite TDP is a token distribution protocol on Solana. It lets project teams create vesting streams for team members, investors, and contributors — directly on-chain, with no intermediary.' },
  { q: 'Who controls the locked tokens?',
    a: 'Nobody. Tokens are locked in a PDA-controlled vault — a program-derived address with no private key. Only the on-chain program can release tokens, and only when the vesting schedule allows it.' },
  { q: 'What vesting schedules are supported?',
    a: 'Cliff vesting (all tokens at a single date), linear vesting (gradual release over time), and milestone-gated tranches. All schedules support an optional cliff period before linear release begins.' },
  { q: 'What is the game verification layer?',
    a: "Recipients can earn milestone unlocks by playing the BlockBite puzzle game. It's gamified, sybil-resistant, and the result is fully verifiable on-chain — no one can fake a score." },
  { q: 'What happens if a stream is cancelled?',
    a: 'Vesting freezes immediately. The recipient keeps everything already vested and can claim it at any time. Unvested tokens are returned to the stream creator.' },
  { q: 'What wallets are supported?',
    a: 'Phantom and Solflare are fully supported via Solana wallet-adapter. Any wallet compatible with the adapter standard will work.' },
];

interface LiveStats { streams: number; active: number; locked: string; distributed: string; }

export default function Home() {
  const { connection } = useConnection();
  const cvs = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [faqOpen, setFaqOpen] = useState<boolean[]>(Array(6).fill(false));
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [tiltMap, setTiltMap] = useState<Record<string, { rx: number; ry: number }>>({});

  // Live on-chain stats
  useEffect(() => {
    let cancelled = false;
    getAllStreams(connection).then(all => {
      if (cancelled) return;
      const nowSec = Math.floor(Date.now() / 1000);
      const active = all.filter(s => !s.cancelled && Number(s.endTs.toString()) > nowSec).length;
      const locked = all.reduce((sum, s) => {
        const t = BigInt(s.amountTotal.toString()), d = BigInt(s.amountWithdrawn.toString());
        return sum + (t > d ? t - d : 0n);
      }, 0n);
      const dist = all.reduce((sum, s) => sum + BigInt(s.amountWithdrawn.toString()), 0n);
      const fmt = (n: bigint) => {
        const m = n / 1_000_000n;
        return m >= 1_000_000n ? (Number(m / 1_000_000n)).toFixed(1) + 'M'
             : m >= 1_000n     ? (Number(m / 1_000n)).toFixed(1) + 'K'
             : m.toString();
      };
      setStats({ streams: all.length, active, locked: fmt(locked), distributed: fmt(dist) });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [connection]);

  // Cursor glow follower
  useEffect(() => {
    const el = cursorRef.current; if (!el) return;
    const fn = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
    };
    window.addEventListener('mousemove', fn, { passive: true });
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  // Particle canvas with connection lines
  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    let raf: number;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); addEventListener('resize', resize);
    const COLS = [C.purple, C.blue, C.green, C.gold, C.ember, C.purpleLt];
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: 0.7 + Math.random() * 2,
      vy: -(0.06 + Math.random() * 0.16),
      vx: (Math.random() - 0.5) * 0.22,
      col: COLS[Math.floor(Math.random() * COLS.length)],
      op: 0.04 + Math.random() * 0.14,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.y += p.vy; p.x += p.vx;
        if (p.y < -8) { p.y = c.height + 8; p.x = Math.random() * c.width; }
        if (p.x < -8 || p.x > c.width + 8) p.vx *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col + Math.round(p.op * 255).toString(16).padStart(2,'0');
        ctx.fill();
      });
      // Connection lines
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(153,69,255,${((1 - d / 110) * 0.06).toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          const delay = parseFloat(el.dataset.d ?? '0');
          setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0) scale(1)'; }, delay * 1000);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -32px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // 3D card tilt
  const onTilt = useCallback((id: string, e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -16;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 16;
    setTiltMap(m => ({ ...m, [id]: { rx, ry } }));
  }, []);
  const offTilt = useCallback((id: string) => {
    setTiltMap(m => ({ ...m, [id]: { rx: 0, ry: 0 } }));
  }, []);
  const tilt = (id: string) => {
    const t = tiltMap[id];
    if (!t || (t.rx === 0 && t.ry === 0)) return {};
    return {
      transform: `perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg) translateY(-8px)`,
      boxShadow: `0 20px 60px rgba(153,69,255,0.22), 0 0 0 1px rgba(153,69,255,0.3)`,
    };
  };

  // Reveal style (start hidden)
  const rv = (delay = 0): React.CSSProperties => ({
    opacity: 0,
    transform: 'translateY(32px) scale(0.98)',
    transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
  });

  // Gradient text
  const GT: React.CSSProperties = {
    background: 'linear-gradient(90deg,#9945FF 0%,#00C2FF 45%,#14F195 100%)',
    backgroundSize: '200% 200%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'bb-gshift 6s ease-in-out infinite',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.void, color: C.text, fontFamily: C.fontD, overflowX: 'hidden', position: 'relative' }}>

      {/* ── INLINE ANIMATION KEYFRAMES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&family=Sora:wght@300;400;500;600;700&display=swap');

        @keyframes bb-gshift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes bb-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes bb-float2 { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-24px) rotate(3deg)} }
        @keyframes bb-pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.6)} }
        @keyframes bb-ring   { 0%{transform:scale(.8);opacity:1} 100%{transform:scale(2.4);opacity:0} }
        @keyframes bb-glow   { 0%,100%{filter:drop-shadow(0 0 10px rgba(153,69,255,.5))} 50%{filter:drop-shadow(0 0 36px rgba(153,69,255,.95))} }
        @keyframes bb-orb    { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(48px,-24px) scale(1.07)} 66%{transform:translate(-36px,-44px) scale(.96)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes bb-grid   { from{background-position:0 0} to{background-position:48px 48px} }
        @keyframes bb-scan   { 0%{top:-2px} 100%{top:100%} }
        @keyframes bb-shimmer{ 0%{left:-120%} 100%{left:120%} }
        @keyframes bb-spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes bb-morph  {
          0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}
          25%{border-radius:40% 60% 70% 30%/30% 60% 40% 70%}
          50%{border-radius:30% 70% 40% 60%/50% 40% 60% 50%}
          75%{border-radius:70% 30% 60% 40%/40% 70% 30% 60%}
        }
        @keyframes bb-badge  { 0%{opacity:0;transform:scale(.7) rotate(-8deg)} 60%{transform:scale(1.06) rotate(1deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
        @keyframes bb-hero   { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bb-wheel  { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(12px);opacity:.3} }
        @keyframes bb-gborder{ 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes bb-twinkle{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.15;transform:scale(.5)} }

        .bb-rev { opacity:0; transform:translateY(32px) scale(.98); transition:opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
        .bb-btn-p { padding:16px 44px; border-radius:9999px; background:linear-gradient(90deg,#9945FF,#00C2FF); color:#fff; font-weight:800; font-size:15px; text-decoration:none; letter-spacing:.04em; font-family:'Space Grotesk',sans-serif; box-shadow:0 0 40px rgba(153,69,255,.55),0 4px 24px rgba(0,0,0,.4); transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .22s; display:inline-block; position:relative; overflow:hidden; }
        .bb-btn-p::before { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent); transition:.45s ease; }
        .bb-btn-p:hover { transform:translateY(-3px) scale(1.05); box-shadow:0 0 64px rgba(153,69,255,.75),0 8px 32px rgba(0,0,0,.4); }
        .bb-btn-p:hover::before { left:120%; }
        .bb-btn-s { padding:16px 34px; border-radius:9999px; background:rgba(153,69,255,.08); border:1px solid rgba(153,69,255,.44); color:#F0ECFF; font-weight:600; font-size:15px; text-decoration:none; font-family:'Space Grotesk',sans-serif; backdrop-filter:blur(12px); transition:all .22s cubic-bezier(.34,1.56,.64,1); display:inline-block; }
        .bb-btn-s:hover { background:rgba(153,69,255,.18); border-color:rgba(153,69,255,.7); transform:translateY(-2px); box-shadow:0 0 24px rgba(153,69,255,.25); }
        .bb-tag { font-size:11px; padding:3px 11px; border-radius:999px; background:rgba(153,69,255,.07); border:1px solid rgba(153,69,255,.16); color:rgba(168,160,210,.72); font-family:'JetBrains Mono',monospace; font-weight:500; transition:all .2s; cursor:default; }
        .bb-tag:hover { background:rgba(153,69,255,.18); border-color:rgba(153,69,255,.44); color:#F0ECFF; }
        .bb-step { transition:transform .3s cubic-bezier(.34,1.56,.64,1); }
        .bb-step:hover { transform:translateY(-8px); }
        .bb-step:hover .bb-snum { box-shadow:0 0 32px rgba(153,69,255,.7); transform:scale(1.15); }
        .bb-snum { transition:transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s; }
        .bb-vcard { transition:all .3s cubic-bezier(.34,1.56,.64,1); cursor:default; }
        .bb-vcard:hover { transform:translateY(-6px); border-color:rgba(153,69,255,.42) !important; box-shadow:0 16px 48px rgba(0,0,0,.4); }
        .bb-faq-q { width:100%; display:flex; align-items:center; justify-content:space-between; padding:18px 22px; text-align:left; background:transparent; border:none; cursor:pointer; color:#F0ECFF; font-family:'Space Grotesk',sans-serif; font-size:15px; font-weight:600; transition:background .2s; }
        .bb-faq-q:hover { background:rgba(153,69,255,.06); }
        .bb-chev { font-size:20px; color:rgba(168,160,210,.72); flex-shrink:0; margin-left:16px; transition:transform .3s cubic-bezier(.16,1,.3,1), color .2s; display:inline-block; }
        .bb-trow { transition:background .2s; }
        .bb-trow:hover { background:rgba(153,69,255,.06) !important; }
        .bb-wl-input { flex:1; padding:14px 18px; border-radius:12px; background:rgba(255,255,255,.055); border:1px solid rgba(153,69,255,.18); color:#F0ECFF; font-family:'Sora',sans-serif; font-size:14px; outline:none; transition:border-color .2s, box-shadow .2s; }
        .bb-wl-input:focus { border-color:#9945FF; box-shadow:0 0 0 3px rgba(153,69,255,.14); }
        .bb-wl-input::placeholder { color:rgba(168,160,210,.38); }
        .bb-fl { animation:bb-float 7s ease-in-out infinite; }
        .bb-fl2 { animation:bb-float2 10s ease-in-out infinite; }
        @media(max-width:900px){
          .bb-feat-grid { grid-template-columns:1fr !important; }
          .bb-steps-grid { grid-template-columns:1fr 1fr !important; }
          .bb-ver-grid { grid-template-columns:1fr 1fr !important; }
          .bb-vest-grid { grid-template-columns:1fr !important; }
          .bb-stat-grid { grid-template-columns:1fr 1fr !important; }
        }
        @media(max-width:600px){
          .bb-steps-grid { grid-template-columns:1fr !important; }
          .bb-ver-grid { grid-template-columns:1fr !important; }
          .bb-wl-form { flex-direction:column !important; }
        }
      `}</style>

      {/* ── CURSOR GLOW ── */}
      <div ref={cursorRef} style={{
        position: 'fixed', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(153,69,255,.07) 0%,transparent 70%)',
        pointerEvents: 'none', zIndex: 0, transition: 'transform .08s linear',
      }} />

      {/* ── ANIMATED GRID BACKGROUND ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(153,69,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(153,69,255,.035) 1px,transparent 1px)',
        backgroundSize: '48px 48px',
        animation: 'bb-grid 10s linear infinite',
        opacity: 0.8,
      }} />

      {/* ── AMBIENT ORBS ── */}
      {[
        { w:520, h:520, top:'-130px', left:'-130px', bg:'rgba(153,69,255,.18)', anim:'bb-orb 20s ease-in-out infinite', delay:'0s', blur:'90px' },
        { w:400, h:400, top:'25%', right:'-80px', bg:'rgba(0,194,255,.14)', anim:'bb-orb 28s ease-in-out infinite reverse', delay:'-9s', blur:'80px' },
        { w:340, h:340, bottom:'15%', left:'8%', bg:'rgba(20,241,149,.10)', anim:'bb-orb 22s ease-in-out infinite', delay:'-14s', blur:'80px' },
        { w:220, h:220, top:'58%', right:'18%', bg:'rgba(245,198,106,.08)', anim:'bb-orb 17s ease-in-out infinite reverse', delay:'-6s', blur:'60px' },
      ].map((o, i) => (
        <div key={i} style={{
          position: 'fixed', width: o.w, height: o.h, borderRadius: '50%',
          background: `radial-gradient(circle,${o.bg} 0%,transparent 70%)`,
          filter: `blur(${o.blur})`, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 0,
          animation: o.anim, animationDelay: o.delay,
          top: (o as any).top, left: (o as any).left, right: (o as any).right, bottom: (o as any).bottom,
        }} />
      ))}

      {/* ── PARTICLE CANVAS ── */}
      <canvas ref={cvs} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: .65 }} />

      {/* ── NAVBAR ── */}
      <Navbar />

      {/* ══════════════════════════════════════════════════════════════ HERO */}
      <section style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '140px 24px 100px', textAlign: 'center',
        background: [
          'radial-gradient(ellipse 80% 55% at 50% 15%,rgba(153,69,255,.14) 0%,transparent 65%)',
          'radial-gradient(ellipse 50% 40% at 85% 85%,rgba(0,194,255,.09) 0%,transparent 55%)',
          'radial-gradient(ellipse 45% 35% at 10% 70%,rgba(20,241,149,.07) 0%,transparent 50%)',
        ].join(','),
      }}>
        {/* Floating geometric accent shapes */}
        <div style={{ position:'absolute', top:'15%', right:'7%', width:100, height:100, borderRadius:'30%', border:'1px solid rgba(0,194,255,.12)', animation:'bb-spin 30s linear infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'70%', left:'5%', width:60, height:60, borderRadius:'50%', border:'1px solid rgba(153,69,255,.14)', background:'rgba(153,69,255,.04)', animation:'bb-float 9s ease-in-out infinite reverse', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'12%', right:'12%', width:180, height:180, borderRadius:'50%', border:'1px solid rgba(20,241,149,.07)', animation:'bb-spin 40s linear infinite reverse', pointerEvents:'none' }} />

        {/* Twinkling dots */}
        {[
          { top:'28%', left:'20%', c:C.purple },
          { top:'62%', right:'24%', c:C.green },
          { top:'80%', left:'42%', c:C.blue },
        ].map((d, i) => (
          <div key={i} style={{
            position:'absolute', width: i===2?5:4, height: i===2?5:4, borderRadius:'50%',
            background: d.c, boxShadow:`0 0 8px ${d.c}`,
            animation:`bb-twinkle ${3+i}s ease-in-out infinite`, animationDelay:`${-i*1.2}s`,
            pointerEvents:'none', top:(d as any).top, left:(d as any).left, right:(d as any).right,
          }} />
        ))}

        {/* ── Scene (floats) ── */}
        <div className="bb-fl" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:28, position:'relative', zIndex:2 }}>

          {/* Badge */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:9,
            padding:'7px 20px', borderRadius:999,
            border:'1px solid rgba(20,241,149,.42)', background:'rgba(20,241,149,.08)',
            fontSize:11, fontWeight:700, color:C.green,
            letterSpacing:'2.5px', textTransform:'uppercase', fontFamily:C.fontM,
            boxShadow:'0 0 18px rgba(20,241,149,.16)',
            animation:'bb-badge .8s cubic-bezier(.34,1.56,.64,1) .2s both',
            position:'relative', overflow:'hidden',
          }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:C.green, display:'inline-block', animation:'bb-pulse 2s ease-in-out infinite', boxShadow:'0 0 9px rgba(20,241,149,.85)', flexShrink:0 }} />
            <span style={{ position:'absolute', top:0, height:'100%', width:'60%', background:'linear-gradient(90deg,transparent,rgba(20,241,149,.1),transparent)', animation:'bb-shimmer 3s ease-in-out infinite' }} />
            POWERED BY SOLANA
          </div>

          {/* Logo */}
          <img src="/logo.png" alt="BlockBite" style={{ width:100, height:100, objectFit:'contain', animation:'bb-glow 4s ease-in-out infinite', filter:'drop-shadow(0 0 48px rgba(153,69,255,.75))' }} />

          {/* Kicker */}
          <p style={{ fontFamily:C.fontM, fontSize:'clamp(9px,1vw,11px)', fontWeight:500, color:'rgba(168,160,210,.5)', letterSpacing:'.35em', textTransform:'uppercase', margin:0 }}>
            THE UNIFIED TOKEN DISTRIBUTION PROTOCOL
          </p>

          {/* H1 */}
          <h1 style={{ fontFamily:C.fontD, fontSize:'clamp(44px,8vw,92px)', fontWeight:900, lineHeight:1.0, letterSpacing:'-3px', margin:0, maxWidth:940, animation:'bb-hero .8s cubic-bezier(.16,1,.3,1) .5s both' }}>
            Stop Distributing{' '}
            <span style={GT}>Tokens Blindly.</span>
          </h1>

          {/* Sub */}
          <p style={{ fontFamily:C.fontB, fontSize:'clamp(15px,1.65vw,18px)', color:C.muted, maxWidth:600, lineHeight:1.84, margin:0, fontWeight:400, animation:'bb-hero .8s cubic-bezier(.16,1,.3,1) .7s both' }}>
            The unified engine for automated token logistics. Effortlessly manage your entire
            lifecycle from secure vesting to real-time streaming with built-in validation layers.
          </p>

          {/* CTAs */}
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center', animation:'bb-hero .8s cubic-bezier(.16,1,.3,1) .9s both' }}>
            <Link href="/waitlist" className="bb-btn-p">Secure Your Spot Now!</Link>
            <Link href="/streams/new" className="bb-btn-s">Launch App →</Link>
          </div>

          {/* Stats */}
          <div className="bb-stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px 44px', marginTop:52, paddingTop:44, borderTop:`1px solid rgba(153,69,255,.18)`, maxWidth:680, width:'100%', animation:'bb-hero .9s cubic-bezier(.16,1,.3,1) 1.1s both' }}>
            {[
              { label:'Total Streams',     val: stats ? stats.streams.toLocaleString() : '0' },
              { label:'Active Streams',    val: stats ? stats.active.toLocaleString()  : '0' },
              { label:'Total Distributed', val: stats ? stats.distributed + ' tokens'  : '0 tokens' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <p style={{ fontSize:'9.5px', fontWeight:700, color:'rgba(168,160,210,.5)', letterSpacing:'2.5px', textTransform:'uppercase', margin:'0 0 10px', fontFamily:C.fontM }}>{s.label}</p>
                <p style={{ fontFamily:C.fontD, fontWeight:900, fontSize:'clamp(26px,3vw,36px)', margin:0, ...GT }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position:'absolute', bottom:36, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:8, opacity:.45, zIndex:2 }}>
          <div style={{ width:22, height:36, border:`2px solid rgba(153,69,255,.45)`, borderRadius:11, display:'flex', justifyContent:'center', paddingTop:6 }}>
            <div style={{ width:3, height:8, background:C.purple, borderRadius:2, animation:'bb-wheel 1.8s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ FEATURES */}
      <section id="product" style={{ position:'relative', zIndex:1, padding:'96px 24px', background:`linear-gradient(180deg,transparent,rgba(153,69,255,.04) 50%,transparent)`, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          {/* Section header */}
          <div data-reveal data-d="0" className="bb-rev" style={{ textAlign:'center', marginBottom:60 }}>
            <p style={{ display:'inline-block', fontFamily:C.fontM, fontSize:10, fontWeight:700, color:C.green, letterSpacing:'3.5px', textTransform:'uppercase', marginBottom:18, padding:'0 12px', position:'relative' }}>
              <span style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', right:'100%', width:24, height:1, background:C.green, opacity:.5 }} />
              PROTOCOL FEATURES
              <span style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:'100%', width:24, height:1, background:C.green, opacity:.5 }} />
            </p>
            <h2 style={{ fontFamily:C.fontD, fontSize:'clamp(26px,3.5vw,44px)', fontWeight:800, color:C.text, margin:'0 0 16px', letterSpacing:'-1.2px' }}>
              Everything a token campaign needs.{' '}
              <span style={GT}>Nothing it doesn&apos;t.</span>
            </h2>
            <p style={{ fontFamily:C.fontB, fontSize:'clamp(14px,1.4vw,16px)', color:C.muted, maxWidth:560, margin:'0 auto', lineHeight:1.78 }}>
              From modular verification to automated clawbacks — all the tools a token distribution needs, built into one trustless protocol.
            </p>
          </div>

          {/* Feature cards — 3 col with holographic tilt */}
          <div className="bb-feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {[
              { icon:'◎', color:C.purple, title:'Flexible Schedules',
                desc:'Send tokens to your team, investors, or community with cliff locks, linear streams, and milestone-gated tranches — all in one stream.',
                tags:['Cliff support','Linear vesting','Milestone gates'] },
              { icon:'◈', color:'#c084fc', title:'Game-Powered Proof',
                desc:'Recipients earn milestone unlocks by playing the BlockBite puzzle game. Gamified, sybil-resistant, and fully verifiable on-chain.',
                tags:['Sybil-resistant','On-chain proof'] },
              { icon:'✦', color:C.green, title:'Anti-Dump by Default',
                desc:'Hard time locks and milestone gates prevent immediate sell pressure. Align your community around long-term growth.',
                tags:['Creator-controlled','Fair to recipients'] },
            ].map((f, i) => (
              <div key={i} data-reveal data-d={String(i * 0.12)} className="bb-rev"
                onMouseMove={e => onTilt(`fc${i}`, e)} onMouseLeave={() => offTilt(`fc${i}`)}
                style={{ borderRadius:22, padding:1, background:`linear-gradient(135deg,rgba(153,69,255,.28),rgba(20,241,149,.15))`, transition:'transform .15s ease', ...tilt(`fc${i}`) }}>
                <div style={{ borderRadius:21, background:C.elev, padding:'30px 28px 26px', height:'100%', boxSizing:'border-box', display:'flex', flexDirection:'column', gap:18, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${f.color}66,transparent)`, opacity: tiltMap[`fc${i}`] && tiltMap[`fc${i}`].rx !== 0 ? 1 : 0, transition:'opacity .3s' }} />
                  <div style={{ width:52, height:52, borderRadius:16, background:`linear-gradient(135deg,${f.color}22,${f.color}10)`, border:`1px solid ${f.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:f.color, transition:'transform .3s cubic-bezier(.34,1.56,.64,1)' }}>{f.icon}</div>
                  <h3 style={{ fontFamily:C.fontD, fontSize:20, fontWeight:700, color:C.text, margin:0, letterSpacing:'-0.3px' }}>{f.title}</h3>
                  <p style={{ fontFamily:C.fontB, fontSize:13.5, color:C.muted, lineHeight:1.74, margin:0, flex:1 }}>{f.desc}</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {f.tags.map(t => <span key={t} className="bb-tag">{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vesting model cards */}
          <div className="bb-vest-grid" data-reveal data-d="0.2" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginTop:52 }} data-reveal-d="0.2">
            {VESTING.map((v, i) => (
              <div key={i} className="bb-vcard" style={{ padding:'28px 24px', borderRadius:18, border:`1px solid ${C.border}`, background:C.card, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${v.color}07,transparent)`, opacity:0, transition:'opacity .3s' }} />
                <span style={{ fontSize:28, marginBottom:14, display:'block', color:v.color }}>{v.icon}</span>
                <div style={{ fontFamily:C.fontD, fontSize:18, fontWeight:700, marginBottom:10, color:v.color }}>{v.title}</div>
                <p style={{ fontFamily:C.fontB, fontSize:13, color:C.muted, lineHeight:1.74, margin:'0 0 18px' }}>{v.desc}</p>
                {/* Animated progress bar */}
                <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,.08)', overflow:'hidden', position:'relative' }}>
                  <div style={{ position:'absolute', top:0, left:0, height:'100%', width:`${v.bar}%`, background:`linear-gradient(90deg,${v.color}88,${v.color})`, borderRadius:2 }}>
                    <div style={{ position:'absolute', right:0, top:-3, width:2, height:9, borderRadius:1, background:v.color, boxShadow:`0 0 8px ${v.color}`, filter:'brightness(1.5)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ HOW IT WORKS */}
      <section id="how" style={{ position:'relative', zIndex:1, padding:'96px 24px', background:C.surface, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div data-reveal data-d="0" className="bb-rev" style={{ textAlign:'center', marginBottom:60 }}>
            <p style={{ fontFamily:C.fontM, fontSize:10, fontWeight:700, color:C.purpleLt, letterSpacing:'3.5px', textTransform:'uppercase', marginBottom:18 }}>HOW IT WORKS</p>
            <h2 style={{ fontFamily:C.fontD, fontSize:'clamp(26px,3.5vw,44px)', fontWeight:800, color:C.text, margin:'0 0 16px', letterSpacing:'-1.2px' }}>
              Four moves.{' '}<span style={GT}>From setup to claim.</span>
            </h2>
            <p style={{ fontFamily:C.fontB, fontSize:'clamp(14px,1.4vw,16px)', color:C.muted, maxWidth:560, margin:'0 auto', lineHeight:1.78 }}>
              Upload recipients, choose how tokens unlock, and let each wallet claim on schedule.
            </p>
          </div>

          {/* 4 steps */}
          <div className="bb-steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24, position:'relative', marginBottom:72 }}>
            {/* Connector shimmer line */}
            <div style={{ position:'absolute', top:19, left:'12%', right:'12%', height:1, background:`linear-gradient(90deg,rgba(153,69,255,.12),rgba(153,69,255,.45),rgba(20,241,149,.45),rgba(20,241,149,.12))`, overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent)', animation:'bb-shimmer 3s ease-in-out infinite' }} />
            </div>
            {STEPS.map((h, i) => (
              <div key={i} data-reveal data-d={String(i * 0.12)} className="bb-step bb-rev" style={{ position:'relative' }}>
                <span style={{ position:'absolute', top:-12, left:-10, fontFamily:C.fontD, fontSize:80, fontWeight:900, lineHeight:1, background:`linear-gradient(135deg,${h.color},${C.green})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', opacity:.09, userSelect:'none', pointerEvents:'none', transition:'opacity .3s' }}>{h.num}</span>
                <div className="bb-snum" style={{ position:'relative', zIndex:1, width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${h.color},${C.green})`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, boxShadow:`0 0 20px ${h.color}44`, fontFamily:C.fontD, fontWeight:800, fontSize:13, color:C.void }}>{h.num}</div>
                <h3 style={{ fontFamily:C.fontD, fontSize:16, fontWeight:700, color:C.text, margin:'0 0 10px', letterSpacing:'-0.2px' }}>{h.title}</h3>
                <p style={{ fontFamily:C.fontB, fontSize:13, color:C.muted, lineHeight:1.74, margin:0 }}>{h.desc}</p>
              </div>
            ))}
          </div>

          {/* Verification layer */}
          <div data-reveal data-d="0" className="bb-rev" style={{ textAlign:'center', marginBottom:22 }}>
            <p style={{ fontFamily:C.fontM, fontSize:10, fontWeight:700, color:C.muted, letterSpacing:'2.5px', textTransform:'uppercase', margin:0 }}>CHOOSE YOUR VERIFICATION LAYER</p>
          </div>
          <div className="bb-ver-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:64 }}>
            {VERIFY.map((m, i) => (
              <div key={i} data-reveal data-d={String(i * 0.1)} className="bb-rev"
                style={{ padding:'22px 18px', borderRadius:16, background:`${m.color}07`, border:`1px solid ${m.color}22`, transition:'all .25s cubic-bezier(.34,1.56,.64,1)', position:'relative', overflow:'hidden', cursor:'default' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = m.color + '55'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 8px 32px ${m.color}18`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = m.color + '22'; el.style.transform = ''; el.style.boxShadow = ''; }}>
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${m.color},transparent)`, transform:'scaleX(0)', transformOrigin:'left', transition:'transform .3s cubic-bezier(.16,1,.3,1)' }} />
                <div style={{ fontSize:10, color:m.color, fontWeight:800, letterSpacing:'1.8px', marginBottom:6, fontFamily:C.fontM, textTransform:'uppercase' }}>{m.title}</div>
                <div style={{ fontFamily:C.fontD, fontSize:14, fontWeight:600, marginBottom:10, color:C.text }}>{m.sub}</div>
                <p style={{ fontSize:12, color:C.muted, lineHeight:1.65, margin:0, fontFamily:C.fontB }}>{m.desc}</p>
                <span style={{ display:'inline-block', marginTop:12, padding:'3px 9px', borderRadius:99, fontSize:9, fontWeight:800, background:`${m.color}15`, color:m.color, letterSpacing:'1px', fontFamily:C.fontM }}>{m.badge}</span>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div data-reveal data-d="0.1" className="bb-rev" style={{ textAlign:'center', marginBottom:36, paddingTop:52, borderTop:`1px solid ${C.border}` }}>
            <span style={{ display:'block', fontSize:11, letterSpacing:'2.5px', color:C.purple, fontWeight:700, marginBottom:14, fontFamily:C.fontM }}>WHY BLOCKBITE</span>
            <h2 style={{ fontFamily:C.fontD, fontSize:'clamp(22px,3vw,38px)', fontWeight:800, color:C.text, margin:0, letterSpacing:'-0.8px' }}>Built different from day one.</h2>
          </div>
          <div data-reveal data-d="0.15" className="bb-rev" style={{ maxWidth:900, margin:'0 auto', borderRadius:22, overflow:'hidden', border:`1px solid ${C.border}`, boxShadow:'0 8px 40px rgba(0,0,0,.4)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', background:C.elev, padding:'16px 22px', borderBottom:`1px solid ${C.border}` }}>
              {['Feature','BlockBite TDP','Sablier v2','Superfluid','Streamflow'].map((h, i) => (
                <div key={i} style={{ fontSize:'10.5px', fontWeight:700, letterSpacing:'1.3px', textTransform:'uppercase', color: i===1 ? C.purple : C.muted, textAlign: i===0 ? 'left' : 'center', fontFamily:C.fontM }}>{h}</div>
              ))}
            </div>
            {CMP.map((row, i) => (
              <div key={i} className="bb-trow" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'14px 22px', alignItems:'center', background: i%2===0 ? C.card : 'transparent', borderBottom: i<CMP.length-1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ fontSize:13, color:C.text, fontWeight:500, fontFamily:C.fontB }}>{row.feature}</div>
                {[row.bb, row.sablier, row.superfluid, row.streamflow].map((val, j) => (
                  <div key={j} style={{ textAlign:'center' }}>
                    {val
                      ? <span style={{ color: j===0 ? C.green : 'rgba(95,208,122,.45)', fontSize:18 }}>✓</span>
                      : <span style={{ color:'rgba(255,59,107,.38)', fontSize:18 }}>✗</span>
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ DEMO */}
      <section id="demo" style={{ position:'relative', zIndex:1, padding:'96px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div data-reveal data-d="0" className="bb-rev" style={{ textAlign:'center', marginBottom:48 }}>
            <p style={{ fontFamily:C.fontM, fontSize:10, fontWeight:700, color:C.green, letterSpacing:'3.5px', textTransform:'uppercase', marginBottom:18 }}>SEE IT IN ACTION</p>
            <h2 style={{ fontFamily:C.fontD, fontSize:'clamp(26px,3.5vw,44px)', fontWeight:800, color:C.text, margin:'0 0 16px', letterSpacing:'-1.2px' }}>
              See how a campaign <span style={GT}>comes together.</span>
            </h2>
            <p style={{ fontFamily:C.fontB, fontSize:'clamp(14px,1.4vw,16px)', color:C.muted, maxWidth:560, margin:'0 auto', lineHeight:1.78 }}>
              A short walkthrough of campaign setup, vesting configuration, and recipient claims is on the way.
            </p>
          </div>
          <div data-reveal data-d="0.1" className="bb-rev" style={{ maxWidth:880, margin:'0 auto' }}>
            <div style={{ borderRadius:20, overflow:'hidden', border:`1px solid ${C.border}`, boxShadow:'0 16px 64px rgba(0,0,0,.55)', position:'relative' }}>
              {/* Scan line effect */}
              <div style={{ position:'absolute', left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,rgba(153,69,255,.6),transparent)`, animation:'bb-scan 6s ease-in-out infinite', zIndex:2, pointerEvents:'none' }} />
              <video src="/walkthrough.mp4" poster="/walkthrough-poster.jpg" autoPlay muted loop playsInline controls preload="metadata" style={{ width:'100%', display:'block' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ USE CASES */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 24px', background:`linear-gradient(180deg,transparent,rgba(153,69,255,.04) 50%,transparent)`, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div data-reveal data-d="0" className="bb-rev" style={{ textAlign:'center', marginBottom:52 }}>
            <p style={{ fontFamily:C.fontM, fontSize:10, fontWeight:700, color:C.purpleLt, letterSpacing:'3.5px', textTransform:'uppercase', marginBottom:18 }}>USE CASES</p>
            <h2 style={{ fontFamily:C.fontD, fontSize:'clamp(24px,3.5vw,40px)', fontWeight:800, color:C.text, margin:0, letterSpacing:'-1px' }}>
              Who uses <span style={GT}>BlockBite TDP.</span>
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {[
              { audience:'TEAMS',     headline:'Enforce vesting on-chain,\nnot in spreadsheets.',     body:'Give co-founders and employees their tokens over time. Standard 4-year vesting with 1-year cliff — enforce agreements on-chain.', example:'4-year linear · 1-year cliff' },
              { audience:'INVESTORS', headline:'Deliver the unlock schedule\nyou committed to.',       body:'Investors claim on their own — no manual transfers, no trust required. Fully transparent on-chain.',                             example:'2-year linear · 3-month cliff' },
              { audience:'COMMUNITY', headline:'Reward contributors\nfairly and transparently.',      body:'Reward contributors, airdrop participants, or ecosystem grants. Each recipient sees only their own allocation.',               example:'Custom schedule per recipient' },
            ].map((uc, i) => (
              <div key={i} data-reveal data-d={String(i * 0.12)} className="bb-rev"
                onMouseMove={e => onTilt(`uc${i}`, e)} onMouseLeave={() => offTilt(`uc${i}`)}
                style={{ borderRadius:22, padding:1, background:`linear-gradient(135deg,rgba(153,69,255,.22),rgba(20,241,149,.10))`, transition:'transform .15s ease', ...tilt(`uc${i}`) }}>
                <div style={{ borderRadius:21, background:C.surface, padding:'30px 28px 24px', height:'100%', boxSizing:'border-box', display:'flex', flexDirection:'column', gap:16 }}>
                  <p style={{ fontSize:10, fontWeight:800, color:C.purple, letterSpacing:'2.8px', textTransform:'uppercase', margin:0, fontFamily:C.fontM }}>{uc.audience}</p>
                  <h3 style={{ fontFamily:C.fontD, fontSize:20, fontWeight:800, color:C.text, whiteSpace:'pre-line', lineHeight:1.3, margin:0, letterSpacing:'-0.4px' }}>{uc.headline}</h3>
                  <p style={{ fontFamily:C.fontB, fontSize:13.5, color:C.muted, lineHeight:1.74, margin:0, flex:1 }}>{uc.body}</p>
                  <p style={{ borderTop:`1px solid ${C.border}`, paddingTop:14, fontFamily:C.fontM, fontSize:11, color:C.muted, margin:0 }}>{uc.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ FAQ */}
      <section id="faq" style={{ position:'relative', zIndex:1, padding:'80px 24px' }}>
        <div style={{ maxWidth:720, margin:'0 auto' }}>
          <div data-reveal data-d="0" className="bb-rev" style={{ textAlign:'center', marginBottom:48 }}>
            <p style={{ fontFamily:C.fontM, fontSize:10, fontWeight:700, color:C.green, letterSpacing:'3.5px', textTransform:'uppercase', marginBottom:18 }}>FAQ</p>
            <h2 style={{ fontFamily:C.fontD, fontSize:'clamp(24px,3.5vw,40px)', fontWeight:800, color:C.text, margin:0, letterSpacing:'-1px' }}>
              Questions, <span style={GT}>answered.</span>
            </h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {FAQ.map((item, i) => (
              <div key={i} data-reveal data-d={String(i * 0.07)} className="bb-rev" style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${faqOpen[i] ? C.borderS : C.border}`, transition:'border-color .25s' }}>
                <button className="bb-faq-q" onClick={() => setFaqOpen(p => p.map((v, idx) => idx===i ? !v : v))}>
                  <span>{item.q}</span>
                  <span className="bb-chev" style={{ transform: faqOpen[i] ? 'rotate(180deg)' : 'none', color: faqOpen[i] ? C.purple : C.muted }}>⌄</span>
                </button>
                <div style={{ maxHeight: faqOpen[i] ? 200 : 0, overflow:'hidden', transition:'max-height .4s cubic-bezier(.16,1,.3,1)' }}>
                  <div style={{ padding:'0 22px 18px', fontFamily:C.fontB, fontSize:13.5, color:C.muted, lineHeight:1.78, background: faqOpen[i] ? C.elev : 'transparent' }}>{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ WAITLIST */}
      <section id="waitlist" style={{ position:'relative', zIndex:1, padding:'80px 24px' }}>
        <div data-reveal data-d="0" className="bb-rev" style={{ maxWidth:600, margin:'0 auto', borderRadius:28, padding:2, backgroundSize:'200% 200%', background:'linear-gradient(135deg,rgba(153,69,255,.5),rgba(0,194,255,.3),rgba(20,241,149,.3))', animation:'bb-gborder 5s linear infinite' }}>
          <div style={{ borderRadius:26, background:C.elev, padding:'52px 44px', textAlign:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,rgba(153,69,255,.6),transparent)` }} />
            <p style={{ fontFamily:C.fontM, fontSize:10, fontWeight:700, color:C.purpleLt, letterSpacing:'3px', textTransform:'uppercase', marginBottom:14 }}>EARLY ACCESS · LIMITED SPOTS</p>
            <h2 style={{ fontFamily:C.fontD, fontSize:'clamp(24px,3.5vw,36px)', fontWeight:800, color:C.text, margin:'0 0 14px', letterSpacing:'-1px' }}>
              Be first on the <span style={GT}>mainnet rollout.</span>
            </h2>
            <p style={{ fontFamily:C.fontB, fontSize:14, color:C.muted, maxWidth:400, margin:'0 auto 28px', lineHeight:1.72 }}>
              Leave your email. We&apos;ll let you know when live campaigns open, plus a personal onboarding session for the first 100 teams.
            </p>
            {!submitted ? (
              <form className="bb-wl-form" style={{ display:'flex', gap:10, maxWidth:440, margin:'0 auto' }} onSubmit={e => { e.preventDefault(); if (email) setSubmitted(true); }}>
                <input type="email" placeholder="you@example.com" className="bb-wl-input" required value={email} onChange={e => setEmail(e.target.value)} />
                <button type="submit" className="bb-btn-p" style={{ whiteSpace:'nowrap', padding:'14px 28px' }}>Join Waitlist →</button>
              </form>
            ) : (
              <div style={{ padding:'16px 28px', borderRadius:14, background:'rgba(20,241,149,.08)', border:`1px solid rgba(20,241,149,.35)`, color:C.green, fontWeight:700, fontSize:14, display:'inline-block' }}>
                You are on the list. We will reach out soon.
              </div>
            )}
            <p style={{ marginTop:14, fontSize:11, color:'rgba(168,160,210,.42)', fontFamily:C.fontM }}>No spam. Unsubscribe anytime.</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginTop:20 }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:999, fontSize:11, fontWeight:600, border:`1px solid rgba(20,241,149,.35)`, color:C.green, background:'rgba(20,241,149,.06)', fontFamily:C.fontM }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:C.green, animation:'bb-pulse 2s infinite' }} />
                Founding access open
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', padding:'5px 14px', borderRadius:999, fontSize:11, fontWeight:600, border:`1px solid ${C.border}`, color:C.muted, fontFamily:C.fontM }}>Q3 2026 mainnet target</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ FINAL CTA */}
      <section style={{ position:'relative', zIndex:1, padding:'100px 24px 120px', textAlign:'center' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 80% at 50% 50%,rgba(153,69,255,.10) 0%,transparent 70%)', pointerEvents:'none' }} />
        <h2 data-reveal data-d="0" className="bb-rev" style={{ fontFamily:C.fontD, fontSize:'clamp(26px,4vw,48px)', fontWeight:900, marginBottom:18, color:C.text, letterSpacing:'-1.5px', position:'relative' }}>
          Ready to distribute tokens responsibly?
        </h2>
        <p data-reveal data-d="0.1" className="bb-rev" style={{ fontSize:15, color:C.muted, maxWidth:480, margin:'0 auto 36px', lineHeight:1.72, fontFamily:C.fontB }}>
          Join the projects already streaming tokens with cliff, linear, and milestone vesting on Solana.
        </p>
        <div data-reveal data-d="0.15" className="bb-rev" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/streams/new" className="bb-btn-p">Launch App →</Link>
          <Link href="https://github.com/BlockBite-GameFi/blockbite-smart-contract/tree/main/docs" target="_blank" rel="noopener noreferrer" className="bb-btn-s">Open docs</Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ FOOTER */}
      <footer style={{ position:'relative', zIndex:1, borderTop:`1px solid ${C.border}`, padding:'36px 24px', background:C.surface }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <img src="/logo.png" alt="BlockBite" style={{ width:28, height:28, objectFit:'contain', filter:'drop-shadow(0 0 12px rgba(153,69,255,.6))' }} />
            <div>
              <span style={{ fontWeight:800, fontSize:14, color:C.text, fontFamily:C.fontD }}>BlockBite</span>
              <p style={{ margin:0, fontSize:11, color:C.muted, fontFamily:C.fontB }}>Solana-native token vesting and distribution. Fair, automatic, and cheap.</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:24 }}>
            {[
              { href:'https://x.com/blockbite_gg', label:'Twitter / X' },
              { href:'https://discord.gg/blockbite', label:'Discord' },
              { href:'https://github.com/BlockBite-GameFi/blockbite-smart-contract', label:'GitHub' },
            ].map(l => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:C.muted, textDecoration:'none', fontFamily:C.fontB, transition:'color .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}>{l.label}</a>
            ))}
          </div>
        </div>
        <div style={{ maxWidth:1200, margin:'16px auto 0', paddingTop:16, borderTop:`1px solid rgba(153,69,255,.08)`, textAlign:'center' }}>
          <p style={{ fontSize:12, color:C.muted, fontFamily:C.fontM, margin:0 }}>© 2026 BlockBite · Token Distribution Protocol on Solana</p>
        </div>
      </footer>

    </div>
  );
}
