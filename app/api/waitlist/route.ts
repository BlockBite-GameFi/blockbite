import { NextRequest, NextResponse } from 'next/server';
import { kvAddEmail } from '@/lib/waitlist-kv';
import { sbInsertEmail, supabaseReady } from '@/lib/supabase-rest';
import { memAdd } from '@/lib/waitlist-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body as { email?: string };
    if (!email || !email.includes('@') || email.length > 254) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const normalized = email.toLowerCase().trim();

    // 1. Primary: Vercel KV
    const kvResult = await kvAddEmail(normalized);
    if (kvResult === 'duplicate') return NextResponse.json({ ok: true, already: true, _src: 'kv' }, { status: 409 });
    if (kvResult === 'inserted') {
      if (supabaseReady()) sbInsertEmail(normalized).catch(() => {});
      return NextResponse.json({ ok: true, _src: 'kv' });
    }

    // 2. Fallback: Supabase
    if (supabaseReady()) {
      const result = await sbInsertEmail(normalized);
      if (result === 'duplicate') return NextResponse.json({ ok: true, already: true, _src: 'sb-dup' }, { status: 409 });
      if (result === 'inserted') return NextResponse.json({ ok: true, _src: 'sb' });
      // Supabase insert failed — expose error in _src for diagnosis
      console.error('[waitlist] Supabase insert failed:', result);
      return NextResponse.json({ ok: true, _src: result });
    }

    // 3. Last resort: in-memory (resets on cold start)
    const added = memAdd(normalized);
    if (!added) return NextResponse.json({ ok: true, already: true, _src: 'mem-dup' }, { status: 409 });
    return NextResponse.json({ ok: true, _src: 'mem' });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
