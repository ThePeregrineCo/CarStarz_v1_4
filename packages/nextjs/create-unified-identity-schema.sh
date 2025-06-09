#!/bin/bash

# Make the script executable
chmod +x create-unified-identity-schema.sh

# Check if .env.local file exists and load it
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local file..."
  export $(grep -v '^#' .env.local | xargs)
else
  echo "Warning: .env.local file not found."
fi

# Check if the required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  echo ""
  echo "Please make sure your .env.local file contains these variables:"
  echo "  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
  echo "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
  echo ""
  echo "You can find these values in your Supabase project settings."
  exit 1
fi

echo "Creating unified identity schema..."

# Run the schema creation script
node create-unified-identity-schema.mjs

# Check if the script was successful
if [ $? -eq 0 ]; then
  echo "Unified identity schema created successfully!"
else
  echo "Error: Failed to create unified identity schema"
  exit 1
fi

echo ""
echo "Next steps:"
echo "1. Update your application code to use the unifiedProfileQueries module"
echo "2. Test the implementation by creating and updating user profiles"