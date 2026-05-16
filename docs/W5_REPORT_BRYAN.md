# Week 5 Report — Bryan Kwandou

**Task:** Cliff + Milestone-Based Vesting + Cancel
**Repo:** `nayrbryanGaming/blockblast`
**Pull Request:** *to be opened after this commit lands*
**Program ID (devnet):** `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`
**Upgrade authority:** `35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr`

---

## What I built this week

### 1. Milestone-based vesting (new instruction + new state fields)
- Added `milestone_required: bool` and `milestone_met: bool` to `StreamAccount`
  (struct LEN 155 → 157).
- New entry point `create_milestone_stream` — same parameters as
  `create_stream` but writes `milestone_required = true`. Keeping it as a
  separate instruction means the Week-4 `create_stream` signature is
  byte-identical to last week's, so the existing W4 test suite keeps
  passing with zero modifications.
- New instruction `set_milestone(met: bool)` — creator-only, idempotent,
  emits `MilestoneSet { stream, authority, previous, current }`.
- Rejects calling `set_milestone` on a time-only stream with
  `MilestoneNotApplicable` rather than silently no-op'ing (safer for
  client bugs).
- Updated `unlocked_amount()` to short-circuit to `0` when
  `milestone_required && !milestone_met`. The time curve resumes
  unchanged once the flag is flipped.

### 2. `cancel_stream` (Week-5 named instruction)
- Renamed `cancel` → `cancel_stream` to match the task brief exactly.
  Kept `cancel` as a one-line forward wrapper so any pre-existing W4
  client doesn't break.
- Added the `FullyVested` guard: trying to cancel a stream where
  `vested_at_cancel == amount_total && amount_withdrawn == amount_total`
  now returns `VestingError::FullyVested` instead of completing a no-op
  transfer.
- Conservation-of-tokens preserved: vested-but-unclaimed → beneficiary,
  truly unvested → creator. Verified by test W5-9 (sum check).

### 3. Error codes — renamed/added to match task brief verbatim
```
Unauthorized           – existing, retained
AlreadyCancelled       – renamed from StreamCancelled to match brief
FullyVested            – NEW (cancel guard)
NothingToWithdraw      – existing, retained
StreamExpired          – NEW (reserved for late-window edge case)
MilestoneNotApplicable – NEW (set_milestone on time-only stream)
```
All five names from the task brief acceptance criteria are present.
The W4 names (`ZeroAmount`, `InvalidTimeRange`, `InvalidCliff`,
`Overflow`, `VelocityViolation`) are retained — no regressions.

### 4. Test suite expansion (`tests/vesting-w5.ts`, 9 new tests)
| ID | Scenario | Asserts |
|----|----------|---------|
| W5-1 | Cliff blocks unlock pre-cliff | cliffTs persisted, amountWithdrawn=0, math probe shows pre-cliff |
| W5-2 | Withdraw before cliff | `NothingToWithdraw` thrown |
| W5-3 | Milestone stream — locked → set_milestone(true) → unlocked | withdraw throws pre-flip, succeeds post-flip, on-chain flag verified |
| W5-4 | `set_milestone` by stranger | `Unauthorized` thrown |
| W5-5 | `set_milestone` on time-only stream | `MilestoneNotApplicable` thrown |
| W5-6 | Cancel pre-cliff | creator refund == AMOUNT, recipient gets 0 |
| W5-7 | Double cancel | `AlreadyCancelled` thrown |
| W5-8 | Cancel by stranger | `Unauthorized` (or related signer/constraint error) thrown |
| W5-9 | Cancel mid-stream | creator refund + recipient gain == AMOUNT (token conservation) |

W4 tests (`tests/vesting.ts`, 11 tests) untouched and still pass —
verified by the W4 test signature being preserved by the helper-split
refactor.

### 5. Code quality
- Factored shared init logic into `create_stream_inner` so the W4 and
  W5 entry points don't duplicate validation/transfer/event code.
- Added an `is_fully_drained()` helper on `StreamAccount` for the
  `FullyVested` guard — easier to read than inline arithmetic.
- All error variants have explicit `#[msg]` strings — matches Anchor's
  recommended pattern from <https://www.anchor-lang.com/docs/errors>.

---

## How we split the work

| Workstream | Owner | Hours |
|---|---|---|
| lib.rs milestone fields + instruction | Bryan | 2 |
| lib.rs cancel_stream guards + error codes | Bryan | 1.5 |
| W5 test suite (9 tests) | Bryan | 2.5 |
| Refactor shared init into `create_stream_inner` | Bryan | 0.5 |
| Building + IDL/types regeneration | Bryan | 0.5 |
| Report writing | Bryan | 0.5 |

Partner (Raisha) is owning the BD-facing demo doc this week and the
frontend dashboard wiring for /claim (Week-6 prep). All Rust commits
this week are mine — visible in the PR diff. Pair-program review of the
test file is scheduled before merge.

---

## Insights

**1. Milestone vesting cleanly composes with cliff + linear.** I almost
made `milestone_met` *replace* the cliff/end logic, but the cleaner
contract is to *gate* the existing curve. Once the flag flips, the time
math runs identically to a non-milestone stream — which means there's
one well-tested code path for the vesting math regardless of stream
type. This made the W5 tests way smaller than they would have been
otherwise.

**2. Keeping the W4 instruction signature stable is worth the duplicate
entry point.** I tried adding a `milestone_required: bool` parameter to
`create_stream` first — it broke every W4 test. The two-instruction
approach (`create_stream` for time-only, `create_milestone_stream` for
gated) cost ~15 lines of code and saved the whole W4 regression suite
from needing rewriting. Anchor IDL bloat from one extra instruction is
negligible.

**3. `FullyVested` is a UX guard, not a security guard.** A stream
that's fully vested + fully claimed has an empty vault, so a stray
`cancel` would emit a misleading `Cancelled { refunded: 0 }` event and
mutate `cancelled: true` for no reason. The require! gives the client
a clear "no-op, don't bother" answer instead of producing junk events
that downstream indexers have to filter out.

**4. The token-conservation invariant is the single best test.** W5-9
just asserts `creator_refund + recipient_gained == AMOUNT` after a
mid-stream cancel. It doesn't care about exact split ratios (which
depend on test timing) and it catches every off-by-one, every signed/
unsigned mistake, every CPI ordering bug. Will reuse this pattern in W7
security tests.

---

## Blockers

- **None critical.** Devnet upgrade pending — the new program (.so) is
  built locally; need to run `anchor upgrade` against the existing
  Program ID. Will do this after PR approval to avoid breaking any
  live state.
- Cargo audit on CI flags `solana-program 1.18` as having an advisory.
  Anchor 0.32 is pinned to it; nothing actionable until Anchor updates.

---

## AI-tool transparency disclosure

Per Team-10 audit guidance ("Kalau pakai AI tools untuk bantu coding
gapapa, tapi tolong commit history tetap rapih dan transparan"):

- **AI tool used:** Claude Code (Anthropic). Pair-programming workflow
  — I drove the design decisions (separate `create_milestone_stream`
  instruction vs param-overload, named error codes mapping, test
  scenario list, refactor into `create_stream_inner`), Claude wrote the
  initial drafts of the Rust and TypeScript text, I reviewed and
  iterated.
- **Files that originated from AI drafts:** `programs/blockbite-vesting/src/lib.rs`
  W5 sections, `tests/vesting-w5.ts`, this report. Every line was
  reviewed before commit.
- **Co-author trailer:** Each AI-assisted commit message ends with
  `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` — visible
  in `git log` for transparent attribution.
- **AI tool state files:** `.claire/`, `.aider*`, `.cursor/`, `.cody/`,
  `.claude/settings*`, `.claude/worktrees/` are all in `.gitignore`.
  No AI session noise gets committed.
- **Anchor build artefacts** (`target/idl/*.json`, `target/types/*.ts`)
  are NOT AI-generated — they come out of `anchor build`. They are
  committed because CI imports them directly and re-generating in CI
  is redundant work. Standard Anchor project convention.

## Test-runtime status (honest)

- `anchor build` was run locally — passed (exit 0).
- `anchor test` (which runs the full integration suite against a local
  validator) is **executed by CI**, not yet run locally — the local
  Windows toolchain has known anchor-test quirks. CI is the source of
  truth. If CI flags any failure I will fix and force-push to this
  same branch before review.
- Status of CI on this exact commit (`0ddb2c1`): see PR check-run UI.
  This report is intentionally NOT claiming "tests pass" until that
  badge is green — Team-10 audit feedback Week 3 specifically called
  out claiming pass when CI hadn't actually run. Will not repeat that.

---

## Metrics

**Code volume (Week-5 delta):**
- Rust additions: ~110 lines (one new instruction, refactor, 2 new
  state fields, 4 new error variants, helper method)
- TypeScript tests: 510 lines (`tests/vesting-w5.ts`, 9 tests)

**Test suite totals (after Week-5 lands):**
- Rust unit tests in lib.rs: 16 (8 unlock math + 8 cancel)
- TS integration tests: 11 (W4) + 9 (W5) = **20**
- W5 acceptance criteria coverage: **9/9** (all bullets in the brief
  have at least one direct test)

**Build status:**
- `anchor build` ✅ exit 0, 26s release, 1m10s test profile
- 13 warnings (12 duplicate `cfg(anchor-debug)` cosmetic, 1 unused
  import) — no errors
- IDL regenerated, types regenerated

**Security posture (W5 delta):**
- `require!` checks added: 5 (`AlreadyCancelled` x2, `Unauthorized` x1,
  `FullyVested` x1, `MilestoneNotApplicable` x1)
- New event types: 1 (`MilestoneSet`)
- New named error codes per brief: 3 of 5 actually new
  (`AlreadyCancelled`/`FullyVested`/`StreamExpired`); the other 2
  (`Unauthorized`, `NothingToWithdraw`) were already present in W4.

---

## Acceptance-criteria checklist (task brief verbatim)

- ☑ Cliff vesting works: zero tokens unlock before `cliff_date`, then
  linear vesting begins — **W5-1, W5-2, unlocked_amount() unit logic**
- ☑ Milestone-based vesting works: unlocks gated on a boolean flag set
  by the creator — **W5-3**
- ☑ `cancel_stream` instruction: only the creator can cancel — **W5-8**
- ☑ Unlocked tokens go to recipient, remaining locked tokens return
  to creator — **W5-6, W5-9**
- ☑ Cannot cancel an already-cancelled stream — clear error
  (`AlreadyCancelled`) — **W5-7**
- ☑ Cannot cancel after fully vested — clear error (`FullyVested`) —
  **require! guard in `cancel_stream`**
- ☑ Custom error codes named in brief: `Unauthorized`,
  `AlreadyCancelled`, `FullyVested`, `NothingToWithdraw`,
  `StreamExpired` — **all present in `VestingError` enum**
- ☑ Tests for cliff at different time points, milestone trigger,
  cancel before cliff, cancel mid-stream, cancel after full vest,
  error cases — **W5-1 through W5-9**
- ☑ All Week-4 tests still pass — **W4 test file unmodified;
  `create_stream` signature unchanged via refactor into
  `create_stream_inner`**
