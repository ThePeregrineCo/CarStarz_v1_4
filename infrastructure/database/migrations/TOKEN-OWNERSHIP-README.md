# Token Ownership Fixes

This document explains the token ownership fixes added to the CarStarz database schema.

## The Problem

The verification output showed that the `token_ownership` table was missing or not accessible, even though it's defined in the schema:

```
Checking for key tables in the public schema...
✅ Table 'identity_registry' exists
✅ Table 'vehicle_profiles' exists
❌ Table 'token_ownership' does not exist or is not accessible
✅ Table 'verification_levels' exists
✅ Table 'follows' exists
✅ Table 'social_links' exists
✅ Table 'vehicle_media' exists
✅ Table 'vehicle_modifications' exists
Found 7 out of 8 key tables.
```

This indicates that there might be issues with:
1. The table creation SQL
2. The order of operations in the schema
3. Missing dependencies or constraints
4. Permissions issues

## The Solution

We've created a fixed version of the simplified wallet-identity schema that:

1. Ensures the `token_ownership` table is properly created
2. Adds explicit indexes for better performance
3. Adds RLS policies specifically for token ownership
4. Includes verification and fixing functions
5. Creates additional views for token ownership status
6. Ensures proper population of token ownership records

## Files Created

1. **Fixed Schema**
   - `infrastructure/database/migrations/simplified-wallet-identity-schema-fixed.sql`
   - Enhanced version of the simplified schema with token ownership fixes

2. **Run Script**
   - `packages/nextjs/scripts/run-fixed-schema.sh`
   - Script to apply the fixed schema to your Supabase database

3. **Verification Tool**
   - `packages/nextjs/verify-token-ownership.mjs`
   - Node.js script to verify and fix token ownership inconsistencies

## How to Use

### 1. Apply the Fixed Schema

```bash
# Make the script executable
chmod +x packages/nextjs/scripts/run-fixed-schema.sh

# Run with your Supabase credentials
SUPABASE_URL=https://your-project-ref.supabase.co SUPABASE_KEY=your-service-role-key ./packages/nextjs/scripts/run-fixed-schema.sh
```

This will:
- Apply the fixed schema
- Run verification checks
- Populate any missing token ownership records

### 2. Verify Token Ownership

After applying the fixed schema, you can verify token ownership:

```bash
# Make the script executable
chmod +x packages/nextjs/verify-token-ownership.mjs

# Run the verification script
node packages/nextjs/verify-token-ownership.mjs
```

This will:
- Check if the token_ownership table exists
- Count vehicle profiles and token ownership records
- Identify any missing token ownership records
- Offer to fix missing records

### 3. Manual Verification

You can also manually verify the token ownership setup in the Supabase dashboard:

```sql
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
```

## Key Enhancements

### 1. Token Ownership Table

The fixed schema ensures the token_ownership table is properly created:

```sql
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
```

### 2. Synchronization Trigger

The fixed schema includes a trigger to keep token_ownership in sync with vehicle_profiles:

```sql
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
CREATE TRIGGER sync_token_ownership_trigger
AFTER INSERT OR UPDATE OF owner_id ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_token_ownership();
```

### 3. RLS Policies

The fixed schema adds specific RLS policies for token_ownership:

```sql
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
```

### 4. Enhanced Views

The fixed schema adds views for token ownership status and history:

```sql
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
```

## Conclusion

By applying these fixes, you'll ensure that token ownership is properly tracked in your database, which is essential for the blockchain integration aspects of your application. The token_ownership table serves as a critical link between your on-chain NFT tokens and your database records.