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

async function createIdentityForVehicleOwners() {
  try {
    console.log('Creating identity registry entries for vehicle owners...');
    
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
    
    // Check which owners already have identity registry entries
    const { data: existingIdentities, error: identitiesError } = await supabase
      .from('identity_registry')
      .select('normalized_wallet')
      .in('normalized_wallet', ownerWallets);
    
    if (identitiesError) {
      console.error('Error fetching existing identities:', identitiesError);
      return;
    }
    
    const existingWallets = existingIdentities.map(i => i.normalized_wallet);
    console.log(`Found ${existingWallets.length} existing identity registry entries`);
    
    // Filter out wallets that already have identity registry entries
    const walletsToCreate = ownerWallets.filter(wallet => !existingWallets.includes(wallet));
    console.log(`Need to create ${walletsToCreate.length} new identity registry entries`);
    
    // Create identity registry entries for each wallet
    for (const wallet of walletsToCreate) {
      console.log(`Creating identity registry entry for wallet: ${wallet}`);
      
      const { data: newIdentity, error: createError } = await supabase
        .from('identity_registry')
        .insert([
          {
            wallet_address: wallet,
            normalized_wallet: wallet.toLowerCase(),
            display_name: `${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
          }
        ])
        .select()
        .single();
      
      if (createError) {
        console.error(`Error creating identity registry entry for wallet ${wallet}:`, createError);
      } else {
        console.log(`Created identity registry entry for wallet ${wallet}:`, newIdentity);
      }
    }
    
    console.log('Finished creating identity registry entries for vehicle owners');
  } catch (error) {
    console.error('Error creating identity registry entries:', error);
  }
}

// Run the function
createIdentityForVehicleOwners();