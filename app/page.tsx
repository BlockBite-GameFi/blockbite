'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { getAllStreams } from '@/lib/anchor/vesting-client';
import Navbar from '@/components/Navbar';

// ─── Design Tokens (unchanged content references) ─────────────────────────────
const DS = {
  bg0:      '#020008',
  bg1:      '#08050F',
  bg2:      '#0F0A1A',
  accent:   '#9945FF',
  accentDk: '#6B2FBF',
  green:    '#14F195',
  red:      '#FF3B6B',
  blue:     '#00C2FF',
  gold:     '#F5C66A',
  ember:    '#FF7A3A',
  muted:    'rgba(168,160,210,.70)',
  border:   'rgba(153,69,255,.18)',
  card:     'rgba(153,69,255,.06)',
};

const VERIFY_METHODS = [
  {
    color: DS.blue,
    title: 'Automated',
    sub: 'Always On',
    desc: 'Token streams run fully on-chain. No manual intervention needed — conditions execute the moment they are met.',
    badge: 'Fully Automated',
  },
  {
    color: '#c084fc',
    title: 'Game',
    sub: 'Play to Unlock',
    desc: 'Recipients earn milestone unlocks through the BlockBite puzzle game. Gamified, sybil-resistant, and on-chain verifiable.',
    badge: 'Sybil-Resistant',
  },
  {
    color: DS.accent,
    title: 'Oracle',
    sub: 'On-Chain Data',
    desc: 'Connect any on-chain data feed. KPI thresholds — user count, revenue, TVL — trigger milestone unlock automatically.',
    badge: 'Data-Driven',
  },
  {
    color: DS.green,
    title: 'Manual',
    sub: 'Creator Signs',
    desc: 'Stream creator verifies milestone completion with a signed transaction. Simple, transparent, and fully permissioned.',
    badge: 'Permissioned',
  },
];

const VESTING_MODELS = [
  {
    title: 'Linear',
    icon: '∿',
    color: DS.blue,
    desc: 'Tokens unlock at a constant rate from start to end date. Ideal for team, advisor, and contributor allocations.',
    barWidth: '100%',
  },
  {
    title: 'Cliff',
    icon: '⌐',
    color: DS.accent,
    desc: 'Zero tokens release until the cliff date. Hard time-lock enforced on-chain — no early withdrawals, no exceptions.',
    barWidth: '65%',
  },
  {
    title: 'Milestone',
    icon: '◎',
    color: DS.gold,
    desc: 'Tokens unlock in tranches as project milestones are verified. Choose any verification method to match your workflow.',
    barWidth: '80%',
  },
];

const HOW_IT_WORKS = [
  {
    num: '01',
    color: DS.ember,
    title: 'Connect & Import Data',
    desc: 'Connect your wallet and upload your recipient list via CSV or manual entry in seconds.',
  },
  {
    num: '02',
    color: DS.blue,
    title: 'Define Tokenomics',
    desc: 'Customize your release strategy using linear vesting, cliff periods, or milestone-based distribution.',
  },
  {
    num: '03',
    color: '#c084fc',
    title: 'Set Verification Layer',
    desc: 'Choose Direct Claim for simplicity or add Verification Layers like multisig, oracles, or gamified challenges.',
  },
  {
    num: '04',
    color: DS.green,
    title: 'Lock, Launch & Manage',
    desc: 'Lock assets to automate user claims. Monitor distribution in real-time with absolute Clawback control.',
  },
];

const COMPARISON = [
  { feature: 'Milestone Unlock',      bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Fully Automated',       bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Game Verification',     bb: true,  sablier: false, superfluid: false, streamflow: false },
  { feature: 'Oracle Data Feed',      bb: true,  sablier: false, superfluid: false, streamflow: true  },
  { feature: 'Cliff + Linear',        bb: true,  sablier: true,  superfluid: false, streamflow: true  },
  { feature: 'On-chain Enforcement',  bb: true,  sablier: true,  superfluid: true,  streamflow: true  },
  { feature: 'Anti-dump by Default',  bb: true,  sablier: false, superfluid: false, streamflow: false },
];

const FAQ_ITEMS = [
  {
    q: 'What is BlockBite TDP?',
    a: 'BlockBite TDP is a token distribution protocol on Solana. It lets project teams create vesting streams for team members, investors, and contributors — directly on-chain, with no intermediary.',
  },
  {
    q: 'Who controls the locked tokens?',
    a: 'Nobody. Tokens are locked in a PDA-controlled vault — a program-derived address with no private key. Only the on-chain program can release tokens, and only when the vesting schedule allows it.',
  },
  {
    q: 'What vesting schedules are supported?',
    a: 'Cliff vesting (all tokens at a single date), linear vesting (gradual release over time), and milestone-gated tranches. All schedules support an optional cliff period before linear release begins.',
  },
  {
    q: 'What is the game verification layer?',
    a: "Recipients can earn milestone unlocks by playing the BlockBite puzzle game. It's gamified, sybil-resistant, and the result is fully verifiable on-chain — no one can fake a score.",
  },
  {
    q: 'What happens if a stream is cancelled?',
    a: 'Vesting freezes immediately. The recipient keeps everything already vested and can claim it at any time. Unvested tokens are returned to the stream creator.',
  },
  {
    q: 'What wallets are supported?',
    a: 'Phantom and Solflare are fully supported via Solana wallet-adapter. Any wallet compatible with the adapter standard will work.',
  },
];

interface LiveStats { streams: number; active: number; locked: string; distributed: string; }

export default function Home() {
  const { connection } = useConnection();
  const cvs = useRef<HTMLCanvasElement>(null);
  const cursorGlow = useRef<HTMLDivElement>(null);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [faqOpen, setFaqOpen] = useState<boolean[]>(Array(6).fill(false));
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  // ── Live on-chain stats ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    getAllStreams(connection).then(all => {
      if (cancelled) return;
      const nowSec = Math.floor(Date.now() / 1000);
      const active = all.filter(s => !s.cancelled && Number(s.endTs.toString()) > nowSec).length;
      const locked = all.reduce((sum, s) => {
        const total    = BigInt(s.amountTotal.toString());
        const drawn    = BigInt(s.amountWithdrawn.toString());
        return sum + (total > drawn ? total - drawn : 0n);
      }, 0n);
      const distributed = all.reduce((sum, s) => sum + BigInt(s.amountWithdrawn.toString()), 0n);
      const fmt = (n: bigint) => {
        const m = n / 1_000_000n;
        return m >= 1_000_000n ? (Number(m / 1_000_000n)).toFixed(1) + 'M'
             : m >= 1_000n     ? (Number(m / 1_000n)).toFixed(1) + 'K'
             : m.toString();
      };
      setLiveStats({ streams: all.length, active, locked: fmt(locked), distributed: fmt(distributed) });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [connection]);

  // ── Particle canvas ─────────────────────────────────────────────────────────
  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    let raf: number;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const COLORS = [DS.accent, DS.blue, DS.green, DS.gold, DS.ember];
    const pts = Array.from({ length: 45 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.8 + Math.random() * 2.2,
      spd: 0.08 + Math.random() * 0.18,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      op: 0.04 + Math.random() * 0.12,
      dx: (Math.random() - 0.5) * 0.3,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.y -= p.spd;
        p.x += p.dx;
        if (p.y < -10) { p.y = c.height + 10; p.x = Math.random() * c.width; }
        if (p.x < -10) { p.x = c.width + 10; }
        if (p.x > c.width + 10) { p.x = -10; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.op;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      // Draw faint connection lines between close particles
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = DS.accent;
            ctx.globalAlpha = (1 - dist / 120) * 0.05;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  // ── Cursor glow follower ────────────────────────────────────────────────────
  useEffect(() => {
    const el = cursorGlow.current; if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.left = e.clientX + 'px';
      el.style.top  = e.clientY + 'px';
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ── 3D Holographic card tilt ────────────────────────────────────────────────
  const handleCardTilt = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -10;
    const rotateY = ((x - cx) / cx) * 10;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  }, []);

  const handleCardReset = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = '';
  }, []);

  // ── Scroll reveal ────────────────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay ? parseFloat(el.dataset.delay) : 0;
            setTimeout(() => el.classList.add('visible'), delay * 1000);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.bb-reveal, .bb-reveal-left, .bb-reveal-right, .bb-reveal-scale').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ── Waitlist form ─────────────────────────────────────────────────────────────
  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (waitlistEmail) setWaitlistSubmitted(true);
  };

  return (
    <div className="bb-lp">
      {/* Cursor glow */}
      <div ref={cursorGlow} className="bb-cursor-glow" />

      {/* Ambient background */}
      <div className="bb-grid-bg" />
      <div className="bb-orb bb-orb-1" />
      <div className="bb-orb bb-orb-2" />
      <div className="bb-orb bb-orb-3" />
      <div className="bb-orb bb-orb-4" />

      {/* Particle canvas */}
      <canvas ref={cvs} className="bb-canvas" />

      {/* Navbar (unchanged) */}
      <Navbar />

      {/* ═══ HERO ═══════════════════════════════════════════════════════════════ */}
      <section className="bb-hero">
        {/* Floating geometric decorations */}
        <div className="bb-geo-objects">
          <div className="bb-geo bb-geo-1" />
          <div className="bb-geo bb-geo-2" />
          <div className="bb-geo bb-geo-3" />
          <div className="bb-geo-dot bb-dot-1" />
          <div className="bb-geo-dot bb-dot-2" />
          <div className="bb-geo-dot bb-dot-3" />
        </div>

        <div className="bb-hero-scene">
          {/* Badge */}
          <div className="bb-hero-badge">
            <span className="bb-badge-dot" />
            <span className="bb-badge-dot-ring" />
            POWERED BY SOLANA
          </div>

          {/* Logo */}
          <img
            src="/logo.png"
            alt="BlockBite"
            className="bb-hero-logo"
          />

          {/* Kicker */}
          <p className="bb-hero-kicker">THE UNIFIED TOKEN DISTRIBUTION PROTOCOL</p>

          {/* Headline */}
          <h1 className="bb-hero-h1">
            <span className="bb-hero-h1-split">
              <span style={{ animationDelay: '0.55s' }}>Stop Distributing</span>
            </span>
            {' '}
            <span className="bb-gradient-text">Tokens Blindly.</span>
          </h1>

          {/* Sub-headline */}
          <p className="bb-hero-sub">
            The unified engine for automated token logistics. Effortlessly manage your entire
            lifecycle from secure vesting to real-time streaming with built-in validation layers.
          </p>

          {/* CTAs */}
          <div className="bb-cta-row">
            <Link href="/waitlist" className="bb-btn-primary">
              Secure Your Spot Now!
            </Link>
            <Link href="/streams/new" className="bb-btn-secondary">
              Launch App →
            </Link>
          </div>

          {/* Live Stats */}
          <div className="bb-stats-row">
            {([
              { label: 'Total Streams',     val: liveStats ? liveStats.streams.toLocaleString() : '0' },
              { label: 'Active Streams',    val: liveStats ? liveStats.active.toLocaleString()  : '0' },
              { label: 'Total Distributed', val: liveStats ? liveStats.distributed + ' tokens'  : '0 tokens' },
            ]).map((s, i) => (
              <div key={i} className="bb-stat-item">
                <p className="bb-stat-label">{s.label}</p>
                <p className="bb-stat-val bb-number-counter">{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="bb-scroll-hint">
          <div className="bb-scroll-mouse">
            <div className="bb-scroll-wheel" />
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══════════════════════════════════════════════════════════ */}
      <section className="bb-section bb-alt-bg" id="product">
        <div className="bb-section-center">
          <div className="bb-section-hdr bb-reveal">
            <p className="bb-kicker">PROTOCOL FEATURES</p>
            <h2 className="bb-section-h2">
              Everything a token campaign needs.{' '}
              <span className="bb-gradient-text">Nothing it doesn&apos;t.</span>
            </h2>
            <p className="bb-section-sub">
              From modular verification to automated clawbacks — all the tools a token distribution needs, built into one trustless protocol.
            </p>
          </div>

          <div className="bb-features-grid">
            {([
              {
                icon: '◎', color: DS.accent,
                title: 'Flexible Schedules',
                desc: 'Send tokens to your team, investors, or community with cliff locks, linear streams, and milestone-gated tranches — all in one stream.',
                tags: ['Cliff support', 'Linear vesting', 'Milestone gates'],
              },
              {
                icon: '◈', color: '#c084fc',
                title: 'Game-Powered Proof',
                desc: 'Recipients earn milestone unlocks by playing the BlockBite puzzle game. Gamified, sybil-resistant, and fully verifiable on-chain.',
                tags: ['Sybil-resistant', 'On-chain proof'],
              },
              {
                icon: '✦', color: DS.green,
                title: 'Anti-Dump by Default',
                desc: 'Hard time locks and milestone gates prevent immediate sell pressure. Align your community around long-term growth.',
                tags: ['Creator-controlled', 'Fair to recipients'],
              },
            ]).map((f, i) => (
              <div
                key={i}
                className="bb-feature-card bb-holo-card bb-reveal"
                data-delay={String(i * 0.12)}
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardReset}
              >
                <div className="bb-feature-card-inner">
                  <div
                    className="bb-feature-icon-wrap"
                    style={{
                      background: `linear-gradient(135deg, ${f.color}22, ${f.color}10)`,
                      border: `1px solid ${f.color}44`,
                      color: f.color,
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="bb-feature-h3">{f.title}</h3>
                  <p className="bb-feature-p">{f.desc}</p>
                  <div className="bb-tags">
                    {f.tags.map(tag => (
                      <span key={tag} className="bb-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vesting models */}
          <div className="bb-vesting-grid bb-reveal" style={{ marginTop: 56 }}>
            {VESTING_MODELS.map((v, i) => (
              <div key={i} className="bb-vesting-card bb-reveal" data-delay={String(i * 0.1)}>
                <span className="bb-vesting-icon" style={{ color: v.color }}>{v.icon}</span>
                <div className="bb-vesting-title" style={{ color: v.color }}>{v.title}</div>
                <p className="bb-vesting-desc">{v.desc}</p>
                <div className="bb-vesting-bar">
                  <div
                    className="bb-vesting-bar-fill"
                    style={{
                      width: v.barWidth,
                      background: `linear-gradient(90deg, ${v.color}88, ${v.color})`,
                      color: v.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══════════════════════════════════════════════════════ */}
      <section
        className="bb-section"
        id="how"
        style={{
          background: DS.bg1,
          borderTop: `1px solid ${DS.border}`,
          borderBottom: `1px solid ${DS.border}`,
        }}
      >
        <div className="bb-section-center">
          <div className="bb-section-hdr bb-reveal">
            <p className="bb-kicker kicker-purple">HOW IT WORKS</p>
            <h2 className="bb-section-h2">
              Four moves.{' '}
              <span className="bb-gradient-text">From setup to claim.</span>
            </h2>
            <p className="bb-section-sub">
              Upload recipients, choose how tokens unlock, and let each wallet claim on schedule.
            </p>
          </div>

          {/* Steps */}
          <div className="bb-steps-grid">
            <div className="bb-steps-connector" />
            {HOW_IT_WORKS.map((h, i) => (
              <div key={i} className="bb-step bb-reveal" data-delay={String(i * 0.12)}>
                <span className="bb-step-ghost">{h.num}</span>
                <div
                  className="bb-step-num-badge"
                  style={{ background: `linear-gradient(135deg, ${h.color}, ${DS.green})` }}
                >
                  {h.num}
                </div>
                <h3 className="bb-step-title">{h.title}</h3>
                <p className="bb-step-desc">{h.desc}</p>
              </div>
            ))}
          </div>

          {/* Verification layer */}
          <div className="bb-section-hdr bb-reveal" style={{ marginBottom: 24 }}>
            <p className="bb-kicker" style={{ color: DS.muted }}>CHOOSE YOUR VERIFICATION LAYER</p>
          </div>
          <div className="bb-verify-grid">
            {VERIFY_METHODS.map((m, i) => (
              <div
                key={i}
                className="bb-verify-card bb-reveal"
                data-delay={String(i * 0.1)}
                style={{
                  background: `${m.color}07`,
                  border: `1px solid ${m.color}22`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = m.color + '50';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${m.color}18`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = m.color + '22';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
              >
                <div className="bb-verify-title" style={{ color: m.color }}>{m.title}</div>
                <div className="bb-verify-sub">{m.sub}</div>
                <p className="bb-verify-desc">{m.desc}</p>
                <span
                  className="bb-verify-badge"
                  style={{ background: `${m.color}15`, color: m.color }}
                >{m.badge}</span>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="bb-why-hdr bb-reveal">
            <span className="bb-why-label">WHY BLOCKBITE</span>
            <h2 className="bb-why-h2">Built different from day one.</h2>
          </div>
          <div className="bb-table-wrap bb-reveal">
            <div className="bb-table-hdr">
              {['Feature', 'BlockBite TDP', 'Sablier v2', 'Superfluid', 'Streamflow'].map((h, i) => (
                <div key={i} className={`bb-table-hdr-cell${i === 1 ? ' highlight' : ''}`}>{h}</div>
              ))}
            </div>
            {COMPARISON.map((row, i) => (
              <div key={i} className={`bb-table-row${i % 2 === 0 ? ' even' : ''}`}>
                <div className="bb-table-feature">{row.feature}</div>
                {[row.bb, row.sablier, row.superfluid, row.streamflow].map((val, j) => (
                  <div key={j} className="bb-table-cell">
                    {val
                      ? <span className={`bb-check${j > 0 ? ' dim' : ''}`}>✓</span>
                      : <span className="bb-cross">✗</span>
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DEMO ═══════════════════════════════════════════════════════════════ */}
      <section className="bb-section" id="demo">
        <div className="bb-section-center">
          <div className="bb-section-hdr bb-reveal">
            <p className="bb-kicker">SEE IT IN ACTION</p>
            <h2 className="bb-section-h2">
              See how a campaign{' '}
              <span className="bb-gradient-text">comes together.</span>
            </h2>
            <p className="bb-section-sub">
              A short walkthrough of campaign setup, vesting configuration, and recipient claims is on the way.
            </p>
          </div>
          <div className="bb-reveal" style={{ maxWidth: 880, margin: '0 auto' }}>
            <div style={{
              borderRadius: 20,
              overflow: 'hidden',
              border: `1px solid ${DS.border}`,
              boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
              position: 'relative',
            }}>
              <div className="bb-scan" />
              <video
                src="/walkthrough.mp4"
                poster="/walkthrough-poster.jpg"
                autoPlay muted loop playsInline controls preload="metadata"
                style={{ width: '100%', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHO USES IT ═══════════════════════════════════════════════════════ */}
      <section className="bb-section bb-alt-bg">
        <div className="bb-section-center">
          <div className="bb-section-hdr bb-reveal">
            <p className="bb-kicker kicker-purple">USE CASES</p>
            <h2 className="bb-section-h2">
              Who uses{' '}
              <span className="bb-gradient-text">BlockBite TDP.</span>
            </h2>
          </div>
          <div className="bb-usecases-grid">
            {([
              {
                audience: 'TEAMS',
                headline: 'Enforce vesting on-chain,\nnot in spreadsheets.',
                body: 'Give co-founders and employees their tokens over time. Standard 4-year vesting with 1-year cliff — enforce agreements on-chain.',
                example: '4-year linear · 1-year cliff',
              },
              {
                audience: 'INVESTORS',
                headline: 'Deliver the unlock schedule\nyou committed to.',
                body: 'Investors claim on their own — no manual transfers, no trust required. Fully transparent on-chain.',
                example: '2-year linear · 3-month cliff',
              },
              {
                audience: 'COMMUNITY',
                headline: 'Reward contributors\nfairly and transparently.',
                body: 'Reward contributors, airdrop participants, or ecosystem grants. Each recipient sees only their own allocation.',
                example: 'Custom schedule per recipient',
              },
            ] as const).map((uc, i) => (
              <div
                key={i}
                className="bb-usecase-card bb-reveal"
                data-delay={String(i * 0.12)}
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardReset}
              >
                <div className="bb-usecase-card-inner">
                  <p className="bb-usecase-audience">{uc.audience}</p>
                  <h3 className="bb-usecase-headline">{uc.headline}</h3>
                  <p className="bb-usecase-body">{uc.body}</p>
                  <p className="bb-usecase-example">{uc.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ════════════════════════════════════════════════════════════════ */}
      <section className="bb-section" id="faq">
        <div className="bb-section-center">
          <div className="bb-section-hdr bb-reveal">
            <p className="bb-kicker">FAQ</p>
            <h2 className="bb-section-h2">
              Questions,{' '}
              <span className="bb-gradient-text">answered.</span>
            </h2>
          </div>
          <div className="bb-faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`bb-faq-item bb-reveal${faqOpen[i] ? ' open' : ''}`}
                data-delay={String(i * 0.07)}
              >
                <button
                  className="bb-faq-q"
                  onClick={() => setFaqOpen(prev => prev.map((v, idx) => idx === i ? !v : v))}
                >
                  <span>{item.q}</span>
                  <span className="bb-faq-chevron">⌄</span>
                </button>
                <div className="bb-faq-ans">
                  <div className="bb-faq-ans-inner">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WAITLIST ═══════════════════════════════════════════════════════════ */}
      <section className="bb-section" id="waitlist">
        <div className="bb-waitlist-card bb-reveal-scale">
          <div className="bb-waitlist-inner">
            <p className="bb-kicker kicker-purple" style={{ marginBottom: 12 }}>EARLY ACCESS · LIMITED SPOTS</p>
            <h2 className="bb-waitlist-title">
              Be first on the{' '}
              <span className="bb-gradient-text">mainnet rollout.</span>
            </h2>
            <p className="bb-waitlist-sub">
              Leave your email. We&apos;ll let you know when live campaigns open, plus a personal onboarding session for the first 100 teams.
            </p>
            {!waitlistSubmitted ? (
              <form className="bb-waitlist-form" onSubmit={handleWaitlist}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="bb-waitlist-input"
                  required
                  value={waitlistEmail}
                  onChange={e => setWaitlistEmail(e.target.value)}
                />
                <button type="submit" className="bb-btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  Join Waitlist →
                </button>
              </form>
            ) : (
              <div style={{
                padding: '16px 28px',
                borderRadius: 14,
                background: 'rgba(20,241,149,0.08)',
                border: '1px solid rgba(20,241,149,0.35)',
                color: DS.green,
                fontWeight: 700,
                fontSize: 14,
                display: 'inline-block',
                animation: 'bb-scale-in 0.5s var(--ease-spring) both',
              }}>
                You are on the list. We will reach out soon.
              </div>
            )}
            <p className="bb-waitlist-note">No spam. Unsubscribe anytime.</p>
            <div className="bb-access-badges">
              <span className="bb-access-badge open">
                <span className="bb-access-dot" />
                Founding access open
              </span>
              <span className="bb-access-badge">Q3 2026 mainnet target</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ══════════════════════════════════════════════════════════ */}
      <section className="bb-cta-section">
        <h2 className="bb-cta-h2 bb-reveal">Ready to distribute tokens responsibly?</h2>
        <p className="bb-cta-sub bb-reveal">
          Join the projects already streaming tokens with cliff, linear, and milestone vesting on Solana.
        </p>
        <div className="bb-cta-row bb-reveal">
          <Link href="/streams/new" className="bb-btn-primary">Launch App →</Link>
          <Link
            href="https://github.com/BlockBite-GameFi/blockbite-smart-contract/tree/main/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="bb-btn-secondary"
          >
            Open docs
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════════════════════════ */}
      <footer className="bb-footer">
        <div className="bb-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/logo.png" alt="BlockBite" style={{ width: 28, height: 28, objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(153,69,255,0.6))' }} />
            <div>
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--bb-text)', fontFamily: 'var(--font-display)' }}>BlockBite</span>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--bb-muted)' }}>Solana-native token vesting and distribution. Fair, automatic, and cheap.</p>
            </div>
          </div>
          <div className="bb-footer-links">
            <a href="https://x.com/blockbite_gg" target="_blank" rel="noopener noreferrer" className="bb-footer-link">Twitter / X</a>
            <a href="https://discord.gg/blockbite" target="_blank" rel="noopener noreferrer" className="bb-footer-link">Discord</a>
            <a href="https://github.com/BlockBite-GameFi/blockbite-smart-contract" target="_blank" rel="noopener noreferrer" className="bb-footer-link">GitHub</a>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '16px auto 0', padding: '16px 0 0', borderTop: '1px solid rgba(153,69,255,0.10)' }}>
          <p className="bb-footer-copy" style={{ textAlign: 'center' }}>© 2026 BlockBite · Token Distribution Protocol on Solana</p>
        </div>
      </footer>
    </div>
  );
}
