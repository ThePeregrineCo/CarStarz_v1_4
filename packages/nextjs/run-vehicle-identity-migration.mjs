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

async function runMigration() {
  try {
    console.log('Starting vehicle identity integration migration...');
    
    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, 'vehicle-identity-integration.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL migration
    const { error } = await supabase.rpc('pgmigrate', { query: sqlContent });
    
    if (error) {
      throw error;
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the migration by checking for unlinked records
    const { data: unlinkedRecords, error: verifyError } = await supabase
      .rpc('verify_vehicle_identity_integrity');
    
    if (verifyError) {
      console.warn('Warning: Could not verify migration integrity:', verifyError.message);
    } else {
      const problemRecords = unlinkedRecords.filter(r => r.status !== 'OK');
      
      if (problemRecords.length > 0) {
        console.warn(`Warning: Found ${problemRecords.length} vehicle records with potential issues:`);
        problemRecords.forEach(record => {
          console.warn(`  Token ID ${record.token_id}: ${record.status}`);
        });
        console.warn('These records may need manual attention.');
      } else {
        console.log('All vehicle records successfully linked to identity registry!');
      }
    }
    
    // Check if the identity_id column was added
    const { error: columnsError } = await supabase
      .from('vehicle_profiles')
      .select('identity_id')
      .limit(1);
    
    if (columnsError) {
      if (columnsError.message.includes('column "identity_id" does not exist')) {
        console.error('Error: identity_id column was not added to vehicle_profiles table');
      } else {
        console.error('Error checking identity_id column:', columnsError.message);
      }
    } else {
      console.log('identity_id column successfully added to vehicle_profiles table');
    }
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();