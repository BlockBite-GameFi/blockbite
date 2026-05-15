# Security Policy

## Supported Versions

| Version | Network | Status |
|---------|---------|--------|
| W4 (current) | Devnet | Active development |
| Mainnet | — | Not yet deployed |

## Reporting a Vulnerability

**DO NOT open a public GitHub issue for security vulnerabilities.**

Email: nayrbryangaming3@gmail.com
Response SLA: 48 hours for acknowledgement, 7 days for triage

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (optional)

All reports are treated confidentially. We will acknowledge receipt and provide a remediation timeline based on severity.

## Bug Bounty

Bug bounty program will be formally launched 2 weeks before any USDC is deposited into production vaults.

| Severity | Reward |
|----------|--------|
| CRITICAL | Contact for negotiation |
| HIGH | TBD before mainnet |
| MEDIUM | TBD |
| LOW | Acknowledgement |

## Current Security Status

- Network: **Devnet only** — no real funds at risk
- Upgrade authority: Single wallet (to be transferred to 3-of-5 Squads multisig before mainnet)
- VGPV anti-bot: Struct scaffolding live; full enforcement ships W5
- Rate limiting: Active on /api/waitlist, /api/session/start, /api/score/sign

## Scope

In scope:
- Smart contract (`programs/blockbite-vesting/`)
- API routes (`app/api/`)
- Session and authentication logic
- Score signing and leaderboard

Out of scope:
- Third-party dependencies (report upstream)
- Social engineering
- Physical attacks
