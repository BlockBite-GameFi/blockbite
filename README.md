# BlockBite — Token Distribution Protocol on Solana

**Live:** https://blockbite.vercel.app | **Waitlist:** https://blockbite.vercel.app/waitlist  
**GitHub:** https://github.com/nayrbryanGaming/blockblast  
**Program ID (devnet):** `GrWHUoeu8STsXh7Dy2gyMmQsaujjTux6qU6BS7119SfH`  
**Deploy tx:** `234Wf4Zr3CofJ9339CKtLjQpaBQh4YiV2YWzmdwCcJMKgPipdxoGXGXLtCW4fjW2LkDLNcp3uJvjwF4xvGTs2UZr`

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

Linear token vesting with PDA-controlled vault, deployed to Solana devnet.

**Instructions**

| Instruction | Description |
|---|---|
| `create_stream(stream_id, amount, start_ts, end_ts)` | Locks tokens into PDA vault; initialises vesting schedule |
| `withdraw()` | Beneficiary claims linearly unlocked tokens; partial withdrawals supported |
| `cancel_stream()` | Authority cancels; unvested remainder returned to creator |

**Vesting formula**

```
unlocked = total_amount × elapsed / duration
```

where `elapsed = clamp(now − start_ts, 0, duration)`.

**PDA derivation**

```
stream: ["stream", authority_pubkey, stream_id_le8]
vault:  ["vault",  authority_pubkey, stream_id_le8]
```

**Error codes**

| Code | Condition |
|---|---|
| `ZeroAmount` | `amount == 0` |
| `InvalidTimeRange` | `end_ts <= start_ts` |
| `NothingToWithdraw` | `unlocked − withdrawn == 0` |
| `Unauthorized` | Signer is not the stream beneficiary |
| `StreamCancelled` | Stream was already cancelled |

---

### Tests: `tests/vesting.ts`

9 tests covering all acceptance criteria, including the four unlock checkpoints (0 %, 25 %, 50 %, 100 %):

| Test | Description |
|---|---|
| AC1+AC2 | `create_stream` deposits full amount; creator ATA debited |
| AC3a | 0 % unlocked before `start_ts` |
| AC3b | ~25 % unlocked at 25 % of duration |
| AC3d | ~50 % unlocked at 50 % of duration |
| AC4 | `withdraw` transfers vested tokens to beneficiary |
| AC5 | Partial withdrawal: second claim increases `amount_withdrawn` |
| AC6 | `NothingToWithdraw` error when nothing new has vested |
| AC7 | `Unauthorized` error when wrong user calls `withdraw` |
| AC3c | 100 % unlocked after `end_ts`; full amount withdrawable |

**Run tests**

```bash
anchor test
# or against a running localnet:
anchor test --skip-local-validator
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

- Node ≥ 18, Rust, Anchor CLI 0.32.x, Solana CLI ≥ 1.18

### Frontend

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

### Smart contract

```bash
anchor build
anchor test                                    # local validator
anchor deploy --provider.cluster devnet        # requires funded keypair
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
│       ├── session/             # Game session start / submit (HMAC-signed)
│       ├── score/sign/          # Server-side score signing (Ed25519)
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
│       └── src/lib.rs           # Anchor vesting program
├── tests/
│   └── vesting.ts               # 9 Anchor unit tests
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

*Bryan Kwandou — Mancer Work Trial × Solana Superteam 2026*
