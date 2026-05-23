use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

declare_id!("DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf");

// ─── VGPV — Velocity-Gated Proof Validation ─────────────────────────────────
pub const VGPV_MIN_SECONDS_PER_ACT: i64 = 7_200; // 2 hr human minimum per Act
pub const VGPV_MAX_VELOCITY_STRIKES: u8  = 3;     // strikes before proof invalidated

// ─── Program ─────────────────────────────────────────────────────────────────

#[program]
pub mod blockbite_vesting {
    use super::*;

    /// Lock `amount` tokens from creator into a PDA vault.
    /// Vesting is linear from `start_ts` to `end_ts`.
    /// `cliff_ts = 0` means no cliff (behaves as start_ts).
    /// `required_tier = 0` means no ProofCache milestone gate.
    /// Milestone quota system (W5) is configured via configure_milestones().
    pub fn create_stream(
        ctx: Context<CreateStream>,
        stream_id:     u64,
        amount:        u64,
        start_ts:      i64,
        cliff_ts:      i64,
        end_ts:        i64,
        required_tier: u8,
    ) -> Result<()> {
        require!(amount > 0, VestingError::ZeroAmount);
        require!(end_ts > start_ts, VestingError::InvalidTimeRange);
        require!(required_tier <= 2, VestingError::InvalidTier);

        let effective_cliff = if cliff_ts == 0 { start_ts } else { cliff_ts };
        require!(
            effective_cliff >= start_ts && effective_cliff <= end_ts,
            VestingError::InvalidCliff
        );

        let stream = &mut ctx.accounts.stream;
        stream.authority          = ctx.accounts.authority.key();
        stream.beneficiary        = ctx.accounts.beneficiary.key();
        stream.mint               = ctx.accounts.mint.key();
        stream.amount_total       = amount;
        stream.amount_withdrawn   = 0;
        stream.start_ts           = start_ts;
        stream.cliff_ts           = effective_cliff;
        stream.end_ts             = end_ts;
        stream.stream_id          = stream_id;
        stream.cancelled          = false;
        stream.bump               = ctx.bumps.stream;
        stream.velocity_strikes   = 0;
        stream.last_action_ts     = start_ts;
        stream.required_tier      = required_tier;
        // W5 milestone system — defaults to disabled (count=0)
        stream.milestone_count    = 0;
        stream.milestones_verified = [false; 4];
        stream.milestone_pct      = [0u8; 4];

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.authority_ata.to_account_info(),
                    to:        ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        emit!(StreamCreated {
            stream:      ctx.accounts.stream.key(),
            authority:   ctx.accounts.authority.key(),
            beneficiary: ctx.accounts.beneficiary.key(),
            amount,
            start_ts,
            cliff_ts:    effective_cliff,
            end_ts,
        });

        Ok(())
    }

    /// Set the milestone quota configuration for a stream (authority only).
    /// `count` milestones (1–4), each with an allocation percentage.
    /// Sum of pct[0..count] must equal exactly 100.
    /// Can only be called once per stream (milestone_count must be 0).
    pub fn configure_milestones(
        ctx: Context<ConfigureMilestones>,
        count: u8,
        pct:   [u8; 4],
    ) -> Result<()> {
        require!(!ctx.accounts.stream.cancelled, VestingError::AlreadyCancelled);
        require!(count >= 1 && count <= 4, VestingError::InvalidMilestoneIndex);
        // milestone_count == 0 means not yet configured
        require!(ctx.accounts.stream.milestone_count == 0, VestingError::MilestoneAlreadyConfigured);

        // Percentages must sum to exactly 100 across active milestones
        let sum: u16 = pct[..count as usize].iter().map(|&p| p as u16).sum();
        require!(sum == 100, VestingError::InvalidMilestonePct);

        let stream = &mut ctx.accounts.stream;
        stream.milestone_count     = count;
        stream.milestone_pct       = pct;
        stream.milestones_verified = [false; 4];

        emit!(MilestonesConfigured {
            stream: ctx.accounts.stream.key(),
            count,
            pct,
        });

        Ok(())
    }

    /// Mark a milestone as verified (authority manual call — source B of 3).
    ///
    /// Three verification sources for milestones:
    ///   A) update_proof() via game CPI (automated, on-chain game oracle)
    ///   B) verify_milestone() — this instruction (authority manual call)
    ///   C) Future: Switchboard oracle push
    ///
    /// Once verified, the corresponding pct quota becomes claimable in withdraw().
    pub fn verify_milestone(
        ctx: Context<VerifyMilestone>,
        index: u8,
    ) -> Result<()> {
        require!(!ctx.accounts.stream.cancelled, VestingError::AlreadyCancelled);
        require!(
            index < ctx.accounts.stream.milestone_count,
            VestingError::InvalidMilestoneIndex,
        );

        let stream = &mut ctx.accounts.stream;
        stream.milestones_verified[index as usize] = true;

        emit!(MilestoneVerified {
            stream:    ctx.accounts.stream.key(),
            index,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Beneficiary claims however many tokens have vested since last withdrawal.
    ///
    /// Gate order:
    ///   1. Stream not cancelled
    ///   2. Caller is beneficiary
    ///   3. ProofCache tier gate (if required_tier > 0)
    ///   4. Cliff gate (via unlocked_amount)
    ///   5. Milestone quota cap (if milestone_count > 0)
    ///   6. VGPV velocity check
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        require!(!ctx.accounts.stream.cancelled, VestingError::AlreadyCancelled);

        // Gate 3: ProofCache tier milestone (game CPI path — source A)
        if ctx.accounts.stream.required_tier > 0 {
            let cache_data = ctx.accounts.proof_cache.try_borrow_data()?;
            let cache = ProofCache::try_deserialize(&mut &cache_data[..])?;
            // PDA origin validation — prevents cross-stream substitution attack:
            // attacker cannot pass a ProofCache from their own stream to bypass
            // the tier gate on a different stream.
            require!(
                cache.schedule == ctx.accounts.stream.key(),
                VestingError::Unauthorized,
            );
            require!(
                cache.player == ctx.accounts.beneficiary.key(),
                VestingError::Unauthorized,
            );
            require!(
                cache.tier_reached >= ctx.accounts.stream.required_tier,
                VestingError::MilestoneNotMet,
            );
        }

        let now    = Clock::get()?.unix_timestamp;
        let stream = &ctx.accounts.stream;

        // Gate 4: cliff enforced inside unlocked_amount
        let unlocked  = stream.unlocked_amount(now);
        let mut available = unlocked.saturating_sub(stream.amount_withdrawn);
        require!(available > 0, VestingError::NothingToWithdraw);

        // Gate 5: milestone quota cap (authority manual path — source B)
        if stream.milestone_count > 0 {
            let quota: u64 = (0..stream.milestone_count as usize)
                .filter(|&i| stream.milestones_verified[i])
                .map(|i| {
                    stream.amount_total
                        .saturating_mul(stream.milestone_pct[i] as u64)
                        / 100
                })
                .sum();
            let cap = quota.saturating_sub(stream.amount_withdrawn);
            available = available.min(cap);
            require!(available > 0, VestingError::MilestoneNotVerified);
        }

        let authority_key   = stream.authority;
        let stream_id_bytes = stream.stream_id.to_le_bytes();
        let bump            = stream.bump;
        let last_ts         = stream.last_action_ts;

        // Gate 6: VGPV — block withdrawals faster than human threshold
        let elapsed = now.saturating_sub(last_ts);
        if last_ts > 0 && elapsed < VGPV_MIN_SECONDS_PER_ACT {
            let new_strikes = ctx.accounts.stream.velocity_strikes
                .checked_add(1)
                .ok_or(VestingError::Overflow)?;
            ctx.accounts.stream.velocity_strikes = new_strikes;
            require!(
                new_strikes < VGPV_MAX_VELOCITY_STRIKES,
                VestingError::VelocityViolation
            );
        } else if last_ts > 0 && elapsed >= VGPV_MIN_SECONDS_PER_ACT.saturating_mul(2) {
            // Reset strikes after cooling off for 2× the minimum interval —
            // prevents permanent lockout from 3 accidental rapid withdrawals.
            ctx.accounts.stream.velocity_strikes = 0;
        }
        ctx.accounts.stream.last_action_ts   = now;
        ctx.accounts.stream.amount_withdrawn = ctx.accounts.stream
            .amount_withdrawn
            .checked_add(available)
            .ok_or(VestingError::Overflow)?;

        let seeds: &[&[u8]] = &[
            b"stream",
            authority_key.as_ref(),
            stream_id_bytes.as_ref(),
            &[bump],
        ];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.vault.to_account_info(),
                    to:        ctx.accounts.beneficiary_ata.to_account_info(),
                    authority: ctx.accounts.stream.to_account_info(),
                },
                &[seeds],
            ),
            available,
        )?;

        emit!(Withdrawn {
            stream:      ctx.accounts.stream.key(),
            beneficiary: ctx.accounts.beneficiary.key(),
            amount:      available,
            timestamp:   now,
        });

        Ok(())
    }

    /// Add tokens to an existing stream's vault with atomic 70/15/10/5 revenue split.
    pub fn fund_vault(ctx: Context<FundVault>, amount: u64) -> Result<()> {
        require!(amount > 0, VestingError::ZeroAmount);
        require!(!ctx.accounts.stream.cancelled, VestingError::AlreadyCancelled);
        let now = Clock::get()?.unix_timestamp;
        require!(now < ctx.accounts.stream.end_ts, VestingError::StreamExpired);

        let vault_portion    = amount.checked_mul(70).ok_or(VestingError::Overflow)? / 100;
        let team_portion     = amount.checked_mul(15).ok_or(VestingError::Overflow)? / 100;
        let dev_portion      = amount.checked_mul(10).ok_or(VestingError::Overflow)? / 100;
        let referral_portion = amount.checked_mul(5).ok_or(VestingError::Overflow)?  / 100;

        let distributed = vault_portion
            .checked_add(team_portion).ok_or(VestingError::Overflow)?
            .checked_add(dev_portion).ok_or(VestingError::Overflow)?
            .checked_add(referral_portion).ok_or(VestingError::Overflow)?;
        let dust        = amount.checked_sub(distributed).ok_or(VestingError::Overflow)?;
        let vault_total = vault_portion.checked_add(dust).ok_or(VestingError::Overflow)?;

        ctx.accounts.stream.amount_total = ctx.accounts.stream.amount_total
            .checked_add(vault_total)
            .ok_or(VestingError::Overflow)?;

        let token_program_info = ctx.accounts.token_program.to_account_info();
        let funder_info        = ctx.accounts.funder.to_account_info();
        let funder_ata_info    = ctx.accounts.funder_ata.to_account_info();

        if vault_total > 0 {
            token::transfer(
                CpiContext::new(token_program_info.clone(), Transfer {
                    from: funder_ata_info.clone(), to: ctx.accounts.vault.to_account_info(),
                    authority: funder_info.clone(),
                }),
                vault_total,
            )?;
        }
        if team_portion > 0 {
            token::transfer(
                CpiContext::new(token_program_info.clone(), Transfer {
                    from: funder_ata_info.clone(), to: ctx.accounts.team_ata.to_account_info(),
                    authority: funder_info.clone(),
                }),
                team_portion,
            )?;
        }
        if dev_portion > 0 {
            token::transfer(
                CpiContext::new(token_program_info.clone(), Transfer {
                    from: funder_ata_info.clone(), to: ctx.accounts.dev_ata.to_account_info(),
                    authority: funder_info.clone(),
                }),
                dev_portion,
            )?;
        }
        if referral_portion > 0 {
            token::transfer(
                CpiContext::new(token_program_info, Transfer {
                    from: funder_ata_info, to: ctx.accounts.referral_ata.to_account_info(),
                    authority: funder_info,
                }),
                referral_portion,
            )?;
        }

        emit!(VaultFunded {
            stream: ctx.accounts.stream.key(), funder: ctx.accounts.funder.key(),
            amount_total: amount, vault_portion: vault_total,
            team_portion, dev_portion, referral_portion,
        });

        Ok(())
    }

    /// Write or update a ProofCache PDA for (stream, player) — game CPI path (source A).
    /// VGPV: rejects if proof arrives faster than VGPV_MIN_SECONDS_PER_ACT.
    pub fn update_proof(
        ctx: Context<UpdateProof>,
        cohort_id:    u8,
        tier_reached: u8,
    ) -> Result<()> {
        require!(
            ctx.accounts.admin.key() == ctx.accounts.stream.authority,
            VestingError::Unauthorized,
        );
        require!(tier_reached <= 2, VestingError::InvalidTier);

        let now    = Clock::get()?.unix_timestamp;
        let cache  = &mut ctx.accounts.proof_cache;
        let is_new = cache.player == Pubkey::default();

        if !is_new {
            let elapsed = now.saturating_sub(cache.last_proof_ts);
            if elapsed < VGPV_MIN_SECONDS_PER_ACT {
                cache.velocity_strikes = cache.velocity_strikes
                    .checked_add(1)
                    .ok_or(VestingError::Overflow)?;
                require!(
                    cache.velocity_strikes < VGPV_MAX_VELOCITY_STRIKES,
                    VestingError::VelocityViolation,
                );
            }
        }

        cache.schedule       = ctx.accounts.stream.key();
        cache.player         = ctx.accounts.player.key();
        cache.cohort_id      = cohort_id;
        cache.tier_reached   = tier_reached;
        cache.last_proof_ts  = now;
        if is_new { cache.bump = ctx.bumps.proof_cache; }

        emit!(ProofUpdated {
            stream: ctx.accounts.stream.key(), player: ctx.accounts.player.key(),
            cohort_id, tier_reached, timestamp: now,
        });

        Ok(())
    }

    /// Creator cancels stream.
    /// Vested-but-unclaimed → beneficiary. Truly unvested → creator.
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        require!(!ctx.accounts.stream.cancelled, VestingError::AlreadyCancelled);

        let now    = Clock::get()?.unix_timestamp;
        let stream = &ctx.accounts.stream;

        // Compute once — eliminates double-call and latent TOCTOU pattern
        let vested_at_cancel = stream.unlocked_amount(now);
        require!(
            vested_at_cancel < stream.amount_total,
            VestingError::FullyVested
        );
        let claimable_for_beneficiary = vested_at_cancel.saturating_sub(stream.amount_withdrawn);
        let return_to_creator         = stream.amount_total.saturating_sub(vested_at_cancel);

        let authority_key   = stream.authority;
        let stream_id_bytes = stream.stream_id.to_le_bytes();
        let bump            = stream.bump;

        ctx.accounts.stream.cancelled = true;

        let seeds: &[&[u8]] = &[b"stream", authority_key.as_ref(), stream_id_bytes.as_ref(), &[bump]];

        if claimable_for_beneficiary > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from:      ctx.accounts.vault.to_account_info(),
                        to:        ctx.accounts.beneficiary_ata.to_account_info(),
                        authority: ctx.accounts.stream.to_account_info(),
                    },
                    &[seeds],
                ),
                claimable_for_beneficiary,
            )?;
        }

        if return_to_creator > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from:      ctx.accounts.vault.to_account_info(),
                        to:        ctx.accounts.authority_ata.to_account_info(),
                        authority: ctx.accounts.stream.to_account_info(),
                    },
                    &[seeds],
                ),
                return_to_creator,
            )?;
        }

        // Close vault token account — reclaim ~0.00204 SOL rent to authority
        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account:     ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.authority.to_account_info(),
                authority:   ctx.accounts.stream.to_account_info(),
            },
            &[seeds],
        ))?;

        emit!(Cancelled {
            stream:    ctx.accounts.stream.key(),
            authority: ctx.accounts.authority.key(),
            refunded:  return_to_creator,
        });

        Ok(())
    }
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(stream_id: u64)]
pub struct CreateStream<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: recipient stored in stream.beneficiary; validated on withdraw
    pub beneficiary: AccountInfo<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init, payer = authority,
        space = 8 + StreamAccount::LEN,
        seeds = [b"stream", authority.key().as_ref(), &stream_id.to_le_bytes()],
        bump,
    )]
    pub stream: Account<'info, StreamAccount>,

    #[account(
        init, payer = authority,
        token::mint = mint, token::authority = stream,
        seeds = [b"vault", authority.key().as_ref(), &stream_id.to_le_bytes()],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut, token::mint = mint, token::authority = authority)]
    pub authority_ata: Account<'info, TokenAccount>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ConfigureMilestones<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ VestingError::Unauthorized,
        seeds = [b"stream", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump = stream.bump,
    )]
    pub stream: Account<'info, StreamAccount>,
}

#[derive(Accounts)]
pub struct VerifyMilestone<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ VestingError::Unauthorized,
        seeds = [b"stream", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump = stream.bump,
    )]
    pub stream: Account<'info, StreamAccount>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub beneficiary: Signer<'info>,

    #[account(
        mut,
        has_one = beneficiary @ VestingError::Unauthorized,
        seeds = [b"stream", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump = stream.bump,
    )]
    pub stream: Account<'info, StreamAccount>,

    #[account(
        mut,
        seeds = [b"vault", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump, token::mint = stream.mint, token::authority = stream,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut, token::mint = stream.mint, token::authority = beneficiary)]
    pub beneficiary_ata: Account<'info, TokenAccount>,

    /// CHECK: manually deserialized; pass SystemProgram when required_tier == 0
    pub proof_cache: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct FundVault<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(
        mut,
        seeds = [b"stream", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump = stream.bump,
    )]
    pub stream: Account<'info, StreamAccount>,

    #[account(
        mut,
        seeds = [b"vault", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump, token::mint = stream.mint, token::authority = stream,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut, token::mint = stream.mint, token::authority = funder)]
    pub funder_ata: Account<'info, TokenAccount>,

    #[account(mut, token::mint = stream.mint)]
    pub team_ata: Account<'info, TokenAccount>,

    #[account(mut, token::mint = stream.mint)]
    pub dev_ata: Account<'info, TokenAccount>,

    #[account(mut, token::mint = stream.mint)]
    pub referral_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateProof<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"stream", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump = stream.bump,
    )]
    pub stream: Account<'info, StreamAccount>,

    /// CHECK: address used as PDA seed only
    pub player: AccountInfo<'info>,

    #[account(
        init_if_needed, payer = admin,
        space = 8 + ProofCache::LEN,
        seeds = [b"proof_cache", stream.key().as_ref(), player.key().as_ref()],
        bump,
    )]
    pub proof_cache: Account<'info, ProofCache>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(address = stream.beneficiary)]
    /// CHECK: validated against stream.beneficiary
    pub beneficiary: AccountInfo<'info>,

    #[account(
        mut,
        has_one = authority @ VestingError::Unauthorized,
        close = authority,
        seeds = [b"stream", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump = stream.bump,
    )]
    pub stream: Account<'info, StreamAccount>,

    #[account(
        mut,
        seeds = [b"vault", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump, token::mint = stream.mint, token::authority = stream,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut, token::mint = stream.mint, token::authority = authority)]
    pub authority_ata: Account<'info, TokenAccount>,

    #[account(mut, token::mint = stream.mint, token::authority = beneficiary)]
    pub beneficiary_ata: Account<'info, TokenAccount>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct StreamAccount {
    // === CORE IDENTITY ===
    pub authority:          Pubkey, // 32
    pub beneficiary:        Pubkey, // 32
    pub mint:               Pubkey, // 32
    pub stream_id:          u64,    // 8

    // === VESTING SCHEDULE ===
    pub amount_total:       u64,    // 8
    pub amount_withdrawn:   u64,    // 8
    pub start_ts:           i64,    // 8
    pub cliff_ts:           i64,    // 8  = start_ts when no cliff
    pub end_ts:             i64,    // 8

    // === STATE FLAGS ===
    pub cancelled:          bool,   // 1
    pub bump:               u8,     // 1

    // === VGPV ANTI-BOT ===
    pub velocity_strikes:   u8,     // 1
    pub last_action_ts:     i64,    // 8

    // === PROOF TIER (game CPI — source A) ===
    pub required_tier:      u8,     // 1  0=no gate, 1/2=min ProofCache tier

    // === MILESTONE QUOTA (authority manual — source B) ===
    pub milestone_count:    u8,        // 1   0=disabled, 1-4=active
    pub milestones_verified: [bool; 4], // 4   index matches milestone_pct
    pub milestone_pct:      [u8; 4],   // 4   allocation % per milestone (sum==100)

    // TOTAL: 32+32+32+8+8+8+8+8+8+1+1+1+8+1+1+4+4 = 165 bytes
}

impl StreamAccount {
    pub const LEN: usize = 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 1 + 8 + 1 + 1 + 4 + 4; // 165

    /// Linear vesting with optional cliff.
    /// Returns 0 before cliff_ts, linear from start_ts to end_ts.
    pub fn unlocked_amount(&self, now: i64) -> u64 {
        if now < self.cliff_ts  { return 0; }
        if now < self.start_ts  { return 0; }
        if now >= self.end_ts   { return self.amount_total; }
        let elapsed  = (now - self.start_ts) as u128;
        let duration = (self.end_ts - self.start_ts) as u128;
        ((self.amount_total as u128 * elapsed) / duration) as u64
    }
}

/// ProofCache: one PDA per (stream, player). Tracks game-level proof + VGPV.
#[account]
pub struct ProofCache {
    pub schedule:         Pubkey, // 32
    pub player:           Pubkey, // 32
    pub cohort_id:        u8,     // 1
    pub tier_reached:     u8,     // 1
    pub last_proof_ts:    i64,    // 8
    pub velocity_strikes: u8,     // 1
    pub bump:             u8,     // 1
}

impl ProofCache {
    pub const LEN: usize = 32 + 32 + 1 + 1 + 8 + 1 + 1; // 76
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct StreamCreated {
    pub stream:      Pubkey,
    pub authority:   Pubkey,
    pub beneficiary: Pubkey,
    pub amount:      u64,
    pub start_ts:    i64,
    pub cliff_ts:    i64,
    pub end_ts:      i64,
}

#[event]
pub struct MilestonesConfigured {
    pub stream: Pubkey,
    pub count:  u8,
    pub pct:    [u8; 4],
}

#[event]
pub struct MilestoneVerified {
    pub stream:    Pubkey,
    pub index:     u8,
    pub timestamp: i64,
}

#[event]
pub struct Withdrawn {
    pub stream:      Pubkey,
    pub beneficiary: Pubkey,
    pub amount:      u64,
    pub timestamp:   i64,
}

#[event]
pub struct Cancelled {
    pub stream:    Pubkey,
    pub authority: Pubkey,
    pub refunded:  u64,
}

#[event]
pub struct VaultFunded {
    pub stream:           Pubkey,
    pub funder:           Pubkey,
    pub amount_total:     u64,
    pub vault_portion:    u64,
    pub team_portion:     u64,
    pub dev_portion:      u64,
    pub referral_portion: u64,
}

#[event]
pub struct ProofUpdated {
    pub stream:       Pubkey,
    pub player:       Pubkey,
    pub cohort_id:    u8,
    pub tier_reached: u8,
    pub timestamp:    i64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum VestingError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("end_ts must be strictly after start_ts")]
    InvalidTimeRange,
    #[msg("cliff_ts must be between start_ts and end_ts (or 0 for no cliff)")]
    InvalidCliff,
    #[msg("Nothing available to withdraw yet")]
    NothingToWithdraw,
    #[msg("Caller is not authorized for this action")]
    Unauthorized,
    #[msg("Stream has already been cancelled")]
    AlreadyCancelled,
    #[msg("Stream is fully vested — nothing left to cancel")]
    FullyVested,
    #[msg("Milestone not met — required ProofCache tier not yet reached")]
    MilestoneNotMet,
    #[msg("Milestone quota not yet unlocked — call verify_milestone first")]
    MilestoneNotVerified,
    #[msg("Milestone index out of range for this stream")]
    InvalidMilestoneIndex,
    #[msg("Milestone percentages must sum to exactly 100")]
    InvalidMilestonePct,
    #[msg("Milestones already configured for this stream")]
    MilestoneAlreadyConfigured,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Velocity exceeds human threshold — VGPV violation")]
    VelocityViolation,
    #[msg("Tier must be 0, 1, or 2")]
    InvalidTier,
    #[msg("Stream has expired past end_ts")]
    StreamExpired,
}
