#!/bin/bash

# Script to run database verification fixes
# This script applies fixes to ensure database integrity and consistency

# Set up colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${YELLOW}==== $1 ====${NC}\n"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Check if the combined verification fixes file exists
if [ ! -f "infrastructure/database/migrations/combined-verification-fixes.sql" ]; then
  print_error "Combined verification fixes file not found at infrastructure/database/migrations/combined-verification-fixes.sql"
  exit 1
fi

# Create a Node.js script to run the fixes
print_header "Creating verification fixes runner script"
RUNNER_SCRIPT="packages/nextjs/run-verification-fixes.mjs"

cat > $RUNNER_SCRIPT << 'EOF'
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '.env.local') });

// Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl || 'Not found');
console.log('Supabase Service Role Key available:', !!supabaseServiceRoleKey);

// Check if environment variables are available
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Supabase credentials not found in environment variables.');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Path to the combined verification fixes file - using absolute path with __dirname
const fixesFilePath = join(__dirname, '..', 'infrastructure', 'database', 'migrations', 'combined-verification-fixes.sql');

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
EOF

print_success "Verification fixes runner script created at $RUNNER_SCRIPT"

print_header "Running verification fixes"
echo "This script will apply fixes to ensure database integrity and consistency."
echo "It will:"
echo "1. Fix wallet address inconsistencies"
echo "2. Fix orphaned media records"
echo "3. Create missing identity registry entries"
echo "4. Update vehicle owner IDs"
echo "5. Fix wallet address mismatches"
echo ""
echo "Run it now? (y/n)"
read -p "> " run_now

if [ "$run_now" = "y" ] || [ "$run_now" = "Y" ]; then
  node packages/nextjs/run-verification-fixes.mjs
else
  echo "Verification fixes not executed. Run it manually when ready with:"
  echo "node packages/nextjs/run-verification-fixes.mjs"
  echo ""
  echo "Make sure your .env.local file contains the following environment variables:"
  echo "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url"
  echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
fi