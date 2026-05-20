# blockbite-vesting — Token Distribution Protocol (TDP)

A composable Solana Anchor program for programmable token vesting with cliff, milestone, and linear unlock mechanics.

**Program ID (devnet + localnet):** `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`

---

## Overview

This program implements a Token Distribution Protocol (TDP) that any project can use to lock and stream SPL tokens to beneficiaries under configurable conditions:

1. **Cliff Gate** — zero tokens unlock before `cliff_ts`
2. **Milestone Gate** — beneficiary must have reached a required activity tier (optional, set `required_tier = 0` to skip)
3. **Linear Streaming** — after cliff, tokens unlock continuously per second at rate `amount / (end_ts - start_ts)`

The game (Blockbite puzzle) acts as the **proof-of-activity oracle** — playing the game advances the player's `ProofCache.tier_reached`, which gates milestone-based streams. Startup vesting or DAO airdrops that don't need the game simply set `required_tier = 0`.

---

## Instructions

### `create_stream`

Creates a new vesting stream and locks tokens in a vault PDA.

| Parameter | Type | Description |
|---|---|---|
| `amount` | `u64` | Total tokens to vest (must be > 0) |
| `start_ts` | `i64` | Unix timestamp — vesting start |
| `end_ts` | `i64` | Unix timestamp — vesting end (must be > start_ts) |
| `cliff_ts` | `i64` | Unix timestamp — first unlock (must be in [start_ts, end_ts]) |
| `required_tier` | `u8` | Minimum ProofCache tier needed to withdraw (0 = no gate, 1 or 2 = game milestone required) |

**Accounts:**
- `creator` — signer, pays rent
- `beneficiary` — token recipient
- `stream` — StreamAccount PDA (`["stream", creator, beneficiary]`)
- `vault` — Vault TokenAccount PDA (`["vault", stream]`) — holds locked tokens
- `creator_ata` — creator's token account (deducted)
- `mint`, `token_program`, `system_program`, `associated_token_program`

**Errors:** `ZeroAmount`, `InvalidTimeRange`, `InvalidCliff`, `InvalidTier`

---

### `withdraw`

Transfers the currently unlocked (and not yet withdrawn) tokens to the beneficiary.

**Formula:** `unlocked(t) = amount_total * (t - start_ts) / (end_ts - start_ts)`

Cliff gate: returns `NothingToWithdraw` if `now < cliff_ts`.
Milestone gate: returns `MilestoneNotMet` if `proof_cache.tier_reached < required_tier`.

**Accounts:**
- `beneficiary` — signer
- `stream`, `vault`, `beneficiary_ata`, `mint`, `token_program`
- `proof_cache` — ProofCache PDA (`["proof", stream, beneficiary]`) — pass `SystemProgram.programId` when `required_tier = 0`

**Errors:** `NothingToWithdraw`, `MilestoneNotMet`, `StreamCancelled`, `Overflow`

---

### `cancel`

Creator cancels the stream. Splits tokens atomically:
- Unlocked portion → beneficiary vault (claimable)
- Unvested portion → creator ATA

Cannot cancel a fully-vested or already-cancelled stream. Before `cliff_ts`, 100% returns to creator.

**Accounts:**
- `creator` — signer
- `stream`, `vault`, `creator_ata`, `mint`, `token_program`

**Errors:** `Unauthorized`, `StreamCancelled`, `FullyVested`

---

### `fund_vault`

Deposits revenue into the prize pool with automatic 70/15/10/5 split:

| Destination | Share |
|---|---|
| Prize pool vault | 70% |
| Team wallet | 15% |
| Dev wallet | 10% |
| Referral wallet | 5% |
| Dust rounding | → vault |

**Errors:** none (floor arithmetic + dust→vault guarantees no loss)

---

### `update_proof`

Admin writes a player's activity tier to the ProofCache PDA. Only the program authority can call this.

| Parameter | Type | Description |
|---|---|---|
| `tier` | `u8` | Activity tier to record (0, 1, or 2) |

VGPV (Velocity-Gated Proof Validation): each proof update increments `velocity_strikes` if called within 2 hours of the last action. After 3 strikes, the player is blocked (`VelocityViolation`).

**Errors:** `Unauthorized`, `InvalidTier`, `VelocityViolation`

---

## Account Structures

### StreamAccount (156 bytes + 8 discriminator = 164 total)

```rust
pub struct StreamAccount {
    pub creator:           Pubkey,   // 32
    pub beneficiary:       Pubkey,   // 32
    pub mint:              Pubkey,   // 32
    pub vault:             Pubkey,   // 32
    pub amount_total:      u64,      // 8
    pub amount_withdrawn:  u64,      // 8
    pub start_ts:          i64,      // 8
    pub end_ts:            i64,      // 8
    pub cliff_ts:          i64,      // 8
    pub cancelled:         bool,     // 1
    pub required_tier:     u8,       // 1  ← milestone gate
    pub velocity_strikes:  u8,       // 1  ← VGPV
    pub last_action_ts:    i64,      // 8  ← VGPV
}
```

### ProofCache (76 bytes + 8 discriminator = 84 total)

```rust
pub struct ProofCache {
    pub stream:       Pubkey,   // 32
    pub player:       Pubkey,   // 32
    pub tier_reached: u8,       // 1
    pub updated_at:   i64,      // 8
    pub bump:         u8,       // 1
    pub strikes:      u8,       // 1
    pub last_ts:      i64,      // 8 (padding for VGPV tracking)
}
```

---

## Error Codes

| Code | Description |
|---|---|
| `ZeroAmount` | amount == 0 |
| `InvalidTimeRange` | end_ts <= start_ts |
| `InvalidCliff` | cliff_ts outside [start_ts, end_ts] |
| `InvalidTier` | required_tier > 2 |
| `NothingToWithdraw` | no tokens available yet |
| `Unauthorized` | wrong signer for instruction |
| `StreamCancelled` | stream already cancelled |
| `FullyVested` | cannot cancel fully-vested stream |
| `MilestoneNotMet` | tier_reached < required_tier |
| `Overflow` | arithmetic overflow |
| `VelocityViolation` | VGPV 3-strike limit exceeded |

---

## Mathematical Specification

```
unlock(t) = amount_total * (t - start_ts) / (end_ts - start_ts)

where:
  t        = current unix timestamp
  duration = end_ts - start_ts (seconds)
  rate     = amount_total / duration (tokens per second)

clamp:
  t < cliff_ts    → unlock = 0
  t >= end_ts     → unlock = amount_total

cancel invariant:
  claimable + return_to_creator + amount_withdrawn = amount_total
```

All arithmetic uses `u128` intermediate values to prevent overflow on large token amounts.

---

## PDA Seeds

| Account | Seeds |
|---|---|
| StreamAccount | `["stream", creator.key(), beneficiary.key()]` |
| Vault (TokenAccount) | `["vault", stream.key()]` |
| ProofCache | `["proof", stream.key(), player.key()]` |

---

## Build & Test

```bash
# Compile
anchor build

# Run all tests on localnet
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

Requires: Anchor CLI 0.32.1, Solana CLI, Rust with `sbf` target.

---

## Use Cases

| Use Case | `required_tier` | Oracle |
|---|---|---|
| Startup team vesting | 0 | none — time-only |
| DAO airdrop (snapshot) | 0 | none — time-only |
| Game player reward | 1 or 2 | Blockbite game CPI |
| Investor cliff lock | 0 | none — cliff + linear |
| Grant milestone release | 1 | admin writes proof |
