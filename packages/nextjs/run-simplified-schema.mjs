#!/usr/bin/env node

/**
 * Script to run the simplified wallet-identity schema in Supabase
 * This script uses the Supabase JavaScript client to execute the SQL script
 *
 * Usage:
 *   SUPABASE_URL=https://your-project-ref.supabase.co SUPABASE_KEY=your-service-role-key node run-simplified-schema.mjs
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Check for SUPABASE_URL and SUPABASE_KEY, or try to use NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_KEY;

// If not found, try the other environment variable names
if (!supabaseUrl) supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseKey) supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Explicitly set from .env file if not found in environment
if (!supabaseUrl || !supabaseKey) {
  console.warn('Environment variables not found in process.env, trying to read directly from .env file...');
  try {
    const envPath = join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        const trimmedKey = key.trim();
        
        if ((trimmedKey === 'SUPABASE_URL' || trimmedKey === 'NEXT_PUBLIC_SUPABASE_URL') && !supabaseUrl) {
          supabaseUrl = value.trim();
          console.log(`Manually set Supabase URL to ${value.trim()}`);
        } else if ((trimmedKey === 'SUPABASE_KEY' || trimmedKey === 'SUPABASE_SERVICE_ROLE_KEY') && !supabaseKey) {
          supabaseKey = value.trim();
          console.log('Manually set Supabase Key');
        }
      }
    }
  } catch (error) {
    console.error(`Error reading .env file: ${error.message}`);
  }
}

console.log('Supabase URL:', supabaseUrl || 'Not found');
console.log('Supabase Key available:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set.');
  console.error('You can find these in your Supabase project settings.');
  console.error('');
  console.error('Example usage:');
  console.error('  SUPABASE_URL=https://your-project-ref.supabase.co SUPABASE_KEY=your-service-role-key node run-simplified-schema.mjs');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to the SQL file (relative to this script)
const sqlFilePath = path.resolve('../infrastructure/database/migrations/simplified-wallet-identity-schema.sql');

// Check if the SQL file exists
if (!fs.existsSync(sqlFilePath)) {
  console.error(`Error: SQL file not found at ${sqlFilePath}`);
  process.exit(1);
}

// Read the SQL file
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Running simplified wallet-identity schema...');
console.log('This will reset your database and create a new schema.');
console.log('All existing data will be lost.');
console.log('');

rl.question('Are you sure you want to continue? (y/n) ', async (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('Operation cancelled.');
    rl.close();
    process.exit(0);
  }

  console.log('Executing SQL script...');
  
  try {
    // Execute the SQL using the exec_sql function
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      throw error;
    }
    
    console.log('Schema executed successfully!');
    console.log('');
    console.log('You can now verify the setup by running the following SQL in the Supabase dashboard:');
    console.log('SELECT verify_setup();');
    
    // Run verification
    const { data: verificationData, error: verificationError } = await supabase.rpc('verify_setup');
    
    if (!verificationError && verificationData) {
      console.log('');
      console.log('Verification result:');
      console.log(verificationData);
    }
  } catch (error) {
    console.error('Error executing schema:');
    console.error(error);
    console.error('Please check your Supabase credentials and try again.');
  }
  
  rl.close();
});