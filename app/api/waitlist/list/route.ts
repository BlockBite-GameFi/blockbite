import { NextRequest, NextResponse } from 'next/server';
import { memGetList } from '@/lib/waitlist-store';

const ADMIN_TOKEN = 'nayrbryanGaming_admin_2025';

async function getKV() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token =
    req.headers.get('x-admin-token') ||
    req.nextUrl.searchParams.get('token');
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const kv = await getKV();
    if (kv) {
      const allKeys: string[] = await kv.keys('blockbite:waitlist:*');
      const emailKeys = allKeys.filter((k) => k !== 'blockbite:waitlist:count');
      const count = (await kv.get<number>('blockbite:waitlist:count')) ?? 0;

      const entries: { email: string; ts: number }[] = [];
      for (const key of emailKeys) {
        const val = await kv.get<{ email: string; ts: number }>(key);
        if (val) entries.push(val);
      }
      entries.sort((a, b) => b.ts - a.ts);

      return NextResponse.json({ count, entries });
    }

    const memEntries = memGetList();
    return NextResponse.json({ count: memEntries.length, entries: memEntries });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
