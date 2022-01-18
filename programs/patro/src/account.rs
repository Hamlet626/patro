use std::ops::{ Div};
use anchor_lang::prelude::*;
use crate::{ Pubkey};
use crate::error::PError;
// pub use spl_token::ID;

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
    // pub name:String,
    pub bump:u8,
    pub admin:Pubkey,

    pub authority_bump:u8,
    pub token_addr:Pubkey,

    pub total_supply:u64,
    pub total_distributed:u64,
    pub num_minters:u64,
}

impl Patro {
    pub fn getAPY(&self, amount: &mut u64) -> u64 {
        if self.total_distributed==0 {return 0 as u64; }
        *amount/self.total_distributed
    }

    // pub fn get_mint_auth_signiture<'info>(account: &Account<'info, Patro>)
    //     ->&'info[&'info[u8];3]{
    //     // ->&'info[&'info[&'info[u8]]]{
    //     let seeds:&[&[u8];3] = &[b"ptauth", account.key().to_bytes().as_ref(),
    //         &[account.authority_bump]];
    //     seeds
    //     // &[&seeds[..]]
    // }
}

fn name_seed(name:&str)->&[u8]{
    let b=name.as_bytes();
    if b.len()>32 {&b[0..32] } else { b }
}

#[account]
#[derive(Default)]
pub struct StakeAccount {
    pub patro:Pubkey,
    pub owner:Pubkey,
    pub bump:u8,
    pub amount:u64,
    pub reward:u64,
    pub since:i64,
}

impl StakeAccount {
    pub fn calculate_reward(&mut self, now:i64, rate:u64) ->Result<(),PError>{
        if now<self.since {return Err(PError::LowUserAmount); }
        self.reward+=self.amount*rate*((now-self.since)as u64);
        Ok(())
    }
}
