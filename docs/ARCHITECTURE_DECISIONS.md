# Architecture Decision Records — BLOCKBITE TDP

> Format: ADR-NNN | Title | Status | Date

---

## ADR-001 — TDP as Primary Product, Game as Oracle Plugin

**Status:** Accepted
**Date:** 2026-05-21
**Author:** Bryan Nayrbry

### Context

The initial project framing was a GameFi product — a puzzle game where players earn token rewards. The judge (Hakim) flagged that the Token Distribution Protocol (TDP) was being treated as secondary. Sablier-style protocols have proven product-market fit on Ethereum. Solana has no composable oracle-aware vesting standard.

### Decision

Reposition the product as a **Token Distribution Protocol (TDP) first**. The game becomes the default proof-of-activity oracle — one possible input to the TDP — not the primary product.

- TDP contract: `programs/blockbite-vesting/src/lib.rs`
- Game: `app/game/page.tsx` and `/api/session/*` routes

### Consequences

- **Positive:** TDP is the investable/scalable component. Any DAO, startup, or fund can use it without touching the game.
- **Positive:** Composable oracle design — projects bring their own oracle (game, DAO vote, admin key).
- **Negative:** Existing game UI/UX remains, but must be described as "one oracle plugin" not "the product."
- **Rule:** No code is deleted. Game design stays. Only the positioning and documentation changes.

### Alternatives Considered

- Keep game as product, TDP as backend: rejected by judge
- Build two separate contracts: unnecessary — `required_tier = 0` makes the TDP game-independent already

---

## ADR-002 — UncheckedAccount for proof_cache in Withdraw

**Status:** Accepted
**Date:** 2026-05-21
**Author:** Bryan Nayrbry

### Context

The `withdraw()` instruction must check the player's `ProofCache` PDA when `required_tier > 0`, but when `required_tier = 0` the ProofCache may not exist at all. Anchor's typed `Account<'info, ProofCache>` constraint with `seeds` validation would fail account validation if the account doesn't exist.

### Decision

Use `UncheckedAccount<'info>` for `proof_cache` in the `Withdraw` accounts struct, with a `/// CHECK:` comment. Manual deserialization occurs inside the handler, gated by `required_tier > 0`.

```rust
/// CHECK: manually deserialized and validated in handler
pub proof_cache: UncheckedAccount<'info>,
```

Callers pass `SystemProgram.programId` as a safe dummy when `required_tier = 0`.

### Consequences

- **Positive:** Single instruction handles both gated and ungated streams without duplicating the account struct.
- **Positive:** No account initialization cost for streams that don't need the oracle.
- **Negative:** The `/// CHECK:` comment requires careful review — misuse would bypass the milestone gate.
- **Invariant:** The check `if ctx.accounts.stream.required_tier > 0 { deserialize + verify }` must never be removed without replacing it with an equivalent guard.

### Alternatives Considered

- Two separate `withdraw` instructions (with/without gate): rejected — doubles the API surface
- Optional account type: not available in Anchor 0.32 — would need custom deserialization anyway
- Init ProofCache at stream creation: unnecessary overhead for `required_tier = 0` users

---

## ADR-003 — stream_id as PDA Seed (Not beneficiary)

**Status:** Accepted
**Date:** 2026-05-21
**Author:** Bryan Nayrbry

### Context

The StreamAccount PDA must be unique per stream. Two obvious seed strategies:
1. `["stream", authority, beneficiary]` — enforces one stream per (creator, beneficiary) pair
2. `["stream", authority, stream_id_le8]` — allows multiple streams per (creator, beneficiary) pair

### Decision

Use `stream_id: u64` (8-byte LE) as the second seed component:
```
stream PDA seeds: ["stream", authority.key(), stream_id.to_le_bytes()]
vault  PDA seeds: ["vault",  authority.key(), stream_id.to_le_bytes()]
```

The creator picks the `stream_id` at call time. Calling `create_stream` twice with the same `stream_id` would fail (PDA already exists). Using different IDs creates two independent streams.

### Consequences

- **Positive:** Creator can have N parallel streams to the same beneficiary (e.g., cliff tranche + milestone tranche).
- **Positive:** DAO can create one stream per member without needing unique creator keypairs.
- **Negative:** The `stream_id` is caller-controlled — a creator can collide IDs intentionally (self-DoS only, not a security issue since only their own stream would fail to initialize).
- **Integration note:** TypeScript clients must pass `stream_id` consistently when deriving PDAs. Use `streamId.toArrayLike(Buffer, "le", 8)` for correct byte encoding.

### Alternatives Considered

- `["stream", authority, beneficiary]`: rejected — prevents multiple tranches to same beneficiary
- Auto-incrementing counter on-chain: adds a state account just for the counter; unnecessary

---

## ADR-004 — u128 Intermediate Arithmetic in unlocked_amount()

**Status:** Accepted
**Date:** 2026-05-20
**Author:** Bryan Nayrbry

### Context

The unlock formula is:
```
unlocked = amount_total * (t - start_ts) / (end_ts - start_ts)
```

If `amount_total` and `elapsed` are both `u64`, their product can overflow. Example: `u64::MAX * u64::MAX` wraps to 0, producing silently incorrect results without overflow protection.

### Decision

Cast both operands to `u128` before multiplication:

```rust
let elapsed  = (now - self.start_ts) as u128;
let duration = (self.end_ts - self.start_ts) as u128;
((self.amount_total as u128 * elapsed) / duration) as u64
```

`u128::MAX = 3.4 × 10^38`, which is safe for any realistic `amount_total × elapsed` product. The final cast to `u64` truncates back to token precision, which is the correct floor behavior.

### Consequences

- **Positive:** No overflow for any token supply up to `u64::MAX` (~1.8 × 10^19 raw units).
- **Positive:** Floor division (Rust integer division) is the correct behavior — users can only withdraw whole units.
- **Negative:** Slightly more expensive than `u64` arithmetic on Solana BPF; negligible in practice.
- **Invariant:** The cast `as u64` at the end must never be removed — `u128` result could exceed `u64::MAX` if the division was skipped.

### Alternatives Considered

- `checked_mul` returning `Option`: requires propagating errors through a pure function; u128 upcasting is simpler and sufficient
- Fixed-point arithmetic libraries: unnecessary complexity for a division-based formula

---

## ADR-005 — init_if_needed for ProofCache (VGPV State Persistence)

**Status:** Accepted
**Date:** 2026-05-21
**Author:** Bryan Nayrbry

### Context

The `update_proof` instruction writes a player's activity tier to `ProofCache`. VGPV requires the `velocity_strikes` counter and `last_proof_ts` to persist across multiple `update_proof` calls for the same `(stream, player)` pair.

Two options:
1. `init` — requires the PDA to not exist; admin must pre-create ProofCache separately
2. `init_if_needed` — creates the PDA on first call, reuses on subsequent calls

### Decision

Use `init_if_needed` with the `init-if-needed` feature flag in `Cargo.toml`:

```rust
#[account(
    init_if_needed,
    payer = admin,
    space = 8 + ProofCache::LEN,
    seeds = [b"proof_cache", stream.key().as_ref(), player.key().as_ref()],
    bump,
)]
pub proof_cache: Account<'info, ProofCache>,
```

The `is_new` check (`cache.player == Pubkey::default()`) distinguishes first-time initialization from updates:
- First call: sets all fields, skip VGPV check (no previous timestamp)
- Subsequent calls: VGPV check applies using `last_proof_ts`

### Consequences

- **Positive:** Single instruction handles both ProofCache creation and updates.
- **Positive:** Admin doesn't need to pre-initialize accounts per player.
- **Negative:** `init_if_needed` has a known footgun: if called by an attacker with crafted seeds, it could reinitialize accounts. Mitigated here by: (a) admin-only signer check, (b) seeds include `stream.key()` (PDA not guessable without stream access).
- **Invariant:** The `is_new` check must remain. Removing it would reset VGPV state on every call, defeating bot detection.

---

## ADR-006 — CEI Pattern in cancel() and withdraw()

**Status:** Accepted
**Date:** 2026-05-20
**Author:** Bryan Nayrbry

### Context

Both `cancel()` and `withdraw()` transfer tokens via CPI to the SPL Token program. In EVM, re-entrancy is a common attack vector. Solana's execution model prevents re-entrancy at the runtime level (no cross-program re-entrancy within the same transaction), but following CEI is best practice and required for the Week 7 security audit.

### Decision

Enforce Checks-Effects-Interactions (CEI) ordering in all state-mutating instructions:

**withdraw():**
```rust
// 1. CHECKS: signer, cancelled, cliff, milestone gate, available > 0
// 2. EFFECTS: stream.amount_withdrawn += available; stream.last_action_ts = now
// 3. INTERACTIONS: token::transfer(vault → beneficiary_ata)
```

**cancel():**
```rust
// 1. CHECKS: signer == authority, not cancelled, not fully vested
// 2. EFFECTS: stream.cancelled = true  ← set flag BEFORE any transfer
// 3. INTERACTIONS: token::transfer(vault → beneficiary_ata); token::transfer(vault → authority_ata)
```

Setting `stream.cancelled = true` before CPI calls means any reentrancy attempt would hit `StreamCancelled` on re-entry (if Solana ever allows it).

### Consequences

- **Positive:** Audit-clean code that survives Week 7 security review.
- **Positive:** State is consistent even if a CPI call fails mid-execution (Solana reverts the entire transaction atomically).
- **No downside:** CEI has no performance penalty.

---

## ADR Summary Table

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | TDP #1, Game is oracle plugin | Accepted |
| ADR-002 | UncheckedAccount for proof_cache in Withdraw | Accepted |
| ADR-003 | stream_id as PDA seed (not beneficiary) | Accepted |
| ADR-004 | u128 intermediate arithmetic in unlocked_amount() | Accepted |
| ADR-005 | init_if_needed for ProofCache VGPV state | Accepted |
| ADR-006 | CEI pattern in cancel() and withdraw() | Accepted |
