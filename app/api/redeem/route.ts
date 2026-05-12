import { NextRequest, NextResponse } from 'next/server';
import { verifySig } from '@/lib/sig';

export async function POST(req: NextRequest) {
  try {
    const { addr, act, sig } = await req.json();
    if (!addr || !act || !sig) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const message = `blockbite:redeem:${addr}:act${act}`;
    const ok = await verifySig(addr, message, sig);
    if (!ok) return NextResponse.json({ error: 'bad signature' }, { status: 403 });

    // On-chain claim will be triggered by the frontend via vestingClient.
    // This route records the intent in KV for deduplication.
    try {
      const { kv } = await import('@vercel/kv');
      const key = `blockbite:redeem:${addr}:act${act}`;
      const exists = await kv.exists(key);
      if (exists) return NextResponse.json({ error: 'already redeemed' }, { status: 409 });
      await kv.set(key, { ts: Date.now() });
    } catch { /* no KV — proceed */ }

    return NextResponse.json({ ok: true, addr, act });
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
