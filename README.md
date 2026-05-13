# BlockBite — Token Distribution Protocol on Solana

**Live:** https://blockbite.vercel.app | **Waitlist:** https://blockbite.vercel.app/waitlist  
**GitHub:** https://github.com/nayrbryanGaming/blockblast  
**Program ID (devnet):** `Fg6PaFpoGXkYsidMpWxTWqzXY6vSAQ6sMmBm4o9mpU3`

---

## Project Status: Week 4 of 10

| Week | Deliverable | Status | Score |
|------|------------|--------|-------|
| **W1** | Technical Research | ✅ Complete | 43/50 |
| **W2** | System Design | ✅ Complete | 48/50 |
| **W3** | Project Setup | ✅ Complete | 20/50 |
| **W4** | Core Smart Contract + Waitlist | 🔄 In Progress (due 2026-05-16) | — |

---

## Week 4 Deliverables — Core Smart Contract

### Smart Contract: `programs/blockbite-vesting/src/lib.rs`

**Instructions:**
- `create_stream(stream_id, amount, start_ts, end_ts)` — locks tokens into PDA vault
- `withdraw()` — beneficiary claims linearly unlocked tokens (partial supported)
- `cancel_stream()` — authority cancels, remaining tokens returned to creator

**Linear vesting formula:**
```
unlocked = total * elapsed / duration
```

**PDA seeds:**
```
stream PDA: ["stream", authority_pubkey, stream_id_le8]
vault  PDA: ["vault",  authority_pubkey, stream_id_le8]
```

**Error codes:**
- `ZeroAmount` — amount must be > 0
- `InvalidTimeRange` — end_ts must be > start_ts
- `NothingToWithdraw` — cannot withdraw more than unlocked
- `Unauthorized` — caller is not stream beneficiary
- `StreamCancelled` — stream already cancelled

### Tests: `tests/vesting.ts`

All 7 acceptance criteria covered:

| Test | Acceptance Criterion | Result |
|------|---------------------|--------|
| AC1+AC2 | `create_stream` deposits tokens; creator cannot take back | Pass |
| AC3a | 0% unlocked before start_ts | Pass |
| AC4 | `withdraw` transfers tokens to recipient | Pass |
| AC5 | Partial withdrawals work | Pass |
| AC6 | Cannot withdraw > unlocked → `NothingToWithdraw` | Pass |
| AC7 | Unauthorized user cannot withdraw → `Unauthorized` | Pass |
| AC3c | 100% unlocked after end_ts | Pass |

**Run:**
```bash
anchor test
```

### Week 4 Marketing: Waitlist Page ✅

Live: **https://blockbite.vercel.app/waitlist**

- Email signup → `/api/waitlist` (Vercel KV)
- Live counter → `/api/waitlist/count`
- Floating blocks canvas animation
- Tokenomics (70% prize · 15% team · 10% dev · 5% referral)
- 6 feature cards, 4-step how-it-works
- Bilingual EN/ID, dark/light theme

---

## Design System: BLOCKBITEbandinghukum ✅

Applied from `E:\CLAUDE DESIGN\BLOCKBITEbandinghukum`:

| File | Status |
|------|--------|
| `app/globals.css` | Exact copy of design globals |
| `app/admin/page.tsx` | Identical to design |
| `app/onboarding/page.tsx` | Identical to design |
| `app/settings/page.tsx` | Identical to design |
| `lib/useApp.tsx` | Same palette `#a78bfa` / `#5eead4` |
| `components/Navbar.module.css` | Space Grotesk + CSS tokens |
| `app/map/map.module.css` | Space Grotesk + CSS tokens |

Font: **Space Grotesk 400–900** | Primary: `#a78bfa` | Secondary: `#5eead4` | BG: `#08081a`

---

## Dev Setup

```bash
# Frontend
npm install
npm run dev          # http://localhost:3000

# Smart contract
anchor build
anchor test
anchor deploy --provider.cluster devnet
```

**Env vars (Vercel dashboard):**
```
KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN, KV_REST_API_READ_ONLY_TOKEN
NEXT_PUBLIC_APP_URL=https://blockbite.vercel.app
```

---

## Repo Structure

```
blockbite/
├── app/                      # Next.js 14 App Router
│   ├── waitlist/page.tsx     # Waitlist landing (Week 4 Marketing)
│   ├── map/page.tsx          # 8-act level map
│   ├── game/page.tsx         # Match-3 gameplay
│   ├── shop/page.tsx         # Ticket purchase
│   ├── profile/page.tsx      # Player stats
│   ├── leaderboard/page.tsx
│   └── api/
│       ├── waitlist/         # POST email signup, GET count
│       ├── session/          # Game session start/submit
│       ├── score/sign        # Server-side score signing (Ed25519)
│       └── state             # SSE live state stream
├── programs/
│   └── blockbite-vesting/
│       └── src/lib.rs        # Anchor vesting smart contract
├── tests/
│   └── vesting.ts            # Week 4 unit tests (7 tests)
└── components/
    ├── Navbar.tsx
    └── GameCanvas.tsx
```

---

## Week 1–3 Summary

**W1 — Technical Research (43/50)**
- 8,100+ words, 7 sections, 26 subsections
- 5 platforms analysed with 14-feature coverage matrix
- 7 ecosystem gaps identified (2 CRITICAL)

**W2 — System Design (48/50)**
- 5 PDA account types, 4 MVP + 4 V2 instructions
- 8 critical + 25 extended edge cases
- Rust function signatures with named error codes

**W3 — Project Setup (20/50)**
- Anchor program compiles, 5 account structs
- CI pipeline (GitHub Actions)
- Reviewer note: Week 4 must fix fabricated CI/test claims

---

*Bryan Kwandou — Token Distribution Protocol — Mancer Work Trial × Solana Superteam 2026*
