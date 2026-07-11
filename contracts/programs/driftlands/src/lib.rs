use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

declare_id!("DRFTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

/// Driftlands on-chain settlement layer (PRD §6–7).
/// Gameplay stays off-chain; only stake / revive / odds / attestation touch Solana.
#[program]
pub mod driftlands {
    use super::*;

    /// Lock tokens into the player's stake vault and refresh Level Score inputs.
    pub fn stake(ctx: Context<Stake>, amount: u64, duration_secs: i64) -> Result<()> {
        require!(amount > 0, DriftError::InvalidAmount);
        require!(duration_secs > 0, DriftError::InvalidDuration);

        let level = &mut ctx.accounts.level_state;
        let clock = Clock::get()?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.player_token.to_account_info(),
                    to: ctx.accounts.vault_token.to_account_info(),
                    authority: ctx.accounts.player.to_account_info(),
                },
            ),
            amount,
        )?;

        level.player = ctx.accounts.player.key();
        level.mint = ctx.accounts.mint.key();
        level.amount = level.amount.checked_add(amount).ok_or(DriftError::MathOverflow)?;
        level.staked_at = clock.unix_timestamp;
        level.duration_secs = duration_secs;
        level.token_multiplier_bps = ctx.accounts.config.multiplier_bps_for(&ctx.accounts.mint.key());
        level.bump = ctx.bumps.level_state;

        emit!(StakeEvent {
            player: level.player,
            amount,
            mint: level.mint,
            duration_secs,
        });
        Ok(())
    }

    /// Unstake with early-exit decay flag for the off-chain Level Score.
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        let level = &mut ctx.accounts.level_state;
        let amount = level.amount;
        require!(amount > 0, DriftError::NothingStaked);

        let seeds = &[b"stake_vault", level.player.as_ref(), &[ctx.bumps.stake_vault]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token.to_account_info(),
                    to: ctx.accounts.player_token.to_account_info(),
                    authority: ctx.accounts.stake_vault.to_account_info(),
                },
                &[seeds],
            ),
            amount,
        )?;

        let clock = Clock::get()?;
        let early = clock.unix_timestamp < level.staked_at.saturating_add(level.duration_secs);
        level.amount = 0;
        level.early_unstake = early;

        emit!(UnstakeEvent {
            player: level.player,
            amount,
            early,
        });
        Ok(())
    }

    /// Pay escalating revive fee (burn + optional treasury cut).
    pub fn pay_revive(ctx: Context<PayRevive>, journey_id: [u8; 32], revive_index: u8) -> Result<()> {
        require!(revive_index < ctx.accounts.config.max_revives, DriftError::ReviveCap);
        let mult_bps = ctx.accounts.config.revive_multiplier_bps(revive_index)?;
        let fee = (ctx.accounts.config.base_revive_fee as u128)
            .checked_mul(mult_bps as u128)
            .ok_or(DriftError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(DriftError::MathOverflow)? as u64;

        let burn_amount = fee
            .checked_mul(ctx.accounts.config.revive_burn_bps as u64)
            .ok_or(DriftError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(DriftError::MathOverflow)?;
        let treasury_amount = fee.saturating_sub(burn_amount);

        if burn_amount > 0 {
            token::burn(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Burn {
                        mint: ctx.accounts.drift_mint.to_account_info(),
                        from: ctx.accounts.player_token.to_account_info(),
                        authority: ctx.accounts.player.to_account_info(),
                    },
                ),
                burn_amount,
            )?;
        }
        if treasury_amount > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.player_token.to_account_info(),
                        to: ctx.accounts.treasury_token.to_account_info(),
                        authority: ctx.accounts.player.to_account_info(),
                    },
                ),
                treasury_amount,
            )?;
        }

        let record = &mut ctx.accounts.revive_record;
        record.player = ctx.accounts.player.key();
        record.journey_id = journey_id;
        record.revive_index = revive_index;
        record.fee_paid = fee;
        record.bump = ctx.bumps.revive_record;

        emit!(ReviveEvent {
            player: record.player,
            journey_id,
            revive_index,
            fee,
        });
        Ok(())
    }

    /// Create a players-only pari-mutuel pool at a journey node.
    pub fn create_odds_pool(
        ctx: Context<CreateOddsPool>,
        journey_id: [u8; 32],
        node_id: u16,
        close_time: i64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.odds_pool;
        pool.journey_id = journey_id;
        pool.node_id = node_id;
        pool.close_time = close_time;
        pool.fee_bps = ctx.accounts.config.odds_fee_bps;
        pool.authority = ctx.accounts.authority.key();
        pool.resolved = false;
        pool.winning_outcome = 0;
        pool.bump = ctx.bumps.odds_pool;
        Ok(())
    }

    pub fn enter_pool(ctx: Context<EnterPool>, outcome: u8, amount: u64) -> Result<()> {
        require!(amount > 0, DriftError::InvalidAmount);
        require!(!ctx.accounts.odds_pool.resolved, DriftError::PoolResolved);
        let clock = Clock::get()?;
        require!(clock.unix_timestamp <= ctx.accounts.odds_pool.close_time, DriftError::PoolClosed);

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.player_token.to_account_info(),
                    to: ctx.accounts.pool_token.to_account_info(),
                    authority: ctx.accounts.player.to_account_info(),
                },
            ),
            amount,
        )?;

        let entry = &mut ctx.accounts.odds_entry;
        entry.pool = ctx.accounts.odds_pool.key();
        entry.player = ctx.accounts.player.key();
        entry.outcome = outcome;
        entry.amount = entry.amount.checked_add(amount).ok_or(DriftError::MathOverflow)?;
        entry.bump = ctx.bumps.odds_entry;
        Ok(())
    }

    /// Server-authority posts signed journey result hash for pool resolution.
    pub fn post_journey_result(
        ctx: Context<PostJourneyResult>,
        journey_id: [u8; 32],
        survived: bool,
        zone_reached: u16,
        result_hash: [u8; 32],
    ) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.server_authority.key(),
            ctx.accounts.config.server_authority,
            DriftError::UnauthorizedServer
        );
        let result = &mut ctx.accounts.journey_result;
        result.journey_id = journey_id;
        result.player = ctx.accounts.player.key();
        result.survived = survived;
        result.zone_reached = zone_reached;
        result.result_hash = result_hash;
        result.timestamp = Clock::get()?.unix_timestamp;
        result.bump = ctx.bumps.journey_result;
        Ok(())
    }

    /// Permissionless resolve once result is posted.
    pub fn resolve_pool(ctx: Context<ResolvePool>, winning_outcome: u8) -> Result<()> {
        require!(!ctx.accounts.odds_pool.resolved, DriftError::PoolResolved);
        require!(
            ctx.accounts.journey_result.journey_id == ctx.accounts.odds_pool.journey_id,
            DriftError::JourneyMismatch
        );
        ctx.accounts.odds_pool.resolved = true;
        ctx.accounts.odds_pool.winning_outcome = winning_outcome;
        // Token split + perk credit routing handled in follow-up CPI / off-chain perk ledger.
        Ok(())
    }

    pub fn init_config(
        ctx: Context<InitConfig>,
        base_revive_fee: u64,
        max_revives: u8,
        odds_fee_bps: u16,
        revive_burn_bps: u16,
        server_authority: Pubkey,
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.base_revive_fee = base_revive_fee;
        cfg.max_revives = max_revives;
        cfg.odds_fee_bps = odds_fee_bps;
        cfg.revive_burn_bps = revive_burn_bps;
        cfg.server_authority = server_authority;
        cfg.bump = ctx.bumps.config;
        // Default multipliers: 1x, 2.5x, 6x in bps
        cfg.revive_mult_bps = [10_000, 25_000, 60_000, 0, 0, 0, 0, 0];
        Ok(())
    }
}

#[account]
pub struct ProtocolConfig {
    pub admin: Pubkey,
    pub server_authority: Pubkey,
    pub base_revive_fee: u64,
    pub max_revives: u8,
    pub odds_fee_bps: u16,
    pub revive_burn_bps: u16,
    pub revive_mult_bps: [u16; 8],
    pub bump: u8,
}

impl ProtocolConfig {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1 + 2 + 2 + (2 * 8) + 1;

    pub fn revive_multiplier_bps(&self, index: u8) -> Result<u16> {
        let i = index as usize;
        require!(i < self.max_revives as usize, DriftError::ReviveCap);
        let m = self.revive_mult_bps[i];
        require!(m > 0, DriftError::ReviveCap);
        Ok(m)
    }

    pub fn multiplier_bps_for(&self, _mint: &Pubkey) -> u16 {
        // Placeholder — whitelist table lives in remaining accounts / config extension.
        20_000 // 2.0× for $DRIFT default
    }
}

#[account]
pub struct LevelState {
    pub player: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub staked_at: i64,
    pub duration_secs: i64,
    pub token_multiplier_bps: u16,
    pub early_unstake: bool,
    pub bump: u8,
}

impl LevelState {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 2 + 1 + 1;
}

#[account]
pub struct StakeVault {
    pub player: Pubkey,
    pub bump: u8,
}

impl StakeVault {
    pub const LEN: usize = 8 + 32 + 1;
}

#[account]
pub struct ReviveRecord {
    pub player: Pubkey,
    pub journey_id: [u8; 32],
    pub revive_index: u8,
    pub fee_paid: u64,
    pub bump: u8,
}

impl ReviveRecord {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8 + 1;
}

#[account]
pub struct OddsPool {
    pub journey_id: [u8; 32],
    pub node_id: u16,
    pub close_time: i64,
    pub fee_bps: u16,
    pub authority: Pubkey,
    pub resolved: bool,
    pub winning_outcome: u8,
    pub bump: u8,
}

impl OddsPool {
    pub const LEN: usize = 8 + 32 + 2 + 8 + 2 + 32 + 1 + 1 + 1;
}

#[account]
pub struct OddsPoolEntry {
    pub pool: Pubkey,
    pub player: Pubkey,
    pub outcome: u8,
    pub amount: u64,
    pub bump: u8,
}

impl OddsPoolEntry {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8 + 1;
}

#[account]
pub struct JourneyResult {
    pub journey_id: [u8; 32],
    pub player: Pubkey,
    pub survived: bool,
    pub zone_reached: u16,
    pub result_hash: [u8; 32],
    pub timestamp: i64,
    pub bump: u8,
}

impl JourneyResult {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 2 + 32 + 8 + 1;
}

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = ProtocolConfig::LEN,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub player_token: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = player,
        space = StakeVault::LEN,
        seeds = [b"stake_vault", player.key().as_ref()],
        bump
    )]
    pub stake_vault: Account<'info, StakeVault>,
    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = player,
        space = LevelState::LEN,
        seeds = [b"level", player.key().as_ref()],
        bump
    )]
    pub level_state: Account<'info, LevelState>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub player_token: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"stake_vault", player.key().as_ref()],
        bump
    )]
    pub stake_vault: Account<'info, StakeVault>,
    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"level", player.key().as_ref()],
        bump = level_state.bump,
        has_one = player
    )]
    pub level_state: Account<'info, LevelState>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(journey_id: [u8; 32], revive_index: u8)]
pub struct PayRevive<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub drift_mint: Account<'info, Mint>,
    #[account(mut)]
    pub player_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = player,
        space = ReviveRecord::LEN,
        seeds = [b"revive", player.key().as_ref(), journey_id.as_ref(), &[revive_index]],
        bump
    )]
    pub revive_record: Account<'info, ReviveRecord>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(journey_id: [u8; 32], node_id: u16)]
pub struct CreateOddsPool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = OddsPool::LEN,
        seeds = [b"odds_pool", journey_id.as_ref(), &node_id.to_le_bytes()],
        bump
    )]
    pub odds_pool: Account<'info, OddsPool>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EnterPool<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub odds_pool: Account<'info, OddsPool>,
    #[account(mut)]
    pub player_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = player,
        space = OddsPoolEntry::LEN,
        seeds = [b"odds_entry", odds_pool.key().as_ref(), player.key().as_ref()],
        bump
    )]
    pub odds_entry: Account<'info, OddsPoolEntry>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(journey_id: [u8; 32])]
pub struct PostJourneyResult<'info> {
    pub server_authority: Signer<'info>,
    /// CHECK: player pubkey recorded on result
    pub player: UncheckedAccount<'info>,
    #[account(
        init,
        payer = payer,
        space = JourneyResult::LEN,
        seeds = [b"journey_result", journey_id.as_ref()],
        bump
    )]
    pub journey_result: Account<'info, JourneyResult>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolvePool<'info> {
    #[account(mut)]
    pub odds_pool: Account<'info, OddsPool>,
    pub journey_result: Account<'info, JourneyResult>,
}

#[event]
pub struct StakeEvent {
    pub player: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
    pub duration_secs: i64,
}

#[event]
pub struct UnstakeEvent {
    pub player: Pubkey,
    pub amount: u64,
    pub early: bool,
}

#[event]
pub struct ReviveEvent {
    pub player: Pubkey,
    pub journey_id: [u8; 32],
    pub revive_index: u8,
    pub fee: u64,
}

#[error_code]
pub enum DriftError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid duration")]
    InvalidDuration,
    #[msg("Nothing staked")]
    NothingStaked,
    #[msg("Revive cap reached")]
    ReviveCap,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Pool already resolved")]
    PoolResolved,
    #[msg("Pool closed")]
    PoolClosed,
    #[msg("Unauthorized server authority")]
    UnauthorizedServer,
    #[msg("Journey mismatch")]
    JourneyMismatch,
}
