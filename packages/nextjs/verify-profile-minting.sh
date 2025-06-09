#!/bin/bash

# Exit on error
set -e

echo "=== CarStarz Profile-Minting Integration Verification ==="
echo "This script will help you verify that the profile system works with minting"
echo

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(grep -v '^#' .env.local | xargs)
fi

# Always set SUPABASE_URL from NEXT_PUBLIC_SUPABASE_URL for the script
export SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL

# Check if NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
  echo "Please check your .env.local file and try again"
  exit 1
fi

echo "Environment variables loaded successfully:"
echo "- NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:10}..."
echo "- SUPABASE_SERVICE_ROLE_KEY: [hidden]"
echo

# Step 1: Install the safe profile system
echo "=== Step 1: Install the safe profile system ==="
echo "This will set up the database schema and seed test data"
echo

chmod +x run-profile-setup-safe.sh
./run-profile-setup-safe.sh

echo
echo "=== Profile System Setup Complete ==="
echo
echo "To test the integration:"
echo
echo "1. Start the development server (if not already running):"
echo "   yarn dev"
echo
echo "2. Visit these URLs to verify the profile system:"
echo "   - User Profile: http://localhost:3000/user/testuser"
echo "   - Business Profile: http://localhost:3000/business/{id} (check console output for ID)"
echo "   - Club Profile: http://localhost:3000/club/{id} (check console output for ID)"
echo
echo "3. Test minting a vehicle:"
echo "   - Go to: http://localhost:3000/register"
echo "   - Connect your wallet"
echo "   - Fill out the vehicle details and mint"
echo
echo "4. Verify the integration:"
echo "   - Check that the vehicle was minted successfully"
echo "   - Check that you can view the vehicle profile"
echo "   - Check that you can associate the vehicle with businesses and clubs"
echo
echo "For detailed testing instructions, see MANUAL-TESTING-GUIDE.md"
echo "For information about the changes made, see PROFILE-MINTING-CHANGES-SUMMARY.md"