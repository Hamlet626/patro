use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod patro {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>,bump:u8) -> ProgramResult {
        let patro=&mut ctx.accounts.patro;
        patro.bump=bump;
        patro.base_account=ctx.accounts.base_account.key();
        patro.admin= *ctx.accounts.admin.key;
        patro.token_addr=ctx.accounts.token_addr.key();

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(init,
    seeds=[b"patro",
    admin.to_account_info().key.to_bytes().as_ref(),
    token_addr.key().to_bytes().as_ref()],
    bump=bump,payer=admin)]
    pub patro:Account<'info,Patro>,

    #[account(mut)]
    pub token_addr:Account<'info,Mint>,
    pub base_account:AccountInfo<'info>,
    pub admin:Signer<'info>,
    pub system_program: Program<'info, System>,
}

///overall Token Program,
/// etc token number,price, other stats,operation
///
/// seeds=[b"patro",
///     admin.key.as_ref(),
///     token_addr.key.as_ref(),
///     bump]
#[account]
#[derive(Default)]
pub struct Patro{
    pub bump:u8,
    pub admin:Pubkey,

    pub base_account:Pubkey,
    pub token_addr:Pubkey,

    pub total_supply:u64,
    pub total_distributed:u64,
    pub num_minters:u64,
}