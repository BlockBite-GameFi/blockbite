'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Biome } from '@/lib/game/biomes';
import { levelConfig } from '@/lib/game/levelConfig';
import { getLevelTier } from '@/lib/game/constants';
import { ART, buildPathD, generateNodes } from '@/lib/components/MapArt';

export type Layout = 'mobile' | 'tablet' | 'desktop';

interface Props {
  biome: Biome;
  currentLevel: number;
  layout: Layout;
  onEnterLevel: (lvl: number) => void;
  walletAddress?: string;
}

const NODE_COUNT = 20;
const SVG_W      = 400;
const SVG_H      = NODE_COUNT * 150;
const SVG_MARGIN = 80;

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
  n, active, biome, unlocked, onClick, depth,
}: {
  n: { x: number; y: number; level: number };
  active: boolean;
  biome: Biome;
  unlocked: boolean;
  onClick: () => void;
  depth: number;
}) {
  // Near nodes (bottom) are larger/brighter; far nodes (top) are smaller/dimmer — strong 3D effect
  const baseR = Math.round(10 + depth * 14); // 10 (far top) → 24 (near bottom)
  const r = active ? baseR + 6 : baseR;
  const fz = Math.round(7 + depth * 8);      // 7 (far) → 15 (near)
  const nodeOpacity = unlocked ? (0.35 + depth * 0.65) : 0.22; // 0.35 far → 1.0 near

  return (
    <g
      onClick={unlocked ? onClick : undefined}
      style={{ cursor: unlocked ? 'pointer' : 'default' }}
      role={unlocked ? 'button' : undefined}
      aria-label={unlocked ? `Level ${n.level}` : undefined}
    >
      <circle cx={n.x} cy={n.y} r={r + 14} fill="transparent" />
      <ellipse cx={n.x} cy={n.y + r * 0.7} rx={r * 0.8} ry={r * 0.22}
        fill="#000" opacity={depth * 0.35} />

      {active && (
        <>
          <circle cx={n.x} cy={n.y} r={r + 10} fill="none"
            stroke={biome.glow} strokeWidth="1.5" opacity="0.5">
            <animate attributeName="r" values={`${r};${r + 16};${r}`} dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={n.x} cy={n.y} r={r + 4} fill="none"
            stroke={biome.glow} strokeWidth="2" opacity="0.7" />
        </>
      )}

      <circle
        cx={n.x} cy={n.y} r={r}
        fill={active ? biome.accent : unlocked ? `${biome.accent}bb` : 'rgba(10,10,20,0.5)'}
        stroke={active ? biome.glow : unlocked ? biome.glow : '#334155'}
        strokeWidth={active ? 3.5 : unlocked ? 2.5 : 1.5}
        opacity={nodeOpacity}
      />

      {unlocked && (
        <ellipse
          cx={n.x - r * 0.28} cy={n.y - r * 0.3}
          rx={r * 0.28} ry={r * 0.16}
          fill="#fff" opacity={0.25 + depth * 0.3}
        />
      )}

      <text
        x={n.x} y={n.y + fz * 0.38}
        textAnchor="middle" fontSize={fz}
        fontWeight={900}
        fill={unlocked ? '#fff' : '#475569'}
        stroke={unlocked ? 'rgba(0,0,0,0.45)' : 'none'}
        strokeWidth="1.2"
        paintOrder="stroke"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {unlocked ? n.level : '-'}
      </text>

      {!active && unlocked && (
        <g opacity="0.92">
          {[-1, 0, 1].map(si => (
            <StarShape
              key={si}
              cx={n.x + si * r * 0.58}
              cy={n.y + r + 9}
              r={Math.max(3.2, r * 0.22)}
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
      width: 240, padding: 24,
      background: 'rgba(8,8,22,0.55)', backdropFilter: 'blur(16px)',
      borderRight: `1px solid ${biome.accent}33`,
      display: 'flex', flexDirection: 'column', gap: 6,
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

  const nodes = generateNodes(biome.range[0], biome.range[1], NODE_COUNT, SVG_W, SVG_H);
  const pathD = buildPathD(nodes);

  let activeIdx = 0;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].level <= currentLevel) activeIdx = i;
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const run = () => {
      const svg = el.querySelector('svg');
      if (!svg) return;
      const svgPxH = svg.getBoundingClientRect().height;
      if (!svgPxH) return;
      const scale  = svgPxH / SVG_H;
      const nodeY  = nodes[activeIdx].y * scale;
      el.scrollTop = Math.max(0, nodeY - el.clientHeight * 0.42);
    };
    run();
    const t = setTimeout(run, 120);
    return () => clearTimeout(t);
  }, [currentLevel, activeIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDesktop = layout === 'desktop';
  const isTablet  = layout === 'tablet';
  const isMobile  = layout === 'mobile';
  const displayName = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : player.username;

  return (
    <div style={{
      width: '100%', height: '100vh',
      background: biome.sky, color: '#fff',
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      display: 'flex',
      flexDirection: isDesktop ? 'row' : 'column',
      overflow: 'hidden',
    }}>
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

      <div style={{
        flex: 1, display: 'flex',
        flexDirection: isTablet ? 'row' : 'column',
        overflow: 'hidden',
      }}>
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
            position: 'relative',
          }}
        >
          {/* margin:0 auto centers without display:flex (flex would stretch height and break scroll) */}
          <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              preserveAspectRatio="xMidYMin meet"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <defs>
                <linearGradient id="bb-path-depth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={biome.path} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={biome.path} stopOpacity="1" />
                </linearGradient>
                <linearGradient id="bb-fog-depth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#000" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#000" stopOpacity="0" />
                </linearGradient>
              </defs>

              {Art && <Art b={biome} />}
              <rect width={SVG_W} height={SVG_H} fill={biome.fog} />
              <rect width={SVG_W} height={SVG_H} fill="url(#bb-fog-depth)" />

              <text
                x={SVG_W / 2} y={40}
                textAnchor="middle" fontSize="11" fontWeight="700"
                fill={biome.glow} opacity="0.6" letterSpacing="2"
              >
                ACT {romanize(biome.act)} · LVL {biome.range[0]}-{biome.range[1]}
              </text>

              {/* Candy path — shadow base */}
              <path d={pathD} stroke="rgba(0,0,0,0.42)" strokeWidth="20" fill="none"
                strokeLinecap="round" />
              {/* Candy path — solid body */}
              <path d={pathD} stroke={biome.path} strokeWidth="14" fill="none"
                strokeLinecap="round" opacity="0.85" />
              {/* Candy stripe — white highlight dashes */}
              <path d={pathD} stroke="rgba(255,255,255,0.38)" strokeWidth="5" fill="none"
                strokeDasharray="9 13" strokeLinecap="round" />
              {/* Candy stripe — dark counter-dashes for depth */}
              <path d={pathD} stroke="rgba(0,0,0,0.18)" strokeWidth="4" fill="none"
                strokeDasharray="9 13" strokeDashoffset="11" strokeLinecap="round" />
              {/* Depth fog — fades top nodes into distance */}
              <path d={pathD} stroke="url(#bb-fog-depth)" strokeWidth="16" fill="none"
                strokeLinecap="round" />

              {nodes.map((n, i) => {
                if (i === 0) return null;
                const prev = nodes[i - 1];
                const midX = (prev.x + n.x) / 2;
                const midY = (prev.y + n.y) / 2;
                const d = (midY - SVG_MARGIN) / (SVG_H - SVG_MARGIN * 2);
                return (
                  <circle key={`mid-${i}`} cx={midX} cy={midY} r={2 + d * 2}
                    fill={biome.path} opacity={0.2 + d * 0.5} />
                );
              })}

              {nodes.map((n, i) => {
                const depth = Math.max(0, Math.min(1,
                  (n.y - SVG_MARGIN) / (SVG_H - SVG_MARGIN * 2)
                ));
                return (
                  <NodeDot
                    key={i}
                    n={n}
                    biome={biome}
                    active={i === activeIdx}
                    unlocked={n.level <= currentLevel}
                    onClick={() => onEnterLevel(n.level)}
                    depth={depth}
                  />
                );
              })}

              <FinishFlag
                x={nodes[nodes.length - 1].x}
                y={nodes[nodes.length - 1].y - 50}
                biome={biome}
              />

              <text
                x={SVG_W / 2} y={SVG_H - 20}
                textAnchor="middle" fontSize="10"
                fill={biome.glow} opacity="0.4"
              >
                LEVEL {biome.range[0]} · ORIGIN
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

      {isMobile && <MobileTabBar biome={biome} />}
    </div>
  );
}
