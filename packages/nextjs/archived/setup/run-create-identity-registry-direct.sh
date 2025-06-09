#!/bin/bash

# Run Identity Registry Direct Creation Script
# This script creates the identity registry table directly in Supabase

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "Error: .env.local file not found!"
  echo "Please create a .env.local file with your Supabase credentials:"
  echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
  echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
  exit 1
fi

# Check if required environment variables are set
if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local || ! grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
  echo "Error: Missing required environment variables in .env.local!"
  echo "Please ensure the following variables are set:"
  echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
  echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
  exit 1
fi

# Install required dependencies if not already installed
if ! npm list @supabase/supabase-js >/dev/null 2>&1; then
  echo "Installing required dependencies..."
  npm install @supabase/supabase-js dotenv
fi

# Run the direct creation script
echo "Running identity registry direct creation script..."
node create-identity-registry-direct.mjs

# Check if the script was successful
if [ $? -eq 0 ]; then
  echo "Identity registry direct creation completed successfully!"
else
  echo "Error: Identity registry direct creation failed!"
  exit 1
fi

echo "You can now use the identity registry in your application."
echo "To check the database tables, run: node check-db-tables-v2.mjs"