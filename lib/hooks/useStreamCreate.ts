'use client';

/**
 * useStreamCreate — Universal stream creator.
 * Supports ANY SPL token (custom mint, auto-fetch decimals).
 * Supports native SOL — auto-wraps to wSOL before creating stream.
 * Works on mainnet, devnet, testnet.
 */

import { useState } from 'react';
import {
  PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  getAssociatedTokenAddress, getAccount,
  NATIVE_MINT, createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { createStream } from '@/lib/anchor/vesting-client';
import { withRpcFallback, getHealthyConnection } from '@/lib/solana/rpc-manager';

export type TxStatus = 'idle' | 'wrapping' | 'approving' | 'confirming' | 'done' | 'error';

export interface StreamCreateInput {
  mintAddress: string;   // any SPL mint OR native SOL mint (So111...112)
  decimals:    number;   // fetched from chain or known registry
  symbol:      string;   // display symbol
  beneficiary: string;   // recipient wallet address
  amount:      string;   // human-readable
  startTs:     number;
  cliffTs:     number;   // 0 = no cliff
  endTs:       number;
  requiredTier?: 0 | 1 | 2;
  name?:       string;   // optional on-chain label, max 32 bytes UTF-8
}

// Native SOL mint address — used for wSOL wrapping flow
const NATIVE_MINT_ADDR = NATIVE_MINT.toBase58(); // So11111111111111111111111111111111111111112

export function useStreamCreate() {
  const { publicKey, sendTransaction, connected }   = useWallet();

  const [txStatus,  setTxStatus]  = useState<TxStatus>('idle');
  const [txSig,     setTxSig]     = useState<string | null>(null);
  const [txErr,     setTxErr]     = useState<string | null>(null);

  const isSubmitting = txStatus === 'wrapping' || txStatus === 'approving' || txStatus === 'confirming';

  const submit = async (p: StreamCreateInput): Promise<boolean> => {
    if (!publicKey || !connected) {
      setTxErr('Connect your wallet first');
      setTxStatus('error');
      return false;
    }

    // Validate beneficiary
    let beneficiaryPk: PublicKey;
    try { beneficiaryPk = new PublicKey(p.beneficiary); }
    catch { setTxErr('Invalid beneficiary wallet address'); setTxStatus('error'); return false; }

    if (beneficiaryPk.equals(publicKey)) {
      setTxErr('Recipient cannot be your own wallet');
      setTxStatus('error');
      return false;
    }

    // Validate mint
    let mintPk: PublicKey;
    try { mintPk = new PublicKey(p.mintAddress); }
    catch { setTxErr('Invalid token mint address'); setTxStatus('error'); return false; }

    // Amount
    const amountNum = parseFloat(p.amount);
    if (!p.amount || isNaN(amountNum) || amountNum <= 0) {
      setTxErr('Amount must be greater than 0');
      setTxStatus('error');
      return false;
    }
    if (p.endTs <= p.startTs) {
      setTxErr('End date must be after start date');
      setTxStatus('error');
      return false;
    }

    const rawAmount = BigInt(Math.round(amountNum * 10 ** p.decimals));

    // Deployed program (Aso25…) charges a 0.9% protocol fee ON TOP of total_amount:
    //   fee = total_amount * STREAM_FEE_BPS(90) / 10_000   → 0.9%
    // It then transfers the FULL total_amount into escrow. So the creator's
    // token account must hold total_amount * 1.009, not just total_amount.
    // The SOL-wrap and SPL balance check below MUST account for this fee or the
    // escrow transfer_checked reverts ("Simulation failed" / "Internal error").
    const devFee      = rawAmount * 90n / 10_000n; // matches on-chain STREAM_FEE_BPS
    const totalNeeded = rawAmount + devFee;        // 100.9% pulled from creator

    // All transaction sends/reads below go through a verified-healthy endpoint
    // rather than the wallet-adapter's static api.devnet.solana.com connection,
    // which throws "Transport error" on send when it's throttled/unreachable.
    const txConn = getHealthyConnection('confirmed');

    // ── Native SOL path: auto-wrap SOL → wSOL ────────────────────────────────
    // Triggered when user selects SOL/wSOL (mint = So11111…112).
    // The Anchor program only accepts SPL token accounts, so we must wrap first.
    const isNativeSol = p.mintAddress === NATIVE_MINT_ADDR;

    if (isNativeSol) {
      // 1. Check native SOL balance (wallet has SOL, not wSOL)
      // Uses withRpcFallback so a rate-limited Ankr endpoint auto-switches
      const lamportsNeeded = totalNeeded + BigInt(20_000_000); // amount + 0.9% dev fee + 0.02 SOL fee buffer
      let solBalance: number;
      try {
        solBalance = await withRpcFallback(conn => conn.getBalance(publicKey));
      } catch {
        setTxErr('RPC error checking SOL balance. Try again.');
        setTxStatus('error');
        return false;
      }

      if (BigInt(solBalance) < lamportsNeeded) {
        const have = (solBalance / LAMPORTS_PER_SOL).toFixed(4);
        const need = (Number(lamportsNeeded) / LAMPORTS_PER_SOL).toFixed(4);
        setTxErr(
          `Insufficient SOL: wallet has ${have} SOL, need ${need} SOL.\n` +
          `Use Devnet Tools → "0.5 SOL" to get more devnet SOL.`
        );
        setTxStatus('error');
        return false;
      }

      // 2. Build wrap transaction
      try {
        const wsolAta = await getAssociatedTokenAddress(
          NATIVE_MINT, publicKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
        );
        const wrapTx = new Transaction();

        // Create wSOL ATA if it doesn't exist
        let ataExists = false;
        try { await getAccount(txConn, wsolAta); ataExists = true; }
        catch { /* ATA doesn't exist — will create it */ }

        if (!ataExists) {
          wrapTx.add(createAssociatedTokenAccountInstruction(
            publicKey, wsolAta, publicKey, NATIVE_MINT,
            TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
          ));
        }

        // Transfer SOL lamports into the wSOL ATA then sync
        wrapTx.add(
          SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: wsolAta, lamports: totalNeeded }),
          createSyncNativeInstruction(wsolAta),
        );

        // 3. Sign + send wrap transaction
        setTxStatus('wrapping');
        setTxErr(null);
        setTxSig(null);
        // Fetch blockhash before sending so confirmTransaction gets a proper expiry
        // (the old confirmTransaction(sig, commitment) API can hang forever on devnet)
        const { blockhash: wrapBlockhash, lastValidBlockHeight: wrapLvbh } =
          await txConn.getLatestBlockhash('confirmed');
        wrapTx.recentBlockhash = wrapBlockhash;
        wrapTx.feePayer = publicKey;
        // skipPreflight for the same reason as the create tx: avoid an extra
        // simulation call to the overloaded public devnet RPC ("Internal error").
        const wrapSig = await sendTransaction(wrapTx, txConn, { skipPreflight: true, maxRetries: 5 });

        // 4. Wait for wrap to confirm before creating stream
        setTxStatus('confirming');
        await txConn.confirmTransaction(
          { signature: wrapSig, blockhash: wrapBlockhash, lastValidBlockHeight: wrapLvbh },
          'confirmed',
        );

        // Wrap done — fall through to createStream below
        setTxStatus('approving');

      } catch (e: unknown) {
        const msg = humanizeError(e);
        setTxErr(`SOL wrap failed: ${msg}`);
        setTxStatus('error');
        return false;
      }

    } else {
      // ── SPL token path: verify ATA exists and has enough balance ─────────────
      // withRpcFallback auto-switches RPC if Ankr rate-limits — prevents false
      // "account not found" errors when the RPC is temporarily unavailable.
      let acctAmount: bigint;
      try {
        const creatorTA = await getAssociatedTokenAddress(mintPk, publicKey);
        const acct = await withRpcFallback(conn => getAccount(conn, creatorTA));
        acctAmount = acct.amount;
      } catch (e: unknown) {
        const errMsg = (e instanceof Error ? e.message : String(e)).toLowerCase();
        // Distinguish "account truly not found" from RPC failures
        const isNotFound =
          errMsg.includes('could not find account') ||
          errMsg.includes('account does not exist') ||
          errMsg.includes('invalid account data') ||
          errMsg.includes('tokenaccountnotfound');
        if (isNotFound) {
          setTxErr(
            `No ${p.symbol} token account found.\n` +
            `Open Devnet Tools ▼ above and click "${p.symbol === 'USDC' ? '100 USDC' : p.symbol}" to fund your wallet, then retry.`
          );
        } else {
          // RPC error — all endpoints failed
          setTxErr(
            `RPC error reading ${p.symbol} balance. Devnet may be slow — wait 10 seconds and retry.\n` +
            `(${errMsg.slice(0, 100)})`
          );
        }
        setTxStatus('error');
        return false;
      }

      if (acctAmount < totalNeeded) {
        const have = (Number(acctAmount) / 10 ** p.decimals).toLocaleString();
        const need = (Number(totalNeeded) / 10 ** p.decimals).toLocaleString();
        setTxErr(`Insufficient balance: you have ${have} ${p.symbol}, need ${need} (incl. 0.9% dev fee)`);
        setTxStatus('error');
        return false;
      }

      // For SPL tokens: set approving state before createStream
      setTxStatus('approving');
      setTxErr(null);
      setTxSig(null);
    }

    // ── Create the vesting stream on-chain ────────────────────────────────────
    const streamId = BigInt(Date.now());

    try {
      const sig = await createStream({
        connection: txConn,
        authority:    publicKey,
        beneficiary:  beneficiaryPk,
        mint:         mintPk,
        streamId,
        amount:       rawAmount,
        startTs:      p.startTs,
        cliffTs:      p.cliffTs,
        endTs:        p.endTs,
        requiredTier: p.requiredTier ?? 0,
        streamName:   p.name?.trim() || undefined,
        sendTransaction: async (tx, conn) => {
          // skipPreflight: the create_stream instruction layout is verified
          // against the live program, so Phantom's preflight simulation adds no
          // safety — it only routes an extra call through the overloaded public
          // devnet RPC, which returns "Internal error"/429 and blocks valid txs.
          // We still confirm on-chain below, so a genuine revert is still caught.
          const s = await sendTransaction(tx, conn, { skipPreflight: true, maxRetries: 5 });
          setTxStatus('confirming');
          return s;
        },
      });
      setTxSig(sig);
      setTxStatus('done');
      return true;
    } catch (e: unknown) {
      const msg = humanizeError(e);
      setTxErr(msg);
      setTxStatus('error');
      return false;
    }
  };

  const reset = () => { setTxStatus('idle'); setTxSig(null); setTxErr(null); };

  return { submit, txStatus, txSig, txErr, isSubmitting, reset };
}

export function humanizeError(e: unknown): string {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  if (msg.includes('user rejected') || msg.includes('user cancelled') || msg.includes('user denied'))
    return 'Transaction cancelled — you rejected the wallet prompt.';
  // The free public devnet RPC (api.devnet.solana.com) rate-limits (429) and
  // returns JSON-RPC -32603 "Internal error" under load. Phantom runs its
  // preflight simulation through this endpoint, so an overloaded RPC surfaces
  // in the wallet as a bare "Internal error". Map it to something actionable.
  if (msg.includes('internal error') || msg.includes('-32603') ||
      msg.includes('429') || msg.includes('too many requests') ||
      msg.includes('rate limit') || msg.includes('failed to query'))
    return 'Devnet RPC is overloaded right now (Internal error / rate-limited). ' +
           'Wait ~15 seconds and press Create again. Permanent fix: set a dedicated ' +
           'endpoint via NEXT_PUBLIC_RPC_URL in the Vercel dashboard.';
  if (msg.includes('insufficient funds') || msg.includes('insufficient balance'))
    return 'Insufficient SOL for transaction fees. Get devnet SOL from faucet.';
  if (msg.includes('blockhash not found') || msg.includes('expired'))
    return 'Transaction expired — please try again.';
  if (msg.includes('0x1') || msg.includes('custom program error: 0x1'))
    return 'Insufficient token balance.';
  if (msg.includes('invalidamount') || msg.includes('6000'))
    return 'Amount must be greater than 0.';
  if (msg.includes('invalidtimestamp') || msg.includes('6001'))
    return 'Invalid dates — check start/end/cliff times.';
  if (msg.includes('invalidcliff') || msg.includes('6003'))
    return 'Cliff date must be between start and end dates.';
  return (e instanceof Error ? e.message : String(e)).slice(0, 200);
}
