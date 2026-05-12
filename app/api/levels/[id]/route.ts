import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const level  = parseInt(params.id, 10);
  const player = req.nextUrl.searchParams.get('player') ?? 'anonymous';

  if (isNaN(level) || level < 1 || level > 4000) {
    return NextResponse.json({ error: 'invalid level' }, { status: 400 });
  }

  // Deterministic seed: keccak-256 of "blockbite:level:{N}:{player}"
  const seed = createHash('sha256')
    .update(`blockbite:level:${level}:${player}`)
    .digest('hex');

  return NextResponse.json({ level, seed });
}
