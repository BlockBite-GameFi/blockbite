import { NextRequest, NextResponse } from 'next/server';
import { sbGetViewStats, sbGetTotalViewStats } from '@/lib/supabase-rest';
import { timingSafeEqual } from 'crypto';

function checkToken(provided: string): boolean {
  const secret = process.env.ADMIN_TOKEN;
  if (!secret) return false;
  try {
    return provided.length === secret.length &&
      timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
  } catch { return false; }
}

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-admin-token') ?? '';
  if (!checkToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [pageStats, totalStats] = await Promise.all([
    sbGetViewStats(),
    sbGetTotalViewStats(),
  ]);

  return NextResponse.json({ pageStats, totalStats });
}
