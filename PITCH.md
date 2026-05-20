# BLOCKBITE TDP — One-Pager

## The Problem

Token distribution on Solana is broken. Founders vest tokens with spreadsheets. DAOs airdrop all-at-once. Players get rewards with no behavioral gate — bots farm everything. There is no composable, oracle-aware vesting protocol on Solana.

## The Product

**BLOCKBITE TDP (Token Distribution Protocol)** — programmable token streaming with 3-tier unlock mechanics:

```
Cliff Gate    →  Milestone Gate  →  Linear Streaming
(time lock)       (oracle check)      (per-second flow)
```

Any project deploys a stream in one transaction. Tokens flow automatically based on configured conditions — no admin intervention required.

## Why This Is Different

| Feature | Sablier (ETH) | Streamflow (SOL) | BLOCKBITE TDP |
|---|---|---|---|
| Linear streaming | YES | YES | YES |
| Cliff gate | YES | YES | YES |
| Milestone / oracle gate | NO | NO | **YES** |
| Composable oracle | NO | NO | **YES** |
| Chain | Ethereum | Solana | **Solana** |

The milestone gate is the unlock: any oracle — a game, a DAO vote, an admin key — can advance a player's `ProofCache.tier_reached`, which gates token unlock. The TDP contract is oracle-agnostic.

## The Oracle Plugin (The Game)

The Blockbite puzzle game serves as the default proof-of-activity oracle. Completing levels advances your tier. This proves human engagement (not a bot) before releasing tokens.

VGPV (Velocity-Gated Proof Validation): the protocol detects and blocks bots by requiring 2 hours minimum between oracle updates, with a 3-strike block on violation.

Projects that don't need the game simply set `required_tier = 0` — pure time-based vesting.

## Use Cases

| Customer | Configuration | Value |
|---|---|---|
| Startup (team vesting) | cliff=12mo, end=48mo, tier=0 | standard 4-year vest |
| DAO (community airdrop) | cliff=0, end=6mo, tier=0 | linear release to holders |
| Game (player rewards) | cliff=0, end=30d, tier=1 | must prove activity first |
| Investor (lock) | cliff=6mo, end=24mo, tier=0 | standard investor lock |
| Grant (milestone) | cliff=0, end=12mo, tier=1 | DAO vote as oracle |

## Tokenomics (fund_vault)

Revenue splits automatically on every vault deposit:

```
70% → prize pool vault (player rewards)
15% → team wallet
10% → dev wallet
 5% → referral wallet
```

Floor arithmetic with dust→vault invariant: no token loss, ever.

## Traction

- Live app: https://blockbite.vercel.app
- Waitlist: active, email signups captured
- Leaderboard: 5567+ players tracked
- Smart contract: deployed on Solana devnet
- Week 5 / 10: Mancer Work Solana Superteam developer track

## Technical Stack

- Anchor 0.32.1 (Solana)
- Next.js 14 (frontend)
- Vercel KV (leaderboard)
- Phantom / Solflare wallet adapters

## Program ID

`DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf` (Solana devnet)

## Contact

**Bryan Nayrbry** — @nayrbryanGaming
nayrbryangaming3@gmail.com
https://github.com/nayrbryanGaming/blockblast
