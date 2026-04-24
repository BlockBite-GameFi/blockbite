<div align="center">

<h1>
  <img src="https://img.shields.io/badge/⬛-BLOCKBLAST-00F5FF?style=flat-square&labelColor=0A0A1A&color=00F5FF" alt="" />
  &nbsp;BlockBlast Web3
</h1>

**The world's first skill-based, 100% transparent puzzle arena on Solana.**  
Compete weekly for USDC prize pools. No luck, no house edge — pure strategy.

[![Live App](https://img.shields.io/badge/🚀_Live_App-nngblockblast.vercel.app-00F5FF?style=for-the-badge&labelColor=0A0A1A)](https://nngblockblast.vercel.app/)
[![Solana](https://img.shields.io/badge/⛓_Solana-Devnet-9945FF?style=for-the-badge&labelColor=0A0A1A)](https://explorer.solana.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-FF00FF?style=for-the-badge&labelColor=0A0A1A)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-00F5FF?style=for-the-badge&logo=next.js&labelColor=0A0A1A)](https://nextjs.org/)

---

</div>

## Overview

BlockBlast Web3 is a **GameFi platform** where players buy entry tickets (USDC), compete on a weekly leaderboard with classic Block Blast puzzle gameplay, and win real USDC prizes — all verified on-chain on Solana.

Unlike speculative GameFi projects, BlockBlast Web3 uses **stablecoins only** (no volatile token), has **zero RNG in gameplay** (pure skill), and distributes prizes to the **top 100 players** every week — ensuring the widest possible win distribution to maximize retention.

> _"Skill is the only alpha."_

---

## Key Features

| Feature | Details |
|---|---|
| 🎮 **Game Engine** | 8×8 Block Blast — canvas-rendered at 60fps with HDR Ultra visuals |
| 🏆 **9,540 Levels** | Balanced progression from casual to Cursed Mode |
| 💰 **USDC Prize Pools** | Weekly — top 100 players win real stablecoins |
| 🔗 **Solana Native** | SPL-USDC transactions, on-chain score snapshots |
| 🔑 **Multi-Wallet** | Phantom, Solflare, Coinbase, Trust, Ledger, Torus + more |
| 🎨 **HDR UI** | Pure CSS + Canvas graphics, no external image assets needed |
| 👤 **Wallet Identity** | 12 CSS-generated avatars, custom usernames, achievement badges |
| 📣 **Referral System** | Earn 5% lifetime from every ticket your referrals purchase |

---

## Tokenomics

Every 1 USDC entry ticket is split automatically:

```
┌─────────────────────────────────────────┐
│  PRIZE POOL       70%  → Top 100 weekly │
│  TEAM REVENUE     15%  → Operations     │
│  DEV FUND         10%  → Infrastructure │
│  REFERRAL POOL     5%  → Viral growth   │
└─────────────────────────────────────────┘
```

**Weekly Prize Distribution** (from the 70% prize pool):

| Rank | Pool Share | Example (5,000 tickets sold) |
|------|-----------|------------------------------|
| 🥇 #1 | 20% | ~700 USDC |
| 🥈 #2 | 12% | ~420 USDC |
| 🥉 #3 | 8% | ~280 USDC |
| #4–5 | 5% each | ~175 USDC each |
| #6–10 | 3% each | ~105 USDC each |
| #11–20 | 1.5% each | ~52 USDC each |
| #21–50 | 0.5% each | ~17 USDC each |
| #51–100 | 0.1% each | ~3.5 USDC each |

---

## Ticket Packages

| Package | Tickets | Price | Discount | Bonus |
|---------|---------|-------|----------|-------|
| Starter | 1 | 1.00 USDC | — | — |
| Explorer | 3 | 2.85 USDC | 5% | Explorer badge |
| Warrior | 5 | 4.50 USDC | 10% | Warrior badge + colored name |
| Hunter | 10 | 8.50 USDC | 15% | Streak Shield |
| Champion | 25 | 20.00 USDC | 20% | Early access |
| Legendary | 50 | 37.50 USDC | 25% | Hall of Fame entry |
| **GODMODE** | 100 | 70.00 USDC | 30% | 🐋 Whale Room access |

---

## Tech Stack

```
Frontend    Next.js 14 (App Router) · TypeScript · CSS Modules
Game Engine HTML5 Canvas API · 60fps game loop · React useReducer
Blockchain  @solana/web3.js · @solana/spl-token · @solana/wallet-adapter
Wallets     Phantom · Solflare · Coinbase · Trust · Ledger · Torus
Deploy      Vercel (serverless, edge-optimized)
```

---

## Architecture

```
blockblast/
├── app/
│   ├── page.tsx           # Landing page + live prize pool counter
│   ├── game/page.tsx      # Game canvas + HUD (requires ticket)
│   ├── shop/page.tsx      # Ticket purchase UI
│   ├── leaderboard/       # Weekly/All-Time/Daily/Whale Room LB
│   ├── profile/           # Wallet identity + avatar + referrals
│   └── how-to-play/       # Interactive tutorial
├── components/
│   ├── AppWalletProvider.tsx   # Solana wallet context
│   ├── CustomWalletButton.tsx  # Custom wallet pill + avatar picker
│   ├── CssAvatars.tsx          # 12 pure-CSS avatar designs
│   ├── Navbar.tsx
│   ├── PrizePoolCounter.tsx    # Live-updating prize pool
│   └── game/GameCanvas.tsx     # Main game component
├── lib/
│   ├── game/
│   │   ├── constants.ts   # 9540 levels, scoring, tokenomics
│   │   ├── engine.ts      # useReducer game state machine
│   │   ├── pieces.ts      # 24 piece shapes with weighted RNG
│   │   ├── renderer.ts    # Canvas drawBlock, particles, shockwaves
│   │   └── scoring.ts     # Chain multipliers, perfect board
│   └── solana/prizes.ts   # Prize pool distribution logic
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
npm run build
npm start
```

For Solana Devnet testing, get free test USDC from the [Solana Devnet faucet](https://faucet.solana.com/).

---

## Roadmap

```
✅ Phase 0 — Core game engine, HDR Ultra renderer, 9540-level system
✅ Phase 1 — Wallet integration, multi-wallet support, ticket UI
🔄 Phase 2 — Solana Devnet smart contract (Anchor), on-chain tickets
⬜ Phase 3 — Weekly prize distribution (trustless, on-chain)
⬜ Phase 4 — Achievement system, referral tracking, Season Pass
⬜ Phase 5 — Mainnet launch + security audit
⬜ Phase 6 — Mobile app (Solana dApp Store)
```

---

## Unit Economics

```
Monthly server costs (Vercel + DB)  ≈  $50–200
Tickets needed to break even        ≈  400 tickets/month (at $0.15 rake)
Target Month 3                      ≈  5,000 tickets/week → $3,000/month
Target Month 6                      ≈  20,000 tickets/week → $12,000/month
```

---

## Wallets

**Team Revenue Wallet:**
```
ETcQvsQek2w9feLfsqoe4AypCWfnrSwQiv3djqocaP2m
```

**Platform Fee Wallet:**
```
35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes following Conventional Commits
4. Open a Pull Request

---

## License

MIT © 2026 nayrbryanGaming — BlockBlast Web3

---

<div align="center">
  <sub>Built on Solana · Powered by USDC · Verified on-chain · Deployed on Vercel</sub>
</div>
