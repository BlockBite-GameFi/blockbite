use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf");

// ─── VGPV — Velocity-Gated Proof Validation ─────────────────────────────────
// W3 BD creative solution: bot-detection constants embedded at zero cost.
// Fields (velocity_strikes, last_action_ts) live in StreamAccount now.
// Full enforcement via game-program CPI ships in W5 (update_proof instruction).
pub const VGPV_MIN_SECONDS_PER_ACT: i64 = 7_200; // 2 hr human minimum per Act
pub const VGPV_MAX_VELOCITY_STRIKES: u8  = 3;     // strikes before proof invalidated

// ─── Program ─────────────────────────────────────────────────────────────────

#[program]
pub mod blockbite_vesting {
    use super::*;

    /// Lock `amount` tokens from creator into a PDA vault.
    /// Vesting is linear from `start_ts` to `end_ts`.
    /// `cliff_ts = 0` means no cliff (behaves as start_ts).
    /// Pass cliff_ts between start_ts and end_ts to enforce a cliff period.
    pub fn create_stream(
        ctx: Context<CreateStream>,
        stream_id: u64,
        amount:    u64,
        start_ts:  i64,
        cliff_ts:  i64, // 0 = no cliff
        end_ts:    i64,
    ) -> Result<()> {
        require!(amount > 0, VestingError::ZeroAmount);
        require!(end_ts > start_ts, VestingError::InvalidTimeRange);

        let effective_cliff = if cliff_ts == 0 { start_ts } else { cliff_ts };
        require!(
            effective_cliff >= start_ts && effective_cliff <= end_ts,
            VestingError::InvalidCliff
        );

        let stream = &mut ctx.accounts.stream;
        stream.authority         = ctx.accounts.authority.key();
        stream.beneficiary       = ctx.accounts.beneficiary.key();
        stream.mint              = ctx.accounts.mint.key();
        stream.amount_total      = amount;
        stream.amount_withdrawn  = 0;
        stream.start_ts          = start_ts;
        stream.cliff_ts          = effective_cliff;
        stream.end_ts            = end_ts;
        stream.stream_id         = stream_id;
        stream.cancelled         = false;
        stream.bump              = ctx.bumps.stream;
        stream.velocity_strikes  = 0;
        stream.last_action_ts    = start_ts;

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

    /// Beneficiary claims however many tokens have vested since last withdrawal.
    /// VGPV: tracks withdrawal velocity; enforcement logic added in W5.
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        require!(!ctx.accounts.stream.cancelled, VestingError::StreamCancelled);
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

    /// Creator cancels stream.
    /// Already-vested but unclaimed tokens go to the beneficiary.
    /// Truly unvested tokens return to the creator.
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        require!(!ctx.accounts.stream.cancelled, VestingError::StreamCancelled);
        require!(
            ctx.accounts.authority.key() == ctx.accounts.stream.authority,
            VestingError::Unauthorized
        );

        let now = Clock::get()?.unix_timestamp;
        let stream = &ctx.accounts.stream;

        // Split at the vested boundary as of now
        let vested_at_cancel        = stream.unlocked_amount(now);
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

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct StreamAccount {
    pub authority:        Pubkey, // 32
    pub beneficiary:      Pubkey, // 32
    pub mint:             Pubkey, // 32
    pub amount_total:     u64,    // 8
    pub amount_withdrawn: u64,    // 8
    pub start_ts:         i64,    // 8
    pub cliff_ts:         i64,    // 8  — = start_ts when no cliff
    pub end_ts:           i64,    // 8
    pub stream_id:        u64,    // 8
    pub cancelled:        bool,   // 1
    pub bump:             u8,     // 1
    pub velocity_strikes: u8,     // 1  — VGPV: bot-speed counter
    pub last_action_ts:   i64,    // 8  — VGPV: timestamp of last withdraw
}

impl StreamAccount {
    pub const LEN: usize = 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 1 + 8; // 155

    /// Linear vesting with optional cliff.
    /// Returns 0 before cliff_ts, then increases linearly from start_ts to end_ts.
    pub fn unlocked_amount(&self, now: i64) -> u64 {
        if now < self.cliff_ts  { return 0; }
        if now < self.start_ts  { return 0; }
        if now >= self.end_ts   { return self.amount_total; }
        let elapsed  = (now - self.start_ts) as u128;
        let duration = (self.end_ts - self.start_ts) as u128;
        ((self.amount_total as u128 * elapsed) / duration) as u64
    }
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
    StreamCancelled,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Velocity exceeds human threshold — VGPV violation (enforced W5)")]
    VelocityViolation,
}
