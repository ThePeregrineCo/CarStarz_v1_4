#!/bin/bash

# Exit on error
set -e

echo "=== CarStarz Complete Reset ==="
echo "This script will reset the database, token counter, and blockchain"
echo "WARNING: This will delete ALL existing data"
echo

# Confirm with the user
read -p "Are you sure you want to proceed? This will delete ALL existing data. (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

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

# Export Supabase variables explicitly
export SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
echo "Using SUPABASE_URL: ${SUPABASE_URL}"
echo "Using SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:5}..."

echo "Step 1: Resetting the database..."
# Run the comprehensive database reset script
echo "Running complete-reset-script.sql..."
npx supabase-js-cli db execute --file ./complete-reset-script.sql

echo "Step 2: Resetting token counter..."
# Reset the token counter to 1
echo "Setting token counter to 1..."
cat > ./data/tokenCounter.json << 'EOL'
{
  "default": 1
}
EOL
echo "Token counter reset to 1"

echo "Step 3: Resetting hardhat chain..."
# Navigate to the hardhat directory
cd ../hardhat

# Reset the local hardhat node
echo "Cleaning hardhat artifacts..."
npx hardhat clean

# Navigate back to the nextjs directory
cd ../nextjs

echo "Step 4: Preparing for contract redeployment..."
echo "The hardhat node needs to be restarted and contracts redeployed."
echo
echo "=== Complete Reset Finished ==="
echo
echo "Next steps:"
echo "1. Kill any running hardhat node"
echo "2. Start a fresh hardhat node: cd ../hardhat && npx hardhat node"
echo "3. In a new terminal, deploy the contracts: cd ../hardhat && npx hardhat deploy --network localhost"
echo "4. Start your Next.js dev server: cd ../nextjs && yarn dev"
echo "5. Visit http://localhost:3000 to use your clean application"
echo
echo "Your system has been reset to a clean state with:"
echo "- Empty database with fresh schema"
echo "- Token counter set to 1"
echo "- Clean hardhat environment ready for fresh contract deployment"