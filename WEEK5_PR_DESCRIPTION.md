# Week 5 — Bryan — Cliff + Milestone + Cancel

## Summary

This PR implements the complete Week 5 deliverable for the BLOCKBITE Token Distribution Protocol:

1. **Cliff gate** — time-based floor: zero tokens unlock before `cliff_ts`
2. **Milestone gate** — activity-based gate: `withdraw()` blocked unless `proof_cache.tier_reached >= required_tier`
3. **Cancel instruction** — creator-only atomic split: unvested → creator, vested → stays claimable
4. **10 new tests** — W5.1-W5.10 covering all edge cases
5. **Architecture docs** — TDP-first audit + pivot document with 19 ASCII flowcharts

---

## What Was Built

### Smart Contract Changes (`programs/blockbite-vesting/src/lib.rs`)

**New field in `StreamAccount`:**
```rust
pub required_tier: u8,  // 0=no gate, 1=Tier1 required, 2=Tier2 required
```
StreamAccount.LEN updated: 155 → 156 bytes.

**Cliff gate in `withdraw()`:**
```rust
if now < stream.cliff_ts {
    return err!(VestingError::NothingToWithdraw);
}
```

**Milestone gate in `withdraw()`:**
```rust
if ctx.accounts.stream.required_tier > 0 {
    let cache_data = ctx.accounts.proof_cache.try_borrow_data()?;
    let cache = ProofCache::try_deserialize(&mut &cache_data[..])?;
    require!(
        cache.tier_reached >= ctx.accounts.stream.required_tier,
        VestingError::MilestoneNotMet,
    );
}
```

**`cancel()` instruction:**
```rust
// Split calculation (u128 safe)
let unlocked = stream.unlocked_amount(now);
let claimable = unlocked.saturating_sub(stream.amount_withdrawn);
let return_amount = stream.amount_total
    .checked_sub(unlocked)
    .ok_or(VestingError::Overflow)?;

// Transfer unvested → creator ATA
token::transfer(ctx.accounts.into_return_ctx(), return_amount)?;

// Mark cancelled — blocks future withdraw
stream.cancelled = true;

// Conservation law: claimable + return + withdrawn = total (enforced)
```

**New errors:**
- `FullyVested` — cannot cancel when `unlocked_amount(now) >= amount_total`
- `MilestoneNotMet` — cannot withdraw when `tier_reached < required_tier`

### Test Updates (`tests/vesting.ts`)

All Week 4 tests updated for new `create_stream` signature (added `required_tier = 0` as 6th param, added `proofCache: SystemProgram.programId` to `withdraw()` calls).

**10 new tests:**

| Test | Acceptance Criterion |
|---|---|
| W5.1 | `withdraw()` before `cliff_ts` returns `NothingToWithdraw` |
| W5.2 | `withdraw()` after `cliff_ts` returns linear amount |
| W5.3 | `withdraw()` with `required_tier=1` + `tier_reached=0` returns `MilestoneNotMet` |
| W5.4 | `withdraw()` succeeds after `update_proof` sets tier to 1 |
| W5.5 | `cancel()` by non-creator returns `Unauthorized` |
| W5.6 | `cancel()` mid-stream splits 50/50; conservation law holds |
| W5.7 | Second `cancel()` returns `StreamCancelled` |
| W5.8 | `cancel()` on fully-vested stream returns `FullyVested` |
| W5.9 | `cancel()` before `cliff_ts` returns 100% to creator |
| W5.10 | `withdraw()` after cancel returns `StreamCancelled` |

### Architecture Documents

- `AUDIT_TDP_ARCHITECTURE.md` — 9 ASCII flowcharts, mathematical spec, competitor table, W5 gap analysis
- `TDP_FIRST_ARCHITECTURE.md` — 10 ASCII flowcharts, TDP-first pivot narrative, oracle composability design
- `programs/blockbite-vesting/README.md` — Full instruction reference
- `README.md` — Rewritten with TDP-first positioning

---

## Design Decisions

### Oracle-Agnostic Architecture
`required_tier = 0` means no oracle required — pure time-based vesting (startup team, investor lock). `required_tier = 1 or 2` enables oracle gating. The oracle can be:
- The Blockbite game (CPI on level complete)
- An admin key (DAO vote outcome)
- Any future composable oracle

The TDP contract does not care which oracle writes the ProofCache — it only reads `tier_reached`.

### UncheckedAccount for proof_cache
When `required_tier = 0`, the ProofCache PDA may not exist. Using typed `Account<'info, ProofCache>` with Anchor seeds constraints would fail account validation on non-existent PDAs. Solution: `UncheckedAccount<'info>` with `/// CHECK: manually deserialized only when required_tier > 0`. Pass `SystemProgram.programId` as dummy when gate is disabled.

### Cancel Before Cliff
Before `cliff_ts`, `unlocked_amount(now)` returns 0 (cliff gate in the formula). This means:
- `claimable = 0`
- `return_amount = amount_total - amount_withdrawn`
So 100% returns to creator. No special case needed — the math handles it.

---

## Devnet Deployment

Program ID: `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`

W4 deploy tx: `3q6KHeMvnSH1bA8mM1f1idz9BvPXHnheSSGub3PTREJCk6DBKbbfD4wkPUS1VMhf9twp3cCckn4vXrmnZdHGqXiM`

W5 redeploy: pending (requires funded devnet keypair, `anchor deploy --provider.cluster devnet`)

Explorer: https://explorer.solana.com/address/DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf?cluster=devnet

---

## Week 4 Regression

All 20 Week 4 tests pass without modification to their logic — only signature updates for new parameters. No regressions.

---

## Files Changed

```
programs/blockbite-vesting/src/lib.rs     # cancel(), MilestoneNotMet, FullyVested, required_tier
programs/blockbite-vesting/README.md      # NEW — full instruction reference
tests/vesting.ts                          # W5.1-W5.10 + W4 regression update
AUDIT_TDP_ARCHITECTURE.md                 # NEW — architecture audit
TDP_FIRST_ARCHITECTURE.md                 # NEW — TDP pivot document
README.md                                 # TDP-first rewrite
WEEK5_REPORT.md                           # NEW — Mancer work report
WEEK5_PR_DESCRIPTION.md                   # NEW — this file
MEGA_TODO.md                              # NEW — sprint task registry
PITCH.md                                  # NEW — BD one-pager
DEPLOYMENT_GUIDE.md                       # NEW — devnet deployment steps
docs/INSTRUCTION_REFERENCE.md            # NEW — full instruction docs
```
