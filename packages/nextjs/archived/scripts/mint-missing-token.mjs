/**
 * ARCHIVED: May 29, 2025
 * 
 * This script has been archived as part of implementing the commit-confirm pattern for NFT minting.
 * 
 * Reasons for archiving:
 * - This is a utility script for minting a specific token
 * - It doesn't follow the commit-confirm pattern
 * - It directly interacts with the blockchain without the verification step
 * 
 * The new implementation separates the minting process into two steps:
 * 1. Prepare metadata and get token ID
 * 2. Mint on blockchain and verify before creating database records
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { hardhat } from 'viem/chains';

// Configuration
const TOKEN_ID = 6; // The token ID to mint
const RPC_URL = 'http://localhost:8545'; // Local Hardhat node
const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'; // VehicleRegistry contract address

// Contract ABI for VehicleRegistry
const contractAbi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "vin",
        type: "string",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "metadataURI",
        type: "string",
      },
    ],
    name: "mintVehicleWithId",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Create viem clients
const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(RPC_URL),
});

// Use the vehicle data we already have from our previous check
function getVehicleData() {
  console.log(`Using vehicle data for token ID ${TOKEN_ID}...`);
  
  // This is the data we found in the database
  const vehicleData = {
    id: '1ecb8885-d8d7-44cd-8b8b-a390893fe695',
    token_id: 6,
    vin: 'JN1AR5EF0EM270540',
    make: 'Mercedes',
    model: 'G63',
    year: 2015,
    name: 'Big G',
    description: '2015 Mercedes G63',
    owner_wallet: '0x080f4735e86a3b302b5abea8e9a092839013d2dc',
    created_at: '2025-05-29T14:12:37.969132+00:00',
    updated_at: '2025-05-29T14:12:37.969132+00:00'
  };
  
  console.log('Vehicle data:', vehicleData);
  return vehicleData;
}

async function mintToken() {
  try {
    console.log(`Starting to mint token ID ${TOKEN_ID} on the blockchain...`);
    
    // Get vehicle data
    const vehicleData = getVehicleData();
    
    if (!vehicleData) {
      throw new Error(`No vehicle data found for token ID ${TOKEN_ID}`);
    }
    
    // Use a hardcoded account for the local hardhat node
    // The first account in hardhat is always 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    const deployerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    console.log(`Using account ${deployerAddress} to mint token...`);
    
    // Create wallet client with the private key for the first hardhat account
    // The private key for the first hardhat account is always 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
    const walletClient = createWalletClient({
      account: deployerAddress,
      chain: hardhat,
      transport: http(RPC_URL),
    });
    
    // Prepare metadata URI
    const metadataURI = `/metadata/${TOKEN_ID}.json`;
    
    // Mint the token
    console.log(`Minting token with ID ${TOKEN_ID}, VIN ${vehicleData.vin}, name ${vehicleData.name}, and metadata URI ${metadataURI}...`);
    
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractAbi,
      functionName: 'mintVehicleWithId',
      args: [BigInt(TOKEN_ID), vehicleData.vin, vehicleData.name, metadataURI],
    });
    
    console.log(`Transaction sent: ${hash}`);
    console.log('Waiting for transaction confirmation...');
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Verify the token was minted
    const owner = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: contractAbi,
      functionName: 'ownerOf',
      args: [BigInt(TOKEN_ID)],
    });
    
    console.log(`Token ${TOKEN_ID} is now owned by ${owner}`);
    
    // Check if the owner in the database matches the owner on the blockchain
    if (owner.toLowerCase() !== vehicleData.owner_wallet.toLowerCase()) {
      console.warn(`Warning: Owner mismatch between database (${vehicleData.owner_wallet}) and blockchain (${owner})`);
      console.warn('You may need to update the owner in the database to match the blockchain.');
    } else {
      console.log('Owner in database matches owner on blockchain.');
    }
    
    console.log('✅ Token minted successfully!');
  } catch (error) {
    console.error('❌ Error minting token:', error);
  }
}

// Run the script
mintToken();