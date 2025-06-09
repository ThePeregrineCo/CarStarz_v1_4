import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
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
 * Simple script to check which tables exist in the database
 */
async function checkTables() {
  console.log('Checking tables in the database...');
  
  try {
    // Check for specific tables
    console.log('Checking for specific tables:');
    const tablesToCheck = [
      'vehicles',
      'vehicle_media',
      'vehicle_profiles',
      'vehicle_specifications',
      'vehicle_links',
      'vehicle_comments',
      'vehicle_videos',
      'vehicle_modifications',
      'parts',
      'builder_vehicles'
    ];
    
    for (const table of tablesToCheck) {
      // Try to select a single row from the table to check if it exists
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log(`- ${table}: DOES NOT EXIST`);
      } else if (error) {
        console.log(`- ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`- ${table}: EXISTS (${data.length} rows in sample)`);
      }
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

// Run the function
checkTables().catch(console.error);