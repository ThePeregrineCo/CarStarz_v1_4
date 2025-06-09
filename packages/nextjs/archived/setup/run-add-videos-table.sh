#!/bin/bash

echo "=== Adding vehicle_videos table to Supabase ==="
echo "This script will add the vehicle_videos table to your Supabase database"
echo

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Loading environment variables from .env.local..."
  if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
  else
    echo "❌ Error: .env.local file not found."
    echo "Please make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file."
    exit 1
  fi
fi

# Check again if variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Required environment variables not found."
  echo "Please make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file."
  exit 1
fi

# Execute the SQL file using curl
echo "Executing add-vehicle-videos-table.sql..."
curl -X POST "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$(cat packages/nextjs/add-vehicle-videos-table.sql | tr -d '\n' | sed 's/"/\\"/g')\"}"

# Check if the execution was successful
if [ $? -eq 0 ]; then
  echo
  echo "✅ vehicle_videos table has been successfully added to your database!"
  echo "You can now use the vehicleQueriesV2 methods to work with YouTube videos."
else
  echo
  echo "❌ Failed to add vehicle_videos table. Check the error messages above."
  exit 1
fi

echo
echo "To verify the table was created, check your Supabase dashboard."
echo "You can also test the API by adding a YouTube video using:"
echo "POST /api/vehicle-videos with JSON body: { title: 'My Video', youtube_url: 'https://youtube.com/watch?v=...' }"