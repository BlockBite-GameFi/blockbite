import { NextRequest, NextResponse } from 'next/server';

// In-memory fallback when KV is not configured
const memList = new Set<string>();

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
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const normalized = email.toLowerCase().trim();
    const kv = await getKV();
    if (kv) {
      const exists = await kv.sismember('bb:waitlist', normalized);
      if (exists) return NextResponse.json({ ok: true, duplicate: true });
      await kv.sadd('bb:waitlist', normalized);
    } else {
      if (memList.has(normalized)) return NextResponse.json({ ok: true, duplicate: true });
      memList.add(normalized);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
