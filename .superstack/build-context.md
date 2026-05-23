# BlockBite TDP — Build Context

## Project

**BlockBite TDP** — Programmable token vesting & distribution platform on Solana.
- Program ID: `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`
- Stack: Anchor 0.30, Next.js 14 App Router, TypeScript, @coral-xyz/anchor
- Network: Solana Devnet (not yet mainnet)
- Stage: MVP / Week 5 of Mancer × Superteam Indonesia hackathon

## Architecture

- `programs/blockbite-vesting/src/lib.rs` — 785-line Anchor program
- `tests/vesting.ts` — 1359-line test suite (4 describe blocks)
- `app/` — 35+ Next.js routes (streams, claim, milestones, analytics, audit, protocol, partners, calculator, game, distribute)

## Instructions

| Instruction | Description | Status |
|---|---|---|
| `create_stream` | Lock tokens into PDA vault with cliff+linear schedule | ✅ Devnet |
| `configure_milestones` | Set 1-4 milestone quotas (sum=100%) | ✅ Devnet |
| `verify_milestone` | Authority manually marks milestone verified | ✅ Devnet |
| `withdraw` | Beneficiary claims vested tokens (cliff+milestone+VGPV gated) | ✅ Devnet |
| `fund_vault` | Add tokens with 70/15/10/5 revenue split | ✅ Devnet |
| `update_proof` | Write/update ProofCache via game CPI (source A) | ✅ Devnet |
| `cancel` | Creator cancels: vested→beneficiary, unvested→creator | ✅ Devnet |

## Review

```json
{
  "security_score": "B",
  "quality_score": "B",
  "ready_for_mainnet": false,
  "reviewed_at": "2026-05-22",
  "patched_at": "2026-05-23",
  "patch_commit": "0cf1d9c",
  "findings": [
    {
      "severity": "critical",
      "status": "FIXED",
      "category": "security",
      "description": "proof_cache UncheckedAccount in Withdraw had no PDA origin validation. Attacker could pass a ProofCache from their own stream to bypass the tier gate on any required_tier>0 stream.",
      "fix_applied": "Added require!(cache.schedule == stream.key()) and require!(cache.player == beneficiary.key()) inside Gate 3 in withdraw()",
      "file": "programs/blockbite-vesting/src/lib.rs"
    },
    {
      "severity": "high",
      "status": "FIXED",
      "category": "code_quality",
      "description": "Manual authority key checks instead of Anchor has_one constraints in ConfigureMilestones, VerifyMilestone, Withdraw, Cancel.",
      "fix_applied": "Replaced manual require! with has_one = authority @ VestingError::Unauthorized (or beneficiary for Withdraw) in all 4 account structs.",
      "file": "programs/blockbite-vesting/src/lib.rs"
    },
    {
      "severity": "medium",
      "status": "FIXED",
      "category": "correctness",
      "description": "cancel() never closed stream PDA or vault token account. Each cancelled stream permanently locked ~0.00497 SOL in rent.",
      "fix_applied": "Added close = authority to Cancel.stream constraint; added CloseAccount CPI after token transfers in cancel().",
      "file": "programs/blockbite-vesting/src/lib.rs"
    },
    {
      "severity": "medium",
      "status": "FIXED",
      "category": "compute",
      "description": "cancel() called unlocked_amount(now) twice — compute waste and latent TOCTOU pattern.",
      "fix_applied": "Compute vested_at_cancel once, use in both require! and arithmetic.",
      "file": "programs/blockbite-vesting/src/lib.rs"
    },
    {
      "severity": "low",
      "status": "FIXED",
      "category": "correctness",
      "description": "VGPV velocity_strikes never reset — user could be permanently locked out after 3 rapid accidental withdrawals.",
      "fix_applied": "Reset strikes to 0 when elapsed >= VGPV_MIN_SECONDS_PER_ACT * 2",
      "file": "programs/blockbite-vesting/src/lib.rs"
    },
    {
      "severity": "low",
      "status": "FIXED",
      "category": "correctness",
      "description": "fund_vault allowed topping up after stream end_ts — made added tokens immediately withdrawable.",
      "fix_applied": "Added require!(now < stream.end_ts, VestingError::StreamExpired) to fund_vault.",
      "file": "programs/blockbite-vesting/src/lib.rs"
    }
  ],
  "passes": [
    "All arithmetic uses checked_* or saturating_* — no overflow risk",
    "PDA seeds are unique and entropy-rich (authority + stream_id)",
    "Reinitialization protected via init constraints",
    "Token accounts fully validated with mint + authority constraints",
    "All 15 custom error codes cover every failure path",
    "StreamAccount.LEN is accurate (165 bytes verified)",
    "No debug msg!() logs in production code",
    "Conservation law verified: cancel drains vault completely"
  ],
  "pre_mainnet_blockers": [
    "Commission Trident fuzz testing on withdraw + cancel",
    "Professional audit (FYEO / OPCODES / OtterSec)"
  ],
  "pre_mainnet_completed": [
    "proof_cache cross-stream substitution fix (CRITICAL) — commit 0cf1d9c",
    "Rent leak in cancel() fixed — stream PDA + vault both closed (MEDIUM)"
  ],
  "artifact": ".superstack/code-review.html"
}
```

## Next Phase

When the critical finding is fixed and a professional audit is underway:
- `deploy-to-mainnet` — production deployment checklist
- `create-pitch-deck` — structured pitch for Mancer Week 5 submission
- `submit-to-hackathon` — hackathon submission builder
