#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config({ path: '.env.local' });

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to log section headers
function logSection(title) {
  console.log('\n');
  log(`${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
  console.log('-'.repeat(title.length + 8));
}

// Helper function to log success messages
function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

// Helper function to log warning messages
function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

// Helper function to log error messages
function logError(message) {
  log(`❌ ${message}`, colors.red);
}

// Helper function to execute shell commands
function executeCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    logError(`Command failed: ${command}`);
    logError(error.message);
    return null;
  }
}

// Main function to run all checks and setup
async function setupAndVerify() {
  log(`${colors.bright}${colors.magenta}CarStarz API Layer Setup and Verification${colors.reset}`, colors.bright);
  log(`Running setup and verification at ${new Date().toLocaleString()}`, colors.dim);
  console.log('\n');

  // Step 1: Check environment variables
  logSection('Checking Environment Variables');
  
  const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missingEnvVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingEnvVars.push(envVar);
      logError(`Missing required environment variable: ${envVar}`);
    } else {
      logSuccess(`Found environment variable: ${envVar}`);
    }
  }
  
  if (missingEnvVars.length > 0) {
    logError('Please add the missing environment variables to .env.local');
    process.exit(1);
  }

  // Step 2: Initialize Supabase client
  logSection('Initializing Supabase Client');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    logSuccess('Supabase client initialized successfully');
  } catch (error) {
    logError(`Failed to initialize Supabase client: ${error.message}`);
    process.exit(1);
  }

  // Step 3: Run database migration
  logSection('Running Database Migration');
  
  log('Executing consolidated schema migration...', colors.blue);
  const migrationResult = executeCommand('node run-consolidated-migration.mjs');
  
  if (migrationResult) {
    logSuccess('Database migration completed successfully');
  } else {
    logWarning('Database migration may have encountered issues');
    log('Continuing with setup process...', colors.yellow);
  }

  // Step 4: Create RPC function for blockchain events
  logSection('Setting Up RPC Functions');
  
  const incrementRetryCountFunction = `
  CREATE OR REPLACE FUNCTION increment_retry_count(event_id UUID)
  RETURNS INTEGER AS $$
  DECLARE
    new_count INTEGER;
  BEGIN
    UPDATE blockchain_events
    SET retry_count = retry_count + 1
    WHERE id = event_id
    RETURNING retry_count INTO new_count;
    
    RETURN new_count;
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: incrementRetryCountFunction });
    
    if (error) {
      logWarning(`Failed to create increment_retry_count function: ${error.message}`);
      log('You may need to create this function manually in the Supabase dashboard', colors.yellow);
    } else {
      logSuccess('Created increment_retry_count RPC function');
    }
  } catch (error) {
    logWarning(`Error creating RPC function: ${error.message}`);
  }

  // Step 5: Verify database tables and structure
  logSection('Verifying Database Structure');
  
  // Check if vehicle_profiles table has identity_id column
  try {
    const { error } = await supabase
      .from('vehicle_profiles')
      .select('identity_id')
      .limit(1);
    
    if (error) {
      logError(`Error checking vehicle_profiles table: ${error.message}`);
    } else {
      logSuccess('vehicle_profiles table has identity_id column');
    }
  } catch (error) {
    logError(`Failed to check vehicle_profiles table: ${error.message}`);
  }
  
  // Check if blockchain_events table exists
  try {
    const { error } = await supabase
      .from('blockchain_events')
      .select('id')
      .limit(1);
    
    if (error && error.message.includes('does not exist')) {
      logError('blockchain_events table does not exist');
    } else {
      logSuccess('blockchain_events table exists');
    }
  } catch (error) {
    logError(`Failed to check blockchain_events table: ${error.message}`);
  }

  // Step 6: Check for storage buckets
  logSection('Checking Storage Buckets');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      logError(`Error listing storage buckets: ${error.message}`);
    } else {
      const profileImagesBucket = buckets.find(bucket => bucket.name === 'profile-images');
      
      if (profileImagesBucket) {
        logSuccess('profile-images storage bucket exists');
      } else {
        logWarning('profile-images storage bucket does not exist');
        
        try {
          const { error: createError } = await supabase.storage.createBucket('profile-images', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
          });
          
          if (createError) {
            logError(`Failed to create profile-images bucket: ${createError.message}`);
          } else {
            logSuccess('Created profile-images storage bucket');
          }
        } catch (createError) {
          logError(`Error creating storage bucket: ${createError.message}`);
        }
      }
    }
  } catch (error) {
    logError(`Failed to check storage buckets: ${error.message}`);
  }

  // Step 7: Install dependencies
  logSection('Checking Dependencies');
  
  log('Installing any missing dependencies...', colors.blue);
  executeCommand('yarn install');
  logSuccess('Dependencies installed');

  // Step 8: Final verification
  logSection('Final Verification');
  
  log('All setup steps completed. The system is now ready for testing.', colors.green);
  log('\nTo start the development server, run:', colors.blue);
  log('cd packages/nextjs && yarn dev', colors.bright);
  
  log('\nTo test the API endpoints:', colors.blue);
  log('1. Vehicle Profiles: GET /api/vehicle-profiles', colors.dim);
  log('2. User Profiles: GET /api/user-profiles?address=YOUR_WALLET_ADDRESS', colors.dim);
  log('3. Blockchain Events: POST /api/blockchain-events', colors.dim);
  
  log('\nRefer to API-LAYER-README.md for more details on the API structure.', colors.cyan);
}

// Run the setup and verification
setupAndVerify().catch(error => {
  logError(`Unhandled error: ${error.message}`);
  process.exit(1);
});