/**
 * POST /api/session/start
 * Called by the client just before a game begins.
 *
 * Body:  { walletAddress: string }
 * Reply: { sessionId: string; levelConfig: { id, name, act, actName, mechanics } }
 *
 * Phase 0 — ticket balance lives in localStorage (client-side).
 * The server issues a signed session token so the submit endpoint can validate it.
 *
 * Upgrade path → Vercel KV:
 *   import { kv } from '@vercel/kv';
 *   await kv.set(`session:${sessionId}`, payload, { ex: 3600 });
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, randomUUID } from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'blockbite-dev-secret-changeme';
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

function signSession(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

export async function POST(req: NextRequest) {
  let body: { walletAddress?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { walletAddress } = body;
  if (!walletAddress || typeof walletAddress !== 'string') {
    return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
  }

  const sessionId = randomUUID();
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_TTL_MS;

  // Signed token: sessionId|wallet|issuedAt|expiresAt|hmac
  const payload = `${sessionId}|${walletAddress}|${issuedAt}|${expiresAt}`;
  const sig = signSession(payload);
  const token = Buffer.from(`${payload}|${sig}`).toString('base64url');

  return NextResponse.json({
    sessionId,
    token,
    expiresAt,
    walletAddress,
  });
}
