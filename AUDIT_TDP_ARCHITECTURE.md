# AUDIT: BlockBite Token Distribution Protocol — Week 5 Architecture Review
> Generated: 2026-05-21 | Due: 2026-05-23 | Auditor: Claude Sonnet 4.6

---

## VERDICT KILAT (1 Liner — Bisa dibaca siapapun, dari ibu rumah tangga sampai Solana core dev)

**Untuk orang awam:** BlockBite adalah bank pintar berbasis blockchain yang mengunci hadiah token kamu dalam brankas digital — brankas hanya terbuka setelah kamu menunggu 3 hari (Cliff) DAN membuktikan kamu manusia asli bukan bot dengan menyelesaikan level game (Milestone), lalu uangnya keluar tetes demi tetes per detik (Linear) — bukan sekaligus — biar harga token tidak jatuh.

**Untuk hardcore dev / judge Mancer:** Solana Anchor program implementing 3-tier token distribution: `create_stream(cliff_ts, end_ts)` → time-gated PDA lock → `update_proof(tier_reached)` writes ProofCache boolean gate → `withdraw()` computes `unlocked_amount(now) = amount_total × min(1, (now - start_ts) / (end_ts - start_ts))` with cliff guard — with VGPV anti-bot velocity gate (2hr minimum per action, max 3 strikes), `cancel()` CEI pattern splitting vested→beneficiary + unvested→creator atomically, and `fund_vault()` doing 70/15/10/5 revenue split in a single on-chain transaction.

---

## PIVOT DIRECTION — Paragraf Jelas untuk Semua Kalangan

**Kemana pivot yang benar dan mengapa?**

Selama ini BlockBite diposisikan sebagai "game yang memberi reward." Hakim menginginkan kebaliknya: **TDP (Token Distribution Protocol) yang menggunakan game sebagai oracle verifikasi manusia.** Bayangkan Sablier di Ethereum — Sablier bukan game, Sablier adalah infrastruktur pembayaran token yang bisa dipakai siapapun: startup, DAO, investor, tim. BlockBite harus menjadi Sablier-nya Solana, dengan keunggulan tambahan: milestone oracle-nya adalah game puzzle (bukan sekadar boolean yang di-set manual). Artinya siapapun yang deploy protokol ini mendapat anti-bot protection secara gratis lewat mekanisme game. Game tetap ada, tidak dihapus — tapi game turun jabatan dari "produk utama" menjadi "plugin verifikasi Proof-of-Activity." Core produk yang dijual ke BD team, ke investor, ke startup Solana adalah: **protokol distribusi token yang fleksibel (Cliff + Milestone + Linear + Cancel) dengan on-chain anti-bot proof built-in**. Game adalah nilai tambah yang membedakan dari Sablier, bukan nilai utamanya.

---

## AUDIT SARAN EKSTERNAL: 3-Tier Vesting Architecture

### A. Tabel Evaluasi Setiap Saran

| Komponen Saran | Valid? | Alignment dengan Judge | Status di Kode Saat Ini | Keputusan |
|---|---|---|---|---|
| Cliff Phase (3 hari lock awal) | VALID | Exact match Week 5 criteria | IMPLEMENTED (`cliff_ts` in `create_stream`) | AMBIL |
| Milestone = game level 10/30/50 | PARTIAL | Judge minta "boolean flag by creator" bukan hardcode level | ProofCache stores `tier_reached` (0/1/2) | AMBIL tapi generalisasi: tier bukan level hardcode |
| Linear streaming per detik | VALID | Core requirement Week 4 yang sudah selesai | IMPLEMENTED (`unlocked_amount`) | AMBIL |
| Anti-bot via game (Sybil resistance) | VALID | Nilai tambah unik, bukan requirement eksplisit tapi diapresiasi | VGPV implemented | AMBIL |
| Anti-dumping via linear release | VALID | Sesuai desain TDP | Inherent dalam linear vesting | AMBIL |
| Milestone gate withdrawal | PARTIAL | Judge minta milestone mode TERPISAH, bukan hanya precondition | TIDAK diimplementasi — ProofCache tidak gate withdraw | PERLU TAMBAH |
| Game sebagai mandatory gate | BAHAYA | Judge minta game = optional engagement layer | Game CPI belum ada (Week 6) | JANGAN hardcode — biarkan optional |
| startLinearStream() terpisah | TIDAK PERLU | Judge minta satu stream dengan parameter cliff+milestone | Sudah di `create_stream` + `update_proof` | SKIP — arsitektur sudah lebih baik |
| registerUser() terpisah | TIDAK PERLU | Anchor account init sudah handle ini | Stream PDA init = registration | SKIP |

### B. Yang Benar dari Saran Eksternal

1. Analogi "Celengan Digital" untuk orang awam — BAGUS, pakai
2. 3 fase (Cliff → Milestone → Linear) sebagai narrative — VALID
3. Anti-bot melalui proof-of-activity — UNIK, jadikan selling point
4. Perhitungan matematis (R = tokens/seconds) — BENAR, sudah dalam kode

### C. Yang Salah / Perlu Dikoreksi

1. Game milestone HARDCODE ke level 10/30/50 — SALAH: hakim minta generic boolean flag
2. "startLinearStream() dipanggil terpisah" — SALAH: seharusnya stream sudah exist, milestone hanya membuka gate
3. Milestone 20%+30%+50% allocation split — VALID sebagai use case tapi jangan hardcode di protocol layer
4. MetaMask disebutkan — SALAH: ini Solana, bukan EVM. Pakai Phantom/Solflare

---

## FLOWCHART 1: Overall System Architecture (TDP as Primary)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║          BLOCKBITE TOKEN DISTRIBUTION PROTOCOL — SYSTEM OVERVIEW            ║
║                    (TDP #1 Priority | Game = Plugin Layer)                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

    CREATOR (Startup/DAO/Team)                    BENEFICIARY (Employee/Investor)
           │                                                  │
           ▼                                                  │
    ┌─────────────────┐                                       │
    │  create_stream  │ ◄── Parameters:                       │
    │                 │     - amount (tokens to lock)         │
    │  PDA: "stream"  │     - start_ts (unix timestamp)       │
    │  + "vault"      │     - cliff_ts (0 = no cliff)         │
    │  (init on-chain)│     - end_ts (vesting end)            │
    └────────┬────────┘     - stream_id (u64, unique)         │
             │                                                 │
             │ Tokens locked in PDA vault                     │
             ▼                                                 │
    ┌─────────────────────────────────────────────────────────┤
    │                  STREAM STATE (PDA)                     │
    │  authority, beneficiary, mint, amount_total,            │
    │  amount_withdrawn, start_ts, cliff_ts, end_ts,          │
    │  cancelled=false, velocity_strikes=0, last_action_ts    │
    └─────────────────────────────────────────────────────────┘
             │                              │
             │                             ▼
             │                   ┌──────────────────────┐
             │                   │   update_proof()     │ ◄── Called by:
             │                   │                      │     - Admin (Week 5)
             │                   │   ProofCache PDA:    │     - Game CPI (Week 6+)
             │                   │   tier_reached = 0/1/2     
             │                   │   velocity_strikes   │     Milestone conditions:
             │                   │   last_proof_ts      │     tier 0 = no milestone
             └──────────────────►│                      │     tier 1 = KPI 1 met
                                 └──────────────────────┘     tier 2 = KPI 2 met
                                          │
                                          ▼
                                 ┌──────────────────────┐
                                 │      withdraw()      │ ◄── BENEFICIARY calls
                                 │                      │
                                 │  1. check !cancelled │
                                 │  2. check authorized │
                                 │  3. VGPV check       │
                                 │  4. calc unlocked    │
                                 │  5. transfer tokens  │
                                 └──────────────────────┘
                                          │
                                          ▼
                               BENEFICIARY WALLET RECEIVES
                               vested tokens (gradual stream)


    ┌─────────────────────────────────────────────────────────────┐
    │  PARALLEL PATH: fund_vault() — Revenue Split (Atomic)      │
    │                                                             │
    │  FUNDER deposits 100 tokens →                              │
    │    70 tokens → Stream Vault (compounds prize pool)         │
    │    15 tokens → Team Wallet (operations)                    │
    │    10 tokens → Dev Wallet (protocol dev)                   │
    │     5 tokens → Referral Wallet (optional)                  │
    │  ALL IN ONE TRANSACTION — atomic, all-or-nothing           │
    └─────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────┐
    │  EMERGENCY PATH: cancel() — Creator Revokes Stream         │
    │                                                             │
    │  Creator calls cancel() →                                  │
    │    vested_at_cancel = unlocked_amount(now)                 │
    │    claimable = vested_at_cancel - amount_withdrawn         │
    │    return_to_creator = amount_total - vested_at_cancel     │
    │                                                             │
    │    claimable tokens → beneficiary_ata                      │
    │    unvested tokens  → creator_ata                          │
    │    stream.cancelled = true (permanent)                     │
    └─────────────────────────────────────────────────────────────┘
```

---

## FLOWCHART 2: unlocked_amount() Mathematics — Complete Decision Tree

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              LINEAR VESTING WITH CLIFF — MATHEMATICAL CORE                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

INPUT: now (unix timestamp), StreamAccount { cliff_ts, start_ts, end_ts, amount_total }

                    ┌─────────────────┐
                    │   now < cliff_ts│
                    │   (cliff active)│
                    └────────┬────────┘
                             │
                    YES ─────┴───── NO
                     │               │
                     ▼               ▼
              RETURN 0         ┌─────────────────┐
          (cliff not          │  now >= end_ts  │
            expired)         │  (fully vested) │
                              └────────┬────────┘
                                       │
                              YES ─────┴───── NO
                               │               │
                               ▼               ▼
                       RETURN              ┌───────────────────────────────────┐
                     amount_total          │  LINEAR INTERPOLATION             │
                     (100% vested)         │                                   │
                                           │  elapsed  = now - start_ts        │
                                           │  duration = end_ts - start_ts     │
                                           │                                   │
                                           │  unlocked = (amount_total u128    │
                                           │             × elapsed u128)       │
                                           │             ÷ duration u128       │
                                           │                                   │
                                           │  cast back to u64                 │
                                           │  (u128 prevents overflow on       │
                                           │   large token amounts × time)     │
                                           └───────────────────────────────────┘

FORMULA:
  unlocked(t) = amount_total × max(0, min(1, (t - start_ts) / (end_ts - start_ts)))
                with cliff gate: if t < cliff_ts → 0

RATE (tokens per second):
  R = amount_total / (end_ts - start_ts)

BOB SIMULATION (from external proposal):
  amount_total  = 200 TOKEN (20% of 1000, Milestone 1)
  start_ts      = T₀
  cliff_ts      = T₀ + 259_200  (3 days)
  end_ts        = T₀ + 691_200  (3 days + 5 days = 8 days from start)

  Day 1 (t = T₀ + 86400):
    t < cliff_ts  → unlocked = 0

  Day 3 + 1s (t = T₀ + 259201):
    t >= cliff_ts → calculate:
    elapsed  = 259201 (seconds since start)
    duration = 691200 - 0 = 432000 (5 days in seconds)
    unlocked = 200 × (259201 / 432000) = 200 × 0.6 = 120... 
    WAIT — cliff_ts = start_ts + 259200, but end_ts = start_ts + 691200
    So: unlocked at cliff end = 200 × (259200 / 432000) = 120 TOKENS? 
    
    CORRECTION: If start_ts = cliff start, and linear starts from start_ts:
    unlocked at day 3 = 200 × 259200/432000 ≈ 120 TOKEN
    
    ALTERNATIVE (cliff resets linear): set start_ts = cliff_ts for clean 0→linear:
    elapsed  = now - cliff_ts = 1 second
    duration = end_ts - cliff_ts = 432000
    unlocked = 200 × (1 / 432000) ≈ 0.00046296 TOKEN

  Day 4 (24h after cliff ends):
    elapsed  = 86400 seconds
    duration = 432000 seconds
    unlocked = 200 × (86400 / 432000) = 200 × 0.2 = 40 TOKEN ✓ (matches proposal)

  Day 8 (stream ends):
    t >= end_ts → RETURN 200 TOKEN (100% fully vested) ✓

RATE FORMULA VERIFIED:
  R = 200 / 432000 = 0.000462963 TOKEN/second
  R × 86400 = 40 TOKEN/day ✓
```

---

## FLOWCHART 3: Stream State Machine (Complete Lifecycle)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    STREAM STATE MACHINE — ALL TRANSITIONS                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

                         [create_stream()]
                               │
                               ▼
              ┌────────────────────────────────┐
              │     STATE: CLIFF_ACTIVE        │
              │  cancelled = false             │
              │  amount_withdrawn = 0          │
              │  now < cliff_ts                │
              │                                │
              │  withdraw() → returns 0        │
              │  cancel()   → ALLOWED          │
              │  update_proof() → ALLOWED      │
              └─────────────────┬──────────────┘
                                │
                    cliff expires (now >= cliff_ts)
                                │
                                ▼
              ┌────────────────────────────────┐
              │     STATE: STREAMING           │
              │  cancelled = false             │
              │  0 < unlocked < amount_total   │
              │  cliff_ts <= now < end_ts      │
              │                                │
              │  withdraw() → transfers tokens │  ◄── VGPV gate applies here
              │  cancel()   → ALLOWED          │
              │  update_proof() → ALLOWED      │
              └──────┬─────────────────┬───────┘
                     │                 │
         now >= end_ts            cancel() called
                     │                 │
                     ▼                 ▼
    ┌────────────────────────┐  ┌────────────────────────┐
    │  STATE: FULLY_VESTED   │  │  STATE: CANCELLED      │
    │  now >= end_ts          │  │  cancelled = true      │
    │  unlocked = amount_total│  │                        │
    │                        │  │  withdraw() → ERROR    │
    │  withdraw() → ALLOWED  │  │    StreamCancelled      │
    │  cancel() → ERROR !!!  │  │  cancel() → ERROR      │
    │    FullyVested (MISSING)│  │    StreamCancelled     │
    │  update_proof() → ok   │  │                        │
    └────────────────────────┘  └────────────────────────┘
              │                           │
              │                    Already vested → beneficiary
              │                    Unvested → creator (returned)
              │
         beneficiary claims remaining
         amount_withdrawn = amount_total
              │
              ▼
    ┌────────────────────────┐
    │  STATE: SETTLED        │
    │  amount_withdrawn      │
    │    = amount_total      │
    │  vault balance = 0     │
    └────────────────────────┘

MISSING STATE TRANSITION (BUG FOR WEEK 5):
  FULLY_VESTED → cancel() should return VestingError::FullyVested
  Currently: no check for this in cancel() instruction
  FIX NEEDED: add require!(unlocked < stream.amount_total, VestingError::FullyVested)
```

---

## FLOWCHART 4: VGPV Anti-Bot Velocity Gate

```
╔══════════════════════════════════════════════════════════════════════════════╗
║           VELOCITY-GATED PROOF VALIDATION (VGPV) — BOT DETECTION          ║
╚══════════════════════════════════════════════════════════════════════════════╝

  Constants:
    VGPV_MIN_SECONDS_PER_ACT = 7_200  (2 hours minimum between actions)
    VGPV_MAX_VELOCITY_STRIKES = 3     (3 strikes = blocked)

  Applies to: withdraw() + update_proof()

                  User calls withdraw() or update_proof()
                               │
                               ▼
                  ┌────────────────────────┐
                  │  is_new = (last_ts==0) │
                  │  OR first action?      │
                  └──────────┬─────────────┘
                             │
                   YES ──────┴──────── NO
                    │                  │
                    ▼                  ▼
            ALLOW ACTION      elapsed = now - last_action_ts
            (no check on              │
             first action)    ┌───────┴───────────────────────┐
                              │  elapsed < 7200 (2hr minimum) │
                              └───────────┬───────────────────┘
                                          │
                              YES ────────┴──────── NO
                               │                    │
                               ▼                    ▼
                     velocity_strikes++        ALLOW ACTION
                               │             reset last_action_ts = now
                               ▼
                  ┌────────────────────────────────┐
                  │  strikes >= MAX_STRIKES (3)?   │
                  └─────────────┬──────────────────┘
                                │
                   YES ─────────┴──────── NO
                    │                     │
                    ▼                     ▼
             RETURN ERROR           ALLOW ACTION
          VelocityViolation       (logged: 1 or 2 strikes)
          (bot detected,          user gets a warning
           action blocked)        before hard block

  WHY THIS MATTERS:
    A real human takes ≥2 hours to complete a game level.
    A bot could call withdraw() 1000x per second.
    VGPV makes bot attacks economically unviable:
      - Bot pays Solana tx fee on every failed attempt
      - Bot gets blocked after 3 tries within 2hr window
      - Each ProofCache PDA tracks per-(stream, player) independently
```

---

## FLOWCHART 5: cancel() Logic — CEI Pattern + Token Split

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      cancel() INSTRUCTION FLOW                             ║
║                   Checks-Effects-Interactions Pattern                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

  Creator calls cancel(stream_id)
               │
               ▼
  ┌────────────────────────────────────────────────────┐
  │  CHECK 1: !stream.cancelled                        │
  │  → Error: StreamCancelled if already cancelled    │
  └────────────────────────────────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────────────────┐
  │  CHECK 2: caller == stream.authority               │
  │  → Error: Unauthorized if not creator             │
  └────────────────────────────────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────────────────┐
  │  CHECK 3 (MISSING — MUST ADD):                    │  ◄── BUG FOUND
  │  unlocked_amount(now) < amount_total               │
  │  → Error: FullyVested if stream completed         │
  └────────────────────────────────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────────────────┐
  │  COMPUTE SPLIT at now:                            │
  │                                                    │
  │  vested   = unlocked_amount(now)                  │
  │  claimable = vested - amount_withdrawn             │
  │  unvested  = amount_total - vested                 │
  │                                                    │
  │  TIMELINE:                                         │
  │  ─────────────────────────────────────────         │
  │  │ already      │   claimable    │  unvested │     │
  │  │ withdrawn    │   (vested,     │  (RETURN  │     │
  │  │ (already     │   unclaimed)   │  to       │     │
  │  │ paid out)    │   → beneficiary│  creator) │     │
  │  ─────────────────────────────────────────         │
  │  0          amount_withdrawn  vested     amount_total
  └────────────────────────────────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────────────────┐
  │  EFFECTS (STATE CHANGE — before CPI):             │
  │  stream.cancelled = true                           │
  └────────────────────────────────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────────────────┐
  │  INTERACTIONS (CPI — after state change):         │
  │                                                    │
  │  if claimable > 0:                                │
  │    vault → beneficiary_ata (what they earned)     │
  │                                                    │
  │  if unvested > 0:                                 │
  │    vault → creator_ata (what they're taking back) │
  └────────────────────────────────────────────────────┘
               │
               ▼
  emit!(Cancelled { stream, authority, refunded: unvested })

  MATH EXAMPLE (cancel at t = cliff_end + 2 days):
    amount_total    = 1000 TOKEN
    amount_withdrawn = 200 TOKEN (already claimed)
    now             = cliff_end + 172800 (2 days)
    vested          = 1000 × (172800 / 432000) = 400 TOKEN
    claimable       = 400 - 200 = 200 TOKEN → beneficiary
    unvested        = 1000 - 400 = 600 TOKEN → creator
    vault should now be empty: 200 + 600 = 800 = 1000 - 200 ✓
```

---

## FLOWCHART 6: Milestone Gate Architecture (What's Missing + Fix)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║         MILESTONE GATING — CURRENT vs. WHAT JUDGE WANTS                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

  CURRENT (Week 4-5 state):
  ─────────────────────────
  update_proof(tier_reached=1) ──► ProofCache.tier_reached = 1
                                   (stored but NOT checked in withdraw)

  withdraw() ──────────────────────────────────► tokens released
             ↑ does NOT check ProofCache

  Judge requirement: "tokens unlock only when condition met"
  → ProofCache should gate the vesting CALCULATION

  ─────────────────────────────────────────────────────────────
  PROPOSED FIX (Week 5 extension — milestone mode):
  ─────────────────────────────────────────────────────────────

  Option A — Milestone replaces time entirely (boolean unlock):
    unlock = (proof_cache.tier_reached >= required_tier) ? amount_total : 0
    No linear, no cliff — just locked until KPI met

  Option B — Milestone gates entry into linear stream (3-tier):
    withdraw() checks:
      1. !cancelled
      2. authorized
      3. proof_cache.tier_reached >= stream.required_tier  ◄── ADD THIS
      4. now >= cliff_ts
      5. unlocked_amount(now) > amount_withdrawn
    → Only then streams tokens linearly

  RECOMMENDATION: Implement Option B (matches external proposal + judge criteria)
    - Cliff = time gate (already done)
    - Milestone = tier gate (ProofCache check in withdraw) ← NEEDS CODING
    - Linear = smooth release after both gates pass (already done)

  ADD to StreamAccount:
    pub required_tier: u8,   // 0 = no milestone required, 1 or 2 = tier gate

  ADD to withdraw():
    if stream.required_tier > 0 {
        let cache = &ctx.accounts.proof_cache;
        require!(
            cache.tier_reached >= stream.required_tier,
            VestingError::MilestoneNotMet,
        );
    }

  ADD to VestingError:
    MilestoneNotMet,  // proof_cache.tier_reached < stream.required_tier
    FullyVested,      // cannot cancel a fully-vested stream
```

---

## FLOWCHART 7: Complete Integration — TDP + BlockBite Game

```
╔══════════════════════════════════════════════════════════════════════════════╗
║          TDP (PROTOCOL LAYER) ←──────────── GAME (APPLICATION LAYER)      ║
║                                                                             ║
║  RULE: Protocol knows nothing about game. Game calls Protocol via CPI.    ║
╚══════════════════════════════════════════════════════════════════════════════╝

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                        LAYER 0: BLOCKCHAIN (Solana)                    │
  │                                                                         │
  │  ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
  │  │   TDP PROGRAM (blockbite_   │  │   GAME PROGRAM (blockbite_  │    │
  │  │         vesting)            │  │         game) [Week 6]       │    │
  │  │                             │  │                              │    │
  │  │  Instructions:              │  │  Instructions:               │    │
  │  │  - create_stream()          │  │  - submit_score()            │    │
  │  │  - withdraw()               │  │  - level_complete() ─────────┼──► CPI to
  │  │  - fund_vault()             │  │  - register_player()         │    │  update_proof()
  │  │  - update_proof() ◄─────────┼──┤                              │    │
  │  │  - cancel()                 │  │  State: PlayerScore PDA      │    │
  │  │                             │  │  (level, score, timestamp)   │    │
  │  │  State: StreamAccount PDA   │  └──────────────────────────────┘    │
  │  │         ProofCache PDA      │                                       │
  │  │         Vault (TokenAcc)    │                                       │
  │  └──────────────────────────────┘                                      │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      LAYER 1: NEXT.JS BACKEND (Vercel)                 │
  │                                                                         │
  │  /api/leaderboard   → reads KV sorted sets (off-chain fast lookup)     │
  │  /api/session/submit → writes score to KV + calls game program (devnet)│
  │  /api/prizepool     → reads vault PDA balance (Solana RPC)             │
  │  /api/leaderboard/  → triggers legacy data recovery (auto)             │
  │     recover                                                             │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      LAYER 2: FRONTEND (React/Next.js)                 │
  │                                                                         │
  │  /game      → puzzle game (primary engagement + proof-of-humanity)     │
  │  /leaderboard → score rankings (off-chain KV, fast)                    │
  │  /mascots   → PNG character showcase (4 crew members)                  │
  │  /waitlist  → email capture + social proof                              │
  │  [future]   → TDP Dashboard: active streams, claim button, vesting viz │
  └─────────────────────────────────────────────────────────────────────────┘

  DATA FLOW FOR PLAYER CLAIMING TOKENS:
  ─────────────────────────────────────
  1. Player connects Phantom wallet
  2. Admin/Game CPI: update_proof(tier_reached=1) when Level 10 reached
  3. ProofCache PDA created/updated on-chain
  4. Player waits 3 days (cliff)
  5. Player calls withdraw() from dashboard
  6. TDP program checks: !cancelled + authorized + tier_reached >= required + now >= cliff
  7. unlocked_amount(now) calculated
  8. Token transfer: vault PDA → player wallet ATA
  9. Frontend updates: shows claimable balance, history
```

---

## FLOWCHART 8: Week 5 Completion Checklist + Gap Analysis

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    WEEK 5 ACCEPTANCE CRITERIA — AUDIT STATUS               ║
╚══════════════════════════════════════════════════════════════════════════════╝

  Criteria                                          Status        Action Needed
  ─────────────────────────────────────────────────────────────────────────────
  Cliff vesting: zero tokens before cliff_ts        DONE ✓        None
  After cliff, linear vesting begins normally       DONE ✓        None
  Milestone: tokens unlock when bool flag set       PARTIAL ⚠     Add tier check in withdraw()
  cancel_stream: only creator can cancel            DONE ✓        None
  Unlocked tokens → recipient on cancel            DONE ✓        None
  Locked tokens → creator on cancel               DONE ✓        None
  Cannot cancel already-cancelled stream           DONE ✓        None (StreamCancelled)
  Cannot cancel after fully vested                 MISSING ✗      Add FullyVested check + error
  Error: Unauthorized                              DONE ✓        None
  Error: AlreadyCancelled (StreamCancelled)        DONE ✓        None
  Error: FullyVested                               MISSING ✗      Add to VestingError enum
  Error: NothingToWithdraw                         DONE ✓        None
  Error: StreamExpired                             MISSING ✗      Optional — end_ts passed check
  Tests: cliff behavior at different time points   MISSING ✗      Write tests (priority)
  Tests: milestone unlock trigger                  MISSING ✗      Write tests (priority)
  Tests: cancel before cliff                       MISSING ✗      Write tests (priority)
  Tests: cancel mid-stream                         MISSING ✗      Write tests (priority)
  Tests: cancel after full vest (error)            MISSING ✗      Write tests (priority)
  Tests: error cases (all custom errors)           MISSING ✗      Write tests (priority)
  All Week 4 tests still pass (no regressions)    UNKNOWN ?       Verify

  CRITICAL PATH FOR SUBMISSION (2 days left, due 2026-05-23):
  ──────────────────────────────────────────────────────────
  Priority 1: Add FullyVested error + check in cancel()    [30 min]
  Priority 2: Add required_tier to StreamAccount + check   [1 hour]
              in withdraw() for milestone mode
  Priority 3: Write TypeScript tests for all criteria      [3-4 hours]
  Priority 4: Run `anchor build && anchor test`            [30 min]
  Priority 5: Deploy to devnet, update PR                  [30 min]
```

---

## FLOWCHART 9: Core Mathematics — All Formulas in One Place

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    COMPLETE MATHEMATICAL SPECIFICATION                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

  VARIABLES:
    T  = amount_total (u64, in lamports/smallest token unit)
    t  = current unix timestamp (i64, Solana Clock)
    t₀ = start_ts
    tc = cliff_ts (≥ t₀)
    te = end_ts (> t₀)
    W  = amount_withdrawn

  ─── 1. UNLOCKED AMOUNT ───────────────────────────────────────────────────
  
  unlocked(t) = {
    0                           if t < tc  (cliff not passed)
    0                           if t < t₀  (stream not started)
    T                           if t ≥ te  (fully vested)
    T × (t - t₀) / (te - t₀)   otherwise  (linear interpolation)
  }

  Implementation (Rust, overflow-safe u128):
    let elapsed  = (now - self.start_ts) as u128;
    let duration = (self.end_ts - self.start_ts) as u128;
    ((self.amount_total as u128 * elapsed) / duration) as u64

  ─── 2. CLAIMABLE AMOUNT ──────────────────────────────────────────────────

  claimable(t) = max(0, unlocked(t) - W)

  ─── 3. VESTING RATE ──────────────────────────────────────────────────────

  R = T / (te - t₀)  [tokens per second]
  
  For Bob's Milestone 1:
    R = 200 / 432_000 = 0.000462963 TOKEN/sec
    R × 3_600 = 1.666 TOKEN/hour
    R × 86_400 = 40 TOKEN/day

  ─── 4. CANCEL SPLIT ──────────────────────────────────────────────────────

  vested_at_cancel    = unlocked(t_cancel)
  claimable_to_recv   = vested_at_cancel - W  → beneficiary ATA
  returned_to_creator = T - vested_at_cancel  → authority ATA
  
  Invariant: claimable_to_recv + returned_to_creator + W = T (conservation)

  ─── 5. REVENUE SPLIT (fund_vault) ────────────────────────────────────────

  deposit = D
  vault_portion    = floor(D × 70 / 100)
  team_portion     = floor(D × 15 / 100)
  dev_portion      = floor(D × 10 / 100)
  referral_portion = floor(D × 5  / 100)
  dust = D - (vault + team + dev + referral)  -- rounding remainder
  vault_total = vault_portion + dust           -- dust always goes to vault
  
  Proof: vault_total + team + dev + referral = D ✓ (no tokens lost)

  ─── 6. MILESTONE TIER MATH (External Proposal, Generalized) ─────────────

  total_allocation = 1000 TOKEN (example)
  
  Tier 1 (Level 10 = KPI 1): allocation_1 = 0.20 × 1000 = 200 TOKEN
  Tier 2 (Level 30 = KPI 2): allocation_2 = 0.30 × 1000 = 300 TOKEN  
  Tier 3 (Level 50 = KPI 3): allocation_3 = 0.50 × 1000 = 500 TOKEN
  
  Each tier has its own stream (create_stream × 3) or one stream per milestone
  (simpler: separate streams with different required_tier and amount)

  ─── 7. VGPV RATE LIMIT MATH ─────────────────────────────────────────────

  allowed_rate = 1 action / 7_200 seconds
  bot_rate     = N actions / second (N → ∞)
  
  Expected bot behavior: trigger VelocityViolation on 3rd consecutive fast action
  Expected cost per bot account: 3 Solana txs × ~0.000005 SOL = 0.000015 SOL
  After VelocityViolation: bot is permanently blocked in that ProofCache PDA
  To bypass: bot needs new wallet + new stream + new registration = costly
```

---

## FINAL AUDIT CONCLUSION

### AMBIL dari saran eksternal:
1. Narasi 3-tier (Cliff → Milestone → Linear) sebagai story untuk BD team dan laporan
2. Analogi celengan digital — efektif untuk orang awam
3. Angka matematis simulasi Bob — masukkan ke laporan Week 5
4. Anti-bot framing (VGPV sebagai anti-Sybil) — ini sudah ada di kode, tonjolkan

### BUANG dari saran eksternal:
1. Hardcode level 10/30/50 di protocol layer — ini business logic, bukan protocol
2. startLinearStream() sebagai fungsi terpisah — arsitektur sudah lebih baik
3. registerUser() terpisah — stream init sudah handle ini
4. MetaMask reference — ini Solana, bukan EVM

### KERJAKAN sekarang (2 hari menuju deadline):
1. Add `FullyVested` error + check in `cancel()` — [KODE PERLU DIUBAH]
2. Add `required_tier: u8` to `StreamAccount` — [KODE PERLU DIUBAH]  
3. Add `MilestoneNotMet` error + tier check in `withdraw()` — [KODE PERLU DIUBAH]
4. Write TypeScript tests covering all 6 acceptance criteria — [PRIORITAS UTAMA]
5. `anchor build && anchor test` — semua harus hijau
6. Deploy to devnet, submit PR

### STATUS TERKINI:
- Leaderboard API: FIXED, 200 OK confirmed, data recovery mechanism live
- Mascots page: COMPLETE, 4 PNG cards, no name labels on homepage
- Smart contract: 70% done, missing FullyVested + milestone gate + tests
- KV env vars: BUTUH DIKONFIGURASI di Vercel dashboard untuk restore 5567 user scores
