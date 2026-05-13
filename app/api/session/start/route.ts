/**
 * POST /api/session/start
 * Issues a signed HMAC session token. The submit endpoint validates it without
 * any server-side session storage — the token is self-contained and tamper-evident.
 *
 * Body:  { walletAddress: string }
 * Reply: { sessionId, token, expiresAt, walletAddress }
 *
 * Design: stateless HMAC (HMAC-SHA256 over sessionId|wallet|issuedAt|expiresAt).
 * No KV needed for sessions — the signature IS the proof of authenticity.
 * Ticket balances live in the wallet / on-chain (W5: vesting contract integration).
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
