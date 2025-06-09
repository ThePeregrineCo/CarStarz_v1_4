#!/bin/bash

# Make the script executable
chmod +x run-unified-identity-migration.sh

# Check if .env.local file exists and load it
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local file..."
  export $(grep -v '^#' .env.local | xargs)
else
  echo "Warning: .env.local file not found."
fi

# Check if the required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  echo ""
  echo "The script tried to load these from your .env.local file, but they were not found."
  echo ""
  echo "Please make sure your .env.local file contains these variables:"
  echo "  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
  echo "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
  echo ""
  echo "You can find these values in your Supabase project settings."
  exit 1
fi

echo "Starting migration to unified identity system..."

# Check if the --confirm flag is provided
if [[ "$1" != "--confirm" ]]; then
  echo ""
  echo "⚠️  WARNING: This script will migrate data from the users table to the identity_registry table."
  echo "It is recommended to backup your database before proceeding."
  echo ""
  echo "To run the migration, add the --confirm flag:"
  echo "./run-unified-identity-migration.sh --confirm"
  exit 0
fi

# Run the migration script
node migrate-to-unified-identity.mjs --confirm

# Check if the script was successful
if [ $? -eq 0 ]; then
  echo "Migration to unified identity system completed successfully!"
else
  echo "Error: Migration to unified identity system failed"
  exit 1
fi

echo ""
echo "Next steps:"
echo "1. Update your application code to use the identity_registry table instead of the users table"
echo "2. After confirming everything works, uncomment the DROP TABLE users CASCADE; line in the SQL script"
echo "   and run the migration again to remove the users table"