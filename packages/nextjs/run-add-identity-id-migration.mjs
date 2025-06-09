// Script to add identity_id column to vehicle_profiles table
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dirname } from 'path';

// Initialize dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables.');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('=== Adding identity_id to vehicle_profiles table ===');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'add-identity-id-to-vehicles.sql');
    console.log(`Reading SQL file: ${sqlFilePath}`);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim() + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}:`);
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
      
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('');
    console.log('=== Migration Complete ===');
    
    // Verify the changes
    console.log('Verifying changes...');
    
    // Check if identity_id column exists
    const { error: columnCheckError } = await supabase.rpc('exec_sql', { 
      sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'vehicle_profiles' AND column_name = 'identity_id';" 
    });
    
    if (columnCheckError) {
      console.error('Error checking for identity_id column:', columnCheckError);
    } else {
      console.log('identity_id column exists in vehicle_profiles table');
    }
    
    // Check if trigger exists
    const { error: triggerCheckError } = await supabase.rpc('exec_sql', { 
      sql: "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'before_vehicle_insert_update';" 
    });
    
    if (triggerCheckError) {
      console.error('Error checking for trigger:', triggerCheckError);
    } else {
      console.log('before_vehicle_insert_update trigger exists');
    }
    
    // Check if view exists
    const { error: viewCheckError } = await supabase.rpc('exec_sql', { 
      sql: "SELECT table_name FROM information_schema.views WHERE table_name = 'vehicle_profiles_with_owner';" 
    });
    
    if (viewCheckError) {
      console.error('Error checking for view:', viewCheckError);
    } else {
      console.log('vehicle_profiles_with_owner view exists');
    }
    
    console.log('');
    console.log('Migration verification complete');
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

// Execute the function
runMigration();