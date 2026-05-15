import React from 'react';
import type { Biome } from '@/lib/game/biomes';

// ── Shared helper ──────────────────────────────────────────────────
const Spire = ({ x, y, w, h, fill, stroke, opacity = 1 }: { x:number;y:number;w:number;h:number;fill:string;stroke:string;opacity?:number }) => (
  <polygon points={`${x},${y+h} ${x+w/2},${y} ${x+w},${y+h}`} fill={fill} stroke={stroke} strokeWidth="0.6" opacity={opacity}/>
);

// ── 8 biome art components ─────────────────────────────────────────
export const CrystalArt = ({ b }: { b: Biome }) => (
  <g>
    <defs>
      <linearGradient id={`${b.id}-c1`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.9"/>
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.7"/>
      </linearGradient>
      <linearGradient id={`${b.id}-c2`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.85"/>
        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.6"/>
      </linearGradient>
    </defs>
    <path d="M 0 200 Q 100 80, 200 100 Q 300 80, 400 200 L 400 600 L 0 600 Z" fill={b.rock} opacity="0.85"/>
    <path d="M 50 180 Q 200 60, 350 180 L 350 280 L 50 280 Z" fill="rgba(0,0,0,0.4)"/>
    {[[10,380,50,220],[42,360,38,240],[70,400,30,200],[-10,420,40,180]].map((p,i)=><Spire key={`l${i}`} x={p[0]} y={p[1]} w={p[2]} h={p[3]} fill={`url(#${b.id}-c1)`} stroke="#c4b5fd"/>)}
    {[[330,360,60,240],[310,400,30,200],[360,380,40,220],[380,420,30,180]].map((p,i)=><Spire key={`r${i}`} x={p[0]} y={p[1]} w={p[2]} h={p[3]} fill={`url(#${b.id}-c2)`} stroke="#67e8f9"/>)}
    {Array.from({length:30}).map((_,i)=><circle key={i} cx={(i*37)%400} cy={(i*53)%600} r={0.8+(i%3)*0.4} fill="#e0f2fe" opacity={0.3+((i*7)%5)/10}/>)}
  </g>
);

export const FrostArt = ({ b }: { b: Biome }) => (
  <g>
    <defs>
      <linearGradient id={`${b.id}-aurora`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5eead4" stopOpacity="0"/>
        <stop offset="40%" stopColor="#5eead4" stopOpacity="0.6"/>
        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <path d="M -20 80 Q 100 40, 200 90 Q 300 140, 420 60 L 420 240 L -20 240 Z" fill={`url(#${b.id}-aurora)`} opacity="0.75"/>
    <path d="M -20 110 Q 120 70, 220 130 Q 320 170, 420 110 L 420 220 L -20 220 Z" fill={`url(#${b.id}-aurora)`} opacity="0.5"/>
    <polygon points="-20,420 60,260 130,360 200,220 280,340 360,250 420,420" fill="#1e3a5f"/>
    <polygon points="-20,440 80,320 160,400 230,300 310,380 380,310 420,440" fill="#2a5b85" opacity="0.85"/>
    <path d="M 0 460 L 400 460 L 400 600 L 0 600 Z" fill="#cbd5e1" opacity="0.85"/>
    <path d="M 0 480 Q 200 460, 400 490 L 400 600 L 0 600 Z" fill="#e0f2fe" opacity="0.75"/>
  </g>
);

export const EmberArt = ({ b }: { b: Biome }) => (
  <g>
    <defs>
      <radialGradient id={`${b.id}-lava`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fcd34d"/>
        <stop offset="60%" stopColor="#f97316"/>
        <stop offset="100%" stopColor="#7c2d12"/>
      </radialGradient>
    </defs>
    <polygon points="-20,460 80,180 180,420 260,200 340,440 420,260 420,600 -20,600" fill="#1c0a08"/>
    <polygon points="-20,480 90,260 170,440 250,280 330,460 400,320 420,600 -20,600" fill="#3d1f15" opacity="0.9"/>
    <path d="M 60 500 Q 100 460, 140 500 Q 180 540, 220 500 Q 260 460, 300 500 Q 340 540, 380 500" stroke="#fb923c" strokeWidth="3" fill="none" opacity="0.85"/>
    <ellipse cx="200" cy="560" rx="180" ry="22" fill={`url(#${b.id}-lava)`} opacity="0.85"/>
    {Array.from({length:22}).map((_,i)=><circle key={i} cx={(i*19+30)%400} cy={50+(i*23)%400} r={1.2} fill="#fcd34d" opacity={0.4+((i*3)%5)/10}/>)}
  </g>
);

export const VerdantArt = ({ b }: { b: Biome }) => (
  <g>
    <defs>
      <radialGradient id={`${b.id}-glow`} cx="50%" cy="80%" r="60%">
        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.5"/>
        <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="200" rx="120" ry="80" fill="#14352a"/>
    <ellipse cx="340" cy="180" rx="140" ry="90" fill="#14352a"/>
    <ellipse cx="200" cy="140" rx="100" ry="60" fill="#1f5236" opacity="0.9"/>
    {[[40,460,26],[340,480,22],[80,510,18],[310,520,16]].map((m,i)=>(
      <g key={i}>
        <rect x={m[0]-5} y={m[1]} width="10" height={m[2]} rx="3" fill="#f5f5f4"/>
        <ellipse cx={m[0]} cy={m[1]} rx={m[2]} ry={m[2]*0.55} fill="#dc2626"/>
        <circle cx={m[0]-4} cy={m[1]-3} r="2.5" fill="#fef3c7"/>
        <circle cx={m[0]+5} cy={m[1]-1} r="2" fill="#fef3c7"/>
      </g>
    ))}
    <path d="M 0 470 Q 200 450, 400 475 L 400 600 L 0 600 Z" fill="#166534"/>
    <ellipse cx="200" cy="520" rx="200" ry="40" fill={`url(#${b.id}-glow)`}/>
    {Array.from({length:14}).map((_,i)=><circle key={i} cx={(i*29+20)%400} cy={200+(i*31)%280} r={2} fill="#fef08a" opacity="0.75"/>)}
  </g>
);

export const TideArt = ({ b }: { b: Biome }) => (
  <g>
    <defs>
      <radialGradient id={`${b.id}-deep`} cx="50%" cy="0%" r="100%">
        <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.7"/>
        <stop offset="100%" stopColor="#0c1f3a" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <path d="M 60 0 L 100 600 L 20 600 Z" fill={`url(#${b.id}-deep)`} opacity="0.5"/>
    <path d="M 200 0 L 220 600 L 180 600 Z" fill={`url(#${b.id}-deep)`} opacity="0.6"/>
    <path d="M 340 0 L 380 600 L 300 600 Z" fill={`url(#${b.id}-deep)`} opacity="0.5"/>
    {[[40,320,180],[340,280,220],[120,380,140],[280,360,160]].map((c,i)=>(
      <g key={i}>
        <rect x={c[0]-12} y={c[1]} width="24" height={c[2]} rx="6" fill="#0c2540"/>
        <circle cx={c[0]} cy={c[1]} r="14" fill="#ec4899" opacity="0.8"/>
        <circle cx={c[0]-8} cy={c[1]+8} r="8" fill="#f472b6" opacity="0.7"/>
        <circle cx={c[0]+8} cy={c[1]+6} r="9" fill="#a5f3fc" opacity="0.6"/>
      </g>
    ))}
    {Array.from({length:18}).map((_,i)=><circle key={i} cx={(i*23+10)%400} cy={100+(i*41)%480} r={2+(i%3)} fill="#a5f3fc" opacity={0.4+((i*7)%4)/10} stroke="#67e8f9" strokeWidth="0.4"/>)}
  </g>
);

export const DunesArt = ({ b: _b }: { b: Biome }) => (
  <g>
    <circle cx="320" cy="160" r="60" fill="#fef3c7" opacity="0.7"/>
    <circle cx="320" cy="160" r="40" fill="#fbbf24" opacity="0.85"/>
    <path d="M -20 380 Q 100 320, 220 360 Q 340 400, 420 340 L 420 600 L -20 600 Z" fill="#b45309"/>
    <path d="M -20 440 Q 80 400, 200 430 Q 300 460, 420 410 L 420 600 L -20 600 Z" fill="#d97706" opacity="0.9"/>
    <path d="M -20 500 Q 100 480, 220 495 Q 340 510, 420 490 L 420 600 L -20 600 Z" fill="#f59e0b" opacity="0.85"/>
    <polygon points="60,400 80,260 100,400" fill="#3f2613"/>
    <polygon points="320,420 336,300 352,420" fill="#3f2613" opacity="0.9"/>
    {Array.from({length:30}).map((_,i)=><circle key={i} cx={(i*31+10)%400} cy={(i*17)%600} r={0.8} fill="#fef3c7" opacity={0.3+((i*5)%4)/10}/>)}
  </g>
);

export const VoidArt = ({ b }: { b: Biome }) => (
  <g>
    <defs>
      <radialGradient id={`${b.id}-rift`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f0abfc"/>
        <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6"/>
        <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0"/>
      </radialGradient>
    </defs>
    {Array.from({length:80}).map((_,i)=><circle key={i} cx={(i*47+7)%400} cy={(i*31)%600} r={0.4+(i%4)*0.3} fill="#ffffff" opacity={0.4+((i*11)%5)/10}/>)}
    <ellipse cx="200" cy="200" rx="180" ry="60" fill={`url(#${b.id}-rift)`}/>
    <ellipse cx="200" cy="200" rx="60" ry="14" fill="#ffffff" opacity="0.7"/>
    <polygon points="20,520 40,260 60,520" fill="#1a0f3a"/>
    <polygon points="340,500 358,240 376,500" fill="#1a0f3a"/>
    {[[80,320],[320,280],[180,360]].map((p,i)=>(
      <g key={i} transform={`translate(${p[0]} ${p[1]})`}>
        <rect x="-8" y="-8" width="16" height="16" fill="none" stroke="#c084fc" strokeWidth="1.2" transform="rotate(45)"/>
        <circle r="2" fill="#f0abfc"/>
      </g>
    ))}
  </g>
);

export const ApexArt = ({ b }: { b: Biome }) => (
  <g>
    <defs>
      <radialGradient id={`${b.id}-halo`} cx="50%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/>
        <stop offset="40%" stopColor="#fbbf24" stopOpacity="0.5"/>
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
      </radialGradient>
    </defs>
    {Array.from({length:24}).map((_,i)=>{const a=i*Math.PI*2/24,x2=200+Math.cos(a)*400,y2=220+Math.sin(a)*400;return<line key={i} x1="200" y1="220" x2={x2} y2={y2} stroke="#fbbf24" strokeWidth="1" opacity="0.18"/>;})}
    <circle cx="200" cy="220" r="200" fill={`url(#${b.id}-halo)`}/>
    <circle cx="200" cy="220" r="60" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.7"/>
    <polygon points="60,500 80,200 100,500" fill="#2a0e3a" stroke="#fbbf24" strokeWidth="0.8"/>
    <polygon points="300,500 320,200 340,500" fill="#2a0e3a" stroke="#fbbf24" strokeWidth="0.8"/>
    <rect x="170" y="460" width="60" height="120" fill="#1a0524" stroke="#fbbf24" strokeWidth="1"/>
    <rect x="160" y="450" width="80" height="14" fill="#fbbf24" opacity="0.85"/>
    {Array.from({length:30}).map((_,i)=><circle key={i} cx={(i*13+8)%400} cy={(i*19)%600} r={1.2} fill="#fef3c7" opacity={0.4+((i*7)%4)/10}/>)}
  </g>
);

export const ART: Record<string, React.ComponentType<{ b: Biome }>> = {
  crystal: CrystalArt,
  frost:   FrostArt,
  ember:   EmberArt,
  verdant: VerdantArt,
  tidewave: TideArt,
  dunes:   DunesArt,
  voidline: VoidArt,
  apex:    ApexArt,
};

// ── Path builder ───────────────────────────────────────────────────
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
    // Level startLevel at TOP (y=margin), endLevel at BOTTOM (y=h-margin)
    // This makes the starting level immediately visible without scrolling
    const y = margin + t * usable;
    const x = w / 2 + Math.sin(t * Math.PI * 2.2) * (w * 0.28);
    const level = Math.round(startLevel + t * (endLevel - startLevel));
    out.push({ x, y, level });
  }
  return out;
}

// Long-form node generator: one node per level, fixed Y spacing, S-curve in X.
// For Candy-Crush-style maps with thousands of clickable levels.
// Returns deterministic positions so virtualization can compute indices from scrollY.
export function generateLongNodes(
  startLevel: number,
  endLevel: number,
  spacingY: number,
  w: number,
  topMargin: number,
) {
  const count = endLevel - startLevel + 1;
  const out: { x: number; y: number; level: number }[] = new Array(count);
  // Sine wave: ~6 full waves across the whole journey, scaled per-act so curves stay tight.
  const wave = Math.max(3, Math.min(60, count / 6));
  const ampl = w * 0.32;
  const cx = w / 2;
  for (let i = 0; i < count; i++) {
    const t = i / wave;
    // Layer two sines for organic winding so it doesn't look mechanical
    const x = cx + Math.sin(t * Math.PI) * ampl + Math.sin(t * Math.PI * 0.37) * (ampl * 0.18);
    const y = topMargin + i * spacingY;
    out[i] = { x, y, level: startLevel + i };
  }
  return out;
}
