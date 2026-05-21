'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const C = {
  accent:  '#a78bfa',
  accentDk:'#5e35d4',
  gold:    '#f5c66a',
  green:   '#5fd07a',
  red:     '#ff3b6b',
  blue:    '#7ad7ff',
  ember:   '#ff7a3a',
  muted:   'var(--ds-text-dim)',
  mono:    "'JetBrains Mono', monospace",
  serif:   "'Space Grotesk', sans-serif",
};

function RangeSlider({ label, value, onChange, min, max, step = 1, unit = '', color = C.accent }: {
  label: string; value: number; onChange: (n: number) => void;
  min: number; max: number; step?: number; unit?: string; color?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
        <span style={{ color: C.muted, fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: C.mono, color, fontWeight: 700 }}>{value.toLocaleString()}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, height: 4, cursor: 'pointer' }}
      />
    </div>
  );
}

function Card({ children, glow, style = {} }: { children: React.ReactNode; glow?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--ds-surface)', border: `1px solid ${glow ? glow + '44' : 'var(--ds-border)'}`,
      borderRadius: 16, padding: '20px 22px',
      boxShadow: glow ? `0 0 32px ${glow}18` : 'none',
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function CalculatorPage() {
  const [supply,    setSupply]    = useState(100_000_000);
  const [team,      setTeam]      = useState(15);
  const [investor,  setInvestor]  = useState(20);
  const [advisor,   setAdvisor]   = useState(5);
  const [ecosystem, setEcosystem] = useState(30);
  const [cliff,     setCliff]     = useState(90);
  const [vest,      setVest]      = useState(365);
  const [milestones,setMilestones]= useState(2);
  const [m0pct,     setM0pct]     = useState(30);
  const [m1pct,     setM1pct]     = useState(40);

  const community = Math.max(0, 100 - team - investor - advisor - ecosystem);

  const buckets = [
    { l: 'Team',       pct: team,       col: C.accent },
    { l: 'Investors',  pct: investor,   col: C.gold   },
    { l: 'Advisors',   pct: advisor,    col: C.blue   },
    { l: 'Ecosystem',  pct: ecosystem,  col: C.green  },
    { l: 'Community',  pct: community,  col: C.ember  },
  ].filter(b => b.pct > 0);

  const teamAlloc   = supply * (team / 100);
  const dailyUnlock = vest > 0 ? teamAlloc / vest : 0;
  const pressure    = supply > 0 ? (dailyUnlock / supply) * 100 : 0;
  const ratePerSec  = vest > 0 ? (teamAlloc / (vest * 86_400)) : 0;

  const pRating = pressure < 0.05 ? 'VERY SAFE' : pressure < 0.1 ? 'SAFE' : pressure < 0.5 ? 'MODERATE' : 'HIGH RISK';
  const pCol    = pressure < 0.1 ? C.green : pressure < 0.5 ? C.gold : C.red;

  // SVG vesting curve — 560×140 canvas
  const CHART_W = 560, CHART_H = 130;
  const totalDays = cliff + vest;
  const curvePts = Array.from({ length: 80 }, (_, i) => {
    const t = i / 79;
    const day = t * totalDays;
    let y: number;
    if (day < cliff) {
      y = 0;
    } else {
      const elapsed = day - cliff;
      y = Math.min(1, elapsed / vest);
    }
    return { x: 20 + t * (CHART_W - 40), y: CHART_H - y * (CHART_H - 10) };
  });
  const pathD = curvePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L${curvePts[curvePts.length - 1].x},${CHART_H} L${curvePts[0].x},${CHART_H} Z`;

  // Cliff vertical line x position
  const cliffX = 20 + (cliff / totalDays) * (CHART_W - 40);

  // Bob simulation
  const bobTotal = 1_000;
  const bobCliff = 259_200; // 3 days in seconds
  const bobVest  = 432_000; // 5 days
  const milestoneQuota = (milestones >= 1 ? m0pct : 0) + (milestones >= 2 ? m1pct : 0);
  const milestoneCapBob = Math.floor(bobTotal * milestoneQuota / 100);

  // Bob at day 4 (1 day after cliff)
  const bobDay4Linear = Math.floor(bobTotal * (4 * 86400) / (bobCliff + bobVest)) ;
  const bobDay4Claimable = Math.min(bobDay4Linear, milestoneCapBob);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ds-bg)', color: 'var(--ds-text)' }}>
      <Navbar />

      {/* Header */}
      <div style={{ padding: '80px 24px 32px', background: 'linear-gradient(180deg,#080a1a 0%,var(--ds-bg) 100%)', borderBottom: '1px solid #1f1f3a' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: C.gold, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>
            TDP · Vesting Calculator
          </div>
          <h1 style={{ fontFamily: C.serif, fontSize: 'clamp(24px,5vw,40px)', fontWeight: 900, marginBottom: 8 }}>
            Token Distribution Modeler
          </h1>
          <p style={{ fontSize: 13, color: C.muted, maxWidth: 560 }}>
            Model cliff + linear + milestone vesting schedules. Analyze daily unlock pressure before deploying.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── Left: Controls ──────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Supply */}
            <Card>
              <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                💰 Total Supply
              </div>
              <RangeSlider label="Supply" value={supply} onChange={setSupply} min={1_000_000} max={1_000_000_000} step={1_000_000} color={C.gold} />
              <div style={{ fontFamily: C.mono, fontSize: 12.5, color: C.gold, textAlign: 'center', marginTop: 8 }}>{supply.toLocaleString()} TOKEN</div>
            </Card>

            {/* Allocations */}
            <Card>
              <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                👥 Allocation %
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <RangeSlider label="Team & Founders" value={team}      onChange={setTeam}      min={0} max={40} unit="%" color={C.accent} />
                <RangeSlider label="Investors"        value={investor}  onChange={setInvestor}  min={0} max={40} unit="%" color={C.gold}   />
                <RangeSlider label="Advisors"         value={advisor}   onChange={setAdvisor}   min={0} max={20} unit="%" color={C.blue}   />
                <RangeSlider label="Ecosystem"        value={ecosystem} onChange={setEcosystem} min={0} max={40} unit="%" color={C.green}  />
                <div style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>Community (auto): <span style={{ fontFamily: C.mono, color: C.ember }}>{community}%</span></div>
              </div>
              {/* Stacked bar */}
              <div style={{ marginTop: 12, height: 8, borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                {buckets.map(b => (
                  <div key={b.l} style={{ height: '100%', width: `${b.pct}%`, background: b.col, transition: 'width .3s' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                {buckets.map(b => (
                  <div key={b.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.col }} />
                    <span style={{ fontSize: 10, color: C.muted }}>{b.l} {b.pct}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Schedule */}
            <Card>
              <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                📅 Vesting Schedule
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <RangeSlider label="Cliff period" value={cliff} onChange={setCliff} min={0} max={730} unit=" days" color={C.ember} />
                <RangeSlider label="Vesting duration" value={vest} onChange={setVest} min={30} max={1460} unit=" days" color={C.accent} />
              </div>
            </Card>

            {/* Milestone config */}
            <Card>
              <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                🎯 Milestone Gates
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <RangeSlider label="Milestones" value={milestones} onChange={setMilestones} min={0} max={4} color={C.blue} />
                {milestones >= 1 && <RangeSlider label="Milestone 1 %" value={m0pct} onChange={setM0pct} min={0} max={100} unit="%" color={C.blue} />}
                {milestones >= 2 && <RangeSlider label="Milestone 2 %" value={m1pct} onChange={setM1pct} min={0} max={100} unit="%" color={C.accent} />}
                {milestones > 0 && (
                  <div style={{ fontSize: 11.5, fontFamily: C.mono, color: C.muted }}>
                    Quota cap: <span style={{ color: C.blue }}>{milestoneQuota}%</span>
                    {' = '}<span style={{ color: '#fff' }}>{Math.floor(teamAlloc * milestoneQuota / 100).toLocaleString()} TOKEN</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Right: Results ──────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Market pressure */}
            <Card glow={pCol}>
              <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                📊 Market Pressure — Team Unlock
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: C.mono, fontSize: 40, fontWeight: 800, color: pCol, lineHeight: 1, textShadow: `0 0 20px ${pCol}55` }}>
                    {pressure.toFixed(4)}%
                  </div>
                  <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3 }}>daily team unlock / total supply</div>
                </div>
                <div style={{ padding: '8px 16px', borderRadius: 11, background: `${pCol}18`, border: `1.5px solid ${pCol}44` }}>
                  <div style={{ fontFamily: C.serif, fontSize: 12, fontWeight: 800, color: pCol }}>{pRating}</div>
                </div>
              </div>

              <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.07)', overflow: 'hidden', marginBottom: 14 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, pressure / 0.5 * 100)}%`,
                  background: `linear-gradient(90deg,${C.green},${C.gold},${C.red})`,
                  borderRadius: 99, transition: 'width .4s ease',
                }} />
              </div>

              {[
                { l: 'Team allocation',    v: `${teamAlloc.toLocaleString()} TOKEN`,            icon: '👥' },
                { l: 'Daily unlock',       v: `${dailyUnlock.toFixed(0)} TOKEN`,               icon: '📅' },
                { l: 'Rate / second',      v: `${ratePerSec.toFixed(6)} T/s`,                  icon: '⚡' },
                { l: 'Cliff date',         v: `Day ${cliff}`,                                  icon: '🔒' },
                { l: 'Full vest',          v: `Day ${cliff + vest}`,                           icon: '✅' },
              ].map((r, i, a) => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < a.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.muted, fontSize: 12 }}>
                    <span>{r.icon}</span>{r.l}
                  </div>
                  <span style={{ fontFamily: C.mono, fontSize: 12, color: '#fff', fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
            </Card>

            {/* Vesting curve SVG */}
            <Card>
              <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                📈 Vesting Curve — Team ({vest}d + {cliff}d cliff)
              </div>
              <svg
                width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H + 30}`}
                style={{ display: 'block', overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={C.accent} stopOpacity=".45" />
                    <stop offset="1" stopColor={C.accent} stopOpacity="0"  />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                  <line key={v}
                    x1="20" y1={CHART_H - v * (CHART_H - 10) + 5} x2={CHART_W - 20} y2={CHART_H - v * (CHART_H - 10) + 5}
                    stroke="rgba(255,255,255,.05)" strokeWidth="1"
                  />
                ))}
                {/* Y-axis labels */}
                {[0, 25, 50, 75, 100].map(v => (
                  <text key={v}
                    x="14" y={CHART_H - (v / 100) * (CHART_H - 10) + 9}
                    textAnchor="end" fontSize="9" fontFamily="JetBrains Mono,monospace"
                    fill="rgba(255,255,255,.3)">{v}%</text>
                ))}

                {/* Cliff indicator */}
                {cliff > 0 && (
                  <>
                    <line x1={cliffX} y1="0" x2={cliffX} y2={CHART_H}
                      stroke={C.ember} strokeWidth="1.5" strokeDasharray="4,3" />
                    <text x={cliffX + 4} y={14} fontSize="9" fill={C.ember} fontFamily="JetBrains Mono,monospace">
                      cliff d{cliff}
                    </text>
                  </>
                )}

                {/* Area fill */}
                <path d={areaD} fill="url(#curveGrad)" />

                {/* Curve line */}
                <path d={pathD} fill="none" stroke={C.accent} strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 5px ${C.accent}88)` }}
                />

                {/* X-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                  const day = Math.round(t * totalDays);
                  const x = 20 + t * (CHART_W - 40);
                  return (
                    <text key={t} x={x} y={CHART_H + 18} textAnchor="middle" fontSize="9"
                      fontFamily="JetBrains Mono,monospace" fill="rgba(255,255,255,.3)">
                      D{day}
                    </text>
                  );
                })}
              </svg>

              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 14, height: 3, borderRadius: 99, background: C.accent }} />
                  <span style={{ fontSize: 10, color: C.muted }}>% vested</span>
                </div>
                {cliff > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 14, height: 2, background: C.ember, borderRadius: 99 }} />
                    <span style={{ fontSize: 10, color: C.muted }}>cliff</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Bob simulation */}
            <Card style={{ border: `1px solid ${C.blue}33`, background: `${C.blue}05` }}>
              <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                🧑‍💻 Bob Simulation — T=1,000 TOKEN, cliff=3d, vest=5d
              </div>
              <RangeSlider label="Verified milestones" value={milestones} onChange={setMilestones} min={0} max={2} color={C.blue} />
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { l: 'Day 2 (cliff active, milestone 1 done)',    v: `0 TOKEN → cliff not passed` },
                  { l: `Day 4 (1d after cliff, quota=${milestoneQuota}%)`, v: `min(${bobDay4Linear}, ${milestoneCapBob}) = ${bobDay4Claimable} TOKEN` },
                  { l: 'Rate',                                      v: `${(bobTotal / (bobVest / 86400)).toFixed(1)} TOKEN/day` },
                ].map((r, i, a) => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < a.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: 11, color: C.muted, maxWidth: '55%' }}>{r.l}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 11.5, color: C.blue, fontWeight: 600 }}>{r.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 10.5, color: C.muted, lineHeight: 1.7 }}>
                Formula: <code style={{ fontFamily: C.mono, color: C.blue }}>claimable(t) = min(linear(t), total × Σ verified_pct)</code>
              </div>
            </Card>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/streams/new" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 20px', background: `linear-gradient(135deg,${C.accent},${C.accentDk})`,
                color: '#fff', borderRadius: 13, textDecoration: 'none', fontWeight: 700, fontSize: 13,
                boxShadow: `0 0 18px ${C.accent}44`,
              }}>+ Deploy This Schedule</Link>
              <Link href="/streams" style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '13px 20px',
                background: 'rgba(255,255,255,.06)', border: '1px solid var(--ds-border)',
                color: C.muted, borderRadius: 13, textDecoration: 'none', fontWeight: 600, fontSize: 13,
              }}>← Streams</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
