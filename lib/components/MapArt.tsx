import React from 'react';
import type { Biome } from '@/lib/game/biomes';

/* ───────────────────────── shared building blocks ───────────────────────── */

const Spire = ({ x, y, w, h, fill, stroke, opacity = 1 }:
  { x: number; y: number; w: number; h: number; fill: string; stroke: string; opacity?: number }) => (
  <polygon
    points={`${x},${y + h} ${x + w / 2},${y} ${x + w},${y + h}`}
    fill={fill} stroke={stroke} strokeWidth="0.6" opacity={opacity}
  />
);

/** Bell-shaped mountain silhouette with shaded face. */
const Mountain = ({
  cx, baseY, peakH, baseW, light, shadow, opacity = 1,
}: {
  cx: number; baseY: number; peakH: number; baseW: number;
  light: string; shadow: string; opacity?: number;
}) => (
  <g opacity={opacity}>
    {/* lit face */}
    <polygon
      points={`${cx - baseW / 2},${baseY} ${cx},${baseY - peakH} ${cx + baseW / 6},${baseY}`}
      fill={light} />
    {/* shadowed face */}
    <polygon
      points={`${cx + baseW / 6},${baseY} ${cx},${baseY - peakH} ${cx + baseW / 2},${baseY}`}
      fill={shadow} />
    {/* snow cap */}
    <polygon
      points={`${cx - baseW * 0.18},${baseY - peakH * 0.78} ${cx},${baseY - peakH} ${cx + baseW * 0.22},${baseY - peakH * 0.78} ${cx + baseW * 0.08},${baseY - peakH * 0.66} ${cx},${baseY - peakH * 0.72} ${cx - baseW * 0.06},${baseY - peakH * 0.62}`}
      fill="rgba(255,255,255,0.92)" />
  </g>
);

/** Quick deterministic PRNG so each tile renders the same. */
const seeded = (seed: number) => () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

/** Per-biome turbulence noise filter id. Produces realistic ground texture. */
const NoiseFilter = ({ id, scale = 6, baseFreq = 0.9 }: { id: string; scale?: number; baseFreq?: number }) => (
  <filter id={id} x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency={baseFreq} numOctaves="3" seed="7" />
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
    <feComposite in="SourceGraphic" in2="floodCheck" operator="in" />
    <feDisplacementMap in="SourceGraphic" scale={scale} />
  </filter>
);

/* ───────────────────────── 8 biome art components ───────────────────────── */

export const CrystalArt = ({ b, seed = 101 }: { b: Biome; seed?: number }) => {
  const rng = seeded(seed);
  const crystals = Array.from({ length: 14 }, (_, i) => ({
    x: 12 + rng() * 376, baseY: 360 + rng() * 220,
    h: 60 + rng() * 200, w: 18 + rng() * 38,
    tone: i % 3,
  }));
  return (
    <g>
      <defs>
        <linearGradient id={`${b.id}-c1`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#a78bfa" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`${b.id}-c2`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0891b2" stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id={`${b.id}-c3`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#a21caf" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id={`${b.id}-glow`} cx="50%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* atmospheric backdrop */}
      <rect width="400" height="600" fill={`url(#${b.id}-glow)`} />
      {/* far mountain range — deep purple, hazy */}
      <Mountain cx={80}  baseY={300} peakH={200} baseW={240} light="#3b2563" shadow="#1f1239" opacity={0.62} />
      <Mountain cx={220} baseY={300} peakH={250} baseW={260} light="#4c2d80" shadow="#28184f" opacity={0.7} />
      <Mountain cx={340} baseY={300} peakH={220} baseW={240} light="#3b2563" shadow="#1f1239" opacity={0.62} />
      {/* mid mountain range */}
      <Mountain cx={120} baseY={420} peakH={160} baseW={220} light="#5b3d9c" shadow="#2a1c5e" />
      <Mountain cx={300} baseY={420} peakH={180} baseW={240} light="#5b3d9c" shadow="#2a1c5e" />
      {/* cavern arch */}
      <path d="M 0 380 Q 100 240, 200 260 Q 300 240, 400 380 L 400 600 L 0 600 Z"
        fill={b.rock} opacity="0.92" />
      <path d="M 40 360 Q 200 220, 360 360 L 360 460 L 40 460 Z"
        fill="rgba(0,0,0,0.55)" />
      {/* foreground crystal cluster — many sizes, deterministic placement */}
      {crystals.map((c, i) => {
        const grad = c.tone === 0 ? `url(#${b.id}-c1)`
                   : c.tone === 1 ? `url(#${b.id}-c2)`
                                  : `url(#${b.id}-c3)`;
        const stroke = c.tone === 0 ? '#c4b5fd'
                     : c.tone === 1 ? '#67e8f9' : '#f0abfc';
        return (
          <g key={i}>
            {/* shadow on ground */}
            <ellipse cx={c.x + c.w / 2 + 4} cy={c.baseY + 4}
              rx={c.w * 0.55} ry={c.w * 0.16} fill="#000" opacity="0.5" />
            <Spire x={c.x} y={c.baseY - c.h} w={c.w} h={c.h}
              fill={grad} stroke={stroke} />
            {/* specular highlight on crystal */}
            <polygon
              points={`${c.x + c.w * 0.18},${c.baseY - c.h * 0.1} ${c.x + c.w * 0.4},${c.baseY - c.h * 0.85} ${c.x + c.w * 0.32},${c.baseY - c.h * 0.18}`}
              fill="#fff" opacity="0.5" />
          </g>
        );
      })}
      {/* glowing dust motes */}
      {Array.from({ length: 60 }).map((_, i) => (
        <circle key={i} cx={(i * 37 + 7) % 400} cy={(i * 53 + 17) % 600}
          r={0.6 + (i % 3) * 0.5}
          fill="#e0f2fe" opacity={0.25 + ((i * 7) % 5) / 14} />
      ))}
    </g>
  );
};

export const FrostArt = ({ b, seed = 202 }: { b: Biome; seed?: number }) => {
  const rng = seeded(seed);
  const pines = Array.from({ length: 18 }, (_, i) => ({
    x: -10 + i * 24 + rng() * 8,
    y: 470 + rng() * 60,
    s: 0.8 + rng() * 0.6,
  }));
  return (
    <g>
      <defs>
        <linearGradient id={`${b.id}-aurora`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5eead4" stopOpacity="0" />
          <stop offset="40%" stopColor="#5eead4" stopOpacity="0.65" />
          <stop offset="60%" stopColor="#a78bfa" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${b.id}-ice`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`${b.id}-snow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* aurora ribbons */}
      <path d="M -20 80 Q 100 30, 220 100 Q 320 150, 420 60 L 420 240 L -20 240 Z"
        fill={`url(#${b.id}-aurora)`} opacity="0.85" />
      <path d="M -20 130 Q 120 90, 260 140 Q 360 170, 420 130 L 420 220 L -20 220 Z"
        fill={`url(#${b.id}-aurora)`} opacity="0.55" />
      {/* distant peaks */}
      <Mountain cx={60}  baseY={420} peakH={260} baseW={220} light="#1e3a5f" shadow="#0c1a2f" opacity={0.85} />
      <Mountain cx={200} baseY={420} peakH={320} baseW={280} light="#2a5b85" shadow="#102640" opacity={0.92} />
      <Mountain cx={340} baseY={420} peakH={290} baseW={240} light="#1e3a5f" shadow="#0c1a2f" opacity={0.88} />
      {/* mid ridge */}
      <polygon points="-20,460 70,340 150,420 220,320 300,420 360,340 420,460"
        fill="#3a6f95" opacity="0.85" />
      {/* snow plain */}
      <path d="M 0 470 L 400 470 L 400 600 L 0 600 Z"
        fill={`url(#${b.id}-snow)`} />
      <path d="M 0 510 Q 200 488, 400 514 L 400 600 L 0 600 Z"
        fill="#e0f2fe" opacity="0.9" />
      {/* ice shards on path */}
      {Array.from({ length: 14 }).map((_, i) => (
        <polygon key={i}
          points={`${20 + i * 28},${478 + (i % 3) * 6} ${30 + i * 28},${462 + (i % 3) * 6} ${40 + i * 28},${478 + (i % 3) * 6}`}
          fill={`url(#${b.id}-ice)`} opacity="0.95" stroke="#bae6fd" strokeWidth="0.5" />
      ))}
      {/* pine forest silhouette */}
      {pines.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
          <polygon points="0,0 -10,24 10,24" fill="#0a1f1a" />
          <polygon points="0,-10 -12,18 12,18" fill="#0c2a22" />
          <polygon points="0,-22 -14,12 14,12" fill="#0e3127" />
          <rect x="-2" y="22" width="4" height="6" fill="#3b2a1f" />
        </g>
      ))}
      {/* falling snow */}
      {Array.from({ length: 30 }).map((_, i) => (
        <circle key={i} cx={(i * 41 + 7) % 400} cy={(i * 23) % 480}
          r={1 + (i % 3) * 0.4} fill="#fff" opacity={0.55 + (i % 4) / 10} />
      ))}
    </g>
  );
};

export const EmberArt = ({ b, seed = 303 }: { b: Biome; seed?: number }) => {
  const rng = seeded(seed);
  const embers = Array.from({ length: 60 }, () => ({
    x: rng() * 400, y: 80 + rng() * 380, r: 0.8 + rng() * 1.4,
  }));
  return (
    <g>
      <defs>
        <radialGradient id={`${b.id}-lava`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#7c2d12" />
        </radialGradient>
        <linearGradient id={`${b.id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c2d12" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1c0a08" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* hellish sky haze */}
      <rect width="400" height="400" fill={`url(#${b.id}-sky)`} />
      {/* distant smoking volcano */}
      <Mountain cx={120} baseY={400} peakH={280} baseW={260} light="#3d1f15" shadow="#1c0a08" opacity={0.88} />
      <Mountain cx={290} baseY={400} peakH={340} baseW={300} light="#4a2418" shadow="#22100b" opacity={0.95} />
      {/* lava-glow crater rim on main volcano */}
      <ellipse cx={290} cy={75} rx={24} ry={6} fill="#fbbf24" opacity="0.9" />
      <path d="M 290 70 Q 282 50, 285 30 Q 290 8, 286 -6"
        stroke="#1c0a08" strokeWidth="20" fill="none" opacity="0.85" />
      <path d="M 290 70 Q 282 50, 285 30 Q 290 8, 286 -6"
        stroke="#fbbf24" strokeWidth="3" fill="none" opacity="0.45" />
      {/* charred foreground ridge */}
      <polygon points="-20,490 60,360 140,470 220,380 300,460 380,400 420,500 420,600 -20,600"
        fill="#1c0a08" />
      <polygon points="-20,500 80,420 170,480 250,440 340,490 400,460 420,520 420,600 -20,600"
        fill="#3d1f15" opacity="0.95" />
      {/* lava cracks across ground */}
      <path d="M 30 530 Q 80 510, 130 540 Q 180 565, 230 530 Q 280 500, 330 540 Q 380 565, 420 540"
        stroke="#fb923c" strokeWidth="4" fill="none" opacity="0.95" />
      <path d="M 0 560 Q 70 540, 140 562 Q 210 580, 280 560 Q 340 540, 400 562"
        stroke="#fcd34d" strokeWidth="2.5" fill="none" opacity="0.9" />
      {/* main lava pool */}
      <ellipse cx="200" cy="575" rx="200" ry="22" fill={`url(#${b.id}-lava)`} opacity="0.95" />
      <ellipse cx="200" cy="575" rx="120" ry="10" fill="#fcd34d" opacity="0.85" />
      {/* embers floating */}
      {embers.map((e, i) => (
        <circle key={i} cx={e.x} cy={e.y} r={e.r}
          fill={i % 3 === 0 ? '#fbbf24' : '#fb923c'}
          opacity={0.55 + ((i * 7) % 5) / 14} />
      ))}
    </g>
  );
};

export const VerdantArt = ({ b, seed = 404 }: { b: Biome; seed?: number }) => {
  const rng = seeded(seed);
  const mushrooms = Array.from({ length: 10 }, () => ({
    x: 20 + rng() * 360, y: 470 + rng() * 70, s: 12 + rng() * 16,
  }));
  const fireflies = Array.from({ length: 22 }, () => ({
    x: rng() * 400, y: 100 + rng() * 380, a: 0.5 + rng() * 0.5,
  }));
  return (
    <g>
      <defs>
        <radialGradient id={`${b.id}-glow`} cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${b.id}-leaf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#14352a" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`${b.id}-trunk`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b2218" />
          <stop offset="100%" stopColor="#1f140d" />
        </linearGradient>
      </defs>
      {/* upper canopy */}
      <ellipse cx="60"  cy="170" rx="140" ry="100" fill={`url(#${b.id}-leaf)`} />
      <ellipse cx="340" cy="160" rx="160" ry="110" fill={`url(#${b.id}-leaf)`} />
      <ellipse cx="200" cy="100" rx="120" ry="70" fill="#1f5236" opacity="0.95" />
      {/* tree trunks */}
      {[[80, 280], [340, 270], [200, 320]].map((t, i) => (
        <g key={i}>
          <rect x={t[0] - 12} y={t[1]} width="24" height={150 - i * 10}
            fill={`url(#${b.id}-trunk)`} />
          <ellipse cx={t[0]} cy={t[1] + (150 - i * 10)}
            rx={20} ry={6} fill="#000" opacity="0.5" />
        </g>
      ))}
      {/* leaf clusters on trunks */}
      <ellipse cx="80"  cy="280" rx="56" ry="32" fill="#1f5236" opacity="0.95" />
      <ellipse cx="340" cy="270" rx="60" ry="36" fill="#1f5236" opacity="0.95" />
      <ellipse cx="200" cy="320" rx="50" ry="28" fill="#1f5236" opacity="0.9" />
      {/* moss ground */}
      <path d="M 0 470 Q 200 448, 400 478 L 400 600 L 0 600 Z" fill="#166534" />
      <path d="M 0 510 Q 200 490, 400 516 L 400 600 L 0 600 Z" fill="#15803d" opacity="0.88" />
      <ellipse cx="200" cy="540" rx="220" ry="48" fill={`url(#${b.id}-glow)`} />
      {/* mushrooms */}
      {mushrooms.map((m, i) => (
        <g key={i}>
          <rect x={m.x - 4} y={m.y} width="8" height={m.s} rx="3" fill="#f5f5f4" />
          <ellipse cx={m.x} cy={m.y} rx={m.s} ry={m.s * 0.6} fill="#dc2626" />
          <ellipse cx={m.x} cy={m.y} rx={m.s} ry={m.s * 0.4} fill="#b91c1c" opacity="0.5" />
          <circle cx={m.x - m.s * 0.32} cy={m.y - m.s * 0.18} r={m.s * 0.16} fill="#fef3c7" />
          <circle cx={m.x + m.s * 0.32} cy={m.y - m.s * 0.06} r={m.s * 0.10} fill="#fef3c7" />
        </g>
      ))}
      {/* hanging vines */}
      {[60, 140, 220, 300, 380].map((vx, i) => (
        <path key={i} d={`M ${vx} 70 Q ${vx + 8} 130, ${vx - 4} 190`}
          stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.7" />
      ))}
      {/* fireflies */}
      {fireflies.map((f, i) => (
        <g key={i}>
          <circle cx={f.x} cy={f.y} r={4} fill="#fef08a" opacity={f.a * 0.3} />
          <circle cx={f.x} cy={f.y} r={1.5} fill="#fff" opacity={f.a} />
        </g>
      ))}
    </g>
  );
};

export const TideArt = ({ b, seed = 505 }: { b: Biome; seed?: number }) => {
  const rng = seeded(seed);
  const corals = Array.from({ length: 9 }, () => ({
    x: 20 + rng() * 360, y: 280 + rng() * 200, h: 100 + rng() * 180,
  }));
  const bubbles = Array.from({ length: 36 }, () => ({
    x: rng() * 400, y: 60 + rng() * 540, r: 1.5 + rng() * 4,
  }));
  return (
    <g>
      <defs>
        <radialGradient id={`${b.id}-deep`} cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0c1f3a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${b.id}-coral`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#9d174d" />
        </radialGradient>
        <linearGradient id={`${b.id}-kelp`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {/* god rays from above */}
      <path d="M 40 0 L 120 600 L 0 600 Z"   fill={`url(#${b.id}-deep)`} opacity="0.55" />
      <path d="M 180 0 L 240 600 L 140 600 Z" fill={`url(#${b.id}-deep)`} opacity="0.65" />
      <path d="M 320 0 L 400 600 L 280 600 Z" fill={`url(#${b.id}-deep)`} opacity="0.55" />
      {/* kelp forest swaying */}
      {[40, 100, 160, 240, 320, 380].map((kx, i) => (
        <path key={i}
          d={`M ${kx} 600 Q ${kx + 16} 460, ${kx - 8} 320 Q ${kx + 4} 180, ${kx + 12} 80`}
          stroke={`url(#${b.id}-kelp)`} strokeWidth={6 + (i % 2) * 2}
          fill="none" opacity="0.85" />
      ))}
      {/* coral towers */}
      {corals.map((c, i) => (
        <g key={i}>
          <rect x={c.x - 12} y={c.y} width="24" height={c.h} rx="8" fill="#0c2540" />
          <circle cx={c.x} cy={c.y} r="18" fill={`url(#${b.id}-coral)`} />
          <circle cx={c.x - 12} cy={c.y + 10} r="10" fill="#ec4899" opacity="0.9" />
          <circle cx={c.x + 11} cy={c.y + 6} r="11" fill="#a5f3fc" opacity="0.78" />
          {/* polyp dots */}
          {[0, 1, 2, 3].map((j) => (
            <circle key={j} cx={c.x + ((j * 17) % 24) - 10}
              cy={c.y + 20 + j * 18} r="2" fill="#fbcfe8" opacity="0.85" />
          ))}
        </g>
      ))}
      {/* ocean floor */}
      <path d="M 0 540 Q 200 520, 400 545 L 400 600 L 0 600 Z" fill="#0a2540" />
      <path d="M 0 560 Q 200 545, 400 564 L 400 600 L 0 600 Z" fill="#102f55" opacity="0.95" />
      {/* bubbles */}
      {bubbles.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.r}
          fill="#a5f3fc" opacity={0.45 + ((i * 5) % 4) / 14}
          stroke="#67e8f9" strokeWidth="0.5" />
      ))}
    </g>
  );
};

export const DunesArt = ({ b, seed = 606 }: { b: Biome; seed?: number }) => {
  const rng = seeded(seed);
  const motes = Array.from({ length: 70 }, () => ({
    x: rng() * 400, y: rng() * 600, r: 0.6 + rng() * 1.2,
  }));
  return (
    <g>
      <defs>
        <radialGradient id={`${b.id}-sun`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${b.id}-dune-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`${b.id}-dune-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      {/* haze sun */}
      <circle cx="320" cy="160" r="110" fill={`url(#${b.id}-sun)`} />
      <circle cx="320" cy="160" r="50" fill="#fbbf24" opacity="0.92" />
      <circle cx="320" cy="160" r="38" fill="#fde68a" />
      {/* layered dunes — atmospheric perspective */}
      <path d="M -20 360 Q 80 320, 180 350 Q 280 380, 420 330 L 420 480 L -20 480 Z"
        fill="#9a3412" opacity="0.6" />
      <path d="M -20 400 Q 100 360, 220 390 Q 320 420, 420 370 L 420 600 L -20 600 Z"
        fill={`url(#${b.id}-dune-a)`} />
      <path d="M -20 460 Q 80 420, 200 450 Q 300 480, 420 430 L 420 600 L -20 600 Z"
        fill={`url(#${b.id}-dune-b)`} />
      <path d="M -20 520 Q 100 500, 220 515 Q 340 530, 420 510 L 420 600 L -20 600 Z"
        fill="#f59e0b" opacity="0.92" />
      {/* obelisks + pyramid */}
      <polygon points="40,540 60,440 80,540" fill="#3f2613" />
      <polygon points="60,540 60,440 80,540" fill="#1f1208" opacity="0.85" />
      <polygon points="120,560 180,400 240,560" fill="#7c2d12" />
      <polygon points="180,560 180,400 240,560" fill="#451a07" opacity="0.85" />
      <polygon points="340,540 356,420 372,540" fill="#3f2613" />
      <polygon points="356,540 356,420 372,540" fill="#1f1208" opacity="0.85" />
      {/* lone caravan */}
      <g transform="translate(110 510)">
        <ellipse cx="0" cy="2" rx="14" ry="2" fill="#000" opacity="0.55" />
        <path d="M -10 -2 Q -8 -16, 0 -16 Q 8 -16, 10 -2 L 10 0 L -10 0 Z" fill="#3f2613" />
        <path d="M -4 -2 Q -4 -10, 0 -10 Q 4 -10, 4 -2" fill="#3f2613" />
        <line x1="-7" y1="0" x2="-7" y2="6" stroke="#3f2613" strokeWidth="1.5" />
        <line x1="7"  y1="0" x2="7"  y2="6" stroke="#3f2613" strokeWidth="1.5" />
      </g>
      {/* dust + wind motes */}
      {motes.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={m.r}
          fill="#fef3c7" opacity={0.3 + ((i * 11) % 4) / 12} />
      ))}
    </g>
  );
};

export const VoidArt = ({ b, seed = 707 }: { b: Biome; seed?: number }) => {
  const rng = seeded(seed);
  const stars = Array.from({ length: 140 }, () => ({
    x: rng() * 400, y: rng() * 600, r: 0.4 + rng() * 1.3,
  }));
  return (
    <g>
      <defs>
        <radialGradient id={`${b.id}-rift`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#fff" stopOpacity="0.95" />
          <stop offset="20%" stopColor="#f0abfc" />
          <stop offset="55%" stopColor="#a855f7" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${b.id}-pillar`} cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0e0524" />
        </radialGradient>
      </defs>
      {/* dense starfield */}
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r}
          fill="#fff" opacity={0.35 + ((i * 13) % 5) / 12} />
      ))}
      {/* shooting stars */}
      <line x1="320" y1="40"  x2="380" y2="10"  stroke="#fff" strokeWidth="1.5" opacity="0.7" />
      <line x1="60"  y1="180" x2="100" y2="160" stroke="#fff" strokeWidth="1" opacity="0.55" />
      {/* dimensional rift */}
      <ellipse cx="200" cy="220" rx="200" ry="80" fill={`url(#${b.id}-rift)`} />
      <ellipse cx="200" cy="220" rx="140" ry="42" fill="#f0abfc" opacity="0.55" />
      <ellipse cx="200" cy="220" rx="70"  ry="18" fill="#fff" opacity="0.85" />
      {/* obsidian pillars at different depths */}
      <polygon points="14,560 32,200 50,560" fill={`url(#${b.id}-pillar)`} />
      <polygon points="32,560 32,200 50,560" fill="#08031a" opacity="0.85" />
      <polygon points="350,540 368,180 386,540" fill={`url(#${b.id}-pillar)`} />
      <polygon points="368,540 368,180 386,540" fill="#08031a" opacity="0.85" />
      <polygon points="100,560 116,340 132,560" fill="#1a0f3a" opacity="0.92" />
      <polygon points="270,560 286,320 302,560" fill="#1a0f3a" opacity="0.92" />
      {/* floating runic glyphs */}
      {[[90, 320], [320, 280], [200, 370], [60, 420], [340, 400]].map((p, i) => (
        <g key={i} transform={`translate(${p[0]} ${p[1]})`}>
          <rect x="-9" y="-9" width="18" height="18" fill="none"
            stroke="#c084fc" strokeWidth="1.2" transform="rotate(45)" />
          <rect x="-5" y="-5" width="10" height="10" fill="none"
            stroke="#f0abfc" strokeWidth="0.8" transform="rotate(45)" />
          <circle r="2.5" fill="#f0abfc" />
        </g>
      ))}
    </g>
  );
};

export const ApexArt = ({ b, seed = 808 }: { b: Biome; seed?: number }) => {
  const rng = seeded(seed);
  const motes = Array.from({ length: 50 }, () => ({
    x: rng() * 400, y: rng() * 600, r: 0.8 + rng() * 1.6,
  }));
  return (
    <g>
      <defs>
        <radialGradient id={`${b.id}-halo`} cx="50%" cy="38%" r="55%">
          <stop offset="0%"  stopColor="#fff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#fbbf24" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${b.id}-obelisk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7e22ce" />
          <stop offset="100%" stopColor="#1a0524" />
        </linearGradient>
      </defs>
      {/* radial divine rays */}
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 36;
        const x2 = 200 + Math.cos(a) * 480;
        const y2 = 220 + Math.sin(a) * 480;
        return (
          <line key={i} x1="200" y1="220" x2={x2} y2={y2}
            stroke="#fbbf24" strokeWidth="1" opacity="0.16" />
        );
      })}
      {/* great halo */}
      <circle cx="200" cy="220" r="220" fill={`url(#${b.id}-halo)`} />
      <circle cx="200" cy="220" r="84"  fill="none" stroke="#fef3c7" strokeWidth="3" opacity="0.85" />
      <circle cx="200" cy="220" r="56"  fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.7" />
      <circle cx="200" cy="220" r="34"  fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.55" />
      {/* obelisk colonnade */}
      <polygon points="44,540 60,180 76,540"  fill={`url(#${b.id}-obelisk)`} stroke="#fbbf24" strokeWidth="0.8" />
      <polygon points="324,540 340,180 356,540" fill={`url(#${b.id}-obelisk)`} stroke="#fbbf24" strokeWidth="0.8" />
      <polygon points="120,560 132,260 144,560" fill="#2a0e3a" opacity="0.92" stroke="#fbbf24" strokeWidth="0.5" />
      <polygon points="256,560 268,260 280,560" fill="#2a0e3a" opacity="0.92" stroke="#fbbf24" strokeWidth="0.5" />
      {/* central altar */}
      <rect x="160" y="450" width="80" height="150" fill="#1a0524" stroke="#fbbf24" strokeWidth="1.2" />
      <rect x="150" y="438" width="100" height="16" fill="#fbbf24" opacity="0.92" />
      <circle cx="200" cy="430" r="14" fill="#fff" />
      <circle cx="200" cy="430" r="6" fill="#fbbf24" />
      {/* ember rain */}
      {motes.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={m.r}
          fill={i % 3 === 0 ? '#fff' : '#fef3c7'}
          opacity={0.4 + ((i * 7) % 5) / 12} />
      ))}
    </g>
  );
};

export const ART: Record<string, React.ComponentType<{ b: Biome; seed?: number }>> = {
  crystal:  CrystalArt,
  frost:    FrostArt,
  ember:    EmberArt,
  verdant:  VerdantArt,
  tidewave: TideArt,
  dunes:    DunesArt,
  voidline: VoidArt,
  apex:     ApexArt,
};

/* ───────────────────────── path + node generators ──────────────────────── */

export function buildPathD(nodes: { x: number; y: number }[]): string {
  if (!nodes.length) return '';
  let d = `M ${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], c = nodes[i];
    const cy = (a.y + c.y) / 2;
    d += ` C ${a.x} ${cy}, ${c.x} ${cy}, ${c.x} ${c.y}`;
  }
  return d;
}

export function generateNodes(startLevel: number, endLevel: number, count: number, w = 400, h = 600) {
  const out: { x: number; y: number; level: number }[] = [];
  const margin = 80, usable = h - margin * 2;
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count - 1, 1);
    const y = margin + t * usable;
    const x = w / 2 + Math.sin(t * Math.PI * 2.2) * (w * 0.28);
    const level = Math.round(startLevel + t * (endLevel - startLevel));
    out.push({ x, y, level });
  }
  return out;
}

/**
 * Long-form node generator. Candy-Crush orientation:
 *   - level startLevel (i=0) sits at the BOTTOM of the SVG
 *   - level endLevel   (i=count-1) sits at the TOP
 * Player scrolls UPWARD to climb levels.
 *
 * Path winds in serpentine S-curves like a real mountain switchback road —
 * tight enough to feel dense (good for thousands of levels per act) and varied
 * enough to never look mechanical.
 */
export function generateLongNodes(
  startLevel: number,
  endLevel: number,
  spacingY: number,
  w: number,
  topMargin: number,
  svgH: number,
) {
  const count = endLevel - startLevel + 1;
  const out: { x: number; y: number; level: number }[] = new Array(count);
  // Switchback rate: one full S-curve every ~8 levels. Visually busier =
  // feels like a winding mountain road instead of a lazy meander.
  const wave = 8;
  const ampl = w * 0.34;
  const cx = w / 2;
  for (let i = 0; i < count; i++) {
    const t = i / wave;
    // Layer three sines for organic, never-repeating serpentine
    const x = cx
      + Math.sin(t * Math.PI) * ampl
      + Math.sin(t * Math.PI * 0.43 + 1.3) * (ampl * 0.22)
      + Math.sin(t * Math.PI * 0.17 + 2.1) * (ampl * 0.10);
    const y = svgH - topMargin - i * spacingY;
    out[i] = { x, y, level: startLevel + i };
  }
  return out;
}
