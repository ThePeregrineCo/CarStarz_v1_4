#!/bin/bash

# Exit on error
set -e

echo "=== CarStarz Complete Database Reset ==="
echo "This script will reset the database with ALL tables, including identity registry"
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

# Run the reset script
echo "Running complete database reset..."
node reset-all-db.mjs

echo
echo "If you need to reset the blockchain as well, run the reset-hardhat-contracts.sh script."