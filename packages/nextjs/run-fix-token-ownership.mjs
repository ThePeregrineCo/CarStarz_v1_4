#!/usr/bin/env node

/**
 * Script to run the fix-token-ownership.sql script in Supabase
 * This script fixes the token_ownership table issue
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import readline from 'readline';

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

// Path to the SQL file (relative to this script)
const sqlFilePath = join(__dirname, '..', 'infrastructure', 'database', 'migrations', 'fix-token-ownership.sql');

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

console.log('Running fix-token-ownership.sql script...');
console.log('This will create the token_ownership table if it doesn\'t exist.');
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
    
    console.log('Script executed successfully!');
    
    // Verify the token_ownership table
    console.log('\nVerifying token_ownership table...');
    const { data: verificationData, error: verificationError } = await supabase
      .from('token_ownership')
      .select('token_id')
      .limit(10);
    
    if (verificationError) {
      console.error('Error verifying token_ownership table:', verificationError.message);
    } else {
      console.log('token_ownership table exists and is accessible.');
      console.log(`Found ${verificationData.length} records in token_ownership table.`);
    }
    
    // Run the verify-schema-setup.mjs script
    console.log('\nRunning verify-schema-setup.mjs script...');
    const { spawn } = await import('child_process');
    const verifyProcess = spawn('node', [join(__dirname, 'verify-schema-setup.mjs')], {
      stdio: 'inherit'
    });
    
    verifyProcess.on('close', (code) => {
      console.log(`verify-schema-setup.mjs exited with code ${code}`);
      rl.close();
    });
    
  } catch (error) {
    console.error('Error executing script:', error.message);
    console.error('Please check your Supabase credentials and try again.');
    rl.close();
  }
});