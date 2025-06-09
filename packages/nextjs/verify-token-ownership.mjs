#!/usr/bin/env node

/**
 * Script to verify that the token_ownership table exists and is accessible
 * This script uses direct Supabase queries without relying on exec_sql
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: join(__dirname, '.env') });

// Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl || 'Not found');
console.log('Supabase Service Role Key available:', !!supabaseServiceRoleKey);

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Verify token_ownership table
async function verifyTokenOwnership() {
  try {
    console.log('Verifying token_ownership table...');
    
    // Method 1: Try to select token_id from token_ownership
    console.log('\nMethod 1: Selecting token_id from token_ownership');
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from('token_ownership')
        .select('token_id')
        .limit(1);
      
      if (tokenError) {
        console.error('Error selecting from token_ownership:', tokenError.message);
        console.log('❌ Method 1 failed: Could not select token_id from token_ownership');
      } else {
        console.log('✅ Method 1 succeeded: Successfully selected from token_ownership');
        console.log(`Found ${tokenData.length} records`);
      }
    } catch (error) {
      console.error('Exception in Method 1:', error.message);
    }
    
    // Method 2: Try to select all columns from token_ownership
    console.log('\nMethod 2: Selecting all columns from token_ownership');
    try {
      const { data: allData, error: allError } = await supabase
        .from('token_ownership')
        .select('*')
        .limit(1);
      
      if (allError) {
        console.error('Error selecting all columns from token_ownership:', allError.message);
        console.log('❌ Method 2 failed: Could not select all columns from token_ownership');
      } else {
        console.log('✅ Method 2 succeeded: Successfully selected all columns from token_ownership');
        console.log(`Found ${allData.length} records`);
        if (allData.length > 0) {
          console.log('Sample record:', allData[0]);
        }
      }
    } catch (error) {
      console.error('Exception in Method 2:', error.message);
    }
    
    // Method 3: Try to count records in token_ownership
    console.log('\nMethod 3: Counting records in token_ownership');
    try {
      const { count, error: countError } = await supabase
        .from('token_ownership')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error counting records in token_ownership:', countError.message);
        console.log('❌ Method 3 failed: Could not count records in token_ownership');
      } else {
        console.log('✅ Method 3 succeeded: Successfully counted records in token_ownership');
        console.log(`Total records: ${count}`);
      }
    } catch (error) {
      console.error('Exception in Method 3:', error.message);
    }
    
    // Method 4: Try to get the schema of token_ownership
    console.log('\nMethod 4: Getting schema information');
    try {
      // This is a direct SQL query to get table information
      // We'll use the Supabase REST API directly for this
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`
        },
        body: JSON.stringify({
          query: `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'token_ownership'
          `
        })
      });
      
      if (!response.ok) {
        console.error('Error getting schema information:', await response.text());
        console.log('❌ Method 4 failed: Could not get schema information');
      } else {
        const schemaData = await response.json();
        console.log('✅ Method 4 succeeded: Successfully got schema information');
        console.log('Columns in token_ownership:');
        schemaData.forEach(column => {
          console.log(`- ${column.column_name} (${column.data_type})`);
        });
      }
    } catch (error) {
      console.error('Exception in Method 4:', error.message);
    }
    
    console.log('\nVerification complete!');
    
  } catch (error) {
    console.error('Exception during verification:', error.message);
    console.error(error);
  }
}

verifyTokenOwnership();