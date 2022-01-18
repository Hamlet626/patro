mod account;
mod error;
mod macros;

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount,transfer, Transfer};

use crate::account::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod patro {
    use std::borrow::BorrowMut;
    use anchor_spl::token::{mint_to, MintTo};
    use super::*;

    pub fn initialize(ctx: Context<Initialize>,bump:u8,ptauthbump:u8) -> ProgramResult {
        let patro=&mut ctx.accounts.patro;
        patro.bump=bump;
        patro.authority_bump=ptauthbump;
        patro.admin= *ctx.accounts.admin.key;
        patro.token_addr=ctx.accounts.token_addr.key();

        Ok(())
    }

    pub fn create_stake(ctx:Context<CreateStake>, bump:u8) ->ProgramResult{
        let stakeacc=&mut ctx.accounts.stake_account;
        stakeacc.patro= ctx.accounts.patro.key();
        stakeacc.owner=ctx.accounts.owner.key();
        stakeacc.bump=bump;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount:u64)->ProgramResult{
        let patro=&mut ctx.accounts.patro;
        let stakeacc=&mut ctx.accounts.stake_account;
        let useracc= &mut ctx.accounts.user_account;

        transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(),
                                 Transfer{
                                     from: useracc.to_account_info(),
                                     to: stakeacc.to_account_info(),
                                     authority: ctx.accounts.owner.to_account_info()
                                 }), amount)?;

        let apy=patro.getAPY(stakeacc.amount.borrow_mut());
        stakeacc.calculate_reward(ctx.accounts.clock.unix_timestamp,apy)?;

        stakeacc.amount+=amount;

        Ok(())
    }
    pub fn mintTo(ctx:Context<Mint2>,amount:u64)->ProgramResult{

        let patro= &mut ctx.accounts.patro;

        mint_to(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), MintTo{
            mint: ctx.accounts.token_mint.to_account_info(),
            to: ctx.accounts.user_account.to_account_info(),
            authority: ctx.accounts.mint_auth.to_account_info(),
        }, &[&get_mint_auth_signiture!(patro)[..]]), amount)?;

        patro.total_supply+=amount;
        patro.total_distributed+=amount;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8, ptauthbump:u8)]
pub struct Initialize<'info> {
    #[account(init,
    seeds=[b"patro",admin.to_account_info().key.as_ref()],
    bump=bump,payer=admin)]
    pub patro:Account<'info,Patro>,

    #[account(
    constraint=token_addr.mint_authority.contains(&authority.key()))]
    pub token_addr:Account<'info,Mint>,
    #[account(seeds=[b"ptauth",
    patro.key().to_bytes().as_ref()],
    bump=ptauthbump)]
    pub authority:AccountInfo<'info>,

    pub admin:Signer<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateStake<'info>{
    #[account(mut)]
    pub patro:Account<'info,Patro>,
    pub owner:Signer<'info>,
    #[account(init,seeds=[b"staker",
    owner.key().to_bytes().as_ref(),
    patro.key().to_bytes().as_ref()],
    bump=bump,payer=owner)]
    pub stake_account:Account<'info, StakeAccount>,

    // constraint=mint.mint_authority.contains(&patro.authority.key())
    #[account(
    address=patro.token_addr)]
    pub mint:Account<'info,Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Stake<'info>{
    #[account(mut)]
    pub patro:Account<'info,Patro>,
    pub owner:Signer<'info>,
    #[account(mut, has_one=patro)]
    pub stake_account:Account<'info, StakeAccount>,

    #[account(
    address=patro.token_addr
    )]
    pub mint:Account<'info,Mint>,
    #[account(mut,has_one=owner,
    constraint=user_account.amount>=amount)]
    pub user_account:Account<'info,TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Mint2<'info>{
    #[account(mut,has_one=admin)]
    pub patro:Account<'info,Patro>,
    pub admin:Signer<'info>,

    #[account(seeds=[b"ptauth", patro.key().to_bytes().as_ref()],
    bump=patro.authority_bump)]
    pub mint_auth:AccountInfo<'info>,
    #[account(mut,address=patro.token_addr)]
    pub token_mint:Account<'info,Mint>,
    #[account(constraint=user_account.mint==token_mint.key())]
    pub user_account:Account<'info,TokenAccount>,
    pub token_program: Program<'info, Token>,
}
