use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqzXY6vSAQ6sMmBm4o9mpU3");

#[program]
pub mod blockbite_vesting {
    use super::*;

    pub fn create_stream(
        _ctx: Context<CreateStream>,
        stream_id: u64,
        _amount: u64,
        _start_ts: i64,
        _end_ts: i64,
    ) -> Result<()> {
        let _ = stream_id;
        Ok(())
    }

    pub fn withdraw(_ctx: Context<Withdraw>) -> Result<()> {
        Ok(())
    }

    pub fn cancel(_ctx: Context<Cancel>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateStream<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub stream: Account<'info, StreamAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub beneficiary: Signer<'info>,
    #[account(mut)]
    pub stream: Account<'info, StreamAccount>,
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub stream: Account<'info, StreamAccount>,
}

#[account]
pub struct StreamAccount {
    pub authority: Pubkey,
    pub beneficiary: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub amount_total: u64,
    pub amount_withdrawn: u64,
    pub start_ts: i64,
    pub end_ts: i64,
    pub cancelled: bool,
    pub bump: u8,
}

impl StreamAccount {
    pub const LEN: usize = 32 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct BeneficiaryProfile {
    pub owner: Pubkey,
    pub active_streams: u32,
    pub total_received: u64,
    pub bump: u8,
}

impl BeneficiaryProfile {
    pub const LEN: usize = 32 + 4 + 8 + 1;
}

#[account]
pub struct TreasuryVault {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub token_account: Pubkey,
    pub total_locked: u64,
    pub bump: u8,
}

impl TreasuryVault {
    pub const LEN: usize = 32 + 32 + 32 + 8 + 1;
}

#[account]
pub struct ProtocolConfig {
    pub admin: Pubkey,
    pub fee_bps: u16,
    pub paused: bool,
    pub bump: u8,
}

impl ProtocolConfig {
    pub const LEN: usize = 32 + 2 + 1 + 1;
}

#[account]
pub struct WithdrawalRecord {
    pub stream: Pubkey,
    pub beneficiary: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub bump: u8,
}

impl WithdrawalRecord {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 1;
}
