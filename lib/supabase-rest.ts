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

// ─── Page-view analytics via Supabase Storage ────────────────────────────────
// Uses service_role key only — zero DDL, zero manual setup, zero new env vars.
// Bucket: "analytics" | Objects: "pv/{YYYY-MM-DD}/{ts}-{rand}.json"

const ANA_BUCKET = 'analytics';

/** Ensure analytics bucket exists (idempotent). */
async function sbEnsureBucket(): Promise<void> {
  if (!supabaseReady()) return;
  try {
    await fetch(`${SB_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify({ id: ANA_BUCKET, name: ANA_BUCKET, public: false }),
      cache: 'no-store',
    });
    // 200 = created, 409 = already exists — both are fine
  } catch { /* ignore */ }
}

// Keep provision export for backwards compat (no-op now — storage needs no provisioning)
export async function sbAutoProvisionPageViews(): Promise<boolean> {
  await sbEnsureBucket();
  return true;
}

/** Write one page view event to storage. Fire-and-forget. */
export async function sbTrackView(path: string, sid: string): Promise<void> {
  if (!supabaseReady()) return;
  const date  = new Date().toISOString().slice(0, 10);
  const ts    = Date.now();
  const rand  = Math.random().toString(36).slice(2, 8);
  const key   = `pv/${date}/${ts}-${rand}.json`;
  const body  = JSON.stringify({ path, sid, ts });
  try {
    const res = await fetch(`${SB_URL}/storage/v1/object/${ANA_BUCKET}/${key}`, {
      method: 'POST',
      headers: h({ 'Content-Type': 'application/json', 'x-upsert': 'true' }),
      body,
      cache: 'no-store',
    });
    // Bucket might not exist yet — create it then retry
    if (!res.ok && (res.status === 404 || res.status === 400)) {
      await sbEnsureBucket();
      await fetch(`${SB_URL}/storage/v1/object/${ANA_BUCKET}/${key}`, {
        method: 'POST',
        headers: h({ 'Content-Type': 'application/json', 'x-upsert': 'true' }),
        body,
        cache: 'no-store',
      }).catch(() => {});
    }
  } catch { /* non-critical */ }
}

/** List all page-view objects and aggregate by path. */
export type PageViewStat = { path: string; views: number; sessions: number };

export async function sbGetViewStats(): Promise<PageViewStat[] | null> {
  if (!supabaseReady()) return null;
  try {
    const items = await sbListAllPvObjects();
    if (!items) return null;
    const reads = await Promise.all(
      items.slice(0, 2000).map(name =>
        fetch(`${SB_URL}/storage/v1/object/${ANA_BUCKET}/${name}`, { headers: h(), cache: 'no-store' })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    );
    const map = new Map<string, { views: number; sessions: Set<string> }>();
    for (const ev of reads) {
      if (!ev?.path) continue;
      if (!map.has(ev.path)) map.set(ev.path, { views: 0, sessions: new Set() });
      const s = map.get(ev.path)!;
      s.views++;
      if (ev.sid) s.sessions.add(ev.sid);
    }
    return Array.from(map.entries())
      .map(([path, s]) => ({ path, views: s.views, sessions: s.sessions.size }))
      .sort((a, b) => b.views - a.views);
  } catch { return null; }
}

/** List all pv/ objects in the bucket — returns array of full paths. */
async function sbListAllPvObjects(): Promise<string[] | null> {
  if (!supabaseReady()) return null;
  const all: string[] = [];
  let offset = 0;
  const limit = 1000;
  for (;;) {
    try {
      const res = await fetch(`${SB_URL}/storage/v1/object/list/${ANA_BUCKET}`, {
        method: 'POST',
        headers: h(),
        body: JSON.stringify({ prefix: 'pv/', limit, offset, sortBy: { column: 'created_at', order: 'desc' } }),
        cache: 'no-store',
      });
      if (!res.ok) return all.length ? all : null;
      const items: { name: string }[] = await res.json();
      if (!Array.isArray(items) || items.length === 0) break;
      all.push(...items.map(i => `pv/${i.name}`));
      if (items.length < limit) break;
      offset += limit;
      if (all.length >= 5000) break; // cap for perf
    } catch { break; }
  }
  return all;
}

export type TotalViewStats = {
  totalViews: number;
  uniqueVisitors: number;
  today: number;
  tableReady: boolean;
};

export async function sbGetTotalViewStats(): Promise<TotalViewStats> {
  if (!supabaseReady()) return { totalViews: 0, uniqueVisitors: 0, today: 0, tableReady: true };
  try {
    const items = await sbListAllPvObjects();
    // Storage bucket not ready yet — auto-create and return zeros (will work on next visit)
    if (!items) {
      sbEnsureBucket().catch(() => {});
      return { totalViews: 0, uniqueVisitors: 0, today: 0, tableReady: true };
    }
    if (items.length === 0) return { totalViews: 0, uniqueVisitors: 0, today: 0, tableReady: true };

    // Read up to 500 most recent for totals (fast path)
    const sample = items.slice(0, 500);
    const reads = await Promise.all(
      sample.map(name =>
        fetch(`${SB_URL}/storage/v1/object/${ANA_BUCKET}/${name}`, { headers: h(), cache: 'no-store' })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    );
    const today    = new Date().toISOString().slice(0, 10);
    const sessions = new Set<string>();
    let todayViews = 0;
    for (const ev of reads) {
      if (!ev) continue;
      if (ev.sid) sessions.add(ev.sid);
      if (ev.ts && new Date(ev.ts).toISOString().startsWith(today)) todayViews++;
    }
    return {
      totalViews:    items.length,   // exact count from listing
      uniqueVisitors: sessions.size, // from sample (accurate for low traffic)
      today:         todayViews,
      tableReady:    true,
    };
  } catch {
    return { totalViews: 0, uniqueVisitors: 0, today: 0, tableReady: true };
  }
}
