'use client';

import Link from 'next/link';

// ─── Design tokens ──────────────────────────────────────────────────────────
const T = {
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

// ─── Protocol comparison data ─────────────────────────────────────────────────
const COMPARE = [
  { feat:'Linear Vesting',   bb:true,  sab:true,  sf:true  },
  { feat:'Cliff Schedule',   bb:true,  sab:true,  sf:false },
  { feat:'Milestone Unlock', bb:true,  sab:false, sf:false },
  { feat:'Hybrid Model',     bb:true,  sab:false, sf:false },
  { feat:'In-game Rewards',  bb:true,  sab:false, sf:false },
  { feat:'NFT Stream Proof', bb:true,  sab:true,  sf:false },
  { feat:'Multi-token',      bb:true,  sab:false, sf:true  },
  { feat:'Cancel & Modify',  bb:true,  sab:true,  sf:true  },
  { feat:'Cliff + Linear',   bb:true,  sab:true,  sf:false },
  { feat:'Dashboard UI',     bb:true,  sab:true,  sf:true  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 20px', ...style }}>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, color: T.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: T.muted }}>{sub}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProtocolPage() {
  return (
    <div style={{ minHeight: '100vh', background: T.bg0, padding: '0 0 60px' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '32px 40px 20px',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <h1 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
            Protocol Overview
          </h1>
          <p style={{ fontSize: 12.5, color: T.muted, margin: '4px 0 0' }}>
            BlockBite as infrastructure — for project admins, investors &amp; advisors
          </p>
        </div>
        <Link href="/streams/new" style={{
          display: 'inline-block',
          padding: '9px 22px', borderRadius: 10, border: 'none',
          background: `linear-gradient(135deg, ${T.accent}cc, ${T.accent})`,
          color: '#fff', fontSize: 13, fontWeight: 700,
          textDecoration: 'none', fontFamily: T.serif,
          boxShadow: `0 0 20px ${T.accent}44`,
        }}>
          Start Streaming →
        </Link>
      </div>

      <div style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Hero value prop ── */}
        <div style={{
          padding: '32px 28px', borderRadius: 20,
          background: `linear-gradient(135deg, ${T.bg2}, #1a0e38)`,
          border: `1.5px solid ${T.accent}33`,
          boxShadow: `0 0 60px ${T.accent}0d`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow orb */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: T.accent, opacity: 0.04, filter: 'blur(60px)',
            pointerEvents: 'none',
          }} />

          <h2 style={{
            fontFamily: T.serif, fontSize: 28, fontWeight: 800, color: '#fff',
            lineHeight: 1.2, margin: '0 0 12px', maxWidth: 480,
          }}>
            Stop Distributing Tokens Blindly
          </h2>
          <p style={{
            fontSize: 14, color: 'rgba(232,225,248,.7)',
            maxWidth: 520, lineHeight: 1.7, margin: '0 0 24px',
          }}>
            BlockBite TDP is a programmable token distribution protocol.
            Create configurable vesting streams with cliff, milestone, linear,
            and hybrid schedules — backed by audited smart contracts.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/streams/new" style={{
              display: 'inline-block',
              padding: '11px 24px', borderRadius: 10,
              background: `linear-gradient(135deg, ${T.accent}cc, ${T.accent})`,
              color: '#fff', fontSize: 14, fontWeight: 700,
              textDecoration: 'none', fontFamily: T.serif,
              boxShadow: `0 0 20px ${T.accent}44`,
            }}>
              Create Stream
            </Link>
            <button style={{
              padding: '11px 24px', borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: 'rgba(255,255,255,.04)',
              color: T.muted, fontSize: 14,
              cursor: 'pointer', fontFamily: T.serif,
            }}>
              Read Docs ↗
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { label:'Total Value Locked', value:'$2.4M',  sub:'in protocol vaults',  color:T.gold   },
            { label:'Active Streams',     value:'1,840',  sub:'across all projects',  color:T.accent },
            { label:'Tokens Distributed', value:'48M+',   sub:'BBT distributed',      color:T.green  },
            { label:'Protocol Uptime',    value:'99.98%', sub:'since mainnet deploy', color:T.blue   },
          ].map(s => (
            <Card key={s.label} style={{ padding: '18px 18px' }}>
              <StatBox {...s} />
            </Card>
          ))}
        </div>

        {/* ── Vesting models ── */}
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            Vesting Models
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {[
              { type:'Linear',    col:T.accent,  icon:'📈', desc:'Constant unlock rate after cliff. Ideal for team & advisor allocations.'     },
              { type:'Cliff',     col:T.gold,    icon:'🪨', desc:'Hard lock until milestone, then immediate release. Simple & predictable.'     },
              { type:'Milestone', col:T.blue,    icon:'🏁', desc:'Percentage unlocks tied to product deliverables. Accountability-first.'       },
              { type:'Hybrid',    col:'#c084fc', icon:'⚡', desc:'Cliff + linear curve. Best of both: initial lock with gradual release.'       },
            ].map(m => (
              <Card key={m.type} style={{ padding: '18px 20px', display: 'flex', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${m.col}18`, border: `1px solid ${m.col}44`,
                  display: 'grid', placeItems: 'center', fontSize: 22,
                }}>
                  {m.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: m.col, fontFamily: T.serif, marginBottom: 4 }}>
                    {m.type}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{m.desc}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Comparison table ── */}
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            Protocol Comparison
          </div>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,.04)' }}>
                  <th style={{
                    padding: '12px 20px', textAlign: 'left',
                    fontSize: 11, color: T.muted, letterSpacing: '.06em', fontWeight: 600,
                  }}>
                    FEATURE
                  </th>
                  {[
                    { name:'BlockBite TDP', col:T.accent },
                    { name:'Sablier v2',    col:T.muted  },
                    { name:'Superfluid',    col:T.muted  },
                  ].map(p => (
                    <th key={p.name} style={{
                      padding: '12px 20px', textAlign: 'center',
                      fontSize: 11, color: p.col, letterSpacing: '.04em', fontWeight: 700,
                    }}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((r, i) => (
                  <tr key={r.feat} style={{
                    borderTop: `1px solid ${T.border}`,
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)',
                  }}>
                    <td style={{ padding: '10px 20px', fontSize: 12, color: 'rgba(232,225,248,.75)' }}>
                      {r.feat}
                    </td>
                    {[r.bb, r.sab, r.sf].map((v, j) => (
                      <td key={j} style={{ padding: '10px 20px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 16,
                          color: v ? (j === 0 ? T.green : T.muted) : 'rgba(255,255,255,.15)',
                        }}>
                          {v ? '✓' : '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* ── How it works ── */}
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            How It Works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              { step:'01', title:'Configure',  icon:'⚙️', desc:'Choose stream type: linear, cliff, milestone, or hybrid. Set amounts and schedule.' },
              { step:'02', title:'Deploy',     icon:'🚀', desc:'Tokens lock into a PDA vault on Solana. Smart contract enforces all rules on-chain.'  },
              { step:'03', title:'Verify',     icon:'✅', desc:'Milestone gates unlock via oracle, multi-sig, or game state verification.'            },
              { step:'04', title:'Claim',      icon:'💎', desc:'Recipient withdraws vested tokens at any time. Math is enforced by the program.'      },
            ].map(s => (
              <Card key={s.step} style={{ textAlign: 'center', padding: '20px 16px' }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '.15em',
                  color: T.accent, marginBottom: 8, fontFamily: T.mono,
                }}>
                  STEP {s.step}
                </div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: T.serif }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.6 }}>{s.desc}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── CTA card ── */}
        <div style={{
          padding: '28px 24px', textAlign: 'center',
          border: `1.5px solid ${T.accent}33`,
          borderRadius: 20,
          background: `linear-gradient(135deg,${T.bg1},${T.bg2})`,
        }}>
          <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Ready to stream your tokens?
          </div>
          <p style={{
            fontSize: 13, color: T.muted,
            maxWidth: 400, margin: '0 auto 18px',
            lineHeight: 1.7,
          }}>
            Set up your first vesting stream in under 3 minutes.
            No code required — full smart contract coverage.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/streams/new" style={{
              display: 'inline-block',
              padding: '12px 28px', borderRadius: 10,
              background: `linear-gradient(135deg, ${T.accent}cc, ${T.accent})`,
              color: '#fff', fontSize: 14, fontWeight: 700,
              textDecoration: 'none', fontFamily: T.serif,
              boxShadow: `0 0 20px ${T.accent}44`,
            }}>
              Create Stream →
            </Link>
            <Link href="/streams" style={{
              display: 'inline-block',
              padding: '12px 28px', borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: 'rgba(255,255,255,.04)',
              color: T.muted, fontSize: 14,
              textDecoration: 'none', fontFamily: T.serif,
            }}>
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
