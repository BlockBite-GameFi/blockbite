'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getStoredReports, clearReports, ErrorReport, ErrorSeverity } from '@/lib/analytics/errorReporter';
import { TIER_COLORS } from '@/lib/game/stages';

const SEV_COLOR: Record<ErrorSeverity, string> = {
  crash:   '#FF2244',
  error:   '#FF8800',
  warning: '#FFD700',
  info:    '#00F5FF',
};

export default function DevDashboard() {
  const [reports, setReports]     = useState<ErrorReport[]>([]);
  const [filter, setFilter]       = useState<ErrorSeverity | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [expanded, setExpanded]   = useState<string | null>(null);

  const load = useCallback(() => setReports(getStoredReports()), []);

  useEffect(() => { load(); }, [load]);

  const visible = reports.filter(r => {
    if (filter !== 'all' && r.severity !== filter) return false;
    if (tierFilter !== 'all' && r.tierCode !== tierFilter) return false;
    return true;
  });

  const countBySev = (s: ErrorSeverity) => reports.filter(r => r.severity === s).length;
  const byLevel = Object.entries(
    reports.reduce<Record<string, number>>((acc, r) => {
      acc[r.stageName] = (acc[r.stageName] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const tiers = Array.from(new Set(reports.map(r => r.tierCode)));

  function handleClear() {
    if (confirm('Clear all error reports from localStorage?')) {
      clearReports();
      load();
    }
  }

  return (
    <div style={{ background: '#060614', minHeight: '100vh', color: '#CCCCEE', fontFamily: 'monospace', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '2px', color: '#FF2244' }}>
          DEV DASHBOARD
        </div>
        <div style={{ fontSize: '12px', color: '#55557A' }}>BlockBite Error Analytics · stored in localStorage</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={load} style={btnStyle('#00F5FF')}>↻ Refresh</button>
          <button onClick={handleClear} style={btnStyle('#FF2244')}>Clear All</button>
          <Link href="/" style={{ ...btnStyle('#5533AA'), textDecoration: 'none' }}>← Home</Link>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {(['crash','error','warning','info'] as ErrorSeverity[]).map(s => (
          <div key={s} style={{ background: '#0D0D22', border: `1px solid ${SEV_COLOR[s]}33`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: SEV_COLOR[s] }}>{countBySev(s)}</div>
            <div style={{ fontSize: '11px', color: '#55557A', textTransform: 'uppercase', letterSpacing: '1px' }}>{s}s</div>
          </div>
        ))}
        <div style={{ background: '#0D0D22', border: '1px solid #33335566', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>{reports.length}</div>
          <div style={{ fontSize: '11px', color: '#55557A', textTransform: 'uppercase', letterSpacing: '1px' }}>TOTAL</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Top-10 stages with errors */}
        <div style={{ background: '#0D0D22', border: '1px solid #33334488', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', color: '#8888BB', marginBottom: '16px' }}>
            TOP STAGES BY ERRORS
          </div>
          {byLevel.length === 0 && <div style={{ color: '#55557A', fontSize: '12px' }}>No data yet — play to generate reports.</div>}
          {byLevel.map(([stage, count]) => {
            const tierCode = stage.split('-')[0];
            const color = TIER_COLORS[Object.keys(TIER_COLORS).find(k => k.slice(0,3).toUpperCase() === tierCode.slice(0,3).toUpperCase()) ?? 'Rookie'] ?? '#88BBFF';
            const pct = reports.length > 0 ? Math.round((count / reports.length) * 100) : 0;
            return (
              <div key={stage} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color }}>{stage}</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{count}</span>
                </div>
                <div style={{ background: '#11112A', borderRadius: '4px', height: '6px' }}>
                  <div style={{ background: color, width: `${pct}%`, height: '6px', borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Report list */}
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {(['all','crash','error','warning','info'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{ ...btnStyle(filter === s ? '#9945FF' : '#22225A'), fontSize: '11px' }}>
                {s.toUpperCase()}
              </button>
            ))}
            <div style={{ width: '1px', background: '#33335A' }} />
            {['all', ...tiers].map(t => (
              <button key={t} onClick={() => setTierFilter(t)} style={{ ...btnStyle(tierFilter === t ? '#00F5FF' : '#22225A'), fontSize: '11px' }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ background: '#0D0D22', border: '1px solid #33334488', borderRadius: '12px', overflow: 'hidden' }}>
            {visible.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#55557A', fontSize: '14px' }}>
                No reports match the current filter.
              </div>
            )}
            {visible.slice(0, 50).map(r => (
              <div key={r.id} style={{ borderBottom: '1px solid #1A1A33', padding: '12px 16px', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: SEV_COLOR[r.severity], minWidth: '60px', textTransform: 'uppercase' }}>
                    {r.severity}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9988DD', minWidth: '120px' }}>{r.stageName}</span>
                  <span style={{ flex: 1, fontSize: '12px', color: '#CCCCEE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.message}
                  </span>
                  <span style={{ fontSize: '10px', color: '#55557A', minWidth: '80px', textAlign: 'right' }}>
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {expanded === r.id && (
                  <div style={{ marginTop: '10px', fontSize: '11px', color: '#8888AA', background: '#0A0A1E', borderRadius: '6px', padding: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {r.component && <div>Component: <span style={{ color: '#00F5FF' }}>{r.component}</span></div>}
                    {r.walletAddress && <div>Wallet: {r.walletAddress}</div>}
                    {r.sessionId !== 'unknown' && <div>Session: {r.sessionId}</div>}
                    {r.stack && <div style={{ marginTop: '6px', color: '#FF8800' }}>{r.stack.slice(0, 800)}</div>}
                    {r.extra && <div style={{ marginTop: '6px' }}>{JSON.stringify(r.extra, null, 2)}</div>}
                  </div>
                )}
              </div>
            ))}
            {visible.length > 50 && (
              <div style={{ padding: '12px', textAlign: 'center', color: '#55557A', fontSize: '12px' }}>
                Showing 50 of {visible.length} reports
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return {
    background: `${color}22`,
    border: `1px solid ${color}66`,
    color: color,
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'monospace',
  };
}
