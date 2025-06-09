import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local or .env
console.log('Loading environment variables...');
try {
  // Try .env.local first
  const envLocalPath = join(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    console.log(`Loading environment variables from ${envLocalPath}`);
    dotenv.config({ path: envLocalPath });
  } else {
    // Fall back to .env
    const envPath = join(__dirname, '.env');
    console.log(`Loading environment variables from ${envPath}`);
    dotenv.config({ path: envPath });
  }
} catch (error) {
  console.warn(`Warning: Error loading environment variables: ${error.message}`);
}

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Explicitly set from .env file if not found in environment
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Environment variables not found in process.env, trying to read directly from .env file...');
  try {
    const envPath = join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL' && !supabaseUrl) {
          process.env.NEXT_PUBLIC_SUPABASE_URL = value.trim();
          console.log(`Manually set NEXT_PUBLIC_SUPABASE_URL to ${value.trim()}`);
        } else if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY' && !supabaseServiceRoleKey) {
          process.env.SUPABASE_SERVICE_ROLE_KEY = value.trim();
          console.log('Manually set SUPABASE_SERVICE_ROLE_KEY');
        }
      }
    }
  } catch (error) {
    console.error(`Error reading .env file: ${error.message}`);
  }
}

// Check again after manual loading
const finalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const finalSupabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', finalSupabaseUrl || 'Not found');
console.log('Supabase Service Role Key available:', !!finalSupabaseServiceRoleKey);

// Create a Supabase client
const supabase = createClient(finalSupabaseUrl, finalSupabaseServiceRoleKey);

// Check the database schema
async function checkDatabaseSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check vehicle_profiles table
    console.log('\nChecking vehicle_profiles table...');
    try {
      const { data, error } = await supabase
        .from('vehicle_profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Error accessing vehicle_profiles table:', error.message);
        if (error.code === '42P01') {
          console.error('The vehicle_profiles table does not exist.');
        }
      } else {
        console.log('vehicle_profiles table exists.');
        if (data && data.length > 0) {
          console.log('Columns in vehicle_profiles:', Object.keys(data[0]));
        } else {
          console.log('No data found in vehicle_profiles table.');
          
          // Try to get column information using a different approach
          console.log('Trying to get column information using a different approach...');
          try {
            const { data: columnData, error: columnError } = await supabase.rpc('exec_sql', {
              sql: `
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = 'vehicle_profiles'
                ORDER BY ordinal_position;
              `
            });
            
            if (columnError) {
              console.error('Error getting column information:', columnError.message);
            } else if (columnData) {
              console.log('Columns in vehicle_profiles table:');
              console.table(columnData);
              
              // Check for owner_id and identity_id columns
              const columnNames = columnData.map(col => col.column_name);
              if (columnNames.includes('owner_id')) {
                console.log('vehicle_profiles table has owner_id column.');
              } else {
                console.error('vehicle_profiles table does not have owner_id column.');
              }
              
              if (columnNames.includes('identity_id')) {
                console.log('vehicle_profiles table has identity_id column.');
                console.log('This is inconsistent with the simplified schema, which uses owner_id.');
              }
              
              if (columnNames.includes('owner_wallet')) {
                console.log('vehicle_profiles table has owner_wallet column.');
              } else {
                console.error('vehicle_profiles table does not have owner_wallet column.');
              }
            }
          } catch (columnError) {
            console.error('Exception getting column information:', columnError);
          }
        }
      }
    } catch (error) {
      console.error('Exception checking vehicle_profiles table:', error);
    }
    
    // Check identity_registry table
    console.log('\nChecking identity_registry table...');
    try {
      const { data, error } = await supabase
        .from('identity_registry')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Error accessing identity_registry table:', error.message);
        if (error.code === '42P01') {
          console.error('The identity_registry table does not exist.');
        }
      } else {
        console.log('identity_registry table exists.');
        if (data && data.length > 0) {
          console.log('Columns in identity_registry:', Object.keys(data[0]));
        } else {
          console.log('No data found in identity_registry table.');
        }
      }
    } catch (error) {
      console.error('Exception checking identity_registry table:', error);
    }
    
    // Check for tables that should be in the simplified schema
    console.log('\nChecking for tables in the simplified schema...');
    const tablesToCheck = [
      'identity_registry',
      'follows',
      'social_links',
      'vehicle_profiles',
      'vehicle_modifications',
      'vehicle_media',
      'vehicle_links',
      'vehicle_specifications',
      'vehicle_comments',
      'vehicle_audit_log',
      'vehicle_videos',
      'user_collections',
      'token_ownership',
      'ownership_transfers',
      'verification_authorities',
      'verification_levels',
      'vehicle_verifications',
      'likes',
      'shares',
      'page_views'
    ];
    
    const existingTables = [];
    const missingTables = [];
    
    for (const tableName of tablesToCheck) {
      // Use a try-catch block without using the error parameter
      try {
        const { error } = await supabase
          .from(tableName)
          .select('count(*)', { count: 'exact', head: true });
        
        if (!error || error.code !== '42P01') {
          existingTables.push(tableName);
        } else {
          missingTables.push(tableName);
        }
      } catch {
        // Just push to missing tables without using the error
        missingTables.push(tableName);
      }
    }
    
    console.log('Tables found in the database:', existingTables);
    
    if (missingTables.length > 0) {
      console.log('Missing tables from simplified schema:', missingTables);
      console.log('The simplified schema may not have been fully applied.');
    } else {
      console.log('All expected tables from simplified schema exist.');
    }
    
    // Check if the simplified schema has been applied
    console.log('\nChecking if the simplified schema has been applied...');
    if (existingTables.includes('vehicle_profiles') && existingTables.includes('identity_registry')) {
      console.log('Both vehicle_profiles and identity_registry tables exist.');
      
      // Check if vehicle_profiles has owner_id column
      try {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicle_profiles')
          .select('*')
          .limit(1);
        
        if (vehicleError) {
          console.error('Error accessing vehicle_profiles table:', vehicleError.message);
        } else if (vehicleData && vehicleData.length > 0) {
          const columns = Object.keys(vehicleData[0]);
          console.log('Columns in vehicle_profiles:', columns);
          
          if (columns.includes('owner_id')) {
            console.log('vehicle_profiles table has owner_id column.');
          } else {
            console.error('vehicle_profiles table does not have owner_id column.');
            console.log('The simplified schema may not have been properly applied.');
          }
          
          if (columns.includes('identity_id')) {
            console.log('vehicle_profiles table has identity_id column.');
            console.log('This is inconsistent with the simplified schema, which uses owner_id.');
          }
          
          if (columns.includes('owner_wallet')) {
            console.log('vehicle_profiles table has owner_wallet column.');
          } else {
            console.error('vehicle_profiles table does not have owner_wallet column.');
            console.log('The simplified schema may not have been properly applied.');
          }
        } else {
          console.log('No data found in vehicle_profiles table.');
        }
      } catch (error) {
        console.error('Exception checking vehicle_profiles columns:', error);
      }
    } else {
      console.error('One or both of vehicle_profiles and identity_registry tables are missing.');
      console.log('The simplified schema has not been applied.');
    }
    
  } catch (error) {
    console.error('Exception during schema check:', error);
  }
}

// Run the check
checkDatabaseSchema();