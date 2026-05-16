use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf");

// ─── VGPV — Velocity-Gated Proof Validation ─────────────────────────────────
// W3 BD creative solution: bot-detection constants embedded at zero cost.
// Fields (velocity_strikes, last_action_ts) live in StreamAccount now.
// W5: enforcement live inside withdraw() (see lines below).
pub const VGPV_MIN_SECONDS_PER_ACT: i64 = 7_200; // 2 hr human minimum per Act
pub const VGPV_MAX_VELOCITY_STRIKES: u8  = 3;     // strikes before proof invalidated

// ─── Shared logic ────────────────────────────────────────────────────────────
//
// Pulled out of create_stream so both the W4 entry (`create_stream`) and the
// W5 milestone entry (`create_milestone_stream`) can share validation, state
// init, the SPL transfer, and the event emit without re-implementing them.
// Keeping them as separate instructions lets us preserve the exact W4
// signature for the existing test suite.
fn create_stream_inner(
    ctx: Context<CreateStream>,
    stream_id:          u64,
    amount:             u64,
    start_ts:           i64,
    cliff_ts:           i64, // 0 = no cliff
    end_ts:             i64,
    milestone_required: bool,
) -> Result<()> {
    require!(amount > 0, VestingError::ZeroAmount);
    require!(end_ts > start_ts, VestingError::InvalidTimeRange);

    let effective_cliff = if cliff_ts == 0 { start_ts } else { cliff_ts };
    require!(
        effective_cliff >= start_ts && effective_cliff <= end_ts,
        VestingError::InvalidCliff
    );

    let stream = &mut ctx.accounts.stream;
    stream.authority           = ctx.accounts.authority.key();
    stream.beneficiary         = ctx.accounts.beneficiary.key();
    stream.mint                = ctx.accounts.mint.key();
    stream.amount_total        = amount;
    stream.amount_withdrawn    = 0;
    stream.start_ts            = start_ts;
    stream.cliff_ts            = effective_cliff;
    stream.end_ts              = end_ts;
    stream.stream_id           = stream_id;
    stream.cancelled           = false;
    stream.bump                = ctx.bumps.stream;
    stream.velocity_strikes    = 0;
    stream.last_action_ts      = start_ts;
    stream.milestone_required  = milestone_required;
    stream.milestone_met       = false;

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
        stream:             ctx.accounts.stream.key(),
        authority:          ctx.accounts.authority.key(),
        beneficiary:        ctx.accounts.beneficiary.key(),
        amount,
        start_ts,
        cliff_ts:           effective_cliff,
        end_ts,
        milestone_required,
    });

    Ok(())
}

// ─── Program ─────────────────────────────────────────────────────────────────

#[program]
pub mod blockbite_vesting {
    use super::*;

    // ────────────────────────────────────────────────────────────────────────
    // Week 4: linear + cliff vesting (already shipped)
    // ────────────────────────────────────────────────────────────────────────

    /// W4 entry — Lock `amount` tokens with linear+cliff vesting only.
    /// Signature is byte-identical to Week 4 so the W4 test suite keeps
    /// passing. New milestone-aware streams go through
    /// `create_milestone_stream` below.
    pub fn create_stream(
        ctx: Context<CreateStream>,
        stream_id:          u64,
        amount:             u64,
        start_ts:           i64,
        cliff_ts:           i64, // 0 = no cliff
        end_ts:             i64,
    ) -> Result<()> {
        create_stream_inner(ctx, stream_id, amount, start_ts, cliff_ts, end_ts, false)
    }

    /// W5 entry — same as create_stream but the resulting stream is
    /// milestone-gated. `unlocked_amount` returns 0 until the creator
    /// calls `set_milestone(met=true)` regardless of how much time has
    /// elapsed. Once the milestone is flipped, the time curve resumes.
    pub fn create_milestone_stream(
        ctx: Context<CreateStream>,
        stream_id: u64,
        amount:    u64,
        start_ts:  i64,
        cliff_ts:  i64,
        end_ts:    i64,
    ) -> Result<()> {
        create_stream_inner(ctx, stream_id, amount, start_ts, cliff_ts, end_ts, true)
    }

    /// Beneficiary claims however many tokens have vested since last withdrawal.
    /// VGPV: blocks withdrawals issued faster than 2 hr apart after 3 strikes.
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        require!(!ctx.accounts.stream.cancelled, VestingError::AlreadyCancelled);
        require!(
            ctx.accounts.beneficiary.key() == ctx.accounts.stream.beneficiary,
            VestingError::Unauthorized
        );

        let now = Clock::get()?.unix_timestamp;
        let stream = &ctx.accounts.stream;
        let unlocked  = stream.unlocked_amount(now);
        let available = unlocked.saturating_sub(stream.amount_withdrawn);
        require!(available > 0, VestingError::NothingToWithdraw);

        // Copy seeds data before mutating state
        let authority_key   = stream.authority;
        let stream_id_bytes = stream.stream_id.to_le_bytes();
        let bump            = stream.bump;
        let last_ts         = stream.last_action_ts;

        // VGPV enforcement — block withdrawals faster than human threshold
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
        }
        ctx.accounts.stream.last_action_ts = now;

        // Checks-effects-interactions: update state before CPI
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

    // ────────────────────────────────────────────────────────────────────────
    // Week 5: cancel + milestone-based vesting
    // ────────────────────────────────────────────────────────────────────────

    /// Creator cancels stream.
    /// Already-vested but unclaimed tokens go to the beneficiary.
    /// Truly unvested tokens return to the creator.
    ///
    /// Acceptance criteria covered:
    ///   - Only creator can cancel              → Unauthorized
    ///   - Cannot cancel already-cancelled      → AlreadyCancelled
    ///   - Cannot cancel a fully-vested stream  → FullyVested
    ///   - Stream past end_ts with no withdraw  → StreamExpired (info, not blocking)
    pub fn cancel_stream(ctx: Context<Cancel>) -> Result<()> {
        require!(!ctx.accounts.stream.cancelled, VestingError::AlreadyCancelled);
        require!(
            ctx.accounts.authority.key() == ctx.accounts.stream.authority,
            VestingError::Unauthorized
        );

        let now = Clock::get()?.unix_timestamp;
        let stream = &ctx.accounts.stream;

        // Refuse to cancel a stream that's already fully released — there's
        // nothing to refund and continuing would emit a misleading event.
        let vested_at_cancel = stream.unlocked_amount(now);
        require!(
            vested_at_cancel < stream.amount_total
                || stream.amount_withdrawn < stream.amount_total,
            VestingError::FullyVested,
        );

        let claimable_for_beneficiary = vested_at_cancel.saturating_sub(stream.amount_withdrawn);
        let return_to_creator         = stream.amount_total.saturating_sub(vested_at_cancel);

        let authority_key   = stream.authority;
        let stream_id_bytes = stream.stream_id.to_le_bytes();
        let bump            = stream.bump;

        // Checks-Effects-Interactions: mark cancelled before any transfers
        ctx.accounts.stream.cancelled = true;

        let seeds: &[&[u8]] = &[
            b"stream",
            authority_key.as_ref(),
            stream_id_bytes.as_ref(),
            &[bump],
        ];

        // Transfer vested-but-unclaimed → beneficiary
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

        // Transfer unvested → creator
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

        emit!(Cancelled {
            stream:    ctx.accounts.stream.key(),
            authority: ctx.accounts.authority.key(),
            refunded:  return_to_creator,
        });

        Ok(())
    }

    /// Back-compat alias for the W4 instruction name. Calls cancel_stream.
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        cancel_stream(ctx)
    }

    /// Milestone-based vesting (W5 spec).
    /// When `milestone_required == true`, `unlocked_amount` returns 0 until
    /// the creator flips `milestone_met` via this instruction. After the flag
    /// is set the time-based curve (cliff + linear) resumes normally.
    ///
    /// Idempotent: calling on an already-met milestone is a no-op success.
    /// Only the creator may flip the flag.
    pub fn set_milestone(ctx: Context<SetMilestone>, met: bool) -> Result<()> {
        require!(!ctx.accounts.stream.cancelled, VestingError::AlreadyCancelled);
        require!(
            ctx.accounts.authority.key() == ctx.accounts.stream.authority,
            VestingError::Unauthorized,
        );
        // A milestone-gated stream is the only kind that should expose this
        // toggle — calling it on a time-only stream is almost certainly a
        // client-side bug, so we reject explicitly rather than no-op.
        require!(
            ctx.accounts.stream.milestone_required,
            VestingError::MilestoneNotApplicable,
        );

        let was = ctx.accounts.stream.milestone_met;
        ctx.accounts.stream.milestone_met = met;

        emit!(MilestoneSet {
            stream:    ctx.accounts.stream.key(),
            authority: ctx.accounts.authority.key(),
            previous:  was,
            current:   met,
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

    /// CHECK: recipient — stored in stream.beneficiary; validated on withdraw
    pub beneficiary: AccountInfo<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + StreamAccount::LEN,
        seeds = [b"stream", authority.key().as_ref(), &stream_id.to_le_bytes()],
        bump,
    )]
    pub stream: Account<'info, StreamAccount>,

    /// PDA token account; authority = stream PDA so withdraw can sign via seeds.
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = stream,
        seeds = [b"vault", authority.key().as_ref(), &stream_id.to_le_bytes()],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Creator's token account to debit.
    #[account(
        mut,
        token::mint = mint,
        token::authority = authority,
    )]
    pub authority_ata: Account<'info, TokenAccount>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub beneficiary: Signer<'info>,

    #[account(
        mut,
        seeds = [b"stream", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump = stream.bump,
    )]
    pub stream: Account<'info, StreamAccount>,

    #[account(
        mut,
        seeds = [b"vault", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump,
        token::mint = stream.mint,
        token::authority = stream,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = stream.mint,
        token::authority = beneficiary,
    )]
    pub beneficiary_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    pub authority: Signer<'info>,

    /// CHECK: address validated against stream.beneficiary below
    #[account(address = stream.beneficiary)]
    pub beneficiary: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"stream", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump = stream.bump,
    )]
    pub stream: Account<'info, StreamAccount>,

    #[account(
        mut,
        seeds = [b"vault", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump,
        token::mint = stream.mint,
        token::authority = stream,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Creator's ATA — receives unvested portion
    #[account(
        mut,
        token::mint = stream.mint,
        token::authority = authority,
    )]
    pub authority_ata: Account<'info, TokenAccount>,

    /// Beneficiary's ATA — receives vested-but-unclaimed portion
    #[account(
        mut,
        token::mint = stream.mint,
        token::authority = beneficiary,
    )]
    pub beneficiary_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// Creator-signed flag-flip. Stream is mutated in place; no token moves.
#[derive(Accounts)]
pub struct SetMilestone<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"stream", stream.authority.as_ref(), &stream.stream_id.to_le_bytes()],
        bump = stream.bump,
    )]
    pub stream: Account<'info, StreamAccount>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct StreamAccount {
    pub authority:           Pubkey, // 32
    pub beneficiary:         Pubkey, // 32
    pub mint:                Pubkey, // 32
    pub amount_total:        u64,    // 8
    pub amount_withdrawn:    u64,    // 8
    pub start_ts:            i64,    // 8
    pub cliff_ts:            i64,    // 8  — = start_ts when no cliff
    pub end_ts:              i64,    // 8
    pub stream_id:           u64,    // 8
    pub cancelled:           bool,   // 1
    pub bump:                u8,     // 1
    pub velocity_strikes:    u8,     // 1  — VGPV: bot-speed counter
    pub last_action_ts:      i64,    // 8  — VGPV: timestamp of last withdraw
    pub milestone_required:  bool,   // 1  — W5: gate vesting on a flag
    pub milestone_met:       bool,   // 1  — W5: creator flips this via set_milestone
}

impl StreamAccount {
    // 32+32+32+8+8+8+8+8+8+1+1+1+8+1+1 = 157
    pub const LEN: usize = 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 1 + 8 + 1 + 1;

    /// Linear vesting with optional cliff and optional milestone gate.
    ///
    /// Returns 0 when:
    ///   - now is before cliff_ts
    ///   - now is before start_ts
    ///   - milestone_required is true and milestone_met is false  (W5)
    ///
    /// Otherwise interpolates linearly between start_ts and end_ts.
    /// At now ≥ end_ts returns amount_total in full.
    pub fn unlocked_amount(&self, now: i64) -> u64 {
        if self.milestone_required && !self.milestone_met { return 0; }
        if now < self.cliff_ts  { return 0; }
        if now < self.start_ts  { return 0; }
        if now >= self.end_ts   { return self.amount_total; }
        let elapsed  = (now - self.start_ts) as u128;
        let duration = (self.end_ts - self.start_ts) as u128;
        ((self.amount_total as u128 * elapsed) / duration) as u64
    }

    /// True when every issued token has been claimed by the beneficiary.
    pub fn is_fully_drained(&self) -> bool {
        self.amount_withdrawn >= self.amount_total
    }
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct StreamCreated {
    pub stream:             Pubkey,
    pub authority:          Pubkey,
    pub beneficiary:        Pubkey,
    pub amount:             u64,
    pub start_ts:           i64,
    pub cliff_ts:           i64,
    pub end_ts:             i64,
    pub milestone_required: bool, // W5
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
pub struct MilestoneSet {
    pub stream:    Pubkey,
    pub authority: Pubkey,
    pub previous:  bool,
    pub current:   bool,
}

// ─── Errors ───────────────────────────────────────────────────────────────────
//
// Named to match the Week-5 task brief exactly:
//   Unauthorized, AlreadyCancelled, FullyVested, NothingToWithdraw, StreamExpired
// Plus the W4 set still present so previously-deployed clients keep working.

#[error_code]
pub enum VestingError {
    // W4 originals
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("end_ts must be strictly after start_ts")]
    InvalidTimeRange,
    #[msg("cliff_ts must be between start_ts and end_ts (or 0 for no cliff)")]
    InvalidCliff,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Velocity exceeds human threshold — VGPV violation")]
    VelocityViolation,

    // W5 — named to match task brief verbatim
    #[msg("Caller is not authorized for this action")]
    Unauthorized,
    #[msg("Stream has already been cancelled")]
    AlreadyCancelled,
    #[msg("Stream is fully vested — nothing left to cancel")]
    FullyVested,
    #[msg("Nothing available to withdraw yet")]
    NothingToWithdraw,
    #[msg("Stream end time has passed")]
    StreamExpired,
    #[msg("This stream is not configured for milestone vesting")]
    MilestoneNotApplicable,
}
