'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Biome } from '@/lib/game/biomes';
import { levelConfig } from '@/lib/game/levelConfig';
import { getLevelTier } from '@/lib/game/constants';
import { ART, buildPathD, generateLongNodes } from '@/lib/components/MapArt';
import { BIOMES } from '@/lib/game/biomes';
import dynamic from 'next/dynamic';

// react-three-fiber refuses to SSR — load the 3D scene client-only with no
// SSR fallback (the SVG path on top still renders fine on the server, and
// the 3D backdrop fades in once webGL is ready).
const BiomeScene3D = dynamic(() => import('@/lib/components/BiomeScene3D'), {
  ssr: false,
});

/** Deferred mount + kill switch for the 3D backdrop. */
function Backdrop3D({ biome, progress }: { biome: Biome; progress: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // localStorage flag lets a user disable WebGL if their device crashed.
    if (localStorage.getItem('bb_3d_disabled') === '1') return;
    // Probe WebGL once before mounting the whole r3f machinery.
    try {
      const probe = document.createElement('canvas');
      const ctx =
        probe.getContext('webgl2') ||
        probe.getContext('webgl') ||
        (probe as HTMLCanvasElement & { getContext(t: string): unknown }).getContext('experimental-webgl');
      if (!ctx) return;
    } catch { return; }
    // Defer ~300 ms so SVG paints first.
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <BiomeScene3D biome={biome} progress={progress} />
    </div>
  );
}

export type Layout = 'mobile' | 'tablet' | 'desktop';

interface Props {
  biome: Biome;
  currentLevel: number;
  layout: Layout;
  onEnterLevel: (lvl: number) => void;
  walletAddress?: string;
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
  const [tickets, setTickets]         = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u      = localStorage.getItem('bb_username') || 'Explorer';
    const wallet = localStorage.getItem('bb_wallet') || '';
    const raw    = wallet ? localStorage.getItem(`tickets_${wallet}`) : null;
    const t      = parseInt(raw ?? '0');
    const g      = parseInt(localStorage.getItem('bb_games_played') ?? '0');
    setUsername(u || 'Explorer');
    setTickets(isNaN(t) ? 0 : t);
    setGamesPlayed(isNaN(g) ? 0 : g);
  }, [currentLevel]);

  return { username, tickets, gamesPlayed, tier: getLevelTier(currentLevel) };
}

function usePrizePool() {
  const [pool, setPool] = useState(0);
  useEffect(() => {
    fetch('/api/prizepool')
      .then(r => r.json())
      .then(d => setPool(typeof d.balance === 'number' ? d.balance : 0))
      .catch(() => {});
  }, []);
  return pool;
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
      padding: small ? '6px 10px' : '8px 12px', borderRadius: 12,
      background: 'rgba(0,0,0,0.4)', border: `1px solid ${biome.accent}44`,
      display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0,
    }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: biome.glow, opacity: 0.85 }}>{label}</div>
      <div style={{ fontSize: small ? 12 : 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

function ActSelector({ biome }: { biome: Biome }) {
  return (
    <div style={{
      flexShrink: 0,
      padding: '8px 12px',
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(8,8,22,0.7)', backdropFilter: 'blur(14px)',
      borderTop: `1px solid ${biome.accent}22`,
      borderBottom: `1px solid ${biome.accent}33`,
      overflowX: 'auto', whiteSpace: 'nowrap',
    }}>
      <span style={{
        fontSize: 10, letterSpacing: 2, color: biome.glow, opacity: 0.7,
        marginRight: 6, flexShrink: 0,
      }}>
        ACTS
      </span>
      {BIOMES.map((b) => {
        const active = b.id === biome.id;
        return (
          <Link
            key={b.id}
            href={`/map/${b.act}`}
            style={{
              flexShrink: 0,
              padding: '7px 13px', borderRadius: 999,
              background: active
                ? `linear-gradient(135deg, ${b.accent}, ${b.glow})`
                : 'rgba(255,255,255,0.04)',
              border: active
                ? `1px solid ${b.glow}`
                : `1px solid ${b.accent}33`,
              color: active ? '#0a0a14' : '#cbd5e1',
              fontSize: 11, fontWeight: active ? 900 : 600,
              letterSpacing: 1, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: active ? `0 0 14px ${b.accent}66` : 'none',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: 2,
              background: b.accent,
              boxShadow: `0 0 6px ${b.glow}`,
            }} />
            {`ACT ${['I','II','III','IV','V','VI','VII','VIII'][b.act - 1]}`}
            <span style={{ opacity: active ? 0.7 : 0.5, fontWeight: 600 }}>
              {b.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function FinishFlag({ x, y, biome }: { x: number; y: number; biome: Biome }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 50} stroke={biome.glow} strokeWidth="2" />
      <polygon points={`${x},${y} ${x + 22},${y + 6} ${x},${y + 14}`} fill={biome.accent} />
      <text x={x + 32} y={y + 12} fontSize="11" fontWeight="700" fill={biome.glow}>
        ACT {romanize(biome.act)} END
      </text>
    </g>
  );
}

const NAV_ITEMS = [
  { href: '/game',        label: 'Play' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/shop',        label: 'Shop' },
  { href: '/how-to-play', label: 'Guide' },
];

function MobileTabBar({ biome }: { biome: Biome }) {
  return (
    <div style={{
      flexShrink: 0,
      padding: '10px 16px 16px',
      background: 'rgba(8,8,22,0.96)', backdropFilter: 'blur(16px)',
      borderTop: `1px solid ${biome.accent}33`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    }}>
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          padding: '7px 12px', borderRadius: 16,
          background: item.href === '/game'
            ? `linear-gradient(135deg, ${biome.accent}, ${biome.glow})`
            : 'transparent',
          color: item.href === '/game' ? '#0a0a14' : '#cbd5e1',
          fontWeight: item.href === '/game' ? 800 : 500,
          fontSize: 10, textDecoration: 'none',
          boxShadow: item.href === '/game' ? `0 0 16px ${biome.accent}88` : 'none',
        }}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function DesktopRail({
  biome, username, tickets, gamesPlayed, tier, currentLevel, walletAddress,
}: {
  biome: Biome; username: string; tickets: number;
  gamesPlayed: number; tier: string; currentLevel: number; walletAddress?: string;
}) {
  const cfg = levelConfig(currentLevel);
  const displayName = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : username;
  return (
    <div style={{
      width: 240, flexShrink: 0, padding: 24,
      background: 'rgba(8,8,22,0.55)', backdropFilter: 'blur(16px)',
      borderRight: `1px solid ${biome.accent}33`,
      display: 'flex', flexDirection: 'column', gap: 6,
      height: '100%',
      position: 'relative', zIndex: 2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Avatar biome={biome} small />
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: biome.glow }}>{tier.toUpperCase()}</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{displayName}</div>
          <div style={{ fontSize: 10, opacity: 0.55, color: '#94a3b8' }}>{gamesPlayed} games played</div>
        </div>
      </div>
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 10,
          background: item.href === '/game' ? `${biome.accent}22` : 'transparent',
          border: item.href === '/game' ? `1px solid ${biome.accent}55` : '1px solid transparent',
          color: item.href === '/game' ? biome.glow : '#cbd5e1',
          fontSize: 14, fontWeight: item.href === '/game' ? 700 : 500,
          textDecoration: 'none',
        }}>
          {item.label}
        </Link>
      ))}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 14,
          background: 'rgba(0,0,0,0.45)', border: `1px solid ${biome.glow}55`,
          fontSize: 13, fontWeight: 700, color: '#fff', width: '100%',
        }}>
          <span style={{ color: biome.glow }}>◆</span> {cfg.reward} / level
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 14,
          background: 'rgba(0,0,0,0.45)', border: '1px solid #fde04755',
          fontSize: 13, fontWeight: 700, color: '#fff', width: '100%',
        }}>
          <span style={{ color: '#fde047', fontWeight: 900, fontSize: 10 }}>TKT</span>
          {tickets} ticket{tickets !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

function TopHeader({ biome, layout, username, tier }: {
  biome: Biome; layout: Layout; username: string; tier: string;
}) {
  const pad = layout === 'mobile' ? 14 : 22;
  return (
    <div style={{
      padding: `${pad}px ${pad}px 10px`,
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
      position: 'relative', zIndex: 2, flexShrink: 0,
    }}>
      <Avatar biome={biome} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: biome.glow, opacity: 0.8 }}>
          ACT {romanize(biome.act)} · {biome.cohort} · {tier.toUpperCase()}
        </div>
        <div style={{ fontSize: layout === 'mobile' ? 18 : 24, fontWeight: 800, lineHeight: 1.1 }}>
          {username}
        </div>
      </div>
    </div>
  );
}

function SideCards({
  biome, level, layout, onEnterLevel, prizePool,
}: {
  biome: Biome; level: number; layout: Layout;
  onEnterLevel: (l: number) => void; prizePool: number;
}) {
  const cfg = levelConfig(level);
  return (
    <div style={{
      width: layout === 'desktop' ? 360 : 280, padding: 20,
      background: 'rgba(8,8,22,0.65)', backdropFilter: 'blur(12px)',
      borderLeft: `1px solid ${biome.accent}33`,
      display: 'flex', flexDirection: 'column', gap: 14,
      overflowY: 'auto',
    }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: biome.glow }}>ONGOING JOURNEY</div>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>
        Level {level}:<br />
        <span style={{ color: biome.glow }}>{cfg.title}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Pill label="DIFFICULTY" value={cfg.rarity}          biome={biome} />
        <Pill label="REWARD"     value={`◆ ${cfg.reward}`}   biome={biome} />
        <Pill label="GOAL"       value={`${cfg.goal} blocks`} biome={biome} small />
        <Pill label="MOVES"      value={cfg.moves}            biome={biome} small />
      </div>
      <button
        onClick={() => onEnterLevel(level)}
        style={{
          marginTop: 6, padding: '14px 20px', borderRadius: 14,
          background: `linear-gradient(135deg, ${biome.accent}, ${biome.glow})`,
          color: '#0a0a14', fontWeight: 900, fontSize: 16, border: 'none',
          boxShadow: `0 0 24px ${biome.accent}77`, cursor: 'pointer',
        }}
      >
        START EXPEDITION
      </button>
      <div style={{
        marginTop: 'auto', padding: 14, borderRadius: 14,
        background: 'rgba(0,0,0,0.4)', border: `1px solid ${biome.accent}33`,
      }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, color: biome.glow, opacity: 0.8 }}>
          PRIZE POOL · ON-CHAIN
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
          {prizePool.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 6 }}>USDC</span>
        </div>
        <div style={{ fontSize: 10, color: biome.glow, opacity: 0.55, marginTop: 2 }}>
          devnet · live on-chain balance
        </div>
      </div>
    </div>
  );
}

function BottomCard({
  biome, level, onEnterLevel, prizePool,
}: {
  biome: Biome; level: number;
  onEnterLevel: (l: number) => void; prizePool: number;
}) {
  const cfg = levelConfig(level);
  return (
    <div style={{
      padding: '16px 16px 0',
      background: 'rgba(8,8,22,0.85)', backdropFilter: 'blur(14px)',
      borderTop: `1px solid ${biome.accent}44`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: biome.glow }}>ONGOING JOURNEY</div>
          <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1, marginTop: 4 }}>
            Level {level}: <span style={{ color: biome.glow }}>{cfg.title}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', paddingLeft: 8 }}>
          <div style={{ fontSize: 9, letterSpacing: 1, color: biome.glow, opacity: 0.7 }}>PRIZE POOL</div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            {prizePool.toLocaleString()}<span style={{ fontSize: 9, opacity: 0.6 }}> USDC</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0', alignItems: 'center' }}>
        <Pill label="DIFFICULTY" value={cfg.rarity}        biome={biome} small />
        <Pill label="REWARD"     value={`◆ ${cfg.reward}`} biome={biome} small />
        <Pill label="MOVES"      value={cfg.moves}          biome={biome} small />
        <button
          onClick={() => onEnterLevel(level)}
          style={{
            marginLeft: 'auto', padding: '10px 20px', borderRadius: 999, flexShrink: 0,
            background: `linear-gradient(135deg, ${biome.accent}, ${biome.glow})`,
            color: '#0a0a14', fontWeight: 900, fontSize: 13, border: 'none',
            boxShadow: `0 0 16px ${biome.accent}88`, cursor: 'pointer',
          }}
        >
          PLAY
        </button>
      </div>
    </div>
  );
}

export function MapScreen({ biome, currentLevel, layout, onEnterLevel, walletAddress }: Props) {
  const player    = usePlayerData(currentLevel);
  const prizePool = usePrizePool();
  const scrollRef = useRef<HTMLDivElement>(null);
  const Art       = ART[biome.id];

  // One node per level. 5000 levels → 5000 nodes (virtualized at render time).
  const totalLevels = biome.range[1] - biome.range[0] + 1;
  const SVG_H = totalLevels * NODE_DY + SVG_MARGIN * 2;

  const allNodes = React.useMemo(
    () => generateLongNodes(biome.range[0], biome.range[1], NODE_DY, SVG_W, SVG_MARGIN, SVG_H),
    [biome.range[0], biome.range[1], SVG_H],
  );

  const clampedLevel = Math.max(biome.range[0], Math.min(biome.range[1], currentLevel));
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

  // Active level expressed as 0–1 within this act, fed to the 3D scene so
  // the camera and player marker track the player's progress along the path.
  const progress = Math.max(
    0,
    Math.min(1, (currentLevel - biome.range[0]) / Math.max(1, biome.range[1] - biome.range[0])),
  );

  return (
    <div style={{
      width: '100%', height: '100vh',
      background: biome.sky, color: '#fff',
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
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
          tickets={player.tickets}
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

      {/* Main column to the right of the desktop rail. Holds the act selector
          strip across the top and the map/side-cards row below it. position
          relative + zIndex 2 keeps it above the absolute 3D backdrop. */}
      <div style={{
        flex: '1 1 0', display: 'flex', flexDirection: 'column',
        width: 0,
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
            perspective: '1400px',
            perspectiveOrigin: '50% 100%',
          }}
        >
          {/* Full-width — no clamp. SVG fills the available column and scales. */}
          <div style={{
            width: '100%',
            transformStyle: 'preserve-3d',
            transform: isMobile ? 'none' : 'rotateX(14deg)',
            transformOrigin: '50% 100%',
            willChange: 'transform',
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

              {/* TOP label = end-of-act gateway (level endLevel sits up here) */}
              <text
                x={SVG_W / 2} y={70}
                textAnchor="middle" fontSize="22" fontWeight="900"
                fill={biome.glow} opacity="0.7" letterSpacing="5"
              >
                ACT {romanize(biome.act)} GATEWAY · LVL {biome.range[1].toLocaleString()}
              </text>
              <text
                x={SVG_W / 2} y={96}
                textAnchor="middle" fontSize="12" fontWeight="600"
                fill="#fff" opacity="0.45" letterSpacing="3"
              >
                ▲ HIGHER LEVELS ▲
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
                ▼ JOURNEY START ▼
              </text>
              <text
                x={SVG_W / 2} y={SVG_H - 30}
                textAnchor="middle" fontSize="16" fontWeight="800"
                fill={biome.glow} opacity="0.6" letterSpacing="3"
              >
                ACT {romanize(biome.act)} · LVL {biome.range[0].toLocaleString()}
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
            prizePool={prizePool}
          />
        ) : (
          <BottomCard
            biome={biome}
            level={currentLevel}
            onEnterLevel={onEnterLevel}
            prizePool={prizePool}
          />
        )}
      </div>
      </div>{/* close the new column wrapper holding ActSelector + map+sidecards row */}

      {isMobile && <MobileTabBar biome={biome} />}

      {/* Deploy verification badge — proves which build is rendered. */}
      <div style={{
        position: 'fixed', right: 10, bottom: 10, zIndex: 9999,
        padding: '6px 10px', borderRadius: 8,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        border: `1px solid ${biome.glow}66`,
        color: biome.glow, fontSize: 10, fontWeight: 700, letterSpacing: 1,
        fontFamily: 'monospace', pointerEvents: 'none',
      }}>
        MAP v2 · CANDY · {new Date().toISOString().slice(0,10)}
      </div>
    </div>
  );
}
