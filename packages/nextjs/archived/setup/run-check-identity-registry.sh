#!/bin/bash

# Run the check-identity-registry.mjs script
# This script checks the identity_registry table in Supabase

# Make sure we're in the nextjs directory
cd "$(dirname "$0")"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "Warning: .env.local file not found!"
  echo "You may need to set environment variables manually:"
  echo "export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
  echo "export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed!"
  exit 1
fi

# Make the script executable
chmod +x check-identity-registry.mjs

# Run the script
echo "Running check-identity-registry.mjs..."
node check-identity-registry.mjs

# Check if the script was successful
if [ $? -eq 0 ]; then
  echo "Check completed successfully!"
else
  echo "Error: Check failed!"
  exit 1
fi