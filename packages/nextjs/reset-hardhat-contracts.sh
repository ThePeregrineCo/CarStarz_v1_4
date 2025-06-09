#!/bin/bash

# Exit on error
set -e

echo "=== CarStarz Hardhat Contract Reset ==="
echo "This script will reset the hardhat contracts and clear all minted NFTs"
echo "WARNING: This will delete all existing NFTs in the contracts"
echo

# Confirm with the user
read -p "Are you sure you want to proceed? This will delete all existing NFTs. (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

# Navigate to the hardhat directory
cd ../hardhat

echo "Step 1: Clearing existing contract data..."

# Reset the local hardhat node
echo "Resetting local hardhat node..."
npx hardhat clean

# Reset the token counter
echo "Resetting token counter..."
cat > ../nextjs/data/tokenCounter.json << 'EOL'
{
  "counter": 1
}
EOL

echo "Step 2: Redeploying contracts..."

# Deploy the contracts
echo "Deploying contracts..."
npx hardhat deploy --network localhost

echo "Step 3: Verifying deployment..."

# Check that the contracts were deployed successfully
echo "Checking contract deployment..."
npx hardhat run scripts/checkContract.ts --network localhost

# Navigate back to the nextjs directory
cd ../nextjs

echo
echo "=== Hardhat Reset Complete ==="
echo "The hardhat contracts have been reset and redeployed."
echo "You can now restart your development server and test the app with fresh contracts."