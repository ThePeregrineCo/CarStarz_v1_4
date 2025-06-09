#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.resolve(__dirname, '.env.local');
    console.log(`Looking for .env.local at: ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      console.log('.env.local file found');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = envContent.split('\n').reduce((acc, line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          acc[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
        }
        return acc;
      }, {});
      
      return envVars;
    } else {
      console.log('.env.local file not found');
      return null;
    }
  } catch (error) {
    console.error('Error loading .env.local file:', error);
    return null;
  }
}

// Main function to check identity_registry
async function checkIdentityRegistry() {
  try {
    console.log('Checking identity_registry table...');
    
    // Try to load environment variables from .env.local
    const envVars = loadEnvFile();
    
    // Get Supabase URL and key from environment variables
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // If not found in process.env, try to use the ones from .env.local
    if ((!supabaseUrl || !supabaseKey) && envVars) {
      supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
      supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
    }
    
    // Check if we have the required environment variables
    if (!supabaseUrl || !supabaseKey) {
      console.error('Error: Missing required environment variables');
      console.error('Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
      console.error('You can set them in .env.local or export them in your terminal');
      process.exit(1);
    }
    
    console.log(`Using Supabase URL: ${supabaseUrl}`);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if identity_registry table exists
    console.log('Checking if identity_registry table exists...');
    
    try {
      // Try to get the table schema
      const { error: tableError } = await supabase
        .from('identity_registry')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('Error checking identity_registry table:', tableError);
        
        // Check if the error is because the table doesn't exist
        if (tableError.code === '42P01') {
          console.error('The identity_registry table does not exist');
        }
        
        process.exit(1);
      }
      
      console.log('identity_registry table exists');
      
      // Get the table columns by selecting a single row and examining its structure
      console.log('Getting table columns by examining a sample row...');
      
      const { data: sampleRow, error: sampleRowError } = await supabase
        .from('identity_registry')
        .select('*')
        .limit(1);
      
      if (sampleRowError) {
        console.error('Error getting sample row:', sampleRowError);
      } else if (sampleRow && sampleRow.length > 0) {
        console.log('\nidentity_registry table columns:');
        const columns = Object.keys(sampleRow[0]).map(column => ({
          column_name: column,
          data_type: typeof sampleRow[0][column]
        }));
        console.table(columns);
      } else {
        // If no rows exist, try to create a dummy row to get the structure
        console.log('No rows found. Trying to get table structure...');
        
        try {
          // Try a direct SQL query to get column information
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_name = 'identity_registry' AND table_schema = 'public'
              ORDER BY ordinal_position
            `
          });
          
          if (error) {
            console.error('Error executing SQL query:', error);
          } else if (data && data.length > 0) {
            console.log('\nidentity_registry table columns:');
            console.table(data);
          } else {
            console.log('No column information found');
          }
        } catch (error) {
          console.error('Error getting table structure:', error);
        }
      }
      
      // Get some sample data
      const { data: sampleData, error: sampleError } = await supabase
        .from('identity_registry')
        .select('*')
        .limit(5);
      
      if (sampleError) {
        console.error('Error getting sample data:', sampleError);
      } else if (sampleData && sampleData.length > 0) {
        console.log('\nSample data from identity_registry:');
        console.table(sampleData);
      } else {
        console.log('No data found in identity_registry table');
      }
      
      // Count the records
      const { count, error: countError } = await supabase
        .from('identity_registry')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error counting records:', countError);
      } else {
        console.log(`\nTotal records in identity_registry: ${count}`);
      }
      
    } catch (error) {
      console.error('Error checking identity_registry table:', error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
checkIdentityRegistry();