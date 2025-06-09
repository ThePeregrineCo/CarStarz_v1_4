#!/bin/bash

# Get the current wallet address
WALLET_ADDRESS=$(npx hardhat run scripts/getWalletAddress.ts | grep "Wallet address:" | cut -d' ' -f3)

if [ -z "$WALLET_ADDRESS" ]; then
  echo "Failed to get wallet address"
  exit 1
fi

echo "Using wallet address: $WALLET_ADDRESS"

# Mint the test vehicle
echo "Minting test vehicle..."
npx hardhat run scripts/mintTestVehicle.ts

# Create the vehicle profile in the database
echo "Creating vehicle profile in the database..."
cd ../nextjs
node scripts/createTestVehicleProfile.mjs $WALLET_ADDRESS

echo "Test vehicle setup complete!"
echo "You can now visit: http://localhost:3000/vehicle/6"