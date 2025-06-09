-- Fix duplicate identities in identity_registry
-- This script identifies and resolves duplicate wallet addresses in the identity_registry table

-- Transaction wrapper to ensure all operations succeed or fail together
BEGIN;

-- Create a temporary table to identify duplicates
CREATE TEMP TABLE duplicate_identities AS
SELECT 
    normalized_wallet,
    COUNT(*) as count,
    MIN(id) as keep_id,
    array_agg(id) as all_ids
FROM 
    identity_registry
GROUP BY 
    normalized_wallet
HAVING 
    COUNT(*) > 1;

-- Log the duplicates for reference
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count FROM duplicate_identities;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % wallet addresses with duplicate entries', duplicate_count;
    ELSE
        RAISE NOTICE 'No duplicate wallet addresses found';
    END IF;
END $$;

-- Update any references to the duplicate IDs in vehicle_profiles
UPDATE vehicle_profiles vp
SET identity_id = di.keep_id
FROM duplicate_identities di, unnest(di.all_ids) as duplicate_id
WHERE vp.identity_id = duplicate_id
AND vp.identity_id != di.keep_id;

-- Delete the duplicate entries, keeping only the oldest one for each wallet
DELETE FROM identity_registry ir
USING duplicate_identities di, unnest(di.all_ids) as duplicate_id
WHERE ir.id = duplicate_id
AND ir.id != di.keep_id;

-- Add a unique constraint to prevent future duplicates
-- First check if the constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'identity_registry_normalized_wallet_key' 
        AND table_name = 'identity_registry'
    ) THEN
        ALTER TABLE identity_registry ADD CONSTRAINT identity_registry_normalized_wallet_key UNIQUE (normalized_wallet);
        RAISE NOTICE 'Added UNIQUE constraint on normalized_wallet column';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists on normalized_wallet column';
    END IF;
END $$;

-- Commit all changes if everything succeeded
COMMIT;