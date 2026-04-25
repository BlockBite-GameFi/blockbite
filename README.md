<div align="center">

<h1>
  <img src="https://img.shields.io/badge/🎮-BLOCKBITE-00FF88?style=flat-square&labelColor=0A0A1A&color=00FF88" alt="" />
  &nbsp;BlockBite Web3
</h1>

**Bite into the prize pool. Skill-based puzzle arcade on Solana.**  
Buy tickets, climb 40,000 levels, compete monthly for real USDC — pure skill, zero luck.

[![Live App](https://img.shields.io/badge/🚀_Live_App-blockbite.vercel.app-00FF88?style=for-the-badge&labelColor=0A0A1A)](https://blockbite.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-blockblast-00F5FF?style=for-the-badge&logo=github&labelColor=0A0A1A)](https://github.com/nayrbryanGaming/blockblast)
[![Solana](https://img.shields.io/badge/⛓_Solana-Devnet-9945FF?style=for-the-badge&labelColor=0A0A1A)](https://explorer.solana.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-FF00FF?style=for-the-badge&labelColor=0A0A1A)](LICENSE)

---

</div>

## What is BlockBite?

**BlockBite** is a GameFi platform where players buy entry tickets (USDC), compete in a classic 8×8 block-puzzle arcade, and win real USDC prizes — all verified on-chain on Solana.

The name captures the concept perfectly:
- **BLOCK** → the core game mechanic (placing puzzle blocks on an 8×8 grid)
- **BITE** → 8-bit pixel art aesthetic + biting into the prize pool (earning rewards)

Unlike speculative GameFi projects, BlockBite uses **stablecoins only**, has **zero RNG in gameplay** (pure skill), and runs on a **monthly prize cycle** — giving the pool time to grow meaningfully before each distribution.

> _"Skill is the only alpha."_

---

## Key Features

| Feature | Details |
|---|---|
| 🎮 **Game Engine** | 8×8 Block puzzle — Canvas 60fps with HDR Ultra rendering |
| 🏆 **40,000 Levels** | Logarithmic curve — Rookie → Arcade → Cursed → Hard → Nightmare → Cosmic → Singularity |
| ⚡ **Mystery Box** | Every 5th level: x2–x10 multiplier, BOMB, or bonus points |
| 💰 **Monthly USDC Pool** | Top 10 + ticket-weighted participation bucket |
| 🔗 **Solana Native** | SPL-USDC real on-chain transfers (devnet live, mainnet ready) |
| 🔑 **Multi-Wallet** | Phantom, Solflare, Coinbase, Trust, Ledger, Torus |
| 🎨 **8-bit HDR UI** | Pure CSS + Canvas graphics, pixel-art avatar system (12 designs) |
| 📣 **Referral System** | Earn 5% lifetime from every ticket your referrals purchase |
| 🛡️ **Dev Dashboard** | `/dev` — localStorage error analytics with tier/stage breakdown |

---

## Tokenomics

Every **$1 USDC** ticket purchase is split automatically:

```
┌─────────────────────────────────────────────┐
│  PRIZE POOL       70%  → Monthly leaderboard │
│  TEAM REVENUE     15%  → Operations          │
│  DEV FUND         10%  → Infrastructure      │
│  REFERRAL POOL     5%  → Viral growth        │
└─────────────────────────────────────────────┘
```

**Monthly Prize Distribution** (Option B — Healthy Ecosystem):

| Rank | Pool Share | Example ($3,248 pool) |
|------|-----------|----------------------|
| 🥇 #1 | **30%** | ~$974 USDC |
| 🥈 #2 | **20%** | ~$649 USDC |
| 🥉 #3 | **10%** | ~$324 USDC |
| #4–10 | **25%** ÷ 7 each | ~$116 USDC each |
| All participants | **15%** ticket-weighted | proportional |

> Top-10 only (not top-100) eliminates sybil farming. Participation bucket ensures every player gets something.

---

## Ticket Packages ($1 = 5 tickets base rate)

| Package | Tickets | Price | Discount | Bonus |
|---------|---------|-------|----------|-------|
| Starter | 5 | $1.00 USDC | — | — |
| Explorer | 15 | $2.85 USDC | 5% | Explorer badge |
| Warrior | 30 | $5.40 USDC | 10% | Warrior badge + colored name |
| Hunter | 55 | $9.35 USDC | 15% | Streak Shield ×1 |
| Champion | 125 | $20.00 USDC | 20% | Early access |
| Legendary | 275 | $41.25 USDC | 25% | Hall of Fame |
| **GODMODE** | **600** | **$84.00 USDC** | **30%** | 🐋 Whale Room |

---

## Mystery Box System

Triggered at every level divisible by 5 (L5, L10, L15 …):

| Box Count | When |
|-----------|------|
| 3 boxes | Level 5 |
| 4 boxes | Level 10+ |

| Tier | MULTIPLIER | BOMB | BONUS PTS |
|------|-----------|------|-----------|
| Rookie (L1–20) | 5% / x2 | 15% | 80% / 100–300 pts |
| Arcade (L21–500) | 20% / x2–5 | 30% | 50% / 200–500 pts |
| Hard+ (L501–2500) | 30% / x2–8 | 40% | 30% / 500–1000 pts |
| Nightmare+ | 35% / x2–10 | 45% | 20% / 1000–3000 pts |

After 5th session pick: higher multiplier probability activates.

---

## Level System (40,000 Levels)

| Tier | Levels | Cumulative Score |
|------|--------|-----------------|
| Rookie | 1–5 | 0 → 3K |
| Arcade | 6–20 | 3K → 25K |
| Cursed | 21–499 | 25K → ~608K |
| Hard | 500–2499 | ~608K → ~3.66M |
| Nightmare | 2500–9999 | ~3.66M → ~21M |
| Cosmic | 10000–24999 | ~21M → ~79M |
| Singularity | 25000–40000 | ~79M → ~166M |

---

## Tech Stack

```
Frontend    Next.js 14 (App Router) · TypeScript · CSS Modules
Game Engine HTML5 Canvas API · 60fps · React useReducer state machine
Blockchain  @solana/web3.js · @solana/spl-token · @solana/wallet-adapter
Network     Solana Devnet (→ Mainnet at launch)
USDC Mint   4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU (devnet)
Deploy      Vercel · blockbite.vercel.app
```

---

## Architecture

```
blockblast/                    ← GitHub repo (kept for continuity)
├── app/
│   ├── page.tsx               # Landing page + live prize pool
│   ├── game/page.tsx          # Game canvas + HUD (ticket-gated)
│   ├── shop/page.tsx          # Real on-chain USDC ticket purchase
│   ├── leaderboard/           # Monthly leaderboard with rewards
│   ├── profile/               # Wallet identity + avatar + referrals
│   ├── how-to-play/           # Interactive mechanics guide
│   └── dev/page.tsx           # Developer error analytics dashboard
├── components/
│   ├── game/
│   │   ├── GameCanvas.tsx     # Main game: drag, click, keyboard
│   │   └── MysteryBoxModal.tsx# Mystery box pick UI + animations
│   ├── AppWalletProvider.tsx  # Solana wallet context (6 adapters)
│   ├── CssAvatars.tsx         # 12 pure-CSS avatar designs
│   └── Navbar.tsx             # PLAY/PROFILE/LEADERBOARD/SHOP/GUIDE
├── lib/
│   ├── game/
│   │   ├── constants.ts       # 40000 levels, scoring, tokenomics
│   │   ├── engine.ts          # useReducer game state machine
│   │   ├── mysteryBox.ts      # Box generation + probability tables
│   │   ├── pieces.ts          # 24 piece shapes (weighted random)
│   │   ├── renderer.ts        # Canvas HDR Ultra drawBoard, particles
│   │   ├── scoring.ts         # Chain multipliers, perfect board bonus
│   │   └── stages.ts          # Stage names, tier codes, box count
│   ├── solana/
│   │   ├── config.ts          # RPC, USDC mint, wallet addresses
│   │   ├── usdc.ts            # Real SPL token transfer + ATA creation
│   │   └── prizes.ts          # Prize distribution math (V3)
│   └── analytics/
│       └── errorReporter.ts   # localStorage error telemetry
```

---

## Local Development

**Prerequisites:** Node.js 18+, a Solana wallet (Phantom recommended)

```bash
# Clone
git clone https://github.com/nayrbryanGaming/blockblast.git
cd blockblast

# Install
npm install

# Dev server
npm run dev
# → http://localhost:3000

# Production build
npm run build && npm start
```

**Devnet USDC:** Get free test USDC from [faucet.solana.com](https://faucet.solana.com/)

**New Vercel project:** Create at [vercel.com](https://vercel.com), set project name to `blockbite`, connect to the `nayrbryanGaming/blockblast` GitHub repo. The deployed URL will be `blockbite.vercel.app`.

---

## Roadmap

```
✅ Phase 0  Core game engine, 60fps HDR renderer, 40,000-level logarithmic system
✅ Phase 1  Wallet integration (6 adapters), ticket UI, CSS avatar system
✅ Phase 1b Real on-chain USDC transfer (devnet), mystery box, monthly leaderboard
🔄 Phase 2  Anchor smart contract: purchase_tickets, start_session, distribute_rewards
⬜ Phase 3  On-chain score signing (anti-cheat), merkle participation proofs
⬜ Phase 4  Achievement system, referral tracking on-chain, Season Pass
⬜ Phase 5  Security audit + Mainnet launch
⬜ Phase 6  Mobile app (Solana dApp Store), ecosystem token collabs
```

---

## Unit Economics

```
Monthly costs (Vercel + RPC)    ≈  $50–200
Break-even                      ≈  400 tickets/month at $0.15 rake
Target Month 3                  ≈  5,000 tickets → $3,000/month pool
Target Month 6                  ≈  20,000 tickets → $12,000/month pool
```

---

## Platform Wallets (Devnet)

| Wallet | Address | Purpose |
|--------|---------|---------|
| Fee Wallet | `35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr` | Receives ticket revenue |
| Team Wallet | `ETcQvsQek2w9feLfsqoe4AypCWfnrSwQiv3djqocaP2m` | Team & ops |

> ⚠️ **Security:** Never share private keys. The fee wallet private key was exposed in a prior session — that wallet must be considered compromised and replaced before mainnet. Generate a new keypair with `solana-keygen new` and update `FEE_WALLET` in `lib/solana/config.ts`.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit following Conventional Commits
4. Open a Pull Request

---

## License

MIT © 2026 nayrbryanGaming — BlockBite Web3

---

<div align="center">
  <sub>Built on Solana · Powered by USDC · Verified on-chain · Deployed on Vercel</sub><br/>
  <sub><b>blockbite.vercel.app</b> · GitHub: nayrbryanGaming/blockblast</sub>
</div>
