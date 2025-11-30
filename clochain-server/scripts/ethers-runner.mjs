#!/usr/bin/env node
import { ethers } from "ethers";

const ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string", "name": "tokenURI", "type": "string" }
    ],
    "name": "mintAuthenticityToken",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function mint({ rpcUrl, privateKey, contractAddress, to, tokenUri }) {
  const recipient = ethers.getAddress(to);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ABI, wallet);

  if (!tokenUri) {
    throw new Error("tokenURI is required");
  }

  const tx = await contract.mintAuthenticityToken(recipient, tokenUri);
  const receipt = await tx.wait();

  let tokenId = null;
  try {
    const transferEvents = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter((event) => event.name === "Transfer");
    if (transferEvents.length > 0) {
      tokenId = transferEvents[0].args.tokenId.toString();
    }
  } catch {
    tokenId = null;
  }

  return {
    txHash: tx.hash,
    blockNumber: Number(receipt.blockNumber),
    tokenId
  };
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === "mint") {
      const [rpcUrl, privateKey, contractAddress, to, tokenUri] = args;
      if (!rpcUrl || !privateKey || !contractAddress || !to || !tokenUri) {
        throw new Error("Missing mint arguments");
      }
      const result = await mint({ rpcUrl, privateKey, contractAddress, to, tokenUri });
      process.stdout.write(JSON.stringify(result));
      return;
    }
    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    process.stderr.write(error.message ?? "Mint failed");
    process.exitCode = 1;
  }
}

main();
