'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { withRpcFallback } from '@/lib/solana/rpc-manager';
import { getAllStreams } from '@/lib/anchor/vesting-client';
import { T } from '@/lib/theme';
import { I18N } from '@/lib/i18n';
import { useApp } from '@/lib/useApp';

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 20px', ...style }}>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, color: T.textDim, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: T.textDim }}>{sub}</div>
    </div>
  );
}

interface LiveStats { streams: number; active: number; locked: string; distributed: string; }

function fmt(n: bigint): string {
  if (n >= 1_000_000n) return `${(Number(n) / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000n)     return `${(Number(n) / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function ProtocolPage() {
  const tx = I18N.protocol as any;
  const id = false;

  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    withRpcFallback(conn => getAllStreams(conn)).then(all => {
      const nowSec = Math.floor(Date.now() / 1000);
      const active = all.filter(s => !s.cancelled && Number(s.endTs.toString()) > nowSec).length;
      const locked = all.reduce((sum, s) => {
        const total = BigInt(s.amountTotal.toString());
        const drawn = BigInt(s.amountWithdrawn.toString());
        return sum + (total > drawn ? total - drawn : 0n);
      }, 0n);
      const distributed = all.reduce((sum, s) => sum + BigInt(s.amountWithdrawn.toString()), 0n);
      setLiveStats({ streams: all.length, active, locked: fmt(locked), distributed: fmt(distributed) });
    }).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(88px,12vw,108px) clamp(16px,5vw,40px) 80px' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: T.accent, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>
            {tx.badge}
          </div>
          <h1 style={{ fontFamily: T.serif, fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, color: T.text, marginBottom: 10 }}>
            {tx.title}
          </h1>
          <p style={{ fontSize: 13, color: T.textDim, maxWidth: 500, lineHeight: 1.7 }}>
            {tx.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── Hero value prop ── */}
          <div style={{
            padding: 'clamp(24px,4vw,36px)', borderRadius: 20,
            background: `linear-gradient(135deg, ${T.bg2}, #1a0e38)`,
            border: `1.5px solid ${T.accentA4}`,
            boxShadow: `0 0 60px ${T.accentA1}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 200, height: 200, borderRadius: '50%',
              background: T.accent, opacity: 0.04, filter: 'blur(60px)',
              pointerEvents: 'none',
            }} />
            <h2 style={{ fontFamily: T.serif, fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, color: T.text, lineHeight: 1.2, margin: '0 0 12px', maxWidth: 520 }}>
              Stop Distributing Tokens Blindly
            </h2>
            <p style={{ fontSize: 14, color: T.textDim, maxWidth: 520, lineHeight: 1.7, margin: '0 0 24px' }}>
              Reclaim your time and eliminate the risk of manual errors.
              Replace manual spreadsheets with an automated system that handles
              vesting, streaming, distribution, and verification in one place.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/new" style={{
                padding: '11px 24px', borderRadius: 10,
                background: T.grad,
                color: T.text, fontSize: 14, fontWeight: 700,
                textDecoration: 'none', fontFamily: T.serif,
                boxShadow: `0 0 20px ${T.accent}44`,
              }}>
                {tx.launchApp}
              </Link>
              <Link href="/streams" style={{
                padding: '11px 24px', borderRadius: 10,
                border: `1px solid ${T.border}`,
                background: 'rgba(255,255,255,.04)',
                color: T.textDim, fontSize: 14,
                textDecoration: 'none', fontFamily: T.serif,
              }}>
                {tx.readDocs}
              </Link>
            </div>
          </div>

          {/* ── Live stats ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: 14 }}>
            {[
              { label: 'Total Streams',      value: liveStats ? String(liveStats.streams)     : '0', sub: 'on devnet program',    color: T.gold   },
              { label: 'Active Streams',     value: liveStats ? String(liveStats.active)      : '0', sub: 'not cancelled & live', color: T.accent },
              { label: 'Tokens Locked',      value: liveStats ? liveStats.locked              : '0', sub: 'in program vaults',    color: T.green  },
              { label: 'Tokens Distributed', value: liveStats ? liveStats.distributed         : '0', sub: 'total withdrawn',      color: T.blue   },
            ].map(s => (
              <Card key={s.label} style={{ padding: '18px 18px' }}>
                <StatBox {...s} />
              </Card>
            ))}
          </div>

          {/* ── Features from i18n ── */}
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 14 }}>
              Vesting Models
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 12 }}>
              {[
                { type: id ? 'Linear'    : 'Linear',    col: T.accent, icon: '∿', href: '/new/linear',
                  desc: id ? 'Token terbuka secara terus-menerus dan merata selama periode tertentu.' : 'Tokens unlock continuously and evenly over a set period.' },
                { type: id ? 'Cliff'     : 'Cliff',     col: T.gold,   icon: '◇', href: '/new/cliff',
                  desc: id ? 'Periode penguncian sebelum distribusi token dimulai.' : 'A timed lockup period before any token distribution begins.' },
                { type: id ? 'Milestone' : 'Milestone', col: T.blue,   icon: '◉', href: '/new/milestone',
                  desc: id ? 'Token terbuka hanya saat target proyek tertentu tercapai.' : 'Token releases triggered strictly by achieving specific project targets.' },
              ].map(m => (
                <Link key={m.type} href={m.href} style={{ textDecoration: 'none' }}>
                  <Card style={{ padding: '18px 20px', display: 'flex', gap: 14, cursor: 'pointer', transition: 'border-color .15s', borderColor: `${m.col}22` }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: T.accentA2, border: `1px solid ${T.accentA4}`,
                      display: 'grid', placeItems: 'center', fontSize: 20,
                      fontFamily: T.mono, fontWeight: 700, color: m.col,
                    }}>
                      {m.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: m.col, fontFamily: T.serif, marginBottom: 4 }}>
                        {m.type}
                      </div>
                      <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.6 }}>{m.desc}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* ── How it works ── */}
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 14 }}>
              How It Works
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,200px),1fr))', gap: 14 }}>
              {[
                { step: '01', title: 'Configure',  icon: '◈', desc: 'Choose stream type: linear, cliff, or milestone. Set amounts and schedule.' },
                { step: '02', title: 'Deploy',     icon: '▲', desc: 'Tokens lock into a PDA vault on Solana. Smart contract enforces all rules on-chain.'  },
                { step: '03', title: 'Verify',     icon: '✦', desc: 'Choose between a simple direct claim for maximum ease, or gamified verification to act as an anti-bots filter.' },
                { step: '04', title: 'Claim',      icon: '◎', desc: 'Recipient withdraws vested tokens at any time. Math is enforced by the program.'      },
              ].map(s => (
                <Card key={s.step} style={{ textAlign: 'center', padding: '20px 16px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.15em', color: T.accent, marginBottom: 8, fontFamily: T.mono }}>
                    STEP {s.step}
                  </div>
                  <div style={{ fontSize: 26, marginBottom: 10, color: T.accent, fontWeight: 700 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6, fontFamily: T.serif }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: T.textDim, lineHeight: 1.6 }}>{s.desc}</div>
                </Card>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
