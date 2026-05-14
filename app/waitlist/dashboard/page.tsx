'use client';
import { useState } from 'react';

const BG = '#0a0a0f';
const CARD = '#13131a';
const PURPLE = '#7c3aed';
const TEAL = '#0891b2';
const GOLD = '#d97706';
const TEXT = '#f1f5f9';
const MUTED = '#64748b';
const BORDER = '#1e293b';

const ADMIN_USER = 'nayrbryanGaming';
const ADMIN_PASS = 'nayrbryanGaming';
const ADMIN_TOKEN = 'nayrbryanGaming_admin_2025';

type Entry = { email: string; ts: number };

export default function DashboardPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [count, setCount] = useState(0);
  const [fetched, setFetched] = useState(false);
  const [fetchError, setFetchError] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setLoggedIn(true);
      setLoginError('');
      fetchEntries();
    } else {
      setLoginError('Invalid credentials');
    }
  }

  async function fetchEntries() {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch(`/api/waitlist/list?token=${ADMIN_TOKEN}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCount(data.count ?? 0);
      setEntries(data.entries ?? []);
      setFetched(true);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }

  if (!loggedIn) {
    return (
      <div style={{
        minHeight: '100vh', background: BG, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px',
          padding: '40px', width: '100%', maxWidth: '400px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>◆</div>
            <h1 style={{ color: TEXT, fontSize: '22px', fontWeight: 700, margin: 0 }}>BlockBite Admin</h1>
            <p style={{ color: MUTED, fontSize: '13px', marginTop: '6px' }}>Waitlist Dashboard</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              style={{
                background: '#0f172a', border: `1px solid ${BORDER}`, borderRadius: '10px',
                color: TEXT, padding: '12px 16px', fontSize: '15px', outline: 'none',
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{
                background: '#0f172a', border: `1px solid ${BORDER}`, borderRadius: '10px',
                color: TEXT, padding: '12px 16px', fontSize: '15px', outline: 'none',
              }}
            />
            {loginError && (
              <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{loginError}</p>
            )}
            <button
              type="submit"
              style={{
                background: `linear-gradient(135deg, ${PURPLE}, ${TEAL})`,
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '13px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ color: TEXT, fontSize: '24px', fontWeight: 800, margin: 0 }}>Waitlist Dashboard</h1>
            <p style={{ color: MUTED, fontSize: '13px', margin: '4px 0 0' }}>Logged in as {ADMIN_USER}</p>
          </div>
          <button
            onClick={fetchEntries}
            style={{
              background: PURPLE, color: '#fff', border: 'none', borderRadius: '10px',
              padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Signups', value: count, color: PURPLE },
            { label: 'KV Status', value: entries.length > 0 ? 'Live' : 'In-Memory', color: TEAL },
            { label: 'Latest', value: entries[0] ? new Date(entries[0].ts).toLocaleDateString() : '—', color: GOLD },
          ].map((s) => (
            <div key={s.label} style={{
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px',
            }}>
              <div style={{ color: s.color, fontSize: '26px', fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: MUTED, fontSize: '12px', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {fetchError && (
          <div style={{
            background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: '10px',
            padding: '14px 18px', color: '#f87171', marginBottom: '20px', fontSize: '14px',
          }}>
            Error: {fetchError}
          </div>
        )}

        {/* Table */}
        <div style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: TEXT, fontWeight: 700, fontSize: '15px' }}>Signups</span>
            <span style={{
              background: '#1e1b4b', color: '#a5b4fc', borderRadius: '20px',
              padding: '3px 12px', fontSize: '12px', fontWeight: 700,
            }}>{count} total</span>
          </div>

          {loading && !fetched ? (
            <div style={{ color: MUTED, padding: '40px', textAlign: 'center', fontSize: '14px' }}>Loading…</div>
          ) : entries.length === 0 ? (
            <div style={{ color: MUTED, padding: '40px', textAlign: 'center', fontSize: '14px' }}>
              {fetched ? 'No signups yet.' : 'Click Refresh to load entries.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['#', 'Email', 'Date', 'Time'].map((h) => (
                      <th key={h} style={{
                        padding: '12px 20px', textAlign: 'left',
                        color: MUTED, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const d = new Date(e.ts);
                    return (
                      <tr key={e.email} style={{
                        borderBottom: i < entries.length - 1 ? `1px solid ${BORDER}` : 'none',
                      }}>
                        <td style={{ padding: '13px 20px', color: MUTED, fontSize: '13px', width: '48px' }}>
                          {i + 1}
                        </td>
                        <td style={{ padding: '13px 20px', color: TEXT, fontSize: '14px' }}>
                          {e.email}
                        </td>
                        <td style={{ padding: '13px 20px', color: MUTED, fontSize: '13px' }}>
                          {d.toLocaleDateString('en-GB')}
                        </td>
                        <td style={{ padding: '13px 20px', color: MUTED, fontSize: '13px' }}>
                          {d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ color: MUTED, fontSize: '11px', textAlign: 'center', marginTop: '24px' }}>
          BlockBite Admin · Data from Vercel KV (or in-memory fallback)
        </p>
      </div>
    </div>
  );
}
