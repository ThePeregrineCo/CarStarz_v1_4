#!/bin/bash

# Script to run the simplified wallet-identity schema in Supabase
# This script uses the Supabase CLI to execute the SQL script

# Check if SUPABASE_URL and SUPABASE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set."
  echo "You can find these in your Supabase project settings."
  echo ""
  echo "Example usage:"
  echo "  SUPABASE_URL=https://your-project-ref.supabase.co SUPABASE_KEY=your-service-role-key ./run-simplified-schema.sh"
  exit 1
fi

# Path to the SQL file
SQL_FILE="../infrastructure/database/migrations/simplified-wallet-identity-schema.sql"

# Check if the SQL file exists
if [ ! -f "$SQL_FILE" ]; then
  echo "Error: SQL file not found at $SQL_FILE"
  exit 1
fi

echo "Running simplified wallet-identity schema..."
echo "This will reset your database and create a new schema."
echo "All existing data will be lost."
echo ""
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Operation cancelled."
  exit 0
fi

# Execute the SQL file using curl to the Supabase REST API
echo "Executing SQL script..."
curl -X POST \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat $SQL_FILE | tr -d '\n' | sed 's/"/\\"/g')\"}" \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql"

# Check if the curl command was successful
if [ $? -eq 0 ]; then
  echo "Schema executed successfully!"
  echo ""
  echo "You can now verify the setup by running the following SQL in the Supabase dashboard:"
  echo "SELECT verify_setup();"
else
  echo "Error executing schema. Please check your Supabase credentials and try again."
fi