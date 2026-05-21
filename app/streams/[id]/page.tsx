'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
interface Milestone {
  label: string;
  pct:   number;
  date:  string;
  done:  boolean;
}
interface Stream {
  id:          string;
  name:        string;
  type:        'linear' | 'cliff' | 'milestone' | 'hybrid';
  status:      'active' | 'pending' | 'completed';
  total:       number;
  unlocked:    number;
  claimed:     number;
  creator:     string;
  recipient:   string;
  cliff:       string;
  end:         string;
  vestDays:    number;
  cliffDays:   number;
  milestones:  Milestone[];
}

const STREAMS: Stream[] = [
  { id:'stm-001', name:'Team Allocation',   type:'linear',    status:'active',    total:500_000,   unlocked:125_000, claimed:98_000,  creator:'Dn7f…XTFf', recipient:'4xK2…1mWd', cliff:'2025-03-01', end:'2026-03-01', vestDays:365, cliffDays:90,  milestones:[] },
  { id:'stm-002', name:'Advisor Grants',    type:'milestone', status:'active',    total:200_000,   unlocked:80_000,  claimed:60_000,  creator:'Dn7f…XTFf', recipient:'9qP5…nBjc', cliff:'2025-02-01', end:'2026-02-01', vestDays:365, cliffDays:60,  milestones:[
    { label:'Token Launch',   pct:30, date:'2025-01-15', done:true  },
    { label:'10k Users',      pct:40, date:'2025-04-01', done:false },
    { label:'Revenue $1M',    pct:30, date:'2025-08-01', done:false },
  ]},
  { id:'stm-003', name:'Investor Round A',  type:'cliff',     status:'pending',   total:1_000_000, unlocked:0,       claimed:0,       creator:'8mNc…2sDf', recipient:'Bn6h…3kQm', cliff:'2026-01-01', end:'2026-07-01', vestDays:180, cliffDays:365, milestones:[] },
  { id:'stm-004', name:'Community Rewards', type:'hybrid',    status:'active',    total:300_000,   unlocked:90_000,  claimed:45_000,  creator:'Dn7f…XTFf', recipient:'7rPw…8vLx', cliff:'2025-01-01', end:'2025-10-01', vestDays:270, cliffDays:30,  milestones:[] },
  { id:'stm-005', name:'Game Season 1',     type:'milestone', status:'active',    total:150_000,   unlocked:45_000,  claimed:45_000,  creator:'2cVq…7hKn', recipient:'Dn7f…XTFf', cliff:'2024-12-01', end:'2025-06-01', vestDays:180, cliffDays:0,   milestones:[
    { label:'Level 5 Reached', pct:25, date:'2025-01-01', done:true  },
    { label:'Boss Defeated',   pct:50, date:'2025-03-01', done:false },
  ]},
  { id:'stm-006', name:'Marketing Budget',  type:'linear',    status:'completed', total:100_000,   unlocked:100_000, claimed:100_000, creator:'Dn7f…XTFf', recipient:'5mRs…2yZp', cliff:'2024-12-01', end:'2025-06-01', vestDays:180, cliffDays:0,   milestones:[] },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 20px', ...style }}>
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 6,
      fontSize: 9.5, fontWeight: 700, letterSpacing: '.05em',
      background: `${color}18`, border: `1px solid ${color}44`, color,
      fontFamily: C.mono,
    }}>
      {label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StreamDetailPage() {
  const params    = useParams();
  const streamId  = (params?.id as string) ?? 'stm-001';
  const s         = STREAMS.find(x => x.id === streamId) ?? STREAMS[0];

  const [claimed, setClaimed] = useState(s.claimed);
  const claimable = s.unlocked - claimed;

  const typeCol = ({ linear:C.accent, milestone:C.blue, cliff:C.gold, hybrid:'#c084fc' } as Record<string,string>)[s.type] ?? C.accent;

  // ── Build vesting curve SVG ──────────────────────────────────────────────
  const W = 560, H = 160, PX = 36, PY = 14;
  const iw = W - PX * 2;
  const ih = H - PY * 2;

  const curvePts = Array.from({ length: 60 }, (_, i) => {
    const t = i / 59;
    let y: number;
    if      (s.type === 'linear')    y = t;
    else if (s.type === 'cliff')     y = t < 0.35 ? 0 : (t - 0.35) / 0.65;
    else if (s.type === 'milestone') y = t < 0.2 ? 0 : t < 0.5 ? 0.3 : t < 0.75 ? 0.6 : t;
    else                             y = t < 0.3 ? 0 : Math.pow((t - 0.3) / 0.7, 0.65);
    return { x: PX + t * iw, y: H - PY - y * ih };
  });

  const pathD = curvePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L${PX + iw},${H - PY} L${PX},${H - PY} Z`;

  const nowPct  = s.total > 0 ? s.unlocked / s.total : 0;
  const nowX    = PX + nowPct * iw;
  const nowY    = curvePts[Math.round(nowPct * 59)]?.y ?? (H - PY);

  // ── Claim history events ─────────────────────────────────────────────────
  const events = [
    { type:'Claimed',  amt: s.claimed / 2,   date:'2025-04-15', tx:'5xKj…3mRd' },
    { type:'Claimed',  amt: s.claimed / 2,   date:'2025-03-01', tx:'2cVq…7hKn' },
    { type:'Unlocked', amt: s.unlocked,       date:'2025-01-01', tx: null        },
    { type:'Created',  amt: s.total,          date:'2024-12-01', tx:'9qP5…nBjc' },
  ];

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
            <Link href="/streams" style={{ color: C.muted, fontSize: 12, textDecoration: 'none' }}>← All Streams</Link>
          </div>
          <h1 style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
            {s.name}
          </h1>
          <p style={{ fontSize: 12.5, color: C.muted, margin: '4px 0 0' }}>
            Stream {s.id} · {s.type} vesting
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {claimable > 0 && (
            <button
              onClick={() => setClaimed(s.unlocked)}
              style={{
                padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.gold}cc, ${C.gold})`,
                color: '#0b0918', fontSize: 13, fontWeight: 700, fontFamily: C.serif,
              }}
            >
              Claim {claimable.toLocaleString()} BBT
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── KPI row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {[
            { l:'Total',     v:`${(s.total   / 1000).toFixed(0)}K BBT`,          c:'#fff'   },
            { l:'Unlocked',  v:`${(s.unlocked/ 1000).toFixed(0)}K BBT`,          c:C.accent },
            { l:'Claimed',   v:`${(claimed   / 1000).toFixed(0)}K BBT`,          c:C.green  },
            { l:'Claimable', v:`${claimable.toLocaleString()} BBT`,              c:C.gold   },
            { l:'Locked',    v:`${((s.total - s.unlocked) / 1000).toFixed(0)}K BBT`, c:C.muted  },
          ].map(x => (
            <Card key={x.l} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                {x.l}
              </div>
              <div style={{ fontFamily: C.mono, fontSize: 18, fontWeight: 700, color: x.c, lineHeight: 1 }}>
                {x.v}
              </div>
            </Card>
          ))}
        </div>

        {/* ── Meta badges ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge label={s.type.toUpperCase()}   color={typeCol} />
          <Badge
            label={s.status.toUpperCase()}
            color={s.status === 'active' ? C.green : s.status === 'pending' ? C.gold : C.muted}
          />
          <span style={{ fontSize: 11.5, color: C.muted }}>
            Cliff: <b style={{ color: '#fff' }}>{s.cliff}</b>
          </span>
          <span style={{ fontSize: 11.5, color: C.muted }}>
            End: <b style={{ color: '#fff' }}>{s.end}</b>
          </span>
          <span style={{ fontSize: 11.5, color: C.muted }}>
            Creator: <code style={{ color: C.accent, fontFamily: C.mono, fontSize: 11 }}>{s.creator}</code>
          </span>
          <span style={{ fontSize: 11.5, color: C.muted }}>
            Recipient: <code style={{ color: C.blue, fontFamily: C.mono, fontSize: 11 }}>{s.recipient}</code>
          </span>
        </div>

        {/* ── Curve + side panel ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>

          {/* Vesting curve SVG */}
          <Card>
            <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              Vesting Curve — {s.type.charAt(0).toUpperCase() + s.type.slice(1)} Model
            </div>
            <svg width="100%" viewBox={`0 0 ${W} ${H + 28}`} style={{ display: 'block' }}>
              <defs>
                <linearGradient id={`vg_${s.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={typeCol} stopOpacity="0.35" />
                  <stop offset="1" stopColor={typeCol} stopOpacity="0" />
                </linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="2.5" /></filter>
              </defs>
              {[0, 0.5, 1].map(v => (
                <line key={v}
                  x1={PX} y1={H - PY - v * ih}
                  x2={PX + iw} y2={H - PY - v * ih}
                  stroke="rgba(255,255,255,.05)" strokeWidth="1"
                />
              ))}
              <path d={areaD} fill={`url(#vg_${s.id})`} />
              <path d={pathD} fill="none" stroke={typeCol} strokeWidth="2.5"
                filter="url(#glow)" strokeLinecap="round" />
              <path d={pathD} fill="none" stroke={typeCol} strokeWidth="1.5" strokeLinecap="round" />
              {/* NOW indicator */}
              <line
                x1={nowX} y1={PY / 2}
                x2={nowX} y2={H - PY}
                stroke={C.gold} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.8"
              />
              <circle cx={nowX} cy={nowY} r="5" fill={C.gold}
                style={{ filter: `drop-shadow(0 0 6px ${C.gold})` }} />
              <text x={nowX} y={PY / 2 - 2} textAnchor="middle" fontSize="8.5"
                fontFamily="JetBrains Mono,monospace" fill={C.gold}>
                NOW
              </text>
            </svg>

            {/* Progress bar */}
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${Math.round(s.unlocked / s.total * 100)}%`,
                  background: `${typeCol}44`,
                  transition: 'width .5s',
                }} />
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${Math.round(claimed / s.total * 100)}%`,
                  background: `linear-gradient(90deg,${typeCol}88,${typeCol})`,
                  transition: 'width .5s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginTop: 4 }}>
                <span>Claimed {Math.round(claimed / s.total * 100)}%</span>
                <span>Unlocked {Math.round(s.unlocked / s.total * 100)}%</span>
                <span>Total {s.total.toLocaleString()} BBT</span>
              </div>
            </div>
          </Card>

          {/* Milestones or history */}
          <Card>
            <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              {s.type === 'milestone' ? 'Milestone Conditions' : 'Claim History'}
            </div>

            {s.type === 'milestone' && s.milestones.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {s.milestones.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'center',
                    padding: '9px 12px', borderRadius: 10,
                    background: m.done ? `${C.green}0a` : 'rgba(255,255,255,.03)',
                    border: `1px solid ${m.done ? C.green : C.border}`,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                      background: m.done ? C.green : 'rgba(255,255,255,.06)',
                      border: `1.5px solid ${m.done ? C.green : C.border}`,
                      display: 'grid', placeItems: 'center',
                      fontSize: 12, color: m.done ? '#0b0a14' : C.muted,
                    }}>
                      {m.done ? '✓' : ''}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: m.done ? '#fff' : C.muted, fontWeight: m.done ? 600 : 400 }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 9.5, color: C.muted }}>{m.date} · {m.pct}% unlock</div>
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 11, color: m.done ? C.green : C.muted }}>
                      {m.pct}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {events.map((e, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'center',
                    padding: '9px 0',
                    borderBottom: i < events.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: e.type === 'Claimed' ? C.green : e.type === 'Created' ? C.accent : C.muted,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: '#fff' }}>{e.type}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{e.date}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontFamily: C.mono, fontSize: 12, fontWeight: 700,
                        color: e.type === 'Claimed' ? C.green : '#fff',
                      }}>
                        {e.type === 'Claimed' ? '+' : ''}{e.amt.toLocaleString()} BBT
                      </div>
                      {e.tx && <div style={{ fontSize: 9.5, color: C.accent }}>{e.tx}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Math breakdown ── */}
        <Card>
          <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Mathematical Breakdown — On-Chain Formula
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
            {[
              { label:'Vesting Rate R',  val:`${(s.total / s.vestDays).toFixed(2)} BBT/day`,        col: typeCol  },
              { label:'Rate (per sec)',  val:`${(s.total / (s.vestDays * 86400)).toFixed(6)} T/s`,  col: typeCol  },
              { label:'Cliff Duration', val:`${s.cliffDays} days`,                                  col: C.ember  },
            ].map(x => (
              <div key={x.label} style={{
                padding: '12px 14px', background: 'rgba(255,255,255,.03)',
                borderRadius: 10, border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 9.5, color: C.muted, marginBottom: 4 }}>{x.label}</div>
                <div style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, color: x.col }}>{x.val}</div>
              </div>
            ))}
          </div>
          <div style={{
            fontFamily: C.mono, fontSize: 12, color: C.muted,
            background: 'rgba(0,0,0,.3)', borderRadius: 10, padding: '12px 16px',
            lineHeight: 1.8,
          }}>
            <span style={{ color: C.accent }}>claimable(t)</span>
            {' = min('}
            <span style={{ color: C.gold }}>{s.total.toLocaleString()}</span>
            {', '}
            <span style={{ color: C.green }}>R</span>
            {' × (t − stream_start)) − already_claimed'}
            <br />
            <span style={{ color: C.muted }}>// gated by: cliff_passed AND milestone_met</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
