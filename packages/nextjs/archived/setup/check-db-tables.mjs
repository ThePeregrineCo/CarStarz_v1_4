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

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // Get list of all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      throw tablesError;
    }
    
    console.log('Available tables:');
    tables.forEach(table => {
      console.log(`- ${table.tablename}`);
    });
    
    // Check if identity_registry table exists
    const hasIdentityRegistry = tables.some(table => table.tablename === 'identity_registry');
    console.log(`\nidentity_registry table exists: ${hasIdentityRegistry ? 'YES' : 'NO'}`);
    
    // Check if users table exists
    const hasUsers = tables.some(table => table.tablename === 'users');
    console.log(`users table exists: ${hasUsers ? 'YES' : 'NO'}`);
    
    // Check if vehicle_profiles table exists
    const hasVehicleProfiles = tables.some(table => table.tablename === 'vehicle_profiles');
    console.log(`vehicle_profiles table exists: ${hasVehicleProfiles ? 'YES' : 'NO'}`);
    
    // If identity_registry exists, check its contents
    if (hasIdentityRegistry) {
      const { data: identities, error: identitiesError } = await supabase
        .from('identity_registry')
        .select('*')
        .limit(5);
      
      if (identitiesError) {
        console.error('Error fetching identity_registry data:', identitiesError);
      } else {
        console.log(`\nidentity_registry has ${identities.length} records (showing up to 5):`);
        console.log(JSON.stringify(identities, null, 2));
      }
    }
    
    // If vehicle_profiles exists, check its contents
    if (hasVehicleProfiles) {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicle_profiles')
        .select('*')
        .limit(5);
      
      if (vehiclesError) {
        console.error('Error fetching vehicle_profiles data:', vehiclesError);
      } else {
        console.log(`\nvehicle_profiles has ${vehicles.length} records (showing up to 5):`);
        console.log(JSON.stringify(vehicles, null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error checking database tables:', error);
  }
}

// Run the check
checkTables();