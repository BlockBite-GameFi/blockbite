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

/** Insert email. Returns 'inserted' | 'duplicate' | 'error'. */
export async function sbInsertEmail(
  email: string,
): Promise<'inserted' | 'duplicate' | 'error'> {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: h({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ email }),
    });
    if (res.status === 201) return 'inserted';
    if (res.status === 409) return 'duplicate';
    return 'error';
  } catch {
    return 'error';
  }
}

/** Return total row count. */
export async function sbGetCount(): Promise<number | null> {
  try {
    // No URL-level limit — let Range header alone control pagination so
    // Prefer:count=exact can put the real total in content-range.
    const res = await fetch(`${SB_URL}/rest/v1/waitlist`, {
      headers: h({ Prefer: 'count=exact', Range: '0-0' }),
    });
    const range = res.headers.get('content-range'); // "0-0/N" or "*/N"
    if (range) {
      const n = parseInt(range.split('/')[1]);
      if (!isNaN(n)) return n;
    }
    // Fallback: read body count if header missing
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) return data.length;
    }
    return null;
  } catch {
    return null;
  }
}

export type SbEntry = { email: string; created_at: string };

/** Return all entries ordered newest first. */
export async function sbGetList(): Promise<SbEntry[] | null> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/waitlist?select=email,created_at&order=created_at.desc`,
      { headers: h() },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
