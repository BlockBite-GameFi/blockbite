/**
 * Supabase REST API helpers (no extra npm package needed).
 * Uses service-role key so it bypasses RLS — server-side only.
 */

const SB_URL = process.env.SUPABASE_URL ?? '';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function h(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    ...extra,
  };
}

export function supabaseReady(): boolean {
  return Boolean(SB_URL && SB_KEY);
}

/** Insert email. Returns 'inserted' | 'duplicate' | 'error:STATUS'.
 *  Strict: with Prefer:return=representation the response body MUST contain the
 *  inserted row. If RLS or a trigger silently drops the row, PostgREST returns
 *  201 with [] — we treat that as a silent failure instead of "inserted".
 */
export async function sbInsertEmail(
  email: string,
): Promise<'inserted' | 'duplicate' | string> {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: h({ Prefer: 'return=representation' }),
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });
    if (res.status === 409) return 'duplicate';
    const bodyText = await res.text().catch(() => '');
    if (res.status === 200 || res.status === 201) {
      // representation should return the inserted row. Empty array = silent RLS drop.
      try {
        const parsed = JSON.parse(bodyText);
        if (Array.isArray(parsed) && parsed.length === 0) {
          return `error:silent-rls:body=[]:status=${res.status}`;
        }
      } catch { /* not JSON — accept as inserted */ }
      return 'inserted';
    }
    if (res.status === 204) return 'inserted'; // minimal — can't verify, trust status
    return `error:${res.status}:${bodyText.slice(0, 200)}`;
  } catch (e) {
    return `error:exception:${String(e).slice(0, 120)}`;
  }
}

/** Decode JWT payload without verifying — used only for diagnostics so we can
 *  tell the user whether the key in Vercel is the anon key vs service_role.
 */
export function sbKeyRole(): { role?: string; ref?: string; error?: string } {
  if (!SB_KEY) return { error: 'no-key' };
  const parts = SB_KEY.split('.');
  if (parts.length !== 3) return { error: 'not-jwt' };
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
    return { role: decoded?.role, ref: decoded?.ref };
  } catch (e) {
    return { error: `decode:${String(e).slice(0, 60)}` };
  }
}

/** Probe Supabase with a raw SELECT and return the response details. */
export async function sbProbe(): Promise<{
  status: number;
  bodyHead: string;
  rowCount: number | null;
}> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/waitlist?select=email&limit=5`,
      { headers: h({ Prefer: 'count=exact' }), cache: 'no-store' },
    );
    const txt = await res.text().catch(() => '');
    let rowCount: number | null = null;
    try {
      const parsed = JSON.parse(txt);
      if (Array.isArray(parsed)) rowCount = parsed.length;
    } catch { /* ignore */ }
    return { status: res.status, bodyHead: txt.slice(0, 300), rowCount };
  } catch (e) {
    return { status: -1, bodyHead: `exception:${String(e).slice(0, 200)}`, rowCount: null };
  }
}

/** Return total row count. */
export async function sbGetCount(): Promise<number | null> {
  // Always use sbGetList() — the HEAD+count=exact approach returns unreliable
  // zeros from this PostgREST instance. List length is the authoritative count.
  const list = await sbGetList();
  if (list !== null) return list.length;
  return null;
}

export type SbEntry = { email: string; created_at: string };

/** Delete a single email from waitlist. Returns true on success. */
export async function sbDeleteEmail(email: string): Promise<boolean> {
  try {
    const encoded = encodeURIComponent(email);
    const res = await fetch(
      `${SB_URL}/rest/v1/waitlist?email=eq.${encoded}`,
      { method: 'DELETE', headers: h({ Prefer: 'return=minimal' }), cache: 'no-store' },
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Return all entries ordered newest first.
 *  cache:no-store is REQUIRED — Next.js 14 caches server-side fetch() by
 *  default, so without it every GET sees the same frozen snapshot of rows
 *  even when force-dynamic is set on the route. That bug caused the public
 *  counter to stick at 2 while new signups kept landing in Supabase.
 */
export async function sbGetList(): Promise<SbEntry[] | null> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/waitlist?select=email,created_at&order=created_at.desc&limit=50000`,
      { headers: h(), cache: 'no-store' },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Page-view analytics ─────────────────────────────────────────────────────

const PROVISION_SQL = `
CREATE TABLE IF NOT EXISTS page_views (
  id          bigserial PRIMARY KEY,
  path        text NOT NULL,
  session_id  text NOT NULL DEFAULT 'anon',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pv_path    ON page_views (path);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views (created_at);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='page_views' AND policyname='api_insert') THEN
    CREATE POLICY "api_insert" ON page_views FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='page_views' AND policyname='service_select') THEN
    CREATE POLICY "service_select" ON page_views FOR SELECT USING (true);
  END IF;
END $$;
`.trim();

/** Auto-provision page_views table via Supabase Management API.
 *  Requires SUPABASE_ACCESS_TOKEN (personal access token from supabase.com/dashboard/account/tokens).
 *  Extracts project ref from SUPABASE_URL automatically — zero human SQL interaction.
 */
export async function sbAutoProvisionPageViews(): Promise<boolean> {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken || !SB_URL) return false;
  // Extract project ref: https://{ref}.supabase.co
  const ref = SB_URL.replace(/^https?:\/\//, '').split('.')[0];
  if (!ref) return false;
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ query: PROVISION_SQL }),
      cache: 'no-store',
    });
    return res.ok;
  } catch { return false; }
}

export async function sbTrackView(path: string, sid: string): Promise<void> {
  if (!supabaseReady()) return;
  try {
    const res = await fetch(`${SB_URL}/rest/v1/page_views`, {
      method: 'POST',
      headers: h({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ path, session_id: sid }),
      cache: 'no-store',
    });
    // If table doesn't exist, auto-provision and retry once
    if (!res.ok && res.status === 404) {
      const ok = await sbAutoProvisionPageViews();
      if (ok) {
        await fetch(`${SB_URL}/rest/v1/page_views`, {
          method: 'POST',
          headers: h({ Prefer: 'return=minimal' }),
          body: JSON.stringify({ path, session_id: sid }),
          cache: 'no-store',
        }).catch(() => {});
      }
    }
  } catch { /* ignore — non-critical */ }
}

export type PageViewStat = { path: string; views: number; sessions: number };

export async function sbGetViewStats(): Promise<PageViewStat[] | null> {
  if (!supabaseReady()) return null;
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/page_views?select=path,session_id&limit=200000`,
      { headers: h(), cache: 'no-store' },
    );
    if (!res.ok) return null;
    const rows: { path: string; session_id: string }[] = await res.json();
    const map = new Map<string, { views: number; sessions: Set<string> }>();
    for (const r of rows) {
      if (!map.has(r.path)) map.set(r.path, { views: 0, sessions: new Set() });
      const s = map.get(r.path)!;
      s.views++;
      s.sessions.add(r.session_id);
    }
    return Array.from(map.entries())
      .map(([path, s]) => ({ path, views: s.views, sessions: s.sessions.size }))
      .sort((a, b) => b.views - a.views);
  } catch {
    return null;
  }
}

export type TotalViewStats = {
  totalViews: number;
  uniqueVisitors: number;
  today: number;
  tableReady: boolean;
};

export async function sbGetTotalViewStats(): Promise<TotalViewStats> {
  if (!supabaseReady()) return { totalViews: 0, uniqueVisitors: 0, today: 0, tableReady: false };
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/page_views?select=session_id,created_at&limit=200000`,
      { headers: h(), cache: 'no-store' },
    );
    // Table missing — auto-provision silently in background, return zeros
    if (!res.ok && res.status === 404) {
      sbAutoProvisionPageViews().catch(() => {});
      return { totalViews: 0, uniqueVisitors: 0, today: 0, tableReady: false };
    }
    if (!res.ok) return { totalViews: 0, uniqueVisitors: 0, today: 0, tableReady: false };
    const rows: { session_id: string; created_at: string }[] = await res.json();
    const sessions = new Set(rows.map(r => r.session_id));
    const today = new Date().toISOString().slice(0, 10);
    const todayViews = rows.filter(r => r.created_at?.startsWith(today)).length;
    return { totalViews: rows.length, uniqueVisitors: sessions.size, today: todayViews, tableReady: true };
  } catch {
    return { totalViews: 0, uniqueVisitors: 0, today: 0, tableReady: false };
  }
}
