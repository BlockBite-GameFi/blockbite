import { NextResponse } from 'next/server';
import { sbGetCount, supabaseReady } from '@/lib/supabase-rest';
import { memGetCount } from '@/lib/waitlist-store';

// Must be force-dynamic — Next.js caches GET routes at build time by default.
// Without this, every request returns the build-time snapshot (always 0).
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (supabaseReady()) {
      const count = await sbGetCount();
      if (count !== null) {
        return NextResponse.json(
          { count, source: 'supabase' },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      }
    }
    return NextResponse.json(
      { count: memGetCount(), source: 'memory' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { count: memGetCount(), source: 'memory' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
