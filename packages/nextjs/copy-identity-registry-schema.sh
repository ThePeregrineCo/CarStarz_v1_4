#!/bin/bash

# Script to copy the identity-registry-schema.sql file to the project root directory
# This is needed because the setup-identity-registry API endpoint looks for the file in the project root

echo "Copying identity-registry-schema.sql to project root..."

# Get the current directory
CURRENT_DIR=$(pwd)

# Check if we're in the packages/nextjs directory
if [[ "$CURRENT_DIR" == *"/packages/nextjs" ]]; then
  # We're in the packages/nextjs directory, copy to ../../
  cp identity-registry-schema.sql ../../identity-registry-schema.sql
  echo "Copied from packages/nextjs to project root"
else
  # We're in the project root, copy to the root
  cp packages/nextjs/identity-registry-schema.sql ./identity-registry-schema.sql
  echo "Copied from packages/nextjs to current directory"
fi

# Check if the copy was successful
if [ -f "./identity-registry-schema.sql" ] || [ -f "../../identity-registry-schema.sql" ]; then
  echo "Copy successful!"
else
  echo "Error: Failed to copy identity-registry-schema.sql to project root"
  exit 1
fi

echo "Done!"