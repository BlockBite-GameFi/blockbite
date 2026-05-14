import { NextResponse } from 'next/server';
import { memGetCount } from '@/lib/waitlist-store';

async function getKV() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const kv = await getKV();
    if (kv) {
      const count = await kv.get<number>('blockbite:waitlist:count');
      return NextResponse.json({ count: count ?? 0 });
    }
    return NextResponse.json({ count: memGetCount() });
  } catch {
    return NextResponse.json({ count: memGetCount() });
  }
}
