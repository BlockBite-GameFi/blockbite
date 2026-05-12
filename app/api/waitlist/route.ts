import { NextRequest, NextResponse } from 'next/server';

// In-memory fallback when KV is not configured (resets on cold start)
const memList = new Set<string>();
let memCount = 0;

async function getKV() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@') || email.length > 254) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const normalized = email.toLowerCase().trim();
    const key = `blockbite:waitlist:${normalized}`;

    const kv = await getKV();
    if (kv) {
      const exists = await kv.exists(key);
      if (exists) return NextResponse.json({ ok: true, already: true }, { status: 409 });
      await kv.set(key, { email: normalized, ts: Date.now() });
      await kv.incr('blockbite:waitlist:count');
    } else {
      if (memList.has(normalized)) return NextResponse.json({ ok: true, already: true }, { status: 409 });
      memList.add(normalized);
      memCount++;
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
