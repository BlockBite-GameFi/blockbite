/**
 * Browser-side helper for the blockbite-vesting Anchor program.
 *
 * Wraps the three on-chain instructions (create_stream, withdraw, cancel)
 * with a friendlier API that integrates with the wallet adapter's
 * `sendTransaction` signature instead of needing an Anchor Wallet.
 *
 * Keeps the IDL import isolated so route-level pages don't pull the
 * 6KB JSON twice.
 */

import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
// IDL is co-located in lib/anchor/ because .vercelignore excludes target/.
// The Anchor build still writes target/idl/blockbite_vesting.json on CI;
// when it changes substantively, run `cp target/idl/blockbite_vesting.json
// lib/anchor/idl.json` to keep this copy in sync (or wire a postbuild
// script in Anchor.toml).
import IDL from './idl.json';

export const VESTING_PROGRAM_ID = new PublicKey(IDL.address);

export type SendTx = (
  tx: Transaction,
  connection: Connection,
  opts?: { signers?: anchor.web3.Signer[] },
) => Promise<string>;

export function deriveStreamPDA(authority: PublicKey, streamId: BN) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('stream'),
      authority.toBuffer(),
      streamId.toArrayLike(Buffer, 'le', 8),
    ],
    VESTING_PROGRAM_ID,
  );
}

export function deriveVaultPDA(authority: PublicKey, streamId: BN) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('vault'),
      authority.toBuffer(),
      streamId.toArrayLike(Buffer, 'le', 8),
    ],
    VESTING_PROGRAM_ID,
  );
}

/** Build a read-only Anchor Program — no signing capability. */
function readonlyProgram(connection: Connection): Program {
  // Anchor 0.32: provider with no wallet works for reads, instruction.build*
  const provider = new anchor.AnchorProvider(
    connection,
    {} as anchor.Wallet,
    { commitment: 'confirmed' },
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(IDL as anchor.Idl, provider as any);
}

export interface CreateStreamParams {
  connection:   Connection;
  authority:    PublicKey;     // creator (signer)
  beneficiary:  PublicKey;     // recipient
  mint:         PublicKey;     // SPL token mint
  streamId:     bigint;        // unique per (authority, mint) — frontend picks
  amount:       bigint;        // in raw token units (already × 10^decimals)
  startTs:      number;        // unix seconds
  cliffTs:      number;        // unix seconds — 0 = no cliff
  endTs:        number;        // unix seconds
  sendTransaction: SendTx;
}

/**
 * Builds + signs + sends the create_stream transaction.
 * Returns the signature on confirmation.
 */
export async function createStream(p: CreateStreamParams): Promise<string> {
  const program = readonlyProgram(p.connection);
  const streamIdBn = new BN(p.streamId.toString());

  const [streamPda] = deriveStreamPDA(p.authority, streamIdBn);
  const [vaultPda]  = deriveVaultPDA(p.authority, streamIdBn);
  const authorityAta = await getAssociatedTokenAddress(p.mint, p.authority);

  // Build the instruction with Anchor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ix = await (program.methods as any)
    .createStream(
      streamIdBn,
      new BN(p.amount.toString()),
      new BN(p.startTs),
      new BN(p.cliffTs),
      new BN(p.endTs),
    )
    .accounts({
      authority:     p.authority,
      beneficiary:   p.beneficiary,
      mint:          p.mint,
      stream:        streamPda,
      vault:         vaultPda,
      authorityAta:  authorityAta,
      tokenProgram:  TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent:          SYSVAR_RENT_PUBKEY,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  tx.feePayer = p.authority;
  const { blockhash, lastValidBlockHeight } = await p.connection.getLatestBlockhash('finalized');
  tx.recentBlockhash = blockhash;

  const sig = await p.sendTransaction(tx, p.connection);
  await p.connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    'confirmed',
  );
  return sig;
}

export interface WithdrawParams {
  connection:      Connection;
  beneficiary:     PublicKey;
  stream:          PublicKey;
  vault:           PublicKey;
  beneficiaryAta:  PublicKey;
  mint:            PublicKey;
  sendTransaction: SendTx;
}

export async function withdraw(p: WithdrawParams): Promise<string> {
  const program = readonlyProgram(p.connection);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ix = await (program.methods as any)
    .withdraw()
    .accounts({
      beneficiary:    p.beneficiary,
      stream:         p.stream,
      vault:          p.vault,
      beneficiaryAta: p.beneficiaryAta,
      tokenProgram:   TOKEN_PROGRAM_ID,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  tx.feePayer = p.beneficiary;
  const { blockhash, lastValidBlockHeight } = await p.connection.getLatestBlockhash('finalized');
  tx.recentBlockhash = blockhash;
  const sig = await p.sendTransaction(tx, p.connection);
  await p.connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight }, 'confirmed',
  );
  return sig;
}

export interface CancelParams {
  connection:      Connection;
  authority:       PublicKey;
  beneficiary:     PublicKey;
  stream:          PublicKey;
  vault:           PublicKey;
  authorityAta:    PublicKey;
  beneficiaryAta:  PublicKey;
  sendTransaction: SendTx;
}

export async function cancelStream(p: CancelParams): Promise<string> {
  const program = readonlyProgram(p.connection);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ix = await (program.methods as any)
    .cancel()
    .accounts({
      authority:      p.authority,
      beneficiary:    p.beneficiary,
      stream:         p.stream,
      vault:          p.vault,
      authorityAta:   p.authorityAta,
      beneficiaryAta: p.beneficiaryAta,
      tokenProgram:   TOKEN_PROGRAM_ID,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  tx.feePayer = p.authority;
  const { blockhash, lastValidBlockHeight } = await p.connection.getLatestBlockhash('finalized');
  tx.recentBlockhash = blockhash;
  const sig = await p.sendTransaction(tx, p.connection);
  await p.connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight }, 'confirmed',
  );
  return sig;
}

/** Read a stream account (decoded). Returns null if not found. */
export async function fetchStream(connection: Connection, streamPda: PublicKey) {
  try {
    const program = readonlyProgram(connection);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await (program.account as any).streamAccount.fetch(streamPda);
    return data as {
      authority: PublicKey;
      beneficiary: PublicKey;
      mint: PublicKey;
      amountTotal: BN;
      amountWithdrawn: BN;
      startTs: BN;
      cliffTs: BN;
      endTs: BN;
      streamId: BN;
      cancelled: boolean;
      bump: number;
    };
  } catch {
    return null;
  }
}

/**
 * Helper: prepend a createATA instruction if the recipient doesn't have one.
 * Caller adds the rest of the transaction on top.
 */
export async function ensureAtaIx(
  connection: Connection,
  payer:      PublicKey,
  owner:      PublicKey,
  mint:       PublicKey,
) {
  const ata = await getAssociatedTokenAddress(mint, owner);
  try {
    await getAccount(connection, ata);
    return null;
  } catch {
    return createAssociatedTokenAccountInstruction(payer, ata, owner, mint);
  }
}
