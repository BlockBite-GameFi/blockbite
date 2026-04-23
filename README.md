# 🎮 BlockBlast Web3: The Elite Skill-Based Puzzle Arena on Solana

[![Deployment Status](https://img.shields.io/badge/Status-Mainnet--Ready-00FF88?style=for-the-badge&logo=solana)](https://nngblockblast.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-00F5FF?style=for-the-badge)](LICENSE)
[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-FF00FF?style=for-the-badge)](https://solana.com)

**BlockBlast Web3** is a high-performance GameFi platform that transforms the addictive casual puzzle mechanic into a competitive, skill-based arcade. Powered by Solana and USDC, we offer a transparent, 0-modal prize distribution system where top strategic players earn real rewards.

---

## 🚀 Key Value Propositions

- **🎯 0% Luck, 100% Skill**: No RNG, no gambling. Every piece placement is a strategic decision.
- **💰 Transparent Tokenomics**: 100% of ticket revenue is distributed via a verifiable on-chain split (70% Prize Pool, 15% Team, 10% Dev, 5% Referral).
- **⛓️ Pure On-Chain Logic**: Weekly tournaments, prize distributions, and ticket burning are managed by Solana smart contracts.
- **🌈 HDR Ultra Aesthetics**: A premium "Deep Space Neon Arcade" theme built entirely with high-performance CSS and Canvas rendering.

---

## 🛠 Technical Architecture

- **Frontend**: Next.js 14, React 18, TailwindCSS, HTML5 Canvas API.
- **Blockchain**: Solana Web3.js, @solana/wallet-adapter (Phantom, Solflare, Backpack).
- **Backend**: Vercel Serverless Functions, Supabase for leaderboard persistence.
- **Smart Contracts**: Anchor Framework (Solana).

### High-Performance Rendering
Our engine uses a custom **HDR Ultra Renderer** (`lib/game/renderer.ts`) that supports:
- High-density particle bursts on line clears.
- Shockwave animations with dynamic scaling.
- 3-stop gradient block rendering with inner gloss highlights.
- Parallax idle background animations.

---

## 📈 Business Model (0-Modal Philosophy)

BlockBlast operates as a sustainable startup with zero upfront capital requirements. Every 1 USDC ticket purchase is split automatically:

| Component | Share | Purpose |
| :--- | :--- | :--- |
| **Prize Pool** | 70% | Distributed weekly to the top 100 players. |
| **Team Revenue** | 15% | Sustainable operations and profit. |
| **Dev Fund** | 10% | Smart contract audits and scaling tools. |
| **Referral Pool** | 5% | Rewarding players who drive viral growth. |

---

## 🏆 Hall of Fame & Rewards

The Weekly Tournament rewards the top 100 strategic thinkers. Current distribution:
- **Rank 1**: 20% of the total pool.
- **Rank 2**: 12% of the total pool.
- **Rank 3**: 8% of the total pool.
- ...and rewards all the way down to **Rank 100**.

---

## 🛠 Getting Started

### Prerequisites
- [Phantom Wallet](https://phantom.app/) or [Solflare](https://solflare.com/)
- Solana Devnet USDC (Circle Faucet)

### Installation
```bash
git clone https://github.com/nayrbryanGaming/blockblast.git
cd blockblast
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 🗺 Roadmap

- [x] **Phase 0**: Core Puzzle Engine & HDR Ultra Visuals.
- [x] **Phase 1**: Solana Wallet Integration & Profile Customization.
- [ ] **Phase 2**: Anchor Smart Contract Deployment (Devnet).
- [ ] **Phase 3**: Weekly Automated Prize Distribution.
- [ ] **Phase 4**: Mainnet Launch & VC Pitch Deck.

---

## ⚖️ Legal & Compliance

BlockBlast is designed as a **Skill-Based Game**. We use fixed mechanics where success is determined by player ability, not chance. Please check your local jurisdiction for Web3 gaming compliance.

---

© 2026 nayrbryanGaming · Built for the Next Billion Gamers on Solana.
