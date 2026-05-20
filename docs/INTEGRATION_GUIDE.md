# Integration Guide — BLOCKBITE TDP

How to integrate the BLOCKBITE Token Distribution Protocol into your project.

**Program ID:** `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`
**Cluster:** Solana devnet (mainnet after audit)

---

## Table of Contents

1. [Setup](#1-setup)
2. [Basic Vesting Stream (No Oracle)](#2-basic-vesting-stream-no-oracle)
3. [Milestone-Gated Stream (With Oracle)](#3-milestone-gated-stream-with-oracle)
4. [Reading Stream State](#4-reading-stream-state)
5. [Listening to Events](#5-listening-to-events)
6. [Revenue Split (fund_vault)](#6-revenue-split-fund_vault)
7. [Writing an Oracle Plugin](#7-writing-an-oracle-plugin)
8. [React Hook Example](#8-react-hook-example)

---

## 1. Setup

### Install dependencies

```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

### Initialize the Anchor provider

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import idl from "./blockbite_vesting.json"; // from target/idl/

const PROGRAM_ID = new PublicKey("DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf");

export function getProgram(wallet: anchor.Wallet) {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new anchor.Program(idl as anchor.Idl, PROGRAM_ID, provider);
}
```

### PDA helpers

```typescript
import { BN } from "@coral-xyz/anchor";

export function deriveStreamPDA(
  authority: PublicKey,
  streamId: BN,
  programId: PublicKey
): [PublicKey, number] {
  const streamIdBuffer = streamId.toArrayLike(Buffer, "le", 8);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stream"), authority.toBuffer(), streamIdBuffer],
    programId
  );
}

export function deriveVaultPDA(
  authority: PublicKey,
  streamId: BN,
  programId: PublicKey
): [PublicKey, number] {
  const streamIdBuffer = streamId.toArrayLike(Buffer, "le", 8);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), authority.toBuffer(), streamIdBuffer],
    programId
  );
}

export function deriveProofCachePDA(
  streamPDA: PublicKey,
  player: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("proof_cache"), streamPDA.toBuffer(), player.toBuffer()],
    programId
  );
}
```

---

## 2. Basic Vesting Stream (No Oracle)

Use case: startup team vesting, investor lock, DAO airdrop — no game required.

### Create a stream (required_tier = 0)

```typescript
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

async function createBasicStream(
  program: anchor.Program,
  authority: anchor.Wallet,
  beneficiary: PublicKey,
  mint: PublicKey,
  params: {
    streamId: BN;
    amount: BN;       // in raw token units
    startTs: BN;      // unix seconds
    cliffTs: BN;      // unix seconds, or 0 for no cliff
    endTs: BN;        // unix seconds
  }
) {
  const [streamPDA] = deriveStreamPDA(authority.publicKey, params.streamId, program.programId);
  const [vaultPDA]  = deriveVaultPDA(authority.publicKey, params.streamId, program.programId);
  const authorityAta = await getAssociatedTokenAddress(mint, authority.publicKey);

  const tx = await program.methods
    .createStream(
      params.streamId,
      params.amount,
      params.startTs,
      params.cliffTs,  // 0 = no cliff
      params.endTs,
      0                // required_tier = 0 (no oracle gate)
    )
    .accounts({
      authority: authority.publicKey,
      beneficiary,
      mint,
      stream: streamPDA,
      vault: vaultPDA,
      authorityAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return { tx, streamPDA, vaultPDA };
}
```

### Withdraw (beneficiary claims)

```typescript
async function withdrawTokens(
  program: anchor.Program,
  beneficiary: anchor.Wallet,
  authority: PublicKey,
  streamId: BN,
  mint: PublicKey
) {
  const [streamPDA] = deriveStreamPDA(authority, streamId, program.programId);
  const [vaultPDA]  = deriveVaultPDA(authority, streamId, program.programId);
  const beneficiaryAta = await getAssociatedTokenAddress(mint, beneficiary.publicKey);

  const tx = await program.methods
    .withdraw()
    .accounts({
      beneficiary: beneficiary.publicKey,
      stream: streamPDA,
      vault: vaultPDA,
      beneficiaryAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      proofCache: SystemProgram.programId, // dummy — no gate
    })
    .rpc();

  return tx;
}
```

---

## 3. Milestone-Gated Stream (With Oracle)

Use case: game player reward, grant milestone, DAO vote gate.

### Create a milestone-gated stream

```typescript
async function createGatedStream(
  program: anchor.Program,
  authority: anchor.Wallet,
  beneficiary: PublicKey,
  mint: PublicKey,
  streamId: BN,
  amount: BN,
  startTs: BN,
  endTs: BN,
  requiredTier: 1 | 2  // player must reach this tier before withdrawing
) {
  const [streamPDA] = deriveStreamPDA(authority.publicKey, streamId, program.programId);
  const [vaultPDA]  = deriveVaultPDA(authority.publicKey, streamId, program.programId);
  const authorityAta = await getAssociatedTokenAddress(mint, authority.publicKey);

  return program.methods
    .createStream(
      streamId,
      amount,
      startTs,
      new BN(0),      // no cliff (cliffTs = 0)
      endTs,
      requiredTier    // 1 or 2
    )
    .accounts({
      authority: authority.publicKey,
      beneficiary,
      mint,
      stream: streamPDA,
      vault: vaultPDA,
      authorityAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}
```

### Write proof (admin/oracle advances player tier)

```typescript
async function writeProof(
  program: anchor.Program,
  admin: anchor.Wallet,
  authority: PublicKey,
  streamId: BN,
  player: PublicKey,
  cohortId: number,
  tierReached: 0 | 1 | 2
) {
  const [streamPDA] = deriveStreamPDA(authority, streamId, program.programId);
  const [proofCachePDA] = deriveProofCachePDA(streamPDA, player, program.programId);

  return program.methods
    .updateProof(cohortId, tierReached)
    .accounts({
      admin: admin.publicKey,
      stream: streamPDA,
      player,
      proofCache: proofCachePDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
```

### Withdraw with milestone gate

```typescript
async function withdrawWithProof(
  program: anchor.Program,
  beneficiary: anchor.Wallet,
  authority: PublicKey,
  streamId: BN,
  mint: PublicKey
) {
  const [streamPDA] = deriveStreamPDA(authority, streamId, program.programId);
  const [vaultPDA]  = deriveVaultPDA(authority, streamId, program.programId);
  const [proofCachePDA] = deriveProofCachePDA(streamPDA, beneficiary.publicKey, program.programId);
  const beneficiaryAta = await getAssociatedTokenAddress(mint, beneficiary.publicKey);

  return program.methods
    .withdraw()
    .accounts({
      beneficiary: beneficiary.publicKey,
      stream: streamPDA,
      vault: vaultPDA,
      beneficiaryAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      proofCache: proofCachePDA,  // real PDA — required_tier > 0
    })
    .rpc();
}
```

---

## 4. Reading Stream State

### Fetch a StreamAccount

```typescript
async function getStream(
  program: anchor.Program,
  authority: PublicKey,
  streamId: BN
) {
  const [streamPDA] = deriveStreamPDA(authority, streamId, program.programId);
  const stream = await program.account.streamAccount.fetch(streamPDA);
  return stream;
}

// Returns:
// {
//   authority: PublicKey,
//   beneficiary: PublicKey,
//   mint: PublicKey,
//   amountTotal: BN,        // total tokens locked
//   amountWithdrawn: BN,    // tokens already claimed
//   startTs: BN,            // unix seconds
//   cliffTs: BN,            // unix seconds
//   endTs: BN,              // unix seconds
//   streamId: BN,
//   cancelled: boolean,
//   bump: number,
//   velocityStrikes: number,
//   lastActionTs: BN,
//   requiredTier: number,   // 0 | 1 | 2
// }
```

### Calculate claimable amount off-chain

```typescript
function calcClaimable(stream: any, nowSeconds: number): number {
  const now = BigInt(nowSeconds);
  const start = BigInt(stream.startTs.toString());
  const cliff = BigInt(stream.cliffTs.toString());
  const end = BigInt(stream.endTs.toString());
  const total = BigInt(stream.amountTotal.toString());
  const withdrawn = BigInt(stream.amountWithdrawn.toString());

  if (now < cliff) return 0;
  if (now >= end) return Number(total - withdrawn);

  const elapsed = now - start;
  const duration = end - start;
  const unlocked = (total * elapsed) / duration;
  const available = unlocked - withdrawn;
  return Number(available < 0n ? 0n : available);
}
```

### Fetch all streams for a creator

```typescript
async function getStreamsForAuthority(
  program: anchor.Program,
  authority: PublicKey
) {
  return program.account.streamAccount.all([
    {
      memcmp: {
        offset: 8,  // skip 8-byte discriminator
        bytes: authority.toBase58(),
      },
    },
  ]);
}
```

### Fetch ProofCache for a player

```typescript
async function getProofCache(
  program: anchor.Program,
  streamPDA: PublicKey,
  player: PublicKey
) {
  const [proofCachePDA] = deriveProofCachePDA(streamPDA, player, program.programId);
  try {
    return await program.account.proofCache.fetch(proofCachePDA);
  } catch {
    return null; // doesn't exist yet (no proof written)
  }
}
```

---

## 5. Listening to Events

```typescript
async function listenToEvents(program: anchor.Program) {
  // StreamCreated — emitted on create_stream
  program.addEventListener("StreamCreated", (event) => {
    console.log("Stream created:", event.stream.toBase58());
    console.log("  Amount:", event.amount.toString());
    console.log("  Cliff:", new Date(event.cliffTs.toNumber() * 1000));
  });

  // Withdrawn — emitted on withdraw
  program.addEventListener("Withdrawn", (event) => {
    console.log("Withdraw:", event.amount.toString(), "tokens claimed");
  });

  // Cancelled — emitted on cancel
  program.addEventListener("Cancelled", (event) => {
    console.log("Stream cancelled, refunded:", event.refunded.toString());
  });

  // ProofUpdated — emitted on update_proof
  program.addEventListener("ProofUpdated", (event) => {
    console.log("Proof updated for player:", event.player.toBase58());
    console.log("  Tier reached:", event.tierReached);
  });
}
```

---

## 6. Revenue Split (fund_vault)

```typescript
async function fundVault(
  program: anchor.Program,
  funder: anchor.Wallet,
  authority: PublicKey,
  streamId: BN,
  mint: PublicKey,
  amount: BN,
  teamAta: PublicKey,
  devAta: PublicKey,
  referralAta: PublicKey
) {
  const [streamPDA] = deriveStreamPDA(authority, streamId, program.programId);
  const [vaultPDA]  = deriveVaultPDA(authority, streamId, program.programId);
  const funderAta = await getAssociatedTokenAddress(mint, funder.publicKey);

  return program.methods
    .fundVault(amount)
    .accounts({
      funder: funder.publicKey,
      stream: streamPDA,
      vault: vaultPDA,
      funderAta,
      teamAta,
      devAta,
      referralAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}
```

Split breakdown (automatic, on-chain):
- 70% → prize pool vault (compounds rewards)
- 15% → team wallet
- 10% → dev wallet
- 5% → referral wallet (pass team wallet if no referrer)

---

## 7. Writing an Oracle Plugin

Any program can act as an oracle by calling `update_proof` via CPI. Example game CPI:

```rust
// In your game program, on level completion:
pub fn level_complete(ctx: Context<LevelComplete>, tier: u8) -> Result<()> {
    // Verify game completion (your logic here)
    
    // CPI to TDP update_proof
    let cpi_program = ctx.accounts.vesting_program.to_account_info();
    let cpi_accounts = UpdateProof {
        admin: ctx.accounts.game_authority.to_account_info(),
        stream: ctx.accounts.stream.to_account_info(),
        player: ctx.accounts.player.to_account_info(),
        proof_cache: ctx.accounts.proof_cache.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    blockbite_vesting::cpi::update_proof(cpi_ctx, 0, tier)?;
    
    Ok(())
}
```

This design makes TDP **oracle-agnostic**: the vesting contract doesn't care whether the oracle is a game, a DAO vote, or an admin key. It only reads `proof_cache.tier_reached`.

---

## 8. React Hook Example

```typescript
// hooks/useStream.ts
import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl/blockbite_vesting.json";

const PROGRAM_ID = new PublicKey("DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf");

export function useStream(authority: string, streamId: number) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [stream, setStream] = useState<any>(null);
  const [claimable, setClaimable] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet.publicKey) return;

    const provider = new AnchorProvider(connection, wallet as any, {});
    const program = new Program(idl as any, PROGRAM_ID, provider);

    const [streamPDA] = deriveStreamPDA(
      new PublicKey(authority),
      new BN(streamId),
      PROGRAM_ID
    );

    async function load() {
      try {
        const s = await program.account.streamAccount.fetch(streamPDA);
        setStream(s);
        const now = Math.floor(Date.now() / 1000);
        setClaimable(calcClaimable(s, now));
      } catch {
        setStream(null);
      } finally {
        setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, [authority, streamId, wallet.publicKey]);

  return { stream, claimable, loading };
}
```

---

## Error Handling

All TDP errors are defined in `VestingError`. Match them with:

```typescript
import { AnchorError } from "@coral-xyz/anchor";

try {
  await withdraw(...);
} catch (e) {
  if (e instanceof AnchorError) {
    switch (e.error.errorCode.code) {
      case "NothingToWithdraw":
        // show "Nothing to claim yet"
        break;
      case "MilestoneNotMet":
        // show "Complete more game levels first"
        break;
      case "StreamCancelled":
        // show "Stream was cancelled"
        break;
      case "VelocityViolation":
        // show "Too many requests — wait before claiming again"
        break;
      default:
        console.error(e.error.errorMessage);
    }
  }
}
```
