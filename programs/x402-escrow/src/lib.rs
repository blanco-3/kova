use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("CTRDkdc7fN427u2p3gVHJvosy2GihnRwer5T6CM98xtH");

#[program]
pub mod x402_escrow {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        nonce: u64,
        amount: u64,
        submit_deadline: i64,
        verify_deadline: i64,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        require!(amount > 0, EscrowError::InvalidAmount);
        require!(
            submit_deadline > now,
            EscrowError::InvalidSubmitDeadline
        );
        require!(
            verify_deadline > submit_deadline,
            EscrowError::InvalidVerifyDeadline
        );

        let escrow = &mut ctx.accounts.escrow;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = ctx.accounts.seller.key();
        escrow.mint = ctx.accounts.mint.key();
        escrow.amount = amount;
        escrow.nonce = nonce;
        escrow.result_hash = None;
        escrow.status = EscrowStatus::Created;
        escrow.submit_deadline = submit_deadline;
        escrow.verify_deadline = verify_deadline;
        escrow.bump = ctx.bumps.escrow;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_token_account.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            ),
            amount,
        )?;

        emit!(EscrowCreated {
            escrow: escrow.key(),
            vault_token_account: ctx.accounts.vault_token_account.key(),
            buyer: escrow.buyer,
            seller: escrow.seller,
            mint: escrow.mint,
            nonce,
            amount,
            submit_deadline,
            verify_deadline,
        });

        Ok(())
    }

    pub fn commit_result_hash(
        ctx: Context<CommitResultHash>,
        result_hash: [u8; 32],
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == EscrowStatus::Created,
            EscrowError::InvalidEscrowState
        );
        require!(
            now <= escrow.submit_deadline,
            EscrowError::SubmitDeadlineExpired
        );

        escrow.result_hash = Some(result_hash);
        escrow.status = EscrowStatus::HashCommitted;

        emit!(ResultHashCommitted {
            escrow: escrow.key(),
            seller: escrow.seller,
            result_hash,
            committed_at: now,
        });

        Ok(())
    }

    pub fn verify_and_release(
        ctx: Context<VerifyAndRelease>,
        result_bytes: Vec<u8>,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == EscrowStatus::HashCommitted,
            EscrowError::InvalidEscrowState
        );
        require!(
            now <= escrow.verify_deadline,
            EscrowError::VerifyDeadlineExpired
        );

        let expected_hash = escrow
            .result_hash
            .ok_or(EscrowError::MissingCommittedHash)?;
        let actual_hash = hash(&result_bytes).to_bytes();
        require!(actual_hash == expected_hash, EscrowError::HashMismatch);

        transfer_from_vault(
            escrow,
            &ctx.accounts.vault_token_account,
            &ctx.accounts.seller_token_account,
            &ctx.accounts.token_program,
        )?;

        escrow.status = EscrowStatus::Completed;

        emit!(EscrowReleased {
            escrow: escrow.key(),
            seller: escrow.seller,
            amount: escrow.amount,
            reason: ReleaseReason::Verified,
            settled_at: now,
        });

        Ok(())
    }

    pub fn claim_timeout_refund(ctx: Context<ClaimTimeoutRefund>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;

        if escrow.status == EscrowStatus::Created && now >= escrow.submit_deadline {
            require_keys_eq!(
                ctx.accounts.claimant.key(),
                escrow.buyer,
                EscrowError::UnauthorizedBuyer
            );

            transfer_from_vault(
                escrow,
                &ctx.accounts.vault_token_account,
                &ctx.accounts.buyer_token_account,
                &ctx.accounts.token_program,
            )?;

            escrow.status = EscrowStatus::Refunded;

            emit!(EscrowRefunded {
                escrow: escrow.key(),
                buyer: escrow.buyer,
                amount: escrow.amount,
                reason: RefundReason::SubmitTimeout,
                settled_at: now,
            });

            return Ok(());
        }

        if escrow.status == EscrowStatus::HashCommitted && now >= escrow.verify_deadline {
            require_keys_eq!(
                ctx.accounts.claimant.key(),
                escrow.seller,
                EscrowError::UnauthorizedSeller
            );

            transfer_from_vault(
                escrow,
                &ctx.accounts.vault_token_account,
                &ctx.accounts.seller_token_account,
                &ctx.accounts.token_program,
            )?;

            escrow.status = EscrowStatus::Completed;

            emit!(EscrowReleased {
                escrow: escrow.key(),
                seller: escrow.seller,
                amount: escrow.amount,
                reason: ReleaseReason::BuyerTimeout,
                settled_at: now,
            });

            return Ok(());
        }

        err!(EscrowError::NoTimeoutConditionMet)
    }

    pub fn reject_result(ctx: Context<RejectResult>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == EscrowStatus::HashCommitted,
            EscrowError::InvalidEscrowState
        );
        require!(
            now <= escrow.verify_deadline,
            EscrowError::VerifyDeadlineExpired
        );

        transfer_from_vault(
            escrow,
            &ctx.accounts.vault_token_account,
            &ctx.accounts.buyer_token_account,
            &ctx.accounts.token_program,
        )?;

        escrow.status = EscrowStatus::Disputed;

        emit!(EscrowDisputed {
            escrow: escrow.key(),
            buyer: escrow.buyer,
            amount: escrow.amount,
            disputed_at: now,
        });

        emit!(EscrowRefunded {
            escrow: escrow.key(),
            buyer: escrow.buyer,
            amount: escrow.amount,
            reason: RefundReason::BuyerRejected,
            settled_at: now,
        });

        Ok(())
    }
}

fn transfer_from_vault<'info>(
    escrow: &Account<'info, EscrowVault>,
    vault_token_account: &Account<'info, TokenAccount>,
    destination: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>,
) -> Result<()> {
    let nonce_bytes = escrow.nonce.to_le_bytes();
    let signer_seeds: &[&[u8]] = &[
        b"escrow",
        escrow.buyer.as_ref(),
        escrow.seller.as_ref(),
        &nonce_bytes,
        &[escrow.bump],
    ];

    token::transfer(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            Transfer {
                from: vault_token_account.to_account_info(),
                to: destination.to_account_info(),
                authority: escrow.to_account_info(),
            },
            &[signer_seeds],
        ),
        escrow.amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct CreateEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: seller is validated by the escrow state and ATA constraints later in the flow.
    pub seller: UncheckedAccount<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = buyer,
        space = EscrowVault::SPACE,
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref(), &nonce.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, EscrowVault>,
    #[account(
        mut,
        constraint = buyer_token_account.owner == buyer.key() @ EscrowError::UnauthorizedBuyer,
        constraint = buyer_token_account.mint == mint.key() @ EscrowError::InvalidMint
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = escrow
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CommitResultHash<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(mut, has_one = seller @ EscrowError::UnauthorizedSeller)]
    pub escrow: Account<'info, EscrowVault>,
}

#[derive(Accounts)]
pub struct VerifyAndRelease<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut, has_one = buyer @ EscrowError::UnauthorizedBuyer)]
    pub escrow: Account<'info, EscrowVault>,
    #[account(
        mut,
        constraint = vault_token_account.owner == escrow.key() @ EscrowError::InvalidVaultAuthority,
        constraint = vault_token_account.mint == escrow.mint @ EscrowError::InvalidMint
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = seller_token_account.owner == escrow.seller @ EscrowError::UnauthorizedSeller,
        constraint = seller_token_account.mint == escrow.mint @ EscrowError::InvalidMint
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimTimeoutRefund<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,
    #[account(mut)]
    pub escrow: Account<'info, EscrowVault>,
    #[account(
        mut,
        constraint = vault_token_account.owner == escrow.key() @ EscrowError::InvalidVaultAuthority,
        constraint = vault_token_account.mint == escrow.mint @ EscrowError::InvalidMint
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = buyer_token_account.owner == escrow.buyer @ EscrowError::UnauthorizedBuyer,
        constraint = buyer_token_account.mint == escrow.mint @ EscrowError::InvalidMint
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = seller_token_account.owner == escrow.seller @ EscrowError::UnauthorizedSeller,
        constraint = seller_token_account.mint == escrow.mint @ EscrowError::InvalidMint
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RejectResult<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut, has_one = buyer @ EscrowError::UnauthorizedBuyer)]
    pub escrow: Account<'info, EscrowVault>,
    #[account(
        mut,
        constraint = vault_token_account.owner == escrow.key() @ EscrowError::InvalidVaultAuthority,
        constraint = vault_token_account.mint == escrow.mint @ EscrowError::InvalidMint
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = buyer_token_account.owner == escrow.buyer @ EscrowError::UnauthorizedBuyer,
        constraint = buyer_token_account.mint == escrow.mint @ EscrowError::InvalidMint
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct EscrowVault {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub nonce: u64,
    pub result_hash: Option<[u8; 32]>,
    pub status: EscrowStatus,
    pub submit_deadline: i64,
    pub verify_deadline: i64,
    pub bump: u8,
}

impl EscrowVault {
    pub const SPACE: usize = 8 + 32 + 32 + 32 + 8 + 8 + 33 + 1 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum EscrowStatus {
    Created,
    HashCommitted,
    Completed,
    Refunded,
    Disputed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum ReleaseReason {
    Verified,
    BuyerTimeout,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum RefundReason {
    SubmitTimeout,
    BuyerRejected,
}

#[event]
pub struct EscrowCreated {
    pub escrow: Pubkey,
    pub vault_token_account: Pubkey,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub nonce: u64,
    pub amount: u64,
    pub submit_deadline: i64,
    pub verify_deadline: i64,
}

#[event]
pub struct ResultHashCommitted {
    pub escrow: Pubkey,
    pub seller: Pubkey,
    pub result_hash: [u8; 32],
    pub committed_at: i64,
}

#[event]
pub struct EscrowReleased {
    pub escrow: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub reason: ReleaseReason,
    pub settled_at: i64,
}

#[event]
pub struct EscrowRefunded {
    pub escrow: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub reason: RefundReason,
    pub settled_at: i64,
}

#[event]
pub struct EscrowDisputed {
    pub escrow: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub disputed_at: i64,
}

#[error_code]
pub enum EscrowError {
    #[msg("The escrow amount must be greater than zero.")]
    InvalidAmount,
    #[msg("The submit deadline must be in the future.")]
    InvalidSubmitDeadline,
    #[msg("The verification deadline must be after the submit deadline.")]
    InvalidVerifyDeadline,
    #[msg("The escrow is not in the required state for this operation.")]
    InvalidEscrowState,
    #[msg("The seller submission deadline has expired.")]
    SubmitDeadlineExpired,
    #[msg("The buyer verification deadline has expired.")]
    VerifyDeadlineExpired,
    #[msg("The committed hash is missing.")]
    MissingCommittedHash,
    #[msg("The delivered result hash does not match the committed hash.")]
    HashMismatch,
    #[msg("Only the buyer can perform this action.")]
    UnauthorizedBuyer,
    #[msg("Only the seller can perform this action.")]
    UnauthorizedSeller,
    #[msg("The escrow vault authority is invalid.")]
    InvalidVaultAuthority,
    #[msg("The token mint does not match the escrow configuration.")]
    InvalidMint,
    #[msg("No timeout-based settlement condition has been met.")]
    NoTimeoutConditionMet,
}
