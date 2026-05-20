# Week 5 Work Report — BLOCKBITE TDP
**Developer:** Bryan Nayrbry (@nayrbryanGaming)
**Program:** Mancer Work Season 1 — Solana Superteam
**Due:** 2026-05-23
**Submission portal:** https://nest.mancer.work

---

## Deliverable

**PR:** Week 5 — Bryan — Cliff + Milestone + Cancel
**GitHub Repo:** https://github.com/nayrbryanGaming/blockblast
**Program ID (devnet):** `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`

---

## What Was Built

### 1. Smart Contract Extensions (`programs/blockbite-vesting/src/lib.rs`)

Three major additions to the existing TDP (Token Distribution Protocol):

#### Cliff Gate (Time-Based Unlock Floor)
- `cliff_ts: i64` field in `StreamAccount` — Unix timestamp
- `withdraw()` returns `NothingToWithdraw` if `now < cliff_ts`
- Validation: `cliff_ts` must be in range `[start_ts, end_ts]`
- Error: `InvalidCliff` on out-of-range cliff

#### Milestone Gate (ProofCache Tier Gate)
- `required_tier: u8` field in `StreamAccount` (0 = no gate, 1 or 2 = requires oracle)
- New `ProofCache` PDA account (`["proof", stream, player]`)
- `withdraw()` checks `proof_cache.tier_reached >= required_tier` when `required_tier > 0`
- `update_proof(tier: u8)` instruction — admin writes tier to ProofCache
- VGPV (Velocity-Gated Proof Validation) embedded: 2hr minimum between updates, 3-strike bot block
- Error: `MilestoneNotMet` when tier not reached; `VelocityViolation` on bot detection; `InvalidTier` on tier > 2

#### Cancel Instruction
- `cancel()` — creator-only, atomically splits tokens:
  - Unlocked portion → stays in vault (beneficiary can still claim)
  - Unvested portion → transferred to creator ATA
- Cannot cancel if stream is already cancelled (`StreamCancelled`)
- Cannot cancel if stream is fully vested (`FullyVested` — new error)
- Before `cliff_ts`: 100% of unvested tokens return to creator
- Conservation law enforced: `claimable + return_to_creator + amount_withdrawn = amount_total`
- `cancelled: bool` flag set to block future withdrawals

### 2. Test Suite (`tests/vesting.ts`)

30+ tests in two describe blocks. All Week 4 regression tests updated for new `create_stream` signature (added `required_tier` param, dummy `SystemProgram.programId` for proof_cache on no-gate streams).

**10 new Week 5 tests:**

| Test | What It Verifies |
|---|---|
| W5.1 | 0 tokens before cliff_ts (time gate works) |
| W5.2 | Linear vesting after cliff passes |
| W5.3 | MilestoneNotMet when tier_reached < required_tier |
| W5.4 | Withdraw succeeds after admin writes proof (tier met) |
| W5.5 | Cancel returns Unauthorized for non-creator |
| W5.6 | Cancel mid-stream: 50/50 split, conservation law checked |
| W5.7 | StreamCancelled on double cancel attempt |
| W5.8 | FullyVested error when cancel called on fully-vested stream |
| W5.9 | Cancel before cliff returns 100% to creator |
| W5.10 | Withdraw blocked after stream is cancelled |

### 3. Architecture Documents

- `AUDIT_TDP_ARCHITECTURE.md` — Full audit of external 3-tier architecture proposal, 9 ASCII flowcharts, math verification, competitor comparison
- `TDP_FIRST_ARCHITECTURE.md` — TDP-first pivot narrative, 10 flowcharts, mathematics, use cases
- `programs/blockbite-vesting/README.md` — Instruction reference, account structures, error codes, PDA seeds
- Root `README.md` updated to TDP-first positioning

---

## What Works

- All smart contract instructions compile (Anchor 0.32.1, Rust stable)
- All 3 new error codes operational: `FullyVested`, `MilestoneNotMet`, `InvalidCliff`
- Cliff gate: time-based blocking works correctly
- Milestone gate: `required_tier=0` bypass works, `required_tier=1` blocks until proof updated
- Cancel: split calculation correct, `cancelled` flag blocks future operations
- All Week 4 regression tests updated and passing
- 10 new Week 5 tests passing on localnet
- `fund_vault` 70/15/10/5 split with dust→vault invariant
- `update_proof` VGPV bot detection working

---

## What Doesn't Work / Blockers

- **Devnet deployment:** Not yet deployed for Week 5 (devnet keypair funding required)
  - Program was deployed in W4 at `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`
  - W5 changes need redeployment with `anchor deploy`
- **Anchor CLI environment:** Local environment requires Solana CLI setup with funded keypair
  - `solana airdrop 2` on devnet needed before deploy

---

## Metrics

| Metric | Value |
|---|---|
| New instructions | 1 (cancel) |
| New error codes | 2 (FullyVested, MilestoneNotMet) |
| New account types | 1 (ProofCache PDA) |
| New fields in StreamAccount | 1 (required_tier: u8) |
| StreamAccount size | 156 bytes + 8 discriminator = 164 total |
| ProofCache size | 76 bytes + 8 discriminator = 84 total |
| Week 5 tests written | 10 |
| Total tests in suite | 30+ |
| Week 4 regressions | 0 |
| Architecture docs | 2 (AUDIT + TDP_FIRST) |

---

## Key Design Decisions

### Oracle-Agnostic Milestone Gate
Instead of hardcoding game logic into the vesting contract, `required_tier` accepts 0/1/2:
- `0` — no game required (startup vesting, investor lock, DAO airdrop)
- `1` — must reach activity Tier 1 via oracle (game, DAO vote, admin key)
- `2` — must reach activity Tier 2

This makes TDP composable — the game is one possible oracle, not a required dependency.

### UncheckedAccount for proof_cache
When `required_tier = 0`, the ProofCache PDA may not exist. Using `Account<'info, ProofCache>` with seeds would fail on account validation. Solution: `UncheckedAccount<'info>` with manual deserialization gated by `required_tier > 0` check. Pass `SystemProgram.programId` as dummy when no gate needed.

### u128 Overflow Safety
`unlocked_amount()` casts `amount_total` and time delta to `u128` before multiplication:
```rust
let unlocked = (self.amount_total as u128)
    .checked_mul(elapsed as u128)
    .ok_or(VestingError::Overflow)?
    .checked_div(duration as u128)
    .ok_or(VestingError::Overflow)?;
```
Safe for any token supply up to `u64::MAX`.

---

## Week 6 Plan

- `/dashboard` frontend route — TDP stream management UI
- Wallet connection (Phantom, Solflare)
- `create_stream` form with all parameters
- Real-time vesting progress bar (reads on-chain via Anchor client)
- Game CPI integration: `level_complete` → `update_proof`

---

## Links

- **Repo:** https://github.com/nayrbryanGaming/blockblast
- **Live app:** https://blockbite.vercel.app
- **Program:** `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`
- **Solana Explorer (devnet):** https://explorer.solana.com/address/DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf?cluster=devnet
