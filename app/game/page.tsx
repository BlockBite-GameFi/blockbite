'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

// ─── Design System V3 ─────────────────────────────────────────────────────────
const DS = {
  bg0:    '#05040d',
  bg1:    '#09071a',
  accent: '#a78bff',
  gold:   '#f5c66a',
  green:  '#5fd07a',
  blue:   '#7ad7ff',
  purple: '#c084fc',
  muted:  'rgba(232,225,248,.38)',
  border: 'rgba(167,139,255,.13)',
  card:   'rgba(255,255,255,.042)',
  cinzel: "'Cinzel', serif",
  sora:   "'Sora', system-ui, sans-serif",
  mono:   "'JetBrains Mono', monospace",
};

export default function GamePage() {
  return (
    <main style={{ minHeight: '100vh', background: DS.bg0, color: '#f0ecff', fontFamily: DS.sora }}>
      <Navbar />

      {/* ── Verification context banner ─────────────────────────────────────── */}
      <div style={{
        marginTop: 0,
        padding: '0 24px',
        background: DS.bg1,
        borderBottom: `1px solid ${DS.border}`,
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          padding: '28px 0',
          display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${DS.purple}18`, border: `1px solid ${DS.purple}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: DS.purple,
          }}>◈</div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 10, color: DS.purple, fontWeight: 700, letterSpacing: '1.8px', marginBottom: 6, textTransform: 'uppercase' }}>
              TDP · Game Verification Layer
            </div>
            <p style={{ fontSize: 14, color: '#e8e1f8', lineHeight: 1.68, margin: '0 0 16px', maxWidth: 640 }}>
              This game is a <strong style={{ color: DS.purple }}>milestone verification mechanism</strong> for TDP vesting streams.
              Playing earns points that can be configured as on-chain milestone proof for your vesting schedule.
              Score thresholds are set per-stream and verified via a signed CPI call to the TDP program.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/milestones" style={{
                padding: '8px 18px', borderRadius: 9,
                background: DS.card, border: `1px solid ${DS.border}`,
                color: DS.muted, fontWeight: 600, fontSize: 13, textDecoration: 'none',
              }}>
                ← Back to Milestones
              </Link>
              <Link href="/streams/new" style={{
                padding: '8px 18px', borderRadius: 9,
                background: `${DS.purple}22`, border: `1px solid ${DS.purple}44`,
                color: DS.purple, fontWeight: 700, fontSize: 13, textDecoration: 'none',
              }}>
                Connect to Stream →
              </Link>
            </div>
          </div>

          {/* Score threshold info */}
          <div style={{
            padding: '14px 18px', borderRadius: 12,
            background: `${DS.purple}0c`, border: `1px solid ${DS.purple}22`,
            minWidth: 160, flexShrink: 0,
          }}>
            <div style={{ fontSize: 9.5, color: DS.purple, fontWeight: 700, letterSpacing: '1.4px', marginBottom: 8, textTransform: 'uppercase' }}>
              Default Threshold
            </div>
            <div style={{ fontFamily: DS.mono, fontSize: 22, fontWeight: 700, color: DS.purple, marginBottom: 4 }}>1,000</div>
            <div style={{ fontSize: 11, color: DS.muted }}>points per session</div>
            <div style={{ marginTop: 10, fontSize: 10, color: DS.muted, borderTop: `1px solid ${DS.border}`, paddingTop: 8 }}>
              Configurable per stream
            </div>
          </div>
        </div>
      </div>

      {/* ── Game embed placeholder ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 100px' }}>

        {/* Info cards row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
          gap: 14, marginBottom: 36,
        }}>
          {[
            { icon: '◈', color: DS.purple, title: 'Play the Game', desc: 'Solve block puzzles to accumulate points in a session.' },
            { icon: '✦', color: DS.gold,   title: 'Hit Threshold', desc: 'Reach the configured score threshold for your stream.' },
            { icon: '◎', color: DS.green,  title: 'Proof Submitted', desc: 'Session result is signed and submitted on-chain via CPI.' },
            { icon: '⬡', color: DS.blue,   title: 'Milestone Unlocks', desc: 'Verified score unlocks the token allocation tranche.' },
          ].map((card, i) => (
            <div key={i} style={{
              padding: '18px 16px', borderRadius: 14,
              background: DS.card, border: `1px solid ${DS.border}`,
              textAlign: 'center',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, margin: '0 auto 12px',
                background: `${card.color}18`, border: `1px solid ${card.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: card.color,
              }}>{card.icon}</div>
              <div style={{ fontFamily: DS.cinzel, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{card.title}</div>
              <div style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.55 }}>{card.desc}</div>
            </div>
          ))}
        </div>

        {/* Game iframe area */}
        <div style={{
          borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${DS.border}`,
          background: DS.bg1,
          minHeight: 520,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16,
          position: 'relative',
        }}>
          {/* Glow overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${DS.purple}08 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ fontSize: 36, color: DS.purple, opacity: .5 }}>◈</div>
          <div style={{ fontFamily: DS.cinzel, fontSize: 22, fontWeight: 700, color: '#f0ecff', opacity: .7 }}>
            BlockBite Puzzle Game
          </div>
          <p style={{ fontSize: 13, color: DS.muted, maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
            The interactive game loads here. Connect your wallet and link a vesting stream to have your score count toward on-chain milestone verification.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/tutorial" style={{
              padding: '11px 24px', borderRadius: 11,
              background: `linear-gradient(135deg, ${DS.purple}cc, #6b21a8cc)`,
              color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}>
              Launch Game →
            </Link>
            <Link href="/milestones" style={{
              padding: '11px 20px', borderRadius: 11,
              background: DS.card, border: `1px solid ${DS.border}`,
              color: DS.muted, fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}>
              Milestones
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
