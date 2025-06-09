#!/bin/bash

# Script to run consolidated database migrations
# This script creates a consolidated migration file from archived SQL files
# and executes it against the database

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

# Create migrations directory if it doesn't exist
mkdir -p infrastructure/database/migrations

# Create the consolidated migration file
MIGRATION_FILE="infrastructure/database/migrations/01-consolidated-schema.sql"

# Start with a header
print_header "Creating consolidated migration file"
echo "-- Consolidated Migration File" > $MIGRATION_FILE
echo "-- Generated on $(date)" >> $MIGRATION_FILE
echo "-- This file contains all database schema migrations" >> $MIGRATION_FILE
echo "" >> $MIGRATION_FILE

# Add the reset-schema-carstarz.sql file first
if [ -f "packages/nextjs/archived/sql/reset-schema-carstarz.sql" ]; then
  echo "-- Including reset-schema-carstarz.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  cat "packages/nextjs/archived/sql/reset-schema-carstarz.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  print_success "Added reset-schema-carstarz.sql"
else
  print_error "reset-schema-carstarz.sql not found"
fi

# Add the identity-registry-schema.sql file next
if [ -f "packages/nextjs/archived/sql/identity-registry-schema.sql" ]; then
  echo "-- Including identity-registry-schema.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  cat "packages/nextjs/archived/sql/identity-registry-schema.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  print_success "Added identity-registry-schema.sql"
else
  print_error "identity-registry-schema.sql not found"
fi

# Add the vehicle-identity-integration.sql file
if [ -f "packages/nextjs/archived/sql/vehicle-identity-integration.sql" ]; then
  echo "-- Including vehicle-identity-integration.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  cat "packages/nextjs/archived/sql/vehicle-identity-integration.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  print_success "Added vehicle-identity-integration.sql"
else
  print_error "vehicle-identity-integration.sql not found"
fi

# Add the add-vehicle-videos-table.sql file
if [ -f "packages/nextjs/archived/sql/add-vehicle-videos-table.sql" ]; then
  echo "-- Including add-vehicle-videos-table.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  cat "packages/nextjs/archived/sql/add-vehicle-videos-table.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  print_success "Added add-vehicle-videos-table.sql"
else
  print_error "add-vehicle-videos-table.sql not found"
fi

print_success "Migration file created at $MIGRATION_FILE"

# Create a Node.js script to run the migration
print_header "Creating migration runner script"
RUNNER_SCRIPT="packages/nextjs/run-consolidated-migration.mjs"

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

// Path to the consolidated migration file - using absolute path with __dirname
const migrationFilePath = join(__dirname, '..', 'infrastructure', 'database', 'migrations', '01-consolidated-schema.sql');

// Read the migration file
console.log(`Reading migration file: ${migrationFilePath}`);
let migrationSql;
try {
  migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
} catch (error) {
  console.error(`Error reading migration file: ${error.message}`);
  process.exit(1);
}

// Execute the migration
console.log('Executing migration...');
async function runMigration() {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });
    
    if (error) {
      console.error(`Error executing migration: ${error.message}`);
      process.exit(1);
    }
    
    console.log('Migration executed successfully!');
  } catch (error) {
    console.error(`Error executing migration: ${error.message}`);
    process.exit(1);
  }
}

runMigration();
EOF

print_success "Migration runner script created at $RUNNER_SCRIPT"

print_header "Running migration"
echo "To run the migration, execute:"
echo "node packages/nextjs/run-consolidated-migration.mjs"
echo ""
echo "Make sure your .env.local file contains the following environment variables:"
echo "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url"
echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
echo ""
echo "Run it now? (y/n)"
read -p "> " run_now

if [ "$run_now" = "y" ] || [ "$run_now" = "Y" ]; then
  node packages/nextjs/run-consolidated-migration.mjs
else
  echo "Migration not executed. Run it manually when ready."
fi