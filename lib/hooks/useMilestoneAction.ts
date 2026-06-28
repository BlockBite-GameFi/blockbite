'use client';

import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import { RPC_URL } from '@/lib/solana/config';
import {
  claimMilestone,
  deriveCampaignEscrowPDA,
  type SendTx,
} from '@/lib/anchor/campaign-client';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export type MilestoneActionStatus = 'idle' | 'submitting' | 'verifying' | 'claiming' | 'done' | 'error';

interface MilestoneActionResult {
  sig: string;
}

export function useMilestoneAction() {
  const [status, setStatus] = useState<MilestoneActionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MilestoneActionResult | null>(null);

  /** @deprecated submit_proof instruction does not exist in the current program. */
  const submitProofAction = useCallback(async (
    _recipient: PublicKey,
    _milestonePDA: PublicKey,
    _proofHash: Uint8Array,
    _sendTransaction: SendTx,
    _campaign: PublicKey = PublicKey.default,
    _milestoneSeed: bigint = 0n,
  ) => {
    throw new Error('submit_proof is not implemented in the current program. Use the game server /api/verify endpoint.');
  }, []);

  /** @deprecated verify_game requires game_authority signature — use game server endpoint instead. */
  const verifyGameAction = useCallback(async (
    _milestonePDA: PublicKey,
    _gameAuthority: PublicKey,
    _achievedLevel: number,
    _sendTransaction: SendTx,
    _campaign: PublicKey = PublicKey.default,
    _milestoneSeed: bigint = 0n,
  ) => {
    throw new Error('verifyGame must be called server-side. Use the game server /api/verify endpoint.');
  }, []);

  const claimMilestoneAction = useCallback(async (
    recipient: PublicKey,
    milestonePDA: PublicKey,
    campaignPDA: PublicKey,
    mint: PublicKey,
    milestoneSeed: bigint,
    campaignSeed: bigint,
    sendTransaction: SendTx,
  ) => {
    setStatus('claiming');
    setError(null);
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const [campaignEscrow] = deriveCampaignEscrowPDA(campaignPDA);
      const recipientTA = await getAssociatedTokenAddress(mint, recipient);

      const sig = await claimMilestone({
        connection,
        recipient,
        milestonePDA,
        campaignPDA,
        mint,
        campaignEscrow,
        recipientTA,
        milestoneSeed,
        campaignSeed,
        sendTransaction,
      });
      setResult({ sig });
      setStatus('done');
      return sig;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus('error');
      throw e;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  return {
    status,
    error,
    result,
    submitProofAction,
    verifyGameAction,
    claimMilestoneAction,
    reset,
  };
}
