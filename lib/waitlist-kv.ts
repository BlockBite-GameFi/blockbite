/**
 * Waitlist persistence via Vercel KV (same KV instance as leaderboard).
 * KV is the primary store — always available when deployed to Vercel.
 * Supabase is kept as a secondary mirror.
 */

const KV_EMAIL_SET = 'bb:waitlist:emails';
const KV_COUNT_KEY = 'bb:waitlist:count';

async function getKV() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

/**
 * Add an email to the waitlist.
 * Returns 'inserted' | 'duplicate' | 'error'.
 */
export async function kvAddEmail(email: string): Promise<'inserted' | 'duplicate' | 'error'> {
  try {
    const kv = await getKV();
    if (!kv) return 'error';
    // SADD returns 1 if new, 0 if already a member
    const added = await kv.sadd(KV_EMAIL_SET, email);
    if (added === 0) return 'duplicate';
    await kv.incr(KV_COUNT_KEY);
    return 'inserted';
  } catch {
    return 'error';
  }
}

/**
 * Get the total waitlist count.
 * Returns null if KV is unavailable.
 */
export async function kvGetCount(): Promise<number | null> {
  try {
    const kv = await getKV();
    if (!kv) return null;
    const raw = await kv.get<number>(KV_COUNT_KEY);
    if (raw === null || raw === undefined) {
      // Counter not yet initialized — derive from set size
      const size = await kv.scard(KV_EMAIL_SET);
      if (typeof size === 'number' && size > 0) {
        await kv.set(KV_COUNT_KEY, size);
        return size;
      }
      return 0;
    }
    return typeof raw === 'number' ? raw : parseInt(String(raw));
  } catch {
    return null;
  }
}

/**
 * Seed KV counter from a known external count (Supabase bootstrap).
 * Only sets the counter if KV counter is 0 or missing and externalCount > 0.
 */
export async function kvSeedFromExternal(externalCount: number): Promise<void> {
  try {
    const kv = await getKV();
    if (!kv || externalCount <= 0) return;
    const existing = await kv.get<number>(KV_COUNT_KEY);
    if (!existing || existing < externalCount) {
      await kv.set(KV_COUNT_KEY, externalCount);
    }
  } catch { /* non-critical */ }
}
