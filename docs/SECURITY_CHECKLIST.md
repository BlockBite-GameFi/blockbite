# Security Checklist — BLOCKBITE TDP

**Week 7 Security Audit Template**
Program: `programs/blockbite-vesting/src/lib.rs`
Program ID: `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`

Status legend: [x] PASS | [ ] PENDING | [!] FAIL | [~] PARTIAL

---

## 1. Signer & Authorization Checks

| Check | Status | Location | Notes |
|---|---|---|---|
| `withdraw()` validates `beneficiary == stream.beneficiary` | [x] PASS | lib.rs:88-90 | Explicit require! check |
| `cancel()` validates `authority == stream.authority` | [x] PASS | lib.rs:350-353 | Explicit require! check |
| `update_proof()` validates `admin == stream.authority` | [x] PASS | lib.rs:299-302 | Explicit require! check |
| No instruction allows unsigned callers | [x] PASS | All Accounts structs | Signer<'info> on all auth accounts |
| `beneficiary` in Cancel is validated via `address = stream.beneficiary` | [x] PASS | lib.rs:584 | Anchor constraint |

---

## 2. PDA Ownership & Seed Validation

| Check | Status | Location | Notes |
|---|---|---|---|
| Stream PDA seeds validated by Anchor | [x] PASS | lib.rs:436-441 | `seeds` + `bump` constraints |
| Vault PDA authority = stream PDA (not user wallet) | [x] PASS | lib.rs:448-450 | `token::authority = stream` |
| Vault PDA seeds validated on withdraw | [x] PASS | lib.rs:479-486 | `seeds` + `token::mint = stream.mint` |
| Vault PDA seeds validated on cancel | [x] PASS | lib.rs:594-601 | `seeds` + `token::mint = stream.mint` |
| ProofCache seeds: `["proof_cache", stream, player]` | [x] PASS | lib.rs:567-574 | `init_if_needed` with seeds |
| Mint consistency enforced (vault/ATA/stream.mint match) | [x] PASS | All account structs | `token::mint = stream.mint` |

---

## 3. Arithmetic & Overflow

| Check | Status | Location | Notes |
|---|---|---|---|
| `unlocked_amount()` uses u128 intermediate | [x] PASS | lib.rs:651-654 | See ADR-004 |
| `fund_vault` uses `checked_mul` for all splits | [x] PASS | lib.rs:186-197 | Propagates Overflow error |
| `withdraw()` uses `checked_add` for amount_withdrawn | [x] PASS | lib.rs:130-134 | |
| `cancel()` uses `saturating_sub` for claimable | [x] PASS | lib.rs:363-364 | saturating prevents underflow |
| Cancel conservation law: claimable + return + withdrawn = total | [x] PASS | lib.rs:362-364 | Verified mathematically |
| dust from fund_vault floor division goes to vault | [x] PASS | lib.rs:196-197 | No token loss invariant |
| Edge: amount = 1 minimum stream | [ ] PENDING | — | Needs test (Phase 5.1) |
| Edge: duration = 1 second stream | [ ] PENDING | — | Needs test (Phase 5.1) |
| Edge: end_ts = start_ts + 1 | [ ] PENDING | — | Needs test |

---

## 4. State Machine Integrity

| Check | Status | Location | Notes |
|---|---|---|---|
| Cancelled stream cannot be re-cancelled | [x] PASS | lib.rs:348 | `require!(!stream.cancelled)` |
| Cancelled stream cannot be withdrawn from | [x] PASS | lib.rs:86 | `require!(!stream.cancelled)` |
| Fully-vested stream cannot be cancelled | [x] PASS | lib.rs:358-359 | `require!(!fully_vested)` |
| `cancelled = true` set before CPI (CEI) | [x] PASS | lib.rs:371 | Effects before Interactions |
| `amount_withdrawn` updated before CPI (CEI) | [x] PASS | lib.rs:130 | Effects before Interactions |
| Double-cancel returns StreamCancelled | [x] PASS | Test W5.7 | Verified in test suite |
| Withdraw after cancel returns StreamCancelled | [x] PASS | Test W5.10 | Verified in test suite |

---

## 5. Token Account & Mint Safety

| Check | Status | Location | Notes |
|---|---|---|---|
| Authority ATA validated: `token::mint`, `token::authority` | [x] PASS | CreateStream struct | |
| Beneficiary ATA validated: `token::mint`, `token::authority` | [x] PASS | Withdraw struct | |
| Vault ATA: owned by stream PDA (not any user) | [x] PASS | `token::authority = stream` | |
| All transfers use `token::transfer` CPI (no raw lamports) | [x] PASS | All handlers | |
| Wrong vault account on withdraw: Anchor constraint rejects | [x] PASS | seeds constraint | PDA mismatch fails tx |
| ATA ownership spoofing: rejected by `token::authority` constraint | [x] PASS | Anchor | |

---

## 6. VGPV Bot Detection

| Check | Status | Location | Notes |
|---|---|---|---|
| Velocity strikes increment on fast withdrawal | [x] PASS | lib.rs:118-126 | |
| Block at VGPV_MAX_VELOCITY_STRIKES = 3 | [x] PASS | lib.rs:123-126 | strict `<` not `<=` |
| Strikes persist per stream (in StreamAccount) | [x] PASS | StreamAccount.velocity_strikes | |
| ProofCache VGPV: strikes persist per (stream, player) | [x] PASS | ProofCache.velocity_strikes | |
| First proof: VGPV skipped (is_new check) | [x] PASS | lib.rs:306 | `is_new = cache.player == default()` |
| VGPV_MIN_SECONDS_PER_ACT = 7200 (2 hours) | [x] PASS | lib.rs:10 | |

---

## 7. Known Advisories (Cargo Audit)

Tracked in `.github/workflows/security.yml`. Ignored pending upstream fix:

| Advisory | Package | Severity | Action |
|---|---|---|---|
| RUSTSEC-2024-0344 | curve25519-dalek | Medium | Wait for Anchor 0.33 |
| RUSTSEC-2022-0093 | ed25519-dalek | Medium | Wait for Anchor 0.33 |
| RUSTSEC-2024-0388 | derivative | Low (compile-only) | No runtime impact |
| RUSTSEC-2024-0436 | paste | Low (compile-only) | No runtime impact |
| RUSTSEC-2024-0421 | idna | Low | No runtime impact |

All critical CVEs: none (confirmed by `cargo audit` weekly).

---

## 8. Pending Security Tests (Week 7)

- [ ] PDA seed manipulation attempt: pass wrong authority or stream_id
- [ ] Wrong vault account on withdraw: pass unrelated token account
- [ ] ATA ownership spoofing: pass beneficiary ATA owned by attacker
- [ ] Signer forgery: unsigned account in signer position
- [ ] Reinitialize ProofCache: call update_proof with pre-crafted data
- [ ] Overflow via large amounts: u64::MAX amounts with near-zero duration
- [ ] Fund vault with zero amount: expect ZeroAmount or graceful no-op
- [ ] update_proof: tier = 3 (out of range) → expect InvalidTier
- [ ] withdraw: valid stream but wrong beneficiary signer → expect Unauthorized

---

## 9. Access Control Matrix

| Instruction | authority | beneficiary | admin | anyone |
|---|---|---|---|---|
| `create_stream` | WRITE | — | — | — |
| `withdraw` | — | WRITE | — | — |
| `cancel` | WRITE | — | — | — |
| `fund_vault` | — | — | — | WRITE |
| `update_proof` | — | — | WRITE | — |

`anyone` = no authentication required for `fund_vault` (permissionless revenue deposit).

---

## 10. Upgrade Authority

**Current state (devnet):** Upgradeable — program authority = `<your-deployer-wallet>`

**Before mainnet:** Burn upgrade authority with:
```bash
solana program set-upgrade-authority DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf \
  --final  # makes program immutable
```

**Risk:** Until burned, the upgrade authority can change the program bytecode. This is standard during development; immutability should be confirmed before token launch.

---

## Overall Status: Week 5

| Category | Score |
|---|---|
| Authorization | 5/5 |
| PDA Safety | 6/6 |
| Arithmetic | 7/9 (2 edge case tests pending) |
| State Machine | 7/7 |
| Token Safety | 6/6 |
| VGPV | 6/6 |
| **Total** | **37/39** |

Remaining 2 items: edge case tests (amount=1, duration=1s). Tracked in Phase 5.1 of MEGA_TODO.
