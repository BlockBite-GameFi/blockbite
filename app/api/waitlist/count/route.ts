import { NextResponse } from 'next/server';
import { sbGetCount, supabaseReady } from '@/lib/supabase-rest';
import { memGetCount } from '@/lib/waitlist-store';

export async function GET() {
  try {
    if (supabaseReady()) {
      const count = await sbGetCount();
      if (count !== null) {
        return NextResponse.json({ count, source: 'supabase' });
      }
    }
    return NextResponse.json({ count: memGetCount(), source: 'memory' });
  } catch {
    return NextResponse.json({ count: memGetCount(), source: 'memory' });
  }
}
