#!/bin/bash

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js and try again."
  exit 1
fi

# Check if the migration script exists
if [ ! -f "./run-vehicle-identity-migration.mjs" ]; then
  echo "Error: Migration script not found. Make sure you're in the right directory."
  exit 1
fi

# Check if the SQL file exists
if [ ! -f "./vehicle-identity-integration.sql" ]; then
  echo "Error: SQL migration file not found. Make sure vehicle-identity-integration.sql exists."
  exit 1
fi

# Make the script executable if it's not already
chmod +x ./run-vehicle-identity-migration.mjs

echo "Running vehicle identity integration migration..."
node ./run-vehicle-identity-migration.mjs

# Check if the migration was successful
if [ $? -eq 0 ]; then
  echo "Migration completed successfully!"
else
  echo "Migration failed. Check the error messages above."
  exit 1
fi

echo "You can now use the identity_id field in vehicle_profiles to link vehicles to identity registry entries."