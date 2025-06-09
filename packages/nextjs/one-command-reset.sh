#!/bin/bash

# Exit on error
set -e

echo "=== CarStarz One-Command Reset ==="
echo "This script will reset the database, token counter, blockchain, and redeploy contracts"
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

# Kill any running hardhat node
echo "Killing any running hardhat node..."
pkill -f "hardhat node" || true

# Run the clean reset script
echo "Running clean reset script..."
cd packages/nextjs
./clean-reset.sh

# Start a fresh hardhat node in the background
echo "Starting a fresh hardhat node..."
cd ../hardhat
npx hardhat node > hardhat.log 2>&1 &
HARDHAT_PID=$!

# Wait for hardhat node to start
echo "Waiting for hardhat node to start..."
sleep 10

# Deploy the contracts
echo "Deploying contracts..."
npx hardhat deploy --network localhost

# Go back to nextjs directory
cd ../nextjs

echo "=== One-Command Reset Complete ==="
echo
echo "Hardhat node is running in the background with PID: $HARDHAT_PID"
echo "To start the Next.js dev server, run: cd packages/nextjs && yarn dev"
echo "To view your clean application, visit: http://localhost:3000"