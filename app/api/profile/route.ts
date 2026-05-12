import { NextRequest, NextResponse } from 'next/server';
import { getUser, setUser } from '@/lib/store';
import { verifySig } from '@/lib/sig';

export async function GET(req: NextRequest) {
  const addr = req.nextUrl.searchParams.get('addr') ?? '';
  return NextResponse.json(await getUser(addr));
}

export async function POST(req: NextRequest) {
  try {
    const { addr, patch, sig } = await req.json();
    if (!addr || !patch || !sig) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }
    const ok = await verifySig(addr, JSON.stringify(patch), sig);
    if (!ok) return NextResponse.json({ error: 'bad signature' }, { status: 403 });

    const ALLOWED = ['displayName', 'avatarId', 'language', 'theme'];
    const clean: Record<string, unknown> = {};
    for (const k of ALLOWED) if (k in patch) clean[k] = patch[k];
    await setUser(addr, clean as Parameters<typeof setUser>[1]);
    return NextResponse.json({ ok: true, patch: clean });
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
