import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'OK' : 'MISSING'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'OK' : 'MISSING'}`);
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertIdentityRegistryData() {
  try {
    console.log('Inserting data into identity_registry table...');
    
    // Get all vehicle profiles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicle_profiles')
      .select('*');
    
    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError);
      return;
    }
    
    console.log(`Found ${vehicles.length} vehicles`);
    
    // Get unique owner wallet addresses
    const ownerWallets = [...new Set(vehicles.map(v => v.owner_wallet?.toLowerCase()))].filter(Boolean);
    console.log(`Found ${ownerWallets.length} unique owner wallets`);
    
    // Insert identity registry entries for each wallet
    for (const wallet of ownerWallets) {
      console.log(`Inserting identity registry entry for wallet: ${wallet}`);
      
      // First, check if an entry already exists
      const { data: existingEntry, error: checkError } = await supabase
        .from('identity_registry')
        .select('*')
        .eq('normalized_wallet', wallet)
        .maybeSingle();
      
      if (checkError) {
        console.error(`Error checking for existing entry for wallet ${wallet}:`, checkError);
        continue;
      }
      
      if (existingEntry) {
        console.log(`Entry already exists for wallet ${wallet}, skipping`);
        continue;
      }
      
      // Insert new entry
      const { data: newIdentity, error: insertError } = await supabase
        .from('identity_registry')
        .insert([
          {
            wallet_address: wallet,
            normalized_wallet: wallet,
            display_name: `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
          }
        ])
        .select();
      
      if (insertError) {
        console.error(`Error inserting identity registry entry for wallet ${wallet}:`, insertError);
        
        // Try a simpler insert without selecting
        const { error: simpleInsertError } = await supabase
          .from('identity_registry')
          .insert([
            {
              wallet_address: wallet,
              normalized_wallet: wallet
            }
          ]);
        
        if (simpleInsertError) {
          console.error(`Error with simple insert for wallet ${wallet}:`, simpleInsertError);
        } else {
          console.log(`Successfully inserted basic entry for wallet ${wallet}`);
        }
      } else {
        console.log(`Successfully inserted identity registry entry for wallet ${wallet}:`, newIdentity);
      }
    }
    
    console.log('Finished inserting data into identity_registry table');
    
    // Verify the data was inserted
    const { data: entries, error: entriesError } = await supabase
      .from('identity_registry')
      .select('*');
    
    if (entriesError) {
      console.error('Error fetching identity registry entries:', entriesError);
      return;
    }
    
    console.log(`Found ${entries.length} entries in identity_registry table`);
    if (entries.length > 0) {
      console.log('First entry:', entries[0]);
    }
  } catch (error) {
    console.error('Error inserting identity registry data:', error);
  }
}

// Run the function
insertIdentityRegistryData();