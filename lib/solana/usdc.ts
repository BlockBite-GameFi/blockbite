/**
 * USDC SPL token helpers — real on-chain transfers on Devnet (and Mainnet).
 *
 * Flow for ticket purchase:
 *   1. Get (or create) the buyer's USDC ATA
 *   2. Get (or create) the recipient's USDC ATA  (FEE_WALLET)
 *   3. Build a transfer instruction  (buyer → fee wallet, exact USDC amount)
 *   4. Sign + send via the wallet adapter
 *   5. Confirm the transaction
 *   6. Return the signature for the explorer link
 *
 * Error handling:
 *   - InsufficientFundsError   → user has < required USDC
 *   - NoTokenAccountError      → user has no USDC ATA (hasn't received USDC yet)
 *   - Any other error bubbles up to the caller
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { USDC_MINT, FEE_WALLET, toUsdcLamports, USDC_DECIMALS, RPC_URL } from './config';

export class InsufficientFundsError extends Error {
  constructor(public have: number, public need: number) {
    super(`Insufficient USDC: have ${have.toFixed(2)}, need ${need.toFixed(2)}`);
    this.name = 'InsufficientFundsError';
  }
}

export class NoTokenAccountError extends Error {
  constructor() {
    super('No USDC token account found. Get devnet USDC from faucet.solana.com first.');
    this.name = 'NoTokenAccountError';
  }
}

/** Return the USDC balance of a wallet (0 if no ATA exists). */
export async function getUsdcBalance(
  connection: Connection,
  walletPubkey: PublicKey,
): Promise<number> {
  try {
    const ata = await getAssociatedTokenAddress(USDC_MINT, walletPubkey);
    const acct = await getAccount(connection, ata);
    return Number(acct.amount) / 10 ** USDC_DECIMALS;
  } catch {
    return 0;
  }
}

/**
 * Build a signed transaction that transfers `usdcAmount` from `payer` to `FEE_WALLET`.
 * The wallet adapter's `sendTransaction` must be called by the caller with the result.
 *
 * Returns a `Transaction` ready to sign.
 */
export async function buildTicketPurchaseTx(
  connection: Connection,
  payer: PublicKey,
  usdcAmount: number,
): Promise<Transaction> {
  const lamports = toUsdcLamports(usdcAmount);

  // Source ATA (buyer)
  const sourceAta = await getAssociatedTokenAddress(USDC_MINT, payer);

  // Verify balance
  let sourceBalance: bigint;
  try {
    const sourceAcct = await getAccount(connection, sourceAta);
    sourceBalance = sourceAcct.amount;
  } catch {
    throw new NoTokenAccountError();
  }
  if (sourceBalance < lamports) {
    throw new InsufficientFundsError(
      Number(sourceBalance) / 10 ** USDC_DECIMALS,
      usdcAmount,
    );
  }

  // Destination ATA (fee wallet) — create if needed
  const destAta = await getAssociatedTokenAddress(USDC_MINT, FEE_WALLET);
  const tx = new Transaction();

  try {
    await getAccount(connection, destAta);
  } catch {
    // ATA doesn't exist — add create instruction (payer funds the rent)
    tx.add(
      createAssociatedTokenAccountInstruction(
        payer,
        destAta,
        FEE_WALLET,
        USDC_MINT,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  // Transfer instruction
  tx.add(
    createTransferInstruction(
      sourceAta,
      destAta,
      payer,
      lamports,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = payer;

  return tx;
}

/**
 * Send a ticket purchase and wait for confirmation.
 * @param sendTransaction — from useWallet()
 * @returns transaction signature string
 */
export async function purchaseTickets(params: {
  connection: Connection;
  payer: PublicKey;
  usdcAmount: number;
  sendTransaction: (tx: Transaction, conn: Connection) => Promise<string>;
}): Promise<string> {
  const { connection, payer, usdcAmount, sendTransaction } = params;
  const tx = await buildTicketPurchaseTx(connection, payer, usdcAmount);
  const sig = await sendTransaction(tx, connection);
  await connection.confirmTransaction(
    { signature: sig, ...(await connection.getLatestBlockhash()) },
    'confirmed',
  );
  return sig;
}

/** Make a fresh Connection instance (used by server components or standalone calls). */
export function makeConnection(): Connection {
  return new Connection(RPC_URL, 'confirmed');
}
