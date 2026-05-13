# BlockBite — Token Distribution Protocol on Solana

**Live:** https://blockbite.vercel.app | **Waitlist:** https://blockbite.vercel.app/waitlist  
**GitHub:** https://github.com/nayrbryanGaming/blockblast  
**Program ID (devnet):** `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`  
**Deploy tx (W4):** `3q6KHeMvnSH1bA8mM1f1idz9BvPXHnheSSGub3PTREJCk6DBKbbfD4wkPUS1VMhf9twp3cCckn4vXrmnZdHGqXiM`  
**IDL account:** `FgsBt6FeKaeax98XKSDD1psL24fMpDReAedzv2WAcorC`  
**Upgrade authority:** `35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr`

---

## Progress

| Week | Deliverable | Status | Score |
|------|-------------|--------|-------|
| W1 | Technical Research | ✅ Complete | 43 / 50 |
| W2 | System Design | ✅ Complete | 48 / 50 |
| W3 | Project Setup | ✅ Complete | 20 / 50 |
| **W4** | **Core Smart Contract + Waitlist** | **🔄 In Progress — due 2026-05-16** | — |

---

## Week 4 — Smart Contract

### Program: `programs/blockbite-vesting/src/lib.rs`

Linear token vesting with optional cliff, PDA-controlled vault, deployed to Solana devnet.
VGPV (Velocity-Gated Proof Validation) fields are embedded — full enforcement ships in W5 via game-program CPI.

**Instructions**

| Instruction | Description |
|---|---|
| `create_stream(stream_id, amount, start_ts, cliff_ts, end_ts)` | Locks tokens into PDA vault. `cliff_ts = 0` means no cliff. |
| `withdraw()` | Beneficiary claims linearly unlocked tokens; partial withdrawals supported |
| `cancel()` | Authority cancels; unvested remainder returned to creator |

**Vesting formula**

```
// Before cliff_ts  → 0 unlocked
// After cliff_ts   → linear from start_ts:
unlocked = total_amount × (now − start_ts) / (end_ts − start_ts)
// After end_ts     → 100% unlocked
```

**PDA derivation**

```
stream: ["stream", authority_pubkey, stream_id_le8]
vault:  ["vault",  authority_pubkey, stream_id_le8]
```

**VGPV — Velocity-Gated Proof Validation (W3 BD creative solution)**

Anti-bot constants and struct fields are embedded now at zero cost:

```rust
pub const VGPV_MIN_SECONDS_PER_ACT: i64 = 7_200; // 2 hr human minimum per Act
pub const VGPV_MAX_VELOCITY_STRIKES: u8  = 3;     // strikes before flagged

// StreamAccount fields:
pub velocity_strikes: u8,  // incremented on sub-human-speed claims
pub last_action_ts:   i64, // timestamp of last withdrawal
```

Full enforcement (auto-invalidate on 3 strikes) arrives with `update_proof` CPI in W5.

**Error codes**

| Code | Condition |
|---|---|
| `ZeroAmount` | `amount == 0` |
| `InvalidTimeRange` | `end_ts <= start_ts` |
| `InvalidCliff` | `cliff_ts` not in `[start_ts, end_ts]` |
| `NothingToWithdraw` | `unlocked − withdrawn == 0` |
| `Unauthorized` | Signer is not the stream beneficiary / authority |
| `StreamCancelled` | Stream was already cancelled |
| `Overflow` | Arithmetic overflow |
| `VelocityViolation` | Reserved for W5 VGPV enforcement |

---

### Tests: `tests/vesting.ts`

11 tests covering all W4 acceptance criteria plus cliff vesting and VGPV field verification:

| Test | Description |
|---|---|
| AC1+AC2 | `create_stream` deposits full amount; creator ATA debited; VGPV fields init |
| AC3a | 0 % unlocked before `start_ts` |
| AC3b | ~25 % unlocked at 25 % of duration |
| AC3d | ~50 % unlocked at 50 % of duration |
| AC4 | `withdraw` transfers vested tokens to beneficiary |
| AC5 | Partial withdrawal: second claim increases `amount_withdrawn` |
| AC6 | `NothingToWithdraw` when nothing new has vested |
| AC7 | `Unauthorized` when wrong user calls `withdraw` |
| AC3c | 100 % unlocked after `end_ts`; full amount withdrawable |
| Cliff | Blocked before `cliff_ts`; normal vesting after cliff passes |
| VGPV | `velocity_strikes` and `last_action_ts` fields exist on-chain |

**Run tests (uses local validator — no devnet SOL required)**

```bash
anchor test
```

> **Do NOT** use `yarn test:anchor` directly — that skips `anchor build` and will crash
> because `target/idl/blockbite_vesting.json` is generated at build time.

To run against devnet explicitly:

```bash
anchor test --provider.cluster devnet
# requires ~/.config/solana/id.json to be funded with devnet SOL
```

---

## Week 4 Marketing — Waitlist

Live: **https://blockbite.vercel.app/waitlist**

- Email signup → `POST /api/waitlist` (Vercel KV)
- Live counter → `GET /api/waitlist/count`
- Floating canvas animation, tokenomics breakdown
- Bilingual EN / ID, dark / light theme

---

## Dev Setup

### Prerequisites

- Node ≥ 18, Rust (stable), Anchor CLI 0.32.x, Solana CLI ≥ 1.18

### Frontend

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

### Smart contract

```bash
# Build the program and generate IDL
anchor build

# Run all 11 tests against local validator (no SOL needed)
anchor test

# Deploy to devnet (requires funded keypair)
anchor deploy --provider.cluster devnet
```

### Environment variables (Vercel)

```
KV_URL
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
NEXT_PUBLIC_APP_URL=https://blockbite.vercel.app
ADMIN_SECRET=<strong-random-secret>
```

---

## Repository Structure

```
blockbite/
├── app/                         # Next.js 14 App Router
│   ├── waitlist/page.tsx        # Waitlist landing (W4 marketing)
│   ├── map/page.tsx             # 8-act level map
│   ├── game/page.tsx            # Match-3 gameplay
│   ├── shop/page.tsx            # Ticket shop
│   ├── profile/page.tsx         # Player stats
│   ├── leaderboard/page.tsx
│   └── api/
│       ├── waitlist/            # POST signup · GET count
│       ├── session/             # Game session HMAC-signed start / submit
│       ├── score/sign/          # Server-side Ed25519 score signing
│       ├── profile/             # User profile KV CRUD
│       └── state/               # SSE live state stream
├── components/
│   ├── Navbar.tsx
│   └── game/GameCanvas.tsx      # 8×8 match-3 engine
├── lib/
│   ├── game/constants.ts        # POINTS_PER_BLOCK, MAX_GAME_LEVEL, etc.
│   ├── store.ts                 # Vercel KV helpers
│   └── useApp.tsx               # Lang / theme context
├── programs/
│   └── blockbite-vesting/
│       └── src/lib.rs           # Anchor vesting program (W4)
├── tests/
│   └── vesting.ts               # 11 Anchor unit tests
└── styles/
    └── globals.css              # Design tokens (--ds-* CSS vars)
```

---

## Design System

| Token | Value |
|---|---|
| Primary accent | `#a78bfa` |
| Secondary accent | `#5eead4` |
| Background (dark) | `#08081a` |
| Font | Space Grotesk · JetBrains Mono · Orbitron |
| Theme switching | `data-theme="dark"` / `data-theme="light"` on `<html>` |

---

## Game Engine — Key Parameters

| Constant | Value | Notes |
|---|---|---|
| `POINTS_PER_BLOCK` | 10 | Base score per cleared block |
| `BLOCKS_PER_LINE` | 8 | Board width |
| `LINE_MULTIPLIERS` | ×1 / ×1.5 / ×2 / ×3 | 1 / 2 / 3 / 4+ simultaneous lines |
| `PENTA_MULTIPLIER` | ×5 | 5+ simultaneous lines |
| `PERFECT_BOARD_BONUS` | 5 000 | Board fully cleared |
| `LARGE_PIECE_BONUS` | 25 | Piece with ≥ 5 blocks |
| Mystery box multiplier | up to ×10 | Random reward |
| `MAX_GAME_LEVEL` | 40 000 | Engine maximum; content cycles 1–4 000 |

---

## W5 Roadmap (next)

| Feature | Status |
|---|---|
| `update_proof` CPI instruction (game → vesting) | Planned |
| VGPV enforcement: 3-strike auto-invalidation | Planned |
| Milestone-based vesting (ProofCache tiers) | Planned |
| 24h cooldown between claims | Planned |
| Admin `invalidate_player` instruction | Planned |

---

---

## AI Tool Disclosure

Claude Code (Anthropic, `claude-sonnet-4-6`) was used as a coding assistant for W3 and W4:
code generation, debugging CI failures, and security review. All output was reviewed
and committed by Bryan Kwandou. See [`CONTRIBUTORS.md`](CONTRIBUTORS.md) for full details.

---

## Vercel KV — Status

All data routes use `@vercel/kv` with a graceful in-memory fallback when `KV_URL` is
not set (local dev). In production (`blockbite.vercel.app`) the KV env vars are
configured and the following routes persist data across cold starts:

| Route | KV key pattern |
|---|---|
| `POST /api/waitlist` | `blockbite:waitlist:{email}`, `blockbite:waitlist:count` |
| `GET /api/waitlist/count` | `blockbite:waitlist:count` |
| `POST /api/session/submit` | leaderboard via `lib/leaderboard/store.ts` |
| `GET /api/leaderboard` | `blockbite:lb` (hset per wallet) |
| `GET/POST /api/profile` | `blockbite:user:{addr}` |
| `GET/POST /api/admin` | `blockbite:global` |
| `GET /api/state` (SSE) | `blockbite:global` (snapshot on connect) |
| `POST /api/redeem` | `blockbite:redeem:{addr}:act{n}` (deduplication) |
| `GET /api/list/[kind]` | `blockbite:list:{kind}` |

`/api/session/start` is intentionally stateless — HMAC-signed tokens are
self-validating and do not require server-side session storage.

---

*Bryan Kwandou — Mancer Work Trial × Solana Superteam 2026*
