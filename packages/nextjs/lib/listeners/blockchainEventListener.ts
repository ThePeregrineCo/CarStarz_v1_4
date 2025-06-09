import { createPublicClient, http, parseAbiItem } from "viem";
import { hardhat } from "viem/chains";
import { blockchainEventService } from "../services/BlockchainEventService";
import { getSupabaseClient } from "../supabase";

// Contract address for the NFT contract
const NFT_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// ABI for the Transfer event
const TRANSFER_EVENT_ABI = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)");

/**
 * Start listening for blockchain events
 * This function sets up listeners for Transfer events from the NFT contract
 */
export async function startBlockchainEventListener() {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Not in browser environment, skipping blockchain event listener");
      return false;
    }
    
    console.log("Starting blockchain event listener...");
    
    // Check if the blockchain_events table exists
    // If not, we'll create it
    await checkAndCreateBlockchainEventsTable();
    
    // Create a public client to interact with the blockchain
    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http("http://localhost:8545"),
    });
    
    // Set up a listener for Transfer events
    publicClient.watchEvent({
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      event: TRANSFER_EVENT_ABI,
      onLogs: async (logs) => {
        for (const log of logs) {
          try {
            const { args } = log;
            
            if (!args) continue;
            
            const { from, to, tokenId } = args;
            
            // Check if this is a mint event (from is zero address)
            const isMint = from === "0x0000000000000000000000000000000000000000";
            
            if (isMint) {
              console.log(`Mint event detected for token ID ${tokenId} to ${to}`);
              
              // Process the mint event
              await blockchainEventService.processMintEvent(
                Number(tokenId),
                to as string,
                log.transactionHash
              );
            } else {
              console.log(`Transfer event detected for token ID ${tokenId} from ${from} to ${to}`);
              
              // Process the transfer event
              await blockchainEventService.processTransferEvent(
                Number(tokenId),
                from as string,
                to as string,
                log.transactionHash
              );
            }
          } catch (error) {
            console.error("Error processing event log:", error);
          }
        }
      },
    });
    
    console.log("Blockchain event listener started successfully");
    
    // Also process any pending events that might have been missed
    setInterval(async () => {
      try {
        const processedCount = await blockchainEventService.processPendingEvents();
        if (processedCount > 0) {
          console.log(`Processed ${processedCount} pending blockchain events`);
        }
      } catch (error) {
        console.error("Error processing pending events:", error);
      }
    }, 60000); // Check every minute
    
    return true;
  } catch (error) {
    console.error("Error starting blockchain event listener:", error);
    return false;
  }
}

/**
 * Check if the blockchain_events table exists and create it if it doesn't
 */
async function checkAndCreateBlockchainEventsTable() {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Not in browser environment, skipping blockchain_events table check");
      return;
    }
    
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('Failed to get Supabase client');
      return;
    }
    
    // Check if the blockchain_events table exists
    const { error } = await supabase
      .from('blockchain_events')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') {
      console.log('blockchain_events table does not exist, creating it...');
      
      // Create the blockchain_events table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS blockchain_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_type TEXT NOT NULL,
          token_id INTEGER NOT NULL,
          from_address TEXT,
          to_address TEXT NOT NULL,
          transaction_hash TEXT NOT NULL,
          status TEXT NOT NULL,
          retry_count INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMPTZ
        );
        
        CREATE INDEX IF NOT EXISTS idx_blockchain_events_status ON blockchain_events(status);
        CREATE INDEX IF NOT EXISTS idx_blockchain_events_token_id ON blockchain_events(token_id);
        
        CREATE OR REPLACE FUNCTION increment_retry_count(event_id UUID)
        RETURNS VOID AS $$
        BEGIN
          UPDATE blockchain_events
          SET retry_count = retry_count + 1
          WHERE id = event_id;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      // Execute the SQL directly
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.error('Error creating blockchain_events table:', createError);
        
        // If the exec_sql function doesn't exist, we can't create the table
        if (createError.message.includes('function exec_sql') || createError.code === '42883') {
          console.log('exec_sql function does not exist, skipping table creation');
        }
      } else {
        console.log('blockchain_events table created successfully');
      }
    } else if (error) {
      console.error('Error checking if blockchain_events table exists:', error);
    } else {
      console.log('blockchain_events table already exists');
    }
  } catch (error) {
    console.error('Error checking/creating blockchain_events table:', error);
  }
}

/**
 * Initialize the blockchain event listener
 * This function is called when the application starts
 */
export function initializeBlockchainEventListener() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log("Not in browser environment, skipping blockchain event listener initialization");
    return;
  }
  
  // Start the blockchain event listener in the background
  startBlockchainEventListener()
    .then((success) => {
      if (success) {
        console.log("Blockchain event listener initialized successfully");
      } else {
        console.error("Failed to initialize blockchain event listener");
      }
    })
    .catch((error) => {
      console.error("Error initializing blockchain event listener:", error);
    });
}