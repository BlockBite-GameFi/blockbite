# Instruction Reference — BLOCKBITE TDP

Complete reference for all 5 instructions in `programs/blockbite-vesting/src/lib.rs`.

**Program ID:** `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`
**Anchor version:** 0.32.1

---

## Table of Contents

1. [create_stream](#1-create_stream)
2. [withdraw](#2-withdraw)
3. [cancel](#3-cancel)
4. [fund_vault](#4-fund_vault)
5. [update_proof](#5-update_proof)

---

## 1. `create_stream`

Creates a new vesting stream, locking tokens from the creator's ATA into a vault PDA.

### Parameters

| Parameter | Type | Description | Constraints |
|---|---|---|---|
| `amount` | `u64` | Total tokens to vest | Must be > 0 (`ZeroAmount`) |
| `start_ts` | `i64` | Unix timestamp — vesting clock starts | Must be < `end_ts` |
| `end_ts` | `i64` | Unix timestamp — fully vested | Must be > `start_ts` (`InvalidTimeRange`) |
| `cliff_ts` | `i64` | Unix timestamp — first possible unlock | Must be in `[start_ts, end_ts]` (`InvalidCliff`) |
| `required_tier` | `u8` | Milestone gate (0=none, 1=Tier1, 2=Tier2) | Must be <= 2 (`InvalidTier`) |

### Accounts

| Account | Type | Description |
|---|---|---|
| `creator` | `Signer` | Pays rent, must own `creator_ata` |
| `beneficiary` | `AccountInfo` | Token recipient |
| `stream` | `Account<StreamAccount>` | PDA: `["stream", creator, beneficiary]` |
| `vault` | `Account<TokenAccount>` | PDA: `["vault", stream]` — token escrow |
| `creator_ata` | `Account<TokenAccount>` | Creator's source token account |
| `mint` | `Account<Mint>` | SPL token mint |
| `token_program` | `Program<Token>` | SPL Token program |
| `system_program` | `Program<System>` | System program |
| `associated_token_program` | `Program<AssociatedToken>` | ATA program |

### Behavior

1. Validates all parameters (errors listed above)
2. Initializes `StreamAccount` PDA with all fields
3. Initializes `vault` as an ATA owned by the `stream` PDA
4. Transfers `amount` tokens from `creator_ata` → `vault` via CPI
5. Sets `amount_withdrawn = 0`, `cancelled = false`, `velocity_strikes = 0`

### TypeScript (Anchor client)

```typescript
const [streamPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("stream"), creator.publicKey.toBuffer(), beneficiary.toBuffer()],
  program.programId
);
const [vaultPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), streamPDA.toBuffer()],
  program.programId
);

await program.methods
  .createStream(
    new BN(amount),
    new BN(startTs),
    new BN(endTs),
    new BN(cliffTs),
    requiredTier  // 0 | 1 | 2
  )
  .accounts({
    creator: creator.publicKey,
    beneficiary,
    stream: streamPDA,
    vault: vaultPDA,
    creatorAta,
    mint,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  })
  .signers([creator])
  .rpc();
```

### Errors

| Error | Code | Condition |
|---|---|---|
| `ZeroAmount` | 6000 | `amount == 0` |
| `InvalidTimeRange` | 6001 | `end_ts <= start_ts` |
| `InvalidCliff` | 6002 | `cliff_ts < start_ts` or `cliff_ts > end_ts` |
| `InvalidTier` | 6010 | `required_tier > 2` |

---

## 2. `withdraw`

Transfers currently unlocked and unclaimed tokens to the beneficiary.

### Parameters

None (all derived from on-chain stream state).

### Accounts

| Account | Type | Description |
|---|---|---|
| `beneficiary` | `Signer` | Must match `stream.beneficiary` |
| `stream` | `Account<StreamAccount>` | PDA: `["stream", creator, beneficiary]` |
| `vault` | `Account<TokenAccount>` | PDA: `["vault", stream]` |
| `beneficiary_ata` | `Account<TokenAccount>` | Beneficiary's destination token account |
| `mint` | `Account<Mint>` | SPL token mint |
| `token_program` | `Program<Token>` | SPL Token program |
| `proof_cache` | `UncheckedAccount` | PDA: `["proof", stream, beneficiary]` — pass `SystemProgram.programId` if `required_tier == 0` |

### Behavior

1. Verifies `beneficiary` signer matches `stream.beneficiary`
2. Returns `StreamCancelled` if `stream.cancelled == true`
3. Cliff gate: returns `NothingToWithdraw` if `now < stream.cliff_ts`
4. Milestone gate: if `required_tier > 0`, deserializes `proof_cache` and checks `tier_reached >= required_tier`
5. Calculates `claimable = unlocked_amount(now) - amount_withdrawn`
6. Returns `NothingToWithdraw` if `claimable == 0`
7. VGPV check: updates `velocity_strikes` if action too fast; blocks at 3 strikes
8. Transfers `claimable` tokens from `vault` → `beneficiary_ata` via CPI
9. Updates `stream.amount_withdrawn += claimable`
10. Updates `stream.last_action_ts = now`

### Unlock Formula

```rust
fn unlocked_amount(&self, now: i64) -> u64 {
    if now < self.cliff_ts { return 0; }
    if now >= self.end_ts { return self.amount_total; }
    let elapsed = (now - self.start_ts) as u128;
    let duration = (self.end_ts - self.start_ts) as u128;
    ((self.amount_total as u128) * elapsed / duration) as u64
}
```

### TypeScript (Anchor client)

```typescript
// No milestone gate (required_tier = 0)
await program.methods
  .withdraw()
  .accounts({
    beneficiary: beneficiary.publicKey,
    stream: streamPDA,
    vault: vaultPDA,
    beneficiaryAta,
    mint,
    tokenProgram: TOKEN_PROGRAM_ID,
    proofCache: SystemProgram.programId,  // dummy for no gate
  })
  .signers([beneficiary])
  .rpc();

// With milestone gate (required_tier > 0)
const [proofCachePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("proof"), streamPDA.toBuffer(), beneficiary.publicKey.toBuffer()],
  program.programId
);

await program.methods
  .withdraw()
  .accounts({
    beneficiary: beneficiary.publicKey,
    stream: streamPDA,
    vault: vaultPDA,
    beneficiaryAta,
    mint,
    tokenProgram: TOKEN_PROGRAM_ID,
    proofCache: proofCachePDA,  // real PDA when gate enabled
  })
  .signers([beneficiary])
  .rpc();
```

### Errors

| Error | Code | Condition |
|---|---|---|
| `Unauthorized` | 6003 | Signer is not `stream.beneficiary` |
| `StreamCancelled` | 6004 | `stream.cancelled == true` |
| `NothingToWithdraw` | 6005 | `claimable == 0` or before cliff |
| `MilestoneNotMet` | 6009 | `tier_reached < required_tier` |
| `VelocityViolation` | 6008 | `velocity_strikes >= 3` (VGPV) |
| `Overflow` | 6007 | Arithmetic overflow in unlock calculation |

---

## 3. `cancel`

Creator cancels the stream. Atomically splits vested and unvested tokens.

### Parameters

None.

### Accounts

| Account | Type | Description |
|---|---|---|
| `creator` | `Signer` | Must match `stream.creator` |
| `stream` | `Account<StreamAccount>` | PDA: `["stream", creator, beneficiary]` |
| `vault` | `Account<TokenAccount>` | PDA: `["vault", stream]` |
| `creator_ata` | `Account<TokenAccount>` | Creator's destination for unvested tokens |
| `mint` | `Account<Mint>` | SPL token mint |
| `token_program` | `Program<Token>` | SPL Token program |

### Behavior

1. Verifies `creator` signer matches `stream.creator`
2. Returns `StreamCancelled` if already cancelled
3. Calculates `unlocked = unlocked_amount(now)`
4. Returns `FullyVested` if `unlocked >= stream.amount_total`
5. Calculates split:
   - `claimable = unlocked - amount_withdrawn` (stays in vault, beneficiary can still claim)
   - `return_amount = amount_total - unlocked` (goes back to creator)
6. Transfers `return_amount` from `vault` → `creator_ata` via CPI
7. Sets `stream.cancelled = true`

### Conservation Law

```
claimable + return_amount + amount_withdrawn = amount_total
```

Before `cliff_ts`: `unlocked = 0`, so `return_amount = amount_total - amount_withdrawn` (100% to creator).

### TypeScript (Anchor client)

```typescript
await program.methods
  .cancel()
  .accounts({
    creator: creator.publicKey,
    stream: streamPDA,
    vault: vaultPDA,
    creatorAta,
    mint,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([creator])
  .rpc();
```

### Errors

| Error | Code | Condition |
|---|---|---|
| `Unauthorized` | 6003 | Signer is not `stream.creator` |
| `StreamCancelled` | 6004 | Already cancelled |
| `FullyVested` | 6006 | `unlocked_amount(now) >= amount_total` |
| `Overflow` | 6007 | Arithmetic overflow |

---

## 4. `fund_vault`

Deposits tokens into the prize pool vault with automatic 70/15/10/5 revenue split.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `amount` | `u64` | Total tokens to deposit |

### Accounts

| Account | Type | Description |
|---|---|---|
| `depositor` | `Signer` | Source of funds |
| `depositor_ata` | `Account<TokenAccount>` | Depositor's source token account |
| `vault` | `Account<TokenAccount>` | Prize pool vault (70% goes here) |
| `team_ata` | `Account<TokenAccount>` | Team wallet ATA (15%) |
| `dev_ata` | `Account<TokenAccount>` | Dev wallet ATA (10%) |
| `referral_ata` | `Account<TokenAccount>` | Referral wallet ATA (5%) |
| `mint` | `Account<Mint>` | SPL token mint |
| `token_program` | `Program<Token>` | SPL Token program |

### Split Calculation

```
team_share     = floor(amount * 15 / 100)
dev_share      = floor(amount * 10 / 100)
referral_share = floor(amount * 5  / 100)
vault_share    = amount - team_share - dev_share - referral_share  // ~70% + dust
```

Floor arithmetic ensures rounding dust accumulates in the vault (never lost).

### TypeScript (Anchor client)

```typescript
await program.methods
  .fundVault(new BN(amount))
  .accounts({
    depositor: depositor.publicKey,
    depositorAta,
    vault: prizePoolVault,
    teamAta,
    devAta,
    referralAta,
    mint,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([depositor])
  .rpc();
```

### Errors

None (floor arithmetic + dust invariant prevents any error conditions).

---

## 5. `update_proof`

Admin writes a player's activity tier to their `ProofCache` PDA. Gated by VGPV bot detection.

### Parameters

| Parameter | Type | Description | Constraints |
|---|---|---|---|
| `tier` | `u8` | Activity tier to record | Must be <= 2 (`InvalidTier`) |

### Accounts

| Account | Type | Description |
|---|---|---|
| `admin` | `Signer` | Program authority (matches hardcoded admin pubkey) |
| `stream` | `Account<StreamAccount>` | The relevant stream |
| `proof_cache` | `Account<ProofCache>` | PDA: `["proof", stream, player]` — init_if_needed |
| `player` | `AccountInfo` | The player whose tier to update |
| `system_program` | `Program<System>` | System program (for init_if_needed) |

### Behavior

1. Verifies `admin` signer is the program authority
2. Returns `InvalidTier` if `tier > 2`
3. VGPV check: if last update was within 2 hours (`VGPV_MIN_SECONDS_PER_ACT = 7200`):
   - Increments `proof_cache.strikes`
   - Returns `VelocityViolation` if `strikes >= VGPV_MAX_VELOCITY_STRIKES (3)`
4. Writes `proof_cache.tier_reached = tier`
5. Updates `proof_cache.updated_at = now`

### TypeScript (Anchor client)

```typescript
const [proofCachePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("proof"), streamPDA.toBuffer(), player.toBuffer()],
  program.programId
);

await program.methods
  .updateProof(tier)  // 0 | 1 | 2
  .accounts({
    admin: admin.publicKey,
    stream: streamPDA,
    proofCache: proofCachePDA,
    player,
    systemProgram: SystemProgram.programId,
  })
  .signers([admin])
  .rpc();
```

### VGPV Constants

```rust
pub const VGPV_MIN_SECONDS_PER_ACT: i64 = 7_200;   // 2 hours
pub const VGPV_MAX_VELOCITY_STRIKES: u8  = 3;        // 3 strikes = blocked
```

### Errors

| Error | Code | Condition |
|---|---|---|
| `Unauthorized` | 6003 | Signer is not program admin |
| `InvalidTier` | 6010 | `tier > 2` |
| `VelocityViolation` | 6008 | `strikes >= 3` (bot detected) |

---

## Error Code Reference

| Error | Code | Instruction(s) |
|---|---|---|
| `ZeroAmount` | 6000 | `create_stream` |
| `InvalidTimeRange` | 6001 | `create_stream` |
| `InvalidCliff` | 6002 | `create_stream` |
| `Unauthorized` | 6003 | `withdraw`, `cancel`, `update_proof` |
| `StreamCancelled` | 6004 | `withdraw`, `cancel` |
| `NothingToWithdraw` | 6005 | `withdraw` |
| `FullyVested` | 6006 | `cancel` |
| `Overflow` | 6007 | `withdraw`, `cancel` |
| `VelocityViolation` | 6008 | `withdraw`, `update_proof` |
| `MilestoneNotMet` | 6009 | `withdraw` |
| `InvalidTier` | 6010 | `create_stream`, `update_proof` |

---

## PDA Derivation Reference

```typescript
// StreamAccount
const [streamPDA, streamBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("stream"), creator.toBuffer(), beneficiary.toBuffer()],
  programId
);

// Vault (TokenAccount for stream)
const [vaultPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), streamPDA.toBuffer()],
  programId
);

// ProofCache (per-player per-stream)
const [proofCachePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("proof"), streamPDA.toBuffer(), player.toBuffer()],
  programId
);
```

---

## Account Size Reference

| Account | Size (bytes) | Discriminator | Total |
|---|---|---|---|
| `StreamAccount` | 156 | 8 | 164 |
| `ProofCache` | 76 | 8 | 84 |
