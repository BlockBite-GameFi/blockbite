# Contributors

## Week 4 — Core Smart Contract

### Bryan Kwandou (@nayrbryanGaming)
- Anchor program architecture (create_stream, withdraw, cancel instructions)
- VGPV (Velocity-Gated Proof Validation) constants and struct fields
- Cliff vesting implementation (`cliff_ts` parameter, updated `unlocked_amount`)
- Devnet deployment (`DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`)
- CI pipeline (GitHub Actions — build + test on every push/PR)
- Security hardening: timing-safe admin auth, HMAC session tokens, Ed25519 sig verify
- Vercel KV integration: leaderboard persistence, waitlist, user profiles, admin state
- Frontend: game engine (8×8 match-3, 40k levels, 7 block types, chain bonuses)

### Raisha Al Fadhila Putri
- Account struct byte-size verification (`StreamAccount::LEN = 155`)
- Error code definitions (`ZeroAmount`, `InvalidTimeRange`, `InvalidCliff`, etc.)
- Test suite co-review: all 11 acceptance criteria verified
- Waitlist page design review (`app/waitlist/page.tsx`)
- README devnet-deploy section
- Cross-verification: clone-to-compile confirmation

---

## Commit Attribution

All commits on the `main` branch are from `nayrbryanGaming`. Raisha's contributions are
reflected in the code (account struct specs, test criteria, README sections) following
pair-review sessions documented in weekly reports.

**AI tooling:** Claude Code (Anthropic) used for code generation assistance.
All generated code was reviewed, tested, and committed by team members.
Per reviewer guidance: AI tool usage is transparent and declared here.
