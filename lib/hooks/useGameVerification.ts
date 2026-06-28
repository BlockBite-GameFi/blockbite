'use client';

import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { setMilestone, type SendTx } from '@/lib/anchor/vesting-client';
import { Connection } from '@solana/web3.js';
import { RPC_URL } from '@/lib/solana/config';

export type VerificationStatus = 'none' | 'playing' | 'verifying' | 'verified' | 'failed';

interface VerificationResult {
  verified: boolean;
  proofHash?: string;
  scoreRequired: number;
  scoreAchieved: number;
}

export function useGameVerification() {
  const [status, setStatus] = useState<VerificationStatus>('none');
  const [result, setResult] = useState<VerificationResult | null>(null);

  const submitScore = useCallback(async (
    level: number,
    score: number,
    player: string,
    streamPda: string,
  ): Promise<VerificationResult> => {
    setStatus('verifying');

    try {
      const res = await fetch('/api/score/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, score, player, streamPda }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('failed');
        return { verified: false, scoreRequired: 0, scoreAchieved: score };
      }

      setResult({
        verified: data.verified,
        proofHash: data.proofHash,
        scoreRequired: data.scoreRequired,
        scoreAchieved: data.scoreAchieved,
      });

      setStatus(data.verified ? 'verified' : 'failed');
      return {
        verified: data.verified,
        proofHash: data.proofHash,
        scoreRequired: data.scoreRequired,
        scoreAchieved: data.scoreAchieved,
      };
    } catch {
      setStatus('failed');
      return { verified: false, scoreRequired: 0, scoreAchieved: score };
    }
  }, []);

  const submitMilestoneOnChain = useCallback(async (
    authority: PublicKey,
    streamPda: PublicKey,
    sendTransaction: SendTx,
  ): Promise<string> => {
    const connection = new Connection(RPC_URL, 'confirmed');
    const sig = await setMilestone(connection, authority, streamPda, sendTransaction);
    return sig;
  }, []);

  const reset = useCallback(() => {
    setStatus('none');
    setResult(null);
  }, []);

  return {
    status,
    result,
    submitScore,
    submitMilestoneOnChain,
    reset,
  };
}
