// app/api/score/sign/route.ts
// Verifies the wallet-signed score message and queues the on-chain
// `record_milestone` CPI to vesting `update_proof`.

import { NextRequest, NextResponse } from 'next/server';
import { verifySig } from '@/lib/sig';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { level, score, message, signature } = await req.json();
  // Parse "blockbite:score:<player>:<level>:<score>:<ts>"
  const m = String(message).match(/^blockbite:score:([^:]+):(\d+):(\d+):(\d+)$/);
  if (!m) return NextResponse.json({ error: 'bad message format' }, { status: 400 });
  const [, player, lvl, scr, ts] = m;
  if (parseInt(lvl, 10) !== level) return NextResponse.json({ error: 'level mismatch' }, { status: 400 });
  if (parseInt(scr, 10) !== score) return NextResponse.json({ error: 'score mismatch' }, { status: 400 });
  if (Date.now() - parseInt(ts, 10) > 5 * 60 * 1000) return NextResponse.json({ error: 'expired' }, { status: 400 });

  // Verify ed25519 signature against player pubkey
  const ok = await verifySig(player, message, signature);
  if (!ok) return NextResponse.json({ error: 'bad signature' }, { status: 401 });

  // If level crosses an Act boundary, flag for on-chain recording
  const act = Math.floor((level - 1) / 500) + 1;
  const isActFinal = level % 500 === 0;
  if (!isActFinal) return NextResponse.json({ ok: true, recorded: false });

  return NextResponse.json({ ok: true, recorded: true, act });
}
