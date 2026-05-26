import { NextRequest, NextResponse } from 'next/server';
import { sbTrackView } from '@/lib/supabase-rest';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body?.path === 'string' ? body.path.slice(0, 200) : null;
    const sid  = typeof body?.sid  === 'string' ? body.sid.slice(0, 64)   : 'anon';
    if (!path) return NextResponse.json({ ok: false }, { status: 400 });

    // Fire-and-forget — don't block the response
    sbTrackView(path, sid).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
