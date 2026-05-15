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

    // 1. Primary: Vercel KV — persistent, same instance as leaderboard
    const kvResult = await kvAddEmail(normalized);
    if (kvResult === 'duplicate') {
      return NextResponse.json({ ok: true, already: true }, { status: 409 });
    }
    if (kvResult === 'inserted') {
      // Mirror to Supabase in background (non-blocking)
      if (supabaseReady()) {
        sbInsertEmail(normalized).catch(() => {});
      }
      return NextResponse.json({ ok: true });
    }

    // 2. Fallback: Supabase (if KV unavailable)
    if (supabaseReady()) {
      const result = await sbInsertEmail(normalized);
      if (result === 'duplicate') {
        return NextResponse.json({ ok: true, already: true }, { status: 409 });
      }
      if (result === 'inserted') {
        return NextResponse.json({ ok: true });
      }
    }

    // 3. Last resort: in-memory
    const added = memAdd(normalized);
    if (!added) return NextResponse.json({ ok: true, already: true }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
