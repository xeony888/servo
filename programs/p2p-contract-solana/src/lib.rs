use anchor_lang::prelude::*;

declare_id!("6Vx6kqd7ngW341teSFzBPnrEGD8fKPxiwvBDqdQRKK8o");
#[program]
pub mod p2p_contract_solana {
    use super::*;
    use anchor_lang::solana_program::clock::Clock;

    pub fn create_room(ctx: Context<CreateRoom>) -> Result<()> {
        let room = &mut ctx.accounts.room;
        room.player1 = ctx.accounts.user.key();
        room.player2 = Pubkey::default();
        Ok(())
    }
    pub fn join_room(ctx: Context<JoinRoom>) -> Result<()> {
        let room = &mut ctx.accounts.room;

        if room.player1 == Pubkey::default() {
            return Err(ErrorCode::UninitializedRoom.into())
        }
        if room.player2 != Pubkey::default() {
            return Err(ErrorCode::RoomAlreadyInitialized.into())
        }
        room.player2 = ctx.accounts.player2.key();
        room.timestamp = Clock::get().unwrap().unix_timestamp;
        Ok(())
    }
}
#[error_code]
pub enum ErrorCode {
    #[msg("Uninitialized Room")]
    UninitializedRoom,

    #[msg("Room already initialized with two players")]
    RoomAlreadyInitialized,
}
#[account]
pub struct Room {
    player1: Pubkey,
    player2: Pubkey,
    timestamp: i64,
    dispute: Dispute,
}
#[account]
pub struct Dispute {
    opener: Pubkey,
    disputed: Block,
    last1: Block,
    last2: Block,
}
#[account]
pub struct Block {
    data: String,
    num: u64,
    operations: Vec<u64>,
    timestamp: i64,
    sig1: Vec<u8>,
    sig2: Vec<u8>,
}
#[derive(Accounts)]
pub struct CreateRoom<'info> {
    pub room: Account<'info, Room>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>
}
#[derive(Accounts)]
pub struct JoinRoom<'info> {
    #[account(mut)]
    pub room: Account<'info, Room>,
    pub player2: Signer<'info>
}