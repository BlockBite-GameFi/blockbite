<div align="center">

# BlockBite — Token Distribution Protocol (Solana)

**Anchor smart contract + frontend for milestone-based token distribution & GameFi prize pool.**

[![Live App](https://img.shields.io/badge/%F0%9F%94%97_Live-blockbite.vercel.app-00FF88?style=for-the-badge&labelColor=0A0A1A)](https://blockbite.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-blockblast-00F5FF?style=for-the-badge&logo=github&labelColor=0A0A1A)](https://github.com/nayrbryanGaming/blockblast)
[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet_Ready-9945FF?style=for-the-badge&labelColor=0A0A1A)](https://explorer.solana.com/?cluster=devnet)
[![CI](https://img.shields.io/github/actions/workflow/status/nayrbryanGaming/blockblast/ci.yml?style=for-the-badge&label=CI&labelColor=0A0A1A)](https://github.com/nayrbryanGaming/blockblast/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-FF00FF?style=for-the-badge&labelColor=0A0A1A)](LICENSE)

</div>

---

## ⚡ 15-Minute Setup (Reviewer First)

```bash
# 1. Clone
git clone https://github.com/nayrbryanGaming/blockblast.git
cd blockblast

# 2. Install frontend dependencies
npm install

# 3. Setup Solana CLI
solana config set --url devnet
solana-keygen new
solana airdrop 2

# 4. Build Anchor program
cd programs/blockbite-vesting
anchor build

# 5. Deploy to devnet
anchor deploy

# 6. Run tests
anchor test

# 7. Run frontend
cd ../../
cp .env.local.example .env.local
npm run dev
```

**Expected result:**

- ✅ Program compiles cleanly
- ✅ Deploys to devnet
- ✅ Tests pass
- ✅ App runs at http://localhost:3000

⏱️ Estimated setup time: **10–15 minutes**

---

## ✅ Week 3 Compliance Checklist

| Requirement | Status |
| --- | --- |
| Anchor project initialized & compiling | ✔ |
| Instruction handlers implemented (MVP skeleton) | ✔ |
| Account structs defined (PDA-based) | ✔ |
| README includes full setup guide | ✔ |
| At least 1 passing test (`anchor test`) | ✔ |
| CI pipeline configured (GitHub Actions) | ✔ |
| Dev partner successfully ran the project | ✔ |

### Instruction Mapping

| Brief Requirement | Implemented As | Note |
| --- | --- | --- |
| `create_stream` | `initialize_pool` | Creates prize pool PDA + sets config |
| `withdraw` | `claim_prize` | Player withdraws earned USDC |
| `cancel` | `rotate_cycle` | Admin closes cycle + resets pool |

> Naming adapted to GameFi context — same logical behavior as the brief spec.

---

## 🤝 Dev Partner Verification

Confirmed by: **Raisha Al Fadhila Putri**

| Step | Result |
| --- | --- |
| Repo cloned | ✅ |
| `anchor build` | ✅ |
| `anchor deploy` | ✅ |
| `anchor test` | ✅ |
| Frontend runs locally | ✅ |

⏱️ Setup time: ~13 minutes

---

## 🧪 Testing

```bash
anchor test
```

Test coverage:

- Program deploy success
- Account initialization (PoolState, PlayerState)
- Basic instruction execution (`initialize_pool`, `claim_prize`)
- PDA derivation correctness

---

## ⚙️ CI / DevOps

GitHub Actions pipeline (`.github/workflows/ci.yml`):

- Build Anchor program on every push
- Run `anchor test` automatically
- Frontend type-check (`tsc --noEmit`)
- Auto-deploy to Vercel on merge to `main`

**Status: ✅ Passing**

---

## 🧱 Program Structure

### Account Structs (PDA-based)

| Account | Seeds | Stores |
| --- | --- | --- |
| `PoolState` | `["pool", pool_id]` | total_pool, ticket_price, cycle_end, top10 |
| `PlayerState` | `["player", pool_id, wallet]` | tickets_bought, best_score, claimed |
| `TeamVault` | `["team_vault"]` | team share (15%) |
| `DevVault` | `["dev_vault"]` | dev share (10%) |
| `ReferralState` | `["referral", wallet]` | referral_count, earned |

### Instructions

| Instruction | Accounts | Description |
| --- | --- | --- |
| `initialize_pool` | admin, pool_state, usdc_mint | Create prize pool cycle |
| `buy_ticket` | player, pool_state, player_state, usdc_from, usdc_pool | Purchase ticket, split USDC atomically |
| `submit_score` | player, player_state, pool_state | Record score with anti-cheat hash |
| `claim_prize` | player, player_state, pool_state, usdc_to | Withdraw earnings after cycle ends |
| `rotate_cycle` | admin, pool_state | Start new monthly cycle |

### Error Codes

| Code | Name | Meaning |
| --- | --- | --- |
| 6000 | `CycleNotEnded` | Pool cycle still active |
| 6001 | `AlreadyClaimed` | Player already claimed this cycle |
| 6002 | `InvalidScore` | Anti-cheat hash mismatch |
| 6003 | `PoolFull` | Max participants reached |
| 6004 | `InvalidTicketAmount` | Wrong USDC amount sent |

---

## ❗ Common Issues & Fixes

**1. `anchor` command not found**
```bash
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

**2. Insufficient SOL balance**
```bash
solana airdrop 2
```

**3. RPC / network error**
```bash
solana config set --url devnet
```

**4. USDC mint not found on devnet**
```
Devnet USDC: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
Set in .env.local → NEXT_PUBLIC_USDC_MINT
```

---

## 📦 Repository Structure

```
blockblast/
├── programs/
│   └── blockbite-vesting/
│       └── src/
│           ├── lib.rs              # Entry point + instruction handlers
│           ├── errors.rs           # Custom error codes
│           ├── events.rs           # On-chain events
│           └── state/             # Account structs (PDA)
├── app/                           # Next.js App Router pages
├── components/                    # Shared React components
├── lib/
│   ├── game/                      # Game engine (canvas, sounds, renderer)
│   └── solana/                    # Anchor client + USDC helpers
├── .github/workflows/ci.yml       # CI pipeline
├── Anchor.toml
└── .env.local.example
```

---

## 🌐 Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_VESTING_PROGRAM_ID` | Yes | Deployed Anchor program ID |
| `NEXT_PUBLIC_USDC_MINT` | Yes | USDC mint (`4zMMC9...` devnet) |
| `NEXT_PUBLIC_SOLANA_RPC` | Yes | Solana RPC endpoint |
| `NEXT_PUBLIC_POOL_ID` | Yes | Active prize pool PDA seed |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |

---

---

# — PRODUCT CONTEXT —

---

## 🎮 What is BlockBite?

BlockBite is a **skill-based GameFi platform** on Solana where players compete in a deterministic 8×8 block-puzzle arcade and earn real USDC prizes — all settled on-chain.

- **Zero RNG in gameplay** — pure skill determines the leaderboard
- **Stablecoins only** — USDC in, USDC out, no volatile token speculation
- **Monthly prize cycle** — pool accumulates, then distributes transparently

> *"Skill is the only alpha."*

---

## 🧠 Architecture

```
LAYER 1 — Frontend (Next.js 14 App Router)
    UI, wallet connection, game canvas, leaderboard, shop

LAYER 2 — Solana Programs (Anchor / Rust)
    blockbite_vesting : pool, ticket, USDC split, prize claim
    blockbite_game    : score submission + anti-cheat hash

LAYER 3 — Off-chain Services
    Vercel Edge Functions : score relay, leaderboard
    Supabase (PostgreSQL) : raw score storage
    Helius RPC            : reliable Solana RPC
```

---

## 💰 Tokenomics

```
Every USDC ticket:
  70% → Prize Pool   (top-10 monthly winners)
  15% → Team
  10% → Dev
   5% → Referrer
```

---

## 🗺️ Level System

4,000 deterministic levels across 8 Acts — same board seed for every player.

| Act | Name | Levels | Block Skin |
| --- | --- | --- | --- |
| I | Awakening | 1–500 | Square |
| II | Frostfall | 501–1000 | Round |
| III | Inferno | 1001–1500 | Diamond |
| IV | Stormlands | 1501–2000 | Square |
| V | Verdant | 2001–2500 | Round |
| VI | Nightfall | 2501–3000 | Diamond |
| VII | Crystalline | 3001–3500 | Round |
| VIII | Voidbreak | 3501–4000 | Diamond |

---

## 🚀 Roadmap

| Phase | Status | Description |
| --- | --- | --- |
| P0 — Frontend | Done | Game engine, map, lobby, leaderboard |
| P1 — Vesting Program | In progress | Anchor: pool, ticket, claim |
| P2 — Game Program | Planned | Score + anti-cheat |
| P3 — Integration | Planned | Wire shop + pool to chain |
| P4 — Devnet Launch | Planned | Full test + Colosseum submission |
| P5 — Mainnet | Planned | Production launch |

---

## 👥 Team

| Role | Handle |
| --- | --- |
| Founder / Lead Dev | @nayrbryanGaming |
| Smart Contract | @Raisha |

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

**Built on Solana · Skill is the only alpha**

[blockbite.vercel.app](https://blockbite.vercel.app) · [GitHub](https://github.com/nayrbryanGaming/blockblast)

</div>
