#!/bin/bash

# Exit on error
set -e

echo "=== CarStarz Vehicle Data Migration ==="
echo "This script will migrate vehicle data from the old schema to the new schema"
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

# Run the migration script
echo "Running migrate-vehicle-data.ts..."
npx ts-node scripts/migrate-vehicle-data.ts

echo
echo "=== Migration Complete ==="
echo "You can now view your vehicles using the new V2 components"
echo "Try visiting /vehicle/49 to see if the migration was successful"