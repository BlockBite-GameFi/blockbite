/**
 * Blockbite Vesting — program helpers for the frontend.
 * Program: DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf (devnet)
 */

import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { RPC_URL } from './config';

export const VESTING_PROGRAM_ID = new PublicKey(
  'DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf',
);

// Minimal IDL subset for client use — matches target/idl/blockbite_vesting.json
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const VESTING_IDL: any = {
  address: 'DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf',
  metadata: { name: 'blockbite_vesting', version: '0.1.0', spec: '0.1.0' },
  instructions: [
    {
      name: 'create_stream',
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34],
      accounts: [
        { name: 'authority', signer: true, writable: true },
        { name: 'beneficiary' },
        { name: 'mint' },
        { name: 'stream', writable: true, pda: { seeds: [{ kind: 'const', value: [115,116,114,101,97,109] }, { kind: 'arg', path: 'stream_id' }] } },
        { name: 'vault', writable: true },
        { name: 'authority_ata', writable: true },
        { name: 'token_program', address: TOKEN_PROGRAM_ID.toBase58() },
        { name: 'system_program', address: SystemProgram.programId.toBase58() },
        { name: 'rent', address: SYSVAR_RENT_PUBKEY.toBase58() },
      ],
      args: [
        { name: 'stream_id', type: 'u64' },
        { name: 'amount',    type: 'u64' },
        { name: 'start_ts',  type: 'i64' },
        { name: 'cliff_ts',  type: 'i64' },
        { name: 'end_ts',    type: 'i64' },
      ],
    },
    {
      name: 'withdraw',
      discriminator: [183, 18, 70, 156, 148, 109, 161, 35],
      accounts: [
        { name: 'beneficiary', signer: true },
        { name: 'stream', writable: true },
        { name: 'vault', writable: true },
        { name: 'beneficiary_ata', writable: true },
        { name: 'token_program', address: TOKEN_PROGRAM_ID.toBase58() },
      ],
      args: [],
    },
    {
      name: 'cancel',
      discriminator: [232, 219, 223, 41, 219, 236, 220, 190],
      accounts: [
        { name: 'authority', signer: true },
        { name: 'beneficiary' },
        { name: 'stream', writable: true },
        { name: 'vault', writable: true },
        { name: 'authority_ata', writable: true },
        { name: 'beneficiary_ata', writable: true },
        { name: 'token_program', address: TOKEN_PROGRAM_ID.toBase58() },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'StreamAccount',
      discriminator: [93, 16, 183, 134, 219, 120, 208, 52],
    },
  ],
  types: [
    {
      name: 'StreamAccount',
      type: {
        kind: 'struct',
        fields: [
          { name: 'authority',        type: 'publicKey' },
          { name: 'beneficiary',      type: 'publicKey' },
          { name: 'mint',             type: 'publicKey' },
          { name: 'amount_total',     type: 'u64' },
          { name: 'amount_withdrawn', type: 'u64' },
          { name: 'start_ts',         type: 'i64' },
          { name: 'cliff_ts',         type: 'i64' },
          { name: 'end_ts',           type: 'i64' },
          { name: 'stream_id',        type: 'u64' },
          { name: 'cancelled',        type: 'bool' },
          { name: 'bump',             type: 'u8' },
          { name: 'velocity_strikes', type: 'u8' },
          { name: 'last_action_ts',   type: 'i64' },
        ],
      },
    },
  ],
};

export interface StreamData {
  publicKey: PublicKey;
  authority: PublicKey;
  beneficiary: PublicKey;
  mint: PublicKey;
  amountTotal: bigint;
  amountWithdrawn: bigint;
  startTs: number;
  cliffTs: number;
  endTs: number;
  streamId: bigint;
  cancelled: boolean;
  velocityStrikes: number;
}

export function calcUnlocked(stream: StreamData, nowSec: number): bigint {
  if (stream.cancelled) return stream.amountWithdrawn;
  if (nowSec < stream.cliffTs) return 0n;
  if (nowSec < stream.startTs) return 0n;
  if (nowSec >= stream.endTs) return stream.amountTotal;
  const elapsed  = BigInt(nowSec - stream.startTs);
  const duration = BigInt(stream.endTs - stream.startTs);
  return (stream.amountTotal * elapsed) / duration;
}

export function calcClaimable(stream: StreamData, nowSec: number): bigint {
  const unlocked = calcUnlocked(stream, nowSec);
  const diff = unlocked - stream.amountWithdrawn;
  return diff < 0n ? 0n : diff;
}

export function vestingProgress(stream: StreamData, nowSec: number): number {
  if (stream.amountTotal === 0n) return 0;
  const unlocked = calcUnlocked(stream, nowSec);
  return Math.min(100, Number((unlocked * 100n) / stream.amountTotal));
}

export function getStreamPDA(authority: PublicKey, streamId: bigint): [PublicKey, number] {
  const streamIdBuf = Buffer.alloc(8);
  streamIdBuf.writeBigUInt64LE(streamId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('stream'), authority.toBuffer(), streamIdBuf],
    VESTING_PROGRAM_ID,
  );
}

export function getVaultPDA(authority: PublicKey, streamId: bigint): [PublicKey, number] {
  const streamIdBuf = Buffer.alloc(8);
  streamIdBuf.writeBigUInt64LE(streamId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), authority.toBuffer(), streamIdBuf],
    VESTING_PROGRAM_ID,
  );
}

// Fetch all streams where wallet is authority (offset 8) or beneficiary (offset 40)
export async function fetchMyStreams(
  connection: Connection,
  wallet: PublicKey,
): Promise<StreamData[]> {
  const discriminator = Buffer.from([93, 16, 183, 134, 219, 120, 208, 52]);

  const [asCreator, asRecipient] = await Promise.all([
    connection.getProgramAccounts(VESTING_PROGRAM_ID, {
      filters: [
        { memcmp: { offset: 0, bytes: discriminator.toString('base64'), encoding: 'base64' } },
        { memcmp: { offset: 8, bytes: wallet.toBase58() } },
      ],
    }),
    connection.getProgramAccounts(VESTING_PROGRAM_ID, {
      filters: [
        { memcmp: { offset: 0, bytes: discriminator.toString('base64'), encoding: 'base64' } },
        { memcmp: { offset: 40, bytes: wallet.toBase58() } },
      ],
    }),
  ]);

  const seen = new Set<string>();
  const all = [...asCreator, ...asRecipient].filter(({ pubkey }) => {
    if (seen.has(pubkey.toBase58())) return false;
    seen.add(pubkey.toBase58());
    return true;
  });

  return all.map(({ pubkey, account }) => parseStreamAccount(pubkey, account.data));
}

function parseStreamAccount(pubkey: PublicKey, data: Buffer): StreamData {
  let offset = 8; // skip discriminator
  const authority    = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
  const beneficiary  = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
  const mint         = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
  const amountTotal      = data.readBigUInt64LE(offset); offset += 8;
  const amountWithdrawn  = data.readBigUInt64LE(offset); offset += 8;
  const startTs      = Number(data.readBigInt64LE(offset)); offset += 8;
  const cliffTs      = Number(data.readBigInt64LE(offset)); offset += 8;
  const endTs        = Number(data.readBigInt64LE(offset)); offset += 8;
  const streamId     = data.readBigUInt64LE(offset); offset += 8;
  const cancelled    = data[offset] !== 0; offset += 1;
  offset += 1; // bump
  const velocityStrikes = data[offset]; offset += 1;

  return {
    publicKey: pubkey,
    authority, beneficiary, mint,
    amountTotal, amountWithdrawn,
    startTs, cliffTs, endTs,
    streamId, cancelled, velocityStrikes,
  };
}

export function getVestingProgram(provider: AnchorProvider): Program {
  return new Program(VESTING_IDL, provider);
}

export function fmtTokens(raw: bigint, decimals = 6): string {
  const n = Number(raw) / 10 ** decimals;
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function fmtDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
