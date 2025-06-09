#!/bin/bash

# Exit on error
set -e

echo "=== CarStarz Complete Clean Slate ==="
echo "This script will reset both the database and hardhat contracts"
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

# Make scripts executable
chmod +x ./reset-and-use-v2-only.sh
chmod +x ./reset-hardhat-contracts.sh

# Step 1: Reset the database and use V2 components
echo "Step 1: Resetting database and updating to V2 components..."
./reset-and-use-v2-only.sh

# Step 2: Reset the hardhat contracts
echo "Step 2: Resetting hardhat contracts..."
./reset-hardhat-contracts.sh

echo
echo "=== Complete Clean Slate Finished ==="
echo "Your CarStarz application has been completely reset with:"
echo "1. Clean database using only V2 schema"
echo "2. Fresh hardhat contracts with no minted NFTs"
echo "3. All code updated to use V2 components"
echo
echo "Next steps:"
echo "1. Start your hardhat node: cd ../hardhat && npx hardhat node"
echo "2. In a new terminal, start your Next.js dev server: cd ../nextjs && npm run dev"
echo "3. Visit http://localhost:3000 to use your clean application"