//! Macros.

#[macro_export]
macro_rules! get_mint_auth_signiture {
    ($wrapper:expr) => {
        &[
            b"ptauth" as &[u8],
            &$wrapper.key().to_bytes(),
            &[$wrapper.authority_bump],
        ]
    };
}
