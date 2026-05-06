<div align="center">

# BlockBite Web3

**Skill-based GameFi on Solana — 4,000 deterministic puzzle levels, transparent USDC prize pool, real rewards.**

[![Live App](https://img.shields.io/badge/%F0%9F%94%97_Live-blockbite.vercel.app-00FF88?style=for-the-badge&labelColor=0A0A1A)](https://blockbite.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-blockblast-00F5FF?style=for-the-badge&logo=github&labelColor=0A0A1A)](https://github.com/nayrbryanGaming/blockblast)
[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet_Ready-9945FF?style=for-the-badge&labelColor=0A0A1A)](https://explorer.solana.com/?cluster=devnet)
[![License: MIT](https://img.shields.io/badge/License-MIT-FF00FF?style=for-the-badge&labelColor=0A0A1A)](LICENSE)

*"Skill is the only alpha."*

</div>

---

## What is BlockBite?

**BlockBite** is a GameFi platform where players buy entry tickets (USDC), compete in a classic 8x8 block-puzzle arcade, and win real USDC prizes — all verified on-chain on Solana.

Unlike speculative GameFi projects, BlockBite uses **stablecoins only**, has **zero RNG in gameplay** (pure skill), and runs on a **monthly prize cycle** — giving the pool time to grow meaningfully before each distribution.

- **BLOCK** — the core game mechanic (placing puzzle blocks on an 8x8 grid)
- **BITE** — 8-bit pixel art aesthetic + biting into the prize pool (earning rewards)

> One-liner: *"Skill-based Web3 arcade on Solana — earn USDC by playing better, not gambling."*

---

## Links

| Resource | URL |
| --- | --- |
| Live App | https://blockbite.vercel.app/ |
| Tutorial/Sandbox | https://blockbite.vercel.app/tutorial |
| How to Play | https://blockbite.vercel.app/how-to-play |
| GitHub | https://github.com/nayrbryanGaming/blockblast |
| Solana Explorer (Devnet) | https://explorer.solana.com/?cluster=devnet |

---

## Architecture

```
LAYER 1 — Frontend (Next.js 14 App Router)
    Handles: UI, wallet connection, game canvas, leaderboard, shop
    Cannot write to chain directly — calls Layer 2 only

LAYER 2 — Solana Programs (Anchor / Rust)
    blockbite_vesting  : pool creation, ticket purchase, USDC split, prize claim
    blockbite_game     : score submission + anti-cheat hash verification

LAYER 3 — Off-chain Services
    Vercel Edge Functions : score relay, leaderboard aggregation
    PostgreSQL (Supabase) : raw score storage, session tracking
    Helius RPC            : reliable Solana RPC with webhook support
```

### PDA Accounts

| Account | Seeds | Stores |
| --- | --- | --- |
| `PoolState` | `[b"pool", pool_id]` | total_pool, ticket_price, cycle_end, top10 |
| `PlayerState` | `[b"player", pool_id, wallet]` | tickets_bought, best_score, claimed |
| `TeamVault` | `[b"team_vault"]` | team share (15%) |
| `DevVault` | `[b"dev_vault"]` | dev share (10%) |
| `ReferralState` | `[b"referral", referrer]` | referral_count, earned |

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14, TypeScript, CSS Modules |
| Game Engine | HTML5 Canvas, 60fps, useReducer |
| Blockchain | Solana, Anchor 0.30, Rust 1.78 |
| Token | USDC (SPL Token) |
| Wallet | @solana/wallet-adapter (Phantom, Backpack, Solflare) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (auto-deploy from main branch) |
| Audio | Web Audio API + SpeechSynthesis (no audio files) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Rust + Anchor CLI 0.30
- Solana CLI 1.18+
- Phantom or Backpack wallet (browser extension)

### 1. Clone

```bash
git clone https://github.com/nayrbryanGaming/blockblast.git
cd blockblast
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000

### 5. Build Anchor program

```bash
cd programs/blockbite_vesting
anchor build
```

### 6. Deploy to devnet

```bash
solana config set --url devnet
anchor deploy --provider.cluster devnet
```

### 7. Set program ID

Copy the deployed program ID into `.env.local`:

```
NEXT_PUBLIC_VESTING_PROGRAM_ID=<your_program_id>
```

### 8. Fund your devnet wallet

```bash
solana airdrop 2
```

---

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_VESTING_PROGRAM_ID` | Yes | Deployed Anchor program ID |
| `NEXT_PUBLIC_USDC_MINT` | Yes | USDC mint address (devnet or mainnet) |
| `NEXT_PUBLIC_SOLANA_RPC` | Yes | Solana RPC endpoint |
| `NEXT_PUBLIC_POOL_ID` | Yes | Active prize pool PDA seed |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `FEE_WALLET_SECRET` | Server only | Fee wallet keypair (JSON array) |

**USDC Mints:**
- Devnet: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- Mainnet: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

---

## Tokenomics

```
Every USDC ticket purchase is split atomically on-chain:

  100% Ticket Price
  ├── 70% → Prize Pool PDA    (distributed to winners monthly)
  ├── 15% → Team Vault        (operations, marketing)
  ├── 10% → Dev Vault         (protocol development)
  └──  5% → Referrer Wallet   (if referral code used, else burned)
```

| Recipient | Share | Purpose |
| --- | --- | --- |
| Prize Pool | 70% | Top-10 monthly winners (85%) + all players (15%) |
| Team | 15% | Operations and growth |
| Dev | 10% | Smart contract and infrastructure |
| Referral | 5% | Referrer reward (direct wallet transfer) |

### Prize Distribution (monthly)

- **Rank 1**: 25% of prize pool
- **Rank 2**: 15%
- **Rank 3**: 10%
- **Ranks 4-10**: 5% each (35% total)
- **All other players**: 15% split proportionally by score

---

## Ticket Packages

| Package | USDC | Plays | Best Value |
| --- | --- | --- | --- |
| Starter | $1.00 | 1 | — |
| Explorer | $4.00 | 5 | 20% off |
| Champion | $8.00 | 12 | 33% off |
| Legend | $15.00 | 25 | 40% off |

---

## Level System

**4,000 levels across 8 Acts** — same board seed for every player (deterministic). Your skill, not RNG, decides your score.

| Act | Name | Levels | Theme | Block Skin |
| --- | --- | --- | --- | --- |
| I | Awakening | 1–500 | Tutorial | Square |
| II | Frostfall | 501–1000 | Ice mechanics | Round |
| III | Inferno | 1001–1500 | Chain combos | Diamond |
| IV | Stormlands | 1501–2000 | Gravity & time | Square |
| V | Verdant | 2001–2500 | Nature chaos | Round |
| VI | Nightfall | 2501–3000 | Fog & darkness | Diamond |
| VII | Crystalline | 3001–3500 | Prisms & portals | Round |
| VIII | Voidbreak | 3501–4000 | Final gauntlet | Diamond |

Boss levels every 100 (levels 100, 200, 300 … 4000) — harder boards, double score multiplier.

---

## Smart Contract Instructions

| Instruction | Accounts | Description |
| --- | --- | --- |
| `initialize_pool` | admin, pool_state, usdc_mint | Create a new prize pool cycle |
| `buy_ticket` | player, pool_state, player_state, usdc_from, usdc_pool | Purchase ticket, split USDC |
| `submit_score` | player, player_state, pool_state | Record score with anti-cheat hash |
| `claim_prize` | player, player_state, pool_state, usdc_to | Claim winnings after cycle ends |
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

## Repository Structure

```
blockblast/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing / lobby
│   ├── game/                   # Game canvas page
│   ├── map/                    # Level select map
│   ├── leaderboard/            # Live leaderboard
│   ├── shop/                   # Ticket shop
│   ├── how-to-play/            # Tutorial guide
│   └── api/                    # Edge API routes
├── components/                 # Shared React components
│   ├── Navbar.tsx
│   ├── WinnersTicker.tsx
│   ├── PrizePoolCounter.tsx
│   └── Countdown.tsx
├── lib/
│   ├── game/                   # Game engine
│   │   ├── engine.ts           # Core game logic (useReducer)
│   │   ├── renderer.ts         # Canvas renderer + weather particles
│   │   ├── sounds.ts           # Web Audio + SpeechSynthesis
│   │   └── levels.ts           # Level seed generator
│   └── solana/                 # Blockchain helpers
│       ├── program.ts          # Anchor program client
│       ├── usdc.ts             # SPL Token helpers
│       └── pool.ts             # Prize pool queries
├── programs/                   # Anchor Rust programs
│   └── blockbite_vesting/
│       └── src/lib.rs
├── scripts/                    # Admin / deploy scripts
├── public/                     # Static assets
└── docs/                       # Protocol documentation
```

---

## Security

- [ ] All USDC flows through PDAs — no admin can drain player funds
- [ ] Score hashes verified on-chain (anti-cheat)
- [ ] Ticket purchase is atomic — partial fills revert
- [ ] Fee wallet key rotated before mainnet
- [ ] No admin upgrade authority after mainnet deploy (immutable)
- [ ] Audit by OtterSec or Sec3 before mainnet

---

## Roadmap

| Phase | Status | Description |
| --- | --- | --- |
| P0 — Frontend | Done | Game engine, leaderboard, lobby, map |
| P1 — Vesting Program | In progress | Anchor: pool, ticket, claim |
| P2 — Game Program | Planned | Score submission + anti-cheat |
| P3 — Frontend Integration | Planned | Wire shop, pool, leaderboard to chain |
| P4 — Devnet Launch | Planned | Full devnet testing + Colosseum submission |
| P5 — Admin Panel | Planned | Pool creator dashboard |
| P6 — Docs | Planned | TRANSACTIONS.md, DEPLOYMENT_CHECKLIST.md |
| P7 — Security Audit | Planned | Pre-mainnet OtterSec audit |
| P8 — Mainnet | Planned | Production launch + marketing |

---

## Transaction Examples

```
Ticket purchase (1 USDC):
  Player → Pool PDA:   0.70 USDC
  Player → Team:       0.15 USDC
  Player → Dev:        0.10 USDC
  Player → Referrer:   0.05 USDC

Prize claim (Rank 1, pool = 1000 USDC):
  Pool PDA → Player:   250 USDC (25% of 70% share)
```

---

## Team

| Role | Handle |
| --- | --- |
| Founder / Lead Dev | @nayrbryanGaming |
| Smart Contract | @Raisha |

---

## Acknowledgements

- [Anchor Framework](https://www.anchor-lang.com/) — Solana smart contract development
- [Solana Labs](https://solana.com/) — L1 blockchain infrastructure
- [Colosseum Hackathon](https://colosseum.org/) — Hackathon platform and community
- [Helius](https://helius.dev/) — Solana RPC and webhooks
- [Supabase](https://supabase.com/) — Backend database

---

<div align="center">

**Built with passion on Solana — skill is the only alpha.**

[blockbite.vercel.app](https://blockbite.vercel.app) · [GitHub](https://github.com/nayrbryanGaming/blockblast)

</div>
