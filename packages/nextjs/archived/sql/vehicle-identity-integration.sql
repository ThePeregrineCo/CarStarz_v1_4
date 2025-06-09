-- Vehicle Identity Integration SQL
-- This script adds identity_id to vehicle_profiles and sets up triggers to handle ownership transfers
-- Purpose: Enable linking vehicle profiles to the identity registry system while maintaining
-- data integrity during NFT ownership transfers on the blockchain

-- Transaction wrapper to ensure all operations succeed or fail together
BEGIN;

-- First, check for and fix any duplicate wallet addresses in identity_registry
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check if normalized_wallet has a UNIQUE constraint
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'identity_registry_normalized_wallet_key'
        AND table_name = 'identity_registry'
    ) THEN
        -- Count duplicates
        SELECT COUNT(*) INTO duplicate_count
        FROM (
            SELECT normalized_wallet
            FROM identity_registry
            GROUP BY normalized_wallet
            HAVING COUNT(*) > 1
        ) as duplicates;
        
        IF duplicate_count > 0 THEN
            RAISE NOTICE 'Found % wallet addresses with duplicate entries in identity_registry', duplicate_count;
            RAISE NOTICE 'Please run the fix-duplicate-identities.sql script before proceeding';
            RAISE EXCEPTION 'Duplicate wallet addresses found in identity_registry';
        END IF;
        
        -- Add UNIQUE constraint to prevent future duplicates
        ALTER TABLE identity_registry ADD CONSTRAINT identity_registry_normalized_wallet_key UNIQUE (normalized_wallet);
        RAISE NOTICE 'Added UNIQUE constraint on normalized_wallet column';
    END IF;
END $$;

-- Step 1: Add identity_id column to vehicle_profiles
-- This creates a relationship between vehicles and their owners' identities
ALTER TABLE vehicle_profiles
ADD COLUMN IF NOT EXISTS identity_id UUID REFERENCES identity_registry(id);

-- Step 2: Create index for faster lookups by identity_id
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_identity_id ON vehicle_profiles(identity_id);

-- Step 3: Update existing records to set identity_id based on owner_wallet
-- This ensures all existing vehicles are properly linked to their owners' identities
UPDATE vehicle_profiles
SET identity_id = ir.id
FROM identity_registry ir
WHERE LOWER(vehicle_profiles.owner_wallet) = ir.normalized_wallet;

-- Log records that couldn't be linked (for monitoring purposes)
DO $$
DECLARE
    unlinked_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unlinked_count
    FROM vehicle_profiles
    WHERE identity_id IS NULL AND owner_wallet IS NOT NULL;
    
    IF unlinked_count > 0 THEN
        RAISE NOTICE 'Warning: % vehicle profiles have owner_wallet but no matching identity_id', unlinked_count;
    END IF;
END $$;

-- Step 4: Create a function to handle owner_wallet changes and maintain identity_id consistency
CREATE OR REPLACE FUNCTION sync_vehicle_owner_identity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if owner_wallet has changed
  IF OLD.owner_wallet IS DISTINCT FROM NEW.owner_wallet THEN
    -- Try to find the identity_id for the new owner
    SELECT id INTO NEW.identity_id
    FROM identity_registry
    WHERE normalized_wallet = LOWER(NEW.owner_wallet);
    
    -- If no identity found, identity_id will be NULL
    -- This allows transfers to wallets without identity registry entries
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a trigger to automatically update identity_id when owner_wallet changes
DROP TRIGGER IF EXISTS sync_vehicle_owner_identity_trigger ON vehicle_profiles;
CREATE TRIGGER sync_vehicle_owner_identity_trigger
BEFORE UPDATE ON vehicle_profiles
FOR EACH ROW
WHEN (OLD.owner_wallet IS DISTINCT FROM NEW.owner_wallet)
EXECUTE FUNCTION sync_vehicle_owner_identity();

-- Step 6: Create a function to handle new vehicle creation
CREATE OR REPLACE FUNCTION set_initial_vehicle_identity()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to find the identity_id for the owner
  SELECT id INTO NEW.identity_id
  FROM identity_registry
  WHERE normalized_wallet = LOWER(NEW.owner_wallet);
  
  -- If no identity found, identity_id will be NULL
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create a trigger for new vehicle creation
DROP TRIGGER IF EXISTS set_initial_vehicle_identity_trigger ON vehicle_profiles;
CREATE TRIGGER set_initial_vehicle_identity_trigger
BEFORE INSERT ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION set_initial_vehicle_identity();

-- Step 8: Create a view that joins vehicle_profiles with identity_registry
CREATE OR REPLACE VIEW vehicle_profiles_with_owner AS
SELECT 
  vp.*,
  ir.id as owner_id,
  ir.wallet_address as owner_wallet_address,
  ir.normalized_wallet as owner_normalized_wallet,
  ir.username as owner_username,
  ir.display_name as owner_display_name,
  ir.profile_image_url as owner_profile_image
FROM 
  vehicle_profiles vp
LEFT JOIN 
  identity_registry ir ON vp.identity_id = ir.id;

-- Step 9: Create a function to automatically create identity registry entries for new vehicle owners
CREATE OR REPLACE FUNCTION ensure_vehicle_owner_has_identity()
RETURNS TRIGGER AS $$
DECLARE
  identity_exists BOOLEAN;
BEGIN
  -- Check if the owner already has an identity
  SELECT EXISTS(
    SELECT 1 FROM identity_registry 
    WHERE normalized_wallet = LOWER(NEW.owner_wallet)
  ) INTO identity_exists;
  
  -- If not, create a basic identity entry
  IF NOT identity_exists THEN
    INSERT INTO identity_registry (
      wallet_address,
      normalized_wallet,
      username,
      display_name
    ) VALUES (
      NEW.owner_wallet,
      LOWER(NEW.owner_wallet),
      'user_' || SUBSTRING(LOWER(NEW.owner_wallet), 3, 6),
      SUBSTRING(NEW.owner_wallet, 1, 6) || '...' || SUBSTRING(NEW.owner_wallet, LENGTH(NEW.owner_wallet) - 3)
    );
    
    -- Update the vehicle with the new identity_id
    NEW.identity_id := (
      SELECT id FROM identity_registry 
      WHERE normalized_wallet = LOWER(NEW.owner_wallet)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create a trigger to ensure vehicle owners have identity registry entries
DROP TRIGGER IF EXISTS ensure_vehicle_owner_has_identity_trigger ON vehicle_profiles;
CREATE TRIGGER ensure_vehicle_owner_has_identity_trigger
BEFORE INSERT OR UPDATE OF owner_wallet ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION ensure_vehicle_owner_has_identity();

-- Step 11: Create a function to handle blockchain transfer events
-- This is a placeholder for an API endpoint that will be called when NFT transfers are detected
-- The actual implementation will be in the application code
COMMENT ON TABLE vehicle_profiles IS 'Stores vehicle profile data with identity_id linking to owner identity';
COMMENT ON COLUMN vehicle_profiles.identity_id IS 'References identity_registry.id - automatically updated when owner_wallet changes';
COMMENT ON COLUMN vehicle_profiles.owner_wallet IS 'Blockchain wallet address of the current vehicle owner - source of truth for ownership';

-- Step 12: Create a function to verify data integrity
CREATE OR REPLACE FUNCTION verify_vehicle_identity_integrity()
RETURNS TABLE (
    token_id INTEGER,
    owner_wallet TEXT,
    identity_id UUID,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vp.token_id,
        vp.owner_wallet,
        vp.identity_id,
        CASE
            WHEN vp.identity_id IS NULL AND vp.owner_wallet IS NOT NULL THEN 'Missing identity'
            WHEN ir.normalized_wallet != LOWER(vp.owner_wallet) THEN 'Mismatched identity'
            ELSE 'OK'
        END as status
    FROM
        vehicle_profiles vp
    LEFT JOIN
        identity_registry ir ON vp.identity_id = ir.id
    WHERE
        vp.identity_id IS NULL OR ir.normalized_wallet != LOWER(vp.owner_wallet);
END;
$$ LANGUAGE plpgsql;

-- Commit all changes if everything succeeded
COMMIT;