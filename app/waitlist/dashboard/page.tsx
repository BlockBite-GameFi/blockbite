'use client';
import { useState, useEffect, useCallback } from 'react';

const BG     = '#0a0a0f';
const CARD   = '#13131a';
const CARD2  = '#0f0f16';
const PURPLE = '#7c3aed';
const TEAL   = '#0891b2';
const GREEN  = '#10b981';
const GOLD   = '#d97706';
const RED    = '#dc2626';
const BLUE   = '#3b82f6';
const TEXT   = '#f1f5f9';
const MUTED  = '#64748b';
const BORDER = '#1e293b';

type Entry      = { email: string; ts: number };
type PageStat   = { path: string; views: number; sessions: number };
type TotalStats = { totalViews: number; uniqueVisitors: number; today: number; tableReady: boolean };

const SQL_SETUP = `-- Run this once in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS page_views (
  id          bigserial PRIMARY KEY,
  path        text NOT NULL,
  session_id  text NOT NULL DEFAULT 'anon',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pv_path    ON page_views (path);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views (created_at);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_insert"    ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "service_select" ON page_views FOR SELECT USING (true);`;

function downloadCSV(entries: Entry[]) {
  const rows = entries.map(e => {
    const d = new Date(e.ts);
    return `"${e.email}","${d.toLocaleDateString('en-GB')}","${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}"`;
  });
  const csv = ['Email,Date,Time', ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `blockbite-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function StatCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ color, fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: PURPLE, fontSize: 11, fontWeight: 700, marginTop: 2 }}>{sub}</div>}
      <div style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: TEXT, fontWeight: 700, fontSize: 15 }}>{title}</span>
        {badge && (
          <span style={{ background: '#1e1b4b', color: '#a5b4fc', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [loggedIn, setLoggedIn]     = useState(false);
  const [authError, setAuthError]   = useState('');
  const [loading, setLoading]       = useState(false);
  const token = password;

  // Waitlist state
  const [entries, setEntries]       = useState<Entry[]>([]);
  const [wlCount, setWlCount]       = useState(0);
  const [wlFetched, setWlFetched]   = useState(false);
  const [wlError, setWlError]       = useState('');
  const [deleting, setDeleting]     = useState<string | null>(null);

  // Analytics state
  const [pageStats, setPageStats]   = useState<PageStat[] | null>(null);
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showSQL, setShowSQL]       = useState(false);
  const [sqlCopied, setSqlCopied]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setAuthError('Enter username and password'); return; }
    if (username.trim() !== 'nayrbryanGaming') { setAuthError('Invalid username'); return; }
    setLoading(true); setAuthError('');
    try {
      const res = await fetch('/api/waitlist/list', { headers: { 'x-admin-token': token.trim() } });
      if (res.status === 401) { setAuthError('Invalid token'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWlCount(data.count ?? 0);
      setEntries(data.entries ?? []);
      setWlFetched(true);
      setLoggedIn(true);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Failed to authenticate');
    } finally { setLoading(false); }
  }

  const fetchWaitlist = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setWlError('');
    try {
      const res = await fetch('/api/waitlist/list', { headers: { 'x-admin-token': token.trim() }, cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWlCount(data.count ?? 0); setEntries(data.entries ?? []); setWlFetched(true);
    } catch (err: unknown) {
      if (!silent) setWlError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally { if (!silent) setLoading(false); }
  }, [token]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/admin/analytics', { headers: { 'x-admin-token': token.trim() }, cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setPageStats(data.pageStats ?? null);
      setTotalStats(data.totalStats ?? null);
    } catch { /* silent */ } finally { setAnalyticsLoading(false); }
  }, [token]);

  const refreshAll = useCallback(() => {
    fetchWaitlist();
    fetchAnalytics();
  }, [fetchWaitlist, fetchAnalytics]);

  // Poll every 30s + on tab focus
  useEffect(() => {
    if (!loggedIn) return;
    fetchAnalytics();
    const tick = () => { fetchWaitlist(true); };
    const id = setInterval(tick, 30_000);
    const onVis = () => { if (document.visibilityState === 'visible') { tick(); fetchAnalytics(); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [loggedIn, fetchWaitlist, fetchAnalytics]);

  async function deleteEntry(email: string) {
    if (!confirm(`Delete ${email} from waitlist?`)) return;
    setDeleting(email);
    try {
      const res = await fetch(`/api/waitlist/list?email=${encodeURIComponent(email)}`, { method: 'DELETE', headers: { 'x-admin-token': token.trim() } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEntries(prev => prev.filter(e => e.email !== email));
      setWlCount(prev => Math.max(0, prev - 1));
    } catch { alert('Delete failed. Try again.'); } finally { setDeleting(null); }
  }

  function copySQL() {
    navigator.clipboard.writeText(SQL_SETUP).then(() => { setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2000); }).catch(() => {});
  }

  // ── Login screen ──
  if (!loggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 40, width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>◆</div>
            <h1 style={{ color: TEXT, fontSize: 22, fontWeight: 700, margin: 0 }}>BlockBite Admin</h1>
            <p style={{ color: MUTED, fontSize: 13, marginTop: 6 }}>Analytics & Waitlist Dashboard</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username"
              style={{ background: '#0f172a', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, padding: '12px 16px', fontSize: 15, outline: 'none' }} />
            <input type="password" placeholder="Password / Admin Token" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
              style={{ background: '#0f172a', border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, padding: '12px 16px', fontSize: 15, outline: 'none' }} />
            {authError && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{authError}</p>}
            <button type="submit" disabled={loading}
              style={{ background: `linear-gradient(135deg, ${PURPLE}, ${TEAL})`, color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main dashboard ──
  const tableReady = totalStats?.tableReady ?? false;
  const topPages   = pageStats?.slice(0, 15) ?? [];

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '24px 16px', fontFamily: 'system-ui, sans-serif', color: TEXT }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ color: TEXT, fontSize: 24, fontWeight: 800, margin: 0 }}>BlockBite Admin</h1>
            <p style={{ color: MUTED, fontSize: 13, margin: '4px 0 0' }}>Analytics + Waitlist Dashboard · nayrbryangaming</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {entries.length > 0 && (
              <button type="button" onClick={() => downloadCSV(entries)}
                style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Download CSV
              </button>
            )}
            <button type="button" onClick={refreshAll} disabled={loading}
              style={{ background: PURPLE, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Refreshing...' : '↻ Refresh All'}
            </button>
          </div>
        </div>

        {/* ─── ANALYTICS SECTION ─── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: '1.8px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
            ◈ Website Analytics {analyticsLoading && <span style={{ color: PURPLE, marginLeft: 8 }}>loading…</span>}
          </div>
        </div>

        {/* Analytics stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 20 }}>
          <StatCard label="Total Page Views"    value={tableReady ? (totalStats?.totalViews ?? 0).toLocaleString() : '—'} color={BLUE}   />
          <StatCard label="Unique Visitors"     value={tableReady ? (totalStats?.uniqueVisitors ?? 0).toLocaleString() : '—'} color={PURPLE} />
          <StatCard label="Views Today"         value={tableReady ? (totalStats?.today ?? 0).toLocaleString() : '—'} color={GREEN}  />
          <StatCard label="Waitlist Signups"    value={wlCount.toLocaleString()}  color={GOLD}   />
        </div>

        {/* Per-page breakdown */}
        <Section title="Page Views Breakdown" badge={tableReady ? `${topPages.length} pages` : 'setup needed'}>
          {!tableReady ? (
            <div style={{ padding: '24px 20px' }}>
              <p style={{ color: MUTED, fontSize: 13, margin: '0 0 12px' }}>
                Analytics table not yet created in Supabase. Run this SQL once to enable page-view tracking:
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#94a3b8', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{SQL_SETUP}</pre>
                <button type="button" onClick={copySQL}
                  style={{ position: 'absolute', top: 8, right: 8, background: sqlCopied ? GREEN : PURPLE, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {sqlCopied ? '✓ Copied' : 'Copy SQL'}
                </button>
              </div>
              <p style={{ color: MUTED, fontSize: 11, marginTop: 8 }}>
                Go to <strong style={{ color: TEXT }}>supabase.com → SQL Editor</strong> → paste → Run. Then refresh this page.
              </p>
            </div>
          ) : topPages.length === 0 ? (
            <div style={{ color: MUTED, padding: '40px', textAlign: 'center', fontSize: 14 }}>
              No page views recorded yet. Visit the site to start tracking.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Page', 'Page Views', 'Unique Visitors', '% of Total'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Page' ? 'left' : 'right', color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((p, i) => {
                    const pct = totalStats?.totalViews ? ((p.views / totalStats.totalViews) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={p.path} style={{ borderBottom: i < topPages.length - 1 ? `1px solid ${BORDER}` : 'none', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: TEXT, fontFamily: 'monospace' }}>{p.path}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: BLUE,   textAlign: 'right', fontWeight: 700 }}>{p.views.toLocaleString()}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: PURPLE, textAlign: 'right', fontWeight: 700 }}>{p.sessions.toLocaleString()}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: MUTED,  textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <div style={{ width: 60, height: 4, borderRadius: 2, background: BORDER, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: BLUE, borderRadius: 2 }} />
                            </div>
                            {pct}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ─── WAITLIST SECTION ─── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: '1.8px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
            ◎ Waitlist Signups
          </div>
        </div>

        {/* Waitlist meta cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 20 }}>
          <StatCard label="Total Signups" value={wlCount} color={PURPLE} />
          <StatCard label="DB Status"     value={wlFetched ? 'Live' : 'Ready'} color={TEAL} />
          <StatCard label="Latest Signup" value={entries[0] ? new Date(entries[0].ts).toLocaleDateString('en-GB') : 'None'} color={GOLD} />
          <StatCard label="This Week"
            value={entries.filter(e => e.ts > Date.now() - 7 * 86400_000).length}
            color={GREEN} />
        </div>

        {wlError && (
          <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '14px 18px', color: '#f87171', marginBottom: 20, fontSize: 14 }}>
            Error: {wlError}
          </div>
        )}

        {/* Signups table */}
        <Section title="Signups" badge={`${wlCount} total`}>
          {!wlFetched ? (
            <div style={{ color: MUTED, padding: 40, textAlign: 'center', fontSize: 14 }}>Loading…</div>
          ) : entries.length === 0 ? (
            <div style={{ color: MUTED, padding: 40, textAlign: 'center', fontSize: 14 }}>No signups yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['#', 'Email', 'Date', 'Time', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Actions' ? 'center' : 'left', color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => {
                    const d = new Date(entry.ts);
                    const isDel = deleting === entry.email;
                    return (
                      <tr key={entry.email} style={{ borderBottom: i < entries.length - 1 ? `1px solid ${BORDER}` : 'none', opacity: isDel ? 0.4 : 1, transition: 'opacity .2s' }}>
                        <td style={{ padding: '12px 16px', color: MUTED, fontSize: 13, width: 40 }}>{i + 1}</td>
                        <td style={{ padding: '12px 16px', color: TEXT, fontSize: 14 }}>{entry.email}</td>
                        <td style={{ padding: '12px 16px', color: MUTED, fontSize: 13 }}>{d.toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '12px 16px', color: MUTED, fontSize: 13 }}>{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button type="button" onClick={() => deleteEntry(entry.email)} disabled={!!deleting}
                            style={{ background: 'transparent', color: RED, border: `1px solid ${RED}44`, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.5 : 1 }}>
                            {isDel ? '…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* SQL setup toggle (for reference) */}
        {tableReady && (
          <div style={{ marginBottom: 20 }}>
            <button type="button" onClick={() => setShowSQL(v => !v)}
              style={{ background: 'transparent', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
              {showSQL ? 'Hide' : 'Show'} Analytics SQL (Supabase setup)
            </button>
            {showSQL && (
              <div style={{ marginTop: 12, position: 'relative' }}>
                <pre style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#94a3b8', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{SQL_SETUP}</pre>
                <button type="button" onClick={copySQL}
                  style={{ position: 'absolute', top: 8, right: 8, background: sqlCopied ? GREEN : PURPLE, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {sqlCopied ? '✓ Copied' : 'Copy SQL'}
                </button>
              </div>
            )}
          </div>
        )}

        <p style={{ color: MUTED, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
          BlockBite Admin · Waitlist from Supabase · Page views via /api/track · Auto-refreshes every 30s
        </p>
      </div>
    </div>
  );
}
