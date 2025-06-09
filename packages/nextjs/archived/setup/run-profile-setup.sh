#!/bin/bash

# Exit on error
set -e

echo "=== CarStarz Profile System Setup ==="
echo "This script will set up the database schema and seed test data for profiles"
echo

# Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
  echo "Please set these variables and try again"
  exit 1
fi

# Navigate to the nextjs directory
cd "$(dirname "$0")"

echo "=== Running database migrations ==="
# Run the SQL file against Supabase
echo "Applying schema updates..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat schema-profile-updates.sql | tr -d '\n' | sed 's/"/\\"/g')\"}"

echo
echo "=== Seeding test data ==="
# Run the TypeScript seeding script
echo "Compiling and running seed script..."
npx tsx scripts/seed-test-profiles.ts

echo
echo "=== Setup Complete ==="
echo "You can now test the profile system with the following URLs:"
echo "- User Profile: http://localhost:3000/user/testuser"
echo "- Business Profile: http://localhost:3000/business/{business_id} (check console output for ID)"
echo "- Club Profile: http://localhost:3000/club/{club_id} (check console output for ID)"
echo
echo "Start the development server with: npm run dev"