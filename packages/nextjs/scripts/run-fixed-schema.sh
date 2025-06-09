#!/bin/bash

# Script to run the fixed wallet-identity schema in Supabase
# This script uses the Supabase CLI to execute the SQL script with token ownership fixes

# Check if SUPABASE_URL and SUPABASE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set."
  echo "You can find these in your Supabase project settings."
  echo ""
  echo "Example usage:"
  echo "  SUPABASE_URL=https://your-project-ref.supabase.co SUPABASE_KEY=your-service-role-key ./run-fixed-schema.sh"
  exit 1
fi

# Path to the SQL file
SQL_FILE="../infrastructure/database/migrations/simplified-wallet-identity-schema-fixed.sql"

# Check if the SQL file exists
if [ ! -f "$SQL_FILE" ]; then
  echo "Error: SQL file not found at $SQL_FILE"
  exit 1
fi

echo "Running fixed wallet-identity schema with token ownership..."
echo "This will reset your database and create a new schema with proper token ownership."
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
  echo "Now let's verify the token ownership setup:"
  
  # Create a temporary verification script
  TMP_FILE=$(mktemp)
  cat > $TMP_FILE << 'EOF'
  -- Check if token_ownership table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'token_ownership'
  ) as token_ownership_exists;
  
  -- Check if there are any vehicle profiles
  SELECT COUNT(*) as vehicle_count FROM vehicle_profiles;
  
  -- Check if token ownership is populated
  SELECT COUNT(*) as token_ownership_count FROM token_ownership;
  
  -- Check for any inconsistencies
  SELECT COUNT(*) as inconsistency_count FROM (
    SELECT vp.id, vp.token_id, vp.owner_id
    FROM vehicle_profiles vp
    LEFT JOIN token_ownership to_own ON vp.token_id = to_own.token_id
    WHERE to_own.token_id IS NULL
  ) as missing_token_ownership;
  
  -- Populate any missing token ownership records
  INSERT INTO token_ownership (token_id, identity_id, vehicle_id)
  SELECT 
    vp.token_id,
    vp.owner_id,
    vp.id
  FROM 
    vehicle_profiles vp
  LEFT JOIN 
    token_ownership to_own ON vp.token_id = to_own.token_id
  WHERE 
    to_own.token_id IS NULL
  RETURNING token_id, identity_id, vehicle_id;
EOF

  # Execute the verification script
  echo "Running verification checks..."
  curl -X POST \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$(cat $TMP_FILE | tr -d '\n' | sed 's/"/\\"/g')\"}" \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql"
  
  # Clean up
  rm $TMP_FILE
  
  echo ""
  echo "You can now verify the setup by running the following SQL in the Supabase dashboard:"
  echo "SELECT * FROM token_ownership_status LIMIT 10;"
else
  echo "Error executing schema. Please check your Supabase credentials and try again."
fi