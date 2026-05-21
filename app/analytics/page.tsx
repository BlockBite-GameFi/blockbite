'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
  accent: '#a78bfa',
  gold:   '#f5c66a',
  green:  '#5fd07a',
  blue:   '#7ad7ff',
  ember:  '#ff7a3a',
  red:    '#f87171',
  muted:  'rgba(148,163,184,0.7)',
  border: 'rgba(167,139,250,0.15)',
  bg0:    '#0b0918',
  bg1:    '#0f0d1e',
  bg2:    '#140f2a',
  mono:   '"JetBrains Mono",monospace',
  serif:  '"Space Grotesk",system-ui,sans-serif',
};

// ─── Mock stream data ────────────────────────────────────────────────────────
const STREAMS = [
  { id:'stm-001', name:'Team Allocation',    type:'linear',    status:'active',    total:500_000, unlocked:125_000, claimed:98_000,  creator:'Dn7f…XTFf', recipient:'4xK2…1mWd', cliff:'2025-03-01', end:'2026-03-01', vestDays:365, cliffDays:90,  milestones:[] },
  { id:'stm-002', name:'Advisor Grants',     type:'milestone', status:'active',    total:200_000, unlocked:80_000,  claimed:60_000,  creator:'Dn7f…XTFf', recipient:'9qP5…nBjc', cliff:'2025-02-01', end:'2026-02-01', vestDays:365, cliffDays:60,  milestones:[{label:'Token Launch',pct:30,date:'2025-01-15',done:true},{label:'10k Users',pct:40,date:'2025-04-01',done:false},{label:'Revenue $1M',pct:30,date:'2025-08-01',done:false}] },
  { id:'stm-003', name:'Investor Round A',   type:'cliff',     status:'pending',   total:1_000_000,unlocked:0,      claimed:0,       creator:'8mNc…2sDf', recipient:'Bn6h…3kQm', cliff:'2026-01-01', end:'2026-07-01', vestDays:180, cliffDays:365, milestones:[] },
  { id:'stm-004', name:'Community Rewards',  type:'hybrid',    status:'active',    total:300_000, unlocked:90_000,  claimed:45_000,  creator:'Dn7f…XTFf', recipient:'7rPw…8vLx', cliff:'2025-01-01', end:'2025-10-01', vestDays:270, cliffDays:30,  milestones:[] },
  { id:'stm-005', name:'Game Season 1',      type:'milestone', status:'active',    total:150_000, unlocked:45_000,  claimed:45_000,  creator:'2cVq…7hKn', recipient:'Dn7f…XTFf', cliff:'2024-12-01', end:'2025-06-01', vestDays:180, cliffDays:0,   milestones:[{label:'Level 5 Reached',pct:25,date:'2025-01-01',done:true},{label:'Boss Defeated',pct:50,date:'2025-03-01',done:false}] },
  { id:'stm-006', name:'Marketing Budget',   type:'linear',    status:'completed', total:100_000, unlocked:100_000, claimed:100_000, creator:'Dn7f…XTFf', recipient:'5mRs…2yZp', cliff:'2024-12-01', end:'2025-06-01', vestDays:180, cliffDays:0,   milestones:[] },
];

const STREAM_TYPE_BREAKDOWN = [
  { type:'Linear',    pct:44, col:C.accent, n:812  },
  { type:'Milestone', pct:28, col:C.blue,   n:515  },
  { type:'Cliff',     pct:18, col:C.gold,   n:331  },
  { type:'Hybrid',    pct:10, col:'#c084fc', n:182 },
];

// ─── Chart data (30 days) ────────────────────────────────────────────────────
const CHART_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  unlocked: Math.round(12000 + Math.sin(i * 0.4) * 4000 + i * 800),
  claimed:  Math.round(8000  + Math.sin(i * 0.4) * 2000 + i * 500),
}));

// ─── Sub-components ───────────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.bg1,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '16px 20px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '.05em',
      background: `${color}18`,
      border: `1px solid ${color}44`,
      color,
      fontFamily: C.mono,
    }}>
      {label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod]   = useState('30d');
  const [ticker, setTicker]   = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTicker(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const tvl        = (2_400_000 + ticker * 12).toLocaleString();
  const streamRate = (0.000463 + ticker * 0.000001).toFixed(6);

  const maxVal  = Math.max(...CHART_DATA.map(d => d.unlocked));
  const chartW  = 560;
  const chartH  = 120;

  const unlockedPath = CHART_DATA.map((d, i) => {
    const x = (i / (CHART_DATA.length - 1)) * chartW;
    const y = chartH - (d.unlocked / maxVal) * chartH;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const claimedPath = CHART_DATA.map((d, i) => {
    const x = (i / (CHART_DATA.length - 1)) * chartW;
    const y = chartH - (d.claimed / maxVal) * chartH;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  return (
    <div style={{ minHeight: '100vh', background: C.bg0, padding: '0 0 60px' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '32px 40px 20px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Link href="/streams" style={{ color: C.muted, fontSize: 12, textDecoration: 'none' }}>← Streams</Link>
          </div>
          <h1 style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
            Protocol Analytics
          </h1>
          <p style={{ fontSize: 12.5, color: C.muted, margin: '4px 0 0' }}>
            Real-time on-chain vesting metrics · BlockBite TDP
          </p>
        </div>

        {/* Period filter */}
        <div style={{
          display: 'flex', gap: 2,
          background: C.bg1,
          border: `1px solid ${C.border}`,
          borderRadius: 9, padding: 3,
        }}>
          {(['7d','30d','90d','all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: period === p ? C.accent : 'transparent',
                color: period === p ? '#fff' : C.muted,
                fontSize: 11, fontWeight: 600, transition: 'all .15s', fontFamily: C.serif,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── KPI row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {[
            { label:'Total Value Locked',   val:`$${tvl}`,       sub:'↑ $144/min live',         col:C.gold,   live:true  },
            { label:'Active Streams',       val:'1,840',         sub:'across all projects',      col:C.accent, live:false },
            { label:'BBT Distributed',      val:'48.2M TOKEN',   sub:'all-time',                 col:C.green,  live:false },
            { label:'Stream Rate (live)',   val:streamRate,      sub:'TOKEN/sec protocol-wide',  col:C.blue,   live:true  },
            { label:'Protocol Uptime',      val:'99.98%',        sub:'since 2025-04-17',         col:C.green,  live:false },
          ].map(s => (
            <Card key={s.label} style={{ padding: '14px 16px', position: 'relative' }}>
              {s.live && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 7, height: 7, borderRadius: '50%',
                  background: C.green, boxShadow: `0 0 6px ${C.green}`,
                  animation: 'blink 1.4s ease-in-out infinite',
                }} />
              )}
              <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>
                {s.label}
              </div>
              <div style={{
                fontFamily: C.mono,
                fontSize: s.val.length > 10 ? 16 : 22,
                fontWeight: 700,
                color: s.col,
                lineHeight: 1,
              }}>
                {s.val}
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{s.sub}</div>
            </Card>
          ))}
        </div>

        {/* ── Chart + stream types ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>

          {/* Velocity chart */}
          <Card>
            <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
              Vesting Velocity — Last 30 Days
            </div>
            <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 30}`} style={{ display: 'block' }}>
              <defs>
                <linearGradient id="cu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={C.accent} stopOpacity="0.4" />
                  <stop offset="1" stopColor={C.accent} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="cc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={C.green} stopOpacity="0.3" />
                  <stop offset="1" stopColor={C.green} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map(v => (
                <line key={v} x1="0" y1={v * chartH} x2={chartW} y2={v * chartH}
                  stroke="rgba(255,255,255,.05)" strokeWidth="1" />
              ))}
              {/* Area fills */}
              <path d={unlockedPath + ` L${chartW},${chartH} L0,${chartH} Z`} fill="url(#cu)" />
              <path d={claimedPath  + ` L${chartW},${chartH} L0,${chartH} Z`} fill="url(#cc)" />
              {/* Lines */}
              <path d={unlockedPath} fill="none" stroke={C.accent} strokeWidth="2"
                strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${C.accent})` }} />
              <path d={claimedPath}  fill="none" stroke={C.green}  strokeWidth="2" strokeLinecap="round" />
              {/* X axis labels */}
              {[0, 9, 19, 29].map(i => (
                <text key={i} x={(i / (CHART_DATA.length - 1)) * chartW} y={chartH + 18}
                  textAnchor="middle" fontSize="9"
                  fontFamily="JetBrains Mono,monospace"
                  fill={C.muted}>
                  D{CHART_DATA[i].day}
                </text>
              ))}
            </svg>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              {[{ col: C.accent, label: 'Unlocked' }, { col: C.green, label: 'Claimed' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 3, borderRadius: 99, background: l.col }} />
                  <span style={{ fontSize: 10, color: C.muted }}>{l.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Stream type breakdown */}
          <Card>
            <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
              Stream Types
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {STREAM_TYPE_BREAKDOWN.map(s => (
                <div key={s.type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.col }} />
                      <span style={{ fontSize: 12, color: '#fff' }}>{s.type}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: C.mono, fontSize: 12, color: s.col, fontWeight: 700 }}>{s.pct}%</span>
                      <span style={{ fontSize: 10, color: C.muted, marginLeft: 5 }}>({s.n})</span>
                    </div>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${s.pct}%`,
                      borderRadius: 99,
                      background: `linear-gradient(90deg,${s.col}77,${s.col})`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: C.border, margin: '14px 0' }} />
            <div style={{ fontSize: 11, color: C.muted }}>
              Total: <span style={{ color: '#fff', fontFamily: C.mono }}>1,840</span> active streams
            </div>
          </Card>
        </div>

        {/* ── Top streams table ── */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff' }}>
            Top Active Streams by TVL
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.03)' }}>
                {['Stream','Type','Creator','Total Locked','Unlocked','% Complete','Status'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 9.5, color: C.muted, letterSpacing: '.06em', fontWeight: 700 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STREAMS.map((s, i) => {
                const pct      = Math.round(s.unlocked / s.total * 100);
                const typeCol  = ({ linear:C.accent, milestone:C.blue, cliff:C.gold, hybrid:'#c084fc' } as Record<string,string>)[s.type] ?? C.accent;
                const statCol  = ({ active:C.green, pending:C.gold, completed:C.muted } as Record<string,string>)[s.status] ?? C.muted;
                return (
                  <tr key={s.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                    <td style={{ padding: '9px 16px', fontSize: 12, fontWeight: 600, color: '#fff' }}>
                      <Link href={`/streams/${s.id}`} style={{ color: '#fff', textDecoration: 'none' }}>{s.name}</Link>
                    </td>
                    <td style={{ padding: '9px 16px' }}><Badge label={s.type.toUpperCase()} color={typeCol} /></td>
                    <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 10, color: C.muted }}>{s.creator.slice(0, 12)}</td>
                    <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 11, color: '#fff' }}>{s.total.toLocaleString()} BBT</td>
                    <td style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 11, color: C.accent }}>{s.unlocked.toLocaleString()}</td>
                    <td style={{ padding: '9px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 5, borderRadius: 99, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: typeCol, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontFamily: C.mono, fontSize: 10, color: typeCol }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: statCol, boxShadow: `0 0 5px ${statCol}` }} />
                        <span style={{ fontSize: 10.5, color: statCol, fontWeight: 600, textTransform: 'uppercase' }}>{s.status}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* ── Anti-dump health ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { title:'Market Pressure',      val:'0.04%',  sub:'daily unlock / supply', col:C.green,  ok:true,  desc:'Well below 0.1% safety threshold. No dump risk.'            },
            { title:'Cliff Compliance',     val:'100%',   sub:'of streams have cliff ≥ 7d', col:C.green, ok:true, desc:'All active streams enforce minimum cliff duration.'       },
            { title:'Avg Vesting Duration', val:'14.2 mo',sub:'across active streams', col:C.accent, ok:true,  desc:'Longer average = stronger anti-dump protection.'             },
          ].map(m => (
            <Card key={m.title} style={{ border: `1px solid ${m.col}33` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: m.col, fontFamily: C.serif }}>{m.title}</div>
                <Badge label={m.ok ? 'HEALTHY' : 'WARNING'} color={m.ok ? C.green : C.red} />
              </div>
              <div style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 800, color: m.col, lineHeight: 1 }}>{m.val}</div>
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 4 }}>{m.sub}</div>
              <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
              <div style={{ fontSize: 11, color: 'rgba(232,225,248,.6)' }}>{m.desc}</div>
            </Card>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
