#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Validate environment variables
const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runFix() {
  try {
    console.log('Starting duplicate identity fix...');
    
    // Read the SQL fix file
    const sqlFilePath = path.join(__dirname, 'fix-duplicate-identities.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL fix
    const { error } = await supabase.rpc('pgmigrate', { query: sqlContent });
    
    if (error) {
      throw error;
    }
    
    console.log('Duplicate identity fix completed successfully!');
    
    // Check for any remaining duplicates
    const { data: duplicates, error: checkError } = await supabase
      .from('identity_registry')
      .select('normalized_wallet, count(*)')
      .group('normalized_wallet')
      .having('count(*) > 1');
    
    if (checkError) {
      console.warn('Warning: Could not verify fix:', checkError.message);
    } else if (duplicates && duplicates.length > 0) {
      console.warn(`Warning: Found ${duplicates.length} wallet addresses that still have duplicates.`);
      console.warn('You may need to run the fix again or investigate these specific cases:');
      duplicates.forEach(dup => {
        console.warn(`  Wallet: ${dup.normalized_wallet}, Count: ${dup.count}`);
      });
    } else {
      console.log('Verification successful: No duplicate wallet addresses remain in the identity_registry table.');
    }
    
    // Check if the UNIQUE constraint was added
    const { data: constraints, error: constraintError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT constraint_name FROM information_schema.table_constraints 
              WHERE constraint_name = 'identity_registry_normalized_wallet_key' 
              AND table_name = 'identity_registry'` 
      });
    
    if (constraintError) {
      console.warn('Warning: Could not verify UNIQUE constraint:', constraintError.message);
    } else if (!constraints || constraints.length === 0) {
      console.warn('Warning: UNIQUE constraint may not have been added to the normalized_wallet column.');
    } else {
      console.log('UNIQUE constraint successfully added to normalized_wallet column.');
    }
    
  } catch (error) {
    console.error('Fix failed:', error.message);
    process.exit(1);
  }
}

runFix();