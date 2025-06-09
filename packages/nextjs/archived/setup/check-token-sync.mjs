import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs';
import { createPublicClient, http, parseAbi } from 'viem';
import { hardhat } from 'viem/chains';

// Set up paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load environment variables from .env.local
const envPath = resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check token counter sync between JSON file, database, and blockchain
 */
async function checkTokenSync() {
  console.log('Checking token counter sync...');
  
  try {
    // 1. Check token counter in JSON file
    const tokenCounterPath = join(__dirname, 'data', 'tokenCounter.json');
    let jsonCounter = 1; // Default value
    
    if (fs.existsSync(tokenCounterPath)) {
      const tokenCounterData = fs.readFileSync(tokenCounterPath, 'utf8');
      const tokenCounter = JSON.parse(tokenCounterData);
      // Check if the counter is in the 'default' property or 'counter' property
      jsonCounter = tokenCounter.default || tokenCounter.counter || 1;
      console.log(`Token counter in JSON file: ${jsonCounter}`);
    } else {
      console.log('Token counter JSON file not found, using default value: 1');
    }
    
    // 2. Check highest token ID in database
    const { data: highestTokenResult, error: dbError } = await supabase
      .from('vehicle_profiles')
      .select('token_id')
      .order('token_id', { ascending: false })
      .limit(1);
    
    if (dbError) {
      console.error('Error querying database:', dbError);
    } else {
      const highestTokenId = highestTokenResult && highestTokenResult.length > 0 
        ? parseInt(highestTokenResult[0].token_id, 10) 
        : 0;
      
      console.log(`Highest token ID in database: ${highestTokenId}`);
      console.log(`Next token ID to mint (from JSON): ${jsonCounter}`);
      
      // The token counter should be the next available token ID
      // If highest token ID is 50, the counter should be 51
      if (highestTokenId + 1 !== jsonCounter) {
        console.warn(`\n⚠️ WARNING: Token counter is out of sync with database!`);
        console.log(`\nExplanation:`);
        console.log(`- The highest token ID in the database is ${highestTokenId}`);
        console.log(`- The token counter is set to ${jsonCounter}`);
        console.log(`- This means the next NFT will be minted with ID ${jsonCounter}`);
        
        if (jsonCounter < highestTokenId + 1) {
          console.warn(`\n❌ PROBLEM: The token counter is too low!`);
          console.warn(`This will cause duplicate token IDs and overwrite existing NFTs.`);
          console.log(`\nFIX: Update tokenCounter.json to {"default": ${highestTokenId + 1}}`);
        } else {
          console.warn(`\n⚠️ CAUTION: The token counter is higher than expected.`);
          console.warn(`This will create gaps in token IDs (${highestTokenId + 1} to ${jsonCounter - 1} will be skipped).`);
          console.log(`\nPossible fixes:`);
          console.log(`1. If this is intentional, no action needed`);
          console.log(`2. To avoid gaps, update tokenCounter.json to {"default": ${highestTokenId + 1}}`);
        }
      } else {
        console.log(`\n✅ GOOD: Token counter (${jsonCounter}) is correctly set to mint the next token ID after the highest in database (${highestTokenId})`);
      }
    }
    
    // 3. Check total supply on blockchain
    try {
      // Load contract ABI and address
      const contractsPath = join(__dirname, 'contracts', 'deployedContracts.ts');
      let contractAddress = '';
      
      if (fs.existsSync(contractsPath)) {
        const contractsContent = fs.readFileSync(contractsPath, 'utf8');
        // Extract the VehicleRegistry contract address using regex
        const addressMatch = contractsContent.match(/VehicleRegistry.*?address: ["']([^"']+)["']/s);
        if (addressMatch && addressMatch[1]) {
          contractAddress = addressMatch[1];
        }
      }
      
      if (!contractAddress) {
        console.warn('Could not find VehicleRegistry contract address');
      } else {
        // Connect to local hardhat node
        const publicClient = createPublicClient({
          chain: hardhat,
          transport: http('http://localhost:8545')
        });
        
        // VehicleRegistry ABI (minimal for totalSupply)
        const abi = parseAbi([
          'function totalSupply() view returns (uint256)'
        ]);
        
        // Get total supply
        const totalSupply = await publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: 'totalSupply'
        });
        
        console.log(`Total supply on blockchain: ${totalSupply.toString()}`);
        
        // Check if blockchain and JSON counter are in sync
        if (totalSupply.toString() !== (jsonCounter - 1).toString()) {
          console.warn(`WARNING: Blockchain and JSON counter are out of sync!`);
          console.warn(`Blockchain total supply = ${totalSupply}, JSON counter - 1 = ${jsonCounter - 1}`);
        } else {
          console.log('✅ Blockchain and JSON counter are in sync');
        }
      }
    } catch (error) {
      console.error('Error checking blockchain:', error.message);
      console.log('Make sure your local hardhat node is running');
    }
    
  } catch (error) {
    console.error('Error checking token sync:', error);
  }
}

// Run the function
checkTokenSync().catch(console.error);