#!/bin/bash

# Change to the project root directory
cd "$(dirname "$0")/.."

# Run the check-db-schema script
echo "Running database schema check..."
node check-db-schema.mjs