# BLOCKBITE — Token Distribution Protocol on Solana

> Sablier on Solana with built-in Proof-of-Activity oracle.
> Composable TDP: Cliff + Milestone + Linear token streaming, oracle-agnostic.

**Live:** https://blockbite.vercel.app | **Waitlist:** https://blockbite.vercel.app/waitlist
**GitHub:** https://github.com/nayrbryanGaming/blockblast
**Program ID (devnet):** `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`

---

## What Is This?

BLOCKBITE is a **Token Distribution Protocol (TDP)** — a programmable vesting and streaming contract for SPL tokens on Solana. Any project can use it to distribute tokens to employees, investors, DAO members, or community players under custom unlock conditions.

The attached puzzle game (Blockbite) serves as the **proof-of-activity oracle**: completing game levels advances your `ProofCache.tier_reached`, which gates milestone-based streams. Startup vesting that doesn't need a game oracle simply sets `required_tier = 0`.

**TDP is the product. The game is one oracle plugin.**

---

## Mancer Work Progress

| Week | Deliverable | Status | Score |
|---|---|---|---|
| W1 | Technical Research | [x] Complete | 43 / 50 |
| W2 | System Design | [x] Complete | 48 / 50 |
| W3 | Project Setup | [x] Complete | 20 / 50 |
| W4 | Core TDP — create/withdraw/fund_vault/update_proof/VGPV | [x] Complete | — |
| **W5** | **Cliff + Milestone + Cancel — 10 new tests** | **[x] Submitted** | — |

---

## TDP — Core Protocol

### 3-Tier Unlock Model

```
Token lifecycle:
  creator → vault (locked)
                ↓
    [Tier 1] cliff_ts passed?          NO → 0 unlocked
                ↓ YES
    [Tier 2] tier_reached >= required_tier?  NO → MilestoneNotMet
                ↓ YES
    [Tier 3] linear streaming          → unlock(t) per second
                ↓
  beneficiary ← vault (claimed)
```

### Unlock Formula

```
unlock(t) = amount_total * (t - start_ts) / (end_ts - start_ts)

  t < cliff_ts  → 0 (cliff gate)
  t >= end_ts   → amount_total (fully vested)

Rate R = amount_total / (end_ts - start_ts)  tokens per second
```

Implemented in `unlocked_amount()` with `u128` intermediate arithmetic (overflow-safe for any token supply).

### Cancel Invariant

```
claimable + return_to_creator + amount_withdrawn = amount_total
```

Before `cliff_ts`: 100% of unvested tokens return to creator.
After partial vest: linearly proportional split.
Cannot cancel a fully-vested stream (`FullyVested` error).

---

## Instructions

| Instruction | Signer | Description |
|---|---|---|
| `create_stream` | creator | Lock tokens; set cliff, end, milestone tier |
| `withdraw` | beneficiary | Claim linearly unlocked tokens (respects cliff + milestone) |
| `cancel` | creator | Atomically split vested/unvested; close stream |
| `fund_vault` | anyone | Deposit revenue with 70/15/10/5 split |
| `update_proof` | admin | Write player activity tier to ProofCache PDA |

Full parameter reference: [`programs/blockbite-vesting/README.md`](programs/blockbite-vesting/README.md)

---

## Error Codes

| Error | Condition |
|---|---|
| `ZeroAmount` | amount == 0 |
| `InvalidTimeRange` | end_ts <= start_ts |
| `InvalidCliff` | cliff_ts outside [start_ts, end_ts] |
| `InvalidTier` | required_tier > 2 |
| `NothingToWithdraw` | nothing unlocked yet |
| `Unauthorized` | wrong signer |
| `StreamCancelled` | stream already cancelled |
| `FullyVested` | cannot cancel fully-vested stream |
| `MilestoneNotMet` | tier_reached < required_tier |
| `Overflow` | arithmetic overflow |
| `VelocityViolation` | VGPV 3-strike bot detection |

---

## Test Coverage (Week 5)

30+ tests across two describe blocks:

**Week 4 regression (AC1-AC7 + Cliff + VGPV + fund_vault + update_proof):**
- `create_stream` locks tokens atomically
- Linear unlock at 25%, 50%, 100% of duration
- `withdraw` partial + cumulative
- `NothingToWithdraw`, `Unauthorized`, cliff gate
- VGPV field verification, fund_vault 70/15/10/5 split
- `update_proof` admin write + non-admin rejected + tier > 2 rejected

**Week 5 new tests (W5.1-W5.10):**
- W5.1: 0 tokens before `cliff_ts`
- W5.2: linear vesting after cliff
- W5.3: `MilestoneNotMet` when tier not reached
- W5.4: withdraw succeeds after milestone met
- W5.5: cancel `Unauthorized` for non-creator
- W5.6: cancel mid-stream (50/50 split, conservation law verified)
- W5.7: `StreamCancelled` on double cancel
- W5.8: `FullyVested` error when stream fully vested
- W5.9: cancel before cliff returns 100% to creator
- W5.10: withdraw blocked after cancel

```bash
anchor test    # runs all tests on localnet
```

---

## Oracle Composability

The `required_tier` + `ProofCache` design makes TDP oracle-agnostic:

| Use Case | `required_tier` | Who writes ProofCache |
|---|---|---|
| Startup team vesting | 0 | nobody — time-only |
| DAO airdrop | 0 | nobody — snapshot at create |
| Game player reward | 1 or 2 | game CPI on level complete |
| Grant milestone | 1 | admin key on DAO vote |
| Revenue-based (future) | — | oracle integration |

---

## Repository Structure

```
blockbite/
├── programs/
│   └── blockbite-vesting/
│       ├── src/lib.rs          # TDP smart contract (Anchor 0.32.1)
│       └── README.md           # Instruction reference
├── tests/
│   └── vesting.ts              # 30+ Anchor tests (mocha + chai)
├── app/                        # Next.js 14 App Router
│   ├── game/page.tsx           # Proof-of-activity oracle (puzzle game)
│   ├── dashboard/              # TDP stream management (Week 6)
│   ├── waitlist/page.tsx       # Email capture
│   ├── leaderboard/page.tsx    # Score rankings
│   └── mascots/page.tsx        # Crew showcase
├── lib/
│   ├── game/                   # Game engine + level seeds
│   └── leaderboard/store.ts    # Vercel KV sorted-set store
├── AUDIT_TDP_ARCHITECTURE.md   # Full TDP audit with flowcharts
├── TDP_FIRST_ARCHITECTURE.md   # Pivot narrative + mathematics
├── MEGA_TODO.md                # Sprint task registry
├── Anchor.toml
└── package.json
```

---

## Competitor Comparison

| Protocol | Chain | Cliff | Milestone Gate | Linear | Oracle |
|---|---|---|---|---|---|
| **BLOCKBITE TDP** | **Solana** | **YES** | **YES (ProofCache)** | **YES** | **composable** |
| Sablier v2 | Ethereum | YES | NO | YES | NO |
| Streamflow | Solana | YES | NO | YES | NO |
| Vesting Treasurer | Solana | YES | NO | YES | NO |

---

## Dev Setup

### Prerequisites

Node >= 18, Rust stable, Anchor CLI 0.32.1, Solana CLI >= 1.18

### Frontend

```bash
npm install
npm run dev        # http://localhost:3000
```

### Smart Contract

```bash
anchor build       # compile to SBPF bytecode
anchor test        # run all tests on localnet
anchor deploy --provider.cluster devnet
```

### Environment Variables

```
KV_REST_API_URL=<vercel-kv-url>
KV_REST_API_TOKEN=<vercel-kv-token>
NEXT_PUBLIC_APP_URL=https://blockbite.vercel.app
ADMIN_SECRET=<strong-random-secret>
SESSION_SECRET=<strong-random-secret>
NEXT_PUBLIC_VESTING_PROGRAM_ID=DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf
```

---

## Architecture Documents

- [`AUDIT_TDP_ARCHITECTURE.md`](AUDIT_TDP_ARCHITECTURE.md) — External 3-tier architecture audit with 9 ASCII flowcharts
- [`TDP_FIRST_ARCHITECTURE.md`](TDP_FIRST_ARCHITECTURE.md) — TDP pivot narrative, mathematics, 10 flowcharts, competitor table
- [`programs/blockbite-vesting/README.md`](programs/blockbite-vesting/README.md) — Full instruction reference

---

## Security Notes

- Checks-Effects-Interactions (CEI) pattern in `cancel()` and `withdraw()`
- PDA ownership validated on all instructions
- `u128` intermediate arithmetic in `unlocked_amount()` (overflow-safe)
- No token loss invariant in `fund_vault()` (floor arithmetic, dust -> vault)
- VGPV bot detection: 2hr minimum between proof updates, 3-strike limit
- Upgrade authority will be burned before mainnet (currently upgradeable)

---

*Mancer Work Season 1 — Solana Superteam Developer Track*
*Bryan (@nayrbryanGaming) — Week 5 of 10*
