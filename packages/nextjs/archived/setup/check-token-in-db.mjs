import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Check if required environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTokenInDatabase(tokenId) {
  try {
    console.log(`Checking if token ID ${tokenId} exists in the database...`);
    
    // Query the vehicle_profiles table
    const { data: vehicleProfile, error } = await supabase
      .from('vehicle_profiles')
      .select('*')
      .eq('token_id', tokenId.toString())
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`Token ID ${tokenId} does not exist in the database.`);
        return null;
      }
      throw error;
    }
    
    console.log(`Token ID ${tokenId} exists in the database:`, vehicleProfile);
    return vehicleProfile;
  } catch (error) {
    console.error('Error checking token in database:', error);
    return null;
  }
}

// Check token IDs 4, 5, and 6
async function main() {
  await checkTokenInDatabase(4);
  await checkTokenInDatabase(5);
  await checkTokenInDatabase(6);
}

main().catch(console.error);