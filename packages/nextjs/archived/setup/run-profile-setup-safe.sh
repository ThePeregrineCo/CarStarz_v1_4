#!/bin/bash

# Exit on error
set -e

echo "=== CarStarz Profile System Setup (Safe Version) ==="
echo "This script will set up the database schema and seed test data for profiles"
echo "This version uses a safer schema that won't interfere with the minting process"
echo

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(grep -v '^#' .env.local | xargs)
fi

# Check if NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
  echo "Please check your .env.local file and try again"
  exit 1
fi

# Always set SUPABASE_URL from NEXT_PUBLIC_SUPABASE_URL for the script
export SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
echo "Using SUPABASE_URL: ${SUPABASE_URL}"

# Navigate to the nextjs directory
cd "$(dirname "$0")"

echo "=== Running database migrations ==="
# Run the SQL file against Supabase
echo "Applying schema updates..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat schema-profile-updates-safe.sql | tr -d '\n' | sed 's/"/\\"/g')\"}"

# Print the URL used for debugging
echo "Using Supabase URL: ${SUPABASE_URL}"

echo
echo "=== Seeding test data ==="
# Run the TypeScript seeding script
echo "Compiling and running seed script..."
npx tsx scripts/seed-test-profiles-safe.ts

echo
echo "=== Setup Complete ==="
echo "You can now test the profile system with the following URLs:"
echo "- User Profile: http://localhost:3000/user/testuser"
echo "- Business Profile: http://localhost:3000/business/{business_id} (check console output for ID)"
echo "- Club Profile: http://localhost:3000/club/{club_id} (check console output for ID)"
echo
echo "Start the development server with: npm run dev"
echo
echo "IMPORTANT: This setup uses a safer schema that won't interfere with the minting process."
echo "The main changes are:"
echo "1. Using token_id instead of foreign keys to vehicle_profiles"
echo "2. No modifications to existing tables"
echo "3. No constraints that would affect the minting process"