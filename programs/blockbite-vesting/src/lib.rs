use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWxTWqzXY6vSAQ6sMmBm4o9mpU3");

// ─── Program ─────────────────────────────────────────────────────────────────

#[program]
pub mod blockbite_vesting {
    use super::*;

    /// Lock `amount` tokens from creator into a PDA vault, vesting linearly
    /// from `start_ts` to `end_ts` for `recipient`.
    pub fn create_stream(
        ctx: Context<CreateStream>,
        stream_id: u64,
        amount: u64,
        start_ts: i64,
        end_ts: i64,
    ) -> Result<()> {
        require!(amount > 0, VestingError::ZeroAmount);
        require!(end_ts > start_ts, VestingError::InvalidTimeRange);

        let stream = &mut ctx.accounts.stream;
        stream.authority    = ctx.accounts.authority.key();
        stream.beneficiary  = ctx.accounts.beneficiary.key();
        stream.mint         = ctx.accounts.mint.key();
        stream.amount_total = amount;
        stream.amount_withdrawn = 0;
        stream.start_ts     = start_ts;
        stream.end_ts       = end_ts;
        stream.stream_id    = stream_id;
        stream.cancelled    = false;
        stream.bump         = ctx.bumps.stream;

        // Transfer tokens from creator's ATA into the vault (authority = stream PDA)
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
            end_ts,
        });

        Ok(())
    }

    /// Beneficiary claims however many tokens have vested since last withdrawal.
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
        let authority_key     = stream.authority;
        let stream_id_bytes   = stream.stream_id.to_le_bytes();
        let bump              = stream.bump;

        // Update state before CPI (checks-effects-interactions)
        ctx.accounts.stream.amount_withdrawn = ctx.accounts.stream
            .amount_withdrawn
            .checked_add(available)
            .ok_or(VestingError::Overflow)?;

        // Sign CPI from vault with stream PDA seeds
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

    /// Creator cancels stream: remaining locked tokens return to creator.
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        require!(!ctx.accounts.stream.cancelled, VestingError::StreamCancelled);
        require!(
            ctx.accounts.authority.key() == ctx.accounts.stream.authority,
            VestingError::Unauthorized
        );

        let stream            = &ctx.accounts.stream;
        let remaining         = stream.amount_total.saturating_sub(stream.amount_withdrawn);
        let authority_key     = stream.authority;
        let stream_id_bytes   = stream.stream_id.to_le_bytes();
        let bump              = stream.bump;

        ctx.accounts.stream.cancelled = true;

        if remaining > 0 {
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
                        to:        ctx.accounts.authority_ata.to_account_info(),
                        authority: ctx.accounts.stream.to_account_info(),
                    },
                    &[seeds],
                ),
                remaining,
            )?;
        }

        emit!(Cancelled {
            stream:    ctx.accounts.stream.key(),
            authority: ctx.accounts.authority.key(),
            refunded:  remaining,
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

    /// CHECK: recipient — validated only by storing in stream.beneficiary
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

    /// Creator's token account to debit from.
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
        token::authority = authority,
    )]
    pub authority_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct StreamAccount {
    pub authority:        Pubkey,   // 32
    pub beneficiary:      Pubkey,   // 32
    pub mint:             Pubkey,   // 32
    pub amount_total:     u64,      // 8
    pub amount_withdrawn: u64,      // 8
    pub start_ts:         i64,      // 8
    pub end_ts:           i64,      // 8
    pub stream_id:        u64,      // 8
    pub cancelled:        bool,     // 1
    pub bump:             u8,       // 1
}

impl StreamAccount {
    pub const LEN: usize = 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 1; // 138

    /// Linear vesting: unlocked = total * elapsed / duration (saturates at total).
    pub fn unlocked_amount(&self, now: i64) -> u64 {
        if now < self.start_ts {
            return 0;
        }
        if now >= self.end_ts {
            return self.amount_total;
        }
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
    #[msg("Nothing available to withdraw yet")]
    NothingToWithdraw,
    #[msg("Caller is not authorized for this action")]
    Unauthorized,
    #[msg("Stream has already been cancelled")]
    StreamCancelled,
    #[msg("Arithmetic overflow")]
    Overflow,
}
