import { AnchorProvider, Program, setProvider } from '@project-serum/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import idl from "./idl.json";
const programId = "Ao37gdr2XVcJMnYajGXExYCJPTbXxwVobmcqtstJLgbE";


export async function createRoom(wallet: any) {
    const connection = new Connection("https://api.devnet.solana.com", "processed");
    const provider = new AnchorProvider(
        connection,
        wallet,
        {preflightCommitment: "processed"}
    )
    setProvider(provider);
    
    // Load your IDL.

    // Address of the deployed program.
    const id = new PublicKey(programId);
    // Generate the program client from IDL.
    // @ts-ignore
    const program = new Program(idl, id, provider);

    // Create accounts, interact with the contract, etc.
    // Example: creating a room.
    const room = Keypair.generate();
    await program.rpc.createRoom({
        accounts: {
            room: room.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        },
        signers: [room],
    });
}

export async function joinRoom(wallet: any, roomPublicKeyStr: string) {
    const connection = new Connection("https://api.devnet.solana.com", "processed");
    const provider = new AnchorProvider(
        connection,
        wallet,
        { preflightCommitment: "processed" }
    );
    setProvider(provider);

    // Address of the deployed program.

    const pid = new PublicKey(programId);
    // Initialize the program from IDL
    // @ts-ignore
    const program = new Program(idl, pid, provider);

    // Convert room public key string to PublicKey
    const roomPublicKey = new PublicKey(roomPublicKeyStr);

    // Assuming the joinRoom function requires the player2 (current user) to sign and join an existing room.
    // You would need to adjust the accounts and parameters according to your actual function requirements.
    await program.rpc.joinRoom({
        accounts: {
            room: roomPublicKey, // The public key of the room to join
            player2: provider.wallet.publicKey, // The current user's wallet public key
            systemProgram: SystemProgram.programId, // System program ID
        },
        signers: [], // Since the user's wallet will sign the transaction, no additional signers are needed here
    });
}