import React, { useEffect, useMemo, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Keypair } from '@solana/web3.js';
import { Game, maxX, maxY } from "@/components/game";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import crypto from "crypto";
import naclUtil from 'tweetnacl-util';
import nacl from "tweetnacl";
import dynamic from 'next/dynamic';
import { createRoom } from '@/components/solana';

let socket: Socket; // URL of your signaling server
let dataChannel: RTCDataChannel;
let wallet: Keypair;
export type Block = {
  num: number;
  data: string;
  timestamp: number;
}
export type BlockData = {
  // add lastBlock: Block;
  type: string;
  block: string;
  // hash: string
  sig1: string;
  pub1: string;
  pub2: string;
  sig2: string;
}
let ran = 0;
let playerNum: 1 | 2;
let canvas: HTMLCanvasElement;
let width: number, height: number;
let ctx: CanvasRenderingContext2D;
let game: Game;
let backgroundImage: HTMLImageElement;
let blockNum = 0;
let lastSignedBlock: Block;
const WalletDisconnectButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
  { ssr: false }
);
const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);
export default function App() {
  const [localPeerId, setLocalPeerId] = useState('');
  const localPeer = useRef<RTCPeerConnection>();
  const [remotePeerId, setRemotePeerId] = useState('');
  const data = useWallet();
  // You can also provide a custom RPC endpoint
  useEffect(() => {
    if (data) {
      createRoom(data).then(console.log);
    }
  }, [data])
  useEffect(() => {
    socket = io(process.env.REACT_APP_BACKEND_URL!);
    socket.on('connect', () => {
      setLocalPeerId(socket.id!);
    }); 
    console.log(process.env.REACT_APP_BACKEND_URL!);
    // blah
    let _wallet = Keypair.generate();
    wallet = _wallet;
    console.log(wallet.publicKey, wallet.secretKey);
    // Initialize peer connection
    localPeer.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    dataChannel = localPeer.current.createDataChannel("data");
    dataChannel.onopen = () => console.log("data channel opened");
    dataChannel.onerror = console.error;
    dataChannel.onmessage = receiveMessage;
    localPeer.current.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = receiveMessage;
      receiveChannel.onopen = () => {
        console.log(`Data channel recieved! I am ${playerNum}`);
        serializeSignAndSend();
      };
      receiveChannel.onclose = () => console.log("Data channel closed");
    }
    // Listen for ICE candidates and send them to the peer
    localPeer.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("received candidate");
        socket.emit('candidate', { candidate: event.candidate, to: remotePeerId });
      }
    };

    // Handle receiving offers
    socket.on('offer', async ({ offer, from }) => {
      console.log("received offer");
      if (!localPeer.current) return;
      setRemotePeerId(from);
      await localPeer.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await localPeer.current.createAnswer();
      await localPeer.current.setLocalDescription(answer);
      socket.emit('answer', { answer, to: from });
      playerNum = 2;
    });

    // Handle receiving answers
    socket.on('answer', async ({ answer }) => {
      console.log("received answer");
      if (!localPeer.current) return;
      const remoteDesc = new RTCSessionDescription(answer);
      await localPeer.current.setRemoteDescription(remoteDesc);
      playerNum = 1;
      // playernum is 1, so I am player 1, so I request the chain's data
    });

    // Handle receiving ICE candidates
    socket.on('candidate', async ({ candidate }) => {
      if (!localPeer.current) return;
      await localPeer.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket.off('connect');
      socket.off('offer');
      socket.off('answer');
      socket.off('candidate');
    };
  }, []);
  const serializeSignAndSend = async (prevBlock?: Block) => {
    if (dataChannel.readyState === "open") {
      const data = JSON.stringify(game.serialize());
      blockNum = prevBlock ? prevBlock.num + 1 : 0;
      //console.log(blockNum);
      const block: Block = {
        data,
        num: blockNum,
        timestamp: Date.now(),
      };
      const blockhash = crypto.createHash('sha256').update(JSON.stringify(block)).digest("hex");
      const hashUint8 = naclUtil.decodeUTF8(blockhash);
      const sig = Buffer.from(nacl.sign.detached(hashUint8, wallet.secretKey)).toString();
      const blockData: BlockData = {
        type: "__data",
        block: JSON.stringify(block),
        sig1: playerNum === 1 ? sig : "",
        pub1: playerNum === 1 ? wallet.publicKey.toString() : "",
        sig2: playerNum === 2 ? sig : "",
        pub2: playerNum === 2 ? wallet.publicKey.toString() : ""
      }
      if(prevBlock) lastSignedBlock = block;
      dataChannel.send(JSON.stringify(blockData));
    }
  }
  const verifySig = (data: BlockData): boolean => {
    // Assuming BlockData and playerNum are defined similarly to your signing function
    // Determine which signature and public key to verify based on playerNum
    const sigToVerify = playerNum === 1 ? data.sig2 : data.sig1;
    const pubKeyToVerify = playerNum === 1 ? data.pub2 : data.pub1;
  
    // Hash the block data as before
    const blockhash = crypto.createHash('sha256').update(data.block).digest("hex");
    const hashUint8 = naclUtil.decodeUTF8(blockhash);
  
    // Convert the signature and public key from hex strings back to Uint8Array
    const signatureUint8 = naclUtil.decodeBase64(sigToVerify);
    const publicKeyUint8 = naclUtil.decodeBase64(pubKeyToVerify); // Assuming the public keys are stored in base64 format
  
    // Verify the signature
    return nacl.sign.detached.verify(hashUint8, signatureUint8, publicKeyUint8);
  }
  const receiveMessage = async (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    const { type } = data; 
    // console.log(event.data);
    switch(type) {
      case "__handshake": {
        break;
      }
      case "__data": {
        const block: Block = JSON.parse(data.block);
        // console.log(block);
        const sigstatus = verifySig(data)
        const orderstatus = block.num === blockNum + 1; // assert this is next block
        const verifystatus = game.verify(block);
        new Promise((resolve) => setTimeout(resolve, 1000 / 240)).then(() => {
          gameFrame();
          serializeSignAndSend(block);
        });
        break;
      }
      default: {
        console.log(`Type: ${type}`);
        break;
      }
    }
  }
  const callPeer = async () => {
    if (!localPeer.current) return;
    const offer = await localPeer.current.createOffer();
    await localPeer.current.setLocalDescription(offer);
    socket.emit('offer', { offer, to: remotePeerId });
  };
  const sendJson = async () => {
    if (dataChannel.readyState === "open") {
      dataChannel.send(JSON.stringify({text: `Hello from ${playerNum}`}));
      console.log("JSON sent");
    } else {
      console.log("data channel is not open");
    }
  }
  useEffect(() => {
    ran++;
    if (ran === 2) return;
    if (window.innerWidth < 768) {
        width = 300;
        height = 300;
    } else {
        width = 600;
        height = 600;
    }
    backgroundImage = document.createElement("img");
    backgroundImage.src = "/space_background.png";
    canvas = document.getElementById("gameField") as HTMLCanvasElement;
    ctx = canvas.getContext("2d")!;
    game = new Game(canvas, ctx);
    canvas.width = width;
    canvas.height = height;
}, []);
const clearCanvas = (currentCenter: number[]) => {
    let [x, y] = currentCenter;
    ctx.save();
    ctx.translate(-1 * x, -1 * y);
    ctx.drawImage(backgroundImage, 0, 0, 2 * maxX, 2 * maxY);
    ctx.strokeStyle = "red";
    ctx.strokeRect(canvas.width / 2, canvas.height / 2, maxX, maxY);
    ctx.restore();

};
const gameFrame = () => {
    clearCanvas([game.me.x, game.me.y]);
    game.draw(canvas, ctx);
    // player.draw(canvas.width / 2, canvas.height / 2, gameObjectList);
    //console.log("Game frame");
};
  return (
      <div className="flex flex-col justify-center items-center">
      {/* <u>super smash cousins</u> */}
      <p>Space Duel</p>
      <div>
        <WalletMultiButtonDynamic />
      </div>
      <div>Your ID: {localPeerId}</div>
      <div className="row" style={{gap: "10px"}}>
        <input
          type="text"
          placeholder="Remote Peer ID"
          value={remotePeerId}
          onChange={(e) => setRemotePeerId(e.target.value)}
        />
        <button onClick={callPeer}>Call Peer</button>
        <button onClick={sendJson}>Send JSON to Peer</button>
      </div>
      <div>
        <div className="flex flex-col items-center">
          <div style={{ width: width, height: height }}>
              <canvas className="bg-black" id="gameField"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

