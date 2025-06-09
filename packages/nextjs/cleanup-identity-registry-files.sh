#!/bin/bash

# Cleanup script for identity registry files
# This script deletes the unused files after consolidating the SQL scripts

echo "Cleaning up unused identity registry files..."

# List of files to delete
FILES_TO_DELETE=(
  "identity-registry-complete.sql"
  "identity-registry-direct.sql"
  "setup-identity-registry.sql"
  "setup-identity-registry-functions.sql"
  "setup-identity-registry-direct.mjs"
  "run-identity-setup-direct.sh"
  "run-create-identity-registry-simple.sh"
  "create-identity-registry-simple.mjs"
  "create-identity-registry-direct.mjs"
)

# Delete each file if it exists
for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    echo "Deleting $file..."
    rm "$file"
  else
    echo "$file does not exist, skipping..."
  fi
done

echo "Cleanup complete!"