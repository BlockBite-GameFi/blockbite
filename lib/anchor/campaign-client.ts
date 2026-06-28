/**
 * campaign-client.ts — Client adapter for BlockBite Campaign & Milestone instructions.
 *
 * Program ID: Aso25jcqxjZ2X3A1QSV4ZgZkj4B8pw6JNd4jNVcpB7pq
 *
 * Campaign flow:
 *   1. Founder creates campaign → funds escrow
 *   2. Founder adds milestones (verified via declared game program)
 *   3. Recipient submits proof hash
 *   4. Game verification marks milestone as verified
 *   5. Recipient claims tokens from escrow
 */

import { BN } from '@coral-xyz/anchor';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

// ─── Program constants ────────────────────────────────────────────────────────
// Override via NEXT_PUBLIC_CAMPAIGN_PROGRAM_ID for localnet (Surfpool) testing.
export const CAMPAIGN_PROGRAM_ID = new PublicKey(
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CAMPAIGN_PROGRAM_ID) ||
  'Aso25jcqxjZ2X3A1QSV4ZgZkj4B8pw6JNd4jNVcpB7pq',
);

/**
 * Fetch the game authority pubkey from the embedded game server API.
 * Falls back to env var or placeholder if the fetch fails.
 */
export async function fetchGameAuthorityPubkey(): Promise<PublicKey> {
  // Env var override (highest priority)
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GAME_AUTHORITY_PUBKEY) {
    return new PublicKey(process.env.NEXT_PUBLIC_GAME_AUTHORITY_PUBKEY);
  }
  try {
    const res = await fetch('/api/game/health');
    if (res.ok) {
      const { gameAuthority } = await res.json() as { gameAuthority?: string };
      if (gameAuthority) return new PublicKey(gameAuthority);
    }
  } catch { /* non-fatal */ }
  // Fallback (should only happen if API route is unreachable)
  return new PublicKey('Aso25jcqxjZ2X3A1QSV4ZgZkj4B8pw6JNd4jNVcpB7pq');
}

/** Synchronous fallback for code that can't await — use fetchGameAuthorityPubkey() where possible */
export const GAME_AUTHORITY_PUBKEY = new PublicKey(
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GAME_AUTHORITY_PUBKEY) ||
  'Aso25jcqxjZ2X3A1QSV4ZgZkj4B8pw6JNd4jNVcpB7pq',
);

export const CAMPAIGN_ACCOUNT_SIZE = 90;
// Rust: 8 (disc) + 32+32+32+32 (pubkeys) + 8 (u64) + 6 (u8 fields) = 150
export const MILESTONE_ACCOUNT_SIZE = 150;

// Instruction discriminators: sha256("global:<name>")[0..8]
const DISC_CREATE_CAMPAIGN  = Buffer.from([111, 131, 187, 98, 160, 193, 114, 244]);
const DISC_CREATE_MILESTONE = Buffer.from([239, 58, 201, 28, 40, 186, 173, 48]);
const DISC_SUBMIT_PROOF     = Buffer.from([54, 241, 46, 84, 4, 212, 46, 94]);
const DISC_VERIFY_GAME      = Buffer.from([81, 26, 37, 190, 207, 209, 205, 211]);
const DISC_CLAIM_MILESTONE  = Buffer.from([211, 134, 152, 37, 3, 82, 214, 189]);

// ─── PDA derivation ───────────────────────────────────────────────────────────

export function deriveCampaignPDA(
  founder: PublicKey,
  seed: BN,
): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(seed.toString()));
  return PublicKey.findProgramAddressSync(
    [Buffer.from('campaign'), founder.toBuffer(), buf],
    CAMPAIGN_PROGRAM_ID,
  );
}

export function deriveCampaignEscrowPDA(campaign: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('campaign_escrow'), campaign.toBuffer()],
    CAMPAIGN_PROGRAM_ID,
  );
}

export function deriveMilestonePDA(
  campaign: PublicKey,
  milestoneSeed: BN,
): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(milestoneSeed.toString()));
  return PublicKey.findProgramAddressSync(
    [Buffer.from('milestone'), campaign.toBuffer(), buf],
    CAMPAIGN_PROGRAM_ID,
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CampaignInfo {
  pubkey:          PublicKey;
  founder:         PublicKey;
  titleHash:       Uint8Array;
  totalBudget:     BN;
  allocatedAmount: BN;
  milestoneCount:  number;
  bump:            number;
}

export interface MilestoneInfo {
  pubkey:           PublicKey;
  campaign:         PublicKey;
  recipient:        PublicKey;
  descriptionHash:  Uint8Array;
  /** On-chain field is `game_authority` — the game server's signing pubkey. */
  gameProgramId:    PublicKey;
  tokenAmount:      BN;
  targetLevel:      number;
  achievedLevel:    number;
  difficulty:       number;
  isVerified:       boolean;
  isClaimed:        boolean;
  bump:             number;
  /** Always false — submit_proof instruction does not exist in the current program. */
  proofSubmitted:   boolean;
  /** Always empty — no proof hash is stored on-chain. */
  proofHash:        Uint8Array;
}

export type SendTx = (
  tx: Transaction,
  connection: Connection,
) => Promise<string>;

// ─── Decode helpers ───────────────────────────────────────────────────────────

function decodeCampaign(pubkey: PublicKey, rawData: Uint8Array): CampaignInfo | null {
  const data = Buffer.from(rawData);
  if (data.length < CAMPAIGN_ACCOUNT_SIZE) return null;
  try {
    let off = 8;
    const founder         = new PublicKey(data.slice(off, off + 32)); off += 32;
    const titleHash       = new Uint8Array(data.slice(off, off + 32)); off += 32;
    const totalBudget     = new BN(data.readBigUInt64LE(off).toString()); off += 8;
    const allocatedAmount = new BN(data.readBigUInt64LE(off).toString()); off += 8;
    const milestoneCount  = data[off]; off += 1;
    const bump            = data[off];
    return { pubkey, founder, titleHash, totalBudget, allocatedAmount, milestoneCount, bump };
  } catch {
    return null;
  }
}

function decodeMilestone(pubkey: PublicKey, rawData: Uint8Array): MilestoneInfo | null {
  const data = Buffer.from(rawData);
  if (data.length < MILESTONE_ACCOUNT_SIZE) return null;
  try {
    // Rust layout (after 8-byte discriminator):
    // campaign(32) recipient(32) description_hash(32) game_authority(32)
    // token_amount(8) target_level(1) achieved_level(1) difficulty(1)
    // is_verified(1) is_claimed(1) bump(1)
    let off = 8;
    const campaign        = new PublicKey(data.slice(off, off + 32)); off += 32; // 40
    const recipient       = new PublicKey(data.slice(off, off + 32)); off += 32; // 72
    const descriptionHash = new Uint8Array(data.slice(off, off + 32)); off += 32; // 104
    const gameProgramId   = new PublicKey(data.slice(off, off + 32)); off += 32; // 136
    const tokenAmount     = new BN(data.readBigUInt64LE(off).toString()); off += 8; // 144
    const targetLevel     = data[off]; off += 1; // 145
    const achievedLevel   = data[off]; off += 1; // 146
    const difficulty      = data[off]; off += 1; // 147
    const isVerified      = data[off] !== 0; off += 1; // 148
    const isClaimed       = data[off] !== 0; off += 1; // 149
    const bump            = data[off]; // 150
    return {
      pubkey, campaign, recipient, descriptionHash, gameProgramId, tokenAmount,
      targetLevel, achievedLevel, difficulty, isVerified, isClaimed, bump,
      proofSubmitted: false,
      proofHash: new Uint8Array(32),
    };
  } catch {
    return null;
  }
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

export async function getAllCampaigns(connection: Connection): Promise<CampaignInfo[]> {
  const accs = await connection.getProgramAccounts(CAMPAIGN_PROGRAM_ID, {
    filters: [{ dataSize: CAMPAIGN_ACCOUNT_SIZE }],
  });
  return accs.flatMap(({ pubkey, account }) => {
    const d = decodeCampaign(pubkey, account.data);
    return d ? [d] : [];
  });
}

export async function getCampaignsByFounder(
  connection: Connection,
  founder: PublicKey,
): Promise<CampaignInfo[]> {
  const accs = await connection.getProgramAccounts(CAMPAIGN_PROGRAM_ID, {
    filters: [
      { dataSize: CAMPAIGN_ACCOUNT_SIZE },
      { memcmp: { offset: 8, bytes: founder.toBase58() } },
    ],
  });
  return accs.flatMap(({ pubkey, account }) => {
    const d = decodeCampaign(pubkey, account.data);
    return d ? [d] : [];
  });
}

export async function fetchCampaign(
  connection: Connection,
  campaignPda: PublicKey,
): Promise<CampaignInfo | null> {
  try {
    const acc = await connection.getAccountInfo(campaignPda);
    if (!acc) return null;
    return decodeCampaign(campaignPda, acc.data);
  } catch { return null; }
}

export async function getMilestonesByCampaign(
  connection: Connection,
  campaign: PublicKey,
): Promise<MilestoneInfo[]> {
  const accs = await connection.getProgramAccounts(CAMPAIGN_PROGRAM_ID, {
    filters: [
      { dataSize: MILESTONE_ACCOUNT_SIZE },
      { memcmp: { offset: 8, bytes: campaign.toBase58() } },
    ],
  });
  return accs.flatMap(({ pubkey, account }) => {
    const d = decodeMilestone(pubkey, account.data);
    return d ? [d] : [];
  });
}

export async function getMilestonesByRecipient(
  connection: Connection,
  recipient: PublicKey,
): Promise<MilestoneInfo[]> {
  const accs = await connection.getProgramAccounts(CAMPAIGN_PROGRAM_ID, {
    filters: [
      { dataSize: MILESTONE_ACCOUNT_SIZE },
      { memcmp: { offset: 40, bytes: recipient.toBase58() } },
    ],
  });
  return accs.flatMap(({ pubkey, account }) => {
    const d = decodeMilestone(pubkey, account.data);
    return d ? [d] : [];
  });
}

export async function fetchMilestone(
  connection: Connection,
  milestonePda: PublicKey,
): Promise<MilestoneInfo | null> {
  try {
    const acc = await connection.getAccountInfo(milestonePda);
    if (!acc) return null;
    return decodeMilestone(milestonePda, acc.data);
  } catch { return null; }
}

// ─── Seed-finding utilities ───────────────────────────────────────────────────

/**
 * Brute-force the milestone seed by matching the known PDA address.
 * Tries seeds 0..maxSeed synchronously (~1ms per attempt).
 */
export function findMilestoneSeedSync(
  campaignPDA: PublicKey,
  milestonePDA: PublicKey,
  maxSeed = 2000,
): bigint | null {
  for (let seed = 0n; seed <= BigInt(maxSeed); seed++) {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(seed);
    const [derived] = PublicKey.findProgramAddressSync(
      [Buffer.from('milestone'), campaignPDA.toBuffer(), buf],
      CAMPAIGN_PROGRAM_ID,
    );
    if (derived.equals(milestonePDA)) return seed;
  }
  return null;
}

/**
 * Brute-force the campaign seed by matching the known PDA address.
 * Tries seeds 0..maxSeed synchronously (~1ms per attempt).
 */
export function findCampaignSeedSync(
  founder: PublicKey,
  campaignPDA: PublicKey,
  maxSeed = 2000,
): bigint | null {
  for (let seed = 0n; seed <= BigInt(maxSeed); seed++) {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(seed);
    const [derived] = PublicKey.findProgramAddressSync(
      [Buffer.from('campaign'), founder.toBuffer(), buf],
      CAMPAIGN_PROGRAM_ID,
    );
    if (derived.equals(campaignPDA)) return seed;
  }
  return null;
}

// ─── Instruction builders ─────────────────────────────────────────────────────

function mkCreateCampaignIx(
  founder: PublicKey,
  mint: PublicKey,
  founderTA: PublicKey,
  campaignEscrow: PublicKey,
  campaignPDA: PublicKey,
  titleHash: Uint8Array,
  totalBudget: bigint,
  seed: bigint,
): TransactionInstruction {
  const data = Buffer.alloc(56);
  DISC_CREATE_CAMPAIGN.copy(data, 0);
  Buffer.from(titleHash).copy(data, 8);
  data.writeBigUInt64LE(totalBudget, 40);
  data.writeBigUInt64LE(seed, 48);
  return new TransactionInstruction({
    programId: CAMPAIGN_PROGRAM_ID,
    keys: [
      { pubkey: founder,              isSigner: true,  isWritable: true  },
      { pubkey: mint,                 isSigner: false, isWritable: false },
      { pubkey: founderTA,            isSigner: false, isWritable: true  },
      { pubkey: campaignEscrow,       isSigner: false, isWritable: true  },
      { pubkey: campaignPDA,          isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,     isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

function mkCreateMilestoneIx(
  founder: PublicKey,
  campaignPDA: PublicKey,
  milestonePDA: PublicKey,
  descriptionHash: Uint8Array,
  campaignSeed: bigint,
  milestoneSeed: bigint,
  tokenAmount: bigint,
  gameAuthority: PublicKey,
  recipient: PublicKey,
  targetLevel: number,
  difficulty: number,
): TransactionInstruction {
  // Rust: description_hash(32) + campaign_seed(8) + milestone_seed(8) + token_amount(8)
  //       + game_authority(32) + recipient(32) + target_level(1) + difficulty(1) = 122
  // + 8 discriminator = 130 bytes total
  const data = Buffer.alloc(130);
  DISC_CREATE_MILESTONE.copy(data, 0);
  Buffer.from(descriptionHash).copy(data, 8);
  data.writeBigUInt64LE(campaignSeed, 40);
  data.writeBigUInt64LE(milestoneSeed, 48);
  data.writeBigUInt64LE(tokenAmount, 56);
  gameAuthority.toBuffer().copy(data, 64);
  recipient.toBuffer().copy(data, 96);
  data[128] = targetLevel;
  data[129] = difficulty;
  return new TransactionInstruction({
    programId: CAMPAIGN_PROGRAM_ID,
    keys: [
      { pubkey: founder,        isSigner: true,  isWritable: true  },
      { pubkey: campaignPDA,    isSigner: false, isWritable: true  },
      { pubkey: milestonePDA,   isSigner: false, isWritable: true  },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

function mkSubmitProofIx(
  recipient: PublicKey,
  campaign: PublicKey,
  milestonePDA: PublicKey,
  milestoneSeed: bigint,
  proofHash: Uint8Array,
): TransactionInstruction {
  const data = Buffer.alloc(48);
  DISC_SUBMIT_PROOF.copy(data, 0);
  data.writeBigUInt64LE(milestoneSeed, 8);
  Buffer.from(proofHash).copy(data, 16);
  return new TransactionInstruction({
    programId: CAMPAIGN_PROGRAM_ID,
    keys: [
      { pubkey: recipient,    isSigner: true,  isWritable: true  },
      { pubkey: campaign,     isSigner: false, isWritable: false },
      { pubkey: milestonePDA, isSigner: false, isWritable: true  },
    ],
    data,
  });
}

// NOTE: verify_game requires game_authority to sign — must be called server-side.
function mkVerifyGameIx(
  campaign: PublicKey,
  milestonePDA: PublicKey,
  gameAuthority: PublicKey,
  milestoneSeed: bigint,
  achievedLevel: number,
): TransactionInstruction {
  // Rust: #[instruction(milestone_seed: u64, achieved_level: u8)]
  // = 8 (disc) + 8 (seed) + 1 (level) = 17 bytes total
  const data = Buffer.alloc(17);
  DISC_VERIFY_GAME.copy(data, 0);
  data.writeBigUInt64LE(milestoneSeed, 8);
  data[16] = achievedLevel;
  return new TransactionInstruction({
    programId: CAMPAIGN_PROGRAM_ID,
    keys: [
      { pubkey: campaign,      isSigner: false, isWritable: false },
      { pubkey: milestonePDA,  isSigner: false, isWritable: true  },
      { pubkey: gameAuthority, isSigner: true,  isWritable: false },
    ],
    data,
  });
}

function mkClaimMilestoneIx(
  recipient: PublicKey,
  milestonePDA: PublicKey,
  campaignPDA: PublicKey,
  mint: PublicKey,
  campaignEscrow: PublicKey,
  recipientTA: PublicKey,
  milestoneSeed: bigint,
  campaignSeed: bigint,
): TransactionInstruction {
  const data = Buffer.alloc(24);
  DISC_CLAIM_MILESTONE.copy(data, 0);
  data.writeBigUInt64LE(milestoneSeed, 8);
  data.writeBigUInt64LE(campaignSeed, 16);
  return new TransactionInstruction({
    programId: CAMPAIGN_PROGRAM_ID,
    keys: [
      { pubkey: recipient,           isSigner: true,  isWritable: true  },
      { pubkey: milestonePDA,        isSigner: false, isWritable: true  },
      { pubkey: campaignPDA,         isSigner: false, isWritable: false },
      { pubkey: mint,                isSigner: false, isWritable: false },
      { pubkey: campaignEscrow,      isSigner: false, isWritable: true  },
      { pubkey: recipientTA,         isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,    isSigner: false, isWritable: false },
    ],
    data,
  });
}

// ─── High-level tx functions ──────────────────────────────────────────────────

export interface CreateCampaignParams {
  connection:      Connection;
  founder:         PublicKey;
  mint:            PublicKey;
  totalBudget:     bigint;
  titleHash:       Uint8Array;
  seed:            bigint;
  sendTransaction: SendTx;
}

export async function createCampaign(p: CreateCampaignParams): Promise<string> {
  const [campaignPDA] = deriveCampaignPDA(p.founder, new BN(p.seed.toString()));
  const [campaignEscrow] = deriveCampaignEscrowPDA(campaignPDA);
  const founderTA = await getAssociatedTokenAddress(p.mint, p.founder);

  const tx = new Transaction();
  tx.add(mkCreateCampaignIx(
    p.founder, p.mint, founderTA, campaignEscrow, campaignPDA,
    p.titleHash, p.totalBudget, p.seed,
  ));

  const { blockhash, lastValidBlockHeight } = await p.connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = p.founder;

  const sig = await p.sendTransaction(tx, p.connection);
  await p.connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  return sig;
}

export interface CreateMilestoneParams {
  connection:      Connection;
  founder:         PublicKey;
  campaignPDA:     PublicKey;
  milestonePDA:    PublicKey;
  descriptionHash: Uint8Array;
  campaignSeed:    bigint;
  milestoneSeed:   bigint;
  tokenAmount:     bigint;
  /** Game server's signing public key. Must match game server's GAME_AUTHORITY_SECRET_KEY. */
  gameProgramId:   PublicKey;
  recipient:       PublicKey;
  /** Level recipient must reach to unlock claim. Range: 1–30. */
  targetLevel:     number;
  /** 1=Easy, 2=Medium, 3=Hard */
  difficulty:      number;
  sendTransaction: SendTx;
}

export async function createMilestone(p: CreateMilestoneParams): Promise<string> {
  const tx = new Transaction();
  tx.add(mkCreateMilestoneIx(
    p.founder, p.campaignPDA, p.milestonePDA,
    p.descriptionHash,
    p.campaignSeed, p.milestoneSeed, p.tokenAmount,
    p.gameProgramId,
    p.recipient,
    p.targetLevel,
    p.difficulty,
  ));

  const { blockhash, lastValidBlockHeight } = await p.connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = p.founder;

  const sig = await p.sendTransaction(tx, p.connection);
  await p.connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  return sig;
}

export interface SubmitProofParams {
  connection:      Connection;
  recipient:       PublicKey;
  campaign:        PublicKey;
  milestonePDA:    PublicKey;
  milestoneSeed:   bigint;
  proofHash:       Uint8Array;
  sendTransaction: SendTx;
}

export async function submitProof(p: SubmitProofParams): Promise<string> {
  const tx = new Transaction();
  tx.add(mkSubmitProofIx(
    p.recipient, p.campaign, p.milestonePDA, p.milestoneSeed, p.proofHash,
  ));

  const { blockhash, lastValidBlockHeight } = await p.connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = p.recipient;

  const sig = await p.sendTransaction(tx, p.connection);
  await p.connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  return sig;
}

export interface VerifyGameParams {
  connection:      Connection;
  campaign:        PublicKey;
  milestonePDA:    PublicKey;
  /** game_authority pubkey — must be the signer. Use from game server only, not browser. */
  gameAuthority:   PublicKey;
  milestoneSeed:   bigint;
  achievedLevel:   number;
  sendTransaction: SendTx;
}

/**
 * Builds and sends a verify_game transaction.
 * MUST be called server-side: game_authority private key is required to sign.
 * From the browser, use the game server's POST /api/verify endpoint instead.
 */
export async function verifyGame(p: VerifyGameParams): Promise<string> {
  const tx = new Transaction();
  tx.add(mkVerifyGameIx(
    p.campaign, p.milestonePDA, p.gameAuthority, p.milestoneSeed, p.achievedLevel,
  ));

  const { blockhash, lastValidBlockHeight } = await p.connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = p.gameAuthority;

  const sig = await p.sendTransaction(tx, p.connection);
  await p.connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  return sig;
}

export interface ClaimMilestoneParams {
  connection:      Connection;
  recipient:       PublicKey;
  milestonePDA:    PublicKey;
  campaignPDA:     PublicKey;
  mint:            PublicKey;
  campaignEscrow:  PublicKey;
  recipientTA:     PublicKey;
  milestoneSeed:   bigint;
  campaignSeed:    bigint;
  sendTransaction: SendTx;
}

export async function claimMilestone(p: ClaimMilestoneParams): Promise<string> {
  const tx = new Transaction();

  try {
    await getAccount(p.connection, p.recipientTA);
  } catch {
    tx.add(createAssociatedTokenAccountInstruction(
      p.recipient, p.recipientTA, p.recipient, p.mint,
    ));
  }

  tx.add(mkClaimMilestoneIx(
    p.recipient, p.milestonePDA, p.campaignPDA, p.mint,
    p.campaignEscrow, p.recipientTA, p.milestoneSeed, p.campaignSeed,
  ));

  const { blockhash, lastValidBlockHeight } = await p.connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = p.recipient;

  const sig = await p.sendTransaction(tx, p.connection);
  await p.connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  return sig;
}
