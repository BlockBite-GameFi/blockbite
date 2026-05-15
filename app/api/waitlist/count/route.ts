import { NextResponse } from 'next/server';
import { kvGetCount, kvSeedFromExternal } from '@/lib/waitlist-kv';
import { sbGetCount, supabaseReady } from '@/lib/supabase-rest';
import { memGetCount } from '@/lib/waitlist-store';

// Must be force-dynamic — GET routes are statically cached at build time by default.
export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = { 'Cache-Control': 'no-store, max-age=0' };

  try {
    // 1. Primary: Vercel KV — same instance as leaderboard, always available
    const kvCount = await kvGetCount();
    if (kvCount !== null) {
      // If KV has 0 but Supabase has data, bootstrap KV from Supabase
      if (kvCount === 0 && supabaseReady()) {
        const sbCount = await sbGetCount();
        if (sbCount && sbCount > 0) {
          await kvSeedFromExternal(sbCount);
          return NextResponse.json({ count: sbCount, source: 'supabase-seed' }, { headers });
        }
      }
      return NextResponse.json({ count: kvCount, source: 'kv' }, { headers });
    }

    // 2. Fallback: Supabase
    if (supabaseReady()) {
      const sbCount = await sbGetCount();
      if (sbCount !== null) {
        return NextResponse.json({ count: sbCount, source: 'supabase' }, { headers });
      }
    }

    // 3. Last resort: in-memory (always 0 on cold start, but never hides real data)
    return NextResponse.json({ count: memGetCount(), source: 'memory' }, { headers });
  } catch {
    return NextResponse.json({ count: 0, source: 'error' }, { headers });
  }
}
