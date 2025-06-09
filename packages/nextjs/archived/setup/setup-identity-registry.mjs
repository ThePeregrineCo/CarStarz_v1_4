import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

async function setupIdentityRegistry() {
  try {
    console.log('Setting up identity registry...');
    
    // Read the SQL script
    const sqlScript = fs.readFileSync(path.resolve(__dirname, 'setup-identity-registry.sql'), 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
        // Continue with the next statement
      }
    }
    
    console.log('Identity registry setup complete!');
    
    // Verify the tables were created
    console.log('\nVerifying tables...');
    
    // Check identity_registry
    try {
      const { data: identities, error: identitiesError } = await supabase
        .from('identity_registry')
        .select('count(*)', { count: 'exact', head: true });
      
      if (identitiesError) {
        console.log('- identity_registry: FAILED (Error:', identitiesError.message, ')');
      } else {
        console.log(`- identity_registry: SUCCESS (${identities[0]?.count || 0} records)`);
      }
    } catch (error) {
      console.log('- identity_registry: FAILED (Error:', error.message, ')');
    }
    
    // Check vehicle_profiles
    try {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicle_profiles')
        .select('count(*)', { count: 'exact', head: true });
      
      if (vehiclesError) {
        console.log('- vehicle_profiles: FAILED (Error:', vehiclesError.message, ')');
      } else {
        console.log(`- vehicle_profiles: SUCCESS (${vehicles[0]?.count || 0} records)`);
      }
    } catch (error) {
      console.log('- vehicle_profiles: FAILED (Error:', error.message, ')');
    }
    
    // Check vehicle_media
    try {
      const { data: media, error: mediaError } = await supabase
        .from('vehicle_media')
        .select('count(*)', { count: 'exact', head: true });
      
      if (mediaError) {
        console.log('- vehicle_media: FAILED (Error:', mediaError.message, ')');
      } else {
        console.log(`- vehicle_media: SUCCESS (${media[0]?.count || 0} records)`);
      }
    } catch (error) {
      console.log('- vehicle_media: FAILED (Error:', error.message, ')');
    }
    
  } catch (error) {
    console.error('Error setting up identity registry:', error);
  }
}

// Run the setup
setupIdentityRegistry();