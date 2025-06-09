#!/bin/bash

# Script to reset the CARSTARZ database schema

echo "Running database reset script..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js to run this script."
    exit 1
fi

# Run the reset script
node ./reset-db-direct.mjs

echo "Database reset completed."