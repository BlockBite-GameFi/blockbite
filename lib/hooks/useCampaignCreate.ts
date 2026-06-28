'use client';

import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import { RPC_URL } from '@/lib/solana/config';
import {
  createCampaign,
  createMilestone,
  deriveCampaignPDA,
  deriveMilestonePDA,
  type SendTx,
} from '@/lib/anchor/campaign-client';
import { BN } from '@coral-xyz/anchor';

export type CampaignCreateStatus = 'idle' | 'creating' | 'done' | 'error';

interface CampaignCreateResult {
  campaignPda: PublicKey;
  milestonePdas: PublicKey[];
  sig: string;
}

export function useCampaignCreate() {
  const [status, setStatus] = useState<CampaignCreateStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CampaignCreateResult | null>(null);

  const create = useCallback(async (
    founder: PublicKey,
    mint: PublicKey,
    totalBudget: bigint,
    titleHash: Uint8Array,
    seed: bigint,
    milestones: Array<{
      descriptionHash: Uint8Array;
      tokenAmount:     bigint;
      gameProgramId:   PublicKey;
      recipient:       PublicKey;
      milestoneSeed:   bigint;
      targetLevel:     number;
      difficulty:      number;
    }>,
    sendTransaction: SendTx,
  ) => {
    setStatus('creating');
    setError(null);

    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const [campaignPda] = deriveCampaignPDA(founder, new BN(seed.toString()));

      // Step 1: Create campaign
      const sig = await createCampaign({
        connection, founder, mint, totalBudget, titleHash, seed, sendTransaction,
      });

      // Step 2: Create milestones
      const milestonePdas: PublicKey[] = [];
      for (const ms of milestones) {
        const [milestonePda] = deriveMilestonePDA(campaignPda, new BN(ms.milestoneSeed.toString()));
        await createMilestone({
          connection,
          founder,
          campaignPDA:     campaignPda,
          milestonePDA:    milestonePda,
          descriptionHash: ms.descriptionHash,
          campaignSeed:    seed,
          milestoneSeed:   ms.milestoneSeed,
          tokenAmount:     ms.tokenAmount,
          gameProgramId:   ms.gameProgramId,
          recipient:       ms.recipient,
          targetLevel:     ms.targetLevel,
          difficulty:      ms.difficulty,
          sendTransaction,
        });
        milestonePdas.push(milestonePda);
      }

      const res = { campaignPda, milestonePdas, sig };
      setResult(res);
      setStatus('done');
      return res;
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

  return { status, error, result, create, reset };
}
