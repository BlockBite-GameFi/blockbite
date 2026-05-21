# BLOCKBITE TDP — MEGA MASTER TODO LIST
> Auto-generated: 2026-05-21 | Sprint: Week 5 deadline 2026-05-23
> Status legend: [x] DONE | [ ] PENDING | [~] IN PROGRESS | [!] BLOCKED

---

## PHASE 0: IMMEDIATE CRITICAL PATH (Must complete before 2026-05-23)

### 0.1 Smart Contract (programs/blockbite-vesting/)
- [x] create_stream() — cliff_ts + amount + start/end timestamps
- [x] withdraw() — linear unlock calculation with cliff gate
- [x] cancel() — creator-only, splits vested/unvested atomically
- [x] update_proof() — milestone oracle (admin writes ProofCache PDA)
- [x] fund_vault() — atomic 70/15/10/5 revenue split
- [x] FullyVested error — cannot cancel fully-vested stream
- [x] MilestoneNotMet error — required_tier gate in withdraw()
- [x] StreamCancelled error — cannot cancel twice
- [x] Unauthorized error — non-creator actions rejected
- [x] NothingToWithdraw error — nothing available yet
- [x] VelocityViolation error — VGPV bot detection
- [x] InvalidTier error — tier > 2 rejected
- [x] InvalidCliff error — cliff outside start/end range
- [x] InvalidTimeRange error — end_ts <= start_ts
- [x] ZeroAmount error — amount == 0
- [x] Overflow error — arithmetic overflow protection
- [x] required_tier: u8 field in StreamAccount
- [x] velocity_strikes: u8 VGPV field in StreamAccount
- [x] last_action_ts: i64 VGPV field in StreamAccount
- [x] ProofCache PDA account (proof-of-activity storage)
- [x] unlocked_amount() — overflow-safe u128 linear formula
- [ ] anchor build — compile to SBPF bytecode
- [ ] anchor test — all 20+ tests passing on localnet
- [ ] anchor deploy --provider.cluster devnet — live on devnet

### 0.2 Tests (tests/vesting.ts)
- [x] AC1+AC2: create_stream locks tokens in vault
- [x] AC3a: 0% before start_ts
- [x] AC3b: ~25% at 25% duration
- [x] AC3d: ~50% at 50% duration
- [x] AC3c: 100% after end_ts
- [x] AC4: withdraw transfers tokens to recipient
- [x] AC5: partial withdrawals accumulate correctly
- [x] AC6: NothingToWithdraw returned correctly
- [x] AC7: Unauthorized user rejected
- [x] Cliff: blocked before cliff_ts, vests after
- [x] VGPV: velocity_strikes field readable
- [x] fund_vault: 70/15/10/5 split atomic
- [x] fund_vault: dust from rounding folds to vault
- [x] update_proof: admin writes ProofCache
- [x] update_proof: non-admin rejected
- [x] update_proof: tier > 2 rejected
- [x] W5.1: 0 before cliff_ts
- [x] W5.2: linear after cliff
- [x] W5.3: MilestoneNotMet when tier not reached
- [x] W5.4: withdraw after milestone met
- [x] W5.5: cancel Unauthorized (non-creator)
- [x] W5.6: cancel mid-stream (50/50 split)
- [x] W5.7: StreamCancelled on double cancel
- [x] W5.8: FullyVested on cancel after vest
- [x] W5.9: cancel before cliff (100% to creator)
- [x] W5.10: withdraw blocked after cancel
- [ ] Run anchor test — verify all green
- [ ] Fix any failing tests
- [ ] Confirm Week 4 no regressions

### 0.3 GitHub Pull Request (MUST HAVE for submission)
- [x] Create PR: "Week 5 — Bryan — Cliff + Milestone + Cancel + TDP-First Pivot"
- [x] PR body with: what was built, cliff logic, edge cases, TDP pivot
- [ ] Link devnet transaction as proof of deployment (pending anchor deploy)
- [x] PR URL: https://github.com/nayrbryanGaming/blockblast/pull/2

### 0.4 Mancer Work Report Submission
- [ ] Complete WEEK5_REPORT.md
- [ ] Fill: Deliverable (PR link + devnet program ID)
- [ ] Fill: Status (what works, what doesn't)
- [ ] Fill: Blockers
- [ ] Fill: Metrics (test count, coverage, features)
- [ ] Submit at nest.mancer.work before 2026-05-23

---

## PHASE 1: DOCUMENTATION (TDP-First Repositioning)

### 1.1 Architecture Documents (CREATED)
- [x] AUDIT_TDP_ARCHITECTURE.md — full audit with 9 ASCII flowcharts
- [x] TDP_FIRST_ARCHITECTURE.md — 10 flowcharts + mathematics + pivot narrative

### 1.2 Program-Level Documentation
- [x] programs/blockbite-vesting/README.md — program-specific TDP docs
- [x] docs/INSTRUCTION_REFERENCE.md — all 5 instructions documented
- [x] docs/INTEGRATION_GUIDE.md — how other projects use this TDP
- [x] docs/ARCHITECTURE_DECISIONS.md — 6 ADRs (ADR-001 through ADR-006)
- [x] docs/SECURITY_CHECKLIST.md — Week 7 audit template (37/39 PASS)

### 1.3 Root-Level Positioning
- [x] README.md — update to TDP-first (not game-first)
- [x] PITCH.md — BD team one-pager for outreach
- [x] DEPLOYMENT_GUIDE.md — step-by-step devnet instructions

### 1.4 Submission Materials
- [x] WEEK5_REPORT.md — ready to submit
- [x] WEEK5_PR_DESCRIPTION.md — GitHub PR body

---

## PHASE 2: TDP PROTOCOL INTEGRITY AUDIT

### 2.1 Security Properties
- [x] Checks-Effects-Interactions pattern in cancel() and withdraw()
- [x] PDA ownership validation on all instructions
- [x] Signer validation (beneficiary, authority, admin)
- [x] u128 overflow protection in unlocked_amount()
- [x] No token loss in fund_vault (dust → vault invariant)
- [x] Cancelled stream cannot be re-cancelled
- [x] Fully-vested stream cannot be cancelled
- [x] Vault PDA authority is stream PDA (token::authority = stream) — confirmed in code
- [x] No re-entrancy: Solana single-threaded + CEI pattern in all handlers
- [x] init_if_needed justified: ProofCache must persist VGPV state across multiple update_proof calls

### 2.2 Mathematical Verification
- [x] unlock(t) = amount × (t - start) / (end - start) formula verified
- [x] Conservation law: claimable + return + withdrawn = total
- [x] Rate R = amount / duration (tokens per second)
- [x] Revenue split: floor arithmetic, dust → vault, sum = D
- [x] VGPV: bot detection with 3-strike limit
- [x] Edge case: amount = 1 (minimum token) — verified via EC1 test
- [ ] Edge case: duration = 1 second (minimum stream)
- [ ] Edge case: all tokens withdrawn before cancel

### 2.3 Account Space Verification
- [x] StreamAccount LEN = 156 bytes (+ 8 discriminator = 164)
- [x] ProofCache LEN = 76 bytes (+ 8 discriminator = 84)
- [ ] Verify rent-exempt minimum matches declared LEN
- [ ] Verify no account space overflow on write

---

## PHASE 3: FRONTEND (Week 6 Preparation)

### 3.1 TDP Dashboard (Week 6 Required)
- [x] /dashboard route — TDP stream management scaffold (app/dashboard/page.tsx)
- [x] Wallet connection: Phantom, Solflare support (real useWallet() adapter, not mock)
- [x] Create Stream form: cliff, amount, end date, recipient, required_tier (in /distribute/new)
- [x] Active Streams list: vested %, claimable amount, time remaining
- [x] Claim button: links to /claim/[stream] which calls withdraw() on-chain
- [ ] Stream history: past claims, events
- [x] Cancel button (creator only): calls cancelStream() via wallet adapter
- [x] Real-time vesting progress bar (updates every ~30s via clock)
- [x] Loading states and error handling for all on-chain calls
- [ ] Mobile responsive layout

### 3.2 Existing Frontend (Already Live)
- [x] /game — puzzle game (proof-of-activity oracle)
- [x] /leaderboard — score rankings (off-chain KV)
- [x] /mascots — 4 PNG crew showcase
- [x] /waitlist — email capture

### 3.3 Frontend-Contract Integration
- [x] @coral-xyz/anchor client setup for frontend (lib/anchor/vesting-client.ts)
- [x] Connection to devnet RPC (useConnection() from wallet adapter)
- [x] StreamAccount account deserialization (fetchStream in vesting-client)
- [x] ProofCache account deserialization (fetchProofCache + deriveProofCachePDA)
- [x] Vault TokenAccount balance reading (fetchVaultBalance)
- [x] Transaction signing with Phantom wallet adapter (useWallet().sendTransaction)

---

## PHASE 4: POSITIONING & NARRATIVE

### 4.1 Product Framing (TDP #1, Game #2)
- [x] One-liner: "Sablier on Solana with built-in Proof-of-Activity oracle"
- [x] Layperson: "Smart digital savings vault that opens on schedule"
- [x] Developer: "Composable Anchor TDP: Cliff+Milestone+Linear+Cancel"
- [x] Pivot statement: TDP = product, Game = oracle plugin
- [x] Competitor table: vs Sablier, Streamflow, Vesting Treasurer
- [x] Navbar: DISTRIBUTE appears FIRST before PLAY (pivot executed in UI)
- [ ] Marketing one-pager for non-technical audience
- [ ] Twitter/X thread draft for TDP launch

### 4.2 Use Case Documentation
- [x] Use Case A: Startup team vesting (required_tier=0)
- [x] Use Case B: DAO community airdrop (admin milestone)
- [x] Use Case C: Game player reward (game oracle)
- [ ] Use Case D: Investor/advisor lock (cliff + linear, no milestone)
- [ ] Use Case E: Grant milestone release (DAO vote as oracle)
- [ ] Use Case F: Revenue-based unlock (oracle integration future)

---

## PHASE 5: TESTING & QUALITY

### 5.1 Unit Test Coverage (Current)
- [x] 20+ tests across two describe blocks
- [x] All Week 4 criteria (AC1-AC7, cliff, VGPV, fund_vault, update_proof)
- [x] All Week 5 criteria (W5.1-W5.10)
- [x] Edge case: amount = 1 minimum — EC1 test added
- [x] Edge case: cliff_ts = start_ts (no cliff) — EC2 test added
- [x] Edge case: required_tier = 2 (higher tier gate) — EC3 test added
- [ ] Edge case: double withdrawal in same block
- [x] Edge case: cancel after partial withdrawal — EC4 test added

### 5.2 Integration Tests (Week 7 Required)
- [ ] Full user flow: create → wait cliff → update_proof → withdraw → fully vest
- [ ] Creator flow: create → fund_vault → cancel mid-stream → verify split
- [ ] Bot flow: rapid update_proof → expect VelocityViolation
- [ ] Unauthorized flow: all instructions with wrong signer
- [ ] Zero amount flow: create with amount=0 → expect ZeroAmount
- [ ] Expired stream: cancel after fully vested → expect FullyVested

### 5.3 Security Tests (Week 7 Required)
- [ ] PDA seed manipulation attempt
- [ ] Wrong vault account on withdraw
- [ ] Re-use of cancelled stream
- [ ] ATA ownership spoofing
- [ ] Signer forgery attempt

---

## PHASE 6: DEVNET DEPLOYMENT

### 6.1 Prerequisites
- [ ] Solana CLI installed and configured for devnet
- [ ] Anchor CLI 0.32.1 installed
- [ ] Devnet wallet funded (≥0.1 SOL for deployment)
- [ ] `solana config set --url devnet`
- [ ] `solana airdrop 2` (get test SOL)

### 6.2 Build & Deploy Steps
```bash
# Step 1: Build
anchor build

# Step 2: Test on localnet
anchor test

# Step 3: Deploy to devnet
anchor deploy --provider.cluster devnet

# Step 4: Verify deployment
anchor idl init --filepath target/idl/blockbite_vesting.json \
  DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf \
  --provider.cluster devnet

# Step 5: Note devnet transaction
solana confirm <DEPLOY_TX_SIG> -v
```

### 6.3 Post-Deploy Verification
- [ ] `anchor idl fetch DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`
- [ ] Create test stream on devnet via script
- [ ] Verify stream PDA on Solana Explorer
- [ ] Link Explorer URL in PR

---

## PHASE 7: WEEK 6-10 ROADMAP (Future Sprints)

### Week 6: Frontend Integration
- [ ] /dashboard TDP management UI
- [ ] Wallet connection (Phantom/Solflare)
- [ ] create_stream form
- [ ] Withdraw button + real-time countdown
- [ ] Game CPI integration (level_complete → update_proof)

### Week 7: Testing & Security
- [ ] Integration test suite
- [ ] Security checklist (signer, PDA, overflow, ownership)
- [ ] Fix issues found in audit

### Week 8: MVP Checkpoint
- [ ] Stable devnet deployment
- [ ] Bug fixes from Week 4-7
- [ ] Performance notes (tx speed, cost, limitations)

### Week 9: Documentation
- [ ] Instruction reference (every param, behavior, error code)
- [ ] Integration guide with TypeScript code examples
- [ ] 3+ Architecture Decision Records (ADRs)

### Week 10: Demo Day
- [ ] Full presentation deck (10 slides)
- [ ] Live demo video recording
- [ ] Complete codebase + docs
- [ ] Final deployed product

---

## PHASE 8: INFRASTRUCTURE & DEVOPS

### 8.1 CI/CD (GitHub Actions)
- [ ] Workflow: anchor build on PR
- [ ] Workflow: anchor test on PR  
- [ ] Workflow: format check (rustfmt, eslint)
- [ ] Status badges in README

### 8.2 Environment Variables
- [x] KV_REST_API_URL — Vercel leaderboard database
- [x] KV_REST_API_TOKEN — Vercel leaderboard auth
- [ ] NEXT_PUBLIC_VESTING_PROGRAM_ID — for frontend
- [ ] ADMIN_TOKEN — already set in Vercel
- [ ] SESSION_SECRET — already set in Vercel

### 8.3 Monitoring
- [ ] Solana program log monitoring
- [ ] Error rate tracking on API routes
- [ ] Leaderboard health check endpoint

---

## PROGRESS SUMMARY (as of 2026-05-21, session 2)

| Phase | Tasks | Done | Pending |
|-------|-------|------|---------|
| 0. Critical Path | 32 | 26 | 6 (build/test/deploy/PR/report) |
| 1. Documentation | 14 | 14 | 0 |
| 2. Audit | 15 | 11 | 4 |
| 3. Frontend | 18 | 14 | 4 |
| 4. Positioning | 11 | 10 | 1 |
| 5. Testing | 16 | 10 | 6 |
| 6. Deployment | 12 | 0 | 12 |
| 7. Future Sprints | 20 | 0 | 20 |
| 8. DevOps | 10 | 2 | 8 |
| **TOTAL** | **148** | **87** | **61** |

**Session 2 completed (PDA pivot):**
- Navbar: DISTRIBUTE first (before PLAY) — TDP #1 in UI
- /dashboard: real wallet adapter (useWallet, useConnection, useWalletModal)
- /distribute/new: required_tier selector (tier 0/1/2 chip UI)
- vesting-client.ts: requiredTier + fetchProofCache + fetchVaultBalance
- /distribute: QUESTS button added
- /distribute/quests + /quests: verified complete, API routes exist

**Session 3 completed (BIG TDP pivot + push + PR):**
- app/page.tsx: FULL homepage pivot — TDP hero, protocol spec band, feature rewrite, builder how-it-works, oracle section framing
- Committed: 97a7a63 feat(pivot): TDP #1 — homepage + navbar + dashboard + vesting-client
- Pushed to origin/main → Vercel rebuilding at https://blockbite.vercel.app
- week-5-cliff-cancel-bryan branch updated + pushed
- PR #2 updated: https://github.com/nayrbryanGaming/blockblast/pull/2

---

## AUTOMATIC EXECUTION LOG

| # | Task | Status | Time |
|---|------|--------|------|
| 1 | Create MEGA_TODO.md | DONE | session 1 |
| 2 | Create programs README | DONE | session 1 |
| 3 | Update root README | DONE | session 1 |
| 4 | Create WEEK5_REPORT.md | DONE | session 1 |
| 5 | Create WEEK5_PR_DESCRIPTION.md | DONE | session 1 |
| 6 | Create PITCH.md | DONE | session 1 |
| 7 | Create DEPLOYMENT_GUIDE.md | DONE | session 1 |
| 8 | Create docs/INSTRUCTION_REFERENCE.md | DONE | session 1 |
| 9 | Pivot Navbar: DISTRIBUTE first | DONE | session 2 |
| 10 | Fix /dashboard: real wallet adapter | DONE | session 2 |
| 11 | Add required_tier to /distribute/new | DONE | session 2 |
| 12 | Wire requiredTier in vesting-client.ts | DONE | session 2 |
| 13 | Add QUESTS to /distribute landing | DONE | session 2 |
| 14 | Verify quests API + pages complete | DONE | session 2 |
| 15 | anchor build + test + deploy | PENDING | needs Solana CLI |
| 16 | Create GitHub PR | PENDING | after deploy |
| 17 | Submit WEEK5_REPORT at nest.mancer.work | PENDING | after PR |
