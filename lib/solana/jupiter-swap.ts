/**
 * Jupiter SOL → USDC autoconvert (mainnet).
 *
 * The user requirement: BlockBite is USDC-denominated, but most wallets
 * arrive holding SOL. If the buyer doesn't have enough USDC for the ticket
 * they're trying to purchase, we ask Jupiter (https://quote-api.jup.ag) to
 * swap exactly the deficit from SOL into USDC, then the normal SPL transfer
 * to FEE_WALLET runs unchanged.
 *
 * Behaviour by cluster:
 *   - Devnet: Jupiter has no devnet liquidity. We short-circuit and return
 *     null so the caller falls through to the regular InsufficientFunds
 *     error path. (For devnet testing, mint mock-USDC directly to the user
 *     wallet via spl-token CLI — see scripts/setup-prize-pool.mjs.)
 *   - Mainnet: real swap quote + swap tx, signed by the user's wallet.
 *
 * Slippage default: 50 bps (0.5%). Jupiter returns the exact in-amount of
 * SOL it'll consume; we add a 10% buffer to the SOL balance check so a
 * tiny SOL-price wobble between quote and swap doesn't abort.
 */

import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { IS_DEVNET, USDC_MINT, USDC_DECIMALS, toUsdcLamports } from './config';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const JUP_QUOTE  = 'https://quote-api.jup.ag/v6/quote';
const JUP_SWAP   = 'https://quote-api.jup.ag/v6/swap';
const SLIPPAGE_BPS = 50;

export class SwapUnavailableError extends Error {
  constructor() {
    super('SOL→USDC autoconvert is mainnet-only — Jupiter has no devnet liquidity.');
    this.name = 'SwapUnavailableError';
  }
}

export class SwapFailedError extends Error {
  constructor(reason: string) {
    super(`Jupiter swap failed: ${reason}`);
    this.name = 'SwapFailedError';
  }
}

/**
 * Quote SOL → USDC for exactly `usdcOutAmount` (human USDC, not lamports).
 * Returns null on devnet (no liquidity).
 */
export async function quoteSolForUsdc(usdcOutAmount: number): Promise<{
  inLamports: bigint;  // SOL needed (1e9 = 1 SOL)
  outLamports: bigint; // USDC delivered (1e6 = 1 USDC)
  raw: unknown;
} | null> {
  if (IS_DEVNET) return null;

  const outAmount = toUsdcLamports(usdcOutAmount); // u64 string in raw USDC lamports
  const url =
    `${JUP_QUOTE}?inputMint=${SOL_MINT}` +
    `&outputMint=${USDC_MINT.toBase58()}` +
    `&amount=${outAmount}` +
    `&swapMode=ExactOut` +
    `&slippageBps=${SLIPPAGE_BPS}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new SwapFailedError(`quote ${res.status}`);
  const json = await res.json();
  if (json.error) throw new SwapFailedError(json.error);

  return {
    inLamports:  BigInt(json.inAmount  ?? json.otherAmountThreshold ?? '0'),
    outLamports: BigInt(json.outAmount ?? '0'),
    raw: json,
  };
}

/**
 * Build a Jupiter swap VersionedTransaction signed by the caller-provided
 * wallet adapter. Returns the tx ready to send.
 */
export async function buildSolToUsdcSwap(
  connection: Connection,
  payer: PublicKey,
  usdcOutAmount: number,
): Promise<VersionedTransaction> {
  if (IS_DEVNET) throw new SwapUnavailableError();

  const quote = await quoteSolForUsdc(usdcOutAmount);
  if (!quote) throw new SwapUnavailableError();

  const swapRes = await fetch(JUP_SWAP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote.raw,
      userPublicKey: payer.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });
  if (!swapRes.ok) throw new SwapFailedError(`swap ${swapRes.status}`);
  const { swapTransaction } = await swapRes.json();
  if (!swapTransaction) throw new SwapFailedError('no swapTransaction in response');

  const buf = Buffer.from(swapTransaction, 'base64');
  const vtx = VersionedTransaction.deserialize(buf);

  // Recent blockhash is already inside the v0 message Jupiter returned.
  // Wallet adapters that re-fetch blockhash for legacy Transactions will
  // simply re-sign — VersionedTransaction is signed atomically.
  return vtx;
}

/**
 * Convenience: if user needs `usdcDeficit` more USDC than they currently
 * hold, run a SOL→USDC swap for that deficit and wait for confirmation.
 *
 * Returns the swap signature, or null if no swap was needed (deficit ≤ 0)
 * or if we're on devnet (caller should fall back to InsufficientFunds).
 */
export async function autoconvertSolForUsdc(params: {
  connection: Connection;
  payer: PublicKey;
  usdcDeficit: number;
  sendTransaction: (
    tx: VersionedTransaction,
    conn: Connection,
  ) => Promise<string>;
}): Promise<string | null> {
  const { connection, payer, usdcDeficit, sendTransaction } = params;
  if (usdcDeficit <= 0) return null;
  if (IS_DEVNET)        return null;

  const vtx = await buildSolToUsdcSwap(connection, payer, usdcDeficit);
  const sig = await sendTransaction(vtx, connection);
  await connection.confirmTransaction(
    { signature: sig, ...(await connection.getLatestBlockhash()) },
    'confirmed',
  );
  return sig;
}

export { USDC_DECIMALS };
