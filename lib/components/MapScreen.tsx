'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Biome } from '@/lib/game/biomes';
import { levelConfig } from '@/lib/game/levelConfig';
import { getLevelTier } from '@/lib/game/constants';
import { ART, buildPathD, generateLongNodes } from '@/lib/components/MapArt';
import { BIOMES } from '@/lib/game/biomes';
import styles from './MapScreen.module.css';
import { T } from '@/lib/theme';
import { useApp } from '@/lib/useApp';

const CustomWalletButton = dynamic(
  () => import('@/components/CustomWalletButton'),
  { ssr: false, loading: () => <div style={{ height: 36 }} /> }
);

// ─── Design System tokens — CSS-variable-backed for instant theme switching ───
const DS = {
  bg:        T.bg,
  bgPanel:   `color-mix(in srgb, ${T.bg} 97%, transparent)`,
  blur:      'blur(20px)',
  border:    T.border,
  borderSub: `color-mix(in srgb, ${T.border} 55%, transparent)`,
  surface:   T.surface,
  surface2:  T.surface2,
  accent:    T.accent,
  accentDk:  T.accent,
  text:      T.text,
  textDim:   T.textDim,
  font:      T.serif,
  fontMono:  T.mono,
  kicker: {
    fontSize: 9, letterSpacing: 2.5, fontWeight: 700,
    color: T.accent, textTransform: 'uppercase' as const,
  },
};
// ──────────────────────────────────────────────────────────────────────────────

// ─── Strings for the map UI ───────────────────────────────────────────────────
const MAP_TX = {
  navPlay:        'Play',
  navHowItWorks:  'How It Works',
  act:            'Act',
  diff:           'DIFFICULTY',
  reward:         'REWARD',
  goal:           'GOAL',
  moves:          'MOVES',
  diff2:          'DIFF',
  ongoingJourney: 'Ongoing Journey',
  levelLabel:     'Level',
  startExpedition:'START EXPEDITION →',
  playBtn:        'PLAY →',
  played:         'played',
  rewardLbl:      'reward',
  journeyStart:   '▼ JOURNEY START ▼',
  higherLevels:   '▲ HIGHER LEVELS ▲',
  blocks:         (n: number) => `${n} blocks`,
  actGateway:     (act: string, lvl: string) => `ACT ${act} GATEWAY · LVL ${lvl}`,
  finalLevel:     (lvl: string) => `FINAL LEVEL · LVL ${lvl}`,
  actEnd:         (act: string) => `ACT ${act} END`,
  actStart:       (act: string, lvl: string) => `ACT ${act} · LVL ${lvl}`,
  gameVerif:      'Game Verification',
  verifSuccess:   'Verification Success!',
  thanksHuman:    'Thanks, human! 🎉',
  verifDesc:      (n: number) => `You cleared all ${n} level${n !== 1 ? 's' : ''} of the BlockBite game. Your completion has been recorded — the campaign tokens are now ready to claim.`,
  claimTokens:    'Claim Tokens →',
  backToMap:      '← Back to Map',
};
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Backdrop3D is intentionally a no-op as of 2026-05-16.
 *
 * History: we tried two approaches to a "real 3D" backdrop —
 *   (1) react-three-fiber with terrain mesh + procedural props
 *   (2) deferred-mount + WebGL probe + per-biome scene
 * Both crashed hydration on a non-trivial fraction of devices. The SVG
 * candy-crush map underneath is rich on its own (per-biome art tiles,
 * 14° isometric tilt, winding path, fog, dust motes) and renders the
 * same on every device. We're keeping the slot here so a future
 * lightweight effect (CSS 3D transforms, lottie, etc.) can drop in
 * without touching the call site.
 */
function Backdrop3D(_props: { biome: Biome; progress: number }) {
  return null;
}

export type Layout = 'mobile' | 'tablet' | 'desktop';

interface Props {
  biome: Biome;
  currentLevel: number;
  layout: Layout;
  onEnterLevel: (lvl: number) => void;
  walletAddress?: string;
  topOffset?: number;
  /** Campaign-mode: cap the map at this many levels (1-based from range[0]).
   *  When all levels are completed the map replaces itself with a verification
   *  success screen. Omit for free-play (full 5000-level act). */
  maxLevel?: number;
  /** Campaign ID shown on the success screen's claim button */
  campaignId?: string;
}

// One SVG node per level. 5000 levels per act → 5000 nodes.
// Virtualization only paints nodes near the viewport, so the cost is ~60
// rendered <g> elements at a time regardless of total length.
const SVG_W       = 800;
const NODE_DY     = 70;           // SVG units between consecutive levels
                                  // Was 130 — too sparse, made the SVG 650K tall and put
                                  // huge swaths of dark fog between levels. 70 gives a
                                  // candy-crush-tight switchback while keeping levels
                                  // distinguishable.
const SVG_MARGIN  = 140;          // top + bottom padding inside SVG
const VIS_BUFFER  = 1200;         // SVG units of nodes to render outside viewport
const REVEAL_AHEAD = 5;           // how many locked-but-near nodes to show ahead
const ART_TILE_H  = 700;          // biome backdrop tile height in SVG units
                                  // Was 1200 — made tile #0 fade out before reaching
                                  // Level 1, leaving a dark band over the active area.
                                  // 700 lines up with the new node density so each tile
                                  // covers ~10 levels of path.

function romanize(n: number) {
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][n] ?? String(n);
}

function usePlayerData(currentLevel: number) {
  const [username, setUsername]       = useState('Explorer');
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = localStorage.getItem('bb_username') || 'Explorer';
    const g = parseInt(localStorage.getItem('bb_games_played') ?? '0');
    setUsername(u || 'Explorer');
    setGamesPlayed(isNaN(g) ? 0 : g);
  }, [currentLevel]);

  return { username, gamesPlayed, tier: getLevelTier(currentLevel) };
}


function Avatar({ biome, small }: { biome: Biome; small?: boolean }) {
  const size = small ? 36 : 48;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, ${biome.glow}, ${biome.accent}, ${biome.rock})`,
      border: `2px solid ${biome.glow}`,
      boxShadow: `0 0 ${small ? 8 : 14}px ${biome.accent}88`,
      flexShrink: 0,
    }} />
  );
}

function Pill({ label, value, biome, small }: {
  label: string; value: string | number; biome: Biome; small?: boolean;
}) {
  return (
    <div style={{
      padding: small ? '7px 10px' : '9px 12px', borderRadius: 10,
      background: DS.surface, border: `1px solid ${DS.border}`,
      display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0,
      fontFamily: DS.font,
    }}>
      <div style={{ ...DS.kicker, color: DS.textDim, letterSpacing: 1.5 }}>{label}</div>
      <div style={{ fontSize: small ? 12 : 13, fontWeight: 700, color: DS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </div>
  );
}

function NodeDot({
  n, active, biome, unlocked, onClick,
}: {
  n: { x: number; y: number; level: number };
  active: boolean;
  biome: Biome;
  unlocked: boolean;
  onClick: () => void;
  depth: number;
}) {
  const R  = active ? 36 : unlocked ? 28 : 22;
  const fz = active ? 16 : unlocked ? 13 : 11;
  // 3D sphere fills via radialGradient (defined once in <defs>) — gives every
  // node real depth instead of a flat fill. Cheap: same gradient instance reused.
  const sphereFill =
    active   ? 'url(#bb-node-active)'
    : unlocked ? 'url(#bb-node-unlocked)'
    : 'url(#bb-node-locked)';
  const border  = active ? '#fff' : unlocked ? biome.glow : '#334155';
  const txtFill = active ? '#0a0a14' : unlocked ? '#fff' : '#94a3b8';

  return (
    <g
      onClick={unlocked ? onClick : undefined}
      style={{ cursor: unlocked ? 'pointer' : 'default' }}
      role={unlocked ? 'button' : undefined}
      aria-label={unlocked ? `Level ${n.level}` : undefined}
    >
      {/* enlarged transparent hit area for easy tapping */}
      <circle cx={n.x} cy={n.y} r={R + 18} fill="transparent" />

      {/* soft ground shadow — 3D anchor */}
      <ellipse cx={n.x + 3} cy={n.y + R * 0.82}
        rx={R * 0.92} ry={R * 0.22}
        fill="#000" opacity="0.55" />

      {/* outer glow halo for active + unlocked */}
      {(active || unlocked) && (
        <circle cx={n.x} cy={n.y} r={R + 10}
          fill={active ? biome.glow : biome.accent}
          opacity={active ? 0.35 : 0.18}
          filter="url(#bb-node-glow)" />
      )}

      {/* pulse ring for current level */}
      {active && (
        <>
          <circle cx={n.x} cy={n.y} r={R + 4} fill="none"
            stroke={biome.glow} strokeWidth="3" opacity="0">
            <animate attributeName="r"
              values={`${R + 2};${R + 32};${R + 2}`} dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity"
              values="0.85;0;0.85" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx={n.x} cy={n.y} r={R + 7} fill="none"
            stroke={biome.glow} strokeWidth="3.5" opacity="0.5" />
        </>
      )}

      {/* outer decorative ring */}
      <circle cx={n.x} cy={n.y} r={R + 4}
        fill="none"
        stroke={active ? biome.glow : unlocked ? biome.accent + 'cc' : '#1e293b'}
        strokeWidth={active ? 5 : 3} />

      {/* main 3D sphere body */}
      <circle cx={n.x} cy={n.y} r={R}
        fill={sphereFill}
        stroke={border}
        strokeWidth={active ? 3 : 2} />

      {/* specular highlight — top-left "sheen" sells the sphere illusion */}
      <ellipse cx={n.x - R * 0.32} cy={n.y - R * 0.36}
        rx={R * 0.36} ry={R * 0.22}
        fill="#fff" opacity={active ? 0.55 : unlocked ? 0.42 : 0.18} />

      {/* secondary tiny highlight — extra gloss */}
      <ellipse cx={n.x + R * 0.18} cy={n.y - R * 0.48}
        rx={R * 0.08} ry={R * 0.05}
        fill="#fff" opacity={active ? 0.7 : 0.35} />

      {/* level number — ALWAYS visible, even on locked nodes (Candy Crush style) */}
      <text
        x={n.x} y={n.y + fz * 0.42}
        textAnchor="middle" fontSize={fz}
        fontWeight={active ? 900 : 700}
        fill={txtFill}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {n.level.toLocaleString()}
      </text>

      {/* 3-star decoration below unlocked (non-active) nodes */}
      {!active && unlocked && (
        <g opacity="0.9">
          {[-1, 0, 1].map(si => (
            <StarShape
              key={si}
              cx={n.x + si * R * 0.6}
              cy={n.y + R + 12}
              r={Math.max(3.5, R * 0.22)}
              color={biome.glow}
            />
          ))}
        </g>
      )}
    </g>
  );
}

function StarShape({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    return `${(cx + Math.cos(a) * radius).toFixed(1)},${(cy + Math.sin(a) * radius).toFixed(1)}`;
  }).join(' ');
  return <polygon points={pts} fill={color} />;
}

const ACT_NUMERALS = ['I','II','III','IV','V','VI','VII','VIII'];

function ActSelector({ biome }: { biome: Biome }) {
  return (
    <div className={styles.actStrip}>
      {BIOMES.map((b) => {
        const active = b.id === biome.id;
        return (
          <Link
            key={b.id}
            href={`/map/${b.act}`}
            className={`${styles.actLink} ${active ? styles.actLinkActive : ''}`}
            style={active ? {
              background: `${b.accent}20`,
              borderColor: `${b.glow}55`,
              color: b.glow,
            } : undefined}
          >
            {active && (
              /* CSS var bridges the dynamic biome color into the module class */
              <span
                className={styles.actDot}
                style={{ '--dot-color': b.glow } as React.CSSProperties}
              />
            )}
            <span className={styles.actNumeral}>{ACT_NUMERALS[b.act - 1]}</span>
            {active && <span className={styles.actName}>{b.name}</span>}
          </Link>
        );
      })}
    </div>
  );
}

function FinishFlag({ x, y, biome }: { x: number; y: number; biome: Biome }) {
  const TX = MAP_TX;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 50} stroke={biome.glow} strokeWidth="2" />
      <polygon points={`${x},${y} ${x + 22},${y + 6} ${x},${y + 14}`} fill={biome.accent} />
      <text x={x + 32} y={y + 12} fontSize="11" fontWeight="700" fill={biome.glow}>
        {TX.actEnd(romanize(biome.act))}
      </text>
    </g>
  );
}

function MobileTabBar({ biome }: { biome: Biome }) {
  const TX = MAP_TX;
  const navItems = [
    { href: '/map', label: TX.navPlay        },
    { href: '/',    label: TX.navHowItWorks  },
  ];
  return (
    <div style={{
      flexShrink: 0,
      padding: '8px 16px 14px',
      background: DS.bgPanel, backdropFilter: DS.blur,
      borderTop: `1px solid ${DS.border}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      fontFamily: DS.font,
    }}>
      {navItems.map((item) => {
        const active = item.href === '/game';
        return (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '7px 16px', borderRadius: 12,
            background: active ? `linear-gradient(135deg, ${biome.accent}dd, ${biome.glow}cc)` : 'transparent',
            color: active ? '#0a0a14' : DS.textDim,
            fontWeight: active ? 800 : 500,
            fontSize: 11, textDecoration: 'none',
            boxShadow: active ? `0 2px 14px ${biome.accent}66` : 'none',
          }}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function DesktopRail({
  biome, username, gamesPlayed, tier, currentLevel, walletAddress,
}: {
  biome: Biome; username: string;
  gamesPlayed: number; tier: string; currentLevel: number; walletAddress?: string;
}) {
  const TX = MAP_TX;
  const navItems = [
    { href: '/map', label: TX.navPlay        },
    { href: '/',    label: TX.navHowItWorks  },
  ];
  const cfg = levelConfig(currentLevel);
  const displayName = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : username;

  return (
    <div style={{
      width: 160, flexShrink: 0,
      background: DS.bgPanel, backdropFilter: DS.blur,
      borderRight: `1px solid ${DS.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100%', position: 'relative', zIndex: 2,
      fontFamily: DS.font,
    }}>

      {/* ── Player ── */}
      <div style={{ padding: '14px 12px 10px', borderBottom: `1px solid ${DS.borderSub}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar biome={biome} small />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 8, letterSpacing: 2, fontWeight: 700, color: DS.accent, textTransform: 'uppercase', marginBottom: 1 }}>
              {tier}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: DS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 9, color: DS.textDim, marginTop: 1 }}>
              {gamesPlayed} {TX.played}
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {navItems.map((item) => {
          const active = item.href === '/game';
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'block',
              padding: '8px 10px',
              borderRadius: 8,
              borderLeft: `2px solid ${active ? DS.accent : 'transparent'}`,
              background: active ? T.accentA1 : 'transparent',
              color: active ? DS.accentDk : DS.textDim,
              fontSize: 12, fontWeight: active ? 700 : 400,
              textDecoration: 'none', fontFamily: DS.font,
              transition: 'color 0.15s, background 0.15s',
              letterSpacing: active ? 0.2 : 0,
            }}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Stats + Wallet — compact single row ── */}
      <div style={{
        marginTop: 'auto',
        padding: '10px 10px 12px',
        borderTop: `1px solid ${DS.borderSub}`,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {/* Single-row reward stat */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 8px', borderRadius: 8,
          background: DS.surface, border: `1px solid ${DS.borderSub}`,
          fontSize: 11, color: DS.text,
        }}>
          <span style={{ color: biome.glow, fontSize: 11, lineHeight: 1 }}>&#9670;</span>
          <span style={{ fontWeight: 600 }}>{cfg.reward}</span>
          <span style={{ color: DS.textDim, fontSize: 9 }}>{TX.rewardLbl}</span>
        </div>
        <CustomWalletButton />
      </div>
    </div>
  );
}

function TopHeader({ biome, layout, username, tier }: {
  biome: Biome; layout: Layout; username: string; tier: string;
}) {
  const TX = MAP_TX;
  const pad = layout === 'mobile' ? 14 : 20;
  return (
    <div style={{
      padding: `${pad}px ${pad}px 10px`,
      display: 'flex', alignItems: 'center', gap: 12,
      background: `linear-gradient(180deg, ${T.bg} 0%, transparent 100%)`,
      position: 'relative', zIndex: 2, flexShrink: 0,
      fontFamily: DS.font,
    }}>
      <Avatar biome={biome} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...DS.kicker, marginBottom: 3 }}>
          {TX.act} {romanize(biome.act)} · {biome.cohort} · {tier}
        </div>
        <div style={{ fontSize: layout === 'mobile' ? 16 : 22, fontWeight: 800, color: DS.text, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {username}
        </div>
      </div>
    </div>
  );
}

function SideCards({
  biome, level, layout, onEnterLevel,
}: {
  biome: Biome; level: number; layout: Layout;
  onEnterLevel: (l: number) => void;
}) {
  const TX = MAP_TX;
  const cfg = levelConfig(level);
  const statRows = [
    { label: TX.diff,   value: cfg.rarity },
    { label: TX.reward, value: `◆ ${cfg.reward}` },
    { label: TX.goal,   value: TX.blocks(cfg.goal) },
    { label: TX.moves,  value: String(cfg.moves) },
  ];

  return (
    <div style={{
      width: layout === 'desktop' ? 260 : 220,
      flexShrink: 0,
      background: DS.bgPanel, backdropFilter: DS.blur,
      borderLeft: `1px solid ${DS.border}`,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', fontFamily: DS.font,
    }}>

      {/* ── Level header ── */}
      <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${DS.borderSub}` }}>
        <div style={{ fontSize: 8, letterSpacing: 2.5, fontWeight: 700, color: DS.accent, textTransform: 'uppercase', marginBottom: 8 }}>
          {TX.ongoingJourney}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: DS.textDim }}>{TX.levelLabel}</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: DS.text, lineHeight: 1 }}>{level}</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: biome.glow, lineHeight: 1.2 }}>
          {cfg.title}
        </div>
      </div>

      {/* ── Stats — single table card ── */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          background: DS.surface,
          border: `1px solid ${DS.borderSub}`,
          borderRadius: 10, overflow: 'hidden',
        }}>
          {statRows.map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 12px',
              borderBottom: i < statRows.length - 1 ? `1px solid ${DS.borderSub}` : 'none',
            }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: DS.textDim, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {row.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: DS.text }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: '4px 12px 16px', marginTop: 'auto' }}>
        <button
          onClick={() => onEnterLevel(level)}
          style={{
            width: '100%', padding: '12px', borderRadius: 10,
            background: `linear-gradient(135deg, ${biome.accent}f0, ${biome.glow}e0)`,
            color: '#0a0a14', fontWeight: 900, fontSize: 12,
            border: 'none', fontFamily: DS.font, letterSpacing: 1.5,
            boxShadow: `0 4px 18px ${biome.accent}44`,
            cursor: 'pointer', transition: 'transform 0.12s, box-shadow 0.12s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 26px ${biome.accent}66`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 18px ${biome.accent}44`;
          }}
        >
          {TX.startExpedition}
        </button>
      </div>
    </div>
  );
}

function BottomCard({
  biome, level, onEnterLevel,
}: {
  biome: Biome; level: number;
  onEnterLevel: (l: number) => void;
}) {
  const TX = MAP_TX;
  const cfg = levelConfig(level);
  return (
    <div style={{
      padding: '14px 14px 0',
      background: DS.bgPanel, backdropFilter: DS.blur,
      borderTop: `1px solid ${DS.border}`,
      flexShrink: 0, fontFamily: DS.font,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ ...DS.kicker, marginBottom: 2 }}>{TX.ongoingJourney}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: DS.text, lineHeight: 1.2 }}>
            Lv.{level} <span style={{ color: biome.glow }}>{cfg.title}</span>
          </div>
        </div>
        <button
          onClick={() => onEnterLevel(level)}
          style={{
            padding: '9px 18px', borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${biome.accent}dd, ${biome.glow}cc)`,
            color: '#0a0a14', fontWeight: 900, fontSize: 12,
            border: 'none', fontFamily: DS.font, letterSpacing: 0.5,
            boxShadow: `0 2px 14px ${biome.accent}66`, cursor: 'pointer',
          }}
        >
          {TX.playBtn}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <Pill label={TX.diff2}  value={cfg.rarity}                biome={biome} small />
        <Pill label={TX.reward} value={`◆ ${cfg.reward}`}    biome={biome} small />
        <Pill label={TX.moves}  value={cfg.moves}                  biome={biome} small />
      </div>
    </div>
  );
}

export function MapScreen({ biome, currentLevel, layout, onEnterLevel, walletAddress, topOffset = 0, maxLevel, campaignId }: Props) {
  const TX = MAP_TX;
  const player    = usePlayerData(currentLevel);
  const scrollRef = useRef<HTMLDivElement>(null);
  const Art       = ART[biome.id];

  // In campaign mode, cap the range at maxLevel levels from range[0].
  // Free-play: full 5000-level act.
  const effectiveEnd = maxLevel != null
    ? biome.range[0] + maxLevel - 1
    : biome.range[1];

  // Show verification success screen when all campaign levels are done.
  const allLevelsDone = maxLevel != null && currentLevel > effectiveEnd;

  // One node per level. Virtualized at render time.
  const totalLevels = effectiveEnd - biome.range[0] + 1;
  const SVG_H = totalLevels * NODE_DY + SVG_MARGIN * 2;

  const allNodes = React.useMemo(
    () => generateLongNodes(biome.range[0], effectiveEnd, NODE_DY, SVG_W, SVG_MARGIN, SVG_H),
    [biome.range[0], effectiveEnd, SVG_H],
  );

  const clampedLevel = Math.max(biome.range[0], Math.min(effectiveEnd, currentLevel));
  const activeIdx = clampedLevel - biome.range[0];
  // Locked nodes within REVEAL_AHEAD of active are visible but greyed; beyond that they're dimmed.
  const revealCutoff = activeIdx + REVEAL_AHEAD;

  // Virtualized window: only the indices whose SVG y is within the viewport (±VIS_BUFFER)
  // get rendered. Updated on scroll/resize. Default window covers the active node.
  const [visRange, setVisRange] = useState<{ start: number; end: number }>(() => {
    const s = Math.max(0, activeIdx - 25);
    const e = Math.min(totalLevels, activeIdx + 35);
    return { start: s, end: e };
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const recompute = () => {
      const svg = el.querySelector('svg');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (!rect.height) return;
      const scale = rect.width / SVG_W; // SVG units → px ratio (uniform)
      if (scale <= 0) return;
      const topSvg = el.scrollTop / scale;
      const botSvg = (el.scrollTop + el.clientHeight) / scale;
      // Inverted layout: index i sits at y = SVG_H - SVG_MARGIN - i*NODE_DY.
      // Visible window covers SVG y in [topSvg-VIS_BUFFER, botSvg+VIS_BUFFER].
      // Solving for i: i_min from y=botSvg+buffer; i_max from y=topSvg-buffer.
      const iFromY = (y: number) => (SVG_H - SVG_MARGIN - y) / NODE_DY;
      const startIdx = Math.max(0, Math.floor(iFromY(botSvg + VIS_BUFFER)));
      const endIdx   = Math.min(totalLevels, Math.ceil(iFromY(topSvg - VIS_BUFFER)) + 1);
      setVisRange(prev => (prev.start === startIdx && prev.end === endIdx)
        ? prev
        : { start: startIdx, end: endIdx });
    };

    recompute();
    el.addEventListener('scroll', recompute, { passive: true });
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', recompute);
      ro.disconnect();
    };
  }, [totalLevels]);

  // Build path only for the visible window — a 5000-node single SVG path
  // is fine as data but cheaper to repaint when limited to the viewport.
  const visNodes = allNodes.slice(visRange.start, visRange.end);
  const pathD = buildPathD(visNodes);

  // Auto-scroll so the active level lands near the top-third of the viewport
  // on mount, on level change, or on biome change. Runs once content is laid out.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const doScroll = (): boolean => {
      const svg = el.querySelector('svg');
      if (!svg) return false;
      const rect = svg.getBoundingClientRect();
      if (!rect.height) return false;
      const scale = rect.width / SVG_W;
      // Inverted layout: active node y = SVG_H - SVG_MARGIN - activeIdx * NODE_DY.
      // We want it parked ~60% from top of viewport (so future levels stay above).
      const targetSvgY = SVG_H - SVG_MARGIN - activeIdx * NODE_DY;
      const targetPx = targetSvgY * scale;
      el.scrollTop = Math.max(0, targetPx - el.clientHeight * 0.6);
      return true;
    };

    if (doScroll()) return;

    const svg = el.querySelector('svg');
    if (!svg) return;
    const observer = new ResizeObserver(() => { if (doScroll()) observer.disconnect(); });
    observer.observe(svg);
    const timer = setTimeout(doScroll, 600);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [biome.id, activeIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // How many backdrop tiles we need to cover the full SVG height
  const artTileCount = Math.ceil(SVG_H / ART_TILE_H);

  const isDesktop = layout === 'desktop';
  const isTablet  = layout === 'tablet';
  const isMobile  = layout === 'mobile';
  const displayName = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : player.username;

  // Active level expressed as 0–1 within this act (or campaign range).
  const progress = Math.max(
    0,
    Math.min(1, (currentLevel - biome.range[0]) / Math.max(1, effectiveEnd - biome.range[0])),
  );

  // ── Verification success screen (campaign mode only) ──────────────────────
  if (allLevelsDone) {
    return (
      <div style={{
        width: '100%', height: `calc(100vh - ${topOffset}px)`,
        marginTop: topOffset,
        background: biome.sky,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.serif,
      }}>
        <div style={{
          maxWidth: 480, width: '100%', margin: '0 20px',
          padding: '48px 36px', borderRadius: 24, textAlign: 'center',
          background: DS.bgPanel,
          border: `1.5px solid ${biome.glow}55`,
          boxShadow: `0 0 60px ${biome.accent}18`,
        }}>
          {/* Celebration icon */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
            background: `radial-gradient(circle at 35% 35%, ${biome.glow}, ${biome.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, boxShadow: `0 0 40px ${biome.accent}55`,
          }}>&#10022;</div>

          <div style={{
            fontSize: 10, letterSpacing: '3px', fontWeight: 800,
            color: biome.glow, textTransform: 'uppercase', marginBottom: 12,
          }}>
            {TX.gameVerif}
          </div>
          <h2 style={{
            fontSize: 28, fontWeight: 900, color: DS.text,
            margin: '0 0 8px', lineHeight: 1.2,
          }}>
            {TX.verifSuccess}
          </h2>
          <p style={{
            fontSize: 15, color: biome.glow, fontWeight: 700,
            margin: '0 0 16px',
          }}>
            {TX.thanksHuman}
          </p>
          <p style={{
            fontSize: 13, color: DS.textDim, lineHeight: 1.7,
            margin: '0 0 32px',
          }}>
            {TX.verifDesc(maxLevel ?? 0)}
          </p>

          {/* Claim button */}
          <Link
            href={campaignId ? `/campaigns/${campaignId}` : '/campaigns'}
            style={{
              display: 'inline-block', padding: '14px 36px', borderRadius: 12,
              background: `linear-gradient(135deg, ${biome.accent}, ${biome.glow})`,
              color: '#0a0a14', fontWeight: 900, fontSize: 15,
              textDecoration: 'none',
              boxShadow: `0 0 28px ${biome.accent}55`,
              letterSpacing: '0.02em',
            }}
          >
            {TX.claimTokens}
          </Link>

          <div style={{ marginTop: 20 }}>
            <Link href="/map" style={{
              fontSize: 12, color: DS.textDim, textDecoration: 'none',
            }}>
              {TX.backToMap}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: `calc(100vh - ${topOffset}px)`,
      marginTop: topOffset,
      background: biome.sky, color: DS.text,
      fontFamily: T.serif,
      display: 'flex',
      flexDirection: isDesktop ? 'row' : 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Real-time 3D biome backdrop — terrain, lighting, fog, scattered
          props, winding path. Renders BEHIND the SVG candy-crush layer so
          clicks on level nodes still work. Gated on a small client-side
          delay so the SVG paints first and the WebGL context creation can't
          block first paint. Can be force-disabled via localStorage
          `bb_3d_disabled=1` — protects users whose GPU drivers refuse a
          WebGL context. */}
      <Backdrop3D biome={biome} progress={progress} />
      {/* Subtle vignette to anchor the UI on top of the 3D scene. */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: `radial-gradient(ellipse at 50% 60%, transparent 0%, transparent 35%, rgba(0,0,0,0.55) 100%)`,
        pointerEvents: 'none',
      }} />
      {isDesktop && (
        <DesktopRail
          biome={biome}
          username={player.username}
          gamesPlayed={player.gamesPlayed}
          tier={player.tier}
          currentLevel={currentLevel}
          walletAddress={walletAddress}
        />
      )}

      {!isDesktop && (
        <TopHeader
          biome={biome}
          layout={layout}
          username={displayName}
          tier={player.tier}
        />
      )}

      {/* Main column. On desktop it sits to the right of DesktopRail inside
          the outer flex-ROW container; flex:1 there means "grow to fill the
          remaining width". On mobile/tablet the outer is flex-COLUMN and
          this same div stacks below TopHeader; flex:1 there means "grow to
          fill the remaining height" and its width comes from align-items:
          stretch.
          PREVIOUS BUG: had `width: 0` which forced the wrapper to zero
          cross-axis on the mobile flex-column outer, collapsing every child
          inside (act selector, map, BottomCard) and leaving only TopHeader
          + badge visible. Replaced with width:'100%' so mobile gets full
          viewport width; desktop's `flex: 1 1 0` still distributes width
          via the main-axis growth path. */}
      <div style={{
        flex: '1 1 0', display: 'flex', flexDirection: 'column',
        width: '100%',
        height: '100%',
        minWidth: 0, minHeight: 0, overflow: 'hidden',
        position: 'relative', zIndex: 2,
      }}>

      {/* 8-act selector strip — lets the player browse every biome map. */}
      <ActSelector biome={biome} />

      <div style={{
        flex: 1, display: 'flex',
        // Mobile = column (map on top, bottom card below + tab bar).
        // Tablet + desktop = row (map fills left, side cards on the right).
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0,
      }}>
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
            position: 'relative',
          }}
        >
          {/* Full-width — no clamp. SVG fills the available column and scales.
              Removed the rotateX(14deg) perspective tilt: it was a CSS hack
              that made the top of the SVG appear smaller/distant — perceived
              by users as "the map is shrinking." The SVG node layout
              (per-biome art tiles) is rich enough on its own. */}
          <div style={{
            width: '100%',
          }}>
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              preserveAspectRatio="xMidYMin meet"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <defs>
                <linearGradient id="bb-path-depth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={biome.path} stopOpacity="1" />
                  <stop offset="100%" stopColor={biome.path} stopOpacity="0.15" />
                </linearGradient>
                {/* Depth fog: darker at TOP (distant high levels), clear at BOTTOM (player). */}
                <linearGradient id="bb-fog-depth" x1="0" y1="0" x2="0" y2="1">
                  {/* Softened from 0.55 → 0.28 so the act-gateway top is atmospheric
                      but not pitch-black when the player happens to scroll up there. */}
                  <stop offset="0%"  stopColor="#000" stopOpacity="0.28" />
                  <stop offset="35%" stopColor="#000" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </linearGradient>
                {/* Spotlight: bright halo around the player position (BOTTOM of map). */}
                <radialGradient id="bb-spotlight" cx="50%" cy="92%" r="70%">
                  <stop offset="0%"  stopColor={biome.glow} stopOpacity="0.18" />
                  <stop offset="40%" stopColor={biome.glow} stopOpacity="0.05" />
                  <stop offset="100%" stopColor={biome.glow} stopOpacity="0" />
                </radialGradient>
                {/* 3D sphere gradients used by each node — depth illusion */}
                <radialGradient id="bb-node-active" cx="35%" cy="32%" r="70%">
                  <stop offset="0%"   stopColor="#fff" stopOpacity="0.95" />
                  <stop offset="40%"  stopColor={biome.glow} />
                  <stop offset="100%" stopColor={biome.accent} />
                </radialGradient>
                <radialGradient id="bb-node-unlocked" cx="35%" cy="32%" r="70%">
                  <stop offset="0%"   stopColor={biome.glow} stopOpacity="0.95" />
                  <stop offset="55%"  stopColor={biome.accent} />
                  <stop offset="100%" stopColor={biome.rock} />
                </radialGradient>
                <radialGradient id="bb-node-locked" cx="35%" cy="32%" r="70%">
                  <stop offset="0%"   stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>
                <filter id="bb-node-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
                <style>{`
                  @keyframes bb-node-pop {
                    0%   { opacity: 0; transform: scale(0.3); transform-box: fill-box; transform-origin: center; }
                    65%  { opacity: 1; transform: scale(1.18); transform-box: fill-box; transform-origin: center; }
                    100% { opacity: 1; transform: scale(1);    transform-box: fill-box; transform-origin: center; }
                  }
                  @keyframes bb-active-pulse {
                    0%, 100% { transform: scale(1);    opacity: 0.9; }
                    50%      { transform: scale(1.08); opacity: 1;   }
                  }
                `}</style>
              </defs>

              {/* Tiled biome backdrop — Art component is designed for a 600-tall canvas
                  so we tile it vertically every ART_TILE_H units to cover the full map. */}
              {Art && Array.from({ length: artTileCount }).map((_, t) => (
                <g key={`tile-${t}`} transform={`translate(0 ${t * ART_TILE_H}) scale(${SVG_W / 400} ${ART_TILE_H / 600})`}>
                  {/* Pass a unique seed per tile so the procedural scenery doesn't
                      visibly repeat. Same biome, different placement of crystals/
                      pines/etc. each tile — produces a continuous landscape. */}
                  <Art b={biome} seed={biome.act * 1000 + t * 137} />
                </g>
              ))}
              <rect width={SVG_W} height={SVG_H} fill={biome.fog} />
              <rect width={SVG_W} height={SVG_H} fill="url(#bb-fog-depth)" />
              <rect width={SVG_W} height={SVG_H} fill="url(#bb-spotlight)" />

              {/* TOP label — campaign mode shows "FINAL LEVEL", free-play shows act gateway */}
              <text
                x={SVG_W / 2} y={70}
                textAnchor="middle" fontSize="22" fontWeight="900"
                fill={biome.glow} opacity="0.7" letterSpacing="5"
              >
                {maxLevel != null
                  ? TX.finalLevel(effectiveEnd.toLocaleString())
                  : TX.actGateway(romanize(biome.act), biome.range[1].toLocaleString())
                }
              </text>
              <text
                x={SVG_W / 2} y={96}
                textAnchor="middle" fontSize="12" fontWeight="600"
                fill="#fff" opacity="0.45" letterSpacing="3"
              >
                {TX.higherLevels}
              </text>

              {/* Candy path — shadow base */}
              <path d={pathD} stroke="rgba(0,0,0,0.45)" strokeWidth="26" fill="none"
                strokeLinecap="round" />
              {/* Candy path — solid body */}
              <path d={pathD} stroke={biome.path} strokeWidth="18" fill="none"
                strokeLinecap="round" opacity="0.9" />
              {/* Candy stripe — white highlight dashes */}
              <path d={pathD} stroke="rgba(255,255,255,0.42)" strokeWidth="6" fill="none"
                strokeDasharray="12 16" strokeLinecap="round" />
              {/* Candy stripe — dark counter-dashes for depth */}
              <path d={pathD} stroke="rgba(0,0,0,0.22)" strokeWidth="5" fill="none"
                strokeDasharray="12 16" strokeDashoffset="14" strokeLinecap="round" />

              {/* Render only the virtualized window of nodes.
                  visRange shifts as the user scrolls — ~50–80 nodes painted at a time. */}
              {visNodes.map((n, k) => {
                const i = visRange.start + k;
                if (i === 0) return null;
                const prev = allNodes[i - 1];
                const midX = (prev.x + n.x) / 2;
                const midY = (prev.y + n.y) / 2;
                return (
                  <circle key={`mid-${i}`} cx={midX} cy={midY} r={3}
                    fill={biome.path} opacity={0.45} />
                );
              })}

              {visNodes.map((n, k) => {
                const i = visRange.start + k;
                const isActive   = i === activeIdx;
                const isUnlocked = n.level <= clampedLevel;
                const isFutureNear = !isUnlocked && i <= revealCutoff;
                // Only animate-pop nodes near the active player position — past
                // levels are stable, far-future locked nodes are static.
                const shouldPop = isActive || isFutureNear;
                const displayN = isActive ? { ...n, level: currentLevel } : n;
                return (
                  <g
                    key={i}
                    style={shouldPop
                      ? { animation: `bb-node-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both`, animationDelay: `${Math.max(0, i - activeIdx) * 60}ms` }
                      : undefined}
                  >
                    <NodeDot
                      n={displayN}
                      biome={biome}
                      active={isActive}
                      unlocked={isUnlocked}
                      onClick={() => onEnterLevel(isActive ? currentLevel : n.level)}
                      depth={0}
                    />
                  </g>
                );
              })}

              {/* Finish flag floats above the last (highest-level) node at the TOP */}
              {activeIdx >= allNodes.length - 2 && (
                <FinishFlag
                  x={allNodes[allNodes.length - 1].x}
                  y={allNodes[allNodes.length - 1].y - 60}
                  biome={biome}
                />
              )}

              {/* BOTTOM label = act start (level startLevel sits down here) */}
              <text
                x={SVG_W / 2} y={SVG_H - 56}
                textAnchor="middle" fontSize="14" fontWeight="700"
                fill="#fff" opacity="0.45" letterSpacing="3"
              >
                {TX.journeyStart}
              </text>
              <text
                x={SVG_W / 2} y={SVG_H - 30}
                textAnchor="middle" fontSize="16" fontWeight="800"
                fill={biome.glow} opacity="0.6" letterSpacing="3"
              >
                {TX.actStart(romanize(biome.act), biome.range[0].toLocaleString())}
              </text>
            </svg>
          </div>
        </div>

        {!isMobile ? (
          <SideCards
            biome={biome}
            level={currentLevel}
            layout={layout}
            onEnterLevel={onEnterLevel}
          />
        ) : (
          <BottomCard
            biome={biome}
            level={currentLevel}
            onEnterLevel={onEnterLevel}
          />
        )}
      </div>
      </div>{/* close the new column wrapper holding ActSelector + map+sidecards row */}

      {isMobile && <MobileTabBar biome={biome} />}

      {/* Deploy verification badge */}
      <div style={{
        position: 'fixed', right: 12, bottom: 12, zIndex: 9999,
        padding: '5px 10px', borderRadius: 8,
        background: DS.bgPanel, backdropFilter: 'blur(12px)',
        border: `1px solid ${DS.border}`,
        color: DS.textDim, fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
        fontFamily: DS.fontMono, pointerEvents: 'none',
      }}>
        MAP v2 · {new Date().toISOString().slice(0,10)}
      </div>
    </div>
  );
}
