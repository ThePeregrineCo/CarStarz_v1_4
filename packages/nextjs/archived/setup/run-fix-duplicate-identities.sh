#!/bin/bash

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js and try again."
  exit 1
fi

# Check if the migration script exists
if [ ! -f "./run-fix-duplicate-identities.mjs" ]; then
  echo "Error: Fix script not found. Make sure you're in the right directory."
  exit 1
fi

# Check if the SQL file exists
if [ ! -f "./fix-duplicate-identities.sql" ]; then
  echo "Error: SQL fix file not found. Make sure fix-duplicate-identities.sql exists."
  exit 1
fi

# Make the script executable if it's not already
chmod +x ./run-fix-duplicate-identities.mjs

echo "Running duplicate identity fix..."
node ./run-fix-duplicate-identities.mjs

# Check if the fix was successful
if [ $? -eq 0 ]; then
  echo "Fix completed successfully!"
else
  echo "Fix failed. Check the error messages above."
  exit 1
fi

echo "The identity_registry table should now have unique wallet addresses and a UNIQUE constraint on the normalized_wallet column."