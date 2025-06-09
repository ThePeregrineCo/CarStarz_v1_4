// Script to check if the exec_sql function exists in the Supabase database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

async function checkExecSqlFunction() {
  console.log('Checking if exec_sql function exists in the database...');
  
  try {
    // Try to execute a simple SQL statement using the exec_sql function
    const { error } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT 1 as test' 
    });
    
    if (error) {
      console.error('Error executing exec_sql function:', error);
      console.log('');
      console.log('The exec_sql function does not exist or there is an error with it.');
      console.log('You need to create this function in your Supabase database with:');
      console.log('');
      console.log('CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$');
      console.log('BEGIN');
      console.log('  EXECUTE sql;');
      console.log('END;');
      console.log('$$ LANGUAGE plpgsql SECURITY DEFINER;');
      
      return false;
    }
    
    console.log('The exec_sql function exists and is working correctly!');
    return true;
  } catch (error) {
    console.error('Error checking exec_sql function:', error);
    return false;
  }
}

// Execute the function
checkExecSqlFunction();