use anchor_lang::prelude::*;

#[error]
pub enum PError {
    #[msg("user account has insufficient amount to stake")]
    LowUserAmount,

    #[msg("patro distributed is zero")]
    NoDistributed,
}