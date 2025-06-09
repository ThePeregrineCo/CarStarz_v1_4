import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs';

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
 * Manually reset the database by deleting all data from tables
 */
async function resetDatabase() {
  try {
    console.log('Manually resetting database...');
    
    // List of tables to clear
    const tables = [
      'vehicle_profiles',
      'vehicle_media',
      'vehicle_specifications',
      'vehicle_links',
      'vehicle_comments',
      'vehicle_modifications',
      'parts',
      'builder_vehicles',
      'businesses'
    ];
    
    // Delete all data from each table
    for (const table of tables) {
      console.log(`Deleting all data from ${table}...`);
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`Table ${table} does not exist, skipping.`);
        } else {
          console.error(`Error deleting from ${table}:`, error);
        }
      } else {
        console.log(`Successfully deleted all data from ${table}`);
      }
    }
    
    console.log('\nDatabase reset complete!');
    
    // Reset token counter
    const tokenCounterPath = join(__dirname, 'data', 'tokenCounter.json');
    if (fs.existsSync(tokenCounterPath)) {
      console.log('\nResetting token counter to 1...');
      fs.writeFileSync(tokenCounterPath, JSON.stringify({ default: 1 }, null, 2));
      console.log('Token counter reset to 1');
    }
    
    console.log('\nNext steps:');
    console.log('1. Kill any running hardhat node');
    console.log('2. Clean hardhat artifacts: cd ../hardhat && npx hardhat clean');
    console.log('3. Start a fresh hardhat node: cd ../hardhat && npx hardhat node');
    console.log('4. Deploy the contracts: cd ../hardhat && npx hardhat deploy --network localhost');
    console.log('5. Start your Next.js dev server: cd ../nextjs && yarn dev');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

// Run the function
resetDatabase().catch(console.error);