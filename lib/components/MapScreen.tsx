'use client';

import React from 'react';
import type { Biome } from '@/lib/game/biomes';
import { levelConfig } from '@/lib/game/levelConfig';
import { ART, buildPathD, generateNodes } from '@/lib/components/MapArt';

export type Layout = 'mobile' | 'tablet' | 'desktop';

interface Props {
  biome: Biome;
  currentLevel: number;
  layout: Layout;
  onEnterLevel: (lvl: number) => void;
}

function romanize(n: number) {
  return ['','I','II','III','IV','V','VI','VII','VIII'][n] ?? String(n);
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
    }}/>
  );
}

function Stat({ icon, value, color, block: isBlock }: { icon: string; value: string; color: string; block?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 10px', borderRadius: 14,
      background: 'rgba(0,0,0,0.45)', border: `1px solid ${color}55`,
      fontSize: 13, fontWeight: 700, color: '#fff',
      width: isBlock ? '100%' : 'auto',
    }}>
      <span style={{ color }}>{icon}</span> {value}
    </div>
  );
}

function Pill({ label, value, biome, small }: { label: string; value: string | number; biome: Biome; small?: boolean }) {
  return (
    <div style={{
      padding: small ? '6px 10px' : '8px 12px', borderRadius: 12,
      background: 'rgba(0,0,0,0.4)', border: `1px solid ${biome.accent}44`,
      display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0,
    }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: biome.glow, opacity: 0.85 }}>{label}</div>
      <div style={{ fontSize: small ? 12 : 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  );
}

function NodeDot({ n, active, biome }: { n: { x: number; y: number; level: number }; active: boolean; biome: Biome }) {
  return (
    <g>
      <circle cx={n.x} cy={n.y} r={active ? 22 : 18}
        fill={active ? biome.accent : 'rgba(15,14,36,0.7)'}
        stroke={biome.glow} strokeWidth={active ? 3 : 1.6} opacity={active ? 1 : 0.85}/>
      {active && (
        <circle cx={n.x} cy={n.y} r={32} fill="none" stroke={biome.glow} strokeWidth="1.5" opacity="0.6">
          <animate attributeName="r" values="22;36;22" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite"/>
        </circle>
      )}
      <text x={n.x} y={n.y+4} textAnchor="middle" fontSize={active?13:11} fontWeight={active?800:600} fill={active?'#0a0a14':biome.glow}>{n.level}</text>
    </g>
  );
}

function FinishFlag({ x, y, biome }: { x: number; y: number; biome: Biome }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y+50} stroke={biome.glow} strokeWidth="2"/>
      <polygon points={`${x},${y} ${x+22},${y+6} ${x},${y+14}`} fill={biome.accent}/>
      <text x={x+32} y={y+12} fontSize="11" fontWeight="700" fill={biome.glow}>ACT {romanize(biome.act)} END</text>
    </g>
  );
}

function SideCards({ biome, level, layout, onEnterLevel }: { biome: Biome; level: number; layout: Layout; onEnterLevel: (l: number) => void }) {
  const cfg = levelConfig(level);
  return (
    <div style={{
      width: layout === 'desktop' ? 360 : 280, padding: 20,
      background: 'rgba(8,8,22,0.65)', backdropFilter: 'blur(12px)',
      borderLeft: `1px solid ${biome.accent}33`,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: biome.glow }}>ONGOING JOURNEY</div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.05 }}>
        Level {level}:<br/><span style={{ color: biome.glow }}>{cfg.title}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Pill label="DIFFICULTY" value={cfg.rarity} biome={biome}/>
        <Pill label="REWARD" value={`◆ ${cfg.reward}`} biome={biome}/>
        <Pill label="GOAL" value={`${cfg.goal} blocks`} biome={biome} small/>
        <Pill label="MOVES" value={cfg.moves} biome={biome} small/>
      </div>
      <button onClick={() => onEnterLevel(level)} style={{
        marginTop: 6, padding: '14px 20px', borderRadius: 14,
        background: `linear-gradient(135deg, ${biome.accent}, ${biome.glow})`,
        color: '#0a0a14', fontWeight: 900, fontSize: 16, border: 'none',
        boxShadow: `0 0 24px ${biome.accent}77`, cursor: 'pointer',
      }}>
        START EXPEDITION →
      </button>
      <div style={{ marginTop: 'auto', padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.4)', border: `1px solid ${biome.accent}33` }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, color: biome.glow, opacity: 0.8 }}>PRIZE POOL · ON-CHAIN</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>0 <span style={{ fontSize: 11, opacity: 0.7 }}>USDC</span></div>
      </div>
    </div>
  );
}

function BottomCard({ biome, level, onEnterLevel }: { biome: Biome; level: number; onEnterLevel: (l: number) => void }) {
  const cfg = levelConfig(level);
  return (
    <div style={{
      margin: 16, padding: 20, borderRadius: 22,
      background: 'rgba(8,8,22,0.78)', backdropFilter: 'blur(12px)',
      border: `1px solid ${biome.accent}55`,
      position: 'absolute', left: 0, right: 0, bottom: 80,
    }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: biome.glow }}>ONGOING JOURNEY</div>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, marginTop: 4 }}>
        Level {level}:<br/><span style={{ color: biome.glow }}>{cfg.title}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
        <Pill label="DIFFICULTY" value={cfg.rarity} biome={biome}/>
        <Pill label="REWARD" value={`◆ ${cfg.reward}`} biome={biome}/>
        <button onClick={() => onEnterLevel(level)} style={{
          marginLeft: 'auto', padding: '12px 22px', borderRadius: 999,
          background: `linear-gradient(135deg, ${biome.accent}, ${biome.glow})`,
          color: '#0a0a14', fontWeight: 900, fontSize: 14, border: 'none',
          boxShadow: `0 0 16px ${biome.accent}88`, cursor: 'pointer',
        }}>ENTER</button>
      </div>
    </div>
  );
}

function MobileTabBar({ biome }: { biome: Biome }) {
  const tabs = [{ i: '⌂', n: 'Home', active: true }, { i: '⚔', n: 'Heroes' }, { i: '★', n: 'Quests' }, { i: '◫', n: 'Shop' }];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      padding: '12px 18px 18px',
      background: 'rgba(8,8,22,0.92)', backdropFilter: 'blur(14px)',
      borderTop: `1px solid ${biome.accent}33`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      {tabs.map((t, i) => (
        <div key={i} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          padding: t.active ? '8px 18px' : '8px 12px', borderRadius: 18,
          background: t.active ? `linear-gradient(135deg, ${biome.accent}, ${biome.glow})` : 'transparent',
          color: t.active ? '#0a0a14' : '#cbd5e1',
          fontWeight: t.active ? 800 : 500,
          boxShadow: t.active ? `0 0 18px ${biome.accent}88` : 'none',
          cursor: 'pointer',
        }}>
          <span style={{ fontSize: 18 }}>{t.i}</span>
          <span style={{ fontSize: 11 }}>{t.n}</span>
        </div>
      ))}
    </div>
  );
}

function DesktopRail({ biome }: { biome: Biome }) {
  const items = [
    { i: '◉', n: 'Nexus' }, { i: '⚔', n: 'Quests' }, { i: '★', n: 'Expedition', active: true },
    { i: '⌂', n: 'Vault' }, { i: '⚙', n: 'Settings' },
  ];
  return (
    <div style={{
      width: 240, padding: 24, background: 'rgba(8,8,22,0.55)', backdropFilter: 'blur(16px)',
      borderRight: `1px solid ${biome.accent}33`, display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Avatar biome={biome} small/>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: biome.glow }}>COMMANDER</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Player</div>
        </div>
      </div>
      {items.map((it, i) => (
        <button key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
          background: it.active ? `${biome.accent}22` : 'transparent',
          border: it.active ? `1px solid ${biome.accent}55` : '1px solid transparent',
          color: it.active ? biome.glow : '#cbd5e1',
          fontSize: 14, fontWeight: it.active ? 700 : 500, textAlign: 'left', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 18, opacity: 0.9 }}>{it.i}</span>{it.n}
        </button>
      ))}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Stat icon="◆" value="0" color={biome.glow} block/>
        <Stat icon="⚡" value="50/100" color="#fde047" block/>
      </div>
    </div>
  );
}

function TopHeader({ biome, layout }: { biome: Biome; layout: Layout }) {
  const pad = layout === 'mobile' ? 16 : 24;
  return (
    <div style={{
      padding: `${pad}px ${pad}px 12px`,
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)',
      position: 'relative', zIndex: 2,
    }}>
      <Avatar biome={biome}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: biome.glow, opacity: 0.8 }}>
          ACT {romanize(biome.act)} · {biome.cohort}
        </div>
        <div style={{ fontSize: layout === 'mobile' ? 22 : 28, fontWeight: 800, lineHeight: 1.1, color: '#fff' }}>
          {biome.name}
        </div>
      </div>
      <Stat icon="◆" value="0" color={biome.glow}/>
      <Stat icon="⚡" value="50" color="#fde047"/>
    </div>
  );
}

export function MapScreen({ biome, currentLevel, layout, onEnterLevel }: Props) {
  const Art = ART[biome.id];
  const nodes = generateNodes(biome.range[0], 6, 400, 600);
  const activeIdx = Math.min(5, Math.max(0, currentLevel - biome.range[0]));
  const pathD = buildPathD(nodes);
  const isDesktop = layout === 'desktop';
  const isMobile = layout === 'mobile';

  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: biome.sky, color: '#fff',
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      display: 'flex', flexDirection: isDesktop ? 'row' : 'column',
      overflow: 'hidden', position: 'relative',
    }}>
      {isDesktop && <DesktopRail biome={biome}/>}
      {!isDesktop && <TopHeader biome={biome} layout={layout}/>}

      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: layout === 'tablet' ? 'row' : 'column' }}>
        {/* Scene */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: isMobile ? 400 : undefined }}>
          <svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {Art && <Art b={biome}/>}
            <rect width="400" height="600" fill={biome.fog}/>
            {/* path glow */}
            <path d={pathD} stroke={biome.path} strokeWidth="14" fill="none" opacity="0.25" strokeLinecap="round"/>
            <path d={pathD} stroke={biome.path} strokeWidth="6" fill="none" strokeDasharray="4 8" strokeLinecap="round"/>
            {nodes.map((n, i) => <NodeDot key={i} n={n} biome={biome} active={i === activeIdx}/>)}
            <FinishFlag x={nodes[nodes.length-1].x} y={nodes[nodes.length-1].y-40} biome={biome}/>
          </svg>
        </div>

        {/* Cards */}
        {layout !== 'mobile' ? (
          <SideCards biome={biome} level={currentLevel} layout={layout} onEnterLevel={onEnterLevel}/>
        ) : (
          <BottomCard biome={biome} level={currentLevel} onEnterLevel={onEnterLevel}/>
        )}
      </div>

      {isMobile && <MobileTabBar biome={biome}/>}
    </div>
  );
}
