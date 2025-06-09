#!/bin/bash

# Exit on error
set -e

echo "=== CarStarz Test Businesses Seeder ==="
echo "This script will seed test businesses in the database"
echo

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(grep -v '^#' .env.local | xargs)
fi

# Always set SUPABASE_URL from NEXT_PUBLIC_SUPABASE_URL for the script
export SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
echo "Using SUPABASE_URL: ${SUPABASE_URL}"

# Check if NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
  echo "Please check your .env.local file and try again"
  exit 1
fi

# Run the seed script
echo "Running seed-test-businesses.ts..."
npx ts-node scripts/seed-test-businesses.ts

echo
echo "=== Seeding Complete ==="
echo "You can now search for businesses in the vehicle builder tab"
echo "Try searching for 'Custom', 'Performance', 'Body', etc."