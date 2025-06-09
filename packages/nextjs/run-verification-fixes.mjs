import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
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

// Check if environment variables are available
if (!finalSupabaseUrl || !finalSupabaseServiceRoleKey) {
  console.error('Error: Supabase credentials not found in environment variables.');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local or .env');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(finalSupabaseUrl, finalSupabaseServiceRoleKey);

// Path to the combined verification fixes file - using absolute path with __dirname
// Need to go up two levels: from /packages/nextjs to the project root
const fixesFilePath = join(__dirname, '..', '..', 'infrastructure', 'database', 'migrations', 'combined-verification-fixes.sql');

// Log the resolved path for debugging
console.log('Resolved fixes file path:', fixesFilePath);

// Read the fixes file
console.log(`Reading combined verification fixes file: ${fixesFilePath}`);
let fixesSql;
try {
  fixesSql = fs.readFileSync(fixesFilePath, 'utf8');
} catch (error) {
  console.error(`Error reading fixes file: ${error.message}`);
  process.exit(1);
}

// Execute the fixes
console.log('Applying verification fixes...');
async function runFixes() {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: fixesSql });
    
    if (error) {
      console.error(`Error applying fixes: ${error.message}`);
      process.exit(1);
    }
    
    console.log('Verification fixes applied successfully!');
    
    // Run verification checks
    console.log('\nRunning verification checks...');
    
    // Check wallet address consistency
    console.log('\nChecking wallet address consistency:');
    const { data: walletInconsistencies, error: walletError } = await supabase.rpc('check_wallet_address_consistency');
    
    if (walletError) {
      console.error(`Error checking wallet consistency: ${walletError.message}`);
    } else if (walletInconsistencies && walletInconsistencies.length > 0) {
      console.log(`Found ${walletInconsistencies.length} wallet inconsistencies:`);
      console.table(walletInconsistencies);
    } else {
      console.log('No wallet inconsistencies found.');
    }
    
    // Check orphaned media
    console.log('\nChecking for orphaned media:');
    const { data: orphanedMedia, error: mediaError } = await supabase.rpc('check_orphaned_media');
    
    if (mediaError) {
      console.error(`Error checking orphaned media: ${mediaError.message}`);
    } else if (orphanedMedia && orphanedMedia.length > 0) {
      console.log(`Found ${orphanedMedia.length} orphaned media records:`);
      console.table(orphanedMedia);
    } else {
      console.log('No orphaned media found.');
    }
    
    // Verify identity registry integration
    console.log('\nVerifying identity registry integration:');
    const { data: identityVerification, error: identityError } = await supabase.rpc('verify_identity_source_of_truth');
    
    if (identityError) {
      console.error(`Error verifying identity registry: ${identityError.message}`);
    } else {
      console.table(identityVerification);
    }
    
    console.log('\nVerification complete!');
  } catch (error) {
    console.error(`Error applying fixes: ${error.message}`);
    process.exit(1);
  }
}

runFixes();
