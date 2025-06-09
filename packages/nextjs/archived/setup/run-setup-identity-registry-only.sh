#!/bin/bash

# Exit on error
set -e

echo "=== Setting Up Identity Registry Tables ==="
echo "This script will create identity registry tables without affecting existing vehicle tables"
echo

# Confirm with the user
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

# Run the setup script
echo "Setting up identity registry tables..."
node setup-identity-registry-only.mjs

echo
echo "If you need to reset the blockchain as well, run the reset-hardhat-contracts.sh script."