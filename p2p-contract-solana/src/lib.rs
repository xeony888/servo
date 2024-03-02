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
    pub fn open_dispute(ctx: Context<OpenDispute>) -> Result<()> {
        // let room = &mut ctx.accounts.room;
        // if ctx.accounts.opener.key() == room.player1 {
        //     room.dispute.last1 = ctx.accounts.my_block;
        // } else if ctx.accounts.opener.key() == room.player2 {
        //     room.dispute.last2 = ctx.accounts.my_block;
        // } else {
        //     Err(ErrorCode::NotAMember.into())
        // }
        // room.dispute.disputed = ctx.accounts.disputed;
        // room.dispute.opener = ctx.accounts.opener;
        // Ok(())
        Ok(())
    }
    pub fn close_dispute(ctx: Context<CloseDispute>) -> Result<()> {
        // let room = &mut ctx.accounts.room;
        // if ctx.accounts.closer.key() == room.player1 {

        // } else if ctx.accounts.closer.key() == room.player2 {

        // } else {
        //     Err(ErrorCode::NotAMember.into())
        // }
        // Ok(())
        Ok(())
    }
    // }
    // pub fn verify(before: Block, after: Block) {
    //     for op in after.operations {
    //         if op == 1 {
    //             // do first op...
    //         }
    //         //... etc
    //     }
    // }   
}
#[error_code]
pub enum ErrorCode {
    #[msg("Uninitialized Room")]
    UninitializedRoom,

    #[msg("Room already initialized with two players")]
    RoomAlreadyInitialized,

    #[msg("You are not a member of the room")]
    NotAMember
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
pub struct Player {
    x: f64,
    y: f64,
    angle: f64,
    health: u8,
}
pub struct Asteroid {
    x: f64,
    y: f64
}
pub struct Bullet {
    x: f64,
    y: f64,
    angle: f64
}
pub struct BlockData {
    me: Player,
    other: Player,
    asteroids: Vec<Asteroid>,
    my_bullets: Vec<Bullet>,
    other_bullets: Vec<Bullet>
}
#[account]
pub struct Block {
    data: BlockData,
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
#[derive(Accounts)]
pub struct OpenDispute<'info> {
    pub room: Account<'info, Room>,
    pub opener: Signer<'info>,
    pub disputed: Account<'info, Block>,
    pub my_block: Account<'info, Block>
}   

#[derive(Accounts)]
pub struct CloseDispute<'info> {
    pub room: Account<'info, Room>,
    pub closer: Signer<'info>,
    pub my_block: Account<'info, Block>
}