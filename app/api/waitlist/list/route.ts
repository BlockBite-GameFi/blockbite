import { NextRequest, NextResponse } from 'next/server';
import { sbGetList, sbGetCount, supabaseReady } from '@/lib/supabase-rest';
import { memGetList } from '@/lib/waitlist-store';

const ADMIN_TOKEN = 'nayrbryanGaming_admin_2025';

export async function GET(req: NextRequest) {
  const token =
    req.headers.get('x-admin-token') ||
    req.nextUrl.searchParams.get('token');
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (supabaseReady()) {
      const [entries, count] = await Promise.all([sbGetList(), sbGetCount()]);
      if (entries !== null) {
        return NextResponse.json({
          count: count ?? entries.length,
          entries: entries.map(e => ({
            email: e.email,
            ts: new Date(e.created_at).getTime(),
            created_at: e.created_at,
          })),
          source: 'supabase',
        });
      }
    }

    const mem = memGetList();
    return NextResponse.json({ count: mem.length, entries: mem, source: 'memory' });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
