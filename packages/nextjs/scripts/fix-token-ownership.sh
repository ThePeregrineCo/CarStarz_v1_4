#!/bin/bash

# Script to fix token ownership in the database
# This script applies only the token ownership fixes to your Supabase database

# Check if SUPABASE_URL and SUPABASE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set."
  echo "You can find these in your Supabase project settings."
  echo ""
  echo "Example usage:"
  echo "  SUPABASE_URL=https://your-project-ref.supabase.co SUPABASE_KEY=your-service-role-key ./fix-token-ownership.sh"
  exit 1
fi

echo "Fixing token ownership table..."
echo "This will create or fix the token_ownership table without affecting other tables."
echo ""
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Operation cancelled."
  exit 0
fi

# Create a temporary SQL file with just the token ownership fixes
TMP_FILE=$(mktemp)
cat > $TMP_FILE << 'EOF'
-- Drop and recreate token_ownership table
DROP TABLE IF EXISTS token_ownership CASCADE;

-- Create token_ownership table
CREATE TABLE token_ownership (
    token_id INTEGER PRIMARY KEY,
    identity_id UUID NOT NULL REFERENCES identity_registry(id),
    vehicle_id UUID NOT NULL REFERENCES vehicle_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_token_ownership_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- Create indexes for token ownership lookups
CREATE INDEX idx_token_ownership_identity_id ON token_ownership(identity_id);
CREATE INDEX idx_token_ownership_vehicle_id ON token_ownership(vehicle_id);

-- Enable Row Level Security
ALTER TABLE token_ownership ENABLE ROW LEVEL SECURITY;

-- Token ownership policies
CREATE POLICY "Token ownership records are viewable by everyone"
    ON token_ownership FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert token ownership records"
    ON token_ownership FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Only admins can update token ownership records"
    ON token_ownership FOR UPDATE
    USING (is_admin());

CREATE POLICY "Only admins can delete token ownership records"
    ON token_ownership FOR DELETE
    USING (is_admin());

-- Create a function to synchronize token_ownership with vehicle_profiles
CREATE OR REPLACE FUNCTION sync_token_ownership()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert into token_ownership
    INSERT INTO token_ownership (
        token_id,
        identity_id,
        vehicle_id
    ) VALUES (
        NEW.token_id,
        NEW.owner_id,
        NEW.id
    )
    ON CONFLICT (token_id) DO UPDATE SET
        identity_id = NEW.owner_id,
        vehicle_id = NEW.id,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep token_ownership in sync
DROP TRIGGER IF EXISTS sync_token_ownership_trigger ON vehicle_profiles;
CREATE TRIGGER sync_token_ownership_trigger
AFTER INSERT OR UPDATE OF owner_id ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_token_ownership();

-- Create a function to verify token ownership consistency
CREATE OR REPLACE FUNCTION verify_token_ownership_consistency()
RETURNS TABLE (
    token_id INTEGER,
    vehicle_id UUID,
    vehicle_token_id INTEGER,
    owner_id UUID,
    token_owner_id UUID,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_own.token_id,
        to_own.vehicle_id,
        vp.token_id AS vehicle_token_id,
        vp.owner_id,
        to_own.identity_id AS token_owner_id,
        CASE
            WHEN vp.id IS NULL THEN 'MISSING_VEHICLE'
            WHEN vp.token_id != to_own.token_id THEN 'TOKEN_ID_MISMATCH'
            WHEN vp.owner_id != to_own.identity_id THEN 'OWNER_MISMATCH'
            ELSE 'OK'
        END AS status
    FROM 
        token_ownership to_own
    LEFT JOIN 
        vehicle_profiles vp ON to_own.vehicle_id = vp.id
    WHERE 
        vp.id IS NULL OR
        vp.token_id != to_own.token_id OR
        vp.owner_id != to_own.identity_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to fix token ownership inconsistencies
CREATE OR REPLACE FUNCTION fix_token_ownership_inconsistencies()
RETURNS INTEGER AS $$
DECLARE
    v_fixed_count INTEGER := 0;
    v_record RECORD;
BEGIN
    -- Fix missing token_ownership records
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
        to_own.token_id IS NULL;
    
    GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
    
    -- Fix mismatched owner_id in token_ownership
    FOR v_record IN 
        SELECT * FROM verify_token_ownership_consistency()
        WHERE status = 'OWNER_MISMATCH'
    LOOP
        UPDATE token_ownership
        SET identity_id = v_record.owner_id,
            updated_at = NOW()
        WHERE token_id = v_record.token_id;
        
        v_fixed_count := v_fixed_count + 1;
    END LOOP;
    
    -- Fix mismatched token_id in token_ownership
    FOR v_record IN 
        SELECT * FROM verify_token_ownership_consistency()
        WHERE status = 'TOKEN_ID_MISMATCH'
    LOOP
        UPDATE token_ownership
        SET token_id = v_record.vehicle_token_id,
            updated_at = NOW()
        WHERE vehicle_id = v_record.vehicle_id;
        
        v_fixed_count := v_fixed_count + 1;
    END LOOP;
    
    -- Remove orphaned token_ownership records
    DELETE FROM token_ownership
    WHERE vehicle_id NOT IN (SELECT id FROM vehicle_profiles);
    
    GET DIAGNOSTICS v_fixed_count = v_fixed_count + ROW_COUNT;
    
    RETURN v_fixed_count;
END;
$$ LANGUAGE plpgsql;

-- View for token ownership status
CREATE OR REPLACE VIEW token_ownership_status AS
SELECT
    to_own.token_id,
    to_own.vehicle_id,
    to_own.identity_id,
    ir.wallet_address,
    ir.normalized_wallet,
    ir.username,
    ir.display_name,
    vp.make,
    vp.model,
    vp.year,
    vp.name AS vehicle_name,
    vp.status AS vehicle_status,
    (SELECT COUNT(*) FROM ownership_transfers ot WHERE ot.token_id = to_own.token_id) AS transfer_count,
    (SELECT MAX(ot.transfer_date) FROM ownership_transfers ot WHERE ot.token_id = to_own.token_id) AS last_transfer_date,
    to_own.created_at,
    to_own.updated_at
FROM
    token_ownership to_own
JOIN
    identity_registry ir ON to_own.identity_id = ir.id
JOIN
    vehicle_profiles vp ON to_own.vehicle_id = vp.id;

-- Populate token_ownership from vehicle_profiles
SELECT fix_token_ownership_inconsistencies();
EOF

# Execute the SQL file using curl to the Supabase REST API
echo "Executing SQL script..."
curl -X POST \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat $TMP_FILE | tr -d '\n' | sed 's/"/\\"/g')\"}" \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql"

# Check if the curl command was successful
if [ $? -eq 0 ]; then
  echo "Token ownership fixes applied successfully!"
  echo ""
  echo "Now let's verify the token ownership setup:"
  
  # Create a temporary verification script
  VERIFY_FILE=$(mktemp)
  cat > $VERIFY_FILE << 'EOF'
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
EOF

  # Execute the verification script
  echo "Running verification checks..."
  curl -X POST \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$(cat $VERIFY_FILE | tr -d '\n' | sed 's/"/\\"/g')\"}" \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql"
  
  # Clean up
  rm $TMP_FILE $VERIFY_FILE
  
  echo ""
  echo "You can now verify the setup by running the following SQL in the Supabase dashboard:"
  echo "SELECT * FROM token_ownership_status LIMIT 10;"
else
  echo "Error executing schema. Please check your Supabase credentials and try again."
  rm $TMP_FILE
fi