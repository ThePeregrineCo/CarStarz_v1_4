#!/bin/bash

echo "=== Adding vehicle_videos table to Supabase using Node.js ==="
echo "This script will add the vehicle_videos table to your Supabase database"
echo

# Check if .env.local exists in the nextjs directory
if [ -f packages/nextjs/.env.local ]; then
  echo "Loading environment variables from packages/nextjs/.env.local..."
  export $(grep -v '^#' packages/nextjs/.env.local | xargs)
elif [ -f .env.local ]; then
  echo "Loading environment variables from .env.local..."
  export $(grep -v '^#' .env.local | xargs)
else
  echo "❌ Error: .env.local file not found."
  echo "Please make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file."
  exit 1
fi

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Required environment variables not found."
  echo "Please make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file."
  exit 1
fi

# Run the Node.js script
echo "Running add-vehicle-videos-table.mjs..."
node packages/nextjs/add-vehicle-videos-table.mjs

# Check if the execution was successful
if [ $? -eq 0 ]; then
  echo
  echo "✅ Script executed successfully!"
else
  echo
  echo "❌ Script execution failed. Check the error messages above."
  exit 1
fi