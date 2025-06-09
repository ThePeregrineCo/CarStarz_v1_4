import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local if it exists
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

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

async function listTables() {
  try {
    console.log('Listing all tables in the database...');
    
    // Query to list all tables in the public schema
    const { data, error } = await supabase
      .rpc('list_tables');
    
    if (error) {
      throw error;
    }
    
    console.log('Tables in the database:');
    data.forEach(table => {
      console.log(`- ${table}`);
    });
    
    // Check for specific tables
    console.log('\nChecking for specific tables:');
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
      const exists = data.includes(table);
      console.log(`- ${table}: ${exists ? 'EXISTS' : 'DOES NOT EXIST'}`);
    }
    
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

// Add the list_tables function to Supabase if it doesn't exist
async function createListTablesFunction() {
  try {
    const { error } = await supabase.rpc('list_tables');
    
    if (error && error.message.includes('function list_tables() does not exist')) {
      console.log('Creating list_tables function...');
      
      // Create the function
      const { error: createError } = await supabase.rpc('create_list_tables_function');
      
      if (createError) {
        console.log('Creating function directly...');
        
        // Create the function directly
        const { error: directError } = await supabase.sql(`
          CREATE OR REPLACE FUNCTION list_tables()
          RETURNS TABLE (table_name text)
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY
            SELECT tablename::text
            FROM pg_catalog.pg_tables
            WHERE schemaname = 'public';
          END;
          $$;
        `);
        
        if (directError) {
          throw directError;
        }
        
        console.log('list_tables function created successfully.');
      } else {
        console.log('list_tables function created successfully.');
      }
    }
  } catch (error) {
    console.error('Error creating list_tables function:', error);
  }
}

// Create the drop_table_if_exists function if it doesn't exist
async function createDropTableFunction() {
  try {
    const { error } = await supabase.rpc('drop_table_if_exists', { table_name: 'nonexistent_table' });
    
    if (error && error.message.includes('function drop_table_if_exists() does not exist')) {
      console.log('Creating drop_table_if_exists function...');
      
      // Create the function directly
      const { error: directError } = await supabase.sql(`
        CREATE OR REPLACE FUNCTION drop_table_if_exists(table_name text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(table_name) || ' CASCADE';
        END;
        $$;
      `);
      
      if (directError) {
        throw directError;
      }
      
      console.log('drop_table_if_exists function created successfully.');
    }
  } catch (error) {
    console.error('Error creating drop_table_if_exists function:', error);
  }
}

// Run the functions
async function main() {
  await createListTablesFunction();
  await createDropTableFunction();
  await listTables();
}

// Execute the main function
main().catch(console.error);