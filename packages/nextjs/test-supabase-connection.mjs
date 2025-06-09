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

// Test the connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try to list tables using SQL query instead of direct access to pg_tables
    console.log('Trying to list tables...');
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5;"
      });
      
      if (error) {
        console.error('Error listing tables:', error.message);
      } else {
        console.log('Successfully listed tables!');
        if (data && data.length > 0) {
          console.log('Tables:', data);
        } else {
          console.log('No tables found in the public schema. This is expected if migrations have not been run yet.');
        }
      }
    } catch (tableError) {
      console.error('Exception when listing tables:', tableError.message);
    }
    
    // Try to execute a simple SQL query
    console.log('\nTrying to execute a simple SQL query...');
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT table_schema, table_name
          FROM information_schema.tables
          WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
          ORDER BY table_schema, table_name;
        `
      });
      
      if (error) {
        console.error('Error executing SQL:', error.message);
      } else {
        console.log('Successfully executed SQL!');
        if (data) {
          console.log('Result:', data);
        } else {
          console.log('Query executed successfully but returned no data.');
        }
      }
    } catch (sqlError) {
      console.error('Exception when executing SQL:', sqlError.message);
    }
  } catch (error) {
    console.error('Exception when connecting to Supabase:', error.message);
    console.error(error);
  }
}

testConnection();