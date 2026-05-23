'use client';

/**
 * /demo — BlockBite TDP Simulated Data Showcase
 *
 * ⚠  PASAL 207 COMPLIANCE NOTICE ⚠
 * All data on this page is SIMULATED for demonstration purposes only.
 * No real transactions, wallets, or on-chain accounts are represented here.
 * Real protocol data lives at: /streams, /analytics, /audit, /claim, /milestones
 *
 * This page exists to comply with Indonesian consumer protection law (UU 8/1999
 * Pasal 207 equivalent) — simulated data must not appear alongside real protocol
 * pages as it could mislead users about actual protocol activity.
 */

import Link from 'next/link';

// ─── Design System ────────────────────────────────────────────────────────────
const C = {
  bg0: '#05040d', bg1: '#09071a', bg2: '#0e0c22',
  accent: '#a78bff', gold: '#f5c66a', green: '#5fd07a',
  red: '#ff3b6b', blue: '#7ad7ff', purple: '#c084fc', ember: '#ff7a3a',
  muted: 'rgba(232,225,248,.38)', border: 'rgba(167,139,255,.13)',
  card: 'rgba(255,255,255,.042)',
  sora: "'Sora',system-ui,sans-serif",
  mono: "'JetBrains Mono',monospace",
  sg:   "'Space Grotesk',system-ui,sans-serif",
};

// ─── Simulated Streams ────────────────────────────────────────────────────────
const DEMO_STREAMS = [
  { id: 'stm-001', name: 'Team Allocation — Core Dev', token: 'BBT', total: 500_000, withdrawn: 62_500,  cliff: '2025-03-01', end: '2027-03-01', status: 'active',    type: 'linear',    beneficiary: '35z7X5…NxFzr' },
  { id: 'stm-002', name: 'Advisor Round',              token: 'BBT', total: 120_000, withdrawn: 12_000,  cliff: '2025-06-01', end: '2026-06-01', status: 'active',    type: 'milestone', beneficiary: 'B55a…1D3e'   },
  { id: 'stm-003', name: 'VC Seed — Partner A',        token: 'BBT', total: 750_000, withdrawn: 0,       cliff: '2026-01-01', end: '2028-01-01', status: 'active',    type: 'cliff',     beneficiary: 'E72f…9C4b'   },
  { id: 'stm-004', name: 'Community Rewards Q1',       token: 'BBT', total: 200_000, withdrawn: 200_000, cliff: '2025-01-01', end: '2025-04-01', status: 'completed', type: 'linear',    beneficiary: 'C91a…7Pqm'   },
  { id: 'stm-005', name: 'Game Rewards Pool',          token: 'BBT', total: 300_000, withdrawn: 45_000,  cliff: '2025-04-01', end: '2026-04-01', status: 'active',    type: 'milestone', beneficiary: 'F13b…8Qa1'   },
  { id: 'stm-006', name: 'Marketing Budget',           token: 'USDC', total: 50_000, withdrawn: 15_000,  cliff: '2025-02-01', end: '2025-12-01', status: 'cancelled', type: 'linear',    beneficiary: 'Aa7c…2Zqk'   },
];

// ─── Simulated Claimable Streams ──────────────────────────────────────────────
const DEMO_CLAIMS = [
  { id: 'stm-001', name: 'Team Allocation — Core Dev', token: 'BBT', claimable: 12_500,  total: 500_000, pct: 12.5,  cliffDate: 'Mar 1 2025',  endDate: 'Mar 1 2027' },
  { id: 'stm-005', name: 'Game Rewards Pool',          token: 'BBT', claimable: 8_750,   total: 300_000, pct: 15.0,  cliffDate: 'Apr 1 2025',  endDate: 'Apr 1 2026' },
  { id: 'stm-007', name: 'Hackathon Prize',            token: 'USDC', claimable: 500,    total: 1_000,   pct: 50.0,  cliffDate: 'Jan 1 2025',  endDate: 'Dec 31 2025' },
];

// ─── Simulated Audit Log ──────────────────────────────────────────────────────
const DEMO_AUDIT = [
  { sig: '4xBt7kRp...mN3A9z', ix: 'create_stream',        ts: '2025-05-20 14:32:11', ok: true,  color: C.accent,  icon: '＋' },
  { sig: '9mKj2pLq...vT8Wx1', ix: 'withdraw',             ts: '2025-05-20 09:15:44', ok: true,  color: C.green,   icon: '↓' },
  { sig: '3nQs8wFe...kR5Yz2', ix: 'create_stream',        ts: '2025-05-19 22:08:31', ok: true,  color: C.accent,  icon: '＋' },
  { sig: '7pXv4cGh...dL1Mn3', ix: 'fund_vault',           ts: '2025-05-19 18:44:09', ok: true,  color: '#c084fc', icon: '↑' },
  { sig: '2rYb6sDi...eK9No4', ix: 'verify_milestone',     ts: '2025-05-19 11:22:57', ok: true,  color: C.gold,    icon: '✓' },
  { sig: '8tZc0uEj...fJ7Lp5', ix: 'withdraw',             ts: '2025-05-18 20:01:33', ok: false, color: C.red,     icon: '✗' },
  { sig: '5qWa3vBk...gI4Kq6', ix: 'configure_milestones', ts: '2025-05-18 15:38:22', ok: true,  color: C.blue,    icon: '◉' },
  { sig: '1oUz5tAl...hH2Jr7', ix: 'cancel',               ts: '2025-05-17 08:14:10', ok: true,  color: C.red,     icon: '✗' },
  { sig: '6nVy4sZm...iG0Ks8', ix: 'update_proof',         ts: '2025-05-16 21:55:48', ok: true,  color: C.blue,    icon: '◈' },
  { sig: 'AmXu7rYn...jF8Lt9', ix: 'withdraw',             ts: '2025-05-16 14:30:15', ok: true,  color: C.green,   icon: '↓' },
  { sig: 'BpYv8sSo...kE6Mu0', ix: 'create_stream',        ts: '2025-05-15 09:07:42', ok: true,  color: C.accent,  icon: '＋' },
  { sig: 'CqZw9tTp...lD4Nv1', ix: 'fund_vault',           ts: '2025-05-14 23:44:19', ok: true,  color: '#c084fc', icon: '↑' },
  { sig: 'DrAx0uUq...mC2Ow2', ix: 'verify_milestone',     ts: '2025-05-13 16:21:56', ok: true,  color: C.gold,    icon: '✓' },
  { sig: 'EsBya1vV...nB0Px3', ix: 'withdraw',             ts: '2025-05-12 11:58:33', ok: true,  color: C.green,   icon: '↓' },
  { sig: 'FtCzb2wW...oA8Qy4', ix: 'create_stream',        ts: '2025-05-11 06:35:10', ok: false, color: C.red,     icon: '✗' },
];

// ─── Simulated Milestones ─────────────────────────────────────────────────────
const DEMO_MILESTONES = [
  {
    id: 'stm-002', name: 'Advisor Round', token: 'BBT', total: 120_000,
    milestones: [
      { label: 'Token Launch',       pct: 25, done: true,  method: 'manual',   date: '2025-03-01' },
      { label: 'Mainnet Deploy',     pct: 25, done: false, method: 'manual'   },
      { label: '10K Active Players', pct: 25, done: false, method: 'game'     },
      { label: 'Protocol V2',        pct: 25, done: false, method: 'multisig' },
    ],
  },
  {
    id: 'stm-005', name: 'Game Rewards Pool', token: 'BBT', total: 300_000,
    milestones: [
      { label: 'Level 10 Clear', pct: 20, done: true,  method: 'game', date: '2025-05-10' },
      { label: 'Level 30 Clear', pct: 30, done: true,  method: 'game', date: '2025-05-18' },
      { label: 'Level 50 Clear', pct: 50, done: false, method: 'game' },
    ],
  },
];

// ─── Simulated Analytics ──────────────────────────────────────────────────────
const DEMO_ANALYTICS = {
  tvl: '2.4M', active: 6, total: 15, distributed: '3.8M', claimableNow: '88K',
  byType:   [{ label: 'Linear',    pct: 40, col: C.blue   },
             { label: 'Milestone', pct: 35, col: C.gold   },
             { label: 'Cliff',     pct: 15, col: C.accent },
             { label: 'Hybrid',    pct: 10, col: C.purple }],
  byStatus: [{ label: 'Active',    pct: 53, col: C.green  },
             { label: 'Completed', pct: 27, col: C.muted  },
             { label: 'Cancelled', pct: 20, col: C.red    }],
};

// ─── Simulated Leaderboard ────────────────────────────────────────────────────
const DEMO_WINNERS = [
  { addr: 'Ph4nt...x9zK', amount: '142.80', act: 'Voidbreak',   rank: 1 },
  { addr: 'So1fl...mN3A', amount: '89.50',  act: 'Crystalline', rank: 2 },
  { addr: 'Cb1nW...pQ7R', amount: '53.20',  act: 'Nightfall',   rank: 3 },
  { addr: 'TrV5k...wE2B', amount: '38.90',  act: 'Verdant',     rank: 4 },
  { addr: 'Ld9xF...aH4C', amount: '24.10',  act: 'Stormlands',  rank: 5 },
  { addr: 'Ph8mD...uJ6T', amount: '182.00', act: 'Voidbreak',   rank: 1 },
  { addr: 'So3pA...kL8Y', amount: '71.40',  act: 'Crystalline', rank: 2 },
  { addr: 'Nm2qK...vG5S', amount: '44.60',  act: 'Inferno',     rank: 3 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RANK_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

function SectionHeader({ id, title, sub }: { id: string; title: string; sub: string }) {
  return (
    <div id={id} style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>
        DEMO · SIMULATED DATA
      </div>
      <h2 style={{ fontFamily: C.sg, fontSize: 22, fontWeight: 900, margin: '0 0 6px', color: '#fff' }}>{title}</h2>
      <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{sub}</p>
    </div>
  );
}

export default function DemoPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg0, color: '#f0ecff', fontFamily: C.sora, paddingBottom: 80 }}>

      {/* ── DEMO BANNER ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.gold}22, ${C.ember}18)`,
        border: `2px solid ${C.gold}55`,
        borderRadius: 0,
        padding: '18px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            padding: '6px 14px', borderRadius: 8, fontWeight: 900, fontSize: 12,
            background: C.gold, color: '#0b0918', letterSpacing: '2px',
          }}>⚠ DEMO MODE</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.gold }}>Simulated Data Only — Not Real Transactions</div>
            <div style={{ fontSize: 12, color: C.muted }}>
              Pasal 207 compliance: all data here is synthetic. Real on-chain data →{' '}
              <Link href="/streams" style={{ color: C.accent }}>Streams</Link> ·{' '}
              <Link href="/analytics" style={{ color: C.accent }}>Analytics</Link> ·{' '}
              <Link href="/audit" style={{ color: C.accent }}>Audit</Link> ·{' '}
              <Link href="/claim" style={{ color: C.accent }}>Claim</Link>
            </div>
          </div>
        </div>
        <Link href="/" style={{ fontSize: 12, color: C.muted, textDecoration: 'none', whiteSpace: 'nowrap' }}>← Back to App</Link>
      </div>

      {/* ── Page header ── */}
      <div style={{ padding: '48px 40px 32px', borderBottom: `1px solid ${C.border}` }}>
        <h1 style={{ fontFamily: C.sg, fontSize: 32, fontWeight: 900, margin: '0 0 10px' }}>
          BlockBite TDP — Feature Demo
        </h1>
        <p style={{ fontSize: 14, color: C.muted, maxWidth: 600, lineHeight: 1.7 }}>
          This page shows what every protocol feature looks like when populated with data.
          All addresses, amounts, and transactions are fabricated examples.
          No consumer data is shown here.
        </p>
        {/* Jump links */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          {[
            { href: '#streams',    label: 'Streams'    },
            { href: '#analytics',  label: 'Analytics'  },
            { href: '#audit',      label: 'Audit Log'  },
            { href: '#claim',      label: 'Claim'      },
            { href: '#milestones', label: 'Milestones' },
            { href: '#leaderboard',label: 'Leaderboard'},
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              padding: '7px 16px', borderRadius: 9,
              background: `${C.accent}18`, border: `1px solid ${C.accent}33`,
              color: C.accent, fontSize: 12, fontWeight: 600, textDecoration: 'none',
            }}>{l.label}</a>
          ))}
        </div>
      </div>

      <div style={{ padding: '40px 40px 0', display: 'flex', flexDirection: 'column', gap: 64 }}>

        {/* ═══════════════ STREAMS ═══════════════ */}
        <section>
          <SectionHeader id="streams" title="Streams Dashboard" sub="Simulated vesting streams — all types and statuses represented." />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.mono, fontSize: 11 }}>
              <thead>
                <tr style={{ background: C.bg2 }}>
                  {['Stream ID', 'Name', 'Type', 'Total', 'Withdrawn', 'Remaining', 'Cliff', 'End', 'Beneficiary', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 9.5, color: C.muted, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_STREAMS.map((s, i) => {
                  const remaining = s.total - s.withdrawn;
                  const statusColor = s.status === 'active' ? C.green : s.status === 'completed' ? C.blue : C.red;
                  const typeColor   = s.type === 'milestone' ? C.gold : s.type === 'cliff' ? C.accent : s.type === 'linear' ? C.blue : C.purple;
                  return (
                    <tr key={s.id} style={{ background: i % 2 ? 'rgba(255,255,255,.01)' : 'transparent', borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '10px 14px', color: C.accent }}>{s.id}</td>
                      <td style={{ padding: '10px 14px', color: '#fff', fontFamily: C.sora, fontSize: 12 }}>{s.name}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 9.5, background: `${typeColor}18`, border: `1px solid ${typeColor}44`, color: typeColor }}>{s.type}</span></td>
                      <td style={{ padding: '10px 14px', color: '#fff' }}>{s.total.toLocaleString()} {s.token}</td>
                      <td style={{ padding: '10px 14px', color: C.gold }}>{s.withdrawn.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', color: C.blue }}>{remaining.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', color: C.muted }}>{s.cliff}</td>
                      <td style={{ padding: '10px 14px', color: C.muted }}>{s.end}</td>
                      <td style={{ padding: '10px 14px', color: C.muted }}>{s.beneficiary}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10.5, fontWeight: 700, color: statusColor }}>{s.status.toUpperCase()}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>
            ↑ Simulated streams · Real streams at <Link href="/streams" style={{ color: C.accent }}>blockbite.vercel.app/streams</Link>
          </div>
        </section>

        {/* ═══════════════ ANALYTICS ═══════════════ */}
        <section>
          <SectionHeader id="analytics" title="Protocol Analytics" sub="Simulated protocol-wide metrics showing what mature adoption looks like." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Total Streams',      val: DEMO_ANALYTICS.total.toString(),   col: C.accent },
              { label: 'Active Streams',     val: DEMO_ANALYTICS.active.toString(),  col: C.green  },
              { label: 'TVL Locked (simul)', val: DEMO_ANALYTICS.tvl + ' tokens',    col: C.blue   },
              { label: 'Distributed (simul)',val: DEMO_ANALYTICS.distributed + ' t', col: C.gold   },
              { label: 'Claimable Now',      val: DEMO_ANALYTICS.claimableNow,       col: C.ember  },
            ].map(s => (
              <div key={s.label} style={{ padding: '14px 16px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 700, color: s.col }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[{ title: 'By Type', data: DEMO_ANALYTICS.byType }, { title: 'By Status', data: DEMO_ANALYTICS.byStatus }].map(g => (
              <div key={g.title} style={{ padding: '18px 20px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 14, letterSpacing: '.06em', textTransform: 'uppercase' }}>{g.title}</div>
                {g.data.map(d => (
                  <div key={d.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: d.col }}>{d.label}</span>
                      <span style={{ fontFamily: C.mono, color: d.col, fontWeight: 700 }}>{d.pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.07)' }}>
                      <div style={{ height: '100%', width: `${d.pct}%`, borderRadius: 99, background: d.col, opacity: .7, transition: 'width .5s' }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>↑ Simulated · Real analytics at <Link href="/analytics" style={{ color: C.accent }}>/analytics</Link></div>
        </section>

        {/* ═══════════════ AUDIT LOG ═══════════════ */}
        <section>
          <SectionHeader id="audit" title="Audit Trail" sub="Simulated transaction log showing all 7 instruction types." />
          <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 160px 160px 100px', padding: '8px 20px', background: 'rgba(255,255,255,.03)', borderBottom: `1px solid ${C.border}` }}>
              {['', 'SIGNATURE', 'INSTRUCTION', 'TIMESTAMP (UTC)', 'STATUS'].map(h => (
                <div key={h} style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, letterSpacing: '.06em' }}>{h}</div>
              ))}
            </div>
            {DEMO_AUDIT.map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 160px 160px 100px',
                padding: '11px 20px', borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
                background: !row.ok ? '#f871710a' : i % 2 ? 'rgba(255,255,255,.01)' : 'transparent',
                alignItems: 'center',
              }}>
                <div style={{ fontSize: 14, color: row.color, textAlign: 'center' }}>{row.icon}</div>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.accent }}>{row.sig}</div>
                <div><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 700, background: `${row.color}18`, border: `1px solid ${row.color}44`, color: row.color, fontFamily: C.mono }}>{row.ix}</span></div>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>{row.ts}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: row.ok ? C.green : C.red }}>{row.ok ? '✓ OK' : '✗ FAILED'}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>↑ Simulated · Real audit trail at <Link href="/audit" style={{ color: C.accent }}>/audit</Link></div>
        </section>

        {/* ═══════════════ CLAIM ═══════════════ */}
        <section>
          <SectionHeader id="claim" title="Claim Portal" sub="Simulated claimable streams for a demo beneficiary wallet." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {DEMO_CLAIMS.map(s => (
              <div key={s.id} style={{ padding: '20px 24px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>
                    {s.id} · Cliff {s.cliffDate} → End {s.endDate}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9.5, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Claimable</div>
                    <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 700, color: C.green }}>{s.claimable.toLocaleString()} {s.token}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9.5, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Progress</div>
                    <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 700, color: C.blue }}>{s.pct.toFixed(1)}%</div>
                  </div>
                  <button disabled style={{ padding: '10px 22px', borderRadius: 11, background: `${C.green}44`, border: `1px solid ${C.green}55`, color: C.green, fontWeight: 700, fontSize: 13, fontFamily: C.sora, cursor: 'not-allowed', opacity: .6 }}>
                    Withdraw ↓ (demo)
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>↑ Simulated · Real claim at <Link href="/claim" style={{ color: C.accent }}>/claim</Link></div>
        </section>

        {/* ═══════════════ MILESTONES ═══════════════ */}
        <section>
          <SectionHeader id="milestones" title="Milestone Verification" sub="Simulated milestone-gated streams showing Game, Oracle, MultiSig and Manual verification." />
          {DEMO_MILESTONES.map(s => {
            const verifiedPct = s.milestones.filter(m => m.done).reduce((a, m) => a + m.pct, 0);
            const MCOL: Record<string, string> = { game: C.purple, oracle: C.blue, multisig: C.gold, manual: C.green };
            return (
              <div key={s.id} style={{ marginBottom: 24, padding: '20px 24px', borderRadius: 16, background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 2 }}>{s.name}</div>
                    <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>{s.id} · {s.total.toLocaleString()} {s.token} total</div>
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 13, color: C.blue, fontWeight: 700 }}>{verifiedPct}% unlocked</div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.07)', marginBottom: 16 }}>
                  <div style={{ height: '100%', width: `${verifiedPct}%`, borderRadius: 99, background: C.blue, transition: 'width .5s' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {s.milestones.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: m.done ? `${C.green}06` : 'rgba(255,255,255,.02)', border: `1px solid ${m.done ? C.green+'33' : 'rgba(255,255,255,.07)'}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: C.mono, fontSize: 12, fontWeight: 700, background: m.done ? `${C.green}20` : 'rgba(255,255,255,.06)', border: `2px solid ${m.done ? C.green : 'rgba(255,255,255,.1)'}`, color: m.done ? C.green : C.muted }}>
                        {m.done ? '✓' : i}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: m.done ? '#fff' : C.muted }}>{m.label}</span>
                        {m.done && m.date && <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginLeft: 10 }}>Verified {m.date}</span>}
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 9.5, fontWeight: 700, background: `${MCOL[m.method]}18`, color: MCOL[m.method], border: `1px solid ${MCOL[m.method]}33` }}>{m.method}</span>
                      <span style={{ fontFamily: C.mono, fontSize: 11, color: m.done ? C.green : C.muted, fontWeight: 700 }}>{m.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 11, color: C.muted }}>↑ Simulated · Real milestones at <Link href="/milestones" style={{ color: C.accent }}>/milestones</Link></div>
        </section>

        {/* ═══════════════ LEADERBOARD ═══════════════ */}
        <section>
          <SectionHeader id="leaderboard" title="Game Leaderboard" sub="Simulated prize winners from the BlockBite puzzle game. Real leaderboard populates after mainnet launch." />
          <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 120px 120px', padding: '10px 20px', background: 'rgba(255,255,255,.03)', borderBottom: `1px solid ${C.border}` }}>
              {['RANK', 'WALLET', 'ACT', 'PRIZE (USDC)', ''].map(h => (
                <div key={h} style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {DEMO_WINNERS.map((w, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 120px 120px', padding: '12px 20px', borderTop: i === 0 ? 'none' : `1px solid ${C.border}`, background: i % 2 ? 'rgba(255,255,255,.01)' : 'transparent', alignItems: 'center' }}>
                <div style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 900, color: RANK_COLORS[w.rank] ?? C.muted }}>#{w.rank}</div>
                <div style={{ fontFamily: C.mono, fontSize: 12, color: '#fff' }}>{w.addr}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{w.act}</div>
                <div style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, color: C.green }}>+{w.amount}</div>
                <div style={{ fontSize: 10, color: C.muted }}>SIMULATED</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>↑ Simulated · Real leaderboard populates after mainnet. Play now at <Link href="/game" style={{ color: C.accent }}>/game</Link></div>
        </section>

      </div>

      {/* Footer */}
      <div style={{ marginTop: 64, padding: '24px 40px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12, color: C.muted }}>
        <div>
          <span style={{ background: C.gold, color: '#0b0918', padding: '2px 8px', borderRadius: 4, fontWeight: 900, fontSize: 10, letterSpacing: '1.5px', marginRight: 10 }}>DEMO</span>
          All data on this page is simulated · Not connected to Solana · Pasal 207 compliant
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/streams"   style={{ color: C.accent, textDecoration: 'none' }}>Real Streams</Link>
          <Link href="/analytics" style={{ color: C.accent, textDecoration: 'none' }}>Real Analytics</Link>
          <Link href="/audit"     style={{ color: C.accent, textDecoration: 'none' }}>Real Audit</Link>
          <Link href="/"          style={{ color: C.muted,  textDecoration: 'none' }}>← Home</Link>
        </div>
      </div>
    </div>
  );
}
