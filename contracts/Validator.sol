// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use xconsole.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";


contract Validator is Ownable {
    using ECDSA for bytes32;
    struct Room {
        address player1;
        address player2;
        uint timestamp;
        Dispute dispute;
    }
    struct Dispute {
        address opener;
        Block disputed;
        Block last1;
        Block last2;
    }
    struct Block {
        string data;
        uint num;
        uint[] operations; // operations done on previous block to get here
        uint timestamp;
        bytes sig1;
        bytes sig2;
    }
    event DisputeAdded(address opener, uint id);
    event DisputeResult(Block b, bytes sig);
    mapping(uint => Room) rooms;
    uint count;
    constructor() Ownable(msg.sender) {
        count = 0;
    }
    function createRoom() external returns(uint id, address payable addr) {
        // todo: make sure that user cannot create multiple rooms
        require(addr == msg.sender, "Invalid address");
        Room memory r;
        r.player1 = msg.sender;
        count++;
        rooms[count] = r;
        id = count;
    }
    function joinRoom(uint id, address payable addr) external {
        require(addr == msg.sender, "Invalid address");
        Room storage r = rooms[id];
        require(r.player1 != address(0), "Uninitialized Room");
        require(r.player2 == address(0), "Initialized Room");
        r.player2 = msg.sender;
        r.timestamp = block.timestamp;
    }
    function openDispute(uint id, Block memory disputed, Block memory last) external {
        Room storage r = rooms[id];
        require(r.player1 != address(0) && r.player2 != address(0), "Room not initialized");
        require(r.player1 == msg.sender || r.player2 == msg.sender, "Not in room");
        require(r.dispute.opener == address(0), "A dispute is already initialized");
        bytes32 h = keccak256(abi.encode(last.data));
        require(verifySignature(h, last.sig1, r.player1), "Player 1 signature invalid");
        require(verifySignature(h, last.sig2, r.player2), "Player 2 signature invalid");
        Dispute memory d;
        d.disputed = disputed;
        d.opener = msg.sender;
        if (msg.sender == r.player1) {
            d.last1 = last;
        } else {
            d.last2 = last;
        }
        r.dispute = d;
        emit DisputeAdded(msg.sender, id);
    }
    function closeDispute(uint id, Block memory last) external {
        Room storage r = rooms[id];
        require(r.dispute.opener != address(0) && r.dispute.opener != msg.sender, "No dispute found");
        require(r.player1 == msg.sender || r.player2 == msg.sender, "Not in room");
        bytes32 h = keccak256(abi.encode(last.data));
        require(verifySignature(h, last.sig1, r.player1), "Player 1 signature invalid");
        require(verifySignature(h, last.sig2, r.player2), "Player 2 signature invalid");
        if (msg.sender == r.player1) {
            r.dispute.last1 = last;
        } else {
            r.dispute.last2 = last;
        }
        if (r.dispute.last2.num > r.dispute.last1.num) {
            if (validate(r.dispute.last2, r.dispute.disputed)) {
                // bytes32 h = keccak256(abi.encode(r.dispute.disputed.data));
                // emit DisputeResult(r.dispute.disputed, h);
            } else {

            }
        } else {
            if (validate(r.dispute.last1, r.dispute.disputed)) {

            } else {

            }
        }
    }
    function validate(Block memory _before, Block memory _after) private pure returns(bool) {
        // check whether performing the operations is possible
        // check whether performing the operations results in after
        // this validation function would validate the blocks
        return true;
    }
    function verifySignature(bytes32 h, bytes memory signature, address signerAddress) public pure returns(bool) {
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", h));
        // Recover the signer address from the signature
        address recoveredSigner = ethSignedMessageHash.recover(signature);

        // Compare the recovered signer to the expected signer
        return recoveredSigner == signerAddress;
    }
    function verifyWinner(Block memory b) private pure returns(uint) {
        // verify if b is a winning block
        // return 0 if not, 1 if player 1, 2 if player 2;
        return 1;
    }
    function endGame(uint id, Block memory endBlock) external {
        Room storage r = rooms[id];
        require(msg.sender == r.player1 || msg.sender == r.player2, "No permissions");
        bytes32 h = keccak256(abi.encode(endBlock.data));
        require(verifySignature(h, endBlock.sig1, r.player1), "Player 1 signature invalid");
        require(verifySignature(h, endBlock.sig2, r.player2), "Player 2 signature invalid");
        uint winner = verifyWinner(endBlock);
        // if (winner == 0) {

        // } else if (winner == 1) {

        // } else {

        // }
        delete rooms[id];
        if (winner == 1) {
            
        }
    }
}
