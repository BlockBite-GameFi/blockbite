'use client';

import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import type { SendTx } from '@/lib/anchor/campaign-client';

export type CampaignVerificationStatus = 'none' | 'playing' | 'verifying' | 'verified' | 'failed';

export interface CampaignVerificationResult {
  verified:  boolean;
  verifySig?: string;
  /** @deprecated No session result hash is used in the current program. Always empty. */
  sessionResultHash: Uint8Array;
}

// Game server is now embedded as Next.js API routes — no separate service needed.
// Relative paths work on both Vercel and localhost dev server.
const GAME_SERVER_URL = '';

export function useCampaignGameVerification() {
  const [status, setStatus] = useState<CampaignVerificationStatus>('none');
  const [result, setResult] = useState<CampaignVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (
    milestonePda:    PublicKey,
    gameProgramId:   PublicKey,   // ignored — game server uses its own keypair
    level:           number,
    score:           number,
    recipient:       PublicKey,
    sendTransaction: SendTx,      // unused — game server signs the tx
    campaign?:       PublicKey,
    milestoneSeed:   bigint = 0n,
  ): Promise<CampaignVerificationResult> => {
    setStatus('verifying');
    setError(null);

    const campaignPk = campaign ?? PublicKey.default;
    const userId     = recipient.toBase58();
    const sessionId  = `${userId}-${milestonePda.toBase58()}-${Date.now()}`;

    // Cap achievedLevel at 30 — the on-chain MAX_LEVEL constant.
    const cappedLevel = Math.min(level, 30);

    try {
      // Step 1: Register the game session on the game server (demo mode).
      // In production, replace this with real game-engine session validation.
      await fetch(`${GAME_SERVER_URL}/api/game/simulate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, sessionId, level: cappedLevel }),
      });

      // Step 2: Ask the game server to sign and submit verify_game on-chain.
      const res = await fetch(`${GAME_SERVER_URL}/api/game/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId,
          campaignPda:   campaignPk.toBase58(),
          milestoneSeed: milestoneSeed.toString(),
          achievedLevel: cappedLevel,
          gameSessionId: sessionId,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.message || body?.error || 'Game verification failed');
      }

      const out: CampaignVerificationResult = {
        verified:          true,
        verifySig:         body.signature,
        sessionResultHash: new Uint8Array(32),
      };
      setResult(out);
      setStatus('verified');
      return out;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus('failed');
      throw e;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('none');
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, verify, reset };
}
