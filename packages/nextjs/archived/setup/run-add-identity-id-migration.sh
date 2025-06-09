#!/bin/bash

# Exit on error
set -e

echo "=== Adding identity_id to vehicle_profiles table ==="
echo "This script will modify the vehicle_profiles table to add a foreign key to identity_registry"
echo "WARNING: Make sure you have backed up your database before proceeding"
echo

# Confirm with the user
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

# Run the migration script
echo "Running migration script..."
node run-add-identity-id-migration.mjs

echo
echo "Migration complete!"